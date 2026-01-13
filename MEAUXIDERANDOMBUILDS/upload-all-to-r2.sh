#!/bin/bash
# Upload all static files to R2

BUCKET="inneranimalmedia-assets"

echo "🚀 Uploading all static files to R2..."

# Upload index.html
echo "📄 Uploading index.html..."
wrangler r2 object put "$BUCKET/static/index.html" --file=index.html --content-type=text/html --remote

# Upload all dashboard HTML files
echo "📁 Uploading dashboard HTML files..."
for file in dashboard/*.html; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "  → dashboard/$filename"
    wrangler r2 object put "$BUCKET/static/dashboard/$filename" --file="$file" --content-type=text/html --remote
  fi
done

# Upload shared JS files
echo "📦 Uploading shared JS files..."
for file in shared/*.js; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "  → shared/$filename"
    wrangler r2 object put "$BUCKET/static/shared/$filename" --file="$file" --content-type=application/javascript --remote
  fi
done

# Upload shared CSS files
echo "🎨 Uploading shared CSS files..."
for file in shared/*.css; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "  → shared/$filename"
    wrangler r2 object put "$BUCKET/static/shared/$filename" --file="$file" --content-type=text/css --remote
  fi
done

echo "✅ Upload complete! All files are now in R2 at static/ prefix"
