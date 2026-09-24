import { useState } from 'react';
import {
  ArrowLeft,
  Palette,
  LayoutGrid,
  Smartphone,
  Shield,
  Key,
  Info,
  Check,
  Moon,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { LauncherSettings, WallpaperPresetId, IconShape } from '../types';
import { WALLPAPER_PRESETS, LauncherSettingsService } from '../services/launcherSettingsService';
import { PlatformBridge } from '../services/platformBridge';
import { AppRepository } from '../services/appRepository';
import { LocalStorageCache } from '../../core/storage/localCache';
import { PermissionModal } from './PermissionModal';

interface OnevaSettingsProps {
  settings: LauncherSettings;
  onUpdateSettings: (partial: Partial<LauncherSettings>) => void;
  onBackToHome: () => void;
  onOpenAdminPortal?: () => void;
}

type SettingsSection = 'appearance' | 'home' | 'apps' | 'privacy' | 'about';

export function OnevaSettings({
  settings,
  onUpdateSettings,
  onBackToHome,
  onOpenAdminPortal,
}: OnevaSettingsProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [diagnosticConsent, setDiagnosticConsent] = useState(LocalStorageCache.getDiagnosticsConsent());
  const [adminTapCount, setAdminTapCount] = useState(0);

  const handleToggleConsent = (val: boolean) => {
    LocalStorageCache.setDiagnosticsConsent(val);
    setDiagnosticConsent(val);
  };

  const handleBuildVersionTap = () => {
    const next = adminTapCount + 1;
    setAdminTapCount(next);
    if (next >= 5 && onOpenAdminPortal) {
      setAdminTapCount(0);
      onOpenAdminPortal();
    }
  };

  const allApps = AppRepository.getAvailableApps();
  const platformMode = PlatformBridge.getPlatformMode();

  return (
    <div className="fixed inset-0 z-40 bg-neutral-950 text-white flex flex-col select-none overflow-hidden animate-in fade-in duration-150">
      {/* Settings Header */}
      <header className="px-4 py-3.5 border-b border-white/10 bg-neutral-900/60 backdrop-blur-xl flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            aria-label="Back to Home"
            className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-white">ONEVA Settings</h2>
            <p className="text-[11px] text-neutral-400">System Preferences &amp; Customization</p>
          </div>
        </div>

        <button
          onClick={onBackToHome}
          className="text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 transition cursor-pointer"
        >
          Done
        </button>
      </header>

      {/* Main Settings Body */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* Navigation Tabs */}
        <div className="sm:w-52 border-b sm:border-b-0 sm:border-r border-white/10 bg-neutral-900/40 p-2 sm:p-3 overflow-x-auto sm:overflow-y-auto flex sm:flex-col gap-1 shrink-0">
          <button
            onClick={() => setActiveSection('appearance')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeSection === 'appearance'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Palette className="w-4 h-4 text-emerald-400" />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveSection('home')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeSection === 'home'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-sky-400" />
            <span>Home Screen</span>
          </button>

          <button
            onClick={() => setActiveSection('apps')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeSection === 'apps'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>Apps &amp; Bridge</span>
          </button>

          <button
            onClick={() => setActiveSection('privacy')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeSection === 'privacy'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Privacy</span>
          </button>

          <button
            onClick={() => setActiveSection('about')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeSection === 'about'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <Info className="w-4 h-4 text-purple-400" />
            <span>About ONEVA</span>
          </button>
        </div>

        {/* Section Content Pane */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-2xl">
          {/* SECTION: APPEARANCE */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Wallpaper &amp; Atmosphere</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Select a calibrated OLED-safe wallpaper preset.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {WALLPAPER_PRESETS.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => onUpdateSettings({ wallpaperId: wp.id })}
                    style={{ background: wp.cssBackground }}
                    className={`h-24 rounded-2xl border p-3 flex flex-col justify-between text-left transition cursor-pointer relative overflow-hidden ${
                      settings.wallpaperId === wp.id
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span className="text-xs font-semibold text-white drop-shadow-sm">{wp.name}</span>
                    {settings.wallpaperId === wp.id && (
                      <span className="self-end bg-emerald-500 text-neutral-950 p-1 rounded-full">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Icon Shape */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Icon Geometry</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Customize the corner curvature of launcher icons.</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['squircle', 'rounded', 'circle'] as IconShape[]).map((shape) => (
                    <button
                      key={shape}
                      onClick={() => onUpdateSettings({ iconShape: shape })}
                      className={`py-3 px-3 rounded-2xl border text-center font-medium capitalize transition cursor-pointer flex flex-col items-center gap-2 ${
                        settings.iconShape === shape
                          ? 'bg-white/15 border-emerald-500 text-white'
                          : 'bg-white/[0.04] border-white/10 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 bg-emerald-500/20 border border-emerald-500/40 ${
                          shape === 'squircle'
                            ? 'rounded-[0.6rem]'
                            : shape === 'rounded'
                            ? 'rounded-lg'
                            : 'rounded-full'
                        }`}
                      />
                      <span>{shape}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: HOME SCREEN */}
          {activeSection === 'home' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Home Screen Layout</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Configure grid density and widgets.</p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Grid Density */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Grid Dimensions</span>
                    <span className="text-neutral-400">Number of columns across the home grid</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onUpdateSettings({ gridCols: 4 })}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition cursor-pointer ${
                        settings.gridCols === 4
                          ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400'
                          : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      4 Columns
                    </button>
                    <button
                      onClick={() => onUpdateSettings({ gridCols: 5 })}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition cursor-pointer ${
                        settings.gridCols === 5
                          ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400'
                          : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      5 Columns
                    </button>
                  </div>
                </div>

                {/* Clock Widget Toggle */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Clock &amp; Date Widget</span>
                    <span className="text-neutral-400">Display digital time at the top of the home screen</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showClockWidget}
                    onChange={(e) => onUpdateSettings({ showClockWidget: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                {/* Greeting Toggle */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Glance Greeting</span>
                    <span className="text-neutral-400">Display subtle time-of-day greeting badge</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showGreeting}
                    onChange={(e) => onUpdateSettings({ showGreeting: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION: APPS & BRIDGE */}
          {activeSection === 'apps' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Installed Applications &amp; Enhancement Layer</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Device-level customization operating on top of your real installed Android applications.
                </p>
              </div>

              {/* Architectural Clarity Card */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Shield className="w-4 h-4" />
                  <span>Real Applications &bull; Zero APK Modification</span>
                </div>
                <p className="text-neutral-300 text-[11px] leading-relaxed">
                  ONEVA is not an app store or a collection of replacement apps. Your installed apps (WhatsApp, YouTube, Chrome, Instagram, etc.) remain the genuine applications installed on your Android device. ONEVA provides standard launcher customization without modifying any APK bytecode or reading private app storage.
                </p>
              </div>

              {/* Platform Status Card */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Execution Layer</span>
                  <span className="font-mono text-emerald-400 font-semibold uppercase">
                    {platformMode === 'native-android' ? 'Native Android Companion Bridge' : 'Web Preview Sandbox'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Detected Applications</span>
                  <span className="font-mono text-white">{allApps.length} installed apps</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Enhancement Mechanism</span>
                  <span className="font-mono text-neutral-300">
                    Launcher Presentation &amp; Intent Bridge
                  </span>
                </div>
              </div>

              {/* Installed Packages List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-neutral-300">Target Installed Packages</div>
                  <span className="text-[10px] text-neutral-400 font-mono">Long-press on home screen to customize</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {allApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white truncate">{app.label}</span>
                          {app.isSystemApp && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                              System
                            </span>
                          )}
                        </div>
                        <span className="block font-mono text-[10px] text-neutral-400 truncate">
                          {app.packageName}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-neutral-300 font-mono shrink-0">
                        {app.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: PRIVACY & PERMISSIONS */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Privacy Architecture</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  ONEVA is engineered with zero remote telemetry for personal data.
                </p>
              </div>

              {/* Privacy Pledge */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1.5 leading-relaxed">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Uncompromising Local Privacy Standard</span>
                </div>
                <p>
                  ONEVA runs all launcher algorithms locally on your device. We never read, store, or transmit your messages, contacts, microphone recordings, photos, or keystrokes to external servers.
                </p>
              </div>

              {/* Diagnostic Consent Switch */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-semibold text-white block">Anonymous Diagnostic Telemetry</span>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Share anonymized error crash codes to help improve system stability. Strictly excludes personal data.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={diagnosticConsent}
                  onChange={(e) => handleToggleConsent(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
                />
              </div>

              {/* Permission Modal Trigger */}
              <button
                onClick={() => setShowPermissionModal(true)}
                className="w-full p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between text-xs transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium text-white">Review System Permissions</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          )}

          {/* SECTION: ABOUT ONEVA */}
          {activeSection === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white">About ONEVA</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Modern, privacy-first Android companion &amp; launcher engine.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Framework</span>
                  <span className="font-semibold text-white">ONEVA Device Enhancement Layer</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Build Version</span>
                  {/* Discreet tap handler for developer/admin access */}
                  <button
                    onClick={handleBuildVersionTap}
                    title="Tap build version for developer diagnostics"
                    className="font-mono text-neutral-300 hover:text-emerald-400 transition cursor-pointer active:scale-95"
                  >
                    2.1.0-companion-core
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Platform Target</span>
                  <span className="font-mono text-neutral-300">Android 12+ / Modern Web</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Subsystem State</span>
                  <span className="text-emerald-400 font-medium">Phase 2 (Home &amp; Launcher)</span>
                </div>
              </div>

              {/* Developer Entrance Notice (Preserves Phase 1 Admin Portal seamlessly) */}
              {onOpenAdminPortal && (
                <div className="pt-2">
                  <button
                    onClick={onOpenAdminPortal}
                    className="w-full p-3 rounded-2xl bg-neutral-900 border border-white/5 hover:border-white/20 text-neutral-400 hover:text-neutral-200 text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-neutral-500" />
                      <span>System Diagnostics &amp; Administration</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Permission Explainer Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
      />
    </div>
  );
}
