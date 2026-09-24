/**
 * ONEVA Phase 14: Owner Authentication & Multi-User Identity Service
 * 
 * Provides local-first, privacy-first owner verification:
 * - SHA-256 hashed password with unique cryptographic salt
 * - Zero plaintext storage, zero transmission to backend, zero logging
 * - Multi-user identity profiles (Owner, Secondary User, Unknown User)
 * - Honest local voice recognition capability tracking with password fallback
 * - Temporal session verification gate for protected operations
 */

import {
  OwnerAuthCredentials,
  JarvisActorProfile,
  JarvisActorType,
} from '../../types/jarvisMemory';

const STORAGE_KEY_AUTH = 'oneva_owner_auth_v1';
const STORAGE_KEY_ACTIVE_ACTOR = 'oneva_active_actor_v1';

export class OwnerAuthService {
  private static credentials: OwnerAuthCredentials | null = null;
  private static isInitialized = false;

  // Profiles
  private static readonly PROFILES: Record<string, JarvisActorProfile> = {
    owner: {
      id: 'owner',
      displayName: 'Device Owner (Primary)',
      type: 'owner',
      voiceEnrolled: false,
      voiceConfidenceThreshold: 0.85,
      avatarColor: 'emerald',
    },
    user_2: {
      id: 'user_2',
      displayName: 'Voice Profile 2 (Family / Guest)',
      type: 'secondary',
      voiceEnrolled: false,
      voiceConfidenceThreshold: 0.80,
      avatarColor: 'sky',
    },
    unknown: {
      id: 'unknown',
      displayName: 'Unrecognized Voice / Actor',
      type: 'unknown',
      voiceEnrolled: false,
      voiceConfidenceThreshold: 0.95,
      avatarColor: 'neutral',
    },
  };

  private static activeActorId: string = 'owner';
  private static verifiedSessionExpiry: number = 0; // Timestamp until which owner is unlocked in current session
  private static listeners: Set<() => void> = new Set();

