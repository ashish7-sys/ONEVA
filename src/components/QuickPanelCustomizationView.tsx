/**
 * ONEVA Phase 18: Dedicated Quick Panel Customization View
 * 
 * Provides an intuitive, modern Android Quick Settings interface:
 * - Tile state toggling (Wi-Fi, Bluetooth, Data, Flashlight, etc.)
 * - Theme accent synchronization (without breaking tile layouts)
 * - Custom glyph overrides per tile (STRICTLY separate from App Icon Packs)
 * - Safe fallback resolution for invalid icons
 * - Factory default reset
 */

import { useState, useEffect } from 'react';
import {
  Wifi,
  Bluetooth,
  Radio,
  Flashlight,
  Volume2,
  RotateCw,
  BatteryCharging,
  Plane,
  BellOff,
  Moon,
  Share2,
  MapPin,
  Sliders,
  RotateCcw,
  Palette,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Eye,
} from 'lucide-react';
import {
  QuickPanelService,
  QuickPanelConfig,
  QuickTileId,
  QuickPanelTile,
} from '../services/quickPanelService';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Wifi,
  Bluetooth,
  Radio,
  Flashlight,
  Volume2,
  RotateCw,
  BatteryCharging,
  Plane,
  BellOff,
  Moon,
  Share2,
  MapPin,
  Sliders,
  Smartphone,
};

export function QuickPanelCustomizationView() {
  const [config, setConfig] = useState<QuickPanelConfig>(QuickPanelService.getConfig());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedTileId, setSelectedTileId] = useState<QuickTileId | null>(null);

  useEffect(() => {
    QuickPanelService.init();
    return QuickPanelService.subscribe(() => {
      setConfig(QuickPanelService.getConfig());
    });
  }, []);

  const handleToggleTile = (tileId: QuickTileId) => {
    const res = QuickPanelService.toggleTile(tileId);
    if (res.success) {
      setToastMessage(`Quick Tile "${tileId}" is now ${res.newState.toUpperCase()}`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleResetDefaults = () => {
    QuickPanelService.resetToDefaults();
    setToastMessage('Quick Panel reset to factory default layout.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleAccentSync = () => {
    QuickPanelService.setAccentColorSync(!config.accentColorSync);
    setToastMessage(
      !config.accentColorSync
        ? 'Quick Panel synchronized with ONEVA Theme Accent.'
        : 'Theme accent sync decoupled.'
    );
    setTimeout(() => setToastMessage(null), 2500);
  };

  const effectiveAccent = QuickPanelService.getEffectiveAccentColor();

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900/95 border border-emerald-500/30 shadow-2xl px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs text-neutral-200 font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase mb-1">
            <Sliders className="w-3 h-3" />
            <span>Phase 18 Quick Settings</span>
          </div>
          <h2 className="text-sm font-semibold text-white">Quick Panel Customization</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure quick tile toggles, grid layout, and accent synchronization independently from App Icon Packs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleAccentSync}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border ${
              config.accentColorSync
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-white/5 text-neutral-400 border-white/10'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme Accent Sync: {config.accentColorSync ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Layout</span>
          </button>
        </div>
      </div>

      {/* Architectural Isolation Notice */}
      <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-start gap-2.5 text-xs text-neutral-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-neutral-200">Architectural Isolation Guarantee:</strong>
          <p className="leading-relaxed text-[11px]">
            Quick Panel icons and layout exist strictly in their own subsystem. Changing icon packs or applying themes will never overwrite or corrupt your custom Quick Panel tile configuration.
          </p>
        </div>
      </div>

      {/* Interactive Quick Panel Surface Preview */}
      <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-5 space-y-4">
        <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono uppercase text-[11px]">Active Notification / Quick Settings Shade</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-neutral-500 font-mono">Accent:</span>
            <div
              className="w-3 h-3 rounded-full border border-white/20"
              style={{ backgroundColor: effectiveAccent }}
            />
          </div>
        </div>

        {/* Tile Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {config.tiles.map((tile: QuickPanelTile) => {
            const IconComp = ICON_MAP[tile.iconName] || Sliders;
            const isSelected = selectedTileId === tile.id;

            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleToggleTile(tile.id)}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3 relative overflow-hidden ${
                  tile.isActive
                    ? 'bg-neutral-900 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : 'bg-neutral-900/40 hover:bg-neutral-900/70 border-white/5 opacity-70'
                } ${isSelected ? 'ring-2 ring-emerald-400/50' : ''}`}
              >
                {/* Active indicator dot */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    tile.isActive
                      ? 'text-neutral-950'
                      : 'bg-white/5 text-neutral-400'
                  }`}
                  style={{
                    backgroundColor: tile.isActive ? effectiveAccent : undefined,
                  }}
                >
                  <IconComp className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">{tile.label}</div>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">
                    {tile.state}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
