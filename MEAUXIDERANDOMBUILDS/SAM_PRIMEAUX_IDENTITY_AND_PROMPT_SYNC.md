# ✅ Sam Primeaux Identity & Prompt Sync System

## 🎯 Completed

### ✅ Identity Updated
- **Full Name**: `Sam Primeaux` ✅
- **Email**: `sam@inneranimalmedia.com` ✅
- **Username**: `Sam` (globally unique) ✅
- **Role**: `superadmin` ✅
- **Company**: `InnerAnimal Media` ✅
- **Identity Marker**: `#SamPrimeaux-Superadmin` (for reliable tracking)

### ✅ Database Status
Account verified and updated in database.

---

## 📋 Implementation Plan

### 1. Identity Marker System (#SamPrimeaux)

**Purpose**: Reliable tracking across all systems, agents, and services

**Implementation**:
- Check if user is Sam Primeaux by:
  - `id = 'superadmin'`
  - `email = 'sam@inneranimalmedia.com'`
  - `username = 'Sam'`
  - `full_name = 'Sam Primeaux'`
  - `role = 'superadmin'`

**Helper Function** (to add to worker.js):
```javascript
function isSamPrimeaux(user) {
  return user && (
    user.id === 'superadmin' ||
    user.email === 'sam@inneranimalmedia.com' ||
    (user.username === 'Sam' && user.full_name === 'Sam Primeaux')
  );
}
```

### 2. Seamless Superadmin Permissions

**Current State**: Superadmin account exists but permissions may need to be checked in worker.js

**Needed**:
- Bypass tenant checks for superadmin
- Access all tenants' data
- Full system access without extra hoops
- Automatic superadmin detection

**Implementation**:
- Add superadmin check in `getTenantFromRequest` or request handlers
- Skip tenant isolation for superadmin
- Grant full permissions automatically

### 3. Cursor Prompts Sync to Agent Sam

**Current State**:
- Agent Sam has basic prompt in worker.js (line 8582)
- Cursor rules/prompts exist (need to locate)
- `ai_prompts_library` table exists
- `ai_knowledge_base` table exists

**Plan**:
1. **Find Cursor Prompts**:
   - Search for `.cursorrules` files
   - Check Cursor configuration
   - Extract prompts/instructions

2. **Store in Database**:
   - Store prompts in `ai_prompts_library` table
   - Link to Agent Sam (`agent_sam` prompt)
   - Store in `ai_knowledge_base` for context

3. **Update Agent Sam**:
   - Load prompt from database
   - Use for system prompt in Gemini API calls
   - Update worker.js to fetch prompt from DB

4. **Sync to Other Agents**:
   - Create similar system for other branded agents
   - Store prompts per agent
   - Update agent handlers

---

## 🔍 Finding Cursor Prompts

### Search Locations:
1. `~/.cursor/.cursorrules`
2. `~/.cursor/rules.md`
3. Project root `.cursorrules`
4. Cursor settings/configuration files
5. Cursor workspace settings

### Common Cursor Files:
- `.cursorrules` - Main rules file
- `.cursor/` - Cursor directory
- `cursor.json` - Cursor config
- Settings in Cursor UI

---

## 📝 Next Steps

1. **Locate Cursor Prompts**:
   ```bash
   find ~ -name ".cursorrules" -o -name "cursorrules" 2>/dev/null
   ```

2. **Extract Prompts**:
   - Read `.cursorrules` files
   - Extract instructions/prompts
   - Format for database storage

3. **Store in Database**:
   ```sql
   INSERT INTO ai_prompts_library (
     id, name, category, description, prompt_template,
     tool_role, is_active, created_at, updated_at
   ) VALUES (
     'agent-sam-system-prompt',
     'Agent Sam System Prompt',
     'agent',
     'System prompt for Agent Sam from Cursor',
     '<extracted_prompt>',
     'gemini',
     1,
     strftime('%s', 'now'),
     strftime('%s', 'now')
   );
   ```

4. **Update Worker.js**:
   - Load prompt from database
   - Use for Agent Sam system prompt
   - Fallback to default if not found

5. **Implement Superadmin Checks**:
   - Add `isSamPrimeaux()` helper
   - Bypass tenant checks
   - Grant full permissions

---

## 🎯 Agent Sam Prompt Structure

**Current Prompt** (worker.js line 8582):
```
You are Agent Sam, an AI assistant for InnerAnimal Media OS dashboard. You help users with:
- Generating code and scripts
- Analyzing logs and debugging
- Planning tasks and workflows
- Answering questions about the platform
- Using tools and APIs

Be concise and action-oriented. When appropriate, suggest specific commands or next steps.
```

**Enhanced Prompt** (from Cursor):
- Should include Cursor rules/instructions
- Should reference knowledge base
- Should have Sam Primeaux identity context
- Should include platform-specific instructions

---

## 📊 Database Tables for Prompts

### `ai_prompts_library`
- Stores prompt templates
- Categories: `agent`, `workflow`, `design`, `api`, etc.
- Tool roles: `gemini`, `chatgpt`, `claude`, etc.

### `ai_knowledge_base`
- Stores context/knowledge
- Categories: `workflow`, `api`, `design`, etc.
- Used for RAG (Retrieval Augmented Generation)

### Agent-Specific Storage
- Could store in `ai_prompts_library` with `name = 'agent-sam-system-prompt'`
- Or create `agent_config` table
- Or store in `external_connections` table

---

## 🚀 Implementation Priority

1. **High Priority**:
   - ✅ Identity update (Done)
   - ⏳ Superadmin permissions (worker.js)
   - ⏳ Find Cursor prompts

2. **Medium Priority**:
   - ⏳ Store Cursor prompts in database
   - ⏳ Update Agent Sam to use database prompt
   - ⏳ Add superadmin check helper

3. **Low Priority**:
   - ⏳ Sync to other agents
   - ⏳ Create prompt management UI
   - ⏳ Version control for prompts

---

## 📝 Files to Create/Update

1. **`src/helpers/is-sam-primeaux.js`** (or add to worker.js)
   - `isSamPrimeaux(user)` function
   - Identity marker logic

2. **`src/helpers/superadmin-permissions.js`** (or add to worker.js)
   - Superadmin permission checks
   - Bypass tenant isolation

3. **`src/sync-cursor-prompts.sql`**
   - SQL to store Cursor prompts in database

4. **`src/worker.js`** (update)
   - Load Agent Sam prompt from database
   - Use superadmin checks
   - Implement seamless permissions

5. **Documentation**:
   - This file (SAM_PRIMEAUX_IDENTITY_AND_PROMPT_SYNC.md)
   - Implementation guide
   - Prompt sync workflow

---

**Status**: Identity updated ✅ | Prompts sync pending ⏳
