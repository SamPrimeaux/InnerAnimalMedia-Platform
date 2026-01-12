# InnerAnimalMedia Services

Cloudflare Worker with SQL-backed Durable Objects for real-time services.

## Features

- ✅ **SQL-backed Durable Objects** - Persistent, scalable session management
- ✅ **MCP Protocol Server** - Model Context Protocol for AI/agent interactions
- ✅ **Browser Rendering** - Web page rendering and automation
- ✅ **Video Calls** - WebRTC signaling for livestreaming and group calls
- ✅ **Chat/Communications** - Real-time messaging
- ✅ **Resend Integration** - Email sending

## Setup

### 1. Install Dependencies

```bash
cd inneranimalmediaservices
npm install
```

### 2. Set Secrets

```bash
# Resend API Key
wrangler secret put RESEND_API_KEY

# Cloudflare API Token (optional, for additional features)
wrangler secret put CLOUDFLARE_API_TOKEN

# Cloudflare Account ID (optional)
wrangler secret put CLOUDFLARE_ACCOUNT_ID
```

### 3. Deploy

```bash
# Development
npm run dev

# Production
npm run deploy:production

# Staging
npm run deploy:staging
```

## API Endpoints

### Root
- `GET /` - Service info and available endpoints

### Sessions (Durable Objects)
- `GET /api/session/:id` - Get session data
- `POST /api/session/:id` - Update session data

### MCP Protocol
- `GET /api/session/:id/mcp/tools` - List available MCP tools
- `POST /api/session/:id/mcp/execute` - Execute MCP tool

### Browser Rendering
- `POST /api/session/:id/browser/render` - Render web page

### Video Calls (WebRTC)
- `POST /api/session/:id/video/offer` - Store WebRTC offer
- `POST /api/session/:id/video/answer` - Store WebRTC answer
- `POST /api/session/:id/video/ice-candidate` - Store ICE candidate

### Chat
- `GET /api/session/:id/chat/messages` - Get chat messages
- `POST /api/session/:id/chat/send` - Send message

### Email (Resend)
- `POST /api/session/:id/email/send` - Send email

## Usage Examples

### Create a Session

```javascript
const sessionId = 'my-session-123';
const response = await fetch(`https://inneranimalmediaservices.meauxbility.workers.dev/api/session/${sessionId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'video',
    participants: ['user1', 'user2'],
    metadata: {}
  })
});
```

### Send Email via Resend

```javascript
const response = await fetch(`https://inneranimalmediaservices.meauxbility.workers.dev/api/session/${sessionId}/email/send`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Hello',
    html: '<h1>Hello World</h1>',
    from: 'noreply@inneranimalmedia.com'
  })
});
```

### Execute MCP Tool

```javascript
const response = await fetch(`https://inneranimalmediaservices.meauxbility.workers.dev/api/session/${sessionId}/mcp/execute`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'sql_query',
    params: { query: 'SELECT * FROM users LIMIT 10' }
  })
});
```

## Architecture

- **Durable Objects**: SQL-backed storage for session persistence
- **D1 Database**: Additional data storage
- **R2 Storage**: Media file storage
- **Resend**: Email delivery

## Deployment

After deployment, your service will be available at:
- **Production**: `https://inneranimalmediaservices.meauxbility.workers.dev`
- **Staging**: `https://inneranimalmediaservices-staging.meauxbility.workers.dev`
