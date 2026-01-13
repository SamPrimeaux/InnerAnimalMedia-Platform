# ⚡ Bindings Quick Reference Card

## 🔗 **ALL BINDINGS AT A GLANCE**

| Binding | Type | Resource | Status |
|---------|------|----------|--------|
| `env.DB` | D1 Database | `inneranimalmedia-business` (ID: `cf87b717-d4e2-4cf8-bab0-a81268e32d49`) | ✅ |
| `env.MEAUXOS_DB` | D1 Database | `meauxos` (ID: `d8261777-9384-44f7-924d-c92247d55b46`) | ✅ |
| `env.STORAGE` | R2 Bucket | `inneranimalmedia-assets` | ✅ |
| `env.SPLINEICONS_STORAGE` | R2 Bucket | `splineicons` | ✅ |
| `env.SESSION_DO` | Durable Object | `IAMSession` (SQLite-backed) | ✅ |
| `env.HYPERDRIVE` | Hyperdrive | `meauxhyper` → Supabase PostgreSQL | ✅ |
| `env.INNERANIMALMEDIA-ANALYTICENGINE` | Analytics Engine | `inneranimalmedia` dataset | ✅ |

---

## 💾 **R2 STORAGE**

### Main Assets: `inneranimalmedia-assets`
**Binding:** `env.STORAGE`
- **Public URL**: `https://pub-e733f82cb31c4f34b6a719e749d0416d.r2.dev`
- **S3 API**: `https://ede6590ac0d2fb7daf155b35653457b2.r2.cloudflarestorage.com/inneranimalmedia-assets`
- **File Prefix**: `static/` (all files stored at `static/` prefix)

**Access:**
```javascript
await env.STORAGE.get('static/filename.jpg')
await env.STORAGE.list({ prefix: 'static/' })
await env.STORAGE.put('static/file.jpg', data)
```

### Spline Icons: `splineicons`
**Binding:** `env.SPLINEICONS_STORAGE`
- 3D icons and Spline models

---

## 🗄️ **D1 DATABASES**

### Primary: `inneranimalmedia-business`
**Binding:** `env.DB`  
**ID:** `cf87b717-d4e2-4cf8-bab0-a81268e32d49`
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="SELECT * FROM tenants;"
```

### Legacy: `meauxos`
**Binding:** `env.MEAUXOS_DB`  
**ID:** `d8261777-9384-44f7-924d-c92247d55b46`
```bash
wrangler d1 execute meauxos --remote --command="SELECT * FROM tenants;"
```

---

## 🔐 **DURABLE OBJECT**

### IAMSession (SQLite-Backed)
**Binding:** `env.SESSION_DO`  
**Class:** `IAMSession`  
**Type:** SQLite-backed Durable Object

**Usage:**
```javascript
const id = env.SESSION_DO.idFromName(sessionId);
const stub = env.SESSION_DO.get(id);
const response = await stub.fetch(request);
```

**Endpoint:** `/api/session/:id`

---

## 🚀 **HYPERDRIVE**

### Supabase PostgreSQL Pooling
**Binding:** `env.HYPERDRIVE`  
**ID:** `9108dd6499bb44c286e4eb298c6ffafb`  
**Name:** `meauxhyper`  
**Host:** `db.qmpghmthbhuumemnahcz.supabase.co`  
**Database:** `postgres`  
**Port:** `5432`

---

## 📊 **ANALYTICS ENGINE**

**Binding:** `env['INNERANIMALMEDIA-ANALYTICENGINE']`  
**Dataset:** `inneranimalmedia`

---

## 🗂️ **R2 FILE STRUCTURE**

```
inneranimalmedia-assets/
├── static/
│   ├── index.html
│   ├── dashboard/
│   │   ├── index.html
│   │   ├── projects.html
│   │   └── ...
│   ├── shared/
│   │   ├── sidebar.html
│   │   ├── header.html
│   │   └── layout.js
│   └── ...
├── static/images/
├── backups/
└── uploads/
```

---

## 🔍 **VERIFY BINDINGS**

```bash
# Check stats (shows binding status)
curl "https://inneranimalmedia-dev.meauxbility.workers.dev/api/stats" | jq '.resources'

# Check D1
wrangler d1 execute inneranimalmedia-business --remote --command="SELECT COUNT(*) FROM tenants;"

# List R2 files (via worker code or dashboard)
# Cloudflare Dashboard → R2 → inneranimalmedia-assets
```

---

## 📝 **FULL DOCUMENTATION**

See `CLOUDFLARE_BINDINGS_COMPLETE.md` for complete details.

---

**All bindings configured in `wrangler.toml`** ✅
