# 🔄 Sync Cursor Commands to Agent Sam

## 🎯 What We're Syncing

Based on the command palette image, these commands should be synced to Agent Sam:

1. **`clients`** - Client management
2. **`db`** - Database operations
3. **`deploy`** - Deployment commands
4. **`iam`** - Identity and Access Management
5. **`infrastructure`** - Infrastructure management
6. **`knowledge`** - Knowledge base operations
7. **`list`** - Listing resources
8. **`meauxos/backup`** - Backup operations
9. **`meauxos/costs`** - Cost tracking
10. **`meauxos/employees`** - Employee/user management
11. **`quickstart`** - Quick setup
12. **`r2`** - R2 storage operations

---

## 📋 Implementation Plan

### Step 1: Understand Current Agent Command System

**Current Structure**:
- `agent_commands` table exists (from stats query)
- `agent_recipe_prompts` table exists
- `handleAgent` function processes agent requests
- Commands can be executed via `/api/agent` endpoint

**Need to**:
1. Map Cursor commands to agent commands
2. Store command definitions in database
3. Update Agent Sam to recognize these commands
4. Execute commands via agent interface

### Step 2: Store Commands in Database

**Option A: Use `agent_commands` table** (if it exists)
```sql
INSERT INTO agent_commands (
  id, tenant_id, command_name, description, 
  handler_type, config_json, is_public, 
  created_at, updated_at
) VALUES (
  'cmd-clients', 'system', 'clients', 'Manage client accounts',
  'api', '{"endpoint": "/api/clients"}', 1,
  strftime('%s', 'now'), strftime('%s', 'now')
);
```

**Option B: Create command definitions in `ai_prompts_library`**
```sql
INSERT INTO ai_prompts_library (
  id, name, category, description, prompt_template,
  tool_role, is_active, created_at, updated_at
) VALUES (
  'command-clients', 'clients', 'command',
  'Client management command',
  'Execute clients command: {{args}}', 'gemini',
  1, strftime('%s', 'now'), strftime('%s', 'now')
);
```

**Option C: Store in knowledge base**
```sql
INSERT INTO ai_knowledge_base (
  id, tenant_id, title, content, content_type,
  category, is_active, created_at, updated_at
) VALUES (
  'kb-command-clients', 'system', 'Clients Command',
  'Command: clients\nDescription: Manage client accounts\nUsage: clients [action] [args]',
  'command', 'commands', 1,
  strftime('%s', 'now'), strftime('%s', 'now')
);
```

### Step 3: Update Agent Sam to Recognize Commands

**Current Agent Sam Prompt** (worker.js line 8582):
```
You are Agent Sam, an AI assistant for InnerAnimal Media OS dashboard...
```

**Enhanced Prompt** (should include):
```
You are Agent Sam, an AI assistant for InnerAnimal Media OS dashboard.

Available Commands:
- clients: Manage client accounts
- db: Database operations
- deploy: Deployment commands
- iam: Identity and Access Management
- infrastructure: Infrastructure management
- knowledge: Knowledge base operations
- list: List resources
- meauxos/backup: Backup operations
- meauxos/costs: Cost tracking
- meauxos/employees: Employee/user management
- quickstart: Quick setup
- r2: R2 storage operations

When users request actions, identify the appropriate command and execute it.
```

### Step 4: Implement Command Execution

**Command Structure**:
```javascript
const commands = {
  'clients': {
    description: 'Manage client accounts',
    handler: async (args, env, tenantId) => {
      // Execute clients command
      return await handleClients(args, env, tenantId);
    }
  },
  'db': {
    description: 'Database operations',
    handler: async (args, env, tenantId) => {
      // Execute db command
      return await handleDatabase(args, env, tenantId);
    }
  },
  // ... other commands
};
```

**Agent Sam Integration**:
```javascript
async function handleAgent(request, env, tenantId, corsHeaders) {
  // ... existing code ...
  
  // Parse command from user message
  const command = parseCommand(message);
  
  if (command) {
    // Execute command
    const result = await executeCommand(command, args, env, tenantId);
    return jsonResponse({ success: true, data: result }, 200, corsHeaders);
  }
  
  // Otherwise, use AI chat
  // ... existing chat code ...
}
```

---

## 🔧 Command Definitions

### Command Structure
```javascript
{
  name: 'clients',
  description: 'Manage client accounts',
  usage: 'clients [list|get|create|update|delete] [args]',
  category: 'management',
  handler: 'api', // or 'function', 'mcp', etc.
  endpoint: '/api/clients',
  permissions: ['admin', 'superadmin'],
  examples: [
    'clients list',
    'clients get client-123',
    'clients create --name "New Client"'
  ]
}
```

### Command Categories
- **Management**: `clients`, `iam`, `meauxos/employees`
- **Operations**: `deploy`, `backup`, `r2`
- **Data**: `db`, `knowledge`, `list`
- **Infrastructure**: `infrastructure`, `costs`
- **Setup**: `quickstart`

---

## 📊 Database Schema

### Option 1: Use Existing Tables
- `agent_commands` - Store command definitions
- `ai_prompts_library` - Store command prompts
- `ai_knowledge_base` - Store command documentation

### Option 2: Create New Table
```sql
CREATE TABLE IF NOT EXISTS agent_command_definitions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'system',
  command_name TEXT NOT NULL UNIQUE,
  description TEXT,
  usage TEXT,
  category TEXT,
  handler_type TEXT, -- 'api', 'function', 'mcp', etc.
  handler_config TEXT, -- JSON config
  permissions_json TEXT, -- JSON array of required roles
  examples_json TEXT, -- JSON array of examples
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

---

## 🚀 Implementation Steps

1. **Create Command Definitions**:
   - Create SQL script with all command definitions
   - Store in `agent_commands` or new table
   - Link to Agent Sam

2. **Update Agent Sam Prompt**:
   - Load command list from database
   - Include in system prompt
   - Add command recognition logic

3. **Implement Command Execution**:
   - Add command parser
   - Map commands to handlers
   - Execute via appropriate endpoint/function

4. **Update handleAgent Function**:
   - Detect commands in user messages
   - Execute commands directly
   - Fall back to AI chat for non-commands

5. **Test Commands**:
   - Test each command
   - Verify permissions
   - Ensure seamless execution

---

## 📝 Files to Create/Update

1. **`src/seed-agent-commands.sql`** (to create)
   - SQL script with all command definitions

2. **`src/worker.js`** (to update)
   - Add command definitions
   - Update `handleAgent` to recognize commands
   - Add command execution logic

3. **`SYNC_CURSOR_COMMANDS_TO_AGENT_SAM.md`** (this file)
   - Documentation and implementation guide

---

## 🎯 Next Steps

1. **Confirm Command List**:
   - Verify all commands from the image
   - Check if there are more commands
   - Understand command syntax/usage

2. **Get Command Details**:
   - What does each command do?
   - What are the parameters?
   - What are the expected outputs?

3. **Create SQL Script**:
   - Store command definitions
   - Link to Agent Sam
   - Set up permissions

4. **Update Agent Sam**:
   - Add command recognition
   - Implement execution
   - Test with real commands

---

**Ready to implement once we have command details!** 🚀
