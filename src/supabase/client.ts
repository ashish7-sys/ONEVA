import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfigStatus } from '../types';

// Read from client-safe Vite environment variables with Node fallback
const envObj = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env) ? process.env : {};
const supabaseUrl = ((envObj.VITE_SUPABASE_URL as string) || '').trim();
const supabaseAnonKey = ((envObj.VITE_SUPABASE_ANON_KEY as string) || '').trim();

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

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().isConfigured;
}

/**
 * Returns the singleton Supabase client instance.
 * Returns null gracefully if credentials are missing, preventing unhandled exceptions.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const status = getSupabaseConfigStatus();
  if (!status.isConfigured) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return clientInstance;
}
