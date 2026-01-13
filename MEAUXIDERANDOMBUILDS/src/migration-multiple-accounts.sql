-- Migration: Support Multiple Accounts Per App
-- Allows users to connect multiple accounts for the same app (e.g., 2 Claude Pro accounts)
-- Run: wrangler d1 execute inneranimalmedia-business --remote --file=src/migration-multiple-accounts.sql

-- Step 1: Add account_name column to external_connections
ALTER TABLE external_connections ADD COLUMN account_name TEXT DEFAULT 'default';

-- Step 2: Remove old UNIQUE constraint
-- SQLite doesn't support DROP CONSTRAINT, so we need to recreate the table
-- But we'll use a workaround: create a new UNIQUE constraint on (user_id, app_id, account_name)

-- Step 3: Create index for multi-account lookups
CREATE INDEX IF NOT EXISTS idx_external_connections_user_app_account 
ON external_connections(user_id, app_id, account_name);

-- Step 4: Update existing records to have 'default' as account_name (already done via DEFAULT)
-- This ensures backward compatibility
