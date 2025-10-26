#!/bin/bash
set -e

echo "🚀 Railway Deployment Script"

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "✅ Build completed successfully!"
