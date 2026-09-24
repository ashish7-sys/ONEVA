/**
 * ONEVA Phase 12: Web Intelligence & Multi-Platform Search UI
 * 
 * Displays the real-time multi-platform search lifecycle, generated queries,
 * source credibility rankings, conflict analysis, 3D asset licensing details,
 * offline resilience, and interactive one-click test cases (Tests 1-8).
 */

import { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  Layers,
  Box,
  WifiOff,
  Sparkles,
  RefreshCw,
  Scale,
  FileCode,
  Tag,
  ArrowRight,
  Info,
  Sliders,
} from 'lucide-react';
import {
  JarvisSearchResult,
  ResearchJob,
  SearchIntentCategory,
  SourceCredibility,
} from '../types/jarvisWebResearch';
import { JarvisResearchService } from '../services/intelligence/search/jarvisResearchService';
import { SearchIntentDetector } from '../services/intelligence/search/searchIntentDetector';
import { JarvisVoiceService } from '../services/jarvisVoiceService';

export function JarvisWebResearchView() {
  const [activeJob, setActiveJob] = useState<ResearchJob | null>(JarvisResearchService.getActiveJob());
  const [inputQuery, setInputQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [selectedResult, setSelectedResult] = useState<JarvisSearchResult | null>(null);

  useEffect(() => {
    const unsub = JarvisResearchService.subscribe((job) => {
      setActiveJob({ ...job });
      if (job.stage === 'COMPLETED' || job.stage === 'FAILED') {
        setIsSearching(false);
      }
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsub();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRunSearch = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setInputQuery('');

    // If simulating offline
    if (simulateOffline) {
      // Temporarily mock offline state
      const evaluation = SearchIntentDetector.evaluate(trimmed);
      const mockOfflineJob: ResearchJob = {
        jobId: `offline_${Date.now()}`,
        taskId: `task_offline_${Date.now()}`,
        originalPrompt: trimmed,
        intentCategory: evaluation.category,
        stage: 'FAILED',
        progressPercent: 100,
        currentActivity: 'Offline mode: Network unavailable. Live search prevented.',
        queries: [],
        collectedResults: [],
        startedAt: Date.now(),
        error: 'Network connection unavailable. Live search disabled to prevent fabricated data.',
        findings: {
          directAnswer: 'Device is currently offline. Current live web research requires an active internet connection. No simulated search results are shown.',
          keyFindings: [
            'Offline mode active: Zero fake search queries executed.',
            'Connect device to Wi-Fi or mobile data to query live external indices.',
          ],
          sources: [],
          searchQueriesUsed: [],
          synthesisTimestamp: Date.now(),
          isFromOfflineFallback: true,
        },
      };
      setActiveJob(mockOfflineJob);
      setIsSearching(false);
      return;
    }

    try {
      // Run through full voice / intelligence pipeline
      await JarvisVoiceService.processCommand(trimmed);
      const current = JarvisResearchService.getActiveJob();
      if (current) {
        setActiveJob({ ...current });
      }
    } catch (err) {
      console.error('Research trigger error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const getCredibilityBadge = (cred: SourceCredibility) => {
    switch (cred) {
      case 'OFFICIAL':
        return {
          label: 'Official Authority',
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          icon: <Shield className="w-3 h-3 text-emerald-400" />,
        };
      case 'VERIFIED':
        return {
          label: 'Verified Repository',
          bg: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
          icon: <CheckCircle2 className="w-3 h-3 text-sky-400" />,
        };
      case 'COMMUNITY':
        return {
          label: 'Community / Discussion',
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          icon: <Tag className="w-3 h-3 text-amber-400" />,
        };
      default:
        return {
          label: 'Unverified',
          bg: 'bg-neutral-800 text-neutral-400 border-white/10',
          icon: <Info className="w-3 h-3" />,
        };
    }
  };

  const getCategoryBadge = (cat: SearchIntentCategory) => {
    switch (cat) {
      case 'NORMAL_AI':
        return { label: 'General Knowledge (No Web Search)', color: 'text-neutral-400 border-white/10 bg-white/5' };
      case 'WEB_SEARCH':
        return { label: 'Live Web Search', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' };
      case 'MULTI_SOURCE_RESEARCH':
        return { label: 'Multi-Source Comparison', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' };
      case 'SPECIALIZED_ASSET':
        return { label: '3D Asset / Model Search', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
      case 'DEVICE_ACTION':
        return { label: 'Device Action (Phase 13)', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Container Header */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-sky-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                  Web Intelligence &amp; Multi-Platform Search
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-mono border border-indigo-500/20">
                  Phase 12
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Multi-source research, 3D model licensing verification, source credibility ranking, and conflict detection.
              </p>
            </div>
          </div>

          {/* Network & Simulation Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
                isOnline && !simulateOffline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {isOnline && !simulateOffline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE NETWORK</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>OFFLINE MODE</span>
                </>
              )}
            </div>

            <button
              onClick={() => setSimulateOffline(!simulateOffline)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition ${
                simulateOffline
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {simulateOffline ? 'Disable Offline Sim' : 'Simulate Offline'}
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunSearch(inputQuery);
          }}
          className="relative"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask Jarvis to research (e.g. 'Find a free 3D city model', 'Compare iPhone vs S24')..."
                className="w-full bg-neutral-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500/50 transition font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white transition flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-indigo-900/30"
            >
              {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isSearching ? 'Researching...' : 'Research'}</span>
            </button>
          </div>
        </form>

        {/* Phase 12 Required Test Scenarios (1-8) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              Phase 12 Verification Scenarios
            </span>
            <span className="text-[10px] text-neutral-500">One-click test prompts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* TEST 1 */}
            <button
              onClick={() => handleRunSearch('What is photosynthesis?')}
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400">TEST 1: Normal AI</span>
                <ArrowRight className="w-3 h-3 text-neutral-600 group-hover:text-neutral-300 transition" />
              </div>
              <p className="text-xs text-neutral-300 font-medium line-clamp-1">"What is photosynthesis?"</p>
              <p className="text-[10px] text-neutral-500">No unnecessary web research</p>
            </button>

            {/* TEST 2 */}
            <button
              onClick={() => handleRunSearch('What is the latest news about Android 16 and AI?')}
              className="p-2.5 rounded-xl bg-sky-500/[0.04] hover:bg-sky-500/[0.08] border border-sky-500/10 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-sky-400">TEST 2: Current Web Info</span>
                <ArrowRight className="w-3 h-3 text-sky-500 group-hover:text-sky-300 transition" />
              </div>
              <p className="text-xs text-sky-200 font-medium line-clamp-1">"Latest news Android 16 & AI"</p>
              <p className="text-[10px] text-neutral-500">Triggers live web research</p>
            </button>

            {/* TEST 3 */}
            <button
              onClick={() => handleRunSearch('Compare iPhone 15 Pro vs Samsung S24 Ultra')}
              className="p-2.5 rounded-xl bg-purple-500/[0.04] hover:bg-purple-500/[0.08] border border-purple-500/10 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-purple-400">TEST 3: Multi-Source Comparison</span>
                <ArrowRight className="w-3 h-3 text-purple-500 group-hover:text-purple-300 transition" />
              </div>
              <p className="text-xs text-purple-200 font-medium line-clamp-1">"iPhone 15 Pro vs S24 Ultra"</p>
              <p className="text-[10px] text-neutral-500">Cross-source side-by-side analysis</p>
            </button>

            {/* TEST 6 */}
            <button
              onClick={() => handleRunSearch('Find me a free realistic city environment for my game')}
              className="p-2.5 rounded-xl bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] border border-emerald-500/10 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400">TEST 6: 3D Asset Research</span>
                <ArrowRight className="w-3 h-3 text-emerald-500 group-hover:text-emerald-300 transition" />
              </div>
              <p className="text-xs text-emerald-200 font-medium line-clamp-1">"Free realistic city 3D asset"</p>
              <p className="text-[10px] text-neutral-500">License, format, poly count check</p>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
            {/* TEST 4 */}
            <button
              onClick={() => handleRunSearch('Check Python vs Rust performance benchmarks')}
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400">TEST 4: Provider Resilience</span>
                <ArrowRight className="w-3 h-3 text-neutral-600 group-hover:text-neutral-300 transition" />
              </div>
              <p className="text-xs text-neutral-300 font-medium line-clamp-1">"Python vs Rust Benchmarks"</p>
              <p className="text-[10px] text-neutral-500">Graceful fallback if provider fails</p>
            </button>

            {/* TEST 5 */}
            <button
              onClick={() => handleRunSearch('Is Pluto classified as a planet or dwarf planet?')}
              className="p-2.5 rounded-xl bg-amber-500/[0.04] hover:bg-amber-500/[0.08] border border-amber-500/10 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-400">TEST 5: Disagreement Detection</span>
                <ArrowRight className="w-3 h-3 text-amber-500 group-hover:text-amber-300 transition" />
              </div>
              <p className="text-xs text-amber-200 font-medium line-clamp-1">"Pluto planet classification"</p>
              <p className="text-[10px] text-neutral-500">Explains IAU vs historic discrepancy</p>
            </button>

            {/* TEST 7 */}
            <button
              onClick={() => {
                setSimulateOffline(true);
                handleRunSearch('What is the weather in Tokyo right now?');
              }}
              className="p-2.5 rounded-xl bg-rose-500/[0.04] hover:bg-rose-500/[0.08] border border-rose-500/10 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-rose-400">TEST 7: Offline Resilience</span>
                <ArrowRight className="w-3 h-3 text-rose-500 group-hover:text-rose-300 transition" />
              </div>
              <p className="text-xs text-rose-200 font-medium line-clamp-1">"Tokyo weather while offline"</p>
              <p className="text-[10px] text-neutral-500">Zero fake search results</p>
            </button>

            {/* TEST 8 */}
            <button
              onClick={() => handleRunSearch('Open YouTube and search for Flutter tutorials')}
              className="p-2.5 rounded-xl bg-sky-500/[0.04] hover:bg-sky-500/[0.08] border border-sky-500/10 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-sky-400">TEST 8: Phase 11 Task Preservation</span>
                <ArrowRight className="w-3 h-3 text-sky-500 group-hover:text-sky-300 transition" />
              </div>
              <p className="text-xs text-sky-200 font-medium line-clamp-1">"Open YouTube & search Flutter"</p>
              <p className="text-[10px] text-neutral-500">Preserves Phase 11 multi-step task</p>
            </button>
          </div>
        </div>

        {/* Active Research Job Card */}
        {activeJob && (
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/10 space-y-4">
            {/* Job Header & Stage Tracker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-white">Active Research Job</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${getCategoryBadge(activeJob.intentCategory).color}`}>
                    {getCategoryBadge(activeJob.intentCategory).label}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 font-mono">Prompt: "{activeJob.originalPrompt}"</p>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="w-24 bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      activeJob.stage === 'FAILED' ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-sky-400'
                    }`}
                    style={{ width: `${activeJob.progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-neutral-400">{activeJob.progressPercent}%</span>
              </div>
            </div>

            {/* Current Activity Message */}
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              {activeJob.stage === 'COMPLETED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : activeJob.stage === 'FAILED' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              )}
              <span className="font-mono text-[11px]">{activeJob.currentActivity}</span>
            </div>

            {/* Targeted Queries Generated */}
            {activeJob.queries.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                  Targeted Provider Queries Formulated:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeJob.queries.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex items-start justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="text-neutral-200 font-mono text-[11px] block">"{q.rawQuery}"</span>
                        <span className="text-[10px] text-neutral-500">{q.goal}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-neutral-800 text-neutral-400 border border-white/5 shrink-0">
                        {q.targetProvider}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Synthesized Direct Answer */}
            {activeJob.findings && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/20 to-neutral-900/40 border border-indigo-500/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-white">Synthesized Research Findings</span>
                </div>

                <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                  {activeJob.findings.directAnswer}
                </p>

                {/* Key Findings List */}
                {activeJob.findings.keyFindings.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-white/5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                      Key Takeaways &amp; Verified Points:
                    </span>
                    <ul className="space-y-1">
                      {activeJob.findings.keyFindings.map((finding, idx) => (
                        <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2">
                          <span className="text-indigo-400 shrink-0">•</span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3D Asset Specific Card */}
                {activeJob.findings.assetSummary && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-200">
                          3D Asset Licensing &amp; Specifications
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {activeJob.findings.assetSummary.freeConfirmed ? 'FREE CONFIRMED' : 'COMMERCIAL'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Source Repository</span>
                        <span className="text-neutral-200 font-medium">{activeJob.findings.assetSummary.recommendedSource}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Mesh Formats</span>
                        <span className="text-neutral-200 font-medium">{activeJob.findings.assetSummary.format}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px]">License</span>
                        <span className="text-neutral-200 font-medium">{activeJob.findings.assetSummary.license}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Attribution</span>
                        <span className="text-neutral-200 font-medium">
                          {activeJob.findings.assetSummary.attributionRequired ? 'Credit Required' : 'No Credit Needed'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conflicting Information Section */}
                {activeJob.findings.conflictingInformation?.detected && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Scale className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold">Source Disagreement Detected</span>
                    </div>
                    <p className="text-xs text-neutral-300">
                      {activeJob.findings.conflictingInformation.description}
                    </p>
                    <p className="text-[11px] text-amber-200/90 font-mono">
                      Resolution: {activeJob.findings.conflictingInformation.resolution}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Collected Sources Grid */}
            {activeJob.collectedResults.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Authoritative Sources ({activeJob.collectedResults.length}):
                  </span>
                  <span className="text-[10px] text-neutral-500">Sorted by relevance &amp; credibility</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeJob.collectedResults.map((source) => {
                    const cred = getCredibilityBadge(source.credibility);
                    return (
                      <div
                        key={source.id}
                        className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 hover:border-indigo-500/30 transition space-y-2 flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-[10px] font-mono text-neutral-400">{source.domain}</span>
                            <div className="flex items-center gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border flex items-center gap-1 ${cred.bg}`}>
                                {cred.icon}
                                <span>{cred.label}</span>
                              </span>
                              {source.isRecent && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                  Recent
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className="text-xs font-semibold text-neutral-100 line-clamp-1">{source.title}</h4>
                          <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{source.snippet}</p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                          <span className="text-[10px] font-mono text-neutral-500">
                            Relevance: {Math.round(source.relevance * 100)}%
                          </span>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
