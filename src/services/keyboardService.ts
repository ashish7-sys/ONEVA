export interface KeyboardTheme {
  id: string;
  name: string;
  description: string;
  keyBg: string;
  boardBg: string;
  accentColor: string;
  textColor: string;
  isOled: boolean;
}

export type KeyboardAnimationType = 'ripple' | 'elevation' | 'neon_glow' | 'minimal_press';

export interface KeyboardSettings {
  isEnabled: boolean;
  activeThemeId: string;
  animationType: KeyboardAnimationType;
  hapticFeedback: boolean;
  hapticIntensity: 'subtle' | 'medium' | 'firm';
  localizedPrediction: boolean;
  zeroCloudKeystrokeGuarantee: boolean;
  perAppThemes: Record<string, string>; // packageName -> themeId
  customBackgroundUrl?: string;
  customBackgroundOpacity?: number;
  customBackgroundBlur?: number;
}

const STORAGE_KEY = 'oneva_keyboard_settings';

export const KEYBOARD_THEMES: KeyboardTheme[] = [
  {
    id: 'oled-mono',
    name: 'OLED Monolith',
    description: 'Pitch black #000000 background with high-contrast sharp white keycaps',
    boardBg: '#000000',
    keyBg: '#121215',
    accentColor: '#10b981',
    textColor: '#ffffff',
    isOled: true,
  },
  {
    id: 'emerald-tactical',
    name: 'Emerald Tactical',
    description: 'Deep carbon neutral with subtle neon emerald glyph accents',
    boardBg: '#090d0b',
    keyBg: '#131c17',
    accentColor: '#10b981',
    textColor: '#e6f7ef',
    isOled: false,
  },
  {
    id: 'obsidian-nebula',
    name: 'Obsidian Nebula',
    description: 'Midnight blue-slate with soft cyan luminescence',
    boardBg: '#0b0f19',
    keyBg: '#161f30',
    accentColor: '#38bdf8',
    textColor: '#f0f9ff',
    isOled: false,
  },
  {
    id: 'titanium-dark',
    name: 'Titanium Slate',
    description: 'Industrial matte graphite with silver-white typographic clarity',
    boardBg: '#121316',
    keyBg: '#1e2025',
    accentColor: '#94a3b8',
    textColor: '#f8fafc',
    isOled: false,
  },
];

const DEFAULT_KEYBOARD_SETTINGS: KeyboardSettings = {
  isEnabled: true,
  activeThemeId: 'oled-mono',
  animationType: 'elevation',
  hapticFeedback: true,
  hapticIntensity: 'subtle',
  localizedPrediction: true,
  zeroCloudKeystrokeGuarantee: true,
  perAppThemes: {},
};

export class KeyboardService {
  private static settings: KeyboardSettings | null = null;
  private static listeners: Set<() => void> = new Set();

  static getSettings(): KeyboardSettings {
    if (this.settings) return this.settings;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.settings = { ...DEFAULT_KEYBOARD_SETTINGS, ...JSON.parse(raw) };
          return this.settings;
        }
      } catch (err) {
        console.warn('[KeyboardService] Failed to load settings:', err);
      }
    }

    this.settings = { ...DEFAULT_KEYBOARD_SETTINGS };
    return this.settings;
  }

  static saveSettings(updates: Partial<KeyboardSettings>): void {
    const current = this.getSettings();
    this.settings = { ...current, ...updates };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      } catch (err) {
        console.warn('[KeyboardService] Failed to save settings:', err);
      }
    }

    this.notify();
  }

  static getThemes(): KeyboardTheme[] {
    return KEYBOARD_THEMES;
  }

  static getActiveTheme(): KeyboardTheme {
    const s = this.getSettings();
    return KEYBOARD_THEMES.find((t) => t.id === s.activeThemeId) || KEYBOARD_THEMES[0];
  }

  static getThemeForApp(packageName: string): KeyboardTheme {
    const s = this.getSettings();
    const customThemeId = s.perAppThemes[packageName];
    if (customThemeId) {
      const theme = KEYBOARD_THEMES.find((t) => t.id === customThemeId);
      if (theme) return theme;
    }
    return this.getActiveTheme();
  }

  static setAppTheme(packageName: string, themeId: string | null): void {
    const s = this.getSettings();
    const perAppThemes = { ...s.perAppThemes };
    if (themeId) {
      perAppThemes[packageName] = themeId;
    } else {
      delete perAppThemes[packageName];
    }
    this.saveSettings({ perAppThemes });
  }

  static setCustomBackground(backgroundUrl: string | undefined, opacity: number = 0.85, blur: number = 0): void {
    this.saveSettings({
      customBackgroundUrl: backgroundUrl,
      customBackgroundOpacity: opacity,
      customBackgroundBlur: blur,
    });
    
    // Sync with native Android InputMethodService
    const active = this.getActiveTheme();
    try {
      if (typeof window !== 'undefined' && (window as unknown as { OnevaNativeBridge?: { setKeyboardTheme: (t: unknown) => void } }).OnevaNativeBridge?.setKeyboardTheme) {
        (window as unknown as { OnevaNativeBridge: { setKeyboardTheme: (t: unknown) => void } }).OnevaNativeBridge.setKeyboardTheme({
          themeId: active.id,
          boardBg: active.boardBg,
          keyBg: active.keyBg,
          textColor: active.textColor,
          accentColor: active.accentColor,
          customBackgroundUrl: backgroundUrl,
          customBackgroundOpacity: opacity,
          customBackgroundBlur: blur,
        });
      }
    } catch (e) {
      console.warn('Native IME sync fallback:', e);
    }
  }

  static applyDefaultKeyboard(payload: { themeId?: string; animationType?: KeyboardAnimationType; backgroundUrl?: string }): { success: boolean; message: string } {
    const themeId = payload.themeId || 'oled-mono';
    const animationType = payload.animationType || 'elevation';
    this.saveSettings({
      activeThemeId: themeId,
      animationType,
      ...(payload.backgroundUrl ? { customBackgroundUrl: payload.backgroundUrl } : {}),
    });
    const theme = KEYBOARD_THEMES.find((t) => t.id === themeId) || KEYBOARD_THEMES[0];
    return {
      success: true,
      message: `Keyboard set to "${theme.name}" with ${animationType} animation.`,
    };
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
