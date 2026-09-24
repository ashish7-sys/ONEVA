/**
 * ONEVA Phase 2 / Phase 21 Evolution: JARVIS Cognitive Episodic Memory & Knowledge Graph
 * 
 * Defines the schemas for:
 * - Chronological Episodic Timeline (temporal anchors, event summaries, causal links)
 * - Cognitive Knowledge Graph (Entities, Relations, Attributes, Salience)
 * - Temporal Query Parsers & Associative Semantic Recall
 * - Rule 6 Absolute Privacy: Strictly local on-device representation
 */

export type KnowledgeEntityType =
  | 'person'
  | 'project'
  | 'device'
  | 'location'
  | 'concept'
  | 'preference'
  | 'routine';

export interface KnowledgeEntity {
  entityId: string;
  name: string;
  type: KnowledgeEntityType;
  aliases: string[];
  attributes: Record<string, string | number | boolean>;
  salience: number; // 1 - 100 (Dynamic cognitive importance)
  createdAt: number;
  updatedAt: number;
  accessCount: number;
  lastRecalledAt: number;
}

export type KnowledgeRelationType =
  | 'works_on'
  | 'friend_of'
  | 'family_of'
  | 'located_at'
  | 'prefers'
  | 'created'
  | 'manages'
  | 'interacted_with'
  | 'belongs_to'
  | 'scheduled_at'
  | 'related_to';

export interface KnowledgeEdge {
  edgeId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relation: KnowledgeRelationType;
  strength: number; // 0.1 to 1.0
  bidirectional: boolean;
  context?: string;
  createdAt: number;
  updatedAt: number;
}

export type EpisodicTimeFrame =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'earlier'
  | 'custom';

export interface EpisodicNode {
  episodeId: string;
  timestamp: number;
  timeFrame: EpisodicTimeFrame;
  timeLabel: string; // e.g. "Today at 07:30 AM", "Yesterday afternoon"
  title: string;
  summary: string;
  details?: string;
  intentCategory: string; // e.g. "device_control", "morning_briefing", "task_planning", "conversation"
  entitiesInvolved: string[]; // Entity IDs
  salience: number; // 1 - 100
  accessCount: number;
  lastRecalledAt: number;
  emotionalTone?: 'focused' | 'urgent' | 'casual' | 'informative';
}

export interface EpisodicRecallQuery {
  queryText: string;
  timeWindow?: 'today' | 'yesterday' | 'this_week' | 'all';
  targetEntityType?: KnowledgeEntityType;
  minSalience?: number;
  maxResults?: number;
}

export interface EpisodicRecallResult {
  matchedEpisodes: EpisodicNode[];
  relatedEntities: KnowledgeEntity[];
  connectedEdges: KnowledgeEdge[];
  relationalFacts: string[];
  synthesizedNarrative: string;
  synthesizedNarrativeHi?: string;
  confidence: number;
}

export interface EpisodicMemoryMetrics {
  totalEpisodes: number;
  totalEntities: number;
  totalEdges: number;
  lastDecayRunTimestamp: number;
  queriesAnswered: number;
}
