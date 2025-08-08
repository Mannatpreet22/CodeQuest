#!/bin/bash

echo "🚀 Starting CodeQuest deployment..."

# Navigate to project directory
cd /var/www/codequest

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
cd packages/db
npx prisma migrate deploy
npx prisma generate
cd /var/www/codequest

# Restart the application
echo "🔄 Restarting application..."
pm2 restart codequest-api

echo "✅ Deployment completed!"
echo "📊 Check status: pm2 status"
echo "📋 Check logs: pm2 logs codequest-api" 