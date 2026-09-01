/**
 * Schema normalizer for Sentinel real-world fleet data ingestion.
 * Handles variations in field naming from diverse IoT, CAN bus, ROS, Samsara, AWS IoT,
 * and custom telematics platforms.
 */

export interface RawAssetInput {
  id?: string;
  assetId?: string;
  asset_id?: string;
  vehicleId?: string;
  vehicle_id?: string;
  vin?: string;
  serial?: string;
  serialNumber?: string;
  name?: string;
  assetName?: string;
  asset_name?: string;
  status?: string;
  state?: string;
  operational_status?: string;
  location?: string;
  site?: string;
  facility?: string;
  depot?: string;
  sector?: string;
  base?: string;
  hardwareVersion?: string;
  hardware?: string;
  generation?: string;
  gen?: string;
  model?: string;
  softwareVersion?: string;
  software?: string;
  firmware?: string;
  version?: string;
  fw_version?: string;
  operatingHours?: number | string;
  hours?: number | string;
  engine_hours?: number | string;
  runtime_hours?: number | string;
  odometer?: number | string;
  batteryHealth?: number | string;
  battery?: number | string;
  battery_level?: number | string;
  soc?: number | string;
  charge?: number | string;
  powertrainHealth?: number | string;
  powertrain?: number | string;
  motor_health?: number | string;
  engine?: number | string;
  avionicsHealth?: number | string;
  avionics?: number | string;
  compute?: number | string;
  electronics?: number | string;
  communicationsStatus?: string;
  commStatus?: string;
  comms?: string;
  connectivity?: string;
  assignedTeam?: string;
  team?: string;
  unit?: string;
  fleet_group?: string;
  squad?: string;
  maintenanceStatus?: string;
  notes?: string;
  nextInspectionHours?: number | string;
  missionReadiness?: number | string;
  readiness?: number | string;
  [key: string]: any;
}

export interface RawTelemetryPing {
  assetId?: string;
  id?: string;
  vehicleId?: string;
  vin?: string;
  timestamp?: string;
  batteryHealth?: number | string;
  battery?: number | string;
  soc?: number | string;
  powertrainHealth?: number | string;
  avionicsHealth?: number | string;
  operatingHours?: number | string;
  hours?: number | string;
  communicationsStatus?: string;
  commStatus?: string;
  connectivity?: string;
  location?: string;
  speedKmh?: number | string;
  tempCelsius?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  message?: string;
  status?: string;
  [key: string]: any;
}

export interface RawFaultInput {
  id?: string;
  faultId?: string;
  assetId?: string;
  vehicleId?: string;
  severity?: string;
  system?: string;
  subsystem?: string;
  description?: string;
  issue?: string;
  operationalImpact?: string;
  impact?: string;
  status?: string;
  owner?: string;
  technician?: string;
  detectedDate?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface RawWorkOrderInput {
  id?: string;
  workOrderId?: string;
  assetId?: string;
  vehicleId?: string;
  issue?: string;
  description?: string;
  maintenanceType?: string;
  type?: string;
  priority?: string;
  technician?: string;
  assignedTo?: string;
  openDate?: string;
  requiredParts?: string[] | string;
  estimatedCompletion?: string;
  status?: string;
  notes?: string;
  completedDate?: string;
  [key: string]: any;
}

export interface RawSparePartInput {
  id?: string;
  sku?: string;
  partNumber?: string;
  partName?: string;
  name?: string;
  category?: string;
  subsystem?: string;
  onHand?: number | string;
  quantity?: number | string;
  requiredForOpenMaintenance?: number | string;
  reorderPoint?: number | string;
  incoming?: number | string;
  leadTimeDays?: number | string;
  unitCostUSD?: number | string;
  cost?: number | string;
  isLimitingReadiness?: boolean | string;
  compatibleGenerations?: string[] | string;
  [key: string]: any;
}

function parseNum(val: any, fallback: number = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  const parsed = Number(val);
  return isNaN(parsed) ? fallback : parsed;
}

function clamp(num: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, Math.round(num)));
}

/**
 * Normalizes an asset object from arbitrary source input.
 */
