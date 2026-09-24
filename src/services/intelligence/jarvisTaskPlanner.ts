/**
 * ONEVA Phase 11: Jarvis Central Task Planner
 * 
 * Converts structured intents and extracted entities into dependency-aware,
 * prioritized execution plans with explicit capability requirements and clean
 * execution handoffs for future phases (Phase 12 Web Search, Phase 13 Android Actions).
 */

import {
  JarvisIntent,
  JarvisTaskPlan,
  JarvisTaskStep,
  JarvisTaskStatus,
  JarvisTaskPriority,
  JarvisTaskEvent,
  JarvisTaskEventType,
  JarvisCapabilityRequirement,
  JarvisExecutionHandoff,
  JarvisClarificationRequest,
} from '../../types/jarvisIntelligence';
import { JarvisContextService } from './jarvisContextService';

export class JarvisTaskPlanner {
  private static activePlan: JarvisTaskPlan | null = null;
  private static taskHistory: JarvisTaskPlan[] = [];
  private static eventListeners: Set<(event: JarvisTaskEvent) => void> = new Set();

  /**
   * Main entry point: creates an ordered task plan from a recognized intent
   */
  static planTask(intent: JarvisIntent): JarvisTaskPlan {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = Date.now();

    // Determine initial task status and priority
    let initialStatus: JarvisTaskStatus = 'PLANNING';
    const priority: JarvisTaskPriority = this.calculatePriority(intent);

    // If ambiguous, require clarification first
    if (intent.complexity === 'AMBIGUOUS' || intent.intentType === 'clarification_required') {
      initialStatus = 'WAITING_FOR_INPUT';
    } else if (intent.complexity === 'UNSUPPORTED' || intent.intentType === 'unsupported_request') {
      initialStatus = 'FAILED';
    } else {
      initialStatus = 'READY';
    }

    // Generate ordered steps with explicit dependencies
    const steps: JarvisTaskStep[] = this.generateOrderedSteps(taskId, intent);

    // Calculate aggregated capability requirements
    const requiredCapabilities = Array.from(
      new Set(
        steps
          .map((s) => s.capabilityRequired)
          .filter((cap): cap is JarvisCapabilityRequirement => cap !== 'none')
      )
    );

    // Build clarification structure if needed
    let clarification: JarvisClarificationRequest | undefined;
    if (initialStatus === 'WAITING_FOR_INPUT') {
      clarification = {
        needsClarification: true,
        question: intent.suggestedResponse || 'Could you provide more specific details for this request?',
        missingInformation: ['details'],
        suggestedAnswers: intent.entities.subject ? [`Specific type of ${intent.entities.subject}`] : undefined,
      };
    }

    // Build execution handoff package
    const executionHandoff: JarvisExecutionHandoff = {
      taskId,
      intent: intent.intentType,
      entities: intent.entities,
      planSummary: this.buildPlanSummary(intent, steps),
      requiredCapabilities,
      confirmationState: intent.requiresConfirmation ? 'PENDING' : 'NOT_REQUIRED',
      targetPhase: this.determineTargetPhase(intent),
      handoffTimestamp: now,
    };

    const plan: JarvisTaskPlan = {
      taskId,
      originalRequest: intent.userRequest,
      intent,
      status: initialStatus,
      priority,
      createdAt: now,
      updatedAt: now,
      steps,
      clarification,
      executionHandoff,
      planSummary: executionHandoff.planSummary,
    };

    this.activePlan = plan;
    this.taskHistory.unshift(plan);
    if (this.taskHistory.length > 20) {
      this.taskHistory.pop();
    }

    // Record in short-lived context
    JarvisContextService.setContext(
      taskId,
      intent.intentType,
      intent.entities,
      intent.userRequest,
      plan
    );

    // Emit lifecycle events
    this.emitEvent('TASK_CREATED', taskId, 'Task created in planner.', plan);
    if (initialStatus === 'WAITING_FOR_INPUT') {
      this.emitEvent('TASK_WAITING_FOR_INPUT', taskId, clarification?.question || 'Waiting for user input.', plan);
    } else if (initialStatus === 'READY') {
      this.emitEvent('TASK_PLANNED', taskId, `Task planned with ${steps.length} step(s).`, plan);
      this.emitEvent('TASK_READY', taskId, 'Execution handoff prepared.', plan);
    } else if (initialStatus === 'FAILED') {
      this.emitEvent('TASK_FAILED', taskId, 'Task cannot be completed (unsupported).', plan);
    }

    return plan;
  }

