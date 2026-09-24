import React from 'react';
import {
  Palette,
  Shapes,
  Activity,
  Zap,
  Image as ImageIcon,
  Cpu,
  Camera,
  Keyboard as KeyboardIcon,
  Sliders,
  Shield,
  Layers,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { PageId } from '../navigation/types';
import { AppCatalogService } from '../services/appCatalogService';
import { IconService } from '../services/iconService';

interface ModulesPageProps {
  onNavigate: (page: PageId, subSection?: string) => void;
  onNavigateBack?: () => void;
}

export function ModulesPage({ onNavigate, onNavigateBack }: ModulesPageProps) {
  const catalogCount = AppCatalogService.getFinalizedCatalogCount();
  const activePackName = IconService.getActivePackName();

  const modules = [
    {
      id: 'themes' as PageId,
      name: 'Themes',
      tagline: 'Luminance Palettes & OLED Pure Black',
      description: 'Changes borders, surfaces, system color accents, and OLED battery calibrations across supported UI elements.',
      icon: Palette,
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-400/30',
      badge: 'Visual Engine',
    },
    {
      id: 'icons' as PageId,
      name: 'Icon Packs',
      tagline: 'Vector Icon Customization',
      description: `Changes supported app icons on your Android launcher. Active pack: ${activePackName}. Customizes real YouTube, WhatsApp, Instagram, and catalog apps with custom vector icons.`,
      icon: Shapes,
      color: 'from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-400/30',
      badge: '5-Tier Priority',
    },
    {
      id: 'wallpapers' as PageId,
      name: 'JARVIS Reactive Wallpaper',
      tagline: 'Android Live Wallpaper',
      description: 'Set JARVIS Reactive as your actual Android live wallpaper. Reacts to touch, audio, and device events 100% offline.',
      icon: ImageIcon,
      color: 'from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-400/30',
      badge: 'Live Wallpaper',
    },
    {
      id: 'widgets_system_ui' as PageId,
      name: 'Widgets & System UI',
      tagline: 'Search Bar, Quick Settings & Status',
      description: 'Configure home search bar styles, quick settings tiles, battery meter, and status indicators where Android technically permits.',
      icon: Sliders,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/30',
      badge: 'System UI',
    },
    {
      id: 'assist' as PageId,
      name: 'JARVIS AI Layer',
      tagline: 'System-Wide Automation Core',
      description: 'Configure the AI assistant that operates across supported parts of Android (YouTube, WhatsApp, navigation) via Accessibility Service.',
      icon: Cpu,
      color: 'from-cyan-500/20 to-blue-600/20 text-cyan-300 border-cyan-400/40',
      badge: 'Cross-System AI',
    },
    {
      id: 'camera' as PageId,
      name: 'ONEVA Vision',
      tagline: 'Camera & Computational ISP',
      description: 'Real camera subsystem enhancing existing device hardware with zero-cloud RAW color science, HDR, and spatial perception.',
      icon: Camera,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-400/30',
      badge: 'Hardware Camera',
    },
    {
      id: 'keyboard' as PageId,
      name: 'Keyboard',
      tagline: 'Tactile Input Method (IME)',
      description: 'Change keyboard styles, colors, and tactile haptic feedback to match your theme. Fully private with zero cloud telemetry.',
      icon: KeyboardIcon,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/30',
      badge: 'Android IME',
    },
    {
      id: 'modify_apps' as PageId,
      name: 'Modify Real Apps',
      tagline: 'Granular Per-App Enhancements',
      description: 'Customize individual real Android applications: override specific icons, bind custom launch glow, and set app-specific tactile profiles.',
      icon: Sliders,
      color: 'from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-400/30',
      badge: `${catalogCount} Apps Catalog`,
    },
    {
      id: 'privacy' as PageId,
      name: 'Privacy & Sandbox',
      tagline: 'Zero Spyware Architecture',
      description: 'Auditing and proof of zero cloud transmission. Inspect local storage, permissions status, and sandbox boundary guarantees.',
      icon: Shield,
      color: 'from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-400/30',
      badge: 'Local-First',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 text-white select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition cursor-pointer active:scale-95"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold mb-0.5">
              <Layers className="w-3.5 h-3.5" />
              <span>ONEVA Modular Architecture</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Customization Modules</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure independent subsystems. Each module enhances a specific dimension of your real Android experience.
            </p>
          </div>
        </div>
      </div>

      {/* Modules List Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              onClick={() => onNavigate(mod.id)}
              className="p-4 rounded-3xl bg-[#0A142D]/75 hover:bg-[#0E1A3C] border border-cyan-500/15 hover:border-cyan-400/35 flex flex-col justify-between transition cursor-pointer group shadow-lg shadow-cyan-950/20 active:scale-[0.99] space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${mod.color} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 font-semibold">
                    {mod.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {mod.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {mod.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-400 group-hover:text-cyan-300 font-medium">
                <span>Configure Module</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
