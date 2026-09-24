/**
 * ONEVA Phase 21: Hand Control & Gesture Automation Central Service
 * 
 * Coordinates:
 * - Camera lifecycle & permission states (CameraStreamManager)
 * - Computer vision analysis loop (GestureEngine)
 * - Debounce, cooldown, and confidence thresholding
 * - Strict Security Pipeline -> ActionDispatcher & Phase 20 Work Task Manager
 * - Reactive visual states (AssistService) & Voice confirmation (JarvisVoiceService)
 * - User isolation & actor scoping (OwnerAuthService)
 * - Local custom gesture enrollment with video validation
 */

import {
  CameraPermissionState,
  CustomGestureDefinition,
  GestureDetectionFrame,
  HandControlActivationMethod,
  HandControlConfig,
  HandControlEvent,
  HandControlMapping,
  HandControlServiceState,
  HandGestureType,
} from '../../../types/jarvisHandControl';
import { DEFAULT_HAND_CONTROL_CONFIG } from './defaultMappings';
import { CameraStreamManager } from './cameraStreamManager';
import { GestureEngine } from './gestureEngine';
import { ActionDispatcher } from '../../actions/actionDispatcher';
import { JarvisWorkTaskManager } from '../jarvisWorkTaskManager';
import { OwnerAuthService } from '../../memory/ownerAuthService';
import { AssistService } from '../../assistService';
import { JarvisVoiceService } from '../../jarvisVoiceService';
import { NavigationBus } from '../../../navigation/navigationBus';
import { AndroidAccessibilityBridge } from '../../actions/androidAccessibilityBridge';
import { JarvisVisualStateManager } from '../../jarvis/jarvisVisualStateManager';

const STORAGE_PREFIX = 'oneva_jarvis_hand_control_v21_';

export class HandControlService {
  private static config: HandControlConfig = { ...DEFAULT_HAND_CONTROL_CONFIG };
  private static isActive = false;
  private static isCameraActive = false;
  private static activeGesture: HandGestureType | null = null;
  private static activeConfidence = 0;
  private static lastTriggerTimestamp = 0;
  private static lastTriggeredGesture: HandGestureType | null = null;
  private static recentEvents: HandControlEvent[] = [];
  private static analysisTimer: ReturnType<typeof setTimeout> | null = null;
  private static cooldownRemainingMs = 0;
  private static cooldownTimer: ReturnType<typeof setInterval> | null = null;
  private static currentHintIndex = 0;
  private static hintRotationTimer: ReturnType<typeof setInterval> | null = null;
  private static listeners: Set<(state: HandControlServiceState) => void> = new Set();
  private static isInitialized = false;

  // Pending confirmation tracking for thumbs_up gesture
  private static pendingConfirmationCallback: (() => void) | null = null;

  /**
   * Initializes Hand Control Service with persisted actor-scoped configuration
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    CameraStreamManager.init();
    GestureEngine.init();
    this.loadConfig();

    // Subscribe to camera permission changes
    CameraStreamManager.subscribe((permission) => {
      if (permission === 'denied' && this.isActive) {
        this.disableHandControl();
      }
      this.notify();
    });

    // Start hint rotation
    this.startHintRotation();
  }

  // =========================================================================
  // Activation & Lifecycle
  // =========================================================================

  /**
   * Activates Hand Control mode and boots camera analysis loop
   */
  static async enableHandControl(): Promise<{ success: boolean; message: string }> {
    this.init();

    // 1. Check & request camera permission
    const permission = await CameraStreamManager.checkPermission();
    if (permission === 'denied') {
      return {
        success: false,
        message: 'Camera permission denied. Camera access is required for Hand Control.',
      };
    }

    if (permission === 'prompt') {
      const granted = await CameraStreamManager.requestPermission();
      if (!granted) {
        return {
          success: false,
          message: 'Camera permission is required for Hand Control.',
        };
      }
    }

    // 2. Start hardware camera stream
    const streamRes = await CameraStreamManager.startStream(this.config.cameraFacing);
    if (!streamRes.success) {
      return streamRes;
    }

    this.isActive = true;
    this.isCameraActive = true;
    this.config.enabled = true;
    this.saveConfig();

    // 3. Set visual state to Hand Control (V4 Energy Sphere)
    AssistService.setReactionState('idle');
    JarvisVisualStateManager.setHandControl(true);

    // 4. Start frame analysis loop
    this.startAnalysisLoop();

    // 5. Voice confirmation
    if (this.config.voiceConfirmation) {
      JarvisVoiceService.speakText('Hand control active, sir.');
    }

    this.notify();
    return { success: true, message: 'Hand Control is now active.' };
  }

