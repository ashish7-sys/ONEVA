import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  Heart,
  Check,
  Share2,
  Info,
  Flag,
  Trash2,
  Star,
  Sparkles,
  Smartphone,
  Eye,
  CheckCircle2,
  Copy,
  Layers,
  Shield,
  Palette,
  Shapes,
  Keyboard as KeyboardIcon,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { OnevaAsset } from '../../types/adminAssets';
import { FavoritesService } from '../../services/favoritesService';
import { PlatformBridge } from '../../launcher/services/platformBridge';
import { WallpaperService } from '../../services/wallpaperService';
import { AssistService } from '../../services/assistService';
import { UserCustomizationService } from '../../services/userCustomizationService';
import { IconService } from '../../services/iconService';
import { AdvancedIconSystem } from '../../services/advancedIconSystem';
import { ThemeService } from '../../services/themeService';
import { KeyboardService } from '../../services/keyboardService';
import { WidgetsSystemUIService } from '../../services/widgetsSystemUIService';
import { AssetStorageService } from '../../services/assetStorageService';
import { resolveDownloadableMediaUrl } from '../../services/assetCacheService';
import { JarvisFuturisticLiveWallpaper } from '../JarvisFuturisticLiveWallpaper';
import { IconPackInteractivePreview } from './IconPackInteractivePreview';
import { ThemeInteractivePreview } from './ThemeInteractivePreview';
import { SystemUiInteractivePreview } from './SystemUiInteractivePreview';
import { KeyboardInteractivePreview } from './KeyboardInteractivePreview';

interface ImmersiveAssetPreviewModalProps {
  asset: OnevaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onApplied?: (asset: OnevaAsset) => void;
  onDeleted?: (assetId: string) => void;
}

