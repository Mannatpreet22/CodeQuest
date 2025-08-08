#!/bin/bash

# CodeQuest Docker Deployment Script
# Run this script on your droplet to deploy the entire application

set -e  # Exit on any error

echo "🚀 Starting CodeQuest Docker deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y curl wget git unzip

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    print_status "Installing nginx..."
    apt install -y nginx
fi

# Create log directories
print_status "Creating log directories..."
mkdir -p logs/api logs/worker
chmod 755 logs logs/api logs/worker

# Copy nginx configuration
print_status "Setting up nginx configuration..."
cp nginx-api.conf /etc/nginx/sites-available/api-codequest.mkhurana.com
ln -sf /etc/nginx/sites-available/api-codequest.mkhurana.com /etc/nginx/sites-enabled/

# Remove default nginx site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
print_status "Testing nginx configuration..."
if nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration is invalid"
    exit 1
fi

# Reload nginx
systemctl reload nginx

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp env.example .env
    print_warning "Please edit .env file with your actual configuration values before continuing."
    print_warning "Run: nano .env"
    read -p "Press Enter after you've configured the .env file..."
fi

# Build and start Docker containers
print_status "Building and starting Docker containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check API health
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status "✅ API is healthy"
else
    print_warning "⚠️ API health check failed"
fi

# Check Redis health
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli -a "$(grep REDIS_PASSWORD .env | cut -d '=' -f2)" ping > /dev/null 2>&1; then
    print_status "✅ Redis is healthy"
else
    print_warning "⚠️ Redis health check failed"
fi

# Check if containers are running
print_status "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

# Set up firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    print_status "Configuring firewall..."
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw --force enable
    print_status "Firewall configured"
fi

# Create systemd service for auto-start
print_status "Creating systemd service for auto-start..."
cat > /etc/systemd/system/codequest.service << EOF
[Unit]
Description=CodeQuest Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable codequest.service

print_status "✅ Deployment complete!"
echo ""
echo "🌐 Your API should be accessible at: http://api-codequest.mkhurana.com"
echo "🏥 Health check: http://api-codequest.mkhurana.com/health"
echo ""
echo "📋 Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "  - Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  - Update and restart: ./deploy-docker.sh"
echo "  - View nginx logs: tail -f /var/log/nginx/api-codequest.access.log"
echo "  - View nginx error logs: tail -f /var/log/nginx/api-codequest.error.log"
echo ""
echo "🔧 Next steps:"
echo "  1. Set up SSL certificate with Let's Encrypt"
echo "  2. Configure your database (PostgreSQL)"
echo "  3. Update your frontend to use the new API URL"
echo "  4. Test the API endpoints" 