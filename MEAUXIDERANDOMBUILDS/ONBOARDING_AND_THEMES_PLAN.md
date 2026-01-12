# 🎨 Onboarding & Themes System - Implementation Plan

## ✅ Phase 1: COMPLETE (URLs & Projects Page)

### 1. ✅ Clean URLs (No .html extensions)
- **Worker Routing Updated**: `/dashboard/projects` → `static/dashboard/projects.html`
- **URL Structure**: 
  - `/dashboard/projects` (not `/dashboard/projects.html`)
  - `/dashboard/workflows` (not `/dashboard/workflows.html`)
  - `/dashboard/settings` (not `/dashboard/settings.html`)
- **Status**: ✅ **COMPLETE** - Worker updated to handle clean URLs

### 2. ✅ Projects Page - Real Data
- **API Integration**: Now uses `/api/projects` endpoint (was using deployments)
- **Real Data Display**: Shows actual projects from D1 database
- **Stats Cards**: 
  - Total Projects (from projects table)
  - Total Deployments (from deployments table)
  - Active Projects (filtered by status)
- **Project Cards**: Beautiful cards showing:
  - Project name, framework, description
  - Status badges (Active, Building, Paused)
  - Repository link
  - Created date
- **Search Functionality**: Search by name, framework, description, slug
- **Status**: ✅ **COMPLETE** - Projects page shows real data

---

## 🔄 Phase 2: IN PROGRESS (Theme System)

### 3. 🚧 Theme System with CSS Variables
**Status**: IN PROGRESS

**Structure**:
```
shared/
├── themes/
│   ├── base.css (CSS variables for all themes)
│   ├── inneranimal-media.css (InnerAnimal Media preset)
│   ├── meauxcloud.css (MeauxCloud preset)
│   ├── meauxbility.css (Meauxbility preset)
│   └── meauxos-core.css (MeauxOS Core preset)
```

**CSS Variables Schema**:
```css
:root {
  /* Colors */
  --color-primary: #ff6b00;
  --color-secondary: #dc2626;
  --color-accent: #10b981;
  
  /* Backgrounds */
  --bg-primary: #050507;
  --bg-panel: #0a0a0f;
  --bg-surface: #171717;
  
  /* Text */
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;
  
  /* Borders */
  --border-primary: rgba(255, 255, 255, 0.1);
  --border-secondary: rgba(255, 255, 255, 0.05);
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Border Radius */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-panel: #f8f9fa;
  --bg-surface: #ffffff;
  --text-primary: #202124;
  --text-secondary: #5f6368;
  --text-tertiary: #80868b;
  --border-primary: rgba(0, 0, 0, 0.1);
  --border-secondary: rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] {
  --bg-primary: #050507;
  --bg-panel: #0a0a0f;
  --bg-surface: #171717;
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;
  --border-primary: rgba(255, 255, 255, 0.1);
  --border-secondary: rgba(255, 255, 255, 0.05);
}
```

