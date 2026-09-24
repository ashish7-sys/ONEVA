export interface CameraConfig {
  profileName: string;
  dynamicRange: 'standard' | 'balanced' | 'wide';
  noiseReduction: 'low' | 'medium' | 'high_frequency';
  toneCurve: 'neutral' | 'linear_shadow_lift' | 'vibrant_oled';
  colorTempK: number;
  zeroShutterLag: boolean;
  activeAssetId?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'oneva_camera_config';

const DEFAULT_CONFIG: CameraConfig = {
  profileName: 'Low-Light Neutral OLED Color Match',
  dynamicRange: 'balanced',
  noiseReduction: 'high_frequency',
  toneCurve: 'neutral',
  colorTempK: 6500,
  zeroShutterLag: true,
  activeAssetId: 'cam-b',
  updatedAt: new Date().toISOString(),
};

export class CameraService {
  private static config: CameraConfig | null = null;
  private static listeners: Set<() => void> = new Set();

  static getConfig(): CameraConfig {
    if (this.config) return this.config;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.config = JSON.parse(raw);
          return this.config!;
        }
      } catch (e) {
        console.warn('[CameraService] Failed to read local camera config:', e);
      }
    }

    this.config = { ...DEFAULT_CONFIG };
    return this.config;
  }

  static applyCameraConfig(payload: Partial<CameraConfig>): { success: boolean; message: string; note?: string } {
    const current = this.getConfig();
    const updated: CameraConfig = {
      ...current,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    this.config = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    this.notify();
    return {
      success: true,
      message: `Camera profile set to "${updated.profileName}".`,
      note: 'Software computational profile staged for Android Camera2 API integration.',
    };
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
