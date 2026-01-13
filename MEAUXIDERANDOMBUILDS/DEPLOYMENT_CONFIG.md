# 🚀 Deployment Configuration

## ✅ Current Configuration

### Worker
- **Name**: `inneranimalmedia-dev`
- **Workers.dev URL**: `inneranimalmedia-dev.meauxbility.workers.dev`
- **Preview URLs**: `*-inneranimalmedia-dev.meauxbility.workers.dev`

### Custom Domains & Routes
- **Primary Domain**: `inneranimalmedia.com`
- **Route**: `inneranimalmedia.com/*`
- **Secondary Domain**: `www.inneranimalmedia.com`
- **Route**: `www.inneranimalmedia.com/*`

### Database
- **Database Name**: `inneranimalmedia-business`
- **Database ID**: `cf87b717-d4e2-4cf8-bab0-a81268e32d49`
- **Binding**: `DB` (in worker)
- **Type**: Cloudflare D1 (SQLite)

### Storage
- **R2 Bucket**: `inneranimalmedia-assets`
- **Binding**: `STORAGE` (in worker)
- **Spline Icons Bucket**: `splineicons`
- **Binding**: `SPLINEICONS_STORAGE` (in worker)

### Analytics
- **Analytics Engine Dataset**: `inneranimalmedia`
- **Binding**: `INNERANIMALMEDIA-ANALYTICENGINE` (in worker)

## 🔧 API Endpoints

All API endpoints work with:
- ✅ `inneranimalmedia.com/api/...`
- ✅ `www.inneranimalmedia.com/api/...`
- ✅ `inneranimalmedia-dev.meauxbility.workers.dev/api/...` (fallback)

### Available Endpoints
- `/api/claude/chat` - Claude chat completions
- `/api/claude/generate` - Claude text generation
- `/api/cursor/chat` - Cursor chat completions
- `/api/cursor/generate` - Cursor code generation
- `/api/users/:userId/connections` - External app connections
- `/api/users/:userId/preferences` - User preferences
- `/api/stats` - Dashboard statistics
- `/api/workflows` - Workflows management
- `/api/deployments` - Deployments (with Cloudflare sync)
- `/api/workers` - Workers (with Cloudflare sync)
- `/api/tenants` - Tenants list
- `/api/tools` - Tools list

## 📋 Frontend Configuration

### Claude Chat UI
- **URL**: `inneranimalmedia.com/dashboard/claude`
- **API Base**: Uses `window.location.origin` (works with custom domains)
- **Fallback**: `inneranimalmedia-dev.meauxbility.workers.dev`

### Quick-Connect Toolbar
- **API Base**: Uses `window.location.origin` (works with custom domains)
- **Fallback**: `inneranimalmedia-dev.meauxbility.workers.dev`

## 🚀 Deployment Commands

### Deploy Worker (Production)
```bash
cd /Users/samprimeaux/MEAUXIDERANDOMBUILDS
wrangler deploy --config wrangler.toml --env production
```

### Deploy Worker (Staging)
```bash
wrangler deploy --config wrangler.toml --env staging
```

### Database Migrations
```bash
# Run migration on remote database
wrangler d1 execute inneranimalmedia-business --remote --file=src/migration-multiple-accounts.sql

# Or run SQL command directly
wrangler d1 execute inneranimalmedia-business --remote --command="ALTER TABLE external_connections ADD COLUMN account_name TEXT DEFAULT 'default';"
```

## 🔍 Verification

### Test API Endpoints
```bash
# Test via custom domain
curl https://inneranimalmedia.com/api/stats

# Test via workers.dev
curl https://inneranimalmedia-dev.meauxbility.workers.dev/api/stats

# Test Claude endpoint (requires auth)
curl https://inneranimalmedia.com/api/claude/chat
```

### Test Claude Chat UI
1. Visit: `https://inneranimalmedia.com/dashboard/claude`
2. Verify account selector loads connections
3. Send a test message
4. Verify response comes from Claude API

## 📝 Notes

- All API calls use `window.location.origin` first, then fallback to `workers.dev`
- Custom domains are routed to the worker via Cloudflare routing
- Database is accessed through the `DB` binding in the worker
- Storage is accessed through the `STORAGE` and `SPLINEICONS_STORAGE` bindings
- All remote functionality and storage/serving uses the configured domains

## ✅ Status

- ✅ Worker configured: `inneranimalmedia-dev`
- ✅ Database configured: `inneranimalmedia-business`
- ✅ Routes configured: `inneranimalmedia.com/*`, `www.inneranimalmedia.com/*`
- ✅ API endpoints work with all domains
- ✅ Frontend uses correct API base URLs
- ✅ Claude integration ready
- ✅ Cursor integration ready

---

**Last Updated**: 2025-01-13
**Worker**: inneranimalmedia-dev
**Database**: inneranimalmedia-business
**Domains**: inneranimalmedia.com, www.inneranimalmedia.com
