# 🌐 Complete URLs, App Descriptions & GitHub OAuth Setup

## 🎯 Production Domain

**Main Domain**: `inneranimalmedia.com`  
**API Worker**: `https://iaccess-api.meauxbility.workers.dev` (or custom domain)

---

## 📄 Public Pages

### Homepage
- **URL**: `https://inneranimalmedia.com/`
- **Description**: Public landing page with features, stats, and call-to-action
- **File**: `index.html`

### Terms of Service
- **URL**: `https://inneranimalmedia.com/terms`
- **Description**: Terms of service and legal information
- **File**: `legal/terms.html`

### Privacy Policy
- **URL**: `https://inneranimalmedia.com/privacy`
- **Description**: Privacy policy and data handling
- **File**: `legal/privacy.html`

---

## 🎛️ Dashboard Pages (Authenticated)

### Main Dashboard
- **URL**: `https://inneranimalmedia.com/dashboard`
- **Description**: Main dashboard overview with stats, recent activity, and quick access to all tools
- **Features**: Real-time stats cards, recent deployments, workflows, workers
- **File**: `dashboard/index.html`

### Settings
- **URL**: `https://inneranimalmedia.com/dashboard/settings`
- **Description**: User preferences, theme management, account settings, API keys
- **Features**: Theme library (31+ themes), account management, preferences
- **File**: `dashboard/settings.html`

---

## 🔧 Core Tools & Applications

### MeauxMCP (MCP Protocol Manager)
- **URL**: `https://inneranimalmedia.com/dashboard/meauxmcp`
- **Description**: Model Context Protocol manager - Manage MCP connections, tools, and nodes
- **Features**: 
  - MCP node management
  - Tool execution
  - Connection monitoring
  - Database queries (D1)
  - Cloudflare API integration
- **File**: `dashboard/meauxmcp.html`
- **Backend**: `/api/mcp/*`

### MeauxSQL (InnerData)
- **URL**: `https://inneranimalmedia.com/dashboard/meauxsql`
- **Description**: Database query tool - Direct SQL interface to D1 databases
- **Features**:
  - SQL query editor
  - Multiple database connections
  - Query history
  - Result visualization
  - Database schema browser
- **File**: `dashboard/meauxsql.html`
- **Backend**: `/api/databases/*`

### MeauxCAD (3D Modeling)
- **URL**: `https://inneranimalmedia.com/dashboard/meauxcad`
- **Description**: 3D modeling and CAD tool - Create and edit 3D models
- **Features**:
  - Text-to-3D generation (Meshy AI)
  - File format conversion (CloudConvert)
  - Model library (R2 storage)
  - Blender integration (planned)
  - 3D viewer
- **File**: `dashboard/meauxcad.html`
- **Backend**: `/api/meauxcad/*`
- **Integrations**: Meshy AI, CloudConvert, Blender (R2 storage)

### MeauxIDE (Code Editor)
- **URL**: `https://inneranimalmedia.com/dashboard/meauxide`
- **Description**: Integrated development environment - Online code editor
- **Features**:
  - Code editor with syntax highlighting
  - File management
  - Terminal integration
  - Git integration
  - Multi-language support
- **File**: `dashboard/meauxide.html`
- **Backend**: `/api/meauxide/*`

---

## 📊 Management Pages

### Analytics
- **URL**: `https://inneranimalmedia.com/dashboard/analytics`
- **Description**: Analytics dashboard - Track usage, performance, and metrics
- **Features**: Usage stats, performance metrics, user analytics
- **File**: `dashboard/analytics.html`

### API Gateway
- **URL**: `https://inneranimalmedia.com/dashboard/api-gateway`
- **Description**: API management - Manage API endpoints, keys, and access
- **Features**: API key management, endpoint configuration, usage tracking
- **File**: `dashboard/api-gateway.html`

### Databases
- **URL**: `https://inneranimalmedia.com/dashboard/databases`
- **Description**: Database management - Manage D1 databases and connections
- **Features**: Database list, connection management, schema browser
- **File**: `dashboard/databases.html`

### Deployments
- **URL**: `https://inneranimalmedia.com/dashboard/deployments`
- **Description**: Deployment management - View and manage Cloudflare Pages deployments
- **Features**: 
  - Sync from Cloudflare API
  - Deployment history
  - Status filtering
  - Project management
- **File**: `dashboard/deployments.html`
- **Backend**: `/api/deployments`

