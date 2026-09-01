import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { MaintenanceType, MaintenancePriority, WorkOrderStatus } from '../../types';
import { X, Wrench, Package } from 'lucide-react';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAssetId?: string;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  isOpen,
  onClose,
  defaultAssetId,
}) => {
  const { assets, spareParts, addWorkOrder } = useFleet();
  const [assetId, setAssetId] = useState(defaultAssetId || assets[0]?.id || 'MRD-001');
  const [issue, setIssue] = useState('');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('Unscheduled Corrective');
  const [priority, setPriority] = useState<MaintenancePriority>('High');
  const [technician, setTechnician] = useState('Tech Sgt. Vance');
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [estimatedCompletion, setEstimatedCompletion] = useState('2026-09-02 (18:00)');
  const [status, setStatus] = useState<WorkOrderStatus>('In Progress');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) return;

    addWorkOrder({
      assetId,
      issue,
      maintenanceType,
      priority,
      technician,
      requiredParts: selectedParts,
      estimatedCompletion,
      status,
      notes,
    });

    onClose();
  };

  const togglePart = (sku: string) => {
    setSelectedParts(prev => 
      prev.includes(sku) ? prev.filter(p => p !== sku) : [...prev, sku]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel border border-white/[0.08] rounded-xl max-w-2xl w-full p-6 shadow-2xl text-neutral-200 relative bg-[#0D0D0F]">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-white">OPEN MAINTENANCE WORK ORDER</h3>
              <p className="text-xs text-neutral-400 font-sans">Dispatch repair bay or scheduled overhaul service</p>
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
                Target Asset
              </label>
              <select
                value={assetId}
                onChange={e => setAssetId(e.target.value)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.status} ({a.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as MaintenancePriority)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-sans"
              >
                <option value="Critical">Critical (Immediate Readiness Blocker)</option>
                <option value="High">High (Mission Impaired)</option>
                <option value="Medium">Medium (Scheduled / Routine)</option>
                <option value="Low">Low (Minor Advisory / Post-Sortie)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
              Issue / Maintenance Task Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wheel encoder intermittent pulse & odometry recalibration"
              value={issue}
              onChange={e => setIssue(e.target.value)}
              className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Maintenance Type
              </label>
              <select
                value={maintenanceType}
                onChange={e => setMaintenanceType(e.target.value as MaintenanceType)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Scheduled Preventative">Scheduled Preventative</option>
                <option value="Unscheduled Corrective">Unscheduled Corrective</option>
                <option value="Overhaul">Overhaul</option>
                <option value="Firmware Calibration">Firmware Calibration</option>
                <option value="Sensor Recalibration">Sensor Recalibration</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Lead Technician
              </label>
              <select
                value={technician}
                onChange={e => setTechnician(e.target.value)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Tech Sgt. Vance">Tech Sgt. Vance</option>
                <option value="Senior Specialist Lin">Senior Specialist Lin</option>
                <option value="Specialist Davies">Specialist Davies</option>
                <option value="Eng. Morales">Eng. Morales</option>
                <option value="Chief Inspector Thorne">Chief Inspector Thorne</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as WorkOrderStatus)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              >
                <option value="In Progress">In Progress (Active Depot Bay)</option>
                <option value="Awaiting Parts">Awaiting Parts</option>
                <option value="Quality Inspection">Quality Inspection</option>
                <option value="Open">Open</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
              Required Spare Parts (Click to toggle)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#141417] p-3 rounded-md border border-[#1F1F23] max-h-36 overflow-y-auto font-mono">
              {spareParts.map(part => {
                const isSelected = selectedParts.includes(part.sku);
                const isOutOfStock = part.onHand <= 0;
                return (
                  <button
                    type="button"
                    key={part.id}
                    onClick={() => togglePart(part.sku)}
                    className={`flex items-start gap-2 p-2 rounded text-left text-xs transition-colors border ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-white/[0.02] border-white/5 text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 mt-0.5 shrink-0 text-neutral-500" />
                    <div>
                      <div className="font-mono font-semibold">{part.sku}</div>
                      <div className="text-[10px] text-neutral-400 truncate max-w-[130px] font-sans">{part.partName}</div>
                      <div className={`text-[10px] ${isOutOfStock ? 'text-rose-400 font-bold' : 'text-neutral-500'}`}>
                        Stock: {part.onHand} {isOutOfStock && '(STOCKOUT)'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
              Estimated Completion Window
            </label>
            <input
              type="text"
              value={estimatedCompletion}
              onChange={e => setEstimatedCompletion(e.target.value)}
              placeholder="e.g. 2026-09-02 (18:00)"
              className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
              Technician Notes & Scope of Work
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Specify procedure, diagnostic findings, or bay assignment..."
              className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-sans"
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
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-md transition-colors flex items-center gap-2 shadow-md shadow-amber-500/10"
            >
              <Wrench className="w-4 h-4" />
              Dispatch Work Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
