export type AssetStatus = 
  | 'MISSION READY' 
  | 'MAINTENANCE' 
  | 'AWAITING PARTS' 
  | 'SOFTWARE BLOCKED' 
  | 'INSPECTION DUE' 
  | 'CRITICAL FAULT' 
  | 'LIMITED';

export type HardwareGen = 'Gen 2' | 'Gen 2.5' | 'Gen 3';

export type SoftwareVersion = '4.6.1' | '4.7.0' | '4.8.2' | '4.9 Beta';

export type LocationSector = 
  | 'Forward Operating Base Alpha' 
  | 'Bravo Proving Grounds' 
  | 'Victor Logistics Depot' 
  | 'Echo Training Sector' 
  | 'Sierra Outpost' 
  | 'Nevada Test Range';

export type AssignedTeam = 
  | 'Team Orion' 
  | 'Team Aegis' 
  | 'Ghost Recon Unit' 
  | 'Iron Vanguard' 
  | '3rd Autonomous Platoon' 
  | 'Task Force Titan';

export type CommStatus = 'Nominal' | 'Degraded' | 'Offline' | 'Intermittent';

export type SubsystemType = 
  | 'Drive & Powertrain' 
  | 'Communications' 
  | 'Thermal Management' 
  | 'Vision & Optics' 
  | 'Compute & Avionics' 
  | 'Navigation & GNSS';

export type FaultSeverity = 'Critical' | 'Moderate' | 'Low' | 'Advisory';

export type FaultStatus = 'Active' | 'Under Repair' | 'Mitigated' | 'Cleared';

export type MaintenanceType = 
  | 'Scheduled Preventative' 
  | 'Unscheduled Corrective' 
  | 'Overhaul' 
  | 'Firmware Calibration' 
  | 'Sensor Recalibration';

export type MaintenancePriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type WorkOrderStatus = 
  | 'Open' 
  | 'In Progress' 
  | 'Awaiting Parts' 
  | 'Quality Inspection' 
  | 'Completed';

export interface InstalledComponent {
  name: string;
  partNumber: string;
  serialNumber: string;
  health: number; // 0-100
  installedDate: string;
  status: 'Nominal' | 'Degraded' | 'Service Required' | 'Failed';
}

export interface SoftwareHistoryEntry {
  version: SoftwareVersion;
  installedDate: string;
  installedBy: string;
  notes: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  type: 'fault' | 'maintenance' | 'software' | 'inspection' | 'logistics';
  description: string;
  technicianOrSource?: string;
}

export interface Asset {
  id: string; // MRD-001 to MRD-050
  name: string;
  status: AssetStatus;
  location: LocationSector;
  missionReadiness: number; // 0-100
  hardwareVersion: HardwareGen;
  softwareVersion: SoftwareVersion;
  operatingHours: number;
  maintenanceStatus: string;
  openFaultsCount: number;
  requiredSpareParts: string[]; // SKU list
  lastInspectionDate: string;
  lastInspectionHours: number;
  nextInspectionHours: number; // e.g., 17 operating hours remaining
  communicationsStatus: CommStatus;
  assignedTeam: AssignedTeam;
  batteryHealth: number;
  powertrainHealth: number;
  avionicsHealth: number;
  installedComponents: InstalledComponent[];
  softwareHistory: SoftwareHistoryEntry[];
  maintenanceHistory: string[]; // Work order IDs
  timelineEvents: TimelineEvent[];
  notes?: string;
}

export interface WorkOrder {
  id: string; // WO-8821
  assetId: string; // MRD-027
  issue: string;
  maintenanceType: MaintenanceType;
  priority: MaintenancePriority;
  technician: string;
  openDate: string;
  requiredParts: string[];
  estimatedCompletion: string;
  status: WorkOrderStatus;
  notes?: string;
  completedDate?: string;
}

export interface EquipmentFault {
  id: string; // FLT-4091
  assetId: string; // MRD-027
  severity: FaultSeverity;
  detectedDate: string;
  system: SubsystemType;
  description: string;
  operationalImpact: string;
  status: FaultStatus;
  owner: string;
}

export interface SparePart {
  id: string;
  sku: string;
  partName: string;
  category: SubsystemType;
  onHand: number;
  requiredForOpenMaintenance: number;
  reorderPoint: number;
  incoming: number;
  leadTimeDays: number;
  unitCostUSD: number;
  isLimitingReadiness: boolean;
  compatibleGenerations: HardwareGen[];
}

export interface FleetSummary {
  fleetReadiness: number; // e.g. 82%
  missionReady: number; // e.g. 41
  maintenance: number; // e.g. 4
  awaitingParts: number; // e.g. 2
  softwareBlocked: number; // e.g. 2
  inspectionDue: number; // e.g. 1
  criticalFaults: number; // e.g. 3
  totalAssets: number; // 50
  averageOperatingHours: number;
}

export interface ReadinessDriver {
  id: string;
  title: string;
  impactPercent: number;
  severity: 'critical' | 'high' | 'medium';
  affectedAssetCount: number;
  affectedAssetIds: string[];
  description: string;
  recommendedAction: string;
  category: 'maintenance' | 'supply_chain' | 'software' | 'inspection' | 'hardware';
}

export type DataMode = 'live' | 'demo';

export interface IngestionActivityLog {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  details: string;
  recordsCount: number;
  status: 'success' | 'warning' | 'error';
}

export interface PollingConnectorConfig {
  id: string;
  name: string;
  url: string;
  intervalSeconds: number;
  headers?: Record<string, string>;
  enabled: boolean;
  lastPolledAt?: string;
  lastStatus?: 'success' | 'error' | 'idle';
  lastError?: string;
  recordsIngestedTotal: number;
}

export interface CsvTemplateInfo {
  key: string;
  filename: string;
  description: string;
}

