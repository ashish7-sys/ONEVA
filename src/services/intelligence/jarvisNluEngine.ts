/**
 * ONEVA Phase 11: Natural-Language Understanding (NLU) Engine
 * 
 * Classifies user intent, assesses task complexity, resolves short-lived
 * follow-up context, detects clarification needs, and produces structured
 * JarvisIntent objects across multiple languages (English, Hindi, Punjabi, Haryanvi).
 */

import {
  JarvisIntent,
  JarvisIntentType,
  JarvisTaskComplexity,
  JarvisEntities,
  JarvisShortLivedContext,
} from '../../types/jarvisIntelligence';
import { JarvisEntityExtractor } from './jarvisEntityExtractor';
import { JarvisContextService } from './jarvisContextService';

export class JarvisNluEngine {
  /**
   * Detects input language heuristically
   */
  static detectLanguage(text: string): 'en' | 'hi' | 'pa' | 'hr' | 'other' {
    const lower = text.toLowerCase();

    // Devanagari script check
    if (/[\u0900-\u097F]/.test(text)) {
      return 'hi';
    }

    // Gurmukhi script check
    if (/[\u0A00-\u0A7F]/.test(text)) {
      return 'pa';
    }

    // Hinglish / Hindi Romanized keywords
    if (/\b(?:kholo|chalao|khol|chala|chahiye|batao|dhundho|kaise|kya|hai|yaar|mera|meri|karein|banao)\b/i.test(lower)) {
      return 'hi';
    }

    // Haryanvi Romanized keywords
    if (/\b(?:khol de|dikha de|kar de|kya scene|ladle|bhai)\b/i.test(lower)) {
      return 'hr';
    }

    // Punjabi Romanized keywords
    if (/\b(?:labho|daso|chhad|veere|paji)\b/i.test(lower)) {
      return 'pa';
    }

    return 'en';
  }

  /**
   * Main natural-language understanding parser
   */
  static async understand(
    rawInput: string,
    existingContext?: JarvisShortLivedContext
  ): Promise<JarvisIntent> {
    const trimmed = rawInput.trim();
    const language = this.detectLanguage(trimmed);
    const lower = trimmed.toLowerCase();

    // Check if this is an explicit follow-up refinement (e.g. "Only free ones", "Show me the second one")
    const context = existingContext || JarvisContextService.getContext();
    const isFollowUpRefinement = this.isFollowUp(lower, context);

    let entities = JarvisEntityExtractor.extractEntities(trimmed);

    // If it's a follow-up, merge with active context entities
    if (isFollowUpRefinement && context) {
      const merged = JarvisContextService.applyFollowUp(trimmed, entities);
      entities = merged.resolvedEntities;
    }

    // Check for Unsupported requests (physical actions, malicious requests, out of scope)
    if (this.isUnsupportedRequest(lower)) {
      return {
        intentType: 'unsupported_request',
        userRequest: trimmed,
        normalizedRequest: lower,
        detectedLanguage: language,
        entities,
        confidence: 0.95,
        complexity: 'UNSUPPORTED',
        requiresPlanning: false,
        requiresConfirmation: false,
        requiresExternalTool: false,
        requiresUserInput: false,
        reasoningSummary: 'Request falls outside of Android device or ONEVA capabilities.',
        suggestedResponse: 'I cannot perform physical or out-of-scope actions like that. As your ONEVA assistant, I manage your device, apps, and research tasks.',
      };
    }

    // Check for Ambiguous requests requiring clarification
    const clarificationCheck = this.checkNeedsClarification(trimmed, lower, entities);
    if (clarificationCheck.needsClarification) {
      return {
        intentType: 'clarification_required',
        userRequest: trimmed,
        normalizedRequest: lower,
        detectedLanguage: language,
        entities,
        confidence: 0.85,
        complexity: 'AMBIGUOUS',
        requiresPlanning: true,
        requiresConfirmation: false,
        requiresExternalTool: false,
        requiresUserInput: true,
        reasoningSummary: `Request is ambiguous: ${clarificationCheck.missingInformation.join(', ')} missing.`,
        suggestedResponse: clarificationCheck.question,
      };
    }

    // Classify Intent Type
    const intentType = this.classifyIntentType(lower, entities, isFollowUpRefinement, context);

    // Determine Task Complexity
    const complexity = this.determineComplexity(trimmed, lower, intentType, entities);

    // Determine Planning & Execution flags
    const requiresPlanning = complexity !== 'SIMPLE' || intentType === 'research_request';
    const requiresConfirmation = this.checkRequiresConfirmation(intentType, entities);
    const requiresExternalTool = ['search_request', 'research_request', 'app_request'].includes(intentType);
    const requiresUserInput = false;

    // Generate natural reasoning summary
    const reasoningSummary = this.generateReasoningSummary(intentType, complexity, entities);

    // Generate appropriate suggested response
    const suggestedResponse = this.generateSuggestedResponse(intentType, complexity, entities, trimmed);

    return {
      intentType,
      userRequest: trimmed,
      normalizedRequest: lower,
      detectedLanguage: language,
      entities,
      confidence: 0.92,
      complexity,
      requiresPlanning,
      requiresConfirmation,
      requiresExternalTool,
      requiresUserInput,
      reasoningSummary,
      suggestedResponse,
    };
  }

