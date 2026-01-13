# ✅ MeauxOS Tables Migration to InnerAnimal Media Business - Complete

## 🎯 Migration Summary

**Source Database**: `meauxos` (d8261777-9384-44f7-924d-c92247d55b46)  
**Target Database**: `inneranimalmedia-business` (cf87b717-d4e2-4cf8-bab0-a81268e32d49)  
**Migration Date**: 2026-01-12

## 📊 Tables Created

### ✅ **Fundraising & Grants System** (4 tables)

1. **`fundraising_tasks_v1`** - Fundraising task management
   - Modern version with tenant support
   - Supports campaigns, grants, and applications
   - Status: todo, in_progress, blocked, done, cancelled
   - Priority: low, medium, high, urgent

2. **`grant_kb_chunks_v1`** - Grant knowledge base chunks
   - Categories: grant_guidelines, past_application, funder_profile, internal_note, faq, policy
   - Supports source references and metadata

3. **`grant_opportunities_v1`** - Grant opportunity tracking
   - Funder types: foundation, government, corporate, nonprofit, individual
   - Status workflow: research → eligible → applying → submitted → awarded/rejected/closed
   - Award ranges in cents for precision

4. **`grant_templates_v1`** - Grant document templates
   - Template types: proposal, budget, impact_statement, cover_letter, follow_up_email, reporting
   - Markdown content storage

### ✅ **Infrastructure Documentation** (2 tables)

5. **`infrastructure_documentation`** - Infrastructure docs tracking
   - Links to R2 storage (bucket_name, r2_key)
   - Categories: analytics, r2-setup, database, onboarding, api, etc.
   - Content preview for quick reference

6. **`infrastructure_metadata`** - Infrastructure metadata storage
   - Metadata types: infrastructure-map, team-directory, config, architecture, etc.
   - JSON storage for flexible structure

### ✅ **Kanban System** (3 tables)

7. **`kanban_boards`** - Kanban board management
   - Board types: project, campaign, workflow, etc.
   - Config JSON for custom columns and settings

8. **`kanban_columns`** - Kanban column definitions
   - Position-based ordering
   - Color and config support

9. **`kanban_tasks`** - Kanban task management
   - Categories: html, worker, content, client, system, api, database, design
   - Priority levels and assignee tracking
   - Due date and completion tracking

### ✅ **Commands & Metadata** (2 tables)

10. **`meauxaccess_commands`** - MeauxAccess command library
    - Command codes and names
    - Categories: workflow, data, api, system, etc.
    - Command JSON structure

11. **`meauxos_app_metadata`** - MeauxOS app metadata
    - App status: live, dev, maintenance, archived
    - Category and icon tracking
    - Config JSON for settings

### ✅ **Media & Programs** (2 tables)

12. **`media_gallery`** - Media gallery management
    - Media types: image, video, audio, document
    - Categories: campaign, founder, community, event, partner, general, product, service
    - R2 storage integration
    - Featured content and display ordering

13. **`program_goals`** - Program goal tracking
    - Target and current value tracking
    - Progress percentage calculation
    - Status: active, completed, cancelled, on_hold
    - Links to campaigns and grants

## 🔍 Schema Enhancements

### Key Improvements Over Original:

1. **Multi-Tenant Support**: All tables now include `tenant_id` with default 'system'
2. **TEXT Primary Keys**: Standardized to TEXT IDs (removed AUTOINCREMENT where applicable)
3. **Unix Timestamps**: Consistent INTEGER timestamps using `unixepoch()`
4. **JSON Fields**: Added `meta_json` and `config_json` fields for flexible metadata
5. **Status Enums**: Proper CHECK constraints for status fields
6. **Indexes**: Comprehensive indexes for performance
7. **Foreign Keys**: Proper relationships with CASCADE/SET NULL where appropriate
8. **Unique Constraints**: Added UNIQUE constraints where needed (tenant_id + key combinations)

## 📋 Indexes Created

### Fundraising & Grants:
- `idx_fundraising_tasks_v1_tenant` - (tenant_id, status)
- `idx_fundraising_tasks_v1_grant` - (grant_id, status)
- `idx_fundraising_tasks_v1_campaign` - (campaign_id)
- `idx_fundraising_tasks_v1_assigned` - (assigned_to, status)
- `idx_fundraising_tasks_v1_due` - (due_at) WHERE due_at IS NOT NULL
- `idx_grant_kb_chunks_v1_tenant` - (tenant_id, category)
- `idx_grant_kb_chunks_v1_category` - (category)
- `idx_grant_opportunities_v1_tenant` - (tenant_id, status)
- `idx_grant_opportunities_v1_status` - (status, deadline_at)
- `idx_grant_opportunities_v1_funder` - (funder_type, status)
- `idx_grant_opportunities_v1_deadline` - (deadline_at) WHERE deadline_at IS NOT NULL
- `idx_grant_templates_v1_tenant` - (tenant_id, template_type)
- `idx_grant_templates_v1_type` - (template_type)

