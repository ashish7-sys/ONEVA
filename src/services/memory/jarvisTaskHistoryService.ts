/**
 * ONEVA Phase 14: User-Scoped Task History Service
 * 
 * Manages privacy-first, user-scoped task history with multi-user isolation:
 * - Records compact safe summaries of actions/tasks (never raw conversations or passwords)
 * - Strict authorization boundary:
 *   - Normal / Secondary User: Can only see their own permitted history.
 *   - Owner: Can see own history freely; Total device history requires owner verification.
 *   - Unknown User: No history disclosure without verification.
 */

import {
  JarvisTaskHistoryItem,
  JarvisActorType,
  TaskCategory,
  TaskSensitivity,
  TaskAccessPolicy,
} from '../../types/jarvisMemory';
import { OwnerAuthService } from './ownerAuthService';

const STORAGE_KEY_HISTORY = 'oneva_jarvis_task_history_v1';
const MAX_HISTORY_ITEMS = 100;

export interface HistoryQueryResult {
  success: boolean;
  requiresVerification?: boolean;
  message: string;
  items: JarvisTaskHistoryItem[];
  actorScope: string;
}

export class JarvisTaskHistoryService {
  private static history: JarvisTaskHistoryItem[] = [];
  private static isInitialized = false;
  private static listeners: Set<() => void> = new Set();

  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.history = parsed.filter(
              (item) => item && typeof item.taskId === 'string' && typeof item.summary === 'string'
            );
          }
        }
      }
    } catch (e) {
      console.warn('[JarvisTaskHistory] Error reading history store:', e);
    }

    // Seed default starter history if completely empty to demonstrate multi-user isolation
    if (this.history.length === 0) {
      this.seedInitialHistory();
    }
  }

  private static seedInitialHistory(): void {
    const now = Date.now();
    this.history = [
      {
        taskId: 'task_init_1',
        actorProfileId: 'owner',
        actorType: 'owner',
        actorDisplayName: 'Device Owner',
        summary: 'Researched image-to-video generation tools (Runway, Pika, Kling)',
        category: 'research',
        createdAt: now - 3600 * 1000 * 3,
        sensitivity: 'normal',
        accessPolicy: 'creator_only',
      },
      {
        taskId: 'task_init_2',
        actorProfileId: 'owner',
        actorType: 'owner',
        actorDisplayName: 'Device Owner',
        summary: 'Launched YouTube via Android intent',
        category: 'app_action',
        createdAt: now - 3600 * 1000 * 2,
        sensitivity: 'normal',
        accessPolicy: 'creator_only',
        relatedToolId: 'open_app',
      },
      {
        taskId: 'task_init_3',
        actorProfileId: 'user_2',
        actorType: 'secondary',
        actorDisplayName: 'Voice Profile 2',
        summary: 'Opened YouTube and navigated to SK Mission Board channel',
        category: 'app_action',
        createdAt: now - 3600 * 1000,
        sensitivity: 'normal',
        accessPolicy: 'creator_only',
        relatedToolId: 'open_app',
      },
    ];
    this.persist();
  }

  // ========================================================
  // Recording Tasks
  // ========================================================

  /**
   * Records a task summary for the active actor
   */
  static recordTask(
    summary: string,
    category: TaskCategory = 'app_action',
    options?: {
      taskId?: string;
      sensitivity?: TaskSensitivity;
      accessPolicy?: TaskAccessPolicy;
      relatedToolId?: string;
      customActorId?: string;
    }
  ): JarvisTaskHistoryItem {
    this.init();

    const activeActor = options?.customActorId
      ? OwnerAuthService.getAllProfiles().find((p) => p.id === options.customActorId) || OwnerAuthService.getActiveActor()
      : OwnerAuthService.getActiveActor();

    const item: JarvisTaskHistoryItem = {
      taskId: options?.taskId || `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorProfileId: activeActor.id,
      actorType: activeActor.type,
      actorDisplayName: activeActor.displayName,
      summary: summary.trim(),
      category,
      createdAt: Date.now(),
      sensitivity: options?.sensitivity || 'normal',
      accessPolicy: options?.accessPolicy || 'creator_only',
      relatedToolId: options?.relatedToolId,
    };

    this.history.unshift(item);
    if (this.history.length > MAX_HISTORY_ITEMS) {
      this.history.pop();
    }

    this.persist();
    this.notify();
    return item;
  }

  // ========================================================
  // Querying with Privacy Boundaries (Rules 13, 14, 15, 16)
  // ========================================================

  /**
   * Query personal history for the current active actor
   * ("Maine abhi tak kya kya kiya?")
   */
  static getPersonalHistory(actorId?: string): HistoryQueryResult {
    this.init();

    const actor = actorId
      ? OwnerAuthService.getAllProfiles().find((p) => p.id === actorId) || OwnerAuthService.getActiveActor()
      : OwnerAuthService.getActiveActor();

    // Unknown actor check (Rule 16)
    if (actor.type === 'unknown') {
      return {
        success: false,
        message: 'Nothing available for your verified profile. Please verify your profile to access your activity history.',
        items: [],
        actorScope: 'unknown',
      };
    }

    // Filter to ONLY items created by this specific actor (Rule 13)
    const personalItems = this.history.filter((h) => h.actorProfileId === actor.id);

    if (personalItems.length === 0) {
      return {
        success: true,
        message: `${actor.displayName}, aapki koi pichhli activity history nahi mili.`,
        items: [],
        actorScope: actor.id,
      };
    }

    return {
      success: true,
      message: `Found ${personalItems.length} activity items for ${actor.displayName}.`,
      items: personalItems,
      actorScope: actor.id,
    };
  }

  /**
   * Query Total Device History across all users (Rule 14)
   * Protected operation: "Device par abhi tak total kya-kya kaam hua?"
   * Requires Owner Verification.
   */
  static getTotalDeviceHistory(isOwnerVerifiedOverride?: boolean): HistoryQueryResult {
    this.init();

    const actor = OwnerAuthService.getActiveActor();

    // 1. If non-owner requests total device history (Rules 15, 16)
    if (actor.type === 'secondary') {
      return {
        success: false,
        requiresVerification: false,
        message: 'Permission denied. Other users\' work history is protected.',
        items: [],
        actorScope: 'secondary_blocked',
      };
    }

    if (actor.type === 'unknown') {
      return {
        success: false,
        requiresVerification: false,
        message: 'Permission denied. Device-wide work history requires owner verification.',
        items: [],
        actorScope: 'unknown_blocked',
      };
    }

    // 2. Owner request: Verify owner authentication (Rule 14)
    const isUnlocked = isOwnerVerifiedOverride || OwnerAuthService.isOwnerSessionUnlocked();

    if (!isUnlocked) {
      return {
        success: false,
        requiresVerification: true,
        message: 'OWNER VERIFICATION REQUIRED. Please authenticate with your Owner Password to view device-wide activity history.',
        items: [],
        actorScope: 'owner_locked',
      };
    }

    // 3. Verification passed: Return all device tasks
    return {
      success: true,
      requiresVerification: false,
      message: `Complete device activity history unlocked (${this.history.length} total events).`,
      items: [...this.history],
      actorScope: 'device_wide',
    };
  }

  /**
   * Returns all items in memory store for internal test assertions
   */
  static getAllItemsRaw(): JarvisTaskHistoryItem[] {
    this.init();
    return [...this.history];
  }

  /**
   * Clear task history
   */
  static clearHistory(ownerOnly: boolean = false): void {
    this.init();
    if (ownerOnly) {
      this.history = this.history.filter((h) => h.actorType !== 'owner');
    } else {
      this.history = [];
    }
    this.persist();
    this.notify();
  }

  // ========================================================
  // Persistence & Subscriptions
  // ========================================================

  private static persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.history));
      }
    } catch (e) {
      console.warn('[JarvisTaskHistory] Error saving history:', e);
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
        console.error('[JarvisTaskHistory] Listener error:', err);
      }
    });
  }
}
