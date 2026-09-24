/**
 * ONEVA Asset Storage Service
 * Uses IndexedDB for reliable, quota-free storage of large visual assets
 * (4K Wallpapers, MP4/WebM Live Wallpapers, Icon Pack Archives, Keyboard Wallpapers).
 * Completely fixes the 5MB localStorage QuotaExceededError upload failure.
 */

const DB_NAME = 'oneva_assets_db';
const DB_VERSION = 2;
const STORE_MEDIA = 'asset_media';
const STORE_METADATA = 'asset_metadata';

export interface StoredMediaRecord {
  id: string;
  assetId: string;
  mediaType: 'image' | 'video' | 'archive' | 'json';
  dataUrl: string; // Base64, Object URL, or remote URL
  blob?: Blob; // Native IndexedDB blob representation
  thumbnailUrl?: string; // Optimized downscaled thumbnail for fast card rendering
  fileName: string;
  fileSize: number;
  mimeType: string;
  dimensions?: string;
  createdAt: string;
}

export interface StoredIconMapRecord {
  id: string;
  assetId: string;
  icons: Record<string, string>;
  createdAt: string;
}

export class AssetStorageService {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  private static memoryCache = new Map<string, StoredMediaRecord>();
  private static iconMapCache = new Map<string, Record<string, string>>();

