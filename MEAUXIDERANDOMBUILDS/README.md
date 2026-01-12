# InnerAnimalMedia Platform

Unified SaaS platform for deploying, hosting, and managing cloud services. Integrates Cloudflare, Google Cloud, Supabase, GitHub, and more. Multi-tenant, OAuth-enabled, with workflows and comprehensive integrations.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for local development)
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account with D1, R2, Workers, and Hyperdrive configured

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/SamPrimeaux/InnerAnimalMedia-Platform.git
   cd InnerAnimalMedia-Platform
   ```

2. **Set up secrets** (via Cloudflare Workers secrets)
   ```bash
   wrangler secret put GITHUB_OAUTH_CLIENT_ID
   wrangler secret put GITHUB_OAUTH_CLIENT_SECRET
   wrangler secret put GOOGLE_OAUTH_CLIENT_ID
   wrangler secret put GOOGLE_OAUTH_CLIENT_SECRET
   # ... see .env.example for full list
   ```

3. **Deploy**
   ```bash
   wrangler deploy --env production
   ```

## 📁 Project Structure

```
├── src/
│   └── worker.js          # Main Cloudflare Worker (API)
├── dashboard/             # Dashboard HTML pages
├── shared/                # Shared CSS, JS, and components
├── wrangler.toml          # Cloudflare Workers configuration
└── .env.example           # Environment variables template
```

## 🔐 Security

- **Secrets**: All secrets are stored in Cloudflare Workers secrets, NOT in code
- **`.gitignore`**: Protects against accidental secret commits
- **No hardcoded credentials**: All API keys use `env.SECRET_NAME` pattern

## 🛠️ Features

- **Multi-tenant SaaS**: Complete tenant isolation
- **OAuth Integration**: GitHub, Google, and more
- **Unified Integrations**: Cloudflare, Supabase, Cursor API, etc.
- **Workflows & Commands**: Automated development workflows
- **Theme System**: 50+ premium themes with project-specific customization
- **Dashboard**: Comprehensive admin and user dashboards

## 📚 Documentation

- [Integration Setup Guide](./INTEGRATIONS_UI_COMPLETE.md)
- [GitHub OAuth Setup](./GITHUB_OAUTH_READY.md)
- [Commands System](./COMMANDS_SYSTEM_FUNCTIONAL.md)
- [Workflows System](./WORKFLOWS_SYSTEM_FUNCTIONAL.md)
- [Platform Status & Roadmap](./PLATFORM_STATUS_FORTUNE500_ROADMAP.md)

## 🔗 Links

- **Production**: https://inneranimalmedia.com
- **Dev Worker**: https://inneranimalmedia-dev.meauxbility.workers.dev
- **Dashboard**: https://inneranimalmedia.com/dashboard

## 📝 License

Private repository - All rights reserved

## 👤 Author

**SamPrimeaux** - InnerAnimalMedia

---

**Built with Cloudflare Workers, D1, R2, and Hyperdrive** 🚀
