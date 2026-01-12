-- Pricing Tiers Configuration
-- Seed data for subscription tiers and limits
-- Run: wrangler d1 execute inneranimalmedia-business --remote --file=src/seed-pricing-tiers.sql

-- ============================================
-- PRICING TIERS TABLE (if needed for reference)
-- ============================================
-- Note: Limits are stored in tenant_metadata.limits JSON field
-- This table is for reference/documentation purposes

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL, -- Price in cents
  price_yearly INTEGER NOT NULL, -- Price in cents (with annual discount)
  limits TEXT NOT NULL, -- JSON: {users: 10, workflows: 100, storage_gb: 50, builds: 1000, api_requests: 2000000, integrations: -1, agent_ai_queries: 100}
  features TEXT NOT NULL, -- JSON array: ["custom_domain", "priority_support", "sso"]
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- SEED PRICING TIERS
-- ============================================

-- STARTER TIER - Personal (No Free Tier Strategy)
INSERT OR REPLACE INTO pricing_tiers (
  id, name, display_name, price_monthly, price_yearly,
  limits, features, is_active, display_order, created_at, updated_at
) VALUES (
  'starter',
  'starter',
  'Personal',
  900, -- $9/month
  9000, -- $90/year (save $18)
  '{
    "users": 1,
    "projects": 5,
    "workflows": 50,
    "storage_gb": 25,
    "builds": 200,
    "api_requests": 500000,
    "integrations": 5,
    "agent_ai_queries": 0,
    "custom_domains": 0,
    "backup_retention_days": 7,
    "audit_log_retention_days": 7
  }',
  '["all_themes", "all_tools", "basic_analytics", "email_support"]',
  1,
  0,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- PRO TIER - Professional
INSERT OR REPLACE INTO pricing_tiers (
  id, name, display_name, price_monthly, price_yearly,
  limits, features, is_active, display_order, created_at, updated_at
) VALUES (
  'pro',
  'pro',
  'Professional',
  2900, -- $29/month
  29000, -- $290/year (save $58)
  '{
    "users": 5,
    "projects": -1,
    "workflows": 500,
    "storage_gb": 100,
    "builds": 1000,
    "api_requests": 2000000,
    "integrations": -1,
    "agent_ai_queries": 100,
    "custom_domains": 1,
    "backup_retention_days": 30,
    "audit_log_retention_days": 30
  }',
  '["all_themes", "all_tools", "custom_theme_builder", "custom_domain", "priority_email_support", "advanced_analytics", "automated_backups", "basic_white_label"]',
  1,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- BUSINESS TIER - Team
INSERT OR REPLACE INTO pricing_tiers (
  id, name, display_name, price_monthly, price_yearly,
  limits, features, is_active, display_order, created_at, updated_at
) VALUES (
  'business',
  'business',
  'Team',
  9900, -- $99/month
  99000, -- $990/year (save $198)
  '{
    "users": 25,
    "projects": -1,
    "workflows": 5000,
    "storage_gb": 500,
    "builds": 10000,
    "api_requests": 10000000,
    "integrations": -1,
    "agent_ai_queries": 1000,
    "custom_domains": 5,
    "backup_retention_days": 90,
    "audit_log_retention_days": 90
  }',
  '["all_themes", "all_tools", "custom_theme_builder", "custom_domains", "priority_chat_support", "custom_dashboards", "hourly_backups", "point_in_time_restore", "full_white_label", "sso_saml", "role_based_access", "dedicated_slack"]',
  1,
  2,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ENTERPRISE TIER - Custom
INSERT OR REPLACE INTO pricing_tiers (
  id, name, display_name, price_monthly, price_yearly,
  limits, features, is_active, display_order, created_at, updated_at
) VALUES (
  'enterprise',
  'enterprise',
  'Enterprise',
  -1, -- Custom pricing
  -1, -- Custom pricing
  '{
    "users": -1,
    "projects": -1,
    "workflows": -1,
    "storage_gb": 2048,
    "builds": -1,
    "api_requests": -1,
    "integrations": -1,
    "agent_ai_queries": -1,
    "custom_domains": -1,
    "backup_retention_days": -1,
    "audit_log_retention_days": -1
  }',
  '["all_themes", "all_tools", "custom_theme_builder", "unlimited_custom_domains", "24_7_phone_support", "dedicated_account_manager", "sla_99_9", "custom_integrations", "unlimited_agent_ai", "full_white_label", "sso_saml_oidc", "advanced_role_permissions", "unlimited_audit_logs", "soc2_gdpr_compliance", "on_premise_option", "custom_contract", "dedicated_onboarding", "custom_training"]',
  1,
  3,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- ADD-ON PRICING TABLE (for reference)
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_addons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- Price in cents
  unit TEXT NOT NULL, -- 'gb', 'user', 'query', 'domain'
  limits TEXT NOT NULL, -- JSON: {storage_gb: 100, users: 1, queries: 500}
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Storage Add-ons
INSERT OR REPLACE INTO pricing_addons (
  id, name, display_name, description, price_monthly, unit, limits, is_active, created_at, updated_at
) VALUES (
  'storage_100gb',
  'storage_100gb',
  '+100GB Storage',
  'Additional 100GB of R2 storage',
  1000, -- $10/month
  'gb',
  '{"storage_gb": 100}',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
),
(
  'storage_500gb',
  'storage_500gb',
  '+500GB Storage',
  'Additional 500GB of R2 storage (save $10)',
  4000, -- $40/month
  'gb',
  '{"storage_gb": 500}',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- AI Agent Queries Add-ons
INSERT OR REPLACE INTO pricing_addons (
  id, name, display_name, description, price_monthly, unit, limits, is_active, created_at, updated_at
) VALUES (
  'agent_ai_500',
  'agent_ai_500',
  '+500 AI Queries',
  'Additional 500 AI agent queries per month',
  2000, -- $20/month
  'query',
  '{"agent_ai_queries": 500}',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
),
(
  'agent_ai_2000',
  'agent_ai_2000',
  '+2,000 AI Queries',
  'Additional 2,000 AI agent queries per month (save $5)',
  7500, -- $75/month
  'query',
  '{"agent_ai_queries": 2000}',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Extra Users Add-on
INSERT OR REPLACE INTO pricing_addons (
  id, name, display_name, description, price_monthly, unit, limits, is_active, created_at, updated_at
) VALUES (
  'extra_user',
  'extra_user',
  '+1 User',
  'Additional user seat',
  500, -- $5/month
  'user',
  '{"users": 1}',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
),
(
  'extra_users_5pack',
  'extra_users_5pack',
  '+5 Users (Bundle)',
  'Additional 5 user seats (save $5)',
  2000, -- $20/month
  'user',
  '{"users": 5}',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Custom Domain Add-on
INSERT OR REPLACE INTO pricing_addons (
  id, name, display_name, description, price_monthly, unit, limits, is_active, created_at, updated_at
) VALUES (
  'custom_domain',
  'custom_domain',
  'Custom Domain',
  'Additional custom domain with SSL',
  1000, -- $10/month
  'domain',
  '{"custom_domains": 1}',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Priority Support Add-on
INSERT OR REPLACE INTO pricing_addons (
  id, name, display_name, description, price_monthly, unit, limits, is_active, created_at, updated_at
) VALUES (
  'priority_support',
  'priority_support',
  'Priority Support',
  'Upgrade to Business-tier support (12hr response, chat)',
  5000, -- $50/month
  'support',
  '{"support_tier": "business"}',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
