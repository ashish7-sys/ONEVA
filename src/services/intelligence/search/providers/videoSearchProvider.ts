/**
 * ONEVA Phase 12: Video & Learning Tutorial Search Provider
 * 
 * Provides verified video tutorials and documentation links for learning
 * requests (e.g., "Find a YouTube tutorial about Blender") while strictly
 * preserving the research boundary (does NOT trigger device actions).
 */

import { GeneratedSearchQuery, JarvisSearchResult, SearchProvider } from '../../../../types/jarvisWebResearch';

export class VideoSearchProvider implements SearchProvider {
  id = 'video' as const;
  displayName = 'Verified Video Tutorials & Learning Channels';

  async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  async search(query: GeneratedSearchQuery): Promise<JarvisSearchResult[]> {
    const results: JarvisSearchResult[] = [];
    const raw = query.rawQuery.toLowerCase();
    const encoded = encodeURIComponent(query.rawQuery);

    // 1. Generate direct YouTube search reference without tracking
    results.push({
      id: `yt_search_${Date.now()}`,
      title: `YouTube Video Tutorials: "${query.rawQuery}"`,
      url: `https://www.youtube.com/results?search_query=${encoded}`,
      domain: 'youtube.com',
      providerId: 'video',
      providerName: 'YouTube Learning Index',
      snippet: `Curated search for "${query.rawQuery}" video guides, step-by-step walkthroughs, and community courses.`,
      relevance: 0.95,
      credibility: 'COMMUNITY',
      isRecent: true,
    });

    // 2. Curated authoritative channels for common creative/dev tools
    if (raw.includes('blender')) {
      results.push({
        id: 'blender_official_tutorial',
        title: 'Blender Fundamentals 4.x - Official Series',
        url: 'https://www.youtube.com/@BlenderOfficial/playlists',
        domain: 'youtube.com',
        providerId: 'video',
        providerName: 'Blender Foundation Official',
        snippet: 'Official beginner-to-advanced walkthrough playlist directly by the Blender core development foundation.',
        relevance: 0.99,
        credibility: 'OFFICIAL',
        isRecent: true,
      });
      results.push({
        id: 'blender_guru_donut',
        title: 'Blender Beginner Tutorial Series (Donut Guide)',
        url: 'https://www.youtube.com/watch?v=nIoXOplUvAw',
        domain: 'youtube.com',
        providerId: 'video',
        providerName: 'Blender Guru (Andrew Price)',
        snippet: 'The industry-standard introduction to modeling, materials, lighting, and rendering in Blender.',
        relevance: 0.96,
        credibility: 'VERIFIED',
      });
    } else if (raw.includes('unreal') || raw.includes('ue5')) {
      results.push({
        id: 'unreal_official',
        title: 'Unreal Engine 5 Official Getting Started Guide',
        url: 'https://dev.epicgames.com/community/learning',
        domain: 'dev.epicgames.com',
        providerId: 'video',
        providerName: 'Epic Games Developer Portal',
        snippet: 'Comprehensive video tutorials and project templates for Lumen, Nanite, and Blueprints.',
        relevance: 0.98,
        credibility: 'OFFICIAL',
      });
    } else if (raw.includes('unity')) {
      results.push({
        id: 'unity_learn',
        title: 'Unity Learn Pathways - Official Walkthroughs',
        url: 'https://learn.unity.com/',
        domain: 'learn.unity.com',
        providerId: 'video',
        providerName: 'Unity Official Learning',
        snippet: 'Interactive and guided video pathways for game development, C# scripting, and mobile optimization.',
        relevance: 0.98,
        credibility: 'OFFICIAL',
      });
    }

    return results;
  }
}
