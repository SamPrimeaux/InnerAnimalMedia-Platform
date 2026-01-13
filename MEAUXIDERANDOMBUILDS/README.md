# InnerAnimalMedia Platform

**Unified SaaS Platform** for deploying, hosting, and managing cloud services. Built on Cloudflare Workers, D1, R2, and Hyperdrive. Multi-tenant, OAuth-enabled, with comprehensive integrations.

**Repository**: [https://github.com/SamPrimeaux/InnerAnimalMedia-Platform.git](https://github.com/SamPrimeaux/InnerAnimalMedia-Platform.git)

---

## 🎯 **Quick Navigation for AI Agents**

### **Critical Entry Points**
- **Main Worker**: `src/worker.js` (18,844 lines) - All API endpoints
- **Database Config**: `wrangler.toml` - D1, R2, Workers configuration
- **Frontend**: `dashboard/*.html` (31+ pages) - Dashboard UI
- **Shared Components**: `shared/*.js`, `shared/*.css` - Reusable components

### **Key Documentation**
- **Architecture**: `FULL_STACK_ARCHITECTURE.md`
- **Database Schema**: `INNERANIMAL_BUSINESS_DATABASE.md`
- **API Endpoints**: See `src/worker.js` routing section
- **Deployment**: `DEPLOYMENT_CONFIG.md`
- **Backup Guide**: `FOOLPROOF_BACKUP_GUIDE.md`

---

## 🏗️ **Architecture Overview**

### **Tech Stack**
- **Backend**: Cloudflare Workers (serverless)
- **Database**: Cloudflare D1 (SQLite) - `inneranimalmedia-business`
- **Storage**: Cloudflare R2 - `inneranimalmedia-assets`
- **Frontend**: Static HTML/CSS/JS (served via R2/Pages)
- **PostgreSQL**: Supabase (via Hyperdrive)

### **Project Structure**
```
├── src/
│   ├── worker.js                    # Main API worker (ALL endpoints)
│   ├── *.sql                        # Database schemas & migrations (68 files)
│   ├── migration-*.sql              # Database migrations
│   └── schema-*.sql                 # Schema definitions
│
├── dashboard/                       # Dashboard pages (31+ HTML files)
│   ├── index.html                   # Main dashboard
│   ├── meauxide.html                # Code editor tool
│   ├── meauxmcp.html                # MCP Protocol Manager
│   ├── meauxsql.html                # Database query tool
│   ├── meauxcad.html                # 3D modeling tool
│   ├── settings.html                # Settings & integrations
│   └── [28+ more pages]
│
├── shared/                          # Shared components
│   ├── *.js                         # JavaScript utilities (21 files)
│   ├── *.css                        # Styles (15 files)
│   ├── *.html                       # HTML components (18 files)
│   └── quick-connect.js             # Quick-Connect toolbar
│
├── scripts/                         # Automation scripts
│   ├── backup-complete.sh           # Complete backup script
│   ├── restore-after-cleanup.sh     # Restore script
│   └── upload-all-to-r2-complete.sh # R2 upload script
│
├── .claude/                         # Claude Code configuration
│   ├── commands/                    # Custom Claude commands (15 commands)
│   ├── settings.json                # Claude settings
│   └── CLAUDE.md                    # Project context for Claude
│
├── wrangler.toml                    # Cloudflare Workers config
├── package.json                     # Dependencies
└── *.md                             # Documentation (100+ files)
```

---

## 🔑 **Key Files & Their Purpose**

### **Backend (API)**
| File | Purpose | Lines |
|------|---------|-------|
| `src/worker.js` | Main API worker - ALL endpoints | ~18,844 |
| `src/schema-inneranimal-business-complete.sql` | Complete database schema | - |
| `src/migration-*.sql` | Database migrations | - |

### **Frontend (Dashboard)**
| File | Purpose |
|------|---------|
| `dashboard/index.html` | Main dashboard overview |
| `dashboard/settings.html` | Settings & external app connections |
| `dashboard/meauxide.html` | Code editor (MeauxIDE) |
| `dashboard/meauxmcp.html` | MCP Protocol Manager |
| `dashboard/meauxsql.html` | Database query tool (InnerData) |
| `dashboard/meauxcad.html` | 3D modeling tool |

### **Shared Components**
| File | Purpose |
|------|---------|
| `shared/quick-connect.js` | Quick-Connect toolbar (725 lines) |
| `shared/dashboard-layout.js` | Dashboard layout loader |
| `shared/sidebar.html` | Navigation sidebar |
| `shared/header.html` | Top header bar |

### **Configuration**
| File | Purpose |
|------|---------|
| `wrangler.toml` | Cloudflare Workers config (D1, R2, bindings) |
| `package.json` | Node.js dependencies |
| `.claude/CLAUDE.md` | Project context for Claude Code |

---

## 🗄️ **Database Structure**

### **Primary Database**
- **Name**: `inneranimalmedia-business`
- **ID**: `cf87b717-d4e2-4cf8-bab0-a81268e32d49`
- **Binding**: `DB` (in worker.js)

### **Key Tables**
- `tenants` - Multi-tenant organizations
- `users` - User accounts with roles
- `external_connections` - External app connections (Claude, OpenAI, etc.)
- `tools` - Available tools (MeauxIDE, MeauxMCP, etc.)
- `workflows` - Workflow definitions
- `themes` - UI themes (50+ themes)
- `oauth_providers` - OAuth configuration
- `oauth_tokens` - User OAuth tokens

**Full Schema**: See `src/schema-inneranimal-business-complete.sql`

---

## 🔌 **API Endpoints**

### **Main Routes** (in `src/worker.js`)
```
/api/users/*              # User management
/api/tenants/*            # Tenant management
/api/tools/*              # Tools management
/api/workflows/*          # Workflow management
/api/themes/*             # Theme management
/api/claude/*             # Claude API integration
/api/cursor/*             # Cursor API integration
/api/mcp/*                # MCP Protocol endpoints
/api/oauth/*              # OAuth (GitHub, Google)
/api/storage/*            # R2 storage operations
/api/deployments/*        # Cloudflare Pages deployments
/api/workers/*            # Cloudflare Workers management
```

### **External Integrations**
- **Claude API**: `/api/claude/chat`, `/api/claude/generate`
- **Cursor API**: `/api/cursor/*`
- **MCP Server**: `/api/mcp/sse` (SSE endpoint for Claude Desktop)
- **OAuth**: `/api/oauth/github/*`, `/api/oauth/google/*`

---

## 🚀 **Quick Start for Development**

### **1. Prerequisites**
```bash
# Install Node.js 18+
node --version

# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### **2. Clone & Setup**
```bash
git clone https://github.com/SamPrimeaux/InnerAnimalMedia-Platform.git
cd InnerAnimalMedia-Platform/MEAUXIDERANDOMBUILDS
npm install
```

### **3. Configure Secrets**
```bash
# Required secrets (set via Cloudflare Workers secrets)
wrangler secret put JWT_SECRET
wrangler secret put CLOUDFLARE_API_TOKEN

# Optional secrets
wrangler secret put ANTHROPIC_API_KEY      # Claude API
wrangler secret put OPENAI_API_KEY         # OpenAI/ChatGPT
wrangler secret put CURSOR_API_KEY         # Cursor API
wrangler secret put GEMINI_API_KEY         # Google Gemini
wrangler secret put CLOUDCONVERT_API_KEY   # File conversion
```

**Note**: All secrets are stored in Cloudflare Workers secrets (encrypted). Never commit secrets to Git.

### **4. Local Development**
```bash
# Start local dev server
wrangler dev

# Test specific endpoint
curl http://localhost:8787/api/tools
```

### **5. Deploy**
```bash
# Deploy to production
wrangler deploy --env production

# Deploy static files to R2
./upload-all-to-r2-complete.sh
```

---

## 📚 **Documentation Index**

### **Setup & Configuration**
- `FOOLPROOF_BACKUP_GUIDE.md` - Complete backup guide
- `SAFE_CLEANUP_GUIDE.md` - What to keep/delete
- `DEPLOYMENT_CONFIG.md` - Deployment configuration
- `CLAUDE_CODE_SETUP_COMPLETE.md` - Claude Code CLI setup

### **Architecture**
- `FULL_STACK_ARCHITECTURE.md` - System architecture
- `MULTI_TENANT_ARCHITECTURE.md` - Multi-tenancy design
- `INNERANIMAL_BUSINESS_DATABASE.md` - Database schema

### **Features**
- `MULTI_ACCOUNT_SUPPORT.md` - Multiple account support
- `EXTERNAL_APPS_INTEGRATION.md` - External app integrations
- `UNLIMITED_CONNECTIONS_COMPLETE.md` - Connection management
- `CLAUDE_MCP_CONNECTOR_SETUP.md` - MCP connector setup

### **Tools**
- `MULTI_PAGE_COMPLETE.md` - Dashboard tools (MeauxIDE, MeauxMCP, etc.)
- `COMMANDS_SYSTEM_FUNCTIONAL.md` - Commands system
- `WORKFLOWS_SYSTEM.md` - Workflows system

### **Integration Guides**
- `GITHUB_OAUTH_READY.md` - GitHub OAuth setup
- `OAUTH_SETUP_INNERANIMALMEDIA.md` - OAuth configuration
- `CURSOR_API_SETUP.md` - Cursor API integration

---

## 🔐 **Security & Secrets**

### **Secrets Management**
- **All secrets** stored in Cloudflare Workers secrets (encrypted)
- **Never in code** - All API keys use `env.SECRET_NAME` pattern
- **`.gitignore`** protects against accidental commits

### **Required Secrets**
- `JWT_SECRET` - JWT token signing
- `CLOUDFLARE_API_TOKEN` - Cloudflare API access

### **Optional Secrets**
- `ANTHROPIC_API_KEY` - Claude API
- `OPENAI_API_KEY` - OpenAI/ChatGPT
- `CURSOR_API_KEY` - Cursor API
- `GEMINI_API_KEY` - Google Gemini
- `CLOUDCONVERT_API_KEY` - File conversion
- `STRIPE_SECRET_KEY` - Stripe payments
- `RESEND_API_KEY` - Email service

**View all secrets**: `wrangler secret list`

---

## 🌐 **Deployment & URLs**

### **Production**
- **Main Domain**: https://inneranimalmedia.com
- **Worker API**: https://inneranimalmedia-dev.meauxbility.workers.dev
- **Dashboard**: https://inneranimalmedia.com/dashboard

### **Storage**
- **R2 Bucket**: `inneranimalmedia-assets`
- **Static Files**: `static/` prefix in R2
- **Backups**: `backups/` prefix in R2

### **Database**
- **Primary**: `inneranimalmedia-business` (D1)
- **Legacy**: `meauxos` (D1) - for data migration

---

## 🛠️ **Development Workflow**

### **Adding a New Feature**
1. **Create API endpoint** in `src/worker.js`
2. **Add database migration** (if needed) in `src/migration-*.sql`
3. **Create frontend page** in `dashboard/*.html` (if needed)
4. **Update shared components** in `shared/*` (if needed)
5. **Test locally**: `wrangler dev`
6. **Deploy**: `wrangler deploy --env production`

### **Database Changes**
```bash
# Create migration file
# src/migration-feature-name.sql

# Apply migration
wrangler d1 execute inneranimalmedia-business --remote --file=src/migration-feature-name.sql
```

### **Frontend Changes**
```bash
# Edit dashboard/*.html or shared/* files
# Upload to R2
./upload-all-to-r2-complete.sh
```

---

## 📦 **Backup & Restore**

### **Backup Everything**
```bash
./scripts/backup-complete.sh
```

This creates:
- Complete backup archive (in `backups/`)
- Uploads to R2 (`inneranimalmedia-assets/backups/`)
- Includes: source code, configs, schemas, docs

### **Restore After Cleanup**
```bash
./scripts/restore-after-cleanup.sh
```

Or restore from R2:
```bash
wrangler r2 object get inneranimalmedia-assets/backups/backup-*.tar.gz --file=backup.tar.gz
tar -xzf backup.tar.gz
```

**See**: `FOOLPROOF_BACKUP_GUIDE.md` for complete guide

---

## 🤖 **AI Agent Quick Reference**

### **Where to Find Things**

**API Endpoints**: Search `src/worker.js` for route handlers
```javascript
// Example: Find Claude API handler
// Search for: "handleClaudeAPI" or "/api/claude"
```

**Database Schema**: See `src/schema-*.sql` files
```bash
# List all schemas
ls src/schema-*.sql
```

**Frontend Pages**: See `dashboard/*.html`
```bash
# List all dashboard pages
ls dashboard/*.html
```

**Shared Components**: See `shared/*`
```bash
# JavaScript utilities
ls shared/*.js

# CSS styles
ls shared/*.css
```

### **Common Tasks**

**Add API Endpoint**:
1. Add route handler in `src/worker.js`
2. Add route in main `fetch` handler
3. Include CORS headers
4. Test with `wrangler dev`

**Add Database Table**:
1. Create migration in `src/migration-*.sql`
2. Run: `wrangler d1 execute inneranimalmedia-business --remote --file=src/migration-*.sql`

**Add Dashboard Page**:
1. Create `dashboard/new-page.html`
2. Use shared components (`shared/sidebar.html`, etc.)
3. Upload to R2: `./upload-all-to-r2-complete.sh`

---

## 🔗 **External Resources**

- **GitHub Repo**: https://github.com/SamPrimeaux/InnerAnimalMedia-Platform
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Documentation**: See `*.md` files in root directory

---

## 📝 **License**

Private repository - All rights reserved

## 👤 **Author**

**SamPrimeaux** - InnerAnimalMedia

---

**Built with Cloudflare Workers, D1, R2, and Hyperdrive** 🚀
