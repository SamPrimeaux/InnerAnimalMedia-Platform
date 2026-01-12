-- Migration: Add tenant_id column to users table
-- Run: wrangler d1 execute inneranimalmedia-business --remote --file=src/migration-add-tenant-id-to-users.sql

-- Note: SQLite ALTER TABLE ADD COLUMN doesn't support IF NOT EXISTS
-- If the column already exists, this will fail - that's okay, just ignore the error

-- Step 1: Add tenant_id column
-- This will fail if column already exists - ignore that error
ALTER TABLE users ADD COLUMN tenant_id TEXT;

-- Step 2: Update existing users to have a default tenant_id ('system')
-- This ensures existing users have a tenant_id value
UPDATE users SET tenant_id = 'system' WHERE tenant_id IS NULL;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
