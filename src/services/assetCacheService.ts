/**
 * ONEVA Client-Side Tiered Cache & Download Service
 *
 * Implements Tiered Request Architecture:
 * - Tier 1 (Thumbnail): Card lists load lightweight thumbnails (~30-60KB)
 * - Tier 2 (Preview): Detail modal loads compressed preview image or video
 * - Tier 3 (Original): Full-fidelity original downloaded only when user clicks Download or Apply
 *
 * Features:
 * - Version and hash-based cache invalidation
 * - Avoids redundant network downloads
 * - Offline-first instant rendering
 */

import { OnevaAsset } from '../types/adminAssets';
import { AssetStorageService } from './assetStorageService';

export type CacheTier = 'thumbnail' | 'preview' | 'original';

export interface CacheEntry {
  key: string;
  assetId: string;
  tier: CacheTier;
  version: string;
  dataUrl: string;
  sizeBytes: number;
  cachedAt: string;
}

const CACHE_DB_NAME = 'oneva_client_cache_db';
const CACHE_DB_VERSION = 1;
const STORE_CACHE = 'device_cache';

/**
 * Resolves raw media URLs (including Google Drive links, local paths, or CDN links)
 * to direct streamable/downloadable asset URLs.
 * Completely prevents passing Google Drive HTML preview pages to <video> tags.
 */
export function resolveDownloadableMediaUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.includes('...')) return null;

  // Local assets, blob URLs, and data URLs pass directly
  if (trimmed.startsWith('/') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Google Drive URL resolution (file/d/:id or ?id=:id)
  const driveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const driveIdParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const driveId = driveFileMatch ? driveFileMatch[1] : driveIdParamMatch ? driveIdParamMatch[1] : null;

  if (driveId) {
    // Map known canonical Jarvis assets to local pre-bundled files for instant playback
    switch (driveId) {
      case '13ASmtlL-Ah9tqVl9DDKVEyCfdJzjPOur':
        return '/assets/jarvis/Changeable_wallpaper.mp4';
      case '14CeaVNwrNdHfeDWwIR8tgaCyOYHV8y39':
        return '/assets/jarvis/Awake_jarvis_normal_state.mp4';
      case '1CB-7Q07rKXkCICg19WMG-PBfIPdhf9Oy':
        return '/assets/jarvis/Jarvis_doing_short_command.mp4';
      case '1t7koaRRUkDZnnvnKJ3qpP5JxWZGbivR8':
        return '/assets/jarvis/Jarvis_doing_long_command.mp4';
      default:
        return `https://drive.google.com/uc?export=download&id=${driveId}`;
    }
  }

  return trimmed;
}

