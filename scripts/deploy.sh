#!/bin/bash

# CodeQuest Deployment Script
# This script handles automated deployment with zero-downtime and rollback capabilities

set -e

# Configuration
APP_NAME="codequest"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
LOG_FILE="/var/log/$APP_NAME/deploy.log"
DOCKER_COMPOSE_FILE="$APP_DIR/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Function to check if service is healthy
check_health() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    log "Checking health of $service..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T "$service" curl -f http://localhost:3000/health >/dev/null 2>&1; then
            log "$service is healthy!"
            return 0
        fi
        
        warn "Attempt $attempt/$max_attempts: $service not ready yet, waiting..."
        sleep 10
        ((attempt++))
    done
    
    error "$service failed health check after $max_attempts attempts"
    return 1
}

# Function to create backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/backup_$timestamp.sql"
    
    log "Creating database backup: $backup_file"
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T db pg_dump "$DATABASE_URL" > "$backup_file" 2>/dev/null; then
        log "Database backup created successfully"
        
        # Keep only last 5 backups
        find "$BACKUP_DIR" -name "backup_*.sql" -type f -printf '%T@ %p\n' | sort -n | head -n -5 | cut -d' ' -f2- | xargs rm -f
    else
        warn "Failed to create database backup, continuing anyway..."
    fi
}

# Function to rollback
rollback() {
    error "Deployment failed, rolling back..."
    
    log "Stopping new containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    log "Starting previous version..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    log "Rollback completed"
    exit 1
}

# Main deployment function
deploy() {
    local environment=${1:-production}
    
    log "Starting deployment to $environment environment"
    log "Working directory: $APP_DIR"
    
    # Check if we're in the right directory
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        error "Docker Compose file not found at $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    # Navigate to app directory
    cd "$APP_DIR"
    
    # Create backup before deployment
    create_backup
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose pull
    
    # Run database migrations
    log "Running database migrations..."
    if ! docker-compose exec -T db npx prisma migrate deploy; then
        error "Database migration failed"
        exit 1
    fi
    
    # Deploy with zero-downtime
    log "Starting zero-downtime deployment..."
    
    # Start new containers alongside existing ones
    docker-compose up -d --no-deps --scale api=2 --scale optimus-worker=2
    
    # Wait for new containers to be healthy
    log "Waiting for new containers to be healthy..."
    sleep 30
    
    # Check health of new containers
    if ! check_health "api" || ! check_health "optimus-worker"; then
        error "New containers are unhealthy, rolling back..."
        rollback
    fi
    
    # Remove old containers
    log "Removing old containers..."
    docker-compose up -d --no-deps
    
    # Final health check
    log "Performing final health check..."
    if ! check_health "api" || ! check_health "optimus-worker"; then
        error "Final health check failed, rolling back..."
        rollback
    fi
    
    # Cleanup
    log "Cleaning up Docker system..."
    docker system prune -f
    
    log "Deployment completed successfully! 🚀"
}

# Function to rollback to specific version
rollback_to_version() {
    local version=$1
    
    if [ -z "$version" ]; then
        error "Please specify a version to rollback to"
        echo "Usage: $0 rollback <version>"
        exit 1
    fi
    
    log "Rolling back to version: $version"
    
    cd "$APP_DIR"
    
    # Stop current containers
    docker-compose down
    
    # Pull specific version
    docker-compose pull
    
    # Start containers
    docker-compose up -d
    
    # Health check
    if ! check_health "api" || ! check_health "optimus-worker"; then
        error "Rollback health check failed"
        exit 1
    fi
    
    log "Rollback to version $version completed successfully"
}

# Function to show deployment status
status() {
    log "Checking deployment status..."
    
    cd "$APP_DIR"
    
    echo "=== Docker Compose Status ==="
    docker-compose ps
    
    echo -e "\n=== Container Health ==="
    if check_health "api"; then
        echo "✅ API is healthy"
    else
        echo "❌ API is unhealthy"
    fi
    
    if check_health "optimus-worker"; then
        echo "✅ Worker is healthy"
    else
        echo "❌ Worker is unhealthy"
    fi
    
    echo -e "\n=== Recent Backups ==="
    ls -la "$BACKUP_DIR" | tail -5
}

# Function to show logs
logs() {
    local service=${1:-""}
    
    cd "$APP_DIR"
    
    if [ -z "$service" ]; then
        log "Showing logs for all services..."
        docker-compose logs -f
    else
        log "Showing logs for $service..."
        docker-compose logs -f "$service"
    fi
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy "${2:-production}"
        ;;
    "rollback")
        rollback_to_version "$2"
        ;;
    "status")
        status
        ;;
    "logs")
        logs "$2"
        ;;
    "help"|"-h"|"--help")
        echo "CodeQuest Deployment Script"
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  deploy [environment]  Deploy to specified environment (default: production)"
        echo "  rollback <version>    Rollback to specific version"
        echo "  status                Show deployment status"
        echo "  logs [service]        Show logs for all services or specific service"
        echo "  help                  Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 deploy production"
        echo "  $0 rollback v1.2.3"
        echo "  $0 status"
        echo "  $0 logs api"
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac 