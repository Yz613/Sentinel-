import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ReadinessService } from "../../server/services/readiness.service";

describe("Readiness Service Unit Tests", () => {
  it("computes 0 readiness cleanly on empty fleet", () => {
    const summary = ReadinessService.computeSummary([], []);
    assert.equal(summary.totalAssets, 0);
    assert.equal(summary.fleetReadiness, 0);
    assert.equal(summary.missionReady, 0);
    assert.equal(summary.criticalFaults, 0);
  });

  it("computes 100% readiness for fully operational fleet", () => {
    const assets = [
      { id: "A1", status: "MISSION READY", missionReadiness: 100, operatingHours: 100 },
      { id: "A2", status: "MISSION READY", missionReadiness: 100, operatingHours: 200 },
    ];
    const summary = ReadinessService.computeSummary(assets, []);
    assert.equal(summary.totalAssets, 2);
    assert.equal(summary.fleetReadiness, 100);
    assert.equal(summary.missionReady, 2);
    assert.equal(summary.maintenance, 0);
    assert.equal(summary.averageOperatingHours, 150);
  });

  it("extracts readiness degradation drivers properly", () => {
    const assets = [
      { id: "A1", status: "MAINTENANCE", missionReadiness: 50 },
      { id: "A2", status: "AWAITING PARTS", missionReadiness: 40 },
      { id: "A3", status: "SOFTWARE BLOCKED", softwareVersion: "4.7.0", openFaultsCount: 2, missionReadiness: 50 },
      { id: "A4", status: "INSPECTION DUE", nextInspectionHours: 10, missionReadiness: 70 },
      { id: "A5", status: "MISSION READY", missionReadiness: 95 },
    ];

    const parts = [
      { sku: "CRIT-PART", onHand: 0, requiredForOpenMaintenance: 1 },
    ];

    const drivers = ReadinessService.computeReadinessDrivers(assets, parts);
    assert.ok(drivers.length >= 3);

    const maintDriver = drivers.find((d) => d.category === "maintenance");
    assert.ok(maintDriver);
    assert.equal(maintDriver.affectedAssetCount, 1);

    const partsDriver = drivers.find((d) => d.category === "supply_chain");
    assert.ok(partsDriver);
    assert.equal(partsDriver.severity, "critical");

    const swDriver = drivers.find((d) => d.category === "software");
    assert.ok(swDriver);

    const inspectDriver = drivers.find((d) => d.category === "inspection");
    assert.ok(inspectDriver);
  });
});
