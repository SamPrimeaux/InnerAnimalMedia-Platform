# Multi-Tenant Architecture Guide

## Overview
This system is designed to support **multiple tenants**, **hundreds of deployments**, and **hundreds of workflows** with optimal performance and data isolation.

## Core Principles

### 1. Tenant Isolation
- **Tenant ID**: Every resource (deployment, workflow, user) must include a `tenant_id`
- **Row-Level Security**: All database queries must filter by `tenant_id`
- **API Authentication**: Tenant context extracted from JWT token or subdomain
- **Data Segregation**: Never expose data across tenant boundaries

### 2. Scalability Patterns

#### Database Schema
```sql
-- Tenants Table
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT DEFAULT 'active'
);

-- Deployments Table (with tenant isolation)
CREATE TABLE deployments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  status TEXT NOT NULL,
  url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_tenant_created (tenant_id, created_at DESC)
);

-- Workflows Table (with tenant isolation)
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  config TEXT, -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_tenant_status (tenant_id, status)
);

-- Users Table (with tenant association)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(tenant_id, email)
);
```

#### Indexing Strategy
- **Composite Indexes**: `(tenant_id, created_at)`, `(tenant_id, status)`
- **Query Optimization**: Always query with tenant_id first
- **Pagination**: Use cursor-based pagination for large datasets

### 3. API Design Patterns

#### Request Headers
```
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_id> (optional, extracted from JWT if not provided)
```

#### Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 247,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false,
    "cursor": "eyJpZCI6IjEyMyIsInRpbWUiOjE3MDAwMDAwMDB9"
  },
  "tenant_id": "tenant_abc123"
}
```

#### Endpoint Examples
```
GET /api/deployments?tenant_id=abc&page=1&per_page=50&status=active
GET /api/workflows?tenant_id=abc&cursor=xyz&limit=50
GET /api/tenants/:tenant_id/stats
```

### 4. Frontend Enhancements

#### Tenant Selector
- Dropdown in header to switch tenants (for multi-tenant admins)
- Store selected tenant in localStorage
- Include tenant_id in all API requests

#### Pagination
- Server-side pagination (never load all records)
- Infinite scroll or page-based navigation
- Cursor-based pagination for real-time data

#### Filtering & Search
- Server-side filtering by status, date range, name
- Debounced search input
- URL query parameters for shareable filtered views

#### Performance Optimizations
- Virtual scrolling for large lists
- Lazy loading of details
- Caching with TTL
- Request deduplication

### 5. Caching Strategy

#### Cache Keys
```
deployments:tenant:{tenant_id}:page:{page}:status:{status}
workflows:tenant:{tenant_id}:status:{status}
tenant:{tenant_id}:stats
```

#### Cache Invalidation
- Invalidate on create/update/delete operations
- TTL: 30-60 seconds for dynamic data
- Cache warming for frequently accessed data

### 6. Rate Limiting

#### Per-Tenant Limits
```
- API Requests: 1000/minute per tenant
- Deployments: 100/hour per tenant
- Workflows: 50/hour per tenant
```

#### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1700000000
```

### 7. Monitoring & Observability

#### Metrics to Track
- Requests per tenant
- Response times by tenant
- Error rates by tenant
- Database query performance
- Cache hit rates

#### Alerts
- Tenant quota exceeded
- Slow queries (>500ms)
- High error rates (>5%)
- Database connection pool exhaustion

### 8. Security Considerations

#### Authentication
- JWT tokens with tenant_id claim
- Token validation on every request
- Refresh token rotation

#### Authorization
- Role-based access control (RBAC)
- Tenant-scoped permissions
- Audit logging for all operations

#### Data Protection
- Encryption at rest
- Encryption in transit (TLS)
- PII data masking in logs

### 9. Migration Strategy

#### Existing Data
1. Create default tenant for existing data
2. Add tenant_id column to all tables
3. Backfill tenant_id for existing records
4. Add NOT NULL constraint
5. Add foreign key constraints

#### Zero-Downtime Deployment
- Deploy schema changes first
- Backfill in background
- Deploy application code
- Monitor for issues

### 10. Best Practices

#### Code Patterns
```javascript
// Always include tenant_id in queries
async function getDeployments(tenantId, filters) {
  const query = db
    .select('*')
    .from('deployments')
    .where('tenant_id', tenantId) // Always filter by tenant
    .where(filters)
    .orderBy('created_at', 'desc')
    .limit(perPage)
    .offset((page - 1) * perPage);
  
  return query;
}

// Extract tenant from request
function getTenantId(request) {
  // 1. Check JWT token claim
  const token = extractToken(request);
  if (token?.tenant_id) return token.tenant_id;
  
  // 2. Check header
  if (request.headers.get('X-Tenant-ID')) {
    return request.headers.get('X-Tenant-ID');
  }
  
  // 3. Check subdomain
  const hostname = new URL(request.url).hostname;
  const subdomain = hostname.split('.')[0];
  if (subdomain !== 'www' && subdomain !== 'api') {
    return subdomain;
  }
  
  throw new Error('Tenant ID required');
}
```

#### Error Handling
- Never expose tenant data in error messages
- Log tenant_id for debugging
- Return generic errors to clients

#### Testing
- Unit tests for tenant isolation
- Integration tests for multi-tenant scenarios
- Load tests with 100+ tenants
- Security tests for cross-tenant access

## Implementation Checklist

- [ ] Database schema with tenant_id columns
- [ ] Composite indexes on (tenant_id, ...)
- [ ] API middleware for tenant extraction
- [ ] Tenant selector in frontend
- [ ] Pagination on all list endpoints
- [ ] Server-side filtering and search
- [ ] Caching layer with tenant-scoped keys
- [ ] Rate limiting per tenant
- [ ] Monitoring and alerting
- [ ] Audit logging
- [ ] Security testing
- [ ] Performance testing
- [ ] Documentation

## Performance Targets

- **API Response Time**: <200ms (p95)
- **Database Queries**: <50ms (p95)
- **Cache Hit Rate**: >80%
- **Concurrent Tenants**: 100+
- **Deployments per Tenant**: 1000+
- **Workflows per Tenant**: 500+

## Next Steps

1. Review and approve architecture
2. Create database migration scripts
3. Update API endpoints with tenant support
4. Enhance frontend with pagination and filtering
5. Implement caching layer
6. Set up monitoring and alerting
7. Load testing
8. Security audit
9. Documentation
10. Deployment
