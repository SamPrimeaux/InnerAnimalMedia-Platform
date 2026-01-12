-- Site Content Management System
-- Stores editable content that syncs with the website

CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'page', 'section', 'component', 'block'
  page_path TEXT, -- URL path like '/', '/about', '/services'
  section_id TEXT, -- Section identifier like 'hero', 'services', 'about'
  language_code TEXT DEFAULT 'en',
  title TEXT,
  content TEXT NOT NULL, -- HTML or markdown content
  content_data TEXT, -- JSON: structured data, images, links, etc.
  order_index INTEGER DEFAULT 0, -- For ordering sections/blocks
  is_published INTEGER DEFAULT 1, -- Draft vs published
  is_active INTEGER DEFAULT 1,
  metadata TEXT, -- JSON: seo, styling, etc.
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_site_content_page ON site_content(page_path, language_code);
CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(section_id, page_path);
CREATE INDEX IF NOT EXISTS idx_site_content_type ON site_content(content_type, is_published);
CREATE INDEX IF NOT EXISTS idx_site_content_order ON site_content(page_path, order_index);

-- Content Versions (for history/rollback)
CREATE TABLE IF NOT EXISTS content_versions (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  content_data TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  created_by TEXT,
  FOREIGN KEY (content_id) REFERENCES site_content(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_versions_content ON content_versions(content_id, version_number DESC);
