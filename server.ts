import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "SENTINEL Fleet Readiness Operations" });
});

// Gemini-powered Readiness Intelligence Query Endpoint
app.post("/api/intelligence/query", async (req, res) => {
  try {
    const { question, fleetContext } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question parameter is required" });
    }

    const ai = getGeminiClient();

    const systemPrompt = `You are SENTINEL Intelligence, an advanced operational readiness and sustainment AI officer for an autonomous defense ground vehicle fleet.
Context:
- You analyze operational readiness, sustainment, logistics, maintenance work orders, spare-parts supply chain, configuration management, and fault telemetry for 50 autonomous ground vehicles (MRD-001 through MRD-050).
- This is a FICTIONAL sustainment and logistics operations platform.
- STRICT SAFETY & DISCLOSURE BOUNDARY: Focus exclusively on sustainment, fleet availability, supply chain bottlenecks, firmware configurations, predictive failure analysis, and maintenance prioritization. Do NOT discuss or generate content regarding weapons control, targeting, kinetic firing, or offensive combat capabilities.

Operational Data Grounding:
Below is the current real-time fleet snapshot and sustainment state provided from the platform:
${JSON.stringify(fleetContext || {}, null, 2)}

Instructions:
1. Provide concise, direct, tactical answers grounded strictly in the provided data.
2. Quantify numbers, specific asset IDs (e.g. MRD-027, MRD-014), root-cause subsystems (e.g. COMM-MOD-V3, wheel encoders, thermal batteries), and exact technicians or work orders.
3. Structure your response using clear markdown headings, bullet points, and prioritized action recommendations (P1/P2/P3).
4. Clearly state what operations should fix first to maximize Fleet Readiness Percentage.`;

    if (!ai) {
      // Fallback local intelligent analysis if Gemini API key is not yet set
      const fallbackAnalysis = generateLocalIntelligenceResponse(question, fleetContext);
      return res.json({
        answer: fallbackAnalysis,
        groundedInTelemetry: true,
        source: "SENTINEL Edge Heuristics Engine (Fallback)",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: question,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    return res.json({
      answer: response.text || "Analysis generated with no text output.",
      groundedInTelemetry: true,
      source: "Gemini 3.7 Flash — SENTINEL Intelligence Officer",
    });
  } catch (error: any) {
    console.error("Gemini query error:", error);
    // Graceful fallback to heuristic analysis
    const fallbackAnalysis = generateLocalIntelligenceResponse(req.body.question, req.body.fleetContext);
    return res.json({
      answer: fallbackAnalysis,
      groundedInTelemetry: true,
      source: "SENTINEL Local Analytics (Telemetry Fallback)",
      errorNotice: error.message,
    });
  }
});

// Morning Readiness Brief Endpoint
app.post("/api/intelligence/morning-brief", async (req, res) => {
  try {
    const { fleetContext } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate the formal SENTINEL Daily Morning Operational Readiness Brief.
Structure the report with the following standardized operational sections:
1. EXECUTIVE READINESS SUMMARY (Current Readiness %, Mission Capable count vs Non-Mission Capable)
2. PRIMARY READINESS DEGRADATION DRIVERS (Top 3 bottlenecks taking assets offline)
3. SUPPLY CHAIN & SPARE PARTS CONSTRAINTS (Parts stockouts blocking active work orders)
4. CONFIGURATION & FIRMWARE CORRELATIONS (Software release fault patterns, e.g. v4.7.0 comms anomalies)
5. HIGH-RISK ASSETS AT RISK OF IMMINENT DOWN-TIME (Inspection due < 25 operating hours, elevated thermal/encoder telemetry)
6. 24-HOUR ACTION DIRECTIVES (Prioritized list for Maintenance Chiefs & Logistics Leads)`;

    const systemPrompt = `You are the Lead Sustainment & Fleet Operations Officer generating the automated morning readiness brief for an autonomous vehicle fleet of 50 vehicles (MRD-001 to MRD-050).
Ground your analysis entirely on this live dataset:
${JSON.stringify(fleetContext || {}, null, 2)}
Never mention weapons or offensive targeting. Focus on mechanical, electronic, firmware, logistics, and parts readiness.`;

    if (!ai) {
      const localBrief = generateLocalMorningBrief(fleetContext);
      return res.json({ brief: localBrief, source: "SENTINEL Local Telemetry Compiler" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    return res.json({
      brief: response.text || "Morning brief generation completed.",
      source: "Gemini 3.7 Flash — SENTINEL Operations Engine",
    });
  } catch (error: any) {
    console.error("Morning brief error:", error);
    const localBrief = generateLocalMorningBrief(req.body.fleetContext);
    return res.json({ brief: localBrief, source: "SENTINEL Local Telemetry Compiler" });
  }
});

// Heuristic fallback generator for high reliability
function generateLocalIntelligenceResponse(question: string, context: any): string {
  const q = (question || "").toLowerCase();
  const summary = context?.summary || {
    fleetReadiness: 82,
    missionReady: 41,
    maintenance: 4,
    awaitingParts: 2,
    softwareBlocked: 2,
    inspectionDue: 1,
    criticalFaults: 3,
  };

  if (q.includes("why did readiness fall") || q.includes("reducing readiness")) {
    return `### Root-Cause Analysis: Fleet Readiness at ${summary.fleetReadiness}% (41/50 Capable)

The fleet is currently degraded by **9 non-mission capable or limited assets** across three primary operational drivers:

1. **Supply Chain Stoppages (Awaiting Parts)**:
   - 2 vehicles (**MRD-014**, **MRD-027**) are immobilized waiting for **COMM-MOD-V3 Tactical Mesh Transceivers** (0 stock on-hand, 2 required).
2. **Software/Firmware Blockers (v4.7.0 Anomaly)**:
   - 2 vehicles (**MRD-009**, **MRD-033**) are software-isolated following recurring packet-drop faults directly correlated with firmware release **v4.7.0**.
3. **Scheduled & Unscheduled Maintenance**:
   - 4 vehicles (**MRD-004**, **MRD-018**, **MRD-039**, **MRD-045**) are in active depot bays for 500-hour powertrain overhauls and wheel encoder replacements.
4. **Impending Inspection Threshold**:
   - 1 vehicle (**MRD-022**) reached operating limit criteria (<10 operating hours to mandatory inspection).

**Recommended Immediate Action:** Fast-track rush delivery for **COMM-MOD-V3** and push staged OTA firmware upgrade to **v4.8.2** to immediately restore readiness from 82% to 90%.`;
  }

  if (q.includes("prioritize") || q.includes("fix first")) {
    return `### Operations Priority Directives (Highest Availability ROI)

1. **PRIORITY 1: Resolve Zero-Stock Parts Bottleneck on MRD-014 & MRD-027**
   - *Impact*: Restores +4.0% fleet readiness immediately.
   - *Action*: Expedite cross-docking or courier dispatch of 2x \`COMM-MOD-V3\` transceivers from Victor Logistics Depot to Bravo Proving Grounds.
2. **PRIORITY 2: Roll Firmware v4.8.2 to Software-Blocked Units (MRD-009, MRD-033)**
   - *Impact*: Eliminates communication module degradation faults tied to legacy v4.7.0 stack.
   - *Action*: Authorize firmware staging via Configuration Manager.
3. **PRIORITY 3: Complete Work Order WO-8821 (MRD-004 Actuator Calibration)**
   - *Technician*: Senior Specialist Lin (Est. Completion: Today 16:00).
   - *Impact*: Returns MRD-004 to active patrol status.`;
  }

  if (q.includes("spare parts") || q.includes("constraining") || q.includes("stockout")) {
    return `### Spare-Parts Constraint Analysis

- **Critical Blocker: COMM-MOD-V3 (Tactical Mesh Transceiver)**
  - On Hand: **0 units** | Required for Active Maintenance: **2 units** (MRD-014, MRD-027) | Incoming: **5 units** (Lead Time: 3 days).
  - *Risk Level*: **CRITICAL** — Directly responsible for 2 offline assets.
- **Watch Item: ENC-WHEEL-MAG (Magnetic Wheel Encoder)**
  - On Hand: **2 units** | Required: **2 units** | Reorder Point: **4 units**.
  - *Risk Level*: **HIGH** — At zero safety buffer.
- **Recommended Action**: Authorize emergency local supplier transfer for 2x COMM-MOD-V3 transceivers to clear open work orders today.`;
  }

  if (q.includes("software") || q.includes("release") || q.includes("version")) {
    return `### Software Release vs. Fault Correlation Analysis

- **Software 4.7.0 (Highest Risk / Most Faults)**:
  - Total Assets: **11 assets**
  - Fault Incidence: **7 open faults (63.6% fault rate)**, predominantly *Communication Module Degradation* and *Packet Loss*.
- **Software 4.6.1 (Legacy)**:
  - Total Assets: **8 assets** | Fault Rate: **25.0%** (Compute thermal throttling on Gen 2 hardware).
- **Software 4.8.2 (Stable Fleet Standard)**:
  - Total Assets: **27 assets** | Fault Rate: **7.4%** (Extremely stable, highest Mean-Time-Between-Failures).
- **Software 4.9 Beta (Field Pilot)**:
  - Total Assets: **4 assets** | Under test in Nevada Test Range.
- **Directive**: Mandate OTA migration plan for all 11 assets running 4.7.0 to 4.8.2.`;
  }

  if (q.includes("unavailable soon") || q.includes("inspection") || q.includes("predictive")) {
    return `### Predictive At-Risk Asset Assessment (Next 48 Hours)

1. **MRD-022 (FOB Alpha)**: Next inspection in **4 operating hours**. Will automatically lock out upon reaching 0 hours.
2. **MRD-011 (Bravo Proving Grounds)**: Battery thermal anomaly detected (advisory fault). Operating temperature trending +8°C above nominal baseline.
3. **MRD-041 (Sierra Outpost)**: Next inspection in **14 operating hours**; wheel encoder telemetry reporting intermittent tick drops.
4. **MRD-029 (Victor Logistics Depot)**: Operating hours at 488/500 hrs for major Gen 2 driveline servicing.`;
  }

  return `### SENTINEL Ground Telemetry Analysis

- **Current Fleet Readiness**: ${summary.fleetReadiness}% (${summary.missionReady}/50 assets available).
- **Offline / Non-Mission Capable**:
  - Maintenance: ${summary.maintenance} assets
  - Awaiting Parts: ${summary.awaitingParts} assets
  - Software Blocked: ${summary.softwareBlocked} assets
  - Critical Faults: ${summary.criticalFaults} active alerts
- **Top Corrective Action**: Prioritize clearing the 2 parts-blocked vehicles (MRD-014, MRD-027) and upgrading the 11 units on software 4.7.0 to 4.8.2.`;
}

function generateLocalMorningBrief(context: any): string {
  const summary = context?.summary || {
    fleetReadiness: 82,
    missionReady: 41,
    maintenance: 4,
    awaitingParts: 2,
    softwareBlocked: 2,
    inspectionDue: 1,
    criticalFaults: 3,
  };

  return `# SENTINEL DAILY OPERATIONAL READINESS BRIEF
**Timestamp**: 0600Z Operations Cycle | **Scope**: 50 Autonomous Ground Assets (MRD-001 — MRD-050)

---

### 1. EXECUTIVE READINESS SUMMARY
- **Overall Fleet Readiness**: **${summary.fleetReadiness}%**
- **Mission Ready Assets**: **${summary.missionReady} / 50** (${Math.round((summary.missionReady / 50) * 100)}%)
- **Degraded / Offline Assets**: **9** (4 In Maintenance, 2 Awaiting Parts, 2 Software Blocked, 1 Mandatory Inspection Due)
- **Active Critical Faults**: **${summary.criticalFaults}** across all deployed sectors

---

### 2. PRIMARY READINESS DEGRADATION DRIVERS
1. **Supply Chain Parts Stoppage (2 Assets Immobilized)**:
   - **MRD-014 & MRD-027** are down waiting for *COMM-MOD-V3 Tactical Mesh Transceivers*.
2. **Firmware v4.7.0 Comms Degradation (2 Assets Blocked)**:
   - **MRD-009 & MRD-033** isolated due to telemetry dropout faults specific to release 4.7.0.
3. **Scheduled Depot Inspections & Servicing (4 Assets)**:
   - **MRD-004, MRD-018, MRD-039, MRD-045** in maintenance bays for planned 500h powertrain checkups.

---

### 3. SUPPLY CHAIN & SPARE PARTS CONSTRAINTS
- **COMM-MOD-V3 Transceiver**: 0 on hand, 2 required, 5 incoming (ETA: 3 days). **CRITICAL BLOCKER**.
- **ENC-WHEEL-MAG Magnetic Wheel Sensor**: 2 on hand, 2 required, reorder threshold reached.
- **BATT-THERM-800 High-Capacity Core**: 4 on hand, 1 required (Nominal status).

---

### 4. CONFIGURATION & FIRMWARE CORRELATION
- **Software 4.8.2**: Deployed on 27/50 assets (54%). MTBF > 420 hrs. Recommended fleet baseline.
- **Software 4.7.0**: Deployed on 11/50 assets. Accounts for 70% of communication faults. **Flagged for immediate OTA upgrade**.
- **Hardware Gen 3**: 91% average readiness vs 74% on legacy Gen 2 platforms.

---

### 5. AT-RISK ASSETS (NEXT 24–48 HOURS)
- **MRD-022**: Mandatory inspection due in **4 operating hours**.
- **MRD-011**: Battery thermal telemetry approaching upper threshold (+58°C).
- **MRD-041**: Wheel encoder jitter detected on left drive actuator.

---

### 6. 24-HOUR ACTION DIRECTIVES
- [P1] **Logistics Chief**: Expedite 2x COMM-MOD-V3 transceivers to Bravo Proving Grounds.
- [P2] **Systems Engineering**: Initiate staged OTA firmware upgrade from v4.7.0 to v4.8.2 for Team Orion & Team Aegis.
- [P3] **Depot Lead**: Complete work order WO-8821 (MRD-004 actuator calibration) by 1600 hours.`;
}

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SENTINEL Operations Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
