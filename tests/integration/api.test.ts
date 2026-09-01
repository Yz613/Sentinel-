import { describe, it } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { EventEmitter } from "events";
import { healthRoutes } from "../../server/routes/health.routes";
import { fleetRoutes } from "../../server/routes/fleet.routes";
import { ingestRoutes } from "../../server/routes/ingest.routes";
import { streamRoutes } from "../../server/routes/stream.routes";
import { requestIdMiddleware, corsMiddleware, securityHeadersMiddleware } from "../../server/middleware/security";
import { authenticate } from "../../server/middleware/auth";
import { errorHandlerMiddleware } from "../../server/middleware/errorHandler";

function createTestApp() {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(corsMiddleware);
  app.use(express.json());

  app.use(healthRoutes);
  app.use(streamRoutes);
  app.use(authenticate);
  app.use(fleetRoutes);
  app.use(ingestRoutes);
  app.use(errorHandlerMiddleware);
  return app;
}

interface DispatchOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  body?: any;
}

interface DispatchResult {
  status: number;
  headers: Record<string, string>;
  body: any;
}

function dispatch(app: express.Express, options: DispatchOptions): Promise<DispatchResult> {
  return new Promise((resolve) => {
    const [pathPart, queryPart] = options.url.split("?");
    const query = Object.fromEntries(new URLSearchParams(queryPart || ""));

    const req: any = new EventEmitter();
    req.method = options.method;
    req.url = options.url;
    req.path = pathPart;
    req.query = query;
    req.headers = { host: "127.0.0.1", ...(options.headers || {}) };
    req.body = options.body || {};
    req.socket = { remoteAddress: "127.0.0.1" };

    const res: any = new EventEmitter();
    res.statusCode = 200;
    res.headers = {};
    res.setHeader = (k: string, v: string) => {
      res.headers[k.toLowerCase()] = v;
    };
    res.getHeader = (k: string) => res.headers[k.toLowerCase()];
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.flushHeaders = () => {};

    let responseData = "";
    res.write = (chunk: any) => {
      responseData += chunk;
      return true;
    };

    const finish = (body: any) => {
      resolve({
        status: res.statusCode,
        headers: res.headers,
        body,
      });
    };

    res.json = (data: any) => finish(data);
    res.send = (data: any) => finish(data);
    res.end = (chunk?: any) => {
      if (chunk) responseData += chunk;
      finish(responseData);
    };

    (app as any).handle(req, res, () => {
      finish(null);
    });
  });
}

describe("API Integration Tests (In-Memory Request Pipeline)", () => {
  const app = createTestApp();

  it("GET /api/health returns service metadata and status ok", async () => {
    const res = await dispatch(app, { method: "GET", url: "/api/health" });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
    assert.equal(res.body.version, "2.5.0");
    assert.ok(res.headers["x-request-id"]);
  });

  it("GET /health/live returns Kubernetes liveness confirmation", async () => {
    const res = await dispatch(app, { method: "GET", url: "/health/live" });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "alive");
  });

  it("GET /health/ready confirms storage health", async () => {
    const res = await dispatch(app, { method: "GET", url: "/health/ready" });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ready");
    assert.equal(res.body.storage, "healthy");
  });

  it("GET /api/fleet?mode=demo returns 50 seed synthetic assets", async () => {
    const res = await dispatch(app, { method: "GET", url: "/api/fleet?mode=demo" });
    assert.equal(res.status, 200);
    assert.equal(res.body.mode, "demo");
    assert.equal(res.body.assets.length, 50);
    assert.ok(res.body.summary.fleetReadiness > 0);
  });

  it("POST /api/v1/telemetry records telemetry ping and reflects on asset", async () => {
    const res = await dispatch(app, {
      method: "POST",
      url: "/api/v1/telemetry",
      headers: { "content-type": "application/json" },
      body: [
        {
          assetId: "INTEG-ROV-01",
          batteryHealth: 92,
          operatingHours: 150,
          status: "MISSION READY",
        },
      ],
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.count, 1);
    assert.equal(res.body.updatedAssets[0].id, "INTEG-ROV-01");
    assert.equal(res.body.updatedAssets[0].batteryHealth, 92);
  });

  it("POST /api/v1/import-csv successfully parses and imports asset records", async () => {
    const csvData = `id,name,location,operatingHours,batteryHealth\nCSV-ROV-99,Test Unit Alpha,Depot Central,80,95`;
    const res = await dispatch(app, {
      method: "POST",
      url: "/api/v1/import-csv",
      headers: { "content-type": "application/json" },
      body: {
        type: "assets",
        csv: csvData,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.importedCount, 1);
  });
});
