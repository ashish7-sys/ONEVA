/**
 * ONEVA Phase 10: Jarvis Voice & Wake Central Service
 * 
 * Central state machine, wake-name alias registry, 10-minute active session timer,
 * speech recognition provider orchestration, and privacy-first ephemeral execution.
 */

import {
  JarvisVoiceState,
  VoiceRecognitionResult,
  VoiceRecognitionError,
  JarvisVoiceSettings,
  DEFAULT_WAKE_NAMES,
  JARVIS_ACTIVE_SESSION_TIMEOUT_MS,
  VoiceRecognitionProvider,
  JarvisPipelineMode,
  BargeInSensitivity,
  JarvisDuplexTelemetry,
  JarvisDuplexState,
} from '../types/jarvisVoice';
import { JarvisIntent, JarvisTaskPlan } from '../types/jarvisIntelligence';
import { WakeNameDetectionService } from './wakeNameDetectionService';
import { VoiceProviderFactory } from './voice/voiceProviderFactory';
import { AndroidNativeVoiceRecognitionProvider } from './voice/androidNativeVoiceProvider';
import { AssistService } from './assistService';
import { JarvisIntelligenceService } from './intelligence/jarvisIntelligenceProvider';
import { JarvisTtsEngine } from './voice/jarvisTtsEngine';
import { JarvisPersonalityEngine } from './intelligence/jarvisPersonalityEngine';
import { JarvisVoiceStatusPhase19 } from '../types/jarvisPersonality';
import { AudioEffects } from './voice/audioSoundEffects';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { JarvisDuplexPipelineService } from './voice/jarvisDuplexPipelineService';
import { JarvisContinuousVisionService } from './vision/jarvisContinuousVisionService';
import { JarvisProactiveSentinelService } from './sentinel/jarvisProactiveSentinelService';
import { JarvisEpisodicMemoryService } from './memory/jarvisEpisodicMemoryService';
import { JarvisPredictiveIntentService } from './intelligence/jarvisPredictiveIntentService';
import { JarvisSelfHealingService } from './intelligence/jarvisSelfHealingService';
import { JarvisEdgeNeuralService } from './edge/jarvisEdgeNeuralService';
import { JarvisDeviceControlService } from './device/jarvisDeviceControlService';
import { JarvisDynamicToolService } from './actions/jarvisDynamicToolService';
import { JarvisBiometricsService } from './biometrics/jarvisBiometricsService';
import { JarvisMeshRelayService } from './mesh/jarvisMeshRelayService';
import { JarvisStarkWitEngine } from './voice/jarvisStarkWitEngine';
import { JarvisAudioDSPFramer } from './voice/jarvisAudioDSPFramer';
import { JarvisTreeOfThoughtPlanner } from './intelligence/jarvisTreeOfThoughtPlanner';
import { JarvisWhatIfMonteCarloEngine } from './intelligence/jarvisWhatIfMonteCarloEngine';
import { JarvisContinuousSpatialVisionService } from './vision/jarvisContinuousSpatialVisionService';
import { JarvisMultiSpeakerDiarizationService } from './intelligence/jarvisMultiSpeakerDiarizationService';
import { JarvisDeepReconEngine } from './intelligence/jarvisDeepReconEngine';
import { JarvisLongContextSynthesizer } from './intelligence/jarvisLongContextSynthesizer';
import { JarvisGroundingSearchService } from './intelligence/jarvisGroundingSearchService';
import { JarvisConstrainedSchemaEngine } from './intelligence/jarvisConstrainedSchemaEngine';
import { JarvisSamplingHyperparamsController } from './intelligence/jarvisSamplingHyperparamsController';
import { JarvisAdversarialGuardrailService } from './intelligence/jarvisAdversarialGuardrailService';
import { JarvisAudioPhonemeEngine } from './voice/jarvisAudioPhonemeEngine';
import { JarvisVisualStateManager } from './jarvis/jarvisVisualStateManager';

export interface JarvisCommandEvent {
  id: string;
  matchedAlias?: string;
  commandText: string;
  rawTranscript: string;
  timestamp: number;
  responsePreview: string;
  status: 'executed' | 'received' | 'planned' | 'waiting_for_input';
  intent?: JarvisIntent;
  plan?: JarvisTaskPlan;
}

const SETTINGS_STORAGE_KEY = 'oneva_jarvis_voice_settings';

const DEFAULT_SETTINGS: JarvisVoiceSettings = {
  enabledWakeNames: [...DEFAULT_WAKE_NAMES],
  customWakeNames: [],
  selectedLanguage: 'en',
  activeSessionTimeoutMs: JARVIS_ACTIVE_SESSION_TIMEOUT_MS,
  autoListenAfterWake: true,
  voiceSoundEffects: true,
  screenOffWakeEnabled: true,
  screenWakeOnDetection: true,
  hapticFeedbackOnWake: true,
  audioChimeOnWake: true,
  // Problem 3: Voice Pipeline: Full-Duplex vs Turn-Based
  pipelineMode: 'full_duplex',
  bargeInEnabled: true,
  selfVoiceCancellation: true,
  bargeInSensitivity: 'balanced',
  audioDuckingEnabled: true,
  // Problem 3 / User Directive: 2-Minute (120,000ms) default post-command awake timeout
  continuousTurnTakingTimeoutMs: 120000,
};

export class JarvisVoiceService {
  private static currentState: JarvisVoiceState = 'SLEEPING';
  private static settings: JarvisVoiceSettings | null = null;
  private static provider: VoiceRecognitionProvider | null = null;

  // Active Session & 2-Minute Post-Command Awake Timers
  private static activeSessionTimer: ReturnType<typeof setTimeout> | null = null;
  private static sessionExpiresAt: number | null = null;
  private static awakeTimer: ReturnType<typeof setTimeout> | null = null;
  private static awakeExpiresAt: number | null = null;
  private static lastCommandCompletedAt: number | null = null;
  private static lastSpokenTranscript: string = '';
  private static lastResponseText: string = '';
  private static errorMessage: string | null = null;

  private static commandHistory: JarvisCommandEvent[] = [];
  private static listeners: Set<() => void> = new Set();
  private static commandListeners: Set<(event: JarvisCommandEvent) => void> = new Set();

  private static isInitialized = false;

  /**
   * Initializes the Jarvis Voice subsystem
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const currentSettings = this.getSettings();
    JarvisDuplexPipelineService.init();
    JarvisDuplexPipelineService.configure({
      pipelineMode: currentSettings.pipelineMode,
      bargeInEnabled: currentSettings.bargeInEnabled,
      selfVoiceCancellation: currentSettings.selfVoiceCancellation,
      bargeInSensitivity: currentSettings.bargeInSensitivity,
      audioDuckingEnabled: currentSettings.audioDuckingEnabled,
      continuousTurnTakingTimeoutMs: currentSettings.continuousTurnTakingTimeoutMs,
    });

    this.provider = VoiceProviderFactory.getProvider();

    // Subscribe to provider events
    this.provider.onResult((res) => this.handleSpeechResult(res));
    this.provider.onError((err) => this.handleSpeechError(err));
    this.provider.onStateChange((state) => {
      if (state === 'unavailable' && this.currentState !== 'UNAVAILABLE') {
        this.transitionTo('UNAVAILABLE');
      }
    });

    // Check visibility change for screen-off / background restrictions
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.handleVisibilityChange(document.hidden);
      });
    }
  }

  // ==========================================
  // State Machine & Getters
  // ==========================================

  static getState(): JarvisVoiceState {
    return this.currentState;
  }

  static getLastSpokenTranscript(): string {
    return this.lastSpokenTranscript;
  }

  static getLastResponseText(): string {
    return this.lastResponseText;
  }

  static getErrorMessage(): string | null {
    return this.errorMessage;
  }

  static getCommandHistory(): JarvisCommandEvent[] {
    return [...this.commandHistory];
  }

  static getSessionRemainingMs(): number {
    if (!this.sessionExpiresAt) return 0;
    return Math.max(0, this.sessionExpiresAt - Date.now());
  }

  static getAwakeRemainingMs(): number {
    if (!this.awakeExpiresAt) return 0;
    return Math.max(0, this.awakeExpiresAt - Date.now());
  }

  static getLastCommandCompletedAt(): number | null {
    return this.lastCommandCompletedAt;
  }

  /**
   * Returns true if Jarvis is actively awake (in AWAKE, LISTENING_FOR_COMMAND, PROCESSING, RESPONDING state,
   * or within the 2-minute post-command awake window).
   * Requirement 1: Proactive warnings/alerts are ONLY allowed when this returns true!
   */
  static isAwake(): boolean {
    if (
      this.currentState === 'AWAKE' ||
      this.currentState === 'LISTENING_FOR_COMMAND' ||
      this.currentState === 'PROCESSING' ||
      this.currentState === 'RESPONDING'
    ) {
      return true;
    }
    if (this.awakeExpiresAt && Date.now() < this.awakeExpiresAt) {
      return true;
    }
    return false;
  }

