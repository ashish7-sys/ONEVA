import {
  AppShortcut,
  ModificationType,
  AppEnhancementProfile,
  CapabilityCheckResult,
  ResolvedAppVisuals,
} from '../types';
import { IconService } from '../../services/iconService';

const ENHANCEMENTS_STORAGE_KEY = 'oneva_app_enhancement_profiles';

export class AppModificationEngine {
  private static cachedProfiles: Record<string, AppEnhancementProfile> | null = null;
  private static listeners: Set<() => void> = new Set();

  /**
   * Strictly Enforced Architectural Boundary:
   * ONEVA does NOT alter third-party APK binaries, DEX bytecode, or private application data.
   * All enhancements operate strictly within legitimate Android launcher presentation APIs
   * and intent bindings.
   */
  static readonly BOUNDARY_DECLARATION = {
    modifiesApkBytecode: false,
    accessesPrivateAppData: false,
    interceptsChatContents: false,
    monitorsKeystrokes: false,
    mechanism: 'Launcher-level visual mapping & system intent bridge',
  };

  /**
   * Load all stored enhancement profiles from local storage
   */
  private static loadProfiles(): Record<string, AppEnhancementProfile> {
    if (this.cachedProfiles) {
      return this.cachedProfiles;
    }

    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const raw = localStorage.getItem(ENHANCEMENTS_STORAGE_KEY);
      if (raw) {
        this.cachedProfiles = JSON.parse(raw);
        return this.cachedProfiles || {};
      }
    } catch (err) {
      console.warn('[AppModificationEngine] Failed to load enhancement profiles:', err);
    }

    this.cachedProfiles = {};
    return this.cachedProfiles;
  }

  /**
   * Save enhancement profiles to local storage
   */
  private static saveProfiles(profiles: Record<string, AppEnhancementProfile>): void {
    this.cachedProfiles = profiles;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ENHANCEMENTS_STORAGE_KEY, JSON.stringify(profiles));
      } catch (err) {
        console.warn('[AppModificationEngine] Failed to persist enhancement profiles:', err);
      }
    }
    this.notifyListeners();
  }

  /**
   * Check capability for a specific enhancement type on a target package
   * Implements honest status reporting: supported, partially_supported, requires_permission, unsupported
   */
  static checkCapability(packageName: string, modificationType: ModificationType): CapabilityCheckResult {
    switch (modificationType) {
      case 'custom_icon':
        return {
          modificationType,
          status: 'supported',
          isPermitted: true,
          reason: 'Custom vector icon mapping supported on launcher surface.',
          mechanism: 'Launcher Icon Override (Android standard intent mapping)',
        };

      case 'custom_accent':
        return {
          modificationType,
          status: 'supported',
          isPermitted: true,
          reason: 'Custom chromatic accent rendering supported on launcher canvas.',
          mechanism: 'Local UI Theme Shader',
        };

      case 'custom_label':
        return {
          modificationType,
          status: 'supported',
          isPermitted: true,
          reason: 'Custom presentation alias supported on home screen and drawer.',
          mechanism: 'Launcher Label Alias Table',
        };

      case 'custom_badge':
        return {
          modificationType,
          status: 'supported',
          isPermitted: true,
          reason: 'Visual notification or category badge overlay supported.',
          mechanism: 'Launcher Canvas Overlay',
        };

      case 'notification_glow_profile':
        return {
          modificationType,
          status: 'requires_permission',
          isPermitted: false,
          reason: 'Associating custom ambient edge glow requires Android Notification Listener permission.',
          mechanism: 'NotificationListenerService (Future Phase hook)',
          requiresExternalPermission: 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
        };

      default:
        return {
          modificationType,
          status: 'unsupported',
          isPermitted: false,
          reason: 'Direct internal modification of third-party apps is blocked by Android security model.',
          mechanism: 'None (Blocked by Android Sandbox)',
        };
    }
  }

  /**
   * Get the current enhancement profile for an installed package
   */
  static getProfile(packageName: string): AppEnhancementProfile {
    const profiles = this.loadProfiles();
    return (
      profiles[packageName] || {
        packageName,
        hasActiveEnhancement: false,
      }
    );
  }

  /**
   * Apply an enhancement to an installed app
   * Follows: Installed App -> Modification -> Capability Check -> Apply or Fallback
   */
  static applyEnhancement(
    packageName: string,
    changes: Partial<AppEnhancementProfile>
  ): { success: boolean; profile: AppEnhancementProfile; fallbackApplied: boolean; message: string } {
    // 1. Run Capability Checks on requested modification keys
    if (changes.customIconName) {
      const iconCheck = this.checkCapability(packageName, 'custom_icon');
      if (!iconCheck.isPermitted) {
        return {
          success: false,
          profile: this.getProfile(packageName),
          fallbackApplied: true,
          message: `Icon modification rejected: ${iconCheck.reason}`,
        };
      }
    }

    if (changes.glowProfileColor) {
      const glowCheck = this.checkCapability(packageName, 'notification_glow_profile');
      if (glowCheck.status === 'requires_permission') {
        // We save the preference but flag that it requires permission in native runtime
        console.info(`[AppModificationEngine] Glow profile set for ${packageName} - will require listener permission.`);
      }
    }

    // 2. Persist safely
    const current = this.getProfile(packageName);
    const updated: AppEnhancementProfile = {
      ...current,
      ...changes,
      packageName,
      hasActiveEnhancement: true,
      updatedAt: new Date().toISOString(),
    };

    const profiles = { ...this.loadProfiles(), [packageName]: updated };
    this.saveProfiles(profiles);

    return {
      success: true,
      profile: updated,
      fallbackApplied: false,
      message: `Enhancement applied to ${packageName}`,
    };
  }

  /**
   * Reset enhancements for a package back to default system representation
   */
  static resetEnhancement(packageName: string): void {
    const profiles = { ...this.loadProfiles() };
    delete profiles[packageName];
    this.saveProfiles(profiles);
  }

  /**
   * Resolve final presentation visuals for an installed app with safe fallback
   * If custom icon/accent is absent or fails to load, falls back to default system metadata
   */
  static resolveVisuals(app: AppShortcut): ResolvedAppVisuals {
    const profile = this.getProfile(app.packageName);
    const resolvedIcon = IconService.resolveAppIcon(
      app.packageName,
      app.iconName,
      app.nativeIconDataUrl
    );

    let targetIcon = app.iconName;
    let isEnhanced = Boolean(profile.hasActiveEnhancement);

    if (profile.customIconName) {
      targetIcon = profile.customIconName;
      isEnhanced = true;
    } else if (resolvedIcon.iconDataUrl) {
      targetIcon = resolvedIcon.iconDataUrl;
      isEnhanced = true;
    } else if (resolvedIcon.iconName) {
      targetIcon = resolvedIcon.iconName;
      if (resolvedIcon.tier === 1 || resolvedIcon.tier === 2) {
        isEnhanced = true;
      }
    }

    return {
      label: profile.customLabel || app.label,
      iconName: targetIcon,
      accentColor: profile.customAccentColor || app.accentColor,
      badge: profile.customBadge || app.customBadge,
      isEnhanced,
      fallbackUsed: resolvedIcon.isFallback,
      fallbackReason: resolvedIcon.isFallback ? resolvedIcon.sourceDescription : undefined,
    };
  }

  /**
   * Subscription mechanism for reactive UI updates
   */
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
        console.error('[AppModificationEngine] Listener notification error:', err);
      }
    }
  }
}
