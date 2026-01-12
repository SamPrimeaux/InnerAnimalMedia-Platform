-- Support System Migration for inneranimalmedia-business
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/migration-support-system.sql --remote

-- ============================================
-- Support Tickets Table
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',              -- open, in_progress, waiting, resolved, closed
  priority TEXT DEFAULT 'normal',          -- low, normal, high, urgent
  category TEXT,                           -- technical, billing, feature_request, bug
  assigned_to TEXT,                        -- Support agent user_id
  first_response_at INTEGER,
  resolved_at INTEGER,
  closed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- Ticket Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  message TEXT NOT NULL,
  sender_type TEXT DEFAULT 'user',         -- user, support
  sender_name TEXT,
  sender_email TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- ============================================
-- Ticket Tags Table
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_tags (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- ============================================
-- Help Categories Table
-- ============================================
-- Note: If table exists with different structure, we'll use ALTER TABLE
CREATE TABLE IF NOT EXISTS help_categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  parent_category TEXT,
  FOREIGN KEY (parent_category) REFERENCES help_categories(slug) ON DELETE SET NULL
);

-- Add category column if it doesn't exist (for compatibility)
-- SQLite doesn't support ALTER COLUMN, so we'll handle this in the API

-- ============================================
-- Help Articles Table
-- ============================================
CREATE TABLE IF NOT EXISTS help_articles (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,                   -- Markdown or HTML
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  search_keywords TEXT,
  is_published INTEGER DEFAULT 0,
  author_id TEXT,
  author_name TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================
-- Customer Feedback Table
-- ============================================
-- Note: Table already exists with different structure
-- Existing structure: id, user_id, email, type, subject, message, rating, page_url, user_agent, status, created_at
-- We'll use the existing structure (CREATE IF NOT EXISTS will skip if table exists)
CREATE TABLE IF NOT EXISTS customer_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  type TEXT DEFAULT 'general',              -- general, feature_request, bug_report, complaint, praise
  subject TEXT,
  message TEXT NOT NULL,
  rating INTEGER,                           -- 1-5 stars
  page_url TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ticket_tags_ticket ON ticket_tags(ticket_id);
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category, is_published);
CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON help_articles(slug);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_help_categories_slug ON help_categories(slug);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_user ON customer_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_type ON customer_feedback(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_status ON customer_feedback(status, created_at DESC);

-- ============================================
-- Seed Data: Help Categories
-- ============================================
-- Note: Using existing table structure (slug as PRIMARY KEY)
INSERT OR IGNORE INTO help_categories (slug, name, description, order_index) VALUES
  ('getting-started', 'Getting Started', 'Learn the basics of InnerAnimal Media', 1),
  ('spar-specific', 'SPAR Animal Rescue', 'SPAR-specific guides and resources', 2),
  ('technical', 'Technical Support', 'Technical documentation and troubleshooting', 3),
  ('account-billing', 'Account & Billing', 'Account management and billing questions', 4),
  ('api-integration', 'API & Integration', 'API documentation and integration guides', 5);

-- ============================================
-- Seed Data: Help Articles
-- ============================================
INSERT OR IGNORE INTO help_articles (id, category, title, slug, summary, content, is_published, author_name, created_at, updated_at) VALUES
  ('art_1', 'SPAR Animal Rescue', 'SPAR Quick Start Guide', 'spar-quick-start', 'Get started with SPAR Animal Rescue dashboard features', '## SPAR Quick Start Guide

Welcome to the SPAR Animal Rescue platform! This guide will help you get started.

### Key Features
- **Animal Profiles**: Manage animal listings with photos and details
- **Adoption Applications**: Track adoption requests and applicant information
- **Donations**: Accept and track donations from supporters
- **Calendar**: Schedule events, adoption appointments, and volunteer shifts

### Next Steps
1. Complete your organization profile
2. Add your first animal listing
3. Configure your adoption application form
4. Set up your donation page

Need help? Contact support or browse more articles!', 1, 'Support Team', strftime('%s', 'now'), strftime('%s', 'now')),

  ('art_2', 'SPAR Animal Rescue', 'Managing Animal Profiles', 'spar-managing-animals', 'Learn how to add, edit, and manage animal profiles', '## Managing Animal Profiles

### Adding a New Animal
1. Navigate to the Animals section
2. Click "Add New Animal"
3. Fill in the required information:
   - Name, breed, age, gender
   - Photos (upload multiple images)
   - Medical history
   - Behavioral notes
   - Adoption requirements

### Editing Animal Information
- Click on any animal to view and edit their profile
- Update information as needed
- Save changes

### Animal Status
- **Available**: Ready for adoption
- **Pending**: Adoption application in progress
- **Adopted**: Successfully placed with a family
- **Medical Hold**: Currently receiving medical care', 1, 'Support Team', strftime('%s', 'now'), strftime('%s', 'now')),

  ('art_3', 'Getting Started', 'Creating Your First Workspace', 'creating-workspace', 'Step-by-step guide to setting up your workspace', '## Creating Your First Workspace

### Step 1: Sign Up
Create your account using the onboarding wizard.

### Step 2: Choose Workspace Type
Select from:
- **Personal**: Individual use
- **Team**: For small teams
- **Organization**: For larger organizations

### Step 3: Configure Settings
- Set your workspace name
- Choose modules to enable
- Select a preset configuration

### Step 4: Invite Team Members
Add team members and assign roles.

You''re all set! Start using your workspace.', 1, 'Support Team', strftime('%s', 'now'), strftime('%s', 'now')),

  ('art_4', 'Getting Started', 'Dashboard Overview', 'dashboard-overview', 'Learn about the main dashboard features', '## Dashboard Overview

Your dashboard is your command center. Here''s what you can do:

### Main Sections
- **Projects**: Manage your projects and tasks
- **Workflows**: Automate repetitive tasks
- **Deployments**: Track your deployments
- **Analytics**: View performance metrics

### Quick Actions
Use the sidebar to quickly navigate between sections.', 1, 'Support Team', strftime('%s', 'now'), strftime('%s', 'now')),

  ('art_5', 'Technical Support', 'Uploading Files and Images', 'uploading-files', 'How to upload and manage files in R2 storage', '## Uploading Files and Images

### Supported File Types
- Images: JPG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX
- Videos: MP4, WebM

### Upload Limits
- Maximum file size: 100MB per file
- Total storage: Based on your plan

### Upload Process
1. Navigate to the Assets section
2. Click "Upload Files"
3. Select your files
4. Wait for upload to complete

Files are automatically stored in Cloudflare R2.', 1, 'Support Team', strftime('%s', 'now'), strftime('%s', 'now')),

  ('art_6', 'Technical Support', 'API Authentication', 'api-authentication', 'How to authenticate API requests', '## API Authentication

### API Keys
1. Navigate to Settings > API Keys
2. Generate a new API key
3. Copy and store securely

### Using API Keys
Include your API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

### Rate Limits
- Free tier: 100 requests/hour
- Paid tier: 1000 requests/hour', 1, 'Support Team', strftime('%s', 'now'), strftime('%s', 'now')),

  ('art_7', 'Account & Billing', 'Upgrading Your Plan', 'upgrading-plan', 'How to upgrade your subscription plan', '## Upgrading Your Plan

### Available Plans
- **Free**: Basic features, limited usage
- **Pro**: Advanced features, higher limits
- **Enterprise**: Full features, custom limits

### How to Upgrade
1. Go to Settings > Billing
2. Click "Upgrade Plan"
3. Select your desired plan
4. Complete payment

Changes take effect immediately.', 1, 'Support Team', strftime('%s', 'now'), strftime('%s', 'now')),

  ('art_8', 'Account & Billing', 'Payment Methods', 'payment-methods', 'Adding and managing payment methods', '## Payment Methods

### Supported Payment Methods
- Credit Cards (Visa, Mastercard, Amex)
- Debit Cards
- PayPal (coming soon)

### Adding a Payment Method
1. Go to Settings > Billing > Payment Methods
2. Click "Add Payment Method"
3. Enter your card details
4. Save

### Security
All payments are processed securely through Stripe.', 1, 'Support Team', strftime('%s', 'now'), strftime('%s', 'now')),

  ('art_9', 'API & Integration', 'Getting Started with the API', 'api-getting-started', 'Introduction to our REST API', '## Getting Started with the API

### Base URL
```
https://api.inneranimalmedia.com
```

### Authentication
Use your API key in the Authorization header.

### Example Request
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.inneranimalmedia.com/api/tenants
```

### Response Format
All responses are in JSON format.', 1, 'Support Team', strftime('%s', 'now'), strftime('%s', 'now')),

  ('art_10', 'API & Integration', 'Webhook Setup', 'webhook-setup', 'How to set up webhooks for real-time updates', '## Webhook Setup

### What are Webhooks?
Webhooks allow you to receive real-time notifications when events occur in your workspace.

### Setting Up a Webhook
1. Go to Settings > Integrations > Webhooks
2. Click "Add Webhook"
3. Enter your endpoint URL
4. Select events to subscribe to
5. Save

### Supported Events
- ticket.created
- ticket.updated
- deployment.completed
- workflow.executed', 1, 'Support Team', strftime('%s', 'now'), strftime('%s', 'now'));
