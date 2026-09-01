# =============================================================================
# SENTINEL Multi-Stage Production Dockerfile
# Base: Node 22 Alpine (Distroless-aligned, hardened, unprivileged)
# =============================================================================

# --- Stage 1: Build Frontend & Backend ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for maximum Docker layer caching
COPY package*.json ./
RUN npm ci

# Copy project source files
COPY . .

# Run typecheck and bundle production assets
RUN npm run lint
RUN npm run build

# --- Stage 2: Production Minimal Runner ---
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Create application directories and grant ownership to non-root node user
RUN mkdir -p /app/data && chown -R node:node /app

# Install dumb-init for proper PID 1 signal forwarding (SIGTERM / SIGINT)
RUN apk add --no-cache dumb-init

# Copy minimal runtime dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy pre-compiled distribution bundles from builder stage
COPY --from=builder --chown=node:node /app/dist ./dist

# Switch to unprivileged standard node user
USER node

# Expose HTTP service port
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health/live || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.cjs"]
