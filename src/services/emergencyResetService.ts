/**
 * ONEVA Emergency Global Reset Service
 * 
 * Hardware sequence: BOTH Volume Up + Volume Down held simultaneously + 5 consecutive screen taps
 * 
 * Mandates:
 * - Accidental normal taps do NOT trigger it
 * - One volume key only does NOT trigger it
 * - Releasing either volume key cancels sequence immediately
 * - Incomplete sequence (timeout > 3000ms between taps) resets safely
 * - Emergency-disabled state persists across reboots (localStorage + SharedPreferences)
 * - Customization overlays, live wallpapers, and heavy listeners are safely disabled
 * - User personal data (name, favorites, mappings) is NOT deleted
 */

import { ThemeEngineService } from './themeEngineService';
import { WallpaperService } from './wallpaperService';
import { JarvisVoiceService } from './jarvisVoiceService';
import { JarvisTtsEngine } from './voice/jarvisTtsEngine';
import { UserCustomizationService } from './userCustomizationService';

const EMERGENCY_STORAGE_KEY = 'oneva_emergency_reset_active_v1';

export interface EmergencyResetState {
  isEmergencyActive: boolean;
  activatedAt: number | null;
  reason: string | null;
}

export class EmergencyResetService {
  private static isEmergencyActive: boolean = false;
  private static activatedAt: number | null = null;
  private static isVolumeUpHeld: boolean = false;
  private static isVolumeDownHeld: boolean = false;
  private static tapCount: number = 0;
  private static lastTapTime: number = 0;
  private static tapResetTimer: ReturnType<typeof setTimeout> | null = null;
  private static listeners: Set<(state: EmergencyResetState) => void> = new Set();
  private static isInitialized = false;

  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Load persisted emergency state
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(EMERGENCY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.isEmergencyActive = !!parsed.isEmergencyActive;
          this.activatedAt = parsed.activatedAt || null;
        }
      } catch (e) {
        console.warn('[EmergencyResetService] Parse error:', e);
      }
    }

    // Attach global window listeners for web / WebView key and touch detection
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown, { passive: false });
      window.addEventListener('keyup', this.handleKeyUp, { passive: true });
      window.addEventListener('touchstart', this.handleScreenTouch, { passive: true });
      window.addEventListener('mousedown', this.handleScreenTouch, { passive: true });

      // Listen for native Android bridge events
      window.addEventListener('oneva-emergency-reset-native', () => {
        this.executeEmergencyReset('Android Hardware Emergency Trigger');
      });
    }
  }

  private static handleKeyDown = (e: KeyboardEvent): void => {
    // Android hardware volume keycodes or standard keys
    if (e.key === 'AudioVolumeUp' || e.code === 'VolumeUp' || e.key === 'VolumeUp') {
      this.isVolumeUpHeld = true;
    } else if (e.key === 'AudioVolumeDown' || e.code === 'VolumeDown' || e.key === 'VolumeDown') {
      this.isVolumeDownHeld = true;
    }
  };

  private static handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'AudioVolumeUp' || e.code === 'VolumeUp' || e.key === 'VolumeUp') {
      this.isVolumeUpHeld = false;
      this.resetTapSequence('Volume Up released');
    } else if (e.key === 'AudioVolumeDown' || e.code === 'VolumeDown' || e.key === 'VolumeDown') {
      this.isVolumeDownHeld = false;
      this.resetTapSequence('Volume Down released');
    }
  };

  private static handleScreenTouch = (): void => {
    // BOTH Volume keys MUST be held simultaneously
    if (!this.isVolumeUpHeld || !this.isVolumeDownHeld) {
      return;
    }

    const now = Date.now();

    // If more than 3000ms elapsed since last tap, reset count to 1
    if (this.tapCount > 0 && now - this.lastTapTime > 3000) {
      this.tapCount = 1;
    } else {
      this.tapCount += 1;
    }

    this.lastTapTime = now;

    // Reset sequence timer
    if (this.tapResetTimer) {
      clearTimeout(this.tapResetTimer);
    }
    this.tapResetTimer = setTimeout(() => {
      this.resetTapSequence('Sequence timeout (>3s)');
    }, 3000);

    // EXACT CONDITION: 5 consecutive screen taps while both volume buttons are held
    if (this.tapCount >= 5) {
      this.resetTapSequence('Threshold reached');
      this.executeEmergencyReset('Hardware Volume Up + Volume Down + 5 Screen Taps');
    }
  };

  private static resetTapSequence(reason?: string): void {
    this.tapCount = 0;
    if (this.tapResetTimer) {
      clearTimeout(this.tapResetTimer);
      this.tapResetTimer = null;
    }
  }

  /**
   * Executes the full emergency reset safely
   */
  static executeEmergencyReset(reason: string): void {
    console.warn(`[EmergencyResetService] EMERGENCY RESET TRIGGERED: ${reason}`);

    this.isEmergencyActive = true;
    this.activatedAt = Date.now();

    // 1. Immediately halt all active voice/TTS output
    try {
      JarvisTtsEngine.cancel();
      JarvisVoiceService.interrupt();
    } catch (e) {
      console.warn('[EmergencyResetService] Voice cancel error:', e);
    }

    // 2. Disable custom themes and revert to clean OLED default
    try {
      ThemeEngineService.applyTheme('theme-b'); // stock clean OLED black
    } catch (e) {
      console.warn('[EmergencyResetService] Theme revert error:', e);
    }

    // 3. Reset wallpaper overlay to standard clean dark
    try {
      WallpaperService.applyWallpaper({ presetId: 'deep-space', name: 'Safe Mode Wallpaper' });
    } catch (e) {
      console.warn('[EmergencyResetService] Wallpaper revert error:', e);
    }

    // 4. Persist emergency status so app boots in Safe Mode
    this.persist();

    // 5. Notify native bridge if on Android
    if (typeof window !== 'undefined' && (window as any).OnevaNativeBridge?.setEmergencySafeMode) {
      try {
        (window as any).OnevaNativeBridge.setEmergencySafeMode(true);
      } catch (e) {
        console.warn('[EmergencyResetService] Native bridge safe mode error:', e);
      }
    }

    this.notify();
  }

  /**
   * User can explicitly dismiss Safe Mode and re-enable features
   */
  static exitEmergencySafeMode(): void {
    this.isEmergencyActive = false;
    this.activatedAt = null;
    this.persist();

    if (typeof window !== 'undefined' && (window as any).OnevaNativeBridge?.setEmergencySafeMode) {
      try {
        (window as any).OnevaNativeBridge.setEmergencySafeMode(false);
      } catch (e) {
        console.warn('[EmergencyResetService] Native bridge safe mode clear error:', e);
      }
    }

    this.notify();
  }

  static isSafeModeActive(): boolean {
    this.init();
    return this.isEmergencyActive;
  }

  static getState(): EmergencyResetState {
    this.init();
    return {
      isEmergencyActive: this.isEmergencyActive,
      activatedAt: this.activatedAt,
      reason: this.isEmergencyActive ? 'Volume combo + 5 taps emergency trigger' : null,
    };
  }

  private static persist(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        EMERGENCY_STORAGE_KEY,
        JSON.stringify({
          isEmergencyActive: this.isEmergencyActive,
          activatedAt: this.activatedAt,
        })
      );
    } catch (e) {
      console.warn('[EmergencyResetService] Failed to persist:', e);
    }
  }

  static subscribe(listener: (state: EmergencyResetState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    const s = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(s);
      } catch (e) {
        console.error('[EmergencyResetService] Listener error:', e);
      }
    });
  }
}
