#!/bin/bash

# Complete OAuth Setup Script for InnerAnimal Media
# Run this script to configure GitHub and Google OAuth

set -e

echo "🔐 OAuth Complete Setup Script"
echo "==============================="
echo ""
echo "This script will configure GitHub and Google OAuth for your platform."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

echo "📋 Step 1: GitHub OAuth Setup"
echo "----------------------------"
echo ""
echo "Before proceeding, make sure you have:"
echo "1. Created a GitHub OAuth App at: https://github.com/settings/developers"
echo "2. Set callback URL to: https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback"
echo ""
read -p "Enter GitHub Client ID: " GITHUB_CLIENT_ID
read -sp "Enter GitHub Client Secret (hidden): " GITHUB_CLIENT_SECRET
echo ""

if [ -z "$GITHUB_CLIENT_ID" ] || [ -z "$GITHUB_CLIENT_SECRET" ]; then
    echo "❌ Error: GitHub credentials cannot be empty"
    exit 1
fi

echo ""
echo "Setting GitHub OAuth Worker secrets..."
echo "$GITHUB_CLIENT_ID" | wrangler secret put GITHUB_OAUTH_CLIENT_ID
echo "$GITHUB_CLIENT_SECRET" | wrangler secret put GITHUB_OAUTH_CLIENT_SECRET

echo ""
echo "Updating GitHub OAuth in database..."
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = '$GITHUB_CLIENT_ID',
    client_secret_encrypted = '$GITHUB_CLIENT_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'github';
"

echo ""
echo "✅ GitHub OAuth configured!"

echo ""
echo "📋 Step 2: Google OAuth Setup"
echo "----------------------------"
echo ""
echo "Before proceeding, make sure you have:"
echo "1. Created a Google Cloud Project"
echo "2. Configured OAuth Consent Screen"
echo "3. Created OAuth 2.0 Client ID"
echo "4. Set redirect URI to: https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/callback"
echo ""
read -p "Enter Google Client ID: " GOOGLE_CLIENT_ID
read -sp "Enter Google Client Secret (hidden): " GOOGLE_CLIENT_SECRET
echo ""

if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ Error: Google credentials cannot be empty"
    exit 1
fi

echo ""
echo "Setting Google OAuth Worker secrets..."
echo "$GOOGLE_CLIENT_ID" | wrangler secret put GOOGLE_OAUTH_CLIENT_ID
echo "$GOOGLE_CLIENT_SECRET" | wrangler secret put GOOGLE_OAUTH_CLIENT_SECRET

echo ""
echo "Updating Google OAuth in database..."
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = '$GOOGLE_CLIENT_ID',
    client_secret_encrypted = '$GOOGLE_CLIENT_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'google';
"

echo ""
echo "✅ Google OAuth configured!"

echo ""
echo "🔍 Verifying OAuth providers..."
echo ""
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT 
    id,
    display_name,
    CASE 
        WHEN client_id = 'PLACEHOLDER_CLIENT_ID' OR client_id IS NULL OR client_id = '' THEN '❌ NOT CONFIGURED'
        WHEN LENGTH(client_id) < 10 THEN '⚠️  INVALID (too short)'
        ELSE '✅ CONFIGURED'
    END as status,
    CASE 
        WHEN LENGTH(client_id) > 10 THEN SUBSTR(client_id, 1, 10) || '...'
        ELSE client_id
    END as client_id_preview
FROM oauth_providers 
ORDER BY id;
"

echo ""
echo "🧪 Testing OAuth endpoints..."
echo ""

# Test GitHub OAuth
echo "Testing GitHub OAuth redirect..."
GITHUB_TEST=$(curl -s -o /dev/null -w "%{http_code}" "https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/authorize?user_id=test-user" 2>&1 || echo "000")
if [ "$GITHUB_TEST" = "302" ]; then
    echo "✅ GitHub OAuth: Working (302 redirect)"
else
    echo "⚠️  GitHub OAuth: Unexpected response ($GITHUB_TEST)"
fi

# Test Google OAuth
echo "Testing Google OAuth redirect..."
GOOGLE_TEST=$(curl -s -o /dev/null -w "%{http_code}" "https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/authorize?user_id=test-user" 2>&1 || echo "000")
if [ "$GOOGLE_TEST" = "302" ]; then
    echo "✅ Google OAuth: Working (302 redirect)"
else
    echo "⚠️  Google OAuth: Unexpected response ($GOOGLE_TEST)"
fi

echo ""
echo "🎉 OAuth setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Test full OAuth flow: https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/authorize?user_id=test-user"
echo "2. Verify cookies are set after OAuth callback"
echo "3. Check dashboard access after OAuth login"
echo ""
echo "📚 Documentation saved in: OAUTH_COMPLETE_SETUP_SCRIPT.md"
echo ""
