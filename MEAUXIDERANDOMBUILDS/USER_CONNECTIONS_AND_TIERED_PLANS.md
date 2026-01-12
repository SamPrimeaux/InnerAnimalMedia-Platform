# User Connections & Tiered SaaS Plans

## Current Connection Capabilities

Based on the codebase analysis, here's what users can currently connect and what's available for tiered plans:

### ✅ **Currently Implemented & Available Connections**

1. **OAuth Providers** (via `oauth_providers` table - **FULLY WORKING**):
   - ✅ **Google OAuth** (`google`) - **Fully implemented & working**
     - Authentication working
     - **Google Drive scope already included!** (`drive.readonly` in schema)
     - Can access: Drive, Gmail, Sheets, Calendar, etc.
     - Just needs Drive API endpoints implemented
   - ✅ **GitHub OAuth** (`github`) - **Fully implemented & working**
     - Authentication working
     - Can access: Repos, Issues, Deployments, Organizations
     - Ready to use

2. **External Connections** (via `external_connections` table - **FRAMEWORK READY**):
   - ✅ **Google Drive** - **OAuth framework ready, just needs API wrapper**
     - Google OAuth already includes Drive scope
     - Just needs Drive API implementation
     - **EASIEST to implement** (1-2 hours)
   
   - ✅ **Cloudflare** - **Platform-level currently, user connections ready**
     - Framework exists for user API tokens
     - Just needs UI + token storage
     - **Medium effort** (2-4 hours)
   
   - ✅ **Supabase** - **Framework ready, needs API key storage**
     - External connections table supports this
     - Just needs Supabase client wrapper
     - **Medium effort** (3-5 hours)
   
   - ✅ **Claude API** - **Framework ready (API key auth)**
     - Already listed in Quick-Connect UI
     - Just needs API key storage + wrapper
     - **Easy** (2-3 hours)
   
   - ✅ **Cursor** - **Framework ready (if API exists)**
     - Already listed in Quick-Connect UI
     - Need to check if Cursor has public API
     - **Depends on API availability**
   
   - ⚠️ **Gemini** - **Platform-level currently**
     - Uses your API key (free tier)
     - Can add user API key support (easy)
     - **Easy to add** (1-2 hours)

### 🔧 **Database Schema for Connections**

