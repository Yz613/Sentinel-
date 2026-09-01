import React from 'react';
import { useFleet } from '../context/FleetContext';
import { 
  LayoutDashboard, 
  Truck, 
  Wrench, 
  AlertTriangle, 
  Cpu, 
  Boxes, 
  Sparkles,
  Database
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
      label: 'Fleet Command',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'assets',
      label: 'Asset Matrix',
      icon: Truck,
      badge: assets.length > 0 ? assets.length : null,
    },
    {
      id: 'data-sources',
      label: 'Data Sources',
      icon: Database,
      badge: mode === 'live' ? (assets.length > 0 ? 'Live' : 'Connect') : 'Sources',
      badgeColor: mode === 'live' 
        ? (assets.length > 0 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40') 
        : 'bg-[#151922] text-neutral-400 border-white/10',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      badge: openWorkOrdersCount > 0 ? openWorkOrdersCount : null,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    {
      id: 'faults',
      label: 'Fault Control',
      icon: AlertTriangle,
      badge: activeFaultsCount > 0 ? activeFaultsCount : null,
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    },
    {
      id: 'configuration',
      label: 'Configuration',
      icon: Cpu,
      badge: 'Gen 2/3',
      badgeColor: 'bg-[#151922] text-neutral-400 border-white/10',
    },
    {
      id: 'spare-parts',
      label: 'Spare Logistics',
      icon: Boxes,
      badge: criticalPartsBottleneck > 0 ? `${criticalPartsBottleneck} Alert` : null,
      badgeColor: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/40',
    },
    {
      id: 'readiness-intelligence',
      label: 'Intelligence Brief',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
    },
  ];

  return (
    <div className="bg-[#0B0D12] border-b border-[#222834] px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeNavTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveNavTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-[#EF4444]/15 text-white border-[#EF4444]/50 font-bold shadow-sm shadow-[#EF4444]/20'
                  : 'text-neutral-400 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#EF4444]' : 'text-neutral-500'}`} />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${tab.badgeColor || (isActive ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40' : 'bg-[#151922] text-neutral-400 border-white/10')}`}>
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
