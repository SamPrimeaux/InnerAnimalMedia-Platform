-- Knowledge Base for Chatbot Training
-- Stores structured information for AI chatbot context

CREATE TABLE IF NOT EXISTS knowledge_base (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL, -- 'service', 'faq', 'company', 'area', 'process'
  language_code TEXT DEFAULT 'en', -- 'en', 'ja', 'zh', 'ko'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT, -- Comma-separated keywords for search
  priority INTEGER DEFAULT 0, -- Higher priority = more important
  metadata TEXT, -- JSON: related_ids, tags, etc.
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category, language_code);
CREATE INDEX IF NOT EXISTS idx_kb_language ON knowledge_base(language_code);
CREATE INDEX IF NOT EXISTS idx_kb_priority ON knowledge_base(priority DESC);

-- SEO/Meta Tags for Assets
CREATE TABLE IF NOT EXISTS asset_metadata (
  id TEXT PRIMARY KEY,
  asset_type TEXT NOT NULL, -- 'image', 'document', 'video', 'page'
  r2_key TEXT NOT NULL, -- R2 storage key
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  title TEXT,
  description TEXT,
  alt_text TEXT, -- For images
  keywords TEXT, -- Comma-separated
  og_title TEXT, -- Open Graph
  og_description TEXT,
  og_image TEXT,
  canonical_url TEXT,
  language_code TEXT DEFAULT 'en',
  metadata TEXT, -- JSON: dimensions, duration, etc.
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_asset_type ON asset_metadata(asset_type);
CREATE INDEX IF NOT EXISTS idx_asset_r2_key ON asset_metadata(r2_key);
CREATE INDEX IF NOT EXISTS idx_asset_language ON asset_metadata(language_code);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  template_type TEXT NOT NULL, -- 'inquiry', 'confirmation', 'followup', 'newsletter'
  language_code TEXT DEFAULT 'en',
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables TEXT, -- JSON: list of available variables
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_template_type ON email_templates(template_type, language_code, is_active);

-- Contact Inquiries
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  language_code TEXT DEFAULT 'en',
  source TEXT, -- 'website', 'chatbot', 'referral'
  status TEXT DEFAULT 'new', -- 'new', 'responded', 'resolved', 'archived'
  assigned_to TEXT,
  email_sent INTEGER DEFAULT 0, -- Whether auto-response was sent
  metadata TEXT, -- JSON: ip_address, user_agent, etc.
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON contact_inquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON contact_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_language ON contact_inquiries(language_code);
