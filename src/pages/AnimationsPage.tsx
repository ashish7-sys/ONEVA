import { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Play,
  Sliders,
  Sparkles,
  Zap,
  Check,
  RotateCcw,
} from 'lucide-react';
import { PlatformBridge } from '../launcher/services/platformBridge';

interface AnimationsPageProps {
  onNavigateBack?: () => void;
  onNavigateToEdgeGlow?: () => void;
}

export function AnimationsPage({ onNavigateBack, onNavigateToEdgeGlow }: AnimationsPageProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [animStyle, setAnimStyle] = useState<'smooth' | 'dynamic' | 'minimal'>('dynamic');
  const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [applyToTransitions, setApplyToTransitions] = useState<boolean>(true);
  const [applyToAppOpenClose, setApplyToAppOpenClose] = useState<boolean>(true);
  const [applyToSystemUi, setApplyToSystemUi] = useState<boolean>(true);
  const [isTestingAnim, setIsTestingAnim] = useState<boolean>(false);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  const handleToggle = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    PlatformBridge.performHapticFeedback('confirm');
    setAppliedToast(next ? 'ONEVA Kinematics enabled.' : 'Animations set to zero.');
    setTimeout(() => setAppliedToast(null), 2500);
  };

  const handleTestAnimation = () => {
    setIsTestingAnim(true);
    PlatformBridge.performHapticFeedback('confirm');
    setTimeout(() => setIsTestingAnim(false), 900);
  };

  const animationStyles = [
    {
      id: 'smooth',
      name: 'Smooth',
      desc: 'Gentle cubic bezier curve',
      damping: 'Damping: 28 &bull; Mass: 1.0',
    },
    {
      id: 'dynamic',
      name: 'Dynamic',
      desc: 'Bouncy spring kinematics',
      damping: 'Damping: 18 &bull; Stiffness: 260',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      desc: 'Snappy low-latency curve',
      damping: 'Zero overshoot &bull; Instant snap',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Toast */}
      {appliedToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-neutral-900/95 border border-cyan-500/40 shadow-2xl px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-xs text-neutral-200 font-medium">{appliedToast}</span>
        </div>
      )}

      {/* Header (Reference Screen 7) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Animation</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure motion physics and system transition curves for your Android device.
          </p>
        </div>
      </div>

      {/* Switch: Enable Animations (Reference Screen 7) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-sm font-bold text-white block">Enable Animations</span>
          <p className="text-xs text-neutral-400 mt-0.5">
            Smooth spring-based transitions across system UI and applications
          </p>
        </div>

        <button
          onClick={handleToggle}
          className={`w-14 h-8 rounded-full transition-colors relative p-1 cursor-pointer shrink-0 ${
            isEnabled ? 'bg-cyan-500' : 'bg-neutral-700'
          }`}
          aria-label="Toggle Animations"
        >
          <div
            className={`w-6 h-6 rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-0'
            } shadow-md`}
          />
        </button>
      </div>

      {/* Animation Style Selector (Reference Screen 7: Smooth, Dynamic, Minimal) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
          Animation Style
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {animationStyles.map((style) => {
            const isSelected = animStyle === style.id;
            return (
              <div
                key={style.id}
                onClick={() => setAnimStyle(style.id as any)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-neutral-900/90 border-cyan-400/50 shadow-lg shadow-cyan-950/40'
                    : 'bg-neutral-900/50 border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{style.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <span className="text-[11px] text-neutral-300 mt-1 block">{style.desc}</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 mt-3 block">{style.damping}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Speed Slider (Reference Screen 7: Slow, Medium, Fast) */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white">Speed</span>
          <span className="font-mono text-cyan-400 capitalize font-semibold">{speed}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['slow', 'medium', 'fast'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`py-2 rounded-xl text-xs font-medium capitalize border transition cursor-pointer ${
                speed === s
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-semibold'
                  : 'bg-white/[0.02] text-neutral-400 border-white/5 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Apply To (Reference Screen 7: Transitions, App Open/Close, System UI) */}
      <div className="rounded-2xl bg-neutral-900/60 border border-white/10 p-4 space-y-3">
        <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
          Apply To
        </span>

        <div className="space-y-2 text-xs">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition">
            <div>
              <span className="font-medium text-white block">Transitions</span>
              <span className="text-[11px] text-neutral-400">
                Navigation between pages, drawers, and modal sheets
              </span>
            </div>
            <input
              type="checkbox"
              checked={applyToTransitions}
              onChange={(e) => setApplyToTransitions(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition">
            <div>
              <span className="font-medium text-white block">App Open/Close</span>
              <span className="text-[11px] text-neutral-400">
                Opening and dismissing real Android applications
              </span>
            </div>
            <input
              type="checkbox"
              checked={applyToAppOpenClose}
              onChange={(e) => setApplyToAppOpenClose(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition">
            <div>
              <span className="font-medium text-white block">System UI</span>
              <span className="text-[11px] text-neutral-400">
                Quick settings panel, notifications shade, and volume sliders
              </span>
            </div>
            <input
              type="checkbox"
              checked={applyToSystemUi}
              onChange={(e) => setApplyToSystemUi(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Interactive Kinetic Physics Test Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">Kinetic Curve Simulation</span>
          <button
            onClick={handleTestAnimation}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-neutral-950 text-xs font-bold transition cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Test Animation</span>
          </button>
        </div>

        <div className="h-36 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center relative overflow-hidden">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-xl transition-all ${
              animStyle === 'dynamic'
                ? 'transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
                : animStyle === 'smooth'
                ? 'transition-all duration-700 ease-in-out'
                : 'transition-all duration-200 ease-linear'
            } ${
              isTestingAnim
                ? 'scale-125 rotate-45 bg-cyan-400 text-neutral-950 shadow-cyan-400/60'
                : 'scale-100 rotate-0'
            }`}
          >
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
