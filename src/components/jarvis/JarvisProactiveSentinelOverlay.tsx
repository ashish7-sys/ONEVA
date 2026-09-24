/**
 * ONEVA JARVIS Floating Speech & Warning HUD Bar
 * 
 * Implements:
 * 1. Global "Stop Speech" button whenever Jarvis is speaking
 * 2. Proactive Warning HUD box with "Say it" button:
 *    - Rule 1: Only appears when awake
 *    - Rule 2: Only vocalizes when user clicks "Say it" or commands "Say it"
 * 3. Normal commands show ONLY "Stop Speech" while Jarvis speaks
 * 4. Styled with thick fade-white borders and multi-color breathing neon glows
 */

import { useState, useEffect } from 'react';
import {
  Volume2,
  Square,
  AlertTriangle,
  X,
} from 'lucide-react';
import { JarvisProactiveSentinelService } from '../../services/sentinel/jarvisProactiveSentinelService';
import { JarvisProactiveAlert } from '../../types/jarvisSentinel';
import { JarvisTtsEngine } from '../../services/voice/jarvisTtsEngine';
import { JarvisVoiceService } from '../../services/jarvisVoiceService';

export function JarvisProactiveSentinelOverlay() {
  const [alerts, setAlerts] = useState<JarvisProactiveAlert[]>([]);
  const [isAwake, setIsAwake] = useState<boolean>(() => JarvisVoiceService.isAwake());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(() => JarvisTtsEngine.getIsSpeaking());
  const [spokenText, setSpokenText] = useState<string>(() => JarvisTtsEngine.getCurrentlySpeakingText());

  useEffect(() => {
    JarvisProactiveSentinelService.init();
    setAlerts(JarvisProactiveSentinelService.getActiveAlerts());

    const unsubSentinel = JarvisProactiveSentinelService.subscribe(() => {
      setAlerts(JarvisProactiveSentinelService.getActiveAlerts());
    });

    const unsubVoice = JarvisVoiceService.subscribe(() => {
      setIsAwake(JarvisVoiceService.isAwake());
    });

    const unsubTtsStart = JarvisTtsEngine.onSpeechStart(() => {
      setIsSpeaking(true);
      setSpokenText(JarvisTtsEngine.getCurrentlySpeakingText());
    });

    const unsubTtsEnd = JarvisTtsEngine.onSpeechEnd(() => {
      setIsSpeaking(false);
      setSpokenText('');
    });

    const unsubTtsInterrupt = JarvisTtsEngine.onSpeechInterrupt(() => {
      setIsSpeaking(false);
      setSpokenText('');
    });

    const unsubTtsSub = JarvisTtsEngine.subscribe(() => {
      const speaking = JarvisTtsEngine.getIsSpeaking();
      setIsSpeaking(speaking);
      if (speaking) {
        setSpokenText(JarvisTtsEngine.getCurrentlySpeakingText());
      }
    });

    return () => {
      unsubSentinel();
      unsubVoice();
      unsubTtsStart();
      unsubTtsEnd();
      unsubTtsInterrupt();
      unsubTtsSub();
    };
  }, []);

  const handleStopSpeech = () => {
    JarvisVoiceService.interrupt();
    JarvisTtsEngine.interrupt('user_requested_stop');
    setIsSpeaking(false);
    setSpokenText('');
  };

  const handleSayWarning = (alertId: string) => {
    // Rule 2: vocalize only when user clicks 'Say it'
    JarvisProactiveSentinelService.speakAlert(alertId);
  };

  const handleDismissWarning = (alertId: string) => {
    JarvisProactiveSentinelService.dismissAlert(alertId);
  };

  // 1. If currently speaking (either from a normal command or after clicking 'Say it'):
  // Show global "Stop Speech" floating bar at the top!
  if (isSpeaking) {
    return (
      <aside
        id="jarvis-speech-active-hud"
        aria-label="Jarvis Speech Active"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-neutral-950/95 border-2 border-white/30 shadow-2xl backdrop-blur-xl animate-fade-in transition-all"
        style={{
          boxShadow: '0 0 25px rgba(255, 255, 255, 0.12), 0 12px 32px rgba(0, 0, 0, 0.85)',
        }}
      >
        {/* Holographic Voice Pulsing Wave */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border-2 border-white/20 flex items-center justify-center">
            <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1 h-3.5 bg-cyan-400 rounded-full animate-pulse" />
            <span className="w-1 h-5 bg-emerald-400 rounded-full animate-pulse [animation-delay:150ms]" />
            <span className="w-1 h-2.5 bg-pink-400 rounded-full animate-pulse [animation-delay:300ms]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-mono font-bold text-white tracking-wider uppercase">
              Jarvis Speaking
            </span>
            {spokenText && (
              <span className="text-[10px] text-neutral-400 max-w-[180px] sm:max-w-[280px] truncate">
                {spokenText}
              </span>
            )}
          </div>
        </div>

        {/* Thick fade-white border Stop Speech Button */}
        <button
          id="jarvis-stop-speech-btn"
          onClick={handleStopSpeech}
          className="ml-2 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-2 border-white/30 hover:border-white/50 text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-lg shadow-rose-950/50"
          title="Stop Speech Immediately"
        >
          <Square className="w-3 h-3 fill-current text-rose-400" />
          <span>Stop Speech</span>
        </button>
      </aside>
    );
  }

  // 2. Proactive Warning System:
  // Rule 1: Only appears when awake
  // Rule 2: Vocalize ONLY after user clicks "Say it" (or asks him to say it via voice)
  const config = JarvisProactiveSentinelService.getConfig();
  const shouldShowWarning = alerts.length > 0 && (config.onlyInformWhenAwake === false || isAwake);

  if (shouldShowWarning) {
    const currentAlert = alerts[0];

    return (
      <aside
        id="jarvis-proactive-warning-hud"
        aria-label="Jarvis Warning"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-neutral-950/95 border-2 border-white/25 hover:border-white/40 shadow-2xl backdrop-blur-xl animate-fade-in transition-all"
        style={{
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.2), 0 12px 32px rgba(0, 0, 0, 0.85)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border-2 border-white/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase">
                Warning
              </span>
              <span className="text-xs font-semibold text-neutral-200 max-w-[170px] sm:max-w-[260px] truncate">
                {currentAlert.title}
              </span>
            </div>
          </div>
        </div>

        {/* Say it Button */}
        <button
          id="jarvis-warning-say-it-btn"
          onClick={() => handleSayWarning(currentAlert.id)}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 border-2 border-white/30 hover:border-white/50 text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-amber-950/50"
          title="Hear Warning"
        >
          <Volume2 className="w-3.5 h-3.5 text-neutral-950" />
          <span>Say it</span>
        </button>

        {/* Dismiss Button */}
        <button
          onClick={() => handleDismissWarning(currentAlert.id)}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  return null;
}