export function normalizeAsset(raw: RawAssetInput, existing?: any): any {
  const id = String(
    raw.id || raw.assetId || raw.asset_id || raw.vehicleId || raw.vehicle_id || raw.vin || raw.serial || raw.serialNumber || `AST-${Date.now().toString(36).toUpperCase()}`
  ).trim();

  const name = raw.name || raw.assetName || raw.asset_name || id;

  const location = raw.location || raw.site || raw.facility || raw.depot || raw.sector || raw.base || existing?.location || 'Operational Deployment Site';

  const hardwareVersion = raw.hardwareVersion || raw.hardware || raw.generation || raw.gen || raw.model || existing?.hardwareVersion || 'Gen 3';

  const softwareVersion = raw.softwareVersion || raw.software || raw.firmware || raw.version || raw.fw_version || existing?.softwareVersion || '4.8.2';

  const assignedTeam = raw.assignedTeam || raw.team || raw.unit || raw.fleet_group || raw.squad || existing?.assignedTeam || 'Active Unit';

  const operatingHours = parseNum(
    raw.operatingHours ?? raw.hours ?? raw.engine_hours ?? raw.runtime_hours ?? raw.odometer,
    existing?.operatingHours ?? 100
  );

  const batteryHealth = clamp(
    parseNum(raw.batteryHealth ?? raw.battery ?? raw.battery_level ?? raw.soc ?? raw.charge, existing?.batteryHealth ?? 95)
  );

  const powertrainHealth = clamp(
    parseNum(raw.powertrainHealth ?? raw.powertrain ?? raw.motor_health ?? raw.engine, existing?.powertrainHealth ?? 95)
  );

  const avionicsHealth = clamp(
    parseNum(raw.avionicsHealth ?? raw.avionics ?? raw.compute ?? raw.electronics, existing?.avionicsHealth ?? 95)
  );

  // Communications status
  let commStatus = raw.communicationsStatus || raw.commStatus || raw.comms || raw.connectivity || existing?.communicationsStatus || 'Nominal';
  const commStr = String(commStatus).toLowerCase();
  if (commStr.includes('deg')) commStatus = 'Degraded';
  else if (commStr.includes('off') || commStr.includes('lost') || commStr.includes('down')) commStatus = 'Offline';
  else if (commStr.includes('inter')) commStatus = 'Intermittent';
  else commStatus = 'Nominal';

  // Calculate readiness if not explicitly provided
  let readiness = parseNum(raw.missionReadiness ?? raw.readiness);
  if (!readiness) {
    const avgHealth = (batteryHealth + powertrainHealth + avionicsHealth) / 3;
    readiness = clamp(avgHealth);
  }

  // Derive status
  let status = raw.status || raw.state || raw.operational_status || existing?.status;
  if (!status) {
    if (readiness >= 80 && commStatus !== 'Offline') {
      status = 'MISSION READY';
    } else if (readiness >= 65) {
      status = 'LIMITED';
    } else if (commStatus === 'Offline') {
      status = 'CRITICAL FAULT';
    } else {
      status = 'MAINTENANCE';
    }
  }

  const nextInspectionHours = parseNum(raw.nextInspectionHours, existing?.nextInspectionHours ?? 150);

  const today = new Date().toISOString().split('T')[0];

  return {
    id,
    name,
    status,
    location,
    missionReadiness: readiness,
    hardwareVersion,
    softwareVersion,
    operatingHours,
    maintenanceStatus: raw.maintenanceStatus || existing?.maintenanceStatus || (status === 'MISSION READY' ? 'Nominal — Operational' : `Active Status: ${status}`),
    openFaultsCount: parseNum(raw.openFaultsCount, existing?.openFaultsCount ?? 0),
    requiredSpareParts: Array.isArray(raw.requiredSpareParts) ? raw.requiredSpareParts : (existing?.requiredSpareParts || []),
    lastInspectionDate: raw.lastInspectionDate || existing?.lastInspectionDate || today,
    lastInspectionHours: parseNum(raw.lastInspectionHours, existing?.lastInspectionHours ?? Math.max(0, operatingHours - 50)),
    nextInspectionHours,
    communicationsStatus: commStatus,
    assignedTeam,
    batteryHealth,
    powertrainHealth,
    avionicsHealth,
    installedComponents: raw.installedComponents || existing?.installedComponents || [],
    softwareHistory: raw.softwareHistory || existing?.softwareHistory || [
      {
        version: softwareVersion,
        installedDate: today,
        installedBy: 'Ingestion Pipeline',
        notes: 'Initial synchronized firmware profile',
      },
    ],
    maintenanceHistory: raw.maintenanceHistory || existing?.maintenanceHistory || [],
    timelineEvents: raw.timelineEvents || existing?.timelineEvents || [
      {
        id: `EVT-${Date.now()}`,
        date: `${today} 08:00`,
        title: 'Asset Initialized in Sentinel',
        type: 'logistics',
        description: `Operational profile synced with current firmware ${softwareVersion}.`,
        technicianOrSource: 'Data Ingestion Service',
      },
    ],
    notes: raw.notes || existing?.notes || 'Ingested from live telemetry source.',
  };
}