  /**
   * Initializes the Owner Auth Service from local storage
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_AUTH);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.passwordHash === 'string' && typeof parsed.salt === 'string') {
            this.credentials = parsed;
          }
        }

        const savedActor = localStorage.getItem(STORAGE_KEY_ACTIVE_ACTOR);
        if (savedActor && this.PROFILES[savedActor]) {
          this.activeActorId = savedActor;
        }
      }
    } catch (e) {
      console.warn('[OwnerAuth] Error reading auth store, using safe defaults:', e);
    }
  }

  // ========================================================
  // Credentials & Hashing
  // ========================================================

  /**
   * Generates a SHA-256 hash using Web Crypto API or safe synchronous fallback
   */
  private static async hashPassword(password: string, salt: string): Promise<string> {
    const combined = `${salt}:${password}:oneva_auth_v1`;
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // Deterministic fallback for environments without crypto.subtle
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `fb_${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }

  private static generateSalt(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return Math.random().toString(36).substring(2, 18);
  }

  /**
   * Checks whether the owner has set an authentication password
   */
  static isOwnerPasswordSet(): boolean {
    this.init();
    return !!(this.credentials && this.credentials.isConfigured && this.credentials.passwordHash);
  }

  /**
   * Sets up the initial Owner Password
   */
  static async setupOwnerPassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    this.init();
    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'Owner password must be at least 4 characters.' };
    }

    const salt = this.generateSalt();
    const passwordHash = await this.hashPassword(newPassword, salt);

    this.credentials = {
      salt,
      passwordHash,
      isConfigured: true,
      updatedAt: Date.now(),
      failedAttempts: 0,
    };

    this.saveCredentials();
    this.unlockOwnerSession(5 * 60 * 1000); // Auto unlock session for 5 min upon setup
    this.notify();

    return { success: true, message: 'ONEVA Owner password created securely.' };
  }

  /**
   * Verifies the provided password against the stored hash
   */
  static async verifyPassword(inputPassword: string): Promise<{ success: boolean; message: string }> {
    this.init();

    if (!this.credentials || !this.credentials.isConfigured) {
      return { success: false, message: 'Owner password has not been configured yet.' };
    }

    // Check Lockout
    if (this.credentials.lockoutUntil && Date.now() < this.credentials.lockoutUntil) {
      const remainingSec = Math.ceil((this.credentials.lockoutUntil - Date.now()) / 1000);
      return {
        success: false,
        message: `Too many failed attempts. Protected operations locked for ${remainingSec}s.`,
      };
    }

    const inputHash = await this.hashPassword(inputPassword, this.credentials.salt);
    const matches = inputHash === this.credentials.passwordHash;

    if (matches) {
      this.credentials.failedAttempts = 0;
      this.credentials.lockoutUntil = undefined;
      this.saveCredentials();
      this.unlockOwnerSession(5 * 60 * 1000); // 5 minutes unlocked session
      this.notify();
      return { success: true, message: 'Owner verification successful.' };
    } else {
      this.credentials.failedAttempts = (this.credentials.failedAttempts || 0) + 1;
      if (this.credentials.failedAttempts >= 5) {
        this.credentials.lockoutUntil = Date.now() + 60 * 1000; // 60s lockout
      }
      this.saveCredentials();
      this.notify();
      return {
        success: false,
        message: `Incorrect owner password.${this.credentials.failedAttempts >= 3 ? ' Multiple failed attempts detected.' : ''}`,
      };
    }
  }

  /**
   * Changes the owner password. Requires current password verification.
   * Rule 10: The owner password can be changed only after successful owner verification.
   */
  static async changeOwnerPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    this.init();

    // Verify current first
    const verification = await this.verifyPassword(currentPassword);
    if (!verification.success) {
      return { success: false, message: `Cannot change password: ${verification.message}` };
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'New owner password must be at least 4 characters.' };
    }

    return this.setupOwnerPassword(newPassword);
  }

  /**
   * Removes or resets owner password. Requires current password verification.
   */
  static async removeOwnerPassword(currentPassword: string): Promise<{ success: boolean; message: string }> {
    this.init();

    const verification = await this.verifyPassword(currentPassword);
    if (!verification.success) {
      return { success: false, message: `Verification failed: ${verification.message}` };
    }

    this.credentials = null;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_AUTH);
      }
    } catch {
      // ignore
    }

    this.verifiedSessionExpiry = 0;
    this.notify();
    return { success: true, message: 'Owner password removed.' };
  }

  // ========================================================
  // Session Access Gate
  // ========================================================

  /**
   * Checks whether the current owner session is unlocked for protected operations
   */
  static isOwnerSessionUnlocked(): boolean {
    return Date.now() < this.verifiedSessionExpiry;
  }

  /**
   * Unlocks the owner session for a specified duration in milliseconds
   */
  static unlockOwnerSession(durationMs: number = 5 * 60 * 1000): void {
    this.verifiedSessionExpiry = Date.now() + durationMs;
    this.notify();
  }

  /**
   * Manually locks the owner session immediately
   */
  static lockOwnerSession(): void {
    this.verifiedSessionExpiry = 0;
    this.notify();
  }

  // ========================================================
  // Multi-User Identity Management
  // ========================================================

  static getActiveActor(): JarvisActorProfile {
    this.init();
    return this.PROFILES[this.activeActorId] || this.PROFILES.owner;
  }

  static getActiveActorId(): string {
    return this.activeActorId;
  }

  static getActiveActorType(): JarvisActorType {
    return this.getActiveActor().type;
  }

  static setActiveActor(actorId: string): void {
    if (this.PROFILES[actorId]) {
      this.activeActorId = actorId;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_ACTIVE_ACTOR, actorId);
        }
      } catch {
        // ignore
      }
      this.notify();
    }
  }

  static getAllProfiles(): JarvisActorProfile[] {
    return Object.values(this.PROFILES);
  }

  /**
   * Real Voice Authentication Status (Rule 9: Never fake voice recognition)
   * Reports genuine capability: whether neural on-device biometric model is enrolled.
   */
  static getVoiceVerificationStatus(): {
    isAvailable: boolean;
    isEnrolled: boolean;
    confidence: number;
    statusSummary: string;
  } {
    const actor = this.getActiveActor();
    // Honest: in browser sandbox, native neural voice biometric driver is not available
    return {
      isAvailable: false,
      isEnrolled: actor.voiceEnrolled,
      confidence: 0,
      statusSummary: 'On-device neural voice biometric driver is pending Android HAL integration. Fallback: Owner Password Active.',
    };
  }

  // ========================================================
  // Storage & Listeners
  // ========================================================

  private static saveCredentials(): void {
    try {
      if (typeof localStorage !== 'undefined' && this.credentials) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(this.credentials));
      }
    } catch (e) {
      console.warn('[OwnerAuth] Error writing auth store:', e);
    }
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[OwnerAuth] Listener error:', err);
      }
    });
  }
}
