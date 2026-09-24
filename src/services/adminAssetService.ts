import {
  OnevaAsset,
  OnevaAssetCategory,
  CategoryDefinition,
  CategoryDefaultConfig,
} from '../types/adminAssets';
import { getSupabaseClient } from '../supabase/client';
import { AssetStorageService } from './assetStorageService';
import { ScalableStorageService } from './scalableStorageService';
import { AssetCacheService } from './assetCacheService';
import { RealtimeSyncService } from './realtimeSyncService';

export const ASSET_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'wallpaper',
    name: 'Wallpapers',
    tagline: 'High-Contrast OLED Backgrounds',
    description: 'Precision emissive display backgrounds engineered for zero battery drain.',
    iconName: 'Image',
    supportsTransparency: false,
  },
  {
    id: 'live_wallpaper',
    name: 'Live Wallpapers',
    tagline: 'Kinetic 60FPS Reactive Canvases',
    description: 'Interactive and kinetic reactive canvases running via Android WallpaperService.',
    iconName: 'Sparkles',
    supportsTransparency: false,
  },
  {
    id: 'icon_pack',
    name: 'Icon Packs',
    tagline: 'Vector Icon Bundles',
    description: 'System-wide vector glyph packages with 5-tier priority resolution mapping.',
    iconName: 'Package',
    supportsTransparency: true,
  },
  {
    id: 'theme',
    name: 'Themes',
    tagline: 'Complete Visual Collages',
    description: 'Unified visual themes orchestrating wallpaper, icons, system UI, and color luminance.',
    iconName: 'Palette',
    supportsTransparency: false,
  },
  {
    id: 'system_ui',
    name: 'System UI & Widgets',
    tagline: 'Quick Settings, Volume & Status Bar',
    description: 'Visual system overlays, quick settings tiles, neon volume sliders, and clock widgets.',
    iconName: 'Sliders',
    supportsTransparency: true,
  },
  {
    id: 'keyboard',
    name: 'Keyboard Themes',
    tagline: 'Tactile Themes & InputMethodService',
    description: 'Privacy-first tactile IME themes and dynamic ripple/elevation response animations.',
    iconName: 'Keyboard',
    supportsTransparency: false,
  },
  {
    id: 'keyboard_background',
    name: 'Keyboard Wallpapers',
    tagline: 'Custom Background Media for IME',
    description: 'Uploaded visual images, video loops, and textures rendering beneath keycaps.',
    iconName: 'Image',
    supportsTransparency: false,
  },
  {
    id: 'individual_icon',
    name: 'Individual Icons',
    tagline: 'Target App Icon Overrides',
    description: 'Granular single-app replacement glyphs for installed genuine applications.',
    iconName: 'Shapes',
    supportsTransparency: true,
  },
  {
    id: 'camera',
    name: 'Camera',
    tagline: 'Computational Software Profiles',
    description: 'Software-level dynamic range curves and neutral color tone mapping for device camera.',
    iconName: 'Camera',
    supportsTransparency: false,
  },
  {
    id: 'assist',
    name: 'ONEVA Assist / Jarvis',
    tagline: 'On-Device Assistant & Live Wallpaper',
    description: 'Private wake personas with lightweight reactive live wallpaper foundation.',
    iconName: 'Cpu',
    supportsTransparency: true,
  },
];

const STORAGE_ASSETS_KEY = 'oneva_admin_assets_v5';
const STORAGE_DEFAULTS_KEY = 'oneva_category_defaults_v5';
const STORAGE_DELETED_KEY = 'oneva_deleted_asset_ids_v1';

