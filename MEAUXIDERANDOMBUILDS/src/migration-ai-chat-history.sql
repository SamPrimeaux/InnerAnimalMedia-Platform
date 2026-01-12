-- AI Chat History Table - For storing conversational AI chat sessions
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-ai-chat-history.sql --remote

CREATE TABLE IF NOT EXISTS ai_chat_history (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  metadata_json TEXT, -- JSON: {model, usage, mode, duration_ms, etc.}
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_history_session ON ai_chat_history(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_history_tenant ON ai_chat_history(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_tenant_session ON ai_chat_history(tenant_id, session_id, created_at ASC);
