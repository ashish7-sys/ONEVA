import { useState, useEffect } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  Zap,
  Keyboard as KeyboardIcon,
  Camera as CameraIcon,
  Activity,
  Bot,
  ShieldCheck,
  Layers,
  Sliders,
} from 'lucide-react';
import { OnevaAssetCategory } from '../types/adminAssets';
import { OnevaAssetBrowser } from '../components/assets/OnevaAssetBrowser';

interface CustomizationLibraryPageProps {
  onNavigate?: (pageId: string) => void;
}

interface ModuleFilterOption {
  id: 'all' | OnevaAssetCategory;
  label: string;
  icon: any;
}

const MODULE_FILTERS: ModuleFilterOption[] = [
  { id: 'all', label: 'All Modules', icon: Layers },
  { id: 'wallpaper', label: 'Wallpapers', icon: ImageIcon },
  { id: 'theme', label: 'Themes', icon: Palette },
  { id: 'icon_pack', label: 'Icon Packs', icon: Sparkles },
  { id: 'system_ui', label: 'System UI', icon: Sliders },
  { id: 'keyboard', label: 'Keyboard', icon: KeyboardIcon },
  { id: 'camera', label: 'Vision Profiles', icon: CameraIcon },
  { id: 'assist', label: 'Jarvis Cores', icon: Bot },
];

export function CustomizationLibraryPage({ onNavigate }: CustomizationLibraryPageProps) {
  const [selectedModule, setSelectedModule] = useState<'all' | OnevaAssetCategory>('all');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
              ONEVA ASSET ENGINE
            </span>
            <span className="text-[10px] font-mono text-neutral-400">Content Engine &amp; Library</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customization Library</h1>
          <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
            Browse verified themes, wallpapers, icon packs, and live canvases. Tap any asset for full-screen immersive
            preview and one-tap application to your real device.
          </p>
        </div>

        {/* Persistence Status */}
        <div className="flex items-center gap-3 bg-neutral-950/80 border border-neutral-800/80 p-3.5 rounded-2xl text-xs font-mono text-neutral-300 shrink-0 shadow-lg">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <span className="block text-[10px] text-neutral-500 uppercase">Persistence Status</span>
            <span className="text-cyan-400 font-semibold">Active &amp; Persistent Across Restarts</span>
          </div>
        </div>
      </div>

      {/* Module Selector Chips */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2 min-w-max p-1 bg-neutral-900/60 rounded-2xl border border-neutral-800/80">
          {MODULE_FILTERS.map((mod) => {
            const Icon = mod.icon;
            const isSelected = selectedModule === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setSelectedModule(mod.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-800 text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-neutral-400'}`} />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Asset Browser with Horizontal Category Bar, Dynamic Sorting & Fullscreen Immersive Preview */}
      <OnevaAssetBrowser
        targetCategory={selectedModule === 'all' ? undefined : selectedModule}
        title={
          selectedModule === 'all'
            ? 'All Customization Modules'
            : MODULE_FILTERS.find((m) => m.id === selectedModule)?.label || 'Catalog'
        }
        subtitle="Tap any card to view full-screen preview with realistic device mockup or live canvas."
        allowUpload={true}
      />
    </div>
  );
}
