/**
 * ONEVA Architecture: Centralized Jarvis Speech & TTS Queue Manager
 * 
 * Single source of truth for:
 * - Speaking state
 * - Current TTS request & utterance
 * - Speech queue with prioritization
 * - Immediate hard cancellation ("Chup raho", "Stop", "Silence")
 * - Real-time audio intensity (0.0 to 1.0) with dynamic cadence modulation
 * - Reactive wallpaper synchronization
 */

import { JarvisTtsEngine } from './jarvisTtsEngine';
import { JarvisPersonalityEngine } from '../intelligence/jarvisPersonalityEngine';
import { JarvisVisualStateManager } from '../jarvis/jarvisVisualStateManager';

export interface JarvisSpeechRequest {
  id: string;
  text: string;
  spokenText?: string;
  language?: string;
  priority?: 'high' | 'normal' | 'low';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: string) => void;
  onInterrupted?: () => void;
}

export class JarvisSpeechManager {
  private static speechQueue: JarvisSpeechRequest[] = [];
  private static currentRequest: JarvisSpeechRequest | null = null;
  private static isCurrentlySpeaking = false;
  private static audioIntensity = 0.0;
  private static targetIntensity = 0.0;
  private static intensityTimer: number | null = null;
  private static speechStartListeners: Set<() => void> = new Set();
  private static speechEndListeners: Set<() => void> = new Set();
  private static speechCancelListeners: Set<() => void> = new Set();
  private static intensityListeners: Set<(intensity: number) => void> = new Set();

  /**
   * Enqueues or immediately plays a speech request.
   * High-priority requests abort and clear any pending speech.
   */
  static speak(request: JarvisSpeechRequest): void {
    if (!request.text && !request.spokenText) return;

    if (request.priority === 'high') {
      // Clear obsolete queue and cancel active speech immediately
      this.clearSpeechQueue();
      this.cancelCurrentSpeech();
    }

    if (this.isCurrentlySpeaking) {
      if (request.priority === 'high') {
        // High priority preempts current speech
        this.currentRequest = request;
        this.executeSpeech(request);
      } else {
        this.speechQueue.push(request);
      }
    } else {
      this.currentRequest = request;
      this.executeSpeech(request);
    }
  }

  /**
   * Internal execution of speech via JarvisTtsEngine with intensity tracking
   */
  private static executeSpeech(req: JarvisSpeechRequest): void {
    const prefs = JarvisPersonalityEngine.getPreferences();
    if (!prefs.voiceEnabled) {
      req.onStart?.();
      req.onEnd?.();
      this.processNextInQueue();
      return;
    }

    this.isCurrentlySpeaking = true;
    this.startIntensityModulation();
    this.speechStartListeners.forEach((fn) => {
      try { fn(); } catch (e) { console.warn(e); }
    });

    const res = JarvisTtsEngine.speak({
      id: req.id,
      text: req.text,
      spokenText: req.spokenText || req.text,
      language: req.language || (prefs.language === 'hi' ? 'hi-IN' : 'en-US'),
      gender: prefs.voiceGender || 'male',
      voiceURI: prefs.selectedVoiceURI,
      rate: prefs.speechRate || 0.9,
      pitch: prefs.speechPitch || 0.88,
      onStart: () => {
        this.isCurrentlySpeaking = true;
        this.targetIntensity = 0.85;
        req.onStart?.();
      },
      onEnd: () => {
        this.handleSpeechComplete(req);
      },
      onError: (err) => {
        console.warn('[JarvisSpeechManager] TTS Error:', err);
        req.onError?.(err);
        this.handleSpeechComplete(req);
      },
      onInterrupted: () => {
        req.onInterrupted?.();
        this.handleSpeechComplete(req);
      },
    });

    if (!res.success) {
      this.handleSpeechComplete(req);
    }
  }

  /**
   * Called when speech finishes naturally
   */
  private static handleSpeechComplete(req: JarvisSpeechRequest): void {
    req.onEnd?.();
    this.speechEndListeners.forEach((fn) => {
      try { fn(); } catch (e) { console.warn(e); }
    });

    this.isCurrentlySpeaking = false;
    this.targetIntensity = 0.0;
    this.currentRequest = null;

    // Settle intensity smoothly
    setTimeout(() => {
      this.stopIntensityModulation();
      this.processNextInQueue();
    }, 200);
  }