From `external_connections` table schema:
```sql
CREATE TABLE external_connections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  app_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  app_type TEXT NOT NULL,  -- 'oauth', 'api_key', 'webhook', etc.
  connection_status TEXT NOT NULL,
  credentials_json TEXT,  -- Encrypted OAuth tokens or API keys
  scopes TEXT,
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## 🎯 **Recommended Tiered Plan Structure**

### **Free Tier** (Current Default)
**Connections:**
- ✅ Google OAuth (authentication only)
- ✅ GitHub OAuth (authentication only)
- ⚠️ Gemini AI (shared platform key - rate limited)

**Limitations:**
- 100 API calls/month
- Basic dashboard access
- No external connections (Cloudflare, Supabase, Claude, etc.)
- Shared AI resources

### **Starter Tier ($9-19/month)** ⭐ **RECOMMENDED STARTING POINT**
**Connections:**
- ✅ Google OAuth + **Google Drive access**
- ✅ GitHub OAuth + **full repo access**
- ✅ **Cloudflare** (connect their own account + API token)
- ✅ **Supabase** (connect their own project + API key)
- ⚠️ Gemini AI (shared platform key - higher limits)

**Limitations:**
- 1,000 API calls/month
- 1 Cloudflare account
- 1 Supabase project
- No Claude/Cursor access

### **Professional Tier ($49-99/month)** 🔒 **MOST VALUABLE**
**Connections:**
- ✅ All Starter connections
- ✅ **Claude API** (connect their own API key)
- ✅ **Cursor API** (if available)
- ✅ Multiple Supabase projects (up to 5)
- ✅ **Gemini API** (their own API key OR higher platform limits)
- ✅ Google Workspace integration

**Limitations:**
- 10,000 API calls/month
- Multiple connections per service
- Advanced AI features
- Priority support

### **Enterprise Tier ($299+/month)** 🚀 **UNLIMITED**
**Connections:**
- ✅ All Professional connections
- ✅ **Unlimited** connections per service
- ✅ White-label options
- ✅ Custom integrations
- ✅ Dedicated support
- ✅ **Unlimited** API calls
- ✅ Custom OAuth apps
- ✅ Priority AI processing
- ✅ On-premise options (if needed)

## 🚀 **Implementation Roadmap** (Priority Order)

### **Phase 1: Quick Wins** (1-2 days) ⚡ **HIGHEST VALUE**
1. ✅ **Google Drive Integration** (2-3 hours)
   - **Status**: OAuth scope already includes Drive!
   - **Action**: Implement Drive API wrapper
   - **Effort**: Easy - just API endpoints
   - **Value**: High - users get Drive access immediately

2. ✅ **Claude API Integration** (2-3 hours)
   - **Status**: Framework ready, UI already shows it
   - **Action**: API key storage + wrapper
   - **Effort**: Easy - standard API key auth
   - **Value**: High - Professional tier feature

3. ✅ **Gemini Per-User API Keys** (1-2 hours)
   - **Status**: Platform key works, just add user key option
   - **Action**: Add API key field, fallback logic
   - **Effort**: Very easy
   - **Value**: Medium - cost savings for you

### **Phase 2: Medium Effort** (3-5 days) 🔧 **TIER DIFFERENTIATION**
4. ✅ **User Cloudflare Connections** (4-6 hours)
   - **Status**: Framework exists, needs UI + routing
   - **Action**: Token storage, deployment routing
   - **Effort**: Medium - need to route deployments
   - **Value**: High - Starter tier differentiator

5. ✅ **Supabase Connections** (4-6 hours)
   - **Status**: Framework ready
   - **Action**: API key storage + Supabase client wrapper
   - **Effort**: Medium - need Supabase client
   - **Value**: High - Starter tier feature

### **Phase 3: Advanced Features** (1-2 weeks) 🎯 **PROFESSIONAL TIER**
6. ⏳ **Cursor Integration** (2-4 hours if API exists)
   - **Status**: Need to check if Cursor has public API
   - **Action**: Research API → implement if available
   - **Effort**: Unknown - depends on API
   - **Value**: Medium - nice-to-have

7. ⏳ **Connection Management UI** (1-2 days)
   - **Status**: Framework exists, needs full UI
   - **Action**: Build `/dashboard/connections` page
   - **Effort**: Medium - full CRUD UI
   - **Value**: High - user experience

8. ⏳ **Tier-Based Feature Gating** (1 day)
   - **Status**: Need to implement checks
   - **Action**: Add plan checks, upgrade prompts
   - **Effort**: Medium - need to wire everywhere
   - **Value**: Critical - monetization

## 📋 **Next Steps to Enable User Connections**

### **1. Google Drive Integration** ✅ **SCOPE ALREADY INCLUDED!**
**Good News**: Your Google OAuth already includes `drive.readonly` scope!

**What's Needed:**
- Implement Google Drive API wrapper
- Add Drive endpoints to worker
- Create Drive UI component

**Implementation** (2-3 hours):
```javascript
// 1. Create Drive API wrapper function
async function getGoogleDriveFiles(accessToken, folderId = 'root') {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size,modifiedTime)`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  );
  return response.json();
}

// 2. Add endpoint: POST /api/drive/files
// 3. Add UI: /dashboard/drive (or integrate into existing)
```

### **2. Create Connection Management UI**
- Dashboard page: `/dashboard/connections`
- List available connections
- Show connection status
- Allow users to connect/disconnect
- Show tier-based limitations

### **3. Implement Per-User Cloudflare**
- Add Cloudflare API token input form
- Store in `external_connections` table
- Use user's token for their deployments
- Track usage per connection

### **4. Implement Supabase Connections**
- Add Supabase project URL + API key fields
- Store connection credentials
- Implement Supabase client wrapper
- Route queries to user's project

