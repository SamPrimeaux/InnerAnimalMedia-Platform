/**
 * inneranimalmedia Worker
 * Serves: ASSETS (public homepage) + DASHBOARD (auth, dashboard pages).
 * Durable Objects: IAM_COLLAB, CHESS_SESSION (stubs until full logic restored from R2).
 * Browser: MYBROWSER (Puppeteer) for /api/browser/* when binding is configured.
 * --remote only; no local dependencies.
 */

import { DurableObject } from "cloudflare:workers";
import puppeteer from "@cloudflare/puppeteer";

// Stub DOs so deploy succeeds; replace with full logic when restored from R2
export class IAMCollaborationSession extends DurableObject {
  async fetch(request) {
    return new Response(JSON.stringify({ do: 'IAMCollaborationSession', ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export class IAMSession extends DurableObject {
  async fetch(request) {
    return new Response(JSON.stringify({ do: 'IAMSession', ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export class MeauxSession extends DurableObject {
  async fetch(request) {
    return new Response(JSON.stringify({ do: 'MeauxSession', ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export class ChessRoom extends DurableObject {
  async fetch(request) {
    return new Response(JSON.stringify({ do: 'ChessRoom', ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/, '') || '/';
      const pathLower = path.toLowerCase();

      // Health / sanity
      if (path === '/api/health' || pathLower === '/api/health') {
        const ok = !!(env.ASSETS && env.DASHBOARD);
        return new Response(JSON.stringify({ ok, worker: 'inneranimalmedia', bindings: { ASSETS: !!env.ASSETS, DASHBOARD: !!env.DASHBOARD } }), {
          headers: { 'Content-Type': 'application/json' },
          status: ok ? 200 : 503,
        });
      }

      // ----- API: Browser (Puppeteer via MYBROWSER) -----
      if (pathLower.startsWith('/api/browser/')) {
        return handleBrowserRequest(request, url, env);
      }

      // ----- API: Dashboard metrics (overview) -----
      if (pathLower === '/api/overview/stats') {
        return handleOverviewStats(request, url, env);
      }

      // ----- API: Time tracking (start/heartbeat/end session) -----
      if (pathLower.startsWith('/api/dashboard/time-track')) {
        return handleTimeTrack(request, url, env);
      }

      // ----- API: Colors (finance UI) -----
      if (pathLower === '/api/colors/all') {
        return handleColorsAll(request, env);
      }

      // ----- API: Finance (summary, transactions, health, etc.) -----
      if (pathLower.startsWith('/api/finance/')) {
        return handleFinance(request, url, env);
      }

      // ----- OAuth: Google -----
      if (pathLower === '/api/oauth/google/start') {
        return handleGoogleOAuthStart(request, url, env);
      }
      if (pathLower === '/api/oauth/google/callback') {
        return handleGoogleOAuthCallback(request, url, env);
      }

      // ----- OAuth: GitHub -----
      if (pathLower === '/api/oauth/github/start') {
        return handleGitHubOAuthStart(request, url, env);
      }
      if (pathLower === '/api/oauth/github/callback') {
        return handleGitHubOAuthCallback(request, url, env);
      }

      // ----- API: Agent dashboard (/api/agent/*) -----
      if (pathLower.startsWith('/api/agent')) {
        return handleAgentApi(request, url, env);
      }

      // ----- Public (ASSETS) -----
      if (path === '/' || path === '/index.html') {
        const obj = await env.ASSETS.get('index-v2.html') ?? await env.ASSETS.get('index.html');
        if (obj) return respondWithR2Object(obj, 'text/html');
        return notFound(path);
      }

      // Auth sign-in (DASHBOARD)
      if (pathLower === '/auth/signin') {
        const obj = await env.DASHBOARD.get('static/auth-signin.html');
        if (obj) return respondWithR2Object(obj, 'text/html');
        return notFound(path);
      }

      // Dashboard base -> redirect to overview
      if (pathLower === '/dashboard' || pathLower === '/dashboard/') {
        return Response.redirect(url.origin + '/dashboard/overview', 302);
      }

      // Dashboard page fragments: /dashboard/pages/<name>.html -> static/dashboard/pages/<name>.html (for shell #page-content injection)
      const dashboardPagesMatch = pathLower.match(/^\/dashboard\/pages\/([^/]+\.html)$/);
      if (dashboardPagesMatch && env.DASHBOARD) {
        const pageName = dashboardPagesMatch[1];
        const fragmentKey = `static/dashboard/pages/${pageName}`;
        const obj = await env.DASHBOARD.get(fragmentKey);
        if (obj) return respondWithR2Object(obj, 'text/html', { noCache: true });
      }

      // Dashboard pages (DASHBOARD bucket)
      if (pathLower.startsWith('/dashboard/')) {
        const segment = pathLower.slice('/dashboard/'.length).split('/')[0] || 'overview';
        const key = `static/dashboard/${segment}.html`;
        const altKey = `dashboard/${segment}.html`;
        const obj = await env.DASHBOARD.get(key) ?? await env.DASHBOARD.get(altKey);
        if (obj) return respondWithR2Object(obj, 'text/html', { noCache: true });
        return notFound(path);
      }

      // Static assets: try ASSETS then DASHBOARD by path (key = path without leading slash)
      const assetKey = path.slice(1) || 'index.html';
      let obj = await env.ASSETS.get(assetKey);
      if (!obj && env.DASHBOARD) obj = await env.DASHBOARD.get(assetKey);
      // Dashboard static: if path is /static/dashboard/foo.js and not found, try dashboard/foo.js
      if (!obj && pathLower.startsWith('/static/dashboard/') && env.DASHBOARD) {
        const staticSegment = pathLower.slice('/static/dashboard/'.length).split('/')[0];
        if (staticSegment) obj = await env.DASHBOARD.get(`dashboard/${staticSegment}`);
      }
      if (obj) {
        const noCache = pathLower.startsWith('/static/dashboard/agent/') || pathLower.startsWith('/dashboard/');
        return respondWithR2Object(obj, contentType(assetKey), noCache ? { noCache: true } : {});
      }

      return notFound(path);
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Worker error', message: String(err.message) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
  async queue(batch, env, ctx) {
    for (const msg of batch.messages) {
      try {
        const body = msg.body && typeof msg.body === 'object' ? msg.body : (typeof msg.body === 'string' ? JSON.parse(msg.body || '{}') : {});
        const { jobId, job_type, url } = body;
        if (jobId && env.MYBROWSER && env.DASHBOARD && env.DB) {
          const puppeteer = await import('@cloudflare/puppeteer');
          const browser = await puppeteer.default.launch(env.MYBROWSER);
          try {
            const page = await browser.newPage();
            await page.goto(url || 'https://example.com', { waitUntil: 'networkidle0', timeout: 30000 });
            let resultUrl = null;
            if (job_type === 'screenshot') {
              const buf = await page.screenshot({ type: 'png', fullPage: true });
              const key = `screenshots/${jobId}.png`;
              await env.DASHBOARD.put(key, buf, { httpMetadata: { contentType: 'image/png' } });
              resultUrl = `https://pub-b845a8f899834f0faf95dc83eda3c505.r2.dev/${key}`;
            } else if (job_type === 'render') {
              const html = await page.content();
              const key = `renders/${jobId}.html`;
              await env.DASHBOARD.put(key, html, { httpMetadata: { contentType: 'text/html' } });
              resultUrl = `https://pub-b845a8f899834f0faf95dc83eda3c505.r2.dev/${key}`;
            }
            await env.DB.prepare(
              "UPDATE playwright_jobs SET status='completed', result_url=?, completed_at=CURRENT_TIMESTAMP WHERE id=?"
            ).bind(resultUrl, jobId).run();
          } catch (err) {
            await env.DB.prepare(
              "UPDATE playwright_jobs SET status='failed', error=? WHERE id=?"
            ).bind(String(err?.message || err), jobId).run();
          } finally {
            await browser.close();
          }
        }
      } catch (_) {}
      msg.ack();
    }
  },
};

function respondWithR2Object(obj, contentType, options = {}) {
  const headers = new Headers();
  headers.set('Content-Type', contentType || 'application/octet-stream');
  const etag = obj.etag;
  if (etag) headers.set('ETag', etag);
  // Dashboard HTML: avoid stale cache so UI updates deploy without hard refresh
  if (options.noCache) {
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
  }
  return new Response(obj.body, { status: 200, headers });
}

function contentType(path) {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.ico')) return 'image/x-icon';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.woff2')) return 'font/woff2';
  if (path.endsWith('.woff')) return 'font/woff';
  return 'application/octet-stream';
}

function notFound(path) {
  return new Response(JSON.stringify({ error: 'Not found', path }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Puppeteer (Cloudflare Browser Rendering): health + optional metrics. Only runs when env.MYBROWSER is set. */
async function handleBrowserRequest(request, url, env) {
  if (!env.MYBROWSER) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'MYBROWSER binding not configured',
      hint: 'Add Browser rendering binding in Cloudflare dashboard and wrangler.production.toml',
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
  const pathLower = url.pathname.replace(/\/$/, '').toLowerCase();
  const targetUrl = url.searchParams.get('url') || 'https://example.com';

  try {
    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const metrics = await page.metrics();
    await browser.close();

    if (pathLower === '/api/browser/health') {
      return new Response(JSON.stringify({
        ok: true,
        worker: 'inneranimalmedia',
        browser: 'puppeteer',
        binding: 'MYBROWSER',
        metrics: { jsHeapUsedSize: metrics.JSHeapUsedSize, nodes: metrics.Nodes },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (pathLower === '/api/browser/metrics') {
      return new Response(JSON.stringify({ ok: true, url: targetUrl, metrics }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return notFound(url.pathname);
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: String(err?.message || err),
      binding: 'MYBROWSER',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

function resolveAnthropicModelKey(modelKey) {
  const map = {
    claude_opus_4_6: 'claude-opus-4-20250514',
    claude_opus_4_6_fast: 'claude-opus-4-20250514',
    claude_sonnet_4_5: 'claude-sonnet-4-5-20251022',
    claude_haiku_4_5: 'claude-haiku-4-5-20251001',
    claude_sonnet_4: 'claude-sonnet-4-20250514',
  };
  return map[modelKey] || 'claude-sonnet-4-20250514';
}

/** Parse data URL to { mediaType, base64 } for vision APIs */
function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mediaType: match[1].trim(), base64: match[2] };
}

/** Build last user message content with images for Anthropic (content block array) */
function buildAnthropicContent(text, images) {
  const blocks = [{ type: 'text', text: text || '(image attached)' }];
  if (images && Array.isArray(images)) {
    for (const img of images) {
      const parsed = parseDataUrl(img.dataUrl);
      if (parsed) blocks.push({ type: 'image', source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64 } });
    }
  }
  return blocks;
}

/** Build last user message content with images for OpenAI (content array) */
function buildOpenAIContent(text, images) {
  const parts = [{ type: 'text', text: text || '(image attached)' }];
  if (images && Array.isArray(images)) {
    for (const img of images) {
      if (img.dataUrl) parts.push({ type: 'image_url', image_url: { url: img.dataUrl } });
    }
  }
  return parts;
}

/** Build last user message parts for Google (parts array) */
function buildGoogleParts(text, images) {
  const parts = [{ text: text || '(image attached)' }];
  if (images && Array.isArray(images)) {
    for (const img of images) {
      const parsed = parseDataUrl(img.dataUrl);
      if (parsed) parts.push({ inline_data: { mime_type: parsed.mediaType, data: parsed.base64 } });
    }
  }
  return parts;
}

async function handleAgentApi(request, url, env) {
  const pathLower = url.pathname.replace(/\/$/, '').toLowerCase();
  const method = (request.method || 'GET').toUpperCase();

  try {
    if (!env.DB) return jsonResponse({ error: 'DB not configured' }, 503);

    if (pathLower === '/api/agent/boot') {
      let agents = [], mcp_services = [], models = [], sessions = [], prompts = [];
      try {
        const batch = await env.DB.batch([
          env.DB.prepare("SELECT id, name, role_name, status, mode, safety_level, total_runs, total_cost_usd FROM agent_ai_sam WHERE status='active' ORDER BY created_at DESC"),
          env.DB.prepare("SELECT id, service_name, service_type, endpoint_url, is_active, health_status FROM mcp_services WHERE is_active=1 ORDER BY service_name"),
          env.DB.prepare("SELECT id, provider, model_key, display_name, supports_tools, supports_vision, supports_web_search, input_rate_per_mtok, output_rate_per_mtok FROM ai_models WHERE is_active=1 ORDER BY provider, display_name"),
          env.DB.prepare("SELECT id, session_type, status, started_at FROM agent_sessions WHERE status='active' ORDER BY updated_at DESC LIMIT 20"),
          env.DB.prepare("SELECT id, role, content, variant, ab_weight, agent_id FROM iam_agent_sam_prompts WHERE is_active=1"),
        ]);
        agents = batch[0]?.results ?? [];
        mcp_services = batch[1]?.results ?? [];
        models = batch[2]?.results ?? [];
        sessions = batch[3]?.results ?? [];
        prompts = batch[4]?.results ?? [];
      } catch (_) {}
      return jsonResponse({ agents, mcp_services, models, sessions, prompts, cidi: [] });
    }

    const sessionMsgMatch = pathLower.match(/^\/api\/agent\/sessions\/([^/]+)\/messages$/);
    if (sessionMsgMatch) {
      const convId = sessionMsgMatch[1];
      if (method === 'POST') {
        const body = await request.json();
        const id = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO agent_messages (id, conversation_id, role, content, provider, created_at) VALUES (?,?,?,?,?,unixepoch())"
        ).bind(id, convId, body.role, body.content, body.provider || null).run();
        return jsonResponse({ id });
      }
      const { results } = await env.DB.prepare(
        "SELECT * FROM agent_messages WHERE conversation_id=? ORDER BY created_at ASC"
      ).bind(convId).all();
      return jsonResponse(results);
    }

    const playwrightMatch = pathLower.match(/^\/api\/agent\/playwright\/([^/]+)$/);
    if (playwrightMatch) {
      const job = await env.DB.prepare('SELECT * FROM playwright_jobs WHERE id=?').bind(playwrightMatch[1]).first();
      return job ? jsonResponse(job) : jsonResponse({ error: 'Not found' }, 404);
    }

    const workspaceMatch = pathLower.match(/^\/api\/agent\/workspace\/([^/]+)$/);
    if (workspaceMatch) {
      const wsId = workspaceMatch[1];
      if (method === 'PUT') {
        const body = await request.json();
        const stateJson = JSON.stringify(body.state ?? body);
        try {
          await env.DB.prepare('UPDATE agent_workspace_state SET state_json=?, updated_at=unixepoch() WHERE id=?').bind(stateJson, wsId).run();
        } catch (_) {
          await env.DB.prepare('INSERT INTO agent_workspace_state (id, state_json, updated_at) VALUES (?,?,unixepoch())').bind(wsId, stateJson).run();
        }
        if (env.DASHBOARD) await env.DASHBOARD.put(`sessions/${wsId}/state.json`, stateJson, { httpMetadata: { contentType: 'application/json' } });
        return jsonResponse({ ok: true });
      }
      const ws = await env.DB.prepare('SELECT * FROM agent_workspace_state WHERE id=?').bind(wsId).first();
      return ws ? jsonResponse(ws) : jsonResponse({ error: 'Not found' }, 404);
    }

    if (pathLower === '/api/agent/models') {
      const provider = url.searchParams.get('provider');
      const query = provider
        ? env.DB.prepare("SELECT * FROM ai_models WHERE is_active=1 AND provider=? ORDER BY display_name").bind(provider)
        : env.DB.prepare("SELECT * FROM ai_models WHERE is_active=1 ORDER BY provider, display_name");
      const { results } = await query.all();
      return jsonResponse(results);
    }

    if (pathLower === '/api/agent/sessions') {
      if (method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const id = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);
        await env.DB.prepare(
          "INSERT INTO agent_sessions (id, tenant_id, session_type, status, state_json, started_at, updated_at) VALUES (?,?,?,?,?,?,?)"
        ).bind(id, env.TENANT_ID || 'system', body.session_type || 'chat', 'active', '{}', now, now).run();
        if (env.SESSION_CACHE) await env.SESSION_CACHE.put(`session:${id}`, JSON.stringify({ id, status: 'active' }), { expirationTtl: 86400 });
        return jsonResponse({ id, status: 'active' });
      }
      const { results } = await env.DB.prepare(
        "SELECT id, session_type, status, state_json, started_at FROM agent_sessions WHERE status='active' ORDER BY updated_at DESC LIMIT 20"
      ).all();
      return jsonResponse(results);
    }

    if (pathLower === '/api/agent/chat' && method === 'POST') {
      const body = await request.json();
      const { model_id, messages: msgList, agent_id, session_id, images: bodyImages, attached_files: bodyFiles } = body;
      if (!msgList || !Array.isArray(msgList) || msgList.length === 0) return jsonResponse({ error: 'messages required' }, 400);
      const model = await env.DB.prepare('SELECT * FROM ai_models WHERE id = ?').bind(model_id).first();
      if (!model) return jsonResponse({ error: 'Model not found' }, 404);

      const images = Array.isArray(bodyImages) ? bodyImages : [];
      const attachedFiles = Array.isArray(bodyFiles) ? bodyFiles : [];
      let lastUserContent = msgList[msgList.length - 1]?.role === 'user' ? (msgList[msgList.length - 1].content || '') : '';
      if (attachedFiles.length > 0 && lastUserContent !== undefined) {
        const fileBlobs = attachedFiles.map((f) => `[Attached file: ${f.name}]\n${typeof f.content === 'string' ? f.content : ''}`).join('\n\n');
        lastUserContent = lastUserContent + (lastUserContent ? '\n\n' : '') + fileBlobs;
      }
      const apiMessages = msgList.map((m, i) => {
        const isLastUser = i === msgList.length - 1 && m.role === 'user';
        const content = isLastUser ? lastUserContent : m.content;
        return { role: m.role === 'assistant' ? 'assistant' : 'user', content };
      });
      const agentSamSystem = 'You are Agent Sam, the AI assistant for Inner Animal Media. You help with DevOps, code, MCP, and platform work. Identify only as Agent Sam. Do not say you are Cursor, Claude, GPT, or any other product.';

      let result;
      if (model.provider === 'anthropic' && env.ANTHROPIC_API_KEY) {
        const anthropicMessages = apiMessages.map((m, i) => {
          const isLastUser = i === apiMessages.length - 1 && m.role === 'user' && images.length > 0;
          return { role: m.role, content: isLastUser ? buildAnthropicContent(m.content, images) : m.content };
        });
        const modelKey = resolveAnthropicModelKey(model.model_key);
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({ model: modelKey, max_tokens: 8192, system: agentSamSystem, messages: anthropicMessages }),
        });
        result = await resp.json();
        if (!resp.ok) return jsonResponse(result, resp.status);
      } else if (model.provider === 'openai' && env.OPENAI_API_KEY) {
        const openAiMessages = apiMessages.map((m, i) => {
          const isLastUser = i === apiMessages.length - 1 && m.role === 'user' && images.length > 0;
          const content = isLastUser ? buildOpenAIContent(m.content, images) : m.content;
          return { role: m.role, content };
        });
        const withSystem = [{ role: 'system', content: agentSamSystem }, ...openAiMessages];
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
          body: JSON.stringify({ model: model.model_key || 'gpt-4o', messages: withSystem }),
        });
        result = await resp.json();
        if (!resp.ok) return jsonResponse(result, resp.status);
      } else if (model.provider === 'google' && env.GOOGLE_AI_API_KEY) {
        const googleContents = apiMessages.map((m, i) => {
          const isLastUser = i === apiMessages.length - 1 && m.role === 'user' && images.length > 0;
          const parts = isLastUser ? buildGoogleParts(m.content, images) : [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }];
          return { role: m.role === 'assistant' ? 'model' : 'user', parts };
        });
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${(model.model_key || 'gemini-2.0-flash-exp')}:generateContent?key=${env.GOOGLE_AI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: agentSamSystem }] },
              contents: googleContents,
            }),
          }
        );
        result = await resp.json();
        if (!resp.ok) return jsonResponse(result, resp.status);
      } else if (model.provider === 'cloudflare_workers_ai' && env.AI) {
        result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages: [{ role: 'system', content: agentSamSystem }, ...apiMessages] });
      } else {
        return jsonResponse({ error: 'Provider not configured or unsupported' }, 503);
      }

      const inputTok = result?.usage?.input_tokens ?? result?.usage?.prompt_tokens ?? 0;
      const outputTok = result?.usage?.output_tokens ?? result?.usage?.completion_tokens ?? 0;
      let conversationId = session_id;
      if (!conversationId) {
        try {
          conversationId = crypto.randomUUID();
          const now = Math.floor(Date.now() / 1000);
          await env.DB.prepare(
            "INSERT INTO agent_sessions (id, tenant_id, session_type, status, state_json, started_at, updated_at) VALUES (?,?,?,?,?,?,?)"
          ).bind(conversationId, env.TENANT_ID || 'system', 'chat', 'active', '{}', now, now).run();
        } catch (_) {}
      }
      const assistantContent = result?.content?.[0]?.text ?? result?.choices?.[0]?.message?.content ?? result?.candidates?.[0]?.content?.parts?.[0]?.text ?? (typeof result?.message === 'string' ? result.message : '');
      try {
        const convId = conversationId;
        if (convId) {
          const userContent = lastUserContent || msgList[msgList.length - 1]?.content || '';
          await env.DB.prepare(
            "INSERT INTO agent_messages (id, conversation_id, role, content, provider, created_at) VALUES (?,?,?,?,?,unixepoch())"
          ).bind(crypto.randomUUID(), convId, 'user', userContent.slice(0, 50000), null).run();
          await env.DB.prepare(
            "INSERT INTO agent_messages (id, conversation_id, role, content, provider, created_at) VALUES (?,?,?,?,?,unixepoch())"
          ).bind(crypto.randomUUID(), convId, 'assistant', (assistantContent || '').slice(0, 50000), model.provider).run();
        }
      } catch (_) {}
      try {
        await env.DB.prepare(
          `INSERT INTO agent_telemetry (id, tenant_id, session_id, metric_type, metric_name, metric_value, provider, model_used, input_tokens, output_tokens, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,unixepoch(),unixepoch())`
        ).bind(crypto.randomUUID(), env.TENANT_ID || 'system', conversationId || null, 'llm_call', 'chat_completion', 1, model.provider, model.model_key, inputTok, outputTok).run();
      } catch (_) {}
      if (agent_id) {
        try {
          await env.DB.prepare("UPDATE agent_ai_sam SET total_runs=total_runs+1, last_run_at=unixepoch(), updated_at=unixepoch() WHERE id=?").bind(agent_id).run();
        } catch (_) {}
      }
      return jsonResponse({ ...result, conversation_id: conversationId });
    }

    if (pathLower === '/api/agent/playwright' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const jobId = crypto.randomUUID();
      try {
        await env.DB.prepare(
          "INSERT INTO playwright_jobs (id, job_type, url, status, metadata, created_at) VALUES (?,?,?,'pending',?,CURRENT_TIMESTAMP)"
        ).bind(jobId, body.job_type || 'screenshot', body.url || '', JSON.stringify(body.options || {})).run();
      } catch (_) {
        return jsonResponse({ error: 'playwright_jobs table not available' }, 503);
      }
      if (env.MY_QUEUE) await env.MY_QUEUE.send({ jobId, job_type: body.job_type || 'screenshot', url: body.url || '' });
      return jsonResponse({ jobId, status: 'pending' });
    }

    if (pathLower === '/api/agent/mcp') {
      const { results } = await env.DB.prepare(
        "SELECT id, service_name, service_type, endpoint_url, is_active, health_status FROM mcp_services WHERE is_active=1 ORDER BY service_name"
      ).all();
      return jsonResponse(results);
    }

    if (pathLower === '/api/agent/cidi') {
      try {
        const { results } = await env.DB.prepare(
          "SELECT c.*, COUNT(cal.id) as activity_count FROM cidi c LEFT JOIN cidi_activity_log cal ON c.id=cal.cidi_id GROUP BY c.id ORDER BY c.updated_at DESC LIMIT 50"
        ).all();
        return jsonResponse(results);
      } catch (_) {
        return jsonResponse([]);
      }
    }

    if (pathLower === '/api/agent/telemetry') {
      try {
        const { results } = await env.DB.prepare(
          `SELECT provider, SUM(input_tokens) as total_input, SUM(output_tokens) as total_output, COUNT(*) as total_calls FROM agent_telemetry WHERE created_at > unixepoch('now','-7 days') GROUP BY provider`
        ).all();
        return jsonResponse(results);
      } catch (_) {
        return jsonResponse([]);
      }
    }

    // ----- RAG / Memory (Vectorize + Workers AI 768-dim) -----
    const EMBED_MODEL = '@cf/baai/bge-base-en-v1.5';
    if (pathLower === '/api/agent/rag/query' && method === 'POST' && env.AI && env.VECTORIZE) {
      try {
        const body = await request.json().catch(() => ({}));
        const query = body.query || body.q || '';
        const topK = Math.min(Number(body.topK) || 5, 20);
        if (!query.trim()) return jsonResponse({ error: 'query required' }, 400);
        const emb = await env.AI.run(EMBED_MODEL, { text: [query.trim()] });
        const vector = emb?.data?.[0];
        if (!vector || !Array.isArray(vector)) return jsonResponse({ error: 'embed failed' }, 502);
        const matches = await env.VECTORIZE.query(vector, { topK, returnMetadata: true });
        return jsonResponse({ matches: matches.matches || [], count: (matches.matches || []).length });
      } catch (e) {
        return jsonResponse({ error: String(e?.message || e), matches: [] }, 500);
      }
    }

    if (pathLower === '/api/agent/rag/insert' && method === 'POST' && env.AI && env.VECTORIZE) {
      try {
        const body = await request.json().catch(() => ({}));
        const items = body.items || (body.text ? [{ id: crypto.randomUUID(), text: body.text }] : []);
        if (!items.length) return jsonResponse({ error: 'items or text required' }, 400);
        const texts = items.map((i) => (typeof i === 'string' ? i : i.text || '').slice(0, 8000));
        const emb = await env.AI.run(EMBED_MODEL, { text: texts });
        const data = emb?.data;
        if (!data || !Array.isArray(data) || data.length !== items.length) return jsonResponse({ error: 'embed failed' }, 502);
        const vectors = data.map((values, i) => {
          const it = items[i];
          const id = typeof it === 'string' ? crypto.randomUUID() : (it.id || crypto.randomUUID());
          const metadata = typeof it === 'object' && it.metadata ? it.metadata : (typeof it === 'object' && it.source ? { source: it.source, date: it.date } : {});
          return { id: String(id), values, metadata };
        });
        const result = await env.VECTORIZE.upsert(vectors);
        return jsonResponse({ ok: true, inserted: result.count || vectors.length });
      } catch (e) {
        return jsonResponse({ error: String(e?.message || e) }, 500);
      }
    }

    if (pathLower === '/api/agent/bootstrap' && method === 'GET') {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const prefix = 'memory/daily/';
        let dailyLog = '';
        let yesterdayLog = '';
        if (env.R2) {
          try {
            const o1 = await env.R2.get(prefix + today + '.md');
            if (o1) dailyLog = await o1.text();
            const o2 = await env.R2.get(prefix + yesterday + '.md');
            if (o2) yesterdayLog = await o2.text();
          } catch (_) {}
        }
        return jsonResponse({
          daily_log: dailyLog || null,
          yesterday_log: yesterdayLog || null,
          date: today,
          hint: 'Use POST /api/agent/rag/insert to seed Vectorize. Store daily logs in R2 at memory/daily/YYYY-MM-DD.md',
        });
      } catch (e) {
        return jsonResponse({ error: String(e?.message || e) }, 500);
      }
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (err) {
    return jsonResponse({ error: String(err?.message || err) }, 500);
  }
}

const OAUTH_STATE_TTL = 600;
const DEFAULT_TENANT = 'system';
const PROJECT_ID = 'inneranimalmedia';
function origin(url) { return url.origin; }

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getSession(env, request) {
  if (!env.DB) return null;
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/session=([^\s;]+)/);
  const sessionId = m?.[1];
  if (!sessionId) return null;
  const row = await env.DB.prepare(
    `SELECT id, user_id, expires_at FROM auth_sessions WHERE id = ? AND datetime(expires_at) > datetime('now')`
  ).bind(sessionId).first();
  return row || null;
}

function overviewStatsPayload(overrides = {}) {
  return {
    success: true,
    db_health: overrides.db_health ?? 'no_data',
    finance_transactions_count: overrides.finance_transactions_count ?? 0,
    spend_ledger_entries: overrides.spend_ledger_entries ?? 0,
    spend_ledger_total: overrides.spend_ledger_total ?? 0,
    active_clients: overrides.active_clients ?? 0,
    monthly_net: overrides.monthly_net ?? null,
    financial_health: overrides.financial_health ?? { total_in_all_time: 0, total_out_all_time: 0, date_range: null, source_accounts_tracked: 0 },
    infrastructure_spend_by_provider: overrides.infrastructure_spend_by_provider ?? [],
    revenue_clients: overrides.revenue_clients ?? { total_clients: 0, active_streams: 0 },
    pipeline_runs: overrides.pipeline_runs ?? 0,
    agent_conversations: overrides.agent_conversations ?? 0,
    agent_last_activity: overrides.agent_last_activity ?? null,
    latest_migration: overrides.latest_migration ?? null,
  };
}

async function handleOverviewStats(request, url, env) {
  if (!env.DB) return jsonResponse(overviewStatsPayload({ db_health: 'unavailable' }), 200);
  const safe = (p) => (p ? p.catch(() => null) : Promise.resolve(null));
  const num = (r, key) => (r != null && r[key] != null ? Number(r[key]) : r?.c != null ? Number(r.c) : r?.entries != null ? Number(r.entries) : 0);
  const sum = (r, key) => (r != null && r[key] != null ? Number(r[key]) : 0);

  try {
    const [
      txCountRow,
      spendRow,
      deployRow,
      clientsRow,
      agentTelemetryRow,
      timeEntriesRow,
      providersResult,
    ] = await Promise.all([
      safe(env.DB.prepare(`SELECT COUNT(*) as c FROM finance_transactions`).first()),
      safe(env.DB.prepare(`SELECT COUNT(*) as entries, COALESCE(SUM(amount_usd), 0) as total FROM spend_ledger`).first()),
      safe(env.DB.prepare(`SELECT deployment_id, deployed_at FROM cloudflare_deployments WHERE worker_name = ? ORDER BY deployed_at DESC LIMIT 1`).bind('inneranimalmedia').first()),
      safe(env.DB.prepare(`SELECT COUNT(*) as c FROM workspaces WHERE category = 'client'`).first()),
      safe(env.DB.prepare(`SELECT COUNT(*) as c, MAX(created_at) as last_at FROM agent_telemetry`).first()),
      safe(env.DB.prepare(`SELECT COUNT(*) as c, COALESCE(SUM(duration_seconds), 0) as total_sec FROM project_time_entries WHERE project_id = ?`).bind(PROJECT_ID).first()),
      safe(env.DB.prepare(`SELECT provider, SUM(amount_usd) as total FROM spend_ledger GROUP BY provider ORDER BY total DESC LIMIT 5`).all()),
    ]);

    const spendTotal = sum(spendRow, 'total');
    const providers = (providersResult?.results || providersResult || []).map((r) => ({ provider: r.provider || 'unknown', total: Number(r.total || 0) }));
    const dbHealth = (num(txCountRow) + num(spendRow, 'entries') + (deployRow ? 1 : 0)) > 0 ? 'ok' : 'no_data';

    return jsonResponse({
      success: true,
      db_health: dbHealth,
      finance_transactions_count: num(txCountRow),
      spend_ledger_entries: num(spendRow, 'entries'),
      spend_ledger_total: spendTotal,
      active_clients: num(clientsRow),
      monthly_net: null,
      financial_health: {
        total_in_all_time: 0,
        total_out_all_time: spendTotal,
        date_range: null,
        source_accounts_tracked: 0,
      },
      infrastructure_spend_by_provider: providers,
      revenue_clients: { total_clients: num(clientsRow), active_streams: 0 },
      pipeline_runs: 0,
      agent_conversations: num(agentTelemetryRow),
      agent_last_activity: agentTelemetryRow?.last_at ? String(agentTelemetryRow.last_at).slice(0, 19) : null,
      latest_migration: deployRow ? { name: deployRow.deployment_id?.slice(0, 8) || 'deploy', applied_at: deployRow.deployed_at } : null,
    });
  } catch (e) {
    console.warn('Overview stats error:', e?.message);
    return jsonResponse(overviewStatsPayload({ db_health: 'error' }), 200);
  }
}

async function handleTimeTrack(request, url, env) {
  const session = await getSession(env, request);
  if (!session) return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  if (!env.DB) return jsonResponse({ success: false, error: 'DB unavailable' }, 503);

  const pathSeg = pathToSegments(url.pathname);
  let action = pathSeg[pathSeg.length - 1];
  if (action === 'time-track' || !action) action = url.searchParams.get('action') || 'heartbeat';
  const userId = session.user_id;

  try {
    if (action === 'start') {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO project_time_entries (id, user_id, project_id, session_id, start_time, end_time, duration_seconds, is_active, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, datetime('now'))`
      ).bind(id, userId, PROJECT_ID, session.id, now, null, 'dashboard_session').run();
      return jsonResponse({ success: true, entry_id: id, started_at: now });
    }

    if (action === 'end') {
      const res = await env.DB.prepare(
        `UPDATE project_time_entries SET end_time = datetime('now'), duration_seconds = (julianday('now') - julianday(start_time)) * 86400, is_active = 0 WHERE user_id = ? AND project_id = ? AND is_active = 1`
      ).bind(userId, PROJECT_ID).run();
      return jsonResponse({ success: true, updated: res.meta?.changes ?? 0 });
    }

    if (action === 'heartbeat') {
      const now = new Date().toISOString();
      const active = await env.DB.prepare(
        `SELECT id FROM project_time_entries WHERE user_id = ? AND project_id = ? AND is_active = 1 LIMIT 1`
      ).bind(userId, PROJECT_ID).first();
      if (active) {
        await env.DB.prepare(
          `UPDATE project_time_entries SET duration_seconds = (julianday('now') - julianday(start_time)) * 86400 WHERE id = ?`
        ).bind(active.id).run();
        return jsonResponse({ success: true, entry_id: active.id, duration_updated: true });
      }
      const id = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT INTO project_time_entries (id, user_id, project_id, session_id, start_time, end_time, duration_seconds, is_active, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, datetime('now'))`
      ).bind(id, userId, PROJECT_ID, session.id, now, null, 'dashboard_heartbeat').run();
      return jsonResponse({ success: true, entry_id: id, started_at: now });
    }

    return jsonResponse({ success: false, error: 'Invalid action' }, 400);
  } catch (e) {
    console.warn('Time track error:', e?.message);
    return jsonResponse({ success: false, error: String(e?.message) }, 500);
  }
}

function pathToSegments(pathname) {
  return pathname.replace(/\/$/, '').split('/').filter(Boolean);
}

async function handleColorsAll(request, env) {
  const payload = {
    success: true,
    providers: [
      { slug: 'google_one', display_name: 'Google One', primary_color: '#FF2BD6', text_on_color: '#0f1117' },
      { slug: 'cloudflare', display_name: 'Cloudflare', primary_color: '#F38020', text_on_color: '#ffffff' },
      { slug: 'google_workspace', display_name: 'Google Workspace', primary_color: '#FBBC04', text_on_color: '#0f1117' },
      { slug: 'resend', display_name: 'Resend', primary_color: '#22C55E', text_on_color: '#0f1117' },
    ],
    accounts: [],
    tenants: [],
    paymentSources: [
      { slug: 'venmo', display_name: 'Venmo', primary_color: '#008CFF', text_on_color: '#ffffff' },
      { slug: 'stripe', display_name: 'Stripe', primary_color: '#635BFF', text_on_color: '#ffffff' },
    ],
  };
  return jsonResponse(payload);
}

const FINANCE_TENANT = 'system';
function safeQuery(env, fn) {
  if (!env.DB) return Promise.resolve(null);
  return fn().catch(() => null);
}

async function handleFinance(request, url, env) {
  const pathSeg = pathToSegments(url.pathname);
  const subPath = pathSeg.slice(2).join('/');
  const method = (request.method || 'GET').toUpperCase();
  const params = url.searchParams;

  if (pathSeg[2] === 'transactions' && pathSeg[3] && method === 'GET') {
    return handleFinanceTransactionGet(request, url, env, pathSeg[3]);
  }
  if (pathSeg[2] === 'transactions' && pathSeg[3] && (method === 'PUT' || method === 'DELETE')) {
    return handleFinanceTransactionMutate(request, env, pathSeg[3], method);
  }
  if (pathSeg[2] === 'transactions' && method === 'GET') {
    return handleFinanceTransactionsList(request, url, env);
  }
  if (pathSeg[2] === 'transactions' && method === 'POST') {
    return handleFinanceTransactionCreate(request, env);
  }

  switch (subPath.split('/')[0]) {
    case 'summary':
      return handleFinanceSummary(url, env);
    case 'health':
      return handleFinanceHealth(env);
    case 'breakdown':
      return handleFinanceBreakdown(url, env);
    case 'categories':
      return handleFinanceCategories(env);
    case 'accounts':
      return handleFinanceAccounts(env);
    case 'mrr':
      return handleFinanceMrr(env);
    case 'ai-spend':
      return handleFinanceAiSpend(url, env);
    default:
      return jsonResponse({ success: false, error: 'Not found' }, 404);
  }
}

async function handleFinanceSummary(url, env) {
  const month = url.searchParams.get('month') || '';
  const safe = (p) => (p ? p.catch(() => null) : Promise.resolve(null));
  let income = 0, expenses = 0, txCount = 0;
  const monthStart = month ? `date('${month}-01')` : `date('1900-01-01')`;
  const monthEnd = month ? `date('${month}-01','+1 month','-1 day')` : `date('now','+1 year')`;

  const txTable = await safe(env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='finance_transactions'").first());
  if (txTable && env.DB) {
    const inRow = await safe(env.DB.prepare(
      `SELECT COALESCE(SUM(amount_cents),0)/100.0 as total FROM finance_transactions WHERE date >= ${monthStart} AND date <= ${monthEnd} AND (direction = 'credit' OR transaction_type = 'credit')`
    ).first());
    const outRow = await safe(env.DB.prepare(
      `SELECT COALESCE(SUM(amount_cents),0)/100.0 as total FROM finance_transactions WHERE date >= ${monthStart} AND date <= ${monthEnd} AND (direction = 'debit' OR transaction_type = 'debit')`
    ).first());
    const countRow = await safe(env.DB.prepare(
      `SELECT COUNT(*) as c FROM finance_transactions WHERE date >= ${monthStart} AND date <= ${monthEnd}`
    ).first());
    income = Number(inRow?.total ?? 0);
    expenses = Number(outRow?.total ?? 0);
    txCount = Number(countRow?.c ?? 0);
  }
  const spendRow = await safe(env.DB?.prepare(
    `SELECT COALESCE(SUM(amount_usd),0) as total FROM spend_ledger WHERE (tenant_id IS NULL OR tenant_id = ?) AND date >= ${monthStart} AND date <= ${monthEnd}`
  )?.bind(FINANCE_TENANT).first());
  if (spendRow?.total != null) expenses += Number(spendRow.total);

  return jsonResponse({
    success: true,
    data: { income, expenses, net: income - expenses, tx_count: txCount },
    income, expenses, net: income - expenses, tx_count: txCount,
  });
}

async function handleFinanceHealth(env) {
  const safe = (p) => (p ? p.catch(() => null) : Promise.resolve(null));
  let totalIn = 0, totalOut = 0;
  const inRow = await safe(env.DB?.prepare(
    `SELECT COALESCE(SUM(amount_cents),0)/100.0 as total FROM finance_transactions WHERE direction = 'credit' OR transaction_type = 'credit'`
  ).first());
  const outRow = await safe(env.DB?.prepare(
    `SELECT COALESCE(SUM(amount_cents),0)/100.0 as total FROM finance_transactions WHERE direction = 'debit' OR transaction_type = 'debit'`
  ).first());
  const spendRow = await safe(env.DB?.prepare(
    `SELECT COALESCE(SUM(amount_usd),0) as total FROM spend_ledger`
  ).first());
  totalIn = Number(inRow?.total ?? 0);
  totalOut = Number(outRow?.total ?? 0) + Number(spendRow?.total ?? 0);
  return jsonResponse({
    success: true,
    total_in_all_time: totalIn,
    total_out_all_time: totalOut,
    date_range: null,
    source_accounts_tracked: 0,
  });
}

async function handleFinanceBreakdown(url, env) {
  const month = url.searchParams.get('month') || '';
  const safe = (p) => (p ? p.catch(() => null) : Promise.resolve(null));
  const monthStart = month ? `date('${month}-01')` : `date('1900-01-01')`;
  const monthEnd = month ? `date('${month}-01','+1 month','-1 day')` : `date('now','+1 year')`;
  const result = await safe(env.DB?.prepare(
    `SELECT COALESCE(category, 'Uncategorized') as category_name, direction, SUM(amount_cents)/100.0 as total_cents FROM finance_transactions WHERE date >= ${monthStart} AND date <= ${monthEnd} GROUP BY category, direction`
  ).all());
  const data = (result?.results || result || []).map((r) => ({
    category_name: r.category_name,
    direction: r.direction || 'debit',
    total_cents: Number(r.total_cents || 0),
    total: Number(r.total_cents || 0),
  }));
  return jsonResponse({ success: true, data });
}

async function handleFinanceCategories(env) {
  const safe = (p) => (p ? p.catch(() => null) : Promise.resolve(null));
  const result = await safe(env.DB?.prepare(
    `SELECT DISTINCT id, name as category_name, color as category_color FROM finance_categories LIMIT 100`
  ).all());
  const data = (result?.results || result || []).map((r) => ({
    id: r.id,
    category_name: r.category_name,
    category_color: r.category_color,
  }));
  if (data.length === 0) {
    return jsonResponse({ success: true, data: [{ id: 'other', category_name: 'Other', category_color: '#6b7280' }] });
  }
  return jsonResponse({ success: true, data });
}

async function handleFinanceAccounts(env) {
  const safe = (p) => (p ? p.catch(() => null) : Promise.resolve(null));
  const result = await safe(env.DB?.prepare(
    `SELECT id, name as display_name, email FROM financial_accounts LIMIT 100`
  ).all());
  const data = (result?.results || result || []).map((r) => ({
    id: r.id,
    display_name: r.display_name,
    email: r.email,
  }));
  return jsonResponse({ success: true, data: data.length ? data : [] });
}

async function handleFinanceMrr(env) {
  return jsonResponse({ success: true, mrr: 0, trend: [] });
}

async function handleFinanceAiSpend(url, env) {
  const scope = url.searchParams.get('scope') || '';
  const safe = (p) => (p ? p.catch(() => null) : Promise.resolve(null));
  const row = await safe(env.DB?.prepare(
    `SELECT COALESCE(SUM(amount_usd),0) as total, COUNT(*) as count FROM spend_ledger WHERE category IN ('ai_tools','usage') OR provider IS NOT NULL`
  ).first());
  const total_usd = Number(row?.total ?? 0);
  const count = Number(row?.count ?? 0);
  // Optional: return rows for usage table (agent dashboard expects summary + rows)
  let rows = [];
  try {
    const list = await safe(env.DB?.prepare(
      `SELECT occurred_at, provider_slug, amount_usd, description, notes FROM spend_ledger WHERE category IN ('ai_tools','usage') OR provider IS NOT NULL ORDER BY occurred_at DESC LIMIT 50`
    ).all());
    const res = list?.results ?? list ?? [];
    rows = Array.isArray(res) ? res.map((r) => ({
      occurred_at: r.occurred_at,
      provider_slug: r.provider_slug || r.provider,
      amount_usd: r.amount_usd,
      description: r.description,
      service: r.description,
      notes: r.notes,
    })) : [];
  } catch (_) {}
  return jsonResponse({
    success: true,
    total_usd,
    count,
    by_provider: [],
    summary: { total_this_month: total_usd },
    rows,
  });
}

async function handleFinanceTransactionsList(request, url, env) {
  const params = url.searchParams;
  const month = params.get('month') || '';
  const limit = Math.min(Number(params.get('limit')) || 50, 100);
  const offset = Number(params.get('offset')) || 0;
  const direction = params.get('direction');
  const search = params.get('search') || '';

  const safe = (p) => (p ? p.catch(() => null) : Promise.resolve(null));
  const monthStart = month ? `date('${month}-01')` : `date('1900-01-01')`;
  const monthEnd = month ? `date('${month}-01','+1 month','-1 day')` : `date('now','+1 year')`;

  let where = ` date >= ${monthStart} AND date <= ${monthEnd}`;
  const bindings = [];
  if (direction) {
    where += ` AND (direction = ? OR transaction_type = ?)`;
    bindings.push(direction, direction);
  }
  if (search) {
    where += ` AND (merchant LIKE ? OR description LIKE ?)`;
    const q = `%${search.replace(/%/g, '\\%')}%`;
    bindings.push(q, q);
  }

  let total = 0;
  let data = [];
  try {
    const countRow = await safe(env.DB?.prepare(
      `SELECT COUNT(*) as c FROM finance_transactions WHERE ${where}`
    ).bind(...bindings).first());
    total = Number(countRow?.c ?? 0);

    const list = await safe(env.DB?.prepare(
      `SELECT id, date, direction, amount_cents, merchant, description FROM finance_transactions WHERE ${where} ORDER BY date DESC, id DESC LIMIT ? OFFSET ?`
    ).bind(...bindings, limit, offset).all());
    data = (list?.results || list || []).map((r) => ({
      id: r.id,
      transaction_date: r.date,
      date: r.date,
      direction: r.direction || r.transaction_type,
      transaction_type: r.direction,
      amount_cents: r.amount_cents,
      merchant: r.merchant,
      description: r.description,
      category: r.category,
      category_name: r.category_name,
      category_color: r.category_color,
      account_id: r.account_id,
      account_name: r.account_name,
      bank_name: r.bank_name,
    }));
  } catch (e) {
    console.warn('Finance transactions list error:', e?.message);
  }

  return jsonResponse({ success: true, data, total, offset, limit });
}

async function handleFinanceTransactionGet(request, url, env, id) {
  const safe = (p) => (p ? p.catch(() => null) : Promise.resolve(null));
  const row = await safe(env.DB?.prepare(
    `SELECT id, date, direction, transaction_type, amount_cents, merchant, description, category FROM finance_transactions WHERE id = ?`
  ).bind(id).first());
  if (!row) return jsonResponse({ success: false, error: 'Not found' }, 404);
  return jsonResponse({ success: true, data: row });
}

async function handleFinanceTransactionCreate(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ success: false, error: 'Invalid JSON' }, 400);
  }
  const id = crypto.randomUUID();
  const date = body.date || new Date().toISOString().slice(0, 10);
  const direction = body.direction || body.transaction_type || 'debit';
  const amountCents = body.amount_cents != null ? Number(body.amount_cents) : Math.round(Number(body.amount || 0) * 100);
  const merchant = body.merchant || body.description || '';
  const description = body.description || merchant;
  if (!env.DB) return jsonResponse({ success: false, error: 'DB unavailable' }, 503);
  try {
    await env.DB.prepare(
      `INSERT INTO finance_transactions (id, tenant_id, date, direction, amount_cents, merchant, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(id, FINANCE_TENANT, date, direction, amountCents, merchant, description).run();
  } catch (e) {
    return jsonResponse({ success: false, error: String(e?.message) }, 500);
  }
  return jsonResponse({ success: true, data: { id, date, direction, amount_cents: amountCents, merchant, description } });
}

async function handleFinanceTransactionMutate(request, env, id, method) {
  if (!env.DB) return jsonResponse({ success: false, error: 'DB unavailable' }, 503);
  if (method === 'DELETE') {
    try {
      await env.DB.prepare(`DELETE FROM finance_transactions WHERE id = ?`).bind(id).run();
      return jsonResponse({ success: true });
    } catch (e) {
      return jsonResponse({ success: false, error: String(e?.message) }, 500);
    }
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ success: false, error: 'Invalid JSON' }, 400);
  }
  const date = body.date || body.transaction_date;
  const direction = body.direction || body.transaction_type;
  const amountCents = body.amount_cents != null ? Number(body.amount_cents) : null;
  const merchant = body.merchant;
  const description = body.description;
  const updates = [];
  const bindings = [];
  if (date) { updates.push('date = ?'); bindings.push(date); }
  if (direction) { updates.push('direction = ?'); bindings.push(direction); }
  if (amountCents != null) { updates.push('amount_cents = ?'); bindings.push(amountCents); }
  if (merchant != null) { updates.push('merchant = ?'); bindings.push(merchant); }
  if (description != null) { updates.push('description = ?'); bindings.push(description); }
  if (!updates.length) return jsonResponse({ success: true });
  bindings.push(id);
  try {
    await env.DB.prepare(
      `UPDATE finance_transactions SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...bindings).run();
    return jsonResponse({ success: true });
  } catch (e) {
    return jsonResponse({ success: false, error: String(e?.message) }, 500);
  }
}

async function handleGoogleOAuthStart(request, url, env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET || !env.SESSION_CACHE) {
    return new Response(JSON.stringify({ error: 'OAuth not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
  const state = crypto.randomUUID();
  const redirectUri = `${origin(url)}/api/oauth/google/callback`;
  await env.SESSION_CACHE.put(`oauth_state_${state}`, redirectUri, { expirationTtl: OAUTH_STATE_TTL });
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
}

async function handleGoogleOAuthCallback(request, url, env) {
  const { searchParams } = url;
  const state = searchParams.get('state');
  const code = searchParams.get('code');
  if (!state || !code || !env.SESSION_CACHE || !env.DB) {
    return Response.redirect(`${origin(url)}/auth/signin?error=missing`, 302);
  }
  const cachedRedirect = await env.SESSION_CACHE.get(`oauth_state_${state}`);
  await env.SESSION_CACHE.delete(`oauth_state_${state}`);
  if (!cachedRedirect) {
    return Response.redirect(`${origin(url)}/auth/signin?error=invalid_state`, 302);
  }
  // Use the exact redirect_uri from the start request (avoids www vs non-www mismatch)
  const redirectUri = cachedRedirect;
  if (!env.GOOGLE_OAUTH_CLIENT_SECRET || !env.GOOGLE_CLIENT_ID) {
    return Response.redirect(`${origin(url)}/auth/signin?error=token_failed&reason=invalid_client&hint=secret_or_id_not_configured`, 302);
  }
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    let reason = 'unknown';
    try {
      const errJson = JSON.parse(errBody);
      const code = (errJson.error || '').toString().toLowerCase();
      const allowed = ['invalid_grant', 'invalid_client', 'invalid_request', 'unauthorized_client', 'unsupported_grant_type', 'invalid_scope'];
      if (allowed.includes(code)) reason = code;
    } catch (_) {}
    return Response.redirect(`${origin(url)}/auth/signin?error=token_failed&reason=${encodeURIComponent(reason)}`, 302);
  }
  const tokens = await tokenRes.json();
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) {
    return Response.redirect(`${origin(url)}/auth/signin?error=userinfo_failed`, 302);
  }
  const userInfo = await userRes.json();
  const email = (userInfo.email || '').toLowerCase();
  const name = userInfo.name || email || 'User';
  if (!email) {
    return Response.redirect(`${origin(url)}/auth/signin?error=no_email`, 302);
  }
  const userId = email;
  const oauthPlaceholder = 'oauth';
  try {
    await env.DB.prepare(
      `INSERT INTO auth_users (id, email, name, password_hash, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(userId, email, name, oauthPlaceholder, oauthPlaceholder).run();
  } catch (e) {
    await env.DB.prepare(`UPDATE auth_users SET name = ?, updated_at = datetime('now') WHERE id = ?`).bind(name, userId).run();
  }
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const ip = request.headers.get('cf-connecting-ip') || '';
  const ua = request.headers.get('user-agent') || '';
  await env.DB.prepare(
    `INSERT INTO auth_sessions (id, user_id, expires_at, created_at, ip_address, user_agent) VALUES (?, ?, ?, datetime('now'), ?, ?)`
  ).bind(sessionId, userId, expiresAt, ip, ua).run();
  const headers = new Headers({ Location: `${origin(url)}/dashboard/overview` });
  headers.append('Set-Cookie', `session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`);
  return new Response(null, { status: 302, headers });
}

async function handleGitHubOAuthStart(request, url, env) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.SESSION_CACHE) {
    return new Response(JSON.stringify({ error: 'OAuth not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
  const state = crypto.randomUUID();
  const redirectUri = `${origin(url)}/api/oauth/github/callback`;
  await env.SESSION_CACHE.put(`oauth_state_github_${state}`, redirectUri, { expirationTtl: OAUTH_STATE_TTL });
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'user:email read:user',
    state,
  });
  return Response.redirect(`https://github.com/login/oauth/authorize?${params}`, 302);
}

async function handleGitHubOAuthCallback(request, url, env) {
  const { searchParams } = url;
  const state = searchParams.get('state');
  const code = searchParams.get('code');
  if (!state || !code || !env.SESSION_CACHE || !env.DB) {
    return Response.redirect(`${origin(url)}/auth/signin?error=missing`, 302);
  }
  const cachedRedirect = await env.SESSION_CACHE.get(`oauth_state_github_${state}`);
  await env.SESSION_CACHE.delete(`oauth_state_github_${state}`);
  if (!cachedRedirect) {
    return Response.redirect(`${origin(url)}/auth/signin?error=invalid_state`, 302);
  }
  const redirectUri = cachedRedirect;
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenRes.ok) {
    return Response.redirect(`${origin(url)}/auth/signin?error=token_failed`, 302);
  }
  const tokens = await tokenRes.json();
  if (tokens.error) {
    return Response.redirect(`${origin(url)}/auth/signin?error=token_failed`, 302);
  }
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) {
    return Response.redirect(`${origin(url)}/auth/signin?error=userinfo_failed`, 302);
  }
  const userInfo = await userRes.json();
  let email = userInfo.email;
  if (!email && userInfo.login) {
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (emailRes.ok) {
      const emails = await emailRes.json();
      const primary = emails.find((e) => e.primary) || emails[0];
      email = primary?.email;
    }
  }
  email = (email || userInfo.login || 'unknown').toLowerCase();
  const name = userInfo.name || userInfo.login || email;
  const userId = email;
  const oauthPlaceholder = 'oauth';
  try {
    await env.DB.prepare(
      `INSERT INTO auth_users (id, email, name, password_hash, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(userId, email, name, oauthPlaceholder, oauthPlaceholder).run();
  } catch (e) {
    await env.DB.prepare(`UPDATE auth_users SET name = ?, updated_at = datetime('now') WHERE id = ?`).bind(name, userId).run();
  }
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const ip = request.headers.get('cf-connecting-ip') || '';
  const ua = request.headers.get('user-agent') || '';
  await env.DB.prepare(
    `INSERT INTO auth_sessions (id, user_id, expires_at, created_at, ip_address, user_agent) VALUES (?, ?, ?, datetime('now'), ?, ?)`
  ).bind(sessionId, userId, expiresAt, ip, ua).run();
  const headers = new Headers({ Location: `${origin(url)}/dashboard/overview` });
  headers.append('Set-Cookie', `session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`);
  return new Response(null, { status: 302, headers });
}