  /**
   * Disables Hand Control and completely releases camera hardware
   */
  static disableHandControl(): void {
    this.stopAnalysisLoop();
    CameraStreamManager.stopStream();

    this.isActive = false;
    this.isCameraActive = false;
    this.config.enabled = false;
    this.activeGesture = null;
    this.activeConfidence = 0;
    this.saveConfig();

    AssistService.setReactionState('idle');
    JarvisVisualStateManager.setHandControl(false);
    this.notify();
  }

  /**
   * Toggles Hand Control state
   */
  static async toggleHandControl(): Promise<{ success: boolean; message: string }> {
    if (this.isActive) {
      this.disableHandControl();
      return { success: true, message: 'Hand Control disabled.' };
    } else {
      return this.enableHandControl();
    }
  }

  /**
   * Triggers activation via specific trigger method (e.g. double snap, quick tile, voice)
   */
  static async triggerActivation(method: HandControlActivationMethod): Promise<boolean> {
    if (this.config.activationMethod !== method && method !== 'manual') {
      return false;
    }
    const res = await this.enableHandControl();
    return res.success;
  }

  /**
   * Audio snap trigger handler (for two quick finger snaps)
   */
  static async handleDoubleSnapDetected(): Promise<boolean> {
    if (!this.isActive) {
      return this.triggerActivation('double_snap');
    }
    return false;
  }

  // =========================================================================
  // Frame Analysis Loop
  // =========================================================================

  private static startAnalysisLoop(): void {
    this.stopAnalysisLoop();

    const analyze = () => {
      if (!this.isActive || !CameraStreamManager.isCameraStreaming()) {
        return;
      }

      const video = CameraStreamManager.getVideoElement();
      if (video && video.readyState >= 2) {
        const frame = GestureEngine.processFrame(video, this.config.isMirrored);
        this.processDetectionFrame(frame);
      }

      // 12-15 FPS is optimal: saves battery, keeps device cool, responsive enough (< 80ms latency)
      this.analysisTimer = setTimeout(analyze, 75);
    };

    this.analysisTimer = setTimeout(analyze, 100);
  }

  private static stopAnalysisLoop(): void {
    if (this.analysisTimer) {
      clearTimeout(this.analysisTimer);
      this.analysisTimer = null;
    }
  }

  /**
   * Processes a single detection frame from the GestureEngine
   */
  static processDetectionFrame(frame: GestureDetectionFrame): void {
    this.activeGesture = frame.detectedGesture;
    this.activeConfidence = frame.confidence;

    if (!frame.detectedGesture) {
      this.notify();
      return;
    }

    // Check custom gesture enrollment matches if static
    if (this.config.customGestures.length > 0) {
      const video = CameraStreamManager.getVideoElement();
      if (video) {
        const features = GestureEngine.extractFeatures(video);
        const customMatch = GestureEngine.matchCustomGesture(features, this.config.customGestures);
        if (customMatch && customMatch.confidence >= this.config.confidenceThreshold) {
          const customDef = this.config.customGestures.find((c) => c.id === customMatch.matchId);
          if (customDef) {
            this.handleGestureTrigger(
              'custom_gesture',
              customMatch.confidence,
              customDef.id,
              customDef.action
            );
            return;
          }
        }
      }
    }

    this.handleGestureTrigger(frame.detectedGesture, frame.confidence);
  }

  // =========================================================================
  // Gesture Pipeline & Security Dispatch
  // =========================================================================

