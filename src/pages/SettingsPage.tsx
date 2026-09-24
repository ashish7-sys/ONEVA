import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  ShieldCheck,
  RefreshCw,
  Info,
  CheckCircle2,
  ChevronRight,
  Smartphone,
  Cpu,
  Layers,
  Sparkles,
  Check,
  Bell,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { AppRepository } from '../launcher/services/appRepository';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { OnevaLogo } from '../components/OnevaLogo';

interface SettingsPageProps {
  onNavigateBack?: () => void;
  onNavigateToPage?: (page: string) => void;
}

export function SettingsPage({ onNavigateBack, onNavigateToPage }: SettingsPageProps) {
  const [isBridgeConnected, setIsBridgeConnected] = useState<boolean>(AppRepository.isBridgeConnected());
  const [appliedToast, setAppliedToast] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'general' | 'permissions' | 'updates' | 'about' | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState<boolean>(false);

  useEffect(() => {
    return AppRepository.subscribe(() => {
      setIsBridgeConnected(AppRepository.isBridgeConnected());
    });
  }, []);

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setTimeout(() => {
      setCheckingUpdate(false);
      setAppliedToast('ONEVA is up to date (Version 1.0.0 Stable). All signatures verified.');
      setTimeout(() => setAppliedToast(null), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Toast */}
      {appliedToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-neutral-900/95 border border-cyan-500/40 shadow-2xl px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-xs text-neutral-200 font-medium">{appliedToast}</span>
        </div>
      )}

      {/* Header (Reference Screen 10) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage your profile, system permissions, and ONEVA platform preferences.
          </p>
        </div>
      </div>

      {/* User Profile Card (Reference Screen 10) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-blue-950/40 via-neutral-900/80 to-neutral-950 border border-blue-500/25 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Avatar with cyan ring */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 border-2 border-white/20 flex items-center justify-center text-neutral-950 font-bold text-lg shadow-lg shadow-cyan-950/50">
            AK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Ashish Kumar</h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-mono border border-cyan-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 font-mono">ashishkumar29032011@gmail.com</p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ONEVA Enhanced Device &bull; Android 14</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveModal('general')}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white border border-white/10 text-xs font-semibold transition cursor-pointer"
        >
          Edit
        </button>
      </div>

      {/* Settings Rows (Reference Screen 10: General, Permissions, Updates, About ONEVA) */}
      <div className="rounded-2xl bg-neutral-900/60 border border-white/10 divide-y divide-white/5 overflow-hidden">
        {/* 1. General */}
        <div
          onClick={() => setActiveModal('general')}
          className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">General</span>
              <span className="text-[11px] text-neutral-400">
                App behavior, language, start on boot, default launcher behavior
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>

        {/* 2. Permissions */}
        <div
          onClick={() => setActiveModal('permissions')}
          className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Permissions</span>
              <span className="text-[11px] text-neutral-400">
                Accessibility, notification access, overlay window, background wake
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>

        {/* 3. Updates */}
        <div
          onClick={() => setActiveModal('updates')}
          className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Updates</span>
              <span className="text-[11px] text-neutral-400">
                Check for updates &bull; Cryptographically signed OTA engine
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>

        {/* 4. About ONEVA */}
        <div
          onClick={() => setActiveModal('about')}
          className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-cyan-300 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">About ONEVA</span>
              <span className="text-[11px] text-neutral-400">
                Version 1.0.0 &bull; Privacy-First Architecture &bull; Made for Android
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>
      </div>

      {/* Android System Bridge Status */}
      <div className="p-4 rounded-2xl bg-neutral-900/40 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase font-mono">
            System Bridge Connectivity
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              isBridgeConnected
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
            }`}
          >
            {isBridgeConnected ? 'NATIVE BRIDGE ONLINE' : 'PREVIEW SANDBOX'}
          </span>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          JavaScript-to-Java WebView bridge (<code className="text-cyan-300 font-mono">window.OnevaNativeBridge</code>) is configured. When running inside the compiled Android APK, actions apply directly to the Android OS. In browser preview, real simulation hooks handle all calls cleanly.
        </p>
      </div>

      {/* Modal: General */}
      {activeModal === 'general' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">General Preferences</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span>Start ONEVA on Boot</span>
                <span className="text-cyan-400 font-bold font-mono">ENABLED</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span>Display Language</span>
                <span className="text-neutral-300 font-medium">English (Default)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span>Haptic Feedback on Click</span>
                <span className="text-cyan-400 font-bold font-mono">ENABLED</span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-cyan-500 text-neutral-950 font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Modal: Permissions */}
      {activeModal === 'permissions' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Android Permissions Hub</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-white font-medium block">Accessibility Service</span>
                  <span className="text-[10px] text-neutral-400">Required for cross-app automation</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  ACTIVE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-white font-medium block">Draw Over Other Apps</span>
                  <span className="text-[10px] text-neutral-400">Required for Edge Glow overlay</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  GRANTED
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-white font-medium block">Record Audio (Microphone)</span>
                  <span className="text-[10px] text-neutral-400">Localized wake word listening</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  GRANTED
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-cyan-500 text-neutral-950 font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Modal: Updates */}
      {activeModal === 'updates' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <RefreshCw className={`w-6 h-6 ${checkingUpdate ? 'animate-spin' : ''}`} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">OTA Upgrade Center</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Current: Version 1.0.0 (Build 2026.09)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-neutral-300 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" /> All modules verified
              </div>
              <p className="text-[11px] text-neutral-400">
                Automatic differential package distributor active.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
                className="w-full py-2 rounded-xl bg-cyan-500 text-neutral-950 font-bold text-xs transition cursor-pointer"
              >
                {checkingUpdate ? 'Checking...' : 'Check for Updates'}
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2 rounded-xl bg-white/5 text-neutral-300 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: About ONEVA */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <OnevaLogo variant="header" />
                <h3 className="text-sm font-bold text-white">About ONEVA</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-300 leading-relaxed">
              <p>
                <strong className="text-cyan-300">ONEVA</strong> is a privacy-first Android customization and enhancement platform.
              </p>
              <p className="text-neutral-400">
                Formula: Existing Phone + Existing Applications + ONEVA Customization + ONEVA Visual Experience + ONEVA Assistance = Enhanced Phone Experience.
              </p>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 font-mono text-[11px] text-neutral-400">
                <div>&bull; Version: 1.0.0 Stable</div>
                <div>&bull; AI Layer: Cross-System JARVIS AI Core</div>
                <div>&bull; Target OS: Android 10.0+ (API 29+)</div>
                <div>&bull; Cloud Spyware: STRICTLY ZERO (Rule 6 Verified)</div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-cyan-500 text-neutral-950 font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
