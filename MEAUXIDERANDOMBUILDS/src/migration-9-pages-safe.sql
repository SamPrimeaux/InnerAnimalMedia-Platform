-- Migration: Complete 9 Pages Backend - Production Grade Tables (Safe)
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-9-pages-safe.sql --remote
-- This migration safely creates tables, handling existing tables

-- MeauxCAD Models Table
CREATE TABLE IF NOT EXISTS cad_models (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  style TEXT,
  resolution TEXT,
  source TEXT NOT NULL DEFAULT 'upload',
  status TEXT NOT NULL DEFAULT 'processing',
  meshy_task_id TEXT,
  blender_job_id TEXT,
  cloudconvert_job_id TEXT,
  file_path TEXT,
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_cad_models_tenant ON cad_models(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cad_models_status ON cad_models(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cad_models_source ON cad_models(source, created_at DESC);

-- AI Services Table
CREATE TABLE IF NOT EXISTS ai_services (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  config_json TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_ai_services_tenant ON ai_services(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_services_provider ON ai_services(provider, status);

-- API Routes Table (API Gateway) - Use different name to avoid conflicts
CREATE TABLE IF NOT EXISTS api_gateway_routes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  target_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  rate_limit INTEGER DEFAULT 100,
  auth_required INTEGER DEFAULT 1,
  headers_json TEXT,
  transforms_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_api_routes_tenant ON api_gateway_routes(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_api_routes_path ON api_gateway_routes(method, path);

-- Brand Assets Table - Different from existing 'brands' table
CREATE TABLE IF NOT EXISTS brand_assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  file_path TEXT,
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_brand_assets_tenant ON brand_assets(tenant_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_assets_category ON brand_assets(category, created_at DESC);

-- Library Items Table
CREATE TABLE IF NOT EXISTS library_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  category TEXT,
  tags TEXT,
  file_path TEXT,
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_library_items_tenant ON library_items(tenant_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_items_category ON library_items(category, created_at DESC);

-- Work Items Table (MeauxWork)
CREATE TABLE IF NOT EXISTS work_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  assigned_to TEXT,
  due_date INTEGER,
  completed_at INTEGER,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_work_items_tenant ON work_items(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_items_assigned ON work_items(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_work_items_due_date ON work_items(due_date, status);

-- Team Members Table - Check if it needs tenant_id column
-- Note: team_members may already exist with different schema
-- We'll work with existing schema in application code if needed
-- For now, create a new team_members_enhanced table if needed
-- Or use existing team_members and add tenant_id handling in application

-- Users Table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
