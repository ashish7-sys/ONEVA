/**
 * ONEVA Phase 19: Premium Jarvis Text-To-Speech (TTS) Engine
 * 
 * Hardware-integrated, privacy-first speech synthesis engine:
 * - Natural pacing, sentence cadence, and text sanitization (strips technical noise)
 * - Dynamic voice selection with high-quality natural voice prioritizer
 * - Deduplication protection against React re-render loops
 * - Immediate, safe voice interruption (cancels speech and restores IDLE)
 * - Watchdog timeout to prevent voice engine hangs on mobile browsers
 * - Graceful fallback if TTS is unavailable or blocked
 */

import {
  JarvisTtsVoiceInfo,
  JarvisVoiceStatusPhase19,
  TtsSpeechRequest,
  JarvisVoiceGender,
} from '../../types/jarvisPersonality';
import { JarvisPersonalityEngine } from '../intelligence/jarvisPersonalityEngine';

export class JarvisTtsEngine {
  private static isInitialized = false;
  private static isSpeaking = false;
  private static currentStatus: JarvisVoiceStatusPhase19 = 'IDLE';
  private static availableVoices: JarvisTtsVoiceInfo[] = [];
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static activeUtteranceId: string | null = null;
  private static currentlySpeakingText: string = '';
  private static lastSpokenHash: string = '';
  private static lastSpokenTime: number = 0;
  private static watchdogTimer: ReturnType<typeof setTimeout> | null = null;

  private static listeners: Set<() => void> = new Set();
  private static stateChangeListeners: Set<(state: JarvisVoiceStatusPhase19) => void> = new Set();
  private static speechStartListeners: Set<() => void> = new Set();
  private static speechEndListeners: Set<() => void> = new Set();
  private static speechInterruptListeners: Set<(reason?: string) => void> = new Set();

