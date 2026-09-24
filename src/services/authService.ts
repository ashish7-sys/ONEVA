import { AdminProfile } from '../types';
import { getSupabaseClient } from '../supabase/client';
import { OnevaAppError, recordLocalError } from '../core/error/errorHandler';

export interface AuthStateChangeCallback {
  (admin: AdminProfile | null): void;
}

export const MASTER_ADMIN_EMAIL = 'ashishkumar29032011@gmail.com';
export const MASTER_ADMIN_PASS = 'Ashish_kumar_7593947055';
const SESSION_STORAGE_KEY = 'oneva_admin_session';

export class AuthService {
  /**
   * Secure email/password login for ONEVA Admin Portal.
   * Authenticates authorized administrator credentials and verifies Supabase role.
   */
  static async loginAdmin(email: string, password: string): Promise<{ success: boolean; admin?: AdminProfile; error?: string }> {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Check primary authorized administrator credentials
    if (trimmedEmail === MASTER_ADMIN_EMAIL.toLowerCase() && cleanPassword === MASTER_ADMIN_PASS) {
      const masterProfile: AdminProfile = {
        id: 'admin_ashish_kumar',
        userId: 'admin_ashish_kumar',
        email: MASTER_ADMIN_EMAIL,
        role: 'superadmin',
        displayName: 'Ashish Kumar',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastSignInAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(masterProfile));
      } catch (e) {
        console.warn('Could not cache admin session in localStorage:', e);
      }

      return {
        success: true,
        admin: masterProfile,
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Invalid credentials provided. Please use the authorized administrator credentials.',
      };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: cleanPassword,
      });

      if (authError || !authData.user) {
        return {
          success: false,
          error: authError?.message || 'Invalid credentials provided. Please verify administrator email and password.',
        };
      }

      // Verify admin authorization at database level
      const adminProfile = await this.verifyAdminRole(authData.user.id, authData.user.email || '');
      if (!adminProfile) {
        // Automatically sign out user who is not an admin
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Access Denied: Your account does not have ONEVA administrative privileges.',
        };
      }

      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(adminProfile));
      } catch (e) {
        console.warn('Could not cache admin session in localStorage:', e);
      }

      return {
        success: true,
        admin: adminProfile,
      };
    } catch (err: unknown) {
      const appErr = new OnevaAppError({
        message: err instanceof Error ? err.message : 'Authentication request failed.',
        featureName: 'AdminAuth',
        severity: 'error',
      });
      recordLocalError(appErr);
      return {
        success: false,
        error: appErr.userFacingMessage,
      };
    }
  }

  /**
   * Verifies if user has admin privileges in Supabase profiles or user_roles table.
   * Also checks user_metadata as fallback during bootstrap phase.
   */
  static async verifyAdminRole(userId: string, email: string): Promise<AdminProfile | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      // Query profiles table for role or is_admin flag
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, is_admin, display_name, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        const isAdmin = data.is_admin === true || data.role === 'admin' || data.role === 'superadmin';
        if (isAdmin) {
          return {
            id: data.id,
            userId,
            email,
            role: (data.role as 'admin' | 'superadmin') || 'admin',
            displayName: data.display_name || 'ONEVA Administrator',
            createdAt: data.created_at || new Date().toISOString(),
          };
        }
      }

      // Check user metadata if database table is being initialized
      const { data: userData } = await supabase.auth.getUser();
      const meta = userData.user?.user_metadata;
      if (meta?.role === 'admin' || meta?.is_admin === true) {
        return {
          id: userId,
          userId,
          email,
          role: 'admin',
          displayName: meta.display_name || 'ONEVA Administrator',
          createdAt: new Date().toISOString(),
        };
      }

      return null;
    } catch (err) {
      console.warn('[AuthService] Admin role verification encountered error:', err);
      return null;
    }
  }

  static async getActiveAdminSession(): Promise<AdminProfile | null> {
    // First check cached local admin session
    try {
      const cached = localStorage.getItem(SESSION_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AdminProfile;
        if (parsed && parsed.email && (parsed.role === 'admin' || parsed.role === 'superadmin')) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage read issues
    }

    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return null;

      return await this.verifyAdminRole(session.user.id, session.user.email || '');
    } catch {
      return null;
    }
  }

  static async logoutAdmin(): Promise<void> {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage remove issues
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }
}
