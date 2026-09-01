import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateTelemetryPayload,
  validateFaultPayload,
  validateWorkOrderPayload,
  validateCsvImportPayload,
} from "../../server/middleware/validation";

function mockReqRes(body: any) {
  const req: any = { body, headers: {} };
  let statusCode = 200;
  let jsonResponse: any = null;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      jsonResponse = payload;
      return this;
    },
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  return { req, res, next, getResult: () => ({ statusCode, jsonResponse, nextCalled }) };
}

describe("Validation Middleware Unit Tests", () => {
  it("accepts valid telemetry payload", () => {
    const { req, res, next, getResult } = mockReqRes([
      { assetId: "ROV-101", batteryHealth: 95, operatingHours: 120 },
    ]);
    validateTelemetryPayload(req, res, next);
    const result = getResult();
    assert.equal(result.nextCalled, true);
    assert.equal(result.statusCode, 200);
  });

  it("rejects telemetry payload with missing assetId or invalid battery percentage", () => {
    const { req, res, next, getResult } = mockReqRes([
      { batteryHealth: 150, operatingHours: -10 },
    ]);
    validateTelemetryPayload(req, res, next);
    const result = getResult();
    assert.equal(result.nextCalled, false);
    assert.equal(result.statusCode, 422);
    assert.ok(result.jsonResponse.errors.length >= 2);
  });

  it("validates fault payload and enforces severity enumeration", () => {
    const { req, res, next, getResult } = mockReqRes([
      { assetId: "ROV-101", severity: "SuperFatal", description: "Sensor failure" },
    ]);
    validateFaultPayload(req, res, next);
    const result = getResult();
    assert.equal(result.nextCalled, false);
    assert.equal(result.statusCode, 422);
  });

  it("rejects empty or unsupported CSV import payload", () => {
    const { req, res, next, getResult } = mockReqRes({ type: "invalidType", csv: "" });
    validateCsvImportPayload(req, res, next);
    const result = getResult();
    assert.equal(result.nextCalled, false);
    assert.equal(result.statusCode, 400);
  });
});
