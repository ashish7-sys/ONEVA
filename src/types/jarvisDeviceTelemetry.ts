/**
 * ONEVA JARVIS Device Controls & Telemetry Depth Types
 * 
 * Hardware state, sensor telemetry, power management, and diagnostic models.
 */

export type PowerMode = 'performance' | 'balanced' | 'stark_saver' | 'ultra_doze';

export type SoundMode = 'normal' | 'vibrate' | 'silent';

export type ThermalState = 'cool' | 'nominal' | 'warm' | 'throttling';

export interface DeviceHardwareState {
  // Flashlight & Optical
  flashlight: {
    enabled: boolean;
    level: number; // 1 - 100%
    isSosStrobe: boolean;
    strobeSpeedHz: number; // 1 - 10 Hz
  };

  // Display & Luminance
  display: {
    brightness: number; // 0 - 100%
    autoBrightness: boolean;
    refreshRate: 60 | 90 | 120;
    screenTimeoutSeconds: number; // 15, 30, 60, 120, 300, 600, 0 (Never)
    blueLightFilterKelvin: number; // 3000K (warm) - 6500K (cool)
    isOledBlack: boolean;
    nightMode: boolean;
  };

  // Audio Subsystem
  audio: {
    masterVolume: number; // 0 - 100%
    mediaVolume: number;
    ringVolume: number;
    alarmVolume: number;
    soundMode: SoundMode;
    isMuted: boolean;
    spatialAudio: boolean;
    audioRoute: 'speaker' | 'bluetooth_headset' | 'usbc_dac';
  };

  // Wireless & Connectivity
  connectivity: {
    wifiEnabled: boolean;
    wifiSsid: string;
    wifiSignalRssi: number; // dBm e.g. -48 dBm
    wifiFrequencyBand: '2.4GHz' | '5GHz' | '6GHz';
    wifiSpeedMbps: number;
    ipAddress: string;

    bluetoothEnabled: boolean;
    connectedDevices: {
      id: string;
      name: string;
      type: 'audio' | 'wearable' | 'input';
      batteryPercent?: number;
    }[];

    mobileDataEnabled: boolean;
    networkType: '5G SA' | '5G NSA' | '4G LTE';
    carrier: string;
    signalBars: number; // 1 - 5
    downlinkMbps: number;
    uplinkMbps: number;

    hotspotEnabled: boolean;
    hotspotSsid: string;
    hotspotConnectedClients: number;

    airplaneMode: boolean;
    nfcEnabled: boolean;
    locationEnabled: boolean;
    autoRotate: boolean;
  };

  // Power & Battery
  power: {
    batteryLevel: number; // 0 - 100
    isCharging: boolean;
    chargingType: 'usb_pd_33w' | 'fast_charge' | 'wireless_qi' | 'none';
    wattage: number; // e.g. 33.2 W or 0
    batteryHealthPercent: number; // e.g. 98%
    batteryCycleCount: number;
    powerMode: PowerMode;
    estimatedTimeRemainingMinutes: number;
    batteryTempCelsius: number;
  };

  // Compute & Thermal
  compute: {
    cpuUsagePercent: number;
    cpuGovernor: 'schedutil' | 'performance' | 'powersave';
    cpuTempCelsius: number;
    gpuTempCelsius: number;
    thermalState: ThermalState;
    ramUsedGb: number;
    ramTotalGb: number;
    zRamCompressedGb: number;
    storageUsedGb: number;
    storageTotalGb: number;
    ufsReadSpeedMBs: number;
  };

  // Real-Time Sensor Array
  sensors: {
    ambientLightLux: number;
    orientation: {
      pitch: number; // -90 to +90
      roll: number;  // -180 to +180
      yaw: number;   // 0 to 360
    };
    acceleration: {
      x: number;
      y: number;
      z: number;
      totalG: number;
    };
    compassHeading: number; // 0 to 360
    compassDirection: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
    barometerPressureHpa: number;
    altitudeMeters: number;
    proximity: 'near' | 'far';
    hapticEngineIntensity: number; // 0 - 100
  };
}

export interface SubsystemDiagnosticItem {
  id: string;
  name: string;
  category: 'power' | 'radio' | 'thermal' | 'sensors' | 'silicon' | 'security';
  status: 'nominal' | 'warning' | 'alert';
  metric: string;
  detail: string;
}

export interface SystemDiagnosticReport {
  timestamp: number;
  diagnosticScore: number; // 0 - 100%
  overallStatus: 'ALL_SYSTEMS_NOMINAL' | 'MINOR_DEVIATION' | 'ATTENTION_REQUIRED';
  subsystems: SubsystemDiagnosticItem[];
  jarvisReadout: string;
  deviceFingerprint: string;
}
