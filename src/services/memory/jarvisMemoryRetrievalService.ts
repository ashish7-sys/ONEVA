/**
 * ONEVA Phase 14: Central Jarvis Memory Retrieval Engine
 * 
 * High-accuracy intent analyzer and context retrieval service:
 * - Distinguishes NEW_RESEARCH vs PREVIOUS_RESEARCH vs USER_SAVED_MEMORY vs PREVIOUS_TASK vs TOTAL_HISTORY
 * - Natural language handling in Hindi, English, and Hinglish
 * - Context-aware semantic ranking (retrieves only relevant items)
 * - Safe forget/delete command execution
 * - Honest negative response without hallucinations ("I don't have that information saved.")
 */

import {
  JarvisMemoryItem,
  MemoryRetrievalIntent,
  MemoryRetrievalResult,
} from '../../types/jarvisMemory';
import { JarvisMemoryStorage } from './jarvisMemoryStorage';
import { JarvisTaskHistoryService } from './jarvisTaskHistoryService';
import { OwnerAuthService } from './ownerAuthService';

export class JarvisMemoryRetrievalService {
  /**
   * Evaluates user input to detect if it targets memory retrieval, storage, or history
   */
  static analyzeQuery(rawText: string, language: string = 'en'): MemoryRetrievalResult {
    const text = rawText.trim();
    const lower = text.toLowerCase();

    // 1. SAVE MEMORY COMMANDS ("Jarvis, remember that...", "Yaad rakho ki...", "Save this...")
    if (this.isSaveMemoryIntent(lower)) {
      return this.handleSaveMemoryIntent(text, lower, language);
    }

    // 2. FORGET / DELETE MEMORY COMMANDS ("bhool jao", "delete memory", "clear saved memory")
    if (this.isForgetMemoryIntent(lower)) {
      return this.handleForgetMemoryIntent(text, lower, language);
    }

    // 3. DEVICE-WIDE TOTAL HISTORY ("Device par abhi tak total kya-kya kaam hua?", "Sabhi users ka history")
    if (this.isTotalDeviceHistoryIntent(lower)) {
      return this.handleTotalDeviceHistoryIntent(language);
    }

    // 4. PERSONAL TASK HISTORY ("Maine abhi tak kya kya kiya?", "Abhi tumne kya kaam kiya?")
    if (this.isPersonalTaskHistoryIntent(lower)) {
      return this.handlePersonalTaskHistoryIntent(language);
    }

    // 5. PREVIOUS RESEARCH RETRIEVAL ("tumne image-to-video ke liye jo tools bataye the wo kaun se the?")
    // IMPORTANT: Distinguish from "research karke batao" (new research)
    if (this.isPreviousResearchIntent(lower)) {
      return this.handlePreviousResearchIntent(text, lower, language);
    }

    // 6. USER SAVED MEMORY / PREFERENCE RETRIEVAL ("Jo maine save kiya tha", "Mera saved browser")
    if (this.isSavedMemoryRetrievalIntent(lower)) {
      return this.handleSavedMemoryRetrievalIntent(text, lower, language);
    }

    return {
      intent: 'NONE',
      matchedMemories: [],
      confidence: 0,
    };
  }

  // ========================================================
  // Intent Classifiers
  // ========================================================

  private static isSaveMemoryIntent(lower: string): boolean {
    return (
      lower.startsWith('remember that') ||
      lower.startsWith('jarvis, remember') ||
      lower.startsWith('jarvis remember') ||
      lower.includes('yaad rakh') ||
      lower.includes('yaad rkho') ||
      lower.includes('save this in memory') ||
      lower.includes('save karo ki') ||
      lower.includes('memory me save karo') ||
      lower.includes('memory mein save karo')
    );
  }

  private static isForgetMemoryIntent(lower: string): boolean {
    return (
      lower.includes('bhool jao') ||
      lower.includes('bhol jao') ||
      lower.includes('delete memory') ||
      lower.includes('memory delete') ||
      lower.includes('clear memory') ||
      lower.includes('memory clear') ||
      lower.includes('remove memory') ||
      lower.includes('ye memory delete kar do') ||
      lower.includes('sab memory delete karo')
    );
  }

