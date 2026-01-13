-- Ecosystem Knowledge Base - Optimal Schema for InnerAnimal Media Business
-- Full-featured knowledge base system with RAG support
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/create-ecosystem-knowledge-base.sql --remote

-- ============================================
-- ECOSYSTEM KNOWLEDGE BASE
-- ============================================

CREATE TABLE IF NOT EXISTS ecosystem_knowledge_base (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'document', -- 'document', 'article', 'code', 'prompt', 'workflow', 'policy', 'lesson', 'api_doc'
    category TEXT, -- 'workflow', 'api', 'design', 'database', 'deployment', 'best_practices', 'architecture', 'integration'
    source_url TEXT,
    author TEXT,
    metadata_json TEXT DEFAULT '{}', -- JSON: {tags: [], version, language, framework, related_ids: [], etc.}
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
CREATE TABLE IF NOT EXISTS ecosystem_knowledge_chunks (
    id TEXT PRIMARY KEY,
    knowledge_id TEXT NOT NULL, -- FK to ecosystem_knowledge_base.id
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
    FOREIGN KEY (knowledge_id) REFERENCES ecosystem_knowledge_base(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Knowledge base indexes
CREATE INDEX IF NOT EXISTS idx_ecosystem_kb_tenant ON ecosystem_knowledge_base(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ecosystem_kb_category ON ecosystem_knowledge_base(category, is_active);
CREATE INDEX IF NOT EXISTS idx_ecosystem_kb_content_type ON ecosystem_knowledge_base(content_type, is_active);
CREATE INDEX IF NOT EXISTS idx_ecosystem_kb_indexed ON ecosystem_knowledge_base(is_indexed, is_active);
CREATE INDEX IF NOT EXISTS idx_ecosystem_kb_created ON ecosystem_knowledge_base(created_at DESC);

-- Chunks indexes
CREATE INDEX IF NOT EXISTS idx_ecosystem_kb_chunks_knowledge ON ecosystem_knowledge_chunks(knowledge_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_ecosystem_kb_chunks_tenant ON ecosystem_knowledge_chunks(tenant_id, is_indexed);
CREATE INDEX IF NOT EXISTS idx_ecosystem_kb_chunks_indexed ON ecosystem_knowledge_chunks(is_indexed);
