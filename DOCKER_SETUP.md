# Docker Setup Guide for CodeQuest Backend

This guide explains how to run the CodeQuest backend system using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured
- External PostgreSQL database (hosted)

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration (External PostgreSQL)
DATABASE_URL="postgresql://username:password@your-host:port/database"

# Redis Configuration
REDIS_PASSWORD=your_redis_password

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Judge0 Configuration
JUDGE0_RAPIDAPI_URL=https://judge0-extra-ce.p.rapidapi.com
JUDGE0_RAPIDAPI_KEY=your_rapidapi_key
JUDGE0_SELF_HOSTED_KEY=your_judge0_key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Services Overview

The Docker setup includes the following services:

1. **API** (`:3000`) - Main Express.js API server
2. **Optimus Worker** - Background job processor for code execution
3. **Redis** (`:6379`) - Message queue and caching
4. **Judge0** (`:2358`) - Code execution engine

**Note**: PostgreSQL is hosted externally and accessed via the `DATABASE_URL` environment variable.

## Running the System

### Start all services:
```bash
docker-compose up -d
```

### Start specific services:
```bash
# Start only Redis
docker-compose up -d redis

# Start API and worker
docker-compose up -d api optimus-worker
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
```

### Stop all services:
```bash
docker-compose down
```

## Health Checks

- **API**: `http://localhost:3000/health`
- **Redis**: Automatic health check in docker-compose

## Database Setup

Since you're using an external PostgreSQL database, ensure:

1. The `DATABASE_URL` environment variable is correctly set
2. The database is accessible from your Docker containers
3. Prisma migrations have been run on the external database

To run migrations on the external database:

```bash
# Enter the API container
docker-compose exec api sh

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Troubleshooting

### Common Issues:

1. **Port conflicts**: Make sure ports 3000, 6379, and 2358 are available
2. **Environment variables**: Ensure all required variables are set in `.env`
3. **Database connection**: Verify the external PostgreSQL is accessible
4. **Redis connection**: Verify Redis is running and password is correct

### Logs and Debugging:

```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs api

# Check container health
docker-compose exec api curl http://localhost:3000/health

# Test database connection
docker-compose exec api npx prisma db pull
```

## Development vs Production

For development, you can use the same Docker setup. For production:

1. Use proper secrets management
2. Configure proper SSL/TLS
3. Set up proper backup strategies
4. Use production-grade Redis instances
5. Configure proper monitoring and logging

## API Endpoints

Once running, the API will be available at:
- Base URL: `http://localhost:3000`
- Health Check: `http://localhost:3000/health`
- Questions API: `http://localhost:3000/api/questions`
- Submissions API: `http://localhost:3000/api/submit`
- User API: `http://localhost:3000/api/user` 