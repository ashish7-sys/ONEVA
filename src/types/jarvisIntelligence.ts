/**
 * ONEVA Phase 11: Jarvis Intelligence & Task Planner Type Definitions
 * 
 * Defines structured intent models, task complexity levels, dependency-aware
 * execution plans, capability requirements, and short-lived conversational context.
 */

export type JarvisIntentType =
  | 'conversation'          // Casual conversation, greetings, persona queries
  | 'information_request'   // Questions, knowledge queries, quick facts
  | 'app_request'           // Launch, switch, or inspect existing Android apps
  | 'device_request'        // System toggles (volume, brightness, wifi, torch)
  | 'search_request'        // Web or in-app search query (Phase 12 preparation)
  | 'research_request'      // Multi-source synthesis, asset finding, deep analysis
  | 'media_request'         // Music, video, audio playback controls
  | 'file_request'          // Storage inspection, downloads, file movement
  | 'creation_request'      // Asset generation (wallpapers, themes, custom icons)
  | 'modification_request'  // Customization adjustments (Phase 9 integration)
  | 'settings_request'      // Launcher, assistant, or system preference changes
  | 'clarification_required'// Ambiguous requests lacking essential details
  | 'unsupported_request';  // Impossible or out-of-scope requests

export type JarvisTaskComplexity =
  | 'SIMPLE'           // Single-step direct execution (e.g., "Open YouTube")
  | 'MULTI_STEP'       // Multiple sequential actions (e.g., "Open YouTube and search cricket highlights")
  | 'RESEARCH_COMPLEX' // Exploration, multi-source evaluation, filtering (e.g., "Find free 3D tree model")
  | 'AMBIGUOUS'        // Needs user clarification before planning can proceed
  | 'UNSUPPORTED';     // Outside Android / ONEVA boundary

export type JarvisTaskStatus =
  | 'QUEUED'
  | 'PLANNING'
  | 'WAITING_FOR_INPUT'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type JarvisTaskPriority = 'LOW' | 'NORMAL' | 'HIGH';

export type JarvisTaskEventType =
  | 'TASK_CREATED'
  | 'TASK_PLANNED'
  | 'TASK_WAITING_FOR_INPUT'
  | 'TASK_READY'
  | 'TASK_STARTED'
  | 'TASK_STEP_STARTED'
  | 'TASK_STEP_COMPLETED'
  | 'TASK_PAUSED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'TASK_CANCELLED';

export type JarvisCapabilityRequirement =
  | 'app_launch'
  | 'app_interaction'
  | 'web_search'
  | 'source_analysis'
  | 'file_read'
  | 'file_save'
  | 'device_control'
  | 'media_playback'
  | 'theme_customization'
  | 'icon_customization'
  | 'system_settings'
  | 'none';

/**
 * Structured entities extracted from natural-language inputs
 */
export interface JarvisEntities {
  application?: string;
  targetContact?: string;
  query?: string;
  secondaryTask?: string;
  assetType?: string;
  subject?: string;
  constraints?: string[];
  purpose?: string;
  action?: string;
  settingName?: string;
  settingValue?: string | number | boolean;
  itemIndex?: number;
  rawKeywords?: string[];
  [key: string]: unknown;
}

/**
 * Structured Jarvis intent result
 */
export interface JarvisIntent {
  intentType: JarvisIntentType;
  userRequest: string;
  normalizedRequest: string;
  detectedLanguage: 'en' | 'hi' | 'pa' | 'hr' | 'other';
  entities: JarvisEntities;
  confidence: number;
  complexity: JarvisTaskComplexity;
  requiresPlanning: boolean;
  requiresConfirmation: boolean;
  requiresExternalTool: boolean;
  requiresUserInput: boolean;
  reasoningSummary: string;
  suggestedResponse?: string;
  executionTier?: 'LOCAL_EDGE_NEURAL' | 'CLOUD_HYBRID_ESCALATED';
  latencyMs?: number;
  offlineCapable?: boolean;
}

/**
 * Structured step in a task plan with explicit dependencies
 */
export interface JarvisTaskStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: 'app_action' | 'search' | 'evaluate' | 'synthesize' | 'file_op' | 'device_op' | 'clarify' | 'conversation';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  dependencies: string[]; // IDs of predecessor steps that must be completed first
  capabilityRequired: JarvisCapabilityRequirement;
  requiresConfirmation?: boolean;
  result?: string;
}

/**
 * Structured clarification request when input is ambiguous
 */
export interface JarvisClarificationRequest {
  needsClarification: boolean;
  question: string;
  missingInformation: string[];
  suggestedAnswers?: string[];
}

/**
 * Clean execution handoff object preparing output for later execution phases
 */
export interface JarvisExecutionHandoff {
  taskId: string;
  intent: JarvisIntentType;
  entities: JarvisEntities;
  planSummary: string;
  requiredCapabilities: JarvisCapabilityRequirement[];
  confirmationState: 'NOT_REQUIRED' | 'PENDING' | 'CONFIRMED' | 'REJECTED';
  targetPhase: 'PHASE_12_SEARCH' | 'PHASE_13_ANDROID_ACTIONS' | 'PHASE_16_CREATION' | 'SYSTEM_LAUNCHER' | 'CONVERSATION' | 'UNSUPPORTED';
  handoffTimestamp: number;
}

/**
 * Full persistent/serializable task plan
 */
export interface JarvisTaskPlan {
  taskId: string;
  originalRequest: string;
  intent: JarvisIntent;
  status: JarvisTaskStatus;
  priority: JarvisTaskPriority;
  createdAt: number;
  updatedAt: number;
  steps: JarvisTaskStep[];
  clarification?: JarvisClarificationRequest;
  executionHandoff?: JarvisExecutionHandoff;
  planSummary: string;
  userFeedback?: string;
}

/**
 * Short-lived conversation and task context for follow-up interpretation
 */
export interface JarvisShortLivedContext {
  activeTaskId?: string;
  activeTopic?: string;
  recentEntities: JarvisEntities;
  lastUserPrompt?: string;
  lastIntentType?: JarvisIntentType;
  lastPlan?: JarvisTaskPlan;
  followUpCount: number;
  expiresAt: number;
}

/**
 * Structured task event broadcast
 */
export interface JarvisTaskEvent {
  eventType: JarvisTaskEventType;
  taskId: string;
  timestamp: number;
  stepId?: string;
  message: string;
  plan?: JarvisTaskPlan;
}

/**
 * Provider interface for pluggable AI / NLU understanding engines
 */
export interface JarvisIntelligenceProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  understandIntent(
    input: string,
    context?: JarvisShortLivedContext
  ): Promise<JarvisIntent>;
}
