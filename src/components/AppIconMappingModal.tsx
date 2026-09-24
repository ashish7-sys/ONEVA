import { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Sparkles,
  Check,
  X,
  Sliders,
  Filter,
  ArrowLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { AppCatalogService } from '../services/appCatalogService';
import { IconService } from '../services/iconService';
import { CatalogApp } from '../types/catalogAndIcons';
import { CatalogAppIcon } from './CatalogAppIcon';
import { PlatformBridge } from '../launcher/services/platformBridge';

interface AppIconMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPackageName?: string;
}

// Curated futuristic neon glyph choices for custom app icon overrides
const NEON_GLYPH_OPTIONS = [
  { id: 'Sparkles', name: 'Ambient Sparkle' },
  { id: 'Zap', name: 'Electric Bolt' },
  { id: 'Flame', name: 'Plasma Flame' },
  { id: 'Compass', name: 'Quantum Compass' },
  { id: 'Shield', name: 'Cyber Sentinel' },
  { id: 'Activity', name: 'Pulse Wave' },
  { id: 'Play', name: 'Neon Stream' },
  { id: 'Music', name: 'Harmonic Note' },
  { id: 'MessageCircle', name: 'Glow Chat' },
  { id: 'Camera', name: 'Optical Sensor' },
  { id: 'ShoppingBag', name: 'Neon Cart' },
  { id: 'Heart', name: 'Bio Pulse' },
  { id: 'Star', name: 'Nova Star' },
  { id: 'Bell', name: 'Aura Bell' },
  { id: 'Layers', name: 'Vector Prism' },
  { id: 'Send', name: 'Signal Beam' },
];

