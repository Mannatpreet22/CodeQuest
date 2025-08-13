# CodeQuest CI/CD Setup Guide

## What I've Set Up

I've configured a simple file sync CI/CD pipeline for your CodeQuest **backend** that will automatically:

**✅ Compatibility Notes:**
- **Backend-only deployment** - API and Worker services only
- **Simple file sync** - No Docker image building, just syncs updated files
- **Manual deployment** - You run `docker-compose up -d` manually on server
- Works with your existing `docker-compose.yml` (no database service required)
- Flexible directory handling for staging/production

1. **Test your code** on every push/PR
2. **Sync updated files** to your server automatically
3. **Sync to staging** when you push to `develop` branch
4. **Sync to production** when you push to `main` branch
5. **Manual deployment** - You control when to deploy with `docker-compose up -d`

## What You Need to Do

### 1. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

```
PRODUCTION_HOST=143.110.213.227
PRODUCTION_USERNAME=root
PRODUCTION_SSH_KEY=your-ssh-private-key
```

**Note:** Both staging and production deploy to the same server (143.110.213.227) but in different directories.

### 2. Update Environment Variables

Create a `.env` file on your server with these variables:

```bash
# Docker Registry
REGISTRY=ghcr.io
IMAGE_NAME=your-username/codequest
TAG=latest

# Database (your existing database)
DATABASE_URL=your_database_connection_string

# Redis
REDIS_PASSWORD=your_secure_redis_password

# Clerk Authentication
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# API Configuration
API_URL=https://api.codequest.com

# Judge0 Configuration
JUDGE0_RAPIDAPI_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_RAPIDAPI_KEY=your_judge0_rapidapi_key
JUDGE0_SELF_HOSTED_URL=http://host.docker.internal:2358
JUDGE0_SELF_HOSTED_KEY=your_judge0_self_hosted_key
```

### 3. Server Setup

On your server (143.110.213.227), run:

```bash
# Create the application directory
mkdir -p /var/www/codequest
cd /var/www/codequest

# Create .env file with your configuration
# Copy docker-compose.yml to the server
```

## How It Works

### Development Flow
1. **Push to `develop`** → Automatic staging deployment to `/var/www/codequest-staging`
2. **Push to `main`** → Automatic production deployment to `/var/www/codequest`
3. **Manual deployment** → Use GitHub Actions "Deploy to Production" workflow

**Note:** Both environments run on the same server (143.110.213.227) but in separate directories:
- **Staging**: Port 3001 (`/var/www/codequest-staging`)
- **Production**: Port 3000 (`/var/www/codequest`)

### What Happens on Each Sync
1. ✅ Code is tested and built
2. ✅ Updated files are synced to your server
3. ✅ `docker-compose.yml` is copied to the right directory
4. ✅ `.env` file is created with environment variables
5. ✅ You manually run `docker-compose up -d` when ready
6. ✅ Full control over deployment timing

### Monitoring
- **Manual control** - You decide when to deploy
- **Easy rollback** - Just run `docker-compose down && docker-compose up -d`
- **File sync** - Always have the latest code on server

## Files Created

- `.github/workflows/ci.yml` - Continuous integration
- `.github/workflows/cd-staging.yml` - Staging deployment (same server)
- `.github/workflows/cd-production.yml` - Production deployment

## Benefits

✅ **Backend-only deployment** - API and Worker services only  
✅ **Simple file sync** - No complex Docker image building  
✅ **Manual control** - You decide when to deploy  
✅ **Easy rollback** - Just restart containers  
✅ **Always up-to-date** - Latest code always on server  
✅ **No registry needed** - Build Docker images on server  
✅ **Easy debugging** - Full control over deployment process  

## Next Steps

1. **Push this code** to your GitHub repository
2. **Configure the secrets** in GitHub (only need PRODUCTION_HOST, PRODUCTION_USERNAME, PRODUCTION_SSH_KEY)
3. **Set up your server** (143.110.213.227) with the environment variables
4. **Test the pipeline** by pushing to `develop` branch
5. **Deploy manually** by running `docker-compose up -d` on server

**Server Setup:**
```bash
ssh root@143.110.213.227
mkdir -p /var/www/codequest
cd /var/www/codequest
# Create .env file with your configuration
# Copy docker-compose.yml to the server
```

Your CodeQuest **backend** (API + Worker) will now automatically sync files to:
- **Staging**: Port 3001 (`/var/www/codequest-staging`)
- **Production**: Port 3000 (`/var/www/codequest`)

Both on the same server (143.110.213.227)! 

**Deploy manually** by running `docker-compose up -d` when ready! 🚀 