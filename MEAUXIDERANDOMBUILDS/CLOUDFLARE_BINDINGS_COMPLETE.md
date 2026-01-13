# 🔗 Complete Cloudflare Bindings & Storage Reference

## 🎯 **ALL BINDINGS SUMMARY**

### **Worker Name:** `inneranimalmedia-dev`
### **Production URL:** `https://inneranimalmedia-dev.meauxbility.workers.dev`

---

## 💾 **R2 STORAGE BUCKETS**

### 1. **Main Assets Bucket** ✅
- **Binding**: `env.STORAGE`
- **Bucket Name**: `inneranimalmedia-assets`
- **Usage**: Static files, images, backups, uploads
- **Public URL**: `https://pub-e733f82cb31c4f34b6a719e749d0416d.r2.dev`
- **S3 API Endpoint**: `https://ede6590ac0d2fb7daf155b35653457b2.r2.cloudflarestorage.com/inneranimalmedia-assets`
- **Prefix**: Files stored at `static/` prefix
- **Status**: ✅ CONNECTED

**Access in Worker:**
```javascript
// List files
const objects = await env.STORAGE.list({ prefix: 'static/' });

// Get file
const file = await env.STORAGE.get('static/filename.jpg');

// Upload file
await env.STORAGE.put('static/filename.jpg', fileData, {
  httpMetadata: { contentType: 'image/jpeg' }
});

// Delete file
await env.STORAGE.delete('static/filename.jpg');
```

### 2. **Spline Icons Bucket** ✅
- **Binding**: `env.SPLINEICONS_STORAGE`
- **Bucket Name**: `splineicons`
- **Usage**: 3D icons and Spline models
- **Status**: ✅ CONNECTED

**Access in Worker:**
```javascript
const icon = await env.SPLINEICONS_STORAGE.get('icon-name.spline');
```

---

## 🗄️ **D1 DATABASES**

### 1. **Primary Database** ✅
- **Binding**: `env.DB`
- **Database Name**: `inneranimalmedia-business`
- **Database ID**: `cf87b717-d4e2-4cf8-bab0-a81268e32d49`
- **Usage**: Main production database (all tables)
- **Status**: ✅ CONNECTED

**Access in Worker:**
```javascript
const result = await env.DB.prepare('SELECT * FROM users').all();
```

### 2. **Legacy Database** ✅
- **Binding**: `env.MEAUXOS_DB`
- **Database Name**: `meauxos`
- **Database ID**: `d8261777-9384-44f7-924d-c92247d55b46`
- **Usage**: Legacy data (available for migration)
- **Status**: ✅ CONNECTED

**Access in Worker:**
```javascript
const result = await env.MEAUXOS_DB.prepare('SELECT * FROM tenants').all();
```

**Wrangler Commands:**
```bash
# Query primary DB
wrangler d1 execute inneranimalmedia-business --remote --command="SELECT * FROM tenants;"

# Query legacy DB
wrangler d1 execute meauxos --remote --command="SELECT * FROM tenants;"
```

---

## 🔐 **DURABLE OBJECTS**

### **IAMSession (SQLite-Backed)** ✅
- **Binding**: `env.SESSION_DO`
- **Class Name**: `IAMSession`
- **Type**: SQLite-backed Durable Object
- **Usage**: Session management (MCP, browser, video, chat sessions)
- **Migration Tag**: `v1`
- **Status**: ✅ CONNECTED

**Access in Worker:**
```javascript
// Get Durable Object ID from session ID
const id = env.SESSION_DO.idFromName(sessionId);
const stub = env.SESSION_DO.get(id);

// Forward request to Durable Object
const response = await stub.fetch(request);
```

**Endpoint:**
- `/api/session/:id` - Session CRUD operations

**Storage:**
- Uses SQLite database internally (managed by Cloudflare)
- Persistent storage per session
- Accessible via SQL interface: `ctx.storage.sql`

**Wrangler Commands:**
```bash
# List Durable Objects (via dashboard)
# Cloudflare Dashboard → Workers → inneranimalmedia-dev → Durable Objects
```

