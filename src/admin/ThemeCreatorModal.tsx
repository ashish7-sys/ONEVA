import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Package,
  Check,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Sparkles,
  Layers,
  Palette,
  AlertTriangle,
  Loader2,
  Eye,
  FileArchive,
  Info,
  Smartphone,
  Wifi,
  Battery,
  Phone,
  MessageSquare,
  Globe,
  Camera,
  Settings,
  Tv,
  Image,
} from 'lucide-react';
import { IconPackValidator } from '../services/iconPackValidator';
import { AdminAssetService } from '../services/adminAssetService';
import { AppCatalogService } from '../services/appCatalogService';
import { IconPackValidationResult, OnevaAsset, UploadProgressState } from '../types/adminAssets';
import { ChunkedUploadEngine } from '../services/chunkedUploadEngine';

interface ThemeCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeCreated: (themeAsset: OnevaAsset) => void;
  showToast: (msg: string) => void;
}

// Canonical representative apps for the real phone home screen preview
interface PreviewAppConfig {
  name: string;
  packageName: string;
  fallbackIcon: React.ReactNode;
}

const PREVIEW_GRID_APPS: PreviewAppConfig[] = [
  { name: 'Phone', packageName: 'com.google.android.dialer', fallbackIcon: <Phone className="w-5 h-5 text-emerald-400" /> },
  { name: 'Messages', packageName: 'com.google.android.apps.messaging', fallbackIcon: <MessageSquare className="w-5 h-5 text-sky-400" /> },
  { name: 'Chrome', packageName: 'com.android.chrome', fallbackIcon: <Globe className="w-5 h-5 text-amber-400" /> },
  { name: 'Camera', packageName: 'com.google.android.GoogleCamera', fallbackIcon: <Camera className="w-5 h-5 text-rose-400" /> },
  { name: 'Settings', packageName: 'com.android.settings', fallbackIcon: <Settings className="w-5 h-5 text-neutral-300" /> },
  { name: 'WhatsApp', packageName: 'com.whatsapp', fallbackIcon: <MessageSquare className="w-5 h-5 text-emerald-500" /> },
  { name: 'YouTube', packageName: 'com.google.android.youtube', fallbackIcon: <Tv className="w-5 h-5 text-red-500" /> },
  { name: 'Photos', packageName: 'com.google.android.apps.photos', fallbackIcon: <Image className="w-5 h-5 text-indigo-400" /> },
];

const DOCK_APPS: PreviewAppConfig[] = [
  { name: 'Phone', packageName: 'com.google.android.dialer', fallbackIcon: <Phone className="w-5 h-5 text-emerald-400" /> },
  { name: 'Messages', packageName: 'com.google.android.apps.messaging', fallbackIcon: <MessageSquare className="w-5 h-5 text-sky-400" /> },
  { name: 'Chrome', packageName: 'com.android.chrome', fallbackIcon: <Globe className="w-5 h-5 text-amber-400" /> },
  { name: 'Camera', packageName: 'com.google.android.GoogleCamera', fallbackIcon: <Camera className="w-5 h-5 text-rose-400" /> },
];

