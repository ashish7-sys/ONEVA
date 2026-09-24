/**
 * ONEVA Phase 12: GitHub Open-Source Repositories Search Provider
 * 
 * Queries public GitHub API for open-source libraries, 3D tooling, and code repos,
 * extracting real star ratings, verified licenses (MIT, Apache, GPL), and topics.
 */

import {
  AssetMetadata,
  GeneratedSearchQuery,
  JarvisSearchResult,
  SearchProvider,
} from '../../../../types/jarvisWebResearch';

export class GitHubSearchProvider implements SearchProvider {
  id = 'github' as const;
  displayName = 'GitHub Open-Source Repositories';

  async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  async search(query: GeneratedSearchQuery): Promise<JarvisSearchResult[]> {
    const results: JarvisSearchResult[] = [];
    const encoded = encodeURIComponent(`${query.rawQuery} in:name,description`);

    try {
      const ghUrl = `https://api.github.com/search/repositories?q=${encoded}&per_page=4`;
      const res = await fetch(ghUrl, {
        headers: {
          'User-Agent': 'ONEVA-Jarvis-Intelligence/12.0',
          Accept: 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];

        for (const item of items) {
          const licenseSpdx = item.license?.spdx_id || item.license?.name || 'Unspecified';
          const isPermissive = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'].includes(licenseSpdx);

          const assetMeta: AssetMetadata = {
            is3DModel: query.rawQuery.includes('3d') || query.rawQuery.includes('blender'),
            assetType: 'Open Source Repository',
            fileFormats: ['source code'],
            licenseType: isPermissive ? 'MIT_APACHE' : licenseSpdx.includes('GPL') ? 'CC_BY_SA' : 'UNKNOWN',
            licenseLabel: licenseSpdx,
            isFree: true,
            attributionRequired: true,
            usageRestrictions: isPermissive ? 'Permissive open source' : 'Check repository license terms',
            isDownloadable: true,
            author: item.owner?.login || 'Community',
            trustworthyScore: 0.90,
          };

          results.push({
            id: `gh_${item.id}`,
            title: item.full_name,
            url: item.html_url,
            domain: 'github.com',
            providerId: 'github',
            providerName: 'GitHub Repositories',
            snippet: `${item.description || 'Open source repository.'} (${(item.stargazers_count || 0).toLocaleString()} ★) - License: ${licenseSpdx}`,
            relevance: 0.88,
            credibility: 'VERIFIED',
            publishedDate: item.updated_at ? item.updated_at.split('T')[0] : undefined,
            isRecent: Boolean(item.updated_at && (Date.now() - new Date(item.updated_at).getTime()) < 90 * 86400000),
            assetMetadata: assetMeta,
          });
        }
      }
    } catch (err) {
      console.warn('[GitHubSearchProvider] GitHub search error:', err);
    }

    return results;
  }
}
