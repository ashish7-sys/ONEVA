export type AssistantName = 'Jarvis' | 'Nova' | 'Friday' | string;
export type JarvisReactionState =
  | 'idle'
  | 'listening'
  | 'command_detected'
  | 'command_processing'
  | 'command_finished'
  | 'completed'
  | 'error'
  | 'research';

export interface AssistConfig {
  isEnabled?: boolean;
  assistantName: AssistantName;
  customWakeWord: string;
  isVoiceActivationEnabled: boolean;
  localNluActive: boolean;
  discardsContextAfterExecution: boolean;
  zeroCloudAudioTransmission: boolean;
  selectedLanguage: 'en' | 'hi' | 'es' | 'auto';
  isLiveWallpaperEnabled: boolean;
  liveWallpaperReactionState: JarvisReactionState;
  activeAssetId?: string;
}

const STORAGE_KEY = 'oneva_assist_config';

const DEFAULT_CONFIG: AssistConfig = {
  isEnabled: true,
  assistantName: 'Jarvis',
  customWakeWord: 'Hey Jarvis',
  isVoiceActivationEnabled: false,
  localNluActive: true,
  discardsContextAfterExecution: true,
  zeroCloudAudioTransmission: true,
  selectedLanguage: 'en',
  isLiveWallpaperEnabled: true,
  liveWallpaperReactionState: 'idle',
  activeAssetId: 'jarvis-default',
};

export class AssistService {
  private static config: AssistConfig | null = null;
  private static listeners: Set<() => void> = new Set();

  static getConfig(): AssistConfig {
    if (this.config) return this.config;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
          return this.config;
        }
      } catch (err) {
        console.warn('[AssistService] Failed to load assist config:', err);
      }
    }

    this.config = { ...DEFAULT_CONFIG };
    return this.config;
  }

  static saveConfig(updates: Partial<AssistConfig>): void {
    const current = this.getConfig();
    this.config = { ...current, ...updates };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } catch (err) {
        console.warn('[AssistService] Failed to save assist config:', err);
      }
    }

    this.notify();
  }

  static setAssistantName(name: AssistantName): void {
    this.saveConfig({
      assistantName: name,
      customWakeWord: `Hey ${name}`,
    });
  }

  static setEnabled(enabled: boolean): void {
    this.saveConfig({
      isEnabled: enabled,
      isVoiceActivationEnabled: enabled,
    });
  }

  static setLiveWallpaperEnabled(enabled: boolean): void {
    this.saveConfig({
      isLiveWallpaperEnabled: enabled,
    });
  }

  static setReactionState(state: JarvisReactionState): void {
    this.saveConfig({
      liveWallpaperReactionState: state,
    });
  }

  /**
   * Applies the Admin default Jarvis experience.
   * Enables default wake configuration while preserving user autonomy over live wallpaper.
   */
  static applyJarvisDefault(payload: { assistantName?: AssistantName; wakeWord?: string; liveWallpaperEnabled?: boolean; assetId?: string }): { success: boolean; message: string } {
    const name = payload.assistantName || 'Jarvis';
    this.saveConfig({
      assistantName: name,
      customWakeWord: payload.wakeWord || `Hey ${name}`,
      isLiveWallpaperEnabled: payload.liveWallpaperEnabled ?? true,
      activeAssetId: payload.assetId || 'jarvis-default',
      liveWallpaperReactionState: 'idle',
    });

    return {
      success: true,
      message: `Configured ONEVA ${name} core with reactive live wallpaper.`,
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
