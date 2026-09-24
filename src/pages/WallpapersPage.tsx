import { useState } from 'react';
import { Sparkles, Sliders, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { OnevaAssetBrowser } from '../components/assets/OnevaAssetBrowser';
import { LiveWallpaperPage } from './LiveWallpaperPage';

interface WallpapersPageProps {
  onNavigateBack?: () => void;
}

export function WallpapersPage({ onNavigateBack }: WallpapersPageProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'engine'>('browse');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 text-white">
      {/* Top Navigation & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-cyan-400" />
              <span>Wallpapers &amp; Live Canvases</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              High-contrast OLED wallpapers and kinetic 60FPS reactive live canvases.
            </p>
          </div>
        </div>

        {/* View Switcher: Browser vs Engine Calibration */}
        <div className="flex items-center p-1 bg-neutral-900/80 rounded-2xl border border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-950/40 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Browse Catalog</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'engine'
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-950/40 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Live Engine Settings</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'browse' ? (
        <OnevaAssetBrowser
          targetCategory="wallpaper"
          title="Wallpaper Catalog"
          subtitle="Select any static or reactive live wallpaper. Tap to enter full-screen preview and apply to your device."
          allowUpload={true}
        />
      ) : (
        <LiveWallpaperPage onNavigateBack={() => setActiveTab('browse')} />
      )}
    </div>
  );
}
