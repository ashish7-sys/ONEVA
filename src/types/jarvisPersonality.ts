/**
 * ONEVA Phase 19: Premium Jarvis Voice + Personality Types
 * 
 * Defines the core contracts for:
 * - Respectful addressing (Sir / Ma'am / Neutral / Custom)
 * - Response styling (Concise / Balanced / Detailed)
 * - Voice + Text 7-state synchronization
 * - Text-To-Speech engine configurations & voice descriptors
 */

export type JarvisAddressMode = 'sir' | 'maam' | 'neutral' | 'custom';

export type JarvisPersonalityStyle = 'concise' | 'balanced' | 'detailed';

export type JarvisVoiceStatusPhase19 =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'EXECUTING'
  | 'SPEAKING'
  | 'SUCCESS'
  | 'ERROR';

export interface JarvisTtsVoiceInfo {
  name: string;
  lang: string;
  voiceURI: string;
  isDefault: boolean;
  localService: boolean;
  displayName: string;
}

export type JarvisVoiceGender = 'male' | 'female';

export interface JarvisPersonalityPreferences {
  voiceEnabled: boolean;
  selectedVoiceURI: string; // 'auto' or specific URI
  voiceGender: JarvisVoiceGender; // 'male' (default) or 'female'
  addressMode: JarvisAddressMode;
  customAddressName: string;
  personalityStyle: JarvisPersonalityStyle;
  speechRate: number; // default 0.9x (relaxed, intelligible, confident)
  speechPitch: number; // default 0.88 for male (deep), 1.08 for female (lovely)
  language: 'en' | 'hi' | 'auto';
  naturalPausesEnabled: boolean;
  speakInternalDetails: boolean; // strictly false by default
  updatedAt?: number;
}

export interface TtsSpeechRequest {
  id: string;
  text: string;
  spokenText?: string;
  language?: string;
  gender?: JarvisVoiceGender;
  rate?: number;
  pitch?: number;
  voiceURI?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onInterrupted?: () => void;
}

export interface FormattedJarvisResponse {
  displayText: string;
  spokenText: string;
  addressUsed?: string;
  style: JarvisPersonalityStyle;
  language: 'en' | 'hi';
  isError: boolean;
  isActionSuccess?: boolean;
}

export const DEFAULT_PERSONALITY_PREFERENCES: JarvisPersonalityPreferences = {
  voiceEnabled: true,
  selectedVoiceURI: 'auto',
  voiceGender: 'male',
  addressMode: 'sir',
  customAddressName: 'Sir',
  personalityStyle: 'concise', // User mandate: kam se kam aur samajhne ke layak bole
  speechRate: 0.9, // User mandate: 0.9x speed
  speechPitch: 0.88, // User mandate: male voice thoda deep aur confidence se bhara
  language: 'auto',
  naturalPausesEnabled: true,
  speakInternalDetails: false,
};
