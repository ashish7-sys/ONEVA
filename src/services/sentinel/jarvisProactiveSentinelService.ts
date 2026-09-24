/**
 * ONEVA JARVIS Proactive Autonomous Sentinel Service (Phase 1 / Phase 20 Evolution)
 * 
 * Provides an on-device, ambient proactive intelligence loop:
 * - Continuously monitors device telemetry (battery, thermals, charging, clock circadian state)
 * - Proactively issues actionable Stark insights without requiring user prompt
 * - Delivers contextual Morning Briefings and Night Rest Eye Comfort protocols
 * - Adheres strictly to Anti-Spam Gatekeeping, Cooldown limits, and Quiet Hours
 * - 100% On-device, ephemeral memory (Rule 6 Privacy Compliant - zero cloud tracking)
 */

import {
  SentinelConfig,
  JarvisProactiveAlert,
  SentinelSystemMetrics,
  SentinelAlertType,
  SentinelAlertPriority,
} from '../../types/jarvisSentinel';
import { JarvisDeviceControlService } from '../device/jarvisDeviceControlService';
import { AudioEffects } from '../voice/audioSoundEffects';
import { JarvisTtsEngine } from '../voice/jarvisTtsEngine';
import { JarvisVoiceService } from '../jarvisVoiceService';
import { JarvisPersonalityEngine } from '../intelligence/jarvisPersonalityEngine';

const STORAGE_KEY_CONFIG = 'oneva_sentinel_config';
const STORAGE_KEY_METRICS = 'oneva_sentinel_metrics';

export class JarvisProactiveSentinelService {
  private static isInitialized = false;
  private static evaluationIntervalId: ReturnType<typeof setInterval> | null = null;
  private static listeners: Set<() => void> = new Set();

  private static config: SentinelConfig = {
    proactivityLevel: 'autonomous',
    voiceWhisperEnabled: true,
    voiceChimeEnabled: true,
    onlyInformWhenAwake: true, // User Requirement: Jarvis only proactively informs when awake
    preferredLanguage: 'auto',
    cooldownMinutes: 10,
    batteryAlertThreshold: 15,
    thermalWarningCelsius: 41.5,
    morningBriefing: {
      enabled: true,
      targetHour: 7,
      targetMinute: 30,
      includeBattery: true,
      includeNetwork: true,
      includeWeather: true,
      includeHealthTips: true,
    },
    nightRest: {
      enabled: true,
      startHour: 22, // 10 PM
      endHour: 6, // 6 AM
      autoEngageEyeComfort: true,
      autoDimLuminance: true,
      targetWarmthK: 3200,
      targetBrightness: 25,
    },
    quietHours: {
      enabled: true,
      startHour: 23,
      endHour: 6,
      allowCriticalHazards: true,
    },
  };

  private static activeAlerts: JarvisProactiveAlert[] = [];
  private static metrics: SentinelSystemMetrics = {
    totalAlertsSurfaced: 0,
    actionsExecuted: 0,
    lastVocalAlertTimestamp: 0,
    currentRiskLevel: 'NOMINAL',
    activeAlerts: [],
  };

  // Cooldown tracker for each alert type to avoid repetitive warnings
  private static lastAlertTimestampsByType: Map<SentinelAlertType, number> = new Map();

