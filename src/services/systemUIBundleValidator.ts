import JSZip from 'jszip';
import {
  WidgetsSystemUIConfig,
  SYSTEM_UI_CAPABILITIES,
  SearchBarStyle,
  TileShape,
  BatteryStyle,
  WifiStyle,
  SignalStyle,
  ClockStyle,
  VolumePanelStyle,
} from './widgetsSystemUIService';

export interface SystemUIValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  systemUiConfig?: Partial<WidgetsSystemUIConfig>;
  name?: string;
  description?: string;
  author?: string;
  previewDataUrl?: string;
  zipSize: number;
}

export class SystemUIBundleValidator {
  /**
   * Validates and parses an uploaded System UI / Widget ZIP bundle.
   * Expects:
   * 1. system_ui.json, widgets.json or manifest.json
   * 2. Optional preview screenshot (preview.png, widget_preview.png)
   */
  static async validateSystemUIZip(
    input: File | Blob | ArrayBuffer,
    fileName: string = 'system_ui_bundle.zip'
  ): Promise<SystemUIValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let previewDataUrl: string | undefined;
    let systemUiConfig: Partial<WidgetsSystemUIConfig> | undefined;
    let name = fileName.replace(/\.zip$/i, '').replace(/[_-]/g, ' ');
    let description = 'Custom System UI & Widget configuration bundle.';
    let author = 'ONEVA Community Designer';

    const zipSize = input instanceof File || input instanceof Blob ? input.size : input.byteLength;

    if (zipSize === 0) {
      return {
        isValid: false,
        errors: ['Uploaded ZIP bundle is empty (0 bytes).'],
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
        errors: [`Corrupt or invalid ZIP archive: ${err?.message || 'Decompression failed'}`],
        warnings: [],
        zipSize,
      };
    }

    // 1. Look for system_ui.json or widgets.json or manifest.json
    const configJson =
      zip.file('system_ui.json') || zip.file('widgets.json') || zip.file('manifest.json');

    if (configJson) {
      try {
        const rawText = await configJson.async('text');
        const parsed = JSON.parse(rawText);

        if (parsed.name) name = parsed.name;
        if (parsed.description) description = parsed.description;
        if (parsed.author) author = parsed.author;

        systemUiConfig = {
          searchBar: {
            style: (parsed.searchBar?.style as SearchBarStyle) || 'futuristic_pill',
            showAssistantMic: parsed.searchBar?.showAssistantMic ?? true,
            showVoiceInput: parsed.searchBar?.showVoiceInput ?? true,
            backgroundOpacity: parsed.searchBar?.backgroundOpacity ?? 0.85,
            accentColor: parsed.searchBar?.accentColor || '#10b981',
          },
          quickSettings: {
            tileShape: (parsed.quickSettings?.tileShape as TileShape) || 'squircle',
            syncWithThemeAccent: parsed.quickSettings?.syncWithThemeAccent ?? true,
            customActiveColor: parsed.quickSettings?.customActiveColor || '#10b981',
            backgroundBlur: parsed.quickSettings?.backgroundBlur ?? 16,
            panelLuminance: parsed.quickSettings?.panelLuminance || 'oled',
          },
          volumePanel: {
            style: (parsed.volumePanel?.style as VolumePanelStyle) || 'compact',
            panelPosition: parsed.volumePanel?.panelPosition || 'right',
            mediaVolume: parsed.volumePanel?.mediaVolume ?? 70,
            ringtoneVolume: parsed.volumePanel?.ringtoneVolume ?? 80,
            notificationVolume: parsed.volumePanel?.notificationVolume ?? 80,
            alarmVolume: parsed.volumePanel?.alarmVolume ?? 100,
            isMuted: parsed.volumePanel?.isMuted ?? false,
            isVibrate: parsed.volumePanel?.isVibrate ?? false,
            accentColor: parsed.volumePanel?.accentColor || '#10b981',
          },
          statusAndIndicators: {
            batteryStyle: (parsed.statusAndIndicators?.batteryStyle as BatteryStyle) || 'horizontal_pill',
            showBatteryPercentage: parsed.statusAndIndicators?.showBatteryPercentage ?? true,
            wifiStyle: (parsed.statusAndIndicators?.wifiStyle as WifiStyle) || 'tech_bars',
            signalStyle: (parsed.statusAndIndicators?.signalStyle as SignalStyle) || '5g_contour',
            showBluetoothGlyph: parsed.statusAndIndicators?.showBluetoothGlyph ?? true,
            clockStyle: (parsed.statusAndIndicators?.clockStyle as ClockStyle) || 'digital_mono',
          },
        };
      } catch (err: any) {
        errors.push(`Failed to parse configuration JSON: ${err?.message}`);
      }
    } else {
      warnings.push('No system_ui.json found in bundle root. Initialized with default ONEVA System UI blueprint.');
      systemUiConfig = {
        searchBar: {
          style: 'futuristic_pill',
          showAssistantMic: true,
          showVoiceInput: true,
          backgroundOpacity: 0.9,
          accentColor: '#06b6d4',
        },
        quickSettings: {
          tileShape: 'squircle',
          syncWithThemeAccent: true,
          customActiveColor: '#06b6d4',
          backgroundBlur: 20,
          panelLuminance: 'oled',
        },
        volumePanel: {
          style: 'neon_slider',
          panelPosition: 'right',
          mediaVolume: 75,
          ringtoneVolume: 80,
          notificationVolume: 80,
          alarmVolume: 100,
          isMuted: false,
          isVibrate: false,
          accentColor: '#06b6d4',
        },
        statusAndIndicators: {
          batteryStyle: 'horizontal_pill',
          showBatteryPercentage: true,
          wifiStyle: 'tech_bars',
          signalStyle: '5g_contour',
          showBluetoothGlyph: true,
          clockStyle: 'digital_mono',
        },
      };
    }

