# 📊 Data Studio Access Guide - Durable Object SQL

## How to Access Your SQL Data in Data Studio

### Step 1: Get the Durable Object Instance ID

The instance ID is based on the **session ID** that was used when creating the Durable Object.

#### Option A: Use an Existing Session ID
If you've already created a session, use that session ID. For example:
- If you created a session with ID: `session-123`
- The Durable Object instance ID will be derived from that

#### Option B: Create a Test Session First
1. Make a request to create a session:
```bash
curl -X POST https://inneranimalmedia-dev.meauxbility.workers.dev/api/session/test-session-123/session \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: your-tenant-id" \
  -d '{"session_type": "chat"}'
```

2. Use `test-session-123` as your instance identifier in Data Studio

#### Option C: Use the Namespace ID (if available)
Sometimes you can use the namespace ID directly:
- Namespace ID: `012c4e02aa404bafa26c0124027d5f45`

### Step 2: Enter Instance Identifier in Data Studio

In the Cloudflare Dashboard Data Studio prompt:

**For a specific session:**
```
test-session-123
```
or
```
session-abc-xyz
```

**Format:**
- Use the **exact session ID** that was passed to `idFromName()`
- This is the string you used when creating the session
- Case-sensitive

### Step 3: View Your SQL Tables

Once you access the instance, you'll see:
- `sessions` - Main session data
- `mcp_sessions` - MCP protocol sessions
- `webrtc_signals` - WebRTC signaling data
- `session_participants` - Participant tracking
- `session_messages` - Chat and MCP messages

### Example SQL Queries

```sql
-- View all sessions for this instance
SELECT * FROM sessions;

-- View MCP sessions
SELECT * FROM mcp_sessions;

-- View recent messages
SELECT * FROM session_messages 
ORDER BY created_at DESC 
LIMIT 50;

-- View active participants
SELECT * FROM session_participants 
WHERE left_at IS NULL;
```

## Quick Test: Create a Session and Access It

1. **Create a test session:**
```bash
curl -X POST https://inneranimalmedia-dev.meauxbility.workers.dev/api/session/data-studio-test/session \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: test-tenant" \
  -d '{"session_type": "chat", "status": "active"}'
```

2. **In Data Studio, enter:**
```
data-studio-test
```

3. **You should now see the SQL tables!**

## Important Notes

- **Each session ID = One Durable Object instance**
- **Instance ID = Session ID** (what you pass to `idFromName()`)
- **Multi-tenant**: Data is filtered by `tenant_id` in queries
- **Schema auto-creates**: Tables are created on first request

## Troubleshooting

**"Instance not found"**
- Make sure you've created a session with that ID first
- Check that the session ID matches exactly (case-sensitive)

**"No tables visible"**
- The schema initializes on first request to that instance
- Make a request to `/api/session/{your-session-id}/session` first
- Then refresh Data Studio

---

**Pro Tip**: Use a consistent naming pattern for sessions (e.g., `tenant-{id}-session-{id}`) to make it easier to find instances in Data Studio!
