import { useState } from 'react';
import {
  X,
  Sliders,
  Check,
  Sparkles,
  Wifi,
  Bluetooth,
  Moon,
  Volume2,
  Sun,
  Shield,
  Zap,
  Layers,
  Activity,
  Cpu,
} from 'lucide-react';
import { PlatformBridge } from '../launcher/services/platformBridge';

interface SystemUIPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
  themeName?: string;
}

export function SystemUIPreviewModal({
  isOpen,
  onClose,
  accentColor = '#06b6d4',
  themeName = 'ONEVA Theme',
}: SystemUIPreviewModalProps) {
  const [blurIntensity, setBlurIntensity] = useState<number>(24);
  const [cornerRadius, setCornerRadius] = useState<'8px' | '16px' | '22px'>('16px');
  const [activeTiles, setActiveTiles] = useState<Record<string, boolean>>({
    wifi: true,
    bluetooth: true,
    jarvis: true,
    oled: false,
    glow: true,
    dnd: false,
  });
  const [volumeLevel, setVolumeLevel] = useState<number>(75);
  const [brightnessLevel, setBrightnessLevel] = useState<number>(85);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleTile = (id: string) => {
    setActiveTiles((prev) => ({ ...prev, [id]: !prev[id] }));
    PlatformBridge.performHapticFeedback('light');
  };

  const handleApplySystemUI = () => {
    PlatformBridge.performHapticFeedback('confirm');
    try {
      localStorage.setItem(
        'oneva_system_ui_config',
        JSON.stringify({
          blurIntensity,
          cornerRadius,
          activeTiles,
          volumeLevel,
          brightnessLevel,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#09132A] border border-cyan-500/30 shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/15 flex items-center justify-between bg-[#060D1F]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                System UI &amp; Glass Controls
              </h2>
              <p className="text-[11px] text-slate-400">
                Quick settings, volume sliders, and surface blur calibration
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
          {/* Interactive Quick Settings Sheet Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Quick Settings Tiles Preview
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">Interactive &bull; Tap to Toggle</span>
            </div>

            <div
              className="p-4 rounded-3xl bg-slate-950/80 border border-cyan-500/25 shadow-xl space-y-4"
              style={{ backdropFilter: `blur(${blurIntensity}px)` }}
            >
              {/* Top Quick Sliders */}
              <div className="grid grid-cols-2 gap-3">
                {/* Brightness Bar */}
                <div className="p-3 rounded-2xl bg-[#0F1B3B]/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      Brightness
                    </span>
                    <span className="font-mono text-[11px] text-cyan-300">{brightnessLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={brightnessLevel}
                    onChange={(e) => setBrightnessLevel(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Volume Bar */}
                <div className="p-3 rounded-2xl bg-[#0F1B3B]/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      Volume
                    </span>
                    <span className="font-mono text-[11px] text-cyan-300">{volumeLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumeLevel}
                    onChange={(e) => setVolumeLevel(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>

              {/* Tiles Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'wifi', name: 'Wi-Fi 6E', icon: Wifi },
                  { id: 'bluetooth', name: 'Bluetooth', icon: Bluetooth },
                  { id: 'jarvis', name: 'JARVIS AI', icon: Cpu },
                  { id: 'glow', name: 'Edge Glow', icon: Zap },
                  { id: 'oled', name: 'OLED Pure', icon: Moon },
                  { id: 'dnd', name: 'Focus Mode', icon: Shield },
                ].map((tile) => {
                  const Icon = tile.icon;
                  const active = activeTiles[tile.id];
                  return (
                    <button
                      key={tile.id}
                      onClick={() => toggleTile(tile.id)}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-1.5 transition cursor-pointer active:scale-95 ${
                        active
                          ? 'bg-gradient-to-br from-cyan-500/25 to-blue-600/30 border-cyan-400/50 text-cyan-200 shadow-md shadow-cyan-950/40'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-cyan-300' : 'text-slate-400'}`} />
                      <span className="text-[11px] font-semibold">{tile.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Blur Radius Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Backdrop Frosted Blur
              </label>
              <span className="font-mono text-cyan-400 text-xs">{blurIntensity}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="48"
              value={blurIntensity}
              onChange={(e) => setBlurIntensity(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>8px (Subtle)</span>
              <span>24px (Standard)</span>
              <span>48px (Deep Glass)</span>
            </div>
          </div>

          {/* Corner Radius Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Surface Corner Curvature
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: '8px', name: 'Sharp (8px)' },
                  { id: '16px', name: 'Modern (16px)' },
                  { id: '22px', name: 'Squircle (22px)' },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setCornerRadius(r.id);
                    PlatformBridge.performHapticFeedback('light');
                  }}
                  className={`py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    cornerRadius === r.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {r.name}
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
            onClick={handleApplySystemUI}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer active:scale-95 shadow-lg flex items-center gap-1.5 ${
              isSaved
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isSaved ? 'System UI Applied!' : 'Apply System UI Style'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
