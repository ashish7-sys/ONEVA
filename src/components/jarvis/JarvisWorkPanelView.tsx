/**
 * ONEVA Phase 20: Jarvis Work Panel & Background Tasks View (Assist Page Integration)
 * 
 * Provides an administrative and diagnostic view of active and completed
 * background tasks, task creation, result inspection, and true cancellation.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Square,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
  Search,
  Layers,
  ArrowUpRight,
  WifiOff,
} from 'lucide-react';
import { JarvisWorkTaskManager } from '../../services/intelligence/jarvisWorkTaskManager';
import { JarvisLongRunningDetector } from '../../services/intelligence/jarvisLongRunningDetector';
import { JarvisWorkTask, JarvisWorkPanelState } from '../../types/jarvisWorkPanel';

export const JarvisWorkPanelView: React.FC = () => {
  const [panelState, setPanelState] = useState<JarvisWorkPanelState>(
    JarvisWorkTaskManager.getState()
  );
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedTask, setSelectedTask] = useState<JarvisWorkTask | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = JarvisWorkTaskManager.subscribe((state) => {
      setPanelState(state);
      if (selectedTask) {
        const updated = state.allTasks.find((t) => t.taskId === selectedTask.taskId);
        if (updated) setSelectedTask(updated);
      }
    });
    return () => unsub();
  }, [selectedTask?.taskId]);

  const handleLaunchTask = async (text: string) => {
    if (!text.trim()) return;
    const task = await JarvisWorkTaskManager.createAndStartTask(text.trim());
    setSelectedTask(task);
    setInputPrompt('');
  };

  const handleCopyResult = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tasks = panelState.allTasks;

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PHASE 20: JARVIS WORK PANEL</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Autonomous Work Panel &amp; Background Continuation
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Supervises long-running AI operations (web research, asset generation, project generation, and complex analysis) with independent Stop and Close controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-300">
            Active Tasks: <span className="font-bold text-emerald-400">{panelState.activeTasks.length}</span>
          </div>
        </div>
      </div>

      {/* Task Creation & Prompt Launcher */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Launch long-running task (e.g. 'Research the latest Android APIs')..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLaunchTask(inputPrompt);
            }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 font-sans"
          />
          <button
            onClick={() => handleLaunchTask(inputPrompt)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Work</span>
          </button>
        </div>

        {/* Quick Launch Pre-set Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
          <span className="text-[10px] font-mono text-neutral-500 uppercase shrink-0">Presets:</span>
          {[
            'Research the latest Android APIs',
            'Create a complete game design',
            'Generate assets for my project',
            'Analyze this large document',
            'Research and compare these technologies',
          ].map((chip) => (
            <button
              key={chip}
              onClick={() => handleLaunchTask(chip)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-mono text-neutral-300 transition shrink-0 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Task List & Selected Task Detail Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        {/* Task List Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 uppercase tracking-wider px-1">
            <span>Task History ({tasks.length})</span>
            <span>Status</span>
          </div>

          {tasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-950/40 border border-white/5 text-center text-xs text-neutral-500 font-mono">
              No work panel tasks logged. Launch a task above or via the phone launcher.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin pr-1">
              {tasks.map((task) => {
                const isSelected = selectedTask?.taskId === task.taskId;
                return (
                  <div
                    key={task.taskId}
                    onClick={() => setSelectedTask(task)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-neutral-900 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                        : 'bg-neutral-950/40 hover:bg-neutral-900/60 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">
                        {task.taskType.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {task.status === 'RUNNING' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Running
                          </span>
                        )}
                        {task.status === 'COMPLETED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-400 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Done
                          </span>
                        )}
                        {task.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                            <Square className="w-2.5 h-2.5 fill-current" />
                            Stopped
                          </span>
                        )}
                        {task.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-rose-400">
                            <AlertCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                        {task.status === 'PAUSED_NETWORK' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400">
                            <WifiOff className="w-3 h-3" />
                            Network
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-bold text-white truncate mb-1">{task.title}</div>
                    <div className="text-[11px] text-neutral-400 font-mono truncate">
                      {task.stageDescription}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Task Inspection View (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTask ? (
            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">
                      {selectedTask.taskType}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      &bull; ID: {selectedTask.taskId}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">{selectedTask.title}</h3>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-2">
                  {selectedTask.status === 'RUNNING' && (
                    <button
                      onClick={() => JarvisWorkTaskManager.stopTask(selectedTask.taskId)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold hover:bg-rose-500/30 transition cursor-pointer flex items-center gap-1.5"
                      title="Stop and abort task"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>STOP</span>
                    </button>
                  )}

                  {(selectedTask.status === 'FAILED' || selectedTask.status === 'PAUSED_NETWORK') && (
                    <button
                      onClick={() => JarvisWorkTaskManager.retryTask(selectedTask.taskId)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold hover:bg-cyan-500/30 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>RETRY</span>
                    </button>
                  )}

                  <button
                    onClick={() => JarvisWorkTaskManager.openPanel(selectedTask.taskId)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-white border border-white/20 text-xs font-mono font-semibold hover:bg-white/15 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Open in Mobile Panel</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Progress & Stage Details */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-400">Current Stage:</span>
                  <span className="text-emerald-400 font-bold">{selectedTask.currentStage}</span>
                </div>
                <div className="text-xs text-neutral-300 font-mono">
                  {selectedTask.stageDescription}
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden mt-1">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${selectedTask.progressPercent || 25}%` }}
                  />
                </div>
              </div>

              {/* Result Content */}
              {selectedTask.result && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 uppercase font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Generated Output
                    </span>
                    <button
                      onClick={() =>
                        handleCopyResult(selectedTask.result!.mainContent, selectedTask.taskId)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-neutral-300 transition cursor-pointer"
                    >
                      {copiedId === selectedTask.taskId ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === selectedTask.taskId ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 text-xs text-neutral-200 whitespace-pre-wrap font-mono leading-relaxed max-h-56 overflow-y-auto">
                    {selectedTask.result.mainContent}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-neutral-950/40 border border-white/5 text-center text-xs text-neutral-500 font-mono flex flex-col items-center justify-center h-full">
              <Sparkles className="w-6 h-6 text-neutral-600 mb-2" />
              <span>Select a task on the left to inspect its live stage and output.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