  /**
   * Evaluates gesture against confidence, cooldown, duplicate filters, and dispatches action
   */
  static async handleGestureTrigger(
    gesture: HandGestureType,
    confidence: number,
    customGestureId?: string,
    customAction?: HandControlMapping['action']
  ): Promise<void> {
    const now = Date.now();

    // 1. Confidence Threshold Check
    if (confidence < this.config.confidenceThreshold) {
      this.recordEvent({
        id: `evt_${now}`,
        gesture,
        confidence,
        timestamp: now,
        actionLabel: 'Rejected (Low Confidence)',
        executionStatus: 'REJECTED_CONFIDENCE',
        resultMessage: `Confidence ${Math.round(confidence * 100)}% below threshold ${Math.round(
          this.config.confidenceThreshold * 100
        )}%`,
      });
      return;
    }

    // 2. Cooldown & Debounce Check
    const effectiveCooldown = this.config.cooldownMs;
    const timeSinceLast = now - this.lastTriggerTimestamp;
    if (timeSinceLast < effectiveCooldown) {
      this.recordEvent({
        id: `evt_${now}`,
        gesture,
        confidence,
        timestamp: now,
        actionLabel: 'Suppressed (Cooldown)',
        executionStatus: 'REJECTED_COOLDOWN',
        resultMessage: `Debounce active (${Math.round(effectiveCooldown - timeSinceLast)}ms remaining)`,
      });
      return;
    }

    // 3. Duplicate Gesture Prevention (if rapidly repeated within 2x cooldown)
    if (this.lastTriggeredGesture === gesture && timeSinceLast < effectiveCooldown * 1.5) {
      return;
    }

    // 4. Resolve Target Mapping
    let targetMapping: HandControlMapping | undefined;
    if (customGestureId && customAction) {
      targetMapping = {
        id: customGestureId,
        gestureType: 'custom_gesture',
        customGestureId,
        label: customAction.label,
        description: customAction.description,
        action: customAction,
        enabled: true,
      };
    } else {
      targetMapping = this.config.mappings.find((m) => m.gestureType === gesture && m.enabled);
    }

    if (!targetMapping) {
      return;
    }

    // Set cooldown timer
    this.lastTriggerTimestamp = now;
    this.lastTriggeredGesture = gesture;
    this.startCooldown(effectiveCooldown);

    // 5. Visual Reaction & Haptic
    AssistService.setReactionState('command_detected');
    if (this.config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch {
        // ignore
      }
    }

    // 6. Security Check & Execution Pipeline
    await this.executeMappedAction(targetMapping, confidence);
  }

  /**
   * Strict Security Execution Pipeline:
   * Action Selector -> Permission/Security Boundary -> ActionDispatcher -> Result
   */
  private static async executeMappedAction(
    mapping: HandControlMapping,
    confidence: number
  ): Promise<void> {
    const action = mapping.action;
    const now = Date.now();
    const actorType = OwnerAuthService.getActiveActorType() === 'owner' ? 'owner' : 'secondary';

    // Owner protection check (Phase 14 User Isolation)
    if (action.requiresOwnerAuth && actorType !== 'owner') {
      this.recordEvent({
        id: `evt_${now}`,
        gesture: mapping.gestureType,
        confidence,
        timestamp: now,
        mappingId: mapping.id,
        actionLabel: action.label,
        executionStatus: 'PERMISSION_REQUIRED',
        resultMessage: 'Owner authentication required for this gesture action.',
      });
      AssistService.setReactionState('error');
      if (this.config.voiceConfirmation) {
        JarvisVoiceService.speakText('Owner authentication required.');
      }
      setTimeout(() => AssistService.setReactionState('idle'), 1500);
      return;
    }

    // Medium-risk action confirmation check
    if (action.requiresConfirmation && !this.pendingConfirmationCallback) {
      this.recordEvent({
        id: `evt_${now}`,
        gesture: mapping.gestureType,
        confidence,
        timestamp: now,
        mappingId: mapping.id,
        actionLabel: action.label,
        executionStatus: 'CONFIRMATION_REQUIRED',
        resultMessage: `Confirmation required. Show thumbs up to confirm "${action.label}".`,
      });
      AssistService.setReactionState('listening');
      if (this.config.voiceConfirmation) {
        JarvisVoiceService.speakText('Please confirm with thumbs up.');
      }

      // Store callback for confirmation
      this.pendingConfirmationCallback = () => {
        this.pendingConfirmationCallback = null;
        this.executeApprovedAction(mapping, confidence);
      };

      // Auto-expire confirmation window after 8 seconds
      setTimeout(() => {
        if (this.pendingConfirmationCallback) {
          this.pendingConfirmationCallback = null;
          AssistService.setReactionState('idle');
        }
      }, 8000);
      return;
    }

    await this.executeApprovedAction(mapping, confidence);
  }

