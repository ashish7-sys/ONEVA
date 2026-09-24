/**
 * ONEVA Phase 20 / Evolution Phase 1: JARVIS Proactive Autonomous Sentinel
 * 
 * Defines core contracts for:
 * - Ambient Context Observations (Battery rate, thermals, circadian cycle, eye fatigue)
 * - Proactive Alert / Briefing Object with Actionable Stark Controls
 * - Anti-Spam Gatekeeper and Quiet Hours settings
 * - Morning Briefing & Night Rest Protocols
 */

export type SentinelProactivityLevel = 
  | 'autonomous' // Proactively whispers and surfaces recommendations
  | 'critical_only' // Only interrupts for hardware hazards (overheating, critical battery)
  | 'silent'; // Visual HUD badges only, no audio interruptions

export type SentinelAlertPriority = 'URGENT' | 'HIGH' | 'INFO';

export type SentinelAlertType =
  | 'battery_critical'
  | 'battery_drain'
  | 'battery_full'
  | 'thermal_hazard'
  | 'morning_briefing'
  | 'night_rest'
  | 'storage_warning'
  | 'network_anomaly'
  | 'system_tip';

export interface SentinelAction {
  id: string;
  label: string;
  actionType: string;
  payload?: Record<string, any>;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface JarvisProactiveAlert {
  id: string;
  type: SentinelAlertType;
  priority: SentinelAlertPriority;
  title: string;
  vocalMessage: string;
  details: string;
  timestamp: number;
  expiresAt?: number;
  actions: SentinelAction[];
  dismissed?: boolean;
  actedUpon?: boolean;
  metadata?: Record<string, any>;
}

export interface MorningBriefingConfig {
  enabled: boolean;
  targetHour: number; // 0-23, e.g. 7 for 7 AM
  targetMinute: number;
  includeBattery: boolean;
  includeNetwork: boolean;
  includeWeather: boolean;
  includeHealthTips: boolean;
  lastDeliveredDate?: string; // YYYY-MM-DD
}

export interface NightRestConfig {
  enabled: boolean;
  startHour: number; // e.g. 23 (11 PM)
  endHour: number; // e.g. 6 (6 AM)
  autoEngageEyeComfort: boolean;
  autoDimLuminance: boolean;
  targetWarmthK: number; // e.g. 3200
  targetBrightness: number; // e.g. 25
  lastActivatedDate?: string;
}

export interface SentinelConfig {
  proactivityLevel: SentinelProactivityLevel;
  voiceWhisperEnabled: boolean;
  voiceChimeEnabled: boolean;
  preferredLanguage: 'auto' | 'en' | 'hi' | 'hinglish';
  cooldownMinutes: number; // Minimum gap between vocal alerts (default: 12 mins)
  batteryAlertThreshold: number; // e.g. 15%
  thermalWarningCelsius: number; // e.g. 42°C
  morningBriefing: MorningBriefingConfig;
  nightRest: NightRestConfig;
  onlyInformWhenAwake: boolean; // When true, JARVIS only proactively informs (whispers/chimes) when actively awake
  quietHours: {
    enabled: boolean;
    startHour: number; // e.g. 23
    endHour: number; // e.g. 7
    allowCriticalHazards: boolean; // default true
  };
}

export interface SentinelSystemMetrics {
  totalAlertsSurfaced: number;
  actionsExecuted: number;
  lastVocalAlertTimestamp: number;
  currentRiskLevel: 'NOMINAL' | 'ELEVATED' | 'HAZARD';
  activeAlerts: JarvisProactiveAlert[];
}
