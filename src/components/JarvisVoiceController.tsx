import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Clock,
  Volume2,
  AlertTriangle,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Globe,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Terminal,
  Play,
  Square,
  Lock,
  Zap,
  Power,
  Vibrate,
  Eye,
} from 'lucide-react';
import { JarvisVoiceService, JarvisCommandEvent } from '../services/jarvisVoiceService';
import { JarvisVoiceState, JarvisSupportedLanguage } from '../types/jarvisVoice';
import { JarvisTtsEngine } from '../services/voice/jarvisTtsEngine';
import { JarvisPersonalityEngine } from '../services/intelligence/jarvisPersonalityEngine';
import { JarvisVoiceSettingsModal } from './jarvis/JarvisVoiceSettingsModal';
import { JarvisVoiceStatusPhase19 } from '../types/jarvisPersonality';
import { BackgroundWakeManager, BackgroundWakeStatus } from '../services/onevaBackgroundWakeManager';
import { OnevaLockScreenWakeSimulator } from './OnevaLockScreenWakeSimulator';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { OnevaVoiceDuplexControlCard } from './OnevaVoiceDuplexControlCard';
import { JarvisEdgeNeuralCard } from './jarvis/JarvisEdgeNeuralCard';
import { JarvisDynamicToolStudioCard } from './jarvis/JarvisDynamicToolStudioCard';
import { JarvisBiometricsCard } from './jarvis/JarvisBiometricsCard';
import { JarvisMeshRelayCard } from './jarvis/JarvisMeshRelayCard';
import { JarvisInfiniteEpisodicMemoryCard } from './jarvis/JarvisInfiniteEpisodicMemoryCard';
import { JarvisStarkMasterSuiteCard } from './jarvis/JarvisStarkMasterSuiteCard';
import { JarvisHyperscaleEvolutionCard } from './jarvis/JarvisHyperscaleEvolutionCard';

