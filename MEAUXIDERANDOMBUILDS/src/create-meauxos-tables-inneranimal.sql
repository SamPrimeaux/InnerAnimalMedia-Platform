-- Migration: MeauxOS Tables to InnerAnimal Media Business Database
-- Creates optimal, production-ready versions of tables from meauxos database
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/create-meauxos-tables-inneranimal.sql --remote

-- ============================================
-- FUNDRAISING & GRANTS SYSTEM
-- ============================================

-- Fundraising Tasks (v1 - modern version with tenant support)
CREATE TABLE IF NOT EXISTS fundraising_tasks_v1 (
    task_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    
    campaign_id TEXT,
    grant_id TEXT,
    application_id TEXT,
    
    title TEXT NOT NULL,
    description TEXT,
    
    status TEXT NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
    
    priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    assigned_to TEXT,
    due_at INTEGER,
    
    tags TEXT, -- JSON array or comma-separated
    meta_json TEXT DEFAULT '{}', -- JSON: additional metadata
    
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Grant Knowledge Base Chunks (v1 - modern version)
CREATE TABLE IF NOT EXISTS grant_kb_chunks_v1 (
    chunk_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    
    category TEXT NOT NULL DEFAULT 'internal_note'
        CHECK (category IN ('grant_guidelines', 'past_application', 'funder_profile', 'internal_note', 'faq', 'policy')),
    
    source_type TEXT,
    source_ref TEXT,
    
    tags TEXT,
    meta_json TEXT DEFAULT '{}',
    
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Grant Opportunities (v1 - modern version with tenant support)
CREATE TABLE IF NOT EXISTS grant_opportunities_v1 (
    grant_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    
    campaign_id TEXT,
    
    title TEXT NOT NULL,
    funder_name TEXT NOT NULL,
    funder_type TEXT NOT NULL DEFAULT 'foundation'
        CHECK (funder_type IN ('foundation', 'government', 'corporate', 'nonprofit', 'individual')),
    
    min_award_cents INTEGER,
    max_award_cents INTEGER,
    
    opened_at INTEGER,
    deadline_at INTEGER,
    
    status TEXT NOT NULL DEFAULT 'research'
        CHECK (status IN ('research', 'eligible', 'applying', 'submitted', 'awarded', 'rejected', 'closed')),
    
    eligibility_notes TEXT,
    requirements_json TEXT DEFAULT '{}',
    source_url TEXT,
    
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Grant Templates (v1 - modern version)
CREATE TABLE IF NOT EXISTS grant_templates_v1 (
    template_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    
    name TEXT NOT NULL,
    template_type TEXT NOT NULL
        CHECK (template_type IN ('proposal', 'budget', 'impact_statement', 'cover_letter', 'follow_up_email', 'reporting')),
    
    content_md TEXT NOT NULL,
    tags TEXT,
    meta_json TEXT DEFAULT '{}',
    
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================
-- INFRASTRUCTURE DOCUMENTATION
-- ============================================

-- Infrastructure Documentation
CREATE TABLE IF NOT EXISTS infrastructure_documentation (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    bucket_name TEXT NOT NULL DEFAULT 'allinfrastructure',
    r2_key TEXT NOT NULL,
    title TEXT NOT NULL,
    file_type TEXT, -- 'markdown', 'json', 'image', 'pdf', etc.
    category TEXT, -- 'analytics', 'r2-setup', 'database', 'onboarding', 'api', etc.
    size_bytes INTEGER,
    content_preview TEXT, -- First 500 chars
    r2_object_id TEXT,
    tags TEXT, -- JSON array or comma-separated
    last_synced_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(tenant_id, r2_key)
);

-- Infrastructure Metadata
CREATE TABLE IF NOT EXISTS infrastructure_metadata (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    metadata_type TEXT NOT NULL, -- 'infrastructure-map', 'team-directory', 'config', 'architecture', etc.
    bucket_name TEXT NOT NULL DEFAULT 'allinfrastructure',
    r2_key TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    version TEXT,
    last_synced_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(tenant_id, r2_key)
);

-- ============================================
-- KANBAN SYSTEM
-- ============================================

-- Kanban Boards
CREATE TABLE IF NOT EXISTS kanban_boards (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT,
    board_type TEXT DEFAULT 'project', -- 'project', 'campaign', 'workflow', etc.
    config_json TEXT DEFAULT '{}', -- JSON: columns config, colors, etc.
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Kanban Columns (needed for kanban_tasks foreign key)
CREATE TABLE IF NOT EXISTS kanban_columns (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    color TEXT,
    config_json TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (board_id) REFERENCES kanban_boards(id) ON DELETE CASCADE
);

-- Kanban Tasks
CREATE TABLE IF NOT EXISTS kanban_tasks (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    board_id TEXT NOT NULL,
    column_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('html', 'worker', 'content', 'client', 'system', 'api', 'database', 'design')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee_id TEXT,
    client_name TEXT,
    project_url TEXT,
    bindings TEXT,
    due_date INTEGER,
    position INTEGER NOT NULL DEFAULT 0,
    tags TEXT,
    meta_json TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER,
    FOREIGN KEY (board_id) REFERENCES kanban_boards(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE SET NULL
);

-- ============================================
-- MEAUXACCESS COMMANDS
-- ============================================

-- MeauxAccess Commands
CREATE TABLE IF NOT EXISTS meauxaccess_commands (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'workflow', 'data', 'api', 'system', etc.
    command_json TEXT DEFAULT '{}', -- JSON: command structure, parameters, etc.
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(tenant_id, code)
);

-- ============================================
-- APP METADATA
-- ============================================

-- MeauxOS App Metadata
CREATE TABLE IF NOT EXISTS meauxos_app_metadata (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    app_name TEXT NOT NULL,
    slug TEXT NOT NULL,
    category TEXT NOT NULL,
    icon_name TEXT,
    status TEXT DEFAULT 'live' CHECK (status IN ('live', 'dev', 'maintenance', 'archived')),
    url TEXT,
    description TEXT,
    config_json TEXT DEFAULT '{}', -- JSON: settings, integrations, etc.
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(tenant_id, slug)
);

-- ============================================
-- MEDIA GALLERY
-- ============================================

-- Media Gallery
CREATE TABLE IF NOT EXISTS media_gallery (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    description TEXT,
    media_url TEXT NOT NULL,
    media_type TEXT CHECK(media_type IN ('image', 'video', 'audio', 'document')) DEFAULT 'image',
    category TEXT CHECK(category IN ('campaign', 'founder', 'community', 'event', 'partner', 'general', 'product', 'service')),
    related_campaign_id TEXT,
    r2_key TEXT,
    r2_bucket TEXT DEFAULT 'inneranimalmedia-assets',
    file_size INTEGER,
    mime_type TEXT,
    width INTEGER, -- For images/videos
    height INTEGER, -- For images/videos
    duration INTEGER, -- For videos/audio (seconds)
    tags TEXT, -- JSON array or comma-separated
    is_featured INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================
-- PROGRAM GOALS
-- ============================================

-- Program Goals
CREATE TABLE IF NOT EXISTS program_goals (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    program_name TEXT NOT NULL,
    goal_title TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'fundraising', 'outreach', 'program', 'capacity', etc.
    target_value REAL,
    current_value REAL DEFAULT 0,
    unit TEXT, -- 'dollars', 'people', 'percent', 'events', etc.
    deadline INTEGER,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
    progress_percent REAL DEFAULT 0,
    related_campaign_id TEXT,
    related_grant_id TEXT,
    tags TEXT,
    meta_json TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Fundraising Tasks indexes
CREATE INDEX IF NOT EXISTS idx_fundraising_tasks_v1_tenant ON fundraising_tasks_v1(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fundraising_tasks_v1_grant ON fundraising_tasks_v1(grant_id, status);
CREATE INDEX IF NOT EXISTS idx_fundraising_tasks_v1_campaign ON fundraising_tasks_v1(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fundraising_tasks_v1_assigned ON fundraising_tasks_v1(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_fundraising_tasks_v1_due ON fundraising_tasks_v1(due_at) WHERE due_at IS NOT NULL;

-- Grant KB Chunks indexes
CREATE INDEX IF NOT EXISTS idx_grant_kb_chunks_v1_tenant ON grant_kb_chunks_v1(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_grant_kb_chunks_v1_category ON grant_kb_chunks_v1(category);

-- Grant Opportunities indexes
CREATE INDEX IF NOT EXISTS idx_grant_opportunities_v1_tenant ON grant_opportunities_v1(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_grant_opportunities_v1_status ON grant_opportunities_v1(status, deadline_at);
CREATE INDEX IF NOT EXISTS idx_grant_opportunities_v1_funder ON grant_opportunities_v1(funder_type, status);
CREATE INDEX IF NOT EXISTS idx_grant_opportunities_v1_deadline ON grant_opportunities_v1(deadline_at) WHERE deadline_at IS NOT NULL;

-- Grant Templates indexes
CREATE INDEX IF NOT EXISTS idx_grant_templates_v1_tenant ON grant_templates_v1(tenant_id, template_type);
CREATE INDEX IF NOT EXISTS idx_grant_templates_v1_type ON grant_templates_v1(template_type);

-- Infrastructure Documentation indexes
CREATE INDEX IF NOT EXISTS idx_infrastructure_doc_tenant ON infrastructure_documentation(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_infrastructure_doc_category ON infrastructure_documentation(category);
CREATE INDEX IF NOT EXISTS idx_infrastructure_doc_r2_key ON infrastructure_documentation(r2_key);

-- Infrastructure Metadata indexes
CREATE INDEX IF NOT EXISTS idx_infrastructure_meta_tenant ON infrastructure_metadata(tenant_id, metadata_type);
CREATE INDEX IF NOT EXISTS idx_infrastructure_meta_type ON infrastructure_metadata(metadata_type);

-- Kanban indexes
CREATE INDEX IF NOT EXISTS idx_kanban_boards_tenant ON kanban_boards(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_owner ON kanban_boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board ON kanban_columns(board_id, position);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_board ON kanban_tasks(board_id, column_id, position);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_tenant ON kanban_tasks(tenant_id, column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_assignee ON kanban_tasks(assignee_id, column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_due ON kanban_tasks(due_date) WHERE due_date IS NOT NULL;

-- MeauxAccess Commands indexes
CREATE INDEX IF NOT EXISTS idx_meauxaccess_commands_tenant ON meauxaccess_commands(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_meauxaccess_commands_code ON meauxaccess_commands(code);
CREATE INDEX IF NOT EXISTS idx_meauxaccess_commands_category ON meauxaccess_commands(category);

-- App Metadata indexes
CREATE INDEX IF NOT EXISTS idx_meauxos_app_meta_tenant ON meauxos_app_metadata(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_meauxos_app_meta_category ON meauxos_app_metadata(category, status);
CREATE INDEX IF NOT EXISTS idx_meauxos_app_meta_slug ON meauxos_app_metadata(slug);

-- Media Gallery indexes
CREATE INDEX IF NOT EXISTS idx_media_gallery_tenant ON media_gallery(tenant_id, category, is_active);
CREATE INDEX IF NOT EXISTS idx_media_gallery_category ON media_gallery(category, is_featured);
CREATE INDEX IF NOT EXISTS idx_media_gallery_campaign ON media_gallery(related_campaign_id);
CREATE INDEX IF NOT EXISTS idx_media_gallery_featured ON media_gallery(is_featured, display_order) WHERE is_featured = 1;

-- Program Goals indexes
CREATE INDEX IF NOT EXISTS idx_program_goals_tenant ON program_goals(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_program_goals_status ON program_goals(status, deadline);
CREATE INDEX IF NOT EXISTS idx_program_goals_campaign ON program_goals(related_campaign_id);
CREATE INDEX IF NOT EXISTS idx_program_goals_category ON program_goals(category, status);
