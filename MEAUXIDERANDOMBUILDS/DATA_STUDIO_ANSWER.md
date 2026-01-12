# ✅ Data Studio - EXACT ANSWER

## What to Enter

### Field 1: "Durable Object Name"
**Enter:**
```
datastudio-demo
```

This is the **session ID** - the value you pass to `idFromName()` in your code.

### Field 2: "Jurisdiction"  
**Leave BLANK or select "Default"**

Your code uses:
```javascript
const id = env.SESSION_DO.idFromName(sessionId);
```

No jurisdiction is specified, so use the default.

## Quick Steps

1. **Create the instance first:**
```bash
curl -X POST https://inneranimalmedia-dev.meauxbility.workers.dev/api/session/datastudio-demo/session \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: demo" \
  -d '{"session_type": "chat"}'
```

2. **In Data Studio:**
   - Name: `datastudio-demo`
   - Jurisdiction: Leave blank/default

3. **You're done!** You'll see your SQL tables.

---

**The session ID from your API = The Durable Object Name in Data Studio**
