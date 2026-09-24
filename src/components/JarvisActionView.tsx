/**
 * ONEVA Phase 13: Jarvis Tools & Android Actions Visual Component
 * 
 * Provides real-time action dispatch monitoring, verified result feedback,
 * tool registry inspector, in-session state verifier, and one-click Phase 13 tests.
 */

import { useState, useEffect } from 'react';
import {
  Smartphone,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import {
  JarvisActionResult,
  JarvisActionExecutionStatus,
  JarvisToolDefinition,
} from '../types/jarvisActions';
import { ActionDispatcher } from '../services/actions/actionDispatcher';
import { JarvisToolRegistry } from '../services/actions/jarvisToolRegistry';
import { JarvisActionSelector } from '../services/actions/jarvisActionSelector';

export function JarvisActionView() {
  const [lastResult, setLastResult] = useState<JarvisActionResult | null>(null);
  const [sessionState, setSessionState] = useState(ActionDispatcher.getSessionState());
  const [tools, setTools] = useState<JarvisToolDefinition[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | undefined>();
  const [customInput, setCustomInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    JarvisToolRegistry.init();
    setTools(JarvisToolRegistry.getAllTools());

    const unsubResult = ActionDispatcher.subscribe((result) => {
      setLastResult(result);
      setSessionState(ActionDispatcher.getSessionState());
    });

    const unsubExec = ActionDispatcher.subscribeExecutionState((state) => {
      setIsExecuting(state.isExecuting);
      setCurrentStep(state.currentStep);
    });

    return () => {
      unsubResult();
      unsubExec();
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleExecutePrompt = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsExecuting(true);
    setCustomInput('');

    try {
      const result = await JarvisActionSelector.selectAndExecute(promptText.trim());
      if (result) {
        setLastResult(result);
        setSessionState(ActionDispatcher.getSessionState());
        showToast(result.userMessage);
      } else {
        showToast(`No direct device action detected for: "${promptText.slice(0, 24)}"`);
      }
    } catch (err: any) {
      showToast(`Action error: ${err?.message || 'Execution failed'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusBadge = (status: JarvisActionExecutionStatus) => {
    switch (status) {
      case 'EXECUTED':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: 'Completed / Executed',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'EXECUTING':
      case 'VALIDATING':
        return {
          icon: <Activity className="w-4 h-4 text-sky-400 animate-spin" />,
          label: 'Processing Action...',
          color: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        };
      case 'PERMISSION_REQUIRED':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
          label: 'Permission Required',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      case 'CONFIRMATION_REQUIRED':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: 'Confirmation Needed',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      case 'UNSUPPORTED':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          label: 'Unsupported by Device',
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        };
      case 'FAILED':
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          label: 'Execution Failed',
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
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

      {/* Main Container */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                  Jarvis Tools &amp; Android Actions
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                  Phase 13
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Centralized Tool Registry, Android Action Dispatcher, App Resolution, and Verified Native Outcomes.
              </p>
            </div>
          </div>

          {sessionState.lastExecutedAt && (
            <div className="flex items-center gap-2 bg-neutral-950/80 border border-white/5 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-neutral-500">In-Session:</span>
              <span className="text-emerald-400 font-medium truncate max-w-[120px]">
                {sessionState.lastTargetApp || sessionState.lastToolId}
              </span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecutePrompt(customInput);
          }}
          className="relative"
        >
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Test an Android action (e.g. 'Open YouTube', 'YouTube kholo', 'Themes kholo', 'Open google.com')..."
            className="w-full bg-neutral-950/80 border border-white/10 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 pr-24 font-mono transition"
          />
          <button
            type="submit"
            disabled={isExecuting || !customInput.trim()}
            className="absolute right-2 top-2 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 text-xs font-semibold font-mono flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Execute</span>
            <Play className="w-3 h-3 fill-current" />
          </button>
        </form>

        {/* Phase 13 One-Click Test Suite */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              Phase 13 Action Verification Test Suite
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">9 Core Scenarios</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              { label: 'Test 1: Open YouTube', cmd: 'Open YouTube', desc: 'Direct installed app launch' },
              { label: 'Test 2: YouTube kholo', cmd: 'YouTube kholo', desc: 'Hindi/Hinglish action command' },
              { label: 'Test 3: YT open kar do', cmd: 'YT open kar do', desc: 'Colloquial abbreviation alias' },
              { label: 'Test 4: Non-Existent App', cmd: 'Open FakeTestAppXYZ', desc: 'Honest not-installed check (no fake success)' },
              { label: 'Test 5: Open Website', cmd: 'Open google.com', desc: 'Sanitized HTTP/HTTPS browser launch' },
              { label: 'Test 6: ONEVA Section', cmd: 'Themes kholo', desc: 'Programmatic ONEVA NavigationBus' },
              { label: 'Test 7: Screenshot Check', cmd: 'Take screenshot', desc: 'Screen capture capability check' },
              { label: 'Test 8: Follow-Up State', cmd: 'Did you open it?', desc: 'Temporary in-session memory query' },
              { label: 'Test 9: Restricted Action', cmd: 'Delete system files', desc: 'Rule 6 security boundary enforcement' },
            ].map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleExecutePrompt(t.cmd)}
                className="p-3 rounded-xl bg-neutral-950/40 hover:bg-neutral-950/80 border border-white/5 hover:border-emerald-500/30 text-left transition group cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-200 group-hover:text-emerald-300">
                    {t.label}
                  </span>
                  <Play className="w-3 h-3 text-neutral-600 group-hover:text-emerald-400 shrink-0 transition" />
                </div>
                <p className="text-[11px] text-sky-400/90 font-mono truncate">"{t.cmd}"</p>
                <p className="text-[10px] text-neutral-500 truncate">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Real-Time Action Feedback Card */}
        {isExecuting && (
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-3 animate-pulse">
            <Activity className="w-4 h-4 text-sky-400 animate-spin" />
            <span className="text-xs text-sky-300 font-mono font-medium">
              {currentStep || 'Validating and executing action...'}
            </span>
          </div>
        )}

        {lastResult && (
          <div className="p-5 rounded-2xl bg-neutral-950/80 border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Last Action Result:
                </span>
                <span className="text-xs font-mono font-semibold text-white px-2 py-0.5 rounded bg-white/5">
                  {lastResult.toolId}
                </span>
              </div>

              {(() => {
                const badge = getStatusBadge(lastResult.status);
                return (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${badge.color}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                );
              })()}
            </div>

            {/* Jarvis Spoken Response */}
            <div className="p-3.5 rounded-xl bg-neutral-900 border border-white/5 space-y-1">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">Jarvis Response:</span>
              <p className="text-sm font-medium text-emerald-300">
                "{lastResult.userMessage}"
              </p>
            </div>

            {lastResult.technicalDetails && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                <span>Verification: {lastResult.technicalDetails}</span>
              </div>
            )}
          </div>
        )}

        {/* Registered Tools Explorer */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-400" />
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
                Verified Registered Tools ({tools.length})
              </h4>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Allowlist Enforced</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {tools.map((t) => (
              <div
                key={t.toolId}
                className="p-3 rounded-xl bg-neutral-950/40 border border-white/5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-neutral-300 truncate">
                    {t.toolId}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                      t.riskLevel === 'LOW'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : t.riskLevel === 'MEDIUM'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {t.riskLevel}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  {t.userFacingDescription}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500">
                  <span className="capitalize">{t.category.replace('_', ' ')}</span>
                  {t.paramSchemas.length > 0 && (
                    <span>&bull; args: [{t.paramSchemas.map((p) => p.name).join(', ')}]</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
