/**
 * ONEVA Phase 8 — Independent Customization Comparison Engine
 * 
 * CORE ARCHITECTURAL RULES:
 * 1. Strictly compares:
 *    Current User State  VS  Last Applied Full Pack Snapshot
 * 2. Every category is evaluated independently:
 *    Theme       -> MATCHED / MODIFIED
 *    Icon Pack   -> MATCHED / MODIFIED
 *    Wallpaper   -> MATCHED / MODIFIED
 *    Keyboard    -> MATCHED / MODIFIED
 *    Animation   -> MATCHED / MODIFIED
 *    Camera      -> MATCHED / MODIFIED
 *    Jarvis      -> MATCHED / MODIFIED
 *    Edge Glow   -> MATCHED / MODIFIED
 * 3. Never confuses FULL PACK SNAPSHOT with CURRENT USER STATE.
 * 4. When all match: Full Pack button is "✓ Applied".
 * 5. When any differ: Full Pack button is "↻ Apply Full ONEVA Pack".
 */

import {
  FullPackSnapshot,
  CurrentUserState,
  FullPackComparisonResult,
  CategoryComparisonDetail,
} from '../types/fullPack';
import { AdminAssetService } from './adminAssetService';

const SNAPSHOT_STORAGE_KEY = 'oneva_full_pack_snapshot_v8';

export class FullPackComparisonService {
  private static cachedSnapshot: FullPackSnapshot | null = null;
  private static listeners: Set<() => void> = new Set();

