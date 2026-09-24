import { useState } from 'react';
import {
  Search,
  Check,
  CheckCircle2,
  Sparkles,
  Layers,
  Sliders,
  Youtube,
  MessageCircle,
  Camera,
  Compass,
  MapPin,
  HardDrive,
  Phone,
  Image as ImageIcon,
  Mail,
  Music,
  Play,
  Calendar,
  Clock,
  Settings,
} from 'lucide-react';
import { OnevaAsset } from '../../types/adminAssets';
import { IconService } from '../../services/iconService';
import { AdvancedIconSystem } from '../../services/advancedIconSystem';
import { PlatformBridge } from '../../launcher/services/platformBridge';

interface IconPackInteractivePreviewProps {
  asset: OnevaAsset;
  onApplyPack?: () => void;
}

export function IconPackInteractivePreview({ asset }: IconPackInteractivePreviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const accentColor = asset.previewData?.color || '#06b6d4';

  const defaultIcons = [
    { name: 'YouTube', package: 'com.google.android.youtube', label: 'YT', bg: '#ef4444', icon: Youtube },
    { name: 'WhatsApp', package: 'com.whatsapp', label: 'WA', bg: '#22c55e', icon: MessageCircle },
    { name: 'Instagram', package: 'com.instagram.android', label: 'IG', bg: '#e1306c', icon: Camera },
    { name: 'Chrome', package: 'com.android.chrome', label: 'CR', bg: '#3b82f6', icon: Compass },
    { name: 'Google Maps', package: 'com.google.android.apps.maps', label: 'MP', bg: '#10b981', icon: MapPin },
    { name: 'Google Drive', package: 'com.google.android.apps.docs', label: 'DR', bg: '#f59e0b', icon: HardDrive },
    { name: 'Phone', package: 'com.google.android.dialer', label: 'PH', bg: '#06b6d4', icon: Phone },
    { name: 'Camera', package: 'com.android.camera2', label: 'CA', bg: '#8b5cf6', icon: Camera },
    { name: 'Gallery', package: 'com.google.android.apps.photos', label: 'GL', bg: '#ec4899', icon: ImageIcon },
    { name: 'Gmail', package: 'com.google.android.gm', label: 'GM', bg: '#ea4335', icon: Mail },
    { name: 'Spotify', package: 'com.spotify.music', label: 'SP', bg: '#1db954', icon: Music },
    { name: 'Netflix', package: 'com.netflix.mediaclient', label: 'NF', bg: '#e50914', icon: Play },
    { name: 'Calendar', package: 'com.google.android.calendar', label: 'CL', bg: '#4285f4', icon: Calendar },
    { name: 'Clock', package: 'com.google.android.deskclock', label: 'CK', bg: '#fbbc04', icon: Clock },
    { name: 'Settings', package: 'com.android.settings', label: 'ST', bg: '#5f6368', icon: Settings },
  ];

  const filteredIcons = defaultIcons.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.package.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Pack Header Specs */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${accentColor}25`, border: `1px solid ${accentColor}60`, color: accentColor }}
          >
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Universal Icon Hierarchy</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                Priority Chain
              </span>
            </h4>
            <p className="text-[10px] text-neutral-400 font-mono">
              Individual Override → Pack Override → Global Pack → Fallback
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-white font-mono">
            {asset.previewData?.glyphCount || 1250}+
          </div>
          <div className="text-[9px] text-neutral-400">Total Glyphs</div>
        </div>
      </div>

      {/* Search Input for App Icon Lookup */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search app support (e.g. WhatsApp, YouTube, Chrome)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/60 border border-white/10 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 backdrop-blur-md"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-400 hover:text-white px-1.5 py-0.5 rounded bg-white/10"
          >
            Clear
          </button>
        )}
      </div>

      {/* Grid of Verified App Icons */}
      <div className="rounded-3xl bg-neutral-950/80 border border-white/10 p-4 space-y-3 backdrop-blur-xl">
        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
          <span>Genuine Android App Matches ({filteredIcons.length})</span>
          <span>Tap icon to inspect package</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-h-64 overflow-y-auto no-scrollbar p-1">
          {filteredIcons.map((app) => {
            const Icon = app.icon;
            const isSelected = selectedApp === app.package;
            return (
              <button
                key={app.package}
                type="button"
                onClick={() => {
                  PlatformBridge.performHapticFeedback('selection');
                  setSelectedApp(isSelected ? null : app.package);
                }}
                className={`p-2.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all text-center select-none border ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400/80 shadow-lg shadow-cyan-950/50 scale-105'
                    : 'bg-black/50 border-white/10 hover:bg-black/30 hover:border-white/20'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${app.bg}40 0%, #000000 100%)`,
                    border: `1px solid ${accentColor}40`,
                  }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[11px] font-medium text-white truncate max-w-full">
                  {app.name}
                </span>
                <span className="text-[8px] font-mono text-cyan-300/80 uppercase">
                  Verified
                </span>
              </button>
            );
          })}
        </div>

        {selectedApp && (
          <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs flex items-center justify-between animate-in fade-in duration-150">
            <div>
              <span className="text-neutral-400 text-[10px] font-mono">Package Target:</span>
              <div className="font-mono text-cyan-300 font-bold text-xs">{selectedApp}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                PlatformBridge.performHapticFeedback('confirm');
                IconService.setIndividualAppIcon(selectedApp, asset.id);
                IconService.setIndividualPackOverride(selectedApp, asset.id);
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-[10px] font-mono transition shadow-md"
            >
              Set Override
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
