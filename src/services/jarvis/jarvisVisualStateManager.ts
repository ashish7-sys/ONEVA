/**
 * ONEVA Architecture: Jarvis Visual State Controller
 *
 * Implements the 5 canonical Jarvis visual states:
 * STATE 1: JARVIS_NOT_AWAKE (Normal user wallpaper, default: Changeable_wallpaper.mp4)
 * STATE 2: JARVIS_AWAKE_IDLE (Looping Awake_jarvis_normal_state.mp4)
 * STATE 3: JARVIS_SHORT_COMMAND (Looping Jarvis_doing_short_command.mp4)
 * STATE 4: JARVIS_LONG_TASK (Looping Jarvis_doing_long_command.mp4)
 * STATE 5: JARVIS_HAND_CONTROL (Interactive V4 Energy Sphere - Three.js WebGL)
 *
 * Strict Architectural Directives:
 * - ONEVA itself is NOT the AI.
 * - Jarvis is a separate system-wide layer.
 * - Normal Android wallpaper and Jarvis visual states are logically independent.
 * - User wallpaper/theme/icon pack changes affect ONLY the normal wallpaper state.
 * - They NEVER alter the 4 Jarvis visual states.
 * - Long tasks remain in JARVIS_LONG_TASK even when research panel is closed.
 * - When task/command completes, returns to JARVIS_AWAKE_IDLE, not directly to normal wallpaper.
 */

import { AssistService } from '../assistService';
import { WallpaperService } from '../wallpaperService';

export type JarvisVisualState =
  | 'JARVIS_NOT_AWAKE'
  | 'JARVIS_AWAKE_IDLE'
  | 'JARVIS_SHORT_COMMAND'
  | 'JARVIS_LONG_TASK'
  | 'JARVIS_HAND_CONTROL';

export interface JarvisAssetDescriptor {
  filename: string;
  localUrl: string;
  driveUrl: string;
  driveId: string;
  description: string;
}

export const JARVIS_ASSETS: Record<
  'normalDefault' | 'awakeIdle' | 'shortCommand' | 'longTask',
  JarvisAssetDescriptor
> = {
  normalDefault: {
    filename: 'Changeable_wallpaper.mp4',
    localUrl: '/assets/jarvis/Changeable_wallpaper.mp4',
    driveUrl: 'https://drive.google.com/file/d/13ASmtlL-Ah9tqVl9DDKVEyCfdJzjPOur/view?usp=drivesdk',
    driveId: '13ASmtlL-Ah9tqVl9DDKVEyCfdJzjPOur',
    description: 'Initial normal wallpaper reference (user-changeable)',
  },
  awakeIdle: {
    filename: 'Awake_jarvis_normal_state.mp4',
    localUrl: '/assets/jarvis/Awake_jarvis_normal_state.mp4',
    driveUrl: 'https://drive.google.com/file/d/14CeaVNwrNdHfeDWwIR8tgaCyOYHV8y39/view?usp=drivesdk',
    driveId: '14CeaVNwrNdHfeDWwIR8tgaCyOYHV8y39',
    description: 'Jarvis awake but idle state visual',
  },
  shortCommand: {
    filename: 'Jarvis_doing_short_command.mp4',
    localUrl: '/assets/jarvis/Jarvis_doing_short_command.mp4',
    driveUrl: 'https://drive.google.com/file/d/1CB-7Q07rKXkCICg19WMG-PBfIPdhf9Oy/view?usp=drivesdk',
    driveId: '1CB-7Q07rKXkCICg19WMG-PBfIPdhf9Oy',
    description: 'Jarvis executing short command visual',
  },
  longTask: {
    filename: 'Jarvis_doing_long_command.mp4',
    localUrl: '/assets/jarvis/Jarvis_doing_long_command.mp4',
    driveUrl: 'https://drive.google.com/file/d/1t7koaRRUkDZnnvnKJ3qpP5JxWZGbivR8/view?usp=drivesdk',
    driveId: '1t7koaRRUkDZnnvnKJ3qpP5JxWZGbivR8',
    description: 'Jarvis executing long research/processing task visual',
  },
};

