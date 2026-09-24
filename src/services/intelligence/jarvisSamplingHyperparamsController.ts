/**
 * ONEVA Phase 26: Real-JARVIS Dynamic Hyperparameters & Sampling Matrix Controller
 * 
 * Bridges the gap with Google AI Studio's Model Sampling Controls:
 * - Dynamic Temperature control (0.0: Strictly analytical -> 2.0: Maximum Stark wit/creativity)
 * - Nucleus Sampling (Top-P: 0.1 - 1.0) and Top-K (1 - 100)
 * - Frequency and Presence penalties
 * - Real-time persistence & UI synchronization
 */

export interface JarvisSamplingConfig {
  temperature: number; // 0.0 to 2.0 (Default: 0.7)
  topP: number;        // 0.1 to 1.0 (Default: 0.95)
  topK: number;        // 1 to 100 (Default: 40)
  presencePenalty: number;  // -2.0 to 2.0 (Default: 0.0)
  frequencyPenalty: number; // -2.0 to 2.0 (Default: 0.0)
  modePreset: 'ANALYTICAL_ZERO' | 'BALANCED_BUTLER' | 'STARK_MAX_WIT' | 'CUSTOM';
}

const STORAGE_KEY = 'oneva_jarvis_sampling_hyperparams';

const DEFAULT_CONFIG: JarvisSamplingConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  presencePenalty: 0.0,
  frequencyPenalty: 0.0,
  modePreset: 'BALANCED_BUTLER',
};

export class JarvisSamplingHyperparamsController {
  private static currentConfig: JarvisSamplingConfig = (() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      } catch (e) {
        console.warn('[JarvisSampling] Failed to read cached hyperparams:', e);
      }
    }
    return { ...DEFAULT_CONFIG };
  })();

  private static listeners: Set<() => void> = new Set();

  static getConfig(): JarvisSamplingConfig {
    return { ...this.currentConfig };
  }

  static updateConfig(partial: Partial<JarvisSamplingConfig>): JarvisSamplingConfig {
    this.currentConfig = {
      ...this.currentConfig,
      ...partial,
      modePreset: partial.modePreset || 'CUSTOM',
    };

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentConfig));
      } catch (e) {
        console.warn('[JarvisSampling] Save error:', e);
      }
    }

    this.notify();
    return { ...this.currentConfig };
  }

  static applyPreset(preset: 'ANALYTICAL_ZERO' | 'BALANCED_BUTLER' | 'STARK_MAX_WIT'): JarvisSamplingConfig {
    let updates: Partial<JarvisSamplingConfig>;
    switch (preset) {
      case 'ANALYTICAL_ZERO':
        updates = {
          temperature: 0.1,
          topP: 0.1,
          topK: 1,
          presencePenalty: 0.0,
          frequencyPenalty: 0.0,
          modePreset: 'ANALYTICAL_ZERO',
        };
        break;
      case 'STARK_MAX_WIT':
        updates = {
          temperature: 1.4,
          topP: 0.98,
          topK: 80,
          presencePenalty: 0.4,
          frequencyPenalty: 0.4,
          modePreset: 'STARK_MAX_WIT',
        };
        break;
      case 'BALANCED_BUTLER':
      default:
        updates = {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          presencePenalty: 0.0,
          frequencyPenalty: 0.0,
          modePreset: 'BALANCED_BUTLER',
        };
        break;
    }

    return this.updateConfig(updates);
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
