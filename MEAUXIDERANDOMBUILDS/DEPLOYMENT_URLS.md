# 🚀 Deployment URLs

## Frontend (Styled Dashboard)
**Production URL**: https://meauxos-unified-dashboard.pages.dev/dashboard.html

**Direct Links**:
- Dashboard: https://meauxos-unified-dashboard.pages.dev/dashboard.html
- Homepage: https://meauxos-unified-dashboard.pages.dev/index.html
- Workflows: https://meauxos-unified-dashboard.pages.dev/workflows.html
- Workers: https://meauxos-unified-dashboard.pages.dev/workers.html

## Backend API (JSON)
**API Base URL**: https://iaccess-api.meauxbility.workers.dev

**Endpoints**:
- Root: https://iaccess-api.meauxbility.workers.dev/
- Tenants: https://iaccess-api.meauxbility.workers.dev/api/tenants
- Workflows: https://iaccess-api.meauxbility.workers.dev/api/workflows
- Deployments: https://iaccess-api.meauxbility.workers.dev/api/deployments
- Workers: https://iaccess-api.meauxbility.workers.dev/api/workers
- Stats: https://iaccess-api.meauxbility.workers.dev/api/stats

## Architecture

```
┌─────────────────────────────────────┐
│  Cloudflare Pages                   │
│  (Static HTML/CSS/JS)               │
│  meauxos-unified-dashboard.pages.dev│
│                                     │
│  ┌───────────────────────────────┐ │
│  │  dashboard.html (Styled UI)   │ │
│  │  index.html (Homepage)         │ │
│  │  workflows.html                │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
              │
              │ API Calls
              ▼
┌─────────────────────────────────────┐
│  Cloudflare Workers                 │
│  (API Backend)                      │
│  iaccess-api.meauxbility.workers.dev│
│                                     │
│  ┌───────────────────────────────┐ │
│  │  /api/tenants                  │ │
│  │  /api/workflows                │ │
│  │  /api/deployments              │ │
│  │  /api/workers                  │ │
│  │  /api/stats                    │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Cloudflare D1                      │
│  Database: meauxos                   │
└─────────────────────────────────────┘
```

## Quick Deploy Commands

### Deploy Frontend (Pages)
```bash
wrangler pages deploy . --project-name=meauxos-unified-dashboard --commit-dirty=true
```

### Deploy Backend (Workers)
```bash
wrangler deploy --env production
```

## Notes

- **Frontend** = Your styled dashboard (HTML/CSS/JS)
- **Backend** = Your API (JSON responses)
- The dashboard automatically connects to the API via JavaScript
- Both are deployed separately but work together
