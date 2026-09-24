import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  ExternalLink,
  Tag,
  Smartphone,
  Check,
  X,
  RefreshCw,
  Layers,
  Sparkles,
  Package,
  FileCode2,
  Laptop,
  CheckSquare,
  Square,
  ShieldCheck,
  Info,
  Upload,
} from 'lucide-react';
import { CatalogApp, CatalogAppCategory } from '../types/catalogAndIcons';
import { AppCatalogService } from '../services/appCatalogService';
import { CatalogIconHelper } from '../services/catalogIconHelper';
import {
  DeviceAppScannerService,
  DeviceProfileId,
  DEVICE_PROFILES,
} from '../services/deviceAppScannerService';
import { AppRepository } from '../launcher/services/appRepository';
import { CatalogAppIcon } from '../components/CatalogAppIcon';

const CATEGORIES: { id: CatalogAppCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'communication', label: 'Communication & Chat' },
  { id: 'social', label: 'Social & Networks' },
  { id: 'media', label: 'Media & Streaming' },
  { id: 'finance', label: 'Finance & Payments' },
  { id: 'shopping', label: 'Shopping & E-Commerce' },
  { id: 'productivity', label: 'Productivity & Office' },
  { id: 'utilities', label: 'Utilities & Browsers' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'lifestyle', label: 'Lifestyle & Fashion' },
  { id: 'developer', label: 'Developer Tools' },
  { id: 'system', label: 'System & Framework' },
];

