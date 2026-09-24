/**
 * ONEVA Phase 17: Native Android App Discovery Bridge
 * 
 * Interacts with genuine Android PackageManager via window.OnevaNativeBridge.getInstalledApps()
 * where available, validating untrusted metadata and providing robust local caching,
 * foreground lifecycle refresh, and package change detection.
 */

import {
  DiscoveredInstalledApp,
  RawNativeAppMetadata,
  validatePackageName,
  sanitizeAppLabel,
} from '../../types/deviceAppDiscovery';
import { PlatformBridge } from './platformBridge';

// Initial discoverable device targets including both catalog and non-catalog applications
export const DEFAULT_DISCOVERED_DEVICE_APPS: DiscoveredInstalledApp[] = [
  {
    packageName: 'com.oneva.android.launcher',
    appName: 'ONEVA',
    isInstalled: true,
    launchable: true,
    isSystemApp: true,
    versionName: '17.0.0',
    versionCode: 1700,
    isEnabled: true,
    nativeIconDataUrl: '/oneva_logo.png',
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.google.android.youtube',
    appName: 'YouTube',
    isInstalled: true,
    launchable: true,
    isSystemApp: false,
    versionName: '19.12.35',
    versionCode: 1542,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.whatsapp',
    appName: 'WhatsApp',
    isInstalled: true,
    launchable: true,
    isSystemApp: false,
    versionName: '2.24.8.85',
    versionCode: 224885,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.instagram.android',
    appName: 'Instagram',
    isInstalled: true,
    launchable: true,
    isSystemApp: false,
    versionName: '325.0.0.35',
    versionCode: 574211,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.google.android.calculator',
    appName: 'Calculator',
    isInstalled: true,
    launchable: true,
    isSystemApp: true,
    versionName: '8.6',
    versionCode: 860,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.android.camera',
    appName: 'Camera',
    isInstalled: true,
    launchable: true,
    isSystemApp: true,
    versionName: '14.0',
    versionCode: 1400,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.android.chrome',
    appName: 'Chrome',
    isInstalled: true,
    launchable: true,
    isSystemApp: true,
    versionName: '124.0.6367',
    versionCode: 6367,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.spotify.music',
    appName: 'Spotify',
    isInstalled: true,
    launchable: true,
    isSystemApp: false,
    versionName: '8.9.32.551',
    versionCode: 8932551,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.android.settings',
    appName: 'Settings',
    isInstalled: true,
    launchable: true,
    isSystemApp: true,
    versionName: '14.0',
    versionCode: 1400,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.google.android.deskclock',
    appName: 'Clock',
    isInstalled: true,
    launchable: true,
    isSystemApp: true,
    versionName: '7.6',
    versionCode: 760,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.phonepe.app',
    appName: 'PhonePe',
    isInstalled: true,
    launchable: true,
    isSystemApp: false,
    versionName: '5.2.14',
    versionCode: 5214,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.google.android.apps.nbu.paisa.user',
    appName: 'Google Pay',
    isInstalled: true,
    launchable: true,
    isSystemApp: false,
    versionName: '185.1.2',
    versionCode: 18512,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.application.zomato',
    appName: 'Zomato',
    isInstalled: true,
    launchable: true,
    isSystemApp: false,
    versionName: '18.2.1',
    versionCode: 18210,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'in.swiggy.android',
    appName: 'Swiggy',
    isInstalled: true,
    launchable: true,
    isSystemApp: false,
    versionName: '4.32.0',
    versionCode: 4320,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  // --- NON-CATALOG DISCOVERED INSTALLED DEVICE APPLICATIONS (Phase 17 Requirement) ---
  {
    packageName: 'org.videolan.vlc',
    appName: 'VLC',
    isInstalled: true,
    launchable: true,
    isSystemApp: false,
    versionName: '3.5.4',
    versionCode: 354,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'org.torproject.torbrowser',
    appName: 'Tor Browser',
    isInstalled: true,
    launchable: true,
    isSystemApp: false,
    versionName: '13.0.15',
    versionCode: 13015,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  {
    packageName: 'com.example.xyzapp',
    appName: 'XYZ App',
    isInstalled: true,
    launchable: true,
    isSystemApp: false,
    versionName: '1.0.0',
    versionCode: 100,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
  // Non-launchable system component / background service
  {
    packageName: 'com.android.providers.telephony.daemon',
    appName: 'Telephony Daemon',
    isInstalled: true,
    launchable: false,
    isSystemApp: true,
    versionName: '14.0',
    versionCode: 1400,
    isEnabled: true,
    discoveredAt: new Date().toISOString(),
    source: 'browser_simulation',
  },
];

const STORAGE_DISCOVERED_APPS_KEY = 'oneva_discovered_installed_apps_v17';
const THROTTLE_MS = 2500;

export class NativeAppDiscoveryBridge {
  private static cachedApps: DiscoveredInstalledApp[] | null = null;
  private static lastScanTimestamp: number = 0;
  private static isScanning: boolean = false;
  private static listeners: Set<() => void> = new Set();
  private static foregroundListenerBound: boolean = false;

  /**
   * Initializes the native discovery bridge and registers lifecycle events
   */
  static init(): void {
    if (this.foregroundListenerBound) return;

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Safe Foreground Refresh: update discovered apps when ONEVA returns to foreground
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          const now = Date.now();
          if (now - this.lastScanTimestamp > THROTTLE_MS * 2) {
            this.scanInstalledApps(false).catch(() => {});
          }
        }
      });
      this.foregroundListenerBound = true;
    }
  }

  /**
   * Query Android PackageManager or simulated storage for installed packages
   */
  static async scanInstalledApps(forceRefresh: boolean = false): Promise<DiscoveredInstalledApp[]> {
    const now = Date.now();
    if (!forceRefresh && this.cachedApps && now - this.lastScanTimestamp < THROTTLE_MS) {
      return this.cachedApps;
    }

    this.isScanning = true;
    this.notify();

    try {
      // 1. Genuine Native Android Path
      if (PlatformBridge.isNativeAndroid() && window.OnevaNativeBridge?.getInstalledApps) {
        const rawJson = window.OnevaNativeBridge.getInstalledApps();
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (Array.isArray(parsed)) {
            const sanitized = this.sanitizeAndDeduplicate(parsed, 'native_android');
            this.cachedApps = sanitized;
            this.lastScanTimestamp = now;
            this.persistCache(sanitized);
            this.isScanning = false;
            this.notify();
            return sanitized;
          }
        }
      }

      // 2. Browser / Simulation Path
      const simulatedList = this.loadSimulatedApps();
      const sanitized = this.sanitizeAndDeduplicate(simulatedList, 'browser_simulation');
      this.cachedApps = sanitized;
      this.lastScanTimestamp = now;
      this.isScanning = false;
      this.notify();
      return sanitized;
    } catch (err) {
      console.warn('[NativeAppDiscoveryBridge] Discovery scan error:', err);
      this.isScanning = false;
      // Return cached or fallback without throwing
      if (!this.cachedApps) {
        this.cachedApps = [...DEFAULT_DISCOVERED_DEVICE_APPS];
      }
      this.notify();
      return this.cachedApps;
    }
  }

  /**
   * Synchronous cached access
   */
  static getCachedInstalledApps(): DiscoveredInstalledApp[] {
    if (!this.cachedApps) {
      const stored = this.loadSimulatedApps();
      this.cachedApps = this.sanitizeAndDeduplicate(stored, 'browser_simulation');
    }
    return this.cachedApps;
  }

  /**
   * Check if a scan is currently active
   */
  static isScanInProgress(): boolean {
    return this.isScanning;
  }

  /**
   * Check if a specific package is currently installed
   */
  static isPackageInstalled(packageName: string): boolean {
    if (!packageName) return false;
    const norm = packageName.trim().toLowerCase();
    const apps = this.getCachedInstalledApps();
    return apps.some((a) => a.packageName.toLowerCase() === norm && a.isInstalled);
  }

  /**
   * Look up a discovered app by package name
   */
  static getDiscoveredApp(packageName: string): DiscoveredInstalledApp | undefined {
    if (!packageName) return undefined;
    const norm = packageName.trim().toLowerCase();
    return this.getCachedInstalledApps().find((a) => a.packageName.toLowerCase() === norm);
  }

  /**
   * Sanitize, validate, and deduplicate untrusted package metadata
   */
  static sanitizeAndDeduplicate(
    rawItems: RawNativeAppMetadata[] | DiscoveredInstalledApp[],
    source: 'native_android' | 'browser_simulation'
  ): DiscoveredInstalledApp[] {
    const seen = new Set<string>();
    const result: DiscoveredInstalledApp[] = [];

    for (const item of rawItems) {
      if (!item || typeof item !== 'object') continue;

      const rawPkg = item.packageName;
      if (!validatePackageName(rawPkg)) {
        continue;
      }

      const normPkg = (rawPkg as string).trim().toLowerCase();
      if (seen.has(normPkg)) {
        // Skip duplicates deterministically (keep first)
        continue;
      }
      seen.add(normPkg);

      const appLabel = sanitizeAppLabel(item.appName || (item as any).label, normPkg);
      const isLaunchable =
        (item as any).isLaunchable !== undefined
          ? Boolean((item as any).isLaunchable)
          : (item as any).launchAvailable !== undefined
          ? Boolean((item as any).launchAvailable)
          : (item as any).launchable !== undefined
          ? Boolean((item as any).launchable)
          : true;

      const isInstalled = (item as any).isInstalled !== undefined ? Boolean((item as any).isInstalled) : true;

      result.push({
        packageName: normPkg,
        appName: appLabel,
        isInstalled,
        launchable: isLaunchable,
        isSystemApp: Boolean(item.isSystemApp),
        versionName: typeof item.versionName === 'string' ? item.versionName.slice(0, 30) : undefined,
        versionCode: typeof item.versionCode === 'number' ? item.versionCode : undefined,
        isEnabled: item.isEnabled !== false,
        nativeIconDataUrl: typeof item.nativeIconDataUrl === 'string' ? item.nativeIconDataUrl : undefined,
        discoveredAt: (item as any).discoveredAt || new Date().toISOString(),
        source,
      });
    }

    return result;
  }

  /**
   * Dynamically simulate installing an application (for testing package changes)
   */
  static simulateInstallApp(app: Partial<DiscoveredInstalledApp> & { packageName: string; appName: string }): boolean {
    if (!validatePackageName(app.packageName)) return false;

    const current = [...this.getCachedInstalledApps()];
    const norm = app.packageName.trim().toLowerCase();
    const index = current.findIndex((a) => a.packageName.toLowerCase() === norm);

    const newApp: DiscoveredInstalledApp = {
      packageName: norm,
      appName: sanitizeAppLabel(app.appName, norm),
      isInstalled: true,
      launchable: app.launchable !== false,
      isSystemApp: Boolean(app.isSystemApp),
      versionName: app.versionName || '1.0.0',
      versionCode: app.versionCode || 100,
      isEnabled: true,
      nativeIconDataUrl: app.nativeIconDataUrl,
      discoveredAt: new Date().toISOString(),
      source: 'browser_simulation',
    };

    if (index >= 0) {
      current[index] = newApp;
    } else {
      current.push(newApp);
    }

    this.cachedApps = current;
    this.persistCache(current);
    this.notify();
    return true;
  }

  /**
   * Dynamically simulate uninstalling an application (for testing package removal)
   */
  static simulateUninstallApp(packageName: string): boolean {
    const norm = packageName.trim().toLowerCase();
    const current = this.getCachedInstalledApps();
    const filtered = current.filter((a) => a.packageName.toLowerCase() !== norm);

    if (filtered.length !== current.length) {
      this.cachedApps = filtered;
      this.persistCache(filtered);
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Reset simulated apps to standard default list
   */
  static resetToDefaultApps(): void {
    this.cachedApps = [...DEFAULT_DISCOVERED_DEVICE_APPS];
    this.persistCache(this.cachedApps);
    this.notify();
  }

  /**
   * Alias for test suite & simulation controls
   */
  static resetToDefaultSimulation(): void {
    this.resetToDefaultApps();
  }

  /**
   * Checks if genuine native Android discovery bridge is accessible
   */
  static isNativeBridgeAvailable(): boolean {
    return PlatformBridge.isNativeAndroid() && Boolean(window.OnevaNativeBridge?.getInstalledApps);
  }

  /**
   * Returns current active discovery source
   */
  static getDiscoverySource(): 'native_packagemanager' | 'browser_simulation' {
    return this.isNativeBridgeAvailable() ? 'native_packagemanager' : 'browser_simulation';
  }

  private static loadSimulatedApps(): DiscoveredInstalledApp[] {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_DISCOVERED_APPS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[NativeAppDiscoveryBridge] Storage read error:', err);
      }
    }
    return [...DEFAULT_DISCOVERED_DEVICE_APPS];
  }

  private static persistCache(apps: DiscoveredInstalledApp[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_DISCOVERED_APPS_KEY, JSON.stringify(apps));
      } catch (err) {
        console.warn('[NativeAppDiscoveryBridge] Storage write error:', err);
      }
    }
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('[NativeAppDiscoveryBridge] Listener error:', e);
      }
    }
  }
}

// Auto-initialize lifecycle listeners
NativeAppDiscoveryBridge.init();
