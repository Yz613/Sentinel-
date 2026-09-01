import { Router, Request, Response } from "express";
import { fleetStore } from "../store";
import { IntelligenceService } from "../services/intelligence.service";

const router = Router();

// Readiness Intelligence Query Endpoint
router.post("/api/intelligence/query", async (req: Request, res: Response) => {
  try {
    const question = req.body.question || req.body.query;
    const mode = (req.body.mode === "demo" ? "demo" : "live") as "live" | "demo";

    if (!question) {
      res.status(400).json({ error: "Question parameter is required" });
      return;
    }

    const fleetContext = req.body.fleetContext || fleetStore.getFullSnapshot(mode);
    const result = await IntelligenceService.queryIntelligence(question, fleetContext, mode);

    res.json({
      answer: result.answer,
      markdown: result.answer,
      groundedInTelemetry: result.groundedInTelemetry,
      source: result.source,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process intelligence query" });
  }
});

// Daily Morning Brief Endpoint
router.post("/api/intelligence/morning-brief", async (req: Request, res: Response) => {
  try {
    const mode = (req.body.mode === "demo" ? "demo" : "live") as "live" | "demo";
    const forceRefresh = Boolean(req.body.refresh);
    const fleetContext = req.body.fleetContext || fleetStore.getFullSnapshot(mode);

    const result = await IntelligenceService.getMorningBrief(fleetContext, mode, forceRefresh);

    res.json({
      brief: result.brief,
      briefMarkdown: result.brief,
      source: result.source,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate morning brief" });
  }
});

export const intelligenceRoutes = router;
