/**
 * ONEVA Phase 18: Dedicated Quick Panel Customization Subsystem
 * 
 * Manages the Android Quick Settings / Quick Panel tile grid, states,
 * custom tile glyph overrides, theme accent synchronizations, and safe fallbacks.
 * 
 * ARCHITECTURAL RULE (Section 9):
 * Keeps Quick Panel icons strictly separated from App Icon Packs and Theme App Icons.
 */

import { ThemeService } from './themeService';

export type QuickTileId =
  | 'wifi'
  | 'bluetooth'
  | 'mobile_data'
  | 'flashlight'
  | 'airplane_mode'
  | 'do_not_disturb'
  | 'hotspot'
  | 'night_light'
  | 'sound_mode'
  | 'battery_saver'
  | 'auto_rotate'
  | 'location'
  | 'screen_cast'
  | 'nfc';

export type QuickTileState = 'active' | 'inactive' | 'unavailable';

export interface QuickPanelTile {
  id: QuickTileId;
  label: string;
  iconName: string;
  customIconGlyph?: string;
  state: QuickTileState;
  isActive: boolean;
  category: 'connectivity' | 'device' | 'display' | 'audio' | 'privacy';
  description: string;
  order: number;
}

export interface QuickPanelConfig {
  gridColumns: 3 | 4;
  tiles: QuickPanelTile[];
  accentColorSync: boolean;
  activeTileCustomAccent?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'oneva_quick_panel_config_v18';

export const DEFAULT_QUICK_TILES: QuickPanelTile[] = [
  {
    id: 'wifi',
    label: 'Wi-Fi',
    iconName: 'Wifi',
    state: 'active',
    isActive: true,
    category: 'connectivity',
    description: 'Local wireless network connectivity',
    order: 0,
  },
  {
    id: 'bluetooth',
    label: 'Bluetooth',
    iconName: 'Bluetooth',
    state: 'active',
    isActive: true,
    category: 'connectivity',
    description: 'Short-range wireless device pairing',
    order: 1,
  },
  {
    id: 'mobile_data',
    label: 'Mobile Data',
    iconName: 'Radio',
    state: 'active',
    isActive: true,
    category: 'connectivity',
    description: 'Cellular carrier data connection',
    order: 2,
  },
  {
    id: 'flashlight',
    label: 'Flashlight',
    iconName: 'Flashlight',
    state: 'inactive',
    isActive: false,
    category: 'device',
    description: 'Rear camera LED illumination',
    order: 3,
  },
  {
    id: 'sound_mode',
    label: 'Sound Mode',
    iconName: 'Volume2',
    state: 'active',
    isActive: true,
    category: 'audio',
    description: 'Ringer and vibration profile',
    order: 4,
  },
  {
    id: 'auto_rotate',
    label: 'Auto-Rotate',
    iconName: 'RotateCw',
    state: 'active',
    isActive: true,
    category: 'display',
    description: 'Screen orientation gyroscope lock',
    order: 5,
  },
  {
    id: 'battery_saver',
    label: 'Battery Saver',
    iconName: 'BatteryCharging',
    state: 'inactive',
    isActive: false,
    category: 'device',
    description: 'Restricts background CPU and lowers screen refresh rate',
    order: 6,
  },
  {
    id: 'airplane_mode',
    label: 'Airplane Mode',
    iconName: 'Plane',
    state: 'inactive',
    isActive: false,
    category: 'connectivity',
    description: 'Disables all radio frequency transmissions',
    order: 7,
  },
  {
    id: 'do_not_disturb',
    label: 'Do Not Disturb',
    iconName: 'BellOff',
    state: 'inactive',
    isActive: false,
    category: 'audio',
    description: 'Silences all notifications except priority alarms',
    order: 8,
  },
  {
    id: 'night_light',
    label: 'Night Light',
    iconName: 'Moon',
    state: 'inactive',
    isActive: false,
    category: 'display',
    description: 'Warm color temperature filter for low-light viewing',
    order: 9,
  },
  {
    id: 'hotspot',
    label: 'Hotspot',
    iconName: 'Share2',
    state: 'inactive',
    isActive: false,
    category: 'connectivity',
    description: 'Shares internet connection with other devices',
    order: 10,
  },
  {
    id: 'location',
    label: 'Location',
    iconName: 'MapPin',
    state: 'active',
    isActive: true,
    category: 'privacy',
    description: 'GPS and satellite positioning services',
    order: 11,
  },
];

export class QuickPanelService {
  private static config: QuickPanelConfig | null = null;
  private static listeners: Set<() => void> = new Set();
  private static isInitialized = false;

  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.getConfig();
  }

