/**
 * ONEVA Phase 15: Central Autonomous Task Execution Orchestrator
 * 
 * Manages autonomous multi-step task execution lifecycle, dependency graphs,
 * verified action dispatch via Phase 13 ActionDispatcher, failure recovery,
 * task cancellation, pause/resume, interrupted task detection, and Phase 14
 * privacy-first memory integration.
 */

import {
  JarvisOrchestratedTask,
  JarvisOrchestratedStep,
  JarvisOrchestratedTaskStatus,
  JarvisOrchestratorEvent,
  JarvisOrchestratorState,
  JarvisStepVerificationStatus,
  JarvisFailureClassification,
} from '../../types/jarvisOrchestration';
import { JarvisMultiStepDecomposer } from './jarvisMultiStepDecomposer';
import { ActionDispatcher } from '../actions/actionDispatcher';
import { JarvisToolRegistry } from '../actions/jarvisToolRegistry';
import { AndroidActionBridge } from '../actions/androidActionBridge';
import { AppResolutionService } from '../actions/appResolutionService';
import { JarvisTaskHistoryService } from '../memory/jarvisTaskHistoryService';
import { JarvisMemoryStorage } from '../memory/jarvisMemoryStorage';
import { OwnerAuthService } from '../memory/ownerAuthService';
import { JarvisActionResult } from '../../types/jarvisActions';

const STORAGE_KEY_ORCHESTRATOR = 'oneva_jarvis_orchestrator_state_v1';
const MAX_TASK_HISTORY = 20;

export class JarvisOrchestrator {
  private static tasks: JarvisOrchestratedTask[] = [];
  private static activeTaskId: string | null = null;
  private static isProcessing = false;
  private static interruptedTaskFound = false;
  private static listeners: Set<(state: JarvisOrchestratorState) => void> = new Set();
  private static eventListeners: Set<(event: JarvisOrchestratorEvent) => void> = new Set();
  private static isInitialized = false;

  /**
   * Initializes the orchestrator and checks for interrupted tasks from prior sessions
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_ORCHESTRATOR);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.tasks)) {
            this.tasks = parsed.tasks;
            // Check for interrupted unfinished tasks
            const unfinished = this.tasks.find(
              (t) => t.status === 'RUNNING' || t.status === 'VERIFYING' || t.status === 'PLANNING'
            );
            if (unfinished) {
              unfinished.status = 'PAUSED';
              unfinished.isInterrupted = true;
              unfinished.canResume = true;
              this.activeTaskId = unfinished.taskId;
              this.interruptedTaskFound = true;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[JarvisOrchestrator] Initialization notice:', err);
    }
  }

  // =========================================================================
  // Task Submission & Planning
  // =========================================================================

  /**
   * Main entry point: submits a natural-language goal for autonomous execution
   */
  static async submitGoal(rawGoal: string): Promise<JarvisOrchestratedTask> {
    this.init();

    // Check if there is an existing active running task
    if (this.isProcessing && this.activeTaskId) {
      const active = this.getTask(this.activeTaskId);
      if (active && (active.status === 'RUNNING' || active.status === 'VERIFYING')) {
        // Check if user request is a cancellation command
        if (this.isCancellationCommand(rawGoal)) {
          this.cancelActiveTask();
          return active;
        }
      }
    }

    // Decompose natural language goal into orchestrated task plan
    const task = JarvisMultiStepDecomposer.decompose(rawGoal);
    this.tasks.unshift(task);
    if (this.tasks.length > MAX_TASK_HISTORY) {
      this.tasks.pop();
    }
    this.activeTaskId = task.taskId;
    this.persist();

    this.emitEvent('TASK_QUEUED', task.taskId, `Goal queued: "${task.originalGoal}"`, task);

    // If decomposition immediately failed (e.g. security boundary violation)
    if (task.status === 'FAILED') {
      this.emitEvent('TASK_FAILED', task.taskId, task.failureReason || 'Task cannot be executed.', task);
      this.notifyState();
      return task;
    }

    this.emitEvent('TASK_PLAN_READY', task.taskId, `Plan ready with ${task.steps.length} step(s).`, task);
    this.notifyState();

    // Automatically trigger autonomous execution
    this.executeTask(task.taskId);

    return task;
  }

  /**
   * Helper: Identifies cancellation intent
   */
  static isCancellationCommand(prompt: string): boolean {
    const lower = prompt.trim().toLowerCase();
    return /\b(?:stop|cancel|abort|ruk ja|roko|ruk jao|band karo|cancel this|stop the task)\b/i.test(lower);
  }

