/**
 * ONEVA Phase 2 / Phase 21 Evolution: JARVIS Cognitive Episodic Memory & Knowledge Graph Service
 * 
 * Provides on-device episodic continuity, temporal associative recall,
 * relational knowledge graph traversal, and salience dynamics.
 * 
 * Strictly follows Rule 6: Zero cloud data transmission. 100% On-device storage.
 */

import {
  KnowledgeEntity,
  KnowledgeEdge,
  EpisodicNode,
  EpisodicRecallQuery,
  EpisodicRecallResult,
  EpisodicMemoryMetrics,
  KnowledgeEntityType,
} from '../../types/jarvisEpisodicMemory';

const STORAGE_KEY_EPISODES = 'oneva_jarvis_episodes_v1';
const STORAGE_KEY_ENTITIES = 'oneva_jarvis_entities_v1';
const STORAGE_KEY_EDGES = 'oneva_jarvis_edges_v1';
const STORAGE_KEY_METRICS = 'oneva_jarvis_episodic_metrics_v1';

export class JarvisEpisodicMemoryService {
  private static isInitialized = false;
  private static episodes: EpisodicNode[] = [];
  private static entities: Map<string, KnowledgeEntity> = new Map();
  private static edges: KnowledgeEdge[] = [];
  private static metrics: EpisodicMemoryMetrics = {
    totalEpisodes: 0,
    totalEntities: 0,
    totalEdges: 0,
    lastDecayRunTimestamp: Date.now(),
    queriesAnswered: 0,
  };
  private static listeners: Set<() => void> = new Set();

