/**
 * ONEVA Phase 1 / Phase 20 Evolution: JARVIS Proactive Autonomous Sentinel Dashboard View
 * 
 * Provides an interactive Stark control deck for configuring proactive ambient
 * intelligence, calibrating thresholds, scheduling Morning Briefing, and triggering simulations.
 */

import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Play,
  Flame,
  BatteryCharging,
  Sliders,
  CheckCircle2,
  Bell,
  Cpu,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { JarvisProactiveSentinelService } from '../../services/sentinel/jarvisProactiveSentinelService';
import {
  SentinelConfig,
  SentinelSystemMetrics,
  SentinelProactivityLevel,
} from '../../types/jarvisSentinel';

interface JarvisProactiveSentinelViewProps {
  onToast?: (msg: string) => void;
}

export function JarvisProactiveSentinelView({ onToast }: JarvisProactiveSentinelViewProps) {
  const [config, setConfig] = useState<SentinelConfig>(JarvisProactiveSentinelService.getConfig());
  const [metrics, setMetrics] = useState<SentinelSystemMetrics>(JarvisProactiveSentinelService.getMetrics());

  useEffect(() => {
    JarvisProactiveSentinelService.init();
    return JarvisProactiveSentinelService.subscribe(() => {
      setConfig(JarvisProactiveSentinelService.getConfig());
      setMetrics(JarvisProactiveSentinelService.getMetrics());
    });
  }, []);

  const handleUpdateProactivity = (level: SentinelProactivityLevel) => {
    JarvisProactiveSentinelService.updateConfig({ proactivityLevel: level });
    onToast?.(`Proactivity level adjusted to ${level.replace('_', ' ').toUpperCase()}`);
  };

  const handleToggleVoice = () => {
    const next = !config.voiceWhisperEnabled;
    JarvisProactiveSentinelService.updateConfig({ voiceWhisperEnabled: next });
    onToast?.(`Proactive Voice Whispers: ${next ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleToggleChime = () => {
    const next = !config.voiceChimeEnabled;
    JarvisProactiveSentinelService.updateConfig({ voiceChimeEnabled: next });
    onToast?.(`Acoustic Sentinel Chime: ${next ? 'ENABLED' : 'MUTED'}`);
  };

  const handleToggleOnlyWhenAwake = () => {
    const next = !(config.onlyInformWhenAwake ?? true);
    JarvisProactiveSentinelService.updateConfig({ onlyInformWhenAwake: next });
    onToast?.(`Inform Only When Awake: ${next ? 'ENABLED (Quiet when sleeping)' : 'ALWAYS INFORM'}`);
  };

  const handleLanguageChange = (lang: 'auto' | 'en' | 'hi' | 'hinglish') => {
    JarvisProactiveSentinelService.updateConfig({ preferredLanguage: lang });
    onToast?.(`Sentinel Vocal Language: ${lang.toUpperCase()}`);
  };

  const handleSimulate = (type: 'briefing' | 'battery' | 'thermal' | 'night') => {
    switch (type) {
      case 'briefing':
        JarvisProactiveSentinelService.triggerMorningBriefing(true);
        onToast?.('Stark Morning Briefing dispatched');
        break;
      case 'battery':
        JarvisProactiveSentinelService.simulateBatterySpike(12);
        onToast?.('Simulating Low Battery (12%) Sentinel Trigger');
        break;
      case 'thermal':
        JarvisProactiveSentinelService.simulateThermalHazard(43.2);
        onToast?.('Simulating Silicon Overheat (43.2°C) Sentinel Trigger');
        break;
      case 'night':
        JarvisProactiveSentinelService.simulateNightRest();
        onToast?.('Simulating Late Night Eye Fatigue Sentinel Trigger');
        break;
    }
  };

  const getRiskBadge = () => {
    if (metrics.currentRiskLevel === 'HAZARD') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 animate-pulse" />
          <span>HAZARD ELEVATED</span>
        </span>
      );
    }
    if (metrics.currentRiskLevel === 'ELEVATED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
          <BatteryCharging className="w-3.5 h-3.5" />
          <span>ADVISORY ACTIVE</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>SYSTEM NOMINAL</span>
      </span>
    );
  };

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/70 border border-white/10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono tracking-tight">
                JARVIS Proactive Autonomous Sentinel
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                PHASE 1
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Ambient device observation, Stark Morning Briefings, thermal hazard mitigation, and anti-spam gatekeeping.
            </p>
          </div>
        </div>

        <div>{getRiskBadge()}</div>
      </div>

      {/* Mode Selectors */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-neutral-300 font-mono uppercase tracking-wider block">
          Proactivity &amp; Autonomous Interventions
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'autonomous',
              title: 'Full Autonomous',
              desc: 'Speaks actionable advice on battery, heat, briefings & circadian rest.',
            },
            {
              id: 'critical_only',
              title: 'Critical Only',
              desc: 'Only interrupts for hardware hazards (overheating >41.5°C, <15% battery).',
            },
            {
              id: 'silent',
              title: 'Silent HUD Only',
              desc: 'Visual indicators only, zero acoustic voice interruptions.',
            },
          ].map((mode) => {
            const isSelected = config.proactivityLevel === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleUpdateProactivity(mode.id as SentinelProactivityLevel)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500/50 shadow-lg shadow-cyan-950/20'
                    : 'bg-neutral-900/40 hover:bg-neutral-900/80 border-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-neutral-200'}`}>
                    {mode.title}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">{mode.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Awake State Gating Directive (User Requirement) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/20 via-neutral-950/40 to-neutral-950/40 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Awake State Gating Filter
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              ACTIVE POLICY
            </span>
          </div>
          <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
            Jarvis will only proactively vocalize warnings, battery/thermal advisories, and briefings when actively awake (including within the 2-minute post-command window). Zero unsolicited interruptions when asleep.
          </p>
        </div>

        <button
          onClick={handleToggleOnlyWhenAwake}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-medium border flex items-center gap-2 transition shrink-0 cursor-pointer ${
            config.onlyInformWhenAwake !== false
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-900/30'
              : 'bg-white/5 text-neutral-400 border-white/10'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{config.onlyInformWhenAwake !== false ? 'Inform Only When Awake: ON' : 'Always Inform: ON'}</span>
        </button>
      </div>

      {/* Audio & Language Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-neutral-950/50 border border-white/5">
        <div>
          <span className="text-[11px] font-mono text-neutral-400 block mb-2">Vocal Whisper</span>
          <button
            onClick={handleToggleVoice}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition w-full justify-center cursor-pointer ${
              config.voiceWhisperEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-white/5 text-neutral-400 border-white/10'
            }`}
          >
            {config.voiceWhisperEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{config.voiceWhisperEnabled ? 'Voice Whispers Active' : 'Voice Whispers Muted'}</span>
          </button>
        </div>

        <div>
          <span className="text-[11px] font-mono text-neutral-400 block mb-2">Acoustic Chime</span>
          <button
            onClick={handleToggleChime}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition w-full justify-center cursor-pointer ${
              config.voiceChimeEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-white/5 text-neutral-400 border-white/10'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{config.voiceChimeEnabled ? 'Dual-Tone Chime Active' : 'Chimes Muted'}</span>
          </button>
        </div>

        <div>
          <span className="text-[11px] font-mono text-neutral-400 block mb-2">Sentinel Language</span>
          <div className="grid grid-cols-4 gap-1">
            {(['auto', 'en', 'hi', 'hinglish'] as const).map((l) => (
              <button
                key={l}
                onClick={() => handleLanguageChange(l)}
                className={`py-2 rounded-xl text-xs font-mono font-medium transition cursor-pointer uppercase ${
                  config.preferredLanguage === l
                    ? 'bg-cyan-500 text-neutral-950 font-bold'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-white/5'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Protocols: Morning Briefing & Night Rest */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Morning Briefing Card */}
        <div className="p-4 rounded-2xl bg-neutral-950/40 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white font-mono">Circadian Morning Briefing</span>
            </div>
            <button
              onClick={() =>
                JarvisProactiveSentinelService.updateConfig({
                  morningBriefing: { ...config.morningBriefing, enabled: !config.morningBriefing.enabled },
                })
              }
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full cursor-pointer ${
                config.morningBriefing.enabled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/5 text-neutral-500'
              }`}
            >
              {config.morningBriefing.enabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
            Delivered once daily (6 AM - 10 AM) upon phone wake. Recites power status, radio health, weather, and day readiness.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-neutral-400 font-mono">
            <span>Schedule: 07:30 AM Daily</span>
            <span>Last Delivered: {config.morningBriefing.lastDeliveredDate || 'Never'}</span>
          </div>
        </div>

        {/* Night Rest Protocol Card */}
        <div className="p-4 rounded-2xl bg-neutral-950/40 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white font-mono">Late Night Rest Protocol</span>
            </div>
            <button
              onClick={() =>
                JarvisProactiveSentinelService.updateConfig({
                  nightRest: { ...config.nightRest, enabled: !config.nightRest.enabled },
                })
              }
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full cursor-pointer ${
                config.nightRest.enabled
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/5 text-neutral-500'
              }`}
            >
              {config.nightRest.enabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
            Monitors high screen brightness past 10:00 PM. Suggests 3200K warm blue-light filter and auto-dimming to prevent eye fatigue.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-neutral-400 font-mono">
            <span>Active Window: 10:00 PM – 06:00 AM</span>
            <span>Target Warmth: 3200 Kelvin</span>
          </div>
        </div>
      </div>

      {/* Instant Stark Simulation Deck */}
      <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider">
              Instant Simulation Deck (Test Live Sentinel Triggers)
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-500/70">Acoustic &amp; Voice Verified</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleSimulate('briefing')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-cyan-300 border border-white/10 transition text-left cursor-pointer flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-1.5 text-amber-400">
              <Sun className="w-3.5 h-3.5" />
              <span className="text-xs font-bold font-mono">Morning Briefing</span>
            </div>
            <span className="text-[10px] text-neutral-400">Trigger vocal day report</span>
          </button>

          <button
            onClick={() => handleSimulate('battery')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-amber-300 border border-white/10 transition text-left cursor-pointer flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-1.5 text-amber-400">
              <BatteryCharging className="w-3.5 h-3.5" />
              <span className="text-xs font-bold font-mono">Battery &lt;15% Drop</span>
            </div>
            <span className="text-[10px] text-neutral-400">Test Stark Saver suggestion</span>
          </button>

          <button
            onClick={() => handleSimulate('thermal')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-rose-300 border border-white/10 transition text-left cursor-pointer flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-1.5 text-rose-400">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-xs font-bold font-mono">Overheat (43.2°C)</span>
            </div>
            <span className="text-[10px] text-neutral-400">Test emergency thermal mitigation</span>
          </button>

          <button
            onClick={() => handleSimulate('night')}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-indigo-300 border border-white/10 transition text-left cursor-pointer flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Moon className="w-3.5 h-3.5" />
              <span className="text-xs font-bold font-mono">Late Night Strain</span>
            </div>
            <span className="text-[10px] text-neutral-400">Test 3200K eye shield alert</span>
          </button>
        </div>
      </div>
    </div>
  );
}
