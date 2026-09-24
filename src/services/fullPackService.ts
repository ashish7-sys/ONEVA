import { AdminAssetService, ASSET_CATEGORIES } from './adminAssetService';
import { ThemeService } from './themeService';
import { ThemeEngineService } from './themeEngineService';
import { IconService } from './iconService';
import { KeyboardService } from './keyboardService';
import { WallpaperService } from './wallpaperService';
import { CameraService } from './cameraService';
import { AssistService } from './assistService';
import { UserCustomizationService } from './userCustomizationService';
import { FullPackComparisonService } from './fullPackComparisonService';
import { FullPackSnapshot } from '../types/fullPack';
import { OnevaAssetCategory, FullPackExecutionResult, FullPackItemStatus } from '../types/adminAssets';

export type FullPackStepListener = (step: {
  category: OnevaAssetCategory;
  categoryLabel: string;
  assetName: string;
  status: 'applying' | 'applied' | 'warning' | 'failed';
  message: string;
}) => void;

export class FullPackService {
  /**
   * Retrieves the current published Admin default assets across all 9 categories.
   * Dynamically resolved from the Admin Asset Registry.
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
   * Executes the Full ONEVA Pack application:
   * - Queries each independent module with its Admin-selected default
   * - Enforces failure isolation (errors in one module do not break the others)
   * - Provides live step-by-step progress callbacks
   */
  static async applyFullPack(onStep?: FullPackStepListener): Promise<FullPackExecutionResult> {
    const defaults = AdminAssetService.getAllDefaults();
    const items: FullPackItemStatus[] = [];

    // Helper for simulating slight step delay for smooth visual feedback in UI
    const stepDelay = () => new Promise((resolve) => setTimeout(resolve, 140));

    // 1. THEME MODULE
    try {
      const asset = defaults.theme;
      const label = 'Themes';
      const name = asset?.name || 'OLED Pure Black';
      onStep?.({ category: 'theme', categoryLabel: label, assetName: name, status: 'applying', message: 'Calibrating OLED pure black luminance...' });
      await stepDelay();

      const res = ThemeService.applyTheme({
        mode: (asset?.payload?.mode as 'dark' | 'oled') || 'oled',
        luminance: (asset?.payload?.luminance as string) || 'pure_black',
        accentColor: (asset?.payload?.accentColor as string) || '#10b981',
        assetId: asset?.id,
      });

      items.push({
        category: 'theme',
        categoryLabel: label,
        assetId: asset?.id || 'default',
        assetName: name,
        status: res.success ? 'applied' : 'failed',
        message: res.message,
      });
      onStep?.({ category: 'theme', categoryLabel: label, assetName: name, status: 'applied', message: res.message });
    } catch (e: any) {
      items.push({
        category: 'theme',
        categoryLabel: 'Themes',
        assetId: 'error',
        assetName: 'Theme Calibration',
        status: 'failed',
        message: e?.message || 'Theme failed to apply',
      });
    }

    // 2. ICON PACK MODULE
    try {
      const asset = defaults.icon_pack;
      const label = 'Icon Packs';
      const name = asset?.name || 'Neon Light';
      onStep?.({ category: 'icon_pack', categoryLabel: label, assetName: name, status: 'applying', message: 'Loading vector glyph manifest...' });
      await stepDelay();

      const res = IconService.applyDefaultPack({
        packId: (asset?.payload?.packId as string) || 'pack_neon_light',
      });

      items.push({
        category: 'icon_pack',
        categoryLabel: label,
        assetId: asset?.id || 'default',
        assetName: name,
        status: res.success ? 'applied' : 'failed',
        message: res.message,
      });
      onStep?.({ category: 'icon_pack', categoryLabel: label, assetName: name, status: 'applied', message: res.message });
    } catch (e: any) {
      items.push({
        category: 'icon_pack',
        categoryLabel: 'Icon Packs',
        assetId: 'error',
        assetName: 'Icon Pack',
        status: 'failed',
        message: e?.message || 'Icon pack failed to apply',
      });
    }

    // 3. KEYBOARD MODULE
    try {
      const asset = defaults.keyboard;
      const label = 'Keyboard';
      const name = asset?.name || 'OLED Tactile Elevation';
      onStep?.({ category: 'keyboard', categoryLabel: label, assetName: name, status: 'applying', message: 'Staging tactile keycaps & elevation animation...' });
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
      onStep?.({ category: 'keyboard', categoryLabel: label, assetName: name, status: 'applied', message: res.message });
    } catch (e: any) {
      items.push({
        category: 'keyboard',
        categoryLabel: 'Keyboard',
        assetId: 'error',
        assetName: 'Keyboard',
        status: 'failed',
        message: e?.message || 'Keyboard failed to apply',
      });
    }

    // 4. WALLPAPERS MODULE
    try {
      const asset = defaults.wallpaper;
      const label = 'Wallpapers';
      const name = asset?.name || 'Emerald Aurora OLED';
      onStep?.({ category: 'wallpaper', categoryLabel: label, assetName: name, status: 'applying', message: 'Applying OLED high-contrast background...' });
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
      onStep?.({ category: 'wallpaper', categoryLabel: label, assetName: name, status: 'applied', message: res.message });
    } catch (e: any) {
      items.push({
        category: 'wallpaper',
        categoryLabel: 'Wallpapers',
        assetId: 'error',
        assetName: 'Wallpaper',
        status: 'failed',
        message: e?.message || 'Wallpaper failed to apply',
      });
    }

    // 5. CAMERA ENHANCEMENT CONFIGURATION (Modular foundation)
    try {
      const asset = defaults.camera;
      const label = 'Camera';
      const name = asset?.name || 'Low-Light Neutral OLED Color Match';
      onStep?.({ category: 'camera', categoryLabel: label, assetName: name, status: 'applying', message: 'Configuring computational dynamic range curve...' });
      await stepDelay();

      const res = CameraService.applyCameraConfig({
        profileName: asset?.name || 'Low-Light Neutral OLED Color Match',
        dynamicRange: (asset?.payload?.dynamicRange as any) || 'balanced',
        noiseReduction: (asset?.payload?.noiseReduction as any) || 'high_frequency',
        colorTempK: (asset?.payload?.colorTempK as number) || 6500,
        zeroShutterLag: (asset?.payload?.zeroShutterLag as boolean) ?? true,
        activeAssetId: asset?.id,
      });

      items.push({
        category: 'camera',
        categoryLabel: label,
        assetId: asset?.id || 'default',
        assetName: name,
        status: 'applied',
        message: res.message,
        detail: res.note,
      });
      onStep?.({ category: 'camera', categoryLabel: label, assetName: name, status: 'applied', message: res.message });
    } catch (e: any) {
      items.push({
        category: 'camera',
        categoryLabel: 'Camera',
        assetId: 'error',
        assetName: 'Camera',
        status: 'failed',
        message: e?.message || 'Camera config failed to apply',
      });
    }

    // 8. ONEVA ASSIST / JARVIS (With Live Wallpaper Foundation)
    try {
      const asset = defaults.assist;
      const label = 'ONEVA Assist / Jarvis';
      const name = asset?.name || 'Default Jarvis Experience with Reactive Live Wallpaper';
      onStep?.({ category: 'assist', categoryLabel: label, assetName: name, status: 'applying', message: 'Configuring Jarvis private wake engine & reactive wallpaper...' });
      await stepDelay();

      const res = AssistService.applyJarvisDefault({
        assistantName: (asset?.payload?.assistantName as string) || 'Jarvis',
        wakeWord: (asset?.payload?.wakeWord as string) || 'Hey Jarvis',
        liveWallpaperEnabled: (asset?.payload?.liveWallpaperEnabled as boolean) ?? true,
        assetId: asset?.id,
      });

      items.push({
        category: 'assist',
        categoryLabel: label,
        assetId: asset?.id || 'default',
        assetName: name,
        status: res.success ? 'applied' : 'failed',
        message: res.message,
      });
      onStep?.({ category: 'assist', categoryLabel: label, assetName: name, status: 'applied', message: res.message });
    } catch (e: any) {
      items.push({
        category: 'assist',
        categoryLabel: 'ONEVA Assist / Jarvis',
        assetId: 'error',
        assetName: 'Jarvis Core',
        status: 'failed',
        message: e?.message || 'Jarvis failed to apply',
      });
    }

    // 7. Synchronize Theme Engine if theme asset ID exists
    const themeAssetId = defaults.theme?.id || 'theme-b';
    ThemeEngineService.applyTheme(themeAssetId);

    // 8. Record authoritative FullPackSnapshot at this exact moment
    const appliedTimestamp = new Date().toISOString();
    const snapshot: FullPackSnapshot = {
      themeId: defaults.theme?.id || 'theme-b',
      themeName: defaults.theme?.name || 'OLED Pure Black',
      iconPackId: defaults.icon_pack?.id || 'pack-b',
      iconPackName: defaults.icon_pack?.name || 'Minimalist Vector Core',
      wallpaperId: defaults.wallpaper?.id || 'wp-b',
      wallpaperName: defaults.wallpaper?.name || 'Emerald Aurora OLED',
      keyboardAnimationId: defaults.keyboard?.id || 'kb-a',
      keyboardName: defaults.keyboard?.name || 'OLED Tactile Elevation',
      cameraId: defaults.camera?.id || 'cam-b',
      cameraName: defaults.camera?.name || 'Low-Light Neutral OLED Color Match',
      jarvisId: defaults.assist?.id || 'jarvis-nova',
      jarvisName: defaults.assist?.name || 'Jarvis Reactive Core',
      appliedAt: appliedTimestamp,
    };

    // Save snapshot to independent Comparison Engine
    FullPackComparisonService.saveSnapshot(snapshot);

    // Update live User Customization State to reflect all applied defaults
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
}
