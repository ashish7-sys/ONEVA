/**
 * ONEVA Phase 24: Real-JARVIS Biometric Sensing & Optical PPG Telemetry Card
 * 
 * Non-invasive Camera Photoplethysmography (rPPG) & Acoustic Vocal Micro-Tremor
 * Holographic Health Dashboard.
 */

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  Wind,
  ShieldCheck,
  Zap,
  Camera,
  RefreshCw,
  Mic,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { JarvisBiometricsService } from '../../services/biometrics/jarvisBiometricsService';
import {
  JarvisVitalsState,
  AcousticTremorMetrics,
  PPGDiagnostics,
} from '../../types/jarvisBiometrics';

interface JarvisBiometricsCardProps {
  onToast?: (msg: string) => void;
}

export const JarvisBiometricsCard: React.FC<JarvisBiometricsCardProps> = ({ onToast }) => {
  const [vitals, setVitals] = useState<JarvisVitalsState>(() =>
    JarvisBiometricsService.getVitals()
  );
  const [acoustic, setAcoustic] = useState<AcousticTremorMetrics>(() =>
    JarvisBiometricsService.getAcousticMetrics()
  );
  const [ppg, setPpg] = useState<PPGDiagnostics>(() =>
    JarvisBiometricsService.getPPGDiagnostics()
  );

  useEffect(() => {
    JarvisBiometricsService.init();
    const unsub = JarvisBiometricsService.subscribe(() => {
      setVitals(JarvisBiometricsService.getVitals());
      setAcoustic(JarvisBiometricsService.getAcousticMetrics());
      setPpg(JarvisBiometricsService.getPPGDiagnostics());
    });
    return unsub;
  }, []);

  const handleStartScan = () => {
    onToast?.('Initiating optical camera PPG micro-vascular scan...');
    JarvisBiometricsService.startOpticalScan((newVitals) => {
      onToast?.(
        `✅ Optical scan complete: ${newVitals.heartRateBpm} BPM | SpO2 ${newVitals.bloodOxygenSpO2}%`
      );
    });
  };

  // Convert waveform points into SVG polyline points
  const svgWaveformPoints = ppg.waveformPoints
    .map((val, idx) => {
      const x = (idx / Math.max(1, ppg.waveformPoints.length - 1)) * 260;
      const y = 45 - val * 35;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/70 border border-rose-500/20 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-sm shadow-rose-950">
            <Heart className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Stark Biometric Sensing & Telemetry
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                REAL-JARVIS TIER
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Non-invasive Camera Photoplethysmography (rPPG) and acoustic vocal tremor diagnostics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% EPHEMERAL ON-DEVICE</span>
          </div>
        </div>
      </div>

      {/* Holographic Pulse Oscilloscope & Scan Banner */}
      <div className="p-4 rounded-2xl bg-neutral-950/80 border border-rose-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Optical Arterial Pulse Waveform (PPG)
            </span>
          </div>
          <span className="text-[10px] font-mono text-rose-400">
            {ppg.isScanning ? `SCANNING ${ppg.scanProgress}%` : 'CONTINUOUS TELEMETRY'}
          </span>
        </div>

        {/* Live SVG Waveform Canvas */}
        <div className="w-full h-16 bg-neutral-900/90 rounded-xl border border-white/5 relative overflow-hidden flex items-center px-4">
          <svg className="w-full h-full" viewBox="0 0 260 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="roseGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fb7185" stopOpacity="1" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="url(#roseGlow)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={svgWaveformPoints}
            />
          </svg>

          {ppg.isScanning && (
            <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-center backdrop-blur-[1px]">
              <div className="flex items-center gap-2 text-xs font-mono text-rose-200">
                <Camera className="w-4 h-4 animate-spin text-rose-400" />
                <span>Scanning facial micro-vascular flux...</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] font-mono text-neutral-400">
            Signal Quality: <span className="text-emerald-400 font-bold">{ppg.signalQualityPercent}%</span>
          </span>

          <button
            type="button"
            onClick={handleStartScan}
            disabled={ppg.isScanning}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-950"
          >
            {ppg.isScanning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
            <span>Scan Optical Vitals</span>
          </button>
        </div>
      </div>

      {/* Core Vitals Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>CARDIAC RATE</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          </div>
          <div className="text-xl font-bold text-rose-300 font-mono">
            {vitals.heartRateBpm} <span className="text-xs text-neutral-400">BPM</span>
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">HRV: {vitals.hrvMs}ms</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>BLOOD OXYGEN</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 font-mono">
            {vitals.bloodOxygenSpO2}% <span className="text-xs text-neutral-400">SpO2</span>
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Arterial saturation</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>RESPIRATION</span>
            <Wind className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-300 font-mono">
            {vitals.respirationRateBpm} <span className="text-xs text-neutral-400">br/min</span>
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Thoracic rhythm</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>COGNITIVE STRESS</span>
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono">
            {vitals.stressLevelPercent}%
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Vocal Fatigue: {vitals.vocalFatiguePercent}%</div>
        </div>
      </div>

      {/* Acoustic Vocal Micro-Tremor Telemetry */}
      <div className="p-4 rounded-2xl bg-neutral-950/40 border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span>Acoustic Vocal Tremor & Jitter Diagnostics</span>
          </div>
          <span className="text-[10px] text-neutral-400">Computed on utterance</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="p-2 rounded-xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <div className="text-[10px] text-neutral-400">PITCH JITTER</div>
            <div className="text-rose-300 font-bold">{acoustic.jitterPercent}%</div>
          </div>
          <div className="p-2 rounded-xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <div className="text-[10px] text-neutral-400">SHIMMER</div>
            <div className="text-rose-300 font-bold">{acoustic.shimmerPercent}%</div>
          </div>
          <div className="p-2 rounded-xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <div className="text-[10px] text-neutral-400">FUNDAMENTAL F0</div>
            <div className="text-rose-300 font-bold">{acoustic.fundamentalFreqHz} Hz</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs font-mono text-rose-200 flex items-center justify-between">
          <span>Stark Medical Diagnosis:</span>
          <span className="font-bold text-white uppercase">{vitals.overallStatus.replace(/_/g, ' ')}</span>
        </div>
      </div>
    </div>
  );
};
