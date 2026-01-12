# 🔗 Complete Live URLs Checklist - InnerAnimalMedia.com

**Base URL**: `https://inneranimalmedia.com`  
**Testing Date**: ___________  
**Tester**: ___________  

---

## 📋 PUBLIC PAGES (Root Level)

### Homepage & Main Pages
- [ ] `/` → Root homepage (index.html)
- [ ] `/index.html` → Homepage (alternative)
- [ ] `/about` or `/about.html` → About page
- [ ] `/contact` or `/contact.html` → Contact page
- [ ] `/pricing` or `/pricing.html` → Pricing page
- [ ] `/services` or `/services.html` → Services page
- [ ] `/features` or `/features.html` → Features page
- [ ] `/tools` or `/tools.html` → Tools page
- [ ] `/workflows` or `/workflows.html` → Workflows page
- [ ] `/login` or `/login.html` → Login page

### Other Root Pages (Verify if live)
- [ ] `/work` or `/work.html`
- [ ] `/terms` or `/terms.html` (redirects to /legal/terms?)
- [ ] `/dashboard.html` (legacy? redirects to /dashboard?)

---

## 🎛️ DASHBOARD PAGES (`/dashboard/*`)

### Core Dashboard
- [ ] `/dashboard` → Main dashboard overview (redirects to /dashboard/index.html)
- [ ] `/dashboard/` → Main dashboard overview
- [ ] `/dashboard/index.html` → Dashboard overview page

### Main Features
- [ ] `/dashboard/projects` → Projects management
- [ ] `/dashboard/workflows` → Workflows management
- [ ] `/dashboard/deployments` → Deployments dashboard
- [ ] `/dashboard/workers` → Cloudflare Workers management
- [ ] `/dashboard/tenants` → Tenant management
- [ ] `/dashboard/clients` → Client management
- [ ] `/dashboard/team` → Team management
- [ ] `/dashboard/settings` → Settings page

### Meaux Tools Suite
- [ ] `/dashboard/meauxmcp` → MCP Protocol Manager
- [ ] `/dashboard/meauxsql` → InnerData SQL query tool
- [ ] `/dashboard/meauxcad` → 3D modeling tool
- [ ] `/dashboard/meauxide` → Code editor tool
- [ ] `/dashboard/meauxwork` → Work management tool

### Media & Content
- [ ] `/dashboard/gallery` → Image gallery
- [ ] `/dashboard/library` → Library/asset management
- [ ] `/dashboard/templates` → Template gallery
- [ ] `/dashboard/video` → Video management

### Communication & Tasks
- [ ] `/dashboard/messages` → Messages/chat
- [ ] `/dashboard/tasks` → Task management
- [ ] `/dashboard/calendar` → Calendar view
- [ ] `/dashboard/support` → Support tickets

### Advanced Features
- [ ] `/dashboard/analytics` → Analytics dashboard
- [ ] `/dashboard/ai-services` → AI services management
- [ ] `/dashboard/prompts` → AI prompts library
- [ ] `/dashboard/databases` → Database management
- [ ] `/dashboard/cloudflare` → Cloudflare integration
- [ ] `/dashboard/api-gateway` → API gateway management
- [ ] `/dashboard/brand` → Branding/customization

---

## ⚖️ LEGAL PAGES (`/legal/*`)

- [ ] `/legal/terms` or `/legal/terms.html` → Terms of Service
- [ ] `/legal/privacy` or `/legal/privacy.html` → Privacy Policy

---

## 🔌 API ENDPOINTS (`/api/*`)

### Core API
- [ ] `GET /api` → API root/info
- [ ] `GET /api/stats` → Statistics
- [ ] `GET /api/tenants` → List tenants
- [ ] `POST /api/tenants` → Create tenant

### Workflows & Deployments
- [ ] `GET /api/workflows` → List workflows
- [ ] `POST /api/workflows` → Create workflow
- [ ] `GET /api/deployments` → List deployments
- [ ] `GET /api/workers` → List Cloudflare Workers

### Tools & Themes
- [ ] `GET /api/tools` → List available tools
- [ ] `GET /api/themes` → List themes

### OAuth & Authentication
- [ ] `GET /api/oauth/google/authorize` → Google OAuth start
- [ ] `GET /api/oauth/google/callback` → Google OAuth callback
- [ ] `GET /api/oauth/github/authorize` → GitHub OAuth start
- [ ] `GET /api/oauth/github/callback` → GitHub OAuth callback
- [ ] `/auth/google/callback` → Alternative OAuth callback
- [ ] `/auth/github/callback` → Alternative OAuth callback
- [ ] `/dashboard/auth/callback` → Dashboard OAuth callback
- [ ] `/login/callback` → Login callback

