/**
 * ONEVA Phase 14: Central Jarvis Memory Storage
 * 
 * Local-first, privacy-first persistent storage for JARVIS memory:
 * - LocalStorage with defensive parsing and safe schema versioning
 * - Memory categories: USER_SAVED, TASK_MEMORY, RESEARCH_MEMORY, PREFERENCES, TEMPORARY_CONTEXT
 * - Auto-expiration cleanup for temporary contexts
 * - In-memory fallback if storage fails (never crashes Jarvis)
 * - Zero transmission to external backends
 */

import {
  JarvisMemoryItem,
  JarvisMemoryType,
  JarvisMemorySettings,
} from '../../types/jarvisMemory';

const STORAGE_KEY_MEMORIES = 'oneva_jarvis_memory_v1';
const STORAGE_KEY_SETTINGS = 'oneva_jarvis_memory_settings_v1';

const DEFAULT_SETTINGS: JarvisMemorySettings = {
  autoSaveTaskMemory: true,
  autoSaveResearchMemory: true,
  autoSavePreferences: true,
  retentionDays: 30,
  enableVoiceVerification: false,
  activeActorId: 'owner',
};

export class JarvisMemoryStorage {
  private static memories: JarvisMemoryItem[] = [];
  private static settings: JarvisMemorySettings = { ...DEFAULT_SETTINGS };
  private static isInitialized = false;
  private static listeners: Set<() => void> = new Set();

  /**
   * Initializes local memory from storage with safe version migration
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      if (typeof localStorage !== 'undefined') {
        // Read Settings
        const rawSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (rawSettings) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) };
        }

        // Read Memories
        const rawMemories = localStorage.getItem(STORAGE_KEY_MEMORIES);
        if (rawMemories) {
          const parsed = JSON.parse(rawMemories);
          if (Array.isArray(parsed)) {
            this.memories = parsed
              .filter((m) => m && typeof m.memoryId === 'string' && typeof m.type === 'string')
              .map((m) => ({
                memoryId: m.memoryId,
                type: m.type as JarvisMemoryType,
                title: m.title || 'Untitled Memory',
                summary: m.summary || '',
                content: m.content || m.summary || '',
                tags: Array.isArray(m.tags) ? m.tags : [],
                createdAt: m.createdAt || Date.now(),
                updatedAt: m.updatedAt || Date.now(),
                source: m.source || 'user_explicit',
                importance: m.importance || 'medium',
                expiresAt: m.expiresAt,
                ownerScope: m.ownerScope || 'owner',
                version: 1,
                reasonStored: m.reasonStored || 'User requested or auto-saved task summary',
              }));
          }
        }
      }
    } catch (e) {
      console.warn('[JarvisMemoryStorage] Error loading memories from storage:', e);
      // Fallback: memory initialized as empty in-memory array
    }

    // Auto-purge expired temporary contexts
    this.purgeExpired();
  }

  // ========================================================
  // Read Operations
  // ========================================================

  static getAll(): JarvisMemoryItem[] {
    this.init();
    this.purgeExpired();
    return [...this.memories];
  }

  static getByType(type: JarvisMemoryType): JarvisMemoryItem[] {
    this.init();
    this.purgeExpired();
    return this.memories.filter((m) => m.type === type);
  }

  static getById(memoryId: string): JarvisMemoryItem | null {
    this.init();
    return this.memories.find((m) => m.memoryId === memoryId) || null;
  }

  /**
   * Search memories by keyword and optional type
   */
  static search(query: string, typeFilter?: JarvisMemoryType): JarvisMemoryItem[] {
    this.init();
    this.purgeExpired();

    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();
    const qSpaced = q.replace(/-/g, ' ');
    const qHyphen = q.replace(/\s+/g, '-');

    return this.memories.filter((m) => {
      if (typeFilter && m.type !== typeFilter) return false;
      const titleLower = m.title.toLowerCase();
      const summaryLower = m.summary.toLowerCase();
      const contentLower = m.content?.toLowerCase() || '';

      const matchText = (text: string) =>
        text.includes(q) || text.includes(qSpaced) || text.includes(qHyphen);

      const tagMatch = m.tags.some((t) => {
        const tl = t.toLowerCase();
        return tl.includes(q) || tl.includes(qSpaced) || tl.includes(qHyphen);
      });

      return matchText(titleLower) || matchText(summaryLower) || matchText(contentLower) || tagMatch;
    });
  }

  // ========================================================
  // Write Operations
  // ========================================================

