import { PlatformBridge } from '../launcher/services/platformBridge';
import { ThemeService } from './themeService';

export type SearchBarStyle =
  | 'futuristic_pill'
  | 'glass_blur'
  | 'minimal_outline'
  | 'oled_floating'
  | 'android_stock';

export type TileShape = 'squircle' | 'rounded' | 'pill' | 'circle';

export type BatteryStyle =
  | 'horizontal_pill'
  | 'circle_meter'
  | 'bold_percentage'
  | 'minimal';

export type WifiStyle = 'curved_waves' | 'tech_bars' | 'minimal';
export type SignalStyle = '5g_contour' | 'classic_stepped' | 'dot_matrix';
export type ClockStyle = 'modern_sans' | 'digital_mono' | 'dual_line_tech' | 'minimalist';
export type VolumePanelStyle = 'compact' | 'expanded' | 'neon_slider';
export type GesturePillStyle = 'thin' | 'wide' | 'floating' | 'hidden';

export interface SystemUIElementCapability {
  id: string;
  name: string;
  isSupported: boolean;
  supportTier: 'launcher_and_system_bridge' | 'system_overlay_bridge' | 'device_dependent' | 'unsupported_in_app';
  mechanism: string;
  limitations?: string;
}

export interface WidgetsSystemUIConfig {
  searchBar: {
    style: SearchBarStyle;
    showAssistantMic: boolean;
    showVoiceInput: boolean;
    backgroundOpacity: number;
    accentColor: string;
  };
  quickSettings: {
    tileShape: TileShape;
    syncWithThemeAccent: boolean;
    customActiveColor: string;
    backgroundBlur: number;
    panelLuminance: 'oled' | 'dark' | 'glass';
  };
  volumePanel: {
    style: VolumePanelStyle;
    panelPosition: 'right' | 'left';
    mediaVolume: number;
    ringtoneVolume: number;
    notificationVolume: number;
    alarmVolume: number;
    isMuted: boolean;
    isVibrate: boolean;
    accentColor: string;
  };
  statusAndIndicators: {
    batteryStyle: BatteryStyle;
    showBatteryPercentage: boolean;
    wifiStyle: WifiStyle;
    signalStyle: SignalStyle;
    showBluetoothGlyph: boolean;
    clockStyle: ClockStyle;
  };
  navigation: {
    mode: 'gestures' | '3_buttons';
    gesturePill: GesturePillStyle;
  };
  updatedAt: string;
}

const STORAGE_KEY = 'oneva_widgets_system_ui_config_v1';

export const SYSTEM_UI_CAPABILITIES: Record<string, SystemUIElementCapability> = {
  search_bar_launcher: {
    id: 'search_bar_launcher',
    name: 'Home / Launcher Search Bar',
    isSupported: true,
    supportTier: 'launcher_and_system_bridge',
    mechanism: 'Direct ONEVA Launcher surface & Quick Search Box provider',
  },
  search_bar_in_app: {
    id: 'search_bar_in_app',
    name: 'Third-Party In-App Search Bars',
    isSupported: false,
    supportTier: 'unsupported_in_app',
    mechanism: 'Not Supported: Android sandbox strictly isolates internal 3rd-party UI fields (e.g. inside Chrome, WhatsApp). ONEVA does NOT fake support.',
    limitations: 'Sandboxed by Android OS security policy.',
  },
  quick_settings_panel: {
    id: 'quick_settings_panel',
    name: 'Quick Settings / Notification Tiles',
    isSupported: true,
    supportTier: 'system_overlay_bridge',
    mechanism: 'Android System UI Overlay & Accessibility Quick Action Tile Service',
  },
  volume_panel_overlay: {
    id: 'volume_panel_overlay',
    name: 'System Volume Slider Panel',
    isSupported: true,
    supportTier: 'system_overlay_bridge',
    mechanism: 'Native Android AudioManager & Accessibility Volume Interception Bridge',
  },
  status_bar_indicators: {
    id: 'status_bar_indicators',
    name: 'Status Bar Battery & Network Glyphs',
    isSupported: true,
    supportTier: 'device_dependent',
    mechanism: 'Launcher status emulation & Android 12+ Monet System Color Bridge',
    limitations: 'Requires device support for custom status bar overlays.',
  },
  navigation_pill: {
    id: 'navigation_pill',
    name: 'Gesture Navigation Bar Pill',
    isSupported: true,
    supportTier: 'launcher_and_system_bridge',
    mechanism: 'ONEVA gesture coordinator & immersive system navigation bar bridge',
  },
};

