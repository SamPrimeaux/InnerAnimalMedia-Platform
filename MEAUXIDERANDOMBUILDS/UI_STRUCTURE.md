# UI Structure & Navigation Guide

## Overview

Your iAccess platform now has a complete public-facing website with a fully customized dashboard system.

## File Structure

```
/
├── index.html                    # Public homepage
├── dashboard.html                # Main dashboard (entry point)
├── workflows.html                # Workflows management (enhanced)
├── workers.html                  # Workers management
├── vercel-deployments-dashboard-remastered.html  # Deployments dashboard
├── users.html                    # User management
├── terms.html                    # Terms of service
└── [other pages]
```

## Navigation Flow

### Public Pages
- **/** → `index.html` - Landing page with features, stats, CTA
- **/about** → About page (to be created)
- **/pricing** → Pricing page (to be created)
- **/docs** → Documentation (to be created)
- **/terms** → Terms of service

### Dashboard Pages (Protected)
- **/dashboard** → `dashboard.html` - Main dashboard overview
- **/dashboard/workflows** → `workflows.html` - Workflows management
- **/dashboard/workers** → `workers.html` - Workers management
- **/dashboard/deployments** → `vercel-deployments-dashboard-remastered.html` - Deployments
- **/dashboard/tenants** → Tenant management (to be created)
- **/dashboard/settings** → Settings page (to be created)
- **/dashboard/analytics** → Analytics dashboard (to be created)

## Design System

### Colors
- **Primary**: `#0066FF` (Blue)
- **Accent**: `#00E5A0` (Teal/Green)
- **Background Dark**: `#0A0E1A`
- **Background Secondary**: `#111827`
- **Text Primary**: `#F9FAFB`
- **Text Secondary**: `#9CA3AF`

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: 800-900 weight
- **Body**: 400-500 weight
- **Code**: JetBrains Mono

### Components
- Consistent sidebar navigation
- Unified header with search
- Card-based layouts
- Gradient buttons
- Status badges
- Pagination controls

## Features

### Public Website (`index.html`)
✅ Modern hero section
✅ Feature showcase
✅ Stats section
✅ Call-to-action
✅ Footer with links
✅ Smooth scrolling
✅ Responsive design

### Dashboard (`dashboard.html`)
✅ Sidebar navigation
✅ Top header with search
✅ Stats overview cards
✅ Quick action cards
✅ Real-time data loading
✅ Multi-tenant support ready

### Enhanced Pages
✅ **workflows.html** - Multi-tenant, pagination, filtering
✅ **vercel-deployments-dashboard-remastered.html** - Multi-tenant, pagination

## Routing Implementation

### Option 1: Static HTML (Current)
- Each page is a separate HTML file
- Navigation via anchor tags
- Works with any hosting

### Option 2: SPA Router (Recommended for Production)
```javascript
// Add to all pages
const router = {
  routes: {
    '/': 'index.html',
    '/dashboard': 'dashboard.html',
    '/dashboard/workflows': 'workflows.html',
    // ...
  },
  
  navigate(path) {
    window.location.href = this.routes[path] || path;
  }
};
```

### Option 3: Server-Side Routing
- Use Cloudflare Workers or similar
- Handle routing server-side
- Better SEO and performance

## Authentication Flow

### Current State
- Dashboard pages are accessible (no auth yet)
- Add authentication middleware

### Recommended Implementation
```javascript
// Check authentication on dashboard pages
async function checkAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  
  // Verify token with API
  const response = await fetch('/api/auth/verify', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    window.location.href = '/login';
    return false;
  }
  
  return true;
}

// Add to dashboard.html and all dashboard pages
document.addEventListener('DOMContentLoaded', async () => {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) return;
  // Load dashboard content
});
```

## Customization Guide

### Adding New Dashboard Pages

1. **Create HTML file** (e.g., `dashboard-analytics.html`)
2. **Use dashboard template**:
   ```html
   <div class="app-container">
     <aside class="sidebar"><!-- Copy from dashboard.html --></aside>
     <main class="main-content"><!-- Your content --></main>
   </div>
   ```
3. **Add navigation link** in sidebar:
   ```html
   <a href="/dashboard/analytics" class="nav-item">
     <svg>...</svg>
     <span>Analytics</span>
   </a>
   ```

### Styling Customization

All pages use CSS variables defined in `:root`. To customize:

```css
:root {
  --ia-primary: #YOUR_COLOR;
  --ia-accent: #YOUR_ACCENT;
  /* ... */
}
```

### Adding Public Pages

1. **Create HTML file** (e.g., `about.html`)
2. **Use homepage template** from `index.html`
3. **Update navigation** in `index.html` footer

## Performance Optimization

### Current
- Inline CSS (fast initial load)
- External fonts (Google Fonts)
- No build step required

### Recommended Enhancements
- Minify CSS/JS
- Optimize images
- Add service worker for offline support
- Implement lazy loading
- Use CDN for static assets

## Next Steps

1. ✅ Public homepage created
2. ✅ Dashboard structure created
3. ⏳ Add authentication pages (login, signup)
4. ⏳ Create missing dashboard pages (analytics, settings)
5. ⏳ Add routing system
6. ⏳ Implement API integration
7. ⏳ Add error pages (404, 500)
8. ⏳ Mobile menu for sidebar
9. ⏳ Dark/light mode toggle
10. ⏳ User preferences storage

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Accessibility

- Semantic HTML
- ARIA labels (to be added)
- Keyboard navigation
- Screen reader support (to be enhanced)
