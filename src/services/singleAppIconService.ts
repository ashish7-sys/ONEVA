import { SingleAppIconOption } from '../types/catalogAndIcons';
import { getSupabaseClient } from '../supabase/client';

const STORAGE_SINGLE_ICONS_KEY = 'oneva_single_app_icons_v7';

// Seed initial rich sets of single app icon options for multiple key apps
export const SEED_SINGLE_APP_ICONS: SingleAppIconOption[] = [
  // WhatsApp single app variants
  {
    id: 'single-wa-neon',
    appPackageName: 'com.whatsapp',
    variantName: 'Neon Emerald',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'MessageCircle',
    previewColor: '#25d366',
    order: 1,
    isEnabled: true,
    author: 'ONEVA Design Lab',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'single-wa-glass',
    appPackageName: 'com.whatsapp',
    variantName: 'Glass Frost',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'MessageSquare',
    previewColor: '#38bdf8',
    order: 2,
    isEnabled: true,
    author: 'ONEVA Glasswork',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'single-wa-black',
    appPackageName: 'com.whatsapp',
    variantName: 'OLED Obsidian Black',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'MessagesSquare',
    previewColor: '#ffffff',
    order: 3,
    isEnabled: true,
    author: 'ONEVA Core',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'single-wa-purple',
    appPackageName: 'com.whatsapp',
    variantName: 'Cyber Purple',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'Radio',
    previewColor: '#c084fc',
    order: 4,
    isEnabled: true,
    author: 'Community Verified',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // YouTube single app variants
  {
    id: 'single-yt-carmine',
    appPackageName: 'com.google.android.youtube',
    variantName: 'Carmine Minimal',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'Play',
    previewColor: '#ef4444',
    order: 1,
    isEnabled: true,
    author: 'ONEVA Design Lab',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'single-yt-retro',
    appPackageName: 'com.google.android.youtube',
    variantName: 'Amber Retro CRT',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'Tv',
    previewColor: '#f59e0b',
    order: 2,
    isEnabled: true,
    author: 'ONEVA Retro',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'single-yt-stealth',
    appPackageName: 'com.google.android.youtube',
    variantName: 'Stealth Monochrome',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'Film',
    previewColor: '#e2e8f0',
    order: 3,
    isEnabled: true,
    author: 'ONEVA Core',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // Chrome single app variants
  {
    id: 'single-chrome-blue',
    appPackageName: 'com.android.chrome',
    variantName: 'Azure Radar',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'Compass',
    previewColor: '#3b82f6',
    order: 1,
    isEnabled: true,
    author: 'ONEVA Design Lab',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'single-chrome-sphere',
    appPackageName: 'com.android.chrome',
    variantName: 'Quantum Orbit',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'Globe',
    previewColor: '#10b981',
    order: 2,
    isEnabled: true,
    author: 'ONEVA Glasswork',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // Instagram single app variants
  {
    id: 'single-ig-gradient',
    appPackageName: 'com.instagram.android',
    variantName: 'Sunset Luminescence',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'Camera',
    previewColor: '#e1306c',
    order: 1,
    isEnabled: true,
    author: 'ONEVA Art',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'single-ig-aperture',
    appPackageName: 'com.instagram.android',
    variantName: 'Mechanical Aperture',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'Aperture',
    previewColor: '#f43f5e',
    order: 2,
    isEnabled: true,
    author: 'ONEVA Vision',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'single-ig-dark',
    appPackageName: 'com.instagram.android',
    variantName: 'Pure OLED Shutter',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'Focus',
    previewColor: '#ffffff',
    order: 3,
    isEnabled: true,
    author: 'ONEVA Core',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // Spotify single app variants
  {
    id: 'single-spotify-pulse',
    appPackageName: 'com.spotify.music',
    variantName: 'Acoustic Pulse',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'Activity',
    previewColor: '#1db954',
    order: 1,
    isEnabled: true,
    author: 'ONEVA Sound',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'single-spotify-vinyl',
    appPackageName: 'com.spotify.music',
    variantName: 'Groove Disc',
    iconDataUrl: '',
    iconType: 'lucide',
    lucideIconName: 'Disc',
    previewColor: '#a855f7',
    order: 2,
    isEnabled: true,
    author: 'ONEVA Retro',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
];

export class SingleAppIconService {
  private static icons: SingleAppIconOption[] | null = null;
  private static listeners: Set<() => void> = new Set();

  /**
   * Return all registered single app icon options
   */
  static getAllIcons(): SingleAppIconOption[] {
    if (this.icons) return this.icons;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_SINGLE_ICONS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.icons = parsed;
            return this.icons;
          }
        }
      } catch (err) {
        console.warn('[SingleAppIconService] Failed to load cached single app icons:', err);
      }
    }

    this.icons = [...SEED_SINGLE_APP_ICONS];
    this.persistLocal();
    return this.icons;
  }

  /**
   * Get all icon options for a specific package name
   */
  static getIconsForApp(packageName: string, includeDisabled = false): SingleAppIconOption[] {
    const all = this.getAllIcons();
    return all
      .filter(
        (i) =>
          i.appPackageName.toLowerCase() === packageName.toLowerCase() &&
          (includeDisabled || i.isEnabled)
      )
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Find a single app icon option by its unique ID
   */
  static getIconById(id: string): SingleAppIconOption | undefined {
    return this.getAllIcons().find((i) => i.id === id);
  }

  /**
   * Count how many distinct options exist for a package
   */
  static getIconCountForApp(packageName: string): number {
    return this.getIconsForApp(packageName, false).length;
  }

  /**
   * Admin / User: Add a new single app icon option for a package
   */
  static async addIconOption(data: {
    appPackageName: string;
    variantName: string;
    iconDataUrl?: string;
    iconType?: 'svg' | 'image' | 'lucide';
    lucideIconName?: string;
    previewColor?: string;
    author?: string;
    ownership?: 'admin' | 'user';
    packId?: string;
  }): Promise<{ success: boolean; iconOption?: SingleAppIconOption; error?: string }> {
    const pkg = data.appPackageName.trim().toLowerCase();
    if (!pkg) {
      return { success: false, error: 'Target application package name is required.' };
    }

    if (!data.variantName.trim()) {
      return { success: false, error: 'Icon option name is required (e.g. "Neon Emerald").' };
    }

    const existingForApp = this.getIconsForApp(pkg, true);
    const newId = `single-${pkg.replace(/\./g, '_')}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const newOption: SingleAppIconOption = {
      id: newId,
      appPackageName: pkg,
      variantName: data.variantName.trim(),
      iconDataUrl: data.iconDataUrl || '',
      iconType: data.iconType || (data.iconDataUrl ? 'image' : 'lucide'),
      lucideIconName: data.lucideIconName || 'Sparkles',
      previewColor: data.previewColor || '#10b981',
      order: existingForApp.length + 1,
      isEnabled: true,
      author: data.author || (data.ownership === 'user' ? 'Personal Device' : 'ONEVA Admin'),
      ownership: data.ownership || 'admin',
      packId: data.packId,
      createdAt: now,
      updatedAt: now,
    };

    const current = this.getAllIcons();
    this.icons = [...current, newOption];
    this.persistLocal();
    this.notify();

    // Async sync to Supabase only for global admin icons
    if (newOption.ownership === 'admin') {
      this.syncToSupabase(newOption).catch((err) => {
        console.warn('[SingleAppIconService] Supabase single app icon note:', err);
      });
    }

    return { success: true, iconOption: newOption };
  }

  /**
   * Admin / User: Add multiple single app icon options in a single fast, batched operation.
   * Completely prevents UI freezes, infinite serializations, and localStorage QuotaExceededError.
   */
  static async addIconOptionsBatch(
    options: Array<{
      appPackageName: string;
      variantName: string;
      iconDataUrl?: string;
      iconType?: 'svg' | 'image' | 'lucide';
      lucideIconName?: string;
      previewColor?: string;
      author?: string;
      ownership?: 'admin' | 'user';
      packId?: string;
    }>
  ): Promise<{ success: boolean; count: number }> {
    if (!options || options.length === 0) return { success: true, count: 0 };

    const current = this.getAllIcons();
    const now = new Date().toISOString();
    const newOptions: SingleAppIconOption[] = [];

    options.forEach((data, index) => {
      const pkg = data.appPackageName.trim().toLowerCase();
      if (!pkg) return;

      const newId = `single-${pkg.replace(/\./g, '_')}-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`;
      newOptions.push({
        id: newId,
        appPackageName: pkg,
        variantName: data.variantName.trim() || 'Custom Variant',
        iconDataUrl: data.iconDataUrl || '',
        iconType: data.iconType || (data.iconDataUrl ? 'image' : 'lucide'),
        lucideIconName: data.lucideIconName || 'Sparkles',
        previewColor: data.previewColor || '#10b981',
        order: current.length + newOptions.length + 1,
        isEnabled: true,
        author: data.author || (data.ownership === 'user' ? 'Personal Device' : 'ONEVA Admin'),
        ownership: data.ownership || 'admin',
        packId: data.packId,
        createdAt: now,
        updatedAt: now,
      });
    });

    this.icons = [...current, ...newOptions];
    this.persistLocal();
    this.notify();

    return { success: true, count: newOptions.length };
  }

  /**
   * Delete all single app icons associated with an icon pack
   */
  static deleteIconsForPack(packId: string): void {
    const current = this.getAllIcons();
    this.icons = current.filter((i) => i.packId !== packId);
    this.persistLocal();
    this.notify();
  }

  /**
   * Admin / User: Delete a single app icon option
   */
  static async deleteIconOption(
    id: string,
    requesterOwnership: 'admin' | 'user' = 'admin'
  ): Promise<{ success: boolean; error?: string }> {
    const current = this.getAllIcons();
    const target = current.find((i) => i.id === id);

    if (!target) {
      return { success: false, error: `Icon option "${id}" not found.` };
    }

    // Normal users can only delete their personal icons
    if (requesterOwnership === 'user' && target.ownership === 'admin') {
      return { success: false, error: 'Personal users cannot delete global admin icons.' };
    }

    const filtered = current.filter((i) => i.id !== id);
    this.icons = filtered;
    this.persistLocal();
    this.notify();

    if (target.ownership === 'admin') {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from('single_app_icons').delete().eq('id', id).then();
      }
    }

    return { success: true };
  }

  private static persistLocal(): void {
    if (typeof window !== 'undefined' && this.icons) {
      try {
        localStorage.setItem(STORAGE_SINGLE_ICONS_KEY, JSON.stringify(this.icons));
      } catch (err) {
        console.warn('[SingleAppIconService] Failed to persist full icons (quota), saving sanitized index:', err);
        try {
          const sanitized = this.icons.map((icon) => ({
            ...icon,
            iconDataUrl: icon.iconDataUrl && icon.iconDataUrl.length > 25000 ? '' : icon.iconDataUrl,
          }));
          localStorage.setItem(STORAGE_SINGLE_ICONS_KEY, JSON.stringify(sanitized));
        } catch {
          // ignore
        }
      }
    }
  }

  private static async syncToSupabase(icon: SingleAppIconOption): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await supabase.from('single_app_icons').upsert({
        id: icon.id,
        app_package_name: icon.appPackageName,
        variant_name: icon.variantName,
        icon_type: icon.iconType,
        lucide_icon_name: icon.lucideIconName,
        preview_color: icon.previewColor,
        sort_order: icon.order,
        is_enabled: icon.isEnabled,
        author: icon.author,
        updated_at: icon.updatedAt,
      });
    } catch (err) {
      console.warn('[SingleAppIconService] Supabase sync note:', err);
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
        console.error('[SingleAppIconService] Listener error:', err);
      }
    }
  }
}
