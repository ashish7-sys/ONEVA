import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { EmergencyResetService, EmergencyResetState } from '../services/emergencyResetService';

export function EmergencySafeModeBanner() {
  const [state, setState] = useState<EmergencyResetState>(EmergencyResetService.getState());

  useEffect(() => {
    return EmergencyResetService.subscribe((s) => {
      setState(s);
    });
  }, []);

  if (!state.isEmergencyActive) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/95 text-neutral-950 px-4 py-2.5 shadow-xl backdrop-blur-md flex items-center justify-between border-b border-amber-600 transition-all animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="w-5 h-5 shrink-0 text-neutral-950 animate-bounce" />
        <div className="text-xs">
          <span className="font-bold uppercase tracking-wider block">ONEVA Emergency Safe Mode Active</span>
          <span className="text-[11px] opacity-90 block">
            All overlays, heavy animations &amp; speech interrupted. User data is safe.
          </span>
        </div>
      </div>
      <button
        onClick={() => EmergencyResetService.exitEmergencySafeMode()}
        className="px-3 py-1 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 text-xs font-semibold shrink-0 flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        Resume Normal Mode
      </button>
    </div>
  );
}
