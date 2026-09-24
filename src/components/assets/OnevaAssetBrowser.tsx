import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  FolderHeart,
  Plus,
  Layers,
  Image as ImageIcon,
  Palette,
  Keyboard as KeyboardIcon,
  Sliders,
  Shapes,
  Video,
} from 'lucide-react';
import { OnevaAsset, OnevaAssetCategory } from '../../types/adminAssets';
import { AdminAssetService } from '../../services/adminAssetService';
import {
  AssetClassificationService,
  BROWSING_CATEGORIES,
} from '../../services/assetClassificationService';
import { FavoritesService } from '../../services/favoritesService';
import { WallpaperService } from '../../services/wallpaperService';
import { UserCustomizationService } from '../../services/userCustomizationService';
import { AssetStorageService } from '../../services/assetStorageService';
import { IconPackValidator } from '../../services/iconPackValidator';
import { ThemeBundleValidator } from '../../services/themeBundleValidator';
import { SystemUIBundleValidator } from '../../services/systemUIBundleValidator';
import { AssetCard } from './AssetCard';
import { ImmersiveAssetPreviewModal } from './ImmersiveAssetPreviewModal';
import { PlatformBridge } from '../../launcher/services/platformBridge';

interface OnevaAssetBrowserProps {
  targetCategory?: OnevaAssetCategory;
  title?: string;
  subtitle?: string;
  allowUpload?: boolean;
}

const ASSET_TYPE_TABS: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all_types', label: 'All Customizations', icon: Layers },
  { id: 'wallpaper', label: 'Wallpapers', icon: ImageIcon },
  { id: 'live_wallpaper', label: 'Live Wallpapers', icon: Video },
  { id: 'icon_pack', label: 'Icon Packs', icon: Shapes },
  { id: 'theme', label: 'Themes', icon: Palette },
  { id: 'system_ui', label: 'System UI', icon: Sliders },
  { id: 'keyboard', label: 'Keyboard IME', icon: KeyboardIcon },
  { id: 'keyboard_background', label: 'Keyboard Wallpapers', icon: Sparkles },
];

