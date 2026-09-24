/**
 * ONEVA JARVIS Device Controls & Telemetry Depth View
 * 
 * High-fidelity holographic Stark HUD for real-time hardware telemetry,
 * thermal matrices, acoustic routing, RF radios, and 6-DOF sensor fusion.
 */

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Battery,
  BatteryCharging,
  Cpu,
  Wifi,
  WifiOff,
  Bluetooth,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Compass,
  Gauge,
  Activity,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Radio,
  Sliders,
  Waves,
  Eye,
  Power,
  HardDrive,
  CheckCircle2,
  Check,
  RotateCcw,
  Sparkles,
  Plane,
  Cast,
} from 'lucide-react';
import {
  DeviceHardwareState,
  PowerMode,
  SoundMode,
  SystemDiagnosticReport,
} from '../../types/jarvisDeviceTelemetry';
import { JarvisDeviceControlService } from '../../services/device/jarvisDeviceControlService';
import { AudioEffects } from '../../services/voice/audioSoundEffects';
import { JarvisTtsEngine } from '../../services/voice/jarvisTtsEngine';

export const JarvisDeviceTelemetryView: React.FC = () => {
  const [telemetry, setTelemetry] = useState<DeviceHardwareState>(() => JarvisDeviceControlService.getState());
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [diagnosticReport, setDiagnosticReport] = useState<SystemDiagnosticReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'power' | 'optics' | 'rf' | 'sensors'>('overview');

  useEffect(() => {
    JarvisDeviceControlService.initialize();
    const unsub = JarvisDeviceControlService.subscribe((updated) => {
      setTelemetry(updated);
    });
    return () => unsub();
  }, []);

  const handleRunDiagnostics = async () => {
    setIsScanning(true);
    setScanStep(0);
    setShowReportModal(true);

    // Progressive Stark diagnostic scan steps with acoustic chirps
    for (let i = 0; i < 6; i++) {
      setScanStep(i + 1);
      AudioEffects.playDiagnosticBeep(i);
      AudioEffects.triggerHapticPulse([30, 20]);
      await new Promise((r) => setTimeout(r, 450));
    }

    const report = await JarvisDeviceControlService.runFullSystemDiagnostics();
    setDiagnosticReport(report);
    setIsScanning(false);
    AudioEffects.playConfirmChime();

    // JARVIS vocal readout
    JarvisTtsEngine.speak({
      id: `diag_${Date.now()}`,
      text: report.jarvisReadout,
      spokenText: report.jarvisReadout,
      language: 'en-US',
    });
  };

  const powerModes: { id: PowerMode; label: string; desc: string }[] = [
    { id: 'performance', label: 'PERF 120Hz', desc: 'Maximum silicon clock, 120Hz LTPO' },
    { id: 'balanced', label: 'BALANCED', desc: 'Adaptive schedutil, thermal stability' },
    { id: 'stark_saver', label: 'STARK SAVER', desc: 'OLED pure black, 60Hz, minimal background RF' },
    { id: 'ultra_doze', label: 'ULTRA DOZE', desc: 'Deep silicon sleep, emergency reserve' },
  ];

  const soundModes: { id: SoundMode; label: string }[] = [
    { id: 'normal', label: 'Normal' },
    { id: 'vibrate', label: 'Vibrate' },
    { id: 'silent', label: 'Silent DND' },
  ];

  return (
    <div id="jarvis-device-telemetry-view" className="w-full space-y-6 text-cyan-100 font-mono">
      {/* Top HUD Header & Diagnostic Trigger */}
      <div id="telemetry-top-header" className="relative p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-cyan-500/30 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">
                ONEVA MARK VII • HARDWARE TELEMETRY CORE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-cyan-400" />
              Device Controls & Telemetry Depth
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Real-time hardware sensors, silicon thermal dissipation, RF transceivers, and acoustic stream modulation with zero cloud leakage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-run-full-diagnostics"
              onClick={handleRunDiagnostics}
              disabled={isScanning}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 border shadow-lg ${
                isScanning
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 animate-pulse'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/25 border-cyan-400/40 hover:border-cyan-300 text-cyan-200 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              }`}
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning Subsystems...' : 'Run 360° Diagnostics'}
            </button>
          </div>
        </div>

        {/* Quick Nav Filter Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-cyan-500/20 pt-4 overflow-x-auto no-scrollbar">
          {(['overview', 'power', 'optics', 'rf', 'sensors'] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-telemetry-${tab}`}
              onClick={() => {
                setActiveTab(tab);
                AudioEffects.playHardwareToggle(true);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wider uppercase transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-cyan-300/80 border border-cyan-500/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ========================================================= */}
        {/* CARD 1: ARC REACTOR POWER CORE MATRIX                    */}
        {/* ========================================================= */}
        {(activeTab === 'overview' || activeTab === 'power') && (
          <div id="telemetry-card-power" className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                    <Zap className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Arc Power Matrix</h3>
                    <p className="text-[11px] text-slate-400">Chemical cell & wattage</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-semibold">
                  {telemetry.power.isCharging ? 'CHARGING' : 'DISCHARGING'}
                </span>
              </div>

              {/* Arc Reactor Central Graphic Gauge */}
              <div className="my-5 flex flex-col items-center justify-center relative">
                <div className="w-36 h-36 relative flex items-center justify-center">
                  {/* Outer Pulsing Ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/40 animate-[spin_20s_linear_infinite]" />
                  <div className="absolute inset-2 rounded-full border border-cyan-400/30" />
                  
                  {/* Glowing Core */}
                  <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-400/50 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                    {telemetry.power.isCharging ? (
                      <BatteryCharging className="w-6 h-6 text-cyan-400 animate-bounce mb-1" />
                    ) : (
                      <Battery className="w-6 h-6 text-cyan-400 mb-1" />
                    )}
                    <span className="text-2xl font-black tracking-tighter text-white">
                      {telemetry.power.batteryLevel}%
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-cyan-300">
                      {telemetry.power.powerMode.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-center mt-3">
                  <p className="text-xs text-slate-300">
                    Est. Runtime:{' '}
                    <span className="font-bold text-cyan-300">
                      {Math.floor(telemetry.power.estimatedTimeRemainingMinutes / 60)}h{' '}
                      {telemetry.power.estimatedTimeRemainingMinutes % 60}m
                    </span>
                  </p>
                  {telemetry.power.isCharging && (
                    <p className="text-[11px] text-emerald-400 font-medium">
                      Fast Charging Rate: {telemetry.power.wattage} W (PD Protocol)
                    </p>
                  )}
                </div>
              </div>

              {/* Metrics Readout */}
              <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-cyan-500/20 my-3">
                <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Cell Health</span>
                  <span className="font-bold text-white text-sm">{telemetry.power.batteryHealthPercent}%</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Cycle Count</span>
                  <span className="font-bold text-white text-sm">{telemetry.power.batteryCycleCount} cycles</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Cell Temp</span>
                  <span className="font-bold text-white text-sm">{telemetry.power.batteryTempCelsius}°C</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Charging Type</span>
                  <span className="font-bold text-cyan-300 text-sm uppercase">
                    {telemetry.power.chargingType.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Power Mode Selector */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                Calibrate Power Profile
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {powerModes.map((mode) => (
                  <button
                    key={mode.id}
                    id={`btn-power-mode-${mode.id}`}
                    onClick={() => JarvisDeviceControlService.setPowerMode(mode.id)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      telemetry.power.powerMode === mode.id
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-950/40 hover:bg-slate-950/80 border-cyan-500/20 text-cyan-200'
                    }`}
                  >
                    <div className="text-[11px] font-bold tracking-wider">{mode.label}</div>
                    <div className={`text-[9px] line-clamp-1 ${telemetry.power.powerMode === mode.id ? 'text-slate-800' : 'text-slate-400'}`}>
                      {mode.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARD 2: OPTICS, FLASHLIGHT & LUMINESCENCE                */}
        {/* ========================================================= */}
        {(activeTab === 'overview' || activeTab === 'optics') && (
          <div id="telemetry-card-optics" className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                    <Sun className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Optics & Display Deck</h3>
                    <p className="text-[11px] text-slate-400">Torch beam & panel luminance</p>
                  </div>
                </div>
              </div>

              {/* Flashlight Pod */}
              <div className={`p-4 rounded-xl border transition-all mb-4 ${
                telemetry.flashlight.enabled
                  ? 'bg-amber-500/15 border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-950/50 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                      <Sun className={`w-4 h-4 ${telemetry.flashlight.enabled ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                      LED Optical Torch
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {telemetry.flashlight.enabled
                        ? telemetry.flashlight.isSosStrobe
                          ? 'Emergency SOS Strobe Active'
                          : `Active at ${telemetry.flashlight.level}% Luminous Flux`
                        : 'Hardware LED Standby'}
                    </span>
                  </div>

                  <button
                    id="btn-toggle-flashlight"
                    onClick={() => JarvisDeviceControlService.setFlashlight()}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                      telemetry.flashlight.enabled
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_#fbbf24]'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                  >
                    {telemetry.flashlight.enabled ? 'Active' : 'Off'}
                  </button>
                </div>

                {/* Intensity selector buttons & SOS Switch */}
                {telemetry.flashlight.enabled && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {[25, 50, 75, 100].map((lvl) => (
                        <button
                          key={lvl}
                          id={`btn-torch-level-${lvl}`}
                          onClick={() => JarvisDeviceControlService.setFlashlight(true, lvl, false)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                            telemetry.flashlight.level === lvl && !telemetry.flashlight.isSosStrobe
                              ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                              : 'bg-slate-900/80 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                        >
                          {lvl}%
                        </button>
                      ))}
                    </div>

                    <button
                      id="btn-torch-sos"
                      onClick={() => JarvisDeviceControlService.setFlashlight(true, 100, !telemetry.flashlight.isSosStrobe)}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${
                        telemetry.flashlight.isSosStrobe
                          ? 'bg-red-500 text-white border-red-400 animate-pulse'
                          : 'bg-slate-900 text-red-400 border-red-500/40 hover:bg-red-500/20'
                      }`}
                    >
                      SOS Strobe
                    </button>
                  </div>
                )}
              </div>

              {/* Display Brightness Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-cyan-400" />
                    Panel Luminance
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300">{telemetry.display.brightness}%</span>
                    <button
                      id="btn-toggle-auto-brightness"
                      onClick={() => JarvisDeviceControlService.setBrightness(telemetry.display.brightness, !telemetry.display.autoBrightness)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all ${
                        telemetry.display.autoBrightness
                          ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      Auto-Lux {telemetry.display.autoBrightness ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <input
                  id="slider-display-brightness"
                  type="range"
                  min="0"
                  max="100"
                  value={telemetry.display.brightness}
                  onChange={(e) => JarvisDeviceControlService.setBrightness(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-950 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Refresh Rate LTPO Selector */}
              <div className="mt-4 pt-4 border-t border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white uppercase">LTPO Dynamic Refresh</span>
                  <span className="text-xs font-bold text-cyan-400">{telemetry.display.refreshRate} Hz</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([60, 90, 120] as const).map((hz) => (
                    <button
                      key={hz}
                      id={`btn-refresh-rate-${hz}`}
                      onClick={() => JarvisDeviceControlService.setRefreshRate(hz)}
                      className={`py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all border ${
                        telemetry.display.refreshRate === hz
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-950/60 hover:bg-slate-900 text-cyan-300 border-cyan-500/20'
                      }`}
                    >
                      {hz} Hz
                    </button>
                  ))}
                </div>
              </div>

              {/* Blue Light Eye Comfort Shield */}
              <div className="mt-4 pt-4 border-t border-cyan-500/20">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    Eye Comfort Shield
                  </span>
                  <span className="text-xs font-bold text-amber-300">{telemetry.display.blueLightFilterKelvin}K</span>
                </div>
                <input
                  id="slider-blue-light"
                  type="range"
                  min="3000"
                  max="6500"
                  step="100"
                  value={telemetry.display.blueLightFilterKelvin}
                  onChange={(e) => JarvisDeviceControlService.setBlueLightFilter(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-950 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                  <span>3000K (Warm Amber)</span>
                  <span>6500K (Daylight Cool)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARD 3: ACOUSTIC MODULATION & ROUTING                     */}
        {/* ========================================================= */}
        {(activeTab === 'overview' || activeTab === 'power') && (
          <div id="telemetry-card-audio" className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                    <Volume2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Acoustic Engine</h3>
                    <p className="text-[11px] text-slate-400">Streams & audio routing</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 font-semibold uppercase">
                  {telemetry.audio.soundMode}
                </span>
              </div>

              {/* Master Volume Slider */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                    {telemetry.audio.isMuted || telemetry.audio.masterVolume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                    )}
                    Master Volume
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300">{telemetry.audio.masterVolume}%</span>
                    <button
                      id="btn-toggle-mute"
                      onClick={() => JarvisDeviceControlService.setVolume('master', telemetry.audio.isMuted ? 75 : 0)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all ${
                        telemetry.audio.isMuted
                          ? 'bg-red-500/30 text-red-200 border-red-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {telemetry.audio.isMuted ? 'MUTED' : 'MUTE'}
                    </button>
                  </div>
                </div>

                <input
                  id="slider-master-volume"
                  type="range"
                  min="0"
                  max="100"
                  value={telemetry.audio.masterVolume}
                  onChange={(e) => JarvisDeviceControlService.setVolume('master', Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-950 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Sound Mode Tabs */}
              <div className="space-y-1.5 mb-4">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Audio Alert Profile
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {soundModes.map((sm) => (
                    <button
                      key={sm.id}
                      id={`btn-sound-mode-${sm.id}`}
                      onClick={() => JarvisDeviceControlService.setSoundMode(sm.id)}
                      className={`py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all border ${
                        telemetry.audio.soundMode === sm.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-950/60 hover:bg-slate-900 text-cyan-300 border-cyan-500/20'
                      }`}
                    >
                      {sm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Volume Sliders */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Media Stream</span>
                    <span className="font-bold text-white">{telemetry.audio.mediaVolume}%</span>
                  </div>
                  <input
                    id="slider-media-volume"
                    type="range"
                    min="0"
                    max="100"
                    value={telemetry.audio.mediaVolume}
                    onChange={(e) => JarvisDeviceControlService.setVolume('media', Number(e.target.value))}
                    className="w-full accent-indigo-400 bg-slate-900 h-1.5 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Alarm Stream</span>
                    <span className="font-bold text-white">{telemetry.audio.alarmVolume}%</span>
                  </div>
                  <input
                    id="slider-alarm-volume"
                    type="range"
                    min="0"
                    max="100"
                    value={telemetry.audio.alarmVolume}
                    onChange={(e) => JarvisDeviceControlService.setVolume('alarm', Number(e.target.value))}
                    className="w-full accent-amber-400 bg-slate-900 h-1.5 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Active Audio Route Badge */}
              <div className="mt-4 pt-3 border-t border-cyan-500/20 flex items-center justify-between text-xs">
                <span className="text-slate-400">Active Audio Route:</span>
                <span className="font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  {telemetry.audio.audioRoute.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARD 4: RF TRANSCEIVERS & CONNECTIVITY                    */}
        {/* ========================================================= */}
        {(activeTab === 'overview' || activeTab === 'rf') && (
          <div id="telemetry-card-rf" className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                    <Radio className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">RF Transceivers</h3>
                    <p className="text-[11px] text-slate-400">Wi-Fi, 5G SA, Bluetooth</p>
                  </div>
                </div>
              </div>

              {/* Wi-Fi Transceiver Pod */}
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className={`w-4 h-4 ${telemetry.connectivity.wifiEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <span className="text-xs font-bold text-white">
                        {telemetry.connectivity.wifiEnabled ? telemetry.connectivity.wifiSsid : 'Wi-Fi Offline'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {telemetry.connectivity.wifiEnabled
                          ? `${telemetry.connectivity.wifiFrequencyBand} • RSSI ${telemetry.connectivity.wifiSignalRssi} dBm`
                          : 'Radio Powered Off'}
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn-toggle-wifi"
                    onClick={() => JarvisDeviceControlService.toggleWifi()}
                    className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider transition-all border ${
                      telemetry.connectivity.wifiEnabled
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_8px_#34d399]'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {telemetry.connectivity.wifiEnabled ? 'Active' : 'Off'}
                  </button>
                </div>

                {telemetry.connectivity.wifiEnabled && (
                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400">Link Speed: <b className="text-cyan-300">{telemetry.connectivity.wifiSpeedMbps} Mbps</b></span>
                    <span className="text-slate-400">IP: <b className="text-slate-300">{telemetry.connectivity.ipAddress}</b></span>
                  </div>
                )}
              </div>

              {/* Bluetooth Transceiver Pod */}
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bluetooth className={`w-4 h-4 ${telemetry.connectivity.bluetoothEnabled ? 'text-blue-400' : 'text-slate-500'}`} />
                    <div>
                      <span className="text-xs font-bold text-white">Bluetooth 5.3 Core</span>
                      <span className="text-[10px] text-slate-400 block">
                        {telemetry.connectivity.bluetoothEnabled
                          ? `${telemetry.connectivity.connectedDevices.length} Stark Peripherals Paired`
                          : 'Transceiver Standby'}
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn-toggle-bluetooth"
                    onClick={() => JarvisDeviceControlService.toggleBluetooth()}
                    className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider transition-all border ${
                      telemetry.connectivity.bluetoothEnabled
                        ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-[0_0_8px_#60a5fa]'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {telemetry.connectivity.bluetoothEnabled ? 'Active' : 'Off'}
                  </button>
                </div>

                {telemetry.connectivity.bluetoothEnabled && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    {telemetry.connectivity.connectedDevices.map((dev) => (
                      <div key={dev.id} className="flex items-center justify-between text-[10px] text-slate-300 bg-slate-900/60 px-2 py-1 rounded">
                        <span>{dev.name}</span>
                        {dev.batteryPercent && (
                          <span className="font-bold text-cyan-300">{dev.batteryPercent}%</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cellular 5G SA & Hotspot */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  id="btn-toggle-mobile-data"
                  onClick={() => JarvisDeviceControlService.toggleMobileData()}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    telemetry.connectivity.mobileDataEnabled
                      ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 block uppercase">5G Cellular Data</span>
                  <span className="font-bold text-xs">
                    {telemetry.connectivity.mobileDataEnabled ? `${telemetry.connectivity.networkType}` : 'Offline'}
                  </span>
                  <span className="text-[9px] text-cyan-400 block mt-0.5">
                    {telemetry.connectivity.downlinkMbps} Mbps Down
                  </span>
                </button>

                <button
                  id="btn-toggle-hotspot"
                  onClick={() => JarvisDeviceControlService.toggleHotspot()}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    telemetry.connectivity.hotspotEnabled
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 block uppercase">Stark Hotspot AP</span>
                  <span className="font-bold text-xs">
                    {telemetry.connectivity.hotspotEnabled ? 'Broadcasting' : 'Disabled'}
                  </span>
                  <span className="text-[9px] text-amber-300 block mt-0.5">
                    {telemetry.connectivity.hotspotConnectedClients} Clients Linked
                  </span>
                </button>
              </div>

              {/* Quick RF Buttons: Airplane Mode & Auto-Rotate */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-cyan-500/20">
                <button
                  id="btn-toggle-airplane-mode"
                  onClick={() => JarvisDeviceControlService.toggleAirplaneMode()}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    telemetry.connectivity.airplaneMode
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                      : 'bg-slate-950/40 hover:bg-slate-900 border-cyan-500/20 text-slate-300'
                  }`}
                >
                  <Plane className="w-3.5 h-3.5" />
                  Airplane Mode
                </button>

                <button
                  id="btn-toggle-auto-rotate"
                  onClick={() => JarvisDeviceControlService.toggleAutoRotate()}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    telemetry.connectivity.autoRotate
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                      : 'bg-slate-950/40 hover:bg-slate-900 border-cyan-500/20 text-slate-300'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Auto-Rotate Lock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARD 5: 6-DOF INERTIAL SENSOR ARRAY                       */}
        {/* ========================================================= */}
        {(activeTab === 'overview' || activeTab === 'sensors') && (
          <div id="telemetry-card-sensors" className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                    <Compass className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">6-DOF Sensor Array</h3>
                    <p className="text-[11px] text-slate-400">Attitude horizon, heading & pressure</p>
                  </div>
                </div>
              </div>

              {/* Artificial Horizon Pitch & Roll Visualization */}
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/20 flex items-center justify-around mb-3">
                {/* 3D Attitude Pitch Ladder */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full border-2 border-cyan-500/40 relative overflow-hidden flex items-center justify-center bg-slate-900 shadow-[inset_0_0_15px_rgba(6,182,212,0.2)]">
                    {/* Horizon line reacting to roll */}
                    <div
                      className="absolute w-24 h-0.5 bg-emerald-400 shadow-[0_0_6px_#34d399]"
                      style={{
                        transform: `rotate(${telemetry.sensors.orientation.roll}deg) translateY(${telemetry.sensors.orientation.pitch}px)`,
                        transition: 'transform 0.2s ease-out',
                      }}
                    />
                    {/* Center crosshair */}
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 z-10" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Horizon Tilt</span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    P: {telemetry.sensors.orientation.pitch}° R: {telemetry.sensors.orientation.roll}°
                  </span>
                </div>

                {/* Compass Heading Gauge */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full border-2 border-cyan-500/40 relative flex items-center justify-center bg-slate-900 shadow-[inset_0_0_15px_rgba(6,182,212,0.2)]">
                    <div
                      className="absolute w-1 h-14 bg-gradient-to-t from-transparent via-red-500 to-red-400 rounded"
                      style={{
                        transform: `rotate(${telemetry.sensors.compassHeading}deg)`,
                        transition: 'transform 0.2s ease-out',
                      }}
                    />
                    <span className="text-[10px] font-black text-cyan-200 z-10">
                      {telemetry.sensors.compassDirection}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Compass</span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {telemetry.sensors.compassHeading}° {telemetry.sensors.compassDirection}
                  </span>
                </div>
              </div>

              {/* Environmental Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Ambient Lux</span>
                  <span className="font-bold text-white text-sm">{telemetry.sensors.ambientLightLux} lx</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Barometer</span>
                  <span className="font-bold text-white text-sm">{Math.round(telemetry.sensors.barometerPressureHpa)} hPa</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">G-Force</span>
                  <span className="font-bold text-cyan-300 text-sm">{telemetry.sensors.acceleration.totalG} G</span>
                </div>
              </div>

              {/* Altitude & Haptic Calibration */}
              <div className="mt-3 pt-3 border-t border-cyan-500/20 flex items-center justify-between text-xs text-slate-300">
                <span>Calculated Elevation:</span>
                <span className="font-bold text-white">{telemetry.sensors.altitudeMeters} m ASL</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARD 6: SILICON, THERMAL & COMPUTATIONAL CLUSTER          */}
        {/* ========================================================= */}
        {(activeTab === 'overview' || activeTab === 'power' || activeTab === 'sensors') && (
          <div id="telemetry-card-silicon" className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Silicon & Thermals</h3>
                    <p className="text-[11px] text-slate-400">Octa-core cluster & heat dissipation</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                  telemetry.compute.thermalState === 'throttling'
                    ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
                    : telemetry.compute.thermalState === 'warm'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                }`}>
                  {telemetry.compute.thermalState}
                </span>
              </div>

              {/* CPU Load Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold uppercase flex items-center gap-1.5">
                    CPU Load ({telemetry.compute.cpuGovernor})
                  </span>
                  <span className="font-bold text-cyan-300 text-sm">{telemetry.compute.cpuUsagePercent}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${telemetry.compute.cpuUsagePercent}%` }}
                  />
                </div>
              </div>

              {/* Thermal Matrix Gauges */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">SoC Temp</span>
                  <span className="font-bold text-white text-sm">{telemetry.compute.cpuTempCelsius}°C</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">GPU Temp</span>
                  <span className="font-bold text-white text-sm">{telemetry.compute.gpuTempCelsius}°C</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Vapor Dissipation</span>
                  <span className="font-bold text-emerald-400 text-sm">Nominal</span>
                </div>
              </div>

              {/* Memory & Storage */}
              <div className="space-y-2 text-xs pt-3 border-t border-cyan-500/20">
                <div className="flex justify-between">
                  <span className="text-slate-400">LPDDR5 RAM:</span>
                  <span className="font-bold text-white">
                    {telemetry.compute.ramUsedGb} GB / {telemetry.compute.ramTotalGb} GB (zRAM: {telemetry.compute.zRamCompressedGb} GB)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">UFS 3.1 Storage:</span>
                  <span className="font-bold text-white">
                    {telemetry.compute.storageUsedGb} GB / {telemetry.compute.storageTotalGb} GB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bus I/O Rate:</span>
                  <span className="font-bold text-cyan-300">{telemetry.compute.ufsReadSpeedMBs} MB/s</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: 360° SYSTEM DIAGNOSTICS REPORT                    */}
      {/* ========================================================= */}
      {showReportModal && (
        <div id="modal-diagnostics-report" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-slate-900 border border-cyan-400/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-cyan-100 font-mono relative">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-cyan-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">JARVIS 360° Diagnostic Sweep</h3>
                  <p className="text-xs text-cyan-300/80">Hardware Verification & Telemetry Audit</p>
                </div>
              </div>

              {!isScanning && (
                <button
                  id="btn-close-diagnostic-modal"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Close
                </button>
              )}
            </div>

            {/* Scan Progress or Final Report */}
            {isScanning ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-white tracking-wider uppercase block">
                    Scanning Subsystem {scanStep} of 6
                  </span>
                  <span className="text-xs text-cyan-400 mt-1 block">
                    {scanStep === 1 && 'Auditing Power Management & Cell Impedance...'}
                    {scanStep === 2 && 'Calibrating Octa-Core Silicon & Thermal Limits...'}
                    {scanStep === 3 && 'Probing RF Radios, Wi-Fi 6E & 5G SA Basebands...'}
                    {scanStep === 4 && 'Measuring Vapor Chamber Heat Dissipation...'}
                    {scanStep === 5 && 'Interrogating 6-DOF Inertial & Ambient Sensors...'}
                    {scanStep === 6 && 'Verifying Rule 6 Cryptographic Privacy Boundaries...'}
                  </span>
                </div>
              </div>
            ) : diagnosticReport ? (
              <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Score Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-slate-950 border border-cyan-400/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Diagnostic Integrity Score</span>
                    <span className="text-2xl font-black text-white">{diagnosticReport.diagnosticScore} / 100</span>
                    <span className="text-xs text-emerald-400 block mt-0.5 font-bold">
                      {diagnosticReport.overallStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Fingerprint</span>
                    <span className="text-xs font-mono text-cyan-300">{diagnosticReport.deviceFingerprint}</span>
                  </div>
                </div>

                {/* Vocal Readout Bubble */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/30 text-xs text-slate-200 leading-relaxed flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-cyan-300 block mb-0.5">JARVIS Voice Readout:</span>
                    "{diagnosticReport.jarvisReadout}"
                  </div>
                </div>

                {/* Subsystem Audit List */}
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                    Subsystem Telemetry Logs
                  </span>
                  {diagnosticReport.subsystems.map((sub) => (
                    <div key={sub.id} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {sub.name}
                        </span>
                        <span className="font-mono text-cyan-300 font-bold text-[11px]">{sub.metric}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal pl-5">{sub.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Modal Actions */}
            {!isScanning && (
              <div className="mt-4 pt-4 border-t border-cyan-500/20 flex justify-end gap-2">
                <button
                  id="btn-re-run-diagnostics"
                  onClick={handleRunDiagnostics}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                >
                  Re-Execute Sweep
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
