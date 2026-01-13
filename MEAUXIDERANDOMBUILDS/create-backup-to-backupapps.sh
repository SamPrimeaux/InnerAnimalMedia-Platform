#!/bin/bash
# Create backup directly to backupapps bucket

BACKUP_NAME="inneranimalmedia-complete-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_NAME}.tar.gz"
DEST_BUCKET="backupapps"

echo "📦 Creating backup and uploading to backupapps bucket..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Create temporary backup directory
TEMP_DIR=$(mktemp -d)
BACKUP_DIR="${TEMP_DIR}/${BACKUP_NAME}"
mkdir -p "${BACKUP_DIR}"

echo "📁 Copying files to backup directory..."
echo "─────────────────────────────────────────────────────────────────"

# Copy critical directories
cp -r dashboard "${BACKUP_DIR}/" 2>/dev/null
cp -r shared "${BACKUP_DIR}/" 2>/dev/null
cp -r legal "${BACKUP_DIR}/" 2>/dev/null
cp -r src "${BACKUP_DIR}/" 2>/dev/null
if [ -d "static" ]; then
  cp -r static "${BACKUP_DIR}/" 2>/dev/null
fi

# Copy root files
cp index.html "${BACKUP_DIR}/" 2>/dev/null
for file in *.html; do
  if [ -f "$file" ]; then
    cp "$file" "${BACKUP_DIR}/" 2>/dev/null
  fi
done

# Copy config and scripts
cp wrangler.toml "${BACKUP_DIR}/" 2>/dev/null
cp package.json "${BACKUP_DIR}/" 2>/dev/null 2>/dev/null || true
mkdir -p "${BACKUP_DIR}/scripts"
cp *.sh "${BACKUP_DIR}/scripts/" 2>/dev/null 2>/dev/null || true

# Copy README
cp AGENT_README.md "${BACKUP_DIR}/README.md" 2>/dev/null || cp AGENT_README.md "${BACKUP_DIR}/AGENT_README.md" 2>/dev/null

echo ""
echo "🗜️  Creating tar.gz archive..."
cd "${TEMP_DIR}"
tar -czf "${BACKUP_FILE}" "${BACKUP_NAME}" 2>&1
FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

echo "  ✅ Archive created: ${BACKUP_FILE} (${FILE_SIZE})"
echo ""

echo "📤 Uploading to ${DEST_BUCKET}..."
if wrangler r2 object put "${DEST_BUCKET}/${BACKUP_FILE}" \
  --file="${TEMP_DIR}/${BACKUP_FILE}" \
  --content-type="application/gzip" \
  --remote 2>&1; then
  
  echo "  ✅ Backup uploaded successfully!"
  echo ""
  echo "📝 Uploading README..."
  if wrangler r2 object put "${DEST_BUCKET}/AGENT_README.md" \
    --file="./AGENT_README.md" \
    --content-type="text/markdown" \
    --remote 2>&1; then
    
    echo "  ✅ README uploaded successfully!"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "✅ BACKUP COMPLETE"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "📍 Backup Location:"
    echo "   Bucket: ${DEST_BUCKET}"
    echo "   File: ${BACKUP_FILE}"
    echo "   Size: ${FILE_SIZE}"
    echo ""
    echo "📍 README Location:"
    echo "   Bucket: ${DEST_BUCKET}"
    echo "   File: AGENT_README.md"
    echo ""
    echo "🔗 Access via Cloudflare Dashboard:"
    echo "   https://dash.cloudflare.com → R2 → ${DEST_BUCKET}"
    echo ""
    echo "💾 Local backup saved at:"
    echo "   ${TEMP_DIR}/${BACKUP_FILE}"
    echo ""
    echo "💡 Copy to external drive:"
    echo "   cp ${TEMP_DIR}/${BACKUP_FILE} /Volumes/YOUR_EXTERNAL_DRIVE/"
  else
    echo "  ❌ README upload failed"
    exit 1
  fi
else
  echo "  ❌ Backup upload failed"
  exit 1
fi
