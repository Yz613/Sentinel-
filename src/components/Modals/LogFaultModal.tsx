import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { FaultSeverity, SubsystemType, FaultStatus } from '../../types';
import { X, AlertTriangle } from 'lucide-react';

interface LogFaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAssetId?: string;
}

export const LogFaultModal: React.FC<LogFaultModalProps> = ({
  isOpen,
  onClose,
  defaultAssetId,
}) => {
  const { assets, addFault } = useFleet();
  const [assetId, setAssetId] = useState(defaultAssetId || assets[0]?.id || 'MRD-001');
  const [severity, setSeverity] = useState<FaultSeverity>('Moderate');
  const [system, setSystem] = useState<SubsystemType>('Communications');
  const [description, setDescription] = useState('');
  const [operationalImpact, setOperationalImpact] = useState('');
  const [owner, setOwner] = useState('Senior Specialist Lin');
  const [status, setStatus] = useState<FaultStatus>('Active');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    addFault({
      assetId,
      severity,
      system,
      description,
      operationalImpact: operationalImpact || 'Telemetry degraded; operational profile restricted.',
      owner,
      status,
    });

    onClose();
  };

  const commonFaultTemplates = [
    { title: 'Wheel Encoder Intermittent', system: 'Drive & Powertrain' as SubsystemType, sev: 'Moderate' as FaultSeverity, impact: 'Odometry drift on uneven terrain traverse.' },
    { title: 'Communication Module Degradation', system: 'Communications' as SubsystemType, sev: 'Critical' as FaultSeverity, impact: 'Autonomous formation packet drop beyond 3km.' },
    { title: 'Battery Thermal Warning', system: 'Thermal Management' as SubsystemType, sev: 'Critical' as FaultSeverity, impact: 'Core temperature elevated above 58°C limit.' },
    { title: 'Camera Calibration Required', system: 'Vision & Optics' as SubsystemType, sev: 'Low' as FaultSeverity, impact: 'Stereo disparity disparity offset > 5%.' },
    { title: 'Actuator Current Anomaly', system: 'Drive & Powertrain' as SubsystemType, sev: 'Critical' as FaultSeverity, impact: 'Steering rack drawing >45A over-current.' },
    { title: 'GPS Receiver Fault', system: 'Navigation & GNSS' as SubsystemType, sev: 'Moderate' as FaultSeverity, impact: 'Satellite lock delay on cold start.' },
    { title: 'Compute Module Overheating', system: 'Compute & Avionics' as SubsystemType, sev: 'Moderate' as FaultSeverity, impact: 'Thermal throttling reducing inference FPS.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel border border-white/[0.08] rounded-xl max-w-xl w-full p-6 shadow-2xl text-neutral-200 relative bg-[#0D0D0F]">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-white">LOG EQUIPMENT FAULT</h3>
              <p className="text-xs text-neutral-400 font-sans">Record diagnostic anomaly or field failure event</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-md hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick template selector */}
        <div className="mb-4">
          <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
            Quick Presets / Recurring Telemetry Anomalies
          </label>
          <div className="flex flex-wrap gap-1.5">
            {commonFaultTemplates.map(tmpl => (
              <button
                key={tmpl.title}
                type="button"
                onClick={() => {
                  setDescription(tmpl.title.toLowerCase());
                  setSystem(tmpl.system);
                  setSeverity(tmpl.sev);
                  setOperationalImpact(tmpl.impact);
                }}
                className="text-[11px] bg-[#141417] hover:bg-white/10 text-neutral-300 px-2.5 py-1 rounded border border-[#1F1F23] transition-colors font-mono"
              >
                {tmpl.title}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Target Asset *
              </label>
              <select
                value={assetId}
                onChange={e => setAssetId(e.target.value)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-rose-500 font-mono"
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
                Severity Level *
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as FaultSeverity)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Critical">Critical (Immediate System Stand-Down)</option>
                <option value="Moderate">Moderate (Degraded Range/Performance)</option>
                <option value="Low">Low (Minor Sensor Variance)</option>
                <option value="Advisory">Advisory (Telemetry Metric Watch)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Affected Subsystem *
              </label>
              <select
                value={system}
                onChange={e => setSystem(e.target.value as SubsystemType)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Drive & Powertrain">Drive & Powertrain</option>
                <option value="Communications">Communications</option>
                <option value="Thermal Management">Thermal Management</option>
                <option value="Vision & Optics">Vision & Optics</option>
                <option value="Compute & Avionics">Compute & Avionics</option>
                <option value="Navigation & GNSS">Navigation & GNSS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Investigating Engineer / Owner
              </label>
              <select
                value={owner}
                onChange={e => setOwner(e.target.value)}
                className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Senior Specialist Lin">Senior Specialist Lin</option>
                <option value="Tech Sgt. Vance">Tech Sgt. Vance</option>
                <option value="Eng. Morales">Eng. Morales</option>
                <option value="Specialist Davies">Specialist Davies</option>
                <option value="Lead Software Architect Chen">Lead Software Architect Chen</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
              Fault Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. communication module degradation with intermittent packet loss"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
              Operational Impact & Mission Constraint
            </label>
            <textarea
              rows={2}
              value={operationalImpact}
              onChange={e => setOperationalImpact(e.target.value)}
              placeholder="e.g. Degraded range beyond 3.5km; fallback to UHF line-of-sight required."
              className="w-full bg-[#141417] border border-[#1F1F23] rounded-md px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
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
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-md transition-colors flex items-center gap-2 shadow-md shadow-rose-600/20"
            >
              <AlertTriangle className="w-4 h-4" />
              Register Fault
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
