#!/bin/bash
# Upload backup to backupapps R2 bucket

BACKUP_NAME="inneranimalmedia-complete-backup-20260111-134856"
BACKUP_FILE="${BACKUP_NAME}.tar.gz"
SOURCE_BUCKET="inneranimalmedia-assets"
DEST_BUCKET="backupapps"
SOURCE_KEY="backups/${BACKUP_FILE}"

echo "📦 Uploading backup to backupapps bucket..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Method 1: Download from source and upload to destination
echo "📥 Step 1: Downloading backup from ${SOURCE_BUCKET}..."
if wrangler r2 object get "${SOURCE_BUCKET}/${SOURCE_KEY}" --file="/tmp/${BACKUP_FILE}" 2>&1; then
  echo "  ✅ Downloaded successfully"
  echo ""
  echo "📤 Step 2: Uploading to ${DEST_BUCKET}..."
  if wrangler r2 object put "${DEST_BUCKET}/${BACKUP_FILE}" --file="/tmp/${BACKUP_FILE}" --content-type="application/gzip" --remote 2>&1; then
    echo "  ✅ Uploaded successfully!"
    echo ""
    echo "📝 Step 3: Uploading README..."
    if wrangler r2 object put "${DEST_BUCKET}/AGENT_README.md" --file="./AGENT_README.md" --content-type="text/markdown" --remote 2>&1; then
      echo "  ✅ README uploaded successfully!"
      echo ""
      echo "═══════════════════════════════════════════════════════════════"
      echo "✅ BACKUP UPLOAD COMPLETE"
      echo "═══════════════════════════════════════════════════════════════"
      echo ""
      echo "📍 Backup Location:"
      echo "   Bucket: ${DEST_BUCKET}"
      echo "   File: ${BACKUP_FILE}"
      echo ""
      echo "📍 README Location:"
      echo "   Bucket: ${DEST_BUCKET}"
      echo "   File: AGENT_README.md"
      echo ""
      echo "🔗 Access URLs:"
      echo "   R2 Dashboard: https://dash.cloudflare.com"
      echo "   Navigate to: R2 → ${DEST_BUCKET}"
      echo ""
      echo "🧹 Cleaning up temporary file..."
      rm -f "/tmp/${BACKUP_FILE}"
      echo "✅ Done!"
    else
      echo "  ❌ README upload failed"
      exit 1
    fi
  else
    echo "  ❌ Upload failed"
    rm -f "/tmp/${BACKUP_FILE}"
    exit 1
  fi
else
  echo "  ❌ Download failed"
  echo ""
  echo "💡 Alternative: Create fresh backup directly to backupapps"
  echo "   Run: ./create-backup-to-backupapps.sh"
  exit 1
fi
