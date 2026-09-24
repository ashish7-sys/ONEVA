/**
 * ONEVA Phase 13: Central Action Dispatcher
 * 
 * Enforces the strict security boundary between Jarvis AI and Android native functions:
 * AI / Intent
 *   ↓
 * Schema Validation
 *   ↓
 * Tool Allowlist Check
 *   ↓
 * Argument Validation
 *   ↓
 * Capability & Permission Check
 *   ↓
 * Action Risk & Confirmation Gate
 *   ↓
 * Execution Handler
 *   ↓
 * Verified Result Reporting
 * 
 * Also manages ephemeral in-session execution state for immediate conversational follow-ups.
 */

import {
  JarvisToolId,
  JarvisActionRequest,
  JarvisActionResult,
  JarvisActionContext,
  JarvisSessionActionState,
} from '../../types/jarvisActions';
import { JarvisToolRegistry } from './jarvisToolRegistry';
import { AndroidActionBridge } from './androidActionBridge';
import { JarvisTaskHistoryService } from '../memory/jarvisTaskHistoryService';
import { JarvisMemoryStorage } from '../memory/jarvisMemoryStorage';
import { OwnerAuthService } from '../memory/ownerAuthService';
import { JarvisDeviceContextManager } from '../intelligence/jarvisDeviceContextManager';

export class ActionDispatcher {
  private static sessionState: JarvisSessionActionState = {};
  private static listeners: Set<(result: JarvisActionResult) => void> = new Set();
  private static executionListeners: Set<(state: { isExecuting: boolean; currentStep?: string }) => void> = new Set();

