#!/bin/bash

# InnerAnimalMedia Services Deployment Script

set -e

echo "🚀 Deploying InnerAnimalMedia Services..."

# Check if we're in the right directory
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: wrangler.toml not found. Run this from the inneranimalmediaservices directory."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check environment
ENV=${1:-production}

if [ "$ENV" = "production" ]; then
    echo "🌐 Deploying to PRODUCTION..."
    wrangler deploy --env production
elif [ "$ENV" = "staging" ]; then
    echo "🧪 Deploying to STAGING..."
    wrangler deploy --env staging
else
    echo "❌ Invalid environment. Use 'production' or 'staging'"
    exit 1
fi

echo "✅ Deployment complete!"
echo "📍 URL: https://inneranimalmediaservices${ENV != "production" && echo "-staging" || echo ""}.meauxbility.workers.dev"
