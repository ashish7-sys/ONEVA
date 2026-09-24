/**
 * ONEVA Phase 19: Jarvis Response Style & Personality Engine
 * 
 * Formats responses to match JARVIS's distinctive calm, professional persona:
 * - Natural cadence and non-repetitive addressing (Sir / Ma'am / Neutral / Custom)
 * - Concise, balanced, or detailed response styles based on intent complexity
 * - Strict honesty: never claims an action succeeded unless verified
 * - Privacy-first multi-user isolation respecting Phase 14 Actor profiles
 * - Clean error and offline phrasing without exposing internal stack traces
 * - Multilingual English & Hindi / Hinglish natural speech delivery
 */

import {
  JarvisAddressMode,
  JarvisPersonalityPreferences,
  JarvisPersonalityStyle,
  FormattedJarvisResponse,
  DEFAULT_PERSONALITY_PREFERENCES,
} from '../../types/jarvisPersonality';
import { OwnerAuthService } from '../memory/ownerAuthService';

const STORAGE_KEY_PREFS = 'oneva_jarvis_personality_prefs_v19';

export class JarvisPersonalityEngine {
  private static preferences: JarvisPersonalityPreferences = { ...DEFAULT_PERSONALITY_PREFERENCES };
  private static isInitialized = false;
  private static addressCounter = 0; // Natural variation counter to avoid repeating "Sir" on every line
  private static listeners: Set<() => void> = new Set();

  /**
   * Initializes personality preferences from local storage
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFS);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.preferences = { ...DEFAULT_PERSONALITY_PREFERENCES, ...parsed };
        }
      } catch (e) {
        console.warn('[JarvisPersonalityEngine] Failed to load preferences:', e);
      }
    }
  }

  // ==========================================
  // Preferences Management & Multi-User Isolation
  // ==========================================

  /**
   * Gets preferences with multi-user isolation.
   * If a non-owner actor is active, returns sanitized non-owner preferences.
   */
  static getPreferences(): JarvisPersonalityPreferences {
    this.init();
    const activeActor = OwnerAuthService.getActiveActor();

    // Multi-user safety: if actor is not the primary device owner, use neutral addressing
    if (activeActor && activeActor.type !== 'owner') {
      return {
        ...this.preferences,
        addressMode: 'neutral',
        customAddressName: activeActor.displayName || 'Guest',
      };
    }

    return { ...this.preferences };
  }

