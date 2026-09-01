# SENTINEL — Autonomous Fleet Readiness & Sustainment Platform

## Overview
**SENTINEL** is an operational sustainment and readiness command platform engineered for defense technology and autonomous robotics operations. It continuously monitors, triages, and optimizes the operational availability of deployed autonomous ground fleets.

SENTINEL operates in two distinct, non-destructive modes:
1. **Live Operations Mode**: Ingests, tracks, and analyzes real-world vehicle telemetry, diagnostic fault codes, maintenance work orders, and spare-parts supply chains via flexible REST APIs, CSV spreadsheets, and scheduled polling connectors.
2. **Demo Sandbox Mode**: Instantly launches the pre-configured, 50-vehicle synthetic readiness scenario (`MRD-001` through `MRD-050`) showcasing cross-matrix telemetry correlations, parts bottlenecks, and Gemini AI morning briefs.

The primary question SENTINEL answers for command staff and maintenance operations is:
> **“How much of the fleet is available right now, what is reducing readiness, and what should operations fix first?”**

---

## Plugging In Real Data Sources

SENTINEL was architected to make plugging in real data effortless. It features a smart schema normalizer that automatically maps field name variations from ROS nodes, CAN bus decoders, AWS IoT, Samsara, or custom telematics gateways (e.g. `vehicle_id` vs `id`, `battery_pct` vs `batteryHealth`, `engine_hours` vs `operatingHours`).

### 1. High-Frequency Telemetry Ingestion (Push)
Stream live subsystem health metrics and runtime hours:

```bash
curl -X POST http://localhost:3000/api/v1/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "ROV-101",
    "batteryHealth": 94,
    "powertrainHealth": 92,
    "avionicsHealth": 98,
    "operatingHours": 150,
    "communicationsStatus": "Nominal",
    "status": "MISSION READY",
    "message": "Routine sweep waypoint completed."
  }'
```

### 2. Asset Master Registration
Register or update fleet vehicles, hardware generations, software builds, and assigned units:

```bash
curl -X POST http://localhost:3000/api/v1/assets \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ROV-102",
    "name": "Titan Scout Bravo",
    "location": "Forward Operating Base Alpha",
    "assignedTeam": "Team Orion",
    "hardwareVersion": "Gen 3",
    "softwareVersion": "4.8.2",
    "operatingHours": 210,
    "batteryHealth": 91
  }'
```

### 3. Universal Batch Ingestion
Send assets, telemetry pings, faults, and work orders in a single unified payload:

```bash
curl -X POST http://localhost:3000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "assets": [{ "id": "ROV-103", "name": "Vanguard Carrier 1", "location": "Bravo Proving Grounds" }],
    "telemetry": [{ "assetId": "ROV-103", "batteryHealth": 85, "operatingHours": 420 }],
    "faults": [{ "assetId": "ROV-103", "severity": "Moderate", "system": "Drive & Powertrain", "description": "Wheel encoder pulse variance" }]
  }'
```

### 4. CSV & Spreadsheet Importer
Upload `.csv` or `.json` spreadsheets directly in the **Data Sources** tab in the UI or via API:
- `POST /api/v1/import-csv` with `{ "type": "assets", "csv": "<raw_csv_content>" }`
- Supported entity types: `assets`, `telemetry`, `faults`, `workOrders`, `spareParts`.
- Download pre-built starter CSV templates directly from `/api/v1/templates/:type`.

### 5. Scheduled REST Polling Connectors (Pull)
In the **Data Sources** tab, configure external HTTP endpoints (e.g. `https://api.my-telematics.com/v1/fleet`). Sentinel will automatically poll them on a configurable interval (10s, 30s, 60s, 5m), normalize the response, and update the dashboard in real time.

---

## Core Command Modules

1. **Fleet Command Dashboard**: Real-time fleet availability KPI, availability spectrums, dynamic comparative readiness breakdowns (by Location, Unit, Hardware Generation, and Software Version), and prioritized Top Readiness Drivers.
2. **Asset Matrix**: Comprehensive inventory of all active units with multi-dimensional filtering, searching, sorting, and fast triage.
3. **Data Sources Command Center**: Live webhook documentation, interactive browser-based test sandbox, CSV drag-and-drop importer, scheduled polling connectors, and live telemetry audit stream.
4. **Asset Detail View**: Subsystem telemetry health (battery core, powertrain, avionics, comms), installed components, fault history, work order history, 200-hour inspection certifications, and chronological event timelines.
5. **Maintenance & Depot Bay Operations**: Complete work order lifecycles (Open, In Progress, Awaiting Parts, Quality Inspection, Completed) with technician allocation and parts reservation.
6. **Fault Management & Diagnostic Triage**: Anomaly tracking classified by severity (Critical, Moderate, Low, Advisory) and subsystem impact.
7. **Configuration Management & Telemetry Correlations**: Cross-matrix distribution with synthetic telemetry correlation analytics and batch OTA firmware deployment campaigns.
8. **Spare-Parts Supply Chain & Sustainment**: Automated identification of stockouts immobilizing vehicles with one-click shipment receipt and purchase order replenishment.
9. **Gemini Readiness Intelligence**: Server-side AI intelligence engine powered by Gemini 3.7 Flash generating 0600Z executive morning briefs and answering conversational operational readiness inquiries.

---

## Production Architecture & Infrastructure

- **Backend Framework**: Layered Node.js 22 + Express architecture (`server/routes/`, `server/services/`, `server/middleware/`, `server/db/`).
- **Security & RBAC**: Automated rate-limiting, CSP/HSTS headers, API key validation, and Role-Based Access Control (`admin`, `operator`, `technician`, `viewer`).
- **Real-Time Delivery**: Server-Sent Events (SSE) via `/api/v1/stream` for instant telemetry push updates to connected clients.
- **Persistence Layer**:
  - Out-of-the-box: Thread-safe, indexed `FleetRepository` with atomic write-ahead disk syncing in `data/live_fleet.json`.
  - Production Deployment: Full DDL migration schema for PostgreSQL 16 and TimescaleDB in [`schema.sql`](./schema.sql).
- **Frontend Engine**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide React + Recharts + React Markdown with SSE stream listener.
- **AI Intelligence**: Google Gemini 3.7 Flash with context projection, 0600Z brief caching, and local heuristic fallback.
- **Automated Verification**: Full automated test suite (Unit & Integration) executed via `npm test` (`tsx --test tests/runAll.ts`).
- **Containerization**: Multi-stage unprivileged `Dockerfile` and `docker-compose.yml` stack (Sentinel + PostgreSQL + TimescaleDB + Redis).
- **CI/CD Pipeline**: GitHub Actions workflow (`.github/workflows/ci.yml`) automating linting, tests, build, and container validation.

---

## Compliance & Synthetic Data Disclosure
> **IMPORTANT DISCLOSURE**: In Demo Sandbox Mode, this application operates strictly on fictional systems, synthetic assets (`MRD-001` to `MRD-050`), and simulated telemetry data. It does **not** contain or interface with real-world defense systems, classified information, weapons control, targeting, kinetic firing, or offensive guidance capabilities. It was developed using AI-assisted coding in Google AI Studio to demonstrate operational sustainment and logistics architecture principles.
