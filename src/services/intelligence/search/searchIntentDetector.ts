/**
 * ONEVA Phase 12: Search Intent Detection Layer
 * 
 * Accurately determines whether a user prompt requires:
 * A. NORMAL_AI: General knowledge, definitions, math, greetings (no web search needed)
 * B. WEB_SEARCH: Single targeted factual search for recent news or facts
 * C. MULTI_SOURCE_RESEARCH: Comparisons, evaluations, deep synthesis
 * D. SPECIALIZED_ASSET: 3D models, textures, game assets, developer repos
 * E. DEVICE_ACTION: Android system actions (Phase 13 handoff)
 */

import { SearchIntentCategory } from '../../../types/jarvisWebResearch';

export interface SearchIntentEvaluation {
  category: SearchIntentCategory;
  requiresInternet: boolean;
  confidence: number;
  reason: string;
  isTimeSensitive: boolean;
  isComparison: boolean;
  isAssetRequest: boolean;
}

export class SearchIntentDetector {
  /**
   * Evaluates natural-language prompt to determine true search intent
   */
  static evaluate(rawInput: string): SearchIntentEvaluation {
    const trimmed = rawInput.trim();
    const lower = trimmed.toLowerCase();

    // 1. Check for Android / Device Actions (Phase 13 boundary)
    if (this.isDeviceAction(lower)) {
      return {
        category: 'DEVICE_ACTION',
        requiresInternet: false,
        confidence: 0.95,
        reason: 'Command targets local Android application launch or hardware toggle.',
        isTimeSensitive: false,
        isComparison: false,
        isAssetRequest: false,
      };
    }

    // 2. Check for Specialized Asset / 3D Model Search
    if (this.isAssetSearch(lower)) {
      return {
        category: 'SPECIALIZED_ASSET',
        requiresInternet: true,
        confidence: 0.94,
        reason: 'User requests finding downloadable 3D models, textures, or code assets.',
        isTimeSensitive: false,
        isComparison: false,
        isAssetRequest: true,
      };
    }

    // 3. Check for Comparisons & Multi-Source Research
    if (this.isMultiSourceResearch(lower)) {
      return {
        category: 'MULTI_SOURCE_RESEARCH',
        requiresInternet: true,
        confidence: 0.92,
        reason: 'Request requires comparing multiple products, sources, or viewpoints.',
        isTimeSensitive: this.isTimeSensitive(lower),
        isComparison: true,
        isAssetRequest: false,
      };
    }

    // 4. Check for Time-Sensitive / Recent Web Search
    if (this.isWebSearchNeeded(lower)) {
      return {
        category: 'WEB_SEARCH',
        requiresInternet: true,
        confidence: 0.90,
        reason: 'Query requires current live information, recent events, or online search.',
        isTimeSensitive: this.isTimeSensitive(lower),
        isComparison: false,
        isAssetRequest: false,
      };
    }

    // 5. Default: Normal AI Response (General encyclopedic knowledge, definitions, math)
    return {
      category: 'NORMAL_AI',
      requiresInternet: false,
      confidence: 0.96,
      reason: 'General knowledge, definition, or conversational response is sufficient without web research.',
      isTimeSensitive: false,
      isComparison: false,
      isAssetRequest: false,
    };
  }

  private static isDeviceAction(lower: string): boolean {
    // e.g. "open YouTube", "kholo WhatsApp", "turn on flashlight", "set volume to 80"
    if (/^(?:open|launch|kholo|chalao|start|turn on|turn off|enable|disable)\s+(?:youtube|whatsapp|camera|chrome|spotify|settings|flashlight|wifi|bluetooth|torch)/i.test(lower)) {
      return true;
    }
    // "Open YouTube and search..." is a multi-step action, not a pure web search
    if (/\b(?:open|kholo)\s+[a-z0-9]+\s+(?:and|aur)\s+/i.test(lower)) {
      return true;
    }
    return false;
  }

  private static isAssetSearch(lower: string): boolean {
    // 3D model, game asset, texture, blender model, github repo
    const assetKeywords = [
      '3d model',
      '3d asset',
      '3d house',
      '3d car',
      '3d tree',
      '3d character',
      'mesh',
      'low poly',
      'poly haven',
      'sketchfab',
      'game environment',
      'waterfall model',
      'blender model',
      'github repo',
      'github repository',
      'open source project',
    ];
    return assetKeywords.some((kw) => lower.includes(kw));
  }

  private static isMultiSourceResearch(lower: string): boolean {
    // Comparisons, reviews, multi-source evaluation
    const compareIndicators = [
      'compare',
      'which one is better',
      'vs',
      'versus',
      'difference between',
      'pros and cons',
      'research different sources',
      'best option and why',
      'search different sources and tell me',
      'check whether this information is actually true',
      'verify whether',
    ];
    return compareIndicators.some((ci) => lower.includes(ci));
  }

  private static isWebSearchNeeded(lower: string): boolean {
    // Explicit indicators of live or external information
    if (this.isTimeSensitive(lower)) {
      return true;
    }

    const searchTriggers = [
      'search for',
      'find information about',
      'tutorial about',
      'tutorial for',
      'news about',
      'latest news',
      'current price',
      'what happened recently',
      'what is the score',
      'match result',
      'weather today',
      'stock price',
      'recent update',
      'released recently',
      'documentation for',
    ];

    return searchTriggers.some((st) => lower.includes(st));
  }

  private static isTimeSensitive(lower: string): boolean {
    const timeWords = [
      'latest',
      'recent',
      'today',
      'now',
      'current',
      'this week',
      'this month',
      '2026',
      'new release',
      'new update',
      'yesterday',
      'breaking news',
      'live score',
      'currently',
    ];
    return timeWords.some((tw) => new RegExp(`\\b${tw}\\b`, 'i').test(lower));
  }
}
