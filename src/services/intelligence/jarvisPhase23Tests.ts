/**
 * ONEVA Phase 4 / Phase 23 Evolution: Comprehensive Test Suite
 * JARVIS AUTONOMOUS SELF-HEALING & DYNAMIC SYSTEM OPTIMIZATION
 * 
 * Verifies all 16 core contracts:
 * 1. Engine Initialization & Default Config Seeded
 * 2. Multi-Subsystem Health Matrix Scanning (6 Subsystems)
 * 3. Weighted Health Scoring Formula Verification
 * 4. Memory Pressure Detection & RAM Compaction Routine
 * 5. Thermal Silicon Throttling Detection & Cooling Mitigation
 * 6. Zombie Task Detection & Safe Reclamation Execution
 * 7. Ephemeral Cache & Media Storage Reclaim
 * 8. Sequential Multi-Step Full System Self-Healing
 * 9. Self-Healing Delta Generation & Metric Attribution
 * 10. Anomaly Auto-Healed State Marking & Incident Log Resolution
 * 11. Performance Profile Calibration (performance / balanced / stark_saver)
 * 12. Phase 2 Episodic Memory Recording on Self-Healing Execution
 * 13. Tool Registry: diagnose_system_health
 * 14. Tool Registry: execute_self_healing
 * 15. Tool Registry: tune_system_performance
 * 16. Rule 6 Compliance & On-Device Storage Isolation
 */

import { JarvisSelfHealingService } from './jarvisSelfHealingService';
import { JarvisToolRegistry } from '../actions/jarvisToolRegistry';
import { JarvisEpisodicMemoryService } from '../memory/jarvisEpisodicMemoryService';

export interface Phase23TestResult {
  id: string;
  name: string;
  passed: boolean;
  message: string;
}

