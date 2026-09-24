import { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Database, Key, Check, Loader2 } from 'lucide-react';
import { RemoteConfigService } from '../services/remoteConfigService';
import { ONEVA_CLIENT_CONFIG } from '../core/config';

export function AdminSettings() {
  const [configs, setConfigs] = useState<Record<string, unknown>>({});
  const [source, setSource] = useState<string>('cached');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadConfig = async () => {
    const res = await RemoteConfigService.getAllConfigs();
    setConfigs(res.configs);
    setSource(res.source);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveConfig = async (key: string) => {
    setIsSaving(true);
    let parsed: unknown = editValue;
    try {
      parsed = JSON.parse(editValue);
    } catch {
      // keep string
    }

    const res = await RemoteConfigService.updateConfig(key, parsed);
    setIsSaving(false);

    if (res.success) {
      setConfigs((prev) => ({ ...prev, [key]: parsed }));
      setEditingKey(null);
      setSaveSuccess(key);
      setTimeout(() => setSaveSuccess(null), 3000);
    } else {
      alert(`Update failed: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">System Settings &amp; Remote Config</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Low-level remote key-value parameters, network retry thresholds, and client privacy constraints.
        </p>
      </div>

      {/* Security Architecture Audit */}
      <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Client Security Verification</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-400">Client Secret Key Exposure</span>
            <span className="font-semibold text-emerald-400">Zero (Service Role Protected)</span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-400">Authentication Protocol</span>
            <span className="font-semibold text-emerald-400">Supabase JWT + RLS Policy</span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-400">Offline Fallback System</span>
            <span className="font-semibold text-emerald-400">Last-Known-Good Local Cache</span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-400">Personal Data Ingestion</span>
            <span className="font-semibold text-emerald-400">Disabled by Architecture</span>
          </div>
        </div>
      </div>

      {/* Remote Config Key-Value Editor */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Remote Configurations</h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            Source: <span className="text-neutral-200 uppercase">{source}</span>
          </span>
        </div>

        <div className="divide-y divide-neutral-800/80">
          {Object.entries(configs).map(([key, val]) => (
            <div key={key} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-mono text-neutral-200 font-medium">{key}</span>
                {saveSuccess === key && (
                  <span className="ml-2 inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                    <Check className="w-3 h-3" /> Saved!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {editingKey === key ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleSaveConfig(key)}
                      disabled={isSaving}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 text-neutral-950 font-medium text-xs hover:bg-emerald-400 transition cursor-pointer"
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingKey(null)}
                      className="px-2 py-1 rounded-lg bg-neutral-800 text-neutral-400 text-xs hover:bg-neutral-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <code className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 font-mono text-neutral-300">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </code>
                    <button
                      onClick={() => {
                        setEditingKey(key);
                        setEditValue(typeof val === 'object' ? JSON.stringify(val) : String(val));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