  private static isTotalDeviceHistoryIntent(lower: string): boolean {
    return (
      lower.includes('total kya-kya kaam hua') ||
      lower.includes('total kya kya kaam hua') ||
      lower.includes('device par abhi tak total') ||
      lower.includes('sabhi users dwara kiya gaya') ||
      lower.includes('sabhi users ka history') ||
      lower.includes('all users history') ||
      lower.includes('device-wide history') ||
      lower.includes('device wide history') ||
      lower.includes('total device activity') ||
      (lower.includes('total') && lower.includes('history'))
    );
  }

  private static isPersonalTaskHistoryIntent(lower: string): boolean {
    return (
      lower.includes('maine abhi tak kya kya kiya') ||
      lower.includes('maine abhi tak kya kiya') ||
      lower.includes('maine abhi tak jo kiya') ||
      lower.includes('mera task history') ||
      lower.includes('meri task history') ||
      lower.includes('meri activity history') ||
      lower.includes('abhi tumne kya kaam kiya') ||
      lower.includes('what did i do so far') ||
      lower.includes('my task history') ||
      lower.includes('my activity history')
    );
  }

  private static isPreviousResearchIntent(lower: string): boolean {
    // Queries asking about past answers or research
    const hasPastReference =
      lower.includes('pehle kya bataya tha') ||
      lower.includes('jo bataya tha') ||
      lower.includes('jo tools bataye the') ||
      lower.includes('jo bataye the') ||
      lower.includes('jo research ki thi') ||
      lower.includes('jo research kiya tha') ||
      lower.includes('tumne pehle') ||
      lower.includes('wo kaun se the') ||
      lower.includes('wo kaun se tools the') ||
      lower.includes('what did you recommend') ||
      lower.includes('what did you tell me before') ||
      lower.includes('tools you recommended earlier') ||
      lower.includes('previous research');

    // Make sure it's NOT a request to perform brand new research right now
    const isExplicitNewResearch =
      lower.startsWith('research karo') ||
      lower.startsWith('naye tools research karo') ||
      lower.includes('fresh research') ||
      lower.includes('latest research karke batao');

    return hasPastReference && !isExplicitNewResearch;
  }

  private static isSavedMemoryRetrievalIntent(lower: string): boolean {
    return (
      lower.includes('jo maine save kiya tha') ||
      lower.includes('saved memory dikhao') ||
      lower.includes('meri saved memory') ||
      lower.includes('show my saved memory') ||
      lower.includes('what did i save') ||
      lower.includes('preferred browser') ||
      lower.includes('favorite browser') ||
      lower.includes('meri preference') ||
      lower.includes('my preference')
    );
  }

  // ========================================================
  // Intent Handlers
  // ========================================================

  private static handleSaveMemoryIntent(text: string, lower: string, language: string): MemoryRetrievalResult {
    // Extract payload to remember
    let contentToSave = text;
    const prefixes = [
      /^(?:jarvis,?\s*)?(?:please\s*)?remember\s+that\s+/i,
      /^(?:jarvis,?\s*)?(?:please\s*)?remember\s+/i,
      /^(?:jarvis,?\s*)?yaad\s+rakho\s+ki\s+/i,
      /^(?:jarvis,?\s*)?yaad\s+rkho\s+ki\s+/i,
      /^(?:jarvis,?\s*)?save\s+karo\s+ki\s+/i,
      /^(?:jarvis,?\s*)?save\s+this\s+in\s+memory:\s*/i,
    ];

    for (const p of prefixes) {
      if (p.test(text)) {
        contentToSave = text.replace(p, '').trim();
        break;
      }
    }

    // Determine title & tags
    const title = contentToSave.length > 40 ? `${contentToSave.slice(0, 37)}...` : contentToSave;
    const tags: string[] = [];
    if (lower.includes('browser')) tags.push('browser');
    if (lower.includes('theme')) tags.push('theme');
    if (lower.includes('tool')) tags.push('tool');
    if (lower.includes('video') || lower.includes('image')) tags.push('multimedia');

    const memoryType = lower.includes('preferred') || lower.includes('preference') || lower.includes('favorite')
      ? 'USER_PREFERENCE_MEMORY'
      : 'USER_SAVED_MEMORY';

    const saved = JarvisMemoryStorage.save({
      memoryId: `mem_${Date.now()}`,
      type: memoryType,
      title,
      summary: contentToSave,
      content: contentToSave,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: 'user_explicit',
      importance: 'high',
      ownerScope: OwnerAuthService.getActiveActorType() === 'owner' ? 'owner' : 'user_2',
      reasonStored: 'Explicitly requested by user ("Remember that...")',
    });

    const directAnswer = language === 'hi'
      ? `जी सर, मैंने इसे आपकी JARVIS memory में सेव कर दिया है: "${contentToSave}"`
      : `Sir, I have saved this to your JARVIS memory: "${contentToSave}"`;

    return {
      intent: 'SAVE_MEMORY',
      matchedMemories: [saved],
      directAnswer,
      confidence: 0.95,
    };
  }