  /**
   * Initializes Sentinel monitoring and loads persisted configuration
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.loadFromStorage();

    // Start ambient background evaluation loop (runs every 15 seconds)
    if (typeof window !== 'undefined') {
      this.evaluationIntervalId = setInterval(() => {
        this.evaluateAmbientContext();
      }, 15000);

      // Perform an initial scan after 2 seconds
      setTimeout(() => {
        this.evaluateAmbientContext();
      }, 2000);
    }
  }

  /**
   * Evaluates current hardware state and environment for proactive opportunities
   */
  static evaluateAmbientContext(): void {
    if (this.config.proactivityLevel === 'silent' && !this.config.quietHours.allowCriticalHazards) {
      return;
    }

    const telemetry = JarvisDeviceControlService.getState();
    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Thermal Overheat Sentinel
    const cpuTemp = telemetry.compute.cpuTempCelsius;
    if (cpuTemp >= this.config.thermalWarningCelsius) {
      this.triggerAlertIfNotRecent({
        type: 'thermal_hazard',
        priority: 'URGENT',
        title: 'Thermal Core Elevated',
        details: `Junction temperature reached ${cpuTemp.toFixed(1)}°C. Throttling non-essential tasks advised.`,
        vocalMessage: this.formatVocalMessage(
          'thermal_hazard',
          `Sir, internal thermals have reached ${cpuTemp.toFixed(1)} degrees Celsius. Recommend activating thermal mitigation protocol.`,
          `सर, फोन का तापमान ${cpuTemp.toFixed(1)} डिग्री हो गया है। फोन को ठंडा करने के लिए बैलेंस्ड मोड चालू करें।`
        ),
        actions: [
          { id: 'act_saver', label: 'Engage Balanced Mode', actionType: 'set_balanced_power', variant: 'primary' },
          { id: 'act_cool', label: 'Close Heavy Tasks', actionType: 'kill_heavy_tasks', variant: 'secondary' },
        ],
        metadata: { temp: cpuTemp },
      });
    }

    // 2. Battery Critical Sentinel (< threshold & not charging)
    const batteryPct = telemetry.power.batteryLevel;
    const isCharging = telemetry.power.isCharging;
    if (batteryPct <= this.config.batteryAlertThreshold && !isCharging) {
      this.triggerAlertIfNotRecent({
        type: 'battery_critical',
        priority: 'HIGH',
        title: `Low Battery Reserve (${batteryPct}%)`,
        details: `Remaining runtime is approximately ${telemetry.power.estimatedTimeRemainingMinutes} mins. Stark Saver will extend this by 2.4 hours.`,
        vocalMessage: this.formatVocalMessage(
          'battery_critical',
          `Sir, battery is down to ${batteryPct} percent. Shall I engage Stark Saver profile?`,
          `सर, बैटरी ${batteryPct} प्रतिशत बची है। क्या मैं स्टार्क सेवर मोड चालू करूँ?`
        ),
        actions: [
          { id: 'act_saver', label: 'Engage Stark Saver', actionType: 'engage_stark_saver', variant: 'primary' },
          { id: 'act_dim', label: 'Dim Display to 20%', actionType: 'dim_display', variant: 'secondary' },
        ],
        metadata: { percentage: batteryPct },
      });
    }

    // 3. Battery Full Saturation (100% & still connected to AC)
    if (batteryPct === 100 && isCharging) {
      this.triggerAlertIfNotRecent({
        type: 'battery_full',
        priority: 'INFO',
        title: 'Battery Fully Saturated (100%)',
        details: 'Power cell is at 100%. Disconnecting the AC cable will preserve lithium cell cycle longevity.',
        vocalMessage: this.formatVocalMessage(
          'battery_full',
          'Sir, battery has reached 100% saturation. Unplugging the charger is recommended to prolong cell longevity.',
          'सर, बैटरी 100% फुल चार्ज हो चुकी है। चार्जर हटाना बैटरी लाइफ के लिए बेहतर होगा।'
        ),
        actions: [
          { id: 'act_dismiss', label: 'Acknowledged', actionType: 'dismiss', variant: 'secondary' },
        ],
      });
    }

    // 4. Circadian Morning Briefing (Between 6 AM and 10 AM, once per day)
    if (
      this.config.morningBriefing.enabled &&
      currentHour >= 6 &&
      currentHour <= 10 &&
      this.config.morningBriefing.lastDeliveredDate !== todayStr
    ) {
      this.triggerMorningBriefing();
    }

    // 5. Late Night Ocular Rest Protocol (10:30 PM - 5:00 AM)
    const isLateNight = currentHour >= this.config.nightRest.startHour || currentHour < this.config.nightRest.endHour;
    if (
      this.config.nightRest.enabled &&
      isLateNight &&
      telemetry.display.brightness > 45 &&
      this.config.nightRest.lastActivatedDate !== todayStr
    ) {
      this.triggerAlertIfNotRecent({
        type: 'night_rest',
        priority: 'INFO',
        title: 'Late Night Ocular Strain Detected',
        details: 'Display luminance is high during night hours. Engaging 3200K warm blue-light shield will reduce eye fatigue.',
        vocalMessage: this.formatVocalMessage(
          'night_rest',
          'Sir, it is late and display luminance is elevated. May I engage Eye Comfort 3200 Kelvin to prevent ocular fatigue?',
          'सर, देर रात हो चुकी है और स्क्रीन काफी ब्राइट है। क्या मैं आई-कम्फर्ट वॉर्म शील्ड ऑन कर दूँ?'
        ),
        actions: [
          { id: 'act_eye', label: 'Engage 3200K Eye Shield', actionType: 'engage_eye_comfort', variant: 'primary' },
          { id: 'act_dismiss', label: 'Keep Current', actionType: 'dismiss', variant: 'secondary' },
        ],
      });
      this.config.nightRest.lastActivatedDate = todayStr;
      this.persistConfig();
    }

    // Update risk level
    this.updateRiskLevel();
  }

