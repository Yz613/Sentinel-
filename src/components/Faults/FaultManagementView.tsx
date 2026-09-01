import React, { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { 
  AlertTriangle, 
  Plus, 
  Filter, 
  Search 
} from 'lucide-react';
import { FaultStatus } from '../../types';
import { LogFaultModal } from '../Modals/LogFaultModal';

export const FaultManagementView: React.FC = () => {
  const { 
    faults, 
    assets, 
    updateFaultStatus, 
    setSelectedAssetId, 
    setActiveNavTab 
  } = useFleet();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [systemFilter, setSystemFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Counters
  const criticalCount = faults.filter(f => f.severity === 'Critical' && f.status !== 'Cleared').length;
  const moderateCount = faults.filter(f => f.severity === 'Moderate' && f.status !== 'Cleared').length;
  const lowCount = faults.filter(f => f.severity === 'Low' && f.status !== 'Cleared').length;
  const advisoryCount = faults.filter(f => f.severity === 'Advisory' && f.status !== 'Cleared').length;
  const activeTotal = faults.filter(f => f.status !== 'Cleared').length;

  const filteredFaults = useMemo(() => {
    return faults.filter(f => {
      if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
      if (systemFilter !== 'ALL' && f.system !== systemFilter) return false;
      if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          f.id.toLowerCase().includes(q) ||
          f.assetId.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.system.toLowerCase().includes(q) ||
          f.owner.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [faults, severityFilter, systemFilter, statusFilter, searchQuery]);

  const handleAssetClick = (assetId: string) => {
    setSelectedAssetId(assetId);
    setActiveNavTab('assets');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xs uppercase tracking-widest font-semibold font-mono text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            TELEMETRY & EQUIPMENT FAULT MANAGEMENT
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            Real-time diagnostic triage, anomaly tracking, and root-cause classification across 50 autonomous platforms.
          </p>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono rounded-md transition-colors flex items-center gap-2 shadow-md shadow-rose-600/10 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>LOG DIAGNOSTIC FAULT</span>
        </button>
      </div>

      {/* KPI Severity Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
        <div className="glass-panel rounded-xl p-3.5 border border-white/[0.08]">
          <div className="text-[10px] text-neutral-500 uppercase">Active Anomalies</div>
          <div className="text-2xl font-light text-white font-sans mt-1">{activeTotal}</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 border border-rose-500/40 bg-rose-500/[0.02]">
          <div className="text-[10px] text-rose-400 uppercase flex items-center justify-between">
            <span>Critical Severity</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="text-2xl font-light text-rose-400 font-sans mt-1">{criticalCount}</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 border border-amber-500/40 bg-amber-500/[0.02]">
          <div className="text-[10px] text-amber-400 uppercase">Moderate</div>
          <div className="text-2xl font-light text-amber-400 font-sans mt-1">{moderateCount}</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 border border-sky-500/40 bg-sky-500/[0.02]">
          <div className="text-[10px] text-sky-400 uppercase">Low</div>
          <div className="text-2xl font-light text-sky-400 font-sans mt-1">{lowCount}</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 border border-white/[0.08]">
          <div className="text-[10px] text-neutral-500 uppercase">Advisory</div>
          <div className="text-2xl font-light text-white font-sans mt-1">{advisoryCount}</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-neutral-500 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-[#141417] border border-[#1F1F23] rounded-md px-2.5 py-1.5 text-neutral-300 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Moderate">Moderate</option>
            <option value="Low">Low</option>
            <option value="Advisory">Advisory</option>
          </select>

          <select
            value={systemFilter}
            onChange={e => setSystemFilter(e.target.value)}
            className="bg-[#141417] border border-[#1F1F23] rounded-md px-2.5 py-1.5 text-neutral-300 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Subsystems</option>
            <option value="Drive & Powertrain">Drive & Powertrain</option>
            <option value="Communications">Communications</option>
            <option value="Thermal Management">Thermal Management</option>
            <option value="Vision & Optics">Vision & Optics</option>
            <option value="Compute & Avionics">Compute & Avionics</option>
            <option value="Navigation & GNSS">Navigation & GNSS</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#141417] border border-[#1F1F23] rounded-md px-2.5 py-1.5 text-neutral-300 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Repair">Under Repair</option>
            <option value="Mitigated">Mitigated</option>
            <option value="Cleared">Cleared</option>
          </select>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search fault, asset, subsystem..."
            className="w-full bg-[#141417] border border-[#1F1F23] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#E0E0E0] placeholder-neutral-500 focus:outline-none focus:border-rose-500 font-sans"
          />
        </div>
      </div>

      {/* Faults Table */}
      <div className="glass-panel rounded-xl shadow-sm overflow-hidden border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0D0D0F] text-neutral-400 uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Fault ID</th>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Subsystem</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Mission Impact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Investigator</th>
                <th className="py-3 px-4 text-right uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredFaults.map(fault => {
                const targetAsset = assets.find(a => a.id === fault.assetId);

                return (
                  <tr key={fault.id} className="row-hover transition-colors">
                    <td className="py-3 px-4 font-bold text-rose-400">
                      {fault.id}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleAssetClick(fault.assetId)}
                        className="font-bold text-white hover:text-[#EF4444] hover:underline"
                      >
                        {fault.assetId}
                      </button>
                      <div className="text-[10px] text-neutral-500">
                        {targetAsset?.location || 'FOB'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        fault.severity === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 animate-pulse' :
                        fault.severity === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-white/5 text-neutral-400 border-white/10'
                      }`}>
                        {fault.severity}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-neutral-300">
                      {fault.system}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-white font-medium truncate" title={fault.description}>
                        {fault.description}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-sans">
                        Detected: {fault.detectedDate}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs text-neutral-400">
                      <div className="truncate font-sans" title={fault.operationalImpact}>
                        {fault.operationalImpact}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={fault.status}
                        onChange={e => updateFaultStatus(fault.id, e.target.value as FaultStatus)}
                        className={`text-[11px] font-mono font-bold rounded px-2 py-1 border focus:outline-none ${
                          fault.status === 'Active' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          fault.status === 'Under Repair' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Under Repair">Under Repair</option>
                        <option value="Mitigated">Mitigated</option>
                        <option value="Cleared">Cleared</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 text-neutral-400">
                      {fault.owner}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {fault.status !== 'Cleared' ? (
                        <button
                          onClick={() => updateFaultStatus(fault.id, 'Cleared')}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-[10px] transition-colors"
                        >
                          Clear
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold">Mitigated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <LogFaultModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />
    </div>
  );
};
