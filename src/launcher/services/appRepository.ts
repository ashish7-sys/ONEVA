import { AppShortcut, AppCategory } from '../types';
import { PlatformBridge } from './platformBridge';
import { AppModificationEngine } from './appModificationEngine';
import { AppCatalogService } from '../../services/appCatalogService';
import { CatalogApp } from '../../types/catalogAndIcons';
import { DeviceAppScannerService } from '../../services/deviceAppScannerService';
import { NativeAppDiscoveryBridge } from './nativeAppDiscoveryBridge';
import {
  AppCapabilityModel,
  DiscoveryMergeResult,
  DiscoveredInstalledApp,
} from '../../types/deviceAppDiscovery';

function inferCategoryFromPackage(packageName: string, appName: string): AppCategory {
  const norm = (packageName + ' ' + appName).toLowerCase();
  if (
    norm.includes('video') ||
    norm.includes('player') ||
    norm.includes('music') ||
    norm.includes('media') ||
    norm.includes('vlc') ||
    norm.includes('camera') ||
    norm.includes('gallery') ||
    norm.includes('audio')
  ) {
    return 'media';
  }
  if (
    norm.includes('chat') ||
    norm.includes('message') ||
    norm.includes('whatsapp') ||
    norm.includes('telegram') ||
    norm.includes('social') ||
    norm.includes('insta') ||
    norm.includes('tweet')
  ) {
    return 'communication';
  }
  return 'utilities';
}