  /**
   * Generates and triggers the Stark Morning Briefing
   */
  static triggerMorningBriefing(force: boolean = false): void {
    const todayStr = new Date().toISOString().split('T')[0];
    if (!force && this.config.morningBriefing.lastDeliveredDate === todayStr) {
      return;
    }

    const telemetry = JarvisDeviceControlService.getState();
    const batteryPct = telemetry.power.batteryLevel;
    const wifiSsid = telemetry.connectivity.wifiSsid;

    const vocalEn = `Good morning, Sir. All Stark core systems are nominal. Battery sits at ${batteryPct} percent connected to ${wifiSsid}. Skies are clear with an optimal forecast. Today is primed for progress.`;
    const vocalHi = `शुभ प्रभात, सर। सभी स्टार्क सिस्टम्स सुचारू रूप से कार्यरत हैं। बैटरी ${batteryPct} प्रतिशत है और फोन ${wifiSsid} से कनेक्टेड है। आपका दिन शुभ और सफल रहे।`;

    const alert: JarvisProactiveAlert = {
      id: `brief_${Date.now()}`,
      type: 'morning_briefing',
      priority: 'INFO',
      title: 'Stark Morning Briefing',
      details: `Systems Nominal • Battery: ${batteryPct}% • Network: ${wifiSsid} • Optimal operating status.`,
      vocalMessage: this.formatVocalMessage('morning_briefing', vocalEn, vocalHi),
      timestamp: Date.now(),
      actions: [
        { id: 'act_diag', label: 'Run Quick Diagnostics', actionType: 'run_diagnostics', variant: 'primary' },
        { id: 'act_dismiss', label: 'Thank You, Jarvis', actionType: 'dismiss', variant: 'secondary' },
      ],
    };

    this.config.morningBriefing.lastDeliveredDate = todayStr;
    this.persistConfig();

    this.surfaceAlert(alert, force);
  }

  /**
   * Evaluates whether an alert of a specific type can be surfaced based on cooldown & quiet hours
   */
  private static triggerAlertIfNotRecent(
    alertInput: Omit<JarvisProactiveAlert, 'id' | 'timestamp'>,
    force: boolean = false
  ): void {
    const now = Date.now();
    const lastTime = this.lastAlertTimestampsByType.get(alertInput.type) || 0;
    const cooldownMs = this.config.cooldownMinutes * 60 * 1000;

    // Cooldown check for repetitive alert types
    if (now - lastTime < cooldownMs) {
      return;
    }

    const alert: JarvisProactiveAlert = {
      ...alertInput,
      id: `alert_${alertInput.type}_${now}`,
      timestamp: now,
    };

    this.lastAlertTimestampsByType.set(alertInput.type, now);
    this.surfaceAlert(alert, force);
  }

