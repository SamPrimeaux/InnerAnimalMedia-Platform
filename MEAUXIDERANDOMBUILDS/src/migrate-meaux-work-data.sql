-- Strategic Migration: Extract useful data from meaux-work-db
-- Only migrating data that makes sense for SaaS platform at global scale
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migrate-meaux-work-data.sql --remote

-- ============================================
-- 1. CREATE ASSETS TABLE (if doesn't exist)
-- ============================================

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

-- ============================================
-- 2. CREATE BUILDS TABLE (if doesn't exist)
-- ============================================

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
-- 3. MIGRATE APP DEPLOYMENTS → BUILDS
-- ============================================

-- app_deployments: 1 row
-- deployment_id: "deploy-1764720214388-vxwpna8xq"
-- app_name: "test-app"
-- app_type: "dashboard"
-- path: "apps/test-app/index.html"
-- status: "deployed"
-- created_at: "2025-12-03T00:03:34.634Z"

INSERT OR IGNORE INTO builds (
  id, project_id, tenant_id, branch, commit_hash, commit_message,
  commit_author, build_number, status, build_log, build_time_ms,
  environment, deployment_url, deployment_id, triggered_by,
  started_at, completed_at, created_at
)
SELECT 
  'build_deploy-1764720214388-vxwpna8xq' as id,
  COALESCE((SELECT id FROM projects WHERE name = 'test-app' OR slug = 'test-app' LIMIT 1), 'project_test-app') as project_id,
  '' as tenant_id,
  'main' as branch,
  NULL as commit_hash,
  NULL as commit_message,
  NULL as commit_author,
  1 as build_number,
  'success' as status,
  NULL as build_log,
  NULL as build_time_ms,
  'production' as environment,
  NULL as deployment_url,
  'deploy-1764720214388-vxwpna8xq' as deployment_id,
  'system' as triggered_by,
  1733191414 as started_at,
  1733191414 as completed_at,
  1733191414 as created_at
WHERE NOT EXISTS (
  SELECT 1 FROM builds WHERE deployment_id = 'deploy-1764720214388-vxwpna8xq'
);

-- ============================================
-- 4. MIGRATE BILLING PROJECTS → PROJECTS
-- ============================================

-- billing_projects: 1 row
-- id: "7fa5f744-344f-4a44-b445-d5509bc8cb65"
-- name: "MeauxOS Development"
-- description: "Main dashboard and agent development"
-- client: "Internal"
-- hourly_rate: 150
-- budget: 10000
-- created_at: 1765520252
-- updated_at: 1765520252

-- Match actual projects table schema
INSERT OR IGNORE INTO projects (
  id, name, slug, description, status, category,
  repository_url, build_url, metadata, created_by,
  assigned_to, created_at, updated_at, started_at, completed_at,
  domain, visits, plan
)
SELECT 
  '7fa5f744-344f-4a44-b445-d5509bc8cb65' as id,
  'MeauxOS Development' as name,
  'meauxos-development' as slug,
  'Main dashboard and agent development' as description,
  'active' as status,
  'infrastructure' as category,
  NULL as repository_url,
  NULL as build_url,
  json_object('hourly_rate', 150, 'budget', 10000, 'client', 'Internal') as metadata,
  'system' as created_by,
  NULL as assigned_to,
  datetime(1765520252, 'unixepoch') as created_at,
  datetime(1765520252, 'unixepoch') as updated_at,
  NULL as started_at,
  NULL as completed_at,
  NULL as domain,
  '0' as visits,
  'Free' as plan
WHERE NOT EXISTS (
  SELECT 1 FROM projects WHERE id = '7fa5f744-344f-4a44-b445-d5509bc8cb65'
);

-- ============================================
-- 5. MIGRATE ASSETS (R2 Object Metadata)
-- ============================================

-- Assets: 17 rows
-- Sample structure:
-- id: 74467778
-- key: "app.js"
-- bucket: "meauxlife-appkit"
-- size: 9135
-- content_type: "application/octet-stream"
-- metadata: JSON string
-- uploaded_at: "2025-12-11T05:24:27.541Z"

-- Note: We'll migrate key assets that are relevant
-- For now, creating the table structure. Actual asset migration
-- can be done via API or separate script if needed.

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_assets_tenant_key ON assets(tenant_id, key);
CREATE INDEX IF NOT EXISTS idx_assets_bucket ON assets(bucket, key);

-- ============================================
-- NOTES ON SKIPPED DATA
-- ============================================
-- SKIPPED (not relevant for SaaS platform):
-- - animals, animal_photos (39 rows) - Pet rescue specific, not SaaS
-- - chat_conversations (2 rows) - Minimal data, conversation_history exists
-- - board_tasks (2 rows) - Task management, different system
-- - development_workflows (0 rows) - Empty, workflows table already exists
-- - ai_knowledge_base (7 rows) - RAG/vector DB concern, better as separate system
-- - Most other tables (0 rows) - Empty, no data to migrate

-- ============================================
-- SUMMARY
-- ============================================
-- Migrated:
-- ✅ 1 app_deployment → builds table
-- ✅ 1 billing_project → projects table
-- ✅ Created assets table structure (17 assets can be migrated if needed)
--
-- Total useful data migrated: 2 rows
-- Total tables created: 1 (assets)