  /**
   * Saves a new memory item or updates an existing one
   */
  static save(item: Omit<JarvisMemoryItem, 'version'>): JarvisMemoryItem {
    this.init();
    this.purgeExpired();

    const fullItem: JarvisMemoryItem = {
      ...item,
      version: 1,
      updatedAt: Date.now(),
    };

    const existingIndex = this.memories.findIndex((m) => m.memoryId === fullItem.memoryId);
    if (existingIndex >= 0) {
      this.memories[existingIndex] = fullItem;
    } else {
      this.memories.unshift(fullItem);
    }

    // Enforce limits per type (keep top 50 per type)
    this.enforceCategoryLimits(fullItem.type);

    this.persist();
    this.notify();
    return fullItem;
  }

  /**
   * Deletes a specific memory by ID
   */
  static delete(memoryId: string): boolean {
    this.init();
    const initialLen = this.memories.length;
    this.memories = this.memories.filter((m) => m.memoryId !== memoryId);
    const deleted = this.memories.length < initialLen;
    if (deleted) {
      this.persist();
      this.notify();
    }
    return deleted;
  }

  /**
   * Deletes all memories matching a specific type
   */
  static deleteByType(type: JarvisMemoryType): number {
    this.init();
    const initialLen = this.memories.length;
    this.memories = this.memories.filter((m) => m.type !== type);
    const count = initialLen - this.memories.length;
    if (count > 0) {
      this.persist();
      this.notify();
    }
    return count;
  }

  /**
   * Deletes memories whose title/summary matches a query string
   */
  static deleteMatching(keyword: string): number {
    this.init();
    const q = keyword.trim().toLowerCase();
    if (!q) return 0;
    const qSpaced = q.replace(/-/g, ' ');
    const qHyphen = q.replace(/\s+/g, '-');

    const initialLen = this.memories.length;
    this.memories = this.memories.filter((m) => {
      const titleLower = m.title.toLowerCase();
      const summaryLower = m.summary.toLowerCase();
      const contentLower = m.content?.toLowerCase() || '';

      const matchText = (text: string) =>
        text.includes(q) || text.includes(qSpaced) || text.includes(qHyphen);

      const tagMatch = m.tags.some((t) => {
        const tl = t.toLowerCase();
        return tl.includes(q) || tl.includes(qSpaced) || tl.includes(qHyphen);
      });

      const match = matchText(titleLower) || matchText(summaryLower) || matchText(contentLower) || tagMatch;
      return !match;
    });

    const count = initialLen - this.memories.length;
    if (count > 0) {
      this.persist();
      this.notify();
    }
    return count;
  }

  /**
   * Clears all memories
   */
  static clearAll(): void {
    this.init();
    this.memories = [];
    this.persist();
    this.notify();
  }

  // ========================================================
  // Retention & Limits
  // ========================================================

  /**
   * Purges expired temporary contexts
   */
  private static purgeExpired(): void {
    const now = Date.now();
    const initialLen = this.memories.length;
    this.memories = this.memories.filter((m) => {
      if (m.type === 'TEMPORARY_CONTEXT' && m.expiresAt && m.expiresAt <= now) {
        return false;
      }
      return true;
    });
    if (this.memories.length < initialLen) {
      this.persist();
    }
  }

  private static enforceCategoryLimits(type: JarvisMemoryType): void {
    const maxItems = type === 'TEMPORARY_CONTEXT' ? 20 : 50;
    const sameType = this.memories.filter((m) => m.type === type);
    if (sameType.length > maxItems) {
      // Keep newest
      const toKeep = new Set(sameType.slice(0, maxItems).map((m) => m.memoryId));
      this.memories = this.memories.filter((m) => m.type !== type || toKeep.has(m.memoryId));
    }
  }

  // ========================================================
  // Settings
  // ========================================================

  static getSettings(): JarvisMemorySettings {
    this.init();
    return { ...this.settings };
  }

  static updateSettings(partial: Partial<JarvisMemorySettings>): void {
    this.init();
    this.settings = { ...this.settings, ...partial };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
      }
    } catch (e) {
      console.warn('[JarvisMemoryStorage] Error saving memory settings:', e);
    }
    this.notify();
  }

  // ========================================================
  // Persistence & Subscriptions
  // ========================================================

  private static persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(this.memories));
      }
    } catch (e) {
      console.warn('[JarvisMemoryStorage] Error saving memories to local storage:', e);
    }
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
      } catch (err) {
        console.error('[JarvisMemoryStorage] Listener error:', err);
      }
    });
  }
}
