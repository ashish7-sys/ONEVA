import { BackendHealth } from '../types';
import { getSupabaseClient, getSupabaseConfigStatus } from './client';
import { ONEVA_CLIENT_CONFIG } from '../core/config';

export async function checkBackendHealth(): Promise<BackendHealth> {
  const configStatus = getSupabaseConfigStatus();

  if (!configStatus.isConfigured) {
    return {
      isConfigured: false,
      isOnline: false,
      lastChecked: new Date().toLocaleTimeString(),
      errorDetails: 'Supabase credentials missing in environment (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
      urlPreview: configStatus.urlPreview,
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      isConfigured: true,
      isOnline: false,
      lastChecked: new Date().toLocaleTimeString(),
      errorDetails: 'Supabase client instance could not be initialized.',
      urlPreview: configStatus.urlPreview,
    };
  }

  const startTime = performance.now();

  try {
    // Timeout-guarded health check
    const timeoutPromise = new Promise<{ timeout: true }>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out')), ONEVA_CLIENT_CONFIG.network.connectionTimeoutMs)
    );

    const checkPromise = client.auth.getSession();

    await Promise.race([checkPromise, timeoutPromise]);
    const latencyMs = Math.round(performance.now() - startTime);

    return {
      isConfigured: true,
      isOnline: true,
      latencyMs,
      lastChecked: new Date().toLocaleTimeString(),
      urlPreview: configStatus.urlPreview,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMsg = err instanceof Error ? err.message : 'Unknown backend connection error';
    return {
      isConfigured: true,
      isOnline: false,
      latencyMs,
      lastChecked: new Date().toLocaleTimeString(),
      errorDetails: errorMsg,
      urlPreview: configStatus.urlPreview,
    };
  }
}
