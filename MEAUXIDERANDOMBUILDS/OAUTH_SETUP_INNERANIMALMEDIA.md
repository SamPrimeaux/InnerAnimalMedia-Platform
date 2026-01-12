# 🔐 OAuth Setup Guide - inneranimalmedia.com

## 🌐 Domain Configuration

**Primary Domain**: `inneranimalmedia.com`  
**Worker URL**: `inneranimalmedia-dev.meauxbility.workers.dev` (dynamic origin)  
**OAuth Callback**: Automatically uses the request origin + `/api/oauth/{provider}/callback`

## 📋 Required OAuth Callback URLs

The worker dynamically constructs callback URLs based on the request origin. You need to configure **both**:

1. **Production Domain** (if custom domain connected):
   - `https://inneranimalmedia.com/api/oauth/google/callback`
   - `https://inneranimalmedia.com/api/oauth/github/callback`

2. **Worker Dev URL** (fallback/development):
   - `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/callback`
   - `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback`

---

## 🔵 Google OAuth Setup for inneranimalmedia.com

### Step 1: Google Cloud Console
👉 **Go to**: https://console.cloud.google.com/

### Step 2: Select or Create Project
1. If you already have a project for InnerAnimal Media, select it
2. Otherwise, click project dropdown → **"New Project"**
3. Name: `InnerAnimal Media Business`
4. Click **"Create"**

### Step 3: Configure OAuth Consent Screen
👉 **Go to**: https://console.cloud.google.com/apis/credentials/consent

1. **User Type**: External (unless you have Google Workspace)
2. **App Information**:
   - **App name**: `InnerAnimal Media`
   - **User support email**: Your email
   - **Developer contact information**: Your email
3. **Scopes** (click "Add or Remove Scopes"):
   - ✅ `openid`
   - ✅ `profile`
   - ✅ `email`
   - ✅ `https://www.googleapis.com/auth/drive.readonly`
4. **Test users**: Add your email (required for external apps in testing)
5. Click **"Save and Continue"** through all steps
6. Click **"Back to Dashboard"**

### Step 4: Create OAuth 2.0 Client ID
👉 **Go to**: https://console.cloud.google.com/apis/credentials

1. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. **Application type**: `Web application`
3. **Name**: `InnerAnimal Media - inneranimalmedia.com`
4. **Authorized JavaScript origins** (click "+ ADD URI"):
   - `https://inneranimalmedia.com`
   - `https://inneranimalmedia-dev.meauxbility.workers.dev`
5. **Authorized redirect URIs** (click "+ ADD URI"):
   - `https://inneranimalmedia.com/api/oauth/google/callback`
   - `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/callback`
6. Click **"CREATE"**
7. **IMPORTANT**: Copy both:
   - **Client ID** (looks like: `123456789-abc123def456.apps.googleusercontent.com`)
   - **Client secret** (looks like: `GOCSPX-abc123def456xyz`)

### Step 5: Update Database (inneranimalmedia-business)

```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_GOOGLE_CLIENT_ID_HERE',
    client_secret_encrypted = 'YOUR_GOOGLE_CLIENT_SECRET_HERE',
    updated_at = strftime('%s', 'now')
WHERE id = 'google';
"
```

**Replace**:
- `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID
- `YOUR_GOOGLE_CLIENT_SECRET_HERE` with your actual Client Secret

---

## 🐙 GitHub OAuth Setup for inneranimalmedia.com

### Step 1: Create GitHub OAuth App
👉 **Go to**: https://github.com/settings/developers

1. Click **"New OAuth App"**
2. Fill in:
   - **Application name**: `InnerAnimal Media Business`
   - **Homepage URL**: `https://inneranimalmedia.com`
   - **Authorization callback URL**: `https://inneranimalmedia.com/api/oauth/github/callback`
3. Click **"Register application"**
4. On the next page, also add the worker dev callback:
   - Click **"Edit"** or add another callback URL
   - Add: `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback`
5. **IMPORTANT**: Copy:
   - **Client ID** (from the app page)
   - **Client secret** (click "Generate a new client secret" if needed)

### Step 2: Update Database (inneranimalmedia-business)

```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_GITHUB_CLIENT_ID_HERE',
    client_secret_encrypted = 'YOUR_GITHUB_CLIENT_SECRET_HERE',
    updated_at = strftime('%s', 'now')
WHERE id = 'github';
"
```

**Replace**:
- `YOUR_GITHUB_CLIENT_ID_HERE` with your actual GitHub Client ID
- `YOUR_GITHUB_CLIENT_SECRET_HERE` with your actual GitHub Client Secret

---

## ✅ Verify OAuth Configuration

### Check Database (inneranimalmedia-business)

```bash
# Verify Google OAuth provider
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT id, name, client_id, auth_url, is_enabled 
FROM oauth_providers 
WHERE id IN ('google', 'github');
"

# Should show:
# - client_id should NOT be 'PLACEHOLDER_CLIENT_ID'
# - is_enabled should be 1
```

### Test OAuth Endpoints

**Google**:
```
https://inneranimalmedia.com/api/oauth/google/authorize
```

**GitHub**:
```
https://inneranimalmedia.com/api/oauth/github/authorize
```

Both should redirect to their respective OAuth consent pages (not show errors).

---

## 🔄 Separate Setup: meauxcloud.org (meauxos database)

**Note**: The `meauxos` database is for `meauxcloud.org` OAuth setup. That should be configured separately with different OAuth apps.

To verify/update meauxcloud.org OAuth:
```bash
# Check meauxos database OAuth providers (if table exists)
wrangler d1 execute meauxos --remote --command="
SELECT id, name, client_id, auth_url, is_enabled 
FROM oauth_providers 
WHERE id IN ('google', 'github');
"
```

---

## 📝 Quick Reference

### Database Commands

**View current OAuth config**:
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT id, name, display_name, client_id, auth_url, token_url, scopes, is_enabled, updated_at 
FROM oauth_providers 
WHERE id IN ('google', 'github');
"
```

**Update Google OAuth**:
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_CLIENT_ID',
    client_secret_encrypted = 'YOUR_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'google';
"
```

**Update GitHub OAuth**:
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_CLIENT_ID',
    client_secret_encrypted = 'YOUR_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'github';
"
```

---

## 🚨 Important Notes

1. **Client Secret Security**: The `client_secret_encrypted` field stores secrets. Consider encrypting them if you haven't already (currently stored as plain text - should be encrypted in production).

2. **Multiple Domains**: If you connect a custom domain later, update the OAuth apps with the new callback URLs.

3. **Testing**: OAuth apps in "Testing" mode only work for users you add as test users. To make it public, you'll need to submit for verification (requires verification for sensitive scopes like Drive access).

4. **Scopes**: The current setup requests `drive.readonly` scope. If you don't need Google Drive access, you can remove it and simplify the consent screen.

---

## ✨ Next Steps

1. ✅ Set up Google OAuth credentials (follow Step 1-5 above)
2. ✅ Set up GitHub OAuth credentials (follow Step 1-2 above)
3. ✅ Update both providers in the database
4. ✅ Test OAuth flows
5. ✅ Verify meauxcloud.org OAuth in meauxos database (separate setup)

---

**Once credentials are added, OAuth will work for inneranimalmedia.com!** 🚀
