-- Migration: AI Knowledge Base System
-- Stores documents, chunks, embeddings, and metadata for RAG (Retrieval-Augmented Generation)
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-ai-knowledge-base.sql --remote

-- AI Knowledge Base Table (documents, articles, documentation)
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'document', -- 'document', 'article', 'code', 'prompt', 'workflow', 'policy', 'lesson'
    category TEXT, -- 'workflow', 'api', 'design', 'database', 'deployment', 'best_practices'
    source_url TEXT,
    author TEXT,
    metadata_json TEXT DEFAULT '{}', -- JSON: {tags: [], version, language, framework, etc.}
    embedding_model TEXT, -- 'text-embedding-ada-002', 'text-embedding-3-small', etc.
    embedding_vector TEXT, -- JSON array of floats (or base64 encoded for storage)
    chunk_count INTEGER DEFAULT 0, -- Number of chunks created from this document
    token_count INTEGER DEFAULT 0, -- Approximate token count
    is_indexed INTEGER DEFAULT 0, -- 1 = indexed and ready for search
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Knowledge Base Chunks (for RAG - smaller pieces of content with embeddings)
CREATE TABLE IF NOT EXISTS ai_knowledge_chunks (
    id TEXT PRIMARY KEY,
    knowledge_id TEXT NOT NULL, -- FK to ai_knowledge_base.id
    tenant_id TEXT NOT NULL DEFAULT 'system',
    chunk_index INTEGER NOT NULL, -- Order of chunk in document (0-based)
    content TEXT NOT NULL, -- The chunk text
    content_preview TEXT, -- First 200 chars for preview
    token_count INTEGER DEFAULT 0,
    embedding_model TEXT,
    embedding_vector TEXT, -- JSON array of floats (or base64 encoded)
    metadata_json TEXT DEFAULT '{}', -- JSON: {section_title, page_number, code_block, etc.}
    is_indexed INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (knowledge_id) REFERENCES ai_knowledge_base(id) ON DELETE CASCADE
);

-- Suggested Workflows/Pipelines (workflow templates based on knowledge base)
CREATE TABLE IF NOT EXISTS ai_workflow_pipelines (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'development', 'design', 'deployment', 'maintenance', 'onboarding'
    trigger_event TEXT, -- 'manual', 'scheduled', 'webhook', 'api_call'
    stages_json TEXT NOT NULL DEFAULT '[]', -- JSON array: [{stage_number, stage_name, prompt_id, tool_role, expected_duration, dependencies}]
    variables_json TEXT DEFAULT '{}', -- JSON object: {default_variables: {}, required_variables: []}
    knowledge_base_ids_json TEXT DEFAULT '[]', -- JSON array: [knowledge_id1, knowledge_id2] - related docs
    success_criteria TEXT,
    is_template INTEGER DEFAULT 1, -- 1 = template (can be cloned), 0 = instance (running/completed)
    parent_template_id TEXT, -- If instance, reference to template
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'running', 'completed', 'failed'
    execution_history_json TEXT DEFAULT '[]', -- JSON array: [{started_at, completed_at, status, output, error}]
    created_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    started_at INTEGER,
    completed_at INTEGER
);

-- Workflow Pipeline Executions (tracks individual pipeline runs)
CREATE TABLE IF NOT EXISTS ai_workflow_executions (
    id TEXT PRIMARY KEY,
    pipeline_id TEXT NOT NULL, -- FK to ai_workflow_pipelines.id
    tenant_id TEXT NOT NULL DEFAULT 'system',
    execution_number INTEGER NOT NULL, -- 1, 2, 3... (incrementing)
    status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
    input_variables_json TEXT DEFAULT '{}', -- JSON: Variables provided at start
    output_json TEXT DEFAULT '{}', -- JSON: Final output/results
    stage_results_json TEXT DEFAULT '[]', -- JSON array: [{stage_number, stage_name, started_at, completed_at, output, error}]
    error_message TEXT,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    duration_seconds INTEGER, -- calculated: completed_at - started_at
    FOREIGN KEY (pipeline_id) REFERENCES ai_workflow_pipelines(id) ON DELETE CASCADE
);

-- RAG Search History (tracks what was retrieved for learning/improvement)
CREATE TABLE IF NOT EXISTS ai_rag_search_history (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    query_text TEXT NOT NULL,
    query_embedding TEXT, -- JSON array or base64 encoded embedding
    prompt_id TEXT, -- If search was triggered by a prompt execution
    pipeline_id TEXT, -- If search was triggered by a pipeline execution
    retrieved_chunk_ids_json TEXT DEFAULT '[]', -- JSON array: [chunk_id1, chunk_id2, ...]
    retrieval_score_json TEXT DEFAULT '{}', -- JSON: {chunk_id: score, ...}
    context_used TEXT, -- Final context that was used in generation
    was_useful INTEGER, -- User feedback: 1 = useful, 0 = not useful, NULL = no feedback
    feedback_text TEXT,
    created_at INTEGER NOT NULL
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_knowledge_tenant ON ai_knowledge_base(tenant_id, is_active, is_indexed);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON ai_knowledge_base(category, is_active, is_indexed);
CREATE INDEX IF NOT EXISTS idx_knowledge_type ON ai_knowledge_base(content_type, is_active);
CREATE INDEX IF NOT EXISTS idx_chunks_knowledge ON ai_knowledge_chunks(knowledge_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunks_tenant ON ai_knowledge_chunks(tenant_id, is_indexed);
CREATE INDEX IF NOT EXISTS idx_pipelines_tenant ON ai_workflow_pipelines(tenant_id, status, is_template);
CREATE INDEX IF NOT EXISTS idx_pipelines_category ON ai_workflow_pipelines(category, status);
CREATE INDEX IF NOT EXISTS idx_executions_pipeline ON ai_workflow_executions(pipeline_id, execution_number);
CREATE INDEX IF NOT EXISTS idx_rag_history_tenant ON ai_rag_search_history(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rag_history_prompt ON ai_rag_search_history(prompt_id, created_at DESC);
