export type OnevaAssetCategory =
  | 'wallpaper'
  | 'live_wallpaper'
  | 'icon_pack'
  | 'theme'
  | 'system_ui'
  | 'keyboard'
  | 'keyboard_background'
  | 'individual_icon'
  | 'camera'
  | 'assist';

export type ScalableStorageFolder =
  | 'wallpapers'
  | 'live-wallpapers'
  | 'icon-packs'
  | 'individual-icons'
  | 'icons'
  | 'themes'
  | 'system-ui'
  | 'keyboards'
  | 'previews'
  | 'thumbnails';

export interface AssetStoragePaths {
  folder: ScalableStorageFolder;
  originalPath?: string;
  previewPath?: string;
  thumbnailPath?: string;
  posterPath?: string;
  previewVideoPath?: string;
  manifestPath?: string;
  sampleIconsPath?: string;
}

export interface AssetMediaUrls {
  originalUrl?: string;
  previewUrl?: string;
  previewVideoUrl?: string;
  thumbnailUrl?: string;
  posterUrl?: string;
}

export type UploadProcessingStep =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'validating'
  | 'generating_preview'
  | 'ready'
  | 'error';

export interface UploadProgressState {
  step: UploadProcessingStep;
  progressPercent: number; // 0 to 100
  statusMessage: string;
  error?: string;
  assetId?: string;
  details?: {
    fileSize: number;
    processedBytes?: number;
    extractedCount?: number;
    totalCount?: number;
  };
}

export interface CategoryDefinition {
  id: OnevaAssetCategory;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
  supportsTransparency: boolean;
}

export interface IconPackManifest {
  packId: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  preview?: string;
  icons: Record<string, string>; // packageName -> relativeFilePath
  category?: string;
}

export interface IconPackValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  manifest?: IconPackManifest;
  iconCount: number;
  verifiedPackages: string[];
  previewDataUrl?: string;
  extractedIcons?: Record<string, string>;
  sampleIcons?: Array<{ name: string; label: string; bg: string; fg?: string; iconName?: string; glyphUrl?: string }>;
  originalFile?: File | Blob;
  zipSize: number;
}

export interface OnevaThemePackage {
  id: string;
  type: 'THEME';
  title: string;
  description: string;
  creator: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  wallpaperAssetId?: string | null;
  iconPackAssetId?: string | null;
  systemUiAssetId?: string | null;
  keyboardAssetId?: string | null;
  previewAssets?: string[];
  compatibility?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface OnevaThemeDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  creator?: string;
  rating?: number;
  wallpaperId?: string;
  wallpaperAssetId?: string | null;
  wallpaperUrl?: string;
  isLiveWallpaper?: boolean;
  liveWallpaperStyle?: 'jarvis_reactive' | 'cyber_grid' | 'cosmic_nebula';
  iconPackId?: string;
  iconPackAssetId?: string | null;
  iconPackName?: string;
  systemUiAssetId?: string | null;
  keyboardId?: string;
  keyboardAssetId?: string | null;
  previewAssets?: string[];
  compatibility?: Record<string, any>;
  individualIconOverrides?: Record<string, string>; // packageName -> custom single icon id or dataUrl
  systemUi?: {
    searchBarStyle?: 'futuristic_pill' | 'glass_blur' | 'minimal_outline' | 'oled_floating' | 'android_stock';
    volumePanelStyle?: 'compact' | 'expanded' | 'neon_slider';
    statusBarStyle?: 'minimal' | 'cyber' | 'standard';
    navBarStyle?: 'pill' | 'thin_line' | 'hidden';
    batteryStyle?: 'horizontal_pill' | 'circle_meter' | 'bold_percentage' | 'minimal';
    wifiStyle?: 'curved_waves' | 'tech_bars' | 'minimal';
    signalStyle?: '5g_contour' | 'classic_stepped' | 'dot_matrix';
    clockStyle?: 'modern_sans' | 'digital_mono' | 'dual_line_tech' | 'minimalist';
  };
  quickSettings?: {
    tileShape?: 'squircle' | 'rounded' | 'pill' | 'circle';
    activeTileColor?: string;
    backgroundBlur?: number;
    panelLuminance?: 'oled' | 'dark' | 'glass';
  };
  cameraProfileId?: string;
  appAnimationId?: string;
  colors: {
    primary: string;
    accent: string;
    surface: string;
    background: string;
    border: string;
    text: string;
  };
  appearance: {
    mode: 'oled' | 'dark';
    luminance: 'pure_black' | 'high_contrast' | 'slate_neutral';
    oledBlack: boolean;
    contrastRatio: number;
  };
}

