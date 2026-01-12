# 🚀 Shinshu Solutions - Quick Start Guide

## 📦 Backup & Restore Commands

### Backup to R2 (Cloud Storage)
```bash
./backup-to-r2.sh
```

This will:
- Create a compressed backup of the entire project
- Upload it to R2 cloud storage
- Keep the last 3 local backups
- Exclude unnecessary files (node_modules, .wrangler, etc.)

### Restore from R2
```bash
# List available backups
./restore-from-r2.sh

# Restore a specific backup
./restore-from-r2.sh shinshu-solutions-backup-20260112_143022.tar.gz
```

## 🛠️ Development Setup

### Prerequisites
- Node.js installed
- Wrangler CLI installed (`npm install -g wrangler`)
- Cloudflare account configured

### Initial Setup
```bash
# Install dependencies (if any)
npm install

# Authenticate with Cloudflare
wrangler login

# Deploy to production
wrangler deploy --env production
```

### Common Commands

#### Deploy Worker
```bash
wrangler deploy --env production
```

#### Upload Static Files to R2
```bash
# Upload dashboard
wrangler r2 object put shinshu-solutions/dashboard-cms.html \
  --file=static/dashboard-cms.html --remote

# Upload index page
wrangler r2 object put shinshu-solutions/index.html \
  --file=static/index.html --remote

# Upload gallery
wrangler r2 object put shinshu-solutions/gallery.html \
  --file=static/gallery.html --remote
```

#### Run Database Migrations
```bash
# Run a migration
wrangler d1 execute shinshu-solutions \
  --file=src/migration-name.sql --remote
```

#### View Logs
```bash
wrangler tail --env production
```

## 🔐 Environment Variables

### Required Secrets (set via `wrangler secret put`)
- `RESEND_API_KEY` - Resend email API key
- `RESEND_FROM_EMAIL` - Verified email address for sending
- `RESEND_ADMIN_EMAIL` - Admin email for notifications

### Set a Secret
```bash
echo "your-secret-value" | wrangler secret put SECRET_NAME --env production
```

## 📁 Project Structure

```
shinshu-solutions/
├── src/
│   ├── worker.js              # Main Cloudflare Worker
│   └── *.sql                  # Database migrations
├── static/
│   ├── index.html             # Main website
│   ├── dashboard-cms.html     # Dashboard
│   ├── gallery.html           # Gallery page
│   └── *.html                 # Other pages
├── backups/                    # Local backup storage
├── backup-to-r2.sh            # Backup script
├── restore-from-r2.sh         # Restore script
└── wrangler.toml              # Cloudflare config
```

## 🌐 Live URLs

- **Website**: https://shinshu-solutions.meauxbility.workers.dev
- **Dashboard**: https://shinshu-solutions.meauxbility.workers.dev/dashboard
- **Login**: https://shinshu-solutions.meauxbility.workers.dev/login

## 🔄 Backup Strategy

1. **Before major changes**: Run `./backup-to-r2.sh`
2. **After deployment**: Backup is automatically created
3. **Restore if needed**: Use `./restore-from-r2.sh [filename]`

## 📞 Support

For issues or questions:
- Check dashboard logs: `wrangler tail --env production`
- Review R2 backups: `wrangler r2 object list shinshu-solutions --prefix=backups/ --remote`
- Contact: inneranimalclothing@gmail.com

---

**Last Updated**: January 2026
