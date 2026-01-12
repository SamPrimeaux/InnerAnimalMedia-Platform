# 🔒 PRE-DELETE SAFETY CHECKLIST

## ⚠️ CRITICAL: Before Deleting Local Files

This checklist ensures ALL production files are safely stored in R2 before local cleanup.

## ✅ STEP 1: Upload All Files to R2

Run the comprehensive upload script:
```bash
./upload-all-to-r2-complete.sh
```

This will:
- ✅ Upload all root HTML pages
- ✅ Upload all 29 dashboard pages
- ✅ Upload all shared components (HTML, JS, CSS)
- ✅ Upload all theme files
- ✅ Upload all legal pages
- ✅ Show upload summary with any errors

**DO NOT PROCEED if there are upload errors!**

## ✅ STEP 2: Verify Files Are Accessible

Run the verification script:
```bash
./verify-r2-files.sh
```

This checks:
- ✅ Critical pages are accessible via URLs
- ✅ Shared components are loaded
- ✅ CSS/JS files are accessible

**DO NOT PROCEED if files are missing!**

## ✅ STEP 3: Manual Verification

Test these critical URLs in your browser:
- https://inneranimalmedia.com/
- https://inneranimalmedia.com/dashboard
- https://inneranimalmedia.com/dashboard/settings
- https://inneranimalmedia.com/dashboard/meauxmcp
- https://inneranimalmedia.com/dashboard/library
- https://inneranimalmedia.com/dashboard/templates

**Check browser DevTools Network tab to ensure all assets load!**

## ✅ STEP 4: Create Backup (Recommended)

Before deleting local files, create a backup:
```bash
# Create timestamped backup
BACKUP_DIR="$HOME/backups/meaux-builds-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Copy critical directories
cp -r dashboard "$BACKUP_DIR/"
cp -r shared "$BACKUP_DIR/"
cp -r legal "$BACKUP_DIR/"
cp index.html "$BACKUP_DIR/" 2>/dev/null

echo "✅ Backup created at: $BACKUP_DIR"
```

## 📋 R2 Storage Structure

All files are stored in:
- **Bucket**: `inneranimalmedia-assets`
- **Prefix**: `static/`
- **Structure**:
  ```
  static/
  ├── index.html
  ├── dashboard/
  │   ├── index.html
  │   ├── settings.html
  │   ├── meauxmcp.html
  │   └── ... (29 files)
  ├── shared/
  │   ├── dashboard-sidebar.html
  │   ├── sidebar.css
  │   ├── dashboard-layout-loader.js
  │   └── themes/
  └── legal/
      └── terms.html
  ```

## 🚨 SAFE TO DELETE LOCALLY

Once all checks pass, you can safely delete:
- ✅ `dashboard/*.html` (if in R2)
- ✅ `shared/*.html`, `shared/*.js`, `shared/*.css` (if in R2)
- ✅ `legal/*.html` (if in R2)
- ✅ Root HTML files like `about.html`, `contact.html`, etc. (if in R2)

## ⚠️ DO NOT DELETE

- ❌ `src/worker.js` (Worker code - NOT in R2)
- ❌ `wrangler.toml` (Configuration - NOT in R2)
- ❌ SQL migration files (NOT in R2)
- ❌ `.env` files (NOT in R2)
- ❌ Upload scripts (useful for future updates)

## 🔍 Quick Verification Command

To manually check if a file is in R2:
```bash
# Test if file is accessible via worker
curl -I https://inneranimalmedia.com/dashboard/meauxmcp.html

# Should return HTTP 200 if file exists in R2
```

## 📞 Emergency Recovery

If you accidentally delete something and need to recover:

1. **From Git** (if committed):
   ```bash
   git checkout HEAD -- dashboard/filename.html
   ```

2. **From R2** (download from production):
   ```bash
   wrangler r2 object get inneranimalmedia-assets/static/dashboard/filename.html \
     --file=./dashboard/filename.html
   ```

3. **From Backup** (if you created one):
   ```bash
   cp "$BACKUP_DIR/dashboard/filename.html" ./dashboard/
   ```

## ✅ FINAL CHECKLIST

Before deleting ANY local files:

- [ ] Ran `./upload-all-to-r2-complete.sh` - ALL files uploaded successfully
- [ ] Ran `./verify-r2-files.sh` - All critical files verified
- [ ] Manually tested 5+ pages in browser - All work correctly
- [ ] Checked browser DevTools - No 404 errors for assets
- [ ] Created backup (recommended)
- [ ] Documented what will be deleted
- [ ] Ready to proceed with deletion

**✅ Only proceed when ALL checks pass!**
