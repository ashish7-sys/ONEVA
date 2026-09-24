import { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Sliders,
  Sparkles,
  Layers,
  Palette,
  Check,
  Youtube,
  MessageCircle,
  Camera,
  Compass,
  CheckCircle2,
  Video as VideoIcon,
  Image as ImageIcon,
  Package,
} from 'lucide-react';
import { OnevaAsset } from '../../types/adminAssets';
import { ThemeService } from '../../services/themeService';
import { UserCustomizationService } from '../../services/userCustomizationService';
import { PlatformBridge } from '../../launcher/services/platformBridge';
import { AppCatalogService } from '../../services/appCatalogService';
import { ThemeAssetManager, ResolvedThemeComponents } from '../../services/themeAssetManager';

interface ThemeInteractivePreviewProps {
  asset: OnevaAsset;
  onThemeApplied?: () => void;
}

export function ThemeInteractivePreview({ asset }: ThemeInteractivePreviewProps) {
  const [screenMode, setScreenMode] = useState<'home' | 'lock'>('home');
  const [resolvedComponents, setResolvedComponents] = useState<ResolvedThemeComponents | null>(null);

  useEffect(() => {
    let isMounted = true;
    ThemeAssetManager.resolveThemeComponents(asset).then((comp) => {
      if (isMounted) {
        setResolvedComponents(comp);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [asset]);

  const themeDef = asset.assets?.themeDefinition;
  const accentColor = themeDef?.colors?.accent || asset.previewData?.color || '#06b6d4';
  const primaryBg =
    themeDef?.colors?.primary ||
    asset.previewData?.cssBackground ||
    'radial-gradient(circle at 50% 30%, #0f172a 0%, #030712 100%)';

  // Video vs Image wallpaper
  const isVideoWallpaper =
    resolvedComponents?.isLiveWallpaper ||
    asset.isLiveWallpaper ||
    asset.previewData?.mediaType === 'video' ||
    asset.payload?.mediaType === 'wallpaper_live' ||
    !!asset.previewData?.previewVideoUrl;

  const wallpaperMediaUrl: string | undefined =
    resolvedComponents?.wallpaperDataUrl ||
    asset.previewData?.previewVideoUrl ||
    asset.previewData?.previewUrl ||
    asset.previewData?.previewDataUrl ||
    (asset.payload?.wallpaperUrl as string | undefined);

  // Extracted icons from icon pack
  const extractedIcons: Record<string, string> = {
    ...((asset.payload?.extractedIcons as Record<string, string>) || {}),
    ...(((asset.previewData?.customData as any)?.extractedIcons as Record<string, string>) || {}),
    ...(resolvedComponents?.iconPackExtractedIcons || {}),
  };

  const defaultApps = [
    { name: 'YouTube', pkg: 'com.google.android.youtube', icon: Youtube, bg: '#ef4444' },
    { name: 'WhatsApp', pkg: 'com.whatsapp', icon: MessageCircle, bg: '#22c55e' },
    { name: 'Instagram', pkg: 'com.instagram.android', icon: Camera, bg: '#e1306c' },
    { name: 'Chrome', pkg: 'com.android.chrome', icon: Compass, bg: '#3b82f6' },
  ];

  return (
    <div className="w-full max-w-xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Screen Mode Selector & Component Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              PlatformBridge.performHapticFeedback('selection');
              setScreenMode('home');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition cursor-pointer ${
              screenMode === 'home'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md'
                : 'text-neutral-400 hover:text-white bg-black/40 border border-white/5'
            }`}
          >
            Home Screen Collage
          </button>
          <button
            type="button"
            onClick={() => {
              PlatformBridge.performHapticFeedback('selection');
              setScreenMode('lock');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition cursor-pointer ${
              screenMode === 'lock'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md'
                : 'text-neutral-400 hover:text-white bg-black/40 border border-white/5'
            }`}
          >
            Lock Screen Collage
          </button>
        </div>

        {/* Live Wallpaper indicator badge */}
        {isVideoWallpaper && (
          <div className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-extrabold flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>60FPS LIVE WALLPAPER</span>
          </div>
        )}
      </div>

      {/* Simulated Device Frame with Real Wallpaper Background */}
      <div
        className="w-full max-w-xs mx-auto rounded-[38px] border-4 border-neutral-700/80 overflow-hidden shadow-2xl relative p-5 aspect-[9/19] flex flex-col justify-between"
        style={{
          background: isVideoWallpaper || wallpaperMediaUrl ? '#000000' : primaryBg,
        }}
      >
        {/* Real Wallpaper Layer */}
        {wallpaperMediaUrl && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {isVideoWallpaper ? (
              <video
                src={wallpaperMediaUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={wallpaperMediaUrl}
                alt="Theme Wallpaper"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-black/35 backdrop-blur-[0.5px]" />
          </div>
        )}

        {/* Status Bar */}
        <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-white/90 pt-1 drop-shadow">
          <span className="font-semibold">10:45</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-cyan-300" />
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px]">100%</span>
          </div>
        </div>

        {/* Lock Screen vs Home Screen Content */}
        {screenMode === 'lock' ? (
          <div className="relative z-10 my-auto text-center space-y-3">
            <div className="text-5xl font-light tracking-tighter text-white font-mono drop-shadow-md">
              10:45
            </div>
            <div className="text-xs text-neutral-200 font-medium drop-shadow">
              Wednesday, October 14
            </div>
            <div
              className="w-10 h-1 mx-auto rounded-full mt-2"
              style={{ backgroundColor: accentColor }}
            />
            <div className="p-2.5 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-md max-w-[210px] mx-auto mt-6 text-left shadow-lg">
              <div className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>ONEVA THEME ACTIVE</span>
              </div>
              <div className="text-[9px] text-neutral-300 mt-0.5 truncate">
                {asset.name}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 my-auto space-y-4">
            {/* Widget Clock */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-md text-center shadow-lg">
              <div className="text-2xl font-light font-mono text-white">10:45 AM</div>
              <div className="text-[10px] text-neutral-300">San Francisco &bull; 72&deg;F Clear</div>
              <div
                className="w-12 h-0.5 mx-auto rounded-full mt-2"
                style={{ backgroundColor: accentColor }}
              />
            </div>

            {/* Genuine App Icons Grid with Extracted or Coordinated Icons */}
            <div className="grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-black/70 border border-white/15 backdrop-blur-md shadow-xl">
              {defaultApps.map((app, i) => {
                const Icon = app.icon;
                const customIconUrl = extractedIcons[app.pkg];

                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg border border-white/15 overflow-hidden"
                      style={{
                        background: customIconUrl
                          ? 'transparent'
                          : `linear-gradient(135deg, ${app.bg}40 0%, #000000 100%)`,
                        boxShadow: `0 4px 12px ${accentColor}25`,
                      }}
                    >
                      {customIconUrl ? (
                        <img
                          src={customIconUrl}
                          alt={app.name}
                          className="w-full h-full object-contain p-1"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Icon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span className="text-[9px] text-neutral-200 font-medium truncate w-full text-center drop-shadow">
                      {app.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* System UI Footer & Dock */}
        <div className="relative z-10 space-y-2">
          <div className="p-2 rounded-xl bg-black/70 border border-white/15 backdrop-blur-md flex items-center justify-between px-3 text-[10px] font-mono text-neutral-200 shadow-md">
            <span className="text-cyan-300 font-bold truncate max-w-[130px]">{asset.name}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
              <span className="text-neutral-300">Accent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Components Palette Breakdown (Requirement 9) */}
      <div className="p-4 rounded-2xl bg-neutral-950/80 border border-white/10 backdrop-blur-xl space-y-3 text-xs">
        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 pb-2 border-b border-white/5">
          <span className="uppercase tracking-wider">Coordinated Theme Components</span>
          <span className="text-cyan-400 font-bold">
            {Object.keys(extractedIcons).length > 0 ? `${Object.keys(extractedIcons).length} Apps Themed` : 'Coordinated'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-mono">
          <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
            <span className="text-neutral-400 block text-[9px]">WALLPAPER</span>
            <span className="text-white font-bold flex items-center justify-center gap-1 mt-0.5">
              {isVideoWallpaper ? (
                <>
                  <VideoIcon className="w-3 h-3 text-rose-400" />
                  <span>Live Video</span>
                </>
              ) : wallpaperMediaUrl ? (
                <>
                  <ImageIcon className="w-3 h-3 text-emerald-400" />
                  <span>OLED Static</span>
                </>
              ) : (
                'Palette Gradient'
              )}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
            <span className="text-neutral-400 block text-[9px]">ICON PACK</span>
            <span className="text-white font-bold flex items-center justify-center gap-1 mt-0.5">
              <Package className="w-3 h-3 text-cyan-400" />
              <span>
                {Object.keys(extractedIcons).length > 0
                  ? `${Object.keys(extractedIcons).length} Apps`
                  : themeDef?.iconPackId || 'Coordinated'}
              </span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
            <span className="text-neutral-400 block text-[9px]">LUMINANCE</span>
            <span className="text-white font-bold mt-0.5 block">
              {themeDef?.appearance?.luminance || 'Pure Black'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
            <span className="text-neutral-400 block text-[9px]">PRIORITY RATING</span>
            <span className="text-amber-400 font-bold mt-0.5 block">
              ★ {asset.rating || 10}/10
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

