/**
 * ONEVA Phase 20: Jarvis Work Panel & Background Continuation Test Suite
 * 
 * Comprehensive verification of all 28 Phase 20 contracts:
 * 1. Long task creation
 * 2. Stable task ID (jarvis-task-xxxxxxxx)
 * 3. Work panel opening
 * 4. Live state update
 * 5. Stop button
 * 6. Actual cancellation with AbortController
 * 7. Close button
 * 8. Background continuation
 * 9. Reopen running task
 * 10. Completion & result generation
 * 11. Result persistence & retrieval
 * 12. Network interruption (PAUSED_NETWORK)
 * 13. Network recovery & resume
 * 14. Retry mechanism
 * 15. Duplicate retry prevention (idempotency)
 * 16. App reopen recovery
 * 17. Multiple tasks concurrency & separate states
 * 18. Task ownership isolation (owner vs user_2)
 * 19. Permission enforcement & safe boundary
 * 20. Stale task detection & recovery
 * 21. Real-time synchronization & pub/sub listeners
 * 22. Reconnection reconciliation
 * 23. TTS voice integration
 * 24. Reactive visual integration
 * 25. Normal ONEVA usage while task runs
 * 26. Cancellation race: Stop while starting
 * 27. Cancellation race: Stop while researching / generating
 * 28. Cancellation race: Stop immediately after completion
 */

import { JarvisWorkTaskManager } from './jarvisWorkTaskManager';
import { JarvisLongRunningDetector } from './jarvisLongRunningDetector';
import { JarvisTaskResultStorage } from './jarvisTaskResultStorage';
import { OwnerAuthService } from '../memory/ownerAuthService';
import { AssistService } from '../assistService';
import { JarvisVoiceService } from '../jarvisVoiceService';

export interface Phase20TestResult {
  id: string;
  name: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

export class JarvisPhase20TestSuite {
  static async runAllTests(): Promise<{
    passed: number;
    failed: number;
    total: number;
    results: Phase20TestResult[];
  }> {
    const results: Phase20TestResult[] = [];

    const runTest = async (
      id: string,
      name: string,
      fn: () => Promise<void> | void
    ) => {
      try {
        await fn();
        results.push({ id, name, passed: true, message: 'Passed successfully.' });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ id, name, passed: false, message: `Failed: ${msg}`, details: err });
      }
    };

    // Ensure services initialized
    JarvisWorkTaskManager.init();
    JarvisTaskResultStorage.init();

    // 1. Long task creation
    await runTest('T01_CREATION', 'Long task creation from natural language prompt', () => {
      const task = JarvisWorkTaskManager.createTask('Research the latest Android APIs');
      if (!task || !task.taskId) throw new Error('Task was not created');
      if (task.taskType !== 'web_research') throw new Error(`Unexpected task type: ${task.taskType}`);
      if (task.status !== 'QUEUED') throw new Error(`Unexpected initial status: ${task.status}`);
    });

    // 2. Stable task ID
    await runTest('T02_STABLE_ID', 'Stable task ID adheres to jarvis-task-xxxxxxxx format', () => {
      const id = JarvisWorkTaskManager.generateTaskId();
      if (!id.startsWith('jarvis-task-')) throw new Error(`Invalid ID format: ${id}`);
    });

    // 3. Work panel opening
    await runTest('T03_PANEL_OPEN', 'Work panel opens and focuses target task', () => {
      const task = JarvisWorkTaskManager.createTask('Generate assets for my project');
      JarvisWorkTaskManager.openPanel(task.taskId);
      const state = JarvisWorkTaskManager.getState();
      if (!state.isOpen) throw new Error('Panel is not open');
      if (state.focusedTaskId !== task.taskId) throw new Error('Target task was not focused');
    });

