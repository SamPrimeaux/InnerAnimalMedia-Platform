# InnerAnimalMedia Services - Deployment Guide

## 🚀 Quick Deploy

### 1. Install Dependencies

```bash
cd inneranimalmediaservices
npm install
```

### 2. Set Required Secrets

```bash
# Resend API Key (for email functionality)
wrangler secret put RESEND_API_KEY

# Optional: Cloudflare API Token
wrangler secret put CLOUDFLARE_API_TOKEN

# Optional: Cloudflare Account ID
wrangler secret put CLOUDFLARE_ACCOUNT_ID
```

### 3. Deploy to Production

```bash
npm run deploy:production
# OR
wrangler deploy --env production
```

### 4. Deploy to Staging

```bash
npm run deploy:staging
# OR
wrangler deploy --env staging
```

## 📋 What Gets Deployed

- **Worker Name**: `inneranimalmediaservices`
- **Durable Object**: `IasSession` (SQL-backed)
- **D1 Database**: `inneranimalmedia-business` (shared)
- **R2 Storage**: `iaccess-storage` (shared)

## 🔧 Configuration

### Wrangler.toml

- **Name**: `inneranimalmediaservices`
- **Main**: `src/index.ts`
- **Compatibility Date**: `2026-01-09`
- **Durable Object**: SQL-backed storage enabled

### Durable Object Migration

The migration `v1` creates the SQL-backed Durable Object:
- **Class**: `IasSession`
- **Storage Format**: `sql`
- **Binding**: `IAS_SESSION`

## 🌐 URLs After Deployment

- **Production**: `https://inneranimalmediaservices.meauxbility.workers.dev`
- **Staging**: `https://inneranimalmediaservices-staging.meauxbility.workers.dev`

## ✅ Features Enabled

1. ✅ SQL-backed Durable Objects
2. ✅ MCP Protocol Server
3. ✅ Browser Rendering API
4. ✅ WebRTC Video Calls
5. ✅ Real-time Chat
6. ✅ Resend Email Integration

## 🧪 Test Deployment

```bash
# Test root endpoint
curl https://inneranimalmediaservices.meauxbility.workers.dev/

# Test session creation
curl -X POST https://inneranimalmediaservices.meauxbility.workers.dev/api/session/test-session \
  -H "Content-Type: application/json" \
  -d '{"type":"chat","participants":["user1"]}'
```

## 📝 Notes

- Durable Objects use SQL-backed storage for persistence
- Sessions are automatically created on first access
- All endpoints support CORS
- Resend API key is required for email functionality
