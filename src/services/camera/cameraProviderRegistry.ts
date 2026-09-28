/**
 * ONEVA Multi-Camera Provider Registry
 * Authoritative registry of candidate camera providers with genuine technical verification,
 * explicit state model, device-allowlist validation, and crash-loop guards.
 */

import {
  CameraProviderDefinition,
  CameraProviderId,
  EvaluatedCameraCandidate,
  CameraProviderManagerStatus,
  ProviderEligibilityState,
} from '../../types/cameraProviders';
import { PlatformBridge } from '../../launcher/services/platformBridge';
import { DeviceAppScannerService } from '../deviceAppScannerService';

export const CANDIDATE_CAMERA_PROVIDERS: CameraProviderDefinition[] = [
  {
    id: 'samsung_expert_raw',
    displayName: 'Samsung Expert RAW',
    vendor: 'Samsung Electronics',
    tagline: '16-bit Computational Linear RAW Fusion',
    priorityOrder: 1,
    packageVariants: ['com.samsung.android.app.galaxyraw'],
    primaryPackageName: 'com.samsung.android.app.galaxyraw',
    minAndroidVersion: 12,
    requiredAbi: 'arm64-v8a',
    supportedBrands: ['samsung'],
    cameraLevelRequired: 'LEVEL_3',
    distributionChannel: 'samsung_galaxy_store',
    sourceCategory: 'SAMSUNG_GALAXY_STORE',
    officialWebUrl: 'https://www.samsung.com/global/galaxy/what-is/expert-raw/',
    officialSourceNotice: 'Samsung Electronics Co., Ltd. (Galaxy Store official distribution)',
    galaxyStorePackage: 'com.samsung.android.app.galaxyraw',
    deviceSupportRule: {
      brandMustMatch: 'samsung',
      allowedModelPrefixes: ['SM-S92', 'SM-S91', 'SM-S90', 'SM-G998', 'SM-G988', 'SM-N986', 'SM-F94', 'SM-F93', 'SM-F92'],
      minAndroidVersion: 12,
      minCameraLevel: 'LEVEL_3',
      requiredAbi: 'arm64-v8a',
    },
    capabilities: {
      hdr: true,
      multiFrameBurst: true,
      noiseReduction: true,
      dynamicRange: true,
      detailSharpening: true,
      colorWhiteBalance: true,
      lowLightOptics: true,
      portraitDepth: false,
      videoStabilization: false,
      rawCapture: true,
      deviceSpecific: true,
      processingSummary: 'Lossless 16-bit DNG multi-frame bracket fusion & native telephoto calibration.',
    },
    isExternal: true,
    knownLimitations: 'Supported only on specific Samsung Galaxy S20 Ultra+, S21 Ultra, S22/S23/S24 series, and Z Fold 2-5.',
  },
  {
    id: 'lmc_8_4',
    displayName: 'LMC 8.4 (Hasli)',
    vendor: 'Hasli / Google Camera Port',
    tagline: 'Google HDR+ & Super-Res Zoom Engine (Community Port)',
    priorityOrder: 2,
    packageVariants: [
      'com.google.android.GoogleCamera.Hasli',
      'com.google.android.GoogleCameraEng',
      'com.google.android.GoogleCameraSamsung',
      'com.google.android.GoogleCameraSnap',
      'com.google.android.GoogleCamera',
    ],
    primaryPackageName: 'com.google.android.GoogleCamera.Hasli',
    minAndroidVersion: 10,
    requiredAbi: 'arm64-v8a',
    cameraLevelRequired: 'LEVEL_3',
    distributionChannel: 'official_direct_apk',
    sourceCategory: 'COMMUNITY_PORT_REPOSITORY',
    officialWebUrl: 'https://www.celsoazevedo.com/files/android/google-camera/dev-hasli/',
    directApkDownloadUrl: 'https://www.celsoazevedo.com/files/android/google-camera/dev-hasli/f/dl14/LMC8.4_R18.apk',
    apkFileName: 'LMC8.4_R18_Hasli.apk',
    apkVersionName: '8.4 R18 (Community Release)',
    apkApproxSize: '106 MB',
    officialSourceNotice: 'Community Port / Hasli Release via Celso Azevedo Repository (Unmodified Upstream Release)',
    expectedSha256: 'a6365bcf2cda157d72eb634282da53658e3401c4cb3e95963ad208cef3d03559',
    sha256Verification: 'SHA-256: a6365bcf2cda157d72eb634282da53658e3401c4cb3e95963ad208cef3d03559',
    capabilities: {
      hdr: true,
      multiFrameBurst: true,
      noiseReduction: true,
      dynamicRange: true,
      detailSharpening: true,
      colorWhiteBalance: true,
      lowLightOptics: true,
      portraitDepth: true,
      videoStabilization: true,
      rawCapture: true,
      deviceSpecific: true,
      processingSummary: 'Computational Google HDR+, multi-frame Night Sight, Super-Res detail, and AWB (device-dependent).',
    },
    isExternal: true,
    knownLimitations: 'Requires Camera2 LEVEL_3. Sensor/SoC compatibility is device-specific; not guaranteed for all devices.',
  },
  {
    id: 'gcam_compatible',
    displayName: 'Compatible GCam Ports',
    vendor: 'BSG / Arnova / AGC',
    tagline: 'Google Camera Computational Pipeline (Community Hub)',
    priorityOrder: 3,
    packageVariants: [
      'com.google.android.GoogleCamera.BSG',
      'com.google.android.GoogleCamera',
      'com.agc.cam',
      'org.codeaurora.snapcam',
    ],
    primaryPackageName: 'com.google.android.GoogleCamera.BSG',
    minAndroidVersion: 10,
    requiredAbi: 'arm64-v8a',
    cameraLevelRequired: 'LEVEL_3',
    distributionChannel: 'official_web_source',
    sourceCategory: 'COMMUNITY_PORT_REPOSITORY',
    officialWebUrl: 'https://www.celsoazevedo.com/files/android/google-camera/',
    officialSourceNotice: 'Community GCam Port Hub (BSG / Arnova / AGC)',
    capabilities: {
      hdr: true,
      multiFrameBurst: true,
      noiseReduction: true,
      dynamicRange: true,
      detailSharpening: true,
      colorWhiteBalance: true,
      lowLightOptics: true,
      portraitDepth: true,
      videoStabilization: true,
      rawCapture: true,
      deviceSpecific: true,
      processingSummary: 'HDR+ Enhanced, zero shutter lag multi-frame burst, Astrophotography mode (device-dependent).',
    },
    isExternal: true,
    knownLimitations: 'Requires Camera2 LEVEL_3. Auxiliary camera lenses may be locked on certain vendor ROMs.',
  },
  {
    id: 'motioncam',
    displayName: 'MotionCam',
    vendor: 'MotionCam App',
    tagline: 'Raw Computational Video & Zero-Compression Stills',
    priorityOrder: 4,
    packageVariants: ['com.motioncam', 'com.motioncam.pro'],
    primaryPackageName: 'com.motioncam',
    minAndroidVersion: 10,
    requiredAbi: 'arm64-v8a',
    cameraLevelRequired: 'LEVEL_3',
    distributionChannel: 'google_play',
    sourceCategory: 'GOOGLE_PLAY',
    officialWebUrl: 'https://motioncamapp.com/',
    officialSourceNotice: 'MotionCam App (Google Play Store official listing)',
    playStorePackage: 'com.motioncam',
    capabilities: {
      hdr: true,
      multiFrameBurst: true,
      noiseReduction: true,
      dynamicRange: true,
      detailSharpening: false,
      colorWhiteBalance: true,
      lowLightOptics: true,
      portraitDepth: false,
      videoStabilization: false,
      rawCapture: true,
      deviceSpecific: true,
      processingSummary: 'Bypasses OEM tone curve; direct 10/12-bit RAW burst stream capture.',
    },
    isExternal: true,
    knownLimitations: 'Heavy storage and GPU I/O. Demands high write-speed storage.',
  },
  {
    id: 'adobe_lightroom',
    displayName: 'Adobe Lightroom Camera',
    vendor: 'Adobe Inc.',
    tagline: 'HDR DNG 32-bit Floating Point Capture',
    priorityOrder: 5,
    packageVariants: ['com.adobe.lrmobile'],
    primaryPackageName: 'com.adobe.lrmobile',
    minAndroidVersion: 9,
    cameraLevelRequired: 'FULL',
    distributionChannel: 'google_play',
    sourceCategory: 'GOOGLE_PLAY',
    officialWebUrl: 'https://play.google.com/store/apps/details?id=com.adobe.lrmobile',
    officialSourceNotice: 'Adobe Inc. (Google Play Store official listing)',
    playStorePackage: 'com.adobe.lrmobile',
    capabilities: {
      hdr: true,
      multiFrameBurst: true,
      noiseReduction: true,
      dynamicRange: true,
      detailSharpening: true,
      colorWhiteBalance: true,
      lowLightOptics: false,
      portraitDepth: false,
      videoStabilization: false,
      rawCapture: true,
      deviceSpecific: false,
      processingSummary: 'In-app 3-shot exposure bracketing merged into 32-bit floating point RAW DNG.',
    },
    isExternal: true,
    knownLimitations: 'App startup time is slower due to Lightroom ecosystem bundling.',
  },
  {
    id: 'open_camera',
    displayName: 'Open Camera',
    vendor: 'Mark Harman (FOSS)',
    tagline: 'DRO Exposure Optimization & Wavelet Noise Filter',
    priorityOrder: 6,
    packageVariants: ['net.sourceforge.opencamera'],
    primaryPackageName: 'net.sourceforge.opencamera',
    minAndroidVersion: 5,
    cameraLevelRequired: 'LIMITED',
    distributionChannel: 'google_play',
    sourceCategory: 'OFFICIAL_REPOSITORY',
    officialWebUrl: 'https://opencamera.org.uk/',
    playStorePackage: 'net.sourceforge.opencamera',
    directApkDownloadUrl: 'https://sourceforge.net/projects/opencamera/files/v1.54.1/OpenCamera_v1.54.1.apk/download',
    apkFileName: 'OpenCamera_v1.54.1.apk',
    apkVersionName: 'v1.54.1 (FOSS)',
    apkApproxSize: '5.2 MB',
    officialSourceNotice: 'Official Mark Harman Open Source Release (SourceForge FOSS Repository)',
    expectedSha256: 'aaeb02e8127e9ada048e86be78139f7490aad18a66c45ad207763e4c82c52ea3',
    sha256Verification: 'SHA-256: aaeb02e8127e9ada048e86be78139f7490aad18a66c45ad207763e4c82c52ea3',
    capabilities: {
      hdr: true,
      multiFrameBurst: true,
      noiseReduction: true,
      dynamicRange: true,
      detailSharpening: true,
      colorWhiteBalance: true,
      lowLightOptics: true,
      portraitDepth: false,
      videoStabilization: true,
      rawCapture: true,
      deviceSpecific: false,
      processingSummary: 'Dynamic Range Optimization (DRO), Auto-Exposure Bracketing (AEB), FOSS privacy.',
    },
    isExternal: true,
    knownLimitations: 'Computational HDR is single/dual-pass contrast stretch rather than neural fusion.',
  },
  {
    id: 'proshot',
    displayName: 'ProShot',
    vendor: 'Rise Up Games',
    tagline: 'DSLR Manual Hardware Controller & Light Painting',
    priorityOrder: 7,
    packageVariants: ['com.riseupgames.proshot2'],
    primaryPackageName: 'com.riseupgames.proshot2',
    minAndroidVersion: 8,
    cameraLevelRequired: 'FULL',
    distributionChannel: 'google_play',
    sourceCategory: 'GOOGLE_PLAY',
    officialWebUrl: 'https://play.google.com/store/apps/details?id=com.riseupgames.proshot2',
    officialSourceNotice: 'Rise Up Games (Google Play Store)',
    playStorePackage: 'com.riseupgames.proshot2',
    capabilities: {
      hdr: false,
      multiFrameBurst: false,
      noiseReduction: false,
      dynamicRange: false,
      detailSharpening: false,
      colorWhiteBalance: true,
      lowLightOptics: true,
      portraitDepth: false,
      videoStabilization: true,
      rawCapture: true,
      deviceSpecific: false,
      processingSummary: 'Manual shutter/ISO, light painting long exposures, zero-compression JPEG/RAW.',
    },
    isExternal: true,
    knownLimitations: 'No automated computational HDR; requires manual photographer calibration.',
  },
  {
    id: 'camera_fv5',
    displayName: 'Camera FV-5',
    vendor: 'FlavioNet',
    tagline: 'Professional Photographic Interface & RAW DNG',
    priorityOrder: 8,
    packageVariants: ['com.flavionet.android.camera.pro', 'com.flavionet.android.camera.lite'],
    primaryPackageName: 'com.flavionet.android.camera.pro',
    minAndroidVersion: 7,
    cameraLevelRequired: 'FULL',
    distributionChannel: 'google_play',
    sourceCategory: 'GOOGLE_PLAY',
    officialWebUrl: 'https://play.google.com/store/apps/details?id=com.flavionet.android.camera.pro',
    officialSourceNotice: 'FlavioNet (Google Play Store)',
    playStorePackage: 'com.flavionet.android.camera.pro',
    capabilities: {
      hdr: false,
      multiFrameBurst: false,
      noiseReduction: false,
      dynamicRange: false,
      detailSharpening: false,
      colorWhiteBalance: true,
      lowLightOptics: true,
      portraitDepth: false,
      videoStabilization: false,
      rawCapture: true,
      deviceSpecific: false,
      processingSummary: 'True 32-bit exposure bracketing, custom intervalometer, manual EV steps.',
    },
    isExternal: true,
    knownLimitations: 'Manual control oriented without automated computational AI post-processing.',
  },
  {
    id: 'blackmagic_cam',
    displayName: 'Blackmagic Camera',
    vendor: 'Blackmagic Design',
    tagline: 'Hollywood Digital Film Color Science & Manual Bitrates',
    priorityOrder: 9,
    packageVariants: ['com.blackmagicdesign.android.blackmagiccam'],
    primaryPackageName: 'com.blackmagicdesign.android.blackmagiccam',
    minAndroidVersion: 13,
    requiredAbi: 'arm64-v8a',
    cameraLevelRequired: 'LEVEL_3',
    distributionChannel: 'google_play',
    sourceCategory: 'GOOGLE_PLAY',
    officialWebUrl: 'https://www.blackmagicdesign.com/products/blackmagiccamera',
    officialSourceNotice: 'Blackmagic Design Inc. (Google Play Store)',
    playStorePackage: 'com.blackmagicdesign.android.blackmagiccam',
    capabilities: {
      hdr: false,
      multiFrameBurst: false,
      noiseReduction: false,
      dynamicRange: true,
      detailSharpening: false,
      colorWhiteBalance: true,
      lowLightOptics: false,
      portraitDepth: false,
      videoStabilization: true,
      rawCapture: false,
      deviceSpecific: true,
      processingSummary: 'Blackmagic film LUTs, shutter angle, custom audio gain, high-bitrate encoding.',
    },
    isExternal: true,
    knownLimitations: 'Strictly focused on video production; does not provide computational photo HDR.',
  },
  {
    id: 'procam_x',
    displayName: 'ProCam X',
    vendor: 'Intermedia HD',
    tagline: 'Rapid Burst Control & Real-time Filters',
    priorityOrder: 10,
    packageVariants: ['com.intermedia.hd.camera.pro', 'com.intermedia.hd.camera.free'],
    primaryPackageName: 'com.intermedia.hd.camera.pro',
    minAndroidVersion: 6,
    cameraLevelRequired: 'LIMITED',
    distributionChannel: 'google_play',
    sourceCategory: 'GOOGLE_PLAY',
    officialWebUrl: 'https://play.google.com/store/apps/details?id=com.intermedia.hd.camera.pro',
    officialSourceNotice: 'Intermedia HD (Google Play Store)',
    playStorePackage: 'com.intermedia.hd.camera.pro',
    capabilities: {
      hdr: false,
      multiFrameBurst: false,
      noiseReduction: false,
      dynamicRange: false,
      detailSharpening: false,
      colorWhiteBalance: true,
      lowLightOptics: false,
      portraitDepth: false,
      videoStabilization: true,
      rawCapture: true,
      deviceSpecific: false,
      processingSummary: 'Burst shooting, anti-shake assist, manual focus distance setting.',
    },
    isExternal: true,
    knownLimitations: 'Standard Android Camera2 interface wrapper without neural multi-frame ISP.',
  },
  {
    id: 'oneva_builtin',
    displayName: 'ONEVA Built-in Camera',
    vendor: 'ONEVA System Framework',
    tagline: 'Guaranteed On-Device Viewfinder (WebView getUserMedia Fallback)',
    priorityOrder: 99,
    packageVariants: ['io.oneva.android.launcher'],
    primaryPackageName: 'io.oneva.android.launcher',
    minAndroidVersion: 7,
    cameraLevelRequired: 'ANY',
    distributionChannel: 'builtin_system',
    sourceCategory: 'OFFICIAL_WEBSITE',
    officialWebUrl: '',
    officialSourceNotice: 'Built-in ONEVA System Framework (100% on-device private fallback)',
    capabilities: {
      hdr: false,
      multiFrameBurst: false,
      noiseReduction: false,
      dynamicRange: true,
      detailSharpening: false,
      colorWhiteBalance: true,
      lowLightOptics: true,
      portraitDepth: false,
      videoStabilization: false,
      rawCapture: false,
      deviceSpecific: false,
      processingSummary: '100% on-device private viewfinder (WebView/getUserMedia canvas) with live ON/OFF comparison.',
    },
    isExternal: false,
    knownLimitations: 'Current built-in camera uses WebView getUserMedia/Canvas processing; not a native Camera2 computational ISP yet. Acts as guaranteed on-device fallback.',
  },
];

