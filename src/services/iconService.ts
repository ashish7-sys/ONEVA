import { AdminAssetService } from './adminAssetService';
import { AdvancedIconSystem } from './advancedIconSystem';
import { SingleAppIconService } from './singleAppIconService';

export interface IconPack {
  id: string;
  name: string;
  tagline: string;
  glyphCount: number;
  style: 'vector_outline' | 'oled_glyph' | 'monochrome_slate' | 'neo_phosphor' | 'custom_zip';
  author: string;
  isApplied: boolean;
  isDefault?: boolean;
  manifestIcons?: Record<string, string>;
  extractedIcons?: Record<string, string>;
  previewDataUrl?: string;
}

export interface IconResolutionResult {
  tier: 1 | 2 | 3 | 4 | 5;
  tierName: string;
  sourceTier?: 'CUSTOM_ICON' | 'PACK_OVERRIDE' | 'GLOBAL_PACK' | 'CONFIGURABLE_FALLBACK' | 'NATIVE_APP_ICON' | 'SYSTEM_FALLBACK';
  iconName: string;
  iconDataUrl?: string;
  nativeIconUrl?: string;
  fallbackInitial?: string;
  sourceDescription: string;
  matchedInPack: boolean;
  packName?: string;
  isFallback: boolean;
  fallbackType?: 'themed_squircle' | 'original_system';
}

export interface IconSettings {
  activeGlobalPackId: string;
  fallbackShape: 'squircle' | 'rounded' | 'circle';
  fallbackStrategy?: 'configurable_fallback' | 'original_system';
  configurableFallbackOverrides?: Record<string, string>; // packageName -> fallback icon name or dataUrl
  individualAppIcons: Record<string, string>; // packageName -> iconName / override
  individualPackOverrides: Record<string, string>; // packageName -> packId
  showDynamicBadges: boolean;
}

const STORAGE_KEY = 'oneva_icon_settings';

export const ICON_PACKS: IconPack[] = [
  {
    id: 'pack_neon_light',
    name: 'Neon Light',
    tagline: 'Futuristic electroluminescent cyan & violet glyphs with ambient light contours',
    glyphCount: 1250,
    style: 'neo_phosphor',
    author: 'ONEVA Studio',
    isApplied: true,
    isDefault: true,
  },
  {
    id: 'oled-line-art',
    name: 'OLED Pure Line Art',
    tagline: 'Ultra-thin crisp white strokes on obsidian dark foundations',
    glyphCount: 980,
    style: 'oled_glyph',
    author: 'ONEVA Core',
    isApplied: false,
    isDefault: false,
  },
  {
    id: 'oneva-vector-core',
    name: 'Minimalist Vector Core',
    tagline: 'Refined 1.5px continuous geometric line icons with optical curve balance',
    glyphCount: 1420,
    style: 'vector_outline',
    author: 'ONEVA Design Lab',
    isApplied: false,
    isDefault: false,
  },
  {
    id: 'monochrome-slate',
    name: 'Monochrome Slate',
    tagline: 'Understated matte industrial tones for maximum cognitive calm',
    glyphCount: 1100,
    style: 'monochrome_slate',
    author: 'ONEVA Design Lab',
    isApplied: false,
    isDefault: false,
  },
];

const DEFAULT_SETTINGS: IconSettings = {
  activeGlobalPackId: 'pack_neon_light',
  fallbackShape: 'squircle',
  fallbackStrategy: 'configurable_fallback',
  configurableFallbackOverrides: {},
  individualAppIcons: {},
  individualPackOverrides: {},
  showDynamicBadges: true,
};

export class IconService {
  private static settings: IconSettings | null = null;
  private static listeners: Set<() => void> = new Set();