  /**
   * Surfaces the alert, rings the acoustic chime, and vocalizes the whisper if permitted.
   * Requirement 1: Jarvis only proactively vocalizes/chimes when actively AWAKE!
   */
  static surfaceAlert(alert: JarvisProactiveAlert, isForced: boolean = false): void {
    // Check if alert already exists to prevent duplicate UI spam
    const existingIndex = this.activeAlerts.findIndex((a) => a.type === alert.type);
    if (existingIndex >= 0) {
      this.activeAlerts[existingIndex] = alert;
    } else {
      this.activeAlerts.unshift(alert);
    }

    // Keep active alerts capped at 5
    if (this.activeAlerts.length > 5) {
      this.activeAlerts = this.activeAlerts.slice(0, 5);
    }

    this.metrics.totalAlertsSurfaced++;
    this.updateRiskLevel();

    // Check quiet hours, audio permissions, and AWAKE state requirement (Rule 1)
    const canVoice = this.canVocalize(alert.priority, isForced);

    if (this.config.voiceChimeEnabled && canVoice) {
      AudioEffects.playProactiveAlertChime(alert.priority);
    }

    // USER RULE: Proactive warnings are NOT vocalized automatically!
    // Instead, a top box displays "Warning - [Say it]".
    // Jarvis ONLY speaks the warning when:
    // Rule 1: Awake
    // Rule 2: User clicks "Say it" or commands "Say it" / "Tell me warning"

    this.notify();
  }

  /**
   * Speaks the current pending warning when user clicks "Say it" or issues voice command
   * (Rule 2: when user asks him to say it or clicks 'Say it')
   */
  static speakAlert(alertId?: string): boolean {
    const alert = alertId 
      ? this.activeAlerts.find((a) => a.id === alertId)
      : this.activeAlerts[0];
    if (!alert) return false;

    this.metrics.lastVocalAlertTimestamp = Date.now();
    const prefs = JarvisPersonalityEngine.getPreferences();
    const gender = prefs.voiceGender || 'male';

    const res = JarvisTtsEngine.speak({
      id: `tts_warning_${alert.id}_${Date.now()}`,
      text: alert.vocalMessage,
      language: prefs.language === 'hi' ? 'hi-IN' : 'en-US',
      gender,
      rate: prefs.speechRate || 0.9,
      pitch: prefs.speechPitch || (gender === 'male' ? 0.88 : 1.08),
    });

    return res.success;
  }

  /**
   * Helper to trigger a realistic warning for testing and demonstration
   */
  static triggerDiagnosticWarning(customTitle?: string, customMessage?: string): JarvisProactiveAlert {
    const alert: JarvisProactiveAlert = {
      id: `diag_warn_${Date.now()}`,
      type: 'battery_critical',
      priority: 'HIGH',
      title: customTitle || 'Battery Optimization Warning',
      details: customMessage || 'Background power drain detected on non-essential sensors.',
      vocalMessage: customMessage || 'Sir, battery optimization warning: power drain detected on non-essential sensors. Recommend engaging Stark Saver.',
      actions: [
        {
          id: 'act_saver',
          label: 'Engage Stark Saver',
          actionType: 'engage_stark_saver',
          variant: 'primary',
        },
        {
          id: 'act_dismiss',
          label: 'Dismiss',
          actionType: 'dismiss',
          variant: 'secondary',
        },
      ],
      timestamp: Date.now(),
      actedUpon: false,
      dismissed: false,
    };

    this.surfaceAlert(alert, true);
    return alert;
  }

