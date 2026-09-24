import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  Bluetooth,
  Flashlight,
  Moon,
  Sun,
  Zap,
  Sliders,
  Volume2,
  RotateCcw,
  Search,
  Mic,
  X,
  ChevronUp,
  ChevronDown,
  Settings,
  Layers,
  Smartphone,
  Sparkles,
  Battery,
  Radio,
  Check,
  Flame,
  ShieldCheck,
  ArrowLeft,
  Maximize2,
  Minimize2,
  ExternalLink,
  MessageCircle,
  Phone,
  Camera,
  Globe,
  Youtube,
  Play,
  Share2,
  Square,
} from 'lucide-react';
import { AppRepository } from '../launcher/services/appRepository';
import { AppShortcut, LaunchResult } from '../launcher/types';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { AppIconItem } from '../launcher/components/AppIconItem';
import { AppContextMenu } from '../launcher/components/AppContextMenu';
import {
  JarvisFuturisticLiveWallpaper,
  dispatchJarvisTouchRipple,
  dispatchJarvisTouchDrag,
} from '../components/JarvisFuturisticLiveWallpaper';
import { QuickPanelService, QuickPanelConfig, QuickPanelTile, QuickTileId } from '../services/quickPanelService';
import { WallpaperService } from '../services/wallpaperService';
import { ThemeService } from '../services/themeService';
import { IconService } from '../services/iconService';
import { AssistService, JarvisReactionState } from '../services/assistService';
import { JarvisActionSelector } from '../services/actions/jarvisActionSelector';
import { JarvisVoiceService } from '../services/jarvisVoiceService';
import { JarvisPersonalityEngine } from '../services/intelligence/jarvisPersonalityEngine';
import { JarvisTtsEngine } from '../services/voice/jarvisTtsEngine';
import { JarvisVoiceSettingsModal } from '../components/jarvis/JarvisVoiceSettingsModal';
import { JarvisWorkPanel } from '../components/jarvis/JarvisWorkPanel';
import { JarvisActiveTasksBar } from '../components/jarvis/JarvisActiveTasksBar';
import { JarvisTaskNotificationToast } from '../components/jarvis/JarvisTaskNotificationToast';
import { JarvisWorkTaskManager } from '../services/intelligence/jarvisWorkTaskManager';
import { JarvisLongRunningDetector } from '../services/intelligence/jarvisLongRunningDetector';
import { PageId } from '../navigation/types';

interface LauncherPageProps {
  onNavigateBack?: () => void;
  onOpenSettings?: () => void;
  onNavigateToPage?: (page: PageId) => void;
}

