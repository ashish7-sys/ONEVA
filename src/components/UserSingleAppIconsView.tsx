import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Shapes,
  Sparkles,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  Smartphone,
  Sliders,
  Check,
  Package,
} from 'lucide-react';
import { CatalogApp, SingleAppIconOption } from '../types/catalogAndIcons';
import { AppCatalogService } from '../services/appCatalogService';
import { SingleAppIconService } from '../services/singleAppIconService';
import { AdvancedIconSystem } from '../services/advancedIconSystem';
import { IconService } from '../services/iconService';
import { AppRepository } from '../launcher/services/appRepository';

interface UserSingleAppIconsViewProps {
  initialPackage?: string;
}

export function UserSingleAppIconsView({ initialPackage }: UserSingleAppIconsViewProps) {
  const [catalogApps, setCatalogApps] = useState<CatalogApp[]>(AppCatalogService.getAllApps());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(initialPackage || null);
  const [userState, setUserState] = useState(AdvancedIconSystem.getUserState());
  const [iconOptions, setIconOptions] = useState<SingleAppIconOption[]>(SingleAppIconService.getAllIcons());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubCatalog = AppCatalogService.subscribe(() => {
      setCatalogApps(AppCatalogService.getAllApps());
    });
    const unsubSingle = SingleAppIconService.subscribe(() => {
      setIconOptions(SingleAppIconService.getAllIcons());
    });
    const unsubAdv = AdvancedIconSystem.subscribe(() => {
      setUserState(AdvancedIconSystem.getUserState());
    });
    return () => {
      unsubCatalog();
      unsubSingle();
      unsubAdv();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredApps = catalogApps.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.name.toLowerCase().includes(q) ||
      app.packageName.toLowerCase().includes(q) ||
      app.searchKeywords?.some((k) => k.toLowerCase().includes(q))
    );
  });

  const handleApplySingleIcon = (appPackage: string, optionId: string, variantName: string) => {
    AdvancedIconSystem.setSingleAppOverride(appPackage, optionId);
    showToast(`Applied "${variantName}" override!`);
  };

  const handleRemoveOverride = (appPackage: string, appName: string) => {
    AdvancedIconSystem.removeSingleAppOverride(appPackage);
    showToast(`Restored ${appName} to Full Icon Pack / Default.`);
  };

  const activePack = IconService.getPacks().find(
    (p) => p.id === IconService.getSettings().activeGlobalPackId
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-neutral-900 border border-purple-500/50 text-white text-xs shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Priority Engine Banner */}
      <div className="p-4 rounded-2xl bg-neutral-900/70 border border-purple-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shapes className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Deterministic 3-Level Priority
            </h3>
          </div>
          <span className="text-[10px] font-mono text-purple-300">
            Active Global Pack: {activePack?.name || 'Default'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono pt-1">
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
            1. Single App Override (Highest)
          </span>
          <span className="text-neutral-500">&rarr;</span>
          <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
            2. Full Icon Pack
          </span>
          <span className="text-neutral-500">&rarr;</span>
          <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
            3. Original App Icon
          </span>
        </div>

        <p className="text-[11px] text-neutral-400 pt-1 leading-relaxed">
          Selecting an icon variant below overrides your active Full Icon Pack specifically for that application.
          If you clear the override, the app automatically falls back to your active Full Icon Pack.
        </p>
      </div>

      {/* Search application */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search application (e.g. WhatsApp, YouTube, Instagram)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {filteredApps.map((app) => {
          const isSelected = selectedPackage === app.packageName;
          const currentResolution = IconService.resolveAppIcon(app.packageName, app.defaultIcon);
          const overrideOptionId = userState.singleAppIconOverrides[app.packageName.toLowerCase()];
          const hasOverride = Boolean(overrideOptionId);

          const optionsForApp = iconOptions.filter(
            (opt) => opt.appPackageName.toLowerCase() === app.packageName.toLowerCase() && opt.isEnabled
          );

          return (
            <div
              key={app.packageName}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isSelected
                  ? 'bg-neutral-900/90 border-purple-500/50 shadow-xl shadow-purple-950/20'
                  : 'bg-neutral-900/40 hover:bg-neutral-900/70 border-neutral-800'
              }`}
            >
              {/* App Summary Row (Tap WhatsApp) */}
              <div
                onClick={() => setSelectedPackage(isSelected ? null : app.packageName)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Current Icon Preview */}
                  <div
                    className="w-11 h-11 rounded-2xl border flex items-center justify-center font-bold text-sm shrink-0 shadow-md transition-transform"
                    style={{
                      backgroundColor: `${app.accentColor}18`,
                      borderColor: hasOverride ? '#a855f7' : `${app.accentColor}40`,
                      color: app.accentColor,
                    }}
                  >
                    {app.fallbackInitial || app.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white truncate">{app.name}</h4>
                      {hasOverride ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-mono font-semibold">
                          Single App Override Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[9px] font-mono">
                          Using Full Pack ({activePack?.name || 'Default'})
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-neutral-400 truncate mt-0.5">
                      {app.packageName} &bull; {optionsForApp.length} single icon variants available
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-neutral-400 hidden sm:inline">
                    {isSelected ? 'Close' : 'Choose Icon'}
                  </span>
                  {isSelected ? (
                    <ChevronDown className="w-4 h-4 text-purple-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  )}
                </div>
              </div>

              {/* Expanded Icon Options for Selected App */}
              {isSelected && (
                <div className="px-4 pb-5 pt-2 border-t border-neutral-800/80 bg-neutral-950/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Shapes className="w-3.5 h-3.5 text-purple-400" />
                        <span>{app.name} Icons</span>
                      </h5>
                      <p className="text-[10px] text-neutral-400">
                        Pick any variant to apply an independent single-app override.
                      </p>
                    </div>

                    {hasOverride && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveOverride(app.packageName, app.name);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-mono border border-neutral-700 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-neutral-400" />
                        <span>Restore Full Pack</span>
                      </button>
                    )}
                  </div>

                  {optionsForApp.length === 0 ? (
                    <div className="p-6 rounded-xl border border-neutral-800 text-center text-xs text-neutral-500">
                      No custom variants registered for {app.name} yet. You can add them in Admin &rarr; Single App Icons.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {optionsForApp.map((option, idx) => {
                        const isThisOptionActive = overrideOptionId === option.id;

                        return (
                          <div
                            key={option.id}
                            onClick={() => handleApplySingleIcon(app.packageName, option.id, option.variantName)}
                            className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center text-center cursor-pointer group select-none ${
                              isThisOptionActive
                                ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/30 scale-[1.02]'
                                : 'bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800'
                            }`}
                          >
                            <div
                              className="w-12 h-12 rounded-xl border flex items-center justify-center text-base font-bold mb-2 transition-transform group-hover:scale-105"
                              style={{
                                backgroundColor: `${option.previewColor || '#a855f7'}20`,
                                borderColor: isThisOptionActive ? '#a855f7' : `${option.previewColor || '#a855f7'}40`,
                                color: option.previewColor || '#a855f7',
                              }}
                            >
                              {option.iconDataUrl ? (
                                <img
                                  src={option.iconDataUrl}
                                  alt={option.variantName}
                                  className="w-7 h-7 object-contain"
                                />
                              ) : (
                                <Shapes className="w-5 h-5" />
                              )}
                            </div>

                            <span className="text-xs font-bold text-white truncate max-w-full">
                              {option.variantName}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              Variant #{idx + 1}
                            </span>

                            {isThisOptionActive ? (
                              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500 text-neutral-950 text-[10px] font-bold">
                                <Check className="w-3 h-3" />
                                <span>Applied</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="mt-2 text-[10px] text-purple-400 group-hover:text-purple-300 font-medium"
                              >
                                Tap to Apply
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fallback & Full Pack Option */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-400 font-mono border-t border-neutral-800/60">
                    <span>
                      Active Resolution:{' '}
                      <strong className="text-white">
                        {hasOverride ? 'Single App Override' : `Full Pack (${activePack?.name || 'Default'})`}
                      </strong>
                    </span>
                    <span>Package: {app.packageName}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
