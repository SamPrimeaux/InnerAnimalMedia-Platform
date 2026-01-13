# 🧹 Safe Cleanup Guide - What to Keep vs Delete

## ✅ **NO SETUP SCRIPTS NEEDED!**

Claude Code is **already installed** (v2.1.5) and working. The `.claude/` directory I created is **local-only** configuration - no scripts needed to run.

---

## 📦 **What's Stored Where**

### ✅ **In R2 (Cloud Storage)**
- **Static files**: HTML, CSS, JS files served to users
- **User uploads**: Images, 3D models, documents
- **Backups**: Database backups, archives
- **Location**: `inneranimalmedia-assets` bucket

### ✅ **In Git (Version Control)**
- **Source code**: `src/`, `dashboard/`, `shared/`
- **Configuration**: `wrangler.toml`, `package.json`
- **Documentation**: `.md` files
- **Scripts**: `.sh`, `.js` files

### ✅ **Local Only (NOT in R2, NOT in Git)**
- **`.claude/`** - Claude Code configuration (68KB) - **LOCAL ONLY**
- **`.wrangler/`** - Wrangler cache
- **`node_modules/`** - Dependencies (can reinstall)
- **`.env`** - Secrets (NEVER commit)

---

## 🎯 **Critical Files to KEEP**

### **1. Source Code (MUST KEEP)**
```
✅ src/worker.js              # Main API worker (CRITICAL!)
✅ src/*.sql                  # Database schemas/migrations (CRITICAL!)
✅ src/migration-*.sql         # Migration scripts (CRITICAL!)
✅ dashboard/*.html           # Dashboard pages (all 31+ pages)
✅ dashboard/*.js              # Dashboard JavaScript files
✅ shared/*.js                 # Shared JavaScript components
✅ shared/*.css                # Shared CSS styles
✅ shared/*.html               # Shared HTML components
✅ index.html                  # Homepage (root)
✅ *.html                      # Root HTML pages (about, contact, pricing, etc.)
✅ admin/*.html                # Admin pages (if exists)
✅ legal/*.html                # Legal pages (if exists)
```

### **2. Configuration Files (MUST KEEP)**
```
✅ wrangler.toml              # Cloudflare config (CRITICAL!)
✅ package.json               # Dependencies list (CRITICAL!)
✅ package-lock.json          # Dependency lock file (if exists)
✅ .gitignore                 # Git ignore rules
✅ cloudflare-pages.json      # Pages deployment config
✅ .claude/                    # Claude Code config (optional, but useful)
   └── commands/              # Custom Claude commands
   └── settings.json          # Claude settings
   └── CLAUDE.md              # Project context
```

### **3. Scripts & Automation (SHOULD KEEP)**
```
✅ scripts/*.sh                # Deployment/backup scripts
✅ scripts/*.js                 # Build/utility scripts
✅ upload-all-to-r2-complete.sh # R2 upload script
✅ deploy.sh                    # Deployment script (if exists)
```

### **4. Database & Migrations (MUST KEEP)**
```
✅ src/*.sql                   # All SQL schema files
✅ src/migration-*.sql         # All migration scripts
✅ src/schema-*.sql            # Schema definitions
✅ src/seed-*.sql              # Seed data scripts
```

### **5. Documentation (SHOULD KEEP)**
```
✅ *.md                        # All markdown documentation
✅ README.md                   # Project readme
✅ FOOLPROOF_BACKUP_GUIDE.md   # Backup guide (this file!)
✅ BACKUP_VERIFICATION.md      # Backup verification
✅ MULTI_ACCOUNT_SUPPORT.md    # Multi-account docs
✅ CLAUDE_CODE_SETUP_COMPLETE.md # Claude setup docs
```

### **6. Special Directories (CHECK BEFORE DELETING)**
```
✅ cad/                        # CAD tool files (if exists)
✅ inneranimalmediaservices/   # Service files (if exists)
✅ shinshu-solutions/          # Shinshu project (if exists)
✅ static/                     # Static assets (if not in R2)
```

---

## 🗑️ **Safe to Delete (After Backup)**

### **1. Build/Cache Files (Can Regenerate)**
```
❌ node_modules/              # Reinstall with: npm install
❌ .wrangler/                 # Wrangler cache (regenerates)
❌ dist/, build/, out/        # Build outputs
❌ .next/, .nuxt/             # Framework caches
```

### **2. Logs & Temp Files**
```
❌ *.log                      # Log files
❌ *.tmp, *.temp              # Temporary files
❌ logs/                      # Log directories
```

