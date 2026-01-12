# 🎯 MeauxOS Migration Priority - Key Functions & Workflows

**Date**: January 9, 2026  
**Status**: Priority Analysis for Migration

---

## 🔥 **CRITICAL PRIORITY 1: Agent System (MeauxMCP)** 

### Why Critical:
- **MeauxMCP is the core engine** - Powers agent-based automation
- **Agent configurations are user-customized** - Recipes, prompts, custom configs
- **Agent sessions track execution history** - Important for debugging and monitoring
- **Agent commands define capabilities** - Critical for functionality

### Tables to Migrate:

#### 1. **`agent_configs`** ⭐⭐⭐ (CRITICAL)
- **Purpose**: Agent configurations, recipes, custom prompts
- **Contains**: 
  - Recipe prompts (pre-built agent templates)
  - Custom agent configurations
  - Template configurations
  - Status (active/inactive)
- **Migration Target**: `agent_configs_legacy` → Merge into `tools` table or create `agent_configs` table
- **Priority**: **HIGHEST** - Without this, MeauxMCP loses all custom agent configs

#### 2. **`agent_sessions`** ⭐⭐⭐ (CRITICAL)
- **Purpose**: Track active agent execution sessions
- **Contains**:
  - Session state
  - Execution context
  - Participant information
  - Metadata for running agents
- **Migration Target**: Merge into `sessions` table or create `agent_sessions` table
- **Priority**: **HIGHEST** - Needed for active agent monitoring

#### 3. **`agent_commands`** ⭐⭐⭐ (CRITICAL)
- **Purpose**: Available commands for agents to execute
- **Contains**:
  - Command definitions
  - Command parameters
  - Command metadata
  - Execution history
- **Migration Target**: Create `agent_commands` table or merge into `workflows` table
- **Priority**: **HIGHEST** - Commands define what agents can do

#### 4. **`agent_recipe_prompts`** ⭐⭐ (HIGH)
- **Purpose**: Pre-built agent recipe prompts
- **Contains**: Recipe templates for common workflows
- **Migration Target**: Merge into `agent_configs` or create separate `agent_recipes` table
- **Priority**: **HIGH** - Recipe library is valuable IP

#### 5. **`agent_telemetry`** ⭐ (MEDIUM)
- **Purpose**: Agent performance metrics
- **Contains**: Execution times, success rates, usage stats
- **Migration Target**: Create `agent_telemetry` table or merge into `audit_logs`
- **Priority**: **MEDIUM** - Useful for analytics but not critical for functionality

---

## 🚀 **CRITICAL PRIORITY 2: Apps Library**

### Why Critical:
- **22 apps** already created in meauxos
- **User favorites and preferences** stored per app
- **App metadata** (categories, frameworks, tags)
- **Featured apps** designation

### Tables to Migrate:

#### 1. **`apps`** ⭐⭐⭐ (CRITICAL)
- **Purpose**: Application library - 22 apps
- **Contains**:
  - App name, slug, description
  - Category, framework
  - Repository URL, demo URL
  - Preview images
  - Tags (JSON)
  - Status (active/archived/draft)
  - Featured flag
- **Migration Target**: Already created `apps` table in inneranimalmedia-business
- **Priority**: **HIGHEST** - This is user-created content, must preserve
- **Action**: Run migration via `/api/migrate/meauxos/apps` with batch_size=100

---

## 🤖 **HIGH PRIORITY 3: AI Knowledge Base & Conversations**

### Why Important:
- **AI assistant functionality** depends on knowledge base
- **Conversation history** for context-aware responses
- **Vector embeddings** for semantic search (if available)

### Tables to Migrate:

#### 1. **`ai_knowledge_base`** ⭐⭐ (HIGH)
- **Purpose**: Knowledge base for AI assistant
- **Contains**:
  - Title, content
  - Category, tags
  - Vector embeddings (if available)
  - Source URLs
