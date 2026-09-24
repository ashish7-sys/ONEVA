/**
 * ONEVA Phase 11: Jarvis Short-Lived Context Service
 * 
 * Maintains ephemeral task and conversation context to understand immediate
 * follow-up requests (e.g. "Only free ones", "Show me the second one").
 * 
 * ABSOLUTE PRIVACY:
 * - In-memory only (ephemeral, zero cloud database storage)
 * - Automatically discarded after 10-minute session inactivity or task completion
 * - Distinct from Phase 14's future permanent personal memory
 */

import {
  JarvisShortLivedContext,
  JarvisEntities,
  JarvisIntentType,
  JarvisTaskPlan,
} from '../../types/jarvisIntelligence';

const DEFAULT_CONTEXT_LIFETIME_MS = 600000; // 10 minutes matching Phase 10 active session

export class JarvisContextService {
  private static context: JarvisShortLivedContext | null = null;
  private static expirationTimer: ReturnType<typeof setTimeout> | null = null;
  private static listeners: Set<() => void> = new Set();

  /**
   * Retrieves the current active context if still valid
   */
  static getContext(): JarvisShortLivedContext | null {
    if (!this.context) return null;

    if (Date.now() > this.context.expiresAt) {
      this.clearContext();
      return null;
    }

    return { ...this.context };
  }

  /**
   * Initializes or updates context with new task information
   */
  static setContext(
    taskId: string,
    intentType: JarvisIntentType,
    entities: JarvisEntities,
    userPrompt: string,
    plan?: JarvisTaskPlan
  ): void {
    const previousEntities = this.context?.recentEntities || {};

    // Merge entities conservatively, keeping latest but preserving background context
    const mergedEntities: JarvisEntities = {
      ...previousEntities,
      ...entities,
    };

    // If new constraints were added, merge arrays
    if (previousEntities.constraints && entities.constraints) {
      mergedEntities.constraints = Array.from(
        new Set([...previousEntities.constraints, ...entities.constraints])
      );
    }

    this.context = {
      activeTaskId: taskId,
      activeTopic: entities.subject || entities.assetType || entities.application || this.context?.activeTopic,
      recentEntities: mergedEntities,
      lastUserPrompt: userPrompt,
      lastIntentType: intentType,
      lastPlan: plan || this.context?.lastPlan,
      followUpCount: (this.context?.followUpCount || 0) + 1,
      expiresAt: Date.now() + DEFAULT_CONTEXT_LIFETIME_MS,
    };

    this.resetExpirationTimer();
    this.notify();
  }

  /**
   * Merges follow-up details into existing context
   */
  static applyFollowUp(
    followUpText: string,
    newEntities: JarvisEntities
  ): { previousTopic?: string; resolvedEntities: JarvisEntities } {
    const current = this.getContext();
    if (!current) {
      return { resolvedEntities: newEntities };
    }

    // Merge constraints and specific refinements
    const resolved: JarvisEntities = {
      ...current.recentEntities,
      ...newEntities,
    };

    if (current.recentEntities.constraints && newEntities.constraints) {
      resolved.constraints = Array.from(
        new Set([...current.recentEntities.constraints, ...newEntities.constraints])
      );
    }

    this.context = {
      ...current,
      recentEntities: resolved,
      lastUserPrompt: followUpText,
      followUpCount: current.followUpCount + 1,
      expiresAt: Date.now() + DEFAULT_CONTEXT_LIFETIME_MS,
    };

    this.resetExpirationTimer();
    this.notify();

    return {
      previousTopic: current.activeTopic,
      resolvedEntities: resolved,
    };
  }

  /**
   * Explicitly clears context when user starts a fresh task or session ends
   */
  static clearContext(): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
    this.context = null;
    this.notify();
  }

  private static resetExpirationTimer(): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
    }
    this.expirationTimer = setTimeout(() => {
      this.clearContext();
    }, DEFAULT_CONTEXT_LIFETIME_MS);
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
