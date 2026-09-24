import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Eye,
  Trash2,
  Sparkles,
  FileArchive,
  Check,
  X,
  Smartphone,
  ExternalLink,
  Layers,
  ArrowRight,
  Star,
  Globe,
} from 'lucide-react';
import { FullIconPack, IconPackImportSummary, UserIconState } from '../types/catalogAndIcons';
import { AdvancedIconSystem } from '../services/advancedIconSystem';
import { AppCatalogService } from '../services/appCatalogService';
import { IconPackValidator } from '../services/iconPackValidator';
import { AdminAssetService } from '../services/adminAssetService';

export function AdminFullIconPacks() {
  const [packs, setPacks] = useState<FullIconPack[]>(AdvancedIconSystem.getAllPacks());
  const [userState, setUserState] = useState<UserIconState>(AdvancedIconSystem.getUserState());
  const [isUploading, setIsUploading] = useState(false);
  const [importSummary, setImportSummary] = useState<IconPackImportSummary | null>(null);
  const [importedPackName, setImportedPackName] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);
  const [searchInPack, setSearchInPack] = useState('');
  const [isCreatingSample, setIsCreatingSample] = useState(false);

  // Delete modal state
  const [packToDelete, setPackToDelete] = useState<FullIconPack | null>(null);
  const [isDeletingPack, setIsDeletingPack] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = AdvancedIconSystem.subscribe(() => {
      setPacks(AdvancedIconSystem.getAllPacks());
      setUserState(AdvancedIconSystem.getUserState());
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleZipFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setImportSummary(null);
    setImportErrors([]);
    setImportedPackName(null);

    try {
      const res = await AdvancedIconSystem.importFullPackFromZip(file, file.name);

      setImportSummary(res.summary);
      setImportErrors(res.errors);

      if (res.success && res.pack) {
        setImportedPackName(res.pack.name);
        showToast(`Icon Pack "${res.pack.name}" imported with ${res.summary.matched} matched apps!`);
      } else {
        showToast('Icon Pack ZIP import failed. See details below.');
      }
    } catch (err: any) {
      setImportErrors([`Failed to process ZIP archive: ${err?.message || 'Decompression error'}`]);
      showToast('Error reading ZIP file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCreateSampleZip = async (variant: 'purple_glass' | 'neon_matrix') => {
    setIsCreatingSample(true);
    try {
      const zipBlob = await IconPackValidator.createSampleIconPackZip(variant);
      const zipFileName = variant === 'purple_glass' ? 'ONEVA_Purple_Glass.zip' : 'ONEVA_Cyber_Matrix.zip';
      const res = await AdvancedIconSystem.importFullPackFromZip(zipBlob, zipFileName);

      setImportSummary(res.summary);
      setImportErrors(res.errors);

      if (res.success && res.pack) {
        setImportedPackName(res.pack.name);
        showToast(`Sample Pack "${res.pack.name}" imported (${res.summary.matched} apps matched)!`);
      }
    } catch (err: any) {
      showToast('Failed to create sample ZIP pack.');
    } finally {
      setIsCreatingSample(false);
    }
  };

  const handleApplyFullPack = (packId: string) => {
    AdvancedIconSystem.applyFullIconPack(packId);
    const pack = packs.find((p) => p.id === packId);
    showToast(`Full pack "${pack?.name || packId}" applied across all apps.`);
  };

  const handleTogglePublish = async (pack: FullIconPack) => {
    const nextStatus = pack.status === 'published' ? 'draft' : 'published';
    const res = await AdvancedIconSystem.updatePack(pack.id, { status: nextStatus });
    if (res.success) {
      // Also sync with AdminAssetService
      try {
        await AdminAssetService.togglePublish(pack.id);
      } catch (e) {
        console.warn('Sync togglePublish warning:', e);
      }
      showToast(`Pack "${pack.name}" is now ${nextStatus.toUpperCase()}.`);
    } else {
      showToast(`Failed to update status: ${res.error}`);
    }
  };

  const handleInitiateDeletePack = (pack: FullIconPack) => {
    if (pack.isDefault) {
      showToast('Cannot delete the mandatory default Neon Light pack.');
      return;
    }
    setPackToDelete(pack);
  };

  const handleConfirmDeletePack = async () => {
    if (!packToDelete) return;
    setIsDeletingPack(true);
    try {
      // Delete from AdvancedIconSystem (local packs + single app icons extracted)
      const res = await AdvancedIconSystem.deletePack(packToDelete.id);
      // Also delete from AdminAssetService (cleans IndexedDB binaries, tombstoning, and broadcasts realtime sync)
      await AdminAssetService.deleteAsset(packToDelete.id);

      if (res.success) {
        showToast(`Icon pack "${packToDelete.name}" permanently deleted.`);
        if (expandedPackId === packToDelete.id) setExpandedPackId(null);
        setPackToDelete(null);
      } else {
        showToast(res.error || 'Failed to delete pack.');
      }
    } catch (err: any) {
      showToast(`Delete error: ${err?.message || 'Failed to delete pack'}`);
    } finally {
      setIsDeletingPack(false);
    }
  };

  const catalogApps = AppCatalogService.getAllApps();

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-200 text-xs flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for ZIP */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        onChange={handleZipFileSelected}
        className="hidden"
      />

      {/* Top Upload Section */}
      <div className="bg-[#09132A]/80 border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/10 to-transparent pointer-events-none rounded-full blur-2xl" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-wide">Icon Packs</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Upload independent icon pack ZIPs. The engine reads manifests, identifies matching catalog apps, and
              automatically enriches both the full pack and each app&apos;s individual icon list.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Analyzing Archive...' : '+ Upload Icon Pack ZIP'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateSampleZip('purple_glass')}
              disabled={isCreatingSample || isUploading}
              title="Quickly test with a sample Purple Glass ZIP pack"
              className="px-3.5 py-2.5 bg-[#0e1a38] hover:bg-[#13224a] text-slate-300 hover:text-white border border-cyan-500/25 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileArchive className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Test Sample ZIP</span>
            </button>
          </div>
        </div>

        {/* Upload Summary / Results */}
        {importSummary && (
          <div className="mt-5 p-4 rounded-xl bg-[#0b1633] border border-cyan-500/30 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white">
                  {importedPackName ? `Pack "${importedPackName}" processed` : 'ZIP Processed Successfully'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImportSummary(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-center">
              <div className="p-2.5 rounded-lg bg-[#070e22] border border-slate-800">
                <div className="text-[10px] text-slate-400">Total in ZIP</div>
                <div className="text-sm font-bold text-white mt-0.5">{importSummary.totalInZip}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                <div className="text-[10px] text-emerald-300">Catalog Matched</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{importSummary.matched}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400">Unmatched</div>
                <div className="text-sm font-bold text-slate-300 mt-0.5">{importSummary.unmatched}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
                <div className="text-[10px] text-cyan-300">Available in Strips</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">Yes (Live)</div>
              </div>
            </div>

            {importErrors.length > 0 && (
              <div className="mt-3 p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-lg text-amber-200 text-[11px] space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Validation Warnings:</span>
                </div>
                {importErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Installed / Available Icon Packs Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Installed / Available Icon Packs ({packs.length})
          </h3>
          <div className="text-[11px] text-slate-500">
            Active: <span className="text-cyan-300 font-semibold">{packs.find((p) => p.id === userState.activeFullPackId)?.name || 'None'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {packs.map((pack) => {
            const isActive = userState.activeFullPackId === pack.id;
            const matchedCount = Object.keys(pack.iconMappings).length;
            const isExpanded = expandedPackId === pack.id;

            return (
              <div
                key={pack.id}
                className={`rounded-2xl border transition overflow-hidden ${
                  isActive
                    ? 'bg-[#0a1738]/90 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-[#09132A]/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Pack Card Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {/* Thumbnail preview */}
                    <div className="w-12 h-12 rounded-xl bg-[#060c1d] border border-cyan-500/25 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      {pack.previewImages?.[0] ? (
                        <img
                          src={pack.previewImages[0]}
                          alt={pack.name}
                          className="w-10 h-10 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-cyan-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{pack.name}</h4>
                        {pack.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Default Pack
                          </span>
                        )}
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            Applied
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 font-mono ${
                          pack.status === 'published'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}>
                          {pack.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-mono">
                          <Star className="w-2.5 h-2.5 fill-blue-400 text-blue-400" />
                          <span>★ {pack.isDefault ? '10' : '9'}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        <span className="text-cyan-400 font-medium">
                          {matchedCount} {matchedCount === 1 ? 'matched app' : 'apps matched'}
                        </span>
                        <span>•</span>
                        <span>v{pack.version}</span>
                        <span>•</span>
                        <span>{pack.author}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pack Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                    <button
                      type="button"
                      onClick={() => setExpandedPackId(isExpanded ? null : pack.id)}
                      className="px-3 py-1.5 bg-[#0e1a38] hover:bg-[#13234d] text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isExpanded ? 'Hide' : 'Apps'}</span>
                    </button>

                    {!pack.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(pack)}
                        title={pack.status === 'published' ? 'Unpublish from Marketplace' : 'Publish to Marketplace'}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                          pack.status === 'published'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-amber-500/15 hover:text-amber-300 hover:border-amber-500/30'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-bold shadow-md shadow-cyan-950/40'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>{pack.status === 'published' ? 'Published' : 'Publish'}</span>
                      </button>
                    )}

                    {isActive ? (
                      <div className="px-3.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Applied</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyFullPack(pack.id)}
                        className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Apply</span>
                      </button>
                    )}

                    {!pack.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleInitiateDeletePack(pack)}
                        title="Delete this pack"
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded View Matched Apps */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-[#060e24] p-4 sm:p-5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-xs text-slate-400">
                        Showing matched catalog apps ({matchedCount})
                      </div>
                      <div className="relative w-48">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Filter pack apps..."
                          value={searchInPack}
                          onChange={(e) => setSearchInPack(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1 bg-[#09132A] border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto pr-1">
                      {Object.entries(pack.iconMappings)
                        .filter(([pkg]) => {
                          if (!searchInPack.trim()) return true;
                          const app = catalogApps.find((a) => a.packageName.toLowerCase() === pkg.toLowerCase());
                          return (
                            pkg.toLowerCase().includes(searchInPack.toLowerCase()) ||
                            app?.name.toLowerCase().includes(searchInPack.toLowerCase())
                          );
                        })
                        .map(([pkg, iconRelPath]) => {
                          const app = catalogApps.find((a) => a.packageName.toLowerCase() === pkg.toLowerCase());
                          const dataUrl = pack.extractedIcons?.[pkg];

                          return (
                            <div
                              key={pkg}
                              className="p-2 rounded-xl bg-[#09132A] border border-slate-800/80 flex items-center gap-2.5"
                            >
                              <div className="w-8 h-8 rounded-lg bg-[#040817] border border-cyan-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                                {dataUrl ? (
                                  <img
                                    src={dataUrl}
                                    alt={app?.name || pkg}
                                    className="w-6 h-6 object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Smartphone className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-semibold text-white truncate">
                                  {app?.name || pkg.split('.').pop()}
                                </div>
                                <div className="text-[9px] text-slate-500 font-mono truncate">{pkg}</div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {packToDelete && (
        <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#09132A] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Icon Pack</h3>
                <p className="text-xs text-slate-400">Permanently remove pack and extracted glyphs.</p>
              </div>
            </div>

            <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Pack Name:</span>
                <span className="text-white font-bold">{packToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Matched Apps:</span>
                <span className="text-cyan-400 font-bold">{Object.keys(packToDelete.iconMappings).length} apps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Status:</span>
                <span className={packToDelete.status === 'published' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {packToDelete.status?.toUpperCase() || 'PUBLISHED'}
                </span>
              </div>
            </div>

            {packToDelete.status === 'published' && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> This icon pack is PUBLISHED. Deleting it will immediately remove it from all user marketplaces and catalogs. Individual custom icon overrides remain safe.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPackToDelete(null)}
                disabled={isDeletingPack}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePack}
                disabled={isDeletingPack}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-950/50 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingPack ? 'Deleting...' : 'Confirm Permanent Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
