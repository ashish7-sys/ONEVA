import { RemoteConfig } from '../types';
import { getSupabaseClient } from '../supabase/client';
import { LocalStorageCache } from '../core/storage/localCache';
import { ONEVA_CLIENT_CONFIG } from '../core/config';

export class RemoteConfigService {
  /**
   * Loads remote configuration.
   * If Supabase is unreachable, automatically returns the cached or last-known-good configuration.
   */
  static async getAllConfigs(): Promise<{ configs: Record<string, unknown>; source: 'remote' | 'cached' | 'default' }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        configs: LocalStorageCache.getCachedRemoteConfig(),
        source: 'cached',
      };
    }

    try {
      const { data, error } = await supabase
        .from('remote_configs')
        .select('*')
        .eq('is_active', true);

      if (error || !data || data.length === 0) {
        return {
          configs: LocalStorageCache.getCachedRemoteConfig(),
          source: 'cached',
        };
      }

      const parsedConfigs: Record<string, unknown> = {};
      for (const row of data) {
        parsedConfigs[row.key] = row.value;
      }

      // Merge with default values so any missing keys are safely populated
      const merged = {
        ...ONEVA_CLIENT_CONFIG.defaults.remoteConfig,
        ...parsedConfigs,
      };

      LocalStorageCache.setCachedRemoteConfig(merged);

      return {
        configs: merged,
        source: 'remote',
      };
    } catch {
      return {
        configs: LocalStorageCache.getCachedRemoteConfig(),
        source: 'cached',
      };
    }
  }

  /**
   * Admin-only: update a remote config key in Supabase
   */
  static async updateConfig(key: string, value: unknown, description?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase client is not available.' };
    }

    try {
      const { error } = await supabase
        .from('remote_configs')
        .upsert({
          key,
          value,
          description: description || 'Remote configuration parameter',
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  }
}
