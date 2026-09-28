import { AdminAssetService, ASSET_CATEGORIES } from './adminAssetService';
import { ThemeService } from './themeService';
import { ThemeEngineService } from './themeEngineService';
import { IconService } from './iconService';
import { KeyboardService } from './keyboardService';
import { WallpaperService } from './wallpaperService';
import { CameraService } from './cameraService';
import { OnevaAiCameraService } from './onevaAiCameraService';
import { AssistService } from './assistService';
import { JarvisVoiceService } from './jarvisVoiceService';
import { WidgetsSystemUIService } from './widgetsSystemUIService';
import { QuickPanelService } from './quickPanelService';
import { AppCatalogService } from './appCatalogService';
import { UserCustomizationService } from './userCustomizationService';
import { FullPackComparisonService } from './fullPackComparisonService';
import {
  FullPackSnapshot,
  OnevaPackComponentKey,
  OnevaPackComponentManifest,
} from '../types/fullPack';
import { OnevaAssetCategory, FullPackExecutionResult, FullPackItemStatus } from '../types/adminAssets';
import { CameraProviderRegistry } from './camera/cameraProviderRegistry';
import { CameraProviderId } from '../types/cameraProviders';

export type FullPackStepListener = (step: {
  category: OnevaAssetCategory | OnevaPackComponentKey;
  categoryLabel: string;
  assetName: string;
  status: 'applying' | 'applied' | 'warning' | 'failed';
  message: string;
  stepNumber?: number;
  totalSteps?: number;
}) => void;

export class FullPackService {
  /**
   * Retrieves the authoritative 7 Core Components Manifest of the Full ONEVA Pack:
   * 1. WALLPAPER
   * 2. ICON PACK
   * 3. WIDGETS + QUICK PANEL
   * 4. KEYBOARD THEME
   * 5. JARVIS — FULL SETUP
   * 6. JARVIS WALLPAPER — REACTIVE AWAKE VISUAL
   * 7. ONEVA AI CAMERA — SPECIAL FOCUS
   */
  static getSevenComponentsManifest(): OnevaPackComponentManifest[] {
    const defaults = AdminAssetService.getAllDefaults();
    const cameraCaps = OnevaAiCameraService.getDeviceCapabilities();
    const catalogCount = AppCatalogService.getAllApps().length;

    return [
      {
        key: 'wallpaper',
        index: 1,
        name: 'Wallpaper',
        categoryLabel: 'Component 1: Wallpaper',
        description: 'Admin-curated Static or Live OLED wallpaper; strictly preserves user background choice.',
        activeProfile: defaults.wallpaper?.name || 'Emerald Aurora OLED',
      },
      {
        key: 'icon_pack',
        index: 2,
        name: 'Icon Pack',
        categoryLabel: 'Component 2: Icon Pack',
        description: `Vector glyph engine applied to all ${catalogCount} catalog apps including Phone, Messages, and Contacts.`,
        activeProfile: defaults.icon_pack?.name || 'Minimalist Vector Core',
      },
      {
        key: 'widgets_quick_panel',
        index: 3,
        name: 'Widgets + Quick Panel',
        categoryLabel: 'Component 3: Widgets & Quick Panel',
        description: 'ONEVA system widgets and customized Quick Panel tiles (Wi-Fi, Torch, Sound, Volume, Hotspot, Bluetooth).',
        activeProfile: 'Modern Quick Panel & Floating Search Bar',
      },
      {
        key: 'keyboard_theme',
        index: 4,
        name: 'Keyboard Theme',
        categoryLabel: 'Component 4: Keyboard Theme',
        description: 'Tactile elevation keycap styling, localized IME predictive buffer, and OLED luminance.',
        activeProfile: defaults.keyboard?.name || 'OLED Tactile Elevation',
      },
      {
        key: 'jarvis_full_setup',
        index: 5,
        name: 'Jarvis — Full Setup',
        categoryLabel: 'Component 5: Jarvis Full Setup',
        description: 'Complete system-wide layer with 5 distinct states: Sleeping, Awake, Short Command, Research, Hand Control.',
        activeProfile: defaults.assist?.name || 'Jarvis Autonomous Core',
      },
      {
        key: 'jarvis_reactive_wallpaper',
        index: 6,
        name: 'Jarvis Reactive Wallpaper',
        categoryLabel: 'Component 6: Reactive Visual Layer',
        description: 'Independent visual layer over base wallpaper; activates and pulses dynamically with Jarvis speech.',
        activeProfile: 'Jarvis 3D Energy Sphere (Additive Blend)',
      },
      {
        key: 'oneva_ai_camera',
        index: 7,
        name: 'ONEVA AI Camera',
        categoryLabel: 'Component 7: ONEVA AI Camera (Special Focus)',
        description: `Dedicated computational photography subsystem with PHOTO | VIDEO | ONEVA | MORE controls, live ON/OFF comparison, and ${cameraCaps.tier.toUpperCase()} hardware adaptation.`,
        activeProfile: `ONEVA AI ISP (${cameraCaps.tier.toUpperCase()})`,
        isSpecialFocus: true,
      },
    ];
  }

