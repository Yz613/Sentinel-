import React, { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { 
  ShieldCheck, 
  Wrench, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Cpu, 
  Package, 
  ArrowRight,
  ChevronRight,
  TrendingDown,
  Radio,
  ExternalLink,
  Database,
  Terminal,
  Activity,
  Server,
  Filter
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
  Cell,
  CartesianGrid
} from 'recharts';

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
    { name: 'FMC (Mission Ready)', value: summary.missionReady, color: '#10B981' },
    { name: 'NMCM (Depot Maintenance)', value: summary.maintenance, color: '#F59E0B' },
    { name: 'NMCS (Supply Starved)', value: summary.awaitingParts, color: '#EF4444' },
    { name: 'PMC (Firmware Hold)', value: summary.softwareBlocked, color: '#A855F7' },
    { name: 'Inspection Due (200h)', value: summary.inspectionDue, color: '#0EA5E9' },
    { name: 'Limited Availability', value: Math.max(0, summary.totalAssets - (summary.missionReady + summary.maintenance + summary.awaitingParts + summary.softwareBlocked + summary.inspectionDue)), color: '#64748B' }
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
    <div className="space-y-4">
      
      {/* C2 Telemetry Status Header & Operational Directive */}
      <div className="c2-panel rounded-sm p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-[10px] font-mono font-semibold uppercase tracking-wider mb-1">
            <Radio className="w-3 h-3 text-sky-400" />
            <span>OPERATIONAL READINESS DIRECTIVE // LIVE C2 STREAM</span>
          </div>
          <h1 className="text-sm md:text-base font-semibold text-zinc-100 font-mono tracking-tight">
            “How much of the fleet is available right now, what is reducing readiness, and what should operations fix first?”
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl font-sans">
            {mode === 'demo' 
              ? 'Telemetry ingested across 50 synthetic autonomous ground platforms (MRD-001 — MRD-050).'
              : `Telemetry stream active across ${assets.length} live deployed autonomous asset(s).`}
          </p>
        </div>

        <button
          onClick={() => setActiveNavTab('readiness-intelligence')}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#141B26] hover:bg-[#1A2333] text-sky-400 border border-sky-500/30 rounded-sm font-mono text-xs uppercase tracking-wider transition-colors whitespace-nowrap"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>RUN 0600Z BRIEF</span>
        </button>
      </div>

      {/* Live Mode Onboarding Empty State Card */}
      {assets.length === 0 && (
        <div className="c2-panel rounded-sm p-8 text-center font-mono">
          <div className="w-10 h-10 bg-emerald-950/30 border border-emerald-500/30 rounded flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-1">
            Telematics Pipeline Listening — Awaiting Hardware Telemetry
          </h2>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto mb-5 font-sans">
            Operational mode is active. Ingest vehicle telemetry pings, CAN bus frames, or CSV asset manifests through the Telematics Gateway.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveNavTab('data-sources')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs rounded-sm transition-colors flex items-center gap-2"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Configure Ingestion Webhooks</span>
            </button>
            <button
              onClick={() => loadSampleLiveData()}
              className="px-3.5 py-1.5 bg-[#141822] hover:bg-[#1A202E] text-zinc-200 border border-zinc-700/60 text-xs rounded-sm transition-colors flex items-center gap-2"
            >
              <span>Load 5-Tail Sample</span>
            </button>
            <button
              onClick={() => setMode('demo')}
              className="px-3.5 py-1.5 bg-sky-950/30 hover:bg-sky-900/30 text-sky-400 border border-sky-500/30 text-xs rounded-sm transition-colors flex items-center gap-2"
            >
              <span>View 50-Tail Simulation</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Telemetry & Readiness Matrix (High Information Density) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {/* FMC Fleet Readiness */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-2 c2-panel p-3.5 rounded-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase text-zinc-400 tracking-wider mb-1 font-mono">
              Fleet Availability (FMC)
            </div>
            <div className="text-3xl font-light text-zinc-100 font-mono tabular-nums">
              {summary.fleetReadiness}<span className="text-sm text-zinc-400 ml-1 font-mono">%</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#181D26] mt-3 rounded-xs overflow-hidden border border-zinc-800">
            <div 
              className={`h-full transition-all duration-300 ${
                summary.fleetReadiness >= 85 ? 'bg-emerald-500' :
                summary.fleetReadiness >= 75 ? 'bg-amber-500' :
                'bg-rose-500'
              }`} 
              style={{ width: `${summary.fleetReadiness}%` }} 
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] font-mono text-zinc-400 tabular-nums">
            <span>TARGET: 90.0%</span>
            <span className="text-zinc-300">{summary.totalAssets} PLATFORMS ACTIVE</span>
          </div>
        </div>

        {/* Fully Mission Capable */}
        <div className="c2-panel p-3.5 rounded-sm flex flex-col justify-between">
          <div className="text-[10px] uppercase text-zinc-400 tracking-wider mb-1 font-mono">Mission Ready (FMC)</div>
          <div className="text-3xl font-light text-emerald-400 font-mono tabular-nums">
            {summary.missionReady}<span className="text-sm text-zinc-400 ml-1 font-mono">/{summary.totalAssets}</span>
          </div>
          <div className="text-[10px] text-emerald-400/90 mt-2 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>+2 FROM CYCLE</span>
          </div>
        </div>

        {/* NMCM Depot Maintenance */}
        <div 
          onClick={() => setActiveNavTab('maintenance')}
          className="c2-panel p-3.5 rounded-sm flex flex-col justify-between hover:border-amber-500/40 cursor-pointer transition-colors"
        >
          <div className="text-[10px] uppercase text-zinc-400 tracking-wider mb-1 font-mono">Depot Maintenance (NMCM)</div>
          <div className="text-3xl font-light text-amber-400 font-mono tabular-nums">
            0{summary.maintenance}
          </div>
          <div className="text-[10px] text-amber-400/90 mt-2 font-mono flex items-center justify-between">
            <span>IN REPAIR</span>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
          </div>
        </div>

        {/* NMCS Awaiting Spares */}
        <div 
          onClick={() => setActiveNavTab('spare-parts')}
          className="c2-panel p-3.5 rounded-sm flex flex-col justify-between border-rose-500/30 bg-rose-950/10 hover:border-rose-500/50 cursor-pointer transition-colors"
        >
          <div className="text-[10px] uppercase text-zinc-400 tracking-wider mb-1 font-mono">Supply Depleted (NMCS)</div>
          <div className="text-3xl font-light text-rose-400 font-mono tabular-nums">
            0{summary.awaitingParts}
          </div>
          <div className="text-[10px] text-rose-400 mt-2 font-mono uppercase tracking-tight font-semibold">
            PARTS_DEPLETED
          </div>
        </div>

        {/* PMC Firmware Hold */}
        <div 
          onClick={() => setActiveNavTab('configuration')}
          className="c2-panel p-3.5 rounded-sm flex flex-col justify-between hover:border-purple-500/40 cursor-pointer transition-colors"
        >
          <div className="text-[10px] uppercase text-zinc-400 tracking-wider mb-1 font-mono">Avionics Hold (PMC)</div>
          <div className="text-3xl font-light text-purple-400 font-mono tabular-nums">
            0{summary.softwareBlocked}
          </div>
          <div className="text-[10px] text-purple-400/90 mt-2 font-mono">
            v4.7.0 SOCKET BUG
          </div>
        </div>

        {/* Active Red-X DTCs */}
        <div 
          onClick={() => setActiveNavTab('faults')}
          className="c2-panel p-3.5 rounded-sm flex flex-col justify-between hover:border-rose-500/40 cursor-pointer transition-colors"
        >
          <div className="text-[10px] uppercase text-zinc-400 tracking-wider mb-1 font-mono">Critical DTCs</div>
          <div className="text-3xl font-light text-rose-400 font-mono tabular-nums">
            0{summary.criticalFaults}
          </div>
          <div className="text-[10px] text-rose-400 mt-2 font-mono uppercase tracking-tight">
            RED-X FAULTS
          </div>
        </div>
      </div>

      {/* Main Analysis: Top Readiness Drivers & Capability Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Top Readiness Drivers (Left 7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="c2-panel rounded-sm">
            <div className="c2-panel-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-100 font-mono">
                    READINESS DEGRADATION DRIVERS
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans">Root causes suppressing mission availability sorted by operational drag</p>
                </div>
              </div>
              <span className="text-xs font-mono text-rose-400 font-semibold tabular-nums">
                -18.0% FLEET IMPACT
              </span>
            </div>

            <div className="p-3 space-y-2">
              {readinessDrivers.map((driver, index) => (
                <div
                  key={driver.id}
                  className="p-3 bg-[#0F1218] border border-[#1C212B] rounded-sm hover:border-[#2A3342] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border uppercase ${
                        driver.severity === 'critical'
                          ? 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                          : driver.severity === 'high'
                          ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                          : 'bg-sky-950/40 text-sky-400 border-sky-500/30'
                      }`}>
                        P0{index + 1} // {driver.severity}
                      </span>
                      <span className="text-xs font-semibold text-zinc-100 font-mono">
                        {driver.title}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                      {driver.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5 font-mono text-[11px]">
                      <span className="text-sky-400">
                        Directive: {driver.recommendedAction}
                      </span>
                      <div className="flex items-center gap-1">
                        {driver.affectedAssetIds.slice(0, 4).map(assetId => (
                          <button
                            key={assetId}
                            onClick={() => handleAssetClick(assetId)}
                            className="text-[10px] font-mono bg-[#141720] hover:bg-[#1C2230] text-zinc-300 hover:text-sky-400 px-1.5 py-0.5 rounded border border-zinc-800 transition-colors"
                          >
                            {assetId}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDriverAction(driver)}
                    className="shrink-0 self-end sm:self-center px-2.5 py-1 bg-[#141720] hover:bg-[#1C2330] text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-sm text-xs font-mono transition-colors flex items-center gap-1.5"
                  >
                    <span>Remediate</span>
                    <ArrowRight className="w-3 h-3 text-sky-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Operations Ticker */}
          <div className="c2-panel rounded-sm p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs font-sans">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <div>
                <span className="text-zinc-200 font-mono font-semibold">Logistics Directive: </span>
                <span className="text-zinc-400">Receiving 2x COMM-MOD-V3 transceivers immediately returns +4.0% availability (restores MRD-014 & MRD-027).</span>
              </div>
            </div>
            <button
              onClick={() => setActiveNavTab('spare-parts')}
              className="shrink-0 px-2.5 py-1 bg-[#141822] hover:bg-[#1C2230] text-sky-400 border border-zinc-800 hover:border-sky-500/30 rounded-sm text-xs font-mono transition-colors"
            >
              Supply Depot
            </button>
          </div>
        </div>

        {/* Readiness Breakdown (Right 5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="c2-panel rounded-sm">
            <div className="c2-panel-header flex items-center justify-between">
              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-100 font-mono">
                  AVAILABILITY SPECTRUM
                </h3>
                <p className="text-[11px] text-zinc-400 font-sans">Platform mission state distribution</p>
              </div>
              <span className="text-xs font-mono text-zinc-400 tabular-nums">50 / 50 Tracked</span>
            </div>

            <div className="p-3">
              {/* Pie Chart Distribution */}
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={74}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0D0F14" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0D0F14', borderColor: '#1C212B', borderRadius: '2px', fontSize: '11px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#E2E8F0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Matrix */}
              <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-[#1C212B]">
                {statusPieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between p-1.5 bg-[#0F1218] rounded-sm border border-[#1C212B] text-[11px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: item.color }} />
                      <span className="text-zinc-300 truncate max-w-[100px]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-zinc-100 tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Readiness Variance Matrix */}
      <div className="c2-panel rounded-sm">
        <div className="c2-panel-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-100 font-mono flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              FLEET READINESS VARIANCE ANALYSIS
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans">Cross-comparison across operational sectors, assigned teams, hardware revisions, and firmware builds</p>
          </div>

          {/* Dimension Selectors */}
          <div className="flex items-center bg-[#090B0F] p-0.5 rounded border border-[#1C212B] font-mono text-xs">
            <button
              onClick={() => setComparisonDimension('location')}
              className={`px-2.5 py-1 rounded-sm transition-colors ${
                comparisonDimension === 'location'
                  ? 'bg-[#181D26] text-sky-400 font-semibold border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sector / Location
            </button>
            <button
              onClick={() => setComparisonDimension('unit')}
              className={`px-2.5 py-1 rounded-sm transition-colors ${
                comparisonDimension === 'unit'
                  ? 'bg-[#181D26] text-sky-400 font-semibold border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Team / Squad
            </button>
            <button
              onClick={() => setComparisonDimension('hardware')}
              className={`px-2.5 py-1 rounded-sm transition-colors ${
                comparisonDimension === 'hardware'
                  ? 'bg-[#181D26] text-sky-400 font-semibold border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Hardware Gen
            </button>
            <button
              onClick={() => setComparisonDimension('software')}
              className={`px-2.5 py-1 rounded-sm transition-colors ${
                comparisonDimension === 'software'
                  ? 'bg-[#181D26] text-sky-400 font-semibold border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Firmware Build
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#161B23" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} fontFamily="monospace" unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D0F14', borderColor: '#1C212B', borderRadius: '2px', fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#E2E8F0' }}
                  formatter={(value: any) => [`${value}% Readiness`, 'Mission Capability']}
                />
                <Bar dataKey="readiness" fill="#0284C7" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-4 space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {comparisonData.map(item => (
              <div
                key={item.name}
                className="p-2 bg-[#0F1218] border border-[#1C212B] rounded-sm flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="font-semibold text-zinc-100">{item.fullName}</div>
                  <div className="text-[10px] text-zinc-400 tabular-nums">{item.readyCount} of {item.total} FMC Ready</div>
                </div>
                <div className="text-right tabular-nums">
                  <div className={`font-semibold ${
                    item.readiness >= 85 ? 'text-emerald-400' :
                    item.readiness >= 75 ? 'text-amber-400' :
                    'text-rose-400'
                  }`}>
                    {item.readiness}%
                  </div>
                  <div className="text-[10px] text-zinc-400">{item.readyRate}% FMC</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
