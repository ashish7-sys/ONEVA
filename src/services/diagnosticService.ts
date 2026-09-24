import { ErrorReport } from '../types';
import { getSupabaseClient } from '../supabase/client';
import { LocalStorageCache } from '../core/storage/localCache';
import { getRecentLocalErrors } from '../core/error/errorHandler';

export class DiagnosticService {
  static hasUserConsented(): boolean {
    return LocalStorageCache.getDiagnosticsConsent();
  }

  static setUserConsent(consent: boolean): void {
    LocalStorageCache.setDiagnosticsConsent(consent);
  }

  /**
   * Submits an error report to Supabase ONLY if the user explicitly provided consent.
   * If consent is not given, keeps it strictly local on the device.
   */
  static async submitConsentedReport(report: ErrorReport): Promise<{ submitted: boolean; reason?: string }> {
    if (!this.hasUserConsented()) {
      return {
        submitted: false,
        reason: 'User has not consented to diagnostic reporting. Error remains strictly on-device.',
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        submitted: false,
        reason: 'Supabase offline; diagnostic kept in local cache.',
      };
    }

    try {
      const { error } = await supabase.from('error_reports').insert({
        error_code: report.errorCode,
        message: report.message,
        feature_name: report.featureName,
        severity: report.severity,
        user_consented: true,
        client_version: report.clientVersion,
        platform: report.platform,
        metadata: report.metadata || {},
      });

      if (error) {
        return { submitted: false, reason: error.message };
      }

      return { submitted: true };
    } catch (err) {
      return {
        submitted: false,
        reason: err instanceof Error ? err.message : 'Network failure',
      };
    }
  }

  /**
   * Admin-only: retrieve reports for analysis
   */
  static async getReportsForAdmin(): Promise<ErrorReport[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return getRecentLocalErrors();
    }

    try {
      const { data, error } = await supabase
        .from('error_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !data) {
        return getRecentLocalErrors();
      }

      return data.map((d) => ({
        id: d.id,
        errorCode: d.error_code,
        message: d.message,
        featureName: d.feature_name,
        severity: d.severity,
        userConsented: d.user_consented,
        clientVersion: d.client_version,
        platform: d.platform,
        metadata: d.metadata,
        createdAt: d.created_at,
      }));
    } catch {
      return getRecentLocalErrors();
    }
  }
}
