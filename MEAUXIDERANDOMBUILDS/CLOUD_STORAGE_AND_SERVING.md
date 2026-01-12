# ☁️ Cloud Storage & Serving Architecture

## 🌐 **Where Everything is Stored & Served From**

Your entire platform is **100% Cloudflare-powered** and stored/served from Cloudflare's global edge network.

---

## 📦 **Storage Locations**

### **1. Static Files (HTML, CSS, JavaScript, Themes, Images)**
- **Storage**: **Cloudflare R2** (Object Storage)
- **Bucket Name**: `inneranimalmedia-assets`
- **Path Prefix**: `static/`
- **Worker Binding**: `env.STORAGE`

#### File Organization in R2:
```
inneranimalmedia-assets/
├── static/
│   ├── index.html (homepage)
│   ├── dashboard/
│   │   ├── index.html
│   │   ├── settings.html
│   │   ├── meauxmcp.html
│   │   ├── meauxsql.html
│   │   └── [29 dashboard HTML files]
│   ├── shared/
│   │   ├── themes/
│   │   │   ├── meaux-tools-24-premium.css (70 themes)
│   │   │   ├── base.css
│   │   │   ├── inneranimal-media.css
│   │   │   └── [other theme files]
│   │   ├── layout.js
│   │   ├── sidebar.html
│   │   ├── header.html
│   │   └── [other shared assets]
│   ├── legal/
│   │   ├── privacy.html
│   │   └── terms.html
│   └── [root-level HTML files]
```

#### How Files are Served:
- **Worker serves files directly from R2**: `env.STORAGE.get('static/${r2Key}')`
- **Content-Type**: Auto-detected from file extension
- **Caching**: Cloudflare edge caching (300+ locations worldwide)
- **CDN**: Global distribution via Cloudflare's edge network

---

### **2. Database (Structured Data)**
- **Storage**: **Cloudflare D1** (SQLite-based distributed database)
- **Primary Database**: `inneranimalmedia-business`
  - **Database ID**: `cf87b717-d4e2-4cf8-bab0-a81268e32d49`
  - **Worker Binding**: `env.DB`
- **Legacy Database**: `meauxos`
  - **Database ID**: `d8261777-9384-44f7-924d-c92247d55b46`
  - **Worker Binding**: `env.MEAUXOS_DB`

#### What's Stored in D1:
- Users, tenants, sessions
- OAuth tokens and connections
- API keys and credentials (encrypted)
- Workflows, deployments, workers
- Themes, tools, configurations
- Agent commands, prompts library
- Knowledge base, chat history
- Images metadata, external connections
- Support tickets, customer feedback
- Analytics events (via Analytics Engine)

---

### **3. Media Files (Images, Videos, 3D Models)**
- **Storage**: **Cloudflare R2** (same bucket: `inneranimalmedia-assets`)
- **Path Prefix**: `media/` or `images/`
- **Metadata**: Stored in D1 database (`images` table)

---

### **4. Analytics Data**
- **Storage**: **Cloudflare Analytics Engine**
- **Dataset**: `inneranimalmedia`
- **Worker Binding**: `env['INNERANIMALMEDIA-ANALYTICENGINE']`
- **Purpose**: Event tracking, API usage, performance metrics

---

### **5. Sessions (Real-time State)**
- **Storage**: **SQL-backed Durable Objects** (IAMSession)
- **Type**: SQLite-based (not KV)
- **Purpose**: MCP sessions, browser rendering, video calls, chat
- **Worker Binding**: `env.IAM_SESSION`

---

## 🚀 **Serving Architecture**

### **Backend API (Cloudflare Workers)**
- **Worker Name**: `inneranimalmedia-dev`
- **Production URL**: `https://iaccess-api.meauxbility.workers.dev` (or custom domain)
- **Location**: Cloudflare's global edge network (300+ locations)
- **Responsibilities**:
  1. **API Requests**: Handle all `/api/*` endpoints
  2. **Static File Serving**: Serve HTML/CSS/JS from R2
  3. **Database Queries**: Query D1 databases
  4. **Storage Operations**: Read/write to R2
  5. **Analytics**: Write events to Analytics Engine

