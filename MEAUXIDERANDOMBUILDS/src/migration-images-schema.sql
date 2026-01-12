-- Images Management Schema
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-images-schema.sql --remote

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  project_id TEXT,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  r2_key TEXT NOT NULL UNIQUE,
  cloudflare_image_id TEXT,
  url TEXT,
  thumbnail_url TEXT,
  alt_text TEXT,
  description TEXT,
  tags TEXT, -- JSON array
  metadata TEXT, -- JSON object
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_images_tenant ON images(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_project ON images(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_user ON images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_r2_key ON images(r2_key);
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
CREATE INDEX IF NOT EXISTS idx_images_tags ON images(tags);
