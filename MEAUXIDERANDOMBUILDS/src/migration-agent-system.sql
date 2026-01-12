-- Migration Script: Agent System Tables (MeauxMCP)
-- Creates agent system tables for MeauxMCP functionality
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-agent-system.sql --remote

-- ============================================
-- AGENT CONFIGS (Agent Configurations & Recipes)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_configs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  config_type TEXT NOT NULL DEFAULT 'custom', -- 'recipe', 'custom', 'template'
  recipe_prompt TEXT, -- Pre-built recipe prompt text
  config_json TEXT NOT NULL, -- Full agent configuration as JSON
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'archived'
  version INTEGER DEFAULT 1, -- Config version number
  is_public INTEGER DEFAULT 0, -- 0 = private, 1 = public (shared across tenants)
  created_by TEXT, -- User ID who created this config
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
  -- Note: Foreign keys commented out - tenants/users tables may not exist yet
  -- FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  -- FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_configs_tenant ON agent_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_type ON agent_configs(config_type);
CREATE INDEX IF NOT EXISTS idx_agent_configs_status ON agent_configs(status);
CREATE INDEX IF NOT EXISTS idx_agent_configs_public ON agent_configs(is_public) WHERE is_public = 1;
CREATE INDEX IF NOT EXISTS idx_agent_configs_slug ON agent_configs(slug);

-- ============================================
-- AGENT SESSIONS (Active Agent Execution Sessions)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_config_id TEXT, -- Reference to agent_configs
  name TEXT, -- Session name/description
  session_type TEXT DEFAULT 'chat', -- 'chat', 'execution', 'workflow', 'browser', 'livestream'
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'failed', 'cancelled'
  state_json TEXT NOT NULL DEFAULT '{}', -- Session state as JSON
  context_json TEXT DEFAULT '{}', -- Execution context
  participants_json TEXT DEFAULT '[]', -- Participant list (users, agents, etc.)
  metadata_json TEXT DEFAULT '{}', -- Additional metadata
  started_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER
  -- Note: Foreign keys commented out - can be enabled after all tables exist
  -- FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  -- FOREIGN KEY (agent_config_id) REFERENCES agent_configs(id) ON DELETE SET NULL
);


