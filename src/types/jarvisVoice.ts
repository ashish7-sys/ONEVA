/**
 * ONEVA Phase 10: Jarvis Voice & Wake System Types
 */

export type JarvisVoiceState =
  | 'SLEEPING'
  | 'LISTENING_FOR_WAKE'
  | 'AWAKE'
  | 'LISTENING_FOR_COMMAND'
  | 'PROCESSING'
  | 'RESPONDING'
  | 'ERROR'
  | 'UNAVAILABLE';

export interface VoiceRecognitionResult {
  transcript: string;
  confidence?: number;
  language?: string;
  isFinal: boolean;
  timestamp: number;
}

export interface WakeNameDetectionResult {
  addressedToJarvis: boolean;
  matchedWakeName?: string;
  remainingCommand: string;
  rawTranscript: string;
  naturalPrefixFound?: string; // e.g., 'hey', 'listen'
}

export type VoiceErrorCode =
  | 'permission_denied'
  | 'not_supported'
  | 'network_error'
  | 'no_speech'
  | 'aborted'
  | 'background_restricted'
  | 'unknown';

export interface VoiceRecognitionError {
  code: VoiceErrorCode;
  message: string;
  details?: unknown;
}

export type VoiceProviderState = 'idle' | 'listening' | 'error' | 'unavailable';

export interface VoiceListenOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface VoiceRecognitionProvider {
  readonly id: string;
  readonly name: string;
  isSupported(): boolean;
  isAvailable(): Promise<boolean>;
  checkPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'>;
  requestPermission(): Promise<boolean>;
  startListening(options?: VoiceListenOptions): Promise<void>;
  stopListening(): Promise<void>;
  onResult(callback: (result: VoiceRecognitionResult) => void): () => void;
  onError(callback: (error: VoiceRecognitionError) => void): () => void;
  onStateChange(callback: (state: VoiceProviderState) => void): () => void;
}

export type JarvisSupportedLanguage = 'en' | 'hi' | 'pa' | 'hr' | 'auto';

export type JarvisPipelineMode = 'full_duplex' | 'turn_based';

export type BargeInSensitivity = 'high' | 'balanced' | 'conservative' | 'aggressive' | 'relaxed';

export type JarvisDuplexState =
  | 'IDLE'
  | 'LISTENING'
  | 'JARVIS_SPEAKING'
  | 'USER_INTERRUPTING'
  | 'BARGE_IN_TRIGGERED';

export interface JarvisDuplexTelemetry {
  pipelineMode: JarvisPipelineMode;
  duplexState: JarvisDuplexState;
  isMicActive: boolean;
  isJarvisSpeaking: boolean;
  isEchoGuardActive: boolean;
  bargeInCount: number;
  lastBargeInTimestamp: number | null;
  lastBargeInReason: string | null;
  currentlySpeakingText: string;
  echoFilteredCount: number;
  totalTurns: number;
}

export interface JarvisVoiceSettings {
  enabledWakeNames: string[];
  customWakeNames: string[];
  selectedLanguage: JarvisSupportedLanguage;
  activeSessionTimeoutMs: number;
  lastUsedAlias?: string;
  autoListenAfterWake: boolean;
  voiceSoundEffects: boolean;
  screenOffWakeEnabled: boolean;
  screenWakeOnDetection: boolean;
  hapticFeedbackOnWake: boolean;
  audioChimeOnWake: boolean;
  // Problem 3: Voice Pipeline - Full-Duplex vs Turn-Based
  pipelineMode: JarvisPipelineMode;
  bargeInEnabled: boolean;
  selfVoiceCancellation: boolean;
  bargeInSensitivity: BargeInSensitivity;
  audioDuckingEnabled: boolean;
  continuousTurnTakingTimeoutMs: number;
}

export const DEFAULT_WAKE_NAMES: readonly string[] = [
  'Jarvis',
  'Ultron',
  'Siri',
  'Google',
  'Friday',
  'Boss',
  'Alexa',
];

export const JARVIS_ACTIVE_SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes default
export const JARVIS_AWAKE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes (120,000 ms) default post-command awake timeout
