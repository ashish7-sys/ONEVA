/**
 * ONEVA Phase 24 / Real-JARVIS Evolution: Edge Neural Core & Offline Hybrid Types
 * 
 * Provides high-speed on-device semantic intent extraction, zero-latency vector similarity,
 * multilingual phonetic normalization, and intelligent Edge-Cloud hybrid routing.
 */

export type ExecutionTier = 'LOCAL_EDGE_NEURAL' | 'CLOUD_HYBRID_ESCALATED';

export interface EdgeSemanticSlot {
  name: string;
  value: string | number | boolean;
  confidence: number;
  rawToken: string;
}

export type EdgeActionDomain =
  | 'DEVICE_CONTROL'
  | 'APP_LAUNCH'
  | 'AUTONOMOUS_ROUTINE'
  | 'EPISODIC_MEMORY'
  | 'SELF_HEALING_DIAGNOSTIC'
  | 'MEDIA_PLAYBACK'
  | 'PROACTIVE_SENTINEL'
  | 'GENERAL_KNOWLEDGE'
  | 'CREATIVE_SYNTHESIS'
  | 'CONVERSATION';

export interface EdgeNeuralResolution {
  domain: EdgeActionDomain;
  targetAction: string;
  parameters: Record<string, any>;
  slots: EdgeSemanticSlot[];
  edgeConfidence: number; // 0.0 to 1.0
  latencyMs: number;
  executionTier: ExecutionTier;
  offlineCapable: boolean;
  reasoningVector: string;
  suggestedSpeechEn: string;
  suggestedSpeechHi: string;
}

export interface EdgeNeuralTelemetry {
  totalInferences: number;
  edgeNeuralHits: number;
  cloudEscalations: number;
  averageEdgeLatencyMs: number;
  offlineExecutions: number;
  lastExecutionTier: ExecutionTier;
  lastLatencyMs: number;
  cacheHitRatio: number;
}

export interface EdgeNeuralConfig {
  edgeConfidenceThreshold: number; // default 0.78
  preferOfflineEdge: boolean; // default true for sub-15ms execution
  smartHapticFeedback: boolean;
  enablePhoneticFuzzyMatching: boolean;
}