export function ThemeCreatorModal({
  isOpen,
  onClose,
  onThemeCreated,
  showToast,
}: ThemeCreatorModalProps) {
  // Theme Metadata State
  const [themeName, setThemeName] = useState('Cosmic Neon OLED');
  const [themeAuthor, setThemeAuthor] = useState('ONEVA Studio');
  const [themeDescription, setThemeDescription] = useState(
    'Unified OLED theme crafted with high-contrast pitch blacks and coordinated neon accents.'
  );
  const [accentColor, setAccentColor] = useState('#06b6d4');
  const [themeMode, setThemeMode] = useState<'oled' | 'dark'>('oled');
  const [rating, setRating] = useState(10);

  // Wallpaper Component State (Preserves original source without destructive resizing)
  const [wallpaperFile, setWallpaperFile] = useState<File | null>(null);
  const [wallpaperDataUrl, setWallpaperDataUrl] = useState<string | null>(null);
  const [wallpaperMediaType, setWallpaperMediaType] = useState<'image' | 'video'>('image');
  const [wallpaperFileName, setWallpaperFileName] = useState<string | null>(null);
  const [isLiveWallpaper, setIsLiveWallpaper] = useState(false);
  const [selectedWallpaperAssetId, setSelectedWallpaperAssetId] = useState<string | null>(null);

  // Icon Pack Component State
  const [iconPackFile, setIconPackFile] = useState<File | null>(null);
  const [iconPackResult, setIconPackResult] = useState<IconPackValidationResult | null>(null);
  const [isProcessingIconPack, setIsProcessingIconPack] = useState(false);
  const [showIconPackReview, setShowIconPackReview] = useState(false);
  const [selectedIconPackAssetId, setSelectedIconPackAssetId] = useState<string | null>(null);

  // Asset Picker Modals
  const [showExistingWallpaperPicker, setShowExistingWallpaperPicker] = useState(false);
  const [showExistingIconPackPicker, setShowExistingIconPackPicker] = useState(false);

  // Upload Progress State
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null);

  // Mobile subview toggle ('editor' | 'preview')
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Submission State
  const [isCreatingTheme, setIsCreatingTheme] = useState(false);

  // File Input Refs
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const iconPackInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Wallpaper Upload Handler (Image & Video) - Preserves original source file with non-blocking upload engine
  const handleWallpaperFileSelect = async (file: File) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(file.name);

    if (!isVideo && !isImage) {
      showToast('Please upload a supported image (PNG, JPG, WEBP) or video (MP4, WEBM).');
      return;
    }

    setWallpaperFile(file);
    setWallpaperFileName(file.name);
    setWallpaperMediaType(isVideo ? 'video' : 'image');
    setIsLiveWallpaper(isVideo);

    try {
      const res = await ChunkedUploadEngine.processUpload({
        file,
        category: isVideo ? 'live_wallpaper' : 'wallpaper',
        onProgress: (state) => setUploadProgress(state),
      });

      if (res.success && res.dataUrl) {
        setWallpaperDataUrl(res.dataUrl);
        showToast(`${isVideo ? 'Live video' : 'Image'} wallpaper "${file.name}" loaded!`);
      }
    } catch (err: any) {
      showToast(`Upload failed: ${err?.message || 'Failed to process wallpaper'}`);
    } finally {
      setTimeout(() => setUploadProgress(null), 1000);
    }
  };

  // 2. Icon Pack ZIP Upload Handler (Canonical 56-app catalog matching)
  // State persistence: If ZIP processing fails, wallpaper and metadata remain intact!
  const handleIconPackFileSelect = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      showToast('Please select a valid .ZIP icon pack archive.');
      return;
    }

    setIsProcessingIconPack(true);
    setIconPackFile(file);

    try {
      // Process through ChunkedUploadEngine
      await ChunkedUploadEngine.processUpload({
        file,
        category: 'icon_pack',
        onProgress: (state) => setUploadProgress(state),
      });

      // Validate and extract using canonical ONEVA catalog (with non-blocking yields)
      const result = await IconPackValidator.validateIconPackZip(file, file.name);
      setIsProcessingIconPack(false);

      if (!result.isValid) {
        showToast(`Icon Pack error: ${result.errors.join(', ')}`);
        // State persistence: Keep previous state intact on error
        return;
      }

      setIconPackResult(result);
      setShowIconPackReview(true);
      showToast(`Processed "${file.name}": matched ${result.verifiedPackages.length} apps!`);
    } catch (err: any) {
      setIsProcessingIconPack(false);
      showToast(`Failed to process icon pack: ${err?.message || 'Unknown error'}`);
    } finally {
      setTimeout(() => setUploadProgress(null), 1000);
    }
  };

  // Selection handlers for existing catalog assets (Requirement 7: Avoid duplicate storage)
  const handleSelectExistingWallpaper = (asset: OnevaAsset) => {
    const url =
      asset.mediaUrls?.previewUrl ||
      asset.previewData?.previewUrl ||
      asset.previewData?.previewDataUrl ||
      (asset.payload?.wallpaperUrl as string) ||
      (asset.payload?.assetUrl as string);
    setSelectedWallpaperAssetId(asset.id);
    setWallpaperDataUrl(url);
    setWallpaperFileName(asset.name);
    setWallpaperFile(null); // Reference existing asset - no duplicate file upload!
    setWallpaperMediaType(
      asset.isLiveWallpaper || asset.category === 'live_wallpaper' ? 'video' : 'image'
    );
    setIsLiveWallpaper(asset.isLiveWallpaper || asset.category === 'live_wallpaper');
    setShowExistingWallpaperPicker(false);
    showToast(`Linked existing wallpaper "${asset.name}" (ID: ${asset.id})`);
  };

  const handleSelectExistingIconPack = (asset: OnevaAsset) => {
    setSelectedIconPackAssetId(asset.id);
    setIconPackFile(null); // Reference existing pack - no duplicate file upload!
    const manifest = (asset.payload?.manifest as any) || {
      name: asset.name,
      author: asset.author || 'ONEVA',
      version: asset.version,
    };
    const verifiedPackages = (asset.payload?.verifiedPackages as string[]) || [
      'com.google.android.dialer',
      'com.google.android.apps.messaging',
      'com.android.chrome',
      'com.google.android.GoogleCamera',
      'com.whatsapp',
      'com.google.android.youtube',
    ];
    const extractedIcons: Record<string, string> =
      (asset.payload?.extractedIcons as any) || {};

    setIconPackResult({
      isValid: true,
      manifest,
      iconCount: (asset.payload?.iconCount as number) || verifiedPackages.length,
      verifiedPackages,
      warnings: [],
      errors: [],
      extractedIcons,
      zipSize: 0,
    });
    setShowExistingIconPackPicker(false);
    showToast(`Linked existing icon pack "${asset.name}" (ID: ${asset.id})`);
  };

  // 3. Assemble and Create Theme
  const handleAssembleTheme = async (publishImmediately: boolean = false) => {
    if (!themeName.trim()) {
      showToast('Please provide a name for the theme.');
      return;
    }

    if (!wallpaperDataUrl && (!iconPackResult || iconPackResult.iconCount === 0)) {
      showToast('Please add at least one component (Wallpaper or Icon Pack) to create a theme.');
      return;
    }

    setIsCreatingTheme(true);

    try {
      const res = await AdminAssetService.createThemeFromComponents({
        name: themeName.trim(),
        author: themeAuthor.trim(),
        description: themeDescription.trim(),
        accentColor: accentColor,
        mode: themeMode,
        luminance: themeMode === 'oled' ? 'pure_black' : 'slate_neutral',
        rating: rating,
        status: publishImmediately ? 'published' : 'draft',
        existingWallpaperId: selectedWallpaperAssetId || undefined,
        existingIconPackId: selectedIconPackAssetId || undefined,
        wallpaper: wallpaperDataUrl
          ? {
              dataUrl: wallpaperDataUrl,
              mediaType: wallpaperMediaType,
              fileName: wallpaperFileName || undefined,
              file: wallpaperFile || undefined,
            }
          : undefined,
        iconPack:
          iconPackResult && iconPackResult.manifest
            ? {
                manifest: iconPackResult.manifest,
                validationResult: iconPackResult,
                fileName: iconPackFile?.name,
                file: iconPackFile || undefined,
              }
            : undefined,
      });

      if (res.success && res.asset) {
        showToast(
          `Theme "${themeName}" ${publishImmediately ? 'published' : 'saved as Draft'} successfully!`
        );
        onThemeCreated(res.asset);
        onClose();
      } else {
        showToast(`Creation error: ${res.error || 'Failed to create theme'}`);
      }
    } catch (err: any) {
      showToast(`Error creating theme: ${err?.message || 'Server error'}`);
    } finally {
      setIsCreatingTheme(false);
    }
  };

  // Helper to resolve icon from the selected pack or fallback
  const renderAppIcon = (app: PreviewAppConfig) => {
    const iconUrl = iconPackResult?.extractedIcons?.[app.packageName.toLowerCase()];
    if (iconUrl) {
      return (
        <img
          src={iconUrl}
          alt={app.name}
          className="w-10 h-10 object-contain rounded-xl drop-shadow-md transition-transform hover:scale-105"
          referrerPolicy="no-referrer"
        />
      );
    }

    return (
      <div className="w-10 h-10 rounded-xl bg-neutral-900/80 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-md">
        {app.fallbackIcon}
      </div>
    );
  };

  // Accent color preset swatches
  const accentSwatches = ['#06b6d4', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b', '#3b82f6'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-neutral-800 bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Theme Creator</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  COMPONENT ASSEMBLY
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Assemble standalone Wallpaper & Icon Pack into a coordinated ONEVA Theme.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Tab Toggle */}
            <div className="flex lg:hidden rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMobileTab('editor')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  mobileTab === 'editor' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Components
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  mobileTab === 'preview' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two Columns on Desktop (Left: Editor, Right: Live Theme Phone Simulation) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Theme Config & Components */}
            <div
              className={`lg:col-span-7 space-y-5 ${
                mobileTab === 'preview' ? 'hidden lg:block' : 'block'
              }`}
            >
              {/* Upload Progress Bar (Chunked Non-blocking Pipeline) */}
              {uploadProgress && (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-purple-500/40 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-purple-300 font-bold uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      <span>Pipeline: {uploadProgress.step.replace('_', ' ')}</span>
                    </div>
                    <span className="font-mono text-purple-400 font-bold text-[11px]">
                      {Math.round(uploadProgress.progressPercent)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-200"
                      style={{ width: `${Math.max(5, uploadProgress.progressPercent)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 truncate">{uploadProgress.statusMessage}</p>
                </div>
              )}

              {/* Subview: Icon Pack Review Step with [Done] button */}
              {showIconPackReview && iconPackResult ? (
                <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-cyan-500/40 animate-in fade-in shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {iconPackResult.manifest?.name || 'Uploaded Icon Pack'}
                        </h3>
                        <p className="text-[11px] text-cyan-400 font-mono">
                          ✓ Matched {iconPackResult.verifiedPackages.length} genuine apps in ONEVA catalog
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
                      Preserved Catalog
                    </span>
                  </div>

                  {/* Genuine Icons Grid Preview */}
                  <div>
                    <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-2">
                      Sample Matched Genuine App Icons:
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 max-h-48 overflow-y-auto">
                      {iconPackResult.verifiedPackages.slice(0, 28).map((pkg) => {
                        const iconUrl = iconPackResult.extractedIcons?.[pkg];
                        const appMeta = AppCatalogService.getAllApps().find((a) => a.packageName === pkg);
                        return (
                          <div
                            key={pkg}
                            className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-center"
                            title={`${appMeta?.name || pkg} (${pkg})`}
                          >
                            {iconUrl ? (
                              <img
                                src={iconUrl}
                                alt={pkg}
                                className="w-8 h-8 object-contain rounded-lg"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-[10px] font-mono text-neutral-400">
                                {appMeta?.name?.slice(0, 2) || 'APP'}
                              </div>
                            )}
                            <span className="text-[9px] font-medium text-neutral-300 truncate w-full">
                              {appMeta?.name || pkg.split('.').pop()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Icon Pack Review Done Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIconPackResult(null);
                        setIconPackFile(null);
                        setShowIconPackReview(false);
                      }}
                      className="px-3 py-1.5 rounded-xl text-neutral-400 hover:text-rose-400 text-xs font-medium transition cursor-pointer"
                    >
                      Discard Pack
                    </button>

                    <button
                      type="button"
                      id="icon-pack-done-btn"
                      onClick={() => setShowIconPackReview(false)}
                      className="px-5 py-2 rounded-xl bg-cyan-500 text-neutral-950 text-xs font-bold hover:bg-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/30"
                    >
                      <Check className="w-4 h-4" />
                      <span>Done & Apply to Theme</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Theme Metadata Form */}
              <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Theme Name <span className="text-purple-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={themeName}
                      onChange={(e) => setThemeName(e.target.value)}
                      placeholder="e.g. Cosmic Neon OLED"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-purple-500/60 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Author / Creator
                    </label>
                    <input
                      type="text"
                      value={themeAuthor}
                      onChange={(e) => setThemeAuthor(e.target.value)}
                      placeholder="e.g. ONEVA Studio"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-purple-500/60 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Theme Description
                  </label>
                  <textarea
                    value={themeDescription}
                    onChange={(e) => setThemeDescription(e.target.value)}
                    rows={2}
                    placeholder="Describe luminance tuning, coordinated UI colors, and OLED contrast."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-purple-500/60 transition resize-none"
                  />
                </div>

                {/* Accent Color & Luminance Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-700 cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5">
                        {accentSwatches.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setAccentColor(color)}
                            className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                              accentColor.toLowerCase() === color.toLowerCase()
                                ? 'border-white scale-110 shadow-md ring-2 ring-purple-500/50'
                                : 'border-white/20 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-xs text-neutral-400 ml-1">{accentColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Luminance Mode
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setThemeMode('oled')}
                        className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                          themeMode === 'oled'
                            ? 'bg-black text-cyan-300 border-cyan-500/60 shadow-md'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        OLED Pure Black
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeMode('dark')}
                        className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                          themeMode === 'dark'
                            ? 'bg-neutral-800 text-cyan-300 border-cyan-500/60 shadow-md'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        Dark Slate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* THEME COMPONENTS SECTION */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                  <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Theme Components</span>
                  </h3>
                  <span className="text-[11px] text-neutral-500">
                    Add Wallpaper, Icon Pack, or both to assemble
                  </span>
                </div>

                {/* Hidden Inputs */}
                <input
                  ref={wallpaperInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleWallpaperFileSelect(e.target.files[0]);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <input
                  ref={iconPackInputRef}
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleIconPackFileSelect(e.target.files[0]);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* COMPONENT 1: WALLPAPER */}
                  <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between min-h-[190px]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Wallpaper</span>
                          <span className="text-[10px] text-neutral-400">Image or Video</span>
                        </div>
                      </div>

                      {wallpaperDataUrl ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Added
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-500">Not Added</span>
                      )}
                    </div>

                    {/* Actual Wallpaper Preview */}
                    {wallpaperDataUrl ? (
                      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black border border-neutral-800 my-auto shadow-inner flex items-center justify-center group">
                        {wallpaperMediaType === 'video' ? (
                          <>
                            <video
                              src={wallpaperDataUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                            {/* LIVE badge strictly for video wallpaper */}
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[9px] font-extrabold flex items-center gap-1 shadow-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              LIVE
                            </div>
                          </>
                        ) : (
                          <img
                            src={wallpaperDataUrl}
                            alt="Wallpaper Preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => wallpaperInputRef.current?.click()}
                            className="px-3 py-1 rounded-lg bg-neutral-900/90 text-white text-[11px] font-semibold hover:bg-neutral-800 transition cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setWallpaperDataUrl(null);
                              setWallpaperFileName(null);
                              setSelectedWallpaperAssetId(null);
                            }}
                            className="p-1 rounded-lg bg-rose-950/80 text-rose-300 hover:bg-rose-900 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col gap-2 my-1">
                        <div
                          onClick={() => wallpaperInputRef.current?.click()}
                          className="flex-1 border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition hover:bg-emerald-950/10 group"
                        >
                          <div className="w-7 h-7 rounded-full bg-neutral-900 group-hover:bg-emerald-500/20 text-neutral-400 group-hover:text-emerald-400 flex items-center justify-center mb-1 transition">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-neutral-300 group-hover:text-white">
                            Upload Wallpaper File
                          </span>
                          <span className="text-[10px] text-neutral-500 mt-0.5">
                            Image or 60FPS Video
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowExistingWallpaperPicker(true)}
                          className="w-full py-1.5 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-medium text-emerald-300 hover:border-emerald-500/40 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>Link Existing Wallpaper (Asset ID)</span>
                        </button>
                      </div>
                    )}

                    {/* Footer Controls */}
                    {wallpaperDataUrl && (
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-neutral-900 text-xs">
                        <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[150px]">
                          {selectedWallpaperAssetId ? `Linked ID: ${selectedWallpaperAssetId}` : wallpaperFileName || 'wallpaper.png'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => wallpaperInputRef.current?.click()}
                            className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setWallpaperDataUrl(null);
                              setWallpaperFileName(null);
                              setSelectedWallpaperAssetId(null);
                            }}
                            className="text-[11px] text-neutral-500 hover:text-rose-400 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* COMPONENT 2: ICON PACK */}
                  <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between min-h-[190px]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                          <Package className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Icon Pack</span>
                          <span className="text-[10px] text-neutral-400">Coordinated Vector ZIP</span>
                        </div>
                      </div>

                      {iconPackResult ? (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Added
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-500">Not Added</span>
                      )}
                    </div>

                    {/* Actual Icon Pack Preview */}
                    {isProcessingIconPack ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center my-auto">
                        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
                        <span className="text-xs text-neutral-300 font-medium">Extracting & Matching Icons...</span>
                        <span className="text-[10px] text-neutral-500 font-mono mt-1">
                          Matching canonical 56-app catalog
                        </span>
                      </div>
                    ) : iconPackResult ? (
                      <div className="space-y-2 my-auto">
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                          <span>{iconPackResult.manifest?.name || 'Icon Pack'}</span>
                          <span className="text-cyan-400 font-bold">{iconPackResult.verifiedPackages.length} Apps</span>
                        </div>

                        {/* Quick Monogram / Icon Previews Row */}
                        <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                          {iconPackResult.verifiedPackages.slice(0, 6).map((pkg) => {
                            const iconUrl = iconPackResult.extractedIcons?.[pkg];
                            return iconUrl ? (
                              <img
                                key={pkg}
                                src={iconUrl}
                                alt={pkg}
                                className="w-7 h-7 rounded-lg object-contain bg-black/40 border border-white/5"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div
                                key={pkg}
                                className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-[9px] font-mono text-neutral-300"
                              >
                                {pkg.split('.').pop()?.slice(0, 2).toUpperCase()}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col gap-2 my-1">
                        <div
                          onClick={() => iconPackInputRef.current?.click()}
                          className="flex-1 border-2 border-dashed border-neutral-800 hover:border-cyan-500/50 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition hover:bg-cyan-950/10 group"
                        >
                          <div className="w-7 h-7 rounded-full bg-neutral-900 group-hover:bg-cyan-500/20 text-neutral-400 group-hover:text-cyan-400 flex items-center justify-center mb-1 transition">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-neutral-300 group-hover:text-white">
                            Upload Icon Pack ZIP
                          </span>
                          <span className="text-[10px] text-neutral-500 mt-0.5">
                            Standard Vector Archive
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowExistingIconPackPicker(true)}
                          className="w-full py-1.5 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-medium text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Package className="w-3 h-3 text-cyan-400" />
                          <span>Link Existing Pack (Asset ID)</span>
                        </button>
                      </div>
                    )}

                    {/* Footer Controls */}
                    {iconPackResult && (
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-neutral-900 text-xs">
                        <button
                          type="button"
                          onClick={() => setShowIconPackReview(true)}
                          className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View All Icons
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => iconPackInputRef.current?.click()}
                            className="text-[11px] text-neutral-400 hover:text-white cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIconPackResult(null);
                              setIconPackFile(null);
                            }}
                            className="text-[11px] text-neutral-500 hover:text-rose-400 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Extensible Architecture Indicators */}
              <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-[11px]">
                    Future components (System UI Pack, Tactile IME Keyboard) connect seamlessly into this theme.
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                    System UI: Adaptive
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                    Keyboard: IME
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: REAL THEME PREVIEW (WALLPAPER + ICON PACK TOGETHER) */}
            <div
              className={`lg:col-span-5 flex flex-col items-center justify-start ${
                mobileTab === 'editor' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <div className="w-full flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Real Theme Preview
                  </span>
                </div>
                <div className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {wallpaperDataUrl && iconPackResult
                    ? 'Wallpaper + Icons'
                    : wallpaperDataUrl
                    ? 'Wallpaper Only'
                    : iconPackResult
                    ? 'Icons on OLED Black'
                    : 'Awaiting Components'}
                </div>
              </div>

              {/* Phone Device Frame */}
              <div
                className="w-full max-w-[270px] sm:max-w-[290px] aspect-[9/18.5] rounded-[38px] border-4 border-neutral-800 shadow-2xl overflow-hidden relative flex flex-col justify-between p-3 select-none bg-black transition-all"
                style={{
                  boxShadow: `0 20px 40px -15px ${accentColor}25, 0 0 0 1px #262626`,
                }}
              >
                {/* Layer 1: Wallpaper Background (Image, 60FPS Video, or Deep OLED Black) */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                  {wallpaperDataUrl ? (
                    wallpaperMediaType === 'video' ? (
                      <video
                        src={wallpaperDataUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={wallpaperDataUrl}
                        alt="Wallpaper Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )
                  ) : (
                    // Solid OLED pitch black background when no wallpaper is selected
                    <div className="w-full h-full bg-[#000000] flex flex-col items-center justify-center p-4">
                      <div className="w-full h-full border border-dashed border-neutral-800/60 rounded-2xl flex flex-col items-center justify-center text-center p-3">
                        <span className="text-[10px] font-mono text-neutral-600">OLED Pitch Black</span>
                        <span className="text-[9px] text-neutral-700 mt-1">#000000 Pure Black</span>
                      </div>
                    </div>
                  )}

                  {/* Gentle scrim for text contrast */}
                  {wallpaperDataUrl && (
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
                  )}

                  {/* Video Live Badge */}
                  {wallpaperDataUrl && wallpaperMediaType === 'video' && (
                    <div className="absolute top-7 right-3 px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[8px] font-black tracking-wider flex items-center gap-1 shadow-md z-20">
                      <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                      LIVE
                    </div>
                  )}
                </div>

                {/* Layer 2: Phone Status Bar */}
                <div className="relative z-10 flex items-center justify-between text-[11px] font-mono font-semibold text-white px-2 pt-1 drop-shadow">
                  <span>10:45</span>
                  {/* Dynamic Island / Camera Notch */}
                  <div className="w-16 h-3.5 bg-black rounded-full border border-neutral-800/80 mx-auto" />
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3 h-3 text-white" />
                    <Battery className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Layer 3: Minimal Clock & Date Widget */}
                <div className="relative z-10 px-2 py-3 flex flex-col items-center text-center drop-shadow-md">
                  <div className="text-3xl font-light font-mono text-white tracking-tight">10:45</div>
                  <div className="text-[10px] font-medium text-neutral-200 mt-0.5">Wednesday, Oct 14</div>
                  {/* Accent Line */}
                  <div
                    className="w-8 h-0.5 rounded-full mt-2 transition-colors duration-300"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>

                {/* Layer 4: Genuine App Grid (Natural Home Screen Arrangement) */}
                <div className="relative z-10 grid grid-cols-4 gap-y-3.5 gap-x-2 px-1 my-auto">
                  {PREVIEW_GRID_APPS.map((app) => (
                    <div key={app.packageName} className="flex flex-col items-center gap-1 text-center group">
                      <div className="transition-transform group-hover:scale-105 drop-shadow">
                        {renderAppIcon(app)}
                      </div>
                      <span className="text-[9px] font-medium text-white/90 drop-shadow truncate w-full max-w-[54px]">
                        {app.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Layer 5: Bottom Dock with Frosted Glass Pill */}
                <div className="relative z-10 pt-2 pb-1">
                  <div className="p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 grid grid-cols-4 gap-2 items-center justify-items-center shadow-lg">
                    {DOCK_APPS.map((app) => (
                      <div key={`dock-${app.packageName}`} className="flex flex-col items-center">
                        {renderAppIcon(app)}
                      </div>
                    ))}
                  </div>

                  {/* Android Home Bar Indicator */}
                  <div className="w-24 h-1 bg-white/60 rounded-full mx-auto mt-2" />
                </div>
              </div>

              {/* Preview Footer Notes */}
              <div className="text-center mt-2.5">
                <span className="text-[10px] text-neutral-400 font-mono flex items-center justify-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span>
                    Coordinated Accent: <strong className="text-white">{accentColor}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>{themeMode === 'oled' ? 'OLED Black' : 'Dark Slate'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* REDESIGNED BOTTOM ACTION AREA (Dedicated Rows, Zero Horizontal Overflow) */}
        <div className="shrink-0 border-t border-neutral-800 bg-neutral-950">
          {/* ROW 1: DEDICATED INCLUDED COMPONENTS SECTION */}
          <div className="px-5 sm:px-6 py-2.5 bg-neutral-950/70 border-b border-neutral-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-neutral-300">
                  Included:
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                    wallpaperDataUrl
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                  }`}
                >
                  {wallpaperDataUrl ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Wallpaper ({wallpaperMediaType === 'video' ? 'Live Video' : 'Image'})</span>
                    </>
                  ) : (
                    <span>✕ No Wallpaper</span>
                  )}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                    iconPackResult
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                  }`}
                >
                  {iconPackResult ? (
                    <>
                      <Check className="w-3 h-3 text-cyan-400" />
                      <span>Icon Pack ({iconPackResult.verifiedPackages.length} apps)</span>
                    </>
                  ) : (
                    <span>✕ No Icon Pack</span>
                  )}
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
                  <Check className="w-3 h-3 text-purple-400" />
                  <span>System UI (Adaptive)</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
                  <Check className="w-3 h-3 text-purple-400" />
                  <span>Keyboard (Tactile IME)</span>
                </span>
              </div>
            </div>
          </div>

          {/* ROW 2: ACTION BUTTONS (Fully Visible, Responsive, No Horizontal Overflow) */}
          <div className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white text-xs font-semibold transition cursor-pointer order-last sm:order-first text-center hover:bg-neutral-900"
            >
              Cancel
            </button>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Save as Draft (Default Safe Lifecycle) */}
              <button
                type="button"
                id="save-theme-draft-btn"
                onClick={() => handleAssembleTheme(false)}
                disabled={isCreatingTheme}
                className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isCreatingTheme && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save as Draft</span>
              </button>

              {/* Create Theme (Publish) */}
              <button
                type="button"
                id="create-theme-btn"
                onClick={() => handleAssembleTheme(true)}
                disabled={isCreatingTheme}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/40 disabled:opacity-50"
              >
                {isCreatingTheme ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Create Theme</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EXISTING WALLPAPER PICKER MODAL (Requirement 7) */}
      {showExistingWallpaperPicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Select Existing Wallpaper</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  Shared Asset ID (Zero Duplicate Bytes)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowExistingWallpaperPicker(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AdminAssetService.getAssets()
                .filter((a) => a.category === 'wallpaper' || a.category === 'live_wallpaper')
                .map((wp) => {
                  const preview =
                    wp.mediaUrls?.previewUrl ||
                    wp.previewData?.previewUrl ||
                    wp.previewData?.previewThumbnailUrl ||
                    wp.previewData?.previewDataUrl ||
                    (wp.payload?.wallpaperUrl as string);
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => handleSelectExistingWallpaper(wp)}
                      className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/60 transition flex flex-col text-left group cursor-pointer"
                    >
                      <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-black mb-2 relative">
                        {preview ? (
                          <img
                            src={preview}
                            alt={wp.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500">
                            No preview
                          </div>
                        )}
                        {wp.isLiveWallpaper && (
                          <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[8px] font-bold">
                            LIVE
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-white truncate w-full group-hover:text-emerald-300">
                        {wp.name}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500 truncate w-full mt-0.5">
                        ID: {wp.id}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* EXISTING ICON PACK PICKER MODAL (Requirement 7) */}
      {showExistingIconPackPicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Select Existing Icon Pack</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  Shared Asset ID (Zero Duplicate Bytes)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowExistingIconPackPicker(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AdminAssetService.getAssets()
                .filter((a) => a.category === 'icon_pack')
                .map((pack) => {
                  const samples = pack.previewData?.sampleIcons || [];
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => handleSelectExistingIconPack(pack)}
                      className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-cyan-500/60 transition flex flex-col text-left group cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="text-xs font-semibold text-white group-hover:text-cyan-300">
                          {pack.name}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          ★ {pack.rating ?? 9}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-900 w-full mb-2">
                        {samples.slice(0, 5).map((s, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-mono font-bold"
                            style={{ backgroundColor: s.bg || '#222', color: s.fg || '#fff' }}
                          >
                            {s.label || s.name?.slice(0, 2)}
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500 truncate w-full">
                        ID: {pack.id}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
