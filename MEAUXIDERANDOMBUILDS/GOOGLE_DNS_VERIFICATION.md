# 🔗 Google Search Console DNS Verification Guide

**Domain**: `inneranimalmedia.com`  
**Purpose**: Verify domain ownership for Google OAuth branding verification

---

## 📋 Step-by-Step Instructions

### Step 1: Get Google Verification Code

1. **Go to Google Search Console**: https://search.google.com/search-console
2. **Click "Add Property"**
3. **Select "URL prefix"** (not "Domain")
4. **Enter**: `https://inneranimalmedia.com`
5. **Click "Continue"**
6. **Choose verification method**: Select **"HTML tag"** or **"DNS record"**
   
   **If using DNS method:**
   - Copy the verification code (looks like: `abc123xyz4567890`)
   - It will be shown as: `google-site-verification=abc123xyz4567890`
   
   **If using HTML tag method:**
   - Copy the meta tag content (the part after `content=`)
   - Example: `<meta name="google-site-verification" content="abc123xyz4567890" />`
   - The verification code is the `content` value

### Step 2: Add DNS TXT Record to Cloudflare

#### Option A: Using Cloudflare Dashboard (Recommended - Easiest)

1. **Go to Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Select domain**: `inneranimalmedia.com`
3. **Navigate to**: DNS → Records
4. **Click**: "Add record"
5. **Fill in the form**:
   - **Type**: `TXT`
   - **Name**: `@` (or leave blank for root domain)
   - **Content**: `google-site-verification=YOUR_VERIFICATION_CODE` (replace with your code from Step 1)
   - **TTL**: `Auto` (or `3600`)
   - **Proxy status**: Leave unchecked (DNS only, not proxied)
6. **Click**: "Save"
7. **Wait**: 5-10 minutes for DNS propagation (Cloudflare is usually fast)

#### Option B: Using Cloudflare API (Automated)

**Prerequisites:**
- Cloudflare API Token with DNS edit permissions
- Zone ID for `inneranimalmedia.com`

**Get Zone ID:**
```bash
# If you have CLOUDFLARE_API_TOKEN set
curl -X GET "https://api.cloudflare.com/client/v4/zones?name=inneranimalmedia.com" \
  -H "Authorization: Bearer YOUR_CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | jq '.result[0].id'
```

**Create DNS Record:**
```bash
# Replace ZONE_ID and VERIFICATION_CODE
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "TXT",
    "name": "@",
    "content": "google-site-verification=YOUR_VERIFICATION_CODE",
    "ttl": 3600
  }'
```

#### Option C: Using Script (If you have API token)

Use the provided script:
```bash
# Make sure CLOUDFLARE_API_TOKEN is set
export CLOUDFLARE_API_TOKEN="your-token-here"

# Run the script with your verification code
./add-google-verification-dns.sh YOUR_VERIFICATION_CODE
```

---

### Step 3: Verify DNS Record is Active

**Test DNS record:**
```bash
# Check if TXT record exists
dig TXT inneranimalmedia.com +short

# Should show something like:
# "google-site-verification=YOUR_VERIFICATION_CODE"

# Or using nslookup:
nslookup -type=TXT inneranimalmedia.com
```

**Check via Cloudflare Dashboard:**
- Go to DNS → Records
- Look for TXT record with `google-site-verification=...`
- Status should show as active

---

### Step 4: Verify Domain in Google Search Console

1. **Go back to Google Search Console**: https://search.google.com/search-console
2. **On the verification page, click "Verify"**
3. **Wait a few seconds** - Google will check the DNS record
4. **If successful**: You'll see "Ownership verified"
5. **If failed**: Wait 10-15 minutes and try again (DNS propagation can take time)

---

### Step 5: Re-request Branding Verification

After domain verification is successful:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials/consent
2. **Scroll to "Branding verification issues" section**
3. **Click "I have fixed the issues"**
4. **Select the radio button** (if shown)
5. **Click "Proceed"**
6. **Google will re-verify**:
   - Domain ownership (should now pass ✅)
   - Privacy policy link (should already pass ✅)

---

## 🔍 Verification Checklist

- [ ] DNS TXT record added to Cloudflare
- [ ] DNS record visible via `dig` or `nslookup`
- [ ] Domain verified in Google Search Console
- [ ] Branding verification re-requested in Google Cloud Console
- [ ] Branding verification status shows as "Verified" or "Pending review"

---

## 📝 DNS Record Details

**Type**: `TXT`  
**Name**: `@` (root domain) or blank  
**Content**: `google-site-verification=YOUR_VERIFICATION_CODE`  
**TTL**: `3600` (1 hour) or Auto  
**Proxy**: Disabled (DNS only)

**Full Record Example**:
```
Type: TXT
Name: @
Content: google-site-verification=abc123xyz4567890
TTL: Auto
Proxy: DNS only
```

---

## ⚠️ Troubleshooting

### DNS Record Not Showing

**Issue**: DNS record created but not visible via `dig`/`nslookup`  
**Solution**:
- Wait 5-10 minutes (DNS propagation takes time)
- Clear DNS cache: `sudo dscacheutil -flushcache` (macOS) or restart browser
- Check Cloudflare DNS settings - ensure record is not proxied
- Verify record exists in Cloudflare Dashboard

### Verification Fails in Google Search Console

**Issue**: Google can't verify the DNS record  
**Solution**:
- Wait 15-30 minutes after creating DNS record
- Double-check verification code matches exactly (case-sensitive)
- Ensure TXT record is at root domain (`@`), not subdomain
- Try HTML tag method instead if DNS keeps failing

### Can't Find Zone ID

**Issue**: Don't know Cloudflare Zone ID  
**Solution**:
- Cloudflare Dashboard → Select domain → Overview page (Zone ID shown on right sidebar)
- Or use API: `curl -X GET "https://api.cloudflare.com/client/v4/zones?name=inneranimalmedia.com" -H "Authorization: Bearer YOUR_TOKEN"`

---

## 🚀 Quick Command Reference

### Get Zone ID:
```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones?name=inneranimalmedia.com" \
  -H "Authorization: Bearer YOUR_CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | jq '.result[0].id'
```

### Create DNS Record (replace ZONE_ID and CODE):
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "TXT",
    "name": "@",
    "content": "google-site-verification=YOUR_CODE",
    "ttl": 3600
  }'
```

### Test DNS Record:
```bash
dig TXT inneranimalmedia.com +short
# Should output: "google-site-verification=YOUR_CODE"
```

---

**Status**: ⏳ Waiting for verification code from Google Search Console  
**Next Step**: Get verification code, then run DNS update script or add manually via Cloudflare Dashboard
