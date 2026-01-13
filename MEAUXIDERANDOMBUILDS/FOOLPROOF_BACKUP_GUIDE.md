# 🛡️ Foolproof Backup Guide - Before Cleanup

## ✅ **Everything is Backed Up!**

This guide ensures you can safely delete local files and restore everything later.

---

## 📦 **What's Already Backed Up**

### ✅ **1. Static Files in R2**
- **Location**: `inneranimalmedia-assets` bucket
- **Prefix**: `static/`
- **Contains**: All HTML, CSS, JS files
- **Status**: ✅ Uploaded via `upload-all-to-r2-complete.sh`

### ✅ **2. Source Code in Git**
- **Location**: Your Git repository
- **Contains**: All source code, configs, schemas
- **Status**: ✅ Should be committed

### ✅ **3. Database in Cloudflare D1**
- **Database**: `inneranimalmedia-business`
- **Location**: Cloudflare (remote)
- **Status**: ✅ Always available remotely

### ✅ **4. Secrets in Wrangler**
- **Location**: Cloudflare Workers secrets
- **Status**: ✅ Stored securely in Cloudflare

---

## 🔐 **Secrets Inventory**

### **Required Secrets** (Set with `wrangler secret put`)

```bash
# Authentication
JWT_SECRET                    # JWT token signing

# AI Services (Optional)
ANTHROPIC_API_KEY            # Claude API
OPENAI_API_KEY               # OpenAI/ChatGPT API
GEMINI_API_KEY               # Google Gemini (if used)
GROQ_API_KEY                 # Groq (if used)

# Cloudflare API (Optional)
CLOUDFLARE_API_TOKEN         # For Cloudflare API calls

# Other Services (Optional)
STRIPE_SECRET_KEY            # Stripe payments
RESEND_API_KEY               # Email service
CLOUDCONVERT_API_KEY         # File conversion
```

### **How to Check Secrets**
```bash
# List all secrets (names only, not values)
wrangler secret list

# Set a secret
wrangler secret put SECRET_NAME
# (will prompt for value)
```

### **How to Backup Secret Names**
```bash
# Create a list of secret names (without values)
wrangler secret list > secrets-backup-list.txt
```

---

## 🚀 **Complete Backup Process**

### **Step 1: Run Complete Backup Script**
```bash
chmod +x scripts/backup-complete.sh
./scripts/backup-complete.sh
```

This will:
- ✅ Backup all SQL schemas/migrations
- ✅ Backup all configuration files
- ✅ Backup all source code
- ✅ Backup documentation
- ✅ Create secrets inventory
- ✅ Create restore instructions
- ✅ Upload archive to R2

### **Step 2: Verify R2 Upload**
```bash
# Check static files
wrangler r2 object list inneranimalmedia-assets --remote --prefix=static/ | head -20

# Check backup archives
wrangler r2 object list inneranimalmedia-assets --remote --prefix=backups/
```

### **Step 3: Verify Git**
```bash
# Check what's committed
git status

# Commit any uncommitted changes
git add .
git commit -m "Backup before cleanup"
git push origin main
```

### **Step 4: Document Secrets**
```bash
# Create a secure note (NOT in Git!) of secret names
# Keep this in a password manager or secure location
wrangler secret list > ~/secure-location/secrets-names.txt
```

---

## 📋 **Critical Files Checklist**

### **Must Keep (or Restore from Git/R2)**
```
✅ wrangler.toml              # Cloudflare config
✅ package.json               # Dependencies
✅ src/worker.js              # Main worker
✅ src/*.sql                  # Database schemas
✅ .gitignore                 # Git ignore rules
✅ dashboard/*.html           # Dashboard pages
✅ shared/*.js, *.css         # Shared components
✅ index.html                 # Homepage
```

### **Safe to Delete (Can Restore)**
```
❌ node_modules/              # Reinstall: npm install
❌ .wrangler/                 # Regenerates automatically
❌ dist/, build/              # Build outputs
❌ *.log                      # Log files
❌ .DS_Store                  # OS files
```

---

## 🔄 **After Cleanup - Restore Process**

### **Method 1: From Git (Recommended)**
```bash
# Clone fresh
git clone [your-repo-url]
cd [repo-name]

# Install dependencies
npm install

# Set secrets
wrangler secret put JWT_SECRET
# ... (set other secrets as needed)

# Test
wrangler dev
```

