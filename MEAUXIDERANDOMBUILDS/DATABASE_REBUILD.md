# Database Rebuild for Tools/Workflows/Themes Access

## Overview

Complete database schema rebuild to support reliable access to:
- **Tools** (MeauxMCP, MeauxSQL, MeauxCAD, MeauxIDE, etc.)
- **Workflows** (Enhanced with scheduling, execution history)
- **Themes** (UI customization and theming)
- **User Access Control** (Permissions and access management)
- **Multi-Tenancy** (Full tenant isolation)

## New Schema Structure

### Core Tables

1. **tenants** - Multi-tenant support
   - Enhanced with settings JSON
   - Active/inactive status
   - Creator tracking

2. **users** - User management
   - Role-based access (admin, user, viewer)
   - Permissions JSON
   - Last login tracking

### Tools Management

3. **tools** - Tool registry
   - Public tools (available to all tenants)
   - Tenant-specific tools
   - Version tracking
   - Configuration storage

4. **tool_access** - Access control
   - Tenant-level access
   - User-level access
   - Permissions: view, use, configure

### Workflows Management

5. **workflows** - Enhanced workflows
   - Scheduling support (cron)
   - Execution tracking
   - Success/failure counts
   - Next run calculation

6. **workflow_executions** - Execution history
   - Full execution logs
   - Duration tracking
   - Error messages
   - Result data

7. **workflow_access** - Access control
   - View, execute, edit, delete permissions

### Themes Management

8. **themes** - Theme registry
   - Public themes
   - Tenant-specific themes
   - Theme configuration (JSON)
   - Preview images

9. **theme_access** - Theme access
   - Active theme per tenant/user

### Infrastructure

10. **deployments** - Cloudflare Pages
11. **workers** - Cloudflare Workers
12. **sessions** - User sessions

## Migration Steps

### Step 1: Run Migration Script

```bash
wrangler d1 execute meauxos --file=src/migration-rebuild.sql
```

This will:
- ✅ Create all new tables
- ✅ Preserve existing data
- ✅ Migrate workflows to new structure
- ✅ Insert default tools (MeauxMCP, MeauxSQL, MeauxCAD, MeauxIDE)
- ✅ Insert default theme
- ✅ Grant access to all active tenants

### Step 2: Verify Migration

```bash
# Check tables
wrangler d1 execute meauxos --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Check tools
wrangler d1 execute meauxos --command="SELECT * FROM tools;"

# Check tool access
wrangler d1 execute meauxos --command="SELECT * FROM tool_access LIMIT 5;"
```

### Step 3: Update API Endpoints

The API needs to be updated to support:
- `/api/tools` - List available tools
- `/api/tools/:id/access` - Check/grant access
- `/api/themes` - List available themes
- `/api/workflows` - Enhanced workflow management
- `/api/workflows/:id/execute` - Execute workflow
- `/api/workflows/:id/executions` - Execution history

## Access Control Model

### Tools Access

1. **Public Tools** (`is_public = 1`)
   - Available to all tenants
   - Automatically granted access
   - Can be disabled per tenant

2. **Tenant Tools** (`is_public = 0`)
   - Tenant-specific tools
   - Requires explicit access grant

3. **User-Level Overrides**
   - Users can have custom tool configs
   - Can restrict/enable specific tools per user

### Workflows Access

- **Tenant-Level**: All users in tenant can view
- **User-Level**: Specific permissions per user
- **Execution**: Requires `can_execute` permission

### Themes Access

- **Public Themes**: Available to all
- **Tenant Themes**: Tenant-specific
- **Active Theme**: One active theme per tenant/user

## Default Data

### Default Tools (Public)

- `tool-meauxmcp` - MeauxMCP
- `tool-meauxsql` - InnerData (MeauxSQL)
- `tool-meauxcad` - MeauxCAD
- `tool-meauxide` - MeauxIDE

### Default Theme

- `theme-dark-default` - Dark Default theme

All active tenants automatically get access to these.

## API Integration

### Check Tool Access

```javascript
// Check if user/tenant can access a tool
const hasAccess = await checkToolAccess(toolId, tenantId, userId);
if (hasAccess.can_use) {
  // Allow tool usage
}
```

### List Available Tools

```javascript
// Get all tools available to tenant
const tools = await getTenantTools(tenantId);
// Returns: public tools + tenant-specific tools with access
```

### Get Active Theme

```javascript
// Get active theme for tenant/user
const theme = await getActiveTheme(tenantId, userId);
// Returns: theme config JSON
```

## Benefits

✅ **Reliable Access Control**
- Granular permissions
- Tenant and user-level control
- Audit trail

✅ **Scalable Architecture**
- Public tools shared across tenants
- Tenant-specific customization
- User-level overrides

✅ **Enhanced Workflows**
- Scheduling support
- Execution history
- Success/failure tracking

✅ **Theme System**
- Multiple themes per tenant
- User-specific themes
- Easy customization

✅ **Future-Proof**
- Easy to add new tools
- Easy to add new themes
- Flexible permission model

## Next Steps

1. **Run Migration**: Execute `migration-rebuild.sql`
2. **Update API**: Add new endpoints for tools/themes
3. **Update Frontend**: Use new API endpoints
4. **Test Access**: Verify permissions work correctly
5. **Add More Tools**: Register additional tools as needed

---

**Your database is now ready for reliable tools/workflows/themes access!** 🚀
