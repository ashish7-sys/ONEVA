/**
 * ONEVA JARVIS Screen-Off & Background Wake Manager
 * 
 * Coordinates true Android Native Foreground Service, low-power WakeLocks,
 * Battery Optimization bypasses (Doze mode), and Web Audio Screen-Off wake loops.
 */

import { PlatformBridge } from '../launcher/services/platformBridge';
import { AudioEffects } from './voice/audioSoundEffects';
import { JarvisVoiceService } from './jarvisVoiceService';

export interface BackgroundWakeStatus {
  isSupported: boolean;
  isNativeServiceRunning: boolean;
  isIgnoringBatteryOptimizations: boolean;
  isScreenOffWakeEnabled: boolean;
  isLockScreenSimulated: boolean;
  wakeLockActive: boolean;
}

class OnevaBackgroundWakeManager {
  private wakeLockSentinel: unknown = null;
  private isSimulatedLockScreenActive = false;
  private listeners: Set<() => void> = new Set();
  private isInitialized = false;

  init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Listen to native Android or simulator background wake events
    if (typeof window !== 'undefined') {
      window.addEventListener('oneva-background-wake-detected', ((e: CustomEvent<{ wakeName: string; isScreenOff?: boolean }>) => {
        const wakeName = e.detail?.wakeName || 'Jarvis';
        this.handleBackgroundWakeTrigger(wakeName);
      }) as EventListener);
    }

    // Auto-engage foreground service if native android & enabled in settings
    const settings = JarvisVoiceService.getSettings();
    if (settings.screenOffWakeEnabled && PlatformBridge.isNativeAndroid()) {
      this.startForegroundService();
    }
  }

  getStatus(): BackgroundWakeStatus {
    const settings = JarvisVoiceService.getSettings();
    const isNative = PlatformBridge.isNativeAndroid();

    return {
      isSupported: isNative ? true : true, // Supported via native foreground service or Web WakeLock
      isNativeServiceRunning: isNative ? PlatformBridge.isForegroundWakeServiceRunning() : false,
      isIgnoringBatteryOptimizations: isNative ? PlatformBridge.isIgnoringBatteryOptimizations() : true,
      isScreenOffWakeEnabled: settings.screenOffWakeEnabled ?? true,
      isLockScreenSimulated: this.isSimulatedLockScreenActive,
      wakeLockActive: Boolean(this.wakeLockSentinel),
    };
  }

  /**
   * Starts the Android Foreground Service or requests Web WakeLock
   */
  async startForegroundService(): Promise<boolean> {
    const settings = JarvisVoiceService.getSettings();

    // 1. Native Android path
    if (PlatformBridge.isNativeAndroid()) {
      const started = PlatformBridge.startForegroundWakeService();
      this.notify();
      return started;
    }

    // 2. Web / Browser Screen Wake Lock API path
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        const nav = navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } };
        this.wakeLockSentinel = await nav.wakeLock.request('screen');
      } catch {
        // WakeLock request not allowed or backgrounded
      }
    }

    JarvisVoiceService.saveSettings({ screenOffWakeEnabled: true });
    this.notify();
    return true;
  }

  /**
   * Stops the Android Foreground Service and releases WakeLock
   */
  async stopForegroundService(): Promise<boolean> {
    if (PlatformBridge.isNativeAndroid()) {
      PlatformBridge.stopForegroundWakeService();
    }

    if (this.wakeLockSentinel && typeof (this.wakeLockSentinel as { release: () => Promise<void> }).release === 'function') {
      try {
        await (this.wakeLockSentinel as { release: () => Promise<void> }).release();
      } catch {
        // Ignore
      }
      this.wakeLockSentinel = null;
    }

    JarvisVoiceService.saveSettings({ screenOffWakeEnabled: false });
    this.notify();
    return true;
  }

  /**
   * Direct trigger when wake word is detected while phone was locked or screen was off
   */
  handleBackgroundWakeTrigger(wakeName: string = 'Jarvis'): void {
    const settings = JarvisVoiceService.getSettings();

    // 1. Acoustic chime
    if (settings.audioChimeOnWake ?? true) {
      AudioEffects.playJarvisWakeChime();
    }

    // 2. Haptic vibration pulse
    if (settings.hapticFeedbackOnWake ?? true) {
      AudioEffects.triggerHapticPulse([80, 50, 120]);
    }

    // 3. Screen display turn on
    if (settings.screenWakeOnDetection ?? true) {
      PlatformBridge.wakeScreenNow();
    }

    // 4. Dismiss lockscreen simulation if open
    if (this.isSimulatedLockScreenActive) {
      this.isSimulatedLockScreenActive = false;
    }

    // 5. Wake Jarvis voice engine to LISTENING_FOR_COMMAND
    JarvisVoiceService.wakeFromBackground(wakeName);
    this.notify();
  }

  /**
   * Requests Android system to exempt ONEVA from Doze battery optimizations
   */
  requestBatteryOptimizationBypass(): void {
    PlatformBridge.requestIgnoreBatteryOptimizations();
  }

  /**
   * Lock screen simulation controls
   */
  setLockScreenSimulated(active: boolean): void {
    this.isSimulatedLockScreenActive = active;
    if (active) {
      // Ensure wake engine is in active listening state
      const state = JarvisVoiceService.getState();
      if (state === 'SLEEPING') {
        JarvisVoiceService.startWakeListening();
      }
    }
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const BackgroundWakeManager = new OnevaBackgroundWakeManager();
