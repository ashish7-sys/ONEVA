export interface UserProfile {
  name: string;
  isFirstLaunch: boolean;
  onboardedAt?: string;
}

const STORAGE_KEY = 'oneva_user_profile_v1';

export class UserProfileService {
  private static profile: UserProfile = this.loadProfile();
  private static listeners: Set<() => void> = new Set();

  private static loadProfile(): UserProfile {
    if (typeof window === 'undefined') {
      return { name: '', isFirstLaunch: true };
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === 'string') {
          return {
            name: parsed.name.trim(),
            isFirstLaunch: Boolean(parsed.isFirstLaunch ?? false),
            onboardedAt: parsed.onboardedAt,
          };
        }
      }
    } catch (err) {
      console.warn('[UserProfileService] Failed to load user profile:', err);
    }

    return { name: '', isFirstLaunch: true };
  }

  static getProfile(): UserProfile {
    return this.profile;
  }

  static getUserName(): string {
    return this.profile.name || 'User';
  }

  static hasCustomName(): boolean {
    return Boolean(this.profile.name && this.profile.name.trim().length > 0);
  }

  static isFirstLaunch(): boolean {
    return this.profile.isFirstLaunch && !this.hasCustomName();
  }

  static setUserName(name: string): void {
    const clean = name.trim();
    this.profile = {
      name: clean,
      isFirstLaunch: false,
      onboardedAt: this.profile.onboardedAt || new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      } catch (err) {
        console.warn('[UserProfileService] Failed to save user profile:', err);
      }
    }

    this.notify();
  }

  static skipOnboarding(): void {
    this.profile = {
      name: this.profile.name || 'User',
      isFirstLaunch: false,
      onboardedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      } catch (err) {
        console.warn('[UserProfileService] Failed to skip onboarding:', err);
      }
    }

    this.notify();
  }

  static subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private static notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
