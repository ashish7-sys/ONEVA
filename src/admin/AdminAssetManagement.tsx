import { HardDrive, UploadCloud, Film, Image, Keyboard, Sparkles, FolderLock, Globe } from 'lucide-react';
import { AssetType } from '../types';

export function AdminAssetManagement() {
  const assetBuckets = [
    {
      id: 'oneva-public-assets',
      name: 'Public CDN Assets Bucket',
      description: 'Distributed CDN storage for verified wallpapers, icon packs, Edge Glow shaders, and tactile sounds.',
      access: 'Public Read / Admin Write Only',
      rlsEnforced: true,
      icon: Globe,
    },
    {
      id: 'oneva-admin-assets',
      name: 'Admin Staging & Private Assets Bucket',
      description: 'Pre-release visual assets, unreleased themes, raw animation masters, and cryptographic firmware signatures.',
      access: 'Admin Only Read & Write',
      rlsEnforced: true,
      icon: FolderLock,
    },
  ];

  const assetCategories: { type: AssetType; label: string; icon: typeof Film; spec: string }[] = [
    {
      type: 'live_wallpaper',
      label: 'Live Video Wallpapers',
      icon: Film,
      spec: 'MP4 / WebM fluid reactive canvases and Android Live Wallpaper services',
    },
    {
      type: 'system_ui',
      label: 'System UI & Widget Packs',
      icon: Sparkles,
      spec: 'System status bar, volume HUD, search bar, and Quick Settings tile bundles',
    },
    {
      type: 'keyboard_theme',
      label: 'Keyboard Theme Packages',
      icon: Keyboard,
      spec: 'Vector SVG tactile skins, font metrics & keycap color arrays',
    },
    {
      type: 'app_icon',
      label: 'System App Icons',
      icon: Image,
      spec: 'Vector XML adaptive masks & 512x512 high-DPI renders',
    },
    {
      type: 'icon_pack',
      label: 'Vector Icon Packs',
      icon: Sparkles,
      spec: 'Hierarchical ZIP bundles with glyph mapping manifest',
    },
    {
      type: 'wallpaper',
      label: 'Luminance Wallpapers',
      icon: Image,
      spec: '4K OLED true-black calibrated static and dynamic canvases',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Asset System Foundation</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Supabase Storage bucket architecture and visual asset distribution pipeline for ONEVA.
        </p>
      </div>

      {/* Buckets Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assetBuckets.map((bucket) => {
          const Icon = bucket.icon;
          return (
            <div key={bucket.id} className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-white">{bucket.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    RLS Active
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">{bucket.description}</p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                <span>ID: {bucket.id}</span>
                <span className="text-emerald-400">{bucket.access}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Target Asset Types Foundation */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Supported Visual Asset Classes</h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono">Storage Schema Ready</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {assetCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.type} className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300 mt-0.5 shrink-0">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-200 truncate">{cat.label}</p>
                  <p className="text-[11px] font-mono text-neutral-400 mt-0.5">{cat.spec}</p>
                  <p className="text-[10px] font-mono text-neutral-500 mt-1">type: {cat.type}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center gap-2 text-xs text-neutral-400">
          <UploadCloud className="w-4 h-4 text-neutral-500" />
          <span>
            Asset upload handlers and chunked multipart transfers will hook into this foundation in subsequent phases.
          </span>
        </div>
      </div>
    </div>
  );
}
