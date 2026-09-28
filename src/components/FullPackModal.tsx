import { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Camera,
  Keyboard,
  Image,
  Sliders,
  Cpu,
  CornerDownRight,
  ExternalLink,
  RotateCcw,
  Check,
  AlertTriangle,
  Download,
  FileCheck,
  Play,
} from 'lucide-react';
import { FullPackService } from '../services/fullPackService';
import { FullPackRequirementManager } from '../services/fullPack/fullPackRequirementManager';
import {
  ComponentRequirement,
  FullPackWizardState,
  ComponentSetupStatus,
} from '../types/fullPackRequirements';
import { CameraProviderRegistry } from '../services/camera/cameraProviderRegistry';
import { EvaluatedCameraCandidate } from '../types/cameraProviders';
import { PlatformBridge } from '../launcher/services/platformBridge';
import { DeviceAppScannerService } from '../services/deviceAppScannerService';

interface FullPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export function FullPackModal({ isOpen, onClose, onApplied }: FullPackModalProps) {
  const [wizardState, setWizardState] = useState<FullPackWizardState>(
    FullPackRequirementManager.getWizardState()
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeRequirement, setActiveRequirement] = useState<ComponentRequirement | null>(null);
  const [recommendedCamera, setRecommendedCamera] = useState<EvaluatedCameraCandidate | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Dedicated Component 7 Camera Direct Package Installer State
  const [cameraInstallPhase, setCameraInstallPhase] = useState<
    'idle' | 'consent' | 'permission_prompt' | 'downloading' | 'awaiting_installer' | 'verified_ready' | 'error'
  >('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('');
  const [installingCandidate, setInstallingCandidate] = useState<EvaluatedCameraCandidate | null>(null);

  useEffect(() => {
    const unsub = FullPackRequirementManager.subscribe(() => {
      setWizardState({ ...FullPackRequirementManager.getWizardState() });
    });
    return () => unsub();
  }, []);

  // Sync state and check active step requirements when modal opens or step changes
  useEffect(() => {
    if (!isOpen) return;

    const state = FullPackRequirementManager.getWizardState();
    setWizardState({ ...state });

    if (state.currentStepIndex <= 7) {
      const stepIdx = state.currentStepIndex as 1 | 2 | 3 | 4 | 5 | 6 | 7;
      const req = FullPackRequirementManager.checkComponentRequirements(stepIdx);
      setActiveRequirement(req);

      if (stepIdx === 7) {
        const cand = CameraProviderRegistry.getRecommendedProvider();
        setRecommendedCamera(cand);
      }
    } else {
      setActiveRequirement(null);
    }
  }, [isOpen, wizardState.currentStepIndex]);

  // Window focus listener + active poller: Re-verify permissions or package installation
  useEffect(() => {
    let poller: any = null;

    const checkStatus = () => {
      if (!isOpen) return;
      const state = FullPackRequirementManager.getWizardState();
      if (state.currentStepIndex === 5) {
        // Re-check Jarvis accessibility
        const req = FullPackRequirementManager.checkComponentRequirements(5);
        setActiveRequirement(req);
        if (req && req.status === 'SATISFIED') {
          setVerificationFeedback('✓ Accessibility permission verified!');
          setTimeout(() => setVerificationFeedback(null), 3000);
        }
      } else if (state.currentStepIndex === 7) {
        // Re-check camera providers & package install status
        DeviceAppScannerService.rescan();
        const cand = CameraProviderRegistry.getRecommendedProvider();
        setRecommendedCamera(cand);

        const target = installingCandidate || cand;
        const targetPkg = target.provider.primaryPackageName;
        const isInstalledNow =
          PlatformBridge.isAppInstalled(targetPkg) ||
          DeviceAppScannerService.isPackageInstalled(targetPkg, target.provider.packageVariants);

        if (isInstalledNow && (cameraInstallPhase === 'awaiting_installer' || cameraInstallPhase === 'idle')) {
          setCameraInstallPhase('verified_ready');
          setVerificationFeedback(`✓ ${target.provider.displayName} package verified on device!`);
          CameraProviderRegistry.setSelectedProvider(target.provider.id);
        }

        const req = FullPackRequirementManager.checkComponentRequirements(7);
        setActiveRequirement(req);
      }
    };

    if (cameraInstallPhase === 'awaiting_installer') {
      poller = setInterval(checkStatus, 1500);
    }

    const handleFocus = () => {
      checkStatus();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (poller) clearInterval(poller);
    };
  }, [isOpen, wizardState.currentStepIndex, cameraInstallPhase, installingCandidate]);

  if (!isOpen) return null;

  const currentStep =
    wizardState.currentStepIndex <= 7
      ? wizardState.steps.find((s) => s.index === wizardState.currentStepIndex)
      : null;

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleStartSetup = () => {
    FullPackRequirementManager.updateWizardState({
      isStarted: true,
      currentStepIndex: 1,
      startedAt: new Date().toISOString(),
    });
  };

  const handleApplyCurrentStep = async () => {
    if (wizardState.currentStepIndex > 7) return;
    const stepIdx = wizardState.currentStepIndex as 1 | 2 | 3 | 4 | 5 | 6 | 7;

    setIsProcessing(true);
    FullPackRequirementManager.setComponentStatus(stepIdx, 'in_progress');

    try {
      const activeCam = installingCandidate || recommendedCamera;
      const res = await FullPackService.applyComponentByIndex(stepIdx, {
        cameraProviderId: activeCam?.provider.id,
      });

      if (res.success) {
        FullPackRequirementManager.setComponentStatus(
          stepIdx,
          'applied',
          res.message,
          res.assetName
        );
        setIsProcessing(false);
        FullPackRequirementManager.nextStep();
      } else {
        FullPackRequirementManager.setComponentStatus(
          stepIdx,
          'needs_attention',
          res.message,
          res.assetName
        );
        setIsProcessing(false);
      }
    } catch (e: any) {
      FullPackRequirementManager.setComponentStatus(
        stepIdx,
        'needs_attention',
        e?.message || 'Component failed to apply'
      );
      setIsProcessing(false);
    }
  };

  const handleSkipCurrentStep = () => {
    FullPackRequirementManager.skipCurrentStep('User skipped this component');
  };

  // Jarvis: Open Android Accessibility Settings
  const handleOpenAccessibility = () => {
    PlatformBridge.openAccessibilitySettings();
    setVerificationFeedback('Android Accessibility Settings opened. Enable ONEVA service and return here.');
  };

  // Jarvis: Re-verify actual Accessibility Service status
  const handleVerifyAccessibility = async () => {
    const isEnabled = PlatformBridge.hasAccessibilityPermission();
    if (isEnabled) {
      setVerificationFeedback('✓ ONEVA Accessibility Service is active!');
      await handleApplyCurrentStep();
    } else {
      setVerificationFeedback(
        'ONEVA Accessibility Service is not enabled yet in Android Settings. Please enable it or skip Jarvis.'
      );
    }
  };

  // =========================================================================
  // CAMERA DIRECT PACKAGE INSTALLER ARCHITECTURE (Component 7)
  // =========================================================================

  // 1. User presses [INSTALL <Provider>]
  const handleInitiateCameraInstall = (candidate?: EvaluatedCameraCandidate | null) => {
    const target = candidate || recommendedCamera;
    if (!target) return;
    setInstallingCandidate(target);

    // If direct APK package exists (e.g., LMC 8.4 Hasli, Open Camera direct)
    if (target.provider.directApkDownloadUrl) {
      setCameraInstallPhase('consent');
    } else if (
      target.provider.distributionChannel === 'samsung_galaxy_store' ||
      target.provider.distributionChannel === 'google_play'
    ) {
      // Direct store market intent handoff
      const storeType =
        target.provider.distributionChannel === 'samsung_galaxy_store'
          ? 'samsung_galaxy_store'
          : 'google_play';
      const targetUrl = target.provider.playStorePackage
        ? `https://play.google.com/store/apps/details?id=${target.provider.playStorePackage}`
        : target.provider.officialWebUrl;
      PlatformBridge.openMarketOrWebUrl(targetUrl, target.provider.primaryPackageName, storeType);
      setCameraInstallPhase('awaiting_installer');
      setVerificationFeedback(
        `Opened official store for ${target.provider.displayName}. Complete install, then return to ONEVA.`
      );
    } else {
      PlatformBridge.openMarketOrWebUrl(target.provider.officialWebUrl);
      setCameraInstallPhase('awaiting_installer');
      setVerificationFeedback(
        `Opened official source for ${target.provider.displayName}. Return to ONEVA after install.`
      );
    }
  };

  // 2. User confirms explicit consent in sheet
  const handleConsentConfirmed = async () => {
    if (!installingCandidate) return;

    // Check unknown apps install permission on Android
    const hasPerm = PlatformBridge.canRequestPackageInstalls();
    if (!hasPerm) {
      setCameraInstallPhase('permission_prompt');
      return;
    }

    await startApkDownloadAndHandoff(installingCandidate);
  };

  // 3. Downloads package and invokes installApkFile (FileProvider handoff)
  const startApkDownloadAndHandoff = async (target: EvaluatedCameraCandidate) => {
    setCameraInstallPhase('downloading');
    setDownloadProgress(15);
    setDownloadStatusText('Connecting to verified official distribution repository...');

    const prov = target.provider;
    const downloadUrl = prov.directApkDownloadUrl || prov.officialWebUrl;
    const fileName = prov.apkFileName || `${prov.id}.apk`;

    const res = await PlatformBridge.downloadAndInstallApk(
      downloadUrl,
      fileName,
      prov.primaryPackageName,
      prov.expectedSha256,
      (percent, status) => {
        setDownloadProgress(percent);
        setDownloadStatusText(status);
      }
    );

    if (res.success) {
      setCameraInstallPhase('awaiting_installer');
      setVerificationFeedback('Package verified authentic! Android Package Installer opened. Confirm installation on screen.');
    } else if (res.requiresPermission) {
      setCameraInstallPhase('permission_prompt');
    } else {
      setCameraInstallPhase('error');
      setVerificationFeedback(res.message || 'Package verification failed. Installation blocked.');
    }
  };

  // 4. Verifies installation and activates provider
  const handleVerifyAndActivateCamera = async () => {
    DeviceAppScannerService.rescan();
    const target = installingCandidate || recommendedCamera;
    if (!target) return;

    const targetPkg = target.provider.primaryPackageName;
    const isInstalled =
      PlatformBridge.isAppInstalled(targetPkg) ||
      DeviceAppScannerService.isPackageInstalled(targetPkg, target.provider.packageVariants);

    if (isInstalled) {
      setCameraInstallPhase('verified_ready');
      CameraProviderRegistry.setSelectedProvider(target.provider.id);
      setIsProcessing(true);
      const res = await FullPackService.applyComponentByIndex(7, {
        cameraProviderId: target.provider.id,
      });
      FullPackRequirementManager.setComponentStatus(
        7,
        'applied',
        `Installed & verified (${target.provider.displayName})`,
        target.provider.displayName
      );
      setIsProcessing(false);
      setVerificationFeedback(`✓ ${target.provider.displayName} verified and activated!`);
    } else {
      setVerificationFeedback(
        `Package ${targetPkg} not detected yet. Complete installation in Android Package Installer, or tap "Simulate Install" for web preview.`
      );
    }
  };

  // 5. Web preview test helper
  const handleSimulateInstallPackage = async () => {
    const target = installingCandidate || recommendedCamera;
    if (!target) return;
    DeviceAppScannerService.toggleAppInstalled(target.provider.primaryPackageName, true);
    await handleVerifyAndActivateCamera();
  };

  // 6. Test launch verified camera
  const handleLaunchCamera = async () => {
    const target = installingCandidate || recommendedCamera;
    if (!target) return;
    const res = await CameraProviderRegistry.launchProvider(target.provider);
    setVerificationFeedback(res.message);
  };

  // 7. Unknown apps settings trigger
  const handleOpenUnknownAppsSettings = () => {
    PlatformBridge.openManageUnknownAppSources();
    setVerificationFeedback('Android Settings opened. Toggle "Allow from this source" for ONEVA and return here.');
  };

  // 8. Simulated permission for web preview testing
  const handleGrantSimulatedPermission = async () => {
    PlatformBridge.setSimulatedInstallPermission(true);
    if (installingCandidate) {
      await startApkDownloadAndHandoff(installingCandidate);
    }
  };

  // 9. Camera: Choose Guaranteed Built-in Fallback
  const handleSelectBuiltInCamera = async () => {
    CameraProviderRegistry.setSelectedProvider('oneva_builtin');
    setIsProcessing(true);
    const res = await FullPackService.applyComponentByIndex(7, {
      cameraProviderId: 'oneva_builtin',
    });
    FullPackRequirementManager.setComponentStatus(
      7,
      'applied',
      'Using guaranteed ONEVA Built-in Camera.',
      'ONEVA Built-in Camera'
    );
    setIsProcessing(false);
    FullPackRequirementManager.nextStep();
  };

  const handleFinishWizard = () => {
    if (onApplied) onApplied();
    onClose();
  };

  // ---------------------------------------------------------------------------
  // Helper Icons & Status Renderers
  // ---------------------------------------------------------------------------

  const getStepIcon = (index: number) => {
    switch (index) {
      case 1:
        return <Image className="w-4 h-4 text-emerald-400" />;
      case 2:
        return <Layers className="w-4 h-4 text-cyan-400" />;
      case 3:
        return <Sliders className="w-4 h-4 text-amber-400" />;
      case 4:
        return <Keyboard className="w-4 h-4 text-purple-400" />;
      case 5:
        return <Cpu className="w-4 h-4 text-blue-400" />;
      case 6:
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 7:
        return <Camera className="w-4 h-4 text-emerald-300" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  const renderStatusBadge = (status: ComponentSetupStatus) => {
    switch (status) {
      case 'applied':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Check className="w-3 h-3" />
            Applied
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
            <CornerDownRight className="w-3 h-3 text-amber-400" />
            Skipped
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            In Progress
          </span>
        );
      case 'needs_attention':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            Needs Action
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-500 border border-neutral-800">
            ○ Pending
          </span>
        );
    }
  };

  // ---------------------------------------------------------------------------
  // JSX Render
  // ---------------------------------------------------------------------------

  return (
    <div
      id="full-pack-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="full-pack-modal-dialog"
        className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                ONEVA Full Pack — Guided Setup
              </h2>
              <p className="text-[11px] text-neutral-400">
                {wizardState.isCompleted
                  ? 'Setup Finished • Summary'
                  : `Component ${wizardState.currentStepIndex} of 7: ${currentStep?.name || ''}`}
              </p>
            </div>
          </div>
          <button
            id="full-pack-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 7-Step Progress Pill Bar */}
        <div className="px-5 py-2.5 bg-neutral-950 border-b border-neutral-800/80 overflow-x-auto scrollbar-none flex items-center gap-1.5">
          {wizardState.steps.map((st) => {
            const isCurrent = st.index === wizardState.currentStepIndex && !wizardState.isCompleted;
            return (
              <div
                key={st.index}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : st.status === 'applied'
                    ? 'bg-neutral-900 text-emerald-400/80 border border-emerald-500/20'
                    : st.status === 'skipped'
                    ? 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                    : 'bg-neutral-950 text-neutral-600 border border-neutral-900'
                }`}
              >
                <span>#{st.index}</span>
                <span className="hidden sm:inline">{st.name}</span>
                {st.status === 'applied' && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                {st.status === 'skipped' && <CornerDownRight className="w-2.5 h-2.5 text-amber-400" />}
              </div>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Notification Feedback Toast */}
          {verificationFeedback && (
            <div className="p-3 rounded-xl bg-neutral-950 border border-emerald-500/40 text-neutral-200 text-xs flex items-center gap-2 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{verificationFeedback}</span>
            </div>
          )}

          {/* SCREEN 1: PRE-FLIGHT / START OVERVIEW */}
          {!wizardState.isStarted && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <span className="text-xs font-bold text-white block">
                  Requirement-First Guided Installation
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Applies the 7 core ONEVA components in sequence. Each component is validated beforehand. If you skip any component, the rest remain safely applied without breaking your phone.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block">
                  The 7 Components To Be Calibrated
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {FullPackRequirementManager.COMPONENTS_MANIFEST.map((comp) => (
                    <div
                      key={comp.index}
                      className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                          {getStepIcon(comp.index)}
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-white truncate block">
                            #{comp.index} {comp.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 truncate block">
                            {comp.description}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500 shrink-0">Ready</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 2: ACTIVE COMPONENT SETUP (STEPS 1 TO 7) */}
          {wizardState.isStarted && !wizardState.isCompleted && currentStep && (
            <div className="space-y-4">
              {/* Active Step Card */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
                      {getStepIcon(currentStep.index)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                          Step {currentStep.index} of 7
                        </span>
                        {renderStatusBadge(currentStep.status)}
                      </div>
                      <h3 className="text-base font-bold text-white">{currentStep.name}</h3>
                    </div>
                  </div>
                </div>

                {/* Requirement / Prerequisite Details */}
                {activeRequirement && (
                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {activeRequirement.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                          activeRequirement.status === 'SATISFIED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {activeRequirement.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      {activeRequirement.description}
                    </p>
                    {activeRequirement.detectedDetail && (
                      <p className="text-[10px] text-neutral-500 font-mono">
                        Status: {activeRequirement.detectedDetail}
                      </p>
                    )}
                  </div>
                )}

                {/* SPECIAL HANDLING: COMPONENT 5 (JARVIS ACCESSIBILITY REQUIRED) */}
                {currentStep.index === 5 && activeRequirement?.status === 'NEEDS_USER_ACTION' && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 text-xs text-neutral-300">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Accessibility Permission Needed</strong>
                        <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed">
                          To automate tasks across installed applications, Jarvis needs you to turn on ONEVA in Android Accessibility Settings.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        onClick={handleOpenAccessibility}
                        className="flex-1 py-2 px-3 rounded-lg bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Accessibility Settings
                      </button>
                      <button
                        onClick={handleVerifyAccessibility}
                        className="py-2 px-3 rounded-lg bg-neutral-800 text-white font-semibold text-xs hover:bg-neutral-700 transition cursor-pointer"
                      >
                        Check Permission
                      </button>
                    </div>
                  </div>
                )}

                {/* SPECIAL HANDLING: COMPONENT 7 (MULTI-CAMERA PROVIDER SELECTION & SECURE INSTALLER HANDOFF) */}
                {currentStep.index === 7 && (installingCandidate || recommendedCamera) && (() => {
                  const activeCandidate = installingCandidate || recommendedCamera!;
                  const prov = activeCandidate.provider;
                  const isActuallyInstalled =
                    activeCandidate.isInstalled ||
                    PlatformBridge.isAppInstalled(prov.primaryPackageName) ||
                    DeviceAppScannerService.isPackageInstalled(prov.primaryPackageName, prov.packageVariants);

                  return (
                    <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                      {/* PHASE 1: IDLE / CANDIDATE OVERVIEW */}
                      {cameraInstallPhase === 'idle' && (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                                  Recommended Camera for Your Device
                                </span>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                                  {prov.distributionChannel === 'official_direct_apk'
                                    ? 'Direct Package Installer'
                                    : prov.distributionChannel === 'samsung_galaxy_store'
                                    ? 'Galaxy Store'
                                    : prov.distributionChannel === 'google_play'
                                    ? 'Google Play'
                                    : 'Built-in'}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white mt-0.5">
                                {prov.displayName}
                              </h4>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                {prov.tagline}
                              </p>
                            </div>
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase shrink-0 font-bold border ${
                                isActuallyInstalled
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                              }`}
                            >
                              {isActuallyInstalled ? 'Installed' : 'Compatible'}
                            </span>
                          </div>

                          {/* Verified Capabilities Badges (Honest, device-dependent) */}
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-neutral-300">
                            {prov.capabilities.hdr && (
                              <div className="p-1.5 rounded bg-neutral-950 border border-neutral-800 flex items-center gap-1">
                                <Check className="w-3 h-3 text-cyan-400" />
                                <span>HDR (Device dependent)</span>
                              </div>
                            )}
                            {prov.capabilities.multiFrameBurst && (
                              <div className="p-1.5 rounded bg-neutral-950 border border-neutral-800 flex items-center gap-1">
                                <Check className="w-3 h-3 text-cyan-400" />
                                <span>Multi-Frame Burst</span>
                              </div>
                            )}
                            {prov.capabilities.lowLightOptics && (
                              <div className="p-1.5 rounded bg-neutral-950 border border-neutral-800 flex items-center gap-1">
                                <Check className="w-3 h-3 text-cyan-400" />
                                <span>Low-Light (Device dependent)</span>
                              </div>
                            )}
                            {prov.capabilities.rawCapture && (
                              <div className="p-1.5 rounded bg-neutral-950 border border-neutral-800 flex items-center gap-1">
                                <Check className="w-3 h-3 text-cyan-400" />
                                <span>RAW (Sensor dependent)</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 pt-1">
                            {isActuallyInstalled ? (
                              <button
                                onClick={handleApplyCurrentStep}
                                disabled={isProcessing}
                                className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
                              >
                                <Check className="w-4 h-4" />
                                Use {prov.displayName} & Continue
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleInitiateCameraInstall(activeCandidate)}
                                  className="w-full py-2.5 rounded-xl bg-cyan-500 text-neutral-950 font-bold text-xs hover:bg-cyan-400 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/40"
                                >
                                  <Download className="w-4 h-4" />
                                  Install {prov.displayName}
                                </button>
                                <button
                                  onClick={handleSelectBuiltInCamera}
                                  className="w-full py-2 rounded-xl bg-neutral-800 text-neutral-200 font-semibold text-xs hover:bg-neutral-700 transition cursor-pointer"
                                >
                                  Use Built-in ONEVA Camera (Fallback)
                                </button>
                                <button
                                  onClick={handleSkipCurrentStep}
                                  className="w-full py-1 text-neutral-400 hover:text-white text-xs"
                                >
                                  Skip Camera Setup
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}

                      {/* PHASE 2: EXPLICIT CONSENT SHEET WITH REAL SHA-256 */}
                      {cameraInstallPhase === 'consent' && (
                        <div className="space-y-3 animate-in fade-in">
                          <div className="flex items-center gap-2 text-white font-bold text-xs">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Package Acquisition & Integrity Consent</span>
                          </div>

                          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 space-y-1.5">
                            <div className="flex justify-between border-b border-neutral-800/80 pb-1">
                              <span className="text-neutral-500 font-mono">Camera Engine:</span>
                              <span className="font-semibold text-white">{prov.displayName}</span>
                            </div>
                            <div className="flex justify-between border-b border-neutral-800/80 pb-1">
                              <span className="text-neutral-500 font-mono">Package ID:</span>
                              <span className="font-mono text-cyan-300">{prov.primaryPackageName}</span>
                            </div>
                            {prov.apkVersionName && (
                              <div className="flex justify-between border-b border-neutral-800/80 pb-1">
                                <span className="text-neutral-500 font-mono">Version / Size:</span>
                                <span className="font-mono text-neutral-300">
                                  {prov.apkVersionName} • {prov.apkApproxSize || '106 MB'}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between border-b border-neutral-800/80 pb-1">
                              <span className="text-neutral-500 font-mono">Source Type:</span>
                              <span className="text-neutral-300 text-right font-medium max-w-[200px] truncate">
                                {prov.sourceCategory === 'COMMUNITY_PORT_REPOSITORY'
                                  ? 'Community Port Repository'
                                  : prov.sourceCategory === 'OFFICIAL_REPOSITORY'
                                  ? 'Official Open Source Repository'
                                  : prov.sourceCategory === 'SAMSUNG_GALAXY_STORE'
                                  ? 'Samsung Galaxy Store'
                                  : 'Google Play Store'}
                              </span>
                            </div>
                            {prov.expectedSha256 && (
                              <div className="pt-0.5 space-y-0.5">
                                <span className="text-neutral-500 font-mono block text-[10px]">
                                  Expected SHA-256 Checksum:
                                </span>
                                <span className="font-mono text-[9px] text-emerald-400 break-all bg-neutral-900 p-1 rounded block border border-neutral-800">
                                  {prov.expectedSha256}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 leading-relaxed space-y-1">
                            <span className="font-bold flex items-center gap-1 text-emerald-400">
                              <FileCheck className="w-3.5 h-3.5" />
                              Cryptographic Byte Verification:
                            </span>
                            <p>
                              ONEVA downloads the untouched package directly from the upstream repository, computes SHA-256 bytes, and blocks installation if the hash mismatches. Android/Google Play Protect may scan the package according to device/system configuration before installation.
                            </p>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => setCameraInstallPhase('idle')}
                              className="px-3 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-semibold text-xs hover:bg-neutral-700 transition cursor-pointer"
                            >
                              Back
                            </button>
                            <button
                              onClick={handleConsentConfirmed}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Verify & Hand off to Installer
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PHASE 3: UNKNOWN APPS PERMISSION GUIDANCE */}
                      {cameraInstallPhase === 'permission_prompt' && (
                        <div className="space-y-3 animate-in fade-in">
                          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>"Install Unknown Apps" Permission Required</span>
                          </div>

                          <p className="text-[11px] text-neutral-300 leading-relaxed">
                            Android security requires explicit permission for ONEVA to hand off downloaded camera packages to the official system Package Installer.
                          </p>

                          <div className="flex flex-col gap-2 pt-1">
                            <button
                              onClick={handleOpenUnknownAppsSettings}
                              className="w-full py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/40"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open "Install Unknown Apps" Settings
                            </button>
                            <button
                              onClick={handleGrantSimulatedPermission}
                              className="w-full py-2 rounded-xl bg-neutral-800 text-cyan-300 font-mono text-[10px] hover:bg-neutral-700 transition cursor-pointer border border-cyan-500/30"
                            >
                              Simulate Grant Permission (Web Preview)
                            </button>
                            <button
                              onClick={handleSelectBuiltInCamera}
                              className="w-full py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 font-semibold text-xs hover:bg-neutral-800 transition cursor-pointer"
                            >
                              Use Built-in ONEVA Camera (Fallback)
                            </button>
                            <button
                              onClick={handleSkipCurrentStep}
                              className="w-full py-1 text-neutral-400 hover:text-white text-xs"
                            >
                              Skip Camera Step
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PHASE 4: DOWNLOADING OFFICIAL PACKAGE */}
                      {cameraInstallPhase === 'downloading' && (
                        <div className="space-y-3 text-center py-2 animate-in fade-in">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto animate-pulse">
                            <Download className="w-5 h-5 animate-bounce" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              Downloading & Computing SHA-256
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                              {downloadStatusText || 'Connecting to verified distribution source...'}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
                              style={{ width: `${downloadProgress}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                            <span>{downloadProgress}% Completed</span>
                            <span>{prov.apkApproxSize || '106 MB'}</span>
                          </div>
                        </div>
                      )}

                      {/* PHASE 5: AWAITING ANDROID PACKAGE INSTALLATION */}
                      {cameraInstallPhase === 'awaiting_installer' && (
                        <div className="space-y-3 animate-in fade-in">
                          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-1.5 text-xs text-neutral-300">
                            <div className="flex items-center gap-2 text-cyan-300 font-bold">
                              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                              <span>Package Installer Active</span>
                            </div>
                            <p className="text-[11px] text-neutral-300 leading-relaxed">
                              Please confirm "Install" on Android's Package Installer dialog and return to ONEVA. ONEVA will automatically detect when the package is installed.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 pt-1">
                            <button
                              onClick={handleVerifyAndActivateCamera}
                              disabled={isProcessing}
                              className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Verify Installation & Activate
                            </button>
                            <button
                              onClick={handleSimulateInstallPackage}
                              className="w-full py-2 rounded-xl bg-neutral-800 text-cyan-300 font-mono text-[10px] hover:bg-neutral-700 transition cursor-pointer border border-cyan-500/30"
                            >
                              Simulate Android Install Confirmation (Web Preview)
                            </button>
                            <button
                              onClick={handleSelectBuiltInCamera}
                              className="w-full py-1.5 rounded-lg text-neutral-400 hover:text-white text-xs"
                            >
                              Use Built-in ONEVA Camera (Fallback)
                            </button>
                            <button
                              onClick={handleSkipCurrentStep}
                              className="w-full py-1 text-neutral-500 hover:text-neutral-400 text-xs"
                            >
                              Skip Camera Step
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PHASE 6: VERIFIED & READY */}
                      {cameraInstallPhase === 'verified_ready' && (
                        <div className="space-y-3 text-center py-2 animate-in fade-in">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              ✓ {prov.displayName} Installed & Activated!
                            </span>
                            <span className="text-[11px] text-neutral-400 block mt-0.5">
                              Verified authentic package. Computational photography engine calibrated.
                            </span>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={handleLaunchCamera}
                              className="px-3 py-2 rounded-xl bg-neutral-800 text-white font-semibold text-xs hover:bg-neutral-700 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3 h-3 text-emerald-400" />
                              Launch Test
                            </button>
                            <button
                              onClick={handleApplyCurrentStep}
                              disabled={isProcessing}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-emerald-950/40"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Continue & Finish Setup
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PHASE 7: VERIFICATION ERROR / BLOCKED (CRITICAL REQUIREMENT 1) */}
                      {cameraInstallPhase === 'error' && (
                        <div className="space-y-3 animate-in fade-in">
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 text-xs text-rose-300">
                            <div className="flex items-center gap-2 font-bold text-rose-400">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>Package verification failed. Installation blocked.</span>
                            </div>
                            <p className="text-[11px] text-rose-200/90 leading-relaxed">
                              {verificationFeedback || 'The package integrity check or SHA-256 checksum did not match the trusted developer hash. The installation was immediately stopped to protect your device.'}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 pt-1">
                            <button
                              onClick={() => setCameraInstallPhase('idle')}
                              className="w-full py-2.5 rounded-xl bg-neutral-800 text-neutral-200 font-semibold text-xs hover:bg-neutral-700 transition cursor-pointer"
                            >
                              Retry / Choose Another Provider
                            </button>
                            <button
                              onClick={handleSelectBuiltInCamera}
                              className="w-full py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition cursor-pointer shadow-lg shadow-emerald-950/40"
                            >
                              Use Built-in ONEVA Camera (Fallback)
                            </button>
                            <button
                              onClick={handleSkipCurrentStep}
                              className="w-full py-1 text-neutral-400 hover:text-white text-xs"
                            >
                              Skip Camera Step
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* SCREEN 3: SUMMARY / COMPLETED */}
          {wizardState.isCompleted && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">Full ONEVA Pack Setup Finished</h3>
                <p className="text-xs text-neutral-300">
                  {wizardState.appliedCount} of 7 components calibrated.{' '}
                  {wizardState.skippedCount > 0
                    ? `${wizardState.skippedCount} component(s) were skipped safely.`
                    : 'All subsystems verified.'}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block">
                  Final Subsystems Status
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {wizardState.steps.map((st) => (
                    <div
                      key={st.index}
                      className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                          {getStepIcon(st.index)}
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-white truncate block">
                            #{st.index} {st.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 truncate block">
                            {st.selectedAssetOrProvider || st.detailMessage || 'Calibrated'}
                          </span>
                        </div>
                      </div>
                      {renderStatusBadge(st.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between gap-3">
          {!wizardState.isStarted && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartSetup}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Start Guided Setup
              </button>
            </>
          )}

          {wizardState.isStarted && !wizardState.isCompleted && currentStep && (
            <>
              {/* Skip Component Button (Skips ONLY this component; previous stay applied!) */}
              <button
                type="button"
                onClick={handleSkipCurrentStep}
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1"
                title="Skip this component and continue to the next"
              >
                <CornerDownRight className="w-3 h-3 text-amber-400" />
                Skip {currentStep.name}
              </button>

              {/* Apply / Continue Button */}
              {currentStep.index !== 7 ? (
                <button
                  type="button"
                  onClick={handleApplyCurrentStep}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Apply & Continue
                    </>
                  )}
                </button>
              ) : cameraInstallPhase === 'verified_ready' || recommendedCamera?.isInstalled ? (
                <button
                  type="button"
                  onClick={handleApplyCurrentStep}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Continue & Finish
                    </>
                  )}
                </button>
              ) : null}
            </>
          )}

          {wizardState.isCompleted && (
            <button
              type="button"
              onClick={handleFinishWizard}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              Done / Return to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
