# Claude Setup Guide - Multiple Accounts

## 🎯 Overview

You have **2 Claude Pro accounts** and want to use both properly. This guide covers:

1. ✅ **Claude API Integration** in your UI (DONE!)
2. 🔧 **Claude Code CLI** with multiple profiles (SETUP BELOW)
3. 🔑 **Connecting both accounts** in your dashboard

## ✅ What's Already Done

### Claude API Integration
- ✅ Claude API client built (`ClaudeAPIClient` class)
- ✅ API endpoints: `/api/claude/chat`, `/api/claude/generate`
- ✅ Claude chat UI: `/dashboard/claude`
- ✅ Multiple account support (account_name field)
- ✅ Quick-Connect integration

### Cursor Status
- ✅ **Cursor is functional** - Full API client + endpoints exist

## 🔧 Claude Code CLI - Multiple Profiles Setup

### Step 1: Set Up First Profile

```bash
# Create profile directory
mkdir -p ~/.claude-code/profiles

# Set up first Claude account
claude setup
# When prompted, enter your first Claude Pro API key
# Profile will be saved as "default"
```

### Step 2: Create Second Profile

```bash
# Create a custom profile for second account
export CLAUDE_PROFILE="account-2"
claude setup
# Enter your second Claude Pro API key
```

### Step 3: Use Profiles

```bash
# Use default profile
claude

# Use second profile
CLAUDE_PROFILE="account-2" claude

# Or create an alias
alias claude-account-2="CLAUDE_PROFILE=account-2 claude"
```

### Alternative: Manual Profile Setup

If `claude setup` doesn't support profiles directly, you can manually configure:

```bash
# Edit Claude config
nano ~/.claude-code/config.json
```

```json
{
  "profiles": {
    "default": {
      "api_key": "your-first-api-key-here",
      "account_name": "Claude Pro Account 1"
    },
    "account-2": {
      "api_key": "your-second-api-key-here",
      "account_name": "Claude Pro Account 2"
    }
  },
  "current_profile": "default"
}
```

## 🔑 Connecting Accounts in Your Dashboard

### Step 1: Get Your Claude API Keys

1. Go to https://console.anthropic.com/
2. Sign in with your **first Claude Pro account**
3. Navigate to **API Keys**
4. Create a new API key (or copy existing)
5. Repeat for your **second Claude Pro account**

### Step 2: Connect First Account

1. Go to your dashboard: https://inneranimalmedia.com/dashboard/settings
2. Scroll to **External Apps** section
3. Click **Connect** on Claude
4. Enter:
   - **API Key**: Your first Claude Pro API key
   - **Account Name**: "Claude Pro Account 1" (or any name)
5. Click **Save**

### Step 3: Connect Second Account

1. In the same **External Apps** section
2. Click **Connect** on Claude again
3. Enter:
   - **API Key**: Your second Claude Pro API key
   - **Account Name**: "Claude Pro Account 2" (or any name)
4. Click **Save**

### Step 4: Use in Chat

1. Go to `/dashboard/claude`
2. Select which account to use from the dropdown
3. Start chatting!

## 🚀 Usage Examples

### In Your UI

```javascript
// Chat with Claude (uses connection_id from external_connections)
POST /api/claude/chat?connection_id=conn_123456
{
  "messages": [
    { "role": "user", "content": "Hello Claude!" }
  ],
  "options": {
    "model": "claude-3-5-sonnet-20241022"
  }
}

// Generate text
POST /api/claude/generate?connection_id=conn_123456
{
  "prompt": "Write a haiku about coding",
  "options": {
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 200
  }
}
```

### With Claude Code CLI

```bash
# Terminal 1 - First account
cd /path/to/project
claude
# Uses default profile

# Terminal 2 - Second account
cd /path/to/project
CLAUDE_PROFILE=account-2 claude
# Uses second account
```

## 📋 Quick Reference

### API Endpoints
- `POST /api/claude/chat` - Chat completion
- `POST /api/claude/generate` - Text generation
- `GET /api/users/:userId/connections` - List all connections
- `POST /api/users/:userId/connections` - Create new connection

### Database Schema
- Table: `external_connections`
- Fields: `app_id`, `account_name`, `credentials_encrypted`
- Multiple accounts: `(user_id, app_id, account_name)` unique

### Claude Chat UI
- URL: `/dashboard/claude`
- Features: Account selector, message history, real-time chat

## 🔧 Troubleshooting

### Migration Failed?
If the database migration failed, you can manually add the column:

```sql
ALTER TABLE external_connections ADD COLUMN account_name TEXT DEFAULT 'default';
```

Or run:
```bash
wrangler d1 execute inneranimalmedia-business --remote --command="ALTER TABLE external_connections ADD COLUMN account_name TEXT DEFAULT 'default';"
```

### API Key Not Working?
1. Check API key is valid at https://console.anthropic.com/
2. Verify account has Pro subscription
3. Check connection status in dashboard settings
4. Review browser console for errors

### Claude Code CLI Issues?
1. Verify installation: `claude --version`
2. Check config: `cat ~/.claude-code/config.json`
3. Re-run setup: `claude setup`
4. Check API key in Anthropic console

## ✅ Next Steps

1. ✅ Get your Claude API keys from https://console.anthropic.com/
2. ✅ Connect both accounts in dashboard settings
3. ✅ Test Claude chat UI at `/dashboard/claude`
4. ✅ Set up Claude Code CLI profiles (commands above)
5. ✅ Start using both accounts!

---

**Questions?** Check the Claude API docs: https://docs.anthropic.com/
