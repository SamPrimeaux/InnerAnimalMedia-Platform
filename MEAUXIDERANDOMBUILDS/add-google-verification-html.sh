#!/bin/bash

# Add Google Search Console verification via HTML meta tag
# Usage: ./add-google-verification-html.sh <VERIFICATION_CODE>

VERIFICATION_CODE="$1"

if [ -z "$VERIFICATION_CODE" ]; then
  echo "❌ Error: Google verification code required"
  echo ""
  echo "To get your verification code:"
  echo "1. Go to: https://search.google.com/search-console"
  echo "2. Click 'Add Property' → 'URL prefix'"
  echo "3. Enter: https://inneranimalmedia.com"
  echo "4. Choose 'HTML tag' method"
  echo "5. Copy the content value from the meta tag"
  echo "   Example: <meta name=\"google-site-verification\" content=\"YOUR_CODE\" />"
  echo "   Copy just the code part (not the quotes)"
  echo ""
  echo "Then run: ./add-google-verification-html.sh YOUR_VERIFICATION_CODE"
  exit 1
fi

echo "🔍 Adding Google Search Console verification to index.html..."
echo "   Verification Code: ${VERIFICATION_CODE}"
echo ""

# Check if meta tag already exists
if grep -q "google-site-verification" index.html; then
  echo "⚠️  Google verification meta tag already exists in index.html"
  echo "   Updating with new verification code..."
  
  # Update existing meta tag
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/<meta name=\"google-site-verification\" content=\".*\" \/>/<meta name=\"google-site-verification\" content=\"${VERIFICATION_CODE}\" \/>/" index.html
  else
    # Linux
    sed -i "s/<meta name=\"google-site-verification\" content=\".*\" \/>/<meta name=\"google-site-verification\" content=\"${VERIFICATION_CODE}\" \/>/" index.html
  fi
else
  echo "✅ Adding new Google verification meta tag..."
  
  # Add meta tag after charset meta tag (high in <head>)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "/<meta charset=\"UTF-8\">/a\\
    <meta name=\"google-site-verification\" content=\"${VERIFICATION_CODE}\" />
" index.html
  else
    # Linux
    sed -i "/<meta charset=\"UTF-8\">/a <meta name=\"google-site-verification\" content=\"${VERIFICATION_CODE}\" />" index.html
  fi
fi

echo "✅ Verification meta tag added/updated in index.html"
echo ""
echo "🚀 Next Steps:"
echo "   1. Review index.html to verify the meta tag is correct"
echo "   2. Deploy updated index.html to R2:"
echo "      wrangler r2 object put inneranimalmedia-assets/static/index.html --file=./index.html --content-type=\"text/html\" --remote"
echo "   3. Wait 5-10 minutes for deployment"
echo "   4. Go to Google Search Console and click 'Verify'"
echo ""
echo "📋 Meta tag location: Should be in <head> section, right after <meta charset=\"UTF-8\">"