  // =========================================================================
  // Autonomous Step Execution Pipeline
  // =========================================================================

  /**
   * Executes all steps of an orchestrated task in dependency order
   */
  static async executeTask(taskId: string): Promise<void> {
    const task = this.getTask(taskId);
    if (!task) return;

    if (task.status === 'CANCELLED' || task.status === 'COMPLETED') {
      return;
    }

    this.isProcessing = true;
    task.status = 'RUNNING';
    task.isPaused = false;
    task.isCancelled = false;
    task.updatedAt = Date.now();
    this.persist();

    this.emitEvent('TASK_STARTED', taskId, `Starting execution of ${task.title}...`, task);
    this.notifyState();

    while (task.status === 'RUNNING') {
      // Find the next step ready to run (dependencies completed and step pending/ready)
      const nextStep = this.findNextExecutableStep(task);

      if (!nextStep) {
        // No more runnable steps. Check overall completion state.
        const hasFailed = task.steps.some((s) => s.status === 'FAILED');
        const allCompleted = task.steps.every((s) => s.status === 'COMPLETED');
        const anyCompleted = task.steps.some((s) => s.status === 'COMPLETED');

        if (allCompleted) {
          task.status = 'COMPLETED';
          task.completedAt = Date.now();
          task.summary = this.buildTaskSummary(task);
          this.recordMemoryAndHistory(task);
          this.emitEvent('TASK_COMPLETED', taskId, `Task completed: ${task.summary}`, task);
        } else if (hasFailed) {
          task.status = anyCompleted ? 'PARTIALLY_COMPLETED' : 'FAILED';
          task.completedAt = Date.now();
          task.summary = this.buildTaskSummary(task);
          this.recordMemoryAndHistory(task);
          this.emitEvent(
            task.status === 'PARTIALLY_COMPLETED' ? 'TASK_PARTIALLY_COMPLETED' : 'TASK_FAILED',
            taskId,
            task.summary,
            task
          );
        } else {
          // All remaining are pending or blocked
          break;
        }

        task.updatedAt = Date.now();
        this.persist();
        this.notifyState();
        break;
      }

      // Execute the single step
      const stepOutcome = await this.executeStep(task, nextStep);

      // If step failed and was not recovered
      if (stepOutcome.status === 'FAILED') {
        // Mark all dependent successor steps as SKIPPED
        this.skipDependentSteps(task, nextStep.stepId);
        task.status = task.steps.some((s) => s.status === 'COMPLETED') ? 'PARTIALLY_COMPLETED' : 'FAILED';
        task.failureReason = nextStep.error || 'A required step failed.';
        task.completedAt = Date.now();
        task.summary = this.buildTaskSummary(task);
        this.recordMemoryAndHistory(task);

        this.persist();
        this.notifyState();
        break;
      }

      // If step requested permission and is waiting
      if (stepOutcome.status === 'WAITING_FOR_PERMISSION' as any) {
        task.status = 'WAITING_FOR_PERMISSION';
        task.requiresPermission = nextStep.error;
        this.emitEvent('TASK_WAITING_PERMISSION', taskId, `Waiting for ${nextStep.error} permission...`, task);
        this.persist();
        this.notifyState();
        break;
      }

      // If task was paused or cancelled during step execution
      if ((task.status as string) === 'PAUSED' || (task.status as string) === 'CANCELLED') {
        break;
      }

      task.updatedAt = Date.now();
      this.persist();
      this.notifyState();

      // Brief sequential yield for smooth UI animation
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    this.isProcessing = false;
    this.persist();
    this.notifyState();
  }

  /**
   * Executes a single step through capability checks, tool registry, and action dispatcher
   */
  private static async executeStep(
    task: JarvisOrchestratedTask,
    step: JarvisOrchestratedStep
  ): Promise<JarvisOrchestratedStep> {
    step.status = 'RUNNING';
    step.startedAt = Date.now();
    this.emitEvent('STEP_STARTED', task.taskId, `Executing step: ${step.title}`, task, step.stepId);
    this.notifyState();

    // 1. CAPABILITY & TOOL REGISTRATION CHECK
    JarvisToolRegistry.init();
    if (!JarvisToolRegistry.isToolRegistered(step.toolId)) {
      step.status = 'FAILED';
      step.verificationStatus = 'FAILED';
      step.failureType = 'UNSUPPORTED';
      step.error = `Tool "${step.toolId}" is not registered in ONEVA Tool Registry.`;
      step.result = 'Sir, that capability is not supported on this device.';
      this.emitEvent('STEP_FAILED', task.taskId, step.error, task, step.stepId);
      return step;
    }

    // 2. APP EXISTENCE & RESOLUTION CHECK (for open_app)
    if (step.toolId === 'open_app' && step.parameters?.appName) {
      const resolution = AppResolutionService.resolveApp(step.parameters.appName);

      if (!resolution.found) {
        step.status = 'FAILED';
        step.verificationStatus = 'FAILED';
        step.failureType = 'UNSUPPORTED';
        step.error = `App "${step.parameters.appName}" not found.`;
        step.result = `Sir, I couldn't find an application named "${step.parameters.appName}".`;
        this.emitEvent('STEP_FAILED', task.taskId, step.error, task, step.stepId);
        return step;
      }

      if (!resolution.isInstalled) {
        step.status = 'FAILED';
        step.verificationStatus = 'FAILED';
        step.failureType = 'NON_RETRYABLE';
        step.error = `App "${resolution.appName}" is not installed on this device.`;
        step.result = `Sir, ${resolution.appName} is not installed on this device.`;
        this.emitEvent('STEP_FAILED', task.taskId, step.error, task, step.stepId);
        return step;
      }
    }

    // 3. NETWORK DEPENDENCY CHECK
    if (step.toolId === 'open_url' || step.capability === 'search_web') {
      if (!AndroidActionBridge.isOnline()) {
        step.status = 'FAILED';
        step.verificationStatus = 'FAILED';
        step.failureType = 'NETWORK_REQUIRED';
        step.error = 'Network connection unavailable.';
        step.result = 'Sir, an internet connection is required for this operation.';
        this.emitEvent('STEP_FAILED', task.taskId, step.error, task, step.stepId);
        return step;
      }
    }

    // 4. DISPATCH VIA ACTION DISPATCHER
    step.status = 'VERIFYING';
    this.emitEvent('STEP_VERIFYING', task.taskId, `Verifying dispatch for: ${step.title}...`, task, step.stepId);

    try {
      const actionResult = await ActionDispatcher.dispatch({
        actionId: `step_act_${step.stepId}`,
        toolId: step.toolId,
        args: step.parameters,
        originatingPrompt: step.title,
        timestamp: Date.now(),
      });

      step.actionResult = actionResult;
      step.completedAt = Date.now();

      if (actionResult.success) {
        step.status = 'COMPLETED';
        step.result = actionResult.userMessage;

        // Verify result technically
        step.verificationStatus = this.determineVerificationStatus(actionResult);

        this.emitEvent(
          'STEP_COMPLETED',
          task.taskId,
          `Completed: ${step.title} (${step.verificationStatus})`,
          task,
          step.stepId
        );
      } else {
        // Handle failure classification
        if (actionResult.status === 'PERMISSION_REQUIRED') {
          step.status = 'FAILED';
          step.verificationStatus = 'FAILED';
          step.failureType = 'PERMISSION_REQUIRED';
          step.error = actionResult.userMessage;
          step.result = actionResult.userMessage;
        } else if (actionResult.status === 'UNSUPPORTED') {
          step.status = 'FAILED';
          step.verificationStatus = 'FAILED';
          step.failureType = 'UNSUPPORTED';
          step.error = actionResult.technicalDetails || 'Capability unsupported.';
          step.result = actionResult.userMessage;
        } else if (!AndroidActionBridge.isOnline() || actionResult.technicalDetails?.toLowerCase().includes('offline') || actionResult.userMessage?.toLowerCase().includes('internet')) {
          step.status = 'FAILED';
          step.verificationStatus = 'FAILED';
          step.failureType = 'NETWORK_REQUIRED';
          step.error = actionResult.technicalDetails || actionResult.userMessage;
          step.result = actionResult.userMessage;
        } else {
          // Bounded Retry Check
          const maxRetries = step.maxRetries || 1;
          const currentRetries = step.retryCount || 0;

          if (currentRetries < maxRetries) {
            step.retryCount = currentRetries + 1;
            console.log(`[JarvisOrchestrator] Retrying step ${step.stepId} (attempt ${step.retryCount}/${maxRetries})...`);
            // Recursive 1-time retry
            return this.executeStep(task, step);
          }

          step.status = 'FAILED';
          step.verificationStatus = 'FAILED';
          step.failureType = 'NON_RETRYABLE';
          step.error = actionResult.technicalDetails || actionResult.userMessage;
          step.result = actionResult.userMessage;
        }

        this.emitEvent('STEP_FAILED', task.taskId, step.error || 'Step failed.', task, step.stepId);
      }
    } catch (err: any) {
      step.status = 'FAILED';
      step.verificationStatus = 'FAILED';
      step.failureType = 'NON_RETRYABLE';
      step.error = err?.message || 'UNEXPECTED_ERROR';
      step.result = 'Sir, an unexpected error occurred while executing this step.';
      this.emitEvent('STEP_FAILED', task.taskId, step.error || 'Step failed.', task, step.stepId);
    }

    return step;
  }

  /**
   * Determines verification status honestly without faking screen confirmation
   */
  private static determineVerificationStatus(result: JarvisActionResult): JarvisStepVerificationStatus {
    if (!result.success) return 'FAILED';

    // If native Android confirmed intent dispatch
    if (AndroidActionBridge.isNativeAndroid() && result.technicalDetails?.includes('Launched')) {
      return 'VERIFIED';
    }

    // In web preview simulator
    if (result.technicalDetails?.includes('Web Preview Engine') || result.data?.url) {
      return 'VERIFIED';
    }

    return 'UNVERIFIED';
  }

  /**
   * Finds next step where all predecessor dependencies are satisfied
   */
  private static findNextExecutableStep(task: JarvisOrchestratedTask): JarvisOrchestratedStep | null {
    for (const step of task.steps) {
      if (step.status === 'READY' || step.status === 'PENDING') {
        // Check all dependencies
        const dependenciesMet = step.dependencies.every((depId) => {
          const depStep = task.steps.find((s) => s.stepId === depId);
          return depStep && depStep.status === 'COMPLETED';
        });

        if (dependenciesMet) {
          return step;
        }
      }
    }
    return null;
  }

  /**
   * Skips all downstream steps that depend on a failed prerequisite
   */
  private static skipDependentSteps(task: JarvisOrchestratedTask, failedStepId: string): void {
    task.steps.forEach((s) => {
      if (s.dependencies.includes(failedStepId) && (s.status === 'PENDING' || s.status === 'READY')) {
        s.status = 'SKIPPED';
        s.error = 'Prerequisite step failed.';
        s.verificationStatus = 'FAILED';
        // Recursively skip successors
        this.skipDependentSteps(task, s.stepId);
      }
    });
  }

  // =========================================================================
  // Control Commands: Pause, Resume, Cancel
  // =========================================================================

  /**
   * Pauses the active running task safely
   */
  static pauseActiveTask(): void {
    if (!this.activeTaskId) return;
    const task = this.getTask(this.activeTaskId);
    if (!task || task.status !== 'RUNNING') return;

    task.status = 'PAUSED';
    task.isPaused = true;
    task.canResume = true;
    task.updatedAt = Date.now();
    this.persist();

    this.emitEvent('TASK_PAUSED', task.taskId, 'Sir, the task has been paused.', task);
    this.notifyState();
  }

  /**
   * Resumes a paused or interrupted task
   */
  static async resumeTask(taskId: string): Promise<void> {
    const task = this.getTask(taskId);
    if (!task) return;

    this.activeTaskId = task.taskId;
    task.status = 'RUNNING';
    task.isPaused = false;
    task.isInterrupted = false;
    task.updatedAt = Date.now();
    this.interruptedTaskFound = false;
    this.persist();

    this.emitEvent('TASK_RESUMED', taskId, 'Resuming task execution...', task);
    this.notifyState();

    this.executeTask(taskId);
  }

  /**
   * Cancels active task safely and preserves honest state
   */
  static cancelActiveTask(): void {
    if (!this.activeTaskId) return;
    const task = this.getTask(this.activeTaskId);
    if (!task) return;

    task.status = 'CANCELLED';
    task.isCancelled = true;
    task.completedAt = Date.now();
    task.updatedAt = Date.now();

    // Mark running / pending steps as cancelled
    task.steps.forEach((s) => {
      if (s.status === 'RUNNING' || s.status === 'READY' || s.status === 'PENDING') {
        s.status = 'CANCELLED';
        s.error = 'Task was cancelled by user.';
      }
    });

    task.summary = 'Sir, the current task has been stopped. The completed steps were not undone.';
    this.recordMemoryAndHistory(task);

    this.emitEvent('TASK_CANCELLED', task.taskId, task.summary, task);
    this.persist();
    this.notifyState();
  }

  /**
   * Dismisses an interrupted task banner
   */
  static dismissInterruptedTask(): void {
    this.interruptedTaskFound = false;
    this.notifyState();
  }

  // =========================================================================
  // Phase 14 Memory & Task History Integration
  // =========================================================================

  /**
   * Records safe, compact summary in user-scoped task history & Phase 14 memory
   */
  private static recordMemoryAndHistory(task: JarvisOrchestratedTask): void {
    try {
      const completedCount = task.steps.filter((s) => s.status === 'COMPLETED').length;
      const totalCount = task.steps.length;
      const summaryText = task.summary || `Task: "${task.originalGoal}" (${completedCount}/${totalCount} completed)`;

      // 1. Task History
      JarvisTaskHistoryService.recordTask(summaryText, 'app_action', {
        taskId: task.taskId,
        customActorId: task.actorProfileId,
      });

      // 2. Compact Phase 14 Memory
      if (JarvisMemoryStorage.getSettings().autoSaveTaskMemory) {
        const actorScope = task.actorType === 'owner' ? 'owner' : 'user_2';
        JarvisMemoryStorage.save({
          memoryId: `mem_${task.taskId}`,
          type: 'JARVIS_TASK_MEMORY',
          title: task.title,
          summary: summaryText,
          content: `Autonomous goal: "${task.originalGoal}". Completed steps: ${completedCount}/${totalCount}. Status: ${task.status}.`,
          tags: ['autonomous_task', task.status.toLowerCase()],
          createdAt: task.createdAt,
          updatedAt: Date.now(),
          source: 'task_execution',
          importance: 'medium',
          ownerScope: actorScope,
          reasonStored: 'Autonomous multi-step execution summary',
        });
      }
    } catch (err) {
      console.warn('[JarvisOrchestrator] Memory recording notice (safe continue):', err);
    }
  }

  /**
   * Helper: Builds human-friendly task summary
   */
  private static buildTaskSummary(task: JarvisOrchestratedTask): string {
    const completed = task.steps.filter((s) => s.status === 'COMPLETED').map((s) => s.title);
    const failed = task.steps.find((s) => s.status === 'FAILED');

    if (task.status === 'COMPLETED') {
      return `Sir, all steps for "${task.originalGoal}" completed successfully: ${completed.join(', ')}.`;
    }

    if (task.status === 'PARTIALLY_COMPLETED') {
      return `Sir, ${completed.length} step(s) completed (${completed.join(', ')}), but ${failed?.title || 'a step'} encountered an issue.`;
    }

    if (task.status === 'FAILED') {
      return `Sir, unable to complete "${task.originalGoal}". ${failed?.error || 'A required step failed.'}`;
    }

    if (task.status === 'CANCELLED') {
      return 'Sir, the current task has been stopped. The completed steps were not undone.';
    }

    return `Task status: ${task.status}`;
  }

  // =========================================================================
  // State, Persistence & Event Subscriptions
  // =========================================================================

  static getTask(taskId: string): JarvisOrchestratedTask | undefined {
    return this.tasks.find((t) => t.taskId === taskId);
  }

  static getActiveTask(): JarvisOrchestratedTask | null {
    if (!this.activeTaskId) return null;
    return this.getTask(this.activeTaskId) || null;
  }

  static getAllTasks(): JarvisOrchestratedTask[] {
    return [...this.tasks];
  }

  static getState(): JarvisOrchestratorState {
    return {
      activeTaskId: this.activeTaskId,
      tasks: [...this.tasks],
      isProcessing: this.isProcessing,
      interruptedTaskFound: this.interruptedTaskFound,
    };
  }

  private static persist(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY_ORCHESTRATOR,
        JSON.stringify({
          activeTaskId: this.activeTaskId,
          tasks: this.tasks.slice(0, MAX_TASK_HISTORY),
        })
      );
    } catch (e) {
      console.warn('[JarvisOrchestrator] Local persistence notice:', e);
    }
  }

  static subscribe(listener: (state: JarvisOrchestratorState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  static subscribeEvents(listener: (event: JarvisOrchestratorEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  private static notifyState(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  private static emitEvent(
    eventType: JarvisOrchestratorEvent['eventType'],
    taskId: string,
    message: string,
    task?: JarvisOrchestratedTask,
    stepId?: string
  ): void {
    const event: JarvisOrchestratorEvent = {
      eventType,
      taskId,
      stepId,
      message,
      timestamp: Date.now(),
      task,
    };
    this.eventListeners.forEach((fn) => fn(event));
  }
}
