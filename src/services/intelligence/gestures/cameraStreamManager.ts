/**
 * ONEVA Phase 21: Camera Stream Manager
 * 
 * Safely requests, streams, and releases camera hardware for Hand Control.
 * Guarantees zero background camera drain:
 * - Calling stop() immediately terminates all MediaStream tracks.
 * - Pauses automatically when tab is hidden or screen is off.
 * - Zero frames or video buffers are stored to disk or transmitted (Rule 6).
 */

import { CameraPermissionState } from '../../../types/jarvisHandControl';

export class CameraStreamManager {
  private static stream: MediaStream | null = null;
  private static videoElement: HTMLVideoElement | null = null;
  private static permissionState: CameraPermissionState = 'prompt';
  private static isStarting = false;
  private static isPausedForBackground = false;
  private static facingMode: 'user' | 'environment' = 'user';
  private static listeners: Set<(state: CameraPermissionState) => void> = new Set();
  private static visibilityListenerBound = false;

  // Mock camera stream capability for testing / non-webcam environments
  private static isSimulated = false;

  static init(): void {
    if (this.visibilityListenerBound) return;
    this.visibilityListenerBound = true;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.handleVisibilityChange(document.hidden);
      });
    }

    // Check if mediaDevices exists
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.permissionState = 'unsupported';
    }
  }

  static getPermissionState(): CameraPermissionState {
    return this.permissionState;
  }

  static isCameraStreaming(): boolean {
    if (this.isSimulated) return true;
    return !!(this.stream && this.stream.active && this.videoElement);
  }

  static getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  static async checkPermission(): Promise<CameraPermissionState> {
    this.init();
    if (this.isSimulated) {
      return this.permissionState;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.permissionState = 'unsupported';
      this.notify();
      return 'unsupported';
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        // Query camera permission if supported
        const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (status.state === 'granted') {
          this.permissionState = 'granted';
        } else if (status.state === 'denied') {
          this.permissionState = 'denied';
        } else {
          this.permissionState = 'prompt';
        }
        status.onchange = () => {
          this.permissionState = status.state as CameraPermissionState;
          this.notify();
        };
      }
    } catch {
      // permissions.query('camera') not universally supported in all browsers
    }

    this.notify();
    return this.permissionState;
  }

  static async requestPermission(): Promise<boolean> {
    this.init();
    if (this.isSimulated) {
      this.permissionState = 'granted';
      this.notify();
      return true;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.permissionState = 'unsupported';
      this.notify();
      return false;
    }

    try {
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.facingMode,
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
      });

      // Stop test stream immediately
      testStream.getTracks().forEach((track) => track.stop());
      this.permissionState = 'granted';
      this.notify();
      return true;
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.permissionState = 'denied';
      } else {
        this.permissionState = 'unsupported';
      }
      this.notify();
      return false;
    }
  }

  static async startStream(facing: 'user' | 'environment' = 'user'): Promise<{ success: boolean; message: string }> {
    this.init();
    this.facingMode = facing;

    if (this.isSimulated) {
      this.permissionState = 'granted';
      if (!this.videoElement && typeof document !== 'undefined') {
        this.videoElement = document.createElement('video');
      }
      return { success: true, message: 'Simulated camera stream started.' };
    }

    if (this.isCameraStreaming()) {
      return { success: true, message: 'Camera stream already active.' };
    }

    if (this.isStarting) {
      return { success: false, message: 'Camera is currently initializing.' };
    }

    this.isStarting = true;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 320, max: 640 },
          height: { ideal: 240, max: 480 },
          frameRate: { ideal: 15, max: 24 }, // Low framerate for energy efficiency & cool hardware
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = stream;
      this.permissionState = 'granted';

      if (!this.videoElement && typeof document !== 'undefined') {
        this.videoElement = document.createElement('video');
      }

      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        await this.videoElement.play().catch(() => {});
      }

      this.isStarting = false;
      this.notify();
      return { success: true, message: 'Camera stream active.' };
    } catch (err: unknown) {
      this.isStarting = false;
      const error = err as { name?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.permissionState = 'denied';
        this.notify();
        return { success: false, message: 'Camera permission denied. Please enable camera in settings.' };
      }
      this.permissionState = 'unsupported';
      this.notify();
      return { success: false, message: 'Camera hardware is unavailable or unsupported.' };
    }
  }

  static stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.stream = null;
    }

    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.videoElement.srcObject = null;
      } catch {
        // ignore
      }
      this.videoElement = null;
    }

    this.isStarting = false;
    this.isPausedForBackground = false;
    this.notify();
  }

  private static handleVisibilityChange(hidden: boolean): void {
    if (hidden) {
      // Tab backgrounded or screen turned off -> release camera
      if (this.stream) {
        this.isPausedForBackground = true;
        this.stopStream();
      }
    } else {
      // Tab restored -> restore stream if it was active
      if (this.isPausedForBackground) {
        this.isPausedForBackground = false;
        this.startStream(this.facingMode);
      }
    }
  }

  /**
   * For testing and headless environments
   */
  static setSimulatedMode(simulated: boolean, permission: CameraPermissionState = 'granted'): void {
    this.isSimulated = simulated;
    this.permissionState = permission;
    this.notify();
  }

  static subscribe(listener: (state: CameraPermissionState) => void): () => void {
    this.listeners.add(listener);
    listener(this.permissionState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => fn(this.permissionState));
  }
}
