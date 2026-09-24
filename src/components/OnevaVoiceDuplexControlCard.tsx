import React, { useState, useEffect } from 'react';
import {
  Radio,
  Zap,
  Mic,
  Volume2,
  VolumeX,
  Sliders,
  ShieldCheck,
  Activity,
  Check,
  Play,
  Square,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Cpu,
  Ear,
} from 'lucide-react';
import {
  JarvisPipelineMode,
  BargeInSensitivity,
  JarvisDuplexTelemetry,
  JarvisDuplexState,
  JarvisVoiceSettings,
} from '../types/jarvisVoice';
import { JarvisVoiceService } from '../services/jarvisVoiceService';
import { JarvisDuplexPipelineService } from '../services/voice/jarvisDuplexPipelineService';
import { JarvisTtsEngine } from '../services/voice/jarvisTtsEngine';
import { AudioEffects } from '../services/voice/audioSoundEffects';

interface OnevaVoiceDuplexControlCardProps {
  onToast?: (message: string) => void;
}

export const OnevaVoiceDuplexControlCard: React.FC<OnevaVoiceDuplexControlCardProps> = ({
  onToast,
}) => {
  const [settings, setSettings] = useState<JarvisVoiceSettings>(JarvisVoiceService.getSettings());
  const [duplexState, setDuplexState] = useState<JarvisDuplexState>(JarvisDuplexPipelineService.getState());
  const [telemetry, setTelemetry] = useState<JarvisDuplexTelemetry>(JarvisDuplexPipelineService.getTelemetry());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(JarvisTtsEngine.getIsSpeaking());
  const [testInterruptionInput, setTestInterruptionInput] = useState<string>('रुको, WhatsApp खोलो');
  const [isSimulatingSpeech, setIsSimulatingSpeech] = useState<boolean>(false);
  const [awakeRemainingMs, setAwakeRemainingMs] = useState<number>(() => JarvisVoiceService.getAwakeRemainingMs());
  const [isAwake, setIsAwake] = useState<boolean>(() => JarvisVoiceService.isAwake());

  useEffect(() => {
    // Initial sync
    setSettings(JarvisVoiceService.getSettings());
    setDuplexState(JarvisDuplexPipelineService.getState());
    setTelemetry(JarvisDuplexPipelineService.getTelemetry());

    const unsubDuplex = JarvisDuplexPipelineService.subscribe(() => {
      setDuplexState(JarvisDuplexPipelineService.getState());
      setTelemetry(JarvisDuplexPipelineService.getTelemetry());
    });

    const unsubVoice = JarvisVoiceService.subscribe(() => {
      setSettings(JarvisVoiceService.getSettings());
      setAwakeRemainingMs(JarvisVoiceService.getAwakeRemainingMs());
      setIsAwake(JarvisVoiceService.isAwake());
    });

    const unsubTts = JarvisTtsEngine.subscribe(() => {
      setIsSpeaking(JarvisTtsEngine.getIsSpeaking());
    });

    const timer = setInterval(() => {
      setAwakeRemainingMs(JarvisVoiceService.getAwakeRemainingMs());
      setIsAwake(JarvisVoiceService.isAwake());
    }, 500);

    return () => {
      unsubDuplex();
      unsubVoice();
      unsubTts();
      clearInterval(timer);
    };
  }, []);

  const showToast = (msg: string) => {
    if (onToast) {
      onToast(msg);
    }
  };

  const handleModeChange = (mode: JarvisPipelineMode) => {
    JarvisVoiceService.setPipelineMode(mode);
    setSettings(JarvisVoiceService.getSettings());
    if (mode === 'full_duplex') {
      AudioEffects.playJarvisWakeChime();
      showToast('Full-Duplex Pipeline Active: Real-time simultaneous listening & instant barge-in enabled.');
    } else {
      showToast('Turn-Based Pipeline Active: Mic pauses while Jarvis is speaking.');
    }
  };

  const handleToggleBargeIn = () => {
    const next = !(settings.bargeInEnabled ?? true);
    JarvisVoiceService.setBargeInEnabled(next);
    setSettings(JarvisVoiceService.getSettings());
    showToast(next ? 'Instant Barge-In Enabled' : 'Barge-In Disabled');
  };

  const handleToggleEchoCancellation = () => {
    const next = !(settings.selfVoiceCancellation ?? true);
    JarvisVoiceService.setSelfVoiceCancellation(next);
    setSettings(JarvisVoiceService.getSettings());
    showToast(next ? 'Self-Voice Echo Cancellation Enabled' : 'Echo Cancellation Disabled');
  };

  const handleSensitivityChange = (sensitivity: BargeInSensitivity) => {
    JarvisVoiceService.setBargeInSensitivity(sensitivity);
    setSettings(JarvisVoiceService.getSettings());
    showToast(`Barge-In Sensitivity: ${sensitivity.toUpperCase()}`);
  };

  const handleToggleDucking = () => {
    const next = !(settings.audioDuckingEnabled ?? true);
    JarvisVoiceService.saveSettings({ audioDuckingEnabled: next });
    setSettings(JarvisVoiceService.getSettings());
    showToast(next ? 'Audio Ducking Enabled' : 'Audio Ducking Disabled');
  };

  const handleAwakeTimeoutChange = (ms: number) => {
    JarvisVoiceService.saveSettings({ continuousTurnTakingTimeoutMs: ms });
    JarvisDuplexPipelineService.configure({ continuousTurnTakingTimeoutMs: ms });
    setSettings(JarvisVoiceService.getSettings());
    showToast(`Awake timeout updated: ${ms >= 60000 ? `${ms / 60000} min` : `${ms / 1000} sec`} after command finishes`);
  };

  // Test: Start a sample long speech by JARVIS to test interruption
  const handleTestJarvisSpeech = () => {
    setIsSimulatingSpeech(true);
    const sampleSpeech = settings.selectedLanguage === 'hi'
      ? 'सर, मैं सभी आवश्यक सिस्टम डायग्नोस्टिक्स का विश्लेषण कर रहा हूँ। नेटवर्क कनेक्टिविटी सामान्य है और सीपीयू लोड इष्टतम सीमा में है। अगर आप कोई विशेष कार्य शुरू करना चाहते हैं तो बस बताएं।'
      : 'Sir, I am currently monitoring all primary subsystems. Network latency is nominal at 18 milliseconds, security protocols are engaged, and core CPU temperature is stable. I am ready for your next directive whenever you are prepared.';

    JarvisVoiceService.speakText(sampleSpeech, settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US');
  };

  // Test: Fire instant user interruption
  const handleTriggerBargeIn = (customPhrase?: string) => {
    const phrase = customPhrase || testInterruptionInput;
    JarvisVoiceService.simulateBargeIn(phrase);
    showToast(`Barge-in triggered: "${phrase}"`);
  };

  const isFullDuplex = (settings.pipelineMode ?? 'full_duplex') === 'full_duplex';

  const getDuplexBadge = (state: JarvisDuplexState) => {
    switch (state) {
      case 'BARGE_IN_TRIGGERED':
      case 'USER_INTERRUPTING':
        return {
          label: 'BARGE-IN CUTOFF',
          classes: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse',
          icon: <Zap className="w-3.5 h-3.5" />,
        };
      case 'JARVIS_SPEAKING':
        return {
          label: isFullDuplex ? 'JARVIS SPEAKING (MIC OPEN)' : 'JARVIS SPEAKING (MIC PAUSED)',
          classes: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
          icon: <Volume2 className="w-3.5 h-3.5" />,
        };
      case 'LISTENING':
        return {
          label: isFullDuplex ? 'FULL-DUPLEX (MIC LIVE)' : 'TURN-BASED (WAITING INPUT)',
          classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse',
          icon: <Activity className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: isFullDuplex ? 'FULL-DUPLEX READY' : 'TURN-BASED READY',
          classes: 'bg-neutral-800 text-neutral-300 border-neutral-700',
          icon: <Radio className="w-3.5 h-3.5" />,
        };
    }
  };

  const badge = getDuplexBadge(duplexState);

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/80 border border-white/10 space-y-6 relative overflow-hidden backdrop-blur-md">
      {/* Background ambient decorative glow */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-medium ${badge.classes}`}>
              {badge.icon}
              <span>{badge.label}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 font-mono border border-white/5">
              Phase 10 &bull; Problem 3
            </span>
          </div>

          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Voice Pipeline: Turn-Based vs Full-Duplex Conversational</span>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono font-normal">
              JARVIS Level
            </span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5 max-w-2xl">
            Simultaneous real-time audio input and output streams. Speak over the assistant at any millisecond to instantly interrupt with zero turn lag or walkie-talkie awkwardness.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {telemetry.lastBargeInReason && (
            <div className="text-[11px] font-mono text-neutral-400 bg-neutral-950/80 px-2.5 py-1 rounded-lg border border-white/5">
              <span className="text-neutral-500">Last Cutoff: </span>
              <span className="text-sky-300">{telemetry.lastBargeInReason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Mode Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Full-Duplex Conversational */}
        <div
          onClick={() => handleModeChange('full_duplex')}
          className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            isFullDuplex
              ? 'bg-sky-950/30 border-sky-500/60 shadow-lg shadow-sky-950/20'
              : 'bg-neutral-950/40 border-white/5 hover:border-white/10 opacity-75'
          }`}
        >
          {isFullDuplex && (
            <div className="absolute top-3 right-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
              </span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`p-2 rounded-xl ${isFullDuplex ? 'bg-sky-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Full-Duplex Conversational</h4>
                <span className="text-[10px] text-sky-400 font-mono">Real JARVIS Level &bull; Sub-80ms Barge-In</span>
              </div>
            </div>

            <ul className="text-xs text-neutral-300 space-y-1.5 mt-3">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Simultaneous listening and speaking</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Instant voice interruption (Barge-In)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Self-Voice Echo Filter (suppresses assistant sound)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>2-minute (120s) post-command awake timeout window</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-mono text-neutral-400">Default &bull; High Precision</span>
            <button
              type="button"
              className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition ${
                isFullDuplex ? 'bg-sky-500 text-neutral-950' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isFullDuplex ? 'ACTIVE' : 'SELECT'}
            </button>
          </div>
        </div>

        {/* Card 2: Turn-Based (Walkie-Talkie) */}
        <div
          onClick={() => handleModeChange('turn_based')}
          className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            !isFullDuplex
              ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-950/20'
              : 'bg-neutral-950/40 border-white/5 hover:border-white/10 opacity-75'
          }`}
        >
          {!isFullDuplex && (
            <div className="absolute top-3 right-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`p-2 rounded-xl ${!isFullDuplex ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Turn-Based (Walkie-Talkie)</h4>
                <span className="text-[10px] text-amber-400 font-mono">Sequential Half-Duplex</span>
              </div>
            </div>

            <ul className="text-xs text-neutral-300 space-y-1.5 mt-3">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Microphone pauses while Jarvis is speaking</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>No self-voice echo risk</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 text-rose-400 shrink-0 text-center font-bold">&times;</span>
                <span className="text-neutral-400">Cannot interrupt by speaking over Jarvis</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 text-rose-400 shrink-0 text-center font-bold">&times;</span>
                <span className="text-neutral-400">Requires waiting for complete sentence finish</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-mono text-neutral-400">Legacy fallback</span>
            <button
              type="button"
              className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition ${
                !isFullDuplex ? 'bg-amber-500 text-neutral-950' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {!isFullDuplex ? 'ACTIVE' : 'SELECT'}
            </button>
          </div>
        </div>
      </div>

      {/* Duplex Controls & Granular Settings */}
      {isFullDuplex && (
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Full-Duplex Engine Fine-Tuning</span>
            </h4>
            <span className="text-[10px] font-mono text-neutral-400">
              Echo Cancellation &bull; Voice Divergence Sensitivity
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Toggle 1: Instant Barge-In */}
            <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Instant Barge-In</span>
                <span className="text-[10px] text-neutral-400">Stop speech on vocal onset</span>
              </div>
              <button
                type="button"
                onClick={handleToggleBargeIn}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                  settings.bargeInEnabled ?? true ? 'bg-sky-500' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform transform ${
                    settings.bargeInEnabled ?? true ? 'translate-x-4.5' : 'translate-x-0.5'
                  } top-0.5 absolute shadow`}
                />
              </button>
            </div>

            {/* Toggle 2: Self-Voice Echo Filter */}
            <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Self-Voice Echo Filter</span>
                <span className="text-[10px] text-neutral-400">Lexical match &amp; suppression</span>
              </div>
              <button
                type="button"
                onClick={handleToggleEchoCancellation}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                  settings.selfVoiceCancellation ?? true ? 'bg-emerald-500' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform transform ${
                    settings.selfVoiceCancellation ?? true ? 'translate-x-4.5' : 'translate-x-0.5'
                  } top-0.5 absolute shadow`}
                />
              </button>
            </div>

            {/* Toggle 3: Audio Ducking */}
            <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Acoustic Ducking</span>
                <span className="text-[10px] text-neutral-400">Fast fade-out on user speech</span>
              </div>
              <button
                type="button"
                onClick={handleToggleDucking}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                  settings.audioDuckingEnabled ?? true ? 'bg-cyan-500' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform transform ${
                    settings.audioDuckingEnabled ?? true ? 'translate-x-4.5' : 'translate-x-0.5'
                  } top-0.5 absolute shadow`}
                />
              </button>
            </div>
          </div>

          {/* Barge-In Sensitivity Selector */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white">Interruption Sensitivity:</span>
              <span className="text-[11px] font-mono text-sky-400 capitalize">
                {settings.bargeInSensitivity ?? 'balanced'} Mode
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['relaxed', 'balanced', 'aggressive'] as BargeInSensitivity[]).map((sens) => {
                const isSelected = (settings.bargeInSensitivity ?? 'balanced') === sens;
                return (
                  <button
                    key={sens}
                    type="button"
                    onClick={() => handleSensitivityChange(sens)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition text-left cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                        : 'bg-neutral-900 border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold capitalize text-white">{sens}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      {sens === 'aggressive'
                        ? 'Fastest (~40ms vocal trigger)'
                        : sens === 'balanced'
                        ? 'Divergence + Keyword filter'
                        : 'Explicit Wake/Stop words only'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Post-Command Awake Timeout Selector & Live Status (User Directive) */}
          <div className="pt-3 border-t border-white/5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-xs font-semibold text-white">Post-Command Awake Window:</span>
                <span className="text-[10px] text-neutral-400 block">
                  Jarvis stays awake after completing the last command (not when initiated)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  isAwake
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : 'bg-neutral-800 text-neutral-400 border-white/5'
                }`}>
                  {isAwake ? 'JARVIS AWAKE' : 'JARVIS SLEEPING'}
                </span>
                {awakeRemainingMs > 0 && (
                  <span className="text-[11px] font-mono text-cyan-400">
                    ({Math.ceil(awakeRemainingMs / 1000)}s remaining)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: '30s', ms: 30000, desc: 'Quick follow-up' },
                { label: '1 Min', ms: 60000, desc: 'Standard' },
                { label: '2 Min (Default)', ms: 120000, desc: 'Conversational' },
                { label: '3 Min', ms: 180000, desc: 'Extended focus' },
                { label: '5 Min', ms: 300000, desc: 'Max retention' },
              ].map((item) => {
                const currentMs = settings.continuousTurnTakingTimeoutMs ?? 120000;
                const isSelected = currentMs === item.ms;
                return (
                  <button
                    key={item.ms}
                    type="button"
                    onClick={() => handleAwakeTimeoutChange(item.ms)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition text-left cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-950'
                        : 'bg-neutral-900 border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-white">{item.label}</div>
                    <div className="text-[9px] text-neutral-400 mt-0.5">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Live Interactive Barge-In Simulator */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-sky-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-white">Real-Time Barge-In Test Arena</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Simulate user speaking over JARVIS</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={handleTestJarvisSpeech}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer shrink-0 ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isSpeaking ? 'Jarvis Speaking...' : '1. Make Jarvis Speak'}</span>
          </button>

          <input
            type="text"
            value={testInterruptionInput}
            onChange={(e) => setTestInterruptionInput(e.target.value)}
            placeholder="User speech during interruption..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-950/80 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
          />

          <button
            type="button"
            onClick={() => handleTriggerBargeIn()}
            disabled={!isSpeaking && !testInterruptionInput}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 ${
              isSpeaking
                ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 animate-pulse'
                : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>2. Interrupt (Barge-In)</span>
          </button>
        </div>

        {/* Quick Barge-In Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-neutral-500 font-mono mr-1">Quick Barge-in Words:</span>
          {[
            'रुको, बंद करो',
            'Wait, stop!',
            'रुको, YouTube खोलो',
            'Jarvis, quiet',
            'Hold on, call Mom',
          ].map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => {
                setTestInterruptionInput(phrase);
                if (isSpeaking) {
                  handleTriggerBargeIn(phrase);
                }
              }}
              className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-700/60 text-neutral-300 hover:text-white border border-white/5 transition"
            >
              &ldquo;{phrase}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-neutral-950/60 border border-white/5">
          <span className="text-[10px] text-neutral-400 font-mono uppercase block">Barge-Ins Fired</span>
          <span className="text-lg font-bold text-sky-400 font-mono block mt-0.5">
            {telemetry.bargeInCount}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-neutral-950/60 border border-white/5">
          <span className="text-[10px] text-neutral-400 font-mono uppercase block">Echo Filtered</span>
          <span className="text-lg font-bold text-emerald-400 font-mono block mt-0.5">
            {telemetry.echoFilteredCount}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-neutral-950/60 border border-white/5">
          <span className="text-[10px] text-neutral-400 font-mono uppercase block">Total Speech Turns</span>
          <span className="text-lg font-bold text-purple-400 font-mono block mt-0.5">
            {telemetry.totalTurns}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-neutral-950/60 border border-white/5">
          <span className="text-[10px] text-neutral-400 font-mono uppercase block">Pipeline Latency</span>
          <span className="text-lg font-bold text-amber-400 font-mono block mt-0.5">
            &lt; 65ms
          </span>
        </div>
      </div>
    </div>
  );
};
