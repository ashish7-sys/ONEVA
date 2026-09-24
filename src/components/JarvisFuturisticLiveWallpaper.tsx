/**
 * ONEVA Architecture: Jarvis Stateful Live Wallpaper (Replaced Legacy Monolith)
 *
 * This file replaces the old monolithic Jarvis canvas HUD with the unified
 * stateful Jarvis backdrop architecture.
 *
 * All rendering now flows through JarvisStatefulBackdrop and JarvisVisualStateManager:
 * - STATE 1: Normal Wallpaper (default: Changeable_wallpaper.mp4)
 * - STATE 2: Jarvis Awake Idle (Awake_jarvis_normal_state.mp4)
 * - STATE 3: Jarvis Short Command (Jarvis_doing_short_command.mp4)
 * - STATE 4: Jarvis Long Task (Jarvis_doing_long_command.mp4)
 * - STATE 5: Jarvis Hand Control (JarvisEnergySphereV4 - Three.js WebGL)
 */

import React from 'react';
import { JarvisReactionState } from '../services/assistService';
import { JarvisStatefulBackdrop } from './jarvis/JarvisStatefulBackdrop';
import { JarvisVisualState } from '../services/jarvis/jarvisVisualStateManager';

export interface JarvisFuturisticLiveWallpaperProps {
  reactionState?: JarvisReactionState;
  forceAwakeMode?: boolean;
  interactive?: boolean;
  onReactorTap?: () => void;
  className?: string;
}

export const JarvisFuturisticLiveWallpaper: React.FC<JarvisFuturisticLiveWallpaperProps> = ({
  forceAwakeMode,
  interactive = true,
  className = '',
}) => {
  const forcedState: JarvisVisualState | undefined = forceAwakeMode
    ? 'JARVIS_AWAKE_IDLE'
    : undefined;

  return (
    <JarvisStatefulBackdrop
      forceState={forcedState}
      interactive={interactive}
      className={className}
    />
  );
};

export {
  dispatchJarvisTouchRipple,
  dispatchJarvisTouchDrag,
} from './jarvis/JarvisStatefulBackdrop';
