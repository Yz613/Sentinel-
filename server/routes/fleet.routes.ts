import { Router, Request, Response } from "express";
import { fleetStore } from "../store";
import { requireRole } from "../middleware/auth";

const router = Router();

// Fleet Operational Snapshot API
router.get("/api/fleet", (req: Request, res: Response) => {
  const mode = (req.query.mode === "demo" ? "demo" : "live") as "live" | "demo";
  const snapshot = fleetStore.getFullSnapshot(mode);
  res.json(snapshot);
});

// Clear Live Fleet Data
router.post("/api/fleet/clear-live", requireRole("admin"), (_req: Request, res: Response) => {
  fleetStore.clearLiveData();
  res.json({ success: true, message: "Live fleet data cleared." });
});

// Load Sample Live Data
router.post("/api/fleet/sample-live", requireRole("admin", "operator"), (_req: Request, res: Response) => {
  fleetStore.loadSampleLiveData();
  res.json({ success: true, message: "Sample live assets loaded." });
});

// Reset Demo Data
router.post("/api/fleet/reset-demo", (_req: Request, res: Response) => {
  fleetStore.resetDemoData();
  res.json({ success: true, message: "Demo fleet reset to factory seed." });
});

export const fleetRoutes = router;
