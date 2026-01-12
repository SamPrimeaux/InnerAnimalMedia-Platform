# ✅ Sam Primeaux Setup Complete

## 🎯 What We've Accomplished

### ✅ 1. Identity Updated
- **Full Name**: `Sam Primeaux` ✅
- **Email**: `sam@inneranimalmedia.com` ✅
- **Username**: `Sam` (globally unique - reserved) ✅
- **Role**: `superadmin` ✅
- **Company**: `InnerAnimal Media` ✅
- **Identity Marker**: `#SamPrimeaux-Superadmin` (for reliable tracking)

### ✅ 2. Database Updates
- Username column added to users table ✅
- Superadmin account created ✅
- Identity updated in database ✅

### ✅ 3. Email Routing Verified
- `sam@inneranimalmedia.com` → `meauxbility@gmail.com` ✅
- `ceo@inneranimalmedia.com` → `meauxbility@gmail.com` ✅

---

## 🔍 Finding Cursor Prompts

### Current Status
- No `.cursorrules` file found in home directory or project root
- Cursor prompts are likely stored in Cursor's application settings/configuration

### How to Access Cursor Prompts

**Option 1: Cursor Settings UI**
1. Open Cursor
2. Go to Settings (Cmd+, on Mac)
3. Look for "Rules for AI" or "AI Instructions"
4. Copy the prompts/instructions

**Option 2: Cursor Application Data**
- Mac: `~/Library/Application Support/Cursor/`
- Windows: `%APPDATA%\Cursor\`
- Linux: `~/.config/Cursor/`

**Option 3: Cursor API/Settings File**
- Check for `settings.json` or `config.json` in Cursor directory
- Look for prompts in the settings

---

## 📋 Next Steps (Pending Implementation)

### 1. Extract Cursor Prompts
- [ ] Access Cursor settings/UI to get prompts
- [ ] Copy prompts to a file (e.g., `cursor-prompts.txt`)
- [ ] Review and format prompts for database storage

### 2. Store Prompts in Database
- [ ] Create SQL script to store prompts in `ai_prompts_library` table
- [ ] Link prompts to Agent Sam (`agent_sam` prompt name)
- [ ] Store in `ai_knowledge_base` for context

### 3. Update Agent Sam
- [ ] Modify `handleAgent` function to load prompt from database
- [ ] Use database prompt instead of hardcoded prompt
- [ ] Add fallback to default prompt if database prompt not found

### 4. Implement Identity Marker System
- [ ] Add `isSamPrimeaux(user)` helper function to worker.js
- [ ] Use identity marker for reliable tracking
- [ ] Add to all relevant handlers

### 5. Seamless Superadmin Permissions
- [ ] Add superadmin check in request handlers
- [ ] Bypass tenant isolation for superadmin
- [ ] Grant full permissions automatically
- [ ] Ensure no extra hoops/checks

### 6. Sync to Other Agents
- [ ] Create similar system for other branded agents
- [ ] Store prompts per agent in database
- [ ] Update agent handlers to use database prompts

---

## 🎯 Implementation Plan

### Phase 1: Get Cursor Prompts
1. **Access Cursor Settings**:
   - Open Cursor → Settings
   - Find "Rules for AI" or "AI Instructions"
   - Copy prompts to clipboard or save to file

2. **Format Prompts**:
   - Review prompts
   - Format for database storage
   - Create SQL script to insert prompts

### Phase 2: Database Storage
1. **Create SQL Script**:
   ```sql
   INSERT INTO ai_prompts_library (
     id, name, category, description, prompt_template,
     tool_role, is_active, created_at, updated_at
   ) VALUES (
     'agent-sam-system-prompt',
     'Agent Sam System Prompt (from Cursor)',
     'agent',
     'System prompt for Agent Sam extracted from Cursor',
     '<cursor_prompts_here>',
     'gemini',
     1,
     strftime('%s', 'now'),
     strftime('%s', 'now')
   );
   ```

2. **Run SQL Script**:
   ```bash
   wrangler d1 execute inneranimalmedia-business --file=src/store-cursor-prompts.sql --remote
   ```

### Phase 3: Update Worker.js
1. **Load Prompt from Database**:
   - Modify `handleAgent` function
   - Query `ai_prompts_library` table for `agent-sam-system-prompt`
   - Use database prompt or fallback to default

2. **Add Superadmin Helper**:
   ```javascript
   function isSamPrimeaux(user) {
     return user && (
       user.id === 'superadmin' ||
       user.email === 'sam@inneranimalmedia.com' ||
       (user.username === 'Sam' && user.full_name === 'Sam Primeaux')
     );
   }
   ```

3. **Add Superadmin Permissions**:
   - Check for superadmin in request handlers
   - Bypass tenant checks for superadmin
   - Grant full access automatically

### Phase 4: Testing
1. **Test Agent Sam**:
   - Verify prompt loads from database
   - Test with and without database prompt
   - Ensure fallback works

2. **Test Superadmin**:
   - Verify superadmin detection works
   - Test bypassing tenant checks
   - Verify full permissions

3. **Test Identity Marker**:
   - Verify `#SamPrimeaux` tracking works
   - Test across different systems
   - Verify reliable identification

