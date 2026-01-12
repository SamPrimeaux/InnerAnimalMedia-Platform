-- Migration: Merge relevant tables from meauxos to inneranimalmedia-business
-- This script identifies and migrates useful data from the meauxos database
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-meauxos-merge.sql --remote

-- ============================================
-- AI/AGENT TABLES (from meauxos)
-- ============================================

-- Agent Sessions (MCP/Agent sessions)
CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT,
  session_type TEXT DEFAULT 'mcp', -- 'mcp', 'agent', 'workflow'
  status TEXT DEFAULT 'active',
  config_json TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_tenant ON agent_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_type ON agent_sessions(session_type);

-- Agent Commands (command history)
CREATE TABLE IF NOT EXISTS agent_commands (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  command_text TEXT NOT NULL,
  command_type TEXT, -- 'mcp', 'workflow', 'execution'
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  result_json TEXT,
  error_text TEXT,
  executed_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_commands_session ON agent_commands(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_commands_status ON agent_commands(status);

-- Agent Configs (agent configurations)
CREATE TABLE IF NOT EXISTS agent_configs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT NOT NULL,
  agent_type TEXT DEFAULT 'mcp', -- 'mcp', 'workflow', 'automation'
  config_json TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_configs_tenant ON agent_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_active ON agent_configs(tenant_id, is_active);

-- ============================================
-- AI CONVERSATIONS (from meauxos)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT,
  conversation_type TEXT DEFAULT 'chat', -- 'chat', 'code', 'analysis'
  title TEXT,
  model TEXT, -- 'claude', 'gpt-4', 'gemini'
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_messages(created_at);

-- ============================================
-- ANALYTICS TABLES (from meauxos)
-- ============================================

CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  event_type TEXT NOT NULL, -- 'page_view', 'api_call', 'workflow_execution', etc.
  event_name TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  properties_json TEXT, -- Event properties (JSON)
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant ON analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at);

-- ============================================
-- ASSETS TABLES (from meauxos)
-- ============================================

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT NOT NULL,
  asset_type TEXT, -- 'image', 'video', 'document', 'audio'
  file_path TEXT,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  metadata_json TEXT,
  tags_json TEXT, -- Array of tags (JSON)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_tenant ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);

-- ============================================
-- API INTEGRATIONS (from meauxos - merge with external_connections)
-- ============================================

-- This table extends external_connections with additional fields from meauxos api_integrations
-- We'll merge relevant fields into existing external_connections table

-- Activity Logs (audit trail)
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'execute'
  resource_type TEXT NOT NULL, -- 'project', 'workflow', 'deployment', etc.
  resource_id TEXT,
  details_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- Note: Many meauxos tables are already covered by inneranimalmedia-business schema:
-- - tools (covered by tools table)
-- - workflows (covered by workflows table)
-- - projects (covered by projects table)
-- - deployments (covered by deployments table)
-- - users/tenants (covered by users/tenants tables)
-- - external_connections (covered by external_connections table)
