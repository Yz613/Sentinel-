import fs from "fs";
import path from "path";
import { logger } from "../logger";

export interface AuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  status: "success" | "warning" | "error";
  requestId?: string;
  recordsCount: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const AUDIT_LOG_FILE = path.join(DATA_DIR, "audit_trail.jsonl");

export class AuditService {
  private static memoryLog: AuditRecord[] = [];

  public static init(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(AUDIT_LOG_FILE)) {
        const lines = fs.readFileSync(AUDIT_LOG_FILE, "utf-8").split("\n").filter(Boolean);
        const recent = lines.slice(-100).map(l => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        }).filter(Boolean) as AuditRecord[];
        this.memoryLog = recent.reverse();
      }
    } catch (err: any) {
      logger.warn("Could not initialize audit trail file", { error: err });
    }
  }

  public static record(
    actor: string,
    action: string,
    entityType: string,
    details: string,
    recordsCount: number = 1,
    status: "success" | "warning" | "error" = "success",
    meta?: { entityId?: string; requestId?: string }
  ): AuditRecord {
    const record: AuditRecord = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      entityType,
      entityId: meta?.entityId,
      details,
      status,
      requestId: meta?.requestId,
      recordsCount,
    };

    // Prepend to in-memory list (capped at 200 items for UI retrieval)
    this.memoryLog = [record, ...this.memoryLog].slice(0, 200);

    // Append to durable JSONL audit trail
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(record) + "\n", "utf-8");
    } catch (err: any) {
      logger.error("Failed to append to audit trail file", { error: err });
    }

    return record;
  }

  public static getRecentLogs(limit: number = 100): AuditRecord[] {
    return this.memoryLog.slice(0, limit);
  }
}

AuditService.init();
