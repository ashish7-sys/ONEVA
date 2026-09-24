/**
 * ONEVA Phase 21: Hand Control Floating Overlay
 * 
 * Elegant, non-intrusive HUD element indicating active Hand Control state,
 * detected gesture, confidence rating, dynamic hints, and quick camera preview toggle.
 */

import { useState, useEffect } from 'react';
import { Hand, Eye, EyeOff, X, Sparkles, Shield, AlertTriangle } from 'lucide-react';
import { HandControlService } from '../../services/intelligence/gestures/handControlService';
import { CameraStreamManager } from '../../services/intelligence/gestures/cameraStreamManager';
import { HandControlServiceState, HandGestureType } from '../../types/jarvisHandControl';

export function HandControlOverlay() {
  const [serviceState, setServiceState] = useState<HandControlServiceState>(
    HandControlService.getState()
  );
  const [showMiniPip, setShowMiniPip] = useState(false);

  useEffect(() => {
    const unsub = HandControlService.subscribe((s) => {
      setServiceState(s);
    });
    return () => {
      unsub();
    };
  }, []);

  if (!serviceState.isActive) {
    return null;
  }

  const getGestureLabel = (gesture: HandGestureType | null): string => {
    switch (gesture) {
      case 'open_palm':
        return 'Open Palm (Stop Task)';
      case 'swipe_down':
        return 'Swipe Down (Close Panel)';
      case 'swipe_right':
        return 'Swipe Right (Home)';
      case 'swipe_left':
        return 'Swipe Left (Back)';
      case 'thumbs_up':
        return 'Thumbs Up (Confirm)';
      case 'swipe_up':
        return 'Swipe Up (Work Panel)';
      case 'closed_fist':
        return 'Closed Fist (Edge Glow)';
      case 'two_finger_point':
        return 'Two Finger (System Status)';
      case 'custom_gesture':
        return 'Custom Gesture';
      default:
        return 'Waiting for hand...';
    }
  };

  return (
    <div
      id="oneva-hand-control-overlay"
      className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none select-none"
    >
      {/* Mini PiP Camera View (if toggled) */}
      {showMiniPip && (
        <div
          id="hand-control-pip-container"
          className="pointer-events-auto w-36 h-28 rounded-2xl overflow-hidden bg-black/80 backdrop-blur-md border border-cyan-500/30 shadow-2xl relative transition-all animate-in fade-in zoom-in-95"
        >
          <video
            id="hand-control-pip-video"
            ref={(el) => {
              if (el && CameraStreamManager.getVideoElement()) {
                const active = CameraStreamManager.getVideoElement();
                if (active && active.srcObject) {
                  el.srcObject = active.srcObject;
                  el.play().catch(() => {});
                }
              }
            }}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              serviceState.config.isMirrored ? 'scale-x-[-1]' : ''
            }`}
          />
          <div className="absolute top-1 left-2 text-[10px] text-cyan-400 font-mono tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </div>
        </div>
      )}

      {/* Main HUD Pill */}
      <div
        id="hand-control-hud-pill"
        className="pointer-events-auto flex items-center gap-3 px-3.5 py-2 rounded-full bg-neutral-950/85 backdrop-blur-xl border border-cyan-500/40 shadow-xl text-neutral-200 text-xs transition-all duration-200 hover:border-cyan-400"
      >
        {/* Hand Icon with Pulse */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              serviceState.activeGesture
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
          </div>
          {serviceState.activeGesture && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          )}
        </div>

        {/* Gesture State / Label */}
        <div className="flex flex-col max-w-[170px]">
          <div className="flex items-center gap-1.5 font-medium text-neutral-100 text-[11px] truncate">
            {serviceState.activeGesture ? (
              <span className="text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                {getGestureLabel(serviceState.activeGesture)}
              </span>
            ) : (
              <span className="text-neutral-400">JARVIS Hand Control</span>
            )}
          </div>
          {/* Rotating Hint */}
          {serviceState.config.showHints && serviceState.currentHint && (
            <span className="text-[10px] text-neutral-400 truncate animate-fade-in">
              {serviceState.currentHint}
            </span>
          )}
        </div>

        {/* Live Confidence Badge */}
        {serviceState.activeConfidence > 0 && (
          <div className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
            {Math.round(serviceState.activeConfidence * 100)}%
          </div>
        )}

        {/* Cooldown Ring */}
        {serviceState.isInCooldown && (
          <div
            className="w-2.5 h-2.5 rounded-full bg-amber-400/80 animate-pulse"
            title="Debounce active"
          />
        )}

        {/* Toggle PiP View */}
        <button
          id="hand-control-toggle-pip-btn"
          type="button"
          onClick={() => setShowMiniPip(!showMiniPip)}
          className="p-1 rounded-full text-neutral-400 hover:text-cyan-300 hover:bg-neutral-800/80 transition-colors"
          title={showMiniPip ? 'Hide camera thumbnail' : 'Show camera thumbnail'}
        >
          {showMiniPip ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        {/* Quick Close Button */}
        <button
          id="hand-control-close-btn"
          type="button"
          onClick={() => HandControlService.disableHandControl()}
          className="p-1 rounded-full text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
          title="Stop Hand Control"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
