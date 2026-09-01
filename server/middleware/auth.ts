import { Request, Response, NextFunction } from "express";
import { config } from "../config";

export type UserRole = "admin" | "operator" | "technician" | "viewer";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  authMethod: "api-key" | "session" | "internal-dev";
}

/**
 * Validates API key or internal bearer authorization.
 * In development or demo mode, permits seamless local access while validating production keys.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Allow health check, public status, and demo queries without credentials
  if (
    req.path.startsWith("/api/health") || 
    req.path.startsWith("/health") || 
    req.path === "/api/fleet" ||
    req.path === "/api/v1/stream" ||
    req.path.startsWith("/api/v1/templates")
  ) {
    (req as any).user = { id: "anonymous", role: "viewer", authMethod: "internal-dev" };
    return next();
  }

  const apiKeyHeader = req.headers["x-api-key"] as string;
  const authHeader = req.headers["authorization"] as string;
  let token = apiKeyHeader;

  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // If token is provided, validate against configured valid API keys
  if (token) {
    if (config.apiKeys.includes(token)) {
      (req as any).user = { id: `key-${token.substring(0, 6)}`, role: "admin", authMethod: "api-key" };
      return next();
    } else {
      res.status(401).json({
        type: "https://sentinel.defense.internal/errors/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid API credentials provided.",
        requestId: (req as any).requestId,
      });
      return;
    }
  }

  // If in development mode or non-production environment, permit internal-dev role
  if (!config.isProduction) {
    (req as any).user = { id: "dev-operator", role: "admin", authMethod: "internal-dev" };
    return next();
  }

  // In strict production, require authorization header
  res.status(401).json({
    type: "https://sentinel.defense.internal/errors/missing-credentials",
    title: "Unauthorized",
    status: 401,
    detail: "Missing X-API-Key or Bearer authorization token.",
    requestId: (req as any).requestId,
  });
}

/**
 * Role-Based Access Control (RBAC) guard.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user: AuthenticatedUser | undefined = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({
        type: "https://sentinel.defense.internal/errors/forbidden",
        title: "Forbidden",
        status: 403,
        detail: `Insufficient privileges. Required role: [${allowedRoles.join(", ")}]. Current role: [${user?.role || "none"}].`,
        requestId: (req as any).requestId,
      });
      return;
    }
    next();
  };
}
