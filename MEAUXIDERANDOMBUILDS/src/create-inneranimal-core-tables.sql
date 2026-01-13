-- Core InnerAnimal Media Business Tables
-- Creates optimal, production-ready versions of core platform tables
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/create-inneranimal-core-tables.sql --remote

-- ============================================
-- PROMPT TEMPLATES
-- ============================================

-- Prompt Templates
CREATE TABLE IF NOT EXISTS prompt_templates (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL DEFAULT 'system' CHECK (template_type IN ('system', 'user', 'workflow', 'api', 'ai', 'custom')),
    category TEXT, -- 'conversation', 'code', 'content', 'analysis', 'translation', 'summarization', etc.
    content TEXT NOT NULL, -- The prompt template content (with {{variables}})
    variables_json TEXT DEFAULT '{}', -- JSON: {variable_name: {type, description, default}, ...}
    model_preference TEXT, -- 'gpt-4', 'claude-3', 'gemini', etc.
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER,
    is_public INTEGER DEFAULT 0, -- 1 = available to all tenants
    is_active INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    tags TEXT, -- JSON array or comma-separated
    meta_json TEXT DEFAULT '{}', -- JSON: additional metadata
    created_by TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(tenant_id, name)
);

-- ============================================
-- R2 STORAGE
-- ============================================

-- R2 Buckets
CREATE TABLE IF NOT EXISTS r2_buckets (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    bucket_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    region TEXT DEFAULT 'auto',
    public_access INTEGER DEFAULT 0, -- 1 = public bucket
    cors_enabled INTEGER DEFAULT 0,
    cors_config_json TEXT DEFAULT '{}', -- JSON: CORS configuration
    lifecycle_rules_json TEXT DEFAULT '{}', -- JSON: lifecycle rules
    is_active INTEGER DEFAULT 1,
    total_objects INTEGER DEFAULT 0,
    total_size_bytes INTEGER DEFAULT 0,
    created_by TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- R2 Objects
CREATE TABLE IF NOT EXISTS r2_objects (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    bucket_id TEXT NOT NULL,
    object_key TEXT NOT NULL, -- Full path/key in R2
    display_name TEXT, -- Human-readable name
    content_type TEXT, -- MIME type
    file_size INTEGER,
    etag TEXT, -- MD5 hash
    checksum TEXT, -- Additional checksum if available
    metadata_json TEXT DEFAULT '{}', -- JSON: user metadata
    r2_metadata_json TEXT DEFAULT '{}', -- JSON: R2 system metadata
    is_public INTEGER DEFAULT 0, -- 1 = publicly accessible
    public_url TEXT, -- CDN URL if public
    version TEXT, -- Object version if versioning enabled
    storage_class TEXT DEFAULT 'STANDARD', -- STANDARD, INFREQUENT_ACCESS, etc.
    tags TEXT, -- JSON array or comma-separated
    category TEXT, -- 'image', 'video', 'document', 'asset', 'backup', etc.
    uploaded_by TEXT,
    is_active INTEGER DEFAULT 1,
    last_accessed_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (bucket_id) REFERENCES r2_buckets(id) ON DELETE CASCADE,
    UNIQUE(bucket_id, object_key)
);

-- ============================================
-- SETTINGS
-- ============================================

-- Settings (Key-Value Configuration)
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    setting_key TEXT NOT NULL,
    setting_value TEXT, -- Can be JSON string for complex values
    value_type TEXT DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'array', 'object')),
    category TEXT, -- 'general', 'security', 'api', 'ui', 'billing', 'integrations', etc.
    description TEXT,
    is_public INTEGER DEFAULT 0, -- 1 = visible to all tenants
    is_encrypted INTEGER DEFAULT 0, -- 1 = value is encrypted
    is_readonly INTEGER DEFAULT 0, -- 1 = cannot be modified via UI
    validation_json TEXT DEFAULT '{}', -- JSON: validation rules
    default_value TEXT,
    tags TEXT,
    meta_json TEXT DEFAULT '{}',
    is_active INTEGER DEFAULT 1,
    created_by TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(tenant_id, setting_key)
);