/**
 * Normalizes a telemetry ping and merges it into an existing asset.
 */
export function applyTelemetryPing(asset: any, ping: RawTelemetryPing): { updatedAsset: any; event: any } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  const updated = { ...asset };

  if (ping.batteryHealth !== undefined || ping.battery !== undefined || ping.soc !== undefined) {
    updated.batteryHealth = clamp(parseNum(ping.batteryHealth ?? ping.battery ?? ping.soc, updated.batteryHealth));
  }

  if (ping.powertrainHealth !== undefined) {
    updated.powertrainHealth = clamp(parseNum(ping.powertrainHealth, updated.powertrainHealth));
  }

  if (ping.avionicsHealth !== undefined) {
    updated.avionicsHealth = clamp(parseNum(ping.avionicsHealth, updated.avionicsHealth));
  }

  if (ping.operatingHours !== undefined || ping.hours !== undefined) {
    const newHours = parseNum(ping.operatingHours ?? ping.hours, updated.operatingHours);
    const deltaHours = Math.max(0, newHours - updated.operatingHours);
    updated.operatingHours = newHours;
    updated.nextInspectionHours = Math.max(0, updated.nextInspectionHours - deltaHours);
  }

  if (ping.communicationsStatus || ping.commStatus || ping.connectivity) {
    const rawComm = String(ping.communicationsStatus || ping.commStatus || ping.connectivity).toLowerCase();
    if (rawComm.includes('deg')) updated.communicationsStatus = 'Degraded';
    else if (rawComm.includes('off') || rawComm.includes('lost') || rawComm.includes('down')) updated.communicationsStatus = 'Offline';
    else if (rawComm.includes('inter')) updated.communicationsStatus = 'Intermittent';
    else updated.communicationsStatus = 'Nominal';
  }

  if (ping.location) {
    updated.location = ping.location;
  }

  if (ping.status) {
    updated.status = ping.status;
  }

  // Recalculate readiness
  const avgHealth = (updated.batteryHealth + updated.powertrainHealth + updated.avionicsHealth) / 3;
  let penalty = 0;
  if (updated.communicationsStatus === 'Degraded') penalty += 15;
  if (updated.communicationsStatus === 'Offline') penalty += 35;
  if (updated.status === 'MAINTENANCE') penalty += 30;
  if (updated.status === 'CRITICAL FAULT') penalty += 40;
  if (updated.nextInspectionHours <= 0) penalty += 20;

  updated.missionReadiness = clamp(Math.round(avgHealth - penalty));

  // Check if status should auto-update
  if (updated.nextInspectionHours <= 0 && updated.status !== 'MAINTENANCE') {
    updated.status = 'INSPECTION DUE';
  }

  const event = {
    id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: `${today} ${timeStr}`,
    title: 'Live Telemetry Ping Received',
    type: 'logistics',
    description: ping.message || `Telemetry update: Battery ${updated.batteryHealth}%, Comms: ${updated.communicationsStatus}, Runtime: ${updated.operatingHours}h.`,
    technicianOrSource: 'Live Telemetry Gateway',
  };

  updated.timelineEvents = [event, ...(updated.timelineEvents || [])].slice(0, 30);

  return { updatedAsset: updated, event };
}

/**
 * Normalizes an equipment fault.
 */
