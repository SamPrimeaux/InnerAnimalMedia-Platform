-- Migration: Add username column to users table
-- Enables custom usernames for personalized UI (e.g., /dashboard/@username)
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-add-username-column.sql --remote

-- Add username column to users table (if it doesn't exist)
-- Note: SQLite doesn't support IF NOT EXISTS for ADD COLUMN, so this might fail if column already exists
ALTER TABLE users ADD COLUMN username TEXT;

-- Create unique index for username (globally unique across all tenants)
-- Only index non-null usernames
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
