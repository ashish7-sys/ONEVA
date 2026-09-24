import { LauncherSettingsService } from '../launcher/services/launcherSettingsService';

export interface ThemeConfig {
  mode: 'dark' | 'oled';
  luminance: string;
  accentColor: string;
  activeAssetId?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'oneva_theme_service_config';

export class ThemeService {
  private static config: ThemeConfig | null = null;
  private static listeners: Set<() => void> = new Set();

  static getConfig(): ThemeConfig {
    if (this.config) return this.config;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.config = JSON.parse(raw);
          if (this.config?.activeAssetId === 'theme-b' || this.config?.activeAssetId === 'theme-a' || this.config?.activeAssetId === 'theme-c') {
            this.config.activeAssetId = undefined;
          }
          return this.config!;
        }
      } catch (e) {
        console.warn('[ThemeService] Failed to parse local config:', e);
      }
    }

    const launcherSettings = LauncherSettingsService.getSettings();
    this.config = {
      mode: launcherSettings.activeThemeMode || 'oled',
      luminance: 'pure_black',
      accentColor: '#06b6d4',
      activeAssetId: undefined,
      updatedAt: new Date().toISOString(),
    };
    return this.config;
  }

  /**
   * Applies a theme configuration from a default asset payload or direct settings.
   */
  static applyTheme(payload: { mode?: 'dark' | 'oled'; luminance?: string; accentColor?: string; assetId?: string }): { success: boolean; message: string } {
    const current = this.getConfig();
    const updated: ThemeConfig = {
      ...current,
      mode: payload.mode || current.mode,
      luminance: payload.luminance || current.luminance,
      accentColor: payload.accentColor || current.accentColor,
      activeAssetId: payload.assetId || current.activeAssetId,
      updatedAt: new Date().toISOString(),
    };

    this.config = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    // Sync to launcher settings
    LauncherSettingsService.updateSettings({
      activeThemeMode: updated.mode,
    });

    this.notify();
    return {
      success: true,
      message: `Theme calibrated to ${updated.mode.toUpperCase()} (${updated.luminance}).`,
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
