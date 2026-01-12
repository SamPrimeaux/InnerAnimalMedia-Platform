-- Complete Wrangler CLI Commands Library
-- Organized by category for optimal workflow development
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/seed-wrangler-commands-complete.sql --remote

-- ============================================
-- D1 DATABASE COMMANDS (Most Used)
-- ============================================

INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES 
  ('cmd-d1-list', '', 'wrangler', 'd1 list', 'wrangler d1 list', 'List all D1 databases', 'database', 'd1', 'Check available databases', 'wrangler d1 list', NULL, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-d1-execute-remote', '', 'wrangler', 'd1 execute (remote)', 'wrangler d1 execute {database_name} --remote --command="{sql}"', 'Execute SQL on remote DB', 'database', 'd1', 'Query/modify production database', 'wrangler d1 execute inneranimalmedia-business --remote --command="SELECT * FROM courses;"', json_object('database_name', 'inneranimalmedia-business', 'sql', 'SELECT * FROM courses;'), 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-d1-execute-file-remote', '', 'wrangler', 'd1 execute file (remote)', 'wrangler d1 execute {database_name} --file={file_path} --remote', 'Run SQL file on remote', 'database', 'd1', 'Run migrations/seeds on production', 'wrangler d1 execute inneranimalmedia-business --file=src/schema.sql --remote', json_object('database_name', 'inneranimalmedia-business', 'file_path', 'src/schema.sql'), 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-d1-execute-local', '', 'wrangler', 'd1 execute (local)', 'wrangler d1 execute {database_name} --local --command="{sql}"', 'Execute SQL on local DB', 'database', 'd1', 'Test queries locally', 'wrangler d1 execute inneranimalmedia-business --local --command="SELECT * FROM courses;"', json_object('database_name', 'inneranimalmedia-business', 'sql', 'SELECT * FROM courses;'), 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-d1-execute-file-local', '', 'wrangler', 'd1 execute file (local)', 'wrangler d1 execute {database_name} --file={file_path} --local', 'Run SQL file locally', 'database', 'd1', 'Test migrations locally', 'wrangler d1 execute inneranimalmedia-business --file=src/schema.sql --local', json_object('database_name', 'inneranimalmedia-business', 'file_path', 'src/schema.sql'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-d1-create', '', 'wrangler', 'd1 create', 'wrangler d1 create {database_name}', 'Create new D1 database', 'database', 'd1', 'Start new project', 'wrangler d1 create my-database', json_object('database_name', 'my-database'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-d1-delete', '', 'wrangler', 'd1 delete', 'wrangler d1 delete {database_name}', 'Delete D1 database', 'database', 'd1', 'Clean up unused databases', 'wrangler d1 delete old-database', json_object('database_name', 'old-database'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-d1-info', '', 'wrangler', 'd1 info', 'wrangler d1 info {database_name}', 'Get database info', 'database', 'd1', 'Check database details', 'wrangler d1 info inneranimalmedia-business', json_object('database_name', 'inneranimalmedia-business'), 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- DEPLOYMENT COMMANDS
-- ============================================

INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES 
  ('cmd-deploy', '', 'wrangler', 'deploy', 'wrangler deploy', 'Deploy Worker to Cloudflare', 'deployment', 'worker', 'Deploy after code changes', 'wrangler deploy', NULL, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-deploy-env', '', 'wrangler', 'deploy (env)', 'wrangler deploy --env={environment}', 'Deploy to specific environment', 'deployment', 'worker', 'Deploy to staging/production', 'wrangler deploy --env=production', json_object('environment', 'production'), 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-pages-deploy', '', 'wrangler', 'pages deploy', 'wrangler pages deploy {directory} --project-name={project_name}', 'Deploy to Cloudflare Pages', 'deployment', 'pages', 'Deploy static site', 'wrangler pages deploy . --project-name=meauxos-unified-dashboard', json_object('directory', '.', 'project_name', 'meauxos-unified-dashboard'), 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-pages-deploy-dirty', '', 'wrangler', 'pages deploy (dirty)', 'wrangler pages deploy {directory} --project-name={project_name} --commit-dirty=true', 'Deploy with uncommitted changes', 'deployment', 'pages', 'Quick deploy without commit', 'wrangler pages deploy . --project-name=meauxos-unified-dashboard --commit-dirty=true', json_object('directory', '.', 'project_name', 'meauxos-unified-dashboard'), 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- DEVELOPMENT COMMANDS
-- ============================================

INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES 
  ('cmd-dev', '', 'wrangler', 'dev', 'wrangler dev', 'Start local dev server', 'development', 'local', 'Local development', 'wrangler dev', NULL, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-dev-remote', '', 'wrangler', 'dev (remote)', 'wrangler dev --remote', 'Dev with remote DB', 'development', 'local', 'Test against production DB', 'wrangler dev --remote', NULL, 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-dev-port', '', 'wrangler', 'dev (port)', 'wrangler dev --port={port}', 'Dev on custom port', 'development', 'local', 'When default port is busy', 'wrangler dev --port=8788', json_object('port', '8788'), 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- SECRETS MANAGEMENT
-- ============================================

INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES 
  ('cmd-secret-put', '', 'wrangler', 'secret put', 'wrangler secret put {secret_name}', 'Set a secret', 'secrets', 'management', 'Store API keys/tokens', 'wrangler secret put GITHUB_TOKEN', json_object('secret_name', 'GITHUB_TOKEN'), 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-secret-delete', '', 'wrangler', 'secret delete', 'wrangler secret delete {secret_name}', 'Delete a secret', 'secrets', 'management', 'Remove/rotate secrets', 'wrangler secret delete OLD_KEY', json_object('secret_name', 'OLD_KEY'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-secret-list', '', 'wrangler', 'secret list', 'wrangler secret list', 'List all secrets', 'secrets', 'management', 'Check configured secrets', 'wrangler secret list', NULL, 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- R2 STORAGE COMMANDS
-- ============================================

INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES 
  ('cmd-r2-bucket-list', '', 'wrangler', 'r2 bucket list', 'wrangler r2 bucket list', 'List R2 buckets', 'storage', 'r2', 'Check available buckets', 'wrangler r2 bucket list', NULL, 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-r2-bucket-create', '', 'wrangler', 'r2 bucket create', 'wrangler r2 bucket create {bucket_name}', 'Create R2 bucket', 'storage', 'r2', 'New storage bucket', 'wrangler r2 bucket create my-assets', json_object('bucket_name', 'my-assets'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-r2-bucket-delete', '', 'wrangler', 'r2 bucket delete', 'wrangler r2 bucket delete {bucket_name}', 'Delete R2 bucket', 'storage', 'r2', 'Remove unused bucket', 'wrangler r2 bucket delete old-bucket', json_object('bucket_name', 'old-bucket'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-r2-object-put', '', 'wrangler', 'r2 object put', 'wrangler r2 object put {bucket_name}/{key} --file={file_path}', 'Upload to R2', 'storage', 'r2', 'Upload files/assets', 'wrangler r2 object put my-bucket/image.png --file=./image.png', json_object('bucket_name', 'my-bucket', 'key', 'image.png', 'file_path', './image.png'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-r2-object-get', '', 'wrangler', 'r2 object get', 'wrangler r2 object get {bucket_name}/{key} --file={output_path}', 'Download from R2', 'storage', 'r2', 'Download files', 'wrangler r2 object get my-bucket/file.txt --file=./downloaded.txt', json_object('bucket_name', 'my-bucket', 'key', 'file.txt', 'output_path', './downloaded.txt'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-r2-object-list', '', 'wrangler', 'r2 object list', 'wrangler r2 object list {bucket_name}', 'List R2 objects', 'storage', 'r2', 'Browse bucket contents', 'wrangler r2 object list my-bucket', json_object('bucket_name', 'my-bucket'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-r2-object-delete', '', 'wrangler', 'r2 object delete', 'wrangler r2 object delete {bucket_name}/{key}', 'Delete R2 object', 'storage', 'r2', 'Remove files', 'wrangler r2 object delete my-bucket/old-file.txt', json_object('bucket_name', 'my-bucket', 'key', 'old-file.txt'), 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- KV STORAGE COMMANDS
-- ============================================

INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES 
  ('cmd-kv-namespace-list', '', 'wrangler', 'kv namespace list', 'wrangler kv namespace list', 'List KV namespaces', 'storage', 'kv', 'Check KV namespaces', 'wrangler kv namespace list', NULL, 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-kv-namespace-create', '', 'wrangler', 'kv namespace create', 'wrangler kv namespace create {namespace_name}', 'Create KV namespace', 'storage', 'kv', 'New key-value storage', 'wrangler kv namespace create CACHE', json_object('namespace_name', 'CACHE'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-kv-key-put', '', 'wrangler', 'kv key put', 'wrangler kv key put --namespace-id={namespace_id} "{key}" "{value}"', 'Set KV key', 'storage', 'kv', 'Store key-value data', 'wrangler kv key put --namespace-id=abc123 "user:123" "data"', json_object('namespace_id', 'abc123', 'key', 'user:123', 'value', 'data'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-kv-key-get', '', 'wrangler', 'kv key get', 'wrangler kv key get --namespace-id={namespace_id} "{key}"', 'Get KV key', 'storage', 'kv', 'Retrieve cached data', 'wrangler kv key get --namespace-id=abc123 "user:123"', json_object('namespace_id', 'abc123', 'key', 'user:123'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-kv-key-delete', '', 'wrangler', 'kv key delete', 'wrangler kv key delete --namespace-id={namespace_id} "{key}"', 'Delete KV key', 'storage', 'kv', 'Remove cached data', 'wrangler kv key delete --namespace-id=abc123 "user:123"', json_object('namespace_id', 'abc123', 'key', 'user:123'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-kv-key-list', '', 'wrangler', 'kv key list', 'wrangler kv key list --namespace-id={namespace_id}', 'List KV keys', 'storage', 'kv', 'Browse all keys', 'wrangler kv key list --namespace-id=abc123', json_object('namespace_id', 'abc123'), 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- GIT COMMANDS (Common Workflows)
-- ============================================

INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES 
  ('cmd-git-status', '', 'git', 'status', 'git status', 'Check git status', 'version-control', 'git', 'See what changed', 'git status', NULL, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-git-add-all', '', 'git', 'add all', 'git add .', 'Stage all changes', 'version-control', 'git', 'Before committing', 'git add .', NULL, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-git-commit', '', 'git', 'commit', 'git commit -m "{message}"', 'Commit changes', 'version-control', 'git', 'Save changes', 'git commit -m "Add new feature"', json_object('message', 'Add new feature'), 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-git-push', '', 'git', 'push', 'git push origin {branch}', 'Push to remote', 'version-control', 'git', 'Upload changes', 'git push origin main', json_object('branch', 'main'), 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-git-pull', '', 'git', 'pull', 'git pull origin {branch}', 'Pull latest changes', 'version-control', 'git', 'Get updates', 'git pull origin main', json_object('branch', 'main'), 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-git-branch', '', 'git', 'branch', 'git branch {branch_name}', 'Create branch', 'version-control', 'git', 'Start new feature', 'git branch feature-new', json_object('branch_name', 'feature-new'), 0, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-git-checkout', '', 'git', 'checkout', 'git checkout {branch_name}', 'Switch branch', 'version-control', 'git', 'Change branches', 'git checkout feature-new', json_object('branch_name', 'feature-new'), 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- NODE/NPM COMMANDS
-- ============================================

INSERT OR REPLACE INTO commands (
  id, tenant_id, tool, command_name, command_template, description, category, subcategory,
  when_to_use, examples, parameters, is_favorite, created_at, updated_at
) VALUES 
  ('cmd-npm-install', '', 'npm', 'install', 'npm install', 'Install dependencies', 'package-management', 'npm', 'After cloning or adding packages', 'npm install', NULL, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-npm-install-package', '', 'npm', 'install package', 'npm install {package_name}', 'Install specific package', 'package-management', 'npm', 'Add new dependency', 'npm install express', json_object('package_name', 'express'), 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cmd-npm-run', '', 'npm', 'run script', 'npm run {script_name}', 'Run npm script', 'package-management', 'npm', 'Execute package scripts', 'npm run build', json_object('script_name', 'build'), 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- COMMON WORKFLOWS
-- ============================================

INSERT OR REPLACE INTO dev_workflows (
  id, tenant_id, name, description, category, steps_json, command_sequence,
  estimated_time_minutes, is_template, tags, created_at, updated_at
) VALUES 
  ('workflow-full-deploy', '', 'Full Stack Deployment', 'Complete deployment: DB migration + Worker + Pages', 'deployment', 
   json_array(
     json_object('step', 1, 'command_id', 'cmd-d1-execute-file-remote', 'description', 'Run database migrations'),
     json_object('step', 2, 'command_id', 'cmd-deploy', 'description', 'Deploy Worker'),
     json_object('step', 3, 'command_id', 'cmd-pages-deploy', 'description', 'Deploy Pages')
   ),
   'wrangler d1 execute inneranimalmedia-business --file=src/migration.sql --remote && wrangler deploy && wrangler pages deploy . --project-name=meauxos-unified-dashboard',
   5, 1, 'deployment,production,full-stack', strftime('%s', 'now'), strftime('%s', 'now')),
  
  ('workflow-db-migration-safe', '', 'Safe Database Migration', 'Test locally then deploy to remote', 'database',
   json_array(
     json_object('step', 1, 'command_id', 'cmd-d1-execute-file-local', 'description', 'Test migration locally'),
     json_object('step', 2, 'command_id', 'cmd-d1-execute-file-remote', 'description', 'Deploy to production')
   ),
   'wrangler d1 execute inneranimalmedia-business --local --file=src/migration.sql && wrangler d1 execute inneranimalmedia-business --file=src/migration.sql --remote',
   3, 1, 'database,migration,safe', strftime('%s', 'now'), strftime('%s', 'now')),
  
  ('workflow-dev-setup', '', 'Development Setup', 'Initialize local dev environment', 'development',
   json_array(
     json_object('step', 1, 'command_id', 'cmd-d1-execute-file-local', 'description', 'Setup local database'),
     json_object('step', 2, 'command_id', 'cmd-dev', 'description', 'Start dev server')
   ),
   'wrangler d1 execute inneranimalmedia-business --local --file=src/schema.sql && wrangler dev',
   2, 1, 'development,setup,local', strftime('%s', 'now'), strftime('%s', 'now')),
  
  ('workflow-git-deploy', '', 'Git + Deploy Workflow', 'Commit, push, and deploy', 'deployment',
   json_array(
     json_object('step', 1, 'command_id', 'cmd-git-add-all', 'description', 'Stage changes'),
     json_object('step', 2, 'command_id', 'cmd-git-commit', 'description', 'Commit'),
     json_object('step', 3, 'command_id', 'cmd-git-push', 'description', 'Push to GitHub'),
     json_object('step', 4, 'command_id', 'cmd-deploy', 'description', 'Deploy Worker')
   ),
   'git add . && git commit -m "Update" && git push origin main && wrangler deploy',
   3, 1, 'git,deployment,ci-cd', strftime('%s', 'now'), strftime('%s', 'now'));
