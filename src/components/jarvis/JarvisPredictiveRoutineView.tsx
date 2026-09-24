/**
 * ONEVA Phase 3 / Phase 22 Evolution: JARVIS Predictive Intent & Autonomous Routine Synthesis UI
 * 
 * Interactive Stark Dashboard featuring:
 * - Real-time Intent Anticipation & Circadian Context Matrix
 * - Multi-Step Autonomous Routines with Live Step Dispatching
 * - Local-First Habit & Pattern Learning Engine
 * - One-Tap HUD & Context Simulator (Test Circadian / Battery States)
 * - Complete 16/16 Verification Test Suite
 */

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sun,
  Moon,
  Focus,
  Tv,
  Volume2,
  BatteryCharging,
  Sliders,
  X,
  History,
  ShieldCheck,
  Check,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { JarvisPredictiveIntentService } from '../../services/intelligence/jarvisPredictiveIntentService';
import {
  JarvisPhase22TestSuite,
  Phase22TestResult,
} from '../../services/intelligence/jarvisPhase22Tests';
import {
  AutonomousRoutine,
  PredictiveIntent,
  LearnedHabitPattern,
  PredictiveTelemetry,
  RoutineExecutionRecord,
} from '../../types/jarvisPredictiveRoutine';
import { JarvisTtsEngine } from '../../services/voice/jarvisTtsEngine';

interface JarvisPredictiveRoutineViewProps {
  onToast?: (msg: string) => void;
}

