/**
 * ONEVA Phase 21: Jarvis Hand Control & Gesture Automation
 * 
 * Type definitions for modular gesture recognition, camera streams,
 * security pipeline mappings, custom gesture feature extraction,
 * and actor-scoped configurations.
 */

import { JarvisToolId } from './jarvisActions';

export type HandGestureType =
  | 'open_palm'
  | 'closed_fist'
  | 'thumbs_up'
  | 'swipe_left'
  | 'swipe_right'
  | 'swipe_up'
  | 'swipe_down'
  | 'two_finger_point'
  | 'custom_gesture';

export type HandControlActivationMethod =
  | 'manual'
  | 'double_snap'
  | 'voice_wake'
  | 'quick_tile';

export type HandControlActionType =
  | 'tool'                 // Standard registered Jarvis tool (open_app, search_web, etc.)
  | 'phase20_stop_task'    // Stop/cancel active running work task
  | 'phase20_close_panel'  // Close Work Panel UI while task continues in background
  | 'phase20_next_task'    // Switch/focus next background work task
  | 'confirm_pending'      // Confirm currently pending confirmation action
  | 'navigate_back'        // System / screen back
  | 'navigate_home'        // System / screen home
  | 'toggle_edge_glow'     // Trigger ambient edge illumination
  | 'show_system_info';    // Display verified device status

export interface HandControlActionTarget {
  actionType: HandControlActionType;
  toolId?: JarvisToolId;
  args?: Record<string, unknown>;
  label: string;
  description: string;
  requiresConfirmation?: boolean;
  requiresOwnerAuth?: boolean;
}

export interface HandControlMapping {
  id: string;
  gestureType: HandGestureType;
  customGestureId?: string;
  label: string;
  description: string;
  action: HandControlActionTarget;
  enabled: boolean;
  cooldownOverrideMs?: number;
}

export interface CustomGestureDefinition {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  featureVector: number[]; // Normalized motion/shape characteristics
  sampleFramesCount: number;
  threshold: number;
  actorType: 'owner' | 'secondary';
  action: HandControlActionTarget;
  sourceType: 'live_camera' | 'video_upload';
}

export interface HandControlConfig {
  enabled: boolean;
  activationMethod: HandControlActivationMethod;
  confidenceThreshold: number; // 0.0 - 1.0 (default 0.65)
  cooldownMs: number;          // Minimum duration between triggers (default 1200ms)
  holdDurationMs: number;      // Stable posture duration before trigger (default 250ms)
  showHints: boolean;
  showPreviewPill: boolean;
  hapticFeedback: boolean;
  voiceConfirmation: boolean;
  cameraFacing: 'user' | 'environment';
  isMirrored: boolean;
  mappings: HandControlMapping[];
  customGestures: CustomGestureDefinition[];
}

export type CameraPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface GestureDetectionFrame {
  detectedGesture: HandGestureType | null;
  confidence: number;
  timestamp: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  motionVector?: { dx: number; dy: number };
  handDetected: boolean;
  isHolding: boolean;
  holdProgress: number; // 0.0 to 1.0
  customMatchId?: string;
}

export interface HandControlEvent {
  id: string;
  gesture: HandGestureType;
  confidence: number;
  timestamp: number;
  mappingId?: string;
  actionLabel: string;
  executionStatus:
    | 'EXECUTED'
    | 'REJECTED_CONFIDENCE'
    | 'REJECTED_COOLDOWN'
    | 'CONFIRMATION_REQUIRED'
    | 'PERMISSION_REQUIRED'
    | 'FAILED';
  resultMessage?: string;
  technicalDetails?: string;
}

export interface HandControlServiceState {
  isActive: boolean;
  isCameraActive: boolean;
  cameraPermission: CameraPermissionState;
  activeGesture: HandGestureType | null;
  activeConfidence: number;
  isInCooldown: boolean;
  cooldownRemainingMs: number;
  lastEvent: HandControlEvent | null;
  recentEvents: HandControlEvent[];
  config: HandControlConfig;
  currentHint: string;
}
