# ⚡ Quick Reference - All Systems

## 🔐 OAuth Setup (Do This Once)

**Complete Setup Script:** `./setup-oauth.sh`
**Documentation:** `OAUTH_COMPLETE_SETUP_SCRIPT.md`

### Quick Commands:
```bash
# Run setup script
./setup-oauth.sh

# Or manually set secrets
wrangler secret put GITHUB_OAUTH_CLIENT_ID
wrangler secret put GITHUB_OAUTH_CLIENT_SECRET
wrangler secret put GOOGLE_OAUTH_CLIENT_ID
wrangler secret put GOOGLE_OAUTH_CLIENT_SECRET
```

### OAuth URLs:
- **GitHub Callback**: `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback`
- **Google Callback**: `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/callback`

---

## 📧 Email Templates

**Test all email templates:**
```bash
# Seed templates first
curl -X POST "https://inneranimalmedia-dev.meauxbility.workers.dev/api/email-templates/seed"

# Send test emails
curl -X POST "https://inneranimalmedia-dev.meauxbility.workers.dev/api/email-templates/test" \
  -H "Content-Type: application/json" \
  -d '{"email":"meauxbility@gmail.com"}'
```

**Or use script:**
```bash
./test-email-templates.sh
```

---

## 🎨 Dashboard & Sidebar

**Unified Sidebar:** `/shared/sidebar.html`
**Dashboard Container:** `/shared/dashboard-container.css`
**Layout Manager:** `/shared/dashboard-layout.js`

**Features:**
- ✅ Organized tool categories
- ✅ Mobile-responsive drawer
- ✅ Search/filter functionality
- ✅ Theme system integration
- ✅ Collapsible sections

---

## 🗄️ Database & Storage

**Complete Bindings:** See `CLOUDFLARE_BINDINGS_COMPLETE.md`  
**Quick Reference:** See `BINDINGS_QUICK_REFERENCE.md`

### D1 Databases:
- **Primary:** `inneranimalmedia-business` (binding: `env.DB`)
- **Legacy:** `meauxos` (binding: `env.MEAUXOS_DB`)

### R2 Storage:
- **Assets:** `inneranimalmedia-assets` (binding: `env.STORAGE`)
- **Icons:** `splineicons` (binding: `env.SPLINEICONS_STORAGE`)

### Durable Object:
- **IAMSession:** SQLite-backed (binding: `env.SESSION_DO`)

### Hyperdrive:
- **Supabase:** `meauxhyper` (binding: `env.HYPERDRIVE`)

**Quick Commands:**
```bash
# Query primary DB
wrangler d1 execute inneranimalmedia-business --remote --command="SELECT * FROM oauth_providers;"

# Check bindings status
curl "https://inneranimalmedia-dev.meauxbility.workers.dev/api/stats" | jq '.resources'
```

---

## 🚀 Worker Deploy

**Deploy to production:**
```bash
wrangler deploy --env production
```

**Worker URL:** `https://inneranimalmedia-dev.meauxbility.workers.dev`

---

## 📚 Key Documentation Files

1. **`OAUTH_COMPLETE_SETUP_SCRIPT.md`** - Complete OAuth setup guide
2. **`UNIFIED_DASHBOARD_COMPLETE.md`** - Dashboard system docs
3. **`OAUTH_STATUS.md`** - OAuth system status
4. **`setup-oauth.sh`** - Automated OAuth setup script
5. **`test-email-templates.sh`** - Test email templates script

---

## 🔗 Important URLs

**Complete URL List:** See `ALL_LIVE_URLS_COMPLETE.md` for full list

**Primary Production:**
- **Custom Domain**: `https://inneranimalmedia.com/`
- **Dashboard**: `https://inneranimalmedia.com/dashboard/`
- **Worker**: `https://inneranimalmedia-dev.meauxbility.workers.dev`
- **API Base**: `https://inneranimalmedia-dev.meauxbility.workers.dev/api`

**Cloudflare Pages:**
- **Pages**: `https://inneranimalmedia.pages.dev`
- **Legacy**: `https://meauxos-unified-dashboard.pages.dev`

**API Endpoints:**
- OAuth: `/api/oauth/{provider}/authorize`
- Email Templates: `/api/email-templates/seed` (POST)
- Test Emails: `/api/email-templates/test` (POST)
- Tools: `/api/tools`
- Themes: `/api/themes`
- Stats: `/api/stats`
- Workflows: `/api/workflows`
- Deployments: `/api/deployments`
- Workers: `/api/workers`

---

## 🎯 Common Tasks

### Set up OAuth from scratch:
1. Create GitHub/Google OAuth apps
2. Run `./setup-oauth.sh`
3. Test OAuth endpoints

### Test email templates:
1. Run `./test-email-templates.sh`
2. Check inbox at meauxbility@gmail.com

### Deploy changes:
```bash
wrangler deploy --env production
```

### Check OAuth status:
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT id, display_name, 
       CASE WHEN client_id = 'PLACEHOLDER_CLIENT_ID' THEN '❌ NOT CONFIGURED' ELSE '✅ CONFIGURED' END as status
FROM oauth_providers;
"
```

---

**Save this file - it's your quick reference for everything!** 🚀
