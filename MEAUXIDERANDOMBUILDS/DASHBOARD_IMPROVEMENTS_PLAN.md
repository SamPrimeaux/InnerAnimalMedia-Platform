# Dashboard Improvements Plan

## Current Status

✅ **70 Themes** - Available in `/dashboard/settings`
✅ **Quick-Connect App Dock** - Found `quick-connect.html` and `quick-connect.js`
✅ **29 Dashboard Pages** - All functional
📋 **20 R2 Buckets** - Need to scan for HTML files

## Tasks

### 1. Mobile Navigation (Glassmorphic Hamburger Menu)
- Add hamburger icon button
- Create draggable glassmorphic sidebar overlay
- Mobile-responsive menu system
- Touch-friendly interactions

### 2. Quick-Connect App Dock Integration
- Load `quick-connect.html` on all dashboard pages
- Initialize `quick-connect.js`
- Ensure it appears on all dashboard routes

### 3. R2 HTML File Scanner
- Create API endpoint to list all .html files across R2 buckets
- Use S3-compatible API or Cloudflare R2 API
- Return file metadata (bucket, path, size, modified date)

### 4. HTML Template Viewer
- Build gallery page with app icons for each HTML file
- Popup/inspect functionality
- Preview with iframe
- Copy/download functionality
- Categorize by bucket/path

## Implementation Order

1. Mobile hamburger menu (highest priority - UX issue)
2. Quick-connect app dock (restore existing feature)
3. R2 HTML scanner API (backend foundation)
4. HTML template viewer (frontend for templates)
