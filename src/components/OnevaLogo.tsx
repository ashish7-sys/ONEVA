import React from 'react';
import { ONEVA_OFFICIAL_LOGO, ONEVA_LOGO_ALT } from '../constants/brandAssets';

export type OnevaLogoVariant =
  | 'header'
  | 'splash'
  | 'hero'
  | 'app_icon'
  | 'card'
  | 'badge'
  | 'admin'
  | 'custom';

interface OnevaLogoProps {
  variant?: OnevaLogoVariant;
  className?: string;
  imgClassName?: string;
  id?: string;
  onClick?: () => void;
  priority?: boolean;
}

const VARIANT_CONTAINER_STYLES: Record<OnevaLogoVariant, string> = {
  header: 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center',
  splash: 'w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-3xl overflow-hidden shrink-0 flex items-center justify-center',
  hero: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center',
  app_icon: 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center',
  card: 'w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center',
  badge: 'w-5 h-5 rounded-md overflow-hidden shrink-0 flex items-center justify-center',
  admin: 'w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center',
  custom: 'shrink-0 flex items-center justify-center',
};

export function OnevaLogo({
  variant = 'header',
  className = '',
  imgClassName = '',
  id,
  onClick,
}: OnevaLogoProps) {
  const containerClass = `${VARIANT_CONTAINER_STYLES[variant]} ${className}`.trim();

  return (
    <div
      id={id}
      onClick={onClick}
      className={containerClass}
      style={{
        aspectRatio: '1 / 1',
      }}
    >
      {/* 
        CRITICAL ARCHITECTURAL DIRECTIVE:
        The official ONEVA logo is locked and approved.
        Always preserve exact aspect ratio and proportions with object-contain.
        Never crop, stretch, recolor, or filter the artwork.
      */}
      <img
        src={ONEVA_OFFICIAL_LOGO}
        alt={ONEVA_LOGO_ALT}
        className={`w-full h-full object-contain select-none pointer-events-none ${imgClassName}`}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
