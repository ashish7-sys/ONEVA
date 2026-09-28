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
import { JarvisSpeechManager } from '../../services/voice/jarvisSpeechManager';

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
  const [isSpeaking, setIsSpeaking] = useState<boolean>(JarvisSpeechManager.isSpeaking());
  const [speechIntensity, setSpeechIntensity] = useState<number>(JarvisSpeechManager.getAudioIntensity());

  // References to video players for each Jarvis state
  const normalVideoRef = useRef<HTMLVideoElement | null>(null);
  const awakeVideoRef = useRef<HTMLVideoElement | null>(null);
  const shortCmdVideoRef = useRef<HTMLVideoElement | null>(null);
  const longTaskVideoRef = useRef<HTMLVideoElement | null>(null);

  // V4 Sphere ref for air gestures and speech reactivity
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

    const unsubSpeechStart = JarvisSpeechManager.onSpeechStarted(() => {
      setIsSpeaking(true);
    });

    const unsubSpeechEnd = JarvisSpeechManager.onSpeechFinished(() => {
      setIsSpeaking(false);
      setSpeechIntensity(0.0);
    });

    const unsubSpeechCancel = JarvisSpeechManager.onSpeechCancelled(() => {
      setIsSpeaking(false);
      setSpeechIntensity(0.0);
    });

    const unsubIntensity = JarvisSpeechManager.onSpeechIntensity((intensity) => {
      setSpeechIntensity(intensity);
    });

    return () => {
      unsubVisual();
      unsubWallpaper();
      unsubSpeechStart();
      unsubSpeechEnd();
      unsubSpeechCancel();
      unsubIntensity();
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

  // Video playback management: normal wallpaper always plays; state loops play when needed
  useEffect(() => {
    const playSafe = (vid: HTMLVideoElement | null) => {
      if (!vid) return;
      vid.muted = true;
      vid.volume = 0;
      if (vid.paused) {
        const promise = vid.play();
        if (promise !== undefined) {
          promise.catch(() => {});
        }
      }
    };

    const pauseSafe = (vid: HTMLVideoElement | null) => {
      if (!vid) return;
      vid.pause();
    };

    // Normal wallpaper stays playing or active in background
    playSafe(normalVideoRef.current);

    if (visualState === 'JARVIS_NOT_AWAKE') {
      pauseSafe(awakeVideoRef.current);
      pauseSafe(shortCmdVideoRef.current);
      pauseSafe(longTaskVideoRef.current);
    } else if (visualState === 'JARVIS_AWAKE_IDLE') {
      playSafe(awakeVideoRef.current);
      pauseSafe(shortCmdVideoRef.current);
      pauseSafe(longTaskVideoRef.current);
    } else if (visualState === 'JARVIS_SHORT_COMMAND') {
      pauseSafe(awakeVideoRef.current);
      playSafe(shortCmdVideoRef.current);
      pauseSafe(longTaskVideoRef.current);
    } else if (visualState === 'JARVIS_LONG_TASK') {
      pauseSafe(awakeVideoRef.current);
      pauseSafe(shortCmdVideoRef.current);
      playSafe(longTaskVideoRef.current);
    } else if (visualState === 'JARVIS_HAND_CONTROL') {
      pauseSafe(awakeVideoRef.current);
      pauseSafe(shortCmdVideoRef.current);
      pauseSafe(longTaskVideoRef.current);
    }
  }, [visualState]);

  // Pause videos on background tab/screen off
  useEffect(() => {
    const handleVisibility = () => {
      const isHidden = document.hidden;
      if (isHidden) {
        normalVideoRef.current?.pause();
        awakeVideoRef.current?.pause();
        shortCmdVideoRef.current?.pause();
        longTaskVideoRef.current?.pause();
      } else {
        normalVideoRef.current?.play().catch(() => {});
        if (visualState === 'JARVIS_AWAKE_IDLE') awakeVideoRef.current?.play().catch(() => {});
        if (visualState === 'JARVIS_SHORT_COMMAND') shortCmdVideoRef.current?.play().catch(() => {});
        if (visualState === 'JARVIS_LONG_TASK') longTaskVideoRef.current?.play().catch(() => {});
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

  const isJarvisAwake = visualState !== 'JARVIS_NOT_AWAKE';

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black ${className}`}>
      {/* ========================================================================= */}
      {/* BASE LAYER: NORMAL WALLPAPER (Always visible as base, never destroyed)    */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {isNormalDefaultVideo ? (
          <video
            ref={normalVideoRef}
            src={JARVIS_ASSETS.normalDefault.localUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={(e) => console.warn('[JarvisBackdrop] Normal video notice:', e)}
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
            onError={(e) => console.warn('[JarvisBackdrop] Custom video notice:', e)}
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
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* JARVIS REACTIVE VISUAL LAYER (Visible over wallpaper ONLY when AWAKE)     */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-in-out z-10 ${
          isJarvisAwake ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* State 2: Awake Idle Backdrop Loop */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
            visualState === 'JARVIS_AWAKE_IDLE' && !isSpeaking ? 'opacity-90' : 'opacity-0 pointer-events-none'
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
            className="w-full h-full object-cover mix-blend-screen"
          />
        </div>

        {/* State 3: Short Command Execution */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
            visualState === 'JARVIS_SHORT_COMMAND' ? 'opacity-90' : 'opacity-0 pointer-events-none'
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
            className="w-full h-full object-cover mix-blend-screen"
          />
        </div>

        {/* State 4: Long Task / Research Loop */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
            visualState === 'JARVIS_LONG_TASK' ? 'opacity-90' : 'opacity-0 pointer-events-none'
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
            className="w-full h-full object-cover mix-blend-screen"
          />
        </div>

        {/* State 5 & Reactive Speaking: 3D Energy Sphere (Three.js WebGL with dynamic audio intensity) */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
            visualState === 'JARVIS_HAND_CONTROL' || (isJarvisAwake && isSpeaking)
              ? 'opacity-100 z-20 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <JarvisEnergySphereV4
            ref={sphereRef}
            isActive={visualState === 'JARVIS_HAND_CONTROL' || (isJarvisAwake && isSpeaking)}
            isSpeaking={isSpeaking}
            speechIntensity={speechIntensity}
          />
        </div>
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

