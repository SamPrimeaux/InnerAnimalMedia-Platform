# 🔐 OAuth Setup Guide - GitHub & Google

## 🎯 Overview

This guide will help you set up GitHub and Google OAuth for your SaaS platform, connecting to your main HTTPS domain.

## 📋 Prerequisites

- Main HTTPS domain (e.g., `meauxos.com` or `yourdomain.com`)
- GitHub account (for GitHub OAuth)
- Google Cloud Platform account (for Google OAuth)

---

## 🔵 GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. **Go to GitHub Developer Settings**
   - URL: https://github.com/settings/developers
   - Or: GitHub → Settings → Developer settings → OAuth Apps

2. **Click "New OAuth App"**

3. **Fill in the form:**
   - **Application name**: `MeauxOS Platform` (or your app name)
   - **Homepage URL**: `https://yourdomain.com` (your main domain)
   - **Authorization callback URL**: 
     - **Production**: `https://iaccess-api.meauxbility.workers.dev/api/oauth/github/callback`
     - **Or**: `https://yourdomain.com/api/oauth/github/callback` (if using custom domain)

4. **Click "Register application"**

5. **Copy your credentials:**
   - **Client ID**: `xxxxxxxxxxxxxxxxxxxx` (copy this)
   - **Client Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (copy this - you'll only see it once!)

### Step 2: Add GitHub Credentials to Database

Run this SQL to update your GitHub OAuth provider:

```sql
UPDATE oauth_providers 
SET 
  client_id = 'YOUR_GITHUB_CLIENT_ID',
  client_secret_encrypted = 'YOUR_GITHUB_CLIENT_SECRET',
  updated_at = strftime('%s', 'now')
WHERE id = 'github';
```

**Or use Wrangler:**
```bash
wrangler d1 execute meauxos --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_GITHUB_CLIENT_ID',
    client_secret_encrypted = 'YOUR_GITHUB_CLIENT_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'github';
"
```

### Step 3: Update Worker Environment Variables (Optional)

For better security, you can store secrets in Worker secrets:

```bash
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

Then update `worker.js` to read from `env.GITHUB_CLIENT_ID` instead of database.

---

## 🔴 Google OAuth Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - URL: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click project dropdown → "New Project"
   - Project name: `MeauxOS Platform` (or your name)
   - Click "Create"

3. **Enable APIs**
   - Go to "APIs & Services" → "Library"
   - Enable these APIs:
     - ✅ **Google+ API** (for user info)
     - ✅ **Google Drive API** (if using Drive integration)
     - ✅ **Gmail API** (if using Gmail integration)

### Step 2: Create OAuth 2.0 Credentials

1. **Go to OAuth Consent Screen**
   - URL: https://console.cloud.google.com/apis/credentials/consent
   - Or: APIs & Services → OAuth consent screen

2. **Configure OAuth Consent Screen:**
   - **User Type**: External (for public) or Internal (for Google Workspace)
   - **App name**: `MeauxOS Platform`
   - **User support email**: Your email
   - **Developer contact email**: Your email
   - **Scopes**: Add these:
     - `openid`
     - `profile`
     - `email`
     - `https://www.googleapis.com/auth/drive.readonly` (if using Drive)
   - **Test users**: Add your email for testing
   - Click "Save and Continue" through all steps

3. **Create OAuth 2.0 Client ID**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth client ID"
   - **Application type**: Web application
   - **Name**: `MeauxOS Web Client`
   - **Authorized JavaScript origins**:
     - `https://yourdomain.com`
     - `https://iaccess-api.meauxbility.workers.dev`
   - **Authorized redirect URIs**:
     - `https://iaccess-api.meauxbility.workers.dev/api/oauth/google/callback`
     - `https://yourdomain.com/api/oauth/google/callback` (if using custom domain)
   - Click "Create"

4. **Copy your credentials:**
   - **Client ID**: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx` (copy this!)

### Step 3: Add Google Credentials to Database

Run this SQL to update your Google OAuth provider:

```sql
UPDATE oauth_providers 
SET 
  client_id = 'YOUR_GOOGLE_CLIENT_ID',
  client_secret_encrypted = 'YOUR_GOOGLE_CLIENT_SECRET',
  updated_at = strftime('%s', 'now')
WHERE id = 'google';
```

**Or use Wrangler:**
```bash
wrangler d1 execute meauxos --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_GOOGLE_CLIENT_ID',
    client_secret_encrypted = 'YOUR_GOOGLE_CLIENT_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'google';
"
```

### Step 4: Update Worker Environment Variables (Optional)

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

---

## 🔗 Main Domain Configuration

### Option 1: Use Cloudflare Workers Custom Domain

1. **Add Custom Domain to Worker**
   ```bash
   # In wrangler.toml, add:
   routes = [
     { pattern = "api.yourdomain.com", custom_domain = true }
   ]
   ```

2. **Update OAuth Redirect URIs**
   - GitHub: `https://api.yourdomain.com/api/oauth/github/callback`
   - Google: `https://api.yourdomain.com/api/oauth/google/callback`

### Option 2: Use Cloudflare Pages Custom Domain

1. **Add Custom Domain in Cloudflare Dashboard**
   - Go to Pages → Your Project → Custom Domains
   - Add: `yourdomain.com` and `www.yourdomain.com`

2. **Update OAuth Redirect URIs**
   - Use your main domain for callbacks

---

## 🔐 Security Best Practices

### 1. Encrypt Client Secrets

Currently, secrets are stored as-is. **For production**, implement encryption:

```javascript
// In worker.js, use Web Crypto API to encrypt/decrypt
async function encryptSecret(secret, key) {
  // Use Web Crypto API
}

async function decryptSecret(encrypted, key) {
  // Use Web Crypto API
}
```

### 2. Use Worker Secrets (Recommended)

Store sensitive data in Worker secrets instead of database:

```bash
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_SECRET
```

Then read from `env.GITHUB_CLIENT_SECRET` in your worker.

### 3. Rotate Secrets Regularly

- Rotate OAuth secrets every 90 days
- Update database when rotated

---

## 🧪 Testing OAuth

### Test GitHub OAuth:

1. Go to: `https://iaccess-api.meauxbility.workers.dev/api/oauth/github/authorize?user_id=user-samprimeaux`
2. Should redirect to GitHub
3. Authorize the app
4. Should redirect back with `?oauth_success=github`

### Test Google OAuth:

1. Go to: `https://iaccess-api.meauxbility.workers.dev/api/oauth/google/authorize?user_id=user-samprimeaux`
2. Should redirect to Google
3. Authorize the app
4. Should redirect back with `?oauth_success=google`

---

## 📝 Quick Reference Links

### GitHub:
- **Developer Settings**: https://github.com/settings/developers
- **OAuth Apps**: https://github.com/settings/developers
- **Documentation**: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

### Google Cloud:
- **Console**: https://console.cloud.google.com/
- **Credentials**: https://console.cloud.google.com/apis/credentials
- **OAuth Consent**: https://console.cloud.google.com/apis/credentials/consent
- **Documentation**: https://developers.google.com/identity/protocols/oauth2

---

## ✅ Checklist

- [ ] GitHub OAuth App created
- [ ] GitHub Client ID & Secret copied
- [ ] GitHub credentials added to database
- [ ] Google Cloud Project created
- [ ] Google OAuth Consent Screen configured
- [ ] Google OAuth Client ID created
- [ ] Google Client ID & Secret copied
- [ ] Google credentials added to database
- [ ] Custom domain configured (if using)
- [ ] OAuth redirect URIs updated
- [ ] Worker secrets set (optional, recommended)
- [ ] OAuth flow tested

---

**Once configured, your OAuth integrations will be fully functional!** 🎉