- **Migration Target**: `ai_knowledge_base_legacy` → Create `ai_knowledge_base` table
- **Priority**: **HIGH** - Critical for AI assistant functionality

#### 2. **`ai_conversations`** ⭐⭐ (HIGH)
- **Purpose**: AI conversation history
- **Contains**:
  - Conversation threads
  - Message history
  - Context data
- **Migration Target**: Create `ai_conversations` table or merge into `agent_sessions`
- **Priority**: **HIGH** - Preserves conversation context

#### 3. **`ai_messages`** ⭐ (MEDIUM)
- **Purpose**: Individual AI messages
- **Contains**: Message content, timestamps, metadata
- **Migration Target**: Create `ai_messages` table or merge into `ai_conversations`
- **Priority**: **MEDIUM** - Can be derived from conversations if needed

---

## 📁 **HIGH PRIORITY 4: Assets Management**

### Why Important:
- **Media library metadata** for R2 assets
- **Asset tags and folders** for organization
- **Metadata (EXIF, dimensions, duration)** for media files

### Tables to Migrate:

#### 1. **`assets`** ⭐⭐ (HIGH)
- **Purpose**: Asset metadata for R2 files
- **Contains**:
  - File name, path (R2 path)
  - File type (image/video/document/audio/model)
  - File size, mime type
  - Dimensions (width/height)
  - Duration (for videos/audio)
  - Metadata JSON (EXIF, etc.)
  - Tags, folder path
- **Migration Target**: `assets_legacy` → Create `assets` table
- **Priority**: **HIGH** - Needed for media library functionality

#### 2. **`asset_metadata`** ⭐ (MEDIUM)
- **Purpose**: Extended metadata for assets
- **Contains**: Additional metadata beyond main assets table
- **Migration Target**: Merge into `assets` table
- **Priority**: **MEDIUM** - Can merge with assets table

#### 3. **`asset_tags`** ⭐ (MEDIUM)
- **Purpose**: Tag system for assets
- **Contains**: Tags and tag relationships
- **Migration Target**: Merge into `assets.tags_json` field
- **Priority**: **MEDIUM** - Can be stored as JSON in assets table

---

## 📅 **MEDIUM PRIORITY 5: Calendar Events**

### Why Important:
- **Scheduling functionality** already exists
- **Event history** and recurring events
- **Integration with workflows** for scheduled tasks

### Tables to Migrate:

#### 1. **`calendar_events`** ⭐⭐ (HIGH)
- **Purpose**: Calendar events and scheduling
- **Contains**:
  - Event title, description
  - Start/end times
  - Recurrence rules
  - Attendees
  - Event metadata
- **Migration Target**: Already exists in inneranimalmedia-business, verify schema match
- **Priority**: **HIGH** - Already migrated, verify completeness

---

## 🎨 **MEDIUM PRIORITY 6: Brands & Theming**

### Why Important:
- **Brand presets** for multi-tenant theming
- **Logo and favicon URLs**
- **Theme configurations** (colors, fonts)

### Tables to Migrate:

#### 1. **`brands`** ⭐ (MEDIUM)
- **Purpose**: Brand presets and configurations
- **Contains**:
  - Brand name, slug
  - Logo, favicon URLs
  - Theme JSON
  - Colors JSON
  - Fonts JSON
- **Migration Target**: `brands_legacy` → Merge into `tenant_theme` table
- **Priority**: **MEDIUM** - Can use tenant_theme table for brand configs

---

## ✅ **ALREADY MIGRATED: Workflows**

### Status: ✅ Already Exists in inneranimalmedia-business

#### **`workflows`** ✅
- **Purpose**: Automation workflows
- **Status**: Already exists in inneranimalmedia-business
- **Action**: Verify workflow data migration completeness
- **Priority**: **VERIFY** - Ensure all workflow data migrated

---

## 📊 **MIGRATION PRIORITY SUMMARY**

