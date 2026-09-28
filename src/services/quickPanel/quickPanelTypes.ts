/**
 * ONEVA Quick Panel & System Control Layer Type Definitions
 */

export type ControlId =
  | 'wifi'
  | 'sound'
  | 'bluetooth'
  | 'torch'
  | 'mobile_data'
  | 'hotspot'
  | 'airplane'
  | 'location'
  | 'dark_mode'
  | 'dnd'
  | 'auto_rotate'
  | 'screen_timeout'
  | 'settings'
  | 'device_control'
  | 'media_output';

export interface ControlCapability {
  id: ControlId;
  name: string;
  category: 'connectivity' | 'audio' | 'display' | 'system' | 'oneva';
  isSupported: boolean;
  reason?: string;
  actionType: 'toggle' | 'slider' | 'intent';
  currentStatus: string;
  isActive: boolean;
}

export interface QuickPanelSkin {
  id: string;
  name: string;
  description: string;
  previewBg: string;
  activeTileClass: string;
  inactiveTileClass: string;
  accentGlow: string;
  badge: string;
}

export interface NotificationItem {
  key: string;
  id: number;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  subText?: string;
  postTime: number;
  isOngoing: boolean;
  isClearable: boolean;
  category?: string;
  iconBase64?: string;
  actions: Array<{
    title: string;
    actionIndex: number;
  }>;
}

export type QuickPanelState = 'closed' | 'compact' | 'expanded';

export interface DeviceCapabilityProfile {
  androidVersion: string;
  sdkInt: number;
  manufacturer: string;
  model: string;
  brand: string;
  screenWidth: number;
  screenHeight: number;
  density: number;
  densityDpi: number;
  hasNotificationAccess: boolean;
  hasWriteSettingsAccess: boolean;
  hasOverlayAccess: boolean;
  hasCamera: boolean;
  hasFlashlight: boolean;
  hasWifi: boolean;
  hasBluetooth: boolean;
  hasTelephony: boolean;
  supportedControls: ControlId[];
  calibratedAt: number;
}

export interface QuickPanelConfig {
  triggerHeightPx: number;
  isCalibrationDone: boolean;
  selectedSkinId: string;
  activeControlIds: ControlId[];
  page1ControlIds: ControlId[];
  page2ControlIds: ControlId[];
  autoBrightness: boolean;
  vibrateOnTap: boolean;
}
