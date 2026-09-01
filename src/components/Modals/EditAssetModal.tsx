import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Asset, AssetStatus, LocationSector, AssignedTeam, HardwareGen, SoftwareVersion, CommStatus } from '../../types';
import { X, Edit, ShieldCheck } from 'lucide-react';

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
}

export const EditAssetModal: React.FC<EditAssetModalProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  const { updateAsset } = useFleet();
  const [status, setStatus] = useState<AssetStatus>(asset.status);
  const [location, setLocation] = useState<LocationSector>(asset.location);
  const [assignedTeam, setAssignedTeam] = useState<AssignedTeam>(asset.assignedTeam);
  const [hardwareVersion, setHardwareVersion] = useState<HardwareGen>(asset.hardwareVersion);
  const [softwareVersion, setSoftwareVersion] = useState<SoftwareVersion>(asset.softwareVersion);
  const [operatingHours, setOperatingHours] = useState(asset.operatingHours);
  const [commStatus, setCommStatus] = useState<CommStatus>(asset.communicationsStatus);
  const [missionReadiness, setMissionReadiness] = useState(asset.missionReadiness);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAsset(asset.id, {
      status,
      location,
      assignedTeam,
      hardwareVersion,
      softwareVersion,
      operatingHours,
      communicationsStatus: commStatus,
      missionReadiness,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel border border-white/[0.08] rounded-xl max-w-xl w-full p-6 shadow-2xl text-neutral-200 relative bg-[#0D0D0F]">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F27D26]/10 border border-[#F27D26]/30 rounded-lg text-[#F27D26]">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-white">EDIT ASSET TELEMETRY: {asset.id}</h3>
              <p className="text-xs text-neutral-400 font-sans">Update deployment metadata, status override, and sector assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-md hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Operational Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as AssetStatus)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-[#F27D26]/50 font-mono"
              >
                <option value="MISSION READY">MISSION READY</option>
                <option value="LIMITED">LIMITED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="AWAITING PARTS">AWAITING PARTS</option>
                <option value="SOFTWARE BLOCKED">SOFTWARE BLOCKED</option>
                <option value="INSPECTION DUE">INSPECTION DUE</option>
                <option value="CRITICAL FAULT">CRITICAL FAULT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Mission Readiness % ({missionReadiness}%)
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={missionReadiness}
                onChange={e => setMissionReadiness(Number(e.target.value))}
                className="w-full h-2 bg-[#1F1F23] rounded-lg appearance-none cursor-pointer accent-[#F27D26] mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Sector Location
              </label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value as LocationSector)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-[#F27D26]/50"
              >
                <option value="Forward Operating Base Alpha">Forward Operating Base Alpha</option>
                <option value="Bravo Proving Grounds">Bravo Proving Grounds</option>
                <option value="Victor Logistics Depot">Victor Logistics Depot</option>
                <option value="Echo Training Sector">Echo Training Sector</option>
                <option value="Sierra Outpost">Sierra Outpost</option>
                <option value="Nevada Test Range">Nevada Test Range</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Assigned Unit / Team
              </label>
              <select
                value={assignedTeam}
                onChange={e => setAssignedTeam(e.target.value as AssignedTeam)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-[#F27D26]/50"
              >
                <option value="Team Orion">Team Orion</option>
                <option value="Team Aegis">Team Aegis</option>
                <option value="Ghost Recon Unit">Ghost Recon Unit</option>
                <option value="Iron Vanguard">Iron Vanguard</option>
                <option value="3rd Autonomous Platoon">3rd Autonomous Platoon</option>
                <option value="Task Force Titan">Task Force Titan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Hardware Generation
              </label>
              <select
                value={hardwareVersion}
                onChange={e => setHardwareVersion(e.target.value as HardwareGen)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-[#F27D26]/50"
              >
                <option value="Gen 2">Gen 2</option>
                <option value="Gen 2.5">Gen 2.5</option>
                <option value="Gen 3">Gen 3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Software Version
              </label>
              <select
                value={softwareVersion}
                onChange={e => setSoftwareVersion(e.target.value as SoftwareVersion)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-[#F27D26]/50 font-mono"
              >
                <option value="4.6.1">4.6.1</option>
                <option value="4.7.0">4.7.0</option>
                <option value="4.8.2">4.8.2 (Stable)</option>
                <option value="4.9 Beta">4.9 Beta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Comms Status
              </label>
              <select
                value={commStatus}
                onChange={e => setCommStatus(e.target.value as CommStatus)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-[#F27D26]/50"
              >
                <option value="Nominal">Nominal</option>
                <option value="Degraded">Degraded</option>
                <option value="Offline">Offline</option>
                <option value="Intermittent">Intermittent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
              Operating Hours
            </label>
            <input
              type="number"
              min={0}
              max={5000}
              value={operatingHours}
              onChange={e => setOperatingHours(Number(e.target.value))}
              className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-[#F27D26]/50 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 font-mono">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#F27D26] hover:bg-orange-500 text-black font-bold text-xs rounded-md transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Save Asset Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