| Priority | Table | Purpose | Migration Target | Status |
|----------|-------|---------|------------------|--------|
| ⭐⭐⭐ CRITICAL | `agent_configs` | Agent configurations & recipes | `agent_configs` or merge into `tools` | ⚠️ **MIGRATE FIRST** |
| ⭐⭐⭐ CRITICAL | `agent_sessions` | Active agent sessions | `agent_sessions` or merge into `sessions` | ⚠️ **MIGRATE FIRST** |
| ⭐⭐⭐ CRITICAL | `agent_commands` | Agent command definitions | `agent_commands` or merge into `workflows` | ⚠️ **MIGRATE FIRST** |
| ⭐⭐⭐ CRITICAL | `apps` | 22 apps library | `apps` (already created) | ✅ **READY** |
| ⭐⭐ HIGH | `agent_recipe_prompts` | Agent recipe library | Merge into `agent_configs` | ⚠️ **MIGRATE SECOND** |
| ⭐⭐ HIGH | `ai_knowledge_base` | AI knowledge base | `ai_knowledge_base` | ⚠️ **MIGRATE SECOND** |
| ⭐⭐ HIGH | `ai_conversations` | AI conversation history | `ai_conversations` | ⚠️ **MIGRATE SECOND** |
| ⭐⭐ HIGH | `assets` | Asset metadata | `assets` | ⚠️ **MIGRATE SECOND** |
| ⭐⭐ HIGH | `calendar_events` | Calendar events | `calendar_events` (verify) | ✅ **EXISTS** |
| ⭐ MEDIUM | `agent_telemetry` | Agent metrics | `agent_telemetry` or `audit_logs` | ⚠️ **MIGRATE THIRD** |
| ⭐ MEDIUM | `ai_messages` | Individual AI messages | Merge into `ai_conversations` | ⚠️ **MIGRATE THIRD** |
| ⭐ MEDIUM | `asset_metadata` | Extended asset metadata | Merge into `assets` | ⚠️ **MIGRATE THIRD** |
| ⭐ MEDIUM | `asset_tags` | Asset tags | Merge into `assets.tags_json` | ⚠️ **MIGRATE THIRD** |
| ⭐ MEDIUM | `brands` | Brand presets | Merge into `tenant_theme` | ⚠️ **MIGRATE THIRD** |
| ✅ VERIFY | `workflows` | Automation workflows | `workflows` (already exists) | ✅ **EXISTS** - Verify data |

---

## 🚀 **RECOMMENDED MIGRATION ORDER**

### **Phase 1: CRITICAL - Agent System** (Do First)
1. ✅ Create `agent_configs` table in inneranimalmedia-business
2. ✅ Create `agent_sessions` table in inneranimalmedia-business
3. ✅ Create `agent_commands` table in inneranimalmedia-business
4. ✅ Migrate `agent_configs` (all rows)
5. ✅ Migrate `agent_sessions` (active sessions first)
6. ✅ Migrate `agent_commands` (all commands)

### **Phase 2: CRITICAL - Apps Library** (Do Second)
1. ✅ Apps table already created
2. ✅ Run: `POST /api/migrate/meauxos/apps` with batch_size=100
3. ✅ Verify all 22 apps migrated

### **Phase 3: HIGH - AI & Assets** (Do Third)
1. ✅ Create `ai_knowledge_base` table
2. ✅ Create `ai_conversations` table
3. ✅ Migrate `ai_knowledge_base` (all rows)
4. ✅ Migrate `ai_conversations` (all rows)
5. ✅ Migrate `assets` (batch by tenant)

### **Phase 4: MEDIUM - Supporting Data** (Do Fourth)
1. ✅ Migrate `agent_recipe_prompts` (merge into agent_configs)
2. ✅ Migrate `agent_telemetry` (if needed for analytics)
3. ✅ Migrate `asset_metadata` (merge into assets)
4. ✅ Migrate `brands` (merge into tenant_theme)

