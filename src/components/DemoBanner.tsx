import React from 'react';
import { useFleet } from '../context/FleetContext';
import { Sparkles, ArrowRight, RefreshCw, Zap } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { mode, setMode, resetDemoData, setActiveNavTab, assets } = useFleet();

  if (mode !== 'demo') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-[#F27D26]/15 via-[#141417] to-[#F27D26]/10 border-b border-[#F27D26]/25 px-4 sm:px-6 lg:px-8 py-2 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-neutral-300 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F27D26]/20 border border-[#F27D26]/40 text-[#F27D26] font-bold text-[10px] tracking-wider uppercase">
            <Sparkles className="w-3 h-3" />
            Demo Showcase
          </span>
          <span className="text-neutral-400 text-[11px] sm:text-xs">
            Viewing pre-configured synthetic fleet ({assets.length} vehicles, MRD-001–MRD-050). Real data can be connected at any time.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => resetDemoData()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
            title="Reset demo data back to 82% readiness seed"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={() => {
              setMode('live');
              setActiveNavTab('data-sources');
            }}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded border border-emerald-500/40 transition-colors shadow-sm"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Plug In Real Data</span>
          </button>

          <button
            onClick={() => setMode('live')}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-[#F27D26] hover:bg-orange-500 text-black rounded transition-colors shadow-sm"
          >
            <span>Live Operations</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
