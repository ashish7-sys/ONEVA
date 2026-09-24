import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Camera,
  RotateCw,
  Zap,
  Shield,
  ShieldAlert,
  Sliders,
  Volume2,
  Maximize2,
  RefreshCw,
  Check,
  AlertTriangle,
  FileText,
  Cpu,
  Crosshair,
  Sparkles,
  Lock,
  Pause,
  Play,
  Copy,
  Layers,
  Activity,
  Radio,
  Clock,
} from 'lucide-react';
import {
  VisionPerceptionMode,
  VisionCadence,
  CameraFeedSource,
  CameraFacing,
  OpticalMetrics,
  VisionAnalysisResult,
  SentinelTriggerConfig,
  JarvisVisionTelemetry,
  DetectedObject,
} from '../../types/jarvisVision';
import { JarvisContinuousVisionService } from '../../services/vision/jarvisContinuousVisionService';
import { JarvisVoiceService } from '../../services/jarvisVoiceService';
import { AudioEffects } from '../../services/voice/audioSoundEffects';

interface JarvisContinuousVisionViewProps {
  onToast?: (message: string) => void;
}

export const JarvisContinuousVisionView: React.FC<JarvisContinuousVisionViewProps> = ({ onToast }) => {
  const [telemetry, setTelemetry] = useState<JarvisVisionTelemetry>(JarvisContinuousVisionService.getTelemetry());
  const [opticalMetrics, setOpticalMetrics] = useState<OpticalMetrics>(JarvisContinuousVisionService.getOpticalMetrics());
  const [latestResult, setLatestResult] = useState<VisionAnalysisResult | null>(JarvisContinuousVisionService.getLatestResult());
  const [history, setHistory] = useState<VisionAnalysisResult[]>(JarvisContinuousVisionService.getAnalysisHistory());
  const [focalPoint, setFocalPoint] = useState<{ x: number; y: number } | null>(JarvisContinuousVisionService.getFocalPoint());
  const [sentinelConfig, setSentinelConfig] = useState<SentinelTriggerConfig>(JarvisContinuousVisionService.getSentinelConfig());

  const [queryInput, setQueryInput] = useState<string>('What am I looking at? Inspect this view.');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isLiveCameraRequested, setIsLiveCameraRequested] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    JarvisContinuousVisionService.init();
    JarvisContinuousVisionService.setViewMounted(true);

    // Attach video element
    if (videoRef.current) {
      JarvisContinuousVisionService.attachVideoElement(videoRef.current);
    }

    const updateState = () => {
      setTelemetry(JarvisContinuousVisionService.getTelemetry());
      setOpticalMetrics(JarvisContinuousVisionService.getOpticalMetrics());
      setLatestResult(JarvisContinuousVisionService.getLatestResult());
      setHistory(JarvisContinuousVisionService.getAnalysisHistory());
      setFocalPoint(JarvisContinuousVisionService.getFocalPoint());
      setSentinelConfig(JarvisContinuousVisionService.getSentinelConfig());
    };

    updateState();
    const unsubscribe = JarvisContinuousVisionService.subscribe(updateState);

    // Render loop for canvas overlay (HUD scanning line & synthetic feed)
    let animFrameId: number;
    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;

          // If hardware camera, video is behind canvas; if synthetic, draw synthetic scene
          if (telemetry.feedSource !== 'hardware_camera') {
            JarvisContinuousVisionService.drawSyntheticSceneToCanvas(ctx, w, h);
          } else {
            // Clear transparent overlay for hardware video
            ctx.clearRect(0, 0, w, h);
          }

          // Draw HUD laser scan line
          const scanY = (Date.now() / 15) % h;
          const scanGrad = ctx.createLinearGradient(0, scanY - 15, 0, scanY + 15);
          scanGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          scanGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
          scanGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = scanGrad;
          ctx.fillRect(0, scanY - 15, w, 30);

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, scanY);
          ctx.lineTo(w, scanY);
          ctx.stroke();

          // Draw targeting corner reticles
          const bracketLen = 24;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 2;

          // Top Left
          ctx.beginPath();
          ctx.moveTo(16, 16 + bracketLen);
          ctx.lineTo(16, 16);
          ctx.lineTo(16 + bracketLen, 16);
          ctx.stroke();

          // Top Right
          ctx.beginPath();
          ctx.moveTo(w - 16 - bracketLen, 16);
          ctx.lineTo(w - 16, 16);
          ctx.lineTo(w - 16, 16 + bracketLen);
          ctx.stroke();

          // Bottom Left
          ctx.beginPath();
          ctx.moveTo(16, h - 16 - bracketLen);
          ctx.lineTo(16, h - 16);
          ctx.lineTo(16 + bracketLen, h - 16);
          ctx.stroke();

          // Bottom Right
          ctx.beginPath();
          ctx.moveTo(w - 16 - bracketLen, h - 16);
          ctx.lineTo(w - 16, h - 16);
          ctx.lineTo(w - 16, h - 16 - bracketLen);
          ctx.stroke();

          // Draw center crosshairs
          const cx = w / 2;
          const cy = h / 2;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.beginPath();
          ctx.arc(cx, cy, 32, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - 40, cy);
          ctx.lineTo(cx - 15, cy);
          ctx.moveTo(cx + 15, cy);
          ctx.lineTo(cx + 40, cy);
          ctx.moveTo(cx, cy - 40);
          ctx.lineTo(cx, cy - 15);
          ctx.moveTo(cx, cy + 15);
          ctx.lineTo(cx, cy + 40);
          ctx.stroke();
        }
      }
      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    return () => {
      JarvisContinuousVisionService.setViewMounted(false);
      unsubscribe();
      cancelAnimationFrame(animFrameId);
    };
  }, [telemetry.feedSource]);

  const showToast = (msg: string) => {
    if (onToast) onToast(msg);
  };

  const handleStartHardwareCamera = async () => {
    setIsLiveCameraRequested(true);
    const res = await JarvisContinuousVisionService.startHardwareCamera('environment');
    showToast(res.message);
  };

  const handleSwitchFacing = async () => {
    const res = await JarvisContinuousVisionService.switchCameraFacing();
    showToast(res.message);
  };

  const handleSelectFeedSource = (source: CameraFeedSource) => {
    JarvisContinuousVisionService.setFeedSource(source);
    const scene = JarvisContinuousVisionService.PRESET_SCENES[source];
    if (scene) {
      setQueryInput(scene.defaultPrompt);
      showToast(`Feed source changed: ${scene.title}`);
    } else {
      showToast('Switched to hardware camera feed');
    }
  };

  const handleModeChange = (mode: VisionPerceptionMode) => {
    JarvisContinuousVisionService.setPerceptionMode(mode);
    let promptMsg = 'Analyze this scene and describe what is visible.';
    if (mode === 'document_ocr') promptMsg = 'Extract and read all text from this document in detail.';
    else if (mode === 'hardware_inspector') promptMsg = 'Inspect circuit connections, chips, and check for safety flaws.';
    else if (mode === 'sentinel_watch') promptMsg = 'Sentinel scan: Alert me if any hazard, motion, or intrusion occurs.';
    setQueryInput(promptMsg);
    showToast(`Vision Mode: ${mode.replace('_', ' ').toUpperCase()}`);
  };

  const handleCadenceChange = (sec: VisionCadence) => {
    JarvisContinuousVisionService.setCadence(sec);
    showToast(`Continuous Perception Pulse: Every ${sec} seconds`);
  };

  const handleToggleFreeze = () => {
    const frozen = JarvisContinuousVisionService.toggleShutterFreeze();
    showToast(frozen ? 'Optical Shutter Frozen (Privacy Mode)' : 'Optical Shutter Resumed');
  };

  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const point = { x: Math.max(0, Math.min(100, xPct)), y: Math.max(0, Math.min(100, yPct)) };
    JarvisContinuousVisionService.setFocalPoint(point);
    AudioEffects.playJarvisWakeChime();
    showToast(`Optical focal reticle locked at X: ${point.x}%, Y: ${point.y}%`);
  };

  const handleExecuteScan = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt || queryInput;
    AudioEffects.playJarvisWakeChime();
    showToast('JARVIS Optical Multimodal Scan Initiated...');
    const result = await JarvisContinuousVisionService.analyzeCurrentScene({
      prompt: promptToUse,
      mode: telemetry.mode,
      focalPoint,
    });
    showToast(`Analysis complete (${result.executionDurationMs}ms)`);
  };

  const handleSpeakResponse = (text: string) => {
    const voiceSettings = JarvisVoiceService.getSettings();
    const lang = voiceSettings.selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
    JarvisVoiceService.speakText(text, lang);
    showToast('Replaying JARVIS vocal readout');
  };

  const handleCopyText = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
      showToast('OCR Text copied to clipboard');
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/80 border border-white/10 space-y-6 relative overflow-hidden backdrop-blur-md">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/40 bg-sky-500/10 text-sky-300 text-xs font-mono font-medium">
              <Eye className="w-3.5 h-3.5 animate-pulse text-sky-400" />
              <span>JARVIS MULTIMODAL EYES &bull; ONLINE</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 font-mono border border-white/5">
              Problem 4 &bull; Real JARVIS Level
            </span>
          </div>

          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Continuous Multimodal Vision (Aankhein aur Environment)</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-normal">
              Gemini 3.8 Flash
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 max-w-2xl">
            Autonomous live camera feed ingestion, 30 FPS optical sensor telemetry, real-time environment scene understanding, hardware inspection, and instant vocal synthesis.
          </p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950/80 border border-white/10 text-xs font-mono">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${opticalMetrics.shutterFrozen ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${opticalMetrics.shutterFrozen ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            </span>
            <span className={opticalMetrics.shutterFrozen ? 'text-amber-400' : 'text-emerald-400'}>
              {opticalMetrics.shutterFrozen ? 'SHUTTER FROZEN' : 'OPTICAL FEED LIVE'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleFreeze}
            title="Privacy Shutter Freeze"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition cursor-pointer"
          >
            {opticalMetrics.shutterFrozen ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Main Holographic Optical Viewport */}
      <div
        ref={viewportRef}
        onClick={handleViewportClick}
        className="relative w-full aspect-video rounded-3xl overflow-hidden bg-neutral-950 border border-sky-500/30 shadow-2xl shadow-sky-950/30 cursor-crosshair group select-none"
      >
        {/* Hidden video element for WebRTC camera stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${telemetry.feedSource === 'hardware_camera' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />

        {/* Canvas overlay for synthetic stream & holographic reticles */}
        <canvas
          ref={canvasRef}
          width={1024}
          height={768}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Telemetry Top Bar on Viewport */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-neutral-300 pointer-events-none z-10">
          <div className="flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
            <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="text-white font-semibold">{telemetry.feedSource === 'hardware_camera' ? 'HARDWARE CAMERA' : 'JARVIS SYNTHETIC FEED'}</span>
            <span className="text-neutral-500">&bull;</span>
            <span className="text-sky-300">{opticalMetrics.luxEstimate} LUX ({opticalMetrics.lightingCondition.toUpperCase()})</span>
          </div>

          <div className="flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>DELTA MOTION: <strong className={opticalMetrics.motionScore > 30 ? 'text-amber-400' : 'text-emerald-400'}>{opticalMetrics.motionScore}%</strong></span>
            <span className="text-neutral-500">&bull;</span>
            <span className="text-neutral-400">LATENCY: {opticalMetrics.captureLatencyMs}ms</span>
          </div>
        </div>

        {/* Dynamic Object Bounding Boxes (if detected) */}
        {latestResult?.detectedObjects.map((obj) => {
          if (!obj.boundingBox) return null;
          const isHazard = obj.category === 'hazard';
          const isFocal = focalPoint && Math.abs(focalPoint.x - (obj.boundingBox.x + obj.boundingBox.width / 2)) < 15;

          const borderColor = isHazard
            ? 'border-red-500 bg-red-500/10 text-red-300'
            : isFocal
            ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
            : 'border-sky-400 bg-sky-500/10 text-sky-300';

          return (
            <div
              key={obj.id}
              style={{
                left: `${obj.boundingBox.x}%`,
                top: `${obj.boundingBox.y}%`,
                width: `${obj.boundingBox.width}%`,
                height: `${obj.boundingBox.height}%`,
              }}
              className={`absolute border-2 rounded-lg transition-all pointer-events-none ${borderColor} shadow-lg`}
            >
              <div className="absolute -top-6 left-0 bg-neutral-950/90 border border-inherit px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap flex items-center gap-1 shadow">
                {isHazard ? <AlertTriangle className="w-3 h-3 text-red-400" /> : <Crosshair className="w-3 h-3 text-sky-400" />}
                <span className="font-bold text-white">{obj.label}</span>
                <span className="opacity-75">{Math.round(obj.confidence * 100)}%</span>
              </div>
            </div>
          );
        })}

        {/* Interactive Focal Reticle Marker */}
        {focalPoint && (
          <div
            style={{
              left: `${focalPoint.x}%`,
              top: `${focalPoint.y}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-emerald-400 animate-spin opacity-80" />
              <div className="w-6 h-6 rounded-full border border-emerald-400 absolute" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 absolute" />
            </div>
            <span className="mt-1 bg-neutral-950/90 text-emerald-300 text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/40">
              FOCAL LOCK [{focalPoint.x}%, {focalPoint.y}%]
            </span>
          </div>
        )}

        {/* Bottom Bar: Instructions & Reticle Reset */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div className="text-[10px] font-mono text-neutral-400 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
            Click anywhere in viewport to place focal lock reticle
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {focalPoint && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  JarvisContinuousVisionService.setFocalPoint(null);
                  showToast('Focal lock cleared');
                }}
                className="text-[10px] font-mono text-neutral-400 hover:text-white bg-neutral-950/80 px-2 py-1 rounded border border-white/10"
              >
                Clear Reticle
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExecuteScan();
              }}
              disabled={telemetry.isAnalyzing}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-sky-500/30 transition cursor-pointer"
            >
              {telemetry.isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
              <span>{telemetry.isAnalyzing ? 'ANALYZING...' : 'SCAN VIEW NOW'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feed Source & Hardware Camera Switcher Bar */}
      <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-mono uppercase text-neutral-300 font-semibold flex items-center gap-2">
            <Camera className="w-4 h-4 text-sky-400" />
            <span>Camera Feed &amp; Environment Selection</span>
          </span>

          <div className="flex items-center gap-2">
            {telemetry.feedSource === 'hardware_camera' ? (
              <button
                type="button"
                onClick={handleSwitchFacing}
                className="px-3 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                <span>FLIP LENS ({telemetry.activeCameraFacing.toUpperCase()})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartHardwareCamera}
                className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>ACTIVATE LIVE WEBCAM / PHONE LENS</span>
              </button>
            )}
          </div>
        </div>

        {/* Preset Environment Feeds Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.values(JarvisContinuousVisionService.PRESET_SCENES).map((scene) => {
            const isSelected = telemetry.feedSource === scene.id;
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => handleSelectFeedSource(scene.id)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-500 text-sky-200 shadow-md shadow-sky-950/20'
                    : 'bg-neutral-900/60 border-white/5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white truncate">{scene.title}</div>
                  <div className="text-[10px] opacity-75 mt-0.5 truncate">{scene.subtitle}</div>
                </div>
                <div className="text-[9px] font-mono mt-2 text-sky-400">
                  {isSelected ? 'ACTIVE VIEW' : 'SELECT'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Perception Modes & Continuous Cadence Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mode Selector */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-300 font-semibold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>Perception Mode</span>
            </span>
            <span className="text-[10px] font-mono text-sky-400 capitalize">{telemetry.mode.replace('_', ' ')}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'continuous_ambient', label: 'Continuous Ambient', desc: 'Auto periodic pulse' },
              { id: 'interactive_query', label: 'Interactive Query', desc: 'On-demand deep QA' },
              { id: 'sentinel_watch', label: 'Sentinel Watch', desc: 'Motion/Hazard alarm' },
              { id: 'document_ocr', label: 'Document & OCR', desc: 'Text transcription' },
              { id: 'hardware_inspector', label: 'Hardware Inspector', desc: 'Circuits & pins' },
            ].map((m) => {
              const isSelected = telemetry.mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModeChange(m.id as VisionPerceptionMode)}
                  className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                      : 'bg-neutral-900/60 border-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold text-white">{m.label}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{m.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Continuous Cadence & Sentinel Watch Config */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-neutral-300 font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Continuous Perception Cadence</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                Pulse every {telemetry.cadenceSeconds}s
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {([5, 10, 15, 30, 60] as VisionCadence[]).map((sec) => {
                const isSelected = telemetry.cadenceSeconds === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleCadenceChange(sec)}
                    className={`py-2 rounded-xl text-xs font-mono font-semibold border text-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-neutral-900 border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
            <span>Frames Processed: <strong className="text-white font-mono">{telemetry.framesProcessed}</strong></span>
            <span>Total Queries: <strong className="text-sky-400 font-mono">{telemetry.totalQueriesHandled}</strong></span>
            <span>Sentinel Alarms: <strong className="text-amber-400 font-mono">{telemetry.sentinelAlertsTriggered}</strong></span>
          </div>
        </div>
      </div>

      {/* Natural Voice / Text Query Bar */}
      <div className="p-4 rounded-2xl bg-neutral-950/80 border border-sky-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-white">Ask JARVIS About What He Sees</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Multimodal Vision-Language Core</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleExecuteScan();
            }}
            placeholder="E.g., What components are on this board? Is anything loose?"
            className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
          />

          <button
            type="button"
            onClick={() => handleExecuteScan()}
            disabled={telemetry.isAnalyzing}
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-neutral-800 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-sky-500/20 shrink-0"
          >
            {telemetry.isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            <span>{telemetry.isAnalyzing ? 'Processing...' : 'Analyze Scene'}</span>
          </button>
        </div>

        {/* Quick Question Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-neutral-500 font-mono mr-1">Quick Directives:</span>
          {[
            'What am I looking at?',
            'क्या इस सर्किट में कोई समस्या है?',
            'Read all text on this document',
            'Scan for safety hazards',
            'Identify all visible devices',
          ].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setQueryInput(q);
                handleExecuteScan(q);
              }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/5 transition"
            >
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Latest Analysis Results & Vocal Synthesis */}
      {latestResult && (
        <div className="p-5 rounded-3xl bg-neutral-950/90 border border-sky-500/30 space-y-4 shadow-xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold border border-sky-500/30">
                MULTIMODAL RESULT
              </span>
              <span className="text-xs font-semibold text-white font-mono">
                Query: &ldquo;{latestResult.queryPrompt}&rdquo;
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
              <span>Source: <strong className="text-sky-300">{latestResult.source}</strong></span>
              <span>Latency: <strong className="text-emerald-400">{latestResult.executionDurationMs}ms</strong></span>
            </div>
          </div>

          {/* JARVIS Spoken Vocal Readout Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-neutral-900 to-sky-950/20 border border-sky-500/40 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-300 font-mono">
                <Volume2 className="w-4 h-4 text-sky-400 animate-pulse" />
                <span>JARVIS VOCAL SYNTHESIS</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans">
                {latestResult.jarvisSpokenResponse}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSpeakResponse(latestResult.jarvisSpokenResponse)}
              className="p-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition cursor-pointer shrink-0"
              title="Replay JARVIS Voice"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Scene Summary */}
          <div>
            <span className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">
              Environmental Scene Summary
            </span>
            <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/60 p-3 rounded-xl border border-white/5">
              {latestResult.sceneSummary}
            </p>
          </div>

          {/* Spatial Hazard Alert (if detected) */}
          {latestResult.spatialHazardAssessment && latestResult.spatialHazardAssessment !== 'None detected' && (
            <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/40 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-red-300 font-mono block">SPATIAL HAZARD &amp; SAFETY AUDIT</span>
                <p className="text-xs text-red-200/90 mt-0.5 leading-relaxed">
                  {latestResult.spatialHazardAssessment}
                </p>
              </div>
            </div>
          )}

          {/* Extracted Text (OCR) */}
          {latestResult.extractedText && (
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Legible Text &amp; OCR Data</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleCopyText(latestResult.extractedText!)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              <pre className="text-xs text-neutral-300 font-mono bg-neutral-950 p-2.5 rounded-xl border border-white/5 whitespace-pre-wrap">
                {latestResult.extractedText}
              </pre>
            </div>
          )}

          {/* Detected Objects Grid */}
          {latestResult.detectedObjects.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase text-neutral-400 block">
                Tracked Optical Objects ({latestResult.detectedObjects.length})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {latestResult.detectedObjects.map((obj) => (
                  <div
                    key={obj.id}
                    className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{obj.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-neutral-400 capitalize">
                          {obj.category}
                        </span>
                      </div>
                      {obj.description && (
                        <p className="text-[11px] text-neutral-400 mt-1 leading-normal">{obj.description}</p>
                      )}
                    </div>

                    <span className="text-xs font-mono font-bold text-sky-400 shrink-0">
                      {Math.round(obj.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Suggestions */}
          {latestResult.actionableSuggestions.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <span className="text-[11px] font-mono uppercase text-neutral-400 block">
                JARVIS Actionable Directives
              </span>
              <div className="flex flex-wrap gap-2">
                {latestResult.actionableSuggestions.map((sug, i) => (
                  <div
                    key={i}
                    className="text-xs font-mono px-3 py-1.5 rounded-xl bg-white/5 text-neutral-300 border border-white/5"
                  >
                    &bull; {sug}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
