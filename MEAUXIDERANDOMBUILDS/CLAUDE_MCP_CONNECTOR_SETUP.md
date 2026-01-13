# 🔌 Claude MCP Connector Setup Guide

## ✅ YES - Add to Both Claude Accounts!

You should **add the MeauxMCP connector to BOTH of your Claude Pro accounts** so both can access your tools and data.

## 🎯 What This Does

Connecting Claude to your MeauxMCP server allows Claude to:
- ✅ Access your tools (MeauxIDE, MeauxSQL, MeauxCAD, etc.)
- ✅ Query your database (D1)
- ✅ Use your workflows
- ✅ Access your knowledge base
- ✅ Execute commands via your API

## 📋 MCP Server Information

### Server URL
**⚠️ IMPORTANT: Use the SSE endpoint for Claude Desktop**

```
https://inneranimalmedia.com/api/mcp/sse
```

**Alternative URLs** (if custom domain doesn't work):
```
https://inneranimalmedia-dev.meauxbility.workers.dev/api/mcp/sse
https://www.inneranimalmedia.com/api/mcp/sse
```

**Note**: Claude Desktop requires the `/sse` endpoint for Server-Sent Events connection.

### Connection Details

**Name**: `MeauxMCP Server` (or any name you prefer)

**Remote MCP server URL**: 
```
https://inneranimalmedia.com/api/mcp
```

**OAuth Client ID**: (Optional - leave blank if not using OAuth)
- Currently not required for basic MCP connections
- Can be added later if you implement OAuth authentication

**OAuth Client Secret**: (Optional - leave blank if not using OAuth)
- Currently not required for basic MCP connections
- Can be added later if you implement OAuth authentication

## 🔧 Setup Steps

### For Account 1 (First Claude Pro Account)

1. Open Claude Desktop app or go to Claude.ai
2. Navigate to **Settings** → **Connectors** (or **Add custom connector**)
3. Click **"Add custom connector"** or **"Connect MCP server"**
4. Fill in:
   - **Name**: `MeauxMCP Server` (or `InnerAnimal Media MCP`)
   - **Remote MCP server URL**: `https://inneranimalmedia.com/api/mcp/sse` ⚠️ **MUST include /sse**
   - **OAuth Client ID**: (leave blank)
   - **OAuth Client Secret**: (leave blank)
5. Click **"Connect"** or **"Save"**
6. Test the connection

### For Account 2 (Second Claude Pro Account)

**Repeat the same steps** with Account 2:
1. Open Claude Desktop app or go to Claude.ai (with second account)
2. Navigate to **Settings** → **Connectors**
3. Click **"Add custom connector"**
4. Fill in the same information:
   - **Name**: `MeauxMCP Server`
   - **Remote MCP server URL**: `https://inneranimalmedia.com/api/mcp/sse` ⚠️ **MUST include /sse**
5. Click **"Connect"** or **"Save"**

## ✅ Why Add to Both Accounts?

**Benefits:**
- ✅ Both accounts can access your tools
- ✅ Both accounts can query your database
- ✅ Both accounts can use your workflows
- ✅ Consistent access across accounts
- ✅ No need to switch accounts to use tools

**Use Cases:**
- Account 1: Personal development work
- Account 2: Business/client work
- Both: Access to same tools and data

## 🔍 Verification

After adding the connector, test it:

1. **In Claude Desktop/Claude.ai**, ask:
   ```
   What tools are available from MeauxMCP?
   ```

2. **Or try:**
   ```
   List my available tools
   ```

3. **Or:**
   ```
   Query my database for recent workflows
   ```

If the connection works, Claude should be able to:
- List available tools
- Execute commands
- Query your database
- Access your knowledge base

## 🚨 Troubleshooting

### Connection Fails?

1. **Check URL**: Make sure it includes `/sse`:
   ```
   https://inneranimalmedia.com/api/mcp/sse
   ```
   ⚠️ **CRITICAL**: The URL MUST end with `/sse` for Claude Desktop to connect!

2. **Try Alternative URL**:
   ```
   https://inneranimalmedia-dev.meauxbility.workers.dev/api/mcp/sse
   ```

3. **Common Mistakes**:
   - ❌ `https://inneranimalmedia.com/api/mcp` (missing /sse)
   - ✅ `https://inneranimalmedia.com/api/mcp/sse` (correct)

3. **Check CORS**: The worker should handle CORS automatically

4. **Check Authentication**: If you get auth errors, you may need to:
   - Add OAuth credentials (if implemented)
   - Check API key requirements
   - Verify worker is deployed

### MCP Protocol Errors?

1. **Verify Endpoint**: Test the SSE endpoint:
   ```bash
   curl https://inneranimalmedia.com/api/mcp/sse
   ```
   You should see Server-Sent Events stream starting.

2. **Check Worker Logs**: Look for errors in Cloudflare Workers logs

3. **Verify MCP Version**: Ensure your MCP server supports the protocol version Claude expects

## 📝 Notes

- **OAuth is Optional**: You can leave OAuth fields blank for now
- **Same URL for Both**: Use the same MCP server URL for both accounts
- **Different Names**: You can name them differently (e.g., "MeauxMCP - Personal" and "MeauxMCP - Business")
- **Security**: Only connect to MCP servers you trust (which is your own!)

## ✅ Quick Setup Checklist

- [ ] Account 1: Add connector with URL `https://inneranimalmedia.com/api/mcp/sse` ⚠️ Must include /sse
- [ ] Account 2: Add connector with URL `https://inneranimalmedia.com/api/mcp/sse` ⚠️ Must include /sse
- [ ] Test connection in Account 1
- [ ] Test connection in Account 2
- [ ] Verify tools are accessible
- [ ] Verify database queries work

---

**Ready to connect!** Add the MeauxMCP connector to both accounts and start using your tools with Claude! 🚀
