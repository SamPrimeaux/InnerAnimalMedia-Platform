/**
 * Admin Routing System - Shopify-style admin subdomain routing
 * Handles: admin.inneranimalmedia.com/store/{tenant-slug}
 * 
 * Routes:
 * - admin.inneranimalmedia.com → Admin dashboard
 * - admin.inneranimalmedia.com/stores → List all stores/tenants
 * - admin.inneranimalmedia.com/store/{slug} → Tenant-specific admin
 * - admin.inneranimalmedia.com/settings → Admin settings
 */

/**
 * Detect if request is for admin subdomain
 */
export function isAdminRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname.toLowerCase();
  
  // Check for admin subdomain
  // admin.inneranimalmedia.com
  // admin.localhost (for local dev)
  return hostname.startsWith('admin.') || 
         hostname.includes('.admin.') ||
         url.pathname.startsWith('/admin/');
}

/**
 * Extract admin route information from request
 */
export function parseAdminRoute(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const hostname = url.hostname.toLowerCase();
  
  // Determine if admin subdomain or /admin/ path
  const isAdminSubdomain = hostname.startsWith('admin.') || hostname.includes('.admin.');
  const isAdminPath = path.startsWith('/admin/');
  
  if (!isAdminSubdomain && !isAdminPath) {
    return null; // Not an admin request
  }
  
  // Parse route structure
  // admin.inneranimalmedia.com/store/inneranimalmedia → { type: 'store', slug: 'inneranimalmedia' }
  // admin.inneranimalmedia.com/stores → { type: 'stores' }
  // admin.inneranimalmedia.com → { type: 'dashboard' }
  
  let routePath = path;
  if (isAdminPath) {
    routePath = path.replace('/admin', '') || '/';
  }
  
  const routeParts = routePath.split('/').filter(p => p);
  
  // Route: /store/{slug}
  if (routeParts.length >= 2 && routeParts[0] === 'store') {
    return {
      type: 'store',
      slug: routeParts[1],
      subPath: routeParts.slice(2).join('/') || null,
      fullPath: routePath
    };
  }
  
  // Route: /stores
  if (routeParts.length >= 1 && routeParts[0] === 'stores') {
    return {
      type: 'stores',
      subPath: routeParts.slice(1).join('/') || null,
      fullPath: routePath
    };
  }
  
  // Route: /settings
  if (routeParts.length >= 1 && routeParts[0] === 'settings') {
    return {
      type: 'settings',
      subPath: routeParts.slice(1).join('/') || null,
      fullPath: routePath
    };
  }
  
  // Route: / (dashboard)
  return {
    type: 'dashboard',
    subPath: routeParts.join('/') || null,
    fullPath: routePath
  };
}

/**
 * Get tenant slug from admin route
 */
export function getTenantSlugFromAdminRoute(adminRoute) {
  if (adminRoute && adminRoute.type === 'store') {
    return adminRoute.slug;
  }
  return null;
}

/**
 * Check if user has admin access
 */
export async function checkAdminAccess(request, env, tenantId = null) {
  // Get user from session/cookie
  const cookieHeader = request.headers.get('Cookie');
  const cookies = cookieHeader ? cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) acc[key.trim()] = decodeURIComponent(value.trim());
    return acc;
  }, {}) : {};
  
  const userEmail = cookies.user_email;
  
  if (!userEmail) {
    return { hasAccess: false, reason: 'not_authenticated' };
  }
  
  try {
    // Check if user is superadmin or has admin role
    const user = await env.DB.prepare(
      'SELECT id, email, role FROM users WHERE email = ? LIMIT 1'
    )
      .bind(userEmail)
      .first();
    
    if (!user) {
      return { hasAccess: false, reason: 'user_not_found' };
    }
    
    // Check if superadmin
    if (user.role === 'superadmin') {
      return { hasAccess: true, user, isSuperAdmin: true };
    }
    
    // Check if admin role
    if (user.role === 'admin') {
      // If tenant-specific admin route, verify user belongs to that tenant
      if (tenantId) {
        const userTenant = await env.DB.prepare(
          'SELECT tenant_id FROM users WHERE id = ? AND tenant_id = ? LIMIT 1'
        )
          .bind(user.id, tenantId)
          .first();
        
        if (!userTenant) {
          return { hasAccess: false, reason: 'tenant_access_denied' };
        }
      }
      
      return { hasAccess: true, user, isSuperAdmin: false };
    }
    
    return { hasAccess: false, reason: 'insufficient_permissions' };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return { hasAccess: false, reason: 'error', error: error.message };
  }
}

/**
 * Generate admin URL
 */
export function generateAdminUrl(baseUrl, route) {
  const url = new URL(baseUrl);
  
  // If already on admin subdomain, use it
  if (url.hostname.startsWith('admin.')) {
    url.pathname = route;
    return url.toString();
  }
  
  // Otherwise, create admin subdomain URL
  const parts = url.hostname.split('.');
  if (parts.length >= 2) {
    // inneranimalmedia.com → admin.inneranimalmedia.com
    url.hostname = `admin.${parts.slice(-2).join('.')}`;
  } else {
    // localhost → admin.localhost
    url.hostname = `admin.${url.hostname}`;
  }
  
  url.pathname = route;
  return url.toString();
}
