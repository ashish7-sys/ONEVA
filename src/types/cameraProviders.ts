/**
 * ONEVA Multi-Camera Provider Architecture
 * Definitions for candidate external camera engines, explicit state model, and built-in fallback.
 */

export type CameraProviderId =
  | 'samsung_expert_raw'
  | 'lmc_8_4'
  | 'gcam_compatible'
  | 'motioncam'
  | 'adobe_lightroom'
  | 'open_camera'
  | 'proshot'
  | 'camera_fv5'
  | 'blackmagic_cam'
  | 'procam_x'
  | 'oneva_builtin';

export type CameraHardwareLevel = 'LIMITED' | 'FULL' | 'LEVEL_3' | 'ANY';

export type CameraDistributionChannel =
  | 'google_play'
  | 'samsung_galaxy_store'
  | 'official_direct_apk'
  | 'official_web_source'
  | 'builtin_system';

export type CameraSourceType =
  | 'OFFICIAL_WEBSITE'
  | 'OFFICIAL_REPOSITORY'
  | 'GOOGLE_PLAY'
  | 'SAMSUNG_GALAXY_STORE'
  | 'COMMUNITY_PORT_REPOSITORY';

export interface CameraProviderCapabilities {
  hdr: boolean;
  multiFrameBurst: boolean;
  noiseReduction: boolean;
  dynamicRange: boolean;
  detailSharpening: boolean;
  colorWhiteBalance: boolean;
  lowLightOptics: boolean;
  portraitDepth: boolean;
  videoStabilization: boolean;
  rawCapture: boolean;
  deviceSpecific: boolean;
  processingSummary: string;
}

export interface DeviceSupportRule {
  brandMustMatch?: string;
  allowedModelPrefixes?: string[]; // e.g. ['SM-S92', 'SM-S91', 'SM-S90', 'SM-G998', 'SM-G988', 'SM-F9']
  minAndroidVersion?: number;
  minCameraLevel?: CameraHardwareLevel;
  requiredAbi?: 'arm64-v8a' | 'any';
}

export interface CameraProviderDefinition {
  id: CameraProviderId;
  displayName: string;
  vendor: string;
  tagline: string;
  priorityOrder: number; // 1 = highest priority candidate
  packageVariants: string[];
  primaryPackageName: string;
  minAndroidVersion: number;
  requiredAbi?: 'arm64-v8a' | 'any';
  supportedBrands?: string[];
  cameraLevelRequired: CameraHardwareLevel;
  distributionChannel: CameraDistributionChannel;
  sourceCategory: CameraSourceType;
  officialWebUrl: string;
  directApkDownloadUrl?: string; // Only when verified direct distribution exists
  apkFileName?: string;
  apkVersionName?: string;
  apkApproxSize?: string;
  officialSourceNotice?: string;
  expectedSha256?: string; // 64-character lowercase SHA-256 hash for byte verification
  sha256Verification?: string;
  playStorePackage?: string;
  galaxyStorePackage?: string;
  capabilities: CameraProviderCapabilities;
  deviceSupportRule?: DeviceSupportRule;
  isExternal: boolean;
  knownLimitations?: string;
}

/**
 * Explicit Provider Eligibility State Model
 */
export type ProviderEligibilityState =
  | 'THEORETICALLY_ELIGIBLE'
  | 'POTENTIALLY_COMPATIBLE'
  | 'INSTALLED'
  | 'LAUNCHABLE'
  | 'RUNTIME_WORKING'
  | 'RUNTIME_FAILED'
  | 'UNSUPPORTED'
  | 'USER_SKIPPED'
  | 'NOT_INSTALLED'
  | 'INSTALLED_NOT_LAUNCHABLE'
  | 'HARDWARE_UNSUPPORTED'
  | 'UNKNOWN_COMPATIBILITY'
  | 'ELIGIBLE'
  | 'WORKING';

export interface EvaluatedCameraCandidate {
  provider: CameraProviderDefinition;
  eligibility: ProviderEligibilityState;
  installedPackageName?: string;
  isInstalled: boolean;
  isLaunchable: boolean;
  score: number;
  reason: string;
  compatibilityLabel: 'Verified Working' | 'Potentially Compatible' | 'Hardware Incompatible' | 'Runtime Failed' | 'Not Installed' | 'Device Dependent';
}

export interface CameraProviderManagerStatus {
  selectedProviderId: CameraProviderId;
  selectedProviderName: string;
  isExternal: boolean;
  installedPackage?: string;
  fallbackActive: boolean;
  candidatesEvaluated: EvaluatedCameraCandidate[];
  lastLaunchTime?: number;
  lastLaunchPackage?: string;
}
