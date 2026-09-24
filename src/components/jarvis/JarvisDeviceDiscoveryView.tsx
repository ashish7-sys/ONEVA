/**
 * ONEVA Phase 17: Device App Discovery & Capability View
 * 
 * Provides real-time visibility into the native app discovery bridge,
 * deterministic catalog merging, capability models (Tier 1-5 icon resolution,
 * launchability, in-app interaction support), dynamic simulation controls,
 * and the 17-scenario Phase 17 verification test suite.
 */

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Shield,
  Search,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Layers,
  Cpu,
  PackageCheck,
  PackageX,
  ExternalLink,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { AppRepository } from '../../launcher/services/appRepository';
import { NativeAppDiscoveryBridge } from '../../launcher/services/nativeAppDiscoveryBridge';
import { AppCatalogService } from '../../services/appCatalogService';
import { IconService } from '../../services/iconService';
import { JarvisActionSelector } from '../../services/actions/jarvisActionSelector';
import {
  JarvisPhase17TestSuite,
  Phase17TestResult,
} from '../../services/intelligence/jarvisPhase17Tests';
import { AppCapabilityModel, DiscoveryMergeResult } from '../../types/deviceAppDiscovery';
import { AppShortcut } from '../../launcher/types';

export const JarvisDeviceDiscoveryView: React.FC = () => {
  const [mergeSummary, setMergeSummary] = useState<DiscoveryMergeResult>(() =>
    AppRepository.getMergeSummary()
  );
  const [installedApps, setInstalledApps] = useState<AppShortcut[]>(() =>
    AppRepository.getAvailableApps()
  );
  const [allInstalled, setAllInstalled] = useState<AppShortcut[]>(() =>
    AppRepository.getAllInstalledApps()
  );
  const [isScanning, setIsScanning] = useState(false);
  const [testResults, setTestResults] = useState<Phase17TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'catalog' | 'non_catalog' | 'daemon'>('all');
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);

  const refreshState = () => {
    setMergeSummary(AppRepository.getMergeSummary());
    setInstalledApps(AppRepository.getAvailableApps());
    setAllInstalled(AppRepository.getAllInstalledApps());
  };

  useEffect(() => {
    const unsub = AppRepository.subscribe(refreshState);
    return () => {
      unsub();
    };
  }, []);

  const handleRescan = async () => {
    setIsScanning(true);
    await AppRepository.refreshApps();
    refreshState();
    setIsScanning(false);
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const { results } = await JarvisPhase17TestSuite.runAllTests();
      setTestResults(results);
      refreshState();
    } catch (err) {
      console.error('Error running Phase 17 test suite:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleTestLaunch = async (appName: string) => {
    setLaunchMessage(`Triggering Jarvis to open "${appName}"...`);
    try {
      const res = await JarvisActionSelector.selectAndExecute(`Open ${appName}`);
      setLaunchMessage(`Jarvis response: ${res?.userMessage || 'Action completed'}`);
    } catch (e: any) {
      setLaunchMessage(`Error launching: ${e.message}`);
    }
  };

  const handleSimulateInstallVLC = () => {
    AppRepository.simulateInstallApp({
      packageName: 'org.videolan.vlc',
      appName: 'VLC Media Player',
      isSystemApp: false,
      launchable: true,
      versionName: '3.5.4',
      versionCode: 3050400,
    });
    refreshState();
  };

  const handleSimulateDaemon = () => {
    AppRepository.simulateInstallApp({
      packageName: 'xyz.system.syncdaemon',
      appName: 'System Sync Service',
      isSystemApp: true,
      launchable: false,
      versionName: '2.1.0',
      versionCode: 21,
    });
    refreshState();
  };

  const handleResetSimulation = () => {
    NativeAppDiscoveryBridge.resetToDefaultSimulation();
    AppRepository.invalidateCache();
    refreshState();
  };

  // Filter list
  const filteredApps = allInstalled.filter((app) => {
    const matchesSearch =
      app.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'catalog') return app.catalogSupported;
    if (selectedCategory === 'non_catalog') return !app.catalogSupported && app.launchable;
    if (selectedCategory === 'daemon') return !app.launchable;
    return true;
  });

  const passedTestsCount = testResults.filter((r) => r.passed).length;

  return (
    <div className="space-y-6 text-neutral-100">
      {/* Top Header & Architecture Badge */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white tracking-wide">
                  Device App Discovery & Capability Bridge
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Phase 17 Active
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Native Android PackageManager integration with deterministic capability modeling & icon fallback hierarchy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRescan}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-200 border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Rescan Device'}</span>
            </button>
            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-xs font-semibold text-cyan-300 border border-cyan-500/40 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isRunningTests ? 'Running Suite...' : 'Run 17 Tests'}</span>
            </button>
          </div>
        </div>

        {/* Discovery Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-neutral-500 block text-[10px]">TOTAL DISCOVERED</span>
            <span className="text-base font-bold text-white mt-0.5 block">{mergeSummary.totalDiscovered}</span>
            <span className="text-[10px] text-neutral-400">{mergeSummary.totalLaunchable} Launchable</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-emerald-400 block text-[10px]">CATALOG MATCHED</span>
            <span className="text-base font-bold text-emerald-300 mt-0.5 block">{mergeSummary.catalogMatchedCount}</span>
            <span className="text-[10px] text-neutral-400">Full Capabilities</span>
          </div>

          <div className="p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <span className="text-cyan-400 block text-[10px]">NON-CATALOG DISCOVERED</span>
            <span className="text-base font-bold text-cyan-300 mt-0.5 block">{mergeSummary.nonCatalogDiscoveredCount}</span>
            <span className="text-[10px] text-neutral-400">Tier 4/5 Fallback</span>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <span className="text-purple-400 block text-[10px]">FILTERED UNINSTALLED</span>
            <span className="text-base font-bold text-purple-300 mt-0.5 block">{mergeSummary.uninstalledCatalogCount}</span>
            <span className="text-[10px] text-neutral-400">Not in Device (Filtered)</span>
          </div>
        </div>

        {/* Privacy & Anti-Spyware Guarantee Banner */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
          <Shield className="w-4 h-4 shrink-0" />
          <span>
            <strong>Zero-Cloud Guarantee:</strong> Discovered app lists remain strictly in local device memory. Never uploaded to remote databases or external servers without consent.
          </span>
        </div>
      </div>

      {/* Dynamic Simulation Controls (for Testing) */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs">
        <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Dynamic OS Broadcast Simulation:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleSimulateInstallVLC}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-[11px] font-mono text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
          >
            + Install VLC Player
          </button>
          <button
            onClick={handleSimulateDaemon}
            className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-[11px] font-mono text-purple-300 border border-purple-500/30 transition cursor-pointer"
          >
            + Add Background Daemon
          </button>
          <button
            onClick={handleResetSimulation}
            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-mono text-neutral-300 border border-white/10 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 inline mr-1" />
            Reset Baseline
          </button>
        </div>
      </div>

      {/* Launch Feedback Toast */}
      {launchMessage && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-200 flex items-center justify-between">
          <span>{launchMessage}</span>
          <button onClick={() => setLaunchMessage(null)} className="text-neutral-400 hover:text-white text-xs ml-2 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Test Suite Results Display */}
      {testResults.length > 0 && (
        <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Phase 17 Verification Test Results</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                passedTestsCount === testResults.length
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {passedTestsCount} / {testResults.length} Passed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
            {testResults.map((t) => (
              <div
                key={t.id}
                className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                  t.passed
                    ? 'bg-emerald-500/[0.03] border-emerald-500/20'
                    : 'bg-red-500/[0.05] border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {t.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    <span className="font-semibold text-neutral-200 truncate">
                      {t.id}. {t.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-neutral-400 shrink-0">
                    {t.category}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-1">{t.actual}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discovered Apps Explorer */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by app name, package, or capability..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500/40"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: `All (${allInstalled.length})` },
              { id: 'catalog', label: 'Catalog Verified' },
              { id: 'non_catalog', label: 'Non-Catalog Discovered' },
              { id: 'daemon', label: 'Background Daemons' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedCategory(f.id as any)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer text-xs ${
                  selectedCategory === f.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredApps.map((app) => {
            const cap = AppRepository.getAppCapabilityModel(app.packageName);
            const iconRes = IconService.resolveAppIcon({
              packageName: app.packageName,
              nativeIconDataUrl: app.nativeIconDataUrl,
            });

            return (
              <div
                key={app.packageName}
                className="p-3.5 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900/90 border border-white/5 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Icon with tier indicator */}
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {iconRes.sourceTier === 'NATIVE_APP_ICON' && iconRes.nativeIconUrl ? (
                          <img
                            src={iconRes.nativeIconUrl}
                            alt={app.label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span
                            className="text-base font-bold"
                            style={{ color: app.accentColor || '#38bdf8' }}
                          >
                            {app.fallbackInitial || app.label.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white block truncate">{app.label}</span>
                        <span className="text-[10px] font-mono text-neutral-500 block truncate">
                          {app.packageName}
                        </span>
                      </div>
                    </div>

                    {/* Launchable Badge */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono shrink-0 ${
                        app.launchable
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {app.launchable ? 'Launchable' : 'Daemon'}
                    </span>
                  </div>

                  {/* Capability Details Matrix */}
                  <div className="mt-2.5 p-2 rounded-xl bg-black/20 border border-white/5 grid grid-cols-2 gap-1 text-[10px] font-mono">
                    <div className="flex items-center gap-1 text-neutral-400">
                      <span>Catalog:</span>
                      <span className={app.catalogSupported ? 'text-emerald-400' : 'text-neutral-500'}>
                        {app.catalogSupported ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-neutral-400">
                      <span>Icon Tier:</span>
                      <span className="text-cyan-400 truncate">{iconRes.sourceTier}</span>
                    </div>

                    <div className="flex items-center gap-1 text-neutral-400">
                      <span>Jarvis Launch:</span>
                      <span className={cap?.jarvisLaunchSupported ? 'text-emerald-400' : 'text-neutral-500'}>
                        {cap?.jarvisLaunchSupported ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-neutral-400">
                      <span>In-App Action:</span>
                      <span className={cap?.jarvisInteractionSupported ? 'text-emerald-400' : 'text-neutral-500'}>
                        {cap?.jarvisInteractionSupported ? 'Mapped' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-neutral-500">
                    {app.versionName ? `v${app.versionName}` : 'v1.0.0'}
                  </span>
                  {app.launchable && (
                    <button
                      onClick={() => handleTestLaunch(app.label)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-medium text-neutral-200 border border-white/10 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 text-cyan-400" />
                      <span>Test Launch</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
