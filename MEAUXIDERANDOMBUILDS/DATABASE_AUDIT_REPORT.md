# 🔍 Database Audit Report - SaaS Readiness

## Executive Summary

**Total Tables**: 159  
**Production-Ready**: ~120 tables  
**Needs Optimization**: ~30 tables  
**Legacy/Redundant**: ~9 tables  

## 🚨 Critical Issues Found

### 1. **Users Table Missing `tenant_id`** ⚠️ CRITICAL
```sql
-- CURRENT (BROKEN for multi-tenant):
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    -- ❌ NO tenant_id!
    ...
)

-- SHOULD BE:
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,  -- ✅ REQUIRED
    email TEXT NOT NULL,
    ...
    UNIQUE(tenant_id, email)
)
```

**Impact**: Users cannot be isolated by tenant. This breaks multi-tenancy.

### 2. **Missing Indexes on Core Tables** ⚠️ HIGH
Many tables have **0 indexes**, causing:
- Slow queries on large datasets
- Poor performance for multi-tenant filtering
- Missing composite indexes on `(tenant_id, created_at)`

**Tables with 0 indexes** (sample):
- `agent_command_executions`
- `agent_configs`
- `ai_chat_history`
- `ai_context_store`
- `activity_events`
- `activity_log`
- Many more...

### 3. **Legacy Tables** ⚠️ MEDIUM
These should be migrated/removed:
- `agent_configs_legacy`
- `ai_knowledge_base_legacy`
- `assets_legacy`
- `brands_legacy`

### 4. **Projects Table Schema Mismatch** ⚠️ MEDIUM
```sql
-- CURRENT:
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ❌ Should be TEXT
    -- ❌ NO tenant_id!
    ...
)

-- SHOULD BE:
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,  -- ✅ REQUIRED
    ...
)
```

## ✅ What's Good

1. **Core SaaS Tables Present**:
   - ✅ `tenants` - Properly structured
   - ✅ `tenant_metadata` - SaaS billing/subscription
   - ✅ `oauth_providers`, `oauth_tokens` - OAuth system
   - ✅ `deployments` - Has `tenant_id`
   - ✅ `tools` - Has `tenant_id` and proper structure
   - ✅ `themes` - Properly structured (now with data)

2. **Feature Tables**:
   - ✅ AI system (knowledge base, prompts, RAG)
   - ✅ Agent system (commands, configs, sessions)
   - ✅ Calendar system
   - ✅ CMS system
   - ✅ Cost tracking
   - ✅ Support system

3. **No Test/Demo Tables**:
   - ✅ No tables with `test`, `demo`, `temp` in names (except `command_templates` which is valid)

## 📊 Table Categories

### Core SaaS (Production-Ready)
- `tenants`, `tenant_metadata`
- `users` (needs `tenant_id` fix)
- `user_metadata`
- `oauth_*` tables
- `sessions`
- `audit_logs`
- `api_keys`

### Features (Production-Ready)
- `tools`, `tool_access`
- `workflows`, `workflow_executions`
- `themes`, `theme_access`
- `projects`, `builds`, `deployments`
- `webhooks`
- `external_connections`

### AI/Agent System (Production-Ready)
- `ai_knowledge_base`, `ai_prompts_library`
- `agent_configs`, `agent_commands`
- `ai_chat_history`
- `ai_rag_search_history`

### CMS/Content (Production-Ready)
- `cms_*` tables (themes, assets, collections, folders)
- `content_*` tables

### Legacy (Needs Cleanup)
- `agent_configs_legacy`
- `ai_knowledge_base_legacy`
- `assets_legacy`
- `brands_legacy`

## 🔧 Required Fixes

### Priority 1: Critical Multi-Tenancy Fixes
1. **Add `tenant_id` to `users` table**
2. **Add `tenant_id` to `projects` table**
3. **Add composite indexes on all tenant-filtered tables**

### Priority 2: Performance Optimization
1. **Add indexes to all tables with `tenant_id`**
2. **Add indexes on frequently queried columns** (`created_at`, `status`, `email`)
3. **Add foreign key indexes**

### Priority 3: Cleanup
1. **Migrate data from legacy tables**
2. **Drop legacy tables**
3. **Verify all tables have proper schema**

## 📈 Recommended Actions

1. ✅ **Run migration to add `tenant_id` to `users` and `projects`**
2. ✅ **Create comprehensive index migration**
3. ✅ **Migrate legacy table data**
4. ✅ **Drop legacy tables**
5. ✅ **Verify all queries filter by `tenant_id`**

---

**Status**: Database is **80% production-ready** but needs critical multi-tenancy fixes before going live.
