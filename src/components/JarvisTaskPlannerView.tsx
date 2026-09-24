/**
 * ONEVA Phase 11: Jarvis Task Planner & Intelligence View
 * 
 * Interactive visualizer displaying real-time NLU intent breakdown,
 * extracted entities, dependency-ordered task steps, capability requirements,
 * execution handoff status, interactive clarification, and one-click test cases.
 */

import { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  GitFork,
  Send,
  Trash2,
  Activity,
  Terminal,
} from 'lucide-react';
import { JarvisTaskPlan, JarvisTaskStatus, JarvisShortLivedContext } from '../types/jarvisIntelligence';
import { JarvisTaskPlanner } from '../services/intelligence/jarvisTaskPlanner';
import { JarvisContextService } from '../services/intelligence/jarvisContextService';
import { JarvisVoiceService } from '../services/jarvisVoiceService';

export function JarvisTaskPlannerView() {
  const [activePlan, setActivePlan] = useState<JarvisTaskPlan | null>(JarvisTaskPlanner.getActivePlan());
  const [context, setContext] = useState<JarvisShortLivedContext | null>(JarvisContextService.getContext());
  const [clarificationInput, setClarificationInput] = useState('');
  const [simulateInput, setSimulateInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // Listen to planner events
    const unsubTask = JarvisTaskPlanner.onTaskEvent((event) => {
      setActivePlan(event.plan || JarvisTaskPlanner.getActivePlan());
    });

    // Listen to context updates
    const unsubContext = JarvisContextService.subscribe(() => {
      setContext(JarvisContextService.getContext());
    });

    // Listen to command events from JarvisVoiceService
    const unsubCmd = JarvisVoiceService.onCommand((cmd) => {
      if (cmd.plan) {
        setActivePlan(cmd.plan);
      }
    });

    return () => {
      unsubTask();
      unsubContext();
      unsubCmd();
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleRunCommand = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setSimulateInput('');
    try {
      await JarvisVoiceService.processCommand(text.trim());
      showToast(`Analyzed: "${text.slice(0, 32)}..."`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClarifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan || !clarificationInput.trim()) return;

    const updated = JarvisTaskPlanner.provideClarification(activePlan.taskId, clarificationInput.trim());
    if (updated) {
      setActivePlan({ ...updated });
      setClarificationInput('');
      showToast('Clarification accepted! Plan updated.');
    }
  };

  const handleClearContext = () => {
    JarvisContextService.clearContext();
    showToast('Ephemeral conversational context cleared.');
  };

  const getStatusBadge = (status: JarvisTaskStatus) => {
    switch (status) {
      case 'READY':
        return {
          label: 'Ready for Execution Handoff',
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'WAITING_FOR_INPUT':
        return {
          label: 'Needs Clarification',
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'PLANNING':
        return {
          label: 'Planning Steps...',
          bg: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
          icon: <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />,
        };
      case 'FAILED':
        return {
          label: 'Unsupported / Out of Scope',
          bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
        };
      default:
        return {
          label: status,
          bg: 'bg-neutral-800 text-neutral-300 border-white/10',
          icon: <Activity className="w-3.5 h-3.5 text-neutral-400" />,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900/95 border border-sky-500/30 shadow-2xl px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-xs text-neutral-200 font-medium">{toast}</span>
        </div>
      )}

      {/* Main Intelligence & Planner Header */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-sky-500/10 border border-sky-500/30 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                  Jarvis Intelligence & Task Planner
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-mono border border-sky-500/20">
                  Phase 11
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                On-device NLU intent classification, entity extraction, dependency graphs, and short-lived conversational context.
              </p>
            </div>
          </div>

          {context?.activeTopic && (
            <div className="flex items-center gap-2 bg-neutral-950/80 border border-white/5 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-neutral-500 font-mono text-[11px]">Context:</span>
              <span className="text-sky-300 font-medium truncate max-w-[140px]">{context.activeTopic}</span>
              <button
                type="button"
                onClick={handleClearContext}
                title="Clear conversational context"
                className="p-1 hover:text-rose-400 text-neutral-500 transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Input Bar for Testing Any Prompt */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunCommand(simulateInput);
          }}
          className="relative"
        >
          <input
            type="text"
            value={simulateInput}
            onChange={(e) => setSimulateInput(e.target.value)}
            placeholder="Type any natural command (e.g. 'YouTube kholo', 'Find a free 3D tree model for my game', 'Flashlight on karo')..."
            className="w-full bg-neutral-950/80 border border-white/10 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 pr-24 font-mono transition"
          />
          <button
            type="submit"
            disabled={isProcessing || !simulateInput.trim()}
            className="absolute right-2 top-2 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-neutral-950 text-xs font-semibold font-mono flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Analyze</span>
            <Send className="w-3 h-3" />
          </button>
        </form>

        {/* 11 Scenario Verification Quick Tests */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              Phase 11 Natural-Language Test Suite (One-Click)
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">11 Scenarios</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {[
              { label: '1. Simple App', cmd: 'Open YouTube', note: 'Single-step launch' },
              { label: '2. Hinglish App', cmd: 'YouTube kholo', note: 'Localized intent' },
              { label: '3. Multi-Step App', cmd: 'Open YouTube and search for cricket highlights and play first result', note: '3 dependent steps' },
              { label: '4. Research Asset', cmd: 'Find a free 3D tree model for my game', note: '7-step pipeline' },
              { label: '5. Follow-Up Constraint', cmd: 'Only free ones', note: 'Context refinement' },
              { label: '6. Follow-Up Item', cmd: 'Show me the second one', note: 'Context index' },
              { label: '7. Target Contact', cmd: 'WhatsApp me Rahul ka chat kholo', note: 'Entity extraction' },
              { label: '8. Clarification Needed', cmd: 'Make me a map', note: 'Ambiguity detection' },
              { label: '9. Device Toggle', cmd: 'Flashlight on karo', note: 'Hardware control' },
              { label: '10. Unsupported Task', cmd: 'Bake me a pizza', note: 'Safety boundary' },
              { label: '11. Conversation', cmd: 'Hey Jarvis, how are you today?', note: 'Casual dialogue' },
            ].map((test, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleRunCommand(test.cmd)}
                className="p-2.5 rounded-xl bg-neutral-950/40 hover:bg-neutral-950/80 border border-white/5 hover:border-sky-500/30 text-left transition group cursor-pointer space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-300 group-hover:text-white truncate">
                    {test.label}
                  </span>
                  <ArrowRight className="w-3 h-3 text-neutral-600 group-hover:text-sky-400 shrink-0 transition" />
                </div>
                <p className="text-[10px] text-neutral-500 truncate font-mono">{test.cmd}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Plan Detail View */}
      {activePlan ? (
        <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-6">
          {/* Status & Intent Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const badge = getStatusBadge(activePlan.status);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${badge.bg}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  );
                })()}

                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-mono">
                  Intent: {activePlan.intent.intentType}
                </span>

                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px] font-mono">
                  Complexity: {activePlan.intent.complexity}
                </span>

                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[11px] font-mono">
                  Lang: {activePlan.intent.detectedLanguage.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-neutral-400 font-mono">Input:</span>
                <span className="text-xs font-medium text-white font-mono">"{activePlan.originalRequest}"</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-neutral-500 block">TASK ID: {activePlan.taskId}</span>
              <span className="text-[10px] font-mono text-sky-400">Priority: {activePlan.priority}</span>
            </div>
          </div>

          {/* Clarification Box if WAITING_FOR_INPUT */}
          {activePlan.status === 'WAITING_FOR_INPUT' && activePlan.clarification && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-200">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Clarification Required from User</span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                {activePlan.clarification.question}
              </p>

              <form onSubmit={handleClarifySubmit} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={clarificationInput}
                  onChange={(e) => setClarificationInput(e.target.value)}
                  placeholder="Specify details (e.g. 'GPS navigation map for Delhi' or 'Fantasy RPG game map')..."
                  className="flex-1 bg-neutral-950 border border-amber-500/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  type="submit"
                  disabled={!clarificationInput.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-semibold text-xs font-mono transition cursor-pointer"
                >
                  Clarify
                </button>
              </form>
            </div>
          )}

          {/* Extracted Entities Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
              Extracted Structured Entities
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(activePlan.intent.entities).length > 0 ? (
                Object.entries(activePlan.intent.entities).map(([k, v]) => (
                  <div
                    key={k}
                    className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-white/5 flex items-center gap-2 text-xs font-mono"
                  >
                    <span className="text-neutral-500">{k}:</span>
                    <span className="text-sky-300 font-medium">
                      {Array.isArray(v) ? v.join(', ') : String(v)}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-neutral-500 font-mono italic">
                  No specialized entity constraints extracted.
                </span>
              )}
            </div>
          </div>

          {/* Ordered Task Steps with Dependencies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-white">
                  Ordered Task Execution Plan ({activePlan.steps.length} steps)
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">
                Dependencies Verified
              </span>
            </div>

            <div className="space-y-2.5">
              {activePlan.steps.map((step) => (
                <div
                  key={step.id}
                  className="p-3.5 rounded-2xl bg-neutral-950/70 border border-white/5 space-y-2 hover:border-white/10 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-neutral-800 border border-white/10 text-neutral-300 flex items-center justify-center text-xs font-mono shrink-0">
                        {step.order}
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          {step.title}
                        </span>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase shrink-0 ${
                        step.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : step.status === 'RUNNING'
                          ? 'bg-sky-500/10 text-sky-400 animate-pulse'
                          : step.status === 'FAILED'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-[10px] font-mono flex-wrap">
                    {/* Capability badge */}
                    {step.capabilityRequired !== 'none' && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        Capability: {step.capabilityRequired}
                      </span>
                    )}

                    {/* Dependencies */}
                    {step.dependencies.length > 0 ? (
                      <div className="flex items-center gap-1 text-neutral-500">
                        <GitFork className="w-3 h-3 text-neutral-600" />
                        <span>Depends on: {step.dependencies.join(', ')}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-600">No prerequisites (Initial step)</span>
                    )}

                    {step.result && (
                      <span className="text-emerald-400/90 ml-auto truncate max-w-xs">
                        &rarr; {step.result}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Handoff Section */}
          {activePlan.executionHandoff && (
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-neutral-400">
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  <span className="uppercase text-[10px] tracking-wider text-neutral-400">
                    Execution Handoff Target
                  </span>
                </div>
                <span className="text-sky-300 font-semibold text-sm">
                  {activePlan.executionHandoff.targetPhase}
                </span>
                <p className="text-[11px] text-neutral-500">
                  Required: [{activePlan.executionHandoff.requiredCapabilities.join(', ') || 'none'}]
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-neutral-500 block">
                  Confirmation: {activePlan.executionHandoff.confirmationState}
                </span>
                <span className="text-[10px] text-emerald-400">
                  {activePlan.executionHandoff.targetPhase === 'PHASE_13_ANDROID_ACTIONS'
                    ? 'Status: Dispatched via Android Action Dispatcher (Phase 13)'
                    : activePlan.executionHandoff.targetPhase === 'PHASE_12_SEARCH'
                    ? 'Status: Dispatched via Web Intelligence Engine (Phase 12)'
                    : 'Status: Plan Structured (Execution reserved for later phases)'}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-neutral-900/40 border border-white/5 text-center space-y-3">
          <BrainCircuit className="w-8 h-8 text-neutral-600 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-300 font-mono">
            No Active Task Plan
          </h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Speak into the microphone or click any scenario above to view real-time natural language understanding and task planning.
          </p>
        </div>
      )}
    </div>
  );
}
