/**
 * ONEVA Phase 21: Default Hand Control Gesture Mappings
 * 
 * Pre-configured safe mappings adhering to Phase 13/14 security standards,
 * Phase 20 Work Panel background execution contracts, and Android system actions.
 */

import { HandControlConfig, HandControlMapping } from '../../../types/jarvisHandControl';

export const DEFAULT_HAND_CONTROL_MAPPINGS: HandControlMapping[] = [
  {
    id: 'map_open_palm',
    gestureType: 'open_palm',
    label: 'Stop Active Task',
    description: 'Cancels the active JARVIS background work task or pauses current action.',
    enabled: true,
    action: {
      actionType: 'phase20_stop_task',
      label: 'Stop Active Task',
      description: 'Stops and aborts the currently running task with clean cancellation.',
      requiresConfirmation: false,
    },
  },
  {
    id: 'map_swipe_down',
    gestureType: 'swipe_down',
    label: 'Close Work Panel (Continue in Background)',
    description: 'Hides the live work panel while background tasks continue unaffected.',
    enabled: true,
    action: {
      actionType: 'phase20_close_panel',
      label: 'Close Panel (Task Continues)',
      description: 'Preserves Phase 20 background continuation without stopping work.',
      requiresConfirmation: false,
    },
  },
  {
    id: 'map_swipe_right',
    gestureType: 'swipe_right',
    label: 'Navigate to Home',
    description: 'Returns directly to the ONEVA Home surface.',
    enabled: true,
    action: {
      actionType: 'navigate_home',
      label: 'Home Screen',
      description: 'Navigates to ONEVA Home screen cleanly.',
    },
  },
  {
    id: 'map_swipe_left',
    gestureType: 'swipe_left',
    label: 'Navigate Back',
    description: 'Executes safe Android system back navigation.',
    enabled: true,
    action: {
      actionType: 'navigate_back',
      label: 'Back',
      description: 'Navigates back to previous screen or launcher state.',
    },
  },
  {
    id: 'map_thumbs_up',
    gestureType: 'thumbs_up',
    label: 'Confirm Pending Action',
    description: 'Confirms an operation that is actively waiting for user confirmation.',
    enabled: true,
    action: {
      actionType: 'confirm_pending',
      label: 'Confirm Pending',
      description: 'Approves any pending action requiring explicit confirmation.',
    },
  },
  {
    id: 'map_swipe_up',
    gestureType: 'swipe_up',
    label: 'Next Work Task / Open Panel',
    description: 'Cycles focus between active work tasks or opens the work panel.',
    enabled: true,
    action: {
      actionType: 'phase20_next_task',
      label: 'Next Work Task',
      description: 'Focuses next background task or opens the work panel.',
    },
  },
  {
    id: 'map_closed_fist',
    gestureType: 'closed_fist',
    label: 'Trigger Edge Glow',
    description: 'Activates ambient edge illumination using active theme colors.',
    enabled: true,
    action: {
      actionType: 'toggle_edge_glow',
      label: 'Ambient Edge Glow',
      description: 'Renders the transparent edge glow overlay.',
    },
  },
  {
    id: 'map_two_finger_point',
    gestureType: 'two_finger_point',
    label: 'Show System Status',
    description: 'Displays verified battery, privacy sandboxing, and platform health.',
    enabled: true,
    action: {
      actionType: 'show_system_info',
      toolId: 'show_information',
      args: { topic: 'platform' },
      label: 'System Status',
      description: 'Shows verified on-device system health.',
    },
  },
];

export const DEFAULT_HAND_CONTROL_CONFIG: HandControlConfig = {
  enabled: false,
  activationMethod: 'manual',
  confidenceThreshold: 0.65,
  cooldownMs: 1200,
  holdDurationMs: 250,
  showHints: true,
  showPreviewPill: true,
  hapticFeedback: true,
  voiceConfirmation: true,
  cameraFacing: 'user',
  isMirrored: true,
  mappings: DEFAULT_HAND_CONTROL_MAPPINGS,
  customGestures: [],
};
