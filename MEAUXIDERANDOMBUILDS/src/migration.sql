-- Migration script for iAccess Platform
-- Works with existing database schema

-- Create workflows table (doesn't exist yet)
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  config TEXT, -- JSON
  executions INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create workers table (check if exists first)
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

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workers_tenant ON workers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deployments_tenant ON deployments(tenant_id, created_at DESC);

-- Note: deployments table already exists with tenant_id column
-- Note: tenants table already exists with different structure
-- Note: users table already exists (check structure if needed)
