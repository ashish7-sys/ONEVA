/**
 * ONEVA Full Pack Requirement Manager
 * Centralized requirement queue, pre-flight validator, and fault-isolated setup controller.
 */

import {
  ComponentRequirement,
  FullPackWizardState,
  GuidedStepState,
  ComponentSetupStatus,
} from '../../types/fullPackRequirements';
import { OnevaPackComponentKey } from '../../types/fullPack';
import { PlatformBridge } from '../../launcher/services/platformBridge';
import { CameraProviderRegistry } from '../camera/cameraProviderRegistry';
import { CameraProviderId } from '../../types/cameraProviders';

const WIZARD_STORAGE_KEY = 'oneva_full_pack_wizard_state_v1';

export class FullPackRequirementManager {
  private static wizardState: FullPackWizardState | null = null;
  private static listeners: Set<() => void> = new Set();

  static readonly COMPONENTS_MANIFEST: {
    index: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    key: OnevaPackComponentKey;
    name: string;
    description: string;
  }[] = [
    {
      index: 1,
      key: 'wallpaper',
      name: 'Wallpaper',
      description: 'Admin static or live OLED wallpaper (preserves user background choice).',
    },
    {
      index: 2,
      key: 'icon_pack',
      name: 'Icon Pack',
      description: 'Vector icon engine mapped across all 81 catalog apps including Phone, Messages, Contacts.',
    },
    {
      index: 3,
      key: 'widgets_quick_panel',
      name: 'Widgets + Quick Panel',
      description: 'ONEVA system widgets and customized Quick Settings tiles (Wi-Fi, Torch, Sound, Hotspot).',
    },
    {
      index: 4,
      key: 'keyboard_theme',
      name: 'Keyboard Theme',
      description: 'Tactile elevation keycap styling and localized IME predictive buffer.',
    },
    {
      index: 5,
      key: 'jarvis_full_setup',
      name: 'Jarvis — Full Setup',
      description: 'System-wide AI layer with 5 states (Sleeping, Awake, Short, Research, Hand Control).',
    },
    {
      index: 6,
      key: 'jarvis_reactive_wallpaper',
      name: 'Jarvis Reactive Wallpaper',
      description: 'Dynamic visual layer above base wallpaper; pulses with speech, hides in sleep.',
    },
    {
      index: 7,
      key: 'oneva_ai_camera',
      name: 'ONEVA Camera',
      description: 'Multi-camera provider system with flagship computational HDR & built-in fallback.',
    },
  ];