---

## 🚀 **HYPERDRIVE**

### **Supabase PostgreSQL Connection Pooling** ✅
- **Binding**: `env.HYPERDRIVE`
- **Hyperdrive ID**: `9108dd6499bb44c286e4eb298c6ffafb`
- **Name**: `meauxhyper`
- **Host**: `db.qmpghmthbhuumemnahcz.supabase.co`
- **Database**: `postgres`
- **Port**: `5432`
- **Type**: PostgreSQL connection pooler
- **Usage**: Fast connections to Supabase PostgreSQL database
- **Status**: ✅ CONNECTED

**Access in Worker:**
```javascript
// Get Hyperdrive connection string
const hyperdriveConfig = env.HYPERDRIVE;

// Use with database library (e.g., pg, postgres.js)
import postgres from 'postgres';
const sql = postgres(hyperdriveConfig.connectionString);
const result = await sql`SELECT * FROM users`;
```

**Note**: Hyperdrive provides connection pooling and caching for PostgreSQL connections.

---

## 📊 **ANALYTICS ENGINE**

### **Analytics Dataset** ✅
- **Binding**: `env.INNERANIMALMEDIA-ANALYTICENGINE`
- **Dataset Name**: `inneranimalmedia`
- **Usage**: Analytics events and metrics
- **Status**: ✅ CONNECTED

**Access in Worker:**
```javascript
// Write analytics event
env.INNERANIMALMEDIA_ANALYTICENGINE.writeDataPoint({
  blobs: ['event_type', 'user_id'],
  doubles: [timestamp, value],
  indexes: ['tenant_id']
});
```

**Note**: Use bracket notation for hyphenated binding names: `env['INNERANIMALMEDIA-ANALYTICENGINE']`

---

## 🌐 **ENVIRONMENT VARIABLES**

### Production Environment Variables:
```toml
ENVIRONMENT = "production"
API_URL = "https://api.iaccess.meauxbility.workers.dev"
CLOUDFLARE_ACCOUNT_ID = "ede6590ac0d2fb7daf155b35653457b2"
CLOUDFLARE_IMAGES_ACCOUNT_HASH = "g7wf09fCONpnidkRnR_5vw"
CLOUDFLARE_STREAM_SUBDOMAIN = "customer-8y3087qnrzz7ql2e.cloudflarestream.com"
CLOUDFLARE_STREAM_LIVE_INPUT_ID = "19f4cb5b8f596c17109b2da60cf02413"
REALTIME_SFU_APP_ID = "06f520f1a1f2fef03d8e78e5ba802cb9"
REALTIME_TURN_TOKEN_ID = "8de64140363dbdc05ad7d7da9f058c03"
```

---

## 🔐 **WORKER SECRETS** (Set via `wrangler secret put`)

### OAuth Secrets:
- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

### API Keys:
- `CLOUDFLARE_API_TOKEN` ✅ (already set)
- `CURSOR_API_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_API_KEY`
- `OPENAI_API_KEY`
- `CLOUDCONVERT_API_KEY`
- `RESEND_API_KEY` ✅ (for email sending)

### Other Secrets:
- `JWT_SECRET`
- `RESEND_WEBHOOK_SECRET`
- `RESEND_INBOUND_WEBHOOK_SECRET`

**Set Secret:**
```bash
wrangler secret put SECRET_NAME
```

**List Secrets:**
```bash
wrangler secret list
```

---

## 📍 **STORAGE LOCATIONS**

### R2 Buckets:
1. **`inneranimalmedia-assets`** (binding: `STORAGE`)
   - Static files: `static/` prefix
   - Images: `static/images/` prefix
   - Backups: `backups/` prefix
   - Uploads: `uploads/` prefix

2. **`splineicons`** (binding: `SPLINEICONS_STORAGE`)
   - 3D icons and Spline models

### Cloudflare Images:
- **Account Hash**: `g7wf09fCONpnidkRnR_5vw`
- **Delivery URL**: `https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/{image_id}/{variant}`
- **Logo Example**: `https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/17535395-1501-490a-ff3d-e43d7c16a000/avatar`