  /**
   * Main Dispatch Pipeline
   */
  static async dispatch(
    request: JarvisActionRequest,
    customContext?: Partial<JarvisActionContext>
  ): Promise<JarvisActionResult> {
    const actionId = request.actionId || `act_${Date.now()}`;
    const timestamp = Date.now();

    this.notifyExecutionState(true, `Validating ${request.toolId}...`);

    const context: JarvisActionContext = {
      sessionId: 'session_active',
      language: 'en',
      isOnline: AndroidActionBridge.isOnline(),
      platformMode: AndroidActionBridge.isNativeAndroid() ? 'native-android' : 'web-preview',
      userConfirmed: request.userConfirmed,
      ...customContext,
    };

    try {
      // 1. Tool Allowlist Check
      if (!JarvisToolRegistry.isToolRegistered(request.toolId)) {
        const result: JarvisActionResult = {
          actionId,
          toolId: request.toolId as JarvisToolId,
          status: 'UNSUPPORTED',
          success: false,
          userMessage: `Sir, "${request.toolId}" is not a recognized or supported tool on this device.`,
          technicalDetails: `Tool "${request.toolId}" not in allowlist.`,
          timestamp,
        };
        this.recordSessionState(result, request.args);
        return result;
      }

      const tool = JarvisToolRegistry.getTool(request.toolId as JarvisToolId);
      if (!tool) {
        return {
          actionId,
          toolId: request.toolId as JarvisToolId,
          status: 'FAILED',
          success: false,
          userMessage: 'Sir, tool definition could not be retrieved.',
          timestamp,
        };
      }

      // 2. Risk & Security Boundary Check
      if (tool.riskLevel === 'HIGH' || tool.riskLevel === 'FORBIDDEN') {
        const result: JarvisActionResult = {
          actionId,
          toolId: tool.toolId,
          status: 'UNSUPPORTED',
          success: false,
          userMessage: 'Sir, this action is restricted by ONEVA Rule 6 privacy and security boundaries.',
          technicalDetails: 'High risk / prohibited operation blocked.',
          timestamp,
        };
        this.recordSessionState(result, request.args);
        return result;
      }

      // 3. Confirmation Check for Medium Risk Actions
      if (tool.riskLevel === 'MEDIUM' && !context.userConfirmed) {
        const result: JarvisActionResult = {
          actionId,
          toolId: tool.toolId,
          status: 'CONFIRMATION_REQUIRED',
          success: false,
          userMessage: `Sir, please confirm if you would like me to proceed with ${tool.name}.`,
          technicalDetails: 'Action requires explicit user confirmation.',
          timestamp,
        };
        this.recordSessionState(result, request.args);
        return result;
      }

      // 4. Argument Validation
      if (!request.args || typeof request.args !== 'object') {
        const result: JarvisActionResult = {
          actionId,
          toolId: tool.toolId,
          status: 'FAILED',
          success: false,
          userMessage: 'Sir, the action request contains malformed parameters.',
          technicalDetails: 'Arguments payload is not an object.',
          timestamp,
        };
        this.recordSessionState(result, request.args);
        return result;
      }

      const argValidation = tool.validateArgs(request.args);
      if (!argValidation.valid) {
        const result: JarvisActionResult = {
          actionId,
          toolId: tool.toolId,
          status: 'FAILED',
          success: false,
          userMessage: `Sir, invalid parameters: ${argValidation.error}`,
          technicalDetails: argValidation.error,
          timestamp,
        };
        this.recordSessionState(result, request.args);
        return result;
      }

      // 5. Capability Check
      const available = await tool.isAvailable();
      if (!available) {
        const result: JarvisActionResult = {
          actionId,
          toolId: tool.toolId,
          status: 'UNSUPPORTED',
          success: false,
          userMessage: `Sir, the capability for ${tool.name} is not available on this device.`,
          technicalDetails: 'Tool isAvailable() returned false.',
          timestamp,
        };
        this.recordSessionState(result, request.args);
        return result;
      }

      // 6. Permission Check
      for (const perm of tool.requiredPermissions) {
        const hasPerm = await AndroidActionBridge.checkPermission(perm);
        if (!hasPerm) {
          const result: JarvisActionResult = {
            actionId,
            toolId: tool.toolId,
            status: 'PERMISSION_REQUIRED',
            success: false,
            userMessage: `Sir, ${perm} permission is required before executing ${tool.name}.`,
            missingPermission: perm,
            timestamp,
          };
          this.recordSessionState(result, request.args);
          return result;
        }
      }

      // 7. Execution Gate
      this.notifyExecutionState(true, `Executing ${tool.name}...`);
      const result = await tool.handler(request.args, context);

      // 8. Result Verification & Recording
      this.recordSessionState(result, request.args);
      this.notifyResult(result);
      return result;
    } catch (err: any) {
      console.error('[ActionDispatcher] Unhandled execution error:', err);
      const fallbackResult: JarvisActionResult = {
        actionId,
        toolId: (request.toolId as JarvisToolId) || 'open_app',
        status: 'FAILED',
        success: false,
        userMessage: 'Sir, an error occurred while executing that device action.',
        technicalDetails: err?.message || 'UNKNOWN_ERROR',
        timestamp,
      };
      this.recordSessionState(fallbackResult, request.args);
      return fallbackResult;
    } finally {
      this.notifyExecutionState(false);
    }
  }

  /**
   * Ephemeral In-Session State Management
   * Allows Jarvis to answer immediate conversational follow-ups like "Did you open it?"
   */
  private static recordSessionState(result: JarvisActionResult, args: Record<string, any>): void {
    this.sessionState = {
      lastActionId: result.actionId,
      lastToolId: result.toolId,
      lastStatus: result.status,
      lastUserMessage: result.userMessage,
      lastExecutedAt: result.timestamp,
      lastTargetApp: args?.appName || result.data?.appName,
      lastTargetPackage: result.data?.packageName,
      lastTargetUrl: args?.url,
      lastTargetSection: args?.section,
    };

    // Phase 16: Update Ephemeral Device Context
    try {
      if (result.success || result.status === 'EXECUTED') {
        if (result.toolId === 'open_app') {
          const appPkg = result.data?.packageName || 'com.example.app';
          const appName = args?.appName || result.data?.appName || 'Application';
          JarvisDeviceContextManager.setApp(appPkg, appName);
        } else if (result.toolId === 'open_oneva_section') {
          JarvisDeviceContextManager.setSection(args?.section || 'home');
        } else if (result.toolId === 'open_url' && args?.inAppQuery) {
          const q = args.inAppQuery;
          JarvisDeviceContextManager.setSearchResults(q, [
            { index: 1, title: `${q} Official Channel`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAg%253D%253D` },
            { index: 2, title: `${q} - Latest Video`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=CAI%253D` },
            { index: 3, title: `${q} - Highlights & Playlists`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
          ]);
        }
      }
    } catch (e) {
      console.warn('[ActionDispatcher] Context update notice:', e);
    }

    // Phase 14: Record privacy-first compact summary in user-scoped task history
    try {
      if (result.success || result.status === 'EXECUTED') {
        JarvisTaskHistoryService.recordTask(
          result.userMessage,
          'app_action',
          {
            taskId: result.actionId,
            relatedToolId: result.toolId,
          }
        );

        if (JarvisMemoryStorage.getSettings().autoSaveTaskMemory) {
          JarvisMemoryStorage.save({
            memoryId: `mem_act_${result.actionId}`,
            type: 'JARVIS_TASK_MEMORY',
            title: `Action: ${result.toolId}`,
            summary: result.userMessage,
            content: result.technicalDetails || result.userMessage,
            tags: [result.toolId],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            source: 'task_execution',
            importance: 'low',
            ownerScope: OwnerAuthService.getActiveActorType() === 'owner' ? 'owner' : 'user_2',
            reasonStored: 'Completed device action summary',
          });
        }
      }
    } catch (e) {
      console.warn('[ActionDispatcher] Task history record notice:', e);
    }
  }

  /**
   * Retrieve current in-session action state
   */
  static getSessionState(): JarvisSessionActionState {
    return { ...this.sessionState };
  }

  /**
   * Check if a prompt is an immediate follow-up asking about the last action
   */
  static isFollowUpVerificationQuestion(prompt: string): boolean {
    const lower = prompt.trim().toLowerCase();
    return (
      /\b(?:did you open it|have you opened|is it open|kya khol diya|khula kya|open ho gaya|did it open)\b/i.test(lower) ||
      /\b(?:did you do that|kya kar diya|ho gaya kya|status kya hai)\b/i.test(lower)
    );
  }

  /**
   * Generate verified response for follow-up verification question
   */
  static answerFollowUpVerification(language: 'en' | 'hi' | 'pa' | 'hr' | 'other' = 'en'): string {
    const s = this.sessionState;
    if (!s.lastExecutedAt || Date.now() - s.lastExecutedAt > 5 * 60 * 1000) {
      return language === 'hi' || language === 'hr'
        ? 'सर, हाल ही में कोई एक्शन निष्पादित (execute) नहीं किया गया है।'
        : 'Sir, no recent action was executed in this session.';
    }

    if (s.lastToolId === 'open_app') {
      const app = s.lastTargetApp || 'application';
      if (s.lastStatus === 'EXECUTED') {
        return language === 'hi' || language === 'hr'
          ? `जी सर, ${app} खोल दिया गया है।`
          : `Yes sir, ${app} has been opened.`;
      } else if (s.lastStatus === 'FAILED') {
        return language === 'hi' || language === 'hr'
          ? `सर, ${app} नहीं खोला जा सका था।`
          : `Sir, I was unable to open ${app}.`;
      }
    }

    if (s.lastStatus === 'EXECUTED') {
      return language === 'hi' || language === 'hr'
        ? 'जी सर, पिछला एक्शन सफलतापूर्वक पूरा हो गया था।'
        : 'Yes sir, the previous action was completed successfully.';
    }

    return s.lastUserMessage || 'Sir, that action could not be completed.';
  }

  static subscribe(listener: (result: JarvisActionResult) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static subscribeExecutionState(listener: (state: { isExecuting: boolean; currentStep?: string }) => void): () => void {
    this.executionListeners.add(listener);
    return () => {
      this.executionListeners.delete(listener);
    };
  }

  private static notifyResult(result: JarvisActionResult): void {
    this.listeners.forEach((l) => {
      try {
        l(result);
      } catch (err) {
        console.error('[ActionDispatcher] Result listener error:', err);
      }
    });
  }

  private static notifyExecutionState(isExecuting: boolean, currentStep?: string): void {
    this.executionListeners.forEach((l) => {
      try {
        l({ isExecuting, currentStep });
      } catch (err) {
        console.error('[ActionDispatcher] Execution state listener error:', err);
      }
    });
  }
}
