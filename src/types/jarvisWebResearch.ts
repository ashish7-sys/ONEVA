/**
 * ONEVA Phase 12: Web Intelligence & Multi-Platform Search Types
 * 
 * Defines normalized search results, provider interfaces, research job states,
 * asset licensing models, source credibility ratings, and synthesized findings.
 */

export type SearchIntentCategory =
  | 'NORMAL_AI'              // General factual knowledge, definitions, math (no web search needed)
  | 'WEB_SEARCH'            // Targeted single search query for recent factual information
  | 'MULTI_SOURCE_RESEARCH' // Deep comparison, multi-perspective evaluation, syntheses
  | 'SPECIALIZED_ASSET'     // 3D models, textures, code repositories, creative assets
  | 'DEVICE_ACTION';        // Android system action (Phase 13 handoff)

export type SearchProviderType =
  | 'web'
  | 'documentation'
  | 'github'
  | 'asset_3d'
  | 'video'
  | 'gemini_grounded';

export type SourceCredibility = 'OFFICIAL' | 'VERIFIED' | 'COMMUNITY' | 'UNVERIFIED';

export type AssetLicenseType =
  | 'CC0_PUBLIC_DOMAIN'
  | 'CC_BY'
  | 'CC_BY_SA'
  | 'CC_BY_NC'
  | 'MIT_APACHE'
  | 'PROPRIETARY'
  | 'UNKNOWN';

export interface AssetMetadata {
  is3DModel: boolean;
  assetType?: string;
  fileFormats?: string[];
  licenseType: AssetLicenseType;
  licenseLabel: string;
  isFree: boolean;
  attributionRequired: boolean;
  usageRestrictions?: string;
  vertexCount?: number;
  faceCount?: number;
  isDownloadable: boolean;
  author?: string;
  previewUrl?: string;
  trustworthyScore: number; // 0 to 1
}

export interface JarvisSearchResult {
  id: string;
  title: string;
  url: string;
  domain: string;
  providerId: SearchProviderType;
  providerName: string;
  snippet: string;
  relevance: number; // 0 to 1
  credibility: SourceCredibility;
  publishedDate?: string;
  isRecent?: boolean;
  assetMetadata?: AssetMetadata;
  fullContentSnippet?: string;
}

export interface GeneratedSearchQuery {
  rawQuery: string;
  goal: string;
  targetProvider: SearchProviderType;
  keywords: string[];
  filters?: {
    license?: string;
    fileType?: string;
    timeframe?: 'recent' | 'all';
  };
}

export interface SourceComparisonItem {
  featureOrAspect: string;
  sourceValues: Record<string, string>;
  isDisputed: boolean;
  consensusNote?: string;
}

export interface SynthesizedResearchFindings {
  directAnswer: string;
  keyFindings: string[];
  comparisons?: SourceComparisonItem[];
  conflictingInformation?: {
    detected: boolean;
    description: string;
    resolution: string;
  };
  assetSummary?: {
    targetAsset: string;
    recommendedSource: string;
    format: string;
    license: string;
    attributionRequired: boolean;
    freeConfirmed: boolean;
  };
  sources: JarvisSearchResult[];
  searchQueriesUsed: string[];
  synthesisTimestamp: number;
  isFromOfflineFallback?: boolean;
}

export type ResearchJobStage =
  | 'RESEARCH_REQUESTED'
  | 'INTENT_ANALYSIS'
  | 'QUERY_GENERATION'
  | 'SEARCHING'
  | 'COLLECTING'
  | 'ANALYZING'
  | 'SYNTHESIZING'
  | 'COMPLETED'
  | 'FAILED';

export interface ResearchJob {
  jobId: string;
  taskId: string;
  originalPrompt: string;
  intentCategory: SearchIntentCategory;
  stage: ResearchJobStage;
  progressPercent: number;
  currentActivity: string;
  queries: GeneratedSearchQuery[];
  collectedResults: JarvisSearchResult[];
  findings?: SynthesizedResearchFindings;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export interface SearchProvider {
  id: SearchProviderType;
  displayName: string;
  isAvailable(): Promise<boolean>;
  search(query: GeneratedSearchQuery): Promise<JarvisSearchResult[]>;
}