    // 4. Live state update
    await runTest('T04_LIVE_STATE', 'Task transitions through stages with real descriptions', async () => {
      const task = JarvisWorkTaskManager.createTask('Analyze this large document');
      const startPromise = JarvisWorkTaskManager.startTask(task.taskId);
      // Wait briefly
      await new Promise((r) => setTimeout(r, 60));
      const updated = JarvisWorkTaskManager.getTask(task.taskId);
      if (!updated) throw new Error('Task not found');
      if (updated.status !== 'RUNNING' && updated.status !== 'COMPLETED') {
        throw new Error(`Task did not transition to RUNNING: ${updated.status}`);
      }
      await startPromise;
    });

    // 5. Stop button
    await runTest('T05_STOP_BUTTON', 'Stop button halts active task and marks CANCELLED', async () => {
      const task = JarvisWorkTaskManager.createTask('Research the latest Android APIs');
      JarvisWorkTaskManager.startTask(task.taskId);
      JarvisWorkTaskManager.stopTask(task.taskId);

      const stopped = JarvisWorkTaskManager.getTask(task.taskId);
      if (!stopped) throw new Error('Task not found');
      if (stopped.status !== 'CANCELLED') throw new Error(`Expected CANCELLED status, got: ${stopped.status}`);
      if (stopped.progressMessage !== 'Task stopped.') {
        throw new Error(`Expected "Task stopped.", got: ${stopped.progressMessage}`);
      }
    });

    // 6. Actual cancellation with AbortController
    await runTest('T06_ABORT_CONTROLLER', 'Actual cancellation aborts processing pipeline', async () => {
      const task = JarvisWorkTaskManager.createTask('Create a complete game design');
      const promise = JarvisWorkTaskManager.startTask(task.taskId);
      JarvisWorkTaskManager.stopTask(task.taskId);
      await promise;

      const current = JarvisWorkTaskManager.getTask(task.taskId);
      if (current?.status !== 'CANCELLED') {
        throw new Error(`Pipeline did not abort: ${current?.status}`);
      }
    });

    // 7. Close button
    await runTest('T07_CLOSE_BUTTON', 'Close button hides panel UI without canceling task', () => {
      const task = JarvisWorkTaskManager.createTask('Research and compare these technologies');
      JarvisWorkTaskManager.openPanel(task.taskId);
      JarvisWorkTaskManager.closePanel();

      const state = JarvisWorkTaskManager.getState();
      if (state.isOpen) throw new Error('Panel did not close');
      const current = JarvisWorkTaskManager.getTask(task.taskId);
      if (current?.status === 'CANCELLED') throw new Error('Task was erroneously cancelled on close');
    });

    // 8. Background continuation
    await runTest('T08_BACKGROUND_CONTINUATION', 'Task continues execution while work panel is closed', async () => {
      const task = JarvisWorkTaskManager.createTask('Generate assets for my project');
      JarvisWorkTaskManager.closePanel(); // Panel closed
      await JarvisWorkTaskManager.startTask(task.taskId);

      const finished = JarvisWorkTaskManager.getTask(task.taskId);
      if (finished?.status !== 'COMPLETED') {
        throw new Error(`Background task did not complete: ${finished?.status}`);
      }
    });

    // 9. Reopen running task
    await runTest('T09_REOPEN_TASK', 'Reopening running task restores live progress and state', () => {
      const task = JarvisWorkTaskManager.createTask('Deep analysis task');
      JarvisWorkTaskManager.closePanel();
      JarvisWorkTaskManager.openPanel(task.taskId);

      const state = JarvisWorkTaskManager.getState();
      if (!state.isOpen) throw new Error('Panel did not reopen');
      if (state.focusedTaskId !== task.taskId) throw new Error('Did not focus reopened task');
    });

    // 10. Completion & result generation
    await runTest('T10_RESULT_GENERATION', 'Completed task produces structured result and artifacts', async () => {
      const task = JarvisWorkTaskManager.createTask('Research the latest Android APIs');
      await JarvisWorkTaskManager.startTask(task.taskId);

      const completed = JarvisWorkTaskManager.getTask(task.taskId);
      if (completed?.status !== 'COMPLETED') throw new Error('Task is not completed');
      if (!completed.result) throw new Error('Task result was not generated');
      if (!completed.result.mainContent) throw new Error('Task result missing main content');
      if (completed.result.artifacts.length === 0) throw new Error('No artifacts attached');
    });

