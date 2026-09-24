/**
 * ONEVA Phase 4 / Phase 23 Evolution: JARVIS Autonomous Self-Healing & Dynamic System Optimization
 * 
 * Defines contracts for:
 * - Subsystem health radar & diagnostics (RAM, Thermals, Tasks, Cache, Core, Battery)
 * - Autonomous self-healing actions & sequential mitigation pipelines
 * - Zombie task reclamation, memory compaction, and thermal throttle dampening
 * - Telemetry aggregations, anomaly detection logs, and tuning configurations
 * - Strict Rule 6 Compliance: Local-first execution with zero external data transmission
 */

export type SubsystemHealthStatus =
  | 'OPTIMAL'
  | 'NOMINAL'
  | 'ATTENTION_REQUIRED'
  | 'DEGRADED'
  | 'CRITICAL';

export type SubsystemType =
  | 'core_engine'
  | 'ram_heap'
  | 'thermal_silicon'
  | 'storage_cache'
  | 'battery_power'
  | 'background_tasks';

export interface SubsystemHealthMetric {
  subsystem: SubsystemType;
  name: string;
  score: number; // 0 to 100%
  status: SubsystemHealthStatus;
  details: string;
  rawMetrics: {
    label: string;
    value: string | number;
    unit?: string;
  }[];
  anomalies: string[];
}

export type SelfHealingActionType =
  | 'ram_compaction'
  | 'thermal_mitigation'
  | 'zombie_task_prune'
  | 'cache_storage_reclaim'
  | 'radio_power_tune'
  | 'full_system_healing';

export interface SelfHealingActionResult {
  actionId: string;
  actionType: SelfHealingActionType;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  startTime: number;
  durationMs: number;
  memoryFreedMb: number;
  thermalDeltaCelsius: number;
  tasksTerminated: number;
  storageFreedKb: number;
  summary: string;
  detailedLogs: string[];
}

export interface SystemAnomaly {
  id: string;
  subsystem: SubsystemType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAt: number;
  description: string;
  autoHealed: boolean;
  healedAt?: number;
  resolutionDetails?: string;
}

export interface PerformanceProfileConfig {
  profile: 'performance' | 'balanced' | 'stark_saver';
  autoHealingEnabled: boolean;
  thermalThresholdCelsius: number;
  ramThresholdPercent: number;
  backgroundTaskMaxLifetimeSec: number;
  cachePruneCadenceMin: number;
}

export interface SelfHealingTelemetry {
  overallScore: number; // 0 to 100%
  systemStatus: SubsystemHealthStatus;
  lastScanTimestamp: number;
  lastHealingTimestamp: number | null;
  totalHealingsExecuted: number;
  activeAnomaliesCount: number;
  subsystems: Record<SubsystemType, SubsystemHealthMetric>;
  recentAnomalies: SystemAnomaly[];
  recentHealingHistory: SelfHealingActionResult[];
  isHealingInProgress: boolean;
}
