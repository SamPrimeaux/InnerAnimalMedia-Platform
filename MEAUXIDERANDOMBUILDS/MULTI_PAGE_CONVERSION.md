# Multi-Page Application Conversion Guide

## Current State: SPA ❌
- `dashboard.html` uses client-side routing (`router.navigate()`)
- All views are JavaScript templates in one file
- Not SEO-friendly
- Not optimal for full-stack architecture

## Target State: Multi-Page ✅
- Separate HTML file for each page
- Real navigation links (`<a href>`)
- Each page independently accessible
- SEO-friendly URLs
- Proper full-stack architecture

## File Structure

```
/
├── index.html                    # Public homepage (already exists)
├── dashboard/
│   ├── index.html               # Dashboard overview (main)
│   ├── projects.html            # Projects page
│   ├── workflows.html           # Workflows page  
│   ├── deployments.html         # Deployments page
│   ├── workers.html             # Workers page
│   ├── tenants.html             # Tenants page
│   ├── meauxmcp.html            # MeauxMCP page
│   ├── meauxsql.html            # InnerData page
│   ├── meauxcad.html            # MeauxCAD page
│   ├── calendar.html            # Calendar page
│   └── clients.html             # Clients page
├── shared/
│   ├── layout.js                # Shared layout logic
│   ├── sidebar.html             # Sidebar component (optional)
│   └── header.html              # Header component (optional)
└── [existing pages]
    ├── workflows.html           # Keep as standalone
    ├── workers.html             # Keep as standalone
    └── ...
```

## Conversion Steps

### 1. Create Shared Layout System ✅
- `shared/layout.js` - Shared API client, sidebar toggle, etc.

### 2. Convert Navigation
**Before (SPA):**
```html
<button onclick="router.navigate('projects')">Projects</button>
```

**After (Multi-Page):**
```html
<a href="/dashboard/projects.html" class="nav-link">Projects</a>
```

### 3. Extract Each View
- Take each view from `views` object
- Create separate HTML file
- Include shared layout
- Add proper page-specific content

### 4. Update Cloudflare Pages Routing
```json
{
  "redirects": [
    { "from": "/dashboard", "to": "/dashboard/index.html", "statusCode": 301 },
    { "from": "/dashboard/overview", "to": "/dashboard/index.html", "statusCode": 301 }
  ]
}
```

## Benefits

✅ **SEO-Friendly**: Each page has its own URL
✅ **Fast Loading**: Static HTML files, no JS routing overhead
✅ **Shareable URLs**: Users can bookmark/share specific pages
✅ **Better Caching**: Each page can be cached independently
✅ **Server-Side Ready**: Easy to add SSR later
✅ **Proper Full-Stack**: Clear separation of concerns

## Implementation Priority

1. **High Priority** (Core pages):
   - `/dashboard/index.html` (overview)
   - `/dashboard/workflows.html`
   - `/dashboard/deployments.html`
   - `/dashboard/workers.html`

2. **Medium Priority**:
   - `/dashboard/projects.html`
   - `/dashboard/tenants.html`

3. **Low Priority** (Can keep as SPA views for now):
   - `/dashboard/meauxmcp.html`
   - `/dashboard/meauxcad.html`
   - `/dashboard/calendar.html`

## Next Steps

I'll convert the dashboard to proper multi-page structure, starting with the core pages.
