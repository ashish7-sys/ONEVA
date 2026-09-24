import { OnevaThemeDefinition, OnevaAsset } from '../types/adminAssets';
import { AdminAssetService } from './adminAssetService';
import { IconService } from './iconService';
import { AdvancedIconSystem } from './advancedIconSystem';
import { UserCustomizationService } from './userCustomizationService';
import { WidgetsSystemUIService } from './widgetsSystemUIService';
import { ThemeService } from './themeService';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { KeyboardService } from './keyboardService';

export interface ThemeEngineSettings {
  activeThemeId: string;
  appliedThemeDefinition: OnevaThemeDefinition | null;
  lastAppliedTimestamp: string;
}

export interface ThemeApplyComponentResult {
  name: 'wallpaper' | 'icon_pack' | 'system_ui' | 'keyboard';
  label: string;
  assetName?: string;
  status: 'applied' | 'unsupported' | 'failed' | 'skipped';
  message: string;
}

export interface ThemeApplyReport {
  themeId: string;
  themeTitle: string;
  componentsAttempted: number;
  componentsApplied: ThemeApplyComponentResult[];
  overallSuccess: boolean;
  message: string;
}

const STORAGE_KEY = 'oneva_theme_engine_settings_v7';

const DEMO_THEME_IDS = new Set([
  'theme-a',
  'theme-b',
  'theme-c',
  'theme_neon_dream',
  'theme_cyber_matrix',
  'theme_solar_flare',
  'theme_minimal_monochrome',
]);

export class ThemeEngineService {
  private static settings: ThemeEngineSettings = this.loadInitialSettings();
  private static listeners = new Set<() => void>();

