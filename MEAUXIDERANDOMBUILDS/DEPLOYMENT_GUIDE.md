# Deployment Guide - iAccess Platform

## 🚀 Deployment Options

Your iAccess platform can be deployed to multiple platforms. Here are the recommended options:

## Option 1: Cloudflare Pages (Recommended)

### Why Cloudflare Pages?
- ✅ Free tier with generous limits
- ✅ Global CDN (200+ locations)
- ✅ Automatic HTTPS
- ✅ Zero-config deployments
- ✅ Integrates with Cloudflare Workers (for API)
- ✅ Fast edge deployment

### Deployment Steps

#### 1. Install Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

#### 2. Deploy Static Site to Cloudflare Pages

**Via Wrangler:**
```bash
# From project root
wrangler pages deploy . --project-name=iaccess-platform
```

**Via Cloudflare Dashboard:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages**
3. Click **Create a project**
4. Connect your Git repository OR upload files directly
5. Set build settings:
   - **Build command**: (leave empty - static site)
   - **Build output directory**: `.` (root)
6. Click **Save and Deploy**

#### 3. Configure Custom Domain
- Go to your Pages project
- Click **Custom domains**
- Add your domain (e.g., `iaccess.meauxbility.workers.dev`)
- Update DNS records as instructed

#### 4. Environment Variables
Set in Cloudflare Pages dashboard:
- `API_URL`: `https://api.iaccess.meauxbility.workers.dev`
- `ENVIRONMENT`: `production`

### URLs After Deployment
- **Production**: `https://iaccess.pages.dev` or your custom domain
- **Preview**: Auto-generated for each PR

---

## Option 2: Vercel

### Why Vercel?
- ✅ Excellent developer experience
- ✅ Automatic deployments from Git
- ✅ Edge functions support
- ✅ Great for static sites
- ✅ Free tier available

### Deployment Steps

#### 1. Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

#### 2. Deploy
```bash
# From project root
vercel

# For production
vercel --prod
```

#### 3. Connect Git Repository (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com)
2. Click **Add New Project**
3. Import your Git repository
4. Vercel will auto-detect settings from `vercel.json`
5. Click **Deploy**

### URLs After Deployment
- **Production**: `https://iaccess-platform.vercel.app`
- **Preview**: Auto-generated for each PR

---

## Option 3: Cloudflare Workers (API Only)

### Deploy API to Cloudflare Workers

#### 1. Create Worker Structure
```bash
mkdir -p src
# Create src/worker.js with your API code
```

#### 2. Configure Wrangler
Edit `wrangler.toml` with your settings:
- Database IDs
- KV namespace IDs
- R2 bucket names

#### 3. Deploy Worker
```bash
# Deploy to production
wrangler deploy

# Deploy to staging
wrangler deploy --env staging
```

#### 4. Set Secrets
```bash
wrangler secret put JWT_SECRET
wrangler secret put VERCEL_API_TOKEN
wrangler secret put CLOUDFLARE_API_TOKEN
```

### API Endpoints
After deployment, your API will be available at:
- **Production**: `https://iaccess-api.meauxbility.workers.dev`
- **Staging**: `https://iaccess-api-staging.meauxbility.workers.dev`

---

## Option 4: Hybrid Deployment (Recommended for Production)

### Architecture
- **Static Site**: Cloudflare Pages or Vercel
- **API**: Cloudflare Workers
- **Database**: Cloudflare D1
- **Storage**: Cloudflare R2
- **Cache**: Cloudflare KV

### Setup Steps

1. **Deploy Static Site** (Cloudflare Pages or Vercel)
   ```bash
   # Cloudflare Pages
   wrangler pages deploy . --project-name=iaccess-platform
   
   # OR Vercel
   vercel --prod
   ```

2. **Deploy API Worker**
   ```bash
   wrangler deploy
   ```

3. **Update API URLs in Frontend**
   - Update `API_BASE` in HTML files to point to your Worker URL
   - Or use environment variables

4. **Configure CORS**
   In your Worker, add CORS headers:
   ```javascript
   const corsHeaders = {
     'Access-Control-Allow-Origin': 'https://your-domain.com',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
   };
   ```

---

## Quick Deploy Commands

### Cloudflare Pages
```bash
# One-time setup
wrangler login
wrangler pages project create iaccess-platform

# Deploy
wrangler pages deploy . --project-name=iaccess-platform
```

### Vercel
```bash
# One-time setup
vercel login

# Deploy
vercel --prod
```

### Cloudflare Workers (API)
```bash
# Setup
wrangler login
wrangler d1 create iaccess-db
wrangler kv:namespace create CACHE
wrangler r2 bucket create iaccess-storage

# Update wrangler.toml with IDs from above

# Deploy
wrangler deploy
```

---

## Environment Variables

### Frontend (Pages/Vercel)
- `API_URL`: Your Cloudflare Worker API URL
- `ENVIRONMENT`: `production` or `staging`

### Backend (Workers)
- `JWT_SECRET`: Secret for JWT token signing
- `VERCEL_API_TOKEN`: For Vercel API integration
- `CLOUDFLARE_API_TOKEN`: For Cloudflare API calls
- `ENVIRONMENT`: `production` or `staging`

---

## Custom Domains

### Cloudflare Pages
1. Go to Pages project → **Custom domains**
2. Add domain: `iaccess.yourdomain.com`
3. Update DNS:
   - Type: `CNAME`
   - Name: `iaccess`
   - Target: `your-project.pages.dev`

### Vercel
1. Go to Project → **Settings** → **Domains**
2. Add domain: `iaccess.yourdomain.com`
3. Update DNS as instructed

---

## Continuous Deployment

### GitHub Actions (Cloudflare Pages)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: iaccess-platform
          directory: .
```

### Vercel Auto-Deploy
- Connect Git repository in Vercel dashboard
- Auto-deploys on every push to main branch
- Preview deployments for PRs

---

## Monitoring & Analytics

### Cloudflare Analytics
- Built into Cloudflare Pages
- View in dashboard → **Analytics**

### Vercel Analytics
- Enable in project settings
- View in dashboard → **Analytics**

---

## Troubleshooting

### Pages Not Loading
- Check file paths (case-sensitive)
- Verify `index.html` exists
- Check browser console for errors

### API Not Working
- Verify Worker is deployed
- Check CORS headers
- Verify API URL in frontend matches Worker URL
- Check Worker logs in Cloudflare dashboard

### Build Failures
- Check build logs in dashboard
- Verify all files are committed
- Check for syntax errors

---

## Current Deployment Status

Based on your code:
- **API Endpoint**: `https://iaccess-api.meauxbility.workers.dev`
- **Static Site**: Not yet deployed (ready for deployment)
- **Database**: Cloudflare D1 (needs setup)
- **Storage**: Cloudflare R2 (needs setup)

---

## Next Steps

1. ✅ Choose deployment platform (Cloudflare Pages recommended)
2. ⏳ Deploy static site
3. ⏳ Deploy API Worker
4. ⏳ Set up D1 database
5. ⏳ Configure KV namespaces
6. ⏳ Set up R2 buckets
7. ⏳ Configure custom domain
8. ⏳ Set up CI/CD
9. ⏳ Configure monitoring

---

## Support

- **Cloudflare Docs**: https://developers.cloudflare.com/pages
- **Vercel Docs**: https://vercel.com/docs
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler
