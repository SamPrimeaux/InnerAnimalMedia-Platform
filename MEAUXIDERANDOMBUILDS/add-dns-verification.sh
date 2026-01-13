#!/bin/bash

# Add Google Search Console verification DNS record to Cloudflare
# Usage: ./add-dns-verification.sh <VERIFICATION_CODE>
# OR set CLOUDFLARE_API_TOKEN and run: CLOUDFLARE_API_TOKEN=your-token ./add-dns-verification.sh <VERIFICATION_CODE>

VERIFICATION_CODE="$1"
DOMAIN="inneranimalmedia.com"

if [ -z "$VERIFICATION_CODE" ]; then
  echo "❌ Error: Google verification code required"
  echo ""
  echo "To get your verification code:"
  echo "1. Go to: https://search.google.com/search-console"
  echo "2. Click 'Add Property' → 'URL prefix'"
  echo "3. Enter: https://${DOMAIN}"
  echo "4. Choose 'HTML tag' or 'DNS record' method"
  echo "5. Copy the verification code"
  echo ""
  echo "Then run: ./add-dns-verification.sh YOUR_VERIFICATION_CODE"
  echo ""
  echo "Or with API token:"
  echo "  CLOUDFLARE_API_TOKEN=your-token ./add-dns-verification.sh YOUR_VERIFICATION_CODE"
  exit 1
fi

echo "🔍 Adding Google Search Console DNS verification..."
echo "   Domain: ${DOMAIN}"
echo "   Verification Code: ${VERIFICATION_CODE}"
echo ""

# Check for API token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "⚠️  CLOUDFLARE_API_TOKEN not set"
  echo "   Will use Cloudflare Dashboard method instead"
  echo ""
  echo "📋 Manual DNS Update Instructions:"
  echo "   1. Go to: https://dash.cloudflare.com"
  echo "   2. Select domain: ${DOMAIN}"
  echo "   3. Navigate to: DNS → Records"
  echo "   4. Click: 'Add record'"
  echo "   5. Fill in:"
  echo "      - Type: TXT"
  echo "      - Name: @ (or leave blank for root)"
  echo "      - Content: google-site-verification=${VERIFICATION_CODE}"
  echo "      - TTL: Auto (or 3600)"
  echo "      - Proxy: DNS only (gray cloud, not orange)"
  echo "   6. Click: 'Save'"
  echo ""
  echo "⏳ Wait 5-10 minutes, then verify in Google Search Console"
  exit 0
fi

# Get Zone ID
echo "🔍 Getting Zone ID for ${DOMAIN}..."
ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json")

ZONE_ID=$(echo "$ZONE_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ZONE_ID" ]; then
  echo "❌ Error: Could not find Zone ID for ${DOMAIN}"
  echo "   Response: $ZONE_RESPONSE" | head -5
  echo ""
  echo "   Please use manual method above or check:"
  echo "   1. Domain is managed by Cloudflare"
  echo "   2. API token has DNS edit permissions"
  echo "   3. API token is valid"
  exit 1
fi

echo "✅ Zone ID: ${ZONE_ID}"
echo ""

# Check if record already exists
echo "🔍 Checking for existing verification record..."
EXISTING=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=TXT&name=${DOMAIN}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" | grep -o "google-site-verification=${VERIFICATION_CODE}")

if [ ! -z "$EXISTING" ]; then
  echo "✅ DNS record already exists!"
  echo "   Content: google-site-verification=${VERIFICATION_CODE}"
  echo ""
  echo "🧪 Testing DNS record..."
  dig TXT ${DOMAIN} +short 2>/dev/null | grep "google-site-verification=${VERIFICATION_CODE}" && \
    echo "✅ DNS record is active!" || \
    echo "⏳ DNS record may still be propagating..."
  exit 0
fi

# Create DNS TXT record
echo "🚀 Creating DNS TXT record..."
CREATE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{
    \"type\": \"TXT\",
    \"name\": \"@\",
    \"content\": \"google-site-verification=${VERIFICATION_CODE}\",
    \"ttl\": 3600,
    \"comment\": \"Google Search Console verification - $(date +%Y-%m-%d)\"
  }")

# Check if successful
if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
  RECORD_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "✅ DNS record created successfully!"
  echo "   Record ID: ${RECORD_ID}"
  echo "   Type: TXT"
  echo "   Name: @ (root domain)"
  echo "   Content: google-site-verification=${VERIFICATION_CODE}"
  echo ""
  echo "⏳ DNS propagation: 5-10 minutes (Cloudflare is usually fast)"
  echo ""
  echo "🧪 Test DNS record:"
  echo "   dig TXT ${DOMAIN} +short"
  echo ""
  echo "✅ Next Steps:"
  echo "   1. Wait 5-10 minutes for DNS propagation"
  echo "   2. Go to: https://search.google.com/search-console"
  echo "   3. Click 'Verify' on your property"
  echo "   4. Once verified, re-request branding verification in Google Cloud Console"
else
  echo "❌ Error creating DNS record"
  echo "$CREATE_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4 | head -1
  echo ""
  echo "Full response:"
  echo "$CREATE_RESPONSE" | head -20
  echo ""
  echo "💡 Tip: Use manual method via Cloudflare Dashboard if API fails"
  exit 1
fi
