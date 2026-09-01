import { Router, Request, Response } from "express";
import { connectorManager } from "../connectors";
import { fleetStore } from "../store";
import { requireRole } from "../middleware/auth";

const router = Router();

// List Polling Connectors
router.get("/api/v1/connectors", (_req: Request, res: Response) => {
  res.json({
    connectors: connectorManager.list(),
  });
});

// Create Polling Connector
router.post("/api/v1/connectors", requireRole("admin"), (req: Request, res: Response) => {
  try {
    const { name, url, intervalSeconds, headers, enabled } = req.body;
    if (!name || !url) {
      res.status(400).json({ error: "Connector name and url are required" });
      return;
    }
    const created = connectorManager.add({
      name,
      url,
      intervalSeconds: Number(intervalSeconds) || 30,
      headers: headers || {},
      enabled: enabled !== false,
    });
    fleetStore.logActivity("Connectors Manager", "Connector Added", `Created polling connector: ${name} (${url})`, 0, "success");
    res.json({ success: true, connector: created });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update Polling Connector
router.put("/api/v1/connectors/:id", requireRole("admin"), (req: Request, res: Response) => {
  const updated = connectorManager.update(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  res.json({ success: true, connector: updated });
});

// Delete Polling Connector
router.delete("/api/v1/connectors/:id", requireRole("admin"), (req: Request, res: Response) => {
  const removed = connectorManager.remove(req.params.id);
  res.json({ success: removed });
});

// Manually Trigger Connector Poll
router.post("/api/v1/connectors/:id/trigger", requireRole("admin", "operator"), async (req: Request, res: Response) => {
  const result = await connectorManager.pollNow(req.params.id);
  res.json(result);
});

export const connectorRoutes = router;
