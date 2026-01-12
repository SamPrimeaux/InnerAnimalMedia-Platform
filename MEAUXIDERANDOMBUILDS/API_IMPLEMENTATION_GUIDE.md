# API Implementation Guide for Multi-Tenant System

## Required API Endpoints

### 1. Tenant Management

#### GET /api/tenants
List all tenants (for admin users) or current user's tenant.

**Request:**
```http
GET /api/tenants
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tenant_abc123",
      "name": "Acme Corp",
      "slug": "acme",
      "status": "active",
      "created_at": 1700000000
    }
  ]
}
```

### 2. Workflows API

#### GET /api/workflows
List workflows with pagination, filtering, and tenant isolation.

**Request:**
```http
GET /api/workflows?tenant_id=tenant_abc123&page=1&per_page=50&status=active&search=payment
Authorization: Bearer <token>
```

**Query Parameters:**
- `tenant_id` (optional): Filter by tenant (extracted from token if not provided)
- `page` (default: 1): Page number
- `per_page` (default: 50, max: 100): Items per page
- `status` (optional): Filter by status (active, paused, error, all)
- `search` (optional): Search by name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "workflow_xyz789",
      "name": "Payment Processing",
      "status": "active",
      "executions": 1247,
      "created_at": 1700000000,
      "updated_at": 1700001000
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 247,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  },
  "tenant_id": "tenant_abc123"
}
```

#### POST /api/workflows
Create a new workflow.

**Request:**
```http
POST /api/workflows
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Workflow",
  "config": {
    "steps": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "workflow_new123",
    "name": "New Workflow",
    "status": "active",
    "executions": 0,
    "created_at": 1700002000
  }
}
```

### 3. Deployments API

#### GET /api/vercel/deployments
List Vercel deployments with pagination and tenant filtering.

**Request:**
```http
GET /api/vercel/deployments?tenant_id=tenant_abc123&page=1&per_page=50&status=ready&project=my-app
Authorization: Bearer <token>
```

**Query Parameters:**
- `tenant_id` (optional): Filter by tenant
- `page` (default: 1): Page number
- `per_page` (default: 50): Items per page
- `status` (optional): Filter by status (ready, building, error, canceled)
- `project` (optional): Filter by project name

**Response:**
```json
{
  "success": true,
  "totalDeployments": 2847,
  "activeProjects": 12,
  "avgBuildTime": "2m 34s",
  "successRate": 94.5,
  "projects": [
    {
      "id": "proj_123",
      "name": "my-app",
      "status": "ready",
      "deployments": 2847,
      "framework": "Next.js",
      "environment": "Production",
      "today": 12,
      "last7Days": 245,
      "average": 35
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 2847,
    "total_pages": 57,
    "has_next": true,
    "has_prev": false
  }
}
```

### 4. Workers API

#### GET /api/workers
List Cloudflare Workers with tenant isolation.

**Request:**
```http
GET /api/workers?tenant_id=tenant_abc123&page=1&per_page=50
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 69,
  "data": [
    {
      "id": "worker_abc123",
      "name": "api-worker",
      "status": "active",
      "requests": 2100000,
      "created_at": 1700000000
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 69,
    "total_pages": 2,
    "has_next": true,
    "has_prev": false
  }
}
```

## Implementation Example (Cloudflare Workers)

```javascript
// worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Extract tenant from JWT token
    const tenantId = await getTenantFromRequest(request, env);
    
    // Route handling
    if (path.startsWith('/api/workflows')) {
      return handleWorkflows(request, env, tenantId);
    }
    
    if (path.startsWith('/api/deployments')) {
      return handleDeployments(request, env, tenantId);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

async function getTenantFromRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw new Error('Unauthorized');
  
  const token = authHeader.replace('Bearer ', '');
  const payload = await verifyJWT(token, env.JWT_SECRET);
  
  return payload.tenant_id;
}

async function handleWorkflows(request, env, tenantId) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '50'), 100);
  const status = url.searchParams.get('status') || 'all';
  const search = url.searchParams.get('search') || '';
  
  // Build query with tenant isolation
  let query = env.DB.prepare(`
    SELECT * FROM workflows 
    WHERE tenant_id = ?
  `).bind(tenantId);
  
  if (status !== 'all') {
    query = query.bind(status);
  }
  
  if (search) {
    query = query.bind(`%${search}%`);
  }
  
  // Get total count
  const countResult = await env.DB.prepare(`
    SELECT COUNT(*) as total FROM workflows WHERE tenant_id = ?
  `).bind(tenantId).first();
  
  const total = countResult.total;
  
  // Get paginated results
  const offset = (page - 1) * perPage;
  const results = await query
    .orderBy('created_at', 'DESC')
    .limit(perPage)
    .offset(offset)
    .all();
  
  return new Response(JSON.stringify({
    success: true,
    data: results,
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
      has_next: page < Math.ceil(total / perPage),
      has_prev: page > 1
    },
    tenant_id: tenantId
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleDeployments(request, env, tenantId) {
  // Similar implementation with tenant isolation
  // ...
}
```

## Database Queries

### Get Workflows with Pagination
```sql
SELECT * FROM workflows 
WHERE tenant_id = ? 
  AND (? = 'all' OR status = ?)
  AND (? = '' OR name LIKE ?)
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

### Get Deployment Stats
```sql
SELECT 
  COUNT(*) as total_deployments,
  COUNT(DISTINCT project_id) as active_projects,
  AVG(build_time) as avg_build_time,
  SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
FROM deployments
WHERE tenant_id = ?;
```

## Security Checklist

- [ ] JWT token validation on every request
- [ ] Tenant ID extraction from token
- [ ] Tenant ID validation (exists and active)
- [ ] Row-level security in all queries
- [ ] Rate limiting per tenant
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS configuration
- [ ] Error messages don't leak tenant information

## Performance Optimization

1. **Indexing**: Ensure composite indexes on `(tenant_id, created_at)`, `(tenant_id, status)`
2. **Caching**: Cache frequently accessed data with tenant-scoped keys
3. **Pagination**: Always use pagination, never return all records
4. **Query Optimization**: Use EXPLAIN to analyze query performance
5. **Connection Pooling**: Reuse database connections

## Error Handling

```json
{
  "success": false,
  "error": {
    "code": "TENANT_NOT_FOUND",
    "message": "Tenant not found or inactive",
    "status": 404
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Missing or invalid token
- `TENANT_NOT_FOUND`: Tenant doesn't exist
- `TENANT_INACTIVE`: Tenant account is inactive
- `INVALID_INPUT`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Testing

### Unit Tests
```javascript
test('workflows are filtered by tenant', async () => {
  const tenant1 = await createTenant('tenant1');
  const tenant2 = await createTenant('tenant2');
  
  await createWorkflow(tenant1.id, 'Workflow 1');
  await createWorkflow(tenant2.id, 'Workflow 2');
  
  const workflows = await getWorkflows(tenant1.id);
  expect(workflows).toHaveLength(1);
  expect(workflows[0].name).toBe('Workflow 1');
});
```

### Integration Tests
- Test pagination with 1000+ records
- Test filtering and search
- Test tenant isolation
- Test rate limiting
- Test error handling

## Monitoring

Track these metrics:
- Request rate per tenant
- Response times (p50, p95, p99)
- Error rates by tenant
- Database query performance
- Cache hit rates
- Rate limit hits
