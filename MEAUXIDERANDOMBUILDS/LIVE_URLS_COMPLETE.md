# 🌐 ALL LIVE URLS - InnerAnimalMedia

## ✅ **PRIMARY PRODUCTION DOMAIN**

### Custom Domain (Main Site)
- ✅ **Homepage**: `https://inneranimalmedia.com/` (HTTP 200 ✅)
- ✅ **Dashboard**: `https://inneranimalmedia.com/dashboard/`
- ✅ **API**: `https://inneranimalmedia.com/api/`

---

## 🔧 **WORKER - Main Application**

### Worker Direct Access
- ✅ **Main URL**: `https://inneranimalmedia-dev.meauxbility.workers.dev`
- ✅ **Status**: LIVE ✅
- ✅ **Static Files**: Served from R2 bucket `inneranimalmedia-assets` at `static/` prefix

### Frontend Pages (Custom Domain - https://inneranimalmedia.com/)

#### Dashboard Pages
- `https://inneranimalmedia.com/dashboard/`
- `https://inneranimalmedia.com/dashboard/index`
- `https://inneranimalmedia.com/dashboard/projects`
- `https://inneranimalmedia.com/dashboard/library`
- `https://inneranimalmedia.com/dashboard/tasks`
- `https://inneranimalmedia.com/dashboard/calendar`
- `https://inneranimalmedia.com/dashboard/workflows`
- `https://inneranimalmedia.com/dashboard/workers`
- `https://inneranimalmedia.com/dashboard/deployments`
- `https://inneranimalmedia.com/dashboard/tenants`
- `https://inneranimalmedia.com/dashboard/team`
- `https://inneranimalmedia.com/dashboard/analytics`

#### Tools
- `https://inneranimalmedia.com/dashboard/meauxmcp` (MCP Protocol)
- `https://inneranimalmedia.com/dashboard/meauxsql` (Database Tool)
- `https://inneranimalmedia.com/dashboard/meauxcad` (3D CAD)
- `https://inneranimalmedia.com/dashboard/meauxide` (Code Editor)

#### Public Pages
- `https://inneranimalmedia.com/index.html`
- `https://inneranimalmedia.com/dashboard.html`
- `https://inneranimalmedia.com/features.html`
- `https://inneranimalmedia.com/pricing.html`
- `https://inneranimalmedia.com/terms.html`
- `https://inneranimalmedia.com/tools.html`
- `https://inneranimalmedia.com/tutor.html`
- `https://inneranimalmedia.com/users.html`
- `https://inneranimalmedia.com/workflows.html`
- `https://inneranimalmedia.com/workers.html`

### API Endpoints (Custom Domain - https://inneranimalmedia.com/api)

#### Core API
- `GET https://inneranimalmedia.com/api/` - API info & endpoints list
- `GET https://inneranimalmedia.com/api/stats` - Dashboard statistics
- `GET https://inneranimalmedia.com/api/tenants` - List tenants
- `GET https://inneranimalmedia.com/api/tools` - Available tools
- `GET https://inneranimalmedia.com/api/themes` - UI themes
- `GET https://inneranimalmedia.com/api/workflows` - Workflows list
- `GET https://inneranimalmedia.com/api/deployments` - Deployments (synced from Cloudflare)
- `GET https://inneranimalmedia.com/api/workers` - Workers list (synced from Cloudflare)

#### OAuth & Authentication
- `GET https://inneranimalmedia.com/api/oauth/github` - GitHub OAuth login
- `GET https://inneranimalmedia.com/api/oauth/github/callback` - GitHub OAuth callback
- `GET https://inneranimalmedia.com/api/oauth/google` - Google OAuth login
- `GET https://inneranimalmedia.com/api/oauth/google/callback` - Google OAuth callback

#### Advanced Features
- `GET/POST https://inneranimalmedia.com/api/calendar` - Calendar integration
- `POST https://inneranimalmedia.com/api/agent/execute` - Agent execution
- `GET/POST/PUT/DELETE https://inneranimalmedia.com/api/images` - Image management (R2 + Cloudflare Images)
- `GET/POST https://inneranimalmedia.com/api/users/:userId/preferences` - User preferences
- `GET/POST https://inneranimalmedia.com/api/users/:userId/connections` - External connections

#### Durable Objects (SQL-backed)
- `GET/POST https://inneranimalmedia.com/api/session/:id` - Session management (MCP, browser, video, chat)

