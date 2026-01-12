# ⚡ Quick DNS Update Guide - Google Search Console Verification

**Domain**: `inneranimalmedia.com`  
**Purpose**: Verify domain ownership for Google OAuth branding verification

---

## 🚀 Quick Method: Cloudflare Dashboard (Easiest - 2 minutes)

### Step 1: Get Verification Code from Google

1. **Go to Google Search Console**: https://search.google.com/search-console
2. **Click "Add Property"**
3. **Select "URL prefix"**
4. **Enter**: `https://inneranimalmedia.com`
5. **Click "Continue"**
6. **Choose verification method**: 
   - **Option A (Recommended)**: Select **"HTML tag"** method
   - **Option B**: Select **"DNS record"** method
7. **Copy the verification code**:
   - **HTML tag method**: Copy the `content` value from the meta tag (the part after `content="` and before `"`)
   - **DNS method**: Copy the verification code shown (without the `google-site-verification=` prefix)

**Example verification code format**: `abc123xyz4567890defghi` (long alphanumeric string)

### Step 2: Add DNS Record in Cloudflare

1. **Go to Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Select domain**: `inneranimalmedia.com`
3. **Navigate to**: **DNS** → **Records** (in left sidebar)
4. **Click**: **"Add record"** button (top right)
5. **Fill in the form**:
   ```
   Type: TXT
   Name: @ (or leave blank for root domain)
   Content: google-site-verification=YOUR_VERIFICATION_CODE
   TTL: Auto (or select 3600)
   Proxy status: DNS only (gray cloud icon - NOT proxied/orange cloud)
   Comment: Google Search Console verification (optional)
   ```
6. **Click**: **"Save"**
7. **Wait**: 5-10 minutes for DNS propagation (Cloudflare is usually fast)

### Step 3: Verify in Google Search Console

1. **Go back to Google Search Console**: https://search.google.com/search-console
2. **On the verification page, click "Verify"**
3. **Wait a few seconds** - Google checks the DNS record
4. **Success!**: You'll see "Ownership verified" ✅

### Step 4: Re-request Branding Verification

After domain verification is successful:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials/consent
2. **Scroll to "Branding verification issues"**
3. **Click "I have fixed the issues"**
4. **Click "Proceed"**
5. **Google will re-verify**:
   - ✅ Domain ownership (should now pass)
   - ✅ Privacy policy link (should already pass)

---

## 🔧 Alternative Method: Using API Script

If you have Cloudflare API token and want to automate:

### Step 1: Get Verification Code
(Same as Quick Method Step 1)

### Step 2: Use the Script

```bash
# Set your Cloudflare API token (with DNS edit permissions)
export CLOUDFLARE_API_TOKEN="your-token-here"

# Run the script with your verification code
./add-dns-verification.sh YOUR_VERIFICATION_CODE
```

**To get Cloudflare API Token**:
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit zone DNS" template
4. Select zone: `inneranimalmedia.com`
5. Set permissions: `Zone.DNS.Edit`
6. Copy the token

---

## 🧪 Verify DNS Record is Active

After adding the DNS record, wait 5-10 minutes, then test:

```bash
# Test DNS record
dig TXT inneranimalmedia.com +short

# Should show something like:
# "google-site-verification=YOUR_VERIFICATION_CODE"

# Or using nslookup:
nslookup -type=TXT inneranimalmedia.com
```

**Check via Cloudflare Dashboard**:
- Go to DNS → Records
- Look for TXT record with `google-site-verification=...`
- Status should show as active

---

## ⚠️ Troubleshooting

### DNS Record Not Showing After 10 Minutes

**Check**:
1. DNS record exists in Cloudflare Dashboard
2. Record is not proxied (gray cloud, not orange)
3. Record type is `TXT` (not `A` or `CNAME`)
4. Name is `@` or blank (root domain), not a subdomain

**Try**:
- Clear DNS cache: `sudo dscacheutil -flushcache` (macOS) or restart browser
- Use different DNS server: `dig @8.8.8.8 TXT inneranimalmedia.com +short`
- Wait longer (sometimes takes 15-30 minutes)

### Verification Fails in Google Search Console

**Common Issues**:
1. **Wrong verification code**: Double-check it matches exactly (case-sensitive)
2. **DNS not propagated**: Wait 15-30 minutes and try again
3. **Record at wrong location**: Must be at root domain (`@`), not subdomain
4. **Multiple records**: Delete old verification records if you've tried before

**Solution**:
- Verify record exists: `dig TXT inneranimalmedia.com +short | grep google-site-verification`
- Make sure only ONE verification record exists
- Wait 30 minutes and retry verification in Google Search Console

---

## 📋 DNS Record Details Summary

```
Type: TXT
Name: @ (root domain)
Content: google-site-verification=YOUR_VERIFICATION_CODE
TTL: 3600 (or Auto)
Proxy: DNS only (gray cloud)
```

---

## ✅ Checklist

- [ ] Got verification code from Google Search Console
- [ ] Added TXT DNS record in Cloudflare Dashboard
- [ ] Verified DNS record is active (using `dig` command)
- [ ] Verified domain in Google Search Console
- [ ] Re-requested branding verification in Google Cloud Console
- [ ] Branding verification status shows as verified/pending

---

**Quick Links**:
- **Google Search Console**: https://search.google.com/search-console
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials/consent

---

**Status**: ⏳ Waiting for verification code and DNS update  
**Time Required**: ~5 minutes (DNS propagation: 5-10 minutes)  
**Next Step**: Get verification code from Google Search Console, then add DNS record
