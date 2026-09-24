/**
 * ONEVA Phase 20: Jarvis Task Result Storage
 * 
 * Manages durable, persistent storage for results and artifacts produced by
 * long-running Jarvis operations (research reports, generated assets, project
 * blueprints, analysis documents, and structured summaries).
 * 
 * Enforces stable result IDs to prevent duplicate file creation on retries
 * or reconnection, and binds with Phase 14 Memory and Task History.
 */

import { JarvisTaskResult, JarvisTaskArtifact } from '../../types/jarvisWorkPanel';
import { JarvisMemoryStorage } from '../memory/jarvisMemoryStorage';
import { JarvisTaskHistoryService } from '../memory/jarvisTaskHistoryService';
import { OwnerAuthService } from '../memory/ownerAuthService';

const STORAGE_KEY_RESULTS = 'oneva_jarvis_task_results_v1';
const MAX_STORED_RESULTS = 50;

export class JarvisTaskResultStorage {
  private static results: Map<string, JarvisTaskResult> = new Map();
  private static isInitialized = false;

  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RESULTS);
      if (raw) {
        const parsed: JarvisTaskResult[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.results.clear();
          parsed.forEach((item) => {
            if (item && item.resultId) {
              this.results.set(item.resultId, item);
            }
          });
        }
      }
    } catch (err) {
      console.warn('[JarvisTaskResultStorage] Error loading stored results:', err);
    }
  }

  /**
   * Generates a stable result ID derived from the taskId to avoid duplicate creations.
   */
  static getStableResultId(taskId: string): string {
    return `res_${taskId}`;
  }

  /**
   * Stores or updates a task result idempotently.
   */
  static saveResult(result: JarvisTaskResult, actorType?: 'owner' | 'secondary'): void {
    this.init();
    this.results.set(result.resultId, result);
    this.persist();

    // Mirror safe summary into Phase 14 Memory
    try {
      if (JarvisMemoryStorage.getSettings().autoSaveResearchMemory) {
        const resolvedActor = (actorType === 'owner' || OwnerAuthService.getActiveActorType() === 'owner') ? 'owner' : 'user_2';
        JarvisMemoryStorage.save({
          memoryId: `mem_${result.resultId}`,
          type: 'RESEARCH_MEMORY',
          title: result.title,
          summary: result.summary,
          content: result.mainContent.slice(0, 1000),
          tags: ['jarvis_task_result', result.outputType],
          createdAt: result.completedAt,
          updatedAt: Date.now(),
          source: 'jarvis_research',
          importance: 'medium',
          ownerScope: resolvedActor,
          reasonStored: `Autonomous result for task ${result.taskId}`,
        });
      }

      // Record in Task History
      JarvisTaskHistoryService.recordTask(
        `Completed: ${result.title}`,
        'research',
        { taskId: result.taskId }
      );
    } catch (err) {
      console.warn('[JarvisTaskResultStorage] Notice mirroring to memory:', err);
    }
  }

  /**
   * Retrieves a result by its stable result ID.
   */
  static getResult(resultId: string): JarvisTaskResult | null {
    this.init();
    return this.results.get(resultId) || null;
  }

  /**
   * Retrieves the result associated with a specific task ID.
   */
  static getResultByTaskId(taskId: string): JarvisTaskResult | null {
    this.init();
    const stableId = this.getStableResultId(taskId);
    if (this.results.has(stableId)) {
      return this.results.get(stableId)!;
    }
    for (const res of this.results.values()) {
      if (res.taskId === taskId) return res;
    }
    return null;
  }

  /**
   * Returns all stored results sorted newest first.
   */
  static getAllResults(): JarvisTaskResult[] {
    this.init();
    return Array.from(this.results.values()).sort((a, b) => b.completedAt - a.completedAt);
  }

  /**
   * Deletes a result.
   */
  static deleteResult(resultId: string): boolean {
    this.init();
    const existed = this.results.delete(resultId);
    if (existed) {
      this.persist();
    }
    return existed;
  }

  private static persist(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const all = Array.from(this.results.values()).slice(0, MAX_STORED_RESULTS);
      localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(all));
    } catch (err) {
      console.warn('[JarvisTaskResultStorage] Error persisting results:', err);
    }
  }
}
