/**
 * ONEVA Central Permission Manager & Hardware Access Pipeline
 * 
 * Provides unified, single-step batch permission acquisition for:
 * 1. Microphone (RECORD_AUDIO) -> JARVIS voice commands and hotword listening
 * 2. Camera (CAMERA) -> Hand Gesture Control & Computer Vision
 * 3. Notifications (POST_NOTIFICATIONS) -> Real-time JARVIS Task alerts & Edge Glow notification alerts
 * 4. Accessibility Service -> Deep In-App Automation (WhatsApp, YouTube, clicking, typing)
 * 5. Display Over Other Apps (Overlay) -> System HUD & Edge Glow over other apps
 */

import { AndroidAccessibilityBridge } from './actions/androidAccessibilityBridge';
import { PlatformBridge } from '../launcher/services/platformBridge';

export type PermissionId = 'microphone' | 'camera' | 'notifications' | 'accessibility' | 'overlay';

export type PermissionStatusState = 'granted' | 'denied' | 'prompt' | 'not_supported';

export interface OnevaPermissionItem {
  id: PermissionId;
  title: string;
  titleHi: string;
  category: 'runtime' | 'special';
  description: string;
  descriptionHi: string;
  status: PermissionStatusState;
  isRequired: boolean;
  canGrantInApp: boolean;
}

export interface PermissionSnapshot {
  allRuntimeGranted: boolean;
  allEssentialGranted: boolean;
  items: Record<PermissionId, OnevaPermissionItem>;
  isCompleted: boolean;
  timestamp: number;
}

const STORAGE_KEY_PERMISSIONS_COMPLETED = 'oneva_permissions_completed';
const STORAGE_KEY_PERMISSIONS_CACHE = 'oneva_permissions_cache';

type PermissionListener = (snapshot: PermissionSnapshot) => void;

export class OnevaPermissionManager {
  private static listeners: Set<PermissionListener> = new Set();
  private static isRequestingAll = false;

  private static permissionDefs: Record<PermissionId, Omit<OnevaPermissionItem, 'status'>> = {
    microphone: {
      id: 'microphone',
      title: 'JARVIS Voice Core',
      titleHi: 'JARVIS वॉइस कोर (माइक्रोफ़ोन)',
      category: 'runtime',
      description: 'Enables hands-free voice commands, wake-name recognition ("Jarvis"), and conversational answers.',
      descriptionHi: 'JARVIS से बात करने, वेक-वर्ड बोलने और वॉइस कमांड्स देने के लिए आवश्यक है।',
      isRequired: true,
      canGrantInApp: true,
    },
    camera: {
      id: 'camera',
      title: 'Hand Gesture & Vision',
      titleHi: 'हैंड जेस्चर व विज़न (कैमरा)',
      category: 'runtime',
      description: 'Enables touchless air-gestures (pinch, swipe, palm stop) and ONEVA Vision camera enhancements.',
      descriptionHi: 'बिना स्क्रीन छुए हवा में हाथ के इशारों (Swipe, Pinch) से फ़ोन कंट्रोल करने के लिए।',
      isRequired: true,
      canGrantInApp: true,
    },
    notifications: {
      id: 'notifications',
      title: 'System & Task Alerts',
      titleHi: 'टास्क अलर्ट्स व नोटिफ़िकेशन',
      category: 'runtime',
      description: 'Delivers background task completion updates, JARVIS status banners, and edge pulse glows.',
      descriptionHi: 'JARVIS के बैकग्राउंड टास्क पूरे होने और महत्वपूर्ण फ़ोन अलर्ट्स दिखाने के लिए।',
      isRequired: false,
      canGrantInApp: true,
    },
    accessibility: {
      id: 'accessibility',
      title: 'Deep In-App Automation',
      titleHi: 'डीप इन-ऐप ऑटोमेशन (Accessibility)',
      category: 'special',
      description: 'Allows JARVIS to navigate WhatsApp, search YouTube, click buttons, and scroll inside genuine apps.',
      descriptionHi: 'WhatsApp में मैसेज भेजने, YouTube चलाने और अन्य ऐप्स के अंदर ऑटोमेशन चलाने के लिए।',
      isRequired: false,
      canGrantInApp: false, // Android OS requires user to toggle the switch in Accessibility settings
    },
    overlay: {
      id: 'overlay',
      title: 'Display Over Apps',
      titleHi: 'स्क्रीन ओवरले (Display Over Apps)',
      category: 'special',
      description: 'Renders ambient Edge Glow lighting and JARVIS floating HUD while using other applications.',
      descriptionHi: 'अन्य ऐप्स चलाते समय किनारे पर Edge Glow और JARVIS का फ़्लोटिंग HUD दिखाने के लिए।',
      isRequired: false,
      canGrantInApp: false,
    },
  };

