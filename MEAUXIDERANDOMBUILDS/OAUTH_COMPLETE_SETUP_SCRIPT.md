# 🔐 COMPLETE OAuth Setup Script - Do This Once

## ⚡ Quick Setup (Copy/Paste Ready)

### Step 1: GitHub OAuth App Setup

**1. Create GitHub OAuth App:**
- Go to: https://github.com/settings/developers
- Click "New OAuth App"
- Fill in:
  ```
  Application name: InnerAnimal Media Platform
  Homepage URL: https://inneranimalmedia.com
  Authorization callback URL: https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback
  ```
- Click "Register application"
- **COPY THE CLIENT ID AND CLIENT SECRET** (you'll only see secret once!)

**2. Add to Worker Secrets:**
```bash
wrangler secret put GITHUB_OAUTH_CLIENT_ID
# Paste your GitHub Client ID when prompted

wrangler secret put GITHUB_OAUTH_CLIENT_SECRET
# Paste your GitHub Client Secret when prompted
```

**3. Update Database (Alternative/Backup):**
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_GITHUB_CLIENT_ID_HERE',
    client_secret_encrypted = 'YOUR_GITHUB_CLIENT_SECRET_HERE',
    updated_at = strftime('%s', 'now')
WHERE id = 'github';
"
```

---

### Step 2: Google OAuth Setup

**1. Create Google Cloud Project:**
- Go to: https://console.cloud.google.com/
- Create new project: "InnerAnimal Media Platform"

**2. Configure OAuth Consent Screen:**
- Go to: https://console.cloud.google.com/apis/credentials/consent
- Select: External (for public users)
- Fill in:
  ```
  App name: InnerAnimal Media Platform
  User support email: [your email]
  Developer contact: [your email]
  ```
- Add Scopes:
  - `openid`
  - `profile`
  - `email`
  - `https://www.googleapis.com/auth/drive.readonly`
- Add Test Users: [your email]
- Save and Continue through all steps

**3. Create OAuth 2.0 Client ID:**
- Go to: https://console.cloud.google.com/apis/credentials
- Click "Create Credentials" → "OAuth client ID"
- Application type: **Web application**
- Name: `InnerAnimal Media Web Client`
- Authorized JavaScript origins:
  ```
  https://inneranimalmedia.com
  https://inneranimalmedia-dev.meauxbility.workers.dev
  ```
- Authorized redirect URIs:
  ```
  https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/callback
  https://inneranimalmedia.com/api/oauth/google/callback
  ```
- Click "Create"
- **COPY THE CLIENT ID AND CLIENT SECRET**

**4. Add to Worker Secrets:**
```bash
wrangler secret put GOOGLE_OAUTH_CLIENT_ID
# Paste your Google Client ID when prompted

wrangler secret put GOOGLE_OAUTH_CLIENT_SECRET
# Paste your Google Client Secret when prompted
```

**5. Update Database (Alternative/Backup):**
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_GOOGLE_CLIENT_ID_HERE',
    client_secret_encrypted = 'YOUR_GOOGLE_CLIENT_SECRET_HERE',
    updated_at = strftime('%s', 'now')
WHERE id = 'google';
"
```

---

## 🔍 Verify OAuth Providers in Database

```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT id, name, display_name, client_id, is_enabled, created_at, updated_at 
FROM oauth_providers 
ORDER BY id;
"
```

**Expected Output:**
- `github` - GitHub OAuth (should have client_id)
- `google` - Google OAuth (should have client_id)

---

## ✅ Test OAuth Endpoints

### Test GitHub OAuth:
```bash
curl -I "https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/authorize?user_id=test-user"
```
**Should return:** `HTTP/2 302` with redirect to `github.com/login/oauth/authorize` (with real client_id, not PLACEHOLDER)

### Test Google OAuth:
```bash
curl -I "https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/authorize?user_id=test-user"
```
**Should return:** `HTTP/2 302` with redirect to `accounts.google.com/o/oauth2/v2/auth` (with real client_id)

---

## 🎯 Complete One-Time Setup Script

**Save your credentials first, then run:**

```bash
#!/bin/bash
# Complete OAuth Setup Script

echo "🔐 OAuth Setup Script"
echo "===================="
echo ""

# GitHub OAuth
echo "📋 Step 1: GitHub OAuth Setup"
read -p "Enter GitHub Client ID: " GITHUB_CLIENT_ID
read -p "Enter GitHub Client Secret: " GITHUB_CLIENT_SECRET

echo ""
echo "Setting GitHub OAuth secrets..."
wrangler secret put GITHUB_OAUTH_CLIENT_ID <<< "$GITHUB_CLIENT_ID"
wrangler secret put GITHUB_OAUTH_CLIENT_SECRET <<< "$GITHUB_CLIENT_SECRET"

echo ""
echo "Updating GitHub OAuth in database..."
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = '$GITHUB_CLIENT_ID',
    client_secret_encrypted = '$GITHUB_CLIENT_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'github';
"

echo ""
echo "✅ GitHub OAuth configured!"

# Google OAuth
echo ""
echo "📋 Step 2: Google OAuth Setup"
read -p "Enter Google Client ID: " GOOGLE_CLIENT_ID
read -p "Enter Google Client Secret: " GOOGLE_CLIENT_SECRET

echo ""
echo "Setting Google OAuth secrets..."
wrangler secret put GOOGLE_OAUTH_CLIENT_ID <<< "$GOOGLE_CLIENT_ID"
wrangler secret put GOOGLE_OAUTH_CLIENT_SECRET <<< "$GOOGLE_CLIENT_SECRET"

echo ""
echo "Updating Google OAuth in database..."
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = '$GOOGLE_CLIENT_ID',
    client_secret_encrypted = '$GOOGLE_CLIENT_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'google';
"

echo ""
echo "✅ Google OAuth configured!"

# Verify
echo ""
echo "🔍 Verifying OAuth providers..."
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT id, name, display_name, 
       CASE 
         WHEN client_id = 'PLACEHOLDER_CLIENT_ID' THEN '❌ NOT CONFIGURED'
         ELSE '✅ CONFIGURED'
       END as status,
       updated_at 
FROM oauth_providers 
ORDER BY id;
"

echo ""
echo "🎉 OAuth setup complete!"
echo ""
echo "Test endpoints:"
echo "  GitHub: https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/authorize?user_id=test-user"
echo "  Google: https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/authorize?user_id=test-user"
```

---

## 📝 Quick Reference: OAuth URLs

### Authorization URLs (Start OAuth Flow)
```
GitHub: /api/oauth/github/authorize?user_id={user_id}
Google: /api/oauth/google/authorize?user_id={user_id}
```

### Callback URLs (Must match in OAuth apps)
```
GitHub: https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback
Google: https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/callback
```

### For Production (when using main domain):
```
GitHub: https://inneranimalmedia.com/api/oauth/github/callback
Google: https://inneranimalmedia.com/api/oauth/google/callback
```

---

## 🗄️ Database Schema Reference

**oauth_providers table:**
```sql
CREATE TABLE IF NOT EXISTS oauth_providers (
  id TEXT PRIMARY KEY,                    -- 'github' or 'google'
  name TEXT NOT NULL,                     -- 'github' or 'google'
  display_name TEXT NOT NULL,             -- 'GitHub' or 'Google'
  client_id TEXT NOT NULL,                -- OAuth Client ID
  client_secret_encrypted TEXT NOT NULL,  -- OAuth Client Secret (stored as plain text, TODO: encrypt)
  auth_url TEXT NOT NULL,                 -- Authorization URL
  token_url TEXT NOT NULL,                -- Token exchange URL
  user_info_url TEXT NOT NULL,            -- User info API URL
  scopes TEXT NOT NULL,                   -- JSON array of scopes
  is_enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**oauth_states table:**
```sql
CREATE TABLE IF NOT EXISTS oauth_states (
  id TEXT PRIMARY KEY,           -- State token
  user_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  redirect_uri TEXT,
  scope TEXT,
  expires_at INTEGER NOT NULL,   -- Unix timestamp
  created_at INTEGER NOT NULL
);
```

**oauth_tokens table:**
```sql
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token_encrypted TEXT,   -- Access token (TODO: encrypt)
  refresh_token_encrypted TEXT,  -- Refresh token (TODO: encrypt)
  token_type TEXT DEFAULT 'Bearer',
  expires_at INTEGER,            -- Unix timestamp
  scope TEXT,
  provider_user_id TEXT,         -- Provider's user ID
  provider_username TEXT,        -- Provider's username
  provider_email TEXT,           -- Provider's email
  provider_avatar_url TEXT,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, provider_id)
);
```

---

## 🔗 OAuth Provider Configuration Values

### GitHub OAuth Provider:
```sql
INSERT OR REPLACE INTO oauth_providers (
  id, name, display_name, client_id, client_secret_encrypted,
  auth_url, token_url, user_info_url, scopes, is_enabled, created_at, updated_at
) VALUES (
  'github',
  'github',
  'GitHub',
  'YOUR_GITHUB_CLIENT_ID',
  'YOUR_GITHUB_CLIENT_SECRET',
  'https://github.com/login/oauth/authorize',
  'https://github.com/login/oauth/access_token',
  'https://api.github.com/user',
  '["user:email", "read:org", "repo"]',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
```

### Google OAuth Provider:
```sql
INSERT OR REPLACE INTO oauth_providers (
  id, name, display_name, client_id, client_secret_encrypted,
  auth_url, token_url, user_info_url, scopes, is_enabled, created_at, updated_at
) VALUES (
  'google',
  'google',
  'Google',
  'YOUR_GOOGLE_CLIENT_ID',
  'YOUR_GOOGLE_CLIENT_SECRET',
  'https://accounts.google.com/o/oauth2/v2/auth',
  'https://oauth2.googleapis.com/token',
  'https://www.googleapis.com/oauth2/v2/userinfo',
  '["openid", "profile", "email", "https://www.googleapis.com/auth/drive.readonly"]',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
```

---

## ⚠️ Important Notes

1. **Worker Secrets Take Priority**: If both Worker secrets and database values exist, Worker secrets are used first.

2. **Callback URLs Must Match Exactly**: The callback URL in your OAuth app must match exactly what the code expects.

3. **Database Storage**: Currently storing secrets as plain text in database. TODO: Add encryption.

4. **State Tokens**: Expire after 10 minutes. Automatically cleaned up.

5. **Token Refresh**: Google tokens can be refreshed using refresh_token. GitHub tokens don't expire.

---

## 🚨 Troubleshooting

### Issue: "OAuth provider not found"
```bash
# Check if providers exist
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT * FROM oauth_providers;
"
```

### Issue: "Invalid client_id"
- Verify Worker secrets: `wrangler secret list`
- Verify database: Check `oauth_providers` table
- Make sure no `PLACEHOLDER_CLIENT_ID` values

### Issue: "Redirect URI mismatch"
- Check callback URL in OAuth app matches exactly: `/api/oauth/{provider}/callback`
- Must include protocol: `https://`
- Must match domain exactly

### Issue: OAuth works but no cookies set
- Check that callback redirects to `/dashboard`
- Cookies are set with `SameSite=Lax; Secure`
- Check browser console for cookie errors

---

## 📋 Complete Checklist

- [ ] GitHub OAuth App created
- [ ] GitHub Client ID saved
- [ ] GitHub Client Secret saved
- [ ] GitHub Worker secrets set
- [ ] GitHub database updated
- [ ] Google Cloud Project created
- [ ] Google OAuth Consent Screen configured
- [ ] Google OAuth Client ID created
- [ ] Google Client ID saved
- [ ] Google Client Secret saved
- [ ] Google Worker secrets set
- [ ] Google database updated
- [ ] Test GitHub OAuth redirect
- [ ] Test Google OAuth redirect
- [ ] Verify database providers
- [ ] Test full OAuth flow end-to-end

---

**Save this file and reference it whenever you need to set up OAuth!** 🚀
