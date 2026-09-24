import { useState, useEffect, useRef } from 'react';
import {
  Star,
  Heart,
  Check,
  Sparkles,
  Wifi,
  Bluetooth,
  Volume2,
  Sun,
  Battery,
  Sliders,
  Youtube,
  MessageCircle,
  Camera as CameraIcon,
  Compass,
  MapPin,
  HardDrive,
  Phone,
  Image as ImageIcon,
  Radio,
  AlertTriangle,
} from 'lucide-react';
import { OnevaAsset } from '../../types/adminAssets';
import { FavoritesService } from '../../services/favoritesService';
import { UserCustomizationService } from '../../services/userCustomizationService';
import { PlatformBridge } from '../../launcher/services/platformBridge';
import { AssetStorageService } from '../../services/assetStorageService';
import { AssetCacheService, resolveDownloadableMediaUrl } from '../../services/assetCacheService';

interface AssetCardProps {
  asset: OnevaAsset;
  onSelect: (asset: OnevaAsset) => void;
  onQuickApply?: (asset: OnevaAsset) => void;
}

export function AssetCard({ asset, onSelect }: AssetCardProps) {
  const [isFav, setIsFav] = useState(FavoritesService.isFavorite(asset.id));
  const rating = asset.rating ?? 8;
  const isApplied = UserCustomizationService.isApplied(asset.category, asset.id);

  // Resolve media URL from previewData, payload, or AssetStorageService
  const [asyncMediaUrl, setAsyncMediaUrl] = useState<string | null>(null);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [hasMediaError, setHasMediaError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const rawDirectMedia =
    asset.previewData?.previewThumbnailUrl ||
    asset.previewData?.previewUrl ||
    asset.previewData?.previewVideoUrl ||
    asset.previewData?.previewDataUrl ||
    (asset.payload?.assetUrl as string) ||
    (asset.payload?.wallpaperUrl as string);

  const directMedia = resolveDownloadableMediaUrl(rawDirectMedia);

  const thumbnailFromCache = AssetCacheService.resolveCardThumbnail(asset);
  const storedMedia = AssetStorageService.getMediaSync(asset.id);
  const activeMediaUrl =
    asyncMediaUrl ||
    thumbnailFromCache ||
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

  // Video autoplay & viewport optimization: pause when scrolled off-screen
  useEffect(() => {
    if (!videoRef.current || !isVideo) return;
    const el = videoRef.current;
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              el.play().catch(() => {});
            } else {
              el.pause();
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
    } else {
      el.play().catch(() => {});
    }
    return () => {
      if (observer) observer.disconnect();
    };
  }, [isVideo, activeMediaUrl]);

  const isNew =
    new Date().getTime() - new Date(asset.createdAt || 0).getTime() < 1000 * 60 * 60 * 24 * 30 ||
    asset.autoCategories?.includes('new');

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    PlatformBridge.performHapticFeedback('selection');
    const newState = FavoritesService.toggleFavorite(asset.id);
    setIsFav(newState);
  };

  // Helper to render icon pack visual sample grid (Requirement 4)
  const renderIconPackCard = () => {
    const samples = asset.previewData?.sampleIcons || [
      { name: 'YouTube', label: 'YT', bg: '#ef4444', fg: '#ffffff', iconName: 'Youtube' },
      { name: 'WhatsApp', label: 'WA', bg: '#25d366', fg: '#ffffff', iconName: 'MessageCircle' },
      { name: 'Instagram', label: 'IG', bg: '#e1306c', fg: '#ffffff', iconName: 'Camera' },
      { name: 'Chrome', label: 'CR', bg: '#4285f4', fg: '#ffffff', iconName: 'Compass' },
      { name: 'Maps', label: 'MP', bg: '#34a853', fg: '#ffffff', iconName: 'MapPin' },
      { name: 'Drive', label: 'DR', bg: '#fbbc05', fg: '#ffffff', iconName: 'HardDrive' },
      { name: 'Phone', label: 'PH', bg: '#06b6d4', fg: '#ffffff', iconName: 'Phone' },
      { name: 'Camera', label: 'CA', bg: '#8b5cf6', fg: '#ffffff', iconName: 'Camera' },
      { name: 'Gallery', label: 'GL', bg: '#ec4899', fg: '#ffffff', iconName: 'Image' },
    ];

    const countLabel = asset.payload?.iconCount
      ? `${asset.payload.iconCount} icons matched`
      : asset.previewData?.glyphCount
      ? `${asset.previewData.glyphCount}+ vector glyphs`
      : '56 icons matched';

    return (
      <div
        className="w-full h-full p-2.5 flex flex-col items-center justify-between transition-transform duration-500 group-hover:scale-105"
        style={{
          background: `radial-gradient(circle at center, ${asset.previewData?.color || '#06b6d4'}20 0%, #030712 90%)`,
        }}
      >
        <div className="w-full flex justify-end">
          <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-cyan-300">
            {countLabel}
          </span>
        </div>

        {/* 3x3 Genuine App Icons Grid */}
        <div className="grid grid-cols-3 gap-2 p-2 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md shadow-2xl">
          {samples.slice(0, 9).map((sample, idx) => {
            return (
              <div
                key={idx}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-mono font-bold shadow-md border border-white/10 transition-transform group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${sample.bg}40 0%, #09090b 100%)`,
                  color: sample.fg || '#ffffff',
                }}
                title={sample.name}
              >
                {(sample as any).glyphUrl ? (
                  <img
                    src={(sample as any).glyphUrl}
                    alt={sample.name}
                    className="w-5 h-5 object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <>
                    {sample.label === 'YT' && <Youtube className="w-4 h-4 text-red-400" />}
                    {sample.label === 'WA' && <MessageCircle className="w-4 h-4 text-emerald-400" />}
                    {sample.label === 'IG' && <CameraIcon className="w-4 h-4 text-pink-400" />}
                    {sample.label === 'CR' && <Compass className="w-4 h-4 text-blue-400" />}
                    {sample.label === 'MP' && <MapPin className="w-4 h-4 text-green-400" />}
                    {sample.label === 'DR' && <HardDrive className="w-4 h-4 text-amber-400" />}
                    {sample.label === 'PH' && <Phone className="w-4 h-4 text-cyan-400" />}
                    {sample.label === 'CA' && <CameraIcon className="w-4 h-4 text-indigo-400" />}
                    {sample.label === 'GL' && <ImageIcon className="w-4 h-4 text-purple-400" />}
                    {!['YT', 'WA', 'IG', 'CR', 'MP', 'DR', 'PH', 'CA', 'GL'].includes(sample.label) && (
                      <span>{sample.label}</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="w-full text-center">
          <span className="text-[10px] font-mono text-neutral-400">Universal Vector Engine</span>
        </div>
      </div>
    );
  };

  // Helper to render Theme Collage Card (Requirement 5)
  const renderThemeCard = () => {
    const accentColor = asset.assets?.themeDefinition?.colors?.accent || asset.previewData?.color || '#06b6d4';
    const wpBg =
      asset.assets?.themeDefinition?.colors?.primary ||
      asset.previewData?.cssBackground ||
      'linear-gradient(180deg, #090d16 0%, #030712 100%)';

    const customIcons =
      asset.payload?.extractedIcons ||
      asset.previewData?.customData?.extractedIcons ||
      {};

    return (
      <div
        className="relative w-full h-full p-2.5 flex flex-col justify-between overflow-hidden transition-transform duration-500 group-hover:scale-105"
        style={{ background: activeMediaUrl ? '#000000' : wpBg }}
      >
        {/* Real Wallpaper Background if present */}
        {activeMediaUrl && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {isVideo ? (
              <video
                src={activeMediaUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={activeMediaUrl}
                alt="Theme Wallpaper"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />
          </div>
        )}

        {/* Upper slice: Wallpaper and Clock Preview */}
        <div className="relative z-10 p-2 rounded-xl bg-black/50 border border-white/15 backdrop-blur-md flex items-center justify-between shadow-md">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="text-xs font-mono font-bold text-white">10:45</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-300">
            <Wifi className="w-2.5 h-2.5" />
            <span>5G</span>
          </div>
        </div>

        {/* Middle slice: Themed App Icons Row */}
        <div className="relative z-10 flex items-center justify-center gap-2 p-2 rounded-2xl bg-black/70 border border-white/15 backdrop-blur-md shadow-lg">
          {['com.google.android.youtube', 'com.whatsapp', 'com.instagram.android', 'com.android.chrome'].map(
            (pkg, idx) => {
              const iconUrl = customIcons[pkg];
              const FallbackIcon =
                idx === 0
                  ? Youtube
                  : idx === 1
                  ? MessageCircle
                  : idx === 2
                  ? CameraIcon
                  : Compass;
              const fallbackColor =
                idx === 0
                  ? 'text-red-400 bg-red-950/60 border-red-500/30'
                  : idx === 1
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
                  : idx === 2
                  ? 'text-pink-400 bg-pink-950/60 border-pink-500/30'
                  : 'text-blue-400 bg-blue-950/60 border-blue-500/30';

              return (
                <div
                  key={pkg}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center overflow-hidden border ${
                    iconUrl ? 'border-white/10 bg-black/40' : fallbackColor
                  }`}
                >
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={pkg}
                      className="w-full h-full object-contain p-0.5"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <FallbackIcon className="w-3.5 h-3.5" />
                  )}
                </div>
              );
            }
          )}
        </div>

        {/* Lower slice: System UI quick widget preview */}
        <div className="relative z-10 p-1.5 rounded-xl bg-black/70 border border-white/15 backdrop-blur-md flex items-center justify-between px-3 text-[9px] font-mono text-neutral-300 shadow-md">
          <span className="text-cyan-300 font-semibold truncate max-w-[100px]">{asset.name}</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            <span>Theme</span>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render System UI Mockup Card (Requirement 6)
  const renderSystemUiCard = () => {
    const accent = asset.previewData?.color || '#06b6d4';
    return (
      <div className="w-full h-full p-3 flex flex-col justify-between bg-neutral-950 transition-transform duration-500 group-hover:scale-105">
        {/* Status Bar Mockup */}
        <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400 pb-2 border-b border-white/10">
          <span>10:45 AM</span>
          <div className="flex items-center gap-1 text-white">
            <Wifi className="w-2.5 h-2.5" />
            <Battery className="w-2.5 h-2.5 text-emerald-400" />
            <span>94%</span>
          </div>
        </div>

        {/* Quick Settings Tiles Mockup */}
        <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-black/70 border border-white/10">
          <div
            className="flex items-center gap-1.5 p-1.5 rounded-lg text-[9px] font-mono"
            style={{ background: `${accent}25`, border: `1px solid ${accent}60`, color: accent }}
          >
            <Wifi className="w-3 h-3" />
            <span className="font-bold">Wi-Fi</span>
          </div>
          <div
            className="flex items-center gap-1.5 p-1.5 rounded-lg text-[9px] font-mono"
            style={{ background: `${accent}25`, border: `1px solid ${accent}60`, color: accent }}
          >
            <Bluetooth className="w-3 h-3" />
            <span className="font-bold">Bluetooth</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg text-[9px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400">
            <Radio className="w-3 h-3" />
            <span>Hotspot</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg text-[9px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400">
            <Sun className="w-3 h-3" />
            <span>Torch</span>
          </div>
        </div>

        {/* Brightness & Volume Sliders Mockup */}
        <div className="space-y-1.5 p-2 rounded-xl bg-black/50 border border-white/10">
          <div className="flex items-center gap-2">
            <Sun className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            <div className="h-1.5 flex-1 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full w-3/4 rounded-full" style={{ backgroundColor: accent }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
            <div className="h-1.5 flex-1 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full w-1/2 rounded-full" style={{ backgroundColor: accent }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render Keyboard Layout Mockup Card (Requirement 7 & 8)
  const renderKeyboardCard = () => {
    const bg =
      asset.previewData?.previewDataUrl
        ? `url(${asset.previewData.previewDataUrl}) center/cover no-repeat`
        : asset.previewData?.cssBackground ||
          `radial-gradient(circle at center, ${asset.previewData?.color || '#06b6d4'}25 0%, #030712 95%)`;

    return (
      <div
        className="w-full h-full p-2.5 flex flex-col justify-between transition-transform duration-500 group-hover:scale-105"
        style={{ background: bg }}
      >
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/75 border border-white/10 text-cyan-300">
            Android IME
          </span>
          <span className="text-[9px] font-mono text-neutral-400">QWERTY</span>
        </div>

        {/* Realistic Keycap Rows */}
        <div className="p-2 rounded-2xl bg-black/70 border border-white/15 backdrop-blur-md space-y-1 shadow-2xl">
          {/* Row 1 */}
          <div className="flex justify-center gap-1 text-[8px] font-mono text-white">
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((k) => (
              <div
                key={k}
                className="w-4.5 h-5 rounded flex items-center justify-center bg-white/10 border border-white/10 shadow-sm"
              >
                {k}
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex justify-center gap-1 text-[8px] font-mono text-white">
            {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((k) => (
              <div
                key={k}
                className="w-4.5 h-5 rounded flex items-center justify-center bg-white/10 border border-white/10 shadow-sm"
              >
                {k}
              </div>
            ))}
          </div>

          {/* Row 3 */}
          <div className="flex justify-center gap-1 text-[8px] font-mono text-white">
            {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((k) => (
              <div
                key={k}
                className="w-4.5 h-5 rounded flex items-center justify-center bg-white/10 border border-white/10 shadow-sm"
              >
                {k}
              </div>
            ))}
          </div>

          {/* Space Bar Row */}
          <div className="flex justify-center gap-1 pt-0.5">
            <div className="h-4 w-28 rounded bg-white/15 border border-white/10 flex items-center justify-center text-[7px] font-mono text-neutral-300">
              SPACE
            </div>
            <div
              className="h-4 px-2 rounded flex items-center justify-center text-[7px] font-mono font-bold text-neutral-950"
              style={{ backgroundColor: asset.previewData?.color || '#06b6d4' }}
            >
              ENTER
            </div>
          </div>
        </div>

        <div className="text-center text-[9px] font-mono text-neutral-400">
          InputMethodService Keycaps
        </div>
      </div>
    );
  };

  // Helper to render Wallpaper / Live Wallpaper Card with Canonical Media
  const renderWallpaperCard = () => {
    // 1. VIDEO / LIVE WALLPAPER PREVIEW
    if (isVideo && activeMediaUrl) {
      return (
        <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
          {hasMediaError ? (
            <div className="flex flex-col items-center justify-center p-3 text-center text-neutral-400 gap-1.5">
              <AlertTriangle className="w-5 h-5 text-amber-400/80" />
              <span className="text-[11px] font-mono text-neutral-300 font-semibold">Preview unavailable</span>
              <span className="text-[9px] text-neutral-500">Video source corrupted or unreachable</span>
            </div>
          ) : (
            <>
              {!isMediaLoaded && (
                <div className="absolute inset-0 bg-neutral-950 flex items-center justify-center z-10">
                  <div className="w-5 h-5 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                </div>
              )}
              <video
                ref={videoRef}
                src={activeMediaUrl}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onLoadedData={() => setIsMediaLoaded(true)}
                onError={(e) => {
                  console.error(`[AssetCard] Video playback failed for "${asset.name}" (${asset.id}):`, e);
                  setHasMediaError(true);
                }}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  isMediaLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </>
          )}
        </div>
      );
    }

    // 2. STATIC IMAGE WALLPAPER PREVIEW
    if (activeMediaUrl && !isVideo) {
      return (
        <div className="relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center">
          {hasMediaError ? (
            <div className="flex flex-col items-center justify-center p-3 text-center text-neutral-400 gap-1.5">
              <AlertTriangle className="w-5 h-5 text-amber-400/80" />
              <span className="text-[11px] font-mono text-neutral-300 font-semibold">Preview unavailable</span>
              <span className="text-[9px] text-neutral-500">Asset media could not be loaded</span>
            </div>
          ) : (
            <>
              {!isMediaLoaded && (
                <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              )}
              <img
                src={activeMediaUrl}
                alt={asset.name}
                loading="lazy"
                onLoad={() => setIsMediaLoaded(true)}
                onError={(e) => {
                  console.error(`[AssetCard] Image failed to load for "${asset.name}" (${asset.id}):`, e);
                  setHasMediaError(true);
                }}
                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                  isMediaLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </>
          )}
        </div>
      );
    }

    // 2.5 AWAITING STORED MEDIA (Loading Shimmer)
    const isExpectingMedia = Boolean(
      (asset.previewData as any)?.hasStoredMedia ||
      (directMedia && directMedia.includes('...')) ||
      (asset.category === 'wallpaper' && !asset.previewData?.cssBackground) ||
      (asset.category === 'live_wallpaper' && !asset.previewData?.cssBackground)
    );

    if (isExpectingMedia && !activeMediaUrl && !hasMediaError) {
      return (
        <div className="relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center">
          <div className="absolute inset-0 bg-neutral-900 animate-pulse flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-cyan-400/40 border-t-cyan-400 rounded-full animate-spin" />
            <span className="text-[9px] font-mono text-neutral-400">Loading wallpaper media...</span>
          </div>
        </div>
      );
    }

    // 3. REACTIVE LIVE WALLPAPER PRESET WITHOUT VIDEO FILE (e.g. Jarvis Live Engine)
    if (isLive) {
      return (
        <div className="relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center">
          <div
            className="w-full h-full"
            style={{
              background: asset.previewData?.color
                ? `radial-gradient(circle at 50% 30%, ${asset.previewData.color}25 0%, #050a14 75%, #000000 100%)`
                : 'linear-gradient(180deg, #09090b 0%, #030712 100%)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full border border-cyan-400/40 bg-cyan-950/40 backdrop-blur-sm flex items-center justify-center animate-pulse">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
          </div>
        </div>
      );
    }

    // 4. OLED SWATCH / GRADIENT PRESET (Only when no real media file exists)
    return (
      <div className="relative w-full h-full overflow-hidden transition-transform duration-500 group-hover:scale-105">
        <div
          className="w-full h-full"
          style={{
            background:
              asset.previewData?.cssBackground ||
              (asset.previewData?.color
                ? `radial-gradient(circle at 50% 30%, ${asset.previewData.color} 0%, #050a14 75%, #000000 100%)`
                : 'linear-gradient(180deg, #1e1b4b 0%, #030712 100%)'),
          }}
        />
      </div>
    );
  };

  return (
    <div
      onClick={() => onSelect(asset)}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-neutral-900/60 border border-neutral-800/80 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/20 cursor-pointer text-left select-none active:scale-[0.98]"
    >
      {/* Artwork Focus Stage (Adapts by category) */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-neutral-950 flex items-center justify-center">
        {asset.category === 'icon_pack' && renderIconPackCard()}
        {asset.category === 'theme' && renderThemeCard()}
        {asset.category === 'system_ui' && renderSystemUiCard()}
        {(asset.category === 'keyboard' || asset.category === 'keyboard_background') && renderKeyboardCard()}
        {(asset.category === 'wallpaper' || asset.category === 'live_wallpaper') && renderWallpaperCard()}
        {!['icon_pack', 'theme', 'system_ui', 'keyboard', 'keyboard_background', 'wallpaper', 'live_wallpaper'].includes(
          asset.category
        ) && (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: asset.previewData?.color
                ? `radial-gradient(circle at center, ${asset.previewData.color}25 0%, #030712 80%)`
                : '#050a14',
            }}
          >
            <Sparkles className="w-8 h-8 text-cyan-400" />
          </div>
        )}

        {/* Top Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Blue Star Rating Badge */}
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 border border-blue-500/40 text-blue-300 text-[10px] font-mono font-bold backdrop-blur-md shadow-md"
              title={`Admin Blue-Star Rating: ${rating}/10`}
            >
              <Star className="w-3 h-3 fill-blue-400 text-blue-400" />
              <span>{rating}</span>
            </div>

            {isNew && !isLive && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-mono font-bold backdrop-blur-md">
                NEW
              </span>
            )}

            {asset.status === 'draft' && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[9px] font-mono font-bold backdrop-blur-md">
                DRAFT
              </span>
            )}
          </div>

          {/* Upper-Right Controls: LIVE Badge + Quick Favorite */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* LIVE Badge (strictly for video/live wallpapers, never for static images) */}
            {isLive && (
              <span className="px-2 py-0.5 rounded-md bg-rose-600/95 text-white border border-rose-400/60 text-[10px] font-mono font-extrabold tracking-wider shadow-lg flex items-center gap-1 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                LIVE
              </span>
            )}

            {/* Quick Favorite Heart Button */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition active:scale-90 border shadow-md cursor-pointer ${
                isFav
                  ? 'bg-rose-500/30 border-rose-500/60 text-rose-300'
                  : 'bg-black/60 border-white/15 text-neutral-300 hover:text-white hover:bg-black/80'
              }`}
              title={isFav ? 'Remove favorite' : 'Add to favorites'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-400 text-rose-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Applied Tag / Bottom Pill */}
        {isApplied && (
          <div className="absolute bottom-2 left-2 right-2 flex justify-center pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-neutral-950 text-[10px] font-mono font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm">
              <Check className="w-3 h-3 stroke-[3]" /> APPLIED
            </span>
          </div>
        )}
      </div>

      {/* Card Info Footer */}
      <div className="p-3 space-y-1 bg-neutral-950/80 backdrop-blur-md border-t border-neutral-800/60">
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-xs font-bold text-white tracking-tight truncate group-hover:text-cyan-300 transition">
            {asset.name}
          </h3>
        </div>
        <p className="text-[10px] text-neutral-400 truncate">
          {asset.description || 'Verified ONEVA calibration'}
        </p>
      </div>
    </div>
  );
}
