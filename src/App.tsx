/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FleetProvider, useFleet } from './context/FleetContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { FleetCommandView } from './components/FleetCommand/FleetCommandView';
import { AssetTableView } from './components/Assets/AssetTableView';
import { AssetDetailView } from './components/AssetDetail/AssetDetailView';
import { MaintenanceView } from './components/Maintenance/MaintenanceView';
import { FaultManagementView } from './components/Faults/FaultManagementView';
import { ConfigurationView } from './components/Configuration/ConfigurationView';
import { SparePartsView } from './components/SpareParts/SparePartsView';
import { ReadinessIntelligenceView } from './components/ReadinessIntelligence/ReadinessIntelligenceView';
import { Shield } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeNavTab, selectedAssetId } = useFleet();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {activeNavTab === 'fleet-command' && <FleetCommandView />}
      
      {activeNavTab === 'assets' && (
        selectedAssetId ? <AssetDetailView /> : <AssetTableView />
      )}

      {activeNavTab === 'maintenance' && <MaintenanceView />}
      {activeNavTab === 'faults' && <FaultManagementView />}
      {activeNavTab === 'configuration' && <ConfigurationView />}
      {activeNavTab === 'spare-parts' && <SparePartsView />}
      {activeNavTab === 'readiness-intelligence' && <ReadinessIntelligenceView />}
    </main>
  );
};

export default function App() {
  return (
    <FleetProvider>
      <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E0] flex flex-col selection:bg-[#F27D26] selection:text-black">
        <Header />
        <Navigation />
        
        <div className="flex-1">
          <MainContent />
        </div>

        {/* Operational Footer with Compliance & Synthetic Data Disclosure */}
        <footer className="border-t border-[#1F1F23] bg-[#0D0D0F] py-4 px-4 sm:px-6 lg:px-8 text-xs font-mono text-neutral-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-[#F27D26] rounded-xs rotate-45 shrink-0"></div>
              <span>SENTINEL Operations Platform • Autonomous Ground Fleet Readiness Engine</span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Synthetic Data Only • Non-Combatant Sustainment & Logistics Model
            </div>
          </div>
        </footer>
      </div>
    </FleetProvider>
  );
}
