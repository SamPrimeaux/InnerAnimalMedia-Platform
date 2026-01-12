-- Comprehensive Database Schema Rebuild for MeauxOS
-- Supports: Tools, Workflows, Themes, User Access, Multi-Tenancy
-- Run: wrangler d1 execute meauxos --file=src/schema-rebuild.sql

-- ============================================
-- CORE TABLES
-- ============================================

-- Tenants Table (Multi-tenancy support)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active INTEGER DEFAULT 1, -- 0 or 1 (SQLite boolean)
  settings TEXT, -- JSON: {theme, features, limits}
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  createdBy TEXT -- User who created this tenant
);

-- Users Table (User management with roles)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- admin, user, viewer
  permissions TEXT, -- JSON: {tools: [...], workflows: [...], themes: [...]}
  is_active INTEGER DEFAULT 1,
  last_login INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(tenant_id, email)
);

-- ============================================
-- TOOLS MANAGEMENT
-- ============================================

-- Tools Table (MeauxMCP, MeauxSQL, MeauxCAD, MeauxIDE, etc.)
CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL, -- 'meauxmcp', 'meauxsql', 'meauxcad', 'meauxide'
  display_name TEXT NOT NULL, -- 'MeauxMCP', 'InnerData', etc.
  category TEXT, -- 'engine', 'assets', 'infrastructure'
  icon TEXT, -- Icon identifier
  description TEXT,
  config TEXT, -- JSON: {settings, preferences, connections}
  is_enabled INTEGER DEFAULT 1,
  is_public INTEGER DEFAULT 0, -- Public tools available to all tenants
  version TEXT DEFAULT '1.0.0',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Tool Access Table (User/Tenant access to tools)
