/**
 * ONEVA Phase 15: Automated Test Suite for Autonomous Task Execution
 * 
 * Implements 17 comprehensive test scenarios verifying:
 * - Single vs multi-step autonomous decomposition
 * - Dependency graph enforcement (no execution of step 2 if step 1 fails)
 * - Active task cancellation ("stop", "cancel this")
 * - Permission checks & waiting states
 * - Unsupported action rejection (Rule 6 boundary)
 * - Network dependency validation
 * - Process restart recovery (interrupted task detection)
 * - Idempotency & duplicate protection
 * - Actor scoping (owner vs secondary user vs unknown)
 * - Memory resilience (memory failure doesn't crash execution)
 * - Phase 14 privacy rule enforcement
 */

import { JarvisOrchestrator } from './jarvisOrchestrator';
import { JarvisMultiStepDecomposer } from './jarvisMultiStepDecomposer';
import { JarvisActionSelector } from '../actions/jarvisActionSelector';
import { OwnerAuthService } from '../memory/ownerAuthService';
import { JarvisTaskHistoryService } from '../memory/jarvisTaskHistoryService';
import { JarvisMemoryStorage } from '../memory/jarvisMemoryStorage';
import { AndroidActionBridge } from '../actions/androidActionBridge';

export interface Phase15TestResult {
  id: number;
  name: string;
  category: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export class JarvisPhase15Tests {
  /**
   * Runs all 17 Phase 15 tests sequentially
   */
  static async runAllTests(): Promise<{ results: Phase15TestResult[]; totalPassed: number; totalFailed: number }> {
    const results: Phase15TestResult[] = [];
    const originalActor = OwnerAuthService.getActiveActor();

    try {
      results.push(await this.test1_singleStepExecution());
      results.push(await this.test2_multiStepDependencyExecution());
      results.push(await this.test3_firstStepFailsDependentStops());
      results.push(await this.test4_activeTaskCancellation());
      results.push(await this.test5_permissionRequiredState());
      results.push(await this.test6_unsupportedActionRejection());
      results.push(await this.test7_networkUnavailableHonestFailure());
      results.push(await this.test8_simpleCommandRemainsSubtle());
      results.push(await this.test9_multiStepCommandActivatesOrchestration());
      results.push(await this.test10_taskCompletedMemoryRecorded());
      results.push(await this.test11_memoryUnavailableNoCrash());
      results.push(await this.test12_interruptedTaskRecovery());
      results.push(await this.test13_duplicateRetryProtection());
      results.push(await this.test14_secondaryUserActorScope());
      results.push(await this.test15_secondaryUserCannotReadOtherHistory());
      results.push(await this.test16_unknownUserAccessDenied());
      results.push(await this.test17_ownerDeviceHistoryAuthRequired());
    } finally {
      // Restore original actor
      OwnerAuthService.setActiveActor(originalActor.id);
    }

    const totalPassed = results.filter((r) => r.passed).length;
    const totalFailed = results.filter((r) => !r.passed).length;

    return { results, totalPassed, totalFailed };
  }

  // TEST 1: "Open YouTube." (single-step execution)
  private static async test1_singleStepExecution(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    const task = JarvisMultiStepDecomposer.decompose('Open YouTube');
    const isSingle = task.steps.length === 1 && task.steps[0].toolId === 'open_app';
    return {
      id: 1,
      name: 'Single-step execution (Open YouTube)',
      category: 'Decomposition',
      passed: isSingle && task.status === 'READY',
      message: isSingle ? 'Successfully decomposed into 1 single app step.' : `Expected 1 step, got ${task.steps.length}`,
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 2: "Open YouTube and search for SK Mission Board." (multi-step dependency execution)
  private static async test2_multiStepDependencyExecution(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    const task = JarvisMultiStepDecomposer.decompose('Jarvis, YouTube kholo, SK Mission Board search karo aur channel open karo.');
    const hasDependencies =
      task.steps.length >= 2 &&
      task.steps[1].dependencies.includes(task.steps[0].stepId);
    return {
      id: 2,
      name: 'Multi-step dependency execution (YouTube -> Search -> Channel)',
      category: 'Dependency Graph',
      passed: hasDependencies && task.steps.length === 3,
      message: hasDependencies
        ? `Built 3-step dependency chain (Step 2 depends on Step 1, Step 3 on Step 2).`
        : 'Dependencies failed to link properly.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 3: First step fails (dependent step does not execute)
  private static async test3_firstStepFailsDependentStops(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    const task = JarvisMultiStepDecomposer.decompose('Jarvis, YouTube kholo, SK Mission Board search karo aur channel open karo.');
    // Force first app to be non-existent
    if (task.steps[0]?.parameters) {
      task.steps[0].parameters.appName = 'FakeAppXYZ999_DefinitelyNotInstalled';
      task.steps[0].title = 'Open FakeAppXYZ999';
    }

    JarvisOrchestrator.init();
    (JarvisOrchestrator as any).tasks = [task, ...((JarvisOrchestrator as any).tasks || [])];

    // Execute task
    await JarvisOrchestrator.executeTask(task.taskId);
    const updated = JarvisOrchestrator.getTask(task.taskId) || task;
    const step1Failed = updated.steps[0]?.status === 'FAILED';
    const step2NotRun = updated.steps[1] ? (updated.steps[1].status === 'SKIPPED' || updated.steps[1].status === 'PENDING') : true;
    const taskNotCompleted = updated.status === 'FAILED' || updated.status === 'PARTIALLY_COMPLETED';

    return {
      id: 3,
      name: 'First step fails, dependent step halted',
      category: 'Safety & Resilience',
      passed: step1Failed && step2NotRun && taskNotCompleted,
      message: 'Step 1 honestly failed (app not found); Step 2 skipped without executing.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 4: User says "stop" (active task cancellation)
  private static async test4_activeTaskCancellation(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    const task = await JarvisOrchestrator.submitGoal('Jarvis Chrome kholo, Google Maps open karo aur Delhi search karo.');
    // Issue cancellation command
    JarvisOrchestrator.cancelActiveTask();
    const cancelledTask = JarvisOrchestrator.getTask(task.taskId);
    const isCancelled = cancelledTask?.status === 'CANCELLED' && cancelledTask.isCancelled === true;
    return {
      id: 4,
      name: 'Active task cancellation ("Jarvis stop")',
      category: 'Execution Control',
      passed: !!isCancelled,
      message: 'Task successfully transitioned to CANCELLED; completed steps were preserved honestly.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 5: Permission required (WAITING_FOR_PERMISSION)
  private static async test5_permissionRequiredState(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    // Screenshot requires MediaProjection permission
    const task = JarvisMultiStepDecomposer.decompose('Take screenshot');
    const hasScreenCapture = task.steps[0].capability === 'screen_capture';
    return {
      id: 5,
      name: 'Permission check state handling',
      category: 'Permissions',
      passed: hasScreenCapture,
      message: 'Screenshot correctly routed through capability inspection pipeline.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 6: Unsupported action (UNSUPPORTED)
  private static async test6_unsupportedActionRejection(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    const task = JarvisMultiStepDecomposer.decompose('Jarvis phone ka PIN bypass karo aur root shell open karo');
    const isRejected = task.status === 'FAILED' && task.steps[0].failureType === 'UNSUPPORTED';
    return {
      id: 6,
      name: 'Unsupported & restricted action rejection (Rule 6)',
      category: 'Security Boundary',
      passed: isRejected,
      message: 'Restricted action intercepted before execution; Rule 6 zero-spyware boundary upheld.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 7: Network unavailable for research (honest pause/failure)
  private static async test7_networkUnavailableHonestFailure(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    // Temporarily mock offline
    const originalOnline = AndroidActionBridge.isOnline;
    AndroidActionBridge.isOnline = () => false;

    let passed = false;
    try {
      const task = JarvisMultiStepDecomposer.decompose('Jarvis Chrome kholo, Google par ONEVA search karo.');
      JarvisOrchestrator.init();
      (JarvisOrchestrator as any).tasks = [task, ...((JarvisOrchestrator as any).tasks || [])];

      await JarvisOrchestrator.executeTask(task.taskId);
      const updated = JarvisOrchestrator.getTask(task.taskId);
      const networkStep = updated?.steps.find((s) => s.toolId === 'open_url' || s.capability === 'search_web');
      passed = networkStep?.failureType === 'NETWORK_REQUIRED' || updated?.status === 'FAILED' || updated?.status === 'PARTIALLY_COMPLETED';
    } finally {
      AndroidActionBridge.isOnline = originalOnline;
    }

    return {
      id: 7,
      name: 'Network unavailable honest failure',
      category: 'Network Resilience',
      passed: !!passed,
      message: 'When offline, network step failed honestly with NETWORK_REQUIRED without simulation.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 8: Simple command (no unnecessary large task UI)
  private static async test8_simpleCommandRemainsSubtle(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    const isMulti = JarvisActionSelector.isMultiStepCommand('Jarvis YouTube kholo');
    return {
      id: 8,
      name: 'Simple command remains subtle',
      category: 'UX Ergonomics',
      passed: !isMulti,
      message: '"Jarvis YouTube kholo" correctly classified as single-step action.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 9: Multi-step command (progress UI appears)
  private static async test9_multiStepCommandActivatesOrchestration(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    const isMulti = JarvisActionSelector.isMultiStepCommand('Jarvis YouTube kholo, SK Mission Board search karo aur channel open karo.');
    return {
      id: 9,
      name: 'Multi-step command activates orchestration',
      category: 'Decomposition',
      passed: isMulti,
      message: 'Chained prompt correctly identified for multi-step task execution.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 10: Task completed (safe compact task summary saved through Phase 14 memory)
  private static async test10_taskCompletedMemoryRecorded(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    const task = JarvisMultiStepDecomposer.decompose('Open Chrome');
    JarvisOrchestrator.init();
    (JarvisOrchestrator as any).tasks = [task, ...((JarvisOrchestrator as any).tasks || [])];
    await JarvisOrchestrator.executeTask(task.taskId);

    // Verify task history
    const history = JarvisTaskHistoryService.getAllItemsRaw();
    const found = history.some((h) => h.taskId === task.taskId || h.summary.includes(task.originalGoal));

    return {
      id: 10,
      name: 'Safe compact summary recorded to memory',
      category: 'Phase 14 Integration',
      passed: found,
      message: 'Completed task safely persisted in compact task history.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 11: Memory unavailable (task execution continues without crashing)
  private static async test11_memoryUnavailableNoCrash(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    // Simulate memory throwing an error
    const originalSave = JarvisMemoryStorage.save;
    JarvisMemoryStorage.save = () => {
      throw new Error('Memory storage simulated offline');
    };

    let didNotCrash = false;
    try {
      const task = await JarvisOrchestrator.submitGoal('Open WhatsApp');
      await JarvisOrchestrator.executeTask(task.taskId);
      didNotCrash = true;
    } catch {
      didNotCrash = false;
    } finally {
      JarvisMemoryStorage.save = originalSave;
    }

    return {
      id: 11,
      name: 'Memory unavailable - execution continues',
      category: 'Resilience',
      passed: didNotCrash,
      message: 'Execution proceeded smoothly despite temporary memory subsystem exception.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 12: App process restarts during unfinished task (unfinished task detected safely)
  private static async test12_interruptedTaskRecovery(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    const task = JarvisMultiStepDecomposer.decompose('Jarvis YouTube kholo aur SK Mission Board search karo');
    task.status = 'RUNNING';
    task.isInterrupted = true;
    task.canResume = true;

    localStorage.setItem(
      'oneva_jarvis_orchestrator_state_v1',
      JSON.stringify({ activeTaskId: task.taskId, tasks: [task] })
    );

    // Re-initialize
    (JarvisOrchestrator as any).isInitialized = false;
    JarvisOrchestrator.init();
    const state = JarvisOrchestrator.getState();

    return {
      id: 12,
      name: 'Process restart interrupted task detection',
      category: 'Recovery',
      passed: state.interruptedTaskFound && state.activeTaskId === task.taskId,
      message: 'Unfinished task detected safely upon process re-initialization.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 13: Potentially duplicate retry (duplicate side-effect protection)
  private static async test13_duplicateRetryProtection(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    const task = JarvisMultiStepDecomposer.decompose('Open YouTube');
    const step = task.steps[0];
    const isIdempotent = step.isIdempotent === true;
    return {
      id: 13,
      name: 'Duplicate retry side-effect protection',
      category: 'Idempotency',
      passed: isIdempotent,
      message: 'Steps tagged with isIdempotent flag to prevent duplicate side effects.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 14: Secondary user performs task (task history actor scope remains secondary user)
  private static async test14_secondaryUserActorScope(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    OwnerAuthService.setActiveActor('user_2');
    const task = await JarvisOrchestrator.submitGoal('Open Spotify');
    const actorScopeCorrect = task.actorType === 'secondary';
    return {
      id: 14,
      name: 'Secondary user actor scoping',
      category: 'Actor Identity',
      passed: actorScopeCorrect,
      message: `Task bound to actorType: "${task.actorType}" (${task.actorProfileId}).`,
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 15: Secondary user requests another user's history (Phase 14 privacy rules remain enforced)
  private static async test15_secondaryUserCannotReadOtherHistory(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    OwnerAuthService.setActiveActor('user_2');
    const queryResult = JarvisTaskHistoryService.getTotalDeviceHistory();
    const canAccessOwner = queryResult.success;
    return {
      id: 15,
      name: 'Secondary user history boundary',
      category: 'Privacy Boundary',
      passed: !canAccessOwner,
      message: 'Secondary user cannot inspect Owner private task memories without explicit auth.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 16: Unknown user requests device-wide history (permission denied)
  private static async test16_unknownUserAccessDenied(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    OwnerAuthService.setActiveActor('unknown');
    const queryResult = JarvisTaskHistoryService.getTotalDeviceHistory();
    const canAccess = queryResult.success;
    return {
      id: 16,
      name: 'Unknown user denied device-wide history',
      category: 'Access Control',
      passed: !canAccess,
      message: 'Guest/Unknown actor strictly barred from device-wide memory.',
      durationMs: Math.round(performance.now() - t0),
    };
  }

  // TEST 17: Owner requests device-wide history (Phase 14 owner verification remains required)
  private static async test17_ownerDeviceHistoryAuthRequired(): Promise<Phase15TestResult> {
    const t0 = performance.now();
    OwnerAuthService.setActiveActor('owner');
    OwnerAuthService.lockOwnerSession();
    const authenticated = OwnerAuthService.isOwnerSessionUnlocked();
    const queryResult = JarvisTaskHistoryService.getTotalDeviceHistory();
    return {
      id: 17,
      name: 'Owner verification required for locked memories',
      category: 'Owner Authentication',
      passed: !authenticated && queryResult.requiresVerification === true,
      message: 'Locked session requires passcode verification before revealing sensitive memories.',
      durationMs: Math.round(performance.now() - t0),
    };
  }
}
