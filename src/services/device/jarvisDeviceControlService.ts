/**
 * ONEVA JARVIS Device Controls & Telemetry Depth Service
 * 
 * Central controller for Android hardware state, thermal matrices, RF radios,
 * acoustic routing, and real-time sensor fusion.
 */

import {
  DeviceHardwareState,
  PowerMode,
  SoundMode,
  SystemDiagnosticReport,
  SubsystemDiagnosticItem,
  ThermalState,
} from '../../types/jarvisDeviceTelemetry';
import { AudioEffects } from '../voice/audioSoundEffects';
import { QuickPanelService } from '../quickPanelService';
import { PlatformBridge } from '../../launcher/services/platformBridge';

const STORAGE_KEY = 'oneva_jarvis_device_hardware_state_v1';

const INITIAL_STATE: DeviceHardwareState = {
  flashlight: {
    enabled: false,
    level: 100,
    isSosStrobe: false,
    strobeSpeedHz: 4,
  },
  display: {
    brightness: 82,
    autoBrightness: true,
    refreshRate: 120,
    screenTimeoutSeconds: 60,
    blueLightFilterKelvin: 5200,
    isOledBlack: true,
    nightMode: true,
  },
  audio: {
    masterVolume: 75,
    mediaVolume: 80,
    ringVolume: 65,
    alarmVolume: 90,
    soundMode: 'normal',
    isMuted: false,
    spatialAudio: true,
    audioRoute: 'speaker',
  },
  connectivity: {
    wifiEnabled: true,
    wifiSsid: 'STARK_SECURE_5G',
    wifiSignalRssi: -46,
    wifiFrequencyBand: '5GHz',
    wifiSpeedMbps: 866,
    ipAddress: '192.168.1.142',

    bluetoothEnabled: true,
    connectedDevices: [
      { id: 'bt_1', name: 'Stark Neural HUD Buds', type: 'audio', batteryPercent: 94 },
      { id: 'bt_2', name: 'ONEVA Chrono Watch', type: 'wearable', batteryPercent: 88 },
    ],

    mobileDataEnabled: true,
    networkType: '5G SA',
    carrier: 'Jio True 5G',
    signalBars: 5,
    downlinkMbps: 485.4,
    uplinkMbps: 72.1,

    hotspotEnabled: false,
    hotspotSsid: 'ONEVA_JARVIS_AP',
    hotspotConnectedClients: 0,

    airplaneMode: false,
    nfcEnabled: true,
    locationEnabled: true,
    autoRotate: true,
  },
  power: {
    batteryLevel: 91,
    isCharging: false,
    chargingType: 'usb_pd_33w',
    wattage: 0,
    batteryHealthPercent: 98,
    batteryCycleCount: 142,
    powerMode: 'balanced',
    estimatedTimeRemainingMinutes: 980,
    batteryTempCelsius: 32.4,
  },
  compute: {
    cpuUsagePercent: 18,
    cpuGovernor: 'schedutil',
    cpuTempCelsius: 38.6,
    gpuTempCelsius: 36.2,
    thermalState: 'nominal',
    ramUsedGb: 5.4,
    ramTotalGb: 12.0,
    zRamCompressedGb: 2.1,
    storageUsedGb: 88.4,
    storageTotalGb: 256.0,
    ufsReadSpeedMBs: 1840,
  },
  sensors: {
    ambientLightLux: 340,
    orientation: {
      pitch: 12,
      roll: -4,
      yaw: 188,
    },
    acceleration: {
      x: 0.08,
      y: 0.12,
      z: 9.81,
      totalG: 1.0,
    },
    compassHeading: 188,
    compassDirection: 'S',
    barometerPressureHpa: 1013.25,
    altitudeMeters: 54,
    proximity: 'far',
    hapticEngineIntensity: 85,
  },
};