export interface IntegrationRequirements {
  requiresLauncherRole?: boolean;
  requiresCompanionBridge?: boolean;
  requiresCamera2Api?: boolean;
  requiresAccessibilityService?: boolean;
  statusDescription: string;
}

export interface OnevaAsset {
  id: string;
  name: string;
  category: OnevaAssetCategory;
  description: string;
  version: string;
  status: 'draft' | 'testing' | 'verified' | 'published' | 'disabled';
  isDefault: boolean; // Authoritative single default per category
  createdAt: string;
  updatedAt: string;
  author?: string;
  rating?: number; // Admin Blue-Star Rating 1-10 (display priority ranking)
  autoCategories?: string[]; // Automated tags: 'Anime', 'Cool', 'AMOLED', 'Sci-Fi', 'Minimal', 'Cyber', 'Hot', 'New', etc.
  isLiveWallpaper?: boolean;
  liveWallpaperStyle?: 'jarvis_reactive' | 'cyber_grid' | 'cosmic_nebula';
  isPrivateUserAsset?: boolean; // Admin = Global; User = Private
  fileSize?: string;
  fileSizeBytes?: number;
  dimensions?: string;
  durationSec?: number;
  checksum?: string;
  previewData?: {
    color?: string;
    secondaryColor?: string;
    cssBackground?: string;
    keyBg?: string;
    boardBg?: string;
    textColor?: string;
    durationSec?: number;
    glyphCount?: number;
    previewUrl?: string;
    previewVideoUrl?: string;
    mediaType?: 'image' | 'video' | 'gradient';
    curve?: string;
    profileType?: string;
    previewDataUrl?: string;
    previewThumbnailUrl?: string;
    hasStoredMedia?: boolean;
    systemUiComponent?: 'quick_settings' | 'volume_panel' | 'status_bar' | 'search_bar' | 'lock_screen';
    customData?: Record<string, unknown>;
    sampleIcons?: Array<{ name: string; label: string; bg: string; fg?: string; iconName?: string; glyphUrl?: string }>;
    keyboardStyle?: {
      keyBg?: string;
      boardBg?: string;
      accentColor?: string;
      textColor?: string;
      keycapShape?: 'rounded' | 'square' | 'pill';
      backgroundMediaUrl?: string;
      backgroundMediaType?: 'image' | 'video';
    };
  };
  assets?: {
    zipFileName?: string;
    manifest?: IconPackManifest;
    extractedIcons?: Record<string, string>;
    themeDefinition?: OnevaThemeDefinition;
    rawPayload?: Record<string, unknown>;
  };
  integrationRequirements?: IntegrationRequirements;
  processingMode?: 'original' | 'alpha_channel' | 'chroma_key' | 'screen_blend';
  keyColor?: '#000000' | '#00ff00' | '#ffffff';
  blendMode?: 'screen' | 'additive' | 'normal';
  storagePaths?: AssetStoragePaths;
  mediaUrls?: AssetMediaUrls;
  payload: Record<string, unknown>;
}

export interface CategoryDefaultConfig {
  category: OnevaAssetCategory;
  defaultAssetId: string;
  assetName: string;
  updatedAt: string;
  updatedBy: string;
}

export interface FullPackItemStatus {
  category: OnevaAssetCategory;
  categoryLabel: string;
  assetId: string;
  assetName: string;
  status: 'pending' | 'applying' | 'applied' | 'warning' | 'failed';
  message: string;
  detail?: string;
}

export interface FullPackExecutionResult {
  success: boolean;
  timestamp: string;
  items: FullPackItemStatus[];
  appliedCount: number;
  warningCount: number;
  failedCount: number;
}