export function OnevaAssetBrowser({
  targetCategory,
  title = 'Customization Hub',
  subtitle = 'Browse verified wallpapers, live engines, vector icon packs, themes, system UI, and tactile keyboard skins.',
  allowUpload = true,
}: OnevaAssetBrowserProps) {
  const [selectedAssetType, setSelectedAssetType] = useState<string>(targetCategory || 'all_types');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assets, setAssets] = useState<OnevaAsset[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(FavoritesService.getFavoriteIds());
  const [selectedAsset, setSelectedAsset] = useState<OnevaAsset | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadData = () => {
    let list: OnevaAsset[];
    if (targetCategory) {
      list = AdminAssetService.getPublishedAssets(targetCategory);
    } else {
      list = AdminAssetService.getAssets().filter(
        (a) => a.status === 'published' || a.isPrivateUserAsset
      );
    }
    setAssets(list);
    setFavoriteIds(new Set(FavoritesService.getFavoriteIds()));
  };

  useEffect(() => {
    reloadData();
    const unsubAdmin = AdminAssetService.subscribe(reloadData);
    const unsubFav = FavoritesService.subscribe(() => {
      setFavoriteIds(new Set(FavoritesService.getFavoriteIds()));
    });
    const unsubUser = UserCustomizationService.subscribe(reloadData);

    return () => {
      unsubAdmin();
      unsubFav();
      unsubUser();
    };
  }, [targetCategory]);

  // 1. Filter by Asset Type Tab
  const typeFiltered = useMemo(() => {
    if (targetCategory === 'wallpaper') {
      return assets.filter((a) => a.category === 'wallpaper' || a.category === 'live_wallpaper' || a.isLiveWallpaper);
    }
    if (targetCategory) {
      return assets.filter((a) => a.category === targetCategory);
    }
    if (selectedAssetType === 'all_types') {
      return assets;
    }
    if (selectedAssetType === 'live_wallpaper') {
      return assets.filter((a) => a.category === 'live_wallpaper' || a.isLiveWallpaper);
    }
    if (selectedAssetType === 'wallpaper') {
      return assets.filter((a) => a.category === 'wallpaper' || a.category === 'live_wallpaper' || a.isLiveWallpaper);
    }
    return assets.filter((a) => a.category === selectedAssetType);
  }, [assets, targetCategory, selectedAssetType]);

  // 2. Filter by category tags / favorites
  const categoryFiltered = useMemo(() => {
    return AssetClassificationService.filterAssets(typeFiltered, activeCategory, favoriteIds);
  }, [typeFiltered, activeCategory, favoriteIds]);

  // 3. Search query filter
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return categoryFiltered;
    const q = searchQuery.toLowerCase();
    return categoryFiltered.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.author && a.author.toLowerCase().includes(q))
    );
  }, [categoryFiltered, searchQuery]);

  // 4. Dynamic Sorting
  const displayAssets = useMemo(() => {
    return AssetClassificationService.sortAssets(searchFiltered, activeCategory);
  }, [searchFiltered, activeCategory]);

  // Reset pagination when category, tab, or search changes
  useEffect(() => {
    setVisibleCount(24);
  }, [selectedAssetType, activeCategory, searchQuery]);

  // Windowed / Paged assets to keep DOM fast even with thousands of assets
  const pagedAssets = useMemo(() => {
    return displayAssets.slice(0, visibleCount);
  }, [displayAssets, visibleCount]);

  // Infinite scroll observer for smooth automatic page expansion
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < displayAssets.length) {
          setVisibleCount((prev) => Math.min(prev + 24, displayAssets.length));
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, displayAssets.length]);

  // Handle asset upload (Supports Images, Videos, Live Wallpapers, and ZIP Bundles)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov)$/i);
    const isImage = file.type.startsWith('image/');
    const isZip =
      file.name.toLowerCase().endsWith('.zip') ||
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed';

    // Determine target category
    let uploadCategory: OnevaAssetCategory = 'wallpaper';
    if (targetCategory) {
      uploadCategory = targetCategory;
    } else if (selectedAssetType === 'live_wallpaper' || isVideo) {
      uploadCategory = 'live_wallpaper';
    } else if (selectedAssetType === 'keyboard_background') {
      uploadCategory = 'keyboard_background';
    } else if (selectedAssetType === 'keyboard') {
      uploadCategory = 'keyboard';
    } else if (selectedAssetType !== 'all_types') {
      uploadCategory = selectedAssetType as OnevaAssetCategory;
    }

    // 1. Handle ZIP Bundle Upload (Themes, Icon Packs, System UI)
    if (isZip) {
      try {
        if (uploadCategory === 'theme') {
          showToast(`Validating Theme ZIP bundle "${file.name}"...`);
          const res = await ThemeBundleValidator.validateThemeZip(file, file.name);
          if (!res.isValid || !res.themeDefinition) {
            showToast(`Theme ZIP validation error: ${res.errors.join(', ')}`);
            setIsUploading(false);
            return;
          }

          const reg = await AdminAssetService.registerValidatedTheme(
            res.themeDefinition,
            res,
            { fileName: file.name, status: 'published' }
          );

          if (reg.success && reg.asset) {
            await AssetStorageService.saveMedia(reg.asset.id, file, {
              dataUrl: res.wallpaperDataUrl || res.previewDataUrl,
              customName: cleanName,
            });
            setSelectedAsset(reg.asset);
            showToast(`Theme bundle "${reg.asset.name}" imported & verified!`);
            PlatformBridge.performHapticFeedback('confirm');
          } else {
            showToast(`Import failed: ${reg.error || 'Unknown error'}`);
          }
        } else if (uploadCategory === 'system_ui') {
          showToast(`Validating System UI ZIP bundle "${file.name}"...`);
          const res = await SystemUIBundleValidator.validateSystemUIZip(file, file.name);
          if (!res.isValid || !res.systemUiConfig) {
            showToast(`System UI ZIP validation error: ${res.errors.join(', ')}`);
            setIsUploading(false);
            return;
          }

          const reg = await AdminAssetService.registerValidatedSystemUI(
            res.systemUiConfig,
            res,
            { fileName: file.name, status: 'published' }
          );

          if (reg.success && reg.asset) {
            await AssetStorageService.saveMedia(reg.asset.id, file, {
              dataUrl: res.previewDataUrl,
              customName: cleanName,
            });
            setSelectedAsset(reg.asset);
            showToast(`System UI bundle "${reg.asset.name}" imported & verified!`);
            PlatformBridge.performHapticFeedback('confirm');
          } else {
            showToast(`Import failed: ${reg.error || 'Unknown error'}`);
          }
        } else {
          // Default ZIP: Icon Pack
          showToast(`Validating Icon Pack ZIP archive "${file.name}"...`);
          const res = await IconPackValidator.validateIconPackZip(file, file.name);
          if (!res.isValid || !res.manifest) {
            showToast(`Icon Pack ZIP error: ${res.errors.join(', ')}`);
            setIsUploading(false);
            return;
          }

          const reg = await AdminAssetService.registerValidatedIconPack(
            res.manifest,
            res,
            { fileName: file.name, status: 'published' }
          );

          if (reg.success && reg.asset) {
            await AssetStorageService.saveMedia(reg.asset.id, file, {
              dataUrl: res.previewDataUrl,
              customName: cleanName,
            });
            setSelectedAsset(reg.asset);
            showToast(`Icon Pack "${reg.asset.name}" (${res.iconCount} glyphs) imported!`);
            PlatformBridge.performHapticFeedback('confirm');
          } else {
            showToast(`Import failed: ${reg.error || 'Unknown error'}`);
          }
        }
      } catch (err: any) {
        console.error('ZIP import failed:', err);
        showToast(`Failed to parse ZIP bundle: ${err?.message || 'Archive error'}`);
      } finally {
        setIsUploading(false);
        if (fileUploadRef.current) fileUploadRef.current.value = '';
      }
      return;
    }

    // 2. Handle Image & Video Upload
    if (!isImage && !isVideo) {
      showToast('Please select a supported image (PNG, JPG, WebP, SVG), video (MP4, WebM), or .ZIP bundle.');
      setIsUploading(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawDataUrl = reader.result as string;

        // Generate downscaled thumbnail for smooth rendering
        const thumbUrl = isVideo
          ? rawDataUrl
          : await AssetStorageService.generateThumbnail(rawDataUrl, 480);

        // Register asset in AdminAssetService
        const newAsset = await AdminAssetService.createAsset({
          name: cleanName || 'Custom Personal Asset',
          category: uploadCategory,
          description: `Personal media imported to device (${uploadCategory.replace('_', ' ')}). Stored locally in IndexedDB.`,
          version: '1.0.0',
          status: 'published',
          author: 'Personal User',
          rating: 9,
          isPrivateUserAsset: true,
          isLiveWallpaper: uploadCategory === 'live_wallpaper' || Boolean(isVideo),
          previewData: {
            previewThumbnailUrl: thumbUrl,
            previewUrl: rawDataUrl,
            previewDataUrl: rawDataUrl,
            previewVideoUrl: isVideo ? rawDataUrl : undefined,
            mediaType: isVideo ? 'video' : 'image',
            color: '#06b6d4',
          },
          payload: {
            isCustomUserAsset: true,
            fileName: file.name,
            mimeType: file.type,
            assetUrl: rawDataUrl,
            wallpaperUrl: rawDataUrl,
          },
        });

        // Save binary file into IndexedDB using the generated asset ID
        await AssetStorageService.saveMedia(newAsset.id, file, {
          dataUrl: rawDataUrl,
          thumbnailUrl: thumbUrl,
          customName: cleanName,
        });

        if (uploadCategory === 'wallpaper') {
          WallpaperService.applyGalleryWallpaper(rawDataUrl, cleanName);
        }

        showToast(`Asset "${cleanName}" imported successfully.`);
        PlatformBridge.performHapticFeedback('confirm');
        setSelectedAsset(newAsset);
        setIsUploading(false);
        if (fileUploadRef.current) fileUploadRef.current.value = '';
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload failed:', err);
      showToast('Failed to process file. Please try another asset.');
      setIsUploading(false);
      if (fileUploadRef.current) fileUploadRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900/95 border border-cyan-500/40 text-cyan-200 text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Custom Uploads */}
      <input
        type="file"
        ref={fileUploadRef}
        onChange={handleFileUpload}
        accept="image/png,image/jpeg,image/webp,image/svg+xml,video/mp4,video/webm,.zip,application/zip,application/x-zip-compressed"
        className="hidden"
      />

      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets, glyphs, styles..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 backdrop-blur-md"
            />
          </div>

          {/* Upload Button */}
          {allowUpload && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                PlatformBridge.performHapticFeedback('selection');
                fileUploadRef.current?.click();
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-neutral-950 hover:brightness-110 font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-lg shadow-cyan-950/30 cursor-pointer shrink-0 disabled:opacity-50"
              title="Import image or live video from device"
            >
              <UploadCloud className="w-4 h-4 text-neutral-950" />
              <span className="hidden sm:inline">{isUploading ? 'Importing...' : 'Upload'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Asset Type Selector Bar (Requirement 1) */}
      {!targetCategory && (
        <div className="overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max p-1 bg-neutral-900/40 rounded-2xl border border-neutral-800/60 backdrop-blur-md">
            {ASSET_TYPE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedAssetType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    PlatformBridge.performHapticFeedback('selection');
                    setSelectedAssetType(tab.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-neutral-800 text-cyan-300 font-bold border border-cyan-500/40 shadow-md shadow-black/40'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-neutral-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Horizontal Category / Style Bar */}
      <div className="overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-2 min-w-max p-1.5 bg-neutral-900/60 rounded-2xl border border-neutral-800/80 backdrop-blur-md">
          {BROWSING_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  PlatformBridge.performHapticFeedback('selection');
                  setActiveCategory(cat.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-neutral-950 font-bold shadow-md shadow-cyan-950/40'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-neutral-400 px-1 font-mono">
        <span>
          Showing <strong className="text-white">{displayAssets.length}</strong> items in{' '}
          <strong className="text-cyan-400 capitalize">{activeCategory}</strong>
        </span>
        <span className="text-[11px] text-neutral-500">
          Priority: ★ Blue-Star Rating (10→1) &bull; Universal Preview
        </span>
      </div>

      {/* Visual Asset Cards Grid (Paged for high performance) */}
      {displayAssets.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {pagedAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onSelect={(selected) => setSelectedAsset(selected)}
              />
            ))}
          </div>

          {/* Load More sentinel and indicator */}
          {visibleCount < displayAssets.length && (
            <div className="flex flex-col items-center justify-center pt-2 pb-4">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => Math.min(prev + 24, displayAssets.length))}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-cyan-300 border border-neutral-800 hover:border-cyan-500/40 transition shadow-lg cursor-pointer"
              >
                Load More Assets ({visibleCount} of {displayAssets.length})
              </button>
              <div ref={loadMoreSentinelRef} className="h-6 w-full" />
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-neutral-900/40 border border-neutral-800 text-center space-y-3">
          <FolderHeart className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No assets found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {activeCategory === 'favorites'
              ? 'You have not saved any items in this category yet. Tap the heart icon on any card to save it.'
              : `No items found matching the current filters. Select "All Customizations" or tap Upload to add media.`}
          </p>
          {(activeCategory !== 'all' || selectedAssetType !== 'all_types') && (
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setSelectedAssetType('all_types');
              }}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-cyan-300 font-medium transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Immersive Fullscreen Preview Modal */}
      <ImmersiveAssetPreviewModal
        asset={selectedAsset}
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        onApplied={(applied) => {
          reloadData();
          showToast(`Applied "${applied.name}".`);
        }}
        onDeleted={(deletedId) => {
          AdminAssetService.deleteAsset(deletedId);
          reloadData();
          showToast('Personal asset removed.');
        }}
      />
    </div>
  );
}
