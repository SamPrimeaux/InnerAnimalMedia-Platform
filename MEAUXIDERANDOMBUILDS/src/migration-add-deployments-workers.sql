-- Add deployments and workers tables if they don't exist
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-add-deployments-workers.sql --remote

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deployments_tenant ON deployments(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_project ON deployments(project_name);
CREATE INDEX IF NOT EXISTS idx_workers_tenant ON workers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
