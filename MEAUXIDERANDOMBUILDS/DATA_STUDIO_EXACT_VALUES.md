# ✅ Data Studio - EXACT VALUES TO ENTER

## Step 1: Create a Test Session First

Run this command to create a Durable Object instance:

```bash
curl -X POST https://inneranimalmedia-dev.meauxbility.workers.dev/api/session/datastudio-demo/session \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo" \
  -d '{"session_type": "chat"}'
```

## Step 2: Fill in Data Studio Form

### Field 1: "Durable Object Name"
**Enter:**
```
datastudio-demo
```

This is the **exact session ID** you used in the API call (the part after `/api/session/`).

### Field 2: "Jurisdiction"
**Leave it BLANK or select "Default"**

Your code uses:
```javascript
const id = env.SESSION_DO.idFromName(sessionId);
```

This creates the instance **without a jurisdiction**, so use the default/blank option.

## That's It!

After entering `datastudio-demo` and leaving jurisdiction blank/default, you should see:
- `sessions` table
- `mcp_sessions` table  
- `webrtc_signals` table
- `session_participants` table
- `session_messages` table

## Quick Reference

**Durable Object Name** = Session ID from your API calls
- API: `/api/session/MY-SESSION-ID/session`
- Data Studio: Enter `MY-SESSION-ID`

**Jurisdiction** = Leave blank/default (your code doesn't specify one)

---

**TL;DR**: 
- Name: `datastudio-demo` (or any session ID you created)
- Jurisdiction: Leave blank/default
