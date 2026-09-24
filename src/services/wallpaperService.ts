import { LauncherSettingsService, WALLPAPER_PRESETS } from '../launcher/services/launcherSettingsService';
import { WallpaperPresetId } from '../launcher/types';
import { WallpaperSourceType } from '../types/fullPack';

export interface WallpaperConfig {
  activePresetId: string;
  activeAssetId?: string;
  activeWallpaperName: string;
  source: WallpaperSourceType;
  customWallpaperData?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'oneva_wallpaper_service_config_v8';

export class WallpaperService {
  private static config: WallpaperConfig | null = null;
  private static listeners: Set<() => void> = new Set();

  static getConfig(): WallpaperConfig {
    if (this.config) return this.config;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.config = JSON.parse(raw);
          return this.config!;
        }
      } catch (e) {
        console.warn('[WallpaperService] Failed to read local config:', e);
      }
    }

    const currentLauncher = LauncherSettingsService.getSettings();
    const activePreset = WALLPAPER_PRESETS.find((p) => p.id === currentLauncher.wallpaperId);

    this.config = {
      activePresetId: currentLauncher.wallpaperId || 'changeable-wallpaper',
      activeAssetId: 'changeable-wallpaper',
      activeWallpaperName: activePreset?.name || 'Dynamic Cybernetic (Changeable_wallpaper.mp4)',
      source: (currentLauncher.wallpaperSource as WallpaperSourceType) || 'preset',
      customWallpaperData: currentLauncher.customWallpaperUrl || '/assets/jarvis/Changeable_wallpaper.mp4',
      updatedAt: new Date().toISOString(),
    };
    return this.config;
  }

  /**
   * Applies an official preset or admin-published wallpaper
   */
  static applyWallpaper(payload: {
    presetId?: string;
    assetId?: string;
    name?: string;
    source?: WallpaperSourceType;
    videoUrl?: string;
  }): { success: boolean; message: string; name: string } {
    const presetId = payload.presetId || 'emerald-aurora';
    const found = WALLPAPER_PRESETS.find((p) => p.id === presetId);
    const targetName = payload.name || found?.name || 'Emerald Aurora';

    const current = this.getConfig();
    const updated: WallpaperConfig = {
      ...current,
      activePresetId: presetId,
      activeAssetId: payload.assetId || presetId,
      activeWallpaperName: targetName,
      source: payload.source || 'preset',
      customWallpaperData: payload.videoUrl || undefined,
      updatedAt: new Date().toISOString(),
    };

    this.config = updated;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('[WallpaperService] Failed to save config:', e);
      }
    }

    LauncherSettingsService.updateSettings({
      wallpaperId: presetId as WallpaperPresetId,
      customWallpaperUrl: payload.videoUrl || undefined,
      wallpaperSource: payload.source || 'preset',
    });

    this.notify();
    return {
      success: true,
      name: targetName,
      message: `Wallpaper applied: ${targetName}.`,
    };
  }

  /**
   * Applies a custom personal wallpaper uploaded from device Gallery or photos.
   * Mandate: ONEVA must NEVER automatically overwrite or revert this.
   */
  static applyGalleryWallpaper(dataUrl: string, fileName?: string): { success: boolean; message: string; name: string } {
    const customName = fileName || 'Personal Gallery Photo';

    const current = this.getConfig();
    const updated: WallpaperConfig = {
      ...current,
      activePresetId: 'gallery-custom',
      activeAssetId: 'gallery-custom',
      activeWallpaperName: customName,
      source: 'gallery',
      customWallpaperData: dataUrl,
      updatedAt: new Date().toISOString(),
    };

    this.config = updated;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('[WallpaperService] Failed to save gallery wallpaper:', e);
      }
    }

    LauncherSettingsService.updateSettings({
      wallpaperId: 'gallery-custom',
      customWallpaperUrl: dataUrl,
      wallpaperSource: 'gallery',
    });

    this.notify();
    return {
      success: true,
      name: customName,
      message: `Personal gallery wallpaper set: "${customName}". It will be preserved and never automatically overridden.`,
    };
  }

  /**
   * Simulates external Android wallpaper change (e.g. from System Settings or Google Photos)
   */
  static simulateExternalSystemWallpaperChange(externalSource: string): { success: boolean; message: string } {
    const updated: WallpaperConfig = {
      activePresetId: 'external-system',
      activeAssetId: 'external-system',
      activeWallpaperName: `${externalSource} (External)`,
      source: 'external_app',
      customWallpaperData: undefined,
      updatedAt: new Date().toISOString(),
    };

    this.config = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    LauncherSettingsService.updateSettings({
      wallpaperId: 'external-system',
      customWallpaperUrl: undefined,
      wallpaperSource: 'external_app',
    });

    this.notify();
    return {
      success: true,
      message: `External system wallpaper detected from ${externalSource}. Marked as modified.`,
    };
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
        console.error('[WallpaperService] Listener error:', e);
      }
    });
  }
}
