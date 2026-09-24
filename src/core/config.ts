export const ONEVA_CLIENT_CONFIG = {
  appName: 'ONEVA',
  version: '1.0.0-alpha',
  targetPlatform: 'Android 14+ / Companion Web',
  privacyGuarantee: '100% On-Device Processing for Personal Data',
  network: {
    connectionTimeoutMs: 5000,
    maxRetries: 2,
    retryDelayMs: 1000,
  },
  storage: {
    publicBucket: 'oneva-public-assets',
    adminBucket: 'oneva-admin-assets',
  },
  defaults: {
    remoteConfig: {
      'core.diagnostics.consent_required': true,
      'core.privacy.zero_cloud_logging': true,
      'core.offline_mode.enabled': true,
      'features.oneva_ui.enabled': true,
      'features.oneva_glow.status': 'verified',
      'features.oneva_themes.status': 'verified',
      'features.oneva_icons.status': 'verified',
      'features.oneva_keyboard.status': 'testing',
      'features.oneva_assist.status': 'draft',
      'features.oneva_vision.status': 'draft',
      'features.oneva_upgrade_center.status': 'verified',
    },
  },
} as const;
