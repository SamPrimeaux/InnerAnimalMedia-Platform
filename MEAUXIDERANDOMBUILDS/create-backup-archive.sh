#!/bin/bash
# Create Complete Backup Archive - Tar.gz all critical files
# Upload to R2 and provide download link

BACKUP_NAME="inneranimalmedia-complete-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_NAME}.tar.gz"
BUCKET="inneranimalmedia-assets"
R2_KEY="backups/${BACKUP_FILE}"

echo "📦 Creating Complete Backup Archive..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Create temporary backup directory
TEMP_DIR=$(mktemp -d)
BACKUP_DIR="${TEMP_DIR}/${BACKUP_NAME}"
mkdir -p "${BACKUP_DIR}"

echo "📁 Copying files to backup directory..."
echo "─────────────────────────────────────────────────────────────────"

# Copy critical directories
echo "  📂 Copying dashboard/..."
cp -r dashboard "${BACKUP_DIR}/" 2>/dev/null

echo "  📂 Copying shared/..."
cp -r shared "${BACKUP_DIR}/" 2>/dev/null

echo "  📂 Copying legal/..."
cp -r legal "${BACKUP_DIR}/" 2>/dev/null

echo "  📂 Copying static/..."
if [ -d "static" ]; then
  cp -r static "${BACKUP_DIR}/" 2>/dev/null
fi

echo "  📂 Copying src/..."
cp -r src "${BACKUP_DIR}/" 2>/dev/null

echo "  📄 Copying root HTML files..."
for file in *.html; do
  if [ -f "$file" ]; then
    cp "$file" "${BACKUP_DIR}/" 2>/dev/null
  fi
done

echo "  📄 Copying configuration files..."
cp wrangler.toml "${BACKUP_DIR}/" 2>/dev/null
cp package.json "${BACKUP_DIR}/" 2>/dev/null 2>/dev/null || true
cp package-lock.json "${BACKUP_DIR}/" 2>/dev/null 2>/dev/null || true

echo "  📄 Copying scripts..."
mkdir -p "${BACKUP_DIR}/scripts"
cp upload-all-to-r2-complete.sh "${BACKUP_DIR}/scripts/" 2>/dev/null
cp upload-all-to-r2.sh "${BACKUP_DIR}/scripts/" 2>/dev/null
cp verify-r2-files.sh "${BACKUP_DIR}/scripts/" 2>/dev/null
cp create-backup-archive.sh "${BACKUP_DIR}/scripts/" 2>/dev/null

echo "  📄 Copying documentation..."
mkdir -p "${BACKUP_DIR}/docs"
cp *.md "${BACKUP_DIR}/docs/" 2>/dev/null || true

# Create README with backup info
cat > "${BACKUP_DIR}/BACKUP_INFO.txt" << EOF
InnerAnimalMedia.com Complete Backup
=====================================

Backup Created: $(date)
Backup Name: ${BACKUP_NAME}
Backup Format: tar.gz

Contents:
---------
- dashboard/        (All dashboard HTML pages - 29 files)
- shared/           (Shared components, JS, CSS - 35+ files)
- legal/            (Legal pages - 2 files)
- src/              (Worker code, SQL migrations)
- *.html            (Root HTML pages)
- wrangler.toml     (Cloudflare configuration)
- scripts/          (Upload and verification scripts)
- docs/             (Documentation files)

Restoration:
------------
1. Extract: tar -xzf ${BACKUP_FILE}
2. Upload to R2: ./scripts/upload-all-to-r2-complete.sh
3. Deploy worker: wrangler deploy

R2 Storage Location:
--------------------
Bucket: inneranimalmedia-assets
Prefix: static/

Current Production URL:
-----------------------
https://inneranimalmedia.com/

File Counts:
------------
- Dashboard Pages: 29
- Shared Components: 35+
- Total Files: 100+
EOF

echo ""
echo "🗜️  Creating tar.gz archive..."
echo "─────────────────────────────────────────────────────────────────"

# Create tar.gz archive
cd "${TEMP_DIR}"
tar -czf "${BACKUP_FILE}" "${BACKUP_NAME}" 2>&1

# Get file size
FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
ARCHIVE_PATH="${TEMP_DIR}/${BACKUP_FILE}"

echo "  ✅ Archive created: ${BACKUP_FILE}"
echo "  📊 Size: ${FILE_SIZE}"
echo ""

echo "☁️  Uploading to R2..."
echo "─────────────────────────────────────────────────────────────────"

# Upload to R2
if wrangler r2 object put "${BUCKET}/${R2_KEY}" \
  --file="${ARCHIVE_PATH}" \
  --content-type="application/gzip" \
  --remote 2>&1; then
  
  echo "  ✅ Backup uploaded successfully to R2!"
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "📥 DOWNLOAD YOUR BACKUP"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "Backup File: ${BACKUP_FILE}"
  echo "Size: ${FILE_SIZE}"
  echo ""
  echo "Option 1: Download via R2 API (Direct):"
  echo "  wrangler r2 object get ${BUCKET}/${R2_KEY} --file=./${BACKUP_FILE}"
  echo ""
  echo "Option 2: Access via Worker (Public URL):"
  echo "  https://inneranimalmedia.com/api/backup/${BACKUP_FILE}"
  echo ""
  echo "Option 3: Download via Cloudflare Dashboard:"
  echo "  1. Go to: https://dash.cloudflare.com"
  echo "  2. Navigate to: R2 > inneranimalmedia-assets > backups/"
  echo "  3. Click: ${BACKUP_FILE}"
  echo "  4. Download"
  echo ""
  echo "Local Backup Location:"
  echo "  ${ARCHIVE_PATH}"
  echo ""
  echo "💾 RECOMMENDED: Copy to external drive:"
  echo "  cp ${ARCHIVE_PATH} /Volumes/YOUR_EXTERNAL_DRIVE/"
  echo ""
  
  # Cleanup temp directory
  echo "🧹 Cleaning up temporary files..."
  cd - > /dev/null
  
else
  echo "  ❌ Upload failed!"
  echo ""
  echo "Local backup saved at:"
  echo "  ${ARCHIVE_PATH}"
  echo ""
  echo "You can manually upload it later or copy it to external drive:"
  echo "  cp ${ARCHIVE_PATH} /Volumes/YOUR_EXTERNAL_DRIVE/"
  exit 1
fi

# Don't delete the archive automatically - let user decide
echo "✅ Backup process complete!"
echo ""
echo "📋 Next Steps:"
echo "  1. Copy archive to external drive: cp ${ARCHIVE_PATH} /Volumes/YOUR_EXTERNAL_DRIVE/"
echo "  2. Verify backup integrity: tar -tzf ${ARCHIVE_PATH} | head"
echo "  3. Keep archive until you verify R2 download works"
