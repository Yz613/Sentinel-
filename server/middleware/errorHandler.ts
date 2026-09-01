import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

export function errorHandlerMiddleware(err: any, req: Request, res: Response, _next: NextFunction): void {
  const requestId = (req as any).requestId;
  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected internal server error occurred.";

  logger.error(`API Error on ${req.method} ${req.path}`, {
    requestId,
    context: "ErrorHandler",
    error: err instanceof Error ? err : new Error(message),
    data: {
      status,
      path: req.path,
      method: req.method,
    },
  });

  res.status(status).json({
    type: "https://sentinel.defense.internal/errors/internal-error",
    title: status >= 500 ? "Internal Server Error" : "Request Error",
    status,
    detail: process.env.NODE_ENV === "production" && status >= 500
      ? "An internal error occurred. Please reference the request ID when reporting."
      : message,
    requestId,
    timestamp: new Date().toISOString(),
  });
}
