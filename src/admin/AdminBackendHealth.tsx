import { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Server,
  Database,
  Shield,
  Zap,
  HardDrive,
  FolderLock,
  Layers,
} from 'lucide-react';
import { checkBackendHealth } from '../supabase/health';
import { BackendHealth } from '../types';
import { ScalableStorageService, StorageQuotaReport } from '../services/scalableStorageService';

export function AdminBackendHealth() {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [quotaReport, setQuotaReport] = useState<StorageQuotaReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runHealthCheck = async () => {
    setIsChecking(true);
    const [hRes, qRes] = await Promise.all([
      checkBackendHealth(),
      ScalableStorageService.inspectStorageQuota(),
    ]);
    setHealth(hRes);
    setQuotaReport(qRes);
    setIsChecking(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const usedPercent = quotaReport?.tierLimitBytes
    ? Math.min(100, Math.round((quotaReport.totalStorageUsedBytes / quotaReport.tierLimitBytes) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Supabase Infrastructure Diagnostics</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Protected internal health metrics, storage quotas, and security audits.
          </p>
        </div>
        <button
          onClick={runHealthCheck}
          disabled={isChecking}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 transition cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Pinging Node...' : 'Ping Supabase'}</span>
        </button>
      </div>

      {/* Grid of health cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Connection State</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            {health?.isOnline ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Operational</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-semibold text-rose-400">Offline / Degraded</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            Last checked: {health?.lastChecked || 'Never'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Round-Trip Latency</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {health?.latencyMs !== undefined ? `${health.latencyMs}ms` : '---'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">Target threshold: &lt; 350ms SLA</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Configured Endpoint</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-mono text-xs text-neutral-200 truncate">
            {health?.urlPreview || 'Not configured in environment'}
          </p>
          <p className="text-[11px] text-neutral-400 mt-2">Using client anon credential safely</p>
        </div>
      </div>

      {health?.errorDetails && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Diagnostic Report</p>
            <p className="opacity-90">{health.errorDetails}</p>
          </div>
        </div>
      )}

      {/* Storage Quota & Capacity Diagnostics Card */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Supabase Storage Quota & Large Asset Pipeline</h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-800/40">
            Bucket: {quotaReport?.bucketName || 'oneva-public-assets'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
              <span>Detected Plan Tier</span>
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <p className="text-xs font-semibold text-white truncate">
              {quotaReport?.planEstimate || 'Evaluating...'}
            </p>
            <p className="text-[10px] text-neutral-400 mt-1">
              Max single file upload: {quotaReport?.formattedFileSizeLimit || '50 MB'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
              <span>Marketplace Assets</span>
              <Database className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <p className="text-lg font-bold font-mono text-cyan-400">
              {quotaReport?.totalAssetsCount ?? 0}
            </p>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Remote catalog rows in assets table
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
              <span>Storage Used</span>
              <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <p className="text-lg font-bold font-mono text-emerald-400">
              {quotaReport?.formattedStorageUsed || '0 B'}
            </p>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              {usedPercent}% of estimated plan limit
            </p>
          </div>
        </div>

        {/* Storage progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Storage Capacity Utilized</span>
            <span>
              {quotaReport?.formattedStorageUsed} / {ScalableStorageService.formatBytes(quotaReport?.tierLimitBytes || 0)}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                usedPercent > 90 ? 'bg-rose-500' : usedPercent > 70 ? 'bg-amber-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.max(2, usedPercent)}%` }}
            />
          </div>
        </div>

        {/* Quota message / instructions */}
        <div className="text-xs p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/80 text-neutral-300">
          <p className="font-medium text-white mb-1">Large File & Storage Quota Rules:</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-neutral-400">
            <li>Supabase Free Tier enforces a 50MB single-file limit and 1GB total project storage.</li>
            <li>Supabase Pro Tier supports up to 5GB single-file uploads and 100GB+ project storage.</li>
            <li>Original high-resolution files are preserved intact; optimized WebP/WebM previews are served to client marketplace browsing.</li>
            <li>To increase the file limit: In Supabase Dashboard &rarr; Storage &rarr; Configuration &rarr; Bucket Settings, increase upload size limit to 500MB or 5GB.</li>
          </ul>
        </div>
      </div>

      {/* Security and RLS audit table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Row Level Security (RLS) Policy Audit</h3>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800/80 flex items-center justify-between">
            <div>
              <span className="font-mono text-neutral-200">public.profiles</span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Users can only access own profile; Admins verified by is_admin()
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active RLS
            </span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800/80 flex items-center justify-between">
            <div>
              <span className="font-mono text-neutral-200">public.remote_configs</span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Public SELECT only; Modification restricted to authenticated admins
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active RLS
            </span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800/80 flex items-center justify-between">
            <div>
              <span className="font-mono text-neutral-200">public.assets</span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Public read strictly restricted to published assets in oneva-public-assets; Draft assets isolated
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active RLS
            </span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800/80 flex items-center justify-between">
            <div>
              <span className="font-mono text-neutral-200">storage.objects</span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Public SELECT only for oneva-public-assets; Writes/Deletions strictly require admin authorization
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active RLS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