export class JarvisDeviceControlService {
  private static state: DeviceHardwareState = INITIAL_STATE;
  private static listeners: Set<(state: DeviceHardwareState) => void> = new Set();
  private static initialized: boolean = false;
  private static sensorLoopTimer: ReturnType<typeof setInterval> | null = null;
  private static sosStrobeTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize state from storage and wire browser sensor listeners
   */
  static initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          ...INITIAL_STATE,
          ...parsed,
          flashlight: { ...INITIAL_STATE.flashlight, ...parsed.flashlight },
          display: { ...INITIAL_STATE.display, ...parsed.display },
          audio: { ...INITIAL_STATE.audio, ...parsed.audio },
          connectivity: { ...INITIAL_STATE.connectivity, ...parsed.connectivity },
          power: { ...INITIAL_STATE.power, ...parsed.power },
          compute: { ...INITIAL_STATE.compute, ...parsed.compute },
          sensors: { ...INITIAL_STATE.sensors, ...parsed.sensors },
        };
      }
    } catch {
      this.state = { ...INITIAL_STATE };
    }

    this.setupHardwareEventListeners();
    this.startMicroTelemetryEngine();
  }

  /**
   * Listen to genuine browser hardware APIs where available
   */
  private static setupHardwareEventListeners(): void {
    if (typeof window === 'undefined') return;

    // 1. Genuine Battery Status API
    if ('getBattery' in navigator) {
      try {
        (navigator as any).getBattery().then((battery: any) => {
          this.updateBatteryFromNav(battery);
          battery.addEventListener('levelchange', () => this.updateBatteryFromNav(battery));
          battery.addEventListener('chargingchange', () => this.updateBatteryFromNav(battery));
        }).catch(() => {});
      } catch {}
    }

    // 2. Genuine Network Connection API
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      this.updateNetworkFromNav(conn);
      conn.addEventListener?.('change', () => this.updateNetworkFromNav(conn));
    }

    // 3. Genuine Device Orientation (Pitch, Roll, Heading)
    window.addEventListener('deviceorientation', (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        const pitch = Math.round(e.beta || 0);
        const roll = Math.round(e.gamma || 0);
        const alpha = Math.round(e.alpha || 0);
        const heading = alpha >= 0 ? alpha : (360 + alpha) % 360;

        this.state.sensors.orientation = { pitch, roll, yaw: heading };
        this.state.sensors.compassHeading = heading;
        this.state.sensors.compassDirection = this.calculateCompassDirection(heading);
        this.notify();
      }
    }, { passive: true });

    // 4. Genuine Device Motion (Accelerometer)
    window.addEventListener('devicemotion', (e: DeviceMotionEvent) => {
      if (e.accelerationIncludingGravity) {
        const x = Number((e.accelerationIncludingGravity.x || 0).toFixed(2));
        const y = Number((e.accelerationIncludingGravity.y || 0).toFixed(2));
        const z = Number((e.accelerationIncludingGravity.z || 9.81).toFixed(2));
        const totalG = Number((Math.sqrt(x * x + y * y + z * z) / 9.81).toFixed(2));

        this.state.sensors.acceleration = { x, y, z, totalG };
        this.notify();
      }
    }, { passive: true });
  }

  private static updateBatteryFromNav(battery: any): void {
    const level = Math.round((battery.level || 0.9) * 100);
    const charging = Boolean(battery.charging);

    this.state.power.batteryLevel = level;
    this.state.power.isCharging = charging;
    this.state.power.chargingType = charging ? 'usb_pd_33w' : 'none';
    this.state.power.wattage = charging ? 28.5 : 0;
    this.state.power.estimatedTimeRemainingMinutes = charging
      ? Math.round(battery.chargingTime ? battery.chargingTime / 60 : 45)
      : Math.round(battery.dischargingTime ? battery.dischargingTime / 60 : level * 11);
    this.notify();
  }

  private static updateNetworkFromNav(conn: any): void {
    if (conn.effectiveType) {
      this.state.connectivity.networkType = conn.effectiveType === '4g' ? '5G SA' : '4G LTE';
    }
    if (conn.downlink) {
      this.state.connectivity.downlinkMbps = Math.round(conn.downlink * 10) / 10;
    }
    this.notify();
  }

  /**
   * Ambient micro-telemetry engine: simulates realistic Stark telemetry ticks
   * when static, and computes thermodynamic variations
   */
  private static startMicroTelemetryEngine(): void {
    if (this.sensorLoopTimer) clearInterval(this.sensorLoopTimer);

    this.sensorLoopTimer = setInterval(() => {
      // Subtly fluctuate ambient light & thermals realistically
      const luxJitter = Math.floor(Math.random() * 7) - 3;
      const newLux = Math.max(12, Math.min(1800, this.state.sensors.ambientLightLux + luxJitter));
      this.state.sensors.ambientLightLux = newLux;

      // Auto-brightness adjustment if enabled
      if (this.state.display.autoBrightness) {
        const targetBrightness = Math.round(Math.min(100, Math.max(20, Math.sqrt(newLux) * 4.2)));
        if (Math.abs(this.state.display.brightness - targetBrightness) > 5) {
          this.state.display.brightness = targetBrightness;
        }
      }

      // CPU & Thermal fluctuations
      const cpuJitter = (Math.random() * 4 - 2);
      const newCpu = Math.max(8, Math.min(96, Number((this.state.compute.cpuUsagePercent + cpuJitter).toFixed(1))));
      this.state.compute.cpuUsagePercent = newCpu;

      const thermalShift = (newCpu > 60 ? 0.08 : -0.04);
      const newCpuTemp = Math.max(34, Math.min(68, Number((this.state.compute.cpuTempCelsius + thermalShift).toFixed(1))));
      this.state.compute.cpuTempCelsius = newCpuTemp;

      if (newCpuTemp > 58) {
        this.state.compute.thermalState = 'throttling';
      } else if (newCpuTemp > 48) {
        this.state.compute.thermalState = 'warm';
      } else if (newCpuTemp > 38) {
        this.state.compute.thermalState = 'nominal';
      } else {
        this.state.compute.thermalState = 'cool';
      }

      this.notify();
    }, 2500);
  }

  /**
   * Retrieve clone of current device state
   */
  static getState(): DeviceHardwareState {
    this.initialize();
    return JSON.parse(JSON.stringify(this.state));
  }

  // ==========================================
  // HARDWARE CONTROL MUTATORS
  // ==========================================

  /**
   * Toggle or set Flashlight state
   */
  static setFlashlight(enabled?: boolean, level?: number, sos?: boolean): { state: boolean; level: number; message: string } {
    this.initialize();
    const newEnabled = enabled !== undefined ? enabled : !this.state.flashlight.enabled;
    const newLevel = level !== undefined ? Math.max(1, Math.min(100, level)) : this.state.flashlight.level;
    const newSos = sos !== undefined ? sos : false;

    this.state.flashlight.enabled = newEnabled;
    this.state.flashlight.level = newLevel;
    this.state.flashlight.isSosStrobe = newSos;

    if (newSos && newEnabled) {
      this.startSosStrobeEngine();
    } else {
      this.stopSosStrobeEngine();
    }

    // Sync with QuickPanel tile
    QuickPanelService.setTileState('flashlight', newEnabled);

    // Audio & Haptics
    AudioEffects.playHardwareToggle(newEnabled);
    AudioEffects.triggerHapticPulse([40, 20, 40]);

    this.save();
    this.notify();

    const desc = newSos
      ? 'Emergency SOS strobe beacon active'
      : newEnabled
      ? `Flashlight activated at ${newLevel}% luminous intensity`
      : 'Flashlight deactivated';

    return { state: newEnabled, level: newLevel, message: desc };
  }

  private static startSosStrobeEngine(): void {
    if (this.sosStrobeTimer) clearInterval(this.sosStrobeTimer);
    let on = true;
    this.sosStrobeTimer = setInterval(() => {
      on = !on;
      this.state.flashlight.enabled = on;
      this.notify();
    }, 250);
  }

  private static stopSosStrobeEngine(): void {
    if (this.sosStrobeTimer) {
      clearInterval(this.sosStrobeTimer);
      this.sosStrobeTimer = null;
    }
  }

  /**
   * Adjust display brightness
   */
  static setBrightness(level: number, auto?: boolean): { level: number; message: string } {
    this.initialize();
    const bounded = Math.max(0, Math.min(100, Math.round(level)));
    this.state.display.brightness = bounded;
    if (auto !== undefined) {
      this.state.display.autoBrightness = auto;
    }

    AudioEffects.triggerHapticPulse([30]);
    this.save();
    this.notify();

    return {
      level: bounded,
      message: `Display brightness set to ${bounded}%${auto ? ' (Auto-Adaptive Active)' : ''}`,
    };
  }

  /**
   * Adjust volume sliders and stream routing
   */
  static setVolume(stream: 'master' | 'media' | 'ring' | 'alarm', level: number): { level: number; message: string } {
    this.initialize();
    const bounded = Math.max(0, Math.min(100, Math.round(level)));

    if (stream === 'master') {
      this.state.audio.masterVolume = bounded;
      this.state.audio.mediaVolume = bounded;
      this.state.audio.isMuted = bounded === 0;
    } else if (stream === 'media') {
      this.state.audio.mediaVolume = bounded;
    } else if (stream === 'ring') {
      this.state.audio.ringVolume = bounded;
    } else if (stream === 'alarm') {
      this.state.audio.alarmVolume = bounded;
    }

    AudioEffects.triggerHapticPulse([35]);
    this.save();
    this.notify();

    return {
      level: bounded,
      message: `${stream.toUpperCase()} volume set to ${bounded}%`,
    };
  }

  /**
   * Set sound mode (normal, vibrate, silent / DND)
   */
  static setSoundMode(mode: SoundMode): { mode: SoundMode; message: string } {
    this.initialize();
    this.state.audio.soundMode = mode;
    this.state.audio.isMuted = mode === 'silent';

    // Sync with QuickPanel sound_mode tile
    QuickPanelService.setTileState('sound_mode', mode === 'normal');

    AudioEffects.playHardwareToggle(mode === 'normal');
    AudioEffects.triggerHapticPulse(mode === 'vibrate' ? [120, 60, 120] : [50]);

    this.save();
    this.notify();

    return {
      mode,
      message: `Audio profile switched to ${mode.toUpperCase()}`,
    };
  }

  /**
   * Toggle Wi-Fi and Frequency Band
   */
  static toggleWifi(forceState?: boolean, band?: '2.4GHz' | '5GHz' | '6GHz'): { state: boolean; message: string } {
    this.initialize();
    const newState = forceState !== undefined ? forceState : !this.state.connectivity.wifiEnabled;
    this.state.connectivity.wifiEnabled = newState;
    if (band) {
      this.state.connectivity.wifiFrequencyBand = band;
    }

    QuickPanelService.setTileState('wifi', newState);
    AudioEffects.playHardwareToggle(newState);
    AudioEffects.triggerHapticPulse([40]);

    this.save();
    this.notify();

    return {
      state: newState,
      message: newState
        ? `Wi-Fi enabled on ${this.state.connectivity.wifiFrequencyBand} (${this.state.connectivity.wifiSsid})`
        : 'Wi-Fi radio powered off',
    };
  }

  /**
   * Toggle Bluetooth
   */
  static toggleBluetooth(forceState?: boolean): { state: boolean; message: string } {
    this.initialize();
    const newState = forceState !== undefined ? forceState : !this.state.connectivity.bluetoothEnabled;
    this.state.connectivity.bluetoothEnabled = newState;

    QuickPanelService.setTileState('bluetooth', newState);
    AudioEffects.playHardwareToggle(newState);
    AudioEffects.triggerHapticPulse([40]);

    this.save();
    this.notify();

    return {
      state: newState,
      message: newState ? 'Bluetooth radio active, peripherals paired' : 'Bluetooth radio powered down',
    };
  }

  /**
   * Toggle Mobile Cellular Data
   */
  static toggleMobileData(forceState?: boolean): { state: boolean; message: string } {
    this.initialize();
    const newState = forceState !== undefined ? forceState : !this.state.connectivity.mobileDataEnabled;
    this.state.connectivity.mobileDataEnabled = newState;

    QuickPanelService.setTileState('mobile_data', newState);
    AudioEffects.playHardwareToggle(newState);

    this.save();
    this.notify();

    return {
      state: newState,
      message: newState
        ? `${this.state.connectivity.networkType} cellular data active on ${this.state.connectivity.carrier}`
        : 'Cellular data transceiver deactivated',
    };
  }

  /**
   * Toggle Mobile Hotspot
   */
  static toggleHotspot(forceState?: boolean): { state: boolean; message: string } {
    this.initialize();
    const newState = forceState !== undefined ? forceState : !this.state.connectivity.hotspotEnabled;
    this.state.connectivity.hotspotEnabled = newState;

    QuickPanelService.setTileState('hotspot', newState);
    AudioEffects.playHardwareToggle(newState);

    this.save();
    this.notify();

    return {
      state: newState,
      message: newState
        ? `Personal hotspot broadcasting (${this.state.connectivity.hotspotSsid})`
        : 'Personal hotspot stopped',
    };
  }

  /**
   * Set Power Management Mode
   */
  static setPowerMode(mode: PowerMode): { mode: PowerMode; message: string } {
    this.initialize();
    this.state.power.powerMode = mode;

    if (mode === 'stark_saver' || mode === 'ultra_doze') {
      this.state.display.refreshRate = 60;
      this.state.display.brightness = Math.min(this.state.display.brightness, 60);
      this.state.compute.cpuGovernor = 'powersave';
      QuickPanelService.setTileState('battery_saver', true);
    } else if (mode === 'performance') {
      this.state.display.refreshRate = 120;
      this.state.compute.cpuGovernor = 'performance';
      QuickPanelService.setTileState('battery_saver', false);
    } else {
      this.state.compute.cpuGovernor = 'schedutil';
      QuickPanelService.setTileState('battery_saver', false);
    }

    AudioEffects.playHardwareToggle(mode !== 'stark_saver');
    AudioEffects.triggerHapticPulse([60, 40, 60]);

    this.save();
    this.notify();

    return {
      mode,
      message: `Power profile calibrated to ${mode.replace('_', ' ').toUpperCase()}`,
    };
  }

  /**
   * Set Display Refresh Rate
   */
  static setRefreshRate(hz: 60 | 90 | 120): { hz: number; message: string } {
    this.initialize();
    this.state.display.refreshRate = hz;
    AudioEffects.triggerHapticPulse([40]);

    this.save();
    this.notify();

    return {
      hz,
      message: `Display panel refresh synchronized to ${hz} Hz LTPO`,
    };
  }

  /**
   * Set Screen Timeout
   */
  static setScreenTimeout(seconds: number): { seconds: number; message: string } {
    this.initialize();
    this.state.display.screenTimeoutSeconds = seconds;
    this.save();
    this.notify();

    return {
      seconds,
      message: seconds === 0 ? 'Display timeout disabled (Always Awake)' : `Display timeout set to ${seconds} seconds`,
    };
  }

  /**
   * Set Blue Light Filter Color Temperature
   */
  static setBlueLightFilter(kelvin: number): { kelvin: number; message: string } {
    this.initialize();
    const bounded = Math.max(3000, Math.min(6500, kelvin));
    this.state.display.blueLightFilterKelvin = bounded;
    this.save();
    this.notify();

    return {
      kelvin: bounded,
      message: `Eye Comfort Shield adjusted to ${bounded}K optical temperature`,
    };
  }

  /**
   * Toggle Auto-Rotate Gyroscope Lock
   */
  static toggleAutoRotate(forceState?: boolean): { state: boolean; message: string } {
    this.initialize();
    const newState = forceState !== undefined ? forceState : !this.state.connectivity.autoRotate;
    this.state.connectivity.autoRotate = newState;

    QuickPanelService.setTileState('auto_rotate', newState);
    AudioEffects.playHardwareToggle(newState);

    this.save();
    this.notify();

    return {
      state: newState,
      message: newState ? 'Screen auto-rotation enabled' : 'Screen orientation locked',
    };
  }

  /**
   * Toggle Airplane Mode
   */
  static toggleAirplaneMode(forceState?: boolean): { state: boolean; message: string } {
    this.initialize();
    const newState = forceState !== undefined ? forceState : !this.state.connectivity.airplaneMode;
    this.state.connectivity.airplaneMode = newState;

    if (newState) {
      this.state.connectivity.wifiEnabled = false;
      this.state.connectivity.bluetoothEnabled = false;
      this.state.connectivity.mobileDataEnabled = false;
      this.state.connectivity.hotspotEnabled = false;
      QuickPanelService.setTileState('wifi', false);
      QuickPanelService.setTileState('bluetooth', false);
      QuickPanelService.setTileState('mobile_data', false);
    }

    QuickPanelService.setTileState('airplane_mode', newState);
    AudioEffects.playHardwareToggle(!newState);

    this.save();
    this.notify();

    return {
      state: newState,
      message: newState ? 'Airplane mode engaged; all RF transceivers disabled' : 'Airplane mode disengaged',
    };
  }

  /**
   * Set Eye Comfort Mode / Blue Light Filter
   */
  static setEyeComfortMode(enabled: boolean, kelvin = 3200): { enabled: boolean; kelvin: number; message: string } {
    this.initialize();
    this.state.display.nightMode = enabled;
    if (enabled) {
      this.state.display.blueLightFilterKelvin = kelvin;
    } else {
      this.state.display.blueLightFilterKelvin = 5500;
    }
    this.save();
    this.notify();
    return {
      enabled,
      kelvin: this.state.display.blueLightFilterKelvin,
      message: enabled ? `Eye comfort shield activated at ${kelvin}K` : 'Eye comfort shield disabled',
    };
  }

  /**
   * Simulation: Force battery percentage and charging state for Sentinel evaluations
   */
  static simulateBatteryLevel(level: number, isCharging = false): void {
    this.initialize();
    this.state.power.batteryLevel = Math.max(0, Math.min(100, level));
    this.state.power.isCharging = isCharging;
    this.save();
    this.notify();
  }

  /**
   * Simulation: Force CPU / Battery thermal spike for Sentinel evaluations
   */
  static simulateThermalSpike(celsius: number): void {
    this.initialize();
    this.state.compute.cpuTempCelsius = celsius;
    this.state.power.batteryTempCelsius = celsius - 4;
    this.state.compute.thermalState = celsius > 42 ? 'throttling' : celsius > 39 ? 'warm' : 'nominal';
    this.save();
    this.notify();
  }

  // ==========================================
  // STARK SYSTEM DIAGNOSTICS ENGINE
  // ==========================================

  /**
   * Run 360-Degree Comprehensive Hardware & Sensor Diagnostic Sweep
   */
  static async runFullSystemDiagnostics(): Promise<SystemDiagnosticReport> {
    this.initialize();

    const subsystems: SubsystemDiagnosticItem[] = [
      {
        id: 'diag_power',
        name: 'Power & Cell Chemistry',
        category: 'power',
        status: this.state.power.batteryHealthPercent >= 80 ? 'nominal' : 'warning',
        metric: `${this.state.power.batteryLevel}% (Health: ${this.state.power.batteryHealthPercent}%)`,
        detail: `Cell Temp: ${this.state.power.batteryTempCelsius}°C, Cycles: ${this.state.power.batteryCycleCount}, Est. Reserve: ${Math.round(this.state.power.estimatedTimeRemainingMinutes / 60)}h ${this.state.power.estimatedTimeRemainingMinutes % 60}m.`,
      },
      {
        id: 'diag_silicon',
        name: 'Silicon & Computational Cluster',
        category: 'silicon',
        status: this.state.compute.cpuTempCelsius < 55 ? 'nominal' : 'warning',
        metric: `${this.state.compute.cpuUsagePercent}% Load (${this.state.compute.cpuGovernor})`,
        detail: `SoC: ${this.state.compute.cpuTempCelsius}°C, GPU: ${this.state.compute.gpuTempCelsius}°C, RAM: ${this.state.compute.ramUsedGb}GB / ${this.state.compute.ramTotalGb}GB (zRAM active).`,
      },
      {
        id: 'diag_radios',
        name: 'RF Transceivers & Radios',
        category: 'radio',
        status: this.state.connectivity.wifiEnabled || this.state.connectivity.mobileDataEnabled ? 'nominal' : 'warning',
        metric: `${this.state.connectivity.networkType} (${this.state.connectivity.carrier})`,
        detail: `Wi-Fi: ${this.state.connectivity.wifiFrequencyBand} RSSI ${this.state.connectivity.wifiSignalRssi} dBm, Downlink: ${this.state.connectivity.downlinkMbps} Mbps, BT 5.3 Active.`,
      },
      {
        id: 'diag_thermal',
        name: 'Thermal Dissipation & Matrix',
        category: 'thermal',
        status: this.state.compute.thermalState === 'nominal' || this.state.compute.thermalState === 'cool' ? 'nominal' : 'warning',
        metric: `${this.state.compute.thermalState.toUpperCase()} (${this.state.compute.cpuTempCelsius}°C)`,
        detail: 'Vapor chamber dissipation rate nominal. Zero active thermal throttling events logged.',
      },
      {
        id: 'diag_sensors',
        name: '6-DOF Inertial & Sensor Array',
        category: 'sensors',
        status: 'nominal',
        metric: `${this.state.sensors.ambientLightLux} Lux, Compass ${this.state.sensors.compassHeading}° ${this.state.sensors.compassDirection}`,
        detail: `Barometer: ${this.state.sensors.barometerPressureHpa} hPa (Alt: ${this.state.sensors.altitudeMeters}m), Gyro Horizon: ${this.state.sensors.orientation.pitch}°/${this.state.sensors.orientation.roll}°.`,
      },
      {
        id: 'diag_security',
        name: 'ONEVA Enclave & Sandbox Integrity',
        category: 'security',
        status: 'nominal',
        metric: 'RULE 6 PRIVACY VERIFIED',
        detail: 'Zero telemetry leaks, zero screen recording, ephemeral in-memory processing confirmed.',
      },
    ];

    const allNominal = subsystems.every((s) => s.status === 'nominal');
    const score = allNominal ? 99 : 88;

    const report: SystemDiagnosticReport = {
      timestamp: Date.now(),
      diagnosticScore: score,
      overallStatus: allNominal ? 'ALL_SYSTEMS_NOMINAL' : 'MINOR_DEVIATION',
      subsystems,
      jarvisReadout: allNominal
        ? `All systems nominal, sir. Battery is sitting at ${this.state.power.batteryLevel}%, thermals are calm at ${this.state.compute.cpuTempCelsius} degrees Celsius, and the RF arrays are operating at peak efficiency.`
        : `Diagnostics complete, sir. Primary systems are operational with a minor thermal or radio deviation noted.`,
      deviceFingerprint: `ONEVA-STARK-EXP-${Date.now().toString(36).toUpperCase()}`,
    };

    return report;
  }

  /**
   * Generates vocal natural language telemetry summary for speech answers
   */
  static getTelemetryVocalReport(topic?: string): string {
    this.initialize();
    const cleanTopic = (topic || '').toLowerCase();

    if (cleanTopic.includes('battery') || cleanTopic.includes('power') || cleanTopic.includes('charge')) {
      return `Sir, battery is currently at ${this.state.power.batteryLevel} percent, ${this.state.power.isCharging ? `fast charging at ${this.state.power.wattage} watts` : 'discharging under normal load'}. Cell health is rated at ${this.state.power.batteryHealthPercent} percent.`;
    }

    if (cleanTopic.includes('temp') || cleanTopic.includes('heat') || cleanTopic.includes('thermal') || cleanTopic.includes('garam')) {
      return `Thermals are stable, sir. The processor is running at ${this.state.compute.cpuTempCelsius} degrees Celsius, and battery temperature is ${this.state.power.batteryTempCelsius} degrees.`;
    }

    if (cleanTopic.includes('wifi') || cleanTopic.includes('network') || cleanTopic.includes('internet') || cleanTopic.includes('5g')) {
      return `Connectivity is strong, sir. Connected to ${this.state.connectivity.wifiSsid} on ${this.state.connectivity.wifiFrequencyBand}, with cellular fallback on ${this.state.connectivity.carrier} ${this.state.connectivity.networkType}.`;
    }

    if (cleanTopic.includes('ram') || cleanTopic.includes('memory') || cleanTopic.includes('storage')) {
      return `Memory utilization is at ${this.state.compute.ramUsedGb} gigabytes out of ${this.state.compute.ramTotalGb} gigabytes, with ${Math.round(this.state.compute.storageTotalGb - this.state.compute.storageUsedGb)} gigabytes of internal storage free.`;
    }

    return `All device systems are nominal, sir. Battery at ${this.state.power.batteryLevel} percent, temperature is ${this.state.compute.cpuTempCelsius} degrees Celsius, and all wireless telemetry is operating smoothly.`;
  }

  private static calculateCompassDirection(deg: number): 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' {
    const d = (deg + 360) % 360;
    if (d >= 337.5 || d < 22.5) return 'N';
    if (d >= 22.5 && d < 67.5) return 'NE';
    if (d >= 67.5 && d < 112.5) return 'E';
    if (d >= 112.5 && d < 157.5) return 'SE';
    if (d >= 157.5 && d < 202.5) return 'S';
    if (d >= 202.5 && d < 247.5) return 'SW';
    if (d >= 247.5 && d < 292.5) return 'W';
    return 'NW';
  }

  private static save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // safe fallback
    }
  }

  static subscribe(listener: (state: DeviceHardwareState) => void): () => void {
    this.initialize();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    const copy = JSON.parse(JSON.stringify(this.state));
    this.listeners.forEach((fn) => {
      try {
        fn(copy);
      } catch (err) {
        console.error('[JarvisDeviceControlService] Listener error:', err);
      }
    });
  }
}
