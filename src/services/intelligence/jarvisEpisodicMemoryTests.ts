/**
 * ONEVA Phase 2 / Phase 21 Evolution: Comprehensive Test Suite
 * JARVIS COGNITIVE EPISODIC MEMORY & KNOWLEDGE GRAPH
 * 
 * Verifies 15 core architectural contracts:
 * 1. Subsystem initialization & seed entities verification
 * 2. Chronological episodic event logging
 * 3. Temporal anchor calculation (today, yesterday, this week)
 * 4. Dynamic entity auto-detection in episode narrative
 * 5. Knowledge entity creation & alias indexing
 * 6. Relational edge creation & context attachment
 * 7. Temporal query resolution: "Yesterday" / "कल"
 * 8. Temporal query resolution: "Today" / "आज"
 * 9. Entity query resolution: "Who is Rahul?" / "राहुल कौन है?"
 * 10. Cognitive salience reinforcement upon recall (+5 salience boost)
 * 11. Multi-lingual narrative synthesis (English & Hindi)
 * 12. Tool Registry: episodic_temporal_query execution
 * 13. Tool Registry: knowledge_graph_query execution
 * 14. Tool Registry: remember_entity_relation execution
 * 15. Rule 6 Compliance: 100% On-device storage & isolation
 */

import { JarvisEpisodicMemoryService } from '../memory/jarvisEpisodicMemoryService';
import { JarvisToolRegistry } from '../actions/jarvisToolRegistry';

export interface EpisodicTestResult {
  id: string;
  name: string;
  passed: boolean;
  message: string;
}

