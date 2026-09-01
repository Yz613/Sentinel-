import React from 'react';
import { useFleet } from '../context/FleetContext';
import { RotateCcw, ArrowRight, Radio, Server } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { mode, setMode, resetDemoData, setActiveNavTab, assets } = useFleet();

  if (mode !== 'demo') {
    return null;
  }

  return (
    <div className="bg-[#0D1016] border-b border-[#1A202C] px-4 sm:px-6 lg:px-8 py-1.5 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-zinc-300 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-sky-950/40 border border-sky-500/30 text-sky-400 font-semibold text-[10px] tracking-wider uppercase">
            <Server className="w-3 h-3" />
            SYNTHETIC ENVIRONMENT
          </span>
          <span className="text-zinc-400 text-[11px]">
            Tracking 50 synthetic autonomous platforms (MRD-001 — MRD-050). Operational telemetry gateway is available for live feeds.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => resetDemoData()}
            className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-800 rounded border border-zinc-800 transition-colors"
            title="Reset baseline synthetic dataset"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={() => {
              setMode('live');
              setActiveNavTab('data-sources');
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 rounded border border-emerald-500/30 transition-colors"
          >
            <Radio className="w-3 h-3" />
            <span>Connect Live Feed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