  /**
   * Resolves an ambiguous task waiting for clarification
   */
  static provideClarification(taskId: string, answer: string): JarvisTaskPlan | null {
    if (!this.activePlan || this.activePlan.taskId !== taskId) {
      return null;
    }

    const plan = this.activePlan;
    plan.status = 'READY';
    plan.updatedAt = Date.now();
    plan.userFeedback = answer;
    if (plan.clarification) {
      plan.clarification.needsClarification = false;
    }

    // Update steps based on clarified answer
    plan.steps.forEach((s) => {
      if (s.type === 'clarify') {
        s.status = 'COMPLETED';
        s.result = `User clarified: "${answer}"`;
      }
    });

    plan.planSummary = `Clarified: ${plan.originalRequest} (${answer})`;
    if (plan.executionHandoff) {
      plan.executionHandoff.planSummary = plan.planSummary;
      plan.executionHandoff.confirmationState = 'NOT_REQUIRED';
    }

    this.emitEvent('TASK_READY', taskId, 'Clarification received, task ready.', plan);
    return plan;
  }

  /**
   * Generates sequential steps with explicit dependency graphs
   */
  private static generateOrderedSteps(taskId: string, intent: JarvisIntent): JarvisTaskStep[] {
    const steps: JarvisTaskStep[] = [];
    const entities = intent.entities;

    // CASE 1: Clarification required
    if (intent.complexity === 'AMBIGUOUS' || intent.intentType === 'clarification_required') {
      steps.push({
        id: `${taskId}_step_1`,
        order: 1,
        title: 'Request Clarification',
        description: intent.suggestedResponse || 'Ask user for missing requirements before planning.',
        type: 'clarify',
        status: 'RUNNING',
        dependencies: [],
        capabilityRequired: 'none',
      });
      return steps;
    }

    // CASE 2: Unsupported request
    if (intent.complexity === 'UNSUPPORTED' || intent.intentType === 'unsupported_request') {
      steps.push({
        id: `${taskId}_step_1`,
        order: 1,
        title: 'Report Unsupported Capability',
        description: 'Notify user that requested physical/security action is beyond ONEVA boundary.',
        type: 'conversation',
        status: 'FAILED',
        dependencies: [],
        capabilityRequired: 'none',
        result: 'Out of scope',
      });
      return steps;
    }

    // CASE 3: Research / Asset finding (e.g. "Find a free 3D tree model for my game")
    if (intent.intentType === 'research_request') {
      const subject = entities.subject || 'asset';
      const assetType = entities.assetType || 'item';
      const constraints = entities.constraints?.join(', ') || 'none';

      // Step 1: Understand required asset
      steps.push({
        id: `${taskId}_step_1`,
        order: 1,
        title: 'Analyze Asset Requirements',
        description: `Extract specifications for ${subject} ${assetType} with constraints [${constraints}].`,
        type: 'synthesize',
        status: 'COMPLETED',
        dependencies: [],
        capabilityRequired: 'none',
        result: `Identified target: ${subject} (${assetType})`,
      });

      // Step 2: Determine search strategy
      steps.push({
        id: `${taskId}_step_2`,
        order: 2,
        title: 'Formulate Search Strategy',
        description: `Target verified 3D repositories (Sketchfab, Poly Haven, CGTrader) with license filter "${constraints}".`,
        type: 'search',
        status: 'PENDING',
        dependencies: [`${taskId}_step_1`],
        capabilityRequired: 'web_search',
      });

      // Step 3: Search sources
      steps.push({
        id: `${taskId}_step_3`,
        order: 3,
        title: 'Search Multi-Source Repositories',
        description: `Execute query for "${subject} ${assetType}" across candidate indexes.`,
        type: 'search',
        status: 'PENDING',
        dependencies: [`${taskId}_step_2`],
        capabilityRequired: 'web_search',
      });

      // Step 4: Evaluate candidates
      steps.push({
        id: `${taskId}_step_4`,
        order: 4,
        title: 'Evaluate Candidate Assets',
        description: `Verify format compatibility, polygon count, and free licensing terms.`,
        type: 'evaluate',
        status: 'PENDING',
        dependencies: [`${taskId}_step_3`],
        capabilityRequired: 'source_analysis',
      });

      // Step 5: Select suitable result
      steps.push({
        id: `${taskId}_step_5`,
        order: 5,
        title: 'Select Optimal Asset',
        description: `Choose highest quality matching asset complying with "${constraints}".`,
        type: 'synthesize',
        status: 'PENDING',
        dependencies: [`${taskId}_step_4`],
        capabilityRequired: 'none',
      });

      // Step 6: Save / Download if supported
      steps.push({
        id: `${taskId}_step_6`,
        order: 6,
        title: 'Stage File Asset',
        description: `Prepare asset metadata and destination link for local saving.`,
        type: 'file_op',
        status: 'PENDING',
        dependencies: [`${taskId}_step_5`],
        capabilityRequired: 'file_save',
      });

      // Step 7: Report result
      steps.push({
        id: `${taskId}_step_7`,
        order: 7,
        title: 'Present Research Summary',
        description: `Deliver asset details, preview link, and licensing confirmation to user.`,
        type: 'conversation',
        status: 'PENDING',
        dependencies: [`${taskId}_step_6`],
        capabilityRequired: 'none',
      });

      return steps;
    }

    // CASE 4: Multi-step App workflow (e.g. "Open YouTube and search for cricket highlights and play first result")
    if (intent.complexity === 'MULTI_STEP') {
      const app = entities.application || 'YouTube';
      const query = entities.query || 'cricket highlights';

      steps.push({
        id: `${taskId}_step_1`,
        order: 1,
        title: `Launch ${app}`,
        description: `Activate package intent for ${app} via Android launcher bridge.`,
        type: 'app_action',
        status: 'PENDING',
        dependencies: [],
        capabilityRequired: 'app_launch',
      });

      steps.push({
        id: `${taskId}_step_2`,
        order: 2,
        title: `Execute Search for "${query}"`,
        description: `Pass query parameter "${query}" into ${app} search handler.`,
        type: 'app_action',
        status: 'PENDING',
        dependencies: [`${taskId}_step_1`],
        capabilityRequired: 'app_interaction',
      });

      if (entities.itemIndex || intent.userRequest.toLowerCase().includes('play')) {
        steps.push({
          id: `${taskId}_step_3`,
          order: 3,
          title: 'Initiate Playback',
          description: `Trigger playback on first relevant search candidate.`,
          type: 'app_action',
          status: 'PENDING',
          dependencies: [`${taskId}_step_2`],
          capabilityRequired: 'app_interaction',
        });
      }

      return steps;
    }

    // CASE 5: Simple App Request (e.g. "Open YouTube", "Jarvis YouTube kholo")
    if (intent.intentType === 'app_request') {
      const app = entities.application || 'App';
      steps.push({
        id: `${taskId}_step_1`,
        order: 1,
        title: `Launch ${app}`,
        description: `Trigger system package intent for ${app}.`,
        type: 'app_action',
        status: 'PENDING',
        dependencies: [],
        capabilityRequired: 'app_launch',
      });
      return steps;
    }

    // CASE 6: Device Controls
    if (intent.intentType === 'device_request') {
      const setting = entities.settingName || 'setting';
      const stateStr = entities.settingValue === true ? 'ON' : entities.settingValue === false ? 'OFF' : 'toggle';
      steps.push({
        id: `${taskId}_step_1`,
        order: 1,
        title: `Set ${setting} to ${stateStr}`,
        description: `Dispatch native system setting change for ${setting}.`,
        type: 'device_op',
        status: 'PENDING',
        dependencies: [],
        capabilityRequired: 'device_control',
        requiresConfirmation: intent.requiresConfirmation,
      });
      return steps;
    }

    // CASE 7: Information / Search Query
    if (intent.intentType === 'search_request' || intent.intentType === 'information_request') {
      const query = entities.query || intent.userRequest;
      steps.push({
        id: `${taskId}_step_1`,
        order: 1,
        title: `Retrieve Information for "${query}"`,
        description: `Execute focused query against web/knowledge index (Phase 12).`,
        type: 'search',
        status: 'PENDING',
        dependencies: [],
        capabilityRequired: 'web_search',
      });
      return steps;
    }

    // Fallback single conversational step
    steps.push({
      id: `${taskId}_step_1`,
      order: 1,
      title: 'Conversational Response',
      description: 'Acknowledge user prompt in natural language.',
      type: 'conversation',
      status: 'PENDING',
      dependencies: [],
      capabilityRequired: 'none',
    });

    return steps;
  }

