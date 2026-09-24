/**
 * ONEVA Phase 17: Device-App Discovery & Integration Foundation Types
 * 
 * Defines data structures and validation primitives for native Android
 * PackageManager app discovery, capability awareness, and catalog merging.
 */

export interface RawNativeAppMetadata {
  packageName: string;
  appName?: string;
  label?: string;
  isLaunchable?: boolean;
  launchAvailable?: boolean;
  isSystemApp?: boolean;
  iconRef?: string;
  nativeIconDataUrl?: string;
  versionName?: string;
  versionCode?: number;
  isEnabled?: boolean;
}

export interface DiscoveredInstalledApp {
  packageName: string;
  appName: string;
  isInstalled: boolean;
  launchable: boolean;
  isSystemApp: boolean;
  versionName?: string;
  versionCode?: number;
  isEnabled: boolean;
  nativeIconDataUrl?: string;
  discoveredAt: string;
  source: 'native_android' | 'browser_simulation';
}

export interface AppCapabilityModel {
  packageName: string;
  appName: string;
  installed: boolean;
  launchable: boolean;
  isSystemApp: boolean;
  catalogSupported: boolean;
  iconPackSupported: boolean;
  jarvisLaunchSupported: boolean;
  jarvisInteractionSupported: boolean;
  versionName?: string;
  versionCode?: number;
  isEnabled?: boolean;
  nativeIconDataUrl?: string;
  source: 'native_android' | 'browser_simulation';
}

export interface DiscoveryMergeResult {
  totalDiscovered: number;
  totalLaunchable: number;
  catalogMatchedCount: number;
  nonCatalogDiscoveredCount: number;
  uninstalledCatalogCount: number;
  duplicatePackagesFiltered: number;
  uniquePackageNames: string[];
  mergedApps: AppCapabilityModel[];
}

/**
 * Validates package name against standard Android namespace specifications.
 * e.g. com.example.app, org.videolan.vlc, in.swiggy.android
 */
export function validatePackageName(packageName: unknown): boolean {
  if (typeof packageName !== 'string') return false;
  const trimmed = packageName.trim();
  if (trimmed.length < 3 || trimmed.length > 150) return false;
  // Android package name regex: starts with letter, dot-separated segments, letters/numbers/underscores
  const pkgRegex = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;
  return pkgRegex.test(trimmed);
}

/**
 * Sanitizes untrusted user/system app labels, strips control characters and truncates.
 */
export function sanitizeAppLabel(rawLabel: unknown, fallbackPackage: string): string {
  if (typeof rawLabel !== 'string' || !rawLabel.trim()) {
    // Generate readable fallback from package name e.g. com.foo.bar -> Bar
    const parts = fallbackPackage.split('.');
    const lastPart = parts[parts.length - 1] || 'App';
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  }
  // Strip non-printable ASCII / control characters & HTML tags
  const sanitized = rawLabel
    .replace(/[<>'"&]/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();
  return sanitized.slice(0, 80) || 'Application';
}
