import { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  Package,
  Layers,
  Search,
  ExternalLink,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { AppRepository, DEMO_BRIDGE_TARGETS } from '../launcher/services/appRepository';
import { IconService } from '../services/iconService';

type SubTab = 'app_list' | 'applied';

export function AdminModifyApps() {
  const [subTab, setSubTab] = useState<SubTab>('app_list');
  const [search, setSearch] = useState('');
  const [apps, setApps] = useState(AppRepository.getAvailableApps().length > 0 ? AppRepository.getAvailableApps() : DEMO_BRIDGE_TARGETS);
  const [iconSettings, setIconSettings] = useState(IconService.getSettings());

  useEffect(() => {
    const unsubApp = AppRepository.subscribe(() => {
      const avail = AppRepository.getAvailableApps();
      setApps(avail.length > 0 ? avail : DEMO_BRIDGE_TARGETS);
    });
    const unsubIcon = IconService.subscribe(() => {
      setIconSettings(IconService.getSettings());
    });
    return () => {
      unsubApp();
      unsubIcon();
    };
  }, []);

  const filteredApps = apps.filter(
    (app) =>
      app.label.toLowerCase().includes(search.toLowerCase()) ||
      app.packageName.toLowerCase().includes(search.toLowerCase())
  );

  const appliedApps = apps.filter(
    (app) =>
      Boolean(iconSettings.individualAppIcons[app.packageName]) ||
      Boolean(iconSettings.individualPackOverrides[app.packageName])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Modify Genuine Apps</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Configure per-app icons, overrides, and verified customizations.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800 self-start">
          <button
            type="button"
            onClick={() => setSubTab('app_list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              subTab === 'app_list'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            App List ({apps.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('applied')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              subTab === 'applied'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Applied Configs ({appliedApps.length})
          </button>
        </div>
      </div>

      {/* Sub-tab 1: App List */}
      {subTab === 'app_list' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search genuine applications..."
              className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 divide-y divide-neutral-800/80 overflow-hidden">
            {filteredApps.map((app) => (
              <div key={app.packageName} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border font-mono"
                    style={{
                      backgroundColor: `${app.accentColor || '#10b981'}20`,
                      borderColor: `${app.accentColor || '#10b981'}40`,
                      color: app.accentColor || '#10b981',
                    }}
                  >
                    {app.fallbackInitial || app.label.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{app.label}</h4>
                    <p className="text-[11px] font-mono text-neutral-400">{app.packageName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px] uppercase font-mono">
                    {app.category}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                    Genuine APK
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 2: Applied Configurations */}
      {subTab === 'applied' && (
        <div className="space-y-4">
          {appliedApps.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center text-xs text-neutral-400">
              No individual app overrides configured yet. All applications use current system defaults.
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 divide-y divide-neutral-800/80 overflow-hidden">
              {appliedApps.map((app) => (
                <div key={app.packageName} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{app.label}</h4>
                    <p className="text-[11px] font-mono text-neutral-400">{app.packageName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {iconSettings.individualAppIcons[app.packageName] && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono">
                        Icon: {iconSettings.individualAppIcons[app.packageName]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
