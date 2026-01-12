# Resend Email Setup - Quick Guide

## ✅ Your Resend API Key
**API Key:** `re_BhGPu5Kt_7MYSXE9GhupsWJZc2iEfbZsu`  
**Account:** shinshu-solutions (on Resend)

## 🚀 Add to Cloudflare Worker (Production)

### Option 1: Cloudflare Dashboard (Recommended)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **shinshu-solutions**
3. Click **Settings** → **Variables**
4. Under **Environment Variables**, click **Add variable**
5. Add these three variables:

   ```
   RESEND_API_KEY = re_BhGPu5Kt_7MYSXE9GhupsWJZc2iEfbZsu
   RESEND_FROM_EMAIL = [email protected] (or your verified domain email)
   RESEND_ADMIN_EMAIL = [email protected]
   ```

6. Click **Save**
7. The worker will automatically redeploy with new variables

### Option 2: Wrangler CLI (Alternative)
```bash
cd shinshu-solutions
wrangler secret put RESEND_API_KEY
# When prompted, paste: re_BhGPu5Kt_7MYSXE9GhupsWJZc2iEfbZsu

wrangler secret put RESEND_FROM_EMAIL
# Enter: [email protected] (or your verified email)

wrangler secret put RESEND_ADMIN_EMAIL
# Enter: [email protected]
```

## ✅ Test Connection
1. Go to Dashboard → **Setup & Integrations**
2. Click **"Test Resend Connection"** button
3. Check your email inbox for the test email
4. If successful, you'll see ✅ confirmation

## 📧 What This Enables
- ✅ Auto-response emails to customer inquiries
- ✅ Email notifications when new inquiries arrive
- ✅ Project summary emails
- ✅ Multi-language email templates
- ✅ Professional transactional emails

## 🔒 Security Note
API keys are stored securely in Cloudflare Worker environment variables and are never exposed in code or client-side JavaScript.