  private static calculatePriority(intent: JarvisIntent): JarvisTaskPriority {
    if (intent.intentType === 'device_request' || intent.intentType === 'app_request') {
      return 'HIGH';
    }
    if (intent.intentType === 'research_request') {
      return 'NORMAL';
    }
    return 'NORMAL';
  }

  private static determineTargetPhase(intent: JarvisIntent): JarvisExecutionHandoff['targetPhase'] {
    switch (intent.intentType) {
      case 'app_request':
      case 'device_request':
        return 'PHASE_13_ANDROID_ACTIONS';
      case 'search_request':
      case 'research_request':
      case 'information_request':
        return 'PHASE_12_SEARCH';
      case 'creation_request':
      case 'modification_request':
        return 'PHASE_16_CREATION';
      case 'unsupported_request':
        return 'UNSUPPORTED';
      case 'conversation':
      default:
        return 'CONVERSATION';
    }
  }

  private static buildPlanSummary(intent: JarvisIntent, steps: JarvisTaskStep[]): string {
    if (intent.complexity === 'SIMPLE') {
      if (intent.intentType === 'app_request') {
        return `Launch ${intent.entities.application || 'application'}`;
      }
      return steps[0]?.title || intent.userRequest;
    }

    if (intent.complexity === 'MULTI_STEP') {
      return `Multi-step workflow (${steps.length} steps): ${steps.map((s) => s.title).join(' → ')}`;
    }

    if (intent.complexity === 'RESEARCH_COMPLEX') {
      return `Research pipeline (${steps.length} steps): Discover, evaluate, and stage ${intent.entities.subject || ''} ${intent.entities.assetType || 'asset'}`;
    }

    if (intent.complexity === 'AMBIGUOUS') {
      return `Waiting for input: ${intent.suggestedResponse || 'Clarification required'}`;
    }

    return intent.reasoningSummary;
  }

