import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Wrench, 
  Edit, 
  CheckCircle2, 
  Zap, 
  HardDrive, 
  RefreshCw, 
  Plus 
} from 'lucide-react';
import { EditAssetModal } from '../Modals/EditAssetModal';
import { CreateWorkOrderModal } from '../Modals/CreateWorkOrderModal';
import { LogFaultModal } from '../Modals/LogFaultModal';
import { SoftwareVersion } from '../../types';

export const AssetDetailView: React.FC = () => {
  const { 
    assets, 
    selectedAssetId, 
    setSelectedAssetId, 
    workOrders, 
    faults, 
    spareParts,
    logInspection,
    rolloutSoftwareVersion,
    updateWorkOrderStatus,
    updateFaultStatus
  } = useFleet();

  const [activeTab, setActiveTab] = useState<'components' | 'faults' | 'maintenance' | 'software' | 'inspections' | 'parts' | 'timeline'>('components');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [isFaultModalOpen, setIsFaultModalOpen] = useState(false);
  const [targetUpgradeVersion, setTargetUpgradeVersion] = useState<SoftwareVersion>('4.8.2');

  const asset = assets.find(a => a.id === selectedAssetId);

  if (!asset) {
    return (
      <div className="p-8 text-center glass-panel rounded-xl space-y-4 border border-white/[0.08]">
        <p className="text-sm text-neutral-400 font-mono">No asset currently selected or invalid asset ID.</p>
        <button
          onClick={() => setSelectedAssetId(null)}
          className="px-4 py-2 bg-[#EF4444] text-black font-bold rounded-md text-xs font-mono"
        >
          Return to Fleet Asset Matrix
        </button>
      </div>
    );
  }

  const assetWorkOrders = workOrders.filter(w => w.assetId === asset.id);
  const assetFaults = faults.filter(f => f.assetId === asset.id);
  const assetRequiredParts = spareParts.filter(p => asset.requiredSpareParts?.includes(p.sku));

  const handleRunInspection = () => {
    logInspection(asset.id);
  };

  const handleSoftwareUpgrade = () => {
    rolloutSoftwareVersion([asset.id], targetUpgradeVersion);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => setSelectedAssetId(null)}
          className="inline-flex items-center gap-2 text-xs font-mono text-[#EF4444] hover:text-orange-300 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO ALL 50 ASSETS</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>Edit Telemetry</span>
          </button>
          <button
            onClick={() => setIsWorkOrderModalOpen(true)}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Log Work Order</span>
          </button>
          <button
            onClick={() => setIsFaultModalOpen(true)}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Report Fault</span>
          </button>
        </div>
      </div>

      {/* Asset Header Card */}
      <div className="glass-panel rounded-xl p-5 shadow-lg relative overflow-hidden border border-white/[0.08]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#EF4444]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-wide">
                {asset.id}
              </h1>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border uppercase ${
                asset.status === 'MISSION READY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                asset.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                asset.status === 'AWAITING PARTS' ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/40 animate-pulse' :
                asset.status === 'SOFTWARE BLOCKED' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                asset.status === 'INSPECTION DUE' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                'bg-white/5 text-neutral-300 border-white/10'
              }`}>
                STATUS: {asset.status}
              </span>
              <span className="text-xs font-mono text-neutral-400">
                {asset.assignedTeam} • {asset.location}
              </span>
            </div>

            <p className="text-xs text-neutral-400 font-mono">
              {asset.maintenanceStatus}
            </p>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0D0D0F] p-3.5 rounded-xl border border-[#1F1F23] font-mono">
            <div>
              <div className="text-[10px] text-neutral-500 uppercase">Readiness</div>
              <div className={`text-xl font-bold ${
                asset.missionReadiness >= 85 ? 'text-emerald-400' :
                asset.missionReadiness >= 70 ? 'text-[#EF4444]' :
                'text-amber-400'
              }`}>
                {asset.missionReadiness}%
              </div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 uppercase">Hardware / SW</div>
              <div className="text-xs font-bold text-white mt-1">
                {asset.hardwareVersion} <span className="text-neutral-600">|</span> v{asset.softwareVersion}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 uppercase">Operating Hours</div>
              <div className="text-base font-bold text-white mt-0.5">
                {asset.operatingHours} <span className="text-xs text-neutral-500 font-normal">hrs</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 uppercase">Next Inspection</div>
              <div className={`text-base font-bold mt-0.5 ${
                asset.nextInspectionHours <= 10 ? 'text-rose-400 animate-pulse' : 'text-white'
              }`}>
                {asset.nextInspectionHours} <span className="text-xs text-neutral-500 font-normal">hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subsystem Health Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5 text-xs font-mono">
          <div className="flex items-center justify-between p-2 bg-[#0D0D0F] rounded-md border border-[#1F1F23]">
            <span className="text-neutral-400">Battery Core</span>
            <span className={`font-bold ${asset.batteryHealth >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {asset.batteryHealth}%
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-[#0D0D0F] rounded-md border border-[#1F1F23]">
            <span className="text-neutral-400">Powertrain</span>
            <span className={`font-bold ${asset.powertrainHealth >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {asset.powertrainHealth}%
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-[#0D0D0F] rounded-md border border-[#1F1F23]">
            <span className="text-neutral-400">Avionics & Compute</span>
            <span className={`font-bold ${asset.avionicsHealth >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {asset.avionicsHealth}%
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-[#0D0D0F] rounded-md border border-[#1F1F23]">
            <span className="text-neutral-400">Comms Link</span>
            <span className={`font-bold ${
              asset.communicationsStatus === 'Nominal' ? 'text-emerald-400' :
              asset.communicationsStatus === 'Degraded' ? 'text-amber-400' :
              'text-rose-400'
            }`}>
              {asset.communicationsStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#1F1F23] flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-px font-mono text-xs">
        {[
          { id: 'components', label: 'Installed Components' },
          { id: 'faults', label: `Open Faults (${asset.openFaultsCount})` },
          { id: 'maintenance', label: `Maintenance History (${assetWorkOrders.length})` },
          { id: 'software', label: 'Software History & OTA' },
          { id: 'inspections', label: 'Inspection Log' },
          { id: 'parts', label: `Spare Parts (${asset.requiredSpareParts?.length || 0})` },
          { id: 'timeline', label: 'Event Timeline' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-t-md font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-[#EF4444] text-[#EF4444] bg-white/[0.03] font-bold'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="glass-panel rounded-xl p-5 shadow-sm border border-white/[0.08]">
        {/* Tab 1: Installed Components */}
        {activeTab === 'components' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                  INSTALLED HARDWARE & SENSOR PODS
                </h3>
                <p className="text-xs text-neutral-400 font-sans">Diagnostic telemetry per integrated LRU (Line-Replaceable Unit)</p>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                Generation: <strong className="text-[#EF4444]">{asset.hardwareVersion}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {asset.installedComponents.map((comp, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-[#EF4444]" />
                      <div className="text-xs font-bold text-white font-mono">{comp.name}</div>
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400">
                      SKU: <span className="text-neutral-300">{comp.partNumber}</span> • SN: <span className="text-neutral-300">{comp.serialNumber}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      Installed: {comp.installedDate}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${
                      comp.status === 'Nominal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      comp.status === 'Service Required' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      comp.status === 'Degraded' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {comp.status}
                    </span>
                    <div className="text-xs font-mono text-neutral-300 font-bold mt-1.5">
                      {comp.health}% Health
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Faults */}
        {activeTab === 'faults' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                  EQUIPMENT FAULT LOG
                </h3>
                <p className="text-xs text-neutral-400 font-sans">Active and mitigated anomalies affecting {asset.id}</p>
              </div>
              <button
                onClick={() => setIsFaultModalOpen(true)}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Fault</span>
              </button>
            </div>

            {assetFaults.length === 0 ? (
              <div className="p-8 text-center bg-white/[0.02] rounded-xl border border-white/5 text-neutral-400 text-xs font-mono">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                No active or historical faults recorded for {asset.id}. All telemetry nominal.
              </div>
            ) : (
              <div className="space-y-3">
                {assetFaults.map(fault => (
                  <div
                    key={fault.id}
                    className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#EF4444] text-xs">{fault.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          fault.severity === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          fault.severity === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-white/5 text-neutral-300 border-white/10'
                        }`}>
                          {fault.severity} Severity
                        </span>
                        <span className="text-xs text-neutral-200 font-medium">{fault.system}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                          fault.status === 'Active' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          fault.status === 'Under Repair' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {fault.status}
                        </span>
                        {fault.status === 'Active' && (
                          <button
                            onClick={() => updateFaultStatus(fault.id, 'Cleared')}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-mono transition-colors"
                          >
                            Mark Cleared
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-white font-semibold font-mono">
                      {fault.description}
                    </div>

                    <p className="text-xs text-neutral-400 font-sans">
                      <strong>Impact:</strong> {fault.operationalImpact}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1 border-t border-white/5">
                      <span>Detected: {fault.detectedDate}</span>
                      <span>Investigating: {fault.owner}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Maintenance History */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                  WORK ORDERS & DEPOT HISTORY
                </h3>
                <p className="text-xs text-neutral-400 font-sans">Scheduled servicing, LRU swaps, and preventative overhauls</p>
              </div>
              <button
                onClick={() => setIsWorkOrderModalOpen(true)}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Open Work Order</span>
              </button>
            </div>

            {assetWorkOrders.length === 0 ? (
              <div className="p-8 text-center bg-white/[0.02] rounded-xl border border-white/5 text-neutral-400 text-xs font-mono">
                No active work orders for {asset.id}. Last recorded maintenance: August 19.
              </div>
            ) : (
              <div className="space-y-3">
                {assetWorkOrders.map(wo => (
                  <div
                    key={wo.id}
                    className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-xs">{wo.id}</span>
                        <span className="text-xs font-bold text-white">{wo.maintenanceType}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/5">
                          {wo.priority} Priority
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                          wo.status === 'In Progress' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                          wo.status === 'Awaiting Parts' ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/40' :
                          wo.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                          'bg-white/5 text-neutral-400 border-white/10'
                        }`}>
                          {wo.status}
                        </span>

                        {wo.status !== 'Completed' && (
                          <button
                            onClick={() => updateWorkOrderStatus(wo.id, 'Completed')}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-[11px] font-mono transition-colors"
                          >
                            Complete Work Order
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 font-sans">
                      <strong>Scope:</strong> {wo.issue}
                    </p>

                    {wo.notes && (
                      <p className="text-xs text-neutral-400 italic font-sans">
                        Notes: {wo.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-400 font-mono pt-1 border-t border-white/5">
                      <span>Lead: {wo.technician}</span>
                      <span>Opened: {wo.openDate}</span>
                      <span>Est. Completion: {wo.estimatedCompletion}</span>
                      {wo.requiredParts && wo.requiredParts.length > 0 && (
                        <span className="text-[#EF4444]">Parts Required: {wo.requiredParts.join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Software History & OTA */}
        {activeTab === 'software' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                  SOFTWARE CONFIGURATION & OTA UPGRADE
                </h3>
                <p className="text-xs text-neutral-400 font-sans">Manage autonomous firmware builds and remote OTA flashing</p>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-neutral-400">Active Version:</span>
                <span className="px-2.5 py-1 rounded bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 font-bold">
                  v{asset.softwareVersion}
                </span>
              </div>
            </div>

            {/* Remote Flash Control */}
            <div className="p-4 bg-[#0D0D0F] border border-[#EF4444]/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-[#EF4444] text-xs font-mono font-bold">
                <Zap className="w-4 h-4" />
                <span>OVER-THE-AIR (OTA) FIRMWARE DISPATCH</span>
              </div>
              <p className="text-xs text-neutral-400 font-sans">
                Deploy target firmware build to {asset.id}. Upgrading from v4.7.0 to v4.8.2 resolves known mesh socket degradation anomalies.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={targetUpgradeVersion}
                  onChange={e => setTargetUpgradeVersion(e.target.value as SoftwareVersion)}
                  className="bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-[#EF4444]/50"
                >
                  <option value="4.8.2">v4.8.2 (Recommended Fleet Stable)</option>
                  <option value="4.9 Beta">v4.9 Beta (Field Pilot)</option>
                  <option value="4.7.0">v4.7.0 (Legacy Comms Stack)</option>
                  <option value="4.6.1">v4.6.1 (Legacy Gen 2 Baseline)</option>
                </select>

                <button
                  onClick={handleSoftwareUpgrade}
                  disabled={targetUpgradeVersion === asset.softwareVersion}
                  className={`px-4 py-1.5 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    targetUpgradeVersion === asset.softwareVersion
                      ? 'bg-white/5 text-neutral-600 cursor-not-allowed border border-white/5'
                      : 'bg-[#EF4444] hover:bg-orange-500 text-black shadow-md shadow-[#EF4444]/20'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Flash Build v{targetUpgradeVersion}</span>
                </button>
              </div>
            </div>

            {/* Software History List */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase text-neutral-400">Firmware Deployment History</h4>
              {asset.softwareHistory.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-start justify-between gap-3 text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>Build v{entry.version}</span>
                      <span className="text-[10px] text-neutral-500">({entry.installedDate})</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] mt-1 font-sans">{entry.notes}</p>
                  </div>
                  <div className="text-[10px] text-neutral-500 text-right shrink-0">
                    By: {entry.installedBy}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Inspection Log */}
        {activeTab === 'inspections' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                  STRUCTURAL & SAFETY CERTIFICATION
                </h3>
                <p className="text-xs text-neutral-400 font-sans">Mandatory operating interval certifications</p>
              </div>

              <button
                onClick={handleRunInspection}
                className="px-4 py-2 bg-[#EF4444] hover:bg-orange-500 text-black font-bold text-xs font-mono rounded-md transition-colors flex items-center gap-1.5 w-fit"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Certify 200-Hour Inspection</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                <div className="text-xs font-mono text-neutral-400 uppercase">Last Inspection Certified</div>
                <div className="text-sm font-bold text-white font-mono">
                  {asset.lastInspectionDate} (at {asset.lastInspectionHours} operating hours)
                </div>
                <p className="text-xs text-neutral-400 font-sans">
                  Certified by Lead Field Inspector. Structural seals, optical alignment, and battery balance confirmed.
                </p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                <div className="text-xs font-mono text-neutral-400 uppercase">Next Inspection Due In</div>
                <div className={`text-xl font-bold font-mono ${
                  asset.nextInspectionHours <= 10 ? 'text-rose-400 animate-pulse' : 'text-[#EF4444]'
                }`}>
                  {asset.nextInspectionHours} Operating Hours
                </div>
                <p className="text-xs text-neutral-400 font-sans">
                  Lockout threshold triggers automatically when counter reaches 0 hours.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Spare Parts Requirements */}
        {activeTab === 'parts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                  SPARE-PART REQUIREMENTS FOR {asset.id}
                </h3>
                <p className="text-xs text-neutral-400 font-sans">Line components required for active work orders</p>
              </div>
            </div>

            {assetRequiredParts.length === 0 ? (
              <div className="p-8 text-center bg-white/[0.02] rounded-xl border border-white/5 text-neutral-400 text-xs font-mono">
                No active spare parts shortages restricting {asset.id}.
              </div>
            ) : (
              <div className="space-y-3">
                {assetRequiredParts.map(part => (
                  <div
                    key={part.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      part.onHand <= 0
                        ? 'bg-[#EF4444]/[0.03] border-[#EF4444]/40'
                        : 'bg-white/[0.02] border-white/5'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-[#EF4444]">{part.sku}</span>
                        <span className="text-xs text-white font-semibold">{part.partName}</span>
                      </div>
                      <div className="text-xs text-neutral-400 font-mono">
                        Category: {part.category} • Unit Cost: ${part.unitCostUSD.toLocaleString()}
                      </div>
                      {part.onHand <= 0 && (
                        <div className="text-xs text-[#EF4444] font-mono font-bold">
                          CRITICAL: Zero stock on hand. {part.incoming} units incoming (Lead time: {part.leadTimeDays} days).
                        </div>
                      )}
                    </div>

                    <div className="text-right font-mono text-xs">
                      <div className="text-neutral-400">Stock on Hand: <strong className={part.onHand > 0 ? 'text-emerald-400' : 'text-rose-400'}>{part.onHand}</strong></div>
                      <div className="text-neutral-500 text-[11px]">Required for Fleet: {part.requiredForOpenMaintenance}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Operational Event Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                  OPERATIONAL EVENT TIMELINE
                </h3>
                <p className="text-xs text-neutral-400 font-sans">Chronological telemetry audit log for {asset.id}</p>
              </div>
            </div>

            <div className="relative pl-6 border-l-2 border-[#1F1F23] space-y-4 my-2">
              {asset.timelineEvents.map((evt, idx) => (
                <div key={evt.id || idx} className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#EF4444] border-2 border-[#0A0A0B]" />
                  <div className="text-[11px] font-mono text-neutral-500 mb-0.5">{evt.date}</div>
                  <div className="text-xs font-bold font-mono text-white">{evt.title}</div>
                  <p className="text-xs text-neutral-400 mt-0.5 font-sans">{evt.description}</p>
                  {evt.technicianOrSource && (
                    <div className="text-[10px] font-mono text-[#EF4444]/80 mt-1">Source: {evt.technicianOrSource}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <EditAssetModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        asset={asset}
      />

      <CreateWorkOrderModal
        isOpen={isWorkOrderModalOpen}
        onClose={() => setIsWorkOrderModalOpen(false)}
        defaultAssetId={asset.id}
      />

      <LogFaultModal
        isOpen={isFaultModalOpen}
        onClose={() => setIsFaultModalOpen(false)}
        defaultAssetId={asset.id}
      />
    </div>
  );
};