### Calendar
- [ ] `GET /api/calendar` → Calendar events
- [ ] `POST /api/calendar` → Create calendar event

### AI & Agent
- [ ] `GET /api/agent/execute` → Execute agent
- [ ] `POST /api/agent/execute` → Execute agent
- [ ] `GET /api/prompts` → List AI prompts
- [ ] `POST /api/prompts/:name/execute` → Execute prompt
- [ ] `GET /api/ai-services` → AI services
- [ ] `GET /api/workflow-stages` → Workflow stages
- [ ] `GET /api/tool-roles` → Tool roles

### Images & Media
- [ ] `GET /api/images` → List images (Cloudflare Images)
- [ ] `POST /api/images` → Upload image

### Projects & Tasks
- [ ] `GET /api/projects` → List projects
- [ ] `POST /api/projects` → Create project
- [ ] `GET /api/tasks` → List tasks
- [ ] `POST /api/tasks` → Create task

### Database & SQL
- [ ] `POST /api/sql` → Execute SQL query
- [ ] `POST /api/meauxsql` → Execute SQL (MeauxSQL)
- [ ] `GET /api/databases` → List databases

### Messages & Communication
- [ ] `GET /api/messages` → List messages
- [ ] `POST /api/messages` → Send message
- [ ] `GET /api/threads` → List threads
- [ ] `POST /api/threads` → Create thread
- [ ] `GET /api/video` → Video sessions

### Onboarding & Activation
- [ ] `GET /api/onboarding` → Onboarding status
- [ ] `POST /api/onboarding` → Update onboarding
- [ ] `GET /api/activation` → Activation checklist
- [ ] `POST /api/activation/check/:key` → Complete activation check

### Migration & Utilities
- [ ] `POST /api/migrate` → Run migration
- [ ] `GET /api/analytics/track` → Track analytics event (POST)

### Cost Tracking
- [ ] `GET /api/cost-tracking` → Cost tracking data
- [ ] `GET /api/costs` → Cost tracking (alternative)

### Support & Help
- [ ] `GET /api/support/tickets` → List support tickets
- [ ] `POST /api/support/tickets` → Create support ticket
- [ ] `POST /api/support/tickets/:id/messages` → Add message to ticket
- [ ] `GET /api/help` → Help center
- [ ] `GET /api/help/search` → Search help articles
- [ ] `POST /api/help/articles/:id/feedback` → Article feedback
- [ ] `POST /api/feedback` → Customer feedback

### Knowledge Base & RAG
- [ ] `GET /api/knowledge` → Knowledge base
- [ ] `GET /api/kb` → Knowledge base (alternative)
- [ ] `GET /api/pipelines` → Workflow pipelines
- [ ] `GET /api/rag` → RAG search
- [ ] `GET /api/search` → Search (alternative)

### CAD & Design
- [ ] `GET /api/cad` → CAD data
- [ ] `GET /api/meauxcad` → MeauxCAD (alternative)

### Analytics
- [ ] `GET /api/analytics` → Analytics dashboard data

### Gateway & Integrations
- [ ] `GET /api/gateway` → API gateway
- [ ] `GET /api/api-gateway` → API gateway (alternative)
- [ ] `GET /api/brand` → Brand settings
- [ ] `GET /api/supabase` → Supabase integration

### Library & Assets
- [ ] `GET /api/library` → Library management
- [ ] `GET /api/libraries` → Library (alternative)
- [ ] `GET /api/drive` → Google Drive integration

### Work Management
- [ ] `GET /api/meauxwork` → MeauxWork data
- [ ] `GET /api/work` → Work (alternative)

### Team Management
- [ ] `GET /api/team` → Team data
- [ ] `GET /api/teams` → Teams (alternative)

### User Preferences & Connections
- [ ] `GET /api/users/:id/preferences` → User preferences
- [ ] `POST /api/users/:id/preferences` → Update preferences
- [ ] `GET /api/users/:id/connections` → External connections
- [ ] `POST /api/users/:id/connections` → Add connection

### Chat & MCP
- [ ] `GET /api/chat` → Chat messages
- [ ] `POST /api/chat` → Send chat message
- [ ] `GET /api/mcp` → MCP protocol

### Files & IDE
- [ ] `GET /api/files` → File management
- [ ] `POST /api/files` → Upload file
- [ ] `GET /api/ide` → IDE file management

