import { ShieldCheck, Lock, EyeOff, Ban, KeyRound, Smartphone } from 'lucide-react';

interface PrivacyPageProps {
  onNavigateBack?: () => void;
}

export function PrivacyPage({ onNavigateBack }: PrivacyPageProps) {
  const pillars = [
    {
      icon: EyeOff,
      title: 'Zero Spyware',
      description: 'ONEVA never intercepts private chats, personal keystrokes, camera feeds, or contact books for transmission to any remote cloud servers.',
    },
    {
      icon: Smartphone,
      title: 'Local-First Execution',
      description: 'All tactile IME typing, vector icon masking, and assistant NLU parse locally within your device sandbox. Memory context is destroyed immediately.',
    },
    {
      icon: KeyRound,
      title: 'No Password or PIN Access',
      description: 'ONEVA never asks for, captures, learns, stores, or attempts to bypass Android lock screen PINs, pattern locks, or biometric keys.',
    },
    {
      icon: Ban,
      title: 'Zero Bytecode Tampering',
      description: 'No DEX patching, code injection, reverse-engineering, or sandbox breaking of third-party apps. Everything operates strictly within legitimate presentation APIs.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ONEVA SECURITY ARCHITECTURE</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Rule 6: Privacy &amp; Sandbox Integrity</h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Strict Android security boundaries. Absolute respect for genuine third-party apps and device user trust.
          </p>
        </div>

        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-200 border border-white/10 transition cursor-pointer self-start"
          >
            &larr; Back
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div key={idx} className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">{pillar.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{pillar.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
