import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Phone,
  MessageSquare,
  Globe,
  Camera,
  Search,
} from 'lucide-react';
import { OnevaAsset } from '../types/adminAssets';
import { AdminAssetService } from '../services/adminAssetService';
import { CatalogAppIcon } from './CatalogAppIcon';
import { AppCatalogService } from '../services/appCatalogService';

interface ThemeCardPreviewProps {
  themeAsset: OnevaAsset;
  className?: string;
  interactive?: boolean;
}

// Representative core apps to show on the realistic preview home screen
const PREVIEW_APPS = [
  { name: 'Phone', pkg: 'com.google.android.dialer', icon: Phone, color: 'text-emerald-400 bg-emerald-500/20' },
  { name: 'Messages', pkg: 'com.google.android.apps.messaging', icon: MessageSquare, color: 'text-sky-400 bg-sky-500/20' },
  { name: 'Chrome', pkg: 'com.android.chrome', icon: Globe, color: 'text-amber-400 bg-amber-500/20' },
  { name: 'Camera', pkg: 'com.google.android.GoogleCamera', icon: Camera, color: 'text-rose-400 bg-rose-500/20' },
];

export function ThemeCardPreview({ themeAsset, className = '' }: ThemeCardPreviewProps) {
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [extractedIcons, setExtractedIcons] = useState<Record<string, string>>({});
  const [accentColor, setAccentColor] = useState('#06b6d4');

  useEffect(() => {
    let isMounted = true;

    // 1. Resolve Wallpaper
    const wpId: string | undefined =
      (themeAsset.payload?.wallpaperAssetId as string) ||
      (themeAsset.payload?.wallpaperId as string) ||
      (themeAsset.assets?.themeDefinition?.wallpaperId as string) ||
      undefined;

    let wpUrl =
      themeAsset.previewData?.previewUrl ||
      themeAsset.previewData?.previewDataUrl ||
      (themeAsset.payload?.wallpaperUrl as string) ||
      null;

    let live =
      Boolean(themeAsset.isLiveWallpaper) ||
      themeAsset.category === 'live_wallpaper' ||
      themeAsset.payload?.mediaType === 'wallpaper_live';

    if (wpId) {
      const wpAsset = AdminAssetService.getAssetById(wpId);
      if (wpAsset) {
        if (wpAsset.previewData?.previewUrl || wpAsset.previewData?.previewDataUrl) {
          wpUrl = wpAsset.previewData.previewUrl || wpAsset.previewData.previewDataUrl || wpUrl;
        }
        live = live || Boolean(wpAsset.isLiveWallpaper) || wpAsset.category === 'live_wallpaper';
      }
    }

    // 2. Resolve Icon Pack
    const ipId: string | undefined =
      (themeAsset.payload?.iconPackAssetId as string) ||
      (themeAsset.payload?.iconPackId as string) ||
      (themeAsset.assets?.themeDefinition?.iconPackId as string) ||
      undefined;

    let icons: Record<string, string> = {
      ...((themeAsset.payload?.extractedIcons as Record<string, string>) || {}),
      ...(((themeAsset.previewData?.customData as any)?.extractedIcons as Record<string, string>) || {}),
    };

    if (ipId) {
      const ipAsset = AdminAssetService.getAssetById(ipId);
      if (ipAsset) {
        const ipIcons =
          ipAsset.assets?.extractedIcons ||
          (ipAsset.payload?.extractedIcons as Record<string, string>) ||
          ((ipAsset.previewData?.customData as any)?.extractedIcons as Record<string, string>) ||
          {};
        icons = { ...icons, ...ipIcons };
      }
    }

    const accent =
      themeAsset.assets?.themeDefinition?.colors?.accent ||
      (themeAsset.payload?.accentColor as string) ||
      themeAsset.previewData?.color ||
      '#06b6d4';

    if (isMounted) {
      setWallpaperUrl(wpUrl);
      setIsLive(live);
      setExtractedIcons(icons);
      setAccentColor(accent);
    }

    return () => {
      isMounted = false;
    };
  }, [themeAsset]);

  return (
    <div
      className={`relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-neutral-950 border border-white/10 shadow-inner flex flex-col justify-between p-2.5 select-none ${className}`}
    >
      {/* Real Wallpaper Layer */}
      {wallpaperUrl ? (
        <div className="absolute inset-0 z-0 overflow-hidden">
          {isLive && wallpaperUrl.endsWith('.mp4') ? (
            <video
              src={wallpaperUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={wallpaperUrl}
              alt={themeAsset.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          )}
          {/* Subtle vignette for contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
        </div>
      ) : (
        /* OLED True Black fallback */
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#060c18] via-[#02050c] to-black" />
      )}

      {/* Top Status Bar */}
      <div className="relative z-10 flex items-center justify-between text-[9px] text-white/80 font-mono px-1">
        <span>09:41</span>
        <div className="flex items-center gap-1">
          <Wifi className="w-2.5 h-2.5 text-white/70" />
          <Battery className="w-2.5 h-2.5 text-white/70" />
        </div>
      </div>

      {/* Center Search Widget & Clock composition */}
      <div className="relative z-10 my-auto text-center space-y-2">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md font-mono">
          09:41
        </div>
        <div className="text-[9px] text-white/70 font-mono tracking-wider uppercase drop-shadow">
          Wednesday, Sep 23
        </div>

        {/* Minimal Search Pill */}
        <div className="mx-2 py-1 px-2 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center gap-1.5 text-[9px] text-white/60">
          <Search className="w-2.5 h-2.5 text-white/50" />
          <span className="truncate">Search apps...</span>
        </div>
      </div>

      {/* Bottom App Dock: Real vector/pack icons */}
      <div className="relative z-10 pt-2 pb-1">
        <div className="p-1.5 rounded-2xl bg-black/50 backdrop-blur-md border border-white/15 grid grid-cols-4 gap-1.5 items-center justify-items-center">
          {PREVIEW_APPS.map((app) => {
            const iconUrl = extractedIcons[app.pkg.toLowerCase()];
            const appDef = AppCatalogService.getAppByPackage(app.pkg);

            return (
              <div key={app.pkg} className="flex flex-col items-center gap-0.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl overflow-hidden flex items-center justify-center bg-black/40 border border-white/10 shadow-sm">
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={app.name}
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : appDef ? (
                    <CatalogAppIcon app={appDef} size="sm" showFallbackBadge={false} />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${app.color}`}>
                      <app.icon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Wallpaper Pill Indicator */}
      {isLive && (
        <div className="absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded-md bg-rose-500/80 backdrop-blur-md text-white text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>LIVE</span>
        </div>
      )}
    </div>
  );
}
