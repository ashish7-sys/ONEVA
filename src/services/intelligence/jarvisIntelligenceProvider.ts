/**
 * ONEVA Phase 11: Jarvis Intelligence Provider Abstraction & Service
 * 
 * Provides pluggable provider architecture with a zero-latency, local-first
 * multilingual NLU engine as default, safe fallback behavior, and unified
 * pipeline coordinating intent analysis and task planning.
 */

import {
  JarvisIntelligenceProvider,
  JarvisIntent,
  JarvisTaskPlan,
  JarvisShortLivedContext,
} from '../../types/jarvisIntelligence';
import { JarvisNluEngine } from './jarvisNluEngine';
import { JarvisTaskPlanner } from './jarvisTaskPlanner';
import { JarvisContextService } from './jarvisContextService';
import { SearchIntentDetector } from './search/searchIntentDetector';
import { JarvisResearchService } from './search/jarvisResearchService';
import { JarvisActionSelector } from '../actions/jarvisActionSelector';
import { JarvisMemoryRetrievalService } from '../memory/jarvisMemoryRetrievalService';
import { JarvisEdgeNeuralService } from '../edge/jarvisEdgeNeuralService';

/**
 * High-performance, local-first on-device intelligence provider with Edge Neural Core
 */
export class LocalJarvisIntelligenceProvider implements JarvisIntelligenceProvider {
  name = 'ONEVA On-Device Edge Neural Core';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async understandIntent(
    input: string,
    context?: JarvisShortLivedContext
  ): Promise<JarvisIntent> {
    // 1. Run Sub-15ms Edge Neural Semantic Vector Resolution
    const edgeRes = JarvisEdgeNeuralService.resolveIntent(input);

    // 2. Resolve complete structured NLU intent
    const baseIntent = await JarvisNluEngine.understand(input, context);

    // 3. Fuse Edge Neural metadata & execution tier
    baseIntent.executionTier = edgeRes.executionTier;
    baseIntent.latencyMs = edgeRes.latencyMs;
    baseIntent.offlineCapable = edgeRes.offlineCapable;

    if (edgeRes.executionTier === 'LOCAL_EDGE_NEURAL' && edgeRes.edgeConfidence > baseIntent.confidence) {
      baseIntent.confidence = edgeRes.edgeConfidence;
      baseIntent.reasoningSummary = `${edgeRes.reasoningVector} | Latency: ${edgeRes.latencyMs}ms`;
      if (edgeRes.suggestedSpeechEn && !baseIntent.suggestedResponse) {
        baseIntent.suggestedResponse = baseIntent.detectedLanguage === 'hi'
          ? edgeRes.suggestedSpeechHi
          : edgeRes.suggestedSpeechEn;
      }
    }

    return baseIntent;
  }
}

/**
 * Central Jarvis Intelligence Coordination Service
 */
export class JarvisIntelligenceService {
  private static provider: JarvisIntelligenceProvider = new LocalJarvisIntelligenceProvider();
  private static isProcessing = false;
  private static listeners: Set<() => void> = new Set();

  /**
   * Configures or switches the active intelligence provider
   */
  static setProvider(provider: JarvisIntelligenceProvider): void {
    this.provider = provider;
    this.notify();
  }

  static getProviderName(): string {
    return this.provider.name;
  }

  static isBusy(): boolean {
    return this.isProcessing;
  }

