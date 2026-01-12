# 🗄️ Database Configuration - inneranimalmedia.com

**Last Updated**: 2025-01-10  
**Status**: ✅ Configured and Active

---

## 📋 D1 Database Configuration

### Primary Database (inneranimalmedia-business)

```json
{
  "binding": "DB",
  "database_name": "inneranimalmedia-business",
  "database_id": "cf87b717-d4e2-4cf8-bab0-a81268e32d49"
}
```

**Binding**: `DB` (used in `env.DB` in worker code)  
**Database Name**: `inneranimalmedia-business`  
**Database ID**: `cf87b717-d4e2-4cf8-bab0-a81268e32d49`  
**Environment**: Production

**Access in Worker**:
```javascript
// In src/worker.js
const provider = await env.DB.prepare('SELECT * FROM oauth_providers WHERE id = ?')
  .bind(providerId)
  .first();
```

---

## 🔐 OAuth Configuration

### Google OAuth
- **Client ID**: ✅ Set as Worker secret (`GOOGLE_OAUTH_CLIENT_ID`)
- **Client Secret**: ✅ Set as Worker secret (`GOOGLE_OAUTH_CLIENT_SECRET`)
- **Database Status**: ✅ Configured (used as fallback)
- **Provider ID**: `google`
- **Status**: ✅ Active

### GitHub OAuth
- **Client ID**: ⚠️ Placeholder in database (update when available)
- **Client Secret**: ⚠️ Placeholder in database (update when available)
- **Provider ID**: `github`
- **Status**: ⚠️ Not configured (needs credentials)

---

## 📊 Database Tables (OAuth Related)

### `oauth_providers`
Stores OAuth provider configurations:
- `id` (TEXT PRIMARY KEY) - 'google', 'github', etc.
- `name` (TEXT) - Provider name
- `display_name` (TEXT) - Display name
- `client_id` (TEXT) - OAuth client ID (or placeholder)
- `client_secret_encrypted` (TEXT) - OAuth client secret (currently plain text)
- `auth_url` (TEXT) - Authorization URL
- `token_url` (TEXT) - Token exchange URL
- `user_info_url` (TEXT) - User info endpoint
- `scopes` (TEXT) - JSON array of scopes
- `is_enabled` (INTEGER) - 1 if enabled, 0 if disabled
- `created_at` (INTEGER) - Unix timestamp
- `updated_at` (INTEGER) - Unix timestamp

### `oauth_states`
Stores OAuth flow state tokens:
- `id` (TEXT PRIMARY KEY) - State token
- `user_id` (TEXT) - User ID
- `provider_id` (TEXT) - Provider ID ('google', 'github')
- `redirect_uri` (TEXT) - Redirect URI after OAuth
- `scope` (TEXT) - Requested scopes
- `expires_at` (INTEGER) - Expiration timestamp (10 minutes)
- `created_at` (INTEGER) - Creation timestamp

### `oauth_tokens`
Stores user OAuth tokens (after successful OAuth flow):
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT) - User ID
- `tenant_id` (TEXT) - Tenant ID
- `provider_id` (TEXT) - Provider ID
- `access_token_encrypted` (TEXT) - Access token (currently plain text)
- `refresh_token_encrypted` (TEXT) - Refresh token (if available)
- `token_type` (TEXT) - Usually 'Bearer'
- `expires_at` (INTEGER) - Token expiration timestamp
- `scope` (TEXT) - Granted scopes
- `provider_user_id` (TEXT) - User ID from provider
- `provider_username` (TEXT) - Username from provider
- `provider_email` (TEXT) - Email from provider
- `provider_avatar_url` (TEXT) - Avatar URL
- `last_used_at` (INTEGER) - Last usage timestamp
- `created_at` (INTEGER) - Creation timestamp
- `updated_at` (INTEGER) - Update timestamp

---

## 🛠️ Database Commands

### View OAuth Providers
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT id, name, display_name, client_id, auth_url, is_enabled, updated_at
FROM oauth_providers
WHERE id IN ('google', 'github');
"
```

### Check OAuth Provider Status
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT 
    id,
    name,
    CASE 
        WHEN client_id = 'PLACEHOLDER_CLIENT_ID' THEN 'NOT CONFIGURED'
        ELSE 'CONFIGURED: ' || SUBSTR(client_id, 1, 40) || '...'
    END as status,
    is_enabled
FROM oauth_providers
WHERE id IN ('google', 'github');
"
```

### Update Google OAuth (if needed - secrets are preferred)
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_CLIENT_ID',
    client_secret_encrypted = 'YOUR_CLIENT_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'google';
"
```

### View OAuth States (for debugging)
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT id, user_id, provider_id, redirect_uri, expires_at, created_at
FROM oauth_states
WHERE expires_at > strftime('%s', 'now')
ORDER BY created_at DESC
LIMIT 10;
"
```

### View OAuth Tokens (for debugging - be careful with sensitive data)
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT id, user_id, provider_id, provider_email, provider_username, expires_at, last_used_at
FROM oauth_tokens
ORDER BY last_used_at DESC
LIMIT 10;
"
```

---

## ✅ Verification

### Verify Database Configuration
```bash
# Check database exists and is accessible
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'oauth%';
"
```

### Run Full OAuth Verification
```bash
./verify-oauth-setup.sh
```

---

## 🔐 Security Notes

### Current Setup
- ✅ **Secrets**: Google OAuth credentials stored as Worker secrets (secure)
- ✅ **Worker Logic**: Uses secrets first, database as fallback
- ⚠️ **Database**: Still contains plain text credentials (can be used as fallback or removed)

### Recommended Actions
1. ✅ **Done**: Secrets stored in Cloudflare Workers
2. ✅ **Done**: Worker code uses secrets first
3. ⏳ **Optional**: Remove plain text credentials from database (if you trust secrets only)
4. ⏳ **Optional**: Encrypt database credentials (if keeping as fallback)

---

## 📝 Notes

- **Database Binding**: `DB` (not `MEAUXOS_DB` - that's for the secondary database)
- **Worker Access**: All OAuth code uses `env.DB` (which maps to `inneranimalmedia-business`)
- **Secrets Priority**: Worker secrets (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`) are used first, database values are fallback
- **Database ID**: `cf87b717-d4e2-4cf8-bab0-a81268e32d49` (used by Wrangler CLI)

---

**Status**: ✅ Database configured correctly  
**OAuth Status**: ✅ Google OAuth fully configured with secrets  
**Next Step**: ⏳ Configure GitHub OAuth when credentials are available
