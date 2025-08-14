# Production-ready Dockerfile for CodeQuest Platform
# Multi-stage build for optimized production images

# Stage 1: Base image with security updates
FROM node:20-alpine AS base

# Install system dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S codequest && \
    adduser -S codequest -u 1001 -G codequest

# Set working directory
WORKDIR /app

# Stage 2: Dependencies installation
FROM base AS deps

# Copy package files for dependency installation
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/optimus-worker/package*.json ./apps/optimus-worker/
COPY packages/db/package*.json ./packages/db/
COPY packages/redis/package*.json ./packages/redis/
COPY packages/commons/package*.json ./packages/commons/
COPY packages/typescript-config/package*.json ./packages/typescript-config/

# Install all dependencies (including dev dependencies for building)
# First install root dependencies, then workspace dependencies
RUN npm cache clean --force && \
    npm install -g npm@10.8.2 && \
    npm config set workspaces-update false && \
    npm config set loglevel verbose && \
    npm install --legacy-peer-deps && \
    npm ci --workspaces --only=production=false

# Stage 3: Builder with all source code
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy all source code
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma

# Build all packages and services
RUN npm run build -w @repo/db && \
    npm run build -w @repo/redis && \
    npm run build -w @repo/commons && \
    npm run build -w api && \
    npm run build -w optimus-worker

# Stage 4: Production API Runner
FROM base AS api-runner

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy built application and dependencies
COPY --from=builder --chown=codequest:codequest /app/apps/api/dist ./dist
COPY --from=builder --chown=codequest:codequest /app/apps/api/package*.json ./
COPY --from=builder --chown=codequest:codequest /app/node_modules ./node_modules

# Copy compiled packages
COPY --from=builder --chown=codequest:codequest /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=codequest:codequest /app/packages/db/package*.json ./packages/db/
COPY --from=builder --chown=codequest:codequest /app/packages/redis/dist ./packages/redis/dist
COPY --from=builder --chown=codequest:codequest /app/packages/redis/package*.json ./packages/redis/
COPY --from=builder --chown=codequest:codequest /app/packages/commons/dist ./packages/commons/dist
COPY --from=builder --chown=codequest:codequest /app/packages/commons/package*.json ./packages/commons/

# Copy Prisma client
COPY --from=builder --chown=codequest:codequest /app/node_modules/.prisma ./node_modules/.prisma

# Switch to non-root user
USER codequest

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# Stage 5: Production Worker Runner
FROM base AS worker-runner

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy built application and dependencies
COPY --from=builder --chown=codequest:codequest /app/apps/optimus-worker/dist ./dist
COPY --from=builder --chown=codequest:codequest /app/apps/optimus-worker/package*.json ./
COPY --from=builder --chown=codequest:codequest /app/node_modules ./node_modules

# Copy compiled packages
COPY --from=builder --chown=codequest:codequest /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=codequest:codequest /app/packages/db/package*.json ./packages/db/
COPY --from=builder --chown=codequest:codequest /app/packages/redis/dist ./packages/redis/dist
COPY --from=builder --chown=codequest:codequest /app/packages/redis/package*.json ./packages/redis/
COPY --from=builder --chown=codequest:codequest /app/packages/commons/dist ./packages/commons/dist
COPY --from=builder --chown=codequest:codequest /app/packages/commons/package*.json ./packages/commons/

# Copy Prisma client
COPY --from=builder --chown=codequest:codequest /app/node_modules/.prisma ./node_modules/.prisma

# Switch to non-root user
USER codequest

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the worker
CMD ["node", "dist/index.js"]