#!/bin/bash

# Shinshu Solutions - Backup to R2
# This script backs up the entire project to R2 for cloud storage and safe development
# Usage: ./backup-to-r2.sh

set -e

PROJECT_NAME="shinshu-solutions"
BUCKET_NAME="shinshu-solutions"
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${PROJECT_NAME}-backup-${TIMESTAMP}.tar.gz"

echo "📦 Starting backup of ${PROJECT_NAME}..."
echo ""

# Create backups directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Create backup archive (exclude node_modules, .wrangler, and other unnecessary files)
echo "🗜️  Creating backup archive..."
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" \
  --exclude='node_modules' \
  --exclude='.wrangler' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='backups' \
  --exclude='*.swp' \
  --exclude='*.swo' \
  --exclude='*~' \
  -C .. \
  "${PROJECT_NAME}"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "✅ Backup created: ${BACKUP_DIR}/${BACKUP_FILE} (${BACKUP_SIZE})"
echo ""

# Upload to R2
echo "☁️  Uploading to R2..."
wrangler r2 object put "${BUCKET_NAME}/backups/${BACKUP_FILE}" \
  --file="${BACKUP_DIR}/${BACKUP_FILE}" \
  --remote

if [ $? -eq 0 ]; then
  echo "✅ Backup uploaded successfully to R2!"
  echo ""
  echo "📍 R2 Location: ${BUCKET_NAME}/backups/${BACKUP_FILE}"
  echo ""
  echo "💡 To restore this backup, run:"
  echo "   ./restore-from-r2.sh ${BACKUP_FILE}"
  echo ""
  
  # Keep only the last 3 local backups
  echo "🧹 Cleaning up old local backups (keeping last 3)..."
  cd "${BACKUP_DIR}"
  ls -t ${PROJECT_NAME}-backup-*.tar.gz 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true
  cd ..
  
  echo "✅ Backup complete!"
else
  echo "❌ Error uploading to R2"
  exit 1
fi
