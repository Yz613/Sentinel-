export interface FleetSummaryMetrics {
  fleetReadiness: number;
  missionReady: number;
  maintenance: number;
  awaitingParts: number;
  softwareBlocked: number;
  inspectionDue: number;
  criticalFaults: number;
  totalAssets: number;
  averageOperatingHours: number;
}

export interface ReadinessDriverReport {
  id: string;
  title: string;
  impactPercent: number;
  severity: "critical" | "high" | "medium" | "low";
  affectedAssetCount: number;
  affectedAssetIds: string[];
  description: string;
  recommendedAction: string;
  category: "maintenance" | "supply_chain" | "software" | "inspection";
}

export class ReadinessService {
  /**
   * Authoritative computation for fleet availability and readiness indicators.
   */
  public static computeSummary(assets: any[], faults: any[]): FleetSummaryMetrics {
    const total = assets.length;
    if (total === 0) {
      return {
        fleetReadiness: 0,
        missionReady: 0,
        maintenance: 0,
        awaitingParts: 0,
        softwareBlocked: 0,
        inspectionDue: 0,
        criticalFaults: 0,
        totalAssets: 0,
        averageOperatingHours: 0,
      };
    }

    let readyCount = 0;
    let maintCount = 0;
    let awaitingPartsCount = 0;
    let swBlockedCount = 0;
    let inspectDueCount = 0;
    let totalReadinessSum = 0;
    let totalHours = 0;

    assets.forEach((a) => {
      totalReadinessSum += Number(a.missionReadiness || 0);
      totalHours += Number(a.operatingHours || 0);

      const status = a.status;
      if (status === "MISSION READY") readyCount++;
      else if (status === "MAINTENANCE") maintCount++;
      else if (status === "AWAITING PARTS") awaitingPartsCount++;
      else if (status === "SOFTWARE BLOCKED") swBlockedCount++;
      else if (status === "INSPECTION DUE") inspectDueCount++;
    });

    const activeCriticalFaults = faults.filter(
      (f) => f.severity === "Critical" && (f.status === "Active" || f.status === "Under Repair")
    ).length;

    const fleetReadiness = Math.round(totalReadinessSum / total);

    return {
      fleetReadiness,
      missionReady: readyCount,
      maintenance: maintCount,
      awaitingParts: awaitingPartsCount,
      softwareBlocked: swBlockedCount,
      inspectionDue: inspectDueCount,
      criticalFaults: activeCriticalFaults,
      totalAssets: total,
      averageOperatingHours: Math.round(totalHours / total),
    };
  }

  /**
   * Evaluates top operational bottlenecks dragging down fleet availability.
   */
  public static computeReadinessDrivers(assets: any[], spareParts: any[]): ReadinessDriverReport[] {
    const drivers: ReadinessDriverReport[] = [];
    if (assets.length === 0) return drivers;

    // Driver 1: Maintenance & Overhaul
    const maintAssets = assets.filter((a) => a.status === "MAINTENANCE");
    if (maintAssets.length > 0) {
      drivers.push({
        id: "driver-maint",
        title: `${maintAssets.length} asset(s) undergoing maintenance or depot overhaul`,
        impactPercent: Number(((maintAssets.length / assets.length) * 100 * 0.45).toFixed(1)),
        severity: "high",
        affectedAssetCount: maintAssets.length,
        affectedAssetIds: maintAssets.map((a) => a.id),
        description: "Vehicles actively in maintenance bays undergoing corrective repair or overhaul.",
        recommendedAction: "Expedite technician shift coverage on open high-priority work orders.",
        category: "maintenance",
      });
    }

    // Driver 2: Spare Parts Stockouts
    const partsBlocked = assets.filter(
      (a) => a.status === "AWAITING PARTS" || (Array.isArray(a.requiredSpareParts) && a.requiredSpareParts.length > 0 && a.status === "LIMITED")
    );
    const stockoutParts = spareParts.filter((p) => p.onHand <= 0 && p.requiredForOpenMaintenance > 0);

    if (partsBlocked.length > 0 || stockoutParts.length > 0) {
      drivers.push({
        id: "driver-parts",
        title: `${partsBlocked.length} vehicle(s) constrained by spare parts availability`,
        impactPercent: Number(((partsBlocked.length / assets.length) * 100 * 0.4).toFixed(1)),
        severity: "critical",
        affectedAssetCount: partsBlocked.length,
        affectedAssetIds: partsBlocked.map((a) => a.id),
        description:
          stockoutParts.length > 0
            ? `Stockout on ${stockoutParts.map((p) => p.sku).join(", ")} is immobilizing mission assets.`
            : "Spare parts replenishment required before returning assets to active readiness.",
        recommendedAction: "Authorize emergency purchase orders or expedite inbound shipments.",
        category: "supply_chain",
      });
    }

    // Driver 3: Software Version Faults & Connectivity
    const swBlocked = assets.filter(
      (a) => a.status === "SOFTWARE BLOCKED" || (a.softwareVersion === "4.7.0" && a.openFaultsCount > 0)
    );
    if (swBlocked.length > 0) {
      drivers.push({
        id: "driver-sw",
        title: `${swBlocked.length} vehicle(s) impacted by firmware stability or packet degradation`,
        impactPercent: Number(((swBlocked.length / assets.length) * 100 * 0.35).toFixed(1)),
        severity: "high",
        affectedAssetCount: swBlocked.length,
        affectedAssetIds: swBlocked.map((a) => a.id),
        description: "Firmware anomalies or mesh synchronization packet drops detected under multi-agent operations.",
        recommendedAction: "Authorize fleet-wide OTA firmware migration to verified stable standard.",
        category: "software",
      });
    }

    // Driver 4: Imminent Inspection Certification Lockout
    const inspectionDue = assets.filter(
      (a) => (a.nextInspectionHours !== undefined && a.nextInspectionHours <= 15) || a.status === "INSPECTION DUE"
    );
    if (inspectionDue.length > 0) {
      drivers.push({
        id: "driver-inspection",
        title: `${inspectionDue.length} asset(s) approaching mandatory inspection interval`,
        impactPercent: 2.0,
        severity: "medium",
        affectedAssetCount: inspectionDue.length,
        affectedAssetIds: inspectionDue.map((a) => a.id),
        description: "Mandatory structural certification or safety interlock inspection interval expires in < 15 operating hours.",
        recommendedAction: "Dispatch field inspection certification team before automatic vehicle lockout triggers.",
        category: "inspection",
      });
    }

    return drivers;
  }
}
