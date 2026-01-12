-- Complete Migration: Import all apps from inneranimalmedia_app_library
-- This script creates the tools table and migrates all 22 apps with full context
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migrate-apps-complete.sql --remote

-- ============================================
-- CREATE TOOLS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT,
  icon TEXT,
  description TEXT,
  config TEXT,
  is_enabled INTEGER DEFAULT 1,
  is_public INTEGER DEFAULT 0,
  version TEXT DEFAULT '1.0.0',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- MIGRATE ALL APPS FROM APP_LIBRARY
-- ============================================

-- 1. MeauxAccess (Enterprise Intelligence Platform)
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-meauxaccess',
  '',
  'meauxaccess',
  'MeauxAccess',
  'productivity',
  'layout-dashboard',
  'Full-featured enterprise dashboard with real-time analytics, team management, and intelligent insights.',
  '{"tagline":"Enterprise Intelligence Platform","long_description":"MeauxAccess is a comprehensive enterprise platform that provides real-time intelligence across your entire infrastructure. Features include: advanced analytics, team management, cost tracking, AI gateway integration, and multi-service orchestration. Built on Cloudflare Workers for global performance.","install_url":"https://meauxaccess.com","category":"productivity","status":"live","developer":"Meaux Technologies","developer_url":"https://meauxtechnologies.com"}',
  1,
  1,
  '2.1.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 2. MeauxPhoto
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-meauxphoto',
  '',
  'meauxphoto',
  'MeauxPhoto',
  'media',
  'image',
  'Lightning-fast photo gallery with AI organization, facial recognition, and smart tagging.',
  '{"tagline":"Professional Photo Gallery","long_description":"MeauxPhoto transforms how you manage photos. Featuring AI-powered organization, facial recognition, smart tagging, and seamless sharing. Perfect for photographers, families, and businesses managing large photo libraries.","category":"media","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 3. iAutodidact
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-iautodidact',
  '',
  'iautodidact',
  'iAutodidact',
  'productivity',
  'graduation-cap',
  'Personalized learning paths with AI tutoring, progress tracking, and adaptive content.',
  '{"tagline":"Self-Learning Platform","long_description":"iAutodidact is an intelligent self-learning platform that adapts to your learning style. Features include AI tutoring, personalized learning paths, progress tracking, and adaptive content delivery. Perfect for lifelong learners.","category":"productivity","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 4. DamnSam
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-damnsam',
  '',
  'damnsam',
  'DamnSam',
  'ai-ml',
  'bot',
  'Your personal AI assistant powered by multiple AI models for maximum capability.',
  '{"tagline":"Personal AI Assistant","long_description":"DamnSam is a powerful AI assistant that combines the best of multiple AI models (GPT-4, Claude, Gemini) to help you with tasks, answer questions, and boost your productivity. Features include context-aware conversations, file analysis, code generation, and workflow automation.","category":"ai-ml","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 5. Grant Writing Pipeline
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-grantwriting',
  '',
  'grantwriting',
  'Grant Writing Pipeline',
  'business',
  'file-text',
  'Complete grant writing and management pipeline with AI-assisted writing and tracking.',
  '{"tagline":"Automated Grant Management","long_description":"Transform your grant writing process with AI assistance. This platform helps non-profits and organizations discover grants, write compelling proposals, track submissions, and manage awarded grants. Features include AI writing assistance, deadline tracking, and impact reporting.","category":"business","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 6. DesignLab
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-designlab',
  '',
  'designlab',
  'DesignLab',
  'design',
  'palette',
  'Professional design tools for creating stunning visuals, logos, and brand assets.',
  '{"tagline":"Creative Design Studio","long_description":"DesignLab is a cloud-based design studio with professional-grade tools for creating logos, brand assets, social media graphics, and more. Features include vector editing, template library, asset management, and real-time collaboration. Perfect for designers and marketers.","category":"design","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 7. MeauxLearn
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-meauxlearn',
  '',
  'meauxlearn',
  'MeauxLearn',
  'productivity',
  'book-open',
  'Build and deliver engaging online courses with interactive content and progress tracking.',
  '{"tagline":"Interactive Learning Platform","long_description":"MeauxLearn is a comprehensive learning management system for educators and trainers. Create engaging courses, track student progress, and deliver interactive content. Features include video hosting, quizzes, assignments, and analytics.","category":"productivity","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 8. CloudConnect
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-cloudconnect',
  '',
  'cloudconnect',
  'CloudConnect',
  'dev-tools',
  'plug',
  'Connect any API with no-code integration builder and workflow automation.',
  '{"tagline":"Universal API Integration","long_description":"CloudConnect makes API integration simple. Build complex workflows without code, connect hundreds of services, automate repetitive tasks, and create custom integrations. Features include visual workflow builder, error handling, scheduling, and monitoring.","category":"dev-tools","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 9. Admin Portal
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-admin-portal',
  '',
  'admin-portal',
  'Admin Portal',
  'admin',
  'shield',
  'Administrative control panel',
  '{"category":"admin","status":"live"}',
  1,
  0,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 10. MeauxLife OS
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-meaux-options',
  '',
  'meaux-options',
  'MeauxLife OS',
  'system',
  'cpu',
  'MeauxLife operating system',
  '{"category":"system","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 11. Inner Animals
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-inner-animals',
  '',
  'inner-animals',
  'InnerAnimals',
  'app',
  'smartphone',
  'Inner Animals mobile app',
  '{"category":"app","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 12. MeauxOrg
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-meaux-org',
  '',
  'meaux-org',
  'MeauxOrg',
  'productivity',
  'users',
  'Organization management',
  '{"category":"productivity","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 13. Spartans
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-spartans',
  '',
  'spartans',
  'Spartans',
  'app',
  'zap',
  'Spartans application',
  '{"category":"app","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 14. Fuel in Time
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-fuelintime',
  '',
  'fuelintime',
  'Fuel in Time',
  'app',
  'fuel',
  'Fuel in Time application',
  '{"category":"app","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 15. Fuel in Time Dev
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-fuelintime-dev',
  '',
  'fuelintime-dev',
  'Fuel in Time Dev',
  'app',
  'code',
  'Fuel in Time development',
  '{"category":"app","status":"live"}',
  1,
  0,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 16. Swampblood
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-swampblood',
  '',
  'swampblood',
  'Swampblood',
  'app',
  'droplet',
  'Swampblood application',
  '{"category":"app","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 17. Fahiippl
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-fahiippl',
  '',
  'fahiippl',
  'Fahiippl',
  'website',
  'globe',
  'Fahiippl website',
  '{"category":"website","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 18. Mehlppl
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-mehlppl',
  '',
  'mehlppl',
  'Mehlppl',
  'website',
  'globe',
  'Mehlppl website',
  '{"category":"website","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 19. API Base
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-api-base',
  '',
  'api-base',
  'API Base',
  'infrastructure',
  'server',
  'Base API infrastructure',
  '{"category":"infrastructure","status":"live"}',
  1,
  0,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 20. Asset Manager
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-asset-manager',
  '',
  'asset-manager',
  'Asset Manager',
  'tools',
  'folder',
  'Asset management system',
  '{"category":"tools","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 21. Settings
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-settings',
  '',
  'settings',
  'Settings',
  'system',
  'settings',
  'System settings',
  '{"category":"system","status":"live"}',
  1,
  0,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 22. MeauxAccess (duplicate entry - keeping as separate tool)
INSERT OR REPLACE INTO tools (
  id, tenant_id, name, display_name, category, icon, description,
  config, is_enabled, is_public, version, created_at, updated_at
) VALUES (
  'tool-meaux-access',
  '',
  'meaux-access',
  'MeauxAccess',
  'productivity',
  'layout-dashboard',
  'Team platform and workspace',
  '{"category":"productivity","status":"live"}',
  1,
  1,
  '1.0.0',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tools_tenant ON tools(tenant_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_tools_public ON tools(is_public, is_enabled);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