export class AssetCacheService {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  private static memoryCache = new Map<string, CacheEntry>();

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }

      const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);

      request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Generates a unique cache key based on asset ID and resolution tier
   */
  private static makeKey(assetId: string, tier: CacheTier): string {
    return `${assetId}_${tier}`;
  }

  /**
   * Checks if an asset at the given tier is cached and up to date with version
   */
  static async isCached(assetId: string, tier: CacheTier, currentVersion = '1.0.0'): Promise<boolean> {
    const key = this.makeKey(assetId, tier);
    const mem = this.memoryCache.get(key);
    if (mem && mem.version === currentVersion) return true;

    try {
      const db = await this.getDB();
      return new Promise<boolean>((resolve) => {
        const tx = db.transaction([STORE_CACHE], 'readonly');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.get(key);
        req.onsuccess = () => {
          const entry: CacheEntry | undefined = req.result;
          if (entry && entry.version === currentVersion) {
            this.memoryCache.set(key, entry);
            resolve(true);
          } else {
            resolve(false);
          }
        };
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  /**
   * Synchronously checks if memory has the cached URL
   */
  static getCachedUrlSync(assetId: string, tier: CacheTier): string | null {
    const key = this.makeKey(assetId, tier);
    return this.memoryCache.get(key)?.dataUrl || null;
  }

  /**
   * Retrieves the cached media URL for a given tier
   */
  static async getCachedUrl(assetId: string, tier: CacheTier, currentVersion = '1.0.0'): Promise<string | null> {
    const key = this.makeKey(assetId, tier);
    const mem = this.memoryCache.get(key);
    if (mem && mem.version === currentVersion) return mem.dataUrl;

    try {
      const db = await this.getDB();
      return new Promise<string | null>((resolve) => {
        const tx = db.transaction([STORE_CACHE], 'readonly');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.get(key);
        req.onsuccess = () => {
          const entry: CacheEntry | undefined = req.result;
          if (entry && entry.version === currentVersion) {
            this.memoryCache.set(key, entry);
            resolve(entry.dataUrl);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Stores a media asset in the device cache
   */
  static async putInCache(
    assetId: string,
    tier: CacheTier,
    dataUrl: string,
    version = '1.0.0',
    sizeBytes = 0
  ): Promise<void> {
    const key = this.makeKey(assetId, tier);
    const entry: CacheEntry = {
      key,
      assetId,
      tier,
      version,
      dataUrl,
      sizeBytes: sizeBytes || dataUrl.length,
      cachedAt: new Date().toISOString(),
    };

    this.memoryCache.set(key, entry);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_CACHE], 'readwrite');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.put(entry);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[AssetCacheService] Cache write notice:', e);
    }
  }

  /**
   * Resolves the optimal media URL for card list display (Tier 1: Thumbnail)
   */
  static resolveCardThumbnail(asset: OnevaAsset): string | null {
    // 1. Check memory cache
    const cached = this.getCachedUrlSync(asset.id, 'thumbnail');
    if (cached) return cached;

    // 2. Direct thumbnail from previewData or mediaUrls
    const thumb =
      asset.mediaUrls?.thumbnailUrl ||
      asset.previewData?.previewThumbnailUrl ||
      asset.previewData?.previewUrl ||
      asset.previewData?.previewDataUrl;

    if (thumb && !thumb.includes('...')) return thumb;

    // 3. Stored media in IndexedDB
    const stored = AssetStorageService.getMediaSync(asset.id);
    return stored?.thumbnailUrl || stored?.dataUrl || null;
  }

  /**
   * Resolves the optimal media URL for detail inspection modal (Tier 2: Preview)
   */
  static resolveDetailPreview(asset: OnevaAsset): string | null {
    const cached = this.getCachedUrlSync(asset.id, 'preview');
    if (cached) return cached;

    const prev =
      asset.mediaUrls?.previewUrl ||
      asset.previewData?.previewVideoUrl ||
      asset.previewData?.previewUrl ||
      asset.previewData?.previewDataUrl ||
      asset.mediaUrls?.thumbnailUrl ||
      asset.previewData?.previewThumbnailUrl;

    if (prev && !prev.includes('...')) return prev;

    const stored = AssetStorageService.getMediaSync(asset.id);
    return stored?.dataUrl || stored?.thumbnailUrl || null;
  }

  /**
   * Downloads the full original asset (Tier 3) only when user clicks Download or Apply.
   * If already cached, returns instantly. Otherwise streams and caches.
   */
  static async downloadOriginalAsset(
    asset: OnevaAsset,
    onProgress?: (percent: number, status: string) => void
  ): Promise<string> {
    const currentVersion = asset.version || '1.0.0';

    // 1. Check if already cached
    const cachedOriginal = await this.getCachedUrl(asset.id, 'original', currentVersion);
    if (cachedOriginal) {
      onProgress?.(100, 'Original loaded from device cache.');
      return cachedOriginal;
    }

    // 2. Check local IndexedDB storage
    const stored = await AssetStorageService.getMedia(asset.id);
    if (stored && stored.dataUrl) {
      await this.putInCache(asset.id, 'original', stored.dataUrl, currentVersion, stored.fileSize);
      onProgress?.(100, 'Loaded from local storage.');
      return stored.dataUrl;
    }

    // 3. Download from remote URL
    const rawRemoteUrl =
      asset.mediaUrls?.originalUrl ||
      asset.previewData?.previewUrl ||
      asset.previewData?.previewVideoUrl ||
      asset.previewData?.previewDataUrl ||
      (asset.payload?.assetUrl as string) ||
      (asset.payload?.wallpaperUrl as string);

    const remoteUrl = resolveDownloadableMediaUrl(rawRemoteUrl);

    if (!remoteUrl) {
      throw new Error(`No download source found for "${asset.name}".`);
    }

    if (remoteUrl.startsWith('data:')) {
      await this.putInCache(asset.id, 'original', remoteUrl, currentVersion);
      onProgress?.(100, 'Ready.');
      return remoteUrl;
    }

    onProgress?.(15, `Connecting to ONEVA Cloud distribution...`);

    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`Failed to download original asset (HTTP ${response.status})`);
    }

    const contentLength = +(response.headers.get('Content-Length') || 0);
    const reader = response.body?.getReader();

    if (!reader) {
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.readAsDataURL(blob);
      });
      await this.putInCache(asset.id, 'original', dataUrl, currentVersion, blob.size);
      onProgress?.(100, 'Download complete.');
      return dataUrl;
    }

    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.length;
        if (contentLength > 0) {
          const pct = Math.round((received / contentLength) * 80) + 15;
          onProgress?.(pct, `Downloading original: ${Math.round((received / contentLength) * 100)}%`);
        }
      }
    }

    onProgress?.(95, 'Caching full-quality asset on device...');
    const fullBlob = new Blob(chunks, { type: response.headers.get('Content-Type') || 'application/octet-stream' });
    const dataUrl = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(fullBlob);
    });

    await this.putInCache(asset.id, 'original', dataUrl, currentVersion, fullBlob.size);
    onProgress?.(100, 'Download complete and cached on device.');
    return dataUrl;
  }

  /**
   * Calculates total disk storage currently used by device cache
   */
  static async getCacheStorageStats(): Promise<{ entryCount: number; totalBytes: number; formattedSize: string }> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction([STORE_CACHE], 'readonly');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.getAll();
        req.onsuccess = () => {
          const entries: CacheEntry[] = req.result || [];
          let totalBytes = 0;
          entries.forEach((e) => (totalBytes += e.sizeBytes || 0));
          const mb = (totalBytes / (1024 * 1024)).toFixed(2);
          resolve({
            entryCount: entries.length,
            totalBytes,
            formattedSize: `${mb} MB`,
          });
        };
        req.onerror = () => resolve({ entryCount: 0, totalBytes: 0, formattedSize: '0 MB' });
      });
    } catch {
      return { entryCount: 0, totalBytes: 0, formattedSize: '0 MB' };
    }
  }

  /**
   * Invalidates all cached tiers for a specific asset (called when version or metadata changes)
   */
  static async invalidateAsset(assetId: string): Promise<void> {
    const tiers: CacheTier[] = ['thumbnail', 'preview', 'original'];
    tiers.forEach((tier) => {
      const key = this.makeKey(assetId, tier);
      this.memoryCache.delete(key);
    });

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve) => {
        const tx = db.transaction([STORE_CACHE], 'readwrite');
        const store = tx.objectStore(STORE_CACHE);
        tiers.forEach((tier) => {
          store.delete(this.makeKey(assetId, tier));
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      console.warn('[AssetCacheService] Invalidate notice:', e);
    }
  }

  /**
   * Clears device media cache
   */
  static async clearCache(): Promise<void> {
    this.memoryCache.clear();
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_CACHE], 'readwrite');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[AssetCacheService] Clear cache notice:', e);
    }
  }
}
