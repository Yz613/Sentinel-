import { 
  Asset, 
  WorkOrder, 
  EquipmentFault, 
  SparePart, 
  HardwareGen, 
  SoftwareVersion, 
  LocationSector, 
  AssignedTeam,
  CommStatus,
  AssetStatus
} from '../types';

export const INITIAL_SPARE_PARTS: SparePart[] = [
  {
    id: 'PART-001',
    sku: 'COMM-MOD-V3',
    partName: 'Tactical Mesh Transceiver (V3)',
    category: 'Communications',
    onHand: 0,
    requiredForOpenMaintenance: 2,
    reorderPoint: 4,
    incoming: 5,
    leadTimeDays: 3,
    unitCostUSD: 4200,
    isLimitingReadiness: true,
    compatibleGenerations: ['Gen 2.5', 'Gen 3'],
  },
  {
    id: 'PART-002',
    sku: 'ENC-WHEEL-MAG',
    partName: 'Magnetic Wheel Speed Sensor',
    category: 'Drive & Powertrain',
    onHand: 2,
    requiredForOpenMaintenance: 2,
    reorderPoint: 4,
    incoming: 8,
    leadTimeDays: 5,
    unitCostUSD: 650,
    isLimitingReadiness: true,
    compatibleGenerations: ['Gen 2', 'Gen 2.5', 'Gen 3'],
  },
  {
    id: 'PART-003',
    sku: 'BATT-THERM-800',
    partName: 'High-Capacity Liquid-Cooled Core (800Wh)',
    category: 'Thermal Management',
    onHand: 4,
    requiredForOpenMaintenance: 1,
    reorderPoint: 3,
    incoming: 4,
    leadTimeDays: 7,
    unitCostUSD: 8900,
    isLimitingReadiness: false,
    compatibleGenerations: ['Gen 2.5', 'Gen 3'],
  },
  {
    id: 'PART-004',
    sku: 'ACTUATOR-AXIS-200',
    partName: 'Heavy Torque Steering Actuator',
    category: 'Drive & Powertrain',
    onHand: 3,
    requiredForOpenMaintenance: 1,
    reorderPoint: 2,
    incoming: 3,
    leadTimeDays: 6,
    unitCostUSD: 3100,
    isLimitingReadiness: false,
    compatibleGenerations: ['Gen 2', 'Gen 2.5', 'Gen 3'],
  },
  {
    id: 'PART-005',
    sku: 'OPTIC-CAM-4K',
    partName: 'Ruggedized Stereo Vision Pod',
    category: 'Vision & Optics',
    onHand: 5,
    requiredForOpenMaintenance: 1,
    reorderPoint: 3,
    incoming: 6,
    leadTimeDays: 4,
    unitCostUSD: 5400,
    isLimitingReadiness: false,
    compatibleGenerations: ['Gen 3'],
  },
  {
    id: 'PART-006',
    sku: 'GNSS-INS-MIL',
    partName: 'Anti-Jamming GPS / INS Nav Unit',
    category: 'Navigation & GNSS',
    onHand: 6,
    requiredForOpenMaintenance: 0,
    reorderPoint: 2,
    incoming: 4,
    leadTimeDays: 10,
    unitCostUSD: 11200,
    isLimitingReadiness: false,
    compatibleGenerations: ['Gen 2', 'Gen 2.5', 'Gen 3'],
  },
  {
    id: 'PART-007',
    sku: 'CPU-TEGRA-RT',
    partName: 'Autonomous Edge Compute Module Mk II',
    category: 'Compute & Avionics',
    onHand: 3,
    requiredForOpenMaintenance: 1,
    reorderPoint: 2,
    incoming: 2,
    leadTimeDays: 14,
    unitCostUSD: 14500,
    isLimitingReadiness: false,
    compatibleGenerations: ['Gen 2.5', 'Gen 3'],
  },
  {
    id: 'PART-008',
    sku: 'COOL-PUMP-TX',
    partName: 'Avionics Liquid Coolant Impeller',
    category: 'Thermal Management',
    onHand: 6,
    requiredForOpenMaintenance: 0,
    reorderPoint: 3,
    incoming: 0,
    leadTimeDays: 4,
    unitCostUSD: 850,
    isLimitingReadiness: false,
    compatibleGenerations: ['Gen 2', 'Gen 2.5'],
  }
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-8821',
    assetId: 'MRD-004',
    issue: 'Actuator current anomaly & torque divergence on right flank',
    maintenanceType: 'Unscheduled Corrective',
    priority: 'High',
    technician: 'Senior Specialist Lin',
    openDate: '2026-08-28',
    requiredParts: ['ACTUATOR-AXIS-200'],
    estimatedCompletion: '2026-09-01 (16:00)',
    status: 'In Progress',
    notes: 'Replaced harness, currently undergoing dynamometer recalibration.',
  },
  {
    id: 'WO-8824',
    assetId: 'MRD-014',
    issue: 'Mesh telemetry dropout & antenna impedance failure',
    maintenanceType: 'Unscheduled Corrective',
    priority: 'Critical',
    technician: 'Tech Sgt. Vance',
    openDate: '2026-08-27',
    requiredParts: ['COMM-MOD-V3'],
    estimatedCompletion: 'Awaiting stock delivery (Est. Sep 03)',
    status: 'Awaiting Parts',
    notes: 'Transceiver module completely burned out. Waiting on incoming batch shipment.',
  },
  {
    id: 'WO-8827',
    assetId: 'MRD-018',
    issue: 'Scheduled 500-hour powertrain tear-down & seal check',
    maintenanceType: 'Scheduled Preventative',
    priority: 'Medium',
    technician: 'Specialist Davies',
    openDate: '2026-08-29',
    requiredParts: ['ENC-WHEEL-MAG'],
    estimatedCompletion: '2026-09-02 (12:00)',
    status: 'In Progress',
    notes: 'Fluid flush completed. Sensor replacement in progress.',
  },
  {
    id: 'WO-8830',
    assetId: 'MRD-027',
    issue: 'Communication module degradation & intermittent packet loss',
    maintenanceType: 'Unscheduled Corrective',
    priority: 'High',
    technician: 'Eng. Morales',
    openDate: '2026-08-19',
    requiredParts: ['COMM-MOD-V3'],
    estimatedCompletion: 'Awaiting stock delivery (Est. Sep 03)',
    status: 'Awaiting Parts',
    notes: 'Signal-to-noise ratio degraded below -94dBm. Ready for swap once part arrives.',
  },
  {
    id: 'WO-8833',
    assetId: 'MRD-039',
    issue: 'Scheduled 250-hour optical sensor array realignment',
    maintenanceType: 'Scheduled Preventative',
    priority: 'Medium',
    technician: 'Senior Specialist Lin',
    openDate: '2026-08-30',
    requiredParts: ['OPTIC-CAM-4K'],
    estimatedCompletion: '2026-09-01 (18:00)',
    status: 'Quality Inspection',
    notes: 'Calibration target checks pass at 98.4% optical clarity.',
  },
  {
    id: 'WO-8838',
    assetId: 'MRD-045',
    issue: 'Battery thermal management valve stuck in bypass mode',
    maintenanceType: 'Unscheduled Corrective',
    priority: 'Critical',
    technician: 'Tech Sgt. Vance',
    openDate: '2026-08-30',
    requiredParts: ['BATT-THERM-800'],
    estimatedCompletion: '2026-09-02 (09:00)',
    status: 'In Progress',
    notes: 'Cooling loop depressurized for valve replacement.',
  },
  {
    id: 'WO-8812',
    assetId: 'MRD-012',
    issue: 'Wheel encoder intermittent pulse signal',
    maintenanceType: 'Unscheduled Corrective',
    priority: 'Medium',
    technician: 'Specialist Davies',
    openDate: '2026-08-22',
    requiredParts: ['ENC-WHEEL-MAG'],
    estimatedCompletion: '2026-08-24',
    status: 'Completed',
    completedDate: '2026-08-24',
    notes: 'Sensor swapped and calibrated. Cleared for field deployment.',
  }
];