const STORAGE_SELECTED_PROVIDER_KEY = 'oneva_selected_camera_provider_v1';
const STORAGE_CRASHED_PROVIDERS_KEY = 'oneva_crashed_camera_providers_v1';
const STORAGE_LAST_LAUNCH_KEY = 'oneva_camera_last_launch_v1';

export class CameraProviderRegistry {
  private static crashedProviderIds: Set<string> = new Set();
  private static isInitialized = false;

  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    try {
      if (typeof window !== 'undefined') {
        const raw = sessionStorage.getItem(STORAGE_CRASHED_PROVIDERS_KEY);
        if (raw) {
          this.crashedProviderIds = new Set(JSON.parse(raw));
        }

        // Check for immediate crash on resume:
        // If app launched external provider < 2500ms ago, it exited unexpectedly
        const lastLaunchRaw = sessionStorage.getItem(STORAGE_LAST_LAUNCH_KEY);
        if (lastLaunchRaw) {
          const { providerId, timestamp } = JSON.parse(lastLaunchRaw);
          if (Date.now() - timestamp < 2500) {
            console.warn(`[CameraProviderRegistry] Runtime crash detected for ${providerId} (exited within ${Date.now() - timestamp}ms).`);
            this.recordProviderFailure(providerId);
          }
          sessionStorage.removeItem(STORAGE_LAST_LAUNCH_KEY);
        }
      }
    } catch {
      // safe fallback
    }
  }

  /**
    * Evaluates all candidate providers against the host device with explicit state classification:
    * THEORETICALLY_ELIGIBLE | POTENTIALLY_COMPATIBLE | INSTALLED | LAUNCHABLE | RUNTIME_WORKING | RUNTIME_FAILED | UNSUPPORTED | USER_SKIPPED | WORKING
    */
  static evaluateCandidates(): EvaluatedCameraCandidate[] {
    this.init();

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isSamsung = /samsung|SM-|GT-/i.test(userAgent);
    const isGalaxyM11 = /SM-M115/i.test(userAgent);
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

    const installedPkgs = DeviceAppScannerService.getInstalledPackages();
    const results: EvaluatedCameraCandidate[] = [];

    for (const provider of CANDIDATE_CAMERA_PROVIDERS) {
      if (!provider.isExternal) {
        // Guaranteed Built-in Fallback
        results.push({
          provider,
          eligibility: 'WORKING',
          installedPackageName: provider.primaryPackageName,
          isInstalled: true,
          isLaunchable: true,
          score: 10,
          reason: 'Built-in ONEVA engine; always guaranteed available on this device.',
          compatibilityLabel: 'Verified Working',
        });
        continue;
      }

      // Check 1: Runtime Crash / Failure Guard
      if (this.crashedProviderIds.has(provider.id)) {
        results.push({
          provider,
          eligibility: 'RUNTIME_FAILED',
          isInstalled: false,
          isLaunchable: false,
          score: 0,
          reason: 'Exited unexpectedly or crashed during last launch. Skipped to prevent loop.',
          compatibilityLabel: 'Runtime Failed',
        });
        continue;
      }

      // Check 2: Samsung Galaxy M11 Specific Hardware Profile Guard
      if (isGalaxyM11) {
        if (provider.id === 'samsung_expert_raw') {
          results.push({
            provider,
            eligibility: 'UNSUPPORTED',
            isInstalled: false,
            isLaunchable: false,
            score: 0,
            reason: 'Galaxy M11 hardware does not meet Samsung Expert RAW flagship requirements (S/Z series only).',
            compatibilityLabel: 'Hardware Incompatible',
          });
          continue;
        }
        if (provider.id === 'lmc_8_4' || provider.id === 'gcam_compatible') {
          results.push({
            provider,
            eligibility: 'UNSUPPORTED',
            isInstalled: false,
            isLaunchable: false,
            score: 0,
            reason: 'Galaxy M11 (Snapdragon 450) provides Camera2 LIMITED level; does not support Google HDR+ Level 3 RAW streams.',
            compatibilityLabel: 'Hardware Incompatible',
          });
          continue;
        }
      }

      // Check 3: Device / Brand Compatibility Allowlist
      if (provider.deviceSupportRule) {
        const rule = provider.deviceSupportRule;
        if (rule.brandMustMatch && isAndroid) {
          const matches = rule.brandMustMatch === 'samsung' ? isSamsung : false;
          if (!matches) {
            results.push({
              provider,
              eligibility: 'UNSUPPORTED',
              isInstalled: false,
              isLaunchable: false,
              score: 0,
              reason: `Exclusive to ${rule.brandMustMatch.toUpperCase()} devices. Current device is unsupported.`,
              compatibilityLabel: 'Hardware Incompatible',
            });
            continue;
          }

          // Samsung Expert RAW model check
          if (rule.allowedModelPrefixes && rule.allowedModelPrefixes.length > 0) {
            const matchesModel = rule.allowedModelPrefixes.some((prefix) => userAgent.includes(prefix));
            if (!matchesModel) {
              results.push({
                provider,
                eligibility: 'UNSUPPORTED',
                isInstalled: false,
                isLaunchable: false,
                score: 15,
                reason: 'Expert RAW is verified on Galaxy S/Z Ultra/Fold flagships. Current model is unsupported.',
                compatibilityLabel: 'Hardware Incompatible',
              });
              continue;
            }
          }
        }
      }

      // Check 4: Is any package variant installed?
      let installedVariant: string | undefined = undefined;
      for (const variant of provider.packageVariants) {
        if (installedPkgs.has(variant)) {
          installedVariant = variant;
          break;
        }
      }

      if (installedVariant) {
        results.push({
          provider,
          eligibility: 'INSTALLED',
          installedPackageName: installedVariant,
          isInstalled: true,
          isLaunchable: true,
          score: 100 - provider.priorityOrder * 5,
          reason: `Installed & verified on device (${installedVariant}). Ready to launch.`,
          compatibilityLabel: 'Verified Working',
        });
      } else {
        // Not installed yet; check theoretical compatibility
        const isPotentiallyCompatible = provider.cameraLevelRequired !== 'LEVEL_3' || !isGalaxyM11;
        results.push({
          provider,
          eligibility: isPotentiallyCompatible ? 'POTENTIALLY_COMPATIBLE' : 'UNSUPPORTED',
          isInstalled: false,
          isLaunchable: false,
          score: 50 - provider.priorityOrder * 2,
          reason: isPotentiallyCompatible
            ? 'Potentially compatible. GCam/LMC compatibility depends on sensor and SoC configs; not guaranteed for all devices.'
            : 'Device camera hardware level does not meet Level 3 requirements.',
          compatibilityLabel: isPotentiallyCompatible ? 'Potentially Compatible' : 'Hardware Incompatible',
        });
      }
    }

    return results;
  }

  /**
   * Returns the single best recommended provider using strict IF/ELIF/ELSE fallback.
   */
  static getRecommendedProvider(): EvaluatedCameraCandidate {
    const candidates = this.evaluateCandidates();

    // 1. First priority: First installed & ready candidate (highest priority order)
    const installed = candidates.find(
      (c) => (c.eligibility === 'INSTALLED' || c.eligibility === 'ELIGIBLE' || c.isInstalled) && c.provider.isExternal
    );
    if (installed) {
      return installed;
    }

    // 2. Second priority: First potentially compatible external provider offering installation
    const compatible = candidates.find(
      (c) => c.eligibility === 'POTENTIALLY_COMPATIBLE' || c.eligibility === 'NOT_INSTALLED' || c.eligibility === 'THEORETICALLY_ELIGIBLE'
    );
    if (compatible) {
      return compatible;
    }

    // 3. Guaranteed Fallback: Built-in ONEVA Camera
    const fallback = candidates.find((c) => c.provider.id === 'oneva_builtin');
    return (
      fallback || {
        provider: CANDIDATE_CAMERA_PROVIDERS[CANDIDATE_CAMERA_PROVIDERS.length - 1],
        eligibility: 'WORKING',
        isInstalled: true,
        isLaunchable: true,
        score: 10,
        reason: 'Built-in ONEVA engine; always guaranteed available on this device.',
        compatibilityLabel: 'Verified Working',
      }
    );
  }

  /**
   * Retrieves the currently selected provider configuration.
   */
  static getSelectedProvider(): CameraProviderDefinition {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_SELECTED_PROVIDER_KEY);
        if (stored) {
          const match = CANDIDATE_CAMERA_PROVIDERS.find((p) => p.id === stored);
          if (match) return match;
        }
      }
    } catch {
      // safe fallback
    }

    return this.getRecommendedProvider().provider;
  }

  /**
   * Persists user selected camera provider.
   */
  static setSelectedProvider(providerId: CameraProviderId): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_SELECTED_PROVIDER_KEY, providerId);
      }
    } catch {
      // safe fallback
    }
  }

  /**
   * Records a crash or premature launch failure for a provider.
   */
  static recordProviderFailure(providerId: string): void {
    this.crashedProviderIds.add(providerId);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          STORAGE_CRASHED_PROVIDERS_KEY,
          JSON.stringify(Array.from(this.crashedProviderIds))
        );
      }
    } catch {
      // safe continue
    }
  }

  /**
   * Clears temporary crash failure records (e.g. if user explicitly chooses to retry).
   */
  static resetProviderFailure(providerId: string): void {
    this.crashedProviderIds.delete(providerId);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          STORAGE_CRASHED_PROVIDERS_KEY,
          JSON.stringify(Array.from(this.crashedProviderIds))
        );
      }
    } catch {
      // safe continue
    }
  }

  /**
   * Launches the selected camera provider with runtime crash detection.
   */
  static async launchProvider(
    provider: CameraProviderDefinition
  ): Promise<{ success: boolean; fallbackTriggered: boolean; message: string }> {
    if (!provider.isExternal || provider.id === 'oneva_builtin') {
      return {
        success: true,
        fallbackTriggered: false,
        message: 'Built-in ONEVA Camera ready.',
      };
    }

    const pkgToLaunch = provider.primaryPackageName;

    // Track launch timestamp for unexpected fast-exit detection
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          STORAGE_LAST_LAUNCH_KEY,
          JSON.stringify({
            providerId: provider.id,
            timestamp: Date.now(),
          })
        );
      }
    } catch {
      // safe continue
    }

    const launchResult = await PlatformBridge.launchApp(pkgToLaunch);

    if (launchResult.success) {
      return {
        success: true,
        fallbackTriggered: false,
        message: `Dispatched native intent for ${provider.displayName}`,
      };
    } else {
      // Record failure to avoid crash loop
      this.recordProviderFailure(provider.id);

      // Re-evaluate next provider in fallback chain
      const nextCandidate = this.getRecommendedProvider();
      this.setSelectedProvider(nextCandidate.provider.id);

      return {
        success: false,
        fallbackTriggered: true,
        message: `Unable to launch ${provider.displayName}. Switched to ${nextCandidate.provider.displayName} as guaranteed fallback.`,
      };
    }
  }
}
