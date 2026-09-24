/**
 * ONEVA Phase 10: Android Native Voice Recognition Provider
 * Connects to Android Native Bridge (WebView JavascriptInterface) when running inside
 * the native ONEVA Android container.
 * Also reports genuine Android background / screen-off capability status.
 */

import {
  VoiceRecognitionProvider,
  VoiceRecognitionResult,
  VoiceRecognitionError,
  VoiceProviderState,
  VoiceListenOptions,
} from '../../types/jarvisVoice';

export interface NativeVoiceBridgeTarget {
  isAvailable?: () => boolean;
  startVoiceListening?: (language: string) => boolean;
  startVoiceRecognition?: (language: string) => boolean;
  stopVoiceListening?: () => boolean;
  stopVoiceRecognition?: () => boolean;
  hasMicrophonePermission?: () => boolean;
  requestMicrophonePermission?: () => void;
  isScreenOffWakeSupported?: () => boolean;
  startForegroundWakeService?: () => boolean;
  stopForegroundWakeService?: () => boolean;
}

declare global {
  interface Window {
    OnevaNativeVoiceBridge?: NativeVoiceBridgeTarget;
    // Global callback from Android native layer
    onOnevaNativeVoiceResult?: (transcript: string, isFinal: boolean, confidence: number) => void;
    onOnevaNativeVoiceError?: (errorCode: string, errorMessage: string) => void;
  }
}

export class AndroidNativeVoiceRecognitionProvider implements VoiceRecognitionProvider {
  readonly id = 'android_native_voice';
  readonly name = 'Android Native SpeechRecognizer';

  private resultCallbacks: Set<(result: VoiceRecognitionResult) => void> = new Set();
  private errorCallbacks: Set<(error: VoiceRecognitionError) => void> = new Set();
  private stateCallbacks: Set<(state: VoiceProviderState) => void> = new Set();
  private currentState: VoiceProviderState = 'idle';

  constructor() {
    this.setupGlobalNativeCallbacks();
  }

  private setupGlobalNativeCallbacks(): void {
    if (typeof window === 'undefined') return;

    window.onOnevaNativeVoiceResult = (transcript: string, isFinal: boolean, confidence: number) => {
      const result: VoiceRecognitionResult = {
        transcript,
        isFinal,
        confidence,
        timestamp: Date.now(),
      };
      this.resultCallbacks.forEach((cb) => cb(result));
    };

    window.onOnevaNativeVoiceError = (errorCode: string, errorMessage: string) => {
      this.setState('error');
      this.errorCallbacks.forEach((cb) =>
        cb({
          code: errorCode === 'permission' ? 'permission_denied' : 'unknown',
          message: errorMessage || 'Native voice error',
        })
      );
    };
  }

  private getBridge(): NativeVoiceBridgeTarget | null {
    if (typeof window === 'undefined') return null;
    return (window.OnevaNativeVoiceBridge || (window.OnevaNativeBridge as unknown as NativeVoiceBridgeTarget)) || null;
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.OnevaNativeVoiceBridge || window.OnevaNativeBridge?.startVoiceRecognition);
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const bridge = this.getBridge();
    return bridge?.isAvailable?.() ?? true;
  }

  /**
   * Genuine capability check for Android Screen-off / Background listening.
   * Requires Android Foreground Service with FOREGROUND_SERVICE_TYPE_MICROPHONE.
   */
  static isScreenOffWakeSupported(): boolean {
    if (typeof window === 'undefined') return false;
    if (window.OnevaNativeVoiceBridge?.isScreenOffWakeSupported) {
      return window.OnevaNativeVoiceBridge.isScreenOffWakeSupported();
    }
    if (window.OnevaNativeBridge?.isScreenOffWakeSupported) {
      return window.OnevaNativeBridge.isScreenOffWakeSupported();
    }
    return false;
  }

  async checkPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    const bridge = this.getBridge();
    if (bridge?.hasMicrophonePermission) {
      return bridge.hasMicrophonePermission() ? 'granted' : 'prompt';
    }
    return 'prompt';
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const bridge = this.getBridge();
    if (bridge?.requestMicrophonePermission) {
      bridge.requestMicrophonePermission();
      return true;
    }
    return false;
  }

  private setState(state: VoiceProviderState): void {
    this.currentState = state;
    this.stateCallbacks.forEach((cb) => cb(state));
  }

  async startListening(options?: VoiceListenOptions): Promise<void> {
    if (!this.isSupported()) {
      this.setState('error');
      this.errorCallbacks.forEach((cb) =>
        cb({
          code: 'not_supported',
          message: 'Android Native Voice Bridge is not attached to this process.',
        })
      );
      return;
    }

    const lang = options?.language || 'en-US';
    const bridge = this.getBridge();
    const started = bridge?.startVoiceListening ? bridge.startVoiceListening(lang) : (bridge?.startVoiceRecognition ? bridge.startVoiceRecognition(lang) : false);
    if (started) {
      this.setState('listening');
    } else {
      this.setState('error');
      this.errorCallbacks.forEach((cb) =>
        cb({
          code: 'unknown',
          message: 'Failed to start Android Native SpeechRecognizer service.',
        })
      );
    }
  }

  async stopListening(): Promise<void> {
    if (this.isSupported()) {
      const bridge = this.getBridge();
      if (bridge?.stopVoiceListening) {
        bridge.stopVoiceListening();
      } else if (bridge?.stopVoiceRecognition) {
        bridge.stopVoiceRecognition();
      }
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
