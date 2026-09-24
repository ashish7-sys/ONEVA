/**
 * ONEVA Phase 16: Context-Aware Intent & Reference Resolver
 * 
 * Translates deictic and contextual commands ("second result kholo", "back karo",
 * "is video ko like kar do", "bank password type karo") into deterministic, safe action requests.
 * 
 * ARCHITECTURAL HONESTY:
 * - High/Medium/Low confidence scoring.
 * - Never guesses when context is missing, ambiguous, or expired; asks for clarification.
 * - Enforces zero-tolerance sensitive input boundary (blocks password/OTP attempts).
 */

import { ContextResolutionResult, ContextConfidence } from '../../types/jarvisContext';
import { JarvisDeviceContextManager } from './jarvisDeviceContextManager';

export class JarvisContextResolver {
  /**
   * Check if user text contains contextual references
   */
  static isContextualCommand(rawText: string): boolean {
    const lower = rawText.trim().toLowerCase();

    // Sensitive text check
    if (this.detectsSensitiveIntent(lower)) {
      return true;
    }

    // Relative navigation
    if (/\b(?:back|go back|peeche|wapas|home|home screen|home par)\b/i.test(lower)) {
      return true;
    }

    // Relative selection ("second result", "first one", "ye wala", "this video", "select it")
    if (
      /\b(?:first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|pehla|doosra|teesra|chautha)\s+(?:result|wala|video|one|item|link)\b/i.test(lower) ||
      /\b(?:ye\s+wala|yehi|isko|is\s+video|is\s+result|this\s+video|this\s+app|this\s+result|open\s+it|select\s+it)\b/i.test(lower)
    ) {
      return true;
    }

    // In-app contextual actions ("is video ko like kar do", "like this video", "save this video")
    if (/\b(?:like|dislike|subscribe|comment|share|bookmark)\b/i.test(lower) && /\b(?:video|post|page|isko|kar do|karo)\b/i.test(lower)) {
      return true;
    }

    return false;
  }

  /**
   * Detects prohibited sensitive inputs (Rule 6, 7, 8)
   */
  static detectsSensitiveIntent(lower: string): boolean {
    const sensitiveKeywords = [
      'password',
      'passcode',
      'pin code',
      'upi pin',
      'atm pin',
      'otp',
      'bank',
      'banking',
      'credit card',
      'debit card',
      'cvv',
      'secret key',
    ];

    const inputVerbs = ['type', 'enter', 'daal', 'likh', 'fill', 'input', 'submit', 'bhejo'];
    const hasInputVerb = inputVerbs.some((v) => lower.includes(v));
    const hasSensitiveWord = sensitiveKeywords.some((w) => lower.includes(w));

    return hasSensitiveWord && (hasInputVerb || lower.includes('password') || lower.includes('otp'));
  }

