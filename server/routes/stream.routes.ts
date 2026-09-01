import { Router, Request, Response } from "express";
import { eventBus, SentinelEvent } from "../eventBus";
import { logger } from "../logger";

const router = Router();

router.get("/api/v1/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable proxy buffering
  res.flushHeaders();

  // Send initial connection handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ message: "SENTINEL Real-Time Telemetry Stream Connected", timestamp: new Date().toISOString() })}\n\n`);

  // Event handler for bus events
  const onEvent = (event: SentinelEvent) => {
    try {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    } catch (err) {
      logger.debug("Failed to write to SSE client, connection probably closed", { error: err });
    }
  };

  eventBus.on("event", onEvent);

  // Keep-alive heartbeat every 20 seconds
  const keepAliveInterval = setInterval(() => {
    try {
      res.write(": keep-alive\n\n");
    } catch {
      clearInterval(keepAliveInterval);
    }
  }, 20000);

  // Cleanup on client disconnect
  req.on("close", () => {
    clearInterval(keepAliveInterval);
    eventBus.off("event", onEvent);
  });
});

export const streamRoutes = router;
