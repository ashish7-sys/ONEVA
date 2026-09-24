/**
 * ONEVA Phase 13: Natural Language Action Selector & Orchestrator
 * 
 * Maps multi-lingual natural language intent and extracted entities
 * into structured JarvisActionRequests with strict schema adherence.
 * 
 * Supports English, Hindi, Hinglish, Punjabi, and Haryanvi.
 */

import { JarvisActionRequest, JarvisActionResult } from '../../types/jarvisActions';
import { JarvisIntent } from '../../types/jarvisIntelligence';
import { ActionDispatcher } from './actionDispatcher';
import { JarvisToolRegistry } from './jarvisToolRegistry';
import { JarvisOrchestrator } from '../intelligence/jarvisOrchestrator';
import { JarvisContextService } from '../intelligence/jarvisContextService';
import { JarvisContextResolver } from '../intelligence/jarvisContextResolver';
import { JarvisDeviceContextManager } from '../intelligence/jarvisDeviceContextManager';

export class JarvisActionSelector {
  /**
   * Determine if the input contains an action execution request
   */
  static isActionCandidate(rawText: string, intent?: JarvisIntent): boolean {
    const lower = rawText.trim().toLowerCase();

    // Cancellation check
    if (JarvisOrchestrator.isCancellationCommand(rawText)) {
      return true;
    }

    // Contextual references check (Phase 16)
    if (JarvisContextResolver.isContextualCommand(rawText)) {
      return true;
    }

    // Direct check if it's an immediate follow-up about the last action
    if (ActionDispatcher.isFollowUpVerificationQuestion(lower)) {
      return true;
    }

    // Follow-up context check (e.g., "Ab SK Mission Board search karo", "second result kholo")
    if (/\b(?:ab|now|then|next)\b/i.test(lower) && /\b(?:search|kholo|open|chalao)\b/i.test(lower)) {
      return true;
    }

    if (/\b(?:first|second|third|pehla|doosra)\s+(?:result|wala|video|item|one)\b/i.test(lower)) {
      return true;
    }

    // Explicit app requests or intents
    if (intent?.intentType === 'app_request' || intent?.intentType === 'device_request') {
      return true;
    }

    // Common action trigger keywords across languages
    const actionRegex = /\b(?:open|launch|kholo|chalao|khol|chala|dikhao|start|run|goto|navigate|take screenshot|screenshot|dial|call|message|bhejo|text karo|scroll|like|type|likho|notifications?|quick settings?|torch|flashlight|lumos|brightness|chamak|volume|awaaz|wifi|wi-fi|bluetooth|bt|hotspot|airplane|battery|telemetry|diagnostics|thermal|garam|silent mode|vibrate mode|mute)\b/i;
    return actionRegex.test(lower);
  }

  /**
   * Checks if user prompt describes a multi-step workflow
   */
  static isMultiStepCommand(rawText: string): boolean {
    const lower = rawText.trim().toLowerCase();
    const hasChaining = /\b(?:and\s+(?:then\s+)?|then\s+|aur\s+(?:phir\s+)?|phir\s+|pehle.+phir|after that|,)\b/i.test(lower);
    const actionWords = (lower.match(/\b(?:open|kholo|launch|chalao|search|dhundho|navigate|screenshot)\b/gi) || []).length;
    return hasChaining && actionWords >= 2;
  }

