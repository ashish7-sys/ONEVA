import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Sparkles } from 'lucide-react';
import { OnevaLogo } from './OnevaLogo';

interface OnevaSplashScreenProps {
  onComplete: () => void;
  autoDismissMs?: number;
}

export function OnevaSplashScreen({
  onComplete,
  autoDismissMs = 2200,
}: OnevaSplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing ONEVA Framework...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Stage 1
    const t1 = setTimeout(() => {
      setProgress(40);
      setStatusText('Verifying Local Privacy Sandbox...');
    }, 500);

    // Stage 2
    const t2 = setTimeout(() => {
      setProgress(75);
      setStatusText('Connecting Native Presentation Engine...');
    }, 1100);

    // Stage 3
    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Ready');
    }, 1700);

    // Start Fade Out
    const tFade = setTimeout(() => {
      setIsFadingOut(true);
    }, autoDismissMs - 400);

    // Complete
    const tComplete = setTimeout(() => {
      onComplete();
    }, autoDismissMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tFade);
      clearTimeout(tComplete);
    };
  }, [autoDismissMs, onComplete]);

  return (
    <div
      id="oneva-startup-splash"
      className={`fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-between p-8 sm:p-12 select-none transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Bar / Skip */}
      <div className="w-full max-w-md flex items-center justify-between text-xs text-neutral-500 font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ZERO-SPYWARE SANDBOX</span>
        </div>
        <button
          onClick={onComplete}
          className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer border border-neutral-800"
        >
          Skip
        </button>
      </div>

      {/* Centerpiece: The Exact Official ONEVA Logo */}
      <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
        <div className="relative group">
          {/* Subtle ambient lighting behind the emblem without altering the artwork */}
          <div className="absolute -inset-4 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <OnevaLogo
            variant="splash"
            className="shadow-2xl shadow-emerald-950/40 relative z-10"
          />
        </div>

        {/* Subtitle / Architectural Identity */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
              Privacy-First Android Platform
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">
            Existing Phone + Genuine Apps + ONEVA
          </p>
        </div>
      </div>

      {/* Bottom Progress & Diagnostic Status */}
      <div className="w-full max-w-xs space-y-3">
        <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800/80">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span className="truncate">{statusText}</span>
          <span className="text-neutral-500 shrink-0">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
