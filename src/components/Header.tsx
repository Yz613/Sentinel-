import React, { useState, useEffect } from 'react';
import { useFleet } from '../context/FleetContext';
import { Search, RefreshCw, HelpCircle, Sparkles } from 'lucide-react';
import { ReadmeModal } from './ReadmeModal';

export const Header: React.FC = () => {
  const { summary, searchQuery, setSearchQuery, resetToFactorySeed, setActiveNavTab } = useFleet();
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [clockTime, setClockTime] = useState('T+482:11:05');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setClockTime(`T+482:${hrs}:${mins}:${secs}Z`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const readinessPillColor = 
    summary.fleetReadiness >= 85 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
    summary.fleetReadiness >= 75 ? 'text-[#F27D26] border-[#F27D26]/30 bg-[#F27D26]/10' :
    'text-rose-400 border-rose-500/30 bg-rose-500/10';

  return (
    <>
      <header className="bg-[#0D0D0F] border-b border-[#1F1F23] sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-6 h-6 bg-[#F27D26] rounded-xs rotate-45 flex items-center justify-center shadow-md shadow-[#F27D26]/20"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm tracking-widest text-white uppercase">
                  SENTINEL
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1F1F23] border border-white/5 text-neutral-400 font-medium">
                  ALPHA-01 REGION
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 font-mono hidden sm:block tracking-tight">
                AUTONOMOUS FLEET COMMAND & SUSTAINMENT
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search assets (e.g. MRD-027, FOB Alpha, Gen 3, Team Orion)..."
                className="w-full bg-[#141417] border border-[#1F1F23] focus:border-[#F27D26]/50 rounded-md pl-9 pr-4 py-1.5 text-xs text-[#E0E0E0] placeholder-neutral-500 focus:outline-none transition-colors font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#1F1F23] text-neutral-400 px-1.5 py-0.5 rounded hover:text-white"
                >
                  ESC
                </button>
              )}
            </div>
          </div>

          {/* Right Status & Tools */}
          <div className="flex items-center gap-3">
            {/* Operational Clock */}
            <div className="text-right hidden xl:block pr-2">
              <div className="text-[9px] text-neutral-500 uppercase font-mono tracking-wider">Operational Clock</div>
              <div className="text-xs font-mono text-neutral-300">{clockTime}</div>
            </div>

            <div className="h-6 w-px bg-white/10 hidden xl:block"></div>

            {/* Live Fleet KPI Quick Badge */}
            <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md border text-xs font-mono font-medium ${readinessPillColor}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F27D26] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F27D26]"></span>
              </span>
              <span>READINESS: {summary.fleetReadiness}%</span>
              <span className="text-[10px] opacity-80 border-l border-white/10 pl-2">
                {summary.missionReady}/{summary.totalAssets} READY
              </span>
            </div>

            {/* AI Brief Quick Trigger */}
            <button
              onClick={() => setActiveNavTab('readiness-intelligence')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#F27D26]/10 hover:bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/30 rounded-md text-xs font-mono transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>Intelligence Brief</span>
            </button>

            {/* Readme / Disclosure */}
            <button
              onClick={() => setIsReadmeOpen(true)}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-md transition-colors border border-[#1F1F23]"
              title="Operational Overview & Synthetic Disclosure"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Reset Seed Button */}
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="p-2 text-neutral-400 hover:text-[#F27D26] hover:bg-white/5 rounded-md transition-colors border border-[#1F1F23]"
              title="Reset to Baseline Seed State"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Readme Modal */}
      <ReadmeModal isOpen={isReadmeOpen} onClose={() => setIsReadmeOpen(false)} />

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0D0D0F] border border-[#1F1F23] rounded-xl max-w-md w-full p-6 shadow-2xl text-[#E0E0E0]">
            <h3 className="text-sm font-bold font-mono text-white mb-2 uppercase tracking-wider">RESET TO FACTORY BASELINE</h3>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed font-sans">
              This will restore all 50 assets (MRD-001 — MRD-050), baseline work orders, 
              equipment faults, and spare parts catalog to their original baseline state (82% Fleet Readiness).
            </p>
            <div className="flex justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-md transition-colors border border-[#1F1F23]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToFactorySeed();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 bg-[#F27D26] hover:bg-orange-500 text-black font-bold rounded-md transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
