# 🌐 LIVE URLs - InnerAnimalMedia

## 🎯 Primary Domain (Custom Domain)
**Production Site**: `https://inneranimalmedia.com/`
- Routes configured: `inneranimalmedia.com/*` and `www.inneranimalmedia.com/*`
- Served by: Worker `inneranimalmedia-dev` (static files from R2)

---

## 🔧 Worker (API + Frontend)

### Main Worker URL
**Worker**: `https://inneranimalmedia-dev.meauxbility.workers.dev`
- **Status**: ✅ LIVE
- **Routes**: Handles all routes on custom domain
- **Static Files**: Served from R2 bucket `inneranimalmedia-assets` at `static/` prefix

### Frontend Pages (via Worker)
- **Homepage**: `https://inneranimalmedia.com/` or `https://inneranimalmedia-dev.meauxbility.workers.dev/`
- **Dashboard**: `https://inneranimalmedia.com/dashboard/` or `https://inneranimalmedia-dev.meauxbility.workers.dev/dashboard/`
- **Projects**: `https://inneranimalmedia.com/dashboard/projects`
- **Library**: `https://inneranimalmedia.com/dashboard/library`
- **Tasks**: `https://inneranimalmedia.com/dashboard/tasks`
- **Calendar**: `https://inneranimalmedia.com/dashboard/calendar`
- **Workflows**: `https://inneranimalmedia.com/dashboard/workflows`
- **Workers**: `https://inneranimalmedia.com/dashboard/workers`
- **Deployments**: `https://inneranimalmedia.com/dashboard/deployments`
- **Tenants**: `https://inneranimalmedia.com/dashboard/tenants`

### Tools (via Worker)
- **MeauxMCP**: `https://inneranimalmedia.com/dashboard/meauxmcp`
- **MeauxSQL**: `https://inneranimalmedia.com/dashboard/meauxsql`
- **MeauxCAD**: `https://inneranimalmedia.com/dashboard/meauxcad`
- **MeauxIDE**: `https://inneranimalmedia.com/dashboard/meauxide`

### API Endpoints (via Worker)
- **API Root**: `https://inneranimalmedia.com/api` or `https://inneranimalmedia-dev.meauxbility.workers.dev/api`
- **Stats**: `https://inneranimalmedia.com/api/stats`
- **Tenants**: `https://inneranimalmedia.com/api/tenants`
- **Workflows**: `https://inneranimalmedia.com/api/workflows`
- **Deployments**: `https://inneranimalmedia.com/api/deployments`
- **Workers**: `https://inneranimalmedia.com/api/workers`
- **Tools**: `https://inneranimalmedia.com/api/tools`
- **Themes**: `https://inneranimalmedia.com/api/themes`
- **Calendar**: `https://inneranimalmedia.com/api/calendar`
- **Agent**: `https://inneranimalmedia.com/api/agent/execute`
- **Images**: `https://inneranimalmedia.com/api/images`
- **OAuth (GitHub)**: `https://inneranimalmedia.com/api/oauth/github`
- **OAuth (Google)**: `https://inneranimalmedia.com/api/oauth/google`
- **Session (Durable Object)**: `https://inneranimalmedia.com/api/session/:id`

---

## 📦 Cloudflare Pages (Alternative Frontend)

### Pages Project
**Project**: `inneranimalmedia`
- **Pages URL**: `https://inneranimalmedia.pages.dev`
- **Latest Deploy**: `https://2ab0d63a.inneranimalmedia.pages.dev`
- **Status**: ✅ Deployed

---

## 🔐 Durable Objects (SQL-backed)

### Session Durable Object
- **Binding**: `IAM_SESSION`
- **Class**: `IAMSession`
- **Storage**: SQL-backed (SQLite)
- **Endpoint**: `/api/session/:id`

---

## 💾 Database & Storage

### D1 Database
- **Database**: `inneranimalmedia-business`
- **ID**: `cf87b717-d4e2-4cf8-bab0-a81268e32d49`
- **Binding**: `DB`
- **Access**: Via Worker API only

### R2 Storage
- **Bucket**: `inneranimalmedia-assets`
- **Binding**: `STORAGE`
- **Static Files Prefix**: `static/`
- **Public URL**: `https://pub-e733f82cb31c4f34b6a719e749d0416d.r2.dev`

---

## 🚀 Services Worker (Separate)

### InnerAnimalMedia Services
**Worker**: `inneranimalmediaservices`
- **Status**: ⚠️ Created but not deployed (in `inneranimalmediaservices/` directory)
- **Features**: MCP, Browser Rendering, Video Calls, Chat, Email (Resend)
- **Durable Object**: `IAMSession` (separate from main worker)

---

## 📝 Summary

### Live & Working ✅
- ✅ `https://inneranimalmedia.com/` - Main site (via worker)
- ✅ `https://inneranimalmedia-dev.meauxbility.workers.dev` - Direct worker access
- ✅ `https://inneranimalmedia.pages.dev` - Cloudflare Pages (alternative)
- ✅ All API endpoints at `/api/*`
- ✅ All dashboard pages
- ✅ OAuth endpoints functional
- ✅ Durable Objects (SQL-backed) configured
- ✅ Static files served from R2

### Custom Domain Configuration
- **Routes**: `inneranimalmedia.com/*` → Worker
- **Routes**: `www.inneranimalmedia.com/*` → Worker
- **All traffic**: Handled by `inneranimalmedia-dev` worker