  /**
   * Initializes or restores the Full Pack wizard state from local storage.
   */
  static getWizardState(): FullPackWizardState {
    if (this.wizardState) return this.wizardState;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(WIZARD_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.steps) && parsed.steps.length === 7) {
            this.wizardState = parsed;
            return this.wizardState!;
          }
        }
      } catch (e) {
        console.warn('[FullPackRequirementManager] Storage restore warning:', e);
      }
    }

    // Default fresh wizard state
    const initialSteps: GuidedStepState[] = this.COMPONENTS_MANIFEST.map((comp) => ({
      index: comp.index,
      key: comp.key,
      name: comp.name,
      status: 'pending',
    }));

    this.wizardState = {
      currentStepIndex: 1,
      steps: initialSteps,
      isStarted: false,
      isCompleted: false,
      appliedCount: 0,
      skippedCount: 0,
    };

    return this.wizardState;
  }

  /**
   * Resets the setup wizard to factory fresh state.
   */
  static resetWizard(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(WIZARD_STORAGE_KEY);
    }
    this.wizardState = null;
    this.notify();
  }

  /**
   * Updates and persists the wizard state.
   */
  static updateWizardState(partial: Partial<FullPackWizardState>): FullPackWizardState {
    const current = this.getWizardState();
    const updated: FullPackWizardState = {
      ...current,
      ...partial,
    };

    // Calculate applied and skipped counts accurately
    updated.appliedCount = updated.steps.filter((s) => s.status === 'applied').length;
    updated.skippedCount = updated.steps.filter((s) => s.status === 'skipped').length;

    this.wizardState = updated;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('[FullPackRequirementManager] Storage persist error:', e);
      }
    }

    this.notify();
    return updated;
  }

  /**
   * Sets status for a specific component without affecting other components.
   */
  static setComponentStatus(
    stepIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7,
    status: ComponentSetupStatus,
    detailMessage?: string,
    selectedAssetOrProvider?: string
  ): void {
    const state = this.getWizardState();
    const step = state.steps.find((s) => s.index === stepIndex);
    if (!step) return;

    step.status = status;
    if (detailMessage) step.detailMessage = detailMessage;
    if (selectedAssetOrProvider) step.selectedAssetOrProvider = selectedAssetOrProvider;
    step.timestamp = new Date().toISOString();

    this.updateWizardState({ steps: [...state.steps] });
  }

  /**
   * Checks requirements for a specific component before executing it.
   */
  static checkComponentRequirements(
    stepIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7
  ): ComponentRequirement | null {
    switch (stepIndex) {
      case 1: // Wallpaper
        return {
          id: 'req_wallpaper',
          componentKey: 'wallpaper',
          componentIndex: 1,
          title: 'Wallpaper Compatibility',
          description: 'High-contrast OLED wallpaper calibration.',
          rationale: 'Preserves your custom wallpaper if chosen, or applies Emerald Aurora OLED.',
          actionLabel: 'Apply Wallpaper',
          skipLabel: 'Skip Wallpaper',
          isMandatory: false,
          status: 'SATISFIED',
        };

      case 2: // Icon Pack
        return {
          id: 'req_icons',
          componentKey: 'icon_pack',
          componentIndex: 2,
          title: 'Vector Icon Pack Mapping',
          description: 'Maps icons to all 81 catalog apps including Phone, Messages, and Contacts.',
          rationale: 'System-wide vector glyph coverage for installed applications.',
          actionLabel: 'Apply Icon Pack',
          skipLabel: 'Skip Icon Pack',
          isMandatory: false,
          status: 'SATISFIED',
        };

      case 3: // Widgets + Quick Panel
        return {
          id: 'req_widgets',
          componentKey: 'widgets_quick_panel',
          componentIndex: 3,
          title: 'System UI & Quick Settings',
          description: 'Configures Quick Panel tiles and home screen system widgets.',
          rationale: 'Unified layout for Wi-Fi, Bluetooth, Torch, Sound, and Hotspot tiles.',
          actionLabel: 'Apply Quick Panel',
          skipLabel: 'Skip Quick Panel',
          isMandatory: false,
          status: 'SATISFIED',
        };

      case 4: // Keyboard Theme
        return {
          id: 'req_keyboard',
          componentKey: 'keyboard_theme',
          componentIndex: 4,
          title: 'Keyboard Theme & IME Styling',
          description: 'Tactile elevation keycap styling and localized predictive buffer.',
          rationale: 'Zero cloud keystroke interception with 100% on-device tactile feedback.',
          actionLabel: 'Apply Keyboard Theme',
          skipLabel: 'Skip Keyboard Theme',
          isMandatory: false,
          status: 'SATISFIED',
        };

      case 5: { // Jarvis — Full Setup
        const hasAccess = PlatformBridge.hasAccessibilityPermission();
        const hasMic = PlatformBridge.hasMicrophonePermission();

        if (hasAccess && hasMic) {
          return {
            id: 'req_jarvis_ok',
            componentKey: 'jarvis_full_setup',
            componentIndex: 5,
            title: 'Jarvis System-Wide Access',
            description: 'Accessibility Service & Microphone verified.',
            rationale: 'Jarvis is fully authorized to automate in-app tasks and listen for wake words.',
            actionLabel: 'Configure Jarvis',
            skipLabel: 'Skip Jarvis',
            isMandatory: false,
            status: 'SATISFIED',
          };
        }

        // Needs user action to enable Accessibility or Mic
        return {
          id: 'req_jarvis_accessibility',
          componentKey: 'jarvis_full_setup',
          componentIndex: 5,
          title: 'Jarvis System-Wide Access Required',
          description: 'ONEVA needs Accessibility access to enable system-wide Jarvis automation.',
          rationale:
            'Accessibility Service allows Jarvis to interact with apps on your behalf when given voice commands. Keystrokes and private messages are strictly never intercepted.',
          actionLabel: 'Open Accessibility Settings',
          skipLabel: 'Skip Jarvis',
          isMandatory: false,
          status: 'NEEDS_USER_ACTION',
          settingsIntent: 'android.settings.ACCESSIBILITY_SETTINGS',
          detectedDetail: hasAccess
            ? 'Accessibility: Active | Mic: Permission needed'
            : 'Accessibility: Not enabled in Android Settings',
        };
      }

      case 6: // Jarvis Reactive Wallpaper
        return {
          id: 'req_jarvis_wallpaper',
          componentKey: 'jarvis_reactive_wallpaper',
          componentIndex: 6,
          title: 'Reactive Visual Layer',
          description: 'Calibrates 3D audio-reactive energy sphere layer above base wallpaper.',
          rationale: 'Visual reactive intensity pulses when Jarvis speaks and hides when sleeping.',
          actionLabel: 'Activate Reactive Layer',
          skipLabel: 'Skip Reactive Layer',
          isMandatory: false,
          status: 'SATISFIED',
        };

      case 7: { // ONEVA Camera
        const hasCamPerm = PlatformBridge.hasCameraPermission();
        const recommended = CameraProviderRegistry.getRecommendedProvider();

        if (recommended.isInstalled) {
          return {
            id: 'req_camera_installed',
            componentKey: 'oneva_ai_camera',
            componentIndex: 7,
            title: `Recommended Camera: ${recommended.provider.displayName}`,
            description: recommended.provider.capabilities.processingSummary,
            rationale: recommended.reason,
            actionLabel: `Use ${recommended.provider.displayName}`,
            skipLabel: 'Skip Camera',
            isMandatory: false,
            status: hasCamPerm ? 'SATISFIED' : 'NEEDS_USER_ACTION',
            detectedDetail: hasCamPerm ? 'Camera permission granted' : 'Camera permission requested',
          };
        }

        // Compatible external provider recommended, but not installed yet
        return {
          id: 'req_camera_install_offer',
          componentKey: 'oneva_ai_camera',
          componentIndex: 7,
          title: `Recommended for your device: ${recommended.provider.displayName}`,
          description: recommended.provider.capabilities.processingSummary,
          rationale:
            'Provides flagship computational HDR and multi-frame processing using your hardware sensor.',
          actionLabel: `Install ${recommended.provider.displayName}`,
          skipLabel: 'Use Built-in Camera',
          isMandatory: false,
          status: 'NEEDS_USER_ACTION',
          detectedDetail: recommended.provider.capabilities.processingSummary,
        };
      }

      default:
        return null;
    }
  }

  /**
   * Advances the wizard to the next component step.
   */
  static nextStep(): void {
    const state = this.getWizardState();
    if (state.currentStepIndex < 7) {
      const nextIndex = (state.currentStepIndex + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
      this.updateWizardState({ currentStepIndex: nextIndex });
    } else {
      // Finished all 7 components
      this.updateWizardState({
        currentStepIndex: 8,
        isCompleted: true,
        completedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Skips the current component cleanly and advances to the next step.
   * All previously applied components remain 100% active and untouched!
   */
  static skipCurrentStep(reason: string = 'User skipped component'): void {
    const state = this.getWizardState();
    if (state.currentStepIndex <= 7) {
      const stepIdx = state.currentStepIndex as 1 | 2 | 3 | 4 | 5 | 6 | 7;
      this.setComponentStatus(stepIdx, 'skipped', reason);
      this.nextStep();
    }
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('[FullPackRequirementManager] Listener error:', e);
      }
    });
  }
}