CREATE TABLE IF NOT EXISTS tool_access (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT, -- NULL means tenant-level access
  can_view INTEGER DEFAULT 1,
  can_use INTEGER DEFAULT 1,
  can_configure INTEGER DEFAULT 0,
  custom_config TEXT, -- JSON: User-specific tool configuration
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tool_id) REFERENCES tools(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- WORKFLOWS MANAGEMENT
-- ============================================

-- Workflows Table (Enhanced)
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, archived
  type TEXT DEFAULT 'manual', -- manual, scheduled, event-driven
  config TEXT NOT NULL, -- JSON: {steps, triggers, conditions, actions}
  schedule TEXT, -- Cron expression or schedule config (JSON)
  executions INTEGER DEFAULT 0,
  last_run INTEGER,
  next_run INTEGER,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Workflow Executions Table (Execution history)
CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  status TEXT NOT NULL, -- running, success, failed, cancelled
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  duration_ms INTEGER,
  error_message TEXT,
  result_data TEXT, -- JSON: Execution results
  triggered_by TEXT, -- user_id or 'system' or 'schedule'
  FOREIGN KEY (workflow_id) REFERENCES workflows(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Workflow Access Table (User access to workflows)
CREATE TABLE IF NOT EXISTS workflow_access (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT, -- NULL means tenant-level access
  can_view INTEGER DEFAULT 1,
  can_execute INTEGER DEFAULT 1,
  can_edit INTEGER DEFAULT 0,
  can_delete INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- THEMES MANAGEMENT
-- ============================================

-- Themes Table (UI themes and customization)
CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 0, -- Public themes available to all
  config TEXT NOT NULL, -- JSON: {colors, fonts, styles, components}
  preview_image_url TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Theme Access Table (User/tenant theme access)
CREATE TABLE IF NOT EXISTS theme_access (
  id TEXT PRIMARY KEY,
  theme_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT, -- NULL means tenant-level
  is_active INTEGER DEFAULT 0, -- Only one active per tenant/user
  created_at INTEGER NOT NULL,
  FOREIGN KEY (theme_id) REFERENCES themes(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- INFRASTRUCTURE (Existing + Enhanced)
-- ============================================

-- Deployments Table (Cloudflare Pages deployments)
CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  project_id TEXT,
  status TEXT NOT NULL, -- ready, building, error, cancelled
  url TEXT,
  framework TEXT,
  environment TEXT DEFAULT 'production',
  build_time INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Workers Table (Cloudflare Workers)
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

-- ============================================
-- SESSIONS & AUTHENTICATION
-- ============================================

-- Sessions Table (User sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  token_hash TEXT NOT NULL, -- Hashed session token
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Tenant indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(tenant_id, role);

-- Tool indexes
CREATE INDEX IF NOT EXISTS idx_tools_tenant ON tools(tenant_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_tools_public ON tools(is_public, is_enabled);
CREATE INDEX IF NOT EXISTS idx_tool_access_tenant ON tool_access(tenant_id, tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_access_user ON tool_access(user_id, tool_id);

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_next_run ON workflows(next_run) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_tenant ON workflow_executions(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_access_user ON workflow_access(user_id, workflow_id);

-- Theme indexes
CREATE INDEX IF NOT EXISTS idx_themes_tenant ON themes(tenant_id, is_default);
CREATE INDEX IF NOT EXISTS idx_themes_public ON themes(is_public);
CREATE INDEX IF NOT EXISTS idx_theme_access_active ON theme_access(tenant_id, user_id, is_active) WHERE is_active = 1;

-- Deployment indexes
CREATE INDEX IF NOT EXISTS idx_deployments_tenant ON deployments(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);

-- Worker indexes
CREATE INDEX IF NOT EXISTS idx_workers_tenant ON workers(tenant_id);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- ============================================
-- DEFAULT DATA (Seed Data)
-- ============================================

-- Insert default tools (public tools available to all tenants)
INSERT OR IGNORE INTO tools (id, tenant_id, name, display_name, category, icon, description, is_public, is_enabled, version, created_at, updated_at)
VALUES
  ('tool-meauxmcp', 'system', 'meauxmcp', 'MeauxMCP', 'engine', 'server', 'MCP Protocol Manager - Manage and monitor MCP connections, tools, and swarm nodes', 1, 1, '2.0.0', strftime('%s', 'now'), strftime('%s', 'now')),
  ('tool-meauxsql', 'system', 'meauxsql', 'InnerData', 'engine', 'database', 'SQL Query Tool - Professional database query editor with history and export', 1, 1, '2.0.0', strftime('%s', 'now'), strftime('%s', 'now')),
  ('tool-meauxcad', 'system', 'meauxcad', 'MeauxCAD', 'assets', 'pen-tool', '3D Modeling Tool - Create and edit 3D models with AI generation', 1, 1, '2.0.0', strftime('%s', 'now'), strftime('%s', 'now')),
  ('tool-meauxide', 'system', 'meauxide', 'MeauxIDE', 'engine', 'code', 'Code Editor - Full-featured IDE with terminal and file management', 1, 1, '2.0.0', strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert default theme
INSERT OR IGNORE INTO themes (id, tenant_id, name, display_name, is_default, is_public, config, created_at, updated_at)
VALUES
  ('theme-dark-default', 'system', 'dark-default', 'Dark Default', 1, 1, 
   '{"colors":{"brand":{"orange":"#ff6b00","red":"#dc2626","dark":"#050507","panel":"#0a0a0f","surface":"#171717"}},"fonts":{"sans":"Inter","mono":"JetBrains Mono"}}',
   strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- VIEWS FOR EASY QUERIES
-- ============================================

-- View: Available tools for a tenant (includes public + tenant-specific)
CREATE VIEW IF NOT EXISTS v_tenant_tools AS
SELECT 
  t.*,
  ta.tenant_id as access_tenant_id,
  ta.user_id as access_user_id,
  ta.can_view,
  ta.can_use,
  ta.can_configure
FROM tools t
LEFT JOIN tool_access ta ON t.id = ta.tool_id
WHERE t.is_enabled = 1 
  AND (t.is_public = 1 OR ta.tenant_id IS NOT NULL);

-- View: Active workflows with next run info
CREATE VIEW IF NOT EXISTS v_active_workflows AS
SELECT 
  w.*,
  u.name as created_by_name,
  u.email as created_by_email
FROM workflows w
LEFT JOIN users u ON w.created_by = u.id
WHERE w.status = 'active'
ORDER BY w.next_run ASC;

-- View: User accessible workflows
CREATE VIEW IF NOT EXISTS v_user_workflows AS
SELECT 
  w.*,
  wa.user_id,
  wa.can_view,
  wa.can_execute,
  wa.can_edit,
  wa.can_delete
FROM workflows w
INNER JOIN workflow_access wa ON w.id = wa.workflow_id
WHERE wa.can_view = 1;
