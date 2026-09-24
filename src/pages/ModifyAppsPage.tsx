import { useState, useEffect } from 'react';
import {
  Sliders,
  Zap,
  Shapes,
  Keyboard,
  Palette,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Info,
  RefreshCw,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Search,
  CheckSquare,
  Square,
  Play,
  Activity,
  Layers,
  Shield,
  Trash2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { AppShortcut } from '../launcher/types';
import { AppRepository } from '../launcher/services/appRepository';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { AppModificationEngine } from '../launcher/services/appModificationEngine';
import { IconService, ICON_PACKS } from '../services/iconService';
import { KeyboardService } from '../services/keyboardService';
import { AdminAssetService } from '../services/adminAssetService';
import {
  AppCustomizationService,
  AppCustomizationRecord,
} from '../services/appCustomizationService';
import { PageId, ModifyAppsSubSection } from '../navigation/types';
import { CatalogAppIcon } from '../components/CatalogAppIcon';
import {
  DeviceAppScannerService,
  DeviceProfileId,
  DEVICE_PROFILES,
} from '../services/deviceAppScannerService';
import { AppCatalogService } from '../services/appCatalogService';
import { NativeAppDiscoveryBridge } from '../launcher/services/nativeAppDiscoveryBridge';

interface ModifyAppsPageProps {
  initialSubSection?: ModifyAppsSubSection;
  onNavigateToSubSection: (section: ModifyAppsSubSection, packageName?: string) => void;
  onOpenGlobalFeature: (page: PageId, packageName?: string) => void;
  onNavigateBack: () => void;
}

export function ModifyAppsPage({
  initialSubSection = 'app_list',
  onNavigateToSubSection,
  onOpenGlobalFeature,
  onNavigateBack,
}: ModifyAppsPageProps) {
  // Step / Sub-tab state
  const [activeTab, setActiveTab] = useState<ModifyAppsSubSection>(
    initialSubSection === 'icons'
      ? 'customize'
      : initialSubSection
  );

  // App discovery state
  const [installedApps, setInstalledApps] = useState<AppShortcut[]>(AppRepository.getAvailableApps());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Multi-app selection state
  const [selectedPackageNames, setSelectedPackageNames] = useState<Set<string>>(
    new Set(['com.google.android.youtube', 'com.whatsapp'])
  );
  const [applyToAllMode, setApplyToAllMode] = useState<boolean>(false);

  // Customization selection state (configured in Step 2)
  const [selectedIconMode, setSelectedIconMode] = useState<'custom_glyph' | 'pack_override' | 'none'>('custom_glyph');
  const [selectedGlyph, setSelectedGlyph] = useState<string>('Sparkles');
  const [selectedPackId, setSelectedPackId] = useState<string>('oneva-vector-core');

  // Live preview testing state
  const [previewAppPackage, setPreviewAppPackage] = useState<string>('com.google.android.youtube');
  const [lastLaunchNotice, setLastLaunchNotice] = useState<string | null>(null);

  // Applied mappings registry
  const [appliedRecords, setAppliedRecords] = useState<AppCustomizationRecord[]>(
    AppCustomizationService.getAllCustomizations()
  );

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetAllModal, setShowResetAllModal] = useState<boolean>(false);

  // Subscribe to updates
  useEffect(() => {
    const unsubRepo = AppRepository.subscribe(() => {
      setInstalledApps(AppRepository.getAvailableApps());
    });

    const unsubCustom = AppCustomizationService.subscribe(() => {
      setAppliedRecords(AppCustomizationService.getAllCustomizations());
    });

    return () => {
      unsubRepo();
      unsubCustom();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter apps
  const filteredApps = installedApps.filter((app) => {
    const matchesSearch =
      app.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Target apps selected
  const effectiveSelectedPackages = applyToAllMode
    ? installedApps.map((a) => a.packageName)
    : Array.from(selectedPackageNames);

  const toggleSelectApp = (packageName: string) => {
    setSelectedPackageNames((prev) => {
      const next = new Set(prev);
      if (next.has(packageName)) {
        next.delete(packageName);
      } else {
        next.add(packageName);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPackageNames(new Set(installedApps.map((a) => a.packageName)));
  };

  const clearSelection = () => {
    setSelectedPackageNames(new Set());
  };

  const handleRefreshDiscovery = async () => {
    setIsScanning(true);
    await AppRepository.refreshApps();
    setIsScanning(false);
    showToast('Refreshed discoverable application metadata.');
  };

  // Apply customizations to selected apps
  const handleApplyCustomizations = () => {
    if (effectiveSelectedPackages.length === 0) {
      showToast('Please select at least one application to customize.');
      return;
    }

    const options: any = {};

    if (selectedIconMode === 'custom_glyph') {
      options.icon = {
        assetId: `custom-glyph-${selectedGlyph.toLowerCase()}`,
        assetName: `Custom Vector Glyph (${selectedGlyph})`,
        iconGlyph: selectedGlyph,
      };
    } else if (selectedIconMode === 'pack_override') {
      const pack = ICON_PACKS.find((p) => p.id === selectedPackId);
      options.icon = {
        assetId: selectedPackId,
        assetName: `Pack: ${pack?.name || 'Vector Pack'}`,
      };
    }

    const result = AppCustomizationService.applyBatchCustomization(effectiveSelectedPackages, options);
    showToast(result.message);
    setActiveTab('applied');
  };

  // Test launch in preview
  const handleTestAppLaunch = async () => {
    const target = installedApps.find((a) => a.packageName === previewAppPackage) || installedApps[0];
    if (!target) return;

    setLastLaunchNotice(`Launching ${target.label} (${target.packageName})...`);

    const result = await PlatformBridge.launchApp(target);
    setTimeout(() => {
      setLastLaunchNotice(`Transition verified: ${result.message}`);
    }, 600);
  };

  // Reset single app
  const handleResetApp = (packageName: string, appLabel: string) => {
    AppCustomizationService.resetApp(packageName);
    showToast(`Reset enhancements for ${appLabel} to system defaults.`);
  };

  // Remove single customization record
  const handleRemoveRecord = (packageName: string, type: any, appLabel: string) => {
    AppCustomizationService.removeCustomization(packageName, type);
    showToast(`Removed ${type.replace('_', ' ')} from ${appLabel}.`);
  };

  // Reset all
  const handleConfirmResetAll = () => {
    AppCustomizationService.resetAll();
    setShowResetAllModal(false);
    showToast('Reset all ONEVA modifications across all applications to system defaults.');
  };

  const previewTargetApp =
    installedApps.find((a) => a.packageName === previewAppPackage) ||
    installedApps[0] || {
      id: 'preview',
      label: 'Selected App',
      packageName: 'com.example.app',
      fallbackInitial: 'A',
      accentColor: '#10b981',
      iconName: 'Smartphone',
      category: 'utilities',
      isSystemApp: false,
    };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900/95 border border-emerald-500/40 shadow-2xl px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs text-neutral-200 font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Reset All Confirmation Modal */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Reset All App Modifications?</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              This will safely clear all custom individual icon overrides mapped to installed applications.
            </p>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-neutral-400 space-y-1 font-mono">
              <div>&bull; Does NOT uninstall any applications.</div>
              <div>&bull; Does NOT delete any private user files or data.</div>
              <div>&bull; Simply restores standard system presentation.</div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetAllModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-neutral-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetAll}
                className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-semibold transition cursor-pointer"
              >
                Reset All Modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>PHASE 5 &bull; PER-APP CUSTOMIZATION ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Modify Installed Apps</h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Discover real applications installed on your device and associate granular ONEVA visual enhancements (custom vector icons, individual pack overrides) without modifying original application binaries.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={onNavigateBack}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-200 border border-white/10 transition cursor-pointer"
          >
            &larr; Return to ONEVA Home
          </button>
        </div>
      </div>

      {/* Step Navigation Flow Indicator */}
      <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-2 sm:p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('app_list')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
              activeTab === 'app_list'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>1. App List</span>
          </button>

          <button
            onClick={() => setActiveTab('customize')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
              activeTab === 'customize'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>2. Select Customization</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>3. Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('applied')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
              activeTab === 'applied'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>4. Applied ({appliedRecords.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: APP LIST & SELECTION */}
      {/* ========================================================================= */}
      {activeTab === 'app_list' && (
        <div className="space-y-6">
          {/* Discovery Source Disclaimer Banner */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white">
                      {PlatformBridge.isNativeAndroid()
                        ? 'Live Android Companion Bridge'
                        : `Device App List (${installedApps.length} Installed)`}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                      {PlatformBridge.isNativeAndroid()
                        ? 'Native PackageManager'
                        : `${installedApps.length} of ${AppCatalogService.getAllApps().length} Catalog Apps`}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed max-w-2xl">
                    {PlatformBridge.isNativeAndroid()
                      ? 'Displaying only applications actually installed on this device matching ONEVA supported catalog.'
                      : 'USER DEVICE APP LIST: Displays ONLY apps installed on this device. Uninstalled catalog apps are strictly filtered out.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleRefreshDiscovery}
                disabled={isScanning}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-200 border border-white/10 transition cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Rescan Device'}</span>
              </button>
            </div>

            {/* Preview Device Switcher for testing User A vs User B behavior & Dynamic Discovery */}
            {!PlatformBridge.isNativeAndroid() && (
              <div className="pt-2 border-t border-white/5 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] text-neutral-400">Switch Device Simulation:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['device_default', 'device_a', 'device_b'] as DeviceProfileId[]).map((pid) => {
                      const isSelected = DeviceAppScannerService.getActiveProfileId() === pid;
                      return (
                        <button
                          key={pid}
                          type="button"
                          onClick={() => {
                            DeviceAppScannerService.setDeviceProfile(pid);
                            handleRefreshDiscovery();
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                              : 'bg-neutral-800/80 text-neutral-400 hover:text-white border border-neutral-700'
                          }`}
                        >
                          {pid === 'device_default'
                            ? 'Default (14 Apps)'
                            : pid === 'device_a'
                            ? 'User A (4 Apps)'
                            : 'User B (5 Apps)'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-white/5">
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Phase 17 Discovery Test:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        AppRepository.simulateInstallApp({
                          packageName: 'org.videolan.vlc',
                          appName: 'VLC Media Player',
                          isSystemApp: false,
                          launchable: true,
                          versionName: '3.5.4',
                          versionCode: 3050400,
                        });
                        showToast('Simulated installation of "VLC Media Player" (org.videolan.vlc).');
                      }}
                      className="px-2 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-mono text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
                    >
                      + Install VLC
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        AppRepository.simulateInstallApp({
                          packageName: 'xyz.unknown.customdaemon',
                          appName: 'System Sync Daemon',
                          isSystemApp: true,
                          launchable: false, // Non-launchable daemon test
                          versionName: '1.0.0',
                          versionCode: 1,
                        });
                        showToast('Simulated background service (launchable: false).');
                      }}
                      className="px-2 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-[10px] font-mono text-purple-300 border border-purple-500/30 transition cursor-pointer"
                    >
                      + Add Daemon (Non-launchable)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        NativeAppDiscoveryBridge.resetToDefaultSimulation();
                        AppRepository.invalidateCache();
                        showToast('Reset device discovery list to default.');
                      }}
                      className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono text-neutral-300 border border-white/10 transition cursor-pointer"
                    >
                      Reset Discovery
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search, Filter & Bulk Selection Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search installed applications or package names..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/50 transition"
              />
            </div>

            {/* Selection Mode & Multi-selection controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setApplyToAllMode(!applyToAllMode)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                  applyToAllMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-neutral-900 text-neutral-300 border-white/10 hover:bg-white/5'
                }`}
              >
                <span>{applyToAllMode ? '✓ Applying to All Apps' : 'Apply to All Apps'}</span>
              </button>

              {!applyToAllMode && (
                <>
                  <button
                    onClick={selectAll}
                    className="px-3 py-2 rounded-xl bg-neutral-900 text-neutral-300 hover:text-white border border-white/10 text-xs font-medium transition cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-white/10 text-xs font-medium transition cursor-pointer"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['all', 'communication', 'media', 'utilities'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Apps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map((app) => {
              const isSelected = applyToAllMode || selectedPackageNames.has(app.packageName);
              const customRecords = AppCustomizationService.getCustomizationsForPackage(app.packageName);
              const iconRec = customRecords.find((r) => r.customizationType === 'icon');

              return (
                <div
                  key={app.id}
                  onClick={() => {
                    if (!applyToAllMode) {
                      toggleSelectApp(app.packageName);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'bg-neutral-900 border-emerald-500/40 shadow-xl shadow-emerald-950/20'
                      : 'bg-neutral-900/40 hover:bg-neutral-900/80 border-white/5'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <CatalogAppIcon
                          app={{
                            name: app.label,
                            packageName: app.packageName,
                            defaultIcon: app.iconName,
                            accentColor: app.accentColor,
                            fallbackInitial: app.fallbackInitial,
                          }}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-white truncate">{app.label}</span>
                            {app.catalogSupported ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                Catalog Verified
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                Discovered App
                              </span>
                            )}
                            {app.versionName && (
                              <span className="text-[9px] font-mono text-neutral-500">v{app.versionName}</span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-neutral-500 block truncate">
                            {app.packageName}
                          </span>
                        </div>
                      </div>

                      {/* Selection Checkbox */}
                      <div className="shrink-0 pt-0.5">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-neutral-950 shadow-sm">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md border border-neutral-600 hover:border-neutral-400 transition" />
                        )}
                      </div>
                    </div>

                    {/* Active ONEVA Mappings Summary for this app */}
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="flex items-center gap-1.5">
                          <Shapes className="w-3 h-3 text-purple-400" /> Icon Override:
                        </span>
                        <span className="text-neutral-200 truncate max-w-[150px]">
                          {iconRec ? iconRec.assetName : 'Original Device Icon'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Individual quick actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPackageNames(new Set([app.packageName]));
                        setPreviewAppPackage(app.packageName);
                        setActiveTab('customize');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-200 transition text-center cursor-pointer"
                    >
                      Customize This App
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewAppPackage(app.packageName);
                        setActiveTab('preview');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs transition cursor-pointer flex items-center gap-1"
                      title="Preview launch transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating / Sticky Bottom Action Bar */}
          <div className="sticky bottom-4 z-30 p-4 rounded-2xl bg-neutral-900/95 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                {applyToAllMode ? 'ALL APPS' : `${selectedPackageNames.size} SELECTED`}
              </span>
              <span className="text-neutral-400">
                {applyToAllMode
                  ? `Targeting all ${installedApps.length} discovered applications`
                  : Array.from(selectedPackageNames)
                      .map((p) => installedApps.find((a) => a.packageName === p)?.label)
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(', ') + (selectedPackageNames.size > 3 ? ` +${selectedPackageNames.size - 3} more` : '')}
              </span>
            </div>

            <button
              onClick={() => {
                if (effectiveSelectedPackages.length === 0) {
                  showToast('Please select at least one application.');
                  return;
                }
                setActiveTab('customize');
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <span>Next: Select Customizations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: SELECT CUSTOMIZATIONS (INDIVIDUAL APP ICONS) */}
      {/* ========================================================================= */}
      {activeTab === 'customize' && (
        <div className="space-y-8">
          {/* Target Apps Summary Chip Bar */}
          <div className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">Targeting Apps:</span>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {effectiveSelectedPackages.map((pkg) => {
                  const app = installedApps.find((a) => a.packageName === pkg);
                  return (
                    <span
                      key={pkg}
                      className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-white font-medium flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: app?.accentColor || '#10b981' }} />
                      {app?.label || pkg}
                    </span>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('app_list')}
              className="text-xs text-neutral-400 hover:text-emerald-400 transition cursor-pointer font-mono"
            >
              &larr; Change Selected Apps
            </button>
          </div>

          {/* SECTION: INDIVIDUAL ICON CUSTOMIZATION & FALLBACK */}
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shapes className="w-4 h-4 text-purple-400" />
                <span>Individual App Icon Engine</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                ONEVA does not force a universal icon pack. Assign specific vector glyphs or individual pack overrides with strict Rule 3 fallback priority.
              </p>
            </div>

            {/* Mode Selector */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedIconMode('custom_glyph')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  selectedIconMode === 'custom_glyph'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                    : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Specific Vector Glyph
              </button>
              <button
                onClick={() => setSelectedIconMode('pack_override')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  selectedIconMode === 'pack_override'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                    : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Pack Override for Selected Apps
              </button>
              <button
                onClick={() => setSelectedIconMode('none')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  selectedIconMode === 'none'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                    : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Keep System Original Icon
              </button>
            </div>

            {/* Glyph Selector Grid */}
            {selectedIconMode === 'custom_glyph' && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-neutral-400 block">Select Individual Glyph Override:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {['Play', 'MessageCircle', 'Camera', 'Globe', 'Music', 'Sparkles', 'Activity', 'Shield', 'Terminal', 'Rocket', 'Filter', 'Zap'].map(
                    (glyph) => (
                      <button
                        key={glyph}
                        onClick={() => setSelectedGlyph(glyph)}
                        className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          selectedGlyph === glyph
                            ? 'bg-neutral-900 border-purple-500/50 text-purple-300 shadow-sm'
                            : 'bg-neutral-900/40 border-white/5 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-mono">{glyph}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Pack Override Selector */}
            {selectedIconMode === 'pack_override' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ICON_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedPackId(pack.id)}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedPackId === pack.id
                        ? 'bg-neutral-900 border-purple-500/50 text-purple-300'
                        : 'bg-neutral-900/40 border-white/5 text-neutral-300 hover:bg-neutral-900/80'
                    }`}
                  >
                    <span className="text-xs font-semibold block text-white">{pack.name}</span>
                    <span className="text-[10px] text-neutral-400 line-clamp-1">{pack.tagline}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Android Icon Limitations Honest Disclosure */}
            <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-[11px] text-neutral-300 space-y-1">
              <div className="flex items-center gap-2 text-purple-400 font-semibold font-mono">
                <Info className="w-3.5 h-3.5" />
                <span>Android Icon Limitation & Priority Chain</span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                ONEVA renders custom vector icons on the launcher surface, app drawer, and search. Replacing icons on the global system drawer requires granting ONEVA the default home launcher role. No APK bytecode tampering is ever performed.
              </p>
            </div>
          </div>

          {/* Next / Back Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <button
              onClick={() => setActiveTab('app_list')}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-200 transition cursor-pointer"
            >
              &larr; Back to App List
            </button>

            <button
              onClick={() => {
                setPreviewAppPackage(effectiveSelectedPackages[0] || 'com.google.android.youtube');
                setActiveTab('preview');
              }}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <span>Next: Preview App Launch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: INTERACTIVE PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Interactive App Launch Preview
              </h2>
              <p className="text-xs text-neutral-400">
                Preview custom icon styling and genuine Android application launch without modifying app binaries.
              </p>
            </div>

            {/* Target App Switcher */}
            {effectiveSelectedPackages.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Previewing:</span>
                <select
                  value={previewAppPackage}
                  onChange={(e) => setPreviewAppPackage(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white focus:outline-none cursor-pointer"
                >
                  {effectiveSelectedPackages.map((pkg) => {
                    const app = installedApps.find((a) => a.packageName === pkg);
                    return (
                      <option key={pkg} value={pkg}>
                        {app?.label || pkg}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Interactive Phone Frame Simulation */}
          <div className="max-w-md mx-auto relative rounded-3xl bg-neutral-950 border-2 border-neutral-800 p-6 shadow-2xl overflow-hidden min-h-[460px] flex flex-col justify-between">
            {/* Phone Status Bar */}
            <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono pb-4 border-b border-white/5 relative z-10">
              <span>09:41</span>
              <div className="flex items-center gap-2">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Target App Launch Stage */}
            <div className="my-auto text-center space-y-5 py-6 relative z-10">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-2xl text-white shadow-2xl mx-auto transition-transform active:scale-95"
                style={{
                  backgroundColor: `${previewTargetApp.accentColor}33`,
                  borderColor: previewTargetApp.accentColor,
                  borderWidth: 2,
                }}
              >
                {selectedIconMode === 'custom_glyph' ? selectedGlyph.charAt(0) : previewTargetApp.fallbackInitial}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">{previewTargetApp.label}</h3>
                <span className="text-xs font-mono text-neutral-400 block">{previewTargetApp.packageName}</span>
              </div>

              {/* Configured Settings Chips */}
              <div className="flex flex-wrap justify-center gap-2 pt-2 text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Icon: {selectedIconMode === 'custom_glyph' ? selectedGlyph : selectedIconMode === 'pack_override' ? selectedPackId : 'Original'}
                </span>
              </div>

              {/* Notice banner */}
              {lastLaunchNotice && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-emerald-400 animate-in fade-in">
                  {lastLaunchNotice}
                </div>
              )}
            </div>

            {/* Big Launch Trigger Button */}
            <div className="pt-4 border-t border-white/5 relative z-10">
              <button
                onClick={handleTestAppLaunch}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Test Real App Launch</span>
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <button
              onClick={() => setActiveTab('customize')}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-200 transition cursor-pointer"
            >
              &larr; Back to Customization Options
            </button>

            <button
              onClick={handleApplyCustomizations}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Customizations to {effectiveSelectedPackages.length} App{effectiveSelectedPackages.length === 1 ? '' : 's'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: APPLIED CONFIGURATION REGISTRY */}
      {/* ========================================================================= */}
      {activeTab === 'applied' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Applied Enhancements Registry
              </h2>
              <p className="text-xs text-neutral-400">
                Active ONEVA configuration mappings stored locally on your device.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('app_list')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
              >
                + Customize More Apps
              </button>

              <button
                onClick={() => setShowResetAllModal(true)}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Modifications</span>
              </button>
            </div>
          </div>

          {appliedRecords.length === 0 ? (
            <div className="p-12 rounded-3xl bg-neutral-900/40 border border-white/5 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-white/10 flex items-center justify-center mx-auto text-neutral-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">No Custom Overrides Applied</h3>
                <p className="text-xs text-neutral-400">
                  All installed applications are currently launching using their authentic device presentation.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('app_list')}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-semibold text-xs transition cursor-pointer"
              >
                Select Apps to Modify
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group records by application package */}
              {Array.from(new Set(appliedRecords.map((r) => r.packageName))).map((packageName) => {
                const app = installedApps.find((a) => a.packageName === packageName) || {
                  id: packageName,
                  label: packageName,
                  packageName,
                  fallbackInitial: packageName.charAt(0).toUpperCase(),
                  accentColor: '#10b981',
                };
                const appRecords = appliedRecords.filter((r) => r.packageName === packageName);

                return (
                  <div
                    key={packageName}
                    className="p-5 rounded-2xl bg-neutral-900/70 border border-white/10 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
                          style={{
                            backgroundColor: `${app.accentColor}33`,
                            borderColor: app.accentColor,
                            borderWidth: 1,
                          }}
                        >
                          {app.fallbackInitial}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white block">{app.label}</span>
                          <span className="text-[10px] font-mono text-neutral-500">{app.packageName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setPreviewAppPackage(packageName);
                            setActiveTab('preview');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button
                          onClick={() => handleResetApp(packageName, app.label)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition cursor-pointer flex items-center gap-1"
                          title="Reset all enhancements for this app"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset App</span>
                        </button>
                      </div>
                    </div>

                    {/* Enhancements Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      {appRecords.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                              {rec.customizationType.replace('_', ' ')}
                            </span>
                            <span className="font-medium text-white truncate max-w-[170px] block">
                              {rec.assetName}
                            </span>
                          </div>

                          <button
                            onClick={() => handleRemoveRecord(packageName, rec.customizationType, app.label)}
                            className="text-neutral-500 hover:text-red-400 transition p-1 cursor-pointer"
                            title="Remove this customization"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
