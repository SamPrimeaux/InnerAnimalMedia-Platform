# 🌐 Complete Live URLs - InnerAnimalMedia Platform

**Last Updated**: 2025-01-13

---

## 🎯 **PRIMARY PRODUCTION DOMAINS**

### **Custom Domain (Main Site)**
- ✅ **Homepage**: `https://inneranimalmedia.com/`
- ✅ **Dashboard**: `https://inneranimalmedia.com/dashboard/`
- ✅ **API Root**: `https://inneranimalmedia.com/api`
- ✅ **WWW**: `https://www.inneranimalmedia.com/` (also works)

---

## 🚀 **WORKER API (Backend)**

### **Primary Worker**
- ✅ **Worker URL**: `https://inneranimalmedia-dev.meauxbility.workers.dev`
- ✅ **API Root**: `https://inneranimalmedia-dev.meauxbility.workers.dev/api`
- ✅ **Status**: LIVE ✅

### **Routes Configuration**
- `inneranimalmedia.com/*` → Worker `inneranimalmedia-dev`
- `www.inneranimalmedia.com/*` → Worker `inneranimalmedia-dev`

---

## 📄 **DASHBOARD PAGES** (31+ Pages)

### **Main Dashboard**
- `https://inneranimalmedia.com/dashboard/`
- `https://inneranimalmedia.com/dashboard/index.html`

### **Core Pages**
- `https://inneranimalmedia.com/dashboard/projects.html`
- `https://inneranimalmedia.com/dashboard/library.html`
- `https://inneranimalmedia.com/dashboard/tasks.html`
- `https://inneranimalmedia.com/dashboard/calendar.html`
- `https://inneranimalmedia.com/dashboard/workflows.html`
- `https://inneranimalmedia.com/dashboard/workers.html`
- `https://inneranimalmedia.com/dashboard/deployments.html`
- `https://inneranimalmedia.com/dashboard/tenants.html`
- `https://inneranimalmedia.com/dashboard/team.html`
- `https://inneranimalmedia.com/dashboard/analytics.html`

### **Tools**
- `https://inneranimalmedia.com/dashboard/meauxmcp.html` - MCP Protocol Manager
- `https://inneranimalmedia.com/dashboard/meauxsql.html` - Database Query Tool (InnerData)
- `https://inneranimalmedia.com/dashboard/meauxcad.html` - 3D Modeling Tool
- `https://inneranimalmedia.com/dashboard/meauxide.html` - Code Editor
- `https://inneranimalmedia.com/dashboard/meauxwork.html` - Work Management

### **Services & Integrations**
- `https://inneranimalmedia.com/dashboard/ai-services.html`
- `https://inneranimalmedia.com/dashboard/api-gateway.html`
- `https://inneranimalmedia.com/dashboard/cloudflare.html`
- `https://inneranimalmedia.com/dashboard/databases.html`
- `https://inneranimalmedia.com/dashboard/claude.html` - Claude Chat UI

### **Content & Media**
- `https://inneranimalmedia.com/dashboard/gallery.html`
- `https://inneranimalmedia.com/dashboard/templates.html`
- `https://inneranimalmedia.com/dashboard/brand.html`
- `https://inneranimalmedia.com/dashboard/video.html`
- `https://inneranimalmedia.com/dashboard/prompts.html`

### **Communication**
- `https://inneranimalmedia.com/dashboard/messages.html`
- `https://inneranimalmedia.com/dashboard/talk.html`
- `https://inneranimalmedia.com/dashboard/support.html`

### **Settings & Admin**
- `https://inneranimalmedia.com/dashboard/settings.html` - Settings & External Apps
- `https://inneranimalmedia.com/dashboard/clients.html`
- `https://inneranimalmedia.com/dashboard/tail.html` - Tail Workers

---

## 🌐 **PUBLIC PAGES**

- `https://inneranimalmedia.com/` - Homepage
- `https://inneranimalmedia.com/about.html`
- `https://inneranimalmedia.com/contact.html`
- `https://inneranimalmedia.com/pricing.html`
- `https://inneranimalmedia.com/terms.html`
- `https://inneranimalmedia.com/services.html`
- `https://inneranimalmedia.com/work.html`
- `https://inneranimalmedia.com/features.html`
- `https://inneranimalmedia.com/tools.html`
- `https://inneranimalmedia.com/login.html`

---

## 🔌 **API ENDPOINTS**

### **Core API**
- `GET https://inneranimalmedia.com/api` - API info & endpoints list
- `GET https://inneranimalmedia.com/api/stats` - Dashboard statistics
- `GET https://inneranimalmedia.com/api/tenants` - List tenants
- `GET https://inneranimalmedia.com/api/tools` - Available tools
- `GET https://inneranimalmedia.com/api/themes` - UI themes
- `GET https://inneranimalmedia.com/api/workflows` - Workflows list
- `GET https://inneranimalmedia.com/api/deployments` - Deployments (synced from Cloudflare)
- `GET https://inneranimalmedia.com/api/workers` - Workers list (synced from Cloudflare)