---

## 📊 Current Agent Sam Prompt

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

**Enhanced Prompt** (after Cursor sync):
- Will include Cursor rules/instructions
- Will reference knowledge base
- Will have Sam Primeaux identity context
- Will include platform-specific instructions

---

## 🔧 Helper Functions to Add

### 1. Identity Check
```javascript
function isSamPrimeaux(user) {
  if (!user) return false;
  return (
    user.id === 'superadmin' ||
    user.email === 'sam@inneranimalmedia.com' ||
    (user.username === 'Sam' && user.full_name === 'Sam Primeaux' && user.role === 'superadmin')
  );
}

function getIdentityMarker(user) {
  if (isSamPrimeaux(user)) {
    return '#SamPrimeaux-Superadmin';
  }
  return null;
}
```

### 2. Superadmin Permissions
```javascript
async function checkSuperadminAccess(user, tenantId) {
  if (isSamPrimeaux(user)) {
    return {
      hasAccess: true,
      bypassChecks: true,
      accessAllTenants: true,
      identityMarker: '#SamPrimeaux-Superadmin'
    };
  }
  return {
    hasAccess: false,
    bypassChecks: false,
    accessAllTenants: false,
    identityMarker: null
  };
}
```

### 3. Load Agent Prompt
```javascript
async function loadAgentPrompt(env, agentName, tenantId) {
  try {
    const prompt = await env.DB.prepare(
      'SELECT prompt_template FROM ai_prompts_library WHERE name = ? AND is_active = 1'
    ).bind(`agent-${agentName}-system-prompt`).first();
    
    return prompt?.prompt_template || null;
  } catch (e) {
    console.warn('Failed to load agent prompt:', e);
    return null;
  }
}
```

---

## 📝 Files to Create/Update

1. **`src/store-cursor-prompts.sql`** (to create)
   - SQL script to store Cursor prompts in database

2. **`src/worker.js`** (to update)
   - Add `isSamPrimeaux()` helper
   - Add `checkSuperadminAccess()` helper
   - Add `loadAgentPrompt()` helper
   - Update `handleAgent()` to use database prompt
   - Add superadmin checks to handlers

3. **`SAM_PRIMEAUX_SETUP_COMPLETE.md`** (this file)
   - Documentation and implementation guide

---

## ✅ Status Summary

**Completed**:
- ✅ Identity updated to "Sam Primeaux"
- ✅ Username set to "Sam" (globally unique)
- ✅ Superadmin account created
- ✅ Email routing verified
- ✅ Implementation plan created

**Pending**:
- ⏳ Get Cursor prompts from Cursor settings
- ⏳ Store prompts in database
- ⏳ Update Agent Sam to use database prompts
- ⏳ Implement superadmin helper functions
- ⏳ Add seamless superadmin permissions
- ⏳ Test all functionality

---

## 🎯 Quick Start Guide

1. **Get Cursor Prompts**:
   - Open Cursor → Settings
   - Find "Rules for AI" or "AI Instructions"
   - Copy prompts

2. **Send Prompts**:
   - Paste prompts here or save to a file
   - I'll create the SQL script to store them

3. **Run Implementation**:
   - I'll update worker.js with helper functions
   - I'll add superadmin checks
   - I'll update Agent Sam to use database prompts

4. **Test**:
   - Test Agent Sam with new prompts
   - Test superadmin permissions
   - Verify identity tracking

---

**Ready to proceed once you provide Cursor prompts!** 🚀
