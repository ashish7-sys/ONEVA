/**
 * ONEVA Phase 15: Multi-Step Task Decomposer & Dependency Graph Builder
 * 
 * Analyzes natural language goals (English, Hindi, Hinglish), decomposes them into
 * sequential and dependency-bound execution steps, assigns proper Tool IDs from
 * the Phase 13 Tool Registry, and sets up prerequisite step references.
 */

import {
  JarvisOrchestratedTask,
  JarvisOrchestratedStep,
} from '../../types/jarvisOrchestration';
import { OwnerAuthService } from '../memory/ownerAuthService';
import { AppResolutionService } from '../actions/appResolutionService';

export class JarvisMultiStepDecomposer {
  /**
   * Decomposes a natural language goal into an orchestrated task with an explicit dependency graph
   */
  static decompose(rawGoal: string): JarvisOrchestratedTask {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    const cleanGoal = rawGoal.trim();
    const lower = cleanGoal.toLowerCase();

    const activeActor = OwnerAuthService.getActiveActor();

    // Check for dangerous / restricted operations (Rule 6 boundary)
    if (this.isRestrictedGoal(lower)) {
      const step: JarvisOrchestratedStep = {
        stepId: `${taskId}_step_1`,
        taskId,
        order: 1,
        title: 'Security Boundary Check',
        description: 'Enforce ONEVA Rule 6 zero-spyware and sandbox protection boundary.',
        capability: 'security_boundary',
        toolId: 'show_information',
        parameters: { topic: 'privacy' },
        dependencies: [],
        status: 'FAILED',
        verificationStatus: 'FAILED',
        failureType: 'UNSUPPORTED',
        result: 'Operation is strictly prohibited by ONEVA security and privacy boundaries.',
      };

      return {
        taskId,
        title: 'Restricted Operation',
        originalGoal: cleanGoal,
        status: 'FAILED',
        createdAt: now,
        updatedAt: now,
        currentStepIndex: 0,
        steps: [step],
        actorProfileId: activeActor.id,
        actorType: activeActor.type,
        failureReason: 'Operation is strictly prohibited by ONEVA security and privacy boundaries.',
      };
    }

    // Build steps based on parsed clauses and goal patterns
    const steps: JarvisOrchestratedStep[] = this.buildStepsForGoal(taskId, cleanGoal, lower);

    const task: JarvisOrchestratedTask = {
      taskId,
      title: this.deriveTaskTitle(cleanGoal, steps),
      originalGoal: cleanGoal,
      status: 'READY',
      createdAt: now,
      updatedAt: now,
      currentStepIndex: 0,
      steps,
      actorProfileId: activeActor.id,
      actorType: activeActor.type,
    };

    return task;
  }

  /**
   * Checks if user goal violates ONEVA Rule 6 Security Boundary
   */
  private static isRestrictedGoal(lower: string): boolean {
    return /\b(?:pin\s+bypass|password\s+extract|hack|root\s+shell|spy|extract\s+contacts|steal\s+otp|read\s+private\s+messages|tamper\s+apk)\b/i.test(
      lower
    );
  }