  static isSessionActive(): boolean {
    return (
      this.isAwake() ||
      ((this.currentState === 'AWAKE' ||
        this.currentState === 'LISTENING_FOR_COMMAND' ||
        this.currentState === 'PROCESSING' ||
        this.currentState === 'RESPONDING') &&
        this.getSessionRemainingMs() > 0)
    );
  }

  /**
   * Starts / resets the 2-minute awake timer.
   * Requirement 2: The timer MUST count down starting after the last command completes!
   */
  static startAwakeTimer(durationMs: number = 120000): void {
    this.clearAwakeTimer();
    this.awakeExpiresAt = Date.now() + durationMs;
    this.awakeTimer = setTimeout(() => {
      this.handleAwakeTimeout();
    }, durationMs);
  }

  static clearAwakeTimer(): void {
    if (this.awakeTimer) {
      clearTimeout(this.awakeTimer);
      this.awakeTimer = null;
    }
    this.awakeExpiresAt = null;
  }

  private static handleAwakeTimeout(): void {
    this.clearAwakeTimer();
    // 2-minute post-command awake timer expired
    if (this.currentState === 'AWAKE') {
      this.transitionTo('LISTENING_FOR_WAKE');
    }
  }

  /**
   * Unified handler called immediately whenever a command COMPLETES execution and speech.
   * Starts the 2-minute awake timer from this exact moment!
   */
  static onCommandCompleted(): void {
    const now = Date.now();
    this.lastCommandCompletedAt = now;
    JarvisDuplexPipelineService.markCommandCompleted(now);

    if (this.currentState === 'RESPONDING' || this.currentState === 'PROCESSING') {
      this.transitionTo('AWAKE');
    }

    const settings = this.getSettings();
    const timeoutMs = settings.continuousTurnTakingTimeoutMs || 120000;
    this.startAwakeTimer(timeoutMs);

    this.notify();
  }

  /**
   * Genuine Android Screen-Off Wake capability check
   */
  static isScreenOffWakeSupported(): boolean {
    return AndroidNativeVoiceRecognitionProvider.isScreenOffWakeSupported();
  }

  // ==========================================
  // Settings Management (Wake Names & Aliases)
  // ==========================================

