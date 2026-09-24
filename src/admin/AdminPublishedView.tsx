import { useState, useEffect } from 'react';
import {
  Sparkles,
  Star,
  CheckCircle2,
  Filter,
  Search,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { AdminAssetService, ASSET_CATEGORIES } from '../services/adminAssetService';
import { OnevaAsset, OnevaAssetCategory } from '../types/adminAssets';

export function AdminPublishedView() {
  const [assets, setAssets] = useState<OnevaAsset[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reload = () => {
    const all = AdminAssetService.getAssets();
    setAssets(all.filter((a) => a.status === 'published'));
  };

  useEffect(() => {
    reload();
    return AdminAssetService.subscribe(reload);
  }, []);

  const filtered = assets.filter((a) => {
    if (selectedCat !== 'all' && a.category !== selectedCat) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const defaults = AdminAssetService.getAllDefaults();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Published Asset Master Catalog</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Aggregated master inventory of verified, production-ready assets currently available to ONEVA clients.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[10px] font-mono uppercase text-neutral-400">Total Published</span>
          <p className="text-xl font-bold text-white mt-0.5">{assets.length}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[10px] font-mono uppercase text-neutral-400">Default Starred</span>
          <p className="text-xl font-bold text-amber-400 mt-0.5">
            {Object.values(defaults).filter(Boolean).length} / {ASSET_CATEGORIES.length}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[10px] font-mono uppercase text-neutral-400">Categories</span>
          <p className="text-xl font-bold text-white mt-0.5">{ASSET_CATEGORIES.length}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[10px] font-mono uppercase text-neutral-400">Delivery Architecture</span>
          <p className="text-xl font-bold text-emerald-400 mt-0.5">Zero APK OTA</p>
        </div>
      </div>

      {/* Filter and Category chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
              selectedCat === 'all'
                ? 'bg-emerald-500 text-neutral-950 font-bold'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
            }`}
          >
            All Categories ({assets.length})
          </button>
          {ASSET_CATEGORIES.map((c) => {
            const count = assets.filter((a) => a.category === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCat(c.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                  selectedCat === c.id
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter published assets..."
            className="w-full px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table list */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden divide-y divide-neutral-800/80">
        {filtered.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">{item.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {item.category.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">v{item.version}</span>
              </div>
              <p className="text-xs text-neutral-400 max-w-2xl">{item.description}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {item.isDefault ? (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-semibold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  ★ DEFAULT
                </span>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await AdminAssetService.setDefaultAsset(item.category, item.id);
                    if (res.success) {
                      showToast(`★ "${item.name}" is now the active default for ${item.category.toUpperCase()}!`);
                      reload();
                    } else {
                      showToast(`Error: ${res.error}`);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/30 text-neutral-300 border border-neutral-700 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                  title="Mark as active default for Full ONEVA Pack"
                >
                  <Star className="w-3 h-3 text-amber-400" />
                  <span>Set as Default</span>
                </button>
              )}
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                Live
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