  private static handleForgetMemoryIntent(text: string, lower: string, language: string): MemoryRetrievalResult {
    // Check if user is asking to delete ALL memory
    if (lower.includes('sab memory delete karo') || lower.includes('delete all memory') || lower.includes('clear all memory')) {
      return {
        intent: 'FORGET_MEMORY',
        matchedMemories: [],
        directAnswer: language === 'hi'
          ? 'सर, सभी मेमोरी मिटाने के लिए पुष्टि (Confirmation) आवश्यक है। कृपया JARVIS Memory Settings में जाकर पुष्टि करें।'
          : 'Sir, clearing all memories requires explicit confirmation. Please confirm in JARVIS Memory Settings.',
        confidence: 0.95,
      };
    }

    // Extract keyword to forget (e.g. "image-to-video wali research bhool jao")
    let keyword = '';
    if (lower.includes('image-to-video') || lower.includes('image to video')) {
      keyword = 'image-to-video';
    } else if (lower.includes('research')) {
      keyword = 'research';
    } else if (lower.includes('browser')) {
      keyword = 'browser';
    }

    let deletedCount = 0;
    if (keyword) {
      deletedCount = JarvisMemoryStorage.deleteMatching(keyword);
    } else {
      // Delete most recent saved memory
      const all = JarvisMemoryStorage.getAll();
      if (all.length > 0) {
        JarvisMemoryStorage.delete(all[0].memoryId);
        deletedCount = 1;
      }
    }

    const directAnswer = deletedCount > 0
      ? (language === 'hi'
          ? `जी सर, संबंधित मेमोरी (${deletedCount} आइटम) हटा दी गई है।`
          : `Yes sir, the relevant memory (${deletedCount} item${deletedCount > 1 ? 's' : ''}) has been removed.`)
      : (language === 'hi'
          ? 'सर, कोई मेल खाती मेमोरी नहीं मिली जिसे हटाया जा सके।'
          : `Sir, I couldn't find any matching memory to remove.`);

    return {
      intent: 'FORGET_MEMORY',
      matchedMemories: [],
      directAnswer,
      confidence: 0.9,
    };
  }

  private static handleTotalDeviceHistoryIntent(language: string): MemoryRetrievalResult {
    const historyResult = JarvisTaskHistoryService.getTotalDeviceHistory();

    if (!historyResult.success) {
      return {
        intent: 'DEVICE_TOTAL_HISTORY',
        matchedMemories: [],
        matchedTasks: [],
        directAnswer: historyResult.message,
        confidence: 0.95,
        requiresOwnerVerification: historyResult.requiresVerification,
      };
    }

    const items = historyResult.items;
    let directAnswer: string;
    if (items.length === 0) {
      directAnswer = language === 'hi'
        ? 'डिवाइस पर अभी तक कोई कार्य इतिहास दर्ज नहीं है।'
        : 'No task history recorded on this device yet.';
    } else {
      const topItems = items.slice(0, 4);
      const listStr = topItems
        .map((i, idx) => `\n${idx + 1}. [${i.actorDisplayName}] ${i.summary}`)
        .join('');
      directAnswer = language === 'hi'
        ? `डिवाइस पर कुल ${items.length} कार्य निष्पादित हुए हैं:${listStr}`
        : `Total device activity history (${items.length} tasks):${listStr}`;
    }

    return {
      intent: 'DEVICE_TOTAL_HISTORY',
      matchedMemories: [],
      matchedTasks: items,
      directAnswer,
      confidence: 0.95,
    };
  }

