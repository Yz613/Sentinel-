/**
 * Downloadable CSV & JSON templates for Sentinel data ingestion.
 */

export const CSV_TEMPLATES: Record<string, { filename: string; content: string; description: string }> = {
  assets: {
    filename: 'sentinel_assets_template.csv',
    description: 'Fleet inventory template with vehicle IDs, hardware/software specs, operating hours, and baseline subsystem health.',
    content: `id,name,location,assignedTeam,hardwareVersion,softwareVersion,operatingHours,batteryHealth,powertrainHealth,avionicsHealth,communicationsStatus,status
ROV-101,Titan Scout Alpha,Forward Operating Base Alpha,Team Orion,Gen 3,4.8.2,145,96,94,98,Nominal,MISSION READY
ROV-102,Titan Scout Bravo,Forward Operating Base Alpha,Team Orion,Gen 3,4.8.2,210,91,89,95,Nominal,MISSION READY
ROV-103,Vanguard Carrier 1,Bravo Proving Grounds,Iron Vanguard,Gen 2.5,4.8.2,420,84,72,90,Nominal,LIMITED
ROV-104,Apex Heavy Hauler,Victor Logistics Depot,Task Force Titan,Gen 3,4.8.2,310,95,96,92,Nominal,MISSION READY
ROV-105,Ghost Sentry Beta,Sierra Outpost,Ghost Recon Unit,Gen 2,4.7.0,520,78,65,70,Degraded,MAINTENANCE`,
  },

  telemetry: {
    filename: 'sentinel_telemetry_template.csv',
    description: 'Real-time telemetry stream template for high-frequency subsystem ping updates.',
    content: `assetId,batteryHealth,powertrainHealth,avionicsHealth,operatingHours,communicationsStatus,status,message
ROV-101,95,94,98,146,Nominal,MISSION READY,Autonomous patrol waypoint 4 achieved. Subsystems nominal.
ROV-102,90,88,95,212,Nominal,MISSION READY,Routine traverse ping. Minor vibration within spec.
ROV-103,82,70,90,422,Degraded,LIMITED,Left wheel encoder pulse jitter detected.
ROV-104,95,96,92,312,Nominal,MISSION READY,Depot transport cycle complete. Battery recharging.
ROV-105,75,60,70,522,Offline,CRITICAL FAULT,Mesh socket ping timeout. Vehicle halted at staging area.`,
  },

  faults: {
    filename: 'sentinel_faults_template.csv',
    description: 'Diagnostic trouble codes (DTCs) and anomalous conditions.',
    content: `assetId,severity,system,description,operationalImpact,status,owner
ROV-103,Moderate,Drive & Powertrain,Left wheel encoder intermittent pulses,Odometry drift observed over 5km traverse,Under Repair,Specialist Davies
ROV-105,Critical,Communications,Mesh transceiver socket packet timeout,Loss of redundant telemetry link beyond 2km,Active,Eng. Morales
ROV-102,Low,Thermal Management,Coolant loop pressure slightly below nominal,Operating temperatures within tolerance,Active,Tech Sgt. Vance`,
  },

  workOrders: {
    filename: 'sentinel_work_orders_template.csv',
    description: 'Depot repair and scheduled preventative maintenance orders.',
    content: `assetId,issue,maintenanceType,priority,technician,requiredParts,status,estimatedCompletion
ROV-103,Wheel encoder recalibration and harness replacement,Unscheduled Corrective,Medium,Specialist Davies,ENC-WHEEL-MAG,In Progress,Tomorrow 14:00
ROV-105,Transceiver module replacement & firmware re-flash,Unscheduled Corrective,High,Eng. Morales,COMM-MOD-V3,Awaiting Parts,Pending shipment
ROV-101,Scheduled 150-hour drivetrain inspection,Scheduled Preventative,Low,Senior Specialist Lin,,Open,End of week`,
  },

  spareParts: {
    filename: 'sentinel_spare_parts_template.csv',
    description: 'Supply chain inventory, critical parts stock, and lead time tracking.',
    content: `sku,partName,category,onHand,requiredForOpenMaintenance,reorderPoint,incoming,leadTimeDays,unitCostUSD
COMM-MOD-V3,Tactical Mesh Transceiver (V3),Communications,2,3,5,6,3,4200
ENC-WHEEL-MAG,Magnetic Wheel Speed Sensor,Drive & Powertrain,4,2,4,8,5,650
BATT-THERM-800,High-Capacity Liquid-Cooled Core (800Wh),Thermal Management,3,1,3,4,7,8900
ACTUATOR-AXIS-200,Heavy Torque Steering Actuator,Drive & Powertrain,2,0,2,3,6,3100
OPTIC-CAM-4K,Ruggedized Stereo Vision Pod,Vision & Optics,5,1,3,6,4,2400`,
  },
};

export const JSON_INGEST_EXAMPLES = {
  batchIngest: {
    assets: [
      {
        id: "ROV-201",
        name: "Argus Recon-1",
        location: "Forward Operating Base Alpha",
        assignedTeam: "Team Orion",
        hardwareVersion: "Gen 3",
        softwareVersion: "4.8.2",
        operatingHours: 180,
        batteryHealth: 94,
        powertrainHealth: 92,
        avionicsHealth: 97,
        communicationsStatus: "Nominal",
        status: "MISSION READY"
      }
    ],
    telemetry: [
      {
        assetId: "ROV-201",
        batteryHealth: 93,
        operatingHours: 181,
        message: "Sector reconnaissance sweep completed."
      }
    ],
    faults: [
      {
        assetId: "ROV-201",
        severity: "Low",
        system: "Thermal Management",
        description: "Coolant temperature delta elevated by 2°C during high-torque climb",
        operationalImpact: "Nominal operational envelope maintained",
        status: "Active",
        owner: "Tech Sgt. Vance"
      }
    ]
  },
  telemetryPing: {
    assetId: "ROV-201",
    batteryHealth: 92,
    powertrainHealth: 94,
    avionicsHealth: 98,
    operatingHours: 182,
    communicationsStatus: "Nominal",
    status: "MISSION READY",
    message: "Navigated to depot charging dock."
  }
};
