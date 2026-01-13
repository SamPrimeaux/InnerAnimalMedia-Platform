# ✅ InnerAnimal Media Business - Core Tables Complete

## 🎯 Installation Summary

**Database**: `inneranimalmedia-business` (cf87b717-d4e2-4cf8-bab0-a81268e32d49)  
**Migration Date**: 2026-01-12  
**Tables Created**: 10 core platform tables (9 main tables + 1 junction table)

## 📊 Tables Created

### ✅ **Prompt Templates** (1 table)

1. **`prompt_templates`** - AI Prompt Template Management
   - Template types: system, user, workflow, api, ai, custom
   - Variable system with JSON configuration
   - Model preferences and parameters
   - Public/private sharing
   - Usage tracking
   - **Columns**: 20
   - **Indexes**: 4

### ✅ **R2 Storage** (2 tables)

2. **`r2_buckets`** - R2 Bucket Management
   - Bucket configuration and metadata
   - CORS and lifecycle rules
   - Public access settings
   - Usage statistics
   - **Columns**: 15
   - **Indexes**: 3

3. **`r2_objects`** - R2 Object Storage Tracking
   - Object metadata and tracking
   - Versioning support
   - Public URL management
   - Storage class tracking
   - **Columns**: 22
   - **Indexes**: 5

### ✅ **Settings** (1 table)

4. **`settings`** - Key-Value Configuration Store
   - Type-safe settings (string, number, boolean, json, array, object)
   - Category organization
   - Encryption support
   - Validation rules
   - **Columns**: 17
   - **Indexes**: 3

### ✅ **Superadmin Accounts** (1 table)

5. **`superadmin_accounts`** - Superadmin Account Management
   - Email-based superadmin tracking
   - Role-based access (superadmin, admin, support)
   - MFA support
   - Status management
   - **Columns**: 18
   - **Indexes**: 3

### ✅ **Tasks** (1 table)

6. **`tasks`** - General Task Management
   - Task types: general, project, maintenance, support, bug, feature, content, marketing
   - Status workflow: todo → in_progress → review → blocked → done/cancelled
   - Priority levels: low, medium, high, urgent, critical
   - Subtask support (parent_task_id)
   - Time tracking (estimated/actual hours)
   - **Columns**: 27
   - **Indexes**: 7

### ✅ **Teams** (2 tables)

7. **`teams`** - Team Management
   - Team types: department, project, functional, cross-functional, external
   - Team settings and permissions
   - Public/private teams
   - **Columns**: 16
   - **Indexes**: 4

8. **`team_members`** - Team Membership (Junction Table)
   - Role-based membership (owner, admin, member, viewer, guest)
   - Individual member permissions
   - Status tracking
   - **Columns**: 10
   - **Indexes**: 3

### ✅ **UI Guidelines** (1 table)

9. **`ui_guidelines`** - Design System & UI Guidelines
   - Guideline types: design_system, component, pattern, accessibility, content, brand, interaction
   - Markdown content with HTML cache
   - Examples and references
   - Versioning and review system
   - **Columns**: 19
   - **Indexes**: 4

### ✅ **User Secrets** (1 table)

10. **`user_secrets`** - Encrypted Secret Storage
    - Secret types: api_key, password, token, credential, certificate, custom
    - Encrypted storage
    - Expiration tracking
    - Usage tracking
    - Service association
    - **Columns**: 16
    - **Indexes**: 4

## 🔍 Schema Features

### Key Design Patterns:

1. **Multi-Tenant Support**: All tables include `tenant_id` with default 'system'
2. **TEXT Primary Keys**: Consistent TEXT IDs for scalability
3. **Unix Timestamps**: INTEGER timestamps using `unixepoch()`
4. **JSON Metadata**: Flexible `meta_json` and config fields
5. **Status Enums**: CHECK constraints for status fields
6. **Performance Indexes**: 40+ indexes for optimal query performance
7. **Foreign Keys**: Proper relationships with CASCADE where appropriate
8. **Unique Constraints**: Tenant + key combinations for data integrity

## 📋 Indexes Created (40+)

### Prompt Templates (4 indexes):
- `idx_prompt_templates_tenant` - (tenant_id, template_type, is_active)
- `idx_prompt_templates_type` - (template_type, category)
- `idx_prompt_templates_category` - (category, is_public)
- `idx_prompt_templates_public` - (is_public, is_active) WHERE is_public = 1

