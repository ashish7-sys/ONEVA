/**
 * ONEVA Phase 24: Real-JARVIS Ubiquitous Multi-Device Mesh Relay Types
 * 
 * Defines decentralized node schemas, peer-to-peer relay packets,
 * and audio/state handoff structures across multi-device environments.
 */

export type MeshNodeType =
  | 'PRIMARY_PHONE_CORE'
  | 'SMART_WATCH_NODE'
  | 'DESKTOP_OR_LAB_DISPLAY'
  | 'CAR_INFOTAINMENT_NODE'
  | 'SMART_SPEAKER_SATELLITE';

export interface JarvisMeshNode {
  nodeId: string;
  name: string;
  type: MeshNodeType;
  status: 'ONLINE' | 'STANDBY' | 'RELAYING';
  latencyMs: number;
  signalStrengthDbm: number; // e.g. -42 dBm
  batteryPercent?: number;
  isCurrentActiveSpeaker: boolean;
  isLocalHost: boolean;
  capabilities: Array<'audio_playback' | 'voice_input' | 'display_hud' | 'haptic'>;
  lastPingAt: number;
}

export interface MeshRelayPayload {
  packetId: string;
  sourceNodeId: string;
  targetNodeId: string | 'BROADCAST_ALL';
  type: 'AUDIO_HANDOFF' | 'HUD_MIRROR' | 'SESSION_SYNC' | 'PING' | 'WAKE_RELAY';
  payload: any;
  timestamp: number;
}
