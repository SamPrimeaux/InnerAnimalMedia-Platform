# Enhanced Systems Documentation

## 🚀 What's Been Implemented

### 1. AI-Powered Chatbot
- **Cloudflare AI Integration**: Uses `@cf/meta/llama-3.1-8b-instruct` for intelligent responses
- **Knowledge Base Context**: Chatbot pulls from knowledge base for accurate answers
- **Multilingual Support**: Responds in user's preferred language (EN, JA, ZH, KO)
- **Fallback System**: Rule-based responses if AI is unavailable
- **Conversation History**: All conversations saved to database

**API Endpoint**: `POST /api/chatbot`
```json
{
  "message": "Tell me about your services",
  "sessionId": "session-123",
  "language": "en"
}
```

### 2. Knowledge Base System
Train your chatbot by adding knowledge entries:
- **Categories**: service, faq, company, area, process, general
- **Multilingual**: Each entry can be in different languages
- **Priority System**: Higher priority entries shown first
- **Keyword Search**: Automatic keyword extraction and matching

**API Endpoints**:
- `GET /api/knowledge` - List all entries
- `POST /api/knowledge` - Create entry
- `PUT /api/knowledge/:id` - Update entry
- `DELETE /api/knowledge/:id` - Delete entry

### 3. Content Management Dashboard
**Access**: `https://shinshu-solutions.meauxbility.workers.dev/dashboard-cms.html`

**Features**:
- **Asset Upload**: Images, videos, documents with SEO metadata
- **SEO Management**: Title, description, alt text, keywords, Open Graph tags
- **Knowledge Base Editor**: Add/edit training data for chatbot
- **Inquiry Management**: View and manage contact inquiries
- **Email Template Editor**: Create professional email templates

### 4. Asset Management with SEO
- **R2 Storage**: All assets stored in R2 bucket
- **SEO Metadata**: Title, description, alt text, keywords
- **Open Graph**: OG title, description, image for social sharing
- **Canonical URLs**: Proper canonical tag management
- **Multilingual**: Assets can have different metadata per language

**API Endpoints**:
- `GET /api/assets` - List all assets
- `POST /api/assets/upload` - Upload new asset (multipart/form-data)
- `GET /api/assets/:id/view` - View/download asset
- `PUT /api/assets/:id` - Update SEO metadata
- `DELETE /api/assets/:id` - Delete asset

### 5. Email System (Resend Integration)
**Ready for Resend** - Just add API key!

**Features**:
- **Auto-Responses**: Automatic email when inquiry received
- **Professional Templates**: HTML email templates with variables
- **Multilingual**: Templates in EN, JA, ZH, KO
- **Admin Notifications**: Notifies admin of new inquiries

**Setup**:
1. Get Resend API key from https://resend.com
2. Add to Cloudflare Worker secrets:
   ```bash
   wrangler secret put RESEND_API_KEY
   wrangler secret put RESEND_FROM_EMAIL  # e.g., [email protected]
   wrangler secret put RESEND_ADMIN_EMAIL  # Your email for notifications
   ```

**Email Templates**:
- Variables: `{{name}}`, `{{email}}`, `{{message}}`, `{{subject}}`, `{{company}}`, `{{contact_email}}`, `{{contact_phone}}`
- Default templates included for inquiry auto-responses

**API Endpoints**:
- `GET /api/email-templates` - List templates
- `POST /api/email-templates` - Create template
- `PUT /api/email-templates/:id` - Update template

### 6. Contact Inquiry System
- **Auto-Detection**: Detects language from message
- **Auto-Response**: Sends email automatically (if Resend configured)
- **Status Tracking**: new, responded, resolved, archived
- **Admin Dashboard**: View and manage all inquiries

**API Endpoints**:
- `GET /api/inquiries` - List inquiries
- `POST /api/inquiries` - Create inquiry (from contact form)
- `PUT /api/inquiries/:id` - Update status

## 📊 Database Schema

### New Tables:
1. **knowledge_base** - Chatbot training data
2. **asset_metadata** - SEO metadata for assets
3. **email_templates** - Email templates
4. **contact_inquiries** - Contact form submissions

## 🎯 Usage Guide

### Training the Chatbot

1. **Via Dashboard**:
   - Go to `/dashboard-cms.html`
   - Click "Knowledge Base" tab
   - Add entries with categories, keywords, and content

2. **Via API**:
```bash
curl -X POST https://shinshu-solutions.meauxbility.workers.dev/api/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "category": "service",
    "language_code": "en",
    "title": "Translation Services",
    "content": "We provide professional Japanese-English translation for property discussions, contracts, and documents.",
    "keywords": "translation, japanese, english, property",
    "priority": 8
  }'
```

### Uploading Assets with SEO

1. **Via Dashboard**:
   - Go to `/dashboard-cms.html`
   - Click "Assets & SEO" tab
   - Upload file and fill in SEO metadata

2. **Via API**:
```bash
curl -X POST https://shinshu-solutions.meauxbility.workers.dev/api/assets/upload \
  -F "file=@image.jpg" \
  -F 'metadata={"asset_type":"image","title":"Property Photo","description":"Beautiful property in Nagano","alt_text":"Nagano property exterior","keywords":"nagano,property,japan","language_code":"en"}'
```

### Setting Up Email (Resend)

1. **Get Resend Account**: Sign up at https://resend.com
2. **Add Secrets**:
   ```bash
   wrangler secret put RESEND_API_KEY
   wrangler secret put RESEND_FROM_EMAIL
   wrangler secret put RESEND_ADMIN_EMAIL
   ```
3. **Verify Domain** (optional but recommended)
4. **Test**: Submit contact form - should receive auto-response

### Customizing Email Templates

1. Go to `/dashboard-cms.html`
2. Click "Email Templates" tab
3. Create/edit templates with variables
4. Templates automatically used for auto-responses

## 🔧 Configuration

### Cloudflare AI
Already configured in `wrangler.toml`. The AI binding is available as `env.AI` in the worker.

### R2 Storage
Bucket: `shinshu-solutions` (already configured)

### D1 Database
Database: `shinshu-solutions` (ID: `071a4f1b-da85-4bdb-a32a-de3e608269d3`)

## 📝 Next Steps

1. **Add Resend API Key**: Enable email functionality
2. **Train Chatbot**: Add knowledge base entries via dashboard
3. **Upload Assets**: Add images/content with proper SEO
4. **Customize Templates**: Edit email templates to match brand
5. **Monitor Inquiries**: Use dashboard to track and respond to inquiries

## 🎨 Professional Features

- ✅ AI-powered intelligent responses
- ✅ Knowledge base training system
- ✅ SEO-optimized asset management
- ✅ Professional email templates
- ✅ Multilingual support throughout
- ✅ Automated inquiry responses
- ✅ Content management dashboard
- ✅ R2 storage integration
- ✅ Database-backed everything

All systems are production-ready and deployed! 🚀