### **Phase 5: VERIFY** (Do Last)
1. ✅ Verify `workflows` data completeness
2. ✅ Verify `calendar_events` data completeness
3. ✅ Run data integrity checks
4. ✅ Test all migrated functionality

---

## 🎯 **KEY WORKFLOWS TO PRESERVE**

### 1. **MeauxMCP Agent Workflows** (CRITICAL)
- Agent recipe execution
- Custom agent configurations
- Agent session management
- Command execution pipeline

### 2. **Apps Library Workflows** (CRITICAL)
- App discovery and favorites
- App deployment workflows
- App category filtering
- Featured apps display

### 3. **AI Assistant Workflows** (HIGH)
- Knowledge base search
- Conversation context management
- Vector embedding search (if available)
- AI response generation

### 4. **Asset Management Workflows** (HIGH)
- Media library organization
- Tag-based filtering
- Folder-based organization
- Asset metadata search

### 5. **Calendar Integration Workflows** (MEDIUM)
- Event scheduling
- Recurring events
- Workflow triggers based on calendar events
- Event notifications

---

## 📝 **MIGRATION CHECKLIST**

### ✅ Infrastructure (Complete)
- [x] MeauxOS database binding (`MEAUXOS_DB`)
- [x] Migration API endpoint (`/api/migrate`)
- [x] Migration log table (`migration_log`)
- [x] Target table structures created

### ⚠️ Phase 1: Agent System (IN PROGRESS)
- [ ] Create `agent_configs` table schema
- [ ] Create `agent_sessions` table schema
- [ ] Create `agent_commands` table schema
- [ ] Migrate `agent_configs` data
- [ ] Migrate `agent_sessions` data
- [ ] Migrate `agent_commands` data
- [ ] Test MeauxMCP functionality

### ⚠️ Phase 2: Apps Library (READY)
- [x] Apps table created
- [ ] Run apps migration
- [ ] Verify all 22 apps migrated
- [ ] Test apps library functionality

### ⚠️ Phase 3: AI & Assets (PENDING)
- [ ] Create AI knowledge base schema
- [ ] Create AI conversations schema
- [ ] Migrate AI knowledge base
- [ ] Migrate AI conversations
- [ ] Migrate assets metadata
- [ ] Test AI assistant functionality

### ⚠️ Phase 4: Supporting Data (PENDING)
- [ ] Migrate agent recipes
- [ ] Migrate asset metadata
- [ ] Migrate brands
- [ ] Verify calendar events

### ⚠️ Phase 5: Verification (PENDING)
- [ ] Verify workflows data
- [ ] Run data integrity checks
- [ ] Test all functionality
- [ ] Update API endpoints if needed

---

## 🔧 **MIGRATION COMMANDS**

### Migrate Apps (Ready Now):
```bash
curl -X POST https://inneranimalmedia.com/api/migrate/meauxos/apps \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 100, "offset": 0, "target_table": "apps"}'
```

### Check Migration Status:
```bash
curl https://inneranimalmedia.com/api/migrate/status
```

### List Available Tables:
```bash
curl https://inneranimalmedia.com/api/migrate/tables
```

---

## 📚 **NEXT STEPS**

1. **Create Agent System Tables** - Add schema for agent_configs, agent_sessions, agent_commands
2. **Run Apps Migration** - Migrate 22 apps immediately (high value, low risk)
3. **Create AI Tables** - Add schema for ai_knowledge_base and ai_conversations
4. **Migrate Agent System** - Critical for MeauxMCP functionality
5. **Migrate AI & Assets** - High-value data
6. **Final Verification** - Ensure all workflows still function

---

**Priority Focus**: Agent System (MeauxMCP) is the **most critical** - it powers the entire agent-based automation. Apps library is also critical as it's user-created content. Everything else can be migrated incrementally.
