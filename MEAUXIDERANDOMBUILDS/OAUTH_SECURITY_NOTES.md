# 🔒 OAuth Security Notes

**Important**: OAuth client secrets are currently stored as **plain text** in the database. For production security, consider implementing encryption.

## 🔐 Current Storage

**Database**: `inneranimalmedia-business`  
**Table**: `oauth_providers`  
**Column**: `client_secret_encrypted` (currently stores plain text)

## ⚠️ Security Recommendations

### Option 1: Use Cloudflare Workers Secrets (Recommended)
Store sensitive credentials as Worker secrets instead of in the database:

```bash
# Set Google OAuth credentials as secrets
wrangler secret put GOOGLE_OAUTH_CLIENT_ID --env production
wrangler secret put GOOGLE_OAUTH_CLIENT_SECRET --env production

# Set GitHub OAuth credentials as secrets
wrangler secret put GITHUB_OAUTH_CLIENT_ID --env production
wrangler secret put GITHUB_OAUTH_CLIENT_SECRET --env production
```

Then in `src/worker.js`, retrieve from `env` instead of database:
```javascript
const clientId = env.GOOGLE_OAUTH_CLIENT_ID || provider.client_id;
const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET || provider.client_secret_encrypted;
```

### Option 2: Encrypt in Database
Implement encryption for `client_secret_encrypted` column:
- Use Cloudflare Workers encryption APIs
- Store encryption key as Worker secret
- Encrypt/decrypt when reading/writing to database

### Option 3: Hybrid Approach
- Store non-sensitive data (client_id, URLs, scopes) in database
- Store sensitive data (client_secret) as Worker secrets
- Reference Worker secrets in OAuth handlers

## 🛡️ Best Practices

1. ✅ **Never commit secrets to git** - Use `.gitignore` for `.env` files
2. ✅ **Use environment-specific secrets** - Separate dev/staging/production
3. ✅ **Rotate secrets regularly** - Change OAuth credentials periodically
4. ✅ **Audit secret access** - Log when secrets are accessed
5. ✅ **Limit secret scope** - Use least-privilege access
6. ✅ **Monitor for exposure** - Alert on suspicious secret usage

## 📋 Current Setup

**Google OAuth**:
- Client ID: ✅ Configured in database
- Client Secret: ⚠️ Stored as plain text (consider encryption)

**GitHub OAuth**:
- Client ID: ⚠️ Placeholder (update when available)
- Client Secret: ⚠️ Placeholder (update when available)

## ✅ Action Items

1. ⚠️ **Immediate**: Consider moving secrets to Worker secrets (Option 1)
2. ⚠️ **Short-term**: Implement encryption if keeping in database (Option 2)
3. ✅ **Done**: Google OAuth credentials configured
4. ⏳ **Pending**: GitHub OAuth credentials (when available)

---

**Note**: The current setup works for development/testing, but production should use encrypted secrets or Worker secrets for better security.
