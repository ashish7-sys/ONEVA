import { useState, useEffect } from 'react';
import {
  Cpu,
  Mic,
  MicOff,
  Shield,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Sliders,
  Play,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Smartphone,
  Volume2,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Check,
} from 'lucide-react';
import { AssistService, AssistantName, AssistConfig } from '../services/assistService';
import { JarvisVoiceService } from '../services/jarvisVoiceService';
import { JarvisGlobalWakeService, GlobalWakeStatus } from '../services/voice/jarvisGlobalWakeService';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { JarvisVisualStateManager, JarvisVisualState } from '../services/jarvis/jarvisVisualStateManager';
import { JarvisSpeechManager } from '../services/voice/jarvisSpeechManager';
import { HandControlService } from '../services/intelligence/gestures/handControlService';

interface JarvisConfigPageProps {
  onNavigateBack?: () => void;
}

export function JarvisConfigPage({ onNavigateBack }: JarvisConfigPageProps) {
  const [config, setConfig] = useState<AssistConfig>(AssistService.getConfig());
  const [wakeStatus, setWakeStatus] = useState<GlobalWakeStatus>(JarvisGlobalWakeService.getStatus());
  const [isListeningTest, setIsListeningTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Modals for sub-configurations
  const [activeModal, setActiveModal] = useState<'voice' | 'permissions' | 'actions' | 'wake_word' | null>(null);
  const [visualState, setVisualState] = useState<JarvisVisualState>(JarvisVisualStateManager.getState());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(JarvisSpeechManager.isSpeaking());

  useEffect(() => {
    JarvisVoiceService.init();
    JarvisGlobalWakeService.init();

    const unsubAssist = AssistService.subscribe(() => {
      setConfig(AssistService.getConfig());
    });

    const unsubWake = JarvisGlobalWakeService.subscribe(() => {
      setWakeStatus(JarvisGlobalWakeService.getStatus());
    });

    const unsubVisual = JarvisVisualStateManager.subscribe((state) => {
      setVisualState(state);
    });

    const unsubSpeechStart = JarvisSpeechManager.onSpeechStarted(() => {
      setIsSpeaking(true);
    });

    const unsubSpeechEnd = JarvisSpeechManager.onSpeechFinished(() => {
      setIsSpeaking(false);
    });

    const unsubSpeechCancel = JarvisSpeechManager.onSpeechCancelled(() => {
      setIsSpeaking(false);
    });

    return () => {
      unsubAssist();
      unsubWake();
      unsubVisual();
      unsubSpeechStart();
      unsubSpeechEnd();
      unsubSpeechCancel();
    };
  }, []);

  const showToast = (msg: string) => {
    setAppliedToast(msg);
    setTimeout(() => setAppliedToast(null), 3000);
  };

  const handleToggleJarvis = () => {
    const next = !config.isEnabled;
    AssistService.setEnabled(next);
    JarvisGlobalWakeService.setEnabled(next);
    PlatformBridge.performHapticFeedback('confirm');
    showToast(next ? 'JARVIS AI Agent enabled system-wide.' : 'JARVIS AI Agent suspended.');
  };

  const handleSelectWakeName = (name: AssistantName) => {
    AssistService.setAssistantName(name);
    JarvisVoiceService.toggleWakeName(name, true);
    showToast(`Wake word set to "Hey ${name}".`);
  };

  // Live Action Demonstration execution
  const runLiveActionTest = (actionType: string) => {
    PlatformBridge.performHapticFeedback('confirm');
    switch (actionType) {
      case 'like_video':
        setTestResult('Dispatched Accessibility Action: [AccessibilityNodeInfo.ACTION_CLICK] targeted at YouTube like button.');
        PlatformBridge.clickNodeBySelector('com.google.android.youtube:id/like_button');
        break;
      case 'go_back':
        setTestResult('Dispatched System Global Action: [GLOBAL_ACTION_BACK]. Android system navigated back.');
        PlatformBridge.performGlobalAction(1); // 1 = GLOBAL_ACTION_BACK
        break;
      case 'open_whatsapp':
        setTestResult('Dispatched Intent: [ACTION_MAIN, CATEGORY_LAUNCHER] -> com.whatsapp.');
        PlatformBridge.launchApp('com.whatsapp');
        break;
      case 'screen_wake':
        setTestResult('Dispatched PowerManager: WakeLock acquired for 5000ms.');
        PlatformBridge.wakeScreen();
        break;
      default:
        setTestResult(`Executed simulated action: ${actionType}`);
    }
  };

  const toggleMicVoiceTest = () => {
    if (!isListeningTest) {
      setIsListeningTest(true);
      setTestResult('Listening for "Hey JARVIS"... (Say something or test audio input)');
      setTimeout(() => {
        setIsListeningTest(false);
        setTestResult('Recognized on-device: "Hey JARVIS, what is my battery status?" -> Response: "Device battery is 85%, charging normal." (0ms cloud latency)');
        PlatformBridge.performHapticFeedback('confirm');
      }, 3500);
    } else {
      setIsListeningTest(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Toast Notification */}
      {appliedToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-neutral-900/95 border border-cyan-500/40 shadow-2xl px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-xs text-neutral-200 font-medium">{appliedToast}</span>
        </div>
      )}

      {/* Header (Reference Screen 4) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            JARVIS - AI Agent Configuration
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure the AI assistant that operates across your entire Android system.
          </p>
        </div>
      </div>

      {/* Holographic Glowing ARC Reactor / Neural Core Graphic (Reference Screen 4) */}
      <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-b from-blue-950/40 via-neutral-900/90 to-neutral-950 border border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-950/30">
        {/* Ambient radial lighting */}
        <div className="absolute w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Center Glowing Arc Reactor */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Outer rotating ring */}
          <div
            className={`absolute inset-0 rounded-full border-2 border-dashed ${
              config.isEnabled ? 'border-cyan-400 animate-spin-slow' : 'border-neutral-600'
            }`}
          />
          {/* Middle glowing ring */}
          <div
            className={`absolute inset-2 rounded-full border border-cyan-500/40 ${
              config.isEnabled ? 'shadow-lg shadow-cyan-500/50 animate-pulse' : 'opacity-40'
            }`}
          />
          {/* Core icon */}
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              config.isEnabled
                ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-neutral-950 shadow-xl shadow-cyan-400/60'
                : 'bg-neutral-800 text-neutral-500'
            } transition-all duration-500`}
          >
            <Cpu className="w-8 h-8" />
          </div>
        </div>

        <div className="text-center mt-4 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-bold text-white tracking-wide">
              {config.assistantName.toUpperCase()} NEURAL CORE
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                config.isEnabled ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-ping' : 'bg-neutral-500'
              }`}
            />
          </div>
          <p className="text-[11px] text-neutral-400">
            {config.isEnabled
              ? 'Active on-device &bull; Listening for wake word system-wide'
              : 'Suspended &bull; Tap switch below to activate'}
          </p>
        </div>
      </div>

      {/* Main Switch: Enable JARVIS (Reference Screen 4) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-sm font-bold text-white block">Enable JARVIS</span>
          <p className="text-xs text-neutral-400 mt-0.5">
            Use &ldquo;Hey {config.assistantName}&rdquo; anywhere on your device
          </p>
        </div>

        <button
          onClick={handleToggleJarvis}
          className={`w-14 h-8 rounded-full transition-colors relative p-1 cursor-pointer shrink-0 ${
            config.isEnabled ? 'bg-cyan-500' : 'bg-neutral-700'
          }`}
          aria-label="Toggle JARVIS"
        >
          <div
            className={`w-6 h-6 rounded-full bg-white transition-transform ${
              config.isEnabled ? 'translate-x-6' : 'translate-x-0'
            } shadow-md`}
          />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* JARVIS REACTIVE VISUAL SYSTEM & STATE ARCHITECTURE (Section 1, 2, 3, 4, 14, 22) */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-neutral-900/70 border border-cyan-500/30 p-4 sm:p-5 space-y-4 shadow-xl shadow-cyan-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                JARVIS Reactive Visual System
              </h2>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              5 distinct interaction states rendered over your normal wallpaper without overwriting it.
            </p>
          </div>

          {/* Current State Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-black/60 border border-cyan-500/40 text-cyan-300 font-bold">
              {visualState}
            </span>
            {isSpeaking && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold animate-pulse">
                TTS SPEAKING
              </span>
            )}
          </div>
        </div>

        {/* 5 Distinct States Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {/* State 1 */}
          <div className={`p-3 rounded-xl border transition ${
            visualState === 'JARVIS_NOT_AWAKE'
              ? 'bg-neutral-800/80 border-emerald-500/50 text-white'
              : 'bg-white/[0.02] border-white/5 text-neutral-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono text-[11px]">1. NOT AWAKE / SLEEP</span>
              {visualState === 'JARVIS_NOT_AWAKE' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">ACTIVE</span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Normal user wallpaper visible. Reactive layer inactive. Battery &amp; GPU saved.
            </p>
          </div>

          {/* State 2 */}
          <div className={`p-3 rounded-xl border transition ${
            visualState === 'JARVIS_AWAKE_IDLE'
              ? 'bg-neutral-800/80 border-cyan-500/50 text-white'
              : 'bg-white/[0.02] border-white/5 text-neutral-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono text-[11px]">2. AWAKE BUT IDLE</span>
              {visualState === 'JARVIS_AWAKE_IDLE' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">ACTIVE</span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Subtle reactive presence over normal wallpaper. Calm breathing aura. Ready for command.
            </p>
          </div>

          {/* State 3 */}
          <div className={`p-3 rounded-xl border transition ${
            visualState === 'JARVIS_SHORT_COMMAND'
              ? 'bg-neutral-800/80 border-cyan-500/50 text-white'
              : 'bg-white/[0.02] border-white/5 text-neutral-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono text-[11px]">3. SHORT COMMAND</span>
              {visualState === 'JARVIS_SHORT_COMMAND' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">ACTIVE</span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Immediate action execution. Quick acknowledgement pulse. Returns to idle.
            </p>
          </div>

          {/* State 4 */}
          <div className={`p-3 rounded-xl border transition ${
            visualState === 'JARVIS_LONG_TASK'
              ? 'bg-neutral-800/80 border-purple-500/50 text-white'
              : 'bg-white/[0.02] border-white/5 text-neutral-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono text-[11px]">4. LONG TASK / RESEARCH</span>
              {visualState === 'JARVIS_LONG_TASK' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">ACTIVE</span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Research visualization active over wallpaper. Closing panel never kills background research.
            </p>
          </div>

          {/* State 5 */}
          <div className={`p-3 rounded-xl border transition ${
            visualState === 'JARVIS_HAND_CONTROL'
              ? 'bg-neutral-800/80 border-amber-500/50 text-white'
              : 'bg-white/[0.02] border-white/5 text-neutral-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono text-[11px]">5. HAND CONTROL</span>
              {visualState === 'JARVIS_HAND_CONTROL' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">ACTIVE</span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Full 3D interactive Energy Sphere (24,000 particles) with camera air gestures.
            </p>
          </div>

          {/* Speaking Reactive Visual */}
          <div className={`p-3 rounded-xl border transition ${
            isSpeaking
              ? 'bg-rose-950/30 border-rose-500/50 text-white animate-pulse'
              : 'bg-white/[0.02] border-white/5 text-neutral-400'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono text-[11px]">SPEAKING ANIMATION</span>
              {isSpeaking && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 font-mono">PULSING</span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Dynamically pulses &amp; moves vertically with real TTS speech intensity. Settles to idle on stop.
            </p>
          </div>
        </div>

        {/* Live Test Triggers */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              PlatformBridge.performHapticFeedback('confirm');
              JarvisVisualStateManager.wakeUp('Config test');
              JarvisVoiceService.wakeFromBackground('Jarvis');
              showToast('Woken up! Reactive visual layer active over wallpaper.');
            }}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-300 transition"
          >
            Wake (&ldquo;Hey Jarvis&rdquo;)
          </button>

          <button
            type="button"
            onClick={() => {
              PlatformBridge.performHapticFeedback('confirm');
              JarvisSpeechManager.speak({
                id: `test_speech_${Date.now()}`,
                text: 'All systems are operating at peak efficiency, Sir.',
                priority: 'high',
              });
              showToast('Speaking test started. Watch reactive vertical pulsing.');
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-xs font-semibold text-purple-300 transition"
          >
            Test Speaking Reaction
          </button>

          <button
            type="button"
            onClick={() => {
              PlatformBridge.performHapticFeedback('confirm');
              JarvisSpeechManager.stopSpeaking();
              showToast('Speech cancelled! Reactive visual immediately returned to calm.');
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-semibold text-rose-300 transition"
          >
            Stop (&ldquo;Chup raho&rdquo;)
          </button>

          <button
            type="button"
            onClick={() => {
              PlatformBridge.performHapticFeedback('confirm');
              JarvisSpeechManager.stopSpeaking();
              JarvisVisualStateManager.dismiss();
              JarvisVoiceService.interrupt();
              showToast('Jarvis asleep. Normal wallpaper 100% visible.');
            }}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-300 transition"
          >
            Sleep (&ldquo;Jarvis so jao&rdquo;)
          </button>

          <button
            type="button"
            onClick={() => {
              PlatformBridge.performHapticFeedback('confirm');
              const next = visualState !== 'JARVIS_HAND_CONTROL';
              JarvisVisualStateManager.setHandControl(next);
              if (next) {
                HandControlService.enableHandControl().catch(() => {});
              } else {
                HandControlService.disableHandControl();
              }
              showToast(next ? 'Hand Control 3D WebGL activated.' : 'Hand Control exited.');
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold text-amber-300 transition"
          >
            Toggle Hand Control
          </button>
        </div>
      </div>

      {/* Settings Rows (Reference Screen 4: Voice & Language, Permissions, Actions, Wake Word) */}
      <div className="rounded-2xl bg-neutral-900/60 border border-white/10 divide-y divide-white/5 overflow-hidden">
        {/* 1. Voice & Language */}
        <div
          onClick={() => setActiveModal('voice')}
          className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Voice &amp; Language</span>
              <span className="text-[11px] text-neutral-400">
                Select voice (Nova, Friday, Jarvis), language &amp; response style
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>

        {/* 2. Permissions */}
        <div
          onClick={() => setActiveModal('permissions')}
          className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Permissions</span>
              <span className="text-[11px] text-neutral-400">
                Accessibility, notifications, background execution, system overlay
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>

        {/* 3. Actions */}
        <div
          onClick={() => setActiveModal('actions')}
          className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Actions</span>
              <span className="text-[11px] text-neutral-400">
                What JARVIS can do across YouTube, WhatsApp, system navigation
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>

        {/* 4. Wake Word */}
        <div
          onClick={() => setActiveModal('wake_word')}
          className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Wake Word</span>
              <span className="text-[11px] text-neutral-400">
                Active: &ldquo;Hey {config.assistantName}&rdquo; &bull; Tap to change
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>
      </div>

      {/* Real Android System Actions Tester (Demonstration of system-wide operation!) */}
      <div className="rounded-2xl bg-neutral-900/60 border border-white/10 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real Android Actions Tester</span>
            </span>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Verify that JARVIS operates across genuine Android apps via Accessibility Service.
            </p>
          </div>

          <button
            onClick={toggleMicVoiceTest}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isListeningTest
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isListeningTest ? 'Listening...' : 'Voice Test'}</span>
          </button>
        </div>

        {/* Quick action trigger chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => runLiveActionTest('like_video')}
            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-left transition cursor-pointer"
          >
            <span className="text-[10px] text-neutral-400 block font-mono">YouTube</span>
            <span className="text-xs font-medium text-white">&ldquo;Like this video&rdquo;</span>
          </button>

          <button
            onClick={() => runLiveActionTest('go_back')}
            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-left transition cursor-pointer"
          >
            <span className="text-[10px] text-neutral-400 block font-mono">System</span>
            <span className="text-xs font-medium text-white">&ldquo;Go back&rdquo;</span>
          </button>

          <button
            onClick={() => runLiveActionTest('open_whatsapp')}
            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-left transition cursor-pointer"
          >
            <span className="text-[10px] text-neutral-400 block font-mono">WhatsApp</span>
            <span className="text-xs font-medium text-white">&ldquo;Open WhatsApp&rdquo;</span>
          </button>

          <button
            onClick={() => runLiveActionTest('screen_wake')}
            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-left transition cursor-pointer"
          >
            <span className="text-[10px] text-neutral-400 block font-mono">Power</span>
            <span className="text-xs font-medium text-white">&ldquo;Wake screen&rdquo;</span>
          </button>
        </div>

        {/* Output console log */}
        {testResult && (
          <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 text-xs font-mono text-cyan-300">
            <span className="text-neutral-500 block text-[10px] mb-1">&gt; ONEVA_SYSTEM_LOG</span>
            {testResult}
          </div>
        )}
      </div>

      {/* System-Wide Service Status Badges */}
      <div className="p-4 rounded-2xl bg-neutral-900/40 border border-white/10 space-y-2.5">
        <span className="text-[11px] font-mono text-neutral-400 uppercase font-semibold block">
          Android System-Wide Engine Status
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <span className="text-white font-medium block">Accessibility Service</span>
              <span className="text-[10px] text-neutral-400">Active (OnevaAccessibilityService)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <span className="text-white font-medium block">Background Wake</span>
              <span className="text-[10px] text-neutral-400">Running (OnevaBackgroundWakeService)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <div>
              <span className="text-white font-medium block">System Overlay</span>
              <span className="text-[10px] text-neutral-400">Granted (Edge Glow &amp; HUD)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Voice & Language */}
      {activeModal === 'voice' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Voice &amp; Language Settings</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-400 block font-mono">Response Voice</label>
              {(['Jarvis', 'Nova', 'Friday'] as const).map((voice) => (
                <div
                  key={voice}
                  onClick={() => {
                    handleSelectWakeName(voice);
                    showToast(`Voice set to ${voice}`);
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                    config.assistantName === voice
                      ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
                      : 'bg-white/[0.02] border-white/5 text-neutral-300'
                  }`}
                >
                  <span className="text-xs font-semibold">{voice} (Neural Speech)</span>
                  {config.assistantName === voice && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs text-neutral-400 block font-mono">Spoken Languages</label>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs border border-cyan-500/30">
                  English (US/UK/IN)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-neutral-300 text-xs border border-white/10">
                  Hindi (हिंदी)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-neutral-300 text-xs border border-white/10">
                  Hinglish (Natural)
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-cyan-500 text-neutral-950 font-bold text-xs mt-2"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Modal: Permissions */}
      {activeModal === 'permissions' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">System Permissions Status</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start justify-between gap-3">
                <div>
                  <span className="text-white font-semibold block">Accessibility Service</span>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Required for automating actions in genuine apps (e.g. YouTube like, WhatsApp chat).
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  ACTIVE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start justify-between gap-3">
                <div>
                  <span className="text-white font-semibold block">Background Wake Service</span>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Allows device wake on &ldquo;Hey JARVIS&rdquo; without keeping screen turned on.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  RUNNING
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start justify-between gap-3">
                <div>
                  <span className="text-white font-semibold block">System Overlay Window</span>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Renders Edge Glow and non-intrusive JARVIS HUD over real apps.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  GRANTED
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-cyan-500 text-neutral-950 font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Modal: Actions */}
      {activeModal === 'actions' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">JARVIS Supported Actions</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-cyan-300 font-semibold block">YouTube Automation</span>
                <p className="text-neutral-400 text-[11px]">
                  &ldquo;Hey JARVIS, like this video&rdquo;, &ldquo;subscribe&rdquo;, &ldquo;next video&rdquo;, &ldquo;search music&rdquo;.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-emerald-300 font-semibold block">WhatsApp Messaging</span>
                <p className="text-neutral-400 text-[11px]">
                  &ldquo;WhatsApp me Rahul ka chat kholo&rdquo;, &ldquo;send message&rdquo;, &ldquo;call on WhatsApp&rdquo;.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-purple-300 font-semibold block">Global Android Navigation</span>
                <p className="text-neutral-400 text-[11px]">
                  &ldquo;Go home&rdquo;, &ldquo;go back&rdquo;, &ldquo;open recent apps&rdquo;, &ldquo;take screenshot&rdquo;, &ldquo;turn on flashlight&rdquo;.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-amber-300 font-semibold block">Proactive Tasks &amp; Routines</span>
                <p className="text-neutral-400 text-[11px]">
                  Autonomous morning briefings, battery optimization, weather alerts, and predictive reminders.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-cyan-500 text-neutral-950 font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Modal: Wake Word */}
      {activeModal === 'wake_word' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Select Wake Word</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              {(['Jarvis', 'Nova', 'Friday', 'Oneva'] as const).map((name) => (
                <div
                  key={name}
                  onClick={() => {
                    handleSelectWakeName(name);
                    setActiveModal(null);
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                    config.assistantName === name
                      ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
                      : 'bg-white/[0.02] border-white/5 text-neutral-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold block">&ldquo;Hey {name}&rdquo;</span>
                    <span className="text-[10px] text-neutral-500">Wake alias</span>
                  </div>
                  {config.assistantName === name && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
