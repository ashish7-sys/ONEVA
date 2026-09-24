import { LauncherSettings, WallpaperPreset, WallpaperPresetId } from '../types';

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'changeable-wallpaper',
    name: 'Dynamic Cybernetic (Changeable_wallpaper.mp4)',
    cssBackground: 'linear-gradient(180deg, #020617 0%, #0b1528 50%, #000000 100%)',
    accentColor: '#00f0ff',
    textColor: '#f8fafc',
  },
  {
    id: 'deep-onyx',
    name: 'Deep Onyx',
    cssBackground: 'linear-gradient(180deg, #09090b 0%, #0c0d12 50%, #070709 100%)',
    accentColor: '#10b981',
    textColor: '#f8fafc',
  },
  {
    id: 'obsidian-nebula',
    name: 'Obsidian Nebula',
    cssBackground: 'radial-gradient(ellipse at 80% 20%, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.9) 60%, #030712 100%)',
    accentColor: '#38bdf8',
    textColor: '#f8fafc',
  },
  {
    id: 'emerald-aurora',
    name: 'Emerald Aurora',
    cssBackground: 'radial-gradient(circle at 80% 10%, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.25) 45%, #050a08 100%)',
    accentColor: '#10b981',
    textColor: '#f8fafc',
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    cssBackground: 'linear-gradient(160deg, #0f172a 0%, #090d16 60%, #030508 100%)',
    accentColor: '#818cf8',
    textColor: '#f8fafc',
  },
  {
    id: 'true-black',
    name: 'OLED Pure Black',
    cssBackground: '#000000',
    accentColor: '#10b981',
    textColor: '#f8fafc',
  },
];

export const DEFAULT_LAUNCHER_SETTINGS: LauncherSettings = {
  gridRows: 5,
  gridCols: 4,
  wallpaperId: 'changeable-wallpaper',
  customWallpaperUrl: '/assets/jarvis/Changeable_wallpaper.mp4',
  iconShape: 'squircle',
  showClockWidget: true,
  showGreeting: true,
  dockAppIds: ['phone', 'messages', 'camera', 'browser'],
  homeScreenAppIds: [
    'gallery',
    'clock',
    'calendar',
    'calculator',
    'files',
    'notes',
    'music',
    'weather',
    'contacts',
    'settings',
  ],
  enableReducedMotion: false,
  activeThemeMode: 'dark',
};

const SETTINGS_KEY = 'oneva_launcher_settings_v2';

export class LauncherSettingsService {
  private static listeners: Set<(settings: LauncherSettings) => void> = new Set();
  private static cached: LauncherSettings | null = null;

  static getSettings(): LauncherSettings {
    if (this.cached) return this.cached;

    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.cached = { ...DEFAULT_LAUNCHER_SETTINGS, ...parsed };
          return this.cached!;
        }
      }
    } catch (e) {
      console.warn('[LauncherSettings] Fallback to defaults:', e);
    }

    this.cached = { ...DEFAULT_LAUNCHER_SETTINGS };
    return this.cached;
  }

  static updateSettings(partial: Partial<LauncherSettings>): LauncherSettings {
    const current = this.getSettings();
    const updated: LauncherSettings = { ...current, ...partial };
    this.cached = updated;

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('[LauncherSettings] Unable to persist settings:', e);
    }

    this.listeners.forEach((listener) => {
      try {
        listener(updated);
      } catch (err) {
        console.error('[LauncherSettings] Listener error:', err);
      }
    });

    return updated;
  }

  static subscribe(listener: (settings: LauncherSettings) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static getWallpaperPreset(id: WallpaperPresetId): WallpaperPreset {
    const settings = this.getSettings();
    if (settings.wallpaperId === 'gallery-custom' && settings.customWallpaperUrl) {
      return {
        id: 'gallery-custom',
        name: 'Personal Gallery Photo',
        cssBackground: `url("${settings.customWallpaperUrl}") center/cover no-repeat`,
        accentColor: '#10b981',
        textColor: '#f8fafc',
        isCustom: true,
      };
    }
    if (settings.wallpaperId === 'external-system') {
      return {
        id: 'external-system',
        name: 'Android System Wallpaper (External)',
        cssBackground: 'linear-gradient(135deg, #111827 0%, #030712 100%)',
        accentColor: '#6366f1',
        textColor: '#f8fafc',
        isCustom: true,
      };
    }
    return (
      WALLPAPER_PRESETS.find((p) => p.id === id) ||
      WALLPAPER_PRESETS[0]
    );
  }
}
