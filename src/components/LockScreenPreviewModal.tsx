import { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Check,
  Sparkles,
  Clock,
  Battery,
  Camera,
  Shield,
  Zap,
  Sliders,
  Bell,
  Fingerprint,
} from 'lucide-react';
import { PlatformBridge } from '../launcher/services/platformBridge';

interface LockScreenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
  themeName?: string;
}

export type ClockStyleId = 'digital_glow' | 'cyber_dual' | 'minimal_bold' | 'analog_neon';

export function LockScreenPreviewModal({
  isOpen,
  onClose,
  accentColor = '#06b6d4',
  themeName = 'ONEVA Theme',
}: LockScreenPreviewModalProps) {
  const [clockStyle, setClockStyle] = useState<ClockStyleId>('digital_glow');
  const [selectedColor, setSelectedColor] = useState<string>(accentColor);
  const [aodEnabled, setAodEnabled] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('10:42');
  const [currentDate, setCurrentDate] = useState<string>('Sunday, Sep 20');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setCurrentDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const clockStyles: { id: ClockStyleId; name: string; desc: string }[] = [
    { id: 'digital_glow', name: 'Digital Glow', desc: 'Futuristic luminescent numbers' },
    { id: 'cyber_dual', name: 'Cyber Stack', desc: 'Vertical hour / minute typography' },
    { id: 'minimal_bold', name: 'Minimalist Bold', desc: 'High-contrast clean geometry' },
    { id: 'analog_neon', name: 'Radial Dial', desc: 'Futuristic circular indicator' },
  ];

  const colorOptions = [
    { name: 'Cyan Glow', hex: '#06b6d4' },
    { name: 'Electric Violet', hex: '#a855f7' },
    { name: 'OLED Emerald', hex: '#10b981' },
    { name: 'Sunset Pink', hex: '#ec4899' },
    { name: 'Solar Amber', hex: '#f59e0b' },
    { name: 'Pure White', hex: '#f8fafc' },
  ];

  const handleApplyLockScreen = () => {
    PlatformBridge.performHapticFeedback('confirm');
    try {
      localStorage.setItem(
        'oneva_lock_screen_config',
        JSON.stringify({
          style: clockStyle,
          color: selectedColor,
          aodEnabled,
          updatedAt: Date.now(),
        })
      );
    } catch (e) {
      // storage safe
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#09132A] border border-cyan-500/30 shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/15 flex items-center justify-between bg-[#060D1F]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Lock Screen &amp; Glow Clock
              </h2>
              <p className="text-[11px] text-slate-400">
                Customizes Always-On Display and Android lock surface
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Real Phone Lock Screen Preview Frame */}
          <div className="relative mx-auto w-64 h-96 rounded-[36px] bg-[#030712] border-4 border-slate-700/80 shadow-2xl overflow-hidden flex flex-col justify-between p-4 select-none">
            {/* Ambient Background Aura */}
            <div
              className="absolute inset-0 opacity-25 blur-2xl pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${selectedColor} 0%, transparent 70%)`,
              }}
            />

            {/* Status Bar */}
            <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 font-mono px-2 pt-1">
              <span>ONEVA</span>
              <div className="flex items-center gap-1.5">
                <span>94%</span>
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {/* Lock Screen Clock Display */}
            <div className="relative z-10 text-center my-auto">
              {clockStyle === 'digital_glow' && (
                <div>
                  <div
                    className="text-5xl font-black tracking-tight drop-shadow-md font-mono"
                    style={{
                      color: selectedColor,
                      textShadow: `0 0 24px ${selectedColor}70, 0 0 40px ${selectedColor}30`,
                    }}
                  >
                    {currentTime}
                  </div>
                  <div className="text-xs text-slate-300 font-medium mt-1 tracking-wide">
                    {currentDate}
                  </div>
                </div>
              )}

              {clockStyle === 'cyber_dual' && (
                <div className="flex flex-col items-center">
                  <div
                    className="text-4xl font-extrabold leading-none tracking-wider font-mono text-white"
                    style={{ textShadow: `0 0 16px ${selectedColor}50` }}
                  >
                    {currentTime.split(':')[0]}
                  </div>
                  <div
                    className="text-4xl font-extrabold leading-none tracking-wider font-mono"
                    style={{ color: selectedColor, textShadow: `0 0 20px ${selectedColor}80` }}
                  >
                    {currentTime.split(':')[1]}
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium mt-1.5 tracking-wider uppercase font-mono">
                    {currentDate}
                  </div>
                </div>
              )}

              {clockStyle === 'minimal_bold' && (
                <div>
                  <div className="text-4xl font-light tracking-tight text-white">
                    {currentTime}
                  </div>
                  <div
                    className="text-xs font-semibold tracking-wider uppercase mt-1"
                    style={{ color: selectedColor }}
                  >
                    {currentDate}
                  </div>
                </div>
              )}

              {clockStyle === 'analog_neon' && (
                <div className="flex flex-col items-center">
                  <div
                    className="w-24 h-24 rounded-full border-2 flex items-center justify-center relative shadow-lg"
                    style={{ borderColor: selectedColor, boxShadow: `0 0 20px ${selectedColor}40` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white absolute" />
                    <div
                      className="w-1 h-8 rounded-full absolute top-4 origin-bottom"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <div className="w-0.5 h-10 rounded-full bg-white absolute top-2 origin-bottom rotate-45" />
                  </div>
                  <span className="text-xs font-mono text-slate-300 mt-2">{currentTime}</span>
                </div>
              )}

              {/* Notification Pill */}
              <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 inline-flex items-center gap-2 text-[10px] text-slate-300 backdrop-blur-md">
                <Bell className="w-3 h-3 text-cyan-400" />
                <span>2 notifications &bull; WhatsApp, JARVIS</span>
              </div>
            </div>

            {/* Bottom Shortcuts */}
            <div className="relative z-10 flex items-center justify-between px-2 pb-1">
              <div className="w-9 h-9 rounded-full bg-slate-900/80 border border-white/10 flex items-center justify-center text-slate-300">
                <Camera className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-cyan-400 animate-pulse">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-900/80 border border-white/10 flex items-center justify-center text-slate-300">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Clock Style Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Clock Typography Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {clockStyles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setClockStyle(s.id);
                    PlatformBridge.performHapticFeedback('light');
                  }}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    clockStyle === s.id
                      ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold block">{s.name}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Glow Color Swatches */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Glow Accent Color
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {colorOptions.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    setSelectedColor(c.hex);
                    PlatformBridge.performHapticFeedback('light');
                  }}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center transition cursor-pointer border ${
                    selectedColor === c.hex
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-white/10 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {selectedColor === c.hex && (
                    <Check className="w-4 h-4 text-slate-950 font-bold" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* AOD Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#060D1F] border border-cyan-500/15 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Always-On-Display (AOD) Mode</span>
              <span className="text-[11px] text-slate-400">
                Low-power ambient clock with sub-pixel shutoff on OLED
              </span>
            </div>
            <button
              onClick={() => setAodEnabled(!aodEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                aodEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  aodEnabled ? 'translate-x-6' : 'translate-x-0'
                } shadow-md`}
              />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-cyan-500/15 bg-[#060D1F] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyLockScreen}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer active:scale-95 shadow-lg flex items-center gap-1.5 ${
              isSaved
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isSaved ? 'Lock Screen Applied!' : 'Apply to Lock Screen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
