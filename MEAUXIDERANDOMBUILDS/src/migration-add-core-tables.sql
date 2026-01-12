-- Add core tables if they don't exist
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-add-core-tables.sql --remote

-- Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  is_active INTEGER DEFAULT 1,
  createdAt INTEGER,
  created_at INTEGER,
  updated_at INTEGER
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at INTEGER,
  updated_at INTEGER
);

-- Deployments Table (already created, but ensure it exists)
CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  project_name TEXT NOT NULL,
  project_id TEXT,
  status TEXT NOT NULL,
  url TEXT,
  framework TEXT,
  environment TEXT DEFAULT 'production',
  build_time INTEGER,
  build_time_ms INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Workers Table (already created, but ensure it exists)
CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT NOT NULL,
  script_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  requests INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT NOT NULL,
  slug TEXT,
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
  metadata TEXT,
  build_url TEXT,
  domain TEXT,
  visits INTEGER DEFAULT 0,
  plan TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- Workflows Table
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  config TEXT,
  executions INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deployments_tenant ON deployments(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_workers_tenant ON workers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id, status);
