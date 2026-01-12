-- Update Superadmin Identity
-- Updates Sam's account with full name and special identity marker
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/update-superadmin-identity.sql --remote

-- Update full name to "Sam Primeaux"
UPDATE users 
SET 
  full_name = 'Sam Primeaux',
  company = 'InnerAnimal Media',
  role = 'superadmin',
  status = 'active',
  updated_at = datetime('now')
WHERE id = 'superadmin' AND email = 'sam@inneranimalmedia.com';

-- Add special identity marker (#SamPrimeaux or similar)
-- Store in a metadata field or add a special identifier
-- For now, we'll use a combination of username + full_name + special role

-- Verify update
SELECT 
  id,
  email,
  username,
  full_name,
  role,
  company,
  status,
  CASE 
    WHEN id = 'superadmin' AND email = 'sam@inneranimalmedia.com' AND role = 'superadmin' 
    THEN '#SamPrimeaux-Superadmin' 
    ELSE NULL 
  END as identity_marker
FROM users 
WHERE id = 'superadmin';
