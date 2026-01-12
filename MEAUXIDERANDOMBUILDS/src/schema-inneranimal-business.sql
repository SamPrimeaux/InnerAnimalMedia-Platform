-- InnerAnimal Media Business Platform - SaaS Production Database
-- Multi-tenant platform for software builds and operations
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/schema-inneranimal-business.sql --remote

-- ============================================
-- TENANT METADATA (SaaS Organizations)
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_metadata (
  tenant_id TEXT PRIMARY KEY,
  plan_type TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  subscription_id TEXT,
  billing_email TEXT,
  limits TEXT,
  usage TEXT,
  custom_domain TEXT,
  ssl_enabled INTEGER DEFAULT 0,
  trial_ends_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- USER METADATA (SaaS User Management)
-- ============================================

CREATE TABLE IF NOT EXISTS user_metadata (
  user_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  notification_preferences TEXT,
  api_key_hash TEXT,
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,
  github_username TEXT,
  github_user_id TEXT,
  google_email TEXT,
  google_user_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- OAUTH CONFIGURATION & TOKENS
-- ============================================

CREATE TABLE IF NOT EXISTS oauth_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret_encrypted TEXT NOT NULL,
  auth_url TEXT NOT NULL,
  token_url TEXT NOT NULL,
  user_info_url TEXT NOT NULL,
  scopes TEXT NOT NULL,
  is_enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at INTEGER,
  scope TEXT,
  provider_user_id TEXT,
  provider_username TEXT,
  provider_email TEXT,
  provider_avatar_url TEXT,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, provider_id)
);

CREATE TABLE IF NOT EXISTS oauth_states (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  tenant_id TEXT,
  provider_id TEXT NOT NULL,
  redirect_uri TEXT,
  scope TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- ============================================
-- PROJECTS & REPOSITORIES (SaaS Builds)
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  repository_url TEXT,
  repository_provider TEXT,
  repository_id TEXT,
  default_branch TEXT DEFAULT 'main',
  framework TEXT,
  build_command TEXT,
  install_command TEXT,
  environment_variables TEXT,
  is_public INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS builds (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  branch TEXT NOT NULL,
  commit_hash TEXT,
  commit_message TEXT,
  commit_author TEXT,
  build_number INTEGER NOT NULL,
  status TEXT NOT NULL,
  build_log TEXT,
  build_time_ms INTEGER,
  environment TEXT DEFAULT 'production',
  deployment_url TEXT,
  deployment_id TEXT,
  triggered_by TEXT,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);

-- ============================================
-- WEBHOOKS & INTEGRATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  url TEXT NOT NULL,
  secret_encrypted TEXT,
  events TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  last_triggered_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- BILLING & SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start INTEGER,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER DEFAULT 0,
  cancelled_at INTEGER,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subscription_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  stripe_invoice_id TEXT,
  invoice_pdf_url TEXT,
  due_date INTEGER,
  paid_at INTEGER,
  created_at INTEGER NOT NULL
);

-- ============================================
-- AUDIT LOGS (Security & Compliance)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);

-- ============================================
-- API KEYS (Programmatic Access)
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT NOT NULL,
  last_used_at INTEGER,
  expires_at INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data TEXT,
  is_read INTEGER DEFAULT 0,
  read_at INTEGER,
  created_at INTEGER NOT NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id, provider_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_tenant ON oauth_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_repository ON projects(repository_provider, repository_id);

CREATE INDEX IF NOT EXISTS idx_builds_project ON builds(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_builds_tenant ON builds(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_builds_status ON builds(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhooks_project ON webhooks(project_id, is_active);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id, created_at DESC);

-- ============================================
-- INITIAL DATA: OAuth Providers
-- ============================================

INSERT OR IGNORE INTO oauth_providers (
  id, name, display_name, client_id, client_secret_encrypted, 
  auth_url, token_url, user_info_url, scopes, is_enabled, created_at, updated_at
) VALUES (
  'github',
  'GitHub',
  'GitHub',
  'PLACEHOLDER_CLIENT_ID',
  'PLACEHOLDER_CLIENT_SECRET',
  'https://github.com/login/oauth/authorize',
  'https://github.com/login/oauth/access_token',
  'https://api.github.com/user',
  '["user:email", "read:org", "repo"]',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

INSERT OR IGNORE INTO oauth_providers (
  id, name, display_name, client_id, client_secret_encrypted,
  auth_url, token_url, user_info_url, scopes, is_enabled, created_at, updated_at
) VALUES (
  'google',
  'Google',
  'Google',
  'PLACEHOLDER_CLIENT_ID',
  'PLACEHOLDER_CLIENT_SECRET',
  'https://accounts.google.com/o/oauth2/v2/auth',
  'https://oauth2.googleapis.com/token',
  'https://www.googleapis.com/oauth2/v2/userinfo',
  '["openid", "profile", "email", "https://www.googleapis.com/auth/drive.readonly"]',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
