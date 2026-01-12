# 🎭 Demo/Sandbox Mode Solution

## Problem
Need a reliable way to:
1. **Demonstrate the app** to potential clients/users
2. **Allow team to use it functionally** for testing
3. **Protect real projects/personal data** from exposure

## Solution: Isolated Demo Tenant

### 1. Create Dedicated Demo Tenant

```sql
-- Create demo tenant with isolated data
INSERT INTO tenants (
  id, name, slug, is_active, settings, created_at, updated_at, createdBy
) VALUES (
  'tenant_demo_sandbox',
  'Demo Workspace',
  'demo-workspace',
  1,
  '{
    "workspace_type": "demo",
    "demo_mode": true,
    "read_only": false,
    "data_isolation": true,
    "modules": ["meauxwork", "meauxmcp", "analytics", "meauxcloud"],
    "onboarding_completed": true,
    "sandbox_expires_at": null
  }',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'system@inneranimalmedia.com'
);
```

### 2. Demo Mode Features

**Data Isolation:**
- All demo data stored in separate tenant
- Demo users can't access production tenants
- Production users can't access demo tenant (unless admin)

**Demo User Accounts:**
- `demo@inneranimalmedia.com` - Full demo access
- `demo-readonly@inneranimalmedia.com` - Read-only demo access
- Team members can switch to demo tenant for testing

**Auto-Cleanup:**
- Demo data can be reset/cleared periodically
- No risk to production data
- Fresh demo environment on demand

### 3. Access Control

**Worker-Level Protection:**
```javascript
// In worker.js - prevent cross-tenant access
async function getTenantFromRequest(request, env) {
  const tenantId = // ... existing logic ...
  
  // Check if user has access to this tenant
  if (tenantId === 'tenant_demo_sandbox') {
    // Demo tenant - check if user is demo user or admin
    const userEmail = getUserEmailFromRequest(request);
    if (!isDemoUser(userEmail) && !isAdmin(userEmail)) {
      return null; // Deny access
    }
  }
  
  return tenantId;
}
```

### 4. Navigation Banner

**Visual Indicator:**
- Show "DEMO MODE" banner at top of dashboard
- Orange warning stripe
- "Switch to Production" button for team members
- Clear indication this is isolated data

### 5. Demo URL

**Dedicated Demo Access:**
- `/demo` → Demo tenant dashboard
- `/demo/login` → Demo login (no OAuth, simple form)
- Auto-redirect to demo tenant after login

## Implementation Plan

### Phase 1: Create Demo Tenant ✅
1. Create demo tenant in database
2. Create demo user accounts
3. Seed demo data (sample projects, workflows, etc.)

### Phase 2: Access Control ✅
1. Add tenant isolation checks
2. Prevent cross-tenant access
3. Add demo mode detection

### Phase 3: UI Improvements ✅
1. Demo mode banner
2. Tenant switcher (for team members)
3. Demo login page

### Phase 4: Data Management ✅
1. Demo data seed script
2. Demo data reset script
3. Auto-cleanup (optional)

## Usage

### For Demonstrations:
1. Go to `https://inneranimalmedia.com/demo`
2. Login with demo credentials
3. Full app access with sample data
4. No risk to production data

### For Team Testing:
1. Team members can switch tenant in settings
2. Use demo tenant for testing new features
3. Switch back to production when done
4. All test data isolated in demo tenant

## Benefits

✅ **Safe Demonstrations** - No risk of exposing real client data  
✅ **Team Testing** - Isolated environment for testing  
✅ **Data Protection** - Production data completely separate  
✅ **Easy Reset** - Can wipe and reseed demo data anytime  
✅ **Professional** - Clean demo environment for clients  