export const LauncherPage: React.FC<LauncherPageProps> = ({
  onNavigateBack,
  onOpenSettings,
  onNavigateToPage,
}) => {
  const [apps, setApps] = useState<AppShortcut[]>(AppRepository.getAvailableApps());
  const [quickPanelConfig, setQuickPanelConfig] = useState<QuickPanelConfig>(QuickPanelService.getConfig());
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState<boolean>(false);
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [brightness, setBrightness] = useState<number>(85);
  const [volume, setVolume] = useState<number>(70);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Active App Launch Feedback State
  const [appLaunchFeedback, setAppLaunchFeedback] = useState<{
    app: AppShortcut;
    result: LaunchResult;
  } | null>(null);

  // App Context Menu State
  const [contextApp, setContextApp] = useState<AppShortcut | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | null>(null);

  // Jarvis Voice & Reaction State
  const [jarvisReaction, setJarvisReaction] = useState<JarvisReactionState>(
    AssistService.getConfig().liveWallpaperReactionState
  );
  const [jarvisCommandInput, setJarvisCommandInput] = useState<string>('');
  const [jarvisResponse, setJarvisResponse] = useState<string | null>(null);
  const [isJarvisExecuting, setIsJarvisExecuting] = useState<boolean>(false);
  const [showJarvisModal, setShowJarvisModal] = useState<boolean>(false);
  const [showPersonalityModal, setShowPersonalityModal] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(JarvisTtsEngine.getIsSpeaking());

  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>('12:45');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubQuick = QuickPanelService.subscribe(() => {
      setQuickPanelConfig(QuickPanelService.getConfig());
    });
    const unsubApps = AppRepository.subscribe(() => {
      setApps(AppRepository.getAvailableApps());
    });
    const unsubAssist = AssistService.subscribe(() => {
      setJarvisReaction(AssistService.getConfig().liveWallpaperReactionState);
    });

    return () => {
      unsubQuick();
      unsubApps();
      unsubAssist();
    };
  }, []);

  // Handle app launch
  const handleLaunchApp = async (app: AppShortcut) => {
    // If it's ONEVA platform itself, route to system settings or library
    if (app.packageName === 'com.oneva.android.launcher') {
      if (onOpenSettings) {
        onOpenSettings();
      } else if (onNavigateToPage) {
        onNavigateToPage('library');
      }
      return;
    }

    // Attempt native intent or structured fallback via PlatformBridge
    const result = await PlatformBridge.launchApp(app);

    // If native Android intent succeeded, no fallback dialog needed (Android OS switches task natively)
    if (result.mode === 'native-android' && result.success) {
      return;
    }

    // In web preview or when app is not installed on device:
    // Show clean ONEVA fallback modal (NEVER fake app running or fake integrity text)
    setAppLaunchFeedback({
      app,
      result,
    });
  };

  // Handle long press on app icon
  const handleLongPress = (app: AppShortcut, e: React.MouseEvent | React.TouchEvent) => {
    let clientX = window.innerWidth / 2;
    let clientY = window.innerHeight / 2;

    if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    setContextApp(app);
    setContextPos({ x: clientX, y: clientY });
  };

  // Subscribe to Jarvis reaction state
  useEffect(() => {
    const unsubscribe = AssistService.subscribe(() => {
      setJarvisReaction(AssistService.getConfig().liveWallpaperReactionState);
    });

    const unsubTts = JarvisTtsEngine.subscribe(() => {
      setIsSpeaking(JarvisTtsEngine.getIsSpeaking());
    });

    return () => {
      unsubscribe();
      unsubTts();
    };
  }, []);

  // Handle Quick Panel tile toggle
  const handleToggleTile = (tileId: QuickTileId) => {
    QuickPanelService.toggleTile(tileId);
  };

  // Handle Jarvis command execution with Phase 19 Personality + Voice & Phase 20 Work Panel
  const handleExecuteJarvisCommand = async (cmdText: string) => {
    if (!cmdText.trim()) return;

    // Phase 20: Evaluate if command requires live Work Panel
    const longRunningEval = JarvisLongRunningDetector.evaluate(cmdText);
    if (longRunningEval.isLongRunning) {
      setShowJarvisModal(false);
      setJarvisCommandInput('');
      await JarvisWorkTaskManager.createAndStartTask(
        cmdText,
        longRunningEval.taskType,
        longRunningEval.title
      );
      return;
    }

    setIsJarvisExecuting(true);
    setJarvisResponse(null);
    AssistService.setReactionState('command_processing');

    try {
      const res = await JarvisActionSelector.selectAndExecute(cmdText);
      AssistService.setReactionState('command_finished');

      const rawMsg = res?.userMessage || 'Action completed.';
      const isSuccess = res?.success !== false;

      // Phase 19: Format through Personality Engine
      const formatted = JarvisPersonalityEngine.formatResponse({
        rawMessage: rawMsg,
        isActionSuccess: isSuccess,
        complexity: 'SIMPLE',
      });

      setJarvisResponse(formatted.displayText);

      // Speak using Phase 19 TTS Engine (if enabled)
      JarvisVoiceService.speakText(formatted.spokenText);
    } catch (err: any) {
      AssistService.setReactionState('idle');
      const formattedErr = JarvisPersonalityEngine.formatResponse({
        rawMessage: err?.message || 'Execution error',
        isError: true,
      });
      setJarvisResponse(formattedErr.displayText);
      JarvisVoiceService.speakText(formattedErr.spokenText);
    } finally {
      setIsJarvisExecuting(false);
    }
  };

  // Filter apps for drawer
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeCategory === 'all') return matchesSearch;
    if (activeCategory === 'system') return matchesSearch && app.isSystemApp;
    if (activeCategory === 'customized') return matchesSearch && !app.isSystemApp;
    return matchesSearch;
  });

  // Dock items (Top 4 shortcuts + Jarvis)
  const dockApps = apps.slice(0, 4);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none pb-8">
      {/* Top Banner: Control Center Return & Diagnostics Toggle */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-xl border-b-2 border-white/10 px-4 sm:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold text-neutral-100 border-2 border-white/20 hover:border-white/50 transition cursor-pointer shadow-sm hover:shadow-cyan-500/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Control Center</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-white tracking-wider">ONEVA LAUNCHER</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border-2 border-white/25 text-[10px] font-mono uppercase font-semibold animate-glow-neon">
              Live Phone Surface
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-200 border-2 border-white/20 hover:border-white/50 text-xs font-mono transition cursor-pointer shadow-sm"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Preview'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-mono text-neutral-200 border-2 border-white/20 hover:border-white/50 transition cursor-pointer shadow-sm"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Quick Panel &amp; Matrix</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Device Frame */}
        <div
          onPointerDown={(e) => {
            dispatchJarvisTouchRipple(e.clientX, e.clientY);
            dispatchJarvisTouchDrag(e.clientX, e.clientY, true);
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) {
              dispatchJarvisTouchDrag(e.clientX, e.clientY, true);
            }
          }}
          onPointerUp={(e) => {
            dispatchJarvisTouchDrag(e.clientX, e.clientY, false);
          }}
          onPointerLeave={(e) => {
            dispatchJarvisTouchDrag(e.clientX, e.clientY, false);
          }}
          className={`relative overflow-hidden transition-all duration-300 ${
            isFullScreen
              ? 'w-full max-w-2xl h-[92vh] rounded-3xl border-2 border-neutral-800 shadow-2xl bg-black'
              : 'w-[380px] sm:w-[410px] h-[820px] rounded-[3.2rem] border-[6px] sm:border-[10px] border-neutral-800 shadow-[0_25px_70px_rgba(0,0,0,0.8)] bg-black'
          }`}
        >
          {/* Subtle Outer OLED Bezel Highlight */}
          <div className="absolute inset-0 rounded-[inherit] pointer-events-none border-2 border-white/20 z-30 shadow-[inset_0_0_20px_rgba(255,255,255,0.04)]" />

          {/* Top Camera Punch Hole */}
          <div className="absolute top-3 inset-x-0 flex justify-center z-40 pointer-events-none">
            <div className="w-4 h-4 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
            </div>
          </div>

          {/* Status Bar */}
          <div
            onClick={() => setIsQuickPanelOpen(!isQuickPanelOpen)}
            className="absolute top-0 inset-x-0 h-10 px-6 pt-2 flex items-center justify-between text-xs font-mono text-neutral-300 z-30 cursor-pointer hover:bg-white/5 transition"
            title="Tap to pull down Quick Panel"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white tracking-wider">{currentTime}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-2 bg-white rounded-xs" />
                <div className="w-1 h-2.5 bg-white rounded-xs" />
                <div className="w-1 h-3 bg-white rounded-xs" />
                <div className="w-1 h-3.5 bg-white rounded-xs" />
              </div>
              <Wifi className="w-3.5 h-3.5 text-white" />
              <div className="flex items-center gap-1 font-mono text-[11px] text-white">
                <span>98%</span>
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Pull Down Tab Indicator */}
          <div
            onClick={() => setIsQuickPanelOpen(!isQuickPanelOpen)}
            className="absolute top-9 inset-x-0 flex justify-center z-30 cursor-pointer group"
          >
            <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-emerald-400/80 transition-all duration-200" />
          </div>

          {/* Futuristic JARVIS Stateful Backdrop (States 1-5) */}
          <div className="absolute inset-0 z-0 bg-black overflow-hidden">
            <JarvisFuturisticLiveWallpaper />
          </div>

          {/* Quick Panel Overlay (Phase 18 Integration) */}
          {isQuickPanelOpen && (
            <div className="absolute inset-x-0 top-0 z-40 bg-neutral-950/95 border-b-2 border-white/15 p-5 pt-12 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-full duration-200">
              <div className="flex items-center justify-between pb-3 border-b-2 border-white/10">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    ONEVA Quick Panel
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenSettings && (
                    <button
                      onClick={() => {
                        setIsQuickPanelOpen(false);
                        onOpenSettings();
                      }}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
                      title="Quick Panel Settings"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsQuickPanelOpen(false)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
                    title="Close Quick Panel"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Settings Tiles Grid */}
              <div className="grid grid-cols-4 gap-2.5 py-4">
                {quickPanelConfig.tiles.slice(0, 8).map((tile) => {
                  const active = tile.isActive || tile.state === 'active';
                  
                  // Vibrant distinct color mapping for active tiles
                  let activeStyle = 'bg-emerald-500/20 border-2 border-white/30 text-emerald-300 shadow-md shadow-emerald-950/50 animate-glow-neon';
                  let iconBg = 'bg-emerald-500 text-black font-bold';
                  
                  if (tile.id === 'wifi') {
                    activeStyle = 'bg-sky-500/20 border-2 border-white/30 text-sky-300 shadow-md shadow-sky-950/50 animate-glow-sky';
                    iconBg = 'bg-sky-400 text-black font-bold';
                  } else if (tile.id === 'bluetooth') {
                    activeStyle = 'bg-blue-500/20 border-2 border-white/30 text-blue-300 shadow-md shadow-blue-950/50 animate-glow-blue';
                    iconBg = 'bg-blue-500 text-white font-bold';
                  } else if (tile.id === 'flashlight') {
                    activeStyle = 'bg-amber-500/20 border-2 border-white/30 text-amber-300 shadow-md shadow-amber-950/50 animate-glow-amber';
                    iconBg = 'bg-amber-400 text-black font-bold';
                  } else if (tile.id === 'night_light') {
                    activeStyle = 'bg-purple-500/20 border-2 border-white/30 text-purple-300 shadow-md shadow-purple-950/50 animate-glow-electric';
                    iconBg = 'bg-purple-500 text-white font-bold';
                  } else if (tile.id === 'hotspot') {
                    activeStyle = 'bg-pink-500/20 border-2 border-white/30 text-pink-300 shadow-md shadow-pink-950/50 animate-glow-pink';
                    iconBg = 'bg-pink-500 text-white font-bold';
                  } else if (tile.id === 'airplane_mode') {
                    activeStyle = 'bg-red-500/20 border-2 border-white/30 text-red-300 shadow-md shadow-red-950/50 animate-glow-red';
                    iconBg = 'bg-red-500 text-white font-bold';
                  }

                  return (
                    <button
                      key={tile.id}
                      onClick={() => handleToggleTile(tile.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all cursor-pointer ${
                        active
                          ? activeStyle
                          : 'bg-white/5 border-2 border-white/15 text-neutral-400 hover:bg-white/10 hover:border-white/35'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center mb-1.5 ${
                          active ? iconBg : 'bg-white/10 text-neutral-300'
                        }`}
                      >
                        {tile.id === 'wifi' && (active ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />)}
                        {tile.id === 'bluetooth' && <Bluetooth className="w-3.5 h-3.5" />}
                        {tile.id === 'flashlight' && <Flashlight className="w-3.5 h-3.5" />}
                        {tile.id === 'night_light' && (active ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />)}
                        {tile.id === 'do_not_disturb' && <Moon className="w-3.5 h-3.5" />}
                        {tile.id === 'airplane_mode' && <Radio className="w-3.5 h-3.5" />}
                        {tile.id === 'hotspot' && <Radio className="w-3.5 h-3.5" />}
                        {tile.id === 'battery_saver' && <Battery className="w-3.5 h-3.5" />}
                        {tile.id !== 'wifi' &&
                          tile.id !== 'bluetooth' &&
                          tile.id !== 'flashlight' &&
                          tile.id !== 'night_light' &&
                          tile.id !== 'do_not_disturb' &&
                          tile.id !== 'airplane_mode' &&
                          tile.id !== 'hotspot' &&
                          tile.id !== 'battery_saver' && <Zap className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[10px] font-medium tracking-tight text-center truncate w-full">
                        {tile.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sliders: Brightness & Volume */}
              <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <Sun className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="flex-1 accent-emerald-400 h-1.5 bg-neutral-800 rounded-full cursor-pointer"
                  />
                  <span className="w-8 text-right text-[10px] text-neutral-400">{brightness}%</span>
                </div>

                <div className="flex items-center gap-3">
                  <Volume2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1 accent-emerald-400 h-1.5 bg-neutral-800 rounded-full cursor-pointer"
                  />
                  <span className="w-8 text-right text-[10px] text-neutral-400">{volume}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Launcher Screen Content */}
          <div className="relative z-10 w-full h-full flex flex-col justify-between pt-14 pb-8 px-4">
            {/* Top Widget / Clock & Jarvis Status */}
            <div className="flex flex-col items-center justify-center pt-2 space-y-1">
              <span className="text-4xl font-light tracking-tight text-white font-mono">
                {currentTime}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-400 font-mono">
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-neutral-600">&bull;</span>
                <div className="flex items-center gap-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      jarvisReaction === 'listening'
                        ? 'bg-cyan-400 animate-ping'
                        : jarvisReaction === 'command_processing' || jarvisReaction === 'command_detected'
                        ? 'bg-purple-400 animate-spin'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span className="text-[10px] font-mono text-emerald-400/90 uppercase">
                    Jarvis {jarvisReaction}
                  </span>
                </div>
              </div>
            </div>

            {/* Google / Jarvis Search Pill */}
            <div
              onClick={() => setShowJarvisModal(true)}
              className="mt-4 mx-2 px-4 py-2.5 rounded-2xl bg-neutral-900/85 border-2 border-white/25 flex items-center justify-between cursor-pointer hover:border-white/60 transition shadow-lg group backdrop-blur-md animate-glow-sky"
            >
              <div className="flex items-center gap-2.5 text-neutral-400 group-hover:text-neutral-200 transition">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium">Ask Jarvis or search apps...</span>
              </div>
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition">
                <Mic className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Home Screen App Grid (Favorite Apps) */}
            <div className="flex-1 grid grid-cols-4 gap-y-3 gap-x-2 content-center px-1 py-4">
              {apps.slice(0, 8).map((app) => (
                <AppIconItem
                  key={app.id}
                  app={app}
                  iconShape={IconService.getSettings().fallbackShape}
                  onLaunch={handleLaunchApp}
                  onLongPress={handleLongPress}
                />
              ))}
            </div>

            {/* Bottom Section: Swipe Up to App Drawer Handle */}
            <div
              onClick={() => setIsAppDrawerOpen(true)}
              className="flex flex-col items-center justify-center py-2 cursor-pointer group"
            >
              <ChevronUp className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-transform group-hover:-translate-y-0.5" />
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                All Apps
              </span>
            </div>

            {/* Dock Shortcuts */}
            <div className="px-2 py-2.5 rounded-3xl bg-neutral-900/80 border-2 border-white/25 backdrop-blur-2xl flex items-center justify-around shadow-2xl animate-glow-neon">
              {dockApps.map((app) => (
                <AppIconItem
                  key={`dock-${app.id}`}
                  app={app}
                  showLabel={false}
                  iconShape={IconService.getSettings().fallbackShape}
                  onLaunch={handleLaunchApp}
                  onLongPress={handleLongPress}
                />
              ))}

              {/* Dedicated Jarvis Dock Orb */}
              <button
                onClick={() => setShowJarvisModal(true)}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-950/60 hover:scale-105 active:scale-95 transition cursor-pointer border-2 border-white/40 hover:border-white/70 animate-glow-sky"
                title="ONEVA Assist (Jarvis)"
              >
                <Sparkles className="w-5 h-5 text-black animate-pulse" />
              </button>
            </div>
          </div>

          {/* App Drawer Slide-Up View */}
          {isAppDrawerOpen && (
            <div className="absolute inset-0 z-40 bg-neutral-950/98 backdrop-blur-3xl flex flex-col pt-12 pb-6 px-4 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Application Drawer ({filteredApps.length})
                  </span>
                </div>

                <button
                  onClick={() => {
                    setIsAppDrawerOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar in Drawer */}
              <div className="mt-3 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 font-sans"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 py-3 overflow-x-auto scrollbar-none">
                {['all', 'system', 'customized'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase transition cursor-pointer shrink-0 ${
                      activeCategory === cat
                        ? 'bg-emerald-500 text-black font-bold'
                        : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Apps Grid */}
              <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-y-4 gap-x-2 py-2 content-start pr-1">
                {filteredApps.map((app) => (
                  <AppIconItem
                    key={`drawer-${app.id}`}
                    app={app}
                    iconShape={IconService.getSettings().fallbackShape}
                    onLaunch={(a) => {
                      setIsAppDrawerOpen(false);
                      handleLaunchApp(a);
                    }}
                    onLongPress={handleLongPress}
                  />
                ))}
              </div>
            </div>
          )}

          {/* App Launch Feedback Sheet */}
          {appLaunchFeedback && (
            <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col justify-end animate-in fade-in zoom-in-95 duration-200">
              {/* Bottom Sheet Container */}
              <div className="bg-neutral-900 border-t border-white/10 rounded-t-3xl p-5 shadow-2xl space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg"
                      style={{
                        backgroundColor: `${appLaunchFeedback.app.accentColor || '#10b981'}20`,
                        borderColor: `${appLaunchFeedback.app.accentColor || '#10b981'}50`,
                      }}
                    >
                      <Smartphone
                        className="w-6 h-6"
                        style={{ color: appLaunchFeedback.app.accentColor || '#10b981' }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {appLaunchFeedback.app.label}
                        </h3>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase ${
                            appLaunchFeedback.result.mode === 'native-android'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                          }`}
                        >
                          {appLaunchFeedback.result.mode === 'native-android'
                            ? 'Native Android Intent'
                            : 'Web Preview Sandbox'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                        {appLaunchFeedback.app.packageName}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setAppLaunchFeedback(null)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Honest Status & Technical Breakdown */}
                <div className="p-3.5 rounded-2xl bg-black/50 border border-white/5 space-y-2 text-xs">
                  {appLaunchFeedback.result.mode === 'native-android' ? (
                    <div>
                      <span className="text-amber-400 font-semibold block mb-1">
                        Application Not Installed on Device
                      </span>
                      <p className="text-neutral-400 leading-relaxed text-[11px]">
                        The package <code className="text-neutral-200">{appLaunchFeedback.app.packageName}</code> was requested via native Intent (<code className="text-neutral-300">android.intent.action.MAIN</code>), but is not currently installed in the Android system partition.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sky-300 font-semibold block mb-1">
                        Web Browser Sandbox Environment
                      </span>
                      <p className="text-neutral-400 leading-relaxed text-[11px]">
                        This preview is running inside a web browser. On a physical Android smartphone running ONEVA, tapping this icon dispatches the genuine Android Intent (<code className="text-neutral-300">android.intent.action.MAIN</code>) to launch the real installed application directly.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-1">
                  {appLaunchFeedback.app.webFallbackIntent && (
                    <button
                      onClick={() => {
                        if (appLaunchFeedback.app.webFallbackIntent) {
                          window.open(appLaunchFeedback.app.webFallbackIntent, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open {appLaunchFeedback.app.label} Web Version</span>
                    </button>
                  )}

                  {appLaunchFeedback.result.mode === 'native-android' && (
                    <button
                      onClick={() => {
                        window.open(
                          `https://play.google.com/store/apps/details?id=${appLaunchFeedback.app.packageName}`,
                          '_blank',
                          'noopener,noreferrer'
                        );
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Find on Google Play Store</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAppLaunchFeedback(null)}
                      className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition cursor-pointer text-center"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Jarvis Assistant Modal Voice / Command Dialog */}
          {showJarvisModal && (
            <div className="absolute inset-x-0 bottom-0 z-50 bg-neutral-900/95 border-t border-emerald-500/30 p-5 rounded-t-3xl backdrop-blur-2xl shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    ONEVA Assist &bull; Jarvis
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isSpeaking && (
                    <button
                      onClick={() => JarvisVoiceService.interrupt()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border-2 border-white/25 hover:border-white/40 text-xs font-mono hover:bg-red-500/30 transition cursor-pointer active:scale-95 shadow-md shadow-red-950/40"
                      title="Stop Speech"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop Speech</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowPersonalityModal(true)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-emerald-300 border-2 border-white/20 hover:border-white/35 transition cursor-pointer"
                    title="Voice &amp; Personality Settings"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShowJarvisModal(false);
                      setJarvisResponse(null);
                    }}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border-2 border-white/15 hover:border-white/30 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Response Bubble */}
              {jarvisResponse && (
                <div className="my-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 font-mono leading-relaxed">
                  {jarvisResponse}
                </div>
              )}

              {/* Command Input Box */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask Jarvis (e.g., 'Open YouTube')..."
                  value={jarvisCommandInput}
                  onChange={(e) => setJarvisCommandInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleExecuteJarvisCommand(jarvisCommandInput);
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 font-sans"
                />
                <button
                  onClick={() => handleExecuteJarvisCommand(jarvisCommandInput)}
                  disabled={isJarvisExecuting}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute</span>
                </button>
              </div>

              {/* Sample Quick Action Chips */}
              <div className="flex items-center gap-1.5 pt-3 overflow-x-auto scrollbar-none">
                {[
                  'Open YouTube',
                  'Research the latest Android APIs',
                  'Generate assets for my project',
                  'Create a complete game design',
                  'Analyze this large document',
                  'Open Chrome',
                  'Set dark mode',
                  'Check security status',
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      setJarvisCommandInput(chip);
                      handleExecuteJarvisCommand(chip);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-mono text-neutral-300 transition shrink-0 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Phase 20: Active Tasks Floating Bar (Visible when tasks running & panel closed) */}
          <JarvisActiveTasksBar />

          {/* Phase 20: In-App Notification Toast */}
          <JarvisTaskNotificationToast />

          {/* Phase 20: Live Jarvis Work Panel */}
          <JarvisWorkPanel />

          {/* App Context Menu (Long-Press) */}
          <AppContextMenu
            app={contextApp}
            position={contextPos}
            onClose={() => {
              setContextApp(null);
              setContextPos(null);
            }}
            onLaunch={(app) => {
              setContextApp(null);
              setContextPos(null);
              handleLaunchApp(app);
            }}
            onEnhancementsChanged={() => {
              setApps(AppRepository.getAvailableApps());
            }}
          />

          {/* Phase 19 Voice & Personality Modal */}
          <JarvisVoiceSettingsModal
            isOpen={showPersonalityModal}
            onClose={() => setShowPersonalityModal(false)}
          />
        </div>
      </main>
    </div>
  );
};