export function normalizeFault(raw: RawFaultInput): any {
  const id = raw.id || raw.faultId || `FLT-${Math.floor(4100 + Math.random() * 9000)}`;
  const assetId = raw.assetId || raw.vehicleId || 'AST-001';
  const today = new Date().toISOString().split('T')[0];

  let severity = raw.severity || 'Moderate';
  const sevLower = String(severity).toLowerCase();
  if (sevLower.includes('crit')) severity = 'Critical';
  else if (sevLower.includes('mod')) severity = 'Moderate';
  else if (sevLower.includes('low')) severity = 'Low';
  else if (sevLower.includes('adv')) severity = 'Advisory';

  let status = raw.status || 'Active';
  const statLower = String(status).toLowerCase();
  if (statLower.includes('rep')) status = 'Under Repair';
  else if (statLower.includes('mit')) status = 'Mitigated';
  else if (statLower.includes('clear') || statLower.includes('res')) status = 'Cleared';
  else status = 'Active';

  return {
    id,
    assetId,
    severity,
    detectedDate: raw.detectedDate || raw.timestamp || today,
    system: raw.system || raw.subsystem || 'Compute & Avionics',
    description: raw.description || raw.issue || 'Telemetry discrepancy observed in live subsystem monitoring',
    operationalImpact: raw.operationalImpact || raw.impact || 'Under diagnostic investigation by telemetry monitoring.',
    status,
    owner: raw.owner || raw.technician || 'Automated Diagnostics System',
  };
}

/**
 * Normalizes a work order.
 */
export function normalizeWorkOrder(raw: RawWorkOrderInput): any {
  const id = raw.id || raw.workOrderId || `WO-${Math.floor(8850 + Math.random() * 1000)}`;
  const assetId = raw.assetId || raw.vehicleId || 'AST-001';
  const today = new Date().toISOString().split('T')[0];

  let priority = raw.priority || 'Medium';
  const prioLower = String(priority).toLowerCase();
  if (prioLower.includes('crit')) priority = 'Critical';
  else if (prioLower.includes('high')) priority = 'High';
  else if (prioLower.includes('low')) priority = 'Low';
  else priority = 'Medium';

  let status = raw.status || 'Open';
  const statLower = String(status).toLowerCase();
  if (statLower.includes('prog')) status = 'In Progress';
  else if (statLower.includes('part')) status = 'Awaiting Parts';
  else if (statLower.includes('inspect') || statLower.includes('qual')) status = 'Quality Inspection';
  else if (statLower.includes('comp')) status = 'Completed';
  else status = 'Open';

  let requiredParts: string[] = [];
  if (Array.isArray(raw.requiredParts)) {
    requiredParts = raw.requiredParts;
  } else if (typeof raw.requiredParts === 'string') {
    requiredParts = raw.requiredParts.split(',').map(s => s.trim()).filter(Boolean);
  }

  return {
    id,
    assetId,
    issue: raw.issue || raw.description || 'Depot servicing and corrective inspection',
    maintenanceType: raw.maintenanceType || raw.type || 'Unscheduled Corrective',
    priority,
    technician: raw.technician || raw.assignedTo || 'Depot Duty Technician',
    openDate: raw.openDate || today,
    requiredParts,
    estimatedCompletion: raw.estimatedCompletion || 'Pending parts allocation',
    status,
    notes: raw.notes || '',
    completedDate: raw.completedDate,
  };
}

/**
 * Normalizes a spare part.
 */
export function normalizeSparePart(raw: RawSparePartInput): any {
  const sku = raw.sku || raw.partNumber || `SKU-${Date.now().toString(36).toUpperCase()}`;
  const id = raw.id || `PART-${sku}`;
  const onHand = parseNum(raw.onHand ?? raw.quantity, 5);
  const requiredForOpenMaintenance = parseNum(raw.requiredForOpenMaintenance, 0);

  let compatibleGenerations: string[] = ['Gen 2', 'Gen 2.5', 'Gen 3'];
  if (Array.isArray(raw.compatibleGenerations)) {
    compatibleGenerations = raw.compatibleGenerations;
  } else if (typeof raw.compatibleGenerations === 'string') {
    compatibleGenerations = raw.compatibleGenerations.split(',').map(s => s.trim()).filter(Boolean);
  }

  return {
    id,
    sku,
    partName: raw.partName || raw.name || sku,
    category: raw.category || raw.subsystem || 'Drive & Powertrain',
    onHand,
    requiredForOpenMaintenance,
    reorderPoint: parseNum(raw.reorderPoint, 3),
    incoming: parseNum(raw.incoming, 0),
    leadTimeDays: parseNum(raw.leadTimeDays, 5),
    unitCostUSD: parseNum(raw.unitCostUSD ?? raw.cost, 1200),
    isLimitingReadiness: raw.isLimitingReadiness === true || raw.isLimitingReadiness === 'true' || (onHand < requiredForOpenMaintenance),
    compatibleGenerations,
  };
}