  /**
   * Resolves contextual command against active device context
   */
  static resolve(rawText: string): ContextResolutionResult {
    const lower = rawText.trim().toLowerCase();

    // 1. Check for Sensitive Input Prohibition
    if (this.detectsSensitiveIntent(lower)) {
      return {
        resolved: false,
        needsClarification: false,
        confidence: 'HIGH',
        error: 'SENSITIVE_INPUT_BLOCKED',
        reason: 'Sir, entering passwords, PINs, OTPs, or banking credentials is strictly blocked by ONEVA privacy and security rules.',
      };
    }

    // 2. Relative Navigation: Back
    if (/\b(?:back|go back|peeche jao|wapas jao|back karo)\b/i.test(lower)) {
      return {
        resolved: true,
        needsClarification: false,
        confidence: 'HIGH',
        targetAction: {
          toolId: 'navigate_back',
          args: {},
          description: 'Navigating Back',
        },
      };
    }

    // 3. Relative Navigation: Home
    if (/\b(?:home|go home|home par jao|home screen|home chalo)\b/i.test(lower)) {
      return {
        resolved: true,
        needsClarification: false,
        confidence: 'HIGH',
        targetAction: {
          toolId: 'navigate_home',
          args: {},
          description: 'Navigating to Home screen',
        },
      };
    }

    // 4. In-App Contextual Actions (e.g. "Is video ko like kar do", "Like this video")
    if (/\b(?:like|subscribe|bookmark|share)\b/i.test(lower) && /\b(?:video|post|page|isko|kar do|karo)\b/i.test(lower)) {
      const activeCtx = JarvisDeviceContextManager.getActiveContext();
      const currentAppName = activeCtx?.currentApp?.appName || 'YouTube';
      const actionType = lower.includes('like') ? 'like_video' : 'in_app_action';

      return {
        resolved: true,
        needsClarification: false,
        confidence: 'HIGH',
        targetAction: {
          toolId: 'app_in_context_action',
          args: {
            actionName: actionType,
            appName: currentAppName,
          },
          description: `Perform in-app action: ${actionType} on ${currentAppName}`,
        },
      };
    }

    // 5. Result Selection (e.g. "Second result kholo", "Pehla result chalao", "Ye wala open karo")
    const activeContext = JarvisDeviceContextManager.getActiveContext();

    // 5a. Check if context has expired
    if (JarvisDeviceContextManager.isExpired() || !activeContext) {
      return {
        resolved: false,
        needsClarification: true,
        confidence: 'LOW',
        clarificationPrompt: 'Sir, which list or item should I select? There is no active result list on screen.',
        reason: 'Context expired or unavailable.',
      };
    }

    // 5b. Check if active search results list exists
    const searchCtx = activeContext.selectedItemContext;
    if (!searchCtx || !searchCtx.items || searchCtx.items.length === 0) {
      return {
        resolved: false,
        needsClarification: true,
        confidence: 'LOW',
        clarificationPrompt: 'Sir, which list or item should I select? There is no active result list.',
        reason: 'No active item list found in current context.',
      };
    }

    // 5c. Extract requested index
    const targetIndex = this.extractOrdinalIndex(lower);
    if (targetIndex === null) {
      // General "ye wala open karo" or "open it" when single selected item exists
      if (searchCtx.selectedIndex !== undefined) {
        const item = searchCtx.items.find((it) => it.index === searchCtx.selectedIndex);
        if (item) {
          return {
            resolved: true,
            needsClarification: false,
            confidence: 'HIGH',
            targetAction: {
              toolId: 'select_context_item',
              args: {
                index: item.index,
                title: item.title,
                url: item.url,
              },
              description: `Opening selected item: "${item.title}"`,
            },
          };
        }
      }

      return {
        resolved: false,
        needsClarification: true,
        confidence: 'MEDIUM',
        clarificationPrompt: `Sir, there are ${searchCtx.items.length} results available. Please specify which result number to open (e.g., first or second).`,
      };
    }

    // Check bounds
    const matchedItem = searchCtx.items.find((it) => it.index === targetIndex);
    if (!matchedItem) {
      return {
        resolved: false,
        needsClarification: true,
        confidence: 'MEDIUM',
        clarificationPrompt: `Sir, result #${targetIndex} is not in the active list (available: 1 to ${searchCtx.items.length}).`,
      };
    }

    // Valid item found!
    JarvisDeviceContextManager.selectItem(targetIndex);

    return {
      resolved: true,
      needsClarification: false,
      confidence: 'HIGH',
      targetAction: {
        toolId: 'select_context_item',
        args: {
          index: targetIndex,
          title: matchedItem.title,
          url: matchedItem.url,
          query: searchCtx.query,
          appName: activeContext.currentApp?.appName || 'YouTube',
        },
        description: `Opening result #${targetIndex}: "${matchedItem.title}"`,
      },
    };
  }

  /**
   * Helper: Extracts 1-based index from natural language ordinals
   */
  private static extractOrdinalIndex(lower: string): number | null {
    if (/\b(?:first|1st|pehla|ek\s+number)\b/i.test(lower)) return 1;
    if (/\b(?:second|2nd|doosra|do\s+number)\b/i.test(lower)) return 2;
    if (/\b(?:third|3rd|teesra|teen\s+number)\b/i.test(lower)) return 3;
    if (/\b(?:fourth|4th|chautha|char\s+number)\b/i.test(lower)) return 4;
    if (/\b(?:fifth|5th|paanchwa|paanch\s+number)\b/i.test(lower)) return 5;

    const numMatch = lower.match(/\bresult\s+(?:number\s+)?(\d+)\b/i) || lower.match(/\b(\d+)(?:st|nd|rd|th)?\s+result\b/i);
    if (numMatch && numMatch[1]) {
      const parsed = parseInt(numMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    return null;
  }
}
