import React, { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter 
} from 'lucide-react';
import { WorkOrderStatus } from '../../types';
import { CreateWorkOrderModal } from '../Modals/CreateWorkOrderModal';

export const MaintenanceView: React.FC = () => {
  const { 
    workOrders, 
    assets, 
    spareParts, 
    updateWorkOrderStatus, 
    setSelectedAssetId, 
    setActiveNavTab 
  } = useFleet();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Counters
  const totalOrders = workOrders.length;
  const inProgressOrders = workOrders.filter(w => w.status === 'In Progress').length;
  const awaitingPartsOrders = workOrders.filter(w => w.status === 'Awaiting Parts').length;
  const qualityOrders = workOrders.filter(w => w.status === 'Quality Inspection').length;
  const completedOrders = workOrders.filter(w => w.status === 'Completed').length;

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(wo => {
      if (statusFilter !== 'ALL' && wo.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && wo.priority !== priorityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          wo.id.toLowerCase().includes(q) ||
          wo.assetId.toLowerCase().includes(q) ||
          wo.issue.toLowerCase().includes(q) ||
          wo.technician.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [workOrders, statusFilter, priorityFilter, searchQuery]);

  const handleAssetClick = (assetId: string) => {
    setSelectedAssetId(assetId);
    setActiveNavTab('assets');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xs uppercase tracking-widest font-semibold font-mono text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            MAINTENANCE & DEPOT OPERATIONS
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            Manage active work orders, scheduled overhauls, technician allocations, and depot repair bay throughput.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono rounded-md transition-colors flex items-center gap-2 shadow-md shadow-amber-500/10 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>OPEN NEW WORK ORDER</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
        <div className="glass-panel rounded-xl p-3.5 border border-white/[0.08]">
          <div className="text-[10px] text-neutral-500 uppercase">Total Logged</div>
          <div className="text-2xl font-light text-white font-sans mt-1">{totalOrders}</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 border border-amber-500/30 bg-amber-500/[0.02]">
          <div className="text-[10px] text-amber-400 uppercase">In Progress</div>
          <div className="text-2xl font-light text-amber-400 font-sans mt-1">{inProgressOrders}</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 border border-rose-500/30 bg-rose-500/[0.02]">
          <div className="text-[10px] text-rose-400 uppercase">Awaiting Spares</div>
          <div className="text-2xl font-light text-rose-400 font-sans mt-1">{awaitingPartsOrders}</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 border border-sky-500/30 bg-sky-500/[0.02]">
          <div className="text-[10px] text-sky-400 uppercase">Quality QA</div>
          <div className="text-2xl font-light text-sky-400 font-sans mt-1">{qualityOrders}</div>
        </div>

        <div className="glass-panel rounded-xl p-3.5 border border-emerald-500/30 bg-emerald-500/[0.02]">
          <div className="text-[10px] text-emerald-400 uppercase">Completed</div>
          <div className="text-2xl font-light text-emerald-400 font-sans mt-1">{completedOrders}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-neutral-500 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#141417] border border-[#1F1F23] rounded-md px-2.5 py-1.5 text-neutral-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Awaiting Parts">Awaiting Spares</option>
            <option value="Quality Inspection">Quality Inspection</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="bg-[#141417] border border-[#1F1F23] rounded-md px-2.5 py-1.5 text-neutral-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search work order, asset, tech..."
            className="w-full bg-[#141417] border border-[#1F1F23] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#E0E0E0] placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="glass-panel rounded-xl shadow-sm overflow-hidden border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0D0D0F] text-neutral-400 uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="py-3 px-4">WO ID</th>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Scope / Issue</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Required Parts</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredWorkOrders.map(wo => {
                const targetAsset = assets.find(a => a.id === wo.assetId);

                return (
                  <tr key={wo.id} className="row-hover transition-colors">
                    <td className="py-3 px-4 font-bold text-amber-400">
                      {wo.id}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleAssetClick(wo.assetId)}
                        className="font-bold text-white hover:text-[#F27D26] hover:underline"
                      >
                        {wo.assetId}
                      </button>
                      <div className="text-[10px] text-neutral-500">
                        {targetAsset?.location || 'FOB'}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-white font-medium truncate" title={wo.issue}>
                        {wo.issue}
                      </div>
                      {wo.notes && (
                        <div className="text-[10px] text-neutral-400 truncate font-sans" title={wo.notes}>
                          {wo.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-neutral-300">
                      {wo.maintenanceType}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        wo.priority === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        wo.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-white/5 text-neutral-400 border-white/10'
                      }`}>
                        {wo.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-neutral-300">
                      {wo.technician}
                    </td>

                    <td className="py-3 px-4">
                      {wo.requiredParts && wo.requiredParts.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {wo.requiredParts.map(sku => {
                            const partObj = spareParts.find(p => p.sku === sku);
                            const isStockout = (partObj?.onHand || 0) <= 0;
                            return (
                              <span
                                key={sku}
                                className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                  isStockout
                                    ? 'bg-[#F27D26]/20 text-[#F27D26] border-[#F27D26]/40 font-bold'
                                    : 'bg-[#141417] text-neutral-300 border-white/5'
                                }`}
                              >
                                {sku} {isStockout && '(!)'}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-neutral-600 text-[11px]">None</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={wo.status}
                        onChange={e => updateWorkOrderStatus(wo.id, e.target.value as WorkOrderStatus)}
                        className={`text-[11px] font-mono font-bold rounded px-2 py-1 border focus:outline-none ${
                          wo.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          wo.status === 'Awaiting Parts' ? 'bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/30' :
                          wo.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        }`}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Awaiting Parts">Awaiting Spares</option>
                        <option value="Quality Inspection">Quality QA</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {wo.status !== 'Completed' ? (
                        <button
                          onClick={() => updateWorkOrderStatus(wo.id, 'Completed')}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-[10px] transition-colors"
                        >
                          Complete
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold">Closed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CreateWorkOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
