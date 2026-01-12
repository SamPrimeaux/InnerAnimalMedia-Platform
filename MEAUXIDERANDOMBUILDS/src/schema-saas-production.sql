-- Comprehensive SaaS Production Database Schema
-- InnerAnimal Media Business Platform - Multi-tenant SaaS for software builds
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/schema-saas-production.sql --remote

-- ============================================
-- ENHANCED TENANTS (SaaS Organizations)
-- ============================================

-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE
-- We'll store SaaS-specific data in the existing 'settings' JSON field
-- Or create a separate tenant_metadata table for extensibility

-- Tenant Metadata Table (stores SaaS-specific tenant data)
CREATE TABLE IF NOT EXISTS tenant_metadata (
  tenant_id TEXT PRIMARY KEY,
  plan_type TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  subscription_id TEXT,
  billing_email TEXT,
  limits TEXT, -- JSON: {users: 10, workflows: 100, storage_gb: 50}
  usage TEXT, -- JSON: {users: 5, workflows: 23, storage_gb: 12.5}
  custom_domain TEXT,
  ssl_enabled INTEGER DEFAULT 0,
  trial_ends_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
  -- Note: Foreign key removed for compatibility - tenant_id should match tenants.id
);

-- ============================================
-- ENHANCED USERS (SaaS User Management)
-- ============================================

-- User Metadata Table (stores SaaS-specific user data)
CREATE TABLE IF NOT EXISTS user_metadata (
  user_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  notification_preferences TEXT, -- JSON: {email: true, push: false}
  api_key_hash TEXT,
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,
  github_username TEXT,
  github_user_id TEXT,
  google_email TEXT,
  google_user_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
  -- Note: Foreign keys removed for compatibility - IDs should match users/tenants tables
);

-- ============================================
-- OAUTH CONFIGURATION & TOKENS
-- ============================================

-- OAuth Providers Configuration
CREATE TABLE IF NOT EXISTS oauth_providers (
  id TEXT PRIMARY KEY, -- 'github', 'google', 'microsoft', etc.
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  client_id TEXT NOT NULL, -- OAuth client ID
  client_secret_encrypted TEXT NOT NULL, -- Encrypted client secret
  auth_url TEXT NOT NULL, -- Authorization URL
  token_url TEXT NOT NULL, -- Token exchange URL
  user_info_url TEXT NOT NULL, -- User info endpoint
  scopes TEXT NOT NULL, -- JSON array of scopes
  is_enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- OAuth Tokens (User connections to external services)
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  provider_id TEXT NOT NULL, -- 'github', 'google', etc.
  access_token_encrypted TEXT NOT NULL, -- Encrypted access token
  refresh_token_encrypted TEXT, -- Encrypted refresh token (if available)
  token_type TEXT DEFAULT 'Bearer',
  expires_at INTEGER, -- Token expiration timestamp
  scope TEXT, -- Granted scopes
  provider_user_id TEXT, -- User ID from provider (github_id, google_id, etc.)
  provider_username TEXT, -- Username from provider
  provider_email TEXT, -- Email from provider
  provider_avatar_url TEXT, -- Avatar URL from provider
  last_used_at INTEGER, -- Last time token was used
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  -- Foreign keys removed for compatibility
  -- user_id should match users.id
  -- tenant_id should match tenants.id
  -- provider_id should match oauth_providers.id
  UNIQUE(user_id, provider_id) -- One token per provider per user
);

-- OAuth Authorization States (for OAuth flow)
CREATE TABLE IF NOT EXISTS oauth_states (
  id TEXT PRIMARY KEY, -- Random state token
  user_id TEXT,
  tenant_id TEXT,
  provider_id TEXT NOT NULL,
  redirect_uri TEXT,
  scope TEXT,
  expires_at INTEGER NOT NULL, -- State expires in 10 minutes
  created_at INTEGER NOT NULL,
  -- provider_id should match oauth_providers.id
);

-- ============================================
-- PROJECTS & REPOSITORIES (SaaS Builds)
-- ============================================

-- Projects Table (Software projects)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  repository_url TEXT, -- GitHub/GitLab repository URL
  repository_provider TEXT, -- 'github', 'gitlab', 'bitbucket'
  repository_id TEXT, -- Repository ID from provider
  default_branch TEXT DEFAULT 'main',
  framework TEXT, -- 'nextjs', 'react', 'vue', 'angular', etc.
  build_command TEXT,
  install_command TEXT,
  environment_variables TEXT, -- JSON: {NODE_ENV: 'production', ...}
  is_public INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, archived, deleted
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  -- Foreign keys removed for compatibility
  UNIQUE(tenant_id, slug)
);

