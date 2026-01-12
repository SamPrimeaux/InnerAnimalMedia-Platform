# ✅ Unified Worker Architecture - Single Deployment

## 🎯 Why Two Deployments?

**Before:**
- **Pages**: Static HTML/CSS/JS files (frontend only)
- **Worker**: API endpoints only (backend only)
- **Problem**: Two separate deployments, routing complexity

**Now:**
- **Single Worker**: Handles BOTH frontend + backend
- **R2**: Stores all static files
- **D1**: Database
- **Proper Routing**: Server-side, not SPA

---

## 🏗️ Architecture

```
Single Worker (iaccess-api)
├── /api/*          → API routes (D1 database)
├── /*              → Static files from R2
└── Routing:        → Proper server-side routing (not SPA)
```

**Storage:**
- **R2**: `static/` prefix for all HTML/CSS/JS
- **D1**: Database queries
- **R2**: `images/` prefix for user uploads

---

## 📦 Setup Steps

### 1. Upload Static Files to R2

```bash
# Install AWS SDK (for R2 S3-compatible API)
npm install @aws-sdk/client-s3

# Set R2 credentials (get from Cloudflare Dashboard > R2 > API Tokens)
export R2_ACCESS_KEY_ID="your-key-id"
export R2_SECRET_ACCESS_KEY="your-secret-key"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Upload files
node upload-static-to-r2.js
```

This uploads:
- `index.html` → `static/index.html`
- `dashboard/*.html` → `static/dashboard/*.html`
- `shared/*.js` → `static/shared/*.js`
- `shared/*.css` → `static/shared/*.css`

### 2. Deploy Worker

```bash
wrangler deploy --env production
```

**That's it!** Single deployment handles everything.

---

## 🛣️ Routing

### API Routes
- `/api/*` → Handled by API handlers
- Returns JSON responses

### Static Routes
- `/` → `static/index.html`
- `/dashboard` → `static/dashboard/index.html`
- `/dashboard/calendar.html` → `static/dashboard/calendar.html`
- `/shared/script.js` → `static/shared/script.js`

**No SPA routing** - Each URL is a real file served from R2.

---

## ✅ Benefits

1. **Single Deployment** - One `wrangler deploy`
2. **Proper Routing** - Server-side, SEO-friendly
3. **R2 Storage** - All assets in R2
4. **D1 Database** - All data in D1
5. **No SPA Issues** - Real URLs, proper navigation
6. **Production Ready** - Solid architecture

---

## 🔧 Worker Code

The worker now:
1. Checks if path starts with `/api/` → Handle API
2. Otherwise → Serve from R2 at `static/{path}`
3. Proper content types
4. Caching headers

---

## 📝 Next Steps

1. ✅ Upload static files to R2
2. ✅ Deploy worker
3. ✅ Test all routes
4. ✅ Remove Pages deployment (optional)

**Your app is now a proper full-stack application with unified deployment!**
