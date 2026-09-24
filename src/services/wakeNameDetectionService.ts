/**
 * ONEVA Phase 10: Wake Name Detection Service
 * Normalizes speech input, checks configured aliases, extracts commands,
 * and handles natural phrasing (e.g., "Hey Jarvis", "Jarvis listen").
 */

import { WakeNameDetectionResult } from '../types/jarvisVoice';

export interface WakeWordValidationResult {
  valid: boolean;
  normalizedName: string;
  error?: string;
}

export class WakeNameDetectionService {
  /**
   * Cleans and normalizes text for token matching
   */
  static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Validates a custom wake name before saving
   */
  static validateWakeName(
    name: string,
    existingNames: string[]
  ): WakeWordValidationResult {
    const trimmed = name.trim();
    if (!trimmed) {
      return { valid: false, normalizedName: '', error: 'Wake name cannot be empty.' };
    }

    if (trimmed.length < 2) {
      return { valid: false, normalizedName: trimmed, error: 'Wake name must be at least 2 characters.' };
    }

    if (trimmed.length > 30) {
      return { valid: false, normalizedName: trimmed, error: 'Wake name cannot exceed 30 characters.' };
    }

    const normalized = trimmed.toLowerCase();
    const isDuplicate = existingNames.some(
      (existing) => existing.trim().toLowerCase() === normalized
    );

    if (isDuplicate) {
      return {
        valid: false,
        normalizedName: trimmed,
        error: `"${trimmed}" is already present in your wake names list.`,
      };
    }

    // Capitalize first letter of each word for clean display
    const formatted = trimmed
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    return { valid: true, normalizedName: formatted };
  }

  /**
   * Detects wake name in incoming speech transcript
   * @param rawTranscript The spoken text from the speech recognition engine
   * @param activeWakeNames List of currently enabled wake names (e.g. Jarvis, Friday, Ultron)
   * @param isSessionActive Whether a 10-minute active session is currently awake
   */
  static detectWakeName(
    rawTranscript: string,
    activeWakeNames: string[],
    isSessionActive: boolean = false
  ): WakeNameDetectionResult {
    const normalized = this.normalizeText(rawTranscript);

    if (!normalized) {
      return {
        addressedToJarvis: false,
        remainingCommand: '',
        rawTranscript,
      };
    }

    // Natural wake prefixes often spoken by users
    const naturalPrefixes = ['hey', 'ok', 'okay', 'hi', 'hello', 'yo', 'listen'];

    // Search for any active wake name
    for (const wakeName of activeWakeNames) {
      const cleanWakeName = wakeName.trim().toLowerCase();
      if (!cleanWakeName) continue;

      // Regex matching wake name as a distinct word
      const wakeRegex = new RegExp(`\\b${cleanWakeName}\\b`, 'i');
      const matchIndex = normalized.search(wakeRegex);

      if (matchIndex !== -1) {
        // Matched!
        let naturalPrefixFound: string | undefined;

        // Check if preceding words were a natural prefix like "hey" or "listen"
        const beforeText = normalized.slice(0, matchIndex).trim();
        if (beforeText) {
          const beforeWords = beforeText.split(' ');
          const lastBeforeWord = beforeWords[beforeWords.length - 1];
          if (naturalPrefixes.includes(lastBeforeWord)) {
            naturalPrefixFound = lastBeforeWord;
          }
        }

        // Calculate remaining command after the wake name (and any trailing punctuation/filler words like "listen", "please")
        const endOfWakeIndex = matchIndex + cleanWakeName.length;
        let commandPart = normalized.slice(endOfWakeIndex).trim();

        // Strip leading fillers like "listen", "can you", "please"
        commandPart = commandPart
          .replace(/^(?:listen|please|can you|could you)\s+/i, '')
          .trim();

        return {
          addressedToJarvis: true,
          matchedWakeName: wakeName,
          remainingCommand: commandPart,
          rawTranscript,
          naturalPrefixFound,
        };
      }
    }

    // If no wake name was explicitly found, but session is ALREADY ACTIVE,
    // the user does NOT need to repeat the wake name!
    if (isSessionActive) {
      return {
        addressedToJarvis: true,
        remainingCommand: normalized,
        rawTranscript,
      };
    }

    // Not addressed to Jarvis
    return {
      addressedToJarvis: false,
      remainingCommand: '',
      rawTranscript,
    };
  }
}
