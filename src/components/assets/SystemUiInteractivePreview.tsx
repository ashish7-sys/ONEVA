import { useState } from 'react';
import {
  Wifi,
  Bluetooth,
  Sun,
  Volume2,
  Battery,
  Radio,
  Moon,
  Plane,
  BellOff,
  Sliders,
  Check,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { OnevaAsset } from '../../types/adminAssets';
import { PlatformBridge } from '../../launcher/services/platformBridge';

interface SystemUiInteractivePreviewProps {
  asset: OnevaAsset;
}

export function SystemUiInteractivePreview({ asset }: SystemUiInteractivePreviewProps) {
  const [activeTiles, setActiveTiles] = useState<Record<string, boolean>>({
    wifi: true,
    bluetooth: true,
    torch: false,
    hotspot: false,
    dnd: false,
    airplane: false,
  });

  const [brightness, setBrightness] = useState(78);
  const [volume, setVolume] = useState(62);

  const accentColor = asset.previewData?.color || '#06b6d4';

  const toggleTile = (id: string) => {
    PlatformBridge.performHapticFeedback('selection');
    setActiveTiles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const tiles = [
    { id: 'wifi', name: 'Wi-Fi 6E', icon: Wifi, detail: 'ONEVA_5G' },
    { id: 'bluetooth', name: 'Bluetooth', icon: Bluetooth, detail: 'Connected' },
    { id: 'torch', name: 'Flashlight', icon: Sun, detail: 'Off' },
    { id: 'hotspot', name: 'Hotspot', icon: Radio, detail: 'Off' },
    { id: 'dnd', name: 'Do Not Disturb', icon: BellOff, detail: 'Muted' },
    { id: 'airplane', name: 'Airplane Mode', icon: Plane, detail: 'Disabled' },
  ];

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      {/* Component Title & Details */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${accentColor}25`, border: `1px solid ${accentColor}60`, color: accentColor }}
          >
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">System UI Calibration</h4>
            <p className="text-[10px] text-neutral-400 font-mono">Quick Settings & Volume Matrix</p>
          </div>
        </div>
        <span
          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
        >
          Adaptive HUD
        </span>
      </div>

      {/* Simulated Device Screen */}
      <div className="w-full rounded-3xl bg-black border-2 border-neutral-800 overflow-hidden shadow-2xl p-4 space-y-4">
        {/* Status Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300 pb-2 border-b border-white/10">
          <span className="font-bold">10:45 AM</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px]">5G</span>
            </div>
            <div className="flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px]">98%</span>
            </div>
          </div>
        </div>

        {/* Quick Settings Grid */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
            <span>Quick Settings Panel</span>
            <span>Tap to toggle</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {tiles.map((tile) => {
              const Icon = tile.icon;
              const isOn = activeTiles[tile.id];
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => toggleTile(tile.id)}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 text-left transition-all border select-none ${
                    isOn
                      ? 'shadow-lg'
                      : 'bg-neutral-900/80 border-white/5 text-neutral-400 hover:bg-neutral-850'
                  }`}
                  style={
                    isOn
                      ? {
                          backgroundColor: `${accentColor}25`,
                          borderColor: `${accentColor}60`,
                          color: '#ffffff',
                          boxShadow: `0 4px 14px ${accentColor}25`,
                        }
                      : undefined
                  }
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition"
                    style={{
                      backgroundColor: isOn ? accentColor : 'rgba(255,255,255,0.08)',
                      color: isOn ? '#000000' : '#a3a3a3',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{tile.name}</div>
                    <div className="text-[9px] font-mono opacity-75 truncate">{isOn ? 'Active' : tile.detail}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brightness Slider */}
        <div className="p-3 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" /> Display Brightness
            </span>
            <span>{brightness}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            style={{ accentColor }}
          />
        </div>

        {/* Volume Slider Panel */}
        <div className="p-3 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Media & System Audio
            </span>
            <span>{volume}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            style={{ accentColor }}
          />
        </div>
      </div>
    </div>
  );
}
