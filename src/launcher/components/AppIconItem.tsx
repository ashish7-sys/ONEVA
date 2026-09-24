import React, { useState, useRef, useMemo } from 'react';
import {
  Phone,
  MessageSquare,
  Camera,
  Globe,
  Image as ImageIcon,
  Clock,
  Calendar,
  Calculator,
  Folder,
  FileText,
  Music,
  Settings,
  Users,
  CloudSun,
  Layers,
  Youtube,
  MessageCircle,
  Instagram,
  Sparkles,
  Zap,
  Check,
} from 'lucide-react';
import { AppShortcut, IconShape } from '../types';
import { AppModificationEngine } from '../services/appModificationEngine';

interface AppIconItemProps {
  app: AppShortcut;
  iconShape?: IconShape;
  showLabel?: boolean;
  onLaunch: (app: AppShortcut) => void;
  onLongPress?: (app: AppShortcut, e: React.MouseEvent | React.TouchEvent) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Phone,
  MessageSquare,
  Camera,
  Globe,
  Image: ImageIcon,
  Clock,
  Calendar,
  Calculator,
  Folder,
  FileText,
  Music,
  Settings,
  Users,
  CloudSun,
  Layers,
  Youtube,
  MessageCircle,
  Instagram,
  Sparkles,
  Zap,
  Check,
};

export function AppIconItem({
  app,
  iconShape = 'squircle',
  showLabel = true,
  onLaunch,
  onLongPress,
}: AppIconItemProps) {
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredLongPress = useRef<boolean>(false);

  // Dynamically resolve visual tokens via AppModificationEngine with fallback
  const visuals = useMemo(() => {
    return AppModificationEngine.resolveVisuals(app);
  }, [app]);

  // Dynamic vibrant glow animation class based on color and identity
  const glowAnimationClass = useMemo(() => {
    const color = (visuals.accentColor || '').toLowerCase();
    if (color.includes('#10b981') || color.includes('16, 185') || color.includes('emerald') || app.packageName.includes('oneva')) {
      return 'animate-glow-neon';
    }
    if (color.includes('#3b82f6') || color.includes('blue')) {
      return 'animate-glow-blue';
    }
    if (color.includes('#0ea5e9') || color.includes('#06b6d4') || color.includes('sky') || color.includes('cyan')) {
      return 'animate-glow-sky';
    }
    if (color.includes('#ec4899') || color.includes('#d946ef') || color.includes('pink') || color.includes('instagram')) {
      return 'animate-glow-pink';
    }
    if (color.includes('#ef4444') || color.includes('#e11d48') || color.includes('red') || color.includes('youtube')) {
      return 'animate-glow-red';
    }
    if (color.includes('#8b5cf6') || color.includes('#a855f7') || color.includes('purple')) {
      return 'animate-glow-electric';
    }
    if (color.includes('#f59e0b') || color.includes('#eab308') || color.includes('amber')) {
      return 'animate-glow-amber';
    }
    const colors = ['animate-glow-neon', 'animate-glow-sky', 'animate-glow-pink', 'animate-glow-electric', 'animate-glow-blue', 'animate-glow-amber'];
    const idx = (app.id.charCodeAt(0) + app.id.length) % colors.length;
    return colors[idx];
  }, [visuals.accentColor, app.packageName, app.id]);

  const IconComponent = ICON_MAP[visuals.iconName] || null;

  // Icon Shape Style mapping
  const shapeClasses = {
    squircle: 'rounded-[1.125rem]',
    rounded: 'rounded-xl',
    circle: 'rounded-full',
  }[iconShape];

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPressed(true);
    hasTriggeredLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      hasTriggeredLongPress.current = true;
      if (onLongPress) {
        onLongPress(app, e);
      }
    }, 550);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (!hasTriggeredLongPress.current) {
      onLaunch(app);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPressed(true);
    hasTriggeredLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      hasTriggeredLongPress.current = true;
      if (onLongPress) {
        onLongPress(app, e);
      }
    }, 550);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (!hasTriggeredLongPress.current) {
      onLaunch(app);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLongPress) {
      onLongPress(app, e);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      title={app.label}
      aria-label={`Launch ${app.label}`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onLaunch(app);
        }
      }}
      className="group relative flex flex-col items-center justify-start p-1.5 focus:outline-none cursor-pointer select-none"
    >
      {/* Icon Frame */}
      <div
        style={{
          boxShadow: isPressed
            ? '0 2px 8px rgba(0,0,0,0.5)'
            : '0 4px 14px -2px rgba(0,0,0,0.35)',
        }}
        className={`w-13 h-13 sm:w-14 sm:h-14 flex items-center justify-center transition-all duration-200 ease-out border-2 border-white/25 hover:border-white/60 ${shapeClasses} ${glowAnimationClass} ${
          isPressed ? 'scale-90 opacity-90' : 'hover:scale-105 active:scale-95'
        }`}
      >
        <div
          className={`w-full h-full ${shapeClasses} flex items-center justify-center relative overflow-hidden`}
          style={{
            background: `linear-gradient(145deg, ${visuals.accentColor}25 0%, rgba(24, 24, 27, 0.9) 100%)`,
          }}
        >
          {/* Subtle top edge highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {app.packageName.includes('oneva') || visuals.iconName.startsWith('/') || visuals.iconName.startsWith('http') || visuals.iconName.startsWith('data:') ? (
            /*
              CRITICAL: Android App Icon Rule 4
              Fit complete source image inside available icon area.
              Preserve original proportions, never crop, never stretch.
            */
            <img
              src={app.packageName.includes('oneva') ? '/oneva_logo.png' : visuals.iconName}
              alt={visuals.label}
              className="w-full h-full object-contain p-1 select-none pointer-events-none drop-shadow-sm"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ) : IconComponent ? (
            <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-sm transition-transform group-hover:scale-110" />
          ) : (
            // Safe Fallback Icon on error or missing asset
            <div
              className="w-full h-full flex items-center justify-center font-bold text-white text-base font-sans"
              style={{ backgroundColor: `${visuals.accentColor}30` }}
            >
              {app.fallbackInitial || visuals.label.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Discreet indicator dot if app has an active ONEVA visual enhancement */}
          {visuals.isEnhanced && (
            <div
              title="Enhanced by ONEVA"
              className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm"
            />
          )}
        </div>
      </div>

      {/* App Label */}
      {showLabel && (
        <span className="mt-1.5 text-[11px] sm:text-xs font-medium text-neutral-200/90 tracking-normal text-center truncate max-w-[4.25rem] sm:max-w-[4.75rem] drop-shadow-sm">
          {visuals.label}
        </span>
      )}
    </div>
  );
}
