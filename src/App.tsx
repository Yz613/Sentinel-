/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FleetProvider, useFleet } from './context/FleetContext';
import { Header } from './components/Header';
import { DemoBanner } from './components/DemoBanner';
import { Navigation } from './components/Navigation';
import { FleetCommandView } from './components/FleetCommand/FleetCommandView';
import { AssetTableView } from './components/Assets/AssetTableView';
import { AssetDetailView } from './components/AssetDetail/AssetDetailView';
import { DataSourcesView } from './components/DataSources/DataSourcesView';
import { MaintenanceView } from './components/Maintenance/MaintenanceView';
import { FaultManagementView } from './components/Faults/FaultManagementView';
import { ConfigurationView } from './components/Configuration/ConfigurationView';
import { SparePartsView } from './components/SpareParts/SparePartsView';
import { ReadinessIntelligenceView } from './components/ReadinessIntelligence/ReadinessIntelligenceView';

const MainContent: React.FC = () => {
  const { activeNavTab, selectedAssetId } = useFleet();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {activeNavTab === 'fleet-command' && <FleetCommandView />}
      
      {activeNavTab === 'assets' && (
        selectedAssetId ? <AssetDetailView /> : <AssetTableView />
      )}

      {activeNavTab === 'data-sources' && <DataSourcesView />}
      {activeNavTab === 'maintenance' && <MaintenanceView />}
      {activeNavTab === 'faults' && <FaultManagementView />}
      {activeNavTab === 'configuration' && <ConfigurationView />}
      {activeNavTab === 'spare-parts' && <SparePartsView />}
      {activeNavTab === 'readiness-intelligence' && <ReadinessIntelligenceView />}
    </main>
  );
};

const FooterContent: React.FC = () => {
  const { mode, assets } = useFleet();
  return (
    <footer className="border-t border-[#1F1F23] bg-[#0D0D0F] py-4 px-4 sm:px-6 lg:px-8 text-xs font-mono text-neutral-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#F27D26] rounded-xs rotate-45 shrink-0"></div>
          <span>SENTINEL Operations Platform • Autonomous Ground Fleet Readiness Engine</span>
        </div>
        <div className="text-[11px] text-neutral-400 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-400' : 'bg-[#F27D26]'}`}></span>
          <span>{mode === 'live' ? `Live Telemetry Pipeline (${assets.length} Assets)` : 'Demo Sandbox (50 Synthetic Vehicles)'}</span>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <FleetProvider>
      <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E0] flex flex-col selection:bg-[#F27D26] selection:text-black">
        <Header />
        <DemoBanner />
        <Navigation />
        
        <div className="flex-1">
          <MainContent />
        </div>

        <FooterContent />
      </div>
    </FleetProvider>
  );
}
