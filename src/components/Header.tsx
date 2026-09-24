import { ArrowLeft, Crown, Settings as SettingsIcon, Smartphone } from 'lucide-react';
import { PageId } from '../navigation/types';
import { OnevaLogo } from './OnevaLogo';

interface HeaderProps {
  currentPage: PageId;
  pageTitle?: string;
  onNavigateBack?: () => void;
  onOpenAdminPortal: () => void;
  isBridgeConnected: boolean;
  onOpenLauncher?: () => void;
  onOpenSettings?: () => void;
}

export function Header({
  currentPage,
  pageTitle,
  onNavigateBack,
  onOpenAdminPortal,
  isBridgeConnected,
  onOpenLauncher,
  onOpenSettings,
}: HeaderProps) {
  const isHome = currentPage === 'home';

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 py-3 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isHome && onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-200 hover:text-white border border-white/15 hover:border-white/30 flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0 shadow-sm hover:shadow-cyan-500/20"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <OnevaLogo
              variant="header"
              className="border border-white/20 shadow-md shadow-blue-950/40"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-base text-white">ONEVA</span>
                {isHome ? (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-cyan-300 border border-cyan-500/20 tracking-wider font-semibold">
                    Control Center
                  </span>
                ) : (
                  <span className="text-xs text-neutral-400 font-medium">/ {pageTitle || currentPage}</span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 tracking-tight hidden sm:block">
                Android Customization &amp; Enhancement Platform
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Bridge Companion Status Pill */}
          <div
            className={`hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
              isBridgeConnected
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                : 'bg-neutral-900/80 text-neutral-400 border-white/10'
            }`}
            title={isBridgeConnected ? 'Connected to Android System Bridge' : 'Running in Web Preview Sandbox'}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isBridgeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-500/70'
              }`}
            />
            <span className="hidden md:inline">Android Bridge:</span>
            <span>{isBridgeConnected ? 'Connected' : 'Preview'}</span>
          </div>

          {/* Launch Phone Surface Preview Button */}
          {currentPage !== 'launcher' && onOpenLauncher && (
            <button
              onClick={onOpenLauncher}
              title="Preview on Android Surface"
              aria-label="Open Launcher"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/15 text-xs font-medium transition cursor-pointer active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phone Surface</span>
            </button>
          )}

          {/* King 👑 symbol for Admin Portal */}
          <button
            id="admin-portal-crown-btn"
            onClick={onOpenAdminPortal}
            title="Admin Portal (King Access)"
            aria-label="Admin Portal"
            className="w-9 h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400/60 flex items-center justify-center transition cursor-pointer active:scale-95 group shadow-sm hover:shadow-amber-500/20"
          >
            <Crown className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </button>

          {/* Settings ⚙️ Button */}
          {onOpenSettings && (
            <button
              id="header-settings-btn"
              onClick={onOpenSettings}
              title="ONEVA Settings"
              aria-label="Settings"
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer active:scale-95 ${
                currentPage === 'settings'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border-white/15 hover:border-white/30'
              }`}
            >
              <SettingsIcon className="w-4 h-4 text-neutral-300" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
