# 📍 InnerAnimalMedia.com Pages - Build & Storage Locations

## 🏗️ WHERE PAGES ARE BUILT (Local Development)

**Project Directory**: `/Users/samprimeaux/MEAUXIDERANDOMBUILDS/`

### Directory Structure:
```
MEAUXIDERANDOMBUILDS/
├── index.html                    # Root homepage
├── about.html, contact.html, pricing.html, etc.  # Root-level pages
├── dashboard/                    # Dashboard pages (29 files)
│   ├── index.html
│   ├── projects.html
│   ├── workflows.html
│   ├── meauxmcp.html            # MCP Protocol Manager
│   ├── meauxsql.html
│   ├── settings.html
│   ├── library.html
│   └── ... (29 total)
├── shared/                       # Shared components (10 HTML files + JS/CSS)
│   ├── dashboard-sidebar.html
│   ├── dashboard-header.html
│   ├── sidebar.html
│   ├── quick-connect.html
│   ├── dashboard-layout-loader.js
│   ├── sidebar.css
│   └── themes/
│       └── meaux-tools-24-premium.css
└── legal/                        # Legal pages
    ├── privacy.html
    └── terms.html
```

## ☁️ WHERE PAGES ARE R2 STORED (Production)

**R2 Bucket**: `inneranimalmedia-assets`  
**Prefix**: `static/`  
**Binding**: `STORAGE` (in worker.js)

### R2 Storage Structure:
```
inneranimalmedia-assets/
└── static/
    ├── index.html                           # Root homepage
    ├── about.html, contact.html, etc.       # Root pages
    ├── dashboard/
    │   ├── index.html
    │   ├── projects.html
    │   ├── workflows.html
    │   ├── meauxmcp.html
    │   ├── meauxsql.html
    │   ├── settings.html
    │   ├── library.html
    │   ├── templates.html
    │   └── ... (29 total dashboard pages)
    ├── shared/
    │   ├── dashboard-sidebar.html
    │   ├── dashboard-header.html
    │   ├── sidebar.html
    │   ├── quick-connect.html
    │   ├── dashboard-layout-loader.js
    │   ├── sidebar.css
    │   ├── mobile-menu.js
    │   └── themes/
    │       ├── base.css
    │       ├── inneranimal-media.css
    │       └── meaux-tools-24-premium.css
    └── legal/
        ├── privacy.html
        └── terms.html
```

## 🔄 LOCAL → R2 MAPPING

| Local File | R2 Key |
|------------|--------|
| `index.html` | `static/index.html` |
| `dashboard/index.html` | `static/dashboard/index.html` |
| `dashboard/meauxmcp.html` | `static/dashboard/meauxmcp.html` |
| `shared/dashboard-sidebar.html` | `static/shared/dashboard-sidebar.html` |
| `shared/sidebar.css` | `static/shared/sidebar.css` |
| `legal/terms.html` | `static/legal/terms.html` |

## 🚀 UPLOAD COMMANDS

### Single File Upload:
```bash
wrangler r2 object put inneranimalmedia-assets/static/{path} \
  --file={local_file} \
  --content-type=text/html \
  --remote
```

### Example:
```bash
# Upload dashboard page
wrangler r2 object put inneranimalmedia-assets/static/dashboard/meauxmcp.html \
  --file=./dashboard/meauxmcp.html \
  --content-type=text/html \
  --remote

# Upload shared component
wrangler r2 object put inneranimalmedia-assets/static/shared/sidebar.css \
  --file=./shared/sidebar.css \
  --content-type=text/css \
  --remote
```

### Upload All (Script):
```bash
./upload-all-to-r2.sh
```

This script uploads:
- ✅ `index.html` → `static/index.html`
- ✅ All `dashboard/*.html` → `static/dashboard/*.html`
- ✅ All `shared/*.js` → `static/shared/*.js`
- ✅ All `shared/*.css` → `static/shared/*.css`

## 🌐 HOW PAGES ARE SERVED

The Worker (`src/worker.js`) serves files from R2:

1. **URL Request**: `https://inneranimalmedia.com/dashboard/meauxmcp`
2. **Path Resolution**: Worker resolves to `dashboard/meauxmcp`
3. **R2 Key**: `static/dashboard/meauxmcp.html`
4. **Fetch**: `env.STORAGE.get('static/dashboard/meauxmcp.html')`
5. **Response**: File served with appropriate Content-Type

## 📊 STATISTICS

- **Dashboard Pages**: 29 HTML files
- **Shared Components**: 10 HTML files + multiple JS/CSS files
- **Root Pages**: ~20+ HTML files
- **Total**: ~60+ HTML pages stored in R2

## 🔧 CONFIGURATION

**wrangler.toml**:
```toml
[[env.production.r2_buckets]]
binding = "STORAGE"
bucket_name = "inneranimalmedia-assets"
```

**Worker Code** (`src/worker.js`):
- `serveStaticFile()` function (line ~886)
- Fetches from: `env.STORAGE.get(\`static/\${r2Key}\`)`
- Content-Type detection: `getContentType()` function