-- ============================================
-- SUPERADMIN ACCOUNTS
-- ============================================

-- Superadmin Accounts
CREATE TABLE IF NOT EXISTS superadmin_accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    user_id TEXT, -- Link to users.id if account exists
    role TEXT DEFAULT 'superadmin' CHECK (role IN ('superadmin', 'admin', 'support')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    permissions_json TEXT DEFAULT '{}', -- JSON: specific permissions
    access_levels_json TEXT DEFAULT '{}', -- JSON: access levels for different systems
    notes TEXT, -- Admin notes about this account
    last_login_at INTEGER,
    last_activity_at INTEGER,
    email_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    mfa_enabled INTEGER DEFAULT 0,
    mfa_secret TEXT, -- Encrypted MFA secret
    recovery_codes TEXT, -- Encrypted recovery codes (JSON array)
    created_by TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================
-- TASKS (General Task Management)
-- ============================================

-- Tasks (Generic task management - separate from fundraising_tasks_v1)
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    task_type TEXT DEFAULT 'general' CHECK (task_type IN ('general', 'project', 'maintenance', 'support', 'bug', 'feature', 'content', 'marketing')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'blocked', 'done', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'critical')),
    assignee_id TEXT,
    assignee_email TEXT, -- For external assignees
    reporter_id TEXT,
    due_date INTEGER,
    start_date INTEGER,
    completed_date INTEGER,
    estimated_hours REAL,
    actual_hours REAL,
    progress_percent INTEGER DEFAULT 0,
    tags TEXT, -- JSON array or comma-separated
    category TEXT,
    project_id TEXT,
    parent_task_id TEXT, -- For subtasks
    related_entity_type TEXT, -- 'campaign', 'grant', 'project', etc.
    related_entity_id TEXT,
    attachments_json TEXT DEFAULT '[]', -- JSON array of attachment URLs/keys
    comments_count INTEGER DEFAULT 0,
    watchers_json TEXT DEFAULT '[]', -- JSON array of user IDs watching this task
    meta_json TEXT DEFAULT '{}',
    created_by TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================
-- TEAMS
-- ============================================

-- Teams
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    team_type TEXT DEFAULT 'department' CHECK (team_type IN ('department', 'project', 'functional', 'cross-functional', 'external')),
    avatar_url TEXT,
    color TEXT, -- Hex color for UI
    settings_json TEXT DEFAULT '{}', -- JSON: team settings
    permissions_json TEXT DEFAULT '{}', -- JSON: team permissions
    is_active INTEGER DEFAULT 1,
    is_public INTEGER DEFAULT 0, -- 1 = visible to all users in tenant
    member_count INTEGER DEFAULT 0,
    owner_id TEXT,
    created_by TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(tenant_id, slug)
);

-- Team Members (Junction table)
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'guest')),
    permissions_json TEXT DEFAULT '{}', -- JSON: individual member permissions
    joined_at INTEGER NOT NULL DEFAULT (unixepoch()),
    invited_by TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'removed')),
    UNIQUE(team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- ============================================
-- UI GUIDELINES
-- ============================================

-- UI Guidelines
CREATE TABLE IF NOT EXISTS ui_guidelines (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    guideline_type TEXT NOT NULL CHECK (guideline_type IN ('design_system', 'component', 'pattern', 'accessibility', 'content', 'brand', 'interaction')),
    title TEXT NOT NULL,
    description TEXT,
    content_md TEXT NOT NULL, -- Markdown content
    content_html TEXT, -- Rendered HTML (cached)
    category TEXT, -- 'colors', 'typography', 'spacing', 'buttons', 'forms', etc.
    tags TEXT, -- JSON array or comma-separated
    examples_json TEXT DEFAULT '[]', -- JSON array of example code/configs
    references_json TEXT DEFAULT '[]', -- JSON array of reference links
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'deprecated', 'archived')),
    version TEXT,
    applies_to TEXT, -- 'all', 'dashboard', 'public', 'admin', etc.
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    review_date INTEGER, -- Next review date
    reviewed_by TEXT,
    last_reviewed_at INTEGER,
    meta_json TEXT DEFAULT '{}',
    created_by TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================
