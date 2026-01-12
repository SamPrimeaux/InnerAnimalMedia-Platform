-- Create Demo/Sandbox Tenant
-- Safe isolated environment for demonstrations and team testing

INSERT INTO tenants (
  id, name, slug, is_active, settings, created_at, updated_at, createdBy
) VALUES (
  'tenant_demo_sandbox',
  'Demo Workspace',
  'demo-workspace',
  1,
  '{
    "workspace_type": "demo",
    "demo_mode": true,
    "read_only": false,
    "data_isolation": true,
    "modules": ["meauxwork", "meauxmcp", "analytics", "meauxcloud", "library", "gallery"],
    "onboarding_completed": true,
    "sandbox_expires_at": null,
    "description": "Isolated demo environment for safe demonstrations and team testing"
  }',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'system@inneranimalmedia.com'
);

-- Create demo user accounts
INSERT OR REPLACE INTO users (
  id, email, full_name, username, role, company, provider, status, created_at, updated_at
) VALUES
(
  'user_demo_full',
  'demo@inneranimalmedia.com',
  'Demo User',
  'demo',
  'admin',
  'InnerAnimal Media',
  'demo',
  'active',
  strftime('%s', 'now'),
  strftime('%s', 'now')
),
(
  'user_demo_readonly',
  'demo-readonly@inneranimalmedia.com',
  'Demo ReadOnly',
  'demo-readonly',
  'viewer',
  'InnerAnimal Media',
  'demo',
  'active',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Link demo users to demo tenant
-- Note: This depends on your users table structure
-- May need to adjust based on actual schema

SELECT 'Demo tenant and users created successfully!' as status;
