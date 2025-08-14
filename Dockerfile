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
    npm config set workspaces-update false && \
    npm config set loglevel verbose && \
    npm install --legacy-peer-deps && \
    npm install --workspaces --include=dev

# Stage 3: Builder with all source code
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/turbo.json ./

# Copy all source code
COPY . .

# Ensure workspace is properly linked
RUN npm install --workspaces

# Verify workspace setup
RUN npm list --workspaces

# Configure workspace settings
RUN npm config set workspaces-update false

# Ensure TypeScript is available globally
RUN npm install -g typescript@5.8.2 && \
    tsc --version

# Generate Prisma client
RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma

# Verify workspace setup and build all packages and services
RUN npm list && \
    npm config list && \
    npm run build --workspace=@repo/db && \
    npm run build --workspace=@repo/redis && \
    npm run build --workspace=@repo/commons && \
    npm run build --workspace=api && \
    npm run build --workspace=optimus-worker

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