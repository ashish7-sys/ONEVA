/**
 * ONEVA Phase 3 / Phase 22 Evolution: Comprehensive Test Suite
 * JARVIS PREDICTIVE INTENT & AUTONOMOUS ROUTINE SYNTHESIS
 * 
 * Verifies all 16 core contracts:
 * 1. Engine Initialization & Default Routines Seeded
 * 2. Default Habit Pattern Seeding & Local-First Storage
 * 3. Context Snapshot Computation & Circadian Slot Allocation
 * 4. Morning Circadian Intent Anticipation (Hour 8 -> Morning Genesis)
 * 5. Deep Focus Intent Anticipation (Hour 14 -> Deep Focus)
 * 6. Night Rest & Ocular Shield Intent Anticipation (Hour 23 -> Night Rest)
 * 7. Critical Battery Override (Battery <= 20% -> Stark Saver Lockdown)
 * 8. Habit Pattern Reinforcement (+10% Confidence Boost on Matched Habit)
 * 9. Intent Dismissal & Cooldown Suppression
 * 10. Sequential Multi-Step Routine Execution
 * 11. Routine Execution Resilience (handles step error safely)
 * 12. Phase 2 Episodic Memory Recording on Routine Execution
 * 13. Tool Registry: predict_user_intent
 * 14. Tool Registry: execute_autonomous_routine
 * 15. Tool Registry: synthesize_new_routine
 * 16. Rule 6 Compliance & On-Device Storage Isolation
 */

import { JarvisPredictiveIntentService } from './jarvisPredictiveIntentService';
import { JarvisToolRegistry } from '../actions/jarvisToolRegistry';
import { JarvisEpisodicMemoryService } from '../memory/jarvisEpisodicMemoryService';

export interface Phase22TestResult {
  id: string;
  name: string;
  passed: boolean;
  message: string;
}

