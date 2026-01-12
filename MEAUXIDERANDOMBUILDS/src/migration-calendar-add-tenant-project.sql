-- Add tenant_id and project_id columns to calendar tables
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-calendar-add-tenant-project.sql --remote

-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- If columns already exist, this will fail - that's okay, just means they're already there

-- Add tenant_id to calendar_events (if it doesn't exist)
-- We'll use a workaround: try to add it, ignore error if it exists
ALTER TABLE calendar_events ADD COLUMN tenant_id TEXT;

-- Add project_id to calendar_events (if it doesn't exist)
ALTER TABLE calendar_events ADD COLUMN project_id TEXT;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant ON calendar_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project ON calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant_project ON calendar_events(tenant_id, project_id);

-- Note: calendar_reminders doesn't need tenant_id/project_id as it references events
-- But we can add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_event ON calendar_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_user ON calendar_reminders(user_id, reminder_time);
