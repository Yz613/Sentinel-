import path from "path";
import { 
  normalizeAsset, 
  applyTelemetryPing, 
  normalizeFault, 
  normalizeWorkOrder, 
  normalizeSparePart,
  RawAssetInput,
  RawTelemetryPing,
  RawFaultInput,
  RawWorkOrderInput,
  RawSparePartInput
} from "./normalizer";
import { 
  generateSeedAssets, 
  INITIAL_WORK_ORDERS, 
  INITIAL_FAULTS, 
  INITIAL_SPARE_PARTS 
} from "../src/data/seedData";
import { FleetRepository, FleetStorageState } from "./db/repository";
import { ReadinessService } from "./services/readiness.service";
import { AuditService } from "./services/audit.service";
import { eventBus } from "./eventBus";
import { logger } from "./logger";

export interface IngestionActivity {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  details: string;
  recordsCount: number;
  status: "success" | "warning" | "error";
}

export interface FleetDataset {
  assets: any[];
  workOrders: any[];
  faults: any[];
  spareParts: any[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const LIVE_DATA_FILE = path.join(DATA_DIR, "live_fleet.json");

class FleetStore {
  private demoData: FleetDataset;
  private repository: FleetRepository;
  private activityLogs: IngestionActivity[] = [];

  constructor() {
    this.demoData = {
      assets: generateSeedAssets(),
      workOrders: [...INITIAL_WORK_ORDERS],
      faults: [...INITIAL_FAULTS],
      spareParts: [...INITIAL_SPARE_PARTS],
    };

    this.repository = new FleetRepository(LIVE_DATA_FILE);
    this.logActivity("System Startup", "Store Initialized", "Enterprise Fleet Store initialized with repository backing.", 0, "success");
  }

  public logActivity(source: string, action: string, details: string, recordsCount: number, status: "success" | "warning" | "error" = "success"): void {
    const activity: IngestionActivity = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      source,
      action,
      details,
      recordsCount,
      status,
    };
    this.activityLogs = [activity, ...this.activityLogs].slice(0, 100);
    AuditService.record(source, action, "SYSTEM", details, recordsCount, status);
  }

  public getActivityLogs(): IngestionActivity[] {
    return this.activityLogs;
  }

  public getDataset(mode: "live" | "demo" = "live"): FleetDataset {
    if (mode === "demo") {
      return this.demoData;
    }
    return {
      assets: this.repository.getAssets(),
      workOrders: this.repository.getWorkOrders(),
      faults: this.repository.getFaults(),
      spareParts: this.repository.getSpareParts(),
    };
  }

  public getFullSnapshot(mode: "live" | "demo" = "live") {
    const data = this.getDataset(mode);
    const summary = ReadinessService.computeSummary(data.assets, data.faults);
    const readinessDrivers = ReadinessService.computeReadinessDrivers(data.assets, data.spareParts);

    return {
      mode,
      assets: data.assets,
      workOrders: data.workOrders,
      faults: data.faults,
      spareParts: data.spareParts,
      summary,
      readinessDrivers,
    };
  }

  // --- Ingestion APIs (Writes strictly to repository / liveData) ---

  public upsertAssets(rawAssets: RawAssetInput[], source: string = "REST API"): { count: number; assets: any[] } {
    const updatedAssets: any[] = [];
    let added = 0;
    let modified = 0;

    rawAssets.forEach((raw) => {
      const id = String(
        raw.id || raw.assetId || raw.asset_id || raw.vehicleId || raw.vehicle_id || raw.vin || raw.serial || raw.serialNumber || ""
      ).trim();

      const existing = id ? this.repository.getAssetById(id) : undefined;
      const normalized = normalizeAsset(raw, existing);

      const result = this.repository.upsertAsset(normalized, source);
      if (result.isNew) {
        added++;
      } else {
        modified++;
      }
      updatedAssets.push(result.asset);
    });

    this.logActivity(source, "Upsert Assets", `Processed ${rawAssets.length} asset(s) (${added} added, ${modified} updated).`, rawAssets.length, "success");
    eventBus.publish("asset:upserted", { count: rawAssets.length, assets: updatedAssets }, source);

    return { count: rawAssets.length, assets: updatedAssets };
  }

  public recordTelemetry(rawPings: RawTelemetryPing[], source: string = "Telemetry Gateway"): { count: number; updatedAssets: any[] } {
    const updated: any[] = [];
    let matched = 0;
    let created = 0;

    rawPings.forEach((ping) => {
      const assetId = String(ping.assetId || ping.id || ping.vehicleId || ping.vin || "").trim();
      let asset = this.repository.getAssetById(assetId);

      if (!asset && assetId) {
        const newAsset = normalizeAsset({ id: assetId, name: `Live Asset ${assetId}` });
        this.repository.upsertAsset(newAsset, source);
        asset = this.repository.getAssetById(assetId);
        created++;
      }

      if (asset) {
        const { updatedAsset } = applyTelemetryPing(asset, ping);
        this.repository.upsertAsset(updatedAsset, source);
        updated.push(updatedAsset);
        matched++;
      }
    });

    this.logActivity(source, "Telemetry Ingest", `Ingested ${rawPings.length} telemetry ping(s) (${matched} updated, ${created} auto-created).`, rawPings.length, "success");
    eventBus.publish("telemetry:ping", { count: rawPings.length, updatedAssets: updated }, source);

    return { count: rawPings.length, updatedAssets: updated };
  }

  public recordFaults(rawFaults: RawFaultInput[], source: string = "Diagnostics System"): { count: number; faults: any[] } {
    const newFaults: any[] = [];

    rawFaults.forEach((raw) => {
      const fault = normalizeFault(raw);
      this.repository.logFault(fault, source);
      newFaults.push(fault);

      // Reflect on asset
      const asset = this.repository.getAssetById(fault.assetId);
      if (asset) {
        const openFaultsCount = (asset.openFaultsCount || 0) + 1;
        let newStatus = asset.status;
        let readiness = asset.missionReadiness;

        if (fault.severity === "Critical") {
          newStatus = "CRITICAL FAULT";
          readiness = Math.max(20, readiness - 35);
        } else if (fault.severity === "Moderate") {
          if (newStatus === "MISSION READY") newStatus = "LIMITED";
          readiness = Math.max(40, readiness - 15);
        }

        this.repository.upsertAsset({
          ...asset,
          openFaultsCount,
          status: newStatus,
          missionReadiness: readiness,
        }, source);
      }
    });

    this.logActivity(source, "Faults Logged", `Logged ${rawFaults.length} equipment fault(s).`, rawFaults.length, "warning");
    eventBus.publish("fault:logged", { count: rawFaults.length, faults: newFaults }, source);

    return { count: rawFaults.length, faults: newFaults };
  }

  public upsertWorkOrders(rawOrders: RawWorkOrderInput[], source: string = "Maintenance Bay"): { count: number; workOrders: any[] } {
    const orders: any[] = [];

    rawOrders.forEach((raw) => {
      const order = normalizeWorkOrder(raw);
      const saved = this.repository.upsertWorkOrder(order, source);
      orders.push(saved);

      // Update asset status if work order is active
      const asset = this.repository.getAssetById(order.assetId);
      if (asset && order.status !== "Completed") {
        let newStatus = asset.status;
        let maintenanceStatus = asset.maintenanceStatus;

        if (order.status === "Awaiting Parts") {
          newStatus = "AWAITING PARTS";
          maintenanceStatus = `Awaiting parts for ${order.id}`;
        } else if (order.status === "In Progress" || order.status === "Open") {
          if (newStatus === "MISSION READY") {
            newStatus = "MAINTENANCE";
          }
          maintenanceStatus = `Depot service active: ${order.issue}`;
        }

        this.repository.upsertAsset({
          ...asset,
          status: newStatus,
          maintenanceStatus,
        }, source);
      }
    });

    this.logActivity(source, "Work Orders Ingest", `Ingested ${rawOrders.length} maintenance work order(s).`, rawOrders.length, "success");
    eventBus.publish("work_order:updated", { count: rawOrders.length, workOrders: orders }, source);

    return { count: rawOrders.length, workOrders: orders };
  }

  public upsertSpareParts(rawParts: RawSparePartInput[], source: string = "Supply Logistics"): { count: number; spareParts: any[] } {
    const parts: any[] = [];

    rawParts.forEach((raw) => {
      const part = normalizeSparePart(raw);
      const saved = this.repository.upsertSparePart(part, source);
      parts.push(saved);
    });

    this.logActivity(source, "Spare Parts Catalog Ingest", `Ingested ${rawParts.length} inventory part record(s).`, rawParts.length, "success");
    eventBus.publish("parts:updated", { count: rawParts.length, spareParts: parts }, source);

    return { count: rawParts.length, spareParts: parts };
  }

  public ingestBatch(payload: any, source: string = "Batch Ingestion API"): { totalIngested: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {
      assets: 0,
      telemetry: 0,
      faults: 0,
      workOrders: 0,
      spareParts: 0,
    };

    if (Array.isArray(payload)) {
      if (payload.length > 0) {
        const first = payload[0];
        if (first.batteryHealth !== undefined && first.assetId && !first.location && !first.hardwareVersion) {
          const res = this.recordTelemetry(payload, source);
          breakdown.telemetry = res.count;
        } else {
          const res = this.upsertAssets(payload, source);
          breakdown.assets = res.count;
        }
      }
    } else if (typeof payload === "object" && payload !== null) {
      if (Array.isArray(payload.assets)) {
        breakdown.assets = this.upsertAssets(payload.assets, source).count;
      }
      if (Array.isArray(payload.telemetry)) {
        breakdown.telemetry = this.recordTelemetry(payload.telemetry, source).count;
      }
      if (Array.isArray(payload.faults)) {
        breakdown.faults = this.recordFaults(payload.faults, source).count;
      }
      if (Array.isArray(payload.workOrders)) {
        breakdown.workOrders = this.upsertWorkOrders(payload.workOrders, source).count;
      }
      if (Array.isArray(payload.spareParts)) {
        breakdown.spareParts = this.upsertSpareParts(payload.spareParts, source).count;
      }
    }

    const totalIngested = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { totalIngested, breakdown };
  }

  public clearLiveData(): void {
    this.repository.clear();
    this.logActivity("Admin Console", "Clear Live Data", "Cleared all live operational assets, telemetry, and records.", 0, "warning");
  }

  public loadSampleLiveData(): void {
    const sampleAssets = [
      {
        id: "ROV-101",
        name: "Titan Scout Alpha",
        location: "Forward Operating Base Alpha",
        assignedTeam: "Team Orion",
        hardwareVersion: "Gen 3",
        softwareVersion: "4.8.2",
        operatingHours: 145,
        batteryHealth: 96,
        powertrainHealth: 94,
        avionicsHealth: 98,
        communicationsStatus: "Nominal",
        status: "MISSION READY",
        notes: "Real-world ground scout telemetry initialized.",
      },
      {
        id: "ROV-102",
        name: "Titan Scout Bravo",
        location: "Forward Operating Base Alpha",
        assignedTeam: "Team Orion",
        hardwareVersion: "Gen 3",
        softwareVersion: "4.8.2",
        operatingHours: 210,
        batteryHealth: 91,
        powertrainHealth: 89,
        avionicsHealth: 95,
        communicationsStatus: "Nominal",
        status: "MISSION READY",
      },
      {
        id: "ROV-103",
        name: "Vanguard Carrier 1",
        location: "Bravo Proving Grounds",
        assignedTeam: "Iron Vanguard",
        hardwareVersion: "Gen 2.5",
        softwareVersion: "4.8.2",
        operatingHours: 420,
        batteryHealth: 84,
        powertrainHealth: 72,
        avionicsHealth: 90,
        communicationsStatus: "Nominal",
        status: "LIMITED",
      },
      {
        id: "ROV-104",
        name: "Apex Heavy Hauler",
        location: "Victor Logistics Depot",
        assignedTeam: "Task Force Titan",
        hardwareVersion: "Gen 3",
        softwareVersion: "4.8.2",
        operatingHours: 310,
        batteryHealth: 95,
        powertrainHealth: 96,
        avionicsHealth: 92,
        communicationsStatus: "Nominal",
        status: "MISSION READY",
      },
      {
        id: "ROV-105",
        name: "Ghost Sentry Beta",
        location: "Sierra Outpost",
        assignedTeam: "Ghost Recon Unit",
        hardwareVersion: "Gen 2",
        softwareVersion: "4.7.0",
        operatingHours: 520,
        batteryHealth: 78,
        powertrainHealth: 65,
        avionicsHealth: 70,
        communicationsStatus: "Degraded",
        status: "MAINTENANCE",
      },
    ];

    const sampleParts = [
      {
        sku: "COMM-MOD-V3",
        partName: "Tactical Mesh Transceiver (V3)",
        category: "Communications",
        onHand: 2,
        requiredForOpenMaintenance: 1,
        reorderPoint: 4,
        incoming: 5,
        leadTimeDays: 3,
        unitCostUSD: 4200,
        compatibleGenerations: ["Gen 2.5", "Gen 3"],
      },
      {
        sku: "ENC-WHEEL-MAG",
        partName: "Magnetic Wheel Speed Sensor",
        category: "Drive & Powertrain",
        onHand: 4,
        requiredForOpenMaintenance: 1,
        reorderPoint: 3,
        incoming: 4,
        leadTimeDays: 4,
        unitCostUSD: 650,
        compatibleGenerations: ["Gen 2", "Gen 2.5", "Gen 3"],
      },
    ];

    const sampleFaults = [
      {
        id: "FLT-LIVE-01",
        assetId: "ROV-105",
        severity: "Critical",
        system: "Communications",
        description: "Mesh transceiver frame sync loss under terrain obstruction",
        operationalImpact: "Fallback to secondary UHF link active",
        status: "Active",
        owner: "Eng. Morales",
      },
      {
        id: "FLT-LIVE-02",
        assetId: "ROV-103",
        severity: "Moderate",
        system: "Drive & Powertrain",
        description: "Left drive wheel encoder pulse variance (+3.4%)",
        operationalImpact: "Traverse speed limited to 15km/h for safety",
        status: "Under Repair",
        owner: "Specialist Davies",
      },
    ];

    const sampleWorkOrders = [
      {
        id: "WO-LIVE-101",
        assetId: "ROV-105",
        issue: "Replace mesh transceiver module and re-calibrate frequency hop table",
        maintenanceType: "Unscheduled Corrective",
        priority: "High",
        technician: "Eng. Morales",
        requiredParts: ["COMM-MOD-V3"],
        status: "In Progress",
        estimatedCompletion: "Today 17:00",
      },
    ];

    this.upsertAssets(sampleAssets, "Sample Starter Pack");
    this.upsertSpareParts(sampleParts, "Sample Starter Pack");
    this.recordFaults(sampleFaults, "Sample Starter Pack");
    this.upsertWorkOrders(sampleWorkOrders, "Sample Starter Pack");

    this.logActivity("Admin Console", "Load Sample Batch", "Loaded 5 sample operational vehicles to live fleet.", 5, "success");
  }

  public resetDemoData(): void {
    this.demoData = {
      assets: generateSeedAssets(),
      workOrders: [...INITIAL_WORK_ORDERS],
      faults: [...INITIAL_FAULTS],
      spareParts: [...INITIAL_SPARE_PARTS],
    };
    eventBus.publish("fleet:snapshot", this.demoData, "demo_reset");
    this.logActivity("Demo Console", "Reset Demo State", "Restored pristine 50-vehicle synthetic demo fleet (82% readiness).", 50, "success");
  }
}

export const fleetStore = new FleetStore();