  /**
   * Constructs ordered steps with explicit dependencies
   */
  private static buildStepsForGoal(
    taskId: string,
    rawGoal: string,
    lower: string
  ): JarvisOrchestratedStep[] {
    const steps: JarvisOrchestratedStep[] = [];

    // =========================================================================
    // PATTERN 1: YouTube -> Search -> Open Channel / Video / First Result
    // e.g., "Jarvis, YouTube kholo, SK Mission Board search karo aur channel open karo."
    // or "Jarvis pehle YouTube kholo phir SK Mission Board search karo."
    // =========================================================================
    if (
      /\b(?:youtube|yt)\b/i.test(lower) &&
      /\b(?:search|khoj|dhundho)\b/i.test(lower)
    ) {
      const queryMatch = lower.match(/(?:search\s+for|search\s+karo|search|dhundho)\s+["']?([^"',.]+?)["']?(?:\s+(?:aur|phir|and|then|channel|video|kholo|open)|$)/i) ||
        lower.match(/(?:(?:youtube|yt)\s+(?:par|pe|kholo|me)\s+)(.+?)(?:\s+(?:search|kholo|open))/i);
      
      let query = 'SK Mission Board';
      if (queryMatch && queryMatch[1] && queryMatch[1].trim() && !/\b(?:kholo|open)\b/i.test(queryMatch[1])) {
        query = queryMatch[1].trim();
      } else if (lower.includes('sk mission board')) {
        query = 'SK Mission Board';
      }

      const hasChannelOrVideoOpen =
        /\b(?:channel|result|video|first|second)\s+(?:open|kholo|play)\b/i.test(lower) ||
        /\b(?:open|kholo|play)\s+(?:first\s+)?(?:channel|result|video)\b/i.test(lower) ||
        /\b(?:channel\s+open\s+karo|video\s+chalao)\b/i.test(lower);

      // Step 1: Open YouTube
      const step1Id = `${taskId}_step_1`;
      steps.push({
        stepId: step1Id,
        taskId,
        order: 1,
        title: 'Open YouTube',
        description: 'Launch the YouTube application using Android package intent.',
        capability: 'open_app',
        toolId: 'open_app',
        parameters: { appName: 'YouTube' },
        dependencies: [],
        status: 'READY',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });

      // Step 2: Search on YouTube (Depends on Step 1)
      const step2Id = `${taskId}_step_2`;
      steps.push({
        stepId: step2Id,
        taskId,
        order: 2,
        title: `Search YouTube for "${query}"`,
        description: `Execute search query "${query}" inside YouTube.`,
        capability: 'search_in_app',
        toolId: 'open_url',
        parameters: {
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
          inAppQuery: query,
          targetApp: 'YouTube',
        },
        dependencies: [step1Id],
        status: 'PENDING',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });

      // Step 3: Open channel/result if requested (Depends on Step 2)
      if (hasChannelOrVideoOpen) {
        const step3Id = `${taskId}_step_3`;
        steps.push({
          stepId: step3Id,
          taskId,
          order: 3,
          title: `Open ${query} Channel`,
          description: `Navigate to the verified channel page for ${query}.`,
          capability: 'navigate_result',
          toolId: 'open_url',
          parameters: {
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' channel')}`,
            targetResult: 'channel',
          },
          dependencies: [step2Id],
          status: 'PENDING',
          verificationStatus: 'PENDING',
          isIdempotent: true,
        });
      }

      return steps;
    }

    // =========================================================================
    // PATTERN 2: Chrome -> Google / Maps -> Search Query
    // e.g. "Jarvis Chrome kholo, Google par ONEVA search karo."
    // or "Jarvis Chrome kholo, Google Maps open karo aur Delhi search karo."
    // =========================================================================
    if (
      /\b(?:chrome|browser)\b/i.test(lower) &&
      (/\b(?:google|maps|google maps)\b/i.test(lower) || /\b(?:search)\b/i.test(lower))
    ) {
      const isMaps = /\b(?:maps|google maps)\b/i.test(lower);
      const queryMatch = lower.match(/(?:search|dhundho)\s+["']?([^"',.]+?)["']?(?:\s+(?:karo|khol|open)|$)/i) ||
        lower.match(/(?:par|pe)\s+["']?([^"',.]+?)["']?\s+(?:search)/i);
      
      const query = queryMatch && queryMatch[1] ? queryMatch[1].trim() : (isMaps ? 'Delhi' : 'ONEVA');

      // Step 1: Open Chrome
      const step1Id = `${taskId}_step_1`;
      steps.push({
        stepId: step1Id,
        taskId,
        order: 1,
        title: 'Open Chrome',
        description: 'Launch Google Chrome browser via package intent.',
        capability: 'open_app',
        toolId: 'open_app',
        parameters: { appName: 'Chrome' },
        dependencies: [],
        status: 'READY',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });

      // Step 2: Open Service / Target Web Page (Depends on Step 1)
      const step2Id = `${taskId}_step_2`;
      if (isMaps) {
        steps.push({
          stepId: step2Id,
          taskId,
          order: 2,
          title: 'Open Google Maps',
          description: 'Launch Google Maps navigation interface.',
          capability: 'open_app',
          toolId: 'open_app',
          parameters: { appName: 'Google Maps' },
          dependencies: [step1Id],
          status: 'PENDING',
          verificationStatus: 'PENDING',
          isIdempotent: true,
        });

        // Step 3: Search Location
        const step3Id = `${taskId}_step_3`;
        steps.push({
          stepId: step3Id,
          taskId,
          order: 3,
          title: `Search Location "${query}"`,
          description: `Search for "${query}" on Google Maps.`,
          capability: 'search_location',
          toolId: 'open_url',
          parameters: {
            url: `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
            query,
          },
          dependencies: [step2Id],
          status: 'PENDING',
          verificationStatus: 'PENDING',
          isIdempotent: true,
        });
      } else {
        steps.push({
          stepId: step2Id,
          taskId,
          order: 2,
          title: 'Open Google',
          description: 'Navigate to Google homepage.',
          capability: 'open_url',
          toolId: 'open_url',
          parameters: { url: 'https://www.google.com' },
          dependencies: [step1Id],
          status: 'PENDING',
          verificationStatus: 'PENDING',
          isIdempotent: true,
        });

        // Step 3: Search Query
        const step3Id = `${taskId}_step_3`;
        steps.push({
          stepId: step3Id,
          taskId,
          order: 3,
          title: `Search for "${query}"`,
          description: `Execute Google search for "${query}".`,
          capability: 'search_web',
          toolId: 'open_url',
          parameters: {
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            query,
          },
          dependencies: [step2Id],
          status: 'PENDING',
          verificationStatus: 'PENDING',
          isIdempotent: true,
        });
      }

