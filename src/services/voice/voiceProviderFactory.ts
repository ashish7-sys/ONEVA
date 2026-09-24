/**
 * ONEVA Phase 10: Voice Provider Factory
 * Resolves the appropriate voice recognition provider based on the host environment
 * (Android Native Bridge vs Browser Web Speech API vs Unsupported fallback).
 */

import { VoiceRecognitionProvider } from '../../types/jarvisVoice';
import { AndroidNativeVoiceRecognitionProvider } from './androidNativeVoiceProvider';
import { BrowserVoiceRecognitionProvider } from './browserVoiceProvider';

export class UnavailableVoiceRecognitionProvider implements VoiceRecognitionProvider {
  readonly id = 'unavailable_voice';
  readonly name = 'Voice Engine Unavailable';

  isSupported(): boolean {
    return false;
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async checkPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
    return 'unsupported';
  }

  async requestPermission(): Promise<boolean> {
    return false;
  }

  async startListening(): Promise<void> {
    throw new Error('Voice recognition is not supported on this platform/browser.');
  }

  async stopListening(): Promise<void> {
    // No-op
  }

  onResult(): () => void {
    return () => {};
  }

  onError(callback: (error: { code: 'not_supported'; message: string }) => void): () => void {
    callback({
      code: 'not_supported',
      message: 'Speech recognition engine is unavailable on this device/environment.',
    });
    return () => {};
  }

  onStateChange(callback: (state: 'unavailable') => void): () => void {
    callback('unavailable');
    return () => {};
  }
}

export class VoiceProviderFactory {
  private static cachedProvider: VoiceRecognitionProvider | null = null;

  static getProvider(): VoiceRecognitionProvider {
    if (this.cachedProvider) {
      return this.cachedProvider;
    }

    // 1. Android Native Provider
    const androidNative = new AndroidNativeVoiceRecognitionProvider();
    if (androidNative.isSupported()) {
      this.cachedProvider = androidNative;
      return androidNative;
    }

    // 2. Browser Web Speech Provider
    const browserProvider = new BrowserVoiceRecognitionProvider();
    if (browserProvider.isSupported()) {
      this.cachedProvider = browserProvider;
      return browserProvider;
    }

    // 3. Fallback Unavailable Provider
    this.cachedProvider = new UnavailableVoiceRecognitionProvider();
    return this.cachedProvider;
  }

  /**
   * Clears cached provider (useful for testing or switching environments)
   */
  static resetProvider(): void {
    this.cachedProvider = null;
  }
}