export function AdminAppCatalog() {
  const [apps, setApps] = useState<CatalogApp[]>(AppCatalogService.getAllApps());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CatalogAppCategory | 'all'>('all');
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<'all' | 'canonical' | 'extended'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [installedFilter, setInstalledFilter] = useState<'all' | 'installed' | 'not_installed'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Icon upload state
  const iconFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetApp, setUploadTargetApp] = useState<CatalogApp | null>(null);

  // Device simulation state
  const [activeProfileId, setActiveProfileId] = useState<DeviceProfileId>(
    DeviceAppScannerService.getActiveProfileId()
  );
  const [isScanningDevice, setIsScanningDevice] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPackage, setFormPackage] = useState('');
  const [formCategory, setFormCategory] = useState<CatalogAppCategory>('utilities');
  const [formIcon, setFormIcon] = useState('Smartphone');
  const [formAccent, setFormAccent] = useState('#10b981');
  const [formStatus, setFormStatus] = useState<'active' | 'disabled'>('active');
  const [formKeywords, setFormKeywords] = useState('');
  const [formIsSystem, setFormIsSystem] = useState(false);
  const [formWebIntent, setFormWebIntent] = useState('');

  // Live auto-generated SVG filename
  const autoSvgName = CatalogIconHelper.normalizeToSvgFilename(formName || 'app');

  const handleTriggerUpload = (app: CatalogApp, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadTargetApp(app);
    if (iconFileInputRef.current) {
      iconFileInputRef.current.value = '';
      iconFileInputRef.current.click();
    }
  };

  const handleIconFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetApp) return;

    const isSvg = file.name.endsWith('.svg');
    const isPng = file.type.includes('png') || file.name.endsWith('.png');
    const isJpg = file.type.includes('jpeg') || file.type.includes('jpg') || /\.(jpe?g)$/i.test(file.name);

    if (!isSvg && !isPng && !isJpg) {
      showToast('Supported formats: SVG, PNG, JPEG/JPG');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const res = await AppCatalogService.attachIconAsset(uploadTargetApp.packageName, {
          dataUrl,
          originalFileName: file.name,
          format: isSvg ? 'svg' : isPng ? 'png' : 'jpeg',
          fileSizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
          mimeType: file.type || (isSvg ? 'image/svg+xml' : isPng ? 'image/png' : 'image/jpeg'),
        });

        if (res.success) {
          showToast(`Attached ${file.name} to ${uploadTargetApp.name}!`);
        } else {
          showToast(res.error || 'Failed to attach icon.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast(`Upload failed: ${err?.message || 'Error reading file'}`);
    }
  };

  useEffect(() => {
    const unsubCatalog = AppCatalogService.subscribe(() => {
      setApps(AppCatalogService.getAllApps());
    });
    const unsubDevice = DeviceAppScannerService.subscribe(() => {
      setActiveProfileId(DeviceAppScannerService.getActiveProfileId());
      setApps([...AppCatalogService.getAllApps()]);
    });

    return () => {
      unsubCatalog();
      unsubDevice();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeviceProfileChange = (id: DeviceProfileId) => {
    DeviceAppScannerService.setDeviceProfile(id);
    setActiveProfileId(id);
    showToast(`Switched active device profile to ${DEVICE_PROFILES[id]?.name || id}`);
  };

  const handleRescanDevice = async () => {
    setIsScanningDevice(true);
    await AppRepository.refreshApps();
    setTimeout(() => {
      setIsScanningDevice(false);
      showToast('Device package scan completed.');
    }, 400);
  };

  const handleToggleDeviceInstall = (app: CatalogApp, e: React.MouseEvent) => {
    e.stopPropagation();
    const isNowInstalled = DeviceAppScannerService.toggleAppInstalled(app.packageName);
    showToast(
      isNowInstalled
        ? `Simulated install: "${app.name}" is now on device.`
        : `Simulated uninstall: "${app.name}" removed from device.`
    );
  };

  const filteredApps = apps.filter((app) => {
    // Catalog Type Filter (Canonical 56 vs Extended 22 vs All)
    if (catalogTypeFilter === 'canonical') {
      const isCanonical = app.catalogType === 'canonical' || !app.catalogType;
      if (!isCanonical) return false;
    } else if (catalogTypeFilter === 'extended') {
      if (app.catalogType !== 'extended') return false;
    }

    if (selectedCategory !== 'all' && app.category !== selectedCategory) return false;
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;

    const isInstalled = DeviceAppScannerService.isPackageInstalled(
      app.packageName,
      app.packageAliases
    );
    if (installedFilter === 'installed' && !isInstalled) return false;
    if (installedFilter === 'not_installed' && isInstalled) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const matchName =
      app.name.toLowerCase().includes(q) ||
      (app.displayName && app.displayName.toLowerCase().includes(q));
    const matchPkg = app.packageName.toLowerCase().includes(q);
    const matchKey = (app.iconKey || '').toLowerCase().includes(q);
    const matchKeywords =
      app.searchKeywords?.some((k) => k.toLowerCase().includes(q)) ||
      app.aliases?.some((a) => a.toLowerCase().includes(q));
    return matchName || matchPkg || matchKey || matchKeywords;
  });

  const canonicalCount = apps.filter((a) => a.catalogType === 'canonical' || !a.catalogType).length;
  const extendedCount = apps.filter((a) => a.catalogType === 'extended').length;

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / pageSize));
  const paginatedApps = filteredApps.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setEditingPackage(null);
    setFormName('');
    setFormPackage('');
    setFormCategory('utilities');
    setFormIcon('Smartphone');
    setFormAccent('#10b981');
    setFormStatus('active');
    setFormKeywords('');
    setFormIsSystem(false);
    setFormWebIntent('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app: CatalogApp) => {
    setEditingPackage(app.packageName);
    setFormName(app.name);
    setFormPackage(app.packageName);
    setFormCategory(app.category);
    setFormIcon(app.defaultIcon);
    setFormAccent(app.accentColor);
    setFormStatus(app.status || 'active');
    setFormKeywords(app.searchKeywords?.join(', ') || '');
    setFormIsSystem(Boolean(app.isSystemApp));
    setFormWebIntent(app.webFallbackIntent || '');
    setIsModalOpen(true);
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    const keywordsArray = formKeywords
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (editingPackage) {
      const res = await AppCatalogService.updateApp(editingPackage, {
        name: formName,
        category: formCategory,
        defaultIcon: formIcon,
        accentColor: formAccent,
        status: formStatus,
        searchKeywords: keywordsArray,
        isSystemApp: formIsSystem,
        webFallbackIntent: formWebIntent.trim() || undefined,
      });

      if (res.success) {
        showToast(`Updated "${formName}" in catalog.`);
        setIsModalOpen(false);
      } else {
        showToast(res.error || 'Failed to update app.');
      }
    } else {
      const res = await AppCatalogService.addApp({
        name: formName,
        packageName: formPackage,
        category: formCategory,
        defaultIcon: formIcon,
        accentColor: formAccent,
        status: formStatus,
        searchKeywords: keywordsArray,
        isSystemApp: formIsSystem,
        webFallbackIntent: formWebIntent.trim() || undefined,
      });

      if (res.success) {
        showToast(`Added "${formName}" with icon "${autoSvgName}".`);
        setIsModalOpen(false);
      } else {
        showToast(res.error || 'Failed to add app.');
      }
    }
  };

  const handleToggleStatus = async (app: CatalogApp) => {
    const res = await AppCatalogService.toggleAppStatus(app.packageName);
    if (res.success) {
      showToast(`App "${app.name}" is now ${res.status}.`);
    }
  };

  const handleDelete = async (app: CatalogApp) => {
    if (confirm(`Remove "${app.name}" (${app.packageName}) from catalog?`)) {
      const res = await AppCatalogService.deleteApp(app.packageName);
      if (res.success) {
        showToast(`Removed from catalog.`);
      } else {
        showToast(res.error || 'Failed to remove.');
      }
    }
  };

  const deviceInstalledCount = apps.filter((a) =>
    DeviceAppScannerService.isPackageInstalled(a.packageName, a.packageAliases)
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-neutral-900 border border-emerald-500/50 text-white text-xs shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for uploading icon assets directly to an app */}
      <input
        ref={iconFileInputRef}
        type="file"
        accept=".svg,.png,.jpg,.jpeg"
        onChange={handleIconFileSelected}
        className="hidden"
      />

      {/* Header & Catalog Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-white tracking-tight">Admin App Catalog</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
              {canonicalCount} Canonical Apps
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono">
              {extendedCount} Extended Apps
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono">
              {deviceInstalledCount} Installed on Device
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Centralized registry of 56 canonical applications + 22 extended apps, supporting SVG, PNG, and JPEG icon asset uploads and Android package bindings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-2 self-start"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom App</span>
        </button>
      </div>

      {/* Catalog Scope Filter: Canonical vs Extended vs All */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-neutral-400 px-2 font-mono">Filter Catalog:</span>
          <button
            type="button"
            onClick={() => {
              setCatalogTypeFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              catalogTypeFilter === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Apps ({apps.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setCatalogTypeFilter('canonical');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              catalogTypeFilter === 'canonical'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Canonical Apps</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              {canonicalCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCatalogTypeFilter('extended');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              catalogTypeFilter === 'extended'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Extended Apps</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {extendedCount}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-400 font-mono px-2">
          Showing {filteredApps.length} of {apps.length} apps
        </div>
      </div>

      {/* Device Architecture Banner (Admin Catalog vs User Device List Separation) */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-white">Active Device Environment: </span>
              <span className="text-xs text-emerald-400 font-mono">
                {DeviceAppScannerService.isNativeAndroid()
                  ? 'Physical Android Device (Live PackageManager)'
                  : DEVICE_PROFILES[activeProfileId]?.name || 'Simulated Device Profile'}
              </span>
            </div>
          </div>

          {/* Device Profile Switcher for Testing User A vs User B */}
          {!DeviceAppScannerService.isNativeAndroid() && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-neutral-400">Test Profile:</span>
              {(['device_default', 'device_a', 'device_b', 'device_custom'] as DeviceProfileId[]).map(
                (pid) => {
                  const p = DEVICE_PROFILES[pid];
                  const isActive = activeProfileId === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => handleDeviceProfileChange(pid)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
                      }`}
                      title={p.description}
                    >
                      {pid === 'device_default'
                        ? 'Default (14)'
                        : pid === 'device_a'
                        ? 'User A (4)'
                        : pid === 'device_b'
                        ? 'User B (5)'
                        : 'Custom'}
                    </button>
                  );
                }
              )}

              <button
                type="button"
                onClick={handleRescanDevice}
                disabled={isScanningDevice}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 border border-neutral-700 cursor-pointer disabled:opacity-50"
                title="Trigger Android PackageManager rescan"
              >
                <RefreshCw className={`w-3 h-3 ${isScanningDevice ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Rescan</span>
              </button>
            </div>
          )}
        </div>

        <div className="text-[11px] text-neutral-400 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/80 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-neutral-200">Architectural Separation:</strong> The Master Catalog contains all <strong>{apps.length}</strong> supported apps ({canonicalCount} canonical, {extendedCount} extended). The user device app list only displays apps that are <em>actually installed on the target device</em> ({deviceInstalledCount} installed).
          </span>
        </div>
      </div>

      {/* Search, Filters & Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by app name, package, or icon key (e.g. discord.svg)..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={installedFilter}
            onChange={(e) => {
              setInstalledFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Device Statuses</option>
            <option value="installed">Installed on Device ({deviceInstalledCount})</option>
            <option value="not_installed">Not on Device ({apps.length - deviceInstalledCount})</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* App Catalog Table / List */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 divide-y divide-neutral-800/80 overflow-hidden shadow-sm">
        {paginatedApps.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            No applications match the search and filter criteria.
          </div>
        ) : (
          paginatedApps.map((app) => {
            const isInstalled = DeviceAppScannerService.isPackageInstalled(
              app.packageName,
              app.packageAliases
            );
            const iconKey = app.iconKey || `${CatalogIconHelper.normalizeToSvgFilename(app.name)}`;
            const isExtended = app.catalogType === 'extended';
            const isIconUploaded = app.iconStatus === 'available' || Boolean(app.iconAsset);

            return (
              <div
                key={app.id || app.packageName}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-800/20 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* SVG Icon Renderer with Fallback */}
                  <CatalogAppIcon app={app} size="md" showFallbackBadge={true} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-semibold text-white truncate">{app.displayName || app.name}</h4>
                      {isExtended ? (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-mono font-semibold">
                          EXTENDED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-semibold">
                          CANONICAL
                        </span>
                      )}
                      {!isIconUploaded ? (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-mono">
                          NO ICON UPLOADED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono">
                          ICON READY
                        </span>
                      )}
                      {app.isSystemApp && (
                        <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 text-[9px] font-mono">
                          SYSTEM
                        </span>
                      )}
                      {isInstalled ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          INSTALLED ON DEVICE
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800/80 text-neutral-400 border border-neutral-700 text-[9px] font-mono">
                          NOT ON DEVICE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 truncate mt-0.5">
                      <span className="text-neutral-300">{app.packageName}</span>
                      <span className="text-neutral-600">&bull;</span>
                      <span className="text-emerald-400/90 flex items-center gap-1">
                        <FileCode2 className="w-3 h-3" />
                        {iconKey}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs flex-wrap shrink-0 justify-between sm:justify-end">
                  <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px] font-mono uppercase">
                    {app.category}
                  </span>

                  {/* Upload Icon Asset Button */}
                  <button
                    type="button"
                    onClick={(e) => handleTriggerUpload(app, e)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer border bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20 flex items-center gap-1"
                    title="Upload SVG, PNG, or JPEG icon asset for this app"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Icon</span>
                  </button>

                  {/* Quick Device Toggle */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleDeviceInstall(app, e)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer border ${
                      isInstalled
                        ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-rose-500/40 hover:text-rose-300'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                    title={isInstalled ? 'Simulate uninstall from device' : 'Simulate install on device'}
                  >
                    {isInstalled ? 'Uninstall' : '+ Install'}
                  </button>

                  {/* Active / Disabled Status Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(app)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono cursor-pointer transition ${
                      app.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
                    }`}
                  >
                    {app.status.toUpperCase()}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(app)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
                    title="Edit app metadata"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(app)}
                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-neutral-800 transition cursor-pointer"
                    title="Remove from catalog"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-neutral-400 px-2">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredApps.length)} of {filteredApps.length} apps
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 disabled:opacity-40 hover:bg-neutral-800 text-white cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-mono text-[11px]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 disabled:opacity-40 hover:bg-neutral-800 text-white cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit App Modal with Automatic SVG Normalization Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveApp}
            className="max-w-md w-full rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {editingPackage ? `Edit App: ${formName}` : 'Add Application to Catalog'}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Extensible catalog record with automatic SVG icon normalization
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* App Name */}
              <div>
                <label className="block text-neutral-400 mb-1">Application Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Google Pay, Disney+ Hotstar"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Automatic SVG Icon Normalization Box */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5" />
                    Automatic SVG Icon Resolution
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Safe Normalized Key
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Live Icon Preview */}
                  <CatalogAppIcon
                    app={{
                      name: formName || 'New App',
                      packageName: formPackage || 'com.example.app',
                      iconKey: autoSvgName,
                      iconPath: `/icons/${autoSvgName}`,
                      accentColor: formAccent,
                      defaultIcon: formIcon,
                    }}
                    size="md"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono font-bold text-white truncate">
                      {autoSvgName}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      Path: /icons/{autoSvgName}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-neutral-500 leading-normal">
                  If the SVG asset exists in <code className="text-neutral-400">public/icons/</code> it will render immediately. If not yet supplied, ONEVA's clean vector fallback is displayed without broken images.
                </p>
              </div>

              {/* Package Name */}
              <div>
                <label className="block text-neutral-400 mb-1">Android Package Name *</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingPackage)}
                  value={formPackage}
                  onChange={(e) => setFormPackage(e.target.value)}
                  placeholder="e.g. com.google.android.apps.nbu.paisa.user"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50 text-[11px]"
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="active">Active (Supported)</option>
                    <option value="disabled">Disabled (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-neutral-400 mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formAccent}
                    onChange={(e) => setFormAccent(e.target.value)}
                    className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={formAccent}
                    onChange={(e) => setFormAccent(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Search Keywords */}
              <div>
                <label className="block text-neutral-400 mb-1">Search Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="pay, upi, payment, transfer"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Web Intent */}
              <div>
                <label className="block text-neutral-400 mb-1">Web Fallback URL / Intent (Optional)</label>
                <input
                  type="text"
                  value={formWebIntent}
                  onChange={(e) => setFormWebIntent(e.target.value)}
                  placeholder="https://pay.google.com"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 text-[11px] font-mono"
                />
              </div>

              {/* System App Flag */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="system-check"
                  checked={formIsSystem}
                  onChange={(e) => setFormIsSystem(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-800 text-emerald-500"
                />
                <label htmlFor="system-check" className="text-neutral-300 cursor-pointer">
                  Flag as pre-installed System Application
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-xs text-neutral-300 hover:bg-neutral-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                {editingPackage ? 'Save Changes' : 'Add to Catalog'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
