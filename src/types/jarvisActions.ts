/**
 * ONEVA Phase 13: Jarvis Tools & Android Actions Type Definitions
 * 
 * Defines the tool registry contracts, action risk classifications,
 * execution statuses, capability/permission checks, and verified result structures.
 */

export type JarvisToolId =
  | 'open_app'
  | 'open_url'
  | 'open_oneva_section'
  | 'open_settings'
  | 'launch_supported_android_intent'
  | 'show_information'
  | 'search_web'
  | 'take_screenshot_if_supported'
  | 'navigate_back'
  | 'navigate_home'
  | 'select_context_item'
  | 'app_in_context_action'
  | 'enter_text_input'
  | 'whatsapp_send_message'
  | 'youtube_search_play'
  | 'in_app_click'
  | 'in_app_type'
  | 'in_app_scroll'
  | 'system_global_action'
  | 'create_asset'
  | 'preview_asset'
  | 'test_asset'
  | 'verify_asset'
  | 'save_or_publish_asset'
  | 'device_control_toggle'
  | 'device_slider_adjust'
  | 'device_telemetry_query'
  | 'run_system_diagnostics'
  | 'proactive_morning_briefing'
  | 'proactive_night_protocol'
  | 'trigger_sentinel_scan'
  | 'episodic_temporal_query'
  | 'knowledge_graph_query'
  | 'remember_entity_relation'
  | 'predict_user_intent'
  | 'execute_autonomous_routine'
  | 'synthesize_new_routine'
  | 'diagnose_system_health'
  | 'execute_self_healing'
  | 'tune_system_performance';

export type JarvisToolCategory =
  | 'app_management'
  | 'navigation'
  | 'web'
  | 'system'
  | 'intelligence';

export type JarvisActionRiskLevel =
  | 'LOW'       // Direct execution when capability & permission pass (e.g. open app, open URL, navigate)
  | 'MEDIUM'    // Requires user confirmation before execution
  | 'HIGH'      // Dangerous / forbidden operations (strictly rejected by security boundary)
  | 'FORBIDDEN'; // Prohibited actions (shell command, file tampering, private chat access)

export type JarvisActionExecutionStatus =
  | 'REQUESTED'
  | 'VALIDATING'
  | 'CONFIRMATION_REQUIRED'
  | 'PERMISSION_REQUIRED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'FAILED'
  | 'UNSUPPORTED';

export interface JarvisToolParamSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  required: boolean;
  description: string;
  allowedValues?: string[];
  pattern?: RegExp;
}

export interface JarvisActionContext {
  sessionId: string;
  language: 'en' | 'hi' | 'pa' | 'hr' | 'other';
  isOnline: boolean;
  platformMode: 'native-android' | 'web-preview';
  userConfirmed?: boolean;
}

export interface JarvisActionResult {
  actionId: string;
  toolId: JarvisToolId;
  status: JarvisActionExecutionStatus;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'FAILED' | 'UNSUPPORTED' | 'PERMISSION_REQUIRED';
  success: boolean;
  userMessage: string; // Spoken/text response delivered to the user
  technicalDetails?: string;
  data?: Record<string, any>;
  missingPermission?: string;
  missingCapability?: string;
  timestamp: number;
}

export interface JarvisToolDefinition {
  toolId: JarvisToolId;
  name: string;
  userFacingDescription: string;
  description: string;
  category: JarvisToolCategory;
  requiredCapabilities: string[];
  requiredPermissions: string[];
  riskLevel: JarvisActionRiskLevel;
  paramSchemas: JarvisToolParamSchema[];
  isAvailable: () => boolean | Promise<boolean>;
  validateArgs: (args: Record<string, any>) => { valid: boolean; error?: string };
  handler: (args: Record<string, any>, context: JarvisActionContext) => Promise<JarvisActionResult>;
}

export interface JarvisActionRequest {
  actionId: string;
  toolId: string;
  args: Record<string, any>;
  timestamp: number;
  originatingPrompt: string;
  userConfirmed?: boolean;
}

/**
 * Ephemeral In-Session Execution State
 * (Phase 13 only — used strictly for immediate conversational follow-ups like "Did you open it?")
 * NOTE: Permanent memory belongs strictly to Phase 14.
 */
export interface JarvisSessionActionState {
  lastActionId?: string;
  lastToolId?: JarvisToolId;
  lastTargetApp?: string;
  lastTargetPackage?: string;
  lastTargetUrl?: string;
  lastTargetSection?: string;
  lastStatus?: JarvisActionExecutionStatus;
  lastUserMessage?: string;
  lastExecutedAt?: number;
}

/**
 * App Resolution Result
 */
export interface AppResolutionResult {
  found: boolean;
  isInstalled: boolean;
  appName: string;
  packageName: string;
  confidence: number;
  matchedAlias?: string;
  webFallbackIntent?: string;
  isAmbiguous?: boolean;
  ambiguousCandidates?: Array<{ name: string; packageName: string }>;
  rejectionReason?: string;
  // Phase 17: Capability & Discovery awareness
  launchable?: boolean;
  catalogSupported?: boolean;
  jarvisLaunchSupported?: boolean;
  jarvisInteractionSupported?: boolean;
  isSystemApp?: boolean;
}
