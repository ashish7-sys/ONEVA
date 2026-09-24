/**
 * ONEVA Phase 12: Search Result Normalizer
 * 
 * Ingests multi-provider search results, removes duplicate references,
 * scores relevance and credibility, cleans formatting, and harmonizes
 * asset metadata into a unified internal representation.
 */

import { JarvisSearchResult, SourceCredibility } from '../../../types/jarvisWebResearch';

export class ResultNormalizer {
  /**
   * Normalizes, deduplicates, and ranks raw search results
   */
  static normalize(
    rawResults: JarvisSearchResult[],
    queryKeywords: string[]
  ): JarvisSearchResult[] {
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    const normalized: JarvisSearchResult[] = [];

    for (const r of rawResults) {
      if (!r.title || !r.url) continue;

      // Clean URL: remove tracking query params (utm_source, etc.)
      const cleanedUrl = this.sanitizeUrl(r.url);
      const normalizedTitle = r.title.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (seenUrls.has(cleanedUrl) || (normalizedTitle.length > 5 && seenTitles.has(normalizedTitle))) {
        continue;
      }

      seenUrls.add(cleanedUrl);
      seenTitles.add(normalizedTitle);

      // Score relevance
      const calculatedRelevance = this.calculateRelevance(r, queryKeywords);

      normalized.push({
        ...r,
        url: cleanedUrl,
        snippet: this.cleanSnippet(r.snippet),
        relevance: calculatedRelevance,
        credibility: this.evaluateCredibility(r.domain, r.credibility),
      });
    }

    // Sort by descending relevance and credibility
    return normalized.sort((a, b) => {
      const credWeightA = this.getCredibilityWeight(a.credibility);
      const credWeightB = this.getCredibilityWeight(b.credibility);
      return b.relevance * credWeightB - a.relevance * credWeightA;
    });
  }

  private static sanitizeUrl(rawUrl: string): string {
    try {
      const url = new URL(rawUrl);
      // Remove Google analytics / tracking params
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach((p) => {
        url.searchParams.delete(p);
      });
      return url.toString();
    } catch {
      return rawUrl;
    }
  }

  private static cleanSnippet(snippet?: string): string {
    if (!snippet) return '';
    return snippet
      .replace(/<[^>]+>/g, '') // Strip HTML
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static calculateRelevance(result: JarvisSearchResult, keywords: string[]): number {
    let score = result.relevance || 0.7;
    const text = `${result.title} ${result.snippet}`.toLowerCase();

    // Keyword match booster
    let matches = 0;
    for (const kw of keywords) {
      if (kw && text.includes(kw.toLowerCase())) {
        matches++;
      }
    }

    if (keywords.length > 0) {
      const matchRatio = matches / keywords.length;
      score = Math.min(1.0, score * 0.7 + matchRatio * 0.3);
    }

    // Recency booster
    if (result.isRecent) {
      score = Math.min(1.0, score + 0.05);
    }

    return parseFloat(score.toFixed(2));
  }

  private static evaluateCredibility(domain: string, existing: SourceCredibility): SourceCredibility {
    const lower = domain.toLowerCase();
    // Official documentation / verified foundations
    if (
      lower.includes('wikipedia.org') ||
      lower.includes('mozilla.org') ||
      lower.includes('blender.org') ||
      lower.includes('epicgames.com') ||
      lower.includes('unity.com') ||
      lower.includes('.gov') ||
      lower.includes('.edu')
    ) {
      return 'OFFICIAL';
    }

    if (lower.includes('github.com') || lower.includes('sketchfab.com') || lower.includes('polyhaven.com')) {
      return 'VERIFIED';
    }

    if (lower.includes('ycombinator.com') || lower.includes('reddit.com') || lower.includes('youtube.com')) {
      return 'COMMUNITY';
    }

    return existing || 'UNVERIFIED';
  }

  private static getCredibilityWeight(cred: SourceCredibility): number {
    switch (cred) {
      case 'OFFICIAL':
        return 1.15;
      case 'VERIFIED':
        return 1.1;
      case 'COMMUNITY':
        return 0.95;
      case 'UNVERIFIED':
      default:
        return 0.85;
    }
  }
}