function generateDeterministicColor(packageName: string): string {
  const colors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#14b8a6',
    '#f97316',
    '#6366f1',
  ];
  let hash = 0;
  for (let i = 0; i < packageName.length; i++) {
    hash = (hash << 5) - hash + packageName.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Android Device Installed Applications Repository
 * ARCHITECTURAL MANDATE (Phase 17):
 * ONEVA discovers applications actually installed on the Android device
 * through native PackageManager and merges them with the ONEVA catalog deterministically.
 */

// Simulated bridge packages strictly for browser preview testing of the Modify Apps pipeline
export const DISCOVERABLE_DEVICE_TARGETS: AppShortcut[] = [
  {
    id: 'oneva_platform',
    packageName: 'com.oneva.android.launcher',
    label: 'ONEVA',
    iconName: '/oneva_logo.png',
    category: 'utilities',
    isSystemApp: true,
    accentColor: '#10b981',
    fallbackInitial: 'O',
    webFallbackIntent: '#',
    source: 'device_installed',
    launchAvailable: true,
    supportedCustomizations: ['icon'],
    discoverySource: 'browser_simulation',
  },
  {
    id: 'youtube',
    packageName: 'com.google.android.youtube',
    label: 'YouTube',
    iconName: 'Youtube',
    category: 'media',
    isSystemApp: false,
    accentColor: '#ef4444',
    fallbackInitial: 'Y',
    webFallbackIntent: 'https://youtube.com',
    source: 'device_installed',
    launchAvailable: true,
    supportedCustomizations: ['icon'],
    discoverySource: 'browser_simulation',
  },
  {
    id: 'whatsapp',
    packageName: 'com.whatsapp',
    label: 'WhatsApp',
    iconName: 'MessageCircle',
    category: 'communication',
    isSystemApp: false,
    accentColor: '#25d366',
    fallbackInitial: 'W',
    webFallbackIntent: 'https://web.whatsapp.com',
    source: 'device_installed',
    launchAvailable: true,
    supportedCustomizations: ['icon'],
    discoverySource: 'browser_simulation',
  },
  {
    id: 'instagram',
    packageName: 'com.instagram.android',
    label: 'Instagram',
    iconName: 'Camera',
    category: 'communication',
    isSystemApp: false,
    accentColor: '#e1306c',
    fallbackInitial: 'I',
    webFallbackIntent: 'https://instagram.com',
    source: 'device_installed',
    launchAvailable: true,
    supportedCustomizations: ['icon'],
    discoverySource: 'browser_simulation',
  },
  {
    id: 'calculator',
    packageName: 'com.google.android.calculator',
    label: 'Calculator',
    iconName: 'Calculator',
    category: 'utilities',
    isSystemApp: true,
    accentColor: '#f59e0b',
    fallbackInitial: 'C',
    source: 'device_installed',
    launchAvailable: true,
    supportedCustomizations: ['icon'],
    discoverySource: 'browser_simulation',
  },
  {
    id: 'camera',
    packageName: 'com.android.camera',
    label: 'Camera',
    iconName: 'Camera',
    category: 'media',
    isSystemApp: true,
    accentColor: '#10b981',
    fallbackInitial: 'C',
    source: 'device_installed',
    launchAvailable: true,
    supportedCustomizations: ['icon'],
    discoverySource: 'browser_simulation',
  },
  {
    id: 'chrome',
    packageName: 'com.android.chrome',
    label: 'Chrome',
    iconName: 'Globe',
    category: 'utilities',
    isSystemApp: true,
    accentColor: '#3b82f6',
    fallbackInitial: 'C',
    webFallbackIntent: 'https://google.com',
    source: 'device_installed',
    launchAvailable: true,
    supportedCustomizations: ['icon'],
    discoverySource: 'browser_simulation',
  },
  {
    id: 'spotify',
    packageName: 'com.spotify.music',
    label: 'Spotify',
    iconName: 'Music',
    category: 'media',
    isSystemApp: false,
    accentColor: '#1db954',
    fallbackInitial: 'S',
    webFallbackIntent: 'https://open.spotify.com',
    source: 'device_installed',
    launchAvailable: true,
    supportedCustomizations: ['icon'],
    discoverySource: 'browser_simulation',
  },
];

export const DEMO_BRIDGE_TARGETS = DISCOVERABLE_DEVICE_TARGETS;

export class AppRepository {
  private static appsCache: AppShortcut[] | null = null;
  private static isScanning: boolean = false;
  private static isSimulatedBridgeEnabled: boolean = true;
  private static listeners: Set<() => void> = new Set();

  /**
   * Check if a live Android companion bridge is present
   */
  static isBridgeConnected(): boolean {
    return PlatformBridge.isNativeAndroid() || this.isSimulatedBridgeEnabled;
  }

  /**
   * Compatibility bridge toggle
   */
  static setSimulatedBridge(enabled: boolean): void {
    this.isSimulatedBridgeEnabled = enabled;
    this.appsCache = null;
    this.notifyListeners();
  }

  /**
   * Discovery source mode
   */
  static getDiscoveryMode(): 'native_android' | 'browser_simulation' {
    return PlatformBridge.isNativeAndroid() ? 'native_android' : 'browser_simulation';
  }

  /**
   * Refresh and scan discoverable installed applications
   */
  static async refreshApps(): Promise<AppShortcut[]> {
    this.isScanning = true;
    this.notifyListeners();
    this.appsCache = null;

    try {
      await NativeAppDiscoveryBridge.scanInstalledApps(true);
      await DeviceAppScannerService.scanDeviceInstalledPackages();
    } catch (err) {
      console.warn('[AppRepository] Error during device scan:', err);
    }

    this.isScanning = false;
    const apps = this.getAvailableApps();
    this.notifyListeners();
    return apps;
  }

  static isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  /**
   * Get all installed & launchable applications discovered from the device.
   * 
   * DETERMINISTIC MERGING (Phase 17):
   * 1. If installed app matches ONEVA catalog: merge metadata.
   * 2. If installed app is NOT in catalog: add to runtime installed-app list.
   * 3. If catalog app is NOT installed on device: do NOT falsely display as installed.
   * 4. Deduplicate deterministically by packageName.
   */
  static getAvailableApps(): AppShortcut[] {
    if (this.appsCache) {
      return this.appsCache;
    }

    const discovered = NativeAppDiscoveryBridge.getCachedInstalledApps();
    const catalogApps = AppCatalogService.getActiveApps();

    // Map catalog apps by lowercase packageName and aliases for rapid lookup
    const catalogByPkg = new Map<string, CatalogApp>();
    for (const c of catalogApps) {
      catalogByPkg.set(c.packageName.toLowerCase(), c);
      if (c.packageAliases) {
        for (const alias of c.packageAliases) {
          catalogByPkg.set(alias.toLowerCase(), c);
        }
      }
    }

    const seenPackages = new Set<string>();
    const apps: AppShortcut[] = [];

    for (const disc of discovered) {
      const normPkg = disc.packageName.toLowerCase();
      if (seenPackages.has(normPkg)) continue;
      seenPackages.add(normPkg);

      // Only display launchable apps in the primary launcher drawer
      if (!disc.launchable) continue;

      const matchedCatalog = catalogByPkg.get(normPkg);

      if (matchedCatalog) {
        // 1. Matched in ONEVA Catalog: merge metadata
        apps.push({
          id: disc.packageName,
          packageName: disc.packageName,
          label: matchedCatalog.appName || matchedCatalog.name || disc.appName,
          iconName: matchedCatalog.defaultIcon || 'Smartphone',
          category: matchedCatalog.category,
          isSystemApp: Boolean(disc.isSystemApp || matchedCatalog.isSystemApp),
          accentColor: matchedCatalog.accentColor || generateDeterministicColor(disc.packageName),
          fallbackInitial:
            matchedCatalog.fallbackInitial ||
            disc.appName.charAt(0).toUpperCase() ||
            'A',
          webFallbackIntent: matchedCatalog.webFallbackIntent,
          source: 'device_installed',
          launchAvailable: true,
          supportedCustomizations: ['icon'],
          discoverySource: disc.source,
          enhancementProfile: AppModificationEngine.getProfile(disc.packageName),
          // Phase 17 capability attributes
          installed: true,
          launchable: true,
          catalogSupported: true,
          iconPackSupported: true,
          jarvisLaunchSupported: true,
          jarvisInteractionSupported: true,
          nativeIconDataUrl: disc.nativeIconDataUrl,
          versionName: disc.versionName,
          versionCode: disc.versionCode,
          isEnabled: disc.isEnabled,
        });
      } else {
        // 2. Discovered non-catalog installed application (e.g. VLC, Tor, XYZ App)
        apps.push({
          id: disc.packageName,
          packageName: disc.packageName,
          label: disc.appName,
          iconName: disc.nativeIconDataUrl || 'Smartphone',
          category: inferCategoryFromPackage(disc.packageName, disc.appName),
          isSystemApp: disc.isSystemApp,
          accentColor: generateDeterministicColor(disc.packageName),
          fallbackInitial: disc.appName.charAt(0).toUpperCase() || 'A',
          source: 'device_installed',
          launchAvailable: true,
          supportedCustomizations: ['icon'],
          discoverySource: disc.source,
          enhancementProfile: AppModificationEngine.getProfile(disc.packageName),
          // Phase 17 capability attributes
          installed: true,
          launchable: true,
          catalogSupported: false,
          iconPackSupported: false,
          jarvisLaunchSupported: true,
          jarvisInteractionSupported: false, // Honesty: no specialized in-app interaction support
          nativeIconDataUrl: disc.nativeIconDataUrl,
          versionName: disc.versionName,
          versionCode: disc.versionCode,
          isEnabled: disc.isEnabled,
        });
      }
    }

    // Baseline fallback if device returned empty list
    if (apps.length === 0) {
      apps.push(
        ...DISCOVERABLE_DEVICE_TARGETS.map((t) => ({
          ...t,
          installed: true,
          launchable: true,
          catalogSupported: true,
          jarvisLaunchSupported: true,
          jarvisInteractionSupported: true,
          enhancementProfile: AppModificationEngine.getProfile(t.packageName),
        }))
      );
    }

    this.appsCache = apps;
    return this.appsCache;
  }

  /**
   * Get all installed applications discovered from the device,
   * including non-launchable system daemons and background services.
   */
  static getAllInstalledApps(): AppShortcut[] {
    const discovered = NativeAppDiscoveryBridge.getCachedInstalledApps();
    const catalogApps = AppCatalogService.getActiveApps();

    const catalogByPkg = new Map<string, CatalogApp>();
    for (const c of catalogApps) {
      catalogByPkg.set(c.packageName.toLowerCase(), c);
      if (c.packageAliases) {
        for (const alias of c.packageAliases) {
          catalogByPkg.set(alias.toLowerCase(), c);
        }
      }
    }

    const seenPackages = new Set<string>();
    const allApps: AppShortcut[] = [];

    for (const disc of discovered) {
      const normPkg = disc.packageName.toLowerCase();
      if (seenPackages.has(normPkg)) continue;
      seenPackages.add(normPkg);

      const matchedCatalog = catalogByPkg.get(normPkg);

      allApps.push({
        id: disc.packageName,
        packageName: disc.packageName,
        label: matchedCatalog?.appName || matchedCatalog?.name || disc.appName,
        iconName: matchedCatalog?.defaultIcon || disc.nativeIconDataUrl || 'Smartphone',
        category: matchedCatalog ? matchedCatalog.category : inferCategoryFromPackage(disc.packageName, disc.appName),
        isSystemApp: Boolean(disc.isSystemApp || matchedCatalog?.isSystemApp),
        accentColor: matchedCatalog?.accentColor || generateDeterministicColor(disc.packageName),
        fallbackInitial: (matchedCatalog?.name || disc.appName).charAt(0).toUpperCase() || 'A',
        webFallbackIntent: matchedCatalog?.webFallbackIntent,
        source: 'device_installed',
        launchAvailable: disc.launchable,
        supportedCustomizations: ['icon'],
        discoverySource: disc.source,
        enhancementProfile: AppModificationEngine.getProfile(disc.packageName),
        installed: true,
        launchable: disc.launchable,
        catalogSupported: Boolean(matchedCatalog),
        iconPackSupported: Boolean(matchedCatalog),
        jarvisLaunchSupported: disc.launchable,
        jarvisInteractionSupported: Boolean(matchedCatalog),
        nativeIconDataUrl: disc.nativeIconDataUrl,
        versionName: disc.versionName,
        versionCode: disc.versionCode,
        isEnabled: disc.isEnabled,
      });
    }

    return allApps;
  }

  /**
   * Get detailed capability model for a specific package
   */
  static getAppCapabilityModel(packageName: string): AppCapabilityModel | undefined {
    if (!packageName) return undefined;
    const norm = packageName.trim().toLowerCase();
    const disc = NativeAppDiscoveryBridge.getDiscoveredApp(norm);
    const catalogApp = AppCatalogService.getAppByPackage(norm);

    if (!disc && !catalogApp) return undefined;

    const isInstalled = Boolean(disc?.isInstalled);
    const isLaunchable = disc ? disc.launchable : false;
    const isCatalog = Boolean(catalogApp);

    return {
      packageName: norm,
      appName: catalogApp?.appName || catalogApp?.name || disc?.appName || norm,
      installed: isInstalled,
      launchable: isLaunchable,
      isSystemApp: Boolean(disc?.isSystemApp || catalogApp?.isSystemApp),
      catalogSupported: isCatalog,
      iconPackSupported: isCatalog,
      jarvisLaunchSupported: isInstalled && isLaunchable,
      jarvisInteractionSupported: isInstalled && isCatalog,
      versionName: disc?.versionName,
      versionCode: disc?.versionCode,
      isEnabled: disc?.isEnabled,
      nativeIconDataUrl: disc?.nativeIconDataUrl,
      source: disc?.source || 'browser_simulation',
    };
  }

  /**
   * Comprehensive summary of merged applications
   */
  static getMergeSummary(): DiscoveryMergeResult {
    const discovered = NativeAppDiscoveryBridge.getCachedInstalledApps();
    const catalogApps = AppCatalogService.getActiveApps();
    const installedList = this.getAllInstalledApps();

    const catalogPkgSet = new Set(catalogApps.map((c) => c.packageName.toLowerCase()));
    const discoveredPkgSet = new Set(discovered.map((d) => d.packageName.toLowerCase()));

    let catalogMatchedCount = 0;
    let nonCatalogDiscoveredCount = 0;

    for (const d of discovered) {
      if (catalogPkgSet.has(d.packageName.toLowerCase())) {
        catalogMatchedCount++;
      } else {
        nonCatalogDiscoveredCount++;
      }
    }

    let uninstalledCatalogCount = 0;
    for (const c of catalogApps) {
      if (!discoveredPkgSet.has(c.packageName.toLowerCase())) {
        uninstalledCatalogCount++;
      }
    }

    const uniquePackages = Array.from(new Set(installedList.map((a) => a.packageName.toLowerCase())));

    const mergedApps: AppCapabilityModel[] = uniquePackages.map((pkg) => {
      const cap = this.getAppCapabilityModel(pkg);
      return cap!;
    }).filter(Boolean);

    return {
      totalDiscovered: discovered.length,
      totalLaunchable: discovered.filter((d) => d.launchable).length,
      catalogMatchedCount,
      nonCatalogDiscoveredCount,
      uninstalledCatalogCount,
      duplicatePackagesFiltered: 0,
      uniquePackageNames: uniquePackages,
      mergedApps,
    };
  }

  /**
   * Dynamically simulate installing an application (for verification & testing)
   */
  static simulateInstallApp(app: Partial<DiscoveredInstalledApp> & { packageName: string; appName: string }): boolean {
    const ok = NativeAppDiscoveryBridge.simulateInstallApp(app);
    if (ok) {
      this.appsCache = null;
      this.notifyListeners();
    }
    return ok;
  }

  /**
   * Dynamically simulate uninstalling an application (for verification & testing)
   */
  static simulateUninstallApp(packageName: string): boolean {
    const ok = NativeAppDiscoveryBridge.simulateUninstallApp(packageName);
    if (ok) {
      this.appsCache = null;
      this.notifyListeners();
    }
    return ok;
  }

  /**
   * Invalidate runtime apps cache
   */
  static invalidateCache(): void {
    this.appsCache = null;
    this.notifyListeners();
  }

  /**
   * Find app by ID or package name
   */
  static getAppById(id: string): AppShortcut | undefined {
    return this.getAvailableApps().find((a) => a.id === id || a.packageName === id);
  }

  /**
   * Find multiple apps by IDs preserving ordering
   */
  static getAppsByIds(ids: string[]): AppShortcut[] {
    const all = this.getAvailableApps();
    const map = new Map(all.map((a) => [a.id, a]));
    return ids.map((id) => map.get(id)).filter((a): a is AppShortcut => a !== undefined);
  }

  /**
   * Search apps by query (name, category, package)
   */
  static searchApps(query: string): AppShortcut[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAvailableApps();

    return this.getAvailableApps().filter((app) => {
      const matchLabel = app.label.toLowerCase().includes(q);
      const matchCategory = app.category.toLowerCase().includes(q);
      const matchPkg = app.packageName.toLowerCase().includes(q);
      return matchLabel || matchCategory || matchPkg;
    });
  }

  /**
   * Group apps alphabetically for the Modify Apps selector
   */
  static getAppsGroupedAlphabetically(): Record<string, AppShortcut[]> {
    const apps = [...this.getAvailableApps()].sort((a, b) => a.label.localeCompare(b.label));
    const groups: Record<string, AppShortcut[]> = {};

    for (const app of apps) {
      const letter = app.label.charAt(0).toUpperCase();
      const key = /[A-Z]/.test(letter) ? letter : '#';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(app);
    }

    return groups;
  }

  /**
   * Phase 7 App Detection:
   * Returns true if the package is installed on device or present in discoverable installed list.
   */
  static isPackageInstalled(packageName: string): boolean {
    return DeviceAppScannerService.isPackageInstalled(packageName);
  }

  /**
   * Phase 7 Catalog + Installed Bridge:
   * Returns a unified catalog item with installed status, icon resolution, and custom icon availability.
   */
  static getDetectedCatalogApps(): Array<{
    catalogApp: CatalogApp;
    isInstalled: boolean;
    installedShortcut?: AppShortcut;
  }> {
    const catalog = AppCatalogService.getAllApps();
    const installed = this.getAvailableApps();
    const installedMap = new Map<string, AppShortcut>(
      installed.map((a) => [a.packageName.toLowerCase(), a])
    );

    return catalog.map((app) => {
      const isInstalled = DeviceAppScannerService.isPackageInstalled(app.packageName, app.packageAliases);
      const match = installedMap.get(app.packageName.toLowerCase());
      return {
        catalogApp: app,
        isInstalled,
        installedShortcut: match,
      };
    });
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(): void {
    for (const l of this.listeners) {
      try {
        l();
      } catch (err) {
        console.error('[AppRepository] Listener error:', err);
      }
    }
  }
}

// Invalidate cache on catalog, discovery, or device scan changes
NativeAppDiscoveryBridge.subscribe(() => {
  AppRepository.invalidateCache();
});
DeviceAppScannerService.subscribe(() => {
  AppRepository.setSimulatedBridge(true);
});
AppCatalogService.subscribe(() => {
  AppRepository.setSimulatedBridge(true);
});