-- USER SECRETS (Encrypted Secret Storage)
-- ============================================

-- User Secrets
CREATE TABLE IF NOT EXISTS user_secrets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    secret_name TEXT NOT NULL,
    secret_value_encrypted TEXT NOT NULL, -- Encrypted secret value
    secret_type TEXT DEFAULT 'api_key' CHECK (secret_type IN ('api_key', 'password', 'token', 'credential', 'certificate', 'custom')),
    description TEXT,
    service_name TEXT, -- 'github', 'openai', 'stripe', etc.
    is_active INTEGER DEFAULT 1,
    expires_at INTEGER, -- Expiration timestamp
    last_used_at INTEGER,
    usage_count INTEGER DEFAULT 0,
    scopes_json TEXT DEFAULT '[]', -- JSON array of scopes/permissions
    metadata_json TEXT DEFAULT '{}', -- JSON: additional metadata (non-sensitive)
    tags TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, secret_name, service_name)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Prompt Templates indexes
CREATE INDEX IF NOT EXISTS idx_prompt_templates_tenant ON prompt_templates(tenant_id, template_type, is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_type ON prompt_templates(template_type, category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category, is_public);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_public ON prompt_templates(is_public, is_active) WHERE is_public = 1;

-- R2 Buckets indexes
CREATE INDEX IF NOT EXISTS idx_r2_buckets_tenant ON r2_buckets(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_r2_buckets_name ON r2_buckets(bucket_name);
CREATE INDEX IF NOT EXISTS idx_r2_buckets_public ON r2_buckets(public_access);

-- R2 Objects indexes
CREATE INDEX IF NOT EXISTS idx_r2_objects_bucket ON r2_objects(bucket_id, object_key);
CREATE INDEX IF NOT EXISTS idx_r2_objects_tenant ON r2_objects(tenant_id, category, is_active);
CREATE INDEX IF NOT EXISTS idx_r2_objects_category ON r2_objects(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_r2_objects_public ON r2_objects(is_public, bucket_id) WHERE is_public = 1;
CREATE INDEX IF NOT EXISTS idx_r2_objects_uploaded ON r2_objects(uploaded_by, created_at DESC);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_tenant ON settings(tenant_id, category, is_active);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(setting_key, tenant_id);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category, is_public);

-- Superadmin Accounts indexes
CREATE INDEX IF NOT EXISTS idx_superadmin_accounts_email ON superadmin_accounts(email);
CREATE INDEX IF NOT EXISTS idx_superadmin_accounts_status ON superadmin_accounts(status, role);
CREATE INDEX IF NOT EXISTS idx_superadmin_accounts_user ON superadmin_accounts(user_id) WHERE user_id IS NOT NULL;

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id, status) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id, status) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date, status) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_related ON tasks(related_entity_type, related_entity_id) WHERE related_entity_id IS NOT NULL;

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_tenant ON teams(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_teams_type ON teams(team_type, is_active);
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id) WHERE owner_id IS NOT NULL;

-- Team Members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id, status);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_team_members_tenant ON team_members(tenant_id, role);

-- UI Guidelines indexes
CREATE INDEX IF NOT EXISTS idx_ui_guidelines_tenant ON ui_guidelines(tenant_id, guideline_type, status);
CREATE INDEX IF NOT EXISTS idx_ui_guidelines_type ON ui_guidelines(guideline_type, category, status);
CREATE INDEX IF NOT EXISTS idx_ui_guidelines_category ON ui_guidelines(category, status);
CREATE INDEX IF NOT EXISTS idx_ui_guidelines_applies_to ON ui_guidelines(applies_to, status);

-- User Secrets indexes
CREATE INDEX IF NOT EXISTS idx_user_secrets_user ON user_secrets(user_id, secret_type, is_active);
CREATE INDEX IF NOT EXISTS idx_user_secrets_service ON user_secrets(service_name, is_active);
CREATE INDEX IF NOT EXISTS idx_user_secrets_tenant ON user_secrets(tenant_id, secret_type);
CREATE INDEX IF NOT EXISTS idx_user_secrets_expires ON user_secrets(expires_at, is_active) WHERE expires_at IS NOT NULL;
