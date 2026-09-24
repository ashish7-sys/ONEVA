/**
 * ONEVA Phase 20: Jarvis Live Work Panel & Background Task Continuation Types
 * 
 * Defines data structures for long-running AI tasks, lifecycle stages,
 * execution states, result storage, and the mobile-first Work Panel.
 */

export type JarvisLongRunningTaskStatus =
  | 'QUEUED'
  | 'STARTING'
  | 'RUNNING'
  | 'PAUSED_NETWORK'
  | 'RETRYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type JarvisTaskStage =
  | 'QUEUED'
  | 'STARTING'
  | 'RESEARCHING'
  | 'ANALYZING'
  | 'GENERATING'
  | 'VERIFYING'
  | 'FINALIZING'
  | 'COMPLETED';

export type JarvisTaskType =
  | 'web_research'
  | 'asset_generation'
  | 'complex_analysis'
  | 'project_build'
  | 'model_reasoning'
  | 'autonomous_orchestration';

export interface JarvisTaskArtifact {
  artifactId: string;
  name: string;
  type: 'text' | 'research_report' | 'generated_code' | 'generated_asset' | 'project_artifact' | 'document' | 'structured_data';
  content: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: number;
}

export interface JarvisTaskResult {
  resultId: string;
  taskId: string;
  title: string;
  summary: string;
  outputType: 'text' | 'research_report' | 'generated_code' | 'generated_asset' | 'project_artifact' | 'document' | 'structured_data';
  mainContent: string;
  artifacts: JarvisTaskArtifact[];
  completedAt: number;
  metadata: Record<string, any>;
}

export interface JarvisWorkTask {
  taskId: string; // Stable ID: jarvis-task-xxxxxxxx
  title: string;
  originalPrompt: string;
  taskType: JarvisTaskType;
  status: JarvisLongRunningTaskStatus;
  currentStage: JarvisTaskStage;
  stageDescription: string;
  progressPercent?: number; // Only present when reliable; never fabricated
  progressMessage: string;
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  elapsedMs?: number;
  heartbeatTimestamp: number; // For lease and stale task detection
  actorProfileId: string;
  actorType: 'owner' | 'secondary';
  canCancel: boolean;
  error?: string;
  failureClassification?: 'NETWORK_REQUIRED' | 'RETRYABLE' | 'NON_RETRYABLE' | 'TIMEOUT' | 'ABORTED';
  result?: JarvisTaskResult;
  retryCount: number;
  maxRetries: number;
  idempotencyKey: string;
  completedStages: JarvisTaskStage[];
}

export interface JarvisWorkPanelNotification {
  id: string;
  taskId: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'completed' | 'failed' | 'cancelled' | 'network_paused';
}

export interface JarvisWorkPanelState {
  isOpen: boolean;
  focusedTaskId: string | null;
  activeTasks: JarvisWorkTask[];
  allTasks: JarvisWorkTask[];
  isOnline: boolean;
  notification: JarvisWorkPanelNotification | null;
  lastUpdated: number;
}

export interface LongRunningEvaluation {
  isLongRunning: boolean;
  taskType?: JarvisTaskType;
  title?: string;
  reason?: string;
  suggestedInitialStage?: JarvisTaskStage;
}
