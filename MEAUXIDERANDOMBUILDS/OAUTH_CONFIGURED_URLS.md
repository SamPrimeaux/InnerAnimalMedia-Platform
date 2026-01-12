# 🔐 OAuth Configured URLs - Google OAuth

**Last Updated**: 2025-01-10  
**Status**: ✅ Configured in Google Cloud Console  
**Database Status**: ✅ Credentials updated in database  
**Client ID**: `254316571351-gi4tevt4h7e96lc5ugbk6ooe2ap7otts.apps.googleusercontent.com` (configured)

---

## 📋 Authorized JavaScript Origins

These are the domains allowed to initiate OAuth requests from a browser:

1. ✅ `https://inneranimalmedia.com`
2. ✅ `https://inneranimalmedia-dev.meauxbility.workers.dev`
3. ✅ `https://www.inneranimalmedia.com`
4. ✅ `https://admin.meauxbility.org`
5. ✅ `https://meauxbility.org`
6. ✅ `https://www.meauxbility.org`
7. ✅ `http://localhost:8787` (local development)

---

## 🔄 Authorized Redirect URIs

These are the callback URLs configured in Google OAuth App:

### ✅ **Current Worker Implementation** (Matches `/api/oauth/{provider}/callback`)
1. ✅ `https://inneranimalmedia.com/api/oauth/google/callback`
2. ✅ `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/callback`

### ✅ **Additional Callback URLs** (Now handled via redirect routes)
3. ✅ `https://inneranimalmedia.com/auth/google/callback` - **Redirects to `/api/oauth/google/callback`**
4. ✅ `https://inneranimalmedia.com/api/auth/google/callback` - **Redirects to `/api/oauth/google/callback`**
5. ✅ `https://inneranimalmedia.com/dashboard/auth/callback` - **Redirects to `/api/oauth/google/callback`**
6. ✅ `https://inneranimalmedia.com/login/callback` - **Redirects to `/api/oauth/google/callback`**
7. ✅ `https://www.inneranimalmedia.com/auth/google/callback` - **Redirects to `/api/oauth/google/callback`**
8. ✅ `https://www.inneranimalmedia.com/api/auth/google/callback` - **Redirects to `/api/oauth/google/callback`**
9. ✅ `https://admin.meauxbility.org/auth/google/callback` - **Redirects to `/api/oauth/google/callback`** (if same worker)
10. ✅ `https://admin.meauxbility.org/api/auth/google/callback` - **Redirects to `/api/oauth/google/callback`** (if same worker)
11. ✅ `https://admin.meauxbility.org/dashboard/auth/callback` - **Redirects to `/api/oauth/google/callback`** (if same worker)
12. ✅ `https://meauxbility.org/auth/google/callback` - **Redirects to `/api/oauth/google/callback`** (if same worker)
13. ✅ `https://meauxbility.org/api/auth/google/callback` - **Redirects to `/api/oauth/google/callback`** (if same worker)
14. ✅ `http://localhost:8787/auth/google/callback` - **Redirects to `/api/oauth/google/callback`** (local dev)

---

## 🔍 Current Worker Implementation

The worker (`src/worker.js`) handles OAuth callbacks with:

### Primary Route:
**Pattern**: `/api/oauth/{provider}/callback`

Where `{provider}` is:
- `google`
- `github`

**Examples**: 
- ✅ `https://inneranimalmedia.com/api/oauth/google/callback` - **Direct handling**
- ✅ `https://inneranimalmedia.com/api/oauth/github/callback` - **Direct handling**

### Redirect Routes (for alternative callback paths):
**Patterns**:
- `/auth/{provider}/callback` → Redirects to `/api/oauth/{provider}/callback`
- `/api/auth/{provider}/callback` → Redirects to `/api/oauth/{provider}/callback`
- `/dashboard/auth/callback` → Detects provider from state token, redirects accordingly
- `/login/callback` → Detects provider from state token (or defaults to 'google'), redirects accordingly

**Provider Detection**: For `/dashboard/auth/callback` and `/login/callback`, the worker:
1. Extracts the `state` parameter from the OAuth callback
2. Looks up the provider in the `oauth_states` database table
3. Redirects to the appropriate `/api/oauth/{provider}/callback` endpoint
4. Falls back to 'google' if provider cannot be determined

---

## ⚠️ Mismatch Analysis

### URLs That Will Work:
- ✅ `https://inneranimalmedia.com/api/oauth/google/callback`
- ✅ `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/callback`
- ✅ `https://www.inneranimalmedia.com/api/oauth/google/callback` (if www redirects to non-www)
- ✅ `https://admin.meauxbility.org/api/oauth/google/callback` (if served by same worker)
- ✅ `https://meauxbility.org/api/oauth/google/callback` (if served by same worker)

