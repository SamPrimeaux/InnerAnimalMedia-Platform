-- Add New Iberia Church of Christ client and time tracking
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-add-newiberia-client.sql --remote

-- ============================================
-- 1. Create Tenant (Client)
-- ============================================
-- Note: tenants table uses is_active (INTEGER) and created_at (INTEGER, not createdAt)
INSERT OR IGNORE INTO tenants (id, name, slug, is_active, settings, created_at, updated_at, createdBy) VALUES
  (
    'tenant_newiberia_20260110',
    'New Iberia Church of Christ',
    'newiberia-church-of-christ',
    1,
    '{
      "client_type": "external",
      "website": "newiberiachurchofchrist.com",
      "project_type": "cloudflare_pro",
      "billing_status": "pending_quote",
      "total_hours": 12,
      "time_breakdown": {
        "connor": 4,
        "fred": 2,
        "sam": 6
      },
      "notes": "Cloudflare Pro client project - buildout in progress. Total: 12h (Connor: 4h, Fred: 2h, Sam: 6h)"
    }',
    strftime('%s', 'now'),
    strftime('%s', 'now'),
    'sam@inneranimalmedia.com'
  );

-- ============================================
-- 2. Create Project for this Client
-- ============================================
-- Note: projects table uses different column names - no tenant_id, uses client_name and created_at (DATETIME)
INSERT OR IGNORE INTO projects (
  id, name, slug, description, status, category, metadata, created_by, client_name, client_email, budget, hourly_budget, created_at, updated_at
) VALUES
  (
    'proj_newiberia_website_20260110',
    'New Iberia Church of Christ Website',
    'newiberia-church-of-christ-website',
    'Cloudflare Pro client project - website buildout and deployment. Total hours: 12 (Connor: 4h, Fred: 2h, Sam: 6h)',
    'active',
    'web',
    '{
      "website": "newiberiachurchofchrist.com",
      "project_type": "cloudflare_pro",
      "framework": "html",
      "deployment_platform": "cloudflare_pages",
      "total_hours": 12,
      "time_entries": {
        "connor": {"hours": 4, "description": "Website buildout work"},
        "fred": {"hours": 2, "description": "Website buildout work"},
        "sam": {"hours": 6, "description": "Website buildout work"}
      },
      "billing_status": "pending_quote"
    }',
    'sam@inneranimalmedia.com',
    'New Iberia Church of Christ',
    NULL,
    2000.0,  -- Suggested budget: $2,000
    125.0,   -- Suggested hourly rate: $125/hour
    datetime('now'),
    datetime('now')
  );

-- ============================================
-- 3. Create/Get User IDs (if they don't exist, use placeholder IDs)
-- Note: We'll reference users by email for now, and create entries
-- ============================================

-- First, check if users exist or create placeholder user IDs for time tracking
-- We'll use a pattern that matches emails or creates user IDs

-- ============================================
-- 3. Create Time Entries for Team Members
-- ============================================
-- Note: We'll use placeholder user_ids since we don't have user records yet
-- These can be updated later when users are created

-- For Connor (4 hours)
INSERT OR IGNORE INTO time_entries (
  id, user_id, project_id, description, hours, billable, hourly_rate, total_cost, started_at, ended_at, created_at
)
SELECT 
  'time_connor_newiberia_001',
  COALESCE((SELECT id FROM users WHERE email LIKE '%connor%' LIMIT 1), 'user_connor_newiberia'),
  'proj_newiberia_website_20260110',
  'New Iberia Church of Christ - Website buildout work (Connor)',
  4.0,
  1,
  125.0, -- Suggested hourly rate: $125/hour
  500.0, -- 4 hours × $125/hour = $500
  datetime('now', '-7 days', '+9 hours'),
  datetime('now', '-7 days', '+13 hours'),
  datetime('now')
WHERE EXISTS (SELECT 1 FROM projects WHERE id = 'proj_newiberia_website_20260110');

-- For Fred (2 hours)
INSERT OR IGNORE INTO time_entries (
  id, user_id, project_id, description, hours, billable, hourly_rate, total_cost, started_at, ended_at, created_at
)
SELECT 
  'time_fred_newiberia_001',
  COALESCE((SELECT id FROM users WHERE email LIKE '%fred%' LIMIT 1), 'user_fred_newiberia'),
  'proj_newiberia_website_20260110',
  'New Iberia Church of Christ - Website buildout work (Fred)',
  2.0,
  1,
  125.0, -- Suggested hourly rate: $125/hour
  250.0, -- 2 hours × $125/hour = $250
  datetime('now', '-6 days', '+10 hours'),
  datetime('now', '-6 days', '+12 hours'),
  datetime('now')
WHERE EXISTS (SELECT 1 FROM projects WHERE id = 'proj_newiberia_website_20260110');

-- For Sam (6 hours)
INSERT OR IGNORE INTO time_entries (
  id, user_id, project_id, description, hours, billable, hourly_rate, total_cost, started_at, ended_at, created_at
)
SELECT 
  'time_sam_newiberia_001',
  COALESCE((SELECT id FROM users WHERE email LIKE '%sam%' LIMIT 1), 'user_sam_newiberia'),
  'proj_newiberia_website_20260110',
  'New Iberia Church of Christ - Website buildout work (Sam)',
  6.0,
  1,
  125.0, -- Suggested hourly rate: $125/hour
  750.0, -- 6 hours × $125/hour = $750
  datetime('now', '-5 days', '+9 hours'),
  datetime('now', '-5 days', '+15 hours'),
  datetime('now')
WHERE EXISTS (SELECT 1 FROM projects WHERE id = 'proj_newiberia_website_20260110');