### **User Management**
- `GET/POST https://inneranimalmedia.com/api/users/:userId` - User operations
- `GET/POST https://inneranimalmedia.com/api/users/:userId/preferences` - User preferences
- `GET/POST https://inneranimalmedia.com/api/users/:userId/connections` - External app connections

### **OAuth & Authentication**
- `GET https://inneranimalmedia.com/api/oauth/github/authorize` - GitHub OAuth login
- `GET https://inneranimalmedia.com/api/oauth/github/callback` - GitHub OAuth callback
- `GET https://inneranimalmedia.com/api/oauth/google/authorize` - Google OAuth login
- `GET https://inneranimalmedia.com/api/oauth/google/callback` - Google OAuth callback

### **AI Integrations**
- `POST https://inneranimalmedia.com/api/claude/chat` - Claude chat completions
- `POST https://inneranimalmedia.com/api/claude/generate` - Claude text generation
- `POST https://inneranimalmedia.com/api/cursor/chat` - Cursor chat completions
- `POST https://inneranimalmedia.com/api/cursor/generate` - Cursor code generation

### **MCP Protocol**
- `GET https://inneranimalmedia.com/api/mcp/sse` - SSE endpoint for Claude Desktop
- `POST https://inneranimalmedia.com/api/mcp/message` - JSON-RPC message handler
- `GET https://inneranimalmedia.com/api/mcp/tools/list` - List MCP tools
- `POST https://inneranimalmedia.com/api/mcp/tools/call` - Execute MCP tool

### **Storage & Media**
- `GET/POST/PUT/DELETE https://inneranimalmedia.com/api/storage/r2/*` - R2 storage operations
- `GET/POST/PUT/DELETE https://inneranimalmedia.com/api/images/*` - Image management (R2 + Cloudflare Images)

### **Advanced Features**
- `GET/POST https://inneranimalmedia.com/api/calendar/*` - Calendar integration
- `POST https://inneranimalmedia.com/api/agent/execute` - Agent execution
- `GET/POST/PUT/DELETE https://inneranimalmedia.com/api/session/:id` - Session management (Durable Objects)

---

## 📦 **CLOUDFLARE PAGES** (Alternative Frontend)

- ✅ **Pages URL**: `https://inneranimalmedia.pages.dev`
- ✅ **Status**: LIVE ✅

**Note**: Static files are primarily served from R2, but Pages can serve as backup/CDN.

---

## 💾 **STORAGE & DATABASE**

### **R2 Storage**
- **Bucket**: `inneranimalmedia-assets`
- **Public URL**: `https://pub-e733f82cb31c4f34b6a719e749d0416d.r2.dev`
- **S3 API**: `https://ede6590ac0d2fb7daf155b35653457b2.r2.cloudflarestorage.com/inneranimalmedia-assets`
- **Static Files**: `static/` prefix
- **Backups**: `backups/` prefix

### **D1 Database**
- **Database**: `inneranimalmedia-business`
- **ID**: `cf87b717-d4e2-4cf8-bab0-a81268e32d49`
- **Access**: Via Worker API only (not directly accessible)

---

## 🔗 **QUICK REFERENCE**

### **Most Used URLs**
1. **Homepage**: `https://inneranimalmedia.com/`
2. **Dashboard**: `https://inneranimalmedia.com/dashboard/`
3. **API Info**: `https://inneranimalmedia.com/api`
4. **Claude Chat**: `https://inneranimalmedia.com/dashboard/claude.html`
5. **Settings**: `https://inneranimalmedia.com/dashboard/settings.html`

### **API Base URLs** (All Work)
- Custom Domain: `https://inneranimalmedia.com/api`
- Worker Direct: `https://inneranimalmedia-dev.meauxbility.workers.dev/api`
- WWW: `https://www.inneranimalmedia.com/api`

### **Fallback URLs** (If Custom Domain Issues)
- Worker: `https://inneranimalmedia-dev.meauxbility.workers.dev`
- Pages: `https://inneranimalmedia.pages.dev`

---

## ✅ **VERIFICATION STATUS**

### **Live & Working** ✅
- ✅ Custom domain: `inneranimalmedia.com` (configured routes)
- ✅ WWW domain: `www.inneranimalmedia.com` (configured routes)
- ✅ Worker: `inneranimalmedia-dev.meauxbility.workers.dev`
- ✅ Pages: `inneranimalmedia.pages.dev`
- ✅ All API endpoints functional
- ✅ All dashboard pages deployed
- ✅ OAuth endpoints configured
- ✅ Durable Objects (SQL-backed) configured
- ✅ Static files uploaded to R2
- ✅ Database connected (D1)
- ✅ R2 storage configured

---

## 📝 **Notes**

- All URLs work with both `inneranimalmedia.com` and `www.inneranimalmedia.com`
- API calls use `window.location.origin` first, then fallback to `workers.dev`
- Static files are served from R2 at `static/` prefix
- Database is accessed through Worker API only (not directly)
- All remote functionality uses the configured domains
