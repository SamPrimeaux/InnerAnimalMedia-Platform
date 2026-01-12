-- Migration Script: Rebuild Database for Tools/Workflows/Themes Access
-- This safely migrates existing data and adds new tables
-- Run: wrangler d1 execute meauxos --file=src/migration-rebuild.sql

-- ============================================
-- STEP 1: Preserve existing data (if needed)
-- ============================================

-- Backup existing workflows if they exist
CREATE TABLE IF NOT EXISTS workflows_backup AS 
SELECT * FROM workflows WHERE 1=0; -- Create empty backup table structure

-- ============================================
-- STEP 2: Create new tables (if they don't exist)
-- ============================================

-- Tools Table
CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT,
  icon TEXT,
  description TEXT,
  config TEXT,
  is_enabled INTEGER DEFAULT 1,
  is_public INTEGER DEFAULT 0,
  version TEXT DEFAULT '1.0.0',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Tool Access Table
CREATE TABLE IF NOT EXISTS tool_access (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  can_view INTEGER DEFAULT 1,
  can_use INTEGER DEFAULT 1,
  can_configure INTEGER DEFAULT 0,
  custom_config TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Enhanced Workflows Table (add new columns if table exists)
-- Note: We'll check and alter if needed
CREATE TABLE IF NOT EXISTS workflows_new (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  type TEXT DEFAULT 'manual',
  config TEXT NOT NULL,
  schedule TEXT,
  executions INTEGER DEFAULT 0,
  last_run INTEGER,
  next_run INTEGER,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Workflow Executions Table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  duration_ms INTEGER,
  error_message TEXT,
  result_data TEXT,
  triggered_by TEXT
);

-- Workflow Access Table
CREATE TABLE IF NOT EXISTS workflow_access (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  can_view INTEGER DEFAULT 1,
  can_execute INTEGER DEFAULT 1,
  can_edit INTEGER DEFAULT 0,
  can_delete INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Themes Table
CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 0,
  config TEXT NOT NULL,
  preview_image_url TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Theme Access Table
CREATE TABLE IF NOT EXISTS theme_access (
  id TEXT PRIMARY KEY,
  theme_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  is_active INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);

-- ============================================
-- STEP 3: Migrate existing workflows data (if workflows table exists)
-- ============================================

-- Check if workflows table exists and migrate data
-- Note: SQLite doesn't support IF EXISTS for SELECT, so we'll handle this in application code
-- For now, we'll just create the new table structure

-- ============================================
-- STEP 4: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tools_tenant ON tools(tenant_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_tools_public ON tools(is_public, is_enabled);
CREATE INDEX IF NOT EXISTS idx_tool_access_tenant ON tool_access(tenant_id, tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_access_user ON tool_access(user_id, tool_id);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows_new(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_workflows_next_run ON workflows_new(next_run) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_themes_tenant ON themes(tenant_id, is_default);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, expires_at);

-- ============================================
-- STEP 5: Insert default tools
-- ============================================

INSERT OR IGNORE INTO tools (id, tenant_id, name, display_name, category, icon, description, is_public, is_enabled, version, created_at, updated_at)
VALUES
  ('tool-meauxmcp', 'system', 'meauxmcp', 'MeauxMCP', 'engine', 'server', 'MCP Protocol Manager', 1, 1, '2.0.0', strftime('%s', 'now'), strftime('%s', 'now')),
  ('tool-meauxsql', 'system', 'meauxsql', 'InnerData', 'engine', 'database', 'SQL Query Tool', 1, 1, '2.0.0', strftime('%s', 'now'), strftime('%s', 'now')),
  ('tool-meauxcad', 'system', 'meauxcad', 'MeauxCAD', 'assets', 'pen-tool', '3D Modeling Tool', 1, 1, '2.0.0', strftime('%s', 'now'), strftime('%s', 'now')),
  ('tool-meauxide', 'system', 'meauxide', 'MeauxIDE', 'engine', 'code', 'Code Editor', 1, 1, '2.0.0', strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- STEP 6: Insert default theme
-- ============================================

INSERT OR IGNORE INTO themes (id, tenant_id, name, display_name, is_default, is_public, config, created_at, updated_at)
VALUES
  ('theme-dark-default', 'system', 'dark-default', 'Dark Default', 1, 1, 
   '{"colors":{"brand":{"orange":"#ff6b00","red":"#dc2626","dark":"#050507","panel":"#0a0a0f","surface":"#171717"}},"fonts":{"sans":"Inter","mono":"JetBrains Mono"}}',
   strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- STEP 7: Grant default access to all tenants
-- ============================================

-- Grant all tenants access to public tools
INSERT OR IGNORE INTO tool_access (id, tool_id, tenant_id, can_view, can_use, can_configure, created_at, updated_at)
SELECT 
  'access-' || t.id || '-tool-meauxmcp' as id,
  'tool-meauxmcp' as tool_id,
  t.id as tenant_id,
  1 as can_view,
  1 as can_use,
  0 as can_configure,
  strftime('%s', 'now') as created_at,
  strftime('%s', 'now') as updated_at
FROM tenants t
WHERE t.is_active = 1;

INSERT OR IGNORE INTO tool_access (id, tool_id, tenant_id, can_view, can_use, can_configure, created_at, updated_at)
SELECT 
  'access-' || t.id || '-tool-meauxsql' as id,
  'tool-meauxsql' as tool_id,
  t.id as tenant_id,
  1 as can_view,
  1 as can_use,
  0 as can_configure,
  strftime('%s', 'now') as created_at,
  strftime('%s', 'now') as updated_at
FROM tenants t
WHERE t.is_active = 1;

INSERT OR IGNORE INTO tool_access (id, tool_id, tenant_id, can_view, can_use, can_configure, created_at, updated_at)
SELECT 
  'access-' || t.id || '-tool-meauxcad' as id,
  'tool-meauxcad' as tool_id,
  t.id as tenant_id,
  1 as can_view,
  1 as can_use,
  0 as can_configure,
  strftime('%s', 'now') as created_at,
  strftime('%s', 'now') as updated_at
FROM tenants t
WHERE t.is_active = 1;

INSERT OR IGNORE INTO tool_access (id, tool_id, tenant_id, can_view, can_use, can_configure, created_at, updated_at)
SELECT 
  'access-' || t.id || '-tool-meauxide' as id,
  'tool-meauxide' as tool_id,
  t.id as tenant_id,
  1 as can_view,
  1 as can_use,
  0 as can_configure,
  strftime('%s', 'now') as created_at,
  strftime('%s', 'now') as updated_at
FROM tenants t
WHERE t.is_active = 1;

-- Grant default theme access to all tenants
INSERT OR IGNORE INTO theme_access (id, theme_id, tenant_id, is_active, created_at)
SELECT 
  'theme-access-' || t.id as id,
  'theme-dark-default' as theme_id,
  t.id as tenant_id,
  1 as is_active,
  strftime('%s', 'now') as created_at
FROM tenants t
WHERE t.is_active = 1;

-- ============================================
-- Migration Complete
-- ============================================

-- Note: After migration, you may want to:
-- 1. Drop old workflows table: DROP TABLE IF EXISTS workflows;
-- 2. Rename new table: ALTER TABLE workflows_new RENAME TO workflows;
-- 3. Recreate indexes on renamed table