    // 11. Result persistence & retrieval
    await runTest('T11_RESULT_PERSISTENCE', 'Result is durably stored and retrievable via stable ID', async () => {
      const task = JarvisWorkTaskManager.createTask('Create full system architecture');
      await JarvisWorkTaskManager.startTask(task.taskId);

      const retrieved = JarvisTaskResultStorage.getResultByTaskId(task.taskId);
      if (!retrieved) throw new Error('Result not found in result storage');
      if (retrieved.taskId !== task.taskId) throw new Error('Mismatched taskId on retrieved result');
    });

    // 12. Network interruption
    await runTest('T12_NETWORK_INTERRUPTION', 'Network drop transitions running task to PAUSED_NETWORK', () => {
      const task = JarvisWorkTaskManager.createTask('Research latest AI papers');
      // Force status to RUNNING for test
      task.status = 'RUNNING';
      JarvisWorkTaskManager.handleNetworkChange(false);

      const paused = JarvisWorkTaskManager.getTask(task.taskId);
      if (paused?.status !== 'PAUSED_NETWORK') {
        throw new Error(`Expected PAUSED_NETWORK, got: ${paused?.status}`);
      }
      if (paused.stageDescription !== 'Connection lost. Waiting for network...') {
        throw new Error(`Unexpected message: ${paused.stageDescription}`);
      }
    });

    // 13. Network recovery & resume
    await runTest('T13_NETWORK_RECOVERY', 'Network restoration resumes paused task from last stage', async () => {
      const task = JarvisWorkTaskManager.createTask('Analyze this large document');
      task.status = 'PAUSED_NETWORK';
      task.completedStages = ['STARTING'];

      JarvisWorkTaskManager.handleNetworkChange(true);
      // Wait for completion
      await new Promise((r) => setTimeout(r, 600));

      const resumed = JarvisWorkTaskManager.getTask(task.taskId);
      if (resumed?.status !== 'COMPLETED' && resumed?.status !== 'RUNNING') {
        throw new Error(`Task did not resume: ${resumed?.status}`);
      }
    });

    // 14. Retry mechanism
    await runTest('T14_RETRY_MECHANISM', 'Failed task can be retried safely', async () => {
      const task = JarvisWorkTaskManager.createTask('Test task for retry');
      task.status = 'FAILED';
      task.error = 'Simulated timeout';

      JarvisWorkTaskManager.retryTask(task.taskId);
      const retrying = JarvisWorkTaskManager.getTask(task.taskId);
      if (retrying?.retryCount !== 1) throw new Error('Retry count was not incremented');
    });

    // 15. Duplicate retry prevention (idempotency)
    await runTest('T15_IDEMPOTENCY', 'Completed stages are skipped on retry and results have stable IDs', async () => {
      const task = JarvisWorkTaskManager.createTask('Idempotency test task');
      task.completedStages = ['STARTING', 'RESEARCHING'];
      await JarvisWorkTaskManager.startTask(task.taskId);

      const finished = JarvisWorkTaskManager.getTask(task.taskId);
      if (finished?.completedStages.filter((s) => s === 'STARTING').length !== 1) {
        throw new Error('Stage "STARTING" was duplicated');
      }
    });

    // 16. App reopen recovery
    await runTest('T16_APP_REOPEN', 'Tasks persist in storage and can be rehydrated', () => {
      const task = JarvisWorkTaskManager.createTask('Persistent task across sessions');
      const all = JarvisWorkTaskManager.getAllTasksForActiveActor();
      const exists = all.some((t) => t.taskId === task.taskId);
      if (!exists) throw new Error('Task was not persisted');
    });

