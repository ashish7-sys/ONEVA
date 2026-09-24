import { OnevaAsset } from '../types/adminAssets';

export interface BrowsingCategoryItem {
  id: string;
  label: string;
  iconEmoji?: string;
  description: string;
}

export const BROWSING_CATEGORIES: BrowsingCategoryItem[] = [
  { id: 'all', label: 'All', description: 'Complete catalog ranked by priority' },
  { id: 'hot', label: 'Hot 🔥', description: 'Highest ranked and community favorites' },
  { id: 'new', label: 'New 🆕', description: 'Recently published assets (newest first)' },
  { id: 'cool', label: 'Cool 😎', description: 'Futuristic, dark and high-contrast designs' },
  { id: 'anime', label: 'Anime', description: 'Stylized anime & vibrant aesthetic artwork' },
  { id: 'scifi', label: 'Sci-Fi 🚀', description: 'Futuristic HUD, space, and Jarvis interfaces' },
  { id: 'minimal', label: 'Minimal ⚪', description: 'Subtle slates, line art, and clean aesthetics' },
  { id: 'amoled', label: 'AMOLED 🖤', description: 'True zero-pixel #000000 battery savers' },
  { id: 'cyber', label: 'Cyber ⚡', description: 'Electroluminescent neon and phosphor glows' },
  { id: 'live', label: 'Live 🌀', description: 'Dynamic, kinetic & interactive wallpapers' },
  { id: 'favorites', label: 'Favorites ♡', description: 'Your saved favorite assets' },
];

export class AssetClassificationService {
  /**
   * Automatically analyzes an asset's metadata, title, description, colors,
   * and properties to determine appropriate browsing categories without requiring
   * manual admin entry.
   */
  static classifyAsset(asset: Partial<OnevaAsset>): string[] {
    const categories = new Set<string>(['all']);

    const textCorpus = [
      asset.name || '',
      asset.description || '',
      asset.category || '',
      asset.author || '',
      JSON.stringify(asset.previewData || {}),
      JSON.stringify(asset.payload || {}),
    ].join(' ').toLowerCase();

    // 1. Hot 🔥 (Admin rating >= 8 or marked default)
    const rating = asset.rating ?? 5;
    if (rating >= 8 || asset.isDefault) {
      categories.add('hot');
    }

    // 2. New 🆕 (Always eligible for the New section; ordered by upload timestamp)
    categories.add('new');

    // 3. Cool 😎 (Futuristic, high rating, or sleek aesthetics)
    if (
      rating >= 7 ||
      textCorpus.includes('cool') ||
      textCorpus.includes('futuristic') ||
      textCorpus.includes('dark') ||
      textCorpus.includes('sleek') ||
      textCorpus.includes('tactile')
    ) {
      categories.add('cool');
    }

    // 4. Anime (Visual anime/manga/stylized aesthetics)
    if (
      textCorpus.includes('anime') ||
      textCorpus.includes('manga') ||
      textCorpus.includes('lofi') ||
      textCorpus.includes('stylized') ||
      textCorpus.includes('character') ||
      textCorpus.includes('illustration')
    ) {
      categories.add('anime');
    }

    // 5. Sci-Fi 🚀 (Jarvis, space, nebula, cyber-grid, HUD, robotics)
    if (
      textCorpus.includes('sci-fi') ||
      textCorpus.includes('scifi') ||
      textCorpus.includes('jarvis') ||
      textCorpus.includes('nebula') ||
      textCorpus.includes('cosmic') ||
      textCorpus.includes('hud') ||
      textCorpus.includes('quantum') ||
      textCorpus.includes('flux') ||
      textCorpus.includes('galaxy')
    ) {
      categories.add('scifi');
    }

    // 6. Minimal ⚪ (Slate neutral, line art, simple, clean, subtle)
    if (
      textCorpus.includes('minimal') ||
      textCorpus.includes('slate') ||
      textCorpus.includes('clean') ||
      textCorpus.includes('line art') ||
      textCorpus.includes('mono') ||
      textCorpus.includes('subtle') ||
      textCorpus.includes('onyx')
    ) {
      categories.add('minimal');
    }

    // 7. AMOLED 🖤 (OLED pure black #000000, zero-emissive, true black)
    if (
      textCorpus.includes('oled') ||
      textCorpus.includes('amoled') ||
      textCorpus.includes('#000000') ||
      textCorpus.includes('pure black') ||
      textCorpus.includes('true black') ||
      textCorpus.includes('pitch') ||
      textCorpus.includes('zero emissive')
    ) {
      categories.add('amoled');
    }

    // 8. Cyber ⚡ (Neon, phosphor, glow, pulse, particle, electric)
    if (
      textCorpus.includes('cyber') ||
      textCorpus.includes('neon') ||
      textCorpus.includes('phosphor') ||
      textCorpus.includes('glow') ||
      textCorpus.includes('electric') ||
      textCorpus.includes('amber') ||
      textCorpus.includes('streak') ||
      textCorpus.includes('pulse')
    ) {
      categories.add('cyber');
    }

    // 9. Live 🌀 (Live/reactive wallpapers, motion canvases)
    if (
      asset.isLiveWallpaper ||
      asset.category === 'live_wallpaper' ||
      textCorpus.includes('live') ||
      textCorpus.includes('reactive') ||
      textCorpus.includes('motion') ||
      textCorpus.includes('60 fps') ||
      Boolean(asset.previewData?.previewVideoUrl)
    ) {
      categories.add('live');
    }

    return Array.from(categories);
  }

  /**
   * Sorts assets according to ONEVA specification:
   * - In "New" category: purely newest upload timestamp first.
   * - In "All" and other categories:
   *   1. Admin Blue-Star Rating (10 → 1)
   *   2. Publication/creation timestamp as tie-breaker (newest first).
   * Note: This is dynamic sorting; it does NOT mutate or reorder the database.
   */
  static sortAssets(assets: OnevaAsset[], categoryId: string): OnevaAsset[] {
    const list = [...assets];

    if (categoryId === 'new') {
      return list.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    }

    return list.sort((a, b) => {
      // ⭐ Default asset takes highest precedence in general catalog views
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;

      const ratingA = a.rating ?? 8;
      const ratingB = b.rating ?? 8;

      if (ratingB !== ratingA) {
        return ratingB - ratingA; // Higher rating first (10 to 1)
      }

      // Tie breaker: newest publication timestamp first
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }

  /**
   * Filters assets based on the selected category ID and an optional favorite list.
   */
  static filterAssets(
    assets: OnevaAsset[],
    categoryId: string,
    favoriteIds?: Set<string>
  ): OnevaAsset[] {
    if (categoryId === 'all') {
      return assets;
    }

    if (categoryId === 'favorites') {
      if (!favoriteIds || favoriteIds.size === 0) return [];
      return assets.filter((a) => favoriteIds.has(a.id));
    }

    return assets.filter((asset) => {
      const tags = asset.autoCategories || this.classifyAsset(asset);
      return tags.includes(categoryId);
    });
  }
}
