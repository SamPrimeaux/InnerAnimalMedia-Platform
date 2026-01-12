-- Add New Iberia Church of Christ client - Store hours in project metadata instead of time_entries
-- This avoids foreign key issues while still tracking the data
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/add-newiberia-client-simple.sql --remote

-- Step 1: Create Tenant (Client)
INSERT OR IGNORE INTO tenants (id, name, slug, is_active, settings, created_at, updated_at, createdBy) 
VALUES (
  'tenant_newiberia_20260110',
  'New Iberia Church of Christ',
  'newiberia-church-of-christ',
  1,
  '{"client_type":"external","website":"newiberiachurchofchrist.com","project_type":"cloudflare_pro","billing_status":"pending_quote","total_hours":12,"time_breakdown":{"connor":4,"fred":2,"sam":6},"notes":"Cloudflare Pro client project - buildout in progress. Total: 12h (Connor: 4h, Fred: 2h, Sam: 6h)"}',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'sam@inneranimalmedia.com'
);

-- Step 2: Create Project with time tracking in metadata
INSERT OR IGNORE INTO projects (
  id, name, slug, description, status, category, metadata, created_by, client_name, client_email, budget, hourly_budget, created_at, updated_at
) VALUES (
  'proj_newiberia_website_20260110',
  'New Iberia Church of Christ Website',
  'newiberia-church-of-christ-website',
  'Cloudflare Pro client project - website buildout and deployment',
  'active',
  'web',
  '{
    "website": "newiberiachurchofchrist.com",
    "project_type": "cloudflare_pro",
    "framework": "html",
    "deployment_platform": "cloudflare_pages",
    "billing_status": "pending_quote",
    "total_hours": 12,
    "hourly_rate_suggested": 125,
    "total_cost_suggested": 1500,
    "time_entries": [
      {"team_member": "Connor", "hours": 4, "hourly_rate": 125, "cost": 500, "description": "Website buildout work"},
      {"team_member": "Fred", "hours": 2, "hourly_rate": 125, "cost": 250, "description": "Website buildout work"},
      {"team_member": "Sam", "hours": 6, "hourly_rate": 125, "cost": 750, "description": "Website buildout work"}
    ],
    "quote_options": {
      "option1": {"name": "Straight Hourly", "amount": 1500, "description": "12 hours × $125/hour"},
      "option2": {"name": "Project Package", "amount": 1700, "description": "Website Build ($1,200) + Cloudflare Pro Setup ($500)"},
      "option3": {"name": "Value Package", "amount": 1800, "description": "Initial Buildout ($1,500) + First Month Support ($300)"}
    },
    "recommended_quote": {"min": 1500, "max": 1800, "base": 1500}
  }',
  'sam@inneranimalmedia.com',
  'New Iberia Church of Christ',
  NULL,
  2000.0,
  125.0,
  datetime('now'),
  datetime('now')
);