  /**
   * Check if the user has completed the initial startup permission wizard
   */
  static hasCompletedOnboarding(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY_PERMISSIONS_COMPLETED) === 'true';
  }

  /**
   * Mark the startup permission wizard as completed
   */
  static markOnboardingCompleted(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PERMISSIONS_COMPLETED, 'true');
      this.notifyListeners();
    }
  }

  /**
   * Reset onboarding state so the wizard can be reopened
   */
  static resetOnboarding(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_PERMISSIONS_COMPLETED);
      this.notifyListeners();
    }
  }

  /**
   * Query all permissions live across Native Android Bridge and Web APIs
   */
  static async checkAllPermissions(): Promise<PermissionSnapshot> {
    const isNative = PlatformBridge.isNativeAndroid();
    const bridge = typeof window !== 'undefined' ? window.OnevaNativeBridge : undefined;

    const items: Record<PermissionId, OnevaPermissionItem> = {
      microphone: { ...this.permissionDefs.microphone, status: 'prompt' },
      camera: { ...this.permissionDefs.camera, status: 'prompt' },
      notifications: { ...this.permissionDefs.notifications, status: 'prompt' },
      accessibility: { ...this.permissionDefs.accessibility, status: 'prompt' },
      overlay: { ...this.permissionDefs.overlay, status: 'prompt' },
    };

    // 1. Check Native Android Bridge if present
    if (isNative && bridge) {
      if (typeof bridge.getAllPermissionsStatusJson === 'function') {
        try {
          const jsonStr = bridge.getAllPermissionsStatusJson();
          const parsed = JSON.parse(jsonStr);
          items.microphone.status = parsed.microphone ? 'granted' : 'prompt';
          items.camera.status = parsed.camera ? 'granted' : 'prompt';
          items.notifications.status = parsed.notifications ? 'granted' : 'prompt';
          items.overlay.status = parsed.overlay ? 'granted' : 'prompt';
          items.accessibility.status = parsed.accessibility ? 'granted' : 'prompt';
        } catch {
          // Fall back to individual checks
        }
      } else {
        if (bridge.hasMicrophonePermission) {
          items.microphone.status = bridge.hasMicrophonePermission() ? 'granted' : 'prompt';
        }
        if (bridge.hasCameraPermission) {
          items.camera.status = bridge.hasCameraPermission() ? 'granted' : 'prompt';
        }
        if (bridge.hasNotificationPermission) {
          items.notifications.status = bridge.hasNotificationPermission() ? 'granted' : 'prompt';
        }
        if (bridge.hasOverlayPermission) {
          items.overlay.status = bridge.hasOverlayPermission() ? 'granted' : 'prompt';
        }
        if (bridge.hasAccessibilityPermission) {
          items.accessibility.status = bridge.hasAccessibilityPermission() ? 'granted' : 'prompt';
        }
      }
    } else {
      // 2. Web Sandbox / Browser check
      // Notification
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          items.notifications.status = 'granted';
        } else if (Notification.permission === 'denied') {
          items.notifications.status = 'denied';
        } else {
          items.notifications.status = 'prompt';
        }
      } else {
        items.notifications.status = 'granted'; // Default fallback in sandbox
      }

      // Query navigator.permissions for mic and camera if supported
      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        try {
          const micStatus = await navigator.permissions.query({ name: 'microphone' as any });
          items.microphone.status = micStatus.state as PermissionStatusState;
        } catch {
          // Keep cached or prompt
        }

        try {
          const camStatus = await navigator.permissions.query({ name: 'camera' as any });
          items.camera.status = camStatus.state as PermissionStatusState;
        } catch {
          // Keep cached or prompt
        }
      }

      // Check Accessibility Bridge status
      const accessStatus = AndroidAccessibilityBridge.getStatus();
      items.accessibility.status = accessStatus.serviceEnabled ? 'granted' : 'prompt';

      // Overlay status in simulator/preview
      const cachedOverlay = localStorage.getItem('oneva_overlay_granted');
      items.overlay.status = cachedOverlay === 'true' ? 'granted' : 'prompt';
    }

    // Read cache overrides if permissions were previously verified in session
    const cached = this.getCachedPermissions();
    if (cached) {
      if (cached.microphone && items.microphone.status === 'prompt') items.microphone.status = 'granted';
      if (cached.camera && items.camera.status === 'prompt') items.camera.status = 'granted';
      if (cached.notifications && items.notifications.status === 'prompt') items.notifications.status = 'granted';
      if (cached.overlay && items.overlay.status === 'prompt') items.overlay.status = 'granted';
    }

    const allRuntimeGranted =
      items.microphone.status === 'granted' &&
      items.camera.status === 'granted';

    const allEssentialGranted =
      allRuntimeGranted && items.notifications.status === 'granted';

    const isCompleted = this.hasCompletedOnboarding();

    const snapshot: PermissionSnapshot = {
      allRuntimeGranted,
      allEssentialGranted,
      items,
      isCompleted,
      timestamp: Date.now(),
    };

    return snapshot;
  }

  /**
   * Master "Grant All Permissions" (सब चालू करें) Pipeline
   * 
   * Directly requests all in-app runtime permissions simultaneously:
   * - Microphone
   * - Camera
   * - Notifications
   * 
   * If special permissions (Accessibility/Overlay) are still needed, provides seamless 1-click deep link.
   */
  static async requestAllInAppPermissions(): Promise<{
    success: boolean;
    runtimeGranted: boolean;
    specialNeeded: PermissionId[];
    message: string;
  }> {
    if (this.isRequestingAll) {
      return {
        success: false,
        runtimeGranted: false,
        specialNeeded: [],
        message: 'Permission request currently in progress...',
      };
    }

    this.isRequestingAll = true;

    try {
      const isNative = PlatformBridge.isNativeAndroid();
      const bridge = typeof window !== 'undefined' ? window.OnevaNativeBridge : undefined;

      // 1. If Native Android is active, trigger batch request in MainActivity
      if (isNative && bridge?.requestAllRuntimePermissions) {
        bridge.requestAllRuntimePermissions();
      }

      // 2. Request in-app browser/WebView media permissions for Mic and Camera
      const grantedMap: Record<string, boolean> = {};

      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          // Request both audio and video in a single unified media stream request
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });

          // Once granted, immediately close tracks so camera/mic lights don't stay on
          stream.getTracks().forEach((t) => t.stop());
          grantedMap['microphone'] = true;
          grantedMap['camera'] = true;
        } catch (mediaErr) {
          console.warn('[OnevaPermissionManager] Unified media request partial/denied:', mediaErr);

          // Try individual audio first
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getTracks().forEach((t) => t.stop());
            grantedMap['microphone'] = true;
          } catch {
            grantedMap['microphone'] = false;
          }

          // Try individual video
          try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoStream.getTracks().forEach((t) => t.stop());
            grantedMap['camera'] = true;
          } catch {
            grantedMap['camera'] = false;
          }
        }
      }

      // 3. Request Notification permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const res = await Notification.requestPermission();
          grantedMap['notifications'] = res === 'granted';
        } catch {
          grantedMap['notifications'] = true;
        }
      } else {
        grantedMap['notifications'] = true;
      }

      // Save verified grants in local cache
      this.updateCachedPermissions(grantedMap);

      // 4. Inspect special system permissions that require user settings toggle
      const latestSnapshot = await this.checkAllPermissions();
      const specialNeeded: PermissionId[] = [];

      if (latestSnapshot.items.accessibility.status !== 'granted') {
        specialNeeded.push('accessibility');
      }
      if (latestSnapshot.items.overlay.status !== 'granted') {
        specialNeeded.push('overlay');
      }

      const runtimeGranted =
        latestSnapshot.items.microphone.status === 'granted' &&
        latestSnapshot.items.camera.status === 'granted';

      this.notifyListeners();

      if (runtimeGranted) {
        if (specialNeeded.length === 0) {
          this.markOnboardingCompleted();
          return {
            success: true,
            runtimeGranted: true,
            specialNeeded: [],
            message: 'All system permissions successfully granted in-app!',
          };
        } else {
          return {
            success: true,
            runtimeGranted: true,
            specialNeeded,
            message:
              'In-app permissions (Microphone, Camera, Notifications) granted! Deep Automation requires 1-tap Accessibility setting.',
          };
        }
      } else {
        return {
          success: false,
          runtimeGranted: false,
          specialNeeded,
          message: 'Some runtime permissions were not granted. Please allow when prompted.',
        };
      }
    } finally {
      this.isRequestingAll = false;
    }
  }

  /**
   * Request an individual permission or trigger its settings page
   */
  static async requestPermission(id: PermissionId): Promise<boolean> {
    const isNative = PlatformBridge.isNativeAndroid();
    const bridge = typeof window !== 'undefined' ? window.OnevaNativeBridge : undefined;

    switch (id) {
      case 'microphone':
        if (isNative && bridge?.requestMicrophonePermission) {
          bridge.requestMicrophonePermission();
          return true;
        }
        if (navigator.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((t) => t.stop());
            this.updateCachedPermissions({ microphone: true });
            this.notifyListeners();
            return true;
          } catch {
            return false;
          }
        }
        return false;

      case 'camera':
        if (navigator.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((t) => t.stop());
            this.updateCachedPermissions({ camera: true });
            this.notifyListeners();
            return true;
          } catch {
            return false;
          }
        }
        return false;

      case 'notifications':
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const res = await Notification.requestPermission();
          const granted = res === 'granted';
          this.updateCachedPermissions({ notifications: granted });
          this.notifyListeners();
          return granted;
        }
        return true;

      case 'accessibility':
        AndroidAccessibilityBridge.openAccessibilitySettings();
        return true;

      case 'overlay':
        if (isNative && bridge?.openOverlaySettings) {
          bridge.openOverlaySettings();
        } else {
          localStorage.setItem('oneva_overlay_granted', 'true');
          this.updateCachedPermissions({ overlay: true });
          this.notifyListeners();
        }
        return true;

      default:
        return false;
    }
  }

  /**
   * Open full Android App Settings (if user selected 'Never Ask Again')
   */
  static openAppSettings(): void {
    const isNative = PlatformBridge.isNativeAndroid();
    const bridge = typeof window !== 'undefined' ? window.OnevaNativeBridge : undefined;
    if (isNative && bridge?.openAppSettings) {
      bridge.openAppSettings();
    } else {
      AndroidAccessibilityBridge.openAccessibilitySettings();
    }
  }

  /**
   * Open Android Accessibility Settings specifically
   */
  static openAccessibilitySettings(): void {
    AndroidAccessibilityBridge.openAccessibilitySettings();
  }

  /**
   * Open Android Overlay Settings
   */
  static openOverlaySettings(): void {
    const isNative = PlatformBridge.isNativeAndroid();
    const bridge = typeof window !== 'undefined' ? window.OnevaNativeBridge : undefined;
    if (isNative && bridge?.openOverlaySettings) {
      bridge.openOverlaySettings();
    } else {
      localStorage.setItem('oneva_overlay_granted', 'true');
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to live permission status changes
   */
  static subscribe(listener: PermissionListener): () => void {
    this.listeners.add(listener);
    // Initial emission
    this.checkAllPermissions().then(listener);

    // Also listen to window native events from Android MainActivity
    const handleNativeUpdate = () => {
      this.checkAllPermissions().then(listener);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('oneva-permissions-updated', handleNativeUpdate);
    }

    return () => {
      this.listeners.delete(listener);
      if (typeof window !== 'undefined') {
        window.removeEventListener('oneva-permissions-updated', handleNativeUpdate);
      }
    };
  }

  private static notifyListeners(): void {
    this.checkAllPermissions().then((snapshot) => {
      this.listeners.forEach((fn) => fn(snapshot));
    });
  }

  private static getCachedPermissions(): Record<string, boolean> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PERMISSIONS_CACHE);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private static updateCachedPermissions(updates: Record<string, boolean>): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getCachedPermissions();
      const next = { ...current, ...updates };
      localStorage.setItem(STORAGE_KEY_PERMISSIONS_CACHE, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to update permission cache:', e);
    }
  }
}
