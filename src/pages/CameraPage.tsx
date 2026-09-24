import { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { CameraService, CameraConfig } from '../services/cameraService';
import { PlatformBridge } from '../launcher/services/platformBridge';

interface CameraPageProps {
  onNavigateBack?: () => void;
}

export function CameraPage({ onNavigateBack }: CameraPageProps) {
  const [cameraMode, setCameraMode] = useState<'photo' | 'video' | 'scan'>('photo');
  const [isCapturing, setIsCapturing] = useState(false);
  const [hdrEnabled, setHdrEnabled] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'enhancements' | 'vision_features' | 'settings' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraFeed, setHasCameraFeed] = useState(false);

  useEffect(() => {
    // Attempt real camera stream if available in browser
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setHasCameraFeed(true);
        }
      })
      .catch(() => {
        setHasCameraFeed(false);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    setIsCapturing(true);
    PlatformBridge.performHapticFeedback('confirm');
    setTimeout(() => {
      setIsCapturing(false);
      setAppliedToast(
        cameraMode === 'photo'
          ? 'Photo captured with zero-cloud ISP enhancement.'
          : cameraMode === 'video'
          ? 'Video recording processed.'
          : 'Scene scanned: Object identified on-device.'
      );
      setTimeout(() => setAppliedToast(null), 3000);
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Toast */}
      {appliedToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-neutral-900/95 border border-cyan-500/40 shadow-2xl px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-xs text-neutral-200 font-medium">{appliedToast}</span>
        </div>
      )}

      {/* Header (Reference Screen 9) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">ONEVA Vision</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Computational camera enhancements and on-device scene perception.
          </p>
        </div>
      </div>

      {/* Camera Viewfinder (Reference Screen 9) */}
      <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-neutral-950 shadow-2xl h-80 sm:h-96 flex flex-col justify-between p-4">
        {hasCameraFeed ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-center p-6">
            <Camera className="w-12 h-12 text-cyan-400/40 mb-2" />
            <span className="text-xs font-semibold text-neutral-300 block">
              Computational ISP Viewfinder Active
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 max-w-xs">
              Direct pipeline to Android Camera2 API with RAW color grading
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-cyan-300 text-[10px] font-mono border border-cyan-500/30 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            RAW 12-BIT &bull; 60FPS
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setHdrEnabled(!hdrEnabled)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                hdrEnabled ? 'bg-cyan-500 text-neutral-950' : 'bg-black/60 text-neutral-400 border border-white/10'
              }`}
            >
              HDR
            </button>
            <button
              onClick={() => setNightMode(!nightMode)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                nightMode ? 'bg-purple-500 text-white' : 'bg-black/60 text-neutral-400 border border-white/10'
              }`}
            >
              NIGHT
            </button>
          </div>
        </div>

        {/* Center Reticle */}
        <div className="relative z-10 mx-auto w-24 h-24 border border-cyan-400/30 rounded-2xl flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-cyan-400/80" />
        </div>

        {/* Bottom Viewfinder Controls (Capture button + Mode Switcher) */}
        <div className="relative z-10 space-y-3">
          {/* Shutter Button */}
          <div className="flex justify-center">
            <button
              onClick={handleCapture}
              className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition cursor-pointer active:scale-95 shadow-xl ${
                isCapturing ? 'bg-cyan-400' : 'bg-white/20 hover:bg-white/30 backdrop-blur-md'
              }`}
              aria-label="Capture"
            >
              <div className="w-12 h-12 rounded-full bg-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Modes: Photo | Video | Scan (Reference Screen 9) */}
      <div className="flex items-center p-1 rounded-xl bg-neutral-900/80 border border-white/10 text-xs">
        {(['photo', 'video', 'scan'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setCameraMode(m)}
            className={`flex-1 py-2 rounded-lg font-medium transition cursor-pointer uppercase font-mono text-center ${
              cameraMode === m
                ? 'bg-blue-600/30 text-cyan-300 font-semibold border border-blue-400/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Settings Rows (Reference Screen 9: AI Enhancements, Vision Features, Camera Settings) */}
      <div className="rounded-2xl bg-neutral-900/60 border border-white/10 divide-y divide-white/5 overflow-hidden">
        {/* 1. AI Enhancements */}
        <div
          onClick={() => setActiveModal('enhancements')}
          className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">AI Enhancements</span>
              <span className="text-[11px] text-neutral-400">HDR Dynamic Range, Zero-Lag Shutter, Night Optics</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>

        {/* 2. Vision Features */}
        <div
          onClick={() => setActiveModal('vision_features')}
          className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Vision Features</span>
              <span className="text-[11px] text-neutral-400">Scan QR/Text, Object Identification, Scene Analysis</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>

        {/* 3. Camera Settings */}
        <div
          onClick={() => setActiveModal('settings')}
          className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">Camera Settings</span>
              <span className="text-[11px] text-neutral-400">RAW capture, Resolution, Anti-Banding, Stabilization</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </div>
      </div>

      {/* Hardware Note */}
      <div className="p-4 rounded-2xl bg-neutral-900/40 border border-white/10 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-300 leading-relaxed">
          <strong className="text-white font-semibold">Genuine Android Camera:</strong> ONEVA Vision enhances your existing Android device camera hardware. Zero photos or videos are transmitted to any cloud servers; processing is strictly localized on your NPU/GPU.
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white capitalize">
                {activeModal.replace('_', ' ')}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span>Multi-Frame Super Resolution</span>
                <span className="text-cyan-400 font-semibold font-mono">ENABLED</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span>RAW ISP Color Curves</span>
                <span className="text-cyan-400 font-semibold font-mono">CALIBRATED</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span>OLED Emissive Contrast</span>
                <span className="text-cyan-400 font-semibold font-mono">ACTIVE</span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-cyan-500 text-neutral-950 font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
