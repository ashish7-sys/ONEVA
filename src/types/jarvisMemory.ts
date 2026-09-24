/**
 * ONEVA Phase 14: Jarvis Memory, Personal Context & Owner Access Control Types
 * 
 * Local-First, Privacy-First, User-Controlled Memory and Multi-User Authorization
 */

export type JarvisMemoryType =
  | 'USER_SAVED_MEMORY'       // Explicitly requested by user ("Remember that...")
  | 'JARVIS_TASK_MEMORY'      // Safe summaries of completed tasks
  | 'RESEARCH_MEMORY'         // Safe research summaries/findings for later recall
  | 'USER_PREFERENCE_MEMORY'  // Explicit user preferences
  | 'TEMPORARY_CONTEXT';      // Short-lived task context with automatic expiry

export type JarvisMemoryImportance = 'low' | 'medium' | 'high';

export type JarvisMemorySource =
  | 'user_explicit'
  | 'jarvis_research'
  | 'task_execution'
  | 'system_preference'
  | 'user_voice';

export type JarvisOwnerScope = 'owner' | 'user_2' | 'unknown' | 'device_shared';

export interface JarvisMemoryItem {
  memoryId: string;
  type: JarvisMemoryType;
  title: string;
  summary: string;
  content?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  source: JarvisMemorySource;
  importance: JarvisMemoryImportance;
  expiresAt?: number;          // Required for TEMPORARY_CONTEXT
  ownerScope: JarvisOwnerScope;
  version: number;             // Schema version (e.g. 1)
  reasonStored: string;        // Human-readable explanation of why this was stored
}

export type JarvisActorType = 'owner' | 'secondary' | 'unknown';

export interface JarvisActorProfile {
  id: string;                  // 'owner' | 'user_2' | 'unknown'
  displayName: string;
  type: JarvisActorType;
  voiceEnrolled: boolean;
  voiceConfidenceThreshold: number; // 0 to 1
  avatarColor?: string;
}

export type TaskCategory = 'app_action' | 'research' | 'device_setting' | 'system' | 'custom';
export type TaskSensitivity = 'normal' | 'protected';
export type TaskAccessPolicy = 'owner_only' | 'creator_only' | 'shared';

export interface JarvisTaskHistoryItem {
  taskId: string;
  actorProfileId: string;
  actorType: JarvisActorType;
  actorDisplayName: string;
  summary: string;             // Compact safe summary, never raw chat/passwords
  category: TaskCategory;
  createdAt: number;
  sensitivity: TaskSensitivity;
  accessPolicy: TaskAccessPolicy;
  relatedToolId?: string;
}

export interface OwnerAuthCredentials {
  salt: string;
  passwordHash: string;
  isConfigured: boolean;
  updatedAt: number;
  failedAttempts: number;
  lockoutUntil?: number;
}

export type MemoryRetrievalIntent =
  | 'NEW_RESEARCH'
  | 'PREVIOUS_RESEARCH'
  | 'USER_SAVED_MEMORY'
  | 'PREVIOUS_TASK'
  | 'DEVICE_TOTAL_HISTORY'
  | 'SAVE_MEMORY'
  | 'FORGET_MEMORY'
  | 'NONE';

export interface MemoryRetrievalResult {
  intent: MemoryRetrievalIntent;
  matchedMemories: JarvisMemoryItem[];
  matchedTasks?: JarvisTaskHistoryItem[];
  directAnswer?: string;
  confidence: number;
  requiresOwnerVerification?: boolean;
}

export interface JarvisMemorySettings {
  autoSaveTaskMemory: boolean;
  autoSaveResearchMemory: boolean;
  autoSavePreferences: boolean;
  retentionDays: number;
  enableVoiceVerification: boolean;
  activeActorId: string; // Current simulated / recognized actor ID
}
