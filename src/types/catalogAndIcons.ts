export type CatalogAppCategory =
  | 'communication'
  | 'media'
  | 'utilities'
  | 'productivity'
  | 'system'
  | 'social'
  | 'entertainment'
  | 'developer'
  | 'finance'
  | 'shopping'
  | 'lifestyle';

export type CatalogAppType = 'canonical' | 'extended' | 'custom';
export type IconCatalogStatus = 'available' | 'not_uploaded' | 'generating' | 'unmatched';

export interface IconAssetReference {
  assetId?: string;
  url?: string;
  dataUrl?: string;
  thumbnailUrl?: string;
  originalFileName?: string;
  format?: 'svg' | 'png' | 'jpeg';
  fileSizeBytes?: number;
  uploadedAt?: string;
  mimeType?: string;
}

export interface CatalogApp {
  id: string; // Typically package name or stable internal ID
  name: string;
  appName?: string; // Standard alias for name
  displayName?: string; // Explicit human-readable display name
  normalizedName?: string; // e.g. "google", "microsoft-word"
  aliases?: string[]; // Natural language or alternative matching aliases
  packageName: string;
  packageAliases?: string[]; // Multiple legitimate package variants (e.g. Lite, Business, secondary IDs)
  category: CatalogAppCategory;
  defaultIcon: string; // Lucide icon name or image data URL/SVG
  defaultIconType?: 'lucide' | 'image' | 'svg';
  icon?: string; // Direct icon identifier or Lucide name
  iconKey?: string; // Normalized SVG key, e.g. "whatsapp.svg", "google-pay.svg"
  iconPath?: string; // Asset path, e.g. "/icons/whatsapp.svg"
  accentColor: string;
  fallbackInitial: string;
  status: 'active' | 'disabled';
  catalogType?: CatalogAppType; // 'canonical' | 'extended' | 'custom'
  iconStatus?: IconCatalogStatus; // 'available' | 'not_uploaded' | 'generating' | 'unmatched'
  iconAsset?: IconAssetReference | null;
  supported?: boolean; // True if supported by ONEVA
  enabled?: boolean; // True if enabled
  capabilities?: string[]; // e.g. ['open_app', 'edge_glow', 'icon_customization', 'app_animation']
  actions?: string[]; // ONEVA quick actions/intents
  searchKeywords: string[];
  isSystemApp?: boolean;
  webFallbackIntent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedAppCatalogStructure {
  canonicalApps: CatalogApp[];
  extendedApps: CatalogApp[];
  customApps: CatalogApp[];
  totalCapacity: number;
}

export interface SingleAppIconOption {
  id: string;
  appPackageName: string;
  variantName: string; // e.g. "Neon Emerald", "Glass Frost", "OLED Pure White", "Purple Cyber", "Retro Pixel"
  iconDataUrl: string; // Optimized data URL / SVG string
  iconType: 'svg' | 'image' | 'lucide';
  lucideIconName?: string;
  previewColor?: string;
  order: number;
  isEnabled: boolean;
  author?: string;
  ownership?: 'admin' | 'user'; // Admin = global, User = personal
  packId?: string; // If associated with an uploaded icon pack
  createdAt: string;
  updatedAt: string;
}

export interface IconPackMapping {
  packageName: string;
  iconDataUrl?: string;
  iconName?: string;
  svgContent?: string;
}

export interface FullIconPack {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  status: 'published' | 'draft' | 'disabled';
  isDefault: boolean;
  glyphCount: number;
  previewImages: string[];
  packIconUrl?: string;
  iconMappings: Record<string, string>; // packageName -> relativeFilePath or dataUrl
  extractedIcons?: Record<string, string>; // packageName -> optimized dataUrl / preview
  createdAt: string;
  updatedAt: string;
}

export interface IconPackImportSummary {
  totalInZip: number;
  imported: number;
  matched: number;
  unmatched: number;
  invalid: number;
  unmatchedPackages: string[];
  matchedPackages: string[];
  invalidEntries: string[];
}

export interface UserIconState {
  activeFullPackId: string | null;
  // Rule: Single App Icon Override has top priority
  // packageName -> singleAppIconId (references SingleAppIconOption)
  singleAppIconOverrides: Record<string, string>;
  fallbackShape: 'squircle' | 'rounded' | 'circle';
}

export interface ResolvedAppIconResult {
  tier: 1 | 2 | 3;
  tierName: 'Single App Icon Override' | 'Full Icon Pack' | 'Original App Icon';
  source: 'single_app_override' | 'full_pack' | 'original';
  iconType: 'image' | 'lucide' | 'svg';
  iconValue: string; // icon data URL, svg, or lucide icon name
  label: string;
  packName?: string;
  variantName?: string;
}