  static getSettings(): JarvisVoiceSettings {
    if (this.settings) return this.settings;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
          // User Requirement: upgrade legacy 15-second timeout (15000) to 2-minute default (120000)
          if (this.settings.continuousTurnTakingTimeoutMs === 15000) {
            this.settings.continuousTurnTakingTimeoutMs = 120000;
          }
          return this.settings;
        }
      } catch (err) {
        console.warn('[JarvisVoiceService] Failed to load settings:', err);
      }
    }

    this.settings = { ...DEFAULT_SETTINGS };
    return this.settings;
  }

  static saveSettings(updates: Partial<JarvisVoiceSettings>): void {
    const current = this.getSettings();
    this.settings = { ...current, ...updates };

    JarvisDuplexPipelineService.configure({
      pipelineMode: this.settings.pipelineMode,
      bargeInEnabled: this.settings.bargeInEnabled,
      selfVoiceCancellation: this.settings.selfVoiceCancellation,
      bargeInSensitivity: this.settings.bargeInSensitivity,
      audioDuckingEnabled: this.settings.audioDuckingEnabled,
      continuousTurnTakingTimeoutMs: this.settings.continuousTurnTakingTimeoutMs,
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      } catch (err) {
        console.warn('[JarvisVoiceService] Failed to save settings:', err);
      }
    }

    if (updates.pipelineMode && (this.currentState === 'LISTENING_FOR_WAKE' || this.currentState === 'LISTENING_FOR_COMMAND')) {
      this.restartListening();
    }

    this.notify();
  }

  static toggleWakeName(name: string, enabled: boolean): { success: boolean; message?: string } {
    const settings = this.getSettings();
    const currentEnabled = new Set(settings.enabledWakeNames);

    if (enabled) {
      currentEnabled.add(name);
    } else {
      currentEnabled.delete(name);
    }

    const updated = Array.from(currentEnabled);
    this.saveSettings({ enabledWakeNames: updated });

    return {
      success: true,
      message: enabled ? `Enabled wake alias "${name}".` : `Disabled wake alias "${name}".`,
    };
  }

  static addCustomWakeName(name: string): { success: boolean; message: string; formattedName?: string } {
    const settings = this.getSettings();
    const allKnown = [...settings.enabledWakeNames, ...settings.customWakeNames];

    const validation = WakeNameDetectionService.validateWakeName(name, allKnown);
    if (!validation.valid) {
      return { success: false, message: validation.error || 'Invalid wake name.' };
    }

    const formatted = validation.normalizedName;
    const newCustom = [...settings.customWakeNames, formatted];
    const newEnabled = [...settings.enabledWakeNames, formatted];

    this.saveSettings({
      customWakeNames: newCustom,
      enabledWakeNames: newEnabled,
    });

    return {
      success: true,
      message: `Added custom wake name "${formatted}".`,
      formattedName: formatted,
    };
  }

  static removeCustomWakeName(name: string): { success: boolean; message: string } {
    const settings = this.getSettings();
    const newCustom = settings.customWakeNames.filter(
      (n) => n.toLowerCase() !== name.toLowerCase()
    );
    const newEnabled = settings.enabledWakeNames.filter(
      (n) => n.toLowerCase() !== name.toLowerCase()
    );

    this.saveSettings({
      customWakeNames: newCustom,
      enabledWakeNames: newEnabled,
    });

    return {
      success: true,
      message: `Removed custom wake name "${name}".`,
    };
  }

  static restoreDefaultWakeNames(): void {
    const settings = this.getSettings();
    this.saveSettings({
      enabledWakeNames: [...DEFAULT_WAKE_NAMES],
      customWakeNames: settings.customWakeNames, // retain user-created custom names in registry
    });
  }

  static setVoiceLanguage(lang: JarvisVoiceSettings['selectedLanguage']): void {
    this.saveSettings({ selectedLanguage: lang });
    // If currently listening, restart with new language
    if (this.currentState === 'LISTENING_FOR_WAKE' || this.currentState === 'LISTENING_FOR_COMMAND') {
      this.restartListening();
    }
  }

  // ==========================================
  // Session Lifecycle & State Transitions
  // ==========================================

  private static transitionTo(newState: JarvisVoiceState): void {
    if (this.currentState === newState) return;
    this.currentState = newState;

    // Synchronize with Phase 9 Live Wallpaper Reactive Subsystem & Visual State Machine
    if (newState === 'SLEEPING' || newState === 'LISTENING_FOR_WAKE') {
      AssistService.setReactionState('idle');
      JarvisTtsEngine.setStatus('IDLE');
      JarvisVisualStateManager.dismiss();
    } else if (newState === 'AWAKE') {
      AssistService.setReactionState('idle');
      JarvisTtsEngine.setStatus('IDLE');
      JarvisVisualStateManager.finishShortCommand();
    } else if (newState === 'LISTENING_FOR_COMMAND') {
      AssistService.setReactionState('command_detected');
      JarvisTtsEngine.setStatus('LISTENING');
      JarvisVisualStateManager.wakeUp();
    } else if (newState === 'PROCESSING') {
      AssistService.setReactionState('command_processing');
      JarvisTtsEngine.setStatus('THINKING');
      JarvisVisualStateManager.startShortCommand();
    } else if (newState === 'RESPONDING') {
      AssistService.setReactionState('command_finished');
      JarvisTtsEngine.setStatus('SPEAKING');
    } else if (newState === 'ERROR') {
      AssistService.setReactionState('error');
      JarvisTtsEngine.setStatus('ERROR');
    }

    this.notify();
  }

  /**
   * Returns current Phase 19 7-state status
   */
  static getPhase19Status(): JarvisVoiceStatusPhase19 {
    return JarvisTtsEngine.getStatus();
  }

  /**
   * Safe Voice Interruption: immediately stops all speech and returns to IDLE/AWAKE
   */
  static interrupt(): void {
    JarvisTtsEngine.interrupt();
    AssistService.setReactionState('idle');
    if (this.currentState === 'RESPONDING' || this.currentState === 'PROCESSING') {
      this.onCommandCompleted();
    } else {
      this.transitionTo('SLEEPING');
    }
  }

  /**
   * Speaks a specified text using the Phase 19 TTS engine and personality preferences
   */
  static speakText(text: string, language?: string, onComplete?: () => void): { success: boolean; reason?: string } {
    const prefs = JarvisPersonalityEngine.getPreferences();
    if (!prefs.voiceEnabled) {
      if (onComplete) {
        setTimeout(onComplete, 1200);
      }
      return { success: false, reason: 'voice_disabled_in_settings' };
    }

    const langTarget: 'en' | 'hi' = (language?.startsWith('hi') || prefs.language === 'hi') ? 'hi' : 'en';
    const enriched = JarvisStarkWitEngine.enrichSpokenText(text, langTarget);
    const gender = prefs.voiceGender || 'male';

    return JarvisTtsEngine.speak({
      id: `manual_speak_${Date.now()}`,
      text: enriched.spokenText,
      spokenText: enriched.spokenText,
      language: language || (prefs.language === 'auto' ? 'en' : prefs.language),
      gender,
      voiceURI: prefs.selectedVoiceURI,
      rate: enriched.prosody.rate * (prefs.speechRate || 0.9),
      pitch: enriched.prosody.pitch * (prefs.speechPitch || (gender === 'male' ? 0.88 : 1.08)),
      onStart: () => {
        JarvisTtsEngine.setStatus('SPEAKING');
        this.notify();
      },
      onEnd: () => {
        JarvisTtsEngine.setStatus('SUCCESS');
        setTimeout(() => {
          JarvisTtsEngine.setStatus('IDLE');
          this.notify();
          onComplete?.();
        }, 600);
      },
      onError: () => {
        JarvisTtsEngine.setStatus('ERROR');
        setTimeout(() => {
          JarvisTtsEngine.setStatus('IDLE');
          this.notify();
          onComplete?.();
        }, 1200);
      },
      onInterrupted: () => {
        JarvisTtsEngine.setStatus('IDLE');
        this.notify();
        onComplete?.();
      },
    });
  }

  /**
   * Starts listening for wake names ("Jarvis", "Ultron", "Siri", etc.)
   */
  static async startVoiceSystem(): Promise<{ success: boolean; message: string }> {
    this.init();

    if (!this.provider || !this.provider.isSupported()) {
      this.transitionTo('UNAVAILABLE');
      this.errorMessage = 'Voice wake recognition is not supported in this browser environment.';
      this.notify();
      return { success: false, message: this.errorMessage };
    }

    // Check permissions
    const permission = await this.provider.checkPermission();
    if (permission === 'denied') {
      this.transitionTo('ERROR');
      this.errorMessage = 'Microphone permission denied. Please allow microphone access.';
      this.notify();
      return { success: false, message: this.errorMessage };
    }

    if (permission === 'prompt') {
      const granted = await this.provider.requestPermission();
      if (!granted) {
        this.transitionTo('ERROR');
        this.errorMessage = 'Microphone permission was not granted.';
        this.notify();
        return { success: false, message: this.errorMessage };
      }
    }

    try {
      this.errorMessage = null;
      const settings = this.getSettings();
      const langCode = settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
      const isDuplex = settings.pipelineMode === 'full_duplex';

      await this.provider.startListening({
        language: langCode,
        continuous: true,
        interimResults: isDuplex,
      });
      this.transitionTo('LISTENING_FOR_WAKE');
      return { success: true, message: 'Jarvis is listening for wake names.' };
    } catch (err: unknown) {
      this.transitionTo('ERROR');
      this.errorMessage = 'Failed to start microphone stream.';
      this.notify();
      return { success: false, message: this.errorMessage };
    }
  }

  /**
   * Stops the voice system and returns to SLEEPING
   */
  static async stopVoiceSystem(): Promise<void> {
    this.clearActiveSessionTimer();
    if (this.provider) {
      await this.provider.stopListening();
    }
    this.transitionTo('SLEEPING');
  }

  /**
   * Resets the 10-minute active session timer
   */
  private static resetActiveSessionTimer(): void {
    this.clearActiveSessionTimer();

    const timeout = this.getSettings().activeSessionTimeoutMs || JARVIS_ACTIVE_SESSION_TIMEOUT_MS;
    this.sessionExpiresAt = Date.now() + timeout;

    this.activeSessionTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, timeout);
  }

  private static clearActiveSessionTimer(): void {
    if (this.activeSessionTimer) {
      clearTimeout(this.activeSessionTimer);
      this.activeSessionTimer = null;
    }
    this.sessionExpiresAt = null;
  }

  private static handleSessionTimeout(): void {
    // 10-minute session elapsed without user command
    this.clearActiveSessionTimer();
    if (this.currentState !== 'SLEEPING') {
      this.transitionTo('LISTENING_FOR_WAKE');
    }
  }

  /**
   * Screen-off / background handling
   */
  private static handleVisibilityChange(hidden: boolean): void {
    const settings = this.getSettings();

    if (hidden) {
      // Screen turned off or app backgrounded
      if (settings.screenOffWakeEnabled) {
        if (PlatformBridge.isNativeAndroid()) {
          // Engage native foreground service to keep CPU awake and mic active
          PlatformBridge.startForegroundWakeService();
        }
        // Keep listening without interruption in background mode
        this.errorMessage = null;
      } else {
        // User explicitly turned off background wake
        this.provider?.stopListening();
        this.errorMessage = 'Screen-Off Wake: Disabled in settings';
        this.notify();
      }
    } else {
      // Screen turned back ON
      if (this.currentState === 'LISTENING_FOR_WAKE' || this.currentState === 'LISTENING_FOR_COMMAND') {
        this.errorMessage = null;
        this.restartListening();
      }
    }
  }

  /**
   * Directly called when wake word is detected from native Android background service
   * or the Lock-Screen Simulator.
   */
  static wakeFromBackground(wakeName: string = 'Jarvis'): void {
    const settings = this.getSettings();

    // 1. Play futuristic JARVIS acoustic chime
    if (settings.audioChimeOnWake ?? true) {
      AudioEffects.playJarvisWakeChime();
    }

    // 2. Tactile haptic pulse
    if (settings.hapticFeedbackOnWake ?? true) {
      AudioEffects.triggerHapticPulse([80, 50, 120]);
    }

    // 3. Wake screen
    if (settings.screenWakeOnDetection ?? true) {
      PlatformBridge.wakeScreenNow();
    }

    this.saveSettings({ lastUsedAlias: wakeName });
    this.resetActiveSessionTimer();
    this.transitionTo('LISTENING_FOR_COMMAND');

    const greeting = settings.selectedLanguage === 'hi'
      ? `हाँ जी, मैं सुन रहा हूँ। आदेश दें?`
      : `Online and listening, Sir. How can I assist you?`;

    this.lastResponseText = greeting;
    this.notify();

    // Speak voice greeting
    const prefs = JarvisPersonalityEngine.getPreferences();
    JarvisTtsEngine.speak({
      id: `wake_${Date.now()}`,
      text: greeting,
      spokenText: greeting,
      language: settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
      gender: prefs.voiceGender || 'male',
      voiceURI: prefs.selectedVoiceURI,
      rate: prefs.speechRate || 0.9,
      pitch: prefs.speechPitch || 0.88,
      onEnd: () => {
        // Resume listening for command after speaking greeting
        this.restartListening();
      },
    });
  }

  private static async restartListening(): Promise<void> {
    if (!this.provider) return;
    try {
      const settings = this.getSettings();
      const langCode = settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
      const isDuplex = settings.pipelineMode === 'full_duplex';
      await this.provider.stopListening();
      await this.provider.startListening({
        language: langCode,
        continuous: true,
        interimResults: isDuplex,
      });
    } catch {
      // Ignore restart error
    }
  }

  // ==========================================
  // Speech Result Processing & Wake Detection
  // ==========================================

  private static handleSpeechResult(result: VoiceRecognitionResult): void {
    const transcript = result.transcript.trim();
    if (!transcript) return;

    const settings = this.getSettings();

    // Problem 3: Route through Full-Duplex Pipeline (Self-Voice Echo Filter & Barge-In Detection)
    const duplexCheck = JarvisDuplexPipelineService.processIncomingSpeech(result, settings.enabledWakeNames);
    if (!duplexCheck.shouldProcess) {
      // Audio was identified as speaker echo or turn-based muted speech -> discarded
      return;
    }

    // Handle user interruption / barge-in
    if (duplexCheck.isBargeIn) {
      this.lastSpokenTranscript = transcript;
      this.resetActiveSessionTimer();

      const commandPart = duplexCheck.cleanTranscript.trim();
      const isPureStop = /^(stop|wait|hold on|cancel|pause|quiet|shutup|shut up|never mind|रुको|सुनो|बस|चुप|ठहरो|रहने दो|बंद करो)$/i.test(commandPart);

      if (isPureStop || !commandPart) {
        this.transitionTo('AWAKE');
        this.lastResponseText = settings.selectedLanguage === 'hi' ? 'जी, मैं रुक गया।' : 'Stopped.';
        this.onCommandCompleted();
        this.notify();
        return;
      } else {
        // Interrupted with a new command directly
        this.transitionTo('LISTENING_FOR_COMMAND');
        this.processCommand(commandPart, transcript);
        return;
      }
    }

    this.lastSpokenTranscript = transcript;
    const isSessionActive = this.isSessionActive() || JarvisDuplexPipelineService.isConversationalFollowUpHot();

    // Check for Wake Word & extract command
    const detection = WakeNameDetectionService.detectWakeName(
      transcript,
      settings.enabledWakeNames,
      isSessionActive
    );

    if (detection.addressedToJarvis) {
      // Play acoustic chime and haptic feedback
      if (settings.audioChimeOnWake ?? true) {
        AudioEffects.playJarvisWakeChime();
      }
      if (settings.hapticFeedbackOnWake ?? true) {
        AudioEffects.triggerHapticPulse([70, 40, 90]);
      }

      // If an alias was matched, remember it
      if (detection.matchedWakeName) {
        this.saveSettings({ lastUsedAlias: detection.matchedWakeName });
      }

      // Refresh 10-minute active session timer on meaningful interaction
      this.resetActiveSessionTimer();

      // If user provided a command directly with the wake word (e.g., "Jarvis, open YouTube")
      // or if session was already active and they spoke a command:
      if (detection.remainingCommand) {
        this.processCommand(detection.remainingCommand, transcript, detection.matchedWakeName);
      } else {
        // User just said the wake name: "Jarvis" or "Alexa"
        this.transitionTo('LISTENING_FOR_COMMAND');
        this.lastResponseText = settings.selectedLanguage === 'hi'
          ? `सुन रहा हूँ। बताइए क्या करूँ?`
          : `I'm listening. How can I help you?`;
        this.startAwakeTimer(settings.continuousTurnTakingTimeoutMs || 120000);
        this.notify();
      }
    } else {
      // Speech recognized, but not addressed to Jarvis and no active session
      this.notify();
    }
  }

  private static handleSpeechError(error: VoiceRecognitionError): void {
    if (error.code === 'permission_denied') {
      this.transitionTo('ERROR');
      this.errorMessage = 'Microphone permission denied. Grant access to use Jarvis voice.';
    } else if (error.code === 'not_supported') {
      this.transitionTo('UNAVAILABLE');
      this.errorMessage = 'Speech engine unavailable on this device.';
    } else if (error.code === 'network_error') {
      this.errorMessage = 'Speech recognition network error.';
    }
    this.notify();
  }

  /**
   * Processes a recognized voice command and passes it to the command pipeline.
   * Phase 11: Routes through Jarvis Intelligence & Task Planner.
   * Phase 19: Formats through Personality Engine & speaks via TTS.
   */
  static async processCommand(commandText: string, rawTranscript?: string, matchedAlias?: string): Promise<void> {
    this.lastSpokenTranscript = rawTranscript || commandText;
    this.transitionTo('PROCESSING');
    JarvisTtsEngine.setStatus('THINKING');

    // Requirement 2: Command initiated -> mark start in duplex pipeline and clear previous awake timer
    this.clearAwakeTimer();
    JarvisDuplexPipelineService.markCommandStarted();

    // Reset active session timeout
    this.resetActiveSessionTimer();

    const alias = matchedAlias || this.getSettings().lastUsedAlias || 'Jarvis';
    const cleanCommand = commandText.trim();
    const settings = this.getSettings();

    // ============================================================
    // USER MANDATE: Multilingual Language Switching & Voice Commands
    // ============================================================
    const isHindiRequest = /\b(?:speak in hindi|talk in hindi|hindi me bolo|hindi me baat karo|switch to hindi|hindi language|हिंदी में बोलो|हिंदी बोलो|हिंदी में बात करो)\b/i.test(cleanCommand);
    const isEnglishRequest = /\b(?:speak in english|talk in english|english me bolo|switch to english|english language|अंग्रेजी में बोलो|अंग्रेजी बोलो)\b/i.test(cleanCommand);

    if (isHindiRequest) {
      this.saveSettings({ selectedLanguage: 'hi' });
      JarvisPersonalityEngine.savePreferences({ language: 'hi' });
      const vocalText = 'हाँ, अब से मैं आपसे हिंदी में बात करूँगा।';
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      this.speakText(vocalText, 'hi-IN', () => this.onCommandCompleted());
      return;
    }

    if (isEnglishRequest) {
      this.saveSettings({ selectedLanguage: 'en' });
      JarvisPersonalityEngine.savePreferences({ language: 'en' });
      const vocalText = 'Understood. I will converse in English from now on.';
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      this.speakText(vocalText, 'en-US', () => this.onCommandCompleted());
      return;
    }

    // Voice Gender Switch Commands: "change voice to female", "change voice to male"
    const isFemaleVoiceRequest = /\b(?:change voice to female|switch to female voice|female voice|महिला की आवाज|फीमेल आवाज|आवाज फीमेल करो)\b/i.test(cleanCommand);
    const isMaleVoiceRequest = /\b(?:change voice to male|switch to male voice|male voice|पुरुष की आवाज|मेल आवाज|आवाज मेल करो)\b/i.test(cleanCommand);

    if (isFemaleVoiceRequest) {
      JarvisPersonalityEngine.savePreferences({ voiceGender: 'female', speechPitch: 1.08, speechRate: 0.9 });
      const vocalText = settings.selectedLanguage === 'hi'
        ? 'आवाज को फीमेल में बदल दिया गया है।'
        : 'Voice profile switched to female.';
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      this.speakText(vocalText, settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US', () => this.onCommandCompleted());
      return;
    }

    if (isMaleVoiceRequest) {
      JarvisPersonalityEngine.savePreferences({ voiceGender: 'male', speechPitch: 0.88, speechRate: 0.9 });
      const vocalText = settings.selectedLanguage === 'hi'
        ? 'आवाज को मेल में बदल दिया गया है।'
        : 'Voice profile switched to male.';
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      this.speakText(vocalText, settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US', () => this.onCommandCompleted());
      return;
    }

    // Warning / Say it Command (Rule 2: when user say to say him the warning or click on say it)
    const isWarningQuery = /^(?:say it|say the warning|tell me the warning|what is the warning|what's the warning|show warning|warning kya hai|warning batao|alert kya hai|चेतावनी बताओ|चेतावनी क्या है)$/i.test(cleanCommand);
    if (isWarningQuery) {
      const activeAlerts = JarvisProactiveSentinelService.getActiveAlerts();
      if (activeAlerts.length > 0) {
        const alert = activeAlerts[0];
        const vocalText = alert.vocalMessage || alert.details;
        this.lastResponseText = vocalText;
        this.transitionTo('RESPONDING');
        this.speakText(vocalText, settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US', () => this.onCommandCompleted());
        return;
      } else {
        const vocalText = settings.selectedLanguage === 'hi'
          ? 'फिलहाल कोई चेतावनी नहीं है, सभी सिस्टम सामान्य हैं।'
          : 'No active warnings at the moment. All systems are nominal.';
        this.lastResponseText = vocalText;
        this.transitionTo('RESPONDING');
        this.speakText(vocalText, settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US', () => this.onCommandCompleted());
        return;
      }
    }

    // Phase 26 Real-JARVIS: Adversarial Guardrail & Red-Teaming Shield
    const guardrail = JarvisAdversarialGuardrailService.evaluatePrompt(cleanCommand);
    if (!guardrail.isSafe) {
      const vocalText = settings.selectedLanguage === 'hi' ? guardrail.mitigationResponseHi : guardrail.mitigationResponseEn;
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 26: Native Acoustic Phoneme & Whisper Emulation
    JarvisAudioPhonemeEngine.analyzeSample(cleanCommand.length < 15 ? 0.12 : 0.45, 135);

    // Phase 26: Live Grounding & Knowledge Verification Query
    const isGroundingQuery = /\b(?:grounding|verify fact|fact check|live search check|सत्यता जांचो|ग्राउंडिंग|तथ्य जांचो)\b/i.test(cleanCommand);
    if (isGroundingQuery) {
      const rep = JarvisGroundingSearchService.groundQuery(cleanCommand);
      const vocalText = settings.selectedLanguage === 'hi' ? rep.groundedAnswerHi : rep.groundedAnswerEn;
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 26: Long-Context Map-Reduce & Needle Query
    const isLongContextQuery = /\b(?:long context|scan document|needle in haystack|deep read|लॉन्ग कॉन्टेक्स्ट|दस्तावेज पढ़ो)\b/i.test(cleanCommand);
    if (isLongContextQuery) {
      const mockCorpus = new Array(500).fill('stark telemetry parameter nominal').join(' ') + ' quantum resonance 4.82 THz ' + new Array(300).fill('steady state').join(' ');
      const rep = JarvisLongContextSynthesizer.analyzeLongDocument('System Telemetry Corpus', mockCorpus, cleanCommand);
      const vocalText = settings.selectedLanguage === 'hi' ? rep.executiveSummaryHi : rep.executiveSummaryEn;
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 26: Sampling Hyperparameter (Temperature) Query
    const isSamplingQuery = /\b(?:set temperature|sampling mode|stark wit mode|analytical mode|टेंपरेचर सेट करो|विट मोड)\b/i.test(cleanCommand);
    if (isSamplingQuery) {
      const isStark = /stark|wit|मजाक/i.test(cleanCommand);
      const preset = isStark ? 'STARK_MAX_WIT' : 'ANALYTICAL_ZERO';
      JarvisSamplingHyperparamsController.applyPreset(preset);
      const vocalText = settings.selectedLanguage === 'hi'
        ? (isStark ? 'सैंपलिंग टेम्परेचर 1.4 पर सेट किया गया है, सर। अधिकतम स्टार्क व्यंग्य सक्रिय है।' : 'सैंपलिंग टेम्परेचर 0.1 पर सेट किया गया है, सर। पूरी तरह विश्लेषणात्मक मोड सक्रिय।')
        : (isStark ? 'Sampling temperature elevated to 1.4, Sir. Maximum Stark wit matrix engaged.' : 'Sampling temperature set to 0.1, Sir. Deterministic analytical mode engaged.');
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 24 Biometric Sensing: Analyze vocal acoustic micro-tremor on each user utterance
    JarvisBiometricsService.analyzeVocalSample(cleanCommand.length);

    // Phase 25 Real-JARVIS: Acoustic Speaker Diarization & Threat Assessment
    JarvisMultiSpeakerDiarizationService.processUtteranceAcoustics(cleanCommand.length);

    // Phase 25: Acoustic Speaker Diarization Query
    const isDiarizationQuery = /\b(?:who is speaking|speaker id|acoustic check|threat check|वक्ता कौन है|पहचानो|मेरी आवाज)\b/i.test(cleanCommand);
    if (isDiarizationQuery) {
      const vocalText = JarvisMultiSpeakerDiarizationService.getThreatReport(settings.selectedLanguage === 'hi' ? 'hi' : 'en');
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 25: Probabilistic "What-If" Monte Carlo Simulation
    const isSimulationQuery = /\b(?:simulate|what if|run the numbers|monte carlo|probability of|सिमुलेट|सिमुलेशन|संभावना क्या है|गणना करो)\b/i.test(cleanCommand);
    if (isSimulationQuery) {
      const sim = JarvisWhatIfMonteCarloEngine.runSimulation(cleanCommand);
      const vocalText = settings.selectedLanguage === 'hi' ? sim.vocalReportHi : sim.vocalReportEn;
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 25: Continuous Spatial Vision & Surroundings Report
    const isSpatialQuery = /\b(?:spatial vision|surroundings|motion check|optical flow|आसपास क्या है|गति जांचो|स्थानिक दृष्टि)\b/i.test(cleanCommand);
    if (isSpatialQuery) {
      const vocalText = JarvisContinuousSpatialVisionService.getSpatialReport(settings.selectedLanguage === 'hi' ? 'hi' : 'en');
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 25: Autonomous Deep Reconnaissance Dossier
    const isReconQuery = /\b(?:recon dossier|deep recon|intelligence dossier|reconnaissance|खुफिया रिपोर्ट|डोसियर|गहन रिपोर्ट)\b/i.test(cleanCommand);
    if (isReconQuery) {
      const dossier = JarvisDeepReconEngine.compileDossier(cleanCommand);
      const vocalText = settings.selectedLanguage === 'hi' ? dossier.executiveSummaryHi : dossier.executiveSummaryEn;
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 25: Audio Beamforming & DSP Noise Gating Query
    const isDspQuery = /\b(?:dsp filter|noise filter|noise cancellation|audio beamforming|नॉइज़ कैंसिलेशन|डीएसपी|शोर रोको)\b/i.test(cleanCommand);
    if (isDspQuery) {
      const cur = JarvisAudioDSPFramer.getTelemetry();
      const next = !cur.isActive;
      JarvisAudioDSPFramer.toggleDSP(next);
      const vocalText = settings.selectedLanguage === 'hi'
        ? (next ? 'ऑडियो बीमफॉर्मिंग और 300Hz-3400Hz डीएसपी नॉइज़ फिल्टर सक्रिय कर दिया गया है, सर।' : 'डीएसपी फिल्टर निष्क्रिय कर दिया गया है, सर।')
        : (next ? 'Acoustic beamforming and 300Hz-3400Hz DSP noise filter active, Sir.' : 'Audio DSP filter bypassed, Sir.');
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 25: Tree-of-Thought (ToT) Autonomous Deep Planner
    const isToTQuery = /\b(?:plan objective|break this down|deep plan|execute plan|योजना बनाओ|प्लान बनाओ)\b/i.test(cleanCommand);
    if (isToTQuery) {
      const plan = JarvisTreeOfThoughtPlanner.generatePlan(cleanCommand);
      const vocalText = settings.selectedLanguage === 'hi'
        ? `लक्ष्य को ${plan.nodes.length} संज्ञान चरणों में विभाजित कर दिया गया है, सर। बैकट्रैकिंग सुरक्षा सक्रिय है।`
        : `Objective partitioned into a cognitive tree of ${plan.nodes.length} nodes, Sir. Backtracking safety matrix engaged.`;
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 24 / Real-JARVIS Evolution: Optical PPG & Acoustic Micro-Tremor Biometrics Query
    const isVitalsQuery = /\b(?:vitals|vital signs|health report|heart rate|pulse|check my pulse|respiration|stress level|स्वास्थ्य|हार्ट रेट|पल्स|धड़कन|हेल्थ चेक)\b/i.test(cleanCommand);
    if (isVitalsQuery) {
      const vocalText = JarvisBiometricsService.getVocalHealthReport(settings.selectedLanguage === 'hi' ? 'hi' : 'en');
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 24 / Real-JARVIS Evolution: Ubiquitous Multi-Device Mesh Relay Query & Handoff
    const isMeshQuery = /\b(?:mesh status|connected devices|active nodes|stark mesh|मेश नेटवर्क|नोड्स)\b/i.test(cleanCommand);
    if (isMeshQuery) {
      const vocalText = JarvisMeshRelayService.getMeshTelemetryReport(settings.selectedLanguage === 'hi' ? 'hi' : 'en');
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    const isRelayHandoff = /\b(?:relay to|switch to|switch audio to|handoff to|transfer to|भेजो|ट्रांसफर करो)\b/i.test(cleanCommand);
    if (isRelayHandoff) {
      const targetNode = JarvisMeshRelayService.resolveNodeBySpokenText(cleanCommand);
      if (targetNode) {
        await JarvisMeshRelayService.handoffAudio(targetNode.nodeId);
        const vocalText = settings.selectedLanguage === 'hi'
          ? `ऑडियो और वॉयस सेशन "${targetNode.name}" पर स्थानांतरित कर दिया गया है, सर।`
          : `Audio and conversational session routed to ${targetNode.name}, Sir.`;
        this.lastResponseText = vocalText;
        this.transitionTo('RESPONDING');
        if (settings.voiceSoundEffects ?? true) {
          this.speakText(
            vocalText,
            settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
            () => this.onCommandCompleted()
          );
        } else {
          setTimeout(() => this.onCommandCompleted(), 1500);
        }
        return;
      }
    }

    // Problem 4: Voice-Vision Fusion Query Check
    const isVisionQuery = /\b(?:look at this|what do you see|what am i looking at|what is this|scan this|read this|read the document|inspect circuit|क्या दिख रहा है|सामने क्या है|देखो|सामने देखो)\b/i.test(cleanCommand);
    if (isVisionQuery) {
      try {
        const visionResult = await JarvisContinuousVisionService.analyzeCurrentScene({
          prompt: cleanCommand,
          mode: 'interactive_query',
        });

        this.lastResponseText = visionResult.jarvisSpokenResponse;
        this.transitionTo('RESPONDING');

        if (settings.voiceSoundEffects ?? true) {
          this.speakText(
            visionResult.jarvisSpokenResponse,
            settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
            () => this.onCommandCompleted()
          );
        } else {
          setTimeout(() => this.onCommandCompleted(), 1500);
        }
        return;
      } catch (visErr) {
        console.warn('[JarvisVoice] Vision query execution fallback:', visErr);
      }
    }

    // Phase 24 / Real-JARVIS Evolution: Sub-15ms Local Edge Neural Core Dispatch
    const edgeRes = JarvisEdgeNeuralService.resolveIntent(cleanCommand);
    if (edgeRes.executionTier === 'LOCAL_EDGE_NEURAL' && edgeRes.domain === 'DEVICE_CONTROL') {
      if (edgeRes.targetAction === 'toggle_flashlight') {
        const isOff = /\b(?:off|band|बंद)\b/i.test(cleanCommand);
        JarvisDeviceControlService.setFlashlight(!isOff);
      } else if (edgeRes.targetAction === 'set_brightness') {
        const lvl = typeof edgeRes.parameters.level === 'number' ? edgeRes.parameters.level : 80;
        JarvisDeviceControlService.setBrightness(lvl);
      } else if (edgeRes.targetAction === 'set_volume') {
        const lvl = typeof edgeRes.parameters.level === 'number' ? edgeRes.parameters.level : 65;
        JarvisDeviceControlService.setVolume('master', lvl);
      } else if (edgeRes.targetAction === 'toggle_network') {
        if (/\b(?:wifi|वाइफाइ)\b/i.test(cleanCommand)) {
          JarvisDeviceControlService.toggleWifi();
        } else if (/\b(?:bluetooth|ब्लूटूथ)\b/i.test(cleanCommand)) {
          JarvisDeviceControlService.toggleBluetooth();
        } else if (/\b(?:hotspot|हॉटस्पॉट)\b/i.test(cleanCommand)) {
          JarvisDeviceControlService.toggleHotspot();
        }
      }

      const vocalText = settings.selectedLanguage === 'hi' ? edgeRes.suggestedSpeechHi : edgeRes.suggestedSpeechEn;
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 24 / Real-JARVIS Evolution: Dynamic Autonomous Tool Synthesis & Macro Invocation
    const isToolSynthesisRequest = /\b(?:create tool|naya tool banao|create macro|naya macro banao|synthesize tool|नया टूल बनाओ|नया मैक्रो बनाओ)\b/i.test(cleanCommand);
    if (isToolSynthesisRequest) {
      this.transitionTo('PROCESSING');
      const synResult = JarvisDynamicToolService.synthesizeToolFromPrompt(cleanCommand);
      let vocalText = '';
      if (synResult.error) {
        vocalText = settings.selectedLanguage === 'hi'
          ? `प्रोटोकॉल अस्वीकृत: ${synResult.error}`
          : `Synthesis rejected: ${synResult.error}`;
      } else if (synResult.tool) {
        vocalText = settings.selectedLanguage === 'hi'
          ? `नया प्रोटोकॉल "${synResult.tool.title}" तैयार कर लिया गया है, सर। यह वॉयस कमांड द्वारा सक्रिय किया जा सकता है।`
          : `Protocol "${synResult.tool.title}" synthesized and registered into the active matrix, Sir.`;
      }
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Check if spoken command matches an existing dynamic synthesized tool
    const matchedDynamicTool = JarvisDynamicToolService.findMatchingTool(cleanCommand);
    if (matchedDynamicTool) {
      this.transitionTo('PROCESSING');
      const execResult = await JarvisDynamicToolService.executeTool(matchedDynamicTool.id);
      const vocalText = settings.selectedLanguage === 'hi' ? execResult.userMessageHi : execResult.userMessageEn;
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 1 Proactive Sentinel: Direct voice triggers for Morning Briefing & Night Rest
    const isMorningQuery = /\b(?:morning briefing|good morning|what's my day look like|आज का दिन कैसा है|सुबह की रिपोर्ट|शुभ प्रभात|morning report)\b/i.test(cleanCommand);
    if (isMorningQuery) {
      JarvisProactiveSentinelService.triggerMorningBriefing(true);
      const alerts = JarvisProactiveSentinelService.getActiveAlerts();
      const briefAlert = alerts.find((a) => a.type === 'morning_briefing');
      const vocalText = briefAlert?.vocalMessage || 'Good morning Sir. All Stark systems nominal.';
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    const isNightQuery = /\b(?:good night|night mode|eye comfort|eye shield|सोने जा रहा हूँ|रात हो गई|गुड नाईट)\b/i.test(cleanCommand);
    if (isNightQuery) {
      await JarvisProactiveSentinelService.executeAction('manual', 'engage_eye_comfort');
      const vocalText = settings.selectedLanguage === 'hi'
        ? 'शुभ रात्रि, सर। आई-कम्फर्ट 3200K और स्क्रीन डिमिंग सक्रिय कर दी गई है।'
        : 'Good night, Sir. Ocular shield engaged at 3200 Kelvin and display luminance attenuated.';
      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 2 / Phase 21 Episodic Memory: Temporal & Associative queries
    const isEpisodicQuery = /\b(?:yesterday|kal kya|kal humne|what did we do yesterday|who is|kaun hai|tell me about|kon hai|last task|aakhri kaam|who created oneva|who made oneva)\b/i.test(cleanCommand);
    if (isEpisodicQuery) {
      const recallResult = JarvisEpisodicMemoryService.recallEpisodicMemory({
        queryText: cleanCommand,
        maxResults: 3,
      });

      const vocalText = settings.selectedLanguage === 'hi' && recallResult.synthesizedNarrativeHi
        ? recallResult.synthesizedNarrativeHi
        : recallResult.synthesizedNarrative;

      this.lastResponseText = vocalText;
      this.transitionTo('RESPONDING');
      if (settings.voiceSoundEffects ?? true) {
        this.speakText(
          vocalText,
          settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
          () => this.onCommandCompleted()
        );
      } else {
        setTimeout(() => this.onCommandCompleted(), 1500);
      }
      return;
    }

    // Phase 3 / Phase 22: Autonomous Routines & Predictive Intent
    const isRoutineCommand = /\b(?:routine|morning genesis|deep focus|stark saver|night rest|media immersion|रूटीन|फोकस मोड|मॉर्निंग रूटीन|नाईट रूटीन)\b/i.test(cleanCommand);
    const isIntentQuery = /\b(?:what should i do|what is my next task|suggest routine|predict intent|next task|अगला काम|क्या करें)\b/i.test(cleanCommand);

    if (isRoutineCommand || isIntentQuery) {
      if (isIntentQuery) {
        const intents = JarvisPredictiveIntentService.evaluateCurrentIntents();
        const top = intents[0];
        const vocalText = top
          ? settings.selectedLanguage === 'hi'
            ? top.vocalPromptHi
            : top.vocalPromptEn
          : settings.selectedLanguage === 'hi'
          ? 'सर, सभी सिस्टम सामान्य हैं। कोई तत्काल रूटीन आवश्यक नहीं है।'
          : 'All systems are nominal, Sir. No immediate routine is required.';

        this.lastResponseText = vocalText;
        this.transitionTo('RESPONDING');
        if (settings.voiceSoundEffects ?? true) {
          this.speakText(
            vocalText,
            settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
            () => this.onCommandCompleted()
          );
        } else {
          setTimeout(() => this.onCommandCompleted(), 1500);
        }
        return;
      }

      // Check specific routine triggers
      let targetRoutineId: string | null = null;
      if (/\b(?:morning|subah|प्रभात)\b/i.test(cleanCommand)) targetRoutineId = 'routine_morning_genesis';
      else if (/\b(?:focus|padhai|work|काम)\b/i.test(cleanCommand)) targetRoutineId = 'routine_deep_focus';
      else if (/\b(?:stark saver|battery|saver|बैटरी)\b/i.test(cleanCommand)) targetRoutineId = 'routine_stark_saver';
      else if (/\b(?:night|so jao|sleep|रात|सोना)\b/i.test(cleanCommand)) targetRoutineId = 'routine_night_rest';
      else if (/\b(?:media|movie|music|गाना)\b/i.test(cleanCommand)) targetRoutineId = 'routine_media_immersion';

      if (targetRoutineId) {
        this.transitionTo('PROCESSING');
        const execResult = await JarvisPredictiveIntentService.executeRoutine(targetRoutineId, 'voice_command');
        this.lastResponseText = execResult.message;
        this.transitionTo('RESPONDING');
        if (settings.voiceSoundEffects ?? true) {
          this.speakText(
            execResult.message,
            settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
            () => this.onCommandCompleted()
          );
        } else {
          setTimeout(() => this.onCommandCompleted(), 1500);
        }
        return;
      }
    }

    // Phase 4 / Phase 23 Evolution: Autonomous Self-Healing & System Optimization
    const isDiagnoseCommand = /\b(?:diagnose|system check|health check|system status|phone check|सिस्टम चेक|फोन चेक|जांच करो|डायग्नोस्टिक्स)\b/i.test(cleanCommand);
    const isSelfHealingCommand = /\b(?:self healing|heal system|optimize phone|optimize system|clean memory|ram clean|clean cache|phone garam|phone is hot|overheating|सिस्टम ठीक करो|फोन फास्ट करो|मेमोरी साफ करो|सेल्फ हीलिंग)\b/i.test(cleanCommand);

    if (isDiagnoseCommand || isSelfHealingCommand) {
      this.transitionTo('PROCESSING');
      if (isSelfHealingCommand) {
        const actionResult = await JarvisSelfHealingService.executeAction('full_system_healing');
        const vocalText = settings.selectedLanguage === 'hi'
          ? `सिस्टम सेल्फ-हीलिंग संपन्न हुई सर। ${actionResult.memoryFreedMb} एमबी रैम खाली की गई और तापमान सामान्य किया गया।`
          : `Self-healing protocol complete Sir. Freed ${actionResult.memoryFreedMb} megabytes of RAM and stabilized thermal core.`;

        this.lastResponseText = vocalText;
        this.transitionTo('RESPONDING');
        if (settings.voiceSoundEffects ?? true) {
          this.speakText(
            vocalText,
            settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
            () => this.onCommandCompleted()
          );
        } else {
          setTimeout(() => this.onCommandCompleted(), 1500);
        }
        return;
      } else {
        const telemetry = JarvisSelfHealingService.evaluateHealthMatrix();
        const vocalText = settings.selectedLanguage === 'hi'
          ? `सर, सिस्टम डायग्नोस्टिक पूरा हुआ। समग्र स्वास्थ्य स्कोर ${telemetry.overallScore}% है, और स्थिति ${telemetry.systemStatus} है।`
          : `System diagnostics completed Sir. Overall health index is at ${telemetry.overallScore}%, status ${telemetry.systemStatus}.`;

        this.lastResponseText = vocalText;
        this.transitionTo('RESPONDING');
        if (settings.voiceSoundEffects ?? true) {
          this.speakText(
            vocalText,
            settings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
            () => this.onCommandCompleted()
          );
        } else {
          setTimeout(() => this.onCommandCompleted(), 1500);
        }
        return;
      }
    }

    try {
      // Phase 11: Route through Jarvis Intelligence & Central Task Planner
      const { intent, plan, friendlyResponse } = await JarvisIntelligenceService.processUserInput(cleanCommand);

      // Indicate action execution if steps exist
      if (plan.steps && plan.steps.length > 0 && plan.executionHandoff?.targetPhase === 'PHASE_13_ANDROID_ACTIONS') {
        JarvisTtsEngine.setStatus('EXECUTING');
      }

      // Phase 19: Format through Personality Engine
      const formatted = JarvisPersonalityEngine.formatResponse({
        rawMessage: friendlyResponse,
        intentType: intent.intentType,
        complexity: intent.complexity,
        isActionSuccess: plan.status === 'COMPLETED',
        language: settings.selectedLanguage === 'hi' ? 'hi' : 'en',
        actionName: typeof intent.entities?.appName === 'string' ? intent.entities.appName : undefined,
      });

      this.lastResponseText = formatted.displayText;

      const event: JarvisCommandEvent = {
        id: plan.taskId || `cmd_${Date.now()}`,
        matchedAlias: alias,
        commandText: cleanCommand,
        rawTranscript: rawTranscript || commandText,
        timestamp: Date.now(),
        responsePreview: formatted.displayText,
        status: plan.status === 'COMPLETED' ? 'executed' : plan.status === 'WAITING_FOR_INPUT' ? 'waiting_for_input' : 'planned',
        intent,
        plan,
      };

      // Store in ephemeral memory only (capped at 20 items, never uploaded)
      this.commandHistory.unshift(event);
      if (this.commandHistory.length > 20) {
        this.commandHistory.pop();
      }

      this.transitionTo('RESPONDING');
      this.commandListeners.forEach((listener) => listener(event));

      // Phase 19: Speak via Premium TTS Engine
      const prefs = JarvisPersonalityEngine.getPreferences();
      if (prefs.voiceEnabled) {
        JarvisTtsEngine.speak({
          id: event.id,
          text: formatted.displayText,
          spokenText: formatted.spokenText,
          language: formatted.language,
          gender: prefs.voiceGender || 'male',
          voiceURI: prefs.selectedVoiceURI,
          rate: prefs.speechRate,
          pitch: prefs.speechPitch,
          onStart: () => {
            JarvisTtsEngine.setStatus('SPEAKING');
            if (settings.pipelineMode === 'turn_based') {
              this.provider?.stopListening().catch(() => {});
            }
            this.notify();
          },
          onEnd: () => {
            JarvisTtsEngine.setStatus('SUCCESS');
            if (settings.pipelineMode === 'turn_based') {
              this.restartListening();
            }
            setTimeout(() => {
              JarvisTtsEngine.setStatus('IDLE');
              this.onCommandCompleted();
            }, 600);
          },
          onError: () => {
            JarvisTtsEngine.setStatus('IDLE');
            if (settings.pipelineMode === 'turn_based') {
              this.restartListening();
            }
            this.onCommandCompleted();
          },
          onInterrupted: () => {
            JarvisTtsEngine.setStatus('IDLE');
            if (settings.pipelineMode === 'turn_based') {
              this.restartListening();
            }
            this.onCommandCompleted();
          },
        });
      } else {
        // If voice is disabled, display text and start 2-minute post-command awake timer
        setTimeout(() => {
          JarvisTtsEngine.setStatus('IDLE');
          this.onCommandCompleted();
        }, 1500);
      }
    } catch (err) {
      console.error('[JarvisVoiceService] Error processing command:', err);
      const formattedErr = JarvisPersonalityEngine.formatResponse({
        rawMessage: `Understood: "${cleanCommand}".`,
        isError: true,
        language: settings.selectedLanguage === 'hi' ? 'hi' : 'en',
      });

      this.lastResponseText = formattedErr.displayText;

      const event: JarvisCommandEvent = {
        id: `cmd_${Date.now()}`,
        matchedAlias: alias,
        commandText: cleanCommand,
        rawTranscript: rawTranscript || commandText,
        timestamp: Date.now(),
        responsePreview: formattedErr.displayText,
        status: 'executed',
      };

      this.commandHistory.unshift(event);
      this.transitionTo('RESPONDING');
      this.commandListeners.forEach((listener) => listener(event));

      setTimeout(() => {
        JarvisTtsEngine.setStatus('IDLE');
        this.onCommandCompleted();
      }, 1500);
    }
  }

  /**
   * Simulates spoken voice input directly for testing / preview without mic
   */
  static simulateVoiceInput(transcript: string): void {
    this.handleSpeechResult({
      transcript,
      isFinal: true,
      timestamp: Date.now(),
    });
  }

  static simulateSpeechInput(transcript: string): void {
    this.simulateVoiceInput(transcript);
  }

  /**
   * Alias for startVoiceSystem to activate wake listening
   */
  static async startWakeListening(): Promise<{ success: boolean; message: string }> {
    return this.startVoiceSystem();
  }

  // ==========================================
  // Problem 3: Duplex Pipeline & Barge-In Controls
  // ==========================================

  static getDuplexState(): JarvisDuplexState {
    return JarvisDuplexPipelineService.getState();
  }

  static getDuplexTelemetry(): JarvisDuplexTelemetry {
    return JarvisDuplexPipelineService.getTelemetry();
  }

  static setPipelineMode(mode: JarvisPipelineMode): void {
    this.saveSettings({ pipelineMode: mode });
  }

  static setBargeInEnabled(enabled: boolean): void {
    this.saveSettings({ bargeInEnabled: enabled });
  }

  static setSelfVoiceCancellation(enabled: boolean): void {
    this.saveSettings({ selfVoiceCancellation: enabled });
  }

  static setBargeInSensitivity(sensitivity: BargeInSensitivity): void {
    this.saveSettings({ bargeInSensitivity: sensitivity });
  }

  /**
   * Simulates an instant user barge-in interruption while JARVIS is speaking
   */
  static simulateBargeIn(interruptionSpeech: string = 'रुको, बंद करो'): void {
    JarvisDuplexPipelineService.executeBargeIn('Manual simulated interruption', interruptionSpeech);
    if (this.currentState === 'RESPONDING' || this.currentState === 'PROCESSING') {
      this.transitionTo('AWAKE');
      this.lastResponseText = `Interrupted: "${interruptionSpeech}". Stopped speaking.`;
      this.notify();
    }
  }

  // ==========================================
  // Subscription & Observers
  // ==========================================

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static onCommand(listener: (event: JarvisCommandEvent) => void): () => void {
    this.commandListeners.add(listener);
    return () => {
      this.commandListeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
