/**
 * ONEVA Phase 8 — Full ONEVA Pack & Independent Customization Types
 * Strict separation between:
 * 1. FULL PACK SNAPSHOT: Stored state at the exact moment Full Pack was applied.
 * 2. CURRENT USER STATE: Live configuration active on the device.
 */

/**
 * ONEVA Phase 19 — The 7 Core Architectural Components of "Apply Full ONEVA Pack"
 * 
 * 1. WALLPAPER: Admin static or live wallpaper; preserves user background.
 * 2. ICON PACK: Applied to all 81 catalog apps including Phone, Messages, Contacts.
 * 3. WIDGETS + QUICK PANEL: ONEVA widgets & Quick Settings tiles (Wi-Fi, Torch, etc.).
 * 4. KEYBOARD THEME: ONEVA keyboard appearance & tactile elevation.
 * 5. JARVIS — FULL SETUP: System-wide AI core & 5 states (Sleeping, Awake, Short, Research, Hand Control).
 * 6. JARVIS WALLPAPER — REACTIVE AWAKE VISUAL: Audio/energy visual layer above base wallpaper.
 * 7. ONEVA AI CAMERA — SPECIAL FOCUS: Dedicated computational photography subsystem.
 */

export type OnevaPackComponentKey =
  | 'wallpaper'
  | 'icon_pack'
  | 'widgets_quick_panel'
  | 'keyboard_theme'
  | 'jarvis_full_setup'
  | 'jarvis_reactive_wallpaper'
  | 'oneva_ai_camera';

export interface OnevaPackComponentManifest {
  key: OnevaPackComponentKey;
  index: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  categoryLabel: string;
  description: string;
  activeProfile: string;
  isSpecialFocus?: boolean;
}

export interface FullPackSnapshot {
  themeId?: string;
  themeName?: string;
  iconPackId: string;
  iconPackName?: string;
  wallpaperId: string;
  wallpaperName?: string;
  widgetsQuickPanelId?: string;
  widgetsQuickPanelName?: string;
  keyboardAnimationId: string;
  keyboardName?: string;
  appAnimationId?: string;
  appAnimationName?: string;
  cameraId: string;
  cameraName?: string;
  aiCameraActive?: boolean;
  aiCameraTier?: string;
  jarvisId: string;
  jarvisName?: string;
  jarvisWallpaperId?: string;
  jarvisReactiveVisualEnabled?: boolean;
  edgeEffectId?: string;
  edgeEffectName?: string;
  appliedAt: string;
}

export type WallpaperSourceType = 'admin_pack' | 'preset' | 'gallery' | 'picker' | 'external_app' | 'system_settings';

export interface CurrentUserState {
  themeId?: string;
  themeName?: string;
  iconPackId: string;
  iconPackName?: string;
  wallpaperId: string;
  wallpaperName?: string;
  wallpaperSource?: WallpaperSourceType;
  customWallpaperData?: string; // base64 / blob URL for local gallery wallpaper
  widgetsQuickPanelId?: string;
  widgetsQuickPanelName?: string;
  keyboardAnimationId: string;
  keyboardName?: string;
  appAnimationId?: string;
  appAnimationName?: string;
  cameraId: string;
  cameraName?: string;
  aiCameraActive?: boolean;
  aiCameraTier?: string;
  jarvisId: string;
  jarvisName?: string;
  jarvisWallpaperId?: string;
  jarvisReactiveVisualEnabled?: boolean;
  edgeEffectId?: string;
  edgeEffectName?: string;
  lastModifiedAt: string;
  lastModifiedCategory?: string;
}

export type CategoryMatchStatus = 'MATCHED' | 'MODIFIED';

export interface CategoryComparisonDetail {
  category: string;
  categoryLabel: string;
  currentId: string;
  snapshotId: string;
  currentName: string;
  snapshotName: string;
  status: CategoryMatchStatus;
  sourceNote?: string;
}

export interface FullPackComparisonResult {
  isFullPackApplied: boolean;
  hasSnapshot: boolean;
  appliedAt?: string;
  matchedCount: number;
  modifiedCount: number;
  totalTracked: number;
  categories: CategoryComparisonDetail[];
  modifiedCategoryLabels: string[];
  summaryMessage: string;
}