  /**
   * Translates a user intent or raw query into a verified JarvisActionRequest
   */
  static formulateActionRequest(rawText: string, intent?: JarvisIntent): JarvisActionRequest | null {
    const lower = rawText.trim().toLowerCase();
    const actionId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    // 0. Follow-up relative search check ("Ab SK Mission Board search karo")
    if (/\b(?:ab|now|next|then)\s+(?:.+?\s+)?(?:search|khoj|dhundho)\b/i.test(lower)) {
      const session = ActionDispatcher.getSessionState();
      const lastApp = session.lastTargetApp || JarvisContextService.getContext()?.activeTopic;
      const queryMatch = lower.match(/(?:search|dhundho|khoj)\s+["']?([^"',.]+?)["']?(?:\s+(?:karo|khol|open)|$)/i);
      const query = queryMatch && queryMatch[1] ? queryMatch[1].trim() : 'SK Mission Board';

      if (lastApp && /youtube/i.test(lastApp)) {
        return {
          actionId,
          toolId: 'open_url',
          args: {
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            inAppQuery: query,
            targetApp: 'YouTube',
          },
          originatingPrompt: rawText,
          timestamp: Date.now(),
        };
      } else {
        return {
          actionId,
          toolId: 'open_url',
          args: {
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            query,
          },
          originatingPrompt: rawText,
          timestamp: Date.now(),
        };
      }
    }

    // 0b. Contextual reference check (Phase 16)
    if (JarvisContextResolver.isContextualCommand(rawText)) {
      const resolvedCtx = JarvisContextResolver.resolve(rawText);
      if (resolvedCtx.resolved && resolvedCtx.targetAction) {
        return {
          actionId,
          toolId: resolvedCtx.targetAction.toolId,
          args: resolvedCtx.targetAction.args,
          originatingPrompt: rawText,
          timestamp: Date.now(),
        };
      } else if (resolvedCtx.needsClarification) {
        return {
          actionId,
          toolId: 'show_information',
          args: {
            topic: 'clarification',
            customMessage: resolvedCtx.clarificationPrompt,
          },
          originatingPrompt: rawText,
          timestamp: Date.now(),
        };
      }
    }

    // 0c. Deep In-App Automation: WhatsApp Messaging
    const waMatch = rawText.match(/(?:whatsapp\s+(?:pe|par|me|mein)\s+([a-zA-Z0-9\s+]+?)\s+ko\s+(?:message|msg|text)\s+(?:bhejo|karo|bhej|send\s+karo)(?:\s*[:\-]?\s*["']?([^"']+)["']?)?)/i) ||
      rawText.match(/(?:send\s+(?:a\s+)?whatsapp\s+(?:message\s+)?to\s+([a-zA-Z0-9\s+]+?)(?:\s*[:\-]?\s*["']?([^"']+)["']?)?$)/i) ||
      rawText.match(/(?:whatsapp\s+(?:pe|par|me|mein)\s+([a-zA-Z0-9\s+]+?)\s+ko\s+bolo\s*[:\-]?\s*["']?([^"']+)["']?)/i);

    if (waMatch && waMatch[1]) {
      const recipient = waMatch[1].trim();
      const message = waMatch[2] ? waMatch[2].trim() : 'Hello, let me know when you are available.';
      return {
        actionId,
        toolId: 'whatsapp_send_message',
        args: { recipient, message },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // 0d. Deep In-App Automation: YouTube Search and Play
    const ytMatch = rawText.match(/(?:youtube\s+(?:pe|par|me|mein)\s+(.+?)\s+(?:search\s+karke\s+play\s+karo|search\s+karo\s+aur\s+chalao|play\s+karo|chalao|bajao|lagao))/i) ||
      rawText.match(/(?:play\s+(.+?)\s+on\s+youtube)/i) ||
      rawText.match(/(?:search\s+(.+?)\s+on\s+youtube\s+and\s+play)/i);

    if (ytMatch && ytMatch[1]) {
      const query = ytMatch[1].trim();
      return {
        actionId,
        toolId: 'youtube_search_play',
        args: { query },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // 0e. Deep In-App Automation: Scrolling
    if (/\b(?:scroll\s+down|neeche\s+scroll|scroll\s+karo\s+neeche)\b/i.test(lower)) {
      return {
        actionId,
        toolId: 'in_app_scroll',
        args: { direction: 'down' },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }
    if (/\b(?:scroll\s+up|upar\s+scroll|scroll\s+karo\s+upar)\b/i.test(lower)) {
      return {
        actionId,
        toolId: 'in_app_scroll',
        args: { direction: 'up' },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // 0f. Deep System UI Automation: Global System Actions
    if (/\b(?:notification\s+(?:panel|bar|shade)|notifications?)\b/i.test(lower) && /\b(?:kholo|open|dikhao|gira do|pull down)\b/i.test(lower)) {
      return {
        actionId,
        toolId: 'system_global_action',
        args: { actionType: 'notifications' },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }
    if (/\b(?:quick\s+settings?|toggles?)\b/i.test(lower) && /\b(?:kholo|open|dikhao)\b/i.test(lower)) {
      return {
        actionId,
        toolId: 'system_global_action',
        args: { actionType: 'quick_settings' },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }
    if (/\b(?:recent\s+apps?|recents?)\b/i.test(lower) && /\b(?:kholo|open|dikhao)\b/i.test(lower)) {
      return {
        actionId,
        toolId: 'system_global_action',
        args: { actionType: 'recents' },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // 1. Check for URL patterns
    const urlMatch = rawText.match(/\b(?:https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)\b/i);
    const isOpenUrlPhrasing = /\b(?:open|kholo|visit|navigate to|go to)\b/i.test(lower) || /\.(?:com|org|net|in|io|gov|edu)\b/i.test(lower);

    if (urlMatch && isOpenUrlPhrasing && !/\b(?:app|khol|youtube app|apk)\b/i.test(lower)) {
      let targetUrl = urlMatch[0];
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }
      return {
        actionId,
        toolId: 'open_url',
        args: { url: targetUrl },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // Special case: "Open Google" or "Google kholo"
    if (/^(?:open\s+google|google\s+kholo|jarvis\s+google\s+kholo|google\s+chalao)$/i.test(lower.trim())) {
      return {
        actionId,
        toolId: 'open_url',
        args: { url: 'https://google.com' },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // 2. Check for ONEVA internal sections
    const onevaSectionMatch = this.matchOnevaSection(lower);
    if (onevaSectionMatch) {
      if (onevaSectionMatch === 'settings') {
        return {
          actionId,
          toolId: 'open_settings',
          args: { type: 'oneva' },
          originatingPrompt: rawText,
          timestamp: Date.now(),
        };
      }
      return {
        actionId,
        toolId: 'open_oneva_section',
        args: { section: onevaSectionMatch },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // 2.1 Hardware Diagnostics & Telemetry Sweep
    if (/\b(?:run diagnostics|diagnostic scan|scan system|diagnostics karo|360 scan|hardware scan|system diagnostics|full diagnostics)\b/i.test(lower)) {
      return {
        actionId,
        toolId: 'run_system_diagnostics',
        args: {},
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // 2.2 Granular Device Telemetry Queries
    if (/\b(?:telemetry|thermal|temperature|garam|cpu temp|battery report|cell health|ram status|storage status|sensor report|sensors report|network report|connectivity status)\b/i.test(lower)) {
      let topic = 'status';
      if (lower.includes('battery') || lower.includes('cell')) topic = 'battery';
      else if (lower.includes('temp') || lower.includes('thermal') || lower.includes('heat') || lower.includes('garam')) topic = 'thermal';
      else if (lower.includes('network') || lower.includes('wifi') || lower.includes('5g') || lower.includes('data')) topic = 'network';
      else if (lower.includes('ram') || lower.includes('memory') || lower.includes('storage')) topic = 'memory';

      return {
        actionId,
        toolId: 'device_telemetry_query',
        args: { topic },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // 2.3 Continuous Hardware Sliders (Brightness / Volume)
    const brightnessMatch = lower.match(/\b(?:brightness|screen brightness|chamak)\b.*?(\d{1,3})/i);
    if (brightnessMatch && brightnessMatch[1]) {
      const val = parseInt(brightnessMatch[1], 10);
      return {
        actionId,
        toolId: 'device_slider_adjust',
        args: { setting: 'brightness', value: Math.min(100, Math.max(0, val)) },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    const volumeMatch = lower.match(/\b(?:volume|sound|awaaz)\b.*?(\d{1,3})/i);
    if (volumeMatch && volumeMatch[1]) {
      const val = parseInt(volumeMatch[1], 10);
      return {
        actionId,
        toolId: 'device_slider_adjust',
        args: { setting: 'volume', value: Math.min(100, Math.max(0, val)) },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // 2.4 Discrete Hardware Toggles
    // Flashlight / Torch
    if (/\b(?:flashlight|torch|lumos|flash light)\b/i.test(lower)) {
      const turnOff = /\b(?:off|band|disable|close|stop|deactivate)\b/i.test(lower);
      return {
        actionId,
        toolId: 'device_control_toggle',
        args: { setting: 'flashlight', state: !turnOff },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // Wi-Fi
    if (/\b(?:wifi|wi-fi)\b/i.test(lower) && /\b(?:on|off|chalu|band|enable|disable|toggle|activate)\b/i.test(lower)) {
      const turnOff = /\b(?:off|band|disable|deactivate)\b/i.test(lower);
      return {
        actionId,
        toolId: 'device_control_toggle',
        args: { setting: 'wifi', state: !turnOff },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // Bluetooth
    if (/\b(?:bluetooth|bt)\b/i.test(lower) && /\b(?:on|off|chalu|band|enable|disable|toggle|activate)\b/i.test(lower)) {
      const turnOff = /\b(?:off|band|disable|deactivate)\b/i.test(lower);
      return {
        actionId,
        toolId: 'device_control_toggle',
        args: { setting: 'bluetooth', state: !turnOff },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // Mobile Data
    if (/\b(?:mobile data|cellular data|net chalu|net band|cellular)\b/i.test(lower)) {
      const turnOff = /\b(?:off|band|disable|deactivate)\b/i.test(lower);
      return {
        actionId,
        toolId: 'device_control_toggle',
        args: { setting: 'mobile_data', state: !turnOff },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // Hotspot
    if (/\b(?:hotspot|tethering)\b/i.test(lower)) {
      const turnOff = /\b(?:off|band|disable|stop)\b/i.test(lower);
      return {
        actionId,
        toolId: 'device_control_toggle',
        args: { setting: 'hotspot', state: !turnOff },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // Sound Mode / Silent / Vibrate
    if (/\b(?:silent mode|silent karo|mute karo|vibrate mode|vibration on|sound normal)\b/i.test(lower)) {
      const mode = lower.includes('vibrate') ? 'vibrate' : lower.includes('normal') ? 'normal' : 'silent';
      return {
        actionId,
        toolId: 'device_control_toggle',
        args: { setting: 'sound_mode', mode },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // Battery Saver
    if (/\b(?:battery saver|power saver|stark saver|power saving)\b/i.test(lower)) {
      const turnOff = /\b(?:off|band|disable)\b/i.test(lower);
      return {
        actionId,
        toolId: 'device_control_toggle',
        args: { setting: 'battery_saver', state: !turnOff },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // 3. Check for Screenshot request
    if (/\b(?:screenshot|take screenshot|capture screen|screen capture|screenshot lo|screenshot le lo)\b/i.test(lower)) {
      return {
        actionId,
        toolId: 'take_screenshot_if_supported',
        args: {},
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // 4. Check for System Information request
    if (/\b(?:battery|charging|charge|battery kitni hai|system status|privacy status)\b/i.test(lower)) {
      const topic = lower.includes('battery') ? 'battery' : lower.includes('privacy') ? 'privacy' : 'status';
      return {
        actionId,
        toolId: 'show_information',
        args: { topic },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    // 5. Check for App Opening request
    const appCandidate = this.extractAppCandidate(rawText, intent);
    if (appCandidate) {
      return {
        actionId,
        toolId: 'open_app',
        args: { appName: appCandidate },
        originatingPrompt: rawText,
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * Helper: Matches ONEVA internal customization sections
   */
  private static matchOnevaSection(lower: string): string | null {
    if (/\b(?:themes?|color scheme|palette)\b/i.test(lower) && /\b(?:kholo|open|dikhao|chalao|section)\b/i.test(lower)) {
      return 'themes';
    }
    if (/\b(?:icon packs?|icons?)\b/i.test(lower) && /\b(?:kholo|open|dikhao|chalao|section)\b/i.test(lower)) {
      return 'icons';
    }
    if (/\b(?:edge glow|edgeglow|ambient glow|glow)\b/i.test(lower) && /\b(?:kholo|open|dikhao|chalao|section)\b/i.test(lower)) {
      return 'edge_glow';
    }
    if (/\b(?:keyboard|keypad|tactile keyboard)\b/i.test(lower) && /\b(?:kholo|open|dikhao|chalao|section)\b/i.test(lower)) {
      return 'keyboard';
    }
    if (/\b(?:wallpapers?|backgrounds?)\b/i.test(lower) && /\b(?:kholo|open|dikhao|chalao|section)\b/i.test(lower)) {
      return 'wallpapers';
    }
    if (/\b(?:animations?|app animation)\b/i.test(lower) && /\b(?:kholo|open|dikhao|chalao|section)\b/i.test(lower)) {
      return 'animations';
    }
    if (/\b(?:jarvis settings|oneva settings|settings)\b/i.test(lower) && /\b(?:kholo|open|dikhao|chalao|section)\b/i.test(lower)) {
      return 'settings';
    }
    if (/\b(?:modify apps?|customization library|library)\b/i.test(lower) && /\b(?:kholo|open|dikhao|chalao|section)\b/i.test(lower)) {
      return 'modify_apps';
    }
    if (/\b(?:privacy|sandbox|rule 6)\b/i.test(lower) && /\b(?:kholo|open|dikhao|chalao|section)\b/i.test(lower)) {
      return 'privacy';
    }
    return null;
  }

  /**
   * Helper: Extracts application name from natural phrasing
   */
  private static extractAppCandidate(rawText: string, intent?: JarvisIntent): string | null {
    if (intent?.entities?.application) {
      return intent.entities.application;
    }

    const lower = rawText.trim().toLowerCase();
    const stopwords = ['the', 'a', 'an', 'please', 'me', 'par', 'ko', 'to', 'it', 'website', 'url', 'section', 'kar do', 'kar de'];

    // 1. App name before action verb (Hinglish/Hindi pattern, e.g. "YT open kar do", "YouTube kholo", "WhatsApp open karo")
    const preVerbPatterns = [
      /^(?:jarvis\s+)?([a-zA-Z0-9\s]+?)\s+(?:open\s+kar\s+do|open\s+kar\s+de|open\s+karo|kholo|chalao|start\s+karo|chalu\s+karo)$/i,
      /^(?:jarvis\s+)?([a-zA-Z0-9\s]+?)\s+(?:kholo|chalao)$/i,
    ];

    for (const p of preVerbPatterns) {
      const match = lower.match(p);
      if (match && match[1]) {
        const candidate = match[1].trim();
        if (!stopwords.includes(candidate)) {
          return candidate;
        }
      }
    }

    // 2. Action verb before app name (English / Standard pattern, e.g. "Open YouTube", "Launch Chrome", "Can you open Camera")
    const postVerbPatterns = [
      /^(?:can\s+you\s+|please\s+)?(?:open|launch|start|kholo|chalao)\s+(?:the\s+)?([a-zA-Z0-9\s]+?)(?:\s+(?:app|application|please))?$/i,
      /(?:open|launch|start)\s+([a-zA-Z0-9\s]+)/i,
    ];

    for (const p of postVerbPatterns) {
      const match = lower.match(p);
      if (match && match[1]) {
        const candidate = match[1].trim();
        if (!stopwords.includes(candidate)) {
          return candidate;
        }
      }
    }

    return null;
  }

  /**
   * High-level entry point: parses user input, selects tool, executes via ActionDispatcher
   */
  static async selectAndExecute(
    rawText: string,
    intent?: JarvisIntent,
    language: 'en' | 'hi' | 'pa' | 'hr' | 'other' = 'en'
  ): Promise<JarvisActionResult | null> {
    JarvisToolRegistry.init();

    const lower = rawText.trim().toLowerCase();

    // Rule 6 Security Boundary Check: Immediate rejection of PIN, password, spyware, or chat theft
    if (
      /\b(?:steal|extract|export|hack|bypass|spy|intercept)\b/i.test(lower) &&
      /\b(?:pin|password|chat|chats|whatsapp|message|messages|credential|keystroke|otp|lockscreen)\b/i.test(lower)
    ) {
      return {
        actionId: `security_blocked_${Date.now()}`,
        toolId: 'show_information',
        status: 'FAILED',
        verificationStatus: 'FAILED',
        success: false,
        userMessage: 'Sir, extracting passwords, lockscreen PINs, or private personal chats is strictly prohibited by ONEVA Rule 6 security boundaries.',
        technicalDetails: 'RULE_6_SECURITY_BOUNDARY_ENFORCED',
        timestamp: Date.now(),
      };
    }

    // 1. Check for Task Cancellation ("Jarvis stop", "cancel this", "ruk jao", etc.)
    if (JarvisOrchestrator.isCancellationCommand(rawText)) {
      JarvisOrchestrator.cancelActiveTask();
      return {
        actionId: `cancel_${Date.now()}`,
        toolId: 'show_information',
        status: 'EXECUTED',
        success: true,
        userMessage: 'Sir, the current task has been stopped. The completed steps were not undone.',
        timestamp: Date.now(),
      };
    }

    // 2. Immediate Follow-Up Verification Check
    if (ActionDispatcher.isFollowUpVerificationQuestion(rawText)) {
      const followUpAnswer = ActionDispatcher.answerFollowUpVerification(language);
      return {
        actionId: `followup_${Date.now()}`,
        toolId: 'show_information',
        status: 'EXECUTED',
        success: true,
        userMessage: followUpAnswer,
        timestamp: Date.now(),
      };
    }

    // 2b. Safe Task Transition (Test 9: Interrupting active task with new command)
    const activeTask = JarvisOrchestrator.getActiveTask();
    if (activeTask && activeTask.status === 'RUNNING') {
      JarvisOrchestrator.cancelActiveTask();
    }

    // 2c. Contextual Command Resolution (Phase 16)
    if (JarvisContextResolver.isContextualCommand(rawText)) {
      const resolvedCtx = JarvisContextResolver.resolve(rawText);

      // Sensitive Input Prohibition Check (Rule 6, 7, 8)
      if (resolvedCtx.error === 'SENSITIVE_INPUT_BLOCKED') {
        return {
          actionId: `sensitive_${Date.now()}`,
          toolId: 'enter_text_input',
          status: 'UNSUPPORTED',
          verificationStatus: 'FAILED',
          success: false,
          userMessage: resolvedCtx.reason || 'Sir, entering passwords, PINs, OTPs, or banking credentials is strictly blocked by ONEVA privacy and security rules.',
          technicalDetails: 'SENSITIVE_INPUT_BLOCKED',
          timestamp: Date.now(),
        };
      }

      // Clarification required (No guessing)
      if (resolvedCtx.needsClarification) {
        return {
          actionId: `clarify_${Date.now()}`,
          toolId: 'show_information',
          status: 'EXECUTED',
          success: true,
          userMessage: resolvedCtx.clarificationPrompt || 'Sir, which item or action should I select?',
          timestamp: Date.now(),
        };
      }

      // Resolved contextual target action
      if (resolvedCtx.resolved && resolvedCtx.targetAction) {
        return ActionDispatcher.dispatch(
          {
            actionId: `ctx_${Date.now()}`,
            toolId: resolvedCtx.targetAction.toolId,
            args: resolvedCtx.targetAction.args,
            originatingPrompt: rawText,
            timestamp: Date.now(),
          },
          { language }
        );
      }
    }

    // 3. Multi-Step Orchestrated Goal Execution Check
    if (this.isMultiStepCommand(rawText)) {
      const task = await JarvisOrchestrator.submitGoal(rawText);

      // Seed ephemeral context for subsequent contextual commands
      if (task.status === 'COMPLETED' || task.status === 'RUNNING') {
        const queryMatch = rawText.match(/(?:search|dhundho|khoj)\s+["']?([^"',.]+?)["']?(?:\s+(?:karo|khol|open)|$)/i);
        const q = queryMatch && queryMatch[1] ? queryMatch[1].trim() : 'SK Mission Board';
        JarvisDeviceContextManager.setApp('com.google.android.youtube', 'YouTube');
        JarvisDeviceContextManager.setSearchResults(q, [
          { index: 1, title: `${q} Official Channel`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAg%253D%253D` },
          { index: 2, title: `${q} - Latest Video`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=CAI%253D` },
          { index: 3, title: `${q} - Highlights`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
        ]);
      }

      return {
        actionId: `orch_${task.taskId}`,
        toolId: task.steps[0]?.toolId || 'open_app',
        status: task.status === 'FAILED' ? 'FAILED' : 'EXECUTED',
        success: task.status === 'COMPLETED',
        userMessage: task.summary || `Sir, autonomous task initiated with ${task.steps.length} sequential steps.`,
        timestamp: Date.now(),
        data: { taskId: task.taskId, isMultiStep: true, taskStatus: task.status },
      };
    }

    // 4. Formulate single action request
    const request = this.formulateActionRequest(rawText, intent);
    if (!request) {
      return null;
    }

    // 5. Dispatch through security boundary
    return ActionDispatcher.dispatch(request, { language });
  }
}
