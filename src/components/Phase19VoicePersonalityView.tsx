import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Square,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Shield,
  WifiOff,
  User,
  Sliders,
  Terminal,
} from 'lucide-react';
import {
  JarvisPhase19TestSuite,
  Phase19TestResult,
} from '../services/intelligence/jarvisPhase19Tests';
import { JarvisPersonalityEngine } from '../services/intelligence/jarvisPersonalityEngine';
import { JarvisTtsEngine } from '../services/voice/jarvisTtsEngine';
import { JarvisVoiceService } from '../services/jarvisVoiceService';
import { JarvisVoiceSettingsModal } from './jarvis/JarvisVoiceSettingsModal';
import { JarvisVoiceStatusPhase19 } from '../types/jarvisPersonality';

export const Phase19VoicePersonalityView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Phase19TestResult[]>([]);
  const [summary, setSummary] = useState<{ passed: number; failed: number; total: number } | null>(
    null
  );
  const [voiceStatus, setVoiceStatus] = useState<JarvisVoiceStatusPhase19>(
    JarvisTtsEngine.getStatus()
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(JarvisTtsEngine.getIsSpeaking());
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [liveTestInput, setLiveTestInput] = useState<string>('What is the current system status?');
  const [liveResponse, setLiveResponse] = useState<string | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const res = await JarvisPhase19TestSuite.runAllTests();
      setTestResults(res.results);
      setSummary({
        passed: res.passed,
        failed: res.failed,
        total: res.total,
      });
    } catch (e) {
      console.error('[Phase19VoicePersonalityView] Error running tests:', e);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    handleRunTests();

    const unsubTts = JarvisTtsEngine.subscribe(() => {
      setVoiceStatus(JarvisTtsEngine.getStatus());
      setIsSpeaking(JarvisTtsEngine.getIsSpeaking());
    });

    return () => {
      unsubTts();
    };
  }, []);

  const handleLiveSpeak = () => {
    if (isSpeaking) {
      JarvisVoiceService.interrupt();
      return;
    }

    const formatted = JarvisPersonalityEngine.formatResponse({
      rawMessage: 'All primary and secondary subsystems are operating within nominal parameters.',
      complexity: 'SIMPLE',
    });

    setLiveResponse(formatted.displayText);
    JarvisVoiceService.speakText(formatted.spokenText);
  };

  return (
    <div className="rounded-3xl bg-neutral-900/90 border border-emerald-500/20 p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider">
              ONEVA Phase 19
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Premium Voice + Personality
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            JARVIS Voice & Personality System
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Natural speech delivery, non-repetitive addressing (Sir / Ma'am / Neutral), safe voice interruption, and multi-user privacy isolation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preferences</span>
          </button>

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-950/50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>Run Matrix</span>
          </button>
        </div>
      </div>

      {/* Live Voice & State Bar */}
      <div className="p-4 rounded-2xl bg-black/50 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              voiceStatus === 'SPEAKING'
                ? 'bg-emerald-400 animate-ping'
                : voiceStatus === 'THINKING'
                ? 'bg-purple-400 animate-pulse'
                : voiceStatus === 'EXECUTING'
                ? 'bg-amber-400 animate-spin'
                : 'bg-emerald-500'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-white">
                Engine State: {voiceStatus}
              </span>
              {isSpeaking && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono animate-pulse">
                  Speaking Aloud
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-3 mt-0.5 font-mono">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Zero Audio Telemetry</span>
              </span>
              <span className="flex items-center gap-1">
                <WifiOff className="w-3 h-3 text-neutral-400" />
                <span>Local Offline Speech</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLiveSpeak}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isSpeaking
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            {isSpeaking ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Interrupt Speech</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Voice Cadence</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Response Preview if any */}
      {liveResponse && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs font-mono text-emerald-200">
          <div className="text-[10px] text-emerald-400 uppercase font-bold mb-1">
            Formatted Jarvis Response:
          </div>
          {liveResponse}
        </div>
      )}

      {/* Summary Counters */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
            <div className="text-xl font-mono font-bold text-white">{summary.total}</div>
            <div className="text-[11px] text-neutral-400 uppercase tracking-wider mt-0.5">
              Total Tests
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="text-xl font-mono font-bold text-emerald-400">{summary.passed}</div>
            <div className="text-[11px] text-emerald-400/80 uppercase tracking-wider mt-0.5">
              Passed
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
            <div className="text-xl font-mono font-bold text-red-400">{summary.failed}</div>
            <div className="text-[11px] text-red-400/80 uppercase tracking-wider mt-0.5">
              Failed
            </div>
          </div>
        </div>
      )}

      {/* Test Results Matrix Table */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Verification Matrix (21 Core Contracts)
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
          {testResults.map((t) => (
            <div
              key={t.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                t.passed
                  ? 'bg-white/5 border-white/5 text-neutral-200'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                {t.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span className="font-semibold text-white truncate">{t.name}</span>
                <span className="text-[10px] text-neutral-500 shrink-0">{t.id}</span>
              </div>
              <span className="text-[11px] text-neutral-400 shrink-0">
                {t.passed ? 'VERIFIED' : t.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Render */}
      <JarvisVoiceSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};
