import fs from "fs";
import path from "path";
import { eventBus } from "../eventBus";
import { logger } from "../logger";

export interface FleetStorageState {
  assets: any[];
  workOrders: any[];
  faults: any[];
  spareParts: any[];
}

export class FleetRepository {
  private filePath: string;
  private state: FleetStorageState;
  private isDirty: boolean = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(filePath: string, initialState?: FleetStorageState) {
    this.filePath = filePath;
    this.state = this.loadFromDisk(initialState);
  }

  private loadFromDisk(fallback?: FleetStorageState): FleetStorageState {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          assets: Array.isArray(parsed.assets) ? parsed.assets : [],
          workOrders: Array.isArray(parsed.workOrders) ? parsed.workOrders : [],
          faults: Array.isArray(parsed.faults) ? parsed.faults : [],
          spareParts: Array.isArray(parsed.spareParts) ? parsed.spareParts : [],
        };
      }
    } catch (err: any) {
      logger.error(`Failed to load repository from disk at ${this.filePath}`, { error: err });
    }

    return fallback || {
      assets: [],
      workOrders: [],
      faults: [],
      spareParts: [],
    };
  }

  public schedulePersist(): void {
    this.isDirty = true;
    if (this.saveTimeout) return;

    // Debounce disk writes by 100ms for high-frequency batch ingest
    this.saveTimeout = setTimeout(() => {
      this.flushToDisk();
      this.saveTimeout = null;
    }, 100);
  }

  public flushToDisk(): void {
    if (!this.isDirty) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.state, null, 2), "utf-8");
      fs.renameSync(tmpPath, this.filePath);
      this.isDirty = false;
    } catch (err: any) {
      logger.error(`Failed to persist repository to ${this.filePath}`, { error: err });
    }
  }

  // --- Asset Operations ---
  public getAssets(): any[] {
    return this.state.assets;
  }

  public getAssetById(id: string): any | undefined {
    return this.state.assets.find((a) => a.id === id);
  }

  public upsertAsset(asset: any, source: string = "repository"): { asset: any; isNew: boolean } {
    const idx = this.state.assets.findIndex((a) => a.id === asset.id);
    let isNew = false;

    if (idx >= 0) {
      this.state.assets[idx] = { ...this.state.assets[idx], ...asset };
    } else {
      this.state.assets.push(asset);
      isNew = true;
    }

    this.schedulePersist();
    eventBus.publish("asset:upserted", { asset, isNew }, source);
    return { asset: idx >= 0 ? this.state.assets[idx] : asset, isNew };
  }

  // --- Work Order Operations ---
  public getWorkOrders(): any[] {
    return this.state.workOrders;
  }

  public getWorkOrderById(id: string): any | undefined {
    return this.state.workOrders.find((w) => w.id === id);
  }

  public upsertWorkOrder(order: any, source: string = "repository"): any {
    const idx = this.state.workOrders.findIndex((w) => w.id === order.id);
    if (idx >= 0) {
      this.state.workOrders[idx] = { ...this.state.workOrders[idx], ...order };
    } else {
      this.state.workOrders.unshift(order);
    }

    this.schedulePersist();
    eventBus.publish("work_order:updated", order, source);
    return idx >= 0 ? this.state.workOrders[idx] : order;
  }

  // --- Fault Operations ---
  public getFaults(): any[] {
    return this.state.faults;
  }

  public logFault(fault: any, source: string = "repository"): any {
    this.state.faults.unshift(fault);
    this.schedulePersist();
    eventBus.publish("fault:logged", fault, source);
    return fault;
  }

  // --- Spare Parts Operations ---
  public getSpareParts(): any[] {
    return this.state.spareParts;
  }

  public upsertSparePart(part: any, source: string = "repository"): any {
    const idx = this.state.spareParts.findIndex((p) => p.sku === part.sku);
    if (idx >= 0) {
      this.state.spareParts[idx] = { ...this.state.spareParts[idx], ...part };
    } else {
      this.state.spareParts.push(part);
    }

    this.schedulePersist();
    eventBus.publish("parts:updated", part, source);
    return idx >= 0 ? this.state.spareParts[idx] : part;
  }

  // --- Reset / Replace ---
  public reset(newState: FleetStorageState): void {
    this.state = {
      assets: [...newState.assets],
      workOrders: [...newState.workOrders],
      faults: [...newState.faults],
      spareParts: [...newState.spareParts],
    };
    this.schedulePersist();
    eventBus.publish("fleet:snapshot", this.state, "reset");
  }

  public clear(): void {
    this.state = {
      assets: [],
      workOrders: [],
      faults: [],
      spareParts: [],
    };
    this.schedulePersist();
    eventBus.publish("fleet:snapshot", this.state, "clear");
  }
}
