import { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { FullPackService } from '../services/fullPackService';
import { FullPackExecutionResult, FullPackItemStatus } from '../types/adminAssets';

interface FullPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export function FullPackModal({ isOpen, onClose, onApplied }: FullPackModalProps) {
  const [phase, setPhase] = useState<'confirm' | 'applying' | 'completed'>('confirm');
  const [manifest, setManifest] = useState<ReturnType<typeof FullPackService.getCurrentPackManifest>>([]);
  const [currentStep, setCurrentStep] = useState<{ label: string; assetName: string; message: string } | null>(null);
  const [executionResult, setExecutionResult] = useState<FullPackExecutionResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('confirm');
      setManifest(FullPackService.getCurrentPackManifest());
      setCurrentStep(null);
      setExecutionResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartApply = async () => {
    setPhase('applying');

    try {
      const result = await FullPackService.applyFullPack((step) => {
        setCurrentStep({
          label: step.categoryLabel,
          assetName: step.assetName,
          message: step.message,
        });
      });

      setExecutionResult(result);
      setPhase('completed');
      if (onApplied) onApplied();
    } catch (err: any) {
      console.error('[FullPackModal] Execution error:', err);
      setPhase('completed');
    }
  };

  return (
    <div
      id="full-pack-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="full-pack-modal-dialog"
        className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Full ONEVA Pack</h2>
              <p className="text-[11px] text-neutral-400">Dynamic Admin-curated system defaults</p>
            </div>
          </div>
          {phase !== 'applying' && (
            <button
              id="full-pack-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {phase === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                  Apply Full ONEVA Pack?
                </p>
                <p className="text-[12px] text-neutral-400 leading-relaxed">
                  This will apply the current Admin-selected default pack across all subsystems. Your installed genuine apps remain completely untouched. You can still customize individual apps and sections later.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                    Current Published Defaults ({manifest.length} Modules)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Admin Registry
                  </span>
                </div>

                <div className="divide-y divide-neutral-800/60 rounded-xl border border-neutral-800 bg-neutral-950/40 p-2 max-h-60 overflow-y-auto">
                  {manifest.map((item) => (
                    <div key={item.category} className="py-2 px-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-neutral-400 block text-[10px] uppercase font-mono">{item.categoryLabel}</span>
                        <span className="text-neutral-200 font-medium">{item.assetName}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        ★ DEFAULT
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-neutral-400 bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/80">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero cloud transmission. Purely client-side configuration.</span>
              </div>
            </div>
          )}

          {phase === 'applying' && (
            <div className="py-8 space-y-6 text-center">
              <div className="relative mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">Applying Full ONEVA Pack</h3>
                <p className="text-xs text-neutral-400">
                  Coordinating independent subsystem services...
                </p>
              </div>

              {currentStep && (
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-left max-w-sm mx-auto">
                  <span className="text-[10px] font-mono text-emerald-400 block uppercase tracking-wider">
                    {currentStep.label}
                  </span>
                  <span className="text-xs font-medium text-neutral-200 block mt-0.5">
                    {currentStep.assetName}
                  </span>
                  <span className="text-[11px] text-neutral-400 block mt-1">
                    {currentStep.message}
                  </span>
                </div>
              )}
            </div>
          )}

          {phase === 'completed' && executionResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-semibold text-white">Full ONEVA Pack Applied</h3>
                <p className="text-xs text-neutral-300">
                  {executionResult.appliedCount} modules calibrated to current Admin defaults.
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {executionResult.items.map((item) => (
                  <div
                    key={item.category}
                    className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">{item.categoryLabel}</span>
                        <span className="text-neutral-200 font-medium">{item.assetName}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400">{item.message}</p>
                      {item.detail && (
                        <p className="text-[10px] text-neutral-400 italic mt-0.5">{item.detail}</p>
                      )}
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono shrink-0 ${
                        item.status === 'applied'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {item.status === 'applied' ? '✓ Applied' : '⚠ Partial'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/80 flex items-center justify-end gap-3">
          {phase === 'confirm' && (
            <>
              <button
                id="full-pack-cancel-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                id="full-pack-apply-btn"
                type="button"
                onClick={handleStartApply}
                className="px-5 py-2 rounded-xl text-xs font-medium bg-emerald-500 text-neutral-950 font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply Full ONEVA Pack
              </button>
            </>
          )}

          {phase === 'completed' && (
            <button
              id="full-pack-done-btn"
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-950/40"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