  static savePreferences(updates: Partial<JarvisPersonalityPreferences>): void {
    this.init();
    const current = this.preferences;
    this.preferences = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(this.preferences));
      } catch (e) {
        console.warn('[JarvisPersonalityEngine] Failed to save preferences:', e);
      }
    }

    this.notify();
  }

  static resetPreferences(): void {
    this.preferences = { ...DEFAULT_PERSONALITY_PREFERENCES };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY_PREFS);
      } catch {
        // Safe fallback
      }
    }
    this.notify();
  }

  // ==========================================
  // Address Resolution
  // ==========================================

  /**
   * Resolves the current title with natural variation.
   * Does NOT force "sir" into every single sentence.
   */
  static resolveAddress(forceInclude: boolean = false): string | null {
    const prefs = this.getPreferences();
    this.addressCounter++;

    // For natural variation, only attach title on ~65% of turns unless forced
    const shouldUse = forceInclude || this.addressCounter % 3 !== 0;

    if (!shouldUse && prefs.addressMode !== 'custom') {
      return null;
    }

    switch (prefs.addressMode) {
      case 'sir':
        return 'sir';
      case 'maam':
        return "ma'am";
      case 'custom':
        return prefs.customAddressName?.trim() || null;
      case 'neutral':
      default:
        return null;
    }
  }

  // ==========================================
  // Response Style Engine
  // ==========================================

  /**
   * Formats a raw output or intent response into Jarvis's distinctive,
   * calm, professional personality.
   */
  static formatResponse(options: {
    rawMessage: string;
    intentType?: string;
    isActionSuccess?: boolean;
    isOffline?: boolean;
    isError?: boolean;
    language?: 'en' | 'hi' | string;
    complexity?: 'SIMPLE' | 'COMPLEX' | 'AMBIGUOUS' | string;
    actionName?: string;
  }): FormattedJarvisResponse {
    this.init();
    const prefs = this.getPreferences();
    const isHindi = options.language === 'hi' || /[\u0900-\u097F]/.test(options.rawMessage);
    const targetLang: 'en' | 'hi' = isHindi ? 'hi' : 'en';

    const address = this.resolveAddress(options.isActionSuccess || options.isError);
    let displayText = options.rawMessage.trim();
    let spokenText = displayText;

    // 1. OFFLINE HANDLING
    if (options.isOffline) {
      if (targetLang === 'hi') {
        displayText = address
          ? `Main local actions perform kar sakta hoon, par abhi internet service uplabdh nahi hai, ${address}.`
          : 'Main local actions perform kar sakta hoon, par abhi internet service uplabdh nahi hai.';
      } else {
        displayText = address
          ? `I can handle local actions, but I can't access that online service right now, ${address}.`
          : "I can handle local actions, but I can't access that online service right now.";
      }
      return {
        displayText,
        spokenText: displayText,
        addressUsed: address || undefined,
        style: prefs.personalityStyle,
        language: targetLang,
        isError: false,
        isActionSuccess: false,
      };
    }

    // 2. ERROR / FAILURE HANDLING (Never expose internal stack traces)
    if (options.isError) {
      // Strip technical error codes
      let cleanError = options.rawMessage
        .replace(/Error:\s*/gi, '')
        .replace(/status code:?\s*\d+/gi, 'service unavailable')
        .replace(/\[.*?\]/g, '');

      if (targetLang === 'hi') {
        displayText = address
          ? `Main yeh action complete nahi kar saka, ${address}. Kripya dobara koshish karein.`
          : 'Main yeh action complete nahi kar saka. Kripya dobara koshish karein.';
      } else {
        displayText = address
          ? `I couldn't complete that action, ${address}. You can try again.`
          : "I couldn't complete that action. You can try again.";
      }

      return {
        displayText: `${displayText} ${cleanError ? `(${cleanError})` : ''}`.trim(),
        spokenText: displayText,
        addressUsed: address || undefined,
        style: prefs.personalityStyle,
        language: targetLang,
        isError: true,
        isActionSuccess: false,
      };
    }

    // 3. SUCCESSFUL ANDROID ACTIONS
    if (options.isActionSuccess && options.actionName) {
      const act = options.actionName;
      if (targetLang === 'hi') {
        displayText = address
          ? `${act} poora ho gaya hai, ${address}.`
          : `${act} poora ho gaya hai.`;
      } else {
        displayText = address
          ? `${act} completed, ${address}.`
          : `${act} completed.`;
      }

      return {
        displayText,
        spokenText: displayText,
        addressUsed: address || undefined,
        style: prefs.personalityStyle,
        language: targetLang,
        isError: false,
        isActionSuccess: true,
      };
    }

    // 4. SIMPLE COMMAND FORMATTING
    if (options.complexity === 'SIMPLE' || options.intentType === 'app_request') {
      if (prefs.personalityStyle === 'concise') {
        // Keep it ultra crisp
        spokenText = displayText;
      } else if (prefs.personalityStyle === 'detailed') {
        // Add helpful context
        spokenText = address
          ? `Right away, ${address}. ${displayText}`
          : `Right away. ${displayText}`;
        displayText = spokenText;
      } else {
        // Balanced
        if (address && !displayText.toLowerCase().includes(address.toLowerCase())) {
          displayText = `${displayText}, ${address}.`;
          spokenText = displayText;
        }
      }
    }

    // 5. NATURAL POLISHING
    // Avoid double punctuation
    displayText = displayText.replace(/\s*([,.])\s*([,.])/g, '$1');
    spokenText = spokenText.replace(/\s*([,.])\s*([,.])/g, '$1');

    return {
      displayText,
      spokenText,
      addressUsed: address || undefined,
      style: prefs.personalityStyle,
      language: targetLang,
      isError: false,
      isActionSuccess: options.isActionSuccess,
    };
  }

  // ==========================================
  // Subscriptions
  // ==========================================

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