const DEFAULT_CONFIG: WidgetsSystemUIConfig = {
  searchBar: {
    style: 'futuristic_pill',
    showAssistantMic: true,
    showVoiceInput: true,
    backgroundOpacity: 85,
    accentColor: '#06b6d4',
  },
  quickSettings: {
    tileShape: 'squircle',
    syncWithThemeAccent: true,
    customActiveColor: '#06b6d4',
    backgroundBlur: 24,
    panelLuminance: 'oled',
  },
  volumePanel: {
    style: 'compact',
    panelPosition: 'right',
    mediaVolume: 75,
    ringtoneVolume: 80,
    notificationVolume: 70,
    alarmVolume: 90,
    isMuted: false,
    isVibrate: false,
    accentColor: '#06b6d4',
  },
  statusAndIndicators: {
    batteryStyle: 'horizontal_pill',
    showBatteryPercentage: true,
    wifiStyle: 'curved_waves',
    signalStyle: '5g_contour',
    showBluetoothGlyph: true,
    clockStyle: 'modern_sans',
  },
  navigation: {
    mode: 'gestures',
    gesturePill: 'floating',
  },
  updatedAt: new Date().toISOString(),
};

export class WidgetsSystemUIService {
  private static config: WidgetsSystemUIConfig | null = null;
  private static listeners = new Set<() => void>();

  static getConfig(): WidgetsSystemUIConfig {
    if (this.config) return this.config;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
          return this.config;
        }
      } catch (e) {
        console.warn('[WidgetsSystemUIService] Read error:', e);
      }
    }

    this.config = { ...DEFAULT_CONFIG };
    return this.config;
  }

  static saveConfig(updates: Partial<WidgetsSystemUIConfig>): void {
    const current = this.getConfig();
    this.config = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } catch (e) {
        console.warn('[WidgetsSystemUIService] Save error:', e);
      }
    }

    this.notify();
  }

  static updateConfig(updates: Partial<WidgetsSystemUIConfig>): void {
    this.saveConfig(updates);
  }

  static applySystemUIPack(pack: { id: string; name: string; config: Partial<WidgetsSystemUIConfig> }): void {
    if (pack && pack.config) {
      this.saveConfig(pack.config);
    }
  }

  static updateSearchBar(updates: Partial<WidgetsSystemUIConfig['searchBar']>): void {
    const current = this.getConfig();
    this.saveConfig({
      searchBar: { ...current.searchBar, ...updates },
    });
    PlatformBridge.performHapticFeedback('light');
  }

  static updateQuickSettings(updates: Partial<WidgetsSystemUIConfig['quickSettings']>): void {
    const current = this.getConfig();
    this.saveConfig({
      quickSettings: { ...current.quickSettings, ...updates },
    });
    PlatformBridge.performHapticFeedback('light');
  }

  static updateVolumePanel(updates: Partial<WidgetsSystemUIConfig['volumePanel']>): void {
    const current = this.getConfig();
    this.saveConfig({
      volumePanel: { ...current.volumePanel, ...updates },
    });
    PlatformBridge.performHapticFeedback('light');
  }

  static updateStatusAndIndicators(
    updates: Partial<WidgetsSystemUIConfig['statusAndIndicators']>
  ): void {
    const current = this.getConfig();
    this.saveConfig({
      statusAndIndicators: { ...current.statusAndIndicators, ...updates },
    });
    PlatformBridge.performHapticFeedback('light');
  }

  static updateNavigation(updates: Partial<WidgetsSystemUIConfig['navigation']>): void {
    const current = this.getConfig();
    this.saveConfig({
      navigation: { ...current.navigation, ...updates },
    });
    PlatformBridge.performHapticFeedback('light');
  }

  static getActiveAccentColor(): string {
    const cfg = this.getConfig();
    if (cfg.quickSettings.syncWithThemeAccent) {
      return ThemeService.getConfig().accentColor || '#06b6d4';
    }
    return cfg.quickSettings.customActiveColor || '#06b6d4';
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
