# 📝 GitHub App - Complete Field Guide

## 🔐 **Identifying and Authorizing Users**

### **Callback URL**
```
https://inneranimalmedia.com/api/oauth/github/callback
```

**Also add dev URL** (GitHub allows multiple):
```
https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback
```

### **Expire user authorization tokens**
✅ **CHECK THIS** - This gives you refresh tokens for long-term access

### **Request user authorization (OAuth) during installation**
✅ **CHECK THIS** - Users authorize their GitHub account when installing

### **Enable Device Flow**
❌ **UNCHECK** - Not needed for web-based SaaS

---

## 🔄 **Post Installation**

### **Setup URL (optional)**
```
https://inneranimalmedia.com/dashboard/settings
```
*Users go here after installing to configure their integration*

### **Redirect on update**
✅ **CHECK THIS** - Redirect users when they update installation (add/remove repos)

---

## 🔔 **Webhook**

### **Active**
✅ **CHECK THIS** - Enable webhooks

### **Webhook URL**
```
https://inneranimalmedia.com/api/webhooks/github
```

### **Secret**
**Generate a secure random string** (or use this):
```
whsec_github_inneranimalmedia_2025_secure_random_string_here
```

**Or generate one:**
```bash
openssl rand -hex 32
```

**Then add to Worker secrets:**
```bash
wrangler secret put GITHUB_WEBHOOK_SECRET
```

---

## 🔑 **Permissions**

### **Repository Permissions** (Minimal - since GitHub is optional)

**Read-only access** (recommended to start):
- **Contents**: `Read-only` - Read repository contents
- **Metadata**: `Read-only` - Read repository metadata (always enabled)

**If users want to use GitHub features:**
- **Pull requests**: `Read-only` - Read pull requests
- **Issues**: `Read-only` - Read issues

**Leave everything else as "No access"** - You can expand later if needed.

### **Organization Permissions**
**No access** - Not needed for your use case

### **Account Permissions**

**User permissions** (for OAuth):
- **Email addresses**: `Read-only` - Access user email
- **Profile**: `Read-only` - Read user profile

**Leave everything else as "No access"**

---

## 📡 **Subscribe to Events**

Since you're doing minimal permissions, subscribe to:

✅ **Meta** - When app is deleted/updated
✅ **Installation** - When app is installed/uninstalled
✅ **Installation repositories** - When repos are added/removed

**Optional** (if you want repo activity):
- ❌ **Push** - Code pushes (not needed for optional integration)
- ❌ **Pull request** - PR events (not needed for optional integration)
- ❌ **Issues** - Issue events (not needed for optional integration)

**Keep it minimal** - You can add more events later if needed.

---

## 🎯 **Installation Target**

### **Where can this GitHub App be installed?**

✅ **Any account** - Allow installation by any user or organization

**Why?**
- Your platform is SaaS (users install it)
- GitHub integration is optional
- Users connect their own accounts
- More flexible for your users

**Only on this account** - Only if you want to restrict to just your account (not recommended for SaaS)

---

## 📋 **Complete Checklist**

### **Identifying and Authorizing Users**
- [x] Callback URL: `https://inneranimalmedia.com/api/oauth/github/callback`
- [x] Add dev callback: `https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback`
- [x] ✅ Expire user authorization tokens
- [x] ✅ Request user authorization (OAuth) during installation
- [ ] ❌ Enable Device Flow (uncheck)

### **Post Installation**
- [x] Setup URL: `https://inneranimalmedia.com/dashboard/settings`
- [x] ✅ Redirect on update

### **Webhook**
- [x] ✅ Active
- [x] Webhook URL: `https://inneranimalmedia.com/api/webhooks/github`
- [x] Secret: Generate secure random string
- [x] Add secret to Worker: `wrangler secret put GITHUB_WEBHOOK_SECRET`

### **Permissions**
- [x] Repository → Contents: `Read-only`
- [x] Repository → Metadata: `Read-only` (always enabled)
- [x] Account → Email addresses: `Read-only`
- [x] Account → Profile: `Read-only`
- [x] Everything else: `No access`

### **Subscribe to Events**
- [x] ✅ Meta
- [x] ✅ Installation
- [x] ✅ Installation repositories
- [ ] Everything else: Unchecked (for now)

### **Installation Target**
- [x] ✅ Any account

---

## 🚀 **After Setup**

1. **Generate webhook secret:**
   ```bash
   openssl rand -hex 32
   ```

2. **Add to Worker secrets:**
   ```bash
   wrangler secret put GITHUB_WEBHOOK_SECRET
   # Paste the generated secret
   ```

3. **Update worker.js** to handle webhook (if not already):
   - Endpoint: `/api/webhooks/github`
   - Verify signature using `GITHUB_WEBHOOK_SECRET`

4. **Test installation:**
   - Install app on a test account
   - Verify callback works
   - Check webhook receives events

---

## ✅ **Summary - Quick Copy/Paste**

**Callback URLs:**
```
https://inneranimalmedia.com/api/oauth/github/callback
https://inneranimalmedia-dev.meauxbility.workers.dev/api/oauth/github/callback
```

**Setup URL:**
```
https://inneranimalmedia.com/dashboard/settings
```

**Webhook URL:**
```
https://inneranimalmedia.com/api/webhooks/github
```

**Webhook Secret:**
```
[Generate with: openssl rand -hex 32]
```

**Checkboxes:**
- ✅ Expire user authorization tokens
- ✅ Request user authorization (OAuth) during installation
- ✅ Redirect on update
- ✅ Active (webhook)
- ✅ Any account (installation target)

**Permissions:**
- Repository → Contents: Read-only
- Account → Email addresses: Read-only
- Account → Profile: Read-only

**Events:**
- ✅ Meta
- ✅ Installation
- ✅ Installation repositories

---

**You're all set!** Fill in these values and you're done! 🎉