  /**
   * Processes the next item in the speech queue if present
   */
  private static processNextInQueue(): void {
    if (this.speechQueue.length > 0 && !this.isCurrentlySpeaking) {
      const next = this.speechQueue.shift();
      if (next) {
        this.currentRequest = next;
        this.executeSpeech(next);
      }
    }
  }

  /**
   * IMMEDIATELY STOPS ALL SPEECH, clears queue, sets intensity to 0,
   * and notifies listeners ("Chup raho" / "Stop" / "Silence")
   */
  static stopSpeaking(): void {
    this.clearSpeechQueue();
    this.cancelCurrentSpeech();
  }

  /**
   * Hard cancellation of the current active speech
   */
  static cancelCurrentSpeech(): void {
    this.isCurrentlySpeaking = false;
    this.currentRequest = null;
    this.targetIntensity = 0.0;
    this.audioIntensity = 0.0;
    this.stopIntensityModulation();

    // Call underlying browser/native synthesis cancel
    JarvisTtsEngine.cancel();

    // Notify listeners
    this.intensityListeners.forEach((fn) => {
      try { fn(0.0); } catch (e) { console.warn(e); }
    });

    this.speechCancelListeners.forEach((fn) => {
      try { fn(); } catch (e) { console.warn(e); }
    });
  }

  /**
   * Clears any queued spoken responses waiting to play
   */
  static clearSpeechQueue(): void {
    this.speechQueue = [];
  }

  /**
   * Check if Jarvis is currently speaking
   */
  static isSpeaking(): boolean {
    return this.isCurrentlySpeaking || JarvisTtsEngine.getIsSpeaking();
  }

  /**
   * Current speech audio intensity (0.0 to 1.0)
   */
  static getAudioIntensity(): number {
    return this.audioIntensity;
  }

  /**
   * Real-time audio intensity modulation loop while speaking
   * Simulates realistic vocal waveform envelope, syllable bursts, and pauses
   */
  private static startIntensityModulation(): void {
    if (typeof window === 'undefined') return;
    if (this.intensityTimer !== null) return;

    let step = 0;
    this.intensityTimer = window.setInterval(() => {
      if (!this.isCurrentlySpeaking) {
        this.audioIntensity = Math.max(0, this.audioIntensity - 0.15);
        this.notifyIntensity();
        if (this.audioIntensity <= 0.001) {
          this.stopIntensityModulation();
        }
        return;
      }

      step += 0.25;
      // Multi-frequency harmonic modulation mimicking vocal acoustics
      const wave = Math.sin(step) * 0.35 + Math.sin(step * 2.3) * 0.25 + Math.sin(step * 4.7) * 0.15;
      const naturalIntensity = Math.max(0.2, Math.min(1.0, 0.55 + wave * 0.45));

      // Inertial smoothing
      this.audioIntensity += (naturalIntensity - this.audioIntensity) * 0.35;
      this.notifyIntensity();
    }, 40);
  }

  private static stopIntensityModulation(): void {
    if (this.intensityTimer !== null) {
      clearInterval(this.intensityTimer);
      this.intensityTimer = null;
    }
    this.audioIntensity = 0.0;
    this.notifyIntensity();
  }

  private static notifyIntensity(): void {
    const val = this.audioIntensity;
    this.intensityListeners.forEach((fn) => {
      try { fn(val); } catch (e) { console.warn(e); }
    });
  }

  // ==========================================
  // Event Subscriptions
  // ==========================================

  static onSpeechStarted(listener: () => void): () => void {
    this.speechStartListeners.add(listener);
    return () => this.speechStartListeners.delete(listener);
  }

  static onSpeechFinished(listener: () => void): () => void {
    this.speechEndListeners.add(listener);
    return () => this.speechEndListeners.delete(listener);
  }

  static onSpeechCancelled(listener: () => void): () => void {
    this.speechCancelListeners.add(listener);
    return () => this.speechCancelListeners.delete(listener);
  }

  static onSpeechIntensity(listener: (intensity: number) => void): () => void {
    this.intensityListeners.add(listener);
    return () => this.intensityListeners.delete(listener);
  }
}
