-- MeauxCourses OS - Complete Learning Platform Schema
-- Multi-tenant, resell-ready course system for D1
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/schema-courses-system.sql --remote

-- ============================================
-- CORE: ORGANIZATIONS + USERS + ROLES
-- ============================================

-- Organizations (multi-tenant)
CREATE TABLE IF NOT EXISTS orgs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  plan_type TEXT DEFAULT 'free',
  settings TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Users (can belong to multiple orgs)
CREATE TABLE IF NOT EXISTS course_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(email)
);

-- Org membership + roles
CREATE TABLE IF NOT EXISTS org_users (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  permissions TEXT,
  joined_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(org_id, user_id)
);

-- Role definitions (for permissions)
CREATE TABLE IF NOT EXISTS course_roles (
  id TEXT PRIMARY KEY,
  org_id TEXT,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  permissions TEXT NOT NULL,
  is_system INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- COURSES STRUCTURE
-- ============================================

-- Courses (top level)
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  org_id TEXT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  level TEXT DEFAULT 'beginner',
  duration_hours INTEGER,
  price_cents INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  is_public INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  instructor_id TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER,
  UNIQUE(org_id, slug)
);

-- Course modules (sections)
CREATE TABLE IF NOT EXISTS course_modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_required INTEGER DEFAULT 1,
  estimated_minutes INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Lessons (content units)
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  content_type TEXT DEFAULT 'text',
  content_url TEXT,
  content_text TEXT,
  order_index INTEGER NOT NULL,
  estimated_minutes INTEGER,
  is_required INTEGER DEFAULT 1,
  is_published INTEGER DEFAULT 0,
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(course_id, slug)
);

-- Lesson versions (draft/published for resell-ready)
CREATE TABLE IF NOT EXISTS lesson_versions (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  content_text TEXT,
  content_url TEXT,
  status TEXT DEFAULT 'draft',
  change_summary TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(lesson_id, version_number)
);

-- Lesson assets (R2 files)
CREATE TABLE IF NOT EXISTS lesson_assets (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  r2_key TEXT,
  r2_bucket TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  order_index INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- LEARNING + PROGRESS
-- ============================================

-- Enrollments (who is enrolled in what, per org)
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  enrollment_type TEXT DEFAULT 'student',
  status TEXT DEFAULT 'active',
  progress_percent REAL DEFAULT 0,
  started_at INTEGER,
  completed_at INTEGER,
  expires_at INTEGER,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(org_id, user_id, course_id)
);

-- Lesson progress (completion tracking)
CREATE TABLE IF NOT EXISTS lesson_progress (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_started',
  progress_percent REAL DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_position INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(enrollment_id, lesson_id)
);

-- Activity events (optional event log)
CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  org_id TEXT,
  course_id TEXT,
  lesson_id TEXT,
  event_type TEXT NOT NULL,
  event_data TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);

-- ============================================
-- QUIZZES + ASSIGNMENTS
-- ============================================

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  lesson_id TEXT,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score REAL DEFAULT 70,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 3,
  is_required INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options TEXT,
  correct_answer TEXT,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  enrollment_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL,
  score REAL,
  passed INTEGER DEFAULT 0,
  time_spent_seconds INTEGER,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Quiz answers (individual question responses)
CREATE TABLE IF NOT EXISTS quiz_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  user_answer TEXT,
  is_correct INTEGER DEFAULT 0,
  points_earned REAL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- ============================================
-- QUALITY + RESELL FEATURES
-- ============================================

-- Course reviews
CREATE TABLE IF NOT EXISTS course_reviews (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  enrollment_id TEXT,
  rating INTEGER NOT NULL,
  title TEXT,
  review_text TEXT,
  is_verified INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(course_id, user_id)
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  enrollment_id TEXT NOT NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER,
  certificate_url TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, course_id)
);

-- Course exports (template packaging for resale)
CREATE TABLE IF NOT EXISTS course_exports (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  export_type TEXT DEFAULT 'template',
  file_url TEXT,
  r2_key TEXT,
  r2_bucket TEXT,
  file_size INTEGER,
  metadata TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL
);

-- ============================================
-- AI + CONTENT GENERATION
-- ============================================

-- AI generation logs (optional tracking)
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  lesson_id TEXT,
  quiz_id TEXT,
  generation_type TEXT NOT NULL,
  prompt TEXT,
  model TEXT,
  response_text TEXT,
  tokens_used INTEGER,
  cost_cents INTEGER,
  quality_score REAL,
  status TEXT DEFAULT 'pending',
  created_by TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Orgs + Users
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON orgs(slug);
CREATE INDEX IF NOT EXISTS idx_org_users_org ON org_users(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_org_users_user ON org_users(user_id);

-- Courses
CREATE INDEX IF NOT EXISTS idx_courses_org ON courses(org_id, status);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_public ON courses(is_public, status);

-- Modules + Lessons
CREATE INDEX IF NOT EXISTS idx_modules_course ON course_modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id, is_published);

-- Progress
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON lesson_progress(enrollment_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id, course_id);

-- Quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_enrollment ON quiz_attempts(enrollment_id, quiz_id);

-- Activity
CREATE INDEX IF NOT EXISTS idx_activity_events_user ON activity_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_course ON activity_events(course_id, created_at DESC);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON course_reviews(course_id, rating);
CREATE INDEX IF NOT EXISTS idx_course_reviews_user ON course_reviews(user_id);

-- Certificates
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
