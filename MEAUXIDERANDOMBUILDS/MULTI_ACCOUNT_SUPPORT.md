# ✅ Multiple Account Support - Claude, OpenAI, ChatGPT

## 🎯 **YES - You Can Connect Unlimited Accounts!**

The system supports **unlimited accounts** for any external app (Claude, OpenAI, ChatGPT, etc.) using the `account_name` field.

---

## 🔄 **How Multiple Accounts Work**

### **Database Schema**
- **`external_connections` table** has `account_name` field
- **Unique constraint**: `(user_id, app_id, account_name)` - allows multiple accounts per app
- **Example**: You can have:
  - `claude` + `account_name: "Pro Account 1"`
  - `claude` + `account_name: "Pro Account 2"`
  - `claude` + `account_name: "Free Account"`
  - `openai` + `account_name: "ChatGPT Plus"`
  - `openai` + `account_name: "Free Tier"`

### **Connection Flow**
1. User connects app (e.g., Claude)
2. System prompts for **account name** (e.g., "Pro Account 1", "Free Account")
3. API key stored with `account_name` identifier
4. User can add more accounts with different names
5. All accounts accessible in UI with clear labels

---

## 💰 **Free vs Paid Tier Support**

### ✅ **Claude (Anthropic)**
- **Free Tier**: ✅ Supported (if you have free API access)
- **Pro Tier**: ✅ Supported
- **API Key**: Works with any valid Anthropic API key
- **Endpoint**: `https://api.anthropic.com/v1`
- **No tier restrictions** - System works with any valid key

### ✅ **OpenAI / ChatGPT**
- **Free Tier**: ✅ Supported (if you have free API access)
- **Plus/Pro**: ✅ Supported
- **API Key**: Works with any valid OpenAI API key
- **Endpoint**: `https://api.openai.com/v1`
- **No tier restrictions** - System works with any valid key

### ✅ **Other Services**
- **Cursor**: ✅ API key based (any tier)
- **CloudConvert**: ✅ API key based (any tier)
- **Google Drive**: ✅ OAuth (any account)

---

## 🚀 **How to Add Multiple Accounts**

### **Via Dashboard UI**
1. Go to **Settings** → **External Apps**
2. Click **Connect** on Claude (or any app)
3. Enter **Account Name** (e.g., "Pro Account 1")
4. Enter **API Key**
5. Save
6. Repeat for additional accounts with different names

### **Via API**
```bash
POST /api/users/:userId/connections
{
  "app_id": "claude",
  "auth_type": "api_key",
  "credentials": "sk-ant-...",
  "account_name": "Pro Account 1"  # ← Unique identifier
}
```

---

## 📊 **Current Implementation Status**

### ✅ **What's Working**
- ✅ Multiple accounts per app (via `account_name`)
- ✅ Database schema supports it
- ✅ API endpoints support it
- ✅ Connection storage works
- ✅ Account selection in UI (needs enhancement)

### 🔄 **What Needs Enhancement**
- 🔄 UI to select which account to use per request
- 🔄 Account switching in chat interface
- 🔄 Account management (rename, delete individual accounts)
- 🔄 Default account selection

---

## 🎯 **Free vs Paid - Technical Details**

### **API Key Validation**
The system **does NOT check** if an API key is free or paid. It simply:
1. Accepts any valid API key
2. Makes API calls with that key
3. Returns whatever the API provider returns

### **Rate Limits**
- **Free tiers** may have lower rate limits
- **Paid tiers** typically have higher limits
- System handles rate limit errors gracefully
- User sees error messages from API provider

### **Features**
- **Free tiers** may have limited features
- **Paid tiers** have full feature access
- System doesn't restrict features - API provider does

---

## 🔐 **Security & Isolation**

### **Per-User Isolation**
- Each user's accounts are separate
- User A can't see User B's accounts
- Credentials encrypted per user

### **Per-Account Isolation**
- Each account name is separate
- "Pro Account 1" and "Pro Account 2" are isolated
- Can use different API keys for different purposes

---

## 📝 **Example Use Cases**

### **Multiple Claude Accounts**
```
User connects:
- "Claude Pro - Work" (work projects)
- "Claude Pro - Personal" (personal projects)
- "Claude Free - Testing" (experiments)
```

### **Multiple OpenAI Accounts**
```
User connects:
- "ChatGPT Plus - Main" (primary account)
- "ChatGPT Free - Backup" (backup account)
- "OpenAI API - Development" (dev key)
```

### **Mixed Free & Paid**
```
User connects:
- "Claude Pro" (paid, full features)
- "Claude Free" (free, limited features)
- "OpenAI Plus" (paid)
- "OpenAI Free" (free tier)
```

---

## ✅ **Summary**

1. **✅ Unlimited accounts** - Add as many as you want per app
2. **✅ Free & Paid** - Both work, no restrictions
3. **✅ Account naming** - Use descriptive names ("Pro Account 1", "Free Tier", etc.)
4. **✅ API key based** - Works with any valid API key
5. **✅ Secure** - Each account isolated and encrypted

**The system is ready for multiple accounts!** Just use different `account_name` values when connecting the same app multiple times.
