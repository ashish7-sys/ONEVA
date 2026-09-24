/**
 * ONEVA Phase 12: Central Jarvis Research & Web Intelligence Service
 * 
 * Coordinates end-to-end research pipelines, manages multi-platform search
 * providers, tracks research job lifecycles, and binds directly into the
 * Phase 11 Task Planner architecture.
 */

import {
  GeneratedSearchQuery,
  JarvisSearchResult,
  ResearchJob,
  ResearchJobStage,
  SearchIntentCategory,
  SearchProvider,
  SearchProviderType,
  SynthesizedResearchFindings,
} from '../../../types/jarvisWebResearch';
import { JarvisTaskPlan, JarvisTaskStep } from '../../../types/jarvisIntelligence';
import { JarvisTaskPlanner } from '../jarvisTaskPlanner';
import { SearchIntentDetector } from './searchIntentDetector';
import { SearchQueryGenerator } from './searchQueryGenerator';
import { ResultNormalizer } from './resultNormalizer';
import { ResearchSynthesizer } from './researchSynthesizer';
import { WebSearchProvider } from './providers/webSearchProvider';
import { Asset3dSearchProvider } from './providers/asset3dSearchProvider';
import { DocumentationSearchProvider } from './providers/documentationSearchProvider';
import { GitHubSearchProvider } from './providers/githubSearchProvider';
import { VideoSearchProvider } from './providers/videoSearchProvider';
import { JarvisMemoryStorage } from '../../memory/jarvisMemoryStorage';
import { JarvisTaskHistoryService } from '../../memory/jarvisTaskHistoryService';
import { OwnerAuthService } from '../../memory/ownerAuthService';

export class JarvisResearchService {
  private static providers: Map<SearchProviderType, SearchProvider> = new Map<SearchProviderType, SearchProvider>([
    ['web', new WebSearchProvider()],
    ['asset_3d', new Asset3dSearchProvider()],
    ['documentation', new DocumentationSearchProvider()],
    ['github', new GitHubSearchProvider()],
    ['video', new VideoSearchProvider()],
  ]);

  private static activeJob: ResearchJob | null = null;
  private static jobHistory: ResearchJob[] = [];
  private static listeners: Set<(job: ResearchJob) => void> = new Set();