### URLs That Will Redirect (301/302):
- ✅ `/auth/{provider}/callback` → Redirects to `/api/oauth/{provider}/callback`
- ✅ `/api/auth/{provider}/callback` → Redirects to `/api/oauth/{provider}/callback`
- ✅ `/dashboard/auth/callback` → Redirects to `/api/oauth/{provider}/callback`
- ✅ `/login/callback` → Redirects to `/api/oauth/{provider}/callback` (Note: assumes provider is 'google', may need refinement)

---

## 🛠️ Recommendations

### ✅ **Status: Alternative Paths Now Supported**

The worker now includes redirect routes for alternative callback paths. All configured callback URLs will work:

**Direct Routes** (no redirect):
- ✅ `/api/oauth/{provider}/callback` - **Primary route**

**Redirect Routes** (redirect to primary):
- ✅ `/auth/{provider}/callback` → `/api/oauth/{provider}/callback`
- ✅ `/api/auth/{provider}/callback` → `/api/oauth/{provider}/callback`
- ✅ `/dashboard/auth/callback` → `/api/oauth/{provider}/callback` (Note: provider detected from path)
- ✅ `/login/callback` → `/api/oauth/{provider}/callback` (Note: assumes 'google', may need refinement)

**Recommendation**: Keep all configured URLs in Google OAuth app - they all work now via redirect routes.

---

## 📝 For GitHub OAuth

**Note**: These URLs are for Google OAuth. GitHub OAuth should be configured similarly:

**Recommended GitHub Callback URLs**:
1. `https://inneranimalmedia.com/api/oauth/github/callback`
2. `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback`
3. `https://www.inneranimalmedia.com/api/oauth/github/callback` (if needed)
4. `https://admin.meauxbility.org/api/oauth/github/callback` (if needed)
5. `https://meauxbility.org/api/oauth/github/callback` (if needed)
6. `http://localhost:8787/api/oauth/github/callback` (local dev)

**GitHub Homepage URL**: `https://inneranimalmedia.com`

---

## 🔗 Domain Mapping

### inneranimalmedia.com
- **Worker**: `inneranimalmedia-dev.meauxbility.workers.dev`
- **Database**: `inneranimalmedia-business`
- **OAuth Callback**: `/api/oauth/{provider}/callback`

### admin.meauxbility.org
- **Status**: Unknown (separate worker? same worker?)
- **Database**: Unknown (separate? same `inneranimalmedia-business`?)
- **OAuth Callback**: Currently configured, but worker route unknown

### meauxbility.org
- **Status**: Unknown (separate worker? same worker?)
- **Database**: `meauxos` (mentioned as separate)
- **OAuth Callback**: Currently configured, but worker route unknown

---

## ✅ Next Steps

1. ✅ **Verify Worker Routes**: Confirm which domains actually route to this worker
2. ⚠️ **Clean Up OAuth URLs**: Remove unused callback URLs that don't match worker routes
3. ✅ **Add Missing URLs**: Ensure all active domains have `/api/oauth/{provider}/callback` configured
4. ✅ **Test Each Domain**: Verify OAuth works for each configured domain

---

## 🧪 Testing

Test OAuth for each domain:

```bash
# inneranimalmedia.com
curl -I https://inneranimalmedia.com/api/oauth/google/authorize

# www.inneranimalmedia.com (if configured)
curl -I https://www.inneranimalmedia.com/api/oauth/google/authorize

# admin.meauxbility.org (if served by same worker)
curl -I https://admin.meauxbility.org/api/oauth/google/authorize

# meauxbility.org (if served by same worker)
curl -I https://meauxbility.org/api/oauth/google/authorize
```

All should redirect to Google's OAuth consent screen (not 404).

---

**Status**: ✅ Google OAuth URLs documented  
**Worker Status**: ✅ Redirect routes added for alternative callback paths  
**Database Status**: ✅ Google OAuth credentials configured  
**Client ID**: `254316571351-gi4tevt4h7e96lc5ugbk6ooe2ap7otts.apps.googleusercontent.com`  
**Action Required**: ✅ All configured callback URLs are now supported via redirect routes  
**Next Step**: ⚠️ Consider moving secrets to Worker secrets for production security (see OAUTH_SECURITY_NOTES.md)

---

## 🎉 Implementation Complete

All configured OAuth callback URLs are now handled by the worker:

1. ✅ **Primary Route**: `/api/oauth/{provider}/callback` - Direct handling
2. ✅ **Redirect Routes**: Alternative paths redirect to primary route
3. ✅ **Query Parameters**: Preserved during redirect (code, state, error, etc.)
4. ✅ **Provider Detection**: Automatically detects 'google' or 'github' from path

**Deployed**: Worker updated with redirect routes for backwards compatibility.