  private static loadInitialSettings(): ThemeEngineSettings {
    if (typeof window === 'undefined') {
      return {
        activeThemeId: '',
        appliedThemeDefinition: null,
        lastAppliedTimestamp: new Date().toISOString(),
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.activeThemeId && DEMO_THEME_IDS.has(parsed.activeThemeId)) {
          parsed.activeThemeId = '';
          parsed.appliedThemeDefinition = null;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('[ThemeEngineService] Error reading localStorage:', e);
    }

    return {
      activeThemeId: '',
      appliedThemeDefinition: null,
      lastAppliedTimestamp: new Date().toISOString(),
    };
  }

  static getSettings(): ThemeEngineSettings {
    return this.settings;
  }

  /**
   * Retrieves all available published themes from AdminAssetService
   */
  static getAvailableThemes(): Array<{
    assetId: string;
    theme: OnevaThemeDefinition;
    asset: OnevaAsset;
    isDefault: boolean;
    isActive: boolean;
    version: string;
    referencedAssets: {
      wallpaperName?: string;
      wallpaperUrl?: string;
      isLiveWallpaper?: boolean;
      iconPackName?: string;
      iconCount?: number;
      systemUiName?: string;
      keyboardName?: string;
    };
  }> {
    const assets = AdminAssetService.getPublishedAssets('theme');
    const allAssets = AdminAssetService.getAssets();

    return assets.map((asset) => {
      const wpId: string | undefined =
        (asset.payload?.wallpaperAssetId as string) ||
        (asset.payload?.wallpaperId as string) ||
        (asset.assets?.themeDefinition?.wallpaperAssetId as string) ||
        (asset.assets?.themeDefinition?.wallpaperId as string) ||
        undefined;

      const ipId: string | undefined =
        (asset.payload?.iconPackAssetId as string) ||
        (asset.payload?.iconPackId as string) ||
        (asset.assets?.themeDefinition?.iconPackAssetId as string) ||
        (asset.assets?.themeDefinition?.iconPackId as string) ||
        undefined;

      const sysUiId: string | undefined =
        (asset.payload?.systemUiAssetId as string) ||
        (asset.assets?.themeDefinition?.systemUiAssetId as string) ||
        undefined;

      const kbId: string | undefined =
        (asset.payload?.keyboardAssetId as string) ||
        (asset.payload?.keyboardId as string) ||
        (asset.assets?.themeDefinition?.keyboardAssetId as string) ||
        (asset.assets?.themeDefinition?.keyboardId as string) ||
        undefined;

      const wallpaper = wpId ? allAssets.find((a) => a.id === wpId) : undefined;
      const iconPack = ipId ? allAssets.find((a) => a.id === ipId) : undefined;
      const systemUi = sysUiId ? allAssets.find((a) => a.id === sysUiId) : undefined;
      const keyboard = kbId ? allAssets.find((a) => a.id === kbId) : undefined;

      const def: OnevaThemeDefinition = asset.assets?.themeDefinition || {
        id: asset.id,
        name: asset.name,
        description: asset.description,
        version: asset.version,
        creator: asset.author || 'ONEVA Designer',
        author: asset.author || 'ONEVA Designer',
        wallpaperId: wpId,
        wallpaperAssetId: wpId,
        iconPackId: ipId,
        iconPackAssetId: ipId,
        systemUiAssetId: sysUiId,
        keyboardId: kbId,
        keyboardAssetId: kbId,
        colors: {
          primary: (asset.payload?.accentColor as string) || '#06b6d4',
          accent: (asset.payload?.accentColor as string) || '#06b6d4',
          surface: '#0d0d11',
          background: '#000000',
          border: '#1f1f28',
          text: '#ffffff',
        },
        appearance: {
          mode: (asset.payload?.mode as any) || 'oled',
          luminance: 'pure_black',
          oledBlack: true,
          contrastRatio: 21.0,
        },
        systemUi: asset.payload?.systemUi || {
          searchBarStyle: 'futuristic_pill',
          batteryStyle: 'horizontal_pill',
          wifiStyle: 'curved_waves',
          signalStyle: '5g_contour',
          clockStyle: 'digital_mono',
        },
        quickSettings: asset.payload?.quickSettings || {
          tileShape: 'squircle',
          panelLuminance: 'oled',
        },
      };

      const wpUrl =
        wallpaper?.previewData?.previewUrl ||
        wallpaper?.previewData?.previewDataUrl ||
        asset.previewData?.previewUrl ||
        (asset.payload?.wallpaperUrl as string) ||
        undefined;

      const isLiveWp =
        Boolean(wallpaper?.isLiveWallpaper) ||
        wallpaper?.category === 'live_wallpaper' ||
        Boolean(asset.isLiveWallpaper) ||
        asset.payload?.mediaType === 'wallpaper_live';

      return {
        assetId: asset.id,
        theme: def,
        asset,
        isDefault: asset.isDefault,
        isActive: this.settings.activeThemeId === asset.id,
        version: asset.version,
        referencedAssets: {
          wallpaperName: wallpaper?.name,
          wallpaperUrl: wpUrl,
          isLiveWallpaper: isLiveWp,
          iconPackName: iconPack?.name,
          iconCount: (iconPack?.payload?.iconCount as number) || undefined,
          systemUiName: systemUi?.name,
          keyboardName: keyboard?.name,
        },
      };
    });
  }

  /**
   * Applies a complete Theme Customization Bundle using real Android mechanisms.
   * Dispatches genuine native intents / bridges for included components and returns detailed report.
   */
  static applyTheme(themeAssetId: string): ThemeApplyReport {
    const available = this.getAvailableThemes();
    const found = available.find((t) => t.assetId === themeAssetId);

    if (!found) {
      return {
        themeId: themeAssetId,
        themeTitle: 'Unknown Theme',
        componentsAttempted: 0,
        componentsApplied: [],
        overallSuccess: false,
        message: `Theme asset "${themeAssetId}" not found in published catalog.`,
      };
    }

    const theme = found.theme;
    const results: ThemeApplyComponentResult[] = [];
    let attempted = 0;

    // 1. Wallpaper Application
    const wpId = theme.wallpaperAssetId || theme.wallpaperId;
    if (wpId) {
      attempted++;
      try {
        UserCustomizationService.applyItem('wallpaper', wpId);
        const wpAsset = AdminAssetService.getAssetById(wpId);
        const wpUrl =
          wpAsset?.previewData?.previewUrl ||
          wpAsset?.previewData?.previewDataUrl ||
          theme.wallpaperUrl;

        const isLive =
          Boolean(wpAsset?.isLiveWallpaper) ||
          wpAsset?.category === 'live_wallpaper' ||
          Boolean(theme.isLiveWallpaper);

        if (isLive) {
          const liveRes = PlatformBridge.applyLiveWallpaper();
          results.push({
            name: 'wallpaper',
            label: 'Live Wallpaper',
            assetName: wpAsset?.name || 'Theme Live Wallpaper',
            status: 'applied',
            message: liveRes.message,
          });
        } else if (wpUrl) {
          const sysRes = PlatformBridge.applySystemWallpaper(wpUrl, 'both');
          results.push({
            name: 'wallpaper',
            label: 'Wallpaper',
            assetName: wpAsset?.name || 'Theme Wallpaper',
            status: 'applied',
            message: sysRes.message,
          });
        } else {
          results.push({
            name: 'wallpaper',
            label: 'Wallpaper',
            assetName: wpAsset?.name || wpId,
            status: 'applied',
            message: 'Wallpaper applied to launcher surface.',
          });
        }
      } catch (err: any) {
        results.push({
          name: 'wallpaper',
          label: 'Wallpaper',
          status: 'failed',
          message: `Failed to apply wallpaper: ${err?.message || 'Error'}`,
        });
      }
    } else {
      results.push({
        name: 'wallpaper',
        label: 'Wallpaper',
        status: 'skipped',
        message: 'Theme does not include a wallpaper asset.',
      });
    }

    // 2. Icon Pack Application
    const ipId = theme.iconPackAssetId || theme.iconPackId;
    if (ipId) {
      attempted++;
      try {
        IconService.setActiveGlobalPack(ipId);
        AdvancedIconSystem.applyFullIconPack(ipId);

        if (theme.individualIconOverrides) {
          Object.entries(theme.individualIconOverrides).forEach(([pkg, iconId]) => {
            AdvancedIconSystem.setSingleAppIconOverride(pkg, iconId);
          });
        }

        const ipAsset = AdminAssetService.getAssetById(ipId);
        results.push({
          name: 'icon_pack',
          label: 'Icon Pack',
          assetName: ipAsset?.name || 'Custom Icon Pack',
          status: 'applied',
          message: `Applied icon pack across launcher surfaces.`,
        });
      } catch (err: any) {
        results.push({
          name: 'icon_pack',
          label: 'Icon Pack',
          status: 'failed',
          message: `Failed to apply icon pack: ${err?.message || 'Error'}`,
        });
      }
    } else {
      results.push({
        name: 'icon_pack',
        label: 'Icon Pack',
        status: 'skipped',
        message: 'Theme does not include an icon pack.',
      });
    }

    // 3. System UI Application
    if (theme.systemUi) {
      attempted++;
      try {
        if (theme.systemUi.searchBarStyle) {
          WidgetsSystemUIService.updateSearchBar({
            style: theme.systemUi.searchBarStyle,
            accentColor: theme.colors.accent,
          });
        }
        WidgetsSystemUIService.updateStatusAndIndicators({
          ...(theme.systemUi.batteryStyle && { batteryStyle: theme.systemUi.batteryStyle }),
          ...(theme.systemUi.wifiStyle && { wifiStyle: theme.systemUi.wifiStyle }),
          ...(theme.systemUi.signalStyle && { signalStyle: theme.systemUi.signalStyle }),
          ...(theme.systemUi.clockStyle && { clockStyle: theme.systemUi.clockStyle }),
        });

        if (PlatformBridge.isNativeAndroid() && window.OnevaNativeBridge?.applySystemUiThemeConfig) {
          window.OnevaNativeBridge.applySystemUiThemeConfig(JSON.stringify(theme.systemUi));
          results.push({
            name: 'system_ui',
            label: 'System UI',
            status: 'applied',
            message: 'System UI status and quick settings configured via native bridge.',
          });
        } else {
          results.push({
            name: 'system_ui',
            label: 'System UI',
            status: 'applied',
            message: 'Configured launcher system bars and search widgets.',
          });
        }
      } catch (err: any) {
        results.push({
          name: 'system_ui',
          label: 'System UI',
          status: 'failed',
          message: `System UI update failed: ${err?.message || 'Error'}`,
        });
      }
    }

    // 4. Keyboard Application
    const kbId = theme.keyboardAssetId || theme.keyboardId;
    if (kbId) {
      attempted++;
      try {
        KeyboardService.applyDefaultKeyboard({ themeId: kbId });
        const isImeEnabled = PlatformBridge.isKeyboardImeEnabled();

        if (PlatformBridge.isNativeAndroid() && !isImeEnabled) {
          results.push({
            name: 'keyboard',
            label: 'ONEVA Keyboard',
            status: 'unsupported',
            message: 'Theme keyboard saved. To enable on device, turn on ONEVA Keyboard in Android Settings > Languages & Input.',
          });
        } else {
          results.push({
            name: 'keyboard',
            label: 'ONEVA Keyboard',
            status: 'applied',
            message: 'Theme keyboard layout and tactile haptics applied.',
          });
        }
      } catch (err: any) {
        results.push({
          name: 'keyboard',
          label: 'ONEVA Keyboard',
          status: 'failed',
          message: `Keyboard update failed: ${err?.message || 'Error'}`,
        });
      }
    }

    // 5. Update Colors and CSS variables
    ThemeService.applyTheme({
      accentColor: theme.colors.accent,
      mode: theme.appearance?.mode === 'oled' ? 'oled' : 'dark',
    });

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--oneva-theme-primary', theme.colors.primary);
      root.style.setProperty('--oneva-theme-accent', theme.colors.accent);
      root.style.setProperty('--oneva-theme-bg', theme.colors.background);
      root.style.setProperty('--oneva-theme-surface', theme.colors.surface);
      root.style.setProperty('--oneva-theme-border', theme.colors.border);
    }

    // 6. Save to persistent settings
    this.settings = {
      activeThemeId: themeAssetId,
      appliedThemeDefinition: theme,
      lastAppliedTimestamp: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      } catch (err) {
        console.warn('[ThemeEngineService] Failed to persist theme:', err);
      }
    }