---

## 🔍 **VERIFY BINDINGS**

### Check Worker Bindings (via Dashboard):
1. Go to: https://dash.cloudflare.com
2. Navigate to: Workers & Pages → inneranimalmedia-dev
3. Settings → Variables
4. View all bindings, secrets, and environment variables

### Check via API:
```bash
curl "https://inneranimalmedia-dev.meauxbility.workers.dev/api/stats"
```

Response includes binding status:
```json
{
  "r2_storage": "connected",
  "durable_objects": "enabled",
  "hyperdrive": "enabled",
  "d1_databases": {
    "primary": "connected",
    "legacy": "connected"
  }
}
```

---

## 📋 **COMPLETE BINDINGS LIST**

| Binding Name | Type | Resource Name | Status |
|--------------|------|---------------|--------|
| `env.DB` | D1 Database | `inneranimalmedia-business` | ✅ |
| `env.MEAUXOS_DB` | D1 Database | `meauxos` | ✅ |
| `env.STORAGE` | R2 Bucket | `inneranimalmedia-assets` | ✅ |
| `env.SPLINEICONS_STORAGE` | R2 Bucket | `splineicons` | ✅ |
| `env.SESSION_DO` | Durable Object | `IAMSession` (SQLite) | ✅ |
| `env.HYPERDRIVE` | Hyperdrive | `meauxhyper` (Supabase) | ✅ |
| `env.INNERANIMALMEDIA-ANALYTICENGINE` | Analytics Engine | `inneranimalmedia` | ✅ |

---

## 🗂️ **FILE STORAGE STRUCTURE**

### R2 Bucket: `inneranimalmedia-assets`
```
inneranimalmedia-assets/
├── static/              # Static files (HTML, CSS, JS)
│   ├── index.html
│   ├── dashboard/
│   ├── shared/
│   └── ...
├── static/images/       # User uploaded images
│   └── ...
├── backups/            # Database backups
│   └── backup-*.sql
└── uploads/            # User file uploads
    └── ...
```

### R2 Bucket: `splineicons`
```
splineicons/
├── icon-*.spline       # Spline 3D icon files
└── ...
```

---

## 🚀 **QUICK ACCESS COMMANDS**

### List R2 Files:
```bash
# Via Wrangler (if R2 CLI configured)
wrangler r2 object list inneranimalmedia-assets --prefix static/

# Via API (in worker code)
const objects = await env.STORAGE.list({ prefix: 'static/' });
```

### Query D1 Database:
```bash
# Primary DB
wrangler d1 execute inneranimalmedia-business --remote --command="SELECT * FROM tenants LIMIT 10;"

# Legacy DB
wrangler d1 execute meauxos --remote --command="SELECT * FROM tenants LIMIT 10;"
```

### Check Durable Object:
```bash
# Via API endpoint
curl "https://inneranimalmedia-dev.meauxbility.workers.dev/api/session/test-session-id"
```

### Test Hyperdrive:
```javascript
// In worker code
if (env.HYPERDRIVE) {
  console.log('Hyperdrive configured:', env.HYPERDRIVE.connectionString);
}
```

---

## ✅ **STATUS CHECK**

### All Bindings Status:
```bash
curl "https://inneranimalmedia-dev.meauxbility.workers.dev/api/stats" | jq '.resources'
```

Expected response:
```json
{
  "resources": {
    "d1_databases": {
      "primary": "connected",
      "legacy": "connected"
    },
    "r2_storage": "connected",
    "splineicons_storage": "connected",
    "durable_objects": "enabled",
    "hyperdrive": "enabled",
    "analytics_engine": "enabled"
  }
}
```

---

## 📚 **REFERENCE DOCUMENTATION**

- **wrangler.toml**: Complete binding configuration
- **Worker Code**: `src/worker.js` - All bindings usage
- **Cloudflare Dashboard**: Workers & Pages → inneranimalmedia-dev → Settings

---

**All bindings are configured and connected!** ✅
