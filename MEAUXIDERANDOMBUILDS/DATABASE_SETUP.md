# Database Setup Guide

## ✅ Database Connected

Your D1 database is now connected:
- **Database Name**: `meauxos`
- **Database ID**: `d8261777-9384-44f7-924d-c92247d55b46`
- **Binding**: `DB`

## 🚀 Quick Setup

### 1. Create Database Schema

Run the schema migration:

```bash
# Apply schema to production database
wrangler d1 execute meauxos --file=src/schema.sql

# Or apply to local database for testing
wrangler d1 execute meauxos --local --file=src/schema.sql
```

### 2. Verify Tables Created

```bash
# List all tables
wrangler d1 execute meauxos --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### 3. Test Connection

```bash
# Test query
wrangler d1 execute meauxos --command "SELECT COUNT(*) as count FROM tenants"
```

## 📊 Database Schema

### Tables Created

1. **tenants** - Multi-tenant organization data
2. **users** - User accounts with tenant association
3. **deployments** - Vercel/Cloudflare deployments
4. **workflows** - Automation workflows
5. **workers** - Cloudflare Workers

### Indexes

- `idx_deployments_tenant` - Fast tenant-scoped deployment queries
- `idx_workflows_tenant` - Fast tenant-scoped workflow queries
- `idx_workers_tenant` - Fast tenant-scoped worker queries
- `idx_users_tenant` - Fast tenant-scoped user queries

## 🔧 Common Operations

### Insert Test Data

```sql
-- Insert a test tenant
INSERT INTO tenants (id, name, slug, status, created_at, updated_at)
VALUES ('test_tenant_1', 'Test Company', 'test-company', 'active', strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert a test user
INSERT INTO users (id, tenant_id, email, name, role, created_at, updated_at)
VALUES ('user_1', 'test_tenant_1', 'test@example.com', 'Test User', 'admin', strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert a test deployment
INSERT INTO deployments (id, tenant_id, project_name, status, url, created_at, updated_at)
VALUES ('deploy_1', 'test_tenant_1', 'my-app', 'ready', 'https://my-app.vercel.app', strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert a test workflow
INSERT INTO workflows (id, tenant_id, name, status, config, created_at, updated_at)
VALUES ('workflow_1', 'test_tenant_1', 'Test Workflow', 'active', '{}', strftime('%s', 'now'), strftime('%s', 'now'));
```

### Query Examples

```bash
# Get all tenants
wrangler d1 execute meauxos --command "SELECT * FROM tenants"

# Get deployments for a tenant
wrangler d1 execute meauxos --command "SELECT * FROM deployments WHERE tenant_id = 'test_tenant_1'"

# Get workflow count
wrangler d1 execute meauxos --command "SELECT COUNT(*) as count FROM workflows WHERE status = 'active'"
```

## 🔐 Security Notes

- All queries in the Worker automatically filter by `tenant_id`
- Never expose tenant data across boundaries
- Use parameterized queries (already implemented)
- Validate tenant access on every request

## 📈 Performance Tips

1. **Use Indexes**: All tenant-scoped queries use composite indexes
2. **Pagination**: Always use LIMIT/OFFSET for large datasets
3. **Connection Pooling**: D1 handles this automatically
4. **Caching**: Consider using KV for frequently accessed data

## 🧪 Local Development

### Run Local Database

```bash
# Initialize local database
wrangler d1 execute meauxos --local --file=src/schema.sql

# Run local dev server with database
wrangler dev
```

### Test Locally

```bash
# Query local database
wrangler d1 execute meauxos --local --command "SELECT * FROM tenants"
```

## 🚨 Troubleshooting

### Database Not Found
```bash
# Verify database exists
wrangler d1 list
```

### Migration Fails
- Check if tables already exist
- Use `CREATE TABLE IF NOT EXISTS` (already in schema)
- Drop and recreate if needed (careful in production!)

### Connection Issues
- Verify `wrangler.toml` has correct database_id
- Check binding name matches (`DB`)
- Ensure database is in same account

## 📝 Next Steps

1. ✅ Database connected
2. ✅ Schema created
3. ⏳ Run migrations
4. ⏳ Insert test data
5. ⏳ Deploy Worker
6. ⏳ Test API endpoints

## 🔗 Resources

- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler D1 Commands](https://developers.cloudflare.com/workers/wrangler/commands/#d1)
- [D1 Best Practices](https://developers.cloudflare.com/d1/best-practices/)
