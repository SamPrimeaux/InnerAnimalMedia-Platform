# 🚀 Quick DNS Update - Google Search Console Verification

## ⚡ Fastest Method: HTML Tag (2 minutes, no DNS wait!)

### Step 1: Get Verification Code from Google

1. Go to: **https://search.google.com/search-console**
2. Click **"Add Property"**
3. Select **"URL prefix"**
4. Enter: `https://inneranimalmedia.com`
5. Click **"Continue"**
6. Choose **"HTML tag"** method (easiest!)
7. Copy the **verification code** from the meta tag:
   ```html
   <meta name="google-site-verification" content="YOUR_CODE_HERE" />
   ```
   **Just copy the code part** (the long alphanumeric string inside `content=""`)

### Step 2: Add to Homepage (I'll help you do this)

Once you have the verification code, I can:
1. Add the meta tag to your `index.html`
2. Deploy it to R2
3. You verify in Google Search Console

**Just provide me the verification code and I'll do the rest!**

---

## 🔄 Alternative: DNS TXT Record Method

If you prefer DNS method:

### Step 1: Get Verification Code
(Same as above, but choose **"DNS record"** method instead)

### Step 2: Add DNS Record via Cloudflare Dashboard

1. Go to: **https://dash.cloudflare.com**
2. Select domain: **inneranimalmedia.com**
3. Click: **DNS** → **Records** (left sidebar)
4. Click: **"Add record"** button
5. Fill in:
   - **Type**: `TXT`
   - **Name**: `@` (or leave blank for root domain)
   - **Content**: `google-site-verification=YOUR_CODE`
   - **TTL**: `Auto` (or `3600`)
   - **Proxy**: DNS only (gray cloud, NOT orange)
6. Click: **"Save"**
7. Wait: 5-10 minutes for DNS propagation

### Step 3: Verify in Google Search Console

1. Go back to Google Search Console
2. Click **"Verify"** button
3. Should show: **"Ownership verified"** ✅

---

## 🤖 Automated Method (If you have Cloudflare API Token)

If you have `CLOUDFLARE_API_TOKEN` set:

```bash
# Set your API token
export CLOUDFLARE_API_TOKEN="your-token-here"

# Run the script with your verification code
./add-dns-verification.sh YOUR_VERIFICATION_CODE
```

---

## ✅ What I Need From You

To help you make the DNS update, I need:

**Option 1 (Recommended - HTML Tag)**:
- Provide the verification code from Google Search Console
- I'll add the meta tag to your homepage and deploy it

**Option 2 (DNS Method)**:
- Provide the verification code from Google Search Console  
- I can help you create the DNS record via Cloudflare API (if you have API token)
- OR you can add it manually via Cloudflare Dashboard (easier!)

---

## 📋 Quick Checklist

1. ⏳ **Get verification code from Google Search Console** (you need to do this)
2. ✅ **I'll help add it to your site** (provide me the code)
3. ✅ **Verify in Google Search Console** (wait 5-10 min, then click Verify)
4. ✅ **Re-request branding verification** (in Google Cloud Console)

---

**Status**: ⏳ Waiting for verification code from you  
**Next Step**: Go to Google Search Console, get the verification code, then provide it to me or follow the manual steps above!

