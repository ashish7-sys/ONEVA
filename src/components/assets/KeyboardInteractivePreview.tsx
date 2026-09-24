import { useState } from 'react';
import {
  Keyboard,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Delete,
  CornerDownLeft,
  Settings,
} from 'lucide-react';
import { PlatformBridge } from '../../launcher/services/platformBridge';
import { OnevaAsset } from '../../types/adminAssets';
import { KeyboardService } from '../../services/keyboardService';

interface KeyboardInteractivePreviewProps {
  asset: OnevaAsset;
  onApplyBackground?: () => void;
}

export function KeyboardInteractivePreview({ asset, onApplyBackground }: KeyboardInteractivePreviewProps) {
  const [testText, setTestText] = useState('ONEVA tactile engine test');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isShiftActive, setIsShiftActive] = useState(false);

  const isImeSelected = PlatformBridge.isKeyboardImeSelected();
  const isImeEnabled = PlatformBridge.isKeyboardImeEnabled();

  const handleKeyPress = (key: string) => {
    PlatformBridge.performHapticFeedback('selection');
    setActiveKey(key);
    setTimeout(() => setActiveKey(null), 150);

    if (key === 'BACKSPACE') {
      setTestText((prev) => prev.slice(0, -1));
    } else if (key === 'SPACE') {
      setTestText((prev) => prev + ' ');
    } else if (key === 'ENTER') {
      setTestText((prev) => prev + '\n');
    } else if (key === 'SHIFT') {
      setIsShiftActive(!isShiftActive);
    } else {
      const char = isShiftActive ? key.toUpperCase() : key.toLowerCase();
      setTestText((prev) => prev + char);
    }
  };

  const backgroundStyle =
    asset.previewData?.previewDataUrl
      ? `url(${asset.previewData.previewDataUrl}) center/cover no-repeat`
      : asset.previewData?.cssBackground ||
        (asset.previewData?.color
          ? `radial-gradient(circle at 50% 30%, ${asset.previewData.color}35 0%, #060913 85%, #000000 100%)`
          : 'linear-gradient(180deg, #0f172a 0%, #030712 100%)');

  const accentColor = asset.previewData?.color || '#06b6d4';

  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center p-3 sm:p-4 space-y-4">
      {/* IME Integration & Privacy Status Card */}
      <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Keyboard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span>Android InputMethodService</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Zero Cloud
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">
              {isImeSelected
                ? 'Active system keyboard on this device'
                : 'Registered Android IME component'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => PlatformBridge.openKeyboardImeSettings()}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-mono flex items-center gap-1 transition"
            title="Open Android Language & Input Settings"
          >
            <Settings className="w-3 h-3 text-neutral-300" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button
            type="button"
            onClick={() => PlatformBridge.showKeyboardImePicker()}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono flex items-center gap-1 transition"
            title="Switch system input method picker"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Switch IME</span>
          </button>
        </div>
      </div>

      {/* Live Test Input Field */}
      <div className="w-full relative">
        <div className="w-full p-3 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-inner flex items-center gap-2 text-xs">
          <span className="text-[10px] font-mono text-neutral-500 uppercase shrink-0">Test Field:</span>
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Type or tap keyboard below..."
            className="w-full bg-transparent text-white font-mono text-xs focus:outline-none placeholder-neutral-600"
          />
          {testText && (
            <button
              type="button"
              onClick={() => setTestText('')}
              className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 px-1.5 py-0.5 rounded bg-white/5"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Keyboard Stage Phone Simulation */}
      <div
        className="w-full rounded-3xl border border-white/15 overflow-hidden shadow-2xl relative p-3 sm:p-5 flex flex-col justify-between"
        style={{
          background: backgroundStyle,
          minHeight: '300px',
        }}
      >
        {/* Top Header Bar / Suggestion Strip */}
        <div className="w-full flex items-center justify-between pb-3 px-1 border-b border-white/10 text-[11px] font-mono text-neutral-300">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {['ONEVA', 'tactile', 'futuristic', 'secure', 'offline'].map((word, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTestText((prev) => prev + ' ' + word)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-neutral-200 transition text-[10px]"
              >
                {word}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-[9px] text-neutral-400 uppercase font-mono">Tactile</span>
          </div>
        </div>

        {/* Keyboard Keycap Rows */}
        <div className="w-full space-y-1.5 pt-3">
          {/* Row 1 */}
          <div className="flex justify-center gap-1 sm:gap-1.5">
            {rows[0].map((key) => {
              const isActive = activeKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeyPress(key)}
                  className={`flex-1 max-w-[42px] h-11 sm:h-12 rounded-xl flex items-center justify-center font-mono font-medium text-xs transition-all select-none shadow-md ${
                    isActive
                      ? 'scale-95 bg-cyan-400 text-black font-bold shadow-cyan-500/50'
                      : 'bg-black/60 hover:bg-black/40 border border-white/15 text-white backdrop-blur-md'
                  }`}
                  style={
                    !isActive && asset.previewData?.keyBg
                      ? { backgroundColor: asset.previewData.keyBg }
                      : undefined
                  }
                >
                  {isShiftActive ? key.toUpperCase() : key.toLowerCase()}
                </button>
              );
            })}
          </div>

          {/* Row 2 */}
          <div className="flex justify-center gap-1 sm:gap-1.5 px-3">
            {rows[1].map((key) => {
              const isActive = activeKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeyPress(key)}
                  className={`flex-1 max-w-[42px] h-11 sm:h-12 rounded-xl flex items-center justify-center font-mono font-medium text-xs transition-all select-none shadow-md ${
                    isActive
                      ? 'scale-95 bg-cyan-400 text-black font-bold shadow-cyan-500/50'
                      : 'bg-black/60 hover:bg-black/40 border border-white/15 text-white backdrop-blur-md'
                  }`}
                  style={
                    !isActive && asset.previewData?.keyBg
                      ? { backgroundColor: asset.previewData.keyBg }
                      : undefined
                  }
                >
                  {isShiftActive ? key.toUpperCase() : key.toLowerCase()}
                </button>
              );
            })}
          </div>

          {/* Row 3 with Shift and Backspace */}
          <div className="flex justify-center gap-1 sm:gap-1.5">
            {/* Shift */}
            <button
              type="button"
              onClick={() => handleKeyPress('SHIFT')}
              className={`w-11 sm:w-12 h-11 sm:h-12 rounded-xl flex items-center justify-center transition-all select-none text-[11px] font-mono border ${
                isShiftActive
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                  : 'bg-black/70 border-white/15 text-neutral-300 hover:bg-black/50'
              }`}
            >
              ⇧
            </button>

            {rows[2].map((key) => {
              const isActive = activeKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeyPress(key)}
                  className={`flex-1 max-w-[42px] h-11 sm:h-12 rounded-xl flex items-center justify-center font-mono font-medium text-xs transition-all select-none shadow-md ${
                    isActive
                      ? 'scale-95 bg-cyan-400 text-black font-bold shadow-cyan-500/50'
                      : 'bg-black/60 hover:bg-black/40 border border-white/15 text-white backdrop-blur-md'
                  }`}
                  style={
                    !isActive && asset.previewData?.keyBg
                      ? { backgroundColor: asset.previewData.keyBg }
                      : undefined
                  }
                >
                  {isShiftActive ? key.toUpperCase() : key.toLowerCase()}
                </button>
              );
            })}

            {/* Backspace */}
            <button
              type="button"
              onClick={() => handleKeyPress('BACKSPACE')}
              className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl flex items-center justify-center bg-black/70 hover:bg-black/50 border border-white/15 text-neutral-300 transition-all select-none shadow-md active:scale-95"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {/* Row 4: Space, Enter, Emoji */}
          <div className="flex justify-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleKeyPress('?123')}
              className="w-12 h-11 rounded-xl bg-black/70 border border-white/15 text-neutral-300 text-[11px] font-mono flex items-center justify-center"
            >
              ?123
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress('SPACE')}
              className="flex-1 h-11 rounded-xl bg-black/50 hover:bg-black/30 border border-white/20 text-neutral-300 text-xs font-mono flex items-center justify-center shadow-inner active:scale-98 transition backdrop-blur-md"
            >
              <span className="text-[10px] text-neutral-400 font-sans tracking-widest uppercase">
                ONEVA IME
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress('ENTER')}
              className="w-16 h-11 rounded-xl flex items-center justify-center text-xs font-bold font-mono transition active:scale-95 shadow-lg"
              style={{
                backgroundColor: accentColor,
                color: '#000000',
              }}
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer info pill */}
        <div className="w-full flex items-center justify-between pt-3 text-[10px] font-mono text-neutral-400 border-t border-white/10 mt-3">
          <span>Haptic: Micro-actuator</span>
          <span>Offline Prediction Active</span>
        </div>
      </div>
    </div>
  );
}
