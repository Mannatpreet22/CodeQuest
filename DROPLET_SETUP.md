# CodeQuest Droplet Deployment Guide

This guide will help you deploy your CodeQuest application on a DigitalOcean droplet using Docker and nginx.

## Prerequisites

- A DigitalOcean droplet with Ubuntu 20.04 or later
- Docker and Docker Compose installed
- nginx installed
- Your project code on the droplet

## Quick Setup

### 1. Prepare Your Environment

First, create your `.env` file with the required configuration:

```bash
# Copy the example environment file
cp env.example .env

# Edit the environment file with your actual values
nano .env
```

**Required Environment Variables:**

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/codequest"

# Redis Configuration  
REDIS_PASSWORD="your_secure_redis_password_here"

# Clerk Authentication
CLERK_SECRET_KEY="sk_test_your_clerk_secret_key"
CLERK_PUBLISHABLE_KEY="pk_test_your_clerk_publishable_key"
CLERK_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Judge0 Configuration (RapidAPI)
JUDGE0_RAPIDAPI_URL="https://judge0-ce.p.rapidapi.com"
JUDGE0_RAPIDAPI_KEY="your_rapidapi_key_here"

# API Configuration
NEXT_PUBLIC_API_URL="https://api-codequest.mkhurana.com"
```

### 2. Run the Deployment Script

```bash
# Make the script executable (if not already done)
chmod +x deploy-docker.sh

# Run the deployment script as root
sudo ./deploy-docker.sh
```

The script will:
- Update system packages
- Install required dependencies
- Configure nginx
- Build and start Docker containers
- Set up firewall rules
- Create systemd service for auto-start

### 3. Verify Deployment

Check if everything is running:

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check API health
curl http://api-codequest.mkhurana.com/health

# Check nginx status
systemctl status nginx

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Configure nginx

```bash
# Copy nginx configuration
sudo cp nginx-api.conf /etc/nginx/sites-available/api-codequest.mkhurana.com
sudo ln -sf /etc/nginx/sites-available/api-codequest.mkhurana.com /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Start Docker Services

```bash
# Build and start containers
docker-compose -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## SSL Certificate Setup

To enable HTTPS, install Certbot and get SSL certificates:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api-codequest.mkhurana.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Database Setup

You'll need a PostgreSQL database. You can either:

1. **Use a managed database service** (recommended)
2. **Install PostgreSQL on the droplet**

For local PostgreSQL:

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE codequest;
CREATE USER codequest_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE codequest TO codequest_user;
\q

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://codequest_user:your_password@localhost:5432/codequest"
```

## Monitoring and Maintenance

### View Logs

```bash
# Docker logs
docker-compose -f docker-compose.prod.yml logs -f

# nginx logs
sudo tail -f /var/log/nginx/api-codequest.access.log
sudo tail -f /var/log/nginx/api-codequest.error.log

# System logs
sudo journalctl -u codequest.service -f
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Backup

```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec db pg_dump -U username codequest > backup.sql

# Backup Redis data
docker-compose -f docker-compose.prod.yml exec redis redis-cli SAVE
```

## Troubleshooting

### Common Issues

1. **Port 3000 not accessible**
   - Check if Docker containers are running
   - Verify nginx configuration
   - Check firewall settings

2. **Database connection errors**
   - Verify DATABASE_URL in .env
   - Check if database is running
   - Ensure network connectivity

3. **Redis connection errors**
   - Check REDIS_PASSWORD in .env
   - Verify Redis container is healthy

4. **Judge0 errors**
   - Verify JUDGE0_RAPIDAPI_KEY
   - Check Judge0 container logs

### Useful Commands

```bash
# Restart specific service
docker-compose -f docker-compose.prod.yml restart api

# View container logs
docker-compose -f docker-compose.prod.yml logs api

# Access container shell
docker-compose -f docker-compose.prod.yml exec api sh

# Check resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

## Security Considerations

1. **Firewall**: Only expose necessary ports (22, 80, 443)
2. **Environment Variables**: Keep sensitive data in .env file
3. **Regular Updates**: Keep system and Docker images updated
4. **Backups**: Regular database and configuration backups
5. **Monitoring**: Set up monitoring for uptime and performance

## Support

If you encounter issues:
1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all services are running and healthy
4. Check network connectivity and DNS resolution 