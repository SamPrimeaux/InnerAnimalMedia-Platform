-- Calendar Tables Schema (compatible with existing schema)
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-calendar-schema.sql --remote

-- Add tenant_id and project_id if they don't exist (using ALTER TABLE IF NOT EXISTS workaround)
-- Since SQLite doesn't support ALTER TABLE IF NOT EXISTS, we'll just ensure indexes exist

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_time ON calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_event ON calendar_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_user ON calendar_reminders(user_id, reminder_time);
