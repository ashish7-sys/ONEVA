import { PlatformBridge } from '../launcher/services/platformBridge';
import { CatalogApp } from '../types/catalogAndIcons';
import { AppCatalogService } from './appCatalogService';

export interface DeviceInstalledPackage {
  packageName: string;
  appName: string;
  isInstalled: boolean;
  launchAvailable: boolean;
  isSystemApp?: boolean;
  versionName?: string;
  versionCode?: number;
  lastUpdateTime?: number;
}

export interface DeviceScanResult {
  source: 'native_android' | 'device_profile';
  profileId: string;
  profileName: string;
  scannedAt: string;
  totalDeviceAppsScanned: number;
  catalogMatchesCount: number;
  installedPackages: string[];
}

export type DeviceProfileId = 'device_a' | 'device_b' | 'device_default' | 'device_custom';

export interface DeviceProfile {
  id: DeviceProfileId;
  name: string;
  description: string;
  installedPackages: string[];
}

const STORAGE_ACTIVE_PROFILE_KEY = 'oneva_active_device_profile_v2';
const STORAGE_CUSTOM_PACKAGES_KEY = 'oneva_custom_installed_packages_v2';

export const DEVICE_PROFILES: Record<DeviceProfileId, DeviceProfile> = {
  device_default: {
    id: 'device_default',
    name: "User's Device (Default)",
    description: '14 common applications installed on this device',
    installedPackages: [
      'com.oneva.android.launcher',
      'com.android.chrome',
      'com.android.camera',
      'com.google.android.calculator',
      'com.android.settings',
      'com.google.android.deskclock',
      'com.whatsapp',
      'com.instagram.android',
      'com.google.android.youtube',
      'com.spotify.music',
      'com.phonepe.app',
      'com.google.android.apps.nbu.paisa.user',
      'com.application.zomato',
      'in.swiggy.android',
    ],
  },
  device_a: {
    id: 'device_a',
    name: 'User A (Social & Media)',
    description: 'User A has: WhatsApp, Instagram, Spotify, YouTube',
    installedPackages: [
      'com.oneva.android.launcher',
      'com.android.chrome',
      'com.android.camera',
      'com.android.settings',
      'com.whatsapp',
      'com.instagram.android',
      'com.spotify.music',
      'com.google.android.youtube',
    ],
  },
  device_b: {
    id: 'device_b',
    name: 'User B (Commerce & Entertainment)',
    description: 'User B has: Netflix, Uber, WhatsApp, Swiggy, Paytm',
    installedPackages: [
      'com.oneva.android.launcher',
      'com.android.camera',
      'com.android.settings',
      'com.netflix.mediaclient',
      'com.ubercab',
      'com.whatsapp',
      'in.swiggy.android',
      'net.one97.paytm',
      'com.amazon.mShop.android.shopping',
    ],
  },
  device_custom: {
    id: 'device_custom',
    name: 'Custom Device Profile',
    description: 'Interactive test profile with customizable installed applications',
    installedPackages: [
      'com.oneva.android.launcher',
      'com.android.chrome',
      'com.whatsapp',
      'com.google.android.youtube',
    ],
  },
};

export class DeviceAppScannerService {
  private static cachedPackages: Set<string> | null = null;
  private static lastScanTime: string = new Date().toISOString();
  private static activeProfileId: DeviceProfileId = 'device_default';
  private static listeners: Set<() => void> = new Set();

  /**
   * Initialize and restore active profile from local storage
   */
  static init(): void {
    if (typeof window !== 'undefined') {
      try {
        const storedProfile = localStorage.getItem(STORAGE_ACTIVE_PROFILE_KEY) as DeviceProfileId;
        if (storedProfile && DEVICE_PROFILES[storedProfile]) {
          this.activeProfileId = storedProfile;
        }
      } catch (err) {
        console.warn('[DeviceAppScannerService] Init error:', err);
      }
    }
  }

  /**
   * Check if running on genuine native Android
   */
  static isNativeAndroid(): boolean {
    return PlatformBridge.isNativeAndroid();
  }

  /**
   * Get current active device profile ID
   */
  static getActiveProfileId(): DeviceProfileId {
    return this.activeProfileId;
  }

