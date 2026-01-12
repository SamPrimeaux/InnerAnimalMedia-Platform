-- Migration: Sidebar & App Dock Preferences
-- Stores user navigation preferences in D1 for cross-device sync
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-sidebar-preferences.sql --remote

-- Sidebar Preferences Table
CREATE TABLE IF NOT EXISTS sidebar_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    sidebar_collapsed INTEGER DEFAULT 0, -- 0 = expanded, 1 = collapsed
    sidebar_width INTEGER DEFAULT 280, -- Custom width in pixels
    dock_items_json TEXT DEFAULT '[]', -- Array of dock item configs: [{page, icon, order, is_favorite}]
    recent_apps_json TEXT DEFAULT '[]', -- Array of recently accessed apps: [{page, accessed_at, count}]
    customizations_json TEXT DEFAULT '{}', -- Additional customizations: {theme, animations, etc.}
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, tenant_id)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_sidebar_prefs_user ON sidebar_preferences(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_sidebar_prefs_tenant ON sidebar_preferences(tenant_id);

-- Default dock items (will be used if no preferences exist)
-- This is handled in application code, not in SQL