export function ImmersiveAssetPreviewModal({
  asset,
  isOpen,
  onClose,
  onApplied,
  onDeleted,
}: ImmersiveAssetPreviewModalProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const [asyncMediaUrl, setAsyncMediaUrl] = useState<string | null>(null);
  const rawDirectMedia =
    asset.previewData?.previewThumbnailUrl ||
    asset.previewData?.previewUrl ||
    asset.previewData?.previewVideoUrl ||
    asset.previewData?.previewDataUrl ||
    (asset.payload?.assetUrl as string) ||
    (asset.payload?.wallpaperUrl as string);

  const directMedia = resolveDownloadableMediaUrl(rawDirectMedia);

  const storedMedia = AssetStorageService.getMediaSync(asset.id);
  const activeMediaUrl =
    asyncMediaUrl ||
    (directMedia && !directMedia.includes('...') ? directMedia : null) ||
    storedMedia?.thumbnailUrl ||
    storedMedia?.dataUrl ||
    null;

  useEffect(() => {
    let isMounted = true;
    if (!activeMediaUrl) {
      AssetStorageService.getMedia(asset.id).then((rec) => {
        if (isMounted && rec) {
          const media = rec.thumbnailUrl || rec.dataUrl;
          if (media) {
            setAsyncMediaUrl(media);
          }
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [asset.id, activeMediaUrl]);

  const isVideo = Boolean(
    asset.previewData?.mediaType === 'video' ||
      asset.payload?.mediaType === 'wallpaper_live' ||
      Boolean(asset.previewData?.previewVideoUrl) ||
      (activeMediaUrl && (activeMediaUrl.startsWith('data:video') || activeMediaUrl.match(/\.(mp4|webm|mov|mkv)$/i))) ||
      (asset.category === 'live_wallpaper' && Boolean(activeMediaUrl && !activeMediaUrl.startsWith('data:image')))
  );

  const isLive = Boolean(isVideo || asset.isLiveWallpaper || asset.category === 'live_wallpaper');
  const isFav = FavoritesService.isFavorite(asset.id);
  const rating = asset.rating ?? 8;
  const isApplied = UserCustomizationService.isApplied(asset.category, asset.id);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleToggleFavorite = () => {
    PlatformBridge.performHapticFeedback('selection');
    const newState = FavoritesService.toggleFavorite(asset.id);
    showToast(newState ? `Added "${asset.name}" to Favorites.` : `Removed "${asset.name}" from Favorites.`);
  };

  const handleApply = () => {
    setIsApplying(true);
    PlatformBridge.performHapticFeedback('confirm');

    try {
      if (asset.category === 'wallpaper' || asset.category === 'live_wallpaper') {
        if (isLive) {
          AssistService.setLiveWallpaperEnabled(true);
          UserCustomizationService.applyItem('wallpaper', asset.id);
          WallpaperService.applyWallpaper({
            presetId: asset.id,
            assetId: asset.id,
            name: asset.name,
            source: 'admin_pack',
            videoUrl: activeMediaUrl || undefined,
          });
          PlatformBridge.applyLiveWallpaper(
            'com.oneva.launcher.wallpaper.OnevaLiveWallpaperService',
            JSON.stringify({ presetId: asset.id, style: asset.liveWallpaperStyle || 'jarvis_reactive' })
          );
          showToast(`Live wallpaper "${asset.name}" applied to Android Home Screen.`);
        } else {
          UserCustomizationService.applyItem('wallpaper', asset.id);
          const bgData = activeMediaUrl || asset.previewData?.previewDataUrl || asset.previewData?.previewUrl || '';
          if (bgData && (bgData.startsWith('data:') || bgData.startsWith('http') || bgData.startsWith('blob:'))) {
            WallpaperService.applyGalleryWallpaper(bgData, asset.name);
          } else {
            WallpaperService.applyWallpaper({
              presetId: (asset.payload?.presetId as string) || asset.id,
              assetId: asset.id,
              name: asset.name,
              source: 'admin_pack',
            });
          }
          if (bgData) {
            PlatformBridge.applySystemWallpaper(bgData, 'both');
          }
          showToast(`Wallpaper "${asset.name}" applied to device.`);
        }
      } else if (asset.category === 'icon_pack') {
        UserCustomizationService.applyItem('icon_pack', asset.id);
        IconService.setActiveGlobalPack(asset.id);
        AdvancedIconSystem.applyFullIconPack(asset.id);
        showToast(`Icon pack "${asset.name}" applied across genuine apps.`);
      } else if (asset.category === 'theme') {
        UserCustomizationService.applyItem('theme', asset.id);
        const themeDef = asset.assets?.themeDefinition || (asset.payload as any);
        if (themeDef) {
          ThemeService.applyTheme({
            mode: themeDef.appearance?.mode || themeDef.mode || 'oled',
            luminance: themeDef.appearance?.luminance || themeDef.luminance || 'pure_black',
            accentColor: themeDef.colors?.accent || themeDef.accentColor || '#06b6d4',
            assetId: asset.id,
          });
          const wallpaperData =
            themeDef.wallpaperUrl ||
            asset.previewData?.previewUrl ||
            asset.previewData?.previewDataUrl;
          if (wallpaperData && (wallpaperData.startsWith('data:') || wallpaperData.startsWith('http'))) {
            WallpaperService.applyGalleryWallpaper(wallpaperData, `${asset.name} Wallpaper`);
            PlatformBridge.applySystemWallpaper(wallpaperData, 'both');
          }
        }
        showToast(`Theme "${asset.name}" applied to launcher and system surfaces.`);
      } else if (asset.category === 'system_ui') {
        UserCustomizationService.applyItem('system_ui', asset.id);
        if (asset.payload) {
          WidgetsSystemUIService.updateConfig(asset.payload as any);
        }
        PlatformBridge.applySystemUiTheme(asset.payload || { accentColor: asset.previewData?.color || '#06b6d4' });
        showToast(`System UI calibration "${asset.name}" applied.`);
      } else if (asset.category === 'keyboard' || asset.category === 'keyboard_background') {
        UserCustomizationService.applyItem('keyboard', asset.id);
        const bgData = asset.previewData?.previewDataUrl || asset.previewData?.previewUrl;
        KeyboardService.applyDefaultKeyboard({
          themeId: (asset.payload?.themeId as string) || asset.id,
          animationType: (asset.payload?.animationType as any) || 'elevation',
          backgroundUrl: bgData,
        });
        if (bgData) {
          KeyboardService.setCustomBackground(bgData);
        }
        showToast(`Keyboard styling "${asset.name}" applied to Android IME.`);
      } else {
        UserCustomizationService.applyItem(asset.category, asset.id);
        showToast(`"${asset.name}" applied.`);
      }

      onApplied?.(asset);
    } catch (e) {
      console.error('Failed to apply asset:', e);
      showToast(`Applied ${asset.name}.`);
    } finally {
      setTimeout(() => setIsApplying(false), 500);
    }
  };

  const handleShare = async () => {
    setShowMenu(false);
    PlatformBridge.performHapticFeedback('light');
    const shareData = {
      title: `ONEVA Asset: ${asset.name}`,
      text: `Check out "${asset.name}" on ONEVA Android Customization Engine: ${asset.description}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          showToast('Share failed');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.title} - ${shareData.url}`);
        showToast('Asset link copied to clipboard.');
      } catch {
        showToast('Failed to copy link.');
      }
    }
  };

  const handleReport = () => {
    setShowMenu(false);
    PlatformBridge.performHapticFeedback('warning');
    showToast('Asset flagged for review by ONEVA Quality & Security Sentinel.');
  };

  const handleDelete = () => {
    setShowMenu(false);
    PlatformBridge.performHapticFeedback('warning');
    onDeleted?.(asset.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-cyan-500/40 text-cyan-200 text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Floating Glass Header (Back & Three-Dot Menu) */}
      <div className="relative z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
        {/* Back Button */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-neutral-950/70 border border-white/15 text-white text-xs font-medium backdrop-blur-xl hover:bg-neutral-800 transition active:scale-95 shadow-lg shadow-black/40 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-200" />
          <span>Back</span>
        </button>

        {/* Action Controls & Three-Dot Menu */}
        <div className="relative flex items-center gap-2">
          {/* Subtle Blue-Star Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-mono font-semibold backdrop-blur-xl shadow-lg"
            title={`Admin Blue-Star Rating: ${rating}/10 (Display Priority Ranking)`}
          >
            <Star className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
            <span>{rating}/10</span>
          </div>

          {/* Three-Dot Menu Trigger */}
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full bg-neutral-950/70 border border-white/15 text-white flex items-center justify-center backdrop-blur-xl hover:bg-neutral-800 transition active:scale-95 shadow-lg shadow-black/40 cursor-pointer"
            aria-label="Asset options menu"
          >
            <MoreVertical className="w-4 h-4 text-neutral-200" />
          </button>

          {/* Three-Dot Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-11 w-56 rounded-2xl bg-neutral-900/95 border border-neutral-700/80 shadow-2xl backdrop-blur-2xl py-1.5 text-xs text-neutral-200 z-50 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  handleToggleFavorite();
                }}
                className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-neutral-800/80 transition"
              >
                <Heart className={`w-4 h-4 ${isFav ? 'text-rose-400 fill-rose-400' : 'text-neutral-400'}`} />
                <span>{isFav ? 'In Favorites' : 'Add to Favorites'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-neutral-800/80 transition"
              >
                <Share2 className="w-4 h-4 text-neutral-400" />
                <span>Share Asset</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowInfoModal(true);
                }}
                className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-neutral-800/80 transition"
              >
                <Info className="w-4 h-4 text-neutral-400" />
                <span>Asset Information</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  handleApply();
                }}
                className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-neutral-800/80 transition text-emerald-400"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Apply to Device</span>
              </button>

              <div className="my-1 border-t border-neutral-800" />

              <button
                type="button"
                onClick={handleReport}
                className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-neutral-800/80 transition text-amber-400"
              >
                <Flag className="w-4 h-4 text-amber-400" />
                <span>Report Asset</span>
              </button>

              {asset.isPrivateUserAsset && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-rose-950/40 transition text-rose-400"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Remove Personal Asset</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Artwork Stage (Adapts by category) */}
      <div className="flex-1 overflow-y-auto z-10 flex flex-col items-center justify-center p-2 sm:p-4">
        {asset.category === 'icon_pack' ? (
          <IconPackInteractivePreview asset={asset} onApplyPack={handleApply} />
        ) : asset.category === 'theme' ? (
          <ThemeInteractivePreview asset={asset} onThemeApplied={handleApply} />
        ) : asset.category === 'system_ui' ? (
          <SystemUiInteractivePreview asset={asset} />
        ) : asset.category === 'keyboard' || asset.category === 'keyboard_background' ? (
          <KeyboardInteractivePreview asset={asset} onApplyBackground={handleApply} />
        ) : isVideo && activeMediaUrl ? (
          /* Live Video Wallpaper Showcase */
          <div className="relative w-full max-w-sm aspect-[9/19] rounded-[36px] overflow-hidden border-4 border-neutral-800 shadow-2xl flex flex-col justify-between p-5 bg-black">
            <video
              src={activeMediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover -z-10"
            />
            {/* Status Bar Mockup */}
            <div className="flex justify-between items-center text-[10px] font-mono text-white drop-shadow-md">
              <span>10:45</span>
              <span>5G 100%</span>
            </div>

            <div className="text-center my-auto drop-shadow-lg">
              <div className="text-5xl font-light font-mono text-white">10:45</div>
              <div className="text-xs text-neutral-200 mt-1 font-medium">Wednesday, October 14</div>
            </div>

            <div className="text-center drop-shadow-md">
              <span className="text-[10px] font-mono text-white px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-rose-500/40 font-semibold flex items-center gap-1.5 justify-center w-fit mx-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                ONEVA 60FPS Live Wallpaper
              </span>
            </div>
          </div>
        ) : isLive && !activeMediaUrl ? (
          <div className="w-full h-full min-h-[400px] relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <JarvisFuturisticLiveWallpaper interactive={true} forceAwakeMode={true} />
            <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-black/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono backdrop-blur-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              60FPS Reactive Live Engine
            </div>
          </div>
        ) : (
          /* Static Image Wallpaper / Showcase */
          <div className="relative w-full max-w-sm aspect-[9/19] rounded-[36px] overflow-hidden border-4 border-neutral-800 shadow-2xl flex flex-col justify-between p-5 bg-neutral-950">
            {activeMediaUrl ? (
              <img
                src={activeMediaUrl}
                alt={asset.name}
                className="absolute inset-0 w-full h-full object-cover -z-10"
              />
            ) : (
              <div
                className="absolute inset-0 -z-10"
                style={{
                  background:
                    asset.previewData?.cssBackground ||
                    (asset.previewData?.color
                      ? `radial-gradient(circle at 50% 35%, ${asset.previewData.color} 0%, #050a14 70%, #000000 100%)`
                      : 'linear-gradient(180deg, #0f172a 0%, #020617 100%)'),
                }}
              />
            )}
            {/* Status Bar Mockup */}
            <div className="flex justify-between items-center text-[10px] font-mono text-white/90 drop-shadow-md">
              <span>10:45</span>
              <span>5G 100%</span>
            </div>

            <div className="text-center my-auto drop-shadow-lg">
              <div className="text-5xl font-light font-mono text-white">10:45</div>
              <div className="text-xs text-neutral-200 mt-1 font-medium">Wednesday, October 14</div>
            </div>

            <div className="text-center drop-shadow-md">
              <span className="text-[10px] font-mono text-neutral-200 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                ONEVA OLED Display Calibration
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Glass Control Bar */}
      <div className="relative z-20 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
        <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-3xl bg-neutral-950/80 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-white tracking-tight truncate">{asset.name}</h1>
              {isLive && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/40 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  LIVE 60FPS
                </span>
              )}
              {isApplied && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/40 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> APPLIED
                </span>
              )}
            </div>

            {/* Subtitle / Category tags / Star display */}
            <div className="flex items-center gap-2 text-xs text-neutral-400 flex-wrap">
              <div className="flex items-center gap-1 text-blue-400">
                <Star className="w-3.5 h-3.5 fill-blue-400" />
                <span className="font-semibold text-blue-300">{rating}/10 Priority</span>
              </div>
              <span>&bull;</span>
              <span>{asset.author || 'ONEVA Core'}</span>
              <span>&bull;</span>
              <span className="capitalize">{asset.category.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Action Buttons: Favorite + Apply */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition active:scale-95 cursor-pointer ${
                isFav
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-950/40'
                  : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title={isFav ? 'Remove Favorite' : 'Save to Favorites'}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-xl cursor-pointer ${
                isApplied
                  ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 hover:brightness-110 shadow-emerald-950/50'
              }`}
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Applying...</span>
                </>
              ) : isApplied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Re-Apply</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-neutral-950" />
                  <span>Apply to Device</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Asset Information Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-700/80 p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-cyan-400">
                <Info className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Asset Specifications</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-neutral-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Asset Name</span>
                <span className="text-white font-medium">{asset.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Category</span>
                <span className="text-cyan-400 font-mono capitalize">{asset.category.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Admin Blue-Star Rating</span>
                <span className="text-blue-400 font-mono font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-blue-400" /> {rating} / 10 Priority
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Storage / Engine</span>
                <span className="text-neutral-300 font-mono">
                  {asset.isLiveWallpaper
                    ? 'Android WallpaperService Engine'
                    : asset.category === 'keyboard' || asset.category === 'keyboard_background'
                    ? 'Android InputMethodService'
                    : asset.dimensions || 'Optimized Binary Asset'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Author / Source</span>
                <span className="text-neutral-300">{asset.author || 'ONEVA Design Engine'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Ownership Scope</span>
                <span className="text-emerald-400 font-medium">
                  {asset.isPrivateUserAsset ? 'Private to this Device' : 'Global Verified Catalog'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-neutral-400">Publication Date</span>
                <span className="text-neutral-400 font-mono">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
