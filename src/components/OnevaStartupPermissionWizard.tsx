/**
 * ONEVA Startup Permission Wizard & Master "Grant All" Modal
 * 
 * Ensures all Android & Hardware permissions are acquired upfront in a single step,
 * eliminating repetitive interruptions when applying individual customizations or JARVIS features.
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Mic,
  Camera,
  Bell,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Lock,
  Layers,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  OnevaPermissionManager,
  PermissionSnapshot,
  PermissionId,
} from '../services/onevaPermissionManager';
import { OnevaLogo } from './OnevaLogo';

interface OnevaStartupPermissionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  isSettingsMode?: boolean;
}

export const OnevaStartupPermissionWizard: React.FC<OnevaStartupPermissionWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  isSettingsMode = false,
}) => {
  const [snapshot, setSnapshot] = useState<PermissionSnapshot | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'info' | 'warning';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch initial snapshot and subscribe to live changes
    const unsubscribe = OnevaPermissionManager.subscribe((latest) => {
      setSnapshot(latest);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGrantAll = async () => {
    setIsRequesting(true);
    setFeedbackMessage({
      type: 'info',
      text: 'Requesting in-app permissions... Please tap "Allow" on system prompts.',
    });

    try {
      const res = await OnevaPermissionManager.requestAllInAppPermissions();
      if (res.runtimeGranted) {
        if (res.specialNeeded.length > 0) {
          setFeedbackMessage({
            type: 'warning',
            text: 'माइक्रोफ़ोन, कैमरा व नोटिफ़िकेशन चालू हो चुके हैं! डीप ऑटोमेशन के लिए नीचे Accessibility सेटिंग चालू करें।',
          });
        } else {
          setFeedbackMessage({
            type: 'success',
            text: 'बधाई हो! सभी अनुमतियाँ सफलतापूर्वक मिल चुकी हैं।',
          });
        }
      } else {
        setFeedbackMessage({
          type: 'warning',
          text: res.message || 'कुछ अनुमतियाँ अस्वीकार की गई थीं। कृपया आवश्यकतानुसार अनुमति दें।',
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'warning',
        text: err.message || 'Error executing permission grant.',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleGrantSingle = async (id: PermissionId) => {
    const success = await OnevaPermissionManager.requestPermission(id);
    if (!success && id === 'accessibility') {
      setFeedbackMessage({
        type: 'info',
        text: 'Opening Android Accessibility Settings... Look for "ONEVA JARVIS" and enable it.',
      });
    }
  };

  const handleProceed = () => {
    OnevaPermissionManager.markOnboardingCompleted();
    if (onComplete) onComplete();
    onClose();
  };

  const items = snapshot?.items;
  const isMicGranted = items?.microphone.status === 'granted';
  const isCamGranted = items?.camera.status === 'granted';
  const isNotifGranted = items?.notifications.status === 'granted';
  const isAccessGranted = items?.accessibility.status === 'granted';
  const isOverlayGranted = items?.overlay.status === 'granted';

  const allReady = isMicGranted && isCamGranted && isNotifGranted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-neutral-950/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-white/5 bg-gradient-to-r from-emerald-950/30 via-neutral-900/40 to-neutral-950 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <OnevaLogo variant="hero" className="w-11 h-11 border border-white/10 shadow-lg shadow-emerald-950/50" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  ONEVA System Permissions
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ONE-TIME SETUP
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                एक ही बार में सभी जरूरी अनुमतियाँ दें ताकि बार-बार रुकावट न आए।
              </p>
            </div>
          </div>

          {isSettingsMode && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Content: Permission Items */}
        <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {/* Privacy Guarantee Banner */}
          <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2.5 text-neutral-300">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-snug">
              <strong className="text-emerald-300 font-medium">Rule 6 Privacy-First:</strong> ONEVA आपका कोई भी व्यक्तिगत डेटा, आवाज़ या फ़ोटो क्लाउड पर नहीं भेजता। सभी कमांड्स केवल फ़ोन पर ही प्रोसेस होती हैं।
            </span>
          </div>

          {/* Feedback message banner if any */}
          {feedbackMessage && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 transition animate-in fade-in ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                  : feedbackMessage.type === 'warning'
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                  : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
              }`}
            >
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="flex-1">{feedbackMessage.text}</span>
            </div>
          )}

          {/* List of Permissions */}
          <div className="space-y-2.5">
            {/* 1. Microphone */}
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isMicGranted
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-neutral-300'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span>JARVIS Voice Core</span>
                    <span className="text-[10px] text-neutral-400 font-normal">(माइक्रोफ़ोन)</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    JARVIS से बात करने, वेक-वर्ड ("Jarvis") और वॉइस कमांड्स के लिए।
                  </p>
                </div>
              </div>

              {isMicGranted ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> चालू है
                </span>
              ) : (
                <button
                  onClick={() => handleGrantSingle('microphone')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-[11px] font-medium transition cursor-pointer shrink-0"
                >
                  अनुमति दें
                </button>
              )}
            </div>

            {/* 2. Camera */}
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isCamGranted
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-neutral-300'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span>Hand Gesture &amp; Vision</span>
                    <span className="text-[10px] text-neutral-400 font-normal">(कैमरा)</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    बिना स्क्रीन छुए हवा में हाथ के इशारों (Swipe, Pinch) से फ़ोन कंट्रोल करने के लिए।
                  </p>
                </div>
              </div>

              {isCamGranted ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> चालू है
                </span>
              ) : (
                <button
                  onClick={() => handleGrantSingle('camera')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-[11px] font-medium transition cursor-pointer shrink-0"
                >
                  अनुमति दें
                </button>
              )}
            </div>

            {/* 3. Notifications */}
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isNotifGranted
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-neutral-300'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span>Task Alerts &amp; Pulse</span>
                    <span className="text-[10px] text-neutral-400 font-normal">(नोटिफ़िकेशन)</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    JARVIS बैकग्राउंड टास्क पूरा होने पर अलर्ट और Edge Glow पल्स के लिए।
                  </p>
                </div>
              </div>

              {isNotifGranted ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> चालू है
                </span>
              ) : (
                <button
                  onClick={() => handleGrantSingle('notifications')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-[11px] font-medium transition cursor-pointer shrink-0"
                >
                  अनुमति दें
                </button>
              )}
            </div>

            {/* 4. Accessibility Service */}
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isAccessGranted
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span>Deep In-App Automation</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      Special Access
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    WhatsApp में मैसेज टाइप/सेंड, YouTube में सर्च प्ले और बटन ऑटोमेशन के लिए।
                  </p>
                </div>
              </div>

              {isAccessGranted ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> चालू है
                </span>
              ) : (
                <button
                  onClick={() => handleGrantSingle('accessibility')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 text-[11px] font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>Settings खोलें</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 5. Display Over Apps (Overlay) */}
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isOverlayGranted
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-neutral-400'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span>Display Over Other Apps</span>
                    <span className="text-[10px] text-neutral-400 font-normal">(Edge Glow)</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    अन्य ऐप्स इस्तेमाल करते समय किनारे पर Edge Glow रोशनी और JARVIS HUD दिखाने के लिए।
                  </p>
                </div>
              </div>

              {isOverlayGranted ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> चालू है
                </span>
              ) : (
                <button
                  onClick={() => handleGrantSingle('overlay')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-[11px] font-medium transition cursor-pointer shrink-0"
                >
                  अनुमति दें
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Master Action Bar */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleProceed}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-medium border border-white/10 transition cursor-pointer order-2 sm:order-1"
          >
            {allReady ? 'आगे बढ़ें (Continue)' : 'बाद में करें (Skip for now)'}
          </button>

          {/* Primary "Grant All Permissions" Button */}
          <button
            onClick={handleGrantAll}
            disabled={isRequesting}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xl cursor-pointer order-1 sm:order-2 ${
              allReady
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 shadow-emerald-900/40'
            }`}
          >
            {isRequesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-current" />
                <span>Granting All In-App Permissions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-current" />
                <span>Grant All Permissions (सभी अनुमतियाँ एक साथ चालू करें)</span>
                <ArrowRight className="w-4 h-4 text-current" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