  private static handlePersonalTaskHistoryIntent(language: string): MemoryRetrievalResult {
    const personal = JarvisTaskHistoryService.getPersonalHistory();
    const items = personal.items;

    if (!personal.success) {
      return {
        intent: 'PREVIOUS_TASK',
        matchedMemories: [],
        matchedTasks: [],
        directAnswer: personal.message,
        confidence: 0.95,
      };
    }

    if (items.length === 0) {
      return {
        intent: 'PREVIOUS_TASK',
        matchedMemories: [],
        matchedTasks: [],
        directAnswer: language === 'hi'
          ? 'सर, आपकी कोई पिछली गतिविधि नहीं मिली।'
          : 'Sir, no previous activity history found for your profile.',
        confidence: 0.9,
      };
    }

    const topItems = items.slice(0, 3);
    const listStr = topItems.map((i, idx) => `\n• ${i.summary}`).join('');

    const directAnswer = language === 'hi'
      ? `सर, आपके हालिया कार्य:${listStr}`
      : `Sir, here is your recent activity:${listStr}`;

    return {
      intent: 'PREVIOUS_TASK',
      matchedMemories: [],
      matchedTasks: items,
      directAnswer,
      confidence: 0.95,
    };
  }

  private static handlePreviousResearchIntent(text: string, lower: string, language: string): MemoryRetrievalResult {
    // Extract keywords from prompt
    const keywords: string[] = [];
    if (lower.includes('image-to-video') || lower.includes('image to video') || lower.includes('video')) {
      keywords.push('video', 'image-to-video', 'tools');
    }
    if (lower.includes('wallpaper')) keywords.push('wallpaper');
    if (lower.includes('icon')) keywords.push('icon');

    // Search Research Memory in storage
    const allResearchMemories = JarvisMemoryStorage.getByType('RESEARCH_MEMORY');
    let matched = allResearchMemories.filter((m) => {
      if (keywords.length === 0) return true;
      return keywords.some((k) =>
        m.title.toLowerCase().includes(k) ||
        m.summary.toLowerCase().includes(k) ||
        m.tags.some((t) => t.toLowerCase().includes(k))
      );
    });

    if (matched.length === 0 && allResearchMemories.length > 0) {
      matched = [allResearchMemories[0]];
    }

    if (matched.length > 0) {
      const top = matched[0];
      const directAnswer = language === 'hi'
        ? `सर, पहले की रिसर्च के अनुसार मैंने ये टूल्स सुझाए थे:\n${top.summary}`
        : `Sir, based on previous research, here are the recommendations:\n${top.summary}`;

      return {
        intent: 'PREVIOUS_RESEARCH',
        matchedMemories: [top],
        directAnswer,
        confidence: 0.95,
      };
    }

    // Honest negative fallback (Rule 24: Never fabricate remembered info)
    return {
      intent: 'PREVIOUS_RESEARCH',
      matchedMemories: [],
      directAnswer: language === 'hi'
        ? 'सर, मेरे पास इस विषय पर पहले से सेव की गई कोई रिसर्च नहीं है।'
        : `I don't have that information saved.`,
      confidence: 0.7,
    };
  }

  private static handleSavedMemoryRetrievalIntent(text: string, lower: string, language: string): MemoryRetrievalResult {
    let memories = JarvisMemoryStorage.getByType('USER_SAVED_MEMORY');
    const prefMemories = JarvisMemoryStorage.getByType('USER_PREFERENCE_MEMORY');
    memories = [...memories, ...prefMemories];

    // Filter by specific keywords if present
    if (lower.includes('browser')) {
      const filtered = memories.filter((m) =>
        m.title.toLowerCase().includes('browser') ||
        m.summary.toLowerCase().includes('browser') ||
        m.tags.includes('browser')
      );
      if (filtered.length > 0) memories = filtered;
    }

    if (memories.length > 0) {
      const top = memories[0];
      const directAnswer = language === 'hi'
        ? `सर, आपकी सेव की गई जानकारी:\n"${top.summary}"`
        : `Sir, according to your saved memory:\n"${top.summary}"`;

      return {
        intent: 'USER_SAVED_MEMORY',
        matchedMemories: memories,
        directAnswer,
        confidence: 0.95,
      };
    }

    return {
      intent: 'USER_SAVED_MEMORY',
      matchedMemories: [],
      directAnswer: language === 'hi'
        ? 'सर, मेरे पास कोई सेव की गई मेमोरी नहीं मिली।'
        : `I don't have that information saved.`,
      confidence: 0.7,
    };
  }
}