export class JarvisVisualStateManager {
  private static currentState: JarvisVisualState = 'JARVIS_NOT_AWAKE';
  private static previousState: JarvisVisualState = 'JARVIS_NOT_AWAKE';
  private static activeLongTaskId: string | null = null;
  private static listeners: Set<(state: JarvisVisualState) => void> = new Set();
  private static isInitialized = false;

  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  static getState(): JarvisVisualState {
    return this.currentState;
  }

  static isAwake(): boolean {
    return this.currentState !== 'JARVIS_NOT_AWAKE';
  }

  static setState(newState: JarvisVisualState, reason?: string): void {
    if (this.currentState === newState) return;

    this.previousState = this.currentState;
    this.currentState = newState;

    // Sync reaction state with AssistService for telemetry and legacy subsystems
    switch (newState) {
      case 'JARVIS_NOT_AWAKE':
        AssistService.setReactionState('idle');
        break;
      case 'JARVIS_AWAKE_IDLE':
        AssistService.setReactionState('idle');
        break;
      case 'JARVIS_SHORT_COMMAND':
        AssistService.setReactionState('command_processing');
        break;
      case 'JARVIS_LONG_TASK':
        AssistService.setReactionState('research');
        break;
      case 'JARVIS_HAND_CONTROL':
        AssistService.setReactionState('command_detected');
        break;
    }

    this.notify();
  }

  /**
   * User wakes Jarvis (e.g. "Hey Jarvis" or tap mic)
   */
  static wakeUp(source: string = 'wake_word'): void {
    if (this.currentState === 'JARVIS_NOT_AWAKE') {
      this.setState('JARVIS_AWAKE_IDLE', `Woken up by ${source}`);
    }
  }

  /**
   * Jarvis is dismissed or returns to sleep -> returns to user's normal wallpaper
   */
  static dismiss(): void {
    this.activeLongTaskId = null;
    this.setState('JARVIS_NOT_AWAKE', 'Jarvis dismissed to normal wallpaper');
  }

  /**
   * User issues a short command
   */
  static startShortCommand(commandText?: string): void {
    this.setState('JARVIS_SHORT_COMMAND', `Executing short command: ${commandText || ''}`);
  }

  /**
   * Short command completed -> ALWAYS returns to JARVIS_AWAKE_IDLE (never directly to normal wallpaper)
   */
  static finishShortCommand(): void {
    // If long task is concurrently active, return to long task; otherwise return to awake idle
    if (this.activeLongTaskId) {
      this.setState('JARVIS_LONG_TASK', 'Resuming long task after short command');
    } else {
      this.setState('JARVIS_AWAKE_IDLE', 'Short command completed; returning to awake idle');
    }
  }

  /**
   * User or background agent starts a long running operation (research, generation, analysis)
   */
  static startLongTask(taskId?: string, taskTitle?: string): void {
    this.activeLongTaskId = taskId || `task_${Date.now()}`;
    this.setState('JARVIS_LONG_TASK', `Long task started: ${taskTitle || taskId || ''}`);
  }

  /**
   * Long task completed or stopped -> returns to JARVIS_AWAKE_IDLE
   */
  static finishLongTask(taskId?: string): void {
    if (!taskId || this.activeLongTaskId === taskId) {
      this.activeLongTaskId = null;
      this.setState('JARVIS_AWAKE_IDLE', 'Long task completed; returning to awake idle');
    }
  }

  /**
   * Toggles or sets Hand Control state
   */
  static setHandControl(active: boolean): void {
    if (active) {
      this.setState('JARVIS_HAND_CONTROL', 'Hand control activated');
    } else {
      // Returning from hand control: if there is an active long task, return to it; else awake idle
      if (this.activeLongTaskId) {
        this.setState('JARVIS_LONG_TASK', 'Returning to active long task from hand control');
      } else {
        this.setState('JARVIS_AWAKE_IDLE', 'Returning to awake idle from hand control');
      }
    }
  }

  /**
   * Checks if an active long task is still running in background
   */
  static getActiveLongTaskId(): string | null {
    return this.activeLongTaskId;
  }

  static subscribe(listener: (state: JarvisVisualState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    const state = this.currentState;
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('[JarvisVisualStateManager] Listener error:', err);
      }
    });
  }
}
