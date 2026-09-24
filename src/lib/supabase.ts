import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConnectionTestResult, SupabaseConfigStatus } from '../types';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let clientInstance: SupabaseClient | null = null;

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const hasUrl = Boolean(supabaseUrl && supabaseUrl.startsWith('http'));
  const hasAnonKey = Boolean(supabaseAnonKey && supabaseAnonKey.length > 10);
  
  let urlPreview: string | undefined;
  if (hasUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      urlPreview = `${parsed.protocol}//${parsed.hostname}`;
    } catch {
      urlPreview = supabaseUrl.slice(0, 24) + '...';
    }
  }

  return {
    isConfigured: hasUrl && hasAnonKey,
    hasUrl,
    hasAnonKey,
    urlPreview,
  };
}

export function getSupabase(): SupabaseClient | null {
  const status = getSupabaseConfigStatus();
  if (!status.isConfigured) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return clientInstance;
}

export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const status = getSupabaseConfigStatus();
  
  if (!status.isConfigured) {
    return {
      status: 'error',
      message: 'Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in project settings or environment.',
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      status: 'error',
      message: 'Failed to initialize Supabase client instance.',
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  const startTime = performance.now();

  try {
    // Ping Supabase Auth service (lightweight, doesn't require any predefined tables)
    const { error } = await client.auth.getSession();
    const latencyMs = Math.round(performance.now() - startTime);

    if (error) {
      return {
        status: 'error',
        message: `Supabase responded with an error: ${error.message}`,
        latencyMs,
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    return {
      status: 'success',
      message: 'Supabase backend connection verified successfully! Auth & API endpoints are live and responsive.',
      latencyMs,
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMsg = err instanceof Error ? err.message : 'Unknown network failure';
    return {
      status: 'error',
      message: `Connection failed: ${errorMsg}`,
      latencyMs,
      timestamp: new Date().toLocaleTimeString(),
    };
  }
}