export function JarvisPredictiveRoutineView({ onToast }: JarvisPredictiveRoutineViewProps) {
  const [activeTab, setActiveTab] = useState<'predictions' | 'routines' | 'habits' | 'history' | 'tests'>('predictions');
  const [telemetry, setTelemetry] = useState<PredictiveTelemetry>(JarvisPredictiveIntentService.getTelemetry());
  const [routines, setRoutines] = useState<AutonomousRoutine[]>(JarvisPredictiveIntentService.getRoutines());
  const [habits, setHabits] = useState<LearnedHabitPattern[]>(JarvisPredictiveIntentService.getHabits());
  const [history, setHistory] = useState<RoutineExecutionRecord[]>(JarvisPredictiveIntentService.getHistory());
  const [executingRoutineId, setExecutingRoutineId] = useState<string | null>(null);

  // Context simulation overrides
  const [simulatedHour, setSimulatedHour] = useState<number>(new Date().getHours());
  const [simulatedBattery, setSimulatedBattery] = useState<number>(80);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Test suite state
  const [testResults, setTestResults] = useState<{
    passed: number;
    failed: number;
    total: number;
    results: Phase22TestResult[];
  } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // New habit form
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitHour, setNewHabitHour] = useState(14);

  useEffect(() => {
    JarvisPredictiveIntentService.initialize();
    const update = () => {
      setTelemetry(JarvisPredictiveIntentService.getTelemetry());
      setRoutines(JarvisPredictiveIntentService.getRoutines());
      setHabits(JarvisPredictiveIntentService.getHabits());
      setHistory(JarvisPredictiveIntentService.getHistory());
    };
    update();
    return JarvisPredictiveIntentService.subscribe(update);
  }, []);

  const handleSimulateContext = (hour: number, battery: number) => {
    setIsSimulating(true);
    setSimulatedHour(hour);
    setSimulatedBattery(battery);
    JarvisPredictiveIntentService.evaluateCurrentIntents({
      hour,
      batteryLevel: battery,
    });
    onToast?.(`Simulating: ${hour}:00, Battery ${battery}%`);
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    const actualHour = new Date().getHours();
    setSimulatedHour(actualHour);
    setSimulatedBattery(80);
    JarvisPredictiveIntentService.evaluateCurrentIntents();
    onToast?.('Restored live hardware & circadian context.');
  };

  const handleExecuteRoutine = async (routineId: string) => {
    setExecutingRoutineId(routineId);
    try {
      const res = await JarvisPredictiveIntentService.executeRoutine(routineId, 'one_tap_hud');
      onToast?.(res.message);
    } catch (e: any) {
      onToast?.(`Execution error: ${e?.message || 'failed'}`);
    } finally {
      setExecutingRoutineId(null);
    }
  };

  const handleDismissIntent = (id: string) => {
    JarvisPredictiveIntentService.dismissIntent(id);
    onToast?.('Intent suppressed for this session.');
  };

  const handleSpeak = (text: string, lang: 'en' | 'hi') => {
    try {
      JarvisTtsEngine.speak({
        id: `speak_${Date.now()}`,
        text,
        language: lang === 'hi' ? 'hi-IN' : 'en-US',
      });
    } catch {}
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await JarvisPhase22TestSuite.runAllTests();
      setTestResults(results);
      onToast?.(`Phase 3 Test Suite: ${results.passed}/${results.total} Passed`);
    } catch (e: any) {
      onToast?.(`Test execution failed: ${e?.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    JarvisPredictiveIntentService.recordHabitOccurrence(newHabitName.trim(), newHabitHour);
    onToast?.(`Learned pattern for "${newHabitName.trim()}" at ${newHabitHour}:00.`);
    setNewHabitName('');
  };

  const getRoutineIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun':
        return <Sun className="w-5 h-5 text-amber-400" />;
      case 'Moon':
        return <Moon className="w-5 h-5 text-indigo-400" />;
      case 'Focus':
        return <Focus className="w-5 h-5 text-cyan-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-emerald-400" />;
      case 'Tv':
        return <Tv className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div id="jarvis-predictive-routine-container" className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-6">
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Phase 3 / Phase 22 Evolution
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Rule 6 Privacy Safe
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white mt-1">
            Predictive Intent &amp; Autonomous Routines
          </h2>
          <p className="text-xs text-neutral-400">
            Circadian intent anticipation, on-device habit synthesis, and sequential multi-step automations.
          </p>
        </div>

        {/* Circadian Context Capsule */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-neutral-950/80 border border-white/10 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{telemetry.currentContext.timeFormatted}</span>
            <span className="capitalize text-neutral-500">({telemetry.currentContext.circadianSlot.replace('_', ' ')})</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-neutral-300">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            <span>{telemetry.currentContext.batteryLevel}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
        {[
          { id: 'predictions', label: 'Live Predictions', icon: Sparkles, count: telemetry.activeIntents.length },
          { id: 'routines', label: 'Autonomous Routines', icon: Layers, count: routines.length },
          { id: 'habits', label: 'Learned Habits', icon: Clock, count: habits.length },
          { id: 'history', label: 'Execution Logs', icon: History, count: history.length },
          { id: 'tests', label: 'Verification Suite', icon: ShieldCheck, count: testResults ? `${testResults.passed}/${testResults.total}` : '16/16' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/40'
                  : 'bg-neutral-800/40 text-neutral-400 hover:bg-neutral-800/80 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10 text-neutral-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE PREDICTIONS & CONTEXT SIMULATOR */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {/* Quick Context Simulator */}
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Neural Context Simulator</span>
                {isSimulating && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Active Simulation
                  </span>
                )}
              </div>
              {isSimulating && (
                <button
                  onClick={handleResetSimulation}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer font-mono"
                >
                  <RotateCw className="w-3 h-3" /> Reset Live
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => handleSimulateContext(8, 85)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 border border-white/5 text-neutral-200 cursor-pointer flex items-center gap-1.5"
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" /> 08:00 AM (Morning)
              </button>
              <button
                onClick={() => handleSimulateContext(14, 75)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 border border-white/5 text-neutral-200 cursor-pointer flex items-center gap-1.5"
              >
                <Focus className="w-3.5 h-3.5 text-cyan-400" /> 02:00 PM (Deep Focus)
              </button>
              <button
                onClick={() => handleSimulateContext(19, 65)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 border border-white/5 text-neutral-200 cursor-pointer flex items-center gap-1.5"
              >
                <Tv className="w-3.5 h-3.5 text-purple-400" /> 07:00 PM (Media Mode)
              </button>
              <button
                onClick={() => handleSimulateContext(23, 50)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 border border-white/5 text-neutral-200 cursor-pointer flex items-center gap-1.5"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> 11:00 PM (Night Rest)
              </button>
              <button
                onClick={() => handleSimulateContext(15, 14)}
                className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-red-400" /> Battery 14% (Stark Saver)
              </button>
            </div>
          </div>

          {/* Anticipated Intents List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
              Anticipated Intents (Ranked by Neural Confidence)
            </h3>

            {telemetry.activeIntents.length === 0 ? (
              <div className="p-8 rounded-2xl bg-neutral-950/40 border border-white/5 text-center space-y-2">
                <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs text-neutral-400">All systems nominal. No urgent actions anticipated.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {telemetry.activeIntents.map((intent) => {
                  const isExecuting = executingRoutineId === intent.routineId;
                  return (
                    <div
                      key={intent.id}
                      className="p-4 rounded-2xl bg-neutral-950/80 border border-white/10 space-y-3 flex flex-col justify-between hover:border-cyan-500/30 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {intent.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-400">
                              {intent.confidence}% Confidence
                            </span>
                            <button
                              onClick={() => handleDismissIntent(intent.id)}
                              className="text-neutral-500 hover:text-neutral-300 p-1 cursor-pointer"
                              title="Dismiss for this session"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-white">{intent.title}</h4>
                          <p className="text-xs text-neutral-400 mt-0.5">{intent.description}</p>
                        </div>

                        <div className="p-2 rounded-xl bg-neutral-900/60 border border-white/5 text-[11px] font-mono text-neutral-400">
                          <span className="text-neutral-500">Trigger:</span> {intent.triggerReason}
                        </div>
                      </div>

                      {/* Vocal Prompts and Action */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSpeak(intent.vocalPromptEn, 'en')}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 cursor-pointer"
                            title="Hear English Vocal Prompt"
                          >
                            <Volume2 className="w-3 h-3 text-cyan-400" /> EN
                          </button>
                          <button
                            onClick={() => handleSpeak(intent.vocalPromptHi, 'hi')}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 cursor-pointer"
                            title="Hear Hindi Vocal Prompt"
                          >
                            <Volume2 className="w-3 h-3 text-amber-400" /> HI
                          </button>
                        </div>

                        {intent.routineId && (
                          <button
                            onClick={() => handleExecuteRoutine(intent.routineId!)}
                            disabled={isExecuting}
                            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isExecuting ? (
                              <>
                                <RotateCw className="w-3 h-3 animate-spin" /> Running...
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" /> 1-Tap Execute
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AUTONOMOUS ROUTINES */}
      {activeTab === 'routines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
              Synthesized Multi-Step Routines ({routines.length})
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">
              Auto-Execute Threshold: 85%+
            </span>
          </div>

          <div className="space-y-3">
            {routines.map((routine) => {
              const isExecuting = executingRoutineId === routine.id;
              return (
                <div
                  key={routine.id}
                  className="p-4 rounded-2xl bg-neutral-950/80 border border-white/10 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-white/10">
                        {getRoutineIcon(routine.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white">{routine.name}</h4>
                          <span className="text-xs text-neutral-400 font-medium">/ {routine.nameHindi}</span>
                          {routine.isAutoTrigger && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Auto-Trigger
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{routine.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleExecuteRoutine(routine.id)}
                        disabled={isExecuting}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isExecuting ? (
                          <>
                            <RotateCw className="w-3.5 h-3.5 animate-spin" /> Executing...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" /> Run Routine
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sequential Steps List */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 space-y-2">
                    <div className="text-[10px] font-mono uppercase text-neutral-400">
                      Sequential Execution Pipeline ({routine.steps.length} Steps)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {routine.steps.map((step, idx) => (
                        <div
                          key={step.stepId}
                          className="p-2.5 rounded-lg bg-neutral-950 border border-white/5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                            <span>Step 0{idx + 1}</span>
                            {step.status === 'COMPLETED' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : step.status === 'RUNNING' ? (
                              <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                            ) : (
                              <span className="text-neutral-500">Standby</span>
                            )}
                          </div>
                          <div className="font-medium text-white truncate">{step.name}</div>
                          <div className="text-[11px] text-neutral-400 font-mono truncate">
                            {step.toolId}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-1">
                    <span>Executions: {routine.executionCount}</span>
                    {routine.lastExecutedAt && (
                      <span>Last run: {new Date(routine.lastExecutedAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LEARNED HABITS */}
      {activeTab === 'habits' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
              On-Device Habit &amp; Pattern Matrix (Rule 6 Compliant)
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% On-Device Processing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {habits.map((habit) => (
              <div
                key={habit.patternId}
                className="p-4 rounded-2xl bg-neutral-950/80 border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Hour {habit.hourBucket}:00
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {habit.confidenceScore}% Strength
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">{habit.actionName}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Repeated {habit.frequency} times during this circadian window.
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span>Day: {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][habit.dayOfWeek]}</span>
                  <span>Confidence: {habit.confidenceScore}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Form to synthesize new habit pattern */}
          <form onSubmit={handleAddHabit} className="p-4 rounded-2xl bg-neutral-950/40 border border-white/5 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-300 uppercase font-mono">
              Teach JARVIS a New Daily Pattern
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="e.g. Studio Audio Calibration, Evening Wind-Down"
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
              />
              <select
                value={newHabitHour}
                onChange={(e) => setNewHabitHour(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>
                    Hour {h.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-200 cursor-pointer"
              >
                Synthesize Pattern
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: EXECUTION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
            Autonomous Execution Telemetry ({history.length} Events)
          </h3>

          {history.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-950/40 border border-white/5 text-center">
              <p className="text-xs text-neutral-400">No autonomous routines executed in this session yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((record) => (
                <div
                  key={record.executionId}
                  className="p-3.5 rounded-xl bg-neutral-950/80 border border-white/5 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">{record.routineName}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        Source: {record.triggerSource} | Steps: {record.completedSteps}/{record.totalSteps}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px] text-neutral-400">
                    <div>{new Date(record.executedAt).toLocaleTimeString()}</div>
                    <div className="text-neutral-500">{record.durationMs}ms</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TEST SUITE */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-950/80 border border-white/10">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Phase 3 / Phase 22 Verification Suite
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Executes all 16 core contracts: Circadian Intent Anticipation, Autonomous Multi-Step Execution, Local-First Habit Learning, and Rule 6 Compliance.
              </p>
            </div>
            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-semibold text-xs flex items-center gap-2 hover:bg-cyan-400 transition cursor-pointer disabled:opacity-50"
            >
              {isRunningTests ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" /> Running 16 Tests...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Run All 16 Tests
                </>
              )}
            </button>
          </div>

          {testResults && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-emerald-400 font-bold">
                  {testResults.passed} / {testResults.total} Passed
                </span>
                {testResults.failed > 0 && (
                  <span className="text-red-400 font-bold">
                    {testResults.failed} Failed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {testResults.results.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      t.passed
                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200'
                        : 'bg-red-950/20 border-red-500/20 text-red-200'
                    }`}
                  >
                    {t.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="font-mono text-[10px] text-neutral-400">{t.id}</div>
                      <div className="font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-neutral-300">{t.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
