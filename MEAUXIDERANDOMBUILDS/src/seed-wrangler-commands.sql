-- Seed: Wrangler CLI Commands Library
-- Organized by category for optimal workflow development
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/seed-wrangler-commands.sql --remote

-- ============================================
-- D1 DATABASE COMMANDS
-- ============================================

-- List databases
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, is_favorite, created_at, updated_at
) VALUES (
  'cmd-wrangler-d1-list',
  '',
  'wrangler',
  'd1 list',
  'wrangler d1 list',
  'List all D1 databases in your account',
  'database',
  'd1',
  'When you need to see all available databases or find a database ID',
  'wrangler d1 list',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Execute SQL (remote)
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES (
  'cmd-wrangler-d1-execute-remote',
  '',
  'wrangler',
  'd1 execute (remote)',
  'wrangler d1 execute {database_name} --remote --command="{sql}"',
  'Execute SQL query on remote D1 database',
  'database',
  'd1',
  'When you need to query or modify production database',
  'wrangler d1 execute inneranimalmedia-business --remote --command="SELECT * FROM courses LIMIT 5;"',
  '{"database_name": "inneranimalmedia-business", "sql": "SELECT * FROM courses;"}',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Execute SQL file (remote)
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES (
  'cmd-wrangler-d1-execute-file-remote',
  '',
  'wrangler',
  'd1 execute file (remote)',
  'wrangler d1 execute {database_name} --file={file_path} --remote',
  'Execute SQL file on remote D1 database',
  'database',
  'd1',
  'When running migrations or seed files on production',
  'wrangler d1 execute inneranimalmedia-business --file=src/schema.sql --remote',
  '{"database_name": "inneranimalmedia-business", "file_path": "src/schema.sql"}',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Execute SQL (local)
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-d1-execute-local',
  '',
  'wrangler',
  'd1 execute (local)',
  'wrangler d1 execute {database_name} --local --command="{sql}"',
  'Execute SQL query on local D1 database',
  'database',
  'd1',
  'When testing queries locally before running on production',
  'wrangler d1 execute inneranimalmedia-business --local --command="SELECT * FROM courses;"',
  '{"database_name": "inneranimalmedia-business", "sql": "SELECT * FROM courses;"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Create database
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-d1-create',
  '',
  'wrangler',
  'd1 create',
  'wrangler d1 create {database_name}',
  'Create a new D1 database',
  'database',
  'd1',
  'When starting a new project or need a new database',
  'wrangler d1 create my-new-database',
  '{"database_name": "my-new-database"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Delete database
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, common_errors, created_at, updated_at
) VALUES (
  'cmd-wrangler-d1-delete',
  '',
  'wrangler',
  'd1 delete',
  'wrangler d1 delete {database_name}',
  'Delete a D1 database (irreversible!)',
  'database',
  'd1',
  'When consolidating databases or cleaning up unused ones',
  'wrangler d1 delete old-database',
  '{"database_name": "old-database"}',
  'Warning: This action is irreversible. Make sure you have backups.',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- DEPLOYMENT COMMANDS
-- ============================================

-- Deploy Worker
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, is_favorite, created_at, updated_at
) VALUES (
  'cmd-wrangler-deploy',
  '',
  'wrangler',
  'deploy',
  'wrangler deploy',
  'Deploy Worker to Cloudflare',
  'deployment',
  'worker',
  'After making changes to your Worker code',
  'wrangler deploy',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Deploy with environment
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-deploy-env',
  '',
  'wrangler',
  'deploy (environment)',
  'wrangler deploy --env={environment}',
  'Deploy Worker to specific environment',
  'deployment',
  'worker',
  'When you have multiple environments (staging, production)',
  'wrangler deploy --env=production',
  '{"environment": "production"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Deploy Pages
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES (
  'cmd-wrangler-pages-deploy',
  '',
  'wrangler',
  'pages deploy',
  'wrangler pages deploy {directory} --project-name={project_name}',
  'Deploy static site to Cloudflare Pages',
  'deployment',
  'pages',
  'When deploying frontend/static sites',
  'wrangler pages deploy . --project-name=meauxos-unified-dashboard',
  '{"directory": ".", "project_name": "meauxos-unified-dashboard"}',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- DEVELOPMENT COMMANDS
-- ============================================

-- Dev server
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, is_favorite, created_at, updated_at
) VALUES (
  'cmd-wrangler-dev',
  '',
  'wrangler',
  'dev',
  'wrangler dev',
  'Start local development server',
  'development',
  'local',
  'When developing and testing locally',
  'wrangler dev',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Dev with remote
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, created_at, updated_at
) VALUES (
  'cmd-wrangler-dev-remote',
  '',
  'wrangler',
  'dev (remote)',
  'wrangler dev --remote',
  'Start dev server with remote D1 database',
  'development',
  'local',
  'When you want to test against production database',
  'wrangler dev --remote',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- SECRETS MANAGEMENT
-- ============================================

-- Put secret
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES (
  'cmd-wrangler-secret-put',
  '',
  'wrangler',
  'secret put',
  'wrangler secret put {secret_name}',
  'Set a secret (will prompt for value)',
  'secrets',
  'management',
  'When storing API keys, tokens, or sensitive data',
  'wrangler secret put GITHUB_TOKEN',
  '{"secret_name": "GITHUB_TOKEN"}',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Delete secret
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-secret-delete',
  '',
  'wrangler',
  'secret delete',
  'wrangler secret delete {secret_name}',
  'Delete a secret',
  'secrets',
  'management',
  'When rotating or removing secrets',
  'wrangler secret delete OLD_API_KEY',
  '{"secret_name": "OLD_API_KEY"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- List secrets
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, created_at, updated_at
) VALUES (
  'cmd-wrangler-secret-list',
  '',
  'wrangler',
  'secret list',
  'wrangler secret list',
  'List all secrets (names only, not values)',
  'secrets',
  'management',
  'When checking what secrets are configured',
  'wrangler secret list',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- R2 STORAGE COMMANDS
-- ============================================

-- List R2 buckets
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, created_at, updated_at
) VALUES (
  'cmd-wrangler-r2-bucket-list',
  '',
  'wrangler',
  'r2 bucket list',
  'wrangler r2 bucket list',
  'List all R2 buckets',
  'storage',
  'r2',
  'When checking available buckets',
  'wrangler r2 bucket list',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Create R2 bucket
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-r2-bucket-create',
  '',
  'wrangler',
  'r2 bucket create',
  'wrangler r2 bucket create {bucket_name}',
  'Create a new R2 bucket',
  'storage',
  'r2',
  'When you need a new storage bucket',
  'wrangler r2 bucket create my-assets',
  '{"bucket_name": "my-assets"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Put object
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-r2-object-put',
  '',
  'wrangler',
  'r2 object put',
  'wrangler r2 object put {bucket_name}/{key} --file={file_path}',
  'Upload file to R2 bucket',
  'storage',
  'r2',
  'When uploading assets, files, or content',
  'wrangler r2 object put my-bucket/image.png --file=./image.png',
  '{"bucket_name": "my-bucket", "key": "image.png", "file_path": "./image.png"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Get object
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-r2-object-get',
  '',
  'wrangler',
  'r2 object get',
  'wrangler r2 object get {bucket_name}/{key} --file={output_path}',
  'Download file from R2 bucket',
  'storage',
  'r2',
  'When downloading assets or files',
  'wrangler r2 object get my-bucket/file.txt --file=./downloaded.txt',
  '{"bucket_name": "my-bucket", "key": "file.txt", "output_path": "./downloaded.txt"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- List objects
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-r2-object-list',
  '',
  'wrangler',
  'r2 object list',
  'wrangler r2 object list {bucket_name}',
  'List all objects in R2 bucket',
  'storage',
  'r2',
  'When browsing bucket contents',
  'wrangler r2 object list my-bucket',
  '{"bucket_name": "my-bucket"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Delete object
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-r2-object-delete',
  '',
  'wrangler',
  'r2 object delete',
  'wrangler r2 object delete {bucket_name}/{key}',
  'Delete object from R2 bucket',
  'storage',
  'r2',
  'When cleaning up unused files',
  'wrangler r2 object delete my-bucket/old-file.txt',
  '{"bucket_name": "my-bucket", "key": "old-file.txt"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- KV COMMANDS
-- ============================================

-- List KV namespaces
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, created_at, updated_at
) VALUES (
  'cmd-wrangler-kv-namespace-list',
  '',
  'wrangler',
  'kv namespace list',
  'wrangler kv namespace list',
  'List all KV namespaces',
  'storage',
  'kv',
  'When checking available KV namespaces',
  'wrangler kv namespace list',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Create KV namespace
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-kv-namespace-create',
  '',
  'wrangler',
  'kv namespace create',
  'wrangler kv namespace create {namespace_name}',
  'Create a new KV namespace',
  'storage',
  'kv',
  'When you need key-value storage',
  'wrangler kv namespace create CACHE',
  '{"namespace_name": "CACHE"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Put KV key
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-kv-key-put',
  '',
  'wrangler',
  'kv key put',
  'wrangler kv key put --namespace-id={namespace_id} "{key}" "{value}"',
  'Set a KV key-value pair',
  'storage',
  'kv',
  'When storing simple key-value data',
  'wrangler kv key put --namespace-id=abc123 "user:123" "{\"name\":\"John\"}"',
  '{"namespace_id": "abc123", "key": "user:123", "value": "{\"name\":\"John\"}"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Get KV key
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-kv-key-get',
  '',
  'wrangler',
  'kv key get',
  'wrangler kv key get --namespace-id={namespace_id} "{key}"',
  'Get value for a KV key',
  'storage',
  'kv',
  'When retrieving cached or stored data',
  'wrangler kv key get --namespace-id=abc123 "user:123"',
  '{"namespace_id": "abc123", "key": "user:123"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Delete KV key
INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, created_at, updated_at
) VALUES (
  'cmd-wrangler-kv-key-delete',
  '',
  'wrangler',
  'kv key delete',
  'wrangler kv key delete --namespace-id={namespace_id} "{key}"',
  'Delete a KV key',
  'storage',
  'kv',
  'When removing cached or stored data',
  'wrangler kv key delete --namespace-id=abc123 "user:123"',
  '{"namespace_id": "abc123", "key": "user:123"}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- COMMON WORKFLOWS
-- ============================================

-- Full deployment workflow
INSERT OR REPLACE INTO dev_workflows (
  id, tenant_id, name, description, category, steps_json, command_sequence,
  estimated_time_minutes, is_template, tags, created_at, updated_at
) VALUES (
  'workflow-full-deploy',
  '',
  'Full Deployment Workflow',
  'Complete workflow: migrate DB, deploy Worker, deploy Pages',
  'deployment',
  json_array(
    json_object('step', 1, 'command_id', 'cmd-wrangler-d1-execute-file-remote', 'description', 'Run database migrations'),
    json_object('step', 2, 'command_id', 'cmd-wrangler-deploy', 'description', 'Deploy Worker'),
    json_object('step', 3, 'command_id', 'cmd-wrangler-pages-deploy', 'description', 'Deploy Pages')
  ),
  'wrangler d1 execute inneranimalmedia-business --file=src/migration.sql --remote && wrangler deploy && wrangler pages deploy . --project-name=meauxos-unified-dashboard',
  5,
  1,
  'deployment,production,full-stack',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Database migration workflow
INSERT OR REPLACE INTO dev_workflows (
  id, tenant_id, name, description, category, steps_json, command_sequence,
  estimated_time_minutes, is_template, tags, created_at, updated_at
) VALUES (
  'workflow-db-migration',
  '',
  'Database Migration Workflow',
  'Safe database migration: backup, test locally, deploy to remote',
  'database',
  json_array(
    json_object('step', 1, 'command_id', 'cmd-wrangler-d1-execute-local', 'description', 'Test migration locally'),
    json_object('step', 2, 'command_id', 'cmd-wrangler-d1-execute-file-remote', 'description', 'Deploy migration to remote')
  ),
  'wrangler d1 execute inneranimalmedia-business --local --file=src/migration.sql && wrangler d1 execute inneranimalmedia-business --file=src/migration.sql --remote',
  3,
  1,
  'database,migration,safe',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Development setup workflow
INSERT OR REPLACE INTO dev_workflows (
  id, tenant_id, name, description, category, steps_json, command_sequence,
  estimated_time_minutes, is_template, tags, created_at, updated_at
) VALUES (
  'workflow-dev-setup',
  '',
  'Development Setup Workflow',
  'Set up local development environment',
  'development',
  json_array(
    json_object('step', 1, 'command_id', 'cmd-wrangler-d1-execute-local', 'description', 'Initialize local database'),
    json_object('step', 2, 'command_id', 'cmd-wrangler-dev', 'description', 'Start dev server')
  ),
  'wrangler d1 execute inneranimalmedia-business --local --file=src/schema.sql && wrangler dev',
  2,
  1,
  'development,setup,local',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
