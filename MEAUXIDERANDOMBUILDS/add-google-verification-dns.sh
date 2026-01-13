#!/bin/bash

# Script to add Google Search Console verification DNS record to Cloudflare
# Usage: ./add-google-verification-dns.sh <VERIFICATION_CODE>

if [ -z "$1" ]; then
  echo "❌ Error: Google verification code required"
  echo ""
  echo "Usage: ./add-google-verification-dns.sh <VERIFICATION_CODE>"
  echo ""
  echo "To get your verification code:"
  echo "1. Go to: https://search.google.com/search-console"
  echo "2. Add property: https://inneranimalmedia.com"
  echo "3. Choose 'HTML tag' method OR 'DNS record' method"
  echo "4. Copy the verification code"
  echo ""
  echo "Example: ./add-google-verification-dns.sh abc123xyz456"
  exit 1
fi

VERIFICATION_CODE="$1"
DOMAIN="inneranimalmedia.com"
ZONE_NAME="${DOMAIN}"

echo "🔍 Adding Google Search Console verification DNS record..."
echo "   Domain: ${DOMAIN}"
echo "   Verification Code: ${VERIFICATION_CODE}"
echo ""

# Check if CLOUDFLARE_API_TOKEN is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "⚠️  CLOUDFLARE_API_TOKEN not set in environment"
  echo "   Trying to get from wrangler secrets..."
  
  # Try to get from wrangler (if available)
  if command -v wrangler &> /dev/null; then
    echo "   Note: You may need to set CLOUDFLARE_API_TOKEN as environment variable"
    echo "   Or use Cloudflare Dashboard to add the DNS record manually"
  fi
  
  echo ""
  echo "📋 Manual DNS Update Instructions:"
  echo "   1. Go to: https://dash.cloudflare.com"
  echo "   2. Select domain: ${DOMAIN}"
  echo "   3. Go to DNS > Records"
  echo "   4. Click 'Add record'"
  echo "   5. Type: TXT"
  echo "   6. Name: @ (or root domain)"
  echo "   7. Content: google-site-verification=${VERIFICATION_CODE}"
  echo "   8. Click 'Save'"
  echo ""
  exit 1
fi

# Get Zone ID for the domain
echo "🔍 Getting Zone ID for ${DOMAIN}..."
ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ZONE_ID" ]; then
  echo "❌ Error: Could not find Zone ID for ${DOMAIN}"
  echo "   Check that:"
  echo "   1. Domain is managed by Cloudflare"
  echo "   2. CLOUDFLARE_API_TOKEN has DNS edit permissions"
  echo "   3. API token is valid"
  exit 1
fi

echo "✅ Found Zone ID: ${ZONE_ID}"
echo ""

# Check if DNS record already exists
echo "🔍 Checking if verification record already exists..."
EXISTING=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=TXT&name=${DOMAIN}&content=google-site-verification=${VERIFICATION_CODE}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$EXISTING" ]; then
  echo "✅ DNS record already exists!"
  echo "   Record ID: ${EXISTING}"
  echo ""
  echo "🧪 Testing DNS record..."
  dig TXT ${DOMAIN} +short | grep "google-site-verification=${VERIFICATION_CODE}" && echo "✅ DNS record is active!" || echo "⏳ DNS record may still be propagating..."
  exit 0
fi

# Create DNS TXT record
echo "🚀 Creating DNS TXT record..."
RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{
    \"type\": \"TXT\",
    \"name\": \"@\",
    \"content\": \"google-site-verification=${VERIFICATION_CODE}\",
    \"ttl\": 3600,
    \"comment\": \"Google Search Console verification - Added $(date +%Y-%m-%d)\"
  }")

# Check if creation was successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  RECORD_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "✅ DNS record created successfully!"
  echo "   Record ID: ${RECORD_ID}"
  echo "   Type: TXT"
  echo "   Name: @ (root domain)"
  echo "   Content: google-site-verification=${VERIFICATION_CODE}"
  echo ""
  echo "⏳ DNS propagation usually takes 5 minutes to 24 hours"
  echo "   Usually ready within 5-10 minutes for Cloudflare"
  echo ""
  echo "🧪 Test DNS record:"
  echo "   dig TXT ${DOMAIN} +short"
  echo ""
  echo "✅ Next Steps:"
  echo "   1. Wait 5-10 minutes for DNS propagation"
  echo "   2. Go back to Google Search Console"
  echo "   3. Click 'Verify' button"
  echo "   4. If successful, re-request branding verification in Google Cloud Console"
else
  echo "❌ Error creating DNS record"
  echo "$RESPONSE" | grep -o '"message":"[^"]*' | head -1 | cut -d'"' -f4
  echo ""
  echo "Full response:"
  echo "$RESPONSE" | head -20
  exit 1
fi
