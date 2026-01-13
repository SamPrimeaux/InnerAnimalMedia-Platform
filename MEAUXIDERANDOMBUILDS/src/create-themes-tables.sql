-- Create theme_access table if it doesn't exist
-- Note: themes table already exists, just creating theme_access
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/create-themes-tables.sql --remote

CREATE TABLE IF NOT EXISTS theme_access (
  id TEXT PRIMARY KEY,
  theme_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  is_active INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Create indexes for theme_access (only if table exists)
CREATE INDEX IF NOT EXISTS idx_theme_access_tenant ON theme_access(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_theme_access_theme ON theme_access(theme_id);
