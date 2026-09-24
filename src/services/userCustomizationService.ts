import { OnevaAsset, OnevaAssetCategory } from '../types/adminAssets';
import { AdminAssetService } from './adminAssetService';
import { IconService } from './iconService';
import { ThemeEngineService } from './themeEngineService';
import { WallpaperService } from './wallpaperService';
import { KeyboardService } from './keyboardService';
import { CameraService } from './cameraService';
import { AssistService } from './assistService';
import { WidgetsSystemUIService } from './widgetsSystemUIService';
import { CurrentUserState, WallpaperSourceType } from '../types/fullPack';
import { FullPackComparisonService } from './fullPackComparisonService';

export interface UserCustomizationState {
  theme: string;
  wallpaper: string;
  wallpaperSource?: WallpaperSourceType;
  customWallpaperData?: string;
  icon_pack: string;
  system_ui: string;
  keyboard: string;
  camera: string;
  individual_icon: string;
  jarvis: string;
  appliedTimestamps: Record<string, string>;
}

const STORAGE_KEY = 'oneva_user_customization_state_v9';

export class UserCustomizationService {
  private static state: UserCustomizationState = this.loadState();
  private static listeners = new Set<() => void>();

  private static loadState(): UserCustomizationState {
    const defaults: UserCustomizationState = {
      theme: '', // No theme active by default
      wallpaper: 'wp-b', // Emerald Aurora ⭐
      wallpaperSource: 'admin_pack',
      icon_pack: 'pack-b', // Minimalist Vector Core ⭐
      system_ui: 'sysui-a', // Neon Matrix ⭐
      keyboard: 'kb-a', // OLED Tactile Elevation ⭐
      camera: 'cam-b', // Low-Light Neutral Tone ⭐
      individual_icon: 'icon-a', // WhatsApp Phosphor Glyph
      jarvis: 'jarvis-nova',
      appliedTimestamps: {},
    };

    if (typeof window === 'undefined') return defaults;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed.theme === 'theme-b' ||
          parsed.theme === 'theme-a' ||
          parsed.theme === 'theme-c' ||
          parsed.theme === 'theme_neon_dream'
        ) {
          parsed.theme = '';
        }
        return { ...defaults, ...parsed };
      }
    } catch (e) {
      console.warn('[UserCustomizationService] Failed to parse stored state:', e);
    }

    return defaults;
  }

  static getState(): UserCustomizationState {
    return this.state;
  }

  /**
   * Returns complete CurrentUserState formatted for the Comparison Engine
   */
  static getCurrentUserState(): CurrentUserState {
    const allAssets = AdminAssetService.getAssets();
    const getName = (id?: string) => allAssets.find((a) => a.id === id)?.name || id || '';

    return {
      themeId: this.state.theme,
      themeName: getName(this.state.theme),
      iconPackId: this.state.icon_pack,
      iconPackName: getName(this.state.icon_pack),
      wallpaperId: this.state.wallpaper,
      wallpaperName: this.state.wallpaperSource === 'gallery' ? 'Personal Gallery Photo' : getName(this.state.wallpaper),
      wallpaperSource: this.state.wallpaperSource || 'admin_pack',
      customWallpaperData: this.state.customWallpaperData,
      keyboardAnimationId: this.state.keyboard,
      keyboardName: getName(this.state.keyboard),
      cameraId: this.state.camera,
      cameraName: getName(this.state.camera),
      jarvisId: this.state.jarvis,
      jarvisName: getName(this.state.jarvis),
      lastModifiedAt: new Date().toISOString(),
    };
  }

  static isApplied(category: OnevaAssetCategory | 'jarvis', assetId: string): boolean {
    const key = category as keyof UserCustomizationState;
    return this.state[key] === assetId;
  }

  static getAppliedAsset(category: OnevaAssetCategory): OnevaAsset | undefined {
    const assetId = this.state[category as keyof UserCustomizationState] as string;
    if (!assetId) return undefined;
    return AdminAssetService.getAssets().find((a) => a.id === assetId);
  }

  /**
   * Applies an item in a specific category WITHOUT overwriting items in other categories.
   * Ensures independent module execution, persistence, and reactive engine updates.
   */
  static applyItem(
    category: OnevaAssetCategory | 'jarvis',
    assetId: string
  ): { success: boolean; message: string; asset?: OnevaAsset } {
    const allAssets = AdminAssetService.getAssets();
    const asset = allAssets.find((a) => a.id === assetId);

    // 1. Independent subsystem execution — only touch the requested category
    switch (category) {
      case 'theme': {
        const res = ThemeEngineService.applyTheme(assetId);
        if (!res.overallSuccess) return { success: false, message: res.message };
        break;
      }
      case 'icon_pack': {
        IconService.setActiveGlobalPack(assetId);
        break;
      }
      case 'wallpaper': {
        WallpaperService.applyWallpaper({ assetId, name: asset?.name, source: 'admin_pack' });
        break;
      }
      case 'keyboard': {
        KeyboardService.applyDefaultKeyboard({ themeId: assetId });
        break;
      }
      case 'camera': {
        CameraService.applyCameraConfig({ activeAssetId: assetId });
        break;
      }
      case 'system_ui': {
        if (asset?.payload) {
          WidgetsSystemUIService.updateConfig(asset.payload as any);
        }
        break;
      }
      case 'assist':
      case 'jarvis': {
        AssistService.applyJarvisDefault({ assetId, assistantName: 'Jarvis' });
        break;
      }
    }

    // 2. Update ONLY the target category in user state
    const nextState: UserCustomizationState = {
      ...this.state,
      [category]: assetId,
      wallpaperSource: category === 'wallpaper' ? 'admin_pack' : this.state.wallpaperSource,
      appliedTimestamps: {
        ...this.state.appliedTimestamps,
        [category]: new Date().toISOString(),
      },
    };

    this.state = nextState;
    this.persist();
    this.notify();

    return {
      success: true,
      message: `Applied "${asset?.name || assetId}" for ${category.replace('_', ' ').toUpperCase()}. Other modules remain unchanged.`,
      asset,
    };
  }

  /**
   * Sets custom gallery wallpaper.
   * Mandate: User's gallery choice is preserved and NEVER automatically reverted.
   */
  static applyGalleryWallpaper(dataUrl: string, fileName?: string): { success: boolean; message: string } {
    const res = WallpaperService.applyGalleryWallpaper(dataUrl, fileName);

    const nextState: UserCustomizationState = {
      ...this.state,
      wallpaper: 'gallery-custom',
      wallpaperSource: 'gallery',
      customWallpaperData: dataUrl,
      appliedTimestamps: {
        ...this.state.appliedTimestamps,
        wallpaper: new Date().toISOString(),
      },
    };

    this.state = nextState;
    this.persist();
    this.notify();

    return res;
  }

  /**
   * Bulk updates user state when Apply Full ONEVA Pack executes.
   */
  static setBulkState(newState: Partial<UserCustomizationState>): void {
    this.state = {
      ...this.state,
      ...newState,
      appliedTimestamps: {
        ...this.state.appliedTimestamps,
        full_pack: new Date().toISOString(),
      },
    };
    this.persist();
    this.notify();
  }

  private static persist(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('[UserCustomizationService] Failed to persist state:', e);
    }
  }

  /**
   * Called on app boot to restore all saved customizations
   */
  static initializeOnBoot(): void {
    if (this.state.theme) {
      ThemeEngineService.applyTheme(this.state.theme);
    }
    if (this.state.icon_pack) {
      IconService.setActiveGlobalPack(this.state.icon_pack);
    }
    if (this.state.wallpaper) {
      if (this.state.wallpaperSource === 'gallery' && this.state.customWallpaperData) {
        WallpaperService.applyGalleryWallpaper(this.state.customWallpaperData);
      } else {
        WallpaperService.applyWallpaper({ assetId: this.state.wallpaper, source: this.state.wallpaperSource });
      }
    }
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
        console.error('[UserCustomizationService] Listener error:', e);
      }
    });
  }
}