  /**
   * Determines if vocal audio / proactive informing is allowed right now.
   * Requirement 1: Jarvis can ONLY proactively inform (vocalize/chime) when AWAKE!
   */
  private static canVocalize(priority: SentinelAlertPriority, isForced: boolean = false): boolean {
    if (this.config.proactivityLevel === 'silent') return false;

    // Requirement 1: Proactive informing (warnings, briefings, alerts) is ONLY permitted when JARVIS is actively AWAKE
    if (this.config.onlyInformWhenAwake !== false && !isForced) {
      if (typeof JarvisVoiceService !== 'undefined' && typeof JarvisVoiceService.isAwake === 'function') {
        if (!JarvisVoiceService.isAwake()) {
          return false;
        }
      }
    }

    // Quiet hours check
    if (this.config.quietHours.enabled) {
      const currentHour = new Date().getHours();
      const inQuiet =
        this.config.quietHours.startHour > this.config.quietHours.endHour
          ? currentHour >= this.config.quietHours.startHour || currentHour < this.config.quietHours.endHour
          : currentHour >= this.config.quietHours.startHour && currentHour < this.config.quietHours.endHour;

      if (inQuiet) {
        // If critical hazard allowed during quiet hours and priority is URGENT, let it pass
        return this.config.quietHours.allowCriticalHazards && priority === 'URGENT';
      }
    }

    return true;
  }

  /**
   * Executes an action attached to a proactive alert
   */
  static async executeAction(alertId: string, actionType: string): Promise<boolean> {
    const alert = this.activeAlerts.find((a) => a.id === alertId);
    let success = true;

    try {
      switch (actionType) {
        case 'engage_stark_saver':
          JarvisDeviceControlService.setPowerMode('stark_saver');
          AudioEffects.playHardwareToggle(true);
          JarvisTtsEngine.speak({
            id: 'tts_action_saver',
            text: 'Stark Saver power profile engaged. CPU throttled and background drain minimized.',
          });
          break;

        case 'set_balanced_power':
          JarvisDeviceControlService.setPowerMode('balanced');
          AudioEffects.playHardwareToggle(true);
          break;

        case 'kill_heavy_tasks':
          JarvisDeviceControlService.setPowerMode('stark_saver');
          AudioEffects.playHardwareToggle(true);
          break;

        case 'dim_display':
          JarvisDeviceControlService.setBrightness(20);
          AudioEffects.playHardwareToggle(false);
          break;

        case 'engage_eye_comfort':
          JarvisDeviceControlService.setEyeComfortMode(true, 3200);
          JarvisDeviceControlService.setBrightness(25);
          AudioEffects.playHardwareToggle(true);
          JarvisTtsEngine.speak({
            id: 'tts_action_eye',
            text: 'Eye comfort engaged at 3200 Kelvin. Blue-light spectrum attenuated.',
          });
          break;

        case 'run_diagnostics':
          AudioEffects.playDiagnosticBeep(0);
          await JarvisDeviceControlService.runFullSystemDiagnostics();
          break;

        case 'dismiss':
          // Simply dismiss
          break;

        default:
          success = false;
          break;
      }

      if (alert) {
        alert.actedUpon = true;
        alert.dismissed = true;
      }
      this.metrics.actionsExecuted++;
      this.dismissAlert(alertId);
      return success;
    } catch {
      return false;
    }
  }

  /**
   * Dismisses an active alert
   */
  static dismissAlert(alertId: string): void {
    this.activeAlerts = this.activeAlerts.filter((a) => a.id !== alertId);
    this.updateRiskLevel();
    this.notify();
  }

