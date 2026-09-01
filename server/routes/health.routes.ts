import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = Router();

// Standard application health endpoint
router.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "SENTINEL Operational Fleet Readiness Platform",
    supportedModes: ["live", "demo"],
    version: "2.5.0",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Kubernetes Liveness Probe
router.get("/health/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "alive" });
});

// Kubernetes Readiness Probe
router.get("/health/ready", (_req: Request, res: Response) => {
  const dataDir = path.join(process.cwd(), "data");
  let storageReady = false;

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const testFile = path.join(dataDir, ".health_check");
    fs.writeFileSync(testFile, "ok", "utf-8");
    fs.unlinkSync(testFile);
    storageReady = true;
  } catch {
    storageReady = false;
  }

  if (storageReady) {
    res.status(200).json({
      status: "ready",
      storage: "healthy",
      memoryUsageBytes: process.memoryUsage().rss,
    });
  } else {
    res.status(503).json({
      status: "unhealthy",
      storage: "degraded",
    });
  }
});

export const healthRoutes = router;
