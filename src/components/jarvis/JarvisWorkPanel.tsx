/**
 * ONEVA Phase 20: Jarvis Work Panel Component
 * 
 * Mobile-first, premium live work panel for long-running AI operations
 * (Web research, asset generation, project blueprints, complex analysis).
 * 
 * Top Left: STOP button (True task cancellation with AbortController)
 * Top Right: CLOSE button (Hides panel, keeps task running in background)
 * Center: Live stage progress, operation description, elapsed time, and results.
 */

import React, { useState, useEffect } from 'react';
import {
  Square,
  X,
  Sparkles,
  Wifi,
  WifiOff,
  Clock,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
  ChevronRight,
  Layers,
  Search,
  Cpu,
} from 'lucide-react';
import { JarvisWorkTaskManager } from '../../services/intelligence/jarvisWorkTaskManager';
import { JarvisWorkTask, JarvisWorkPanelState, JarvisTaskStage } from '../../types/jarvisWorkPanel';

export const JarvisWorkPanel: React.FC = () => {
  const [panelState, setPanelState] = useState<JarvisWorkPanelState>(
    JarvisWorkTaskManager.getState()
  );
  const [copied, setCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const unsub = JarvisWorkTaskManager.subscribe((state) => {
      setPanelState(state);
    });
    return () => unsub();
  }, []);

  const activeTask: JarvisWorkTask | undefined =
    panelState.focusedTaskId
      ? panelState.allTasks.find((t) => t.taskId === panelState.focusedTaskId)
      : panelState.activeTasks[0] || panelState.allTasks[0];

  // Live elapsed time ticker
  useEffect(() => {
    if (!activeTask || activeTask.status !== 'RUNNING') {
      if (activeTask?.elapsedMs) {
        setElapsedSeconds(Math.floor(activeTask.elapsedMs / 1000));
      }
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const sec = Math.floor((now - activeTask.startedAt) / 1000);
      setElapsedSeconds(sec);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTask?.taskId, activeTask?.status, activeTask?.startedAt]);

  if (!panelState.isOpen || !activeTask) {
    return null;
  }

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    JarvisWorkTaskManager.stopTask(activeTask.taskId);
  };

  const handleClose = () => {
    JarvisWorkTaskManager.closePanel();
  };

  const handleRetry = () => {
    JarvisWorkTaskManager.retryTask(activeTask.taskId);
  };

  const handleCopyResult = () => {
    if (activeTask.result?.mainContent) {
      navigator.clipboard.writeText(activeTask.result.mainContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isTerminal =
    activeTask.status === 'COMPLETED' ||
    activeTask.status === 'CANCELLED' ||
    activeTask.status === 'FAILED';

  const stagesOrder: JarvisTaskStage[] = [
    'STARTING',
    'RESEARCHING',
    'ANALYZING',
    'GENERATING',
    'VERIFYING',
    'FINALIZING',
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col text-white select-none animate-in fade-in duration-200 overflow-hidden font-sans">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-3 border-b border-white/10 bg-neutral-900/60">
        {/* Top Left: STOP Button */}
        <button
          onClick={handleStop}
          disabled={isTerminal}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
            isTerminal
              ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/50 cursor-not-allowed opacity-40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 active:scale-95'
          }`}
          title="Cancel task immediately"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>STOP</span>
        </button>

        {/* Center Pill: Mode Info */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-neutral-300">
          <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="uppercase tracking-wider">JARVIS WORK</span>
        </div>

        {/* Top Right: CLOSE Button (Background continuation) */}
        <button
          onClick={handleClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-mono text-neutral-200 border border-white/15 transition cursor-pointer"
          title="Hide panel. Task will continue in background."
        >
          <span>CLOSE</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Multiple Active Tasks Selector (if more than 1 task) */}
      {panelState.allTasks.length > 1 && (
        <div className="px-5 py-2 border-b border-white/5 bg-neutral-950/40 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-mono text-neutral-400 uppercase shrink-0">Tasks:</span>
          {panelState.allTasks.map((t) => (
            <button
              key={t.taskId}
              onClick={() => JarvisWorkTaskManager.setFocusedTaskId(t.taskId)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                t.taskId === activeTask.taskId
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-white/5 text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  t.status === 'RUNNING'
                    ? 'bg-emerald-400 animate-pulse'
                    : t.status === 'COMPLETED'
                    ? 'bg-blue-400'
                    : t.status === 'CANCELLED'
                    ? 'bg-neutral-500'
                    : 'bg-rose-400'
                }`}
              />
              <span className="max-w-[110px] truncate">{t.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
        {/* Task Title & Status Badges */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-neutral-300 uppercase">
              {activeTask.taskType.replace('_', ' ')}
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              ID: {activeTask.taskId.slice(0, 16)}...
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">{activeTask.title}</h2>
          <p className="text-xs text-neutral-400 leading-relaxed italic">
            &ldquo;{activeTask.originalPrompt}&rdquo;
          </p>
        </div>

        {/* Current State / Network Card */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeTask.status === 'RUNNING' && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-semibold">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>RUNNING</span>
                </div>
              )}
              {activeTask.status === 'PAUSED_NETWORK' && (
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono font-semibold">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>PAUSED: NETWORK</span>
                </div>
              )}
              {activeTask.status === 'RETRYING' && (
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-mono font-semibold">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>RETRYING</span>
                </div>
              )}
              {activeTask.status === 'COMPLETED' && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>COMPLETED</span>
                </div>
              )}
              {activeTask.status === 'CANCELLED' && (
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-mono font-semibold">
                  <Square className="w-3 h-3 fill-current" />
                  <span>STOPPED</span>
                </div>
              )}
              {activeTask.status === 'FAILED' && (
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-mono font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>FAILED</span>
                </div>
              )}
            </div>

            {/* Elapsed Time */}
            <div className="flex items-center gap-1 text-xs font-mono text-neutral-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatElapsed(elapsedSeconds)}</span>
            </div>
          </div>

          {/* Operation Description */}
          <div className="text-xs text-neutral-200 font-mono bg-black/40 p-2.5 rounded-xl border border-white/5">
            {activeTask.stageDescription}
          </div>

          {/* Live Progress Bar (Reliable percentage or indeterminate pulse) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-neutral-400">
              <span>Progress</span>
              <span>{activeTask.progressPercent ? `${activeTask.progressPercent}%` : activeTask.progressMessage}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
              {activeTask.status === 'RUNNING' && !activeTask.progressPercent ? (
                <div className="w-1/3 h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full animate-pulse" />
              ) : (
                <div
                  className={`h-full transition-all duration-300 ${
                    activeTask.status === 'COMPLETED'
                      ? 'bg-emerald-400'
                      : activeTask.status === 'CANCELLED'
                      ? 'bg-neutral-500'
                      : activeTask.status === 'FAILED'
                      ? 'bg-rose-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${activeTask.progressPercent || 20}%` }}
                />
              )}
            </div>
          </div>

          {/* Task Stage Pipeline Pills */}
          <div className="flex items-center gap-1 pt-1 overflow-x-auto scrollbar-none">
            {stagesOrder.map((st) => {
              const isDone = activeTask.completedStages.includes(st) || activeTask.status === 'COMPLETED';
              const isCurrent = activeTask.currentStage === st && activeTask.status === 'RUNNING';
              return (
                <div
                  key={st}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase shrink-0 transition ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isCurrent
                      ? 'bg-white/20 text-white font-bold border border-white/40 animate-pulse'
                      : 'bg-neutral-800 text-neutral-500'
                  }`}
                >
                  {st}
                </div>
              );
            })}
          </div>
        </div>

        {/* Failed / Network Paused Banner & Retry */}
        {activeTask.status === 'FAILED' && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
            <div className="text-xs text-rose-300 font-mono font-semibold">
              {activeTask.error || "Task couldn't be completed."}
            </div>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-mono font-semibold border border-rose-500/30 transition cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry Task</span>
            </button>
          </div>
        )}

        {activeTask.status === 'PAUSED_NETWORK' && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-mono font-semibold">
              <WifiOff className="w-4 h-4" />
              <span>Connection lost. Waiting for network...</span>
            </div>
            <p className="text-[11px] text-amber-200/70">
              Task state and progress have been preserved. Processing will resume automatically when connectivity is restored.
            </p>
          </div>
        )}

        {/* Completed Result View */}
        {activeTask.status === 'COMPLETED' && activeTask.result && (
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                <FileText className="w-4 h-4" />
                <span>TASK RESULT &bull; {activeTask.result.outputType.toUpperCase()}</span>
              </div>
              <button
                onClick={handleCopyResult}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-neutral-300 transition cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="text-xs text-neutral-300 bg-black/60 p-3 rounded-xl border border-white/5 whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto">
              {activeTask.result.mainContent}
            </div>

            {/* Artifacts Catalog */}
            {activeTask.result.artifacts && activeTask.result.artifacts.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Artifacts Saved to Storage:</span>
                <div className="flex flex-col gap-1">
                  {activeTask.result.artifacts.map((art) => (
                    <div
                      key={art.artifactId}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-800/80 border border-white/5 text-[11px] font-mono text-neutral-300 flex items-center justify-between"
                    >
                      <span>{art.name}</span>
                      <span className="text-emerald-400 text-[10px]">{art.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stopped State View */}
        {activeTask.status === 'CANCELLED' && (
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 text-center space-y-2">
            <div className="text-sm font-bold text-neutral-300">Task stopped.</div>
            <p className="text-xs text-neutral-500">
              Active operations and network requests were safely aborted.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3 border-t border-white/10 bg-neutral-900/40 flex items-center justify-between text-[10px] font-mono text-neutral-500">
        <span>Press CLOSE to return to phone</span>
        <span>ONEVA Privacy-First Layer</span>
      </div>
    </div>
  );
};
