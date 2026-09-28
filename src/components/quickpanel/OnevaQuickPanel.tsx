import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  Volume2,
  VolumeX,
  Volume1,
  Bluetooth,
  Flashlight,
  Radio,
  Share2,
  Plane,
  MapPin,
  Moon,
  Sun,
  BellOff,
  RotateCw,
  Clock,
  Settings,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Shield,
  Sparkles,
  Power,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronRight,
  Maximize2,
  Minimize2,
  Trash2,
  Layers,
} from 'lucide-react';
import {
  ControlId,
  QuickPanelState,
  NotificationItem,
  QuickPanelConfig,
  QuickPanelSkin,
  DeviceCapabilityProfile,
} from '../../services/quickPanel/quickPanelTypes';
import {
  QuickPanelService,
  QUICK_PANEL_SKINS,
} from '../../services/quickPanel/quickPanelService';

interface OnevaQuickPanelProps {
  onOpenSettings?: () => void;
}

export const OnevaQuickPanel: React.FC<OnevaQuickPanelProps> = ({ onOpenSettings }) => {
  const [panelState, setPanelState] = useState<QuickPanelState>('closed');
  const [config, setConfig] = useState<QuickPanelConfig>(QuickPanelService.getConfig());
  const [activeSkin, setActiveSkin] = useState<QuickPanelSkin>(QuickPanelService.getActiveSkin());
  const [deviceProfile, setDeviceProfile] = useState<DeviceCapabilityProfile>(QuickPanelService.scanDeviceCapabilities());

  // Real Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasNotificationAccess, setHasNotificationAccess] = useState<boolean>(QuickPanelService.isNotificationAccessGranted());

  // System Controls State
  const [brightness, setBrightness] = useState<number>(QuickPanelService.getBrightness());
  const [controlStates, setControlStates] = useState<Record<ControlId, boolean>>({
    wifi: true,
    sound: true,
    bluetooth: true,
    torch: QuickPanelService.getTorchState(),
    mobile_data: true,
    hotspot: false,
    airplane: false,
    location: true,
    dark_mode: true,
    dnd: false,
    auto_rotate: true,
    screen_timeout: false,
    settings: false,
    device_control: false,
    media_output: false,
  });

  // UI state
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isEditModeOpen, setIsEditModeOpen] = useState<boolean>(false);
  const [isCalibratingTrigger, setIsCalibratingTrigger] = useState<boolean>(false);
  const [calibratingHeight, setCalibratingHeight] = useState<number>(config.triggerHeightPx);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Time & Status Telemetry
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [batteryLevel, setBatteryLevel] = useState<number>(92);
  const [networkType, setNetworkType] = useState<string>('WIFI');

  // Gesture tracking
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Subscribe to config, notifications, and native events
  useEffect(() => {
    const unsub = QuickPanelService.subscribe(() => {
      const cfg = QuickPanelService.getConfig();
      setConfig(cfg);
      setActiveSkin(QuickPanelService.getActiveSkin());
    });

    // Initial notifications & status load
    refreshNotifications();
    refreshSystemTelemetry();

    // Clock ticker
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    }, 1000);

    // Live native event listeners
    const handleNotifUpdate = () => refreshNotifications();
    const handlePermUpdate = () => {
      setHasNotificationAccess(QuickPanelService.isNotificationAccessGranted());
      refreshNotifications();
    };
    const handleOpenPanel = () => setPanelState('compact');
    const handleCalibratePanel = () => setIsCalibratingTrigger(true);

    if (typeof window !== 'undefined') {
      window.addEventListener('oneva-notifications-updated', handleNotifUpdate);
      window.addEventListener('oneva-permissions-updated', handlePermUpdate);
      window.addEventListener('open-oneva-quick-panel', handleOpenPanel);
      window.addEventListener('calibrate-oneva-quick-panel', handleCalibratePanel);
    }

    return () => {
      unsub();
      clearInterval(timer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('oneva-notifications-updated', handleNotifUpdate);
        window.removeEventListener('oneva-permissions-updated', handlePermUpdate);
        window.removeEventListener('open-oneva-quick-panel', handleOpenPanel);
        window.removeEventListener('calibrate-oneva-quick-panel', handleCalibratePanel);
      }
    };
  }, []);

  const refreshNotifications = () => {
    const hasAccess = QuickPanelService.isNotificationAccessGranted();
    setHasNotificationAccess(hasAccess);
    if (hasAccess) {
      setNotifications(QuickPanelService.getRealNotifications());
    } else {
      setNotifications([]);
    }
  };

  const refreshSystemTelemetry = () => {
    const bridge = typeof window !== 'undefined' ? (window as any).OnevaNativeBridge : undefined;
    if (bridge) {
      if (typeof bridge.getSystemBattery === 'function') {
        setBatteryLevel(bridge.getSystemBattery());
      }
      if (typeof bridge.getNetworkState === 'function') {
        setNetworkType(bridge.getNetworkState());
      }
      if (typeof bridge.getSystemBrightness === 'function') {
        setBrightness(bridge.getSystemBrightness());
      }
      if (typeof bridge.getTorchState === 'function') {
        setControlStates((prev) => ({ ...prev, torch: bridge.getTorchState() }));
      }
    }
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 2400);
  };

  // Top Trigger Zone Gesture Handlers
  const handleTriggerTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTriggerTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTriggerTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = touchCurrentY.current - touchStartY.current;

    if (deltaY > 60) {
      // Swiped down from trigger area
      if (panelState === 'closed') {
        setPanelState('compact');
      } else if (panelState === 'compact') {
        setPanelState('expanded');
      }
    }
  };

  // Panel Gesture Handlers for continuous pull-down
  const handlePanelTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handlePanelTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handlePanelTouchEnd = () => {
    const deltaY = touchCurrentY.current - touchStartY.current;

    if (deltaY > 70 && panelState === 'compact') {
      // Second downward pull expands to full panel
      setPanelState('expanded');
    } else if (deltaY < -70) {
      // Upward swipe collapses
      if (panelState === 'expanded') {
        setPanelState('compact');
      } else if (panelState === 'compact') {
        setPanelState('closed');
      }
    }
  };

  const handleToggleControl = (id: ControlId) => {
    const current = controlStates[id] || false;
    const res = QuickPanelService.executeControlAction(id, current);
    setControlStates((prev) => ({ ...prev, [id]: res.newActiveState }));
    showToast(res.feedback);
  };

  const handleBrightnessChange = (val: number) => {
    setBrightness(val);
    QuickPanelService.setBrightness(val);
  };

  const handleDismissNotification = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    QuickPanelService.dismissNotification(key);
    setNotifications((prev) => prev.filter((n) => n.key !== key));
    showToast('Notification dismissed');
  };

  const handleOpenNotification = (key: string) => {
    QuickPanelService.openNotification(key);
    setPanelState('closed');
  };

  const handleTriggerNotificationAction = (key: string, actionIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    QuickPanelService.triggerNotificationAction(key, actionIndex);
    showToast('Action triggered');
  };

  const handleSaveCalibration = () => {
    QuickPanelService.updateConfig({
      triggerHeightPx: calibratingHeight,
      isCalibrationDone: true,
    });
    setIsCalibratingTrigger(false);
    showToast(`Trigger height calibrated to ${calibratingHeight}px`);
  };

  const renderControlIcon = (id: ControlId, isActive: boolean) => {
    switch (id) {
      case 'wifi':
        return <Wifi className="w-5 h-5" />;
      case 'sound':
        return isActive ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />;
      case 'bluetooth':
        return <Bluetooth className="w-5 h-5" />;
      case 'torch':
        return <Flashlight className="w-5 h-5" />;
      case 'mobile_data':
        return <Radio className="w-5 h-5" />;
      case 'hotspot':
        return <Share2 className="w-5 h-5" />;
      case 'airplane':
        return <Plane className="w-5 h-5" />;
      case 'location':
        return <MapPin className="w-5 h-5" />;
      case 'dark_mode':
        return isActive ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />;
      case 'dnd':
        return <BellOff className="w-5 h-5" />;
      case 'auto_rotate':
        return <RotateCw className="w-5 h-5" />;
      case 'screen_timeout':
        return <Clock className="w-5 h-5" />;
      case 'settings':
        return <Settings className="w-5 h-5" />;
      case 'device_control':
        return <Smartphone className="w-5 h-5" />;
      case 'media_output':
        return <Volume1 className="w-5 h-5" />;
      default:
        return <Sliders className="w-5 h-5" />;
    }
  };

  const getControlLabel = (id: ControlId): string => {
    switch (id) {
      case 'wifi': return 'Wi-Fi';
      case 'sound': return controlStates.sound ? 'Sound' : 'Mute';
      case 'bluetooth': return 'Bluetooth';
      case 'torch': return 'Torch';
      case 'mobile_data': return 'Mobile Data';
      case 'hotspot': return 'Hotspot';
      case 'airplane': return 'Flight Mode';
      case 'location': return 'Location';
      case 'dark_mode': return 'Dark Mode';
      case 'dnd': return 'Do Not Disturb';
      case 'auto_rotate': return 'Auto Rotate';
      case 'screen_timeout': return 'Timeout';
      case 'settings': return 'Settings';
      case 'device_control': return 'Device Control';
      case 'media_output': return 'Media Output';
      default: return id;
    }
  };

  const pageControls = currentPage === 0 ? config.page1ControlIds : config.page2ControlIds;

  return (
    <>
      {/* =========================================================================
       * 1. TOP TRIGGER ZONE
       * Active gesture area. Notice indicator is ONLY visible during calibration.
       * ========================================================================= */}
      <div
        id="oneva-quick-panel-trigger"
        onTouchStart={handleTriggerTouchStart}
        onTouchMove={handleTriggerTouchMove}
        onTouchEnd={handleTriggerTouchEnd}
        style={{ height: `${config.triggerHeightPx}px` }}
        className={`fixed top-0 left-0 right-0 z-40 transition-colors ${
          isCalibratingTrigger
            ? 'bg-cyan-500/20 border-b-2 border-cyan-400 border-dashed flex items-center justify-center cursor-ns-resize shadow-lg shadow-cyan-950/60'
            : 'bg-transparent pointer-events-auto'
        }`}
        title="Swipe down to open ONEVA Quick Panel"
      >
        {isCalibratingTrigger && (
          <div className="flex items-center gap-2 text-cyan-300 font-mono text-[11px] px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/40 animate-pulse">
            <Sliders className="w-3.5 h-3.5" />
            <span>TRIGGER ZONE: {calibratingHeight}px (Swipe down to test)</span>
          </div>
        )}
      </div>

      {/* =========================================================================
       * 2. CALIBRATION MODAL (If in Trigger Calibration Mode)
       * ========================================================================= */}
      {isCalibratingTrigger && (
        <div className="fixed top-24 left-4 right-4 max-w-md mx-auto z-50 p-5 rounded-3xl bg-slate-950/95 border border-cyan-400/40 shadow-2xl backdrop-blur-2xl text-white animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Calibrate Quick Panel Trigger Area</span>
            </div>
            <button
              onClick={() => setIsCalibratingTrigger(false)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Adjust the top trigger height so you can smoothly pull down the Quick Panel. The dashed cyan guide will disappear completely once calibrated.
          </p>

          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-xs font-mono text-cyan-300">
              <span>Height: {calibratingHeight}px</span>
              <span>Default: 44px</span>
            </div>
            <input
              type="range"
              min="24"
              max="96"
              value={calibratingHeight}
              onChange={(e) => setCalibratingHeight(Number(e.target.value))}
              className="w-full h-2 rounded-lg bg-slate-800 accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveCalibration}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer transition active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Hide Calibration Guide</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 3. QUICK PANEL MODAL (COMPACT OR EXPANDED TWO-STAGE SURFACE)
       * ========================================================================= */}
      {panelState !== 'closed' && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex flex-col justify-start select-none transition-all duration-300 animate-in fade-in"
          onClick={() => setPanelState('closed')}
        >
          {/* Main Pull-Down Panel Surface */}
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handlePanelTouchStart}
            onTouchMove={handlePanelTouchMove}
            onTouchEnd={handlePanelTouchEnd}
            className={`w-full max-w-lg mx-auto bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-slate-950/95 border-b border-x border-white/10 rounded-b-[36px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden transition-all duration-300 ${
              panelState === 'compact'
                ? 'max-h-[62vh] pb-3'
                : 'h-[95vh] pb-6'
            }`}
          >
            {/* Header Bar */}
            <div className="pt-4 px-6 pb-2 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-transparent via-white/[0.02] to-transparent">
              {/* Left: Clock & Date */}
              <div className="flex items-baseline gap-2.5">
                <span className="text-xl font-bold font-mono tracking-tight text-white">
                  {currentTime || '12:00'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {currentDate || 'Today'}
                </span>
              </div>

              {/* Center / Right: Telemetry & Actions */}
              <div className="flex items-center gap-2">
                {/* Battery Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-white/10 text-[11px] font-mono text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{batteryLevel}%</span>
                </div>

                {/* Edit / Customize Button */}
                <button
                  onClick={() => setIsEditModeOpen(true)}
                  className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition active:scale-95 cursor-pointer"
                  title="Customize Quick Panel & Skins"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Android Settings Shortcut */}
                <button
                  onClick={() => {
                    QuickPanelService.executeControlAction('settings', false);
                    setPanelState('closed');
                  }}
                  className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition active:scale-95 cursor-pointer"
                  title="Android Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setPanelState('closed')}
                  className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white border border-white/10 transition active:scale-95 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable / Interactive Content Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* EXPANDED MODE ONLY: Device Control & Media Output Buttons */}
              {panelState === 'expanded' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => QuickPanelService.executeControlAction('device_control', false)}
                    className="p-3 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-white/10 flex items-center justify-center gap-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-white/20 transition active:scale-[0.98] shadow-sm cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>Device Control</span>
                  </button>

                  <button
                    onClick={() => QuickPanelService.executeControlAction('media_output', false)}
                    className="p-3 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-white/10 flex items-center justify-center gap-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-white/20 transition active:scale-[0.98] shadow-sm cursor-pointer"
                  >
                    <Volume1 className="w-4 h-4 text-emerald-400" />
                    <span>Media Output</span>
                  </button>
                </div>
              )}

              {/* QUICK CONTROLS GRID */}
              {panelState === 'compact' ? (
                /* Compact Row: 5 prominent primary tiles */
                <div className="grid grid-cols-5 gap-2.5 pt-1">
                  {(['wifi', 'sound', 'bluetooth', 'torch', 'mobile_data'] as ControlId[]).map((id) => {
                    const isActive = controlStates[id] || false;
                    return (
                      <button
                        key={id}
                        onClick={() => handleToggleControl(id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-95 ${
                          isActive ? activeSkin.activeTileClass : activeSkin.inactiveTileClass
                        }`}
                      >
                        <div className="mb-1.5">{renderControlIcon(id, isActive)}</div>
                        <span className="text-[10px] font-medium tracking-tight truncate w-full text-center">
                          {getControlLabel(id)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Expanded Multi-Page Grid (4x3 per page) */
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    {pageControls.map((id) => {
                      const isActive = controlStates[id] || false;
                      return (
                        <button
                          key={id}
                          onClick={() => handleToggleControl(id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-95 ${
                            isActive ? activeSkin.activeTileClass : activeSkin.inactiveTileClass
                          }`}
                        >
                          <div className="mb-1.5">{renderControlIcon(id, isActive)}</div>
                          <span className="text-[10.5px] font-medium tracking-tight truncate w-full text-center">
                            {getControlLabel(id)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Multi-page Dot Indicators */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => setCurrentPage(0)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentPage === 0 ? 'w-5 bg-cyan-400' : 'bg-slate-700'
                      }`}
                    />
                    <button
                      onClick={() => setCurrentPage(1)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentPage === 1 ? 'w-5 bg-cyan-400' : 'bg-slate-700'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* FUNCTIONAL BRIGHTNESS SLIDER */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Brightness</span>
                  </div>
                  <span className="font-mono text-cyan-300 text-[11px]">{brightness}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sun className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={brightness}
                    onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                    className="w-full h-2 rounded-lg bg-slate-800 accent-cyan-400 cursor-pointer"
                  />
                  <Sun className="w-5 h-5 text-amber-400 shrink-0" />
                </div>
              </div>

              {/* =========================================================================
               * REAL ANDROID NOTIFICATIONS SECTION
               * ========================================================================= */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">
                      Notifications
                    </span>
                    {notifications.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                        {notifications.length}
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        notifications.forEach((n) => QuickPanelService.dismissNotification(n.key));
                        setNotifications([]);
                        showToast('All notifications cleared');
                      }}
                      className="text-[11px] text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Case 1: Notification Permission Not Granted */}
                {!hasNotificationAccess ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-slate-950/80 border border-cyan-500/20 text-slate-300 space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-white block">
                          Real Notification Access Required
                        </span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          To display and dismiss genuine Android notifications in ONEVA, enable ONEVA in Android Notification Access settings.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => QuickPanelService.openNotificationAccessSettings()}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/40 transition active:scale-[0.98] cursor-pointer"
                    >
                      <span>Enable in Android Settings</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  /* Case 2: Zero Active Notifications */
                  <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 text-center text-slate-500 space-y-1.5">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                    <span className="text-xs font-medium text-slate-400 block">No new notifications</span>
                    <span className="text-[10.5px] text-slate-500 font-mono">Real-time Android status active</span>
                  </div>
                ) : (
                  /* Case 3: Genuine Active Notifications Cards */
                  <div className="space-y-2">
                    {notifications.map((notif) => (
                      <div
                        key={notif.key}
                        onClick={() => handleOpenNotification(notif.key)}
                        className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-white/10 hover:border-white/20 transition cursor-pointer space-y-2 group shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            {notif.iconBase64 ? (
                              <img
                                src={notif.iconBase64}
                                alt={notif.appName}
                                className="w-6 h-6 rounded-lg object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {notif.appName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <span className="text-[11px] font-bold text-slate-300">
                                {notif.appName}
                              </span>
                              {notif.subText && (
                                <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                                  • {notif.subText}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(notif.postTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {notif.isClearable && (
                              <button
                                onClick={(e) => handleDismissNotification(notif.key, e)}
                                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                                title="Dismiss notification"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          {notif.title && (
                            <h4 className="text-xs font-semibold text-white leading-snug">
                              {notif.title}
                            </h4>
                          )}
                          {notif.text && (
                            <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                              {notif.text}
                            </p>
                          )}
                        </div>

                        {/* Action Chips */}
                        {notif.actions && notif.actions.length > 0 && (
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            {notif.actions.map((act) => (
                              <button
                                key={act.actionIndex}
                                onClick={(e) => handleTriggerNotificationAction(notif.key, act.actionIndex, e)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-500/20 text-[10.5px] font-medium transition cursor-pointer"
                              >
                                {act.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Expansion / Pull Handle */}
            <div
              onClick={() => setPanelState(panelState === 'compact' ? 'expanded' : 'compact')}
              className="pt-2 pb-1 flex flex-col items-center justify-center cursor-pointer group hover:bg-white/[0.02] transition"
            >
              <div className="w-12 h-1 rounded-full bg-slate-600 group-hover:bg-cyan-400 transition" />
              <span className="text-[10px] text-slate-500 font-mono mt-1">
                {panelState === 'compact' ? 'Swipe down to expand' : 'Swipe up to collapse'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 4. QUICK PANEL EDIT & CUSTOMIZATION MODAL
       * ========================================================================= */}
      {isEditModeOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 select-none animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-950/95 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-cyan-950/30 to-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Customize Quick Panel</h3>
                  <span className="text-[11px] text-slate-400">Configure skins, controls, and trigger height</span>
                </div>
              </div>
              <button
                onClick={() => setIsEditModeOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Settings Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Section 1: Choose Quick Panel Skin */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Quick Panel Skin
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300">
                    {activeSkin.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {QUICK_PANEL_SKINS.map((skin) => (
                    <button
                      key={skin.id}
                      onClick={() => QuickPanelService.updateConfig({ selectedSkinId: skin.id })}
                      className={`p-3 rounded-2xl border text-left transition relative cursor-pointer ${
                        config.selectedSkinId === skin.id
                          ? 'bg-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-950/50'
                          : 'bg-slate-900/60 border-white/8 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white">{skin.name}</span>
                        {config.selectedSkinId === skin.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {skin.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Trigger Zone Calibration */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">Top Trigger Area Height</span>
                    <span className="text-[11px] text-slate-400">Current height: {config.triggerHeightPx}px</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditModeOpen(false);
                      setIsCalibratingTrigger(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Calibrate on Screen</span>
                  </button>
                </div>
              </div>

              {/* Section 3: Device Capability Report */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/8 space-y-2 text-xs text-slate-400 font-mono">
                <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
                  <span>Device Hardware Profile</span>
                  <span className="text-emerald-400">Verified</span>
                </div>
                <div className="flex justify-between">
                  <span>Device:</span>
                  <span className="text-white">{deviceProfile.manufacturer} {deviceProfile.model}</span>
                </div>
                <div className="flex justify-between">
                  <span>OS Version:</span>
                  <span className="text-white">{deviceProfile.androidVersion} (API {deviceProfile.sdkInt})</span>
                </div>
                <div className="flex justify-between">
                  <span>Display:</span>
                  <span className="text-white">{deviceProfile.screenWidth}x{deviceProfile.screenHeight} ({deviceProfile.densityDpi} dpi)</span>
                </div>
                <div className="flex justify-between">
                  <span>Notification Access:</span>
                  <span className={hasNotificationAccess ? 'text-emerald-400' : 'text-amber-400'}>
                    {hasNotificationAccess ? 'Active (Live)' : 'Requires Permission'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-slate-900/40">
              <button
                onClick={() => {
                  QuickPanelService.resetConfig();
                  showToast('Defaults restored');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium transition cursor-pointer"
              >
                Reset to Defaults
              </button>
              <button
                onClick={() => setIsEditModeOpen(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-950/40 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Feedback Toast */}
      {feedbackToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/95 border border-cyan-400/40 text-cyan-200 text-xs font-mono shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
          {feedbackToast}
        </div>
      )}
    </>
  );
};
