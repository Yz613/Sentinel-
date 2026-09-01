import React, { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { 
  Cpu, 
  RefreshCw, 
  AlertTriangle, 
  Zap,
} from 'lucide-react';
import { HardwareGen, SoftwareVersion } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export const ConfigurationView: React.FC = () => {
  const { 
    assets, 
    faults, 
    rolloutSoftwareVersion, 
    setSelectedAssetId, 
    setActiveNavTab 
  } = useFleet();

  const [selectedHw, setSelectedHw] = useState<string>('ALL');
  const [selectedSw, setSelectedSw] = useState<string>('ALL');
  const [isRolloutInProgress, setIsRolloutInProgress] = useState(false);
  const [rolloutMessage, setRolloutMessage] = useState<string | null>(null);

  // Matrix calculation
  const hwList: HardwareGen[] = ['Gen 2', 'Gen 2.5', 'Gen 3'];
  const swList: SoftwareVersion[] = ['4.6.1', '4.7.0', '4.8.2', '4.9 Beta'];

  const matrix = useMemo(() => {
    const data: Record<HardwareGen, Record<SoftwareVersion, number>> = {
      'Gen 2': { '4.6.1': 0, '4.7.0': 0, '4.8.2': 0, '4.9 Beta': 0 },
      'Gen 2.5': { '4.6.1': 0, '4.7.0': 0, '4.8.2': 0, '4.9 Beta': 0 },
      'Gen 3': { '4.6.1': 0, '4.7.0': 0, '4.8.2': 0, '4.9 Beta': 0 },
    };

    assets.forEach(a => {
      if (data[a.hardwareVersion] && data[a.hardwareVersion][a.softwareVersion] !== undefined) {
        data[a.hardwareVersion][a.softwareVersion] += 1;
      }
    });

    return data;
  }, [assets]);

  // Software fault correlation analytics
  const swFaultCorrelation = useMemo(() => {
    const swStats: Record<string, { totalAssets: number; totalFaults: number; commFaults: number; avgReadiness: number }> = {};
    swList.forEach(v => {
      swStats[v] = { totalAssets: 0, totalFaults: 0, commFaults: 0, avgReadiness: 0 };
    });

    assets.forEach(a => {
      if (swStats[a.softwareVersion]) {
        swStats[a.softwareVersion].totalAssets += 1;
        swStats[a.softwareVersion].avgReadiness += a.missionReadiness;
      }
    });

    faults.forEach(f => {
      const asset = assets.find(a => a.id === f.assetId);
      if (asset && swStats[asset.softwareVersion]) {
        swStats[asset.softwareVersion].totalFaults += 1;
        if (f.system === 'Communications') {
          swStats[asset.softwareVersion].commFaults += 1;
        }
      }
    });

    return swList.map(v => {
      const s = swStats[v];
      return {
        version: `v${v}`,
        fullVersion: v,
        totalAssets: s.totalAssets,
        faultRatePerAsset: s.totalAssets > 0 ? parseFloat((s.totalFaults / s.totalAssets).toFixed(2)) : 0,
        commFaults: s.commFaults,
        avgReadiness: s.totalAssets > 0 ? Math.round(s.avgReadiness / s.totalAssets) : 0,
      };
    });
  }, [assets, faults]);

  // Filtered Assets list
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      if (selectedHw !== 'ALL' && a.hardwareVersion !== selectedHw) return false;
      if (selectedSw !== 'ALL' && a.softwareVersion !== selectedSw) return false;
      return true;
    });
  }, [assets, selectedHw, selectedSw]);

  // Assets eligible for 4.7.0 -> 4.8.2 migration
  const assetsOnLegacy = assets.filter(a => a.softwareVersion === '4.7.0');

  const handleBatchRollout = (targetSw: SoftwareVersion, filterVersion?: SoftwareVersion) => {
    const targetAssetIds = assets
      .filter(a => (filterVersion ? a.softwareVersion === filterVersion : true) && a.softwareVersion !== targetSw)
      .map(a => a.id);

    if (targetAssetIds.length === 0) {
      setRolloutMessage('No candidate assets found for OTA campaign.');
      return;
    }

    setIsRolloutInProgress(true);
    setRolloutMessage(`Flashing ${targetAssetIds.length} assets to Firmware v${targetSw}...`);

    setTimeout(() => {
      rolloutSoftwareVersion(targetAssetIds, targetSw);
      setIsRolloutInProgress(false);
      setRolloutMessage(`Successfully deployed v${targetSw} across ${targetAssetIds.length} assets! Telemetry stabilized.`);
      setTimeout(() => setRolloutMessage(null), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xs uppercase tracking-widest font-semibold font-mono text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            CONFIGURATION MANAGEMENT & TELEMETRY CORRELATIONS
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            Hardware generation matrix, software release distributions, and telemetry-correlated failure analytics.
          </p>
        </div>

        <button
          onClick={() => handleBatchRollout('4.8.2', '4.7.0')}
          disabled={assetsOnLegacy.length === 0 || isRolloutInProgress}
          className={`px-4 py-2.5 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-md shadow-purple-600/10 ${
            assetsOnLegacy.length > 0 && !isRolloutInProgress
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : 'bg-white/5 text-neutral-600 cursor-not-allowed border border-white/5'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>REMEDIATE v4.7.0 ({assetsOnLegacy.length} Assets)</span>
        </button>
      </div>

      {rolloutMessage && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs font-mono text-purple-200 flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 text-purple-400 ${isRolloutInProgress ? 'animate-spin' : ''}`} />
          <span>{rolloutMessage}</span>
        </div>
      )}

      {/* Correlation Insight Callout Card */}
      <div className="glass-panel rounded-xl p-5 shadow-sm space-y-3 border border-white/[0.08]">
        <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>SYNTHETIC TELEMETRY CORRELATION FINDINGS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-white/[0.02] border border-purple-500/30 rounded-lg space-y-1">
            <div className="font-bold text-purple-300">Software v4.7.0 Anomaly</div>
            <p className="text-neutral-300 text-[11px] leading-relaxed font-sans">
              Assets running <strong>v4.7.0</strong> exhibit <strong>80% higher communication faults</strong> due to socket buffer overflow under high mesh traffic.
            </p>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-1">
            <div className="font-bold text-amber-300">Gen 2 Hardware Thermal Drag</div>
            <p className="text-neutral-300 text-[11px] leading-relaxed font-sans">
              Gen 2 compute enclosures running heavy vision inference on v4.8.2 show 14% higher thermal throttling warnings in desert sectors.
            </p>
          </div>

          <div className="p-3 bg-white/[0.02] border border-emerald-500/30 rounded-lg space-y-1">
            <div className="font-bold text-emerald-300">Gen 3 + v4.8.2 Peak Readiness</div>
            <p className="text-neutral-300 text-[11px] leading-relaxed font-sans">
              Gen 3 platforms running v4.8.2 demonstrate the highest operational availability at <strong>91.4% Mission Ready</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Hardware vs Software Distribution Matrix & Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hardware x Software Matrix (Left 6 cols) */}
        <div className="lg:col-span-6 glass-panel rounded-xl p-5 shadow-sm space-y-4 border border-white/[0.08]">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                HARDWARE VS SOFTWARE MATRIX
              </h3>
              <p className="text-xs text-neutral-400 font-sans">Cross-distribution of 50 active assets</p>
            </div>
            <span className="text-xs font-mono text-[#F27D26]">Total: 50</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono">
              <thead className="bg-[#0D0D0F] text-neutral-400 border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3 text-left">Hardware Gen</th>
                  <th className="py-2.5 px-3">v4.6.1</th>
                  <th className="py-2.5 px-3 text-purple-400">v4.7.0 (!)</th>
                  <th className="py-2.5 px-3 text-emerald-400">v4.8.2</th>
                  <th className="py-2.5 px-3 text-sky-400">v4.9 Beta</th>
                  <th className="py-2.5 px-3 font-bold text-white">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {hwList.map(hw => {
                  const rowSum = swList.reduce((acc, sw) => acc + matrix[hw][sw], 0);
                  return (
                    <tr key={hw} className="row-hover transition-colors">
                      <td className="py-3 px-3 text-left font-bold text-white">{hw}</td>
                      {swList.map(sw => {
                        const count = matrix[hw][sw];
                        return (
                          <td key={sw} className="py-3 px-3">
                            <button
                              onClick={() => {
                                setSelectedHw(hw);
                                setSelectedSw(sw);
                              }}
                              className={`w-8 h-8 rounded-md font-mono font-bold text-xs inline-flex items-center justify-center transition-colors ${
                                count === 0
                                  ? 'text-neutral-600 bg-transparent'
                                  : sw === '4.7.0'
                                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/40 hover:bg-purple-500/25'
                                  : sw === '4.8.2'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25'
                                  : 'bg-white/5 text-neutral-200 border border-white/10 hover:bg-white/10'
                              }`}
                            >
                              {count}
                            </button>
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 font-bold text-[#F27D26]">
                        {rowSum}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-neutral-500 font-mono italic">
            Tip: Click any cell count above to filter the asset matrix below.
          </p>
        </div>

        {/* Software Correlation Bar Chart (Right 6 cols) */}
        <div className="lg:col-span-6 glass-panel rounded-xl p-5 shadow-sm space-y-4 border border-white/[0.08]">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                SOFTWARE FAULT RATE & READINESS
              </h3>
              <p className="text-xs text-neutral-400 font-sans">Mean readiness % vs faults per asset by firmware release</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={swFaultCorrelation} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="version" stroke="#52525b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#52525b" fontSize={11} domain={[0, 100]} fontFamily="monospace" unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D0D0F', borderColor: '#1F1F23', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#E0E0E0' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} />
                <Bar dataKey="avgReadiness" fill="#22c55e" name="Readiness %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="commFaults" fill="#ef4444" name="Comm Faults" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fleet Filtered by Configuration */}
      <div className="glass-panel rounded-xl p-5 shadow-sm space-y-4 border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
              FILTERED FLEET SUBSET ({filteredAssets.length} ASSETS)
            </h3>
            <p className="text-xs text-neutral-400 font-sans">
              Showing assets matching HW: <strong className="text-white">{selectedHw}</strong> and SW: <strong className="text-white">{selectedSw}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => {
                setSelectedHw('ALL');
                setSelectedSw('ALL');
              }}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 rounded border border-white/10"
            >
              Reset Filters
            </button>

            {selectedSw !== 'ALL' && (
              <button
                onClick={() => handleBatchRollout('4.8.2', selectedSw as SoftwareVersion)}
                disabled={isRolloutInProgress}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold"
              >
                Migrate Filtered to v4.8.2
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 font-mono text-xs">
          {filteredAssets.map(asset => (
            <button
              key={asset.id}
              onClick={() => {
                setSelectedAssetId(asset.id);
                setActiveNavTab('assets');
              }}
              className="p-2.5 bg-white/[0.02] hover:bg-[#F27D26]/[0.05] border border-white/5 hover:border-[#F27D26]/30 rounded-lg text-left transition-colors space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white hover:text-[#F27D26]">{asset.id}</span>
                <span className={`text-[10px] ${asset.missionReadiness >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {asset.missionReadiness}%
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 truncate">{asset.hardwareVersion}</div>
              <div className={`text-[10px] font-semibold ${
                asset.softwareVersion === '4.7.0' ? 'text-purple-400' : 'text-neutral-400'
              }`}>
                v{asset.softwareVersion}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