### Infrastructure:
- `idx_infrastructure_doc_tenant` - (tenant_id, category)
- `idx_infrastructure_doc_category` - (category)
- `idx_infrastructure_doc_r2_key` - (r2_key)
- `idx_infrastructure_meta_tenant` - (tenant_id, metadata_type)
- `idx_infrastructure_meta_type` - (metadata_type)

### Kanban:
- `idx_kanban_boards_tenant` - (tenant_id, is_active)
- `idx_kanban_boards_owner` - (owner_id)
- `idx_kanban_columns_board` - (board_id, position)
- `idx_kanban_tasks_board` - (board_id, column_id, position)
- `idx_kanban_tasks_tenant` - (tenant_id, status)
- `idx_kanban_tasks_assignee` - (assignee_id, status)
- `idx_kanban_tasks_due` - (due_date) WHERE due_date IS NOT NULL

### Commands & Metadata:
- `idx_meauxaccess_commands_tenant` - (tenant_id, category)
- `idx_meauxaccess_commands_code` - (code)
- `idx_meauxaccess_commands_category` - (category)
- `idx_meauxos_app_meta_tenant` - (tenant_id, status)
- `idx_meauxos_app_meta_category` - (category, status)
- `idx_meauxos_app_meta_slug` - (slug)

### Media & Programs:
- `idx_media_gallery_tenant` - (tenant_id, category, is_active)
- `idx_media_gallery_category` - (category, is_featured)
- `idx_media_gallery_campaign` - (related_campaign_id)
- `idx_media_gallery_featured` - (is_featured, display_order) WHERE is_featured = 1
- `idx_program_goals_tenant` - (tenant_id, status)
- `idx_program_goals_status` - (status, deadline)
- `idx_program_goals_campaign` - (related_campaign_id)
- `idx_program_goals_category` - (category, status)

**Total Indexes Created**: 35+

## ✅ Installation Status

**Tables Created**: 13/13 ✅
- `fundraising_tasks_v1` ✅
- `grant_kb_chunks_v1` ✅
- `grant_opportunities_v1` ✅
- `grant_templates_v1` ✅
- `infrastructure_documentation` ✅
- `infrastructure_metadata` ✅
- `kanban_boards` ✅
- `kanban_columns` ✅
- `kanban_tasks` ✅
- `meauxaccess_commands` ✅
- `meauxos_app_metadata` ✅
- `media_gallery` ✅
- `program_goals` ✅

## 📝 Usage Examples

### Create Fundraising Task

```sql
INSERT INTO fundraising_tasks_v1 (
    task_id, tenant_id, title, description, status, priority,
    assigned_to, due_at, created_at, updated_at
) VALUES (
    'task-' || unixepoch() || '-' || lower(hex(randomblob(4))),
    'system',
    'Draft Grant Proposal',
    'Complete first draft of Q1 2026 grant proposal',
    'todo',
    'high',
    'user-123',
    unixepoch('2026-02-01'),
    unixepoch(),
    unixepoch()
);
```

### Create Grant Opportunity

```sql
INSERT INTO grant_opportunities_v1 (
    grant_id, tenant_id, title, funder_name, funder_type,
    min_award_cents, max_award_cents, deadline_at, status,
    created_at, updated_at
) VALUES (
    'grant-' || unixepoch() || '-' || lower(hex(randomblob(4))),
    'system',
    'Community Impact Grant 2026',
    'Community Foundation',
    'foundation',
    5000000, -- $50,000
    10000000, -- $100,000
    unixepoch('2026-03-15'),
    'research',
    unixepoch(),
    unixepoch()
);
```

### Create Kanban Board

```sql
INSERT INTO kanban_boards (
    id, tenant_id, name, description, owner_id,
    created_at, updated_at
) VALUES (
    'board-' || unixepoch() || '-' || lower(hex(randomblob(4))),
    'system',
    'Q1 2026 Campaign Board',
    'Kanban board for Q1 fundraising campaign',
    'user-123',
    unixepoch(),
    unixepoch()
);
```

### Create Media Gallery Entry

```sql
INSERT INTO media_gallery (
    id, tenant_id, title, media_url, media_type, category,
    is_featured, display_order, created_at, updated_at
) VALUES (
    'media-' || unixepoch() || '-' || lower(hex(randomblob(4))),
    'system',
    'Campaign Photo 2026',
    'https://example.com/image.jpg',
    'image',
    'campaign',
    1,
    0,
    unixepoch(),
    unixepoch()
);
```

## 🔗 Relationships

### Foreign Keys:
- `kanban_columns.board_id` → `kanban_boards.id` (CASCADE)
- `kanban_tasks.board_id` → `kanban_boards.id` (CASCADE)
- `kanban_tasks.column_id` → `kanban_columns.id` (SET NULL)

