import { useState, useEffect } from 'react';
import {
  Shapes,
  CheckCircle2,
  Sliders,
  Sparkles,
  ChevronRight,
  Check,
  Smartphone,
  Grid,
  ArrowLeft,
  Shield,
  Layers,
  Settings,
} from 'lucide-react';
import {
  IconService,
  IconPack,
  IconSettings,
} from '../services/iconService';
import { AppCatalogService } from '../services/appCatalogService';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { AppIconMappingModal } from '../components/AppIconMappingModal';
import { ApplyToSystemModal } from '../components/ApplyToSystemModal';
import { IconPackSettingsModal } from '../components/IconPackSettingsModal';
import { IndividualAppIconList } from '../components/IndividualAppIconList';
import { OnevaAssetBrowser } from '../components/assets/OnevaAssetBrowser';

interface IconsPageProps {
  contextPackageName?: string;
  onNavigateBack?: () => void;
  onNavigateToAppMapping?: (packageName?: string) => void;
}

export function IconsPage({
  contextPackageName,
  onNavigateBack,
  onNavigateToAppMapping,
}: IconsPageProps) {
  // Primary view: marketplace (catalog), single_apps (granular overrides), or calibration
  const [activeTab, setActiveTab] = useState<'marketplace' | 'single_apps' | 'calibration'>('marketplace');
  const [settings, setSettings] = useState<IconSettings>(IconService.getSettings());
  const [packs, setPacks] = useState<IconPack[]>(IconService.getPacks());
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showApplySystemModal, setShowApplySystemModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingInitialPackage, setMappingInitialPackage] = useState<string | undefined>(contextPackageName);

  const catalogCount = AppCatalogService.getFinalizedCatalogCount();

  useEffect(() => {
    return IconService.subscribe(() => {
      setSettings(IconService.getSettings());
      setPacks(IconService.getPacks());
    });
  }, []);

  const openAppMappingForPackage = (pkgName?: string) => {
    setMappingInitialPackage(pkgName);
    if (onNavigateToAppMapping) {
      onNavigateToAppMapping(pkgName);
    } else {
      setShowMappingModal(true);
    }
  };

  const activePack = IconService.getActivePack();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 text-white select-none">
      {/* Toast Notification */}
      {appliedToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-[#0F1B3B] border border-cyan-400/50 shadow-2xl px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs text-cyan-200 font-medium animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{appliedToast}</span>
        </div>
      )}

      {/* Top Header bar with Navigation & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Shapes className="w-6 h-6 text-cyan-400" />
                <span>Icon Packs &amp; Customization</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-semibold">
                {catalogCount} Apps
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Browse verified vector icon packs and customize individual real Android app icons.
            </p>
          </div>
        </div>

        {/* View Switcher: Marketplace vs Single App Overrides vs Calibration */}
        <div className="flex items-center p-1 bg-neutral-900/80 rounded-2xl border border-neutral-800 shrink-0 flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('marketplace')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'marketplace'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-950/40 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Marketplace</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('single_apps')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'single_apps'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-950/40 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Individual App Icons</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calibration')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'calibration'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-950/40 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Calibration &amp; Setup</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Marketplace / Catalog (Matches Wallpaper Architecture) */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          {/* Active Global Pack & Priority Status Banner */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-300">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span>
                Active Global Pack:{' '}
                <strong className="text-white font-semibold">{activePack.name}</strong>
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-400">
                Rule 3 Priority Resolution Enabled
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setActiveTab('single_apps')}
                className="px-3 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-[11px] font-medium border border-neutral-700 transition cursor-pointer flex items-center gap-1"
              >
                <span>Customize Individual Icons</span>
                <ChevronRight className="w-3 h-3 text-neutral-400" />
              </button>
            </div>
          </div>

          {/* Full Visual Asset Browser for Icon Packs */}
          <OnevaAssetBrowser
            targetCategory="icon_pack"
            title="Icon Pack Marketplace"
            subtitle="Explore high-contrast vector glyph packs. Real Android app previews with Blue-Star editorial rankings."
            allowUpload={true}
          />
        </div>
      )}

      {/* Tab 2: Individual App Icons (Granular Customization) */}
      {activeTab === 'single_apps' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
            <div>
              <span className="font-semibold text-white">Granular App Icon Customization</span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Assign specific icons to individual apps (e.g., custom WhatsApp or YouTube) independently of the global pack.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('marketplace')}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/20 transition cursor-pointer"
            >
              Browse Full Packs
            </button>
          </div>

          <IndividualAppIconList mode="user" contextPackageName={contextPackageName} />
        </div>
      )}

      {/* Tab 3: Calibration & Setup */}
      {activeTab === 'calibration' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Action Cards (Settings, System Realization, App Mapping) */}
          <div className="rounded-3xl bg-neutral-900/70 border border-neutral-800 divide-y divide-neutral-800/80 overflow-hidden shadow-lg">
            {/* 1. Icon Pack Settings */}
            <div
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center justify-between p-4.5 hover:bg-white/[0.03] transition cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-400/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Icon Pack Calibration</span>
                  <span className="text-xs text-neutral-400">
                    Fallback shape ({settings.fallbackShape}), scale, and notification badges
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
            </div>

            {/* 2. Apply to System */}
            <div
              onClick={() => setShowApplySystemModal(true)}
              className="flex items-center justify-between p-4.5 hover:bg-white/[0.03] transition cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-400/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Apply to Android System</span>
                  <span className="text-xs text-neutral-400">
                    Realize {activePack.name} across ONEVA Surface and Android launch drawer
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
            </div>

            {/* 3. Direct App Icon Mapping */}
            <div
              onClick={() => openAppMappingForPackage()}
              className="flex items-center justify-between p-4.5 hover:bg-white/[0.03] transition cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-400/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Package Inspector &amp; Mapping</span>
                  <span className="text-xs text-neutral-400">
                    Target specific APK packages ({catalogCount} apps detected)
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          {/* Explanatory Architecture Note */}
          <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-start gap-3">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-300 leading-relaxed">
              <strong className="text-white font-semibold">Priority Chain Resolution (Rule 3):</strong> Real Android app icon resolution follows:
              <br />
              <span className="text-cyan-300 font-mono text-[11px] mt-1 block">
                1. Individual Custom Icon &gt; 2. Individual Pack Override &gt; 3. Global Selected Pack ({activePack.name}) &gt; 4. Configurable Fallback Shape &gt; 5. Original App System Icon
              </span>
            </div>
          </div>
        </div>
      )}

      {/* App Icon Mapping Modal */}
      {showMappingModal && (
        <AppIconMappingModal
          isOpen={showMappingModal}
          initialPackageName={mappingInitialPackage}
          onClose={() => setShowMappingModal(false)}
        />
      )}

      {/* Apply to System Realization Modal */}
      {showApplySystemModal && (
        <ApplyToSystemModal
          isOpen={showApplySystemModal}
          onClose={() => setShowApplySystemModal(false)}
          packName={activePack.name}
        />
      )}

      {/* Icon Pack Settings Modal */}
      {showSettingsModal && (
        <IconPackSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}