### Workers
- **URL**: `https://inneranimalmedia.com/dashboard/workers`
- **Description**: Cloudflare Workers management - View and manage Workers
- **Features**:
  - Sync from Cloudflare API
  - Worker stats
  - Request tracking
  - Status monitoring
- **File**: `dashboard/workers.html`
- **Backend**: `/api/workers`

### Workflows
- **URL**: `https://inneranimalmedia.com/dashboard/workflows`
- **Description**: Workflow automation - Create and manage automated workflows
- **Features**: Workflow builder, execution history, status tracking
- **File**: `dashboard/workflows.html`
- **Backend**: `/api/workflows`

### Projects
- **URL**: `https://inneranimalmedia.com/dashboard/projects`
- **Description**: Project management - Manage software projects and builds
- **Features**: Project overview, build history, repository integration
- **File**: `dashboard/projects.html`

---

## 👥 Team & Collaboration

### Team
- **URL**: `https://inneranimalmedia.com/dashboard/team`
- **Description**: Team management - Manage team members and permissions
- **Features**: Member management, role assignment, permissions
- **File**: `dashboard/team.html`

### Tenants
- **URL**: `https://inneranimalmedia.com/dashboard/tenants`
- **Description**: Multi-tenant management - Manage tenant organizations
- **Features**: Tenant list, subscription management, usage tracking
- **File**: `dashboard/tenants.html`
- **Backend**: `/api/tenants`

### Messages
- **URL**: `https://inneranimalmedia.com/dashboard/messages`
- **Description**: Messaging system - Team communication and notifications
- **Features**: Direct messages, team chat, notifications
- **File**: `dashboard/messages.html`

---

## 📅 Business & Operations

### Calendar
- **URL**: `https://inneranimalmedia.com/dashboard/calendar`
- **Description**: Calendar and scheduling - Manage events, meetings, and schedules
- **Features**: Event management, scheduling, calendar views
- **File**: `dashboard/calendar.html`
- **Backend**: `/api/calendar/*`

### Tasks
- **URL**: `https://inneranimalmedia.com/dashboard/tasks`
- **Description**: Task management - Create and track tasks and to-dos
- **Features**: Task lists, assignments, status tracking, due dates
- **File**: `dashboard/tasks.html`

### Clients
- **URL**: `https://inneranimalmedia.com/dashboard/clients`
- **Description**: Client management - Manage client accounts and relationships
- **Features**: Client profiles, contact management, project tracking
- **File**: `dashboard/clients.html`

### MeauxWork (Time Tracking)
- **URL**: `https://inneranimalmedia.com/dashboard/meauxwork`
- **Description**: Time tracking and work management - Track time and manage work
- **Features**: Time entries, project tracking, reports
- **File**: `dashboard/meauxwork.html`

---

## 🎨 Content & Media

### Brand
- **URL**: `https://inneranimalmedia.com/dashboard/brand`
- **Description**: Brand management - Manage brand assets, logos, and guidelines
- **Features**: Asset library, logo management, brand guidelines
- **File**: `dashboard/brand.html`
- **Storage**: R2 (`inneranimalmedia-assets`)

### Library
- **URL**: `https://inneranimalmedia.com/dashboard/library`
- **Description**: Content library - Manage files, documents, and media
- **Features**: File management, media gallery, document storage
- **File**: `dashboard/library.html`
- **Storage**: R2 (`inneranimalmedia-assets`)

### Gallery
- **URL**: `https://inneranimalmedia.com/dashboard/gallery`
- **Description**: Media gallery - View and manage images and media files
- **Features**: Image gallery, media preview, file organization
- **File**: `dashboard/gallery.html`
- **Storage**: R2 (`inneranimalmedia-assets`)

### Video
- **URL**: `https://inneranimalmedia.com/dashboard/video`
- **Description**: Video management - Manage and process video content
- **Features**: Video library, processing, playback
- **File**: `dashboard/video.html`

---

## 🤖 AI & Automation

### AI Services
- **URL**: `https://inneranimalmedia.com/dashboard/ai-services`
- **Description**: AI service management - Access and manage AI integrations
- **Features**: Gemini AI integration, chat interface, AI tools
- **File**: `dashboard/ai-services.html`
- **Backend**: `/api/ai/*`
- **Integrations**: Google Gemini AI

### Prompts
- **URL**: `https://inneranimalmedia.com/dashboard/prompts`
- **Description**: AI prompt library - Manage and organize AI prompts
- **Features**: Prompt library, templates, organization
- **File**: `dashboard/prompts.html`

---

