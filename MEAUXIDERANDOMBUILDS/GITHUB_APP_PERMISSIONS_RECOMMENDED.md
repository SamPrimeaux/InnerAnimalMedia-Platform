# 🔐 GitHub App Permissions - Recommended Settings

## 🎯 **Strategy: Minimal Permissions**

Since GitHub integration is **optional** and you want reliability without complexity, use **minimal permissions**. You can always expand later if needed.

---

## 📋 **Repository Permissions**

### **✅ SELECT:**
- **Metadata**: `Read-only` ✅ (MANDATORY - can't change)
- **Contents**: `Read-only` ✅ (If users want to see their repos)

### **❌ LEAVE AS "No access":**
- Everything else (Actions, Administration, Artifact metadata, Attestations, Checks, Code scanning, Codespaces, Commit statuses, Custom properties, Dependabot, Deployments, Discussions, Environments, Issues, Merge queues, Packages, Pages, Projects, Pull requests, Security advisories, Secret scanning, Secrets, Single file, Variables, Webhooks, Workflows)

**Why minimal?**
- GitHub is optional for your users
- Most users won't need full repo access
- Reduces security surface area
- Users can grant more permissions later if needed

---

## 🏢 **Organization Permissions**

### **❌ ALL: No access**

**Why?**
- Your platform is individual user-focused
- Not managing organizations
- Keep it simple

---

## 👤 **Account Permissions**

### **✅ SELECT:**
- **Email addresses**: `Read-only` ✅ (Get user email)
- **Profile**: `Read-only` ✅ (Get username, avatar)

### **❌ LEAVE AS "No access":**
- Everything else (Blocking, Followers, Gists, GPG keys, Interactions, Plan, Private user emails, Public user emails, Starring, Watching)

**Why?**
- Just need basic user info for OAuth
- Don't need to manage follows, stars, etc.
- Minimal is better

---

## 📡 **Subscribe to Events**

### **✅ SELECT:**
- **Meta** ✅ (App deleted/updated)
- **Installation** ✅ (App installed/uninstalled)
- **Installation repositories** ✅ (Repos added/removed)

### **❌ LEAVE UNCHECKED:**
- Everything else (Label, Public, Repository, Star, Watch, Workflow job, Workflow run, Security advisory)

**Why?**
- Just need to know when app is installed/updated
- Don't need repo activity events (users can enable later if needed)
- Keep webhook payloads minimal

---

## 🎯 **Installation Target**

### **✅ SELECT:**
- **Any account** ✅

**Why?**
- Your platform is SaaS (users install it)
- GitHub integration is optional
- Users connect their own accounts
- More flexible for your users

---

## 📋 **Complete Checklist**

### **Repository Permissions:**
- [x] **Metadata**: Read-only ✅ (MANDATORY)
- [x] **Contents**: Read-only ✅ (Optional - for showing repos)
- [ ] Everything else: **No access**

### **Organization Permissions:**
- [ ] Everything: **No access**

### **Account Permissions:**
- [x] **Email addresses**: Read-only ✅
- [x] **Profile**: Read-only ✅
- [ ] Everything else: **No access**

### **Subscribe to Events:**
- [x] **Meta** ✅
- [x] **Installation** ✅
- [x] **Installation repositories** ✅
- [ ] Everything else: **Unchecked**

### **Installation Target:**
- [x] **Any account** ✅

---

## 🎯 **What This Gives You**

With these minimal permissions, your app can:
- ✅ Authenticate users via OAuth
- ✅ Get user email and profile info
- ✅ Read repository metadata (names, descriptions)
- ✅ Read repository contents (if Contents permission granted)
- ✅ Know when app is installed/updated
- ✅ Know when repos are added/removed

**What it CAN'T do** (by design - for security):
- ❌ Write to repos
- ❌ Create/delete repos
- ❌ Manage issues/PRs
- ❌ Access organization data
- ❌ Manage secrets/workflows

**This is perfect for optional GitHub integration!** ✅

---

## 🚀 **If You Need More Later**

You can always:
1. Go back to app settings
2. Add more permissions
3. Users re-authorize
4. Done!

**Start minimal, expand as needed.** 🎯

---

## ✅ **Summary - What to Select**

**Repository:**
- Metadata: Read-only ✅ (mandatory)
- Contents: Read-only ✅ (optional but recommended)
- Everything else: No access

**Organization:**
- Everything: No access

**Account:**
- Email addresses: Read-only ✅
- Profile: Read-only ✅
- Everything else: No access

**Events:**
- Meta ✅
- Installation ✅
- Installation repositories ✅
- Everything else: Unchecked

**Installation:**
- Any account ✅

---

**This gives you reliable, secure, minimal GitHub integration!** 🎉
