import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { logger } from "../logger";

interface BriefCacheEntry {
  brief: string;
  generatedAt: number;
  mode: "live" | "demo";
}

export class IntelligenceService {
  private static geminiClient: GoogleGenAI | null = null;
  private static briefCache: Map<string, BriefCacheEntry> = new Map();
  private static readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  private static getClient(): GoogleGenAI | null {
    if (!config.geminiApiKey) return null;
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenAI({
        apiKey: config.geminiApiKey,
        httpOptions: {
          headers: {
            "User-Agent": "sentinel-fleet-ops/2.0",
          },
        },
      });
    }
    return this.geminiClient;
  }

  /**
   * Projects and filters fleet snapshot into a compact, token-efficient prompt context.
   */
  private static projectContext(snapshot: any): any {
    const assets = Array.isArray(snapshot?.assets) ? snapshot.assets : [];
    const degradedAssets = assets.filter(
      (a: any) => a.status !== "MISSION READY" || a.missionReadiness < 85 || (a.openFaultsCount && a.openFaultsCount > 0)
    );
    const criticalFaults = (snapshot?.faults || []).filter(
      (f: any) => f.severity === "Critical" || f.status === "Active"
    );
    const activeWorkOrders = (snapshot?.workOrders || []).filter(
      (w: any) => w.status !== "Completed"
    );
    const stockoutParts = (snapshot?.spareParts || []).filter(
      (p: any) => p.onHand <= 0 && p.requiredForOpenMaintenance > 0
    );

    return {
      mode: snapshot?.mode || "live",
      summary: snapshot?.summary || {},
      readinessDrivers: snapshot?.readinessDrivers || [],
      degradedAssetsCount: degradedAssets.length,
      sampleDegradedAssets: degradedAssets.slice(0, 15).map((a: any) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        readiness: a.missionReadiness,
        faults: a.openFaultsCount,
        firmware: a.softwareVersion,
        hardware: a.hardwareVersion,
        maintenanceNote: a.maintenanceStatus,
      })),
      activeCriticalFaults: criticalFaults.slice(0, 10),
      openWorkOrders: activeWorkOrders.slice(0, 10),
      criticalPartsBottlenecks: stockoutParts,
    };
  }

  /**
   * Executes AI Readiness Intelligence Query with context projection and heuristic fallback.
   */
  public static async queryIntelligence(question: string, fleetContext: any, mode: "live" | "demo" = "live"): Promise<{ answer: string; source: string; groundedInTelemetry: boolean }> {
    const projectedContext = this.projectContext(fleetContext);
    const ai = this.getClient();

    if (!ai) {
      const fallback = this.generateLocalResponse(question, projectedContext);
      return {
        answer: fallback,
        source: "SENTINEL Edge Heuristics Engine (Telemetry Grounded)",
        groundedInTelemetry: true,
      };
    }

    try {
      const systemPrompt = `You are SENTINEL Intelligence, an operational readiness and sustainment AI officer for autonomous vehicle fleets.
Operating Mode: ${mode === "live" ? "LIVE OPERATIONAL FLEET" : "DEMO FLEET SANDBOX"}

Compliance & Safety Boundary:
Focus strictly on vehicle availability, maintenance triage, telemetry diagnostics, supply chain bottlenecks, and firmware stability.
Never discuss weapons control, targeting, kinetic firing, or offensive combat capabilities.

Operational Fleet State:
${JSON.stringify(projectedContext, null, 2)}

Instructions:
1. Ground answers strictly in the operational fleet metrics above.
2. Be precise with asset IDs, subsystem names, and technician assignments.
3. Structure your response with markdown headings, bullet points, and prioritized action directives (P1/P2/P3).
4. Direct operations clearly on what to fix first to maximize Fleet Readiness Percentage.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: question,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        },
      });

      return {
        answer: response.text || "Analysis complete with no output.",
        source: "Gemini 3.7 Flash — SENTINEL Intelligence Officer",
        groundedInTelemetry: true,
      };
    } catch (err: any) {
      logger.warn("Gemini query failed, using heuristic fallback", { error: err });
      const fallback = this.generateLocalResponse(question, projectedContext);
      return {
        answer: fallback,
        source: "SENTINEL Local Telemetry Fallback",
        groundedInTelemetry: true,
      };
    }
  }

  /**
   * Generates or serves cached Daily 0600Z Morning Readiness Brief.
   */
  public static async getMorningBrief(fleetContext: any, mode: "live" | "demo" = "live", forceRefresh: boolean = false): Promise<{ brief: string; source: string }> {
    const cacheKey = `${mode}_brief`;
    const cached = this.briefCache.get(cacheKey);
    const now = Date.now();

    if (!forceRefresh && cached && now - cached.generatedAt < this.CACHE_TTL_MS) {
      return {
        brief: cached.brief,
        source: "Gemini 3.7 Flash — Cached 0600Z Brief",
      };
    }

    const projectedContext = this.projectContext(fleetContext);
    const ai = this.getClient();

    if (!ai) {
      const fallback = this.generateLocalMorningBrief(projectedContext);
      return {
        brief: fallback,
        source: "SENTINEL Local Readiness Compiler",
      };
    }

    try {
      const prompt = `Generate the formal SENTINEL Daily 0600Z Operational Readiness Brief.
Standard Operational Sections:
1. EXECUTIVE READINESS SUMMARY (Readiness %, Mission Capable count vs Non-Mission Capable)
2. PRIMARY READINESS DEGRADATION DRIVERS (Top bottlenecks taking vehicles offline)
3. SUPPLY CHAIN & SPARE PARTS CONSTRAINTS (Parts stockouts blocking active work orders)
4. CONFIGURATION & FIRMWARE CORRELATIONS (Software build fault correlations)
5. HIGH-RISK ASSETS AT RISK OF IMMINENT DOWN-TIME (Inspection due < 25 hours, degraded telemetry)
6. 24-HOUR ACTION DIRECTIVES (P1/P2/P3 for Maintenance Chiefs & Logistics Leads)`;

      const systemPrompt = `You are the Lead Sustainment & Fleet Operations Officer for autonomous ground fleets.
Operating Mode: ${mode === "live" ? "LIVE FLEET" : "DEMO SANDBOX"}
Telemetry Context:
${JSON.stringify(projectedContext, null, 2)}
Strict Boundary: Focus on mechanical, electronic, firmware, logistics, and parts readiness. Never mention weapons or offensive targeting.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        },
      });

      const brief = response.text || "Morning brief generation completed.";
      this.briefCache.set(cacheKey, { brief, generatedAt: now, mode });

      return {
        brief,
        source: "Gemini 3.7 Flash — SENTINEL Operations Engine",
      };
    } catch (err: any) {
      logger.warn("Morning brief generation failed, using fallback", { error: err });
      const fallback = this.generateLocalMorningBrief(projectedContext);
      return {
        brief: fallback,
        source: "SENTINEL Local Telemetry Compiler",
      };
    }
  }

  private static generateLocalResponse(question: string, context: any): string {
    const summary = context.summary || {};
    const q = (question || "").toLowerCase();

    if (summary.totalAssets === 0) {
      return `### Live Fleet Status: No Operational Assets Connected Yet
The platform is operating in **Live Operations Mode**, but no live data sources have sent telemetry yet.
Navigate to **Data Sources** to send a live telemetry ping or import vehicles via CSV.`;
    }

    if (q.includes("why") || q.includes("reducing readiness") || q.includes("degraded")) {
      return `### Root-Cause Readiness Analysis: Fleet at ${summary.fleetReadiness || 0}%
The fleet has **${(summary.totalAssets || 0) - (summary.missionReady || 0)} degraded or offline assets**:
- **Depot Maintenance**: ${summary.maintenance || 0} unit(s)
- **Awaiting Parts**: ${summary.awaitingParts || 0} unit(s)
- **Software / Mesh Blocked**: ${summary.softwareBlocked || 0} unit(s)
- **Impending Inspection Lockout**: ${summary.inspectionDue || 0} unit(s)
- **Active Critical Faults**: ${summary.criticalFaults || 0} alert(s)

**Immediate Directive:** Expedite parts fulfillment for immobilized units to gain immediate readiness lift.`;
    }

    return `### SENTINEL Ground Telemetry Analysis
- **Current Fleet Readiness**: ${summary.fleetReadiness || 0}% (${summary.missionReady || 0}/${summary.totalAssets || 0} units available).
- **Maintenance Bay**: ${summary.maintenance || 0} active orders.
- **Supply Chain**: ${summary.awaitingParts || 0} assets awaiting spare components.
- **Critical Diagnostics**: ${summary.criticalFaults || 0} active faults requiring engineer triage.`;
  }

  private static generateLocalMorningBrief(context: any): string {
    const summary = context.summary || {};
    return `# SENTINEL DAILY OPERATIONAL READINESS BRIEF
**Timestamp**: 0600Z Operations Cycle | **Scope**: ${summary.totalAssets || 0} Operational Assets

---

### 1. EXECUTIVE READINESS SUMMARY
- **Overall Fleet Readiness**: **${summary.fleetReadiness || 0}%**
- **Mission Ready Assets**: **${summary.missionReady || 0} / ${summary.totalAssets || 0}**
- **Degraded / Offline Assets**: **${(summary.totalAssets || 0) - (summary.missionReady || 0)}**
- **Active Critical Faults**: **${summary.criticalFaults || 0}**

---

### 2. PRIMARY READINESS DEGRADATION DRIVERS
1. **Depot Maintenance**: ${summary.maintenance || 0} vehicles undergoing active overhaul.
2. **Supply Chain Bottlenecks**: ${summary.awaitingParts || 0} vehicles grounded awaiting spare parts.
3. **Firmware & Telemetry Anomalies**: ${summary.softwareBlocked || 0} vehicles software-isolated.

---

### 3. 24-HOUR ACTION DIRECTIVES
- [P1] **Logistics Chief**: Expedite courier delivery for zero-stock parts holding back vehicles.
- [P2] **Depot Lead**: Accelerate turnaround on corrective maintenance orders.
- [P3] **Field Ops**: Certify vehicles nearing the 200-hour inspection interval.`;
  }
}
