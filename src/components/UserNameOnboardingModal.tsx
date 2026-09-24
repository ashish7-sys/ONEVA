import { useState } from 'react';
import { User, Sparkles, ArrowRight } from 'lucide-react';
import { UserProfileService } from '../services/userProfileService';

interface UserNameModalProps {
  isOpen: boolean;
  isInitialOnboarding?: boolean;
  onClose: () => void;
  onSaved?: (name: string) => void;
}

export function UserNameModal({
  isOpen,
  isInitialOnboarding = false,
  onClose,
  onSaved,
}: UserNameModalProps) {
  const currentName = UserProfileService.hasCustomName() ? UserProfileService.getUserName() : '';
  const [nameInput, setNameInput] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = nameInput.trim();
    if (!clean) {
      setError('Please enter a name or nickname.');
      return;
    }

    UserProfileService.setUserName(clean);
    onSaved?.(clean);
    onClose();
  };

  const handleSkip = () => {
    UserProfileService.skipOnboarding();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#040711]/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#111C3A] via-[#0C152B] to-[#080E1E] border border-cyan-500/30 p-6 shadow-2xl shadow-cyan-950/50 space-y-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/10">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isInitialOnboarding ? 'Welcome to ONEVA' : 'Personalize Profile'}</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white mt-0.5">
              {isInitialOnboarding ? 'What is your name?' : 'Update Your Name'}
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {isInitialOnboarding
            ? 'ONEVA greets you and tailors assistant telemetry to your preference. Your name is stored locally on your device.'
            : 'Enter your preferred name or handle for the ONEVA Control Center and voice assistant.'}
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-medium">
              Your Name / Handle
            </label>
            <input
              type="text"
              autoFocus
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Alex, Maya, Dev..."
              className="w-full px-4 py-3 rounded-xl bg-[#070D1F] border border-cyan-500/30 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition"
              maxLength={32}
            />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </div>

          <div className="flex items-center gap-2 pt-2">
            {isInitialOnboarding ? (
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium border border-white/10 transition cursor-pointer"
              >
                Skip for now
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium border border-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <span>{isInitialOnboarding ? 'Continue' : 'Save Name'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