  /**
   * Main Pipeline:
   * USER INPUT
   *   ↓
   * INTENT UNDERSTANDING (Provider)
   *   ↓
   * TASK PLANNING (Planner)
   *   ↓
   * WEB RESEARCH / EXECUTION HANDOFF (Phase 12 / 13)
   */
  static async processUserInput(
    rawText: string
  ): Promise<{
    intent: JarvisIntent;
    plan: JarvisTaskPlan;
    friendlyResponse: string;
  }> {
    const trimmed = rawText.trim();
    if (!trimmed) {
      throw new Error('Input text cannot be empty');
    }

    this.isProcessing = true;
    this.notify();

    try {
      // 1. Retrieve short-lived task context
      const context = JarvisContextService.getContext() || undefined;

      // 2. Perform intent understanding with active provider
      let intent: JarvisIntent;
      try {
        intent = await this.provider.understandIntent(trimmed, context);
      } catch (providerError) {
        console.warn('[JarvisIntelligence] Provider failed, using safe fallback:', providerError);
        // Safe fallback without fabricating answers
        intent = {
          intentType: 'clarification_required',
          userRequest: trimmed,
          normalizedRequest: trimmed.toLowerCase(),
          detectedLanguage: 'en',
          entities: {},
          confidence: 0.2,
          complexity: 'AMBIGUOUS',
          requiresPlanning: false,
          requiresConfirmation: false,
          requiresExternalTool: false,
          requiresUserInput: true,
          reasoningSummary: 'Understanding engine encountered an error. Requesting repetition.',
          suggestedResponse: 'Jarvis could not understand the request right now. Please repeat or rephrase.',
        };
      }

      // 3. Central Task Planner
      const plan = JarvisTaskPlanner.planTask(intent);
      let friendlyResponse = intent.suggestedResponse || plan.planSummary;

      // 4. Phase 14: Check Jarvis Memory & Personal Context Retrieval
      const memoryResult = JarvisMemoryRetrievalService.analyzeQuery(trimmed, intent.detectedLanguage);
      if (memoryResult.intent !== 'NONE' && memoryResult.directAnswer) {
        friendlyResponse = memoryResult.directAnswer;
        plan.status = 'COMPLETED';
        plan.planSummary = memoryResult.directAnswer;
        if (plan.steps.length > 0) {
          plan.steps[0].status = 'COMPLETED';
          plan.steps[0].result = memoryResult.directAnswer;
        }
        return {
          intent,
          plan,
          friendlyResponse,
        };
      }

      // 5. Check Phase 12 Web Intelligence & Research Execution
      const searchEvaluation = SearchIntentDetector.evaluate(trimmed);

      // Only perform web research if search intent requires internet
      if (
        (plan.executionHandoff?.targetPhase === 'PHASE_12_SEARCH' || intent.intentType === 'research_request') &&
        searchEvaluation.requiresInternet &&
        searchEvaluation.category !== 'NORMAL_AI' &&
        searchEvaluation.category !== 'DEVICE_ACTION'
      ) {
        try {
          const researchJob = await JarvisResearchService.executeResearch(trimmed, plan);
          if (researchJob.findings?.directAnswer) {
            friendlyResponse = researchJob.findings.directAnswer;
          }
        } catch (researchErr) {
          console.warn('[JarvisIntelligence] Research pipeline error:', researchErr);
        }
      }

      // 5. Phase 13: Centralized Android Actions & Tool Dispatcher
      if (
        plan.executionHandoff?.targetPhase === 'PHASE_13_ANDROID_ACTIONS' ||
        intent.intentType === 'app_request' ||
        intent.intentType === 'device_request' ||
        JarvisActionSelector.isActionCandidate(trimmed, intent)
      ) {
        try {
          const actionResult = await JarvisActionSelector.selectAndExecute(
            trimmed,
            intent,
            intent.detectedLanguage
          );

          if (actionResult) {
            friendlyResponse = actionResult.userMessage;
            const newStatus = actionResult.success ? 'COMPLETED' : 'FAILED';
            JarvisTaskPlanner.updatePlanStatus(
              plan.taskId,
              newStatus,
              plan.steps[0]?.id,
              actionResult.technicalDetails || actionResult.userMessage,
              actionResult.userMessage
            );
          }
        } catch (actionErr) {
          console.warn('[JarvisIntelligence] Action dispatcher error:', actionErr);
        }
      }

      return {
        intent,
        plan,
        friendlyResponse,
      };
    } finally {
      this.isProcessing = false;
      this.notify();
    }
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

