import { Request, Response, NextFunction } from "express";

export interface ValidationErrorItem {
  field: string;
  message: string;
}

/**
 * Validates telemetry ping records.
 */
export function validateTelemetryPayload(req: Request, res: Response, next: NextFunction): void {
  const body = req.body;
  const items = Array.isArray(body) ? body : [body];

  if (items.length === 0) {
    res.status(400).json({
      type: "https://sentinel.defense.internal/errors/validation-failed",
      title: "Validation Error",
      status: 400,
      detail: "Telemetry payload array cannot be empty.",
      requestId: (req as any).requestId,
    });
    return;
  }

  const errors: ValidationErrorItem[] = [];

  items.forEach((item, index) => {
    const id = item.assetId || item.id || item.vehicleId || item.vin;
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      errors.push({ field: `[${index}].assetId`, message: "Asset ID is required and must be a non-empty string" });
    }

    if (item.batteryHealth !== undefined && (typeof item.batteryHealth !== "number" || item.batteryHealth < 0 || item.batteryHealth > 100)) {
      errors.push({ field: `[${index}].batteryHealth`, message: "batteryHealth must be a number between 0 and 100" });
    }

    if (item.operatingHours !== undefined && (typeof item.operatingHours !== "number" || item.operatingHours < 0)) {
      errors.push({ field: `[${index}].operatingHours`, message: "operatingHours must be a non-negative number" });
    }
  });

  if (errors.length > 0) {
    res.status(422).json({
      type: "https://sentinel.defense.internal/errors/validation-failed",
      title: "Validation Failed",
      status: 422,
      detail: "One or more telemetry ping fields failed validation criteria.",
      errors,
      requestId: (req as any).requestId,
    });
    return;
  }

  next();
}

/**
 * Validates fault report payloads.
 */
export function validateFaultPayload(req: Request, res: Response, next: NextFunction): void {
  const body = req.body;
  const items = Array.isArray(body) ? body : [body];

  if (items.length === 0) {
    res.status(400).json({
      type: "https://sentinel.defense.internal/errors/validation-failed",
      title: "Validation Error",
      status: 400,
      detail: "Fault payload cannot be empty.",
      requestId: (req as any).requestId,
    });
    return;
  }

  const errors: ValidationErrorItem[] = [];
  const validSeverities = ["Critical", "Moderate", "Low", "Advisory"];

  items.forEach((item, index) => {
    const assetId = item.assetId || item.vehicleId || item.id;
    if (!assetId || typeof assetId !== "string") {
      errors.push({ field: `[${index}].assetId`, message: "assetId is required and must be a string" });
    }

    if (item.severity && !validSeverities.includes(item.severity)) {
      errors.push({ field: `[${index}].severity`, message: `severity must be one of: ${validSeverities.join(", ")}` });
    }

    const desc = item.description || item.issue;
    if (!desc || typeof desc !== "string") {
      errors.push({ field: `[${index}].description`, message: "description or issue is required" });
    }
  });

  if (errors.length > 0) {
    res.status(422).json({
      type: "https://sentinel.defense.internal/errors/validation-failed",
      title: "Validation Failed",
      status: 422,
      errors,
      requestId: (req as any).requestId,
    });
    return;
  }

  next();
}

/**
 * Validates work order payloads.
 */
export function validateWorkOrderPayload(req: Request, res: Response, next: NextFunction): void {
  const body = req.body;
  const items = Array.isArray(body) ? body : [body];

  if (items.length === 0) {
    res.status(400).json({
      type: "https://sentinel.defense.internal/errors/validation-failed",
      title: "Validation Error",
      status: 400,
      detail: "Work order payload cannot be empty.",
      requestId: (req as any).requestId,
    });
    return;
  }

  const errors: ValidationErrorItem[] = [];
  const validStatuses = ["Open", "In Progress", "Awaiting Parts", "Quality Inspection", "Completed"];

  items.forEach((item, index) => {
    const assetId = item.assetId || item.vehicleId;
    if (!assetId || typeof assetId !== "string") {
      errors.push({ field: `[${index}].assetId`, message: "assetId is required" });
    }

    const issue = item.issue || item.description;
    if (!issue || typeof issue !== "string") {
      errors.push({ field: `[${index}].issue`, message: "issue description is required" });
    }

    if (item.status && !validStatuses.includes(item.status)) {
      errors.push({ field: `[${index}].status`, message: `status must be one of: ${validStatuses.join(", ")}` });
    }
  });

  if (errors.length > 0) {
    res.status(422).json({
      type: "https://sentinel.defense.internal/errors/validation-failed",
      title: "Validation Failed",
      status: 422,
      errors,
      requestId: (req as any).requestId,
    });
    return;
  }

  next();
}

/**
 * Validates CSV import requests.
 */
export function validateCsvImportPayload(req: Request, res: Response, next: NextFunction): void {
  const { type, csv } = req.body;
  const validTypes = ["assets", "telemetry", "faults", "workOrders", "spareParts"];

  if (!type || !validTypes.includes(type)) {
    res.status(400).json({
      type: "https://sentinel.defense.internal/errors/invalid-csv-type",
      title: "Bad Request",
      status: 400,
      detail: `Parameter 'type' must be one of: ${validTypes.join(", ")}`,
      requestId: (req as any).requestId,
    });
    return;
  }

  if (!csv || typeof csv !== "string" || csv.trim().length === 0) {
    res.status(400).json({
      type: "https://sentinel.defense.internal/errors/empty-csv",
      title: "Bad Request",
      status: 400,
      detail: "Parameter 'csv' is required and must contain CSV formatted text.",
      requestId: (req as any).requestId,
    });
    return;
  }

  next();
}
