import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Asset, 
  WorkOrder, 
  EquipmentFault, 
  SparePart, 
  FleetSummary, 
  ReadinessDriver,
  SoftwareVersion,
  WorkOrderStatus,
  FaultStatus,
  AssetStatus,
  DataMode
} from '../types';
import { 
  generateSeedAssets, 
  INITIAL_WORK_ORDERS, 
  INITIAL_FAULTS, 
  INITIAL_SPARE_PARTS 
} from '../data/seedData';

interface FleetContextType {
  mode: DataMode;
  setMode: (mode: DataMode) => void;
  isLoading: boolean;
  lastSyncTime: string | null;
  assets: Asset[];
  workOrders: WorkOrder[];
  faults: EquipmentFault[];
  spareParts: SparePart[];
  summary: FleetSummary;
  readinessDrivers: ReadinessDriver[];
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string | null) => void;
  activeNavTab: string;
  setActiveNavTab: (tab: string) => void;
  // Actions
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  addWorkOrder: (wo: Omit<WorkOrder, 'id' | 'openDate' | 'status'> & { status?: WorkOrderStatus }) => void;
  updateWorkOrderStatus: (woId: string, status: WorkOrderStatus, notes?: string) => void;
  addFault: (fault: Omit<EquipmentFault, 'id' | 'detectedDate' | 'status'> & { status?: FaultStatus }) => void;
  updateFaultStatus: (faultId: string, status: FaultStatus) => void;
  reorderSparePart: (sku: string, quantity: number) => void;
  receiveSparePartStock: (sku: string, quantity: number) => void;
  rolloutSoftwareVersion: (assetIds: string[], newVersion: SoftwareVersion) => void;
  logInspection: (assetId: string) => void;
  resetToFactorySeed: () => void;
  // Live Data & Ingestion
  refreshFleet: () => Promise<void>;
  clearLiveData: () => Promise<void>;
  loadSampleLiveData: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  ingestPayload: (payload: any, source?: string) => Promise<{ success: boolean; message: string; breakdown?: Record<string, number> }>;
  importCsvData: (type: string, csv: string) => Promise<{ success: boolean; message: string; importedCount?: number }>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