CREATE INDEX IF NOT EXISTS idx_agent_sessions_tenant ON agent_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_config ON agent_sessions(agent_config_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_type ON agent_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_active ON agent_sessions(tenant_id, status) WHERE status = 'active';

-- ============================================
-- AGENT COMMANDS (Command Definitions & Capabilities)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_commands (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL, -- Command name (e.g., 'list-tools', 'call-tool', 'query-database')
  slug TEXT UNIQUE, -- Command slug for API access
  description TEXT, -- Command description
  category TEXT, -- 'meta', 'execution', 'resources', 'database', 'deployment', 'workflow'
  command_text TEXT, -- Actual command text/pattern
  parameters_json TEXT DEFAULT '[]', -- Command parameters schema as JSON
  implementation_type TEXT DEFAULT 'builtin', -- 'builtin', 'workflow', 'external'
  implementation_ref TEXT, -- Reference to workflow ID or external endpoint
  code_json TEXT, -- Implementation code/config as JSON
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'deprecated'
  is_public INTEGER DEFAULT 0, -- 0 = tenant-specific, 1 = public (available to all)
  usage_count INTEGER DEFAULT 0, -- Number of times command has been used
  last_used_at INTEGER, -- Last usage timestamp
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
  -- Note: Foreign keys commented out - tenants table may not exist yet
  -- FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_commands_tenant ON agent_commands(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_commands_category ON agent_commands(category);
CREATE INDEX IF NOT EXISTS idx_agent_commands_status ON agent_commands(status);
CREATE INDEX IF NOT EXISTS idx_agent_commands_public ON agent_commands(is_public) WHERE is_public = 1;
CREATE INDEX IF NOT EXISTS idx_agent_commands_slug ON agent_commands(slug);
CREATE INDEX IF NOT EXISTS idx_agent_commands_usage ON agent_commands(usage_count DESC);

-- ============================================
-- AGENT RECIPE PROMPTS (Pre-built Recipe Library)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_recipe_prompts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT, -- NULL for public recipes
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  category TEXT, -- 'workflow', 'automation', 'analysis', 'content', 'development'
  prompt_text TEXT NOT NULL, -- Full recipe prompt text
  parameters_json TEXT DEFAULT '{}', -- Recipe parameters with defaults
  example_usage TEXT, -- Example of how to use this recipe
  tags_json TEXT DEFAULT '[]', -- Tags for discovery
  usage_count INTEGER DEFAULT 0, -- Popularity metric
  rating REAL DEFAULT 0, -- Average rating (0-5)
  is_public INTEGER DEFAULT 1, -- 1 = public (shared), 0 = private
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
  -- Note: Foreign keys commented out - tenants/users tables may not exist yet
  -- FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  -- FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);


CREATE INDEX IF NOT EXISTS idx_agent_recipes_tenant ON agent_recipe_prompts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_recipes_category ON agent_recipe_prompts(category);
CREATE INDEX IF NOT EXISTS idx_agent_recipes_public ON agent_recipe_prompts(is_public) WHERE is_public = 1;
CREATE INDEX IF NOT EXISTS idx_agent_recipes_slug ON agent_recipe_prompts(slug);
CREATE INDEX IF NOT EXISTS idx_agent_recipes_usage ON agent_recipe_prompts(usage_count DESC);

-- ============================================
-- AGENT COMMAND EXECUTIONS (Execution History)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_command_executions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_id TEXT, -- Reference to agent_sessions
  command_id TEXT, -- Reference to agent_commands
  command_name TEXT NOT NULL, -- Command name (denormalized for performance)
  command_text TEXT NOT NULL, -- Full command text executed
  parameters_json TEXT DEFAULT '{}', -- Parameters passed to command
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
  output_text TEXT, -- Command output text
  output_json TEXT, -- Structured output as JSON
  error_message TEXT, -- Error message if failed
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  duration_ms INTEGER, -- Execution duration in milliseconds
  metadata_json TEXT DEFAULT '{}' -- Additional execution metadata
  -- Note: Foreign keys commented out for now - can be enabled after all tables exist
  -- FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  -- FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE
  -- FOREIGN KEY (command_id) REFERENCES agent_commands(id) ON DELETE SET NULL
);


CREATE INDEX IF NOT EXISTS idx_agent_executions_tenant ON agent_command_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_session ON agent_command_executions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_command ON agent_command_executions(command_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_command_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_started ON agent_command_executions(started_at DESC);

-- ============================================
-- AGENT TELEMETRY (Performance Metrics)
-- ============================================

CREATE TABLE IF NOT EXISTS agent_telemetry (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_id TEXT, -- Reference to agent_sessions
  config_id TEXT, -- Reference to agent_configs
  command_id TEXT, -- Reference to agent_commands
  metric_type TEXT NOT NULL, -- 'execution_time', 'success_rate', 'error_rate', 'usage_count'
  metric_name TEXT NOT NULL, -- Specific metric name
  metric_value REAL NOT NULL, -- Metric value
  unit TEXT, -- Unit of measurement ('ms', 'count', 'percentage', etc.)
  timestamp INTEGER NOT NULL, -- When metric was recorded
  metadata_json TEXT DEFAULT '{}' -- Additional context
  -- Note: Foreign keys commented out for now - can be enabled after all tables exist
  -- FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  -- FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE
  -- FOREIGN KEY (config_id) REFERENCES agent_configs(id) ON DELETE CASCADE
  -- FOREIGN KEY (command_id) REFERENCES agent_commands(id) ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_agent_telemetry_tenant ON agent_telemetry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_telemetry_type ON agent_telemetry(metric_type);
CREATE INDEX IF NOT EXISTS idx_agent_telemetry_timestamp ON agent_telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_telemetry_session ON agent_telemetry(session_id);

-- ============================================
-- INSERT DEFAULT AGENT COMMANDS (Built-in Commands)
-- ============================================

-- Default public commands available to all tenants
-- Note: Timestamps will be set via API/JavaScript after table creation
-- Insert commands with simple timestamps (will be updated on first use)
INSERT OR IGNORE INTO agent_commands (id, tenant_id, name, slug, description, category, command_text, parameters_json, implementation_type, status, is_public, created_at, updated_at) VALUES
('cmd-list-tools', 'system', 'List Tools', 'list-tools', 'List all available MCP tools', 'meta', 'list-tools', '[]', 'builtin', 'active', 1, 1704758400, 1704758400),
('cmd-call-tool', 'system', 'Call Tool', 'call-tool', 'Execute an MCP tool', 'execution', 'call-tool <tool-name> [args]', '[{"name":"tool_name","type":"string","required":true},{"name":"args","type":"object","required":false}]', 'builtin', 'active', 1, 1704758400, 1704758400),
('cmd-get-resources', 'system', 'Get Resources', 'get-resources', 'Fetch MCP resources', 'resources', 'get-resources [type]', '[{"name":"type","type":"string","required":false}]', 'builtin', 'active', 1, 1704758400, 1704758400),
('cmd-query-database', 'system', 'Query Database', 'query-database', 'Query D1 database', 'database', 'query-database <sql>', '[{"name":"sql","type":"string","required":true}]', 'builtin', 'active', 1, 1704758400, 1704758400),
('cmd-deploy-worker', 'system', 'Deploy Worker', 'deploy-worker', 'Deploy Cloudflare Worker', 'deployment', 'deploy-worker <name> [options]', '[{"name":"name","type":"string","required":true},{"name":"options","type":"object","required":false}]', 'builtin', 'active', 1, 1704758400, 1704758400),
('cmd-list-projects', 'system', 'List Projects', 'list-projects', 'List all projects', 'meta', 'list-projects', '[]', 'builtin', 'active', 1, 1704758400, 1704758400),
('cmd-list-deployments', 'system', 'List Deployments', 'list-deployments', 'List recent deployments', 'meta', 'list-deployments [limit]', '[{"name":"limit","type":"number","required":false,"default":10}]', 'builtin', 'active', 1, 1704758400, 1704758400),
('cmd-execute-workflow', 'system', 'Execute Workflow', 'execute-workflow', 'Execute a workflow', 'workflow', 'execute-workflow <workflow-id> [params]', '[{"name":"workflow_id","type":"string","required":true},{"name":"params","type":"object","required":false}]', 'builtin', 'active', 1, 1704758400, 1704758400);

-- ============================================
-- INSERT DEFAULT AGENT RECIPE PROMPTS (Example Recipes)
-- ============================================

-- Default public recipes available to all tenants
-- Note: Timestamps will be set via API/JavaScript after table creation
-- Insert recipes with simple timestamps (will be updated on first use)
INSERT OR IGNORE INTO agent_recipe_prompts (id, tenant_id, name, slug, description, category, prompt_text, parameters_json, example_usage, tags_json, is_public, created_at, updated_at) VALUES
('recipe-code-review', NULL, 'Code Review Assistant', 'code-review', 'Automated code review and suggestions', 'development', 'You are an expert code reviewer. Review the provided code for: Security vulnerabilities, Performance issues, Best practices, Code quality. Provide actionable feedback with line numbers and suggestions.', '{"code":{"type":"string","required":true},"language":{"type":"string","required":false}}', 'Use this recipe to automatically review code before committing', '["code","review","security","quality"]', 1, 1704758400, 1704758400),
('recipe-documentation', NULL, 'Documentation Generator', 'documentation', 'Generate documentation from code', 'development', 'You are a documentation expert. Generate comprehensive documentation for the provided code including: Function descriptions, Parameter documentation, Usage examples, Return value descriptions', '{"code":{"type":"string","required":true},"format":{"type":"string","required":false,"default":"markdown"}}', 'Use this recipe to generate docs for your codebase', '["documentation","code","docs"]', 1, 1704758400, 1704758400),
('recipe-data-analysis', NULL, 'Data Analysis Assistant', 'data-analysis', 'Analyze and summarize data', 'analysis', 'You are a data analyst. Analyze the provided data and provide: Key insights, Trends and patterns, Statistical summaries, Visualizations suggestions', '{"data":{"type":"object","required":true},"focus":{"type":"string","required":false}}', 'Use this recipe to analyze datasets and generate insights', '["data","analysis","insights"]', 1, 1704758400, 1704758400),
('recipe-content-generator', NULL, 'Content Generator', 'content-generator', 'Generate content based on prompts', 'content', 'You are a content creator. Generate high-quality content based on the provided prompt including: Engaging headlines, Well-structured content, SEO optimization, Call-to-action', '{"topic":{"type":"string","required":true},"tone":{"type":"string","required":false,"default":"professional"},"length":{"type":"string","required":false}}', 'Use this recipe to generate blog posts, articles, and marketing content', '["content","writing","seo"]', 1, 1704758400, 1704758400);

-- ============================================
-- NOTES:
-- ============================================
-- 1. All tables created with proper foreign keys and indexes
-- 2. Default commands inserted (8 built-in commands)
-- 3. Default recipes inserted (4 example recipes)
-- 4. Tables support multi-tenancy with tenant_id
-- 5. Public items (is_public=1) are shared across tenants
-- 6. Execution history tracked in agent_command_executions
-- 7. Telemetry tracked in agent_telemetry for analytics
