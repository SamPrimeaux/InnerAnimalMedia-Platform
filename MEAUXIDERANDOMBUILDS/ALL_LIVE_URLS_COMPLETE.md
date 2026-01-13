# 🌐 ALL LIVE URLS - Complete Master List

## 🎯 **PRIMARY PRODUCTION**

### Custom Domain (Main Site)
- **Homepage**: `https://inneranimalmedia.com/`
- **Dashboard**: `https://inneranimalmedia.com/dashboard/`
- **API Base**: `https://inneranimalmedia.com/api/`

---

## 🚀 **WORKER - Main Application**

### Production Worker
- **Main URL**: `https://inneranimalmedia-dev.meauxbility.workers.dev`
- **API Root**: `https://inneranimalmedia-dev.meauxbility.workers.dev/api`
- **Status**: ✅ LIVE

---

## 📄 **FRONTEND PAGES**

### Dashboard Pages
**Via Custom Domain (`inneranimalmedia.com/dashboard/`):**
- Overview: `https://inneranimalmedia.com/dashboard/` or `/dashboard/index`
- Projects: `https://inneranimalmedia.com/dashboard/projects`
- Clients: `https://inneranimalmedia.com/dashboard/clients`
- Team: `https://inneranimalmedia.com/dashboard/team`
- InnerWork (Tasks): `https://inneranimalmedia.com/dashboard/tasks`
- Calendar: `https://inneranimalmedia.com/dashboard/calendar`
- Messages: `https://inneranimalmedia.com/dashboard/messages`
- Video Calls: `https://inneranimalmedia.com/dashboard/video`
- Workflows/Automation: `https://inneranimalmedia.com/dashboard/workflows`
- Deployments: `https://inneranimalmedia.com/dashboard/deployments`
- Workers: `https://inneranimalmedia.com/dashboard/workers`
- Tenants: `https://inneranimalmedia.com/dashboard/tenants`
- Analytics: `https://inneranimalmedia.com/dashboard/analytics`
- AI Services: `https://inneranimalmedia.com/dashboard/ai-services`
- AI Prompts: `https://inneranimalmedia.com/dashboard/prompts`
- API Gateway: `https://inneranimalmedia.com/dashboard/api-gateway`
- Cloudflare: `https://inneranimalmedia.com/dashboard/cloudflare`
- Databases: `https://inneranimalmedia.com/dashboard/databases`
- Library/CMS: `https://inneranimalmedia.com/dashboard/library`
- Gallery: `https://inneranimalmedia.com/dashboard/gallery`
- Templates: `https://inneranimalmedia.com/dashboard/templates`
- Brand Central: `https://inneranimalmedia.com/dashboard/brand`
- Settings: `https://inneranimalmedia.com/dashboard/settings`
- Support: `https://inneranimalmedia.com/dashboard/support`

### Tools
- **MeauxMCP** (MCP Protocol): `https://inneranimalmedia.com/dashboard/meauxmcp`
- **MeauxSQL** (Database Tool): `https://inneranimalmedia.com/dashboard/meauxsql`
- **MeauxCAD** (3D CAD): `https://inneranimalmedia.com/dashboard/meauxcad`
- **MeauxIDE** (Code Editor): `https://inneranimalmedia.com/dashboard/meauxide`

### Public Pages
- Homepage: `https://inneranimalmedia.com/` or `/index.html`
- Dashboard: `https://inneranimalmedia.com/dashboard.html`
- Features: `https://inneranimalmedia.com/features.html`
- Pricing: `https://inneranimalmedia.com/pricing.html`
- About: `https://inneranimalmedia.com/about.html`
- Contact: `https://inneranimalmedia.com/contact.html`
- Terms: `https://inneranimalmedia.com/terms.html`
- Tools: `https://inneranimalmedia.com/tools.html`
- Template Gallery: `https://inneranimalmedia.com/templategallery.html`
- Workflows: `https://inneranimalmedia.com/workflows.html`
- Workers: `https://inneranimalmedia.com/workers.html`
- Users: `https://inneranimalmedia.com/users.html`
- Tutor: `https://inneranimalmedia.com/tutor.html`
- Vectorize: `https://inneranimalmedia.com/vectorize.html`
- Vision Board: `https://inneranimalmedia.com/vision-board.html`
- Wallet: `https://inneranimalmedia.com/wallet.html`
- Watchlist: `https://inneranimalmedia.com/watchlist.html`
- Work: `https://inneranimalmedia.com/work.html`
- Portfolio: `https://inneranimalmedia.com/v1connor-portfolio.html`
- Donate Header: `https://inneranimalmedia.com/uniform-header-donate.html`