  static getActivePlan(): JarvisTaskPlan | null {
    return this.activePlan;
  }

  static getTaskHistory(): JarvisTaskPlan[] {
    return [...this.taskHistory];
  }

  static clearActivePlan(): void {
    this.activePlan = null;
    this.emitEvent('TASK_CANCELLED', 'active', 'Active plan cleared.');
  }

  /**
   * Updates plan and step execution status with verified results (Phase 13)
   */
  static updatePlanStatus(
    taskId: string,
    status: JarvisTaskStatus,
    stepId?: string,
    stepResult?: string,
    message?: string
  ): void {
    const plan = this.activePlan?.taskId === taskId ? this.activePlan : this.taskHistory.find((p) => p.taskId === taskId);
    if (!plan) return;

    plan.status = status;
    plan.updatedAt = Date.now();

    if (stepId) {
      const step = plan.steps.find((s) => s.id === stepId);
      if (step) {
        step.status = status === 'COMPLETED' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : 'RUNNING';
        if (stepResult) {
          step.result = stepResult;
        }
      }
    } else if (plan.steps.length > 0) {
      const firstStep = plan.steps[0];
      firstStep.status = status === 'COMPLETED' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : 'RUNNING';
      if (stepResult) {
        firstStep.result = stepResult;
      }
    }

    const eventType: JarvisTaskEventType =
      status === 'COMPLETED' ? 'TASK_COMPLETED' : status === 'FAILED' ? 'TASK_FAILED' : 'TASK_STARTED';
    this.emitEvent(eventType, taskId, message || `Task ${status.toLowerCase()}.`, plan);
  }

  // Event dispatching
  private static emitEvent(
    eventType: JarvisTaskEventType,
    taskId: string,
    message: string,
    plan?: JarvisTaskPlan
  ): void {
    const event: JarvisTaskEvent = {
      eventType,
      taskId,
      timestamp: Date.now(),
      message,
      plan,
    };
    this.eventListeners.forEach((listener) => listener(event));
  }

  static onTaskEvent(listener: (event: JarvisTaskEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }
}
