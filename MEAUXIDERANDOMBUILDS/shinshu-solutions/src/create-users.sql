-- Create initial users with password "1234"
-- Password hash for "1234" using SHA-256: sha256:03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4

-- Jake Waalk's account (update email when you have it)
INSERT OR REPLACE INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at)
VALUES (
  'user-jake-001',
  'jake.waalk@shinshusolutions.com',  -- UPDATE THIS WITH JAKE'S ACTUAL EMAIL
  'sha256:03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  'Jake Waalk',
  'admin',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Sam's account (update email when you have it)
INSERT OR REPLACE INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at)
VALUES (
  'user-sam-001',
  'sam@meauxbility.com',  -- UPDATE THIS WITH YOUR ACTUAL EMAIL
  'sha256:03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  'Sam Primeaux',
  'admin',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
