export * from './adminAssets';
export type UserRole = 'admin' | 'superadmin' | 'user';

export interface AdminProfile {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: string;
  lastSignInAt?: string;
}

export type FeatureStatus = 'draft' | 'testing' | 'verified' | 'published' | 'disabled';

export type FeatureId =
  | 'oneva_ui'
  | 'oneva_glow'
  | 'oneva_themes'
  | 'oneva_icons'
  | 'oneva_keyboard'
  | 'oneva_assist'
  | 'oneva_vision'
  | 'oneva_upgrade_center';

export interface FeatureManifest {
  id: FeatureId;
  name: string;
  tagline: string;
  description: string;
  version: string;
  status: FeatureStatus;
  isLocalOnly: boolean;
  category: 'core' | 'appearance' | 'input' | 'intelligence' | 'system';
  icon: string;
  minClientVersion: string;
  supportedAndroidVersions: string[];
  remoteConfigKey?: string;
}

export interface FeatureVersion {
  id: string;
  featureId: FeatureId;
  version: string;
  status: FeatureStatus;
  changelog: string[];
  minClientVersion: string;
  targetAndroidVersion: string;
  publishedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RemoteConfig {
  id: string;
  key: string;
  value: unknown;
  description: string;
  isActive: boolean;
  minClientVersion: string;
  environment: 'production' | 'staging' | 'development';
  updatedAt: string;
}

export type AssetType =
  | 'live_wallpaper'
  | 'system_ui'
  | 'keyboard_theme'
  | 'app_icon'
  | 'icon_pack'
  | 'wallpaper';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  storagePath: string;
  bucket: 'oneva-public-assets' | 'oneva-admin-assets';
  publicUrl?: string;
  version: string;
  fileSizeBytes: number;
  mimeType: string;
  status: FeatureStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AssetVersion {
  id: string;
  assetId: string;
  version: string;
  storagePath: string;
  status: FeatureStatus;
  publishedAt?: string;
  createdAt: string;
}

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface ErrorReport {
  id: string;
  errorCode: string;
  message: string;
  featureName: string;
  severity: ErrorSeverity;
  userConsented: boolean;
  clientVersion: string;
  platform: string;
  deviceModel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface BackendHealth {
  isConfigured: boolean;
  isOnline: boolean;
  latencyMs?: number;
  lastChecked: string;
  errorDetails?: string;
  urlPreview?: string;
}

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  urlPreview?: string;
}

export interface ConnectionTestResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  latencyMs?: number;
  timestamp?: string;
  details?: Record<string, unknown>;
}
