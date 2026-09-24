/**
 * ONEVA Theme Asset Manager
 *
 * Enforces Requirement 6:
 * Themes reference standalone asset IDs rather than duplicating binaries.
 * - Stores references to wallpaper asset ID/URL
 * - Stores references to icon pack asset ID/URL
 * - Stores System UI & Keyboard calibration
 * - Coordinated color schemes & OLED luminance
 *
 * Implements Lazy Component Resolution:
 * - When applying a theme, checks device cache first
 * - Downloads only missing components lazily
 * - Reuses already cached components
 */

import { OnevaAsset } from '../types/adminAssets';
import { AdminAssetService } from './adminAssetService';
import { AssetCacheService } from './assetCacheService';
import { WallpaperService } from './wallpaperService';
import { IconService } from './iconService';
import { AdvancedIconSystem } from './advancedIconSystem';
import { ThemeService } from './themeService';
import { WidgetsSystemUIService } from './widgetsSystemUIService';
import { KeyboardService } from './keyboardService';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { UserCustomizationService } from './userCustomizationService';

export interface ResolvedThemeComponents {
  wallpaperDataUrl?: string;
  isLiveWallpaper?: boolean;
  wallpaperAsset?: OnevaAsset;
  iconPackAsset?: OnevaAsset;
  iconPackExtractedIcons?: Record<string, string>;
  colors: Record<string, string>;
  appearance: {
    mode: 'oled' | 'dark';
    luminance: string;
    oledBlack: boolean;
  };
  systemUi?: any;
  keyboard?: any;
}

export class ThemeAssetManager {
  /**
   * Lazily resolves and downloads any missing theme components with progress feedback
   */
  static async resolveThemeComponents(
    themeAsset: OnevaAsset,
    onProgress?: (percent: number, step: string) => void
  ): Promise<ResolvedThemeComponents> {
    const themeDef = themeAsset.assets?.themeDefinition || (themeAsset.payload as any) || {};
    const wallpaperId = themeDef.wallpaperId || (themeAsset.payload?.wallpaperId as string);
    const iconPackId = themeDef.iconPackId || (themeAsset.payload?.iconPackId as string);

    onProgress?.(10, 'Inspecting theme component dependencies...');

    const resolved: ResolvedThemeComponents = {
      colors: themeDef.colors || {
        primary: '#030712',
        accent: '#06b6d4',
        surface: '#090f1e',
        background: '#000000',
        border: '#162033',
        text: '#f1f5f9',
      },
      appearance: {
        mode: themeDef.appearance?.mode || 'oled',
        luminance: themeDef.appearance?.luminance || 'pure_black',
        oledBlack: themeDef.appearance?.oledBlack !== false,
      },
      systemUi: themeDef.systemUi,
      keyboard: themeDef.keyboardStyle,
    };

    // 1. Resolve Wallpaper Component
    let wallpaperUrl: string | undefined = themeDef.wallpaperUrl;

    if (wallpaperId) {
      onProgress?.(30, 'Checking wallpaper component in cache...');
      const wpAsset = AdminAssetService.getAssetById(wallpaperId);
      if (wpAsset) {
        resolved.wallpaperAsset = wpAsset;
        resolved.isLiveWallpaper = wpAsset.isLiveWallpaper || wpAsset.category === 'live_wallpaper';

        // Check if wallpaper is cached
        const cachedWp = await AssetCacheService.getCachedUrl(wpAsset.id, 'original');
        if (cachedWp) {
          wallpaperUrl = cachedWp;
        } else {
          onProgress?.(45, `Downloading theme wallpaper "${wpAsset.name}"...`);
          try {
            wallpaperUrl = await AssetCacheService.downloadOriginalAsset(wpAsset);
          } catch (e) {
            console.warn('[ThemeAssetManager] Wallpaper download note:', e);
            wallpaperUrl = AssetCacheService.resolveDetailPreview(wpAsset) || undefined;
          }
        }
      }
    }

    if (!wallpaperUrl) {
      wallpaperUrl =
        themeAsset.previewData?.previewUrl ||
        themeAsset.previewData?.previewDataUrl ||
        themeDef.wallpaperUrl;
    }
    resolved.wallpaperDataUrl = wallpaperUrl;

    // 2. Resolve Icon Pack Component
    if (iconPackId) {
      onProgress?.(60, 'Checking icon pack component in cache...');
      const ipAsset = AdminAssetService.getAssetById(iconPackId);
      if (ipAsset) {
        resolved.iconPackAsset = ipAsset;

        // Check if icons are already present in memory/cache
        const extracted =
          ipAsset.assets?.extractedIcons ||
          (ipAsset.previewData?.customData as any)?.extractedIcons;

        if (extracted && Object.keys(extracted).length > 0) {
          resolved.iconPackExtractedIcons = extracted;
        } else {
          onProgress?.(75, `Fetching icon pack assets "${ipAsset.name}"...`);
          try {
            await AssetCacheService.downloadOriginalAsset(ipAsset);
          } catch (e) {
            console.warn('[ThemeAssetManager] Icon pack download note:', e);
          }
        }
      }
    }

    onProgress?.(100, 'All theme components resolved.');
    return resolved;
  }

  /**
   * Applies the entire assembled theme to all device surfaces
   */
  static async applyTheme(
    themeAsset: OnevaAsset,
    onProgress?: (percent: number, step: string) => void
  ): Promise<void> {
    const comp = await this.resolveThemeComponents(themeAsset, onProgress);

    // 1. Apply Theme Colors & Luminance
    ThemeService.applyTheme({
      mode: comp.appearance.mode,
      luminance: comp.appearance.luminance,
      accentColor: comp.colors.accent || '#06b6d4',
      assetId: themeAsset.id,
    });

    // 2. Apply Wallpaper if resolved
    if (comp.wallpaperDataUrl) {
      if (comp.isLiveWallpaper) {
        WallpaperService.applyWallpaper({
          presetId: comp.wallpaperAsset?.id || themeAsset.id,
          assetId: comp.wallpaperAsset?.id || themeAsset.id,
          name: `${themeAsset.name} Live`,
          source: 'admin_pack',
          videoUrl: comp.wallpaperDataUrl,
        });
      } else {
        WallpaperService.applyGalleryWallpaper(comp.wallpaperDataUrl, `${themeAsset.name} Wallpaper`);
        PlatformBridge.applySystemWallpaper(comp.wallpaperDataUrl, 'both');
      }
    }

    // 3. Apply Icon Pack if resolved
    if (comp.iconPackAsset) {
      IconService.setActiveGlobalPack(comp.iconPackAsset.id);
      AdvancedIconSystem.applyFullIconPack(comp.iconPackAsset.id);
    }

    // 4. Apply System UI
    if (comp.systemUi) {
      WidgetsSystemUIService.updateConfig(comp.systemUi);
      PlatformBridge.applySystemUiTheme({ accentColor: comp.colors.accent });
    }

    // 5. Apply Keyboard styling if present
    if (comp.keyboard) {
      KeyboardService.applyDefaultKeyboard({
        themeId: themeAsset.id,
        animationType: 'elevation',
        backgroundUrl: comp.wallpaperDataUrl,
      });
    }

    // Register with User Customization Service
    UserCustomizationService.applyItem('theme', themeAsset.id);
    PlatformBridge.performHapticFeedback('confirm');
  }
}
