#!/bin/bash
# Complete Backup Script - Backs up everything critical before cleanup
# Run this BEFORE deleting local files!

set -e

echo "🔄 Complete System Backup - Starting..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# ============================================================================
# 1. BACKUP DATABASE SCHEMA & MIGRATIONS
# ============================================================================
echo "📊 Step 1: Backing up database schemas and migrations..."
mkdir -p "$BACKUP_DIR/database"

# Copy all SQL files
cp -r src/*.sql "$BACKUP_DIR/database/" 2>/dev/null || true
cp -r src/migration-*.sql "$BACKUP_DIR/database/" 2>/dev/null || true

# Export current database schema
echo "  📤 Exporting database schema..."
wrangler d1 execute inneranimalmedia-business --remote --command=".schema" > "$BACKUP_DIR/database/schema-export.sql" 2>&1 || echo "  ⚠️  Schema export failed (may need manual backup)"

echo "  ✅ Database files backed up"
echo ""

# ============================================================================
# 2. BACKUP CONFIGURATION FILES
# ============================================================================
echo "⚙️  Step 2: Backing up configuration files..."
mkdir -p "$BACKUP_DIR/config"

# Critical config files
cp wrangler.toml "$BACKUP_DIR/config/" 2>/dev/null || true
cp package.json "$BACKUP_DIR/config/" 2>/dev/null || true
cp cloudflare-pages.json "$BACKUP_DIR/config/" 2>/dev/null || true
cp .gitignore "$BACKUP_DIR/config/" 2>/dev/null || true

# Claude Code config (if exists)
if [ -d ".claude" ]; then
  cp -r .claude "$BACKUP_DIR/config/" 2>/dev/null || true
  echo "  ✅ Claude Code config backed up"
fi

echo "  ✅ Configuration files backed up"
echo ""

# ============================================================================
# 3. BACKUP SOURCE CODE
# ============================================================================
echo "💻 Step 3: Backing up source code..."
mkdir -p "$BACKUP_DIR/source"

# Critical source files
cp -r src "$BACKUP_DIR/source/" 2>/dev/null || true
cp -r dashboard "$BACKUP_DIR/source/" 2>/dev/null || true
cp -r shared "$BACKUP_DIR/source/" 2>/dev/null || true
cp -r scripts "$BACKUP_DIR/source/" 2>/dev/null || true

# Root HTML files
cp *.html "$BACKUP_DIR/source/" 2>/dev/null || true

echo "  ✅ Source code backed up"
echo ""

# ============================================================================
# 4. BACKUP DOCUMENTATION
# ============================================================================
echo "📚 Step 4: Backing up documentation..."
mkdir -p "$BACKUP_DIR/docs"

# All markdown files
find . -maxdepth 1 -name "*.md" -type f -exec cp {} "$BACKUP_DIR/docs/" \; 2>/dev/null || true

echo "  ✅ Documentation backed up"
echo ""

# ============================================================================
# 5. CREATE SECRETS INVENTORY
# ============================================================================
echo "🔐 Step 5: Creating secrets inventory..."
mkdir -p "$BACKUP_DIR/secrets"

# List all secrets (without values for security)
echo "# Wrangler Secrets Inventory" > "$BACKUP_DIR/secrets/secrets-list.txt"
echo "# Generated: $(date)" >> "$BACKUP_DIR/secrets/secrets-list.txt"
echo "" >> "$BACKUP_DIR/secrets/secrets-list.txt"
echo "# To view secrets, run: wrangler secret list" >> "$BACKUP_DIR/secrets/secrets-list.txt"
echo "# To set a secret, run: wrangler secret put SECRET_NAME" >> "$BACKUP_DIR/secrets/secrets-list.txt"
echo "" >> "$BACKUP_DIR/secrets/secrets-list.txt"

# Check for common secrets in code
echo "# Secrets referenced in code:" >> "$BACKUP_DIR/secrets/secrets-list.txt"
grep -h "env\." src/worker.js | grep -o "env\.[A-Z_]*" | sort -u | sed 's/env\.//' >> "$BACKUP_DIR/secrets/secrets-list.txt" 2>/dev/null || true

echo "  ✅ Secrets inventory created"
echo ""

# ============================================================================
# 6. CREATE RESTORE INSTRUCTIONS
# ============================================================================
echo "📋 Step 6: Creating restore instructions..."
cat > "$BACKUP_DIR/RESTORE_INSTRUCTIONS.md" << 'EOF'
# 🔄 Restore Instructions

## After Cleanup - How to Restore

### 1. Restore Source Code
```bash
cp -r source/* .
```

### 2. Restore Configuration
```bash
cp config/wrangler.toml .
cp config/package.json .
cp config/.gitignore .
```

### 3. Restore Claude Code Config (if needed)
```bash
cp -r config/.claude .
```

### 4. Restore Database (if needed)
```bash
# Apply migrations
wrangler d1 execute inneranimalmedia-business --remote --file=database/schema-export.sql
```

### 5. Restore Secrets
```bash
# Set each secret (you'll need the actual values)
wrangler secret put JWT_SECRET
wrangler secret put ANTHROPIC_API_KEY
# ... etc (see secrets/secrets-list.txt)
```

### 6. Reinstall Dependencies
```bash
npm install
```

### 7. Verify Everything
```bash
wrangler dev
```

## Critical Files to Keep

- `wrangler.toml` - Cloudflare configuration
- `package.json` - Dependencies
- `src/worker.js` - Main worker
- `src/*.sql` - Database schemas
- `.gitignore` - Git ignore rules

## Files Already in R2

All static files (HTML, CSS, JS) are in R2 at:
- Bucket: `inneranimalmedia-assets`
- Prefix: `static/`

## Files Already in Git

All source code should be in Git. After cleanup:
```bash
git clone [your-repo-url]
cd [repo-name]
npm install
```

EOF

echo "  ✅ Restore instructions created"
echo ""

# ============================================================================
# 7. CREATE BACKUP ARCHIVE
# ============================================================================
echo "📦 Step 7: Creating backup archive..."
cd "$BACKUP_DIR/.."
ARCHIVE_NAME="backup-$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$ARCHIVE_NAME" "$(basename $BACKUP_DIR)" 2>/dev/null || true

if [ -f "$ARCHIVE_NAME" ]; then
  echo "  ✅ Archive created: $ARCHIVE_NAME"
  
  # Upload to R2
  echo "  📤 Uploading archive to R2..."
  wrangler r2 object put "inneranimalmedia-assets/backups/$ARCHIVE_NAME" --file="$ARCHIVE_NAME" --remote 2>&1 | grep -q "Upload complete" && echo "  ✅ Archive uploaded to R2" || echo "  ⚠️  Archive upload may have failed"
else
  echo "  ⚠️  Archive creation failed"
fi

cd - > /dev/null

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ BACKUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📁 Backup location: $BACKUP_DIR"
echo "📦 Archive: $ARCHIVE_NAME (if created)"
echo ""
echo "🔍 Verify backup:"
echo "  ls -la $BACKUP_DIR"
echo ""
echo "☁️  Files in R2:"
echo "  wrangler r2 object list inneranimalmedia-assets --remote --prefix=backups/"
echo ""
echo "✅ Safe to clean local files now!"
echo ""