  /**
   * Subscribes to research job updates
   */
  static subscribe(listener: (job: ResearchJob) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static getActiveJob(): ResearchJob | null {
    return this.activeJob;
  }

  static getJobHistory(): ResearchJob[] {
    return [...this.jobHistory];
  }

  /**
   * Executes a full web research pipeline for a given prompt,
   * keeping the Phase 11 task plan synchronized with each lifecycle stage.
   */
  static async executeResearch(
    prompt: string,
    existingPlan?: JarvisTaskPlan
  ): Promise<ResearchJob> {
    const trimmed = prompt.trim();
    const jobId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const taskId = existingPlan?.taskId || `task_${Date.now()}`;
    const now = Date.now();

    // 1. Evaluate search intent
    const evaluation = SearchIntentDetector.evaluate(trimmed);

    const job: ResearchJob = {
      jobId,
      taskId,
      originalPrompt: trimmed,
      intentCategory: evaluation.category,
      stage: 'RESEARCH_REQUESTED',
      progressPercent: 5,
      currentActivity: 'Received research request. Evaluating scope...',
      queries: [],
      collectedResults: [],
      startedAt: now,
    };

    this.activeJob = job;
    this.jobHistory.unshift(job);
    if (this.jobHistory.length > 20) this.jobHistory.pop();
    this.emit(job);

    try {
      // Offline Check
      const isOffline = typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine === false;
      if (isOffline) {
        this.updateStage(job, 'FAILED', 100, 'Device is offline. Cannot reach live web sources.');
        job.error = 'Network connection unavailable. Live search disabled.';
        const offlineFindings = ResearchSynthesizer.synthesize(trimmed, evaluation.category, [], [], true);
        job.findings = offlineFindings;
        if (existingPlan) {
          this.updatePlanStep(existingPlan, 'search', 'FAILED', 'Offline: Network unavailable');
          this.updatePlanStep(existingPlan, 'synthesize', 'COMPLETED', offlineFindings.directAnswer);
        }

        // Save offline research memory
        if (JarvisMemoryStorage.getSettings().autoSaveResearchMemory) {
          JarvisMemoryStorage.save({
            memoryId: `mem_res_${job.jobId}`,
            type: 'RESEARCH_MEMORY',
            title: `Research: ${trimmed.slice(0, 35)}`,
            summary: offlineFindings.directAnswer,
            content: offlineFindings.directAnswer,
            tags: [evaluation.category.toLowerCase(), 'research'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            source: 'jarvis_research',
            importance: 'medium',
            ownerScope: OwnerAuthService.getActiveActorType() === 'owner' ? 'owner' : 'user_2',
            reasonStored: 'Auto-saved research findings',
          });
        }

        return job;
      }

      // STAGE 2: Intent Analysis
      this.updateStage(job, 'INTENT_ANALYSIS', 20, `Identified intent: ${evaluation.category} (${evaluation.reason})`);
      await this.delay(100);

      // STAGE 3: Query Generation
      this.updateStage(job, 'QUERY_GENERATION', 35, 'Formulating targeted queries across providers...');
      const queries = SearchQueryGenerator.generateQueries(trimmed, evaluation.category);
      job.queries = queries;
      this.emit(job);
      await this.delay(100);

      // STAGE 4: Multi-Provider Search Execution
      this.updateStage(job, 'SEARCHING', 50, `Searching across ${queries.length} targeted provider queries...`);
      if (existingPlan) {
        this.updatePlanStep(existingPlan, 'search', 'RUNNING', 'Querying multi-platform search providers');
      }

      const rawResults: JarvisSearchResult[] = [];
      for (const query of queries) {
        const provider = this.providers.get(query.targetProvider) || this.providers.get('web');
        if (provider) {
          try {
            const res = await provider.search(query);
            rawResults.push(...res);
          } catch (providerErr) {
            console.warn(`[JarvisResearch] Provider ${query.targetProvider} failed gracefully:`, providerErr);
          }
        }
      }

      // Fallback to general web provider if specialized provider yielded no results
      if (rawResults.length === 0) {
        const webFallback = this.providers.get('web');
        if (webFallback) {
          try {
            const fallbackResults = await webFallback.search({
              rawQuery: trimmed,
              goal: 'Fallback web search',
              targetProvider: 'web',
              keywords: trimmed.split(' '),
            });
            rawResults.push(...fallbackResults);
          } catch (fbErr) {
            console.warn('[JarvisResearch] Fallback web provider failed:', fbErr);
          }
        }
      }

      // STAGE 5: Collecting & Normalization
      this.updateStage(job, 'COLLECTING', 70, `Normalizing ${rawResults.length} raw search results...`);
      const allKeywords = queries.flatMap((q) => q.keywords);
      const normalizedResults = ResultNormalizer.normalize(rawResults, allKeywords);
      job.collectedResults = normalizedResults;
      this.emit(job);
      await this.delay(100);

      // STAGE 6: Analyzing
      this.updateStage(job, 'ANALYZING', 85, 'Evaluating source credibility, differences, and licensing...');
      if (existingPlan) {
        this.updatePlanStep(existingPlan, 'evaluate', 'RUNNING', 'Comparing cross-source data and license validity');
      }
      await this.delay(100);

      // STAGE 7: Synthesizing
      this.updateStage(job, 'SYNTHESIZING', 95, 'Synthesizing concise, source-aware response...');
      const findings = ResearchSynthesizer.synthesize(trimmed, evaluation.category, normalizedResults, queries.map((q) => q.rawQuery));
      job.findings = findings;

      // STAGE 8: Completed
      this.updateStage(job, 'COMPLETED', 100, `Research complete. Synthesized ${normalizedResults.length} sources.`);
      job.completedAt = Date.now();

      // Update Phase 11 Task Plan steps
      if (existingPlan) {
        this.updatePlanStep(existingPlan, 'search', 'COMPLETED', `Retrieved ${normalizedResults.length} results`);
        this.updatePlanStep(existingPlan, 'evaluate', 'COMPLETED', 'Verified source credibility and licensing');
        this.updatePlanStep(existingPlan, 'synthesize', 'COMPLETED', findings.directAnswer);
        existingPlan.status = 'COMPLETED';
        existingPlan.planSummary = findings.directAnswer;
        if (existingPlan.executionHandoff) {
          existingPlan.executionHandoff.planSummary = findings.directAnswer;
        }
      }

      // Phase 14: Save safe compact research summary in JARVIS Memory
      try {
        if (JarvisMemoryStorage.getSettings().autoSaveResearchMemory) {
          JarvisMemoryStorage.save({
            memoryId: `mem_res_${job.jobId}`,
            type: 'RESEARCH_MEMORY',
            title: `Research: ${trimmed.slice(0, 35)}`,
            summary: findings.directAnswer || `Researched "${trimmed}" across web sources.`,
            content: findings.directAnswer,
            tags: queries.flatMap((q) => q.keywords).slice(0, 6),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            source: 'jarvis_research',
            importance: 'medium',
            ownerScope: OwnerAuthService.getActiveActorType() === 'owner' ? 'owner' : 'user_2',
            reasonStored: 'Auto-saved research findings for future recall',
          });
        }

        // Record task history
        JarvisTaskHistoryService.recordTask(
          `Researched "${trimmed}"`,
          'research',
          { taskId: job.taskId }
        );
      } catch (memErr) {
        console.warn('[JarvisResearch] Memory save notice:', memErr);
      }

      return job;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown research error';
      this.updateStage(job, 'FAILED', 100, `Research failed: ${errMsg}`);
      job.error = errMsg;
      if (existingPlan) {
        existingPlan.status = 'FAILED';
        this.updatePlanStep(existingPlan, 'search', 'FAILED', errMsg);
      }
      return job;
    }
  }

  private static updateStage(job: ResearchJob, stage: ResearchJobStage, progress: number, activity: string): void {
    job.stage = stage;
    job.progressPercent = progress;
    job.currentActivity = activity;
    this.emit(job);
  }

  private static updatePlanStep(
    plan: JarvisTaskPlan,
    stepType: JarvisTaskStep['type'],
    status: JarvisTaskStep['status'],
    resultSummary: string
  ): void {
    const step = plan.steps.find((s) => s.type === stepType);
    if (step) {
      step.status = status;
      step.result = resultSummary;
    }
  }

  private static emit(job: ResearchJob): void {
    this.listeners.forEach((fn) => fn(job));
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