### Logical Relationships:
- `fundraising_tasks_v1.grant_id` → `grant_opportunities_v1.grant_id`
- `fundraising_tasks_v1.campaign_id` → campaigns (if exists)
- `media_gallery.related_campaign_id` → campaigns (if exists)
- `program_goals.related_campaign_id` → campaigns (if exists)
- `program_goals.related_grant_id` → `grant_opportunities_v1.grant_id`

## 🚀 Next Steps

1. **Migrate Data** (if needed from meauxos)
   - Export data from meauxos tables
   - Transform IDs and add tenant_id
   - Import into inneranimalmedia-business

2. **Build API Handlers** (in worker.js)
   - `/api/fundraising/tasks`
   - `/api/grants/opportunities`
   - `/api/grants/templates`
   - `/api/kanban/boards`
   - `/api/kanban/tasks`
   - `/api/infrastructure/docs`
   - `/api/media/gallery`
   - `/api/programs/goals`

3. **Create UI Interfaces**
   - Fundraising dashboard
   - Grants management
   - Kanban board interface
   - Media gallery
   - Program goals tracking

4. **Set up Data Migration** (if migrating existing data)
   - Map old IDs to new TEXT IDs
   - Add tenant_id to all records
   - Update foreign key references

## 📋 Verification Commands

```bash
# Verify all tables exist
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT name FROM sqlite_master 
WHERE type='table' AND name IN (
    'fundraising_tasks_v1', 'grant_kb_chunks_v1', 'grant_opportunities_v1',
    'grant_templates_v1', 'infrastructure_documentation', 'infrastructure_metadata',
    'kanban_boards', 'kanban_columns', 'kanban_tasks', 'meauxaccess_commands',
    'meauxos_app_metadata', 'media_gallery', 'program_goals'
) ORDER BY name;
"

# Check table structure
wrangler d1 execute inneranimalmedia-business --remote --command="PRAGMA table_info(fundraising_tasks_v1);"

# Verify indexes
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT name, tbl_name FROM sqlite_master 
WHERE type='index' AND tbl_name IN (
    'fundraising_tasks_v1', 'grant_opportunities_v1', 'kanban_tasks'
) ORDER BY tbl_name, name;
"

# Count total tables
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT COUNT(*) as total_tables FROM sqlite_master WHERE type='table';
"
```

## ⚠️ Notes

1. **Legacy Tables Not Migrated**: 
   - `fundraising_tasks` (v0 - using INTEGER AUTOINCREMENT)
   - `grant_opportunities` (v0 - using TEXT but different structure)
   - Only v1 versions were migrated for modern structure

2. **Dependencies**:
   - `kanban_tasks` requires `kanban_columns` (created in migration)
   - Some tables reference campaigns/users which should exist in your system

3. **ID Generation**:
   - All IDs are TEXT type
   - Recommended format: `{prefix}-{timestamp}-{random}`
   - Example: `grant-1705089600-a1b2c3d4`

4. **Tenant Isolation**:
   - All tables support multi-tenancy via `tenant_id`
   - Default is 'system' for system-wide data
   - Always filter by `tenant_id` in queries

---

**✅ All MeauxOS tables are now properly installed and functional in inneranimalmedia-business!**

**Total Tables in Database**: 177 (including these 13 new tables)

## 🎯 Key Improvements Over Original MeauxOS Tables

### Standardizations Applied:

1. **Multi-Tenant Support**: All tables now include `tenant_id` with default 'system'
2. **TEXT Primary Keys**: Standardized all IDs to TEXT type (removed AUTOINCREMENT)
3. **Unix Timestamps**: Consistent INTEGER timestamps using `unixepoch()`
4. **JSON Metadata Fields**: Added `meta_json` and `config_json` for flexible data storage
5. **Status Enums**: Proper CHECK constraints for status fields
6. **Performance Indexes**: 35+ indexes created for optimal query performance
7. **Foreign Keys**: Proper relationships with CASCADE/SET NULL where appropriate
8. **Unique Constraints**: Added UNIQUE constraints for tenant_id + key combinations

### Table-Specific Enhancements:

- **fundraising_tasks_v1**: Enhanced with campaign_id, application_id, meta_json
- **grant_kb_chunks_v1**: Source type/ref tracking for knowledge base chunks
- **grant_opportunities_v1**: Award amounts in cents for precision, enhanced status workflow
- **grant_templates_v1**: Template type enum, markdown content support
- **infrastructure_documentation**: R2 integration with unique constraints
- **infrastructure_metadata**: Flexible metadata types with versioning
- **kanban_boards**: Board types, config JSON, active status
- **kanban_columns**: Position-based ordering, color support
- **kanban_tasks**: Enhanced categories, meta_json, completed_at tracking
- **meauxaccess_commands**: Command JSON structure, active status
- **meauxos_app_metadata**: Status enum, config JSON, unique slug per tenant
- **media_gallery**: R2 integration, file metadata (size, mime, dimensions, duration)
- **program_goals**: Progress tracking, status workflow, links to campaigns/grants
