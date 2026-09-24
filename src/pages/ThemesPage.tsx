import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Filter,
  Check,
  Plus,
  Info,
  ShieldCheck,
  Video,
  Star,
  Shapes,
  Image as ImageIcon,
} from 'lucide-react';
import { AdminAssetService } from '../services/adminAssetService';
import { ThemeEngineService, ThemeApplyReport } from '../services/themeEngineService';
import { OnevaAsset } from '../types/adminAssets';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { ThemeCardPreview } from '../components/ThemeCardPreview';
import { ThemeBundleDetailModal } from '../components/ThemeBundleDetailModal';
import { NavigationBus } from '../navigation/navigationBus';

interface ThemesPageProps {
  onNavigateBack?: () => void;
}

type ThemeFilterId =
  | 'all'
  | 'featured'
  | 'new'
  | 'live_wallpaper'
  | 'wallpaper_icons'
  | 'complete';

export function ThemesPage({ onNavigateBack }: ThemesPageProps) {
  const [themes, setThemes] = useState<OnevaAsset[]>([]);
  const [activeThemeId, setActiveThemeId] = useState<string>(
    () => ThemeEngineService.getSettings().activeThemeId
  );
  const [selectedFilter, setSelectedFilter] = useState<ThemeFilterId>('all');
  const [selectedTheme, setSelectedTheme] = useState<OnevaAsset | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadThemes = () => {
    const published = AdminAssetService.getPublishedAssets('theme');
    setThemes(published);
    setActiveThemeId(ThemeEngineService.getSettings().activeThemeId);
  };

  useEffect(() => {
    loadThemes();
    const unsubAdmin = AdminAssetService.subscribe(loadThemes);
    const unsubEngine = ThemeEngineService.subscribe(() => {
      setActiveThemeId(ThemeEngineService.getSettings().activeThemeId);
    });

    return () => {
      unsubAdmin();
      unsubEngine();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Resolve components for filtering & badges
  const enrichedThemes = useMemo(() => {
    const allAssets = AdminAssetService.getAssets();

    return themes.map((theme) => {
      const wpId =
        theme.payload?.wallpaperAssetId ||
        theme.payload?.wallpaperId ||
        theme.assets?.themeDefinition?.wallpaperAssetId ||
        theme.assets?.themeDefinition?.wallpaperId;

      const ipId =
        theme.payload?.iconPackAssetId ||
        theme.payload?.iconPackId ||
        theme.assets?.themeDefinition?.iconPackAssetId ||
        theme.assets?.themeDefinition?.iconPackId;

      const sysUiId =
        theme.payload?.systemUiAssetId ||
        theme.assets?.themeDefinition?.systemUiAssetId;

      const kbId =
        theme.payload?.keyboardAssetId ||
        theme.payload?.keyboardId ||
        theme.assets?.themeDefinition?.keyboardAssetId ||
        theme.assets?.themeDefinition?.keyboardId;

      const wpAsset = wpId ? allAssets.find((a) => a.id === wpId) : undefined;
      const ipAsset = ipId ? allAssets.find((a) => a.id === ipId) : undefined;

      const hasWallpaper = Boolean(
        wpId ||
        theme.previewData?.previewUrl ||
        theme.previewData?.previewDataUrl ||
        theme.payload?.wallpaperUrl
      );

      const hasIcons = Boolean(
        ipId ||
        (theme.payload?.extractedIcons && Object.keys(theme.payload.extractedIcons).length > 0)
      );

      const hasSystemUi = Boolean(
        sysUiId ||
        theme.assets?.themeDefinition?.systemUi ||
        theme.payload?.systemUi
      );

      const hasKeyboard = Boolean(
        kbId ||
        theme.assets?.themeDefinition?.keyboardId
      );

      const isLiveWp = Boolean(
        wpAsset?.isLiveWallpaper ||
        wpAsset?.category === 'live_wallpaper' ||
        theme.isLiveWallpaper ||
        theme.payload?.mediaType === 'wallpaper_live'
      );

      const isComplete = hasWallpaper && hasIcons && (hasSystemUi || hasKeyboard);

      return {
        asset: theme,
        hasWallpaper,
        hasIcons,
        hasSystemUi,
        hasKeyboard,
        isLiveWp,
        isComplete,
        wpAsset,
        ipAsset,
      };
    });
  }, [themes]);

  // Apply filters based on real asset properties
  const filteredThemes = useMemo(() => {
    switch (selectedFilter) {
      case 'featured':
        return enrichedThemes.filter((t) => (t.asset.rating && t.asset.rating >= 4.8) || t.asset.isDefault);
      case 'new':
        return [...enrichedThemes].sort(
          (a, b) => new Date(b.asset.createdAt || 0).getTime() - new Date(a.asset.createdAt || 0).getTime()
        );
      case 'live_wallpaper':
        return enrichedThemes.filter((t) => t.isLiveWp);
      case 'wallpaper_icons':
        return enrichedThemes.filter((t) => t.hasWallpaper && t.hasIcons);
      case 'complete':
        return enrichedThemes.filter((t) => t.isComplete);
      case 'all':
      default:
        return enrichedThemes;
    }
  }, [enrichedThemes, selectedFilter]);

  const activeThemeRecord = useMemo(() => {
    return themes.find((t) => t.id === activeThemeId);
  }, [themes, activeThemeId]);

  const handleApplyQuick = (e: React.MouseEvent, theme: OnevaAsset) => {
    e.stopPropagation();
    PlatformBridge.performHapticFeedback('confirm');
    const report: ThemeApplyReport = ThemeEngineService.applyTheme(theme.id);
    if (report.overallSuccess) {
      showToast(`Applied Theme "${theme.name}"`);
    } else {
      showToast(report.message);
    }
  };

  const filterTabs: Array<{ id: ThemeFilterId; label: string; count?: number }> = [
    { id: 'all', label: 'All Themes', count: enrichedThemes.length },
    { id: 'featured', label: 'Featured', count: enrichedThemes.filter((t) => (t.asset.rating && t.asset.rating >= 4.8) || t.asset.isDefault).length },
    { id: 'new', label: 'New' },
    { id: 'wallpaper_icons', label: 'Wallpaper + Icons', count: enrichedThemes.filter((t) => t.hasWallpaper && t.hasIcons).length },
    { id: 'live_wallpaper', label: 'Live Wallpaper', count: enrichedThemes.filter((t) => t.isLiveWp).length },
    { id: 'complete', label: 'Complete Packs', count: enrichedThemes.filter((t) => t.isComplete).length },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col pb-24 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-[#0C1635] border border-cyan-400/50 shadow-2xl px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs text-cyan-200 font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-[#050C1F]/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Themes</h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-mono border border-cyan-500/20 font-semibold">
                PACKAGES
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Complete customization packages</p>
          </div>
        </div>

        {/* Active Theme Indicator */}
        <div className="flex items-center gap-2">
          {activeThemeRecord ? (
            <div className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[11px] font-medium flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="max-w-[110px] truncate">{activeThemeRecord.name}</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">No active theme</span>
          )}
        </div>
      </header>

      {/* Philosophy Banner */}
      <div className="mx-4 mt-3 p-3 rounded-2xl bg-[#09132A]/70 border border-cyan-500/20 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-white font-semibold block text-[11px]">Wallpaper ≠ Icon Pack ≠ Theme</span>
            <span className="text-slate-400 text-[10px]">A theme combines wallpapers, icons, and system styling into a unified package.</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 mt-3 overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-1">
        {filterTabs.map((tab) => {
          const isSelected = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                PlatformBridge.performHapticFeedback('light');
                setSelectedFilter(tab.id);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-black/20 text-slate-950' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Theme Marketplace Grid */}
      <main className="flex-1 px-4 mt-4">
        {filteredThemes.length === 0 ? (
          /* Proper Empty State: No Fake Content */
          <div className="mt-12 text-center max-w-sm mx-auto space-y-4 px-4 py-8 rounded-3xl bg-[#070D1E] border border-white/5">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
              <Layers className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">No Themes Available Yet</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real Theme Packages published by ONEVA or created in Admin Studio will appear here.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-left text-[11px] text-slate-400 space-y-1 leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                <Info className="w-3.5 h-3.5" />
                <span>What is a ONEVA Theme?</span>
              </div>
              <p>
                In ONEVA, a Theme is not a color filter or gradient card. It is a bundle referencing a real Wallpaper, Icon Pack, and System UI.
              </p>
            </div>

            <button
              type="button"
              onClick={() => NavigationBus.navigateTo('library')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Assemble Theme in Admin Studio</span>
            </button>
          </div>
        ) : (
          /* Responsive 2-column visual grid */
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {filteredThemes.map(({ asset, hasWallpaper, hasIcons, hasSystemUi, isLiveWp, isComplete }) => {
              const isActive = activeThemeId === asset.id;
              const creator = asset.author || 'ONEVA Verified';

              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    PlatformBridge.performHapticFeedback('light');
                    setSelectedTheme(asset);
                  }}
                  className={`group relative rounded-2xl bg-[#070D1E] border transition cursor-pointer overflow-hidden flex flex-col p-2.5 hover:border-cyan-500/40 active:scale-[0.98] ${
                    isActive ? 'border-cyan-400 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/40' : 'border-white/10'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                    {/* Live Wallpaper or Package Badge */}
                    {isLiveWp ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 backdrop-blur-md text-cyan-300 text-[9px] font-mono border border-cyan-400/40 font-bold flex items-center gap-1 shadow">
                        <Video className="w-2.5 h-2.5 text-cyan-300" />
                        LIVE
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-slate-300 text-[9px] font-mono border border-white/10 font-medium">
                        THEME
                      </span>
                    )}

                    {/* Active Checkmark or Star */}
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-bold flex items-center gap-1 shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        ACTIVE
                      </span>
                    ) : asset.rating ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-blue-300 text-[9px] font-mono border border-blue-400/30 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-blue-400 text-blue-400" />
                        {asset.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>

                  {/* Real Theme Preview: Wallpaper + Genuine App Icons */}
                  <div className="w-full aspect-[9/16] rounded-xl overflow-hidden shadow-inner border border-white/5 relative">
                    <ThemeCardPreview themeAsset={asset} />
                  </div>

                  {/* Theme Info */}
                  <div className="mt-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight line-clamp-1 group-hover:text-cyan-300 transition-colors">
                        {asset.name}
                      </h3>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        by {creator}
                      </div>
                    </div>

                    {/* Included Components Chips */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {hasWallpaper && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[9px] font-mono border border-emerald-500/20">
                          Wallpaper
                        </span>
                      )}
                      {hasIcons && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[9px] font-mono border border-cyan-500/20">
                          Icons
                        </span>
                      )}
                      {hasSystemUi && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[9px] font-mono border border-purple-500/20">
                          System UI
                        </span>
                      )}
                    </div>

                    {/* Quick Action Button */}
                    <div className="pt-1">
                      {isActive ? (
                        <div className="w-full py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1 border border-cyan-500/30">
                          <Check className="w-3 h-3 text-cyan-400" />
                          <span>Applied</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleApplyQuick(e, asset)}
                          className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-[11px] font-semibold transition border border-white/10 hover:border-transparent flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Apply</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Theme Detail Modal */}
      {selectedTheme && (
        <ThemeBundleDetailModal
          themeAsset={selectedTheme}
          onClose={() => setSelectedTheme(null)}
          onApplied={(report) => {
            if (report?.overallSuccess) {
              showToast(report.message);
              setActiveThemeId(selectedTheme.id);
            }
          }}
        />
      )}
    </div>
  );
}
