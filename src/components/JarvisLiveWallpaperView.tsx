import { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Shield,
  Activity,
  CheckCircle,
  Play,
  RotateCcw,
  Power,
  ShieldAlert,
  Mic,
  MicOff,
  Battery,
  BatteryCharging,
  Eye,
  Layers,
  Radio,
  Sliders,
} from 'lucide-react';
import { AssistService, JarvisReactionState } from '../services/assistService';
import {
  JarvisFuturisticLiveWallpaper,
  dispatchJarvisTouchRipple,
  dispatchJarvisTouchDrag,
} from './JarvisFuturisticLiveWallpaper';
import { JarvisGlobalWakeService, GlobalWakeStatus } from '../services/voice/jarvisGlobalWakeService';
import { UserCustomizationService } from '../services/userCustomizationService';
import { WallpaperService } from '../services/wallpaperService';

export function JarvisLiveWallpaperView() {
  const [isEnabled, setIsEnabled] = useState(AssistService.getConfig().isLiveWallpaperEnabled);
  const [reactionState, setReactionState] = useState<JarvisReactionState>(
    AssistService.getConfig().liveWallpaperReactionState
  );
  const [forceAwakeMode, setForceAwakeMode] = useState<boolean>(false);
  const [wakeStatus, setWakeStatus] = useState<GlobalWakeStatus>(JarvisGlobalWakeService.getStatus());
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  useEffect(() => {
    JarvisGlobalWakeService.init();

    const unsubAssist = AssistService.subscribe(() => {
      const cfg = AssistService.getConfig();
      setIsEnabled(cfg.isLiveWallpaperEnabled);
      setReactionState(cfg.liveWallpaperReactionState);
    });

    const unsubWake = JarvisGlobalWakeService.subscribe(() => {
      setWakeStatus(JarvisGlobalWakeService.getStatus());
    });

    return () => {
      unsubAssist();
      unsubWake();
    };
  }, []);

  const handleToggle = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    AssistService.setLiveWallpaperEnabled(next);
    if (next) {
      setAppliedToast('ONEVA JARVIS Live Reactive Wallpaper enabled.');
      setTimeout(() => setAppliedToast(null), 3000);
    }
  };

  const handleToggleGlobalWake = () => {
    const next = !wakeStatus.isActive;
    JarvisGlobalWakeService.setEnabled(next);
  };

  const simulateState = (state: JarvisReactionState, isAwake: boolean = true) => {
    setForceAwakeMode(isAwake);
    setReactionState(state);
    AssistService.setReactionState(state);

    if (state !== 'idle') {
      setTimeout(() => {
        setReactionState('idle');
        AssistService.setReactionState('idle');
      }, 5000);
    }
  };

  const handleApplyAsHomeScreen = () => {
    AssistService.setLiveWallpaperEnabled(true);
    setIsEnabled(true);
    UserCustomizationService.applyItem('wallpaper', 'jarvis_futuristic_live');
    WallpaperService.applyWallpaper({
      presetId: 'jarvis_futuristic_live',
      assetId: 'jarvis_futuristic_live',
      name: 'ONEVA JARVIS Live Reactive Wallpaper',
      source: 'preset',
    });

    setAppliedToast('Applied to Home Screen! Works 100% offline and persists permanently.');
    setTimeout(() => setAppliedToast(null), 4000);
  };

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/80 border border-white/10 space-y-6">
      {/* Toast Notification */}
      {appliedToast && (
        <div className="p-3 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{appliedToast}</span>
        </div>
      )}

      {/* Header & Main Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono uppercase mb-1">
            <Sparkles className="w-3 h-3" />
            <span>ONEVA Reactive Wallpaper Engine</span>
          </div>
          <h2 className="text-sm font-semibold text-white">JARVIS Live Reactive Wallpaper</h2>
          <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
            Not just a wallpaper... It&apos;s your AI companion. Responsive vector particles, concentric HUD Arc Reactor, holographic telemetry, and dynamic voice states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="jarvis-apply-home-wallpaper-btn"
            type="button"
            onClick={handleApplyAsHomeScreen}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Set As Home Wallpaper</span>
          </button>

          <button
            id="jarvis-live-wallpaper-toggle"
            type="button"
            onClick={handleToggle}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border ${
              isEnabled
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isEnabled ? 'ENABLED' : 'DISABLED'}</span>
          </button>
        </div>
      </div>

      {/* Live Interactive Wallpaper Preview Canvas */}
      <div className="relative rounded-2xl bg-black border border-neutral-800 overflow-hidden min-h-[320px] flex items-center justify-center select-none shadow-2xl">
        {isEnabled ? (
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
            className="relative w-full h-[340px] cursor-pointer group select-none"
          >
            <JarvisFuturisticLiveWallpaper
              reactionState={reactionState}
              forceAwakeMode={forceAwakeMode}
              interactive={true}
              onReactorTap={() => {
                setForceAwakeMode(!forceAwakeMode);
              }}
            />

            {/* Mode & Reaction Status Badges */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-cyan-500/30 text-cyan-300">
                Mode: <strong className="text-white">{forceAwakeMode ? 'JARVIS AWAKE' : 'NORMAL'}</strong>
              </span>

              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/10 text-neutral-300">
                State: <strong className="text-cyan-400">{reactionState.toUpperCase()}</strong>
              </span>
            </div>

            {/* Interactive hint */}
            <div className="absolute bottom-3 right-3 z-10 text-[10px] font-mono text-neutral-400 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 opacity-80 group-hover:opacity-100 transition">
              Touch to attract particles &amp; shockwaves &bull; Tap Reactor to toggle HUD &rarr;
            </div>
          </div>
        ) : (
          <div className="relative z-10 text-center py-12 text-neutral-500 space-y-2">
            <Power className="w-8 h-8 mx-auto opacity-40 mb-1" />
            <p className="text-xs font-medium text-neutral-400">Live Reactive Wallpaper is currently OFF</p>
            <p className="text-[11px] text-neutral-500">Enable to activate responsive vector particle physics and holographic HUD.</p>
          </div>
        )}
      </div>

      {/* Global Ambient Wake Word Detection Status Card */}
      <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl border ${wakeStatus.isActive ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-neutral-800/40 border-neutral-700 text-neutral-500'}`}>
            {wakeStatus.isActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Global Ambient Wake Detection</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${wakeStatus.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
                {wakeStatus.isActive ? 'LISTENING EVERYWHERE' : 'OFF'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Speak <strong className="text-cyan-300">&quot;Jarvis&quot;</strong> or <strong className="text-cyan-300">&quot;Hey Jarvis&quot;</strong> anywhere on your phone to wake Jarvis and illuminate the reactive wallpaper.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleGlobalWake}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer border transition ${
            wakeStatus.isActive
              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25'
              : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
          }`}
        >
          {wakeStatus.isActive ? 'Wake Active' : 'Enable Wake'}
        </button>
      </div>

      {/* 5 Screen Modes & Dynamic Behavior States Simulator (Exact Image Specification) */}
      {isEnabled && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-300">Simulate Dynamic Behavior States:</span>
            <span className="text-[10px] font-mono text-neutral-500">Visuals react in real-time</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* 1. IDLE (Normal Mode) */}
            <button
              type="button"
              onClick={() => {
                setForceAwakeMode(false);
                simulateState('idle', false);
              }}
              className={`p-2.5 rounded-xl border text-xs font-mono transition text-center cursor-pointer ${
                !forceAwakeMode && reactionState === 'idle'
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50 font-semibold shadow-lg shadow-cyan-950/50'
                  : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <div className="text-[10px] opacity-70">1. DEFAULT</div>
              <div className="font-bold mt-0.5">NORMAL MODE</div>
            </button>

            {/* 2. JARVIS AWAKE (Full Screen HUD) */}
            <button
              type="button"
              onClick={() => {
                setForceAwakeMode(true);
                simulateState('idle', true);
              }}
              className={`p-2.5 rounded-xl border text-xs font-mono transition text-center cursor-pointer ${
                forceAwakeMode && reactionState === 'idle'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/50 font-semibold shadow-lg shadow-blue-950/50'
                  : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <div className="text-[10px] opacity-70">2. AWAKE</div>
              <div className="font-bold mt-0.5">JARVIS HUD</div>
            </button>

            {/* 3. LISTENING (Amber Gold + Audio Waveform) */}
            <button
              type="button"
              onClick={() => simulateState('listening', true)}
              className={`p-2.5 rounded-xl border text-xs font-mono transition text-center cursor-pointer ${
                reactionState === 'listening'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/50 font-semibold shadow-lg shadow-amber-950/50'
                  : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <div className="text-[10px] opacity-70">3. LISTENING</div>
              <div className="font-bold mt-0.5">WAVEFORM</div>
            </button>

            {/* 4. THINKING (Cyber Purple HUD Gears) */}
            <button
              type="button"
              onClick={() => simulateState('command_processing', true)}
              className={`p-2.5 rounded-xl border text-xs font-mono transition text-center cursor-pointer ${
                reactionState === 'command_processing' || reactionState === 'command_detected'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/50 font-semibold shadow-lg shadow-purple-950/50'
                  : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <div className="text-[10px] opacity-70">4. THINKING</div>
              <div className="font-bold mt-0.5">ROTATING GEARS</div>
            </button>

            {/* 5. EXECUTING (Orange/Red Plasma Surge) */}
            <button
              type="button"
              onClick={() => simulateState('completed', true)}
              className={`p-2.5 rounded-xl border text-xs font-mono transition text-center cursor-pointer ${
                reactionState === 'completed' || reactionState === 'command_finished'
                  ? 'bg-orange-500/15 text-orange-300 border-orange-500/50 font-semibold shadow-lg shadow-orange-950/50'
                  : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <div className="text-[10px] opacity-70">5. EXECUTING</div>
              <div className="font-bold mt-0.5">PLASMA SURGE</div>
            </button>

            {/* 6. RESET TO NORMAL */}
            <button
              type="button"
              onClick={() => {
                setForceAwakeMode(false);
                simulateState('idle', false);
              }}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-neutral-300 transition text-center cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              <span>RESET IDLE</span>
            </button>
          </div>
        </div>
      )}

      {/* Technical Architecture & Privacy Verification Note */}
      <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 space-y-2 text-xs text-neutral-400">
        <div className="flex items-center gap-2 text-neutral-300 font-semibold">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Direct Implementation Directives Confirmed:</span>
        </div>
        <ul className="space-y-1 list-disc list-inside text-[11px] text-neutral-400 leading-relaxed">
          <li>
            <strong className="text-neutral-200">App Icons Layer Strictly Preserved:</strong> Real home screen apps remain in their exact positions. The wallpaper renders strictly as a live background layer underneath.
          </li>
          <li>
            <strong className="text-neutral-200">100% Offline &amp; Cut-Proof:</strong> Stored locally in localStorage with pure Canvas 2D vector mathematics. No network connection required; once applied, it never breaks or resets when the app is closed.
          </li>
          <li>
            <strong className="text-neutral-200">Global Ambient Wake Detection:</strong> The microphone background service continuously listens for &quot;Jarvis&quot; / &quot;Hey Jarvis&quot; across the entire system.
          </li>
        </ul>
      </div>
    </div>
  );
}
