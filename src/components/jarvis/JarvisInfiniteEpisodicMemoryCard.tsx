/**
 * ONEVA Phase 24: Real-JARVIS Infinite Episodic Vector Memory & Knowledge Graph Card
 * 
 * Interactive holographic card displaying timeline episodes, vector semantic
 * query retrieval, and relational knowledge entities on-device.
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Network,
  Clock,
  Search,
  Sparkles,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { JarvisEpisodicMemoryService } from '../../services/memory/jarvisEpisodicMemoryService';
import {
  EpisodicNode,
  KnowledgeEntity,
  EpisodicRecallResult,
  EpisodicMemoryMetrics,
} from '../../types/jarvisEpisodicMemory';

interface JarvisInfiniteEpisodicMemoryCardProps {
  onToast?: (msg: string) => void;
}

export const JarvisInfiniteEpisodicMemoryCard: React.FC<JarvisInfiniteEpisodicMemoryCardProps> = ({
  onToast,
}) => {
  const [metrics, setMetrics] = useState<EpisodicMemoryMetrics>(() =>
    JarvisEpisodicMemoryService.getMetrics()
  );
  const [episodes, setEpisodes] = useState<EpisodicNode[]>(() =>
    JarvisEpisodicMemoryService.getAllEpisodes()
  );
  const [entities, setEntities] = useState<KnowledgeEntity[]>(() =>
    JarvisEpisodicMemoryService.getAllEntities()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [recallResult, setRecallResult] = useState<EpisodicRecallResult | null>(null);
  const [filterWindow, setFilterWindow] = useState<'all' | 'today' | 'yesterday' | 'this_week'>('all');

  useEffect(() => {
    JarvisEpisodicMemoryService.init();
    const unsub = JarvisEpisodicMemoryService.subscribe(() => {
      setMetrics(JarvisEpisodicMemoryService.getMetrics());
      setEpisodes(JarvisEpisodicMemoryService.getAllEpisodes());
      setEntities(JarvisEpisodicMemoryService.getAllEntities());
    });
    return unsub;
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setRecallResult(null);
      return;
    }

    const res = JarvisEpisodicMemoryService.recallEpisodicMemory({
      queryText: searchQuery,
      timeWindow: filterWindow,
      maxResults: 4,
    });
    setRecallResult(res);
    onToast?.(`Recalled ${res.matchedEpisodes.length} episodes via Vector Semantic Similarity`);
  };

  const displayedEpisodes = recallResult
    ? recallResult.matchedEpisodes
    : filterWindow === 'all'
    ? episodes.slice(0, 5)
    : episodes.filter((ep) => {
        if (filterWindow === 'today') return ep.timeFrame === 'today';
        if (filterWindow === 'yesterday') return ep.timeFrame === 'yesterday';
        return ep.timeFrame === 'this_week' || ep.timeFrame === 'today' || ep.timeFrame === 'yesterday';
      }).slice(0, 5);

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/70 border border-violet-500/20 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-sm shadow-violet-950">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Stark Infinite Episodic Vector Memory
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                REAL-JARVIS TIER
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              High-dimensional cosine associative recall and on-device knowledge graph traversal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% LOCAL ENCRYPTED</span>
          </div>
        </div>
      </div>

      {/* Memory Telemetry Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>EPISODES</span>
            <Clock className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="text-xl font-bold text-violet-300 font-mono">
            {metrics.totalEpisodes}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Chronological timeline</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>ENTITIES</span>
            <Network className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-300 font-mono">
            {metrics.totalEntities}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Relational nodes</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>GRAPH EDGES</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 font-mono">
            {metrics.totalEdges}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Cross-entity links</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>RECALLS</span>
            <Database className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono">
            {metrics.queriesAnswered}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">Vector queries solved</div>
        </div>
      </div>

      {/* Semantic Vector Search Input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Vector semantic search (e.g., 'What did we do yesterday?', 'device performance')..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-950 border border-white/10 text-white placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-violet-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-violet-950"
        >
          <span>Query</span>
        </button>
      </form>

      {/* Timeline Window Filter Chips */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex gap-1.5">
          {(['all', 'today', 'yesterday', 'this_week'] as const).map((win) => (
            <button
              key={win}
              type="button"
              onClick={() => {
                setFilterWindow(win);
                setRecallResult(null);
              }}
              className={`px-2.5 py-1 rounded-xl uppercase text-[10px] transition cursor-pointer ${
                filterWindow === win
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                  : 'bg-neutral-950/60 text-neutral-400 hover:text-white border border-white/5'
              }`}
            >
              {win.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {recallResult && (
          <button
            type="button"
            onClick={() => {
              setRecallResult(null);
              setSearchQuery('');
            }}
            className="text-[10px] text-violet-400 hover:underline cursor-pointer"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Recalled Narrative Synthesizer Response (if any) */}
      {recallResult && recallResult.synthesizedNarrative && (
        <div className="p-4 rounded-2xl bg-violet-950/20 border border-violet-500/30 text-xs font-mono space-y-1">
          <div className="text-violet-300 font-bold uppercase text-[10px]">
            Stark Episodic Narrative Synthesis:
          </div>
          <p className="text-neutral-200">{recallResult.synthesizedNarrative}</p>
        </div>
      )}

      {/* Timeline Episodes List */}
      <div className="space-y-2.5">
        <div className="text-xs text-neutral-400 font-mono">
          CHRONOLOGICAL EPISODES ({displayedEpisodes.length})
        </div>

        {displayedEpisodes.length === 0 ? (
          <div className="p-4 rounded-2xl bg-neutral-950/40 border border-white/5 text-center text-neutral-500 text-xs font-mono">
            No episodic memories matching current query.
          </div>
        ) : (
          displayedEpisodes.map((ep) => (
            <div
              key={ep.episodeId}
              className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/5 hover:border-violet-500/30 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">{ep.title}</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Salience: {ep.salience}%
                </span>
              </div>
              <p className="text-xs text-neutral-300">{ep.summary}</p>
              <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1">
                <span>{new Date(ep.timestamp).toLocaleString()}</span>
                <span className="uppercase text-neutral-400">{ep.intentCategory}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Knowledge Entities Chips */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="text-xs text-neutral-400 font-mono">
          DISCOVERED KNOWLEDGE ENTITIES ({entities.length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {entities.map((ent) => (
            <span
              key={ent.entityId}
              className="px-2.5 py-1 rounded-xl bg-neutral-950 border border-white/10 text-xs font-mono text-neutral-300 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span>{ent.name}</span>
              <span className="text-[9px] text-neutral-500 uppercase">({ent.type})</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