const SEED_ASSETS: OnevaAsset[] = [
  // --- ICON PACKS ---
  {
    id: 'pack_cyberpunk_phosphor',
    name: 'Cyberpunk Phosphor Glyph Pack',
    category: 'icon_pack',
    description: 'Electroluminescent cyan and magenta laser outlines with obsidian backing. Optimized for high refresh OLED screens.',
    version: '3.0.0',
    status: 'published',
    isDefault: false,
    rating: 10, // ★ 10 Editor's Pick
    createdAt: '2026-03-03T10:00:00Z',
    updatedAt: '2026-03-03T10:00:00Z',
    author: 'ONEVA Studio',
    previewData: {
      color: '#06b6d4',
      glyphCount: 1420,
      sampleIcons: [
        { name: 'YouTube', label: 'YT', bg: '#ef4444', fg: '#ffffff', iconName: 'Youtube' },
        { name: 'WhatsApp', label: 'WA', bg: '#22c55e', fg: '#ffffff', iconName: 'MessageCircle' },
        { name: 'Instagram', label: 'IG', bg: '#e1306c', fg: '#ffffff', iconName: 'Camera' },
        { name: 'Chrome', label: 'CR', bg: '#3b82f6', fg: '#ffffff', iconName: 'Compass' },
        { name: 'Maps', label: 'MP', bg: '#10b981', fg: '#ffffff', iconName: 'MapPin' },
        { name: 'Drive', label: 'DR', bg: '#f59e0b', fg: '#ffffff', iconName: 'HardDrive' },
        { name: 'Phone', label: 'PH', bg: '#06b6d4', fg: '#ffffff', iconName: 'Phone' },
        { name: 'Camera', label: 'CA', bg: '#8b5cf6', fg: '#ffffff', iconName: 'Aperture' },
        { name: 'Gallery', label: 'GL', bg: '#ec4899', fg: '#ffffff', iconName: 'Image' },
      ],
    },
    payload: { packId: 'pack_cyberpunk_phosphor', style: 'neo_phosphor', iconCount: 1420 },
  },
  {
    id: 'pack_solar_titanium',
    name: 'Solar Titanium Brushed Suite',
    category: 'icon_pack',
    description: 'Champagne gold and brushed titanium vector glyphs with luxury matte chamfers.',
    version: '2.1.0',
    status: 'published',
    isDefault: false,
    rating: 9, // ★ 9
    createdAt: '2026-03-02T15:00:00Z',
    updatedAt: '2026-03-02T15:00:00Z',
    author: 'ONEVA Titanium Lab',
    previewData: {
      color: '#eab308',
      glyphCount: 1150,
      sampleIcons: [
        { name: 'YouTube', label: 'YT', bg: '#ca8a04', fg: '#ffffff', iconName: 'Youtube' },
        { name: 'WhatsApp', label: 'WA', bg: '#15803d', fg: '#ffffff', iconName: 'MessageCircle' },
        { name: 'Instagram', label: 'IG', bg: '#b91c1c', fg: '#ffffff', iconName: 'Camera' },
        { name: 'Chrome', label: 'CR', bg: '#1d4ed8', fg: '#ffffff', iconName: 'Compass' },
        { name: 'Maps', label: 'MP', bg: '#047857', fg: '#ffffff', iconName: 'MapPin' },
        { name: 'Drive', label: 'DR', bg: '#d97706', fg: '#ffffff', iconName: 'HardDrive' },
        { name: 'Phone', label: 'PH', bg: '#0891b2', fg: '#ffffff', iconName: 'Phone' },
        { name: 'Camera', label: 'CA', bg: '#6d28d9', fg: '#ffffff', iconName: 'Aperture' },
        { name: 'Gallery', label: 'GL', bg: '#be185d', fg: '#ffffff', iconName: 'Image' },
      ],
    },
    payload: { packId: 'pack_solar_titanium', style: 'vector_outline', iconCount: 1150 },
  },
  {
    id: 'pack-b',
    name: 'Neon Light Icon Pack',
    category: 'icon_pack',
    description: 'Futuristic electroluminescent cyan & violet glyphs with ambient light contours and 56 genuine app matches.',
    version: '2.5.0',
    status: 'published',
    isDefault: true, // ⭐ DEFAULT
    rating: 9,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA Studio',
    previewData: {
      color: '#06b6d4',
      glyphCount: 1250,
      sampleIcons: [
        { name: 'YouTube', label: 'YT', bg: '#ef4444', fg: '#ffffff', iconName: 'Youtube' },
        { name: 'WhatsApp', label: 'WA', bg: '#25d366', fg: '#ffffff', iconName: 'MessageCircle' },
        { name: 'Instagram', label: 'IG', bg: '#e1306c', fg: '#ffffff', iconName: 'Camera' },
        { name: 'Chrome', label: 'CR', bg: '#4285f4', fg: '#ffffff', iconName: 'Compass' },
        { name: 'Maps', label: 'MP', bg: '#34a853', fg: '#ffffff', iconName: 'MapPin' },
        { name: 'Drive', label: 'DR', bg: '#fbbc05', fg: '#ffffff', iconName: 'HardDrive' },
        { name: 'Phone', label: 'PH', bg: '#06b6d4', fg: '#ffffff', iconName: 'Phone' },
        { name: 'Camera', label: 'CA', bg: '#8b5cf6', fg: '#ffffff', iconName: 'Aperture' },
        { name: 'Gallery', label: 'GL', bg: '#ec4899', fg: '#ffffff', iconName: 'Image' },
      ],
    },
    payload: { packId: 'pack_neon_light', style: 'neo_phosphor', iconCount: 1250 },
  },
  {
    id: 'pack-a',
    name: 'Neo-Phosphor Amber Icons',
    category: 'icon_pack',
    description: 'Futuristic electroluminescent vector outlines with warm phosphor amber illumination.',
    version: '1.4.0',
    status: 'published',
    isDefault: false,
    rating: 8,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'Community Verified',
    previewData: {
      color: '#f59e0b',
      glyphCount: 850,
      sampleIcons: [
        { name: 'YouTube', label: 'YT', bg: '#ef4444', fg: '#fef2f2', iconName: 'Youtube' },
        { name: 'WhatsApp', label: 'WA', bg: '#22c55e', fg: '#f0fdf4', iconName: 'MessageCircle' },
        { name: 'Instagram', label: 'IG', bg: '#ec4899', fg: '#fdf2f8', iconName: 'Camera' },
        { name: 'Chrome', label: 'CR', bg: '#3b82f6', fg: '#eff6ff', iconName: 'Compass' },
        { name: 'Maps', label: 'MP', bg: '#10b981', fg: '#ecfdf5', iconName: 'MapPin' },
        { name: 'Drive', label: 'DR', bg: '#f59e0b', fg: '#fffbeb', iconName: 'HardDrive' },
        { name: 'Phone', label: 'PH', bg: '#06b6d4', fg: '#ecfeff', iconName: 'Phone' },
        { name: 'Camera', label: 'CA', bg: '#6366f1', fg: '#eef2ff', iconName: 'Aperture' },
        { name: 'Gallery', label: 'GL', bg: '#a855f7', fg: '#faf5ff', iconName: 'Image' },
      ],
    },
    payload: { packId: 'neo-phosphor', style: 'neo_phosphor', iconCount: 850 },
  },
  {
    id: 'pack-c',
    name: 'OLED Pure Line Art',
    category: 'icon_pack',
    description: 'Ultra-thin razor white strokes on obsidian dark foundations.',
    version: '1.8.2',
    status: 'published',
    isDefault: false,
    rating: 8,
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z',
    author: 'ONEVA Core',
    previewData: {
      color: '#ffffff',
      glyphCount: 980,
      sampleIcons: [
        { name: 'YouTube', label: 'YT', bg: '#18181b', fg: '#ffffff', iconName: 'Youtube' },
        { name: 'WhatsApp', label: 'WA', bg: '#18181b', fg: '#ffffff', iconName: 'MessageCircle' },
        { name: 'Instagram', label: 'IG', bg: '#18181b', fg: '#ffffff', iconName: 'Camera' },
        { name: 'Chrome', label: 'CR', bg: '#18181b', fg: '#ffffff', iconName: 'Compass' },
        { name: 'Maps', label: 'MP', bg: '#18181b', fg: '#ffffff', iconName: 'MapPin' },
        { name: 'Drive', label: 'DR', bg: '#18181b', fg: '#ffffff', iconName: 'HardDrive' },
        { name: 'Phone', label: 'PH', bg: '#18181b', fg: '#ffffff', iconName: 'Phone' },
        { name: 'Camera', label: 'CA', bg: '#18181b', fg: '#ffffff', iconName: 'Aperture' },
        { name: 'Gallery', label: 'GL', bg: '#18181b', fg: '#ffffff', iconName: 'Image' },
      ],
    },
    payload: { packId: 'oled-line-art', style: 'oled_glyph', iconCount: 980 },
  },

  // --- LIVE WALLPAPERS ---
  {
    id: 'live-wp-changeable',
    name: 'Dynamic Cybernetic Live Wallpaper',
    category: 'live_wallpaper',
    description: 'Autonomous cybernetic dynamic live wallpaper with fluid optical streams (Changeable_wallpaper.mp4).',
    version: '1.0.0',
    status: 'published',
    isDefault: true,
    rating: 10,
    isLiveWallpaper: true,
    liveWallpaperStyle: 'cyber_grid',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA Studio',
    previewData: {
      color: '#00f0ff',
      mediaType: 'video',
      previewVideoUrl: '/assets/jarvis/Changeable_wallpaper.mp4',
      previewUrl: '/assets/jarvis/Changeable_wallpaper.mp4',
      cssBackground: 'linear-gradient(180deg, #020617 0%, #0b1528 50%, #000000 100%)',
    },
    integrationRequirements: {
      statusDescription: 'Requires Android WallpaperService component com.oneva.launcher.wallpaper.OnevaLiveWallpaperService.',
    },
    payload: {
      presetId: 'changeable-wallpaper',
      wallpaperUrl: '/assets/jarvis/Changeable_wallpaper.mp4',
      mediaType: 'wallpaper_live',
      fps: 60,
    },
  },
  {
    id: 'live-wp-a',
    name: 'Jarvis Reactive Particle Canvas',
    category: 'live_wallpaper',
    description: 'Kinetic 60FPS reactive live wallpaper with circular HUD physics responding to touch and gyroscope.',
    version: '1.0.0',
    status: 'published',
    isDefault: false,
    rating: 10,
    isLiveWallpaper: true,
    liveWallpaperStyle: 'jarvis_reactive',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA AI Lab',
    previewData: {
      color: '#06b6d4',
      mediaType: 'video',
      previewVideoUrl: '/assets/jarvis/Awake_jarvis_normal_state.mp4',
      previewUrl: '/assets/jarvis/Awake_jarvis_normal_state.mp4',
      cssBackground: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.25) 0%, #030712 90%)',
    },
    integrationRequirements: {
      statusDescription: 'Requires Android WallpaperService component com.oneva.launcher.wallpaper.OnevaLiveWallpaperService.',
    },
    payload: {
      style: 'jarvis_reactive',
      wallpaperUrl: '/assets/jarvis/Awake_jarvis_normal_state.mp4',
      mediaType: 'wallpaper_live',
      fps: 60,
      particleCount: 120,
    },
  },
  {
    id: 'live-wp-b',
    name: 'Cyber Grid Kinetic Matrix',
    category: 'live_wallpaper',
    description: 'Infinite perspective grid with phosphor light pulses calibrated for 120Hz OLED displays.',
    version: '1.1.0',
    status: 'published',
    isDefault: false,
    rating: 9,
    isLiveWallpaper: true,
    liveWallpaperStyle: 'cyber_grid',
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z',
    author: 'ONEVA Graphics',
    previewData: {
      color: '#10b981',
      mediaType: 'video',
      previewVideoUrl: '/assets/jarvis/Changeable_wallpaper.mp4',
      previewUrl: '/assets/jarvis/Changeable_wallpaper.mp4',
      cssBackground: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.2) 0%, #020617 95%)',
    },
    integrationRequirements: {
      statusDescription: 'Requires Android WallpaperService component.',
    },
    payload: {
      style: 'cyber_grid',
      wallpaperUrl: '/assets/jarvis/Changeable_wallpaper.mp4',
      mediaType: 'wallpaper_live',
      fps: 60,
    },
  },

  // --- SYSTEM UI & WIDGETS ---
  {
    id: 'sys-ui-a',
    name: 'Cyber Pill System UI & Quick Settings',
    category: 'system_ui',
    description: 'Squircle glowing quick setting tiles, neon brightness slider, and 5G contour status bar.',
    version: '1.2.0',
    status: 'published',
    isDefault: true,
    rating: 9,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA System Lab',
    previewData: {
      color: '#06b6d4',
      systemUiComponent: 'quick_settings',
    },
    payload: {
      tileShape: 'squircle',
      activeColor: '#06b6d4',
      volumeSlider: 'neon_slider',
      statusBarStyle: 'cyber',
    },
  },
  {
    id: 'sys-ui-b',
    name: 'OLED Monolith Minimalist System UI',
    category: 'system_ui',
    description: 'Pure pitch-black (#000000) quick settings with razor thin outlines and high-contrast volume bars.',
    version: '1.0.0',
    status: 'published',
    isDefault: false,
    rating: 8,
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z',
    author: 'ONEVA Core',
    previewData: {
      color: '#ffffff',
      systemUiComponent: 'volume_panel',
    },
    payload: {
      tileShape: 'rounded',
      activeColor: '#ffffff',
      volumeSlider: 'compact',
      statusBarStyle: 'minimal',
    },
  },

  // --- KEYBOARD WALLPAPERS & BACKGROUNDS ---
  {
    id: 'kb-bg-a',
    name: 'Deep Space Nebula Keyboard Wallpaper',
    category: 'keyboard_background',
    description: 'Luminous deep indigo and cyan nebula background rendering under tactile translucent keycaps.',
    version: '1.0.0',
    status: 'published',
    isDefault: true,
    rating: 9,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA IME Lab',
    previewData: {
      color: '#38bdf8',
      boardBg: '#090d16',
      keyBg: 'rgba(255, 255, 255, 0.08)',
      textColor: '#ffffff',
      cssBackground: 'linear-gradient(135deg, #0c1527 0%, #1e1b4b 60%, #030712 100%)',
    },
    integrationRequirements: {
      statusDescription: 'Applied directly to Android InputMethodService key window.',
    },
    payload: { bgType: 'gradient', opacity: 0.85, blur: 12 },
  },
  {
    id: 'kb-bg-b',
    name: 'Carbon Tactical Matrix Skin',
    category: 'keyboard_background',
    description: 'Precision carbon-weave honeycomb lattice with emerald keycap edge lighting.',
    version: '1.1.0',
    status: 'published',
    isDefault: false,
    rating: 8,
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z',
    author: 'ONEVA Tactical',
    previewData: {
      color: '#10b981',
      boardBg: '#050a08',
      keyBg: '#0f1712',
      textColor: '#e6f7ef',
      cssBackground: 'radial-gradient(circle at 50% 50%, #0f241a 0%, #050a08 100%)',
    },
    integrationRequirements: {
      statusDescription: 'Applied directly to Android InputMethodService key window.',
    },
    payload: { bgType: 'matrix', opacity: 0.9, blur: 0 },
  },

  // --- INDIVIDUAL ICONS ---
  {
    id: 'icon-a',
    name: 'Icon A: WhatsApp Phosphor Glyph',
    category: 'individual_icon',
    description: 'Custom emerald curved vector mask tailored for genuine WhatsApp messaging.',
    version: '1.0.0',
    status: 'published',
    isDefault: true, // ⭐ DEFAULT
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA Design Lab',
    previewData: { color: '#25d366' },
    payload: { targetPackage: 'com.whatsapp', glyph: 'message-circle' },
  },
  {
    id: 'icon-b',
    name: 'Icon B: YouTube Carmine Minimal',
    category: 'individual_icon',
    description: 'Clean monochrome outline for genuine YouTube streaming.',
    version: '1.0.0',
    status: 'published',
    isDefault: false,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA Design Lab',
    previewData: { color: '#ef4444' },
    payload: { targetPackage: 'com.google.android.youtube', glyph: 'play' },
  },

  // --- KEYBOARD ---
  {
    id: 'kb-a',
    name: 'Keyboard Animation A: OLED Tactile Elevation',
    category: 'keyboard',
    description: 'Tactile micro-elevation with deep OLED obsidian keycaps and instant key recovery.',
    version: '2.0.0',
    status: 'published',
    isDefault: true, // ⭐ DEFAULT
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA IME Lab',
    previewData: {
      boardBg: '#000000',
      keyBg: '#121215',
      textColor: '#ffffff',
      color: '#10b981',
    },
    payload: { themeId: 'oled-mono', animationType: 'elevation' },
  },
  {
    id: 'kb-b',
    name: 'Keyboard Animation B: Neon Glow Ripple',
    category: 'keyboard',
    description: 'Soft phosphorescent ripple radiating outward from pressed keycaps.',
    version: '1.3.0',
    status: 'published',
    isDefault: false,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA IME Lab',
    previewData: {
      boardBg: '#090d0b',
      keyBg: '#131c17',
      textColor: '#e6f7ef',
      color: '#10b981',
    },
    payload: { themeId: 'emerald-tactical', animationType: 'ripple' },
  },
  {
    id: 'kb-c',
    name: 'Keyboard Animation C: Minimalist Click Track',
    category: 'keyboard',
    description: 'Instant zero-delay alpha toggle without spatial movement for high-speed typists.',
    version: '1.1.0',
    status: 'published',
    isDefault: false,
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z',
    author: 'Community Verified',
    previewData: {
      boardBg: '#121316',
      keyBg: '#1e2025',
      textColor: '#f8fafc',
      color: '#94a3b8',
    },
    payload: { themeId: 'titanium-dark', animationType: 'minimal_press' },
  },

  // --- WALLPAPERS ---
  {
    id: 'wp-a',
    name: 'Wallpaper A: Deep Onyx Minimal',
    category: 'wallpaper',
    description: 'Vertical luminance gradient from true black to subtle carbon neutral.',
    version: '1.0.0',
    status: 'published',
    isDefault: false,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA Art',
    previewData: {
      cssBackground: 'linear-gradient(180deg, #09090b 0%, #0c0d12 50%, #070709 100%)',
      color: '#09090b',
    },
    payload: { presetId: 'deep-onyx' },
  },
  {
    id: 'wp-b',
    name: 'Wallpaper B: Emerald Aurora OLED',
    category: 'wallpaper',
    description: 'Subtle emissive emerald corona in the top quadrant fading to #000000.',
    version: '2.0.0',
    status: 'published',
    isDefault: true, // ⭐ DEFAULT
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA Core',
    previewData: {
      cssBackground: 'radial-gradient(circle at 80% 10%, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.25) 45%, #050a08 100%)',
      color: '#10b981',
    },
    payload: { presetId: 'emerald-aurora' },
  },
  {
    id: 'wp-c',
    name: 'Wallpaper C: Midnight Slate Radial',
    category: 'wallpaper',
    description: 'Radial cobalt slate taper engineered for low specular reflection in sunlight.',
    version: '1.2.0',
    status: 'published',
    isDefault: false,
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z',
    author: 'ONEVA Art',
    previewData: {
      cssBackground: 'linear-gradient(160deg, #0f172a 0%, #090d16 60%, #030508 100%)',
      color: '#818cf8',
    },
    payload: { presetId: 'midnight-slate' },
  },

  // --- CAMERA ---
  {
    id: 'cam-a',
    name: 'Profile A: HDR Linear Curve',
    category: 'camera',
    description: 'Software tonemapping emphasizing shadow detail retrieval in harsh sunlight.',
    version: '1.0.0',
    status: 'published',
    isDefault: false,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA Vision Core',
    previewData: { profileType: 'hdr_linear' },
    payload: { dynamicRange: 'wide', noiseReduction: 'medium', toneCurve: 'linear_shadow_lift' },
  },
  {
    id: 'cam-b',
    name: 'Profile B: Low-Light Neutral OLED Color Match',
    category: 'camera',
    description: 'Color temperature harmonized for OLED panels with zero false sharpening artifacts.',
    version: '2.0.0',
    status: 'published',
    isDefault: true, // ⭐ DEFAULT
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA Core',
    previewData: { profileType: 'oled_neutral' },
    payload: { dynamicRange: 'balanced', noiseReduction: 'high_frequency', colorTempK: 6500 },
  },
  {
    id: 'cam-c',
    name: 'Profile C: Shutter Velocity Latency Reduction',
    category: 'camera',
    description: 'Prioritizes immediate zero-lag shutter capture for high-speed subject tracking.',
    version: '1.2.0',
    status: 'published',
    isDefault: false,
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z',
    author: 'ONEVA Vision Core',
    previewData: { profileType: 'low_latency' },
    payload: { zeroShutterLag: true, exposurePriority: 'speed' },
  },

  // --- ONEVA ASSIST / JARVIS ---
  {
    id: 'jarvis-default',
    name: 'Default Jarvis Experience with Reactive Live Wallpaper',
    category: 'assist',
    description: 'Adaptive wake engine with lightweight orbital live wallpaper reacting to local commands.',
    version: '2.0.0',
    status: 'published',
    isDefault: true, // ⭐ DEFAULT
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    author: 'ONEVA Core',
    previewData: {
      color: '#38bdf8',
      secondaryColor: '#10b981',
    },
    payload: {
      assistantName: 'Jarvis',
      wakeWord: 'Hey Jarvis',
      liveWallpaperEnabled: true,
      liveWallpaperStyle: 'orbital_ring',
      contextDestructionMs: 50,
      offlineOnly: true,
    },
  },
  {
    id: 'jarvis-nova',
    name: 'Nova Context Core',
    category: 'assist',
    description: 'Minimalist wake persona with audio-only tactile confirmation.',
    version: '1.1.0',
    status: 'published',
    isDefault: false,
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z',
    author: 'ONEVA Design Lab',
    previewData: { color: '#818cf8' },
    payload: {
      assistantName: 'Nova',
      wakeWord: 'Hey Nova',
      liveWallpaperEnabled: false,
      offlineOnly: true,
    },
  },
];

