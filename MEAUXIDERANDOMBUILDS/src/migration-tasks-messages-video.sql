-- Migration Script: Tasks, Messages, and Video Sessions
-- Creates tables for real-time task management, message boards, and video calling
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-tasks-messages-video.sql --remote

-- ============================================
-- TASKS TABLE (Real-time Task Management)
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_id TEXT, -- Optional: Link to projects
  workflow_id TEXT, -- Optional: Link to workflows
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done', 'cancelled'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  assignee_id TEXT, -- User ID who is assigned
  creator_id TEXT NOT NULL, -- User ID who created
  due_date INTEGER, -- Unix timestamp
  tags TEXT, -- JSON array of tags
  metadata_json TEXT DEFAULT '{}', -- Additional metadata
  position INTEGER DEFAULT 0, -- For sorting/ordering
  parent_task_id TEXT, -- For subtasks
  is_completed INTEGER DEFAULT 0,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_workflow ON tasks(workflow_id) WHERE workflow_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status, priority);

-- Task Comments (for collaboration)
CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata_json TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);

-- Task Activity Log (for real-time updates)
CREATE TABLE IF NOT EXISTS task_activity (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL, -- 'created', 'updated', 'assigned', 'status_changed', 'commented'
  changes_json TEXT, -- JSON of what changed
  created_at INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_activity_task ON task_activity(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_activity_tenant ON task_activity(tenant_id, created_at DESC);

-- ============================================
-- MESSAGE BOARDS (Threads & Messages)
-- ============================================

CREATE TABLE IF NOT EXISTS message_threads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general', -- 'general', 'announcements', 'support', 'ideas', 'random'
  created_by TEXT NOT NULL,
  is_pinned INTEGER DEFAULT 0,
  is_locked INTEGER DEFAULT 0,
  last_message_at INTEGER,
  message_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  metadata_json TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_threads_tenant ON message_threads(tenant_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_category ON message_threads(category, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_pinned ON message_threads(is_pinned DESC, last_message_at DESC) WHERE is_pinned = 1;

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text', -- 'text', 'markdown', 'html'
  reply_to_id TEXT, -- For threaded replies
  is_edited INTEGER DEFAULT 0,
  edited_at INTEGER,
  metadata_json TEXT DEFAULT '{}', -- For attachments, mentions, etc.
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id, created_at DESC);

-- Message Reactions (likes, emojis, etc.)
CREATE TABLE IF NOT EXISTS message_reactions (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL, -- 'like', 'love', 'laugh', 'angry', etc. or emoji
  created_at INTEGER NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  UNIQUE(message_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);

-- ============================================
-- VIDEO SESSIONS (WebRTC Video Calls)
-- ============================================

CREATE TABLE IF NOT EXISTS video_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_name TEXT,
  session_type TEXT DEFAULT 'call', -- 'call', 'stream', 'meeting', 'screen_share'
  host_id TEXT NOT NULL, -- User ID who started the session
  status TEXT DEFAULT 'active', -- 'active', 'ended', 'recording'
  webrtc_config_json TEXT, -- WebRTC configuration (ICE servers, etc.)
  participants_json TEXT DEFAULT '[]', -- Array of participant user IDs
  metadata_json TEXT DEFAULT '{}', -- Recording info, duration, etc.
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_video_sessions_tenant ON video_sessions(tenant_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_sessions_host ON video_sessions(host_id, status);
CREATE INDEX IF NOT EXISTS idx_video_sessions_status ON video_sessions(status, started_at DESC);

-- Video Session Participants (detailed tracking)
CREATE TABLE IF NOT EXISTS video_participants (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  left_at INTEGER,
  role TEXT DEFAULT 'participant', -- 'host', 'moderator', 'participant', 'viewer'
  video_enabled INTEGER DEFAULT 0,
  audio_enabled INTEGER DEFAULT 0,
  screen_sharing INTEGER DEFAULT 0,
  metadata_json TEXT DEFAULT '{}',
  FOREIGN KEY (session_id) REFERENCES video_sessions(id) ON DELETE CASCADE,
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_session ON video_participants(session_id, joined_at);
CREATE INDEX IF NOT EXISTS idx_participants_user ON video_participants(user_id, joined_at DESC);
