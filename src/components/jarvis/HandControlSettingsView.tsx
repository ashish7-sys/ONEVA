/**
 * ONEVA Phase 21: Hand Control & Gesture Automation Settings View
 * 
 * Mobile-first configuration dashboard for gesture mappings, custom gesture enrollment,
 * camera permission diagnostics, activation triggers, and interactive simulation.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Hand,
  Camera,
  ShieldCheck,
  Sparkles,
  Sliders,
  Volume2,
  Vibrate,
  Play,
  Upload,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { HandControlService } from '../../services/intelligence/gestures/handControlService';
import { CameraStreamManager } from '../../services/intelligence/gestures/cameraStreamManager';
import {
  HandControlConfig,
  HandControlMapping,
  HandControlServiceState,
  HandGestureType,
  HandControlActionType,
} from '../../types/jarvisHandControl';
import { JarvisPhase21TestSuite, Phase21TestResult } from '../../services/intelligence/jarvisPhase21Tests';
import { JarvisToolId } from '../../types/jarvisActions';

export function HandControlSettingsView() {
  const [state, setState] = useState<HandControlServiceState>(HandControlService.getState());
  const [isEnrollingLive, setIsEnrollingLive] = useState(false);
  const [enrollName, setEnrollName] = useState('');
  const [enrollDesc, setEnrollDesc] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<HandControlActionType>('phase20_stop_task');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [editingMapping, setEditingMapping] = useState<HandControlMapping | null>(null);

  // Phase 21 Test Suite State
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    passed: number;
    failed: number;
    total: number;
    results: Phase21TestResult[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRunTestSuite = async () => {
    setIsTesting(true);
    try {
      const summary = await JarvisPhase21TestSuite.runAllTests();
      setTestResults(summary);
    } catch (err) {
      console.error('Test suite failed:', err);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    const unsub = HandControlService.subscribe((s) => setState(s));
    return () => unsub();
  }, []);

  const handleToggleEnable = async () => {
    if (state.isActive) {
      HandControlService.disableHandControl();
    } else {
      const res = await HandControlService.enableHandControl();
      if (!res.success) {
        setUploadError(res.message);
      }
    }
  };

  const handleRequestPermission = async () => {
    const granted = await CameraStreamManager.requestPermission();
    if (granted) {
      setUploadSuccess('Camera permission granted successfully.');
      setUploadError(null);
    } else {
      setUploadError('Camera access was denied. Please allow camera permissions.');
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    const res = await HandControlService.enrollCustomGestureFromVideo(
      file,
      enrollName || 'Custom Gesture',
      enrollDesc || 'Custom enrolled hand gesture',
      {
        actionType: selectedActionType,
        label: enrollName || 'Custom Gesture',
        description: 'Triggered by custom motion pattern',
      }
    );

    if (res.success) {
      setUploadSuccess(res.message);
      setEnrollName('');
      setEnrollDesc('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setUploadError(res.message);
    }
  };

  const handleLiveEnroll = () => {
    setUploadError(null);
    setUploadSuccess(null);

    const res = HandControlService.enrollCustomGestureFromLive(
      enrollName || 'Live Custom Gesture',
      enrollDesc || 'Live enrolled hand gesture',
      {
        actionType: selectedActionType,
        label: enrollName || 'Live Custom Gesture',
        description: 'Triggered by live enrolled posture',
      }
    );

    if (res.success) {
      setUploadSuccess(res.message);
      setIsEnrollingLive(false);
      setEnrollName('');
      setEnrollDesc('');
    } else {
      setUploadError(res.message);
    }
  };

  return (
    <div id="hand-control-settings-view" className="space-y-6 max-w-4xl mx-auto pb-12 text-neutral-200">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm tracking-wide">
              <Hand className="w-4 h-4" />
              <span>JARVIS HAND CONTROL & GESTURE AUTOMATION</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
              Touchless Gesture Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
              Control JARVIS with zero-touch camera gestures. Ephemeral on-device processing
              strictly follows ONEVA Rule 6 — no images are ever stored or uploaded.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="hand-control-master-toggle"
              type="button"
              onClick={handleToggleEnable}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-lg ${
                state.isActive
                  ? 'bg-cyan-500 text-neutral-950 hover:bg-cyan-400 font-semibold ring-2 ring-cyan-400/40'
                  : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700'
              }`}
            >
              <Camera className="w-4 h-4" />
              {state.isActive ? 'Hand Control Active' : 'Enable Hand Control'}
            </button>
          </div>
        </div>

        {/* Status Pills */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800/60 border border-neutral-700/60">
            <span
              className={`w-2 h-2 rounded-full ${
                state.cameraPermission === 'granted'
                  ? 'bg-emerald-400'
                  : state.cameraPermission === 'denied'
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-neutral-300">
              Camera: <strong className="capitalize">{state.cameraPermission}</strong>
            </span>
            {state.cameraPermission !== 'granted' && (
              <button
                id="request-camera-permission-btn"
                type="button"
                onClick={handleRequestPermission}
                className="ml-1 text-cyan-400 hover:underline"
              >
                Request
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800/60 border border-neutral-700/60 text-neutral-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rule 6: Ephemeral On-Device CV</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800/60 border border-neutral-700/60 text-neutral-300">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Confidence Threshold: {Math.round(state.config.confidenceThreshold * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Activation Method & Core Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Activation Settings */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Activation Triggers
          </h3>
          <div className="space-y-2">
            {[
              { id: 'manual', label: 'Manual Switch / Quick HUD', desc: 'Activate on-demand via toggle' },
              { id: 'double_snap', label: 'Two Quick Finger Snaps', desc: 'Audio pattern trigger enters Hand Control' },
              { id: 'quick_tile', label: 'ONEVA Quick Panel Tile', desc: 'Access from top status pull-down' },
              { id: 'voice_wake', label: 'Voice Command ("Enable Hand Control")', desc: 'Spoken wake phrase activation' },
            ].map((method) => (
              <label
                key={method.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  state.config.activationMethod === method.id
                    ? 'bg-cyan-950/20 border-cyan-500/40 text-neutral-100'
                    : 'bg-neutral-950/30 border-neutral-800/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="activationMethod"
                  value={method.id}
                  checked={state.config.activationMethod === method.id}
                  onChange={() =>
                    HandControlService.updateConfig({
                      activationMethod: method.id as HandControlConfig['activationMethod'],
                    })
                  }
                  className="mt-0.5 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <div className="text-xs font-medium text-neutral-200">{method.label}</div>
                  <div className="text-[11px] text-neutral-400">{method.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Feedback & Recognition Tuning */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Detection & Feedback Parameters
          </h3>

          <div className="space-y-4 text-xs">
            {/* Confidence Slider */}
            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span>Minimum Confidence Score</span>
                <span className="font-mono text-cyan-400">
                  {Math.round(state.config.confidenceThreshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.45"
                max="0.90"
                step="0.05"
                value={state.config.confidenceThreshold}
                onChange={(e) =>
                  HandControlService.updateConfig({
                    confidenceThreshold: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-cyan-500"
              />
              <span className="text-[10px] text-neutral-400">
                Prevents accidental actions. Higher values require precise postures.
              </span>
            </div>

            {/* Cooldown Slider */}
            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span>Debounce Cooldown</span>
                <span className="font-mono text-cyan-400">{state.config.cooldownMs}ms</span>
              </div>
              <input
                type="range"
                min="600"
                max="2500"
                step="100"
                value={state.config.cooldownMs}
                onChange={(e) =>
                  HandControlService.updateConfig({
                    cooldownMs: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-cyan-500"
              />
              <span className="text-[10px] text-neutral-400">
                Prevents rapid repeated triggers while holding a gesture.
              </span>
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-neutral-800/80 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-neutral-300">
                  <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                  Voice Confirmation ("Done, sir.")
                </span>
                <input
                  type="checkbox"
                  checked={state.config.voiceConfirmation}
                  onChange={(e) =>
                    HandControlService.updateConfig({ voiceConfirmation: e.target.checked })
                  }
                  className="rounded text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-neutral-300">
                  <Vibrate className="w-3.5 h-3.5 text-neutral-400" />
                  Haptic Feedback Pulse
                </span>
                <input
                  type="checkbox"
                  checked={state.config.hapticFeedback}
                  onChange={(e) =>
                    HandControlService.updateConfig({ hapticFeedback: e.target.checked })
                  }
                  className="rounded text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-neutral-300">
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                  Floating HUD Hints
                </span>
                <input
                  type="checkbox"
                  checked={state.config.showHints}
                  onChange={(e) =>
                    HandControlService.updateConfig({ showHints: e.target.checked })
                  }
                  className="rounded text-cyan-500 focus:ring-cyan-500"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Active Mappings List */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <Hand className="w-4 h-4 text-cyan-400" />
              Configured Hand Gesture Mappings
            </h3>
            <p className="text-xs text-neutral-400">
              Each gesture is dispatched strictly through JARVIS security and permission checks.
            </p>
          </div>
          <button
            type="button"
            onClick={() => HandControlService.resetToDefaults()}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {state.config.mappings.map((mapping) => (
            <div
              key={mapping.id}
              className={`p-3.5 rounded-xl border transition-all ${
                mapping.enabled
                  ? 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700'
                  : 'bg-neutral-950/20 border-neutral-900/80 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 uppercase">
                      {mapping.gestureType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-semibold text-neutral-200">{mapping.label}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">{mapping.description}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={mapping.enabled}
                    onChange={(e) =>
                      HandControlService.updateMapping(mapping.id, { enabled: e.target.checked })
                    }
                    className="rounded text-cyan-500 focus:ring-cyan-500"
                    title="Enable/disable mapping"
                  />
                  {/* Simulate Gesture Test Button */}
                  <button
                    type="button"
                    onClick={() => HandControlService.simulateGesture(mapping.gestureType, 0.88)}
                    className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-cyan-300 hover:bg-neutral-700 transition-colors"
                    title={`Test ${mapping.gestureType}`}
                  >
                    <Play className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Gesture Enrollment Section */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Enroll Custom Gesture
          </h3>
          <p className="text-xs text-neutral-400">
            Record a unique hand posture from camera or upload a reference video (MP4/WebM, max 15MB,
            max 5s). Feature extraction is 100% local and ephemeral.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Gesture Name (e.g. Wave)"
            value={enrollName}
            onChange={(e) => setEnrollName(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder="Description"
            value={enrollDesc}
            onChange={(e) => setEnrollDesc(e.target.value)}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
          />
          <select
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value as HandControlActionType)}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="phase20_stop_task">Stop Active Task</option>
            <option value="phase20_close_panel">Close Work Panel</option>
            <option value="navigate_home">Go Home</option>
            <option value="navigate_back">Go Back</option>
            <option value="show_system_info">Show System Status</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Live camera enroll */}
          <button
            type="button"
            onClick={handleLiveEnroll}
            disabled={!state.isActive}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
              state.isActive
                ? 'bg-neutral-800 text-cyan-300 hover:bg-neutral-700 border border-cyan-500/30'
                : 'bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-not-allowed'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Capture Current Pose from Camera
          </button>

          {/* Reference Video Upload */}
          <label className="px-4 py-2 rounded-xl text-xs font-medium bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700 cursor-pointer flex items-center gap-2 transition-colors">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Upload Video (MP4/WebM)
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Custom Gestures Enrolled List */}
        {state.config.customGestures.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-800/80 space-y-2">
            <span className="text-xs font-medium text-neutral-300">Enrolled Custom Gestures:</span>
            <div className="space-y-2">
              {state.config.customGestures.map((custom) => (
                <div
                  key={custom.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-xs"
                >
                  <div>
                    <span className="font-semibold text-neutral-200">{custom.name}</span>
                    <span className="ml-2 text-neutral-400 text-[11px]">{custom.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => HandControlService.deleteCustomGesture(custom.id)}
                    className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                    title="Delete custom gesture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Gesture Execution Log */}
      {state.recentEvents.length > 0 && (
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            Live Gesture Event Stream
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {state.recentEvents.slice(0, 10).map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-neutral-950/40 border border-neutral-900 text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 uppercase">{evt.gesture}</span>
                  <span className="text-neutral-400">•</span>
                  <span className="text-neutral-300">{evt.actionLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      evt.executionStatus === 'EXECUTED'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                        : evt.executionStatus.startsWith('REJECTED')
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {evt.executionStatus}
                  </span>
                  <span className="font-mono text-neutral-500">
                    {Math.round(evt.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase 21 Architecture Verification Suite (25 Tests) */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Phase 21 Comprehensive Verification Suite
            </h3>
            <p className="text-xs text-neutral-400">
              Validates all 25 gesture engine contracts: permissions, debouncing, Phase 20 Stop vs. Close semantics, user isolation, and local execution.
            </p>
          </div>
          <button
            id="run-phase21-tests-btn"
            type="button"
            onClick={handleRunTestSuite}
            disabled={isTesting}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shrink-0 ${
              isTesting
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40 animate-pulse'
                : 'bg-cyan-500 text-neutral-950 hover:bg-cyan-400 font-bold'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            {isTesting ? 'Running 25 Tests...' : 'Run Verification (25 Tests)'}
          </button>
        </div>

        {testResults && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Passed: {testResults.passed} / {testResults.total}
              </span>
              {testResults.failed > 0 && (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Failed: {testResults.failed}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {testResults.results.map((res) => (
                <div
                  key={res.id}
                  className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                    res.passed
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                  }`}
                >
                  <span className="font-medium truncate">{res.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="font-mono text-[10px] text-neutral-400">
                      {res.durationMs}ms
                    </span>
                    {res.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
