-- InnerAnimal Media Business Platform - Fresh Database Schema
-- Complete SaaS database from scratch
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/schema-inneranimal-fresh.sql --remote

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active INTEGER DEFAULT 1,
  settings TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  createdBy TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  permissions TEXT,
  is_active INTEGER DEFAULT 1,
  last_login INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, email)
);

-- ============================================
-- TENANT METADATA
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
-- USER METADATA
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
-- OAUTH SYSTEM
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
-- TOOLS
-- ============================================

CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT,
  icon TEXT,
  description TEXT,
  config TEXT,
  is_enabled INTEGER DEFAULT 1,
  is_public INTEGER DEFAULT 0,
  version TEXT DEFAULT '1.0.0',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tool_access (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  can_view INTEGER DEFAULT 1,
  can_use INTEGER DEFAULT 1,
  can_configure INTEGER DEFAULT 0,
  custom_config TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- WORKFLOWS
-- ============================================

CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  type TEXT DEFAULT 'manual',
  config TEXT NOT NULL,
  schedule TEXT,
  executions INTEGER DEFAULT 0,
  last_run INTEGER,
  next_run INTEGER,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  duration_ms INTEGER,
  error_message TEXT,
  result_data TEXT,
  triggered_by TEXT
);

CREATE TABLE IF NOT EXISTS workflow_access (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  can_view INTEGER DEFAULT 1,
  can_execute INTEGER DEFAULT 1,
  can_edit INTEGER DEFAULT 0,
  can_delete INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- ============================================
-- THEMES
-- ============================================

CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 0,
  config TEXT NOT NULL,
  preview_image_url TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS theme_access (
  id TEXT PRIMARY KEY,
  theme_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  is_active INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- ============================================
-- INFRASTRUCTURE
-- ============================================

CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  project_id TEXT,
  status TEXT NOT NULL,
  url TEXT,
  framework TEXT,
  environment TEXT DEFAULT 'production',
  build_time INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  script_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  requests INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- PROJECTS & BUILDS
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
-- WEBHOOKS
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
-- EXTERNAL CONNECTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS external_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  app_type TEXT NOT NULL,
  connection_status TEXT NOT NULL DEFAULT 'pending',
  credentials_encrypted TEXT,
  config TEXT,
  last_sync INTEGER,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, app_id)
);

CREATE TABLE IF NOT EXISTS external_apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  auth_type TEXT NOT NULL,
  auth_url TEXT,
  api_docs_url TEXT,
  is_enabled INTEGER DEFAULT 1,
  is_public INTEGER DEFAULT 1,
  config_schema TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- BILLING
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
-- SECURITY
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
-- SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id, provider_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_tenant ON oauth_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_tools_tenant ON tools(tenant_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_tools_public ON tools(is_public, is_enabled);
CREATE INDEX IF NOT EXISTS idx_tool_access_user ON tool_access(user_id, tool_id);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_repository ON projects(repository_provider, repository_id);
CREATE INDEX IF NOT EXISTS idx_builds_project ON builds(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_builds_tenant ON builds(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_builds_status ON builds(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhooks_project ON webhooks(project_id, is_active);
CREATE INDEX IF NOT EXISTS idx_external_connections_user ON external_connections(user_id, connection_status);
CREATE INDEX IF NOT EXISTS idx_external_connections_tenant ON external_connections(tenant_id, app_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

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

-- ============================================
-- INITIAL DATA: Default Tools
-- ============================================

INSERT OR IGNORE INTO tools (
  id, tenant_id, name, display_name, category, icon, description, version, is_public, is_enabled, created_at, updated_at
) VALUES 
  ('tool-meauxide', '', 'meauxide', 'MeauxIDE', 'engine', 'code', 'CLI / CI/CD / IDE Workflows', '2.0.0', 1, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('tool-meauxmcp', '', 'meauxmcp', 'MeauxMCP', 'engine', 'server', 'MCP Protocol Manager', '2.0.0', 1, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('tool-meauxsql', '', 'meauxsql', 'InnerData', 'engine', 'database', 'SQL Database Tool', '2.0.0', 1, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('tool-meauxcad', '', 'meauxcad', 'MeauxCAD', 'assets', 'pen-tool', '3D Modeling Tool', '2.0.0', 1, 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- INITIAL DATA: Default Theme
-- ============================================

INSERT OR IGNORE INTO themes (
  id, tenant_id, name, display_name, is_default, is_public, config, created_at, updated_at
) VALUES (
  'theme-dark-default',
  '',
  'dark-default',
  'Dark Default',
  1,
  1,
  '{"colors":{"brand":{"orange":"#ff6b00","red":"#dc2626","dark":"#050507","panel":"#0a0a0f","surface":"#171717"}},"fonts":{"sans":"Inter","mono":"JetBrains Mono"}}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
