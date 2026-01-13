#!/bin/bash
# Download Backup from R2 - Simple Script

BACKUP_FILE="inneranimalmedia-complete-backup-20260111-134856.tar.gz"
BUCKET="inneranimalmedia-assets"
OUTPUT_FILE="./inneranimalmedia-backup.tar.gz"

echo "📥 Downloading backup from R2..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

if wrangler r2 object get "${BUCKET}/backups/${BACKUP_FILE}" --file="${OUTPUT_FILE}" 2>&1; then
  echo ""
  echo "✅ Backup downloaded successfully!"
  echo ""
  echo "📂 File saved to: ${OUTPUT_FILE}"
  echo "📊 File size: $(du -h "${OUTPUT_FILE}" | cut -f1)"
  echo ""
  echo "🔍 Verify backup integrity:"
  echo "   tar -tzf ${OUTPUT_FILE} | head -20"
  echo ""
  echo "💾 Copy to external drive:"
  echo "   cp ${OUTPUT_FILE} /Volumes/YOUR_EXTERNAL_DRIVE/"
  echo ""
  echo "📦 Extract backup:"
  echo "   tar -xzf ${OUTPUT_FILE}"
else
  echo ""
  echo "❌ Download failed!"
  echo ""
  echo "Check if backup exists:"
  echo "   wrangler r2 object list ${BUCKET} --prefix=backups/"
  exit 1
fi