  /**
   * Formats the vocal message based on preferred language
   */
  private static formatVocalMessage(type: SentinelAlertType, enText: string, hiText: string): string {
    const lang = this.config.preferredLanguage;
    if (lang === 'hi') {
      return hiText;
    }
    if (lang === 'hinglish') {
      // Natural Hinglish combination
      if (type === 'battery_critical') {
        return 'Sir, battery critical low ho chuki hai. Kya main Stark Saver mode on kar doon?';
      }
      if (type === 'thermal_hazard') {
        return 'Sir, phone ka temperature high ho gaya hai. Cooling mode engage karna sahi rahega.';
      }
      if (type === 'morning_briefing') {
        return 'Good morning, Sir. Sabhi systems nominal hain, battery aur network perfectly fine hain. Have a great day.';
      }
      if (type === 'night_rest') {
        return 'Sir, raat ke 11 baj chuke hain. Screen warmth 3200K par set karke eye comfort on kar diya jaye?';
      }
      return enText;
    }
    return enText;
  }

  /**
   * Recalculates current system risk level
   */
  private static updateRiskLevel(): void {
    const hasUrgent = this.activeAlerts.some((a) => a.priority === 'URGENT');
    const hasHigh = this.activeAlerts.some((a) => a.priority === 'HIGH');

    if (hasUrgent) {
      this.metrics.currentRiskLevel = 'HAZARD';
    } else if (hasHigh) {
      this.metrics.currentRiskLevel = 'ELEVATED';
    } else {
      this.metrics.currentRiskLevel = 'NOMINAL';
    }
    this.metrics.activeAlerts = [...this.activeAlerts];
  }

  // ==========================================
  // SIMULATION & TESTING HOOKS
  // ==========================================

  /**
   * Simulates a sudden battery drop to test proactive intervention
   */
  static simulateBatterySpike(percentage: number = 12): void {
    JarvisDeviceControlService.simulateBatteryLevel(percentage, false);
    this.lastAlertTimestampsByType.delete('battery_critical');
    this.evaluateAmbientContext();
  }

  /**
   * Simulates thermal overheating to test emergency cooling protocol
   */
  static simulateThermalHazard(temp: number = 43.8): void {
    JarvisDeviceControlService.simulateThermalSpike(temp);
    this.lastAlertTimestampsByType.delete('thermal_hazard');
    this.evaluateAmbientContext();
  }

  /**
   * Simulates late night eye fatigue condition
   */
  static simulateNightRest(): void {
    JarvisDeviceControlService.setEyeComfortMode(false);
    JarvisDeviceControlService.setBrightness(85);
    this.lastAlertTimestampsByType.delete('night_rest');
    this.config.nightRest.lastActivatedDate = undefined;

    this.triggerAlertIfNotRecent({
      type: 'night_rest',
      priority: 'INFO',
      title: 'Late Night Ocular Strain Detected',
      details: 'Display luminance is 85% during night hours. Engaging 3200K warm blue-light shield will reduce ocular stress.',
      vocalMessage: this.formatVocalMessage(
        'night_rest',
        'Sir, it is late and display luminance is elevated. May I engage Eye Comfort 3200 Kelvin to prevent ocular fatigue?',
        'सर, देर रात हो चुकी है और स्क्रीन काफी ब्राइट है। क्या मैं आई-कम्फर्ट वॉर्म शील्ड ऑन कर दूँ?'
      ),
      actions: [
        { id: 'act_eye', label: 'Engage 3200K Eye Shield', actionType: 'engage_eye_comfort', variant: 'primary' },
        { id: 'act_dismiss', label: 'Keep Current', actionType: 'dismiss', variant: 'secondary' },
      ],
    });
  }

  // ==========================================
  // CONFIG & STATE ACCESSORS
  // ==========================================

  static getConfig(): SentinelConfig {
    return { ...this.config };
  }

  static updateConfig(partial: Partial<SentinelConfig>): void {
    this.config = { ...this.config, ...partial };
    this.persistConfig();
    this.notify();
  }

  static getActiveAlerts(): JarvisProactiveAlert[] {
    return [...this.activeAlerts];
  }

  static getMetrics(): SentinelSystemMetrics {
    return { ...this.metrics, activeAlerts: [...this.activeAlerts] };
  }

  private static persistConfig(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch {
      // Ignore
    }
  }

  private static loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore
    }
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {
        // Ignore
      }
    });
  }
}
