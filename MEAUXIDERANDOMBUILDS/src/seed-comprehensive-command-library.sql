-- Comprehensive Command Library for Turbocharged Workflows
-- Stores standard command-line use cases for Wrangler, Cursor, Claude, Bash, etc.
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/seed-comprehensive-command-library.sql --remote

-- ============================================
-- WRANGLER COMMANDS (Cloudflare CLI)
-- ============================================

-- Deployment Commands
INSERT OR REPLACE INTO agent_commands (id, tenant_id, name, slug, description, category, command_text, parameters_json, implementation_type, implementation_ref, code_json, status, is_public, created_at, updated_at) VALUES
('cmd-wrangler-deploy', 'system', 'wrangler deploy', 'wrangler-deploy', 'Deploy Cloudflare Worker to production', 'deployment', 'wrangler deploy [--env production] [--name worker-name]', '["env", "name"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "deploy", "flags": ["--env", "--name"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-wrangler-deploy-staging', 'system', 'wrangler deploy staging', 'wrangler-deploy-staging', 'Deploy to staging environment', 'deployment', 'wrangler deploy --env staging', '[]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "deploy", "flags": ["--env", "staging"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-wrangler-dev', 'system', 'wrangler dev', 'wrangler-dev', 'Start local development server', 'development', 'wrangler dev [--port 8787] [--local]', '["port", "local"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "dev", "flags": ["--port", "--local"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-wrangler-pages-deploy', 'system', 'wrangler pages deploy', 'wrangler-pages-deploy', 'Deploy static site to Cloudflare Pages', 'deployment', 'wrangler pages deploy . [--project-name project-name] [--branch main]', '["project-name", "branch"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "pages deploy", "flags": ["--project-name", "--branch"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- Database Commands (D1)
('cmd-wrangler-d1-execute', 'system', 'wrangler d1 execute', 'wrangler-d1-execute', 'Execute SQL in D1 database', 'database', 'wrangler d1 execute [database] [--file file.sql] [--command "SQL"] [--remote] [--local]', '["database", "file", "command", "remote", "local"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "d1 execute", "flags": ["--file", "--command", "--remote", "--local"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-wrangler-d1-migrate', 'system', 'wrangler d1 migrations apply', 'wrangler-d1-migrate', 'Apply D1 migrations', 'database', 'wrangler d1 migrations apply [database] [--remote]', '["database", "remote"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "d1 migrations apply", "flags": ["--remote"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-wrangler-d1-query', 'system', 'wrangler d1 query', 'wrangler-d1-query', 'Query D1 database', 'database', 'wrangler d1 execute [database] --command "SELECT * FROM table" [--remote]', '["database", "command", "remote"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "d1 execute", "flags": ["--command", "--remote"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- Secrets Management
('cmd-wrangler-secret-put', 'system', 'wrangler secret put', 'wrangler-secret-put', 'Set a Worker secret', 'management', 'wrangler secret put [SECRET_NAME] [--env production]', '["secret_name", "env"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "secret put", "flags": ["--env"], "interactive": true}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-wrangler-secret-list', 'system', 'wrangler secret list', 'wrangler-secret-list', 'List all Worker secrets', 'management', 'wrangler secret list [--env production]', '["env"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "secret list", "flags": ["--env"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-wrangler-secret-delete', 'system', 'wrangler secret delete', 'wrangler-secret-delete', 'Delete a Worker secret', 'management', 'wrangler secret delete [SECRET_NAME] [--env production]', '["secret_name", "env"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "secret delete", "flags": ["--env"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- R2 Storage Commands
('cmd-wrangler-r2-bucket-list', 'system', 'wrangler r2 bucket list', 'wrangler-r2-bucket-list', 'List R2 buckets', 'storage', 'wrangler r2 bucket list', '[]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "r2 bucket list"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-wrangler-r2-object-list', 'system', 'wrangler r2 object list', 'wrangler-r2-object-list', 'List objects in R2 bucket', 'storage', 'wrangler r2 object list [BUCKET_NAME] [--prefix prefix/]', '["bucket_name", "prefix"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "r2 object list", "flags": ["--prefix"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-wrangler-r2-object-put', 'system', 'wrangler r2 object put', 'wrangler-r2-object-put', 'Upload object to R2', 'storage', 'wrangler r2 object put [BUCKET_NAME]/[KEY] --file [FILE_PATH]', '["bucket_name", "key", "file_path"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "r2 object put", "flags": ["--file"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-wrangler-r2-object-get', 'system', 'wrangler r2 object get', 'wrangler-r2-object-get', 'Download object from R2', 'storage', 'wrangler r2 object get [BUCKET_NAME]/[KEY] --file [OUTPUT_PATH]', '["bucket_name", "key", "output_path"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "r2 object get", "flags": ["--file"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-wrangler-r2-object-delete', 'system', 'wrangler r2 object delete', 'wrangler-r2-object-delete', 'Delete object from R2', 'storage', 'wrangler r2 object delete [BUCKET_NAME]/[KEY]', '["bucket_name", "key"]', 'builtin', 'wrangler', '{"tool": "wrangler", "command": "r2 object delete"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- BASH/SHELL COMMANDS
-- ============================================

INSERT OR REPLACE INTO agent_commands (id, tenant_id, name, slug, description, category, command_text, parameters_json, implementation_type, implementation_ref, code_json, status, is_public, created_at, updated_at) VALUES
-- File Operations
('cmd-bash-ls', 'system', 'ls', 'bash-ls', 'List directory contents', 'filesystem', 'ls [-la] [path]', '["options", "path"]', 'builtin', 'bash', '{"tool": "bash", "command": "ls", "flags": ["-la"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-cd', 'system', 'cd', 'bash-cd', 'Change directory', 'filesystem', 'cd [path]', '["path"]', 'builtin', 'bash', '{"tool": "bash", "command": "cd"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-cat', 'system', 'cat', 'bash-cat', 'Display file contents', 'filesystem', 'cat [file]', '["file"]', 'builtin', 'bash', '{"tool": "bash", "command": "cat"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-grep', 'system', 'grep', 'bash-grep', 'Search text in files', 'filesystem', 'grep [pattern] [file] [-r] [--include "*.ext"]', '["pattern", "file", "recursive", "include"]', 'builtin', 'bash', '{"tool": "bash", "command": "grep", "flags": ["-r", "--include"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-find', 'system', 'find', 'bash-find', 'Find files and directories', 'filesystem', 'find [path] [-name "pattern"] [-type f|d]', '["path", "name", "type"]', 'builtin', 'bash', '{"tool": "bash", "command": "find", "flags": ["-name", "-type"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-mkdir', 'system', 'mkdir', 'bash-mkdir', 'Create directory', 'filesystem', 'mkdir [-p] [directory]', '["create_parents", "directory"]', 'builtin', 'bash', '{"tool": "bash", "command": "mkdir", "flags": ["-p"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-rm', 'system', 'rm', 'bash-rm', 'Remove files/directories', 'filesystem', 'rm [-rf] [path]', '["recursive", "force", "path"]', 'builtin', 'bash', '{"tool": "bash", "command": "rm", "flags": ["-rf"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-cp', 'system', 'cp', 'bash-cp', 'Copy files/directories', 'filesystem', 'cp [-r] [source] [dest]', '["recursive", "source", "dest"]', 'builtin', 'bash', '{"tool": "bash", "command": "cp", "flags": ["-r"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-mv', 'system', 'mv', 'bash-mv', 'Move/rename files', 'filesystem', 'mv [source] [dest]', '["source", "dest"]', 'builtin', 'bash', '{"tool": "bash", "command": "mv"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- Git Commands
('cmd-bash-git-status', 'system', 'git status', 'bash-git-status', 'Show git repository status', 'git', 'git status', '[]', 'builtin', 'bash', '{"tool": "git", "command": "status"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-git-add', 'system', 'git add', 'bash-git-add', 'Stage files for commit', 'git', 'git add [file|.]', '["file"]', 'builtin', 'bash', '{"tool": "git", "command": "add"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-git-commit', 'system', 'git commit', 'bash-git-commit', 'Commit staged changes', 'git', 'git commit -m "[message]"', '["message"]', 'builtin', 'bash', '{"tool": "git", "command": "commit", "flags": ["-m"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-git-push', 'system', 'git push', 'bash-git-push', 'Push commits to remote', 'git', 'git push [origin] [branch]', '["origin", "branch"]', 'builtin', 'bash', '{"tool": "git", "command": "push"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-git-pull', 'system', 'git pull', 'bash-git-pull', 'Pull latest changes', 'git', 'git pull [origin] [branch]', '["origin", "branch"]', 'builtin', 'bash', '{"tool": "git", "command": "pull"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-git-clone', 'system', 'git clone', 'bash-git-clone', 'Clone repository', 'git', 'git clone [url] [directory]', '["url", "directory"]', 'builtin', 'bash', '{"tool": "git", "command": "clone"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-git-branch', 'system', 'git branch', 'bash-git-branch', 'List/create branches', 'git', 'git branch [-a] [-d branch] [new-branch]', '["all", "delete", "new_branch"]', 'builtin', 'bash', '{"tool": "git", "command": "branch", "flags": ["-a", "-d"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-git-checkout', 'system', 'git checkout', 'bash-git-checkout', 'Switch branches or restore files', 'git', 'git checkout [branch|-b new-branch]', '["branch", "create_branch"]', 'builtin', 'bash', '{"tool": "git", "command": "checkout", "flags": ["-b"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- Process Management
('cmd-bash-ps', 'system', 'ps', 'bash-ps', 'List running processes', 'process', 'ps aux | grep [pattern]', '["pattern"]', 'builtin', 'bash', '{"tool": "bash", "command": "ps", "flags": ["aux"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-kill', 'system', 'kill', 'bash-kill', 'Terminate process', 'process', 'kill [-9] [PID]', '["force", "pid"]', 'builtin', 'bash', '{"tool": "bash", "command": "kill", "flags": ["-9"]}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- System Info
('cmd-bash-pwd', 'system', 'pwd', 'bash-pwd', 'Print working directory', 'system', 'pwd', '[]', 'builtin', 'bash', '{"tool": "bash", "command": "pwd"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-bash-which', 'system', 'which', 'bash-which', 'Find command location', 'system', 'which [command]', '["command"]', 'builtin', 'bash', '{"tool": "bash", "command": "which"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- CURSOR COMMANDS (IDE Operations)
-- ============================================

INSERT OR REPLACE INTO agent_commands (id, tenant_id, name, slug, description, category, command_text, parameters_json, implementation_type, implementation_ref, code_json, status, is_public, created_at, updated_at) VALUES
('cmd-cursor-open-file', 'system', 'cursor: open file', 'cursor-open-file', 'Open file in Cursor editor', 'ide', 'Cursor: Open File [file-path]', '["file_path"]', 'api', '/api/files', '{"tool": "cursor", "action": "open_file", "endpoint": "/api/files"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-cursor-format-document', 'system', 'cursor: format document', 'cursor-format-document', 'Format current document', 'ide', 'Cursor: Format Document', '[]', 'api', '/api/ide/format', '{"tool": "cursor", "action": "format_document"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-cursor-find-references', 'system', 'cursor: find references', 'cursor-find-references', 'Find all references to symbol', 'ide', 'Cursor: Find All References [symbol]', '["symbol"]', 'api', '/api/ide/references', '{"tool": "cursor", "action": "find_references"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-cursor-rename-symbol', 'system', 'cursor: rename symbol', 'cursor-rename-symbol', 'Rename symbol across project', 'ide', 'Cursor: Rename Symbol [symbol] [new-name]', '["symbol", "new_name"]', 'api', '/api/ide/rename', '{"tool": "cursor", "action": "rename_symbol"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-cursor-search', 'system', 'cursor: search', 'cursor-search', 'Search across codebase', 'ide', 'Cursor: Search [query]', '["query"]', 'api', '/api/search', '{"tool": "cursor", "action": "search"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- WORKFLOW COMMANDS (Multi-Tool Orchestration)
-- ============================================

INSERT OR REPLACE INTO agent_commands (id, tenant_id, name, slug, description, category, command_text, parameters_json, implementation_type, implementation_ref, code_json, status, is_public, created_at, updated_at) VALUES
('cmd-workflow-deploy', 'system', 'workflow: deploy', 'workflow-deploy', 'Complete deployment workflow (git + wrangler)', 'workflow', 'workflow deploy [--env production]', '["env"]', 'workflow', 'deploy-full', '{"steps": ["git-status", "git-add", "git-commit", "git-push", "wrangler-deploy"], "human_checkpoint": "pre-deploy"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-workflow-migrate', 'system', 'workflow: migrate', 'workflow-migrate', 'Database migration workflow', 'workflow', 'workflow migrate [--database name] [--file migration.sql]', '["database", "file"]', 'workflow', 'migrate-db', '{"steps": ["backup-db", "wrangler-d1-execute", "verify-migration"], "human_checkpoint": "pre-migration"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-workflow-setup-project', 'system', 'workflow: setup project', 'workflow-setup-project', 'Complete project setup workflow', 'workflow', 'workflow setup-project [--name name] [--framework framework]', '["name", "framework"]', 'workflow', 'setup-project', '{"steps": ["mkdir", "git-init", "npm-init", "wrangler-init", "create-structure"], "human_checkpoint": "post-setup"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-workflow-backup', 'system', 'workflow: backup', 'workflow-backup', 'Backup workflow (database + files)', 'workflow', 'workflow backup [--database name] [--r2-bucket bucket]', '["database", "r2_bucket"]', 'workflow', 'backup-full', '{"steps": ["export-db", "backup-r2", "upload-backup"], "human_checkpoint": null}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- SERVICE MANAGEMENT COMMANDS
-- ============================================

INSERT OR REPLACE INTO agent_commands (id, tenant_id, name, slug, description, category, command_text, parameters_json, implementation_type, implementation_ref, code_json, status, is_public, created_at, updated_at) VALUES
('cmd-service-start', 'system', 'service: start', 'service-start', 'Start a service', 'service', 'service start [service-name]', '["service_name"]', 'api', '/api/services/start', '{"tool": "service", "action": "start"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-service-stop', 'system', 'service: stop', 'service-stop', 'Stop a service', 'service', 'service stop [service-name]', '["service_name"]', 'api', '/api/services/stop', '{"tool": "service", "action": "stop"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-service-status', 'system', 'service: status', 'service-status', 'Check service status', 'service', 'service status [service-name]', '["service_name"]', 'api', '/api/services/status', '{"tool": "service", "action": "status"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-service-restart', 'system', 'service: restart', 'service-restart', 'Restart a service', 'service', 'service restart [service-name]', '["service_name"]', 'api', '/api/services/restart', '{"tool": "service", "action": "restart"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-service-list', 'system', 'service: list', 'service-list', 'List all services', 'service', 'service list', '[]', 'api', '/api/services', '{"tool": "service", "action": "list"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- PLATFORM-SPECIFIC COMMANDS
-- ============================================

INSERT OR REPLACE INTO agent_commands (id, tenant_id, name, slug, description, category, command_text, parameters_json, implementation_type, implementation_ref, code_json, status, is_public, created_at, updated_at) VALUES
-- Clients Management
('cmd-clients-list', 'system', 'clients list', 'clients-list', 'List all clients', 'management', 'clients list [--tenant tenant-id]', '["tenant"]', 'api', '/api/clients', '{"tool": "api", "endpoint": "/api/clients", "method": "GET"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-clients-get', 'system', 'clients get', 'clients-get', 'Get client details', 'management', 'clients get [client-id]', '["client_id"]', 'api', '/api/clients/{id}', '{"tool": "api", "endpoint": "/api/clients", "method": "GET"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- Database Operations
('cmd-db-query', 'system', 'db query', 'db-query', 'Execute database query', 'database', 'db query "[SQL]" [--database name]', '["sql", "database"]', 'api', '/api/sql', '{"tool": "api", "endpoint": "/api/sql", "method": "POST"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-db-tables', 'system', 'db tables', 'db-tables', 'List database tables', 'database', 'db tables [--database name]', '["database"]', 'api', '/api/databases/tables', '{"tool": "api", "endpoint": "/api/databases/tables", "method": "GET"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- Deploy
('cmd-deploy', 'system', 'deploy', 'deploy', 'Deploy application', 'deployment', 'deploy [--env production] [--project name]', '["env", "project"]', 'workflow', 'deploy-full', '{"steps": ["wrangler-deploy", "verify-deployment"], "human_checkpoint": "pre-deploy"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- IAM (Identity & Access Management)
('cmd-iam-users-list', 'system', 'iam users list', 'iam-users-list', 'List all users', 'iam', 'iam users list [--tenant tenant-id]', '["tenant"]', 'api', '/api/users', '{"tool": "api", "endpoint": "/api/users", "method": "GET"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-iam-users-create', 'system', 'iam users create', 'iam-users-create', 'Create new user', 'iam', 'iam users create --email email --name name --role role', '["email", "name", "role"]', 'api', '/api/users', '{"tool": "api", "endpoint": "/api/users", "method": "POST"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-iam-permissions', 'system', 'iam permissions', 'iam-permissions', 'Manage user permissions', 'iam', 'iam permissions [user-id] [--grant permission] [--revoke permission]', '["user_id", "grant", "revoke"]', 'api', '/api/users/{id}/permissions', '{"tool": "api", "endpoint": "/api/users/{id}/permissions", "method": "POST"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- Infrastructure
('cmd-infrastructure-status', 'system', 'infrastructure status', 'infrastructure-status', 'Check infrastructure status', 'infrastructure', 'infrastructure status', '[]', 'api', '/api/infrastructure/status', '{"tool": "api", "endpoint": "/api/infrastructure/status", "method": "GET"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- Knowledge
('cmd-knowledge-search', 'system', 'knowledge search', 'knowledge-search', 'Search knowledge base', 'knowledge', 'knowledge search "[query]"', '["query"]', 'api', '/api/knowledge/search', '{"tool": "api", "endpoint": "/api/knowledge/search", "method": "POST"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-knowledge-add', 'system', 'knowledge add', 'knowledge-add', 'Add to knowledge base', 'knowledge', 'knowledge add --title title --content content', '["title", "content"]', 'api', '/api/knowledge', '{"tool": "api", "endpoint": "/api/knowledge", "method": "POST"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- List
('cmd-list', 'system', 'list', 'list', 'List resources (context-aware)', 'meta', 'list [resource-type]', '["resource_type"]', 'api', '/api/list', '{"tool": "api", "endpoint": "/api/list", "method": "GET", "context_aware": true}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- MeauxOS Commands
('cmd-meauxos-backup', 'system', 'meauxos backup', 'meauxos-backup', 'Backup MeauxOS data', 'backup', 'meauxos backup [--database name] [--r2-bucket bucket]', '["database", "r2_bucket"]', 'workflow', 'backup-full', '{"steps": ["export-db", "backup-r2"], "human_checkpoint": null}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-meauxos-costs', 'system', 'meauxos costs', 'meauxos-costs', 'View cost tracking', 'costs', 'meauxos costs [--period month|year] [--service service]', '["period", "service"]', 'api', '/api/cost-tracking', '{"tool": "api", "endpoint": "/api/cost-tracking", "method": "GET"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-meauxos-employees', 'system', 'meauxos employees', 'meauxos-employees', 'Manage employees/users', 'management', 'meauxos employees [list|get|create|update] [--id id]', '["action", "id"]', 'api', '/api/users', '{"tool": "api", "endpoint": "/api/users", "method": "GET|POST|PUT"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- Quickstart
('cmd-quickstart', 'system', 'quickstart', 'quickstart', 'Quick project setup', 'setup', 'quickstart [--type type] [--name name]', '["type", "name"]', 'workflow', 'setup-project', '{"steps": ["setup-structure", "install-deps", "configure"], "human_checkpoint": "post-setup"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

-- R2 Storage
('cmd-r2-list', 'system', 'r2 list', 'r2-list', 'List R2 buckets or objects', 'storage', 'r2 list [bucket-name] [--prefix prefix/]', '["bucket_name", "prefix"]', 'api', '/api/storage/r2', '{"tool": "api", "endpoint": "/api/storage/r2", "method": "GET"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-r2-upload', 'system', 'r2 upload', 'r2-upload', 'Upload to R2', 'storage', 'r2 upload [bucket]/[key] --file [file-path]', '["bucket", "key", "file_path"]', 'api', '/api/storage/r2/upload', '{"tool": "api", "endpoint": "/api/storage/r2/upload", "method": "POST"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now')),

('cmd-r2-download', 'system', 'r2 download', 'r2-download', 'Download from R2', 'storage', 'r2 download [bucket]/[key] --file [output-path]', '["bucket", "key", "output_path"]', 'api', '/api/storage/r2/download', '{"tool": "api", "endpoint": "/api/storage/r2/download", "method": "GET"}', 'active', 1, strftime('%s', 'now'), strftime('%s', 'now'));
