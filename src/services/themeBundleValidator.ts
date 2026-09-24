import JSZip from 'jszip';
import { OnevaThemeDefinition, IconPackManifest, IconPackValidationResult } from '../types/adminAssets';
import { IconPackValidator } from './iconPackValidator';
import { AppCatalogService } from './appCatalogService';

export interface ThemeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  themeDefinition?: OnevaThemeDefinition;
  wallpaperDataUrl?: string;
  wallpaperType?: 'image' | 'video';
  isLiveWallpaper?: boolean;
  previewDataUrl?: string;
  previews?: string[];
  iconPackResult?: IconPackValidationResult;
  iconPackManifest?: IconPackManifest;
  extractedIcons?: Record<string, string>;
  hasIcons?: boolean;
  hasWallpaper?: boolean;
  zipSize: number;
}

export class ThemeBundleValidator {
  /**
   * Validates and automatically parses an uploaded Theme ZIP bundle.
   * Expects:
   * 1. theme.json or manifest.json with theme definitions
   * 2. Optional wallpaper image or video (in wallpaper/ or root)
   * 3. Optional icons (nested icon-pack.zip or icon files in icons/)
   * 4. Optional preview screenshots (in previews/ or root)
   */
  static async validateThemeZip(
    input: File | Blob | ArrayBuffer,
    fileName: string = 'theme_bundle.zip'
  ): Promise<ThemeValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let wallpaperDataUrl: string | undefined;
    let wallpaperType: 'image' | 'video' = 'image';
    let isLiveWallpaper: boolean = false;
    let previewDataUrl: string | undefined;
    const previews: string[] = [];
    let themeDefinition: OnevaThemeDefinition | undefined;
    let iconPackResult: IconPackValidationResult | undefined;
    let iconPackManifest: IconPackManifest | undefined;
    let extractedIcons: Record<string, string> = {};

    const zipSize = input instanceof File || input instanceof Blob ? input.size : input.byteLength;

