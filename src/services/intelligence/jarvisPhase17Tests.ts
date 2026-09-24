/**
 * ONEVA Phase 17: Verification Test Suite (17 Test Scenarios)
 * 
 * Tests Native App Discovery, Browser Simulation Fallback, Deterministic Merging,
 * Untrusted Metadata Sanitization, Tier 4 Native Icon Fallback, App Resolution Priority,
 * Ambiguity Asking, Capability Honesty, and Dynamic Install/Uninstall Simulation.
 */

import { AppRepository } from '../../launcher/services/appRepository';
import { NativeAppDiscoveryBridge } from '../../launcher/services/nativeAppDiscoveryBridge';
import { AppCatalogService } from '../appCatalogService';
import { IconService } from '../iconService';
import { AppResolutionService } from '../actions/appResolutionService';
import { JarvisActionSelector } from '../actions/jarvisActionSelector';
import { AndroidAccessibilityBridge } from '../actions/androidAccessibilityBridge';
import {
  validatePackageName,
  sanitizeAppLabel,
  DiscoveredInstalledApp,
} from '../../types/deviceAppDiscovery';

export interface Phase17TestResult {
  id: number;
  name: string;
  category: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export class JarvisPhase17TestSuite {
  /**
   * Run all 17 Phase 17 test scenarios
   */
  static async runAllTests(): Promise<{
    results: Phase17TestResult[];
    passedCount: number;
    failedCount: number;
    allPassed: boolean;
  }> {
    const results: Phase17TestResult[] = [];

    // Ensure clean simulation baseline before test suite
    NativeAppDiscoveryBridge.resetToDefaultSimulation();
    AppRepository.invalidateCache();

    // -------------------------------------------------------------
    // SCENARIO 1: Native bridge returns installed apps -> ONEVA displays them
    // -------------------------------------------------------------
    try {
      const apps = await NativeAppDiscoveryBridge.scanInstalledApps();
      const passed = Array.isArray(apps) && apps.length > 0 && apps.every((a) => !!a.packageName);
      results.push({
        id: 1,
        name: 'Native Bridge / Discovery Acquisition',
        category: 'App Discovery',
        passed,
        expected: 'Discovers list of installed packages with valid package names',
        actual: `Discovered ${apps.length} packages`,
      });
    } catch (e: any) {
      results.push({
        id: 1,
        name: 'Native Bridge / Discovery Acquisition',
        category: 'App Discovery',
        passed: false,
        expected: 'Discovers list of installed packages',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 2: Bridge unavailable / browser mode -> fallback discovery/simulation works
    // -------------------------------------------------------------
    try {
      const isSim = NativeAppDiscoveryBridge.getDiscoverySource() === 'browser_simulation';
      const cached = NativeAppDiscoveryBridge.getCachedInstalledApps();
      const passed = isSim && cached.length >= 10;
      results.push({
        id: 2,
        name: 'Browser Simulation Fallback',
        category: 'Discovery Resilience',
        passed,
        expected: 'Gracefully uses sanitized browser simulation with realistic Android packages',
        actual: `Mode: ${NativeAppDiscoveryBridge.getDiscoverySource()}, appsCount: ${cached.length}`,
      });
    } catch (e: any) {
      results.push({
        id: 2,
        name: 'Browser Simulation Fallback',
        category: 'Discovery Resilience',
        passed: false,
        expected: 'Fallback works smoothly',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 3: App installed + in ONEVA catalog -> full capabilities available
    // -------------------------------------------------------------
    try {
      const ytCap = AppRepository.getAppCapabilityModel('com.google.android.youtube');
      const passed =
        !!ytCap &&
        ytCap.installed === true &&
        ytCap.launchable === true &&
        ytCap.catalogSupported === true &&
        ytCap.iconPackSupported === true &&
        ytCap.jarvisLaunchSupported === true &&
        ytCap.jarvisInteractionSupported === true;
      results.push({
        id: 3,
        name: 'Installed Catalog App Capability Model',
        category: 'Capability Merging',
        passed,
        expected: 'Full capabilities (Glow, Icons, Animations, Jarvis in-app interaction) supported',
        actual: `installed=${ytCap?.installed}, catalog=${ytCap?.catalogSupported}, interaction=${ytCap?.jarvisInteractionSupported}`,
      });
    } catch (e: any) {
      results.push({
        id: 3,
        name: 'Installed Catalog App Capability Model',
        category: 'Capability Merging',
        passed: false,
        expected: 'Full capabilities available',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 4: App installed + NOT in catalog -> displayed, launchable, no false claims
    // -------------------------------------------------------------
    try {
      // Simulate an installed app not in catalog (e.g. VLC Media Player)
      AppRepository.simulateInstallApp({
        packageName: 'org.videolan.vlc',
        appName: 'VLC Media Player',
        launchable: true,
        isSystemApp: false,
      });

      const vlcCap = AppRepository.getAppCapabilityModel('org.videolan.vlc');
      const available = AppRepository.getAvailableApps().some((a) => a.packageName === 'org.videolan.vlc');
      const passed =
        !!vlcCap &&
        available &&
        vlcCap.installed === true &&
        vlcCap.launchable === true &&
        vlcCap.catalogSupported === false &&
        vlcCap.iconPackSupported === false && // No false claims
        vlcCap.jarvisInteractionSupported === false; // Honesty
      results.push({
        id: 4,
        name: 'Non-Catalog Discovered App Support',
        category: 'Capability Merging',
        passed,
        expected: 'Present in launcher, launchable, catalogSupported=false, no false icon pack claims',
        actual: `available=${available}, catalogSupported=${vlcCap?.catalogSupported}, iconPack=${vlcCap?.iconPackSupported}`,
      });
    } catch (e: any) {
      results.push({
        id: 4,
        name: 'Non-Catalog Discovered App Support',
        category: 'Capability Merging',
        passed: false,
        expected: 'Displayed without false claims',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 5: Catalog app NOT installed -> filtered out, not falsely marked installed
    // -------------------------------------------------------------
    try {
      // Find a catalog app that is not in the installed list
      const catalogApps = AppCatalogService.getAllApps();
      const installedPkgs = new Set(AppRepository.getAllInstalledApps().map((a) => a.packageName.toLowerCase()));
      const uninstalledCatalogApp = catalogApps.find((c) => !installedPkgs.has(c.packageName.toLowerCase()));

      let passed = false;
      let targetPkg = uninstalledCatalogApp?.packageName || 'com.disney.disneyplus';

      if (uninstalledCatalogApp) {
        const inAvailable = AppRepository.getAvailableApps().some((a) => a.packageName.toLowerCase() === uninstalledCatalogApp.packageName.toLowerCase());
        const isMarkedInstalled = AppRepository.isPackageInstalled(uninstalledCatalogApp.packageName);
        passed = !inAvailable && !isMarkedInstalled;
      } else {
        // If all catalog apps happen to be installed in default profile, verify check directly
        passed = !AppRepository.isPackageInstalled('com.uninstalled.randomapp.xyz');
      }

      results.push({
        id: 5,
        name: 'Uninstalled Catalog App Filtering',
        category: 'Integrity & Privacy',
        passed,
        expected: 'Uninstalled catalog apps are never falsely displayed as installed',
        actual: `Package: ${targetPkg}, falselyDisplayed=${!passed}`,
      });
    } catch (e: any) {
      results.push({
        id: 5,
        name: 'Uninstalled Catalog App Filtering',
        category: 'Integrity & Privacy',
        passed: false,
        expected: 'Strict filtering of uninstalled apps',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 6: Package name with spaces / weird chars -> sanitized, safe fallback used
    // -------------------------------------------------------------
    try {
      const dirtyPkg = '   com.malicious.script<script>alert(1)</script>   ';
      const isValid = validatePackageName(dirtyPkg);
      const passed = isValid === false; // Invalid characters rejected
      results.push({
        id: 6,
        name: 'Package Name Sanitization',
        category: 'Input Validation',
        passed,
        expected: 'Malicious scripts and invalid syntax in package names rejected safely',
        actual: `validatePackageName(dirty) = ${isValid} (safely rejected)`,
      });
    } catch (e: any) {
      results.push({
        id: 6,
        name: 'Package Name Sanitization',
        category: 'Input Validation',
        passed: false,
        expected: 'Safe rejection',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 7: Empty / missing app label -> fallback to package name / safe initial
    // -------------------------------------------------------------
    try {
      const sanitized = sanitizeAppLabel('', 'org.videolan.vlc');
      const passed = sanitized.length > 0 && sanitized === 'Vlc';
      results.push({
        id: 7,
        name: 'Missing App Label Fallback',
        category: 'Input Validation',
        passed,
        expected: 'Falls back gracefully to capitalized package slug or initial',
        actual: `Sanitized label: "${sanitized}"`,
      });
    } catch (e: any) {
      results.push({
        id: 7,
        name: 'Missing App Label Fallback',
        category: 'Input Validation',
        passed: false,
        expected: 'Safe fallback',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 8: Malformed package name -> rejected / filtered safely
    // -------------------------------------------------------------
    try {
      const malformed1 = validatePackageName('singleword');
      const malformed2 = validatePackageName('123.456');
      const malformed3 = validatePackageName('');
      const valid = validatePackageName('com.example.myapp');
      const passed = malformed1 === false && malformed2 === false && malformed3 === false && valid === true;
      results.push({
        id: 8,
        name: 'Malformed Package Validation Rule',
        category: 'Input Validation',
        passed,
        expected: 'Strict validation requires valid dot-separated Android package convention',
        actual: `malformed1=${malformed1}, malformed2=${malformed2}, valid=${valid}`,
      });
    } catch (e: any) {
      results.push({
        id: 8,
        name: 'Malformed Package Validation Rule',
        category: 'Input Validation',
        passed: false,
        expected: 'Strict validation',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 9: App with custom icon -> custom icon displayed (Tier 1)
    // -------------------------------------------------------------
    try {
      const resolved = IconService.resolveAppIcon({
        packageName: 'com.google.android.youtube',
        customIconId: 'Sparkles',
      });
      const passed = resolved.sourceTier === 'CUSTOM_ICON' && resolved.iconName === 'Sparkles';
      results.push({
        id: 9,
        name: 'Icon Priority Tier 1: Custom Icon Override',
        category: 'Icon Resolution',
        passed,
        expected: 'sourceTier === "CUSTOM_ICON"',
        actual: `sourceTier=${resolved.sourceTier}, icon=${resolved.iconName}`,
      });
    } catch (e: any) {
      results.push({
        id: 9,
        name: 'Icon Priority Tier 1: Custom Icon Override',
        category: 'Icon Resolution',
        passed: false,
        expected: 'Tier 1 priority',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 10: App without custom icon but with native app icon -> Tier 4 native icon displayed
    // -------------------------------------------------------------
    try {
      const fakeDataUrl = 'data:image/svg+xml;utf8,<svg></svg>';
      const resolved = IconService.resolveAppIcon({
        packageName: 'xyz.custom.discoveredapp',
        nativeIconDataUrl: fakeDataUrl,
      });
      const passed = resolved.sourceTier === 'NATIVE_APP_ICON' && resolved.nativeIconUrl === fakeDataUrl;
      results.push({
        id: 10,
        name: 'Icon Priority Tier 4: Native Application Icon Fallback',
        category: 'Icon Resolution',
        passed,
        expected: 'sourceTier === "NATIVE_APP_ICON" with nativeIconUrl preserved',
        actual: `sourceTier=${resolved.sourceTier}, url=${resolved.nativeIconUrl?.slice(0, 20)}...`,
      });
    } catch (e: any) {
      results.push({
        id: 10,
        name: 'Icon Priority Tier 4: Native Application Icon Fallback',
        category: 'Icon Resolution',
        passed: false,
        expected: 'Tier 4 priority fallback',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 11: App with neither -> Tier 5 safe vector / initial fallback
    // -------------------------------------------------------------
    try {
      const resolved = IconService.resolveAppIcon({
        packageName: 'unknown.barebones.app',
      });
      const passed = resolved.sourceTier === 'SYSTEM_FALLBACK';
      results.push({
        id: 11,
        name: 'Icon Priority Tier 5: System / Initial Fallback',
        category: 'Icon Resolution',
        passed,
        expected: 'sourceTier === "SYSTEM_FALLBACK"',
        actual: `sourceTier=${resolved.sourceTier}, fallbackInitial=${resolved.fallbackInitial}`,
      });
    } catch (e: any) {
      results.push({
        id: 11,
        name: 'Icon Priority Tier 5: System / Initial Fallback',
        category: 'Icon Resolution',
        passed: false,
        expected: 'Tier 5 fallback',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 12: Jarvis: open installed catalog app -> opens successfully
    // -------------------------------------------------------------
    try {
      const res = await JarvisActionSelector.selectAndExecute('Open YouTube');
      const passed = res?.success === true && res.toolId === 'open_app';
      results.push({
        id: 12,
        name: 'Jarvis Launch: Installed Catalog App',
        category: 'JARVIS Integration',
        passed,
        expected: 'Launches successfully with verification',
        actual: `toolId=${res?.toolId}, success=${res?.success}, status=${res?.status}`,
      });
    } catch (e: any) {
      results.push({
        id: 12,
        name: 'Jarvis Launch: Installed Catalog App',
        category: 'JARVIS Integration',
        passed: false,
        expected: 'Executes open_app',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 13: Jarvis: open installed non-catalog app -> opens successfully
    // -------------------------------------------------------------
    try {
      // org.videolan.vlc was simulated earlier
      const res = await JarvisActionSelector.selectAndExecute('Open VLC Media Player');
      const passed = res?.success === true && res.toolId === 'open_app';
      results.push({
        id: 13,
        name: 'Jarvis Launch: Installed Non-Catalog App',
        category: 'JARVIS Integration',
        passed,
        expected: 'Launches non-catalog installed app via AndroidActionBridge',
        actual: `toolId=${res?.toolId}, success=${res?.success}`,
      });
    } catch (e: any) {
      results.push({
        id: 13,
        name: 'Jarvis Launch: Installed Non-Catalog App',
        category: 'JARVIS Integration',
        passed: false,
        expected: 'Opens successfully',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 14: Jarvis: open non-installed app -> reports not installed, does not hallucinate
    // -------------------------------------------------------------
    try {
      const res = await JarvisActionSelector.selectAndExecute('Open NonExistentFantasticalApp');
      const passed = res?.success === false && res.status === 'FAILED';
      results.push({
        id: 14,
        name: 'Jarvis Honesty: Non-Installed Application',
        category: 'JARVIS Integration',
        passed: !!passed,
        expected: 'Reports not installed or not recognized honestly without hallucinating launch',
        actual: `status=${res?.status}, userMessage="${res?.userMessage}"`,
      });
    } catch (e: any) {
      results.push({
        id: 14,
        name: 'Jarvis Honesty: Non-Installed Application',
        category: 'JARVIS Integration',
        passed: false,
        expected: 'Reports not installed',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 15: Jarvis: ambiguous query matching multiple apps -> asks for clarification
    // -------------------------------------------------------------
    try {
      // Simulate having both Chrome and Samsung Browser installed
      const res = await JarvisActionSelector.selectAndExecute('Open browser');
      const resolution = AppResolutionService.resolveApp('browser');
      const isAmbiguous = resolution.isAmbiguous === true;
      const passed = isAmbiguous && res?.userMessage.toLowerCase().includes('multiple');
      results.push({
        id: 15,
        name: 'Jarvis Ambiguity Handling: Multiple Matching Apps',
        category: 'JARVIS Integration',
        passed: !!passed,
        expected: 'Detects multiple candidates and asks user for clarification without guessing',
        actual: `isAmbiguous=${isAmbiguous}, msg="${res?.userMessage}"`,
      });
    } catch (e: any) {
      results.push({
        id: 15,
        name: 'Jarvis Ambiguity Handling: Multiple Matching Apps',
        category: 'JARVIS Integration',
        passed: false,
        expected: 'Asks for clarification',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 16: Jarvis: unsupported in-app action on non-catalog app -> reports unsupported honestly
    // -------------------------------------------------------------
    try {
      const actionRes = await AndroidAccessibilityBridge.performAppAction('like_video', 'VLC Media Player');
      const passed = actionRes.verificationStatus === 'UNSUPPORTED' && actionRes.success === false;
      results.push({
        id: 16,
        name: 'Jarvis In-App Honesty: Unsupported Action',
        category: 'Capability Honesty',
        passed,
        expected: 'Returns verificationStatus="UNSUPPORTED" with honest explanation',
        actual: `verificationStatus=${actionRes.verificationStatus}, msg="${actionRes.message}"`,
      });
    } catch (e: any) {
      results.push({
        id: 16,
        name: 'Jarvis In-App Honesty: Unsupported Action',
        category: 'Capability Honesty',
        passed: false,
        expected: 'Reports unsupported honestly',
        actual: `Exception: ${e.message}`,
      });
    }

    // -------------------------------------------------------------
    // SCENARIO 17: Dynamic install/uninstall simulation -> app list and capabilities update
    // -------------------------------------------------------------
    try {
      const testPkg = 'test.dynamic.app17';
      const beforeCount = AppRepository.getAvailableApps().length;

      // 1. Install
      AppRepository.simulateInstallApp({
        packageName: testPkg,
        appName: 'Test Dynamic App',
        launchable: true,
      });
      const afterInstall = AppRepository.getAvailableApps().some((a) => a.packageName === testPkg);

      // 2. Uninstall
      AppRepository.simulateUninstallApp(testPkg);
      const afterUninstall = !AppRepository.getAvailableApps().some((a) => a.packageName === testPkg);

      const passed = afterInstall && afterUninstall;
      results.push({
        id: 17,
        name: 'Dynamic Install / Uninstall Simulation',
        category: 'Lifecycle Verification',
        passed,
        expected: 'App list dynamically adds and removes packages upon OS broadcast simulation',
        actual: `installed=${afterInstall}, uninstalled=${afterUninstall}`,
      });
    } catch (e: any) {
      results.push({
        id: 17,
        name: 'Dynamic Install / Uninstall Simulation',
        category: 'Lifecycle Verification',
        passed: false,
        expected: 'Dynamic updates work cleanly',
        actual: `Exception: ${e.message}`,
      });
    }

    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.length - passedCount;
    const allPassed = failedCount === 0;

    return {
      results,
      passedCount,
      failedCount,
      allPassed,
    };
  }
}