export const INITIAL_FAULTS: EquipmentFault[] = [
  {
    id: 'FLT-4091',
    assetId: 'MRD-027',
    severity: 'Moderate',
    detectedDate: '2026-08-19',
    system: 'Communications',
    description: 'communication module degradation & periodic frame drops',
    operationalImpact: 'Degraded range beyond 3.5km; fallback to UHF line-of-sight required.',
    status: 'Under Repair',
    owner: 'Eng. Morales',
  },
  {
    id: 'FLT-4092',
    assetId: 'MRD-027',
    severity: 'Low',
    detectedDate: '2026-08-20',
    system: 'Vision & Optics',
    description: 'camera calibration required on auxiliary starboard stereo pod',
    operationalImpact: 'Depth perception resolution reduced by 8% in low light.',
    status: 'Active',
    owner: 'Senior Specialist Lin',
  },
  {
    id: 'FLT-4088',
    assetId: 'MRD-014',
    severity: 'Critical',
    detectedDate: '2026-08-27',
    system: 'Communications',
    description: 'communication module degradation with total hardware CRC link failure',
    operationalImpact: 'Vehicle cannot establish secure autonomous mesh link. Offline.',
    status: 'Active',
    owner: 'Tech Sgt. Vance',
  },
  {
    id: 'FLT-4085',
    assetId: 'MRD-004',
    severity: 'Critical',
    detectedDate: '2026-08-28',
    system: 'Drive & Powertrain',
    description: 'actuator current anomaly in right rear hub drive exceeding 45A threshold',
    operationalImpact: 'Vehicle locked out from high-speed transit mode.',
    status: 'Under Repair',
    owner: 'Senior Specialist Lin',
  },
  {
    id: 'FLT-4082',
    assetId: 'MRD-045',
    severity: 'Critical',
    detectedDate: '2026-08-30',
    system: 'Thermal Management',
    description: 'battery thermal warning: cell pack #3 reached 62°C under sustained load',
    operationalImpact: 'Power throttling engaged; vehicle restricted to depot perimeter.',
    status: 'Under Repair',
    owner: 'Tech Sgt. Vance',
  },
  {
    id: 'FLT-4077',
    assetId: 'MRD-009',
    severity: 'Moderate',
    detectedDate: '2026-08-26',
    system: 'Communications',
    description: 'communication module degradation correlated with software 4.7.0 socket memory leak',
    operationalImpact: 'Requires reboot every 4 operating hours. Software blocked.',
    status: 'Active',
    owner: 'Lead Software Architect Chen',
  },
  {
    id: 'FLT-4074',
    assetId: 'MRD-033',
    severity: 'Moderate',
    detectedDate: '2026-08-28',
    system: 'Communications',
    description: 'communication module degradation: intermittent heartbeat loss on v4.7.0',
    operationalImpact: 'Autonomous formation sync disabled.',
    status: 'Active',
    owner: 'Lead Software Architect Chen',
  },
  {
    id: 'FLT-4069',
    assetId: 'MRD-022',
    severity: 'Advisory',
    detectedDate: '2026-08-30',
    system: 'Compute & Avionics',
    description: 'Mandatory 300-hour structural and sensor recertification due in 4 hours',
    operationalImpact: 'Impending lockout when operating counter expires.',
    status: 'Active',
    owner: 'Specialist Davies',
  },
  {
    id: 'FLT-4065',
    assetId: 'MRD-011',
    severity: 'Advisory',
    detectedDate: '2026-08-31',
    system: 'Thermal Management',
    description: 'battery thermal warning: delta T between modules is 4.8°C (nominal <3.0°C)',
    operationalImpact: 'No operational degradation yet; logged for monitoring.',
    status: 'Active',
    owner: 'Tech Sgt. Vance',
  },
  {
    id: 'FLT-4061',
    assetId: 'MRD-041',
    severity: 'Low',
    detectedDate: '2026-08-29',
    system: 'Drive & Powertrain',
    description: 'wheel encoder intermittent pulses detected during rocky terrain traverse',
    operationalImpact: 'Dead reckoning odometry drift increased by 1.2%.',
    status: 'Active',
    owner: 'Specialist Davies',
  },
  {
    id: 'FLT-4058',
    assetId: 'MRD-018',
    severity: 'Moderate',
    detectedDate: '2026-08-29',
    system: 'Drive & Powertrain',
    description: 'wheel encoder intermittent signal on left forward idler',
    operationalImpact: 'Under preventative replacement in WO-8827.',
    status: 'Under Repair',
    owner: 'Specialist Davies',
  },
  {
    id: 'FLT-4050',
    assetId: 'MRD-002',
    severity: 'Low',
    detectedDate: '2026-08-25',
    system: 'Navigation & GNSS',
    description: 'GPS receiver fault: L2 frequency lock delayed by 18 seconds on cold start',
    operationalImpact: 'Inertial nav handles warm-up; mission ready.',
    status: 'Mitigated',
    owner: 'Eng. Morales',
  }
];

