/**
 * ONEVA Phase 20: Jarvis Task Notification Toast
 * 
 * Non-intrusive in-app notification when a background task completes while
 * the Work Panel is closed. Tapping the toast opens the Work Panel with the
 * completed result.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, ChevronRight, Sparkles } from 'lucide-react';
import { JarvisWorkTaskManager } from '../../services/intelligence/jarvisWorkTaskManager';
import { JarvisWorkPanelNotification } from '../../types/jarvisWorkPanel';

export const JarvisTaskNotificationToast: React.FC = () => {
  const [notification, setNotification] = useState<JarvisWorkPanelNotification | null>(
    JarvisWorkTaskManager.getState().notification
  );

  useEffect(() => {
    const unsub = JarvisWorkTaskManager.subscribe((state) => {
      setNotification(state.notification);
    });
    return () => unsub();
  }, []);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      JarvisWorkTaskManager.clearNotification();
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification?.id]);

  if (!notification) return null;

  const handleOpen = () => {
    JarvisWorkTaskManager.openPanel(notification.taskId);
    JarvisWorkTaskManager.clearNotification();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    JarvisWorkTaskManager.clearNotification();
  };

  return (
    <div
      onClick={handleOpen}
      className="absolute top-12 inset-x-3 z-50 p-3 rounded-2xl bg-neutral-900/98 hover:bg-neutral-800 border border-emerald-500/40 shadow-2xl backdrop-blur-2xl flex items-center justify-between cursor-pointer transition select-none animate-in slide-in-from-top duration-300 group"
      title="Tap to view completed result"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{notification.title}</span>
          </div>
          <div className="text-xs font-semibold text-white truncate max-w-[210px] sm:max-w-[260px]">
            {notification.message}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-mono text-emerald-300 group-hover:underline flex items-center">
          Open <ChevronRight className="w-3 h-3 ml-0.5" />
        </span>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
