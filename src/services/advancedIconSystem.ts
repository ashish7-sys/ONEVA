import {
  FullIconPack,
  IconPackImportSummary,
  UserIconState,
  ResolvedAppIconResult,
} from '../types/catalogAndIcons';
import { AppCatalogService } from './appCatalogService';
import { SingleAppIconService } from './singleAppIconService';
import { AdminAssetService } from './adminAssetService';
import { IconPackValidator } from './iconPackValidator';
import { getSupabaseClient } from '../supabase/client';

const STORAGE_PACKS_KEY = 'oneva_full_icon_packs_v7';
const STORAGE_USER_STATE_KEY = 'oneva_user_icon_state_v7';

// Mandatory Default Icon Pack: "Neon Light" (50 catalog apps matched)
const neonLightMappings: Record<string, string> = {};
const neonLightExtracted: Record<string, string> = {};

try {
  AppCatalogService.getAllApps().forEach((app) => {
    const pkg = app.packageName.toLowerCase();
    neonLightMappings[pkg] = `icons/${app.iconKey || app.packageName + '.svg'}`;
    neonLightExtracted[pkg] = app.defaultIcon;
  });
} catch (e) {
  console.warn('[AdvancedIconSystem] AppCatalogService init note:', e);
}

export const SEED_FULL_ICON_PACKS: FullIconPack[] = [
  {
    id: 'pack_neon_light',
    name: 'Neon Light',
    description: 'Luminescent cyber vector icon contours mapped across all 50 system applications.',
    version: '1.0.0',
    author: 'ONEVA System',
    status: 'published',
    isDefault: true,
    glyphCount: Object.keys(neonLightMappings).length || 50,
    previewImages: [],
    iconMappings: neonLightMappings,
    extractedIcons: neonLightExtracted,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
];

const DEFAULT_USER_STATE: UserIconState = {
  activeFullPackId: 'pack_neon_light',
  singleAppIconOverrides: {},
  fallbackShape: 'squircle',
};

export class AdvancedIconSystem {
  private static packs: FullIconPack[] | null = null;
  private static userState: UserIconState | null = null;
  private static listeners: Set<() => void> = new Set();

  /**
   * Return all managed Full Icon Packs
   */
  static getAllPacks(): FullIconPack[] {
    if (this.packs) return this.packs;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_PACKS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.packs = parsed;
            return this.packs;
          }
        }
      } catch (err) {
        console.warn('[AdvancedIconSystem] Failed to load cached packs:', err);
      }
    }

    this.packs = [...SEED_FULL_ICON_PACKS];
    this.persistPacks();
    return this.packs;
  }

  /**
   * Get user icon settings & active overrides
   */
  static getUserState(): UserIconState {
    if (this.userState) return this.userState;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_USER_STATE_KEY);
        if (raw) {
          this.userState = { ...DEFAULT_USER_STATE, ...JSON.parse(raw) };
          return this.userState;
        }
      } catch (err) {
        console.warn('[AdvancedIconSystem] Failed to load user state:', err);
      }
    }

    this.userState = { ...DEFAULT_USER_STATE };
    return this.userState;
  }

  /**
   * Save user icon state changes
   */
  static saveUserState(updates: Partial<UserIconState>): void {
    const current = this.getUserState();
    this.userState = { ...current, ...updates };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_USER_STATE_KEY, JSON.stringify(this.userState));
      } catch (err) {
        console.warn('[AdvancedIconSystem] Failed to save user state:', err);
      }
    }

    this.notify();
  }

  /**
   * Set active full icon pack for the user
   */
  static applyFullIconPack(packId: string | null): void {
    this.saveUserState({ activeFullPackId: packId });
  }

  /**
   * Set single app icon override (highest priority)
   */
  static setSingleAppOverride(packageName: string, singleIconOptionId: string | null): void {
    const s = this.getUserState();
    const overrides = { ...s.singleAppIconOverrides };

    if (singleIconOptionId) {
      overrides[packageName.toLowerCase()] = singleIconOptionId;
    } else {
      delete overrides[packageName.toLowerCase()];
    }

    this.saveUserState({ singleAppIconOverrides: overrides });
  }

  /**
   * Alias for setSingleAppOverride
   */
  static setSingleAppIconOverride(packageName: string, singleIconOptionId: string | null): void {
    this.setSingleAppOverride(packageName, singleIconOptionId);
  }

  /**
   * Clear single app icon override for a package (falls back to Full Pack, then Original)
   */
  static removeSingleAppOverride(packageName: string): void {
    this.setSingleAppOverride(packageName, null);
  }

  /**
   * RULE 9: Strict Priority Resolution System
   * 
   * Single App Icon Override
   *         ↓
   *   Full Icon Pack
   *         ↓
   *  Original App Icon
   */
  static resolveAppIcon(packageName: string): ResolvedAppIconResult {
    const normPkg = packageName.toLowerCase();
    const userState = this.getUserState();
    const catalogApp = AppCatalogService.getAppByPackage(normPkg);
    const originalLabel = catalogApp?.name || packageName;

    // 1. Check Single App Icon Override
    const overrideId = userState.singleAppIconOverrides[normPkg];
    if (overrideId) {
      const option = SingleAppIconService.getIconById(overrideId);
      if (option && option.isEnabled) {
        return {
          tier: 1,
          tierName: 'Single App Icon Override',
          source: 'single_app_override',
          iconType: option.iconDataUrl ? 'image' : 'lucide',
          iconValue: option.iconDataUrl || option.lucideIconName || 'Sparkles',
          label: originalLabel,
          variantName: option.variantName,
        };
      }
    }

    // 2. Check Active Full Icon Pack
    if (userState.activeFullPackId) {
      const allPacks = this.getAllPacks();
      const pack = allPacks.find((p) => p.id === userState.activeFullPackId);
      if (pack && pack.status === 'published') {
        const hasMapping = Boolean(pack.iconMappings[normPkg]);
        if (hasMapping) {
          const extracted = pack.extractedIcons?.[normPkg];
          return {
            tier: 2,
            tierName: 'Full Icon Pack',
            source: 'full_pack',
            iconType: extracted ? 'image' : 'lucide',
            iconValue: extracted || catalogApp?.defaultIcon || 'Package',
            label: originalLabel,
            packName: pack.name,
          };
        }
      }
    }

    // 3. Fall back to Original App Icon
    return {
      tier: 3,
      tierName: 'Original App Icon',
      source: 'original',
      iconType: catalogApp?.defaultIconType === 'image' ? 'image' : 'lucide',
      iconValue: catalogApp?.defaultIcon || 'Smartphone',
      label: originalLabel,
    };
  }

  /**
   * Admin: Add an app mapping to an existing Full Icon Pack
   */
  static async addAppToFullPack(
    packId: string,
    packageName: string,
    relativeFilePathOrDataUrl: string
  ): Promise<{ success: boolean; pack?: FullIconPack; error?: string }> {
    const packs = this.getAllPacks();
    const pack = packs.find((p) => p.id === packId);
    if (!pack) {
      return { success: false, error: `Icon pack "${packId}" not found.` };
    }

    const normPkg = packageName.trim().toLowerCase();
    const updatedMappings = { ...pack.iconMappings, [normPkg]: relativeFilePathOrDataUrl };
    const updatedExtracted = { ...pack.extractedIcons };
    if (relativeFilePathOrDataUrl.startsWith('data:')) {
      updatedExtracted[normPkg] = relativeFilePathOrDataUrl;
    }

    const updated: FullIconPack = {
      ...pack,
      iconMappings: updatedMappings,
      extractedIcons: updatedExtracted,
      glyphCount: Object.keys(updatedMappings).length,
      updatedAt: new Date().toISOString(),
    };

    const idx = packs.findIndex((p) => p.id === packId);
    packs[idx] = updated;
    this.packs = [...packs];
    this.persistPacks();
    this.notify();

    return { success: true, pack: updated };
  }

  /**
   * Admin: Create/Upload a new Full Icon Pack with validation and import summary
   */
  static async importFullPackFromZip(
    zipFile: File | Blob,
    fileName: string = 'pack.zip'
  ): Promise<{
    success: boolean;
    pack?: FullIconPack;
    summary: IconPackImportSummary;
    errors: string[];
  }> {
    const validation = await IconPackValidator.validateIconPackZip(zipFile, fileName);
    const catalogApps = AppCatalogService.getAllApps();
    const catalogSet = new Set(catalogApps.map((a) => a.packageName.toLowerCase()));

    const totalInZip = validation.iconCount;
    let matched = 0;
    let unmatched = 0;
    const matchedPackages: string[] = [];
    const unmatchedPackages: string[] = [];

    const iconMappings: Record<string, string> = {};
    const extractedIcons: Record<string, string> = validation.extractedIcons || {};

    if (validation.manifest?.icons) {
      for (const [pkg, path] of Object.entries(validation.manifest.icons)) {
        const normPkg = pkg.toLowerCase();
        iconMappings[normPkg] = path;

        if (catalogSet.has(normPkg)) {
          matched++;
          matchedPackages.push(normPkg);
        } else {
          unmatched++;
          unmatchedPackages.push(normPkg);
        }
      }
    }

    const summary: IconPackImportSummary = {
      totalInZip,
      imported: Object.keys(iconMappings).length,
      matched,
      unmatched,
      invalid: validation.errors.length,
      unmatchedPackages,
      matchedPackages,
      invalidEntries: validation.errors,
    };

    if (!validation.isValid || !validation.manifest) {
      return {
        success: false,
        summary,
        errors: validation.errors,
      };
    }

    const now = new Date().toISOString();
    const newPack: FullIconPack = {
      id: validation.manifest.packId || `pack-${Date.now().toString(36)}`,
      name: validation.manifest.name,
      description: validation.manifest.description || `Validated full pack with ${totalInZip} icons.`,
      version: validation.manifest.version || '1.0.0',
      author: validation.manifest.author || 'ONEVA Verified Publisher',
      status: 'published',
      isDefault: false,
      glyphCount: totalInZip,
      previewImages: validation.previewDataUrl ? [validation.previewDataUrl] : [],
      iconMappings,
      extractedIcons,
      createdAt: now,
      updatedAt: now,
    };

    const packs = this.getAllPacks();
    const existingIdx = packs.findIndex((p) => p.id === newPack.id);
    if (existingIdx >= 0) {
      packs[existingIdx] = newPack;
    } else {
      packs.unshift(newPack);
    }

    this.packs = [...packs];
    this.persistPacks();

    // Automatically register matched icons into SingleAppIconService in one fast batched pass
    const batchOptions = Object.entries(extractedIcons)
      .filter(([_, dataUrl]) => Boolean(dataUrl))
      .map(([pkg, dataUrl]) => ({
        appPackageName: pkg,
        variantName: newPack.name,
        iconDataUrl: dataUrl,
        iconType: 'image' as const,
        author: newPack.author,
        ownership: 'admin' as const,
        packId: newPack.id,
      }));

    if (batchOptions.length > 0) {
      await SingleAppIconService.addIconOptionsBatch(batchOptions);
    }

    this.notify();

    // Register in AdminAssetService with matching packId for immediate system-wide availability
    try {
      await AdminAssetService.registerValidatedIconPack(
        { ...validation.manifest, packId: newPack.id },
        validation,
        {
          fileName,
          status: 'published',
          isDefault: false,
        }
      );
    } catch (err) {
      console.warn('[AdvancedIconSystem] AdminAssetService sync note:', err);
    }

    return {
      success: true,
      pack: newPack,
      summary,
      errors: [],
    };
  }

  /**
   * Admin: Create a new pack manually
   */
  static async createPack(data: {
    name: string;
    description: string;
    version: string;
    author?: string;
  }): Promise<{ success: boolean; pack?: FullIconPack; error?: string }> {
    if (!data.name.trim()) return { success: false, error: 'Pack name is required.' };

    const newId = `pack-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const newPack: FullIconPack = {
      id: newId,
      name: data.name.trim(),
      description: data.description.trim(),
      version: data.version || '1.0.0',
      author: data.author || 'ONEVA Admin',
      status: 'published',
      isDefault: false,
      glyphCount: 0,
      previewImages: [],
      iconMappings: {},
      createdAt: now,
      updatedAt: now,
    };

    const packs = this.getAllPacks();
    this.packs = [newPack, ...packs];
    this.persistPacks();
    this.notify();

    return { success: true, pack: newPack };
  }

  /**
   * Admin: Update pack metadata
   */
  static async updatePack(
    packId: string,
    updates: Partial<Omit<FullIconPack, 'id' | 'createdAt'>>
  ): Promise<{ success: boolean; pack?: FullIconPack; error?: string }> {
    const packs = this.getAllPacks();
    const idx = packs.findIndex((p) => p.id === packId);
    if (idx === -1) return { success: false, error: `Pack "${packId}" not found.` };

    const updated: FullIconPack = {
      ...packs[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    packs[idx] = updated;
    this.packs = [...packs];
    this.persistPacks();
    this.notify();

    return { success: true, pack: updated };
  }

  /**
   * Admin: Set an icon pack as the active default for Full ONEVA Pack
   */
  static async setDefaultPack(packId: string): Promise<{ success: boolean; error?: string }> {
    const packs = this.getAllPacks();
    const pack = packs.find((p) => p.id === packId);
    if (!pack) return { success: false, error: 'Pack not found.' };

    const updatedPacks: FullIconPack[] = packs.map((p) => ({
      ...p,
      isDefault: p.id === packId,
      status: p.id === packId ? ('published' as const) : p.status,
    }));

    this.packs = updatedPacks;
    this.persistPacks();

    // Set as active full pack for user state
    this.applyFullIconPack(packId);

    // Synchronize with AdminAssetService category defaults
    try {
      const adminAssets = AdminAssetService.getAssetsByCategory('icon_pack', false);
      const match = adminAssets.find(
        (a) => a.id === packId || a.payload?.packId === packId || a.name.toLowerCase().includes(pack.name.toLowerCase())
      );
      if (match) {
        await AdminAssetService.setDefaultAsset('icon_pack', match.id);
      }
    } catch (err) {
      console.warn('[AdvancedIconSystem] Sync with AdminAssetService warning:', err);
    }

    this.notify();
    return { success: true };
  }

  /**
   * Admin: Delete pack
   */
  static async deletePack(packId: string): Promise<{ success: boolean; error?: string }> {
    const packs = this.getAllPacks();
    const pack = packs.find((p) => p.id === packId);
    if (!pack) return { success: false, error: 'Pack not found.' };

    if (pack.isDefault) {
      return { success: false, error: 'Cannot delete the active default icon pack.' };
    }

    this.packs = packs.filter((p) => p.id !== packId);
    this.persistPacks();

    // Clean up single app icons extracted specifically for this pack
    SingleAppIconService.deleteIconsForPack(packId);

    // Reset active pack if deleted
    const userState = this.getUserState();
    if (userState.activeFullPackId === packId) {
      this.applyFullIconPack('pack_neon_light');
    } else {
      this.notify();
    }

    return { success: true };
  }

  private static persistPacks(): void {
    if (typeof window !== 'undefined' && this.packs) {
      try {
        localStorage.setItem(STORAGE_PACKS_KEY, JSON.stringify(this.packs));
      } catch (err) {
        console.warn('[AdvancedIconSystem] Failed to persist full packs (quota limit), saving sanitized packs:', err);
        try {
          const sanitized = this.packs.map((p) => ({
            ...p,
            extractedIcons: undefined, // Preserved in memory and AssetStorageService
          }));
          localStorage.setItem(STORAGE_PACKS_KEY, JSON.stringify(sanitized));
        } catch {
          // ignore
        }
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
    for (const l of this.listeners) {
      try {
        l();
      } catch (err) {
        console.error('[AdvancedIconSystem] Listener error:', err);
      }
    }
  }
}