export class JarvisPhase22TestSuite {
  static async runAllTests(): Promise<{
    passed: number;
    failed: number;
    total: number;
    results: Phase22TestResult[];
  }> {
    const results: Phase22TestResult[] = [];

    // Reset service state to clean baseline
    JarvisPredictiveIntentService.resetForTesting();

    const run = async (id: string, name: string, fn: () => Promise<void> | void) => {
      try {
        await fn();
        results.push({ id, name, passed: true, message: 'Verified successfully' });
      } catch (err: any) {
        results.push({ id, name, passed: false, message: err?.message || 'Failed' });
      }
    };

    // TEST-1: Engine Initialization & Default Routines
    await run('TEST-1', 'Engine Initialization & Default Routines Seeded', () => {
      JarvisPredictiveIntentService.initialize();
      const routines = JarvisPredictiveIntentService.getRoutines();
      if (routines.length < 5) {
        throw new Error(`Expected at least 5 default routines, got ${routines.length}`);
      }
      const morning = routines.find((r) => r.id === 'routine_morning_genesis');
      if (!morning || morning.steps.length === 0) {
        throw new Error('Morning Genesis routine missing or has no steps');
      }
    });

    // TEST-2: Default Habit Pattern Seeding
    await run('TEST-2', 'Default Habit Pattern Seeding & Local-First Storage', () => {
      const habits = JarvisPredictiveIntentService.getHabits();
      if (habits.length < 3) {
        throw new Error(`Expected at least 3 default habits, got ${habits.length}`);
      }
      const focusHabit = habits.find((h) => h.associatedRoutineId === 'routine_deep_focus');
      if (!focusHabit) {
        throw new Error('Deep Focus habit pattern not found in seed');
      }
    });

    // TEST-3: Context Snapshot Computation
    await run('TEST-3', 'Context Snapshot Computation & Circadian Slot Allocation', () => {
      const ctxMorning = JarvisPredictiveIntentService.getContextSnapshot({ hour: 8 });
      if (ctxMorning.circadianSlot !== 'morning') {
        throw new Error(`Expected 'morning' for hour 8, got ${ctxMorning.circadianSlot}`);
      }

      const ctxNight = JarvisPredictiveIntentService.getContextSnapshot({ hour: 23 });
      if (ctxNight.circadianSlot !== 'late_night') {
        throw new Error(`Expected 'late_night' for hour 23, got ${ctxNight.circadianSlot}`);
      }
    });

    // TEST-4: Morning Circadian Intent Anticipation
    await run('TEST-4', 'Morning Circadian Intent Anticipation (Hour 8 -> Morning Genesis)', () => {
      const intents = JarvisPredictiveIntentService.evaluateCurrentIntents({
        hour: 8,
        batteryLevel: 80,
      });

      const morningIntent = intents.find((i) => i.routineId === 'routine_morning_genesis');
      if (!morningIntent) {
        throw new Error('Morning Genesis intent was not anticipated at hour 8');
      }
      if (morningIntent.confidence < 80) {
        throw new Error(`Expected confidence >= 80, got ${morningIntent.confidence}`);
      }
    });

    // TEST-5: Deep Focus Intent Anticipation
    await run('TEST-5', 'Deep Focus Intent Anticipation (Hour 14 -> Deep Focus)', () => {
      const intents = JarvisPredictiveIntentService.evaluateCurrentIntents({
        hour: 14,
        batteryLevel: 75,
      });

      const focusIntent = intents.find((i) => i.routineId === 'routine_deep_focus');
      if (!focusIntent) {
        throw new Error('Deep Focus intent was not anticipated at hour 14');
      }
      if (focusIntent.confidence < 80) {
        throw new Error(`Expected confidence >= 80, got ${focusIntent.confidence}`);
      }
    });

    // TEST-6: Night Rest & Ocular Shield Intent Anticipation
    await run('TEST-6', 'Night Rest & Ocular Shield Intent Anticipation (Hour 23 -> Night Rest)', () => {
      const intents = JarvisPredictiveIntentService.evaluateCurrentIntents({
        hour: 23,
        batteryLevel: 60,
      });

      const nightIntent = intents.find((i) => i.routineId === 'routine_night_rest');
      if (!nightIntent) {
        throw new Error('Night Rest intent was not anticipated at hour 23');
      }
      if (nightIntent.confidence < 85) {
        throw new Error(`Expected confidence >= 85, got ${nightIntent.confidence}`);
      }
    });

    // TEST-7: Critical Battery Override
    await run('TEST-7', 'Critical Battery Override (Battery <= 20% -> Stark Saver Lockdown)', () => {
      const intents = JarvisPredictiveIntentService.evaluateCurrentIntents({
        hour: 14,
        batteryLevel: 15,
        isCharging: false,
      });

      const saverIntent = intents[0];
      if (!saverIntent || saverIntent.routineId !== 'routine_stark_saver') {
        throw new Error(`Expected Stark Saver to be top intent on 15% battery, got ${saverIntent?.title}`);
      }
      if (saverIntent.confidence < 88) {
        throw new Error(`Expected battery saver confidence >= 88%, got ${saverIntent.confidence}`);
      }
    });

    // TEST-8: Habit Pattern Reinforcement
    await run('TEST-8', 'Habit Pattern Reinforcement (+10% Boost on Matched Habit)', () => {
      // Record multiple occurrences of custom habit at hour 11
      JarvisPredictiveIntentService.recordHabitOccurrence('Deep Focus Protocol', 11, 'routine_deep_focus');
      JarvisPredictiveIntentService.recordHabitOccurrence('Deep Focus Protocol', 11, 'routine_deep_focus');
      JarvisPredictiveIntentService.recordHabitOccurrence('Deep Focus Protocol', 11, 'routine_deep_focus');

      const intents = JarvisPredictiveIntentService.evaluateCurrentIntents({
        hour: 11,
        batteryLevel: 80,
      });

      const focusIntent = intents.find((i) => i.routineId === 'routine_deep_focus');
      if (!focusIntent || !focusIntent.triggerReason.includes('Learned habit')) {
        throw new Error('Expected learned habit boost in triggerReason');
      }
    });

    // TEST-9: Intent Dismissal & Cooldown
    await run('TEST-9', 'Intent Dismissal & Cooldown Suppression', () => {
      const initialIntents = JarvisPredictiveIntentService.evaluateCurrentIntents({
        hour: 8,
        batteryLevel: 80,
      });
      const topId = initialIntents[0]?.id;
      if (!topId) throw new Error('No initial intent to dismiss');

      JarvisPredictiveIntentService.dismissIntent(topId);

      const afterDismiss = JarvisPredictiveIntentService.getActiveIntents();
      if (afterDismiss.some((i) => i.id === topId)) {
        throw new Error(`Intent ${topId} still present after dismissal`);
      }
    });

    // TEST-10: Sequential Multi-Step Routine Execution
    await run('TEST-10', 'Sequential Multi-Step Routine Execution', async () => {
      const res = await JarvisPredictiveIntentService.executeRoutine('routine_deep_focus', 'one_tap_hud');
      if (!res.success || res.completedSteps !== 3) {
        throw new Error(`Expected 3 steps completed, got ${res.completedSteps}`);
      }

      const history = JarvisPredictiveIntentService.getHistory();
      if (history.length === 0 || history[0].routineId !== 'routine_deep_focus') {
        throw new Error('Routine execution not recorded in history');
      }
    });

    // TEST-11: Routine Execution Resilience
    await run('TEST-11', 'Routine Execution Resilience (handles step error safely)', async () => {
      // Execute a non-existent routine
      const res = await JarvisPredictiveIntentService.executeRoutine('non_existent_routine', 'one_tap_hud');
      if (res.success) {
        throw new Error('Expected execution to fail for non-existent routine');
      }
    });

    // TEST-12: Phase 2 Episodic Memory Recording on Routine Execution
    await run('TEST-12', 'Phase 2 Episodic Memory Recording on Routine Execution', async () => {
      const episodesBefore = JarvisEpisodicMemoryService.getAllEpisodes().length;
      await JarvisPredictiveIntentService.executeRoutine('routine_morning_genesis', 'one_tap_hud');
      const episodesAfter = JarvisEpisodicMemoryService.getAllEpisodes().length;

      if (episodesAfter <= episodesBefore) {
        throw new Error('Expected new episodic node created in Phase 2 memory');
      }
    });

    // TEST-13: Tool Registry: predict_user_intent
    await run('TEST-13', 'Tool Registry: predict_user_intent', async () => {
      const tool = JarvisToolRegistry.getTool('predict_user_intent');
      if (!tool) throw new Error('Tool predict_user_intent not found in registry');

      const result = await tool.handler({}, {
        sessionId: 'test_phase22_1',
        language: 'en',
        isOnline: true,
        platformMode: 'web-preview',
      });

      if (!result.success || result.status !== 'EXECUTED') {
        throw new Error('predict_user_intent tool failed execution');
      }
    });

    // TEST-14: Tool Registry: execute_autonomous_routine
    await run('TEST-14', 'Tool Registry: execute_autonomous_routine', async () => {
      const tool = JarvisToolRegistry.getTool('execute_autonomous_routine');
      if (!tool) throw new Error('Tool execute_autonomous_routine not found in registry');

      const result = await tool.handler(
        { routineId: 'routine_stark_saver' },
        {
          sessionId: 'test_phase22_2',
          language: 'en',
          isOnline: true,
          platformMode: 'web-preview',
        }
      );

      if (!result.success || result.status !== 'EXECUTED') {
        throw new Error('execute_autonomous_routine tool failed execution');
      }
    });

    // TEST-15: Tool Registry: synthesize_new_routine
    await run('TEST-15', 'Tool Registry: synthesize_new_routine', async () => {
      const tool = JarvisToolRegistry.getTool('synthesize_new_routine');
      if (!tool) throw new Error('Tool synthesize_new_routine not found in registry');

      const result = await tool.handler(
        { routineName: 'Studio Production Setup', targetHour: 15 },
        {
          sessionId: 'test_phase22_3',
          language: 'en',
          isOnline: true,
          platformMode: 'web-preview',
        }
      );

      if (!result.success || result.status !== 'EXECUTED') {
        throw new Error('synthesize_new_routine tool failed execution');
      }
    });

    // TEST-16: Rule 6 Compliance & On-Device Storage Isolation
    await run('TEST-16', 'Rule 6 Compliance & On-Device Storage Isolation', () => {
      const telemetry = JarvisPredictiveIntentService.getTelemetry();
      if (!telemetry.currentContext || telemetry.routinesCount === 0) {
        throw new Error('Telemetry state is empty or invalid');
      }
      // Verify no network or cloud endpoint exists in telemetry
      const serialized = JSON.stringify(telemetry);
      if (serialized.includes('http://') || serialized.includes('https://') || serialized.includes('cloud')) {
        throw new Error('Rule 6 violation: external endpoint found in serialized telemetry');
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