  static getConfig(): QuickPanelConfig {
    if (this.config) return this.config;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.tiles) && parsed.tiles.length > 0) {
            this.config = parsed;
            return this.config!;
          }
        }
      } catch (e) {
        console.warn('[QuickPanelService] Storage load fallback:', e);
      }
    }

    this.config = {
      gridColumns: 4,
      tiles: [...DEFAULT_QUICK_TILES],
      accentColorSync: true,
      updatedAt: new Date().toISOString(),
    };
    return this.config;
  }

  /**
   * Toggles a quick settings tile state between active and inactive
   */
  static toggleTile(tileId: QuickTileId): { success: boolean; newState: QuickTileState } {
    const cfg = this.getConfig();
    const tile = cfg.tiles.find((t) => t.id === tileId);
    if (!tile) {
      return { success: false, newState: 'unavailable' };
    }

    const nextActive = !tile.isActive;
    tile.isActive = nextActive;
    tile.state = nextActive ? 'active' : 'inactive';
    cfg.updatedAt = new Date().toISOString();

    this.persist();
    this.notify();
    return { success: true, newState: tile.state };
  }

  /**
   * Sets a quick settings tile explicitly to active or inactive
   */
  static setTileState(tileId: QuickTileId, active: boolean): void {
    const cfg = this.getConfig();
    const tile = cfg.tiles.find((t) => t.id === tileId);
    if (!tile) return;
    tile.isActive = active;
    tile.state = active ? 'active' : 'inactive';
    cfg.updatedAt = new Date().toISOString();

    this.persist();
    this.notify();
  }

  /**
   * Reorders tiles safely without dropping unlisted items
   */
  static reorderTiles(orderedTileIds: QuickTileId[]): void {
    const cfg = this.getConfig();
    const idMap = new Map(cfg.tiles.map((t) => [t.id, t]));

    const newOrdered: QuickPanelTile[] = [];
    orderedTileIds.forEach((id, idx) => {
      const tile = idMap.get(id);
      if (tile) {
        tile.order = idx;
        newOrdered.push(tile);
        idMap.delete(id);
      }
    });

    // Append any remaining tiles not in the ordered list
    idMap.forEach((tile) => {
      tile.order = newOrdered.length;
      newOrdered.push(tile);
    });

    cfg.tiles = newOrdered;
    cfg.updatedAt = new Date().toISOString();
    this.persist();
    this.notify();
  }

  /**
   * Sets custom icon override for a single tile (Strictly isolated from App Icon Packs)
   */
  static setTileCustomGlyph(tileId: QuickTileId, glyphName: string | undefined): boolean {
    const cfg = this.getConfig();
    const tile = cfg.tiles.find((t) => t.id === tileId);
    if (!tile) return false;

    tile.customIconGlyph = glyphName;
    cfg.updatedAt = new Date().toISOString();
    this.persist();
    this.notify();
    return true;
  }

  /**
   * Sets grid column layout (3 or 4 tiles per row)
   */
  static setGridColumns(cols: 3 | 4): void {
    const cfg = this.getConfig();
    cfg.gridColumns = cols;
    cfg.updatedAt = new Date().toISOString();
    this.persist();
    this.notify();
  }

  /**
   * Returns current effective tile active color, adhering to ThemeService accent
   */
  static getEffectiveAccentColor(): string {
    const cfg = this.getConfig();
    if (cfg.accentColorSync) {
      return ThemeService.getConfig().accentColor || '#10b981';
    }
    return cfg.activeTileCustomAccent || '#10b981';
  }

  /**
   * Toggles theme accent color synchronization
   */
  static setAccentColorSync(enabled: boolean, customColor?: string): void {
    const cfg = this.getConfig();
    cfg.accentColorSync = enabled;
    if (customColor) {
      cfg.activeTileCustomAccent = customColor;
    }
    cfg.updatedAt = new Date().toISOString();
    this.persist();
    this.notify();
  }

  /**
   * Resets Quick Panel configuration to default factory state
   */
  static resetToDefaults(): void {
    this.config = {
      gridColumns: 4,
      tiles: DEFAULT_QUICK_TILES.map((t, idx) => ({ ...t, order: idx })),
      accentColorSync: true,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    this.notify();
  }

  /**
   * Safe fallback resolver for quick panel tile icon names
   */
  static resolveTileIconName(tile: QuickPanelTile): string {
    // 1. Check custom tile glyph override
    if (tile.customIconGlyph && tile.customIconGlyph.trim().length > 0) {
      return tile.customIconGlyph.trim();
    }
    // 2. Default tile icon
    if (tile.iconName && tile.iconName.trim().length > 0) {
      return tile.iconName;
    }
    // 3. Fallback safe icon
    return 'Sliders';
  }

  private static persist(): void {
    if (typeof window !== 'undefined' && this.config) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } catch (e) {
        console.warn('[QuickPanelService] Failed to persist configuration:', e);
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
    this.listeners.forEach((fn) => fn());
  }
}
