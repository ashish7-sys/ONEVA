/**
 * ONEVA Architecture: Jarvis Stateful Backdrop
 *
 * Implements the 5 unified visual states with seamless video looping, zero black frames,
 * independent normal wallpaper preservation, and WebGL V4 Energy Sphere rendering.
 *
 * States:
 * 1. JARVIS_NOT_AWAKE -> User's normal wallpaper (default: Changeable_wallpaper.mp4)
 * 2. JARVIS_AWAKE_IDLE -> Awake_jarvis_normal_state.mp4 (seamless loop)
 * 3. JARVIS_SHORT_COMMAND -> Jarvis_doing_short_command.mp4 (seamless loop)
 * 4. JARVIS_LONG_TASK -> Jarvis_doing_long_command.mp4 (seamless loop)
 * 5. JARVIS_HAND_CONTROL -> JarvisEnergySphereV4 (Three.js WebGL with 24,000 particles)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  JarvisVisualStateManager,
  JarvisVisualState,
  JARVIS_ASSETS,
} from '../../services/jarvis/jarvisVisualStateManager';
import { WallpaperService, WallpaperConfig } from '../../services/wallpaperService';
import { LauncherSettingsService, WALLPAPER_PRESETS } from '../../launcher/services/launcherSettingsService';
import { JarvisEnergySphereV4, JarvisEnergySphereRef } from './JarvisEnergySphereV4';
import { HandControlService } from '../../services/intelligence/gestures/handControlService';
import { HandControlServiceState } from '../../types/jarvisHandControl';

export interface JarvisStatefulBackdropProps {
  className?: string;
  forceState?: JarvisVisualState;
  interactive?: boolean;
}

export const JarvisStatefulBackdrop: React.FC<JarvisStatefulBackdropProps> = ({
  className = '',
  forceState,
  interactive = true,
}) => {
  const [visualState, setVisualState] = useState<JarvisVisualState>(
    forceState || JarvisVisualStateManager.getState()
  );
  const [wallpaperConfig, setWallpaperConfig] = useState<WallpaperConfig>(
    WallpaperService.getConfig()
  );

  // References to video players for each Jarvis state
  const normalVideoRef = useRef<HTMLVideoElement | null>(null);
  const awakeVideoRef = useRef<HTMLVideoElement | null>(null);
  const shortCmdVideoRef = useRef<HTMLVideoElement | null>(null);
  const longTaskVideoRef = useRef<HTMLVideoElement | null>(null);

  // V4 Sphere ref for air gestures
  const sphereRef = useRef<JarvisEnergySphereRef | null>(null);

  // Sync state subscriptions
  useEffect(() => {
    if (forceState) {
      setVisualState(forceState);
      return;
    }

    const unsubVisual = JarvisVisualStateManager.subscribe((state) => {
      setVisualState(state);
    });

    const unsubWallpaper = WallpaperService.subscribe(() => {
      setWallpaperConfig(WallpaperService.getConfig());
    });

    return () => {
      unsubVisual();
      unsubWallpaper();
    };
  }, [forceState]);

  // Connect HandControlService air gestures to V4 Energy Sphere actions
  useEffect(() => {
    if (visualState !== 'JARVIS_HAND_CONTROL') return;

    const unsubHand = HandControlService.subscribe((state: HandControlServiceState) => {
      if (!sphereRef.current) return;

      const gesture = state.activeGesture;
      if (!gesture) return;

      switch (gesture) {
        case 'swipe_left':
          sphereRef.current.rotate(-40, 0);
          break;
        case 'swipe_right':
          sphereRef.current.rotate(40, 0);
          break;
        case 'swipe_up':
          sphereRef.current.rotate(0, -40);
          break;
        case 'swipe_down':
          sphereRef.current.rotate(0, 40);
          break;
        case 'two_finger_point':
          sphereRef.current.touchEnergy(0, 0, 1.4);
          break;
        case 'closed_fist':
          sphereRef.current.touchEnergy(0, 0, 2.2);
          sphereRef.current.energyBurst();
          break;
        case 'open_palm':
          sphereRef.current.colorChange(0.2);
          break;
        case 'thumbs_up':
          sphereRef.current.zoom(100);
          break;
      }
    });

    return () => {
      unsubHand();
    };
  }, [visualState]);

  // Video playback management: play active video, pause inactive to save CPU/battery
  useEffect(() => {
    const playSafe = (vid: HTMLVideoElement | null) => {
      if (!vid) return;
      vid.muted = true;
      vid.volume = 0;
      if (vid.paused) {
        const promise = vid.play();
        if (promise !== undefined) {
          promise.catch((err) => {
            console.debug('[JarvisBackdrop] Autoplay caught:', err);
          });
        }
      }
    };

    const pauseSafe = (vid: HTMLVideoElement | null) => {
      if (!vid) return;
      vid.pause();
    };

    if (visualState === 'JARVIS_NOT_AWAKE') {
      playSafe(normalVideoRef.current);
      pauseSafe(awakeVideoRef.current);
      pauseSafe(shortCmdVideoRef.current);
      pauseSafe(longTaskVideoRef.current);
    } else if (visualState === 'JARVIS_AWAKE_IDLE') {
      pauseSafe(normalVideoRef.current);
      playSafe(awakeVideoRef.current);
      pauseSafe(shortCmdVideoRef.current);
      pauseSafe(longTaskVideoRef.current);
    } else if (visualState === 'JARVIS_SHORT_COMMAND') {
      pauseSafe(normalVideoRef.current);
      pauseSafe(awakeVideoRef.current);
      playSafe(shortCmdVideoRef.current);
      pauseSafe(longTaskVideoRef.current);
    } else if (visualState === 'JARVIS_LONG_TASK') {
      pauseSafe(normalVideoRef.current);
      pauseSafe(awakeVideoRef.current);
      pauseSafe(shortCmdVideoRef.current);
      playSafe(longTaskVideoRef.current);
    } else if (visualState === 'JARVIS_HAND_CONTROL') {
      pauseSafe(normalVideoRef.current);
      pauseSafe(awakeVideoRef.current);
      pauseSafe(shortCmdVideoRef.current);
      pauseSafe(longTaskVideoRef.current);
    }
  }, [visualState]);

  // Pause videos on background tab/screen off
  useEffect(() => {
    const handleVisibility = () => {
      const isHidden = document.hidden;
      const getActiveVideo = () => {
        switch (visualState) {
          case 'JARVIS_NOT_AWAKE':
            return normalVideoRef.current;
          case 'JARVIS_AWAKE_IDLE':
            return awakeVideoRef.current;
          case 'JARVIS_SHORT_COMMAND':
            return shortCmdVideoRef.current;
          case 'JARVIS_LONG_TASK':
            return longTaskVideoRef.current;
          default:
            return null;
        }
      };

      const vid = getActiveVideo();
      if (!vid) return;

      if (isHidden) {
        vid.pause();
      } else {
        vid.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [visualState]);

  // Determine normal wallpaper display (video or preset gradient/image)
  const isNormalDefaultVideo =
    !wallpaperConfig.activePresetId ||
    wallpaperConfig.activePresetId === 'changeable-wallpaper' ||
    wallpaperConfig.activePresetId === 'live-wp-changeable' ||
    wallpaperConfig.customWallpaperData === JARVIS_ASSETS.normalDefault.localUrl ||
    wallpaperConfig.activePresetId === 'default';

  const normalPreset = WALLPAPER_PRESETS.find((p) => p.id === wallpaperConfig.activePresetId);
  const normalCustomVideoUrl =
    wallpaperConfig.customWallpaperData &&
    (wallpaperConfig.customWallpaperData.endsWith('.mp4') ||
      wallpaperConfig.customWallpaperData.includes('video') ||
      wallpaperConfig.customWallpaperData.includes('data:video'));

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black ${className}`}>
      {/* ========================================================================= */}
      {/* STATE 1: NORMAL WALLPAPER (Visible only when JARVIS_NOT_AWAKE)             */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
          visualState === 'JARVIS_NOT_AWAKE' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        {isNormalDefaultVideo ? (
          <video
            ref={normalVideoRef}
            src={JARVIS_ASSETS.normalDefault.localUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={(e) => console.warn('[JarvisBackdrop] Normal video playback notice:', e)}
            className="w-full h-full object-cover"
          />
        ) : normalCustomVideoUrl ? (
          <video
            ref={normalVideoRef}
            src={wallpaperConfig.customWallpaperData}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={(e) => console.warn('[JarvisBackdrop] Custom video playback notice:', e)}
            className="w-full h-full object-cover"
          />
        ) : wallpaperConfig.customWallpaperData ? (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${wallpaperConfig.customWallpaperData})` }}
          />
        ) : normalPreset ? (
          <div
            className="w-full h-full"
            style={{ background: normalPreset.cssBackground }}
          />
        ) : (
          <video
            ref={normalVideoRef}
            src={JARVIS_ASSETS.normalDefault.localUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={(e) => console.warn('[JarvisBackdrop] Fallback video playback notice:', e)}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* STATE 2: JARVIS AWAKE IDLE (Awake_jarvis_normal_state.mp4)                */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
          visualState === 'JARVIS_AWAKE_IDLE' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <video
          ref={awakeVideoRef}
          src={JARVIS_ASSETS.awakeIdle.localUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={(e) => console.warn('[JarvisBackdrop] Awake video playback notice:', e)}
          className="w-full h-full object-cover"
        />
      </div>

      {/* ========================================================================= */}
      {/* STATE 3: JARVIS SHORT COMMAND (Jarvis_doing_short_command.mp4)             */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
          visualState === 'JARVIS_SHORT_COMMAND' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <video
          ref={shortCmdVideoRef}
          src={JARVIS_ASSETS.shortCommand.localUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={(e) => console.warn('[JarvisBackdrop] Short command video playback notice:', e)}
          className="w-full h-full object-cover"
        />
      </div>

      {/* ========================================================================= */}
      {/* STATE 4: JARVIS LONG TASK (Jarvis_doing_long_command.mp4)                  */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
          visualState === 'JARVIS_LONG_TASK' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <video
          ref={longTaskVideoRef}
          src={JARVIS_ASSETS.longTask.localUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={(e) => console.warn('[JarvisBackdrop] Long task video playback notice:', e)}
          className="w-full h-full object-cover"
        />
      </div>

      {/* ========================================================================= */}
      {/* STATE 5: JARVIS HAND CONTROL (V4 Three.js Energy Sphere)                  */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
          visualState === 'JARVIS_HAND_CONTROL'
            ? 'opacity-100 z-20 pointer-events-auto'
            : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <JarvisEnergySphereV4
          ref={sphereRef}
          isActive={visualState === 'JARVIS_HAND_CONTROL'}
        />
      </div>

      {/* Atmospheric depth vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/60 pointer-events-none z-10" />
    </div>
  );
};

export function dispatchJarvisTouchRipple(clientX: number, clientY: number): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('oneva-jarvis-touch-ripple', {
        detail: { x: clientX, y: clientY, timestamp: Date.now() },
      })
    );
  }
}

export function dispatchJarvisTouchDrag(clientX: number, clientY: number, isDown: boolean): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('oneva-jarvis-touch-drag', {
        detail: { x: clientX, y: clientY, isDown, timestamp: Date.now() },
      })
    );
  }
}

