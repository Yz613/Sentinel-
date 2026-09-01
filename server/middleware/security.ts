import { Request, Response, NextFunction } from "express";
import { config } from "../config";
import crypto from "crypto";

// Map to track IP hit counts for sliding-window rate limiting
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 300000);

/**
 * Attaches unique request correlation ID for end-to-end tracing.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers["x-request-id"] as string;
  const requestId = incomingId || `req_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  (req as any).requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
}

/**
 * Standard security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
 */
export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (config.isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

/**
 * Cross-Origin Resource Sharing (CORS) policy middleware
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, X-Source, X-Request-ID");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
}

/**
 * Sliding window rate-limiting middleware for API protection
 */
export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Exclude health check and SSE stream from aggressive rate limiting
  if (req.path.startsWith("/api/health") || req.path.startsWith("/health") || req.path === "/api/v1/stream") {
    return next();
  }

  const clientIp = req.ip || req.socket.remoteAddress || "unknown_ip";
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(clientIp, {
      count: 1,
      resetAt: now + config.rateLimitWindowMs,
    });
    return next();
  }

  record.count++;
  if (record.count > config.rateLimitMax) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    res.setHeader("Retry-After", retryAfter.toString());
    res.status(429).json({
      type: "https://sentinel.defense.internal/errors/rate-limit-exceeded",
      title: "Too Many Requests",
      status: 429,
      detail: `Rate limit of ${config.rateLimitMax} requests per minute exceeded. Retry after ${retryAfter}s.`,
      requestId: (req as any).requestId,
    });
    return;
  }

  next();
}
