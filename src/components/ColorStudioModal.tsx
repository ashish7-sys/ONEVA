import { useState } from 'react';
import { X, Palette, Check, Sparkles, Sliders } from 'lucide-react';
import { ThemeService } from '../services/themeService';
import { PlatformBridge } from '../launcher/services/platformBridge';

interface ColorStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: (accent: string) => void;
}

export function ColorStudioModal({ isOpen, onClose, onApplied }: ColorStudioModalProps) {
  const currentAccent = ThemeService.getConfig().accentColor || '#06b6d4';
  const [selectedAccent, setSelectedAccent] = useState<string>(currentAccent);
  const [luminance, setLuminance] = useState<'dark_navy' | 'oled_black'>('dark_navy');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const colorPalettes = [
    { name: 'Electric Cyan', hex: '#06b6d4', desc: 'Futuristic sci-fi energy' },
    { name: 'Neon Purple', hex: '#8b5cf6', desc: 'Deep cyber radiance' },
    { name: 'Emerald OLED', hex: '#10b981', desc: 'Tactile matrix aesthetic' },
    { name: 'Hot Magenta', hex: '#f43f5e', desc: 'High-contrast kinetic burst' },
    { name: 'Solar Amber', hex: '#f59e0b', desc: 'Warm computational beacon' },
    { name: 'Cobalt Blue', hex: '#3b82f6', desc: 'Deep system clarity' },
    { name: 'Pure Platinum', hex: '#f1f5f9', desc: 'Minimalist high-contrast' },
    { name: 'Hyper Lime', hex: '#84cc16', desc: 'Acidic speed accent' },
  ];

  const handleApply = () => {
    PlatformBridge.performHapticFeedback('confirm');
    ThemeService.applyTheme({
      accentColor: selectedAccent,
      mode: luminance === 'oled_black' ? 'oled' : 'dark',
    });
    setIsSaved(true);
    if (onApplied) onApplied(selectedAccent);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#09132A] border border-cyan-500/30 shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/15 flex items-center justify-between bg-[#060D1F]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Luminance &amp; Accent Studio
              </h2>
              <p className="text-[11px] text-slate-400">
                Calibrate system borders, indicators, and glow hues
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

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Live Preview Box */}
          <div
            className="p-5 rounded-2xl bg-[#060D1F] border flex items-center justify-between shadow-inner"
            style={{ borderColor: `${selectedAccent}40` }}
          >
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-mono font-semibold block">
                Selected System Accent
              </span>
              <span className="text-base font-bold" style={{ color: selectedAccent }}>
                {colorPalettes.find((c) => c.hex === selectedAccent)?.name || 'Custom Hue'}
              </span>
              <span className="text-[11px] font-mono text-slate-500 block">{selectedAccent}</span>
            </div>

            <div
              className="w-12 h-12 rounded-2xl border-2 border-white/20 shadow-lg flex items-center justify-center"
              style={{
                backgroundColor: selectedAccent,
                boxShadow: `0 0 20px ${selectedAccent}60`,
              }}
            >
              <Check className="w-6 h-6 text-slate-950 font-bold" />
            </div>
          </div>

          {/* Palette Swatches */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Curated Accent Palettes
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {colorPalettes.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    setSelectedAccent(c.hex);
                    PlatformBridge.performHapticFeedback('light');
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                    selectedAccent === c.hex
                      ? 'bg-cyan-500/15 border-cyan-400/50 shadow-md'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-xl shrink-0 border border-white/20"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block truncate">{c.name}</span>
                    <span className="text-[10px] text-slate-400 truncate block">{c.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* OLED Sub-Pixel Shutoff */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Surface Background Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setLuminance('dark_navy')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  luminance === 'dark_navy'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                <span className="text-xs block font-bold">Deep Cyber Navy</span>
                <span className="text-[10px] text-slate-400">Layered futuristic depth</span>
              </button>

              <button
                onClick={() => setLuminance('oled_black')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  luminance === 'oled_black'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 font-bold'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                <span className="text-xs block font-bold">OLED Pure Black</span>
                <span className="text-[10px] text-slate-400">Zero-emission pixel shutoff</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            <span>{isSaved ? 'Color Applied!' : 'Apply System Palette'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
