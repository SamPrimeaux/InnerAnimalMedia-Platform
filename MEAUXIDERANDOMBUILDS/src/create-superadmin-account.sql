-- Create Superadmin Account
-- Creates a system-level superadmin account with full access permissions
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/create-superadmin-account.sql --remote
-- 
-- Superadmin Account:
-- Email: sam@inneranimalmedia.com
-- Username: Sam (globally unique - other users must use sam1, sam2, etc.)

-- Create superadmin user (matching actual users table schema)
INSERT OR REPLACE INTO users (
  id,
  email,
  full_name,
  username,
  role,
  company,
  avatar_url,
  provider,
  status,
  created_at,
  updated_at
) VALUES (
  'superadmin',
  'sam@inneranimalmedia.com', -- Sam's email
  'Sam',
  'Sam', -- Unique username (reserved for superadmin)
  'superadmin', -- Custom role for superadmin
  'InnerAnimal Media', -- Company
  NULL, -- Avatar URL (can be set later)
  'email', -- Provider
  'active', -- Status
  datetime('now'), -- Created at
  datetime('now') -- Updated at
);

-- Output success message
SELECT 'Superadmin account created successfully!' as status;
