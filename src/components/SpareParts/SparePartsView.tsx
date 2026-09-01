import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { 
  Boxes, 
  AlertTriangle, 
  Truck, 
  CheckCircle2, 
} from 'lucide-react';

export const SparePartsView: React.FC = () => {
  const { 
    spareParts, 
    assets, 
    receiveSparePartStock, 
    reorderSparePart, 
    setSelectedAssetId, 
    setActiveNavTab 
  } = useFleet();

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  // Critical readiness bottleneck parts
  const bottleneckParts = spareParts.filter(p => p.isLimitingReadiness);

  // Assets blocked by spare parts
  const blockedAssets = assets.filter(a => a.status === 'AWAITING PARTS');

  const handleReceiveStock = (sku: string, qty: number) => {
    receiveSparePartStock(sku, qty);
    setNotification(`Successfully received ${qty} units of ${sku}. Depot inventory updated & affected vehicles unblocked.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleReorder = (sku: string, qty: number) => {
    reorderSparePart(sku, qty);
    setNotification(`Priority purchase order issued for ${qty}x ${sku}. Supply chain dispatch in progress.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredParts = spareParts.filter(p => {
    if (filterCategory !== 'ALL' && p.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xs uppercase tracking-widest font-semibold font-mono text-white flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[#EF4444]" />
            SPARE PARTS & SUSTAINMENT LOGISTICS
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            Depot inventory, supply chain lead times, parts constraining operational readiness, and automated replenishment.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-neutral-400">Inventory Health:</span>
          <span className="px-2.5 py-1 rounded bg-[#141417] border border-[#1F1F23] text-neutral-300">
            {spareParts.filter(p => p.onHand > 0).length} of {spareParts.length} Stocked
          </span>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Critical Bottleneck Banner */}
      {bottleneckParts.length > 0 && (
        <div className="glass-panel rounded-xl p-5 shadow-lg space-y-3 border border-[#EF4444]/40 bg-[#EF4444]/[0.03]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#EF4444] text-xs font-mono font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>CRITICAL FLEET READINESS BOTTLENECK DETECTED</span>
            </div>
            <span className="text-xs font-mono text-[#EF4444] font-bold">
              -4.0% FLEET READINESS PENALTY
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <p className="text-white text-sm font-semibold font-sans">
              Zero on-hand stock for High-Gain Communication Modules (COMM-MOD-V3) is currently immobilizing 2 autonomous vehicles:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {blockedAssets.map(a => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedAssetId(a.id);
                    setActiveNavTab('assets');
                  }}
                  className="px-3 py-1 bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 rounded-md hover:bg-[#EF4444]/30 transition-colors flex items-center gap-1.5"
                >
                  <span className="font-bold">{a.id}</span>
                  <span className="text-[10px] text-neutral-400">({a.location})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#EF4444]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-neutral-400 font-mono">
              Action: Receive incoming shipment (+2 units) to immediately unblock both vehicles and restore +4% Fleet Readiness.
            </div>

            <button
              onClick={() => handleReceiveStock('COMM-MOD-V3', 2)}
              className="px-4 py-2 bg-[#EF4444] hover:bg-orange-500 text-black font-bold text-xs font-mono rounded-md transition-colors flex items-center gap-2 shadow-md shadow-[#EF4444]/20 whitespace-nowrap self-end sm:self-auto"
            >
              <Truck className="w-4 h-4" />
              <span>RECEIVE SHIPMENT (+2 COMM-MOD-V3)</span>
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="glass-panel rounded-xl p-4 flex items-center justify-between font-mono text-xs border border-white/[0.08]">
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">Category:</span>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-[#141417] border border-[#1F1F23] rounded-md px-2.5 py-1.5 text-neutral-300 focus:outline-none focus:border-[#EF4444]/50"
          >
            <option value="ALL">All Categories</option>
            <option value="Communications">Communications</option>
            <option value="Sensors & Optics">Sensors & Optics</option>
            <option value="Compute & Avionics">Compute & Avionics</option>
            <option value="Powertrain & Drive">Powertrain & Drive</option>
            <option value="Thermal & Power">Thermal & Power</option>
          </select>
        </div>

        <span className="text-neutral-500 text-[11px]">
          Showing {filteredParts.length} catalog items
        </span>
      </div>

      {/* Spare Parts Inventory Table */}
      <div className="glass-panel rounded-xl shadow-sm overflow-hidden border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0D0D0F] text-neutral-400 uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Part Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">On Hand</th>
                <th className="py-3 px-4">Required Open</th>
                <th className="py-3 px-4">Incoming PO</th>
                <th className="py-3 px-4">Lead Time</th>
                <th className="py-3 px-4">Unit Cost</th>
                <th className="py-3 px-4">Readiness Status</th>
                <th className="py-3 px-4 text-right uppercase">Depot Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredParts.map(part => {
                const isCriticalStockout = part.onHand <= 0;
                const isBelowReorder = part.onHand <= part.reorderPoint;

                return (
                  <tr
                    key={part.id}
                    className={`row-hover transition-colors ${
                      isCriticalStockout ? 'bg-[#EF4444]/[0.03]' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-[#EF4444]">
                      {part.sku}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-white font-semibold">{part.partName}</div>
                      <div className="text-[10px] text-neutral-500">Compatible: {part.compatibleGenerations.join(', ')}</div>
                    </td>

                    <td className="py-3 px-4 text-neutral-300">
                      {part.category}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-sm font-bold ${
                        isCriticalStockout ? 'text-rose-400' :
                        isBelowReorder ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>
                        {part.onHand}
                      </span>
                      <span className="text-[10px] text-neutral-500 ml-1">
                        (min: {part.reorderPoint})
                      </span>
                    </td>

                    <td className="py-3 px-4 text-neutral-300">
                      {part.requiredForOpenMaintenance > 0 ? (
                        <span className="font-bold text-amber-400">
                          {part.requiredForOpenMaintenance}
                        </span>
                      ) : (
                        <span className="text-neutral-600">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-neutral-300">
                      {part.incoming > 0 ? (
                        <span className="text-sky-400 font-semibold">
                          +{part.incoming} units
                        </span>
                      ) : (
                        <span className="text-neutral-600">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-neutral-300">
                      {part.leadTimeDays} days
                    </td>

                    <td className="py-3 px-4 text-neutral-300">
                      ${part.unitCostUSD.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      {part.isLimitingReadiness ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/40 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-[#EF4444]" />
                          BLOCKING ASSETS
                        </span>
                      ) : isBelowReorder ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          REORDER DUE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          ADEQUATE
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleReceiveStock(part.sku, 2)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-emerald-500 hover:text-black text-emerald-400 rounded text-[10px] font-bold transition-colors border border-white/10"
                        title="Receive arrived parts shipment"
                      >
                        + Receive (2)
                      </button>
                      <button
                        onClick={() => handleReorder(part.sku, 5)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-[#EF4444] hover:text-black text-[#EF4444] rounded text-[10px] font-bold transition-colors border border-white/10"
                        title="Issue purchase order for +5 units"
                      >
                        Reorder (+5)
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
