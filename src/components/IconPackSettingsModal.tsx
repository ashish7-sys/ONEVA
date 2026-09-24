import { useState } from 'react';
import { Sliders, X, Check, Sparkles, Shield, Circle, Square, Hexagon } from 'lucide-react';
import { IconService, IconSettings } from '../services/iconService';
import { PlatformBridge } from '../launcher/services/platformBridge';

interface IconPackSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function IconPackSettingsModal({
  isOpen,
  onClose,
  onSaved,
}: IconPackSettingsModalProps) {
  const currentSettings = IconService.getSettings();
  const [shape, setShape] = useState<IconSettings['fallbackShape']>(
    currentSettings.fallbackShape || 'squircle'
  );
  const [showBadges, setShowBadges] = useState<boolean>(
    currentSettings.showDynamicBadges ?? true
  );
  const [scale, setScale] = useState<number>(100);
  const [glowIntensity, setGlowIntensity] = useState<'low' | 'medium' | 'high'>('medium');

  if (!isOpen) return null;

  const handleSave = () => {
    IconService.saveSettings({
      fallbackShape: shape,
      showDynamicBadges: showBadges,
    });
    PlatformBridge.performHapticFeedback('confirm');
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#040817]/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0F1B3B] via-[#0C152F] to-[#070D1E] border border-cyan-500/30 p-6 shadow-2xl shadow-cyan-950/60 text-white space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Icon Pack Settings</h3>
              <p className="text-[10px] text-slate-400 font-mono">Render Engine &amp; Fallbacks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fallback Shape Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Fallback Icon Shape (Unmapped Apps)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'squircle', label: 'Squircle', icon: Square },
              { id: 'circle', label: 'Circle', icon: Circle },
              { id: 'rounded', label: 'Rounded', icon: Square },
              { id: 'hexagon', label: 'Hexagon', icon: Hexagon },
            ].map((s) => {
              const IconComp = s.icon;
              const isSelected = shape === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setShape(s.id as any)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-[#070D21] border-white/10 text-slate-400 hover:text-white hover:bg-[#0B1533]'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span className="text-[10px]">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scale Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Icon Size / Scale</span>
            <span className="font-mono text-cyan-300">{scale}%</span>
          </div>
          <input
            type="range"
            min={80}
            max={125}
            step={5}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Compact (80%)</span>
            <span>Standard (100%)</span>
            <span>Comfort (125%)</span>
          </div>
        </div>

        {/* Dynamic Notification Badges Toggle */}
        <div className="p-3 rounded-2xl bg-[#081024] border border-white/10 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-white block">Dynamic Dot Badges</span>
            <span className="text-[10px] text-slate-400 block">Show ambient notification dots on unread apps</span>
          </div>
          <button
            onClick={() => setShowBadges(!showBadges)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              showBadges ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                showBadges ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer active:scale-95"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
