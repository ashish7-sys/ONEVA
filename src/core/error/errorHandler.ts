import { ErrorReport, ErrorSeverity } from '../../types';
import { ONEVA_CLIENT_CONFIG } from '../config';
import { LocalStorageCache } from '../storage/localCache';

export interface OnevaAppErrorParams {
  message: string;
  featureName: string;
  severity?: ErrorSeverity;
  rawError?: unknown;
  metadata?: Record<string, unknown>;
}

export class OnevaAppError extends Error {
  public readonly errorId: string;
  public readonly featureName: string;
  public readonly severity: ErrorSeverity;
  public readonly userFacingMessage: string;
  public readonly timestamp: string;
  public readonly metadata?: Record<string, unknown>;

  constructor(params: OnevaAppErrorParams) {
    // Sanitize user message to strip potential leaked keys, tokens, or emails
    const sanitized = OnevaAppError.sanitizeMessage(params.message);
    super(sanitized);

    this.errorId = `ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    this.featureName = params.featureName;
    this.severity = params.severity || 'error';
    this.userFacingMessage = sanitized;
    this.timestamp = new Date().toISOString();
    this.metadata = OnevaAppError.sanitizeMetadata(params.metadata);
  }

  static sanitizeMessage(msg: string): string {
    if (!msg) return 'An unexpected system event occurred.';
    // Mask potential JWT tokens, Bearer headers, or secret keys
    return msg
      .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, '[REDACTED_JWT]')
      .replace(/key=[a-zA-Z0-9_\-]{16,}/gi, 'key=[REDACTED_KEY]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  }

  static sanitizeMetadata(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!meta) return undefined;
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(meta)) {
      // Exclude dangerous fields
      if (['password', 'token', 'secret', 'phone', 'contact', 'message', 'chat', 'audio'].some(k => key.toLowerCase().includes(k))) {
        clean[key] = '[REDACTED_PRIVATE_DATA]';
      } else if (typeof value === 'string') {
        clean[key] = OnevaAppError.sanitizeMessage(value);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  toReport(): ErrorReport {
    return {
      id: this.errorId,
      errorCode: this.errorId,
      message: this.userFacingMessage,
      featureName: this.featureName,
      severity: this.severity,
      userConsented: LocalStorageCache.getDiagnosticsConsent(),
      clientVersion: ONEVA_CLIENT_CONFIG.version,
      platform: ONEVA_CLIENT_CONFIG.targetPlatform,
      metadata: this.metadata,
      createdAt: this.timestamp,
    };
  }
}

// In-memory buffer of recent local errors for the admin diagnostics view
const recentLocalErrors: ErrorReport[] = [];

export function recordLocalError(err: OnevaAppError): void {
  recentLocalErrors.unshift(err.toReport());
  if (recentLocalErrors.length > 50) {
    recentLocalErrors.pop();
  }
  console.warn(`[ONEVA ${err.featureName}] [${err.severity.toUpperCase()}] ${err.errorId}: ${err.userFacingMessage}`);
}

export function getRecentLocalErrors(): ErrorReport[] {
  return [...recentLocalErrors];
}
