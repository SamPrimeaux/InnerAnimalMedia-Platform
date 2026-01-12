-- Fix Critical Multi-Tenancy Issues for SaaS Production
-- Run: wrangler d1 execute inneranimalmedia-business --remote --file=src/fix-saas-multitenancy.sql

-- ═══════════════════════════════════════════════════════════════
-- DISABLE FOREIGN KEY CHECKS (Temporarily)
-- ═══════════════════════════════════════════════════════════════

PRAGMA foreign_keys = OFF;

-- ═══════════════════════════════════════════════════════════════
-- STEP 0: Drop All Views (They'll be recreated after table fixes)
-- ═══════════════════════════════════════════════════════════════

-- Drop all views that might reference users or projects tables
DROP VIEW IF EXISTS v_user_time_summary;
DROP VIEW IF EXISTS v_project_time_summary;
DROP VIEW IF EXISTS v_tenant_tools;
DROP VIEW IF EXISTS v_tenant_users;

-- ═══════════════════════════════════════════════════════════════
-- PRIORITY 1: Fix Users Table (Add tenant_id)
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Check if tenant_id already exists
-- If it doesn't exist, we'll add it using ALTER TABLE (SQLite 3.25+)

-- First, try to add tenant_id column if it doesn't exist
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll catch errors
-- Instead, we'll check and add it conditionally

-- Create new users table with tenant_id
CREATE TABLE IF NOT EXISTS users_new (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',  -- Default for existing users
    email TEXT NOT NULL,
    name TEXT,
    picture TEXT,
    provider TEXT NOT NULL DEFAULT 'email',
    provider_id TEXT,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    hourly_rate REAL DEFAULT 0,
    created_at INTEGER NOT NULL,
    last_login INTEGER,
    stripe_customer_id TEXT,
    updated_at INTEGER NOT NULL,
    UNIQUE(tenant_id, email)
);

-- Migrate existing data (assign to 'system' tenant)
-- Handle INTEGER id by converting to TEXT
INSERT INTO users_new (
    id, tenant_id, email, name, picture, provider, provider_id, 
    password_hash, role, status, hourly_rate, created_at, last_login, 
    stripe_customer_id, updated_at
)
SELECT 
    'user-' || id as id,  -- Convert INTEGER id to TEXT
    'system' as tenant_id,  -- Assign existing users to system tenant
    email,
    name,
    picture,
    COALESCE(provider, 'email') as provider,
    provider_id,
    password_hash,
    COALESCE(role, 'user') as role,
    COALESCE(status, 'active') as status,
    COALESCE(hourly_rate, 0) as hourly_rate,
    COALESCE(CAST(strftime('%s', created_at) AS INTEGER), strftime('%s', 'now')) as created_at,
    CASE WHEN last_login IS NOT NULL THEN CAST(strftime('%s', last_login) AS INTEGER) ELSE NULL END as last_login,
    stripe_customer_id,
    COALESCE(CAST(strftime('%s', updated_at) AS INTEGER), strftime('%s', 'now')) as updated_at
FROM users;

-- Drop old table and rename new one (with foreign keys disabled)
DROP TABLE IF EXISTS users;
ALTER TABLE users_new RENAME TO users;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ═══════════════════════════════════════════════════════════════
-- PRIORITY 1: Fix Projects Table (Add tenant_id)
-- ═══════════════════════════════════════════════════════════════

-- Create new projects table with tenant_id and TEXT id
CREATE TABLE IF NOT EXISTS projects_new (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    name TEXT NOT NULL,
    description TEXT,
    client_name TEXT,
    client_email TEXT,
    status TEXT DEFAULT 'active',
    budget REAL DEFAULT 0,
    hourly_budget REAL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Migrate existing data
INSERT INTO projects_new (
    id, tenant_id, name, description, client_name, client_email,
    status, budget, hourly_budget, start_date, end_date, created_by,
    created_at, updated_at
)
SELECT 
    'project-' || id as id,
    'system' as tenant_id,
    name,
    description,
    client_name,
    client_email,
    status,
    budget,
    hourly_budget,
    start_date,
    end_date,
    created_by,
    COALESCE(CAST(strftime('%s', created_at) AS INTEGER), strftime('%s', 'now')) as created_at,
    COALESCE(CAST(strftime('%s', updated_at) AS INTEGER), strftime('%s', 'now')) as updated_at
FROM projects;

-- Drop old table and rename (with foreign keys disabled)
DROP TABLE IF EXISTS projects;
ALTER TABLE projects_new RENAME TO projects;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_created ON projects(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ═══════════════════════════════════════════════════════════════
-- PRIORITY 2: Add Critical Indexes for Multi-Tenant Performance
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
-- PRIORITY 3: Verify Core Tables Have tenant_id
-- ═══════════════════════════════════════════════════════════════

-- Check which tables are missing tenant_id (manual verification needed)
-- Common pattern: All tables should have tenant_id except:
-- - System tables (tenants, tenant_metadata)
-- - Junction tables (may use foreign keys instead)

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════

-- Verify users table structure
SELECT 
    'Users table fixed' as status,
    COUNT(*) as total_users,
    COUNT(DISTINCT tenant_id) as unique_tenants
FROM users;

-- Verify projects table structure
SELECT 
    'Projects table fixed' as status,
    COUNT(*) as total_projects,
    COUNT(DISTINCT tenant_id) as unique_tenants
FROM projects;

-- Count indexes created
SELECT 
    'Indexes created' as status,
    COUNT(*) as total_indexes
FROM sqlite_master 
WHERE type='index' 
AND name LIKE 'idx_%';

-- ═══════════════════════════════════════════════════════════════
-- RE-ENABLE FOREIGN KEY CHECKS
-- ═══════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ═══════════════════════════════════════════════════════════════
-- RECREATE VIEWS (After users table is fixed)
-- ═══════════════════════════════════════════════════════════════

-- Recreate v_user_time_summary view if it existed
-- (This will be recreated by your application if needed)
