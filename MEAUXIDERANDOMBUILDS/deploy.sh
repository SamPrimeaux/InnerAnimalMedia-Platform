#!/bin/bash

# iAccess Platform Deployment Script
# Usage: ./deploy.sh [platform] [environment]
# Platforms: cloudflare, vercel, both
# Environments: production, staging

PLATFORM=${1:-cloudflare}
ENV=${2:-production}

echo "🚀 Deploying iAccess Platform to $PLATFORM ($ENV)..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if wrangler is installed
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        echo "❌ Wrangler CLI not found. Install with: npm install -g wrangler"
        exit 1
    fi
}

# Deploy to Cloudflare Pages
deploy_cloudflare() {
    echo -e "${BLUE}📦 Deploying to Cloudflare Pages...${NC}"
    check_wrangler
    
    if [ "$ENV" = "production" ]; then
        wrangler pages deploy . --project-name=iaccess-platform --branch=main
    else
        wrangler pages deploy . --project-name=iaccess-platform-staging --branch=staging
    fi
    
    echo -e "${GREEN}✅ Deployed to Cloudflare Pages!${NC}"
    echo "🌐 URL: https://iaccess-platform.pages.dev"
}

# Deploy to Cloudflare Pages
deploy_pages() {
    echo -e "${BLUE}📦 Deploying to Cloudflare Pages...${NC}"
    check_wrangler
    
    if [ "$ENV" = "production" ]; then
        wrangler pages deploy . --project-name=iaccess-platform --branch=main
    else
        wrangler pages deploy . --project-name=iaccess-platform-staging --branch=staging
    fi
    
    echo -e "${GREEN}✅ Deployed to Cloudflare Pages!${NC}"
    echo "🌐 URL: https://iaccess-platform.pages.dev"
}

# Deploy API Worker
deploy_worker() {
    echo -e "${BLUE}⚙️  Deploying API Worker...${NC}"
    check_wrangler
    
    if [ "$ENV" = "production" ]; then
        wrangler deploy --env production
    else
        wrangler deploy --env staging
    fi
    
    echo -e "${GREEN}✅ API Worker deployed!${NC}"
    echo "🌐 API URL: https://iaccess-api.meauxbility.workers.dev"
}

# Main deployment logic
case $PLATFORM in
    cloudflare|pages)
        deploy_pages
        ;;
    worker|api)
        deploy_worker
        ;;
    both|all)
        deploy_pages
        deploy_worker
        ;;
    *)
        echo "❌ Unknown platform: $PLATFORM"
        echo "Usage: ./deploy.sh [pages|worker|both] [production|staging]"
        echo "  pages - Deploy static site to Cloudflare Pages"
        echo "  worker - Deploy API Worker"
        echo "  both - Deploy both"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Deployment complete!${NC}"
