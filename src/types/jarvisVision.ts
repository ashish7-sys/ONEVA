/**
 * ONEVA JARVIS Continuous Multimodal Vision Types
 * Problem 4: Real JARVIS Level Eyes & Environment Perception Engine
 */

export type VisionPerceptionMode =
  | 'continuous_ambient'
  | 'interactive_query'
  | 'sentinel_watch'
  | 'document_ocr'
  | 'hardware_inspector';

export type VisionCadence = 2 | 3 | 5 | 10 | 15 | 30 | 60; // Cadence in seconds for continuous perception

export type CameraFeedSource =
  | 'hardware_camera'
  | 'simulation_circuit'
  | 'simulation_document'
  | 'simulation_desk'
  | 'simulation_room'
  | 'simulation_product';

export type CameraFacing = 'environment' | 'user';

export interface BoundingBox {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  width: number; // 0 to 100 percentage
  height: number; // 0 to 100 percentage
}

export interface DetectedObject {
  id: string;
  label: string;
  category: 'hardware' | 'electronics' | 'document' | 'hazard' | 'person' | 'device' | 'general';
  confidence: number; // 0 to 1
  boundingBox?: BoundingBox;
  description?: string;
}

export interface OpticalMetrics {
  luxEstimate: number; // 0 - 2000 lux
  lightingCondition: 'low_light' | 'balanced' | 'bright' | 'harsh';
  motionScore: number; // 0 - 100%
  dominantRgb: [number, number, number];
  fps: number;
  captureLatencyMs: number;
  shutterFrozen: boolean;
}

export interface VisionAnalysisResult {
  id: string;
  timestamp: number;
  queryPrompt: string;
  sceneSummary: string;
  detectedObjects: DetectedObject[];
  extractedText?: string;
  spatialHazardAssessment?: string;
  technicalInspection?: string;
  actionableSuggestions: string[];
  jarvisSpokenResponse: string;
  focalPoint?: { x: number; y: number }; // percentage 0-100
  executionDurationMs: number;
  source: 'gemini_3.8_flash' | 'local_neural_cv' | 'simulation_feed';
  snapshotDataUrl?: string; // transient preview thumbnail (in-memory only)
}

export interface SentinelTriggerConfig {
  triggerOnMotion: boolean;
  motionThreshold: number; // 0 - 100
  triggerOnHazard: boolean;
  triggerOnTextChange: boolean;
  alertVoiceChime: boolean;
  userWatchInstruction: string;
}

export interface JarvisVisionTelemetry {
  isActive: boolean;
  isStreaming: boolean;
  isAnalyzing: boolean;
  mode: VisionPerceptionMode;
  cadenceSeconds: VisionCadence;
  feedSource: CameraFeedSource;
  activeCameraFacing: CameraFacing;
  cameraPermissionGranted: boolean;
  framesProcessed: number;
  totalQueriesHandled: number;
  sentinelAlertsTriggered: number;
  lastAnalysisTimestamp: number | null;
  lastError: string | null;
}

export interface VisionPresetScene {
  id: CameraFeedSource;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  defaultPrompt: string;
  syntheticObjects: DetectedObject[];
  syntheticText: string;
  syntheticHazard?: string;
}
