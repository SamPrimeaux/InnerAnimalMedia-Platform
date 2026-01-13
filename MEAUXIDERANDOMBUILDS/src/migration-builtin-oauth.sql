-- Built-in OAuth System with Cryptographic Security
-- Adds password-based authentication with SHA-256 + salt + bcrypt hashing
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-builtin-oauth.sql --remote

-- ============================================
-- USER PASSWORDS (Secure Password Storage)
-- ============================================

CREATE TABLE IF NOT EXISTS user_passwords (
  user_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- SHA-256 hash of password + salt, then bcrypt
  salt TEXT NOT NULL, -- Random salt per user (hex encoded)
  algorithm TEXT DEFAULT 'sha256+bcrypt', -- Algorithm identifier
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_password_change INTEGER,
  password_expires_at INTEGER, -- Optional: password expiration
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_passwords_tenant ON user_passwords(tenant_id, user_id);

-- ============================================
-- OAUTH AUTHORIZATION CODES (OAuth 2.0 Flow)
-- ============================================

CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  code TEXT PRIMARY KEY, -- Authorization code (cryptographically random)
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL, -- Our custom OAuth client ID
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT, -- PKCE: SHA256 hash of code_verifier
  code_challenge_method TEXT DEFAULT 'S256', -- PKCE: 'S256' or 'plain'
  scope TEXT DEFAULT 'openid profile email',
  expires_at INTEGER NOT NULL, -- 10 minutes expiration
  used INTEGER DEFAULT 0, -- Prevent reuse
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_user ON oauth_authorization_codes(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_client ON oauth_authorization_codes(client_id, expires_at);

-- ============================================
-- OAUTH REFRESH TOKENS (Long-lived tokens)
-- ============================================

CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
  token_hash TEXT PRIMARY KEY, -- SHA-256 hash of refresh token
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  scope TEXT,
  expires_at INTEGER, -- NULL = never expires, or set expiration date
  last_used_at INTEGER,
  created_at INTEGER NOT NULL,
  revoked INTEGER DEFAULT 0,
  revoked_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_oauth_refresh_user ON oauth_refresh_tokens(user_id, revoked);
CREATE INDEX IF NOT EXISTS idx_oauth_refresh_client ON oauth_refresh_tokens(client_id, revoked);

-- ============================================
-- OAUTH PROVIDER: InnerAnimal Media (Built-in)
-- ============================================

-- Insert/Update our custom OAuth provider
INSERT OR REPLACE INTO oauth_providers (
  id,
  name,
  display_name,
  client_id,
  client_secret_encrypted,
  auth_url,
  token_url,
  user_info_url,
  scopes,
  is_enabled,
  created_at,
  updated_at
) VALUES (
  'inneranimal',
  'InnerAnimal Media',
  'InnerAnimal Media Account',
  'inneranimal_builtin_oauth', -- Built-in client ID
  '', -- No client secret needed for built-in OAuth (uses PKCE)
  '/api/oauth/inneranimal/authorize', -- Our own authorize endpoint
  '/api/oauth/inneranimal/token', -- Our own token endpoint
  '/api/oauth/inneranimal/userinfo', -- Our own userinfo endpoint
  '["openid", "profile", "email"]', -- JSON array of scopes
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
