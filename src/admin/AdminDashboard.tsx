import { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  HardDrive,
  ShieldCheck,
  Activity,
  Cpu,
  Star,
  Package,
  Zap,
  CheckCircle2,
  X,
  Search,
  SlidersHorizontal,
  ArrowRight,
  Plus,
  Check,
} from 'lucide-react';
import { getAllFeatures } from '../features/registry';
import { AdminAssetService, ASSET_CATEGORIES } from '../services/adminAssetService';
import { AdvancedIconSystem } from '../services/advancedIconSystem';
import { OnevaAsset, OnevaAssetCategory } from '../types/adminAssets';

interface AdminDashboardProps {
  onNavigateTab?: (tab: any) => void;
}

export function AdminDashboard({ onNavigateTab }: AdminDashboardProps) {
  const features = getAllFeatures();
  const verifiedCount = features.filter((f) => f.status === 'verified').length;
  const testingCount = features.filter((f) => f.status === 'testing').length;
  const draftCount = features.filter((f) => f.status === 'draft').length;

  const [defaults, setDefaults] = useState(AdminAssetService.getAllDefaults());
  const [totalAssets, setTotalAssets] = useState(AdminAssetService.getAssets().length);
  const [selectedCategory, setSelectedCategory] = useState<typeof ASSET_CATEGORIES[number] | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshState = () => {
    setDefaults(AdminAssetService.getAllDefaults());
    setTotalAssets(AdminAssetService.getAssets().length);
  };

  useEffect(() => {
    refreshState();
    return AdminAssetService.subscribe(refreshState);
  }, []);

  const handleApplyDefault = async (catId: OnevaAssetCategory, assetId: string, assetName: string) => {
    const res = await AdminAssetService.setDefaultAsset(catId, assetId);
    if (res.success) {
      if (catId === 'icon_pack') {
        await AdvancedIconSystem.setDefaultPack(assetId);
      }
      showToast(`★ "${assetName}" is now the active Full ONEVA Pack default!`);
      refreshState();
      setSelectedCategory(null);
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  const handleSeedStarter = async (catId: OnevaAssetCategory, catName: string) => {
    const newAsset = await AdminAssetService.createAsset({
      name: `Default ${catName}`,
      category: catId,
      version: '1.0.0',
      description: `Official Full ONEVA Pack verified baseline profile for ${catName}.`,
      author: 'ONEVA Core Team',
      status: 'published',
      previewData: {
        color: '#10b981',
      },
      payload: {
        isStarterDefault: true,
      },
    });

    await AdminAssetService.setDefaultAsset(catId, newAsset.id);
    showToast(`★ Created and set "Default ${catName}" as Full ONEVA Pack default!`);
    refreshState();
    setSelectedCategory(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">ONEVA System Overview</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Master control panel for ONEVA Android client modules, remote asset distribution, and Full Pack defaults.
        </p>
      </div>

      {/* Summary KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Admin Asset Registry</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalAssets} Assets</p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Across {ASSET_CATEGORIES.length} isolated subsystems
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Full Pack Star System</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {Object.values(defaults).filter(Boolean).length} / {ASSET_CATEGORIES.length} Active
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Rule 4: Exactly 1 default per category
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Privacy Engine</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">Enforced</p>
          <p className="text-[11px] text-neutral-400 mt-1">Zero cloud logging of personal data</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Architecture</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">Offline-First</p>
          <p className="text-[11px] text-neutral-400 mt-1">Last-known-good local fallback</p>
        </div>
      </div>

      {/* ⭐ FULL ONEVA PACK LIVE DEFAULTS SUMMARY */}
      <div className="rounded-xl border border-amber-500/30 bg-neutral-900/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h3 className="text-sm font-semibold text-white">Full ONEVA Pack &bull; Current Admin Defaults</h3>
          </div>
          <span className="text-[11px] text-amber-300 font-mono">
            Automatically distributed to users
          </span>
        </div>

        <div className="divide-y divide-neutral-800/80 rounded-xl border border-neutral-800 bg-neutral-950/60 overflow-hidden">
          {ASSET_CATEGORIES.map((cat) => {
            const defAsset = defaults[cat.id];
            const catAssets = AdminAssetService.getAssetsByCategory(cat.id, true);

            return (
              <div key={cat.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 font-mono text-[10px] uppercase">{cat.name}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">({catAssets.length} total)</span>
                  </div>
                  <p className="text-neutral-200 font-medium">
                    {defAsset ? defAsset.name : 'No default active'}
                  </p>
                  <p className="text-[11px] text-neutral-400">{defAsset?.description || 'Pending Admin selection'}</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {defAsset ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-300" />
                      ★ DEFAULT
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono">
                      No Default
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-neutral-400">
                    v{defAsset?.version || '1.0.0'}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setModalSearch('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>{defAsset ? 'Change Default' : 'Set as Default'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Catalog Quick View */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Registered ONEVA Feature Manifests</h3>
          </div>
          <span className="text-xs text-neutral-400">{features.length} Isolated Modules</span>
        </div>

        <div className="divide-y divide-neutral-800/80">
          {features.map((feat) => (
            <div key={feat.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-200">{feat.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                    v{feat.version}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800/60 text-neutral-400">
                    {feat.category}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">{feat.tagline}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border capitalize ${
                  feat.status === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : feat.status === 'testing'
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}>
                  {feat.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ⭐ Set Default Modal for Any Category */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Set Full ONEVA Pack Default &bull; {selectedCategory.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Select which verified asset is automatically deployed to users when applying Full ONEVA Pack
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder={`Search ${selectedCategory.name} candidates...`}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Candidate List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {(() => {
                const rawAssets = AdminAssetService.getAssetsByCategory(selectedCategory.id, false);
                let candidates = rawAssets;

                // For icon packs, also check AdvancedIconSystem packs
                if (selectedCategory.id === 'icon_pack') {
                  const packs = AdvancedIconSystem.getAllPacks();
                  const mappedPackIds = new Set(rawAssets.map((a) => a.id));
                  const extraPackAssets: OnevaAsset[] = packs
                    .filter((p) => !mappedPackIds.has(p.id))
                    .map((p) => ({
                      id: p.id,
                      name: p.name,
                      category: 'icon_pack' as const,
                      version: p.version,
                      description: p.description,
                      author: p.author,
                      status: p.status,
                      isDefault: p.isDefault,
                      payload: { packId: p.id },
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }));
                  candidates = [...rawAssets, ...extraPackAssets];
                }

                const filtered = candidates.filter((item) => {
                  if (!modalSearch) return true;
                  const query = modalSearch.toLowerCase();
                  return (
                    item.name.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    item.author.toLowerCase().includes(query)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center rounded-xl bg-neutral-950/60 border border-dashed border-neutral-800 space-y-3">
                      <p className="text-xs text-neutral-400">
                        No candidate assets found for {selectedCategory.name}.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSeedStarter(selectedCategory.id, selectedCategory.name)}
                        className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create &amp; Set Verified Starter Default</span>
                      </button>
                    </div>
                  );
                }

                return filtered.map((asset) => {
                  const isCurrentDefault = defaults[selectedCategory.id]?.id === asset.id || asset.isDefault;

                  return (
                    <div
                      key={asset.id}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-4 ${
                        isCurrentDefault
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-neutral-950/60 hover:bg-neutral-800/40 border-neutral-800'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{asset.name}</span>
                          <span className="text-[10px] font-mono text-neutral-400">v{asset.version}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border capitalize ${
                              asset.status === 'published'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : asset.status === 'testing'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                            }`}
                          >
                            {asset.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-2">{asset.description}</p>
                        <p className="text-[10px] font-mono text-neutral-500">By {asset.author}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isCurrentDefault ? (
                          <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 fill-amber-300" />
                            <span>Active Default</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApplyDefault(selectedCategory.id, asset.id, asset.name)}
                            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-400" />
                            <span>Set as Default</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="text-[11px]">
                Active Full Pack defaults update atomically across all Android client devices.
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-neutral-900 border border-emerald-500/50 text-white text-xs shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