## ☁️ Infrastructure

### Cloudflare
- **URL**: `https://inneranimalmedia.com/dashboard/cloudflare`
- **Description**: Cloudflare integration - Manage Cloudflare resources
- **Features**: Account connection, resource management, API tokens
- **File**: `dashboard/cloudflare.html`

### Support
- **URL**: `https://inneranimalmedia.com/dashboard/support`
- **Description**: Support system - Manage support tickets and help requests
- **Features**: Ticket management, help center, documentation
- **File**: `dashboard/support.html`

---

## 🔧 Backend API Endpoints

**Base URL**: `https://iaccess-api.meauxbility.workers.dev`

### Core APIs
- **Root**: `GET /` - API information and health check
- **Stats**: `GET /api/stats` - Platform statistics
- **Themes**: `GET /api/themes` - Theme management
- **Tools**: `GET /api/tools` - Available tools

### OAuth APIs
- **GitHub Authorize**: `GET /api/oauth/github/authorize` - Start GitHub OAuth flow
- **GitHub Callback**: `GET /api/oauth/github/callback` - GitHub OAuth callback
- **Google Authorize**: `GET /api/oauth/google/authorize` - Start Google OAuth flow
- **Google Callback**: `GET /api/oauth/google/callback` - Google OAuth callback

### Management APIs
- **Tenants**: `GET/POST /api/tenants` - Tenant management
- **Deployments**: `GET /api/deployments` - Deployment management
- **Workers**: `GET /api/workers` - Worker management
- **Workflows**: `GET/POST /api/workflows` - Workflow management

### Tool APIs
- **MeauxMCP**: `POST /api/mcp/tools/call` - MCP tool execution
- **MeauxCAD**: `POST /api/meauxcad/generate` - 3D model generation
- **Databases**: `POST /api/databases/query` - Database queries

---

## 🔐 GitHub OAuth Setup Guide

### GitHub OAuth App vs GitHub App

**Current Implementation**: **GitHub OAuth App** (recommended for user authentication)

**GitHub OAuth App** (What you need):
- ✅ Simple setup
- ✅ User authentication
- ✅ Access user's GitHub account
- ✅ Best for login/signup
- ✅ What your platform currently uses

**GitHub App** (Advanced option):
- ⚙️ More complex setup
- ⚙️ Fine-grained permissions
- ⚙️ Install on repositories
- ⚙️ Better for automation
- ⚙️ Requires webhook setup

**For your platform, use GitHub OAuth App** ✅

---

## 📋 GitHub OAuth App Setup (Step-by-Step)

### Step 1: Create GitHub OAuth App

1. **Go to GitHub Developer Settings**
   - **Direct Link**: https://github.com/settings/developers
   - Or: GitHub → Your Profile → Settings → Developer settings → OAuth Apps

2. **Click "New OAuth App"**

3. **Fill in the Application Details**:
   - **Application name**: `InnerAnimal Media Platform` (or your app name)
   - **Homepage URL**: `https://inneranimalmedia.com`
   - **Application description**: (optional) `SaaS platform for business management`
   - **Authorization callback URL**: 
     ```
     https://iaccess-api.meauxbility.workers.dev/api/oauth/github/callback
     ```
     ⚠️ **Important**: Use your API worker URL or custom domain

4. **Click "Register application"**