    // 2. Look for preview screenshot
    const previewFile =
      zip.file(/^preview\.(png|jpg|jpeg|webp)$/i)[0] ||
      zip.file(/^screenshot\.(png|jpg|jpeg|webp)$/i)[0] ||
      zip.file(/^widget_preview\.(png|jpg|jpeg|webp)$/i)[0];

    if (previewFile) {
      try {
        const ext = previewFile.name.split('.').pop()?.toLowerCase() || 'png';
        const mime = ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
        const base64 = await previewFile.async('base64');
        previewDataUrl = `data:${mime};base64,${base64}`;
      } catch (err: any) {
        warnings.push(`Could not decode preview image: ${err?.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      systemUiConfig,
      name,
      description,
      author,
      previewDataUrl,
      zipSize,
    };
  }

  /**
   * Helper generator to construct a verified, real ONEVA_SYSTEM_UI_BUNDLE.zip
   */
  static async createSampleSystemUIZip(variant: string = 'Neon Cyber System UI'): Promise<Blob> {
    const zip = new JSZip();

    const configData = {
      name: variant,
      author: 'ONEVA Core Design Team',
      version: '1.0.0',
      description: 'Precision Quick Settings tiles, discrete neon volume HUD, and mono-digital status indicators.',
      searchBar: {
        style: 'futuristic_pill',
        showAssistantMic: true,
        showVoiceInput: true,
        backgroundOpacity: 0.85,
        accentColor: '#10b981',
      },
      quickSettings: {
        tileShape: 'squircle',
        syncWithThemeAccent: true,
        customActiveColor: '#10b981',
        backgroundBlur: 20,
        panelLuminance: 'oled',
      },
      volumePanel: {
        style: 'neon_slider',
        panelPosition: 'right',
        mediaVolume: 75,
        ringtoneVolume: 80,
        notificationVolume: 80,
        alarmVolume: 100,
        isMuted: false,
        isVibrate: false,
        accentColor: '#10b981',
      },
      statusAndIndicators: {
        batteryStyle: 'horizontal_pill',
        showBatteryPercentage: true,
        wifiStyle: 'tech_bars',
        signalStyle: '5g_contour',
        showBluetoothGlyph: true,
        clockStyle: 'digital_mono',
      },
    };

    zip.file('system_ui.json', JSON.stringify(configData, null, 2));

    // Generate a clean preview graphic on canvas
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, 600, 400);

      // Title
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(variant.toUpperCase(), 30, 50);

      // Quick Settings simulation tiles
      for (let i = 0; i < 4; i++) {
        const x = 30 + i * 135;
        const y = 80;
        ctx.fillStyle = i === 0 || i === 2 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.06)';
        ctx.strokeStyle = i === 0 || i === 2 ? '#10b981' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, 125, 75, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = i === 0 || i === 2 ? '#34d399' : '#a3a3a3';
        ctx.font = 'bold 13px sans-serif';
        const labels = ['Wi-Fi 6', 'Bluetooth', 'Jarvis AI', 'Do Not Disturb'];
        ctx.fillText(labels[i], x + 12, y + 42);
      }

      // Volume slider simulation
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.roundRect(30, 180, 535, 60, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(35, 185, 380, 50, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.fillText('Media Volume — 75%', 50, 215);

      // Status Bar indicators simulation
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.roundRect(30, 260, 535, 50, 12);
      ctx.fill();

      ctx.fillStyle = '#f5f5f5';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('09:41', 50, 290);
      ctx.fillText('5G  |  Wi-Fi  |  [ 94% ]', 370, 290);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (blob) {
        zip.file('preview.png', blob);
      }
    }

    zip.file(
      'README.md',
      `# ${variant}
ONEVA System UI Specification Archive.
Contains:
- system_ui.json: Precision parameters for Quick Settings tiles, Volume HUD, and Status indicators.
- preview.png: Vector showcase snapshot.`
    );

    return await zip.generateAsync({ type: 'blob' });
  }
}
