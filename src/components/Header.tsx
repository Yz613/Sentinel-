import React, { useState, useEffect } from 'react';
import { useFleet } from '../context/FleetContext';
import { 
  Search, 
  RotateCcw, 
  HelpCircle, 
  Terminal, 
  Zap, 
  Activity,
  Radio,
  SlidersHorizontal,
  Server
} from 'lucide-react';
import { ReadmeModal } from './ReadmeModal';

export const Header: React.FC = () => {
  const { 
    mode, 
    setMode, 
    summary, 
    assets,
    searchQuery, 
    setSearchQuery, 
    resetToFactorySeed, 
    loadSampleLiveData,
    clearLiveData,
    setActiveNavTab 
  } = useFleet();

  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [clockTime, setClockTime] = useState('12:00:00Z');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setClockTime(`${hrs}:${mins}:${secs}Z`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const readinessStatusColor = 
    summary.fleetReadiness >= 85 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' :
    summary.fleetReadiness >= 75 ? 'text-amber-400 border-amber-500/30 bg-amber-950/20' :
    summary.totalAssets === 0 ? 'text-zinc-500 border-zinc-800 bg-zinc-900/40' :
    'text-rose-400 border-rose-500/30 bg-rose-950/20';

  return (
    <>
      <header className="bg-[#0A0C10] border-b border-[#1A1F29] sticky top-0 z-40 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          
          {/* C2 Identity & Telemetry Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-7 h-7 bg-[#11141B] border border-[#232A37] rounded flex items-center justify-center text-sky-400 font-mono font-bold text-xs">
              <span className="text-sky-400 font-mono text-[11px] font-bold tracking-tighter">S4</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-xs tracking-widest text-zinc-100 uppercase">
                  SENTINEL
                </span>
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-tight hidden md:inline">
                  // AUTONOMOUS FLEET C2
                </span>
                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border font-medium ${
                  mode === 'live' 
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' 
                    : 'bg-sky-950/30 border-sky-500/30 text-sky-400'
                }`}>
                  {mode === 'live' ? 'OPERATIONAL' : 'SIMULATION'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                <span>UTC {clockTime}</span>
                <span className="text-zinc-500">•</span>
                <span className="text-emerald-400">TELEMETRY 20Hz</span>
                <span className="text-zinc-500 hidden sm:inline">•</span>
                <span className="hidden sm:inline text-zinc-400">STANAG-4586</span>
              </div>
            </div>
          </div>

          {/* Operational Mode Segmented Control */}
          <div className="flex items-center bg-[#0E1117] p-0.5 rounded border border-[#1C222D]">
            <button
              onClick={() => setMode('live')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                mode === 'live'
                  ? 'bg-emerald-600 text-black font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Switch to Real Telemetry Stream"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-black' : 'bg-emerald-500'}`} />
              <span>Live Telemetry</span>
            </button>
            <button
              onClick={() => {
                setMode('demo');
                setActiveNavTab('fleet-command');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                mode === 'demo'
                  ? 'bg-[#1C222D] text-zinc-100 font-semibold border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Switch to 50-Platform Synthetic Scenario"
            >
              <Server className="w-3 h-3 text-sky-400" />
              <span>Synthetic Fleet (50)</span>
            </button>
          </div>

          {/* Quick Telemetry Filter */}
          <div className="flex-1 max-w-xs hidden xl:block">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter tail #, sector, subsystem, DTC..."
                className="w-full bg-[#0E1117] border border-[#1C222D] focus:border-sky-500/50 rounded pl-7 pr-7 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-[#1A1F29] text-zinc-400 px-1 py-0.5 rounded hover:text-white font-mono"
                >
                  ESC
                </button>
              )}
            </div>
          </div>

          {/* System Metrics & Console Controls */}
          <div className="flex items-center gap-2">
            {/* FMC Availability Badge */}
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-mono tabular-nums ${readinessStatusColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-400' : 'bg-sky-400'}`} />
              <span className="font-semibold">
                {summary.totalAssets > 0 ? `FMC: ${summary.fleetReadiness}%` : 'NO LINK'}
              </span>
              {summary.totalAssets > 0 && (
                <span className="text-[10px] text-zinc-400 border-l border-zinc-800 pl-1.5">
                  {summary.missionReady}/{summary.totalAssets} READY
                </span>
              )}
            </div>

            {/* AI Brief Trigger */}
            <button
              onClick={() => setActiveNavTab('readiness-intelligence')}
              className="p-1.5 text-zinc-400 hover:text-sky-400 hover:bg-[#141822] rounded transition-colors border border-[#1C222D]"
              title="Operational Intelligence Console"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>

            {/* Readme / Disclosure */}
            <button
              onClick={() => setIsReadmeOpen(true)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#141822] rounded transition-colors border border-[#1C222D]"
              title="System Documentation & Baseline Disclosures"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Reset / Clear Button */}
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#141822] rounded transition-colors border border-[#1C222D]"
              title={mode === 'demo' ? 'Reset Synthetic Baseline' : 'Manage Live Telemetry'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Readme Modal */}
      <ReadmeModal isOpen={isReadmeOpen} onClose={() => setIsReadmeOpen(false)} />

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0E1117] border border-[#232A37] rounded-lg max-w-md w-full p-5 shadow-2xl text-zinc-200 font-mono">
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider mb-2">
              {mode === 'demo' ? 'CONFIRM SYNTHETIC BASELINE RESET' : 'MANAGE ACTIVE TELEMETRY DATA'}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed font-sans">
              {mode === 'demo' 
                ? 'Restore all 50 synthetic autonomous platforms (MRD-001 — MRD-050) to the baseline mission state (82.0% Fleet Availability).'
                : `Currently tracking ${assets.length} live autonomous assets. Purge stream records or reload the standard 5-platform sample.`}
            </p>
            <div className="flex flex-wrap justify-end gap-2 text-xs">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 rounded border border-zinc-800 transition-colors"
              >
                Cancel
              </button>

              {mode === 'live' && (
                <>
                  <button
                    onClick={async () => {
                      await loadSampleLiveData();
                      setIsResetConfirmOpen(false);
                    }}
                    className="px-3 py-1 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40 rounded border border-emerald-500/30 transition-colors"
                  >
                    Load 5-Tail Sample
                  </button>
                  <button
                    onClick={async () => {
                      await clearLiveData();
                      setIsResetConfirmOpen(false);
                    }}
                    className="px-3 py-1 bg-rose-950/40 text-rose-400 hover:bg-rose-900/40 rounded border border-rose-500/30 transition-colors"
                  >
                    Purge Live Records
                  </button>
                </>
              )}

              {mode === 'demo' && (
                <button
                  onClick={() => {
                    resetToFactorySeed();
                    setIsResetConfirmOpen(false);
                  }}
                  className="px-3 py-1 bg-zinc-200 hover:bg-white text-black font-semibold rounded transition-colors"
                >
                  Confirm Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
