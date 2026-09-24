import { useState, FormEvent } from 'react';
import { Shield, Lock, Mail, ArrowLeft, Loader2, AlertCircle, Info } from 'lucide-react';
import { AuthService } from '../services/authService';
import { AdminProfile } from '../types';
import { OnevaLogo } from '../components/OnevaLogo';

interface AdminLoginProps {
  onSuccess: (admin: AdminProfile) => void;
  onCancel: () => void;
}

export function AdminLogin({ onSuccess, onCancel }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your administrator email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const res = await AuthService.loginAdmin(email, password);
    setIsLoading(false);

    if (res.success && res.admin) {
      onSuccess(res.admin);
    } else {
      setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div id="admin-login-screen" className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-6 relative">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to ONEVA Client</span>
        </button>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex items-center gap-3.5 mb-6">
            <OnevaLogo
              variant="card"
              className="border border-white/10 shadow-lg shadow-emerald-950/30"
            />
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">ONEVA Admin Gateway</h1>
              <p className="text-xs text-neutral-400">Restricted to authorized system operators</p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  required
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Secret Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials & Role...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
            <p>
              Supabase Auth authenticates the token and verifies administrative permission in the PostgreSQL RLS schema before granting dashboard privileges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
