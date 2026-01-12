-- Cost Tracking Schema
-- Tracks API usage and costs for accurate spending monitoring
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-cost-tracking.sql --remote

-- Cost Tracking Table
CREATE TABLE IF NOT EXISTS cost_tracking (
  id TEXT PRIMARY KEY,
  service TEXT NOT NULL, -- 'gemini', 'openai', 'cloudconvert', 'cloudflare_d1', 'cloudflare_r2', 'cloudflare_workers'
  event_type TEXT NOT NULL, -- 'embedding', 'query', 'storage', 'compute', 'conversion'
  usage_amount REAL NOT NULL DEFAULT 0, -- tokens, characters, operations, GB, requests, etc.
  usage_unit TEXT NOT NULL, -- 'tokens', 'characters', 'operations', 'GB', 'requests', 'ms'
  estimated_cost_usd REAL NOT NULL DEFAULT 0, -- Estimated cost in USD
  actual_cost_usd REAL, -- Actual cost if available from billing API
  tenant_id TEXT, -- Tenant ID for multi-tenant tracking
  user_id TEXT, -- User ID for per-user tracking
  metadata TEXT, -- JSON: additional context (model, response_time, error, etc.)
  timestamp INTEGER NOT NULL, -- Unix timestamp for date grouping
  created_at INTEGER NOT NULL
);

-- Cost Summary View (daily)
CREATE VIEW IF NOT EXISTS cost_summary_daily AS
SELECT 
  service,
  event_type,
  DATE(datetime(timestamp, 'unixepoch')) as date,
  SUM(usage_amount) as total_usage,
  usage_unit,
  SUM(estimated_cost_usd) as total_estimated_cost,
  SUM(actual_cost_usd) as total_actual_cost,
  COUNT(*) as event_count
FROM cost_tracking
GROUP BY service, event_type, date, usage_unit
ORDER BY date DESC, service, event_type;

-- Cost Summary View (monthly)
CREATE VIEW IF NOT EXISTS cost_summary_monthly AS
SELECT 
  service,
  event_type,
  strftime('%Y-%m', datetime(timestamp, 'unixepoch')) as month,
  SUM(usage_amount) as total_usage,
  usage_unit,
  SUM(estimated_cost_usd) as total_estimated_cost,
  SUM(actual_cost_usd) as total_actual_cost,
  COUNT(*) as event_count
FROM cost_tracking
GROUP BY service, event_type, month, usage_unit
ORDER BY month DESC, service, event_type;

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_cost_tracking_service_date ON cost_tracking(service, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_tenant ON cost_tracking(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_user ON cost_tracking(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_event_type ON cost_tracking(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_date ON cost_tracking(timestamp DESC);
