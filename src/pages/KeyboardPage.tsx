import { useState, useEffect } from 'react';
import {
  Keyboard as KeyboardIcon,
  CheckCircle2,
  Sliders,
  Sparkles,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  Volume2,
  Check,
  Palette,
  Zap,
  Activity,
  X,
} from 'lucide-react';
import { KeyboardService, KeyboardTheme } from '../services/keyboardService';
import { PlatformBridge } from '../launcher/services/platformBridge';

interface KeyboardPageProps {
  contextPackageName?: string;
  onNavigateBack?: () => void;
}

export function KeyboardPage({ contextPackageName, onNavigateBack }: KeyboardPageProps) {
  const [activeTab, setActiveTab] = useState<'style' | 'colors' | 'effects'>('style');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('theme_neon_glass');
  const [keyStyle, setKeyStyle] = useState<'rounded' | 'square' | 'pill'>('rounded');
  const [soundVibration, setSoundVibration] = useState<boolean>(true);
  const [hapticIntensity, setHapticIntensity] = useState<number>(60);
  const [glowParticleEffect, setGlowParticleEffect] = useState<boolean>(true);
  const [accentHue, setAccentHue] = useState<string>('#06b6d4');
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [typedText, setTypedText] = useState<string>('ONEVA ');
  const [appliedToast, setAppliedToast] = useState<string | null>(null);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [showKeyStyleModal, setShowKeyStyleModal] = useState<boolean>(false);

  const themesList = [
    { id: 'theme_neon_glass', name: 'Neon Glass', desc: 'Luminescent translucent keycaps with cyan glow' },
    { id: 'theme_oled_black', name: 'OLED Pure Black', desc: 'True zero-emission AMOLED keys with white glyphs' },
    { id: 'theme_cyber_glow', name: 'Cyberpunk Matrix', desc: 'Electric emerald phosphors on titanium frame' },
    { id: 'theme_minimal_slate', name: 'Matte Obsidian', desc: 'Matte dark slate with whisper-quiet feedback' },
  ];

  const handleKeyPress = (k: string) => {
    setPressedKey(k);
    if (soundVibration) {
      PlatformBridge.performHapticFeedback('confirm');
    }
    if (k === 'DEL') {
      setTypedText((prev) => prev.slice(0, -1));
    } else if (k === 'SPACE') {
      setTypedText((prev) => prev + ' ');
    } else if (k === 'DONE') {
      setAppliedToast('Input submitted via on-device IME.');
      setTimeout(() => setAppliedToast(null), 2000);
    } else {
      setTypedText((prev) => prev + k);
    }
    setTimeout(() => setPressedKey(null), 140);
  };

  const handleApplyToSystemIme = () => {
    PlatformBridge.performHapticFeedback('confirm');
    const hapticMode: 'subtle' | 'medium' | 'firm' =
      hapticIntensity < 40 ? 'subtle' : hapticIntensity > 75 ? 'firm' : 'medium';
    KeyboardService.saveSettings({
      activeThemeId: selectedThemeId,
      hapticFeedback: soundVibration,
      hapticIntensity: hapticMode,
    });
    setAppliedToast('Keyboard applied to Android System IME (Default Input Method).');
    setTimeout(() => setAppliedToast(null), 3500);
  };

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
    ['?123', 'SPACE', 'DONE'],
  ];

  const activeThemeName = themesList.find((t) => t.id === selectedThemeId)?.name || 'Neon Glass';

  const getKeyRounding = () => {
    if (keyStyle === 'square') return 'rounded-md';
    if (keyStyle === 'pill') return 'rounded-full';
    return 'rounded-xl';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 text-white">
      {/* Toast */}
      {appliedToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#09132A]/95 border border-cyan-500/40 shadow-2xl px-4 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-xs text-slate-200 font-medium">{appliedToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <KeyboardIcon className="w-6 h-6 text-cyan-400" />
            Tactile Keyboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Privacy-first Android IME with zero cloud telemetry and sub-millisecond tactile haptics
          </p>
        </div>
      </div>

      {/* Interactive Tactile Keyboard Preview */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-blue-950/40 via-[#09132A] to-[#060D1F] border border-cyan-500/30 shadow-2xl space-y-4 backdrop-blur-md">
        {/* Typing Preview Display */}
        <div className="p-3.5 rounded-2xl bg-[#030712]/80 border border-cyan-500/20 flex items-center justify-between min-h-[48px] shadow-inner">
          <span className="text-xs sm:text-sm font-mono text-cyan-300">
            {typedText}
            <span className="animate-pulse">|</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Zero-Cloud IME</span>
        </div>

        {/* Keyboard Keys Frame */}
        <div className="space-y-1.5 pt-1">
          {keyboardRows.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
              {row.map((k) => {
                const isSpecial = k === 'DEL' || k === 'SPACE' || k === 'DONE' || k === '?123';
                const isPressed = pressedKey === k;
                return (
                  <button
                    key={k}
                    onClick={() => handleKeyPress(k)}
                    className={`h-10 sm:h-11 ${getKeyRounding()} text-xs sm:text-sm font-medium transition cursor-pointer select-none flex items-center justify-center active:scale-90 ${
                      k === 'SPACE'
                        ? 'flex-1 max-w-xs'
                        : isSpecial
                        ? 'px-3 text-[11px]'
                        : 'w-7 sm:w-9'
                    } ${
                      isPressed
                        ? 'bg-cyan-400 text-slate-950 scale-90 shadow-lg shadow-cyan-400/60'
                        : selectedThemeId === 'theme_neon_glass'
                        ? 'bg-[#0F1B3B]/80 hover:bg-[#162752] text-cyan-200 border border-cyan-500/30 shadow-sm'
                        : selectedThemeId === 'theme_oled_black'
                        ? 'bg-black hover:bg-neutral-900 text-white border border-white/20'
                        : selectedThemeId === 'theme_cyber_glow'
                        ? 'bg-[#062017]/80 hover:bg-[#0A3325] text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10'
                    }`}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs: Style | Colors | Effects */}
      <div className="flex items-center p-1 rounded-2xl bg-[#09132A]/80 border border-cyan-500/20 text-xs shadow-md">
        <button
          onClick={() => {
            PlatformBridge.performHapticFeedback('light');
            setActiveTab('style');
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold transition cursor-pointer text-center ${
            activeTab === 'style'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Style
        </button>
        <button
          onClick={() => {
            PlatformBridge.performHapticFeedback('light');
            setActiveTab('colors');
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold transition cursor-pointer text-center ${
            activeTab === 'colors'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Colors
        </button>
        <button
          onClick={() => {
            PlatformBridge.performHapticFeedback('light');
            setActiveTab('effects');
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold transition cursor-pointer text-center ${
            activeTab === 'effects'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Effects
        </button>
      </div>

      {/* Tab Content: Style */}
      {activeTab === 'style' && (
        <div className="rounded-3xl bg-[#09132A]/70 border border-cyan-500/20 divide-y divide-white/5 overflow-hidden shadow-lg backdrop-blur-md">
          {/* 1. Keyboard Theme */}
          <button
            type="button"
            onClick={() => {
              PlatformBridge.performHapticFeedback('light');
              setShowThemeModal(true);
            }}
            className="w-full text-left flex items-center justify-between p-4 hover:bg-white/[0.04] transition cursor-pointer group"
          >
            <div>
              <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors block">
                Keyboard Theme
              </span>
              <span className="text-[11px] text-slate-400">{activeThemeName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
              <span>Change</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
            </div>
          </button>

          {/* 2. Key Style */}
          <button
            type="button"
            onClick={() => {
              PlatformBridge.performHapticFeedback('light');
              setShowKeyStyleModal(true);
            }}
            className="w-full text-left flex items-center justify-between p-4 hover:bg-white/[0.04] transition cursor-pointer group"
          >
            <div>
              <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors block">
                Key Cap Contours
              </span>
              <span className="text-[11px] text-slate-400 capitalize">{keyStyle} shape</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
              <span>Change</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
            </div>
          </button>
        </div>
      )}

      {/* Tab Content: Colors */}
      {activeTab === 'colors' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#09132A]/70 border border-cyan-500/20 space-y-4 backdrop-blur-md shadow-lg">
          <div>
            <span className="text-xs font-bold text-white block">Key Glyph &amp; Glow Accent</span>
            <span className="text-[11px] text-slate-400">
              Select lighting hue for pressed keycaps and predictive ribbon
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { name: 'Electric Cyan', hex: '#06b6d4' },
              { name: 'OLED Emerald', hex: '#10b981' },
              { name: 'Cyber Violet', hex: '#a855f7' },
              { name: 'Hot Pink', hex: '#ec4899' },
              { name: 'Solar Amber', hex: '#f59e0b' },
              { name: 'Pure White', hex: '#ffffff' },
            ].map((c) => (
              <button
                type="button"
                key={c.hex}
                onClick={() => {
                  setAccentHue(c.hex);
                  PlatformBridge.performHapticFeedback('light');
                }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                  accentHue === c.hex
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-md'
                    : 'bg-[#060D1F] border-white/5 hover:border-white/15'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-lg border border-white/20 shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-xs font-medium truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Effects */}
      {activeTab === 'effects' && (
        <div className="rounded-3xl bg-[#09132A]/70 border border-cyan-500/20 divide-y divide-white/5 overflow-hidden shadow-lg backdrop-blur-md">
          {/* Sound & Vibration */}
          <div className="flex items-center justify-between p-4">
            <div>
              <span className="text-xs font-bold text-white block">Sound &amp; Tactile Clicks</span>
              <span className="text-[11px] text-slate-400">
                Localized sub-millisecond haptic feedback on keypress
              </span>
            </div>
            <button
              onClick={() => {
                setSoundVibration(!soundVibration);
                PlatformBridge.performHapticFeedback('light');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                soundVibration ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  soundVibration ? 'translate-x-6' : 'translate-x-0'
                } shadow-md`}
              />
            </button>
          </div>

          {/* Haptic Strength */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Haptic Pulse Intensity</span>
              <span className="font-mono text-cyan-400 font-semibold">{hapticIntensity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={hapticIntensity}
              onChange={(e) => setHapticIntensity(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Particle burst */}
          <div className="flex items-center justify-between p-4">
            <div>
              <span className="text-xs font-bold text-white block">Keypress Particle Aura</span>
              <span className="text-[11px] text-slate-400">
                Microscopic kinetic bloom radiating from tapped keys
              </span>
            </div>
            <button
              onClick={() => {
                setGlowParticleEffect(!glowParticleEffect);
                PlatformBridge.performHapticFeedback('light');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                glowParticleEffect ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  glowParticleEffect ? 'translate-x-6' : 'translate-x-0'
                } shadow-md`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Main Action Button */}
      <button
        type="button"
        onClick={handleApplyToSystemIme}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide transition cursor-pointer active:scale-98 shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
      >
        <Smartphone className="w-4 h-4" />
        <span>Apply to System IME</span>
      </button>

      {/* Privacy Guarantee Note */}
      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300 shadow-md">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>
          <strong>Rule 6 Privacy Guarantee:</strong> Zero-Cloud IME. Your typed text, passwords, and private dictionary remain strictly on your local device.
        </span>
      </div>

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#09132A] border border-cyan-500/30 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-cyan-500/15 pb-3">
              <h3 className="text-sm font-bold text-white">Select Keyboard Theme</h3>
              <button
                onClick={() => setShowThemeModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {themesList.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedThemeId(t.id);
                    PlatformBridge.performHapticFeedback('confirm');
                    setShowThemeModal(false);
                  }}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition cursor-pointer ${
                    selectedThemeId === t.id
                      ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-md'
                      : 'bg-[#060D1F] border-white/5 text-slate-300 hover:border-white/15'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{t.name}</span>
                    <span className="text-[10px] text-slate-400">{t.desc}</span>
                  </div>
                  {selectedThemeId === t.id && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Key Style Modal */}
      {showKeyStyleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#09132A] border border-cyan-500/30 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-cyan-500/15 pb-3">
              <h3 className="text-sm font-bold text-white">Select Key Cap Shape</h3>
              <button
                onClick={() => setShowKeyStyleModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['rounded', 'square', 'pill'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => {
                    setKeyStyle(style);
                    PlatformBridge.performHapticFeedback('confirm');
                    setShowKeyStyleModal(false);
                  }}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold capitalize border transition cursor-pointer text-center ${
                    keyStyle === style
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-md'
                      : 'bg-[#060D1F] text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
