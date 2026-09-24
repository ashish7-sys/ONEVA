import { useState } from 'react';
import { Layers, CheckCircle2, Clock, Shield, Sliders } from 'lucide-react';
import { getAllFeatures } from '../features/registry';
import { FeatureStatus, FeatureManifest } from '../types';

export function AdminFeatureManagement() {
  const [features, setFeatures] = useState<FeatureManifest[]>(getAllFeatures());
  const [selectedFeature, setSelectedFeature] = useState<FeatureManifest>(features[0]);

  const updateStatusLocally = (id: string, newStatus: FeatureStatus) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
    );
    if (selectedFeature.id === id) {
      setSelectedFeature((prev) => ({ ...prev, status: newStatus }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Feature Management Foundation</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Remote feature flags, version targeting, rollout state, and Android OS compatibility manifests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature List */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider px-1">
            Registered Modules
          </div>
          <div className="space-y-1.5">
            {features.map((feat) => (
              <button
                key={feat.id}
                onClick={() => setSelectedFeature(feat)}
                className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                  selectedFeature.id === feat.id
                    ? 'bg-neutral-800 border-neutral-700 text-white shadow-lg'
                    : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                <div>
                  <p className="text-xs font-semibold">{feat.name}</p>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">v{feat.version}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border capitalize ${
                  feat.status === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : feat.status === 'testing'
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}>
                  {feat.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Specification & Remote Config Detail */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{selectedFeature.name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                  {selectedFeature.id}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">{selectedFeature.tagline}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Rollout Status:</span>
              <select
                value={selectedFeature.status}
                onChange={(e) => updateStatusLocally(selectedFeature.id, e.target.value as FeatureStatus)}
                className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="draft">draft</option>
                <option value="testing">testing</option>
                <option value="verified">verified</option>
                <option value="published">published</option>
                <option value="disabled">disabled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800/80">
              <span className="text-neutral-400 block mb-1">Target Android Platforms</span>
              <div className="flex gap-1.5 flex-wrap mt-1">
                {selectedFeature.supportedAndroidVersions.map((v) => (
                  <span key={v} className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-mono text-[11px]">
                    Android {v}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800/80">
              <span className="text-neutral-400 block mb-1">Minimum Client Version</span>
              <span className="font-mono text-neutral-200 text-sm">{selectedFeature.minClientVersion}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800/80">
              <span className="text-neutral-400 block mb-1">Execution Sandbox</span>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                <span>{selectedFeature.isLocalOnly ? 'Local On-Device Only' : 'Cloud Remote Sync'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800/80">
              <span className="text-neutral-400 block mb-1">Remote Config Binding Key</span>
              <span className="font-mono text-emerald-400 text-xs truncate block">
                {selectedFeature.remoteConfigKey || 'None'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-neutral-300 block mb-2">Module Description</span>
            <p className="text-xs text-neutral-400 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800/80 leading-relaxed">
              {selectedFeature.description}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              This schema is bound to the PostgreSQL <code className="text-neutral-300 font-mono">features</code> &amp; <code className="text-neutral-300 font-mono">feature_versions</code> tables via Supabase RLS.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
