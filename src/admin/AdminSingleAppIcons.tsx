import React, { useState, useEffect, useRef } from 'react';
import {
  Shapes,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Sparkles,
  Smartphone,
  Check,
  X,
  RotateCcw,
  Globe,
  User,
  Filter,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  SingleAppIconOption,
  CatalogApp,
  FullIconPack,
  UserIconState,
  ResolvedAppIconResult,
} from '../types/catalogAndIcons';
import { SingleAppIconService } from '../services/singleAppIconService';
import { AppCatalogService } from '../services/appCatalogService';
import { AdvancedIconSystem } from '../services/advancedIconSystem';

export function AdminSingleAppIcons() {
  const [catalogApps, setCatalogApps] = useState<CatalogApp[]>(AppCatalogService.getAllApps());
  const [singleIcons, setSingleIcons] = useState<SingleAppIconOption[]>(SingleAppIconService.getAllIcons());
  const [packs, setPacks] = useState<FullIconPack[]>(AdvancedIconSystem.getAllPacks());
  const [userState, setUserState] = useState<UserIconState>(AdvancedIconSystem.getUserState());

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'canonical' | 'extended'>('all');
  const [uploadMode, setUploadMode] = useState<'admin' | 'user'>('admin');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File upload state
  const [targetPackageForUpload, setTargetPackageForUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubCatalog = AppCatalogService.subscribe(() => {
      setCatalogApps(AppCatalogService.getAllApps());
    });
    const unsubSingle = SingleAppIconService.subscribe(() => {
      setSingleIcons(SingleAppIconService.getAllIcons());
    });
    const unsubPacks = AdvancedIconSystem.subscribe(() => {
      setPacks(AdvancedIconSystem.getAllPacks());
      setUserState(AdvancedIconSystem.getUserState());
    });

    return () => {
      unsubCatalog();
      unsubSingle();
      unsubPacks();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Trigger file picker for an app
  const handleOpenUploadForApp = (packageName: string) => {
    setTargetPackageForUpload(packageName);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Process chosen image file (SVG, PNG, JPG/JPEG)
  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const pkg = targetPackageForUpload;
    if (!file || !pkg) return;

    const app = catalogApps.find((a) => a.packageName.toLowerCase() === pkg.toLowerCase());
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);

    if (!isSvg && !isImage) {
      showToast('Please select a valid image file (.svg, .png, .jpg, .jpeg, .webp).');
      return;
    }

    try {
      let dataUrl: string;

      if (isSvg) {
        // Read SVG as text first to validate and normalize
        const svgText = await file.text();
        if (!svgText.includes('<svg')) {
          showToast('Invalid SVG file format.');
          return;
        }
        dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`;
      } else {
        // Read PNG/JPG as data URL
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const cleanVariantName = rawName.charAt(0).toUpperCase() + rawName.slice(1) || 'Custom Icon';

      // 1. Add to SingleAppIconService with ownership
      const res = await SingleAppIconService.addIconOption({
        appPackageName: pkg,
        variantName: cleanVariantName,
        iconDataUrl: dataUrl,
        iconType: isSvg ? 'svg' : 'image',
        ownership: uploadMode,
        author: uploadMode === 'admin' ? 'ONEVA Admin (Global)' : 'Personal Device',
      });

      if (res.success && res.iconOption) {
        // Automatically attach to AppCatalogService so iconStatus transitions to 'available'
        await AppCatalogService.attachIconAsset(pkg, {
          dataUrl,
          originalFileName: file.name,
          format: isSvg ? 'svg' : file.type.includes('png') ? 'png' : 'jpeg',
          fileSizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
          mimeType: file.type,
        });

        // 2. Automatically apply as the active single app override!
        AdvancedIconSystem.setSingleAppOverride(pkg, res.iconOption.id);
        showToast(
          `Attached "${cleanVariantName}" to ${app?.name || pkg} (${uploadMode === 'admin' ? 'Global Admin' : 'Personal Device'})!`
        );
      } else {
        showToast(res.error || 'Failed to save icon.');
      }
    } catch (err: any) {
      showToast(`Error processing image: ${err?.message || 'File read error'}`);
    } finally {
      setTargetPackageForUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Select an icon from the strip
  const handleSelectIcon = (pkg: string, iconId: string | null) => {
    AdvancedIconSystem.setSingleAppOverride(pkg, iconId);
    const app = catalogApps.find((a) => a.packageName.toLowerCase() === pkg.toLowerCase());
    if (iconId === null) {
      showToast(`Reverted ${app?.name || pkg} to active Full Pack.`);
    } else {
      showToast(`Applied custom icon override for ${app?.name || pkg}.`);
    }
  };

  // Revert / Remove individual override
  const handleRevertOverride = (pkg: string) => {
    AdvancedIconSystem.setSingleAppOverride(pkg, null);
    const app = catalogApps.find((a) => a.packageName.toLowerCase() === pkg.toLowerCase());
    showToast(`Reverted ${app?.name || pkg} to active Full Pack.`);
  };

  // Reset all overrides back to full pack
  const handleResetAllOverrides = () => {
    const overrideCount = Object.keys(userState.singleAppIconOverrides).length;
    if (overrideCount === 0) {
      showToast('No active overrides to reset.');
      return;
    }
    const confirmed = window.confirm(`Reset all ${overrideCount} custom overrides back to the active Full Icon Pack?`);
    if (!confirmed) return;

    catalogApps.forEach((app) => {
      AdvancedIconSystem.setSingleAppOverride(app.packageName, null);
    });
    showToast(`Reset all ${overrideCount} overrides. All apps now follow active Full Pack.`);
  };

  // Delete a single app custom icon option
  const handleDeleteIconOption = async (optionId: string, pkg: string) => {
    const icon = singleIcons.find((i) => i.id === optionId);
    if (!icon) return;

    const confirmed = window.confirm(`Delete icon variant "${icon.variantName}"?`);
    if (!confirmed) return;

    const res = await SingleAppIconService.deleteIconOption(optionId, uploadMode);
    if (res.success) {
      // If it was the active override, clear it
      if (userState.singleAppIconOverrides[pkg.toLowerCase()] === optionId) {
        AdvancedIconSystem.setSingleAppOverride(pkg, null);
      }
      showToast(`Icon "${icon.variantName}" deleted.`);
    } else {
      showToast(res.error || 'Cannot delete this icon.');
    }
  };

  // Filter apps
  const filteredApps = catalogApps.filter((app) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      app.name.toLowerCase().includes(q) ||
      (app.displayName && app.displayName.toLowerCase().includes(q)) ||
      app.packageName.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q) ||
      app.searchKeywords?.some((k) => k.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Catalog Type Filter (Canonical 56 vs Extended 22 vs All)
    if (catalogFilter === 'canonical') {
      const isCanonical = app.catalogType === 'canonical' || !app.catalogType;
      if (!isCanonical) return false;
    } else if (catalogFilter === 'extended') {
      if (app.catalogType !== 'extended') return false;
    }

    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'overridden') {
      return Boolean(userState.singleAppIconOverrides[app.packageName.toLowerCase()]);
    }
    return app.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  const canonicalCount = catalogApps.filter((a) => a.catalogType === 'canonical' || !a.catalogType).length;
  const extendedCount = catalogApps.filter((a) => a.catalogType === 'extended').length;
  const activePack = packs.find((p) => p.id === userState.activeFullPackId);
  const totalOverridesCount = Object.keys(userState.singleAppIconOverrides).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-200 text-xs flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden Native File Input for Images */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,.png,.jpg,.jpeg,.webp,image/*"
        onChange={handleFileChosen}
        className="hidden"
      />

      {/* Controls & Mode Header */}
      <div className="bg-[#09132A]/80 border border-cyan-500/20 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shapes className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-wide">Single App Icons</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Android Settings-style apps list. Select from available icon pack contours, admin variants, or click{' '}
              <span className="text-cyan-300 font-semibold">[ + ]</span> on any row to upload from device.
            </p>
          </div>

          {/* Upload Ownership Selector */}
          <div className="flex items-center gap-2 bg-[#060c1d] p-1.5 rounded-xl border border-slate-800 self-start md:self-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Upload Mode:</span>
            <button
              type="button"
              onClick={() => setUploadMode('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                uploadMode === 'admin'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Global Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('user')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                uploadMode === 'user'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Personal Device</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Filters */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          {/* Catalog Scope Filter: Canonical vs Extended vs All */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-[#060c1d] rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Catalog:</span>
              <button
                type="button"
                onClick={() => setCatalogFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  catalogFilter === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Apps ({catalogApps.length})
              </button>
              <button
                type="button"
                onClick={() => setCatalogFilter('canonical')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  catalogFilter === 'canonical'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Canonical 56 Apps</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                  {canonicalCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCatalogFilter('extended')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  catalogFilter === 'extended'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Extended Apps</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300">
                  {extendedCount}
                </span>
              </button>
            </div>

            {/* Overrides Reset */}
            {totalOverridesCount > 0 && (
              <button
                type="button"
                onClick={handleResetAllOverrides}
                title="Revert all individual overrides back to the active Full Pack"
                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Overrides</span>
              </button>
            )}
          </div>

          {/* Search Input & Category Pills */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${catalogFilter === 'extended' ? '22 extended' : catalogFilter === 'canonical' ? '56 canonical' : 'all'} apps...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#060c1d] border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0">
              {['all', 'social', 'media', 'tools', 'google', 'overridden'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs capitalize whitespace-nowrap transition cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                      : 'bg-[#060c1d] text-slate-400 hover:text-slate-200 border border-slate-800/80'
                  }`}
                >
                  {cat === 'overridden' ? `Overridden (${totalOverridesCount})` : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* System State Info Strip */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Active Full Pack:</span>
            <span className="text-cyan-300 font-semibold">{activePack?.name || 'None'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">Single Overrides:</span>
            <span className="text-amber-300 font-semibold">{totalOverridesCount} apps</span>
          </div>
          <div className="text-[10px] text-slate-500 hidden sm:block">
            Hierarchy: Default Android → ONEVA Full Pack → Individual Override
          </div>
        </div>
      </div>

      {/* Android Settings-Style App List */}
      <div className="bg-[#09132A]/70 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No applications matched your search or category filter.
          </div>
        ) : (
          filteredApps.map((app) => {
            const pkg = app.packageName.toLowerCase();
            const resolved = AdvancedIconSystem.resolveAppIcon(pkg);
            const overrideId = userState.singleAppIconOverrides[pkg];
            const hasOverride = Boolean(overrideId);

            // Collect all available icon options for this app
            const appSingleOptions = singleIcons.filter(
              (i) => i.appPackageName.toLowerCase() === pkg && i.isEnabled
            );

            // Pack icons for this app from all installed packs
            const packIconsForApp = packs
              .filter((p) => p.iconMappings[pkg] || p.extractedIcons?.[pkg])
              .map((p) => ({
                packId: p.id,
                packName: p.name,
                iconDataUrl: p.extractedIcons?.[pkg] || p.iconMappings[pkg],
              }));

            return (
              <div
                key={app.id}
                className="p-3.5 sm:p-4 hover:bg-[#0b1633]/40 transition space-y-2.5"
              >
                {/* App Row Header: Current Icon + App Details */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Live Resolved App Icon */}
                    <div className="w-10 h-10 rounded-xl bg-[#060c1d] border border-cyan-500/25 flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative">
                      {resolved.iconType === 'image' && resolved.iconValue ? (
                        <img
                          src={resolved.iconValue}
                          alt={app.name}
                          className="w-7 h-7 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Smartphone className="w-5 h-5 text-cyan-400" />
                      )}

                      {/* Small badge indicating tier */}
                      {hasOverride && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09132A]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-white truncate">{app.displayName || app.name}</span>
                        {app.catalogType === 'extended' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Extended
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Canonical
                          </span>
                        )}
                        {app.iconStatus === 'not_uploaded' && !hasOverride && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Pending Icon
                          </span>
                        )}
                        {hasOverride ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            Custom Override
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-800/60">
                            {activePack?.name || 'Default'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{app.packageName}</div>
                    </div>
                  </div>

                  {/* Revert override button if active */}
                  {hasOverride && (
                    <button
                      type="button"
                      onClick={() => handleRevertOverride(app.packageName)}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3 h-3 text-cyan-400" />
                      <span>Revert to Pack</span>
                    </button>
                  )}
                </div>

                {/* Horizontally Scrollable Icon Strip */}
                <div className="flex items-center gap-2 overflow-x-auto py-1 pl-1 no-scrollbar">
                  {/* 1. System / Default Icon Thumbnail */}
                  <button
                    type="button"
                    onClick={() => handleSelectIcon(app.packageName, null)}
                    title={`Default / Pack Icon`}
                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition cursor-pointer group ${
                      !hasOverride
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-sm shadow-cyan-500/20'
                        : 'bg-[#060c1d] border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {app.defaultIcon ? (
                      <img
                        src={app.defaultIcon}
                        alt="Default"
                        className="w-6 h-6 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Smartphone className="w-5 h-5 text-slate-400" />
                    )}

                    {!hasOverride && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[9px] shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap bg-black/90 px-1 rounded z-10">
                      Pack Icon
                    </span>
                  </button>

                  {/* 2. Uploaded / Admin Single App Icon Options */}
                  {appSingleOptions.map((option) => {
                    const isSelected = overrideId === option.id;

                    return (
                      <div key={option.id} className="relative group shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectIcon(app.packageName, option.id)}
                          title={`${option.variantName} (${option.ownership === 'admin' ? 'Global Admin' : 'Personal Device'})`}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition cursor-pointer overflow-hidden ${
                            isSelected
                              ? 'bg-cyan-950/60 border-cyan-400 shadow-sm shadow-cyan-500/20'
                              : 'bg-[#060c1d] border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          {option.iconDataUrl ? (
                            <img
                              src={option.iconDataUrl}
                              alt={option.variantName}
                              className="w-7 h-7 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                          )}

                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[9px] shadow z-10">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}

                          {/* Subtle Ownership Indicator */}
                          <div
                            className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                              option.ownership === 'admin' ? 'bg-cyan-400' : 'bg-emerald-400'
                            }`}
                            title={option.ownership === 'admin' ? 'Global Admin Icon' : 'Personal User Icon'}
                          />
                        </button>

                        {/* Hover delete button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteIconOption(option.id, app.packageName);
                          }}
                          title="Delete this variant"
                          className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow hover:bg-rose-500 cursor-pointer z-20"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>

                        {/* Tooltip on hover */}
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap bg-black/90 px-1 rounded z-20">
                          {option.variantName}
                        </span>
                      </div>
                    );
                  })}

                  {/* 3. The '+' Upload Icon Button Directly On This App Row */}
                  <button
                    type="button"
                    onClick={() => handleOpenUploadForApp(app.packageName)}
                    title={`Upload custom icon for ${app.name} (${uploadMode === 'admin' ? 'Global Admin' : 'Personal Device'})`}
                    className="w-10 h-10 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 transition cursor-pointer group"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
