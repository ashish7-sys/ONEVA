import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  User,
  Sliders,
  Square,
  Play,
  Check,
  Shield,
  WifiOff,
  Sparkles,
  RefreshCw,
  X,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import {
  JarvisAddressMode,
  JarvisPersonalityPreferences,
  JarvisPersonalityStyle,
  JarvisTtsVoiceInfo,
  JarvisVoiceStatusPhase19,
  JarvisVoiceGender,
} from '../../types/jarvisPersonality';
import { JarvisPersonalityEngine } from '../../services/intelligence/jarvisPersonalityEngine';
import { JarvisTtsEngine } from '../../services/voice/jarvisTtsEngine';
import { JarvisVoiceService } from '../../services/jarvisVoiceService';
import { OwnerAuthService } from '../../services/memory/ownerAuthService';
import { JarvisProactiveSentinelService } from '../../services/sentinel/jarvisProactiveSentinelService';

interface JarvisVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JarvisVoiceSettingsModal: React.FC<JarvisVoiceSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [preferences, setPreferences] = useState<JarvisPersonalityPreferences>(
    JarvisPersonalityEngine.getPreferences()
  );
  const [voices, setVoices] = useState<JarvisTtsVoiceInfo[]>([]);
  const [voiceStatus, setVoiceStatus] = useState<JarvisVoiceStatusPhase19>(
    JarvisTtsEngine.getStatus()
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(JarvisTtsEngine.getIsSpeaking());
  const [customNameInput, setCustomNameInput] = useState<string>(
    preferences.customAddressName || 'Sir'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeActor = OwnerAuthService.getActiveActor();
  const isTtsSupported = JarvisTtsEngine.isSupported();

  const activeResolvedVoice = isTtsSupported
    ? JarvisTtsEngine.resolveVoice(
        preferences.selectedVoiceURI,
        preferences.language === 'auto' ? 'en' : preferences.language,
        preferences.voiceGender || 'male'
      )
    : null;

  useEffect(() => {
    if (!isOpen) return;

    // Load preferences
    const currentPrefs = JarvisPersonalityEngine.getPreferences();
    setPreferences(currentPrefs);
    setCustomNameInput(currentPrefs.customAddressName || 'Sir');

    // Refresh voices
    setVoices(JarvisTtsEngine.getVoices());

    // Subscribe to status & preferences
    const unsubEngine = JarvisTtsEngine.subscribe(() => {
      setVoiceStatus(JarvisTtsEngine.getStatus());
      setIsSpeaking(JarvisTtsEngine.getIsSpeaking());
    });

    const unsubPrefs = JarvisPersonalityEngine.subscribe(() => {
      const p = JarvisPersonalityEngine.getPreferences();
      setPreferences(p);
      setCustomNameInput(p.customAddressName || 'Sir');
    });

    return () => {
      unsubEngine();
      unsubPrefs();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUpdate = (updates: Partial<JarvisPersonalityPreferences>) => {
    JarvisPersonalityEngine.savePreferences(updates);
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const handleAddressModeChange = (mode: JarvisAddressMode) => {
    handleUpdate({ addressMode: mode });
    showToast(`Addressing set to ${mode.toUpperCase()}`);
  };

  const handleSaveCustomName = () => {
    const trimmed = customNameInput.trim();
    if (trimmed) {
      handleUpdate({ addressMode: 'custom', customAddressName: trimmed });
      showToast(`Custom name saved: "${trimmed}"`);
    }
  };

  const handleStyleChange = (style: JarvisPersonalityStyle) => {
    handleUpdate({ personalityStyle: style });
    showToast(`Style updated: ${style}`);
  };

  const handleTestSpeech = () => {
    if (isSpeaking) {
      JarvisVoiceService.interrupt();
      showToast('Speech interrupted');
      return;
    }

    const title = JarvisPersonalityEngine.resolveAddress(true);
    let sampleText = `Hello${title ? ` ${title}` : ''}. I am JARVIS, your personal AI assistant. System diagnostics are optimal and all modules are ready.`;
    if (preferences.language === 'hi') {
      sampleText = `Namaste${title ? ` ${title}` : ''}. Main JARVIS hoon, aapka personal AI assistant. Sabhi systems tayar hain.`;
    }

    const res = JarvisVoiceService.speakText(sampleText, preferences.language);
    if (!res.success) {
      showToast(res.reason || 'Could not play speech sample');
    }
  };

  const handleStopSpeech = () => {
    JarvisVoiceService.interrupt();
    showToast('Speech stopped');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-neutral-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">JARVIS Voice & Personality</h2>
              <p className="text-xs text-neutral-400">Phase 19 Premium Synthesis & Cadence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Status Banner */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                voiceStatus === 'SPEAKING'
                  ? 'bg-emerald-400 animate-ping'
                  : voiceStatus === 'THINKING'
                  ? 'bg-purple-400 animate-pulse'
                  : voiceStatus === 'EXECUTING'
                  ? 'bg-amber-400 animate-spin'
                  : voiceStatus === 'LISTENING'
                  ? 'bg-cyan-400 animate-pulse'
                  : voiceStatus === 'ERROR'
                  ? 'bg-red-400'
                  : 'bg-emerald-500'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                  Status: {voiceStatus}
                </span>
                {isSpeaking && (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-emerald-400 animate-pulse rounded-full" />
                    <span className="w-1 h-5 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                    <span className="w-1 h-2 bg-emerald-400 animate-pulse delay-150 rounded-full" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                {isSpeaking
                  ? 'Speaking response with natural cadence'
                  : 'Ready for voice wake or tap interaction'}
              </p>
            </div>
          </div>

          {isSpeaking && (
            <button
              onClick={handleStopSpeech}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-semibold cursor-pointer active:scale-95 transition"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}
        </div>

        {/* Voice Enable Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-3">
            {preferences.voiceEnabled ? (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-neutral-400" />
            )}
            <div>
              <div className="text-sm font-semibold text-white">Voice Audio Output</div>
              <p className="text-xs text-neutral-400">Read responses aloud via device TTS</p>
            </div>
          </div>
          <button
            onClick={() => handleUpdate({ voiceEnabled: !preferences.voiceEnabled })}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              preferences.voiceEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                preferences.voiceEnabled ? 'translate-x-6' : 'translate-x-1'
              } top-0.5 absolute`}
            />
          </button>
        </div>

        {/* Quick Voice Gender Switcher (User Mandate) */}
        <div className="p-4 rounded-2xl bg-white/5 border-2 border-white/20 hover:border-white/30 space-y-3 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border-2 ${
                  (preferences.voiceGender || 'male') === 'male'
                    ? 'bg-blue-500/20 text-blue-300 border-white/25'
                    : 'bg-pink-500/20 text-pink-300 border-white/25'
                }`}
              >
                {(preferences.voiceGender || 'male') === 'male' ? '♂' : '♀'}
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                  <span>Voice Profile: {(preferences.voiceGender || 'male') === 'male' ? 'Male (Deep & Confident)' : 'Female (Lovely & Confident)'}</span>
                  {activeResolvedVoice && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-sans normal-case border border-emerald-500/30">
                      Active: {activeResolvedVoice.name}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  {(preferences.voiceGender || 'male') === 'male'
                    ? '0.9x speed, deep resonant tone, pleasure-focused acoustic warmth'
                    : '0.9x speed, lovely melodic tone, confident & pleasant delivery'}
                </p>
              </div>
            </div>

            {/* Change Voice Button with thick fade-white border */}
            <button
              id="jarvis-toggle-voice-gender-btn"
              onClick={() => {
                const next: JarvisVoiceGender = (preferences.voiceGender || 'male') === 'male' ? 'female' : 'male';
                handleUpdate({
                  voiceGender: next,
                  speechPitch: next === 'male' ? 0.88 : 1.08,
                  speechRate: 0.9,
                });
                showToast(next === 'male' ? 'Switched to Male Voice (Deep, 0.9x)' : 'Switched to Female Voice (Lovely, 0.9x)');
              }}
              className={`px-3 py-1.5 rounded-xl border-2 border-white/30 hover:border-white/50 text-xs font-mono font-bold cursor-pointer transition active:scale-95 shadow-md ${
                (preferences.voiceGender || 'male') === 'male'
                  ? 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 shadow-pink-950/40'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 shadow-blue-950/40'
              }`}
            >
              {(preferences.voiceGender || 'male') === 'male' ? 'Change Voice to Female' : 'Change Voice to Male'}
            </button>
          </div>
        </div>

        {/* Language Selection (User Mandate: default English, switchable to Hindi) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Spoken Language (Language Switching)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'en', label: 'English', desc: 'Default Global' },
              { id: 'hi', label: 'Hindi', desc: 'हिंदी बातचीत' },
              { id: 'auto', label: 'Auto Detect', desc: 'Match Query' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => {
                  handleUpdate({ language: lang.id as 'en' | 'hi' | 'auto' });
                  showToast(`Language set to ${lang.label}`);
                }}
                className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${
                  preferences.language === lang.id
                    ? 'bg-emerald-500/20 border-white/40 text-emerald-300 shadow-md shadow-emerald-950/40'
                    : 'bg-white/5 border-white/15 text-neutral-400 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold">{lang.label}</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">{lang.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Addressing Mode */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Preferred Address</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['sir', 'maam', 'neutral', 'custom'] as JarvisAddressMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleAddressModeChange(mode)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer capitalize ${
                  preferences.addressMode === mode
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/40'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                }`}
              >
                {mode === 'maam' ? "Ma'am" : mode}
              </button>
            ))}
          </div>

          {preferences.addressMode === 'custom' && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={customNameInput}
                onChange={(e) => setCustomNameInput(e.target.value)}
                placeholder="Enter custom title or name..."
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={handleSaveCustomName}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold transition cursor-pointer"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Personality Response Style */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Personality Tone</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'concise', label: 'Concise', desc: 'Minimal & direct' },
              { id: 'balanced', label: 'Balanced', desc: 'Natural & polite' },
              { id: 'detailed', label: 'Detailed', desc: 'Context & depth' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => handleStyleChange(st.id as JarvisPersonalityStyle)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  preferences.personalityStyle === st.id
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/40'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold capitalize">{st.label}</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">{st.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* TTS Device Voice Picker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
            <span>Compatible Device Voice</span>
            <button
              onClick={() => setVoices(JarvisTtsEngine.refreshVoices())}
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Voices</span>
            </button>
          </div>

          <select
            value={preferences.selectedVoiceURI}
            onChange={(e) => handleUpdate({ selectedVoiceURI: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="auto">
              Auto (Best {(preferences.voiceGender || 'male') === 'male' ? 'Male' : 'Female'} Voice
              {activeResolvedVoice ? ` - ${activeResolvedVoice.name}` : ''})
            </option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Speech Controls: Rate & Pitch */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span>Speech Rate</span>
              <span className="font-mono text-[11px] text-emerald-400">{preferences.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.05"
              value={preferences.speechRate}
              onChange={(e) => handleUpdate({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span>Pitch</span>
              <span className="font-mono text-[11px] text-emerald-400">{preferences.speechPitch}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={preferences.speechPitch}
              onChange={(e) => handleUpdate({ speechPitch: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Proactive Warning Test Section */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs font-mono font-bold text-amber-300">Test Proactive Warning System</div>
              <p className="text-[10px] text-neutral-400">Pops top &quot;Warning - [Say it]&quot; box (Rule 1 &amp; Rule 2)</p>
            </div>
          </div>
          <button
            id="jarvis-trigger-warning-test-btn"
            onClick={() => {
              JarvisProactiveSentinelService.triggerDiagnosticWarning();
              showToast('Proactive warning surfaced! Check top warning box.');
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-2 border-white/30 hover:border-white/50 text-xs font-mono font-bold cursor-pointer transition active:scale-95"
          >
            Trigger Warning
          </button>
        </div>

        {/* Privacy & Offline Badges */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
          <div className="flex items-center gap-1 text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Zero Audio Telemetry</span>
          </div>
          <div className="flex items-center gap-1 text-neutral-400">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Local TTS Ready</span>
          </div>
          <div>
            <span>Actor: {activeActor?.displayName || 'Owner'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleTestSpeech}
            disabled={!preferences.voiceEnabled || !isTtsSupported}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border-2 transition cursor-pointer ${
              isSpeaking
                ? 'bg-red-500/20 text-red-300 border-white/40 hover:bg-red-500/30 shadow-lg shadow-red-950/40'
                : 'bg-emerald-500/20 text-emerald-300 border-white/30 hover:border-white/50 hover:bg-emerald-500/30 shadow-lg shadow-emerald-950/40'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSpeaking ? 'Stop Sample' : 'Speak Sample'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border-2 border-white/25 hover:border-white/40 transition cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="text-center text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 py-1.5 px-3 rounded-xl animate-fade-in">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};
