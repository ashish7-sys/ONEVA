/**
 * ONEVA JARVIS Global Background Wake Word Service
 * 
 * Runs continuously in the background across the entire device/launcher.
 * Allows the user to wake Jarvis by speaking "Jarvis" or "Hey Jarvis" from
 * ANYWHERE on the device without needing to open a specific menu or click any button.
 * 
 * Privacy-first: local keyword matching, zero cloud audio streaming.
 * Offline-first: state stored in localStorage; persists across restarts and offline mode.
 */

import { AudioEffects } from './audioSoundEffects';
import { AssistService } from '../assistService';
import { JarvisVoiceService } from '../jarvisVoiceService';
import { WakeNameDetectionService } from '../wakeNameDetectionService';
import { JarvisVisualStateManager } from '../jarvis/jarvisVisualStateManager';

export interface GlobalWakeStatus {
  isSupported: boolean;
  isActive: boolean;
  isListening: boolean;
  activeWakeWords: string[];
  lastDetectedWord: string | null;
  lastDetectedAt: number | null;
  permissionGranted: boolean;
}

const STORAGE_KEY = 'oneva_global_wake_enabled_v1';

export class JarvisGlobalWakeService {
  private static isInitialized = false;
  private static isEnabled = true;
  private static isListening = false;
  private static recognition: any = null;
  private static restartTimer: ReturnType<typeof setTimeout> | null = null;
  private static lastDetectedWord: string | null = null;
  private static lastDetectedAt: number | null = null;
  private static permissionGranted = false;
  private static listeners: Set<() => void> = new Set();

  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Read persistent setting (default: true for ambient companion experience)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          this.isEnabled = stored === 'true';
        } else {
          this.isEnabled = true;
          localStorage.setItem(STORAGE_KEY, 'true');
        }
      } catch {
        this.isEnabled = true;
      }
    }

    // Auto-start background wake listening if enabled
    if (this.isEnabled) {
      this.startListening();
    }

    // Listen to visibility changes (keep listening active or restart smoothly)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.isEnabled && !this.isListening) {
          this.startListening();
        }
      });
    }
  }

  static getStatus(): GlobalWakeStatus {
    const voiceSettings = JarvisVoiceService.getSettings();
    const wakeWords = [
      ...voiceSettings.enabledWakeNames,
      ...voiceSettings.customWakeNames,
    ];

    const hasSpeech =
      typeof window !== 'undefined' &&
      Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    return {
      isSupported: hasSpeech,
      isActive: this.isEnabled,
      isListening: this.isListening,
      activeWakeWords: wakeWords.length > 0 ? wakeWords : ['Jarvis', 'Hey Jarvis'],
      lastDetectedWord: this.lastDetectedWord,
      lastDetectedAt: this.lastDetectedAt,
      permissionGranted: this.permissionGranted,
    };
  }

  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
      } catch {
        // LocalStorage fallback
      }
    }

    if (enabled) {
      this.startListening();
    } else {
      this.stopListening();
    }
    this.notify();
  }

  static startListening(): void {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[JarvisGlobalWakeService] Web Speech Recognition not supported in this browser.');
      return;
    }

    if (this.isListening && this.recognition) {
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.permissionGranted = true;
        this.notify();
      };

      this.recognition.onresult = (event: any) => {
        this.handleRecognitionResult(event);
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          this.permissionGranted = false;
          this.isListening = false;
          this.notify();
          return;
        }
        // For transient errors like no-speech, auto-restart
        if (this.isEnabled) {
          this.scheduleRestart(1000);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.notify();
        // Keep listening in background as long as enabled
        if (this.isEnabled) {
          this.scheduleRestart(350);
        }
      };

      this.recognition.start();
    } catch (e) {
      console.warn('[JarvisGlobalWakeService] Could not start speech recognition:', e);
      if (this.isEnabled) {
        this.scheduleRestart(2500);
      }
    }
  }

  static stopListening(): void {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }

    this.isListening = false;
    this.notify();
  }

  private static scheduleRestart(delayMs: number): void {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
    }
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (this.isEnabled) {
        this.startListening();
      }
    }, delayMs);
  }

  private static handleRecognitionResult(event: any): void {
    if (!event.results) return;

    const voiceSettings = JarvisVoiceService.getSettings();
    const activeWakeWords = [
      ...voiceSettings.enabledWakeNames,
      ...voiceSettings.customWakeNames,
      'jarvis',
      'hey jarvis',
      'friday',
      'nova',
    ];

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0]?.transcript || '';
      if (!transcript) continue;

      const detection = WakeNameDetectionService.detectWakeName(
        transcript,
        activeWakeWords,
        JarvisVoiceService.isAwake()
      );

      if (detection.addressedToJarvis && detection.matchedWakeName) {
        this.triggerGlobalWake(detection.matchedWakeName, detection.remainingCommand);
        break;
      }
    }
  }

  /**
   * Called immediately when wake word is detected from ANY screen or background
   */
  static triggerGlobalWake(wakeWord: string = 'Jarvis', commandPart?: string): void {
    const now = Date.now();
    // Debounce triggers within 1.5 seconds
    if (this.lastDetectedAt && now - this.lastDetectedAt < 1500) {
      return;
    }

    this.lastDetectedWord = wakeWord;
    this.lastDetectedAt = now;

    // 1. Play Iconic Harmonic Wake Chime
    AudioEffects.playJarvisWakeChime();

    // 2. Haptic Feedback Pulse
    AudioEffects.triggerHapticPulse([60, 40, 80]);

    // 3. Immediately switch Live Wallpaper to JARVIS AWAKE MODE
    AssistService.setReactionState('command_detected');
    JarvisVisualStateManager.wakeUp(wakeWord);

    // 4. Wake up voice subsystem
    JarvisVoiceService.wakeFromBackground(wakeWord);

    // 5. Broadcast global wake event across window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('oneva-jarvis-global-wake', {
          detail: {
            wakeWord,
            timestamp: now,
            commandPart: commandPart || '',
          },
        })
      );
    }

    this.notify();
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('[JarvisGlobalWakeService] Listener error:', e);
      }
    });
  }
}