### **Frontend (Static Files)**
- **Serving Method**: Cloudflare Workers serves files from R2
- **Alternative**: Can be deployed to Cloudflare Pages (optional)
- **Current Setup**: Worker serves static files directly
- **CDN**: Cloudflare's edge network (automatic)

---

## 🔧 **Configuration Details**

### **wrangler.toml** Configuration:
```toml
name = "inneranimalmedia-dev"
main = "src/worker.js"

# D1 Databases
[[d1_databases]]
binding = "DB"
database_name = "inneranimalmedia-business"
database_id = "cf87b717-d4e2-4cf8-bab0-a81268e32d49"

[[d1_databases]]
binding = "MEAUXOS_DB"
database_name = "meauxos"
database_id = "d8261777-9384-44f7-924d-c92247d55b46"

# R2 Bucket (configured via Cloudflare Dashboard)
# Binding: STORAGE
# Bucket: inneranimalmedia-assets

# Analytics Engine
# Binding: INNERANIMALMEDIA-ANALYTICENGINE
# Dataset: inneranimalmedia
```

---

## 🌍 **Global Distribution**

All content is distributed via **Cloudflare's Edge Network**:

- **300+ Locations**: Files cached at edge locations worldwide
- **Automatic CDN**: No additional configuration needed
- **Low Latency**: Content served from nearest edge location
- **High Availability**: Redundant storage and serving

---

## 📊 **Resource Summary**

| Resource | Type | Name/ID | Binding | Location |
|----------|------|---------|---------|----------|
| **Static Files** | R2 Bucket | `inneranimalmedia-assets` | `env.STORAGE` | Cloudflare R2 |
| **Primary Database** | D1 | `inneranimalmedia-business` | `env.DB` | Cloudflare D1 |
| **Legacy Database** | D1 | `meauxos` | `env.MEAUXOS_DB` | Cloudflare D1 |
| **Analytics** | Analytics Engine | `inneranimalmedia` | `env['INNERANIMALMEDIA-ANALYTICENGINE']` | Cloudflare Analytics |
| **Sessions** | Durable Objects | `IAMSession` | `env.IAM_SESSION` | Cloudflare Workers |
| **API Worker** | Workers | `inneranimalmedia-dev` | N/A | Cloudflare Edge Network |
| **Worker URL** | Workers | `iaccess-api.meauxbility.workers.dev` | N/A | Cloudflare Edge Network |

---

## 🔐 **Security & Access**

- **API Keys**: Stored as Cloudflare Workers secrets (encrypted)
- **OAuth Tokens**: Stored in D1 database (encrypted)
- **Database Access**: Only accessible via Cloudflare Workers API
- **R2 Access**: Only accessible via Cloudflare Workers API
- **No Public Access**: Direct database/R2 access is restricted

---

## 📝 **File Upload Commands**

To upload files to R2 (if needed):

```bash
# Upload a single file
wrangler r2 object put inneranimalmedia-assets/static/dashboard/settings.html \
  --file=./dashboard/settings.html \
  --content-type=text/html

# Upload themes CSS
wrangler r2 object put inneranimalmedia-assets/static/shared/themes/meaux-tools-24-premium.css \
  --file=./shared/themes/meaux-tools-24-premium.css \
  --content-type=text/css

# List all files in R2
wrangler r2 object list inneranimalmedia-assets --prefix="static/"

# Upload entire directory (requires script)
# See: upload-static-to-r2.js
```

---

## 🎯 **Key Takeaways**

1. **Everything is on Cloudflare**: 100% Cloudflare infrastructure
2. **Static Files**: R2 bucket `inneranimalmedia-assets` with `static/` prefix
3. **Database**: D1 database `inneranimalmedia-business` (primary)
4. **Serving**: Cloudflare Workers serves files from R2 and handles API requests
5. **Global CDN**: Automatic edge caching at 300+ locations
6. **No External Dependencies**: All storage and serving is Cloudflare-native

---

## 🔗 **Related Documentation**

- `COMPLETE_URLS_AND_GITHUB_OAUTH.md` - All URLs and endpoints
- `DEPLOYMENT_COMPLETE.md` - Deployment information
- `REMOTE_CONNECTION_STATUS.md` - Remote service status
- `API_KEYS_STATUS.md` - API keys and secrets status

---

**Last Updated**: Based on current `wrangler.toml` and `src/worker.js` configuration
