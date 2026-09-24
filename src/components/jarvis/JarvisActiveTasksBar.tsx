/**
 * ONEVA Phase 20: Jarvis Active Tasks Bar / Floating Chip
 * 
 * Sits unobtrusively on the launcher / phone interface when long-running
 * background tasks are in progress or completed, allowing the user to reopen
 * the live Work Panel at any time with a single tap.
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, CheckCircle2, RotateCw, WifiOff } from 'lucide-react';
import { JarvisWorkTaskManager } from '../../services/intelligence/jarvisWorkTaskManager';
import { JarvisWorkPanelState } from '../../types/jarvisWorkPanel';

export const JarvisActiveTasksBar: React.FC = () => {
  const [panelState, setPanelState] = useState<JarvisWorkPanelState>(
    JarvisWorkTaskManager.getState()
  );

  useEffect(() => {
    const unsub = JarvisWorkTaskManager.subscribe((state) => {
      setPanelState(state);
    });
    return () => unsub();
  }, []);

  // Do not show if the panel is already open or there are no active tasks
  if (panelState.isOpen || panelState.activeTasks.length === 0) {
    return null;
  }

  const primaryTask = panelState.activeTasks[0];

  return (
    <div
      onClick={() => JarvisWorkTaskManager.openPanel(primaryTask.taskId)}
      className="absolute top-12 inset-x-3 z-30 px-3.5 py-2 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/95 border border-emerald-500/30 backdrop-blur-xl shadow-lg flex items-center justify-between cursor-pointer transition active:scale-[0.98] group select-none animate-in slide-in-from-top-2 duration-200"
      title="Tap to open JARVIS Work Panel"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
              JARVIS WORK
            </span>
            <span className="text-[9px] font-mono text-neutral-400">&bull;</span>
            <span className="text-[9px] font-mono text-neutral-300 truncate">
              {primaryTask.status === 'RUNNING' && '● Running'}
              {primaryTask.status === 'PAUSED_NETWORK' && '⚠ Paused'}
              {primaryTask.status === 'RETRYING' && '⟳ Retrying'}
            </span>
          </div>
          <div className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-[240px]">
            {primaryTask.title}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-neutral-400 group-hover:text-emerald-300 transition shrink-0 font-mono text-[10px]">
        <span>View</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