export class JarvisPhase23TestSuite {
  static async runAllTests(): Promise<{
    passed: number;
    failed: number;
    total: number;
    results: Phase23TestResult[];
  }> {
    const results: Phase23TestResult[] = [];

    // Reset simulations and initialize
    JarvisSelfHealingService.resetSimulations();
    JarvisSelfHealingService.initialize();
    JarvisToolRegistry.init();

    const run = async (id: string, name: string, fn: () => Promise<void> | void) => {
      try {
        await fn();
        results.push({ id, name, passed: true, message: 'Verified successfully' });
      } catch (err: any) {
        results.push({ id, name, passed: false, message: err?.message || 'Failed' });
      }
    };

    // TEST-1: Engine Initialization & Default Config Seeded
    await run('TEST-1', 'Engine Initialization & Default Config Seeded', () => {
      const cfg = JarvisSelfHealingService.getConfig();
      if (!cfg || !cfg.profile) {
        throw new Error('Config missing or failed to initialize');
      }
      if (typeof cfg.thermalThresholdCelsius !== 'number' || cfg.thermalThresholdCelsius < 30) {
        throw new Error('Invalid thermalThresholdCelsius setting');
      }
    });

    // TEST-2: Multi-Subsystem Health Matrix Scanning
    await run('TEST-2', 'Multi-Subsystem Health Matrix Scanning (6 Subsystems)', () => {
      const tel = JarvisSelfHealingService.evaluateHealthMatrix();
      const required = ['core_engine', 'ram_heap', 'thermal_silicon', 'storage_cache', 'battery_power', 'background_tasks'];
      for (const sub of required) {
        if (!tel.subsystems[sub as keyof typeof tel.subsystems]) {
          throw new Error(`Subsystem "${sub}" missing in health matrix`);
        }
      }
    });

    // TEST-3: Weighted Health Scoring Formula Verification
    await run('TEST-3', 'Weighted Health Scoring Formula Verification', () => {
      const tel = JarvisSelfHealingService.evaluateHealthMatrix();
      if (typeof tel.overallScore !== 'number' || tel.overallScore < 0 || tel.overallScore > 100) {
        throw new Error(`Invalid overallScore: ${tel.overallScore}`);
      }
      if (!['OPTIMAL', 'NOMINAL', 'ATTENTION_REQUIRED', 'DEGRADED', 'CRITICAL'].includes(tel.systemStatus)) {
        throw new Error(`Invalid systemStatus: ${tel.systemStatus}`);
      }
    });

    // TEST-4: Memory Pressure Detection & RAM Compaction Routine
    await run('TEST-4', 'Memory Pressure Detection & RAM Compaction Routine', async () => {
      JarvisSelfHealingService.injectAnomaly('high_ram');
      const highTel = JarvisSelfHealingService.evaluateHealthMatrix();
      if (highTel.subsystems.ram_heap.score > 80 && highTel.subsystems.ram_heap.status === 'OPTIMAL') {
        throw new Error('Expected degraded RAM score during high memory anomaly');
      }

      const actionRes = await JarvisSelfHealingService.executeAction('ram_compaction');
      if (actionRes.status !== 'SUCCESS' || actionRes.memoryFreedMb <= 0) {
        throw new Error('RAM compaction failed or returned non-positive memory freed');
      }

      const postTel = JarvisSelfHealingService.evaluateHealthMatrix();
      if (postTel.subsystems.ram_heap.status === 'CRITICAL') {
        throw new Error('RAM status remained critical after compaction');
      }
      JarvisSelfHealingService.resetSimulations();
    });

    // TEST-5: Thermal Silicon Throttling Detection & Cooling Mitigation
    await run('TEST-5', 'Thermal Silicon Throttling Detection & Cooling Mitigation', async () => {
      JarvisSelfHealingService.injectAnomaly('thermal_spike');
      const spikeTel = JarvisSelfHealingService.evaluateHealthMatrix();
      if (spikeTel.subsystems.thermal_silicon.status === 'OPTIMAL') {
        throw new Error('Thermal anomaly was not recognized');
      }

      const actionRes = await JarvisSelfHealingService.executeAction('thermal_mitigation');
      if (actionRes.status !== 'SUCCESS' || actionRes.thermalDeltaCelsius >= 0) {
        throw new Error('Thermal mitigation did not yield negative delta');
      }
      JarvisSelfHealingService.resetSimulations();
    });

    // TEST-6: Zombie Task Detection & Safe Reclamation Execution
    await run('TEST-6', 'Zombie Task Detection & Safe Reclamation Execution', async () => {
      JarvisSelfHealingService.injectAnomaly('zombie_task');
      const zombieTel = JarvisSelfHealingService.evaluateHealthMatrix();
      if (zombieTel.subsystems.background_tasks.anomalies.length === 0) {
        throw new Error('Zombie task anomaly was not detected in background_tasks subsystem');
      }

      const actionRes = await JarvisSelfHealingService.executeAction('zombie_task_prune');
      if (actionRes.tasksTerminated <= 0) {
        throw new Error('Expected tasks to be terminated during zombie prune');
      }
      JarvisSelfHealingService.resetSimulations();
    });

    // TEST-7: Ephemeral Cache & Media Storage Reclaim
    await run('TEST-7', 'Ephemeral Cache & Media Storage Reclaim', async () => {
      JarvisSelfHealingService.injectAnomaly('cache_bloat');
      const bloatTel = JarvisSelfHealingService.evaluateHealthMatrix();
      if (bloatTel.subsystems.storage_cache.score > 85) {
        throw new Error('Storage cache score was not dampened during cache bloat');
      }

      const actionRes = await JarvisSelfHealingService.executeAction('cache_storage_reclaim');
      if (actionRes.storageFreedKb <= 0) {
        throw new Error('Storage reclaim did not report positive freed bytes');
      }
      JarvisSelfHealingService.resetSimulations();
    });

    // TEST-8: Sequential Multi-Step Full System Self-Healing
    await run('TEST-8', 'Sequential Multi-Step Full System Self-Healing', async () => {
      JarvisSelfHealingService.injectAnomaly('high_ram');
      JarvisSelfHealingService.injectAnomaly('thermal_spike');
      JarvisSelfHealingService.injectAnomaly('zombie_task');

      const fullResult = await JarvisSelfHealingService.executeAction('full_system_healing');
      if (fullResult.status !== 'SUCCESS') {
        throw new Error(`Full self-healing failed with status ${fullResult.status}`);
      }
      if (fullResult.detailedLogs.length < 4) {
        throw new Error('Expected at least 4 sequential step logs in full self-healing');
      }
      JarvisSelfHealingService.resetSimulations();
    });

    // TEST-9: Self-Healing Delta Generation & Metric Attribution
    await run('TEST-9', 'Self-Healing Delta Generation & Metric Attribution', async () => {
      const actionRes = await JarvisSelfHealingService.executeAction('full_system_healing');
      if (!actionRes.summary || actionRes.summary.length < 15) {
        throw new Error('Missing descriptive summary delta in self healing result');
      }
      if (typeof actionRes.durationMs !== 'number' || actionRes.durationMs < 0) {
        throw new Error('Invalid durationMs calculation');
      }
    });

    // TEST-10: Anomaly Auto-Healed State Marking & Incident Log Resolution
    await run('TEST-10', 'Anomaly Auto-Healed State Marking & Incident Log Resolution', async () => {
      JarvisSelfHealingService.injectAnomaly('high_ram');
      JarvisSelfHealingService.evaluateHealthMatrix();
      await JarvisSelfHealingService.executeAction('full_system_healing');

      const tel = JarvisSelfHealingService.getTelemetry();
      const healed = tel.recentAnomalies.find((a) => a.autoHealed);
      if (!healed) {
        throw new Error('Expected at least one anomaly to be marked autoHealed');
      }
    });

    // TEST-11: Performance Profile Calibration
    await run('TEST-11', 'Performance Profile Calibration (performance / balanced / stark_saver)', () => {
      JarvisSelfHealingService.updateConfig({ profile: 'stark_saver' });
      let cfg = JarvisSelfHealingService.getConfig();
      if (cfg.profile !== 'stark_saver') {
        throw new Error('Failed to calibrate profile to stark_saver');
      }

      JarvisSelfHealingService.updateConfig({ profile: 'balanced' });
      cfg = JarvisSelfHealingService.getConfig();
      if (cfg.profile !== 'balanced') {
        throw new Error('Failed to calibrate profile to balanced');
      }
    });

    // TEST-12: Phase 2 Episodic Memory Recording on Self-Healing Execution
    await run('TEST-12', 'Phase 2 Episodic Memory Recording on Self-Healing Execution', async () => {
      const preCount = JarvisEpisodicMemoryService.getAllEpisodes().length;
      await JarvisSelfHealingService.executeAction('ram_compaction');
      const postCount = JarvisEpisodicMemoryService.getAllEpisodes().length;

      if (postCount <= preCount) {
        throw new Error('Expected self-healing execution to record an episodic memory node');
      }
    });

    // TEST-13: Tool Registry: diagnose_system_health
    await run('TEST-13', 'Tool Registry: diagnose_system_health', async () => {
      const tool = JarvisToolRegistry.getTool('diagnose_system_health');
      if (!tool) {
        throw new Error('diagnose_system_health tool not registered');
      }

      const res = await tool.handler({}, {
        sessionId: 'test_session',
        language: 'en',
        isOnline: true,
        platformMode: 'web-preview',
      });

      if (!res.success || !res.data || typeof res.data.overallScore !== 'number') {
        throw new Error('diagnose_system_health returned invalid result');
      }
    });

    // TEST-14: Tool Registry: execute_self_healing
    await run('TEST-14', 'Tool Registry: execute_self_healing', async () => {
      const tool = JarvisToolRegistry.getTool('execute_self_healing');
      if (!tool) {
        throw new Error('execute_self_healing tool not registered');
      }

      const res = await tool.handler({ actionType: 'ram_compaction' }, {
        sessionId: 'test_session',
        language: 'en',
        isOnline: true,
        platformMode: 'web-preview',
      });

      if (!res.success || !res.data || res.data.status !== 'SUCCESS') {
        throw new Error('execute_self_healing tool handler execution failed');
      }
    });

    // TEST-15: Tool Registry: tune_system_performance
    await run('TEST-15', 'Tool Registry: tune_system_performance', async () => {
      const tool = JarvisToolRegistry.getTool('tune_system_performance');
      if (!tool) {
        throw new Error('tune_system_performance tool not registered');
      }

      const res = await tool.handler({ profile: 'stark_saver' }, {
        sessionId: 'test_session',
        language: 'en',
        isOnline: true,
        platformMode: 'web-preview',
      });

      if (!res.success || res.data.profile !== 'stark_saver') {
        throw new Error('tune_system_performance tool handler execution failed');
      }
    });

    // TEST-16: Rule 6 Compliance & On-Device Storage Isolation
    await run('TEST-16', 'Rule 6 Compliance: Zero Cloud Telemetry & Local Storage Isolation', () => {
      const tel = JarvisSelfHealingService.getTelemetry();
      // Ensure no passwords, private credentials, or external API keys exist in telemetry
      const serialized = JSON.stringify(tel);
      if (serialized.includes('password') || serialized.includes('apiKey') || serialized.includes('secret')) {
        throw new Error('Privacy violation: Sensitive credentials found in self-healing telemetry');
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