  /**
   * Initializes or returns the open IndexedDB connection.
   */
  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not available in this environment.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_MEDIA)) {
          db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_METADATA)) {
          db.createObjectStore(STORE_METADATA, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[AssetStorageService] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Generates a lightweight thumbnail for snappy card grid rendering
   */
  static async generateThumbnail(dataUrl: string, maxWidth = 480): Promise<string> {
    if (typeof window === 'undefined') return dataUrl;
    // If it's a video, we return the dataUrl as-is or extract first frame
    if (dataUrl.startsWith('data:video/') || dataUrl.endsWith('.mp4') || dataUrl.endsWith('.webm')) {
      return dataUrl;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const ratio = img.height / img.width;
          const targetWidth = Math.min(img.width, maxWidth);
          const targetHeight = Math.round(targetWidth * ratio);

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          // Compress to WebP or JPEG for lightweight storage
          const thumbUrl = canvas.toDataURL('image/webp', 0.82);
          resolve(thumbUrl);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  /**
   * Stores a binary media file (image/video/archive) in IndexedDB.
   * Completely safe against browser Out-Of-Memory (OOM) crashes by:
   * 1. Storing native Blob directly in IndexedDB instead of gigantic base64 strings.
   * 2. Only generating dataUrl for small images (<= 1.5MB).
   * 3. Using lightweight object URLs for videos and large assets.
   */
  static async saveMedia(
    assetId: string,
    file: File | Blob,
    options: {
      dataUrl?: string;
      thumbnailUrl?: string;
      customName?: string;
    } = {}
  ): Promise<StoredMediaRecord> {
    const isVideo = file.type.startsWith('video/') || (file as File).name?.match(/\.(mp4|webm|mov)$/i);
    const isImage = file.type.startsWith('image/') || (file as File).name?.match(/\.(png|jpe?g|webp|svg|gif)$/i);

    let dataUrl = options.dataUrl;

    if (!dataUrl) {
      // ONLY read as Base64 data URL if file is <= 1.5MB and is an image!
      if (isImage && file.size <= 1.5 * 1024 * 1024) {
        try {
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read file binary'));
            reader.readAsDataURL(file);
          });
        } catch {
          dataUrl = undefined;
        }
      }

      // For videos, archives, or large images: use lightweight Object URL without memory spike!
      if (!dataUrl && typeof window !== 'undefined' && window.URL) {
        try {
          dataUrl = URL.createObjectURL(file);
        } catch {
          dataUrl = '';
        }
      }
    }

    // Generate downscaled thumbnail for images to ensure card lists load instantly
    let thumbnailUrl: string | undefined = options.thumbnailUrl;
    if (!thumbnailUrl && isImage && dataUrl && dataUrl.startsWith('data:')) {
      try {
        thumbnailUrl = await this.generateThumbnail(dataUrl, 480);
      } catch {
        thumbnailUrl = undefined;
      }
    }

    const recordId = `media_${assetId}`;
    const record: StoredMediaRecord = {
      id: recordId,
      assetId,
      mediaType: isVideo ? 'video' : isImage ? 'image' : 'archive',
      dataUrl: dataUrl || '',
      blob: file, // Natively store the Blob in IndexedDB without serialization overhead
      thumbnailUrl,
      fileName: options.customName || (file as File).name || `${assetId}.bin`,
      fileSize: file.size,
      mimeType: file.type || (isVideo ? 'video/mp4' : 'image/png'),
      createdAt: new Date().toISOString(),
    };

    // Store in memory cache
    this.memoryCache.set(recordId, record);

    // Save to IndexedDB
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_MEDIA], 'readwrite');
        const store = tx.objectStore(STORE_MEDIA);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[AssetStorageService] IndexedDB write notice (fallback active):', err);
    }

    return record;
  }

  /**
   * Retrieves media for a specific asset by asset ID
   */
  static async getMedia(assetId: string): Promise<StoredMediaRecord | null> {
    const recordId = `media_${assetId}`;
    const cached = this.memoryCache.get(recordId) || this.memoryCache.get(assetId);
    if (cached) {
      // If dataUrl was an expired blob URL and native blob is stored, recreate fresh object URL
      if (cached.blob && (!cached.dataUrl || cached.dataUrl.startsWith('blob:'))) {
        try {
          cached.dataUrl = URL.createObjectURL(cached.blob);
        } catch {}
      }
      return cached;
    }

    try {
      const db = await this.getDB();
      const record = await new Promise<StoredMediaRecord | null>((resolve) => {
        const tx = db.transaction([STORE_MEDIA], 'readonly');
        const store = tx.objectStore(STORE_MEDIA);
        const req = store.get(recordId);
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result);
          } else {
            // Fallback lookup using raw assetId
            const req2 = store.get(assetId);
            req2.onsuccess = () => resolve(req2.result || null);
            req2.onerror = () => resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });

      if (record) {
        if (record.blob && (!record.dataUrl || record.dataUrl.startsWith('blob:'))) {
          try {
            record.dataUrl = URL.createObjectURL(record.blob);
          } catch {}
        }
        this.memoryCache.set(recordId, record);
        this.memoryCache.set(assetId, record);
      }
      return record;
    } catch {
      return null;
    }
  }

  /**
   * Synchronously retrieves media from memory cache if already loaded
   */
  static getMediaSync(assetId: string): StoredMediaRecord | null {
    const recordId = `media_${assetId}`;
    return this.memoryCache.get(recordId) || this.memoryCache.get(assetId) || null;
  }

  /**
   * Pre-loads all stored media records from IndexedDB into memoryCache for instant synchronous access
   */
  static async preloadAll(): Promise<void> {
    try {
      const db = await this.getDB();
      const records = await new Promise<StoredMediaRecord[]>((resolve) => {
        const tx = db.transaction([STORE_MEDIA], 'readonly');
        const store = tx.objectStore(STORE_MEDIA);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      records.forEach((record) => {
        if (record && record.id) {
          this.memoryCache.set(record.id, record);
          if (record.assetId) {
            this.memoryCache.set(`media_${record.assetId}`, record);
          }
        }
      });

      // Pre-load icon maps from STORE_METADATA
      try {
        const metadataRecords = await new Promise<StoredIconMapRecord[]>((resolve) => {
          const tx = db.transaction([STORE_METADATA], 'readonly');
          const store = tx.objectStore(STORE_METADATA);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });

        metadataRecords.forEach((record) => {
          if (record && record.icons && record.assetId) {
            this.iconMapCache.set(`icons_${record.assetId}`, record.icons);
            this.iconMapCache.set(record.assetId, record.icons);
          }
        });
      } catch {}
    } catch (err) {
      console.warn('[AssetStorageService] IndexedDB preloadNotice:', err);
    }
  }

  /**
   * Persists an icon pack's extracted icon dictionary in IndexedDB without quota limits.
   */
  static async saveIconMap(assetId: string, icons: Record<string, string>): Promise<void> {
    const recordId = `icons_${assetId}`;
    this.iconMapCache.set(recordId, icons);
    this.iconMapCache.set(assetId, icons);

    try {
      const db = await this.getDB();
      const record: StoredIconMapRecord = {
        id: recordId,
        assetId,
        icons,
        createdAt: new Date().toISOString(),
      };
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_METADATA], 'readwrite');
        const store = tx.objectStore(STORE_METADATA);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[AssetStorageService] saveIconMap warning:', err);
    }
  }

  /**
   * Synchronously retrieves icon map from in-memory cache if available.
   */
  static getIconMapSync(assetId: string): Record<string, string> | null {
    return this.iconMapCache.get(`icons_${assetId}`) || this.iconMapCache.get(assetId) || null;
  }

  /**
   * Asynchronously retrieves icon map from IndexedDB.
   */
  static async getIconMap(assetId: string): Promise<Record<string, string> | null> {
    const cached = this.getIconMapSync(assetId);
    if (cached) return cached;

    try {
      const db = await this.getDB();
      const recordId = `icons_${assetId}`;
      const record = await new Promise<StoredIconMapRecord | null>((resolve) => {
        const tx = db.transaction([STORE_METADATA], 'readonly');
        const store = tx.objectStore(STORE_METADATA);
        const req = store.get(recordId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (record && record.icons) {
        this.iconMapCache.set(recordId, record.icons);
        this.iconMapCache.set(assetId, record.icons);
        return record.icons;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Deletes media and icon maps from IndexedDB
   */
  static async deleteMedia(assetId: string): Promise<void> {
    const recordId = `media_${assetId}`;
    const iconRecordId = `icons_${assetId}`;
    this.memoryCache.delete(recordId);
    this.iconMapCache.delete(iconRecordId);
    this.iconMapCache.delete(assetId);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve) => {
        const tx = db.transaction([STORE_MEDIA, STORE_METADATA], 'readwrite');
        tx.objectStore(STORE_MEDIA).delete(recordId);
        tx.objectStore(STORE_METADATA).delete(iconRecordId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // safe fallback
    }
  }
}
