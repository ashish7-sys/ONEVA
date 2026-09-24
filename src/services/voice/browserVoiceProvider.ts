/**
 * ONEVA Phase 10: Browser Voice Recognition Provider
 * Uses Web Speech API (webkitSpeechRecognition / SpeechRecognition) with permission checks
 * and continuous auto-restart while listening mode is enabled.
 */

import {
  VoiceRecognitionProvider,
  VoiceRecognitionResult,
  VoiceRecognitionError,
  VoiceProviderState,
  VoiceListenOptions,
} from '../../types/jarvisVoice';

// Extend window for Web Speech API types
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
  }
}

export class BrowserVoiceRecognitionProvider implements VoiceRecognitionProvider {
  readonly id = 'browser_web_speech';
  readonly name = 'Browser Web Speech API';

  private recognition: SpeechRecognitionInstance | null = null;
  private isListeningActive = false;
  private shouldRestart = false;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;

  private resultCallbacks: Set<(result: VoiceRecognitionResult) => void> = new Set();
  private errorCallbacks: Set<(error: VoiceRecognitionError) => void> = new Set();
  private stateCallbacks: Set<(state: VoiceProviderState) => void> = new Set();
  private currentState: VoiceProviderState = 'idle';

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;
    // Check if getUserMedia is at least available for mic capture
    return Boolean(navigator?.mediaDevices?.getUserMedia);
  }

  async checkPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
    if (typeof window === 'undefined') return 'unsupported';
    if (!navigator?.permissions?.query) {
      return this.isSupported() ? 'prompt' : 'unsupported';
    }

    try {
      // TypeScript lib doesn't always have 'microphone' in PermissionName, cast as any
      const status = await navigator.permissions.query({ name: 'microphone' as unknown as PermissionName });
      return status.state;
    } catch {
      return 'prompt';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      // Release tracks immediately - we do NOT keep raw mic recording open or send audio anywhere
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err: unknown) {
      const errorObj = err as { name?: string };
      if (errorObj?.name === 'NotAllowedError' || errorObj?.name === 'PermissionDeniedError') {
        this.emitError({
          code: 'permission_denied',
          message: 'Microphone permission was denied by the user.',
        });
      }
      return false;
    }
  }

  private setState(state: VoiceProviderState): void {
    this.currentState = state;
    this.stateCallbacks.forEach((cb) => cb(state));
  }

  private emitError(error: VoiceRecognitionError): void {
    this.setState('error');
    this.errorCallbacks.forEach((cb) => cb(error));
  }

  async startListening(options?: VoiceListenOptions): Promise<void> {
    if (!this.isSupported()) {
      this.emitError({
        code: 'not_supported',
        message: 'Speech recognition is not supported in this browser.',
      });
      return;
    }

    if (this.isListeningActive) {
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = options?.continuous ?? true;
      this.recognition.interimResults = options?.interimResults ?? false;
      this.recognition.lang = options?.language || 'en-US';

      this.isListeningActive = true;
      this.shouldRestart = true;

      this.recognition.onstart = () => {
        this.setState('listening');
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcript = res[0].transcript;
          const confidence = res[0].confidence;
          const isFinal = res.isFinal;

          const voiceResult: VoiceRecognitionResult = {
            transcript,
            confidence,
            language: this.recognition?.lang,
            isFinal,
            timestamp: Date.now(),
          };

          this.resultCallbacks.forEach((cb) => cb(voiceResult));
        }
      };

      this.recognition.onerror = (event: { error: string; message?: string }) => {
        const errType = event.error;

        if (errType === 'not-allowed') {
          this.shouldRestart = false;
          this.emitError({
            code: 'permission_denied',
            message: 'Microphone access denied. Grant permission to use voice commands.',
          });
        } else if (errType === 'no-speech') {
          // Normal timeout when nobody is speaking; don't treat as fatal error, allow auto-restart
        } else if (errType === 'network') {
          this.emitError({
            code: 'network_error',
            message: 'Speech recognition network error. Ensure internet connection is available.',
          });
        } else if (errType === 'aborted') {
          // Intentionally stopped
        } else {
          this.emitError({
            code: 'unknown',
            message: `Speech error: ${event.error}`,
          });
        }
      };

      this.recognition.onend = () => {
        // If listening mode is still supposed to be active, restart safely with delay
        if (this.shouldRestart && this.isListeningActive) {
          this.restartTimeout = setTimeout(() => {
            if (this.isListeningActive && this.shouldRestart) {
              try {
                this.recognition?.start();
              } catch {
                // Ignore already-started errors
              }
            }
          }, 300);
        } else {
          this.isListeningActive = false;
          this.setState('idle');
        }
      };

      this.recognition.start();
    } catch (err: unknown) {
      this.isListeningActive = false;
      this.emitError({
        code: 'unknown',
        message: 'Could not initialize speech recognition.',
        details: err,
      });
    }
  }

  async stopListening(): Promise<void> {
    this.shouldRestart = false;
    this.isListeningActive = false;

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }

    this.setState('idle');
  }

  onResult(callback: (result: VoiceRecognitionResult) => void): () => void {
    this.resultCallbacks.add(callback);
    return () => this.resultCallbacks.delete(callback);
  }

  onError(callback: (error: VoiceRecognitionError) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  onStateChange(callback: (state: VoiceProviderState) => void): () => void {
    this.stateCallbacks.add(callback);
    return () => this.stateCallbacks.delete(callback);
  }
}
