# CodeQuest CI/CD Setup Guide

## What I've Set Up

I've configured a complete CI/CD pipeline for your CodeQuest project that will automatically:

**✅ Compatibility Notes:**
- Works with your existing `docker-compose.yml` (no database service required)
- Automatically detects if database service exists for migrations/backups
- Flexible directory handling for staging/production
- Basic health checks that work with your current setup

1. **Test your code** on every push/PR
2. **Build Docker images** and push them to GitHub Container Registry
3. **Deploy to staging** when you push to `develop` branch
4. **Deploy to production** when you push to `main` branch
5. **Handle rollbacks** automatically if deployments fail

## What You Need to Do

### 1. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

```
STAGING_HOST=your-staging-server-ip
STAGING_USERNAME=your-staging-username
STAGING_SSH_KEY=your-staging-ssh-private-key

PRODUCTION_HOST=your-production-server-ip
PRODUCTION_USERNAME=your-production-username
PRODUCTION_SSH_KEY=your-production-ssh-private-key

SLACK_WEBHOOK_URL=your-slack-webhook-url (optional)
```

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
NEXT_PUBLIC_API_URL=https://your-domain.com

# Judge0 Configuration
JUDGE0_RAPIDAPI_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_RAPIDAPI_KEY=your_judge0_rapidapi_key
JUDGE0_SELF_HOSTED_URL=http://host.docker.internal:2358
JUDGE0_SELF_HOSTED_KEY=your_judge0_self_hosted_key
```

### 3. Server Setup

On your server, run:

```bash
# Make the deploy script executable
chmod +x scripts/deploy.sh

# Run the first deployment
./scripts/deploy.sh deploy
```

## How It Works

### Development Flow
1. **Push to `develop`** → Automatic staging deployment
2. **Push to `main`** → Automatic production deployment
3. **Manual deployment** → Use GitHub Actions "Deploy to Production" workflow

### What Happens on Each Deployment
1. ✅ Code is tested and built
2. ✅ Docker images are created and pushed to registry
3. ✅ Database migrations run automatically
4. ✅ New containers start alongside old ones
5. ✅ Health checks ensure new version works
6. ✅ Old containers are removed (zero-downtime)
7. ✅ Automatic rollback if anything fails

### Monitoring
- **Health checks** on all services
- **Automatic rollbacks** on failures
- **Database backups** before each deployment
- **Slack notifications** on success/failure

## Files Created

- `.github/workflows/ci.yml` - Continuous integration
- `.github/workflows/cd-staging.yml` - Staging deployment
- `.github/workflows/cd-production.yml` - Production deployment
- `scripts/deploy.sh` - Server deployment script
- `scripts/setup-server.sh` - Initial server setup

## Benefits

✅ **No more manual server setup** - Everything is automated  
✅ **Zero-downtime deployments** - Users never see downtime  
✅ **Automatic rollbacks** - Failed deployments are reverted  
✅ **Database safety** - Backups before every deployment  
✅ **Health monitoring** - Services are constantly checked  
✅ **Easy scaling** - Just push to the right branch  

## Next Steps

1. **Push this code** to your GitHub repository
2. **Configure the secrets** in GitHub
3. **Set up your server** with the environment variables
4. **Test the pipeline** by pushing to `develop` branch

Your CodeQuest platform will now automatically deploy every time you update the code! 🚀 