  /**
   * Switch the active simulated device profile (for testing User A vs User B behavior)
   */
  static setDeviceProfile(profileId: DeviceProfileId): void {
    if (!DEVICE_PROFILES[profileId]) return;
    this.activeProfileId = profileId;
    this.cachedPackages = null;
    this.lastScanTime = new Date().toISOString();

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_ACTIVE_PROFILE_KEY, profileId);
      } catch (err) {
        console.warn('[DeviceAppScannerService] Storage write error:', err);
      }
    }

    this.notify();
  }

  /**
   * Scan device for installed application package names.
   * 
   * On genuine Android: queries window.OnevaNativeBridge.getInstalledApps().
   * In browser/simulation: queries the active device profile installed list.
   */
  static async scanDeviceInstalledPackages(): Promise<Set<string>> {
    this.lastScanTime = new Date().toISOString();

    // 1. Genuine Native Android Path
    if (this.isNativeAndroid() && window.OnevaNativeBridge?.getInstalledApps) {
      try {
        const rawJson = window.OnevaNativeBridge.getInstalledApps();
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (Array.isArray(parsed)) {
            const set = new Set<string>();
            for (const item of parsed) {
              if (item.packageName) {
                set.add(item.packageName.toLowerCase());
              }
            }
            this.cachedPackages = set;
            this.notify();
            return set;
          }
        }
      } catch (err) {
        console.warn('[DeviceAppScannerService] Error querying native Android bridge:', err);
      }
    }

    // 2. Browser Environment: use active device profile
    let packagesList: string[] = [];
    if (this.activeProfileId === 'device_custom' && typeof window !== 'undefined') {
      try {
        const customRaw = localStorage.getItem(STORAGE_CUSTOM_PACKAGES_KEY);
        if (customRaw) {
          packagesList = JSON.parse(customRaw);
        } else {
          packagesList = [...DEVICE_PROFILES.device_custom.installedPackages];
        }
      } catch {
        packagesList = [...DEVICE_PROFILES.device_custom.installedPackages];
      }
    } else {
      const profile = DEVICE_PROFILES[this.activeProfileId] || DEVICE_PROFILES.device_default;
      packagesList = profile.installedPackages;
    }

    const set = new Set<string>(packagesList.map((p) => p.toLowerCase()));
    this.cachedPackages = set;
    this.notify();
    return set;
  }

  /**
   * Synchronously get current installed packages set
   */
  static getInstalledPackages(): Set<string> {
    if (!this.cachedPackages) {
      // Synchronous fallback
      if (this.isNativeAndroid() && window.OnevaNativeBridge?.getInstalledApps) {
        try {
          const rawJson = window.OnevaNativeBridge.getInstalledApps();
          if (rawJson) {
            const parsed = JSON.parse(rawJson);
            if (Array.isArray(parsed)) {
              this.cachedPackages = new Set<string>(
                parsed.map((p: any) => (p.packageName || '').toLowerCase()).filter(Boolean)
              );
              return this.cachedPackages;
            }
          }
        } catch (err) {
          console.warn('[DeviceAppScannerService] Sync query error:', err);
        }
      }

      // Fallback to active profile
      let packagesList: string[] = [];
      if (this.activeProfileId === 'device_custom' && typeof window !== 'undefined') {
        try {
          const customRaw = localStorage.getItem(STORAGE_CUSTOM_PACKAGES_KEY);
          if (customRaw) packagesList = JSON.parse(customRaw);
          else packagesList = [...DEVICE_PROFILES.device_custom.installedPackages];
        } catch {
          packagesList = [...DEVICE_PROFILES.device_custom.installedPackages];
        }
      } else {
        const profile = DEVICE_PROFILES[this.activeProfileId] || DEVICE_PROFILES.device_default;
        packagesList = profile.installedPackages;
      }

      this.cachedPackages = new Set<string>(packagesList.map((p) => p.toLowerCase()));
    }

    return this.cachedPackages;
  }

  /**
   * Check if a specific package or alias is installed on the user's device
   */
  static isPackageInstalled(packageName: string, packageAliases?: string[]): boolean {
    const installed = this.getInstalledPackages();
    const norm = packageName.trim().toLowerCase();
    if (installed.has(norm)) return true;

    if (packageAliases && packageAliases.length > 0) {
      for (const alias of packageAliases) {
        if (installed.has(alias.trim().toLowerCase())) return true;
      }
    }
    return false;
  }

  /**
   * USER DEVICE APP LIST:
   * 
   * Strict separation from Admin Catalog:
   * Returns ONLY apps that are ACTUALLY installed on the user's device AND present in ONEVA's catalog.
   */
  static getUserDeviceApps(): CatalogApp[] {
    const catalog = AppCatalogService.getActiveApps();
    const installed = this.getInstalledPackages();

    return catalog.filter((app) => {
      const mainPkg = app.packageName.toLowerCase();
      if (installed.has(mainPkg)) return true;
      if (app.packageAliases && app.packageAliases.some((alias) => installed.has(alias.toLowerCase()))) {
        return true;
      }
      return false;
    });
  }

  /**
   * Simulate installing or uninstalling an app on the custom device profile
   */
  static toggleAppInstalled(packageName: string, shouldBeInstalled?: boolean): boolean {
    const norm = packageName.trim().toLowerCase();
    const installed = this.getInstalledPackages();
    const isCurrentlyInstalled = installed.has(norm);
    const targetState = shouldBeInstalled !== undefined ? shouldBeInstalled : !isCurrentlyInstalled;

    if (targetState) {
      installed.add(norm);
    } else {
      installed.delete(norm);
    }

    // If not already in custom mode, automatically switch to custom mode so user's change persists
    this.activeProfileId = 'device_custom';
    this.cachedPackages = new Set(installed);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_ACTIVE_PROFILE_KEY, 'device_custom');
        localStorage.setItem(STORAGE_CUSTOM_PACKAGES_KEY, JSON.stringify(Array.from(installed)));
      } catch (err) {
        console.warn('[DeviceAppScannerService] Custom storage write error:', err);
      }
    }

    this.notify();
    return targetState;
  }

  /**
   * Telemetry summary of device scan
   */
  static getScanSummary(): DeviceScanResult {
    const installed = this.getInstalledPackages();
    const catalogMatches = this.getUserDeviceApps();
    const profile = DEVICE_PROFILES[this.activeProfileId] || DEVICE_PROFILES.device_default;

    return {
      source: this.isNativeAndroid() ? 'native_android' : 'device_profile',
      profileId: this.activeProfileId,
      profileName: this.isNativeAndroid() ? 'Genuine Android Device' : profile.name,
      scannedAt: this.lastScanTime,
      totalDeviceAppsScanned: installed.size,
      catalogMatchesCount: catalogMatches.length,
      installedPackages: Array.from(installed),
    };
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    for (const l of this.listeners) {
      try {
        l();
      } catch (err) {
        console.error('[DeviceAppScannerService] Listener error:', err);
      }
    }
  }
}

// Auto-initialize on import
DeviceAppScannerService.init();
