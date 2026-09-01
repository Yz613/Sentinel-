import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { config } from "./server/config";
import { logger } from "./server/logger";
import { fleetStore } from "./server/store";
import { connectorManager } from "./server/connectors";

// Middlewares
import {
  requestIdMiddleware,
  securityHeadersMiddleware,
  corsMiddleware,
  rateLimiterMiddleware,
} from "./server/middleware/security";
import { authenticate } from "./server/middleware/auth";
import { errorHandlerMiddleware } from "./server/middleware/errorHandler";

// Routes
import { healthRoutes } from "./server/routes/health.routes";
import { streamRoutes } from "./server/routes/stream.routes";
import { fleetRoutes } from "./server/routes/fleet.routes";
import { ingestRoutes } from "./server/routes/ingest.routes";
import { connectorRoutes } from "./server/routes/connectors.routes";
import { intelligenceRoutes } from "./server/routes/intelligence.routes";

const app = express();

// 1. Ingress security & tracing headers
app.use(requestIdMiddleware);
app.use(securityHeadersMiddleware);
app.use(corsMiddleware);
app.use(rateLimiterMiddleware);

// 2. Request parsing
app.use(express.json({ limit: config.maxPayloadSize }));
app.use(express.urlencoded({ extended: true, limit: config.maxPayloadSize }));

// 3. Initialize background telematics connectors
connectorManager.init(async (payload, source) => {
  return fleetStore.ingestBatch(payload, source);
});

// 4. Mount Health and SSE Stream (unauthenticated)
app.use(healthRoutes);
app.use(streamRoutes);

// 5. Authentication & RBAC guard for application and ingestion APIs
app.use(authenticate);

// 6. Mount Domain Routes
app.use(fleetRoutes);
app.use(ingestRoutes);
app.use(connectorRoutes);
app.use(intelligenceRoutes);

// 7. Vite middleware (dev) or production static file serving
async function setupFrontend() {
  if (!config.isProduction) {
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
}

// 8. Error handling middleware (must be registered after routes)
app.use(errorHandlerMiddleware);

// 9. Server Bootstrapping & Graceful Shutdown
async function startServer() {
  await setupFrontend();

  const server = app.listen(config.port, "0.0.0.0", () => {
    logger.info(`SENTINEL Operations Server listening on http://0.0.0.0:${config.port}`, {
      context: "Bootstrap",
      data: {
        environment: config.nodeEnv,
        port: config.port,
        version: "2.5.0",
      },
    });
  });

  // Graceful shutdown handler for Kubernetes / Docker container lifecycle
  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`, { context: "Shutdown" });
    
    server.close(() => {
      logger.info("HTTP server closed. Exiting process.", { context: "Shutdown" });
      process.exit(0);
    });

    // Force exit after 10 seconds if connections refuse to drain
    setTimeout(() => {
      logger.error("Forced shutdown due to timeout", { context: "Shutdown" });
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

startServer().catch((err) => {
  logger.error("Failed to start server", { context: "Bootstrap", error: err });
  process.exit(1);
});

export { app };
