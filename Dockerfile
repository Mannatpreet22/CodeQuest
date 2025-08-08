# Use Node.js LTS (Latest Stable)
FROM node:18-alpine AS base

# Install curl for health checks
RUN apk add --no-cache curl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy all workspace package files
COPY apps/api/package*.json ./apps/api/
COPY apps/optimus-worker/package*.json ./apps/optimus-worker/
COPY packages/db/package*.json ./packages/db/
COPY packages/redis/package*.json ./packages/redis/
COPY packages/commons/package*.json ./packages/commons/
COPY packages/typescript-config/package*.json ./packages/typescript-config/

# Install dependencies
RUN npm install

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma

# Build all packages and apps
RUN npm run build -w @repo/db
RUN npm run build -w @repo/redis
RUN npm run build -w @repo/commons
RUN npm run build -w api
RUN npm run build -w optimus-worker

# Runner stage for API
FROM base AS api-runner
WORKDIR /app

ENV NODE_ENV production

# Copy necessary files and built assets
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package*.json ./packages/db/
COPY --from=builder /app/packages/redis/dist ./packages/redis/dist
COPY --from=builder /app/packages/redis/package*.json ./packages/redis/
COPY --from=builder /app/packages/commons/dist ./packages/commons/dist
COPY --from=builder /app/packages/commons/package*.json ./packages/commons/

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 codequest
USER codequest

EXPOSE 3000

CMD ["node", "dist/index.js"]

# Runner stage for Optimus Worker
FROM base AS worker-runner
WORKDIR /app

ENV NODE_ENV production

# Copy necessary files and built assets
COPY --from=builder /app/apps/optimus-worker/dist ./dist
COPY --from=builder /app/apps/optimus-worker/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package*.json ./packages/db/
COPY --from=builder /app/packages/redis/dist ./packages/redis/dist
COPY --from=builder /app/packages/redis/package*.json ./packages/redis/
COPY --from=builder /app/packages/commons/dist ./packages/commons/dist
COPY --from=builder /app/packages/commons/package*.json ./packages/commons/

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 codequest
USER codequest

EXPOSE 3001

CMD ["node", "dist/index.js"] 