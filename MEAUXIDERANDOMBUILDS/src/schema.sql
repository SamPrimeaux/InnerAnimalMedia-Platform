-- iAccess Platform Database Schema
-- Run this in your D1 database: wrangler d1 execute meauxos --file=src/schema.sql

-- Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(tenant_id, email)
);

-- Deployments Table
CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  project_id TEXT,
  status TEXT NOT NULL,
  url TEXT,
  framework TEXT,
  environment TEXT,
  build_time INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Workflows Table
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  config TEXT, -- JSON
  executions INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Workers Table
CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  script_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  requests INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_deployments_tenant ON deployments(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workers_tenant ON workers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id, email);

-- Insert default tenant (optional)
-- INSERT OR IGNORE INTO tenants (id, name, slug, status, created_at, updated_at)
-- VALUES ('default_tenant', 'Default Tenant', 'default', 'active', strftime('%s', 'now'), strftime('%s', 'now'));