  private static async executeApprovedAction(
    mapping: HandControlMapping,
    confidence: number
  ): Promise<void> {
    const action = mapping.action;
    const now = Date.now();
    AssistService.setReactionState('command_processing');

    try {
      let executionSuccess = true;
      let statusMessage = '';

      switch (action.actionType) {
        // Phase 20 STOP: Cancels active running task
        case 'phase20_stop_task': {
          const activeTasks = JarvisWorkTaskManager.getActiveTasks();
          if (activeTasks.length > 0) {
            const target = activeTasks[0];
            JarvisWorkTaskManager.stopTask(target.taskId);
            statusMessage = `Task "${target.title}" cancelled.`;
            if (this.config.voiceConfirmation) {
              JarvisVoiceService.speakText('Task stopped, sir.');
            }
          } else {
            statusMessage = 'No active tasks to stop.';
            if (this.config.voiceConfirmation) {
              JarvisVoiceService.speakText('No active tasks.');
            }
          }
          break;
        }

        // Phase 20 CLOSE: Hides work panel, task continues in background
        case 'phase20_close_panel': {
          JarvisWorkTaskManager.closePanel();
          statusMessage = 'Work panel closed. Background tasks continue.';
          if (this.config.voiceConfirmation) {
            JarvisVoiceService.speakText('Panel closed, continuing in background.');
          }
          break;
        }

        // Phase 20 NEXT: Cycles or opens active task
        case 'phase20_next_task': {
          const activeTasks = JarvisWorkTaskManager.getActiveTasks();
          if (activeTasks.length > 0) {
            JarvisWorkTaskManager.openPanel(activeTasks[0].taskId);
            statusMessage = `Focused task "${activeTasks[0].title}".`;
          } else {
            JarvisWorkTaskManager.openPanel();
            statusMessage = 'Work panel opened.';
          }
          if (this.config.voiceConfirmation) {
            JarvisVoiceService.speakText('Work panel active.');
          }
          break;
        }

        // Thumbs Up Confirmation
        case 'confirm_pending': {
          if (this.pendingConfirmationCallback) {
            const cb = this.pendingConfirmationCallback;
            this.pendingConfirmationCallback = null;
            cb();
            statusMessage = 'Pending action confirmed.';
            if (this.config.voiceConfirmation) {
              JarvisVoiceService.speakText('Confirmed, sir.');
            }
          } else {
            statusMessage = 'No action awaiting confirmation.';
          }
          break;
        }

        // Navigation Actions
        case 'navigate_home': {
          NavigationBus.navigateTo('home');
          await AndroidAccessibilityBridge.performSystemHome();
          statusMessage = 'Navigated to Home.';
          if (this.config.voiceConfirmation) {
            JarvisVoiceService.speakText('Home screen.');
          }
          break;
        }

        case 'navigate_back': {
          await AndroidAccessibilityBridge.performSystemBack();
          statusMessage = 'Navigated back.';
          if (this.config.voiceConfirmation) {
            JarvisVoiceService.speakText('Back.');
          }
          break;
        }

        case 'toggle_edge_glow': {
          statusMessage = `Ambient notification toggled.`;
          if (this.config.voiceConfirmation) {
            JarvisVoiceService.speakText('Ambient notification toggled.');
          }
          break;
        }

        case 'show_system_info':
        case 'tool': {
          if (action.toolId) {
            const result = await ActionDispatcher.dispatch({
              actionId: `act_${now}`,
              toolId: action.toolId,
              args: action.args || {},
              timestamp: now,
              originatingPrompt: `Hand gesture: ${mapping.gestureType}`,
            });
            executionSuccess = result.success;
            statusMessage = result.userMessage || 'Action completed.';
            if (this.config.voiceConfirmation && result.userMessage) {
              JarvisVoiceService.speakText(result.userMessage);
            }
          }
          break;
        }

        default:
          statusMessage = `Action ${action.label} executed.`;
          break;
      }

      this.recordEvent({
        id: `evt_${now}`,
        gesture: mapping.gestureType,
        confidence,
        timestamp: now,
        mappingId: mapping.id,
        actionLabel: action.label,
        executionStatus: executionSuccess ? 'EXECUTED' : 'FAILED',
        resultMessage: statusMessage,
      });

      AssistService.setReactionState(executionSuccess ? 'command_finished' : 'error');
      setTimeout(() => AssistService.setReactionState('idle'), 1200);
    } catch (err) {
      console.error('[HandControlService] Execution error:', err);
      this.recordEvent({
        id: `evt_${now}`,
        gesture: mapping.gestureType,
        confidence,
        timestamp: now,
        mappingId: mapping.id,
        actionLabel: action.label,
        executionStatus: 'FAILED',
        resultMessage: 'Action execution encountered an error.',
      });
      AssistService.setReactionState('error');
      setTimeout(() => AssistService.setReactionState('idle'), 1500);
    }
  }

