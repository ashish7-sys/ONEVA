/**
 * ONEVA Phase 24: Real-JARVIS Multi-Device Mesh Relay Control Card
 * 
 * Decentralized peer node dashboard displaying connected devices,
 * latency, signal metrics, and audio handoff switching.
 */

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Radio,
  Smartphone,
  Watch,
  Monitor,
  Car,
  Volume2,
  CheckCircle2,
  ArrowRightLeft,
  Wifi,
  ShieldCheck,
} from 'lucide-react';
import { JarvisMeshRelayService } from '../../services/mesh/jarvisMeshRelayService';
import { JarvisMeshNode, MeshNodeType } from '../../types/jarvisMeshRelay';

interface JarvisMeshRelayCardProps {
  onToast?: (msg: string) => void;
}

export const JarvisMeshRelayCard: React.FC<JarvisMeshRelayCardProps> = ({ onToast }) => {
  const [nodes, setNodes] = useState<JarvisMeshNode[]>(() =>
    JarvisMeshRelayService.getNodes()
  );
  const [activeSpeaker, setActiveSpeaker] = useState<JarvisMeshNode>(() =>
    JarvisMeshRelayService.getActiveSpeakerNode()
  );
  const [isTransferring, setIsTransferring] = useState<string | null>(null);

  useEffect(() => {
    JarvisMeshRelayService.init();
    const unsub = JarvisMeshRelayService.subscribe(() => {
      setNodes(JarvisMeshRelayService.getNodes());
      setActiveSpeaker(JarvisMeshRelayService.getActiveSpeakerNode());
    });
    return unsub;
  }, []);

  const handleHandoff = async (node: JarvisMeshNode) => {
    if (node.isCurrentActiveSpeaker) return;
    setIsTransferring(node.nodeId);
    onToast?.(`Routing audio and focus to ${node.name}...`);

    try {
      const res = await JarvisMeshRelayService.handoffAudio(node.nodeId);
      if (res.success) {
        onToast?.(`✅ Audio routed to ${node.name}`);
      }
    } finally {
      setIsTransferring(null);
    }
  };

  const getNodeIcon = (type: MeshNodeType) => {
    switch (type) {
      case 'PRIMARY_PHONE_CORE':
        return <Smartphone className="w-5 h-5 text-cyan-400" />;
      case 'SMART_WATCH_NODE':
        return <Watch className="w-5 h-5 text-emerald-400" />;
      case 'DESKTOP_OR_LAB_DISPLAY':
        return <Monitor className="w-5 h-5 text-indigo-400" />;
      case 'CAR_INFOTAINMENT_NODE':
        return <Car className="w-5 h-5 text-amber-400" />;
      case 'SMART_SPEAKER_SATELLITE':
        return <Volume2 className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/70 border border-sky-500/20 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-950">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Stark Ubiquitous Mesh Relay
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                REAL-JARVIS TIER
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Decentralized peer node discovery & seamless cross-device acoustic handoff.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>P2P LOCAL ENCRYPTED</span>
          </div>
        </div>
      </div>

      {/* Active Speaker Broadcast Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-neutral-950/80 to-neutral-950/80 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 animate-pulse">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-sky-400 font-mono uppercase tracking-wider">
              Active Audio Transducer Node
            </div>
            <div className="text-sm font-bold text-white font-mono">
              {activeSpeaker.name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
          <span>Latency: <strong className="text-sky-300">{activeSpeaker.latencyMs}ms</strong></span>
          <span>Signal: <strong className="text-emerald-400">{activeSpeaker.signalStrengthDbm} dBm</strong></span>
        </div>
      </div>

      {/* Connected Mesh Nodes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>SYNCHRONIZED PERIPHERAL NODES ({nodes.length})</span>
          <span>SUB-15MS LOCAL P2P BUS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {nodes.map((node) => {
            const isActive = node.isCurrentActiveSpeaker;

            return (
              <div
                key={node.nodeId}
                className={`p-4 rounded-2xl border transition space-y-3 ${
                  isActive
                    ? 'bg-sky-950/20 border-sky-500/40 shadow-md shadow-sky-950/50'
                    : 'bg-neutral-950/60 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center">
                      {getNodeIcon(node.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{node.name}</span>
                        {node.isLocalHost && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/10 text-neutral-300">
                            HOST
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            node.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        <span>{node.status}</span>
                        <span>•</span>
                        <span>{node.latencyMs}ms</span>
                        {node.batteryPercent && (
                          <>
                            <span>•</span>
                            <span>{node.batteryPercent}% batt</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ACTIVE</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleHandoff(node)}
                      disabled={isTransferring === node.nodeId}
                      className="px-3 py-1 rounded-xl bg-white/5 hover:bg-sky-500/20 text-neutral-300 hover:text-sky-300 border border-white/10 hover:border-sky-500/30 text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Route</span>
                    </button>
                  )}
                </div>

                {/* Capabilities bar */}
                <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                  {node.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded text-[9px] font-mono bg-neutral-900 border border-white/5 text-neutral-400"
                    >
                      {cap.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
