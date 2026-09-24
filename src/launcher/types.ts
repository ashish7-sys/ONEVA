export type IconShape = 'squircle' | 'rounded' | 'circle';

export type WallpaperPresetId =
  | 'deep-onyx'
  | 'obsidian-nebula'
  | 'emerald-aurora'
  | 'midnight-slate'
  | 'true-black'
  | 'gallery-custom'
  | string;

export interface WallpaperPreset {
  id: string;
  name: string;
  cssBackground: string;
  accentColor: string;
  textColor: string;
  isCustom?: boolean;
}

export type AppCategory =
  | 'system'
  | 'communication'
  | 'media'
  | 'productivity'
  | 'utilities'
  | 'tools'
  | 'social'
  | 'entertainment'
  | 'finance'
  | 'shopping'
  | 'lifestyle'
  | 'developer';

export type ModificationType =
  | 'custom_icon'
  | 'custom_accent'
  | 'custom_label'
  | 'custom_badge'
  | 'notification_glow_profile';

export type ModificationSupportStatus =
  | 'supported'
  | 'partially_supported'
  | 'requires_permission'
  | 'unsupported'
  | 'coming_soon';

export interface AppEnhancementProfile {
  packageName: string;
  customIconName?: string;
  customAccentColor?: string;
  customLabel?: string;
  customBadge?: string;
  glowProfileColor?: string;
  hasActiveEnhancement: boolean;
  updatedAt?: string;
}

export interface CapabilityCheckResult {
  modificationType: ModificationType;
  status: ModificationSupportStatus;
  isPermitted: boolean;
  reason: string;
  mechanism: string;
  requiresExternalPermission?: string;
}

export interface ResolvedAppVisuals {
  label: string;
  iconName: string;
  accentColor: string;
  badge?: string;
  isEnhanced: boolean;
  fallbackUsed: boolean;
  fallbackReason?: string;
}

export interface AppShortcut {
  id: string;
  packageName: string;
  label: string;
  iconName: string;
  category: AppCategory;
  isSystemApp: boolean;
  accentColor: string;
  fallbackInitial: string;
  customBadge?: string;
  webFallbackIntent?: string;
  source?: 'device_installed';
  enhancementProfile?: AppEnhancementProfile;
  launchAvailable?: boolean;
  supportedCustomizations?: ('icon')[];
  discoverySource?: 'native_android' | 'browser_simulation';
  // Phase 17: App Capability Model & Discovery Foundation
  installed?: boolean;
  launchable?: boolean;
  catalogSupported?: boolean;
  iconPackSupported?: boolean;
  jarvisLaunchSupported?: boolean;
  jarvisInteractionSupported?: boolean;
  nativeIconDataUrl?: string;
  versionName?: string;
  versionCode?: number;
  isEnabled?: boolean;
}

export interface LauncherSettings {
  gridRows: 4 | 5;
  gridCols: 4 | 5;
  wallpaperId: WallpaperPresetId;
  customWallpaperUrl?: string;
  wallpaperSource?: 'admin_pack' | 'preset' | 'gallery' | 'picker' | 'external_app' | 'system_settings';
  iconShape: IconShape;
  showClockWidget: boolean;
  showGreeting: boolean;
  dockAppIds: string[];
  homeScreenAppIds: string[];
  enableReducedMotion: boolean;
  activeThemeMode: 'dark' | 'oled';
}

export type PlatformMode = 'native-android' | 'web-preview';

export interface AndroidSystemStats {
  batteryLevel: number;
  isCharging: boolean;
  networkType: '5G' | 'LTE' | 'Wi-Fi' | 'Offline';
  isSilentMode: boolean;
}

export interface LaunchResult {
  success: boolean;
  message: string;
  packageName: string;
  intentUsed?: string;
  mode?: 'native-android' | 'web-preview';
  fallbackUrl?: string;
  isInstalled?: boolean;
}

export interface PermissionDefinition {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'privacy' | 'launcher';
  rationale: string;
  isCurrentlyRequired: boolean;
  isGranted: boolean;
}
