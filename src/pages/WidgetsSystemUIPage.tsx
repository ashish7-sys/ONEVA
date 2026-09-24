import { useState, useEffect } from 'react';
import {
  Sliders,
  Search,
  Volume2,
  VolumeX,
  Wifi,
  Bluetooth,
  BatteryCharging,
  Clock,
  Sparkles,
  CheckCircle2,
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  Radio,
  Flashlight,
  RotateCw,
  Plane,
  Sun,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import {
  WidgetsSystemUIService,
  WidgetsSystemUIConfig,
  SearchBarStyle,
  TileShape,
  BatteryStyle,
  WifiStyle,
  SignalStyle,
  ClockStyle,
  VolumePanelStyle,
  SYSTEM_UI_CAPABILITIES,
} from '../services/widgetsSystemUIService';
import { PlatformBridge } from '../launcher/services/platformBridge';

interface WidgetsSystemUIPageProps {
  onNavigateBack?: () => void;
}

export function WidgetsSystemUIPage({ onNavigateBack }: WidgetsSystemUIPageProps) {
  const [config, setConfig] = useState<WidgetsSystemUIConfig>(WidgetsSystemUIService.getConfig());
  const [activeTab, setActiveTab] = useState<'all' | 'search' | 'quick_settings' | 'volume' | 'status'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Quick Settings interactive states
  const [tileStates, setTileStates] = useState<Record<string, boolean>>({
    wifi: true,
    bluetooth: true,
    mobile_data: true,
    flashlight: false,
    rotation: true,
    airplane_mode: false,
    battery_saver: false,
    hotspot: false,
    location: true,
  });

  useEffect(() => {
    return WidgetsSystemUIService.subscribe(() => {
      setConfig(WidgetsSystemUIService.getConfig());
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTileToggle = (tileId: string) => {
    PlatformBridge.performHapticFeedback('selection');
    setTileStates((prev) => ({ ...prev, [tileId]: !prev[tileId] }));
  };

  const accentColor = WidgetsSystemUIService.getActiveAccentColor();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-32 text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-cyan-500/40 text-cyan-200 text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Widgets &amp; System UI</h1>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Customize real supported Android elements: Search Bar, Quick Settings, Volume Slider, and Status Glyphs.
            </p>
          </div>
        </div>

        {/* Technical Policy Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real Android APIs Only • Zero Faked Controls</span>
        </div>
      </div>

      {/* Technical Distinction Accordion Notice */}
      <div className="p-4 rounded-2xl bg-[#081026] border border-cyan-500/20 text-xs space-y-2">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white">ONEVA Technical Capability Rule</span>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              ONEVA customizes components where Android technically permits: Launcher home search bars, system volume overlays, and accessibility quick action panels.
              Third-party in-app search fields (e.g. inside WhatsApp or Chrome) are strictly isolated by Android security sandbox and cannot be modified. ONEVA never fakes success.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Components' },
          { id: 'search', label: 'Search Bar' },
          { id: 'quick_settings', label: 'Quick Settings' },
          { id: 'volume', label: 'Volume Panel' },
          { id: 'status', label: 'Status & Glyphs' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-950/40 font-bold'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. SEARCH BAR CUSTOMIZATION */}
      {(activeTab === 'all' || activeTab === 'search') && (
        <section className="p-5 sm:p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Search className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-base font-bold text-white">System &amp; Launcher Search Bar</h2>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Supported via ONEVA Launcher Surface &bull; Device Global Provider
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Style: {config.searchBar.style.replace('_', ' ')}
            </span>
          </div>

          {/* Live Search Bar Preview Stage */}
          <div className="p-6 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-center">
            <div className="w-full max-w-md">
              <div
                className={`w-full flex items-center justify-between px-4 py-3 transition-all duration-300 ${
                  config.searchBar.style === 'futuristic_pill'
                    ? 'rounded-full bg-neutral-900/90 border border-cyan-500/40 shadow-lg shadow-cyan-950/30'
                    : config.searchBar.style === 'glass_blur'
                    ? 'rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl'
                    : config.searchBar.style === 'minimal_outline'
                    ? 'rounded-xl bg-transparent border border-neutral-600'
                    : config.searchBar.style === 'oled_floating'
                    ? 'rounded-2xl bg-black border border-neutral-800 shadow-2xl'
                    : 'rounded-lg bg-neutral-800 border border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3 text-neutral-300">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-neutral-400 font-mono">Search phone, web, and apps...</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  {config.searchBar.showAssistantMic && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500/15 flex items-center justify-center text-[10px] font-bold">
                      AI
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Style Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">Choose Search Bar Appearance:</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'futuristic_pill', label: 'Cyber Pill' },
                { id: 'glass_blur', label: 'Frosted Glass' },
                { id: 'minimal_outline', label: 'Minimal Contour' },
                { id: 'oled_floating', label: 'OLED Floating' },
                { id: 'android_stock', label: 'Android Default' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => {
                    WidgetsSystemUIService.updateSearchBar({ style: style.id as SearchBarStyle });
                    showToast(`Search bar styled to ${style.label}.`);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                    config.searchBar.style === style.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Capability Explanation Note */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-[11px] text-neutral-400 flex items-center justify-between">
            <span>In-App Search Fields (e.g. within YouTube, WhatsApp):</span>
            <span className="text-amber-400 font-mono">Protected by Android Sandbox (Untouched)</span>
          </div>
        </section>
      )}

      {/* 2. QUICK SETTINGS CUSTOMIZATION */}
      {(activeTab === 'all' || activeTab === 'quick_settings') && (
        <section className="p-5 sm:p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-base font-bold text-white">Quick Settings Panel &amp; Tiles</h2>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Supported via ONEVA Accessibility &amp; System UI Overlay Bridge
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Tile Shape: {config.quickSettings.tileShape}
            </span>
          </div>

          {/* Interactive Quick Settings Preview Panel */}
          <div className="p-6 rounded-2xl bg-[#040816] border border-neutral-800 flex flex-col items-center">
            <div className="w-full max-w-sm p-4 rounded-3xl bg-neutral-950/90 border border-neutral-800 shadow-2xl space-y-4 backdrop-blur-xl">
              {/* Status Header inside Mockup */}
              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 px-1">
                <span>10:45 AM</span>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3" />
                  <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
                  <span>88%</span>
                </div>
              </div>

              {/* Tiles Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
                  { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth },
                  { id: 'mobile_data', label: 'Cellular', icon: Radio },
                  { id: 'flashlight', label: 'Flashlight', icon: Flashlight },
                  { id: 'rotation', label: 'Auto-Rotate', icon: RotateCw },
                  { id: 'location', label: 'Location', icon: Zap },
                  { id: 'airplane_mode', label: 'Airplane', icon: Plane },
                  { id: 'battery_saver', label: 'Battery Saver', icon: BatteryCharging },
                  { id: 'hotspot', label: 'Hotspot', icon: Radio },
                ].map((tile) => {
                  const Icon = tile.icon;
                  const isActive = tileStates[tile.id];

                  const shapeClass =
                    config.quickSettings.tileShape === 'squircle'
                      ? 'rounded-2xl'
                      : config.quickSettings.tileShape === 'rounded'
                      ? 'rounded-xl'
                      : config.quickSettings.tileShape === 'pill'
                      ? 'rounded-full'
                      : 'rounded-full aspect-square';

                  return (
                    <button
                      key={tile.id}
                      type="button"
                      onClick={() => handleTileToggle(tile.id)}
                      className={`p-3 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer border select-none ${shapeClass} ${
                        isActive
                          ? 'text-neutral-950 font-bold shadow-lg'
                          : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                      style={{
                        backgroundColor: isActive ? accentColor : undefined,
                        borderColor: isActive ? accentColor : undefined,
                        boxShadow: isActive ? `0 0 12px ${accentColor}40` : undefined,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] truncate max-w-full">{tile.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Brightness Slider Preview */}
              <div className="pt-2 px-1 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <div className="flex items-center gap-1 text-cyan-400">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Brightness</span>
                  </div>
                  <span>85%</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-900 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: '85%', backgroundColor: accentColor }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Settings Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">Tile Geometry / Shape:</label>
              <div className="grid grid-cols-4 gap-2">
                {(['squircle', 'rounded', 'pill', 'circle'] as TileShape[]).map((shape) => (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => {
                      WidgetsSystemUIService.updateQuickSettings({ tileShape: shape });
                      showToast(`Tile geometry changed to ${shape}.`);
                    }}
                    className={`py-2 text-xs capitalize rounded-xl border text-center transition cursor-pointer ${
                      config.quickSettings.tileShape === shape
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">Color Synchronization:</label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-xs text-neutral-300">Sync with Active Theme Accent</span>
                <input
                  type="checkbox"
                  checked={config.quickSettings.syncWithThemeAccent}
                  onChange={(e) => {
                    WidgetsSystemUIService.updateQuickSettings({ syncWithThemeAccent: e.target.checked });
                    showToast(e.target.checked ? 'Synchronized with theme accent.' : 'Using custom color.');
                  }}
                  className="accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. VOLUME PANEL CUSTOMIZATION */}
      {(activeTab === 'all' || activeTab === 'volume') && (
        <section className="p-5 sm:p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-base font-bold text-white">System Volume Panel &amp; Audio Streams</h2>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Supported via Native Android AudioManager Bridge &bull; Real Audio Levels
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const newMute = !config.volumePanel.isMuted;
                WidgetsSystemUIService.updateVolumePanel({ isMuted: newMute });
                PlatformBridge.performHapticFeedback(newMute ? 'warning' : 'confirm');
                showToast(newMute ? 'System audio streams muted.' : 'System audio unmuted.');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                config.volumePanel.isMuted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800'
              }`}
            >
              {config.volumePanel.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{config.volumePanel.isMuted ? 'Muted' : 'Sound Active'}</span>
            </button>
          </div>

          {/* Live Volume Sliders Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'mediaVolume', label: 'Media & Entertainment', icon: Volume2, max: 100 },
              { key: 'ringtoneVolume', label: 'Ringtone & Calls', icon: Volume2, max: 100 },
              { key: 'notificationVolume', label: 'Notification Chimes', icon: Volume2, max: 100 },
              { key: 'alarmVolume', label: 'Alarm & Timers', icon: Volume2, max: 100 },
            ].map((stream) => {
              const val = (config.volumePanel as any)[stream.key] as number;
              return (
                <div key={stream.key} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-200">{stream.label}</span>
                    <span className="font-mono text-cyan-300 font-bold">{val}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={val}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10);
                      WidgetsSystemUIService.updateVolumePanel({ [stream.key]: num });
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          {/* Volume Panel Layout Options */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs">
            <span className="text-neutral-300 font-medium">Panel Screen Position:</span>
            <div className="flex items-center gap-2">
              {(['right', 'left'] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => {
                    WidgetsSystemUIService.updateVolumePanel({ panelPosition: pos });
                    showToast(`Volume slider anchored to ${pos} edge.`);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs capitalize border transition cursor-pointer ${
                    config.volumePanel.panelPosition === pos
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                  }`}
                >
                  {pos} Edge
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. STATUS BAR & SYSTEM INDICATORS */}
      {(activeTab === 'all' || activeTab === 'status') && (
        <section className="p-5 sm:p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-base font-bold text-white">Status Bar &amp; Connectivity Glyphs</h2>
                <span className="text-[11px] text-amber-400 font-mono">
                  Supported via Launcher Status &bull; Android 12+ Monet System Bridge
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Battery: {config.statusAndIndicators.batteryStyle.replace('_', ' ')}
            </span>
          </div>

          {/* Battery Style Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">Battery Meter Representation:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'horizontal_pill', label: 'Horizontal Pill' },
                { id: 'circle_meter', label: 'Circle Meter' },
                { id: 'bold_percentage', label: 'Numeric Only' },
                { id: 'minimal', label: 'Minimalist Dot' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    WidgetsSystemUIService.updateStatusAndIndicators({ batteryStyle: b.id as BatteryStyle });
                    showToast(`Battery indicator set to ${b.label}.`);
                  }}
                  className={`p-3 rounded-xl border text-xs text-center transition cursor-pointer ${
                    config.statusAndIndicators.batteryStyle === b.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-semibold'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clock Style Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">Clock Display Typography:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'modern_sans', label: 'Modern Sans' },
                { id: 'digital_mono', label: 'Digital Monospace' },
                { id: 'dual_line_tech', label: 'Dual-Line Tech' },
                { id: 'minimalist', label: 'Ultra Minimal' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    WidgetsSystemUIService.updateStatusAndIndicators({ clockStyle: c.id as ClockStyle });
                    showToast(`Clock typography set to ${c.label}.`);
                  }}
                  className={`p-3 rounded-xl border text-xs text-center transition cursor-pointer ${
                    config.statusAndIndicators.clockStyle === c.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-semibold'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
