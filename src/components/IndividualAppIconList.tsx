import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  RotateCcw,
  Check,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Globe,
  Lock,
  Smartphone,
  Sparkles,
  Info,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { CatalogApp, SingleAppIconOption, FullIconPack } from '../types/catalogAndIcons';
import { AppCatalogService } from '../services/appCatalogService';
import { AdvancedIconSystem } from '../services/advancedIconSystem';
import { SingleAppIconService } from '../services/singleAppIconService';
import { PlatformBridge } from '../launcher/services/platformBridge';

interface IndividualAppIconListProps {
  mode: 'user' | 'admin';
  contextPackageName?: string;
  onIconAssigned?: (packageName: string, iconId: string) => void;
}

interface AppIconVariant {
  id: string;
  source: 'pack' | 'custom_upload';
  sourceName: string;
  packId?: string;
  svg?: string;
  dataUrl?: string;
  isCurrentOverride: boolean;
  isPackDefault: boolean;
  isPrivateUser: boolean;
}

export function IndividualAppIconList({
  mode,
  contextPackageName,
  onIconAssigned,
}: IndividualAppIconListProps) {
  const [apps, setApps] = useState<CatalogApp[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [packs, setPacks] = useState<FullIconPack[]>(AdvancedIconSystem.getAllPacks());
  const [userState, setUserState] = useState(AdvancedIconSystem.getUserState());
  const [uploadMode, setUploadMode] = useState<'admin' | 'user'>(mode);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File upload state for targeted app
  const [targetPackageForUpload, setTargetPackageForUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setApps(AppCatalogService.getAllApps());
    const unsub = AdvancedIconSystem.subscribe(() => {
      setPacks(AdvancedIconSystem.getAllPacks());
      setUserState(AdvancedIconSystem.getUserState());
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredApps = apps.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return app.name.toLowerCase().includes(q) || app.packageName.toLowerCase().includes(q);
  });

  // Gathers all detected variants for an app from installed packs + custom uploads
  const getVariantsForApp = (app: CatalogApp): AppIconVariant[] => {
    const variants: AppIconVariant[] = [];
    const activePackId = userState.activeFullPackId;
    const currentOverride = userState.singleAppIconOverrides[app.packageName];

    // 1. Check all installed packs for this package
    packs.forEach((pack) => {
      const iconPathOrData = pack.extractedIcons?.[app.packageName] || pack.iconMappings?.[app.packageName];
      if (iconPathOrData) {
        const isFromActivePack = pack.id === activePackId;
        const isSelectedAsOverride = currentOverride === `pack_${pack.id}_${app.packageName}`;

        variants.push({
          id: `pack_${pack.id}_${app.packageName}`,
          source: 'pack',
          sourceName: pack.name,
          packId: pack.id,
          dataUrl: iconPathOrData,
          isCurrentOverride: isSelectedAsOverride,
          isPackDefault: isFromActivePack,
          isPrivateUser: false,
        });
      }
    });

    // 2. Check standalone single app custom uploads
    const customOptions = SingleAppIconService.getIconsForApp(app.packageName, true);
    customOptions.forEach((opt) => {
      const isSelected = currentOverride === opt.id;
      variants.push({
        id: opt.id,
        source: 'custom_upload',
        sourceName: opt.author || (opt.ownership === 'user' ? 'My Upload' : 'Global'),
        dataUrl: opt.iconDataUrl,
        isCurrentOverride: isSelected,
        isPackDefault: false,
        isPrivateUser: opt.ownership === 'user',
      });
    });

    return variants;
  };

  const handleApplyOverride = (packageName: string, variant: AppIconVariant) => {
    // If clicking the current override, toggle it off (revert)
    if (variant.isCurrentOverride) {
      AdvancedIconSystem.removeSingleAppOverride(packageName);
      showToast(`Reverted ${packageName} to active full icon pack.`);
      return;
    }

    // Otherwise apply this variant as override
    AdvancedIconSystem.setSingleAppOverride(packageName, variant.id);
    PlatformBridge.performHapticFeedback('confirm');
    showToast(`Individual icon applied for ${packageName}.`);
    onIconAssigned?.(packageName, variant.id);
  };

  const handleRevertToPack = (packageName: string) => {
    AdvancedIconSystem.removeSingleAppOverride(packageName);
    PlatformBridge.performHapticFeedback('light');
    showToast(`Reverted ${packageName} to active pack.`);
  };

  const triggerUploadForApp = (packageName: string) => {
    setTargetPackageForUpload(packageName);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetPackageForUpload) return;

    try {
      const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');
      const reader = new FileReader();

      reader.onload = async () => {
        const result = reader.result as string;
        let svgContent: string | undefined = undefined;
        let dataUrl: string | undefined = undefined;

        if (isSvg) {
          svgContent = result;
        } else {
          dataUrl = result;
        }

        const isPrivate = uploadMode === 'user';
        const finalDataUrl = dataUrl || (svgContent ? `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}` : '');

        // Register custom icon option in service
        const addRes = await SingleAppIconService.addIconOption({
          appPackageName: targetPackageForUpload,
          variantName: `${file.name.replace(/\.[^/.]+$/, '')}`,
          iconDataUrl: finalDataUrl,
          iconType: isSvg ? 'svg' : 'image',
          author: isPrivate ? 'User Device' : 'Admin Global',
          ownership: isPrivate ? 'user' : 'admin',
        });

        if (addRes.success && addRes.iconOption) {
          // Automatically set as active override
          AdvancedIconSystem.setSingleAppOverride(targetPackageForUpload, addRes.iconOption.id);
          PlatformBridge.performHapticFeedback('confirm');
          showToast(`Uploaded & applied icon for ${targetPackageForUpload} (${isPrivate ? 'Private' : 'Global'}).`);
        } else {
          showToast(addRes.error || 'Failed to upload icon.');
        }
      };

      if (isSvg) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    } catch (err) {
      showToast('Error reading uploaded image file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-cyan-500/40 text-cyan-200 text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for direct Gallery/Media/File picking */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/svg+xml,image/png,image/jpeg,image/webp"
        onChange={handleFilePicked}
        className="hidden"
      />

      {/* Header Bar with Search & Scope Switch */}
      <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search installed applications by name or package..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Scope Indicator & Switch (Admin vs User upload) */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="text-[11px] text-neutral-400 font-mono">Upload Target:</span>
          <div className="flex p-0.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setUploadMode('user')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                uploadMode === 'user'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Private upload: Stored only on this device"
            >
              <Lock className="w-3 h-3" />
              <span>Personal (Private)</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('admin')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                uploadMode === 'admin'
                  ? 'bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Global upload: Available to all users"
            >
              <Globe className="w-3 h-3" />
              <span>Global (Admin)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Priority Legend Bar */}
      <div className="px-4 py-2 rounded-xl bg-[#081024] border border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-300">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 font-bold">Icon Priority Rule:</span>
          <span>1. Individual Override &gt; 2. Selected Full Pack &gt; 3. Original App</span>
        </div>
        <div className="flex items-center gap-3 text-neutral-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Active Override
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-neutral-600" /> Pack Default
          </span>
        </div>
      </div>

      {/* Compact Android Settings-Style Application Rows */}
      <div className="space-y-2">
        {filteredApps.map((app) => {
          const variants = getVariantsForApp(app);
          const hasOverride = !!userState.singleAppIconOverrides[app.packageName];
          const activePack = packs.find((p) => p.id === userState.activeFullPackId);
          const appColor = (app as { defaultColor?: string; categoryColor?: string }).defaultColor || (app as { defaultColor?: string; categoryColor?: string }).categoryColor || '#06b6d4';

          return (
            <div
              key={app.packageName}
              className={`p-3.5 rounded-2xl border transition-all ${
                hasOverride
                  ? 'bg-neutral-900/90 border-cyan-500/40 shadow-md shadow-cyan-950/20'
                  : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              {/* Row Header: App Name, Package, and Override Status */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border border-white/10"
                    style={{ backgroundColor: `${appColor}25`, color: appColor }}
                  >
                    {app.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-tight truncate">{app.name}</span>
                      {hasOverride && (
                        <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-mono border border-cyan-500/30">
                          OVERRIDE ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono block truncate">{app.packageName}</span>
                  </div>
                </div>

                {/* Revert Button if Override Active */}
                {hasOverride && (
                  <button
                    type="button"
                    onClick={() => handleRevertToPack(app.packageName)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono transition cursor-pointer border border-neutral-700"
                    title="Remove individual override and revert to full icon pack icon"
                  >
                    <RotateCcw className="w-3 h-3 text-cyan-400" />
                    <span>Revert to Pack</span>
                  </button>
                )}
              </div>

              {/* Horizontally Scrollable Available Icons Row (Requirement 8 & 9) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                {/* Available Variants */}
                {variants.map((v) => {
                  const isSelected = v.isCurrentOverride;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleApplyOverride(app.packageName, v)}
                      className={`relative group shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-950/40 ring-2 ring-cyan-400/40 scale-105'
                          : 'border-neutral-800 bg-neutral-950 hover:border-neutral-600 hover:scale-102'
                      }`}
                      title={`${v.sourceName} - Tap to ${isSelected ? 'revert' : 'apply override'}`}
                    >
                      {/* Icon Graphic */}
                      {v.svg ? (
                        <div
                          className="w-7 h-7 flex items-center justify-center text-cyan-300"
                          dangerouslySetInnerHTML={{ __html: v.svg }}
                        />
                      ) : v.dataUrl ? (
                        <img
                          src={v.dataUrl}
                          alt={v.sourceName}
                          className="w-7 h-7 object-contain rounded"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xs font-mono font-bold text-neutral-400">
                          {app.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}

                      {/* Small Active Check Badge */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-neutral-950 flex items-center justify-center text-[9px] font-bold shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Tooltip Label on Hover */}
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] bg-black/90 text-neutral-300 px-1 py-0.5 rounded whitespace-nowrap pointer-events-none z-10 font-mono">
                        {v.sourceName}
                      </span>
                    </button>
                  );
                })}

                {/* Direct '+' Upload Button for this Specific App (Requirement 8 & 9) */}
                <button
                  type="button"
                  onClick={() => triggerUploadForApp(app.packageName)}
                  className="shrink-0 w-11 h-11 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/15 text-cyan-300 flex flex-col items-center justify-center transition active:scale-95 cursor-pointer group"
                  title={`Upload custom icon for ${app.name} (SVG, PNG, JPG)`}
                >
                  <Plus className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[7px] font-mono text-cyan-300">ADD</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredApps.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-neutral-900/30 border border-neutral-800 text-neutral-400 text-xs">
            No applications match "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
}
