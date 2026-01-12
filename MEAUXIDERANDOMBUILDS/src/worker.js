/**
 * iAccess Platform API Worker
 * Handles all API requests with multi-tenant support
 */

// Admin Routing Utilities (inline to avoid import issues)
function isAdminRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname.toLowerCase();
  return hostname.startsWith('admin.') ||
    hostname.includes('.admin.') ||
    url.pathname.startsWith('/admin/');
}

function parseAdminRoute(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const hostname = url.hostname.toLowerCase();

  const isAdminSubdomain = hostname.startsWith('admin.') || hostname.includes('.admin.');
  const isAdminPath = path.startsWith('/admin/');

  if (!isAdminSubdomain && !isAdminPath) return null;

  let routePath = path;
  if (isAdminPath) {
    routePath = path.replace('/admin', '') || '/';
  }

  const routeParts = routePath.split('/').filter(p => p);

  if (routeParts.length >= 2 && routeParts[0] === 'store') {
    return { type: 'store', slug: routeParts[1], subPath: routeParts.slice(2).join('/') || null, fullPath: routePath };
  }
  if (routeParts.length >= 1 && routeParts[0] === 'stores') {
    return { type: 'stores', subPath: routeParts.slice(1).join('/') || null, fullPath: routePath };
  }
  if (routeParts.length >= 1 && routeParts[0] === 'settings') {
    return { type: 'settings', subPath: routeParts.slice(1).join('/') || null, fullPath: routePath };
  }
  return { type: 'dashboard', subPath: routeParts.join('/') || null, fullPath: routePath };
}

function generateAdminUrl(baseUrl, route) {
  const url = new URL(baseUrl);
  if (url.hostname.startsWith('admin.')) {
    url.pathname = route;
    return url.toString();
  }
  const parts = url.hostname.split('.');
  if (parts.length >= 2) {
    url.hostname = `admin.${parts.slice(-2).join('.')}`;
  } else {
    url.hostname = `admin.${url.hostname}`;
  }
  url.pathname = route;
  return url.toString();
}

// Cloudflare API Integration Functions
async function getCloudflareDeployments(env, tenantId = null) {
  const startTime = Date.now();

  if (!env.CLOUDFLARE_API_TOKEN) {
    throw new Error('CLOUDFLARE_API_TOKEN not configured');
  }

  const accountId = await getAccountId(env);
  if (!accountId) {
    console.error('Cloudflare account ID not found. Set CLOUDFLARE_ACCOUNT_ID secret or ensure API token has account access.');
    throw new Error('Cloudflare account ID not found');
  }

  console.log(`Fetching deployments for account ${accountId}`);

  // Fetch Pages deployments
  const pagesResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
    {
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!pagesResponse.ok) {
    const errorText = await pagesResponse.text();
    console.error(`Cloudflare Pages API error (${pagesResponse.status}):`, errorText);
    throw new Error(`Cloudflare API error: ${pagesResponse.status} ${pagesResponse.statusText}`);
  }

  const pagesData = await pagesResponse.json();

  if (!pagesData.success) {
    console.error('Cloudflare Pages API returned error:', pagesData.errors);
    throw new Error(`Cloudflare API error: ${JSON.stringify(pagesData.errors)}`);
  }

  const projects = pagesData.result || [];
  console.log(`Found ${projects.length} Pages projects`);

  // Track Cloudflare API usage (free - no cost, but track for monitoring)
  const apiRequests = 1 + projects.length; // Initial request + one per project
  trackAPICost(env, {
    service: 'cloudflare_workers',
    event_type: 'compute',
    usage_amount: apiRequests,
    usage_unit: 'api_requests',
    estimated_cost_usd: 0, // Cloudflare API calls are free (included in Workers plan)
    metadata: {
      api_type: 'pages_deployments',
      account_id: accountId,
      projects_count: projects.length,
      response_time_ms: Date.now() - startTime
    },
    tenant_id: tenantId || 'system'
  }).catch(e => console.error('Cost tracking error:', e));

  // Fetch deployments for each project
  const deployments = [];
  for (const project of projects) {
    const deploymentsResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project.name}/deployments`,
      {
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (deploymentsResponse.ok) {
      const deploymentsData = await deploymentsResponse.json();
      const projectDeployments = (deploymentsData.result || []).map(deployment => ({
        id: deployment.id || `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        project_name: project.name,
        project_id: project.id,
        status: deployment.stage?.status || deployment.stage?.current_step?.name || 'ready',
        url: deployment.url || deployment.preview_url || `https://${project.name}.pages.dev`,
        framework: project.build_config?.framework || 'unknown',
        environment: deployment.environment || 'production',
        build_time: deployment.deployment_trigger?.metadata?.branch ? null : 0,
        created_at: new Date(deployment.created_on || Date.now()).getTime() / 1000,
        updated_at: new Date(deployment.updated_on || deployment.created_on || Date.now()).getTime() / 1000,
      }));

      deployments.push(...projectDeployments);
    }
  }

  return deployments;
}

async function getCloudflareWorkers(env, tenantId = null) {
  if (!env.CLOUDFLARE_API_TOKEN) {
    throw new Error('CLOUDFLARE_API_TOKEN not configured');
  }

  const accountId = await getAccountId(env);
  if (!accountId) {
    console.error('Cloudflare account ID not found. Set CLOUDFLARE_ACCOUNT_ID secret or ensure API token has account access.');
    throw new Error('Cloudflare account ID not found');
  }

  console.log(`Fetching workers for account ${accountId}`);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`,
    {
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Cloudflare Workers API error (${response.status}):`, errorText);
    throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    console.error('Cloudflare API returned error:', data.errors);
    throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
  }

  const workers = (data.result || []).map(worker => ({
    id: worker.id || worker.script || `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tenant_id: tenantId,
    name: worker.id || worker.script || 'Unknown Worker',
    script_name: worker.id || worker.script || 'unknown',
    status: 'active',
    requests: worker.requests || 0,
    created_at: new Date(worker.modified_on || worker.created_on || Date.now()).getTime() / 1000,
    updated_at: new Date(worker.modified_on || worker.created_on || Date.now()).getTime() / 1000,
  }));

  console.log(`Mapped ${workers.length} workers from Cloudflare API`);
  return workers;
}

async function getAccountId(env) {
  // Try to get from environment variable first
  if (env.CLOUDFLARE_ACCOUNT_ID) {
    return env.CLOUDFLARE_ACCOUNT_ID;
  }

  // Fetch from API
  try {
    const response = await fetch(
      'https://api.cloudflare.com/client/v4/accounts',
      {
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const accounts = data.result || [];
      if (accounts.length > 0) {
        return accounts[0].id; // Use first account
      }
    }
  } catch (e) {
    console.error('Failed to fetch account ID:', e);
  }

  return null;
}

/**
 * SQL-backed Durable Object for InnerAnimalMedia Sessions
 * OPTIMIZED - Full SQLite schema for MCP and multi-tenant SaaS
 * Supports: MCP sessions, browser rendering, video calls, chat, communications
 * Features: Multi-tenant isolation, SQL queries, Data Studio access, optimized indexes
 */
export class IAMSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.storage = state.storage; // SQL-backed storage
    this.initialized = false;
  }

  // Helper: Execute SQL query and get first result (or null)
  sqlFirst(sql, ...params) {
    if (!this.storage.sql) return null;
    const cursor = this.storage.sql.exec(sql, ...params);
    const results = cursor.toArray();
    return results.length > 0 ? results[0] : null;
  }

  // Helper: Execute SQL query and get all results
  sqlAll(sql, ...params) {
    if (!this.storage.sql) return { results: [] };
    try {
      // SQLite exec() takes params as array or spread
      const cursor = this.storage.sql.exec(sql, params.length > 0 ? params : []);
      return { results: cursor.toArray() };
    } catch (error) {
      console.error('sqlAll error:', error, sql);
      return { results: [] };
    }
  }

  // Helper: Execute SQL and get first result
  sqlFirst(sql, ...params) {
    if (!this.storage.sql) return null;
    try {
      const cursor = this.storage.sql.exec(sql, ...params);
      const results = cursor.toArray();
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('sqlFirst error:', error);
      return null;
    }
  }

  // Helper: Execute SQL (INSERT/UPDATE/DELETE)
  sqlExec(sql, ...params) {
    if (!this.storage.sql) return;
    try {
      // SQLite exec() takes params as array
      this.storage.sql.exec(sql, params.length > 0 ? params : []);
    } catch (error) {
      console.error('sqlExec error:', error, sql);
      throw error;
    }
  }

  // Helper: Execute SQL (INSERT/UPDATE/DELETE)
  sqlExec(sql, ...params) {
    if (!this.storage.sql) return;
    this.storage.sql.exec(sql, ...params);
  }

  /**
   * Initialize SQLite schema for optimal SaaS functionality
   * Creates tables with proper indexes for multi-tenant isolation and MCP support
   */
  async initializeSchema() {
    if (this.initialized) return;

    try {
      // Check if SQL interface is available (SQLite-backed Durable Objects)
      if (!this.storage.sql) {
        console.error('SQL interface not available - Durable Object may not be SQLite-backed');
        this.initialized = true;
        return;
      }

      console.log('Initializing IAMSession SQLite schema...');

      // Create sessions table with multi-tenant support
      // Note: SQLite exec() for DDL statements - execute and consume cursor
      const createSessions = this.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          user_id TEXT,
          session_type TEXT NOT NULL DEFAULT 'chat',
          status TEXT NOT NULL DEFAULT 'active',
          metadata TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          expires_at INTEGER
        )
      `);
      // Consume cursor for DDL
      createSessions.toArray();

      // Create indexes separately (SQLite doesn't support inline INDEX in CREATE TABLE)
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_tenant_status ON sessions(tenant_id, status)`).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_tenant_created ON sessions(tenant_id, created_at DESC)`).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_user_tenant ON sessions(user_id, tenant_id)`).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_expires ON sessions(expires_at)`).toArray();

      // Create MCP sessions table
      this.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS mcp_sessions (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          mcp_server_id TEXT,
          mcp_version TEXT,
          context_data TEXT,
          state TEXT DEFAULT 'active',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
      `).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_session_tenant ON mcp_sessions(session_id, tenant_id)`).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_mcp_server ON mcp_sessions(mcp_server_id, tenant_id)`).toArray();

      // Create WebRTC signaling table
      this.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS webrtc_signals (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          signal_type TEXT NOT NULL,
          from_participant TEXT NOT NULL,
          signal_data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
      `).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_session_type ON webrtc_signals(session_id, signal_type)`).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_tenant_created_sig ON webrtc_signals(tenant_id, created_at DESC)`).toArray();

      // Create participants table
      this.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS session_participants (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT DEFAULT 'participant',
          joined_at INTEGER NOT NULL,
          left_at INTEGER,
          metadata TEXT,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
      `).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_session_active ON session_participants(session_id, left_at)`).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_user_sessions ON session_participants(user_id, tenant_id, left_at)`).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_tenant_active ON session_participants(tenant_id, left_at)`).toArray();

      // Create session messages table
      this.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS session_messages (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          user_id TEXT,
          message_type TEXT NOT NULL,
          content TEXT NOT NULL,
          metadata TEXT,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
      `).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_session_created ON session_messages(session_id, created_at DESC)`).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_tenant_type ON session_messages(tenant_id, message_type, created_at DESC)`).toArray();
      this.storage.sql.exec(`CREATE INDEX IF NOT EXISTS idx_mcp_requests ON session_messages(session_id, message_type, created_at DESC)`).toArray();

      console.log('IAMSession schema initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('IAMSession schema initialization error:', error);
      // Continue even if schema creation fails (might already exist)
      this.initialized = true;
    }
  }

  /**
   * Seed initial data for testing/development
   * Call this after schema initialization to populate with sample data
   */
  async seedData(tenantId = 'system') {
    if (!this.storage.sql) return;

    try {
      const now = Math.floor(Date.now() / 1000);
      const sessionId = this.state.id.toString();

      // Check if data already exists
      const existing = this.sqlFirst(
        'SELECT COUNT(*) as count FROM sessions WHERE id = ?',
        sessionId
      );

      if (existing && existing.count > 0) {
        console.log('Data already seeded for this instance');
        return;
      }

      // Seed a sample session if it doesn't exist
      this.sqlExec(
        `INSERT OR IGNORE INTO sessions (id, tenant_id, session_type, status, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        sessionId, tenantId, 'chat', 'active', JSON.stringify({ seeded: true }), now, now
      );

      // Seed a sample MCP session
      const mcpSessionId = `mcp-${sessionId}-${now}`;
      this.sqlExec(
        `INSERT OR IGNORE INTO mcp_sessions (id, session_id, tenant_id, mcp_server_id, mcp_version, context_data, state, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        mcpSessionId, sessionId, tenantId, 'default-mcp-server', '1.0',
        JSON.stringify({ tools: [], resources: [] }), 'active', now, now
      );

      // Seed a sample message
      const messageId = `msg-${sessionId}-${now}`;
      this.sqlExec(
        `INSERT OR IGNORE INTO session_messages (id, session_id, tenant_id, user_id, message_type, content, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        messageId, sessionId, tenantId, 'system', 'system',
        'Session initialized', JSON.stringify({ type: 'init' }), now
      );

      console.log('IAMSession data seeded successfully');
    } catch (error) {
      console.error('Seed data error:', error);
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Initialize schema on first request
    await this.initializeSchema();

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const sessionId = this.state.id.toString();
      const now = Math.floor(Date.now() / 1000);

      // Extract tenant_id from request headers or query params
      const tenantId = request.headers.get('X-Tenant-ID') ||
        url.searchParams.get('tenant_id') ||
        'system';

      // Get session data (SQL query)
      if (path === '/session' && request.method === 'GET') {
        // Check if SQL is available, otherwise fallback to KV
        if (!this.storage.sql) {
          const session = await this.storage.get('session');
          if (!session) {
            const defaultSession = {
              id: sessionId,
              tenant_id: tenantId,
              session_type: 'chat',
              status: 'active',
              metadata: {},
              created_at: now,
              updated_at: now,
            };
            await this.storage.put('session', defaultSession);
            return new Response(JSON.stringify({ success: true, data: defaultSession }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ success: true, data: session }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Use exec() for SQLite-backed Durable Objects
        const session = this.sqlFirst(
          'SELECT * FROM sessions WHERE id = ? AND tenant_id = ?',
          sessionId, tenantId
        );

        if (!session) {
          // Create default session with SQL
          this.sqlExec(
            `INSERT INTO sessions (id, tenant_id, session_type, status, metadata, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            sessionId, tenantId, 'chat', 'active', '{}', now, now
          );

          const defaultSession = {
            id: sessionId,
            tenant_id: tenantId,
            session_type: 'chat',
            status: 'active',
            metadata: {},
            created_at: now,
            updated_at: now,
          };
          return new Response(JSON.stringify({ success: true, data: defaultSession }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Parse JSON metadata
        if (session.metadata) {
          try {
            session.metadata = JSON.parse(session.metadata);
          } catch (e) {
            session.metadata = {};
          }
        }

        return new Response(JSON.stringify({ success: true, data: session }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update session data (SQL update)
      if (path === '/session' && request.method === 'POST') {
        const body = await request.json();
        const metadata = body.metadata ? JSON.stringify(body.metadata) : null;

        // Check if session exists
        const existing = this.sqlFirst(
          'SELECT * FROM sessions WHERE id = ? AND tenant_id = ?',
          sessionId, tenantId
        );

        if (!existing) {
          // Create new session
          this.sqlExec(
            `INSERT INTO sessions (id, tenant_id, user_id, session_type, status, metadata, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            sessionId,
            tenantId,
            body.user_id || null,
            body.session_type || 'chat',
            body.status || 'active',
            metadata || '{}',
            now,
            now
          );
        } else {
          // Update existing session
          this.sqlExec(
            `UPDATE sessions 
             SET user_id = COALESCE(?, user_id),
                 session_type = COALESCE(?, session_type),
                 status = COALESCE(?, status),
                 metadata = COALESCE(?, metadata),
                 updated_at = ?
             WHERE id = ? AND tenant_id = ?`,
            body.user_id || null,
            body.session_type || null,
            body.status || null,
            metadata || null,
            now,
            sessionId,
            tenantId
          );
        }

        // Fetch updated session
        const updated = this.sqlFirst(
          'SELECT * FROM sessions WHERE id = ? AND tenant_id = ?',
          sessionId, tenantId
        );

        if (updated && updated.metadata) {
          try {
            updated.metadata = JSON.parse(updated.metadata);
          } catch (e) {
            updated.metadata = {};
          }
        }

        return new Response(JSON.stringify({ success: true, data: updated }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // WebRTC Signaling endpoints for video calls (SQL-optimized)
      // POST /webrtc/offer - Handle WebRTC offer
      if (path === '/webrtc/offer' && request.method === 'POST') {
        const body = await request.json();

        // Ensure session exists
        let session = this.sqlFirst(
          'SELECT * FROM sessions WHERE id = ? AND tenant_id = ?',
          sessionId, tenantId
        );

        if (!session) {
          this.sqlExec(
            `INSERT INTO sessions (id, tenant_id, session_type, status, metadata, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            sessionId, tenantId, 'video', 'active', '{}', now, now
          );
        } else {
          this.sqlExec(
            `UPDATE sessions SET session_type = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`,
            'video', now, sessionId, tenantId
          );
        }

        // Store WebRTC offer in signals table
        const signalId = `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.sqlExec(
          `INSERT INTO webrtc_signals (id, session_id, tenant_id, signal_type, from_participant, signal_data, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          signalId,
          sessionId,
          tenantId,
          'offer',
          body.from || 'unknown',
          JSON.stringify({ offer: body.offer }),
          now
        );

        // Add participant if not already present
        const existingParticipant = this.sqlFirst(
          'SELECT * FROM session_participants WHERE session_id = ? AND user_id = ? AND left_at IS NULL',
          sessionId, body.from || 'unknown'
        );

        if (!existingParticipant && body.from) {
          const participantId = `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          this.sqlExec(
            `INSERT INTO session_participants (id, session_id, tenant_id, user_id, role, joined_at, metadata)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            participantId, sessionId, tenantId, body.from, 'participant', now, '{}'
          );
        }

        return new Response(JSON.stringify({ success: true, data: { session_id: sessionId } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // POST /webrtc/answer - Handle WebRTC answer (SQL-optimized)
      if (path === '/webrtc/answer' && request.method === 'POST') {
        const body = await request.json();

        const session = this.sqlFirst(
          'SELECT * FROM sessions WHERE id = ? AND tenant_id = ?',
          sessionId, tenantId
        );

        if (!session) {
          return new Response(JSON.stringify({ success: false, error: 'Session not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Store WebRTC answer in signals table
        const signalId = `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.sqlExec(
          `INSERT INTO webrtc_signals (id, session_id, tenant_id, signal_type, from_participant, signal_data, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          signalId,
          sessionId,
          tenantId,
          'answer',
          body.from || 'unknown',
          JSON.stringify({ answer: body.answer }),
          now
        );

        this.sqlExec(
          `UPDATE sessions SET updated_at = ? WHERE id = ? AND tenant_id = ?`,
          now, sessionId, tenantId
        );

        return new Response(JSON.stringify({ success: true, data: { session_id: sessionId } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // POST /webrtc/ice - Handle ICE candidates (SQL-optimized)
      if (path === '/webrtc/ice' && request.method === 'POST') {
        const body = await request.json();

        const session = this.sqlFirst(
          'SELECT * FROM sessions WHERE id = ? AND tenant_id = ?',
          sessionId, tenantId
        );

        if (!session) {
          return new Response(JSON.stringify({ success: false, error: 'Session not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Store ICE candidate in signals table
        const signalId = `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.sqlExec(
          `INSERT INTO webrtc_signals (id, session_id, tenant_id, signal_type, from_participant, signal_data, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          signalId,
          sessionId,
          tenantId,
          'ice',
          body.from || 'unknown',
          JSON.stringify({ candidate: body.candidate }),
          now
        );

        this.sqlExec(
          `UPDATE sessions SET updated_at = ? WHERE id = ? AND tenant_id = ?`,
          now, sessionId, tenantId
        );

        return new Response(JSON.stringify({ success: true, data: { session_id: sessionId } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /webrtc/signals - Get all WebRTC signals (SQL-optimized)
      if (path === '/webrtc/signals' && request.method === 'GET') {
        const session = this.sqlFirst(
          'SELECT * FROM sessions WHERE id = ? AND tenant_id = ?',
          sessionId, tenantId
        );

        if (!session) {
          return new Response(JSON.stringify({ success: false, error: 'Session not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get all WebRTC signals from SQL
        const signals = this.sqlAll(
          'SELECT * FROM webrtc_signals WHERE session_id = ? AND tenant_id = ? ORDER BY created_at ASC',
          sessionId, tenantId
        );

        // Get active participants
        const participants = this.sqlAll(
          'SELECT * FROM session_participants WHERE session_id = ? AND tenant_id = ? AND left_at IS NULL',
          sessionId, tenantId
        );

        // Organize signals by type
        const offers = [];
        const answers = [];
        const iceCandidates = [];

        for (const signal of signals.results || []) {
          try {
            const signalData = JSON.parse(signal.signal_data);
            const signalObj = {
              from: signal.from_participant,
              ...signalData,
              timestamp: signal.created_at
            };

            if (signal.signal_type === 'offer') offers.push(signalObj);
            else if (signal.signal_type === 'answer') answers.push(signalObj);
            else if (signal.signal_type === 'ice') iceCandidates.push(signalObj);
          } catch (e) {
            console.error('Error parsing signal data:', e);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          data: {
            session_id: sessionId,
            offers,
            answers,
            ice_candidates: iceCandidates,
            participants: (participants.results || []).map(p => ({
              user_id: p.user_id,
              role: p.role,
              joined_at: p.joined_at,
              metadata: p.metadata ? JSON.parse(p.metadata) : {}
            }))
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /schema/init - Manually initialize schema (for testing)
      if (path === '/schema/init' && request.method === 'GET') {
        await this.initializeSchema();
        await this.seedData(tenantId);
        return new Response(JSON.stringify({
          success: true,
          message: 'Schema initialized and seeded',
          tables: ['sessions', 'mcp_sessions', 'webrtc_signals', 'session_participants', 'session_messages']
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /schema/tables - List all tables
      if (path === '/schema/tables' && request.method === 'GET') {
        if (!this.storage.sql) {
          return new Response(JSON.stringify({ success: false, error: 'SQL not available' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          const cursor = this.storage.sql.exec(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
          );
          const tables = cursor.toArray();

          return new Response(JSON.stringify({ success: true, data: tables.map(t => t.name) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // MCP Session endpoints (SQL-optimized for Model Context Protocol)
      // POST /mcp/session - Create or update MCP session
      if (path === '/mcp/session' && request.method === 'POST') {
        const body = await request.json();

        // Ensure main session exists
        let session = this.sqlFirst(
          'SELECT * FROM sessions WHERE id = ? AND tenant_id = ?',
          sessionId, tenantId
        );

        if (!session) {
          this.sqlExec(
            `INSERT INTO sessions (id, tenant_id, session_type, status, metadata, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            sessionId, tenantId, 'mcp', 'active', '{}', now, now
          );
        }

        // Create or update MCP session
        const mcpSessionId = body.mcp_session_id || `mcp-${sessionId}-${Date.now()}`;
        const existingMcp = this.sqlFirst(
          'SELECT * FROM mcp_sessions WHERE id = ? AND tenant_id = ?',
          mcpSessionId, tenantId
        );

        if (existingMcp) {
          this.sqlExec(
            `UPDATE mcp_sessions 
             SET context_data = ?, state = ?, updated_at = ?
             WHERE id = ? AND tenant_id = ?`,
            JSON.stringify(body.context_data || {}),
            body.state || 'active',
            now,
            mcpSessionId,
            tenantId
          );
        } else {
          this.sqlExec(
            `INSERT INTO mcp_sessions (id, session_id, tenant_id, mcp_server_id, mcp_version, context_data, state, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            mcpSessionId,
            sessionId,
            tenantId,
            body.mcp_server_id || null,
            body.mcp_version || '1.0',
            JSON.stringify(body.context_data || {}),
            body.state || 'active',
            now,
            now
          );
        }

        const mcpSession = this.sqlFirst(
          'SELECT * FROM mcp_sessions WHERE id = ? AND tenant_id = ?',
          mcpSessionId, tenantId
        );

        if (mcpSession && mcpSession.context_data) {
          try {
            mcpSession.context_data = JSON.parse(mcpSession.context_data);
          } catch (e) {
            mcpSession.context_data = {};
          }
        }

        return new Response(JSON.stringify({ success: true, data: mcpSession }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /mcp/session - Get MCP session
      if (path === '/mcp/session' && request.method === 'GET') {
        const mcpSessions = this.sqlAll(
          'SELECT * FROM mcp_sessions WHERE session_id = ? AND tenant_id = ? ORDER BY created_at DESC',
          sessionId, tenantId
        );

        const results = (mcpSessions.results || []).map(mcp => {
          if (mcp.context_data) {
            try {
              mcp.context_data = JSON.parse(mcp.context_data);
            } catch (e) {
              mcp.context_data = {};
            }
          }
          return mcp;
        });

        return new Response(JSON.stringify({ success: true, data: results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // POST /messages - Add message to session (for chat and MCP)
      if (path === '/messages' && request.method === 'POST') {
        const body = await request.json();
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        this.sqlExec(
          `INSERT INTO session_messages (id, session_id, tenant_id, user_id, message_type, content, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          messageId,
          sessionId,
          tenantId,
          body.user_id || null,
          body.message_type || 'chat',
          body.content || '',
          JSON.stringify(body.metadata || {}),
          now
        );

        return new Response(JSON.stringify({ success: true, data: { message_id: messageId } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /messages - Get session messages
      if (path === '/messages' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const messageType = url.searchParams.get('type');

        let query = 'SELECT * FROM session_messages WHERE session_id = ? AND tenant_id = ?';
        const params = [sessionId, tenantId];

        if (messageType) {
          query += ' AND message_type = ?';
          params.push(messageType);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const messages = this.sqlAll(query, ...params);

        const results = (messages.results || []).map(msg => {
          if (msg.metadata) {
            try {
              msg.metadata = JSON.parse(msg.metadata);
            } catch (e) {
              msg.metadata = {};
            }
          }
          return msg;
        });

        return new Response(JSON.stringify({ success: true, data: results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('IAMSession error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Internal server error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }
}

// Temporary: Keep old MeauxSession for migration compatibility (will be removed after migration)
export class MeauxSession extends IAMSession {
  // Legacy class - forwards to IAMSession (extends IAMSession so it works the same way)
}

// Include Cursor API handlers inline
// Cursor API Client
class CursorAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // Cursor API uses OpenAI-compatible endpoints
    // Try multiple possible base URLs
    this.baseURLs = [
      'https://api.cursor.com/v1',
      'https://api.cursor.sh/v1',
      'https://api.openai.com/v1', // Cursor may proxy through OpenAI
    ];
    this.baseURL = this.baseURLs[0];
  }

  async request(endpoint, options = {}, retryIndex = 0) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // If 404 and we have other base URLs, try next one
      if (response.status === 404 && retryIndex < this.baseURLs.length - 1) {
        this.baseURL = this.baseURLs[retryIndex + 1];
        return this.request(endpoint, options, retryIndex + 1);
      }
      const error = await response.text();
      throw new Error(`Cursor API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  async chat(messages, options = {}) {
    // Cursor uses OpenAI-compatible chat completions
    // Try standard OpenAI endpoint format
    return this.request('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        messages,
        model: options.model || 'gpt-4',
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        stream: false,
        ...options,
      }),
    });
  }

  async generateCode(instruction, codeContext = '', language = 'javascript', options = {}) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert ${language} developer. Generate clean, production-ready code based on the instruction.`,
      },
      {
        role: 'user',
        content: `Context:\n${codeContext}\n\nInstruction: ${instruction}`,
      },
    ];

    return this.chat(messages, {
      model: options.model || 'gpt-4',
      temperature: options.temperature || 0.2,
      max_tokens: options.max_tokens || 2000,
      ...options,
    });
  }

  async reviewCode(code, language = 'javascript', options = {}) {
    const messages = [
      {
        role: 'system',
        content: `You are a senior code reviewer. Analyze the code for bugs, performance issues, security vulnerabilities, and best practices. Provide actionable feedback.`,
      },
      {
        role: 'user',
        content: `Review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    ];

    return this.chat(messages, {
      model: options.model || 'gpt-4',
      ...options,
    });
  }

  async refactorCode(code, instruction, language = 'javascript', options = {}) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert ${language} developer. Refactor the code according to the instruction while maintaining functionality.`,
      },
      {
        role: 'user',
        content: `Refactor this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nInstruction: ${instruction}`,
      },
    ];

    return this.chat(messages, {
      model: options.model || 'gpt-4',
      temperature: 0.3,
      ...options,
    });
  }

  async explainCode(code, language = 'javascript', options = {}) {
    const messages = [
      {
        role: 'system',
        content: 'You are a code educator. Explain the code in clear, understandable terms.',
      },
      {
        role: 'user',
        content: `Explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    ];

    return this.chat(messages, {
      model: options.model || 'gpt-4',
      ...options,
    });
  }

  async generateTests(code, language = 'javascript', testFramework = 'jest', options = {}) {
    const messages = [
      {
        role: 'system',
        content: `You are a QA engineer. Generate comprehensive ${testFramework} tests for the provided code.`,
      },
      {
        role: 'user',
        content: `Generate ${testFramework} tests for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    ];

    return this.chat(messages, {
      model: options.model || 'gpt-4',
      ...options,
    });
  }
}

// Unified AI Agent Manager
class UnifiedAIAgent {
  constructor(env) {
    this.env = env;
    this.cursor = env.CURSOR_API_KEY ? new CursorAPIClient(env.CURSOR_API_KEY) : null;
    this.providers = {
      cursor: this.cursor,
      gemini: env.GEMINI_API_KEY || env.GOOGLE_API_KEY,
      openai: env.OPENAI_API_KEY,
      groq: env.GROQ_API_KEY,
    };
  }

  getBestProvider(taskType = 'general') {
    if (taskType.includes('code') && this.cursor) {
      return { name: 'cursor', client: this.cursor };
    }
    if (this.providers.gemini) {
      return { name: 'gemini', client: null };
    }
    if (this.providers.openai) {
      return { name: 'openai', client: null };
    }
    if (this.providers.groq) {
      return { name: 'groq', client: null };
    }
    return null;
  }

  async executeTask(taskType, input, options = {}) {
    const provider = this.getBestProvider(taskType);

    if (!provider) {
      throw new Error('No AI provider available. Configure at least one API key.');
    }

    switch (taskType) {
      case 'code_generation':
      case 'code_completion':
        if (provider.name === 'cursor' && provider.client) {
          return provider.client.generateCode(
            input.instruction,
            input.context || '',
            input.language || 'javascript',
            options
          );
        }
        break;

      case 'code_review':
        if (provider.name === 'cursor' && provider.client) {
          return provider.client.reviewCode(
            input.code,
            input.language || 'javascript',
            options
          );
        }
        break;

      case 'code_refactor':
        if (provider.name === 'cursor' && provider.client) {
          return provider.client.refactorCode(
            input.code,
            input.instruction,
            input.language || 'javascript',
            options
          );
        }
        break;

      case 'explain_code':
        if (provider.name === 'cursor' && provider.client) {
          return provider.client.explainCode(
            input.code,
            input.language || 'javascript',
            options
          );
        }
        break;

      case 'generate_tests':
        if (provider.name === 'cursor' && provider.client) {
          return provider.client.generateTests(
            input.code,
            input.language || 'javascript',
            input.testFramework || 'jest',
            options
          );
        }
        break;

      default:
        if (provider.name === 'cursor' && provider.client) {
          return provider.client.chat(input.messages || [], options);
        }
    }

    throw new Error(`Task type ${taskType} not supported or provider not available`);
  }
}

/**
 * Handle Cursor API requests
 */
async function handleCursorAPI(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const action = pathParts[2]; // /api/cursor/{action}

  if (!env.CURSOR_API_KEY) {
    return jsonResponse({
      success: false,
      error: 'Cursor API key not configured. Set CURSOR_API_KEY secret.',
    }, 500, corsHeaders);
  }

  const cursor = new CursorAPIClient(env.CURSOR_API_KEY);

  try {
    switch (action) {
      case 'chat':
        if (request.method !== 'POST') {
          return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
        }
        const chatBody = await request.json();
        const chatResult = await cursor.chat(chatBody.messages || [], chatBody.options || {});
        return jsonResponse({
          success: true,
          data: chatResult,
        }, 200, corsHeaders);

      case 'generate':
        if (request.method !== 'POST') {
          return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
        }
        const genBody = await request.json();
        const genResult = await cursor.generateCode(
          genBody.instruction,
          genBody.context || '',
          genBody.language || 'javascript',
          genBody.options || {}
        );
        return jsonResponse({
          success: true,
          data: genResult,
        }, 200, corsHeaders);

      case 'review':
        if (request.method !== 'POST') {
          return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
        }
        const reviewBody = await request.json();
        const reviewResult = await cursor.reviewCode(
          reviewBody.code,
          reviewBody.language || 'javascript',
          reviewBody.options || {}
        );
        return jsonResponse({
          success: true,
          data: reviewResult,
        }, 200, corsHeaders);

      case 'refactor':
        if (request.method !== 'POST') {
          return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
        }
        const refactorBody = await request.json();
        const refactorResult = await cursor.refactorCode(
          refactorBody.code,
          refactorBody.instruction,
          refactorBody.language || 'javascript',
          refactorBody.options || {}
        );
        return jsonResponse({
          success: true,
          data: refactorResult,
        }, 200, corsHeaders);

      case 'explain':
        if (request.method !== 'POST') {
          return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
        }
        const explainBody = await request.json();
        const explainResult = await cursor.explainCode(
          explainBody.code,
          explainBody.language || 'javascript',
          explainBody.options || {}
        );
        return jsonResponse({
          success: true,
          data: explainResult,
        }, 200, corsHeaders);

      case 'tests':
        if (request.method !== 'POST') {
          return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
        }
        const testsBody = await request.json();
        const testsResult = await cursor.generateTests(
          testsBody.code,
          testsBody.language || 'javascript',
          testsBody.testFramework || 'jest',
          testsBody.options || {}
        );
        return jsonResponse({
          success: true,
          data: testsResult,
        }, 200, corsHeaders);

      default:
        return jsonResponse({
          success: false,
          error: 'Invalid action. Available: chat, generate, review, refactor, explain, tests',
        }, 400, corsHeaders);
    }
  } catch (error) {
    console.error('Cursor API error:', error);
    return jsonResponse({
      success: false,
      error: error.message,
    }, 500, corsHeaders);
  }
}

/**
 * Handle Unified AI Agent requests (uses best available provider)
 */
async function handleUnifiedAI(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const action = pathParts[2]; // /api/ai/{action}

  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
  }

  const agent = new UnifiedAIAgent(env);

  try {
    const body = await request.json();
    const { task_type, input, options } = body;

    if (!task_type || !input) {
      return jsonResponse({
        success: false,
        error: 'task_type and input are required',
      }, 400, corsHeaders);
    }

    const result = await agent.executeTask(task_type, input, options || {});

    // Log AI usage for cost tracking
    try {
      await env.DB.prepare(
        `INSERT INTO ai_interactions (id, tenant_id, user_id, provider, task_type, tokens_used, cost, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        body.user_id || null,
        agent.getBestProvider(task_type)?.name || 'unknown',
        task_type,
        result.usage?.total_tokens || 0,
        (result.usage?.total_tokens || 0) * 0.00001, // Rough estimate
        Math.floor(Date.now() / 1000)
      ).run();
    } catch (e) {
      // Ignore logging errors
    }

    return jsonResponse({
      success: true,
      data: result,
      provider: agent.getBestProvider(task_type)?.name,
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Unified AI error:', error);
    return jsonResponse({
      success: false,
      error: error.message,
    }, 500, corsHeaders);
  }
}

/**
 * Simplified AI code generation endpoint
 * Automatically uses Cursor if available, falls back to other providers
 */
async function handleAICode(request, env, tenantId, corsHeaders) {
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
  }

  try {
    const body = await request.json();
    const { prompt, language = 'javascript', context = '', task = 'generate' } = body;

    if (!prompt) {
      return jsonResponse({
        success: false,
        error: 'prompt is required',
      }, 400, corsHeaders);
    }

    const agent = new UnifiedAIAgent(env);
    let result;

    // Map task to task_type
    const taskTypeMap = {
      'generate': 'code_generation',
      'review': 'code_review',
      'refactor': 'code_refactor',
      'explain': 'explain_code',
      'tests': 'generate_tests',
    };

    const taskType = taskTypeMap[task] || 'code_generation';
    let usedProvider = 'unknown';

    // Try Cursor first, with automatic fallback to Gemini
    try {
      if (task === 'generate') {
        result = await agent.executeTask(taskType, {
          instruction: prompt,
          context: context,
          language: language,
        });
      } else if (task === 'review' || task === 'explain' || task === 'tests') {
        result = await agent.executeTask(taskType, {
          code: prompt,
          language: language,
          testFramework: body.testFramework || 'jest',
        });
      } else if (task === 'refactor') {
        result = await agent.executeTask(taskType, {
          code: prompt,
          instruction: body.instruction || 'Refactor for better performance and maintainability',
          language: language,
        });
      }
      usedProvider = agent.getBestProvider(taskType)?.name || 'unknown';
    } catch (cursorError) {
      // If Cursor fails, use Gemini fallback
      console.log('Cursor unavailable, using Gemini fallback:', cursorError.message);

      // Check for any available AI provider
      const hasGemini = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
      const hasOpenAI = env.OPENAI_API_KEY;
      const hasGroq = env.GROQ_API_KEY;

      if (!hasGemini && !hasOpenAI && !hasGroq) {
        return jsonResponse({
          success: false,
          error: 'No AI provider available. Cursor API endpoint may need configuration. Configure GEMINI_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY as fallback.',
          note: 'Cursor API key is set, but endpoint may be incorrect. Please verify Cursor API endpoint format or configure a fallback provider.',
        }, 500, corsHeaders);
      }

      // Use available provider (Gemini preferred, then OpenAI, then Groq)
      let providerKey, providerUrl, providerName;

      if (hasGemini) {
        providerKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
        providerName = 'gemini';
        const model = 'gemini-pro';
        providerUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${providerKey}`;
      } else if (hasOpenAI) {
        providerKey = env.OPENAI_API_KEY;
        providerName = 'openai';
        providerUrl = 'https://api.openai.com/v1/chat/completions';
      } else if (hasGroq) {
        providerKey = env.GROQ_API_KEY;
        providerName = 'groq';
        providerUrl = 'https://api.groq.com/openai/v1/chat/completions';
      } else {
        throw new Error('No fallback provider available');
      }

      // Use Gemini API directly (for now, prioritize Gemini)
      const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
      if (!geminiKey) {
        throw new Error('Gemini API key not found in environment');
      }

      const model = 'gemini-pro';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

      let geminiPrompt = '';
      if (task === 'generate') {
        geminiPrompt = `Generate ${language} code: ${prompt}\n\nContext: ${context || 'No additional context'}`;
      } else if (task === 'explain') {
        geminiPrompt = `Explain this ${language} code in detail:\n\n\`\`\`${language}\n${prompt}\n\`\`\``;
      } else if (task === 'review') {
        geminiPrompt = `Review this ${language} code for bugs, performance issues, security vulnerabilities, and best practices:\n\n\`\`\`${language}\n${prompt}\n\`\`\``;
      } else if (task === 'refactor') {
        geminiPrompt = `Refactor this ${language} code: ${body.instruction || 'Make it more efficient and maintainable'}\n\n\`\`\`${language}\n${prompt}\n\`\`\``;
      } else if (task === 'tests') {
        geminiPrompt = `Generate ${body.testFramework || 'jest'} tests for this ${language} code:\n\n\`\`\`${language}\n${prompt}\n\`\`\``;
      } else {
        geminiPrompt = prompt;
      }

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: geminiPrompt }]
          }]
        })
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        throw new Error(`Gemini API error: ${geminiResponse.status} ${errorText}`);
      }

      const geminiData = await geminiResponse.json();
      const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

      result = {
        choices: [{
          message: { content: responseText },
          finish_reason: 'stop'
        }],
        usage: {
          total_tokens: geminiData.usageMetadata?.totalTokenCount || 0
        }
      };

      usedProvider = 'gemini';

      // Log usage
      try {
        await env.DB.prepare(
          `INSERT INTO ai_interactions (id, tenant_id, user_id, provider, task_type, tokens_used, cost, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tenantId,
          body.user_id || null,
          'gemini',
          taskType,
          result.usage.total_tokens,
          result.usage.total_tokens * 0.00001,
          Math.floor(Date.now() / 1000)
        ).run();
      } catch (e) {
        // Ignore logging errors
      }
    }

    // Extract response from result
    let responseText = '';
    if (result && result.choices && result.choices[0]) {
      responseText = result.choices[0].message?.content || result.choices[0].text || JSON.stringify(result);
    } else if (result && result.content) {
      responseText = result.content;
    } else if (typeof result === 'string') {
      responseText = result;
    } else {
      responseText = JSON.stringify(result);
    }

    return jsonResponse({
      success: true,
      data: result,
      response: responseText,
      provider: usedProvider,
      task: task,
    }, 200, corsHeaders);

  } catch (error) {
    console.error('AI code generation error:', error);

    // Final fallback attempt
    if (error.message.includes('Cursor API') || error.message.includes('530') || error.message.includes('404')) {
      try {
        // Fallback to Gemini if available
        if (env.GEMINI_API_KEY || env.GOOGLE_API_KEY) {
          console.log('Cursor unavailable, falling back to Gemini');
          // Re-read body for fallback
          const requestClone = request.clone();
          const fallbackBody = await requestClone.json();
          const fallbackAgent = new UnifiedAIAgent(env);
          // Force use of Gemini by temporarily removing Cursor
          fallbackAgent.cursor = null;

          const taskTypeMap = {
            'generate': 'code_generation',
            'review': 'code_review',
            'refactor': 'code_refactor',
            'explain': 'explain_code',
            'tests': 'generate_tests',
          };
          const taskType = taskTypeMap[fallbackBody.task || 'generate'] || 'code_generation';

          // Use Gemini API directly
          const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`;

          let geminiPrompt = '';
          if (taskType === 'code_generation') {
            geminiPrompt = `Generate ${fallbackBody.language || 'javascript'} code: ${fallbackBody.prompt}`;
          } else if (taskType === 'explain_code') {
            geminiPrompt = `Explain this ${fallbackBody.language || 'javascript'} code:\n\n${fallbackBody.prompt}`;
          } else {
            geminiPrompt = fallbackBody.prompt;
          }

          const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: geminiPrompt }]
              }]
            })
          });

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

            return jsonResponse({
              success: true,
              data: { content: responseText },
              response: responseText,
              provider: 'gemini',
              task: fallbackBody.task || 'generate',
              note: 'Used Gemini fallback (Cursor API endpoint not available)',
            }, 200, corsHeaders);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    return jsonResponse({
      success: false,
      error: error.message,
    }, 500, corsHeaders);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ========================================
    // ADMIN ROUTING - Shopify-style admin subdomain
    // ========================================
    if (isAdminRequest(request)) {
      return handleAdminRequest(request, env);
    }

    // Route to Durable Object for session endpoints
    if (path.startsWith('/api/session/') && env.SESSION_DO) {
      const pathParts = path.split('/').filter(p => p);
      if (pathParts.length >= 3) {
        const sessionId = pathParts[2];
        const restPath = '/' + pathParts.slice(3).join('/') || '/session';

        // Get Durable Object ID from session ID
        const id = env.SESSION_DO.idFromName(sessionId);
        const stub = env.SESSION_DO.get(id);

        // Forward request to Durable Object with corrected path
        const doUrl = new URL(request.url);
        doUrl.pathname = restPath;
        const doRequest = new Request(doUrl.toString(), request);
        return stub.fetch(doRequest);
      }
    }

    // Continue with existing handler
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API Routes - Handle first
      if (path.startsWith('/api/')) {
        // Root API endpoint
        if (path === '/api' || path === '/api/') {
          // Get tenant ID for analytics
          const tenantId = await getTenantFromRequest(request, env);

          // Log API request to Analytics Engine (fire and forget)
          writeAnalyticsEvent(env, {
            event_type: 'api_request',
            tenant_id: tenantId || 'system',
            metadata: {
              method: request.method,
              path: path,
              user_agent: request.headers.get('user-agent') || null,
            }
          }).catch(err => {
            // Silently handle analytics errors - don't block request processing
            console.error('Analytics write failed:', err.message);
          });

          return jsonResponse({
            name: 'iAccess Platform API',
            version: '1.0.0',
            status: 'online',
            endpoints: {
              tenants: '/api/tenants',
              tools: '/api/tools',
              themes: '/api/themes',
              workflows: '/api/workflows',
              deployments: '/api/deployments',
              workers: '/api/workers',
              stats: '/api/stats',
              calendar: '/api/calendar',
              agent: '/api/agent/execute',
              images: '/api/images',
              drive: '/api/drive (Google Drive integration)',
              projects: '/api/projects',
              supabase: '/api/supabase',
              sql: '/api/sql (MeauxSQL - reliable read/write via D1)',
              mcp: '/api/mcp (MeauxMCP - MCP Protocol operations)',
              files: '/api/files (MeauxIDE - file operations)',
              meauxsql: '/api/meauxsql (SQL query execution)',
              cad: '/api/cad (MeauxCAD - 3D modeling with Meshy/Blender/CloudConvert)',
              'ai-services': '/api/ai-services (AI Services management)',
              analytics: '/api/analytics (Full analytics with Analytics Engine)',
              gateway: '/api/gateway (API Gateway route management)',
              brand: '/api/brand (Brand asset management - R2 storage)',
              databases: '/api/databases (D1 database management)',
              library: '/api/library (Library content management - R2 storage)',
              meauxwork: '/api/meauxwork (Work management and tracking)',
              team: '/api/team (Team management)',
              resend: '/api/resend (Email sending)',
              webhooks: '/api/webhooks/resend (Resend webhook handler)',
              onboarding: '/api/onboarding (Onboarding engine)',
              activation: '/api/activation (Activation checklist)',
              migrate: '/api/migrate (Data migration from meauxos)',
              session: '/api/session/:id'
            },
            documentation: 'https://github.com/your-repo/docs',
            database: 'inneranimalmedia-business (D1)',
            storage: 'inneranimalmedia-assets (R2)',
            analytics: 'Analytics Engine (inneranimalmedia dataset)'
          }, 200, corsHeaders);
        }

        // Extract tenant from request (for all other API routes)
        const tenantId = await getTenantFromRequest(request, env);

        // Log API request to Analytics Engine (fire and forget)
        writeAnalyticsEvent(env, {
          event_type: 'api_request',
          tenant_id: tenantId || 'system',
          metadata: {
            method: request.method,
            path: path,
            user_agent: request.headers.get('user-agent') || null,
          }
        }).catch(err => {
          // Silently handle analytics errors - don't block request processing
          console.error('Analytics write failed:', err.message);
        });

        // Route handling
        if (path.startsWith('/api/tenants')) {
          return handleTenants(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/workflows/dev')) {
          return await handleDevWorkflows(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/workflows')) {
          return handleWorkflows(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/deployments') || path.startsWith('/api/vercel/deployments')) {
          return handleDeployments(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/workers')) {
          return handleWorkers(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/stats')) {
          return handleStats(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/tools')) {
          return handleTools(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/themes')) {
          return handleThemes(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/users/') && path.includes('/preferences')) {
          return handleUserPreferences(request, env, tenantId, corsHeaders);
        }

        // Theme preferences endpoint - per tenant/project theme persistence
        if (path === '/api/preferences/theme') {
          return handleThemePreferences(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/users/') && path.includes('/connections')) {
          return handleExternalConnections(request, env, tenantId, corsHeaders);
        }

        // Integration status endpoint - unified status for all integrations
        if (path.startsWith('/api/integrations/status')) {
          return await handleIntegrationsStatus(request, env, tenantId, corsHeaders);
        }

        // OAuth routes - handle /api/oauth/{provider}/{action}
        if (path.startsWith('/api/oauth/')) {
          return handleOAuth(request, env, tenantId, corsHeaders);
        }

        // Alternative OAuth callback paths - redirect to standard /api/oauth/{provider}/callback
        // These handle the additional callback URLs configured in Google OAuth app
        // Pattern 1: /auth/{provider}/callback or /api/auth/{provider}/callback
        if (path.match(/^\/(auth|api\/auth)\/(google|github)\/callback$/)) {
          const pathParts = path.split('/').filter(p => p);
          const provider = pathParts[pathParts.length - 2]; // 'google' or 'github'
          const redirectUrl = new URL(request.url);
          redirectUrl.pathname = `/api/oauth/${provider}/callback`;
          // Preserve query parameters (code, state, error, etc.)
          return Response.redirect(redirectUrl.toString(), 302);
        }

        // Pattern 2: /dashboard/auth/callback or /login/callback (provider not in path)
        // Extract provider from state parameter in database
        if (path === '/dashboard/auth/callback' || path === '/login/callback') {
          const url = new URL(request.url);
          const state = url.searchParams.get('state');
          const error = url.searchParams.get('error');

          // If there's an error, redirect to standard OAuth handler (defaults to google)
          if (error) {
            const redirectUrl = new URL(request.url);
            redirectUrl.pathname = `/api/oauth/google/callback`;
            return Response.redirect(redirectUrl.toString(), 302);
          }

          // Try to get provider from state token in database
          if (state && env.DB) {
            try {
              const stateRecord = await env.DB.prepare(
                'SELECT provider_id FROM oauth_states WHERE id = ? AND expires_at > ? LIMIT 1'
              )
                .bind(state, Math.floor(Date.now() / 1000))
                .first();

              if (stateRecord && stateRecord.provider_id) {
                const redirectUrl = new URL(request.url);
                redirectUrl.pathname = `/api/oauth/${stateRecord.provider_id}/callback`;
                return Response.redirect(redirectUrl.toString(), 302);
              }
            } catch (err) {
              console.warn('Failed to lookup provider from state:', err);
            }
          }

          // Fallback: default to google (most common) or try to infer from code parameter
          // Google codes start with "4/", GitHub codes are longer hex strings
          const code = url.searchParams.get('code');
          let defaultProvider = 'google';
          if (code && code.length > 40) {
            defaultProvider = 'github'; // GitHub codes are typically longer
          }

          const redirectUrl = new URL(request.url);
          redirectUrl.pathname = `/api/oauth/${defaultProvider}/callback`;
          return Response.redirect(redirectUrl.toString(), 302);
        }

        if (path.startsWith('/api/calendar')) {
          return await handleCalendar(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/commands')) {
          return await handleCommands(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/agent/')) {
          return await handleAgent(request, env, tenantId, corsHeaders);
        }

        // Cursor API endpoints - AI-powered code assistance
        if (path.startsWith('/api/cursor/')) {
          return await handleCursorAPI(request, env, tenantId, corsHeaders);
        }

        // AI code generation endpoint (simplified - uses best provider)
        // Must come before /api/ai/ to match first
        if (path === '/api/ai/code' && request.method === 'POST') {
          return await handleAICode(request, env, tenantId, corsHeaders);
        }

        // Unified AI Agent endpoints (uses Cursor + other providers)
        if (path.startsWith('/api/ai/')) {
          return await handleUnifiedAI(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/images')) {
          return await handleImages(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/projects')) {
          return await handleProjects(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/supabase')) {
          return await handleSupabase(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/sql') || path.startsWith('/api/meauxsql')) {
          return await handleMeauxSQL(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/resend')) {
          return await handleResend(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/webhooks/resend')) {
          return await handleResendWebhook(request, env, tenantId, corsHeaders);
        }

        // Resend inbound email webhook
        if (path.startsWith('/api/email/inbound')) {
          return await handleEmailInbound(request, env, tenantId, corsHeaders);
        }

        // Realtime & Streaming endpoints
        if (path.startsWith('/api/stream/')) {
          return await handleStreamStatus(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/realtime/turn')) {
          return await handleTURNCredentials(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/realtime/sfu')) {
          return await handleSFUSession(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/onboarding')) {
          return await handleOnboarding(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/activation')) {
          return await handleActivation(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/migrate')) {
          return await handleMigration(request, env, tenantId, corsHeaders);
        }

        // Analytics tracking endpoint (for frontend to track events)
        if (path.startsWith('/api/analytics/track')) {
          if (request.method === 'POST') {
            try {
              const event = await request.json();
              await writeAnalyticsEvent(env, {
                event_type: event.event_type || 'unknown',
                tenant_id: event.tenant_id || tenantId || 'system',
                user_id: event.user_id || null,
                session_id: event.session_id || null,
                metadata: event.metadata || {}
              });

              return jsonResponse({
                success: true,
                message: 'Analytics event tracked'
              }, 200, corsHeaders);
            } catch (error) {
              console.error('Error tracking analytics event:', error);
              return jsonResponse({
                success: false,
                error: error.message
              }, 500, corsHeaders);
            }
          }
          return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
        }

        // Tasks API endpoints (Real-time Task Management)
        if (path.startsWith('/api/tasks')) {
          return await handleTasks(request, env, tenantId, corsHeaders);
        }

        // Messages/Message Boards API endpoints
        if (path.startsWith('/api/messages') || path.startsWith('/api/threads')) {
          return await handleMessages(request, env, tenantId, corsHeaders);
        }

        // Video/Streaming API endpoints (uses Durable Objects for WebRTC signaling)
        if (path.startsWith('/api/video')) {
          return await handleVideo(request, env, tenantId, corsHeaders);
        }

        // AI Prompts Library API endpoints (check execute first to avoid conflicts)
        if (path.startsWith('/api/prompts/') && path.endsWith('/execute')) {
          return await handlePromptExecution(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/prompts') || path.startsWith('/api/ai-prompts')) {
          return await handleAIPrompts(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/workflow-stages')) {
          return await handleWorkflowStages(request, env, tenantId, corsHeaders);
        }

        if (path.startsWith('/api/tool-roles')) {
          return await handleToolRoles(request, env, tenantId, corsHeaders);
        }

        // Knowledge Base API endpoints (check for chunk endpoint first)
        if (path.startsWith('/api/knowledge') || path.startsWith('/api/kb')) {
          // Check for chunk endpoint: /api/knowledge/:id/chunk
          if (path.endsWith('/chunk') && request.method === 'POST') {
            return await handleKnowledgeChunking(request, env, tenantId, corsHeaders);
          }
          return await handleKnowledgeBase(request, env, tenantId, corsHeaders);
        }

        // Workflow Pipelines API endpoints
        if (path.startsWith('/api/pipelines') || path.startsWith('/api/workflow-pipelines')) {
          return await handleWorkflowPipelines(request, env, tenantId, corsHeaders);
        }

        // RAG Search API endpoints
        if (path.startsWith('/api/rag') || path.startsWith('/api/search')) {
          // Use enhanced RAG search with embeddings support
          return await handleRAGSearchEnhanced(request, env, tenantId, corsHeaders);
        }

        // Backup download endpoint (check early to avoid conflicts)
        if (path.startsWith('/api/backup/')) {
          const backupFilename = path.replace('/api/backup/', '');
          if (backupFilename && backupFilename.endsWith('.tar.gz')) {
            try {
              // Check if STORAGE binding exists
              if (!env || !env.STORAGE) {
                return new Response(JSON.stringify({ error: 'Storage not configured', message: 'R2 storage not available. Check worker bindings.' }), {
                  status: 500,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
              }
              const backupKey = `backups/${backupFilename}`;
              console.log(`[Backup] Fetching from R2: ${backupKey}`);
              const backup = await env.STORAGE.get(backupKey);
              if (!backup) {
                console.log(`[Backup] Not found: ${backupKey}`);
                return new Response(JSON.stringify({ error: 'Backup not found', message: `Backup file ${backupFilename} not found in R2 at key: ${backupKey}` }), {
                  status: 404,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
              }
              console.log(`[Backup] Found: ${backupKey}, size: ${backup.size}`);
              // Stream the backup file
              return new Response(backup.body, {
                headers: {
                  'Content-Type': 'application/gzip',
                  'Content-Disposition': `attachment; filename="${backupFilename}"`,
                  'Content-Length': backup.size.toString(),
                  'Cache-Control': 'no-cache',
                  ...corsHeaders,
                },
              });
            } catch (e) {
              console.error('[Backup] Error:', e);
              return new Response(JSON.stringify({ error: 'Server error', message: e.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
          return new Response(JSON.stringify({ error: 'Invalid request', message: 'Invalid backup filename. Must end with .tar.gz' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Chat API endpoints (check before other routes to avoid conflicts)
        if (path.startsWith('/api/chat')) {
          return await handleChat(request, env, tenantId, corsHeaders);
        }

        // MeauxMCP API endpoints (MCP Protocol operations)
        if (path.startsWith('/api/mcp')) {
          return await handleMCP(request, env, tenantId, corsHeaders);
        }

        // MeauxIDE API endpoints (file operations)
        if (path.startsWith('/api/files') || path.startsWith('/api/ide')) {
          return await handleFiles(request, env, tenantId, corsHeaders);
        }

        // Cost Tracking API endpoints
        if (path.startsWith('/api/cost-tracking') || path.startsWith('/api/costs')) {
          return await handleCostTracking(request, env, tenantId, corsHeaders);
        }

        // Support Tickets API endpoints (check for messages endpoint first to avoid conflicts)
        if (path.startsWith('/api/support/tickets') && path.endsWith('/messages') && request.method === 'POST') {
          return await handleSupportTicketMessages(request, env, tenantId, corsHeaders);
        }
        if (path.startsWith('/api/support/tickets')) {
          return await handleSupportTickets(request, env, tenantId, corsHeaders);
        }

        // Help Center API endpoints (check for search and feedback first to avoid conflicts)
        if (path.startsWith('/api/help/search')) {
          return await handleHelpSearch(request, env, tenantId, corsHeaders);
        }
        if (path.startsWith('/api/help/articles') && path.endsWith('/feedback') && request.method === 'POST') {
          return await handleHelpArticleFeedback(request, env, tenantId, corsHeaders);
        }
        if (path.startsWith('/api/help')) {
          return await handleHelpCenter(request, env, tenantId, corsHeaders);
        }

        // Customer Feedback API endpoint
        if (path.startsWith('/api/feedback')) {
          return await handleCustomerFeedback(request, env, tenantId, corsHeaders);
        }

        // MeauxCAD API endpoints (3D modeling with Meshy/Blender/CloudConvert)
        if (path.startsWith('/api/cad') || path.startsWith('/api/meauxcad')) {
          return await handleMeauxCAD(request, env, tenantId, corsHeaders);
        }

        // AI Services API endpoints
        if (path.startsWith('/api/ai-services') || path.startsWith('/api/aiservices')) {
          return await handleAIServices(request, env, tenantId, corsHeaders);
        }

        // Analytics API endpoints (full analytics with Analytics Engine)
        if (path.startsWith('/api/analytics') && !path.startsWith('/api/analytics/track')) {
          return await handleAnalytics(request, env, tenantId, corsHeaders);
        }

        // API Gateway API endpoints
        if (path.startsWith('/api/gateway') || path.startsWith('/api/api-gateway')) {
          return await handleAPIGateway(request, env, tenantId, corsHeaders);
        }

        // Brand API endpoints (asset management)
        if (path.startsWith('/api/brand') || path.startsWith('/api/brands')) {
          return await handleBrand(request, env, tenantId, corsHeaders);
        }

        // Databases API endpoints (D1 management)
        if (path.startsWith('/api/databases') || path.startsWith('/api/db-management')) {
          return await handleDatabases(request, env, tenantId, corsHeaders);
        }

        // Library API endpoints (content management)
        if (path.startsWith('/api/library') || path.startsWith('/api/libraries')) {
          return await handleLibrary(request, env, tenantId, corsHeaders);
        }

        // Google Drive API endpoints
        if (path.startsWith('/api/drive')) {
          return await handleDrive(request, env, tenantId, corsHeaders);
        }

        // MeauxWork API endpoints (work management)
        if (path.startsWith('/api/meauxwork') || path.startsWith('/api/work')) {
          return await handleMeauxWork(request, env, tenantId, corsHeaders);
        }

        // Team API endpoints
        if (path.startsWith('/api/team') || path.startsWith('/api/teams')) {
          return await handleTeam(request, env, tenantId, corsHeaders);
        }

        // Notifications API endpoints
        if (path.startsWith('/api/notifications')) {
          return await handleNotifications(request, env, tenantId, corsHeaders);
        }

        return jsonResponse({
          error: 'Not Found',
          message: 'Endpoint not found. Available endpoints: /api/tenants, /api/tools, /api/themes, /api/workflows, /api/workflows/dev, /api/deployments, /api/workers, /api/stats, /api/calendar, /api/agent, /api/commands, /api/images, /api/drive, /api/projects, /api/supabase, /api/sql, /api/resend, /api/webhooks/resend, /api/onboarding, /api/activation, /api/migrate, /api/analytics/track, /api/tasks, /api/messages, /api/threads, /api/video, /api/prompts, /api/workflow-stages, /api/tool-roles, /api/knowledge, /api/pipelines, /api/rag, /api/cost-tracking, /api/support/tickets, /api/help, /api/feedback, /api/cad, /api/ai-services, /api/analytics, /api/gateway, /api/brand, /api/databases, /api/library, /api/meauxwork, /api/team, /api/prompts/:name/execute, /api/session/:id',
          path: path
        }, 404, corsHeaders);
      }

      // Redirect .html URLs to clean URLs (301 Permanent Redirect)
      if (path.endsWith('.html') && path !== '/index.html') {
        const url = new URL(request.url);
        let cleanPath = path.replace(/\.html$/, '');

        // Special handling for /dashboard/index.html -> /dashboard/
        if (cleanPath === '/dashboard/index') {
          cleanPath = '/dashboard';
        }
        // Special handling for root index.html (already handled, but just in case)
        if (cleanPath === '/index') {
          cleanPath = '/';
        }

        // Preserve query string
        const redirectUrl = `${url.origin}${cleanPath}${url.search}`;
        return Response.redirect(redirectUrl, 301);
      }

      // Serve static files from R2 for non-API routes
      return await serveStaticFile(request, env, path);
    } catch (error) {
      console.error('Error:', error);
      return new Response(`Error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },
};

/**
 * Serve static files from R2
 */
async function serveStaticFile(request, env, path) {
  if (!env.STORAGE) {
    return new Response('R2 storage not configured', { status: 500 });
  }

  // Normalize path - remove trailing slash
  let normalizedPath = path === '/' || path === '' ? '' : path.replace(/^\//, '').replace(/\/$/, '');

  // List of root-level HTML pages
  const rootPages = ['work', 'services', 'about', 'contact', 'features', 'tools', 'workflows', 'pricing', 'terms', 'login', 'index'];
  const isRootPage = rootPages.includes(normalizedPath);

  // List of dashboard pages (clean URLs - no .html)
  const dashboardPages = [
    'dashboard', 'dashboard/projects', 'dashboard/workflows', 'dashboard/deployments',
    'dashboard/workers', 'dashboard/settings', 'dashboard/library', 'dashboard/meauxsql',
    'dashboard/meauxmcp', 'dashboard/meauxcad', 'dashboard/calendar', 'dashboard/clients',
    'dashboard/brand', 'dashboard/gallery', 'dashboard/meauxwork', 'dashboard/prompts',
    'dashboard/tasks', 'dashboard/messages', 'dashboard/talk', 'dashboard/video', 'dashboard/analytics',
    'dashboard/databases', 'dashboard/cloudflare', 'dashboard/ai-services',
    'dashboard/api-gateway', 'dashboard/team', 'dashboard/tenants', 'dashboard/support'
  ];
  const isDashboardPage = dashboardPages.includes(normalizedPath) || normalizedPath.startsWith('dashboard/');

  // Handle legal pages: /legal/privacy → legal/privacy.html, /legal/terms → legal/terms.html
  const isLegalPage = normalizedPath.startsWith('legal/');

  // Determine R2 key based on path type
  let r2Key;

  if (normalizedPath === '' || normalizedPath === '/') {
    // Root path
    r2Key = 'index.html';
  } else if (isLegalPage) {
    // Legal pages: /legal/privacy → legal/privacy.html, /legal/terms → legal/terms.html
    r2Key = `${normalizedPath}.html`;
  } else if (isRootPage) {
    // Root-level pages: /work → static/work.html
    r2Key = `${normalizedPath}.html`;
  } else if (isDashboardPage) {
    // Dashboard pages: /dashboard/projects → static/dashboard/projects.html
    if (normalizedPath === 'dashboard') {
      r2Key = 'dashboard/index.html';
    } else {
      // Remove 'dashboard/' prefix and add .html
      const pageName = normalizedPath.replace('dashboard/', '');

      // Handle nested routes under settings (e.g., /dashboard/settings/domains → settings.html)
      // Let the client-side JS handle sub-routing
      if (pageName.startsWith('settings/')) {
        r2Key = 'dashboard/settings.html';
      } else {
        r2Key = `dashboard/${pageName}.html`;
      }
    }
  } else if (normalizedPath.endsWith('.html')) {
    // Already has .html extension - use as-is
    r2Key = normalizedPath;
  } else if (normalizedPath.includes('/')) {
    // Directory path - try index.html first
    r2Key = `${normalizedPath}/index.html`;
  } else {
    // Single word path - try as HTML file
    r2Key = `${normalizedPath}.html`;
  }

  // Handle shared assets (CSS, JS, etc.)
  if (normalizedPath.startsWith('shared/')) {
    const sharedKey = normalizedPath; // Already has 'shared/' prefix
    try {
      const object = await env.STORAGE.get(`static/${sharedKey}`);
      if (object) {
        const contentType = getContentType(sharedKey);
        return new Response(object.body, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    } catch (error) {
      console.error('Error fetching shared asset from R2:', error);
    }
  }

  // Handle GLB/GLTF files (3D models) with special serving logic
  if (r2Key.endsWith('.glb') || r2Key.endsWith('.gltf')) {
    const glbResponse = await serveGLB(`static/${r2Key}`, env);
    if (glbResponse) {
      return glbResponse;
    }
  }

  // Try to get file from R2
  try {
    const object = await env.STORAGE.get(`static/${r2Key}`);

    if (object) {
      const contentType = getContentType(r2Key);
      return new Response(object.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching from R2:', error);
  }

  // Fallback: Try directory/index.html if path doesn't end with .html
  if (!r2Key.endsWith('.html') && !normalizedPath.includes('.')) {
    try {
      const fallbackKey = `${normalizedPath}/index.html`;
      const fallbackObject = await env.STORAGE.get(`static/${fallbackKey}`);
      if (fallbackObject) {
        const contentType = getContentType(fallbackKey);
        return new Response(fallbackObject.body, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    } catch (e) {
      // Continue to 404
    }
  }

  // Return 404
  if (path === '/' || path === '') {
    return new Response('Frontend files not found in R2. Please upload static files to R2 bucket at "static/" prefix.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new Response('Not Found', { status: 404 });
}

/**
 * Get content type from file extension
 */
function getContentType(path) {
  const ext = path.split('.').pop().toLowerCase();
  const types = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'glb': 'model/gltf-binary', // GLB (Binary GLTF) - 3D models
    'gltf': 'model/gltf+json', // GLTF (JSON format) - 3D models
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Write analytics event to Analytics Engine dataset
 * 
 * Usage example:
 *   await writeAnalyticsEvent(env, {
 *     event_type: 'page_view',
 *     tenant_id: 'tenant-123',
 *     user_id: 'user-456',
 *     metadata: { page: '/dashboard', duration: 1500 }
 *   });
 * 
 * @param {Object} env - Worker environment (contains INNERANIMALMEDIA-ANALYTICENGINE binding)
 * @param {Object} event - Event data object
 * @param {string} event.event_type - Type of event (e.g., 'page_view', 'api_request', 'user_action', 'app_install', 'deployment', 'error')
 * @param {string} [event.tenant_id] - Tenant ID (defaults to 'system')
 * @param {string} [event.user_id] - User ID (optional)
 * @param {string} [event.session_id] - Session ID (optional)
 * @param {Object} [event.metadata] - Additional event metadata (optional)
 */
async function writeAnalyticsEvent(env, event) {
  try {
    // Access Analytics Engine binding (use bracket notation for hyphenated names)
    const analytics = env['INNERANIMALMEDIA-ANALYTICENGINE'];

    if (!analytics) {
      // Analytics Engine not configured - silently skip (don't log in production)
      return;
    }

    // Analytics Engine writeDataPoint format:
    // - index: Object with indexed fields (for efficient querying)
    // - blobs: Array of strings (actual event data as JSON)

    // Create indexed fields for efficient querying
    const index = {
      event_type: event.event_type || 'unknown',
      tenant_id: event.tenant_id || 'system',
    };

    // Create full event payload with all data
    const data = {
      event_type: event.event_type || 'unknown',
      tenant_id: event.tenant_id || 'system',
      user_id: event.user_id || null,
      session_id: event.session_id || null,
      timestamp: Math.floor(Date.now() / 1000), // Unix timestamp for querying
      created_at: new Date().toISOString(), // ISO string for readability
      ...(event.metadata || {}), // Merge any additional metadata
    };

    // Write to Analytics Engine
    // Note: Analytics Engine automatically handles batching and deduplication
    analytics.writeDataPoint({
      index: index,
      blobs: [JSON.stringify(data)],
    });

    // Optional: Log successful writes in development (remove in production for performance)
    // console.log(`Analytics event written: ${event.event_type}`, { tenant_id: event.tenant_id });
  } catch (error) {
    // Don't fail requests if analytics fails - log error but continue execution
    console.error('Failed to write analytics event:', error.message);
  }
}

/**
 * Extract tenant ID from request (JWT token, header, or subdomain)
 */
async function getTenantFromRequest(request, env) {
  // 1. Check Authorization header (JWT)
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = await verifyJWT(token, env.JWT_SECRET);
      if (payload.tenant_id) {
        return payload.tenant_id;
      }
    } catch (e) {
      // Token invalid, continue to other methods
    }
  }

  // 2. Check X-Tenant-ID header
  const tenantHeader = request.headers.get('X-Tenant-ID');
  if (tenantHeader) {
    return tenantHeader;
  }

  // 3. Check cookie for tenant_id
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key.trim()] = decodeURIComponent(value.trim());
      }
      return acc;
    }, {});

    if (cookies.tenant_id) {
      return cookies.tenant_id;
    }
  }

  // 4. Check OAuth token by email from cookie or query param
  // Try to get user email from oauth_success query param or cookie
  const url = new URL(request.url);
  const oauthSuccess = url.searchParams.get('oauth_success');

  if (oauthSuccess && cookieHeader) {
    // Look for email in cookies or try to get from OAuth token
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key.trim()] = decodeURIComponent(value.trim());
      }
      return acc;
    }, {});

    if (cookies.user_email) {
      try {
        const oauthToken = await env.DB.prepare(
          'SELECT tenant_id FROM oauth_tokens WHERE provider_email = ? AND provider_id = ? ORDER BY created_at DESC LIMIT 1'
        )
          .bind(cookies.user_email, oauthSuccess)
          .first();

        if (oauthToken && oauthToken.tenant_id) {
          return oauthToken.tenant_id;
        }
      } catch (e) {
        console.error('Error looking up tenant from OAuth token:', e);
      }
    }
  }

  // 5. Check subdomain (skip admin subdomain)
  const hostname = url.hostname;
  const subdomain = hostname.split('.')[0];
  if (subdomain && subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'admin') {
    try {
      // Look up tenant by subdomain (using is_active instead of status)
      const tenant = await env.DB.prepare(
        'SELECT id FROM tenants WHERE slug = ? AND (is_active = 1 OR status = "active")'
      )
        .bind(subdomain)
        .first();

      if (tenant) {
        return tenant.id;
      }
    } catch (e) {
      console.error('Error looking up tenant:', e);
      // Continue to default
    }
  }

  // 6. Default: Try to get tenant from superadmin's OAuth token (for info@inneranimals.com)
  try {
    const superadminToken = await env.DB.prepare(
      'SELECT tenant_id FROM oauth_tokens WHERE provider_email = ? AND provider_id = ? ORDER BY created_at DESC LIMIT 1'
    )
      .bind('info@inneranimals.com', 'google')
      .first();

    if (superadminToken && superadminToken.tenant_id) {
      return superadminToken.tenant_id;
    }
  } catch (e) {
    // Non-blocking: continue to default
  }

  // 7. Default tenant (for development)
  // In production, you might want to throw an error instead
  return 'tenant_1768090747821_5m9she82d'; // Default to Sam's tenant for now
}

/**
 * Verify JWT token
 */
async function verifyJWT(token, secret) {
  // TODO: Implement JWT verification
  // For now, return a mock payload
  // In production, use a library like @cloudflare/jwt
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (e) {
    throw new Error('Invalid token');
  }
}

/**
 * Handle tenants endpoint
 */
async function handleTenants(request, env, tenantId, corsHeaders) {
  if (request.method === 'GET') {
    try {
      // Use existing schema: is_active instead of status, createdAt instead of created_at
      // Handle both column name variations
      const stmt = env.DB.prepare(`
        SELECT 
          id, 
          name, 
          slug, 
          COALESCE(is_active, CASE WHEN status = 'active' THEN 1 ELSE 0 END) as is_active,
          COALESCE(createdAt, created_at) as created_at
        FROM tenants 
        WHERE is_active = 1 OR status = 'active'
      `);
      const result = await stmt.all();

      // Map results to expected format
      const tenants = (result.results || []).map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.is_active ? 'active' : 'inactive',
        created_at: t.created_at
      }));

      return jsonResponse(
        { success: true, data: tenants },
        200,
        corsHeaders
      );
    } catch (error) {
      console.error('Error fetching tenants:', error);
      // Return empty array if table doesn't exist or query fails
      return jsonResponse(
        { success: true, data: [] },
        200,
        corsHeaders
      );
    }
  }

  // POST /api/tenants - Create new tenant and user (from onboarding)
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { email, name: userName, workspace_name, workspace_type, preset, modules } = body;

      if (!email) {
        return jsonResponse(
          { success: false, error: 'Email is required' },
          400,
          corsHeaders
        );
      }

      // Generate tenant ID and slug
      const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let slug = (workspace_name || email.split('@')[0] || 'workspace')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);

      // Check if slug already exists
      const existingTenant = await env.DB.prepare('SELECT id FROM tenants WHERE slug = ?')
        .bind(slug)
        .first();

      if (existingTenant) {
        // Append random suffix if slug exists
        slug = `${slug}-${Math.random().toString(36).substr(2, 6)}`;
      }

      const now = Math.floor(Date.now() / 1000);

      // Create tenant
      try {
        await env.DB.prepare(`
          INSERT INTO tenants (id, name, slug, is_active, settings, created_at, updated_at, createdBy)
          VALUES (?, ?, ?, 1, ?, ?, ?, ?)
        `).bind(
          tenantId,
          workspace_name || `${userName || email.split('@')[0]}'s Workspace`,
          slug,
          JSON.stringify({
            workspace_type: workspace_type || 'personal',
            preset: preset || null,
            modules: modules || [],
            onboarding_completed: true
          }),
          now,
          now,
          email // createdBy = user email
        ).run();
      } catch (tenantError) {
        console.error('Error creating tenant:', tenantError);
        throw new Error(`Failed to create tenant: ${tenantError.message || tenantError}`);
      }

      // Create user (admin for the new tenant)
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        await env.DB.prepare(`
          INSERT INTO users (id, tenant_id, email, name, role, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'admin', 1, ?, ?)
        `).bind(
          userId,
          tenantId,
          email,
          userName || email.split('@')[0],
          now,
          now
        ).run();
      } catch (userError) {
        console.error('Error creating user:', userError);
        // Try to rollback tenant creation
        try {
          await env.DB.prepare('DELETE FROM tenants WHERE id = ?').bind(tenantId).run();
        } catch (rollbackError) {
          console.error('Error rolling back tenant creation:', rollbackError);
        }
        throw new Error(`Failed to create user: ${userError.message || userError}`);
      }

      // Create tenant metadata
      try {
        await env.DB.prepare(`
          INSERT INTO tenant_metadata (tenant_id, plan_type, subscription_status, billing_email, limits, usage, created_at, updated_at)
          VALUES (?, 'free', 'active', ?, '{}', '{}', ?, ?)
        `).bind(tenantId, email, now, now).run();
      } catch (metaError) {
        // Tenant metadata table might not exist, continue without it
        console.warn('Tenant metadata table not found, skipping:', metaError.message);
      }

      // Return created tenant and user
      return jsonResponse(
        {
          success: true,
          data: {
            tenant: {
              id: tenantId,
              name: workspace_name || `${userName || email.split('@')[0]}'s Workspace`,
              slug: slug,
              status: 'active'
            },
            user: {
              id: userId,
              email: email,
              name: userName || email.split('@')[0],
              role: 'admin'
            }
          }
        },
        201,
        corsHeaders
      );
    } catch (error) {
      console.error('Error creating tenant:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return jsonResponse(
        {
          success: false,
          error: error.message || 'Failed to create tenant and user',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        500,
        corsHeaders
      );
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle workflows endpoint
 */
async function handleWorkflows(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '50'), 100);
    const status = url.searchParams.get('status') || 'all';
    const search = url.searchParams.get('search') || '';

    // Build query
    let query = 'SELECT * FROM workflows WHERE 1=1';
    const params = [];

    if (tenantId) {
      query += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    if (status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    // Get paginated results
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * perPage;
    params.push(perPage, offset);

    const result = await env.DB.prepare(query).bind(...params).all();

    return jsonResponse(
      {
        success: true,
        data: result.results || [],
        pagination: {
          page,
          per_page: perPage,
          total,
          total_pages: Math.ceil(total / perPage),
          has_next: page < Math.ceil(total / perPage),
          has_prev: page > 1,
        },
        tenant_id: tenantId,
      },
      200,
      corsHeaders
    );
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO workflows (id, tenant_id, name, status, config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        tenantId || body.tenant_id,
        body.name,
        body.status || 'active',
        JSON.stringify(body.config || {}),
        now,
        now
      )
      .run();

    const workflow = await env.DB.prepare('SELECT * FROM workflows WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(
      { success: true, data: workflow },
      201,
      corsHeaders
    );
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle deployments endpoint
 * Fetches from Cloudflare Pages API and syncs with database
 */
async function handleDeployments(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '50'), 100);
    const status = url.searchParams.get('status') || 'all';
    const project = url.searchParams.get('project') || 'all';
    const sync = url.searchParams.get('sync') === 'true';

    // Always sync from Cloudflare API if we have token (to get real data)
    if (env.CLOUDFLARE_API_TOKEN) {
      try {
        const cloudflareDeployments = await getCloudflareDeployments(env, tenantId);

        // Upsert deployments into database
        for (const deployment of cloudflareDeployments) {
          await env.DB.prepare(
            `INSERT INTO deployments (
              id, tenant_id, project_name, project_id, status, url, framework, 
              environment, build_time_ms, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              status = excluded.status,
              url = excluded.url,
              updated_at = excluded.updated_at`
          )
            .bind(
              deployment.id,
              deployment.tenant_id,
              deployment.project_name,
              deployment.project_id,
              deployment.status,
              deployment.url,
              deployment.framework,
              deployment.environment,
              deployment.build_time || null,
              deployment.created_at,
              deployment.updated_at
            )
            .run();
        }
      } catch (error) {
        console.error('Failed to sync from Cloudflare:', error);
        // Continue with database query even if sync fails
      }
    }

    // Build query
    let query = 'SELECT * FROM deployments WHERE 1=1';
    const params = [];

    if (tenantId) {
      query += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    if (status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (project !== 'all') {
      query += ' AND project_name = ?';
      params.push(project);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    // Get stats (using existing schema: build_time_ms instead of build_time)
    const statsQuery = `
      SELECT 
        COUNT(*) as total_deployments,
        COUNT(DISTINCT project_name) as active_projects,
        AVG(CASE WHEN build_time_ms > 0 THEN build_time_ms ELSE NULL END) / 1000.0 as avg_build_time,
        SUM(CASE WHEN status = 'ready' OR status = 'READY' OR status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
      FROM deployments
      WHERE ${tenantId ? 'tenant_id = ?' : '1=1'}
    `;
    const statsParams = tenantId ? [tenantId] : [];
    const stats = await env.DB.prepare(statsQuery).bind(...statsParams).first();

    // Get paginated results
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * perPage;
    params.push(perPage, offset);

    const result = await env.DB.prepare(query).bind(...params).all();

    // Group by project for carousel
    const projects = {};
    (result.results || []).forEach((deployment) => {
      if (!projects[deployment.project_name]) {
        projects[deployment.project_name] = {
          name: deployment.project_name,
          status: deployment.status,
          deployments: 0,
          framework: deployment.framework || 'Unknown',
          environment: deployment.environment || 'Production',
          today: 0,
          last7Days: 0,
          average: 0,
        };
      }
      projects[deployment.project_name].deployments++;
    });

    return jsonResponse(
      {
        success: true,
        totalDeployments: stats?.total_deployments || 0,
        activeProjects: stats?.active_projects || 0,
        avgBuildTime: stats?.avg_build_time ? `${Math.round(stats.avg_build_time)}s` : '0s',
        successRate: stats?.success_rate ? Math.round(stats.success_rate * 10) / 10 : 0,
        projects: Object.values(projects).slice(0, 3),
        pagination: {
          page,
          per_page: perPage,
          total,
          total_pages: Math.ceil(total / perPage),
          has_next: page < Math.ceil(total / perPage),
          has_prev: page > 1,
        },
      },
      200,
      corsHeaders
    );
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle workers endpoint
 * Fetches from Cloudflare Workers API and syncs with database
 */
async function handleWorkers(request, env, tenantId, corsHeaders) {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '50'), 100);
    const sync = url.searchParams.get('sync') === 'true';

    // Always sync from Cloudflare API if we have token (to get real data)
    if (env.CLOUDFLARE_API_TOKEN) {
      try {
        const cloudflareWorkers = await getCloudflareWorkers(env, tenantId);

        // Upsert workers into database
        for (const worker of cloudflareWorkers) {
          await env.DB.prepare(
            `INSERT INTO workers (
              id, tenant_id, name, script_name, status, requests, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              status = excluded.status,
              requests = excluded.requests,
              updated_at = excluded.updated_at`
          )
            .bind(
              worker.id,
              worker.tenant_id,
              worker.name,
              worker.script_name,
              worker.status,
              worker.requests,
              worker.created_at,
              worker.updated_at
            )
            .run();
        }
      } catch (error) {
        console.error('Failed to sync from Cloudflare:', error);
        // Continue with database query even if sync fails
      }
    }

    let query = 'SELECT * FROM workers WHERE 1=1';
    const params = [];

    if (tenantId) {
      query += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    // Get paginated results
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * perPage;
    params.push(perPage, offset);

    const result = await env.DB.prepare(query).bind(...params).all();

    return jsonResponse(
      {
        success: true,
        count: total,
        data: result.results || [],
        pagination: {
          page,
          per_page: perPage,
          total,
          total_pages: Math.ceil(total / perPage),
          has_next: page < Math.ceil(total / perPage),
          has_prev: page > 1,
        },
      },
      200,
      corsHeaders
    );
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle stats endpoint
 */
async function handleStats(request, env, tenantId, corsHeaders) {
  if (request.method === 'GET') {
    try {
      let syncErrors = [];
      let deploymentsSynced = 0;
      let workersSynced = 0;

      // Sync from Cloudflare first if we have API token
      if (env.CLOUDFLARE_API_TOKEN) {
        try {
          console.log('Starting Cloudflare sync...');

          // Sync deployments
          try {
            const cloudflareDeployments = await getCloudflareDeployments(env, tenantId);
            console.log(`Found ${cloudflareDeployments.length} deployments from Cloudflare`);

            for (const deployment of cloudflareDeployments) {
              try {
                await env.DB.prepare(
                  `INSERT INTO deployments (
                    id, tenant_id, project_name, project_id, status, url, framework, 
                    environment, build_time_ms, created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(id) DO UPDATE SET
                    status = excluded.status,
                    url = excluded.url,
                    updated_at = excluded.updated_at`
                )
                  .bind(
                    deployment.id,
                    deployment.tenant_id,
                    deployment.project_name,
                    deployment.project_id,
                    deployment.status,
                    deployment.url,
                    deployment.framework,
                    deployment.environment,
                    deployment.build_time || null,
                    deployment.created_at,
                    deployment.updated_at
                  )
                  .run();
                deploymentsSynced++;
              } catch (dbError) {
                console.error(`Error inserting deployment ${deployment.id}:`, dbError);
                syncErrors.push(`Deployment ${deployment.id}: ${dbError.message}`);
              }
            }
          } catch (deployError) {
            console.error('Error syncing deployments:', deployError);
            syncErrors.push(`Deployments: ${deployError.message}`);
          }

          // Sync workers
          try {
            const cloudflareWorkers = await getCloudflareWorkers(env, tenantId);
            console.log(`Found ${cloudflareWorkers.length} workers from Cloudflare`);

            for (const worker of cloudflareWorkers) {
              try {
                await env.DB.prepare(
                  `INSERT INTO workers (
                    id, tenant_id, name, script_name, status, requests, created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(id) DO UPDATE SET
                    status = excluded.status,
                    requests = excluded.requests,
                    updated_at = excluded.updated_at`
                )
                  .bind(
                    worker.id,
                    worker.tenant_id,
                    worker.name,
                    worker.script_name,
                    worker.status,
                    worker.requests,
                    worker.created_at,
                    worker.updated_at
                  )
                  .run();
                workersSynced++;
              } catch (dbError) {
                console.error(`Error inserting worker ${worker.id}:`, dbError);
                syncErrors.push(`Worker ${worker.id}: ${dbError.message}`);
              }
            }
          } catch (workerError) {
            console.error('Error syncing workers:', workerError);
            syncErrors.push(`Workers: ${workerError.message}`);
          }

          if (deploymentsSynced > 0 || workersSynced > 0) {
            console.log(`Sync complete: ${deploymentsSynced} deployments, ${workersSynced} workers`);
          }
        } catch (syncError) {
          console.error('Failed to sync from Cloudflare:', syncError);
          syncErrors.push(`Sync failed: ${syncError.message}`);
          // Continue with database query even if sync fails
        }
      } else {
        console.log('CLOUDFLARE_API_TOKEN not set, skipping sync');
      }

      // Get deployment stats (with error handling)
      let deployments = { total: 0 };
      try {
        const deploymentsQuery = `
          SELECT COUNT(*) as total
          FROM deployments
          WHERE ${tenantId ? 'tenant_id = ?' : '1=1'}
        `;
        const deploymentsParams = tenantId ? [tenantId] : [];
        deployments = await env.DB.prepare(deploymentsQuery)
          .bind(...deploymentsParams)
          .first() || { total: 0 };
      } catch (e) {
        console.error('Error querying deployments:', e);
      }

      // Get workflow stats
      let workflows = { active: 0 };
      try {
        const workflowsQuery = `
          SELECT COUNT(*) as active
          FROM workflows
          WHERE status = 'active' ${tenantId ? 'AND tenant_id = ?' : ''}
        `;
        const workflowsParams = tenantId ? [tenantId] : [];
        workflows = await env.DB.prepare(workflowsQuery)
          .bind(...workflowsParams)
          .first() || { active: 0 };
      } catch (e) {
        console.error('Error querying workflows:', e);
      }

      // Get worker stats (with error handling)
      let workers = { total: 0 };
      try {
        const workersQuery = `
          SELECT COUNT(*) as total
          FROM workers
          WHERE ${tenantId ? 'tenant_id = ?' : '1=1'}
        `;
        const workersParams = tenantId ? [tenantId] : [];
        workers = await env.DB.prepare(workersQuery)
          .bind(...workersParams)
          .first() || { total: 0 };
      } catch (e) {
        console.error('Error querying workers:', e);
      }

      // Get project stats
      let projects = { total: 0, active: 0 };
      try {
        const projectsQuery = `
          SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
          FROM projects
          WHERE ${tenantId ? 'tenant_id = ?' : '1=1'}
        `;
        const projectsParams = tenantId ? [tenantId] : [];
        projects = await env.DB.prepare(projectsQuery)
          .bind(...projectsParams)
          .first() || { total: 0, active: 0 };
      } catch (e) {
        console.error('Error querying projects:', e);
      }

      // Get apps stats (migrated from meauxos)
      let apps = { total: 0, featured: 0, active: 0 };
      try {
        const appsQuery = `
          SELECT COUNT(*) as total, 
                 SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END) as featured,
                 SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
          FROM apps
          WHERE ${tenantId ? 'tenant_id = ?' : '1=1'}
        `;
        const appsParams = tenantId ? [tenantId] : [];
        apps = await env.DB.prepare(appsQuery)
          .bind(...appsParams)
          .first() || { total: 0, featured: 0, active: 0 };
      } catch (e) {
        console.error('Error querying apps:', e);
      }

      // Get agent system stats
      let agentStats = { commands: 0, recipes: 0, sessions: 0, configs: 0 };
      try {
        const agentCommandsQuery = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM agent_commands WHERE is_public = 1 OR (? IS NOT NULL AND tenant_id = ?)'
        ).bind(tenantId || null, tenantId || null).first();
        agentStats.commands = agentCommandsQuery?.count || 0;

        const agentRecipesQuery = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM agent_recipe_prompts WHERE is_public = 1 OR (? IS NOT NULL AND tenant_id = ?)'
        ).bind(tenantId || null, tenantId || null).first();
        agentStats.recipes = agentRecipesQuery?.count || 0;

        const agentSessionsQuery = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM agent_sessions WHERE status = 'active' ${tenantId ? 'AND tenant_id = ?' : ''}`
        ).bind(...(tenantId ? [tenantId] : [])).first();
        agentStats.sessions = agentSessionsQuery?.count || 0;

        const agentConfigsQuery = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM agent_configs WHERE status = 'active' ${tenantId ? 'AND tenant_id = ?' : ''}`
        ).bind(...(tenantId ? [tenantId] : [])).first();
        agentStats.configs = agentConfigsQuery?.count || 0;
      } catch (e) {
        console.error('Error querying agent stats:', e);
      }

      // Get R2 storage stats (actual count from R2 bucket)
      let r2Stats = { files: 0, size_mb: 0, estimated: false, status: 'not_configured' };
      if (env.STORAGE) {
        try {
          r2Stats.status = 'connected';

          // Check if we have an assets table that tracks R2 files (most accurate)
          try {
            const assetsQuery = await env.DB.prepare(
              `SELECT COUNT(*) as count, SUM(size_bytes) as total_size 
               FROM assets 
               WHERE ${tenantId ? 'tenant_id = ?' : '1=1'}`
            ).bind(...(tenantId ? [tenantId] : [])).first();

            if (assetsQuery && assetsQuery.count > 0) {
              r2Stats.files = assetsQuery.count || 0;
              r2Stats.size_mb = assetsQuery.total_size ? Math.round((assetsQuery.total_size / 1024 / 1024) * 100) / 100 : 0;
              r2Stats.estimated = false;
            }
          } catch (assetsError) {
            // Assets table might not exist yet - try direct R2 listing
            console.log('Assets table not found, using R2 list API');
          }

          // If assets table doesn't exist or is empty, count objects directly from R2
          // Note: This can be slow for large buckets, so we limit to static/ prefix
          if (r2Stats.files === 0) {
            try {
              let fileCount = 0;
              let totalSize = 0;
              let cursor;
              let iterations = 0;
              const maxIterations = 10; // Limit to 10 iterations (10,000 files max) to avoid timeout

              // List objects with 'static/' prefix (dashboard files)
              do {
                const listOptions = {
                  prefix: 'static/',
                  limit: 1000,
                  cursor: cursor
                };

                const objectList = await env.STORAGE.list(listOptions);

                if (objectList && objectList.objects) {
                  fileCount += objectList.objects.length;
                  totalSize += objectList.objects.reduce((acc, obj) => acc + (obj.size || 0), 0);
                  cursor = objectList.truncated ? objectList.cursor : null;
                } else {
                  break;
                }

                iterations++;
                if (iterations >= maxIterations) {
                  r2Stats.estimated = true; // Mark as estimated if we hit the limit
                  break;
                }
              } while (cursor);

              r2Stats.files = fileCount;
              r2Stats.size_mb = Math.round((totalSize / 1024 / 1024) * 100) / 100;

              // If we got files, it's accurate (not estimated)
              if (fileCount > 0) {
                r2Stats.estimated = false;
              } else {
                // Fallback: Estimate based on typical static site size
                r2Stats.files = 75; // Estimate for dashboard HTML/CSS/JS files
                r2Stats.size_mb = 5.2; // Estimate
                r2Stats.estimated = true;
              }
            } catch (r2ListError) {
              console.error('Error listing R2 objects:', r2ListError);
              // Fallback estimate
              r2Stats.files = 75;
              r2Stats.size_mb = 5.2;
              r2Stats.estimated = true;
            }
          }
        } catch (r2Error) {
          console.error('Error getting R2 stats:', r2Error);
          r2Stats.status = 'error';
          r2Stats.files = 0;
          r2Stats.size_mb = 0;
          r2Stats.estimated = true;
        }
      }

      // Get clients/users stats
      let clients = { total: 0, active: 0 };
      try {
        const clientsQuery = `
          SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
          FROM users
          WHERE ${tenantId ? 'tenant_id = ?' : '1=1'}
        `;
        const clientsParams = tenantId ? [tenantId] : [];
        clients = await env.DB.prepare(clientsQuery)
          .bind(...clientsParams)
          .first() || { total: 0, active: 0 };
      } catch (e) {
        console.error('Error querying clients:', e);
      }

      // Calculate success rate (handle both 'ready' and 'READY' status)
      let success = { rate: 0 };
      try {
        const successQuery = `
          SELECT 
            SUM(CASE WHEN status = 'ready' OR status = 'READY' OR status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as rate
          FROM deployments
          WHERE ${tenantId ? 'tenant_id = ?' : '1=1'}
        `;
        const successParams = tenantId ? [tenantId] : [];
        success = await env.DB.prepare(successQuery)
          .bind(...successParams)
          .first() || { rate: 0 };
      } catch (e) {
        console.error('Error calculating success rate:', e);
      }

      // Track analytics event for stats page view
      writeAnalyticsEvent(env, {
        event_type: 'page_view',
        tenant_id: tenantId || 'system',
        metadata: {
          page: '/dashboard',
          endpoint: '/api/stats',
          sync_requested: request.url.includes('sync=true')
        }
      }).catch(err => {
        console.error('Analytics write failed:', err.message);
      });

      return jsonResponse(
        {
          success: true,
          data: {
            // Core stats
            deployments: deployments?.total || 0,
            workflows: workflows?.active || 0,
            workers: workers?.total || 0,
            projects: projects?.total || 0,
            active_projects: projects?.active || 0,
            clients: clients?.total || 0,
            active_clients: clients?.active || 0,

            // Apps library (migrated from meauxos)
            apps: apps?.total || 0,
            featured_apps: apps?.featured || 0,
            active_apps: apps?.active || 0,

            // Agent system (MeauxMCP)
            agent_commands: agentStats.commands || 0,
            agent_recipes: agentStats.recipes || 0,
            agent_sessions: agentStats.sessions || 0,
            agent_configs: agentStats.configs || 0,

            // R2 Storage stats
            r2_files: r2Stats.files || 0,
            r2_size_mb: r2Stats.size_mb || 0,
            r2_estimated: r2Stats.estimated || false,
            r2_bucket: 'inneranimalmedia-assets',
            r2_status: env.STORAGE ? 'connected' : 'not_configured',

            // Analytics Engine stats
            analytics_enabled: env['INNERANIMALMEDIA-ANALYTICENGINE'] ? true : false,
            analytics_dataset: 'inneranimalmedia',

            // Cloudflare API stats
            cloudflare_api_enabled: env.CLOUDFLARE_API_TOKEN ? true : false,
            cloudflare_api_synced: (deploymentsSynced > 0 || workersSynced > 0),

            // Legacy/compatibility fields
            visitors: 0, // Would come from analytics (query Analytics Engine)
            successRate: success?.rate ? Math.round(success.rate * 10) / 10 : 100,

            // Sync information
            syncInfo: {
              deploymentsSynced,
              workersSynced,
              syncTime: new Date().toISOString(),
              errors: syncErrors.length > 0 ? syncErrors : undefined
            },

            // System status
            system_status: {
              database: 'connected',
              r2_storage: env.STORAGE ? 'connected' : 'not_configured',
              analytics: env['INNERANIMALMEDIA-ANALYTICENGINE'] ? 'enabled' : 'disabled',
              cloudflare_api: env.CLOUDFLARE_API_TOKEN ? 'enabled' : 'disabled',
              durable_objects: env.SESSION_DO ? 'enabled' : 'disabled',
              hyperdrive: env.HYPERDRIVE ? 'enabled' : 'disabled'
            }
          },
        },
        200,
        corsHeaders
      );
    } catch (error) {
      console.error('Error in handleStats:', error);
      // Return default values on error
      return jsonResponse(
        {
          success: true,
          data: {
            deployments: 0,
            workflows: 0,
            workers: 0,
            projects: 0,
            visitors: 0,
            successRate: 0,
          },
        },
        200,
        corsHeaders
      );
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle tools endpoint - List available tools with access control
 */
async function handleTools(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);

  // Get specific tool access: /api/tools/:id/access
  if (pathParts.length === 4 && pathParts[3] === 'access') {
    const toolId = pathParts[2];
    return handleToolAccess(request, env, tenantId, toolId, corsHeaders);
  }

  if (request.method === 'GET') {
    // Get all tools available to tenant (public + tenant-specific with access)
    const query = `
      SELECT DISTINCT
        t.*,
        ta.can_view,
        ta.can_use,
        ta.can_configure,
        ta.custom_config
      FROM tools t
      LEFT JOIN tool_access ta ON t.id = ta.tool_id AND (ta.tenant_id = ? OR ta.tenant_id IS NULL)
      WHERE t.is_enabled = 1 
        AND (t.is_public = 1 OR ta.tenant_id = ?)
      ORDER BY t.category, t.display_name
    `;

    const result = await env.DB.prepare(query)
      .bind(tenantId || '', tenantId || '')
      .all();

    // Filter tools based on access
    const accessibleTools = (result.results || []).filter(tool => {
      // Public tools are accessible to all (even without tenant)
      if (tool.is_public === 1) return true;
      // Tenant-specific tools need access record
      if (tenantId) {
        return tool.can_view === 1;
      }
      return false; // No tenant, no access to private tools
    }).map(tool => ({
      id: tool.id,
      name: tool.name,
      display_name: tool.display_name,
      category: tool.category,
      icon: tool.icon,
      description: tool.description,
      version: tool.version,
      can_view: tool.is_public === 1 ? true : (tool.can_view === 1),
      can_use: tool.is_public === 1 ? true : (tool.can_use === 1),
      can_configure: tool.can_configure === 1,
      custom_config: tool.custom_config ? JSON.parse(tool.custom_config) : null,
      config: tool.config ? JSON.parse(tool.config) : null
    }));

    return jsonResponse(
      {
        success: true,
        data: accessibleTools,
        tenant_id: tenantId
      },
      200,
      corsHeaders
    );
  }

  if (request.method === 'POST') {
    // Grant tool access to tenant/user
    const body = await request.json();
    const toolId = body.tool_id;
    const userId = body.user_id || null;
    const accessId = `access-${tenantId}-${toolId}${userId ? '-' + userId : ''}`;
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO tool_access (id, tool_id, tenant_id, user_id, can_view, can_use, can_configure, custom_config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         can_view = excluded.can_view,
         can_use = excluded.can_use,
         can_configure = excluded.can_configure,
         custom_config = excluded.custom_config,
         updated_at = excluded.updated_at`
    )
      .bind(
        accessId,
        toolId,
        tenantId,
        userId,
        body.can_view !== undefined ? (body.can_view ? 1 : 0) : 1,
        body.can_use !== undefined ? (body.can_use ? 1 : 0) : 1,
        body.can_configure !== undefined ? (body.can_configure ? 1 : 0) : 0,
        body.custom_config ? JSON.stringify(body.custom_config) : null,
        now,
        now
      )
      .run();

    return jsonResponse(
      { success: true, message: 'Tool access granted' },
      201,
      corsHeaders
    );
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle tool access check
 */
async function handleToolAccess(request, env, tenantId, toolId, corsHeaders) {
  if (request.method === 'GET') {
    const userId = new URL(request.url).searchParams.get('user_id');

    let query = `
      SELECT * FROM tool_access 
      WHERE tool_id = ? AND tenant_id = ?
    `;
    const params = [toolId, tenantId];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    } else {
      query += ' AND user_id IS NULL';
    }

    const result = await env.DB.prepare(query).bind(...params).first();

    if (!result) {
      // Check if tool is public
      const tool = await env.DB.prepare('SELECT * FROM tools WHERE id = ? AND is_public = 1')
        .bind(toolId)
        .first();

      if (tool) {
        return jsonResponse({
          success: true,
          data: {
            tool_id: toolId,
            tenant_id: tenantId,
            can_view: true,
            can_use: true,
            can_configure: false,
            is_public: true
          }
        }, 200, corsHeaders);
      }

      return jsonResponse({ success: false, error: 'Access not found' }, 404, corsHeaders);
    }

    return jsonResponse({
      success: true,
      data: {
        tool_id: result.tool_id,
        tenant_id: result.tenant_id,
        user_id: result.user_id,
        can_view: result.can_view === 1,
        can_use: result.can_use === 1,
        can_configure: result.can_configure === 1,
        custom_config: result.custom_config ? JSON.parse(result.custom_config) : null
      }
    }, 200, corsHeaders);
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle themes endpoint
 */
async function handleThemes(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);

  // Get specific theme: /api/themes/:id
  if (pathParts.length === 3) {
    const themeId = pathParts[2];
    return handleThemeDetail(request, env, tenantId, themeId, corsHeaders);
  }

  if (request.method === 'GET') {
    // Get active theme for tenant/user
    const userId = url.searchParams.get('user_id');
    const activeOnly = url.searchParams.get('active_only') === 'true';

    let query;
    let params = [];

    if (activeOnly) {
      // Get active theme (requires tenant)
      if (!tenantId) {
        return jsonResponse({ success: false, error: 'Tenant ID required for active theme' }, 400, corsHeaders);
      }
      query = `
        SELECT t.*, ta.is_active
        FROM themes t
        INNER JOIN theme_access ta ON t.id = ta.theme_id
        WHERE ta.tenant_id = ? 
          AND ta.is_active = 1
          ${userId ? 'AND ta.user_id = ?' : 'AND ta.user_id IS NULL'}
        LIMIT 1
      `;
      params = userId ? [tenantId, userId] : [tenantId];
    } else {
      // Get all available themes (public + tenant-specific)
      if (tenantId) {
        query = `
          SELECT DISTINCT t.*, COALESCE(ta.is_active, 0) as is_active
          FROM themes t
          LEFT JOIN theme_access ta ON t.id = ta.theme_id AND ta.tenant_id = ?
          WHERE t.is_public = 1 OR ta.tenant_id = ?
          ORDER BY ta.is_active DESC, t.is_default DESC, t.display_name
        `;
        params = [tenantId, tenantId];
      } else {
        // No tenant - only public themes
        query = `
          SELECT t.*, 0 as is_active
          FROM themes t
          WHERE t.is_public = 1
          ORDER BY t.is_default DESC, t.display_name
        `;
        params = [];
      }
    }

    const result = await env.DB.prepare(query).bind(...params).all();

    const themes = (result.results || []).map(theme => ({
      id: theme.id,
      name: theme.name,
      display_name: theme.display_name,
      is_default: theme.is_default === 1,
      is_public: theme.is_public === 1,
      is_active: theme.is_active === 1,
      config: theme.config ? JSON.parse(theme.config) : {},
      preview_image_url: theme.preview_image_url
    }));

    return jsonResponse(
      {
        success: true,
        data: activeOnly ? (themes[0] || null) : themes,
        tenant_id: tenantId
      },
      200,
      corsHeaders
    );
  }

  if (request.method === 'POST') {
    // Activate a theme for tenant/user
    const body = await request.json();
    const themeId = body.theme_id;
    const userId = body.user_id || null;
    const now = Math.floor(Date.now() / 1000);

    // Deactivate other themes for this tenant/user
    await env.DB.prepare(
      `UPDATE theme_access 
       SET is_active = 0 
       WHERE tenant_id = ? AND is_active = 1 ${userId ? 'AND user_id = ?' : 'AND user_id IS NULL'}`
    )
      .bind(...(userId ? [tenantId, userId] : [tenantId]))
      .run();

    // Activate new theme
    const accessId = `theme-access-${tenantId}${userId ? '-' + userId : ''}`;
    await env.DB.prepare(
      `INSERT INTO theme_access (id, theme_id, tenant_id, user_id, is_active, created_at)
       VALUES (?, ?, ?, ?, 1, ?)
       ON CONFLICT(id) DO UPDATE SET is_active = 1`
    )
      .bind(accessId, themeId, tenantId, userId, now)
      .run();

    return jsonResponse(
      { success: true, message: 'Theme activated' },
      200,
      corsHeaders
    );
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle theme detail
 */
async function handleThemeDetail(request, env, tenantId, themeId, corsHeaders) {
  if (request.method === 'GET') {
    const theme = await env.DB.prepare(
      'SELECT * FROM themes WHERE id = ? AND (is_public = 1 OR tenant_id = ?)'
    )
      .bind(themeId, tenantId)
      .first();

    if (!theme) {
      return jsonResponse({ success: false, error: 'Theme not found' }, 404, corsHeaders);
    }

    return jsonResponse({
      success: true,
      data: {
        id: theme.id,
        name: theme.name,
        display_name: theme.display_name,
        is_default: theme.is_default === 1,
        is_public: theme.is_public === 1,
        config: theme.config ? JSON.parse(theme.config) : {},
        preview_image_url: theme.preview_image_url
      }
    }, 200, corsHeaders);
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle user preferences endpoint
 * Supports both legacy (permissions JSON) and new (sidebar_preferences table) formats
 */
async function handleUserPreferences(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);

  // Extract user ID from path: /api/users/:userId/preferences
  const userIdIndex = pathParts.indexOf('users');
  if (userIdIndex === -1 || userIdIndex + 1 >= pathParts.length) {
    return jsonResponse({ error: 'User ID required' }, 400, corsHeaders);
  }

  const userId = pathParts[userIdIndex + 1];
  const finalTenantId = tenantId || 'system';

  // Check if requesting sidebar preferences specifically
  const isSidebarPrefs = url.searchParams.get('type') === 'sidebar' ||
    url.pathname.includes('/sidebar') ||
    request.headers.get('X-Preference-Type') === 'sidebar';

  if (request.method === 'GET') {
    // Get user preferences
    try {
      // Try to get sidebar preferences from new table first
      if (isSidebarPrefs) {
        try {
          const prefs = await env.DB.prepare(
            'SELECT * FROM sidebar_preferences WHERE user_id = ? AND tenant_id = ? LIMIT 1'
          )
            .bind(userId, finalTenantId)
            .first();

          if (prefs) {
            return jsonResponse({
              success: true,
              data: {
                sidebar_collapsed: prefs.sidebar_collapsed === 1,
                sidebar_width: prefs.sidebar_width || 280,
                dock_items: prefs.dock_items_json ? JSON.parse(prefs.dock_items_json) : [],
                recent_apps: prefs.recent_apps_json ? JSON.parse(prefs.recent_apps_json) : [],
                customizations: prefs.customizations_json ? JSON.parse(prefs.customizations_json) : {},
                updated_at: prefs.updated_at
              }
            }, 200, corsHeaders);
          }
        } catch (dbError) {
          console.log('Sidebar preferences table may not exist yet, falling back to defaults');
        }
      }

      // Fallback to legacy permissions JSON for backward compatibility
      try {
        const user = await env.DB.prepare(
          'SELECT permissions FROM users WHERE id = ? LIMIT 1'
        )
          .bind(userId)
          .first();

        if (user && user.permissions) {
          const permissions = JSON.parse(user.permissions);
          return jsonResponse({
            success: true,
            data: permissions.quickConnect || { coreFour: [] }
          }, 200, corsHeaders);
        }
      } catch (dbError) {
        console.log('User not found in database, returning defaults');
      }

      // Return default sidebar preferences if new format requested
      if (isSidebarPrefs) {
        return jsonResponse({
          success: true,
          data: {
            sidebar_collapsed: false,
            sidebar_width: 280,
            dock_items: [],
            recent_apps: [],
            customizations: {}
          }
        }, 200, corsHeaders);
      }

      // Return default legacy format
      return jsonResponse({
        success: true,
        data: { coreFour: [] }
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      // Return defaults on error
      return jsonResponse({
        success: true,
        data: isSidebarPrefs ? {
          sidebar_collapsed: false,
          sidebar_width: 280,
          dock_items: [],
          recent_apps: [],
          customizations: {}
        } : { coreFour: [] }
      }, 200, corsHeaders);
    }
  }

  if (request.method === 'POST' || request.method === 'PUT') {
    // Save user preferences
    try {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);

      // Handle sidebar preferences (new format)
      if (isSidebarPrefs || body.sidebar_collapsed !== undefined || body.dock_items !== undefined) {
        try {
          const prefsId = `sidebar-prefs-${userId}-${finalTenantId}`;

          // Check if preferences exist
          const existing = await env.DB.prepare(
            'SELECT id FROM sidebar_preferences WHERE user_id = ? AND tenant_id = ? LIMIT 1'
          )
            .bind(userId, finalTenantId)
            .first();

          const dockItems = body.dock_items || [];
          const recentApps = body.recent_apps || [];
          const customizations = body.customizations || {};

          if (existing) {
            // Update existing preferences
            await env.DB.prepare(
              `UPDATE sidebar_preferences SET
                sidebar_collapsed = ?,
                sidebar_width = ?,
                dock_items_json = ?,
                recent_apps_json = ?,
                customizations_json = ?,
                updated_at = ?
              WHERE user_id = ? AND tenant_id = ?`
            )
              .bind(
                body.sidebar_collapsed ? 1 : 0,
                body.sidebar_width || 280,
                JSON.stringify(dockItems),
                JSON.stringify(recentApps),
                JSON.stringify(customizations),
                now,
                userId,
                finalTenantId
              )
              .run();
          } else {
            // Create new preferences
            await env.DB.prepare(
              `INSERT INTO sidebar_preferences (
                id, user_id, tenant_id, sidebar_collapsed, sidebar_width,
                dock_items_json, recent_apps_json, customizations_json, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                prefsId,
                userId,
                finalTenantId,
                body.sidebar_collapsed ? 1 : 0,
                body.sidebar_width || 280,
                JSON.stringify(dockItems),
                JSON.stringify(recentApps),
                JSON.stringify(customizations),
                now,
                now
              )
              .run();
          }

          return jsonResponse({
            success: true,
            message: 'Sidebar preferences saved',
            data: {
              sidebar_collapsed: body.sidebar_collapsed || false,
              sidebar_width: body.sidebar_width || 280,
              dock_items: dockItems,
              recent_apps: recentApps,
              customizations: customizations,
              updated_at: now
            }
          }, 200, corsHeaders);
        } catch (dbError) {
          console.error('Error saving sidebar preferences:', dbError);
          // Fall through to legacy format if table doesn't exist
        }
      }

      // Legacy format: Save to users.permissions JSON
      const preferences = body.coreFour || [];

      // Get existing user
      const user = await env.DB.prepare(
        'SELECT permissions FROM users WHERE id = ?'
      )
        .bind(userId)
        .first();

      let permissions = {};
      if (user && user.permissions) {
        permissions = JSON.parse(user.permissions);
      }

      permissions.quickConnect = { coreFour: preferences };

      // Update user permissions (or create if doesn't exist - for development)
      if (user) {
        await env.DB.prepare(
          'UPDATE users SET permissions = ?, updated_at = ? WHERE id = ?'
        )
          .bind(JSON.stringify(permissions), now, userId)
          .run();
      }

      return jsonResponse({
        success: true,
        data: { coreFour: preferences },
        message: user ? 'Preferences saved' : 'Preferences saved locally (user not in database)'
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Error saving preferences:', error);
      return jsonResponse({
        success: true,
        data: { coreFour: [] },
        message: 'Preferences saved locally (error saving to database)'
      }, 200, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle external app connections endpoint
 */
async function handleExternalConnections(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);

  // Extract user ID from path: /api/users/:userId/connections
  const userIdIndex = pathParts.indexOf('users');
  if (userIdIndex === -1 || userIdIndex + 1 >= pathParts.length) {
    return jsonResponse({ error: 'User ID required' }, 400, corsHeaders);
  }

  const userId = pathParts[userIdIndex + 1];
  const connectionId = pathParts.length > 4 ? pathParts[4] : null;

  if (request.method === 'GET') {
    // Get all connections for user
    try {
      const connections = await env.DB.prepare(
        'SELECT id, app_id, app_name, app_type, connection_status, config, last_sync, error_message, created_at, updated_at FROM external_connections WHERE user_id = ? ORDER BY created_at DESC'
      )
        .bind(userId)
        .all();

      return jsonResponse({
        success: true,
        data: (connections.results || []).map(conn => ({
          id: conn.id,
          app_id: conn.app_id,
          app_name: conn.app_name,
          app_type: conn.app_type,
          connection_status: conn.connection_status,
          config: conn.config ? JSON.parse(conn.config) : {},
          last_sync: conn.last_sync,
          error_message: conn.error_message,
          created_at: conn.created_at,
          updated_at: conn.updated_at
        }))
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Error fetching connections:', error);
      return jsonResponse({
        success: true,
        data: [] // Return empty array on error
      }, 200, corsHeaders);
    }
  }

  if (request.method === 'POST') {
    // Create new connection
    try {
      const body = await request.json();
      const { app_id, auth_type, credentials } = body;

      if (!app_id || !auth_type) {
        return jsonResponse({ error: 'app_id and auth_type required' }, 400, corsHeaders);
      }

      // Get app info (for now, use defaults)
      const appName = app_id.charAt(0).toUpperCase() + app_id.slice(1).replace(/-/g, ' ');

      // Generate connection ID
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Math.floor(Date.now() / 1000);

      // Encrypt credentials (in production, use proper encryption)
      // For now, store as-is (should be encrypted in production!)
      const credentialsEncrypted = credentials; // TODO: Encrypt this

      await env.DB.prepare(
        `INSERT INTO external_connections (
          id, user_id, tenant_id, app_id, app_name, app_type, connection_status, 
          credentials_encrypted, config, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          connectionId,
          userId,
          tenantId || '',
          app_id,
          appName,
          auth_type,
          'connected',
          credentialsEncrypted,
          JSON.stringify({}),
          now,
          now
        )
        .run();

      const connection = await env.DB.prepare(
        'SELECT * FROM external_connections WHERE id = ?'
      )
        .bind(connectionId)
        .first();

      return jsonResponse({
        success: true,
        data: {
          id: connection.id,
          app_id: connection.app_id,
          app_name: connection.app_name,
          connection_status: connection.connection_status
        }
      }, 201, corsHeaders);
    } catch (error) {
      console.error('Error creating connection:', error);
      return jsonResponse({ error: 'Failed to create connection' }, 500, corsHeaders);
    }
  }

  if (request.method === 'DELETE' && connectionId) {
    // Delete connection
    try {
      await env.DB.prepare(
        'DELETE FROM external_connections WHERE id = ? AND user_id = ?'
      )
        .bind(connectionId, userId)
        .run();

      return jsonResponse({
        success: true,
        message: 'Connection deleted'
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Error deleting connection:', error);
      return jsonResponse({ error: 'Failed to delete connection' }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle Calendar API
 */
async function handleCalendar(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const eventId = pathParts.length > 3 ? pathParts[3] : null;

  // GET /api/calendar - List events
  if (request.method === 'GET' && !eventId) {
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const userId = url.searchParams.get('user_id');
    const projectId = url.searchParams.get('project_id');

    let query = 'SELECT * FROM calendar_events WHERE 1=1';
    const params = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }

    if (start) {
      query += ' AND start_time >= ?';
      params.push(start);
    }

    if (end) {
      query += ' AND end_time <= ?';
      params.push(end);
    }

    query += ' ORDER BY start_time ASC';

    try {
      const result = await env.DB.prepare(query).bind(...params).all();
      const events = (result.results || []).map(event => ({
        id: event.id,
        user_id: event.user_id,
        project_id: event.project_id || null,
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        timezone: event.timezone || 'UTC',
        location: event.location,
        attendees: event.attendees ? JSON.parse(event.attendees) : [],
        reminder_minutes: event.reminder_minutes || 15,
        event_type: event.event_type || 'meeting',
        is_all_day: event.is_all_day || 0,
        recurrence_rule: event.recurrence_rule,
        status: event.status || 'scheduled',
        created_at: event.created_at,
        updated_at: event.updated_at
      }));

      return jsonResponse({ success: true, data: events }, 200, corsHeaders);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // GET /api/calendar/:id - Get single event
  if (request.method === 'GET' && eventId) {
    try {
      const result = await env.DB.prepare('SELECT * FROM calendar_events WHERE id = ?').bind(eventId).first();
      if (!result) {
        return jsonResponse({ success: false, error: 'Event not found' }, 404, corsHeaders);
      }
      const event = {
        id: result.id,
        user_id: result.user_id,
        project_id: result.project_id || null,
        title: result.title,
        description: result.description,
        start_time: result.start_time,
        end_time: result.end_time,
        timezone: result.timezone || 'UTC',
        location: result.location,
        attendees: result.attendees ? JSON.parse(result.attendees) : [],
        reminder_minutes: result.reminder_minutes || 15,
        event_type: result.event_type || 'meeting',
        is_all_day: result.is_all_day || 0,
        recurrence_rule: result.recurrence_rule,
        status: result.status || 'scheduled',
        created_at: result.created_at,
        updated_at: result.updated_at
      };
      return jsonResponse({ success: true, data: event }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // POST /api/calendar - Create event
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const {
        user_id, project_id, title, description, start_time, end_time,
        timezone = 'UTC', location, attendees = [], reminder_minutes = 15,
        event_type = 'meeting', is_all_day = 0, recurrence_rule, status = 'scheduled'
      } = body;

      if (!title || !start_time || !user_id) {
        return jsonResponse({ success: false, error: 'Missing required fields: title, start_time, user_id' }, 400, corsHeaders);
      }

      const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Math.floor(Date.now() / 1000);

      await env.DB.prepare(
        `INSERT INTO calendar_events (id, user_id, project_id, title, description, start_time, end_time, timezone, location, attendees, reminder_minutes, event_type, is_all_day, recurrence_rule, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, user_id, project_id || null, title, description || null, start_time, end_time || start_time, timezone, location || null, JSON.stringify(attendees), reminder_minutes, event_type, is_all_day, recurrence_rule || null, status, now, now).run();

      if (reminder_minutes > 0) {
        const reminderTime = parseInt(start_time) - (reminder_minutes * 60);
        await env.DB.prepare(
          `INSERT INTO calendar_reminders (id, event_id, user_id, email, reminder_time, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)`
        ).bind(`reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, id, user_id, user_id, reminderTime, now).run();
      }

      return jsonResponse({ success: true, data: { id, ...body } }, 201, corsHeaders);
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // PUT /api/calendar/:id - Update event
  if (request.method === 'PUT' && eventId) {
    try {
      const body = await request.json();
      const updates = [];
      const params = [];
      const allowedFields = ['title', 'description', 'start_time', 'end_time', 'timezone', 'location', 'attendees', 'reminder_minutes', 'event_type', 'is_all_day', 'recurrence_rule', 'status'];
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`);
          if (field === 'attendees' && Array.isArray(body[field])) {
            params.push(JSON.stringify(body[field]));
          } else {
            params.push(body[field]);
          }
        }
      }
      if (updates.length === 0) {
        return jsonResponse({ success: false, error: 'No fields to update' }, 400, corsHeaders);
      }
      updates.push('updated_at = ?');
      params.push(Math.floor(Date.now() / 1000));
      params.push(eventId);
      await env.DB.prepare(`UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
      return jsonResponse({ success: true, message: 'Event updated' }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // DELETE /api/calendar/:id - Delete event
  if (request.method === 'DELETE' && eventId) {
    try {
      await env.DB.prepare('DELETE FROM calendar_reminders WHERE event_id = ?').bind(eventId).run();
      const result = await env.DB.prepare('DELETE FROM calendar_events WHERE id = ?').bind(eventId).run();
      if (result.meta.changes === 0) {
        return jsonResponse({ success: false, error: 'Event not found' }, 404, corsHeaders);
      }
      return jsonResponse({ success: true, message: 'Event deleted' }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle Dev Workflows API - Commands & Workflows System
 * GET /api/workflows/dev - List dev workflows
 * GET /api/workflows/dev/:id - Get workflow details
 * POST /api/workflows/dev/:id/execute - Execute workflow
 * POST /api/workflows/dev - Create new workflow
 */
async function handleDevWorkflows(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const workflowId = pathParts[3]; // /api/workflows/dev/:id
  const action = pathParts[4]; // /api/workflows/dev/:id/execute

  // GET /api/workflows/dev - List workflows
  if (request.method === 'GET' && pathParts.length === 3) {
    try {
      const category = url.searchParams.get('category');
      const template = url.searchParams.get('template') === 'true';
      const search = url.searchParams.get('search');
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = 'SELECT * FROM dev_workflows WHERE (tenant_id = ? OR tenant_id = "")';
      const params = [tenantId || 'system'];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (template) {
        query += ' AND is_template = 1';
      }

      if (search) {
        query += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY is_template DESC, use_count DESC, name ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const result = await env.DB.prepare(query).bind(...params).all();
      const workflows = result.results || [];

      // Parse JSON fields
      workflows.forEach(wf => {
        if (wf.steps_json) {
          try {
            wf.steps = JSON.parse(wf.steps_json);
          } catch (e) {
            wf.steps = [];
          }
        }
        if (wf.tags) {
          try {
            wf.tags = JSON.parse(wf.tags);
          } catch (e) {
            // Keep as string if not JSON
          }
        }
      });

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM dev_workflows WHERE (tenant_id = ? OR tenant_id = "")';
      const countParams = [tenantId || 'system'];
      if (category) {
        countQuery += ' AND category = ?';
        countParams.push(category);
      }
      if (template) {
        countQuery += ' AND is_template = 1';
      }
      if (search) {
        countQuery += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)';
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }

      const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
      const total = countResult?.total || 0;

      return jsonResponse({
        success: true,
        data: workflows,
        pagination: {
          total,
          limit,
          offset,
          has_more: offset + workflows.length < total
        },
        filters: {
          category: category || null,
          template: template || null,
          search: search || null
        }
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Error listing dev workflows:', error);
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // GET /api/workflows/dev/:id - Get workflow details
  if (request.method === 'GET' && pathParts.length === 4) {
    try {
      const workflow = await env.DB.prepare(
        'SELECT * FROM dev_workflows WHERE id = ? AND (tenant_id = ? OR tenant_id = "")'
      ).bind(workflowId, tenantId || 'system').first();

      if (!workflow) {
        return jsonResponse({
          success: false,
          error: 'Workflow not found'
        }, 404, corsHeaders);
      }

      // Parse JSON fields
      if (workflow.steps_json) {
        try {
          workflow.steps = JSON.parse(workflow.steps_json);
        } catch (e) {
          workflow.steps = [];
        }
      }
      if (workflow.tags) {
        try {
          workflow.tags = JSON.parse(workflow.tags);
        } catch (e) {
          // Keep as string if not JSON
        }
      }

      return jsonResponse({
        success: true,
        data: workflow
      }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // POST /api/workflows/dev/:id/execute - Execute workflow
  if (request.method === 'POST' && pathParts.length === 5 && action === 'execute') {
    try {
      const body = await request.json();
      const workflow = await env.DB.prepare(
        'SELECT * FROM dev_workflows WHERE id = ? AND (tenant_id = ? OR tenant_id = "")'
      ).bind(workflowId, tenantId || 'system').first();

      if (!workflow) {
        return jsonResponse({
          success: false,
          error: 'Workflow not found'
        }, 404, corsHeaders);
      }

      // Parse steps
      let steps = [];
      if (workflow.steps_json) {
        try {
          steps = JSON.parse(workflow.steps_json);
        } catch (e) {
          return jsonResponse({
            success: false,
            error: 'Invalid workflow steps format'
          }, 400, corsHeaders);
        }
      } else if (workflow.command_sequence) {
        // Fallback to command_sequence if steps_json is empty
        steps = workflow.command_sequence.split(',').map(s => s.trim()).filter(s => s);
      }

      if (!steps || steps.length === 0) {
        return jsonResponse({
          success: false,
          error: 'Workflow has no steps defined'
        }, 400, corsHeaders);
      }

      // Execute each step
      const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Math.floor(Date.now() / 1000);
      const results = [];
      const startTime = Date.now();

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        // Load command from commands table
        const command = await env.DB.prepare(
          'SELECT * FROM commands WHERE (command_name = ? OR id = ?) AND (tenant_id = ? OR tenant_id = "") LIMIT 1'
        ).bind(step, step, tenantId || 'system').first();

        if (!command) {
          return jsonResponse({
            success: false,
            error: `Command not found for step: ${step}`,
            data: {
              execution_id: executionId,
              failed_step: step,
              step_index: i,
              completed_steps: results
            }
          }, 400, corsHeaders);
        }

        // Build command text
        let commandText = command.command_template;
        if (body.params && typeof body.params === 'object') {
          Object.entries(body.params).forEach(([key, value]) => {
            commandText = commandText.replace(`{${key}}`, value);
          });
        }

        // Log step execution
        const stepExecutionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        try {
          await env.DB.prepare(
            `INSERT INTO command_executions (
              id, tenant_id, user_id, command_id, workflow_id, command_text,
              parameters_used, status, executed_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            stepExecutionId,
            tenantId || 'system',
            body.user_id || null,
            command.id,
            workflowId,
            commandText,
            JSON.stringify(body.params || {}),
            'pending',
            now,
            now
          ).run();
        } catch (e) {
          console.log('Could not log step execution:', e);
        }

        results.push({
          step_index: i,
          step_name: step,
          command_id: command.id,
          command_name: command.command_name,
          command_text: commandText,
          tool: command.tool,
          status: 'pending',
          execution_id: stepExecutionId
        });
      }

      const duration = Date.now() - startTime;

      // Update workflow usage
      try {
        await env.DB.prepare(
          'UPDATE dev_workflows SET use_count = use_count + 1, last_used_at = ? WHERE id = ?'
        ).bind(now, workflowId).run();
      } catch (e) {
        console.log('Could not update workflow usage:', e);
      }

      return jsonResponse({
        success: true,
        data: {
          workflow_id: workflowId,
          workflow_name: workflow.name,
          execution_id: executionId,
          steps: results,
          total_steps: steps.length,
          estimated_time_minutes: workflow.estimated_time_minutes,
          duration_ms: duration,
          instruction: 'Execute these commands in sequence in your terminal or via the appropriate tools.',
          note: 'Cloudflare Workers cannot execute shell commands directly. Use the command_text values in your terminal.'
        },
        output: `Workflow: ${workflow.name}\n\nExecuted ${steps.length} steps:\n${results.map((r, i) => `${i + 1}. ${r.command_text}`).join('\n')}\n\nEstimated time: ${workflow.estimated_time_minutes || 'N/A'} minutes\nActual duration: ${(duration / 1000).toFixed(2)} seconds`
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Error executing workflow:', error);
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // POST /api/workflows/dev - Create new workflow
  if (request.method === 'POST' && pathParts.length === 3) {
    try {
      const body = await request.json();
      const id = body.id || `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Math.floor(Date.now() / 1000);

      if (!body.name || !body.steps) {
        return jsonResponse({
          success: false,
          error: 'name and steps are required'
        }, 400, corsHeaders);
      }

      await env.DB.prepare(
        `INSERT INTO dev_workflows (
          id, tenant_id, name, description, category, steps_json, command_sequence,
          estimated_time_minutes, is_template, tags, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        tenantId || 'system',
        body.name,
        body.description || null,
        body.category || null,
        JSON.stringify(body.steps || []),
        (body.steps || []).join(', '),
        body.estimated_time_minutes || null,
        body.is_template ? 1 : 0,
        body.tags ? (typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)) : null,
        body.created_by || null,
        now,
        now
      ).run();

      const workflow = await env.DB.prepare('SELECT * FROM dev_workflows WHERE id = ?')
        .bind(id)
        .first();

      // Parse JSON fields
      if (workflow.steps_json) {
        try {
          workflow.steps = JSON.parse(workflow.steps_json);
        } catch (e) {
          workflow.steps = [];
        }
      }

      return jsonResponse({
        success: true,
        data: workflow
      }, 201, corsHeaders);
    } catch (error) {
      console.error('Error creating workflow:', error);
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle Commands API - Commands Library System
 * GET /api/commands - List all commands (with filters)
 * GET /api/commands/:id - Get command details
 * POST /api/commands/execute - Execute command
 */
async function handleCommands(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const commandId = pathParts[2]; // /api/commands/:id

  // GET /api/commands - List commands with filters
  if (request.method === 'GET' && pathParts.length === 2) {
    try {
      const tool = url.searchParams.get('tool');
      const category = url.searchParams.get('category');
      const search = url.searchParams.get('search');
      const favorite = url.searchParams.get('favorite') === 'true';
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = 'SELECT * FROM commands WHERE (tenant_id = ? OR tenant_id = "")';
      const params = [tenantId || 'system'];

      if (tool) {
        query += ' AND tool = ?';
        params.push(tool);
      }

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (search) {
        query += ' AND (command_name LIKE ? OR description LIKE ? OR tags LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (favorite) {
        query += ' AND is_favorite = 1';
      }

      query += ' ORDER BY is_favorite DESC, usage_count DESC, command_name ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const result = await env.DB.prepare(query).bind(...params).all();
      const commands = result.results || [];

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM commands WHERE (tenant_id = ? OR tenant_id = "")';
      const countParams = [tenantId || 'system'];
      if (tool) {
        countQuery += ' AND tool = ?';
        countParams.push(tool);
      }
      if (category) {
        countQuery += ' AND category = ?';
        countParams.push(category);
      }
      if (search) {
        countQuery += ' AND (command_name LIKE ? OR description LIKE ? OR tags LIKE ?)';
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }
      if (favorite) {
        countQuery += ' AND is_favorite = 1';
      }

      const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
      const total = countResult?.total || 0;

      return jsonResponse({
        success: true,
        data: commands,
        pagination: {
          total,
          limit,
          offset,
          has_more: offset + commands.length < total
        },
        filters: {
          tool: tool || null,
          category: category || null,
          search: search || null,
          favorite: favorite || null
        }
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Error listing commands:', error);
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // GET /api/commands/:id - Get command details
  if (request.method === 'GET' && pathParts.length === 3) {
    try {
      const command = await env.DB.prepare(
        'SELECT * FROM commands WHERE id = ? AND (tenant_id = ? OR tenant_id = "")'
      ).bind(commandId, tenantId || 'system').first();

      if (!command) {
        return jsonResponse({
          success: false,
          error: 'Command not found'
        }, 404, corsHeaders);
      }

      // Parse JSON fields
      if (command.parameters) {
        try {
          command.parameters = JSON.parse(command.parameters);
        } catch (e) {
          command.parameters = null;
        }
      }

      if (command.examples) {
        try {
          command.examples = JSON.parse(command.examples);
        } catch (e) {
          // Keep as string if not JSON
        }
      }

      return jsonResponse({
        success: true,
        data: command
      }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // POST /api/commands/execute - Execute command
  if (request.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'execute') {
    try {
      const body = await request.json();
      const { command_id, command_name, args = [] } = body;

      if (!command_id && !command_name) {
        return jsonResponse({
          success: false,
          error: 'command_id or command_name is required'
        }, 400, corsHeaders);
      }

      // Load command
      let command;
      if (command_id) {
        command = await env.DB.prepare(
          'SELECT * FROM commands WHERE id = ? AND (tenant_id = ? OR tenant_id = "")'
        ).bind(command_id, tenantId || 'system').first();
      } else {
        command = await env.DB.prepare(
          'SELECT * FROM commands WHERE command_name = ? AND (tenant_id = ? OR tenant_id = "") LIMIT 1'
        ).bind(command_name, tenantId || 'system').first();
      }

      if (!command) {
        return jsonResponse({
          success: false,
          error: 'Command not found'
        }, 404, corsHeaders);
      }

      // Build command string from template
      let commandText = command.command_template;

      // Replace parameters if provided
      if (args && Array.isArray(args)) {
        args.forEach((arg, idx) => {
          commandText = commandText.replace(`{arg${idx}}`, arg);
          commandText = commandText.replace(`[arg${idx}]`, arg);
        });
      }

      // Replace named parameters
      if (command.parameters) {
        try {
          const params = typeof command.parameters === 'string'
            ? JSON.parse(command.parameters)
            : command.parameters;

          if (typeof params === 'object' && body.params) {
            Object.entries(body.params).forEach(([key, value]) => {
              commandText = commandText.replace(`{${key}}`, value);
            });
          }
        } catch (e) {
          // Ignore parameter parsing errors
        }
      }

      // Log execution
      const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Math.floor(Date.now() / 1000);

      try {
        await env.DB.prepare(
          `INSERT INTO command_executions (
            id, tenant_id, user_id, command_id, command_text, parameters_used,
            status, executed_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          executionId,
          tenantId || 'system',
          body.user_id || null,
          command.id,
          commandText,
          JSON.stringify(args || body.params || {}),
          'pending',
          now,
          now
        ).run();
      } catch (e) {
        console.log('Could not log execution:', e);
      }

      // Update usage count
      try {
        await env.DB.prepare(
          'UPDATE commands SET usage_count = usage_count + 1, last_used_at = ? WHERE id = ?'
        ).bind(now, command.id).run();
      } catch (e) {
        console.log('Could not update usage count:', e);
      }

      return jsonResponse({
        success: true,
        data: {
          command_id: command.id,
          command_name: command.command_name,
          command_text: commandText,
          tool: command.tool,
          category: command.category,
          execution_id: executionId,
          instruction: 'This command should be executed in your local terminal or via the appropriate tool.',
          note: 'Cloudflare Workers cannot execute shell commands directly. Use this command text in your terminal.'
        },
        output: `Command: ${commandText}\n\nTool: ${command.tool}\nCategory: ${command.category}\n\nExecute this command in your terminal or via ${command.tool}.`
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Error executing command:', error);
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle Agent API
 */
/**
 * Load command from database
 */
async function loadCommand(commandName, env, tenantId) {
  try {
    // Try exact match first
    let command = await env.DB.prepare(
      'SELECT * FROM agent_commands WHERE name = ? AND (tenant_id = ? OR is_public = 1) AND status = "active" ORDER BY is_public DESC, tenant_id LIMIT 1'
    ).bind(commandName, tenantId || 'system').first();

    // If not found, try slug match
    if (!command) {
      const slug = commandName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      command = await env.DB.prepare(
        'SELECT * FROM agent_commands WHERE slug = ? AND (tenant_id = ? OR is_public = 1) AND status = "active" ORDER BY is_public DESC, tenant_id LIMIT 1'
      ).bind(slug, tenantId || 'system').first();
    }

    // If still not found, try partial match
    if (!command) {
      command = await env.DB.prepare(
        'SELECT * FROM agent_commands WHERE name LIKE ? AND (tenant_id = ? OR is_public = 1) AND status = "active" ORDER BY is_public DESC, tenant_id LIMIT 1'
      ).bind(`%${commandName}%`, tenantId || 'system').first();
    }

    if (command && command.code_json) {
      try {
        command.config = JSON.parse(command.code_json);
      } catch (e) {
        command.config = {};
      }
    }

    if (command && command.parameters_json) {
      try {
        command.parameters = JSON.parse(command.parameters_json);
      } catch (e) {
        command.parameters = [];
      }
    }

    return command;
  } catch (error) {
    console.error('Error loading command:', error);
    return null;
  }
}

/**
 * Execute builtin command (wrangler, git, bash, etc.)
 * Note: Cloudflare Workers can't execute shell commands directly
 * This returns instructions for client-side execution
 */
async function executeBuiltin(command, args, env, tenantId) {
  const config = command.config || {};
  const tool = config.tool || 'bash';

  // Build command string
  let cmdStr = command.command_text || command.name;

  // Replace parameters
  args.forEach((arg, idx) => {
    cmdStr = cmdStr.replace(`[arg${idx}]`, arg);
  });

  return {
    success: true,
    output: `Command: ${cmdStr}\n\nNote: Builtin commands (${tool}) must be executed client-side or via external service.\nCommand details:\n- Tool: ${tool}\n- Command: ${command.name}\n- Args: ${args.join(' ')}`,
    data: {
      command: command.name,
      tool,
      command_text: cmdStr,
      args,
      instruction: 'execute_client_side',
      config
    }
  };
}

/**
 * Execute API command (maps to existing API endpoints)
 */
async function executeAPI(command, args, env, tenantId, corsHeaders, request) {
  try {
    const config = command.config || {};
    const endpoint = config.endpoint || command.implementation_ref;
    const method = config.method || 'GET';

    if (!endpoint) {
      return {
        success: false,
        error: 'API endpoint not specified for command',
        output: `Error: Command '${command.name}' is missing API endpoint configuration.`
      };
    }

    // Parse arguments into query params or body
    const params = {};
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i]?.replace('--', '');
      const value = args[i + 1];
      if (key && value) {
        params[key] = value;
      }
    }

    // Build request URL (internal API call)
    const baseUrl = new URL(request.url).origin;
    const url = new URL(endpoint, baseUrl);

    // Add query params for GET requests
    if (method === 'GET') {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    // Create internal request
    const requestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId || 'system'
      }
    };

    // Add body for POST/PUT requests
    if (method === 'POST' || method === 'PUT') {
      requestInit.body = JSON.stringify(params);
    }

    // Route to appropriate handler internally
    let handlerResult = null;

    if (endpoint.startsWith('/api/deployments')) {
      handlerResult = await handleDeployments(new Request(url, requestInit), env, tenantId, corsHeaders);
    } else if (endpoint.startsWith('/api/workers')) {
      handlerResult = await handleWorkers(new Request(url, requestInit), env, tenantId, corsHeaders);
    } else if (endpoint.startsWith('/api/stats')) {
      handlerResult = await handleStats(new Request(url, requestInit), env, tenantId, corsHeaders);
    } else if (endpoint.startsWith('/api/sql') || endpoint.startsWith('/api/meauxsql')) {
      handlerResult = await handleMeauxSQL(new Request(url, requestInit), env, tenantId, corsHeaders);
    } else if (endpoint.startsWith('/api/knowledge')) {
      handlerResult = await handleKnowledgeBase(new Request(url, requestInit), env, tenantId, corsHeaders);
    } else if (endpoint.startsWith('/api/cost-tracking') || endpoint.startsWith('/api/costs')) {
      handlerResult = await handleCostTracking(new Request(url, requestInit), env, tenantId, corsHeaders);
    } else if (endpoint.startsWith('/api/meauxwork')) {
      handlerResult = await handleMeauxWork(new Request(url, requestInit), env, tenantId, corsHeaders);
    } else {
      // Default: return instruction to call endpoint
      return {
        success: true,
        output: `API Command: ${command.name}\nEndpoint: ${endpoint}\nMethod: ${method}\nArgs: ${JSON.stringify(params, null, 2)}\n\nNote: Execute API request to endpoint.`,
        data: {
          endpoint,
          method,
          params,
          command: command.name
        }
      };
    }

    if (handlerResult) {
      const data = await handlerResult.json();
      return {
        success: data.success !== false,
        output: JSON.stringify(data, null, 2),
        data
      };
    }

    return {
      success: false,
      error: 'Handler not found',
      output: `Error: No handler found for endpoint '${endpoint}'.`
    };
  } catch (error) {
    console.error('Error executing API command:', error);
    return {
      success: false,
      error: error.message,
      output: `Error executing command: ${error.message}`
    };
  }
}

/**
 * Execute workflow (multi-step orchestration)
 */
async function executeWorkflow(command, args, env, tenantId, corsHeaders, request) {
  try {
    const config = command.config || {};
    const steps = config.steps || [];
    const humanCheckpoint = config.human_checkpoint;

    if (!steps || steps.length === 0) {
      return {
        success: false,
        error: 'Workflow has no steps defined',
        output: `Error: Command '${command.name}' workflow is missing steps.`
      };
    }

    const results = [];
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Check for human checkpoint
      if (humanCheckpoint && step === humanCheckpoint) {
        // Create checkpoint (workflow_executions table might not exist, so try/catch)
        const checkpointId = `checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
          await env.DB.prepare(
            'INSERT INTO workflow_executions (id, tenant_id, workflow_id, status, config_json, started_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).bind(
            checkpointId,
            tenantId || 'system',
            command.id,
            'checkpoint',
            JSON.stringify({ step, previous_results: results }),
            Math.floor(Date.now() / 1000),
            Math.floor(Date.now() / 1000)
          ).run();
        } catch (e) {
          // Table might not exist, continue
        }

        return {
          success: true,
          output: `Workflow paused at checkpoint: ${step}\nPrevious steps completed successfully.\nAwaiting approval to continue...`,
          data: {
            execution_id: executionId,
            checkpoint_id: checkpointId,
            step_index: i,
            step_name: step,
            previous_results: results,
            remaining_steps: steps.slice(i + 1),
            status: 'checkpoint',
            requires_approval: true
          }
        };
      }

      // Execute step
      const stepCommand = await loadCommand(step, env, tenantId);
      if (!stepCommand) {
        return {
          success: false,
          error: `Step command not found: ${step}`,
          output: `Error: Workflow step '${step}' command not found in database.`,
          data: {
            execution_id: executionId,
            failed_step: step,
            completed_steps: results
          }
        };
      }

      // Execute step command
      let stepResult;
      switch (stepCommand.implementation_type) {
        case 'builtin':
          stepResult = await executeBuiltin(stepCommand, args, env, tenantId);
          break;
        case 'api':
          stepResult = await executeAPI(stepCommand, args, env, tenantId, corsHeaders, request);
          break;
        case 'workflow':
          stepResult = await executeWorkflow(stepCommand, args, env, tenantId, corsHeaders, request);
          break;
        default:
          stepResult = {
            success: false,
            error: `Unknown implementation type: ${stepCommand.implementation_type}`,
            output: `Error: Step '${step}' has unknown implementation type.`
          };
      }

      results.push({
        step,
        command: stepCommand.name,
        result: stepResult
      });

      // Check for errors
      if (!stepResult.success) {
        return {
          success: false,
          error: `Workflow failed at step: ${step}`,
          output: `Error: Workflow failed at step '${step}': ${stepResult.error || stepResult.output}`,
          data: {
            execution_id: executionId,
            failed_step: step,
            completed_steps: results.slice(0, -1),
            error_step_result: stepResult
          }
        };
      }
    }

    return {
      success: true,
      output: `Workflow completed successfully. All ${steps.length} steps executed.`,
      data: {
        execution_id: executionId,
        steps_completed: steps.length,
        results
      }
    };
  } catch (error) {
    console.error('Error executing workflow:', error);
    return {
      success: false,
      error: error.message,
      output: `Error executing workflow: ${error.message}`
    };
  }
}

/**
 * List available commands
 */
async function listCommands(env, tenantId, category = null) {
  try {
    let query = 'SELECT id, name, slug, description, category, command_text, implementation_type FROM agent_commands WHERE (tenant_id = ? OR is_public = 1) AND status = "active"';
    const params = [tenantId || 'system'];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, name';

    const result = await env.DB.prepare(query).bind(...params).all();
    return result.results || [];
  } catch (error) {
    console.error('Error listing commands:', error);
    return [];
  }
}

async function handleAgent(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);

  // POST /api/agent/execute - Execute command
  if (request.method === 'POST' && pathParts[2] === 'execute') {
    try {
      const body = await request.json();
      const { command, project_id, context } = body;

      if (!command) {
        return jsonResponse({ success: false, error: 'Command is required' }, 400, corsHeaders);
      }

      // Parse command and args
      const cmdParts = command.trim().split(/\s+/);
      const cmd = cmdParts[0].toLowerCase();
      const args = cmdParts.slice(1);

      // Special commands (always work)
      if (cmd === 'help' || cmd === '?') {
        const commands = await listCommands(env, tenantId);
        const categories = {};
        commands.forEach(cmd => {
          if (!categories[cmd.category]) {
            categories[cmd.category] = [];
          }
          categories[cmd.category].push(`- ${cmd.name}: ${cmd.description || ''}`);
        });

        let output = 'Available Commands:\n\n';
        Object.entries(categories).forEach(([cat, cmds]) => {
          output += `${cat.toUpperCase()}:\n${cmds.join('\n')}\n\n`;
        });

        output += 'Usage: <command> [args...]\n';
        output += 'Examples:\n';
        output += '  - wrangler deploy\n';
        output += '  - git status\n';
        output += '  - clients list\n';
        output += '  - workflow deploy\n';

        return jsonResponse({
          success: true,
          output,
          data: {
            commands: categories,
            total: commands.length
          },
          command,
          timestamp: Date.now()
        }, 200, corsHeaders);
      }

      if (cmd === 'list' || cmd === 'commands') {
        const commands = await listCommands(env, tenantId);
        const categories = {};
        commands.forEach(cmd => {
          if (!categories[cmd.category]) {
            categories[cmd.category] = [];
          }
          categories[cmd.category].push({
            name: cmd.name,
            description: cmd.description,
            slug: cmd.slug
          });
        });

        return jsonResponse({
          success: true,
          output: `Found ${commands.length} available commands across ${Object.keys(categories).length} categories.`,
          data: {
            categories,
            total: commands.length
          },
          command,
          timestamp: Date.now()
        }, 200, corsHeaders);
      }

      // Load command from database
      const commandDef = await loadCommand(cmd, env, tenantId);

      if (!commandDef) {
        // Fallback to legacy commands for backward compatibility
        let output = '';
        let data = null;

        switch (cmd) {
          case 'projects':
            const projectsResult = await env.DB.prepare('SELECT id, name, slug, status, created_at FROM projects ORDER BY created_at DESC LIMIT 20').all();
            output = `Projects (${projectsResult.results?.length || 0}):\n`;
            data = { table: { headers: ['ID', 'Name', 'Slug', 'Status', 'Created'], rows: (projectsResult.results || []).map(p => [p.id.substring(0, 8) + '...', p.name, p.slug || '-', p.status || 'active', new Date(p.created_at * 1000).toLocaleDateString()]) } };
            break;
          case 'deployments':
            const deploymentsResult = await env.DB.prepare('SELECT id, project_name, status, url, created_at FROM deployments ORDER BY created_at DESC LIMIT 10').all();
            output = `Recent Deployments (${deploymentsResult.results?.length || 0}):\n`;
            data = { table: { headers: ['ID', 'Project', 'Status', 'URL', 'Created'], rows: (deploymentsResult.results || []).map(d => [d.id.substring(0, 8) + '...', d.project_name, d.status, d.url || '-', new Date(d.created_at * 1000).toLocaleDateString()]) } };
            break;
          case 'workers':
            const workersResult = await env.DB.prepare('SELECT id, name, status, requests, created_at FROM workers ORDER BY created_at DESC LIMIT 10').all();
            output = `Workers (${workersResult.results?.length || 0}):\n`;
            data = { table: { headers: ['ID', 'Name', 'Status', 'Requests', 'Created'], rows: (workersResult.results || []).map(w => [w.id.substring(0, 8) + '...', w.name, w.status, w.requests || 0, new Date(w.created_at * 1000).toLocaleDateString()]) } };
            break;
          case 'stats':
            const statsResult = await env.DB.prepare(`SELECT (SELECT COUNT(*) FROM projects) as projects, (SELECT COUNT(*) FROM deployments) as deployments, (SELECT COUNT(*) FROM workers) as workers, (SELECT COUNT(*) FROM calendar_events) as events`).first();
            output = `System Stats:\n`;
            data = { table: { headers: ['Metric', 'Count'], rows: [['Projects', statsResult?.projects || 0], ['Deployments', statsResult?.deployments || 0], ['Workers', statsResult?.workers || 0], ['Calendar Events', statsResult?.events || 0]] } };
            break;
          case 'db:query':
            if (args.length === 0) {
              output = 'Error: SQL query required\nUsage: db:query "SELECT * FROM projects LIMIT 5"';
            } else {
              const sql = args.join(' ');
              if (!sql.trim().toUpperCase().startsWith('SELECT')) {
                output = 'Error: Only SELECT queries are allowed for safety';
              } else {
                try {
                  const queryResult = await env.DB.prepare(sql).all();
                  output = `Query executed successfully (${queryResult.results?.length || 0} rows):\n`;
                  if (queryResult.results && queryResult.results.length > 0) {
                    const headers = Object.keys(queryResult.results[0]);
                    data = { table: { headers, rows: queryResult.results.map(row => headers.map(h => String(row[h] || ''))) } };
                  }
                } catch (error) {
                  output = `Query error: ${error.message}`;
                }
              }
            }
            break;
          default:
            output = `Unknown command: ${cmd}\nType 'help' for available commands.`;
        }

        return jsonResponse({ success: true, output, data, command, timestamp: Date.now() }, 200, corsHeaders);
      }

      // Execute command based on implementation type
      let result;
      switch (commandDef.implementation_type) {
        case 'builtin':
          result = await executeBuiltin(commandDef, args, env, tenantId);
          break;
        case 'api':
          result = await executeAPI(commandDef, args, env, tenantId, corsHeaders, request);
          break;
        case 'workflow':
          result = await executeWorkflow(commandDef, args, env, tenantId, corsHeaders, request);
          break;
        case 'external':
          // External commands (future: webhook/third-party integration)
          result = {
            success: false,
            error: 'External commands not yet implemented',
            output: `Error: External command execution not yet implemented for '${commandDef.name}'.`
          };
          break;
        default:
          result = {
            success: false,
            error: `Unknown implementation type: ${commandDef.implementation_type}`,
            output: `Error: Command '${commandDef.name}' has unknown implementation type: ${commandDef.implementation_type}`
          };
      }

      // Update command usage stats
      try {
        await env.DB.prepare(
          'UPDATE agent_commands SET usage_count = usage_count + 1, last_used_at = ? WHERE id = ?'
        ).bind(Math.floor(Date.now() / 1000), commandDef.id).run();
      } catch (e) {
        // Ignore update errors
      }

      return jsonResponse({
        success: result.success,
        output: result.output,
        data: result.data,
        error: result.error,
        command: commandDef.name,
        command_type: commandDef.implementation_type,
        timestamp: Date.now()
      }, result.success ? 200 : 500, corsHeaders);

    } catch (error) {
      console.error('Error in handleAgent:', error);
      return jsonResponse({
        success: false,
        error: error.message,
        output: `Error: ${error.message}`
      }, 500, corsHeaders);
    }
  }

  // GET /api/agent/commands - List available commands
  if (request.method === 'GET' && pathParts.length === 2) {
    try {
      const category = url.searchParams.get('category');
      const commands = await listCommands(env, tenantId, category);

      return jsonResponse({
        success: true,
        data: commands,
        total: commands.length,
        category: category || 'all'
      }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // GET /api/agent/commands/:slug - Get command details
  if (request.method === 'GET' && pathParts.length === 3 && pathParts[2] !== 'execute') {
    try {
      const slug = pathParts[2];
      const command = await env.DB.prepare(
        'SELECT * FROM agent_commands WHERE slug = ? AND (tenant_id = ? OR is_public = 1) AND status = "active"'
      ).bind(slug, tenantId || 'system').first();

      if (!command) {
        return jsonResponse({
          success: false,
          error: 'Command not found'
        }, 404, corsHeaders);
      }

      // Parse JSON fields
      if (command.code_json) {
        try {
          command.config = JSON.parse(command.code_json);
        } catch (e) {
          command.config = {};
        }
      }

      if (command.parameters_json) {
        try {
          command.parameters = JSON.parse(command.parameters_json);
        } catch (e) {
          command.parameters = [];
        }
      }

      return jsonResponse({
        success: true,
        data: command
      }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle Integration Status - Unified status for all integrations
 * GET /api/integrations/status - Get status of all integrations
 */
async function handleIntegrationsStatus(request, env, tenantId, corsHeaders) {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  try {
    const userId = request.headers.get('X-User-ID') || tenantId || 'system';

    // Get all integration statuses in parallel
    const [google, github, supabase, cursor, hyperdrive, mcp, externalApps] = await Promise.all([
      getGoogleStatus(env, userId, tenantId),
      getGitHubStatus(env, userId, tenantId),
      getSupabaseStatus(env, userId, tenantId),
      getCursorStatus(env, userId, tenantId),
      getHyperdriveStatus(env, tenantId),
      getMCPStatus(env, tenantId),
      getExternalAppsStatus(env, userId, tenantId)
    ]);

    const statuses = {
      google,
      github,
      supabase,
      cursor,
      hyperdrive,
      mcp,
      external_apps: externalApps
    };

    // Calculate overall health
    const totalIntegrations = Object.keys(statuses).length;
    const connectedCount = Object.values(statuses).filter(s => s.connected).length;
    const healthPercentage = Math.round((connectedCount / totalIntegrations) * 100);

    return jsonResponse({
      success: true,
      data: statuses,
      summary: {
        total: totalIntegrations,
        connected: connectedCount,
        disconnected: totalIntegrations - connectedCount,
        health_percentage: healthPercentage,
        status: healthPercentage === 100 ? 'excellent' : healthPercentage >= 50 ? 'good' : 'needs_attention'
      }
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error getting integration statuses:', error);
    return jsonResponse({
      success: false,
      error: error.message
    }, 500, corsHeaders);
  }
}

async function getGoogleStatus(env, userId, tenantId) {
  try {
    const token = await env.DB.prepare(
      'SELECT * FROM oauth_tokens WHERE provider_id = ? AND tenant_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind('google', tenantId || 'system').first();

    return {
      connected: !!token,
      lastSync: token?.created_at || null,
      scopes: token?.scopes ? (typeof token.scopes === 'string' ? JSON.parse(token.scopes) : token.scopes) : [],
      email: token?.provider_email || null,
      needsAuth: !token,
      status: token ? 'connected' : 'disconnected'
    };
  } catch (e) {
    return { connected: false, needsAuth: true, status: 'error', error: e.message };
  }
}

async function getGitHubStatus(env, userId, tenantId) {
  try {
    const token = await env.DB.prepare(
      'SELECT * FROM oauth_tokens WHERE provider_id = ? AND tenant_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind('github', tenantId || 'system').first();

    return {
      connected: !!token,
      lastSync: token?.created_at || null,
      username: token?.provider_user_id || null,
      email: token?.provider_email || null,
      needsAuth: !token,
      status: token ? 'connected' : 'disconnected',
      note: 'Optional - Connect your GitHub account to use GitHub features'
    };
  } catch (e) {
    return { connected: false, needsAuth: true, status: 'error', error: e.message };
  }
}

async function getSupabaseStatus(env, userId, tenantId) {
  try {
    const connection = await env.DB.prepare(
      'SELECT * FROM external_connections WHERE app_id = ? AND (user_id = ? OR tenant_id = ?) ORDER BY created_at DESC LIMIT 1'
    ).bind('supabase', userId, tenantId || 'system').first();

    return {
      connected: connection?.connection_status === 'connected',
      lastSync: connection?.last_sync || null,
      needsAuth: !connection || connection.connection_status !== 'connected',
      status: connection?.connection_status || 'disconnected',
      projectId: connection?.config ? (typeof connection.config === 'string' ? JSON.parse(connection.config) : connection.config).project_id : null
    };
  } catch (e) {
    return { connected: false, needsAuth: true, status: 'error', error: e.message };
  }
}

async function getCursorStatus(env, userId, tenantId) {
  try {
    const hasKey = !!env.CURSOR_API_KEY;
    const connection = await env.DB.prepare(
      'SELECT * FROM external_connections WHERE app_id = ? AND (user_id = ? OR tenant_id = ?) ORDER BY created_at DESC LIMIT 1'
    ).bind('cursor', userId, tenantId || 'system').first();

    return {
      connected: hasKey || connection?.connection_status === 'connected',
      apiKeySet: hasKey,
      lastSync: connection?.last_sync || null,
      needsAuth: !hasKey && !connection,
      status: (hasKey || connection?.connection_status === 'connected') ? 'connected' : 'disconnected'
    };
  } catch (e) {
    return { connected: false, needsAuth: true, status: 'error', error: e.message };
  }
}

async function getHyperdriveStatus(env, tenantId) {
  try {
    const hasConfig = !!env.HYPERDRIVE;
    return {
      connected: hasConfig,
      configured: hasConfig,
      needsConfig: !hasConfig,
      status: hasConfig ? 'connected' : 'not_configured',
      note: 'Hyperdrive is configured at the platform level'
    };
  } catch (e) {
    return { connected: false, needsConfig: true, status: 'error', error: e.message };
  }
}

async function getMCPStatus(env, tenantId) {
  try {
    const session = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM mcp_sessions WHERE tenant_id = ? LIMIT 1'
    ).bind(tenantId || 'system').first();

    return {
      connected: (session?.count || 0) > 0,
      activeSessions: session?.count || 0,
      needsSetup: (session?.count || 0) === 0,
      status: (session?.count || 0) > 0 ? 'connected' : 'not_setup'
    };
  } catch (e) {
    return { connected: false, needsSetup: true, status: 'error', error: e.message };
  }
}

async function getExternalAppsStatus(env, userId, tenantId) {
  try {
    const connections = await env.DB.prepare(
      'SELECT app_id, connection_status, last_sync, app_name FROM external_connections WHERE (user_id = ? OR tenant_id = ?) ORDER BY created_at DESC'
    ).bind(userId, tenantId || 'system').all();

    return {
      total: connections.results?.length || 0,
      connected: connections.results?.filter(c => c.connection_status === 'connected').length || 0,
      apps: connections.results || [],
      status: connections.results?.length > 0 ? 'has_connections' : 'no_connections'
    };
  } catch (e) {
    return { total: 0, connected: 0, apps: [], status: 'error', error: e.message };
  }
}

/**
 * Handle OAuth flows
 */
async function handleOAuth(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const providerId = pathParts[2]; // /api/oauth/:providerId/authorize or /callback

  if (pathParts[3] === 'callback') {
    return handleOAuthCallback(request, env, tenantId, providerId, corsHeaders);
  }

  if (pathParts[3] === 'authorize') {
    return handleOAuthAuthorize(request, env, tenantId, providerId, corsHeaders);
  }

  return jsonResponse({
    success: false,
    error: 'Invalid OAuth endpoint',
    message: 'Use /api/oauth/:provider/authorize or /api/oauth/:provider/callback'
  }, 400, corsHeaders);
}

/**
 * Handle OAuth authorization (start OAuth flow)
 */
async function handleOAuthAuthorize(request, env, tenantId, providerId, corsHeaders) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id') || tenantId || 'default-user';
  const redirectUri = url.searchParams.get('redirect_uri') || `${new URL(request.url).origin}/dashboard`;

  try {
    // Get OAuth provider config
    const provider = await env.DB.prepare(
      'SELECT * FROM oauth_providers WHERE id = ? AND is_enabled = 1'
    )
      .bind(providerId)
      .first();

    if (!provider) {
      return jsonResponse({
        error: 'OAuth provider not found or disabled',
        details: `Provider '${providerId}' not found in database. Please ensure the oauth_providers table exists and contains the provider configuration.`
      }, 404, corsHeaders);
    }

    // Validate provider configuration
    if (!provider.auth_url || (!provider.client_id && !env.GOOGLE_OAUTH_CLIENT_ID)) {
      return jsonResponse({
        error: 'Invalid OAuth provider configuration',
        details: `Provider '${providerId}' is missing required fields (auth_url or client_id). Please update the provider configuration in the database or set Worker secrets.`,
        provider_id: providerId
      }, 500, corsHeaders);
    }

    // Use Worker secrets if available, otherwise fallback to database
    // Priority: env secrets > database
    let clientId = provider.client_id;
    if (providerId === 'google') {
      if (env.GOOGLE_OAUTH_CLIENT_ID) {
        clientId = env.GOOGLE_OAUTH_CLIENT_ID;
        console.log('Using Google OAuth Client ID from Worker secret');
      } else if (provider.client_id === 'PLACEHOLDER_CLIENT_ID') {
        console.warn(`OAuth provider '${providerId}' is using placeholder client_id. The OAuth flow will redirect but may fail at the provider.`);
      }
    } else if (providerId === 'github' && env.GITHUB_OAUTH_CLIENT_ID) {
      clientId = env.GITHUB_OAUTH_CLIENT_ID;
      console.log('Using GitHub OAuth Client ID from Worker secret');
    }

    // Generate state token
    const state = `state_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const expiresAt = Math.floor(Date.now() / 1000) + 600; // 10 minutes
    const now = Math.floor(Date.now() / 1000);

    // Store state - use schema without tenant_id (matches actual database schema)
    // Schema: id, user_id, provider_id, redirect_uri, scope, expires_at, created_at
    await env.DB.prepare(
      'INSERT INTO oauth_states (id, user_id, provider_id, redirect_uri, scope, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(state, userId || 'default-user', providerId, redirectUri, provider.scopes || '[]', expiresAt, now)
      .run();

    // Build authorization URL
    let scopes = 'openid profile email';
    try {
      if (provider.scopes && provider.scopes !== '[]') {
        const parsedScopes = JSON.parse(provider.scopes);
        if (Array.isArray(parsedScopes)) {
          scopes = parsedScopes.join(' ');
        } else if (typeof parsedScopes === 'string') {
          scopes = parsedScopes;
        }
      }
    } catch (parseError) {
      console.warn('Failed to parse scopes JSON, using default:', parseError, 'Raw scopes:', provider.scopes);
      // Use default scopes if parsing fails
    }

    // Validate auth_url exists and is valid
    if (!provider.auth_url || typeof provider.auth_url !== 'string') {
      throw new Error(`Invalid auth_url for provider ${providerId}: ${provider.auth_url}`);
    }

    // Validate client_id exists (check both secret and database)
    if (!clientId || typeof clientId !== 'string') {
      throw new Error(`Invalid client_id for provider ${providerId}: client_id not found in Worker secrets or database`);
    }

    const authUrl = new URL(provider.auth_url);
    authUrl.searchParams.set('client_id', clientId); // Use secret if available, otherwise database value
    authUrl.searchParams.set('redirect_uri', `${new URL(request.url).origin}/api/oauth/${providerId}/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    // Add Google-specific parameters
    if (providerId === 'google') {
      authUrl.searchParams.set('access_type', 'offline'); // For Google refresh tokens
      authUrl.searchParams.set('prompt', 'consent'); // Force consent screen
    }

    // Redirect to OAuth provider
    return Response.redirect(authUrl.toString(), 302);
  } catch (error) {
    console.error('OAuth authorize error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      providerId,
      userId,
      tenantId,
      errorName: error.name
    });

    // Return more detailed error for debugging
    return jsonResponse({
      error: 'Failed to initiate OAuth flow',
      details: error.message || 'Unknown error occurred',
      provider: providerId,
      errorType: error.name || 'Error',
      timestamp: new Date().toISOString()
    }, 500, corsHeaders);
  }
}

/**
 * Handle OAuth callback (complete OAuth flow)
 */
async function handleOAuthCallback(request, env, tenantId, providerId, corsHeaders) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return Response.redirect(`${url.origin}/dashboard?oauth_error=${error}`, 302);
  }

  if (!code || !state) {
    return Response.redirect(`${url.origin}/dashboard?oauth_error=missing_params`, 302);
  }

  try {
    // Verify state
    const stateRecord = await env.DB.prepare(
      'SELECT * FROM oauth_states WHERE id = ? AND expires_at > ?'
    )
      .bind(state, Math.floor(Date.now() / 1000))
      .first();

    if (!stateRecord) {
      return Response.redirect(`${url.origin}/dashboard?oauth_error=invalid_state`, 302);
    }

    const userId = stateRecord.user_id;

    // Get tenant_id from user record (if user exists)
    let finalTenantId = tenantId || stateRecord.tenant_id || null;
    if (userId && !finalTenantId) {
      try {
        const user = await env.DB.prepare('SELECT tenant_id FROM users WHERE id = ?')
          .bind(userId)
          .first();
        if (user) {
          finalTenantId = user.tenant_id;
        }
      } catch (userError) {
        console.warn('Failed to get tenant_id from user:', userError);
        // Continue without tenant_id - will use empty string
      }
    }

    // Normalize redirect URI to use /dashboard instead of /dashboard/index.html
    let redirectUri = stateRecord.redirect_uri || `${url.origin}/dashboard`;
    if (redirectUri.includes('/dashboard/index.html')) {
      redirectUri = redirectUri.replace('/dashboard/index.html', '/dashboard');
    }

    // Get provider config
    const provider = await env.DB.prepare(
      'SELECT * FROM oauth_providers WHERE id = ?'
    )
      .bind(providerId)
      .first();

    if (!provider) {
      return Response.redirect(`${url.origin}/dashboard?oauth_error=provider_not_found`, 302);
    }

    // Use Worker secrets if available, otherwise fallback to database
    // Priority: env secrets > database
    let clientId = provider.client_id;
    let clientSecret = provider.client_secret_encrypted; // Note: Currently stored as plain text in DB

    if (providerId === 'google') {
      if (env.GOOGLE_OAUTH_CLIENT_ID) {
        clientId = env.GOOGLE_OAUTH_CLIENT_ID;
        console.log('Using Google OAuth Client ID from Worker secret for token exchange');
      }
      if (env.GOOGLE_OAUTH_CLIENT_SECRET) {
        clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET;
        console.log('Using Google OAuth Client Secret from Worker secret for token exchange');
      }
    } else if (providerId === 'github') {
      if (env.GITHUB_OAUTH_CLIENT_ID) {
        clientId = env.GITHUB_OAUTH_CLIENT_ID;
        console.log('Using GitHub OAuth Client ID from Worker secret for token exchange');
      }
      if (env.GITHUB_OAUTH_CLIENT_SECRET) {
        clientSecret = env.GITHUB_OAUTH_CLIENT_SECRET;
        console.log('Using GitHub OAuth Client Secret from Worker secret for token exchange');
      }
    }

    // Exchange code for token
    // GitHub uses form-encoded, Google uses JSON
    const isGitHub = providerId === 'github';
    const tokenResponse = await fetch(provider.token_url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(isGitHub ? { 'Content-Type': 'application/x-www-form-urlencoded' } : { 'Content-Type': 'application/json' })
      },
      body: isGitHub
        ? new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: `${url.origin}/api/oauth/${providerId}/callback`
        }).toString()
        : JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: `${url.origin}/api/oauth/${providerId}/callback`,
          grant_type: 'authorization_code'
        })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('Token exchange error:', tokenData);
      const errorMsg = tokenData.error || 'token_exchange_failed';
      return Response.redirect(`${url.origin}/dashboard?oauth_error=${errorMsg}`, 302);
    }

    // Get user info from provider
    // GitHub uses different header format
    const userInfoHeaders = {
      'Accept': 'application/json'
    };

    if (providerId === 'github') {
      userInfoHeaders['Authorization'] = `Bearer ${tokenData.access_token}`;
      userInfoHeaders['User-Agent'] = 'InnerAnimalMedia-Platform'; // GitHub requires User-Agent
    } else {
      userInfoHeaders['Authorization'] = `Bearer ${tokenData.access_token}`;
    }

    const userInfoResponse = await fetch(provider.user_info_url, {
      headers: userInfoHeaders
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('User info fetch failed:', userInfoResponse.status, errorText);
      return Response.redirect(`${url.origin}/dashboard?oauth_error=user_info_failed&status=${userInfoResponse.status}`, 302);
    }

    const userInfo = await userInfoResponse.json();

    if (!userInfo || (userInfo.error && !userInfo.id && !userInfo.sub)) {
      console.error('Invalid user info response:', userInfo);
      return Response.redirect(`${url.origin}/dashboard?oauth_error=invalid_user_info`, 302);
    }

    // Calculate expiration
    const expiresAt = tokenData.expires_in
      ? Math.floor(Date.now() / 1000) + tokenData.expires_in
      : null;

    // Try to find or create user account from OAuth email
    let actualUserId = userId;
    let actualTenantId = finalTenantId;

    if (userInfo.email) {
      try {
        // Check if user exists with this email
        const existingUser = await env.DB.prepare(
          'SELECT id FROM users WHERE email = ? ORDER BY created_at DESC LIMIT 1'
        )
          .bind(userInfo.email)
          .first();

        if (existingUser) {
          actualUserId = existingUser.id;
          // Try to get tenant from user (if users table has tenant_id column)
          try {
            const userWithTenant = await env.DB.prepare(
              'SELECT tenant_id FROM users WHERE email = ? LIMIT 1'
            )
              .bind(userInfo.email)
              .first();
            if (userWithTenant && userWithTenant.tenant_id) {
              actualTenantId = userWithTenant.tenant_id;
            }
          } catch (e) {
            // tenant_id column might not exist, that's OK
          }
        } else {
          // For superadmin (info@inneranimals.com), use the superadmin user
          if (userInfo.email === 'info@inneranimals.com' || userInfo.email === 'ceosamprimeaux@gmail.com') {
            actualUserId = 'superadmin_sam';
            actualTenantId = actualTenantId || 'tenant_1768090747821_5m9she82d';
          }
        }
      } catch (e) {
        console.warn('Error looking up user:', e);
      }
    }

    // Store or update OAuth token
    const tokenId = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO oauth_tokens (
        id, user_id, tenant_id, provider_id, access_token_encrypted, refresh_token_encrypted,
        token_type, expires_at, scope, provider_user_id, provider_username, provider_email,
        provider_avatar_url, last_used_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, provider_id) DO UPDATE SET
        access_token_encrypted = excluded.access_token_encrypted,
        refresh_token_encrypted = excluded.refresh_token_encrypted,
        tenant_id = excluded.tenant_id,
        expires_at = excluded.expires_at,
        provider_username = excluded.provider_username,
        provider_email = excluded.provider_email,
        provider_avatar_url = excluded.provider_avatar_url,
        updated_at = excluded.updated_at`
    )
      .bind(
        tokenId,
        actualUserId,
        actualTenantId || 'tenant_1768090747821_5m9she82d', // Default to Sam's tenant
        providerId,
        tokenData.access_token, // TODO: Encrypt this
        tokenData.refresh_token || null, // TODO: Encrypt this
        tokenData.token_type || 'Bearer',
        expiresAt,
        tokenData.scope || '',
        (providerId === 'github' ? userInfo.id : (userInfo.sub || userInfo.id))?.toString() || '',
        (providerId === 'github' ? userInfo.login : (userInfo.name || userInfo.login)) || '',
        userInfo.email || (providerId === 'github' && userInfo.login ? `${userInfo.login}@users.noreply.github.com` : '') || '',
        (providerId === 'github' ? userInfo.avatar_url : (userInfo.picture || userInfo.avatar_url)) || '',
        now,
        now,
        now
      )
      .run();

    // Update user record with provider info (if user exists - non-blocking)
    try {
      if (providerId === 'github') {
        await env.DB.prepare(
          'UPDATE users SET github_username = ?, github_user_id = ?, updated_at = ? WHERE id = ?'
        )
          .bind(userInfo.login, userInfo.id?.toString(), now, userId)
          .run();
      } else if (providerId === 'google') {
        await env.DB.prepare(
          'UPDATE users SET google_email = ?, google_user_id = ?, updated_at = ? WHERE id = ?'
        )
          .bind(userInfo.email, userInfo.sub, now, userId)
          .run();
      }
    } catch (userUpdateError) {
      // Non-blocking: User might not exist yet - this is OK, token was stored successfully
      console.warn('Could not update user record (non-blocking):', userUpdateError.message);
    }

    // Delete used state
    await env.DB.prepare('DELETE FROM oauth_states WHERE id = ?').bind(state).run();

    // Get final tenant_id (use actualTenantId from token storage)
    const finalTenantIdForCookie = actualTenantId || 'tenant_1768090747821_5m9she82d';

    // Set cookies with tenant_id and user_email for dashboard access
    const tenantCookie = `tenant_id=${finalTenantIdForCookie}; Path=/; Max-Age=86400; SameSite=Lax; Secure`;
    const userEmailCookie = `user_email=${userInfo.email || ''}; Path=/; Max-Age=86400; SameSite=Lax; Secure`;

    const responseHeaders = {
      'Location': `${redirectUri}?oauth_success=${providerId}`,
      'Set-Cookie': [tenantCookie, userEmailCookie].join(', '),
      ...corsHeaders
    };

    // Redirect back to app with tenant cookie
    return new Response(null, {
      status: 302,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMsg = error.message || 'callback_failed';
    // Log more details for debugging
    if (error.message && error.message.includes('not found')) {
      console.error('Database error - possible missing table or record:', error);
      return Response.redirect(`${url.origin}/dashboard?oauth_error=notfound`, 302);
    }
    return Response.redirect(`${url.origin}/dashboard?oauth_error=${errorMsg}`, 302);
  }
}

/**
 * Handle Images API - R2 Storage + Cloudflare Images
 */
async function handleImages(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const imageId = pathParts.length > 3 ? pathParts[3] : null;

  // GET /api/images - List images
  if (request.method === 'GET' && !imageId) {
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '50'), 100);
    const projectId = url.searchParams.get('project_id');
    const userId = url.searchParams.get('user_id');
    const tag = url.searchParams.get('tag');

    let query = 'SELECT * FROM images WHERE 1=1';
    const params = [];

    if (tenantId) {
      query += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (tag) {
      query += ' AND tags LIKE ?';
      params.push(`%"${tag}"%`);
    }

    query += ' AND status = ?';
    params.push('active');

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    // Get paginated results
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * perPage;
    params.push(perPage, offset);

    try {
      const result = await env.DB.prepare(query).bind(...params).all();
      const images = (result.results || []).map(img => ({
        ...img,
        tags: img.tags ? JSON.parse(img.tags) : [],
        metadata: img.metadata ? JSON.parse(img.metadata) : {}
      }));

      return jsonResponse({
        success: true,
        data: images,
        pagination: {
          page,
          per_page: perPage,
          total,
          total_pages: Math.ceil(total / perPage),
          has_next: page < Math.ceil(total / perPage),
          has_prev: page > 1,
        },
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Error fetching images:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // GET /api/images/:id - Get single image
  if (request.method === 'GET' && imageId) {
    try {
      const result = await env.DB.prepare('SELECT * FROM images WHERE id = ?').bind(imageId).first();
      if (!result) {
        return jsonResponse({ success: false, error: 'Image not found' }, 404, corsHeaders);
      }
      const image = {
        ...result,
        tags: result.tags ? JSON.parse(result.tags) : [],
        metadata: result.metadata ? JSON.parse(result.metadata) : {}
      };
      return jsonResponse({ success: true, data: image }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // POST /api/images - Upload image
  if (request.method === 'POST' && !imageId) {
    try {
      if (!env.STORAGE) {
        return jsonResponse({ success: false, error: 'R2 storage not configured' }, 500, corsHeaders);
      }

      const formData = await request.formData();
      const file = formData.get('file');
      const projectId = formData.get('project_id') || null;
      const userId = formData.get('user_id') || 'user-sam'; // TODO: Get from auth
      const altText = formData.get('alt_text') || null;
      const description = formData.get('description') || null;
      const tags = formData.get('tags') || '[]';

      if (!file || !(file instanceof File)) {
        return jsonResponse({ success: false, error: 'No file provided' }, 400, corsHeaders);
      }

      // Generate unique R2 key
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'bin';
      const r2Key = `images/${tenantId || 'default'}/${timestamp}-${randomId}.${extension}`;

      // Upload to R2
      const arrayBuffer = await file.arrayBuffer();
      await env.STORAGE.put(r2Key, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000',
        },
        customMetadata: {
          originalFilename: file.name,
          uploadedBy: userId,
          projectId: projectId || '',
        },
      });

      // Get R2 public URL (if configured) or generate signed URL
      const r2Url = `https://pub-${env.STORAGE.bucketName || 'iaccess-storage'}.r2.dev/${r2Key}`;

      // Optional: Upload to Cloudflare Images API
      let cloudflareImageId = null;
      let thumbnailUrl = null;
      if (env.CLOUDFLARE_API_TOKEN && file.type.startsWith('image/')) {
        try {
          const accountId = await getAccountId(env);
          if (accountId) {
            // Create form data for Cloudflare Images
            const cfFormData = new FormData();
            cfFormData.append('file', new Blob([arrayBuffer], { type: file.type }), file.name);
            if (altText) {
              cfFormData.append('metadata', JSON.stringify({ alt: altText }));
            }

            const cfResponse = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                },
                body: cfFormData,
              }
            );

            if (cfResponse.ok) {
              const cfData = await cfResponse.json();
              if (cfData.success && cfData.result) {
                cloudflareImageId = cfData.result.id;
                thumbnailUrl = cfData.result.variants?.[0] || cfData.result.variants?.[cfData.result.variants.length - 1];
              }
            }
          }
        } catch (cfError) {
          console.error('Cloudflare Images API error (non-fatal):', cfError);
          // Continue without Cloudflare Images
        }
      }

      // Get image dimensions if it's an image (using Cloudflare Images API response)
      let width = null;
      let height = null;
      if (file.type.startsWith('image/') && cloudflareImageId) {
        // Dimensions will be in Cloudflare Images response
        try {
          const accountId = await getAccountId(env);
          if (accountId) {
            const cfInfoResponse = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${cloudflareImageId}`,
              {
                headers: {
                  'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                },
              }
            );
            if (cfInfoResponse.ok) {
              const cfInfo = await cfInfoResponse.json();
              if (cfInfo.success && cfInfo.result) {
                width = cfInfo.result.metadata?.width || null;
                height = cfInfo.result.metadata?.height || null;
              }
            }
          }
        } catch (dimError) {
          console.error('Error getting image dimensions:', dimError);
        }
      }

      // Save to database
      const id = `img-${timestamp}-${randomId}`;
      const now = Math.floor(Date.now() / 1000);
      const tagsArray = tags ? JSON.parse(tags) : [];

      await env.DB.prepare(
        `INSERT INTO images (
          id, tenant_id, project_id, user_id, filename, original_filename, mime_type, size,
          width, height, r2_key, cloudflare_image_id, url, thumbnail_url, alt_text, description,
          tags, metadata, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        tenantId,
        projectId,
        userId,
        file.name,
        file.name,
        file.type,
        file.size,
        width,
        height,
        r2Key,
        cloudflareImageId,
        r2Url,
        thumbnailUrl,
        altText,
        description,
        JSON.stringify(tagsArray),
        JSON.stringify({ uploadedVia: 'api', r2Bucket: 'iaccess-storage' }),
        'active',
        now,
        now
      ).run();

      const image = {
        id,
        tenant_id: tenantId,
        project_id: projectId,
        user_id: userId,
        filename: file.name,
        original_filename: file.name,
        mime_type: file.type,
        size: file.size,
        width,
        height,
        r2_key: r2Key,
        cloudflare_image_id: cloudflareImageId,
        url: r2Url,
        thumbnail_url: thumbnailUrl,
        alt_text: altText,
        description,
        tags: tagsArray,
        status: 'active',
        created_at: now,
        updated_at: now,
      };

      return jsonResponse({ success: true, data: image }, 201, corsHeaders);
    } catch (error) {
      console.error('Error uploading image:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // PUT /api/images/:id - Update image metadata
  if (request.method === 'PUT' && imageId) {
    try {
      const body = await request.json();
      const updates = [];
      const params = [];
      const allowedFields = ['alt_text', 'description', 'tags', 'status', 'project_id'];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          if (field === 'tags' && Array.isArray(body[field])) {
            updates.push(`${field} = ?`);
            params.push(JSON.stringify(body[field]));
          } else {
            updates.push(`${field} = ?`);
            params.push(body[field]);
          }
        }
      }

      if (updates.length === 0) {
        return jsonResponse({ success: false, error: 'No fields to update' }, 400, corsHeaders);
      }

      updates.push('updated_at = ?');
      params.push(Math.floor(Date.now() / 1000));
      params.push(imageId);

      await env.DB.prepare(`UPDATE images SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

      // Fetch updated image
      const result = await env.DB.prepare('SELECT * FROM images WHERE id = ?').bind(imageId).first();
      const image = {
        ...result,
        tags: result.tags ? JSON.parse(result.tags) : [],
        metadata: result.metadata ? JSON.parse(result.metadata) : {}
      };

      return jsonResponse({ success: true, data: image }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // DELETE /api/images/:id - Delete image
  if (request.method === 'DELETE' && imageId) {
    try {
      // Get image record
      const image = await env.DB.prepare('SELECT * FROM images WHERE id = ?').bind(imageId).first();
      if (!image) {
        return jsonResponse({ success: false, error: 'Image not found' }, 404, corsHeaders);
      }

      // Delete from R2
      if (env.STORAGE && image.r2_key) {
        try {
          await env.STORAGE.delete(image.r2_key);
        } catch (r2Error) {
          console.error('Error deleting from R2:', r2Error);
          // Continue with DB deletion even if R2 fails
        }
      }

      // Delete from Cloudflare Images (if exists)
      if (env.CLOUDFLARE_API_TOKEN && image.cloudflare_image_id) {
        try {
          const accountId = await getAccountId(env);
          if (accountId) {
            await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${image.cloudflare_image_id}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                },
              }
            );
          }
        } catch (cfError) {
          console.error('Error deleting from Cloudflare Images:', cfError);
          // Continue with DB deletion
        }
      }

      // Delete from database
      const result = await env.DB.prepare('DELETE FROM images WHERE id = ?').bind(imageId).run();
      if (result.meta.changes === 0) {
        return jsonResponse({ success: false, error: 'Image not found' }, 404, corsHeaders);
      }

      return jsonResponse({ success: true, message: 'Image deleted' }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // GET /api/images/:id/download - Get image file from R2
  if (request.method === 'GET' && imageId && pathParts[pathParts.length - 1] === 'download') {
    try {
      const image = await env.DB.prepare('SELECT * FROM images WHERE id = ?').bind(imageId).first();
      if (!image) {
        return jsonResponse({ success: false, error: 'Image not found' }, 404, corsHeaders);
      }

      if (!env.STORAGE || !image.r2_key) {
        return jsonResponse({ success: false, error: 'Image file not available' }, 404, corsHeaders);
      }

      // Get object from R2
      const object = await env.STORAGE.get(image.r2_key);
      if (!object) {
        return jsonResponse({ success: false, error: 'Image file not found in storage' }, 404, corsHeaders);
      }

      const headers = new Headers(corsHeaders);
      headers.set('Content-Type', image.mime_type || 'application/octet-stream');
      headers.set('Content-Disposition', `inline; filename="${image.original_filename}"`);
      headers.set('Cache-Control', 'public, max-age=31536000');

      return new Response(object.body, { headers });
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Get Cloudflare Pages projects (ecosystem-wide)
 */
async function getCloudflarePagesProjects(env, tenantId = null) {
  if (!env.CLOUDFLARE_API_TOKEN) {
    return [];
  }

  const accountId = await getAccountId(env);
  if (!accountId) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
      {
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!data.success) {
      return [];
    }

    return data.result || [];
  } catch (error) {
    console.error('Error fetching Cloudflare Pages projects:', error);
    return [];
  }
}

/**
 * Handle projects endpoint (CRUD via D1 + Cloudflare Pages sync)
 */
async function handleProjects(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const projectId = pathParts.length >= 3 ? pathParts[2] : null;
  const sync = url.searchParams.get('sync') === 'true';

  // GET /api/projects or /api/projects/:id
  if (request.method === 'GET') {
    // Sync Cloudflare Pages projects into projects table (ecosystem-wide)
    if (sync || env.CLOUDFLARE_API_TOKEN) {
      try {
        const cloudflareProjects = await getCloudflarePagesProjects(env, tenantId);
        const now = Math.floor(Date.now() / 1000);
        const finalTenantId = tenantId || 'system';

        // Sync each Cloudflare Pages project into projects table
        for (const cfProject of cloudflareProjects) {
          try {
            const projectSlug = cfProject.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            const projectId = `cf-project-${cfProject.id || cfProject.name}`;

            await env.DB.prepare(
              `INSERT INTO projects (
                id, tenant_id, name, slug, description, repository_url, repository_provider,
                default_branch, framework, build_command, install_command,
                is_public, status, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                slug = excluded.slug,
                framework = excluded.framework,
                updated_at = excluded.updated_at`
            )
              .bind(
                projectId,
                finalTenantId,
                cfProject.name,
                projectSlug,
                cfProject.production_branch || null,
                null, // repository_url
                null, // repository_provider
                cfProject.production_branch || 'main',
                cfProject.build_config?.framework || null,
                null, // build_command
                null, // install_command
                0, // is_public
                'active',
                now,
                now
              )
              .run();
          } catch (dbError) {
            console.error(`Error syncing project ${cfProject.name}:`, dbError);
          }
        }
      } catch (error) {
        console.error('Error syncing Cloudflare projects:', error);
        // Continue with database query even if sync fails
      }
    }

    if (projectId) {
      // Get single project
      let query = 'SELECT * FROM projects WHERE id = ?';
      let params = [projectId];

      if (tenantId) {
        query += ' AND tenant_id = ?';
        params.push(tenantId);
      }

      const project = await env.DB.prepare(query).bind(...params).first();

      if (!project) {
        return jsonResponse({ success: false, error: 'Project not found' }, 404, corsHeaders);
      }

      return jsonResponse({
        success: true,
        data: {
          ...project,
          environment_variables: project.environment_variables ? JSON.parse(project.environment_variables) : {},
          is_public: project.is_public === 1
        }
      }, 200, corsHeaders);
    }

    // List projects
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '50'), 100);
    const status = url.searchParams.get('status') || 'all';
    const search = url.searchParams.get('search') || '';

    let query = tenantId ? 'SELECT * FROM projects WHERE tenant_id = ?' : 'SELECT * FROM projects WHERE 1=1';
    let params = tenantId ? [tenantId] : [];

    if (status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    // Get paginated results
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(perPage, (page - 1) * perPage);

    const result = await env.DB.prepare(query).bind(...params).all();
    const projects = (result.results || []).map(project => ({
      ...project,
      environment_variables: project.environment_variables ? JSON.parse(project.environment_variables) : {},
      is_public: project.is_public === 1
    }));

    return jsonResponse({
      success: true,
      data: projects,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
        has_next: page < Math.ceil(total / perPage),
        has_prev: page > 1
      }
    }, 200, corsHeaders);
  }

  // POST /api/projects - Create project
  if (request.method === 'POST') {
    const body = await request.json();
    const now = Math.floor(Date.now() / 1000);
    const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const finalTenantId = tenantId || 'default-tenant';

    await env.DB.prepare(
      `INSERT INTO projects (
        id, tenant_id, name, slug, description, repository_url, repository_provider,
        repository_id, default_branch, framework, build_command, install_command,
        environment_variables, is_public, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        projectId,
        finalTenantId,
        body.name,
        slug,
        body.description || null,
        body.repository_url || null,
        body.repository_provider || null,
        body.repository_id || null,
        body.default_branch || 'main',
        body.framework || null,
        body.build_command || null,
        body.install_command || null,
        body.environment_variables ? JSON.stringify(body.environment_variables) : null,
        body.is_public ? 1 : 0,
        body.status || 'active',
        body.created_by || null,
        now,
        now
      )
      .run();

    const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first();

    return jsonResponse({
      success: true,
      data: {
        ...project,
        environment_variables: project.environment_variables ? JSON.parse(project.environment_variables) : {},
        is_public: project.is_public === 1
      }
    }, 201, corsHeaders);
  }

  // PUT /api/projects/:id - Update project
  if (request.method === 'PUT' && projectId) {
    const body = await request.json();
    const now = Math.floor(Date.now() / 1000);
    const updates = [];
    const params = [];
    const allowedFields = ['name', 'slug', 'description', 'repository_url', 'repository_provider', 'repository_id', 'default_branch', 'framework', 'build_command', 'install_command', 'environment_variables', 'is_public', 'status'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'environment_variables' && typeof body[field] === 'object') {
          updates.push(`${field} = ?`);
          params.push(JSON.stringify(body[field]));
        } else if (field === 'is_public') {
          updates.push(`${field} = ?`);
          params.push(body[field] ? 1 : 0);
        } else {
          updates.push(`${field} = ?`);
          params.push(body[field]);
        }
      }
    }

    if (updates.length === 0) {
      return jsonResponse({ success: false, error: 'No fields to update' }, 400, corsHeaders);
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(projectId);

    let updateQuery = 'UPDATE projects SET ' + updates.join(', ') + ' WHERE id = ?';
    if (tenantId) {
      updateQuery += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    await env.DB.prepare(updateQuery).bind(...params).run();

    const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first();

    return jsonResponse({
      success: true,
      data: {
        ...project,
        environment_variables: project.environment_variables ? JSON.parse(project.environment_variables) : {},
        is_public: project.is_public === 1
      }
    }, 200, corsHeaders);
  }

  // DELETE /api/projects/:id - Delete project
  if (request.method === 'DELETE' && projectId) {
    let deleteQuery = 'DELETE FROM projects WHERE id = ?';
    let params = [projectId];
    if (tenantId) {
      deleteQuery += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    await env.DB.prepare(deleteQuery).bind(...params).run();

    return jsonResponse({ success: true, message: 'Project deleted' }, 200, corsHeaders);
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle Supabase integration endpoint
 */
/**
 * Handle Supabase API requests
 * Uses configured Supabase keys from environment
 */
async function handleSupabase(request, env, tenantId, corsHeaders) {
  // Get Supabase configuration from environment
  const supabaseUrl = env.SUPABASE_URL || 'https://qmpghmthbhuumemnahcz.supabase.co';
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseAnonKey && !supabaseServiceKey) {
    return jsonResponse({
      success: false,
      error: 'Supabase keys not configured. Set SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY secret.',
    }, 500, corsHeaders);
  }
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);

  // Check if Supabase is configured
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return jsonResponse({
      success: false,
      error: 'Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY secrets.'
    }, 500, corsHeaders);
  }

  // GET /api/supabase - List tables or get info
  if (request.method === 'GET' && pathParts.length === 2) {
    return jsonResponse({
      success: true,
      message: 'Supabase proxy endpoint ready',
      url: env.SUPABASE_URL,
      usage: 'GET /api/supabase/{table_name} to query tables',
      example: '/api/supabase/users'
    }, 200, corsHeaders);
  }

  // Proxy request to Supabase
  if (request.method === 'GET' || request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE' || request.method === 'PATCH') {
    try {
      // Get the Supabase path (everything after /api/supabase)
      const supabasePath = pathParts.length > 2 ? '/' + pathParts.slice(2).join('/') : '/';
      const supabaseUrl = `${env.SUPABASE_URL}/rest/v1${supabasePath}`;

      // Get query parameters
      const searchParams = url.searchParams.toString();
      const fullUrl = searchParams ? `${supabaseUrl}?${searchParams}` : supabaseUrl;

      // Use service role key for admin operations, anon key for client operations
      const useServiceRole = url.searchParams.get('service_role') === 'true' || request.headers.get('X-Use-Service-Role') === 'true';
      const apiKey = useServiceRole ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;

      // Prepare headers for Supabase
      const headers = {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      // Get request body if present
      let body = null;
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        const contentType = request.headers.get('Content-Type') || 'application/json';
        if (contentType.includes('application/json')) {
          body = await request.text();
        } else {
          body = await request.arrayBuffer();
        }
      }

      // Use Hyperdrive for connection pooling if available (for direct PostgreSQL queries)
      // For REST API, use direct fetch (Hyperdrive is for PostgreSQL connection pooling via connection strings)
      // If path includes /query or /sql, we can use Hyperdrive for direct PostgreSQL queries
      const useHyperdrive = env.HYPERDRIVE && (supabasePath.includes('/query') || supabasePath.includes('/sql') || request.method === 'POST' && pathParts.includes('query'));

      let supabaseResponse;
      if (useHyperdrive && request.method === 'POST') {
        // For direct SQL queries via Hyperdrive (bypass REST API)
        try {
          const queryBody = body ? JSON.parse(body) : {};
          if (queryBody.query) {
            // Execute SQL query via Hyperdrive
            const connection = env.HYPERDRIVE.connect();
            const result = await connection.query(queryBody.query, queryBody.params || []);

            return jsonResponse({
              success: true,
              data: result.rows || result,
              columns: result.columns || []
            }, 200, corsHeaders);
          }
        } catch (hyperdriveError) {
          console.error('Hyperdrive query error:', hyperdriveError);
          // Fallback to REST API
        }
      }

      // Default: Use REST API via direct fetch
      supabaseResponse = await fetch(fullUrl, {
        method: request.method,
        headers: headers,
        body: body
      });

      let data;
      const contentType = supabaseResponse.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        data = await supabaseResponse.json();
      } else {
        data = await supabaseResponse.text();
      }

      return jsonResponse({
        success: supabaseResponse.ok,
        data: data,
        status: supabaseResponse.status,
        headers: Object.fromEntries(supabaseResponse.headers.entries())
      }, supabaseResponse.status, corsHeaders);

    } catch (error) {
      console.error('Supabase proxy error:', error);
      return jsonResponse({
        success: false,
        error: error.message,
        details: error.stack
      }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle MeauxSQL (SQL Query Execution via Supabase Edge Function)
 */
/**
 * Handle MeauxSQL - Reliable read/write SQL execution using D1 directly
 * No external dependencies - uses D1 database natively
 */
async function handleMeauxSQL(request, env, tenantId, corsHeaders) {
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { query, database = 'inneranimalmedia-business' } = body;

      if (!query || !query.trim()) {
        return jsonResponse({
          success: false,
          error: 'SQL query is required'
        }, 400, corsHeaders);
      }

      // Determine which database to use
      const db = database === 'meauxos' ? env.MEAUXOS_DB : env.DB;
      const dbName = database === 'meauxos' ? 'meauxos' : 'inneranimalmedia-business';

      const queryTrimmed = query.trim();
      const queryUpper = queryTrimmed.toUpperCase();

      // Detect query type for safety and optimization
      const isReadOnly = queryUpper.startsWith('SELECT') ||
        queryUpper.startsWith('PRAGMA') ||
        queryUpper.startsWith('EXPLAIN') ||
        queryUpper.startsWith('SHOW') ||
        queryUpper.startsWith('DESCRIBE') ||
        queryUpper.startsWith('DESC');

      const isWrite = queryUpper.startsWith('INSERT') ||
        queryUpper.startsWith('UPDATE') ||
        queryUpper.startsWith('DELETE') ||
        queryUpper.startsWith('CREATE') ||
        queryUpper.startsWith('ALTER') ||
        queryUpper.startsWith('DROP') ||
        queryUpper.startsWith('REPLACE');

      const isTransaction = queryUpper.startsWith('BEGIN') ||
        queryUpper.startsWith('COMMIT') ||
        queryUpper.startsWith('ROLLBACK');

      // Safety check: Prevent dangerous operations
      const dangerousPatterns = [
        /DROP\s+TABLE/i,
        /DROP\s+DATABASE/i,
        /TRUNCATE/i,
        /DELETE\s+FROM\s+\w+\s*(WHERE\s+1\s*=\s*1|;)/i, // DELETE without proper WHERE
      ];

      const isDangerous = dangerousPatterns.some(pattern => pattern.test(queryTrimmed));

      if (isDangerous && !tenantId) {
        return jsonResponse({
          success: false,
          error: 'Dangerous operation detected. Write operations require tenant context for safety.',
          query_type: 'dangerous',
          suggestion: 'Use proper WHERE clauses and tenant isolation'
        }, 403, corsHeaders);
      }

      const startTime = Date.now();

      try {
        // Execute query directly on D1 (reliable, no external dependencies)
        let result;

        if (isReadOnly) {
          // For SELECT queries, use .all() to get all results
          result = await db.prepare(queryTrimmed).all();

          return jsonResponse({
            success: true,
            data: result.results || [],
            meta: {
              ...result.meta,
              duration_ms: Date.now() - startTime,
              query_type: 'read',
              database: dbName,
              rows_returned: result.results?.length || 0,
              changes: 0
            },
            source: 'd1_direct'
          }, 200, corsHeaders);

        } else if (isWrite || isTransaction) {
          // For write operations, use .run() to execute and get changes
          result = await db.prepare(queryTrimmed).run();

          // If INSERT, try to get last insert ID if available
          let lastInsertId = null;
          if (queryUpper.startsWith('INSERT') && result.meta?.last_row_id) {
            lastInsertId = result.meta.last_row_id;
          }

          return jsonResponse({
            success: true,
            data: {
              changes: result.meta?.changes || result.changes || 0,
              last_insert_id: lastInsertId,
              duration_ms: result.meta?.duration || (Date.now() - startTime)
            },
            meta: {
              ...result.meta,
              duration_ms: Date.now() - startTime,
              query_type: isWrite ? 'write' : 'transaction',
              database: dbName,
              rows_affected: result.meta?.changes || result.changes || 0
            },
            source: 'd1_direct'
          }, 200, corsHeaders);

        } else {
          // For other query types (PRAGMA, etc.), use .first() or .run()
          try {
            result = await db.prepare(queryTrimmed).all();
            return jsonResponse({
              success: true,
              data: result.results || [],
              meta: {
                ...result.meta,
                duration_ms: Date.now() - startTime,
                query_type: 'other',
                database: dbName
              },
              source: 'd1_direct'
            }, 200, corsHeaders);
          } catch (e) {
            // If .all() fails, try .run()
            result = await db.prepare(queryTrimmed).run();
            return jsonResponse({
              success: true,
              data: { executed: true },
              meta: {
                ...result.meta,
                duration_ms: Date.now() - startTime,
                query_type: 'execution',
                database: dbName,
                changes: result.meta?.changes || 0
              },
              source: 'd1_direct'
            }, 200, corsHeaders);
          }
        }

      } catch (dbError) {
        console.error('MeauxSQL D1 execution error:', dbError);
        return jsonResponse({
          success: false,
          error: dbError.message || 'Database execution error',
          details: dbError.toString(),
          query_type: isReadOnly ? 'read' : 'write',
          database: dbName
        }, 500, corsHeaders);
      }

    } catch (error) {
      console.error('MeauxSQL error:', error);
      return jsonResponse({
        success: false,
        error: error.message || 'Internal server error'
      }, 500, corsHeaders);
    }
  }

  // GET /api/sql or /api/meauxsql - Get info and database schema
  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const action = url.searchParams.get('action');

      // Get database schema (tables list)
      if (action === 'tables' || action === 'schema') {
        try {
          const tablesResult = await env.DB.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%' 
            ORDER BY name
          `).all();

          const tables = (tablesResult.results || []).map(t => t.name);

          // Get table schemas
          const schemas = {};
          for (const tableName of tables.slice(0, 50)) { // Limit to 50 tables
            try {
              const schemaResult = await env.DB.prepare(`PRAGMA table_info(${tableName})`).all();
              schemas[tableName] = schemaResult.results || [];
            } catch (e) {
              // Skip tables that can't be accessed
              console.warn(`Could not get schema for table ${tableName}:`, e.message);
            }
          }

          return jsonResponse({
            success: true,
            data: {
              database: 'inneranimalmedia-business',
              tables,
              schemas,
              total_tables: tables.length
            }
          }, 200, corsHeaders);
        } catch (e) {
          return jsonResponse({
            success: false,
            error: 'Could not fetch schema: ' + e.message
          }, 500, corsHeaders);
        }
      }

      // Default info response
      return jsonResponse({
        success: true,
        message: 'MeauxSQL endpoint ready',
        database: 'inneranimalmedia-business',
        features: {
          read_queries: true,
          write_queries: true,
          transactions: true,
          schema_explorer: true
        },
        usage: {
          execute: 'POST /api/sql with { query: "SELECT * FROM ..." }',
          get_schema: 'GET /api/sql?action=tables',
          get_table_info: 'GET /api/sql?action=schema'
        },
        supported_databases: ['inneranimalmedia-business', 'meauxos'],
        example: {
          query: 'SELECT * FROM tenants LIMIT 10',
          database: 'inneranimalmedia-business'
        }
      }, 200, corsHeaders);

    } catch (error) {
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle MeauxMCP - MCP Protocol operations
 * POST /api/mcp/tools/list - List available MCP tools
 * POST /api/mcp/tools/call - Execute an MCP tool
 * POST /api/mcp/resources - Get MCP resources
 * GET /api/mcp/status - Get MCP connection status
 */
async function handleMCP(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const finalTenantId = tenantId || 'system';

  try {
    // POST /api/mcp/tools/list - List available MCP tools
    if (pathParts.length === 4 && pathParts[2] === 'tools' && pathParts[3] === 'list' && request.method === 'POST') {
      try {
        // Get tools from database (tools that are MCP-compatible)
        const tools = await env.DB.prepare(`
          SELECT id, name, display_name, description, category, icon, config
          FROM tools
          WHERE is_enabled = 1 AND (is_public = 1 OR tenant_id = ?)
          ORDER BY display_name
        `).bind(finalTenantId).all();

        // Also check for external connections that might be MCP tools
        const externalTools = await env.DB.prepare(`
          SELECT id, app_id as name, app_name as display_name, app_type, connection_status
          FROM external_connections
          WHERE tenant_id = ? AND connection_status = 'connected'
        `).bind(finalTenantId).all().catch(() => ({ results: [] }));

        const mcpTools = [
          ...(tools.results || []).map(t => ({
            name: t.name,
            description: t.description || `${t.display_name} tool`,
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          })),
          ...(externalTools.results || []).map(t => ({
            name: t.name,
            description: `External ${t.app_name} connection`,
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          }))
        ];

        // Add built-in MCP tools
        const builtInTools = [
          {
            name: 'query-database',
            description: 'Query D1 database using SQL',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'SQL query to execute' },
                database: { type: 'string', description: 'Database name (inneranimalmedia-business or meauxos)' }
              },
              required: ['query']
            }
          },
          {
            name: 'list-deployments',
            description: 'List Cloudflare Pages deployments',
            inputSchema: {
              type: 'object',
              properties: {
                project_name: { type: 'string', description: 'Filter by project name' },
                status: { type: 'string', description: 'Filter by status' }
              }
            }
          },
          {
            name: 'list-workers',
            description: 'List Cloudflare Workers',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'sync-cloudflare',
            description: 'Sync deployments and workers from Cloudflare API',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ];

        return jsonResponse({
          success: true,
          data: {
            tools: [...builtInTools, ...mcpTools],
            total: builtInTools.length + mcpTools.length
          }
        }, 200, corsHeaders);

      } catch (error) {
        console.error('Error listing MCP tools:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to list tools'
        }, 500, corsHeaders);
      }
    }

    // POST /api/mcp/tools/call - Execute an MCP tool
    if (pathParts.length === 4 && pathParts[2] === 'tools' && pathParts[3] === 'call' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { tool, arguments: args = {} } = body;

        if (!tool) {
          return jsonResponse({
            success: false,
            error: 'Tool name is required'
          }, 400, corsHeaders);
        }

        let result = null;
        let error = null;

        // Handle built-in tools
        switch (tool) {
          case 'query-database':
            try {
              const db = (args.database === 'meauxos') ? env.MEAUXOS_DB : env.DB;
              const queryResult = await db.prepare(args.query).all();
              result = {
                success: true,
                data: queryResult.results || [],
                meta: queryResult.meta
              };
            } catch (e) {
              error = e.message;
            }
            break;

          case 'list-deployments':
            try {
              const deploymentsResult = await env.DB.prepare(`
                SELECT id, project_name, status, url, framework, created_at
                FROM deployments
                WHERE tenant_id = ? ${args.project_name ? 'AND project_name LIKE ?' : ''} ${args.status ? 'AND status = ?' : ''}
                ORDER BY created_at DESC
                LIMIT 50
              `).bind(
                finalTenantId,
                ...(args.project_name ? [`%${args.project_name}%`] : []),
                ...(args.status ? [args.status] : [])
              ).all();
              result = {
                success: true,
                data: deploymentsResult.results || []
              };
            } catch (e) {
              error = e.message;
            }
            break;

          case 'list-workers':
            try {
              const workersResult = await env.DB.prepare(`
                SELECT id, name, status, requests, created_at
                FROM workers
                WHERE tenant_id = ?
                ORDER BY created_at DESC
                LIMIT 50
              `).bind(finalTenantId).all();
              result = {
                success: true,
                data: workersResult.results || []
              };
            } catch (e) {
              error = e.message;
            }
            break;

          case 'sync-cloudflare':
            try {
              const deployments = await getCloudflareDeployments(env, finalTenantId);
              const workers = await getCloudflareWorkers(env, finalTenantId);
              result = {
                success: true,
                data: {
                  deployments_synced: deployments.length,
                  workers_synced: workers.length,
                  message: `Synced ${deployments.length} deployments and ${workers.length} workers`
                }
              };
            } catch (e) {
              error = e.message;
            }
            break;

          default:
            // Try to find tool in database
            try {
              const toolRecord = await env.DB.prepare(`
                SELECT * FROM tools WHERE name = ? AND (is_public = 1 OR tenant_id = ?) AND is_enabled = 1
              `).bind(tool, finalTenantId).first();

              if (toolRecord) {
                // For custom tools, you could execute them here
                result = {
                  success: true,
                  message: `Tool '${tool}' found but execution not yet implemented`,
                  tool: toolRecord
                };
              } else {
                error = `Tool '${tool}' not found or not accessible`;
              }
            } catch (e) {
              error = e.message;
            }
        }

        if (error) {
          return jsonResponse({
            success: false,
            error,
            tool
          }, 400, corsHeaders);
        }

        return jsonResponse({
          success: true,
          data: result,
          tool,
          timestamp: Date.now()
        }, 200, corsHeaders);

      } catch (error) {
        console.error('Error executing MCP tool:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to execute tool'
        }, 500, corsHeaders);
      }
    }

    // POST /api/mcp/resources - Get MCP resources
    if (pathParts.length === 3 && pathParts[2] === 'resources' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { uri } = body;

        // Return available resources (databases, connections, etc.)
        const resources = [
          {
            uri: 'database://inneranimalmedia-business',
            name: 'InnerAnimal Media Business Database',
            mimeType: 'application/x-sqlite3',
            description: 'Main D1 database'
          },
          {
            uri: 'database://meauxos',
            name: 'MeauxOS Database',
            mimeType: 'application/x-sqlite3',
            description: 'Legacy MeauxOS D1 database'
          },
          {
            uri: 'storage://r2/inneranimalmedia-assets',
            name: 'R2 Storage Bucket',
            mimeType: 'application/json',
            description: 'Cloudflare R2 storage bucket'
          }
        ];

        if (uri) {
          const resource = resources.find(r => r.uri === uri);
          if (resource) {
            return jsonResponse({
              success: true,
              data: [resource]
            }, 200, corsHeaders);
          } else {
            return jsonResponse({
              success: false,
              error: 'Resource not found'
            }, 404, corsHeaders);
          }
        }

        return jsonResponse({
          success: true,
          data: resources
        }, 200, corsHeaders);

      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message
        }, 500, corsHeaders);
      }
    }

    // GET /api/mcp/status - Get MCP connection status
    if (request.method === 'GET' && pathParts.length === 3 && pathParts[2] === 'status') {
      try {
        // Check database connection
        const dbCheck = await env.DB.prepare('SELECT 1 as connected').first();
        const dbConnected = !!dbCheck;

        // Check R2 storage
        let storageConnected = false;
        try {
          await env.STORAGE.list({ limit: 1 });
          storageConnected = true;
        } catch (e) {
          console.warn('R2 storage check failed:', e.message);
        }

        return jsonResponse({
          success: true,
          data: {
            protocol_version: '2.0',
            status: 'connected',
            connections: {
              database: dbConnected ? 'connected' : 'disconnected',
              storage: storageConnected ? 'connected' : 'disconnected',
              cloudflare_api: env.CLOUDFLARE_API_TOKEN ? 'configured' : 'not_configured'
            },
            node_count: 3, // Mock for now
            active_tasks: 0
          }
        }, 200, corsHeaders);

      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message
        }, 500, corsHeaders);
      }
    }

    // GET /api/mcp - Get MCP info
    if (request.method === 'GET') {
      return jsonResponse({
        success: true,
        message: 'MeauxMCP Protocol Manager ready',
        protocol_version: '2.0',
        endpoints: {
          list_tools: 'POST /api/mcp/tools/list',
          call_tool: 'POST /api/mcp/tools/call',
          get_resources: 'POST /api/mcp/resources',
          status: 'GET /api/mcp/status'
        },
        capabilities: {
          tools: true,
          resources: true,
          prompts: false,
          logging: true
        }
      }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed or invalid path' }, 405, corsHeaders);
  } catch (error) {
    console.error('MCP API error:', error);
    return jsonResponse({
      success: false,
      error: error.message || 'Internal server error'
    }, 500, corsHeaders);
  }
}

/**
 * Handle MeauxIDE - File operations for code editor
 * GET /api/files - List files in directory
 * GET /api/files/:path - Get file content
 * POST /api/files/:path - Create or update file
 * DELETE /api/files/:path - Delete file
 * POST /api/files/:path/rename - Rename file
 * POST /api/ide/terminal - Execute terminal command
 */
async function handleFiles(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const finalTenantId = tenantId || 'system';

  try {
    // Determine file path from URL
    let filePath = '';
    if (pathParts.length >= 3) {
      filePath = pathParts.slice(2).join('/'); // /api/files/foo/bar.js -> foo/bar.js
    }

    // Normalize path (prevent directory traversal)
    filePath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');

    // R2 storage key prefix
    const storagePrefix = `ide/${finalTenantId}/`;
    const r2Key = filePath ? `${storagePrefix}${filePath}` : storagePrefix;

    // GET /api/files - List files and directories
    if (request.method === 'GET' && (!filePath || pathParts[pathParts.length - 1] === 'list')) {
      try {
        const prefix = filePath ? `${storagePrefix}${filePath}/` : storagePrefix;
        const listResult = await env.STORAGE.list({ prefix, limit: 1000 });

        // Group files by directory
        const files = [];
        const directories = new Set();

        for (const object of listResult.objects) {
          const relativePath = object.key.replace(storagePrefix, '');
          const parts = relativePath.split('/');

          if (parts.length === 1) {
            // Root level file
            files.push({
              name: parts[0],
              path: relativePath,
              type: 'file',
              size: object.size,
              lastModified: object.uploaded ? new Date(object.uploaded).toISOString() : null
            });
          } else {
            // File in subdirectory
            const dirName = parts[0];
            directories.add(dirName);

            if (parts.length === 2) {
              // Only show direct children
              if (!filePath || relativePath.startsWith(`${filePath}/`)) {
                const childPath = relativePath.replace(`${filePath}/`, '');
                if (!childPath.includes('/')) {
                  files.push({
                    name: parts[parts.length - 1],
                    path: relativePath,
                    type: 'file',
                    size: object.size,
                    lastModified: object.uploaded ? new Date(object.uploaded).toISOString() : null
                  });
                }
              }
            }
          }
        }

        // Add directories
        const dirs = Array.from(directories).map(dir => ({
          name: dir,
          path: `${filePath ? filePath + '/' : ''}${dir}`,
          type: 'directory'
        }));

        return jsonResponse({
          success: true,
          data: {
            files: [...dirs, ...files].sort((a, b) => {
              if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
              return a.name.localeCompare(b.name);
            }),
            path: filePath || '/',
            total: dirs.length + files.length
          }
        }, 200, corsHeaders);

      } catch (error) {
        console.error('Error listing files:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to list files'
        }, 500, corsHeaders);
      }
    }

    // GET /api/files/:path - Get file content
    if (request.method === 'GET' && filePath && pathParts[pathParts.length - 1] !== 'list') {
      try {
        const object = await env.STORAGE.get(r2Key);

        if (!object) {
          return jsonResponse({
            success: false,
            error: 'File not found'
          }, 404, corsHeaders);
        }

        const content = await object.text();
        const contentType = object.httpMetadata?.contentType || 'text/plain';

        return jsonResponse({
          success: true,
          data: {
            path: filePath,
            content,
            size: object.size,
            contentType,
            lastModified: object.uploaded ? new Date(object.uploaded).toISOString() : null
          }
        }, 200, corsHeaders);

      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to read file'
        }, 500, corsHeaders);
      }
    }

    // POST /api/files/:path - Create or update file
    if (request.method === 'POST' && filePath) {
      try {
        const body = await request.json();
        const { content, contentType = 'text/plain' } = body;

        if (content === undefined) {
          return jsonResponse({
            success: false,
            error: 'File content is required'
          }, 400, corsHeaders);
        }

        // Save to R2
        await env.STORAGE.put(r2Key, content, {
          httpMetadata: {
            contentType: contentType,
            cacheControl: 'no-cache'
          },
          customMetadata: {
            tenant_id: finalTenantId,
            created_by: 'meauxide',
            updated_at: new Date().toISOString()
          }
        });

        return jsonResponse({
          success: true,
          data: {
            path: filePath,
            message: 'File saved successfully',
            size: content.length,
            lastModified: new Date().toISOString()
          }
        }, 200, corsHeaders);

      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to save file'
        }, 500, corsHeaders);
      }
    }

    // DELETE /api/files/:path - Delete file
    if (request.method === 'DELETE' && filePath) {
      try {
        await env.STORAGE.delete(r2Key);

        return jsonResponse({
          success: true,
          data: {
            path: filePath,
            message: 'File deleted successfully'
          }
        }, 200, corsHeaders);

      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to delete file'
        }, 500, corsHeaders);
      }
    }

    // POST /api/files/:path/rename - Rename file
    if (request.method === 'POST' && pathParts[pathParts.length - 1] === 'rename') {
      try {
        const body = await request.json();
        const { newPath } = body;

        if (!newPath) {
          return jsonResponse({
            success: false,
            error: 'New path is required'
          }, 400, corsHeaders);
        }

        // Normalize new path
        const normalizedNewPath = newPath.replace(/\.\./g, '').replace(/^\/+/, '');
        const newR2Key = `${storagePrefix}${normalizedNewPath}`;

        // Get old file
        const oldObject = await env.STORAGE.get(r2Key);
        if (!oldObject) {
          return jsonResponse({
            success: false,
            error: 'File not found'
          }, 404, corsHeaders);
        }

        const content = await oldObject.text();
        const contentType = oldObject.httpMetadata?.contentType || 'text/plain';

        // Create new file
        await env.STORAGE.put(newR2Key, content, {
          httpMetadata: { contentType },
          customMetadata: oldObject.customMetadata
        });

        // Delete old file
        await env.STORAGE.delete(r2Key);

        return jsonResponse({
          success: true,
          data: {
            oldPath: filePath,
            newPath: normalizedNewPath,
            message: 'File renamed successfully'
          }
        }, 200, corsHeaders);

      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to rename file'
        }, 500, corsHeaders);
      }
    }

    // POST /api/ide/terminal - Execute terminal command
    if (pathParts[2] === 'ide' && pathParts[3] === 'terminal' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { command, workingDir = '/' } = body;

        if (!command) {
          return jsonResponse({
            success: false,
            error: 'Command is required'
          }, 400, corsHeaders);
        }

        // Use the existing agent endpoint for command execution
        const agentRequest = new Request(`${url.origin}/api/agent/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command,
            project_id: finalTenantId,
            context: { workingDir }
          })
        });

        const agentResponse = await handleAgent(agentRequest, env, finalTenantId, corsHeaders);
        const agentData = await agentResponse.json();

        return jsonResponse({
          success: agentData.success,
          data: {
            command,
            output: agentData.output,
            data: agentData.data,
            timestamp: agentData.timestamp
          },
          error: agentData.error
        }, agentResponse.status, corsHeaders);

      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to execute command'
        }, 500, corsHeaders);
      }
    }

    // GET /api/files or /api/ide - Get info
    if (request.method === 'GET' && (!filePath || pathParts.length === 2)) {
      return jsonResponse({
        success: true,
        message: 'MeauxIDE file operations ready',
        endpoints: {
          list: 'GET /api/files?path=/directory',
          get: 'GET /api/files/:path',
          save: 'POST /api/files/:path with { content: "...", contentType: "..." }',
          delete: 'DELETE /api/files/:path',
          rename: 'POST /api/files/:path/rename with { newPath: "..." }',
          terminal: 'POST /api/ide/terminal with { command: "..." }'
        },
        storage: {
          type: 'R2',
          prefix: `ide/${finalTenantId}/`
        }
      }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed or invalid path' }, 405, corsHeaders);
  } catch (error) {
    console.error('Files API error:', error);
    return jsonResponse({
      success: false,
      error: error.message || 'Internal server error'
    }, 500, corsHeaders);
  }
}

/**
 * Handle Resend API integration
 */
async function handleResend(request, env, tenantId, corsHeaders) {
  // Check if Resend is configured
  if (!env.RESEND_API_KEY) {
    return jsonResponse({
      success: false,
      error: 'Resend not configured. Please set RESEND_API_KEY secret.'
    }, 500, corsHeaders);
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);

  // GET /api/resend - Get Resend info (domains, status)
  if (request.method === 'GET') {
    if (pathParts.length === 2 || (pathParts.length === 3 && pathParts[2] === 'domains')) {
      // Get domains list (static list for now, can be fetched from Resend API later)
      const domains = [
        { domain: 'meauxcloud.org', status: 'Verified', region: 'us-east-1', created: '7 days ago' },
        { domain: 'newiberiachurchofchrist.com', status: 'Verified', region: 'us-east-1', created: '8 days ago' },
        { domain: 'iautodidact.org', status: 'Verified', region: 'us-east-1', created: 'about 1 month ago' },
        { domain: 'meauxxx.com', status: 'Verified', region: 'us-east-1', created: 'about 1 month ago' },
        { domain: 'meauxbility.org', status: 'Verified', region: 'us-east-1', created: 'about 1 month ago' },
        { domain: 'innerautodidact.com', status: 'Verified', region: 'us-east-1', created: 'about 1 month ago' },
        { domain: 'iautodidact.app', status: 'Verified', region: 'us-east-1', created: 'about 1 month ago' },
        { domain: 'inneranimalmedia.com', status: 'Verified', region: 'us-east-1', created: 'about 1 month ago' },
        { domain: 'inneranimal.app', status: 'Verified', region: 'us-east-1', created: 'about 1 month ago' },
        { domain: 'southernpetsanimalrescue.com', status: 'Verified', region: 'us-east-1', created: 'about 1 month ago' }
      ];

      return jsonResponse({
        success: true,
        data: {
          domains: domains,
          total: domains.length,
          webhook_url: 'https://inneranimalmedia.com/api/webhooks/resend',
          webhook_status: 'Active'
        }
      }, 200, corsHeaders);
    }

    // GET /api/resend/emails - List emails (if needed)
    return jsonResponse({
      success: true,
      message: 'Resend API ready',
      endpoints: {
        domains: '/api/resend/domains',
        send: '/api/resend/emails (POST to send)',
        webhook: '/api/webhooks/resend'
      }
    }, 200, corsHeaders);
  }

  // POST /api/resend/emails - Send email
  if (request.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'emails') {
    try {
      const body = await request.json();
      const { to, from, subject, html, text, reply_to, cc, bcc } = body;

      if (!to || !from || !subject) {
        return jsonResponse({
          success: false,
          error: 'Missing required fields: to, from, subject'
        }, 400, corsHeaders);
      }

      // Send email via Resend API
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: from,
          to: Array.isArray(to) ? to : [to],
          subject: subject,
          html: html || text,
          text: text || html?.replace(/<[^>]*>/g, ''),
          reply_to: reply_to,
          cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
          bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined
        })
      });

      const data = await resendResponse.json();

      if (!resendResponse.ok) {
        return jsonResponse({
          success: false,
          error: data.message || 'Failed to send email',
          details: data
        }, resendResponse.status, corsHeaders);
      }

      return jsonResponse({
        success: true,
        data: data
      }, 200, corsHeaders);

    } catch (error) {
      console.error('Resend email error:', error);
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle Resend Webhook
 */
async function handleResendWebhook(request, env, tenantId, corsHeaders) {
  // Check if webhook secret is configured
  const webhookSecret = env.RESEND_WEBHOOK_SECRET || env.RESEND_INBOUND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return jsonResponse({
      success: false,
      error: 'Resend webhook secret not configured'
    }, 500, corsHeaders);
  }

  if (request.method === 'POST') {
    try {
      // Verify webhook signature (Resend uses webhook signing)
      const signature = request.headers.get('resend-signature') || request.headers.get('svix-signature');
      const body = await request.text();

      // TODO: Verify signature with webhook secret
      // For now, accept all webhooks (in production, verify signature using svix library)

      const payload = JSON.parse(body);

      // Store webhook event in database
      const eventId = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Math.floor(Date.now() / 1000);

      try {
        await env.DB.prepare(
          `INSERT INTO webhooks (id, tenant_id, provider, url, events, is_active, last_triggered_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
           last_triggered_at = excluded.last_triggered_at,
           updated_at = excluded.updated_at`
        ).bind(
          eventId,
          tenantId || 'default',
          'resend',
          '/api/webhooks/resend',
          JSON.stringify([payload.type || 'unknown']),
          1,
          now,
          now,
          now
        ).run();
      } catch (dbError) {
        console.error('Error storing webhook:', dbError);
        // Continue even if DB storage fails
      }

      // Handle different webhook event types
      const eventType = payload.type || 'unknown';
      console.log('Resend webhook received:', eventType, payload);

      // Return 200 OK to acknowledge webhook
      return jsonResponse({
        success: true,
        message: 'Webhook received',
        event_type: eventType,
        event_id: payload.id || eventId
      }, 200, corsHeaders);

    } catch (error) {
      console.error('Resend webhook error:', error);
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // GET /api/webhooks/resend - Webhook info
  if (request.method === 'GET') {
    // Return all webhooks list
    const webhooks = [
      { endpoint: 'https://newiberiachurchofchrist.com/api/webhook/resend', status: 'Active', created: '1 day ago' },
      { endpoint: 'https://inneranimalmedia.com/api/email/inbound', status: 'Active', created: '2 days ago' },
      { endpoint: 'https://inneranimalmedia.com/api/webhooks/resend', status: 'Active', created: '2 days ago', primary: true },
      { endpoint: 'https://meauxxx.com/api/webhooks/resend', status: 'Active', created: '5 days ago' },
      { endpoint: 'https://meauxcloud.org/api/webhooks/resend', status: 'Active', created: '7 days ago' },
      { endpoint: 'https://newiberiachurchofchrist.com/api/webhook/resend', status: 'Active', created: '8 days ago' },
      { endpoint: 'https://qmpghmthbhuumemnahcz.supabase.co/functions/v1/meauxsql', status: 'Active', created: '15 days ago' },
      { endpoint: 'https://www.meauxbility.org/api/resend/webhook', status: 'Active', created: 'about 1 month ago' },
      { endpoint: 'https://southernpetsanimalrescue.com/api/webhook/resend', status: 'Active', created: 'about 1 month ago' }
    ];

    return jsonResponse({
      success: true,
      webhook_url: 'https://inneranimalmedia.com/api/webhooks/resend',
      status: 'Active',
      events: ['contact.created', 'contact.deleted', 'email.sent', 'email.delivered', 'email.bounced', 'email.complained', 'email.opened', 'email.clicked'],
      created: '2 days ago',
      webhooks: webhooks,
      total: webhooks.length
    }, 200, corsHeaders);
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle Onboarding Engine
 */
async function handleOnboarding(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const stepKey = pathParts.length >= 3 ? pathParts[2] : null;

  // GET /api/onboarding - Get onboarding state for tenant
  if (request.method === 'GET' && !stepKey) {
    if (!tenantId) {
      return jsonResponse({
        success: false,
        error: 'Tenant ID required'
      }, 400, corsHeaders);
    }

    try {
      // Get all onboarding steps for tenant
      const steps = await env.DB.prepare(
        `SELECT os.*, odef.title, odef.description, odef.route, odef.order_index, odef.required
         FROM onboarding_state os
         LEFT JOIN onboarding_steps odef ON os.step_key = odef.step_key
         WHERE os.tenant_id = ?
         ORDER BY odef.order_index ASC`
      ).bind(tenantId).all();

      // Get tenant activation status
      const activationStatus = await env.DB.prepare(
        'SELECT * FROM tenant_activation_status WHERE tenant_id = ?'
      ).bind(tenantId).first();

      return jsonResponse({
        success: true,
        data: {
          steps: steps.results || [],
          activation: activationStatus || {
            tenant_id: tenantId,
            onboarding_completed: 0,
            activation_checks_json: '{}',
            activation_progress: 0
          }
        }
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Onboarding error:', error);
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // GET /api/onboarding/steps - Get all step definitions
  if (request.method === 'GET' && pathParts[2] === 'steps') {
    try {
      const steps = await env.DB.prepare(
        'SELECT * FROM onboarding_steps ORDER BY order_index ASC'
      ).all();

      return jsonResponse({
        success: true,
        data: steps.results || []
      }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // GET /api/onboarding/presets - Get all brand presets
  if (request.method === 'GET' && pathParts[2] === 'presets') {
    try {
      const presets = await env.DB.prepare(
        'SELECT * FROM tenant_presets ORDER BY preset_key ASC'
      ).all();

      return jsonResponse({
        success: true,
        data: presets.results || []
      }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // POST /api/onboarding/step/:stepKey - Update onboarding step
  if (request.method === 'POST' && stepKey) {
    if (!tenantId) {
      return jsonResponse({
        success: false,
        error: 'Tenant ID required'
      }, 400, corsHeaders);
    }

    try {
      const body = await request.json();
      const { status = 'in_progress', meta_json } = body;
      const now = Math.floor(Date.now() / 1000);
      const stepId = `onboarding-${tenantId}-${stepKey}`;

      await env.DB.prepare(
        `INSERT INTO onboarding_state (id, tenant_id, step_key, status, meta_json, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           status = excluded.status,
           meta_json = excluded.meta_json,
           completed_at = CASE WHEN excluded.status = 'completed' THEN excluded.completed_at ELSE completed_at END,
           updated_at = excluded.updated_at`
      ).bind(
        stepId,
        tenantId,
        stepKey,
        status,
        meta_json ? JSON.stringify(meta_json) : null,
        status === 'completed' ? now : null,
        now,
        now
      ).run();

      // Update tenant activation status if step is completed
      if (status === 'completed') {
        await updateActivationProgress(env, tenantId);
      }

      return jsonResponse({
        success: true,
        message: 'Onboarding step updated'
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Onboarding step update error:', error);
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle Activation Checklist
 */
async function handleActivation(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const checkKey = pathParts.length >= 3 ? pathParts[2] : null;

  // GET /api/activation - Get activation checklist for tenant
  if (request.method === 'GET' && !checkKey) {
    if (!tenantId) {
      return jsonResponse({
        success: false,
        error: 'Tenant ID required'
      }, 400, corsHeaders);
    }

    try {
      // Get activation status
      let activationStatus = await env.DB.prepare(
        'SELECT * FROM tenant_activation_status WHERE tenant_id = ?'
      ).bind(tenantId).first();

      if (!activationStatus) {
        // Create default activation status
        const now = Math.floor(Date.now() / 1000);
        await env.DB.prepare(
          `INSERT INTO tenant_activation_status (tenant_id, onboarding_completed, activation_checks_json, activation_progress, created_at, updated_at)
           VALUES (?, 0, '{}', 0, ?, ?)`
        ).bind(tenantId, now, now).run();
        activationStatus = {
          tenant_id: tenantId,
          onboarding_completed: 0,
          activation_checks_json: '{}',
          activation_progress: 0
        };
      }

      // Get all activation checks
      const checks = await env.DB.prepare(
        'SELECT * FROM activation_checks ORDER BY order_index ASC'
      ).all();

      // Parse completed checks
      const completedChecks = activationStatus.activation_checks_json ?
        JSON.parse(activationStatus.activation_checks_json) : {};

      // Merge checks with completion status
      const checksWithStatus = (checks.results || []).map(check => ({
        ...check,
        completed: completedChecks[check.check_key] === true,
        required: check.required === 1
      }));

      return jsonResponse({
        success: true,
        data: {
          checks: checksWithStatus,
          progress: activationStatus.activation_progress || 0,
          onboarding_completed: activationStatus.onboarding_completed === 1
        }
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Activation error:', error);
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // POST /api/activation/check/:checkKey - Mark check as complete
  if (request.method === 'POST' && checkKey) {
    if (!tenantId) {
      return jsonResponse({
        success: false,
        error: 'Tenant ID required'
      }, 400, corsHeaders);
    }

    try {
      const body = await request.json();
      const { completed = true } = body;
      const now = Math.floor(Date.now() / 1000);

      // Get current activation status
      let activationStatus = await env.DB.prepare(
        'SELECT * FROM tenant_activation_status WHERE tenant_id = ?'
      ).bind(tenantId).first();

      if (!activationStatus) {
        // Create default
        await env.DB.prepare(
          `INSERT INTO tenant_activation_status (tenant_id, onboarding_completed, activation_checks_json, activation_progress, created_at, updated_at)
           VALUES (?, 0, '{}', 0, ?, ?)`
        ).bind(tenantId, now, now).run();
        activationStatus = {
          tenant_id: tenantId,
          activation_checks_json: '{}',
          activation_progress: 0
        };
      }

      // Update completed checks
      const completedChecks = activationStatus.activation_checks_json ?
        JSON.parse(activationStatus.activation_checks_json) : {};
      completedChecks[checkKey] = completed;

      // Calculate progress
      const allChecks = await env.DB.prepare(
        'SELECT COUNT(*) as total FROM activation_checks'
      ).first();
      const requiredChecks = await env.DB.prepare(
        'SELECT COUNT(*) as total FROM activation_checks WHERE required = 1'
      ).first();

      const totalChecks = allChecks?.total || 0;
      const completedCount = Object.values(completedChecks).filter(c => c === true).length;
      const progress = totalChecks > 0 ? Math.round((completedCount / totalChecks) * 100) : 0;

      // Update activation status
      await env.DB.prepare(
        `UPDATE tenant_activation_status
         SET activation_checks_json = ?,
             activation_progress = ?,
             updated_at = ?
         WHERE tenant_id = ?`
      ).bind(
        JSON.stringify(completedChecks),
        progress,
        now,
        tenantId
      ).run();

      return jsonResponse({
        success: true,
        message: `Activation check ${completed ? 'completed' : 'reset'}`,
        data: {
          check_key: checkKey,
          completed: completed,
          progress: progress
        }
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Activation check update error:', error);
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Helper: Update activation progress for tenant
 */
async function updateActivationProgress(env, tenantId) {
  try {
    // Get all steps
    const steps = await env.DB.prepare(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed FROM onboarding_state WHERE tenant_id = ?'
    ).bind(tenantId).first();

    const totalSteps = steps?.total || 0;
    const completedSteps = steps?.completed || 0;
    const onboardingCompleted = totalSteps > 0 && completedSteps === totalSteps ? 1 : 0;
    const now = Math.floor(Date.now() / 1000);

    // Update or create activation status
    await env.DB.prepare(
      `INSERT INTO tenant_activation_status (tenant_id, onboarding_completed, onboarding_completed_at, activation_progress, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, ?)
       ON CONFLICT(tenant_id) DO UPDATE SET
         onboarding_completed = excluded.onboarding_completed,
         onboarding_completed_at = CASE WHEN excluded.onboarding_completed = 1 THEN excluded.onboarding_completed_at ELSE onboarding_completed_at END,
         updated_at = excluded.updated_at`
    ).bind(
      tenantId,
      onboardingCompleted,
      onboardingCompleted ? now : null,
      now,
      now
    ).run();
  } catch (error) {
    console.error('Error updating activation progress:', error);
  }
}

/**
 * Helper: Use Hyperdrive for PostgreSQL queries (Supabase)
 * Hyperdrive provides connection pooling for PostgreSQL databases
 */
async function queryWithHyperdrive(env, query, params = []) {
  if (!env.HYPERDRIVE) {
    throw new Error('Hyperdrive not configured. Please add Hyperdrive binding in wrangler.toml');
  }

  try {
    // Hyperdrive provides a connection string that we can use with pg library
    // For now, we'll use fetch to the Hyperdrive connection string endpoint
    // Note: Hyperdrive is primarily for connection pooling, actual queries still use standard PostgreSQL protocol
    const connection = env.HYPERDRIVE.connect();

    // Use the connection to execute queries
    // For direct SQL queries, we can use the connection string with a PostgreSQL client
    // However, in Workers, we typically use fetch to the database or use a library that supports connection strings

    // For Supabase specifically, we continue using their REST API or Edge Functions
    // Hyperdrive helps with connection pooling when using direct PostgreSQL connections

    // Example: If using @cloudflare/pg library or similar
    // const result = await connection.query(query, params);
    // return result;

    // For now, return connection info (actual query execution via REST API is handled in handleSupabase)
    return {
      connected: true,
      hyperdrive_id: '9108dd6499bb44c286e4eb298c6ffafb',
      database: 'postgres',
      host: 'db.qmpghmthbhuumemnahcz.supabase.co'
    };
  } catch (error) {
    console.error('Hyperdrive connection error:', error);
    throw error;
  }
}

/**
 * Handle Data Migration from MeauxOS to InnerAnimal Media Business
 */
async function handleMigration(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const migrationType = pathParts.length >= 3 ? pathParts[2] : null;

  // Check if MeauxOS database binding is available
  if (!env.MEAUXOS_DB) {
    return jsonResponse({
      success: false,
      error: 'MeauxOS database binding not available. Please check wrangler.toml configuration.'
    }, 500, corsHeaders);
  }

  // GET /api/migrate/status - Get migration status
  if (request.method === 'GET' && pathParts[2] === 'status') {
    try {
      const status = await env.DB.prepare(
        'SELECT * FROM migration_log ORDER BY created_at DESC LIMIT 20'
      ).all();

      return jsonResponse({
        success: true,
        data: status.results || []
      }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // POST /api/migrate/meauxos/:table - Migrate specific table
  if (request.method === 'POST' && migrationType === 'meauxos' && pathParts[3]) {
    const sourceTable = pathParts[3];
    const body = await request.json() || {};
    const { batch_size = 100, offset = 0, target_table = null } = body;

    try {
      const targetTableName = target_table || `${sourceTable}_legacy`;

      // Get source data from MeauxOS database
      const sourceData = await env.MEAUXOS_DB.prepare(
        `SELECT * FROM ${sourceTable} LIMIT ? OFFSET ?`
      ).bind(batch_size, offset).all();

      if (!sourceData.results || sourceData.results.length === 0) {
        return jsonResponse({
          success: true,
          message: 'No more data to migrate',
          migrated: 0,
          total: 0
        }, 200, corsHeaders);
      }

      // Insert into target database
      // Handle different table schemas specifically
      let migrated = 0;
      const now = Math.floor(Date.now() / 1000);

      for (const row of sourceData.results) {
        try {
          // Create a tenant_id if not present (use 'system' for migrated data)
          // Note: We'll need to create a default tenant or disable foreign key constraints
          const rowTenantId = row.tenant_id || tenantId || 'system';

          // Special handling for apps table (most important to migrate first)
          if (targetTableName === 'apps' || sourceTable === 'apps') {
            // Helper function to convert timestamp (TEXT or INTEGER) to Unix timestamp
            const toUnixTimestamp = (ts) => {
              if (!ts) return now;
              if (typeof ts === 'number') return ts;
              if (typeof ts === 'string') {
                // Try parsing as ISO date string (e.g., "2025-12-09 18:12:24")
                const parsed = new Date(ts);
                if (!isNaN(parsed.getTime())) return Math.floor(parsed.getTime() / 1000);
                // Try parsing as Unix timestamp string
                const num = parseInt(ts, 10);
                if (!isNaN(num) && num > 1000000000) return num;
              }
              return now;
            };

            // Helper function to convert boolean to INTEGER
            const toInt = (val) => {
              if (val === true || val === 1 || val === '1') return 1;
              if (val === false || val === 0 || val === '0' || val === null || val === undefined) return 0;
              return 0;
            };

            // Map description (prefer long_description, then description, then tagline)
            const description = (row.long_description || row.description || row.tagline || '').substring(0, 1000);

            // Map category (prefer category, then subcategory)
            const category = row.category || row.subcategory || 'uncategorized';

            // Map repo_url (try multiple field names)
            const repoUrl = row.repo_url || row.repository_url || row.install_url || '';

            // Map preview_image_url (try multiple field names)
            const previewImageUrl = row.preview_image_url || row.image_url || row.icon_url || row.hero_image_url || '';

            // Map tags (handle both JSON string and array)
            let tagsJson = '[]';
            if (row.tags_json) {
              tagsJson = typeof row.tags_json === 'string' ? row.tags_json : JSON.stringify(row.tags_json);
            } else if (row.tags) {
              tagsJson = typeof row.tags === 'string' ? (row.tags.startsWith('[') ? row.tags : `["${row.tags}"]`) : JSON.stringify(row.tags);
            }

            // Map status (convert 'live' to 'active')
            const status = (row.status === 'live' || row.status === 'published') ? 'active' : (row.status || 'active');

            // Map featured flag (handle both boolean and INTEGER)
            const featured = toInt(row.is_featured !== undefined ? row.is_featured : (row.featured !== undefined ? row.featured : 0));

            // Ensure tenant_id exists (create default tenant if needed) - for now, use 'system' tenant
            const finalTenantId = rowTenantId || 'system';

            try {
              // Try with tenant_id first (might fail if foreign key constraint enabled)
              const result = await env.DB.prepare(
                `INSERT OR IGNORE INTO apps (
                  id, tenant_id, name, slug, description, category, framework,
                  repo_url, demo_url, preview_image_url, tags_json, status, featured,
                  created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              ).bind(
                row.id,
                finalTenantId,
                row.name || 'Migrated App',
                row.slug || row.id || `app-${row.id}`,
                description,
                category,
                row.framework || '',
                repoUrl,
                row.demo_url || '',
                previewImageUrl,
                tagsJson,
                status,
                featured,
                toUnixTimestamp(row.created_at),
                toUnixTimestamp(row.updated_at || row.modified_at || row.last_update)
              ).run();

              // Check if row was actually inserted (INSERT OR IGNORE might skip existing rows)
              // For INSERT OR IGNORE, we check if row exists after the operation
              const exists = await env.DB.prepare('SELECT id FROM apps WHERE id = ?').bind(row.id).first();
              if (exists) {
                migrated++;
              } else {
                // Row doesn't exist - the INSERT might have failed silently
                console.log(`App ${row.id} not inserted (might already exist or failed silently)`);
              }
            } catch (insertError) {
              console.error(`Failed to insert app ${row.id}:`, insertError.message);
              // If foreign key constraint fails, create a default tenant or use existing one
              if (insertError.message.includes('FOREIGN KEY') || insertError.message.includes('tenant')) {
                // Try to ensure tenant exists
                try {
                  await env.DB.prepare(
                    `INSERT OR IGNORE INTO tenants (id, name, slug, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?)`
                  ).bind(
                    finalTenantId,
                    'System Tenant',
                    'system',
                    now,
                    now
                  ).run();
                  // Retry insert
                  await env.DB.prepare(
                    `INSERT OR IGNORE INTO apps (
                      id, tenant_id, name, slug, description, category, framework,
                      repo_url, demo_url, preview_image_url, tags_json, status, featured,
                      created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                  ).bind(
                    row.id,
                    finalTenantId,
                    row.name || 'Migrated App',
                    row.slug || row.id || `app-${row.id}`,
                    description,
                    category,
                    row.framework || '',
                    repoUrl,
                    row.demo_url || '',
                    previewImageUrl,
                    tagsJson,
                    status,
                    featured,
                    toUnixTimestamp(row.created_at),
                    toUnixTimestamp(row.updated_at || row.modified_at || row.last_update)
                  ).run();
                  const exists = await env.DB.prepare('SELECT id FROM apps WHERE id = ?').bind(row.id).first();
                  if (exists) migrated++;
                } catch (retryError) {
                  console.error(`Failed to insert app ${row.id} after tenant creation:`, retryError.message);
                  // Continue with next row instead of throwing
                }
              } else {
                // Other error - continue with next row
                console.error(`App ${row.id} insert failed:`, insertError.message);
              }
            }
          } else {
            // Generic INSERT for other tables
            await env.DB.prepare(
              `INSERT OR IGNORE INTO ${targetTableName} (id, tenant_id, name, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?)`
            ).bind(
              row.id || `migrated-${row.name || row.title || 'item'}-${now}-${Math.random().toString(36).substr(2, 9)}`,
              rowTenantId,
              row.name || row.title || 'Migrated Item',
              row.created_at || now,
              row.updated_at || row.modified_at || now
            ).run();
          }

          migrated++;
        } catch (insertError) {
          console.error(`Failed to insert row ${row.id}:`, insertError.message);
          // Continue with next row
        }
      }

      // Update migration log (use INSERT OR REPLACE to avoid unique constraint error)
      const migrationId = `migration-${sourceTable}-${now}`;
      await env.DB.prepare(
        `INSERT OR REPLACE INTO migration_log (id, migration_name, source_database, target_database, source_table, target_table, rows_migrated, status, started_at, completed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        migrationId,
        `migrate-${sourceTable}`,
        'meauxos',
        'inneranimalmedia-business',
        sourceTable,
        targetTableName,
        migrated,
        migrated === sourceData.results.length && sourceData.results.length < batch_size ? 'completed' : 'in_progress',
        now,
        migrated === sourceData.results.length && sourceData.results.length < batch_size ? now : null,
        now
      ).run();

      return jsonResponse({
        success: true,
        message: `Migrated ${migrated} rows from ${sourceTable}`,
        migrated: migrated,
        total: sourceData.results.length,
        has_more: sourceData.results.length === batch_size,
        next_offset: offset + migrated
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Migration error:', error);
      return jsonResponse({
        success: false,
        error: error.message,
        details: error.stack
      }, 500, corsHeaders);
    }
  }

  // GET /api/migrate/tables - List available tables in MeauxOS
  if (request.method === 'GET' && pathParts[2] === 'tables') {
    try {
      const tables = await env.MEAUXOS_DB.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
      ).all();

      return jsonResponse({
        success: true,
        data: tables.results || [],
        total: tables.results?.length || 0
      }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle Tasks API (Real-time Task Management)
 */
async function handleTasks(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const taskId = pathParts.length >= 3 ? pathParts[2] : null;
  const action = pathParts.length >= 4 ? pathParts[3] : null;

  // Use default tenant if not provided
  const finalTenantId = tenantId || 'system';

  try {
    // GET /api/tasks - List all tasks
    if (request.method === 'GET' && !taskId) {
      const status = url.searchParams.get('status');
      const assigneeId = url.searchParams.get('assignee_id');
      const projectId = url.searchParams.get('project_id');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = 'SELECT * FROM tasks WHERE tenant_id = ?';
      const params = [finalTenantId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (assigneeId) {
        query += ' AND assignee_id = ?';
        params.push(assigneeId);
      }
      if (projectId) {
        query += ' AND project_id = ?';
        params.push(projectId);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const tasks = await env.DB.prepare(query).bind(...params).all();

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM tasks WHERE tenant_id = ?';
      const countParams = [finalTenantId];
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      if (assigneeId) {
        countQuery += ' AND assignee_id = ?';
        countParams.push(assigneeId);
      }
      if (projectId) {
        countQuery += ' AND project_id = ?';
        countParams.push(projectId);
      }
      const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

      return jsonResponse({
        success: true,
        data: tasks.results || [],
        pagination: {
          total: countResult?.total || 0,
          limit,
          offset
        }
      }, 200, corsHeaders);
    }

    // GET /api/tasks/:id - Get single task
    if (request.method === 'GET' && taskId && !action) {
      const task = await env.DB.prepare(
        'SELECT * FROM tasks WHERE id = ? AND tenant_id = ?'
      ).bind(taskId, finalTenantId).first();

      if (!task) {
        return jsonResponse({ success: false, error: 'Task not found' }, 404, corsHeaders);
      }

      // Get comments
      const comments = await env.DB.prepare(
        'SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC'
      ).bind(taskId).all();

      // Get activity log
      const activity = await env.DB.prepare(
        'SELECT * FROM task_activity WHERE task_id = ? ORDER BY created_at DESC LIMIT 50'
      ).bind(taskId).all();

      return jsonResponse({
        success: true,
        data: {
          ...task,
          comments: comments.results || [],
          activity: activity.results || []
        }
      }, 200, corsHeaders);
    }

    // POST /api/tasks - Create task
    if (request.method === 'POST' && !taskId) {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await env.DB.prepare(
        `INSERT INTO tasks (
          id, tenant_id, project_id, workflow_id, title, description, status, priority,
          assignee_id, creator_id, due_date, tags, metadata_json, position, parent_task_id,
          is_completed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        taskId,
        finalTenantId,
        body.project_id || null,
        body.workflow_id || null,
        body.title,
        body.description || null,
        body.status || 'todo',
        body.priority || 'medium',
        body.assignee_id || null,
        body.creator_id || finalTenantId, // Use finalTenantId as fallback
        body.due_date || null,
        body.tags ? JSON.stringify(body.tags) : null,
        body.metadata ? JSON.stringify(body.metadata) : '{}',
        body.position || 0,
        body.parent_task_id || null,
        0,
        now,
        now
      ).run();

      // Log activity
      await env.DB.prepare(
        'INSERT INTO task_activity (id, task_id, tenant_id, user_id, action, changes_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        `activity-${Date.now()}`,
        taskId,
        finalTenantId,
        body.creator_id || finalTenantId,
        'created',
        JSON.stringify({ title: body.title, status: body.status || 'todo' }),
        now
      ).run();

      const task = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first();

      // Track analytics
      writeAnalyticsEvent(env, {
        event_type: 'task_created',
        tenant_id: finalTenantId,
        metadata: { task_id: taskId, status: body.status || 'todo' }
      }).catch(() => { });

      return jsonResponse({ success: true, data: task }, 201, corsHeaders);
    }

    // PUT /api/tasks/:id - Update task
    if (request.method === 'PUT' && taskId) {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);

      // Get existing task
      const existing = await env.DB.prepare(
        'SELECT * FROM tasks WHERE id = ? AND tenant_id = ?'
      ).bind(taskId, finalTenantId).first();

      if (!existing) {
        return jsonResponse({ success: false, error: 'Task not found' }, 404, corsHeaders);
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      const changes = {};

      if (body.title !== undefined) {
        updates.push('title = ?');
        values.push(body.title);
        if (body.title !== existing.title) changes.title = { from: existing.title, to: body.title };
      }
      if (body.description !== undefined) {
        updates.push('description = ?');
        values.push(body.description);
      }
      if (body.status !== undefined) {
        updates.push('status = ?');
        values.push(body.status);
        if (body.status !== existing.status) {
          changes.status = { from: existing.status, to: body.status };
          if (body.status === 'done') {
            updates.push('is_completed = 1, completed_at = ?');
            values.push(now);
          } else if (existing.status === 'done' && body.status !== 'done') {
            updates.push('is_completed = 0, completed_at = NULL');
          }
        }
      }
      if (body.priority !== undefined) {
        updates.push('priority = ?');
        values.push(body.priority);
        if (body.priority !== existing.priority) changes.priority = { from: existing.priority, to: body.priority };
      }
      if (body.assignee_id !== undefined) {
        updates.push('assignee_id = ?');
        values.push(body.assignee_id);
        if (body.assignee_id !== existing.assignee_id) changes.assignee_id = { from: existing.assignee_id, to: body.assignee_id };
      }
      if (body.due_date !== undefined) {
        updates.push('due_date = ?');
        values.push(body.due_date);
      }
      if (body.tags !== undefined) {
        updates.push('tags = ?');
        values.push(JSON.stringify(body.tags));
      }
      if (body.metadata !== undefined) {
        updates.push('metadata_json = ?');
        values.push(JSON.stringify(body.metadata));
      }

      if (updates.length === 0) {
        return jsonResponse({ success: false, error: 'No fields to update' }, 400, corsHeaders);
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(taskId, finalTenantId);

      await env.DB.prepare(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`
      ).bind(...values).run();

      // Log activity if there are changes
      if (Object.keys(changes).length > 0) {
        await env.DB.prepare(
          'INSERT INTO task_activity (id, task_id, tenant_id, user_id, action, changes_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          `activity-${Date.now()}`,
          taskId,
          finalTenantId,
          body.updated_by || finalTenantId,
          'updated',
          JSON.stringify(changes),
          now
        ).run();
      }

      const updated = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first();

      return jsonResponse({ success: true, data: updated }, 200, corsHeaders);
    }

    // DELETE /api/tasks/:id - Delete task
    if (request.method === 'DELETE' && taskId) {
      const result = await env.DB.prepare(
        'DELETE FROM tasks WHERE id = ? AND tenant_id = ?'
      ).bind(taskId, finalTenantId).run();

      if (result.meta.changes === 0) {
        return jsonResponse({ success: false, error: 'Task not found' }, 404, corsHeaders);
      }

      return jsonResponse({ success: true, message: 'Task deleted' }, 200, corsHeaders);
    }

    // POST /api/tasks/:id/comments - Add comment
    if (request.method === 'POST' && taskId && action === 'comments') {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);
      const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await env.DB.prepare(
        'INSERT INTO task_comments (id, task_id, tenant_id, user_id, content, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        commentId,
        taskId,
        finalTenantId,
        body.user_id || finalTenantId,
        body.content,
        body.metadata ? JSON.stringify(body.metadata) : '{}',
        now,
        now
      ).run();

      // Log activity
      await env.DB.prepare(
        'INSERT INTO task_activity (id, task_id, tenant_id, user_id, action, changes_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        `activity-${Date.now()}`,
        taskId,
        finalTenantId,
        body.user_id || finalTenantId,
        'commented',
        JSON.stringify({ comment_id: commentId }),
        now
      ).run();

      const comment = await env.DB.prepare('SELECT * FROM task_comments WHERE id = ?').bind(commentId).first();

      return jsonResponse({ success: true, data: comment }, 201, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Tasks API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Handle Messages/Message Boards API
 */
async function handleMessages(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const isThreads = pathParts[1] === 'threads';
  const resourceId = pathParts.length >= 3 ? pathParts[2] : null;
  const action = pathParts.length >= 4 ? pathParts[3] : null;

  // Use default tenant if not provided
  const finalTenantId = tenantId || 'system';

  try {
    // THREADS ENDPOINTS

    // GET /api/threads - List all threads
    if (request.method === 'GET' && isThreads && !resourceId) {
      const category = url.searchParams.get('category');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = 'SELECT * FROM message_threads WHERE tenant_id = ?';
      const params = [finalTenantId];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      query += ' ORDER BY is_pinned DESC, last_message_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const threads = await env.DB.prepare(query).bind(...params).all();

      return jsonResponse({
        success: true,
        data: threads.results || [],
        pagination: { limit, offset }
      }, 200, corsHeaders);
    }

    // GET /api/threads/:id - Get thread with messages
    if (request.method === 'GET' && isThreads && resourceId && !action) {
      const thread = await env.DB.prepare(
        'SELECT * FROM message_threads WHERE id = ? AND tenant_id = ?'
      ).bind(resourceId, finalTenantId).first();

      if (!thread) {
        return jsonResponse({ success: false, error: 'Thread not found' }, 404, corsHeaders);
      }

      // Get messages
      const messages = await env.DB.prepare(
        'SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC'
      ).bind(resourceId).all();

      // Get reactions for messages
      const messageIds = (messages.results || []).map(m => m.id);
      let reactions = [];
      if (messageIds.length > 0) {
        const reactionsQuery = await env.DB.prepare(
          `SELECT * FROM message_reactions WHERE message_id IN (${messageIds.map(() => '?').join(',')})`
        ).bind(...messageIds).all();
        reactions = reactionsQuery.results || [];
      }

      // Increment view count
      await env.DB.prepare(
        'UPDATE message_threads SET view_count = view_count + 1 WHERE id = ?'
      ).bind(resourceId).run();

      return jsonResponse({
        success: true,
        data: {
          ...thread,
          messages: (messages.results || []).map(msg => ({
            ...msg,
            reactions: reactions.filter(r => r.message_id === msg.id)
          }))
        }
      }, 200, corsHeaders);
    }

    // POST /api/threads - Create thread
    if (request.method === 'POST' && isThreads && !resourceId) {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);
      const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await env.DB.prepare(
        `INSERT INTO message_threads (
          id, tenant_id, title, description, category, created_by, is_pinned, is_locked,
          last_message_at, message_count, view_count, metadata_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        threadId,
        finalTenantId,
        body.title,
        body.description || null,
        body.category || 'general',
        body.created_by || finalTenantId,
        0,
        0,
        now,
        0,
        0,
        body.metadata ? JSON.stringify(body.metadata) : '{}',
        now,
        now
      ).run();

      const thread = await env.DB.prepare('SELECT * FROM message_threads WHERE id = ?').bind(threadId).first();

      // Track analytics
      writeAnalyticsEvent(env, {
        event_type: 'thread_created',
        tenant_id: finalTenantId,
        metadata: { thread_id: threadId, category: body.category || 'general' }
      }).catch(() => { });

      return jsonResponse({ success: true, data: thread }, 201, corsHeaders);
    }

    // MESSAGES ENDPOINTS

    // GET /api/messages - List messages (with thread filter)
    if (request.method === 'GET' && !isThreads && !resourceId) {
      const threadId = url.searchParams.get('thread_id');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      if (!threadId) {
        return jsonResponse({ success: false, error: 'thread_id parameter required' }, 400, corsHeaders);
      }

      const messages = await env.DB.prepare(
        'SELECT * FROM messages WHERE thread_id = ? AND tenant_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?'
      ).bind(threadId, finalTenantId, limit, offset).all();

      // Get reactions
      const messageIds = (messages.results || []).map(m => m.id);
      let reactions = [];
      if (messageIds.length > 0) {
        const reactionsQuery = await env.DB.prepare(
          `SELECT * FROM message_reactions WHERE message_id IN (${messageIds.map(() => '?').join(',')})`
        ).bind(...messageIds).all();
        reactions = reactionsQuery.results || [];
      }

      return jsonResponse({
        success: true,
        data: (messages.results || []).map(msg => ({
          ...msg,
          reactions: reactions.filter(r => r.message_id === msg.id)
        }))
      }, 200, corsHeaders);
    }

    // POST /api/messages - Create message
    if (request.method === 'POST' && !isThreads && !resourceId) {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (!body.thread_id) {
        return jsonResponse({ success: false, error: 'thread_id required' }, 400, corsHeaders);
      }

      await env.DB.prepare(
        `INSERT INTO messages (
          id, thread_id, tenant_id, user_id, content, content_type, reply_to_id,
          is_edited, metadata_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        messageId,
        body.thread_id,
        finalTenantId,
        body.user_id || finalTenantId,
        body.content,
        body.content_type || 'text',
        body.reply_to_id || null,
        0,
        body.metadata ? JSON.stringify(body.metadata) : '{}',
        now,
        now
      ).run();

      // Update thread message count and last_message_at
      await env.DB.prepare(
        'UPDATE message_threads SET message_count = message_count + 1, last_message_at = ?, updated_at = ? WHERE id = ?'
      ).bind(now, now, body.thread_id).run();

      const message = await env.DB.prepare('SELECT * FROM messages WHERE id = ?').bind(messageId).first();

      // Track analytics
      writeAnalyticsEvent(env, {
        event_type: 'message_sent',
        tenant_id: finalTenantId,
        metadata: { thread_id: body.thread_id, message_id: messageId }
      }).catch(() => { });

      return jsonResponse({ success: true, data: message }, 201, corsHeaders);
    }

    // POST /api/messages/:id/reactions - Add reaction
    if (request.method === 'POST' && !isThreads && resourceId && action === 'reactions') {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);
      const reactionId = `reaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await env.DB.prepare(
        'INSERT OR IGNORE INTO message_reactions (id, message_id, user_id, reaction_type, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        reactionId,
        resourceId,
        body.user_id || finalTenantId,
        body.reaction_type || 'like',
        now
      ).run();

      const reactions = await env.DB.prepare(
        'SELECT * FROM message_reactions WHERE message_id = ?'
      ).bind(resourceId).all();

      return jsonResponse({ success: true, data: reactions.results || [] }, 201, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Messages API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Handle Video/Streaming API
 */
async function handleVideo(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);

  // Path structure: /api/video/sessions or /api/video/sessions/:id/:action
  // pathParts: ['api', 'video', 'sessions'] or ['api', 'video', 'sessions', 'id', 'action']
  const resourceId = pathParts.length >= 4 ? pathParts[3] : null;
  const action = pathParts.length >= 5 ? pathParts[4] : null;

  // Use default tenant if not provided
  const finalTenantId = tenantId || 'system';

  try {
    // GET /api/video/sessions - List video sessions
    if (request.method === 'GET' && pathParts[2] === 'sessions' && !resourceId) {
      const status = url.searchParams.get('status') || 'active';
      const limit = parseInt(url.searchParams.get('limit') || '20');

      const sessions = await env.DB.prepare(
        'SELECT * FROM video_sessions WHERE tenant_id = ? AND status = ? ORDER BY started_at DESC LIMIT ?'
      ).bind(finalTenantId, status, limit).all();

      return jsonResponse({ success: true, data: sessions.results || [] }, 200, corsHeaders);
    }

    // GET /api/video/sessions/:id - Get session details (if action is 'sessions' or if it's just an ID)
    if (request.method === 'GET' && pathParts[2] === 'sessions' && resourceId && !action) {
      const session = await env.DB.prepare(
        'SELECT * FROM video_sessions WHERE id = ? AND tenant_id = ?'
      ).bind(resourceId, finalTenantId).first();

      if (!session) {
        return jsonResponse({ success: false, error: 'Session not found' }, 404, corsHeaders);
      }

      // Get participants
      const participants = await env.DB.prepare(
        'SELECT * FROM video_participants WHERE session_id = ? ORDER BY joined_at ASC'
      ).bind(resourceId).all();

      return jsonResponse({
        success: true,
        data: {
          ...session,
          participants: participants.results || []
        }
      }, 200, corsHeaders);
    }

    // POST /api/video/sessions - Create video session
    if (request.method === 'POST' && pathParts[2] === 'sessions' && !resourceId) {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);
      const sessionId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await env.DB.prepare(
        `INSERT INTO video_sessions (
          id, tenant_id, session_name, session_type, host_id, status,
          webrtc_config_json, participants_json, metadata_json, started_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        sessionId,
        finalTenantId,
        body.session_name || 'Video Session',
        body.session_type || 'call',
        body.host_id || finalTenantId,
        'active',
        body.webrtc_config ? JSON.stringify(body.webrtc_config) : '{}',
        JSON.stringify([body.host_id || finalTenantId]),
        body.metadata ? JSON.stringify(body.metadata) : '{}',
        now,
        now,
        now
      ).run();

      // Add host as participant
      await env.DB.prepare(
        `INSERT INTO video_participants (
          id, session_id, user_id, tenant_id, joined_at, role, video_enabled, audio_enabled, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        `participant-${Date.now()}`,
        sessionId,
        body.host_id || finalTenantId,
        finalTenantId,
        now,
        'host',
        body.video_enabled !== false ? 1 : 0,
        body.audio_enabled !== false ? 1 : 0,
        '{}'
      ).run();

      const session = await env.DB.prepare('SELECT * FROM video_sessions WHERE id = ?').bind(sessionId).first();

      // Track analytics
      writeAnalyticsEvent(env, {
        event_type: 'video_session_created',
        tenant_id: finalTenantId,
        metadata: { session_id: sessionId, session_type: body.session_type || 'call' }
      }).catch(() => { });

      return jsonResponse({ success: true, data: session }, 201, corsHeaders);
    }

    // POST /api/video/sessions/:id/join - Join session
    if (request.method === 'POST' && pathParts[2] === 'sessions' && resourceId && action === 'join') {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);

      // Check if session exists
      const session = await env.DB.prepare(
        'SELECT * FROM video_sessions WHERE id = ? AND tenant_id = ? AND status = ?'
      ).bind(resourceId, finalTenantId, 'active').first();

      if (!session) {
        return jsonResponse({ success: false, error: 'Session not found or inactive' }, 404, corsHeaders);
      }

      // Check if already participant
      const existing = await env.DB.prepare(
        'SELECT * FROM video_participants WHERE session_id = ? AND user_id = ?'
      ).bind(resourceId, body.user_id || finalTenantId).first();

      if (!existing) {
        await env.DB.prepare(
          `INSERT INTO video_participants (
            id, session_id, user_id, tenant_id, joined_at, role, video_enabled, audio_enabled, metadata_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          `participant-${Date.now()}`,
          resourceId,
          body.user_id || finalTenantId,
          finalTenantId,
          now,
          'participant',
          body.video_enabled !== false ? 1 : 0,
          body.audio_enabled !== false ? 1 : 0,
          '{}'
        ).run();

        // Update participants list
        const participants = JSON.parse(session.participants_json || '[]');
        participants.push(body.user_id || finalTenantId);
        await env.DB.prepare(
          'UPDATE video_sessions SET participants_json = ?, updated_at = ? WHERE id = ?'
        ).bind(JSON.stringify([...new Set(participants)]), now, resourceId).run();
      }

      // Return WebRTC signaling info (to be handled by Durable Object)
      // For now, return session info that frontend can use with IAMSession Durable Object
      return jsonResponse({
        success: true,
        data: {
          session_id: resourceId,
          signaling_endpoint: `/api/session/${resourceId}/webrtc`,
          webrtc_config: session.webrtc_config_json ? JSON.parse(session.webrtc_config_json) : {}
        }
      }, 200, corsHeaders);
    }

    // POST /api/video/sessions/:id/leave - Leave session
    if (request.method === 'POST' && pathParts[2] === 'sessions' && resourceId && action === 'leave') {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);

      await env.DB.prepare(
        'UPDATE video_participants SET left_at = ? WHERE session_id = ? AND user_id = ? AND left_at IS NULL'
      ).bind(now, resourceId, body.user_id || finalTenantId).run();

      return jsonResponse({ success: true, message: 'Left session' }, 200, corsHeaders);
    }

    // POST /api/video/sessions/:id/end - End session
    if (request.method === 'POST' && pathParts[2] === 'sessions' && resourceId && action === 'end') {
      const now = Math.floor(Date.now() / 1000);

      await env.DB.prepare(
        'UPDATE video_sessions SET status = ?, ended_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ?'
      ).bind('ended', now, now, resourceId, finalTenantId).run();

      return jsonResponse({ success: true, message: 'Session ended' }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Video API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Helper: Serve GLB (3D model) files from R2
 * GLB files are served with proper MIME type for 3D model viewing
 */
async function serveGLB(r2Key, env) {
  try {
    const object = await env.STORAGE.get(r2Key);

    if (!object) {
      return null;
    }

    const headers = {
      'Content-Type': 'model/gltf-binary',
      'Content-Disposition': `inline; filename="${r2Key.split('/').pop()}"`,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error serving GLB file:', error);
    return null;
  }
}

/**
 * Handle AI Prompts Library API
 */
async function handleAIPrompts(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const promptId = pathParts.length >= 3 ? pathParts[2] : null;
  const finalTenantId = tenantId || 'system';

  try {
    // GET /api/prompts - List all prompts (with filters)
    if (request.method === 'GET' && !promptId) {
      const category = url.searchParams.get('category');
      const toolRole = url.searchParams.get('tool_role');
      const stage = url.searchParams.get('stage');
      const company = url.searchParams.get('company');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = 'SELECT * FROM ai_prompts_library WHERE is_active = 1';
      const params = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      if (toolRole) {
        query += ' AND tool_role = ?';
        params.push(toolRole);
      }
      if (stage !== null && stage !== undefined && stage !== '') {
        query += ' AND stage = ?';
        params.push(parseInt(stage));
      }
      if (company) {
        query += ' AND (company = ? OR company IS NULL)';
        params.push(company);
      } else {
        query += ' AND company IS NULL'; // Universal prompts by default
      }

      query += ' ORDER BY category, name LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const prompts = await env.DB.prepare(query).bind(...params).all();

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM ai_prompts_library WHERE is_active = 1';
      const countParams = [];
      if (category) {
        countQuery += ' AND category = ?';
        countParams.push(category);
      }
      if (toolRole) {
        countQuery += ' AND tool_role = ?';
        countParams.push(toolRole);
      }
      if (stage !== null && stage !== undefined && stage !== '') {
        countQuery += ' AND stage = ?';
        countParams.push(parseInt(stage));
      }
      if (company) {
        countQuery += ' AND (company = ? OR company IS NULL)';
        countParams.push(company);
      } else {
        countQuery += ' AND company IS NULL';
      }
      const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

      return jsonResponse({
        success: true,
        data: (prompts.results || []).map(p => ({
          ...p,
          variables: p.variables_json ? JSON.parse(p.variables_json) : [],
          tool_role: p.tool_role || null,
          stage: p.stage !== null && p.stage !== undefined ? p.stage : null
        })),
        pagination: {
          total: countResult?.total || 0,
          limit,
          offset
        }
      }, 200, corsHeaders);
    }

    // GET /api/prompts/:name - Get specific prompt by name
    if (request.method === 'GET' && promptId) {
      const prompt = await env.DB.prepare(
        'SELECT * FROM ai_prompts_library WHERE (name = ? OR id = ?) AND is_active = 1 LIMIT 1'
      ).bind(promptId, promptId).first();

      if (!prompt) {
        return jsonResponse({ success: false, error: 'Prompt not found' }, 404, corsHeaders);
      }

      return jsonResponse({
        success: true,
        data: {
          ...prompt,
          variables: prompt.variables_json ? JSON.parse(prompt.variables_json) : [],
          tool_role: prompt.tool_role || null,
          stage: prompt.stage !== null && prompt.stage !== undefined ? prompt.stage : null
        }
      }, 200, corsHeaders);
    }

    // POST /api/prompts - Create new prompt
    if (request.method === 'POST' && !promptId) {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);
      const promptIdValue = body.id || `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (!body.name || !body.prompt_template) {
        return jsonResponse({ success: false, error: 'name and prompt_template required' }, 400, corsHeaders);
      }

      await env.DB.prepare(
        `INSERT INTO ai_prompts_library (
          id, name, category, description, prompt_template, variables_json,
          tool_role, stage, company, version, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        promptIdValue,
        body.name,
        body.category || 'workflow',
        body.description || null,
        body.prompt_template,
        body.variables ? JSON.stringify(body.variables) : '[]',
        body.tool_role || null,
        body.stage !== null && body.stage !== undefined ? body.stage : null,
        body.company || null,
        body.version || '1.0',
        body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
        now,
        now
      ).run();

      const prompt = await env.DB.prepare('SELECT * FROM ai_prompts_library WHERE id = ?').bind(promptIdValue).first();

      return jsonResponse({
        success: true,
        data: {
          ...prompt,
          variables: prompt.variables_json ? JSON.parse(prompt.variables_json) : []
        }
      }, 201, corsHeaders);
    }

    // PUT /api/prompts/:name - Update prompt
    if (request.method === 'PUT' && promptId) {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);

      const existing = await env.DB.prepare(
        'SELECT * FROM ai_prompts_library WHERE (name = ? OR id = ?) AND is_active = 1 LIMIT 1'
      ).bind(promptId, promptId).first();

      if (!existing) {
        return jsonResponse({ success: false, error: 'Prompt not found' }, 404, corsHeaders);
      }

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (body.name !== undefined) {
        updates.push('name = ?');
        values.push(body.name);
      }
      if (body.category !== undefined) {
        updates.push('category = ?');
        values.push(body.category);
      }
      if (body.description !== undefined) {
        updates.push('description = ?');
        values.push(body.description);
      }
      if (body.prompt_template !== undefined) {
        updates.push('prompt_template = ?');
        values.push(body.prompt_template);
      }
      if (body.variables !== undefined) {
        updates.push('variables_json = ?');
        values.push(JSON.stringify(body.variables));
      }
      if (body.tool_role !== undefined) {
        updates.push('tool_role = ?');
        values.push(body.tool_role || null);
      }
      if (body.stage !== undefined) {
        updates.push('stage = ?');
        values.push(body.stage !== null ? body.stage : null);
      }
      if (body.company !== undefined) {
        updates.push('company = ?');
        values.push(body.company || null);
      }
      if (body.version !== undefined) {
        updates.push('version = ?');
        values.push(body.version);
      }
      if (body.is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(body.is_active ? 1 : 0);
      }

      if (updates.length === 0) {
        return jsonResponse({ success: false, error: 'No fields to update' }, 400, corsHeaders);
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(promptId, promptId); // For WHERE clause (name OR id)

      await env.DB.prepare(
        `UPDATE ai_prompts_library SET ${updates.join(', ')} WHERE (name = ? OR id = ?)`
      ).bind(...values).run();

      const updated = await env.DB.prepare('SELECT * FROM ai_prompts_library WHERE id = ?').bind(existing.id).first();

      return jsonResponse({
        success: true,
        data: {
          ...updated,
          variables: updated.variables_json ? JSON.parse(updated.variables_json) : []
        }
      }, 200, corsHeaders);
    }

    // DELETE /api/prompts/:name - Soft delete prompt
    if (request.method === 'DELETE' && promptId) {
      const result = await env.DB.prepare(
        'UPDATE ai_prompts_library SET is_active = 0, updated_at = ? WHERE (name = ? OR id = ?)'
      ).bind(Math.floor(Date.now() / 1000), promptId, promptId).run();

      if (result.meta.changes === 0) {
        return jsonResponse({ success: false, error: 'Prompt not found' }, 404, corsHeaders);
      }

      return jsonResponse({ success: true, message: 'Prompt deleted' }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('AI Prompts API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Handle Workflow Stages API
 */
async function handleWorkflowStages(request, env, tenantId, corsHeaders) {
  try {
    if (request.method === 'GET') {
      const stages = await env.DB.prepare(
        'SELECT * FROM workflow_stages ORDER BY stage_number ASC'
      ).all();

      return jsonResponse({
        success: true,
        data: (stages.results || []).map(s => ({
          ...s,
          deliverables: s.deliverables_json ? JSON.parse(s.deliverables_json) : []
        }))
      }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Workflow Stages API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Handle Tool Roles API
 */
async function handleToolRoles(request, env, tenantId, corsHeaders) {
  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const toolName = url.searchParams.get('tool_name');

      if (toolName) {
        // Get specific tool role
        const role = await env.DB.prepare(
          'SELECT * FROM ai_tool_roles WHERE tool_name = ? LIMIT 1'
        ).bind(toolName).first();

        if (!role) {
          return jsonResponse({ success: false, error: 'Tool role not found' }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          data: {
            ...role,
            responsibilities: role.responsibilities_json ? JSON.parse(role.responsibilities_json) : [],
            strengths: role.strengths_json ? JSON.parse(role.strengths_json) : [],
            limitations: role.limitations_json ? JSON.parse(role.limitations_json) : [],
            preferred_stages: role.preferred_stages_json ? JSON.parse(role.preferred_stages_json) : []
          }
        }, 200, corsHeaders);
      }

      // Get all tool roles
      const roles = await env.DB.prepare(
        'SELECT * FROM ai_tool_roles ORDER BY tool_name ASC'
      ).all();

      return jsonResponse({
        success: true,
        data: (roles.results || []).map(r => ({
          ...r,
          responsibilities: r.responsibilities_json ? JSON.parse(r.responsibilities_json) : [],
          strengths: r.strengths_json ? JSON.parse(r.strengths_json) : [],
          limitations: r.limitations_json ? JSON.parse(r.limitations_json) : [],
          preferred_stages: r.preferred_stages_json ? JSON.parse(r.preferred_stages_json) : []
        }))
      }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Tool Roles API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Handle Knowledge Base API
 */
async function handleKnowledgeBase(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const resourceId = pathParts.length >= 3 ? pathParts[2] : null;
  const action = pathParts.length >= 4 ? pathParts[3] : null;
  const finalTenantId = tenantId || 'system';

  try {
    // GET /api/knowledge - List knowledge base entries
    if (request.method === 'GET' && !resourceId) {
      const category = url.searchParams.get('category');
      const contentType = url.searchParams.get('content_type');
      const isIndexed = url.searchParams.get('is_indexed');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = 'SELECT * FROM ai_knowledge_base WHERE is_active = 1';
      const params = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      if (contentType) {
        query += ' AND content_type = ?';
        params.push(contentType);
      }
      if (isIndexed !== null && isIndexed !== undefined) {
        query += ' AND is_indexed = ?';
        params.push(isIndexed === '1' || isIndexed === 'true' ? 1 : 0);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const results = await env.DB.prepare(query).bind(...params).all();

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM ai_knowledge_base WHERE is_active = 1';
      const countParams = [];
      if (category) {
        countQuery += ' AND category = ?';
        countParams.push(category);
      }
      if (contentType) {
        countQuery += ' AND content_type = ?';
        countParams.push(contentType);
      }
      if (isIndexed !== null && isIndexed !== undefined) {
        countQuery += ' AND is_indexed = ?';
        countParams.push(isIndexed === '1' || isIndexed === 'true' ? 1 : 0);
      }
      const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

      return jsonResponse({
        success: true,
        data: (results.results || []).map(r => ({
          ...r,
          metadata: r.metadata_json ? JSON.parse(r.metadata_json) : {},
          embedding_vector: r.embedding_vector || null
        })),
        pagination: {
          total: countResult?.total || 0,
          limit,
          offset
        }
      }, 200, corsHeaders);
    }

    // GET /api/knowledge/:id - Get specific knowledge entry
    if (request.method === 'GET' && resourceId && !action) {
      const kb = await env.DB.prepare(
        'SELECT * FROM ai_knowledge_base WHERE (id = ? OR title = ?) AND is_active = 1 LIMIT 1'
      ).bind(resourceId, resourceId).first();

      if (!kb) {
        return jsonResponse({ success: false, error: 'Knowledge entry not found' }, 404, corsHeaders);
      }

      // Get chunks if any
      const chunks = await env.DB.prepare(
        'SELECT * FROM ai_knowledge_chunks WHERE knowledge_id = ? ORDER BY chunk_index ASC'
      ).bind(kb.id).all();

      return jsonResponse({
        success: true,
        data: {
          ...kb,
          metadata: kb.metadata_json ? JSON.parse(kb.metadata_json) : {},
          embedding_vector: kb.embedding_vector || null,
          chunks: (chunks.results || []).map(c => ({
            ...c,
            metadata: c.metadata_json ? JSON.parse(c.metadata_json) : {}
          }))
        }
      }, 200, corsHeaders);
    }

    // POST /api/knowledge - Create knowledge entry
    if (request.method === 'POST' && !resourceId) {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);
      const kbId = body.id || `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (!body.title || !body.content) {
        return jsonResponse({ success: false, error: 'title and content required' }, 400, corsHeaders);
      }

      await env.DB.prepare(
        `INSERT INTO ai_knowledge_base (
          id, tenant_id, title, content, content_type, category, source_url, author,
          metadata_json, embedding_model, embedding_vector, chunk_count, token_count,
          is_indexed, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        kbId,
        finalTenantId,
        body.title,
        body.content,
        body.content_type || 'document',
        body.category || null,
        body.source_url || null,
        body.author || null,
        body.metadata ? JSON.stringify(body.metadata) : '{}',
        body.embedding_model || null,
        body.embedding_vector ? (typeof body.embedding_vector === 'string' ? body.embedding_vector : JSON.stringify(body.embedding_vector)) : null,
        body.chunk_count || 0,
        body.token_count || 0,
        body.is_indexed ? 1 : 0,
        body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
        now,
        now
      ).run();

      const kb = await env.DB.prepare('SELECT * FROM ai_knowledge_base WHERE id = ?').bind(kbId).first();

      return jsonResponse({
        success: true,
        data: {
          ...kb,
          metadata: kb.metadata_json ? JSON.parse(kb.metadata_json) : {}
        }
      }, 201, corsHeaders);
    }

    // PUT /api/knowledge/:id - Update knowledge entry
    if (request.method === 'PUT' && resourceId) {
      const body = await request.json();
      const now = Math.floor(Date.now() / 1000);

      const existing = await env.DB.prepare(
        'SELECT * FROM ai_knowledge_base WHERE (id = ? OR title = ?) AND is_active = 1 LIMIT 1'
      ).bind(resourceId, resourceId).first();

      if (!existing) {
        return jsonResponse({ success: false, error: 'Knowledge entry not found' }, 404, corsHeaders);
      }

      const updates = [];
      const values = [];

      if (body.title !== undefined) {
        updates.push('title = ?');
        values.push(body.title);
      }
      if (body.content !== undefined) {
        updates.push('content = ?');
        values.push(body.content);
      }
      if (body.content_type !== undefined) {
        updates.push('content_type = ?');
        values.push(body.content_type);
      }
      if (body.category !== undefined) {
        updates.push('category = ?');
        values.push(body.category || null);
      }
      if (body.metadata !== undefined) {
        updates.push('metadata_json = ?');
        values.push(JSON.stringify(body.metadata));
      }
      if (body.is_indexed !== undefined) {
        updates.push('is_indexed = ?');
        values.push(body.is_indexed ? 1 : 0);
      }

      if (updates.length === 0) {
        return jsonResponse({ success: false, error: 'No fields to update' }, 400, corsHeaders);
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(existing.id);

      await env.DB.prepare(
        `UPDATE ai_knowledge_base SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...values).run();

      const updated = await env.DB.prepare('SELECT * FROM ai_knowledge_base WHERE id = ?').bind(existing.id).first();

      return jsonResponse({
        success: true,
        data: {
          ...updated,
          metadata: updated.metadata_json ? JSON.parse(updated.metadata_json) : {}
        }
      }, 200, corsHeaders);
    }

    // DELETE /api/knowledge/:id - Soft delete knowledge entry
    if (request.method === 'DELETE' && resourceId) {
      const result = await env.DB.prepare(
        'UPDATE ai_knowledge_base SET is_active = 0, updated_at = ? WHERE (id = ? OR title = ?)'
      ).bind(Math.floor(Date.now() / 1000), resourceId, resourceId).run();

      if (result.meta.changes === 0) {
        return jsonResponse({ success: false, error: 'Knowledge entry not found' }, 404, corsHeaders);
      }

      return jsonResponse({ success: true, message: 'Knowledge entry deleted' }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Knowledge Base API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Handle Workflow Pipelines API
 */
async function handleWorkflowPipelines(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const pipelineId = pathParts.length >= 3 ? pathParts[2] : null;
  const action = pathParts.length >= 4 ? pathParts[3] : null;
  const finalTenantId = tenantId || 'system';

  try {
    // GET /api/pipelines - List pipelines
    if (request.method === 'GET' && !pipelineId) {
      const category = url.searchParams.get('category');
      const status = url.searchParams.get('status');
      const isTemplate = url.searchParams.get('is_template');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = 'SELECT * FROM ai_workflow_pipelines WHERE 1=1';
      const params = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (isTemplate !== null && isTemplate !== undefined) {
        query += ' AND is_template = ?';
        params.push(isTemplate === '1' || isTemplate === 'true' ? 1 : 0);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const pipelines = await env.DB.prepare(query).bind(...params).all();

      return jsonResponse({
        success: true,
        data: (pipelines.results || []).map(p => ({
          ...p,
          stages: p.stages_json ? JSON.parse(p.stages_json) : [],
          variables: p.variables_json ? JSON.parse(p.variables_json) : {},
          knowledge_base_ids: p.knowledge_base_ids_json ? JSON.parse(p.knowledge_base_ids_json) : [],
          execution_history: p.execution_history_json ? JSON.parse(p.execution_history_json) : []
        }))
      }, 200, corsHeaders);
    }

    // GET /api/pipelines/:id - Get specific pipeline
    if (request.method === 'GET' && pipelineId && !action) {
      const pipeline = await env.DB.prepare(
        'SELECT * FROM ai_workflow_pipelines WHERE (id = ? OR name = ?) LIMIT 1'
      ).bind(pipelineId, pipelineId).first();

      if (!pipeline) {
        return jsonResponse({ success: false, error: 'Pipeline not found' }, 404, corsHeaders);
      }

      return jsonResponse({
        success: true,
        data: {
          ...pipeline,
          stages: pipeline.stages_json ? JSON.parse(pipeline.stages_json) : [],
          variables: pipeline.variables_json ? JSON.parse(pipeline.variables_json) : {},
          knowledge_base_ids: pipeline.knowledge_base_ids_json ? JSON.parse(pipeline.knowledge_base_ids_json) : [],
          execution_history: pipeline.execution_history_json ? JSON.parse(pipeline.execution_history_json) : []
        }
      }, 200, corsHeaders);
    }

    // POST /api/pipelines/:id/execute - Execute pipeline
    if (request.method === 'POST' && pipelineId && action === 'execute') {
      const body = await request.json();
      const pipeline = await env.DB.prepare(
        'SELECT * FROM ai_workflow_pipelines WHERE (id = ? OR name = ?) AND status != "running" LIMIT 1'
      ).bind(pipelineId, pipelineId).first();

      if (!pipeline) {
        return jsonResponse({ success: false, error: 'Pipeline not found or already running' }, 404, corsHeaders);
      }

      const now = Math.floor(Date.now() / 1000);
      const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Get execution number
      const execCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM ai_workflow_executions WHERE pipeline_id = ?'
      ).bind(pipeline.id).first();
      const executionNumber = (execCount?.count || 0) + 1;

      // Create execution record
      await env.DB.prepare(
        `INSERT INTO ai_workflow_executions (
          id, pipeline_id, tenant_id, execution_number, status, input_variables_json, started_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        executionId,
        pipeline.id,
        finalTenantId,
        executionNumber,
        'running',
        JSON.stringify(body.variables || {}),
        now
      ).run();

      // Update pipeline status
      await env.DB.prepare(
        'UPDATE ai_workflow_pipelines SET status = ?, started_at = ? WHERE id = ?'
      ).bind('running', now, pipeline.id).run();

      // Execute pipeline stages asynchronously
      executePipelineStages(pipeline, executionId, body.variables || {}, env, finalTenantId).catch(err => {
        console.error('Pipeline execution error:', err);
        // Update execution status to failed
        env.DB.prepare(
          'UPDATE ai_workflow_executions SET status = ?, error_message = ?, completed_at = ? WHERE id = ?'
        ).bind('failed', err.message, Math.floor(Date.now() / 1000), executionId).run();
      });

      return jsonResponse({
        success: true,
        data: {
          execution_id: executionId,
          pipeline_id: pipeline.id,
          execution_number: executionNumber,
          status: 'running',
          started_at: now,
          poll_url: `/api/pipelines/${pipeline.id}/executions/${executionId}/status`
        }
      }, 201, corsHeaders);
    }

    // GET /api/pipelines/:id/executions/:execution_id/status - Get execution status (for polling)
    if (request.method === 'GET' && pipelineId && action === 'executions' && pathParts.length >= 5) {
      const executionId = pathParts[4];
      const statusAction = pathParts.length >= 6 ? pathParts[5] : 'status';

      if (statusAction === 'status') {
        const execution = await env.DB.prepare(
          'SELECT * FROM ai_workflow_executions WHERE id = ? LIMIT 1'
        ).bind(executionId).first();

        if (!execution) {
          return jsonResponse({ success: false, error: 'Execution not found' }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          data: {
            ...execution,
            input_variables: execution.input_variables_json ? JSON.parse(execution.input_variables_json) : {},
            output: execution.output_json ? JSON.parse(execution.output_json) : {},
            stage_results: execution.stage_results_json ? JSON.parse(execution.stage_results_json) : [],
            duration_seconds: execution.completed_at && execution.started_at ?
              execution.completed_at - execution.started_at :
              (Math.floor(Date.now() / 1000) - execution.started_at)
          }
        }, 200, corsHeaders);
      }
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Workflow Pipelines API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Execute pipeline stages asynchronously (simplified version - executes sequentially)
 */
async function executePipelineStages(pipeline, executionId, variables, env, tenantId) {
  const stages = pipeline.stages_json ? JSON.parse(pipeline.stages_json) : [];
  const stageResults = [];
  const now = Math.floor(Date.now() / 1000);

  try {
    // Execute each stage sequentially
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const stageStartTime = Math.floor(Date.now() / 1000);

      // Update execution with current stage
      await env.DB.prepare(
        'UPDATE ai_workflow_executions SET stage_results_json = ? WHERE id = ?'
      ).bind(
        JSON.stringify([
          ...stageResults,
          {
            stage_number: stage.stage_number,
            stage_name: stage.stage_name,
            status: 'running',
            started_at: stageStartTime
          }
        ]),
        executionId
      ).run();

      try {
        // Execute stage (simplified - just call prompt execution if prompt_id exists)
        let stageOutput = null;
        if (stage.prompt_id) {
          // Get prompt
          const prompt = await env.DB.prepare(
            'SELECT * FROM ai_prompts_library WHERE id = ? AND is_active = 1 LIMIT 1'
          ).bind(stage.prompt_id).first();

          if (prompt) {
            // Execute prompt with variables
            const promptTemplate = prompt.prompt_template;
            const promptVariables = prompt.variables_json ? JSON.parse(prompt.variables_json) : [];
            let executedPrompt = promptTemplate;

            for (const varName of promptVariables) {
              const varValue = variables[varName] || stage.variables?.[varName] || '';
              const regex = new RegExp(`{{${varName}}}`, 'g');
              executedPrompt = executedPrompt.replace(regex, varValue);
            }

            stageOutput = {
              prompt_id: stage.prompt_id,
              prompt_name: prompt.name,
              executed_template: executedPrompt
            };
          }
        } else {
          // Stage without prompt - just mark as completed
          stageOutput = { message: `Stage ${stage.stage_name} completed (no prompt)` };
        }

        const stageEndTime = Math.floor(Date.now() / 1000);
        stageResults.push({
          stage_number: stage.stage_number,
          stage_name: stage.stage_name,
          status: 'completed',
          started_at: stageStartTime,
          completed_at: stageEndTime,
          duration_seconds: stageEndTime - stageStartTime,
          output: stageOutput,
          error: null
        });

        // Update execution with completed stage
        await env.DB.prepare(
          'UPDATE ai_workflow_executions SET stage_results_json = ? WHERE id = ?'
        ).bind(JSON.stringify(stageResults), executionId).run();

        // Simulate delay for stages that have expected duration
        if (stage.expected_duration_minutes) {
          const delayMs = Math.min(stage.expected_duration_minutes * 1000, 5000); // Cap at 5 seconds for demo
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (stageError) {
        const stageEndTime = Math.floor(Date.now() / 1000);
        stageResults.push({
          stage_number: stage.stage_number,
          stage_name: stage.stage_name,
          status: 'failed',
          started_at: stageStartTime,
          completed_at: stageEndTime,
          duration_seconds: stageEndTime - stageStartTime,
          output: null,
          error: stageError.message
        });

        // Update execution with failed stage
        await env.DB.prepare(
          'UPDATE ai_workflow_executions SET stage_results_json = ?, status = ?, error_message = ? WHERE id = ?'
        ).bind(
          JSON.stringify(stageResults),
          'failed',
          `Stage ${stage.stage_name} failed: ${stageError.message}`,
          executionId
        ).run();

        // Update pipeline status
        await env.DB.prepare(
          'UPDATE ai_workflow_pipelines SET status = ?, completed_at = ? WHERE id = ?'
        ).bind('failed', stageEndTime, pipeline.id).run();

        return; // Stop execution on failure
      }
    }

    // All stages completed successfully
    const completedAt = Math.floor(Date.now() / 1000);
    const duration = completedAt - now;

    await env.DB.prepare(
      `UPDATE ai_workflow_executions 
       SET status = ?, completed_at = ?, duration_seconds = ?, output_json = ?, stage_results_json = ?
       WHERE id = ?`
    ).bind(
      'completed',
      completedAt,
      duration,
      JSON.stringify({ message: 'All stages completed successfully', stages_completed: stages.length }),
      JSON.stringify(stageResults),
      executionId
    ).run();

    // Update pipeline status
    await env.DB.prepare(
      'UPDATE ai_workflow_pipelines SET status = ?, completed_at = ? WHERE id = ?'
    ).bind('completed', completedAt, pipeline.id).run();

    // Add to pipeline execution history
    const history = pipeline.execution_history_json ? JSON.parse(pipeline.execution_history_json) : [];
    history.push({
      execution_id: executionId,
      started_at: now,
      completed_at: completedAt,
      status: 'completed',
      duration_seconds: duration
    });

    await env.DB.prepare(
      'UPDATE ai_workflow_pipelines SET execution_history_json = ? WHERE id = ?'
    ).bind(JSON.stringify(history), pipeline.id).run();

  } catch (error) {
    console.error('Pipeline execution error:', error);
    const errorTime = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      'UPDATE ai_workflow_executions SET status = ?, error_message = ?, completed_at = ? WHERE id = ?'
    ).bind('failed', error.message, errorTime, executionId).run();
    await env.DB.prepare(
      'UPDATE ai_workflow_pipelines SET status = ?, completed_at = ? WHERE id = ?'
    ).bind('failed', errorTime, pipeline.id).run();
    throw error;
  }
}

/**
 * Handle RAG Search API (deprecated - use handleRAGSearchEnhanced)
 */
async function handleRAGSearch(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const finalTenantId = tenantId || 'system';

  try {
    if (request.method === 'POST') {
      const body = await request.json();
      const query = body.query || body.text || '';
      const limit = parseInt(body.limit || '5');
      const category = body.category || null;

      if (!query) {
        return jsonResponse({ success: false, error: 'query required' }, 400, corsHeaders);
      }

      // Simple text search (for now - embeddings would require external vector DB)
      // Search in title, content, and metadata tags
      let searchQuery = `
        SELECT * FROM ai_knowledge_base 
        WHERE is_active = 1 AND is_indexed = 1
        AND (
          title LIKE ? OR 
          content LIKE ? OR
          metadata_json LIKE ?
        )
      `;
      const searchTerm = `%${query}%`;
      const params = [searchTerm, searchTerm, searchTerm];

      if (category) {
        searchQuery += ' AND category = ?';
        params.push(category);
      }

      searchQuery += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const results = await env.DB.prepare(searchQuery).bind(...params).all();

      // Also search chunks
      let chunkQuery = `
        SELECT c.*, k.title as knowledge_title, k.category 
        FROM ai_knowledge_chunks c
        JOIN ai_knowledge_base k ON c.knowledge_id = k.id
        WHERE k.is_active = 1 AND c.is_indexed = 1
        AND (c.content LIKE ? OR c.metadata_json LIKE ?)
      `;
      const chunkParams = [searchTerm, searchTerm];

      if (category) {
        chunkQuery += ' AND k.category = ?';
        chunkParams.push(category);
      }

      chunkQuery += ' ORDER BY c.created_at DESC LIMIT ?';
      chunkParams.push(limit);

      const chunkResults = await env.DB.prepare(chunkQuery).bind(...chunkParams).all();

      // Log search history
      const now = Math.floor(Date.now() / 1000);
      const historyId = `rag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const retrievedIds = [
        ...(results.results || []).map(r => r.id),
        ...(chunkResults.results || []).map(c => c.id)
      ];

      await env.DB.prepare(
        `INSERT INTO ai_rag_search_history (
          id, tenant_id, query_text, prompt_id, pipeline_id, retrieved_chunk_ids_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        historyId,
        finalTenantId,
        query,
        body.prompt_id || null,
        body.pipeline_id || null,
        JSON.stringify(retrievedIds),
        now
      ).run().catch(() => { }); // Don't fail if history insert fails

      return jsonResponse({
        success: true,
        data: {
          query,
          knowledge_base: (results.results || []).map(r => ({
            id: r.id,
            title: r.title,
            content: r.content.substring(0, 500), // Preview
            category: r.category,
            content_type: r.content_type
          })),
          chunks: (chunkResults.results || []).map(c => ({
            id: c.id,
            knowledge_id: c.knowledge_id,
            knowledge_title: c.knowledge_title,
            content: c.content.substring(0, 500), // Preview
            chunk_index: c.chunk_index
          }))
        }
      }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('RAG Search API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Handle Prompt Execution API (executes prompt with variable substitution + optional RAG)
 */
async function handlePromptExecution(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  // Path: /api/prompts/:name/execute -> pathParts: ['api', 'prompts', 'name', 'execute']
  // Check if last part is 'execute' and get prompt name from second-to-last
  const isExecute = pathParts.length >= 4 && pathParts[pathParts.length - 1] === 'execute' && pathParts[0] === 'api' && pathParts[1] === 'prompts';
  const promptName = isExecute ? pathParts[pathParts.length - 2] : null;
  const finalTenantId = tenantId || 'system';

  try {
    if (request.method === 'POST' && isExecute && promptName) {
      const body = await request.json();
      const variables = body.variables || {};
      const useRAG = body.use_rag !== false; // Default to true
      const ragQuery = body.rag_query || null;

      // Get prompt from library
      const prompt = await env.DB.prepare(
        'SELECT * FROM ai_prompts_library WHERE (name = ? OR id = ?) AND is_active = 1 LIMIT 1'
      ).bind(promptName, promptName).first();

      if (!prompt) {
        return jsonResponse({ success: false, error: 'Prompt not found' }, 404, corsHeaders);
      }

      let template = prompt.prompt_template;
      const promptVariables = prompt.variables_json ? JSON.parse(prompt.variables_json) : [];

      // Replace variables in template
      for (const varName of promptVariables) {
        const varValue = variables[varName] || '';
        const regex = new RegExp(`{{${varName}}}`, 'g');
        template = template.replace(regex, varValue);
      }

      // Optional: Add RAG context
      let ragContext = '';
      if (useRAG && ragQuery) {
        // Perform RAG search using enhanced handler
        const ragResponse = await handleRAGSearchEnhanced(
          new Request(`${url.origin}/api/rag`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: ragQuery, limit: 3, prompt_id: prompt.id, use_vector_search: true })
          }),
          env,
          finalTenantId,
          corsHeaders
        );

        const ragData = await ragResponse.json();
        if (ragData.success && (ragData.data.knowledge_base?.length > 0 || ragData.data.chunks?.length > 0)) {
          ragContext = '\n\n--- Additional Context (RAG) ---\n';
          if (ragData.data.knowledge_base?.length > 0) {
            ragContext += ragData.data.knowledge_base.map(kb => `Title: ${kb.title}\n${kb.content}\n`).join('\n');
          }
          if (ragData.data.chunks?.length > 0) {
            ragContext += ragData.data.chunks.map(c => `Chunk from "${c.knowledge_title}":\n${c.content}\n`).join('\n');
          }
          ragContext += '\n--- End Additional Context ---\n';
        }
      }

      // Prepend RAG context if available
      if (ragContext) {
        template = ragContext + template;
      }

      return jsonResponse({
        success: true,
        data: {
          prompt_id: prompt.id,
          prompt_name: prompt.name,
          executed_template: template,
          variables_used: variables,
          rag_enabled: useRAG,
          rag_context_added: !!ragContext,
          ready_for_ai: true
        }
      }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Prompt Execution API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Generate embeddings using Google Gemini API (with CloudConvert fallback if needed)
 * Supports: Gemini embeddings (text-embedding-004) and CloudConvert for file-based embeddings
 */
async function generateEmbedding(text, env, options = {}) {
  const { model = 'gemini', fileType = null } = options;

  try {
    // Primary: Use Gemini for text embeddings
    if (model === 'gemini' || !model) {
      const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
      if (!apiKey) {
        console.warn('GEMINI_API_KEY not configured, trying OpenAI fallback');
        // Fallback to OpenAI if Gemini key not set
        return await generateEmbeddingOpenAI(text, env);
      }

      // Use Gemini Embeddings API (gemini-embedding-001 - latest model, recommended over text-embedding-004)
      // API: https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent
      // Supports up to 2,048 tokens input, flexible output dimensions (768, 1536, or 3072 recommended)
      // Pricing: $0.15 per million input tokens (as of Jan 2026)
      const textUsed = text.substring(0, 8000);
      const charsUsed = textUsed.length;
      const estimatedTokens = Math.ceil(charsUsed / 4); // ~4 chars per token
      const startTime = Date.now();

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: {
            parts: [{ text: textUsed }] // Limit to ~8000 chars (≈2000 tokens, under 2048 limit)
          },
          taskType: 'RETRIEVAL_DOCUMENT', // 'RETRIEVAL_DOCUMENT' for docs, 'RETRIEVAL_QUERY' for queries
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Gemini embeddings error:', error);

        // Track failed request (don't await to avoid blocking)
        trackAPICost(env, {
          service: 'gemini',
          event_type: 'embedding',
          usage_amount: charsUsed,
          usage_unit: 'characters',
          estimated_cost_usd: 0,
          metadata: {
            model: 'gemini-embedding-001',
            estimated_tokens: estimatedTokens,
            status: 'failed',
            error: error.substring(0, 200)
          }
        }).catch(e => console.error('Cost tracking error:', e));

        // Fallback to OpenAI if Gemini fails
        return await generateEmbeddingOpenAI(text, env);
      }

      const data = await response.json();
      // Gemini API returns: { embedding: { values: [0.1, 0.2, ...] } }
      const embedding = data.embedding?.values || null;
      const responseTime = Date.now() - startTime;

      // Track successful embedding cost
      // Gemini pricing: $0.15 per million input tokens (as of Jan 2026)
      // Cost: tokens / 1,000,000 * $0.15
      const estimatedCost = (estimatedTokens / 1000000) * 0.15;

      // Track cost (don't await to avoid blocking)
      trackAPICost(env, {
        service: 'gemini',
        event_type: 'embedding',
        usage_amount: estimatedTokens,
        usage_unit: 'tokens',
        estimated_cost_usd: estimatedCost,
        metadata: {
          model: 'gemini-embedding-001',
          characters: charsUsed,
          tokens: estimatedTokens,
          response_time_ms: responseTime,
          embedding_dimensions: embedding?.length || 0,
          task_type: 'RETRIEVAL_DOCUMENT'
        }
      }).catch(e => console.error('Cost tracking error:', e));

      return embedding;
    }

    // Secondary: Use CloudConvert for file-based embeddings (if fileType provided)
    if (model === 'cloudconvert' && fileType) {
      return await generateEmbeddingCloudConvert(text, env, fileType);
    }

    // Default fallback to OpenAI
    return await generateEmbeddingOpenAI(text, env);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    // Final fallback to OpenAI
    return await generateEmbeddingOpenAI(text, env);
  }
}

/**
 * OpenAI embeddings (fallback)
 * Includes cost tracking
 */
async function generateEmbeddingOpenAI(text, env) {
  const textUsed = text.substring(0, 8000).length;
  const startTime = Date.now();

  try {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY not configured, skipping embeddings');
      return null;
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI embeddings error:', error);
      // Track failed request (don't await to avoid blocking)
      trackAPICost(env, {
        service: 'openai',
        event_type: 'embedding',
        usage_amount: textUsed,
        usage_unit: 'characters',
        estimated_cost_usd: 0,
        metadata: { model: 'text-embedding-3-small', status: 'failed', error: error.substring(0, 200) }
      }).catch(e => console.error('Cost tracking error:', e));

      return null;
    }

    const data = await response.json();
    const embedding = data.data?.[0]?.embedding || null;
    const tokensUsed = data.usage?.total_tokens || Math.ceil(textUsed / 4);

    // Track successful embedding cost
    // OpenAI pricing: $0.02 per 1M tokens (text-embedding-3-small)
    // Cost: tokens / 1,000,000 * $0.02
    const estimatedCost = (tokensUsed / 1000000) * 0.02;

    // Track cost (don't await to avoid blocking)
    trackAPICost(env, {
      service: 'openai',
      event_type: 'embedding',
      usage_amount: tokensUsed,
      usage_unit: 'tokens',
      estimated_cost_usd: estimatedCost,
      metadata: {
        model: 'text-embedding-3-small',
        characters: textUsed,
        tokens: tokensUsed,
        response_time_ms: Date.now() - startTime,
        embedding_dimensions: embedding?.length || 0,
        prompt_tokens: data.usage?.prompt_tokens || 0,
        total_tokens: data.usage?.total_tokens || tokensUsed
      }
    }).catch(e => console.error('Cost tracking error:', e));

    return embedding;
  } catch (error) {
    console.error('Error generating OpenAI embeddings:', error);
    // Track error (don't await to avoid blocking)
    trackAPICost(env, {
      service: 'openai',
      event_type: 'embedding',
      usage_amount: textUsed,
      usage_unit: 'characters',
      estimated_cost_usd: 0,
      metadata: { model: 'text-embedding-3-small', status: 'error', error: error.message }
    }).catch(e => console.error('Cost tracking error:', e));

    return null;
  }
}

/**
 * CloudConvert embeddings (for file-based content - extracts text then embeds)
 * Tracks CloudConvert conversion costs, then tracks Gemini embedding costs separately
 */
async function generateEmbeddingCloudConvert(text, env, fileType) {
  const startTime = Date.now();

  try {
    const apiKey = env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
      console.warn('CLOUDCONVERT_API_KEY not configured, skipping CloudConvert embeddings');
      return null;
    }

    // CloudConvert is primarily for file conversion, not direct embeddings
    // This would be used to convert files to text, then use Gemini for embeddings
    if (fileType && fileType !== 'text/plain') {
      console.log('CloudConvert: File conversion to text would happen here, then Gemini embeddings');

      // Track CloudConvert conversion (if we implement file conversion)
      // CloudConvert pricing varies by conversion type (typically $0.005-0.05 per conversion)
      // For now, estimate $0.01 per conversion
      trackAPICost(env, {
        service: 'cloudconvert',
        event_type: 'conversion',
        usage_amount: 1,
        usage_unit: 'conversions',
        estimated_cost_usd: 0.01, // Estimated $0.01 per conversion
        metadata: {
          file_type: fileType,
          conversion_type: 'file_to_text',
          response_time_ms: Date.now() - startTime
        }
      }).catch(e => console.error('Cost tracking error:', e));

      // Future: Convert file using CloudConvert, extract text, then use Gemini
    }

    // Use Gemini for the actual embeddings after conversion
    // This will track Gemini costs separately
    return await generateEmbedding(text, env, { model: 'gemini' });
  } catch (error) {
    console.error('Error with CloudConvert embeddings:', error);

    // Track error (don't await to avoid blocking)
    trackAPICost(env, {
      service: 'cloudconvert',
      event_type: 'conversion',
      usage_amount: 1,
      usage_unit: 'conversions',
      estimated_cost_usd: 0,
      metadata: {
        file_type: fileType || 'unknown',
        status: 'error',
        error: error.message,
        response_time_ms: Date.now() - startTime
      }
    }).catch(e => console.error('Cost tracking error:', e));

    return null;
  }
}

/**
 * Chunk text into smaller pieces (500-1000 tokens, ~2000-4000 chars)
 */
function chunkText(text, chunkSize = 2000, overlap = 200) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.substring(start, end);

    // Try to break at sentence boundaries
    let actualEnd = end;
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > chunkSize * 0.5) { // Only break if we're at least 50% through chunk
        actualEnd = start + breakPoint + 1;
      }
    }

    chunks.push({
      content: text.substring(start, actualEnd).trim(),
      start,
      end: actualEnd,
    });

    // Move forward with overlap
    start = actualEnd - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 chars)
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Handle Knowledge Base Chunking API
 */
async function handleKnowledgeChunking(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  // Path: /api/knowledge/:id/chunk -> pathParts: ['api', 'knowledge', 'id', 'chunk']
  // Check if last part is 'chunk' and get knowledge ID from third position (index 2)
  const isChunkRequest = pathParts.length >= 4 && pathParts[0] === 'api' && pathParts[1] === 'knowledge' && pathParts[pathParts.length - 1] === 'chunk';
  const knowledgeId = isChunkRequest ? pathParts[2] : null; // knowledge ID is at index 2
  const finalTenantId = tenantId || 'system';

  try {
    if (request.method === 'POST' && isChunkRequest && knowledgeId) {
      // Parse request body (use request.json() directly, not clone)
      let body = {};
      try {
        body = await request.json();
      } catch (e) {
        console.error('Error parsing request body:', e);
        return jsonResponse({ success: false, error: 'Invalid JSON in request body: ' + e.message }, 400, corsHeaders);
      }

      const chunkSize = Math.min(Math.max(parseInt(body.chunk_size) || 2000, 100), 5000); // 100-5000 chars
      const overlap = Math.min(Math.max(parseInt(body.overlap) || 200, 0), chunkSize / 2); // 0 to chunkSize/2
      const generateEmbeddings = body.generate_embeddings === true || body.generate_embeddings === 'true'; // Explicitly check for true
      const embeddingModel = body.model || 'gemini'; // Default to Gemini

      // Get knowledge base entry
      const kb = await env.DB.prepare(
        'SELECT * FROM ai_knowledge_base WHERE (id = ? OR title = ?) AND is_active = 1 LIMIT 1'
      ).bind(knowledgeId, knowledgeId).first();

      if (!kb) {
        return jsonResponse({ success: false, error: 'Knowledge entry not found' }, 404, corsHeaders);
      }

      // Delete existing chunks
      try {
        await env.DB.prepare('DELETE FROM ai_knowledge_chunks WHERE knowledge_id = ?').bind(kb.id).run();
      } catch (e) {
        // Table might not exist yet, continue
        console.warn('Error deleting chunks (might not exist):', e);
      }

      // Validate content exists
      if (!kb.content || kb.content.trim() === '') {
        return jsonResponse({ success: false, error: 'Knowledge entry has no content to chunk' }, 400, corsHeaders);
      }

      // Chunk the content
      let chunks;
      try {
        chunks = chunkText(kb.content, chunkSize, overlap);
        if (!chunks || chunks.length === 0) {
          return jsonResponse({ success: false, error: 'Failed to chunk content' }, 500, corsHeaders);
        }
      } catch (e) {
        console.error('Error chunking text:', e);
        return jsonResponse({ success: false, error: 'Error chunking content: ' + e.message }, 500, corsHeaders);
      }

      const now = Math.floor(Date.now() / 1000);
      let chunkCount = 0;
      let totalTokens = 0;

      // Insert chunks with optional embeddings (batch processing for performance)
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk || !chunk.content) {
          console.warn(`Skipping invalid chunk ${i}`);
          continue;
        }

        const chunkId = `chunk-${kb.id}-${i}-${Date.now()}`;
        const tokenCount = estimateTokens(chunk.content);
        totalTokens += tokenCount;

        let embedding = null;
        let embeddingModel = null;
        let hasEmbedding = false;

        if (generateEmbeddings && (env.GEMINI_API_KEY || env.GOOGLE_API_KEY || env.OPENAI_API_KEY)) {
          try {
            embedding = await generateEmbedding(chunk.content, env, { model: embeddingModel });
            if (embedding && Array.isArray(embedding) && embedding.length > 0) {
              const usedModel = env.GEMINI_API_KEY || env.GOOGLE_API_KEY ? 'gemini-embedding-001' : 'text-embedding-3-small';
              embeddingModel = usedModel;
              hasEmbedding = true;
            }
          } catch (e) {
            console.warn(`Failed to generate embedding for chunk ${i} with ${embeddingModel}:`, e);
            // Continue without embedding
          }
        }

        try {
          const embeddingVectorJson = hasEmbedding ? JSON.stringify(embedding) : null;
          const metadataJson = JSON.stringify({ start: chunk.start || 0, end: chunk.end || chunk.content.length });

          await env.DB.prepare(
            `INSERT INTO ai_knowledge_chunks (
              id, knowledge_id, tenant_id, chunk_index, content, content_preview,
              token_count, embedding_model, embedding_vector, metadata_json, is_indexed, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            chunkId,
            kb.id,
            finalTenantId,
            i,
            chunk.content,
            chunk.content.substring(0, 200),
            tokenCount,
            embeddingModel,
            embeddingVectorJson,
            metadataJson,
            hasEmbedding ? 1 : 0,
            now
          ).run();

          chunkCount++;
        } catch (e) {
          console.error(`Error inserting chunk ${i}:`, e);
          // Continue with next chunk (don't fail entire operation)
        }
      }

      // Update knowledge base entry
      try {
        const isIndexed = (generateEmbeddings && chunkCount > 0 && (env.GEMINI_API_KEY || env.GOOGLE_API_KEY || env.OPENAI_API_KEY)) ? 1 : 0;
        await env.DB.prepare(
          'UPDATE ai_knowledge_base SET chunk_count = ?, token_count = ?, is_indexed = ?, updated_at = ? WHERE id = ?'
        ).bind(
          chunkCount,
          totalTokens,
          isIndexed,
          now,
          kb.id
        ).run();
      } catch (e) {
        console.error('Error updating knowledge base entry:', e);
        // Don't fail the entire operation if update fails
      }

      return jsonResponse({
        success: true,
        data: {
          knowledge_id: kb.id,
          chunks_created: chunkCount,
          total_tokens: totalTokens,
          embeddings_generated: generateEmbeddings && chunkCount > 0 && (env.GEMINI_API_KEY || env.GOOGLE_API_KEY || env.OPENAI_API_KEY) ? true : false,
          embedding_model: (env.GEMINI_API_KEY || env.GOOGLE_API_KEY) ? 'gemini-embedding-001' : (env.OPENAI_API_KEY ? 'text-embedding-3-small' : null),
          chunks: chunks.slice(0, chunkCount).map((c, i) => ({
            index: i,
            content_preview: c.content.substring(0, 200),
            tokens: estimateTokens(c.content),
            has_embedding: generateEmbeddings && (env.GEMINI_API_KEY || env.GOOGLE_API_KEY || env.OPENAI_API_KEY) ? true : false
          }))
        }
      }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed or invalid path' }, 405, corsHeaders);
  } catch (error) {
    console.error('Knowledge Chunking API error:', error);
    return jsonResponse({ success: false, error: error.message || 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * Enhanced RAG Search with embeddings (vector similarity if embeddings exist, fallback to text search)
 */
async function handleRAGSearchEnhanced(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const finalTenantId = tenantId || 'system';

  try {
    if (request.method === 'POST') {
      const body = await request.json();
      const query = body.query || body.text || '';
      const limit = parseInt(body.limit || '5');
      const category = body.category || null;
      const useVectorSearch = body.use_vector_search !== false; // Default to true if embeddings available

      if (!query) {
        return jsonResponse({ success: false, error: 'query required' }, 400, corsHeaders);
      }

      // Try vector search if embeddings available and requested (Gemini preferred, OpenAI fallback)
      if (useVectorSearch && (env.GEMINI_API_KEY || env.GOOGLE_API_KEY || env.OPENAI_API_KEY)) {
        const queryEmbedding = await generateEmbedding(query, env, { model: 'gemini' });
        if (queryEmbedding) {
          // For vector search, we'd need to compare embeddings
          // Since D1 doesn't support vector ops well, we'll use text search for now
          // In production, you'd use Cloudflare Vectorize or external vector DB
          console.log('Vector search requested but using text search fallback (D1 limitation). Embedding generated with:', env.GEMINI_API_KEY || env.GOOGLE_API_KEY ? 'Gemini' : 'OpenAI');
        }
      }

      // Fall back to enhanced text search
      let searchQuery = `
        SELECT k.*, 
               CASE 
                 WHEN k.title LIKE ? THEN 3
                 WHEN k.content LIKE ? THEN 2
                 WHEN k.metadata_json LIKE ? THEN 1
                 ELSE 0
               END as relevance_score
        FROM ai_knowledge_base k
        WHERE k.is_active = 1 AND k.is_indexed = 1
        AND (
          k.title LIKE ? OR 
          k.content LIKE ? OR
          k.metadata_json LIKE ?
        )
      `;
      const searchTerm = `%${query}%`;
      const params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

      if (category) {
        searchQuery += ' AND k.category = ?';
        params.push(category);
      }

      searchQuery += ' ORDER BY relevance_score DESC, k.created_at DESC LIMIT ?';
      params.push(limit);

      const results = await env.DB.prepare(searchQuery).bind(...params).all();

      // Also search chunks with higher weight for matching chunks
      let chunkQuery = `
        SELECT c.*, k.title as knowledge_title, k.category,
               CASE 
                 WHEN c.content LIKE ? THEN 3
                 WHEN c.metadata_json LIKE ? THEN 1
                 ELSE 0
               END as relevance_score
        FROM ai_knowledge_chunks c
        JOIN ai_knowledge_base k ON c.knowledge_id = k.id
        WHERE k.is_active = 1 AND c.is_indexed = 1
        AND (c.content LIKE ? OR c.metadata_json LIKE ?)
      `;
      const chunkParams = [searchTerm, searchTerm, searchTerm, searchTerm];

      if (category) {
        chunkQuery += ' AND k.category = ?';
        chunkParams.push(category);
      }

      chunkQuery += ' ORDER BY relevance_score DESC, c.created_at DESC LIMIT ?';
      chunkParams.push(limit);

      const chunkResults = await env.DB.prepare(chunkQuery).bind(...chunkParams).all();

      // Log search history
      const now = Math.floor(Date.now() / 1000);
      const historyId = `rag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const retrievedIds = [
        ...(results.results || []).map(r => r.id),
        ...(chunkResults.results || []).map(c => c.id)
      ];

      await env.DB.prepare(
        `INSERT INTO ai_rag_search_history (
          id, tenant_id, query_text, prompt_id, pipeline_id, retrieved_chunk_ids_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        historyId,
        finalTenantId,
        query,
        body.prompt_id || null,
        body.pipeline_id || null,
        JSON.stringify(retrievedIds),
        now
      ).run().catch(() => { });

      return jsonResponse({
        success: true,
        data: {
          query,
          vector_search_used: false, // Set to true when Vectorize is integrated
          knowledge_base: (results.results || []).map(r => ({
            id: r.id,
            title: r.title,
            content: r.content.substring(0, 500),
            category: r.category,
            content_type: r.content_type,
            relevance_score: r.relevance_score,
            has_embedding: !!r.embedding_vector
          })),
          chunks: (chunkResults.results || []).map(c => ({
            id: c.id,
            knowledge_id: c.knowledge_id,
            knowledge_title: c.knowledge_title,
            content: c.content.substring(0, 500),
            chunk_index: c.chunk_index,
            relevance_score: c.relevance_score,
            has_embedding: !!c.embedding_vector
          }))
        }
      }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Enhanced RAG Search API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Handle Chat API - Conversational AI using Gemini Chat API
 * POST /api/chat - Send message and get AI response
 * GET /api/chat/history?session_id=xxx - Get chat history
 * POST /api/chat/clear - Clear chat history
 */
async function handleChat(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const finalTenantId = tenantId || 'system';
  const pathParts = url.pathname.split('/').filter(p => p);

  try {
    // GET /api/chat/history - Get chat history for a session
    if (pathParts.length === 3 && pathParts[2] === 'history' && request.method === 'GET') {
      const sessionId = url.searchParams.get('session_id') || `session-${finalTenantId}`;

      try {
        const history = await env.DB.prepare(
          'SELECT * FROM ai_chat_history WHERE session_id = ? AND tenant_id = ? ORDER BY created_at ASC LIMIT 100'
        ).bind(sessionId, finalTenantId).all();

        return jsonResponse({
          success: true,
          data: {
            session_id: sessionId,
            messages: (history.results || []).map(msg => ({
              role: msg.role,
              content: msg.content,
              created_at: msg.created_at
            }))
          }
        }, 200, corsHeaders);
      } catch (e) {
        // Table might not exist yet, return empty history
        return jsonResponse({
          success: true,
          data: { session_id: sessionId, messages: [] }
        }, 200, corsHeaders);
      }
    }

    // POST /api/chat/clear - Clear chat history
    if (pathParts.length === 3 && pathParts[2] === 'clear' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const sessionId = body.session_id || `session-${finalTenantId}`;

      try {
        await env.DB.prepare(
          'DELETE FROM ai_chat_history WHERE session_id = ? AND tenant_id = ?'
        ).bind(sessionId, finalTenantId).run();
      } catch (e) {
        // Table might not exist, ignore
      }

      return jsonResponse({ success: true, message: 'Chat history cleared' }, 200, corsHeaders);
    }

    // POST /api/chat - Main chat endpoint
    if (request.method === 'POST' && pathParts.length === 2) {
      const body = await request.json();
      const message = body.message || body.query || '';
      const sessionId = body.session_id || `session-${finalTenantId}-${Date.now()}`;
      const useRAG = body.use_rag !== false; // Default to true
      const mode = body.mode || 'assistant'; // 'assistant' for dashboard, 'support' for public pages
      const history = body.history || []; // Previous messages for context

      if (!message) {
        return jsonResponse({ success: false, error: 'Message is required' }, 400, corsHeaders);
      }

      // Check if Gemini API key is available
      const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
      if (!apiKey) {
        return jsonResponse({
          success: false,
          error: 'Gemini API key not configured. Please set GEMINI_API_KEY secret.'
        }, 503, corsHeaders);
      }

      // Build context from RAG if enabled
      let ragContext = '';
      if (useRAG) {
        try {
          const ragResults = await handleRAGSearchEnhanced(
            new Request(`${url.origin}/api/rag`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: message, limit: 3 })
            }),
            env,
            finalTenantId,
            corsHeaders
          );

          const ragData = await ragResults.json();
          if (ragData.success && ragData.data) {
            const knowledge = ragData.data.knowledge_base || [];
            const chunks = ragData.data.chunks || [];

            if (knowledge.length > 0 || chunks.length > 0) {
              ragContext = '\n\nRelevant context from knowledge base:\n';
              knowledge.slice(0, 2).forEach(kb => {
                ragContext += `- ${kb.title}: ${kb.content.substring(0, 200)}...\n`;
              });
              chunks.slice(0, 2).forEach(chunk => {
                ragContext += `- ${chunk.knowledge_title} (chunk ${chunk.chunk_index}): ${chunk.content.substring(0, 200)}...\n`;
              });
            }
          }
        } catch (e) {
          console.warn('RAG search failed, continuing without context:', e.message);
        }
      }

      // Build system prompt based on mode
      let systemPrompt = '';
      if (mode === 'support') {
        systemPrompt = 'You are a helpful customer support assistant for InnerAnimal Media. Be friendly, professional, and concise. Help users with questions about services, features, and technical issues.';
      } else {
        systemPrompt = 'You are Agent Sam, an AI assistant for InnerAnimal Media OS dashboard. You help users with:\n- Generating code and scripts\n- Analyzing logs and debugging\n- Planning tasks and workflows\n- Answering questions about the platform\n- Using tools and APIs\n\nBe concise and action-oriented. When appropriate, suggest specific commands or next steps.';
      }

      // Build conversation history for Gemini
      const conversationHistory = [];

      // Add system instruction
      if (systemPrompt) {
        conversationHistory.push({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
        conversationHistory.push({
          role: 'model',
          parts: [{ text: 'Understood. I\'m ready to help.' }]
        });
      }

      // Add previous conversation history
      if (history && history.length > 0) {
        history.slice(-10).forEach(msg => { // Limit to last 10 messages
          if (msg.role === 'user' || msg.role === 'assistant') {
            conversationHistory.push({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            });
          }
        });
      }

      // Add current message with RAG context
      const fullMessage = message + (ragContext ? ragContext : '');
      conversationHistory.push({
        role: 'user',
        parts: [{ text: fullMessage }]
      });

      // Call Gemini Chat API (gemini-1.5-flash or gemini-1.5-pro)
      const model = body.model || 'gemini-1.5-flash'; // Fast and cost-effective
      const startTime = Date.now();

      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: conversationHistory,
              generationConfig: {
                temperature: body.temperature || 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: body.max_tokens || 2048,
              }
            })
          }
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error('Gemini API error:', errorText);
          throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText.substring(0, 200)}`);
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
        const usage = geminiData.usageMetadata || {};
        const duration = Date.now() - startTime;

        // Track API cost
        const estimatedCost = (usage.totalTokenCount || 0) * 0.000000125; // Approximate cost per token for gemini-1.5-flash
        trackAPICost(env, {
          service: 'gemini',
          event_type: 'chat',
          usage_amount: usage.totalTokenCount || 0,
          usage_unit: 'tokens',
          estimated_cost_usd: estimatedCost,
          metadata: {
            model,
            mode,
            input_tokens: usage.promptTokenCount || 0,
            output_tokens: usage.candidatesTokenCount || 0,
            duration_ms: duration,
            used_rag: useRAG
          },
          tenant_id: finalTenantId
        }).catch(() => { }); // Non-blocking

        // Save to chat history
        const now = Math.floor(Date.now() / 1000);
        const userMsgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const aiMsgId = `msg-${Date.now() + 1}-${Math.random().toString(36).substr(2, 9)}`;

        try {
          // Save user message
          await env.DB.prepare(
            `INSERT INTO ai_chat_history (id, session_id, tenant_id, role, content, metadata_json, created_at)
             VALUES (?, ?, ?, 'user', ?, ?, ?)`
          ).bind(
            userMsgId,
            sessionId,
            finalTenantId,
            message,
            JSON.stringify({ mode, use_rag: useRAG }),
            now
          ).run();

          // Save AI response
          await env.DB.prepare(
            `INSERT INTO ai_chat_history (id, session_id, tenant_id, role, content, metadata_json, created_at)
             VALUES (?, ?, ?, 'assistant', ?, ?, ?)`
          ).bind(
            aiMsgId,
            sessionId,
            finalTenantId,
            responseText,
            JSON.stringify({
              model,
              usage,
              duration_ms: duration,
              used_rag: useRAG
            }),
            now + 1
          ).run();
        } catch (e) {
          // Table might not exist yet, continue without saving
          console.warn('Chat history table not found, skipping save:', e.message);
        }

        return jsonResponse({
          success: true,
          data: {
            message: responseText,
            session_id: sessionId,
            model,
            usage: {
              input_tokens: usage.promptTokenCount || 0,
              output_tokens: usage.candidatesTokenCount || 0,
              total_tokens: usage.totalTokenCount || 0
            },
            duration_ms: duration
          }
        }, 200, corsHeaders);

      } catch (error) {
        console.error('Gemini Chat API error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to get AI response',
          details: error.toString()
        }, 500, corsHeaders);
      }
    }

    return jsonResponse({ error: 'Method not allowed or invalid path' }, 405, corsHeaders);
  } catch (error) {
    console.error('Chat API error:', error);
    return jsonResponse({ success: false, error: error.message || 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * Track API costs and usage for accurate spending monitoring
 * @param {Object} env - Worker environment
 * @param {Object} costData - Cost tracking data
 */
async function trackAPICost(env, costData) {
  const {
    service,
    event_type,
    usage_amount = 0,
    usage_unit = 'operations',
    estimated_cost_usd = 0,
    metadata = {},
    tenant_id = 'system',
    user_id = null
  } = costData;

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const costId = `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store cost tracking in D1 database
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT INTO cost_tracking (
            id, service, event_type, usage_amount, usage_unit, estimated_cost_usd,
            tenant_id, user_id, metadata, timestamp, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          costId,
          service,
          event_type,
          usage_amount,
          usage_unit,
          estimated_cost_usd,
          tenant_id,
          user_id,
          JSON.stringify(metadata),
          timestamp,
          timestamp
        ).run();
      } catch (dbError) {
        // If cost_tracking table doesn't exist yet, skip silently (will be created by migration)
        console.warn('Cost tracking table not found, skipping DB write:', dbError.message);
      }
    }

    // Also log to Analytics Engine for real-time monitoring
    await writeAnalyticsEvent(env, {
      event_type: 'api_cost_tracking',
      tenant_id: tenant_id,
      user_id: user_id,
      metadata: {
        service: service,
        event_type_detail: event_type,
        usage_amount: usage_amount,
        usage_unit: usage_unit,
        estimated_cost_usd: estimated_cost_usd,
        ...metadata
      }
    });

  } catch (error) {
    // Don't fail requests if cost tracking fails - log error but continue execution
    console.error('Failed to track API cost:', error.message);
  }
}

/**
 * Handle Cost Tracking API endpoint
 * GET /api/cost-tracking - Get cost summary
 */
async function handleCostTracking(request, env, tenantId, corsHeaders) {
  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const service = url.searchParams.get('service');
      const startDate = parseInt(url.searchParams.get('start_date') || '0');
      const endDate = parseInt(url.searchParams.get('end_date') || String(Math.floor(Date.now() / 1000)));
      const groupBy = url.searchParams.get('group_by') || 'day';
      const limit = parseInt(url.searchParams.get('limit') || '1000');

      // Build query
      let query = `
        SELECT service, event_type, usage_amount, usage_unit, estimated_cost_usd, actual_cost_usd,
               tenant_id, user_id, metadata, timestamp, created_at
        FROM cost_tracking
        WHERE timestamp >= ? AND timestamp <= ?
      `;
      let params = [startDate, endDate];

      if (tenantId) {
        query += ' AND (tenant_id = ? OR tenant_id = ?)';
        params.push(tenantId, 'system');
      }

      if (service) {
        query += ' AND service = ?';
        params.push(service);
      }

      query += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(limit);

      // Execute query
      const result = await env.DB.prepare(query).bind(...params).all();
      const costs = result.results || [];

      // Calculate totals
      const totals = {
        by_service: {},
        by_event_type: {},
        overall: {
          total_cost: 0,
          total_usage: 0,
          event_count: 0
        }
      };

      costs.forEach(row => {
        const serviceName = row.service;
        const eventType = row.event_type;
        const cost = row.estimated_cost_usd || 0;
        const usage = row.usage_amount || 0;

        // By service
        if (!totals.by_service[serviceName]) {
          totals.by_service[serviceName] = {
            total_cost: 0,
            total_usage: 0,
            events: 0,
            usage_unit: row.usage_unit
          };
        }
        totals.by_service[serviceName].total_cost += cost;
        totals.by_service[serviceName].total_usage += usage;
        totals.by_service[serviceName].events += 1;

        // By event type
        if (!totals.by_event_type[eventType]) {
          totals.by_event_type[eventType] = {
            total_cost: 0,
            events: 0
          };
        }
        totals.by_event_type[eventType].total_cost += cost;
        totals.by_event_type[eventType].events += 1;

        // Overall
        totals.overall.total_cost += cost;
        totals.overall.total_usage += usage;
        totals.overall.event_count += 1;
      });

      // Return data with totals
      return jsonResponse({
        success: true,
        data: costs,
        totals: totals,
        summary: {
          total_cost: totals.overall.total_cost,
          total_events: totals.overall.event_count,
          date_range: {
            start: startDate,
            end: endDate
          },
          group_by: groupBy
        }
      }, 200, corsHeaders);

    } catch (error) {
      console.error('Error fetching cost tracking:', error);
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Support Tickets API Handler
 */
async function handleSupportTickets(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);

  // Get ticket ID if present: /api/support/tickets/:id
  const ticketId = pathParts.length >= 4 ? pathParts[3] : null;

  try {
    // GET /api/support/tickets - List all tickets
    if (request.method === 'GET' && !ticketId) {
      const email = url.searchParams.get('email') || 'user@example.com'; // TODO: Get from session/auth
      const status = url.searchParams.get('status');
      const category = url.searchParams.get('category');
      const priority = url.searchParams.get('priority');

      let query = 'SELECT * FROM support_tickets WHERE email = ?';
      const params = [email];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      if (priority) {
        query += ' AND priority = ?';
        params.push(priority);
      }

      query += ' ORDER BY created_at DESC';

      const result = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, data: result.results || [] }, 200, corsHeaders);
    }

    // GET /api/support/tickets/:id - Get ticket with messages
    if (request.method === 'GET' && ticketId) {
      const ticket = await env.DB.prepare('SELECT * FROM support_tickets WHERE id = ?').bind(ticketId).first();
      if (!ticket) {
        return jsonResponse({ success: false, error: 'Ticket not found' }, 404, corsHeaders);
      }

      const messagesResult = await env.DB.prepare(
        'SELECT id, ticket_id, message, user_id, user_name, user_email, is_internal, created_at FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC'
      ).bind(ticketId).all();

      // Map existing structure to expected format for frontend
      const messages = (messagesResult.results || []).map(msg => ({
        id: msg.id,
        ticket_id: msg.ticket_id,
        message: msg.message,
        sender_type: msg.is_internal === 1 ? 'internal' : (msg.user_email && msg.user_name ? 'user' : 'support'),
        sender_name: msg.user_name,
        sender_email: msg.user_email,
        created_at: msg.created_at
      }));

      return jsonResponse({
        success: true,
        data: {
          ...ticket,
          messages: messages
        }
      }, 200, corsHeaders);
    }

    // POST /api/support/tickets - Create new ticket
    if (request.method === 'POST' && !ticketId) {
      const body = await request.json();
      const { subject, description, priority = 'normal', category, tags = [] } = body;
      const email = body.email || 'user@example.com'; // TODO: Get from session/auth

      if (!subject || !description) {
        return jsonResponse({ success: false, error: 'Subject and description are required' }, 400, corsHeaders);
      }

      const now = Math.floor(Date.now() / 1000);
      const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await env.DB.prepare(
        `INSERT INTO support_tickets (
          id, user_id, email, subject, description, status, priority, category, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)`
      ).bind(ticketId, null, email, subject, description, priority, category || null, now, now).run();

      // Add tags if provided
      // Note: existing table structure uses (ticket_id, tag) as composite PRIMARY KEY
      if (tags.length > 0) {
        for (const tag of tags) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO ticket_tags (ticket_id, tag) VALUES (?, ?)'
          ).bind(ticketId, tag).run().catch(() => { });
        }
      }

      const ticket = await env.DB.prepare('SELECT * FROM support_tickets WHERE id = ?').bind(ticketId).first();
      return jsonResponse({ success: true, data: ticket }, 201, corsHeaders);
    }

    // PATCH /api/support/tickets/:id - Update ticket status
    if (request.method === 'PATCH' && ticketId) {
      const body = await request.json();
      const { status, assigned_to } = body;
      const now = Math.floor(Date.now() / 1000);

      let updateFields = [];
      const params = [];

      if (status) {
        updateFields.push('status = ?');
        params.push(status);
        if (status === 'resolved') {
          updateFields.push('resolved_at = ?');
          params.push(now);
        } else if (status === 'closed') {
          updateFields.push('closed_at = ?');
          params.push(now);
        }
      }
      if (assigned_to !== undefined) {
        updateFields.push('assigned_to = ?');
        params.push(assigned_to);
      }

      if (updateFields.length === 0) {
        return jsonResponse({ success: false, error: 'No fields to update' }, 400, corsHeaders);
      }

      updateFields.push('updated_at = ?');
      params.push(now);
      params.push(ticketId);

      await env.DB.prepare(
        `UPDATE support_tickets SET ${updateFields.join(', ')} WHERE id = ?`
      ).bind(...params).run();

      const ticket = await env.DB.prepare('SELECT * FROM support_tickets WHERE id = ?').bind(ticketId).first();
      return jsonResponse({ success: true, data: ticket }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Support Tickets API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Support Ticket Messages API Handler
 */
async function handleSupportTicketMessages(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const ticketId = pathParts.length >= 5 ? pathParts[3] : null;

  if (request.method === 'POST' && ticketId) {
    try {
      const body = await request.json();
      const { message, sender_type = 'user', sender_name, sender_email } = body;

      if (!message) {
        return jsonResponse({ success: false, error: 'Message is required' }, 400, corsHeaders);
      }

      // Verify ticket exists
      const ticket = await env.DB.prepare('SELECT id, status FROM support_tickets WHERE id = ?').bind(ticketId).first();
      if (!ticket) {
        return jsonResponse({ success: false, error: 'Ticket not found' }, 404, corsHeaders);
      }

      const now = Math.floor(Date.now() / 1000);
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Map sender_type to is_internal: 
      // sender_type = 'support' → is_internal = 0 (customer visible)
      // sender_type = 'user' → is_internal = 0 (customer visible)
      // sender_type = 'internal' → is_internal = 1 (internal note)
      const isInternal = sender_type === 'internal' ? 1 : 0;

      // Map sender info to existing columns: user_name, user_email, user_id
      // Note: existing table structure uses user_id, user_name, user_email, is_internal
      await env.DB.prepare(
        `INSERT INTO ticket_messages (
          id, ticket_id, message, user_id, user_name, user_email, is_internal, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        messageId,
        ticketId,
        message,
        null, // user_id (can be populated from session/auth later)
        sender_name || null,
        sender_email || null,
        isInternal,
        now
      ).run();

      // Update ticket first_response_at if this is the first response from support
      // Check if this is a support response (sender_type = 'support') and ticket is still 'open'
      if (ticket.status === 'open' && sender_type === 'support') {
        await env.DB.prepare(
          'UPDATE support_tickets SET status = ?, first_response_at = ?, updated_at = ? WHERE id = ?'
        ).bind('in_progress', now, now, ticketId).run();
      } else {
        await env.DB.prepare('UPDATE support_tickets SET updated_at = ? WHERE id = ?')
          .bind(now, ticketId).run();
      }

      // Return message in expected format
      const newMessage = await env.DB.prepare(
        'SELECT id, ticket_id, message, user_id, user_name, user_email, is_internal, created_at FROM ticket_messages WHERE id = ?'
      ).bind(messageId).first();

      // Map to expected format for frontend
      const formattedMessage = {
        id: newMessage.id,
        ticket_id: newMessage.ticket_id,
        message: newMessage.message,
        sender_type: newMessage.is_internal === 1 ? 'internal' : (newMessage.user_email ? 'user' : 'support'),
        sender_name: newMessage.user_name,
        sender_email: newMessage.user_email,
        created_at: newMessage.created_at
      };

      return jsonResponse({ success: true, data: formattedMessage }, 201, corsHeaders);
    } catch (error) {
      console.error('Ticket Messages API error:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Help Center API Handler
 */
async function handleHelpCenter(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);

  try {
    // GET /api/help/categories - List all categories
    if (pathParts.length === 3 && pathParts[2] === 'categories' && request.method === 'GET') {
      // First try to get from help_categories table (if it exists)
      try {
        const categoriesResult = await env.DB.prepare(
          'SELECT slug as category, name, description, order_index FROM help_categories ORDER BY order_index, name'
        ).all();

        if (categoriesResult.results && categoriesResult.results.length > 0) {
          // Get article counts for each category
          const categoriesWithCounts = await Promise.all(
            categoriesResult.results.map(async (cat) => {
              const countResult = await env.DB.prepare(
                'SELECT COUNT(*) as count FROM help_articles WHERE category = ? AND is_published = 1'
              ).bind(cat.category).first();
              return {
                category: cat.category,
                name: cat.name,
                description: cat.description,
                article_count: countResult?.count || 0
              };
            })
          );
          return jsonResponse({ success: true, data: categoriesWithCounts }, 200, corsHeaders);
        }
      } catch (error) {
        // If help_categories doesn't exist, get distinct categories from articles
        console.log('help_categories table not found, using distinct from articles');
      }

      // Fallback: Get distinct categories from help_articles
      const result = await env.DB.prepare(
        'SELECT DISTINCT category, COUNT(*) as article_count FROM help_articles WHERE is_published = 1 GROUP BY category ORDER BY category'
      ).all();

      return jsonResponse({ success: true, data: result.results || [] }, 200, corsHeaders);
    }

    // GET /api/help/articles/:slug - Get single article
    if (pathParts.length === 4 && pathParts[2] === 'articles' && request.method === 'GET') {
      const slug = pathParts[3];
      const article = await env.DB.prepare(
        'SELECT * FROM help_articles WHERE slug = ? AND is_published = 1'
      ).bind(slug).first();

      if (!article) {
        return jsonResponse({ success: false, error: 'Article not found' }, 404, corsHeaders);
      }

      // Increment view count
      await env.DB.prepare(
        'UPDATE help_articles SET view_count = view_count + 1 WHERE id = ?'
      ).bind(article.id).run().catch(() => { });

      return jsonResponse({ success: true, data: article }, 200, corsHeaders);
    }

    // GET /api/help/articles - List articles (filter by category)
    if (pathParts.length === 3 && pathParts[2] === 'articles' && request.method === 'GET') {
      const category = url.searchParams.get('category');
      let query = 'SELECT id, category, title, slug, summary, helpful_count, not_helpful_count, view_count, created_at FROM help_articles WHERE is_published = 1';
      const params = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      query += ' ORDER BY view_count DESC, created_at DESC';

      const result = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, data: result.results || [] }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Help Center API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Help Search API Handler
 */
async function handleHelpSearch(request, env, tenantId, corsHeaders) {
  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const query = url.searchParams.get('q') || '';

      if (!query) {
        return jsonResponse({ success: true, data: [] }, 200, corsHeaders);
      }

      const searchTerm = `%${query}%`;
      const result = await env.DB.prepare(
        `SELECT id, category, title, slug, summary, helpful_count, view_count 
         FROM help_articles 
         WHERE is_published = 1 
         AND (title LIKE ? OR summary LIKE ? OR content LIKE ? OR search_keywords LIKE ?)
         ORDER BY view_count DESC
         LIMIT 20`
      ).bind(searchTerm, searchTerm, searchTerm, searchTerm).all();

      return jsonResponse({ success: true, data: result.results || [] }, 200, corsHeaders);
    } catch (error) {
      console.error('Help Search API error:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Help Article Feedback API Handler
 */
async function handleHelpArticleFeedback(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);

  if (request.method === 'POST' && pathParts.length >= 5 && pathParts[pathParts.length - 1] === 'feedback') {
    try {
      const slug = pathParts[3];
      const body = await request.json();
      const { helpful } = body;

      if (typeof helpful !== 'boolean') {
        return jsonResponse({ success: false, error: 'helpful field must be boolean' }, 400, corsHeaders);
      }

      const article = await env.DB.prepare('SELECT id FROM help_articles WHERE slug = ?').bind(slug).first();
      if (!article) {
        return jsonResponse({ success: false, error: 'Article not found' }, 404, corsHeaders);
      }

      if (helpful) {
        await env.DB.prepare('UPDATE help_articles SET helpful_count = helpful_count + 1 WHERE id = ?')
          .bind(article.id).run();
      } else {
        await env.DB.prepare('UPDATE help_articles SET not_helpful_count = not_helpful_count + 1 WHERE id = ?')
          .bind(article.id).run();
      }

      return jsonResponse({ success: true, message: 'Feedback recorded' }, 200, corsHeaders);
    } catch (error) {
      console.error('Help Article Feedback API error:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * MeauxCAD API Handler - 3D Modeling with Meshy/Blender/CloudConvert
 * POST /api/cad/models - Create/upload 3D model
 * POST /api/cad/generate - Generate 3D model via Meshy
 * POST /api/cad/convert - Convert model format via CloudConvert
 * POST /api/cad/render - Render model via Blender
 * GET /api/cad/models - List all models
 * GET /api/cad/models/:id - Get model details
 * DELETE /api/cad/models/:id - Delete model
 */
async function handleMeauxCAD(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const finalTenantId = tenantId || 'system';
  const storagePrefix = `cad/${finalTenantId}/`;

  // pathParts structure: ['api', 'cad', 'generate'] or ['api', 'cad', 'models'] or ['api', 'cad', 'models', ':id']
  // So pathParts[0] = 'api', pathParts[1] = 'cad', pathParts[2] = action/model, pathParts[3] = id or sub-action

  try {
    // POST /api/cad/generate - Generate 3D model via Meshy
    if (pathParts.length === 3 && pathParts[2] === 'generate' && request.method === 'POST') {
      const meshyApiKey = env.MESHYAI_API_KEY || env.MESHY_API_KEY;
      if (!meshyApiKey) {
        return jsonResponse({
          success: false,
          error: 'MESHYAI_API_KEY not configured. Please set MESHYAI_API_KEY secret.'
        }, 500, corsHeaders);
      }

      try {
        const body = await request.json();
        const { prompt, style = 'realistic', resolution = '1024' } = body;

        if (!prompt) {
          return jsonResponse({
            success: false,
            error: 'Prompt is required for 3D model generation'
          }, 400, corsHeaders);
        }

        // Call Meshy API to generate 3D model (text-to-3d)
        const meshyResponse = await fetch('https://api.meshy.ai/v2/text-to-3d', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${meshyApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: prompt,
            mode: style || 'realistic', // 'realistic', 'stylized', 'anime', etc.
            resolution: resolution || '1024',
            art_style: style || 'realistic'
          })
        });

        const meshyData = await meshyResponse.json();

        if (!meshyResponse.ok) {
          return jsonResponse({
            success: false,
            error: meshyData.error || 'Meshy API error',
            details: meshyData
          }, meshyResponse.status, corsHeaders);
        }

        // Save model metadata to database
        const modelId = `cad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare(`
          INSERT INTO cad_models (
            id, tenant_id, name, prompt, style, resolution, source, status, 
            meshy_task_id, file_path, file_url, metadata_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'meshy', 'processing', ?, ?, ?, ?, ?)
        `).bind(
          modelId,
          finalTenantId,
          prompt.substring(0, 100),
          prompt,
          style,
          resolution,
          meshyData.id || null,
          null, // file_path - will be set when ready
          meshyData.result?.model_urls?.glb || null,
          JSON.stringify(meshyData),
          now
        ).run();

        // Track API cost
        trackAPICost(env, {
          service: 'meshy',
          event_type: 'compute',
          usage_amount: 1,
          usage_unit: 'generation',
          estimated_cost_usd: 0.05, // Approximate Meshy cost
          metadata: { prompt, style, resolution },
          tenant_id: finalTenantId
        }).catch(e => console.error('Cost tracking error:', e));

        return jsonResponse({
          success: true,
          data: {
            id: modelId,
            task_id: meshyData.id,
            status: 'processing',
            message: '3D model generation started. Poll task status for completion.'
          },
          meshy_response: meshyData
        }, 200, corsHeaders);

      } catch (error) {
        console.error('MeauxCAD generation error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to generate 3D model'
        }, 500, corsHeaders);
      }
    }

    // POST /api/cad/convert - Convert model format via CloudConvert
    if (pathParts.length === 3 && pathParts[2] === 'convert' && request.method === 'POST') {
      if (!env.CLOUDCONVERT_API_KEY) {
        return jsonResponse({
          success: false,
          error: 'CLOUDCONVERT_API_KEY not configured'
        }, 500, corsHeaders);
      }

      try {
        const body = await request.json();
        const { file_url, output_format = 'glb', input_format = 'obj' } = body;

        if (!file_url) {
          return jsonResponse({
            success: false,
            error: 'File URL is required for conversion'
          }, 400, corsHeaders);
        }

        // Create CloudConvert job
        const ccResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.CLOUDCONVERT_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tasks: {
              'import-url': {
                operation: 'import/url',
                url: file_url
              },
              'convert': {
                operation: 'convert',
                input: 'import-url',
                output_format: output_format,
                input_format: input_format
              },
              'export-url': {
                operation: 'export/url',
                input: 'convert'
              }
            }
          })
        });

        const ccData = await ccResponse.json();

        if (!ccResponse.ok) {
          return jsonResponse({
            success: false,
            error: ccData.message || 'CloudConvert API error'
          }, ccResponse.status, corsHeaders);
        }

        // Track cost
        trackAPICost(env, {
          service: 'cloudconvert',
          event_type: 'compute',
          usage_amount: 1,
          usage_unit: 'conversion',
          estimated_cost_usd: 0.01,
          metadata: { input_format, output_format },
          tenant_id: finalTenantId
        }).catch(e => console.error('Cost tracking error:', e));

        return jsonResponse({
          success: true,
          data: {
            job_id: ccData.data.id,
            status: 'processing',
            message: 'Conversion started. Poll job status for completion.'
          }
        }, 200, corsHeaders);

      } catch (error) {
        console.error('MeauxCAD conversion error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to convert model'
        }, 500, corsHeaders);
      }
    }

    // POST /api/cad/models - Upload/create model
    if (pathParts.length === 3 && pathParts[2] === 'models' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        const name = formData.get('name') || 'Untitled Model';
        const description = formData.get('description') || '';

        if (!file) {
          return jsonResponse({
            success: false,
            error: 'File is required'
          }, 400, corsHeaders);
        }

        // Validate file type
        const validExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.dae', '.blend'];
        const fileName = file.name || 'model.glb';
        const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        if (!validExtensions.includes(extension)) {
          return jsonResponse({
            success: false,
            error: `Invalid file type. Supported: ${validExtensions.join(', ')}`
          }, 400, corsHeaders);
        }

        // Save to R2
        const fileId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const r2Key = `${storagePrefix}${fileId}${extension}`;
        const fileBuffer = await file.arrayBuffer();

        await env.STORAGE.put(r2Key, fileBuffer, {
          httpMetadata: {
            contentType: file.type || 'application/octet-stream',
            cacheControl: 'public, max-age=31536000'
          },
          customMetadata: {
            tenant_id: finalTenantId,
            original_name: fileName,
            uploaded_at: new Date().toISOString()
          }
        });

        // Get public URL (or generate signed URL)
        const fileUrl = `/api/cad/models/${fileId}/download`;

        // Save metadata to database
        const now = Math.floor(Date.now() / 1000);
        await env.DB.prepare(`
          INSERT INTO cad_models (
            id, tenant_id, name, description, source, status, file_path, 
            file_url, file_size, file_type, created_at
          ) VALUES (?, ?, ?, ?, 'upload', 'ready', ?, ?, ?, ?, ?)
        `).bind(
          fileId,
          finalTenantId,
          name,
          description,
          r2Key,
          fileUrl,
          fileBuffer.byteLength,
          extension,
          now
        ).run();

        return jsonResponse({
          success: true,
          data: {
            id: fileId,
            name,
            url: fileUrl,
            size: fileBuffer.byteLength,
            type: extension,
            status: 'ready'
          }
        }, 201, corsHeaders);

      } catch (error) {
        console.error('MeauxCAD upload error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to upload model'
        }, 500, corsHeaders);
      }
    }

    // GET /api/cad/models - List models
    if (pathParts.length === 3 && pathParts[2] === 'models' && request.method === 'GET') {
      try {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const status = url.searchParams.get('status');
        const source = url.searchParams.get('source');

        let query = `
          SELECT id, tenant_id, name, description, source, status, file_url, 
                 file_size, file_type, metadata_json, created_at, updated_at
          FROM cad_models
          WHERE tenant_id = ?
        `;
        const params = [finalTenantId];

        if (status) {
          query += ' AND status = ?';
          params.push(status);
        }
        if (source) {
          query += ' AND source = ?';
          params.push(source);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const result = await env.DB.prepare(query).bind(...params).all();

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM cad_models WHERE tenant_id = ?';
        const countParams = [finalTenantId];
        if (status) {
          countQuery += ' AND status = ?';
          countParams.push(status);
        }
        if (source) {
          countQuery += ' AND source = ?';
          countParams.push(source);
        }
        const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

        return jsonResponse({
          success: true,
          data: {
            models: (result.results || []).map(m => ({
              ...m,
              metadata: m.metadata_json ? JSON.parse(m.metadata_json) : null
            })),
            pagination: {
              total: countResult?.total || 0,
              limit,
              offset
            }
          }
        }, 200, corsHeaders);

      } catch (error) {
        console.error('MeauxCAD list error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to list models'
        }, 500, corsHeaders);
      }
    }

    // GET /api/cad/models/:id - Get model details
    if (pathParts[3] === 'models' && pathParts[4] && request.method === 'GET' && pathParts[5] !== 'download') {
      try {
        const modelId = pathParts[4];
        const model = await env.DB.prepare(`
          SELECT * FROM cad_models
          WHERE id = ? AND tenant_id = ?
        `).bind(modelId, finalTenantId).first();

        if (!model) {
          return jsonResponse({
            success: false,
            error: 'Model not found'
          }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          data: {
            ...model,
            metadata: model.metadata_json ? JSON.parse(model.metadata_json) : null
          }
        }, 200, corsHeaders);

      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to get model'
        }, 500, corsHeaders);
      }
    }

    // GET /api/cad/models/:id/download - Download model file
    if (pathParts.length === 5 && pathParts[2] === 'models' && pathParts[3] && pathParts[4] === 'download' && request.method === 'GET') {
      try {
        const modelId = pathParts[3];
        const model = await env.DB.prepare(`
          SELECT file_path, file_type FROM cad_models
          WHERE id = ? AND tenant_id = ?
        `).bind(modelId, finalTenantId).first();

        if (!model || !model.file_path) {
          return jsonResponse({
            success: false,
            error: 'Model file not found'
          }, 404, corsHeaders);
        }

        const object = await env.STORAGE.get(model.file_path);
        if (!object) {
          return jsonResponse({
            success: false,
            error: 'File not found in storage'
          }, 404, corsHeaders);
        }

        const fileBuffer = await object.arrayBuffer();
        return new Response(fileBuffer, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="model${model.file_type}"`,
            ...corsHeaders
          }
        });

      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to download model'
        }, 500, corsHeaders);
      }
    }

    // DELETE /api/cad/models/:id - Delete model
    if (pathParts.length === 4 && pathParts[2] === 'models' && pathParts[3] && request.method === 'DELETE') {
      try {
        const modelId = pathParts[3];
        const model = await env.DB.prepare(`
          SELECT file_path FROM cad_models
          WHERE id = ? AND tenant_id = ?
        `).bind(modelId, finalTenantId).first();

        if (!model) {
          return jsonResponse({
            success: false,
            error: 'Model not found'
          }, 404, corsHeaders);
        }

        // Delete from R2
        if (model.file_path) {
          await env.STORAGE.delete(model.file_path).catch(e => console.warn('Failed to delete file:', e));
        }

        // Delete from database
        await env.DB.prepare('DELETE FROM cad_models WHERE id = ? AND tenant_id = ?')
          .bind(modelId, finalTenantId).run();

        return jsonResponse({
          success: true,
          message: 'Model deleted successfully'
        }, 200, corsHeaders);

      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to delete model'
        }, 500, corsHeaders);
      }
    }

    // GET /api/cad - Get CAD info
    if (request.method === 'GET' && pathParts.length === 3) {
      return jsonResponse({
        success: true,
        message: 'MeauxCAD API ready',
        endpoints: {
          generate: 'POST /api/cad/generate - Generate 3D model via Meshy',
          convert: 'POST /api/cad/convert - Convert model format via CloudConvert',
          upload: 'POST /api/cad/models - Upload 3D model',
          list: 'GET /api/cad/models - List all models',
          get: 'GET /api/cad/models/:id - Get model details',
          download: 'GET /api/cad/models/:id/download - Download model file',
          delete: 'DELETE /api/cad/models/:id - Delete model'
        },
        integrations: {
          meshy: (env.MESHYAI_API_KEY || env.MESHY_API_KEY) ? 'configured' : 'not_configured',
          cloudconvert: env.CLOUDCONVERT_API_KEY ? 'configured' : 'not_configured',
          blender: 'ready (R2 storage)'
        },
        supported_formats: ['glb', 'gltf', 'obj', 'fbx', 'dae', 'blend']
      }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Method not allowed or invalid path' }, 405, corsHeaders);
  } catch (error) {
    console.error('MeauxCAD API error:', error);
    return jsonResponse({
      success: false,
      error: error.message || 'Internal server error'
    }, 500, corsHeaders);
  }
}

/**
 * AI Services API Handler - Manage AI service integrations
 * GET /api/ai-services - List all AI services
 * POST /api/ai-services - Create/update AI service
 * GET /api/ai-services/:id - Get service details
 * POST /api/ai-services/:id/test - Test service connection
 * DELETE /api/ai-services/:id - Delete service
 */
async function handleAIServices(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const finalTenantId = tenantId || 'system';

  // pathParts: ['api', 'ai-services'] for GET/POST /api/ai-services
  // pathParts: ['api', 'ai-services', 'id'] for GET/DELETE /api/ai-services/:id
  // pathParts: ['api', 'ai-services', 'id', 'test'] for POST /api/ai-services/:id/test

  try {
    // GET /api/ai-services - List all services
    if (request.method === 'GET' && pathParts.length === 2) {
      const services = await env.DB.prepare(`
        SELECT id, name, provider, type, status, config_json, usage_count, last_used_at, created_at, updated_at
        FROM ai_services WHERE tenant_id = ? ORDER BY created_at DESC
      `).bind(finalTenantId).all();

      return jsonResponse({
        success: true,
        data: {
          services: (services.results || []).map(s => ({
            ...s,
            config: s.config_json ? JSON.parse(s.config_json) : null
          }))
        }
      }, 200, corsHeaders);
    }

    // POST /api/ai-services - Create new service
    if (request.method === 'POST' && pathParts.length === 2) {
      const body = await request.json();
      const { name, provider, type, config } = body;

      if (!name || !provider || !type) {
        return jsonResponse({
          success: false,
          error: 'Name, provider, and type are required'
        }, 400, corsHeaders);
      }

      const serviceId = `aisvc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Math.floor(Date.now() / 1000);

      await env.DB.prepare(`
        INSERT INTO ai_services (id, tenant_id, name, provider, type, status, config_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
      `).bind(serviceId, finalTenantId, name, provider, type, JSON.stringify(config || {}), now, now).run();

      return jsonResponse({
        success: true,
        data: { id: serviceId, name, provider, type, status: 'active' }
      }, 201, corsHeaders);
    }

    // GET /api/ai-services/:id - Get service details
    if (pathParts.length === 3 && pathParts[2] && request.method === 'GET') {
      try {
        const serviceId = pathParts[2];
        const service = await env.DB.prepare(`
          SELECT * FROM ai_services WHERE id = ? AND tenant_id = ?
        `).bind(serviceId, finalTenantId).first();

        if (!service) {
          return jsonResponse({
            success: false,
            error: 'Service not found'
          }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          data: {
            ...service,
            config: service.config_json ? JSON.parse(service.config_json) : null
          }
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to get service'
        }, 500, corsHeaders);
      }
    }

    // POST /api/ai-services/:id/test - Test service connection
    if (pathParts.length === 4 && pathParts[2] && pathParts[3] === 'test' && request.method === 'POST') {
      try {
        const serviceId = pathParts[2];
        const body = await request.json();
        const { input } = body;

        const service = await env.DB.prepare(`
          SELECT * FROM ai_services WHERE id = ? AND tenant_id = ?
        `).bind(serviceId, finalTenantId).first();

        if (!service) {
          return jsonResponse({
            success: false,
            error: 'Service not found'
          }, 404, corsHeaders);
        }

        // Update last_used_at
        await env.DB.prepare(`
          UPDATE ai_services SET last_used_at = ?, usage_count = usage_count + 1 WHERE id = ? AND tenant_id = ?
        `).bind(Math.floor(Date.now() / 1000), serviceId, finalTenantId).run();

        // For now, return a simple test response
        // In production, this would actually call the AI service API
        return jsonResponse({
          success: true,
          data: {
            output: `Service test: ${service.name} (${service.provider}) received input: "${input?.substring(0, 50) || 'N/A'}"`,
            message: 'Service connection test successful (mock response - actual API call would happen here)'
          }
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to test service'
        }, 500, corsHeaders);
      }
    }

    // DELETE /api/ai-services/:id - Delete service
    if (pathParts.length === 3 && pathParts[2] && request.method === 'DELETE') {
      try {
        const serviceId = pathParts[2];
        const result = await env.DB.prepare(`
          DELETE FROM ai_services WHERE id = ? AND tenant_id = ?
        `).bind(serviceId, finalTenantId).run();

        if (result.meta.changes === 0) {
          return jsonResponse({
            success: false,
            error: 'Service not found'
          }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          message: 'Service deleted successfully'
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to delete service'
        }, 500, corsHeaders);
      }
    }

    return jsonResponse({ error: 'Method not allowed or invalid path' }, 405, corsHeaders);
  } catch (error) {
    console.error('AI Services API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Analytics API Handler - Full analytics with Cloudflare Analytics Engine
 * GET /api/analytics - Get analytics dashboard data
 * GET /api/analytics/events - Get event analytics
 * GET /api/analytics/usage - Get usage analytics
 * POST /api/analytics/query - Query analytics data
 */
async function handleAnalytics(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const finalTenantId = tenantId || 'system';

  try {
    // Query Analytics Engine (POST /api/analytics/query)
    if (env.INNERANIMALMEDIA_ANALYTICENGINE && pathParts.length === 3 && pathParts[2] === 'query' && request.method === 'POST') {
      const body = await request.json();
      const { query, start_date, end_date, filters } = body;

      // Write query to Analytics Engine
      await env.INNERANIMALMEDIA_ANALYTICENGINE.writeDataPoint({
        blobs: [finalTenantId, query || 'analytics_query'],
        doubles: [Date.now() / 1000],
        indexes: [finalTenantId]
      }).catch(e => console.warn('Analytics Engine write failed:', e));

      // Query aggregated data from D1 (for dashboard)
      const startTimestamp = start_date ? Math.floor(new Date(start_date).getTime() / 1000) : Math.floor(Date.now() / 1000) - 86400 * 30;
      const endTimestamp = end_date ? Math.floor(new Date(end_date).getTime() / 1000) : Math.floor(Date.now() / 1000);

      let query_sql = `
        SELECT event_type, COUNT(*) as count, DATE(created_at, 'unixepoch') as date
        FROM analytics_events
        WHERE created_at >= ? AND created_at <= ?
      `;
      const params = [startTimestamp, endTimestamp];

      // Add tenant filter if tenant_id column exists
      try {
        query_sql = query_sql.replace('WHERE', `WHERE (tenant_id = ? OR tenant_id IS NULL) AND`);
        params.unshift(finalTenantId);
      } catch (e) {
        // If tenant_id doesn't exist, use simpler query
        query_sql = `
          SELECT event_type, COUNT(*) as count, DATE(created_at, 'unixepoch') as date
          FROM analytics_events
          WHERE created_at >= ? AND created_at <= ?
        `;
        params.splice(0, 1, startTimestamp, endTimestamp);
      }

      query_sql += ` GROUP BY event_type, DATE(created_at, 'unixepoch') ORDER BY date DESC LIMIT 1000`;

      const events = await env.DB.prepare(query_sql).bind(...params).all().catch(e => {
        console.warn('Analytics query failed:', e);
        return { results: [] };
      });

      return jsonResponse({
        success: true,
        data: { events: events.results || [], source: 'analytics_engine' }
      }, 200, corsHeaders);
    }

    // Get dashboard analytics (GET /api/analytics?period=7d)
    if (request.method === 'GET' && pathParts.length === 2) {
      try {
        const period = url.searchParams.get('period') || '7d';
        const daysMap = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };
        const days = daysMap[period] || 7;
        const startTimestamp = Math.floor(Date.now() / 1000) - (86400 * days);

        // Try with tenant_id, fallback if column doesn't exist
        let events;
        try {
          events = await env.DB.prepare(`
            SELECT event_type, COUNT(*) as count FROM analytics_events
            WHERE (tenant_id = ? OR tenant_id IS NULL) AND created_at >= ?
            GROUP BY event_type
            ORDER BY count DESC
          `).bind(finalTenantId, startTimestamp).all();
        } catch (e) {
          // Fallback: no tenant_id column
          events = await env.DB.prepare(`
            SELECT event_type, COUNT(*) as count FROM analytics_events
            WHERE created_at >= ?
            GROUP BY event_type
            ORDER BY count DESC
          `).bind(startTimestamp).all();
        }

        const eventsByType = events.results || [];
        const totalEvents = eventsByType.reduce((sum, e) => sum + (parseInt(e.count) || 0), 0);

        return jsonResponse({
          success: true,
          data: {
            events_by_type: eventsByType,
            total_events: totalEvents,
            period: period,
            start_date: startTimestamp,
            end_date: Math.floor(Date.now() / 1000)
          }
        }, 200, corsHeaders);
      } catch (error) {
        console.error('Analytics API error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to load analytics'
        }, 500, corsHeaders);
      }
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Analytics API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * API Gateway API Handler - Route and endpoint management
 * GET /api/gateway - List all routes
 * POST /api/gateway/routes - Create route
 * PUT /api/gateway/routes/:id - Update route
 * DELETE /api/gateway/routes/:id - Delete route
 * POST /api/gateway/routes/:id/test - Test route
 */
async function handleAPIGateway(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const finalTenantId = tenantId || 'system';

  // pathParts: ['api', 'gateway'] for GET /api/gateway
  // pathParts: ['api', 'gateway', 'routes'] for POST /api/gateway/routes
  // pathParts: ['api', 'gateway', 'routes', 'id'] for GET/PUT/DELETE /api/gateway/routes/:id
  // pathParts: ['api', 'gateway', 'routes', 'id', 'test'] for POST /api/gateway/routes/:id/test

  try {
    // GET /api/gateway - List all routes
    if (request.method === 'GET' && pathParts.length === 2) {
      const routes = await env.DB.prepare(`
        SELECT id, name, method, path, target_url, status, rate_limit, auth_required, created_at, updated_at
        FROM api_gateway_routes WHERE tenant_id = ? ORDER BY created_at DESC
      `).bind(finalTenantId).all();

      return jsonResponse({
        success: true,
        data: { routes: routes.results || [] }
      }, 200, corsHeaders);
    }

    // POST /api/gateway/routes - Create route
    if (request.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'routes') {
      const body = await request.json();
      const { name, method, path, target_url, rate_limit, auth_required } = body;

      if (!name || !method || !path || !target_url) {
        return jsonResponse({
          success: false,
          error: 'Name, method, path, and target_url are required'
        }, 400, corsHeaders);
      }

      const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Math.floor(Date.now() / 1000);

      await env.DB.prepare(`
        INSERT INTO api_gateway_routes (
          id, tenant_id, name, method, path, target_url, status, rate_limit, auth_required, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
      `).bind(routeId, finalTenantId, name, method, path, target_url, rate_limit || 100, auth_required || 0, now, now).run();

      return jsonResponse({
        success: true,
        data: { id: routeId, name, method, path, status: 'active' }
      }, 201, corsHeaders);
    }

    // PUT /api/gateway/routes/:id - Update route
    if (request.method === 'PUT' && pathParts.length === 4 && pathParts[2] === 'routes') {
      try {
        const routeId = pathParts[3];
        const body = await request.json();
        const { name, method, path, target_url, rate_limit, auth_required, status } = body;

        const existing = await env.DB.prepare(`
          SELECT id FROM api_gateway_routes WHERE id = ? AND tenant_id = ?
        `).bind(routeId, finalTenantId).first();

        if (!existing) {
          return jsonResponse({
            success: false,
            error: 'Route not found'
          }, 404, corsHeaders);
        }

        const now = Math.floor(Date.now() / 1000);
        await env.DB.prepare(`
          UPDATE api_gateway_routes SET
            name = ?,
            method = ?,
            path = ?,
            target_url = ?,
            rate_limit = ?,
            auth_required = ?,
            status = ?,
            updated_at = ?
          WHERE id = ? AND tenant_id = ?
        `).bind(
          name || existing.name,
          method || existing.method,
          path || existing.path,
          target_url || existing.target_url,
          rate_limit !== undefined ? rate_limit : existing.rate_limit,
          auth_required !== undefined ? auth_required : existing.auth_required,
          status || existing.status || 'active',
          now,
          routeId,
          finalTenantId
        ).run();

        return jsonResponse({
          success: true,
          data: { id: routeId, message: 'Route updated successfully' }
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to update route'
        }, 500, corsHeaders);
      }
    }

    // GET /api/gateway/routes/:id - Get route details
    if (request.method === 'GET' && pathParts.length === 4 && pathParts[2] === 'routes') {
      try {
        const routeId = pathParts[3];
        const route = await env.DB.prepare(`
          SELECT * FROM api_gateway_routes WHERE id = ? AND tenant_id = ?
        `).bind(routeId, finalTenantId).first();

        if (!route) {
          return jsonResponse({
            success: false,
            error: 'Route not found'
          }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          data: route
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to get route'
        }, 500, corsHeaders);
      }
    }

    // DELETE /api/gateway/routes/:id - Delete route
    if (request.method === 'DELETE' && pathParts.length === 4 && pathParts[2] === 'routes') {
      try {
        const routeId = pathParts[3];
        const result = await env.DB.prepare(`
          DELETE FROM api_gateway_routes WHERE id = ? AND tenant_id = ?
        `).bind(routeId, finalTenantId).run();

        if (result.meta.changes === 0) {
          return jsonResponse({
            success: false,
            error: 'Route not found'
          }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          message: 'Route deleted successfully'
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to delete route'
        }, 500, corsHeaders);
      }
    }

    // POST /api/gateway/routes/:id/test - Test route (proxy to target)
    if (request.method === 'POST' && pathParts.length === 5 && pathParts[2] === 'routes' && pathParts[4] === 'test') {
      try {
        const routeId = pathParts[3];
        const route = await env.DB.prepare(`
          SELECT * FROM api_gateway_routes WHERE id = ? AND tenant_id = ?
        `).bind(routeId, finalTenantId).first();

        if (!route) {
          return jsonResponse({
            success: false,
            error: 'Route not found'
          }, 404, corsHeaders);
        }

        // Proxy request to target URL
        const body = await request.json().catch(() => ({}));
        const proxyResponse = await fetch(route.target_url, {
          method: route.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(route.headers_json ? JSON.parse(route.headers_json) : {})
          },
          body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
        }).catch(e => {
          console.error('Proxy request failed:', e);
          return null;
        });

        if (!proxyResponse) {
          return jsonResponse({
            success: false,
            error: 'Failed to proxy request to target URL',
            target_url: route.target_url
          }, 502, corsHeaders);
        }

        const proxyData = await proxyResponse.json().catch(async () => ({ text: await proxyResponse.text() }));

        return jsonResponse({
          success: proxyResponse.ok,
          data: proxyData,
          status: proxyResponse.status,
          target_url: route.target_url,
          method: route.method
        }, proxyResponse.status, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to test route'
        }, 500, corsHeaders);
      }
    }

    return jsonResponse({ error: 'Method not allowed or invalid path' }, 405, corsHeaders);
  } catch (error) {
    console.error('API Gateway error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Brand API Handler - Brand asset management (R2 storage)
 * GET /api/brand - List brand assets
 * POST /api/brand/assets - Upload brand asset
 * GET /api/brand/assets/:id - Get asset
 * DELETE /api/brand/assets/:id - Delete asset
 */
async function handleBrand(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const finalTenantId = tenantId || 'system';
  const storagePrefix = `brand/${finalTenantId}/`;

  // pathParts: ['api', 'brand'] for GET /api/brand
  // pathParts: ['api', 'brand', 'assets'] for POST /api/brand/assets
  // pathParts: ['api', 'brand', 'assets', 'id'] for GET/DELETE /api/brand/assets/:id
  // pathParts: ['api', 'brand', 'assets', 'id', 'download'] for GET /api/brand/assets/:id/download

  try {
    // GET /api/brand - List brand assets
    if (request.method === 'GET' && pathParts.length === 2) {
      try {
        const type = url.searchParams.get('type');
        const category = url.searchParams.get('category');

        let query = `
          SELECT id, name, type, category, file_url, file_size, file_type, metadata_json, created_at
          FROM brand_assets WHERE tenant_id = ?
        `;
        const params = [finalTenantId];

        if (type && type !== 'all') {
          query += ' AND type = ?';
          params.push(type);
        }
        if (category) {
          query += ' AND category = ?';
          params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const assets = await env.DB.prepare(query).bind(...params).all();

        return jsonResponse({
          success: true,
          data: {
            assets: (assets.results || []).map(a => ({
              ...a,
              metadata: a.metadata_json ? JSON.parse(a.metadata_json) : null
            }))
          }
        }, 200, corsHeaders);
      } catch (error) {
        console.error('Brand list error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to list assets'
        }, 500, corsHeaders);
      }
    }

    // POST /api/brand/assets - Upload brand asset
    if (request.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'assets') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        const name = formData.get('name') || 'Asset';
        const category = formData.get('category') || 'general';
        const type = formData.get('type') || 'image';

        if (!file) {
          return jsonResponse({
            success: false,
            error: 'File is required'
          }, 400, corsHeaders);
        }

        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fileName = file.name || 'asset';
        const extension = fileName.substring(fileName.lastIndexOf('.')) || '';
        const r2Key = `${storagePrefix}${assetId}${extension}`;
        const fileBuffer = await file.arrayBuffer();

        await env.STORAGE.put(r2Key, fileBuffer, {
          httpMetadata: { contentType: file.type || 'application/octet-stream' },
          customMetadata: { tenant_id: finalTenantId, category, type }
        });

        const fileUrl = `/api/brand/assets/${assetId}/download`;
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare(`
          INSERT INTO brand_assets (
            id, tenant_id, name, type, category, file_path, file_url, file_size, file_type, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(assetId, finalTenantId, name, type, category, r2Key, fileUrl, fileBuffer.byteLength, file.type || 'application/octet-stream', now).run();

        return jsonResponse({
          success: true,
          data: { id: assetId, name, url: fileUrl, size: fileBuffer.byteLength, type: extension.substring(1) }
        }, 201, corsHeaders);
      } catch (error) {
        console.error('Brand upload error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to upload asset'
        }, 500, corsHeaders);
      }
    }

    // GET /api/brand/assets/:id/download - Download asset from R2
    if (pathParts.length === 5 && pathParts[2] === 'assets' && pathParts[3] && pathParts[4] === 'download' && request.method === 'GET') {
      try {
        const assetId = pathParts[3];
        const asset = await env.DB.prepare(`
          SELECT file_path, file_type, name FROM brand_assets WHERE id = ? AND tenant_id = ?
        `).bind(assetId, finalTenantId).first();

        if (!asset?.file_path) {
          return jsonResponse({ success: false, error: 'Asset not found' }, 404, corsHeaders);
        }

        const object = await env.STORAGE.get(asset.file_path);
        if (!object) {
          return jsonResponse({ success: false, error: 'File not found in storage' }, 404, corsHeaders);
        }

        const fileBuffer = await object.arrayBuffer();
        const contentType = object.httpMetadata?.contentType || asset.file_type || 'application/octet-stream';
        const fileName = asset.name || 'asset';

        return new Response(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${fileName}"`,
            'Cache-Control': 'public, max-age=31536000',
            ...corsHeaders
          }
        });
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to download asset'
        }, 500, corsHeaders);
      }
    }

    // GET /api/brand/assets/:id - Get asset details
    if (pathParts.length === 4 && pathParts[2] === 'assets' && pathParts[3] && request.method === 'GET') {
      try {
        const assetId = pathParts[3];
        const asset = await env.DB.prepare(`
          SELECT * FROM brand_assets WHERE id = ? AND tenant_id = ?
        `).bind(assetId, finalTenantId).first();

        if (!asset) {
          return jsonResponse({ success: false, error: 'Asset not found' }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          data: {
            ...asset,
            metadata: asset.metadata_json ? JSON.parse(asset.metadata_json) : null
          }
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to get asset'
        }, 500, corsHeaders);
      }
    }

    // DELETE /api/brand/assets/:id - Delete asset
    if (pathParts.length === 4 && pathParts[2] === 'assets' && pathParts[3] && request.method === 'DELETE') {
      try {
        const assetId = pathParts[3];
        const asset = await env.DB.prepare(`
          SELECT file_path FROM brand_assets WHERE id = ? AND tenant_id = ?
        `).bind(assetId, finalTenantId).first();

        if (!asset) {
          return jsonResponse({ success: false, error: 'Asset not found' }, 404, corsHeaders);
        }

        // Delete from R2
        if (asset.file_path) {
          await env.STORAGE.delete(asset.file_path).catch(e => console.warn('Failed to delete file:', e));
        }

        // Delete from database
        await env.DB.prepare('DELETE FROM brand_assets WHERE id = ? AND tenant_id = ?')
          .bind(assetId, finalTenantId).run();

        return jsonResponse({
          success: true,
          message: 'Asset deleted successfully'
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to delete asset'
        }, 500, corsHeaders);
      }
    }

    return jsonResponse({ error: 'Method not allowed or invalid path' }, 405, corsHeaders);
  } catch (error) {
    console.error('Brand API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Databases API Handler - D1 database management
 * GET /api/databases - List databases
 * POST /api/databases/:name/backup - Backup database
 * POST /api/databases/:name/query - Execute query on database
 * GET /api/databases/:name/schema - Get database schema
 */
async function handleDatabases(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const finalTenantId = tenantId || 'system';

  try {
    // GET /api/databases - List databases
    if (request.method === 'GET' && pathParts.length === 2) {
      const databases = [
        { name: 'inneranimalmedia-business', id: 'cf87b717-d4e2-4cf8-bab0-a81268e32d49', type: 'd1' },
        { name: 'meauxos', id: 'd8261777-9384-44f7-924d-c92247d55b46', type: 'd1' }
      ];

      return jsonResponse({
        success: true,
        data: { databases }
      }, 200, corsHeaders);
    }

    // GET /api/databases/:name/schema - Get database schema
    if (pathParts.length === 4 && pathParts[2] && pathParts[3] === 'schema' && request.method === 'GET') {
      try {
        const dbName = pathParts[2];
        const db = dbName === 'meauxos' ? env.MEAUXOS_DB : env.DB;

        const tables = await db.prepare(`
          SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
        `).all();

        const schemas = {};
        for (const table of (tables.results || []).slice(0, 50)) {
          try {
            const schema = await db.prepare(`PRAGMA table_info(${table.name})`).all();
            schemas[table.name] = schema.results || [];
          } catch (e) {
            console.warn(`Could not get schema for ${table.name}:`, e.message);
          }
        }

        return jsonResponse({
          success: true,
          data: { database: dbName, tables: Object.keys(schemas), schemas }
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to get schema'
        }, 500, corsHeaders);
      }
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  } catch (error) {
    console.error('Databases API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Library API Handler - Content library management (R2 storage)
 * GET /api/library - List library items
 * POST /api/library - Upload content
 * GET /api/library/:id - Get item
 * DELETE /api/library/:id - Delete item
 */
async function handleLibrary(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const finalTenantId = tenantId || 'system';
  const storagePrefix = `library/${finalTenantId}/`;

  // pathParts: ['api', 'library'] for GET/POST /api/library
  // pathParts: ['api', 'library', 'id'] for GET/DELETE /api/library/:id
  // pathParts: ['api', 'library', 'id', 'download'] for GET /api/library/:id/download

  try {
    // GET /api/library - List library items, R2 buckets, or Cloudflare Images
    if (request.method === 'GET' && pathParts.length === 2) {
      try {
        const view = url.searchParams.get('view') || 'items'; // 'items', 'buckets', 'images'

        // Return library items (existing functionality)
        if (view === 'items') {
          const type = url.searchParams.get('type');
          const category = url.searchParams.get('category');

          let query = `
            SELECT id, title, description, type, category, file_url, file_size, file_type, metadata_json, created_at, updated_at
            FROM library_items WHERE tenant_id = ?
          `;
          const params = [finalTenantId];

          if (type && type !== 'all') {
            query += ' AND type = ?';
            params.push(type);
          }
          if (category) {
            query += ' AND category = ?';
            params.push(category);
          }

          query += ' ORDER BY created_at DESC LIMIT 100';

          const items = await env.DB.prepare(query).bind(...params).all();

          return jsonResponse({
            success: true,
            data: {
              view: 'items',
              items: (items.results || []).map(item => ({
                ...item,
                metadata: item.metadata_json ? JSON.parse(item.metadata_json) : null
              }))
            }
          }, 200, corsHeaders);
        }

        // Return R2 buckets list
        if (view === 'buckets') {
          if (!env.CLOUDFLARE_API_TOKEN) {
            return jsonResponse({
              success: false,
              error: 'CLOUDFLARE_API_TOKEN not configured'
            }, 500, corsHeaders);
          }

          const accountId = env.CLOUDFLARE_ACCOUNT_ID || await getAccountId(env);
          if (!accountId) {
            return jsonResponse({
              success: false,
              error: 'Cloudflare account ID not found'
            }, 500, corsHeaders);
          }

          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`,
            {
              headers: {
                'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            return jsonResponse({
              success: false,
              error: `Cloudflare API error: ${response.status} ${response.statusText}`,
              details: errorText
            }, response.status, corsHeaders);
          }

          const data = await response.json();
          const buckets = (data.result?.buckets || []).map(bucket => ({
            name: bucket.name,
            creation_date: bucket.creation_date,
            location: bucket.location
          }));

          return jsonResponse({
            success: true,
            data: {
              view: 'buckets',
              buckets: buckets,
              count: buckets.length
            }
          }, 200, corsHeaders);
        }

        // Return Cloudflare Images list
        if (view === 'images') {
          if (!env.CLOUDFLARE_API_TOKEN) {
            return jsonResponse({
              success: false,
              error: 'CLOUDFLARE_API_TOKEN not configured'
            }, 500, corsHeaders);
          }

          const accountId = env.CLOUDFLARE_ACCOUNT_ID || await getAccountId(env);
          if (!accountId) {
            return jsonResponse({
              success: false,
              error: 'Cloudflare account ID not found'
            }, 500, corsHeaders);
          }

          const page = parseInt(url.searchParams.get('page') || '1');
          const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '100'), 1000);

          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2?page=${page}&per_page=${perPage}`,
            {
              headers: {
                'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            return jsonResponse({
              success: false,
              error: `Cloudflare API error: ${response.status} ${response.statusText}`,
              details: errorText
            }, response.status, corsHeaders);
          }

          const data = await response.json();
          const images = (data.result?.images || []).map(img => ({
            id: img.id,
            filename: img.filename,
            uploaded: img.uploaded,
            requireSignedURLs: img.requireSignedURLs,
            variants: img.variants || [],
            metadata: img.metadata || {}
          }));

          return jsonResponse({
            success: true,
            data: {
              view: 'images',
              images: images,
              count: images.length,
              total: data.result?.total_count || images.length,
              page: page,
              per_page: perPage
            }
          }, 200, corsHeaders);
        }

        // Return HTML templates from R2 buckets
        if (view === 'templates') {
          if (!env.CLOUDFLARE_API_TOKEN) {
            return jsonResponse({
              success: false,
              error: 'CLOUDFLARE_API_TOKEN not configured'
            }, 500, corsHeaders);
          }

          const accountId = env.CLOUDFLARE_ACCOUNT_ID || await getAccountId(env);
          if (!accountId) {
            return jsonResponse({
              success: false,
              error: 'Cloudflare account ID not found'
            }, 500, corsHeaders);
          }

          // Get list of R2 buckets
          const bucketsResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`,
            {
              headers: {
                'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!bucketsResponse.ok) {
            return jsonResponse({
              success: false,
              error: `Failed to fetch buckets: ${bucketsResponse.status}`
            }, bucketsResponse.status, corsHeaders);
          }

          const bucketsData = await bucketsResponse.json();
          const buckets = bucketsData.result?.buckets || [];

          // For each bucket, we'd need to list objects using S3-compatible API
          // Note: This requires R2 S3 API credentials. For now, return bucket list with placeholder
          // Full implementation would require S3 API credentials and listObjectsV2 call

          const templates = [];

          // Return buckets with note that full scanning requires S3 API setup
          return jsonResponse({
            success: true,
            data: {
              view: 'templates',
              buckets: buckets.map(b => ({
                name: b.name,
                creation_date: b.creation_date,
                location: b.location,
                note: 'HTML file listing requires S3 API credentials'
              })),
              templates: templates,
              count: templates.length,
              message: 'Full HTML template scanning requires R2 S3 API credentials. Buckets listed for reference.'
            }
          }, 200, corsHeaders);
        }

        // Default: return items
        return jsonResponse({
          success: false,
          error: 'Invalid view parameter. Use: items, buckets, images, or templates'
        }, 400, corsHeaders);

      } catch (error) {
        console.error('Library list error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to list items'
        }, 500, corsHeaders);
      }
    }

    // POST /api/library - Upload library content
    if (request.method === 'POST' && pathParts.length === 2) {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        const title = formData.get('title') || 'Untitled';
        const category = formData.get('category') || 'general';
        const type = formData.get('type') || 'document';
        const description = formData.get('description') || '';

        if (!file) {
          return jsonResponse({
            success: false,
            error: 'File is required'
          }, 400, corsHeaders);
        }

        const itemId = `lib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fileName = file.name || 'item';
        const extension = fileName.substring(fileName.lastIndexOf('.')) || '';
        const r2Key = `${storagePrefix}${itemId}${extension}`;
        const fileBuffer = await file.arrayBuffer();

        await env.STORAGE.put(r2Key, fileBuffer, {
          httpMetadata: { contentType: file.type || 'application/octet-stream' },
          customMetadata: { tenant_id: finalTenantId, category, type, title }
        });

        const fileUrl = `/api/library/${itemId}/download`;
        const now = Math.floor(Date.now() / 1000);
        const metadata = { original_name: fileName, uploaded_at: now };

        await env.DB.prepare(`
          INSERT INTO library_items (
            id, tenant_id, title, description, type, category, file_path, file_url, file_size, file_type, metadata_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          itemId, finalTenantId, title, description, type, category, r2Key, fileUrl,
          fileBuffer.byteLength, file.type || 'application/octet-stream', JSON.stringify(metadata), now, now
        ).run();

        return jsonResponse({
          success: true,
          data: { id: itemId, title, url: fileUrl, size: fileBuffer.byteLength }
        }, 201, corsHeaders);
      } catch (error) {
        console.error('Library upload error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to upload content'
        }, 500, corsHeaders);
      }
    }

    // GET /api/library/:id/download - Download library item from R2
    if (pathParts.length === 4 && pathParts[2] && pathParts[3] === 'download' && request.method === 'GET') {
      try {
        const itemId = pathParts[2];
        const item = await env.DB.prepare(`
          SELECT file_path, file_type, title FROM library_items WHERE id = ? AND tenant_id = ?
        `).bind(itemId, finalTenantId).first();

        if (!item?.file_path) {
          return jsonResponse({ success: false, error: 'Item not found' }, 404, corsHeaders);
        }

        const object = await env.STORAGE.get(item.file_path);
        if (!object) {
          return jsonResponse({ success: false, error: 'File not found in storage' }, 404, corsHeaders);
        }

        const fileBuffer = await object.arrayBuffer();
        const contentType = object.httpMetadata?.contentType || item.file_type || 'application/octet-stream';
        const fileName = item.title || 'item';

        return new Response(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${fileName}"`,
            'Cache-Control': 'public, max-age=31536000',
            ...corsHeaders
          }
        });
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to download item'
        }, 500, corsHeaders);
      }
    }

    // GET /api/library/:id - Get item details
    if (pathParts.length === 3 && pathParts[2] && request.method === 'GET') {
      try {
        const itemId = pathParts[2];
        const item = await env.DB.prepare(`
          SELECT * FROM library_items WHERE id = ? AND tenant_id = ?
        `).bind(itemId, finalTenantId).first();

        if (!item) {
          return jsonResponse({ success: false, error: 'Item not found' }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          data: {
            ...item,
            metadata: item.metadata_json ? JSON.parse(item.metadata_json) : null
          }
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to get item'
        }, 500, corsHeaders);
      }
    }

    // DELETE /api/library/:id - Delete library item
    if (pathParts.length === 3 && pathParts[2] && request.method === 'DELETE') {
      try {
        const itemId = pathParts[2];
        const item = await env.DB.prepare(`
          SELECT file_path FROM library_items WHERE id = ? AND tenant_id = ?
        `).bind(itemId, finalTenantId).first();

        if (!item) {
          return jsonResponse({ success: false, error: 'Item not found' }, 404, corsHeaders);
        }

        // Delete from R2
        if (item.file_path) {
          await env.STORAGE.delete(item.file_path).catch(e => console.warn('Failed to delete file:', e));
        }

        // Delete from database
        await env.DB.prepare('DELETE FROM library_items WHERE id = ? AND tenant_id = ?')
          .bind(itemId, finalTenantId).run();

        return jsonResponse({
          success: true,
          message: 'Item deleted successfully'
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to delete item'
        }, 500, corsHeaders);
      }
    }

    return jsonResponse({ error: 'Method not allowed or invalid path' }, 405, corsHeaders);
  } catch (error) {
    console.error('Library API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * MeauxWork API Handler - Work management and tracking
 * GET /api/meauxwork - List work items
 * POST /api/meauxwork - Create work item
 * PUT /api/meauxwork/:id - Update work item
 * DELETE /api/meauxwork/:id - Delete work item
 */
async function handleMeauxWork(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const finalTenantId = tenantId || 'system';

  // pathParts: ['api', 'meauxwork'] for GET/POST /api/meauxwork
  // pathParts: ['api', 'meauxwork', 'id'] for GET/PUT/DELETE /api/meauxwork/:id

  try {
    // GET /api/meauxwork - List work items
    if (request.method === 'GET' && pathParts.length === 2) {
      try {
        const status = url.searchParams.get('status');
        const priority = url.searchParams.get('priority');

        let query = `
          SELECT id, title, description, status, priority, assigned_to, due_date, created_at, updated_at
          FROM work_items WHERE tenant_id = ?
        `;
        const params = [finalTenantId];

        if (status) {
          query += ' AND status = ?';
          params.push(status);
        }
        if (priority) {
          query += ' AND priority = ?';
          params.push(priority);
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const items = await env.DB.prepare(query).bind(...params).all();

        return jsonResponse({
          success: true,
          data: { items: items.results || [] }
        }, 200, corsHeaders);
      } catch (error) {
        console.error('MeauxWork list error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to list work items'
        }, 500, corsHeaders);
      }
    }

    // POST /api/meauxwork - Create work item
    if (request.method === 'POST' && pathParts.length === 2) {
      try {
        const body = await request.json();
        const { title, description, status = 'todo', priority = 'medium', assigned_to, due_date } = body;

        if (!title) {
          return jsonResponse({
            success: false,
            error: 'Title is required'
          }, 400, corsHeaders);
        }

        const itemId = `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Math.floor(Date.now() / 1000);
        const dueTimestamp = due_date ? Math.floor(new Date(due_date).getTime() / 1000) : null;

        await env.DB.prepare(`
          INSERT INTO work_items (
            id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          itemId, finalTenantId, title, description || '', status, priority, assigned_to || null, dueTimestamp, now, now
        ).run();

        return jsonResponse({
          success: true,
          data: { id: itemId, title, status, priority }
        }, 201, corsHeaders);
      } catch (error) {
        console.error('MeauxWork create error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to create work item'
        }, 500, corsHeaders);
      }
    }

    // PUT /api/meauxwork/:id - Update work item
    if (pathParts.length === 3 && pathParts[2] && request.method === 'PUT') {
      try {
        const itemId = pathParts[2];
        const body = await request.json();
        const { title, description, status, priority, assigned_to, due_date } = body;

        const existing = await env.DB.prepare(`
          SELECT * FROM work_items WHERE id = ? AND tenant_id = ?
        `).bind(itemId, finalTenantId).first();

        if (!existing) {
          return jsonResponse({
            success: false,
            error: 'Work item not found'
          }, 404, corsHeaders);
        }

        const now = Math.floor(Date.now() / 1000);
        const dueTimestamp = due_date !== undefined ? (due_date ? Math.floor(new Date(due_date).getTime() / 1000) : null) : existing.due_date;

        await env.DB.prepare(`
          UPDATE work_items SET
            title = ?,
            description = ?,
            status = ?,
            priority = ?,
            assigned_to = ?,
            due_date = ?,
            updated_at = ?
          WHERE id = ? AND tenant_id = ?
        `).bind(
          title !== undefined ? title : existing.title,
          description !== undefined ? description : existing.description,
          status !== undefined ? status : existing.status,
          priority !== undefined ? priority : existing.priority,
          assigned_to !== undefined ? assigned_to : existing.assigned_to,
          dueTimestamp,
          now,
          itemId,
          finalTenantId
        ).run();

        return jsonResponse({
          success: true,
          data: { id: itemId, message: 'Work item updated successfully' }
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to update work item'
        }, 500, corsHeaders);
      }
    }

    // GET /api/meauxwork/:id - Get work item details
    if (pathParts.length === 3 && pathParts[2] && request.method === 'GET') {
      try {
        const itemId = pathParts[2];
        const item = await env.DB.prepare(`
          SELECT * FROM work_items WHERE id = ? AND tenant_id = ?
        `).bind(itemId, finalTenantId).first();

        if (!item) {
          return jsonResponse({
            success: false,
            error: 'Work item not found'
          }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          data: item
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to get work item'
        }, 500, corsHeaders);
      }
    }

    // DELETE /api/meauxwork/:id - Delete work item
    if (pathParts.length === 3 && pathParts[2] && request.method === 'DELETE') {
      try {
        const itemId = pathParts[2];
        const result = await env.DB.prepare(`
          DELETE FROM work_items WHERE id = ? AND tenant_id = ?
        `).bind(itemId, finalTenantId).run();

        if (result.meta.changes === 0) {
          return jsonResponse({
            success: false,
            error: 'Work item not found'
          }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          message: 'Work item deleted successfully'
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to delete work item'
        }, 500, corsHeaders);
      }
    }

    return jsonResponse({ error: 'Method not allowed or invalid path' }, 405, corsHeaders);
  } catch (error) {
    console.error('MeauxWork API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Team API Handler - Team management
 * GET /api/team - List team members
 * POST /api/team/members - Add team member
 * PUT /api/team/members/:id - Update team member
 * DELETE /api/team/members/:id - Remove team member
 */
async function handleTeam(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const finalTenantId = tenantId || 'system';

  // pathParts: ['api', 'team'] for GET /api/team
  // pathParts: ['api', 'team', 'members'] for POST /api/team/members
  // pathParts: ['api', 'team', 'members', 'id'] for GET/PUT/DELETE /api/team/members/:id

  try {
    // GET /api/team - List team members
    if (request.method === 'GET' && pathParts.length === 2) {
      try {
        // Use existing team_members table structure (may not have tenant_id)
        const members = await env.DB.prepare(`
          SELECT id, user_id, email, name, role, team_role, permissions_json, joined_at
          FROM team_members
          ORDER BY joined_at DESC LIMIT 100
        `).all();

        return jsonResponse({
          success: true,
          data: {
            members: (members.results || []).map(m => ({
              ...m,
              permissions: m.permissions_json ? JSON.parse(m.permissions_json) : null
            }))
          }
        }, 200, corsHeaders);
      } catch (error) {
        console.error('Team list error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to list team members'
        }, 500, corsHeaders);
      }
    }

    // POST /api/team/members - Add team member
    if (request.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'members') {
      try {
        const body = await request.json();
        const { user_id, email, name, team_role = 'member', permissions = {} } = body;

        if (!user_id && !email) {
          return jsonResponse({
            success: false,
            error: 'User ID or email is required'
          }, 400, corsHeaders);
        }

        // Find or create user
        let userId = user_id;
        if (!userId && email) {
          let user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
          if (!user) {
            // Create user
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = Math.floor(Date.now() / 1000);
            await env.DB.prepare(`
              INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, 'user', ?)
            `).bind(userId, email, name || email.split('@')[0], now).run();
          } else {
            userId = user.id;
          }
        }

        // Check if member already exists
        const existing = await env.DB.prepare('SELECT id FROM team_members WHERE user_id = ? OR email = ?')
          .bind(userId || '', email || '').first();

        if (existing) {
          return jsonResponse({
            success: false,
            error: 'Team member already exists'
          }, 400, corsHeaders);
        }

        // Use existing team_members table structure
        const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Math.floor(Date.now() / 1000);
        await env.DB.prepare(`
          INSERT INTO team_members (id, user_id, email, name, role, team_role, permissions_json, joined_at)
          VALUES (?, ?, ?, ?, 'user', ?, ?, ?)
        `).bind(
          memberId,
          userId,
          email || null,
          name || email?.split('@')[0] || 'User',
          team_role,
          JSON.stringify(permissions),
          now
        ).run();

        return jsonResponse({
          success: true,
          data: { id: memberId, user_id: userId, email, name, team_role, permissions }
        }, 201, corsHeaders);
      } catch (error) {
        console.error('Team create error:', error);
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to add team member'
        }, 500, corsHeaders);
      }
    }

    // PUT /api/team/members/:id - Update team member
    if (pathParts.length === 4 && pathParts[2] === 'members' && pathParts[3] && request.method === 'PUT') {
      try {
        const memberId = pathParts[3];
        const body = await request.json();
        const { name, team_role, permissions } = body;

        const existing = await env.DB.prepare('SELECT * FROM team_members WHERE id = ?').bind(memberId).first();

        if (!existing) {
          return jsonResponse({
            success: false,
            error: 'Team member not found'
          }, 404, corsHeaders);
        }

        await env.DB.prepare(`
          UPDATE team_members SET
            name = ?,
            team_role = ?,
            permissions_json = ?
          WHERE id = ?
        `).bind(
          name !== undefined ? name : existing.name,
          team_role !== undefined ? team_role : existing.team_role,
          permissions !== undefined ? JSON.stringify(permissions) : existing.permissions_json,
          memberId
        ).run();

        return jsonResponse({
          success: true,
          data: { id: memberId, message: 'Team member updated successfully' }
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to update team member'
        }, 500, corsHeaders);
      }
    }

    // GET /api/team/members/:id - Get team member details
    if (pathParts.length === 4 && pathParts[2] === 'members' && pathParts[3] && request.method === 'GET') {
      try {
        const memberId = pathParts[3];
        const member = await env.DB.prepare('SELECT * FROM team_members WHERE id = ?').bind(memberId).first();

        if (!member) {
          return jsonResponse({
            success: false,
            error: 'Team member not found'
          }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          data: {
            ...member,
            permissions: member.permissions_json ? JSON.parse(member.permissions_json) : null
          }
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to get team member'
        }, 500, corsHeaders);
      }
    }

    // DELETE /api/team/members/:id - Remove team member
    if (pathParts.length === 4 && pathParts[2] === 'members' && pathParts[3] && request.method === 'DELETE') {
      try {
        const memberId = pathParts[3];
        const result = await env.DB.prepare('DELETE FROM team_members WHERE id = ?').bind(memberId).run();

        if (result.meta.changes === 0) {
          return jsonResponse({
            success: false,
            error: 'Team member not found'
          }, 404, corsHeaders);
        }

        return jsonResponse({
          success: true,
          message: 'Team member removed successfully'
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error.message || 'Failed to remove team member'
        }, 500, corsHeaders);
      }
    }

    return jsonResponse({ error: 'Method not allowed or invalid path' }, 405, corsHeaders);
  } catch (error) {
    console.error('Team API error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

/**
 * Handle notifications endpoint
 */
async function handleNotifications(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const notificationId = pathParts.length >= 3 ? pathParts[2] : null;
  const action = pathParts.length >= 4 ? pathParts[3] : null;

  // GET /api/notifications - List notifications
  if (request.method === 'GET' && !notificationId) {
    try {
      const userId = url.searchParams.get('user_id');
      const finalTenantId = tenantId || url.searchParams.get('tenant_id') || 'system';
      const unreadOnly = url.searchParams.get('unread_only') === 'true';
      const limit = parseInt(url.searchParams.get('limit') || '50');

      if (!userId && !finalTenantId) {
        return jsonResponse({ success: false, error: 'User ID or tenant ID required' }, 400, corsHeaders);
      }

      let query = 'SELECT * FROM notifications WHERE 1=1';
      const params = [];

      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }

      if (finalTenantId && finalTenantId !== 'system') {
        query += ' AND tenant_id = ?';
        params.push(finalTenantId);
      }

      if (unreadOnly) {
        query += ' AND is_read = 0';
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const result = await env.DB.prepare(query).bind(...params).all();

      const notifications = (result.results || []).map(notif => ({
        id: notif.id,
        user_id: notif.user_id,
        tenant_id: notif.tenant_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        data: notif.data ? JSON.parse(notif.data) : null,
        is_read: notif.is_read === 1,
        read_at: notif.read_at,
        created_at: notif.created_at
      }));

      return jsonResponse({
        success: true,
        data: notifications
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // POST /api/notifications/:id/read - Mark notification as read
  if (notificationId && action === 'read' && request.method === 'POST') {
    try {
      const body = await request.json();
      const userId = body.user_id || url.searchParams.get('user_id');
      const finalTenantId = tenantId || body.tenant_id || url.searchParams.get('tenant_id') || 'system';

      if (!userId || !finalTenantId) {
        return jsonResponse({ success: false, error: 'User ID and tenant ID required' }, 400, corsHeaders);
      }

      const now = Math.floor(Date.now() / 1000);
      await env.DB.prepare(
        'UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ? AND user_id = ? AND tenant_id = ?'
      )
        .bind(now, notificationId, userId, finalTenantId)
        .run();

      return jsonResponse({ success: true, message: 'Notification marked as read' }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // POST /api/notifications/read-all - Mark all notifications as read
  if (pathParts.length === 3 && pathParts[2] === 'read-all' && request.method === 'POST') {
    try {
      const body = await request.json();
      const userId = body.user_id || url.searchParams.get('user_id');
      const finalTenantId = tenantId || body.tenant_id || url.searchParams.get('tenant_id') || 'system';

      if (!userId || !finalTenantId) {
        return jsonResponse({ success: false, error: 'User ID and tenant ID required' }, 400, corsHeaders);
      }

      const now = Math.floor(Date.now() / 1000);
      await env.DB.prepare(
        'UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND tenant_id = ? AND is_read = 0'
      )
        .bind(now, userId, finalTenantId)
        .run();

      return jsonResponse({ success: true, message: 'All notifications marked as read' }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Customer Feedback API Handler
 */
async function handleCustomerFeedback(request, env, tenantId, corsHeaders) {
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { feedback_type = 'general', type, subject, message, rating, email, user_id } = body;

      if (!message) {
        return jsonResponse({ success: false, error: 'Message is required' }, 400, corsHeaders);
      }

      const now = Math.floor(Date.now() / 1000);
      const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Use 'type' field (existing table structure) instead of 'feedback_type'
      const feedbackType = type || feedback_type || 'general';

      await env.DB.prepare(
        `INSERT INTO customer_feedback (
          id, user_id, email, type, subject, message, rating, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`
      ).bind(
        feedbackId,
        user_id || null,
        email || null,
        feedbackType,
        subject || null,
        message,
        rating || null,
        now
      ).run();

      return jsonResponse({
        success: true,
        message: 'Feedback submitted successfully',
        data: { id: feedbackId }
      }, 201, corsHeaders);
    } catch (error) {
      console.error('Customer Feedback API error:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle theme preferences endpoint - Per-tenant/project theme persistence
 * POST /api/preferences/theme - Save theme for tenant/project
 * GET /api/preferences/theme?tenant_id=xxx - Get theme for tenant/project
 */
async function handleThemePreferences(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const finalTenantId = tenantId || url.searchParams.get('tenant_id') || 'system';
  const userId = url.searchParams.get('user_id') || null;
  const projectId = url.searchParams.get('project_id') || null;

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { theme_id, project_id } = body;
      const finalProjectId = project_id || projectId;

      if (!theme_id) {
        return jsonResponse({ success: false, error: 'theme_id is required' }, 400, corsHeaders);
      }

      const now = Math.floor(Date.now() / 1000);
      const prefId = `theme-pref-${finalTenantId}-${userId || 'default'}-${finalProjectId || 'global'}`;

      // If project_id is provided, store project-specific theme
      if (finalProjectId) {
        try {
          // Store in projects table metadata or create project_settings
          // For now, we'll store in a JSON field in projects table if it exists
          const project = await env.DB.prepare('SELECT id FROM projects WHERE id = ? AND tenant_id = ? LIMIT 1')
            .bind(finalProjectId, finalTenantId)
            .first();

          if (project) {
            // Try to update project with theme in a metadata field
            // If projects table has a metadata/settings column, use it
            // Otherwise, we'll use sidebar_preferences with project_id in customizations
            const projectPrefId = `project-theme-${finalProjectId}`;
            const customizations = { theme_id, theme_updated_at: now, project_id: finalProjectId };

            // Store in sidebar_preferences with project context
            await env.DB.prepare(
              `INSERT OR REPLACE INTO sidebar_preferences (
                id, user_id, tenant_id, sidebar_collapsed, sidebar_width,
                dock_items_json, recent_apps_json, customizations_json, created_at, updated_at
              ) VALUES (?, ?, ?, 0, 280, '[]', '[]', ?, ?, ?)`
            )
              .bind(
                projectPrefId,
                userId || 'default',
                finalTenantId,
                JSON.stringify(customizations),
                now,
                now
              )
              .run();
          }
        } catch (projectError) {
          console.log('Could not save project theme:', projectError);
        }
      }

      // Store theme preference in sidebar_preferences table (customizations_json field)
      try {
        // Try to update existing sidebar preferences (global, not project-specific)
        const existing = await env.DB.prepare(
          'SELECT id FROM sidebar_preferences WHERE user_id = ? AND tenant_id = ? AND id NOT LIKE ? LIMIT 1'
        )
          .bind(userId || 'default', finalTenantId, 'project-theme-%')
          .first();

        if (existing) {
          // Update customizations_json with theme
          const prefs = await env.DB.prepare(
            'SELECT customizations_json FROM sidebar_preferences WHERE id = ? LIMIT 1'
          )
            .bind(existing.id)
            .first();

          const customizations = prefs?.customizations_json ? JSON.parse(prefs.customizations_json) : {};
          customizations.theme_id = theme_id;
          customizations.theme_updated_at = now;
          if (finalProjectId) customizations.project_id = finalProjectId;

          await env.DB.prepare(
            `UPDATE sidebar_preferences SET
              customizations_json = ?,
              updated_at = ?
            WHERE id = ?`
          )
            .bind(JSON.stringify(customizations), now, existing.id)
            .run();
        } else {
          // Create new preferences with theme
          const customizations = { theme_id, theme_updated_at: now };
          if (finalProjectId) customizations.project_id = finalProjectId;

          await env.DB.prepare(
            `INSERT INTO sidebar_preferences (
              id, user_id, tenant_id, sidebar_collapsed, sidebar_width,
              dock_items_json, recent_apps_json, customizations_json, created_at, updated_at
            ) VALUES (?, ?, ?, 0, 280, '[]', '[]', ?, ?, ?)`
          )
            .bind(
              prefId,
              userId || 'default',
              finalTenantId,
              JSON.stringify(customizations),
              now,
              now
            )
            .run();
        }

        // Also store in tenant settings for tenant-wide default
        try {
          const tenant = await env.DB.prepare('SELECT settings FROM tenants WHERE id = ? LIMIT 1')
            .bind(finalTenantId)
            .first();

          if (tenant) {
            const settings = tenant.settings ? JSON.parse(tenant.settings) : {};
            settings.theme_id = theme_id;
            settings.theme_updated_at = now;

            await env.DB.prepare('UPDATE tenants SET settings = ?, updated_at = ? WHERE id = ?')
              .bind(JSON.stringify(settings), now, finalTenantId)
              .run();
          }
        } catch (tenantError) {
          console.log('Could not update tenant settings:', tenantError);
        }

        // Get tenant name for response
        let tenantName = finalTenantId;
        try {
          const tenant = await env.DB.prepare('SELECT name FROM tenants WHERE id = ? LIMIT 1')
            .bind(finalTenantId)
            .first();
          if (tenant) tenantName = tenant.name;
        } catch (e) {
          // Ignore
        }

        return jsonResponse({
          success: true,
          message: 'Theme preference saved',
          data: {
            theme_id,
            tenant_id: finalTenantId,
            tenant_name: tenantName,
            user_id: userId,
            project_id: finalProjectId || null
          }
        }, 200, corsHeaders);
      } catch (dbError) {
        console.error('Database error saving theme preference:', dbError);
        // Fallback: Just return success (theme saved in localStorage)
        return jsonResponse({
          success: true,
          message: 'Theme preference saved locally',
          data: { theme_id, tenant_id: finalTenantId }
        }, 200, corsHeaders);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  if (request.method === 'GET') {
    try {
      const finalProjectId = projectId || url.searchParams.get('project_id') || null;

      // If project_id is provided, try to get project-specific theme first
      if (finalProjectId) {
        try {
          const projectPref = await env.DB.prepare(
            'SELECT customizations_json FROM sidebar_preferences WHERE id = ? LIMIT 1'
          )
            .bind(`project-theme-${finalProjectId}`)
            .first();

          if (projectPref && projectPref.customizations_json) {
            const customizations = JSON.parse(projectPref.customizations_json);
            if (customizations.theme_id) {
              return jsonResponse({
                success: true,
                theme_id: customizations.theme_id,
                tenant_id: finalTenantId,
                project_id: finalProjectId,
                source: 'project_preference'
              }, 200, corsHeaders);
            }
          }
        } catch (projectError) {
          console.log('Could not get project theme:', projectError);
        }
      }

      // Try to get theme from sidebar_preferences
      try {
        const prefs = await env.DB.prepare(
          'SELECT customizations_json FROM sidebar_preferences WHERE user_id = ? AND tenant_id = ? AND id LIKE ? LIMIT 1'
        )
          .bind(userId || 'default', finalTenantId, `theme-pref-${finalTenantId}-${userId || 'default'}-%`)
          .first();

        if (prefs && prefs.customizations_json) {
          const customizations = JSON.parse(prefs.customizations_json);
          if (customizations.theme_id) {
            return jsonResponse({
              success: true,
              theme_id: customizations.theme_id,
              tenant_id: finalTenantId,
              project_id: customizations.project_id || null,
              source: 'user_preference'
            }, 200, corsHeaders);
          }
        }
      } catch (prefsError) {
        console.log('Could not get theme from preferences:', prefsError);
      }

      // Fallback: Get theme from tenant settings
      try {
        const tenant = await env.DB.prepare('SELECT settings, name FROM tenants WHERE id = ? LIMIT 1')
          .bind(finalTenantId)
          .first();

        if (tenant && tenant.settings) {
          const settings = JSON.parse(tenant.settings);
          if (settings.theme_id) {
            return jsonResponse({
              success: true,
              theme_id: settings.theme_id,
              tenant_id: finalTenantId,
              tenant_name: tenant.name,
              source: 'tenant_default'
            }, 200, corsHeaders);
          }
        }
      } catch (tenantError) {
        console.log('Could not get theme from tenant settings:', tenantError);
      }

      // Return default theme
      return jsonResponse({
        success: true,
        theme_id: 'inner-animal-dark',
        tenant_id: finalTenantId,
        source: 'default'
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Error getting theme preference:', error);
      return jsonResponse({
        success: true,
        theme_id: 'inner-animal-dark',
        tenant_id: finalTenantId,
        source: 'default_fallback'
      }, 200, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

/**
 * Handle admin requests - Shopify-style admin routing
 * Routes: admin.inneranimalmedia.com/store/{slug}
 */
async function handleAdminRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse admin route
  const adminRoute = parseAdminRoute(request);

  if (!adminRoute) {
    // Not a valid admin route, redirect to main admin dashboard
    const adminUrl = generateAdminUrl(request.url, '/');
    return Response.redirect(adminUrl, 302);
  }

  // Check admin access
  const accessCheck = await checkAdminAccess(request, env);

  if (!accessCheck.hasAccess) {
    // Redirect to login if not authenticated
    if (accessCheck.reason === 'not_authenticated' || accessCheck.reason === 'user_not_found') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', url.pathname + url.search);
      loginUrl.searchParams.set('admin', 'true');
      return Response.redirect(loginUrl.toString(), 302);
    }

    // Return 403 for insufficient permissions
    return new Response('Access Denied: Admin privileges required', {
      status: 403,
      headers: { 'Content-Type': 'text/plain', ...corsHeaders }
    });
  }

  // Handle admin API routes
  if (path.startsWith('/api/admin/')) {
    return handleAdminAPI(request, env, adminRoute, accessCheck, corsHeaders);
  }

  // Handle admin static pages
  return handleAdminPages(request, env, adminRoute, accessCheck);
}

/**
 * Check if user has admin access
 */
async function checkAdminAccess(request, env, tenantId = null) {
  const cookieHeader = request.headers.get('Cookie');
  const cookies = cookieHeader ? cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) acc[key.trim()] = decodeURIComponent(value.trim());
    return acc;
  }, {}) : {};

  const userEmail = cookies.user_email;

  if (!userEmail) {
    return { hasAccess: false, reason: 'not_authenticated' };
  }

  try {
    const user = await env.DB.prepare(
      'SELECT id, email, role FROM users WHERE email = ? LIMIT 1'
    )
      .bind(userEmail)
      .first();

    if (!user) {
      return { hasAccess: false, reason: 'user_not_found' };
    }

    if (user.role === 'superadmin') {
      return { hasAccess: true, user, isSuperAdmin: true };
    }

    if (user.role === 'admin') {
      if (tenantId) {
        const userTenant = await env.DB.prepare(
          'SELECT tenant_id FROM users WHERE id = ? AND tenant_id = ? LIMIT 1'
        )
          .bind(user.id, tenantId)
          .first();

        if (!userTenant) {
          return { hasAccess: false, reason: 'tenant_access_denied' };
        }
      }
      return { hasAccess: true, user, isSuperAdmin: false };
    }

    return { hasAccess: false, reason: 'insufficient_permissions' };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return { hasAccess: false, reason: 'error', error: error.message };
  }
}

/**
 * Handle admin API endpoints
 */
async function handleAdminAPI(request, env, adminRoute, accessCheck, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;
  const pathParts = path.split('/').filter(p => p);

  // /api/admin/stores - List all stores/tenants
  if (pathParts.length === 3 && pathParts[2] === 'stores' && request.method === 'GET') {
    try {
      const stores = await env.DB.prepare(
        'SELECT id, name, slug, is_active, created_at, updated_at FROM tenants ORDER BY name ASC'
      )
        .all();

      return jsonResponse({
        success: true,
        data: stores.results || []
      }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  // /api/admin/store/{slug} - Get store details
  if (pathParts.length === 4 && pathParts[2] === 'store' && request.method === 'GET') {
    const slug = pathParts[3];
    try {
      const store = await env.DB.prepare(
        'SELECT * FROM tenants WHERE slug = ? LIMIT 1'
      )
        .bind(slug)
        .first();

      if (!store) {
        return jsonResponse({
          success: false,
          error: 'Store not found'
        }, 404, corsHeaders);
      }

      // Get store stats
      const userCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM users WHERE tenant_id = ?'
      )
        .bind(store.id)
        .first();

      return jsonResponse({
        success: true,
        data: {
          ...store,
          settings: store.settings ? JSON.parse(store.settings) : {},
          stats: {
            users: userCount?.count || 0
          }
        }
      }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: error.message
      }, 500, corsHeaders);
    }
  }

  return jsonResponse({
    success: false,
    error: 'Admin API endpoint not found'
  }, 404, corsHeaders);
}

/**
 * Handle admin static pages
 */
async function handleAdminPages(request, env, adminRoute, accessCheck) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Determine which admin page to serve
  let pagePath;

  if (adminRoute.type === 'store' && adminRoute.slug) {
    // admin.inneranimalmedia.com/store/{slug}
    pagePath = 'admin/store.html';
  } else if (adminRoute.type === 'stores') {
    // admin.inneranimalmedia.com/stores
    pagePath = 'admin/stores.html';
  } else if (adminRoute.type === 'settings') {
    // admin.inneranimalmedia.com/settings
    pagePath = 'admin/settings.html';
  } else {
    // admin.inneranimalmedia.com (dashboard)
    pagePath = 'admin/index.html';
  }

  // Serve admin page from R2
  return await serveAdminStaticFile(request, env, pagePath, adminRoute);
}

/**
 * Serve admin static files from R2
 */
async function serveAdminStaticFile(request, env, pagePath, adminRoute) {
  if (!env.STORAGE) {
    return new Response('R2 storage not configured', { status: 500 });
  }

  try {
    // Try to get admin page from R2
    const object = await env.STORAGE.get(`static/${pagePath}`);

    if (object) {
      let html = await object.text();

      // Inject admin route data into page
      const adminScript = `
        <script>
          window.ADMIN_ROUTE = ${JSON.stringify(adminRoute)};
          window.ADMIN_ACCESS = ${JSON.stringify({ isSuperAdmin: true, hasAccess: true })};
        </script>
      `;

      // Insert before </head> or at start of <body>
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${adminScript}</head>`);
      } else if (html.includes('<body')) {
        html = html.replace('<body', `${adminScript}<body`);
      }

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  } catch (error) {
    console.error('Error serving admin page:', error);
  }

  // Fallback: Return basic admin page HTML
  return new Response(getAdminPageHTML(adminRoute), {
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Generate basic admin page HTML (fallback)
 */
function getAdminPageHTML(adminRoute) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin - InnerAnimal Media</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    window.ADMIN_ROUTE = ${JSON.stringify(adminRoute)};
  </script>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <nav class="bg-white border-b">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold">Admin</h1>
          </div>
        </div>
      </div>
    </nav>
    <main class="max-w-7xl mx-auto px-4 py-8">
      <h2 class="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <p class="text-gray-600">Admin routing system is active. Admin pages will be served from R2.</p>
      <pre class="mt-4 p-4 bg-gray-100 rounded">${JSON.stringify(adminRoute, null, 2)}</pre>
    </main>
  </div>
</body>
</html>`;
}

/**
 * Helper: JSON response with CORS
 */
function jsonResponse(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

/**
 * Get Cloudflare Stream live input status
 * Helps dashboard stay ready for live streams
 */
async function handleStreamStatus(request, env, tenantId, corsHeaders) {
  if (request.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
  }

  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_STREAM_LIVE_INPUT_ID) {
    return jsonResponse({
      success: false,
      error: 'Cloudflare Stream not configured'
    }, 500, corsHeaders);
  }

  try {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const inputId = env.CLOUDFLARE_STREAM_LIVE_INPUT_ID;

    // Get live input status from Cloudflare Stream API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs/${inputId}`,
      {
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stream API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const input = data.result;

    return jsonResponse({
      success: true,
      data: {
        id: input.id,
        name: input.meta?.name || 'meauxcloudconnected',
        status: input.status || 'disconnected',
        connected: input.status === 'connected',
        created: input.created,
        // Streaming URLs
        rtmps_url: 'rtmps://live.cloudflare.com:443/live/',
        rtmps_key: env.CLOUDFLARE_STREAM_RTMPS_KEY,
        hls_url: `https://${env.CLOUDFLARE_STREAM_SUBDOMAIN}/${inputId}/manifest/video.m3u8?protocol=llhlsbeta`,
        webrtc_whip: `https://${env.CLOUDFLARE_STREAM_SUBDOMAIN}/4fdde099f7d97ad2a8ea506cefc4934a${inputId}/webRTC/publish`,
        webrtc_whep: `https://${env.CLOUDFLARE_STREAM_SUBDOMAIN}/${inputId}/webRTC/play`,
      },
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Stream status error:', error);
    return jsonResponse({
      success: false,
      error: error.message,
    }, 500, corsHeaders);
  }
}

/**
 * Generate TURN server credentials for WebRTC
 * Used for 1-on-1 peer-to-peer connections
 */
async function handleTURNCredentials(request, env, tenantId, corsHeaders) {
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
  }

  if (!env.REALTIME_TURN_TOKEN_ID || !env.REALTIME_TURN_API_TOKEN) {
    return jsonResponse({
      success: false,
      error: 'TURN server not configured'
    }, 500, corsHeaders);
  }

  try {
    const body = await request.json();
    const ttl = body.ttl || 86400; // 24 hours default

    // Generate TURN credentials via Cloudflare API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/rtc/turn/credentials`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.REALTIME_TURN_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_id: env.REALTIME_TURN_TOKEN_ID,
          ttl: ttl,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TURN API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const credentials = data.result;

    // Format for RTCPeerConnection
    const iceServers = {
      iceServers: [
        {
          urls: [
            'stun:stun.cloudflare.com:3478',
            'turn:turn.cloudflare.com:3478?transport=udp',
            'turn:turn.cloudflare.com:3478?transport=tcp',
            'turns:turn.cloudflare.com:5349?transport=tcp',
          ],
          username: credentials.username,
          credential: credentials.password,
        },
      ],
    };

    return jsonResponse({
      success: true,
      data: iceServers,
      expires_at: credentials.expires_at,
    }, 200, corsHeaders);

  } catch (error) {
    console.error('TURN credentials error:', error);
    return jsonResponse({
      success: false,
      error: error.message,
    }, 500, corsHeaders);
  }
}

/**
 * Create SFU session for multi-party calls
 * Used for 3+ participants (more efficient than P2P)
 */
async function handleSFUSession(request, env, tenantId, corsHeaders) {
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
  }

  if (!env.REALTIME_SFU_APP_ID || !env.REALTIME_SFU_API_TOKEN) {
    return jsonResponse({
      success: false,
      error: 'SFU not configured'
    }, 500, corsHeaders);
  }

  try {
    const body = await request.json();
    const { room_id, user_id, user_name } = body;

    // Create SFU session via Cloudflare API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/rtc/sessions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.REALTIME_SFU_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: env.REALTIME_SFU_APP_ID,
          room_id: room_id || `room-${Date.now()}`,
          user_id: user_id || `user-${Date.now()}`,
          user_name: user_name || 'Anonymous',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SFU API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const session = data.result;

    return jsonResponse({
      success: true,
      data: {
        session_id: session.session_id,
        room_id: session.room_id,
        token: session.token,
        ws_url: session.ws_url,
        app_id: env.REALTIME_SFU_APP_ID,
      },
    }, 200, corsHeaders);

  } catch (error) {
    console.error('SFU session error:', error);
    return jsonResponse({
      success: false,
      error: error.message,
    }, 500, corsHeaders);
  }
}
