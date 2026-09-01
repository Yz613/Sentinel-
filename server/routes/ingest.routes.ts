import { Router, Request, Response } from "express";
import { fleetStore } from "../store";
import { parseCsv } from "../csvParser";
import { CSV_TEMPLATES, JSON_INGEST_EXAMPLES } from "../templates";
import {
  validateTelemetryPayload,
  validateFaultPayload,
  validateWorkOrderPayload,
  validateCsvImportPayload,
} from "../middleware/validation";
import { requireRole } from "../middleware/auth";
import { AuditService } from "../services/audit.service";

const router = Router();

// Universal Batch Ingestion Endpoint
router.post("/api/v1/ingest", requireRole("admin", "operator"), (req: Request, res: Response) => {
  try {
    const source = (req.headers["x-source"] as string) || "Universal Ingest API";
    const result = fleetStore.ingestBatch(req.body, source);
    res.json({
      success: true,
      message: `Successfully processed ${result.totalIngested} record(s).`,
      breakdown: result.breakdown,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Failed to process batch ingestion" });
  }
});

// Assets Ingest / Upsert Endpoint
router.post("/api/v1/assets", requireRole("admin", "operator"), (req: Request, res: Response) => {
  try {
    const rawAssets = Array.isArray(req.body) ? req.body : [req.body];
    const source = (req.headers["x-source"] as string) || "Assets Ingest API";
    const result = fleetStore.upsertAssets(rawAssets, source);
    res.json({
      success: true,
      count: result.count,
      assets: result.assets,
      message: `Successfully synchronized ${result.count} asset(s).`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Failed to upsert assets" });
  }
});

// High-Frequency Telemetry Ping Ingestion Endpoint
router.post("/api/v1/telemetry", validateTelemetryPayload, (req: Request, res: Response) => {
  try {
    const rawPings = Array.isArray(req.body) ? req.body : [req.body];
    const source = (req.headers["x-source"] as string) || "Live Telemetry Gateway";
    const result = fleetStore.recordTelemetry(rawPings, source);
    res.json({
      success: true,
      count: result.count,
      updatedAssets: result.updatedAssets,
      message: `Ingested ${result.count} telemetry ping(s).`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Failed to ingest telemetry" });
  }
});

// Faults Ingestion Endpoint
router.post("/api/v1/faults", validateFaultPayload, requireRole("admin", "operator", "technician"), (req: Request, res: Response) => {
  try {
    const rawFaults = Array.isArray(req.body) ? req.body : [req.body];
    const source = (req.headers["x-source"] as string) || "Fault Telemetry API";
    const result = fleetStore.recordFaults(rawFaults, source);
    res.json({
      success: true,
      count: result.count,
      faults: result.faults,
      message: `Logged ${result.count} equipment fault(s).`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Failed to log faults" });
  }
});

// Work Orders Ingestion Endpoint
router.post("/api/v1/work-orders", validateWorkOrderPayload, requireRole("admin", "operator", "technician"), (req: Request, res: Response) => {
  try {
    const rawOrders = Array.isArray(req.body) ? req.body : [req.body];
    const source = (req.headers["x-source"] as string) || "Maintenance Bay API";
    const result = fleetStore.upsertWorkOrders(rawOrders, source);
    res.json({
      success: true,
      count: result.count,
      workOrders: result.workOrders,
      message: `Synchronized ${result.count} work order(s).`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Failed to upsert work orders" });
  }
});

// Spare Parts Ingestion Endpoint
router.post("/api/v1/parts", requireRole("admin", "operator"), (req: Request, res: Response) => {
  try {
    const rawParts = Array.isArray(req.body) ? req.body : [req.body];
    const source = (req.headers["x-source"] as string) || "Supply Chain API";
    const result = fleetStore.upsertSpareParts(rawParts, source);
    res.json({
      success: true,
      count: result.count,
      spareParts: result.spareParts,
      message: `Synchronized ${result.count} inventory spare part(s).`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Failed to upsert parts" });
  }
});

// CSV File Ingestion Endpoint
router.post("/api/v1/import-csv", validateCsvImportPayload, requireRole("admin", "operator"), (req: Request, res: Response) => {
  try {
    const { type, csv } = req.body;
    const rows = parseCsv(csv);
    if (rows.length === 0) {
      res.status(400).json({ error: "CSV file contained no data rows" });
      return;
    }

    let result: any;
    const source = `CSV Import (${type})`;

    switch (type) {
      case "assets":
        result = fleetStore.upsertAssets(rows, source);
        break;
      case "telemetry":
        result = fleetStore.recordTelemetry(rows, source);
        break;
      case "faults":
        result = fleetStore.recordFaults(rows, source);
        break;
      case "workOrders":
        result = fleetStore.upsertWorkOrders(rows, source);
        break;
      case "spareParts":
        result = fleetStore.upsertSpareParts(rows, source);
        break;
      default:
        res.status(400).json({ error: `Unsupported CSV type '${type}'` });
        return;
    }

    res.json({
      success: true,
      type,
      importedCount: rows.length,
      message: `Successfully imported ${rows.length} ${type} from CSV.`,
      result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "CSV processing failed" });
  }
});

// CSV Templates API
router.get("/api/v1/templates", (_req: Request, res: Response) => {
  res.json({
    templates: Object.entries(CSV_TEMPLATES).map(([key, val]) => ({
      key,
      filename: val.filename,
      description: val.description,
    })),
    jsonExamples: JSON_INGEST_EXAMPLES,
  });
});

router.get("/api/v1/templates/:type", (req: Request, res: Response) => {
  const type = req.params.type;
  const template = CSV_TEMPLATES[type];
  if (!template) {
    res.status(404).json({ error: `Template '${type}' not found.` });
    return;
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${template.filename}"`);
  res.send(template.content);
});

// Ingestion Activity Stream & Audit API
router.get("/api/v1/activity", (_req: Request, res: Response) => {
  res.json({
    activity: fleetStore.getActivityLogs(),
    auditTrail: AuditService.getRecentLogs(50),
  });
});

export const ingestRoutes = router;
