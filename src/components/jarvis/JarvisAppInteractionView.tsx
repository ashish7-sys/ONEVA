/**
 * ONEVA Phase 16: Context-Aware App Interaction & Deep In-App Automation View
 * 
 * Provides real-time visibility into:
 * 1. Live Interactive App Screen Simulator (WhatsApp, YouTube, System UI)
 * 2. Real-time Automation Step Execution Pipeline (Node targeting, typing, clicking, verification)
 * 3. Native Android Accessibility Service status & Settings trigger
 * 4. Contextual reference test triggers & 15-scenario verification test suite runner
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Home,
  Search,
  Lock,
  RefreshCw,
  Clock,
  Sparkles,
  Smartphone,
  Play,
  RotateCcw,
  MessageSquare,
  Youtube,
  ThumbsUp,
  Sliders,
  Send,
  Bell,
  Cpu,
  Eye,
  Settings,
} from 'lucide-react';
import { JarvisDeviceContextManager } from '../../services/intelligence/jarvisDeviceContextManager';
import {
  AndroidAccessibilityBridge,
  AutomationStepEvent,
} from '../../services/actions/androidAccessibilityBridge';
import { JarvisActionSelector } from '../../services/actions/jarvisActionSelector';
import { JarvisPhase16TestSuite, Phase16TestResult } from '../../services/intelligence/jarvisPhase16Tests';
import { JarvisAppContext, NativeAccessibilityStatus } from '../../types/jarvisContext';

export const JarvisAppInteractionView: React.FC = () => {
  const [activeContext, setActiveContext] = useState<JarvisAppContext | null>(null);
  const [accessibilityStatus, setAccessibilityStatus] = useState<NativeAccessibilityStatus>(() =>
    AndroidAccessibilityBridge.getStatus()
  );
  const [testResults, setTestResults] = useState<Phase16TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [lastActionResult, setLastActionResult] = useState<string | null>(null);
  const [customCommand, setCustomCommand] = useState('');
  const [isSimulatorActive, setIsSimulatorActive] = useState(() => AndroidAccessibilityBridge.isSimulatorActive());
  const [activeSimApp, setActiveSimApp] = useState<'WhatsApp' | 'YouTube' | 'SystemUI'>('WhatsApp');
  const [recentSteps, setRecentSteps] = useState<AutomationStepEvent[]>([]);
  const [simState, setSimState] = useState(() => AndroidAccessibilityBridge.getSimulatedState());
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);

  // Subscribe to context updates and automation steps
  useEffect(() => {
    setActiveContext(JarvisDeviceContextManager.getActiveContext());
    const unsubscribeContext = JarvisDeviceContextManager.subscribe(() => {
      setActiveContext(JarvisDeviceContextManager.getActiveContext());
      setAccessibilityStatus(AndroidAccessibilityBridge.getStatus());
    });

    const unsubscribeSteps = AndroidAccessibilityBridge.onAutomationStep((step) => {
      setRecentSteps((prev) => [step, ...prev.slice(0, 7)]);
      if (step.targetApp === 'WhatsApp' || step.targetApp === 'YouTube') {
        setActiveSimApp(step.targetApp as any);
      }
      setSimState({ ...AndroidAccessibilityBridge.getSimulatedState() });
      if (step.phase === 'TYPING') {
        setIsTypingAnimation(true);
        setTimeout(() => setIsTypingAnimation(false), 900);
      }
    });

    return () => {
      unsubscribeContext();
      unsubscribeSteps();
    };
  }, []);

  const handleToggleSimulator = (enabled: boolean) => {
    AndroidAccessibilityBridge.setSimulatorActive(enabled);
    setIsSimulatorActive(enabled);
    setAccessibilityStatus(AndroidAccessibilityBridge.getStatus());
    setLastActionResult(
      enabled
        ? 'Deep Automation Simulator Enabled: JARVIS can now safely simulate in-app UI interactions.'
        : 'Deep Automation Simulator Disabled: Strictly enforces raw native bridge availability.'
    );
  };

  const handleRunCommand = async (cmd: string) => {
    setLastActionResult('Executing: ' + cmd);
    try {
      const res = await JarvisActionSelector.selectAndExecute(cmd);
      setLastActionResult(
        res?.userMessage || `Action status: ${res?.status} (Verification: ${res?.verificationStatus || 'N/A'})`
      );
      setSimState({ ...AndroidAccessibilityBridge.getSimulatedState() });
    } catch (err: any) {
      setLastActionResult(`Error: ${err.message}`);
    }
  };

  const handleRunTestSuite = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    try {
      const suite = await JarvisPhase16TestSuite.runAllTests();
      setTestResults(suite.results);
    } catch (e: any) {
      console.error('Test suite error:', e);
    } finally {
      setIsRunningTests(false);
    }
  };

  const passedTestsCount = testResults.filter((r) => r.passed).length;

  return (
    <div className="space-y-4 text-xs font-sans text-white/90">
      {/* 1. Header Card with Simulator Toggle */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black/60 border border-indigo-500/20 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                In-App Deep Automation Terminal
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REAL JARVIS LEVEL
                </span>
              </h3>
              <p className="text-[11px] text-white/50">Hands-free app execution via Android Accessibility Service</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer text-[11px] transition">
              <input
                type="checkbox"
                checked={isSimulatorActive}
                onChange={(e) => handleToggleSimulator(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-indigo-500"
              />
              <span className="text-white/80 font-medium">Simulator Mode</span>
            </label>
            <button
              onClick={() => {
                JarvisDeviceContextManager.clearContext('MANUAL_CLEAR');
                setRecentSteps([]);
                setLastActionResult('Device context and steps reset.');
              }}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Live App Screen & Automation Pipeline */}
      <div className="p-3.5 rounded-2xl bg-black/40 border border-indigo-500/30 space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white/90 text-sm">Live App UI & Visual Perception</span>
          </div>
          {/* App Switcher Tabs */}
          <div className="flex gap-1 p-0.5 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveSimApp('WhatsApp')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition ${
                activeSimApp === 'WhatsApp' ? 'bg-emerald-600 text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3 h-3" /> WhatsApp
            </button>
            <button
              onClick={() => setActiveSimApp('YouTube')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition ${
                activeSimApp === 'YouTube' ? 'bg-red-600 text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              <Youtube className="w-3 h-3" /> YouTube
            </button>
            <button
              onClick={() => setActiveSimApp('SystemUI')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition ${
                activeSimApp === 'SystemUI' ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              <Bell className="w-3 h-3" /> System UI
            </button>
          </div>
        </div>

        {/* The Screen Display */}
        <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-neutral-950 p-3 shadow-inner">
          {/* Status Bar */}
          <div className="flex justify-between items-center text-[10px] font-mono text-white/40 pb-2 border-b border-white/5">
            <span>09:41 AM</span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">ONEVA Accessibility: Active</span>
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>

          {/* Screen Content: WhatsApp Mode */}
          {activeSimApp === 'WhatsApp' && (
            <div className="pt-2 space-y-2">
              {/* WhatsApp Header */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600/40 border border-emerald-400/50 flex items-center justify-center font-bold text-emerald-200">
                    R
                  </div>
                  <div>
                    <div className="font-semibold text-white/90 text-[11px]">Rahul Sharma</div>
                    <div className="text-[9px] text-emerald-400">online • end-to-end encrypted</div>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  com.whatsapp
                </span>
              </div>

              {/* Chat Message Stream */}
              <div className="space-y-1.5 py-1 min-h-[90px] max-h-[120px] overflow-y-auto pr-1">
                {(simState.chatMessages || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-2.5 py-1.5 rounded-2xl text-[11px] leading-snug shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-emerald-700/80 text-white rounded-tr-none border border-emerald-500/30'
                          : 'bg-white/10 text-white/90 rounded-tl-none border border-white/10'
                      }`}
                    >
                      <div>{msg.text}</div>
                      <div className="text-[8px] text-white/50 text-right mt-0.5 flex items-center justify-end gap-1">
                        <span>{msg.time}</span>
                        {msg.sender === 'user' && <span className="text-cyan-300 font-bold">✓✓</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp Input Node Mockup */}
              <div className="flex items-center gap-1.5 pt-1">
                <div
                  id="com.whatsapp:id/entry"
                  className={`flex-1 px-3 py-1.5 rounded-xl bg-black/60 border text-[11px] flex items-center justify-between transition ${
                    isTypingAnimation
                      ? 'border-emerald-400 bg-emerald-950/20 ring-2 ring-emerald-500/30'
                      : 'border-white/10 text-white/40'
                  }`}
                >
                  <span className={isTypingAnimation ? 'text-emerald-300 animate-pulse' : 'text-white/40'}>
                    {isTypingAnimation ? 'JARVIS typing message...' : 'Type a message (com.whatsapp:id/entry)'}
                  </span>
                  <span className="text-[9px] font-mono text-white/30">ID: entry</span>
                </div>
                <button
                  id="com.whatsapp:id/send"
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
                  title="Send Button Node: com.whatsapp:id/send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Screen Content: YouTube Mode */}
          {activeSimApp === 'YouTube' && (
            <div className="pt-2 space-y-2">
              {/* YouTube Search Node Bar */}
              <div
                id="com.google.android.youtube:id/menu_item_search"
                className="flex items-center justify-between p-2 rounded-xl bg-black/50 border border-red-500/20 text-white/80"
              >
                <div className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[11px] font-medium text-white/90">
                    {simState.youtubeQuery || 'Search YouTube (id/menu_item_search)'}
                  </span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                  com.google.android.youtube
                </span>
              </div>

              {/* YouTube Active Video Player View */}
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-tr from-red-950/60 via-black to-neutral-900 border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-red-400 uppercase tracking-wide">
                      {simState.isPlaying ? '▶ NOW PLAYING' : 'READY TO PLAY'}
                    </span>
                    <h4 className="font-semibold text-white/95 text-xs truncate max-w-[200px]">
                      {simState.youtubeQuery || 'Interstellar - Main Theme (Live 4K)'}
                    </h4>
                    <p className="text-[10px] text-white/50">Hans Zimmer Official • 48M views</p>
                  </div>
                  <div className="p-2 rounded-full bg-red-600/30 text-red-300 border border-red-500/30">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </div>

                {/* Like Button Node */}
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                  <button
                    id="com.google.android.youtube:id/like_button"
                    onClick={() => handleRunCommand('Is video ko like karo')}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition ${
                      simState.isLiked
                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/40'
                        : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${simState.isLiked ? 'fill-current' : ''}`} />
                    <span>{simState.isLiked ? 'Liked' : 'Like'}</span>
                    <span className="text-[10px] opacity-70">({(simState.likeCount || 4120).toLocaleString()})</span>
                  </button>
                  <span className="text-[9px] font-mono text-white/40">Node: id/like_button</span>
                </div>
              </div>
            </div>
          )}

          {/* Screen Content: System UI Mode */}
          {activeSimApp === 'SystemUI' && (
            <div className="pt-2 space-y-2">
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                <div className="text-[10px] font-semibold text-indigo-300 mb-1.5 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Quick Settings Toggles
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="p-1.5 rounded-lg bg-indigo-600/30 border border-indigo-400/40 text-[10px] font-medium text-white">
                    Wi-Fi: ON
                  </div>
                  <div className="p-1.5 rounded-lg bg-indigo-600/30 border border-indigo-400/40 text-[10px] font-medium text-white">
                    Bluetooth
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/60">
                    Torch
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/60">
                    Auto-Rotate
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-black/40 border border-white/10 text-[11px] space-y-1">
                <div className="text-[10px] font-mono text-white/40 uppercase">Active Notifications</div>
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                  <span>ONEVA Assist: System listening for wake word</span>
                  <span className="text-[9px] text-cyan-400">JARVIS</span>
                </div>
              </div>
            </div>
          )}

          {/* Live Step Tracker Overlay */}
          {recentSteps.length > 0 && (
            <div className="mt-3 pt-2 border-t border-white/10">
              <div className="text-[10px] font-mono text-cyan-300 flex items-center gap-1 mb-1">
                <Activity className="w-3 h-3 animate-pulse" /> Automation Execution Trace:
              </div>
              <div className="space-y-1">
                {recentSteps.slice(0, 3).map((step) => (
                  <div
                    key={step.id}
                    className="p-1.5 rounded-lg bg-black/60 border border-white/10 text-[10px] flex items-center justify-between"
                  >
                    <span className="text-white/80 font-mono truncate mr-2">
                      <strong className="text-cyan-400">[{step.phase}]</strong> {step.detail}
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Deep Automation Quick Triggers */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-medium text-white/80 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            1-Click Deep Automation Triggers (Try Natural Language Commands)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleRunCommand('WhatsApp me Rahul ko message bhejo: "Main 5 min me aa raha hu"')}
            className="p-2 rounded-xl bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/20 text-left text-emerald-200 transition"
          >
            <div className="font-medium text-[11px] flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-emerald-400" /> WhatsApp Deep Automation
            </div>
            <div className="text-[9px] text-white/50 truncate">"WhatsApp me Rahul ko message bhejo..."</div>
          </button>

          <button
            onClick={() => handleRunCommand('YouTube par Interstellar OST search karke play karo')}
            className="p-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-left text-red-200 transition"
          >
            <div className="font-medium text-[11px] flex items-center gap-1">
              <Youtube className="w-3 h-3 text-red-400" /> YouTube Search & Play
            </div>
            <div className="text-[9px] text-white/50 truncate">"YouTube par Interstellar OST play karo"</div>
          </button>

          <button
            onClick={() => handleRunCommand('Is video ko like kar do')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-white/80 hover:text-white transition"
          >
            <div className="font-medium text-[11px] flex items-center gap-1">
              <ThumbsUp className="w-3 h-3 text-cyan-400" /> In-App Like Control
            </div>
            <div className="text-[9px] text-white/40 truncate">"Is video ko like kar do"</div>
          </button>

          <button
            onClick={() => handleRunCommand('Neeche scroll karo')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-white/80 hover:text-white transition"
          >
            <div className="font-medium text-[11px] flex items-center gap-1">
              <Sliders className="w-3 h-3 text-amber-400" /> Gesture Scroll
            </div>
            <div className="text-[9px] text-white/40 truncate">"Neeche scroll karo"</div>
          </button>

          <button
            onClick={() => handleRunCommand('Notification panel kholo')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-white/80 hover:text-white transition"
          >
            <div className="font-medium text-[11px] flex items-center gap-1">
              <Bell className="w-3 h-3 text-indigo-400" /> Global System Actions
            </div>
            <div className="text-[9px] text-white/40 truncate">"Notification panel kholo"</div>
          </button>

          <button
            onClick={() => handleRunCommand('Jarvis type bank password')}
            className="p-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-left text-red-300 transition"
          >
            <div className="font-medium text-[11px] flex items-center gap-1">
              <Lock className="w-3 h-3 text-red-400" /> Rule 6 Privacy Gate
            </div>
            <div className="text-[9px] text-red-400/60 truncate">"Type bank password" (Blocked)</div>
          </button>
        </div>

        {/* Custom Input Runner */}
        <div className="flex gap-1.5 pt-1">
          <input
            type="text"
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customCommand.trim()) {
                handleRunCommand(customCommand);
                setCustomCommand('');
              }
            }}
            placeholder="Command (e.g. WhatsApp me Ashish ko bolo kal milte hain)..."
            className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
          />
          <button
            onClick={() => {
              if (customCommand.trim()) {
                handleRunCommand(customCommand);
                setCustomCommand('');
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] flex items-center gap-1 transition"
          >
            <Play className="w-3 h-3" /> Run
          </button>
        </div>

        {lastActionResult && (
          <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[11px] text-cyan-300 font-mono break-words">
            {lastActionResult}
          </div>
        )}
      </div>

      {/* 4. Native Accessibility Service Status & Settings */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-white/80 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Android Native Accessibility Service Configuration
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                accessibilityStatus.serviceEnabled
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              {accessibilityStatus.serviceEnabled ? 'ACTIVE / SIMULATED' : 'DEVICE SERVICE REQUIRED'}
            </span>
            <button
              onClick={() => AndroidAccessibilityBridge.openAccessibilitySettings()}
              className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/70 flex items-center gap-1 transition"
            >
              <Settings className="w-3 h-3" /> Android Settings
            </button>
          </div>
        </div>
        <p className="text-[11px] text-white/60 leading-relaxed bg-black/20 p-2 rounded-xl border border-white/5">
          {accessibilityStatus.statusMessage}
        </p>
        <div className="flex flex-wrap gap-1 pt-1">
          {accessibilityStatus.supportedCapabilities.map((cap) => (
            <span
              key={cap}
              className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-mono text-white/70"
            >
              {cap}
            </span>
          ))}
        </div>
      </div>

      {/* 5. Phase 16 Verification Test Runner */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-white/90 text-sm flex items-center gap-1.5">
              Phase 16 Verification Suite
              {testResults.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    passedTestsCount === 15
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {passedTestsCount}/15 Passed
                </span>
              )}
            </h4>
            <p className="text-[10px] text-white/40">15 automated verification scenarios covering Phase 16</p>
          </div>
          <button
            onClick={handleRunTestSuite}
            disabled={isRunningTests}
            className={`px-3 py-1.5 rounded-xl font-medium text-[11px] flex items-center gap-1.5 transition ${
              isRunningTests
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
            }`}
          >
            <Play className="w-3 h-3" />
            {isRunningTests ? 'Testing...' : 'Run All 15 Tests'}
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {testResults.map((t) => (
              <div
                key={t.id}
                className={`p-2 rounded-xl border text-[11px] flex items-start gap-2 ${
                  t.passed
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200'
                    : 'bg-red-950/20 border-red-500/20 text-red-200'
                }`}
              >
                <div className="mt-0.5">
                  {t.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white/90 flex items-center justify-between">
                    <span>
                      #{t.id}: {t.name}
                    </span>
                    <span className="text-[9px] font-mono text-white/40 uppercase">{t.category}</span>
                  </div>
                  <div className="text-[10px] text-white/50 mt-0.5">Expected: {t.expected}</div>
                  <div className="text-[10px] text-white/80 font-mono mt-0.5 truncate">Actual: {t.actual}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