### **5. Tier-Based Feature Gating**
```javascript
// Example: Check user tier before allowing connection
async function canUserConnectService(userId, serviceType, env) {
  const user = await env.DB.prepare(
    'SELECT plan_type FROM users u JOIN tenant_metadata tm ON u.tenant_id = tm.tenant_id WHERE u.id = ?'
  ).bind(userId).first();
  
  const planLimits = {
    'free': { cloudflare: false, supabase: false, claude: false },
    'starter': { cloudflare: true, supabase: true, claude: false },
    'professional': { cloudflare: true, supabase: true, claude: true },
    'enterprise': { cloudflare: true, supabase: true, claude: true }
  };
  
  return planLimits[user?.plan_type || 'free']?.[serviceType] || false;
}
```

## 🔐 **Security Considerations**

1. **Credential Storage**: 
   - Encrypt API keys in `credentials_json`
   - Use Cloudflare Workers KV or D1 encryption
   - Never expose keys to frontend

2. **OAuth Token Refresh**:
   - Auto-refresh expired tokens
   - Handle refresh failures gracefully
   - Notify users when re-authentication needed

3. **Rate Limiting**:
   - Track API usage per user
   - Enforce tier-based limits
   - Throttle excessive requests

## 📊 **Usage Tracking**

Add to existing `cost_tracking` table:
```sql
-- Track per-user API usage
ALTER TABLE cost_tracking ADD COLUMN connection_id TEXT;
ALTER TABLE cost_tracking ADD COLUMN user_id TEXT;

-- Create index for user usage queries
CREATE INDEX idx_cost_tracking_user ON cost_tracking(user_id, created_at DESC);
```

## 🎨 **UI Mockup Suggestions**

**Connections Page** (`/dashboard/connections`):
```
┌─────────────────────────────────────────────────┐
│ Available Connections                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Google Drive]     [Connected]  [Manage]       │
│ [GitHub]           [Connected]  [Manage]       │
│ [Cloudflare]       [Available]  [Connect] ⭐   │
│ [Supabase]         [Available]  [Connect] ⭐   │
│ [Claude API]       [Locked]     [Upgrade] 🔒   │
│ [Cursor]           [Coming Soon]               │
│                                                 │
└─────────────────────────────────────────────────┘

⭐ = Requires Starter tier or above
🔒 = Requires Professional tier or above
```

---

## 📊 **Summary: What Users Can Connect RIGHT NOW**

### ✅ **Ready to Use (No Additional Work)**
1. **Google OAuth** - ✅ Working (includes Drive scope!)
2. **GitHub OAuth** - ✅ Working

### ⚡ **Easy to Enable (2-4 hours each)**
3. **Google Drive** - OAuth ready, just needs API wrapper
4. **Claude API** - Framework ready, just needs API key storage
5. **Gemini User Keys** - Easy fallback logic

### 🔧 **Medium Effort (4-6 hours each)**
6. **Cloudflare User Accounts** - Framework ready, needs routing
7. **Supabase Connections** - Framework ready, needs client wrapper

### ⏳ **Research Needed**
8. **Cursor API** - Need to check if public API exists

---

## 🎯 **Recommended Action Plan**

**For Maximum Value in Minimum Time:**

1. **Week 1**: Enable Google Drive + Claude API (4-6 hours total)
   - Highest user value
   - Professional tier differentiation
   
2. **Week 2**: Enable Cloudflare + Supabase (8-12 hours total)
   - Starter tier differentiation
   - Revenue generation

3. **Week 3**: Build Connections UI + Tier Gating (1-2 days)
   - User experience
   - Monetization enforcement

**Would you like me to:**
1. ✅ **Implement Google Drive integration?** (2-3 hours)
2. ✅ **Implement Claude API integration?** (2-3 hours)
3. ✅ **Create the connections management page?** (1 day)
4. ✅ **Implement user Cloudflare connections?** (4-6 hours)
5. ✅ **Add tier-based feature gating?** (1 day)
6. ✅ **Create the Supabase connection flow?** (4-6 hours)

**Start with #1 or #2 for quickest wins!** 🚀