export function JarvisVoiceController() {
  const [voiceState, setVoiceState] = useState<JarvisVoiceState>(JarvisVoiceService.getState());
  const [settings, setSettings] = useState(JarvisVoiceService.getSettings());
  const [lastTranscript, setLastTranscript] = useState(JarvisVoiceService.getLastSpokenTranscript());
  const [lastResponse, setLastResponse] = useState(JarvisVoiceService.getLastResponseText());
  const [errorMessage, setErrorMessage] = useState(JarvisVoiceService.getErrorMessage());
  const [commandHistory, setCommandHistory] = useState<JarvisCommandEvent[]>(JarvisVoiceService.getCommandHistory());
  const [remainingMs, setRemainingMs] = useState(JarvisVoiceService.getSessionRemainingMs());
  const [phase19Status, setPhase19Status] = useState<JarvisVoiceStatusPhase19>(JarvisTtsEngine.getStatus());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(JarvisTtsEngine.getIsSpeaking());
  const [showPersonalityModal, setShowPersonalityModal] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [wakeStatus, setWakeStatus] = useState<BackgroundWakeStatus>(BackgroundWakeManager.getStatus());

  // Input states
  const [customNameInput, setCustomNameInput] = useState('');
  const [customNameError, setCustomNameError] = useState<string | null>(null);
  const [simulateTextInput, setSimulateTextInput] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    JarvisVoiceService.init();
    BackgroundWakeManager.init();

    const unsubscribe = JarvisVoiceService.subscribe(() => {
      setVoiceState(JarvisVoiceService.getState());
      setSettings(JarvisVoiceService.getSettings());
      setLastTranscript(JarvisVoiceService.getLastSpokenTranscript());
      setLastResponse(JarvisVoiceService.getLastResponseText());
      setErrorMessage(JarvisVoiceService.getErrorMessage());
      setCommandHistory(JarvisVoiceService.getCommandHistory());
    });

    const unsubTts = JarvisTtsEngine.subscribe(() => {
      setPhase19Status(JarvisTtsEngine.getStatus());
      setIsSpeaking(JarvisTtsEngine.getIsSpeaking());
    });

    const unsubWake = BackgroundWakeManager.subscribe(() => {
      setWakeStatus(BackgroundWakeManager.getStatus());
    });

    // Timer countdown loop when session is active
    const interval = setInterval(() => {
      setRemainingMs(JarvisVoiceService.getSessionRemainingMs());
    }, 1000);

    return () => {
      unsubscribe();
      unsubTts();
      unsubWake();
      clearInterval(interval);
    };
  }, []);

  const handleToggleScreenOffWake = async () => {
    const nextState = !settings.screenOffWakeEnabled;
    if (nextState) {
      await BackgroundWakeManager.startForegroundService();
      showToast('Screen-Off Wake चालू कर दिया गया है। (Listening when locked)');
    } else {
      await BackgroundWakeManager.stopForegroundService();
      showToast('Screen-Off Wake बंद किया गया।');
    }
    setSettings(JarvisVoiceService.getSettings());
  };

  const handleToggleScreenWakeOnDetection = () => {
    const next = !settings.screenWakeOnDetection;
    JarvisVoiceService.saveSettings({ screenWakeOnDetection: next });
    setSettings(JarvisVoiceService.getSettings());
    showToast(next ? 'Wake-Up Screen ON चालू' : 'Wake-Up Screen ON बंद');
  };

  const handleToggleAudioChime = () => {
    const next = !settings.audioChimeOnWake;
    JarvisVoiceService.saveSettings({ audioChimeOnWake: next });
    setSettings(JarvisVoiceService.getSettings());
    showToast(next ? 'Acoustic Wake Chime चालू' : 'Acoustic Wake Chime बंद');
  };

  const handleToggleHaptic = () => {
    const next = !settings.hapticFeedbackOnWake;
    JarvisVoiceService.saveSettings({ hapticFeedbackOnWake: next });
    setSettings(JarvisVoiceService.getSettings());
    showToast(next ? 'Haptic Pulse चालू' : 'Haptic Pulse बंद');
  };

  const handleRequestBatteryBypass = () => {
    BackgroundWakeManager.requestBatteryOptimizationBypass();
    showToast('Battery Optimization Bypass अनुरोध भेजा गया।');
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleToggleVoiceSystem = async () => {
    if (voiceState === 'SLEEPING' || voiceState === 'ERROR' || voiceState === 'UNAVAILABLE') {
      const res = await JarvisVoiceService.startVoiceSystem();
      if (!res.success) {
        showToast(res.message);
      } else {
        showToast('Jarvis is now listening for wake names.');
      }
    } else {
      await JarvisVoiceService.stopVoiceSystem();
      showToast('Jarvis voice system paused (Sleeping).');
    }
  };

  const handleToggleAlias = (name: string, enabled: boolean) => {
    const res = JarvisVoiceService.toggleWakeName(name, enabled);
    showToast(res.message || 'Updated');
  };

  const handleAddCustomName = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomNameError(null);
    const res = JarvisVoiceService.addCustomWakeName(customNameInput);
    if (!res.success) {
      setCustomNameError(res.message);
    } else {
      setCustomNameInput('');
      showToast(res.message);
    }
  };

  const handleRemoveCustomName = (name: string) => {
    const res = JarvisVoiceService.removeCustomWakeName(name);
    showToast(res.message);
  };

  const handleRestoreDefaults = () => {
    JarvisVoiceService.restoreDefaultWakeNames();
    showToast('Restored 7 default wake names.');
  };

  const handleLanguageChange = (lang: JarvisSupportedLanguage) => {
    JarvisVoiceService.setVoiceLanguage(lang);
    showToast(`Voice recognition language set to ${lang.toUpperCase()}.`);
  };

  const handleSimulateInput = (text: string) => {
    if (!text.trim()) return;
    JarvisVoiceService.simulateVoiceInput(text.trim());
    setSimulateTextInput('');
  };

  // Helper formatting for session remaining time
  const formatRemainingTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // State badge styling
  const getStateBadge = () => {
    switch (voiceState) {
      case 'SLEEPING':
        return {
          icon: <MicOff className="w-3.5 h-3.5 text-neutral-400" />,
          label: 'Sleeping',
          classes: 'bg-neutral-800/80 text-neutral-300 border-neutral-700',
        };
      case 'LISTENING_FOR_WAKE':
        return {
          icon: <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />,
          label: 'Listening for Wake Name',
          classes: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
        };
      case 'AWAKE':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Jarvis Active',
          classes: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        };
      case 'LISTENING_FOR_COMMAND':
        return {
          icon: <Mic className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />,
          label: 'Listening for Command',
          classes: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        };
      case 'PROCESSING':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />,
          label: 'Processing Command',
          classes: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
        };
      case 'RESPONDING':
        return {
          icon: <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-pulse" />,
          label: 'Responding',
          classes: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        };
      case 'ERROR':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Microphone Attention Needed',
          classes: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
        };
      case 'UNAVAILABLE':
      default:
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Voice Unavailable',
          classes: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        };
    }
  };

  const badge = getStateBadge();
  const isSessionActive = JarvisVoiceService.isSessionActive();
  const allKnownAliases = Array.from(new Set([...settings.enabledWakeNames, ...settings.customWakeNames]));

  return (
    <div className="space-y-6">
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900/95 border border-sky-500/30 shadow-2xl px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-xs text-neutral-200 font-medium">{feedbackToast}</span>
        </div>
      )}

      {/* Main Voice Console Card */}
      <div className="p-6 rounded-3xl bg-neutral-900/70 border border-white/10 space-y-6 relative overflow-hidden backdrop-blur-md">
        {/* Glow ambient background accent */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-medium ${badge.classes}`}>
                {badge.icon}
                <span>{badge.label}</span>
              </div>

              {isSessionActive && remainingMs > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Session: {formatRemainingTime(remainingMs)}</span>
                </div>
              )}
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight">Jarvis Voice &amp; Wake Engine</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Unified intelligence responding to any enabled alias. Active session lasts 10 minutes without repeating wake names.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Male / Female Toggle */}
            <button
              onClick={() => {
                const currentPrefs = JarvisPersonalityEngine.getPreferences();
                const next = (currentPrefs.voiceGender || 'male') === 'male' ? 'female' : 'male';
                JarvisPersonalityEngine.savePreferences({
                  voiceGender: next,
                  speechPitch: next === 'male' ? 0.88 : 1.08,
                  speechRate: 0.9,
                });
                setFeedbackToast(next === 'male' ? 'Voice set to Male (Deep, 0.9x)' : 'Voice set to Female (Lovely, 0.9x)');
              }}
              className="px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-neutral-200 border-2 border-white/25 hover:border-white/40 transition cursor-pointer"
              title="Toggle Male / Female Voice"
            >
              <span>{(JarvisPersonalityEngine.getPreferences().voiceGender || 'male') === 'male' ? '♂ Male Voice' : '♀ Female Voice'}</span>
            </button>

            <button
              onClick={() => setShowPersonalityModal(true)}
              className="px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-2 border-white/25 hover:border-white/40 transition cursor-pointer"
              title="Configure Voice, Addressing & Personality"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Voice &amp; Personality</span>
              <span className="sm:hidden">Voice</span>
            </button>

            <button
              id="btn-toggle-jarvis-voice"
              onClick={handleToggleVoiceSystem}
              className={`px-5 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 transition cursor-pointer border-2 border-white/25 hover:border-white/40 ${
                voiceState === 'SLEEPING' || voiceState === 'ERROR' || voiceState === 'UNAVAILABLE'
                  ? 'bg-sky-500 hover:bg-sky-400 text-neutral-950 font-semibold shadow-lg shadow-sky-500/20'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300'
              }`}
            >
              {voiceState === 'SLEEPING' || voiceState === 'ERROR' || voiceState === 'UNAVAILABLE' ? (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Start Voice Wake</span>
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Pause (Sleep)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Audio / Status Display Box */}
        <div className="p-4 rounded-2xl bg-neutral-950/80 border border-white/5 space-y-3 font-mono">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                <span>LIVE TRANSCRIPT BUFFER</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-white/5 text-neutral-400 text-[10px]">
                State: {phase19Status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isSpeaking && (
                <button
                  onClick={() => JarvisVoiceService.interrupt()}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[10px] font-mono cursor-pointer transition"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>Stop Speech</span>
                </button>
              )}
              <span className="text-[10px] text-neutral-500">Local Ephemeral Storage</span>
            </div>
          </div>

          <div className="min-h-[44px] flex items-center">
            {lastTranscript ? (
              <p className="text-sm text-neutral-200">
                <span className="text-sky-400 mr-2">“</span>
                {lastTranscript}
                <span className="text-sky-400 ml-2">”</span>
              </p>
            ) : (
              <p className="text-xs text-neutral-500 italic">
                {voiceState === 'SLEEPING'
                  ? 'Voice engine is sleeping. Click "Start Voice Wake" or simulate speech below.'
                  : 'Listening... Speak any enabled wake name (e.g., "Jarvis", "Hey Ultron open YouTube", "Alexa").'}
              </p>
            )}
          </div>

          {lastResponse && (
            <div className="p-2.5 rounded-xl bg-sky-500/5 border border-sky-500/20 text-xs text-sky-300 flex items-start gap-2">
              <Volume2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-400 block tracking-wider">Jarvis Response</span>
                <span>{lastResponse}</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Spoken Speech Simulation (Crucial for testing all wake names & phrases across any environment) */}
        <div className="pt-2 space-y-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-sky-400" />
              <span>Test Spoken Input (Phase 10 Verification Simulator)</span>
            </span>
            <span className="text-[10px] text-neutral-500">Simulates Web Speech Event</span>
          </div>

          {/* Quick preset test chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: '“Jarvis”', text: 'Jarvis' },
              { label: '“Hey Jarvis, open YouTube”', text: 'Hey Jarvis, open YouTube' },
              { label: '“Alexa”', text: 'Alexa' },
              { label: '“Hey Friday, what’s the weather”', text: 'Hey Friday, what is the weather' },
              { label: '“Ultron, search cricket news”', text: 'Ultron, search cricket news' },
              { label: '“Open YouTube” (Active Session Test)', text: 'open YouTube' },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSimulateInput(chip.text)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800/70 hover:bg-neutral-800 text-[11px] text-neutral-300 border border-white/5 hover:border-sky-500/40 transition cursor-pointer font-mono"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={simulateTextInput}
              onChange={(e) => setSimulateTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSimulateInput(simulateTextInput);
                }
              }}
              placeholder='Type spoken test phrase (e.g. "Hey Jarvis open YouTube")...'
              className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-sky-500/50"
            />
            <button
              type="button"
              onClick={() => handleSimulateInput(simulateTextInput)}
              disabled={!simulateTextInput.trim()}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-xs font-medium text-white transition cursor-pointer shrink-0"
            >
              Simulate Speak
            </button>
          </div>
        </div>
      </div>

      {/* Screen-Off & Background Wake (Phone lock hone par sunna) - Real JARVIS Core */}
      <div
        id="section-screen-off-wake"
        className="p-6 rounded-3xl bg-neutral-900/70 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.06)] space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Lock className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Screen-Off &amp; Background Wake Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                Real JARVIS Core
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Keeps low-power acoustic detection active when display powers down or phone locks.
              Wakes the screen immediately with haptic and audio feedback upon hearing your wake word.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSimulatorOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/30 cursor-pointer shrink-0 transition active:scale-95 group"
          >
            <Power className="w-3.5 h-3.5 text-cyan-200 group-hover:animate-pulse" />
            <span>Test Lock Screen Wake</span>
          </button>
        </div>

        {/* Live Hardware & Subsystem Status Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400 font-mono uppercase">Foreground Service</span>
                <span className="text-xs font-semibold text-white">
                  {wakeStatus.isNativeServiceRunning ? 'Active (Low Power)' : 'Standby / Ready'}
                </span>
              </div>
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                wakeStatus.isNativeServiceRunning ? 'bg-cyan-400 animate-pulse' : 'bg-neutral-600'
              }`}
            />
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400 font-mono uppercase">WakeLock State</span>
                <span className="text-xs font-semibold text-white">
                  {settings.screenOffWakeEnabled ? 'Engaged (CPU Active)' : 'Disabled'}
                </span>
              </div>
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                settings.screenOffWakeEnabled ? 'bg-emerald-400' : 'bg-neutral-600'
              }`}
            />
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400 font-mono uppercase">Battery Optimization</span>
                <span className="text-xs font-semibold text-white">
                  {wakeStatus.isIgnoringBatteryOptimizations ? 'Unrestricted (Bypassed)' : 'Optimized'}
                </span>
              </div>
            </div>
            {!wakeStatus.isIgnoringBatteryOptimizations && (
              <button
                onClick={handleRequestBatteryBypass}
                className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-mono border border-amber-500/30 transition"
              >
                Bypass
              </button>
            )}
          </div>
        </div>

        {/* 4 Fine-grained Customization Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Toggle 1: Screen-Off Wake Active */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/50 border border-white/5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">Screen-Off Listening</span>
                <span className="text-[10px] text-neutral-400 block">
                  Listen for wake words when phone is locked
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleScreenOffWake}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.screenOffWakeEnabled ? 'bg-cyan-500' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                  settings.screenOffWakeEnabled ? 'translate-x-5' : 'translate-x-0.5'
                } top-0.5 absolute shadow-md`}
              />
            </button>
          </div>

          {/* Toggle 2: Wake Screen ON Detection */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/50 border border-white/5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Eye className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">Turn Screen ON</span>
                <span className="text-[10px] text-neutral-400 block">
                  Illuminate OLED display when Jarvis responds
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleScreenWakeOnDetection}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.screenWakeOnDetection ? 'bg-cyan-500' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                  settings.screenWakeOnDetection ? 'translate-x-5' : 'translate-x-0.5'
                } top-0.5 absolute shadow-md`}
              />
            </button>
          </div>

          {/* Toggle 3: Acoustic Wake Chime */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/50 border border-white/5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Volume2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">Acoustic JARVIS Chime</span>
                <span className="text-[10px] text-neutral-400 block">
                  Futuristic rising harmonic startup chime
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleAudioChime}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.audioChimeOnWake ? 'bg-cyan-500' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                  settings.audioChimeOnWake ? 'translate-x-5' : 'translate-x-0.5'
                } top-0.5 absolute shadow-md`}
              />
            </button>
          </div>

          {/* Toggle 4: Tactile Haptic Feedback */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/50 border border-white/5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Vibrate className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">Haptic Vibration Pulse</span>
                <span className="text-[10px] text-neutral-400 block">
                  Double tactile pulse on wake recognition
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleHaptic}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.hapticFeedbackOnWake ? 'bg-cyan-500' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                  settings.hapticFeedbackOnWake ? 'translate-x-5' : 'translate-x-0.5'
                } top-0.5 absolute shadow-md`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Problem 3: Voice Pipeline: Turn-Based vs Full-Duplex Conversational (Real JARVIS Level) */}
      <OnevaVoiceDuplexControlCard onToast={showToast} />

      {/* Real-JARVIS Evolution: Edge Neural Core & Offline Hybrid Engine */}
      <JarvisEdgeNeuralCard onToast={showToast} />

      {/* Real-JARVIS Evolution: Dynamic Autonomous Tool Synthesis & Sandboxed Macro Engine */}
      <JarvisDynamicToolStudioCard onToast={showToast} />

      {/* Real-JARVIS Evolution: Camera PPG & Acoustic Micro-Tremor Biometric Sensing */}
      <JarvisBiometricsCard onToast={showToast} />

      {/* Real-JARVIS Evolution: Ubiquitous Multi-Device Mesh Relay */}
      <JarvisMeshRelayCard onToast={showToast} />

      {/* Real-JARVIS Evolution: Hierarchical Infinite Episodic Vector Memory & Knowledge Graph */}
      <JarvisInfiniteEpisodicMemoryCard onToast={showToast} />

      {/* Real-JARVIS Evolution Phase 25: Stark Master Cognitive Suite */}
      <JarvisStarkMasterSuiteCard onToast={showToast} />

      {/* Real-JARVIS Evolution Phase 26: Hyperscale Evolution Suite */}
      <JarvisHyperscaleEvolutionCard onToast={showToast} />

      {/* Recognized Wake Names & Aliases Management */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Recognized Wake Names (Aliases)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Jarvis is ONE unified intelligence. Any enabled name wakes the same assistant.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-300 border border-white/10 transition cursor-pointer flex items-center gap-1.5 self-start"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restore 7 Defaults</span>
          </button>
        </div>

        {/* Warning if no aliases are enabled */}
        {settings.enabledWakeNames.length === 0 && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>No wake name is enabled. Jarvis cannot wake via voice until at least one alias is checked.</span>
            </div>
            <button
              onClick={handleRestoreDefaults}
              className="px-3 py-1 rounded-lg bg-amber-500 text-neutral-950 font-semibold text-[11px] shrink-0"
            >
              Enable Defaults
            </button>
          </div>
        )}

        {/* Wake Names List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allKnownAliases.map((name) => {
            const isEnabled = settings.enabledWakeNames.includes(name);
            const isCustom = settings.customWakeNames.includes(name);
            const isLastUsed = settings.lastUsedAlias?.toLowerCase() === name.toLowerCase();

            return (
              <div
                key={name}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  isEnabled
                    ? 'bg-neutral-900/90 border-sky-500/30 shadow-md shadow-sky-950/10'
                    : 'bg-neutral-950/40 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    id={`wake-alias-${name}`}
                    checked={isEnabled}
                    onChange={(e) => handleToggleAlias(name, e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 text-sky-500 focus:ring-sky-500/30 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <label
                        htmlFor={`wake-alias-${name}`}
                        className="text-xs font-semibold text-white truncate cursor-pointer"
                      >
                        {name}
                      </label>
                      {isLastUsed && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono block">
                      {isCustom ? 'Custom Alias' : 'Default Alias'}
                    </span>
                  </div>
                </div>

                {isCustom && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomName(name)}
                    title={`Remove ${name}`}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Custom Wake Name Form */}
        <form onSubmit={handleAddCustomName} className="space-y-2 pt-2 border-t border-white/5">
          <label className="text-xs font-medium text-neutral-300 block">
            Add Custom Wake Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customNameInput}
              onChange={(e) => {
                setCustomNameInput(e.target.value);
                setCustomNameError(null);
              }}
              placeholder="e.g. Nova, Nexus, Friday, Alfred..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-sky-500/50"
            />
            <button
              type="submit"
              disabled={!customNameInput.trim()}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-neutral-950 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Alias</span>
            </button>
          </div>
          {customNameError && (
            <p className="text-xs text-rose-400 mt-1">{customNameError}</p>
          )}
        </form>
      </div>

      {/* Voice Architecture, Language & Android Screen-Off Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language Selection */}
        <div className="p-5 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider font-mono">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>Voice Language Architecture</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Multilingual speech model preparation. Language configuration is decoupled from wake names.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { id: 'en', label: 'English (US / IN)' },
              { id: 'hi', label: 'Hindi (हिंदी)' },
              { id: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
              { id: 'hr', label: 'Haryanvi (हरियाणवी)' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleLanguageChange(lang.id as JarvisSupportedLanguage)}
                className={`p-2.5 rounded-xl border text-xs text-left transition cursor-pointer ${
                  settings.selectedLanguage === lang.id
                    ? 'bg-sky-500/10 border-sky-500/40 text-sky-200 font-medium'
                    : 'bg-neutral-950/40 border-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Android Screen-Off / Locked Behavior (Honest platform status) */}
        <div className="p-5 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider font-mono">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>Android Screen-Off Capability</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/90 space-y-1.5">
            <span className="font-semibold text-amber-200 block">
              Native Foreground Service Status:
            </span>
            <p className="text-[11px] leading-relaxed">
              Standard web containers cannot listen with screen turned off due to Android OS battery/security boundaries.
              True screen-off wake requires ONEVA’s native Android APK with <code className="text-amber-200">FOREGROUND_SERVICE_TYPE_MICROPHONE</code>.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-950 text-[10px] font-mono text-neutral-400 mt-1">
              <span>Status:</span>
              <span className="text-amber-400">Web Container / Pauses when Screen Off</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ephemeral Command History (Session inspection) */}
      {commandHistory.length > 0 && (
        <div className="p-5 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Active Session Command Stream
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              Cleared after 10m inactivity
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {commandHistory.map((cmd) => (
              <div
                key={cmd.id}
                className="p-2.5 rounded-xl bg-neutral-950/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-mono shrink-0">
                    {cmd.matchedAlias || 'Jarvis'}
                  </span>
                  <span className="text-neutral-200 truncate font-mono">"{cmd.commandText}"</span>
                  {cmd.intent && (
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 text-[9px] font-mono border border-blue-500/20">
                      {cmd.intent.intentType}
                    </span>
                  )}
                  {cmd.plan && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono">
                      {cmd.plan.steps.length} steps planned
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                  {new Date(cmd.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase 19 Voice & Personality Modal */}
      <JarvisVoiceSettingsModal
        isOpen={showPersonalityModal}
        onClose={() => setShowPersonalityModal(false)}
      />

      {/* Real Screen-Off & Lock-Screen Wake Simulator */}
      <OnevaLockScreenWakeSimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}
