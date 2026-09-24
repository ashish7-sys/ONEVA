/**
 * ONEVA Phase 12: Search Query Generator
 * 
 * Transforms natural language requests into refined, high-yield queries
 * targeted for specific search providers without blindly searching the whole sentence.
 */

import { GeneratedSearchQuery, SearchIntentCategory, SearchProviderType } from '../../../types/jarvisWebResearch';

export class SearchQueryGenerator {
  /**
   * Generates tailored search queries across applicable providers
   */
  static generateQueries(
    userPrompt: string,
    intentCategory: SearchIntentCategory
  ): GeneratedSearchQuery[] {
    const trimmed = userPrompt.trim();
    const lower = trimmed.toLowerCase();

    // CASE 1: Specialized 3D Asset Search
    if (intentCategory === 'SPECIALIZED_ASSET') {
      return this.generateAssetQueries(trimmed, lower);
    }

    // CASE 2: Multi-Source Comparison Research
    if (intentCategory === 'MULTI_SOURCE_RESEARCH') {
      return this.generateComparisonQueries(trimmed, lower);
    }

    // CASE 3: Web Search / Current Information
    if (intentCategory === 'WEB_SEARCH') {
      return this.generateWebSearchQueries(trimmed, lower);
    }

    // Default / Normal Query
    const cleaned = this.cleanSearchKeywords(trimmed);
    return [
      {
        rawQuery: cleaned,
        goal: 'General factual knowledge retrieval',
        targetProvider: 'web',
        keywords: cleaned.split(' ').filter(Boolean),
      },
    ];
  }

  private static generateAssetQueries(raw: string, lower: string): GeneratedSearchQuery[] {
    // Extract key subject (e.g., "house", "city environment", "waterfall", "car", "tree")
    let subject = '3d model';
    const subjectMatch = lower.match(
      /(?:find|search|get|look for)?\s*(?:me\s+)?(?:a\s+)?(?:free\s+)?(?:realistic\s+)?([a-z0-9\s_-]+?)(?:\s+model|\s+asset|\s+environment|\s+for my|\s+for blender|\s+download|$)/i
    );
    if (subjectMatch && subjectMatch[1].trim()) {
      subject = subjectMatch[1].trim().replace(/\b(?:free|realistic|best|top)\b/gi, '').trim() || '3d model';
    }

    const isFree = lower.includes('free') || lower.includes('open source');
    const isRealistic = lower.includes('realistic');
    const isForGame = lower.includes('game') || lower.includes('unity') || lower.includes('unreal');

    // 1. Primary Sketchfab / 3D Asset Provider Query
    const assetQueryParts = [subject];
    if (isRealistic) assetQueryParts.push('realistic');
    if (isForGame) assetQueryParts.push('game ready');

    const queries: GeneratedSearchQuery[] = [
      {
        rawQuery: assetQueryParts.join(' '),
        goal: `Downloadable ${isFree ? 'free ' : ''}3D asset for "${subject}"`,
        targetProvider: 'asset_3d',
        keywords: [subject, '3d', isFree ? 'free' : '', 'downloadable'].filter(Boolean),
        filters: {
          license: isFree ? 'CC0/CC-BY' : 'any',
          fileType: 'gltf/obj/fbx',
        },
      },
    ];

    // 2. Secondary Web / Documentation search for asset repositories (e.g. Poly Haven, Sketchfab)
    queries.push({
      rawQuery: `${subject} 3d model free download license`,
      goal: `Verify repository availability and licensing for ${subject}`,
      targetProvider: 'web',
      keywords: [subject, '3d', 'free', 'license'],
    });

    // 3. If open-source code/tooling is mentioned, also query GitHub
    if (lower.includes('github') || lower.includes('code') || lower.includes('repo') || lower.includes('blender script')) {
      queries.push({
        rawQuery: `${subject} 3d blender`,
        goal: `Open-source 3D scripts or tools for ${subject}`,
        targetProvider: 'github',
        keywords: [subject, 'blender', '3d'],
      });
    }

    return queries;
  }

  private static generateComparisonQueries(raw: string, lower: string): GeneratedSearchQuery[] {
    // E.g., "Compare iPhone 15 Pro vs Samsung S24 Ultra" or "Compare these phones"
    const cleaned = this.cleanSearchKeywords(raw);

    const queries: GeneratedSearchQuery[] = [
      {
        rawQuery: cleaned,
        goal: 'Direct side-by-side feature and specification comparison',
        targetProvider: 'web',
        keywords: cleaned.split(' ').filter(Boolean),
        filters: { timeframe: 'recent' },
      },
      {
        rawQuery: `${cleaned} review comparison difference`,
        goal: 'Technical analysis and user benchmark consensus',
        targetProvider: 'web',
        keywords: [cleaned, 'review', 'comparison'],
      },
    ];

    // If query targets developer tools/technologies (e.g. "React vs Vue" or "Vite vs Webpack")
    if (/\b(?:react|vue|vite|webpack|angular|flutter|swift|kotlin|python|rust|go)\b/i.test(lower)) {
      queries.push({
        rawQuery: cleaned,
        goal: 'Documentation and ecosystem benchmark comparison',
        targetProvider: 'documentation',
        keywords: [cleaned, 'benchmark', 'documentation'],
      });
    }

    return queries;
  }

  private static generateWebSearchQueries(raw: string, lower: string): GeneratedSearchQuery[] {
    // Detect if this is a tutorial request (e.g. "Find a YouTube tutorial about Blender")
    if (/\b(?:tutorial|guide|how to|learn|course)\b/i.test(lower)) {
      const subject = raw
        .replace(/\b(?:find|search|get|show|me|a|youtube|tutorial|about|for|guide|how to)\b/gi, '')
        .trim() || raw;

      return [
        {
          rawQuery: `${subject} tutorial guide`,
          goal: `Tutorial guide and video references for ${subject}`,
          targetProvider: 'video',
          keywords: [subject, 'tutorial', 'guide'],
        },
        {
          rawQuery: `${subject} beginner documentation`,
          goal: `Official documentation and learning resources for ${subject}`,
          targetProvider: 'documentation',
          keywords: [subject, 'documentation', 'learning'],
        },
      ];
    }

    // Time-sensitive / latest news
    const cleaned = this.cleanSearchKeywords(raw);
    return [
      {
        rawQuery: cleaned,
        goal: 'Current authoritative information retrieval',
        targetProvider: 'web',
        keywords: cleaned.split(' ').filter(Boolean),
        filters: { timeframe: 'recent' },
      },
    ];
  }

  /**
   * Cleans conversational filler words to extract high-yield query terms
   */
  private static cleanSearchKeywords(text: string): string {
    return text
      .replace(/\b(?:what is the latest|what is|who is|can you tell me|please find|search for|information about|ke baare mein|batao|kya scene hai|tell me about|what happened recently in|what happened with|check whether|is it true that)\b/gi, '')
      .replace(/[?!.,;]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
