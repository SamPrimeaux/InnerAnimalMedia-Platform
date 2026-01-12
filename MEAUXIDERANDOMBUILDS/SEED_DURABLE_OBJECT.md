# 🌱 Seed Durable Object SQL - Quick Guide

## How to Initialize & Seed Your Durable Object

### Step 1: Initialize Schema (Creates All Tables)

**Call this endpoint:**
```bash
curl https://inneranimalmedia-dev.meauxbility.workers.dev/api/session/datastudio-demo/schema/init \
  -H "X-Tenant-ID: demo"
```

**This will:**
- ✅ Create all 5 tables (sessions, mcp_sessions, webrtc_signals, session_participants, session_messages)
- ✅ Create all indexes for performance
- ✅ Seed initial sample data

### Step 2: Verify Tables Created

**Check tables:**
```bash
curl https://inneranimalmedia-dev.meauxbility.workers.dev/api/session/datastudio-demo/schema/tables \
  -H "X-Tenant-ID: demo"
```

**Should return:**
```json
{
  "success": true,
  "data": [
    "sessions",
    "mcp_sessions", 
    "webrtc_signals",
    "session_participants",
    "session_messages"
  ]
}
```

### Step 3: View in Data Studio

1. Go to Cloudflare Dashboard → Workers → inneranimalmedia-dev
2. Click on Durable Object namespace
3. Click "Data Studio"
4. Enter:
   - **Durable Object Name**: `datastudio-demo`
   - **Jurisdiction**: Leave blank/default
5. You should now see all 5 tables!

## Tables Created

1. **sessions** - Main session data with tenant isolation
2. **mcp_sessions** - MCP (Model Context Protocol) sessions
3. **webrtc_signals** - WebRTC signaling (offers, answers, ICE)
4. **session_participants** - Multi-user session tracking
5. **session_messages** - Chat and MCP communication

## Seed Data Included

After initialization, you'll have:
- ✅ 1 sample session
- ✅ 1 sample MCP session
- ✅ 1 sample message

## Manual Seeding (If Needed)

You can also seed data via API:

```bash
# Create a session (auto-seeds)
curl -X POST https://inneranimalmedia-dev.meauxbility.workers.dev/api/session/datastudio-demo/session \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo" \
  -d '{"session_type": "chat"}'

# Add MCP session
curl -X POST https://inneranimalmedia-dev.meauxbility.workers.dev/api/session/datastudio-demo/mcp/session \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo" \
  -d '{"mcp_server_id": "my-server", "context_data": {"tools": []}}'

# Add message
curl -X POST https://inneranimalmedia-dev.meauxbility.workers.dev/api/session/datastudio-demo/messages \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo" \
  -d '{"message_type": "chat", "content": "Hello!"}'
```

---

**TL;DR**: Call `/api/session/{session-id}/schema/init` to create all tables and seed data!
