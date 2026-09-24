/**
 * ONEVA Phase 4 / Phase 23 Evolution: JARVIS Autonomous Self-Healing & Dynamic System Optimization UI
 * 
 * Interactive Stark Dashboard featuring:
 * - Real-time Subsystem Health Radar (RAM, Silicon Thermals, Zombie Tasks, Ephemeral Cache, Core, Battery)
 * - 1-Click Autonomous Self-Healing Protocol with Sequential Mitigation Execution
 * - Live Health Score Gauge (0-100%) with Stark Arc Reactor Visual State
 * - Anomaly & Incident Resolution Log (with automatic root-cause and auto-repaired stamps)
 * - Interactive Neural Anomaly Simulator (Inject High Memory, Thermal Spike, Zombie Tasks, Cache Bloat)
 * - Complete 16/16 Verification Test Suite
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Flame,
  HardDrive,
  Battery,
  ShieldCheck,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sliders,
  SlidersHorizontal,
  Layers,
  History,
  Check,
  RefreshCw,
  Clock,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { JarvisSelfHealingService } from '../../services/intelligence/jarvisSelfHealingService';
import {
  JarvisPhase23TestSuite,
  Phase23TestResult,
} from '../../services/intelligence/jarvisPhase23Tests';
import {
  SelfHealingTelemetry,
  SelfHealingActionResult,
  SelfHealingActionType,
  SystemAnomaly,
  PerformanceProfileConfig,
  SubsystemType,
} from '../../types/jarvisSelfHealing';

interface JarvisSelfHealingViewProps {
  onToast?: (msg: string) => void;
}

export function JarvisSelfHealingView({ onToast }: JarvisSelfHealingViewProps) {
  const [activeTab, setActiveTab] = useState<'radar' | 'incidents' | 'history' | 'tuner' | 'simulator' | 'tests'>('radar');
  const [telemetry, setTelemetry] = useState<SelfHealingTelemetry>(JarvisSelfHealingService.getTelemetry());
  const [config, setConfig] = useState<PerformanceProfileConfig>(JarvisSelfHealingService.getConfig());
  const [isHealing, setIsHealing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Test Suite State
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<Phase23TestResult[] | null>(null);
  const [testSummary, setTestSummary] = useState<{ passed: number; total: number } | null>(null);

  useEffect(() => {
    JarvisSelfHealingService.initialize();
    const update = () => {
      setTelemetry(JarvisSelfHealingService.getTelemetry());
      setConfig(JarvisSelfHealingService.getConfig());
    };

    update();
    const unsub = JarvisSelfHealingService.subscribe(update);
    const pollInterval = setInterval(update, 3000);

    return () => {
      unsub();
      clearInterval(pollInterval);
    };
  }, []);

  const handleExecuteHealing = async (actionType: SelfHealingActionType = 'full_system_healing') => {
    setIsHealing(true);
    setActiveAction(actionType);
    try {
      const res = await JarvisSelfHealingService.executeAction(actionType);
      onToast?.(res.summary);
    } catch (e: any) {
      onToast?.(`Self-healing error: ${e?.message || 'Failed'}`);
    } finally {
      setIsHealing(false);
      setActiveAction(null);
    }
  };

  const handleRunAllTests = async () => {
    setIsRunningTests(true);
    try {
      const outcome = await JarvisPhase23TestSuite.runAllTests();
      setTestResults(outcome.results);
      setTestSummary({ passed: outcome.passed, total: outcome.total });
      onToast?.(`Phase 4 verification: ${outcome.passed}/${outcome.total} passed`);
    } catch (e: any) {
      onToast?.(`Test runner error: ${e?.message || 'Failed'}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPTIMAL':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'NOMINAL':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'ATTENTION_REQUIRED':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'DEGRADED':
        return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'CRITICAL':
      default:
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    }
  };

  const getSubsystemIcon = (sub: SubsystemType) => {
    switch (sub) {
      case 'ram_heap':
        return <HardDrive className="w-4 h-4 text-purple-400" />;
      case 'thermal_silicon':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'background_tasks':
        return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'storage_cache':
        return <Layers className="w-4 h-4 text-blue-400" />;
      case 'battery_power':
        return <Battery className="w-4 h-4 text-green-400" />;
      case 'core_engine':
      default:
        return <Cpu className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-neutral-950/90 shadow-2xl backdrop-blur-2xl p-6 sm:p-8 space-y-6 text-neutral-100">
      {/* Header Deck */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
              Phase 4 / Phase 23 Evolution
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            JARVIS Autonomous Self-Healing Core
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl">
            Real-time multi-subsystem diagnostics, RAM compaction, silicon thermal throttle mitigation, zombie execution lease reclamation, and autonomous local self-repair.
          </p>
        </div>

        {/* Global Arc Reactor Health & 1-Click Full Healing */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-neutral-900/80 border border-white/10">
            <div className="relative flex items-center justify-center">
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono font-bold text-sm ${
                telemetry.overallScore >= 85 ? 'border-emerald-500 text-emerald-400 shadow-emerald-500/20' :
                telemetry.overallScore >= 65 ? 'border-cyan-500 text-cyan-400 shadow-cyan-500/20' :
                'border-amber-500 text-amber-400 shadow-amber-500/20'
              }`}>
                {telemetry.overallScore}%
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-neutral-400 uppercase">System Status</div>
              <div className={`text-xs font-bold ${getStatusColor(telemetry.systemStatus).split(' ')[0]}`}>
                {telemetry.systemStatus}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isHealing}
            onClick={() => handleExecuteHealing('full_system_healing')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isHealing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Healing Subsystems...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Run Full Self-Healing</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'radar'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-neutral-400 hover:text-white bg-white/5'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Subsystem Radar (6)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'incidents'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-neutral-400 hover:text-white bg-white/5'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Anomalies &amp; Auto-Repair ({telemetry.recentAnomalies.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'history'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-neutral-400 hover:text-white bg-white/5'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Healing Log ({telemetry.recentHealingHistory.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tuner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'tuner'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-neutral-400 hover:text-white bg-white/5'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Performance Tuner</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'simulator'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-neutral-400 hover:text-white bg-white/5'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Anomaly Simulator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'tests'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-neutral-400 hover:text-white bg-white/5'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verification (16/16)</span>
        </button>
      </div>

      {/* TAB 1: SUBSYSTEM RADAR */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(telemetry.subsystems).map((sub) => (
              <div
                key={sub.subsystem}
                className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-cyan-500/30 transition space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                      {getSubsystemIcon(sub.subsystem)}
                    </div>
                    <span className="text-xs font-semibold text-white">{sub.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getStatusColor(sub.status)}`}>
                    {sub.score}%
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed min-h-[36px]">
                  {sub.details}
                </p>

                {/* Raw metrics breakdown */}
                <div className="space-y-1.5 pt-2 border-t border-white/5 text-[11px]">
                  {sub.rawMetrics.map((rm) => (
                    <div key={rm.label} className="flex items-center justify-between text-neutral-400">
                      <span>{rm.label}:</span>
                      <span className="font-mono text-neutral-200">
                        {rm.value} {rm.unit || ''}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subsystem Targeted Action Button */}
                <div className="pt-2">
                  {sub.subsystem === 'ram_heap' && (
                    <button
                      type="button"
                      disabled={isHealing}
                      onClick={() => handleExecuteHealing('ram_compaction')}
                      className="w-full py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-medium transition cursor-pointer"
                    >
                      Compact Heap &amp; Free RAM
                    </button>
                  )}
                  {sub.subsystem === 'thermal_silicon' && (
                    <button
                      type="button"
                      disabled={isHealing}
                      onClick={() => handleExecuteHealing('thermal_mitigation')}
                      className="w-full py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition cursor-pointer"
                    >
                      Dampen Thermal Throttle
                    </button>
                  )}
                  {sub.subsystem === 'background_tasks' && (
                    <button
                      type="button"
                      disabled={isHealing}
                      onClick={() => handleExecuteHealing('zombie_task_prune')}
                      className="w-full py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition cursor-pointer"
                    >
                      Quarantine Zombie Tasks
                    </button>
                  )}
                  {sub.subsystem === 'storage_cache' && (
                    <button
                      type="button"
                      disabled={isHealing}
                      onClick={() => handleExecuteHealing('cache_storage_reclaim')}
                      className="w-full py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium transition cursor-pointer"
                    >
                      Prune Ephemeral Cache
                    </button>
                  )}
                  {sub.subsystem === 'battery_power' && (
                    <button
                      type="button"
                      disabled={isHealing}
                      onClick={() => handleExecuteHealing('radio_power_tune')}
                      className="w-full py-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30 text-[11px] font-medium transition cursor-pointer"
                    >
                      Calibrate Stark Saver Mode
                    </button>
                  )}
                  {sub.subsystem === 'core_engine' && (
                    <div className="text-[10px] font-mono text-cyan-400 text-center py-1">
                      Event Loop Synchronized
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ANOMALIES & AUTO-REPAIR */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          {telemetry.recentAnomalies.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-900/40 border border-white/5 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-semibold text-white">All Subsystems Nominal</div>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                No active memory leaks, thermal spikes, or orphaned background tasks detected.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {telemetry.recentAnomalies.map((anom) => (
                <div
                  key={anom.id}
                  className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-neutral-300 border border-white/10">
                        {anom.subsystem}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        anom.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {anom.severity}
                      </span>
                      {anom.autoHealed ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Auto-Healed
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Active Incident
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-white">{anom.description}</div>
                    {anom.resolutionDetails && (
                      <div className="text-[11px] text-neutral-400 italic">
                        {anom.resolutionDetails}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-neutral-500 shrink-0">
                    {new Date(anom.detectedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HEALING HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {telemetry.recentHealingHistory.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-900/40 border border-white/5 text-center space-y-2">
              <History className="w-8 h-8 text-neutral-500 mx-auto" />
              <div className="text-sm font-semibold text-white">No Self-Healing Records Yet</div>
              <p className="text-xs text-neutral-400">
                Trigger a manual or autonomous self-healing protocol to view optimization history.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {telemetry.recentHealingHistory.map((item) => (
                <div
                  key={item.actionId}
                  className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400">
                        {item.actionType.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {item.status}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {new Date(item.startTime).toLocaleTimeString()} ({item.durationMs}ms)
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300">{item.summary}</p>

                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-neutral-400 pt-1">
                    {item.memoryFreedMb > 0 && (
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        RAM: -{item.memoryFreedMb}MB
                      </span>
                    )}
                    {item.thermalDeltaCelsius !== 0 && (
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        Thermal: {item.thermalDeltaCelsius}°C
                      </span>
                    )}
                    {item.tasksTerminated > 0 && (
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        Tasks: {item.tasksTerminated} Pruned
                      </span>
                    )}
                    {item.storageFreedKb > 0 && (
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        Cache: -{(item.storageFreedKb / 1024).toFixed(1)}MB
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PERFORMANCE TUNER */}
      {activeTab === 'tuner' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white">System Performance Profiles</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Select dynamic governor profile to balance peak responsiveness against silicon thermal limits.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'performance', name: 'High Performance', desc: '120Hz display, peak CPU allocation, zero aggressive throttling' },
                { id: 'balanced', name: 'Balanced Stark', desc: 'Dynamic refresh rate, proactive cooling, nominal battery efficiency' },
                { id: 'stark_saver', name: 'Stark Saver', desc: '60Hz lock, conservative CPU frequency, maximal battery longevity' },
              ].map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => {
                    const updated = JarvisSelfHealingService.updateConfig({ profile: prof.id as any });
                    setConfig(updated);
                    onToast?.(`Performance profile calibrated to ${prof.name}`);
                  }}
                  className={`p-4 rounded-2xl text-left border transition cursor-pointer ${
                    config.profile === prof.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'bg-white/5 text-neutral-400 hover:text-white border-white/10'
                  }`}
                >
                  <div className="text-xs font-bold text-white mb-1">{prof.name}</div>
                  <div className="text-[11px] text-neutral-400 leading-relaxed">{prof.desc}</div>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Autonomous Self-Healing Daemon</div>
                  <div className="text-[11px] text-neutral-400">Automatically compact memory and cool thermal spikes in background</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoHealingEnabled}
                  onChange={(e) => {
                    const updated = JarvisSelfHealingService.updateConfig({ autoHealingEnabled: e.target.checked });
                    setConfig(updated);
                  }}
                  className="w-4 h-4 rounded border-neutral-700 text-cyan-500 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Thermal Throttling Threshold</div>
                  <div className="text-[11px] text-neutral-400">Trigger active cooling when silicon reaches this temperature</div>
                </div>
                <span className="text-xs font-mono text-cyan-400">{config.thermalThresholdCelsius}°C</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Background Execution Lease Timeout</div>
                  <div className="text-[11px] text-neutral-400">Quarantine and terminate tasks running longer than this budget</div>
                </div>
                <span className="text-xs font-mono text-cyan-400">{config.backgroundTaskMaxLifetimeSec}s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ANOMALY SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Neural Anomaly Injection Matrix</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Inject hardware stress anomalies to test and observe how the autonomous self-healing engine detects and corrects faults.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => {
                  JarvisSelfHealingService.injectAnomaly('high_ram');
                  onToast?.('Injected RAM Pressure Spike (89% utilization)');
                }}
                className="p-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-left transition cursor-pointer"
              >
                <div className="text-xs font-bold text-purple-300 mb-1">RAM Pressure Spike</div>
                <div className="text-[11px] text-neutral-400">Simulate 89% memory consumption and heap saturation</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  JarvisSelfHealingService.injectAnomaly('thermal_spike');
                  onToast?.('Injected Silicon Thermal Spike (44.2°C)');
                }}
                className="p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition cursor-pointer"
              >
                <div className="text-xs font-bold text-amber-300 mb-1">Thermal Silicon Spike</div>
                <div className="text-[11px] text-neutral-400">Simulate 44.2°C junction temperature with throttle risk</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  JarvisSelfHealingService.injectAnomaly('zombie_task');
                  onToast?.('Injected 3 Orphaned Zombie Background Tasks');
                }}
                className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition cursor-pointer"
              >
                <div className="text-xs font-bold text-emerald-300 mb-1">Zombie Task Leak</div>
                <div className="text-[11px] text-neutral-400">Simulate 3 stale background tasks exceeding lease limits</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  JarvisSelfHealingService.injectAnomaly('cache_bloat');
                  onToast?.('Injected Ephemeral Cache Bloat (84MB)');
                }}
                className="p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-left transition cursor-pointer"
              >
                <div className="text-xs font-bold text-blue-300 mb-1">Cache Bloat</div>
                <div className="text-[11px] text-neutral-400">Simulate 84MB of accumulated transient media buffers</div>
              </button>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                After injecting an anomaly, switch to the <b>Radar</b> tab or tap <b>Run Full Self-Healing</b>.
              </span>
              <button
                type="button"
                onClick={() => {
                  JarvisSelfHealingService.resetSimulations();
                  onToast?.('All simulated anomalies reset to baseline');
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-neutral-200 border border-white/10 transition cursor-pointer"
              >
                Reset All Simulations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: VERIFICATION TEST SUITE (16/16) */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-900/60 border border-white/10">
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Phase 4 / Phase 23 Contract Verification Suite</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Validates all 16 autonomous self-healing, diagnostic scoring, memory pruning, and Rule 6 contracts.
              </p>
            </div>

            <button
              type="button"
              disabled={isRunningTests}
              onClick={handleRunAllTests}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isRunningTests ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run 16 Verification Tests</span>
                </>
              )}
            </button>
          </div>

          {testSummary && (
            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              testSummary.passed === testSummary.total
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <span>Verification Result: {testSummary.passed} of {testSummary.total} Tests Passed</span>
              <span className="font-mono">{Math.round((testSummary.passed / testSummary.total) * 100)}% Pass Rate</span>
            </div>
          )}

          {testResults && (
            <div className="space-y-2">
              {testResults.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl bg-neutral-900/40 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {r.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-mono text-neutral-400 text-[11px]">{r.id}</span>
                    <span className="text-white font-medium">{r.name}</span>
                  </div>
                  <span className={`text-[11px] font-mono ${r.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {r.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
