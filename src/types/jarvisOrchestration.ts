/**
 * ONEVA Phase 15: Jarvis Autonomous Task Execution & Multi-Step Action Orchestration
 * 
 * Defines structured types for multi-step task plans, dependency graphs,
 * step execution states, verification outcomes, failure classifications,
 * and persistent execution queue models.
 */

import { JarvisToolId, JarvisActionResult } from './jarvisActions';

export type JarvisOrchestratedTaskStatus =
  | 'QUEUED'
  | 'PLANNING'
  | 'WAITING_FOR_PERMISSION'
  | 'WAITING_FOR_INPUT'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type JarvisOrchestratedStepStatus =
  | 'PENDING'
  | 'READY'
  | 'RUNNING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'
  | 'CANCELLED';

export type JarvisStepVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'FAILED';

export type JarvisFailureClassification =
  | 'RETRYABLE'
  | 'NON_RETRYABLE'
  | 'PERMISSION_REQUIRED'
  | 'UNSUPPORTED'
  | 'NETWORK_REQUIRED'
  | 'USER_INPUT_REQUIRED';

export interface JarvisOrchestratedStep {
  stepId: string;
  taskId: string;
  order: number;
  title: string;
  description: string;
  capability: string;
  toolId: JarvisToolId;
  parameters: Record<string, any>;
  dependencies: string[]; // stepIds of prerequisite steps
  status: JarvisOrchestratedStepStatus;
  startedAt?: number;
  completedAt?: number;
  result?: string;
  error?: string;
  verificationStatus: JarvisStepVerificationStatus;
  failureType?: JarvisFailureClassification;
  retryCount?: number;
  maxRetries?: number;
  isIdempotent?: boolean;
  actionResult?: JarvisActionResult;
}

export interface JarvisOrchestratedTask {
  taskId: string;
  title: string;
  originalGoal: string;
  status: JarvisOrchestratedTaskStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  currentStepIndex: number;
  steps: JarvisOrchestratedStep[];
  actorProfileId: string;
  actorType: 'owner' | 'secondary' | 'unknown';
  requiresPermission?: string;
  failureReason?: string;
  summary?: string;
  isPaused?: boolean;
  isCancelled?: boolean;
  isInterrupted?: boolean;
  canResume?: boolean;
  verificationSummary?: string;
}

export interface JarvisOrchestratorEvent {
  eventType:
    | 'TASK_QUEUED'
    | 'TASK_PLAN_READY'
    | 'TASK_STARTED'
    | 'STEP_STARTED'
    | 'STEP_VERIFYING'
    | 'STEP_COMPLETED'
    | 'STEP_FAILED'
    | 'STEP_SKIPPED'
    | 'TASK_PAUSED'
    | 'TASK_RESUMED'
    | 'TASK_WAITING_PERMISSION'
    | 'TASK_COMPLETED'
    | 'TASK_PARTIALLY_COMPLETED'
    | 'TASK_FAILED'
    | 'TASK_CANCELLED';
  taskId: string;
  stepId?: string;
  message: string;
  timestamp: number;
  task?: JarvisOrchestratedTask;
}

export interface JarvisOrchestratorState {
  activeTaskId: string | null;
  tasks: JarvisOrchestratedTask[];
  isProcessing: boolean;
  interruptedTaskFound: boolean;
  lastCompletedTaskSummary?: string;
}
