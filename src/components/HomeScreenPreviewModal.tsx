import { useState } from 'react';
import {
  X,
  Smartphone,
  Check,
  Sparkles,
  Grid,
  Layers,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { NavigationBus } from '../navigation/navigationBus';
import { PlatformBridge } from '../launcher/services/platformBridge';

interface HomeScreenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
  themeName?: string;
}

export function HomeScreenPreviewModal({
  isOpen,
  onClose,
  accentColor = '#06b6d4',
  themeName = 'ONEVA Theme',
}: HomeScreenPreviewModalProps) {
  const [gridDensity, setGridDensity] = useState<'4x5' | '4x6' | '5x6'>('4x6');
  const [dockIconsCount, setDockIconsCount] = useState<number>(5);
  const [showSearchWidget, setShowSearchWidget] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApply = () => {
    PlatformBridge.performHapticFeedback('confirm');
    try {
      localStorage.setItem(
        'oneva_home_screen_config',
        JSON.stringify({
          gridDensity,
          dockIconsCount,
          showSearchWidget,
          updatedAt: Date.now(),
        })
      );
    } catch (e) {
      // safe continue
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleGoToWallpapers = () => {
    onClose();
    NavigationBus.navigateTo('wallpapers');
  };

  const handleGoToLauncher = () => {
    onClose();
    NavigationBus.navigateTo('launcher');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#09132A] border border-cyan-500/30 shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/15 flex items-center justify-between bg-[#060D1F]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Home Screen &amp; Neon Grid
              </h2>
              <p className="text-[11px] text-slate-400">
                Grid layout, icon arrangement, and wallpaper preview
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Mock Home Screen Phone Preview */}
          <div className="relative mx-auto w-64 h-96 rounded-[36px] bg-gradient-to-b from-indigo-950 via-slate-950 to-[#040816] border-4 border-slate-700/80 shadow-2xl overflow-hidden flex flex-col justify-between p-3 select-none">
            {/* Top Widget */}
            <div className="space-y-1 pt-3 px-2 text-center">
              <span className="text-2xl font-bold font-mono tracking-tight text-white drop-shadow">
                10:42
              </span>
              <p className="text-[10px] text-cyan-300 font-medium">Sunday &bull; 26°C Clear</p>
            </div>

            {/* Grid of app icons simulation */}
            <div className="grid grid-cols-4 gap-2.5 px-2 my-auto">
              {[
                { name: 'Phone', color: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' },
                { name: 'Messages', color: 'bg-blue-500/20 border-blue-400/40 text-blue-300' },
                { name: 'Chrome', color: 'bg-amber-500/20 border-amber-400/40 text-amber-300' },
                { name: 'Camera', color: 'bg-purple-500/20 border-purple-400/40 text-purple-300' },
                { name: 'YouTube', color: 'bg-red-500/20 border-red-400/40 text-red-300' },
                { name: 'WhatsApp', color: 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' },
                { name: 'Spotify', color: 'bg-teal-500/20 border-teal-400/40 text-teal-300' },
                { name: 'ONEVA', color: 'bg-cyan-500/30 border-cyan-400/60 text-cyan-200' },
              ].map((app, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold shadow-md ${app.color}`}
                  >
                    {app.name.charAt(0)}
                  </div>
                  <span className="text-[9px] text-slate-300 truncate w-full text-center">
                    {app.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Dock */}
            <div className="p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-around">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                P
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-[10px] font-bold text-blue-300">
                M
              </div>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/25 border border-cyan-400/50 flex items-center justify-center text-[10px] font-bold text-cyan-300 shadow-sm shadow-cyan-500/30">
                O
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-[10px] font-bold text-purple-300">
                C
              </div>
            </div>
          </div>

          {/* Quick Jump Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleGoToWallpapers}
              className="p-3 rounded-2xl bg-[#0F1B3B] border border-cyan-500/25 hover:border-cyan-400/45 text-left transition cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-white block">Live Wallpaper</span>
                <span className="text-[10px] text-slate-400">JARVIS Reactive 60FPS</span>
              </div>
              <ExternalLink className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={handleGoToLauncher}
              className="p-3 rounded-2xl bg-[#0F1B3B] border border-purple-500/25 hover:border-purple-400/45 text-left transition cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-white block">Launcher Surface</span>
                <span className="text-[10px] text-slate-400">Full Home Screen</span>
              </div>
              <ExternalLink className="w-4 h-4 text-purple-400" />
            </button>
          </div>

          {/* Grid Density Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Grid App Layout Density
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['4x5', '4x6', '5x6'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setGridDensity(g);
                    PlatformBridge.performHapticFeedback('light');
                  }}
                  className={`py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    gridDensity === g
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {g} Grid
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-cyan-500/15 bg-[#060D1F] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer active:scale-95 shadow-lg flex items-center gap-1.5 ${
              isSaved
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isSaved ? 'Grid Applied!' : 'Apply Home Grid'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