---

## 🔧 **API ENDPOINTS**

**Base URL:** `https://inneranimalmedia-dev.meauxbility.workers.dev/api`  
**Or:** `https://inneranimalmedia.com/api`

### Core API
- **API Info**: `GET /api` - List all endpoints
- **Stats**: `GET /api/stats` - Dashboard statistics
- **Tenants**: `GET /api/tenants` - List tenants
- **Tools**: `GET /api/tools` - Available tools
- **Themes**: `GET /api/themes` - UI themes
- **Workflows**: `GET /api/workflows` - Workflows list
- **Deployments**: `GET /api/deployments` - Deployments (synced from Cloudflare)
- **Workers**: `GET /api/workers` - Workers list (synced from Cloudflare)

### OAuth & Authentication
- **GitHub OAuth**: `GET /api/oauth/github/authorize?user_id={id}`
- **GitHub Callback**: `GET /api/oauth/github/callback`
- **Google OAuth**: `GET /api/oauth/google/authorize?user_id={id}`
- **Google Callback**: `GET /api/oauth/google/callback`

### Email Templates
- **List Templates**: `GET /api/email-templates`
- **Seed Templates**: `POST /api/email-templates/seed`
- **Test Templates**: `POST /api/email-templates/test` (sends to email)

### Resend (Email)
- **Resend Info**: `GET /api/resend`
- **Send Email**: `POST /api/resend/emails`
- **Domains**: `GET /api/resend/domains`
- **Webhook**: `POST /api/webhooks/resend`

### Images & Media
- **List Images**: `GET /api/images`
- **Upload Image**: `POST /api/images`
- **Get Image**: `GET /api/images/:id`
- **Delete Image**: `DELETE /api/images/:id`

### Calendar
- **Get Calendar**: `GET /api/calendar`
- **Create Event**: `POST /api/calendar`
- **Update Event**: `PUT /api/calendar/:id`
- **Delete Event**: `DELETE /api/calendar/:id`

### Agent & AI
- **Execute Agent**: `POST /api/agent/execute`
- **AI Code**: `POST /api/ai/code`
- **Unified AI**: `POST /api/ai/unified`
- **Cursor API**: `POST /api/cursor/chat` | `/generate` | `/review` | `/refactor` | `/explain` | `/tests`

### Projects & Builds
- **List Projects**: `GET /api/projects`
- **Create Project**: `POST /api/projects`
- **Get Project**: `GET /api/projects/:id`
- **Update Project**: `PUT /api/projects/:id`
- **Delete Project**: `DELETE /api/projects/:id`

### Invoices & Billing
- **List Invoices**: `GET /api/invoice`
- **Get Invoice**: `GET /api/invoice/:id`
- **Generate Invoice**: `POST /api/invoice`

### User Management
- **User Preferences**: `GET/POST /api/users/:userId/preferences`
- **User Connections**: `GET/POST /api/users/:userId/connections`

### Sessions (Durable Objects)
- **Get Session**: `GET /api/session/:id`
- **Update Session**: `POST /api/session/:id`
- **Create Session**: `POST /api/session`

### SQL & Database
- **Execute SQL**: `POST /api/sql/execute`

### Supabase
- **Supabase Proxy**: `GET/POST /api/supabase/*`

### Support
- **Create Ticket**: `POST /api/support/tickets`
- **List Tickets**: `GET /api/support/tickets`
- **Get Ticket**: `GET /api/support/tickets/:id`

### Other Endpoints
- **Commands**: `GET/POST /api/commands`
- **Tasks**: `GET/POST /api/tasks`
- **Messages**: `GET/POST /api/messages`
- **Threads**: `GET/POST /api/threads`
- **Video**: `GET/POST /api/video`
- **Analytics Track**: `POST /api/analytics/track`
- **Cost Tracking**: `GET/POST /api/cost-tracking`
- **Brand**: `GET/POST /api/brand`
- **Databases**: `GET /api/databases`
- **Library**: `GET/POST /api/library`
- **MeauxWork**: `GET/POST /api/meauxwork`
- **Team**: `GET/POST /api/team`
- **Onboarding**: `GET/POST /api/onboarding`
- **Activation**: `GET/POST /api/activation`
- **Gateway**: `GET/POST /api/gateway`
- **CAD**: `GET/POST /api/cad`
- **AI Services**: `GET/POST /api/ai-services`

