/**
 * ONEVA Phase 24: Real-JARVIS Dynamic Autonomous Tool Synthesis Types
 * 
 * Defines schemas for on-the-fly macro synthesis, step compilation,
 * Rule 6 safety auditing, and dynamic tool lifecycle management.
 */

import { JarvisToolId } from './jarvisActions';

export interface DynamicMacroStep {
  stepId: string;
  name: string;
  targetToolId: JarvisToolId | string;
  params: Record<string, any>;
  delayMs?: number;
  isCritical?: boolean;
}

export interface DynamicToolSafetyAudit {
  passed: boolean;
  rule6Compliant: boolean;
  noPasswordAccess: boolean;
  noSpywareOrKeystrokeLogging: boolean;
  noBytecodeTampering: boolean;
  riskAssessment: 'LOW' | 'MEDIUM' | 'BLOCKED_HIGH_RISK';
  auditReason: string;
}

export interface DynamicToolDefinition {
  id: string;
  title: string;
  voiceTriggers: string[];
  description: string;
  category: 'productivity' | 'multimedia' | 'defense_and_system' | 'custom_macro';
  steps: DynamicMacroStep[];
  safetyAudit: DynamicToolSafetyAudit;
  author: 'JARVIS_SYNTHESIS_ENGINE' | 'USER_DIRECTIVE';
  createdAt: number;
  executionCount: number;
  lastExecutedAt?: number;
  isEnabled: boolean;
  isPinnedToVoice: boolean;
}

export interface DynamicToolExecutionResult {
  toolId: string;
  success: boolean;
  executedStepsCount: number;
  totalStepsCount: number;
  executionTimeMs: number;
  userMessageEn: string;
  userMessageHi: string;
  stepResults: Array<{
    stepId: string;
    targetToolId: string;
    success: boolean;
    output?: string;
  }>;
}