  /**
   * Retrieves the current published Admin default assets across all categories.
   */
  static getCurrentPackManifest(): {
    category: OnevaAssetCategory;
    categoryLabel: string;
    assetId: string;
    assetName: string;
    version: string;
  }[] {
    const defaults = AdminAssetService.getAllDefaults();
    return ASSET_CATEGORIES.map((cat) => {
      const defaultAsset = defaults[cat.id];
      return {
        category: cat.id,
        categoryLabel: cat.name,
        assetId: defaultAsset?.id || 'none',
        assetName: defaultAsset?.name || 'No Default Selected',
        version: defaultAsset?.version || '1.0.0',
      };
    });
  }

  /**
   * Executes the Full ONEVA Pack application across the EXACT 7 Components:
   * 1. WALLPAPER
   * 2. ICON PACK
   * 3. WIDGETS + QUICK PANEL
   * 4. KEYBOARD THEME
   * 5. JARVIS — FULL SETUP
   * 6. JARVIS WALLPAPER — REACTIVE AWAKE VISUAL
   * 7. ONEVA AI CAMERA — SPECIAL FOCUS
   */
  static async applyFullPack(onStep?: FullPackStepListener): Promise<FullPackExecutionResult> {
    const defaults = AdminAssetService.getAllDefaults();
    const items: FullPackItemStatus[] = [];

    // Helper for simulating slight step delay for smooth visual feedback in UI
    const stepDelay = () => new Promise((resolve) => setTimeout(resolve, 140));

    // =========================================================================
    // 1. WALLPAPER (Static / Live OLED, preserved user background)
    // =========================================================================
    try {
      const asset = defaults.wallpaper;
      const label = '1. Wallpaper';
      const name = asset?.name || 'Emerald Aurora OLED';
      onStep?.({
        category: 'wallpaper',
        categoryLabel: label,
        assetName: name,
        status: 'applying',
        message: 'Applying lightweight OLED background (user custom wallpaper preserved if set)...',
        stepNumber: 1,
        totalSteps: 7,
      });
      await stepDelay();

      const res = WallpaperService.applyWallpaper({
        presetId: (asset?.payload?.presetId as string) || 'emerald-aurora',
        assetId: asset?.id,
      });

      items.push({
        category: 'wallpaper',
        categoryLabel: label,
        assetId: asset?.id || 'default',
        assetName: name,
        status: res.success ? 'applied' : 'failed',
        message: res.message,
      });
      onStep?.({
        category: 'wallpaper',
        categoryLabel: label,
        assetName: name,
        status: 'applied',
        message: res.message,
        stepNumber: 1,
        totalSteps: 7,
      });
    } catch (e: any) {
      items.push({
        category: 'wallpaper',
        categoryLabel: '1. Wallpaper',
        assetId: 'error',
        assetName: 'Wallpaper',
        status: 'failed',
        message: e?.message || 'Wallpaper failed to apply',
      });
    }

    // =========================================================================
    // 2. ICON PACK (Applied to all 81 catalog apps including Phone/Messages/Contacts)
    // =========================================================================
    try {
      const asset = defaults.icon_pack;
      const label = '2. Icon Pack';
      const name = asset?.name || 'Minimalist Vector Core';
      const totalCatalog = AppCatalogService.getAllApps().length;
      onStep?.({
        category: 'icon_pack',
        categoryLabel: label,
        assetName: name,
        status: 'applying',
        message: `Applying vector icon pack across all ${totalCatalog} catalog apps including Phone, Messages, and Contacts...`,
        stepNumber: 2,
        totalSteps: 7,
      });
      await stepDelay();

      const res = IconService.applyDefaultPack({
        packId: (asset?.payload?.packId as string) || 'pack_minimalist',
      });

      items.push({
        category: 'icon_pack',
        categoryLabel: label,
        assetId: asset?.id || 'default',
        assetName: name,
        status: res.success ? 'applied' : 'failed',
        message: `Vector pack mapped to all ${totalCatalog} catalog apps.`,
      });
      onStep?.({
        category: 'icon_pack',
        categoryLabel: label,
        assetName: name,
        status: 'applied',
        message: res.message,
        stepNumber: 2,
        totalSteps: 7,
      });
    } catch (e: any) {
      items.push({
        category: 'icon_pack',
        categoryLabel: '2. Icon Pack',
        assetId: 'error',
        assetName: 'Icon Pack',
        status: 'failed',
        message: e?.message || 'Icon pack failed to apply',
      });
    }

    // =========================================================================
    // 3. WIDGETS + QUICK PANEL (Search bar, weather, quick settings tiles)
    // =========================================================================
    try {
      const label = '3. Widgets + Quick Panel';
      const name = 'ONEVA Quick Panel & System Widgets';
      onStep?.({
        category: 'system_ui',
        categoryLabel: label,
        assetName: name,
        status: 'applying',
        message: 'Calibrating Quick Panel tiles (Wi-Fi, Bluetooth, Torch, Sound, Volume) & widgets...',
        stepNumber: 3,
        totalSteps: 7,
      });
      await stepDelay();

      // Configure Widgets & Quick Settings
      const currentWidgetsConfig = WidgetsSystemUIService.getConfig();
      WidgetsSystemUIService.saveConfig({
        quickSettings: {
          ...currentWidgetsConfig.quickSettings,
          tileShape: 'squircle',
          syncWithThemeAccent: true,
          customActiveColor: '#10b981',
          panelLuminance: 'oled',
        },
      });

      // Synchronize Quick Panel tiles
      QuickPanelService.setGridColumns(4);
      QuickPanelService.setAccentColorSync(true);

      items.push({
        category: 'system_ui',
        categoryLabel: label,
        assetId: 'widgets-quickpanel-v19',
        assetName: name,
        status: 'applied',
        message: 'Quick Panel tile layout and futuristic widgets calibrated.',
      });
      onStep?.({
        category: 'system_ui',
        categoryLabel: label,
        assetName: name,
        status: 'applied',
        message: 'Quick Panel tiles & widgets successfully applied.',
        stepNumber: 3,
        totalSteps: 7,
      });
    } catch (e: any) {
      items.push({
        category: 'system_ui',
        categoryLabel: '3. Widgets + Quick Panel',
        assetId: 'error',
        assetName: 'Widgets & Quick Panel',
        status: 'failed',
        message: e?.message || 'Failed to calibrate widgets & quick panel',
      });
    }

    // =========================================================================
    // 4. KEYBOARD THEME (Tactile elevation & keycap luminance)
    // =========================================================================
    try {
      const asset = defaults.keyboard;
      const label = '4. Keyboard Theme';
      const name = asset?.name || 'OLED Tactile Elevation';
      onStep?.({
        category: 'keyboard',
        categoryLabel: label,
        assetName: name,
        status: 'applying',
        message: 'Loading tactile elevation keycaps and localized IME predictive buffer...',
        stepNumber: 4,
        totalSteps: 7,
      });
      await stepDelay();

      const res = KeyboardService.applyDefaultKeyboard({
        themeId: (asset?.payload?.themeId as string) || 'oled-mono',
        animationType: (asset?.payload?.animationType as any) || 'elevation',
      });

      items.push({
        category: 'keyboard',
        categoryLabel: label,
        assetId: asset?.id || 'default',
        assetName: name,
        status: res.success ? 'applied' : 'failed',
        message: res.message,
      });
      onStep?.({
        category: 'keyboard',
        categoryLabel: label,
        assetName: name,
        status: 'applied',
        message: res.message,
        stepNumber: 4,
        totalSteps: 7,
      });
    } catch (e: any) {
      items.push({
        category: 'keyboard',
        categoryLabel: '4. Keyboard Theme',
        assetId: 'error',
        assetName: 'Keyboard',
        status: 'failed',
        message: e?.message || 'Keyboard failed to apply',
      });
    }

    // =========================================================================
    // 5. JARVIS — FULL SETUP (System-wide core & 5 states)
    // =========================================================================
    try {
      const asset = defaults.assist;
      const label = '5. Jarvis — Full Setup';
      const name = asset?.name || 'Jarvis Autonomous System-wide Core';
      onStep?.({
        category: 'assist',
        categoryLabel: label,
        assetName: name,
        status: 'applying',
        message: 'Configuring system-wide Jarvis core (5 States: Sleeping, Awake, Short, Research, Hand Control)...',
        stepNumber: 5,
        totalSteps: 7,
      });
      await stepDelay();

      const res = AssistService.applyJarvisDefault({
        assistantName: (asset?.payload?.assistantName as string) || 'Jarvis',
        wakeWord: (asset?.payload?.wakeWord as string) || 'Hey Jarvis',
        liveWallpaperEnabled: true,
        assetId: asset?.id,
      });

      // Ensure Jarvis state machine is cleanly initialized in NOT AWAKE / SLEEPING state
      // waiting for wake phrase "Hey Jarvis"
      await JarvisVoiceService.stopVoiceSystem();

      items.push({
        category: 'assist',
        categoryLabel: label,
        assetId: asset?.id || 'default',
        assetName: name,
        status: res.success ? 'applied' : 'failed',
        message: 'System-wide Jarvis core active with context-aware brevity & strict privacy.',
      });
      onStep?.({
        category: 'assist',
        categoryLabel: label,
        assetName: name,
        status: 'applied',
        message: 'Jarvis Full Setup complete.',
        stepNumber: 5,
        totalSteps: 7,
      });
    } catch (e: any) {
      items.push({
        category: 'assist',
        categoryLabel: '5. Jarvis — Full Setup',
        assetId: 'error',
        assetName: 'Jarvis Core',
        status: 'failed',
        message: e?.message || 'Jarvis setup failed to apply',
      });
    }

    // =========================================================================
    // 6. JARVIS WALLPAPER — REACTIVE AWAKE VISUAL (Additive Layer)
    // =========================================================================
    try {
      const label = '6. Jarvis Reactive Wallpaper';
      const name = 'Jarvis 3D Energy Sphere (Additive Layer)';
      onStep?.({
        category: 'live_wallpaper',
        categoryLabel: label,
        assetName: name,
        status: 'applying',
        message: 'Calibrating audio-reactive 3D visual layer (base wallpaper preserved underneath)...',
        stepNumber: 6,
        totalSteps: 7,
      });
      await stepDelay();

      // Configure Assist Service to maintain reactive wallpaper layer over base wallpaper
      AssistService.saveConfig({
        isLiveWallpaperEnabled: true,
        liveWallpaperReactionState: 'idle',
      });

      items.push({
        category: 'live_wallpaper',
        categoryLabel: label,
        assetId: 'jarvis-reactive-v19',
        assetName: name,
        status: 'applied',
        message: 'Reactive visual layer active; responds to speech intensity, hidden during sleep.',
      });
      onStep?.({
        category: 'live_wallpaper',
        categoryLabel: label,
        assetName: name,
        status: 'applied',
        message: 'Reactive visual layer calibrated.',
        stepNumber: 6,
        totalSteps: 7,
      });
    } catch (e: any) {
      items.push({
        category: 'live_wallpaper',
        categoryLabel: '6. Jarvis Reactive Wallpaper',
        assetId: 'error',
        assetName: 'Reactive Visual Layer',
        status: 'failed',
        message: e?.message || 'Reactive wallpaper failed to calibrate',
      });
    }

    // =========================================================================
    // 7. ONEVA AI CAMERA — SPECIAL FOCUS (Dedicated Computational Photography Subsystem)
    // =========================================================================
    try {
      const label = '7. ONEVA AI Camera';
      const caps = OnevaAiCameraService.getDeviceCapabilities();
      const name = `ONEVA AI Camera (${caps.tier.toUpperCase()} Tier)`;
      onStep?.({
        category: 'camera',
        categoryLabel: label,
        assetName: name,
        status: 'applying',
        message: `Activating computational ISP, real-time scene recognition, & ${caps.tier.toUpperCase()} hardware adaptation...`,
        stepNumber: 7,
        totalSteps: 7,
      });
      await stepDelay();

      // Activate ONEVA AI Camera mode and computational ISP
      OnevaAiCameraService.updateSettings({
        isOnevaAiActive: true,
        sceneRecognitionEnabled: true,
        intelligentExposureEnabled: true,
        autoWhiteBalanceEnabled: true,
        computationalHdrEnabled: caps.supportsRealtimeHDR,
        multiFrameNoiseReductionEnabled: caps.supportsMultiFrameBurst,
        detailEnhancementEnabled: true,
        faceDetectionAutofocusEnabled: caps.supportsFaceTracking,
        stabilizationAssistanceEnabled: caps.supportsStabilization,
      });

      // Synchronize backward-compatible CameraService config
      CameraService.applyCameraConfig({
        profileName: name,
        dynamicRange: caps.tier === 'flagship' ? 'wide' : 'balanced',
        noiseReduction: 'high_frequency',
        toneCurve: 'vibrant_oled',
        zeroShutterLag: true,
      });

      items.push({
        category: 'camera',
        categoryLabel: label,
        assetId: `oneva-ai-cam-${caps.tier}`,
        assetName: name,
        status: 'applied',
        message: `ONEVA AI Camera active. Dedicated control entry enabled in camera navigation (PHOTO | VIDEO | ONEVA | MORE) with live ON/OFF comparison.`,
        detail: caps.description,
      });
      onStep?.({
        category: 'camera',
        categoryLabel: label,
        assetName: name,
        status: 'applied',
        message: 'ONEVA AI Camera calibrated and ready.',
        stepNumber: 7,
        totalSteps: 7,
      });
    } catch (e: any) {
      items.push({
        category: 'camera',
        categoryLabel: '7. ONEVA AI Camera',
        assetId: 'error',
        assetName: 'ONEVA AI Camera',
        status: 'failed',
        message: e?.message || 'ONEVA AI Camera failed to apply',
      });
    }

    // Supplementary: Synchronize OLED System Theme
    try {
      const themeAsset = defaults.theme;
      ThemeService.applyTheme({
        mode: (themeAsset?.payload?.mode as 'dark' | 'oled') || 'oled',
        luminance: (themeAsset?.payload?.luminance as string) || 'pure_black',
        accentColor: (themeAsset?.payload?.accentColor as string) || '#10b981',
        assetId: themeAsset?.id,
      });
      ThemeEngineService.applyTheme(themeAsset?.id || 'theme-b');
    } catch (e) {
      console.warn('[FullPackService] Theme sync warning:', e);
    }

    // Record authoritative FullPackSnapshot at this exact moment
    const appliedTimestamp = new Date().toISOString();
    const cameraCaps = OnevaAiCameraService.getDeviceCapabilities();

    const snapshot: FullPackSnapshot = {
      themeId: defaults.theme?.id || 'theme-b',
      themeName: defaults.theme?.name || 'OLED Pure Black',
      iconPackId: defaults.icon_pack?.id || 'pack-b',
      iconPackName: defaults.icon_pack?.name || 'Minimalist Vector Core',
      wallpaperId: defaults.wallpaper?.id || 'wp-b',
      wallpaperName: defaults.wallpaper?.name || 'Emerald Aurora OLED',
      widgetsQuickPanelId: 'widgets-quickpanel-v19',
      widgetsQuickPanelName: 'Modern Quick Panel & Floating Search Bar',
      keyboardAnimationId: defaults.keyboard?.id || 'kb-a',
      keyboardName: defaults.keyboard?.name || 'OLED Tactile Elevation',
      cameraId: `oneva-ai-cam-${cameraCaps.tier}`,
      cameraName: `ONEVA AI Camera (${cameraCaps.tier.toUpperCase()})`,
      aiCameraActive: true,
      aiCameraTier: cameraCaps.tier,
      jarvisId: defaults.assist?.id || 'jarvis-nova',
      jarvisName: defaults.assist?.name || 'Jarvis Autonomous Core',
      jarvisWallpaperId: 'jarvis-reactive-v19',
      jarvisReactiveVisualEnabled: true,
      appliedAt: appliedTimestamp,
    };

    // Save snapshot to Comparison Engine
    FullPackComparisonService.saveSnapshot(snapshot);

    // Update live User Customization State
    UserCustomizationService.setBulkState({
      theme: snapshot.themeId,
      icon_pack: snapshot.iconPackId,
      wallpaper: snapshot.wallpaperId,
      wallpaperSource: 'admin_pack',
      customWallpaperData: undefined,
      keyboard: snapshot.keyboardAnimationId,
      camera: snapshot.cameraId,
      jarvis: snapshot.jarvisId,
    });

    const appliedCount = items.filter((i) => i.status === 'applied').length;
    const warningCount = items.filter((i) => i.status === 'warning').length;
    const failedCount = items.filter((i) => i.status === 'failed').length;

    return {
      success: failedCount === 0,
      timestamp: appliedTimestamp,
      items,
      appliedCount,
      warningCount,
      failedCount,
    };
  }

