import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { CatalogApp } from '../types/catalogAndIcons';

interface CatalogAppIconProps {
  app: CatalogApp | {
    name: string;
    appName?: string;
    packageName: string;
    defaultIcon?: string;
    icon?: string;
    iconKey?: string;
    iconPath?: string;
    accentColor?: string;
    fallbackInitial?: string;
    isSystemApp?: boolean;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallbackBadge?: boolean;
  customIconOverride?: string;
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6 text-xs', icon: 12 },
  sm: { box: 'w-8 h-8 text-xs', icon: 16 },
  md: { box: 'w-10 h-10 text-sm', icon: 20 },
  lg: { box: 'w-12 h-12 text-base', icon: 24 },
  xl: { box: 'w-16 h-16 text-xl', icon: 32 },
};

export function CatalogAppIcon({
  app,
  size = 'md',
  className = '',
  showFallbackBadge = false,
  customIconOverride,
}: CatalogAppIconProps) {
  const [svgLoadError, setSvgLoadError] = useState(false);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  // 0. Individual custom icon override
  if (customIconOverride) {
    const CustomLucide = (LucideIcons as any)[customIconOverride] || LucideIcons.Sparkles;
    const accent = app.accentColor || '#38bdf8';
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl border border-cyan-500/40 bg-neutral-900 font-medium shrink-0 overflow-hidden shadow-inner ${sizeConfig.box} ${className}`}
        style={{
          boxShadow: `inset 0 0 12px ${accent}25`,
        }}
        title={`${app.name} (Custom Icon: ${customIconOverride})`}
      >
        <CustomLucide size={sizeConfig.icon} style={{ color: accent }} />
      </div>
    );
  }

  // 1. ONEVA Official Logo Mandate: Never replace or generate fake branding
  if (app.packageName === 'com.oneva.android.launcher') {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl bg-neutral-900 border border-emerald-500/30 overflow-hidden shrink-0 ${sizeConfig.box} ${className}`}
      >
        <img
          src="/oneva_logo.png"
          alt="ONEVA"
          className="w-full h-full object-contain p-1"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // 2. Uploaded icon asset (SVG / PNG / JPEG attached by user or admin)
  const uploadedAssetUrl = (app as any).iconAsset?.url || (app as any).iconAsset?.dataUrl;
  if (uploadedAssetUrl) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800/80 overflow-hidden shrink-0 p-1.5 shadow-sm ${sizeConfig.box} ${className}`}
      >
        <img
          src={uploadedAssetUrl}
          alt={app.name || 'App icon'}
          className="w-full h-full object-contain transition-transform duration-200"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // 3. For extended apps or apps explicitly marked 'not_uploaded', render structured monogram/Lucide fallback
  const isPendingUpload = (app as any).iconStatus === 'not_uploaded';
  if (isPendingUpload || svgLoadError) {
    // Resolve Lucide Icon component dynamically
    const iconName = app.defaultIcon || app.icon || 'Smartphone';
    const LucideComponent = (LucideIcons as any)[iconName] || LucideIcons.Smartphone;
    const accent = app.accentColor || '#38bdf8';
    const initial = (app.fallbackInitial || app.name?.charAt(0) || 'A').toUpperCase();

    return (
      <div
        className={`relative flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 font-medium shrink-0 overflow-hidden shadow-inner ${sizeConfig.box} ${className}`}
        style={{
          boxShadow: `inset 0 0 12px ${accent}15`,
          borderColor: `${accent}30`,
        }}
        title={`${app.name} (${isPendingUpload ? 'Icon asset pending upload' : 'Fallback active'})`}
      >
        {LucideComponent ? (
          <LucideComponent size={sizeConfig.icon} style={{ color: accent }} />
        ) : (
          <span style={{ color: accent }} className="font-bold">
            {initial}
          </span>
        )}

        {showFallbackBadge && (
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"
            title="Icon asset pending; dynamic fallback active"
          />
        )}
      </div>
    );
  }

  // 4. Derive SVG asset path
  const svgKey = app.iconKey || `${(app.name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;
  const targetSvgPath = app.iconPath || `/icons/${svgKey}`;

  // 5. Primary SVG Rendering Path
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800/80 overflow-hidden shrink-0 p-1.5 shadow-sm ${sizeConfig.box} ${className}`}
    >
      <img
        src={targetSvgPath}
        alt={app.name || 'App icon'}
        className="w-full h-full object-contain transition-transform duration-200"
        onError={() => setSvgLoadError(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
