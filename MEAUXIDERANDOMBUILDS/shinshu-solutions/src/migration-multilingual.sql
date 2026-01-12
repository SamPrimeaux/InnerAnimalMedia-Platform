-- Multilingual Support Migration for Shinshu Solutions
-- Adds language support to existing tables

-- ============================================
-- LANGUAGE SUPPORT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS content_translations (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL, -- 'clients', 'properties', 'projects', etc.
  record_id TEXT NOT NULL, -- ID of the record in the original table
  language_code TEXT NOT NULL, -- 'en', 'ja', 'zh', 'ko', etc.
  field_name TEXT NOT NULL, -- 'name', 'description', 'notes', etc.
  translated_value TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(table_name, record_id, language_code, field_name)
);

CREATE INDEX IF NOT EXISTS idx_translations_lookup ON content_translations(table_name, record_id, language_code);
CREATE INDEX IF NOT EXISTS idx_translations_language ON content_translations(language_code);

-- ============================================
-- USER LANGUAGE PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS user_language_preferences (
  id TEXT PRIMARY KEY,
  user_identifier TEXT, -- Can be email, IP hash, or session ID
  preferred_language TEXT DEFAULT 'en',
  fallback_language TEXT DEFAULT 'en',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_lang_pref ON user_language_preferences(user_identifier);

-- ============================================
-- CHATBOT CONVERSATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  language_code TEXT DEFAULT 'en',
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  context_data TEXT, -- JSON: client_id, property_id, etc.
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chatbot_session ON chatbot_conversations(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_language ON chatbot_conversations(language_code);
