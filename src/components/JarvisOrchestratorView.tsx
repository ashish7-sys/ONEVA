import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Layers,
  FlaskConical,
  XCircle,
} from 'lucide-react';
import {
  JarvisOrchestratedTask,
  JarvisOrchestratorState,
  JarvisOrchestratedStep,
} from '../types/jarvisOrchestration';
import { JarvisOrchestrator } from '../services/intelligence/jarvisOrchestrator';
import { JarvisPhase15Tests, Phase15TestResult } from '../services/intelligence/jarvisPhase15Tests';

interface JarvisOrchestratorViewProps {
  onClose?: () => void;
  onRequestExecution?: (goal: string) => void;
}

export const JarvisOrchestratorView: React.FC<JarvisOrchestratorViewProps> = ({
  onRequestExecution,
}) => {
  const [orchestratorState, setOrchestratorState] = useState<JarvisOrchestratorState>(
    JarvisOrchestrator.getState()
  );
  const [activeTab, setActiveTab] = useState<'task' | 'presets' | 'tests'>('task');
  const [testResults, setTestResults] = useState<Phase15TestResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testSummary, setTestSummary] = useState<{ total: number; passed: number; failed: number } | null>(null);
  const [customGoalInput, setCustomGoalInput] = useState('');

  useEffect(() => {
    JarvisOrchestrator.init();
    const unsubscribe = JarvisOrchestrator.subscribe((state) => {
      setOrchestratorState(state);
    });
    return () => unsubscribe();
  }, []);

  const activeTask = JarvisOrchestrator.getActiveTask();

  const handlePause = () => {
    JarvisOrchestrator.pauseActiveTask();
  };

  const handleResume = (taskId: string) => {
    JarvisOrchestrator.resumeTask(taskId);
  };

  const handleCancel = () => {
    JarvisOrchestrator.cancelActiveTask();
  };

  const handleDismissInterrupted = () => {
    JarvisOrchestrator.dismissInterruptedTask();
  };

  const handleRunGoal = async (goal: string) => {
    if (!goal.trim()) return;
    if (onRequestExecution) {
      onRequestExecution(goal);
    } else {
      await JarvisOrchestrator.submitGoal(goal);
    }
    setActiveTab('task');
  };

  const handleRunAllTests = async () => {
    setIsRunningTests(true);
    setTestResults(null);
    try {
      const outcome = await JarvisPhase15Tests.runAllTests();
      setTestResults(outcome.results);
      setTestSummary({
        total: outcome.results.length,
        passed: outcome.totalPassed,
        failed: outcome.totalFailed,
      });
    } catch (err) {
      console.error('[JarvisOrchestratorView] Test runner exception:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const getStatusBadge = (status: JarvisOrchestratedTask['status']) => {
    switch (status) {
      case 'RUNNING':
      case 'VERIFYING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Running
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'PARTIALLY_COMPLETED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Partial
          </span>
        );
      case 'PAUSED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Pause className="w-3.5 h-3.5" />
            Paused
          </span>
        );
      case 'WAITING_FOR_PERMISSION':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            Permission Required
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-600/30 text-zinc-400 border border-zinc-500/30">
            <Square className="w-3 h-3" />
            Stopped
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
    }
  };

  const getStepIcon = (step: JarvisOrchestratedStep) => {
    switch (step.status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'RUNNING':
      case 'VERIFYING':
        return <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'SKIPPED':
        return <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0" />;
      case 'CANCELLED':
        return <Square className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-500 shrink-0" />;
    }
  };

  return (
    <div id="jarvis_orchestrator_container" className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3.5 shadow-xl text-white">
      {/* Interrupted Task Banner */}
      {orchestratorState.interruptedTaskFound && activeTask?.isInterrupted && (
        <div id="interrupted_task_alert" className="mb-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="font-medium text-amber-200">An unfinished JARVIS task was found.</p>
              <p className="text-zinc-400 text-[11px] truncate max-w-[200px]">{activeTask.originalGoal}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="btn_resume_interrupted"
              onClick={() => handleResume(activeTask.taskId)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 font-medium"
            >
              Resume
            </button>
            <button
              id="btn_dismiss_interrupted"
              onClick={handleDismissInterrupted}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-zinc-400"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-zinc-100 flex items-center gap-1.5">
              Autonomous Orchestrator
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                P15
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">Multi-step goal execution with verified dependencies</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg text-xs">
          <button
            id="tab_active_task"
            onClick={() => setActiveTab('task')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'task' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Live Task
          </button>
          <button
            id="tab_presets"
            onClick={() => setActiveTab('presets')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'presets' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Presets
          </button>
          <button
            id="tab_tests"
            onClick={() => setActiveTab('tests')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'tests' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tests (17)
          </button>
        </div>
      </div>

      {/* TAB 1: Live Task Monitor */}
      {activeTab === 'task' && (
        <div>
          {activeTask ? (
            <div className="space-y-3">
              {/* Task Header */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex-1">
                    <p className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase">Goal</p>
                    <p className="text-xs font-semibold text-zinc-100">{activeTask.originalGoal}</p>
                  </div>
                  {getStatusBadge(activeTask.status)}
                </div>

                {/* Progress Summary */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 pt-2 border-t border-slate-900">
                  <span>
                    Steps:{' '}
                    <strong className="text-zinc-200">
                      {activeTask.steps.filter((s) => s.status === 'COMPLETED').length} / {activeTask.steps.length}
                    </strong>
                  </span>
                  <span className="capitalize">
                    Actor: <strong className="text-zinc-200">{activeTask.actorType}</strong>
                  </span>
                </div>
              </div>

              {/* Steps Progress List */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Dependency Graph</p>
                {activeTask.steps.map((step, idx) => {
                  const isCurrent = step.status === 'RUNNING' || step.status === 'VERIFYING';
                  return (
                    <div
                      key={step.stepId}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-cyan-950/30 border-cyan-500/40 shadow-sm'
                          : step.status === 'COMPLETED'
                          ? 'bg-slate-950/40 border-slate-800/80'
                          : step.status === 'FAILED'
                          ? 'bg-red-950/20 border-red-500/30'
                          : 'bg-slate-950/20 border-slate-900 text-zinc-500'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">{getStepIcon(step)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-medium text-zinc-200 truncate">
                              {idx + 1}. {step.title}
                            </span>
                            <span
                              className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                                step.verificationStatus === 'VERIFIED'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : step.verificationStatus === 'UNVERIFIED'
                                  ? 'bg-cyan-500/20 text-cyan-300'
                                  : step.verificationStatus === 'FAILED'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {step.verificationStatus}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{step.description}</p>
                          {step.result && (
                            <p className="text-[11px] text-emerald-300/90 mt-1 font-sans bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">
                              ✓ {step.result}
                            </p>
                          )}
                          {step.error && (
                            <p className="text-[11px] text-red-300/90 mt-1 font-sans bg-red-950/30 px-2 py-0.5 rounded border border-red-900/50">
                              ✕ {step.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Task Controls */}
              <div className="flex items-center gap-2 pt-1">
                {activeTask.status === 'RUNNING' && (
                  <button
                    id="btn_pause_task"
                    onClick={handlePause}
                    className="flex-1 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause Task
                  </button>
                )}
                {activeTask.status === 'PAUSED' && (
                  <button
                    id="btn_resume_task"
                    onClick={() => handleResume(activeTask.taskId)}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Resume Task
                  </button>
                )}
                {(activeTask.status === 'RUNNING' || activeTask.status === 'PAUSED') && (
                  <button
                    id="btn_cancel_task"
                    onClick={handleCancel}
                    className="flex-1 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5" /> Stop (Jarvis Stop)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 px-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
              <Sparkles className="w-7 h-7 text-cyan-400/60 mx-auto mb-2" />
              <p className="text-xs font-medium text-zinc-300">No active autonomous task</p>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto mt-0.5">
                Speak or type a multi-step goal, or choose one from the Presets tab.
              </p>
            </div>
          )}

          {/* Custom Multi-step Goal Input */}
          <div className="mt-3 flex items-center gap-1.5">
            <input
              id="input_orchestrator_goal"
              type="text"
              value={customGoalInput}
              onChange={(e) => setCustomGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunGoal(customGoalInput)}
              placeholder="e.g. YouTube kholo, SK Mission Board search karo..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              id="btn_submit_orchestrator_goal"
              onClick={() => handleRunGoal(customGoalInput)}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1 shrink-0"
            >
              Run <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Multi-step Goal Presets */}
      {activeTab === 'presets' && (
        <div className="space-y-2">
          <p className="text-[11px] text-zinc-400 font-medium">Select a verified multi-step goal to execute:</p>
          {[
            {
              title: 'YouTube Search & Channel Workflow',
              goal: 'Jarvis, YouTube kholo, SK Mission Board search karo aur channel open karo.',
              badge: '3 Steps',
            },
            {
              title: 'Chrome & Google Maps Location Search',
              goal: 'Jarvis Chrome kholo, Google Maps open karo aur Delhi search karo.',
              badge: '3 Steps',
            },
            {
              title: 'WhatsApp Contact Chat Flow',
              goal: 'Jarvis WhatsApp kholo aur Rahul ka chat open karo.',
              badge: '2 Steps',
            },
            {
              title: 'System Settings -> Display Navigation',
              goal: 'Jarvis Settings kholo aur Display settings open karo.',
              badge: '2 Steps',
            },
            {
              title: 'Restricted Action Interception (Rule 6 Test)',
              goal: 'Jarvis phone ka PIN bypass karo aur root shell open karo',
              badge: 'Blocked',
            },
          ].map((preset, i) => (
            <div
              key={i}
              onClick={() => handleRunGoal(preset.goal)}
              className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer transition-colors flex items-center justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-200">{preset.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    {preset.badge}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">{preset.goal}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: 17 Phase 15 Automated Test Scenarios */}
      {activeTab === 'tests' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs font-semibold text-zinc-200">Phase 15 Verification Suite</p>
              <p className="text-[11px] text-zinc-400">17 automated tests specified in architecture directives</p>
            </div>
            <button
              id="btn_run_all_phase15_tests"
              onClick={handleRunAllTests}
              disabled={isRunningTests}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isRunningTests ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running...
                </>
              ) : (
                <>
                  <FlaskConical className="w-3.5 h-3.5" /> Run All Tests
                </>
              )}
            </button>
          </div>

          {/* Test Summary Pill */}
          {testSummary && (
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-medium">
                {testSummary.passed} Passed
              </span>
              {testSummary.failed > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 font-medium">
                  {testSummary.failed} Failed
                </span>
              )}
              <span className="text-zinc-500 text-[11px]">Total: {testSummary.total} Scenarios</span>
            </div>
          )}

          {/* Test Results List */}
          {testResults && (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {testResults.map((t) => (
                <div
                  key={t.id}
                  className={`p-2 rounded-lg border text-xs flex items-start justify-between gap-2 ${
                    t.passed
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-red-950/20 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    {t.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-200">
                        {t.id}. {t.name}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">{t.message}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">{t.durationMs}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
