/**
 * ONEVA Phase 3 / Phase 22 Evolution: JARVIS Predictive Intent & Autonomous Routine Synthesis
 * 
 * Defines schemas for:
 * - Real-time Intent Anticipation & Neural Context Fusion
 * - Autonomous Multi-Step Routines & Contextual Triggers
 * - Local-First Habit & Pattern Learning Engine (Rule 6 Compliant)
 * - Proactive HUD Dispatcher with Auto-Execute & Safety Countdown
 */

export type PredictiveIntentCategory =
  | 'routine'
  | 'optimization'
  | 'communication'
  | 'environment'
  | 'focus'
  | 'security';

export interface PredictiveIntent {
  id: string;
  title: string;
  description: string;
  confidence: number; // 0 to 100%
  category: PredictiveIntentCategory;
  triggerReason: string;
  routineId?: string;
  actionPayload?: Record<string, any>;
  vocalPromptEn: string;
  vocalPromptHi: string;
  autoExecutable: boolean;
  suggestedAt: number;
}

export interface RoutineStep {
  stepId: string;
  name: string;
  toolId: string;
  args: Record<string, any>;
  description: string;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  error?: string;
}

export interface RoutineTriggerConditions {
  timeWindow?: {
    startHour: number;
    endHour: number;
    daysOfWeek?: number[]; // 0 = Sun, 1 = Mon ... 6 = Sat
  };
  batteryThreshold?: {
    operator: '<=' | '>=';
    level: number;
  };
  chargingState?: 'charging' | 'discharging' | 'any';
  wifiConnected?: boolean;
  voiceKeywords?: string[];
}

export interface AutonomousRoutine {
  id: string;
  name: string;
  nameHindi: string;
  description: string;
  icon: string;
  enabled: boolean;
  isAutoTrigger: boolean; // Auto-executes if threshold matched
  autoExecuteConfidenceThreshold: number; // e.g. 85%
  triggerConditions: RoutineTriggerConditions;
  steps: RoutineStep[];
  lastExecutedAt?: number;
  executionCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface LearnedHabitPattern {
  patternId: string;
  actionName: string;
  hourBucket: number; // 0-23
  dayOfWeek: number; // 0-6
  frequency: number;
  lastSeenAt: number;
  confidenceScore: number; // 0 - 100
  associatedRoutineId?: string;
}

export interface PredictiveContextSnapshot {
  timeFormatted: string;
  hour: number;
  dayOfWeek: number;
  batteryLevel: number;
  isCharging: boolean;
  circadianSlot: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'late_night';
  recentEpisodeCount: number;
}

export interface RoutineExecutionRecord {
  executionId: string;
  routineId: string;
  routineName: string;
  executedAt: number;
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  triggerSource: 'autonomous_timer' | 'voice_command' | 'one_tap_hud' | 'tool_invocation';
  durationMs: number;
}

export interface PredictiveTelemetry {
  currentContext: PredictiveContextSnapshot;
  activeIntents: PredictiveIntent[];
  routinesCount: number;
  habitsLearnedCount: number;
  totalRoutinesExecuted: number;
  lastPredictionTimestamp: number;
}
