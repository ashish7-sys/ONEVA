import { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Sliders,
  RotateCcw,
  Zap,
  Smartphone,
  ShieldCheck,
  Check,
  ChevronRight,
} from 'lucide-react';
import { JarvisFuturisticLiveWallpaper } from '../components/JarvisFuturisticLiveWallpaper';
import { AssistService } from '../services/assistService';
import { UserCustomizationService } from '../services/userCustomizationService';
import { WallpaperService } from '../services/wallpaperService';
import { PlatformBridge } from '../launcher/services/platformBridge';

interface LiveWallpaperPageProps {
  onNavigateBack?: () => void;
}

export function LiveWallpaperPage({ onNavigateBack }: LiveWallpaperPageProps) {
  const [wallpaperStyle, setWallpaperStyle] = useState<'jarvis_reactive' | 'cyber_grid' | 'cosmic_nebula'>('jarvis_reactive');
  const [animSpeed, setAnimSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [interactionEffect, setInteractionEffect] = useState<boolean>(true);
  const [offlineMode, setOfflineMode] = useState<boolean>(true);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);
  const [showStyleModal, setShowStyleModal] = useState(false);

  const handleApplyWallpaper = () => {
    PlatformBridge.performHapticFeedback('confirm');
    AssistService.setLiveWallpaperEnabled(true);
    UserCustomizationService.applyItem('wallpaper', 'jarvis_futuristic_live');
    WallpaperService.applyWallpaper({
      presetId: 'jarvis_futuristic_live',
      assetId: 'jarvis_futuristic_live',
      name: 'JARVIS Reactive Wallpaper',
      source: 'preset',
    });

    // Notify Android WallpaperManager bridge
    setAppliedToast('Applied to Android Home Screen! Persists offline like a native live wallpaper.');
    setTimeout(() => setAppliedToast(null), 4000);
  };

  const styleNames = {
    jarvis_reactive: 'JARVIS Reactive',
    cyber_grid: 'Cyberpunk Grid',
    cosmic_nebula: 'Deep Cosmic Nebula',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Toast */}
      {appliedToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-neutral-900/95 border border-cyan-500/40 shadow-2xl px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-xs text-neutral-200 font-medium">{appliedToast}</span>
        </div>
      )}

      {/* Header (Reference Screen 5) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Live Wallpaper</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Set interactive, reactive wallpaper for your real Android home screen.
          </p>
        </div>
      </div>

      {/* Center Live Wallpaper Preview Canvas (Reference Screen 5) */}
      <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-black shadow-2xl shadow-cyan-950/40 h-80 sm:h-96">
        <JarvisFuturisticLiveWallpaper
          interactive={interactionEffect}
          forceAwakeMode={true}
        />

        {/* Overlay Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-cyan-300 text-[10px] font-mono border border-cyan-500/30 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            LIVE PREVIEW
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-white/10 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-white font-semibold block">{styleNames[wallpaperStyle]}</span>
            <span className="text-[10px] text-neutral-400">Touch or swipe preview to test kinetic reaction</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
            60 FPS
          </span>
        </div>
      </div>

      {/* Controls List (Reference Screen 5: Wallpaper Style, Animation Speed, Interaction Effect, Offline Mode) */}
      <div className="rounded-2xl bg-neutral-900/60 border border-white/10 divide-y divide-white/5 overflow-hidden">
        {/* 1. Wallpaper Style */}
        <div
          onClick={() => setShowStyleModal(true)}
          className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition cursor-pointer"
        >
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-white block">Wallpaper Style</span>
            <span className="text-[11px] text-neutral-400">Selected: {styleNames[wallpaperStyle]}</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium">
            <span>Change</span>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </div>
        </div>

        {/* 2. Animation Speed Slider */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">Animation Speed</span>
            <span className="text-cyan-400 capitalize font-mono text-[11px]">{animSpeed}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['slow', 'medium', 'fast'] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => setAnimSpeed(speed)}
                className={`py-2 rounded-xl text-xs font-medium capitalize border transition cursor-pointer ${
                  animSpeed === speed
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-semibold'
                    : 'bg-white/[0.02] text-neutral-400 border-white/5 hover:text-white'
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Interaction Effect Toggle */}
        <div className="flex items-center justify-between p-4">
          <div>
            <span className="text-xs font-semibold text-white block">Interaction Effect</span>
            <span className="text-[11px] text-neutral-400">Waves and particles react to touch gestures</span>
          </div>
          <button
            onClick={() => setInteractionEffect(!interactionEffect)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
              interactionEffect ? 'bg-cyan-500' : 'bg-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                interactionEffect ? 'translate-x-6' : 'translate-x-0'
              } shadow-md`}
            />
          </button>
        </div>

        {/* 4. Offline Mode Toggle */}
        <div className="flex items-center justify-between p-4">
          <div>
            <span className="text-xs font-semibold text-white block">Offline Mode</span>
            <span className="text-[11px] text-neutral-400">Works 100% without internet &bull; zero battery drain</span>
          </div>
          <button
            onClick={() => setOfflineMode(!offlineMode)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
              offlineMode ? 'bg-emerald-500' : 'bg-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                offlineMode ? 'translate-x-6' : 'translate-x-0'
              } shadow-md`}
            />
          </button>
        </div>
      </div>

      {/* Main Apply Wallpaper Button (Reference Screen 5) */}
      <div className="space-y-2">
        <button
          onClick={handleApplyWallpaper}
          className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-sm tracking-wide transition cursor-pointer active:scale-98 shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          <span>Apply Wallpaper</span>
        </button>
        <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
          Set JARVIS reactive wallpaper as your real home screen wallpaper. It works like a normal Android live wallpaper without needing ONEVA open.
        </p>
      </div>

      {/* Wallpaper Style Selection Modal */}
      {showStyleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Select Wallpaper Style</h3>
              <button
                onClick={() => setShowStyleModal(false)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              {(
                [
                  { id: 'jarvis_reactive', name: 'JARVIS Reactive', desc: 'Audio & touch reactive neural waveform' },
                  { id: 'cyber_grid', name: 'Cyberpunk Grid', desc: 'Neon isometric geometric plane' },
                  { id: 'cosmic_nebula', name: 'Deep Cosmic Nebula', desc: 'Stellar clouds with drift velocity' },
                ] as const
              ).map((style) => (
                <div
                  key={style.id}
                  onClick={() => {
                    setWallpaperStyle(style.id);
                    setShowStyleModal(false);
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                    wallpaperStyle === style.id
                      ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
                      : 'bg-white/[0.02] border-white/5 text-neutral-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold block">{style.name}</span>
                    <span className="text-[10px] text-neutral-500">{style.desc}</span>
                  </div>
                  {wallpaperStyle === style.id && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
