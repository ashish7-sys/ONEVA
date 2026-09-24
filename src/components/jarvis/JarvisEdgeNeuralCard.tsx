/**
 * ONEVA Phase 24: Real-JARVIS Edge Neural Core & Offline Hybrid Telemetry Card
 * 
 * Displays real-time on-device latency metrics, edge-cloud split ratio,
 * offline execution indicators, and an interactive test harness.
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Cloud,
  WifiOff,
  Activity,
  CheckCircle2,
  Sliders,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { JarvisEdgeNeuralService } from '../../services/edge/jarvisEdgeNeuralService';
import {
  EdgeNeuralTelemetry,
  EdgeNeuralConfig,
  EdgeNeuralResolution,
} from '../../types/jarvisEdgeNeural';

interface JarvisEdgeNeuralCardProps {
  onToast?: (msg: string) => void;
}

export const JarvisEdgeNeuralCard: React.FC<JarvisEdgeNeuralCardProps> = ({ onToast }) => {
  const [telemetry, setTelemetry] = useState<EdgeNeuralTelemetry>(() =>
    JarvisEdgeNeuralService.getTelemetry()
  );
  const [config, setConfig] = useState<EdgeNeuralConfig>(() =>
    JarvisEdgeNeuralService.getConfig()
  );
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [testPrompt, setTestPrompt] = useState<string>('Torch on karo');
  const [lastResolution, setLastResolution] = useState<EdgeNeuralResolution | null>(null);

  useEffect(() => {
    JarvisEdgeNeuralService.init();

    const unsub = JarvisEdgeNeuralService.subscribe(() => {
      setTelemetry(JarvisEdgeNeuralService.getTelemetry());
      setConfig(JarvisEdgeNeuralService.getConfig());
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsub();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTestInference = (overridePrompt?: string) => {
    const promptToTest = overridePrompt || testPrompt;
    if (!promptToTest.trim()) return;

    const res = JarvisEdgeNeuralService.resolveIntent(promptToTest);
    setLastResolution(res);
    onToast?.(
      res.executionTier === 'LOCAL_EDGE_NEURAL'
        ? `⚡ Edge Neural Hit: ${res.latencyMs}ms latency`
        : `☁️ Cloud Escalation (${res.latencyMs}ms)`
    );
  };

  const handleToggleOfflinePreference = () => {
    const next = !config.preferOfflineEdge;
    JarvisEdgeNeuralService.updateConfig({ preferOfflineEdge: next });
    onToast?.(`Prefer Local Edge Core: ${next ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleThresholdChange = (val: number) => {
    JarvisEdgeNeuralService.updateConfig({ edgeConfidenceThreshold: val });
    onToast?.(`Edge Confidence Threshold: ${(val * 100).toFixed(0)}%`);
  };

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/70 border border-cyan-500/20 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-950">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Edge Neural Core & Offline Engine
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                REAL-JARVIS TIER
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Sub-15ms on-device vector intent classifier with zero-latency execution and seamless Cloud fallback.
            </p>
          </div>
        </div>

        {/* Network & Engine State Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`px-3 py-1 rounded-full text-xs font-mono font-medium border flex items-center gap-1.5 ${
              !isOnline
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {!isOnline ? <WifiOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            <span>{!isOnline ? '100% OFFLINE EDGE' : 'HYBRID EDGE + CLOUD'}</span>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>AVG EDGE LATENCY</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 font-mono">
            {telemetry.averageEdgeLatencyMs} ms
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Zero network lag</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>EDGE HIT RATIO</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300 font-mono">
            {(telemetry.cacheHitRatio * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">
            {telemetry.edgeNeuralHits} on-device / {telemetry.totalInferences} total
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>CLOUD ESCALATIONS</span>
            <Cloud className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-300 font-mono">
            {telemetry.cloudEscalations}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Deep reasoning</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>OFFLINE RUNS</span>
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono">
            {telemetry.offlineExecutions}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">100% resilient</div>
        </div>
      </div>

      {/* Interactive Sub-15ms Latency Test Harness */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/25 via-neutral-950/50 to-neutral-950/50 border border-cyan-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-white flex items-center gap-2 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Edge Latency Tester</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">Benchmarked live</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTestInference()}
            placeholder="e.g., Torch on karo, Brightness 80%, Clean RAM, Deep focus..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900/90 border border-white/10 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={() => handleTestInference()}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs font-mono transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-950"
          >
            <span>Classify</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            'Torch on karo',
            'Screen brightness 90%',
            'Volume 40 karo',
            'Self healing start karo',
            'Morning Genesis routine',
            'Kal humne kya kiya tha?',
            'Who is Tony Stark?',
          ].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setTestPrompt(sample);
                handleTestInference(sample);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-neutral-300 font-mono transition cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Live Result Inspector */}
        {lastResolution && (
          <div className="mt-3 p-3 rounded-xl bg-neutral-950/80 border border-cyan-500/30 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    lastResolution.executionTier === 'LOCAL_EDGE_NEURAL'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  }`}
                >
                  {lastResolution.executionTier}
                </span>
                <span className="text-white font-semibold">
                  {lastResolution.domain} → {lastResolution.targetAction}
                </span>
              </div>
              <span className="text-cyan-400 font-bold">{lastResolution.latencyMs} ms</span>
            </div>

            <div className="text-[11px] text-neutral-400 flex flex-wrap gap-x-4 gap-y-1">
              <span>Confidence: {(lastResolution.edgeConfidence * 100).toFixed(0)}%</span>
              <span>Offline Capable: {lastResolution.offlineCapable ? 'YES' : 'NO'}</span>
              <span>Slots: {lastResolution.slots.length} extracted</span>
            </div>

            <div className="p-2 rounded-lg bg-neutral-900 border border-white/5 text-[11px] text-cyan-200">
              {lastResolution.suggestedSpeechEn}
            </div>
          </div>
        )}
      </div>

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-neutral-950/40 border border-white/5">
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-white mb-2">
            <div className="flex items-center gap-1.5 font-mono">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Confidence Threshold</span>
            </div>
            <span className="font-mono text-cyan-300">
              {(config.edgeConfidenceThreshold * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.50"
            max="0.95"
            step="0.02"
            value={config.edgeConfidenceThreshold}
            onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="text-[10px] text-neutral-500 mt-1">
            Scores above this execute instantly on Edge; below escalate to Cloud.
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-medium text-white font-mono">Prefer Offline Edge</div>
            <div className="text-[10px] text-neutral-400">
              Force edge execution for instant responsiveness
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleOfflinePreference}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              config.preferOfflineEdge ? 'bg-cyan-500' : 'bg-neutral-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                config.preferOfflineEdge ? 'translate-x-5' : 'translate-x-0.5'
              } top-0.5 absolute shadow-md`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
