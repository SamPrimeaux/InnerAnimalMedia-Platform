-- Onboarding Engine - Database Schema
-- Shopify-like onboarding system with multi-tenant support
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-onboarding-engine.sql --remote

-- ============================================
-- ONBOARDING STATE (Shopify-like wizard state)
-- ============================================

CREATE TABLE IF NOT EXISTS onboarding_state (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  step_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  meta_json TEXT, -- JSON metadata for step (answers, choices, etc.)
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_onboarding_state_tenant ON onboarding_state(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_state_step ON onboarding_state(tenant_id, step_key);

-- ============================================
-- TENANT MODULES (Enabled modules per tenant)
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_modules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  module_key TEXT NOT NULL, -- 'meauxwork', 'meauxmail', 'meauxmcp', 'meauxcloud', 'analytics', 'media', 'billing'
  enabled INTEGER DEFAULT 1,
  config_json TEXT, -- Module-specific config (JSON)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, module_key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON tenant_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_enabled ON tenant_modules(tenant_id, enabled);

-- ============================================
-- TENANT THEME (Brand presets + custom tokens)
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_theme (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  preset_name TEXT NOT NULL, -- 'inneranimal-media', 'meauxcloud', 'meauxbility', 'meauxos-core'
  tokens_json TEXT NOT NULL, -- CSS variables as JSON (color-primary, bg-primary, etc.)
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
-- TENANT PRESETS (Default module configs per brand)
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_presets (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- 'inneranimal-media', 'meauxcloud', 'meauxbility', 'meauxos-core'
  display_name TEXT NOT NULL,
  description TEXT,
  default_modules_json TEXT NOT NULL, -- JSON array of module keys enabled by default
  theme_tokens_json TEXT NOT NULL, -- Default theme tokens (CSS variables)
  nav_priority_json TEXT, -- Navigation priority order (JSON array)
  dashboard_cards_json TEXT, -- Dashboard card order (JSON array)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Insert default presets
INSERT OR IGNORE INTO tenant_presets (id, name, display_name, description, default_modules_json, theme_tokens_json, nav_priority_json, dashboard_cards_json, created_at, updated_at) VALUES
('preset-inneranimal-media', 'inneranimal-media', 'InnerAnimal Media', 'Media OS for creative teams', 
 '["meauxwork", "meauxmail", "meauxmcp", "media"]',
 '{"primary": "#ff6b00", "secondary": "#dc2626", "accent": "#10b981"}',
 '["projects", "media", "workflows", "calendar"]',
 '["activation_checklist", "recent_projects", "media_library", "workflow_status"]',
 strftime('%s', 'now'), strftime('%s', 'now')),

('preset-meauxcloud', 'meauxcloud', 'MeauxCloud', 'Cloud infrastructure platform',
 '["meauxcloud", "deployments", "workers", "analytics"]',
 '{"primary": "#0066ff", "secondary": "#00e5a0", "accent": "#9333ea"}',
 '["deployments", "workers", "r2", "logs"]',
 '["activation_checklist", "deployments_status", "workers_status", "storage_usage"]',
 strftime('%s', 'now'), strftime('%s', 'now')),

('preset-meauxbility', 'meauxbility', 'Meauxbility', 'Foundation OS for nonprofits',
 '["meauxwork", "meauxmail", "donations", "volunteers"]',
 '{"primary": "#9333ea", "secondary": "#ec4899", "accent": "#10b981"}',
 '["donations", "impact", "volunteers", "projects"]',
 '["activation_checklist", "donation_summary", "volunteer_signups", "impact_metrics"]',
 strftime('%s', 'now'), strftime('%s', 'now')),

('preset-meauxos-core', 'meauxos-core', 'MeauxOS Core', 'Core platform administration',
 '["tenants", "billing", "audit", "system"]',
 '{"primary": "#6b7280", "secondary": "#475569", "accent": "#0ea5e9"}',
 '["tenants", "billing", "audit", "system"]',
 '["tenant_overview", "revenue_summary", "system_health", "audit_logs"]',
 strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- ACTIVATION CHECKLIST (Shopify-like setup tasks)
-- ============================================

CREATE TABLE IF NOT EXISTS activation_checks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  check_key TEXT NOT NULL, -- 'connect_domain', 'upload_brand', 'invite_team', 'enable_modules', 'create_project', 'connect_r2', 'configure_email', 'setup_billing'
  title TEXT NOT NULL,
  description TEXT,
  route TEXT, -- Route to complete this check (e.g., '/dashboard/settings/domains')
  required INTEGER DEFAULT 0, -- 0 = optional, 1 = required
  completed INTEGER DEFAULT 0, -- 0 = not completed, 1 = completed
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, check_key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activation_checks_tenant ON activation_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activation_checks_completed ON activation_checks(tenant_id, completed);
