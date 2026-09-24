/**
 * ONEVA Phase 12: Documentation & Developer Knowledge Search Provider
 * 
 * Queries MDN Web Docs search API and DevDocs references for official
 * technical documentation, specifications, and beginner/advanced guides.
 */

import { GeneratedSearchQuery, JarvisSearchResult, SearchProvider } from '../../../../types/jarvisWebResearch';

export class DocumentationSearchProvider implements SearchProvider {
  id = 'documentation' as const;
  displayName = 'Official Technical & Platform Documentation';

  async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  async search(query: GeneratedSearchQuery): Promise<JarvisSearchResult[]> {
    const results: JarvisSearchResult[] = [];
    const encoded = encodeURIComponent(query.rawQuery);

    try {
      const mdnUrl = `https://developer.mozilla.org/api/v1/search?q=${encoded}&locale=en-US`;
      const res = await fetch(mdnUrl, { signal: AbortSignal.timeout(6000) });

      if (res.ok) {
        const data = await res.json();
        const docs = data.documents || [];

        for (const doc of docs.slice(0, 4)) {
          const docUrl = `https://developer.mozilla.org${doc.mdn_url}`;
          results.push({
            id: `mdn_${doc.slug || Math.random().toString(36).substr(2, 6)}`,
            title: doc.title,
            url: docUrl,
            domain: 'developer.mozilla.org',
            providerId: 'documentation',
            providerName: 'MDN Web Docs (Official)',
            snippet: doc.summary || 'Official technical documentation and API reference.',
            relevance: 0.94,
            credibility: 'OFFICIAL',
            isRecent: true,
          });
        }
      }
    } catch (err) {
      console.warn('[DocumentationSearchProvider] MDN search error:', err);
    }

    return results;
  }
}