    if (zipSize === 0) {
      return {
        isValid: false,
        errors: ['Uploaded ZIP bundle is completely empty (0 bytes).'],
        warnings: [],
        zipSize: 0,
      };
    }

    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(input);
    } catch (err: any) {
      return {
        isValid: false,
        errors: [`Corrupt or invalid ZIP archive: ${err?.message || 'Failed to decompress'}`],
        warnings: [],
        zipSize,
      };
    }

    // 1. Check for theme.json or manifest.json
    const themeJsonFile = zip.file('theme.json') || zip.file('manifest.json');
    if (themeJsonFile) {
      try {
        const text = await themeJsonFile.async('text');
        const parsed = JSON.parse(text);

        if (!parsed.name) {
          errors.push('Theme specification missing "name" field.');
        }

        themeDefinition = {
          id: parsed.id || `theme-${Date.now()}`,
          name: parsed.name || fileName.replace(/\.zip$/i, ''),
          description: parsed.description || 'Custom ONEVA theme bundle.',
          version: parsed.version || '1.0.0',
          author: parsed.author || 'ONEVA Verified Designer',
          rating: parsed.rating || 9,
          colors: {
            primary: parsed.colors?.primary || '#050a14',
            accent: parsed.colors?.accent || '#06b6d4',
            surface: parsed.colors?.surface || '#0c1322',
            background: parsed.colors?.background || '#020408',
            border: parsed.colors?.border || '#1e293b',
            text: parsed.colors?.text || '#f8fafc',
          },
          appearance: {
            mode: parsed.appearance?.mode === 'dark' ? 'dark' : 'oled',
            luminance: parsed.appearance?.luminance || 'pure_black',
            oledBlack: parsed.appearance?.oledBlack ?? true,
            contrastRatio: parsed.appearance?.contrastRatio || 14.5,
          },
          quickSettings: parsed.quickSettings || {
            tileShape: 'squircle',
            activeTileColor: parsed.colors?.accent || '#06b6d4',
            panelLuminance: 'oled',
          },
          systemUi: parsed.systemUi || {
            searchBarStyle: 'futuristic_pill',
            volumePanelStyle: 'neon_slider',
            statusBarStyle: 'minimal',
            batteryStyle: 'horizontal_pill',
            wifiStyle: 'tech_bars',
            signalStyle: '5g_contour',
            clockStyle: 'digital_mono',
          },
        };
      } catch (err: any) {
        errors.push(`Failed to parse theme.json: ${err?.message || 'Invalid JSON format'}`);
      }
    } else {
      warnings.push('No theme.json found in ZIP root. Auto-generating theme definition from bundled assets.');
      const cleanName = fileName.replace(/\.zip$/i, '').replace(/[_-]/g, ' ');
      themeDefinition = {
        id: `theme-${Date.now()}`,
        name: cleanName || 'Custom OLED Theme',
        description: 'Auto-calibrated OLED theme package from uploaded archive.',
        version: '1.0.0',
        author: 'Imported Theme Package',
        rating: 9,
        colors: {
          primary: '#050a14',
          accent: '#06b6d4',
          surface: '#0c1322',
          background: '#020408',
          border: '#1e293b',
          text: '#f8fafc',
        },
        appearance: {
          mode: 'oled',
          luminance: 'pure_black',
          oledBlack: true,
          contrastRatio: 16.2,
        },
        quickSettings: {
          tileShape: 'squircle',
          activeTileColor: '#06b6d4',
          panelLuminance: 'oled',
        },
        systemUi: {
          searchBarStyle: 'futuristic_pill',
          volumePanelStyle: 'neon_slider',
          statusBarStyle: 'minimal',
          batteryStyle: 'horizontal_pill',
          wifiStyle: 'tech_bars',
          signalStyle: '5g_contour',
          clockStyle: 'digital_mono',
        },
      };
    }

    // 2. Extract Wallpaper (Image OR Video)
    // Check for video wallpaper first
    const videoWallpaperFile =
      zip.file(/(^|\/)(wallpaper|background|live_wallpaper)\.(mp4|webm)$/i)[0] ||
      zip.file(/^wallpaper\/.*\.(mp4|webm)$/i)[0] ||
      zip.file(/\.(mp4|webm)$/i)[0];

    if (videoWallpaperFile) {
      try {
        const ext = videoWallpaperFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const mime = ext === 'webm' ? 'video/webm' : 'video/mp4';
        const base64 = await videoWallpaperFile.async('base64');
        wallpaperDataUrl = `data:${mime};base64,${base64}`;
        wallpaperType = 'video';
        isLiveWallpaper = true;
      } catch (err: any) {
        warnings.push(`Could not decode bundled video wallpaper: ${err?.message}`);
      }
    } else {
      // Check for static image wallpaper
      const imageWallpaperFile =
        zip.file(/(^|\/)(wallpaper|background)\.(png|jpg|jpeg|webp)$/i)[0] ||
        zip.file(/^wallpapers?\/.*\.(png|jpg|jpeg|webp)$/i)[0] ||
        zip.file(/^assets\/.*(wallpaper|background).*\.(png|jpg|jpeg|webp)$/i)[0];

      if (imageWallpaperFile) {
        try {
          const ext = imageWallpaperFile.name.split('.').pop()?.toLowerCase() || 'png';
          const mime = ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
          const base64 = await imageWallpaperFile.async('base64');
          wallpaperDataUrl = `data:${mime};base64,${base64}`;
          wallpaperType = 'image';
          isLiveWallpaper = false;
        } catch (err: any) {
          warnings.push(`Could not decode bundled wallpaper image: ${err?.message}`);
        }
      }
    }

    // 3. Extract Icon Pack (nested zip OR icons directory)
    const nestedIconZip =
      zip.file(/^icons\/.*\.zip$/i)[0] ||
      zip.file(/(^|\/)icon[-_]pack\.zip$/i)[0];

    if (nestedIconZip) {
      try {
        const iconZipBlob = await nestedIconZip.async('blob');
        iconPackResult = await IconPackValidator.validateIconPackZip(iconZipBlob, nestedIconZip.name);
        if (iconPackResult.isValid) {
          iconPackManifest = iconPackResult.manifest;
          extractedIcons = iconPackResult.extractedIcons || {};
        } else {
          warnings.push(`Bundled icon pack ZIP could not be parsed: ${iconPackResult.errors.join(', ')}`);
        }
      } catch (err: any) {
        warnings.push(`Could not extract bundled icon pack archive: ${err?.message}`);
      }
    } else {
      // Look for individual icon files inside icons/
      const iconFiles = zip.file(/^icons\/.*\.(png|svg|webp|jpg)$/i);
      if (iconFiles.length > 0) {
        const catalogApps = AppCatalogService.getAllApps();
        const verifiedPackages: string[] = [];

        for (const f of iconFiles) {
          const fileNameWithExt = f.name.split('/').pop() || '';
          const baseName = fileNameWithExt.substring(0, fileNameWithExt.lastIndexOf('.')) || fileNameWithExt;
          const clean = baseName.toLowerCase().replace(/^(ic_|icon_|app_)/, '').replace(/[^a-z0-9]/g, '');

          // Match against canonical ONEVA catalog
          let matched = catalogApps.find(
            (a) =>
              a.packageName.toLowerCase() === baseName.toLowerCase() ||
              a.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean ||
              a.iconKey?.replace(/\.svg$/i, '').replace(/[^a-z0-9]/g, '') === clean
          );

          if (!matched) {
            matched = catalogApps.find((a) => {
              const parts = a.packageName.toLowerCase().split('.');
              return parts.includes(clean);
            });
          }

          if (matched) {
            try {
              const ext = fileNameWithExt.split('.').pop()?.toLowerCase() || 'png';
              const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'webp' ? 'image/webp' : 'image/png';
              const b64 = await f.async('base64');
              const dataUrl = `data:${mime};base64,${b64}`;
              extractedIcons[matched.packageName] = dataUrl;
              if (!verifiedPackages.includes(matched.packageName)) {
                verifiedPackages.push(matched.packageName);
              }
            } catch {}
          }
        }

        if (verifiedPackages.length > 0) {
          iconPackManifest = {
            packId: `icons-${Date.now()}`,
            name: `${themeDefinition?.name || 'Theme'} Icons`,
            author: themeDefinition?.author || 'ONEVA Verified Designer',
            version: '1.0.0',
            description: `Coordinated vector icon pack extracted from ${themeDefinition?.name || 'Theme'}.`,
            icons: extractedIcons,
          };
          iconPackResult = {
            isValid: true,
            errors: [],
            warnings: [],
            manifest: iconPackManifest,
            iconCount: verifiedPackages.length,
            verifiedPackages,
            extractedIcons,
            previewDataUrl: Object.values(extractedIcons)[0],
            zipSize: 0,
          };
        }
      }
    }

    // 4. Extract Previews (from previews/ folder or root preview files)
    const previewFiles = zip.file(/^previews\/.*\.(png|jpg|jpeg|webp)$/i);
    for (const pf of previewFiles) {
      try {
        const ext = pf.name.split('.').pop()?.toLowerCase() || 'png';
        const mime = ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
        const b64 = await pf.async('base64');
        previews.push(`data:${mime};base64,${b64}`);
      } catch {}
    }

    if (previews.length > 0) {
      previewDataUrl = previews[0];
    } else {
      const rootPreview =
        zip.file(/^preview\.(png|jpg|jpeg|webp)$/i)[0] ||
        zip.file(/^preview_home\.(png|jpg|jpeg|webp)$/i)[0] ||
        zip.file(/^thumbnail\.(png|jpg|jpeg|webp)$/i)[0];

      if (rootPreview) {
        try {
          const ext = rootPreview.name.split('.').pop()?.toLowerCase() || 'png';
          const mime = ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
          const b64 = await rootPreview.async('base64');
          previewDataUrl = `data:${mime};base64,${b64}`;
          previews.push(previewDataUrl);
        } catch (err: any) {
          warnings.push(`Could not decode bundled preview: ${err?.message}`);
        }
      } else if (wallpaperDataUrl && wallpaperType === 'image') {
        previewDataUrl = wallpaperDataUrl;
        previews.push(previewDataUrl);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      themeDefinition,
      wallpaperDataUrl,
      wallpaperType,
      isLiveWallpaper,
      previewDataUrl,
      previews,
      iconPackResult,
      iconPackManifest,
      extractedIcons,
      hasIcons: !!(iconPackResult && iconPackResult.iconCount > 0),
      hasWallpaper: !!wallpaperDataUrl,
      zipSize,
    };
  }

  /**
   * Helper generator to construct a verified, real ONEVA_THEME_BUNDLE.zip
   * with Wallpaper, Icons, and Previews for real end-to-end testing
   */
  static async createSampleThemeZip(themeName: string = 'ONEVA Studio Horizon OLED'): Promise<Blob> {
    const zip = new JSZip();

    const manifestData = {
      name: themeName,
      author: 'ONEVA Studio Core',
      version: '1.0.0',
      description: 'Futuristic OLED theme bundle engineered for pure pitch blacks and vivid reactive cyan accents.',
      rating: 10,
      colors: {
        primary: '#030712',
        accent: '#06b6d4',
        surface: '#090f1e',
        background: '#000000',
        border: '#162033',
        text: '#f1f5f9',
      },
      appearance: {
        mode: 'oled',
        luminance: 'pure_black',
        oledBlack: true,
        contrastRatio: 18.5,
      },
      quickSettings: {
        tileShape: 'squircle',
        activeTileColor: '#06b6d4',
        panelLuminance: 'oled',
      },
      systemUi: {
        searchBarStyle: 'futuristic_pill',
        volumePanelStyle: 'neon_slider',
        statusBarStyle: 'minimal',
        batteryStyle: 'horizontal_pill',
        wifiStyle: 'tech_bars',
        signalStyle: '5g_contour',
        clockStyle: 'digital_mono',
      },
    };

    zip.file('theme.json', JSON.stringify(manifestData, null, 2));

    // Generate a clean minimalist canvas wallpaper
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 2400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // OLED background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1080, 2400);

      // Subtle cyan radial glow
      const grad = ctx.createRadialGradient(540, 900, 20, 540, 900, 750);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
      grad.addColorStop(0.5, 'rgba(3, 7, 18, 0.85)');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 2400);

      // Grid line accents
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 2;
      for (let y = 300; y < 2100; y += 120) {
        ctx.beginPath();
        ctx.moveTo(80, y);
        ctx.lineTo(1000, y);
        ctx.stroke();
      }

      // ONEVA branding
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ONEVA OLED MATRIX', 540, 1100);

      const base64Data = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
      zip.file('wallpaper/wallpaper.png', base64Data, { base64: true });
      zip.file('previews/preview-1.png', base64Data, { base64: true });
    }

    // Generate sample icons for YouTube, WhatsApp, Instagram, Chrome, Camera, Settings
    const iconApps = [
      { pkg: 'com.google.android.youtube', label: 'YT', color: '#ef4444' },
      { pkg: 'com.whatsapp', label: 'WA', color: '#22c55e' },
      { pkg: 'com.instagram.android', label: 'IG', color: '#e1306c' },
      { pkg: 'com.android.chrome', label: 'CH', color: '#3b82f6' },
      { pkg: 'com.android.camera', label: 'CAM', color: '#06b6d4' },
      { pkg: 'com.android.settings', label: 'SET', color: '#8b5cf6' },
      { pkg: 'com.google.android.calculator', label: 'CALC', color: '#f59e0b' },
    ];

    const iconCanvas = document.createElement('canvas');
    iconCanvas.width = 192;
    iconCanvas.height = 192;
    const iconCtx = iconCanvas.getContext('2d');

    if (iconCtx) {
      for (const item of iconApps) {
        iconCtx.clearRect(0, 0, 192, 192);

        // Dark squircle background
        iconCtx.fillStyle = '#0a0f1d';
        iconCtx.beginPath();
        iconCtx.roundRect(16, 16, 160, 160, 36);
        iconCtx.fill();

        // Neon border
        iconCtx.strokeStyle = item.color;
        iconCtx.lineWidth = 4;
        iconCtx.stroke();

        // Text monogram
        iconCtx.fillStyle = item.color;
        iconCtx.font = 'bold 44px sans-serif';
        iconCtx.textAlign = 'center';
        iconCtx.textBaseline = 'middle';
        iconCtx.fillText(item.label, 96, 96);

        const iconB64 = iconCanvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
        zip.file(`icons/${item.pkg}.png`, iconB64, { base64: true });
      }
    }

    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  }
}

