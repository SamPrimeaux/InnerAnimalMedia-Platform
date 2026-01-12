# ✅ Data Studio Access - EXACT STEPS (No Guesswork)

## Step 1: Create a Test Session (This Creates the Durable Object Instance)

Run this command:

```bash
curl -X POST https://inneranimalmedia-dev.meauxbility.workers.dev/api/session/test-datastudio-001/session \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: test" \
  -d '{"session_type": "chat"}'
```

**Important**: The session ID is `test-datastudio-001` (the part after `/api/session/`)

## Step 2: In Data Studio, Enter This EXACT Value

When Data Studio asks: **"How are you identifying this Durable Object?"**

Enter:
```
test-datastudio-001
```

**That's it. Use the exact session ID you used in the API call.**

## Step 3: You Should Now See These Tables

- `sessions`
- `mcp_sessions`
- `webrtc_signals`
- `session_participants`
- `session_messages`

## If It Doesn't Work

### Check 1: Make sure the session was created
```bash
curl https://inneranimalmedia-dev.meauxbility.workers.dev/api/session/test-datastudio-001/session \
  -H "X-Tenant-ID: test"
```

Should return session data.

### Check 2: Try the Durable Object ID directly
If using the name doesn't work, you might need the actual Durable Object ID (hash).

To get it, check your Worker logs:
```bash
wrangler tail --env production
```

Look for the Durable Object ID in the logs when you create a session.

### Check 3: List all instances
In Data Studio, there might be a "List Instances" button. Click it to see all available instances.

## The Rule

**Instance Identifier = Session ID = The string you use in `/api/session/{SESSION_ID}/session`**

If your API call is:
```
/api/session/my-session-abc/session
```

Then in Data Studio, enter:
```
my-session-abc
```

---

**TL;DR**: Use the exact session ID string you used when creating the session. That's what goes in Data Studio.
