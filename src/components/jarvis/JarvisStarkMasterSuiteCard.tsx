/**
 * ONEVA Phase 25: Real-JARVIS Stark Master Cognitive Suite Card
 * 
 * Interactive holographic dashboard unifying all 7 Stark software cognitive upgrades:
 * 1. Stark Emotional Cadence & Multilingual Wit Engine
 * 2. Real-time Audio Beamforming & DSP Noise Filter (Web Audio API)
 * 3. Tree-of-Thought (ToT) Autonomous Deep Planner & Backtracking
 * 4. Probabilistic "What-If" Monte Carlo Simulation Engine (1,000+ iterations)
 * 5. Continuous Spatial Video Stream & Optical Flow Tracker
 * 6. Multi-Speaker Voice Diarization & Acoustic Threat Vectoring
 * 7. Autonomous Deep Reconnaissance & Intelligence Dossier Synthesizer
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Activity,
  Compass,
  Cpu,
  Eye,
  Sliders,
  Play,
  RotateCw,
  Layers,
  Search,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  Waves,
} from 'lucide-react';
import { JarvisStarkWitEngine, StarkTone } from '../../services/voice/jarvisStarkWitEngine';
import { JarvisAudioDSPFramer, DSPTelemetry } from '../../services/voice/jarvisAudioDSPFramer';
import { JarvisTreeOfThoughtPlanner, TreePlan } from '../../services/intelligence/jarvisTreeOfThoughtPlanner';
import { JarvisWhatIfMonteCarloEngine, SimulationResult } from '../../services/intelligence/jarvisWhatIfMonteCarloEngine';
import { JarvisContinuousSpatialVisionService, SpatialFrameTelemetry } from '../../services/vision/jarvisContinuousSpatialVisionService';
import { JarvisMultiSpeakerDiarizationService, AcousticThreatTelemetry } from '../../services/intelligence/jarvisMultiSpeakerDiarizationService';
import { JarvisDeepReconEngine, IntelligenceDossier } from '../../services/intelligence/jarvisDeepReconEngine';

interface JarvisStarkMasterSuiteCardProps {
  onToast?: (msg: string) => void;
}

export const JarvisStarkMasterSuiteCard: React.FC<JarvisStarkMasterSuiteCardProps> = ({ onToast }) => {
  const [activeTab, setActiveTab] = useState<'WIT' | 'DSP' | 'TOT' | 'SIMULATION' | 'SPATIAL' | 'DIARIZATION' | 'RECON'>('SIMULATION');

  // Module 1: Wit
  const [isWitEnabled, setIsWitEnabled] = useState(JarvisStarkWitEngine.isWitEnabled());
  const [witPreview, setWitPreview] = useState<string>('Always a pleasure watching you work, Sir.');
  const [witTone, setWitTone] = useState<StarkTone>('BRITISH_WIT');

  // Module 2: DSP
  const [dspTelemetry, setDspTelemetry] = useState<DSPTelemetry>(() => JarvisAudioDSPFramer.getTelemetry());

  // Module 3: Tree of Thought
  const [treePlan, setTreePlan] = useState<TreePlan | null>(() => JarvisTreeOfThoughtPlanner.getActivePlan());
  const [totPrompt, setTotPrompt] = useState('Optimize thermal envelope and local vector index');

  // Module 4: What-If Monte Carlo
  const [simResult, setSimResult] = useState<SimulationResult | null>(() => JarvisWhatIfMonteCarloEngine.getLastResult());
  const [simPrompt, setSimPrompt] = useState('High-G atmospheric maneuver');
  const [isSimulating, setIsSimulating] = useState(false);

  // Module 5: Spatial Vision
  const [spatialTelemetry, setSpatialTelemetry] = useState<SpatialFrameTelemetry>(() => JarvisContinuousSpatialVisionService.getTelemetry());

  // Module 6: Diarization
  const [diarization, setDiarization] = useState<AcousticThreatTelemetry>(() => JarvisMultiSpeakerDiarizationService.getTelemetry());

  // Module 7: Deep Recon Dossier
  const [dossier, setDossier] = useState<IntelligenceDossier | null>(() => JarvisDeepReconEngine.getLastDossier());
  const [reconSubject, setReconSubject] = useState('Stark Perimeter & Battery Dissipation');

  useEffect(() => {
    // DSP subscription
    const unsubDsp = JarvisAudioDSPFramer.subscribe(() => {
      setDspTelemetry(JarvisAudioDSPFramer.getTelemetry());
    });
    // Tree-of-Thought subscription
    const unsubTot = JarvisTreeOfThoughtPlanner.subscribe(() => {
      setTreePlan(JarvisTreeOfThoughtPlanner.getActivePlan());
    });
    // Simulation subscription
    const unsubSim = JarvisWhatIfMonteCarloEngine.subscribe(() => {
      setSimResult(JarvisWhatIfMonteCarloEngine.getLastResult());
    });
    // Spatial subscription
    const unsubSpatial = JarvisContinuousSpatialVisionService.subscribe(() => {
      setSpatialTelemetry(JarvisContinuousSpatialVisionService.getTelemetry());
    });
    // Diarization subscription
    const unsubDiar = JarvisMultiSpeakerDiarizationService.subscribe(() => {
      setDiarization(JarvisMultiSpeakerDiarizationService.getTelemetry());
    });
    // Recon subscription
    const unsubRecon = JarvisDeepReconEngine.subscribe(() => {
      setDossier(JarvisDeepReconEngine.getLastDossier());
    });

    return () => {
      unsubDsp();
      unsubTot();
      unsubSim();
      unsubSpatial();
      unsubDiar();
      unsubRecon();
    };
  }, []);

  // Handlers
  const handleGenerateWit = (lang: 'en' | 'hi') => {
    const res = JarvisStarkWitEngine.generateWitSnippet({
      lang,
      tone: witTone,
      context: 'task_success',
      stressPercent: 25,
    });
    setWitPreview(res.text);
    onToast?.(`Wit preview [${lang.toUpperCase()}]: ${res.text}`);
  };

  const handleToggleWit = () => {
    const next = !isWitEnabled;
    JarvisStarkWitEngine.setWitEnabled(next);
    setIsWitEnabled(next);
    onToast?.(next ? 'Stark British wit enabled.' : 'Stark wit muted (strictly factual).');
  };

  const handleToggleDsp = async () => {
    if (!dspTelemetry.isActive) {
      await JarvisAudioDSPFramer.initDSP();
      JarvisAudioDSPFramer.toggleDSP(true);
      onToast?.('Acoustic Beamforming & DSP 300Hz-3400Hz filter activated.');
    } else {
      JarvisAudioDSPFramer.toggleDSP(false);
      onToast?.('Acoustic DSP filter bypassed.');
    }
  };

  const handleRunToT = () => {
    const plan = JarvisTreeOfThoughtPlanner.generatePlan(totPrompt);
    setTreePlan(plan);
    onToast?.(`Tree-of-Thought decomposed into ${plan.nodes.length} cognitive nodes.`);
  };

  const handleAdvanceToT = (success: boolean) => {
    JarvisTreeOfThoughtPlanner.advanceStep(success);
    if (success) {
      onToast?.('Advanced to next cognitive node.');
    } else {
      onToast?.('Safety backtrack triggered: auto-rerouting to fallback branch.');
    }
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = JarvisWhatIfMonteCarloEngine.runSimulation(simPrompt);
      setSimResult(res);
      setIsSimulating(false);
      onToast?.(`Monte Carlo 1,000 cycles complete: ${res.successProbabilityPercent}% success probability.`);
    }, 400);
  };

  const handleToggleSpatial = () => {
    if (spatialTelemetry.isStreaming) {
      JarvisContinuousSpatialVisionService.stopSpatialLoop();
      onToast?.('Continuous spatial perception loop paused.');
    } else {
      JarvisContinuousSpatialVisionService.startSpatialLoop();
      onToast?.('Continuous 8-FPS optical flow spatial tracking active.');
    }
  };

  const handleTriggerAcousticAnalysis = () => {
    const res = JarvisMultiSpeakerDiarizationService.processUtteranceAcoustics(35, 128);
    setDiarization(res);
    onToast?.(`Acoustic diarization verified: Speaker ${res.activeSpeakerId} | Stress ${res.acousticStressLevelPercent}%`);
  };

  const handleGenerateDossier = () => {
    const res = JarvisDeepReconEngine.compileDossier(reconSubject);
    setDossier(res);
    onToast?.(`Intelligence Dossier compiled: ${res.corroborationScorePercent}% corroboration score.`);
  };

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/80 border border-cyan-500/20 backdrop-blur-xl space-y-6 shadow-2xl relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Stark Master Cognitive Suite (Phase 25)
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Real-JARVIS Grade
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            7 Advanced software-level cognitive layers: Multilingual wit, DSP noise gating, ToT planning, Monte Carlo, spatial vision, speaker diarization, and recon dossiers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/5 self-start">
          {[
            { id: 'SIMULATION', label: 'What-If (1k)', icon: Activity },
            { id: 'WIT', label: 'Stark Wit', icon: Volume2 },
            { id: 'DSP', label: 'Audio DSP', icon: Waves },
            { id: 'TOT', label: 'ToT Planner', icon: Layers },
            { id: 'SPATIAL', label: 'Spatial Loop', icon: Eye },
            { id: 'DIARIZATION', label: 'Speaker ID', icon: ShieldCheck },
            { id: 'RECON', label: 'Recon Dossier', icon: Search },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: WHAT-IF MONTE CARLO SIMULATION */}
      {activeTab === 'SIMULATION' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={simPrompt}
              onChange={(e) => setSimPrompt(e.target.value)}
              placeholder="e.g. Atmospheric reentry or High-volume vector query"
              className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold font-mono flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              Run 1,000 Cycles
            </button>
          </div>

          {simResult && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
              {/* Stat Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 text-center">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase block">Success Rate</span>
                  <span className="text-xl font-bold text-cyan-400 font-mono">
                    {simResult.successProbabilityPercent}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 text-center">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase block">Median (P50)</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono">
                    {simResult.p50Value}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 text-center">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase block">90th %ile (P90)</span>
                  <span className="text-xl font-bold text-amber-400 font-mono">
                    {simResult.p90Value}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 text-center">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase block">Risk Index</span>
                  <span className="text-xl font-bold text-rose-400 font-mono">
                    {simResult.riskIndexPercent}%
                  </span>
                </div>
              </div>

              {/* Stochastic Curve Histogram (25 bins) */}
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5 block">
                  Probability Density Function (1,000 Stochastic Iterations)
                </span>
                <div className="h-16 flex items-end gap-1 px-2 py-1 bg-neutral-950/80 rounded-xl border border-white/5">
                  {simResult.distributionPoints.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm hover:brightness-125 transition-all"
                      style={{ height: `${Math.max(4, val * 100)}%` }}
                      title={`Bin ${idx + 1}: ${(val * 100).toFixed(1)}%`}
                    />
                  ))}
                </div>
              </div>

              {/* Vocal Readouts */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-cyan-500/20 text-xs font-mono text-cyan-200">
                  <span className="text-[10px] text-cyan-400 block font-bold mb-0.5">🇬🇧 JARVIS VOCAL (EN):</span>
                  "{simResult.vocalReportEn}"
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-emerald-500/20 text-xs font-mono text-emerald-200">
                  <span className="text-[10px] text-emerald-400 block font-bold mb-0.5">🇮🇳 JARVIS VOCAL (HI):</span>
                  "{simResult.vocalReportHi}"
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STARK WIT & EMOTIONAL CADENCE */}
      {activeTab === 'WIT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5">
            <div>
              <span className="text-xs font-mono font-medium text-white block">Stark British Wit & Sarcasm Engine</span>
              <span className="text-[11px] text-neutral-400">Contextual wit in English, Hindi, and Hinglish with dynamic prosody pauses.</span>
            </div>
            <button
              type="button"
              onClick={handleToggleWit}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                isWitEnabled ? 'bg-cyan-500 text-black' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {isWitEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-mono text-neutral-400 uppercase">Tone Matrix:</span>
              {(['BRITISH_WIT', 'CALM_REASSURANCE', 'SCIENTIFIC_PRECISION', 'PLAYFUL_BANTER'] as StarkTone[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setWitTone(t)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                    witTone === t ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-neutral-400'
                  }`}
                >
                  {t.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleGenerateWit('en')}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-mono transition cursor-pointer"
              >
                Preview English Wit
              </button>
              <button
                type="button"
                onClick={() => handleGenerateWit('hi')}
                className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-xs text-cyan-300 font-mono transition cursor-pointer border border-cyan-500/30"
              >
                Preview Hindi Wit (हिंदी)
              </button>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/80 border border-cyan-500/20 text-xs font-mono text-neutral-200">
              <span className="text-[10px] text-cyan-400 block font-bold mb-1 uppercase tracking-wider">Simulated Output:</span>
              "{witPreview}"
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIO BEAMFORMING & DSP */}
      {activeTab === 'DSP' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5">
            <div>
              <span className="text-xs font-mono font-medium text-white block">300Hz-3400Hz Vocal Bandpass & Noise Gate</span>
              <span className="text-[11px] text-neutral-400">Web Audio API hardware-integrated DSP strips room echo & background noise.</span>
            </div>
            <button
              type="button"
              onClick={handleToggleDsp}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                dspTelemetry.isActive ? 'bg-cyan-500 text-black' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {dspTelemetry.isActive ? 'DSP ACTIVE' : 'BYPASS'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block">SNR Ratio</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">{dspTelemetry.snrDb} dB</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block">Voice Level</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{dspTelemetry.voiceLevelDb} dB</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block">Noise Floor</span>
              <span className="text-lg font-bold text-neutral-400 font-mono">{dspTelemetry.noiseFloorDb} dB</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block">Center Freq</span>
              <span className="text-lg font-bold text-amber-400 font-mono">{dspTelemetry.bandpassFrequencyHz} Hz</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TREE OF THOUGHT DEEP PLANNER */}
      {activeTab === 'TOT' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={totPrompt}
              onChange={(e) => setTotPrompt(e.target.value)}
              placeholder="Deep objective prompt..."
              className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleRunToT}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold font-mono transition cursor-pointer"
            >
              Generate ToT Tree
            </button>
          </div>

          {treePlan && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Plan: {treePlan.planId}</span>
                <span className="text-cyan-400 font-bold">Progress: {treePlan.overallProgressPercent}%</span>
              </div>

              {/* Nodes Pipeline */}
              <div className="space-y-2">
                {treePlan.nodes.map((n, i) => (
                  <div
                    key={n.nodeId}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition ${
                      n.status === 'COMPLETED'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : n.status === 'EXECUTING'
                        ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-300 animate-pulse'
                        : n.status === 'BACKTRACKED'
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                        : 'bg-neutral-900/40 border-white/5 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                        {n.stepNumber}
                      </span>
                      <div>
                        <span className="block font-bold">{n.title}</span>
                        <span className="text-[10px] opacity-75">{n.titleHi}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] opacity-80 font-mono">
                        {(n.confidenceScore * 100).toFixed(0)}% conf
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10">
                        {n.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleAdvanceToT(true)}
                  className="flex-1 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono border border-emerald-500/30 transition cursor-pointer"
                >
                  Advance Step (Success)
                </button>
                <button
                  type="button"
                  onClick={() => handleAdvanceToT(false)}
                  className="flex-1 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-mono border border-rose-500/30 transition cursor-pointer"
                >
                  Simulate Block & Backtrack
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SPATIAL VIDEO & OPTICAL FLOW */}
      {activeTab === 'SPATIAL' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5">
            <div>
              <span className="text-xs font-mono font-medium text-white block">Continuous 8-FPS Spatial Perception Loop</span>
              <span className="text-[11px] text-neutral-400">Lightweight on-device luminance differential tracking without cloud latency.</span>
            </div>
            <button
              type="button"
              onClick={handleToggleSpatial}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                spatialTelemetry.isStreaming ? 'bg-cyan-500 text-black' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {spatialTelemetry.isStreaming ? 'STREAMING' : 'PAUSED'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block">Scene State</span>
              <span className="text-sm font-bold text-cyan-400 font-mono uppercase">{spatialTelemetry.sceneState}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block">Motion Flux</span>
              <span className="text-lg font-bold text-amber-400 font-mono">{spatialTelemetry.motionIndexPercent}%</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block">Luminance</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{spatialTelemetry.luminanceLevelPercent}%</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block">Loop Rate</span>
              <span className="text-lg font-bold text-neutral-300 font-mono">{spatialTelemetry.fps} FPS</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SPEAKER DIARIZATION & THREAT VECTORS */}
      {activeTab === 'DIARIZATION' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5">
            <div>
              <span className="text-xs font-mono font-medium text-white block">Acoustic Speaker Diarization & Threat Assessment</span>
              <span className="text-[11px] text-neutral-400">Verifies owner timbre & detects secondary voices/stress on-device.</span>
            </div>
            <button
              type="button"
              onClick={handleTriggerAcousticAnalysis}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-medium transition cursor-pointer"
            >
              Analyze Vocal Frame
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block">Posture</span>
              <span className="text-sm font-bold text-emerald-400 font-mono uppercase">{diarization.threatClassification}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block">Vocal Stress</span>
              <span className="text-lg font-bold text-amber-400 font-mono">{diarization.acousticStressLevelPercent}%</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <span className="text-[10px] text-neutral-400 font-mono uppercase block">Deception Index</span>
              <span className="text-lg font-bold text-rose-400 font-mono">{diarization.deceptionProbabilityPercent}%</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AUTONOMOUS DEEP RECON DOSSIER */}
      {activeTab === 'RECON' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={reconSubject}
              onChange={(e) => setReconSubject(e.target.value)}
              placeholder="Dossier subject..."
              className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleGenerateDossier}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold font-mono transition cursor-pointer"
            >
              Compile Dossier
            </button>
          </div>

          {dossier && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Subject: {dossier.subject}</span>
                <span className="text-cyan-400 font-bold">Corroboration: {dossier.corroborationScorePercent}%</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/80 border border-cyan-500/20 text-xs font-mono text-cyan-200">
                <span className="text-[10px] text-cyan-400 font-bold block mb-1 uppercase">Executive Briefing (EN):</span>
                "{dossier.executiveSummaryEn}"
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/80 border border-emerald-500/20 text-xs font-mono text-emerald-200">
                <span className="text-[10px] text-emerald-400 font-bold block mb-1 uppercase">Executive Briefing (HI):</span>
                "{dossier.executiveSummaryHi}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
