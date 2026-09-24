const FAVORITES_STORAGE_KEY = 'oneva_user_favorite_assets_v1';

export class FavoritesService {
  private static favorites: Set<string> | null = null;
  private static listeners: Set<() => void> = new Set();

  static getFavoriteIds(): Set<string> {
    if (this.favorites) return this.favorites;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.favorites = new Set(parsed);
            return this.favorites;
          }
        }
      } catch (e) {
        console.warn('[FavoritesService] Error reading favorites:', e);
      }
    }

    this.favorites = new Set();
    return this.favorites;
  }

  static isFavorite(assetId: string): boolean {
    return this.getFavoriteIds().has(assetId);
  }

  static toggleFavorite(assetId: string): boolean {
    const set = this.getFavoriteIds();
    let isNowFavorite: boolean;

    if (set.has(assetId)) {
      set.delete(assetId);
      isNowFavorite = false;
    } else {
      set.add(assetId);
      isNowFavorite = true;
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(set)));
      } catch (e) {
        console.warn('[FavoritesService] Error saving favorites:', e);
      }
    }

    this.notify();
    return isNowFavorite;
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('[FavoritesService] Listener error:', e);
      }
    });
  }
}
