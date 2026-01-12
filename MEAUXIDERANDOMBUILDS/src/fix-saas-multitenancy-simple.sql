-- Fix Critical Multi-Tenancy Issues - SIMPLE VERSION
-- Uses ALTER TABLE instead of table recreation (safer for production)
-- Run: wrangler d1 execute inneranimalmedia-business --remote --file=src/fix-saas-multitenancy-simple.sql

-- ═══════════════════════════════════════════════════════════════
-- STEP 1: Add tenant_id to users table (if not exists)
-- ═══════════════════════════════════════════════════════════════

-- Check if column exists first by trying to add it
-- SQLite will error if column exists, but we'll catch that
-- For D1, we'll just try to add it

-- Add tenant_id column to users (with default value)
-- If column already exists, this will fail - that's okay
ALTER TABLE users ADD COLUMN tenant_id TEXT DEFAULT 'system';

-- Create unique constraint on (tenant_id, email)
-- Note: SQLite doesn't support ADD CONSTRAINT, so we'll create an index
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);

-- Create other indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ═══════════════════════════════════════════════════════════════
-- STEP 2: Add tenant_id to projects table (if not exists)
-- ═══════════════════════════════════════════════════════════════

-- Add tenant_id column to projects (with default value)
-- If column already exists, this will fail - that's okay
ALTER TABLE projects ADD COLUMN tenant_id TEXT DEFAULT 'system';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_created ON projects(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ═══════════════════════════════════════════════════════════════
-- STEP 3: Add Critical Indexes for Multi-Tenant Performance
-- ═══════════════════════════════════════════════════════════════

-- Agent System Indexes
CREATE INDEX IF NOT EXISTS idx_agent_configs_tenant ON agent_configs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_commands_tenant ON agent_commands(tenant_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_tenant ON agent_sessions(tenant_id, created_at DESC);

-- AI System Indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_tenant ON ai_chat_history(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_tenant ON ai_knowledge_base(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_library_tenant ON ai_prompts_library(tenant_id, is_active);

-- Activity/Logging Indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_tenant ON activity_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_tenant ON activity_events(tenant_id, event_type, created_at DESC);

-- Calendar Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant ON calendar_events(tenant_id, start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id, start_time);

-- Content/CMS Indexes
CREATE INDEX IF NOT EXISTS idx_content_items_tenant ON content_items(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_assets_tenant ON cms_assets(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_collections_tenant ON cms_collections(tenant_id, is_active);

-- Cost Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_cost_tracking_tenant ON cost_tracking(tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_project ON cost_tracking(project_id, date DESC);

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════

-- Verify users table
SELECT 
    'Users table fixed' as status,
    COUNT(*) as total_users,
    COUNT(DISTINCT tenant_id) as unique_tenants,
    COUNT(*) - COUNT(tenant_id) as null_tenant_ids
FROM users;

-- Verify projects table
SELECT 
    'Projects table fixed' as status,
    COUNT(*) as total_projects,
    COUNT(DISTINCT tenant_id) as unique_tenants,
    COUNT(*) - COUNT(tenant_id) as null_tenant_ids
FROM projects;

-- Count indexes created
SELECT 
    'Indexes created' as status,
    COUNT(*) as total_indexes
FROM sqlite_master 
WHERE type='index' 
AND name LIKE 'idx_%';
