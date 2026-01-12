-- Migration: AI Prompts Library System
-- Stores workflow prompts, tool roles, and stage definitions for predictable AI agent behavior
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-ai-prompts-library.sql --remote

-- AI Prompts Library Table
CREATE TABLE IF NOT EXISTS ai_prompts_library (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, -- 'workflow', 'design', 'api', 'database', 'qa', '3d', 'router'
    description TEXT,
    prompt_template TEXT NOT NULL, -- Template with {{variable}} placeholders
    variables_json TEXT DEFAULT '[]', -- JSON array of variable names
    tool_role TEXT, -- 'chatgpt', 'claude', 'cursor', 'gemini', 'cloudflare', 'cloudconvert', 'meshy', 'blender'
    stage INTEGER, -- 0=Intake, 1=Spec, 2=Design, 3=Build, 4=QA, 5=Ship
    company TEXT, -- NULL = universal, or specific company
    version TEXT DEFAULT '1.0',
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Tool Role Definitions Table
CREATE TABLE IF NOT EXISTS ai_tool_roles (
    id TEXT PRIMARY KEY,
    tool_name TEXT NOT NULL UNIQUE, -- 'chatgpt', 'claude', 'cursor', etc.
    role_description TEXT NOT NULL,
    responsibilities_json TEXT DEFAULT '[]', -- JSON array of responsibilities
    strengths_json TEXT DEFAULT '[]', -- JSON array of strengths
    limitations_json TEXT DEFAULT '[]', -- JSON array of limitations
    preferred_stages_json TEXT DEFAULT '[]', -- JSON array of stage numbers [0,1,2,3,4,5]
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Workflow Stages Table (defines the 6-stage pipeline)
CREATE TABLE IF NOT EXISTS workflow_stages (
    id TEXT PRIMARY KEY,
    stage_number INTEGER NOT NULL UNIQUE, -- 0-5
    stage_name TEXT NOT NULL, -- 'Intake', 'Spec', 'Design', 'Build', 'QA', 'Ship'
    stage_description TEXT,
    duration_minutes INTEGER, -- Typical duration
    deliverables_json TEXT DEFAULT '[]', -- JSON array of expected deliverables
    acceptance_criteria TEXT,
    handoff_instructions TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Indexes for fast lookup (created after tables exist)
-- Note: Indexes are created separately after table creation to avoid issues
