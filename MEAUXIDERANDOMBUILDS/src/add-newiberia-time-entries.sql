-- Add time entries for New Iberia Church of Christ project
-- Note: Uses existing user IDs for foreign key compliance
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/add-newiberia-time-entries.sql --remote

-- Get project ID and a valid user ID
-- For now, we'll use the same user ID for all entries (can be updated later when proper user records exist)

-- Connor (4 hours)
INSERT OR IGNORE INTO time_entries (
  id, user_id, project_id, description, hours, billable, hourly_rate, total_cost, started_at, ended_at, created_at
)
SELECT 
  'time_connor_newiberia_001',
  (SELECT id FROM users WHERE email LIKE '%sam%' OR email LIKE '%inneranimal%' LIMIT 1) OR (SELECT id FROM users LIMIT 1),
  'proj_newiberia_website_20260110',
  'New Iberia Church of Christ - Website buildout work (Connor: 4 hours)',
  4.0,
  1,
  125.0,
  500.0,
  datetime('now', '-7 days', '+9 hours'),
  datetime('now', '-7 days', '+13 hours'),
  datetime('now')
WHERE EXISTS (SELECT 1 FROM projects WHERE id = 'proj_newiberia_website_20260110');

-- Fred (2 hours)
INSERT OR IGNORE INTO time_entries (
  id, user_id, project_id, description, hours, billable, hourly_rate, total_cost, started_at, ended_at, created_at
)
SELECT 
  'time_fred_newiberia_001',
  (SELECT id FROM users WHERE email LIKE '%sam%' OR email LIKE '%inneranimal%' LIMIT 1) OR (SELECT id FROM users LIMIT 1),
  'proj_newiberia_website_20260110',
  'New Iberia Church of Christ - Website buildout work (Fred: 2 hours)',
  2.0,
  1,
  125.0,
  250.0,
  datetime('now', '-6 days', '+10 hours'),
  datetime('now', '-6 days', '+12 hours'),
  datetime('now')
WHERE EXISTS (SELECT 1 FROM projects WHERE id = 'proj_newiberia_website_20260110');

-- Sam (6 hours)
INSERT OR IGNORE INTO time_entries (
  id, user_id, project_id, description, hours, billable, hourly_rate, total_cost, started_at, ended_at, created_at
)
SELECT 
  'time_sam_newiberia_001',
  (SELECT id FROM users WHERE email LIKE '%sam%' OR email LIKE '%inneranimal%' LIMIT 1) OR (SELECT id FROM users LIMIT 1),
  'proj_newiberia_website_20260110',
  'New Iberia Church of Christ - Website buildout work (Sam: 6 hours)',
  6.0,
  1,
  125.0,
  750.0,
  datetime('now', '-5 days', '+9 hours'),
  datetime('now', '-5 days', '+15 hours'),
  datetime('now')
WHERE EXISTS (SELECT 1 FROM projects WHERE id = 'proj_newiberia_website_20260110');