**Brand Presets**:
- **InnerAnimal Media**: Orange (#ff6b00) + Red (#dc2626)
- **MeauxCloud**: Blue (#0066ff) + Teal (#00e5a0)
- **Meauxbility**: Purple (#9333ea) + Pink (#ec4899)
- **MeauxOS Core**: Gray (#6b7280) + Slate (#475569)

---

## 🎯 Phase 3: PLANNED (Sitewide Header/Footer)

### 4. 🚧 Sitewide Header/Footer with Dual Theme
**Status**: PLANNED

**Requirements**:
- Dual theme support (light/dark) with system preference detection
- GLB model support for branding (optional)
- Consistent across all pages
- Theme toggle in header
- Brand switcher (for multi-tenant)
- Search bar (global)
- User menu
- Notifications

**Implementation**:
```
shared/
├── header.html (sitewide header component)
├── footer.html (sitewide footer component)
└── header.js (header logic: theme toggle, search, etc.)
```

---

## 🚀 Phase 4: PLANNED (Onboarding Engine)

### 5. 🚧 Onboarding Engine Structure
**Status**: PLANNED

**Database Tables** (D1):
```sql
-- Tenant onboarding state
CREATE TABLE IF NOT EXISTS onboarding_state (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  step_key TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed', 'skipped'
  meta_json TEXT, -- JSON metadata for step
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Tenant modules (enabled modules per tenant)
CREATE TABLE IF NOT EXISTS tenant_modules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  module_key TEXT NOT NULL, -- 'meauxwork', 'meauxmail', 'meauxmcp', etc.
  enabled INTEGER DEFAULT 1,
  config_json TEXT, -- Module-specific config
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, module_key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Tenant theme tokens
CREATE TABLE IF NOT EXISTS tenant_theme (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  preset_name TEXT NOT NULL, -- 'inneranimal-media', 'meauxcloud', 'meauxbility', 'meauxos-core'
  tokens_json TEXT NOT NULL, -- CSS variables as JSON
  logo_url TEXT,
  favicon_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

**Onboarding Steps Definition** (in code/config):
```javascript
const ONBOARDING_STEPS = [
  {
    key: 'auth',
    title: 'Sign Up / Sign In',
    route: '/onboarding/auth',
    requirements: ['user_id'],
    next: 'create_tenant'
  },
  {
    key: 'create_tenant',
    title: 'Create or Join Workspace',
    route: '/onboarding/workspace',
    requirements: ['tenant_id'],
    next: (meta) => meta.workspace_type === 'existing' ? 'join_team' : 'choose_preset'
  },
  {
    key: 'choose_preset',
    title: 'Choose Platform Type',
    route: '/onboarding/preset',
    requirements: ['tenant_preset'],
    presets: ['inneranimal-media', 'meauxcloud', 'meauxbility', 'meauxos-core'],
    next: 'choose_modules'
  },
  {
    key: 'choose_modules',
    title: 'Enable Your Tools',
    route: '/onboarding/modules',
    requirements: ['tenant_modules'],
    modules: ['meauxwork', 'meauxmail', 'meauxmcp', 'meauxcloud', 'analytics', 'media', 'billing'],
    next: 'brand_setup'
  },
  {
    key: 'brand_setup',
    title: 'Brand & UI Setup',
    route: '/onboarding/brand',
    requirements: ['tenant_theme'],
    next: 'domain_setup'
  },
  {
    key: 'domain_setup',
    title: 'Domain & Environment',
    route: '/onboarding/domain',
    requirements: ['domain_config'],
    next: 'invite_team'
  },
  {
    key: 'invite_team',
    title: 'Invite Team Members',
    route: '/onboarding/team',
    requirements: ['team_invites'],
    optional: true,
    next: 'finish'
  },
  {
    key: 'finish',
    title: 'Welcome to MeauxOS!',
    route: '/dashboard',
    requirements: ['onboarding_complete'],
    next: null
  }
];
```

**Onboarding Wizard UI** (Shopify-like):
- Modal-based wizard (not full page)
- Step indicator (progress bar)
- Minimal choices per screen
- "Skip for now" option (where applicable)
- "Back" and "Continue" buttons
- Beautiful animations

---

## 📋 Phase 5: PLANNED (Dashboard Home with Activation Checklist)

### 6. 🚧 Dashboard Home - Activation Checklist
**Status**: PLANNED

**Activation Checklist Cards**:
```javascript
const ACTIVATION_CHECKS = [
  {
    id: 'connect_domain',
    title: 'Connect Domain',
    description: 'Set up your custom domain',
    route: '/dashboard/settings/domains',
    required: false,
    completed: false
  },
  {
    id: 'upload_brand',
    title: 'Upload Brand Assets',
    description: 'Add your logo, favicon, and OG image',
    route: '/dashboard/settings/brand',
    required: false,
    completed: false
  },
  {
    id: 'invite_team',
    title: 'Invite Team Members',
    description: 'Add collaborators to your workspace',
    route: '/dashboard/team',
    required: false,
    completed: false
  },
  {
    id: 'enable_modules',
    title: 'Enable Modules',
    description: 'Activate tools you want to use',
    route: '/dashboard/modules',
    required: true,
    completed: false
  },
  {
    id: 'create_project',
    title: 'Create First Project',
    description: 'Set up your first MeauxWork project',
    route: '/dashboard/projects/new',
    required: true,
    completed: false
  },
  {
    id: 'connect_r2',
    title: 'Connect R2 Bucket',
    description: 'Set up storage for your assets',
    route: '/dashboard/storage',
    required: false,
    completed: false
  },
  {
    id: 'configure_email',
    title: 'Configure Email',
    description: 'Set up Resend for email sending',
    route: '/dashboard/settings/email',
    required: false,
    completed: false
  },
  {
    id: 'setup_billing',
    title: 'Turn on Billing',
    description: 'Add payment method if needed',
    route: '/dashboard/billing',
    required: false,
    completed: false
  }
];
```

**Dashboard Home Layout**:
- Welcome message with tenant name
- Activation checklist (progress bar + cards)
- Quick actions (Create Project, Upload Assets, etc.)
- "Recommended next actions" section
- Recent activity feed
- Help widget (Shopify-style)

---

## 🔧 Phase 6: PLANNED (Brand Presets)

### 7. 🚧 Brand Presets Configuration
**Status**: PLANNED

**InnerAnimal Media Preset**:
```javascript
{
  name: 'inneranimal-media',
  displayName: 'InnerAnimal Media',
  description: 'Media OS for creative teams',
  defaultModules: ['meauxwork', 'meauxmail', 'meauxmcp', 'media'],
  themeTokens: {
    primary: '#ff6b00',
    secondary: '#dc2626',
    accent: '#10b981',
    navPriority: ['projects', 'media', 'workflows', 'calendar']
  },
  dashboardCards: [
    'activation_checklist',
    'recent_projects',
    'media_library',
    'workflow_status'
  ]
}
```

**MeauxCloud Preset**:
```javascript
{
  name: 'meauxcloud',
  displayName: 'MeauxCloud',
  description: 'Cloud infrastructure platform',
  defaultModules: ['meauxcloud', 'deployments', 'workers', 'analytics'],
  themeTokens: {
    primary: '#0066ff',
    secondary: '#00e5a0',
    accent: '#9333ea',
    navPriority: ['deployments', 'workers', 'r2', 'logs']
  },
  dashboardCards: [
    'activation_checklist',
    'deployments_status',
    'workers_status',
    'storage_usage'
  ]
}
```

**Meauxbility Preset**:
```javascript
{
  name: 'meauxbility',
  displayName: 'Meauxbility',
  description: 'Foundation OS for nonprofits',
  defaultModules: ['meauxwork', 'meauxmail', 'donations', 'volunteers'],
  themeTokens: {
    primary: '#9333ea',
    secondary: '#ec4899',
    accent: '#10b981',
    navPriority: ['donations', 'impact', 'volunteers', 'projects']
  },
  dashboardCards: [
    'activation_checklist',
    'donation_summary',
    'volunteer_signups',
    'impact_metrics'
  ]
}
```

**MeauxOS Core Preset** (Admin):
```javascript
{
  name: 'meauxos-core',
  displayName: 'MeauxOS Core',
  description: 'Core platform administration',
  defaultModules: ['tenants', 'billing', 'audit', 'system'],
  themeTokens: {
    primary: '#6b7280',
    secondary: '#475569',
    accent: '#0ea5e9',
    navPriority: ['tenants', 'billing', 'audit', 'system']
  },
  dashboardCards: [
    'tenant_overview',
    'revenue_summary',
    'system_health',
    'audit_logs'
  ]
}
```

---

## 📊 Implementation Status Summary

| Phase | Component | Status | Priority |
|-------|-----------|--------|----------|
| 1 | Clean URLs | ✅ COMPLETE | High |
| 1 | Projects Page - Real Data | ✅ COMPLETE | High |
| 2 | Theme System (CSS Variables) | 🚧 IN PROGRESS | High |
| 3 | Sitewide Header/Footer | 🚧 PLANNED | High |
| 4 | Onboarding Engine (DB) | 🚧 PLANNED | Medium |
| 4 | Onboarding Wizard UI | 🚧 PLANNED | Medium |
| 5 | Dashboard Home Checklist | 🚧 PLANNED | Medium |
| 6 | Brand Presets | 🚧 PLANNED | Low |

---

## 🚀 Next Steps (Priority Order)

1. **Complete Theme System** - Create CSS variables file and theme presets
2. **Build Sitewide Header/Footer** - Dual theme support with toggle
3. **Create Onboarding DB Tables** - Run migrations for onboarding_state, tenant_modules, tenant_theme
4. **Build Onboarding Wizard UI** - Step-by-step modal wizard
5. **Build Dashboard Home** - Activation checklist + quick actions
6. **Implement Brand Presets** - Configure all 4 presets
7. **Multi-tenant Routing** - Subdomain → tenant resolution

---

## 📝 Notes

- **URL Structure**: All dashboard pages now use clean URLs (no .html)
- **API Endpoints**: Using relative paths (`window.location.origin`) for better portability
- **Theme System**: CSS variables allow for easy theme switching and brand customization
- **Onboarding**: State-driven wizard allows for branching logic based on tenant type
- **Brand Presets**: Configuration-driven, making it easy to add new brands without code changes