      return steps;
    }

    // =========================================================================
    // PATTERN 3: WhatsApp -> Open Contact Chat
    // e.g. "Jarvis WhatsApp kholo aur Rahul ka chat open karo."
    // =========================================================================
    if (/\b(?:whatsapp|wa)\b/i.test(lower) && /\b(?:chat|message|contact)\b/i.test(lower)) {
      const contactMatch = lower.match(/(?:aur|and|,)?\s*([a-zA-Z0-9]+)(?:\s+(?:ka|ki|ke))?\s+chat/i);
      const contact = contactMatch && contactMatch[1] ? contactMatch[1].trim() : 'Contact';

      const step1Id = `${taskId}_step_1`;
      steps.push({
        stepId: step1Id,
        taskId,
        order: 1,
        title: 'Open WhatsApp',
        description: 'Launch WhatsApp messenger.',
        capability: 'open_app',
        toolId: 'open_app',
        parameters: { appName: 'WhatsApp' },
        dependencies: [],
        status: 'READY',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });

      const step2Id = `${taskId}_step_2`;
      steps.push({
        stepId: step2Id,
        taskId,
        order: 2,
        title: `Open ${contact}'s Chat`,
        description: `Navigate to chat conversation with ${contact}.`,
        capability: 'open_chat',
        toolId: 'launch_supported_android_intent',
        parameters: {
          action: 'android.intent.action.VIEW',
          dataUri: `https://wa.me/?text=Hello%20${encodeURIComponent(contact)}`,
          contactName: contact,
        },
        dependencies: [step1Id],
        status: 'PENDING',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });

      return steps;
    }

    // =========================================================================
    // PATTERN 4: Settings -> Specific Sub-section
    // e.g. "Jarvis Settings kholo aur Display settings open karo."
    // =========================================================================
    if (/\b(?:settings|setting)\b/i.test(lower) && /\b(?:display|sound|battery|network|wifi)\b/i.test(lower)) {
      const subMatch = lower.match(/\b(display|sound|battery|network|wifi)\b/i);
      const sub = subMatch ? subMatch[1] : 'display';

      const step1Id = `${taskId}_step_1`;
      steps.push({
        stepId: step1Id,
        taskId,
        order: 1,
        title: 'Open Settings',
        description: 'Open system settings.',
        capability: 'open_settings',
        toolId: 'open_settings',
        parameters: { type: 'oneva' },
        dependencies: [],
        status: 'READY',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });

      const step2Id = `${taskId}_step_2`;
      steps.push({
        stepId: step2Id,
        taskId,
        order: 2,
        title: `Navigate to ${sub.toUpperCase()} Settings`,
        description: `Open the ${sub} preferences panel.`,
        capability: 'open_settings_sub',
        toolId: 'open_settings',
        parameters: { type: 'oneva', subCategory: sub },
        dependencies: [step1Id],
        status: 'PENDING',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });

      return steps;
    }

    // =========================================================================
    // PATTERN 5: Multi-app chaining: "Open App A, then Open App B"
    // e.g. "Open Spotify and open YouTube"
    // =========================================================================
    const chainedApps = this.extractChainedApps(lower);
    if (chainedApps.length > 1) {
      let prevStepId = '';
      chainedApps.forEach((appName, index) => {
        const stepId = `${taskId}_step_${index + 1}`;
        steps.push({
          stepId,
          taskId,
          order: index + 1,
          title: `Open ${appName}`,
          description: `Launch ${appName} via Android bridge.`,
          capability: 'open_app',
          toolId: 'open_app',
          parameters: { appName },
          dependencies: prevStepId ? [prevStepId] : [],
          status: index === 0 ? 'READY' : 'PENDING',
          verificationStatus: 'PENDING',
          isIdempotent: true,
        });
        prevStepId = stepId;
      });
      return steps;
    }

    // =========================================================================
    // PATTERN 6: Complex Task / Asset Creation (Section 13)
    // e.g. "create edge glow animation for YouTube", "banao wallpaper", "create keyboard theme"
    // =========================================================================
    if (/\b(?:create|make|generate|banao)\b/i.test(lower) && /\b(?:edge\s*glow|wallpaper|keyboard|theme|animation)\b/i.test(lower)) {
      let category: 'edge_glow' | 'wallpaper' | 'keyboard' | 'theme' = 'edge_glow';
      if (lower.includes('wallpaper')) category = 'wallpaper';
      else if (lower.includes('keyboard')) category = 'keyboard';
      else if (lower.includes('theme')) category = 'theme';

      let targetApp = 'General';
      const forMatch = lower.match(/(?:for|ke\s+liye)\s+([a-zA-Z0-9]+)/i);
      if (forMatch && forMatch[1]) {
        targetApp = forMatch[1].trim();
      }

      const assetName = `${targetApp} ${category === 'edge_glow' ? 'Edge Glow' : category.toUpperCase()}`;

      const step1Id = `${taskId}_step_1`;
      const step2Id = `${taskId}_step_2`;
      const step3Id = `${taskId}_step_3`;
      const step4Id = `${taskId}_step_4`;
      const step5Id = `${taskId}_step_5`;

      steps.push({
        stepId: step1Id,
        taskId,
        order: 1,
        title: `Create ${assetName} Draft`,
        description: `Generate visual specifications for ${assetName}.`,
        capability: 'create_asset',
        toolId: 'create_asset',
        parameters: { category, name: assetName, targetApp },
        dependencies: [],
        status: 'READY',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });

      steps.push({
        stepId: step2Id,
        taskId,
        order: 2,
        title: 'Preview Visual Frame',
        description: `Render isolated edge and frame preview for ${assetName}.`,
        capability: 'preview_asset',
        toolId: 'preview_asset',
        parameters: { assetId: 'draft-asset', name: assetName },
        dependencies: [step1Id],
        status: 'PENDING',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });

      steps.push({
        stepId: step3Id,
        taskId,
        order: 3,
        title: 'Test Rendering & Frame Stability',
        description: `Simulate isolated 60 FPS animation loop with hardware blending.`,
        capability: 'test_asset',
        toolId: 'test_asset',
        parameters: { assetId: 'draft-asset' },
        dependencies: [step2Id],
        status: 'PENDING',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });

      steps.push({
        stepId: step4Id,
        taskId,
        order: 4,
        title: 'Verify OLED & Privacy Compliance',
        description: `Verify Rule 5 non-permanent overlay and battery conservation.`,
        capability: 'verify_asset',
        toolId: 'verify_asset',
        parameters: { assetId: 'draft-asset' },
        dependencies: [step3Id],
        status: 'PENDING',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });

      steps.push({
        stepId: step5Id,
        taskId,
        order: 5,
        title: 'Save & Publish Asset',
        description: `Save verified asset to ONEVA Library and apply ${targetApp} mapping.`,
        capability: 'save_or_publish_asset',
        toolId: 'save_or_publish_asset',
        parameters: { assetId: 'draft-asset', publish: true, targetApp },
        dependencies: [step4Id],
        status: 'PENDING',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });

      return steps;
    }

    // =========================================================================
    // PATTERN 7: Single-step app open or tool operation
    // e.g. "Jarvis YouTube kholo" or "Open Settings" or "Take screenshot"
    // =========================================================================
    if (/\b(?:screenshot|capture screen)\b/i.test(lower)) {
      steps.push({
        stepId: `${taskId}_step_1`,
        taskId,
        order: 1,
        title: 'Capture Screenshot',
        description: 'Check Android MediaProjection capability to take a screenshot.',
        capability: 'screen_capture',
        toolId: 'take_screenshot_if_supported',
        parameters: {},
        dependencies: [],
        status: 'READY',
        verificationStatus: 'PENDING',
      });
      return steps;
    }

    // Single App Match
    const singleApp = this.extractSingleApp(lower);
    if (singleApp) {
      steps.push({
        stepId: `${taskId}_step_1`,
        taskId,
        order: 1,
        title: `Open ${singleApp}`,
        description: `Launch ${singleApp} via Android package launcher.`,
        capability: 'open_app',
        toolId: 'open_app',
        parameters: { appName: singleApp },
        dependencies: [],
        status: 'READY',
        verificationStatus: 'PENDING',
        isIdempotent: true,
      });
      return steps;
    }

    // Default Fallback: Show verified information or status
    steps.push({
      stepId: `${taskId}_step_1`,
      taskId,
      order: 1,
      title: 'Analyze & Provide Status',
      description: 'Review request and return verified on-device system response.',
      capability: 'show_information',
      toolId: 'show_information',
      parameters: { topic: 'status' },
      dependencies: [],
      status: 'READY',
      verificationStatus: 'PENDING',
    });

    return steps;
  }

  /**
   * Helper: Extracts multiple chained app names
   */
  private static extractChainedApps(lower: string): string[] {
    const knownApps = [
      'youtube', 'chrome', 'whatsapp', 'instagram', 'spotify', 'netflix',
      'maps', 'google maps', 'camera', 'settings', 'phonepe', 'paytm', 'zomato', 'swiggy'
    ];

    const found: string[] = [];
    for (const app of knownApps) {
      const regex = new RegExp(`\\b${app}\\b`, 'i');
      if (regex.test(lower)) {
        found.push(app.charAt(0).toUpperCase() + app.slice(1));
      }
    }
    return found;
  }

  /**
   * Helper: Extracts single target application name
   */
  private static extractSingleApp(lower: string): string | null {
    const resolution = AppResolutionService.resolveApp(lower.replace(/(?:open|launch|kholo|chalao|khol|start|jarvis|please)/gi, '').trim());
    if (resolution.found) {
      return resolution.appName;
    }

    const common = ['youtube', 'chrome', 'whatsapp', 'instagram', 'spotify', 'netflix', 'maps', 'camera', 'settings'];
    for (const app of common) {
      if (new RegExp(`\\b${app}\\b`, 'i').test(lower)) {
        return app.charAt(0).toUpperCase() + app.slice(1);
      }
    }
    return null;
  }

  /**
   * Helper: Derives concise task title
   */
  private static deriveTaskTitle(rawGoal: string, steps: JarvisOrchestratedStep[]): string {
    if (steps.length > 1) {
      return `Multi-Step: ${steps[0].title} & ${steps.length - 1} more step(s)`;
    }
    if (steps.length === 1) {
      return steps[0].title;
    }
    return rawGoal.slice(0, 32);
  }
}
