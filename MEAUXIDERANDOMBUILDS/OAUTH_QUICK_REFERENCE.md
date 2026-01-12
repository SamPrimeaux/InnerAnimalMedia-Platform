# 🔐 OAuth Quick Reference - inneranimalmedia.com

## 📋 Configured OAuth Callback URLs

**Status**: ✅ All URLs documented and supported by worker

See `OAUTH_CONFIGURED_URLS.md` for complete list of configured URLs in Google OAuth app.

### Primary Callback URLs (Direct handling):

**Google OAuth**:
- ✅ `https://inneranimalmedia.com/api/oauth/google/callback`
- ✅ `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/callback` (fallback)

**GitHub OAuth**:
- ✅ `https://inneranimalmedia.com/api/oauth/github/callback`
- ✅ `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback` (fallback)

### Alternative Callback URLs (Redirect handling):
All alternative callback paths configured in your Google OAuth app are supported via redirect routes:
- `/auth/{provider}/callback` → Redirects to `/api/oauth/{provider}/callback`
- `/api/auth/{provider}/callback` → Redirects to `/api/oauth/{provider}/callback`
- `/dashboard/auth/callback` → Provider detected from state, redirects accordingly
- `/login/callback` → Provider detected from state (defaults to 'google'), redirects accordingly

**All configured URLs in your Google OAuth app will work!** ✅

---

## 🔵 Google OAuth Setup (Step-by-Step)

### 1. Go to Google Cloud Console
👉 https://console.cloud.google.com/apis/credentials

### 2. Create OAuth Client ID
- Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
- **Application type**: `Web application`
- **Name**: `InnerAnimal Media - inneranimalmedia.com`

### 3. Configure URLs
**Authorized JavaScript origins**:
```
https://inneranimalmedia.com
https://inneranimalmedia-dev.meauxbility.workers.dev
```

**Authorized redirect URIs**:
```
https://inneranimalmedia.com/api/oauth/google/callback
https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/callback
```

### 4. Copy Credentials
After creating, you'll get:
- **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
- **Client Secret** (looks like: `GOCSPX-abc123xyz`)

### 5. Update Database
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_GOOGLE_CLIENT_ID',
    client_secret_encrypted = 'YOUR_GOOGLE_CLIENT_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'google';
"
```

**Replace**:
- `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID
- `YOUR_GOOGLE_CLIENT_SECRET` with your actual Client Secret

---

## 🐙 GitHub OAuth Setup (Step-by-Step)

### 1. Go to GitHub Developer Settings
👉 https://github.com/settings/developers

### 2. Create New OAuth App
- Click **"New OAuth App"**
- **Application name**: `InnerAnimal Media Business`
- **Homepage URL**: `https://inneranimalmedia.com`

### 3. Configure Callback URL
**Authorization callback URL**:
```
https://inneranimalmedia.com/api/oauth/github/callback
```

⚠️ **Note**: After creating, edit the app and add the second callback:
```
https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback
```

### 4. Copy Credentials
- **Client ID** (shown on the app page)
- **Client Secret** (click "Generate a new client secret" if needed)

### 5. Update Database
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_GITHUB_CLIENT_ID',
    client_secret_encrypted = 'YOUR_GITHUB_CLIENT_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'github';
"
```

**Replace**:
- `YOUR_GITHUB_CLIENT_ID` with your actual GitHub Client ID
- `YOUR_GITHUB_CLIENT_SECRET` with your actual GitHub Client Secret

---

## ✅ Verify Setup

### Check Database Configuration
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT 
    id,
    name,
    CASE 
        WHEN client_id = 'PLACEHOLDER_CLIENT_ID' THEN 'NOT CONFIGURED'
        ELSE 'CONFIGURED: ' || SUBSTR(client_id, 1, 30) || '...'
    END as status,
    is_enabled
FROM oauth_providers 
WHERE id IN ('google', 'github');
"
```

### Test OAuth Flows
**Google**:
```
https://inneranimalmedia.com/api/oauth/google/authorize
```

**GitHub**:
```
https://inneranimalmedia.com/api/oauth/github/authorize
```

Both should redirect to their OAuth consent pages (not show JSON errors).

---

## 🔄 Separate Setup: meauxcloud.org (meauxos database)

The `meauxos` database is for `meauxcloud.org` OAuth setup. That requires separate OAuth apps with different callback URLs:

**For meauxcloud.org** (if using meauxos database):
- Google: `https://meauxcloud.org/api/oauth/google/callback`
- GitHub: `https://meauxcloud.org/api/oauth/github/callback`

**To verify meauxcloud.org OAuth**:
```bash
wrangler d1 execute meauxos --remote --command="
SELECT 
    id,
    name,
    CASE 
        WHEN client_id = 'PLACEHOLDER_CLIENT_ID' OR client_id IS NULL THEN 'NOT CONFIGURED'
        ELSE 'CONFIGURED: ' || SUBSTR(client_id, 1, 30) || '...'
    END as status
FROM oauth_providers 
WHERE id IN ('google', 'github');
"
```

---

## 📝 Quick Commands

### View Current Config
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT id, name, client_id, auth_url, is_enabled, updated_at 
FROM oauth_providers 
WHERE id IN ('google', 'github');
"
```

### Update Google OAuth
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = 'PASTE_YOUR_CLIENT_ID_HERE',
    client_secret_encrypted = 'PASTE_YOUR_CLIENT_SECRET_HERE',
    updated_at = strftime('%s', 'now')
WHERE id = 'google';
"
```

### Update GitHub OAuth
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = 'PASTE_YOUR_CLIENT_ID_HERE',
    client_secret_encrypted = 'PASTE_YOUR_CLIENT_SECRET_HERE',
    updated_at = strftime('%s', 'now')
WHERE id = 'github';
"
```

---

## 🚨 Important Notes

1. **Worker Dynamic Origin**: The worker constructs callback URLs from the request origin (`new URL(request.url).origin`), so ensure ALL possible domains are configured in your OAuth apps.

2. **Client Secret Storage**: Currently stored as plain text in `client_secret_encrypted` field. Consider encrypting for production security.

3. **OAuth App Status**: 
   - **Testing mode**: Only works for test users you add
   - **Production mode**: Requires Google verification for sensitive scopes (like Drive access)

4. **Scopes Requested**:
   - Google: `openid`, `profile`, `email`, `https://www.googleapis.com/auth/drive.readonly`
   - GitHub: `user:email`, `read:org`, `repo`

---

## 🎯 Summary: What You Need to Do

1. ✅ **Create Google OAuth App** (https://console.cloud.google.com/apis/credentials)
   - Add callback URLs listed above
   - Copy Client ID and Secret
   - Update database with credentials

2. ✅ **Create GitHub OAuth App** (https://github.com/settings/developers)
   - Add callback URLs listed above
   - Copy Client ID and Secret
   - Update database with credentials

3. ✅ **Verify Setup** (run the verification script or commands above)

4. ✅ **Test OAuth Flows** (visit the authorize URLs)

5. ✅ **Verify meauxcloud.org Setup** (check meauxos database separately)

---

**Once credentials are added, OAuth will work for inneranimalmedia.com!** 🚀
