# Sidebar & App Dock D1 Integration

## Overview
Sidebar preferences, app dock favorites, and navigation state are now stored in D1 for cross-device synchronization.

## Database Schema

### Table: `sidebar_preferences`
- `id` (TEXT PRIMARY KEY): Unique preference ID
- `user_id` (TEXT NOT NULL): User identifier
- `tenant_id` (TEXT NOT NULL): Tenant identifier
- `sidebar_collapsed` (INTEGER DEFAULT 0): 0 = expanded, 1 = collapsed
- `sidebar_width` (INTEGER DEFAULT 280): Custom width in pixels
- `dock_items_json` (TEXT DEFAULT '[]'): Array of dock item configurations
- `recent_apps_json` (TEXT DEFAULT '[]'): Array of recently accessed apps
- `customizations_json` (TEXT DEFAULT '{}'): Additional customizations
- `created_at` (INTEGER NOT NULL): Unix timestamp
- `updated_at` (INTEGER NOT NULL): Unix timestamp
- UNIQUE constraint on `(user_id, tenant_id)`

## API Endpoints

### GET `/api/users/:userId/preferences?type=sidebar`
Returns sidebar preferences for a user.

**Headers:**
- `X-Preference-Type: sidebar` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "sidebar_collapsed": false,
    "sidebar_width": 280,
    "dock_items": [],
    "recent_apps": [],
    "customizations": {},
    "updated_at": 1704859200
  }
}
```

### POST `/api/users/:userId/preferences?type=sidebar`
Saves sidebar preferences for a user.

**Headers:**
- `Content-Type: application/json`
- `X-Preference-Type: sidebar` (optional)

**Body:**
```json
{
  "sidebar_collapsed": false,
  "sidebar_width": 280,
  "dock_items": [
    {
      "page": "overview",
      "icon": "home",
      "order": 0,
      "is_favorite": true
    }
  ],
  "recent_apps": [
    {
      "page": "tasks",
      "accessed_at": 1704859200,
      "count": 5
    }
  ],
  "customizations": {}
}
```

## Client-Side Usage

The sidebar component (`shared/sidebar.js`) automatically:
1. Loads preferences from D1 on initialization
2. Falls back to localStorage if D1 unavailable
3. Saves preferences to D1 when state changes
4. Tracks recent app access automatically

**User ID Source:**
- Checks `localStorage.getItem('userId')` or `localStorage.getItem('user_id')`
- Falls back to `'default-user'` if not found (development mode)

## Migration

Run the migration to create the table:
```bash
wrangler d1 execute inneranimalmedia-business \
  --file=src/migration-sidebar-preferences.sql \
  --remote
```

## Fallback Behavior

If D1 is unavailable or table doesn't exist:
- Component falls back to localStorage
- Legacy preferences endpoint still works (uses `users.permissions` JSON)
- No errors are thrown, graceful degradation

## Testing Checklist

- [x] Migration creates table successfully ✅
- [x] GET endpoint returns default preferences for new user ✅
- [x] POST endpoint saves preferences successfully ✅
- [x] Sidebar loads preferences from D1 on page load ✅
- [x] Sidebar saves preferences when toggled ✅
- [x] Recent apps are tracked automatically ✅
- [x] Fallback to localStorage works if D1 unavailable ✅
- [x] Data persists across requests ✅

## Rollback Plan

If issues arise:
1. **Database rollback**: Drop table if needed
   ```bash
   wrangler d1 execute inneranimalmedia-business \
     --command="DROP TABLE IF EXISTS sidebar_preferences;" \
     --remote
   ```

2. **Worker rollback**: Revert to previous version
   ```bash
   wrangler deployments list --env production
   wrangler rollback <previous-version-id> --env production
   ```

3. **Client-side fallback**: Component automatically uses localStorage if API fails

4. **Legacy format**: Old `users.permissions` JSON format still supported for backward compatibility
