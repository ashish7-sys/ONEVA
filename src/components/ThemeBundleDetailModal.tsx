import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Shapes,
  Sliders,
  Keyboard as KeyboardIcon,
  ShieldCheck,
  Layers,
  Star,
  Check,
  Info,
} from 'lucide-react';
import { OnevaAsset, OnevaThemeDefinition } from '../types/adminAssets';
import { ThemeEngineService, ThemeApplyReport } from '../services/themeEngineService';
import { AdminAssetService } from '../services/adminAssetService';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { ThemeCardPreview } from './ThemeCardPreview';

interface ThemeBundleDetailModalProps {
  themeAsset: OnevaAsset;
  onClose: () => void;
  onApplied?: (report?: ThemeApplyReport) => void;
}

export function ThemeBundleDetailModal({
  themeAsset,
  onClose,
  onApplied,
}: ThemeBundleDetailModalProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyReport, setApplyReport] = useState<ThemeApplyReport | null>(null);

  // Resolve referenced components
  const wpId: string | undefined =
    (themeAsset.payload?.wallpaperAssetId as string) ||
    (themeAsset.payload?.wallpaperId as string) ||
    (themeAsset.assets?.themeDefinition?.wallpaperAssetId as string) ||
    (themeAsset.assets?.themeDefinition?.wallpaperId as string) ||
    undefined;

  const ipId: string | undefined =
    (themeAsset.payload?.iconPackAssetId as string) ||
    (themeAsset.payload?.iconPackId as string) ||
    (themeAsset.assets?.themeDefinition?.iconPackAssetId as string) ||
    (themeAsset.assets?.themeDefinition?.iconPackId as string) ||
    undefined;

  const sysUiId: string | undefined =
    (themeAsset.payload?.systemUiAssetId as string) ||
    (themeAsset.assets?.themeDefinition?.systemUiAssetId as string) ||
    undefined;

  const kbId: string | undefined =
    (themeAsset.payload?.keyboardAssetId as string) ||
    (themeAsset.payload?.keyboardId as string) ||
    (themeAsset.assets?.themeDefinition?.keyboardAssetId as string) ||
    (themeAsset.assets?.themeDefinition?.keyboardId as string) ||
    undefined;

  const wallpaperAsset = wpId ? AdminAssetService.getAssetById(wpId) : null;
  const iconPackAsset = ipId ? AdminAssetService.getAssetById(ipId) : null;
  const keyboardAsset = kbId ? AdminAssetService.getAssetById(kbId) : null;

  const hasWallpaper = Boolean(wpId || themeAsset.previewData?.previewUrl || themeAsset.payload?.wallpaperUrl);
  const hasIcons = Boolean(ipId || (themeAsset.payload?.extractedIcons && Object.keys(themeAsset.payload.extractedIcons).length > 0));
  const hasSystemUi = Boolean(sysUiId || themeAsset.assets?.themeDefinition?.systemUi || themeAsset.payload?.systemUi);
  const hasKeyboard = Boolean(kbId || themeAsset.assets?.themeDefinition?.keyboardId);

  const creator = themeAsset.author || (themeAsset.assets?.themeDefinition?.creator as string) || 'ONEVA Verified Designer';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApply = () => {
    setIsApplying(true);
    PlatformBridge.performHapticFeedback('confirm');

    const report = ThemeEngineService.applyTheme(themeAsset.id);
    setApplyReport(report);
    setIsApplying(false);

    if (report.overallSuccess) {
      showToast(report.message);
      onApplied?.(report);
    } else {
      showToast(report.message || 'Failed to apply theme.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150 select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-[#0C1635] border border-cyan-400/50 shadow-2xl px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs text-cyan-200 font-medium animate-in fade-in slide-in-from-top-2 max-w-sm text-center">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-md rounded-3xl bg-[#080E1E] border border-white/10 overflow-hidden shadow-2xl shadow-cyan-950/40 max-h-[92vh] flex flex-col">
        {/* Top Header Bar */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30 font-bold flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              THEME BUNDLE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono border border-blue-400/30 flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-blue-400 text-blue-400" />
              {themeAsset.rating?.toFixed(1) || '5.0'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Authentic Preview Frame */}
          <div className="w-48 mx-auto shadow-2xl rounded-2xl overflow-hidden border border-white/15">
            <ThemeCardPreview themeAsset={themeAsset} />
          </div>

          {/* Theme Meta */}
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {themeAsset.name}
            </h2>
            <div className="text-xs text-slate-400">
              Created by <span className="text-cyan-300 font-medium">{creator}</span> &bull; v{themeAsset.version || '1.0.0'}
            </div>
            <p className="text-xs text-slate-300 pt-1 leading-relaxed max-w-sm mx-auto">
              {themeAsset.description || 'Complete customization bundle with coordinated wallpaper, icons, and system styling.'}
            </p>
          </div>

          {/* Included Components Checklist */}
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
              Included Components
            </div>
            <div className="rounded-2xl bg-black/40 border border-white/10 divide-y divide-white/5 overflow-hidden">
              {/* Wallpaper Item */}
              <div className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${hasWallpaper ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Wallpaper</div>
                    <div className="text-[10px] text-slate-400">
                      {wallpaperAsset?.name || (hasWallpaper ? 'Coordinated OLED Wallpaper' : 'Not included')}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${hasWallpaper ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                  {hasWallpaper ? '✓ Included' : '○ None'}
                </span>
              </div>

              {/* Icon Pack Item */}
              <div className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${hasIcons ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'}`}>
                    <Shapes className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Icon Pack</div>
                    <div className="text-[10px] text-slate-400">
                      {iconPackAsset?.name || (hasIcons ? 'Coordinated Vector Icon Pack' : 'Not included')}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${hasIcons ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'}`}>
                  {hasIcons ? '✓ Included' : '○ None'}
                </span>
              </div>

              {/* System UI Item */}
              <div className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${hasSystemUi ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-500'}`}>
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">System UI & Widgets</div>
                    <div className="text-[10px] text-slate-400">
                      {hasSystemUi ? 'Search bar, battery pill, status indicators' : 'Default launcher styling'}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${hasSystemUi ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-500'}`}>
                  {hasSystemUi ? '✓ Included' : '○ None'}
                </span>
              </div>

              {/* Keyboard Item */}
              <div className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${hasKeyboard ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>
                    <KeyboardIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">ONEVA Keyboard</div>
                    <div className="text-[10px] text-slate-400">
                      {keyboardAsset?.name || (hasKeyboard ? 'Tactile IME Theme' : 'Optional')}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${hasKeyboard ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>
                  {hasKeyboard ? '✓ Included' : '○ Optional'}
                </span>
              </div>
            </div>
          </div>

          {/* Device Compatibility & Architecture Info */}
          <div className="p-3 rounded-2xl bg-[#091227] border border-cyan-500/20 flex items-start gap-2.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <span className="font-semibold text-white block">Real Android Customization</span>
              <span>
                Dispatches native wallpaper intents, applies vector icon sets, and configures launcher system surfaces without simulated hacks.
              </span>
            </div>
          </div>

          {/* Application Breakdown Report (if already run) */}
          {applyReport && (
            <div className="p-3 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Application Report</span>
              </div>
              <div className="space-y-1">
                {applyReport.componentsApplied.map((comp) => (
                  <div key={comp.name} className="flex items-start justify-between gap-2 text-[11px]">
                    <span className="text-slate-300 font-medium">{comp.label}:</span>
                    <span
                      className={`font-mono text-right ${
                        comp.status === 'applied'
                          ? 'text-emerald-400'
                          : comp.status === 'unsupported'
                          ? 'text-amber-400'
                          : comp.status === 'failed'
                          ? 'text-rose-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {comp.status === 'applied' && '✓ Applied'}
                      {comp.status === 'unsupported' && '⚠ Unsupported by OEM'}
                      {comp.status === 'failed' && '✕ Failed'}
                      {comp.status === 'skipped' && '○ Skipped'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Apply Action Bar */}
        <div className="p-4 border-t border-white/5 bg-black/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying}
            className="flex-1 py-3 px-5 rounded-2xl font-bold text-xs bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            {isApplying ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Applying Theme...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Apply Theme Package</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
