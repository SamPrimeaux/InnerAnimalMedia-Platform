-- Add OAuth and SaaS tables to existing InnerAnimal Business database
-- Only creates NEW tables, doesn't modify existing ones

-- ============================================
-- OAUTH SYSTEM (NEW)
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
  provider_id TEXT NOT NULL,
  redirect_uri TEXT,
  scope TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- ============================================
-- EXTERNAL APP CONNECTIONS (NEW)
-- ============================================

CREATE TABLE IF NOT EXISTS external_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
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
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id, provider_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_external_connections_user ON external_connections(user_id, connection_status);

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