### **3. OS Files**
```
❌ .DS_Store                  # macOS files
❌ Thumbs.db                  # Windows files
❌ ._*                        # macOS metadata
```

### **4. Backup Archives (If Already in R2)**
```
❌ *.tar.gz, *.zip            # If backed up to R2
❌ backups/*.sql              # If in R2
```

---

## ⚠️ **NEVER DELETE**

### **Critical System Files**
```
🚫 .env, .env.*               # Secrets (NEVER delete)
🚫 .git/                      # Git history
🚫 src/worker.js              # Main worker
🚫 wrangler.toml              # Cloudflare config
🚫 package.json               # Dependencies list
🚫 src/*.sql                  # Database schemas
```

### **User Data (If Local)**
```
🚫 Any user-uploaded files not yet in R2
🚫 Database exports not yet backed up
```

---

## 🔒 **About `.claude/` Directory**

### **What It Is:**
- **Local-only** Claude Code configuration
- **68KB** - Very small
- **NOT in R2** - It's local config, not served files
- **NOT in Git** - It's in `.gitignore` (personal config)

### **Should You Keep It?**
- ✅ **YES** - It's tiny (68KB) and contains your custom commands
- ✅ **Safe to delete** - Can recreate commands later if needed
- ✅ **Per-machine** - Each developer has their own

### **If You Delete It:**
- Commands will be lost (but can recreate)
- Project settings will reset
- **System will still work** - Claude Code will recreate defaults

---

## 📋 **Pre-Cleanup Checklist**

Before deleting anything:

1. ✅ **Backup to R2** (if not already):
   ```bash
   ./upload-all-to-r2-complete.sh
   ```

2. ✅ **Verify R2 has everything**:
   ```bash
   wrangler r2 object list inneranimalmedia-assets --remote
   ```

3. ✅ **Commit critical changes to Git**:
   ```bash
   git add src/ dashboard/ shared/ wrangler.toml package.json
   git commit -m "Backup before cleanup"
   ```

4. ✅ **Export database** (if needed):
   ```bash
   wrangler d1 export inneranimalmedia-business --remote --output=backup.sql
   ```

---

## 🧹 **Safe Cleanup Commands**

### **1. Remove Node Modules (Safe)**
```bash
rm -rf node_modules/
npm install  # Reinstall when needed
```

### **2. Remove Build Caches (Safe)**
```bash
rm -rf .wrangler/ dist/ build/ out/ .next/ .nuxt/
```

### **3. Remove Logs (Safe)**
```bash
find . -name "*.log" -type f -delete
rm -rf logs/
```

### **4. Remove OS Files (Safe)**
```bash
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete
find . -name "._*" -delete
```

### **5. Remove Temp Files (Safe)**
```bash
find . -name "*.tmp" -type f -delete
find . -name "*.temp" -type f -delete
rm -rf tmp/ temp/
```

---

## 🎯 **Recommended Cleanup Order**

1. **First**: Backup everything to R2
   ```bash
   ./upload-all-to-r2-complete.sh
   ```

2. **Second**: Remove safe-to-delete files (logs, temp, OS files)

3. **Third**: Remove `node_modules/` (can reinstall)

4. **Fourth**: Remove build caches (`.wrangler/`, `dist/`, etc.)

5. **Last**: Review and delete old backup archives (if in R2)

---

## ✅ **After Cleanup**

1. **Verify system still works**:
   ```bash
   npm install
   wrangler dev
   ```

2. **Test deployment**:
   ```bash
   wrangler deploy --env production
   ```

3. **Check R2**:
   ```bash
   wrangler r2 object list inneranimalmedia-assets --remote
   ```

---

## 📊 **File Count Reduction**

If you have **26,000+ files**, most are likely:
- `node_modules/` (thousands of files)
- `.wrangler/` cache (hundreds of files)
- Log files (many)
- OS files (`.DS_Store`, etc.)

**Expected reduction**: 20,000+ files can be safely deleted.

---

## 🚨 **Emergency Recovery**

If you accidentally delete something critical:

1. **From R2**:
   ```bash
   wrangler r2 object get inneranimalmedia-assets/static/[file] --file=[local-path]
   ```

2. **From Git**:
   ```bash
   git checkout HEAD -- [file]
   ```

3. **Reinstall dependencies**:
   ```bash
   npm install
   ```

---

**Summary**: `.claude/` is **local-only** (68KB), **NOT in R2**. No setup scripts needed. Safe to delete if you want, but it's tiny so keeping it is fine. Focus cleanup on `node_modules/`, logs, and caches.