  /**
   * Initializes the TTS engine and populates voices
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.refreshVoices();

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.refreshVoices();
        };
      }
    }
  }

  /**
   * Checks if Text-to-Speech is supported by the browser/environment
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  /**
   * Robust detection for whether a voice is inherently male across Android, Chrome, Windows, iOS, and Samsung TTS
   */
  static isVoiceActuallyMale(v: { name: string; voiceURI: string }): boolean {
    const s = `${v.name} ${v.voiceURI}`.toLowerCase();

    // Check for female indicators first
    const hasFemaleMarker = /(?:^|[\s_#(/-])female(?:[\s_#)/-]|\d|$)|uk english female|\bus english\b|google हिन्दी|\b(samantha|karen|victoria|zira|serena|susan|swara|heera|hazel|aria|jenny|xiaoxiao|ayumi|veena|kalpana|girl|woman)\b/i.test(s);

    // Explicit male indicators (handles Android #male_1, -male-, male_2, Daniel, David, Ravi, Rishi, etc.)
    const hasMaleMarker = /(?:^|[\s_#(/-])male(?:[\s_#)/-]|\d|$)|(?:^|[\s_#(/-])man(?:[\s_#)/-]|$)|uk english male|\b(daniel|david|george|arthur|oliver|guy|mark|rishi|neel|madhur|ravi|alex|fred|tom|jack|brian|william|richard|james|steffan|christopher|eric|ryan|andrew|paul|john|michael|kevin|jason|aaron|peter|carl|roger|sean|reed|evan|nathan|gordon)\b/i.test(s);

    return hasMaleMarker && !hasFemaleMarker;
  }

  /**
   * Robust detection for whether a voice is inherently female
   */
  static isVoiceActuallyFemale(v: { name: string; voiceURI: string }): boolean {
    const s = `${v.name} ${v.voiceURI}`.toLowerCase();

    const hasFemaleMarker = /(?:^|[\s_#(/-])female(?:[\s_#)/-]|\d|$)|uk english female|\bus english\b|google हिन्दी|\b(samantha|karen|victoria|zira|serena|susan|swara|heera|hazel|aria|jenny|xiaoxiao|ayumi|veena|kalpana|girl|woman)\b/i.test(s);
    const hasMaleMarker = /(?:^|[\s_#(/-])male(?:[\s_#)/-]|\d|$)|(?:^|[\s_#(/-])man(?:[\s_#)/-]|$)|uk english male|\b(daniel|david|george|arthur|oliver|guy|mark|rishi|neel|madhur|ravi|alex|fred)\b/i.test(s);

    return hasFemaleMarker && !hasMaleMarker;
  }

  /**
   * Refreshes the list of compatible voices
   */
  static refreshVoices(): JarvisTtsVoiceInfo[] {
    if (!this.isSupported()) {
      this.availableVoices = [];
      this.cachedVoices = [];
      return [];
    }

    try {
      const raw = window.speechSynthesis.getVoices();
      if (!raw || raw.length === 0) {
        return this.availableVoices;
      }

      this.cachedVoices = raw;
      this.availableVoices = raw.map((v) => {
        const isMale = this.isVoiceActuallyMale(v);
        const isFemale = this.isVoiceActuallyFemale(v);
        const tag = isMale ? ' [♂ Male]' : isFemale ? ' [♀ Female]' : '';
        return {
          name: v.name,
          lang: v.lang,
          voiceURI: v.voiceURI,
          isDefault: v.default,
          localService: v.localService,
          displayName: `${v.name} (${v.lang})${tag}${v.default ? ' - Default' : ''}`,
        };
      });

      this.notify();
      return this.availableVoices;
    } catch (e) {
      console.warn('[JarvisTtsEngine] Error retrieving voices:', e);
      return [];
    }
  }

  /**
   * Gets available voices list
   */
  static getVoices(): JarvisTtsVoiceInfo[] {
    if (this.availableVoices.length === 0) {
      this.refreshVoices();
    }
    return [...this.availableVoices];
  }

  /**
   * Selects the most appropriate natural voice for the given language, preference and gender
   */
  static resolveVoice(
    preferredURI: string = 'auto',
    targetLanguage: string = 'en',
    gender: JarvisVoiceGender = 'male'
  ): SpeechSynthesisVoice | null {
    if (!this.isSupported()) return null;

    try {
      let all = window.speechSynthesis.getVoices();
      if ((!all || all.length === 0) && this.cachedVoices.length > 0) {
        all = this.cachedVoices;
      }
      if (!all || all.length === 0) return null;

      // 1. Check user preferred voice URI if explicitly chosen and not 'auto'
      if (preferredURI && preferredURI !== 'auto') {
        const matched = all.find((v) => v.voiceURI === preferredURI || v.name === preferredURI);
        if (matched) return matched;
      }

      const langPrefix = targetLanguage.toLowerCase().startsWith('hi') ? 'hi' : 'en';

      if (gender === 'male') {
        // High-precision Male Voice Prioritizer:
        // Rank every available voice to guarantee a genuine male voice
        let bestVoice: SpeechSynthesisVoice | null = null;
        let bestScore = -99999;

        for (const v of all) {
          const isMale = this.isVoiceActuallyMale(v);
          const isFemale = this.isVoiceActuallyFemale(v);
          // Strictly avoid female voices for male profile
          if (isFemale) continue;

          const lang = v.lang.toLowerCase();
          const name = v.name.toLowerCase();
          let score = isMale ? 1000 : 0;

          // Archetype priority 1: British Male voices (Iconic Tony Stark's JARVIS)
          if (/uk english male|daniel|george|oliver|arthur/i.test(name) || (lang.startsWith('en-gb') && isMale)) {
            score += 600;
          }
          // Archetype priority 2: Indian English / Hindi Male voices (Great for bilingual Hindi & English)
          if (/india|hindi|rishi|ravi|madhur|neel/i.test(name) || lang === 'hi-in' || lang === 'en-in') {
            score += langPrefix === 'hi' ? 700 : 450;
          }
          // Archetype priority 3: US / Global Male voices
          if (/david|guy|mark|alex|fred|christopher|ryan|eric/i.test(name) || (lang.startsWith('en-us') && isMale)) {
            score += 400;
          }

          // Language match bonus
          if (lang.startsWith(langPrefix)) {
            score += 300;
          } else if (lang.startsWith('en')) {
            score += 200;
          }

          if (score > bestScore) {
            bestScore = score;
            bestVoice = v;
          }
        }

        if (bestVoice) {
          return bestVoice;
        }

        // If no confirmed male voice found in system:
        // Filter language voices that are not explicitly female
        const langVoices = all.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
        const nonFemale = langVoices.find((v) => !this.isVoiceActuallyFemale(v));
        if (nonFemale) return nonFemale;

        // Fallback: language default or system default (will be pitch-shifted to male baritone)
        const def = langVoices.find((v) => v.default) || langVoices[0] || all.find((v) => v.default) || all[0];
        return def;
      } else {
        // Female Voice Prioritizer
        const femaleVoice =
          all.find((v) => {
            const isFemale = this.isVoiceActuallyFemale(v);
            const lang = v.lang.toLowerCase();
            return isFemale && lang.startsWith(langPrefix);
          }) ||
          all.find((v) => this.isVoiceActuallyFemale(v)) ||
          all.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
          all.find((v) => v.default) ||
          all[0];

        return femaleVoice;
      }
    } catch {
      return null;
    }
  }

  /**
   * Sanitizes spoken text to remove technical code, markdown symbols, and awkward strings
   */
  static sanitizeForSpeech(rawText: string): string {
    if (!rawText) return '';

    let clean = rawText
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove URLs
      .replace(/https?:\/\/\S+/gi, 'the linked webpage')
      // Remove JSON formatting or bracket dumps
      .replace(/\{[^}]*\}/g, '')
      .replace(/\[[^\]]*\]/g, '')
      // Remove markdown bold/italics
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      // Remove bullet points / hashtags
      .replace(/^[ \t]*[-*#]+[ \t]+/gm, '')
      // Expand common acronyms for natural speech
      .replace(/\bETA\b/g, 'E T A')
      .replace(/\bWi-?Fi\b/gi, 'Why Fye')
      .replace(/\bAPI\b/g, 'A P I')
      .replace(/\bUI\b/g, 'U I')
      .replace(/\bID\b/g, 'I D')
      .replace(/\bURL\b/g, 'U R L')
      // Replace technical status codes
      .replace(/\bstatus code:?\s*\d+\b/gi, 'request status')
      // Collapse multiple whitespace
      .replace(/\s+/g, ' ')
      .trim();

    return clean;
  }

  /**
   * Speaks a response cleanly with natural pacing and deduplication
   */
  static speak(request: TtsSpeechRequest): { success: boolean; reason?: string } {
    this.init();

    if (!this.isSupported()) {
      request.onError?.('SpeechSynthesis is not supported in this environment');
      return { success: false, reason: 'unsupported' };
    }

    const rawText = request.spokenText || request.text;
    const cleanSpeech = this.sanitizeForSpeech(rawText);

    if (!cleanSpeech) {
      request.onError?.('Empty speech text after sanitization');
      return { success: false, reason: 'empty_text' };
    }

    // Deduplication check: prevent identical speech in rapid succession (< 600ms)
    const textHash = `${cleanSpeech}_${request.language || 'en'}`;
    const now = Date.now();
    if (this.lastSpokenHash === textHash && now - this.lastSpokenTime < 600) {
      return { success: true, reason: 'deduplicated' };
    }
    this.lastSpokenHash = textHash;
    this.lastSpokenTime = now;

    // Cancel any previous speaking utterance cleanly
    this.cancelInternal();

    try {
      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      const utteranceId = request.id || `utt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      this.activeUtteranceId = utteranceId;
      this.currentlySpeakingText = cleanSpeech;

      // Load personality preferences for fallback
      const prefs = JarvisPersonalityEngine.getPreferences();

      // Configure Voice & Gender (defaulting to male per user requirement)
      const gender: JarvisVoiceGender = request.gender || prefs.voiceGender || 'male';
      const preferredURI = request.voiceURI || (prefs.selectedVoiceURI !== 'auto' ? prefs.selectedVoiceURI : 'auto');
      const targetLang = request.language || (prefs.language === 'auto' ? 'en' : prefs.language) || 'en';

      const voice = this.resolveVoice(preferredURI, targetLang, gender);
      let isActualMale = false;

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
        isActualMale = this.isVoiceActuallyMale(voice);
      } else if (targetLang) {
        utterance.lang = targetLang.startsWith('hi') ? 'hi-IN' : 'en-US';
      }

      // Default rate: 0.9x (per user requirement: slightly slower than 1.0x, clear, confident)
      const defaultRate = prefs.speechRate || 0.9;
      utterance.rate = Math.max(0.7, Math.min(1.5, request.rate ?? defaultRate));

      // Configure Pitch with deep resonant male acoustics
      if (gender === 'male') {
        if (isActualMale) {
          // Genuine male voice: 0.88 gives deep, confident, acoustic warmth
          utterance.pitch = Math.max(0.75, Math.min(1.0, request.pitch ?? prefs.speechPitch ?? 0.88));
        } else {
          // If no male voice on device (fallback to system/female), pitch-shift down to male baritone register (0.60)
          // to ensure it sounds distinctly like a male robotic AI and NEVER like a female!
          utterance.pitch = 0.60;
        }
      } else {
        // Female voice profile: lovely and melodic
        utterance.pitch = Math.max(0.95, Math.min(1.3, request.pitch ?? prefs.speechPitch ?? 1.08));
      }

      // Calculate safe watchdog duration: 1 word ~= 350ms, plus 2.5s buffer
      const wordCount = cleanSpeech.split(/\s+/).length;
      const estimatedDurationMs = Math.max(2500, wordCount * 450 + 2500);

      // Setup Watchdog Timer to prevent stuck SPEAKING state
      this.watchdogTimer = setTimeout(() => {
        if (this.activeUtteranceId === utteranceId && this.isSpeaking) {
          console.warn('[JarvisTtsEngine] Watchdog triggered: resetting speech state.');
          this.handleSpeechComplete(request, utteranceId);
        }
      }, estimatedDurationMs);

      // Event handlers
      utterance.onstart = () => {
        if (this.activeUtteranceId === utteranceId) {
          this.isSpeaking = true;
          this.setStatus('SPEAKING');
          this.speechStartListeners.forEach((fn) => fn());
          request.onStart?.();
          this.notify();
        }
      };

      utterance.onend = () => {
        if (this.activeUtteranceId === utteranceId) {
          this.handleSpeechComplete(request, utteranceId);
        }
      };

      utterance.onerror = (ev) => {
        if (this.activeUtteranceId === utteranceId) {
          // 'interrupted' or 'canceled' are expected when user stops
          if (ev.error === 'interrupted' || ev.error === 'canceled') {
            this.speechInterruptListeners.forEach((fn) => fn('speech_interrupted'));
            request.onInterrupted?.();
          } else {
            console.warn('[JarvisTtsEngine] Speech error event:', ev.error);
            request.onError?.(ev.error || 'TTS utterance error');
          }
          this.handleSpeechComplete(request, utteranceId);
        }
      };

      // Speak
      window.speechSynthesis.speak(utterance);
      return { success: true };
    } catch (err: unknown) {
      console.warn('[JarvisTtsEngine] Failed to initiate speech:', err);
      this.isSpeaking = false;
      this.currentlySpeakingText = '';
      this.setStatus('IDLE');
      const errStr = err instanceof Error ? err.message : String(err);
      request.onError?.(errStr);
      return { success: false, reason: errStr };
    }
  }

  /**
   * Completes a speech session and cleanly resets to IDLE
   */
  private static handleSpeechComplete(request: TtsSpeechRequest, utteranceId: string): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    if (this.activeUtteranceId === utteranceId) {
      this.activeUtteranceId = null;
      this.isSpeaking = false;
      this.currentlySpeakingText = '';
      this.setStatus('IDLE');
      this.speechEndListeners.forEach((fn) => fn());
      request.onEnd?.();
      this.notify();
    }
  }

  /**
   * Safe Voice Interruption: immediately stops all speech and returns to IDLE
   */
  static interrupt(reason?: string): void {
    this.cancelInternal();
    this.activeUtteranceId = null;
    this.isSpeaking = false;
    this.currentlySpeakingText = '';
    this.setStatus('IDLE');
    this.speechInterruptListeners.forEach((fn) => fn(reason || 'manual_interrupt'));
    this.notify();
  }

  /**
   * Internal cancellation helper
   */
  private static cancelInternal(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('[JarvisTtsEngine] Error cancelling speech:', e);
      }
    }
  }

  // ==========================================
  // State & Subscriptions
  // ==========================================

  static getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  static getCurrentlySpeakingText(): string {
    return this.currentlySpeakingText;
  }

  static onSpeechStart(listener: () => void): () => void {
    this.speechStartListeners.add(listener);
    return () => {
      this.speechStartListeners.delete(listener);
    };
  }

  static onSpeechEnd(listener: () => void): () => void {
    this.speechEndListeners.add(listener);
    return () => {
      this.speechEndListeners.delete(listener);
    };
  }

  static onSpeechInterrupt(listener: (reason?: string) => void): () => void {
    this.speechInterruptListeners.add(listener);
    return () => {
      this.speechInterruptListeners.delete(listener);
    };
  }

  static getStatus(): JarvisVoiceStatusPhase19 {
    return this.currentStatus;
  }

  static setStatus(status: JarvisVoiceStatusPhase19): void {
    if (this.currentStatus === status) return;
    this.currentStatus = status;
    this.stateChangeListeners.forEach((fn) => fn(status));
    this.notify();
  }

  static onStateChange(listener: (status: JarvisVoiceStatusPhase19) => void): () => void {
    this.stateChangeListeners.add(listener);
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

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
