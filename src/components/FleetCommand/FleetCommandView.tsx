import React, { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { 
  ShieldCheck, 
  Wrench, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Cpu, 
  Boxes, 
  ArrowRight,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Radio,
  ExternalLink,
  Database,
  Zap,
  Compass
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { AxleLockerIcon, HexBolt } from '../TacticalIcons';

export const FleetCommandView: React.FC = () => {
  const { 
    summary, 
    assets, 
    readinessDrivers, 
    setActiveNavTab, 
    setSelectedAssetId,
    mode,
    setMode,
    loadSampleLiveData,
  } = useFleet();

  const [comparisonDimension, setComparisonDimension] = useState<'location' | 'unit' | 'hardware' | 'software'>('location');

  // Breakdown status data for pie chart
  const statusPieData = useMemo(() => [
    { name: 'Mission Ready', value: summary.missionReady, color: '#10B981' },
    { name: 'Maintenance', value: summary.maintenance, color: '#F59E0B' },
    { name: 'Awaiting Spares', value: summary.awaitingParts, color: '#EF4444' },
    { name: 'Software Blocked', value: summary.softwareBlocked, color: '#A855F7' },
    { name: 'Inspection Due', value: summary.inspectionDue, color: '#38BDF8' },
    { name: 'Limited / Other', value: summary.totalAssets - (summary.missionReady + summary.maintenance + summary.awaitingParts + summary.softwareBlocked + summary.inspectionDue), color: '#64748B' }
  ].filter(d => d.value > 0), [summary]);

  // Comparison breakdowns
  const comparisonData = useMemo(() => {
    if (comparisonDimension === 'location') {
      const locMap: Record<string, { total: number; readySum: number; readyCount: number }> = {};
      assets.forEach(a => {
        if (!locMap[a.location]) locMap[a.location] = { total: 0, readySum: 0, readyCount: 0 };
        locMap[a.location].total += 1;
        locMap[a.location].readySum += a.missionReadiness;
        if (a.status === 'MISSION READY') locMap[a.location].readyCount += 1;
      });

      return Object.entries(locMap).map(([name, data]) => ({
        name: name.replace('Forward Operating Base', 'FOB').replace('Proving Grounds', 'PG').replace('Logistics Depot', 'Depot').replace('Training Sector', 'Sector').replace('Outpost', 'Outpost').replace('Test Range', 'TR'),
        fullName: name,
        readiness: Math.round(data.readySum / data.total),
        readyRate: Math.round((data.readyCount / data.total) * 100),
        total: data.total,
        readyCount: data.readyCount,
      })).sort((a, b) => b.readiness - a.readiness);
    }

    if (comparisonDimension === 'unit') {
      const unitMap: Record<string, { total: number; readySum: number; readyCount: number }> = {};
      assets.forEach(a => {
        if (!unitMap[a.assignedTeam]) unitMap[a.assignedTeam] = { total: 0, readySum: 0, readyCount: 0 };
        unitMap[a.assignedTeam].total += 1;
        unitMap[a.assignedTeam].readySum += a.missionReadiness;
        if (a.status === 'MISSION READY') unitMap[a.assignedTeam].readyCount += 1;
      });

      return Object.entries(unitMap).map(([name, data]) => ({
        name,
        fullName: name,
        readiness: Math.round(data.readySum / data.total),
        readyRate: Math.round((data.readyCount / data.total) * 100),
        total: data.total,
        readyCount: data.readyCount,
      })).sort((a, b) => b.readiness - a.readiness);
    }

    if (comparisonDimension === 'hardware') {
      const hwMap: Record<string, { total: number; readySum: number; readyCount: number }> = {};
      assets.forEach(a => {
        if (!hwMap[a.hardwareVersion]) hwMap[a.hardwareVersion] = { total: 0, readySum: 0, readyCount: 0 };
        hwMap[a.hardwareVersion].total += 1;
        hwMap[a.hardwareVersion].readySum += a.missionReadiness;
        if (a.status === 'MISSION READY') hwMap[a.hardwareVersion].readyCount += 1;
      });

      return Object.entries(hwMap).map(([name, data]) => ({
        name,
        fullName: `Hardware ${name}`,
        readiness: Math.round(data.readySum / data.total),
        readyRate: Math.round((data.readyCount / data.total) * 100),
        total: data.total,
        readyCount: data.readyCount,
      })).sort((a, b) => b.readiness - a.readiness);
    }

    // software
    const swMap: Record<string, { total: number; readySum: number; readyCount: number }> = {};
    assets.forEach(a => {
      if (!swMap[a.softwareVersion]) swMap[a.softwareVersion] = { total: 0, readySum: 0, readyCount: 0 };
      swMap[a.softwareVersion].total += 1;
      swMap[a.softwareVersion].readySum += a.missionReadiness;
      if (a.status === 'MISSION READY') swMap[a.softwareVersion].readyCount += 1;
    });

    return Object.entries(swMap).map(([name, data]) => ({
      name: `v${name}`,
      fullName: `Firmware v${name}`,
      readiness: Math.round(data.readySum / data.total),
      readyRate: Math.round((data.readyCount / data.total) * 100),
      total: data.total,
      readyCount: data.readyCount,
    })).sort((a, b) => b.readiness - a.readiness);
  }, [assets, comparisonDimension]);

  const handleAssetClick = (id: string) => {
    setSelectedAssetId(id);
    setActiveNavTab('assets');
  };

  const handleDriverAction = (driver: typeof readinessDrivers[0]) => {
    if (driver.category === 'maintenance') {
      setActiveNavTab('maintenance');
    } else if (driver.category === 'supply_chain') {
      setActiveNavTab('spare-parts');
    } else if (driver.category === 'software') {
      setActiveNavTab('configuration');
    } else if (driver.category === 'inspection') {
      setActiveNavTab('assets');
      if (driver.affectedAssetIds[0]) {
        setSelectedAssetId(driver.affectedAssetIds[0]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Question Callout */}
      <div className="bg-[#10131A] border border-[#242C3A] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#EF4444]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[#EF4444] text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#EF4444]" />
            <span>OPERATIONAL READINESS BRIEFING</span>
          </div>
          <h1 className="text-base md:text-lg font-bold text-white font-mono tracking-tight">
            “How much of the fleet is available right now, what is reducing readiness, and what should operations fix first?”
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl font-sans">
            {mode === 'demo' 
              ? 'Continuous sustainment telemetry across 50 synthetic ground units (MRD-001 — MRD-050).'
              : `Continuous sustainment telemetry across ${assets.length} live deployed autonomous asset(s).`}
          </p>
        </div>

        <button
          onClick={() => setActiveNavTab('readiness-intelligence')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#EF4444] hover:bg-red-600 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-md transition-all shadow-lg shadow-[#EF4444]/25 whitespace-nowrap relative z-10"
        >
          <Sparkles className="w-4 h-4" />
          <span>GENERATE MORNING BRIEF</span>
        </button>
      </div>

      {/* Rugged Off-Road Ground Telemetry Ribbon */}
      <div className="bg-[#12161F] border border-[#242C3A] rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 pb-3 border-b border-[#222834]">
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-[#EF4444]" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
              ALL-TERRAIN GROUND TELEMETRY & CHASSIS DYNAMICS
            </span>
            <span className="text-[10px] bg-[#EF4444]/15 text-[#EF4444] px-2 py-0.5 rounded font-mono font-bold border border-[#EF4444]/35">
              4WD LOCK ACTIVE
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>SECTOR ELEV: 4,820 FT</span>
            </span>
            <span>•</span>
            <span className="text-white">WATER FORDING: <strong className="text-emerald-400">34.0 IN MAX</strong></span>
            <span>•</span>
            <span className="text-white">TIRE PRESSURE: <strong className="text-amber-400">18.5 PSI (AIR-DOWN)</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {/* Pitch & Roll Inclinometer */}
          <div className="bg-[#161B24] p-3 rounded-lg border border-[#283242] flex items-center justify-between">
            <div>
              <div className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Terrain Inclinometer</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5 flex items-center gap-2">
                <span className="text-emerald-400">PITCH: +14°</span>
                <span className="text-neutral-500">|</span>
                <span className="text-amber-400">ROLL: -3°</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#10131A] border border-[#343F52] flex items-center justify-center text-xs font-mono text-[#EF4444] font-bold">
              14°
            </div>
          </div>

          {/* Differential Lockers */}
          <div className="bg-[#161B24] p-3 rounded-lg border border-[#283242] flex items-center justify-between">
            <div>
              <div className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Heavy-Duty Axles</div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>FRONT & REAR LOCKED</span>
              </div>
            </div>
            <AxleLockerIcon locked={true} className="w-6 h-6 text-[#EF4444]" />
          </div>

          {/* Suspension Articulation */}
          <div className="bg-[#161B24] p-3 rounded-lg border border-[#283242] flex items-center justify-between">
            <div>
              <div className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Suspension Articulation</div>
              <div className="text-sm font-bold font-mono text-amber-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>DISCONNECTED (HIGH TRAVEL)</span>
              </div>
            </div>
            <div className="text-[10px] font-mono font-bold text-neutral-300 bg-[#10131A] px-2 py-1 rounded border border-[#343F52]">
              842 RTI
            </div>
          </div>

          {/* Transfer Case Mode */}
          <div className="bg-[#161B24] p-3 rounded-lg border border-[#283242] flex items-center justify-between">
            <div>
              <div className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">Transfer Case Mode</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5 flex items-center gap-1.5">
                <span className="text-[#EF4444]">4L</span>
                <span className="text-neutral-400 text-xs">LOW-RANGE 4:1</span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30 font-bold">
              77.2:1 CRAWL
            </div>
          </div>
        </div>
      </div>

      {/* Live Mode Onboarding Empty State Card */}
      {assets.length === 0 && (
        <div className="bg-[#11141B] border border-dashed border-emerald-500/30 rounded-xl p-8 text-center font-mono">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider mb-2">
            Live Operations Ready — Awaiting Telemetry & Data Sources
          </h2>
          <p className="text-xs text-neutral-400 max-w-lg mx-auto mb-6 font-sans">
            You are currently in <span className="text-emerald-400 font-bold">Live Operations Mode</span>. Connect your real ground robots, rovers, or fleet data via REST APIs, webhooks, or CSV spreadsheets to start monitoring availability.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveNavTab('data-sources')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-emerald-500/20"
            >
              <Zap className="w-4 h-4" />
              <span>Open Data Sources & Connect Telemetry</span>
            </button>
            <button
              onClick={() => loadSampleLiveData()}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs rounded-lg transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Load 5-Vehicle Live Starter Batch</span>
            </button>
            <button
              onClick={() => setMode('demo')}
              className="px-4 py-2.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 text-xs rounded-lg transition-colors flex items-center gap-2"
            >
              <span>Explore Demo Showcase (50 Vehicles)</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Grid (Rugged Armor Styling) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Fleet Readiness */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-2 glass-panel p-4 rounded-xl relative overflow-hidden flex flex-col justify-between border border-[#242C3A]">
          <div>
            <div className="text-[10px] uppercase text-neutral-400 tracking-wider mb-1 font-mono">Fleet Readiness</div>
            <div className="text-3xl font-bold text-white font-mono">
              {summary.fleetReadiness}<span className="text-sm text-neutral-500 ml-1 font-mono">%</span>
            </div>
          </div>
          <div className="h-2 w-full bg-[#151922] mt-4 rounded-full overflow-hidden border border-[#222834]">
            <div className="h-full bg-[#EF4444] transition-all duration-500" style={{ width: `${summary.fleetReadiness}%` }}></div>
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] font-mono text-neutral-400">
            <span>TARGET: 90%</span>
            <span className="text-[#EF4444] font-bold">{summary.totalAssets} ASSETS TOTAL</span>
          </div>
        </div>

        {/* Mission Ready */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border border-[#242C3A]">
          <div className="text-[10px] uppercase text-neutral-400 tracking-wider mb-1 font-mono">Mission Ready</div>
          <div className="text-3xl font-bold text-white font-mono">
            {summary.missionReady}<span className="text-sm text-neutral-500 ml-1 font-mono">/ {summary.totalAssets}</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-2 font-mono flex items-center gap-1 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>+2 FROM PREV CYCLE</span>
          </div>
        </div>

        {/* Maintenance */}
        <div 
          onClick={() => setActiveNavTab('maintenance')}
          className="glass-panel p-4 rounded-xl flex flex-col justify-between border border-[#242C3A] hover:border-amber-500/40 cursor-pointer transition-colors"
        >
          <div className="text-[10px] uppercase text-neutral-400 tracking-wider mb-1 font-mono">Maintenance</div>
          <div className="text-3xl font-bold text-amber-400 font-mono">
            0{summary.maintenance}
          </div>
          <div className="text-[10px] text-amber-400/90 mt-2 font-mono flex items-center justify-between">
            <span>DEPOT BAYS</span>
            <ChevronRight className="w-3 h-3 text-neutral-500" />
          </div>
        </div>

        {/* Awaiting Spares */}
        <div 
          onClick={() => setActiveNavTab('spare-parts')}
          className="glass-panel p-4 rounded-xl flex flex-col justify-between border border-[#EF4444]/35 bg-[#EF4444]/[0.03] cursor-pointer transition-colors"
        >
          <div className="text-[10px] uppercase text-neutral-400 tracking-wider mb-1 font-mono">Awaiting Spares</div>
          <div className="text-3xl font-bold text-[#EF4444] font-mono">
            0{summary.awaitingParts}
          </div>
          <div className="text-[10px] text-[#EF4444] mt-2 font-mono uppercase tracking-tight font-bold">
            CRITICAL_BLOCKER
          </div>
        </div>

        {/* Software Blocked */}
        <div 
          onClick={() => setActiveNavTab('configuration')}
          className="glass-panel p-4 rounded-xl flex flex-col justify-between border border-[#242C3A] hover:border-purple-500/40 cursor-pointer transition-colors"
        >
          <div className="text-[10px] uppercase text-neutral-400 tracking-wider mb-1 font-mono">Software Blocked</div>
          <div className="text-3xl font-bold text-purple-400 font-mono">
            0{summary.softwareBlocked}
          </div>
          <div className="text-[10px] text-purple-400/90 mt-2 font-mono">
            v4.7.0 SOCKET BUG
          </div>
        </div>

        {/* Active Faults */}
        <div 
          onClick={() => setActiveNavTab('faults')}
          className="glass-panel p-4 rounded-xl flex flex-col justify-between border border-rose-500/30 hover:border-rose-500/50 cursor-pointer transition-colors"
        >
          <div className="text-[10px] uppercase text-neutral-400 tracking-wider mb-1 font-mono">Active Faults</div>
          <div className="text-3xl font-bold text-rose-500 font-mono">
            0{summary.criticalFaults}
          </div>
          <div className="text-[10px] text-rose-500 mt-2 font-mono uppercase tracking-tight font-bold">
            URGENT_TRIAGE
          </div>
        </div>
      </div>

      {/* Main Command Center: Visual Readiness Breakdown & Top Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Readiness Drivers (Left 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-xl p-5 shadow-sm border border-[#242C3A]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[#EF4444]">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-bold text-white font-mono">
                    TOP READINESS DRIVERS
                  </h3>
                  <p className="text-xs text-neutral-400 font-sans">Root causes currently suppressing overall fleet availability</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-[#EF4444] font-bold">
                -18.0% FLEET DRAG
              </span>
            </div>

            <div className="space-y-3">
              {readinessDrivers.map((driver, index) => (
                <div
                  key={driver.id}
                  className="p-3.5 bg-white/[0.02] border border-[#222834] rounded-lg hover:border-[#343F52] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${
                        driver.severity === 'critical'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : driver.severity === 'high'
                          ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30 font-bold'
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                      }`}>
                        DRIVER 0{index + 1} • {driver.severity}
                      </span>
                      <span className="text-xs font-bold text-white font-mono">
                        {driver.title}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      {driver.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                      <span className="text-[#EF4444] font-medium">
                        Action: {driver.recommendedAction}
                      </span>
                      <div className="flex items-center gap-1">
                        {driver.affectedAssetIds.slice(0, 4).map(assetId => (
                          <button
                            key={assetId}
                            onClick={() => handleAssetClick(assetId)}
                            className="text-[10px] font-mono bg-white/5 hover:bg-[#EF4444]/15 hover:text-[#EF4444] text-neutral-300 px-1.5 py-0.5 rounded border border-white/10 transition-colors"
                          >
                            {assetId}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDriverAction(driver)}
                    className="shrink-0 self-end sm:self-center px-3 py-1.5 bg-white/5 hover:bg-[#EF4444]/20 text-neutral-200 hover:text-white border border-white/10 hover:border-[#EF4444]/50 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 font-bold"
                  >
                    <span>Remediate</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#EF4444]" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Operations Ticker */}
          <div className="glass-panel rounded-xl p-4 flex items-center justify-between gap-4 border border-[#242C3A]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse shrink-0" />
              <div className="text-xs font-sans">
                <span className="text-white font-mono font-semibold">Immediate Operations Directive: </span>
                <span className="text-neutral-400">Receive 2x COMM-MOD-V3 transceivers to immediately restore +4% Fleet Readiness (unblocks MRD-014 & MRD-027).</span>
              </div>
            </div>
            <button
              onClick={() => setActiveNavTab('spare-parts')}
              className="shrink-0 px-3 py-1.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 rounded-md text-xs font-mono transition-colors font-bold"
            >
              View Parts Hub
            </button>
          </div>
        </div>

        {/* Visual Readiness Breakdown & Status Spectrum (Right 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-xl p-5 shadow-sm border border-[#242C3A]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold text-white font-mono">
                  READINESS BREAKDOWN
                </h3>
                <p className="text-xs text-neutral-400 font-sans">Status distribution across 50 autonomous platforms</p>
              </div>
              <span className="text-xs font-mono text-[#EF4444] font-bold">50 / 50 Monitored</span>
            </div>

            {/* Pie Chart Distribution */}
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#10131A" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#10131A', borderColor: '#242C3A', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#E0E0E0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Matrix */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/5">
              {statusPieData.map(item => (
                <div key={item.name} className="flex items-center justify-between p-2 bg-white/[0.02] rounded-md border border-[#222834] text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-neutral-300 truncate max-w-[90px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Comparison Matrix */}
      <div className="glass-panel rounded-xl p-5 shadow-sm border border-[#242C3A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-5">
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold text-white font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#EF4444]" />
              FLEET READINESS COMPARISON
            </h3>
            <p className="text-xs text-neutral-400 font-sans">Analyze readiness variance across deployment sectors, teams, and configurations</p>
          </div>

          {/* Comparison Dimension Selectors */}
          <div className="flex items-center gap-1 bg-[#10131A] p-1 rounded-lg border border-[#242C3A] font-mono text-xs">
            <button
              onClick={() => setComparisonDimension('location')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                comparisonDimension === 'location'
                  ? 'bg-[#EF4444]/20 text-[#EF4444] font-bold border border-[#EF4444]/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Location
            </button>
            <button
              onClick={() => setComparisonDimension('unit')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                comparisonDimension === 'unit'
                  ? 'bg-[#EF4444]/20 text-[#EF4444] font-bold border border-[#EF4444]/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Unit / Team
            </button>
            <button
              onClick={() => setComparisonDimension('hardware')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                comparisonDimension === 'hardware'
                  ? 'bg-[#EF4444]/20 text-[#EF4444] font-bold border border-[#EF4444]/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Hardware Gen
            </button>
            <button
              onClick={() => setComparisonDimension('software')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                comparisonDimension === 'software'
                  ? 'bg-[#EF4444]/20 text-[#EF4444] font-bold border border-[#EF4444]/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Software Version
            </button>
          </div>
        </div>

        {/* Comparison Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} fontFamily="monospace" unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#10131A', borderColor: '#242C3A', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#E0E0E0' }}
                  formatter={(value: any) => [`${value}% Readiness`, 'Mission Readiness']}
                />
                <Bar dataKey="readiness" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-4 space-y-2 max-h-64 overflow-y-auto pr-1">
            {comparisonData.map(item => (
              <div
                key={item.name}
                className="p-2.5 bg-white/[0.02] border border-[#222834] rounded-lg flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="font-semibold text-white">{item.fullName}</div>
                  <div className="text-[10px] text-neutral-500">{item.readyCount} of {item.total} Mission Ready</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${
                    item.readiness >= 85 ? 'text-emerald-400' :
                    item.readiness >= 75 ? 'text-[#EF4444]' :
                    'text-amber-400'
                  }`}>
                    {item.readiness}%
                  </div>
                  <div className="text-[10px] text-neutral-400">{item.readyRate}% Capable</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
