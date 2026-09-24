/**
 * ONEVA Phase 24: Real-JARVIS Dynamic Autonomous Tool Synthesis & Macro Studio
 * 
 * Allows user to view, test, execute, and dynamically synthesize new tools and
 * custom macros with on-device Rule 6 safety enforcement.
 */

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Play,
  Plus,
  ShieldCheck,
  Zap,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { JarvisDynamicToolService } from '../../services/actions/jarvisDynamicToolService';
import { DynamicToolDefinition } from '../../types/jarvisDynamicTool';

interface JarvisDynamicToolStudioCardProps {
  onToast?: (msg: string) => void;
}

export const JarvisDynamicToolStudioCard: React.FC<JarvisDynamicToolStudioCardProps> = ({ onToast }) => {
  const [tools, setTools] = useState<DynamicToolDefinition[]>(() =>
    JarvisDynamicToolService.getTools()
  );
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisPrompt, setSynthesisPrompt] = useState('');
  const [executingToolId, setExecutingToolId] = useState<string | null>(null);

  useEffect(() => {
    JarvisDynamicToolService.init();
    const unsub = JarvisDynamicToolService.subscribe(() => {
      setTools(JarvisDynamicToolService.getTools());
    });
    return unsub;
  }, []);

  const handleSynthesize = () => {
    if (!synthesisPrompt.trim()) return;
    setIsSynthesizing(true);

    setTimeout(() => {
      const res = JarvisDynamicToolService.synthesizeToolFromPrompt(synthesisPrompt, 'USER_DIRECTIVE');
      setIsSynthesizing(false);

      if (res.error) {
        onToast?.(`⚠️ Synthesis Blocked: ${res.error}`);
      } else if (res.tool) {
        onToast?.(`⚡ Tool Synthesized: "${res.tool.title}" registered in matrix`);
        setSynthesisPrompt('');
      }
    }, 400);
  };

  const handleRunTool = async (tool: DynamicToolDefinition) => {
    setExecutingToolId(tool.id);
    onToast?.(`Executing ${tool.title}...`);

    try {
      const res = await JarvisDynamicToolService.executeTool(tool.id);
      if (res.success) {
        onToast?.(`✅ ${res.userMessageEn}`);
      } else {
        onToast?.(`⚠️ Partial completion: ${res.executedStepsCount}/${res.totalStepsCount} steps`);
      }
    } finally {
      setExecutingToolId(null);
    }
  };

  const handleDeleteTool = (toolId: string, title: string) => {
    JarvisDynamicToolService.deleteTool(toolId);
    onToast?.(`🗑️ Deleted protocol "${title}"`);
  };

  const handleToggleTool = (toolId: string) => {
    JarvisDynamicToolService.toggleTool(toolId);
  };

  return (
    <div className="p-6 rounded-3xl bg-neutral-900/70 border border-violet-500/20 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-sm shadow-violet-950">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Dynamic Tool Synthesis & Macro Engine
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                REAL-JARVIS TIER
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Self-programming action synthesiser: dynamically builds and compiles new multi-step routines with Rule 6 verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>RULE 6 SANDBOXED</span>
          </div>
        </div>
      </div>

      {/* Synthesis Input Bar */}
      <div className="p-4 rounded-2xl bg-neutral-950/60 border border-violet-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-white flex items-center gap-2 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Synthesize New Dynamic Protocol</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Natural Language → Bytecode</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={synthesisPrompt}
            onChange={(e) => setSynthesisPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSynthesize()}
            placeholder="e.g., Gym routine: high volume, 120Hz gaming boost, purge RAM and full brightness..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-violet-400"
          />
          <button
            type="button"
            onClick={handleSynthesize}
            disabled={isSynthesizing || !synthesisPrompt.trim()}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-violet-950"
          >
            {isSynthesizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Compile</span>
          </button>
        </div>

        {/* Quick Synthesis Ideas */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            'Gym Mode with high volume and RAM boost',
            'Deep Study focus with dimmed display and mute',
            'Gaming Turbo with 120Hz and full cleanup',
            'Emergency Stealth protocol',
          ].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setSynthesisPrompt(sample);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-neutral-300 font-mono transition cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Active Synthesized Protocols List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>ACTIVE SYNTHESIZED PROTOCOLS ({tools.length})</span>
          <span>VOICE TRIGGER READY</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className={`p-4 rounded-2xl border transition space-y-3 ${
                tool.isEnabled
                  ? 'bg-neutral-950/70 border-white/10 hover:border-violet-500/40'
                  : 'bg-neutral-950/30 border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{tool.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-violet-500/20 text-violet-300">
                      {tool.steps.length} STEPS
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-2">{tool.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleTool(tool.id)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    tool.isEnabled ? 'bg-violet-500' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                      tool.isEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    } top-0.5 absolute shadow-md`}
                  />
                </button>
              </div>

              {/* Execution Steps Flow */}
              <div className="space-y-1.5 pt-1 border-t border-white/5">
                <div className="text-[10px] text-neutral-500 font-mono uppercase">Execution Sequence:</div>
                <div className="space-y-1">
                  {tool.steps.map((step, idx) => (
                    <div
                      key={step.stepId}
                      className="flex items-center gap-2 text-[11px] text-neutral-300 font-mono bg-white/[0.02] px-2 py-1 rounded"
                    >
                      <span className="text-neutral-500 text-[9px]">{idx + 1}.</span>
                      <span className="truncate">{step.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Triggers & Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <span className="text-violet-400 font-bold">Triggers:</span>
                  <span className="truncate max-w-[150px] text-neutral-300">
                    "{tool.voiceTriggers[0]}"
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteTool(tool.id, tool.title)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition cursor-pointer"
                    title="Delete Macro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunTool(tool)}
                    disabled={executingToolId === tool.id || !tool.isEnabled}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    {executingToolId === tool.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 fill-white" />
                    )}
                    <span>Execute</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
