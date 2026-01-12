-- Commands & Workflows System - Optimized for Development Workflows
-- Stores CLI commands, templates, and reusable workflows
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/schema-commands-workflows.sql --remote

-- ============================================
-- COMMANDS TABLE (CLI Commands Library)
-- ============================================

CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  command_name TEXT NOT NULL,
  command_template TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  tags TEXT,
  examples TEXT,
  parameters TEXT,
  when_to_use TEXT,
  prerequisites TEXT,
  expected_output TEXT,
  common_errors TEXT,
  related_commands TEXT,
  is_favorite INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  last_used_at INTEGER,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- WORKFLOWS TABLE (Command Sequences)
-- ============================================

CREATE TABLE IF NOT EXISTS dev_workflows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  steps_json TEXT NOT NULL,
  command_sequence TEXT,
  estimated_time_minutes INTEGER,
  success_rate REAL,
  quality_score INTEGER,
  is_template INTEGER DEFAULT 0,
  tags TEXT,
  created_by TEXT,
  last_used_at INTEGER,
  use_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- COMMAND EXECUTIONS (History & Analytics)
-- ============================================

CREATE TABLE IF NOT EXISTS command_executions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  command_id TEXT NOT NULL,
  workflow_id TEXT,
  project_id TEXT,
  command_text TEXT NOT NULL,
  parameters_used TEXT,
  status TEXT NOT NULL,
  output TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  executed_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- ============================================
-- COMMAND TEMPLATES (Parameterized Commands)
-- ============================================

CREATE TABLE IF NOT EXISTS command_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  tool TEXT NOT NULL,
  template_text TEXT NOT NULL,
  variables TEXT NOT NULL,
  description TEXT,
  category TEXT,
  example_values TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_commands_tool ON commands(tool, category);
CREATE INDEX IF NOT EXISTS idx_commands_category ON commands(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_commands_tags ON commands(tenant_id, tags);
CREATE INDEX IF NOT EXISTS idx_commands_favorite ON commands(tenant_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON dev_workflows(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_command_executions_command ON command_executions(command_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_command_executions_user ON command_executions(user_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_command_executions_project ON command_executions(project_id, executed_at DESC);
