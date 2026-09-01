import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeAsset,
  applyTelemetryPing,
  normalizeFault,
  normalizeWorkOrder,
  normalizeSparePart,
} from "../../server/normalizer";

describe("Normalizer Unit Tests", () => {
  it("normalizes asset with CAN bus / ROS field naming variations", () => {
    const rawROS = {
      vehicle_id: "ROV-999",
      asset_name: "Pathfinder Rover",
      battery_level: "88",
      runtime_hours: "312",
      gen: "Gen 3",
      firmware: "4.8.2",
      operational_status: "MISSION READY",
    };

    const normalized = normalizeAsset(rawROS);
    assert.equal(normalized.id, "ROV-999");
    assert.equal(normalized.name, "Pathfinder Rover");
    assert.equal(normalized.batteryHealth, 88);
    assert.equal(normalized.operatingHours, 312);
    assert.equal(normalized.hardwareVersion, "Gen 3");
    assert.equal(normalized.softwareVersion, "4.8.2");
    assert.equal(normalized.status, "MISSION READY");
  });

  it("applies incoming telemetry ping and adjusts health metrics and operational status", () => {
    const baseAsset = normalizeAsset({
      id: "ROV-500",
      batteryHealth: 90,
      operatingHours: 100,
      powertrainHealth: 90,
      status: "MISSION READY",
      missionReadiness: 95,
    });

    const ping = {
      assetId: "ROV-500",
      batteryHealth: 20, // Critical drop
      operatingHours: 105,
      powertrainHealth: 45, // Degraded
      status: "LIMITED",
    };

    const { updatedAsset } = applyTelemetryPing(baseAsset, ping);
    assert.equal(updatedAsset.batteryHealth, 20);
    assert.equal(updatedAsset.powertrainHealth, 45);
    assert.equal(updatedAsset.operatingHours, 105);
    assert.equal(updatedAsset.status, "LIMITED");
    assert.ok(updatedAsset.missionReadiness < 80);
  });

  it("normalizes fault with default severity and fields", () => {
    const raw = {
      assetId: "ROV-101",
      description: "Sensor noise detected",
      system: "Sensors & Perception",
    };

    const fault = normalizeFault(raw);
    assert.ok(fault.id.startsWith("FLT-"));
    assert.equal(fault.assetId, "ROV-101");
    assert.equal(fault.severity, "Moderate");
    assert.equal(fault.status, "Active");
  });

  it("normalizes work orders with priority and default status", () => {
    const raw = {
      assetId: "ROV-102",
      issue: "Replace steering actuator",
      priority: "Critical",
    };

    const wo = normalizeWorkOrder(raw);
    assert.ok(wo.id.startsWith("WO-"));
    assert.equal(wo.priority, "Critical");
    assert.equal(wo.status, "Open");
  });

  it("normalizes spare parts catalog items with calculated readiness impact", () => {
    const raw = {
      sku: "TEST-PART-01",
      name: "LiDAR Optical Window",
      onHand: 0,
      requiredForOpenMaintenance: 2,
    };

    const part = normalizeSparePart(raw);
    assert.equal(part.sku, "TEST-PART-01");
    assert.equal(part.partName, "LiDAR Optical Window");
    assert.equal(part.isLimitingReadiness, true);
  });
});