  static getSettings(): IconSettings {
    if (this.settings) return this.settings;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          let activeId = parsed.activeGlobalPackId;
          // Stale data migration: ensure Neon Light is default and prune obsolete demo pack references
          if (
            !activeId ||
            activeId === 'oneva-vector-core' ||
            activeId === 'pack_neon_style' ||
            activeId === 'pack_vector_outline' ||
            activeId.includes('glossy') ||
            activeId.includes('33')
          ) {
            activeId = 'pack_neon_light';
          }
          this.settings = { ...DEFAULT_SETTINGS, ...parsed, activeGlobalPackId: activeId };
          return this.settings;
        }
      } catch (err) {
        console.warn('[IconService] Failed to load icon settings:', err);
      }
    }

    this.settings = { ...DEFAULT_SETTINGS };
    return this.settings;
  }

  static saveSettings(updates: Partial<IconSettings>): void {
    const current = this.getSettings();
    this.settings = { ...current, ...updates };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      } catch (err) {
        console.warn('[IconService] Failed to save icon settings:', err);
      }
    }

    this.notify();
  }

  static getActivePackName(): string {
    const s = this.getSettings();
    const pack = this.getPacks().find((p) => p.id === s.activeGlobalPackId);
    return pack?.name || 'Neon Light';
  }

  static getActivePack(): IconPack {
    const s = this.getSettings();
    const pack = this.getPacks().find((p) => p.id === s.activeGlobalPackId);
    return pack || ICON_PACKS[0];
  }

  static getPacks(): IconPack[] {
    const s = this.getSettings();

    // Fetch published icon packs from AdminAssetService
    const adminPacks = AdminAssetService.getPublishedAssets('icon_pack');
    const dynamicPacks: IconPack[] = adminPacks
      .filter((asset) => {
        // Prune stale demo packs containing "glossy" or "33"
        const name = (asset.name || '').toLowerCase();
        const desc = (asset.description || '').toLowerCase();
        return !name.includes('glossy') && !desc.includes('33 application glyphs');
      })
      .map((asset) => {
        const manifest = asset.assets?.manifest;
        const extractedIcons = asset.assets?.extractedIcons;
        return {
          id: asset.id,
          name: asset.name,
          tagline: asset.description,
          glyphCount: asset.previewData?.glyphCount || (manifest ? Object.keys(manifest.icons).length : 500),
          style: 'custom_zip',
          author: asset.author || 'ONEVA Verified',
          isApplied: asset.id === s.activeGlobalPackId,
          isDefault: asset.isDefault,
          manifestIcons: manifest?.icons,
          extractedIcons: extractedIcons,
          previewDataUrl: asset.previewData?.previewDataUrl,
        };
      });

    // Merge static presets that are not duplicates of dynamic pack IDs
    const mergedStatic = ICON_PACKS.filter((p) => !dynamicPacks.some((d) => d.id === p.id));
    const all = [...mergedStatic, ...dynamicPacks];

    return all.map((p) => ({
      ...p,
      isApplied: p.id === s.activeGlobalPackId,
    }));
  }

  static setActiveGlobalPack(packId: string): void {
    this.saveSettings({ activeGlobalPackId: packId });
  }

  static applyDefaultPack(payload: { packId?: string }): { success: boolean; message: string } {
    const packs = this.getPacks();
    const defaultPack = packs.find((p) => p.isDefault) || packs[0];
    const packId = payload.packId || defaultPack?.id || 'pack_neon_light';

    this.setActiveGlobalPack(packId);
    const selected = packs.find((p) => p.id === packId) || defaultPack;
    return {
      success: true,
      message: `Global Icon Pack set to "${selected?.name || packId}".`,
    };
  }

  static resetAllIndividualAppIcons(): void {
    this.saveSettings({ individualAppIcons: {} });
  }

  static installOnlinePack(pack: IconPack): void {
    try {
      const key = 'oneva_user_installed_packs';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      if (!existing.some((p: IconPack) => p.id === pack.id)) {
        existing.push(pack);
        localStorage.setItem(key, JSON.stringify(existing));
      }
    } catch {}
    this.notify();
  }

  static setIndividualAppIcon(packageName: string, iconName: string | null): void {
    const s = this.getSettings();
    const individualAppIcons = { ...s.individualAppIcons };
    if (iconName) {
      individualAppIcons[packageName] = iconName;
    } else {
      delete individualAppIcons[packageName];
    }
    this.saveSettings({ individualAppIcons });
  }

  static setIndividualPackOverride(packageName: string, packId: string | null): void {
    const s = this.getSettings();
    const individualPackOverrides = { ...s.individualPackOverrides };
    if (packId) {
      individualPackOverrides[packageName] = packId;
    } else {
      delete individualPackOverrides[packageName];
    }
    this.saveSettings({ individualPackOverrides });
  }

  static setConfigurableFallback(packageName: string, fallbackIcon: string | null): void {
    const s = this.getSettings();
    const configurableFallbackOverrides = { ...(s.configurableFallbackOverrides || {}) };
    if (fallbackIcon) {
      configurableFallbackOverrides[packageName] = fallbackIcon;
      configurableFallbackOverrides[packageName.toLowerCase()] = fallbackIcon;
    } else {
      delete configurableFallbackOverrides[packageName];
      delete configurableFallbackOverrides[packageName.toLowerCase()];
    }
    this.saveSettings({ configurableFallbackOverrides });
  }

  static getConfigurableFallback(packageName: string): string | undefined {
    const s = this.getSettings();
    const normPkg = packageName.toLowerCase();
    return s.configurableFallbackOverrides?.[packageName] || s.configurableFallbackOverrides?.[normPkg];
  }

  /**
   * Rule 3 / Phase 18: Strict 5-Step Priority Chain with Fallback Handling
   * 1. Individual Custom Icon (user override for that specific app)
   *    ↓
   * 2. Individual Pack Override (specific pack selected for that app)
   *    ↓
   * 3. Selected Global Icon Pack (matching package in pack manifest)
   *    ↓
   * 4. Configurable Fallback Icon (adaptive / themed / masked / generated / user-provided)
   *    ↓
   * 5. Original App System Icon (native Android APK icon / untouched system icon)
   */
  static resolveAppIcon(
    packageOrOpts:
      | string
      | {
          packageName: string;
          originalIcon?: string;
          customIconId?: string;
          nativeIconDataUrl?: string;
          configurableFallbackId?: string;
        },
    originalIconArg?: string,
    nativeIconDataUrlArg?: string
  ): IconResolutionResult {
    let packageName: string;
    let originalIcon: string = originalIconArg || 'Smartphone';
    let nativeIconDataUrl: string | undefined = nativeIconDataUrlArg;
    let directCustomIconId: string | undefined = undefined;
    let directFallbackId: string | undefined = undefined;

    if (typeof packageOrOpts === 'object') {
      packageName = packageOrOpts.packageName;
      originalIcon = packageOrOpts.originalIcon || originalIconArg || 'Smartphone';
      nativeIconDataUrl = packageOrOpts.nativeIconDataUrl || nativeIconDataUrlArg;
      directCustomIconId = packageOrOpts.customIconId;
      directFallbackId = packageOrOpts.configurableFallbackId;
    } else {
      packageName = packageOrOpts;
    }

    const s = this.getSettings();
    const packs = this.getPacks();
    const normPkg = packageName.toLowerCase();

    // Check direct custom icon override if passed
    if (directCustomIconId) {
      return {
        tier: 1,
        tierName: 'Individual Custom Icon',
        sourceTier: 'CUSTOM_ICON',
        iconName: directCustomIconId,
        sourceDescription: 'User manual override for this specific application',
        matchedInPack: true,
        isFallback: false,
      };
    }

    // Check AdvancedIconSystem Single App Icon Override first (Phase 7 rule)
    const advUserState = AdvancedIconSystem.getUserState();
    const singleIconOverrideId = advUserState.singleAppIconOverrides[normPkg];
    if (singleIconOverrideId) {
      const singleOption = SingleAppIconService.getIconById(singleIconOverrideId);
      if (singleOption && singleOption.isEnabled) {
        return {
          tier: 1,
          tierName: 'Single App Icon Override',
          sourceTier: 'CUSTOM_ICON',
          iconName: singleOption.lucideIconName || originalIcon,
          iconDataUrl: singleOption.iconDataUrl || undefined,
          nativeIconUrl: singleOption.iconDataUrl || undefined,
          sourceDescription: `Single App Icon: ${singleOption.variantName}`,
          matchedInPack: true,
          isFallback: false,
        };
      }
    }

    // 1. Individual Custom Icon
    if (s.individualAppIcons[packageName] || s.individualAppIcons[normPkg]) {
      const customIcon = s.individualAppIcons[packageName] || s.individualAppIcons[normPkg];
      return {
        tier: 1,
        tierName: 'Individual Custom Icon',
        sourceTier: 'CUSTOM_ICON',
        iconName: customIcon,
        sourceDescription: 'User manual override for this specific application',
        matchedInPack: true,
        isFallback: false,
      };
    }

    // 2. Individual Pack Override
    if (s.individualPackOverrides[packageName] || s.individualPackOverrides[normPkg]) {
      const packId = s.individualPackOverrides[packageName] || s.individualPackOverrides[normPkg];
      const pack = packs.find((p) => p.id === packId);

      if (pack) {
        const hasMapping = pack.manifestIcons
          ? Boolean(pack.manifestIcons[packageName] || pack.manifestIcons[normPkg])
          : Boolean(pack.extractedIcons?.[packageName] || pack.extractedIcons?.[normPkg]);
        const iconDataUrl = pack.extractedIcons
          ? pack.extractedIcons[packageName] || pack.extractedIcons[normPkg]
          : undefined;

        if (hasMapping) {
          return {
            tier: 2,
            tierName: 'Individual Pack Override',
            sourceTier: 'PACK_OVERRIDE',
            iconName: (pack.manifestIcons && (pack.manifestIcons[packageName] || pack.manifestIcons[normPkg])) || originalIcon,
            iconDataUrl,
            nativeIconUrl: iconDataUrl,
            sourceDescription: `Pack override: ${pack.name}`,
            matchedInPack: true,
            packName: pack.name,
            isFallback: false,
          };
        }
      }
    }

    // 3. Selected Global Icon Pack
    const activePack = packs.find((p) => p.id === s.activeGlobalPackId);
    if (activePack) {
      const hasMapping = activePack.manifestIcons
        ? Boolean(activePack.manifestIcons[packageName] || activePack.manifestIcons[normPkg])
        : Boolean(activePack.extractedIcons?.[packageName] || activePack.extractedIcons?.[normPkg]);
      const iconDataUrl = activePack.extractedIcons
        ? activePack.extractedIcons[packageName] || activePack.extractedIcons[normPkg]
        : undefined;

      if (hasMapping) {
        return {
          tier: 3,
          tierName: 'Selected Global Icon Pack',
          sourceTier: 'GLOBAL_PACK',
          iconName:
            (activePack.manifestIcons && (activePack.manifestIcons[packageName] || activePack.manifestIcons[normPkg])) ||
            originalIcon,
          iconDataUrl,
          nativeIconUrl: iconDataUrl,
          sourceDescription: `Active global pack: ${activePack.name}`,
          matchedInPack: true,
          packName: activePack.name,
          isFallback: false,
        };
      }
    }

    // 4. Configurable Fallback Icon (Rule 3 Step 4: adaptive / themed / masked / generated / user-provided)
    const configuredFallback =
      directFallbackId ||
      s.configurableFallbackOverrides?.[packageName] ||
      s.configurableFallbackOverrides?.[normPkg];

    if (configuredFallback) {
      const isDataUrl =
        configuredFallback.startsWith('data:') ||
        configuredFallback.startsWith('/') ||
        configuredFallback.startsWith('http');

      return {
        tier: 4,
        tierName: 'Configurable Fallback Icon',
        sourceTier: 'CONFIGURABLE_FALLBACK',
        iconName: isDataUrl ? originalIcon : configuredFallback,
        iconDataUrl: isDataUrl ? configuredFallback : undefined,
        nativeIconUrl: isDataUrl ? configuredFallback : undefined,
        sourceDescription: `Configurable ${s.fallbackShape || 'squircle'} fallback (adaptive/themed override for unthemed app)`,
        matchedInPack: false,
        isFallback: true,
        fallbackType: 'themed_squircle',
      };
    }

    // 5. Original App System Icon (Rule 3 Step 5 / Valid Discovered Native Android Icon)
    const targetNativeIcon =
      nativeIconDataUrl ||
      (originalIcon && originalIcon !== 'Sparkles' && originalIcon !== 'Smartphone' ? originalIcon : undefined);

    if (targetNativeIcon) {
      const isDataUrl =
        targetNativeIcon.startsWith('data:') ||
        targetNativeIcon.startsWith('/') ||
        targetNativeIcon.startsWith('http');

      return {
        tier: 4,
        tierName: 'Valid Native Application Icon',
        sourceTier: 'NATIVE_APP_ICON',
        iconName: isDataUrl ? originalIcon : targetNativeIcon,
        iconDataUrl: isDataUrl ? targetNativeIcon : undefined,
        nativeIconUrl: targetNativeIcon,
        sourceDescription: 'Original Android application icon (active pack has no mapping)',
        matchedInPack: false,
        isFallback: true,
        fallbackType: 'original_system',
      };
    }

    // 5b. Default Themed Squircle Fallback Initial
    const initial = (packageName.split('.').pop() || packageName).charAt(0).toUpperCase();
    return {
      tier: 5,
      tierName: 'Configurable Fallback',
      sourceTier: 'SYSTEM_FALLBACK',
      iconName: originalIcon || 'Sparkles',
      fallbackInitial: initial,
      sourceDescription: `Themed ${s.fallbackShape || 'squircle'} fallback with system contrast tint (app icon not in active pack)`,
      matchedInPack: false,
      isFallback: true,
      fallbackType: 'themed_squircle',
    };
  }

  /**
   * Honest Android Launcher and Default Home Integration Status.
   * Mandate: NEVER fake system-level icon replacement on genuine Android OS.
   */
  static getAndroidLauncherStatus(): {
    isAppliedOnLauncherSurface: boolean;
    isSystemDefaultHome: boolean;
    explanation: string;
  } {
    return {
      isAppliedOnLauncherSurface: true,
      isSystemDefaultHome: false,
      explanation:
        'Icons apply live across the ONEVA Launcher surface, search drawer, and app launch workflows. Replacing device-wide home screen icons outside ONEVA requires setting ONEVA as the Default Home App in Android Settings.',
    };
  }

  private static isSubscribedToAdmin = false;

  private static ensureAdminSubscription(): void {
    if (this.isSubscribedToAdmin || typeof window === 'undefined') return;
    this.isSubscribedToAdmin = true;
    AdminAssetService.subscribe(() => {
      this.notify();
    });
  }

  static subscribe(listener: () => void): () => void {
    this.ensureAdminSubscription();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