const LOCATIONS: LocationSector[] = [
  'Forward Operating Base Alpha',
  'Bravo Proving Grounds',
  'Victor Logistics Depot',
  'Echo Training Sector',
  'Sierra Outpost',
  'Nevada Test Range',
];

const TEAMS: AssignedTeam[] = [
  'Team Orion',
  'Team Aegis',
  'Ghost Recon Unit',
  'Iron Vanguard',
  '3rd Autonomous Platoon',
  'Task Force Titan',
];

// Generate exactly 50 assets (MRD-001 through MRD-050)
export function generateSeedAssets(): Asset[] {
  const assets: Asset[] = [];

  for (let i = 1; i <= 50; i++) {
    const id = `MRD-${String(i).padStart(3, '0')}`;
    const location = LOCATIONS[(i * 3 + 1) % LOCATIONS.length];
    const assignedTeam = TEAMS[(i * 2 + 3) % TEAMS.length];
    
    // Determine hardware generation distribution
    let hardwareVersion: HardwareGen = 'Gen 3';
    if (i <= 12) hardwareVersion = 'Gen 2';
    else if (i <= 26) hardwareVersion = 'Gen 2.5';
    else hardwareVersion = 'Gen 3';

    // Determine software version distribution
    let softwareVersion: SoftwareVersion = '4.8.2';
    if ([9, 14, 21, 25, 27, 33, 37, 42, 44, 48, 50].includes(i)) {
      softwareVersion = '4.7.0'; // Correlation with communication faults
    } else if ([1, 2, 3, 5, 8, 10, 12, 16].includes(i)) {
      softwareVersion = '4.6.1'; // Legacy Gen 2 units
    } else if ([46, 47, 49].includes(i)) {
      softwareVersion = '4.9 Beta'; // Test units
    } else {
      softwareVersion = '4.8.2'; // Standard stable fleet release
    }

    // Default values for standard mission-ready assets
    let status: AssetStatus = 'MISSION READY';
    let missionReadiness = 88 + ((i * 7) % 12); // 88% - 99%
    let operatingHours = 120 + ((i * 47) % 580);
    let openFaultsCount = 0;
    let requiredSpareParts: string[] = [];
    let commStatus: CommStatus = 'Nominal';
    let nextInspectionHours = 45 + ((i * 19) % 180);
    let maintenanceStatus = 'Nominal — Field Ready';
    let batteryHealth = 92 + ((i * 3) % 8);
    let powertrainHealth = 90 + ((i * 5) % 10);
    let avionicsHealth = 94 + ((i * 2) % 6);

    // Apply specific status configurations to match target metrics:
    // Prompt specific breakdown:
    // Fleet Readiness: 82%
    // Mission Ready: 41
    // Maintenance: 4
    // Awaiting Parts: 2
    // Software Blocked: 2
    // Inspection Due: 1
    // (Total non-ready = 9, ready = 41. Total = 50)
    // Critical Faults: 3 (MRD-004, MRD-014, MRD-045)

    if (i === 27) {
      // Prompt example: MRD-027
      // Status: LIMITED, Readiness: 74%, Hardware: Gen 3, Software: 4.8.2, Operating Hours: 311,
      // Last Maintenance: August 19, Next Inspection: 17 operating hours, Open Faults: 2
      status = 'LIMITED';
      missionReadiness = 74;
      hardwareVersion = 'Gen 3';
      softwareVersion = '4.8.2';
      operatingHours = 311;
      nextInspectionHours = 17;
      openFaultsCount = 2;
      requiredSpareParts = ['COMM-MOD-V3'];
      commStatus = 'Degraded';
      maintenanceStatus = 'Awaiting Part (COMM-MOD-V3) for FLT-4091';
      batteryHealth = 88;
      powertrainHealth = 94;
      avionicsHealth = 72;
    } else if (i === 14) {
      // Awaiting Parts #1
      status = 'AWAITING PARTS';
      missionReadiness = 48;
      hardwareVersion = 'Gen 2.5';
      softwareVersion = '4.7.0';
      operatingHours = 442;
      nextInspectionHours = 58;
      openFaultsCount = 1;
      requiredSpareParts = ['COMM-MOD-V3'];
      commStatus = 'Offline';
      maintenanceStatus = 'Grounded — WO-8824 Awaiting COMM-MOD-V3 Transceiver';
      batteryHealth = 84;
      powertrainHealth = 89;
      avionicsHealth = 40;
    } else if (i === 4) {
      // Maintenance #1 (Critical fault: actuator current anomaly)
      status = 'MAINTENANCE';
      missionReadiness = 42;
      hardwareVersion = 'Gen 2';
      softwareVersion = '4.6.1';
      operatingHours = 520;
      nextInspectionHours = 82;
      openFaultsCount = 1;
      requiredSpareParts = ['ACTUATOR-AXIS-200'];
      commStatus = 'Nominal';
      maintenanceStatus = 'Active Depot Service — WO-8821 Hub Actuator Calibration';
      batteryHealth = 90;
      powertrainHealth = 38;
      avionicsHealth = 88;
    } else if (i === 18) {
      // Maintenance #2 (Scheduled overhaul)
      status = 'MAINTENANCE';
      missionReadiness = 55;
      hardwareVersion = 'Gen 2.5';
      softwareVersion = '4.8.2';
      operatingHours = 502;
      nextInspectionHours = 120;
      openFaultsCount = 1;
      requiredSpareParts = ['ENC-WHEEL-MAG'];
      commStatus = 'Nominal';
      maintenanceStatus = 'Scheduled Preventative — WO-8827 500-Hr Overhaul';
      batteryHealth = 86;
      powertrainHealth = 60;
      avionicsHealth = 91;
    } else if (i === 39) {
      // Maintenance #3 (Optical realignment)
      status = 'MAINTENANCE';
      missionReadiness = 65;
      hardwareVersion = 'Gen 3';
      softwareVersion = '4.8.2';
      operatingHours = 254;
      nextInspectionHours = 96;
      openFaultsCount = 0;
      requiredSpareParts = ['OPTIC-CAM-4K'];
      commStatus = 'Nominal';
      maintenanceStatus = 'Depot Quality Inspection — WO-8833 Stereo Alignment';
      batteryHealth = 95;
      powertrainHealth = 92;
      avionicsHealth = 70;
    } else if (i === 45) {
      // Maintenance #4 (Critical fault: battery thermal warning)
      status = 'MAINTENANCE';
      missionReadiness = 35;
      hardwareVersion = 'Gen 3';
      softwareVersion = '4.8.2';
      operatingHours = 389;
      nextInspectionHours = 111;
      openFaultsCount = 1;
      requiredSpareParts = ['BATT-THERM-800'];
      commStatus = 'Nominal';
      maintenanceStatus = 'Corrective Repair — WO-8838 Thermal Valve Replacement';
      batteryHealth = 32;
      powertrainHealth = 88;
      avionicsHealth = 92;
    } else if (i === 9) {
      // Software Blocked #1
      status = 'SOFTWARE BLOCKED';
      missionReadiness = 60;
      hardwareVersion = 'Gen 2';
      softwareVersion = '4.7.0';
      operatingHours = 415;
      nextInspectionHours = 74;
      openFaultsCount = 1;
      commStatus = 'Intermittent';
      maintenanceStatus = 'Firmware Quarantine — FLT-4077 Socket Leak on v4.7.0';
      batteryHealth = 89;
      powertrainHealth = 91;
      avionicsHealth = 58;
    } else if (i === 33) {
      // Software Blocked #2
      status = 'SOFTWARE BLOCKED';
      missionReadiness = 62;
      hardwareVersion = 'Gen 3';
      softwareVersion = '4.7.0';
      operatingHours = 298;
      nextInspectionHours = 104;
      openFaultsCount = 1;
      commStatus = 'Degraded';
      maintenanceStatus = 'Firmware Quarantine — FLT-4074 Heartbeat Drop on v4.7.0';
      batteryHealth = 94;
      powertrainHealth = 96;
      avionicsHealth = 60;
    } else if (i === 22) {
      // Inspection Due #1
      status = 'INSPECTION DUE';
      missionReadiness = 72;
      hardwareVersion = 'Gen 2.5';
      softwareVersion = '4.8.2';
      operatingHours = 296;
      nextInspectionHours = 4; // <10 hours remaining!
      openFaultsCount = 1;
      commStatus = 'Nominal';
      maintenanceStatus = 'Operating Limit Warning — Mandatory Inspection in 4 Hours';
      batteryHealth = 88;
      powertrainHealth = 85;
      avionicsHealth = 90;
    } else if (i === 11) {
      // Advisory fault asset (Mission ready with advisory)
      status = 'MISSION READY';
      missionReadiness = 89;
      openFaultsCount = 1;
      batteryHealth = 84;
    } else if (i === 41) {
      // Advisory fault asset (Mission ready with low fault)
      status = 'MISSION READY';
      missionReadiness = 87;
      openFaultsCount = 1;
      powertrainHealth = 85;
    } else if (i === 2) {
      // Mitigated fault asset
      status = 'MISSION READY';
      missionReadiness = 94;
      openFaultsCount = 0;
    }

    const asset: Asset = {
      id,
      name: `Autonomous Ground Carrier ${id}`,
      status,
      location,
      missionReadiness,
      hardwareVersion,
      softwareVersion,
      operatingHours,
      maintenanceStatus,
      openFaultsCount,
      requiredSpareParts,
      lastInspectionDate: i === 27 ? '2026-08-19' : `2026-0${7 + (i % 2)}-${10 + (i % 18)}`,
      lastInspectionHours: operatingHours - (200 - nextInspectionHours),
      nextInspectionHours,
      communicationsStatus: commStatus,
      assignedTeam,
      batteryHealth,
      powertrainHealth,
      avionicsHealth,
      installedComponents: [
        {
          name: 'Tactical Mesh Transceiver',
          partNumber: 'COMM-MOD-V3',
          serialNumber: `SN-CM-${8000 + i}`,
          health: (i === 27 || i === 14) ? 30 : 96,
          installedDate: '2026-01-15',
          status: (i === 27 || i === 14) ? 'Degraded' : 'Nominal',
        },
        {
          name: 'Stereo Vision & LiDAR Pod',
          partNumber: 'OPTIC-CAM-4K',
          serialNumber: `SN-OPT-${4000 + i}`,
          health: (i === 27 || i === 39) ? 75 : 98,
          installedDate: '2026-02-10',
          status: (i === 27 || i === 39) ? 'Service Required' : 'Nominal',
        },
        {
          name: 'High-Density Liquid Core Battery',
          partNumber: 'BATT-THERM-800',
          serialNumber: `SN-BAT-${9000 + i}`,
          health: i === 45 ? 28 : (i === 11 ? 84 : 95),
          installedDate: '2025-11-20',
          status: i === 45 ? 'Failed' : (i === 11 ? 'Degraded' : 'Nominal'),
        },
        {
          name: 'Heavy Torque Drive Actuator Set',
          partNumber: 'ACTUATOR-AXIS-200',
          serialNumber: `SN-ACT-${3000 + i}`,
          health: i === 4 ? 35 : 92,
          installedDate: '2026-03-05',
          status: i === 4 ? 'Degraded' : 'Nominal',
        },
        {
          name: 'Autonomous Edge Compute Module',
          partNumber: 'CPU-TEGRA-RT',
          serialNumber: `SN-CPU-${1000 + i}`,
          health: (i === 9 || i === 33) ? 70 : 97,
          installedDate: '2026-01-08',
          status: (i === 9 || i === 33) ? 'Degraded' : 'Nominal',
        },
        {
          name: 'Anti-Jamming GPS / INS Nav Unit',
          partNumber: 'GNSS-INS-MIL',
          serialNumber: `SN-NAV-${6000 + i}`,
          health: 99,
          installedDate: '2025-10-12',
          status: 'Nominal',
        }
      ],
      softwareHistory: [
        {
          version: softwareVersion,
          installedDate: '2026-08-10',
          installedBy: 'OTA Fleet Dispatch Automation',
          notes: `Running firmware build ${softwareVersion} telemetry pipeline.`,
        },
        {
          version: '4.6.1',
          installedDate: '2026-04-12',
          installedBy: 'Depot Avionics Eng. Morales',
          notes: 'Initial operational deployment flash.',
        }
      ],
      maintenanceHistory: i === 27 ? ['WO-8830', 'WO-8702'] : (i === 4 ? ['WO-8821'] : ['WO-8650']),
      timelineEvents: [
        {
          id: `EVT-${i}-1`,
          date: '2026-08-31 06:00',
          title: 'Daily Telemetry Diagnostic Pulse',
          type: 'software',
          description: `Telemetry stream synced. Overall subsystem health rated at ${missionReadiness}%.`,
          technicianOrSource: 'Autonomous Health Monitor',
        },
        ...(i === 27 ? [
          {
            id: `EVT-27-2`,
            date: '2026-08-20 14:15',
            title: 'Fault FLT-4092 Logged',
            type: 'fault' as const,
            description: 'Starboard stereo camera calibration deviation flagged.',
            technicianOrSource: 'Senior Specialist Lin',
          },
          {
            id: `EVT-27-3`,
            date: '2026-08-19 09:30',
            title: 'Fault FLT-4091 Logged & Work Order WO-8830 Opened',
            type: 'maintenance' as const,
            description: 'Communication transceiver degradation identified. Part COMM-MOD-V3 requested.',
            technicianOrSource: 'Eng. Morales',
          }
        ] : []),
        {
          id: `EVT-${i}-4`,
          date: i === 27 ? '2026-08-19 08:00' : '2026-08-10 11:00',
          title: 'Scheduled Inspection Completed',
          type: 'inspection',
          description: `Passed multi-point physical safety and drivetrain checks.`,
          technicianOrSource: 'Tech Sgt. Vance',
        }
      ]
    };

    assets.push(asset);
  }

  return assets;
}