const STORAGE_KEY = 'sentinel_fleet_v2_store';
const MODE_STORAGE_KEY = 'sentinel_active_mode';

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Active operating mode: default to 'demo' so users can explore immediately, or load saved mode
  const [mode, setModeState] = useState<DataMode>(() => {
    try {
      const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
      if (savedMode === 'live' || savedMode === 'demo') return savedMode;
    } catch (e) {
      console.warn('Failed to parse mode', e);
    }
    return 'demo';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${mode}_assets`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved assets', e);
    }
    return mode === 'demo' ? generateSeedAssets() : [];
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${mode}_workorders`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved work orders', e);
    }
    return mode === 'demo' ? INITIAL_WORK_ORDERS : [];
  });

  const [faults, setFaults] = useState<EquipmentFault[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${mode}_faults`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved faults', e);
    }
    return mode === 'demo' ? INITIAL_FAULTS : [];
  });

  const [spareParts, setSpareParts] = useState<SparePart[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${mode}_spareparts`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved spare parts', e);
    }
    return mode === 'demo' ? INITIAL_SPARE_PARTS : [];
  });

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeNavTab, setActiveNavTab] = useState<string>('fleet-command');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const setMode = (newMode: DataMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, newMode);
    } catch (e) {
      console.error('Failed to store mode', e);
    }
  };

  // Synchronize from server API
  const refreshFleet = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/fleet?mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setWorkOrders(data.workOrders || []);
        setFaults(data.faults || []);
        setSpareParts(data.spareParts || []);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Server fleet sync offline or failed, falling back to local storage', err);
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  // Initial and mode-switch sync
  useEffect(() => {
    refreshFleet();
  }, [mode, refreshFleet]);

  // Real-Time Server-Sent Events (SSE) Stream Listener with Fallback
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        eventSource = new EventSource('/api/v1/stream');

        eventSource.onmessage = () => {
          // General event ping - trigger refresh
          refreshFleet();
        };

        eventSource.addEventListener('telemetry:ping', () => {
          refreshFleet();
        });

        eventSource.addEventListener('asset:upserted', () => {
          refreshFleet();
        });

        eventSource.addEventListener('fault:logged', () => {
          refreshFleet();
        });

        eventSource.addEventListener('work_order:updated', () => {
          refreshFleet();
        });

        eventSource.addEventListener('fleet:snapshot', () => {
          refreshFleet();
        });

        eventSource.onerror = () => {
          // SSE connection dropped, will automatically try to reconnect
        };
      } catch (e) {
        console.warn('SSE initialization failed, fallback active', e);
      }
    }

    // Periodic heartbeat sync in Live Mode to guarantee consistency
    if (mode === 'live') {
      fallbackInterval = setInterval(() => {
        refreshFleet();
      }, 15000);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [mode, refreshFleet]);

  // Persist to localStorage on state change as client cache
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${mode}_assets`, JSON.stringify(assets));
      localStorage.setItem(`${STORAGE_KEY}_${mode}_workorders`, JSON.stringify(workOrders));
      localStorage.setItem(`${STORAGE_KEY}_${mode}_faults`, JSON.stringify(faults));
      localStorage.setItem(`${STORAGE_KEY}_${mode}_spareparts`, JSON.stringify(spareParts));
    } catch (e) {
      console.error('Error storing fleet state', e);
    }
  }, [assets, workOrders, faults, spareParts, mode]);

  // Dynamically calculate summary metrics
  const summary: FleetSummary = useMemo(() => {
    const total = assets.length;
    if (total === 0) {
      return {
        fleetReadiness: 0,
        missionReady: 0,
        maintenance: 0,
        awaitingParts: 0,
        softwareBlocked: 0,
        inspectionDue: 0,
        criticalFaults: 0,
        totalAssets: 0,
        averageOperatingHours: 0,
      };
    }

    let readyCount = 0;
    let maintCount = 0;
    let awaitingPartsCount = 0;
    let swBlockedCount = 0;
    let inspectDueCount = 0;
    let totalReadinessSum = 0;
    let totalHours = 0;

    assets.forEach(a => {
      totalReadinessSum += a.missionReadiness || 0;
      totalHours += a.operatingHours || 0;

      if (a.status === 'MISSION READY') readyCount++;
      else if (a.status === 'MAINTENANCE') maintCount++;
      else if (a.status === 'AWAITING PARTS') awaitingPartsCount++;
      else if (a.status === 'SOFTWARE BLOCKED') swBlockedCount++;
      else if (a.status === 'INSPECTION DUE') inspectDueCount++;
    });

    const activeCriticalFaults = faults.filter(
      f => f.severity === 'Critical' && (f.status === 'Active' || f.status === 'Under Repair')
    ).length;

    const fleetReadiness = Math.round(totalReadinessSum / total);

    return {
      fleetReadiness,
      missionReady: readyCount,
      maintenance: maintCount,
      awaitingParts: awaitingPartsCount,
      softwareBlocked: swBlockedCount,
      inspectionDue: inspectDueCount,
      criticalFaults: activeCriticalFaults,
      totalAssets: total,
      averageOperatingHours: Math.round(totalHours / total),
    };
  }, [assets, faults]);

  // Calculate top readiness drivers
  const readinessDrivers: ReadinessDriver[] = useMemo(() => {
    const drivers: ReadinessDriver[] = [];
    if (assets.length === 0) return drivers;

    // Driver 1: Maintenance
    const maintAssets = assets.filter(a => a.status === 'MAINTENANCE');
    if (maintAssets.length > 0) {
      drivers.push({
        id: 'driver-maint',
        title: `${maintAssets.length} asset(s) undergoing maintenance or depot overhaul`,
        impactPercent: Number(((maintAssets.length / assets.length) * 100 * 0.45).toFixed(1)),
        severity: 'high',
        affectedAssetCount: maintAssets.length,
        affectedAssetIds: maintAssets.map(a => a.id),
        description: 'Vehicles actively in maintenance bays undergoing corrective repair, calibration, or component overhaul.',
        recommendedAction: 'Expedite technician shift coverage on open work orders.',
        category: 'maintenance',
      });
    }

    // Driver 2: Awaiting Parts
    const partsBlocked = assets.filter(a => a.status === 'AWAITING PARTS' || (a.requiredSpareParts && a.requiredSpareParts.length > 0 && a.status === 'LIMITED'));
    if (partsBlocked.length > 0) {
      drivers.push({
        id: 'driver-parts',
        title: `${partsBlocked.length} vehicle(s) awaiting critical spare parts`,
        impactPercent: Number(((partsBlocked.length / assets.length) * 100 * 0.4).toFixed(1)),
        severity: 'critical',
        affectedAssetCount: partsBlocked.length,
        affectedAssetIds: partsBlocked.map(a => a.id),
        description: 'Zero on-hand stock or pending delivery for critical components is immobilizing assets.',
        recommendedAction: 'Authorize emergency courier dispatch or expedite pending purchase orders.',
        category: 'supply_chain',
      });
    }

    // Driver 3: Software 4.7.0 Faults
    const sw47Assets = assets.filter(a => (a.softwareVersion === '4.7.0' || a.status === 'SOFTWARE BLOCKED') && (a.openFaultsCount > 0 || a.status === 'SOFTWARE BLOCKED'));
    if (sw47Assets.length > 0) {
      drivers.push({
        id: 'driver-sw',
        title: `${sw47Assets.length} vehicle(s) experiencing firmware instability or communication faults`,
        impactPercent: Number(((sw47Assets.length / assets.length) * 100 * 0.35).toFixed(1)),
        severity: 'high',
        affectedAssetCount: sw47Assets.length,
        affectedAssetIds: sw47Assets.map(a => a.id),
        description: 'Firmware anomalies or mesh socket packet drops detected under multi-agent synchronization.',
        recommendedAction: 'Stage and authorize fleet-wide OTA firmware migration to stable release.',
        category: 'software',
      });
    }

    // Driver 4: Inspection Due
    const inspectionDueAssets = assets.filter(a => a.nextInspectionHours <= 15 || a.status === 'INSPECTION DUE');
    if (inspectionDueAssets.length > 0) {
      drivers.push({
        id: 'driver-inspection',
        title: `${inspectionDueAssets.length} asset(s) approaching mandatory inspection limit`,
        impactPercent: 1.5,
        severity: 'medium',
        affectedAssetCount: inspectionDueAssets.length,
        affectedAssetIds: inspectionDueAssets.map(a => a.id),
        description: 'Mandatory structural certification, interlock, and drivetrain certification expires at 0 operating hours.',
        recommendedAction: 'Dispatch field inspection team to certify units before automatic lockout occurs.',
        category: 'inspection',
      });
    }

    return drivers;
  }, [assets]);

  // Actions
  const updateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(asset => {
      if (asset.id !== id) return asset;
      const updated = { ...asset, ...updates };
      if (updates.status) {
        if (updates.status === 'MISSION READY' && updated.missionReadiness < 85) {
          updated.missionReadiness = 92;
        } else if (updates.status === 'MAINTENANCE' && updated.missionReadiness > 60) {
          updated.missionReadiness = 48;
        } else if (updates.status === 'AWAITING PARTS' && updated.missionReadiness > 55) {
          updated.missionReadiness = 45;
        } else if (updates.status === 'SOFTWARE BLOCKED' && updated.missionReadiness > 65) {
          updated.missionReadiness = 50;
        }
      }
      return updated;
    }));
  };

  const addWorkOrder = (woData: Omit<WorkOrder, 'id' | 'openDate' | 'status'> & { status?: WorkOrderStatus }) => {
    const newId = `WO-${Math.floor(8840 + Math.random() * 1000)}`;
    const today = new Date().toISOString().split('T')[0];
    const newWorkOrder: WorkOrder = {
      id: newId,
      assetId: woData.assetId,
      issue: woData.issue,
      maintenanceType: woData.maintenanceType,
      priority: woData.priority,
      technician: woData.technician,
      openDate: today,
      requiredParts: woData.requiredParts || [],
      estimatedCompletion: woData.estimatedCompletion || `${today} (18:00)`,
      status: woData.status || 'In Progress',
      notes: woData.notes,
    };

    setWorkOrders(prev => [newWorkOrder, ...prev]);

    setAssets(prev => prev.map(a => {
      if (a.id !== woData.assetId) return a;
      return {
        ...a,
        status: 'MAINTENANCE',
        maintenanceStatus: `Active Depot Work Order ${newId}: ${woData.issue}`,
        missionReadiness: Math.min(a.missionReadiness, 50),
        timelineEvents: [
          {
            id: `EVT-${Date.now()}`,
            date: `${today} 09:30`,
            title: `Work Order ${newId} Created`,
            type: 'maintenance',
            description: `${woData.issue} (${woData.maintenanceType}) assigned to ${woData.technician}.`,
            technicianOrSource: woData.technician,
          },
          ...a.timelineEvents,
        ],
      };
    }));
  };

  const updateWorkOrderStatus = (woId: string, newStatus: WorkOrderStatus, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    let affectedAssetId: string | null = null;

    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== woId) return wo;
      affectedAssetId = wo.assetId;
      return {
        ...wo,
        status: newStatus,
        notes: notes ? `${wo.notes || ''} [Update: ${notes}]` : wo.notes,
        completedDate: newStatus === 'Completed' ? today : wo.completedDate,
      };
    }));

    if (newStatus === 'Completed' && affectedAssetId) {
      const assetId = affectedAssetId;
      setAssets(prev => prev.map(a => {
        if (a.id !== assetId) return a;
        return {
          ...a,
          status: 'MISSION READY',
          maintenanceStatus: 'Nominal — Maintenance Completed & Returned to Service',
          missionReadiness: Math.max(a.missionReadiness, 94),
          timelineEvents: [
            {
              id: `EVT-${Date.now()}`,
              date: `${today} 16:30`,
              title: `Work Order ${woId} Completed`,
              type: 'maintenance',
              description: 'Depot maintenance completed. Systems certified for active deployment.',
              technicianOrSource: 'Depot Quality Control',
            },
            ...a.timelineEvents,
          ],
        };
      }));
    }
  };

  const addFault = (faultData: Omit<EquipmentFault, 'id' | 'detectedDate' | 'status'> & { status?: FaultStatus }) => {
    const newId = `FLT-${Math.floor(4100 + Math.random() * 1000)}`;
    const today = new Date().toISOString().split('T')[0];
    const newFault: EquipmentFault = {
      id: newId,
      assetId: faultData.assetId,
      severity: faultData.severity,
      detectedDate: today,
      system: faultData.system,
      description: faultData.description,
      operationalImpact: faultData.operationalImpact,
      status: faultData.status || 'Active',
      owner: faultData.owner,
    };

    setFaults(prev => [newFault, ...prev]);

    setAssets(prev => prev.map(a => {
      if (a.id !== faultData.assetId) return a;
      const penalty = faultData.severity === 'Critical' ? 35 : (faultData.severity === 'Moderate' ? 18 : 6);
      const newReadiness = Math.max(25, a.missionReadiness - penalty);
      let newStatus = a.status;
      if (faultData.severity === 'Critical') {
        newStatus = 'CRITICAL FAULT';
      } else if (a.status === 'MISSION READY') {
        newStatus = 'LIMITED';
      }

      return {
        ...a,
        status: newStatus,
        openFaultsCount: a.openFaultsCount + 1,
        missionReadiness: newReadiness,
        timelineEvents: [
          {
            id: `EVT-${Date.now()}`,
            date: `${today} 10:00`,
            title: `Fault ${newId} Detected (${faultData.severity})`,
            type: 'fault',
            description: `${faultData.description}. System: ${faultData.system}.`,
            technicianOrSource: faultData.owner,
          },
          ...a.timelineEvents,
        ],
      };
    }));
  };

  const updateFaultStatus = (faultId: string, newStatus: FaultStatus) => {
    setFaults(prev => prev.map(f => {
      if (f.id !== faultId) return f;
      return { ...f, status: newStatus };
    }));
  };

  const reorderSparePart = (sku: string, quantity: number) => {
    setSpareParts(prev => prev.map(p => {
      if (p.sku !== sku) return p;
      return {
        ...p,
        incoming: p.incoming + quantity,
      };
    }));
  };

  const receiveSparePartStock = (sku: string, quantity: number) => {
    setSpareParts(prev => prev.map(p => {
      if (p.sku !== sku) return p;
      const newOnHand = p.onHand + quantity;
      const newIncoming = Math.max(0, p.incoming - quantity);
      return {
        ...p,
        onHand: newOnHand,
        incoming: newIncoming,
        isLimitingReadiness: newOnHand < p.requiredForOpenMaintenance,
      };
    }));
  };

  const rolloutSoftwareVersion = (assetIds: string[], newVersion: SoftwareVersion) => {
    const today = new Date().toISOString().split('T')[0];
    setAssets(prev => prev.map(a => {
      if (!assetIds.includes(a.id)) return a;
      return {
        ...a,
        softwareVersion: newVersion,
        status: a.status === 'SOFTWARE BLOCKED' ? 'MISSION READY' : a.status,
        missionReadiness: Math.max(a.missionReadiness, 90),
        softwareHistory: [
          {
            version: newVersion,
            installedDate: today,
            installedBy: 'OTA Staged Fleet Deployment',
            notes: 'Batch OTA deployment via Configuration Manager.',
          },
          ...a.softwareHistory,
        ],
        timelineEvents: [
          {
            id: `EVT-${Date.now()}`,
            date: `${today} 12:00`,
            title: `OTA Firmware Rollout to v${newVersion}`,
            type: 'software',
            description: `Target software upgraded to v${newVersion}. Checksums verified.`,
            technicianOrSource: 'SENTINEL OTA Service',
          },
          ...a.timelineEvents,
        ],
      };
    }));
  };

  const logInspection = (assetId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setAssets(prev => prev.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        status: a.status === 'INSPECTION DUE' ? 'MISSION READY' : a.status,
        missionReadiness: Math.max(a.missionReadiness, 92),
        lastInspectionDate: today,
        lastInspectionHours: a.operatingHours,
        nextInspectionHours: 200,
        timelineEvents: [
          {
            id: `EVT-${Date.now()}`,
            date: `${today} 14:00`,
            title: 'Field Inspection Certified',
            type: 'inspection',
            description: 'Comprehensive mechanical, safety interlock, and sensor inspection passed.',
            technicianOrSource: 'Chief Certifier',
          },
          ...a.timelineEvents,
        ],
      };
    }));
  };

  const resetToFactorySeed = () => {
    if (mode === 'demo') {
      resetDemoData();
    } else {
      clearLiveData();
    }
  };

  // Live Data Ingestion & Management APIs
  const clearLiveData = async () => {
    try {
      await fetch('/api/fleet/clear-live', { method: 'POST' });
      setAssets([]);
      setWorkOrders([]);
      setFaults([]);
      setSpareParts([]);
      setSelectedAssetId(null);
      localStorage.removeItem(`${STORAGE_KEY}_live_assets`);
      localStorage.removeItem(`${STORAGE_KEY}_live_workorders`);
      localStorage.removeItem(`${STORAGE_KEY}_live_faults`);
      localStorage.removeItem(`${STORAGE_KEY}_live_spareparts`);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to clear live data:', err);
    }
  };

  const loadSampleLiveData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/fleet/sample-live', { method: 'POST' });
      if (res.ok) {
        await refreshFleet();
      }
    } catch (err) {
      console.error('Failed to load sample live data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetDemoData = async () => {
    try {
      setIsLoading(true);
      await fetch('/api/fleet/reset-demo', { method: 'POST' });
      localStorage.removeItem(`${STORAGE_KEY}_demo_assets`);
      localStorage.removeItem(`${STORAGE_KEY}_demo_workorders`);
      localStorage.removeItem(`${STORAGE_KEY}_demo_faults`);
      localStorage.removeItem(`${STORAGE_KEY}_demo_spareparts`);
      setAssets(generateSeedAssets());
      setWorkOrders(INITIAL_WORK_ORDERS);
      setFaults(INITIAL_FAULTS);
      setSpareParts(INITIAL_SPARE_PARTS);
      setSelectedAssetId(null);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to reset demo data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const ingestPayload = async (payload: any, source: string = 'UI Ingest Console') => {
    try {
      const res = await fetch('/api/v1/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': source,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        if (mode !== 'live') {
          setMode('live');
        }
        await refreshFleet();
        return { success: true, message: data.message, breakdown: data.breakdown };
      }
      return { success: false, message: data.error || 'Ingestion failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during ingestion' };
    }
  };

  const importCsvData = async (type: string, csv: string) => {
    try {
      const res = await fetch('/api/v1/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, csv }),
      });
      const data = await res.json();
      if (data.success) {
        if (mode !== 'live') {
          setMode('live');
        }
        await refreshFleet();
        return { success: true, message: data.message, importedCount: data.importedCount };
      }
      return { success: false, message: data.error || 'CSV import failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during CSV import' };
    }
  };

  return (
    <FleetContext.Provider
      value={{
        mode,
        setMode,
        isLoading,
        lastSyncTime,
        assets,
        workOrders,
        faults,
        spareParts,
        summary,
        readinessDrivers,
        selectedAssetId,
        setSelectedAssetId,
        activeNavTab,
        setActiveNavTab,
        updateAsset,
        addWorkOrder,
        updateWorkOrderStatus,
        addFault,
        updateFaultStatus,
        reorderSparePart,
        receiveSparePartStock,
        rolloutSoftwareVersion,
        logInspection,
        resetToFactorySeed,
        refreshFleet,
        clearLiveData,
        loadSampleLiveData,
        resetDemoData,
        ingestPayload,
        importCsvData,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
