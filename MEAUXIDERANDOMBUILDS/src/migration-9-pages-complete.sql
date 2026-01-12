-- Migration: Complete 9 Pages Backend - Production Grade Tables
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-9-pages-complete.sql --remote

-- MeauxCAD Models Table
CREATE TABLE IF NOT EXISTS cad_models (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  style TEXT,
  resolution TEXT,
  source TEXT NOT NULL, -- 'meshy', 'upload', 'blender', 'cloudconvert'
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'ready', 'failed'
  meshy_task_id TEXT,
  blender_job_id TEXT,
  cloudconvert_job_id TEXT,
  file_path TEXT, -- R2 key
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT, -- .glb, .obj, etc.
  metadata_json TEXT, -- JSON: {meshy_response, blender_output, etc.}
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_cad_models_tenant ON cad_models(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cad_models_status ON cad_models(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cad_models_source ON cad_models(source, created_at DESC);

-- AI Services Table
CREATE TABLE IF NOT EXISTS ai_services (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google', 'custom'
  type TEXT NOT NULL, -- 'chat', 'embedding', 'image', 'text', 'custom'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'error'
  config_json TEXT, -- JSON: {api_key, model, settings, etc.}
  usage_count INTEGER DEFAULT 0,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_ai_services_tenant ON ai_services(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_services_provider ON ai_services(provider, status);

-- API Routes Table (API Gateway)
CREATE TABLE IF NOT EXISTS api_routes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  method TEXT NOT NULL, -- 'GET', 'POST', 'PUT', 'DELETE', '*'
  path TEXT NOT NULL, -- '/api/example/:id'
  target_url TEXT NOT NULL, -- Proxy target
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'deprecated'
  rate_limit INTEGER DEFAULT 100, -- Requests per minute
  auth_required INTEGER DEFAULT 1, -- 0 = no auth, 1 = required
  headers_json TEXT, -- JSON: Custom headers to add
  transforms_json TEXT, -- JSON: Request/response transforms
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_api_routes_tenant ON api_routes(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_api_routes_path ON api_routes(method, path);

-- Brand Assets Table
CREATE TABLE IF NOT EXISTS brand_assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'logo', 'image', 'video', 'document', 'color'
  category TEXT, -- 'logo', 'icon', 'banner', 'color-palette', etc.
  file_path TEXT, -- R2 key
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT, -- MIME type
  metadata_json TEXT, -- JSON: {dimensions, colors, tags, etc.}
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_brand_assets_tenant ON brand_assets(tenant_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_assets_category ON brand_assets(category, created_at DESC);

-- Library Items Table
CREATE TABLE IF NOT EXISTS library_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'document', 'image', 'video', 'audio', 'code', 'other'
  category TEXT, -- Custom categorization
  tags TEXT, -- Comma-separated tags
  file_path TEXT, -- R2 key
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT, -- MIME type
  metadata_json TEXT, -- JSON: {author, license, version, etc.}
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_library_items_tenant ON library_items(tenant_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_items_category ON library_items(category, created_at DESC);

-- Work Items Table (MeauxWork)
CREATE TABLE IF NOT EXISTS work_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done', 'cancelled'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  assigned_to TEXT, -- User ID
  due_date INTEGER, -- Unix timestamp
  completed_at INTEGER,
  metadata_json TEXT, -- JSON: {tags, attachments, time_tracked, etc.}
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_work_items_tenant ON work_items(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_items_assigned ON work_items(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_work_items_due_date ON work_items(due_date, status);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  team_role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
  permissions_json TEXT, -- JSON: {can_edit, can_delete, can_invite, etc.}
  joined_at INTEGER NOT NULL
);

-- Create unique constraint separately to avoid conflicts
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_unique ON team_members(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_tenant ON team_members(tenant_id, team_role);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- Analytics Events Table - Skip if already exists with different schema
-- The table may already exist, so we handle it gracefully in the application layer
-- CREATE TABLE IF NOT EXISTS analytics_events (
--   id TEXT PRIMARY KEY,
--   tenant_id TEXT,
--   user_id TEXT,
--   event_type TEXT NOT NULL,
--   metadata_json TEXT,
--   created_at INTEGER NOT NULL
-- );

-- Users Table (if not exists - may already exist)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user', -- 'user', 'admin', 'owner'
  avatar_url TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
