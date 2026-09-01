import React, { useState, useEffect } from 'react';
import { useFleet } from '../context/FleetContext';
import { 
  Search, 
  RefreshCw, 
  HelpCircle, 
  Sparkles, 
  Zap, 
  Radio
} from 'lucide-react';
import { ReadmeModal } from './ReadmeModal';
import { SentinelEmblem, HexBolt } from './TacticalIcons';

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
  const [clockTime, setClockTime] = useState('T+482:12:00:00Z');

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
    summary.fleetReadiness >= 85 ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' :
    summary.fleetReadiness >= 75 ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' :
    summary.totalAssets === 0 ? 'text-neutral-400 border-white/10 bg-white/5' :
    'text-rose-400 border-rose-500/40 bg-rose-500/10';

  return (
    <>
      <header className="bg-[#0B0D12] border-b border-[#222834] sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Logo & Tactical Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-[#141822] p-1.5 rounded-md border border-[#273040] shadow-inner">
              <SentinelEmblem className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm tracking-widest text-white uppercase">
                  SENTINEL
                </span>
                <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border font-semibold tracking-wider ${
                  mode === 'live' 
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400' 
                    : 'bg-[#EF4444]/15 border-[#EF4444]/35 text-[#EF4444]'
                }`}>
                  {mode === 'live' ? 'LIVE OPERATIONS' : 'DEMO SANDBOX'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono hidden sm:block tracking-tight">
                AUTONOMOUS FLEET COMMAND & SUSTAINMENT
              </p>
            </div>
          </div>

          {/* Heavy-Duty Tactical Mode Switcher (Chunky Auxiliary Switch Styling) */}
          <div className="flex items-center bg-[#131720] p-1 rounded-md border border-[#242C3A] shadow-inner">
            <button
              onClick={() => setMode('live')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-all ${
                mode === 'live'
                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Switch to Real Fleet Telemetry and Ingestion Mode"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-black' : 'bg-emerald-500'}`}></span>
              <span>Live Ops</span>
            </button>
            <button
              onClick={() => {
                setMode('demo');
                setActiveNavTab('fleet-command');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-all ${
                mode === 'demo'
                  ? 'bg-[#EF4444] text-white font-bold shadow-md shadow-[#EF4444]/25'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Switch to 50-Vehicle Synthetic Showcase"
            >
              <Sparkles className="w-3 h-3" />
              <span>Demo Fleet</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="flex-1 max-w-xs hidden xl:block">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search assets, sectors, hardware..."
                className="w-full bg-[#131720] border border-[#242C3A] focus:border-[#EF4444]/60 rounded-md pl-8 pr-3 py-1 text-xs text-[#E0E0E0] placeholder-neutral-500 focus:outline-none transition-colors font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-[#222834] text-neutral-400 px-1.5 py-0.5 rounded hover:text-white"
                >
                  ESC
                </button>
              )}
            </div>
          </div>

          {/* Right Status & Tools */}
          <div className="flex items-center gap-2.5">
            {/* Live Fleet KPI Quick Badge */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-mono font-medium ${readinessPillColor}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  mode === 'live' ? 'bg-emerald-400' : 'bg-[#EF4444]'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  mode === 'live' ? 'bg-emerald-400' : 'bg-[#EF4444]'
                }`}></span>
              </span>
              <span>
                {summary.totalAssets > 0 ? `READINESS: ${summary.fleetReadiness}%` : 'NO LIVE DATA'}
              </span>
              {summary.totalAssets > 0 && (
                <span className="text-[10px] opacity-80 border-l border-white/15 pl-1.5">
                  {summary.missionReady}/{summary.totalAssets} READY
                </span>
              )}
            </div>

            {/* Quick Demo Dashboard button if in Live mode */}
            {mode === 'live' && (
              <button
                onClick={() => {
                  setMode('demo');
                  setActiveNavTab('fleet-command');
                }}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 rounded-md text-xs font-mono transition-colors"
                title="Jump to the 50-vehicle synthetic demo dashboard"
              >
                <Sparkles className="w-3 h-3" />
                <span>Demo Dashboard</span>
              </button>
            )}

            {/* Plug In Real Data button if in Demo mode */}
            {mode === 'demo' && (
              <button
                onClick={() => {
                  setMode('live');
                  setActiveNavTab('data-sources');
                }}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md text-xs font-mono transition-colors"
                title="Plug In Real Telemetry & Data Sources"
              >
                <Zap className="w-3 h-3" />
                <span>Connect Sources</span>
              </button>
            )}

            {/* AI Brief Quick Trigger */}
            <button
              onClick={() => setActiveNavTab('readiness-intelligence')}
              className="p-1.5 text-neutral-400 hover:text-[#EF4444] hover:bg-white/5 rounded-md transition-colors border border-[#242C3A]"
              title="Intelligence Brief"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Readme / Disclosure */}
            <button
              onClick={() => setIsReadmeOpen(true)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-md transition-colors border border-[#242C3A]"
              title="Documentation & Disclosure"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Reset / Clear Button */}
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="p-1.5 text-neutral-400 hover:text-[#EF4444] hover:bg-white/5 rounded-md transition-colors border border-[#242C3A]"
              title={mode === 'demo' ? 'Reset Demo Fleet' : 'Manage Live Data'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Readme Modal */}
      <ReadmeModal isOpen={isReadmeOpen} onClose={() => setIsReadmeOpen(false)} />

      {/* Reset / Manage Data Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#11141B] border border-[#242C3A] rounded-xl max-w-md w-full p-6 shadow-2xl text-[#E0E0E0] relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#EF4444] to-transparent rounded-t-xl" />
            <h3 className="text-sm font-bold font-mono text-white mb-2 uppercase tracking-wider">
              {mode === 'demo' ? 'RESET DEMO FLEET BASELINE' : 'LIVE DATA MANAGEMENT'}
            </h3>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed font-sans">
              {mode === 'demo' 
                ? 'This will restore all 50 synthetic assets (MRD-001 — MRD-050), work orders, faults, and spare parts catalog to the original baseline state (82% Fleet Readiness).'
                : `Currently monitoring ${assets.length} live operational assets. You can wipe all live data to start completely fresh, or load a 5-unit sample starter fleet.`}
            </p>
            <div className="flex flex-wrap justify-end gap-2.5 font-mono text-xs">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-md transition-colors border border-[#242C3A]"
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
                    className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-medium rounded-md border border-emerald-500/30 transition-colors"
                  >
                    Load 5-Asset Sample
                  </button>
                  <button
                    onClick={async () => {
                      await clearLiveData();
                      setIsResetConfirmOpen(false);
                    }}
                    className="px-3.5 py-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-medium rounded-md border border-rose-500/30 transition-colors"
                  >
                    Clear All Live Data
                  </button>
                </>
              )}

              {mode === 'demo' && (
                <button
                  onClick={() => {
                    resetToFactorySeed();
                    setIsResetConfirmOpen(false);
                  }}
                  className="px-4 py-1.5 bg-[#EF4444] hover:bg-red-600 text-white font-bold rounded-md transition-colors shadow-md shadow-[#EF4444]/25"
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
