# ⚡ Quick OAuth Setup - GitHub & Google

## 🔗 Direct Links to Set Up OAuth

### 🔵 GitHub OAuth App

**Create OAuth App:**
👉 https://github.com/settings/developers

**Steps:**
1. Click **"New OAuth App"**
2. **Application name**: `MeauxOS Platform`
3. **Homepage URL**: `https://yourdomain.com` (your main domain)
4. **Authorization callback URL**: 
   ```
   https://iaccess-api.meauxbility.workers.dev/api/oauth/github/callback
   ```
5. Click **"Register application"**
6. **Copy Client ID and Client Secret**

**Update Database:**
```bash
wrangler d1 execute meauxos --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_GITHUB_CLIENT_ID',
    client_secret_encrypted = 'YOUR_GITHUB_CLIENT_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'github';
"
```

---

### 🔴 Google OAuth

**Google Cloud Console:**
👉 https://console.cloud.google.com/

**OAuth Consent Screen:**
👉 https://console.cloud.google.com/apis/credentials/consent

**Create OAuth Client:**
👉 https://console.cloud.google.com/apis/credentials

**Steps:**
1. **Create Project** (if needed)
2. **Configure OAuth Consent Screen**:
   - App name: `MeauxOS Platform`
   - Scopes: `openid`, `profile`, `email`, `drive.readonly`
3. **Create OAuth 2.0 Client ID**:
   - Type: Web application
   - **Authorized redirect URIs**:
     ```
     https://iaccess-api.meauxbility.workers.dev/api/oauth/google/callback
     ```
4. **Copy Client ID and Client Secret**

**Update Database:**
```bash
wrangler d1 execute meauxos --remote --command="
UPDATE oauth_providers 
SET client_id = 'YOUR_GOOGLE_CLIENT_ID',
    client_secret_encrypted = 'YOUR_GOOGLE_CLIENT_SECRET',
    updated_at = strftime('%s', 'now')
WHERE id = 'google';
"
```

---

## 🔐 For Your Main HTTPS Domain

### Update OAuth Redirect URIs:

**GitHub:**
- Callback: `https://yourdomain.com/api/oauth/github/callback`
- Or: `https://api.yourdomain.com/api/oauth/github/callback`

**Google:**
- Callback: `https://yourdomain.com/api/oauth/google/callback`
- Or: `https://api.yourdomain.com/api/oauth/google/callback`

### Update Worker Custom Domain:

1. **In Cloudflare Dashboard:**
   - Workers → Your Worker → Settings → Triggers
   - Add Custom Domain: `api.yourdomain.com`

2. **Update OAuth Providers in Database:**
   - Use new callback URLs

---

## ✅ Test OAuth

**GitHub:**
```
https://iaccess-api.meauxbility.workers.dev/api/oauth/github/authorize?user_id=user-samprimeaux
```

**Google:**
```
https://iaccess-api.meauxbility.workers.dev/api/oauth/google/authorize?user_id=user-samprimeaux
```

---

**That's it! Once you add the credentials, OAuth will work!** 🚀