export function AppIconMappingModal({
  isOpen,
  onClose,
  initialPackageName,
}: AppIconMappingModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingApp, setEditingApp] = useState<CatalogApp | null>(null);
  const [settings, setSettings] = useState(IconService.getSettings());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);

  // 50 Finalized Catalog Apps from source of truth
  const finalizedApps = useMemo(() => {
    return AppCatalogService.getFinalizedCatalogApps();
  }, []);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSelectCustomGlyph = (app: CatalogApp, glyphId: string) => {
    IconService.setIndividualAppIcon(app.packageName, glyphId);
    setSettings(IconService.getSettings());
    PlatformBridge.performHapticFeedback('confirm');
    showToast(`Custom icon for ${app.name} set to ${glyphId}`);
    setEditingApp(null);
  };

  const handleResetAppIcon = (app: CatalogApp) => {
    IconService.setIndividualAppIcon(app.packageName, null);
    setSettings(IconService.getSettings());
    PlatformBridge.performHapticFeedback('light');
    showToast(`${app.name} icon restored to Neon Light default.`);
  };

  const handleResetAll = () => {
    IconService.resetAllIndividualAppIcons();
    setSettings(IconService.getSettings());
    setShowResetAllConfirm(false);
    PlatformBridge.performHapticFeedback('confirm');
    showToast('All 50 app icons restored to Neon Light defaults.');
  };

  // Filtered apps list
  const filteredApps = finalizedApps.filter((app) => {
    const matchesSearch =
      !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      app.category === selectedCategory ||
      (selectedCategory === 'customized' && settings.individualAppIcons[app.packageName]);

    return matchesSearch && matchesCategory;
  });

  const customizedCount = Object.keys(settings.individualAppIcons).length;

  return (
    <div className="fixed inset-0 z-50 bg-[#040817]/90 backdrop-blur-xl flex flex-col justify-between animate-in fade-in duration-200 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-[#0E1B38] border border-cyan-400/50 shadow-2xl px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs text-cyan-200 font-medium animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="sticky top-0 z-20 bg-[#070D1F]/90 backdrop-blur-2xl border-b border-cyan-500/20 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition cursor-pointer active:scale-95"
            title="Back to Icon Packs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                App Icon Mapping
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-semibold">
                {finalizedApps.length} Catalog Apps
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Customize individual real Android applications with Neon Light &amp; custom vector glyphs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {customizedCount > 0 && (
            <button
              onClick={() => setShowResetAllConfirm(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset All ({customizedCount})</span>
              <span className="sm:hidden">Reset</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="px-4 sm:px-6 py-3 bg-[#0B132B]/80 border-b border-white/5 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 50 apps (e.g. WhatsApp, YouTube, Instagram, PhonePe)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#060B18] border border-cyan-500/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
          {[
            { id: 'all', label: `All (${finalizedApps.length})` },
            { id: 'customized', label: `Customized (${customizedCount})` },
            { id: 'communication', label: 'Social & Chat' },
            { id: 'media', label: 'Media & Video' },
            { id: 'utilities', label: 'Utilities' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 50 Apps Mapping List */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between mb-1">
          <span>Showing {filteredApps.length} of {finalizedApps.length} Apps</span>
          <span className="text-cyan-400">Default Pack: Neon Light</span>
        </div>

        {filteredApps.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <p className="text-sm">No apps matched "{searchQuery}"</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs text-cyan-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredApps.map((app) => {
            const customOverride = settings.individualAppIcons[app.packageName];
            const isCustomized = Boolean(customOverride);

            return (
              <div
                key={app.packageName}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  isCustomized
                    ? 'bg-[#0E1E42]/80 border-cyan-400/40 shadow-md shadow-cyan-950/40'
                    : 'bg-[#0B1530]/60 hover:bg-[#0E1A3C]/70 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icon Representation */}
                  <div className="relative shrink-0">
                    <CatalogAppIcon
                      app={app}
                      size="md"
                      customIconOverride={customOverride}
                    />
                    {isCustomized && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-[#0B1530] shadow-sm shadow-cyan-400" />
                    )}
                  </div>

                  {/* App Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {app.name}
                      </span>
                      {isCustomized ? (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                          Custom: {customOverride}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded-md bg-blue-500/10 text-cyan-300 text-[10px] font-mono">
                          Neon Light
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                      {app.packageName}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isCustomized && (
                    <button
                      onClick={() => handleResetAppIcon(app)}
                      title="Revert to Neon Light default"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => setEditingApp(app)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer active:scale-95"
                  >
                    <span>{isCustomized ? 'Change' : 'Customize'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Notice */}
      <div className="px-4 sm:px-6 py-3 bg-[#060B18]/90 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Priority Chain: Individual Custom &gt; Selected Global Pack (Neon Light) &gt; Android System</span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer active:scale-95"
        >
          Done
        </button>
      </div>

      {/* Individual App Custom Glyph Picker Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-60 bg-[#040817]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0D1836] border border-cyan-500/30 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CatalogAppIcon app={editingApp} size="sm" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {editingApp.name} Icon
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400">{editingApp.packageName}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingApp(null)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select a custom vector glyph for {editingApp.name}. This overrides the global icon pack for this specific application:
            </p>

            <div className="grid grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
              {NEON_GLYPH_OPTIONS.map((g) => {
                const isSelected = settings.individualAppIcons[editingApp.packageName] === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => handleSelectCustomGlyph(editingApp, g.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-[#070D1F] hover:bg-[#101F47] border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-300 mb-1">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] text-center truncate w-full">{g.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              {settings.individualAppIcons[editingApp.packageName] && (
                <button
                  onClick={() => {
                    handleResetAppIcon(editingApp);
                    setEditingApp(null);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-rose-300 border border-rose-500/30 text-xs font-medium transition cursor-pointer"
                >
                  Remove Override
                </button>
              )}
              <button
                onClick={() => setEditingApp(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reset All */}
      {showResetAllConfirm && (
        <div className="fixed inset-0 z-60 bg-[#040817]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1836] border border-rose-500/30 rounded-3xl p-5 max-w-xs w-full space-y-4 shadow-2xl text-white">
            <h3 className="text-sm font-bold text-white">Reset All 50 Mappings?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will remove all individual app icon overrides and restore all 50 catalog apps to the default Neon Light pack icons.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowResetAllConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAll}
                className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold shadow-lg shadow-rose-950/50"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
