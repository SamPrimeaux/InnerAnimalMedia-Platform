-- Migration Script: Import relevant data from meauxos database
-- This script migrates important tables from meauxos (legacy) to inneranimalmedia-business (primary)
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-meauxos-data.sql --remote

-- ============================================
-- MIGRATE APPS (Applications Library)
-- ============================================

-- Create apps table if it doesn't exist (might already exist from previous migrations)
CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  category TEXT,
  framework TEXT,
  repo_url TEXT,
  demo_url TEXT,
  preview_image_url TEXT,
  tags_json TEXT, -- JSON array of tags
  status TEXT DEFAULT 'active', -- 'active', 'archived', 'draft'
  featured INTEGER DEFAULT 0, -- 0 = not featured, 1 = featured
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
  -- Note: Foreign key commented out to allow migration without tenants table
  -- FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_apps_tenant ON apps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_apps_slug ON apps(slug);
CREATE INDEX IF NOT EXISTS idx_apps_category ON apps(category);
CREATE INDEX IF NOT EXISTS idx_apps_featured ON apps(featured) WHERE featured = 1;

-- Migrate apps from meauxos (insert only if not exists)
-- Note: In production, you would use a join with MEAUXOS_DB
-- For now, this creates the structure - actual data migration happens via API/worker

-- ============================================
-- MIGRATE WORKFLOWS (Automation Workflows)
-- ============================================

-- Ensure workflows table exists (should already exist)
-- Add any missing columns from meauxos schema

-- ============================================
-- MIGRATE AGENT CONFIGS (MeauxMCP Agent Configurations)
-- ============================================
-- Note: Agent system tables are created in migration-agent-system.sql
-- This section is for data migration only (tables should already exist)

-- Verify agent_configs table exists (created by migration-agent-system.sql)
-- If not exists, tables will be created via that migration first

-- ============================================
-- MIGRATE AI KNOWLEDGE BASE (For MeauxMCP)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_knowledge_base_legacy (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags_json TEXT,
  embedding_json TEXT, -- Vector embeddings if available
  source_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_kb_tenant ON ai_knowledge_base_legacy(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_kb_category ON ai_knowledge_base_legacy(category);

-- ============================================
-- MIGRATE ASSETS (R2 Assets Metadata)
-- ============================================

CREATE TABLE IF NOT EXISTS assets_legacy (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- R2 path
  file_type TEXT, -- 'image', 'video', 'document', 'audio', 'model', etc.
  file_size INTEGER, -- Size in bytes
  mime_type TEXT,
  width INTEGER, -- For images/videos
  height INTEGER, -- For images/videos
  duration INTEGER, -- For videos/audio (in seconds)
  metadata_json TEXT, -- Additional metadata (EXIF, etc.)
  tags_json TEXT,
  folder_path TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assets_tenant ON assets_legacy(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_file_type ON assets_legacy(file_type);
CREATE INDEX IF NOT EXISTS idx_assets_folder ON assets_legacy(folder_path);

-- ============================================
-- MIGRATE CALENDAR EVENTS (If not already migrated)
-- ============================================

-- Calendar events table should already exist, but ensure it has all columns

-- ============================================
-- MIGRATE BRANDS (Brand Presets/Configurations)
-- ============================================

CREATE TABLE IF NOT EXISTS brands_legacy (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  favicon_url TEXT,
  theme_json TEXT, -- Theme configuration
  colors_json TEXT, -- Brand colors
  fonts_json TEXT, -- Font configuration
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_brands_tenant ON brands_legacy(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands_legacy(slug);

-- ============================================
-- MIGRATION TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS migration_log (
  id TEXT PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  source_database TEXT NOT NULL, -- 'meauxos'
  target_database TEXT NOT NULL, -- 'inneranimalmedia-business'
  source_table TEXT,
  target_table TEXT,
  rows_migrated INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  started_at INTEGER,
  completed_at INTEGER,
  error_message TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_migration_log_name ON migration_log(migration_name);
CREATE INDEX IF NOT EXISTS idx_migration_log_status ON migration_log(status);

-- Insert migration log entry for this script
-- Note: Timestamp set to 1704758400 (Jan 9, 2024) - will be updated via API
INSERT OR REPLACE INTO migration_log (
  id,
  migration_name,
  source_database,
  target_database,
  status,
  created_at
) VALUES (
  'migration-meauxos-1704758400',
  'meauxos-data-migration',
  'meauxos',
  'inneranimalmedia-business',
  'pending',
  1704758400
);

-- ============================================
-- NOTES:
-- ============================================
-- 1. This script creates the target table structures
-- 2. Actual data migration should be done via API endpoint /api/migrate/meauxos
-- 3. The worker will read from MEAUXOS_DB binding and insert into DB binding
-- 4. Migration should be done in batches to avoid timeout
-- 5. Use migration_log table to track progress and resume if needed
