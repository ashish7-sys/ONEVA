/**
 * ONEVA JARVIS Real Screen-Off & Lock-Screen Wake Simulator
 * 
 * Demonstrates and verifies genuine lock-screen wake capability:
 * - High-tech OLED pitch-black Always-On Display (AOD) / Lockscreen
 * - Continuous background microphone listener active while screen is "off/locked"
 * - Reactive Arc-Reactor acoustic ripple rings
 * - Immediate unlock & HUD launch upon wake word ("Jarvis", "Friday", etc.)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mic, BatteryCharging, Wifi, Sparkles, X, Volume2, ShieldCheck, Power } from 'lucide-react';
import { JarvisVoiceService } from '../services/jarvisVoiceService';
import { BackgroundWakeManager } from '../services/onevaBackgroundWakeManager';
import { AudioEffects } from '../services/voice/audioSoundEffects';

interface OnevaLockScreenWakeSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnevaLockScreenWakeSimulator: React.FC<OnevaLockScreenWakeSimulatorProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [detectedWord, setDetectedWord] = useState<string | null>(null);
  const [wakeStatus, setWakeStatus] = useState(BackgroundWakeManager.getStatus());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsWakingUp(false);
      setDetectedWord(null);
      return;
    }

    // Inform wake manager that simulator is active
    BackgroundWakeManager.setLockScreenSimulated(true);

    // Subscribe to background wake events
    const unsub = BackgroundWakeManager.subscribe(() => {
      setWakeStatus(BackgroundWakeManager.getStatus());
    });

    const handleWakeDetected = (e: CustomEvent<{ wakeName: string }>) => {
      triggerUnlockSequence(e.detail?.wakeName || 'Jarvis');
    };

    window.addEventListener('oneva-background-wake-detected', handleWakeDetected as EventListener);

    return () => {
      window.removeEventListener('oneva-background-wake-detected', handleWakeDetected as EventListener);
      unsub();
      BackgroundWakeManager.setLockScreenSimulated(false);
    };
  }, [isOpen]);

  const triggerUnlockSequence = (word: string) => {
    setIsWakingUp(true);
    setDetectedWord(word);

    // Audio & haptic cue
    AudioEffects.playJarvisWakeChime();
    AudioEffects.triggerHapticPulse([100, 60, 150]);

    setTimeout(() => {
      onClose();
      JarvisVoiceService.wakeFromBackground(word);
    }, 1200);
  };

  const handleSimulateSpeech = (phrase: string) => {
    // Inject directly into Jarvis voice simulation
    JarvisVoiceService.simulateSpeechInput(phrase);
    const word = phrase.split(/[\s,]+/)[0];
    triggerUnlockSequence(word || 'Jarvis');
  };

  if (!isOpen) return null;

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <AnimatePresence>
      <motion.div
        id="oneva-lockscreen-wake-simulator"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[9999] bg-[#030305] text-neutral-200 flex flex-col justify-between select-none overflow-hidden font-sans"
      >
        {/* Top OLED System Status Bar */}
        <div className="flex items-center justify-between px-6 pt-4 text-xs font-mono text-neutral-400">
          <div className="flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="tracking-wider uppercase text-[10px] text-cyan-400/80">
              ONEVA Locked • JARVIS Standby
            </span>
          </div>
          <div className="flex items-center space-x-3 text-neutral-400">
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center space-x-1">
              <span>96%</span>
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-neutral-800/60 hover:bg-neutral-700 text-neutral-300 transition-colors ml-2"
              title="Close Lock Screen Test"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lock Screen Clock & Ambient Pulse */}
        <div className="flex flex-col items-center justify-center my-auto px-4 text-center">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <span className="text-6xl sm:text-7xl font-light tracking-tighter text-white font-mono drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              {formattedTime}
            </span>
            <span className="text-sm uppercase tracking-widest text-neutral-400 mt-2 font-medium">
              {formattedDate}
            </span>
          </motion.div>

          {/* Central JARVIS Arc Reactor Pulse */}
          <div className="relative my-10 flex items-center justify-center">
            {/* Outer animated ripple rings */}
            <motion.div
              animate={{
                scale: [1, 1.35, 1],
                opacity: [0.25, 0.05, 0.25],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute w-44 h-44 rounded-full border border-cyan-500/30"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.15, 0.4],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.3,
              }}
              className="absolute w-32 h-32 rounded-full border border-cyan-400/40"
            />

            {/* Core Arc Reactor Orb */}
            <motion.div
              animate={
                isWakingUp
                  ? { scale: [1, 1.5, 2], opacity: [1, 1, 0] }
                  : { scale: [1, 1.06, 1] }
              }
              transition={{
                duration: isWakingUp ? 0.8 : 2,
                repeat: isWakingUp ? 0 : Infinity,
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-colors duration-500 shadow-[0_0_35px_rgba(6,182,212,0.4)] ${
                isWakingUp
                  ? 'bg-cyan-300 border-white shadow-[0_0_60px_rgba(255,255,255,0.9)]'
                  : 'bg-cyan-950/70 border-cyan-400/60'
              }`}
            >
              {isWakingUp ? (
                <Sparkles className="w-8 h-8 text-black animate-spin" />
              ) : (
                <Mic className="w-8 h-8 text-cyan-400 animate-pulse" />
              )}
            </motion.div>
          </div>

          {/* Real-time listening indicator */}
          <div className="flex flex-col items-center space-y-2 max-w-sm">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>
                {isWakingUp
                  ? `Wake Word Detected: "${detectedWord}"`
                  : 'Screen-Off Mic Active • Say "Jarvis"'}
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Phone lock / screen-off mode is active. Speak into your microphone or tap a
              test command below to test instant lock-screen wake up.
            </p>
          </div>
        </div>

        {/* Bottom Interactive Simulation Tray */}
        <div className="px-6 pb-6 pt-3 bg-neutral-950/80 border-t border-neutral-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 text-[11px] text-neutral-400 font-mono">
            <span className="flex items-center space-x-1.5 text-cyan-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Low-Power WakeLock: Engaged</span>
            </span>
            <span className="flex items-center space-x-1">
              <Volume2 className="w-3 h-3 text-neutral-400" />
              <span>Chime &amp; Haptic Ready</span>
            </span>
          </div>

          {/* Quick Simulation Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleSimulateSpeech('Jarvis')}
              disabled={isWakingUp}
              className="px-3 py-2 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-left text-xs text-neutral-200 transition-all flex items-center justify-between group active:scale-95"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-white group-hover:text-cyan-400">Say: "Jarvis"</span>
                <span className="text-[10px] text-neutral-400">Wake Word Only</span>
              </div>
              <Power className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100" />
            </button>

            <button
              onClick={() => handleSimulateSpeech('Jarvis, open YouTube')}
              disabled={isWakingUp}
              className="px-3 py-2 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-left text-xs text-neutral-200 transition-all flex items-center justify-between group active:scale-95"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-white group-hover:text-cyan-400">Say: "Open YouTube"</span>
                <span className="text-[10px] text-neutral-400">Wake + Command</span>
              </div>
              <Power className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100" />
            </button>

            <button
              onClick={() => handleSimulateSpeech('Jarvis, WhatsApp par message bhejo')}
              disabled={isWakingUp}
              className="px-3 py-2 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-left text-xs text-neutral-200 transition-all flex items-center justify-between group active:scale-95"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-white group-hover:text-cyan-400">Say: "WhatsApp Msg"</span>
                <span className="text-[10px] text-neutral-400">Hindi Automation</span>
              </div>
              <Power className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100" />
            </button>
          </div>

          <div className="mt-3 text-center">
            <button
              onClick={onClose}
              className="text-[11px] text-neutral-400 hover:text-neutral-300 font-mono tracking-wider uppercase transition-colors"
            >
              [ Tap anywhere or click here to unlock &amp; return to home ]
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
