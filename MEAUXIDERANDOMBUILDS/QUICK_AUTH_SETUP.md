# 🔐 Quick Authentication Setup

## ✅ **Built-in OAuth System Ready**

Your built-in OAuth system is now live and secure! Here's how to use it:

---

## 🚀 **Quick Registration (3 Ways)**

### **Option 1: Via Login Page (Easiest)**
1. Visit: `https://inneranimalmedia-dev.meauxbility.workers.dev/login`
2. Click **"Sign up"** at the bottom
3. Fill in:
   - **Name**: Your name
   - **Email**: Your email
   - **Password**: Your secure password
4. Click **"Create Account"**
5. You'll be redirected to login → Enter your credentials → Access dashboard

### **Option 2: Via API (Command Line)**
```bash
curl -X POST https://inneranimalmedia-dev.meauxbility.workers.dev/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourSecurePass123!",
    "name": "Your Name"
  }'
```

### **Option 3: Via OAuth Flow**
1. Visit login page
2. Click **"Continue with InnerAnimal"**
3. You'll be prompted to login/register
4. After auth, redirected back with OAuth tokens

---

## 🔑 **Login Methods**

### **1. Email/Password**
- Visit: `/login`
- Enter email and password
- Click **"Sign In"**
- Tokens stored in localStorage
- Redirected to dashboard

### **2. Built-in OAuth**
- Click **"Continue with InnerAnimal"**
- If not logged in → Login form
- After login → OAuth authorization
- Redirected back with tokens

### **3. GitHub/Google OAuth**
- Click **"Continue with GitHub"** or **"Continue with Google"**
- Authorize with provider
- Redirected back with tokens

---

## 🔒 **Password Requirements**

Your password must:
- ✅ Be at least **8 characters** long
- ✅ Contain at least **1 letter**
- ✅ Contain at least **1 number**
- ✅ (Optional but recommended) Include special characters

**Example Strong Passwords:**
- `Thissomebullshit1!` ✅
- `SecurePass123!` ✅
- `MyPassword2024!` ✅

---

## 📝 **After Registration**

Once registered, you can:
1. **Login** with email/password
2. **Use OAuth** flows (InnerAnimal, GitHub, Google)
3. **Access dashboard** at `/dashboard`
4. **Store tokens** in localStorage (automatically handled)

---

## 🔍 **Verify Your Account**

After registration, test login:
```bash
curl -X POST https://inneranimalmedia-dev.meauxbility.workers.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourPassword123!"
  }'
```

You should receive:
```json
{
  "success": true,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "user": {
      "id": "...",
      "email": "...",
      "name": "...",
      "tenant_id": "..."
    }
  }
}
```

---

## 🛡️ **Security Notes**

1. **Passwords are hashed** with SHA-256 + PBKDF2 (100k iterations) + SHA-512
2. **Random salt** per user (prevents rainbow table attacks)
3. **Tokens are hashed** before storage (never store raw tokens)
4. **PKCE support** for OAuth flows (prevents code interception)
5. **Short-lived tokens** (1 hour access, refresh tokens available)

---

## 🚨 **Important Reminders**

- ❌ **Never share** your password with anyone
- ❌ **Don't use** the same password on multiple sites
- ✅ **Use a password manager** for best security
- ✅ **Enable MFA** when available (framework ready)
- ✅ **Change passwords** periodically

---

**Your authentication system is ready to use!** 🎉

Visit `/login` to get started.
