import React, { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { 
  Asset, 
  AssetStatus, 
} from '../../types';
import { 
  Search, 
  ArrowUpDown, 
  ChevronRight, 
  AlertTriangle, 
  Layers, 
} from 'lucide-react';
import { CreateWorkOrderModal } from '../Modals/CreateWorkOrderModal';
import { LogFaultModal } from '../Modals/LogFaultModal';

export const AssetTableView: React.FC = () => {
  const { 
    assets, 
    searchQuery, 
    setSearchQuery, 
    setSelectedAssetId,
  } = useFleet();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [hwFilter, setHwFilter] = useState<string>('ALL');
  const [swFilter, setSwFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<keyof Asset>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [workOrderModalAssetId, setWorkOrderModalAssetId] = useState<string | null>(null);
  const [faultModalAssetId, setFaultModalAssetId] = useState<string | null>(null);

  const handleSort = (field: keyof Asset) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Dynamic filter options based on active assets
  const uniqueLocations = useMemo(() => Array.from(new Set(assets.map(a => a.location).filter(Boolean))), [assets]);
  const uniqueHw = useMemo(() => Array.from(new Set(assets.map(a => a.hardwareVersion).filter(Boolean))), [assets]);
  const uniqueSw = useMemo(() => Array.from(new Set(assets.map(a => a.softwareVersion).filter(Boolean))), [assets]);
  const uniqueTeams = useMemo(() => Array.from(new Set(assets.map(a => a.assignedTeam).filter(Boolean))), [assets]);

  // Filtered & Sorted list
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = asset.id.toLowerCase().includes(query);
        const matchesLocation = asset.location.toLowerCase().includes(query);
        const matchesTeam = asset.assignedTeam.toLowerCase().includes(query);
        const matchesStatus = asset.status.toLowerCase().includes(query);
        const matchesHw = asset.hardwareVersion.toLowerCase().includes(query);
        const matchesSw = asset.softwareVersion.toLowerCase().includes(query);
        if (!matchesId && !matchesLocation && !matchesTeam && !matchesStatus && !matchesHw && !matchesSw) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL' && asset.status !== statusFilter) {
        return false;
      }

      // Location filter
      if (locationFilter !== 'ALL' && asset.location !== locationFilter) {
        return false;
      }

      // Hardware filter
      if (hwFilter !== 'ALL' && asset.hardwareVersion !== hwFilter) {
        return false;
      }

      // Software filter
      if (swFilter !== 'ALL' && asset.softwareVersion !== swFilter) {
        return false;
      }

      // Team filter
      if (teamFilter !== 'ALL' && asset.assignedTeam !== teamFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'id') {
        const aNum = parseInt(a.id.replace('MRD-', ''), 10);
        const bNum = parseInt(b.id.replace('MRD-', ''), 10);
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      if (typeof aVal === 'number') {
        return sortDirection === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }

      return 0;
    });
  }, [assets, searchQuery, statusFilter, locationFilter, hwFilter, swFilter, teamFilter, sortField, sortDirection]);

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'MISSION READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            MISSION READY
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            MAINTENANCE
          </span>
        );
      case 'AWAITING PARTS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/40 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            AWAITING PARTS
          </span>
        );
      case 'SOFTWARE BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            SOFTWARE BLOCKED
          </span>
        );
      case 'INSPECTION DUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            INSPECTION DUE
          </span>
        );
      case 'CRITICAL FAULT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            CRITICAL FAULT
          </span>
        );
      case 'LIMITED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            LIMITED
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="c2-panel rounded-sm p-3.5 space-y-2.5">
        {/* Top Controls: Counts & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-zinc-200 uppercase tracking-wider">
              ASSET MATRIX ({filteredAssets.length} / {assets.length})
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Sorted by: <span className="text-sky-400 uppercase">{String(sortField)} ({sortDirection})</span>
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ID, sector, team..."
              className="w-full bg-[#0D0F14] border border-[#1C212B] rounded-sm pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-500/60 font-mono"
            />
          </div>
        </div>

        {/* Multi-Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-[#1C212B] font-mono text-xs">
          <div>
            <label className="block text-[10px] uppercase text-zinc-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#0D0F14] border border-[#1C212B] rounded-sm px-2 py-1 text-zinc-300 text-xs focus:outline-none focus:border-sky-500/60"
            >
              <option value="ALL">All Statuses</option>
              <option value="MISSION READY">FMC (Mission Ready)</option>
              <option value="LIMITED">PMC (Limited)</option>
              <option value="MAINTENANCE">NMCM (Maintenance)</option>
              <option value="AWAITING PARTS">NMCS (Awaiting Spares)</option>
              <option value="SOFTWARE BLOCKED">Avionics Hold</option>
              <option value="INSPECTION DUE">Inspection Due</option>
              <option value="CRITICAL FAULT">Critical DTC</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 mb-1">Location Sector</label>
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="w-full bg-[#0D0F14] border border-[#1C212B] rounded-sm px-2 py-1 text-zinc-300 text-xs focus:outline-none focus:border-sky-500/60"
            >
              <option value="ALL">All Sectors ({uniqueLocations.length})</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 mb-1">Hardware Gen</label>
            <select
              value={hwFilter}
              onChange={e => setHwFilter(e.target.value)}
              className="w-full bg-[#0D0F14] border border-[#1C212B] rounded-sm px-2 py-1 text-zinc-300 text-xs focus:outline-none focus:border-sky-500/60"
            >
              <option value="ALL">All Hardware ({uniqueHw.length})</option>
              {uniqueHw.map(hw => (
                <option key={hw} value={hw}>{hw}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 mb-1">Software Build</label>
            <select
              value={swFilter}
              onChange={e => setSwFilter(e.target.value)}
              className="w-full bg-[#0D0F14] border border-[#1C212B] rounded-sm px-2 py-1 text-zinc-300 text-xs focus:outline-none focus:border-sky-500/60"
            >
              <option value="ALL">All Software ({uniqueSw.length})</option>
              {uniqueSw.map(sw => (
                <option key={sw} value={sw}>v{sw}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 mb-1">Assigned Team</label>
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="w-full bg-[#0D0F14] border border-[#1C212B] rounded-sm px-2 py-1 text-zinc-300 text-xs focus:outline-none focus:border-sky-500/60"
            >
              <option value="ALL">All Teams ({uniqueTeams.length})</option>
              {uniqueTeams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 50-Asset Table */}
      <div className="c2-panel rounded-sm shadow-xs overflow-hidden">
        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#11141B] text-zinc-400 uppercase tracking-wider border-b border-[#1C212B] select-none text-[10px]">
              <tr>
                <th 
                  onClick={() => handleSort('id')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('location')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Sector</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('missionReadiness')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Readiness</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('hardwareVersion')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>HW / SW</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('operatingHours')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Op Hours</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('openFaultsCount')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Faults</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('nextInspectionHours')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Next Insp</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAssets.map(asset => {
                const isInspectionImminent = asset.nextInspectionHours <= 10;
                const isHighlightAsset = asset.id === 'MRD-027';

                return (
                  <tr
                    key={asset.id}
                    className={`row-hover transition-colors ${
                      isHighlightAsset ? 'bg-[#EF4444]/[0.04]' : ''
                    }`}
                  >
                    {/* Asset ID */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedAssetId(asset.id)}
                        className="font-bold text-white hover:text-[#EF4444] hover:underline flex items-center gap-1.5"
                      >
                        <span>{asset.id}</span>
                        {isHighlightAsset && (
                          <span className="text-[9px] bg-[#EF4444]/20 text-[#EF4444] px-1 py-0.2 rounded border border-[#EF4444]/30">
                            FOCAL
                          </span>
                        )}
                      </button>
                      <div className="text-[10px] text-neutral-500 truncate max-w-[120px]">
                        {asset.assignedTeam}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {getStatusBadge(asset.status)}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-neutral-300">
                      <div className="truncate max-w-[160px]" title={asset.location}>
                        {asset.location}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Comms: {asset.communicationsStatus}
                      </div>
                    </td>

                    {/* Readiness */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          asset.missionReadiness >= 85 ? 'text-emerald-400' :
                          asset.missionReadiness >= 70 ? 'text-[#EF4444]' :
                          'text-amber-400'
                        }`}>
                          {asset.missionReadiness}%
                        </span>
                        <div className="w-12 bg-white/5 rounded-full h-1 overflow-hidden hidden sm:block">
                          <div
                            className={`h-full ${
                              asset.missionReadiness >= 85 ? 'bg-emerald-400' :
                              asset.missionReadiness >= 70 ? 'bg-[#EF4444]' :
                              'bg-amber-400'
                            }`}
                            style={{ width: `${asset.missionReadiness}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* HW / SW */}
                    <td className="py-3 px-4 text-neutral-300">
                      <div className="text-white">{asset.hardwareVersion}</div>
                      <div className={`text-[10px] ${
                        asset.softwareVersion === '4.7.0' ? 'text-purple-400' : 'text-neutral-500'
                      }`}>
                        v{asset.softwareVersion}
                      </div>
                    </td>

                    {/* Operating Hours */}
                    <td className="py-3 px-4 text-neutral-300">
                      {asset.operatingHours} hrs
                    </td>

                    {/* Open Faults */}
                    <td className="py-3 px-4">
                      {asset.openFaultsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-medium">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                          {asset.openFaultsCount}
                        </span>
                      ) : (
                        <span className="text-neutral-600 text-[10px]">0</span>
                      )}
                    </td>

                    {/* Next Inspection */}
                    <td className="py-3 px-4">
                      <span className={`text-xs ${
                        isInspectionImminent ? 'text-rose-400 font-bold animate-pulse' : 'text-neutral-400'
                      }`}>
                        {asset.nextInspectionHours} hrs
                      </span>
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedAssetId(asset.id)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-[#EF4444] hover:text-black text-neutral-300 rounded text-[10px] font-mono transition-colors inline-flex items-center gap-1 border border-white/10"
                        title="View Asset Telemetry & Configuration"
                      >
                        <span>Telemetry</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAssets.length === 0 && (
          <div className="p-8 text-center text-neutral-400 font-mono text-xs">
            <p>No assets match the selected filter criteria.</p>
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setLocationFilter('ALL');
                setHwFilter('ALL');
                setSwFilter('ALL');
                setTeamFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-3 px-4 py-1.5 bg-[#141417] hover:bg-white/10 text-[#EF4444] rounded-md text-xs font-mono border border-white/10"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {workOrderModalAssetId && (
        <CreateWorkOrderModal
          isOpen={true}
          defaultAssetId={workOrderModalAssetId}
          onClose={() => setWorkOrderModalAssetId(null)}
        />
      )}

      {faultModalAssetId && (
        <LogFaultModal
          isOpen={true}
          defaultAssetId={faultModalAssetId}
          onClose={() => setFaultModalAssetId(null)}
        />
      )}
    </div>
  );
};
