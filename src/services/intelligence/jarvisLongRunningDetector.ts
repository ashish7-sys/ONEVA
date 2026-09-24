/**
 * ONEVA Phase 20: Long-Running Task Detector
 * 
 * Determines whether a user command requires the live Jarvis Work Panel
 * (web research, asset generation, complex analysis, project build, long-running AI reasoning)
 * or should bypass the panel as a standard immediate phone action (open app, toggle settings,
 * call, alarm, clock, quick query).
 */

import { JarvisIntent } from '../../types/jarvisIntelligence';
import { LongRunningEvaluation, JarvisTaskType } from '../../types/jarvisWorkPanel';

export class JarvisLongRunningDetector {
  /**
   * Fast exclusion patterns: commands that MUST NEVER open the work panel.
   */
  private static FAST_ACTION_PATTERNS = [
    /^(?:open|launch|kholo|chalao|start)\s+[a-zA-Z0-9\s]+$/i,
    /^(?:turn\s+on|turn\s+off|enable|disable|band\s+karo|chalu\s+karo|toggle)\s+(?:wi-?fi|bluetooth|flashlight|torch|airplane\s+mode|dark\s+mode|hotspot|location|nfc)/i,
    /^(?:call|phone|dial|milao)\s+/i,
    /^(?:set\s+(?:an?\s+)?alarm|alarm\s+lagao|wake\s+me\s+up)/i,
    /^(?:what\s+time\s+is\s+it|time\s+kya\s+hua|current\s+time|show\s+clock)/i,
    /^(?:volume\s+(?:up|down|mute)|mute|unmute|brightness\s+(?:up|down))/i,
    /^(?:take\s+(?:a\s+)?screenshot|screen\s+capture)/i,
    /^(?:hello|hey|hi|good\s+morning|good\s+evening|namaste|kaise\s+ho)\b/i,
  ];

  /**
   * Evaluates if a given command requires long-running background execution
   * and live Work Panel supervision.
   */
  static evaluate(rawText: string, intent?: JarvisIntent): LongRunningEvaluation {
    const trimmed = rawText.trim();
    const lower = trimmed.toLowerCase();

    // 1. Check fast exclusion rules first
    for (const pattern of this.FAST_ACTION_PATTERNS) {
      if (pattern.test(lower)) {
        // Exception: If command explicitly includes deep research or generation words
        if (!/\b(?:research|generate\s+assets|create\s+(?:a\s+)?complete|analyze\s+this\s+large|build\s+this\s+app)\b/i.test(lower)) {
          return {
            isLongRunning: false,
            reason: 'Fast single-action command does not require live work panel',
          };
        }
      }
    }

    // 2. Web Research & Technology Comparison
    // Examples: "Research the latest Android APIs", "Research and compare these technologies", "Investigate latest AI models"
    const isResearch = /\b(?:research\s+(?:and\s+compare\s+)?|compare\s+(?:these\s+)?technologies|deep\s+search\s+on|investigate|study\s+the\s+latest|comprehensive\s+search)\b/i.test(lower) ||
      (/\bresearch\b/i.test(lower) && /\b(?:api|apis|technology|technologies|framework|paper|market|trend|history|architecture)\b/i.test(lower));

    if (isResearch) {
      const topic = this.extractTopic(trimmed, ['research', 'compare', 'investigate', 'study']);
      return {
        isLongRunning: true,
        taskType: 'web_research',
        title: topic ? `Research: ${topic}` : 'Web Research & Intelligence',
        reason: 'Command requires live multi-source web intelligence, normalization, and synthesis.',
        suggestedInitialStage: 'RESEARCHING',
      };
    }

    // 3. Asset Generation
    // Examples: "Generate assets for my project", "Create 3D icons", "Generate holographic wallpapers"
    const isAssetGen = /\b(?:generate\s+assets?|create\s+(?:3d\s+)?(?:icons?|textures?|wallpapers?|assets?)|make\s+assets?\s+for|render\s+assets?)\b/i.test(lower);
    if (isAssetGen) {
      const topic = this.extractTopic(trimmed, ['generate assets for', 'create assets for', 'generate', 'create']);
      return {
        isLongRunning: true,
        taskType: 'asset_generation',
        title: topic ? `Generate Assets: ${topic}` : 'Asset Generation',
        reason: 'Command requires asset pipeline rendering, scaling, and catalog compilation.',
        suggestedInitialStage: 'GENERATING',
      };
    }

    // 4. Project & Application Build / Design
    // Examples: "Create a complete game design", "Build this application", "Create full project architecture"
    const isProjectBuild = /\b(?:create\s+(?:a\s+)?complete\s+(?:game\s+design|project|application|system|architecture)|build\s+this\s+app(?:lication)?|generate\s+full\s+codebase|develop\s+a\s+complete)\b/i.test(lower);
    if (isProjectBuild) {
      const topic = this.extractTopic(trimmed, ['create a complete', 'build this', 'develop a', 'design']);
      return {
        isLongRunning: true,
        taskType: 'project_build',
        title: topic ? `Build Project: ${topic}` : 'Project Generation',
        reason: 'Command requires multi-module codebase layout, system architecture, and verification.',
        suggestedInitialStage: 'ANALYZING',
      };
    }

    // 5. Complex Document & Code Analysis
    // Examples: "Analyze this large document", "Analyze this codebase", "Deep security audit"
    const isComplexAnalysis = /\b(?:analyze\s+this\s+(?:large\s+)?(?:document|codebase|file|data|report|system)|deep\s+(?:security\s+)?audit|comprehensive\s+vulnerability\s+scan)\b/i.test(lower);
    if (isComplexAnalysis) {
      const topic = this.extractTopic(trimmed, ['analyze this', 'audit', 'scan']);
      return {
        isLongRunning: true,
        taskType: 'complex_analysis',
        title: topic ? `Analysis: ${topic}` : 'Complex Analysis',
        reason: 'Command requires multi-pass semantic inspection and structured report generation.',
        suggestedInitialStage: 'ANALYZING',
      };
    }

    // 6. Generic long-running intent indicators
    if (
      intent?.intentType === 'research_request' &&
      (intent.complexity === 'RESEARCH_COMPLEX' || intent.complexity === 'MULTI_STEP')
    ) {
      return {
        isLongRunning: true,
        taskType: 'web_research',
        title: `Research: ${trimmed.slice(0, 30)}...`,
        reason: 'NLU intent classified as complex research request.',
        suggestedInitialStage: 'RESEARCHING',
      };
    }

    // Default: not long-running
    return {
      isLongRunning: false,
      reason: 'Standard command or quick query',
    };
  }

  private static extractTopic(text: string, triggers: string[]): string {
    let clean = text;
    for (const trigger of triggers) {
      const regex = new RegExp(`^.*?${trigger}\\s*(?:for|on|about|of)?\\s*`, 'i');
      if (regex.test(clean)) {
        clean = clean.replace(regex, '');
        break;
      }
    }
    clean = clean.replace(/[?.!]+$/, '').trim();
    if (clean.length > 45) {
      clean = clean.slice(0, 42) + '...';
    }
    return clean || text.slice(0, 30);
  }
}