### R2 Storage (8 indexes):
- `idx_r2_buckets_tenant` - (tenant_id, is_active)
- `idx_r2_buckets_name` - (bucket_name)
- `idx_r2_buckets_public` - (public_access, is_active)
- `idx_r2_objects_bucket` - (bucket_id, object_key)
- `idx_r2_objects_tenant` - (tenant_id, category, is_active)
- `idx_r2_objects_category` - (category, created_at DESC)
- `idx_r2_objects_public` - (is_public, bucket_id) WHERE is_public = 1
- `idx_r2_objects_uploaded` - (uploaded_by, created_at DESC)

### Settings (3 indexes):
- `idx_settings_tenant` - (tenant_id, category, is_active)
- `idx_settings_key` - (setting_key, tenant_id)
- `idx_settings_category` - (category, is_public)

### Superadmin Accounts (3 indexes):
- `idx_superadmin_accounts_email` - (email)
- `idx_superadmin_accounts_status` - (status, role)
- `idx_superadmin_accounts_user` - (user_id) WHERE user_id IS NOT NULL

### Tasks (7 indexes):
- `idx_tasks_tenant` - (tenant_id, status, priority)
- `idx_tasks_assignee` - (assignee_id, status) WHERE assignee_id IS NOT NULL
- `idx_tasks_type` - (task_type, status)
- `idx_tasks_project` - (project_id, status) WHERE project_id IS NOT NULL
- `idx_tasks_parent` - (parent_task_id) WHERE parent_task_id IS NOT NULL
- `idx_tasks_due` - (due_date, status) WHERE due_date IS NOT NULL
- `idx_tasks_related` - (related_entity_type, related_entity_id) WHERE related_entity_id IS NOT NULL

### Teams (7 indexes):
- `idx_teams_tenant` - (tenant_id, is_active)
- `idx_teams_slug` - (tenant_id, slug)
- `idx_teams_type` - (team_type, is_active)
- `idx_teams_owner` - (owner_id) WHERE owner_id IS NOT NULL
- `idx_team_members_team` - (team_id, status)
- `idx_team_members_user` - (user_id, status)
- `idx_team_members_tenant` - (tenant_id, role)

### UI Guidelines (4 indexes):
- `idx_ui_guidelines_tenant` - (tenant_id, guideline_type, status)
- `idx_ui_guidelines_type` - (guideline_type, category, status)
- `idx_ui_guidelines_category` - (category, status)
- `idx_ui_guidelines_applies_to` - (applies_to, status)

### User Secrets (4 indexes):
- `idx_user_secrets_user` - (user_id, secret_type, is_active)
- `idx_user_secrets_service` - (service_name, is_active)
- `idx_user_secrets_tenant` - (tenant_id, secret_type)
- `idx_user_secrets_expires` - (expires_at, is_active) WHERE expires_at IS NOT NULL

## 📝 Usage Examples

### Create Prompt Template

```sql
INSERT INTO prompt_templates (
    id, tenant_id, name, description, template_type, category,
    content, variables_json, model_preference, is_active,
    created_at, updated_at
) VALUES (
    'prompt-' || unixepoch() || '-' || lower(hex(randomblob(4))),
    'system',
    'Code Review Assistant',
    'AI prompt for code review assistance',
    'ai',
    'code',
    'Review the following code for {{language}}: {{code}}',
    '{"language": {"type": "string", "description": "Programming language"}, "code": {"type": "string", "description": "Code to review"}}',
    'gpt-4',
    1,
    unixepoch(),
    unixepoch()
);
```

### Create R2 Bucket

```sql
INSERT INTO r2_buckets (
    id, tenant_id, bucket_name, display_name, description,
    public_access, is_active, created_at, updated_at
) VALUES (
    'bucket-' || unixepoch() || '-' || lower(hex(randomblob(4))),
    'system',
    'inneranimalmedia-assets',
    'InnerAnimal Media Assets',
    'Public asset storage bucket',
    1,
    1,
    unixepoch(),
    unixepoch()
);
```

### Create Superadmin Account

```sql
INSERT INTO superadmin_accounts (
    id, email, name, role, status, email_verified,
    created_at, updated_at
) VALUES (
    'superadmin-' || unixepoch() || '-' || lower(hex(randomblob(4))),
    'admin@inneranimalmedia.com',
    'Primary Admin',
    'superadmin',
    'active',
    1,
    unixepoch(),
    unixepoch()
);
```

### Create Task

```sql
INSERT INTO tasks (
    id, tenant_id, task_type, title, description, status, priority,
    assignee_id, due_date, created_at, updated_at
) VALUES (
    'task-' || unixepoch() || '-' || lower(hex(randomblob(4))),
    'system',
    'feature',
    'Implement user authentication',
    'Build OAuth 2.0 authentication flow',
    'todo',
    'high',
    'user-123',
    unixepoch('2026-02-01'),
    unixepoch(),
    unixepoch()
);
```