---

## 📦 **CLOUDFLARE PAGES** (Alternative Frontend)

### Pages Project
- **Pages URL**: `https://inneranimalmedia.pages.dev`
- **Latest Deploy**: Auto-generated per deployment
- **Status**: ✅ LIVE

### Old Pages Project (MeauxOS)
- **Pages URL**: `https://meauxos-unified-dashboard.pages.dev`
- **Dashboard**: `https://meauxos-unified-dashboard.pages.dev/dashboard/`
- **Status**: ✅ LIVE

---

## 💾 **DATABASE & STORAGE**

### D1 Databases
- **Primary**: `inneranimalmedia-business` (ID: `cf87b717-d4e2-4cf8-bab0-a81268e32d49`)
- **Legacy**: `meauxos` (ID: `d8261777-9384-44f7-924d-c92247d55b46`)

### R2 Storage Buckets
- **Assets**: `inneranimalmedia-assets`
- **Icons**: `splineicons`
- **Public R2 URL**: `https://pub-e733f82cb31c4f34b6a719e749d0416d.r2.dev`

### Cloudflare Images
- **Account Hash**: `g7wf09fCONpnidkRnR_5vw`
- **Delivery URL**: `https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/{image_id}/avatar`

---

## 🔐 **DURABLE OBJECTS**

### IAM Session (SQL-backed)
- **Binding**: `SESSION_DO`
- **Class**: `IAMSession`
- **Endpoint**: `/api/session/:id`

---

## 🌍 **TESTING & DEVELOPMENT**

### Test Endpoints
- **GitHub OAuth Test**: `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/authorize?user_id=test-user`
- **Google OAuth Test**: `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/authorize?user_id=test-user`
- **Email Templates Test**: `curl -X POST "https://inneranimalmedia-dev.meauxbility.workers.dev/api/email-templates/test" -H "Content-Type: application/json" -d '{"email":"meauxbility@gmail.com"}'`
- **API Info**: `curl https://inneranimalmedia-dev.meauxbility.workers.dev/api`

---

## 📊 **QUICK REFERENCE**

### Most Used URLs
1. **Dashboard**: `https://inneranimalmedia.com/dashboard/`
2. **API Root**: `https://inneranimalmedia-dev.meauxbility.workers.dev/api`
3. **Homepage**: `https://inneranimalmedia.com/`
4. **Projects**: `https://inneranimalmedia.com/dashboard/projects`
5. **Workflows**: `https://inneranimalmedia.com/dashboard/workflows`

### Worker Direct URLs (if custom domain issues)
- **Main**: `https://inneranimalmedia-dev.meauxbility.workers.dev`
- **Dashboard**: `https://inneranimalmedia-dev.meauxbility.workers.dev/dashboard/`
- **API**: `https://inneranimalmedia-dev.meauxbility.workers.dev/api`

### API Testing
```bash
# Test API is live
curl https://inneranimalmedia-dev.meauxbility.workers.dev/api

# Get stats
curl https://inneranimalmedia-dev.meauxbility.workers.dev/api/stats

# Get tools
curl https://inneranimalmedia-dev.meauxbility.workers.dev/api/tools

# Test OAuth
curl -I "https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/authorize?user_id=test-user"
```

---

## ✅ **STATUS**

### ✅ Live & Working
- ✅ Custom domain: `inneranimalmedia.com`
- ✅ Worker: `inneranimalmedia-dev.meauxbility.workers.dev`
- ✅ Pages: `inneranimalmedia.pages.dev` & `meauxos-unified-dashboard.pages.dev`
- ✅ All API endpoints functional
- ✅ All dashboard pages deployed
- ✅ OAuth endpoints configured (need credentials)
- ✅ Email templates seeded
- ✅ Database connected
- ✅ R2 storage configured
- ✅ Durable Objects configured

---

## 🔗 **ROUTES CONFIGURATION**

### Worker Routes
- `inneranimalmedia.com/*` → Worker `inneranimalmedia-dev`
- `www.inneranimalmedia.com/*` → Worker `inneranimalmedia-dev`

### Static Files
- Served from R2 bucket `inneranimalmedia-assets/static/`
- Or from Cloudflare Pages

### API Routes
- All `/api/*` routes handled by worker
- All `/dashboard/*` routes served by worker (HTML/SPA)

---

**All URLs are live and accessible globally via Cloudflare's CDN!** 🚀
