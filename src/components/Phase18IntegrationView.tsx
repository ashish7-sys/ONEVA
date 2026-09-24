import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Search,
  Lock,
  Smartphone,
  Cpu,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { OnevaPhase18TestSuite, Phase18TestResult } from '../services/intelligence/onevaPhase18TestSuite';

export const Phase18IntegrationView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Phase18TestResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTestId, setExpandedTestId] = useState<number | null>(null);
  const [summary, setSummary] = useState<{
    passed: number;
    failed: number;
    total: number;
    rate: number;
  } | null>(null);

  // Auto-run once on mount or allow manual execution
  const handleRunAll = async () => {
    setIsRunning(true);
    try {
      const suite = await OnevaPhase18TestSuite.runAllTests();
      setResults(suite.results);
      setSummary({
        passed: suite.passedCount,
        failed: suite.failedCount,
        total: suite.totalCount,
        rate: suite.successRate,
      });
    } catch (e) {
      console.error('[Phase18IntegrationView] Test run error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    handleRunAll();
  }, []);

  const categories = ['all', ...Array.from(new Set(results.map((r) => r.category)))];

  const filteredResults =
    selectedCategory === 'all'
      ? results
      : results.filter((r) => r.category === selectedCategory);

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/60 border border-emerald-500/20 space-y-6 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight font-mono">
                ONEVA Phase 18: System-Wide Integration Matrix
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono uppercase font-semibold">
                40 Tests
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Full system integration, end-to-end reliability verification, and hardware performance audit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleRunAll}
            disabled={isRunning}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs transition hover:bg-emerald-400 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing Subsystems...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Re-run Matrix</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500">Integration Pass Rate</span>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold font-mono ${summary.rate === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {summary.rate}%
              </span>
              <span className="text-[10px] font-mono text-neutral-400">({summary.passed}/{summary.total})</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500">Security &amp; Privacy (Rule 6)</span>
            <div className="flex items-center gap-2">
              {(() => {
                const secTests = results.filter((r) => r.category === 'Security Boundary' || r.category === 'Data Boundary');
                const secPassed = secTests.filter((r) => r.passed).length;
                const secRate = secTests.length ? Math.round((secPassed / secTests.length) * 100) : 100;
                return (
                  <span className={`text-xl font-bold font-mono ${secRate === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {secRate}% PASS ({secPassed}/{secTests.length})
                  </span>
                );
              })()}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500">Overlay Blending (Rule 5)</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-mono text-cyan-400">NON-PERMANENT</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500">Subsystem Isolation</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-mono text-purple-400">INDEPENDENT</span>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-white text-black font-semibold'
                : 'bg-black/30 hover:bg-black/60 text-neutral-400 border border-white/5'
            }`}
          >
            {cat} {cat === 'all' && `(${results.length})`}
          </button>
        ))}
      </div>

      {/* Test Results Table / Cards */}
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {filteredResults.map((r) => {
          const isExpanded = expandedTestId === r.id;
          return (
            <div
              key={r.id}
              className={`p-3.5 rounded-xl border transition ${
                r.passed
                  ? 'bg-black/30 border-white/5 hover:border-emerald-500/20'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div
                className="flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                onClick={() => setExpandedTestId(isExpanded ? null : r.id)}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="mt-0.5 sm:mt-0 shrink-0">
                    {r.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-500">TEST {r.id}:</span>
                      <span className="text-xs font-semibold text-white tracking-tight">{r.name}</span>
                      <span className="text-[10px] font-mono text-neutral-500 px-1.5 py-0.5 rounded bg-white/5">
                        {r.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-mono line-clamp-1">{r.actual}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono text-neutral-500">{r.durationMs}ms</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-2 text-[11px] font-mono animate-in fade-in duration-150">
                  <div>
                    <span className="text-neutral-500 uppercase text-[9px] block">Expected Behavior:</span>
                    <span className="text-neutral-300">{r.expected}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase text-[9px] block">Actual Output:</span>
                    <span className="text-emerald-300">{r.actual}</span>
                  </div>
                  {r.technicalDetails && (
                    <div>
                      <span className="text-neutral-500 uppercase text-[9px] block">Technical Context:</span>
                      <span className="text-neutral-400">{r.technicalDetails}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
