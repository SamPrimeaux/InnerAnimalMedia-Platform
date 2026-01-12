-- External App Connections Schema
-- Allows users to connect external services (Claude, Google Drive, OpenAI, etc.)
-- Run: wrangler d1 execute meauxos --file=src/schema-external-connections.sql

-- External App Connections Table
CREATE TABLE IF NOT EXISTS external_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  app_id TEXT NOT NULL, -- 'claude', 'google-drive', 'openai', 'cursor', 'cloudconvert', etc.
  app_name TEXT NOT NULL, -- Display name
  app_type TEXT NOT NULL, -- 'oauth', 'api_key', 'webhook'
  connection_status TEXT NOT NULL DEFAULT 'pending', -- 'connected', 'pending', 'error', 'disconnected'
  credentials_encrypted TEXT, -- Encrypted credentials (OAuth tokens, API keys)
  config TEXT, -- JSON: {scopes, permissions, settings}
  last_sync INTEGER, -- Last successful sync/use timestamp
  error_message TEXT, -- Last error if connection failed
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(user_id, app_id) -- One connection per app per user
);

-- External App Catalog (Available apps to connect)
CREATE TABLE IF NOT EXISTS external_apps (
  id TEXT PRIMARY KEY, -- 'claude', 'google-drive', etc.
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon identifier
  category TEXT, -- 'ai', 'storage', 'productivity', 'development'
  auth_type TEXT NOT NULL, -- 'oauth2', 'api_key', 'webhook'
  auth_url TEXT, -- OAuth URL if applicable
  api_docs_url TEXT, -- Documentation URL
  is_enabled INTEGER DEFAULT 1,
  is_public INTEGER DEFAULT 1, -- Available to all users
  config_schema TEXT, -- JSON schema for connection config
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_external_connections_user ON external_connections(user_id, connection_status);
CREATE INDEX IF NOT EXISTS idx_external_connections_tenant ON external_connections(tenant_id, app_id);
CREATE INDEX IF NOT EXISTS idx_external_apps_category ON external_apps(category, is_enabled);