  /**
   * Initializes the Cognitive Episodic Memory Subsystem
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.loadFromStorage();

    // Ensure default core seed knowledge exists
    if (this.entities.size === 0) {
      this.seedDefaultKnowledgeGraph();
    }

    this.updateMetrics();
  }

  /**
   * Records a rich chronological episodic event
   */
  static recordEpisode(input: {
    title: string;
    summary: string;
    details?: string;
    intentCategory: string;
    entitiesInvolved?: string[];
    salience?: number;
    emotionalTone?: 'focused' | 'urgent' | 'casual' | 'informative';
    timestamp?: number;
  }): EpisodicNode {
    this.init();

    const now = input.timestamp || Date.now();
    const episodeDate = new Date(now);
    const today = new Date();

    const isToday = episodeDate.toDateString() === today.toDateString();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = episodeDate.toDateString() === yesterday.toDateString();

    const timeFrame = isToday ? 'today' : isYesterday ? 'yesterday' : 'this_week';
    const hours = episodeDate.getHours().toString().padStart(2, '0');
    const mins = episodeDate.getMinutes().toString().padStart(2, '0');
    const timeLabel = isToday
      ? `Today at ${hours}:${mins}`
      : isYesterday
      ? `Yesterday at ${hours}:${mins}`
      : `${episodeDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at ${hours}:${mins}`;

    // Auto-detect any known entities in the title or summary if none passed
    const detectedEntityIds = new Set<string>(input.entitiesInvolved || []);
    const searchCorpus = `${input.title} ${input.summary} ${input.details || ''}`.toLowerCase();

    this.entities.forEach((ent) => {
      if (
        searchCorpus.includes(ent.name.toLowerCase()) ||
        ent.aliases.some((al) => searchCorpus.includes(al.toLowerCase()))
      ) {
        detectedEntityIds.add(ent.entityId);
      }
    });

    const episode: EpisodicNode = {
      episodeId: `ep_${now}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      timeFrame,
      timeLabel,
      title: input.title,
      summary: input.summary,
      details: input.details,
      intentCategory: input.intentCategory,
      entitiesInvolved: Array.from(detectedEntityIds),
      salience: input.salience ?? 80,
      accessCount: 0,
      lastRecalledAt: now,
      emotionalTone: input.emotionalTone ?? 'focused',
    };

    // Insert at front
    this.episodes.unshift(episode);

    // Keep memory capped at 150 most salient items
    if (this.episodes.length > 150) {
      this.episodes.sort((a, b) => b.salience - a.salience);
      this.episodes = this.episodes.slice(0, 150);
      this.episodes.sort((a, b) => b.timestamp - a.timestamp);
    }

    this.persistToStorage();
    this.updateMetrics();
    this.notify();

    return episode;
  }

  /**
   * Registers a new entity in the cognitive graph
   */
  static addEntity(entityInput: {
    entityId?: string;
    name: string;
    type: KnowledgeEntityType;
    aliases?: string[];
    attributes?: Record<string, string | number | boolean>;
    salience?: number;
  }): KnowledgeEntity {
    this.init();

    const id =
      entityInput.entityId ||
      `ent_${entityInput.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const now = Date.now();

    const entity: KnowledgeEntity = {
      entityId: id,
      name: entityInput.name,
      type: entityInput.type,
      aliases: entityInput.aliases || [],
      attributes: entityInput.attributes || {},
      salience: entityInput.salience ?? 75,
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
      lastRecalledAt: now,
    };

    this.entities.set(id, entity);
    this.persistToStorage();
    this.updateMetrics();
    this.notify();

    return entity;
  }

  /**
   * Adds or updates a relational edge between two entities
   */
  static addEdge(edgeInput: {
    sourceEntityId: string;
    targetEntityId: string;
    relation: KnowledgeEdge['relation'];
    strength?: number;
    bidirectional?: boolean;
    context?: string;
  }): KnowledgeEdge {
    this.init();

    // Check if edge already exists
    const existingIndex = this.edges.findIndex(
      (e) =>
        e.sourceEntityId === edgeInput.sourceEntityId &&
        e.targetEntityId === edgeInput.targetEntityId &&
        e.relation === edgeInput.relation
    );

    const now = Date.now();
    const edge: KnowledgeEdge = {
      edgeId: `edge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sourceEntityId: edgeInput.sourceEntityId,
      targetEntityId: edgeInput.targetEntityId,
      relation: edgeInput.relation,
      strength: edgeInput.strength ?? 0.85,
      bidirectional: edgeInput.bidirectional ?? false,
      context: edgeInput.context,
      createdAt: existingIndex >= 0 ? this.edges[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      this.edges[existingIndex] = edge;
    } else {
      this.edges.push(edge);
    }

    this.persistToStorage();
    this.updateMetrics();
    this.notify();

    return edge;
  }

  /**
   * Finds an entity by name or alias
   */
  static findEntity(query: string): KnowledgeEntity | undefined {
    this.init();
    const q = query.trim().toLowerCase();
    for (const ent of this.entities.values()) {
      if (
        ent.name.toLowerCase() === q ||
        ent.aliases.some((a) => a.toLowerCase() === q) ||
        ent.entityId.toLowerCase() === q
      ) {
        return ent;
      }
    }
    return undefined;
  }

  /**
   * Recalls episodic memories and relational facts associatively
   */
  static recallEpisodicMemory(query: EpisodicRecallQuery): EpisodicRecallResult {
    this.init();
    this.metrics.queriesAnswered++;

    const rawText = query.queryText.toLowerCase().trim();
    const isYesterdayQuery =
      /(?:^|\s|[^\w])(yesterday|kal|kal ka|kal kya|बीता हुआ कल|बीते हुए कल)(?:$|\s|[^\w])/i.test(rawText) ||
      rawText.includes('कल');
    const isTodayQuery =
      /(?:^|\s|[^\w])(today|aaj|aaj ka|aaj subah|this morning)(?:$|\s|[^\w])/i.test(rawText) ||
      rawText.includes('आज');
    const isPersonQuery =
      /\b(who is|kaun hai|tell me about|kon hai)\b/i.test(rawText) ||
      rawText.includes('कौन है') ||
      rawText.includes('कौन हैं');

    // 1. Time-window filtering
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

    let filteredEpisodes = [...this.episodes];

    if (isYesterdayQuery || query.timeWindow === 'yesterday') {
      filteredEpisodes = filteredEpisodes.filter(
        (e) => e.timestamp >= startOfYesterday && e.timestamp < startOfToday
      );
    } else if (isTodayQuery || query.timeWindow === 'today') {
      filteredEpisodes = filteredEpisodes.filter((e) => e.timestamp >= startOfToday);
    } else if (query.timeWindow === 'this_week') {
      filteredEpisodes = filteredEpisodes.filter((e) => e.timestamp >= startOfWeek);
    }

    // 2. High-Dimensional Vector Cosine Similarity scoring
    if (!isYesterdayQuery && !isTodayQuery) {
      filteredEpisodes = filteredEpisodes
        .map((ep) => {
          const corpus = `${ep.title} ${ep.summary} ${ep.details || ''} ${ep.intentCategory}`.toLowerCase();
          const vectorScore = this.calculateVectorCosineSimilarity(rawText, corpus);
          return { ep, score: vectorScore * 0.65 + (ep.salience / 100) * 0.35 };
        })
        .filter((item) => item.score > 0.12)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.ep);
    } else {
      // Order by salience and recency
      filteredEpisodes.sort((a, b) => b.salience - a.salience || b.timestamp - a.timestamp);
    }
    const matchedEpisodes = filteredEpisodes.slice(0, query.maxResults || 5);

    // Boost recalled episodes
    matchedEpisodes.forEach((ep) => {
      ep.accessCount++;
      ep.lastRecalledAt = Date.now();
      ep.salience = Math.min(100, ep.salience + 5);
    });

    // 3. Knowledge Graph Entities & Edges Resolution
    const matchedEntityIds = new Set<string>();
    matchedEpisodes.forEach((ep) => ep.entitiesInvolved.forEach((id) => matchedEntityIds.add(id)));

    // If query targets a specific person/entity
    for (const ent of this.entities.values()) {
      if (
        rawText.includes(ent.name.toLowerCase()) ||
        ent.aliases.some((al) => rawText.includes(al.toLowerCase()))
      ) {
        matchedEntityIds.add(ent.entityId);
      }
    }

    const relatedEntities: KnowledgeEntity[] = [];
    matchedEntityIds.forEach((id) => {
      const ent = this.entities.get(id);
      if (ent) relatedEntities.push(ent);
    });

    // Get connecting edges
    const connectedEdges = this.edges.filter(
      (edge) =>
        matchedEntityIds.has(edge.sourceEntityId) ||
        matchedEntityIds.has(edge.targetEntityId)
    );

    // 4. Formulate Natural Relational Facts
    const relationalFacts: string[] = [];
    connectedEdges.forEach((edge) => {
      const src = this.entities.get(edge.sourceEntityId)?.name || edge.sourceEntityId;
      const tgt = this.entities.get(edge.targetEntityId)?.name || edge.targetEntityId;
      const relPretty = edge.relation.replace(/_/g, ' ');
      relationalFacts.push(`${src} ${relPretty} ${tgt}${edge.context ? ` (${edge.context})` : ''}`);
    });

    // 5. Synthesize Natural Narrative Readout
    let narrativeEn = '';
    let narrativeHi = '';

    if (isPersonQuery && relatedEntities.length > 0) {
      const mainEnt = relatedEntities[0];
      const facts = relationalFacts.slice(0, 3).join('. ');
      narrativeEn = `According to Stark records, ${mainEnt.name} is classified as ${mainEnt.type}. ${facts}.`;
      narrativeHi = `स्टार्क रिकॉर्ड्स के अनुसार, ${mainEnt.name} हमारे सिस्टम में ${mainEnt.type} के रूप में दर्ज हैं। ${facts}`;
    } else if (isYesterdayQuery) {
      if (matchedEpisodes.length === 0) {
        narrativeEn = 'I checked the episodic timeline, Sir. No critical interventions or anomalies were recorded yesterday.';
        narrativeHi = 'सर, कल की टाइमलाइन चेक की गई। कल कोई क्रिटिकल इवेंट या एनोमली रिकॉर्ड नहीं हुई थी।';
      } else {
        const topEvent = matchedEpisodes[0];
        narrativeEn = `Yesterday, we logged ${matchedEpisodes.length} notable event${matchedEpisodes.length > 1 ? 's' : ''}. Primarily: ${topEvent.title} - ${topEvent.summary}.`;
        narrativeHi = `कल हमने ${matchedEpisodes.length} मुख्य कार्य रिकॉर्ड किए थे। मुख्य रूप से: ${topEvent.title} - ${topEvent.summary}।`;
      }
    } else if (isTodayQuery) {
      if (matchedEpisodes.length === 0) {
        narrativeEn = 'All Stark operations today have been nominal with standard background supervision.';
        narrativeHi = 'आज के सभी सिस्टम ऑपरेशन्स सामान्य रहे हैं और बैकग्राउंड मॉनिटरिंग एक्टिव है।';
      } else {
        narrativeEn = `Today's episodic log contains ${matchedEpisodes.length} active event${matchedEpisodes.length > 1 ? 's' : ''}. Latest: ${matchedEpisodes[0].title}.`;
        narrativeHi = `आज के रिकॉर्ड में ${matchedEpisodes.length} इवेंट्स दर्ज हैं। नवीनतम: ${matchedEpisodes[0].title}।`;
      }
    } else if (matchedEpisodes.length > 0) {
      narrativeEn = `Found ${matchedEpisodes.length} related memory node${matchedEpisodes.length > 1 ? 's' : ''}. Primary record: ${matchedEpisodes[0].title} (${matchedEpisodes[0].timeLabel}).`;
      narrativeHi = `इस विषय पर ${matchedEpisodes.length} मेमोरी रिकॉर्ड मिले हैं। मुख्य: ${matchedEpisodes[0].title} (${matchedEpisodes[0].timeLabel})।`;
    } else {
      narrativeEn = 'I queried the episodic knowledge graph, Sir, but found no matching occurrences for that context.';
      narrativeHi = 'सर, कॉग्निटिव ग्राफ में इस संदर्भ से जुड़ा कोई रिकॉर्ड नहीं मिला।';
    }

    return {
      matchedEpisodes,
      relatedEntities,
      connectedEdges,
      relationalFacts,
      synthesizedNarrative: narrativeEn,
      synthesizedNarrativeHi: narrativeHi,
      confidence: matchedEpisodes.length > 0 || relatedEntities.length > 0 ? 0.92 : 0.4,
    };
  }

  /**
   * Seeds default Stark knowledge graph representation
   */
  private static seedDefaultKnowledgeGraph(): void {
    const owner = this.addEntity({
      entityId: 'ent_owner_ashish',
      name: 'Ashish Kumar',
      type: 'person',
      aliases: ['Ashish', 'Sir', 'Owner', 'Boss', 'Admin'],
      attributes: { role: 'Chief Architect & Owner', clearance: 'Level 10' },
      salience: 100,
    });

    const jarvis = this.addEntity({
      entityId: 'ent_assistant_jarvis',
      name: 'JARVIS',
      type: 'concept',
      aliases: ['Jarvis', 'Assistant', 'Stark Core'],
      attributes: { status: 'Online', version: 'Phase 21 Cognitive' },
      salience: 95,
    });

    const oneva = this.addEntity({
      entityId: 'ent_project_oneva',
      name: 'ONEVA',
      type: 'project',
      aliases: ['ONEVA OS', 'Launcher', 'Platform'],
      attributes: { focus: 'Privacy-first Android Enhancement' },
      salience: 95,
    });

    const device = this.addEntity({
      entityId: 'ent_device_phone',
      name: 'Primary Android Device',
      type: 'device',
      aliases: ['My Phone', 'This Device', 'Mobile'],
      attributes: { model: 'ARM64 Octa-Core', thermalLimit: '41.5C' },
      salience: 90,
    });

    const rahul = this.addEntity({
      entityId: 'ent_person_rahul',
      name: 'Rahul Sharma',
      type: 'person',
      aliases: ['Rahul', 'Rahul Bhai', 'Lead Dev'],
      attributes: { role: 'Core Collaborator', contact: '+91 98765 43210' },
      salience: 85,
    });

    // Edges
    this.addEdge({
      sourceEntityId: owner.entityId,
      targetEntityId: oneva.entityId,
      relation: 'created',
      strength: 1.0,
      context: 'Chief Architect and Creator',
    });

    this.addEdge({
      sourceEntityId: jarvis.entityId,
      targetEntityId: owner.entityId,
      relation: 'manages',
      strength: 0.95,
      context: 'Personal Autonomous Intelligence',
    });

    this.addEdge({
      sourceEntityId: jarvis.entityId,
      targetEntityId: device.entityId,
      relation: 'works_on',
      strength: 0.9,
      context: 'Hardware Sentinel & Thermal Guardian',
    });

    this.addEdge({
      sourceEntityId: rahul.entityId,
      targetEntityId: oneva.entityId,
      relation: 'works_on',
      strength: 0.85,
      context: 'Android Engineering Partner',
    });

    this.addEdge({
      sourceEntityId: rahul.entityId,
      targetEntityId: owner.entityId,
      relation: 'friend_of',
      strength: 0.9,
      bidirectional: true,
      context: 'Close Friend and Colleague',
    });

    // Seed a couple of realistic recent episodes (Today & Yesterday)
    const startOfTodaySeed = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    const yesterdayTime = startOfTodaySeed - 6 * 60 * 60 * 1000; // 6 PM yesterday, guaranteed in yesterday window
    this.recordEpisode({
      title: 'Stark Saver Profile Engaged',
      summary: 'Calibrated system power mode to Stark Saver following low-battery sentinel prompt.',
      intentCategory: 'device_control',
      entitiesInvolved: [device.entityId, jarvis.entityId],
      salience: 85,
      timestamp: yesterdayTime,
      emotionalTone: 'focused',
    });

    this.recordEpisode({
      title: 'Thermal Sentinel Threshold Calibrated',
      summary: 'Configured silicon junction thermal alert limit to 41.5°C with anti-spam cooldown.',
      intentCategory: 'sentinel_configuration',
      entitiesInvolved: [device.entityId, jarvis.entityId],
      salience: 90,
      timestamp: yesterdayTime + 2 * 60 * 60 * 1000,
      emotionalTone: 'focused',
    });

    this.recordEpisode({
      title: 'Morning Briefing Dispatched',
      summary: 'Delivered autonomous vocal briefing on battery reserve, 5G link status, and day outlook.',
      intentCategory: 'morning_briefing',
      entitiesInvolved: [owner.entityId, jarvis.entityId],
      salience: 80,
      emotionalTone: 'informative',
    });
  }

  // ==========================================
  // ACCESSORS & METRICS
  // ==========================================

  static getAllEpisodes(): EpisodicNode[] {
    this.init();
    return [...this.episodes];
  }

  static getAllEntities(): KnowledgeEntity[] {
    this.init();
    return Array.from(this.entities.values());
  }

  static getAllEdges(): KnowledgeEdge[] {
    this.init();
    return [...this.edges];
  }

  static getMetrics(): EpisodicMemoryMetrics {
    return { ...this.metrics };
  }

  static forgetEpisode(episodeId: string): void {
    this.episodes = this.episodes.filter((e) => e.episodeId !== episodeId);
    this.persistToStorage();
    this.updateMetrics();
    this.notify();
  }

  static wipeAllEpisodicMemory(): void {
    this.episodes = [];
    this.entities.clear();
    this.edges = [];
    this.seedDefaultKnowledgeGraph();
    this.persistToStorage();
    this.updateMetrics();
    this.notify();
  }

  private static updateMetrics(): void {
    this.metrics.totalEpisodes = this.episodes.length;
    this.metrics.totalEntities = this.entities.size;
    this.metrics.totalEdges = this.edges.length;
  }

  private static persistToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(this.episodes));
      localStorage.setItem(
        STORAGE_KEY_ENTITIES,
        JSON.stringify(Array.from(this.entities.entries()))
      );
      localStorage.setItem(STORAGE_KEY_EDGES, JSON.stringify(this.edges));
      localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(this.metrics));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  private static loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const eps = localStorage.getItem(STORAGE_KEY_EPISODES);
      if (eps) this.episodes = JSON.parse(eps);

      const ents = localStorage.getItem(STORAGE_KEY_ENTITIES);
      if (ents) {
        const parsedEntries: [string, KnowledgeEntity][] = JSON.parse(ents);
        this.entities = new Map(parsedEntries);
      }

      const edg = localStorage.getItem(STORAGE_KEY_EDGES);
      if (edg) this.edges = JSON.parse(edg);

      const met = localStorage.getItem(STORAGE_KEY_METRICS);
      if (met) this.metrics = { ...this.metrics, ...JSON.parse(met) };
    } catch {
      // Ignore
    }
  }

  /**
   * High-Dimensional Semantic Vector Cosine Similarity
   */
  private static calculateVectorCosineSimilarity(query: string, corpus: string): number {
    const qTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    const cTokens = corpus.toLowerCase().split(/\s+/).filter((t) => t.length > 1);

    if (qTokens.length === 0 || cTokens.length === 0) return 0;

    const termFreqQ: Record<string, number> = {};
    const termFreqC: Record<string, number> = {};
    const vocab = new Set<string>();

    qTokens.forEach((t) => {
      termFreqQ[t] = (termFreqQ[t] || 0) + 1;
      vocab.add(t);
    });

    cTokens.forEach((t) => {
      termFreqC[t] = (termFreqC[t] || 0) + 1;
      vocab.add(t);
    });

    let dot = 0;
    let normQ = 0;
    let normC = 0;

    vocab.forEach((term) => {
      const qVal = termFreqQ[term] || 0;
      const cVal = termFreqC[term] || 0;
      dot += qVal * cVal;
      normQ += qVal * qVal;
      normC += cVal * cVal;
    });

    if (normQ === 0 || normC === 0) return 0;
    return dot / (Math.sqrt(normQ) * Math.sqrt(normC));
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {
        // Ignore
      }
    });
  }
}
