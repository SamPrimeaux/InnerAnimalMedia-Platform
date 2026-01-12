# ✅ Main Domain OAuth Setup - inneranimalmedia.com

## 🎯 **Current Status**

✅ **OAuth Code is Dynamic** - Uses `${url.origin}` so it works on ANY domain  
✅ **Dev Worker**: `https://inneranimalmedia-dev.meauxbility.workers.dev` - Working  
⚠️ **Main Domain**: `https://inneranimalmedia.com` - Needs route configuration

---

## 🔧 **Step 1: Add Custom Domain Route to Worker**

### **Option A: Via Cloudflare Dashboard** (Recommended)

1. Go to: **Cloudflare Dashboard** → **Workers & Pages**
2. Click on your worker: **inneranimalmedia-dev**
3. Go to: **Settings** → **Triggers**
4. Scroll to: **Routes** section
5. Click: **Add Route**
6. Add:
   - **Route**: `inneranimalmedia.com/*`
   - **Zone**: `inneranimalmedia.com` (must be in your Cloudflare account)
7. Click: **Add Route**

### **Option B: Via wrangler.toml** (Alternative)

Add to `wrangler.toml`:

```toml
# Add routes for main domain
routes = [
  { pattern = "inneranimalmedia.com/*", zone_name = "inneranimalmedia.com" },
  { pattern = "www.inneranimalmedia.com/*", zone_name = "inneranimalmedia.com" }
]
```

Then deploy:
```bash
wrangler deploy --env production
```

---

## 🔗 **Step 2: Update GitHub OAuth App**

### **Add Production Callback URL**

1. Go to: https://github.com/settings/developers
2. Click on your OAuth App: **InnerAnimalMedia Platform**
3. Scroll to: **Authorization callback URL**
4. **Add a new callback URL**:
   ```
   https://inneranimalmedia.com/api/oauth/github/callback
   ```
5. **Keep the existing dev URL**:
   ```
   https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback
   ```
6. Click: **Update application**

**GitHub allows multiple callback URLs**, so both will work:
- ✅ Dev: `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback`
- ✅ Production: `https://inneranimalmedia.com/api/oauth/github/callback`

---

## 🔗 **Step 3: Update Google OAuth** (If Needed)

If you have Google OAuth set up:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client
3. Under **Authorized redirect URIs**, add:
   ```
   https://inneranimalmedia.com/api/oauth/google/callback
   ```
4. Keep the existing dev URL:
   ```
   https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/google/callback
   ```
5. Click: **Save**

---

## ✅ **How It Works**

The OAuth code is **already dynamic** and will work on both domains:

```javascript
// In worker.js - line ~6041
authUrl.searchParams.set('redirect_uri', `${new URL(request.url).origin}/api/oauth/${providerId}/callback`);
```

**This means**:
- If request comes from `inneranimalmedia.com` → callback: `https://inneranimalmedia.com/api/oauth/github/callback`
- If request comes from `inneranimalmedia-dev.meauxbility.workers.dev` → callback: `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback`

**No code changes needed!** ✅

---

## 🧪 **Testing**

### **Test Dev URL** (Already Working)
```
https://inneranimalmedia-dev.meauxbility.workers.dev/dashboard/settings
```
- Click "Connect GitHub"
- Should redirect to GitHub
- After authorization, redirects back to dev URL

### **Test Production URL** (After Route Setup)
```
https://inneranimalmedia.com/dashboard/settings
```
- Click "Connect GitHub"
- Should redirect to GitHub
- After authorization, redirects back to `inneranimalmedia.com`

---

## 📋 **Checklist**

- [ ] Add route `inneranimalmedia.com/*` to worker (Cloudflare Dashboard or wrangler.toml)
- [ ] Add `https://inneranimalmedia.com/api/oauth/github/callback` to GitHub OAuth app
- [ ] Add `https://inneranimalmedia.com/api/oauth/google/callback` to Google OAuth (if using)
- [ ] Test OAuth flow on dev URL (should already work)
- [ ] Test OAuth flow on production URL (after route setup)

---

## 🎯 **Current OAuth App Configuration**

**GitHub OAuth App**:
- **Client ID**: `Ov23li6BZYxjVtGUWibX`
- **Client Secret**: ✅ Set in Worker secrets
- **Current Callback**: `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback`
- **Add Production Callback**: `https://inneranimalmedia.com/api/oauth/github/callback`

---

## 🚀 **Once Complete**

After adding the route and updating OAuth apps:

1. ✅ OAuth will work on **both** dev and production URLs
2. ✅ Users can connect GitHub from either domain
3. ✅ No code changes needed (already dynamic)
4. ✅ All integration status checks will work on both domains

**The code is already set up correctly - you just need to configure the route and OAuth app callbacks!** 🎉
