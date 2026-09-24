/**
 * ONEVA Phase 24 / Real-JARVIS Biometric Sensing Types
 * 
 * Non-invasive optical Photoplethysmography (PPG) and
 * acoustic vocal micro-tremor stress diagnostic schemas.
 */

export type VitalHealthStatus =
  | 'OPTIMAL_STARK_CONDITIONS'
  | 'MILD_COGNITIVE_STRESS'
  | 'ELEVATED_HEART_RATE'
  | 'VOCAL_FATIGUE_DETECTED'
  | 'REST_RECOMMENDED';

export interface JarvisVitalsState {
  heartRateBpm: number;
  hrvMs: number; // Heart Rate Variability
  bloodOxygenSpO2: number; // 95 - 99%
  respirationRateBpm: number; // Breaths/min
  stressLevelPercent: number; // 0 - 100%
  vocalFatiguePercent: number; // 0 - 100%
  overallStatus: VitalHealthStatus;
  lastUpdated: number;
}

export interface AcousticTremorMetrics {
  jitterPercent: number;
  shimmerPercent: number;
  fundamentalFreqHz: number;
  vocalStrainRatio: number;
  speakingCadenceWpm: number;
}

export interface PPGDiagnostics {
  isScanning: boolean;
  scanProgress: number; // 0 - 100%
  signalQualityPercent: number;
  waveformPoints: number[];
}