### Create Team

```sql
INSERT INTO teams (
    id, tenant_id, name, slug, description, team_type,
    is_active, created_at, updated_at
) VALUES (
    'team-' || unixepoch() || '-' || lower(hex(randomblob(4))),
    'system',
    'Engineering Team',
    'engineering',
    'Software development team',
    'department',
    1,
    unixepoch(),
    unixepoch()
);
```

### Store User Secret

```sql
INSERT INTO user_secrets (
    id, user_id, tenant_id, secret_name, secret_value_encrypted,
    secret_type, service_name, is_active, created_at, updated_at
) VALUES (
    'secret-' || unixepoch() || '-' || lower(hex(randomblob(4))),
    'user-123',
    'system',
    'api_key',
    'encrypted_value_here',
    'api_key',
    'github',
    1,
    unixepoch(),
    unixepoch()
);
```

## 🔗 Relationships

### Foreign Keys:
- `r2_objects.bucket_id` → `r2_buckets.id` (CASCADE)
- `team_members.team_id` → `teams.id` (CASCADE)
- `tasks.parent_task_id` → `tasks.id` (self-reference)

### Logical Relationships:
- `superadmin_accounts.user_id` → `users.id` (if exists)
- `tasks.assignee_id` → `users.id` (if exists)
- `tasks.reporter_id` → `users.id` (if exists)
- `tasks.project_id` → `projects.id` (if exists)
- `user_secrets.user_id` → `users.id` (if exists)
- `teams.owner_id` → `users.id` (if exists)

## 🚀 Next Steps

1. **Populate Superadmin Accounts**
   - Add all superadmin email addresses
   - Link to existing user accounts where applicable
   - Set appropriate permissions

2. **Initialize Settings**
   - Create default system settings
   - Configure tenant-specific settings
   - Set up feature flags

3. **Set up R2 Buckets**
   - Create default buckets (assets, backups, etc.)
   - Configure CORS and lifecycle rules
   - Set public access policies

4. **Create Default Teams**
   - Set up organizational teams
   - Assign team members
   - Configure team permissions

5. **Build API Handlers** (in worker.js)
   - `/api/prompts/templates`
   - `/api/r2/buckets`
   - `/api/r2/objects`
   - `/api/settings`
   - `/api/superadmin/accounts`
   - `/api/tasks`
   - `/api/teams`
   - `/api/ui/guidelines`
   - `/api/users/secrets`

6. **Create UI Interfaces**
   - Prompt template manager
   - R2 storage browser
   - Settings configuration
   - Superadmin management
   - Task management dashboard
   - Team management interface
   - UI guidelines viewer
   - Secret management (secure)

## ⚠️ Important Notes

1. **sqlite_sequence**: This is an auto-created SQLite system table for AUTOINCREMENT columns. No manual creation needed.

2. **Superadmin Accounts**: The `superadmin_accounts` table is designed to track all superadmin email addresses (including "random emails" as mentioned). The `user_id` field can link to actual user accounts when they exist, but the table can also function independently.

3. **User Secrets**: All secret values should be encrypted before storage. The `secret_value_encrypted` field stores encrypted data. Implement encryption/decryption in the application layer.

4. **R2 Objects**: This table tracks metadata about R2 objects. The actual objects are stored in Cloudflare R2. This table provides a database interface for querying and managing object metadata.

5. **Settings**: The `is_encrypted` flag indicates if the setting value should be encrypted. Implement encryption for sensitive settings.

6. **Teams vs Tasks**: The `teams` table is for organizational teams. The `tasks` table is for general task management (separate from `fundraising_tasks_v1`).

## 📋 Verification Commands

```bash
# Verify all tables exist
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT name FROM sqlite_master 
WHERE type='table' AND name IN (
    'prompt_templates', 'r2_buckets', 'r2_objects', 'settings',
    'superadmin_accounts', 'tasks', 'teams', 'team_members',
    'ui_guidelines', 'user_secrets'
) ORDER BY name;
"

# Check table structure
wrangler d1 execute inneranimalmedia-business --remote --command="PRAGMA table_info(prompt_templates);"

# Verify indexes
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT name, tbl_name FROM sqlite_master 
WHERE type='index' AND tbl_name IN (
    'prompt_templates', 'r2_buckets', 'tasks', 'teams'
) ORDER BY tbl_name, name;
"

# Count total tables
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT COUNT(*) as total_tables FROM sqlite_master WHERE type='table';
"
```

---

**✅ All core InnerAnimal Media Business tables are now properly installed and functional!**
