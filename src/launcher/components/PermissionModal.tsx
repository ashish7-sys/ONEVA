import { useState } from 'react';
import { ShieldCheck, Check, AlertCircle, Home, Layers, Lock } from 'lucide-react';
import { PermissionDefinition } from '../types';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PermissionModal({ isOpen, onClose }: PermissionModalProps) {
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([
    {
      id: 'launcher_default',
      name: 'Default Launcher Intent',
      description: 'Allows ONEVA to respond to the device Home button and function as your default interface.',
      category: 'launcher',
      rationale: 'Required so pressing Home brings you back to ONEVA instead of the factory launcher.',
      isCurrentlyRequired: true,
      isGranted: true,
    },
    {
      id: 'query_packages',
      name: 'Installed Applications Query',
      description: 'Enables ONEVA to enumerate installed app packages to populate your Home grid and App Drawer.',
      category: 'system',
      rationale: 'Required to launch your installed apps directly from the home screen.',
      isCurrentlyRequired: true,
      isGranted: true,
    },
    {
      id: 'accessibility_service',
      name: 'Accessibility / Gesture Navigation',
      description: 'Deep system gesture hooks and status bar expansion.',
      category: 'system',
      rationale: 'NOT REQUESTED. ONEVA does not require accessibility access for standard launcher operation.',
      isCurrentlyRequired: false,
      isGranted: false,
    },
    {
      id: 'microphone_access',
      name: 'Audio / Microphone Recording',
      description: 'Direct acoustic capture or background listening.',
      category: 'privacy',
      rationale: 'NOT REQUESTED. Voice features are not part of Phase 2. Zero audio permissions required.',
      isCurrentlyRequired: false,
      isGranted: false,
    },
    {
      id: 'contacts_sms',
      name: 'Contacts & Private SMS Ingestion',
      description: 'Personal address book and text message telemetry.',
      category: 'privacy',
      rationale: 'STRICTLY FORBIDDEN. ONEVA never accesses, reads, or transmits your personal communication.',
      isCurrentlyRequired: false,
      isGranted: false,
    },
    {
      id: 'apk_bytecode_storage',
      name: 'Third-Party APK & Private Data Access',
      description: 'Modifying installed APK bytecodes, reading WhatsApp chats, or altering private application storage.',
      category: 'privacy',
      rationale: 'STRICTLY PROHIBITED by Android sandbox and ONEVA architecture. All installed apps remain 100% genuine.',
      isCurrentlyRequired: false,
      isGranted: false,
    },
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Transparent Permission Framework</h3>
            <p className="text-xs text-neutral-400">Strictly minimal privileges required for home screen navigation.</p>
          </div>
        </div>

        {/* Informational Box */}
        <div className="p-3.5 rounded-2xl bg-neutral-950 border border-white/5 text-xs text-neutral-300 leading-relaxed">
          ONEVA adheres to an uncompromising zero-excess privilege standard. Only permissions strictly necessary to display your home screen and launch apps are requested.
        </div>

        {/* Permissions List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {permissions.map((perm) => (
            <div
              key={perm.id}
              className={`p-3 rounded-2xl border transition ${
                perm.isCurrentlyRequired
                  ? 'bg-neutral-950/80 border-white/10'
                  : 'bg-neutral-950/40 border-white/5 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{perm.name}</span>
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${
                        perm.isCurrentlyRequired
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {perm.isCurrentlyRequired ? 'Active Requirement' : 'Not Requested'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal">{perm.description}</p>
                  <p className="text-[10px] text-neutral-500 italic mt-0.5">{perm.rationale}</p>
                </div>

                <div className="shrink-0 mt-0.5">
                  {perm.isGranted ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                      <Check className="w-3.5 h-3.5" /> Granted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-neutral-500 text-xs">
                      <Lock className="w-3.5 h-3.5" /> Disabled
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.99] text-xs font-semibold text-white transition cursor-pointer"
        >
          Understood &bull; Return to ONEVA
        </button>
      </div>
    </div>
  );
}