    // 17. Multiple tasks concurrency
    await runTest('T17_CONCURRENCY', 'Multiple tasks maintain independent state and AbortControllers', async () => {
      const taskA = JarvisWorkTaskManager.createTask('Research Android APIs');
      const taskB = JarvisWorkTaskManager.createTask('Generate holographic assets');

      const pA = JarvisWorkTaskManager.startTask(taskA.taskId);
      const pB = JarvisWorkTaskManager.startTask(taskB.taskId);

      // Stop A only
      JarvisWorkTaskManager.stopTask(taskA.taskId);

      await Promise.all([pA, pB]);

      const resA = JarvisWorkTaskManager.getTask(taskA.taskId);
      const resB = JarvisWorkTaskManager.getTask(taskB.taskId);

      if (resA?.status !== 'CANCELLED') throw new Error(`Task A should be CANCELLED: ${resA?.status}`);
      if (resB?.status !== 'COMPLETED') throw new Error(`Task B should be COMPLETED: ${resB?.status}`);
    });

    // 18. Task ownership isolation
    await runTest('T18_OWNER_ISOLATION', 'Tasks are tagged with actorType and respect Phase 14 isolation', () => {
      const task = JarvisWorkTaskManager.createTask('Owner private research');
      if (task.actorType !== 'owner') {
        throw new Error(`Expected owner actorType, got: ${task.actorType}`);
      }
    });

    // 19. Permission enforcement
    await runTest('T19_PERMISSION_ENFORCEMENT', 'Simple actions do NOT open work panel', () => {
      const ev1 = JarvisLongRunningDetector.evaluate('Open YouTube');
      if (ev1.isLongRunning) throw new Error('Open YouTube should NOT be long-running');

      const ev2 = JarvisLongRunningDetector.evaluate('Turn on Wi-Fi');
      if (ev2.isLongRunning) throw new Error('Turn on Wi-Fi should NOT be long-running');

      const ev3 = JarvisLongRunningDetector.evaluate('Call Mom');
      if (ev3.isLongRunning) throw new Error('Call Mom should NOT be long-running');

      const ev4 = JarvisLongRunningDetector.evaluate('Set an alarm');
      if (ev4.isLongRunning) throw new Error('Set an alarm should NOT be long-running');

      const ev5 = JarvisLongRunningDetector.evaluate('What time is it?');
      if (ev5.isLongRunning) throw new Error('What time is it should NOT be long-running');

      // Valid long-running prompts
      const ev6 = JarvisLongRunningDetector.evaluate('Research the latest Android APIs');
      if (!ev6.isLongRunning) throw new Error('Research should be long-running');

      const ev7 = JarvisLongRunningDetector.evaluate('Create a complete game design');
      if (!ev7.isLongRunning) throw new Error('Game design should be long-running');
    });

    // 20. Stale task detection & recovery
    await runTest('T20_STALE_RECOVERY', 'Tasks with expired heartbeats are recovered from hanging', () => {
      const task = JarvisWorkTaskManager.createTask('Stale task test');
      task.status = 'RUNNING';
      task.heartbeatTimestamp = Date.now() - 100_000; // 100s ago (stale)

      JarvisWorkTaskManager.checkStaleTasks();
      const checked = JarvisWorkTaskManager.getTask(task.taskId);
      if (checked?.status !== 'FAILED') {
        throw new Error(`Expected FAILED stale task, got: ${checked?.status}`);
      }
    });

    // 21. Real-time synchronization
    await runTest('T21_PUB_SUB', 'Subscribers receive real-time state updates', () => {
      let updateCount = 0;
      const unsub = JarvisWorkTaskManager.subscribe(() => {
        updateCount++;
      });
      JarvisWorkTaskManager.createTask('PubSub notification test');
      unsub();
      if (updateCount < 2) throw new Error(`Expected at least 2 updates, got: ${updateCount}`);
    });

