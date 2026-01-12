#!/bin/bash

# Shinshu Solutions - Restore from R2
# This script restores a project backup from R2
# Usage: ./restore-from-r2.sh [backup-filename]
#   If no filename provided, lists available backups

set -e

PROJECT_NAME="shinshu-solutions"
BUCKET_NAME="shinshu-solutions"
BACKUP_DIR="backups"
R2_BACKUP_PATH="backups"

if [ -z "$1" ]; then
  echo "📋 Available backups in R2:"
  echo ""
  wrangler r2 object list "${BUCKET_NAME}" --prefix="${R2_BACKUP_PATH}/" --remote | grep "${PROJECT_NAME}-backup-" | tail -10 || echo "No backups found"
  echo ""
  echo "Usage: ./restore-from-r2.sh shinshu-solutions-backup-YYYYMMDD_HHMMSS.tar.gz"
  exit 0
fi

BACKUP_FILE="$1"
R2_OBJECT="${R2_BACKUP_PATH}/${BACKUP_FILE}"

# Check if backup exists in R2
echo "🔍 Checking for backup: ${R2_OBJECT}..."
if ! wrangler r2 object list "${BUCKET_NAME}" --prefix="${R2_OBJECT}" --remote | grep -q "${BACKUP_FILE}"; then
  echo "❌ Backup not found in R2: ${BACKUP_FILE}"
  echo ""
  echo "Available backups:"
  wrangler r2 object list "${BUCKET_NAME}" --prefix="${R2_BACKUP_PATH}/" --remote | grep "${PROJECT_NAME}-backup-" | tail -10 || echo "No backups found"
  exit 1
fi

# Create backups directory
mkdir -p "${BACKUP_DIR}"

# Download from R2
echo "⬇️  Downloading backup from R2..."
wrangler r2 object get "${BUCKET_NAME}/${R2_OBJECT}" \
  --file="${BACKUP_DIR}/${BACKUP_FILE}" \
  --remote

if [ $? -ne 0 ]; then
  echo "❌ Error downloading backup from R2"
  exit 1
fi

echo "✅ Backup downloaded: ${BACKUP_DIR}/${BACKUP_FILE}"
echo ""

# Ask for confirmation before extracting
read -p "⚠️  This will overwrite current files. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Restore cancelled"
  exit 1
fi

# Extract backup
echo "📦 Extracting backup..."
cd ..
tar -xzf "${PROJECT_NAME}/${BACKUP_DIR}/${BACKUP_FILE}"

echo "✅ Restore complete!"
echo ""
echo "📍 Project restored to: ../${PROJECT_NAME}/"
echo ""
echo "💡 Next steps:"
echo "   1. cd ${PROJECT_NAME}"
echo "   2. npm install (if needed)"
echo "   3. wrangler deploy --env production"
