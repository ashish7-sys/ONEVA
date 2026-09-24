import { useState } from 'react';
import {
  Play,
  X,
  Trash2,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Palette,
  Sliders,
  Check,
} from 'lucide-react';
import { AppShortcut } from '../types';
import { AppModificationEngine } from '../services/appModificationEngine';

interface AppContextMenuProps {
  app: AppShortcut | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onLaunch: (app: AppShortcut) => void;
  onRemoveFromHome?: (appId: string) => void;
  onEnhancementsChanged?: () => void;
}

const ACCENT_OPTIONS = [
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#ef4444', // red
  '#6366f1', // indigo
  '#14b8a6', // teal
];

export function AppContextMenu({
  app,
  position,
  onClose,
  onLaunch,
  onRemoveFromHome,
  onEnhancementsChanged,
}: AppContextMenuProps) {
  const [isCustomizing, setIsCustomizing] = useState(false);

  if (!app || !position) return null;

  const currentProfile = AppModificationEngine.getProfile(app.packageName);
  const visuals = AppModificationEngine.resolveVisuals(app);

  // Clamp position within viewport boundaries
  const posX = Math.min(Math.max(16, position.x - 110), window.innerWidth - 260);
  const posY = Math.min(Math.max(40, position.y - 140), window.innerHeight - 340);

  const handleApplyColor = (color: string) => {
    AppModificationEngine.applyEnhancement(app.packageName, {
      customAccentColor: color,
    });
    if (onEnhancementsChanged) onEnhancementsChanged();
  };

  const handleReset = () => {
    AppModificationEngine.resetEnhancement(app.packageName);
    if (onEnhancementsChanged) onEnhancementsChanged();
    setIsCustomizing(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 select-none"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {/* Background Dim */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity" />

      {/* Menu Card */}
      <div
        style={{ left: `${posX}px`, top: `${posY}px` }}
        onClick={(e) => e.stopPropagation()}
        className="absolute w-64 rounded-2xl bg-neutral-900/95 border border-white/10 shadow-2xl p-2.5 z-10 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* App Mini Header */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: visuals.accentColor }}
            />
            <div className="min-w-0">
              <span className="font-semibold text-xs text-white truncate block">{visuals.label}</span>
              <span className="text-[10px] text-neutral-400 font-mono truncate block">
                {app.packageName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {isCustomizing ? (
          /* Customization Submenu */
          <div className="p-1 space-y-2.5 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300 font-medium">Custom Accent Color</span>
              {currentProfile.hasActiveEnhancement && (
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {ACCENT_OPTIONS.map((hex) => (
                <button
                  key={hex}
                  onClick={() => handleApplyColor(hex)}
                  style={{ backgroundColor: hex }}
                  className="h-7 rounded-lg transition-transform active:scale-95 flex items-center justify-center cursor-pointer border border-white/20"
                >
                  {visuals.accentColor === hex && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-neutral-500">Android APK untouched</span>
              <button
                onClick={() => setIsCustomizing(false)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Main Menu Actions */
          <div className="space-y-0.5 text-xs">
            <button
              onClick={() => {
                onClose();
                onLaunch(app);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-neutral-200 hover:bg-white/10 hover:text-white transition cursor-pointer text-left"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Open {visuals.label}</span>
            </button>

            <button
              onClick={() => setIsCustomizing(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-neutral-300 hover:bg-white/10 hover:text-emerald-400 transition cursor-pointer text-left"
            >
              <Palette className="w-3.5 h-3.5 text-sky-400" />
              <span>Customize Appearance</span>
            </button>

            {onRemoveFromHome && (
              <button
                onClick={() => {
                  onRemoveFromHome(app.id);
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-neutral-300 hover:bg-white/10 hover:text-rose-400 transition cursor-pointer text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from Home</span>
              </button>
            )}

            {/* Architecture / Integrity Guarantee Footer */}
            <div className="mt-1 pt-2 border-t border-white/5 px-2 py-1 text-[10px] text-neutral-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Installed Device Application</span>
              </div>
              <p className="text-[10px] text-neutral-500 leading-tight">
                Original APK untouched &bull; Safe visual enhancement layer
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