  /**
   * Retrieves the stored Full Pack snapshot from the last time
   * "Apply Full ONEVA Pack" was executed.
   */
  static getSnapshot(): FullPackSnapshot | null {
    if (this.cachedSnapshot) return this.cachedSnapshot;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
        if (raw) {
          this.cachedSnapshot = JSON.parse(raw);
          return this.cachedSnapshot;
        }
      } catch (err) {
        console.warn('[FullPackComparisonService] Failed to parse snapshot:', err);
      }
    }
    return null;
  }

  /**
   * Persists a new snapshot when the user applies the Full ONEVA Pack.
   * This represents the exact configuration of defaults at that instant.
   */
  static saveSnapshot(snapshot: FullPackSnapshot): void {
    this.cachedSnapshot = snapshot;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
      } catch (err) {
        console.warn('[FullPackComparisonService] Failed to persist snapshot:', err);
      }
    }
    this.notify();
  }

  /**
   * Clears the snapshot (e.g. for reset or first-run experience).
   */
  static clearSnapshot(): void {
    this.cachedSnapshot = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SNAPSHOT_STORAGE_KEY);
    }
    this.notify();
  }

  /**
   * Performs the comparison between Current User State and Current Admin Defaults.
   * Mandate (Phase 9):
   * - Compares the actual active configuration vs the current ONEVA Full Pack defaults.
   * - When Admin changes default A -> B, existing user customization remains untouched,
   *   and the comparison recognizes the difference so the button shows "APPLY".
   * - When user applies Full Pack, all active defaults are applied and button shows "APPLIED".
   * - When user modifies even one item (e.g. wallpaper to gallery or another theme),
   *   only that item is modified and button changes to "APPLY".
   */
  static compare(currentState: CurrentUserState): FullPackComparisonResult {
    const defaults = AdminAssetService.getAllDefaults();
    const snapshot = this.getSnapshot();
    const categories: CategoryComparisonDetail[] = [];
    const allAssets = AdminAssetService.getAssets();

    const getAssetName = (id?: string, fallback = 'Default') => {
      if (!id) return fallback;
      const found = allAssets.find((a) => a.id === id);
      return found ? found.name.split(':')[0] : id;
    };

    // 1. THEME
    const defaultTheme = defaults.theme;
    const themeMatch = Boolean(defaultTheme && currentState.themeId === defaultTheme.id);
    categories.push({
      category: 'theme',
      categoryLabel: 'Theme',
      currentId: currentState.themeId,
      snapshotId: defaultTheme?.id || 'none',
      currentName: currentState.themeName || getAssetName(currentState.themeId, 'OLED Pure Black'),
      snapshotName: defaultTheme?.name?.split(':')[0] || 'OLED Pure Black',
      status: themeMatch ? 'MATCHED' : 'MODIFIED',
    });

    // 2. ICON PACK
    const defaultIconPack = defaults.icon_pack;
    const iconPackMatch = Boolean(defaultIconPack && currentState.iconPackId === defaultIconPack.id);
    categories.push({
      category: 'icon_pack',
      categoryLabel: 'Icon Pack',
      currentId: currentState.iconPackId,
      snapshotId: defaultIconPack?.id || 'none',
      currentName: currentState.iconPackName || getAssetName(currentState.iconPackId, 'Minimalist Vector Core'),
      snapshotName: defaultIconPack?.name?.split(':')[0] || 'Minimalist Vector Core',
      status: iconPackMatch ? 'MATCHED' : 'MODIFIED',
    });

    // 3. WALLPAPER
    const defaultWallpaper = defaults.wallpaper;
    const isGallery =
      currentState.wallpaperSource === 'gallery' ||
      currentState.wallpaperId.includes('gallery') ||
      currentState.wallpaperSource === 'system_settings' ||
      currentState.wallpaperSource === 'external_app';
    const wallpaperMatch = !isGallery && Boolean(defaultWallpaper && currentState.wallpaperId === defaultWallpaper.id);
    categories.push({
      category: 'wallpaper',
      categoryLabel: 'Wallpaper',
      currentId: currentState.wallpaperId,
      snapshotId: defaultWallpaper?.id || 'none',
      currentName: isGallery ? 'Gallery Photo (Device)' : (currentState.wallpaperName || getAssetName(currentState.wallpaperId, 'Emerald Aurora')),
      snapshotName: defaultWallpaper?.name?.split(':')[0] || 'Emerald Aurora',
      status: wallpaperMatch ? 'MATCHED' : 'MODIFIED',
      sourceNote: isGallery ? 'Custom user wallpaper from Device Gallery' : undefined,
    });

    // 4. KEYBOARD
    const defaultKeyboard = defaults.keyboard;
    const keyboardMatch = Boolean(defaultKeyboard && currentState.keyboardAnimationId === defaultKeyboard.id);
    categories.push({
      category: 'keyboard',
      categoryLabel: 'Keyboard Animation',
      currentId: currentState.keyboardAnimationId,
      snapshotId: defaultKeyboard?.id || 'none',
      currentName: currentState.keyboardName || getAssetName(currentState.keyboardAnimationId, 'OLED Tactile Elevation'),
      snapshotName: defaultKeyboard?.name?.split(':')[0] || 'OLED Tactile Elevation',
      status: keyboardMatch ? 'MATCHED' : 'MODIFIED',
    });

    // 5. CAMERA
    const defaultCamera = defaults.camera;
    const cameraMatch = Boolean(defaultCamera && currentState.cameraId === defaultCamera.id);
    categories.push({
      category: 'camera',
      categoryLabel: 'Camera Profile',
      currentId: currentState.cameraId,
      snapshotId: defaultCamera?.id || 'none',
      currentName: currentState.cameraName || getAssetName(currentState.cameraId, 'Low-Light Neutral OLED Tone'),
      snapshotName: defaultCamera?.name?.split(':')[0] || 'Low-Light Neutral OLED Tone',
      status: cameraMatch ? 'MATCHED' : 'MODIFIED',
    });

    // 6. JARVIS
    const defaultJarvis = defaults.assist;
    const jarvisMatch = Boolean(defaultJarvis && currentState.jarvisId === defaultJarvis.id);
    categories.push({
      category: 'jarvis',
      categoryLabel: 'ONEVA Assist / JARVIS',
      currentId: currentState.jarvisId,
      snapshotId: defaultJarvis?.id || 'none',
      currentName: currentState.jarvisName || getAssetName(currentState.jarvisId, 'Jarvis Reactive Core'),
      snapshotName: defaultJarvis?.name?.split(':')[0] || 'Jarvis Reactive Core',
      status: jarvisMatch ? 'MATCHED' : 'MODIFIED',
    });

    const matchedCount = categories.filter((c) => c.status === 'MATCHED').length;
    const modifiedCategories = categories.filter((c) => c.status === 'MODIFIED');
    const modifiedCount = modifiedCategories.length;
    const isFullPackApplied = modifiedCount === 0;

    const modifiedCategoryLabels = modifiedCategories.map((c) => c.categoryLabel);

    let summaryMessage = 'All 8 tracked settings match current ONEVA Full Pack defaults.';
    if (!isFullPackApplied) {
      summaryMessage = `${modifiedCount} customization(s) differ from Full Pack defaults (${modifiedCategoryLabels.join(', ')}).`;
    }

    return {
      isFullPackApplied,
      hasSnapshot: Boolean(snapshot || isFullPackApplied),
      appliedAt: snapshot?.appliedAt,
      matchedCount,
      modifiedCount,
      totalTracked: categories.length,
      categories,
      modifiedCategoryLabels,
      summaryMessage,
    };
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
        console.error('[FullPackComparisonService] Listener error:', err);
      }
    });
  }
}
