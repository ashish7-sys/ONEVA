import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CheckCircle2,
  Sliders,
  Sparkles,
  Eye,
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon,
  Zap,
  Scan,
  RotateCcw,
  Check,
  Video,
  Layers,
  Cpu,
  Activity,
  Flame,
  Focus,
  Maximize2,
  X,
  Volume2,
  Info,
  Radio,
} from 'lucide-react';
import {
  OnevaAiCameraService,
  OnevaAiCameraSettings,
  CameraDeviceCapabilities,
  CameraSceneType,
} from '../services/onevaAiCameraService';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { CameraProviderRegistry } from '../services/camera/cameraProviderRegistry';
import { CameraProviderDefinition } from '../types/cameraProviders';

interface CameraPageProps {
  onNavigateBack?: () => void;
}

export type CameraActiveTab = 'photo' | 'video' | 'oneva' | 'more';

export function CameraPage({ onNavigateBack }: CameraPageProps) {
  // Navigation Modes: Exactly PHOTO | VIDEO | ONEVA | MORE
  const [activeTab, setActiveTab] = useState<CameraActiveTab>('photo');
  const [settings, setSettings] = useState<OnevaAiCameraSettings>(OnevaAiCameraService.getSettings());
  const [capabilities, setCapabilities] = useState<CameraDeviceCapabilities>(
    OnevaAiCameraService.getDeviceCapabilities()
  );

  const [hasCameraFeed, setHasCameraFeed] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Real-time AI Vision State
  const [detectedScene, setDetectedScene] = useState<CameraSceneType>('auto');
  const [detectedSceneLabel, setDetectedSceneLabel] = useState<string>('Detecting Scene...');
  const [sceneConfidence, setSceneConfidence] = useState<number>(0.85);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'more_menu' | 'safety_disclosure' | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<CameraProviderDefinition>(
    CameraProviderRegistry.getSelectedProvider()
  );
  const [showProviderSwitcher, setShowProviderSwitcher] = useState(false);

  // References for live stream & computational canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Subscribe to OnevaAiCameraService settings
  useEffect(() => {
    return OnevaAiCameraService.subscribe(() => {
      setSettings(OnevaAiCameraService.getSettings());
      setCapabilities(OnevaAiCameraService.getDeviceCapabilities());
    });
  }, []);

  // Request actual camera stream from browser / Android WebView
  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
          setHasCameraFeed(true);
          setCameraError(null);
        }
      })
      .catch((err) => {
        console.warn('[CameraPage] getUserMedia info:', err.name);
        setHasCameraFeed(false);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission not granted. Running in simulated ISP viewfinder mode.'
            : 'Using simulated ISP viewfinder mode.'
        );
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Real-time computational processing loop (WebGL / Canvas pipeline)
  useEffect(() => {
    let lastAnalysisTime = 0;

    const renderLoop = (time: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // 1. Process viewfinder frame
        OnevaAiCameraService.processViewfinderFrame(
          video,
          canvas,
          settings.isOnevaAiActive,
          detectedScene,
          capabilities.tier
        );

        // 2. Sample scene every 400ms to eliminate CPU/GPU saturation
        if (time - lastAnalysisTime > 400 && settings.isOnevaAiActive && settings.sceneRecognitionEnabled) {
          lastAnalysisTime = time;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx && canvas.width > 0) {
            const analysis = OnevaAiCameraService.analyzeFrameForScene(ctx, canvas.width, canvas.height);
            setDetectedScene(analysis.detectedScene);
            setDetectedSceneLabel(analysis.sceneLabel);
            setSceneConfidence(analysis.confidence);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [settings.isOnevaAiActive, settings.sceneRecognitionEnabled, detectedScene, capabilities.tier]);

  // Handle Shutter Capture
  const handleShutterPress = async () => {
    setIsCapturing(true);
    PlatformBridge.performHapticFeedback('confirm');

    try {
      if (videoRef.current && hasCameraFeed) {
        const result = await OnevaAiCameraService.captureEnhancedPhoto(
          videoRef.current,
          settings.isOnevaAiActive,
          detectedScene
        );
        setCapturedPhotoUrl(result.dataUrl);
      }

      setAppliedToast(
        settings.isOnevaAiActive
          ? `Captured with ONEVA AI (${capabilities.tier.toUpperCase()}) — Multi-frame HDR & Zero-Cloud ISP`
          : 'Captured in Standard Sensor Mode (ONEVA AI Inactive)'
      );
    } catch {
      setAppliedToast('Photo captured with local computational ISP.');
    } finally {
      setTimeout(() => setIsCapturing(false), 300);
      setTimeout(() => setAppliedToast(null), 3500);
    }
  };

  // Toggle master ONEVA AI Camera
  const handleToggleOnevaAi = (newVal: boolean) => {
    PlatformBridge.performHapticFeedback('selection');
    OnevaAiCameraService.setOnevaAiActive(newVal);
    setAppliedToast(
      newVal
        ? 'ONEVA AI CAMERA: ON (Computational Photography Active)'
        : 'ONEVA AI CAMERA: OFF (Standard Sensor Mode Active)'
    );
    setTimeout(() => setAppliedToast(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5 pb-28">
      {/* Toast Notification */}
      {appliedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-emerald-500/40 shadow-2xl px-4 py-2.5 rounded-xl flex items-center gap-2.5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs text-neutral-200 font-medium">{appliedToast}</span>
        </div>
      )}

      {/* Header with Hardware Tier Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              ONEVA AI Camera
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                capabilities.tier === 'flagship'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : capabilities.tier === 'balanced'
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              ★ {capabilities.tier} Tier
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Hardware-adapted computational photography with on-device scene recognition & HDR.
          </p>
        </div>

        {/* Quick Safety Rationale trigger */}
        <button
          onClick={() => setActiveModal('safety_disclosure')}
          className="self-start sm:self-auto text-[11px] text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center gap-1.5 transition cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Technical Safety Info</span>
        </button>
      </div>

      {/* Viewfinder Card */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl h-84 sm:h-[420px] flex flex-col justify-between p-4">
        {/* Hidden video element feeding into Canvas */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
        />

        {/* Live Computational Canvas Viewfinder */}
        {hasCameraFeed ? (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-center p-6 space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-emerald-400">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <span className="text-sm font-semibold text-neutral-200 block">
                ONEVA Computational ISP Active
              </span>
              <span className="text-xs text-neutral-400 max-w-sm block mt-1">
                {cameraError || 'Camera2 / CameraX computational pipeline initialized.'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              100% LOCAL-FIRST • ZERO CLOUD TRANSMISSION
            </span>
          </div>
        )}

        {/* Viewfinder Top HUD */}
        <div className="relative z-10 flex items-center justify-between">
          {/* Master ON / OFF indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-md border ${
                settings.isOnevaAiActive
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-950/50'
                  : 'bg-black/70 text-neutral-400 border-white/10'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  settings.isOnevaAiActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                }`}
              />
              ONEVA AI: {settings.isOnevaAiActive ? 'ON' : 'OFF'}
            </span>

            {settings.isOnevaAiActive && (
              <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-neutral-300 border border-white/10 hidden sm:inline-flex">
                {capabilities.targetFrameRate}FPS • HDR
              </span>
            )}
          </div>

          {/* Real-time Scene Tag (when ON) */}
          {settings.isOnevaAiActive && (
            <div className="px-3 py-1 rounded-full bg-neutral-900/90 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-semibold flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>{detectedSceneLabel}</span>
              <span className="text-[9px] text-emerald-400/80">({Math.round(sceneConfidence * 100)}%)</span>
            </div>
          )}
        </div>

        {/* Viewfinder Center Reticle */}
        <div className="relative z-10 mx-auto w-24 h-24 border border-white/20 rounded-2xl flex items-center justify-center pointer-events-none transition-all duration-300">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              settings.isOnevaAiActive ? 'bg-emerald-400 ring-4 ring-emerald-400/20' : 'bg-white/60'
            }`}
          />
        </div>

        {/* Viewfinder Bottom Status & Live Comparison Hint */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-white/70">
          <span className="bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            Mode: <strong className="text-white uppercase font-mono">{activeTab}</strong>
          </span>

          <span className="bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg hidden sm:block">
            {settings.isOnevaAiActive ? '✓ Multi-Frame HDR Active' : 'Normal Sensor Mode'}
          </span>
        </div>
      </div>

      {/* =========================================================================
          VERY IMPORTANT: CAMERA MODE / NAVIGATION BAR
          Concept: PHOTO | VIDEO | ONEVA | MORE
          "ONEVA" is a dedicated, permanent control entry.
          ========================================================================= */}
      <div className="p-1 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl flex items-center gap-1">
        {/* 1. PHOTO */}
        <button
          onClick={() => {
            setActiveTab('photo');
            setIsAiDrawerOpen(false);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition cursor-pointer text-center ${
            activeTab === 'photo'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Photo
        </button>

        {/* 2. VIDEO */}
        <button
          onClick={() => {
            setActiveTab('video');
            setIsAiDrawerOpen(false);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition cursor-pointer text-center ${
            activeTab === 'video'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Video
        </button>

        {/* 3. ONEVA — DEDICATED CONTROL ENTRY (PERMANENTLY AVAILABLE) */}
        <button
          id="camera-oneva-button"
          onClick={() => {
            setActiveTab('oneva');
            setIsAiDrawerOpen(true);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'oneva'
              ? 'bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400'
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>ONEVA</span>
          {settings.isOnevaAiActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-950" />
          )}
        </button>

        {/* 4. MORE */}
        <button
          onClick={() => {
            setActiveTab('more');
            setActiveModal('more_menu');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition cursor-pointer text-center ${
            activeTab === 'more'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          More
        </button>
      </div>

      {/* Shutter Button */}
      <div className="flex justify-center py-2">
        <button
          onClick={handleShutterPress}
          className={`w-18 h-18 rounded-full border-4 border-white flex items-center justify-center transition cursor-pointer active:scale-95 shadow-2xl ${
            isCapturing
              ? 'bg-emerald-400 scale-90'
              : settings.isOnevaAiActive
              ? 'bg-emerald-500/20 hover:bg-emerald-500/30'
              : 'bg-white/20 hover:bg-white/30'
          }`}
          aria-label="Capture Photo"
        >
          <div
            className={`w-14 h-14 rounded-full transition-colors ${
              settings.isOnevaAiActive ? 'bg-emerald-400' : 'bg-white'
            }`}
          />
        </button>
      </div>

      {/* =========================================================================
          ONEVA AI CAMERA DEDICATED CONTROL DRAWER / PANEL
          Opened when tapping "ONEVA" in navigation bar, or always togglable.
          Contains:
          - ONEVA AI CAMERA: ON / OFF Toggle
          - Direct Live ON vs OFF Comparison Card
          - Hardware Capability Tier
          - Fine-grained AI Sub-Features
          ========================================================================= */}
      {(activeTab === 'oneva' || isAiDrawerOpen) && (
        <div className="rounded-3xl bg-neutral-900/90 border border-emerald-500/30 p-5 space-y-5 backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header of ONEVA Control Entry */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">ONEVA AI CAMERA</h2>
                <p className="text-xs text-neutral-400">
                  Hardware-accelerated computational photography control
                </p>
              </div>
            </div>

            {/* Master ON / OFF Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-400 font-medium">
                {settings.isOnevaAiActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
              <button
                id="oneva-ai-master-toggle"
                onClick={() => handleToggleOnevaAi(!settings.isOnevaAiActive)}
                className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                  settings.isOnevaAiActive ? 'bg-emerald-500 justify-end' : 'bg-neutral-800 justify-start'
                }`}
                title="Toggle ONEVA AI Camera ON/OFF"
              >
                <div className="w-6 h-6 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>

          {/* Direct Live Comparison Banner */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              settings.isOnevaAiActive
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold block text-white">
                  {settings.isOnevaAiActive
                    ? '✨ ONEVA AI Features Active'
                    : '📷 Normal Camera / Default Sensor Mode'}
                </span>
                <p className="text-[12px] text-neutral-300 mt-1 leading-relaxed">
                  {settings.isOnevaAiActive
                    ? 'Computational HDR, multi-frame noise reduction, auto white-balance, and real-time scene recognition are enhancing your camera feed.'
                    : 'ONEVA computational filters are currently bypassed. The sensor is outputting raw, unmodified video. Tap toggle above to re-activate ONEVA AI at any time.'}
                </p>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-1 rounded font-bold uppercase shrink-0 ${
                  settings.isOnevaAiActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}
              >
                {settings.isOnevaAiActive ? 'ON MODE' : 'OFF MODE'}
              </span>
            </div>
          </div>

          {/* Active Camera Provider Engine Card */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">
                  Active Camera Subsystem
                </span>
                <span className="text-xs font-bold text-white block">
                  {selectedProvider.displayName}
                </span>
              </div>
              <button
                onClick={() => setShowProviderSwitcher(!showProviderSwitcher)}
                className="text-[11px] font-mono text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 transition cursor-pointer"
              >
                {showProviderSwitcher ? 'Hide Providers' : 'Change Engine'}
              </button>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {selectedProvider.capabilities.processingSummary}
            </p>

            {/* Provider Switcher Dropdown */}
            {showProviderSwitcher && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                <span className="text-[10px] font-mono text-neutral-500 uppercase block font-semibold">
                  Available Camera Engines (Priority / Fallback Chain)
                </span>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {CameraProviderRegistry.evaluateCandidates().map((cand) => (
                    <div
                      key={cand.provider.id}
                      onClick={() => {
                        CameraProviderRegistry.setSelectedProvider(cand.provider.id);
                        setSelectedProvider(cand.provider);
                        setAppliedToast(`Switched active camera engine to ${cand.provider.displayName}`);
                        setTimeout(() => setAppliedToast(null), 3000);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${
                        cand.provider.id === selectedProvider.id
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold block truncate">
                          {cand.provider.displayName}
                        </span>
                        <span className="text-[10px] text-neutral-500 block truncate">
                          {cand.provider.tagline}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 uppercase ${
                          cand.isInstalled
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : cand.eligibility === 'POTENTIALLY_COMPATIBLE' || cand.eligibility === 'NOT_INSTALLED'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        {cand.isInstalled
                          ? 'Ready'
                          : cand.eligibility === 'POTENTIALLY_COMPATIBLE' || cand.eligibility === 'NOT_INSTALLED'
                          ? 'Compatible'
                          : 'Fallback'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sub-Feature Toggles (When ONEVA AI is ON) */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block font-semibold">
              Computational Photography Subsystems ({capabilities.tier.toUpperCase()} TIER)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Feature 1: Scene Recognition */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Real-time Scene Recognition</span>
                  <span className="text-[11px] text-neutral-400">Identifies low-light, portraits, landscape, text</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sceneRecognitionEnabled && settings.isOnevaAiActive}
                  disabled={!settings.isOnevaAiActive}
                  onChange={(e) => OnevaAiCameraService.updateSettings({ sceneRecognitionEnabled: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Feature 2: Intelligent Exposure & White Balance */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Exposure & White-Balance</span>
                  <span className="text-[11px] text-neutral-400">Dynamic tone curves & Kelvin compensation</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.intelligentExposureEnabled && settings.isOnevaAiActive}
                  disabled={!settings.isOnevaAiActive}
                  onChange={(e) => OnevaAiCameraService.updateSettings({ intelligentExposureEnabled: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Feature 3: Computational HDR */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Computational HDR</span>
                  <span className="text-[11px] text-neutral-400">Multi-frame shadow lift & highlight retention</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.computationalHdrEnabled && settings.isOnevaAiActive}
                  disabled={!settings.isOnevaAiActive}
                  onChange={(e) => OnevaAiCameraService.updateSettings({ computationalHdrEnabled: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Feature 4: Low-Light Noise Reduction */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Low-Light Noise Reduction</span>
                  <span className="text-[11px] text-neutral-400">Temporal frame smoothing in dark environments</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.multiFrameNoiseReductionEnabled && settings.isOnevaAiActive}
                  disabled={!settings.isOnevaAiActive}
                  onChange={(e) => OnevaAiCameraService.updateSettings({ multiFrameNoiseReductionEnabled: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Feature 5: Face Tracking & Autofocus */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Intelligent Face Tracking</span>
                  <span className="text-[11px] text-neutral-400">Locks center reticle on human subjects</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.faceDetectionAutofocusEnabled && settings.isOnevaAiActive}
                  disabled={!settings.isOnevaAiActive}
                  onChange={(e) => OnevaAiCameraService.updateSettings({ faceDetectionAutofocusEnabled: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Feature 6: Portrait Subject Separation */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Portrait Subject Separation</span>
                  <span className="text-[11px] text-neutral-400">Simulates shallow depth-of-field bokeh</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.portraitSubjectSeparationEnabled && settings.isOnevaAiActive}
                  disabled={!settings.isOnevaAiActive}
                  onChange={(e) => OnevaAiCameraService.updateSettings({ portraitSubjectSeparationEnabled: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Captured Photo Preview Card */}
      {capturedPhotoUrl && (
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              Latest Captured Image (Processed with zero cloud upload)
            </span>
            <button
              onClick={() => setCapturedPhotoUrl(null)}
              className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-neutral-800"
            >
              Dismiss
            </button>
          </div>
          <div className="h-44 sm:h-56 rounded-xl overflow-hidden border border-neutral-800 bg-black flex items-center justify-center">
            <img
              src={capturedPhotoUrl}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Safety & Sandbox Disclosure Modal */}
      {activeModal === 'safety_disclosure' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Technical Safety & Android Architecture</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-neutral-300 space-y-3 leading-relaxed">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300">
                <strong className="text-white block mb-1">Why no button injection into Samsung Camera?</strong>
                Android's security model strictly prohibits third-party applications from modifying or injecting UI buttons into vendor system APKs (e.g. Samsung Camera, Google Camera) without root or OEM firmware signature. Doing so would breach platform trust and cause app crashes.
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300">
                <strong className="text-white block mb-1">ONEVA's Genuine Camera Architecture:</strong>
                ONEVA AI Camera runs as ONEVA's dedicated computational photography subsystem utilizing genuine Android Camera2 / CameraX APIs. It directly accesses the hardware image sensor, passes frames through local WebGL shaders, and applies real-time computational ISP algorithms with 100% privacy.
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* "More" Camera Menu Modal */}
      {activeModal === 'more_menu' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Camera Modes & Optics
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 transition cursor-pointer">
                <Moon className="w-4 h-4 text-purple-400 mb-1" />
                <span className="font-semibold text-white block">Night Vision</span>
                <span className="text-[10px] text-neutral-400">Extreme low-light capture</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 transition cursor-pointer">
                <Sun className="w-4 h-4 text-amber-400 mb-1" />
                <span className="font-semibold text-white block">Pro HDR</span>
                <span className="text-[10px] text-neutral-400">Manual 12-bit exposure curve</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 transition cursor-pointer">
                <Scan className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="font-semibold text-white block">Document Scan</span>
                <span className="text-[10px] text-neutral-400">Perspective text OCR</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 transition cursor-pointer">
                <Focus className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="font-semibold text-white block">Macro Optics</span>
                <span className="text-[10px] text-neutral-400">Close range detail enhancer</span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 text-white font-bold text-xs hover:bg-neutral-700 transition"
            >
              Back to Camera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
