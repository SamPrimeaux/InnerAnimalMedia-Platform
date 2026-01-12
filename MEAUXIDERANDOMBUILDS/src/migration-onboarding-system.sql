-- Onboarding System - Database Schema
-- Shopify-like onboarding engine for multi-tenant platform
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-onboarding-system.sql --remote

-- ============================================
-- ONBOARDING STATE (Step-by-step progress tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS onboarding_state (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  step_key TEXT NOT NULL, -- 'auth', 'create_tenant', 'choose_preset', 'choose_modules', 'brand_setup', 'domain_setup', 'invite_team', 'finish'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  meta_json TEXT, -- JSON metadata for step (e.g., selected preset, modules, etc.)
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, step_key)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_state_tenant ON onboarding_state(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_state_step ON onboarding_state(step_key, status);

-- ============================================
-- TENANT MODULES (Enabled modules per tenant)
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_modules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  module_key TEXT NOT NULL, -- 'meauxwork', 'meauxmail', 'meauxmcp', 'meauxcloud', 'analytics', 'media', 'billing', etc.
  enabled INTEGER DEFAULT 1, -- 0 = disabled, 1 = enabled
  config_json TEXT, -- Module-specific configuration as JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON tenant_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_enabled ON tenant_modules(tenant_id, enabled) WHERE enabled = 1;

-- ============================================
-- TENANT THEME (Branding and UI customization)
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_theme (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  preset_name TEXT NOT NULL, -- 'inneranimal-media', 'meauxcloud', 'meauxbility', 'meauxos-core'
  tokens_json TEXT NOT NULL, -- CSS variables as JSON (theme tokens)
  logo_url TEXT,
  favicon_url TEXT,
  og_image_url TEXT,
  theme_mode TEXT DEFAULT 'dark', -- 'light', 'dark', 'system'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_theme_preset ON tenant_theme(preset_name);

-- ============================================
-- ONBOARDING STEP DEFINITIONS (Reference data)
-- ============================================

CREATE TABLE IF NOT EXISTS onboarding_steps (
  step_key TEXT PRIMARY KEY, -- 'auth', 'create_tenant', 'choose_preset', etc.
  title TEXT NOT NULL,
  description TEXT,
  route TEXT NOT NULL, -- '/onboarding/auth', '/onboarding/workspace', etc.
  order_index INTEGER NOT NULL, -- Order in which steps appear
  required INTEGER DEFAULT 1, -- 0 = optional, 1 = required
  requirements_json TEXT, -- JSON array of requirements (e.g., ['user_id', 'tenant_id'])
  next_step_key TEXT, -- Next step key (can be conditional based on meta_json)
  conditional_next_json TEXT, -- JSON mapping for conditional branching (e.g., {"existing": "join_team", "new": "choose_preset"})
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Insert onboarding step definitions
INSERT OR REPLACE INTO onboarding_steps (step_key, title, description, route, order_index, required, requirements_json, next_step_key, conditional_next_json, created_at, updated_at) VALUES
('auth', 'Sign Up / Sign In', 'Create your account or sign in', '/onboarding/auth', 0, 1, '["user_id"]', 'create_tenant', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
('create_tenant', 'Create or Join Workspace', 'Create a new workspace or join an existing one', '/onboarding/workspace', 1, 1, '["tenant_id"]', NULL, '{"existing": "join_team", "new": "choose_preset"}', strftime('%s', 'now'), strftime('%s', 'now')),
('choose_preset', 'Choose Platform Type', 'Select your platform preset (InnerAnimal Media, MeauxCloud, Meauxbility, MeauxOS)', '/onboarding/preset', 2, 1, '["tenant_preset"]', 'choose_modules', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
('choose_modules', 'Enable Your Tools', 'Select which modules you want to use', '/onboarding/modules', 3, 1, '["tenant_modules"]', 'brand_setup', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
('brand_setup', 'Brand & UI Setup', 'Upload your logo, choose theme mode, and customize colors', '/onboarding/brand', 4, 0, '["tenant_theme"]', 'domain_setup', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
('domain_setup', 'Domain & Environment', 'Set up your custom domain or use default subdomain', '/onboarding/domain', 5, 0, '["domain_config"]', 'invite_team', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
('invite_team', 'Invite Team Members', 'Add collaborators to your workspace', '/onboarding/team', 6, 0, '["team_invites"]', 'finish', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
('finish', 'Welcome to MeauxOS!', 'Onboarding complete - welcome to your dashboard', '/dashboard', 7, 1, '["onboarding_complete"]', NULL, NULL, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- TENANT PRESET DEFINITIONS (Brand presets)
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_presets (
  preset_key TEXT PRIMARY KEY, -- 'inneranimal-media', 'meauxcloud', 'meauxbility', 'meauxos-core'
  display_name TEXT NOT NULL, -- 'InnerAnimal Media', 'MeauxCloud', etc.
  description TEXT,
  default_modules_json TEXT NOT NULL, -- JSON array of default enabled modules
  theme_tokens_json TEXT NOT NULL, -- Default theme tokens as JSON
  nav_priority_json TEXT, -- Navigation priority order as JSON array
  dashboard_cards_json TEXT, -- Dashboard card configuration as JSON array
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Insert brand presets
INSERT OR REPLACE INTO tenant_presets (preset_key, display_name, description, default_modules_json, theme_tokens_json, nav_priority_json, dashboard_cards_json, created_at, updated_at) VALUES
('inneranimal-media', 'InnerAnimal Media', 'Media OS for creative teams', '["meauxwork", "meauxmail", "meauxmcp", "media"]', '{"primary": "#ff6b00", "secondary": "#dc2626", "accent": "#10b981"}', '["projects", "media", "workflows", "calendar"]', '["activation_checklist", "recent_projects", "media_library", "workflow_status"]', strftime('%s', 'now'), strftime('%s', 'now')),
('meauxcloud', 'MeauxCloud', 'Cloud infrastructure platform', '["meauxcloud", "deployments", "workers", "analytics"]', '{"primary": "#0066ff", "secondary": "#00e5a0", "accent": "#9333ea"}', '["deployments", "workers", "r2", "logs"]', '["activation_checklist", "deployments_status", "workers_status", "storage_usage"]', strftime('%s', 'now'), strftime('%s', 'now')),
('meauxbility', 'Meauxbility', 'Foundation OS for nonprofits', '["meauxwork", "meauxmail", "donations", "volunteers"]', '{"primary": "#9333ea", "secondary": "#ec4899", "accent": "#10b981"}', '["donations", "impact", "volunteers", "projects"]', '["activation_checklist", "donation_summary", "volunteer_signups", "impact_metrics"]', strftime('%s', 'now'), strftime('%s', 'now')),
('meauxos-core', 'MeauxOS Core', 'Core platform administration', '["tenants", "billing", "audit", "system"]', '{"primary": "#6b7280", "secondary": "#475569", "accent": "#0ea5e9"}', '["tenants", "billing", "audit", "system"]', '["tenant_overview", "revenue_summary", "system_health", "audit_logs"]', strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- ACTIVATION CHECKLIST (Dashboard home cards)
-- ============================================

CREATE TABLE IF NOT EXISTS activation_checks (
  check_key TEXT PRIMARY KEY, -- 'connect_domain', 'upload_brand', 'invite_team', etc.
  title TEXT NOT NULL,
  description TEXT,
  route TEXT, -- Route to complete this check
  required INTEGER DEFAULT 0, -- 0 = optional, 1 = required
  category TEXT, -- 'setup', 'billing', 'integrations', etc.
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Insert activation checklist items
INSERT OR REPLACE INTO activation_checks (check_key, title, description, route, required, category, order_index, created_at, updated_at) VALUES
('connect_domain', 'Connect Domain', 'Set up your custom domain', '/dashboard/settings/domains', 0, 'setup', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('upload_brand', 'Upload Brand Assets', 'Add your logo, favicon, and OG image', '/dashboard/settings/brand', 0, 'setup', 1, strftime('%s', 'now'), strftime('%s', 'now')),
('invite_team', 'Invite Team Members', 'Add collaborators to your workspace', '/dashboard/team', 0, 'setup', 2, strftime('%s', 'now'), strftime('%s', 'now')),
('enable_modules', 'Enable Modules', 'Activate tools you want to use', '/dashboard/modules', 1, 'setup', 3, strftime('%s', 'now'), strftime('%s', 'now')),
('create_project', 'Create First Project', 'Set up your first MeauxWork project', '/dashboard/projects/new', 1, 'setup', 4, strftime('%s', 'now'), strftime('%s', 'now')),
('connect_r2', 'Connect R2 Bucket', 'Set up storage for your assets', '/dashboard/storage', 0, 'integrations', 5, strftime('%s', 'now'), strftime('%s', 'now')),
('configure_email', 'Configure Email', 'Set up Resend for email sending', '/dashboard/settings/email', 0, 'integrations', 6, strftime('%s', 'now'), strftime('%s', 'now')),
('setup_billing', 'Turn on Billing', 'Add payment method if needed', '/dashboard/billing', 0, 'billing', 7, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- TENANT ACTIVATION STATUS (Track completion)
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_activation_status (
  tenant_id TEXT PRIMARY KEY,
  onboarding_completed INTEGER DEFAULT 0, -- 0 = in progress, 1 = completed
  onboarding_completed_at INTEGER,
  activation_checks_json TEXT, -- JSON object with check_key -> completed status
  activation_progress INTEGER DEFAULT 0, -- 0-100 percentage
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
