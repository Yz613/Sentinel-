import React from 'react';
import { useFleet } from '../context/FleetContext';
import { 
  LayoutDashboard, 
  Layers, 
  Wrench, 
  AlertTriangle, 
  Cpu, 
  Package, 
  Terminal,
  Radio
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { 
    activeNavTab, 
    setActiveNavTab, 
    assets, 
    workOrders, 
    faults, 
    spareParts,
    mode,
  } = useFleet();

  const openWorkOrdersCount = workOrders.filter(w => w.status !== 'Completed').length;
  const activeFaultsCount = faults.filter(f => f.status === 'Active' || f.status === 'Under Repair').length;
  const criticalPartsBottleneck = spareParts.filter(p => p.isLimitingReadiness).length;

  const tabs = [
    {
      id: 'fleet-command',
      label: '01 // C2 DASHBOARD',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'assets',
      label: '02 // ASSET MATRIX',
      icon: Layers,
      badge: assets.length > 0 ? assets.length : null,
    },
    {
      id: 'data-sources',
      label: '03 // TELEMETRY GATEWAY',
      icon: Radio,
      badge: mode === 'live' ? (assets.length > 0 ? 'STREAM' : 'CONNECT') : 'REST/CAN',
      badgeColor: mode === 'live' 
        ? (assets.length > 0 ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' : 'bg-rose-950/40 text-rose-400 border-rose-500/30') 
        : 'bg-[#141720] text-zinc-400 border-zinc-800',
    },
    {
      id: 'maintenance',
      label: '04 // DEPOT OPERATIONS',
      icon: Wrench,
      badge: openWorkOrdersCount > 0 ? openWorkOrdersCount : null,
      badgeColor: 'bg-amber-950/30 text-amber-400 border-amber-500/30',
    },
    {
      id: 'faults',
      label: '05 // FAULT DIAGNOSTICS',
      icon: AlertTriangle,
      badge: activeFaultsCount > 0 ? activeFaultsCount : null,
      badgeColor: 'bg-rose-950/30 text-rose-400 border-rose-500/30',
    },
    {
      id: 'configuration',
      label: '06 // CONFIG & FIRMWARE',
      icon: Cpu,
      badge: 'OTA',
      badgeColor: 'bg-[#141720] text-zinc-400 border-zinc-800',
    },
    {
      id: 'spare-parts',
      label: '07 // SUPPLY CHAIN',
      icon: Package,
      badge: criticalPartsBottleneck > 0 ? `${criticalPartsBottleneck} NMCS` : null,
      badgeColor: 'bg-rose-950/30 text-rose-400 border-rose-500/30',
    },
    {
      id: 'readiness-intelligence',
      label: '08 // READINESS AI',
      icon: Terminal,
      badge: '0600Z',
      badgeColor: 'bg-sky-950/30 text-sky-400 border-sky-500/30',
    },
  ];

  return (
    <div className="bg-[#090B0F] border-b border-[#1A1F29] px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeNavTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveNavTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-mono transition-colors whitespace-nowrap border ${
                isActive
                  ? 'bg-[#121620] text-zinc-100 border-[#2D3748] font-semibold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-[#0E1117]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-zinc-400'}`} />
              <span className="tracking-tight">{tab.label}</span>
              {tab.badge !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono tabular-nums ${tab.badgeColor || (isActive ? 'bg-sky-950/40 text-sky-400 border-sky-500/30' : 'bg-[#141720] text-zinc-400 border-zinc-800')}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
