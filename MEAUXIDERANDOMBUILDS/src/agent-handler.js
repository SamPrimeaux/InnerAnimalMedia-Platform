/**
 * Agent API Handler
 * Handles IDE agent commands (terminal/chatbot/devops)
 */

// Helper function (should match worker.js)
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
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
        return jsonResponse(
          { success: false, error: 'Command is required' },
          400,
          corsHeaders
        );
      }

      // Parse command
      const cmdParts = command.trim().split(/\s+/);
      const cmd = cmdParts[0].toLowerCase();
      const args = cmdParts.slice(1);

      let output = '';
      let data = null;

      // Handle different command types
      switch (cmd) {
        case 'help':
        case '?':
          output = `Available commands:
- help / ? - Show this help
- projects - List all projects
- deployments - List recent deployments
- workers - List workers
- stats - Show system stats
- db:query <sql> - Execute SQL query (read-only)
- wrangler <command> - Wrangler CLI commands
- git <command> - Git commands
- npm <command> - NPM commands
- clear - Clear terminal`;
          break;

        case 'projects':
          const projectsResult = await env.DB.prepare(
            'SELECT id, name, slug, status, created_at FROM projects ORDER BY created_at DESC LIMIT 20'
          ).all();
          output = `Projects (${projectsResult.results?.length || 0}):\n`;
          data = {
            table: {
              headers: ['ID', 'Name', 'Slug', 'Status', 'Created'],
              rows: (projectsResult.results || []).map(p => [
                p.id.substring(0, 8) + '...',
                p.name,
                p.slug || '-',
                p.status || 'active',
                new Date(p.created_at * 1000).toLocaleDateString()
              ])
            }
          };
          break;

        case 'deployments':
          const deploymentsResult = await env.DB.prepare(
            'SELECT id, project_name, status, url, created_at FROM deployments ORDER BY created_at DESC LIMIT 10'
          ).all();
          output = `Recent Deployments (${deploymentsResult.results?.length || 0}):\n`;
          data = {
            table: {
              headers: ['ID', 'Project', 'Status', 'URL', 'Created'],
              rows: (deploymentsResult.results || []).map(d => [
                d.id.substring(0, 8) + '...',
                d.project_name,
                d.status,
                d.url || '-',
                new Date(d.created_at * 1000).toLocaleDateString()
              ])
            }
          };
          break;

        case 'workers':
          const workersResult = await env.DB.prepare(
            'SELECT id, name, status, requests, created_at FROM workers ORDER BY created_at DESC LIMIT 10'
          ).all();
          output = `Workers (${workersResult.results?.length || 0}):\n`;
          data = {
            table: {
              headers: ['ID', 'Name', 'Status', 'Requests', 'Created'],
              rows: (workersResult.results || []).map(w => [
                w.id.substring(0, 8) + '...',
                w.name,
                w.status,
                w.requests || 0,
                new Date(w.created_at * 1000).toLocaleDateString()
              ])
            }
          };
          break;

        case 'stats':
          const statsResult = await env.DB.prepare(`
            SELECT 
              (SELECT COUNT(*) FROM projects) as projects,
              (SELECT COUNT(*) FROM deployments) as deployments,
              (SELECT COUNT(*) FROM workers) as workers,
              (SELECT COUNT(*) FROM calendar_events) as events
          `).first();
          output = `System Stats:\n`;
          data = {
            table: {
              headers: ['Metric', 'Count'],
              rows: [
                ['Projects', statsResult?.projects || 0],
                ['Deployments', statsResult?.deployments || 0],
                ['Workers', statsResult?.workers || 0],
                ['Calendar Events', statsResult?.events || 0]
              ]
            }
          };
          break;

        case 'db:query':
          if (args.length === 0) {
            output = 'Error: SQL query required\nUsage: db:query "SELECT * FROM projects LIMIT 5"';
          } else {
            const sql = args.join(' ');
            // Only allow SELECT queries for safety
            if (!sql.trim().toUpperCase().startsWith('SELECT')) {
              output = 'Error: Only SELECT queries are allowed for safety';
            } else {
              try {
                const queryResult = await env.DB.prepare(sql).all();
                output = `Query executed successfully (${queryResult.results?.length || 0} rows):\n`;
                if (queryResult.results && queryResult.results.length > 0) {
                  const headers = Object.keys(queryResult.results[0]);
                  data = {
                    table: {
                      headers,
                      rows: queryResult.results.map(row => headers.map(h => String(row[h] || '')))
                    }
                  };
                }
              } catch (error) {
                output = `Query error: ${error.message}`;
              }
            }
          }
          break;

        case 'wrangler':
          output = `Wrangler CLI commands are available. Common commands:
- wrangler d1 execute <db> --command="<sql>"
- wrangler deploy
- wrangler pages deploy
- wrangler secret put <name>
Use 'help' for more information.`;
          break;

        case 'git':
          output = `Git commands:
- git status
- git commit -m "message"
- git push
Note: Git commands should be run in your local terminal.`;
          break;

        case 'npm':
          output = `NPM commands:
- npm install <package>
- npm run <script>
Note: NPM commands should be run in your local terminal.`;
          break;

        case 'clear':
          output = '\n\n'; // Clear output
          break;

        default:
          output = `Unknown command: ${cmd}\nType 'help' for available commands.`;
      }

      return jsonResponse({
        success: true,
        output,
        data,
        command,
        timestamp: Date.now()
      }, 200, corsHeaders);
    } catch (error) {
      console.error('Error executing agent command:', error);
      return jsonResponse({
        success: false,
        error: error.message,
        output: `Error: ${error.message}`
      }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}
