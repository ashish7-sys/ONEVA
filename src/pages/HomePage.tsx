import { useState, useEffect } from 'react';
import {
  Palette,
  Shapes,
  Activity,
  Zap,
  Image as ImageIcon,
  Cpu,
  Camera,
  Keyboard as KeyboardIcon,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Smartphone,
  Sliders,
  Edit3,
} from 'lucide-react';
import { PageId } from '../navigation/types';
import { UserCustomizationService } from '../services/userCustomizationService';
import { AssistService } from '../services/assistService';
import { ThemeService } from '../services/themeService';
import { IconService } from '../services/iconService';
import { AppCatalogService } from '../services/appCatalogService';
import { UserProfileService } from '../services/userProfileService';
import { UserNameModal } from '../components/UserNameOnboardingModal';
import { ThemeEngineService } from '../services/themeEngineService';
import { AdminAssetService } from '../services/adminAssetService';

interface HomePageProps {
  onNavigate: (page: PageId, subSection?: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [userState, setUserState] = useState(UserCustomizationService.getState());
  const [assistConfig, setAssistConfig] = useState(AssistService.getConfig());
  const [themeConfig, setThemeConfig] = useState(ThemeService.getConfig());
  const [userName, setUserName] = useState(UserProfileService.getUserName());
  const [activePackName, setActivePackName] = useState(IconService.getActivePackName());
  const [activeThemeName, setActiveThemeName] = useState<string>(() => {
    const s = ThemeEngineService.getSettings();
    return s.appliedThemeDefinition?.name || (s.activeThemeId ? AdminAssetService.getAssetById(s.activeThemeId)?.name : '') || 'None';
  });
  const [showNameModal, setShowNameModal] = useState(false);

  const catalogCount = AppCatalogService.getFinalizedCatalogCount();

  useEffect(() => {
    const unsubUser = UserCustomizationService.subscribe(() => {
      setUserState(UserCustomizationService.getState());
    });
    const unsubAssist = AssistService.subscribe(() => {
      setAssistConfig(AssistService.getConfig());
    });
    const unsubTheme = ThemeService.subscribe(() => {
      setThemeConfig(ThemeService.getConfig());
    });
    const unsubThemeEngine = ThemeEngineService.subscribe(() => {
      const s = ThemeEngineService.getSettings();
      setActiveThemeName(s.appliedThemeDefinition?.name || (s.activeThemeId ? AdminAssetService.getAssetById(s.activeThemeId)?.name : '') || 'None');
    });
    const unsubIcon = IconService.subscribe(() => {
      setActivePackName(IconService.getActivePackName());
    });
    const unsubProfile = UserProfileService.subscribe(() => {
      setUserName(UserProfileService.getUserName());
    });

    return () => {
      unsubUser();
      unsubAssist();
      unsubTheme();
      unsubThemeEngine();
      unsubIcon();
      unsubProfile();
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning,', emoji: '☀️' };
    if (hour < 18) return { text: 'Good Afternoon,', emoji: '🌤️' };
    return { text: 'Good Evening,', emoji: '🌙' };
  };

  const greeting = getGreeting();

  // 8 Core Modules matching Reference UI
  const modulesList = [
    {
      id: 'themes' as PageId,
      name: 'Themes',
      icon: Palette,
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-400/30',
      activeText: activeThemeName,
    },
    {
      id: 'icons' as PageId,
      name: 'Icon Packs',
      icon: Shapes,
      color: 'from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-400/30',
      activeText: `${activePackName} (1250+)`,
    },
    {
      id: 'widgets_system_ui' as PageId,
      name: 'System UI',
      icon: Sliders,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/30',
      activeText: 'Pill / Squircle',
    },
    {
      id: 'wallpapers' as PageId,
      name: 'Wallpaper',
      icon: ImageIcon,
      color: 'from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-400/30',
      activeText: 'JARVIS Reactive',
    },
    {
      id: 'assist' as PageId,
      name: 'JARVIS',
      icon: Cpu,
      color: 'from-cyan-500/20 to-blue-600/20 text-cyan-300 border-cyan-400/40',
      activeText: 'System AI Ready',
    },
    {
      id: 'camera' as PageId,
      name: 'Vision',
      icon: Camera,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-400/30',
      activeText: 'AI Camera Active',
    },
    {
      id: 'keyboard' as PageId,
      name: 'Keyboard',
      icon: KeyboardIcon,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/30',
      activeText: 'Neon Glass IME',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 text-white select-none">
      {/* 1. Header Greeting with Personalization */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs sm:text-sm font-medium text-slate-400">{greeting.text}</span>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {userName}
            </h1>
            <button
              onClick={() => setShowNameModal(true)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-white/10 transition cursor-pointer active:scale-95"
              title="Change your name"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <span className="text-xl">{greeting.emoji}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Your Android. Your Style. <span className="text-slate-200">Make it truly yours with ONEVA.</span>
          </p>
        </div>
      </div>

      {/* 2. Active Customization Card (Deep Navy Glass Surface) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#101F45] via-[#0C1734] to-[#080E22] border border-cyan-500/25 p-5 sm:p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl space-y-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Active Customization</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live configurations applied to your real Android environment
            </p>
          </div>

          <button
            onClick={() => onNavigate('modules')}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-semibold transition cursor-pointer active:scale-95 shrink-0"
          >
            Manage
          </button>
        </div>

        {/* 4 Active Status Items with Color Dots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div
            onClick={() => onNavigate('themes')}
            className="flex items-center justify-between p-3 rounded-2xl bg-[#09132A]/70 hover:bg-[#0E1A3C] border border-white/5 hover:border-cyan-500/20 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Theme</span>
                <span className="text-white font-semibold">{activeThemeName}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>

          <div
            onClick={() => onNavigate('icons')}
            className="flex items-center justify-between p-3 rounded-2xl bg-[#09132A]/70 hover:bg-[#0E1A3C] border border-white/5 hover:border-cyan-500/20 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80 animate-pulse" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Icon Pack</span>
                <span className="text-white font-semibold">{activePackName} (Active)</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>

          <div
            onClick={() => onNavigate('wallpapers')}
            className="flex items-center justify-between p-3 rounded-2xl bg-[#09132A]/70 hover:bg-[#0E1A3C] border border-white/5 hover:border-cyan-500/20 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400/80 animate-pulse" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Live Wallpaper</span>
                <span className="text-white font-semibold">JARVIS Reactive</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>

          <div
            onClick={() => onNavigate('widgets_system_ui')}
            className="flex items-center justify-between p-3 rounded-2xl bg-[#09132A]/70 hover:bg-[#0E1A3C] border border-white/5 hover:border-cyan-500/20 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">System UI &amp; Search</span>
                <span className="text-white font-semibold">Contours &amp; Tiles Tuned</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>

      {/* 3. 8 Module Quick Tiles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 tracking-tight">Customization Modules</h2>
          <button
            onClick={() => onNavigate('modules')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition cursor-pointer"
          >
            View All &rarr;
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {modulesList.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => onNavigate(mod.id)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0A142E]/70 hover:bg-[#0F1D43] border border-cyan-500/15 hover:border-cyan-400/40 transition cursor-pointer group active:scale-95 shadow-md shadow-cyan-950/20"
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.color} border flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-200 tracking-tight text-center truncate w-full">
                  {mod.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Target Real Apps Modifier Shortcut Tile */}
      <div
        onClick={() => onNavigate('modify_apps')}
        className="p-4 rounded-3xl bg-gradient-to-r from-[#0C1A3A]/80 via-[#0A142D]/80 to-[#121A3D]/80 border border-cyan-500/25 hover:border-cyan-400/45 flex items-center justify-between gap-4 transition cursor-pointer group shadow-lg"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0 group-hover:scale-105 transition-transform">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Modify Real Android Apps</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                {catalogCount} Apps Mapped
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Customize YouTube, WhatsApp, Instagram, PhonePe, and Camera with individual icons and edge effects.
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition" />
      </div>

      {/* 5. Architectural Directives Cards */}
      <div className="space-y-3 pt-1">
        {/* Banner 1: Real Android vs Fake Simulator */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0C1836]/70 via-[#091228]/80 to-[#070D1E]/90 border border-cyan-500/20 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Real Android Architecture
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-cyan-300 font-semibold">ONEVA configures and applies. Android displays the result.</strong> You don't get a fake home screen inside ONEVA. You get a real, enhanced Android experience across your genuine apps.
            </p>
          </div>
        </div>

        {/* Banner 2: JARVIS is Everywhere */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#141235]/70 via-[#0A1129]/80 to-[#070D1E]/90 border border-purple-500/20 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              JARVIS Is Everywhere
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Say <strong className="text-purple-300 font-semibold">&ldquo;Hey JARVIS&rdquo;</strong> from anywhere on your phone. Operates across YouTube, WhatsApp, Instagram, Chrome, or Settings without opening ONEVA.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Works in all real apps
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Zero cloud eavesdropping
              </span>
            </div>
          </div>
        </div>

        {/* Banner 3: Formula */}
        <div className="p-3.5 rounded-2xl bg-[#070E22]/60 border border-white/10 text-center">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-cyan-300 font-semibold">Custom Look (ONEVA)</span>
            <span>+</span>
            <span className="text-purple-300 font-semibold">Smart Actions (JARVIS)</span>
            <span>=</span>
            <span className="text-emerald-400 font-semibold">Real Android (Your Phone)</span>
          </div>
        </div>
      </div>

      {/* Name Edit Modal */}
      {showNameModal && (
        <UserNameModal
          isOpen={showNameModal}
          onClose={() => setShowNameModal(false)}
          onSaved={(n) => setUserName(n)}
        />
      )}
    </div>
  );
}