  /**
   * Applies an individual component by step index (1-7) in the Guided Setup Wizard.
   */
  static async applyComponentByIndex(
    index: 1 | 2 | 3 | 4 | 5 | 6 | 7,
    options?: { cameraProviderId?: CameraProviderId }
  ): Promise<{ success: boolean; message: string; assetName: string }> {
    const defaults = AdminAssetService.getAllDefaults();

    switch (index) {
      case 1: { // Wallpaper
        const asset = defaults.wallpaper;
        const name = asset?.name || 'Emerald Aurora OLED';
        const res = WallpaperService.applyWallpaper({
          presetId: (asset?.payload?.presetId as string) || 'emerald-aurora',
          assetId: asset?.id,
        });
        return {
          success: res.success,
          message: res.message,
          assetName: name,
        };
      }

      case 2: { // Icon Pack
        const asset = defaults.icon_pack;
        const name = asset?.name || 'Minimalist Vector Core';
        const totalCatalog = AppCatalogService.getAllApps().length;
        const res = IconService.applyDefaultPack({
          packId: (asset?.payload?.packId as string) || 'pack_minimalist',
        });
        return {
          success: res.success,
          message: `Vector glyph engine mapped across all ${totalCatalog} catalog apps.`,
          assetName: name,
        };
      }

      case 3: { // Widgets + Quick Panel
        const currentWidgetsConfig = WidgetsSystemUIService.getConfig();
        WidgetsSystemUIService.saveConfig({
          quickSettings: {
            ...currentWidgetsConfig.quickSettings,
            tileShape: 'squircle',
            syncWithThemeAccent: true,
            customActiveColor: '#10b981',
            panelLuminance: 'oled',
          },
        });
        QuickPanelService.setGridColumns(4);
        QuickPanelService.setAccentColorSync(true);
        return {
          success: true,
          message: 'Quick Panel tile layout and futuristic widgets calibrated.',
          assetName: 'Modern Quick Panel & Widgets',
        };
      }

      case 4: { // Keyboard Theme
        const asset = defaults.keyboard;
        const name = asset?.name || 'OLED Tactile Elevation';
        const res = KeyboardService.applyDefaultKeyboard({
          themeId: (asset?.payload?.themeId as string) || 'oled-mono',
          animationType: (asset?.payload?.animationType as any) || 'elevation',
        });
        return {
          success: res.success,
          message: res.message,
          assetName: name,
        };
      }

      case 5: { // Jarvis Full Setup
        const asset = defaults.assist;
        const name = asset?.name || 'Jarvis Autonomous Core';
        const res = AssistService.applyJarvisDefault({
          assistantName: (asset?.payload?.assistantName as string) || 'Jarvis',
          wakeWord: (asset?.payload?.wakeWord as string) || 'Hey Jarvis',
          liveWallpaperEnabled: true,
          assetId: asset?.id,
        });
        await JarvisVoiceService.stopVoiceSystem();
        return {
          success: res.success,
          message: 'System-wide Jarvis core active with context-aware brevity & strict privacy.',
          assetName: name,
        };
      }

      case 6: { // Jarvis Reactive Wallpaper
        AssistService.saveConfig({
          isLiveWallpaperEnabled: true,
          liveWallpaperReactionState: 'idle',
        });
        return {
          success: true,
          message: 'Reactive visual layer active; responds to speech intensity, hidden during sleep.',
          assetName: 'Jarvis 3D Energy Sphere (Additive Layer)',
        };
      }

      case 7: { // ONEVA Camera
        const caps = OnevaAiCameraService.getDeviceCapabilities();
        const selectedId = options?.cameraProviderId || CameraProviderRegistry.getSelectedProvider().id;
        CameraProviderRegistry.setSelectedProvider(selectedId);
        const providerDef = CameraProviderRegistry.getSelectedProvider();

        // Configure Built-in Camera ISP parameters
        OnevaAiCameraService.updateSettings({
          isOnevaAiActive: true,
          sceneRecognitionEnabled: true,
          intelligentExposureEnabled: true,
          autoWhiteBalanceEnabled: true,
          computationalHdrEnabled: caps.supportsRealtimeHDR,
          multiFrameNoiseReductionEnabled: caps.supportsMultiFrameBurst,
          detailEnhancementEnabled: true,
          faceDetectionAutofocusEnabled: caps.supportsFaceTracking,
          stabilizationAssistanceEnabled: caps.supportsStabilization,
        });

        CameraService.applyCameraConfig({
          profileName: providerDef.displayName,
          dynamicRange: caps.tier === 'flagship' ? 'wide' : 'balanced',
          noiseReduction: 'high_frequency',
          toneCurve: 'vibrant_oled',
          zeroShutterLag: true,
        });

        return {
          success: true,
          message: `Camera configured to use ${providerDef.displayName}. Built-in camera calibrated as guaranteed fallback.`,
          assetName: providerDef.displayName,
        };
      }

      default:
        return {
          success: false,
          message: 'Unknown component step.',
          assetName: 'Unknown',
        };
    }
  }
}
