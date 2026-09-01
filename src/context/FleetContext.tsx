import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  AssetStatus
} from '../types';
import { 
  generateSeedAssets, 
  INITIAL_WORK_ORDERS, 
  INITIAL_FAULTS, 
  INITIAL_SPARE_PARTS 
} from '../data/seedData';

interface FleetContextType {
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
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

const STORAGE_KEY = 'sentinel_fleet_v1_store';

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_assets`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved assets', e);
    }
    return generateSeedAssets();
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_workorders`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved work orders', e);
    }
    return INITIAL_WORK_ORDERS;
  });

  const [faults, setFaults] = useState<EquipmentFault[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_faults`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved faults', e);
    }
    return INITIAL_FAULTS;
  });

  const [spareParts, setSpareParts] = useState<SparePart[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_spareparts`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved spare parts', e);
    }
    return INITIAL_SPARE_PARTS;
  });

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeNavTab, setActiveNavTab] = useState<string>('fleet-command');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_assets`, JSON.stringify(assets));
      localStorage.setItem(`${STORAGE_KEY}_workorders`, JSON.stringify(workOrders));
      localStorage.setItem(`${STORAGE_KEY}_faults`, JSON.stringify(faults));
      localStorage.setItem(`${STORAGE_KEY}_spareparts`, JSON.stringify(spareParts));
    } catch (e) {
      console.error('Error storing fleet state', e);
    }
  }, [assets, workOrders, faults, spareParts]);

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
      totalReadinessSum += a.missionReadiness;
      totalHours += a.operatingHours;

      if (a.status === 'MISSION READY') readyCount++;
      else if (a.status === 'MAINTENANCE') maintCount++;
      else if (a.status === 'AWAITING PARTS') awaitingPartsCount++;
      else if (a.status === 'SOFTWARE BLOCKED') swBlockedCount++;
      else if (a.status === 'INSPECTION DUE') inspectDueCount++;
      else if (a.status === 'LIMITED') {
        // Limited assets contribute to readiness score directly
      }
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

    // Driver 1: Maintenance
    const maintAssets = assets.filter(a => a.status === 'MAINTENANCE');
    if (maintAssets.length > 0) {
      drivers.push({
        id: 'driver-maint',
        title: `${maintAssets.length} assets undergoing scheduled and unscheduled maintenance`,
        impactPercent: Number(((maintAssets.length / assets.length) * 100 * 0.45).toFixed(1)),
        severity: 'high',
        affectedAssetCount: maintAssets.length,
        affectedAssetIds: maintAssets.map(a => a.id),
        description: 'Vehicles actively in depot bays for powertrain overhauls, actuator calibration, and thermal valve repair.',
        recommendedAction: 'Expedite technician shift coverage on WO-8821 and WO-8827.',
        category: 'maintenance',
      });
    }

    // Driver 2: Awaiting Parts
    const partsBlocked = assets.filter(a => a.status === 'AWAITING PARTS' || (a.requiredSpareParts && a.requiredSpareParts.length > 0 && a.status === 'LIMITED'));
    if (partsBlocked.length > 0) {
      drivers.push({
        id: 'driver-parts',
        title: `${partsBlocked.length} vehicles awaiting critical communication & sensor modules`,
        impactPercent: Number(((partsBlocked.length / assets.length) * 100 * 0.4).toFixed(1)),
        severity: 'critical',
        affectedAssetCount: partsBlocked.length,
        affectedAssetIds: partsBlocked.map(a => a.id),
        description: 'Zero on-hand stock for COMM-MOD-V3 Tactical Mesh Transceivers is currently holding back fleet return-to-service.',
        recommendedAction: 'Expedite incoming rush freight shipment (5 units incoming with 3-day lead time).',
        category: 'supply_chain',
      });
    }

    // Driver 3: Software 4.7.0 Faults
    const sw47Assets = assets.filter(a => a.softwareVersion === '4.7.0' && (a.status === 'SOFTWARE BLOCKED' || a.openFaultsCount > 0));
    if (sw47Assets.length > 0) {
      drivers.push({
        id: 'driver-sw',
        title: `${sw47Assets.length} vehicles experiencing software 4.7.0 packet degradation faults`,
        impactPercent: Number(((sw47Assets.length / assets.length) * 100 * 0.35).toFixed(1)),
        severity: 'high',
        affectedAssetCount: sw47Assets.length,
        affectedAssetIds: sw47Assets.map(a => a.id),
        description: 'Firmware 4.7.0 contains a known socket buffer memory leak under multi-agent mesh synchronization.',
        recommendedAction: 'Authorize fleet-wide OTA firmware migration to verified stable release 4.8.2.',
        category: 'software',
      });
    }

    // Driver 4: Inspection Due
    const inspectionDueAssets = assets.filter(a => a.nextInspectionHours <= 15 || a.status === 'INSPECTION DUE');
    if (inspectionDueAssets.length > 0) {
      drivers.push({
        id: 'driver-inspection',
        title: `${inspectionDueAssets.length} asset(s) approaching mandatory operating hour inspection limit`,
        impactPercent: 1.5,
        severity: 'medium',
        affectedAssetCount: inspectionDueAssets.length,
        affectedAssetIds: inspectionDueAssets.map(a => a.id),
        description: 'Mandatory structural, safety interlock, and drivetrain certification expires at 0 operating hours.',
        recommendedAction: 'Dispatch field inspection team to FOB Alpha to certify MRD-022 before lockout occurs.',
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
      // Recalculate readiness score automatically if status changed
      if (updates.status) {
        if (updates.status === 'MISSION READY' && updated.missionReadiness < 85) {
          updated.missionReadiness = 92;
        } else if (updates.status === 'MAINTENANCE' && updated.missionReadiness > 60) {
          updated.missionReadiness = 48;
        } else if (updates.status === 'AWAITING PARTS' && updated.missionReadiness > 55) {
          updated.missionReadiness = 45;
        } else if (updates.status === 'SOFTWARE BLOCKED' && updated.missionReadiness > 65) {
          updated.missionReadiness = 60;
        }
      }
      return updated;
    }));
  };

  const addWorkOrder = (woData: Omit<WorkOrder, 'id' | 'openDate' | 'status'> & { status?: WorkOrderStatus }) => {
    const newId = `WO-${Math.floor(8840 + Math.random() * 1000)}`;
    const today = new Date().toISOString().split('T')[0];
    const newWo: WorkOrder = {
      id: newId,
      assetId: woData.assetId,
      issue: woData.issue,
      maintenanceType: woData.maintenanceType,
      priority: woData.priority,
      technician: woData.technician,
      openDate: today,
      requiredParts: woData.requiredParts || [],
      estimatedCompletion: woData.estimatedCompletion,
      status: woData.status || 'In Progress',
      notes: woData.notes || '',
    };

    setWorkOrders(prev => [newWo, ...prev]);

    // Update the corresponding asset
    setAssets(prev => prev.map(asset => {
      if (asset.id !== woData.assetId) return asset;
      const newStatus: AssetStatus = newWo.status === 'Awaiting Parts' ? 'AWAITING PARTS' : 'MAINTENANCE';
      return {
        ...asset,
        status: newStatus,
        maintenanceStatus: `${woData.maintenanceType} — ${woData.issue}`,
        maintenanceHistory: [newId, ...asset.maintenanceHistory],
        missionReadiness: Math.min(asset.missionReadiness, 50),
        timelineEvents: [
          {
            id: `EVT-${Date.now()}`,
            date: `${today} 08:30`,
            title: `Work Order ${newId} Created`,
            type: 'maintenance',
            description: `${woData.issue} assigned to ${woData.technician}.`,
            technicianOrSource: woData.technician,
          },
          ...asset.timelineEvents,
        ],
      };
    }));

    // Update spare parts required counts
    if (woData.requiredParts && woData.requiredParts.length > 0) {
      setSpareParts(prev => prev.map(part => {
        if (woData.requiredParts.includes(part.sku)) {
          return {
            ...part,
            requiredForOpenMaintenance: part.requiredForOpenMaintenance + 1,
            isLimitingReadiness: part.onHand < (part.requiredForOpenMaintenance + 1),
          };
        }
        return part;
      }));
    }
  };

  const updateWorkOrderStatus = (woId: string, newStatus: WorkOrderStatus, notes?: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== woId) return wo;
      const updated = { 
        ...wo, 
        status: newStatus, 
        notes: notes !== undefined ? notes : wo.notes,
        completedDate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : wo.completedDate 
      };

      // If work order is completed, update the asset and reduce required parts
      if (newStatus === 'Completed') {
        const assetId = wo.assetId;
        setTimeout(() => {
          setAssets(prevAssets => prevAssets.map(a => {
            if (a.id !== assetId) return a;
            // Check if there are other open work orders
            const otherOpenOrders = workOrders.filter(o => o.assetId === assetId && o.id !== woId && o.status !== 'Completed');
            if (otherOpenOrders.length === 0) {
              return {
                ...a,
                status: a.openFaultsCount === 0 ? 'MISSION READY' : 'LIMITED',
                missionReadiness: a.openFaultsCount === 0 ? 94 : 80,
                maintenanceStatus: 'Nominal — Maintenance Completed',
                requiredSpareParts: [],
                timelineEvents: [
                  {
                    id: `EVT-${Date.now()}`,
                    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    title: `Work Order ${woId} Completed`,
                    type: 'maintenance',
                    description: `Maintenance successfully finished by ${wo.technician}. Readiness restored.`,
                    technicianOrSource: wo.technician,
                  },
                  ...a.timelineEvents,
                ]
              };
            }
            return a;
          }));

          // Consume spare parts if on-hand available
          if (wo.requiredParts && wo.requiredParts.length > 0) {
            setSpareParts(prevParts => prevParts.map(part => {
              if (wo.requiredParts.includes(part.sku)) {
                const newOnHand = Math.max(0, part.onHand - 1);
                const newReq = Math.max(0, part.requiredForOpenMaintenance - 1);
                return {
                  ...part,
                  onHand: newOnHand,
                  requiredForOpenMaintenance: newReq,
                  isLimitingReadiness: newOnHand < newReq,
                };
              }
              return part;
            }));
          }
        }, 50);
      }

      return updated;
    }));
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

    // Update asset
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
      const oldStatus = f.status;
      const updated = { ...f, status: newStatus };

      if ((newStatus === 'Cleared' || newStatus === 'Mitigated') && oldStatus === 'Active') {
        setTimeout(() => {
          setAssets(prevAssets => prevAssets.map(a => {
            if (a.id !== f.assetId) return a;
            const remainingActiveFaults = faults.filter(
              item => item.assetId === a.id && item.id !== faultId && (item.status === 'Active' || item.status === 'Under Repair')
            ).length;

            const boost = f.severity === 'Critical' ? 25 : 12;
            const newReadiness = Math.min(98, a.missionReadiness + boost);
            const nextStatus: AssetStatus = remainingActiveFaults === 0 ? 'MISSION READY' : 'LIMITED';

            return {
              ...a,
              openFaultsCount: remainingActiveFaults,
              missionReadiness: newReadiness,
              status: a.status === 'MAINTENANCE' || a.status === 'AWAITING PARTS' ? a.status : nextStatus,
              timelineEvents: [
                {
                  id: `EVT-${Date.now()}`,
                  date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                  title: `Fault ${faultId} ${newStatus}`,
                  type: 'fault',
                  description: `Fault on ${f.system} marked as ${newStatus} by ${f.owner}.`,
                  technicianOrSource: f.owner,
                },
                ...a.timelineEvents,
              ]
            };
          }));
        }, 50);
      }

      return updated;
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
      const isStillLimiting = newOnHand < p.requiredForOpenMaintenance;
      return {
        ...p,
        onHand: newOnHand,
        incoming: newIncoming,
        isLimitingReadiness: isStillLimiting,
      };
    }));

    // If stock of COMM-MOD-V3 was received, auto-transition parts-blocked assets to ready/maintenance
    if (sku === 'COMM-MOD-V3') {
      setTimeout(() => {
        setAssets(prev => prev.map(a => {
          if (a.requiredSpareParts.includes('COMM-MOD-V3') && a.status === 'AWAITING PARTS') {
            return {
              ...a,
              status: 'MAINTENANCE',
              maintenanceStatus: 'Parts Received — Staged for Transceiver Replacement',
              missionReadiness: 65,
              timelineEvents: [
                {
                  id: `EVT-${Date.now()}`,
                  date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                  title: 'Required Part Received in Depot',
                  type: 'logistics',
                  description: 'COMM-MOD-V3 received. Vehicle moved to active repair bay.',
                  technicianOrSource: 'Victor Logistics Depot',
                },
                ...a.timelineEvents,
              ]
            };
          }
          return a;
        }));
      }, 50);
    }
  };

  const rolloutSoftwareVersion = (assetIds: string[], newVersion: SoftwareVersion) => {
    const today = new Date().toISOString().split('T')[0];
    setAssets(prev => prev.map(a => {
      if (!assetIds.includes(a.id)) return a;

      const restoredStatus: AssetStatus = a.status === 'SOFTWARE BLOCKED' ? 'MISSION READY' : a.status;
      const restoredReadiness = a.status === 'SOFTWARE BLOCKED' ? 94 : a.missionReadiness;
      const commStatus = newVersion === '4.8.2' ? 'Nominal' : a.communicationsStatus;

      return {
        ...a,
        softwareVersion: newVersion,
        status: restoredStatus,
        missionReadiness: restoredReadiness,
        communicationsStatus: commStatus,
        softwareHistory: [
          {
            version: newVersion,
            installedDate: today,
            installedBy: 'SENTINEL OTA Fleet Orchestrator',
            notes: `Firmware updated to ${newVersion}. Mesh communication stack synchronized.`,
          },
          ...a.softwareHistory,
        ],
        timelineEvents: [
          {
            id: `EVT-${Date.now()}`,
            date: `${today} 12:00`,
            title: `OTA Firmware Rollout to v${newVersion}`,
            type: 'software',
            description: `Target software upgraded. Checksums verified. Socket buffers cleared.`,
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
        nextInspectionHours: 200, // Reset to full 200 hour window
        timelineEvents: [
          {
            id: `EVT-${Date.now()}`,
            date: `${today} 14:00`,
            title: 'Field Inspection Certified',
            type: 'inspection',
            description: 'Comprehensive 200-hour mechanical, safety interlock, and sensor inspection passed.',
            technicianOrSource: 'Chief Certifier Lin',
          },
          ...a.timelineEvents,
        ],
      };
    }));
  };

  const resetToFactorySeed = () => {
    localStorage.removeItem(`${STORAGE_KEY}_assets`);
    localStorage.removeItem(`${STORAGE_KEY}_workorders`);
    localStorage.removeItem(`${STORAGE_KEY}_faults`);
    localStorage.removeItem(`${STORAGE_KEY}_spareparts`);
    setAssets(generateSeedAssets());
    setWorkOrders(INITIAL_WORK_ORDERS);
    setFaults(INITIAL_FAULTS);
    setSpareParts(INITIAL_SPARE_PARTS);
    setSelectedAssetId(null);
  };

  return (
    <FleetContext.Provider
      value={{
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