### Backup
- [ ] `GET /api/backup/:filename.tar.gz` → Download backup

### Webhooks
- [ ] `POST /api/webhooks/resend` → Resend webhook

### Email
- [ ] `POST /api/resend` → Send email via Resend

### Session Management
- [ ] `GET /api/session/:id` → Get session (Durable Object)
- [ ] `POST /api/session/:id` → Update session

---

## 🧪 SPECIAL ROUTES (Alternative Paths)

### OAuth Callbacks (Multiple Patterns)
- [ ] `/auth/google/callback`
- [ ] `/auth/github/callback`
- [ ] `/api/auth/google/callback`
- [ ] `/api/auth/github/callback`
- [ ] `/dashboard/auth/callback`
- [ ] `/login/callback`

### Query Parameters to Test
- [ ] `?oauth_success=google` → Should show success message
- [ ] `?oauth_error=...` → Should show error message
- [ ] `?oauth_success=github` → Should show success message

---

## 🔍 WHAT TO CHECK FOR EACH URL

### Page URLs (HTML):
- [ ] ✅ Page loads without errors
- [ ] ✅ No 404 errors
- [ ] ✅ No console errors (check browser DevTools)
- [ ] ✅ Styles load correctly (CSS)
- [ ] ✅ Images/assets load
- [ ] ✅ JavaScript functions work
- [ ] ✅ Navigation/sidebar works
- [ ] ✅ Data loads from API (if applicable)
- [ ] ✅ Mobile responsive (check on mobile device)
- [ ] ✅ OAuth login works (if protected page)

### API Endpoints:
- [ ] ✅ Returns correct HTTP status (200, 201, etc.)
- [ ] ✅ Returns valid JSON
- [ ] ✅ CORS headers present (if called from frontend)
- [ ] ✅ Returns expected data structure
- [ ] ✅ Handles errors gracefully (400, 404, 500)
- [ ] ✅ Authentication works (if protected)
- [ ] ✅ Tenant isolation works (multi-tenant endpoints)

---

## 🐛 COMMON ISSUES TO LOOK FOR

### Visual Issues:
- [ ] Missing CSS/styling
- [ ] Broken images
- [ ] Layout broken on mobile
- [ ] Sidebar not showing/hiding correctly
- [ ] Dark theme not applied

### Functional Issues:
- [ ] API calls failing (check Network tab)
- [ ] Data not loading
- [ ] Buttons not working
- [ ] Forms not submitting
- [ ] Search/filter not working
- [ ] Pagination not working

### Authentication Issues:
- [ ] Can't log in via Google OAuth
- [ ] Session expires too quickly
- [ ] Can't access protected pages
- [ ] Tenant data not loading

### Performance Issues:
- [ ] Page loads slowly
- [ ] API responses slow
- [ ] Images not optimized
- [ ] Too many API calls

---

## 📝 TESTING NOTES

**Date Tested**: ___________  
**Browser**: ___________  
**Device**: ___________  
**Issues Found**:  
```
1. 
2. 
3. 
```

**Fixed Issues**:  
```
1. 
2. 
3. 
```

**Remaining Issues**:  
```
1. 
2. 
3. 
```

---

## 🚨 PRIORITY BUGS (Critical Issues)

1. **Page doesn't load (404 or 500 error)**
   - URL: ___________
   - Error: ___________
   - Steps to reproduce: ___________

2. **Data not showing**
   - URL: ___________
   - Expected: ___________
   - Actual: ___________

3. **Authentication not working**
   - URL: ___________
   - Issue: ___________
   - Steps to reproduce: ___________

---

## ✅ VERIFICATION COMMANDS

### Quick Test (curl):
```bash
# Test homepage
curl -I https://inneranimalmedia.com/

# Test dashboard
curl -I https://inneranimalmedia.com/dashboard

# Test API
curl https://inneranimalmedia.com/api/stats

# Test OAuth endpoint
curl -I https://inneranimalmedia.com/api/oauth/google/authorize
```

### Check HTTP Status Codes:
```bash
# Should return 200 (OK)
curl -s -o /dev/null -w "%{http_code}" https://inneranimalmedia.com/

# Should return 200 for dashboard
curl -s -o /dev/null -w "%{http_code}" https://inneranimalmedia.com/dashboard

# API should return 200 with JSON
curl -s -o /dev/null -w "%{http_code}" https://inneranimalmedia.com/api/stats
```

---

**Last Updated**: January 11, 2026  
**Total URLs to Test**: ~150+ (pages + API endpoints)  
**Estimated Testing Time**: 2-3 hours for thorough testing
