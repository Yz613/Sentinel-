import React from 'react';
import { useFleet } from '../context/FleetContext';
import { 
  LayoutDashboard, 
  Truck, 
  Wrench, 
  AlertTriangle, 
  Cpu, 
  Boxes, 
  Sparkles 
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { 
    activeNavTab, 
    setActiveNavTab, 
    assets, 
    workOrders, 
    faults, 
    spareParts,
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
      badge: assets.length,
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
    },
    {
      id: 'spare-parts',
      label: 'Spare Logistics',
      icon: Boxes,
      badge: criticalPartsBottleneck > 0 ? `${criticalPartsBottleneck} Alert` : null,
      badgeColor: 'bg-[#F27D26]/15 text-[#F27D26] border-[#F27D26]/40',
    },
    {
      id: 'readiness-intelligence',
      label: 'Intelligence Brief',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/30',
    },
  ];

  return (
    <div className="bg-[#0D0D0F] border-b border-[#1F1F23] px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeNavTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveNavTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-mono transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/30 font-medium'
                  : 'text-neutral-400 border-transparent hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F27D26]' : 'text-neutral-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${
                    tab.badgeColor || (isActive ? 'bg-[#F27D26]/20 text-[#F27D26] border-[#F27D26]/30' : 'bg-[#141417] text-neutral-400 border-white/5')
                  }`}
                >
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