-- Builds Table (CI/CD Builds)
CREATE TABLE IF NOT EXISTS builds (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  branch TEXT NOT NULL,
  commit_hash TEXT,
  commit_message TEXT,
  commit_author TEXT,
  build_number INTEGER NOT NULL, -- Sequential build number per project
  status TEXT NOT NULL, -- 'queued', 'building', 'success', 'failed', 'cancelled'
  build_log TEXT, -- Build output/logs
  build_time_ms INTEGER, -- Build duration in milliseconds
  environment TEXT DEFAULT 'production', -- production, staging, preview
  deployment_url TEXT, -- URL where build is deployed
  deployment_id TEXT, -- Cloudflare Pages deployment ID
  triggered_by TEXT, -- user_id or 'webhook' or 'schedule'
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  -- Foreign keys removed for compatibility
);

-- ============================================
-- WEBHOOKS & INTEGRATIONS
-- ============================================

-- Webhooks Table (GitHub/GitLab webhooks)
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'github', 'gitlab', 'custom'
  url TEXT NOT NULL, -- Webhook URL endpoint
  secret_encrypted TEXT, -- Encrypted webhook secret
  events TEXT NOT NULL, -- JSON array of events: ['push', 'pull_request']
  is_active INTEGER DEFAULT 1,
  last_triggered_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  -- Foreign keys removed for compatibility
);

-- ============================================
-- BILLING & SUBSCRIPTIONS
-- ============================================

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  plan_type TEXT NOT NULL, -- 'free', 'starter', 'pro', 'enterprise'
  status TEXT NOT NULL, -- 'active', 'trialing', 'past_due', 'cancelled'
  current_period_start INTEGER,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER DEFAULT 0,
  cancelled_at INTEGER,
  stripe_subscription_id TEXT, -- Stripe subscription ID
  stripe_customer_id TEXT, -- Stripe customer ID
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  -- Foreign key removed for compatibility
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subscription_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- 'draft', 'open', 'paid', 'void'
  stripe_invoice_id TEXT,
  invoice_pdf_url TEXT,
  due_date INTEGER,
  paid_at INTEGER,
  created_at INTEGER NOT NULL
  -- Foreign keys removed for compatibility
);

-- ============================================
-- AUDIT LOGS (Security & Compliance)
-- ============================================

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'oauth_connect', etc.
  resource_type TEXT, -- 'project', 'workflow', 'user', 'deployment', etc.
  resource_id TEXT,
  details TEXT, -- JSON: Additional details
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
  -- Foreign keys removed for compatibility
);

-- ============================================
-- API KEYS (Programmatic Access)
-- ============================================

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL, -- User-friendly name
  key_hash TEXT NOT NULL, -- Hashed API key
  key_prefix TEXT NOT NULL, -- First 8 chars for display: 'sk_live_...'
  scopes TEXT NOT NULL, -- JSON array: ['read', 'write', 'admin']
  last_used_at INTEGER,
  expires_at INTEGER, -- NULL = never expires
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
  -- Foreign keys removed for compatibility
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'build_complete', 'deployment_failed', 'workflow_error', etc.
  title TEXT NOT NULL,
  message TEXT,
  data TEXT, -- JSON: Additional notification data
  is_read INTEGER DEFAULT 0,
  read_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  -- Foreign key removed for compatibility
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- OAuth indexes
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id, provider_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_tenant ON oauth_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_repository ON projects(repository_provider, repository_id);

-- Builds indexes
CREATE INDEX IF NOT EXISTS idx_builds_project ON builds(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_builds_tenant ON builds(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_builds_status ON builds(status, created_at DESC);

-- Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_project ON webhooks(project_id, is_active);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id, created_at DESC);

-- ============================================
-- INITIAL DATA: OAuth Providers
-- ============================================

-- Insert GitHub OAuth provider (will be configured with real credentials)
INSERT OR IGNORE INTO oauth_providers (
  id, name, display_name, client_id, client_secret_encrypted, 
  auth_url, token_url, user_info_url, scopes, is_enabled, created_at, updated_at
) VALUES (
  'github',
  'GitHub',
  'GitHub',
  'PLACEHOLDER_CLIENT_ID', -- Replace with real GitHub OAuth App Client ID
  'PLACEHOLDER_CLIENT_SECRET', -- Replace with real GitHub OAuth App Client Secret (encrypted)
  'https://github.com/login/oauth/authorize',
  'https://github.com/login/oauth/access_token',
  'https://api.github.com/user',
  '["user:email", "read:org", "repo"]',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Insert Google OAuth provider (will be configured with real credentials)
INSERT OR IGNORE INTO oauth_providers (
  id, name, display_name, client_id, client_secret_encrypted,
  auth_url, token_url, user_info_url, scopes, is_enabled, created_at, updated_at
) VALUES (
  'google',
  'Google',
  'Google',
  'PLACEHOLDER_CLIENT_ID', -- Replace with real Google OAuth Client ID
  'PLACEHOLDER_CLIENT_SECRET', -- Replace with real Google OAuth Client Secret (encrypted)
  'https://accounts.google.com/o/oauth2/v2/auth',
  'https://oauth2.googleapis.com/token',
  'https://www.googleapis.com/oauth2/v2/userinfo',
  '["openid", "profile", "email", "https://www.googleapis.com/auth/drive.readonly"]',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