5. **Copy Your Credentials**:
   - **Client ID**: `xxxxxxxxxxxxxxxxxxxx` (copy this - public)
   - **Client Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (copy this - **you'll only see it once!**)
   
   ⚠️ **Save the Client Secret immediately** - GitHub only shows it once!

---

### Step 2: Update Database with GitHub Credentials

**Option A: Update via Wrangler CLI** (Recommended)

```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET 
  client_id = 'YOUR_GITHUB_CLIENT_ID',
  client_secret_encrypted = 'YOUR_GITHUB_CLIENT_SECRET',
  updated_at = strftime('%s', 'now')
WHERE id = 'github';
"
```

Replace:
- `YOUR_GITHUB_CLIENT_ID` with your actual Client ID
- `YOUR_GITHUB_CLIENT_SECRET` with your actual Client Secret

**Option B: Use Worker Secrets** (Alternative - More Secure)

```bash
# Set GitHub OAuth credentials as Worker secrets
wrangler secret put GITHUB_OAUTH_CLIENT_ID --env production
wrangler secret put GITHUB_OAUTH_CLIENT_SECRET --env production
```

Then update `worker.js` to read from `env.GITHUB_OAUTH_CLIENT_ID` instead of database.

---

### Step 3: Verify OAuth Provider Configuration

Check if the `oauth_providers` table has the GitHub provider:

```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT id, name, display_name, client_id, is_enabled 
FROM oauth_providers 
WHERE id = 'github';
"
```

Expected output:
```
id: github
name: GitHub
display_name: GitHub
client_id: YOUR_GITHUB_CLIENT_ID
is_enabled: 1
```

---

### Step 4: Test GitHub OAuth Flow

1. **Visit the authorize endpoint**:
   ```
   https://inneranimalmedia.com/api/oauth/github/authorize
   ```
   Or:
   ```
   https://iaccess-api.meauxbility.workers.dev/api/oauth/github/authorize
   ```

2. **You should be redirected to GitHub** with an authorization page

3. **Authorize the application** on GitHub

4. **You should be redirected back** to your callback URL

5. **Check if token was stored**:
   ```bash
   wrangler d1 execute inneranimalmedia-business --remote --command="
   SELECT provider_id, provider_username, provider_email, created_at
   FROM oauth_tokens 
   WHERE provider_id = 'github'
   ORDER BY created_at DESC 
   LIMIT 5;
   "
   ```

---

### Step 5: Configure for Custom Domain (Optional)

If you have a custom domain for your API:

1. **Update GitHub OAuth App**:
   - Go back to: https://github.com/settings/developers
   - Click on your OAuth App
   - Click "Edit"
   - Update **Authorization callback URL**:
     ```
     https://api.inneranimalmedia.com/api/oauth/github/callback
     ```
     (Replace with your actual API domain)

2. **Update Worker Code** (if needed):
   - Ensure callback URL matches in `worker.js`

3. **Update Frontend**:
   - Update API base URL in frontend code to use custom domain

---

## 🔒 Security Best Practices

1. **Never commit secrets to Git**
   - Use environment variables or database encryption
   - Use Worker secrets for sensitive data

2. **Use HTTPS only**
   - OAuth requires HTTPS for production
   - Never use HTTP for OAuth callbacks

3. **Validate callback URLs**
   - Only allow authorized callback URLs
   - Validate `state` parameter to prevent CSRF

4. **Encrypt secrets in database**
   - Use encryption for `client_secret_encrypted` field
   - Store encryption key securely (Worker secrets)

5. **Rate limiting**
   - Implement rate limiting for OAuth endpoints
   - Prevent abuse and brute force attacks

---

## 🧪 Testing Checklist

- [ ] GitHub OAuth App created
- [ ] Client ID and Secret copied
- [ ] Database updated with credentials
- [ ] OAuth provider enabled (`is_enabled = 1`)
- [ ] Callback URL matches exactly (no trailing slash)
- [ ] Test authorization flow
- [ ] Verify token storage in database
- [ ] Test user info retrieval
- [ ] Verify redirect after login
- [ ] Test logout functionality

---

## 🆘 Troubleshooting

### Issue: "OAuth provider not found"
- **Solution**: Ensure `oauth_providers` table has GitHub entry
- **Fix**: Run migration or insert provider record

### Issue: "Invalid callback URL"
- **Solution**: Check callback URL matches exactly (including protocol, domain, path)
- **Fix**: Update GitHub OAuth App settings or update callback URL in code

### Issue: "Client ID/Secret not working"
- **Solution**: Verify credentials are correct (no extra spaces)
- **Fix**: Re-copy credentials and update database

### Issue: "State mismatch error"
- **Solution**: Check `oauth_states` table cleanup (expired states)
- **Fix**: Implement state cleanup job or increase expiration time

---

## 📚 Additional Resources

- **GitHub OAuth Docs**: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- **GitHub Developer Settings**: https://github.com/settings/developers
- **OAuth 2.0 Spec**: https://oauth.net/2/
- **Your Platform OAuth Code**: `src/worker.js` (search for `handleOAuth`)

---

## ✅ Quick Reference

**GitHub OAuth App Creation**:
👉 https://github.com/settings/developers

**Current Callback URL**:
```
https://iaccess-api.meauxbility.workers.dev/api/oauth/github/callback
```

**Database Update Command**:
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_CLIENT_ID',
    client_secret_encrypted = 'YOUR_CLIENT_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'github';
"
```

**Test Authorization URL**:
```
https://iaccess-api.meauxbility.workers.dev/api/oauth/github/authorize
```

---

**Status**: ✅ All URLs documented, GitHub OAuth setup guide complete