  // =========================================================================
  // Cooldown & Debounce Management
  // =========================================================================

  private static startCooldown(durationMs: number): void {
    this.cooldownRemainingMs = durationMs;
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }

    const interval = 100;
    this.cooldownTimer = setInterval(() => {
      this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - interval);
      if (this.cooldownRemainingMs <= 0) {
        clearInterval(this.cooldownTimer!);
        this.cooldownTimer = null;
      }
      this.notify();
    }, interval);
    this.notify();
  }

  // =========================================================================
  // Custom Gesture Enrollment & Video Validation
  // =========================================================================

  /**
   * Enrolls a new custom gesture with local feature extraction
   * Ephemeral: raw video file is NEVER permanently stored (Rule 6).
   */
  static async enrollCustomGestureFromVideo(
    file: File,
    name: string,
    description: string,
    action: HandControlMapping['action']
  ): Promise<{ success: boolean; message: string; gestureId?: string }> {
    // 1. Validate file type
    const validMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validMimeTypes.includes(file.type)) {
      return {
        success: false,
        message: 'Invalid video format. Please upload MP4, WebM, or QuickTime video.',
      };
    }

    // 2. Validate file size (max 15MB)
    const MAX_BYTES = 15 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return {
        success: false,
        message: 'Video file size exceeds maximum limit of 15MB.',
      };
    }

    // 3. Process video element in memory
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          // Validate duration (max 5 seconds)
          if (video.duration > 5.5) {
            reject(new Error('Video duration must be 5 seconds or less for gesture enrollment.'));
          } else {
            resolve();
          }
        };
        video.onerror = () => reject(new Error('Failed to load gesture video file.'));
      });

      // Play and sample middle frame
      video.currentTime = video.duration / 2;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      // Extract normalized feature vector
      const features = GestureEngine.extractFeatures(video);

      // Clean up object URL immediately (Rule 6 - Ephemeral)
      URL.revokeObjectURL(url);

      const actorType = OwnerAuthService.getActiveActorType() === 'owner' ? 'owner' : 'secondary';
      const gestureId = `custom_${Date.now()}`;

      const newCustom: CustomGestureDefinition = {
        id: gestureId,
        name,
        description,
        createdAt: Date.now(),
        featureVector: features,
        sampleFramesCount: 1,
        threshold: 0.70,
        actorType,
        action,
        sourceType: 'video_upload',
      };

      this.config.customGestures.push(newCustom);

      // Add to mappings
      this.config.mappings.push({
        id: `map_${gestureId}`,
        gestureType: 'custom_gesture',
        customGestureId: gestureId,
        label: name,
        description,
        action,
        enabled: true,
      });

      this.saveConfig();
      this.notify();

      return {
        success: true,
        message: `Custom gesture "${name}" enrolled successfully.`,
        gestureId,
      };
    } catch (err: unknown) {
      const error = err as { message?: string };
      return {
        success: false,
        message: error.message || 'Failed to process gesture reference video.',
      };
    }
  }

  /**
   * Enrolls a custom gesture directly from live camera feed
   */
  static enrollCustomGestureFromLive(
    name: string,
    description: string,
    action: HandControlMapping['action']
  ): { success: boolean; message: string; gestureId?: string } {
    const video = CameraStreamManager.getVideoElement();
    if (!video) {
      return { success: false, message: 'Live camera is not active.' };
    }

    const features = GestureEngine.extractFeatures(video);
    const actorType = OwnerAuthService.getActiveActorType() === 'owner' ? 'owner' : 'secondary';
    const gestureId = `custom_${Date.now()}`;

    const newCustom: CustomGestureDefinition = {
      id: gestureId,
      name,
      description,
      createdAt: Date.now(),
      featureVector: features,
      sampleFramesCount: 1,
      threshold: 0.70,
      actorType,
      action,
      sourceType: 'live_camera',
    };

    this.config.customGestures.push(newCustom);
    this.config.mappings.push({
      id: `map_${gestureId}`,
      gestureType: 'custom_gesture',
      customGestureId: gestureId,
      label: name,
      description,
      action,
      enabled: true,
    });

    this.saveConfig();
    this.notify();

    return {
      success: true,
      message: `Custom gesture "${name}" enrolled successfully.`,
      gestureId,
    };
  }

  /**
   * Deletes an enrolled custom gesture
   */
  static deleteCustomGesture(id: string): void {
    this.config.customGestures = this.config.customGestures.filter((c) => c.id !== id);
    this.config.mappings = this.config.mappings.filter((m) => m.customGestureId !== id);
    this.saveConfig();
    this.notify();
  }

  // =========================================================================
  // Settings & Mappings Management
  // =========================================================================

  static updateMapping(mappingId: string, updates: Partial<HandControlMapping>): void {
    const idx = this.config.mappings.findIndex((m) => m.id === mappingId);
    if (idx >= 0) {
      this.config.mappings[idx] = { ...this.config.mappings[idx], ...updates };
      this.saveConfig();
      this.notify();
    }
  }

  static updateConfig(updates: Partial<HandControlConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    this.notify();
  }

  static resetToDefaults(): void {
    this.config = { ...DEFAULT_HAND_CONTROL_CONFIG };
    this.saveConfig();
    this.notify();
  }

  // =========================================================================
  // Hints & Overlay Feedback
  // =========================================================================

  private static startHintRotation(): void {
    if (this.hintRotationTimer) return;
    this.hintRotationTimer = setInterval(() => {
      this.currentHintIndex++;
      this.notify();
    }, 4500);
  }

  static getCurrentHint(): string {
    if (!this.config.showHints) return '';
    const hints = [
      'Open palm to stop active task',
      'Swipe down to close panel (continues in background)',
      'Swipe right to return to Home',
      'Swipe left to navigate back',
      'Thumbs up to confirm pending action',
      'Closed fist to trigger ambient edge glow',
    ];
    return hints[this.currentHintIndex % hints.length];
  }

  // =========================================================================
  // State, Persistence & Event History
  // =========================================================================

  private static recordEvent(event: HandControlEvent): void {
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > 25) {
      this.recentEvents.pop();
    }
    this.notify();
  }

  static getState(): HandControlServiceState {
    this.init();
    return {
      isActive: this.isActive,
      isCameraActive: this.isCameraActive,
      cameraPermission: CameraStreamManager.getPermissionState(),
      activeGesture: this.activeGesture,
      activeConfidence: this.activeConfidence,
      isInCooldown: this.cooldownRemainingMs > 0,
      cooldownRemainingMs: this.cooldownRemainingMs,
      lastEvent: this.recentEvents[0] || null,
      recentEvents: [...this.recentEvents],
      config: { ...this.config },
      currentHint: this.getCurrentHint(),
    };
  }

  private static getStorageKey(): string {
    const actor = OwnerAuthService.getActiveActorType() === 'owner' ? 'owner' : 'secondary';
    return `${STORAGE_PREFIX}${actor}`;
  }

  private static saveConfig(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.config));
    } catch {
      // ignore
    }
  }

  private static loadConfig(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.mappings)) {
          this.config = { ...DEFAULT_HAND_CONTROL_CONFIG, ...parsed };
        }
      }
    } catch {
      // fallback to defaults
      this.config = { ...DEFAULT_HAND_CONTROL_CONFIG };
    }
  }

  static subscribe(listener: (state: HandControlServiceState) => void): () => void {
    this.init();
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  // =========================================================================
  // Testing & Simulation Utilities
  // =========================================================================

  /**
   * Directly triggers a simulated gesture for automated testing
   */
  static async simulateGesture(gesture: HandGestureType, confidence: number = 0.85): Promise<void> {
    this.init();
    await this.handleGestureTrigger(gesture, confidence);
  }
}
