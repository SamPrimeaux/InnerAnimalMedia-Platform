#!/bin/bash
# Restore Script - Run this AFTER cleanup to restore your project
# This assumes you have the backup in R2 or Git

set -e

echo "🔄 Restore After Cleanup - Starting..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# 1. RESTORE FROM GIT (PRIMARY METHOD)
# ============================================================================
echo "📥 Step 1: Restoring from Git..."
if [ -d ".git" ]; then
  echo "  ✅ Git repository found"
  echo "  💡 Run: git pull origin main (if needed)"
else
  echo "  ⚠️  No Git repository found"
  echo "  💡 Clone your repo: git clone [your-repo-url]"
fi
echo ""

# ============================================================================
# 2. RESTORE FROM R2 (IF NEEDED)
# ============================================================================
echo "☁️  Step 2: Checking R2 for backups..."
echo "  💡 To download from R2:"
echo "     wrangler r2 object get inneranimalmedia-assets/backups/backup-YYYYMMDD_HHMMSS.tar.gz --file=backup.tar.gz"
echo ""

# ============================================================================
# 3. RESTORE CONFIGURATION
# ============================================================================
echo "⚙️  Step 3: Restoring configuration..."

# Check if wrangler.toml exists
if [ ! -f "wrangler.toml" ]; then
  echo "  ⚠️  wrangler.toml not found - restore from backup or Git"
else
  echo "  ✅ wrangler.toml found"
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "  ⚠️  package.json not found - restore from backup or Git"
else
  echo "  ✅ package.json found"
fi
echo ""

# ============================================================================
# 4. RESTORE SECRETS
# ============================================================================
echo "🔐 Step 4: Restoring secrets..."
echo "  📋 Secrets needed (set with: wrangler secret put SECRET_NAME):"
echo ""
echo "  Required secrets:"
echo "    - JWT_SECRET (for authentication)"
echo "    - ANTHROPIC_API_KEY (for Claude API - optional)"
echo "    - OPENAI_API_KEY (for OpenAI - optional)"
echo "    - CLOUDFLARE_API_TOKEN (for Cloudflare API - optional)"
echo ""
echo "  💡 Check secrets/secrets-list.txt in backup for full list"
echo ""

# ============================================================================
# 5. RESTORE DATABASE
# ============================================================================
echo "📊 Step 5: Database status..."
echo "  ✅ Database is in Cloudflare D1 (remote)"
echo "  💡 If needed, restore schema:"
echo "     wrangler d1 execute inneranimalmedia-business --remote --file=src/schema-*.sql"
echo ""

# ============================================================================
# 6. RESTORE DEPENDENCIES
# ============================================================================
echo "📦 Step 6: Installing dependencies..."
if [ -f "package.json" ]; then
  echo "  📥 Running: npm install"
  npm install
  echo "  ✅ Dependencies installed"
else
  echo "  ⚠️  package.json not found - cannot install dependencies"
fi
echo ""

# ============================================================================
# 7. VERIFY RESTORATION
# ============================================================================
echo "✅ Step 7: Verifying restoration..."
echo ""

# Check critical files
CRITICAL_FILES=("wrangler.toml" "package.json" "src/worker.js")
MISSING_FILES=()

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MISSING)"
    MISSING_FILES+=("$file")
  fi
done

echo ""
if [ ${#MISSING_FILES[@]} -eq 0 ]; then
  echo "✅ All critical files present!"
  echo ""
  echo "🚀 Next steps:"
  echo "  1. Set secrets: wrangler secret put SECRET_NAME"
  echo "  2. Test locally: wrangler dev"
  echo "  3. Deploy: wrangler deploy --env production"
else
  echo "⚠️  Missing files detected!"
  echo "  Restore from backup or Git before proceeding"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Restore script complete!"
echo "═══════════════════════════════════════════════════════════════"
