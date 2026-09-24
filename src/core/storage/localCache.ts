import { ONEVA_CLIENT_CONFIG } from '../config';

const CACHE_KEYS = {
  REMOTE_CONFIG: 'oneva_remote_config_cache',
  LAST_KNOWN_GOOD: 'oneva_lkg_config',
  OFFLINE_FEATURE_STATE: 'oneva_offline_features',
  DIAGNOSTICS_CONSENT: 'oneva_diagnostics_consent',
} as const;

export class LocalStorageCache {
  static getCachedRemoteConfig(): Record<string, unknown> {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.REMOTE_CONFIG);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Fallback on JSON parse error
    }
    return { ...ONEVA_CLIENT_CONFIG.defaults.remoteConfig };
  }

  static setCachedRemoteConfig(config: Record<string, unknown>): void {
    try {
      localStorage.setItem(CACHE_KEYS.REMOTE_CONFIG, JSON.stringify(config));
      // Save as last-known-good
      localStorage.setItem(CACHE_KEYS.LAST_KNOWN_GOOD, JSON.stringify({
        config,
        savedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.warn('[ONEVA Cache] Unable to write to local storage:', e);
    }
  }

  static getLastKnownGoodConfig(): { config: Record<string, unknown>; savedAt: string } | null {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.LAST_KNOWN_GOOD);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      return null;
    }
    return null;
  }

  static getDiagnosticsConsent(): boolean {
    try {
      return localStorage.getItem(CACHE_KEYS.DIAGNOSTICS_CONSENT) === 'true';
    } catch {
      return false;
    }
  }

  static setDiagnosticsConsent(consented: boolean): void {
    try {
      localStorage.setItem(CACHE_KEYS.DIAGNOSTICS_CONSENT, consented ? 'true' : 'false');
    } catch {
      // ignore
    }
  }
}
