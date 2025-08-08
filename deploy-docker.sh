#!/bin/bash

echo "🚀 Starting CodeQuest deployment..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build and restart containers
echo "🔨 Building and restarting containers..."
docker-compose build
docker-compose up -d

# Run database migrations (if needed)
echo "🗄️ Running database migrations..."
docker-compose exec api npx prisma migrate deploy

echo "✅ Deployment completed!"
echo "📊 Check status: docker-compose ps"
echo "📋 Check logs: docker-compose logs -f" 