/**
 * ONEVA Phase 16: Context-Aware App Interaction Types
 * 
 * Defines the lightweight current device & app context model,
 * contextual references resolution schemas, capabilities, and accessibility hooks.
 * 
 * ABSOLUTE PRIVACY:
 * - Ephemeral, in-memory only (never stored in database)
 * - Zero keystroke recording, zero screen capture, zero chat recording
 * - Automatic expiration on app switch, task completion, or timeout
 */

import { PageId } from '../navigation/types';
import { JarvisToolId } from './jarvisActions';

export type AppCapability =
  | 'APP_LAUNCH'
  | 'APP_NAVIGATE'
  | 'APP_SEARCH'
  | 'APP_SELECT'
  | 'APP_BACK'
  | 'APP_HOME'
  | 'APP_SCROLL'
  | 'APP_OPEN_ITEM'
  | 'APP_ACTION';

export type ContextConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ContextItem {
  index: number;
  title: string;
  url?: string;
  packageName?: string;
  payload?: Record<string, any>;
}

export interface JarvisAppContext {
  currentApp?: {
    packageName: string;
    appName: string;
  };
  currentOnevaSection?: PageId;
  activeContextType: 'idle' | 'app_screen' | 'search_results' | 'video_player' | 'web_page' | 'oneva_section';
  activeTaskId?: string;
  lastExecutedAction?: {
    toolId: JarvisToolId | string;
    timestamp: number;
    success: boolean;
    description: string;
  };
  currentTaskStep?: string;
  knownNavigationContext?: {
    screenTitle?: string;
    canGoBack?: boolean;
    depth?: number;
  };
  selectedItemContext?: {
    listType: 'search_results' | 'app_list' | 'video_list' | 'generic';
    query?: string;
    items: ContextItem[];
    selectedIndex?: number;
  };
  timestamp: number;
  updatedAt: number;
  expiresAt: number;
  confidence: ContextConfidence;
}

export interface ContextResolutionResult {
  resolved: boolean;
  needsClarification: boolean;
  clarificationPrompt?: string;
  confidence: ContextConfidence;
  targetAction?: {
    toolId: JarvisToolId;
    args: Record<string, any>;
    description: string;
  };
  reason?: string;
  error?: string;
}

export interface NativeAccessibilityStatus {
  isAvailable: boolean;
  serviceEnabled: boolean;
  supportedCapabilities: AppCapability[];
  statusMessage: string;
  missingRequirement?: string;
}
