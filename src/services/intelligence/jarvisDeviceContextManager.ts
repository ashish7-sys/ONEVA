/**
 * ONEVA Phase 16: Device & App Context Manager
 * 
 * Maintains a lightweight, privacy-first, ephemeral model of the current device/app state.
 * 
 * ABSOLUTE PRIVACY:
 * - Ephemeral in-memory only (never sent to database or cloud)
 * - Zero screen recording, zero keystroke logging, zero private message capture
 * - Strict expiration: expires on app switch, task completion, or 5-minute timeout
 */

import { PageId } from '../../navigation/types';
import { JarvisAppContext, ContextItem, ContextConfidence } from '../../types/jarvisContext';

const DEFAULT_CONTEXT_EXPIRY_MS = 300000; // 5 minutes

export class JarvisDeviceContextManager {
  private static context: JarvisAppContext | null = null;
  private static expiryTimer: ReturnType<typeof setTimeout> | null = null;
  private static listeners: Set<() => void> = new Set();

  /**
   * Initialize or retrieve the active context
   */
  static getActiveContext(): JarvisAppContext | null {
    if (!this.context) return null;

    if (Date.now() > this.context.expiresAt) {
      this.clearContext('TIMEOUT_EXPIRED');
      return null;
    }

    return { ...this.context };
  }

  /**
   * Check if context is currently expired or empty
   */
  static isExpired(): boolean {
    if (!this.context) return true;
    return Date.now() > this.context.expiresAt;
  }

  /**
   * Updates currently active application
   * App Change Detection: If switching to a different application, previous search/item contexts expire.
   */
  static setApp(packageName: string, appName: string): void {
    const now = Date.now();
    const prevApp = this.context?.currentApp?.packageName;
    const isDifferentApp = prevApp && prevApp.toLowerCase() !== packageName.toLowerCase();

    const previousContext = this.context && !isDifferentApp ? this.context : null;

    this.context = {
      currentApp: { packageName, appName },
      currentOnevaSection: undefined,
      activeContextType: 'app_screen',
      activeTaskId: previousContext?.activeTaskId,
      lastExecutedAction: previousContext?.lastExecutedAction,
      currentTaskStep: previousContext?.currentTaskStep,
      knownNavigationContext: {
        screenTitle: appName,
        canGoBack: true,
        depth: 1,
      },
      selectedItemContext: isDifferentApp ? undefined : previousContext?.selectedItemContext,
      timestamp: previousContext?.timestamp || now,
      updatedAt: now,
      expiresAt: now + DEFAULT_CONTEXT_EXPIRY_MS,
      confidence: 'HIGH',
    };

    this.resetTimer();
    this.notify();
  }

  /**
   * Updates ONEVA system section
   */
  static setSection(section: PageId): void {
    const now = Date.now();
    this.context = {
      currentApp: undefined,
      currentOnevaSection: section,
      activeContextType: 'oneva_section',
      activeTaskId: this.context?.activeTaskId,
      lastExecutedAction: this.context?.lastExecutedAction,
      currentTaskStep: this.context?.currentTaskStep,
      knownNavigationContext: {
        screenTitle: `ONEVA ${section}`,
        canGoBack: section !== 'home',
        depth: section === 'home' ? 0 : 1,
      },
      selectedItemContext: undefined,
      timestamp: now,
      updatedAt: now,
      expiresAt: now + DEFAULT_CONTEXT_EXPIRY_MS,
      confidence: 'HIGH',
    };

    this.resetTimer();
    this.notify();
  }

  /**
   * Sets active search results context (e.g. YouTube search or web search)
   * Stores only high-level safe metadata (index, title, url). Zero private message or screen content.
   */
  static setSearchResults(
    query: string,
    items: ContextItem[],
    listType: 'search_results' | 'video_list' | 'app_list' | 'generic' = 'search_results'
  ): void {
    const now = Date.now();
    const current = this.getActiveContext();

    this.context = {
      currentApp: current?.currentApp || { packageName: 'com.google.android.youtube', appName: 'YouTube' },
      currentOnevaSection: current?.currentOnevaSection,
      activeContextType: 'search_results',
      activeTaskId: current?.activeTaskId,
      lastExecutedAction: current?.lastExecutedAction,
      currentTaskStep: current?.currentTaskStep,
      knownNavigationContext: {
        screenTitle: `Search: "${query}"`,
        canGoBack: true,
        depth: 2,
      },
      selectedItemContext: {
        listType,
        query,
        items,
        selectedIndex: undefined,
      },
      timestamp: current?.timestamp || now,
      updatedAt: now,
      expiresAt: now + DEFAULT_CONTEXT_EXPIRY_MS,
      confidence: 'HIGH',
    };

    this.resetTimer();
    this.notify();
  }

  /**
   * Sets selected item in the active list
   */
  static selectItem(index: number): ContextItem | null {
    const ctx = this.getActiveContext();
    if (!ctx || !ctx.selectedItemContext || !ctx.selectedItemContext.items) {
      return null;
    }

    const item = ctx.selectedItemContext.items.find((it) => it.index === index);
    if (item) {
      ctx.selectedItemContext.selectedIndex = index;
      ctx.updatedAt = Date.now();
      ctx.expiresAt = Date.now() + DEFAULT_CONTEXT_EXPIRY_MS;
      this.context = ctx;
      this.notify();
      return item;
    }

    return null;
  }

  /**
   * Records last executed action
   */
  static recordAction(toolId: string, description: string, success: boolean): void {
    const now = Date.now();
    const current = this.getActiveContext();
    if (current) {
      current.lastExecutedAction = {
        toolId,
        timestamp: now,
        success,
        description,
      };
      current.updatedAt = now;
      current.expiresAt = now + DEFAULT_CONTEXT_EXPIRY_MS;
      this.context = current;
      this.notify();
    }
  }

  /**
   * Updates confidence level
   */
  static setConfidence(confidence: ContextConfidence): void {
    if (this.context) {
      this.context.confidence = confidence;
      this.notify();
    }
  }

  /**
   * Explicitly clears context (on task completion, app switch, or user request)
   */
  static clearContext(reason: string = 'USER_OR_TASK_CLEARED'): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    this.context = null;
    this.notify();
  }

  /**
   * Manually sets an artificial expiration for testing
   */
  static setExpiredForTesting(): void {
    if (this.context) {
      this.context.expiresAt = Date.now() - 1000;
    }
  }

  private static resetTimer(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
    }
    this.expiryTimer = setTimeout(() => {
      this.clearContext('TIMEOUT_EXPIRED');
    }, DEFAULT_CONTEXT_EXPIRY_MS);
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
        console.error('[JarvisDeviceContext] Listener error:', e);
      }
    });
  }
}
