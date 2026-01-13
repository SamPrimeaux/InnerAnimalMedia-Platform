#!/bin/bash
# Verification Script - Check if files exist in R2 by testing URLs
# This helps verify files are accessible via the worker

BUCKET="inneranimalmedia-assets"
BASE_URL="https://inneranimalmedia.com"
VERIFIED=0
MISSING=0
MISSING_FILES=()

echo "🔍 Verifying files are accessible in R2..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Function to check URL
check_url() {
  local url=$1
  local name=$2
  
  echo -n "  Checking: $name ... "
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK (HTTP $HTTP_CODE)"
    ((VERIFIED++))
    return 0
  elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ NOT FOUND (HTTP 404)"
    ((MISSING++))
    MISSING_FILES+=("$name - $url")
    return 1
  else
    echo "⚠️  ERROR (HTTP $HTTP_CODE)"
    ((MISSING++))
    MISSING_FILES+=("$name - $url (HTTP $HTTP_CODE)")
    return 1
  fi
}

# Check critical pages
echo "📄 Critical Pages:"
echo "─────────────────────────────────────────────────────────────────"
check_url "$BASE_URL/" "Root homepage"
check_url "$BASE_URL/dashboard" "Dashboard home"
check_url "$BASE_URL/dashboard/index" "Dashboard index"
check_url "$BASE_URL/dashboard/settings" "Settings page"
check_url "$BASE_URL/dashboard/meauxmcp" "MeauxMCP page"
check_url "$BASE_URL/dashboard/library" "Library page"
check_url "$BASE_URL/dashboard/templates" "Templates page"
check_url "$BASE_URL/dashboard/projects" "Projects page"

echo ""
echo "🧩 Shared Components:"
echo "─────────────────────────────────────────────────────────────────"
check_url "$BASE_URL/shared/dashboard-sidebar.html" "Dashboard Sidebar"
check_url "$BASE_URL/shared/sidebar.css" "Sidebar CSS"
check_url "$BASE_URL/shared/dashboard-layout-loader.js" "Layout Loader JS"
check_url "$BASE_URL/shared/mobile-menu.js" "Mobile Menu JS"
check_url "$BASE_URL/shared/quick-connect.html" "Quick Connect"
check_url "$BASE_URL/shared/themes/meaux-tools-24-premium.css" "Themes CSS"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📊 VERIFICATION SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Verified: $VERIFIED files"
echo "❌ Missing: $MISSING files"

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  MISSING FILES:"
  for file in "${MISSING_FILES[@]}"; do
    echo "   - $file"
  done
  echo ""
  echo "💡 Run ./upload-all-to-r2-complete.sh to upload missing files"
else
  echo ""
  echo "✅ ALL CHECKED FILES ARE ACCESSIBLE!"
fi

echo ""