export class AdminAssetService {
  private static assets: OnevaAsset[] | null = null;
  private static listeners: Set<() => void> = new Set();
  private static isSyncingWithSupabase = false;
  private static isRealtimeInitialized = false;

  /**
   * Retrieves tombstoned deleted asset IDs to prevent resurrection from seed lists.
   */
  static getDeletedAssetIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(STORAGE_DELETED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch (err) {
      console.warn('[AdminAssetService] Failed to parse deleted asset ids:', err);
    }
    return new Set();
  }

  /**
   * Permanently marks an asset ID as deleted.
   */
  static addDeletedAssetId(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getDeletedAssetIds();
      current.add(id);
      localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(Array.from(current)));
    } catch (err) {
      console.warn('[AdminAssetService] Failed to persist deleted asset id:', err);
    }
  }

  private static readonly LOCAL_ORIGIN_ID = 'local_' + Math.random().toString(36).substring(2);

  /**
   * Initializes cross-tab and remote realtime synchronization.
   */
  private static ensureRealtime(): void {
    if (this.isRealtimeInitialized || typeof window === 'undefined') return;
    this.isRealtimeInitialized = true;

    RealtimeSyncService.subscribe((event) => {
      // Ignore events dispatched by this local window to prevent cache invalidation cycles
      if (event.originId && event.originId === this.LOCAL_ORIGIN_ID) {
        return;
      }

      if (event.type === 'ASSET_DELETED') {
        if (this.assets && this.assets.some((a) => a.id === event.assetId)) {
          this.assets = this.assets.filter((a) => a.id !== event.assetId);
          this.addDeletedAssetId(event.assetId);
          this.persistLocal();
          this.notify();
        }
      } else if (
        event.type === 'ASSET_PUBLISHED' ||
        event.type === 'ASSET_UNPUBLISHED' ||
        event.type === 'ASSET_UPDATED' ||
        event.type === 'ASSET_CREATED' ||
        event.type === 'DEFAULT_CHANGED'
      ) {
        // Invalidate in-memory cache and re-read
        this.assets = null;
        this.getAssets();
        this.notify();
      }
    });
  }

  /**
   * Returns all assets from local cache, initializing with seed data if needed.
   */
  static getAssets(): OnevaAsset[] {
    this.ensureRealtime();
    if (this.assets) return this.assets;

    const deletedIds = this.getDeletedAssetIds();
    const DEMO_THEME_IDS = new Set([
      'theme-a',
      'theme-b',
      'theme-c',
      'theme_neon_dream',
      'theme_cyber_matrix',
      'theme_solar_flare',
      'theme_minimal_monochrome',
      'cloud_tokyo_drift',
      'cloud_quantum_ice',
      'cloud_deep_space',
    ]);
    const DEMO_THEME_NAMES = new Set([
      'neon dream',
      'cyber matrix',
      'solar flare',
      'minimal obsidian',
      'theme a: carbon dark neutral',
      'theme b: oled pure black',
      'theme c: obsidian nebula',
      'tokyo cyber night',
      'quantum cryo',
      'cosmic nebula',
    ]);

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_ASSETS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            let filtered: OnevaAsset[] = parsed.filter((a: OnevaAsset) => {
              if (deletedIds.has(a.id)) return false;
              if (a.category === 'theme') {
                if (DEMO_THEME_IDS.has(a.id)) return false;
                if (DEMO_THEME_NAMES.has(a.name?.trim().toLowerCase())) return false;
              }
              return true;
            });

            // Merge any new seed assets that are not tombstoned
            for (const seed of SEED_ASSETS) {
              if (!deletedIds.has(seed.id) && !filtered.some((a) => a.id === seed.id)) {
                filtered.push(seed);
              }
            }

            this.assets = filtered;
            this.ensureDefaultIntegrity();
            this.hydrateAssetsFromStorage();
            return this.assets!;
          }
        }
      } catch (err) {
        console.warn('[AdminAssetService] Failed to parse local assets:', err);
      }
    }

    // Default to seeds excluding deleted
    this.assets = SEED_ASSETS.filter((a) => !deletedIds.has(a.id));
    this.hydrateAssetsFromStorage();
    this.persistLocal();
    return this.assets;
  }

  /**
   * Retrieves a single asset by its unique ID
   */
  static getAssetById(id: string): OnevaAsset | undefined {
    return this.getAssets().find((a) => a.id === id);
  }

  private static isHydrating = false;

  /**
   * Rehydrates full media assets from IndexedDB / memory cache if localStorage only stored metadata
   */
  static hydrateAssetsFromStorage(): void {
    if (!this.assets || typeof window === 'undefined') return;

    let modified = false;
    for (const asset of this.assets) {
      const stored = AssetStorageService.getMediaSync(asset.id);
      if (stored && (stored.dataUrl || stored.thumbnailUrl)) {
        if (!asset.previewData) asset.previewData = {};
        const isVideo = stored.mediaType === 'video' || asset.isLiveWallpaper;
        const mediaSource = stored.thumbnailUrl || stored.dataUrl;
        if (!asset.previewData.previewUrl || asset.previewData.previewUrl.includes('...')) {
          asset.previewData.previewUrl = mediaSource;
          asset.previewData.previewDataUrl = stored.dataUrl;
          asset.previewData.previewThumbnailUrl = mediaSource;
          if (isVideo) asset.previewData.previewVideoUrl = stored.dataUrl;
          modified = true;
        }
      }

      const storedIcons = AssetStorageService.getIconMapSync(asset.id);
      if (storedIcons && Object.keys(storedIcons).length > 0) {
        if (!asset.assets) asset.assets = {};
        if (!asset.assets.extractedIcons || Object.keys(asset.assets.extractedIcons).length === 0) {
          asset.assets.extractedIcons = storedIcons;
          modified = true;
        }
        if (!asset.previewData) asset.previewData = {};
        if (!asset.previewData.customData) asset.previewData.customData = {};
        if (!(asset.previewData.customData as any).extractedIcons) {
          (asset.previewData.customData as any).extractedIcons = storedIcons;
          modified = true;
        }
      }
    }

    if (modified) {
      this.notify();
    }

    if (!this.isHydrating) {
      this.isHydrating = true;
      AssetStorageService.preloadAll()
        .then(() => {
          this.isHydrating = false;
          let asyncModified = false;
          if (!this.assets) return;
          for (const asset of this.assets) {
            const stored = AssetStorageService.getMediaSync(asset.id);
            if (stored && (stored.dataUrl || stored.thumbnailUrl)) {
              if (!asset.previewData) asset.previewData = {};
              const isVideo = stored.mediaType === 'video' || asset.isLiveWallpaper;
              const mediaSource = stored.thumbnailUrl || stored.dataUrl;
              if (!asset.previewData.previewUrl || asset.previewData.previewUrl.includes('...')) {
                asset.previewData.previewUrl = mediaSource;
                asset.previewData.previewDataUrl = stored.dataUrl;
                asset.previewData.previewThumbnailUrl = mediaSource;
                if (isVideo) asset.previewData.previewVideoUrl = stored.dataUrl;
                asyncModified = true;
              }
            }
          }
          if (asyncModified) {
            this.notify();
          }
        })
        .catch(() => {
          this.isHydrating = false;
        });
    }
  }

  /**
   * Enforces Rule 4: EXACTLY ONE default per category.
   * If any category has >1 or 0 defaults, corrects it.
   */
  private static ensureDefaultIntegrity(): void {
    if (!this.assets) return;

    let modified = false;
    for (const cat of ASSET_CATEGORIES) {
      const catAssets = this.assets.filter((a) => a.category === cat.id);
      const defaults = catAssets.filter((a) => a.isDefault);

      if (defaults.length > 1) {
        // Keep only the first one
        let keptFirst = false;
        for (const a of catAssets) {
          if (a.isDefault) {
            if (!keptFirst) {
              keptFirst = true;
            } else {
              a.isDefault = false;
              modified = true;
            }
          }
        }
      } else if (defaults.length === 0 && catAssets.length > 0) {
        // Pick the first published one as fallback default
        const firstPublished = catAssets.find((a) => a.status === 'published') || catAssets[0];
        firstPublished.isDefault = true;
        modified = true;
      }
    }

    if (modified) {
      this.persistLocal();
    }
  }

  /**
   * Retrieves assets for a specific category.
   */
  static getAssetsByCategory(category: OnevaAssetCategory, includeUnpublished = false): OnevaAsset[] {
    const all = this.getAssets();
    return all.filter((a) => {
      const match =
        a.category === category ||
        (category === 'wallpaper' && (a.category === 'live_wallpaper' || a.isLiveWallpaper));
      if (!match) return false;
      if (!includeUnpublished && a.status !== 'published') return false;
      return true;
    });
  }

  /**
   * Retrieves published assets for a specific category (alias for getAssetsByCategory).
   */
  static getPublishedAssets(category: OnevaAssetCategory): OnevaAsset[] {
    return this.getAssetsByCategory(category, false);
  }

  /**
   * Retrieves the current single ⭐ Default asset for a category.
   */
  static getDefaultAsset(category: OnevaAssetCategory): OnevaAsset | null {
    const all = this.getAssets();
    return all.find((a) => a.category === category && a.isDefault) || null;
  }

  /**
   * Retrieves the current defaults across ALL supported categories.
   */
  static getAllDefaults(): Record<OnevaAssetCategory, OnevaAsset | null> {
    const result = {} as Record<OnevaAssetCategory, OnevaAsset | null>;
    for (const cat of ASSET_CATEGORIES) {
      result[cat.id] = this.getDefaultAsset(cat.id);
    }
    return result;
  }

  /**
   * CRITICAL STAR ENFORCEMENT:
   * Sets the given asset as the default for its category.
   * AUTOMATICALLY unsets the previous default in the same category!
   * Guarantees that only ONE active default exists per section.
   */
  static async setDefaultAsset(category: OnevaAssetCategory, targetAssetId: string): Promise<{ success: boolean; replacedAssetId?: string; error?: string }> {
    const all = this.getAssets();
    const target = all.find((a) => a.id === targetAssetId);

    if (!target) {
      return { success: false, error: `Asset ${targetAssetId} not found.` };
    }

    if (target.category !== category) {
      return { success: false, error: `Asset belongs to category ${target.category}, not ${category}.` };
    }

    // If the admin marks an asset as default, automatically ensure it is published
    // so administrators are never blocked by status checks.
    const shouldPromote = target.status !== 'published';

    let previousDefaultId: string | undefined;

    // Mutate state atomically: remove previous default, set new default
    const updated = all.map((asset) => {
      if (asset.category === category) {
        if (asset.isDefault && asset.id !== targetAssetId) {
          previousDefaultId = asset.id;
        }
        const isTarget = asset.id === targetAssetId;
        return {
          ...asset,
          status: isTarget && shouldPromote ? ('published' as const) : asset.status,
          isDefault: isTarget,
          updatedAt: new Date().toISOString(),
        };
      }
      return asset;
    });

    this.assets = updated;
    this.persistLocal();
    this.notify();

    // Broadcast realtime event
    RealtimeSyncService.broadcast('DEFAULT_CHANGED', targetAssetId, category, undefined, this.LOCAL_ORIGIN_ID);

    // Async sync to Supabase if configured (Rule 5: Authoritative default stored in Supabase)
    this.syncDefaultToSupabase(category, targetAssetId, target.name).catch((err) => {
      console.warn('[AdminAssetService] Supabase async sync note:', err);
    });

    return {
      success: true,
      replacedAssetId: previousDefaultId,
    };
  }

  /**
   * Creates or registers a new asset in the system.
   */
  static async createAsset(asset: Omit<OnevaAsset, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>): Promise<OnevaAsset> {
    const all = this.getAssets();
    const newId = `${asset.category}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const previewData = asset.previewData ? {
      ...asset.previewData,
      previewThumbnailUrl:
        asset.previewData.previewThumbnailUrl ||
        asset.previewData.previewUrl ||
        asset.previewData.previewDataUrl,
    } : undefined;

    const newAsset: OnevaAsset = {
      ...asset,
      previewData,
      status: asset.status || 'draft', // Default to draft for lifecycle safety
      id: newId,
      isDefault: false, // Never default on initial creation until explicitly starred
      createdAt: now,
      updatedAt: now,
    };

    // Save extracted icons if present to IndexedDB storage
    const extractedIcons =
      newAsset.assets?.extractedIcons ||
      (newAsset.previewData?.customData as any)?.extractedIcons ||
      (newAsset.payload as any)?.extractedIcons;
    if (extractedIcons && Object.keys(extractedIcons).length > 0) {
      AssetStorageService.saveIconMap(newAsset.id, extractedIcons).catch(() => {});
    }

    this.assets = [newAsset, ...all];
    this.persistLocal();
    this.notify();

    // Broadcast realtime event
    RealtimeSyncService.broadcast('ASSET_CREATED', newAsset.id, newAsset.category, newAsset, this.LOCAL_ORIGIN_ID);

    // Sync to Supabase if available
    this.syncAssetToSupabase(newAsset).catch((err) => {
      console.warn('[AdminAssetService] Supabase create sync notice:', err);
    });

    return newAsset;
  }

  /**
   * Updates an existing asset with new metadata, payload, version, or status.
   */
  static async updateAsset(
    assetId: string,
    updates: Partial<Omit<OnevaAsset, 'id' | 'createdAt'>>
  ): Promise<{ success: boolean; asset?: OnevaAsset; error?: string }> {
    const all = this.getAssets();
    const targetIndex = all.findIndex((a) => a.id === assetId);
    if (targetIndex === -1) {
      return { success: false, error: `Asset "${assetId}" not found.` };
    }

    const current = all[targetIndex];
    let isDefault = current.isDefault;

    // If changing to draft or disabled while it is default, un-default it
    if (updates.status && updates.status !== 'published' && isDefault) {
      isDefault = false;
    }

    const updated: OnevaAsset = {
      ...current,
      ...updates,
      id: current.id,
      category: current.category,
      isDefault,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...all];
    updatedList[targetIndex] = updated;
    this.assets = updatedList;

    // Save extracted icons if updated
    const extractedIcons =
      updated.assets?.extractedIcons ||
      (updated.previewData?.customData as any)?.extractedIcons ||
      (updated.payload as any)?.extractedIcons;
    if (extractedIcons && Object.keys(extractedIcons).length > 0) {
      AssetStorageService.saveIconMap(updated.id, extractedIcons).catch(() => {});
    }

    this.ensureDefaultIntegrity();
    this.persistLocal();
    this.notify();

    // Invalidate client cache across all tiers for this asset
    AssetCacheService.invalidateAsset(updated.id).catch(() => {});

    // Broadcast realtime event
    RealtimeSyncService.broadcast('ASSET_UPDATED', updated.id, updated.category, updated, this.LOCAL_ORIGIN_ID);

    this.syncAssetToSupabase(updated).catch((err) => {
      console.warn('[AdminAssetService] Supabase update sync notice:', err);
    });

    return { success: true, asset: updated };
  }

  /**
   * Registers or updates an Icon Pack asset from a validated ZIP structure.
   */
  static async registerValidatedIconPack(
    manifest: any,
    validationResult: any,
    options: {
      fileName?: string;
      status?: 'published' | 'draft';
      isDefault?: boolean;
    } = {}
  ): Promise<{ success: boolean; asset?: OnevaAsset; error?: string }> {
    if (!validationResult.isValid || !manifest) {
      return { success: false, error: 'Cannot register an invalid or corrupt icon pack.' };
    }

    const existing = this.getAssets().find(
      (a) => a.category === 'icon_pack' && (a.id === manifest.packId || a.name === manifest.name)
    );

    const assetData: Omit<OnevaAsset, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'> = {
      name: manifest.name,
      category: 'icon_pack',
      description: manifest.description || `Verified ZIP pack containing ${validationResult.iconCount} application glyphs.`,
      version: manifest.version,
      status: options.status || 'published',
      author: manifest.author || 'ONEVA Verified Publisher',
      previewData: {
        color: '#a855f7',
        glyphCount: validationResult.iconCount,
        previewDataUrl: validationResult.previewDataUrl,
        previewThumbnailUrl: validationResult.previewDataUrl,
        sampleIcons: validationResult.sampleIcons,
      },
      assets: {
        zipFileName: options.fileName || `${manifest.packId}.zip`,
        manifest: manifest,
        extractedIcons: validationResult.extractedIcons,
      },
      integrationRequirements: {
        requiresLauncherRole: true,
        statusDescription: 'Runs on ONEVA Launcher surface. Real system-wide launcher replacement requires default home permission.',
      },
      payload: {
        packId: manifest.packId,
        iconCount: validationResult.iconCount,
        verifiedPackages: validationResult.verifiedPackages,
        manifestIcons: manifest.icons,
      },
    };

    let targetAsset: OnevaAsset;
    if (existing) {
      const res = await this.updateAsset(existing.id, assetData);
      if (!res.success || !res.asset) return res;
      targetAsset = res.asset;
    } else {
      const created = await this.createAsset(assetData);
      if (options.isDefault) {
        await this.setDefaultAsset('icon_pack', created.id);
      }
      targetAsset = created;
    }

    // Preserve original ZIP safely in remote storage & local IndexedDB
    const originalFile = (options as any).file || validationResult.originalFile;
    if (originalFile && targetAsset) {
      ScalableStorageService.uploadAssetMedia({
        assetId: targetAsset.id,
        category: 'icon_pack',
        fileName: options.fileName || `${manifest.packId}.zip`,
        file: originalFile,
        previewBlob: validationResult.previewDataUrl,
        thumbnailBlob: validationResult.previewDataUrl,
      }).then((uploadRes) => {
        if (uploadRes.success) {
          this.updateAsset(targetAsset.id, {
            storagePaths: uploadRes.storagePaths,
            mediaUrls: uploadRes.mediaUrls,
          });
        }
      }).catch((e) => console.warn('[AdminAssetService] ScalableStorage upload notice:', e));
    }

    return { success: true, asset: targetAsset };
  }

  /**
   * Registers or updates a validated Theme ZIP bundle
   */
  static async registerValidatedTheme(
    themeDefinition: any,
    validationResult: {
      wallpaperDataUrl?: string;
      wallpaperType?: 'image' | 'video';
      isLiveWallpaper?: boolean;
      previewDataUrl?: string;
      previews?: string[];
      iconPackResult?: any;
      iconPackManifest?: any;
      extractedIcons?: Record<string, string>;
      zipSize?: number;
    },
    options: {
      fileName?: string;
      status?: 'draft' | 'testing' | 'verified' | 'published';
      isDefault?: boolean;
    } = {}
  ): Promise<{ success: boolean; asset?: OnevaAsset; error?: string }> {
    const isVideo = validationResult.wallpaperType === 'video' || validationResult.isLiveWallpaper;

    // 1. Standalone Wallpaper registration (Rule 11: Standalone reusability)
    let standaloneWallpaperId = themeDefinition.wallpaperId;
    if (validationResult.wallpaperDataUrl && !standaloneWallpaperId) {
      try {
        const wpCategory = isVideo ? 'live_wallpaper' : 'wallpaper';
        const existingWp = this.getAssets().find(
          (a) =>
            (a.category === 'wallpaper' || a.category === 'live_wallpaper') &&
            a.name === `${themeDefinition.name} Wallpaper`
        );
        if (existingWp) {
          standaloneWallpaperId = existingWp.id;
        } else {
          const wpAsset = await this.createAsset({
            name: `${themeDefinition.name} Wallpaper`,
            category: wpCategory,
            description: `OLED wallpaper asset coordinated with ${themeDefinition.name} theme.`,
            version: '1.0.0',
            status: options.status === 'published' ? 'published' : 'draft',
            author: themeDefinition.author || 'ONEVA Designer',
            rating: themeDefinition.rating || 9,
            isLiveWallpaper: isVideo,
            previewData: {
              color: themeDefinition.colors?.accent || '#06b6d4',
              previewUrl: validationResult.wallpaperDataUrl,
              previewDataUrl: validationResult.wallpaperDataUrl,
              previewThumbnailUrl: validationResult.wallpaperDataUrl,
              previewVideoUrl: isVideo ? validationResult.wallpaperDataUrl : undefined,
              mediaType: isVideo ? 'video' : 'image',
            },
            payload: {
              custom: true,
              wallpaperUrl: validationResult.wallpaperDataUrl,
              mediaType: isVideo ? 'wallpaper_live' : 'wallpaper_static',
            },
          });
          standaloneWallpaperId = wpAsset.id;
          await AssetStorageService.saveMedia(
            wpAsset.id,
            new Blob([validationResult.wallpaperDataUrl], {
              type: isVideo ? 'video/mp4' : 'image/png',
            }),
            {
              dataUrl: validationResult.wallpaperDataUrl,
              customName: wpAsset.name,
            }
          ).catch(() => {});
        }
      } catch (err) {
        console.warn('[AdminAssetService] Standalone wallpaper creation notice:', err);
      }
    }

    // 2. Standalone Icon Pack registration (Rule 11: Standalone reusability)
    let standaloneIconPackId = themeDefinition.iconPackId;
    if (validationResult.iconPackResult?.isValid && validationResult.iconPackManifest && !standaloneIconPackId) {
      try {
        const existingPack = this.getAssets().find(
          (a) => a.category === 'icon_pack' && a.name === validationResult.iconPackManifest.name
        );
        if (existingPack) {
          standaloneIconPackId = existingPack.id;
        } else {
          const packRes = await this.registerValidatedIconPack(
            validationResult.iconPackManifest,
            validationResult.iconPackResult,
            {
              status: options.status === 'published' ? 'published' : 'draft',
              fileName: `${themeDefinition.name.replace(/\s+/g, '_').toLowerCase()}_icons.zip`,
              file: (validationResult as any).iconPackFile || validationResult.iconPackResult?.originalFile,
            } as any
          );
          if (packRes.success && packRes.asset) {
            standaloneIconPackId = packRes.asset.id;
          }
        }
      } catch (err) {
        console.warn('[AdminAssetService] Standalone icon pack creation notice:', err);
      }
    }

    // Link component IDs
    themeDefinition.wallpaperId = standaloneWallpaperId || themeDefinition.wallpaperId;
    themeDefinition.iconPackId = standaloneIconPackId || themeDefinition.iconPackId;

    // Curate preview icons (limit to max 56 key apps) to prevent memory crashes & storage quota exceptions
    const rawExtracted = validationResult.extractedIcons || {};
    const previewIconsSubset: Record<string, string> = {};
    const iconKeys = Object.keys(rawExtracted);
    for (let i = 0; i < Math.min(iconKeys.length, 56); i++) {
      const k = iconKeys[i];
      previewIconsSubset[k] = rawExtracted[k];
    }

    const existing = this.getAssets().find(
      (a) => a.category === 'theme' && a.name === themeDefinition.name
    );

    const assetData: Omit<OnevaAsset, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'> = {
      name: themeDefinition.name,
      category: 'theme',
      description:
        themeDefinition.description ||
        `OLED-ready unified theme bundle with ${
          themeDefinition.appearance?.luminance || 'pure black'
        } luminance and coordinated system styling.`,
      version: themeDefinition.version || '1.0.0',
      status: options.status || 'draft', // Rule 13: Initial state is draft (NOT PUBLISHED YET)
      author: themeDefinition.author || 'ONEVA Verified Designer',
      rating: themeDefinition.rating || 10,
      isLiveWallpaper: isVideo,
      previewData: {
        color: themeDefinition.colors?.accent || '#06b6d4',
        secondaryColor: themeDefinition.colors?.surface || '#0c1322',
        previewDataUrl: validationResult.previewDataUrl || validationResult.wallpaperDataUrl,
        previewUrl: validationResult.wallpaperDataUrl || validationResult.previewDataUrl,
        previewThumbnailUrl: validationResult.previewDataUrl || validationResult.wallpaperDataUrl,
        previewVideoUrl: isVideo ? validationResult.wallpaperDataUrl : undefined,
        mediaType: isVideo ? 'video' : 'image',
        customData: {
          extractedIcons: previewIconsSubset,
          previews: validationResult.previews,
          hasIcons: !!(standaloneIconPackId || (validationResult.iconPackResult && validationResult.iconPackResult.iconCount > 0)),
          hasWallpaper: !!validationResult.wallpaperDataUrl,
        },
      },
      assets: {
        zipFileName:
          options.fileName || `${themeDefinition.name.replace(/\s+/g, '_').toLowerCase()}.zip`,
        themeDefinition: themeDefinition,
      },
      integrationRequirements: {
        requiresLauncherRole: true,
        statusDescription:
          'Harmonizes launcher colors, Quick Settings, genuine app icons, and OLED wallpaper across the UI layer.',
      },
      payload: {
        mode: themeDefinition.appearance?.mode || 'oled',
        luminance: themeDefinition.appearance?.luminance || 'pure_black',
        accentColor: themeDefinition.colors?.accent || '#06b6d4',
        wallpaperUrl: validationResult.wallpaperDataUrl,
        previewVideoUrl: isVideo ? validationResult.wallpaperDataUrl : undefined,
        mediaType: isVideo ? 'wallpaper_live' : 'wallpaper_static',
        colors: themeDefinition.colors,
        quickSettings: themeDefinition.quickSettings,
        systemUi: themeDefinition.systemUi,
        wallpaperId: standaloneWallpaperId,
        wallpaperAssetId: standaloneWallpaperId,
        iconPackId: standaloneIconPackId,
        iconPackAssetId: standaloneIconPackId,
        extractedIcons: previewIconsSubset,
      },
    };

    if (existing) {
      const res = await this.updateAsset(existing.id, assetData);
      return res;
    } else {
      const created = await this.createAsset(assetData);
      if (options.isDefault) {
        await this.setDefaultAsset('theme', created.id);
      }
      return { success: true, asset: created };
    }
  }

  /**
   * Method 2: Assembles a new Theme from separate components (Wallpaper + Icon Pack)
   * Enforces Rule 11 (Standalone Reusability), Rule 12 (Identical Schema), Rule 13 (Draft initial state)
   */
  static async createThemeFromComponents(params: {
    name: string;
    author?: string;
    description?: string;
    accentColor?: string;
    mode?: 'oled' | 'dark';
    luminance?: string;
    rating?: number;
    status?: 'draft' | 'published';
    wallpaper?: {
      dataUrl: string;
      mediaType: 'image' | 'video';
      fileName?: string;
      file?: File;
    };
    iconPack?: {
      manifest: any;
      validationResult: any;
      fileName?: string;
      file?: File;
    };
    existingWallpaperId?: string;
    existingIconPackId?: string;
  }): Promise<{ success: boolean; asset?: OnevaAsset; error?: string }> {
    try {
      const accent = params.accentColor || '#06b6d4';
      const mode = params.mode || 'oled';
      const luminance = params.luminance || 'pure_black';

      const themeDefinition: any = {
        id: `theme-${Date.now()}`,
        name: params.name.trim(),
        author: params.author?.trim() || 'ONEVA Studio',
        description:
          params.description?.trim() ||
          `Assembled ${params.name.trim()} unified theme with coordinated assets.`,
        version: '1.0.0',
        rating: params.rating ?? 9,
        wallpaperId: params.existingWallpaperId,
        iconPackId: params.existingIconPackId,
        colors: {
          primary: mode === 'oled' ? '#030712' : '#0f172a',
          accent: accent,
          surface: '#090f1e',
          background: mode === 'oled' ? '#000000' : '#090d16',
          border: '#162033',
          text: '#f1f5f9',
        },
        appearance: {
          mode: mode,
          luminance: luminance,
          oledBlack: mode === 'oled',
          contrastRatio: mode === 'oled' ? 18.5 : 14.0,
        },
        quickSettings: {
          tileShape: 'squircle',
          activeTileColor: accent,
          panelLuminance: mode === 'oled' ? 'oled' : 'dark',
        },
        systemUi: {
          searchBarStyle: 'futuristic_pill',
          volumePanelStyle: 'neon_slider',
          statusBarStyle: 'minimal',
          batteryStyle: 'horizontal_pill',
          wifiStyle: 'tech_bars',
          signalStyle: '5g_contour',
          clockStyle: 'digital_mono',
        },
      };

      const validationResult: any = {
        wallpaperDataUrl: params.wallpaper?.dataUrl,
        wallpaperType: params.wallpaper?.mediaType || 'image',
        isLiveWallpaper: params.wallpaper?.mediaType === 'video',
        previewDataUrl: params.wallpaper?.dataUrl,
        previews: params.wallpaper?.dataUrl ? [params.wallpaper.dataUrl] : [],
        iconPackResult: params.iconPack?.validationResult,
        iconPackManifest: params.iconPack?.manifest,
        extractedIcons: params.iconPack?.validationResult?.extractedIcons || {},
        iconPackFile: params.iconPack?.file,
        zipSize: 0,
      };

      return await this.registerValidatedTheme(themeDefinition, validationResult, {
        fileName: `${params.name.trim().replace(/\s+/g, '_').toLowerCase()}.zip`,
        status: params.status || 'draft', // Initial state: NOT PUBLISHED YET
        isDefault: false,
      });
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to assemble theme' };
    }
  }

  /**
   * Registers or updates a validated System UI / Widget ZIP bundle
   */
  static async registerValidatedSystemUI(
    systemUiConfig: any,
    validationResult: {
      name?: string;
      description?: string;
      author?: string;
      previewDataUrl?: string;
      zipSize: number;
    },
    options: {
      fileName?: string;
      status?: 'draft' | 'testing' | 'verified' | 'published';
      isDefault?: boolean;
    } = {}
  ): Promise<{ success: boolean; asset?: OnevaAsset; error?: string }> {
    const assetName = validationResult.name || 'Custom System UI Package';
    const existing = this.getAssets().find(
      (a) => a.category === 'system_ui' && a.name === assetName
    );

    const assetData: Omit<OnevaAsset, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'> = {
      name: assetName,
      category: 'system_ui',
      description: validationResult.description || 'System UI indicators, Quick Settings tiles, and precision volume matrix.',
      version: '1.0.0',
      status: options.status || 'published',
      author: validationResult.author || 'ONEVA System Engineer',
      rating: 9,
      previewData: {
        color: systemUiConfig.quickSettings?.customActiveColor || '#10b981',
        previewDataUrl: validationResult.previewDataUrl,
        systemUiComponent: 'quick_settings',
      },
      assets: {
        zipFileName: options.fileName || `${assetName.replace(/\s+/g, '_').toLowerCase()}.zip`,
        rawPayload: systemUiConfig,
      },
      integrationRequirements: {
        requiresLauncherRole: true,
        statusDescription: 'Modulates launcher widgets, status indicators, and quick setting toggles via PlatformBridge.',
      },
      payload: {
        ...systemUiConfig,
      },
    };

    if (existing) {
      const res = await this.updateAsset(existing.id, assetData);
      return res;
    } else {
      const created = await this.createAsset(assetData);
      if (options.isDefault) {
        await this.setDefaultAsset('system_ui', created.id);
      }
      return { success: true, asset: created };
    }
  }

  /**
   * Explicitly publishes an asset to the user catalog.
   */
  static async publishAsset(assetId: string): Promise<{ success: boolean; asset?: OnevaAsset; error?: string }> {
    const all = this.getAssets();
    const target = all.find((a) => a.id === assetId);
    if (!target) return { success: false, error: 'Asset not found.' };

    const updated: OnevaAsset = {
      ...target,
      status: 'published',
      updatedAt: new Date().toISOString(),
    };

    this.assets = all.map((a) => (a.id === assetId ? updated : a));
    this.persistLocal();
    this.notify();

    // Broadcast realtime event
    RealtimeSyncService.broadcast('ASSET_PUBLISHED', assetId, target.category, updated);

    this.syncAssetToSupabase(updated).catch((err) => {
      console.warn('[AdminAssetService] Supabase publish sync notice:', err);
    });

    return { success: true, asset: updated };
  }

  /**
   * Unpublishes an asset (moves back to draft).
   */
  static async unpublishAsset(assetId: string): Promise<{ success: boolean; asset?: OnevaAsset; warning?: string }> {
    const all = this.getAssets();
    const target = all.find((a) => a.id === assetId);
    if (!target) return { success: false, warning: 'Asset not found.' };

    let warning: string | undefined;
    let shouldRemoveDefault = false;
    if (target.isDefault) {
      shouldRemoveDefault = true;
      warning = `"${target.name}" was the active ⭐ Default for ${target.category}. Star another published asset!`;
    }

    const updated: OnevaAsset = {
      ...target,
      status: 'draft',
      isDefault: shouldRemoveDefault ? false : target.isDefault,
      updatedAt: new Date().toISOString(),
    };

    this.assets = all.map((a) => (a.id === assetId ? updated : a));
    this.persistLocal();
    this.notify();

    // Broadcast realtime event
    RealtimeSyncService.broadcast('ASSET_UNPUBLISHED', assetId, target.category, updated);

    this.syncAssetToSupabase(updated).catch((err) => {
      console.warn('[AdminAssetService] Supabase unpublish sync notice:', err);
    });

    return { success: true, asset: updated, warning };
  }

  /**
   * Sets Blue-Star rating priority (10 to 1).
   */
  static async setAssetRating(assetId: string, rating: number): Promise<{ success: boolean; asset?: OnevaAsset; error?: string }> {
    const clampedRating = Math.max(1, Math.min(10, Math.round(rating)));
    const all = this.getAssets();
    const target = all.find((a) => a.id === assetId);
    if (!target) return { success: false, error: 'Asset not found.' };

    const updated: OnevaAsset = {
      ...target,
      rating: clampedRating,
      updatedAt: new Date().toISOString(),
    };

    this.assets = all.map((a) => (a.id === assetId ? updated : a));
    this.persistLocal();
    this.notify();

    // Broadcast realtime event
    RealtimeSyncService.broadcast('ASSET_UPDATED', assetId, target.category, updated);

    this.syncAssetToSupabase(updated).catch((err) => {
      console.warn('[AdminAssetService] Supabase rating update notice:', err);
    });

    return { success: true, asset: updated };
  }

  /**
   * Toggles published status between 'published' and 'draft'.
   */
  static async togglePublish(assetId: string): Promise<{ success: boolean; isPublished: boolean; warning?: string }> {
    const all = this.getAssets();
    const target = all.find((a) => a.id === assetId);
    if (!target) return { success: false, isPublished: false, warning: 'Asset not found' };

    if (target.status === 'published') {
      const res = await this.unpublishAsset(assetId);
      return { success: res.success, isPublished: false, warning: res.warning };
    } else {
      const res = await this.publishAsset(assetId);
      return { success: res.success, isPublished: true, warning: res.error };
    }
  }

  /**
   * Deletes an asset end-to-end:
   * - Validates not currently active default
   * - Purges binary data from IndexedDB (AssetStorageService)
   * - Deletes from Supabase 'assets' table (if connected)
   * - Cleans up dependent icon packs/individual icons
   * - Tombstones asset ID in deleted list to avoid resurrection
   * - Broadcasts realtime deletion event across all open views
   */
  static async deleteAsset(assetId: string): Promise<{ success: boolean; error?: string }> {
    const all = this.getAssets();
    const target = all.find((a) => a.id === assetId);
    if (!target) return { success: false, error: 'Asset not found.' };

    if (target.isDefault) {
      return {
        success: false,
        error: `Cannot delete "${target.name}" because it is the active ⭐ Default for ${target.category}. Please star another asset first.`,
      };
    }

    // Requirement 13 & 19: Do not delete shared assets that are still referenced by another Theme
    const referringThemes = all.filter((a) => {
      if (a.category !== 'theme' || a.id === assetId) return false;
      const def = a.assets?.themeDefinition || (a.payload?.themeDefinition as any);
      return (
        def?.wallpaperId === assetId ||
        def?.iconPackId === assetId ||
        def?.systemUiId === assetId ||
        def?.keyboardId === assetId ||
        a.payload?.wallpaperId === assetId ||
        a.payload?.iconPackId === assetId
      );
    });

    if (referringThemes.length > 0) {
      return {
        success: false,
        error: `Cannot delete "${target.name}" because it is currently linked to theme "${referringThemes[0].name}". Please unlink or remove the theme first.`,
      };
    }

    // Invalidate client cache across all tiers for this asset
    AssetCacheService.invalidateAsset(assetId).catch(() => {});

    try {
      // 1. Purge binary media from remote storage & local IndexedDB
      await ScalableStorageService.deleteAssetMedia(assetId, target.storagePaths);
    } catch (err) {
      console.warn('[AdminAssetService] ScalableStorageService media cleanup notice:', err);
    }

    // 2. Delete from Supabase 'assets' table if connected
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('assets').delete().eq('id', assetId);
      }
    } catch (err) {
      console.warn('[AdminAssetService] Supabase delete notice:', err);
    }

    // 3. Clean up associated icon pack system data if applicable
    if (target.category === 'icon_pack') {
      try {
        const { AdvancedIconSystem } = await import('./advancedIconSystem');
        await AdvancedIconSystem.deletePack(assetId);
      } catch (err) {
        console.warn('[AdminAssetService] AdvancedIconSystem cleanup notice:', err);
      }
      try {
        const { SingleAppIconService } = await import('./singleAppIconService');
        SingleAppIconService.deleteIconsForPack(assetId);
      } catch (err) {
        console.warn('[AdminAssetService] SingleAppIconService cleanup notice:', err);
      }
    }

    // 4. Tombstone ID in deleted set so seed assets or refreshed storage never resurrect it
    this.addDeletedAssetId(assetId);

    // 5. Remove from in-memory array & persist
    this.assets = all.filter((a) => a.id !== assetId);
    this.persistLocal();
    this.notify();

    // 6. Broadcast realtime deletion to user catalogs & admin sessions
    RealtimeSyncService.broadcast('ASSET_DELETED', assetId, target.category, undefined, this.LOCAL_ORIGIN_ID);

    return { success: true };
  }

  /**
   * Syncs the default selection to Supabase category_defaults table if connected.
   */
  private static async syncDefaultToSupabase(category: OnevaAssetCategory, defaultAssetId: string, assetName: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const payload: CategoryDefaultConfig = {
        category,
        defaultAssetId,
        assetName,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin',
      };

      // Upsert into category_defaults
      await supabase.from('category_defaults').upsert({
        category,
        default_asset_id: defaultAssetId,
        asset_name: assetName,
        updated_at: payload.updatedAt,
      });
    } catch (err) {
      console.warn('[AdminAssetService] Supabase category_defaults upsert fallback:', err);
    }
  }

  /**
   * Syncs asset metadata to Supabase 'assets' table if connected.
   */
  private static async syncAssetToSupabase(asset: OnevaAsset): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await supabase.from('assets').upsert({
        id: asset.id,
        name: asset.name,
        type: asset.category,
        version: asset.version,
        status: asset.status,
        bucket: 'oneva-public-assets',
        storage_path: asset.storagePaths?.originalPath || null,
        preview_storage_path: asset.storagePaths?.previewPath || null,
        thumbnail_storage_path: asset.storagePaths?.thumbnailPath || null,
        poster_storage_path: asset.storagePaths?.posterPath || null,
        public_url: asset.mediaUrls?.originalUrl || asset.mediaUrls?.previewUrl || null,
        file_size_bytes: asset.fileSizeBytes || (asset.fileSize ? parseInt(asset.fileSize) : 0) || 0,
        mime_type: (asset.payload?.mimeType as string) || (asset.isLiveWallpaper ? 'video/mp4' : 'image/png'),
        rating: asset.rating ?? 8,
        author: asset.author || 'ONEVA Studio',
        checksum: asset.checksum || null,
        published_at: asset.status === 'published' ? asset.updatedAt : null,
        metadata: {
          description: asset.description,
          previewData: asset.previewData,
          storagePaths: asset.storagePaths,
          mediaUrls: asset.mediaUrls,
          processingMode: asset.processingMode,
          keyColor: asset.keyColor,
          blendMode: asset.blendMode,
          payload: asset.payload,
          dimensions: asset.dimensions,
          durationSec: asset.durationSec,
          checksum: asset.checksum,
        },
        created_at: asset.createdAt,
        updated_at: asset.updatedAt,
      });
    } catch (err) {
      console.warn('[AdminAssetService] Supabase asset upsert fallback:', err);
    }
  }

  /**
   * Persists current memory state to local storage and IndexedDB for instant offline resilience.
   * Completely guards against QuotaExceededError when high-res wallpapers or live assets are uploaded.
   */
  private static persistLocal(): void {
    if (typeof window !== 'undefined' && this.assets) {
      try {
        // Strip gigantic base64 payloads, blob URLs, and extracted icon dictionaries for localStorage
        // to keep strictly under 5MB browser quota, preserving heavy binaries in IndexedDB
        const sanitizedAssets = this.assets.map((asset) => {
          let sanitized = asset;

          const mediaPayload =
            asset.previewData?.previewDataUrl ||
            asset.previewData?.previewUrl ||
            asset.previewData?.previewVideoUrl;
          if (mediaPayload && (mediaPayload.length > 25000 || mediaPayload.startsWith('blob:'))) {
            const thumb = asset.previewData?.previewThumbnailUrl;
            const safeThumb = thumb && thumb.length < 25000 && !thumb.startsWith('blob:') ? thumb : undefined;
            sanitized = {
              ...sanitized,
              previewData: {
                ...sanitized.previewData,
                previewDataUrl: safeThumb,
                previewUrl: safeThumb,
                previewVideoUrl: undefined,
                previewThumbnailUrl: safeThumb,
                hasStoredMedia: true,
              },
            };
          }

          // Check if extracted icons are present in assets, previewData, or payload
          const hasIconsInAssets = Boolean(
            sanitized.assets?.extractedIcons && Object.keys(sanitized.assets.extractedIcons).length > 0
          );
          const hasIconsInCustomData = Boolean(
            (sanitized.previewData?.customData as any)?.extractedIcons &&
              Object.keys((sanitized.previewData?.customData as any)?.extractedIcons).length > 0
          );
          const hasIconsInPayload = Boolean(
            (sanitized.payload as any)?.extractedIcons &&
              Object.keys((sanitized.payload as any)?.extractedIcons).length > 0
          );

          if (hasIconsInAssets || hasIconsInCustomData || hasIconsInPayload) {
            const sanitizedAssetsField = sanitized.assets
              ? {
                  ...sanitized.assets,
                  extractedIcons: undefined,
                  hasStoredIcons: true,
                }
              : undefined;

            const sanitizedCustomData = sanitized.previewData?.customData
              ? {
                  ...(sanitized.previewData.customData as any),
                  extractedIcons: undefined,
                  hasStoredIcons: true,
                }
              : undefined;

            const sanitizedPayload = sanitized.payload
              ? {
                  ...(sanitized.payload as any),
                  extractedIcons: undefined,
                  wallpaperUrl:
                    (sanitized.payload as any)?.wallpaperUrl?.length > 50000
                      ? undefined
                      : (sanitized.payload as any)?.wallpaperUrl,
                  assetUrl:
                    (sanitized.payload as any)?.assetUrl?.length > 50000
                      ? undefined
                      : (sanitized.payload as any)?.assetUrl,
                  hasStoredIcons: true,
                }
              : undefined;

            sanitized = {
              ...sanitized,
              assets: sanitizedAssetsField,
              previewData: sanitized.previewData
                ? {
                    ...sanitized.previewData,
                    customData: sanitizedCustomData,
                  }
                : undefined,
              payload: sanitizedPayload,
            };
          }

          return sanitized;
        });

        localStorage.setItem(STORAGE_ASSETS_KEY, JSON.stringify(sanitizedAssets));
      } catch (err) {
        console.warn('[AdminAssetService] LocalStorage quota limit reached, saving minimal metadata index:', err);
        try {
          // Fallback: save only essential id, name, category, rating, isDefault
          const minimal = this.assets.map((a) => ({
            id: a.id,
            name: a.name,
            category: a.category,
            status: a.status,
            rating: a.rating,
            isDefault: a.isDefault,
            author: a.author,
          }));
          localStorage.setItem(STORAGE_ASSETS_KEY, JSON.stringify(minimal));
        } catch {
          // memory cache continues to function
        }
      }
    }
  }

  /**
   * Event subscription for real-time changes.
   */
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
        console.error('[AdminAssetService] Subscriber error:', err);
      }
    });
  }
}
