# Use Node.js LTS (Latest Stable)
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace package files
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

# Build the app
RUN npm run build -w optimus-worker

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy necessary files and built assets
COPY --from=builder /app/apps/optimus-worker/dist ./dist
COPY --from=builder /app/apps/optimus-worker/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 codequest
USER codequest

CMD ["node", "dist/index.js"]