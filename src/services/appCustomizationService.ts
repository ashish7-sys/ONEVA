/**
 * ONEVA App Customization Service (Phase 5)
 * ARCHITECTURAL MANDATES:
 * - Stores per-app customization mappings locally on device (local-first).
 * - Zero private app content collected or transmitted to cloud.
 * - Schema follows: user + package_name + customization_type + asset_id + enabled + updated_at
 * - Coordinates cleanly with EdgeGlowService, IconService, and AppModificationEngine.
 * - Non-destructive: supports removing individual customizations, resetting per app, and resetting all.
 */

import { IconService } from './iconService';
import { AppModificationEngine } from '../launcher/services/appModificationEngine';

export type CustomizationType = 'icon';

export interface AppCustomizationRecord {
  id: string; // `${packageName}_${customizationType}`
  user: string; // 'local_device'
  packageName: string;
  customizationType: CustomizationType;
  assetId: string;
  assetName: string;
  enabled: boolean;
  updatedAt: string;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'oneva_app_customizations_v5';

export class AppCustomizationService {
  private static cachedRecords: Record<string, AppCustomizationRecord> | null = null;
  private static listeners: Set<() => void> = new Set();

  /**
   * Load all local customization records
   */
  private static loadRecords(): Record<string, AppCustomizationRecord> {
    if (this.cachedRecords) {
      return this.cachedRecords;
    }

    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.cachedRecords = JSON.parse(raw);
        return this.cachedRecords || {};
      }
    } catch (err) {
      console.warn('[AppCustomizationService] Failed to load customization records:', err);
    }

    // Default seeded mappings for developer preview
    const initialRecords: Record<string, AppCustomizationRecord> = {
      'com.google.android.youtube_icon': {
        id: 'com.google.android.youtube_icon',
        user: 'local_device',
        packageName: 'com.google.android.youtube',
        customizationType: 'icon',
        assetId: 'icon-b',
        assetName: 'YouTube Carmine Minimal',
        enabled: true,
        updatedAt: new Date().toISOString(),
        metadata: { iconGlyph: 'Play' },
      },
      'com.whatsapp_icon': {
        id: 'com.whatsapp_icon',
        user: 'local_device',
        packageName: 'com.whatsapp',
        customizationType: 'icon',
        assetId: 'icon-a',
        assetName: 'WhatsApp Phosphor Glyph (Admin ★ Default)',
        enabled: true,
        updatedAt: new Date().toISOString(),
        metadata: { iconGlyph: 'MessageCircle' },
      },
    };

    this.cachedRecords = initialRecords;
    this.saveRecords(initialRecords);
    return this.cachedRecords;
  }

  private static saveRecords(records: Record<string, AppCustomizationRecord>): void {
    this.cachedRecords = records;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      } catch (err) {
        console.warn('[AppCustomizationService] Failed to save customization records:', err);
      }
    }
    this.notify();
  }

  /**
   * Get all active customization mappings
   */
  static getAllCustomizations(): AppCustomizationRecord[] {
    const records = this.loadRecords();
    return Object.values(records).filter((r) => r.enabled);
  }

  /**
   * Get customizations configured for a specific package
   */
  static getCustomizationsForPackage(packageName: string): AppCustomizationRecord[] {
    const records = this.loadRecords();
    return Object.values(records).filter((r) => r.packageName === packageName && r.enabled);
  }

  /**
   * Get a specific customization type for a package
   */
  static getCustomization(
    packageName: string,
    customizationType: CustomizationType
  ): AppCustomizationRecord | undefined {
    const key = `${packageName}_${customizationType}`;
    const records = this.loadRecords();
    return records[key]?.enabled ? records[key] : undefined;
  }

  /**
   * Set or update a customization mapping
   */
  static setCustomization(
    packageName: string,
    customizationType: CustomizationType,
    assetId: string,
    assetName: string,
    metadata?: Record<string, any>
  ): void {
    const records = { ...this.loadRecords() };
    const key = `${packageName}_${customizationType}`;

    records[key] = {
      id: key,
      user: 'local_device',
      packageName,
      customizationType,
      assetId,
      assetName,
      enabled: true,
      updatedAt: new Date().toISOString(),
      metadata,
    };

    this.saveRecords(records);
    this.syncWithSubsystems(packageName, customizationType, assetId, metadata);
  }

  /**
   * Remove a single customization from an app
   */
  static removeCustomization(packageName: string, customizationType: CustomizationType): void {
    const records = { ...this.loadRecords() };
    const key = `${packageName}_${customizationType}`;

    if (records[key]) {
      delete records[key];
      this.saveRecords(records);
      this.revertSubsystem(packageName, customizationType);
    }
  }

  /**
   * Reset all customizations for a specific application back to genuine system defaults
   */
  static resetApp(packageName: string): void {
    const records = { ...this.loadRecords() };
    let changed = false;

    Object.keys(records).forEach((k) => {
      if (records[k].packageName === packageName) {
        delete records[k];
        changed = true;
      }
    });

    if (changed) {
      this.saveRecords(records);
      IconService.setIndividualAppIcon(packageName, null);
      AppModificationEngine.resetEnhancement(packageName);
    }
  }

  /**
   * Reset all ONEVA modifications across all apps back to system defaults
   */
  static resetAll(): void {
    this.saveRecords({});
    IconService.saveSettings({ individualAppIcons: {}, individualPackOverrides: {} });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oneva_app_enhancement_profiles');
    }
    this.notify();
  }

  /**
   * Apply batch customizations to multiple applications (e.g. Apply to All or Multi-Selected apps)
   */
  static applyBatchCustomization(
    packageNames: string[],
    options: {
      icon?: { assetId: string; assetName: string; iconGlyph?: string };
    }
  ): { count: number; message: string } {
    const records = { ...this.loadRecords() };

    packageNames.forEach((pkg) => {
      if (options.icon) {
        const key = `${pkg}_icon`;
        records[key] = {
          id: key,
          user: 'local_device',
          packageName: pkg,
          customizationType: 'icon',
          assetId: options.icon.assetId,
          assetName: options.icon.assetName,
          enabled: true,
          updatedAt: new Date().toISOString(),
          metadata: { iconGlyph: options.icon.iconGlyph },
        };
        if (options.icon.iconGlyph) {
          IconService.setIndividualAppIcon(pkg, options.icon.iconGlyph);
        }
      }
    });

    this.saveRecords(records);

    return {
      count: packageNames.length,
      message: `Applied icon customizations to ${packageNames.length} application${packageNames.length === 1 ? '' : 's'}.`,
    };
  }

  /**
   * Keep subsystems synchronized with the mapping
   */
  private static syncWithSubsystems(
    packageName: string,
    type: CustomizationType,
    assetId: string,
    metadata?: Record<string, any>
  ): void {
    if (type === 'icon' && metadata?.iconGlyph) {
      IconService.setIndividualAppIcon(packageName, metadata.iconGlyph);
    }
  }

  private static revertSubsystem(packageName: string, type: CustomizationType): void {
    if (type === 'icon') {
      IconService.setIndividualAppIcon(packageName, null);
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
      } catch (err) {
        console.error('[AppCustomizationService] Listener notification error:', err);
      }
    });
  }
}