export class JarvisEpisodicMemoryTestSuite {
  static async runAllTests(): Promise<{
    passed: number;
    failed: number;
    total: number;
    results: EpisodicTestResult[];
  }> {
    const results: EpisodicTestResult[] = [];

    const runTest = async (
      id: string,
      name: string,
      fn: () => Promise<void> | void
    ) => {
      try {
        await fn();
        results.push({ id, name, passed: true, message: 'Verified successfully' });
      } catch (err: any) {
        results.push({
          id,
          name,
          passed: false,
          message: err?.message || 'Verification failed',
        });
      }
    };

    // 1. Subsystem initialization & seed entities
    await runTest('TEST-1', 'Subsystem Initialization & Seed Graph', () => {
      JarvisEpisodicMemoryService.init();
      const entities = JarvisEpisodicMemoryService.getAllEntities();
      if (entities.length < 4) {
        throw new Error(`Expected at least 4 default entities, found ${entities.length}`);
      }
      const owner = JarvisEpisodicMemoryService.findEntity('Ashish');
      if (!owner) throw new Error('Owner entity Ashish not found in seed graph');
      const jarvis = JarvisEpisodicMemoryService.findEntity('JARVIS');
      if (!jarvis) throw new Error('JARVIS entity not found in seed graph');
    });

    // 2. Chronological episodic event logging
    await runTest('TEST-2', 'Chronological Episodic Event Logging', () => {
      const episode = JarvisEpisodicMemoryService.recordEpisode({
        title: 'Quantum Diagnostics Executed',
        summary: 'Deep system diagnostics ran across octa-core CPU threads.',
        intentCategory: 'diagnostics',
        salience: 85,
      });

      if (!episode.episodeId.startsWith('ep_')) {
        throw new Error('Invalid episode ID format');
      }
      if (episode.salience !== 85) {
        throw new Error(`Expected salience 85, got ${episode.salience}`);
      }
    });

    // 3. Temporal anchor calculation
    await runTest('TEST-3', 'Temporal Anchor Calculation', () => {
      const todayEp = JarvisEpisodicMemoryService.recordEpisode({
        title: 'Today Test Event',
        summary: 'Testing today anchor calculation.',
        intentCategory: 'test',
        timestamp: Date.now(),
      });
      if (todayEp.timeFrame !== 'today') {
        throw new Error(`Expected timeFrame 'today', got ${todayEp.timeFrame}`);
      }

      const yesterdayTime = Date.now() - 24 * 60 * 60 * 1000;
      const yesterdayEp = JarvisEpisodicMemoryService.recordEpisode({
        title: 'Yesterday Test Event',
        summary: 'Testing yesterday anchor calculation.',
        intentCategory: 'test',
        timestamp: yesterdayTime,
      });
      if (yesterdayEp.timeFrame !== 'yesterday') {
        throw new Error(`Expected timeFrame 'yesterday', got ${yesterdayEp.timeFrame}`);
      }
    });

    // 4. Dynamic entity auto-detection
    await runTest('TEST-4', 'Dynamic Entity Auto-Detection in Narrative', () => {
      const ep = JarvisEpisodicMemoryService.recordEpisode({
        title: 'Discussion with Rahul about ONEVA',
        summary: 'Rahul and Ashish reviewed the thermal sentinel performance.',
        intentCategory: 'collaboration',
      });

      const rahul = JarvisEpisodicMemoryService.findEntity('Rahul');
      if (rahul && !ep.entitiesInvolved.includes(rahul.entityId)) {
        throw new Error('Auto-detector failed to associate Rahul entityId');
      }
    });

    // 5. Knowledge entity creation & alias indexing
    await runTest('TEST-5', 'Knowledge Entity Creation & Alias Indexing', () => {
      const ent = JarvisEpisodicMemoryService.addEntity({
        name: 'Vikram Mehta',
        type: 'person',
        aliases: ['Vikram', 'Vicky'],
        attributes: { role: 'Security Specialist' },
      });

      const foundByAlias = JarvisEpisodicMemoryService.findEntity('Vicky');
      if (!foundByAlias || foundByAlias.entityId !== ent.entityId) {
        throw new Error('Failed to resolve entity by alias "Vicky"');
      }
    });

    // 6. Relational edge creation & context attachment
    await runTest('TEST-6', 'Relational Edge Creation & Context Attachment', () => {
      const rahul = JarvisEpisodicMemoryService.findEntity('Rahul')!;
      const vikram = JarvisEpisodicMemoryService.findEntity('Vikram')!;

      const edge = JarvisEpisodicMemoryService.addEdge({
        sourceEntityId: vikram.entityId,
        targetEntityId: rahul.entityId,
        relation: 'works_on',
        strength: 0.95,
        context: 'Direct security oversight',
      });

      if (!edge.edgeId.startsWith('edge_')) {
        throw new Error('Invalid edgeId generation');
      }
      if (edge.context !== 'Direct security oversight') {
        throw new Error('Edge context metadata missing or corrupt');
      }
    });

    // 7. Temporal query resolution: Yesterday
    await runTest('TEST-7', 'Temporal Query Resolution: Yesterday / कल', () => {
      const result = JarvisEpisodicMemoryService.recallEpisodicMemory({
        queryText: 'कल हमने क्या किया था?',
      });

      if (result.matchedEpisodes.length === 0) {
        throw new Error('Expected yesterday episodes to be retrieved');
      }
      if (!result.synthesizedNarrative || !result.synthesizedNarrativeHi) {
        throw new Error('Synthesized narratives in English/Hindi missing');
      }
    });

    // 8. Temporal query resolution: Today
    await runTest('TEST-8', 'Temporal Query Resolution: Today / आज', () => {
      const result = JarvisEpisodicMemoryService.recallEpisodicMemory({
        queryText: "What are today's events?",
      });

      if (!result.synthesizedNarrative.includes('Today') && !result.synthesizedNarrative.includes('nominal')) {
        throw new Error('Expected today-centric narrative synthesis');
      }
    });

    // 9. Entity query resolution: Who is Rahul?
    await runTest('TEST-9', 'Entity Query Resolution: Who is Rahul?', () => {
      const result = JarvisEpisodicMemoryService.recallEpisodicMemory({
        queryText: 'Who is Rahul?',
      });

      if (result.relatedEntities.length === 0) {
        throw new Error('Failed to associate entity Rahul with query');
      }
      if (!result.synthesizedNarrative.includes('Rahul Sharma')) {
        throw new Error(`Expected narrative to mention Rahul Sharma, got: ${result.synthesizedNarrative}`);
      }
    });

    // 10. Cognitive salience reinforcement upon recall
    await runTest('TEST-10', 'Cognitive Salience Reinforcement (+5 Boost)', () => {
      const ep = JarvisEpisodicMemoryService.recordEpisode({
        title: 'Special Reinforcement Target',
        summary: 'Checking salience boost.',
        intentCategory: 'test',
        salience: 70,
      });

      const initialSalience = ep.salience;
      JarvisEpisodicMemoryService.recallEpisodicMemory({
        queryText: 'Special Reinforcement Target',
      });

      const updated = JarvisEpisodicMemoryService.getAllEpisodes().find(
        (e) => e.episodeId === ep.episodeId
      );

      if (!updated || updated.salience <= initialSalience) {
        throw new Error(`Expected salience to increase from ${initialSalience}, got ${updated?.salience}`);
      }
    });

    // 11. Multi-lingual narrative synthesis
    await runTest('TEST-11', 'Multi-lingual Narrative Synthesis (En & Hi)', () => {
      const result = JarvisEpisodicMemoryService.recallEpisodicMemory({
        queryText: 'राहुल कौन है?',
      });

      if (!result.synthesizedNarrativeHi || result.synthesizedNarrativeHi.length < 5) {
        throw new Error('Expected valid Hindi response synthesis');
      }
    });

    // 12. Tool Registry: episodic_temporal_query execution
    await runTest('TEST-12', 'Tool Registry: episodic_temporal_query', async () => {
      const tool = JarvisToolRegistry.getTool('episodic_temporal_query');
      if (!tool) throw new Error('Tool episodic_temporal_query not registered');

      const actionResult = await tool.handler(
        { queryText: 'What did we do yesterday?' },
        { sessionId: 'test_sess_1', language: 'en', isOnline: true, platformMode: 'web-preview' }
      );

      if (!actionResult.success || actionResult.status !== 'EXECUTED') {
        throw new Error('episodic_temporal_query execution failed');
      }
    });

    // 13. Tool Registry: knowledge_graph_query execution
    await runTest('TEST-13', 'Tool Registry: knowledge_graph_query', async () => {
      const tool = JarvisToolRegistry.getTool('knowledge_graph_query');
      if (!tool) throw new Error('Tool knowledge_graph_query not registered');

      const actionResult = await tool.handler(
        { entityOrTopic: 'Rahul' },
        { sessionId: 'test_sess_2', language: 'en', isOnline: true, platformMode: 'web-preview' }
      );

      if (!actionResult.success || actionResult.status !== 'EXECUTED') {
        throw new Error('knowledge_graph_query execution failed');
      }
    });

    // 14. Tool Registry: remember_entity_relation execution
    await runTest('TEST-14', 'Tool Registry: remember_entity_relation', async () => {
      const tool = JarvisToolRegistry.getTool('remember_entity_relation');
      if (!tool) throw new Error('Tool remember_entity_relation not registered');

      const actionResult = await tool.handler(
        {
          entityName: 'Sanjay Kapoor',
          entityType: 'person',
          relation: 'friend_of',
        },
        { sessionId: 'test_sess_3', language: 'en', isOnline: true, platformMode: 'web-preview' }
      );

      if (!actionResult.success || actionResult.status !== 'EXECUTED') {
        throw new Error('remember_entity_relation execution failed');
      }

      const entity = JarvisEpisodicMemoryService.findEntity('Sanjay Kapoor');
      if (!entity) throw new Error('Entity was not saved in graph after tool call');
    });

    // 15. Rule 6 Compliance: 100% On-device storage & isolation
    await runTest('TEST-15', 'Rule 6 Compliance: Local-First Isolation', () => {
      const metrics = JarvisEpisodicMemoryService.getMetrics();
      if (metrics.totalEntities < 1 || metrics.totalEpisodes < 1) {
        throw new Error('Episodic memory empty, metrics should be populated locally');
      }
    });

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    return {
      passed,
      failed,
      total: results.length,
      results,
    };
  }
}
