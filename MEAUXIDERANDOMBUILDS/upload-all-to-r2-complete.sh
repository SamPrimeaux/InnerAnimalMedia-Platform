#!/bin/bash
# Complete R2 Upload Script - Ensures ALL production files are in R2
# Run this BEFORE cleaning local drive!

BUCKET="inneranimalmedia-assets"
UPLOAD_COUNT=0
ERROR_COUNT=0
ERRORS=()

echo "🚀 Complete R2 Upload - Ensuring ALL files are in production..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Function to upload file with error handling
upload_file() {
  local r2_path=$1
  local local_file=$2
  local content_type=$3
  
  if [ ! -f "$local_file" ]; then
    echo "  ❌ File not found: $local_file"
    ((ERROR_COUNT++))
    ERRORS+=("File not found: $local_file")
    return 1
  fi
  
  echo "  📤 Uploading: $local_file → $r2_path"
  if wrangler r2 object put "$BUCKET/$r2_path" --file="$local_file" --content-type="$content_type" --remote 2>&1; then
    ((UPLOAD_COUNT++))
    echo "     ✅ Uploaded successfully"
    return 0
  else
    echo "     ❌ Upload failed"
    ((ERROR_COUNT++))
    ERRORS+=("Upload failed: $r2_path")
    return 1
  fi
}

# ============================================================================
# 1. ROOT HTML PAGES
# ============================================================================
echo "📄 Step 1: Uploading root HTML pages..."
echo "─────────────────────────────────────────────────────────────────"

# Root index.html
if [ -f "index.html" ]; then
  upload_file "static/index.html" "index.html" "text/html"
fi

# Other root pages
for file in about.html contact.html pricing.html login.html terms.html services.html work.html features.html tools.html; do
  if [ -f "$file" ]; then
    upload_file "static/$file" "$file" "text/html"
  fi
done

echo ""

# ============================================================================
# 2. DASHBOARD HTML PAGES (29 files)
# ============================================================================
echo "📁 Step 2: Uploading dashboard HTML pages..."
echo "─────────────────────────────────────────────────────────────────"

for file in dashboard/*.html; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    upload_file "static/dashboard/$filename" "$file" "text/html"
  fi
done

echo ""

# ============================================================================
# 3. SHARED HTML COMPONENTS
# ============================================================================
echo "🧩 Step 3: Uploading shared HTML components..."
echo "─────────────────────────────────────────────────────────────────"

# Shared root HTML files
for file in shared/*.html; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    upload_file "static/shared/$filename" "$file" "text/html"
  fi
done

# Shared components subdirectory
if [ -d "shared/components" ]; then
  for file in shared/components/*.html; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      upload_file "static/shared/components/$filename" "$file" "text/html"
    fi
  done
fi

echo ""

# ============================================================================
# 4. SHARED JAVASCRIPT FILES
# ============================================================================
echo "📦 Step 4: Uploading shared JavaScript files..."
echo "─────────────────────────────────────────────────────────────────"

for file in shared/*.js; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    upload_file "static/shared/$filename" "$file" "application/javascript"
  fi
done

echo ""

# ============================================================================
# 5. SHARED CSS FILES
# ============================================================================
echo "🎨 Step 5: Uploading shared CSS files..."
echo "─────────────────────────────────────────────────────────────────"

for file in shared/*.css; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    upload_file "static/shared/$filename" "$file" "text/css"
  fi
done

echo ""

# ============================================================================
# 6. THEME FILES
# ============================================================================
echo "🎨 Step 6: Uploading theme CSS files..."
echo "─────────────────────────────────────────────────────────────────"

if [ -d "shared/themes" ]; then
  for file in shared/themes/*.css; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      upload_file "static/shared/themes/$filename" "$file" "text/css"
    fi
  done
fi

echo ""

# ============================================================================
# 7. LEGAL PAGES
# ============================================================================
echo "⚖️  Step 7: Uploading legal pages..."
echo "─────────────────────────────────────────────────────────────────"

if [ -d "legal" ]; then
  for file in legal/*.html; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      upload_file "static/legal/$filename" "$file" "text/html"
    fi
  done
fi

echo ""

# ============================================================================
# 8. STATIC DIRECTORY (if exists)
# ============================================================================
echo "📁 Step 8: Uploading static directory files..."
echo "─────────────────────────────────────────────────────────────────"

if [ -d "static" ]; then
  find static -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" \) | while read -r file; do
    if [ -f "$file" ]; then
      # Determine content type
      case "$file" in
        *.html) content_type="text/html" ;;
        *.css) content_type="text/css" ;;
        *.js) content_type="application/javascript" ;;
        *.json) content_type="application/json" ;;
        *) content_type="application/octet-stream" ;;
      esac
      upload_file "static/$file" "$file" "$content_type"
    fi
  done
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📊 UPLOAD SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Successfully uploaded: $UPLOAD_COUNT files"
echo "❌ Errors: $ERROR_COUNT files"

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  ERRORS ENCOUNTERED:"
  for error in "${ERRORS[@]}"; do
    echo "   - $error"
  done
fi

echo ""
if [ $ERROR_COUNT -eq 0 ]; then
  echo "✅ ALL FILES SUCCESSFULLY UPLOADED TO R2!"
  echo "✅ Safe to clean local drive (but keep backups just in case)"
else
  echo "⚠️  SOME UPLOADS FAILED - Please review errors above"
  echo "⚠️  DO NOT DELETE LOCAL FILES until all errors are resolved"
fi

echo ""
echo "📋 R2 Bucket: $BUCKET"
echo "📋 Prefix: static/"
echo ""
echo "🔍 To verify, check your site at: https://inneranimalmedia.com"