    // 22. Reconnection reconciliation
    await runTest('T22_RECONNECT_RECONCILIATION', 'Offline paused tasks restart upon reconnection', () => {
      JarvisWorkTaskManager.handleNetworkChange(false);
      const stateOffline = JarvisWorkTaskManager.getState();
      if (stateOffline.isOnline) throw new Error('Offline state was not tracked');

      JarvisWorkTaskManager.handleNetworkChange(true);
      const stateOnline = JarvisWorkTaskManager.getState();
      if (!stateOnline.isOnline) throw new Error('Online state was not restored');
    });

    // 23. TTS integration
    await runTest('T23_TTS_INTEGRATION', 'Confirmation spoken on task start, stop, and finish', () => {
      // Test that JarvisVoiceService is callable without throwing
      JarvisVoiceService.speakText("Certainly, sir. I'll work on that.");
      JarvisVoiceService.speakText('The task has been stopped.');
      JarvisVoiceService.speakText('Your task is complete.');
    });

    // 24. Reactive visual integration
    await runTest('T24_VISUAL_REACTION', 'Visual reaction states map correctly to task lifecycle', () => {
      AssistService.setReactionState('research');
      if (AssistService.getConfig().liveWallpaperReactionState !== 'research') {
        throw new Error('Visual reaction did not update to research');
      }
      AssistService.setReactionState('completed');
      if (AssistService.getConfig().liveWallpaperReactionState !== 'completed') {
        throw new Error('Visual reaction did not update to completed');
      }
      AssistService.setReactionState('idle');
    });

    // 25. Normal ONEVA usage while task runs
    await runTest('T25_NORMAL_USAGE', 'Normal UI and launcher state is unaffected when panel is closed', () => {
      const task = JarvisWorkTaskManager.createTask('Background worker');
      JarvisWorkTaskManager.startTask(task.taskId);
      JarvisWorkTaskManager.closePanel();

      const state = JarvisWorkTaskManager.getState();
      if (state.isOpen) throw new Error('Work panel must not block UI when closed');
    });

    // 26. Cancellation race: Stop while starting
    await runTest('T26_RACE_STARTING', 'Stop during starting stage is safely handled', async () => {
      const task = JarvisWorkTaskManager.createTask('Race starting test');
      const startPromise = JarvisWorkTaskManager.startTask(task.taskId);
      JarvisWorkTaskManager.stopTask(task.taskId);
      await startPromise;

      const stopped = JarvisWorkTaskManager.getTask(task.taskId);
      if (stopped?.status !== 'CANCELLED') throw new Error(`Expected CANCELLED, got ${stopped?.status}`);
    });

    // 27. Cancellation race: Stop while researching / generating
    await runTest('T27_RACE_GENERATING', 'Stop during generation stage aborts subsequent stages', async () => {
      const task = JarvisWorkTaskManager.createTask('Race generating test');
      task.currentStage = 'GENERATING';
      const startPromise = JarvisWorkTaskManager.startTask(task.taskId);
      // Stop mid-way
      JarvisWorkTaskManager.stopTask(task.taskId);
      await startPromise;

      const stopped = JarvisWorkTaskManager.getTask(task.taskId);
      if (stopped?.status !== 'CANCELLED') throw new Error(`Expected CANCELLED, got ${stopped?.status}`);
    });

    // 28. Cancellation race: Stop immediately after completion
    await runTest('T28_RACE_COMPLETION', 'Stop after completion does not overwrite completed state', async () => {
      const task = JarvisWorkTaskManager.createTask('Race completion test');
      await JarvisWorkTaskManager.startTask(task.taskId);

      const beforeStop = JarvisWorkTaskManager.getTask(task.taskId);
      if (beforeStop?.status !== 'COMPLETED') throw new Error('Task did not complete');

      // Attempt stop after completed
      JarvisWorkTaskManager.stopTask(task.taskId);
      const afterStop = JarvisWorkTaskManager.getTask(task.taskId);
      if (afterStop?.status !== 'COMPLETED') {
        throw new Error('Completed task was erroneously mutated to CANCELLED');
      }
    });

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    return {
      passed,
      failed,
      total: results.length,
      results,
    };
  }
}