---

## 📦 **CLOUDFLARE PAGES** (Alternative Frontend)

### Pages Project
- ✅ **Pages URL**: `https://inneranimalmedia.pages.dev`
- ✅ **Latest Deploy**: `https://2ab0d63a.inneranimalmedia.pages.dev`
- ✅ **Status**: LIVE ✅

---

## 🔐 **DURABLE OBJECTS** (SQL-backed)

### Session Durable Object
- **Binding**: `IAM_SESSION`
- **Class**: `IAMSession`
- **Storage**: SQL-backed (SQLite) ✅
- **Endpoint**: `https://inneranimalmedia.com/api/session/:id`
  - `GET /api/session/:id` - Get session data
  - `POST /api/session/:id` - Update session data

---

## 💾 **DATABASE & STORAGE**

### D1 Database
- **Name**: `inneranimalmedia-business`
- **ID**: `cf87b717-d4e2-4cf8-bab0-a81268e32d49`
- **Binding**: `DB`
- **Access**: Via Worker API endpoints only

### R2 Storage
- **Bucket**: `inneranimalmedia-assets`
- **Binding**: `STORAGE`
- **Static Files Prefix**: `static/` (all frontend files uploaded ✅)
- **Public URL**: `https://pub-e733f82cb31c4f34b6a719e749d0416d.r2.dev`
- **S3 API**: `https://ede6590ac0d2fb7daf155b35653457b2.r2.cloudflarestorage.com/inneranimalmedia-assets`

---

## 🚀 **ADDITIONAL SERVICES**

### InnerAnimalMedia Services Worker
- **Name**: `inneranimalmediaservices`
- **Status**: ⚠️ Created but NOT deployed (in `inneranimalmediaservices/` directory)
- **URL**: `https://inneranimalmediaservices.meauxbility.workers.dev` (when deployed)
- **Features**: MCP server, browser rendering, video calls, chat, Resend email

---

## 📊 **QUICK REFERENCE - MOST USED**

### Primary URLs
1. ✅ **Main Site**: `https://inneranimalmedia.com/` (HTTP 200 ✅)
2. ✅ **Dashboard**: `https://inneranimalmedia.com/dashboard/`
3. ✅ **API Info**: `https://inneranimalmedia.com/api/`
4. ✅ **Projects**: `https://inneranimalmedia.com/dashboard/projects`
5. ✅ **API Stats**: `https://inneranimalmedia.com/api/stats`

### Worker Direct Access (if custom domain issues)
- ✅ **Worker**: `https://inneranimalmedia-dev.meauxbility.workers.dev`
- ✅ **Pages**: `https://inneranimalmedia.pages.dev`

### API Base URLs
- ✅ **Custom Domain**: `https://inneranimalmedia.com/api`
- ✅ **Worker Direct**: `https://inneranimalmedia-dev.meauxbility.workers.dev/api`
- ✅ **Pages**: `https://inneranimalmedia.pages.dev/api` (if routed)

---

## ✅ **VERIFICATION STATUS**

### Live & Working ✅
- ✅ Custom domain: `inneranimalmedia.com` (HTTP 200 ✅)
- ✅ Routes: `inneranimalmedia.com/*` → Worker `inneranimalmedia-dev`
- ✅ Routes: `www.inneranimalmedia.com/*` → Worker `inneranimalmedia-dev`
- ✅ Worker: `inneranimalmedia-dev.meauxbility.workers.dev` (LIVE)
- ✅ Pages: `inneranimalmedia.pages.dev` (LIVE)
- ✅ All API endpoints functional
- ✅ All dashboard pages deployed to R2
- ✅ OAuth endpoints configured
- ✅ Durable Objects (SQL-backed) configured
- ✅ Static files uploaded to R2 (`inneranimalmedia-assets/static/`)
- ✅ Database connected (D1: `inneranimalmedia-business`)
- ✅ R2 storage configured (`inneranimalmedia-assets`)

### Configuration Summary
- **Worker Name**: `inneranimalmedia-dev`
- **R2 Bucket**: `inneranimalmedia-assets` ✅
- **D1 Database**: `inneranimalmedia-business` ✅
- **Durable Object**: `IAMSession` (SQL-backed) ✅
- **Custom Domain**: `inneranimalmedia.com` ✅ (HTTP 200)
- **Pages Project**: `inneranimalmedia` ✅
