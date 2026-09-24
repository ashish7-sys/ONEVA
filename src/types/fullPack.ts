/**
 * ONEVA Phase 8 — Full ONEVA Pack & Independent Customization Types
 * Strict separation between:
 * 1. FULL PACK SNAPSHOT: Stored state at the exact moment Full Pack was applied.
 * 2. CURRENT USER STATE: Live configuration active on the device.
 */

export interface FullPackSnapshot {
  themeId: string;
  themeName?: string;
  iconPackId: string;
  iconPackName?: string;
  wallpaperId: string;
  wallpaperName?: string;
  keyboardAnimationId: string;
  keyboardName?: string;
  appAnimationId?: string;
  appAnimationName?: string;
  cameraId: string;
  cameraName?: string;
  jarvisId: string;
  jarvisName?: string;
  jarvisWallpaperId?: string;
  edgeEffectId?: string;
  edgeEffectName?: string;
  appliedAt: string;
}

export type WallpaperSourceType = 'admin_pack' | 'preset' | 'gallery' | 'picker' | 'external_app' | 'system_settings';

export interface CurrentUserState {
  themeId: string;
  themeName?: string;
  iconPackId: string;
  iconPackName?: string;
  wallpaperId: string;
  wallpaperName?: string;
  wallpaperSource?: WallpaperSourceType;
  customWallpaperData?: string; // base64 / blob URL for local gallery wallpaper
  keyboardAnimationId: string;
  keyboardName?: string;
  appAnimationId?: string;
  appAnimationName?: string;
  cameraId: string;
  cameraName?: string;
  jarvisId: string;
  jarvisName?: string;
  jarvisWallpaperId?: string;
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