    this.notify();

    const appliedCount = results.filter((r) => r.status === 'applied').length;
    const overallSuccess = appliedCount > 0;

    return {
      themeId: themeAssetId,
      themeTitle: theme.name,
      componentsAttempted: attempted,
      componentsApplied: results,
      overallSuccess,
      message: `Theme "${theme.name}" applied successfully (${appliedCount} component${appliedCount !== 1 ? 's' : ''} active).`,
    };
  }

  /**
   * Applies an individual component from a theme bundle
   */
  static applyThemeComponent(
    themeAssetId: string,
    component: 'wallpaper' | 'icons' | 'system_ui' | 'quick_settings' | 'colors'
  ): { success: boolean; message: string } {
    const available = this.getAvailableThemes();
    const found = available.find((t) => t.assetId === themeAssetId);
    if (!found) {
      return { success: false, message: `Theme "${themeAssetId}" not found.` };
    }

    const theme = found.theme;

    switch (component) {
      case 'wallpaper':
        const wpId = theme.wallpaperAssetId || theme.wallpaperId;
        if (wpId) {
          UserCustomizationService.applyItem('wallpaper', wpId);
          return { success: true, message: `Theme wallpaper applied.` };
        }
        return { success: false, message: 'This theme does not include a wallpaper.' };

      case 'icons':
        const ipId = theme.iconPackAssetId || theme.iconPackId;
        if (ipId) {
          IconService.setActiveGlobalPack(ipId);
          AdvancedIconSystem.applyFullIconPack(ipId);
          return { success: true, message: `Theme icon pack applied.` };
        }
        return { success: false, message: 'This theme does not include an icon pack.' };

      case 'system_ui':
        if (theme.systemUi) {
          if (theme.systemUi.searchBarStyle) {
            WidgetsSystemUIService.updateSearchBar({
              style: theme.systemUi.searchBarStyle,
              accentColor: theme.colors.accent,
            });
          }
          return { success: true, message: `Theme System UI styling applied.` };
        }
        return { success: false, message: 'Theme has no custom System UI definitions.' };

      case 'quick_settings':
        if (theme.quickSettings) {
          WidgetsSystemUIService.updateQuickSettings({
            ...(theme.quickSettings.tileShape && { tileShape: theme.quickSettings.tileShape }),
            customActiveColor: theme.colors.accent,
          });
          return { success: true, message: `Theme Quick Settings appearance applied.` };
        }
        return { success: false, message: 'Theme has no custom Quick Settings definitions.' };

      case 'colors':
        ThemeService.applyTheme({
          accentColor: theme.colors.accent,
          mode: theme.appearance?.mode === 'oled' ? 'oled' : 'dark',
        });
        return { success: true, message: `Theme accent color applied.` };
    }
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
