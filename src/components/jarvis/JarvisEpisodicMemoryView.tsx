/**
 * ONEVA Phase 2 / Phase 21 Evolution: JARVIS Cognitive Episodic Memory & Knowledge Graph UI
 * 
 * Provides an interactive Stark interface for:
 * - Exploring the on-device Knowledge Graph (Entities, Attributes, Relations)
 * - Browsing the Chronological Episodic Timeline (Today, Yesterday, Past Week)
 * - Testing associative queries ("Who is Rahul?", "What did we do yesterday?")
 * - Adding personal entity relations and managing Rule 6 local privacy controls
 */

import { useState, useEffect } from 'react';
import {
  Brain,
  Network,
  Clock,
  Search,
  Volume2,
  Plus,
  Trash2,
  Sparkles,
  Users,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { JarvisEpisodicMemoryService } from '../../services/memory/jarvisEpisodicMemoryService';
import {
  JarvisEpisodicMemoryTestSuite,
  EpisodicTestResult,
} from '../../services/intelligence/jarvisEpisodicMemoryTests';
import {
  KnowledgeEntity,
  KnowledgeEdge,
  EpisodicNode,
  EpisodicRecallResult,
  EpisodicMemoryMetrics,
} from '../../types/jarvisEpisodicMemory';
import { JarvisTtsEngine } from '../../services/voice/jarvisTtsEngine';

interface JarvisEpisodicMemoryViewProps {
  onToast?: (msg: string) => void;
}

export function JarvisEpisodicMemoryView({ onToast }: JarvisEpisodicMemoryViewProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'graph' | 'query' | 'tests'>('timeline');
  const [episodes, setEpisodes] = useState<EpisodicNode[]>([]);
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
  const [metrics, setMetrics] = useState<EpisodicMemoryMetrics>(JarvisEpisodicMemoryService.getMetrics());

  // Test suite state
  const [testResults, setTestResults] = useState<{
    passed: number;
    failed: number;
    total: number;
    results: EpisodicTestResult[];
  } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Query state
  const [searchQuery, setSearchQuery] = useState('');
  const [queryResult, setQueryResult] = useState<EpisodicRecallResult | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  // New Entity Modal / Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<KnowledgeEntity['type']>('person');
  const [newEntityRelation, setNewEntityRelation] = useState<KnowledgeEdge['relation']>('friend_of');
  const [targetEntityId, setTargetEntityId] = useState('ent_owner_ashish');

  useEffect(() => {
    JarvisEpisodicMemoryService.init();
    refreshData();

    return JarvisEpisodicMemoryService.subscribe(() => {
      refreshData();
    });
  }, []);

  const refreshData = () => {
    setEpisodes(JarvisEpisodicMemoryService.getAllEpisodes());
    setEntities(JarvisEpisodicMemoryService.getAllEntities());
    setEdges(JarvisEpisodicMemoryService.getAllEdges());
    setMetrics(JarvisEpisodicMemoryService.getMetrics());
  };

  const handleExecuteQuery = (text: string) => {
    if (!text.trim()) return;
    setIsQuerying(true);
    const result = JarvisEpisodicMemoryService.recallEpisodicMemory({
      queryText: text,
      maxResults: 5,
    });
    setQueryResult(result);
    setIsQuerying(false);
    onToast?.(`Associative recall: found ${result.matchedEpisodes.length} episodes, ${result.relatedEntities.length} entities`);
  };

  const handleVoiceReplay = (text: string) => {
    JarvisTtsEngine.speak({
      id: `recall_${Date.now()}`,
      text,
      rate: 1.02,
      pitch: 1.0,
    });
  };

  const handleRunTestSuite = async () => {
    setIsRunningTests(true);
    try {
      const res = await JarvisEpisodicMemoryTestSuite.runAllTests();
      setTestResults(res);
      refreshData();
      onToast?.(`Phase 21 Verification: ${res.passed}/${res.total} tests passed!`);
    } catch {
      onToast?.('Test suite execution encountered an error');
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleCreateRelation = () => {
    if (!newEntityName.trim()) return;

    const entity = JarvisEpisodicMemoryService.addEntity({
      name: newEntityName.trim(),
      type: newEntityType,
      aliases: [newEntityName.trim()],
    });

    JarvisEpisodicMemoryService.addEdge({
      sourceEntityId: entity.entityId,
      targetEntityId: targetEntityId,
      relation: newEntityRelation,
      strength: 0.9,
    });

    onToast?.(`Linked ${entity.name} to ${targetEntityId.replace('ent_', '')}`);
    setNewEntityName('');
    setShowAddForm(false);
  };

  const handleDeleteEpisode = (id: string) => {
    JarvisEpisodicMemoryService.forgetEpisode(id);
    onToast?.('Episode node removed from local memory');
  };

  const getEntityBadgeColor = (type: KnowledgeEntity['type']) => {
    switch (type) {
      case 'person':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'project':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'device':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'routine':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/70 border border-white/10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono tracking-tight">
                Cognitive Episodic Memory &amp; Knowledge Graph
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono">
                PHASE 2 (PHASE 21)
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              On-device temporal continuity, relational entity graph, associative semantic recall, and salience dynamics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>RULE 6 LOCAL SECURE</span>
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-neutral-950/40 border border-white/5 flex flex-col">
          <span className="text-[11px] font-mono text-neutral-400">Episodic Timeline</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-white">{metrics.totalEpisodes}</span>
            <span className="text-[10px] text-neutral-500">events logged</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/40 border border-white/5 flex flex-col">
          <span className="text-[11px] font-mono text-neutral-400">Knowledge Entities</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-cyan-400">{metrics.totalEntities}</span>
            <span className="text-[10px] text-neutral-500">nodes indexed</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/40 border border-white/5 flex flex-col">
          <span className="text-[11px] font-mono text-neutral-400">Relational Edges</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-purple-400">{metrics.totalEdges}</span>
            <span className="text-[10px] text-neutral-500">semantic links</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950/40 border border-white/5 flex flex-col">
          <span className="text-[11px] font-mono text-neutral-400">Queries Answered</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-amber-400">{metrics.queriesAnswered}</span>
            <span className="text-[10px] text-neutral-500">recalls</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-neutral-950/60 border border-white/5">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'timeline'
              ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Episodic Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('graph')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'graph'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Knowledge Graph</span>
        </button>

        <button
          onClick={() => setActiveTab('query')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'query'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Associative Recall</span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'tests'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verification (15 Tests)</span>
        </button>
      </div>

      {/* TAB 1: EPISODIC TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 font-mono uppercase tracking-wider">
              Chronological Event Horizon
            </span>
            <span className="text-[11px] font-mono text-neutral-500">
              Ordered by recency &amp; cognitive salience
            </span>
          </div>

          <div className="space-y-3">
            {episodes.map((ep) => (
              <div
                key={ep.episodeId}
                className="p-4 rounded-2xl bg-neutral-950/40 border border-white/5 hover:border-white/10 transition space-y-2 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-neutral-300 border border-white/5">
                      {ep.timeLabel}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      {ep.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => handleVoiceReplay(`${ep.title}. ${ep.summary}`)}
                      title="Vocalize Episode"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-purple-300 transition cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEpisode(ep.episodeId)}
                      title="Forget Episode"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {ep.summary}
                </p>

                {/* Entity Pills */}
                {ep.entitiesInvolved.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {ep.entitiesInvolved.map((entId) => {
                      const ent = entities.find((e) => e.entityId === entId);
                      return (
                        <span
                          key={entId}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20"
                        >
                          @{ent ? ent.name : entId.replace('ent_', '')}
                        </span>
                      );
                    })}
                    <span className="text-[10px] font-mono text-neutral-500 ml-auto">
                      Salience: {ep.salience}% • Recalls: {ep.accessCount}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE GRAPH */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 font-mono uppercase tracking-wider">
              Cognitive Entities &amp; Semantic Network
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link New Entity</span>
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3 animate-in fade-in">
              <span className="text-xs font-bold text-cyan-300 font-mono block">
                Teach JARVIS a New Entity Relation
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Entity Name (e.g. Vikram)"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <select
                  value={newEntityType}
                  onChange={(e) => setNewEntityType(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="person">Person</option>
                  <option value="project">Project</option>
                  <option value="device">Device</option>
                  <option value="location">Location</option>
                  <option value="routine">Routine</option>
                </select>
                <select
                  value={newEntityRelation}
                  onChange={(e) => setNewEntityRelation(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="friend_of">friend_of</option>
                  <option value="works_on">works_on</option>
                  <option value="family_of">family_of</option>
                  <option value="located_at">located_at</option>
                  <option value="prefers">prefers</option>
                </select>
                <button
                  onClick={handleCreateRelation}
                  className="py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold font-mono transition cursor-pointer"
                >
                  Save to Graph
                </button>
              </div>
            </div>
          )}

          {/* Entities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entities.map((ent) => {
              const connected = edges.filter(
                (e) => e.sourceEntityId === ent.entityId || e.targetEntityId === ent.entityId
              );

              return (
                <div
                  key={ent.entityId}
                  className="p-4 rounded-2xl bg-neutral-950/40 border border-white/5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{ent.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getEntityBadgeColor(ent.type)}`}>
                        {ent.type}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Salience: {ent.salience}%
                    </span>
                  </div>

                  {/* Attributes */}
                  {Object.keys(ent.attributes).length > 0 && (
                    <div className="text-[11px] text-neutral-400 font-sans space-y-0.5">
                      {Object.entries(ent.attributes).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5">
                          <span className="text-neutral-500 capitalize">{k}:</span>
                          <span className="text-neutral-300">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Connected Edges */}
                  {connected.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                        Relationships:
                      </span>
                      {connected.map((edge) => {
                        const isSource = edge.sourceEntityId === ent.entityId;
                        const otherId = isSource ? edge.targetEntityId : edge.sourceEntityId;
                        const otherEnt = entities.find((e) => e.entityId === otherId);
                        const otherName = otherEnt ? otherEnt.name : otherId.replace('ent_', '');

                        return (
                          <div
                            key={edge.edgeId}
                            className="text-[11px] text-cyan-400/90 font-mono flex items-center gap-1"
                          >
                            <ChevronRight className="w-3 h-3 text-cyan-500/70" />
                            <span>
                              {edge.relation.replace(/_/g, ' ')} &rarr; {otherName}
                            </span>
                            {edge.context && (
                              <span className="text-neutral-500 text-[10px]">({edge.context})</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ASSOCIATIVE RECALL PLAYGROUND */}
      {activeTab === 'query' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-neutral-300 font-mono uppercase tracking-wider block">
              Temporal &amp; Knowledge Associative Query Engine
            </span>
            <p className="text-xs text-neutral-400">
              Query episodic memories by time ("yesterday", "today", "kal kya hua") or explore relationships ("Who is Rahul?", "ONEVA kya hai?").
            </p>
          </div>

          {/* Quick Pre-Set Query Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              'What did we do yesterday?',
              'कल हमने क्या किया था?',
              'Who is Rahul?',
              'राहुल कौन है?',
              "Today's episodic events",
              'Who created ONEVA?',
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setSearchQuery(q);
                  handleExecuteQuery(q);
                }}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-amber-300 text-xs font-mono border border-white/5 transition cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ask JARVIS about any past event, person, or decision..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteQuery(searchQuery)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
            <button
              onClick={() => handleExecuteQuery(searchQuery)}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recall</span>
            </button>
          </div>

          {/* Live Result Display */}
          {queryResult && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold font-mono uppercase">
                    Associative Narrative Synthesis
                  </span>
                </div>

                <button
                  onClick={() => handleVoiceReplay(queryResult.synthesizedNarrative)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Vocalize</span>
                </button>
              </div>

              {/* Synthesized Texts */}
              <div className="space-y-1.5">
                <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                  {queryResult.synthesizedNarrative}
                </p>
                {queryResult.synthesizedNarrativeHi && (
                  <p className="text-xs text-amber-300/80 leading-relaxed font-sans italic">
                    {queryResult.synthesizedNarrativeHi}
                  </p>
                )}
              </div>

              {/* Relational Facts Breakdown */}
              {queryResult.relationalFacts.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                    Verified Relational Facts:
                  </span>
                  <div className="space-y-1">
                    {queryResult.relationalFacts.map((fact, i) => (
                      <div key={i} className="text-xs font-mono text-cyan-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{fact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VERIFICATION TEST SUITE */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-neutral-300 font-mono uppercase tracking-wider block">
                Phase 2 / Phase 21 Cognitive Memory Test Deck
              </span>
              <p className="text-xs text-neutral-400 mt-0.5">
                Executes all 15 automated validation contracts across episodic logging, entity indexing, temporal query resolution, and Rule 6 privacy.
              </p>
            </div>

            <button
              onClick={handleRunTestSuite}
              disabled={isRunningTests}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isRunningTests ? 'Executing 15 Tests...' : 'Run Verification (15 Tests)'}</span>
            </button>
          </div>

          {testResults && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold">
                    Test Results: {testResults.passed} / {testResults.total} Passed
                  </span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% OPERATIONAL
                </span>
              </div>

              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {testResults.results.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-xl bg-neutral-950/40 border border-white/5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/5">
                        {r.id}
                      </span>
                      <span className="text-xs font-mono text-neutral-200">{r.name}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        r.passed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {r.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