  /**
   * Classifies the primary intent category
   */
  private static classifyIntentType(
    lower: string,
    entities: JarvisEntities,
    isFollowUp: boolean,
    context: JarvisShortLivedContext | null
  ): JarvisIntentType {
    // 1. Follow-up intent preservation
    if (isFollowUp && context?.lastIntentType) {
      return context.lastIntentType;
    }

    // 2. Greetings / Conversational
    if (/^(?:hi|hello|hey|namaste|kem cho|sat sri akal|good morning|good evening|who are you|how are you|what's up|jarvis)\b/i.test(lower) && !entities.application && !entities.query) {
      return 'conversation';
    }

    // 3. Research Request (deep search, finding assets, comparing)
    if (
      entities.assetType ||
      entities.purpose ||
      /\b(?:find a|look for a|research|compare|3d model|asset for)\b/i.test(lower)
    ) {
      return 'research_request';
    }

    // 4. Device Request (torch, wifi, volume, etc.)
    if (entities.settingName || /\b(?:torch|flashlight|wifi|bluetooth|volume|brightness|battery)\b/i.test(lower)) {
      return 'device_request';
    }

    // 5. Media Request (play song, music, video)
    if (/\b(?:play|song|music|gaana|track|listen to)\b/i.test(lower) && !entities.application) {
      return 'media_request';
    }

    // 6. App Request (open YouTube, WhatsApp, Camera, etc.)
    if (entities.application || /\b(?:open|launch|kholo|chalao|start)\b/i.test(lower)) {
      return 'app_request';
    }

    // 7. Information / Search Request
    if (
      entities.query ||
      /\b(?:search|find|dhundho|latest news|information|about|ke baare mein|weather|score)\b/i.test(lower)
    ) {
      // If query is about general info/facts
      if (/\b(?:what is|who is|tell me about|batao|information)\b/i.test(lower)) {
        return 'information_request';
      }
      return 'search_request';
    }

    // 8. Customization / Theme Modification
    if (/\b(?:wallpaper|theme|icon pack|glow|edge glow|accent)\b/i.test(lower)) {
      if (/\b(?:create|make|generate)\b/i.test(lower)) {
        return 'creation_request';
      }
      return 'modification_request';
    }

    // 9. Settings Request
    if (/\b(?:assistant name|wake word|voice settings|change language)\b/i.test(lower)) {
      return 'settings_request';
    }

    // 10. File Operations
    if (/\b(?:file|download|save|pdf|document)\b/i.test(lower)) {
      return 'file_request';
    }

    // Fallback: informational question if phrasing has question marks or question words
    if (/\b(?:how|what|why|when|where|kya|kaise|kyun)\b/i.test(lower)) {
      return 'information_request';
    }

    return 'conversation';
  }

  /**
   * Determines task complexity (Simple, Multi-step, Research-complex, Ambiguous, Unsupported)
   */
  private static determineComplexity(
    raw: string,
    lower: string,
    intentType: JarvisIntentType,
    entities: JarvisEntities
  ): JarvisTaskComplexity {
    // Check for Multi-step indicators: "and", "then", "aur", "phir", multiple clauses
    const hasChaining = /\b(?:and\s+(?:then\s+)?|then\s+|aur\s+(?:phir\s+)?|phir\s+|after that)\b/i.test(lower);
    const hasMultipleActions = (entities.application && entities.secondaryTask) || (entities.application && entities.query);

    if (hasChaining || hasMultipleActions) {
      return 'MULTI_STEP';
    }

    if (intentType === 'research_request') {
      return 'RESEARCH_COMPLEX';
    }

    if (intentType === 'app_request' || intentType === 'device_request' || intentType === 'conversation') {
      return 'SIMPLE';
    }

    if (intentType === 'search_request' || intentType === 'information_request') {
      return 'SIMPLE';
    }

    return 'SIMPLE';
  }

  /**
   * Checks if request requires user confirmation before execution
   */
  private static checkRequiresConfirmation(
    intentType: JarvisIntentType,
    entities: JarvisEntities
  ): boolean {
    // Impactful actions require confirmation
    if (intentType === 'device_request' && entities.settingName === 'factory_reset') {
      return true;
    }
    if (intentType === 'file_request' && entities.action === 'delete') {
      return true;
    }
    return false;
  }

  /**
   * Detects whether input is an immediate follow-up to previous task
   */
  private static isFollowUp(lower: string, context: JarvisShortLivedContext | null): boolean {
    if (!context || !context.activeTopic) return false;

    // Follow-up patterns: "only free ones", "second one", "show me that", "usko download karo"
    const followUpPatterns = [
      /\b(?:only\s+free\s+ones?|free\s+wala|free\s+wali)\b/i,
      /\b(?:second|first|third|1st|2nd|3rd|last)\s*(?:one|wala)?\b/i,
      /\b(?:that\s+one|wo\s+wala|usko|the\s+first\s+one)\b/i,
      /\b(?:filter|sort|more|dikhao)\b/i,
    ];

    return followUpPatterns.some((pattern) => pattern.test(lower));
  }

  /**
   * Checks if input is overly ambiguous and requires clarification
   */
  private static checkNeedsClarification(
    raw: string,
    lower: string,
    entities: JarvisEntities
  ): { needsClarification: boolean; question: string; missingInformation: string[] } {
    // Example: "Make me a map"
    if (/^make\s+(?:me\s+)?a\s+map$/i.test(lower) || /^map\s+banao$/i.test(lower)) {
      return {
        needsClarification: true,
        question: 'What kind of map would you like? (e.g., GPS navigation map, fantasy game map, or world map)',
        missingInformation: ['map_type', 'target_purpose'],
      };
    }

    // Example: "Find that thing I told you about"
    if (/\b(?:that\s+thing\s+i\s+told\s+you|wo\s+chiz\s+jo\s+maine\s+batayi)\b/i.test(lower)) {
      return {
        needsClarification: true,
        question: 'Could you specify the name or details of what you are looking for?',
        missingInformation: ['specific_subject_or_name'],
      };
    }

    // Example: "Open that app" without context
    if (/^open\s+(?:that|the)\s+app$/i.test(lower)) {
      return {
        needsClarification: true,
        question: 'Which application would you like to open?',
        missingInformation: ['application_name'],
      };
    }

    return { needsClarification: false, question: '', missingInformation: [] };
  }

  /**
   * Checks if input is out-of-scope / impossible for ONEVA
   */
  private static isUnsupportedRequest(lower: string): boolean {
    const unsupportedPatterns = [
      /\b(?:bake|cook|make)\s+(?:me\s+)?(?:a\s+)?(?:pizza|cake|coffee|tea|burger|food)\b/i,
      /\b(?:fly\s+to|drive\s+me|teleport)\b/i,
      /\b(?:hack|steal|crack\s+password|bypass\s+pin)\b/i,
      /\b(?:clean\s+my\s+room|wash\s+dishes)\b/i,
    ];

    return unsupportedPatterns.some((rx) => rx.test(lower));
  }

  private static generateReasoningSummary(
    intentType: JarvisIntentType,
    complexity: JarvisTaskComplexity,
    entities: JarvisEntities
  ): string {
    if (intentType === 'app_request') {
      const app = entities.application || 'the requested application';
      if (complexity === 'MULTI_STEP') {
        return `Multi-step application workflow targeting ${app} with secondary query: "${entities.query || 'unspecified'}".`;
      }
      return `Single-step launch request targeting ${app}.`;
    }

    if (intentType === 'research_request') {
      const asset = entities.assetType || 'asset';
      const subject = entities.subject ? ` for "${entities.subject}"` : '';
      const constraints = entities.constraints?.length ? ` with constraints: [${entities.constraints.join(', ')}]` : '';
      return `Multi-step research and evaluation plan for ${asset}${subject}${constraints}.`;
    }

    if (intentType === 'device_request') {
      return `Device control targeting "${entities.settingName || 'setting'}" with value: ${entities.settingValue ?? 'toggle'}.`;
    }

    if (intentType === 'search_request' || intentType === 'information_request') {
      return `Information query regarding "${entities.query || 'topic'}".`;
    }

    return `Standard intent classification: ${intentType} (${complexity}).`;
  }

  private static generateSuggestedResponse(
    intentType: JarvisIntentType,
    complexity: JarvisTaskComplexity,
    entities: JarvisEntities,
    rawPrompt: string
  ): string {
    if (intentType === 'app_request') {
      if (complexity === 'MULTI_STEP') {
        return `Task planned: Open ${entities.application} and execute search for "${entities.query}".`;
      }
      return `Opening ${entities.application || 'app'} via system launcher.`;
    }

    if (intentType === 'research_request') {
      const constraints = entities.constraints?.includes('free') ? 'free ' : '';
      const subject = entities.subject ? `${entities.subject} ` : '';
      return `Research plan ready: Finding ${constraints}${subject}${entities.assetType || 'asset'} across verified repositories.`;
    }

    if (intentType === 'device_request') {
      const state = entities.settingValue === true ? 'ON' : entities.settingValue === false ? 'OFF' : 'toggle';
      return `Setting ${entities.settingName} to ${state}.`;
    }

    if (intentType === 'information_request' || intentType === 'search_request') {
      const q = (entities.query || rawPrompt).toLowerCase();
      if (q.includes('photosynthesis')) {
        return 'Photosynthesis is the biological process used by plants, algae, and cyanobacteria to convert light energy (sunlight), water, and carbon dioxide into chemical energy (glucose) and oxygen.';
      }
      if (q.includes('gravity')) {
        return 'Gravity is the fundamental physical force that pulls objects with mass toward one another, keeping planets in orbit and objects on the ground.';
      }
      if (q.includes('speed of light')) {
        return 'The speed of light in a vacuum is exactly 299,792,458 meters per second (approximately 300,000 km/s or 186,282 miles/s).';
      }
      return `Query recognized: Retrieving data for "${entities.query || rawPrompt}".`;
    }

    if (intentType === 'conversation') {
      return `Online and listening. How can I enhance your Android experience today?`;
    }

    return `Understood: "${rawPrompt}".`;
  }
}
