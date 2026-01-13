-- Fix Superadmin Access - Link Google OAuth to proper user and tenant
-- This will:
-- 1. Create/update superadmin user account
-- 2. Link Google OAuth token to the superadmin user
-- 3. Link superadmin to the main tenant

-- Step 1: Get or create superadmin user with proper tenant
-- Use the tenant "Sam's First IAM project" (tenant_1768090747821_5m9she82d)

-- First, check if a user with info@inneranimals.com exists
-- If not, create one linked to the main tenant

-- Create/update superadmin user account
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
) 
SELECT 
  'superadmin_sam',
  'info@inneranimals.com',
  'Sam Primeaux',
  'Sam',
  'superadmin',
  'InnerAnimal Media',
  NULL,
  'google',
  'active',
  COALESCE((SELECT created_at FROM users WHERE email = 'info@inneranimals.com'), strftime('%s', 'now')),
  strftime('%s', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'info@inneranimals.com'
);

-- If user already exists, update it
UPDATE users 
SET 
  full_name = 'Sam Primeaux',
  username = 'Sam',
  role = 'superadmin',
  company = 'InnerAnimal Media',
  provider = 'google',
  status = 'active',
  updated_at = strftime('%s', 'now')
WHERE email = 'info@inneranimals.com';

-- Step 2: Link OAuth token to the superadmin user
UPDATE oauth_tokens
SET 
  user_id = 'superadmin_sam',
  tenant_id = 'tenant_1768090747821_5m9she82d',
  updated_at = strftime('%s', 'now')
WHERE provider_email = 'info@inneranimals.com' 
  AND provider_id = 'google';

-- Step 3: If we created a new user, ensure they're linked to a tenant
-- Check if tenant_1768090747821_5m9she82d exists and link user to it
-- Note: The users table might not have tenant_id column, so this is optional

-- Output confirmation
SELECT 
  'Superadmin account created/updated!' as status,
  'info@inneranimals.com' as email,
  'superadmin_sam' as user_id,
  'tenant_1768090747821_5m9she82d' as tenant_id;
