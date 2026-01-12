-- Strategic Migration: Extract useful data from meaux-work-db
-- Only migrating data that makes sense for SaaS platform at global scale
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migrate-meaux-work-useful-data.sql --remote

-- ============================================
-- 1. APP DEPLOYMENTS → BUILDS TABLE
-- ============================================
-- Migrate app_deployments to builds table (more comprehensive structure)

INSERT OR IGNORE INTO builds (
  id, project_id, tenant_id, branch, commit_hash, commit_message, 
  commit_author, build_number, status, build_log, build_time_ms,
  environment, deployment_url, deployment_id, triggered_by,
  started_at, completed_at, created_at
)
SELECT 
  'build_' || ad.deployment_id as id,
  COALESCE((SELECT id FROM projects WHERE name = ad.app_name LIMIT 1), 'project_' || ad.app_name) as project_id,
  '' as tenant_id, -- Will need to be set per tenant
  'main' as branch,
  NULL as commit_hash,
  NULL as commit_message,
  NULL as commit_author,
  1 as build_number,
  CASE 
    WHEN ad.status = 'deployed' THEN 'success'
    ELSE 'failed'
  END as status,
  NULL as build_log,
  NULL as build_time_ms,
  'production' as environment,
  NULL as deployment_url,
  ad.deployment_id as deployment_id,
  'system' as triggered_by,
  strftime('%s', ad.created_at) as started_at,
  strftime('%s', ad.created_at) as completed_at,
  strftime('%s', ad.created_at) as created_at
FROM (
  SELECT * FROM meaux_work_db.app_deployments
) ad
WHERE NOT EXISTS (
  SELECT 1 FROM builds WHERE deployment_id = ad.deployment_id
);

-- ============================================
-- 2. BILLING PROJECTS → PROJECTS TABLE
-- ============================================
-- Migrate billing_projects to projects table (if not exists)

INSERT OR IGNORE INTO projects (
  id, tenant_id, name, slug, description, repository_url,
  repository_provider, repository_id, default_branch, framework,
  build_command, install_command, environment_variables,
  is_public, status, created_by, created_at, updated_at
)
SELECT 
  bp.id as id,
  '' as tenant_id, -- Will need to be set per tenant
  bp.name as name,
  LOWER(REPLACE(REPLACE(bp.name, ' ', '-'), '_', '-')) as slug,
  bp.description as description,
  NULL as repository_url,
  NULL as repository_provider,
  NULL as repository_id,
  'main' as default_branch,
  NULL as framework,
  NULL as build_command,
  NULL as install_command,
  json_object('hourly_rate', bp.hourly_rate, 'budget', bp.budget, 'client', bp.client) as environment_variables,
  0 as is_public,
  'active' as status,
  NULL as created_by,
  bp.created_at as created_at,
  bp.updated_at as updated_at
FROM (
  SELECT * FROM meaux_work_db.billing_projects
) bp
WHERE NOT EXISTS (
  SELECT 1 FROM projects WHERE id = bp.id
);

-- ============================================
-- 3. ASSETS TABLE (if doesn't exist)
-- ============================================
-- Create assets table for R2 object metadata

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  bucket TEXT NOT NULL,
  size INTEGER,
  content_type TEXT,
  metadata TEXT,
  uploaded_by TEXT,
  uploaded_at INTEGER NOT NULL,
  last_accessed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, key, bucket)
);

-- Migrate assets data
INSERT OR IGNORE INTO assets (
  id, tenant_id, key, bucket, size, content_type, metadata,
  uploaded_by, uploaded_at, last_accessed_at, created_at, updated_at
)
SELECT 
  'asset_' || a.id as id,
  '' as tenant_id, -- Will need to be set per tenant
  a.key as key,
  a.bucket as bucket,
  a.size as size,
  a.content_type as content_type,
  a.metadata as metadata,
  NULL as uploaded_by,
  strftime('%s', a.uploaded_at) as uploaded_at,
  CASE 
    WHEN a.last_accessed_at IS NOT NULL THEN strftime('%s', a.last_accessed_at)
    ELSE NULL
  END as last_accessed_at,
  strftime('%s', a.uploaded_at) as created_at,
  strftime('%s', COALESCE(a.last_accessed_at, a.uploaded_at)) as updated_at
FROM (
  SELECT * FROM meaux_work_db.assets
) a
WHERE NOT EXISTS (
  SELECT 1 FROM assets WHERE key = a.key AND bucket = a.bucket
);

-- ============================================
-- 4. AI KNOWLEDGE BASE (if useful)
-- ============================================
-- Note: This might be better as a separate knowledge base system
-- For now, we'll skip this as it's more of a RAG/vector DB concern
-- But we can create a table structure if needed

-- CREATE TABLE IF NOT EXISTS knowledge_base (
--   id TEXT PRIMARY KEY,
--   tenant_id TEXT NOT NULL,
--   title TEXT NOT NULL,
--   content TEXT NOT NULL,
--   category TEXT,
--   source_file TEXT,
--   source_type TEXT DEFAULT 'upload',
--   tags TEXT,
--   created_at INTEGER NOT NULL,
--   updated_at INTEGER NOT NULL
-- );

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_assets_tenant_key ON assets(tenant_id, key);
CREATE INDEX IF NOT EXISTS idx_assets_bucket ON assets(bucket, key);

-- ============================================
-- NOTES
-- ============================================
-- SKIPPED (not relevant for SaaS platform):
-- - animals, animal_photos (pet rescue specific)
-- - chat_conversations (conversation_history already exists)
-- - board_tasks (task management - different system)
-- - development_workflows (empty, workflows table already exists)
