import { useState, useEffect } from 'react';
import { AlertOctagon, RefreshCw, ShieldAlert, CheckCircle2, Filter } from 'lucide-react';
import { DiagnosticService } from '../services/diagnosticService';
import { ErrorReport, ErrorSeverity } from '../types';

export function AdminErrorReports() {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const fetchReports = async () => {
    setIsLoading(true);
    const data = await DiagnosticService.getReportsForAdmin();
    setReports(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filtered = reports.filter((r) => {
    if (filterSeverity === 'all') return true;
    return r.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Consented Technical Diagnostics</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Privacy-gated error logs and runtime telemetry. Only includes data explicitly authorized by user consent.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Severities</option>
              <option value="fatal">Fatal</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <button
            onClick={fetchReports}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 border border-neutral-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Privacy Guarantee Box */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white block mb-0.5">Privacy-First Architecture Enforced</span>
          <p className="text-neutral-400 leading-relaxed">
            All error reports pass through automated data sanitizers. Messages, phone contacts, WhatsApp content, audio buffers, or tokens are mathematically stripped before logging.
          </p>
        </div>
      </div>

      {/* Reports Table / List */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-white">No Diagnostic Faults Detected</p>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              System running smoothly without active runtime failures or consented diagnostic reports.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {filtered.map((item) => (
              <div key={item.id} className="p-4 hover:bg-neutral-900/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-white">{item.errorCode}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                      item.severity === 'fatal' || item.severity === 'error'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : item.severity === 'warning'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}>
                      {item.severity}
                    </span>
                    <span className="text-xs font-medium text-neutral-400">
                      Module: <span className="text-neutral-200">{item.featureName}</span>
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300">{item.message}</p>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    Client: {item.clientVersion} &bull; Platform: {item.platform} &bull; Consented: {item.userConsented ? 'Yes' : 'No'}
                  </p>
                </div>

                <div className="text-[11px] text-neutral-500 font-mono shrink-0 self-start sm:self-auto">
                  {new Date(item.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