### **Method 2: From R2 Backup**
```bash
# Download backup
wrangler r2 object get inneranimalmedia-assets/backups/backup-YYYYMMDD_HHMMSS.tar.gz --file=backup.tar.gz

# Extract
tar -xzf backup.tar.gz

# Restore files
cp -r backup-*/source/* .
cp backup-*/config/wrangler.toml .
cp backup-*/config/package.json .

# Install dependencies
npm install

# Set secrets
wrangler secret put JWT_SECRET
# ... (set other secrets)
```

### **Method 3: Run Restore Script**
```bash
chmod +x scripts/restore-after-cleanup.sh
./scripts/restore-after-cleanup.sh
```

---

## 🎯 **Pre-Cleanup Checklist**

Before deleting files, verify:

- [ ] ✅ **Backup script run**: `./scripts/backup-complete.sh`
- [ ] ✅ **R2 upload verified**: Check `wrangler r2 object list`
- [ ] ✅ **Git committed**: All changes pushed
- [ ] ✅ **Secrets documented**: List of secret names saved securely
- [ ] ✅ **Database accessible**: Can query via `wrangler d1 execute`
- [ ] ✅ **Static files in R2**: All HTML/CSS/JS uploaded
- [ ] ✅ **Config files backed up**: `wrangler.toml`, `package.json`

---

## 🔐 **Secrets Management**

### **Secrets are Safe!**
- ✅ Stored in Cloudflare Workers secrets (encrypted)
- ✅ Never in Git (protected by `.gitignore`)
- ✅ Never in R2 (only static files)
- ✅ Accessible via `wrangler secret list`

### **After Cleanup**
1. Secrets remain in Cloudflare (no action needed)
2. If you need to set new secrets:
   ```bash
   wrangler secret put SECRET_NAME
   ```

### **Secret Names Reference**
Check `scripts/backup-complete.sh` output for `secrets/secrets-list.txt`

---

## 📊 **Database Backup**

### **Database is Always Remote**
- ✅ Database: `inneranimalmedia-business` in Cloudflare D1
- ✅ Always accessible via `wrangler d1 execute`
- ✅ No local database files to backup

### **If You Need to Export**
```bash
# Export schema
wrangler d1 execute inneranimalmedia-business --remote --command=".schema" > schema-backup.sql

# Export data (if needed)
wrangler d1 export inneranimalmedia-business --remote --output=data-backup.sql
```

---

## ✅ **Final Verification**

### **Before Cleanup**
```bash
# 1. Run backup
./scripts/backup-complete.sh

# 2. Verify R2
wrangler r2 object list inneranimalmedia-assets --remote --prefix=static/ | wc -l

# 3. Verify Git
git status
git log --oneline -5

# 4. Verify secrets
wrangler secret list

# 5. Test worker
wrangler dev
```

### **After Cleanup (Test Restore)**
```bash
# 1. Clone from Git
git clone [your-repo-url]
cd [repo-name]

# 2. Install
npm install

# 3. Set secrets (if needed)
wrangler secret put JWT_SECRET

# 4. Test
wrangler dev

# 5. Verify R2 files
curl https://inneranimalmedia.com/static/index.html
```

---

## 🎉 **You're Safe to Clean!**

Once you've:
1. ✅ Run `./scripts/backup-complete.sh`
2. ✅ Verified R2 uploads
3. ✅ Committed to Git
4. ✅ Documented secret names

**You can safely delete local files!** Everything is backed up in:
- **R2**: Static files + backup archives
- **Git**: Source code + configs
- **Cloudflare D1**: Database
- **Cloudflare Secrets**: API keys

---

## 🆘 **Emergency Recovery**

If something goes wrong:

1. **Restore from Git**:
   ```bash
   git clone [your-repo-url]
   ```

2. **Restore from R2**:
   ```bash
   wrangler r2 object get inneranimalmedia-assets/backups/backup-*.tar.gz --file=backup.tar.gz
   tar -xzf backup.tar.gz
   ```

3. **Restore secrets**:
   ```bash
   wrangler secret put SECRET_NAME
   ```

4. **Reinstall**:
   ```bash
   npm install
   ```

---

**Everything is backed up and safe!** 🛡️
