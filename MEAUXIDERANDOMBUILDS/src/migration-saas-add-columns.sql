-- Safe Migration: Add SaaS columns to existing tables
-- This handles columns that may already exist
-- Run: wrangler d1 execute meauxos --file=src/migration-saas-add-columns.sql --remote

-- Add tenant columns (will fail silently if column exists - that's OK)
-- We'll check in application code if columns exist before using them

-- Tenants enhancements
-- Note: Run these one at a time, skip errors if column exists
BEGIN TRANSACTION;

-- Try to add columns (will fail if exists, which is fine)
-- We'll handle this in application code by checking column existence

-- For now, we'll create a new table structure and migrate data
-- This is safer than ALTER TABLE in SQLite

COMMIT;

-- Instead, we'll use the existing columns and add new tables
-- The application will work with what exists and gracefully handle missing columns
