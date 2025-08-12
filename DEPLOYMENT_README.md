# CodeQuest API Deployment Guide

This guide will walk you through deploying your CodeQuest API to a production server with nginx, SSL, and proper process management.

## Prerequisites

- A VPS or dedicated server running Ubuntu 20.04+ or Debian 11+
- Root access or sudo privileges
- A domain name (api-codequest.com) pointing to your server's IP address
- Basic knowledge of Linux command line

## Server Requirements

- **CPU**: 1+ cores
- **RAM**: 2GB+ (4GB recommended)
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 20.04+ or Debian 11+

## Step-by-Step Deployment

### 1. Server Setup

```bash
# Connect to your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git unzip htop
```

### 2. Install Required Software

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install nginx
apt install -y nginx

# Install certbot for SSL
apt install -y certbot python3-certbot-nginx

# Install PM2 for process management
npm install -g pm2
```

### 3. Deploy Your Application

```bash
# Create application directory
mkdir -p /var/www/api-codequest
cd /var/www/api-codequest

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/your-username/codequest.git .

# Or copy files manually if you prefer

# Install dependencies
npm install

# Build the application
npm run build

# Set proper permissions
chown -R www-data:www-data /var/www/api-codequest
chmod -R 755 /var/www/api-codequest
```

### 4. Configure Environment Variables

```bash
# Create environment file
nano /var/www/api-codequest/.env

# Add your production environment variables:
NODE_ENV=production
PORT=3000
DATABASE_URL=your_database_connection_string
REDIS_URL=your_redis_connection_string
CLERK_SECRET_KEY=your_clerk_secret
# Add other required environment variables
```

### 5. Setup Nginx Configuration

```bash
# Copy the nginx configuration
cp nginx.conf /etc/nginx/sites-available/api-codequest.com

# Enable the site
ln -sf /etc/nginx/sites-available/api-codequest.com /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### 6. Setup PM2 Process Manager

```bash
# Navigate to app directory
cd /var/www/api-codequest

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Follow the instructions provided by the startup command
```

### 7. Configure Firewall

```bash
# Allow SSH
ufw allow ssh

# Allow HTTP and HTTPS
ufw allow 'Nginx Full'

# Enable firewall
ufw --force enable

# Check status
ufw status
```

### 8. Setup SSL Certificate

```bash
# Make sure your domain points to this server first
# Check with: nslookup api-codequest.com

# Get SSL certificate
certbot --nginx -d api-codequest.com -d www.api-codequest.com --non-interactive --agree-tos --email your-email@example.com

# Test automatic renewal
certbot renew --dry-run

# Setup automatic renewal cron job
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
```

### 9. Final Configuration

```bash
# Reload nginx one more time
systemctl reload nginx

# Check PM2 status
pm2 status

# Check nginx status
systemctl status nginx

# Test your API
curl https://api-codequest.com/health
```

## Configuration Files

### Nginx Configuration (`nginx.conf`)
- Reverse proxy to Node.js app on port 3000
- SSL/TLS configuration
- Security headers
- Rate limiting
- Gzip compression
- CORS handling

### PM2 Configuration (`ecosystem.config.js`)
- Process management
- Auto-restart on crashes
- Log management
- Cluster mode for better performance

### Systemd Service (`codequest-api.service`)
- Alternative to PM2 for system-level service management
- Automatic startup on boot
- Security restrictions

## Monitoring and Maintenance

### View Logs

```bash
# PM2 logs
pm2 logs codequest-api

# Nginx access logs
tail -f /var/log/nginx/api-codequest.com.access.log

# Nginx error logs
tail -f /var/log/nginx/api-codequest.com.error.log

# System logs
journalctl -u codequest-api -f
```

### Update Application

```bash
cd /var/www/api-codequest
git pull origin main
npm install
npm run build
pm2 restart codequest-api
```

### SSL Certificate Renewal

```bash
# Manual renewal
certbot renew

# Check renewal status
certbot certificates
```

### Backup

```bash
# Backup application
tar -czf /backup/codequest-$(date +%Y%m%d).tar.gz /var/www/api-codequest

# Backup nginx config
cp /etc/nginx/sites-available/api-codequest.com /backup/
```

## Troubleshooting

### Common Issues

1. **Port 3000 not accessible**
   - Check if the app is running: `pm2 status`
   - Check firewall: `ufw status`
   - Check nginx: `systemctl status nginx`

2. **SSL certificate issues**
   - Verify domain DNS: `nslookup api-codequest.com`
   - Check certbot logs: `certbot certificates`
   - Renew manually: `certbot renew`

3. **Application crashes**
   - Check PM2 logs: `pm2 logs codequest-api`
   - Check system resources: `htop`
   - Restart service: `pm2 restart codequest-api`

### Performance Optimization

1. **Enable HTTP/2**
   - Already configured in nginx.conf

2. **Enable Gzip compression**
   - Already configured in nginx.conf

3. **Database connection pooling**
   - Configure in your application

4. **Redis caching**
   - Ensure Redis is properly configured

## Security Considerations

- Firewall is enabled and configured
- SSL/TLS with modern ciphers
- Security headers implemented
- Rate limiting enabled
- Process runs as www-data user
- File permissions restricted

## Support

If you encounter issues:

1. Check the logs first
2. Verify all services are running
3. Test individual components
4. Check system resources
5. Review configuration files

## Next Steps

After successful deployment:

1. Test all API endpoints
2. Monitor performance and logs
3. Setup monitoring (optional)
4. Configure backups
5. Document any custom configurations

---

**Note**: This guide assumes a standard Ubuntu/Debian server setup. Adjust commands for your specific environment if needed. 