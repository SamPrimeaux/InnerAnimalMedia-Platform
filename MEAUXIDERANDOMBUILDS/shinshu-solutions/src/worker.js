/**
 * Shinshu Solutions API Worker
 * Cloudflare Worker for Shinshu Solutions business management
 */

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper: JSON Response
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...headers,
    },
  });
}

// Helper: Generate ID
function generateId(prefix = '') {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Get current timestamp
function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

// Helper: Hash password using Web Crypto API (compatible with OAuth)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  // Add salt-like prefix for better security (can be enhanced with proper salt)
  return `sha256:${hashHex}`;
}

// Helper: Verify password
async function verifyPassword(password, hash) {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

// Helper: Generate session token
function generateSessionToken() {
  return crypto.randomUUID() + '-' + Math.random().toString(36).substr(2, 16);
}

// Helper: Check authentication from cookie
async function checkAuth(request, env) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('='))
  );
  const sessionToken = cookies['shinshu_session'];

  if (!sessionToken) return null;

  // Check session in database
  const session = await env.DB.prepare(
    'SELECT * FROM user_sessions WHERE session_token = ? AND expires_at > ?'
  ).bind(sessionToken, getTimestamp()).first();

  if (!session) return null;

  // Get user
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').bind(session.user_id).first();
  return user;
}

// ============================================
// API HANDLERS
// ============================================

// Clients API
async function handleClients(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace('/api/clients', '');

  if (method === 'GET') {
    if (path === '' || path === '/') {
      // List all clients
      const { results } = await env.DB.prepare(
        'SELECT * FROM clients ORDER BY created_at DESC'
      ).all();
      return jsonResponse({ success: true, data: results || [] });
    } else {
      // Get single client
      const id = path.replace('/', '');
      const client = await env.DB.prepare(
        'SELECT * FROM clients WHERE id = ?'
      ).bind(id).first();

      if (!client) {
        return jsonResponse({ success: false, error: 'Client not found' }, 404);
      }
      return jsonResponse({ success: true, data: client });
    }
  }

  if (method === 'POST') {
    const body = await request.json();
    const id = generateId('client-');
    const now = getTimestamp();

    await env.DB.prepare(`
      INSERT INTO clients (id, name, email, phone, company, address, city, state, zip, country, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.name || '',
      body.email || null,
      body.phone || null,
      body.company || null,
      body.address || null,
      body.city || null,
      body.state || null,
      body.zip || null,
      body.country || 'USA',
      body.status || 'active',
      body.notes || null,
      now,
      now
    ).run();

    const client = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: client }, 201);
  }

  if (method === 'PUT') {
    const id = path.replace('/', '');
    const body = await request.json();
    const now = getTimestamp();

    await env.DB.prepare(`
      UPDATE clients 
      SET name = ?, email = ?, phone = ?, company = ?, address = ?, city = ?, state = ?, zip = ?, country = ?, status = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name,
      body.email || null,
      body.phone || null,
      body.company || null,
      body.address || null,
      body.city || null,
      body.state || null,
      body.zip || null,
      body.country || 'USA',
      body.status || 'active',
      body.notes || null,
      now,
      id
    ).run();

    const client = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: client });
  }

  if (method === 'DELETE') {
    const id = path.replace('/', '');
    await env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true, message: 'Client deleted' });
  }

  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}

// Properties API
async function handleProperties(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace('/api/properties', '');

  if (method === 'GET') {
    if (path === '' || path === '/') {
      const clientId = url.searchParams.get('client_id');
      let query = 'SELECT * FROM properties ORDER BY created_at DESC';
      let params = [];

      if (clientId) {
        query = 'SELECT * FROM properties WHERE client_id = ? ORDER BY created_at DESC';
        params = [clientId];
      }

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, data: results || [] });
    } else {
      const id = path.replace('/', '');
      const property = await env.DB.prepare('SELECT * FROM properties WHERE id = ?').bind(id).first();

      if (!property) {
        return jsonResponse({ success: false, error: 'Property not found' }, 404);
      }
      return jsonResponse({ success: true, data: property });
    }
  }

  if (method === 'POST') {
    const body = await request.json();
    const id = generateId('prop-');
    const now = getTimestamp();

    await env.DB.prepare(`
      INSERT INTO properties (id, client_id, name, address, city, state, zip, property_type, square_feet, bedrooms, bathrooms, lot_size, year_built, status, listing_price, current_value, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.client_id || null,
      body.name || '',
      body.address || '',
      body.city || '',
      body.state || '',
      body.zip || '',
      body.property_type || null,
      body.square_feet || null,
      body.bedrooms || null,
      body.bathrooms || null,
      body.lot_size || null,
      body.year_built || null,
      body.status || 'active',
      body.listing_price || null,
      body.current_value || null,
      body.notes || null,
      now,
      now
    ).run();

    const property = await env.DB.prepare('SELECT * FROM properties WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: property }, 201);
  }

  if (method === 'PUT') {
    const id = path.replace('/', '');
    const body = await request.json();
    const now = getTimestamp();

    await env.DB.prepare(`
      UPDATE properties 
      SET client_id = ?, name = ?, address = ?, city = ?, state = ?, zip = ?, property_type = ?, square_feet = ?, bedrooms = ?, bathrooms = ?, lot_size = ?, year_built = ?, status = ?, listing_price = ?, current_value = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.client_id || null,
      body.name,
      body.address,
      body.city,
      body.state,
      body.zip,
      body.property_type || null,
      body.square_feet || null,
      body.bedrooms || null,
      body.bathrooms || null,
      body.lot_size || null,
      body.year_built || null,
      body.status || 'active',
      body.listing_price || null,
      body.current_value || null,
      body.notes || null,
      now,
      id
    ).run();

    const property = await env.DB.prepare('SELECT * FROM properties WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: property });
  }

  if (method === 'DELETE') {
    const id = path.replace('/', '');
    await env.DB.prepare('DELETE FROM properties WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true, message: 'Property deleted' });
  }

  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}

// Projects API
async function handleProjects(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace('/api/projects', '');

  if (method === 'GET') {
    if (path === '' || path === '/') {
      const clientId = url.searchParams.get('client_id');
      const propertyId = url.searchParams.get('property_id');
      const status = url.searchParams.get('status');

      let query = 'SELECT * FROM projects ORDER BY created_at DESC';
      let params = [];

      if (clientId) {
        query = 'SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC';
        params = [clientId];
      } else if (propertyId) {
        query = 'SELECT * FROM projects WHERE property_id = ? ORDER BY created_at DESC';
        params = [propertyId];
      }

      if (status) {
        query = query.replace('ORDER BY', `WHERE status = ? ORDER BY`);
        params.push(status);
      }

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, data: results || [] });
    } else {
      const id = path.replace('/', '');
      const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();

      if (!project) {
        return jsonResponse({ success: false, error: 'Project not found' }, 404);
      }
      return jsonResponse({ success: true, data: project });
    }
  }

  if (method === 'POST') {
    const body = await request.json();
    const id = generateId('proj-');
    const now = getTimestamp();

    await env.DB.prepare(`
      INSERT INTO projects (id, client_id, property_id, name, description, project_type, status, start_date, end_date, budget, actual_cost, priority, assigned_to, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.client_id || null,
      body.property_id || null,
      body.name || '',
      body.description || null,
      body.project_type || null,
      body.status || 'planning',
      body.start_date || null,
      body.end_date || null,
      body.budget || null,
      body.actual_cost || null,
      body.priority || 'medium',
      body.assigned_to || null,
      body.notes || null,
      now,
      now
    ).run();

    const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: project }, 201);
  }

  if (method === 'PUT') {
    const id = path.replace('/', '');
    const body = await request.json();
    const now = getTimestamp();

    await env.DB.prepare(`
      UPDATE projects 
      SET client_id = ?, property_id = ?, name = ?, description = ?, project_type = ?, status = ?, start_date = ?, end_date = ?, budget = ?, actual_cost = ?, priority = ?, assigned_to = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.client_id || null,
      body.property_id || null,
      body.name,
      body.description || null,
      body.project_type || null,
      body.status || 'planning',
      body.start_date || null,
      body.end_date || null,
      body.budget || null,
      body.actual_cost || null,
      body.priority || 'medium',
      body.assigned_to || null,
      body.notes || null,
      now,
      id
    ).run();

    const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: project });
  }

  if (method === 'DELETE') {
    const id = path.replace('/', '');
    await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true, message: 'Project deleted' });
  }

  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}

// Services API
async function handleServices(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace('/api/services', '');

  if (method === 'GET') {
    if (path === '' || path === '/') {
      const projectId = url.searchParams.get('project_id');
      let query = 'SELECT * FROM services ORDER BY created_at DESC';
      let params = [];

      if (projectId) {
        query = 'SELECT * FROM services WHERE project_id = ? ORDER BY created_at DESC';
        params = [projectId];
      }

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, data: results || [] });
    } else {
      const id = path.replace('/', '');
      const service = await env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(id).first();

      if (!service) {
        return jsonResponse({ success: false, error: 'Service not found' }, 404);
      }
      return jsonResponse({ success: true, data: service });
    }
  }

  if (method === 'POST') {
    const body = await request.json();
    const id = generateId('svc-');
    const now = getTimestamp();
    const totalPrice = (body.unit_price || 0) * (body.quantity || 1);

    await env.DB.prepare(`
      INSERT INTO services (id, project_id, name, description, service_type, status, unit_price, quantity, total_price, start_date, end_date, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.project_id || null,
      body.name || '',
      body.description || null,
      body.service_type || null,
      body.status || 'pending',
      body.unit_price || 0,
      body.quantity || 1,
      totalPrice,
      body.start_date || null,
      body.end_date || null,
      body.notes || null,
      now,
      now
    ).run();

    const service = await env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: service }, 201);
  }

  if (method === 'PUT') {
    const id = path.replace('/', '');
    const body = await request.json();
    const now = getTimestamp();
    const totalPrice = (body.unit_price || 0) * (body.quantity || 1);

    await env.DB.prepare(`
      UPDATE services 
      SET project_id = ?, name = ?, description = ?, service_type = ?, status = ?, unit_price = ?, quantity = ?, total_price = ?, start_date = ?, end_date = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.project_id || null,
      body.name,
      body.description || null,
      body.service_type || null,
      body.status || 'pending',
      body.unit_price || 0,
      body.quantity || 1,
      totalPrice,
      body.start_date || null,
      body.end_date || null,
      body.notes || null,
      now,
      id
    ).run();

    const service = await env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: service });
  }

  if (method === 'DELETE') {
    const id = path.replace('/', '');
    await env.DB.prepare('DELETE FROM services WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true, message: 'Service deleted' });
  }

  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}

// Contacts API
async function handleContacts(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace('/api/contacts', '');

  if (method === 'GET') {
    if (path === '' || path === '/') {
      const clientId = url.searchParams.get('client_id');
      let query = 'SELECT * FROM contacts ORDER BY created_at DESC';
      let params = [];

      if (clientId) {
        query = 'SELECT * FROM contacts WHERE client_id = ? ORDER BY created_at DESC';
        params = [clientId];
      }

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, data: results || [] });
    } else {
      const id = path.replace('/', '');
      const contact = await env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first();

      if (!contact) {
        return jsonResponse({ success: false, error: 'Contact not found' }, 404);
      }
      return jsonResponse({ success: true, data: contact });
    }
  }

  if (method === 'POST') {
    const body = await request.json();
    const id = generateId('contact-');
    const now = getTimestamp();

    await env.DB.prepare(`
      INSERT INTO contacts (id, client_id, first_name, last_name, email, phone, title, role, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.client_id || null,
      body.first_name || '',
      body.last_name || '',
      body.email || null,
      body.phone || null,
      body.title || null,
      body.role || null,
      body.notes || null,
      now,
      now
    ).run();

    const contact = await env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: contact }, 201);
  }

  if (method === 'PUT') {
    const id = path.replace('/', '');
    const body = await request.json();
    const now = getTimestamp();

    await env.DB.prepare(`
      UPDATE contacts 
      SET client_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?, title = ?, role = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.client_id || null,
      body.first_name,
      body.last_name,
      body.email || null,
      body.phone || null,
      body.title || null,
      body.role || null,
      body.notes || null,
      now,
      id
    ).run();

    const contact = await env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: contact });
  }

  if (method === 'DELETE') {
    const id = path.replace('/', '');
    await env.DB.prepare('DELETE FROM contacts WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true, message: 'Contact deleted' });
  }

  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}

// Documents API
async function handleDocuments(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace('/api/documents', '');

  if (method === 'GET') {
    if (path === '' || path === '/') {
      const clientId = url.searchParams.get('client_id');
      const propertyId = url.searchParams.get('property_id');
      const projectId = url.searchParams.get('project_id');

      let query = 'SELECT * FROM documents ORDER BY created_at DESC';
      let params = [];

      if (clientId) {
        query = 'SELECT * FROM documents WHERE client_id = ? ORDER BY created_at DESC';
        params = [clientId];
      } else if (propertyId) {
        query = 'SELECT * FROM documents WHERE property_id = ? ORDER BY created_at DESC';
        params = [propertyId];
      } else if (projectId) {
        query = 'SELECT * FROM documents WHERE project_id = ? ORDER BY created_at DESC';
        params = [projectId];
      }

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, data: results || [] });
    } else if (path.startsWith('/download/')) {
      // Download document from R2
      const id = path.replace('/download/', '');
      const doc = await env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first();

      if (!doc) {
        return jsonResponse({ success: false, error: 'Document not found' }, 404);
      }

      try {
        const object = await env.DOCUMENTS.get(doc.r2_key);
        if (!object) {
          return jsonResponse({ success: false, error: 'File not found in storage' }, 404);
        }

        return new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${doc.file_name}"`,
            ...corsHeaders,
          },
        });
      } catch (error) {
        return jsonResponse({ success: false, error: 'Error retrieving file' }, 500);
      }
    } else {
      const id = path.replace('/', '');
      const doc = await env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first();

      if (!doc) {
        return jsonResponse({ success: false, error: 'Document not found' }, 404);
      }
      return jsonResponse({ success: true, data: doc });
    }
  }

  if (method === 'POST') {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return jsonResponse({ success: false, error: 'No file provided' }, 400);
    }

    const id = generateId('doc-');
    const now = getTimestamp();
    const fileName = formData.get('name') || file.name;
    const fileType = file.type || fileName.split('.').pop();
    const fileSize = file.size;
    const r2Key = `documents/${id}/${fileName}`;
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    await env.DOCUMENTS.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
    });

    // Save to database
    await env.DB.prepare(`
      INSERT INTO documents (id, client_id, property_id, project_id, name, file_name, file_type, file_size, r2_key, category, description, uploaded_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      formData.get('client_id') || null,
      formData.get('property_id') || null,
      formData.get('project_id') || null,
      formData.get('name') || fileName,
      fileName,
      fileType,
      fileSize,
      r2Key,
      formData.get('category') || 'other',
      formData.get('description') || null,
      formData.get('uploaded_by') || null,
      now,
      now
    ).run();

    const doc = await env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: doc }, 201);
  }

  if (method === 'DELETE') {
    const id = path.replace('/', '');
    const doc = await env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first();

    if (doc && doc.r2_key) {
      await env.DOCUMENTS.delete(doc.r2_key).catch(() => { });
    }

    await env.DB.prepare('DELETE FROM documents WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true, message: 'Document deleted' });
  }

  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}

// ============================================
// LOGIN PAGE HTML
// ============================================

// Login page HTML with Mount Bandai mountain theme and transport effect
function getLoginPageHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Shinshu Solutions</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --orange-primary: #FF8C42;
            --orange-dark: #E67635;
            --orange-light: #FFB67A;
            --cream: #FFF8F0;
            --text-dark: #1A1A1A;
            --text-gray: #666;
        }
        body {
            font-family: 'Roboto', sans-serif;
            min-height: 100vh;
            overflow: hidden;
            position: relative;
        }
        .mountain-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&q=90&fit=crop');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            z-index: 1;
            animation: zoomIn 25s ease-in-out infinite alternate;
        }
        .mountain-background::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(255,140,66,0.25) 50%, rgba(0,0,0,0.4) 100%);
            z-index: 2;
        }
        @keyframes zoomIn {
            0% { transform: scale(1); }
            100% { transform: scale(1.15); }
        }
        .login-container {
            position: relative;
            z-index: 10;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            backdrop-filter: blur(1px);
        }
        .login-card {
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(25px);
            border-radius: 24px;
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3);
            padding: 3.5rem;
            max-width: 480px;
            width: 100%;
            animation: slideUp 0.9s cubic-bezier(0.16, 1, 0.3, 1);
            border: 1px solid rgba(255, 255, 255, 0.4);
            position: relative;
        }
        .login-card::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(135deg, var(--orange-primary), var(--orange-dark), var(--orange-primary));
            border-radius: 24px;
            z-index: -1;
            opacity: 0.1;
            animation: borderGlow 3s ease-in-out infinite;
        }
        @keyframes borderGlow {
            0%, 100% { opacity: 0.1; }
            50% { opacity: 0.2; }
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(40px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        .login-header {
            text-align: center;
            margin-bottom: 2.5rem;
        }
        .login-header h1 {
            font-family: 'Roboto Mono', monospace;
            font-size: 2.5rem;
            background: linear-gradient(135deg, var(--orange-primary), var(--orange-dark));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .login-header p {
            color: var(--text-gray);
            font-size: 1.1rem;
            font-weight: 300;
            margin-top: 0.5rem;
        }
        .mountain-icon {
            width: 70px;
            height: 70px;
            margin: 0 auto 1.5rem;
            stroke: var(--orange-primary);
            fill: none;
            stroke-width: 2;
            filter: drop-shadow(0 4px 8px rgba(255, 140, 66, 0.3));
        }
        .summit-badge {
            display: inline-block;
            background: linear-gradient(135deg, rgba(255, 140, 66, 0.15), rgba(230, 118, 53, 0.15));
            border: 1px solid rgba(255, 140, 66, 0.3);
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-size: 0.85rem;
            color: var(--orange-dark);
            font-weight: 600;
            margin-top: 0.5rem;
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--text-dark);
            font-size: 0.95rem;
        }
        .form-group input {
            width: 100%;
            padding: 1.1rem 1.25rem;
            border: 2px solid rgba(0, 0, 0, 0.08);
            border-radius: 12px;
            font-size: 1rem;
            font-family: 'Roboto', sans-serif;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.95);
        }
        .form-group input:focus {
            outline: none;
            border-color: var(--orange-primary);
            box-shadow: 0 0 0 4px rgba(255, 140, 66, 0.15);
            background: white;
        }
        .btn-login {
            width: 100%;
            padding: 1.35rem;
            background: linear-gradient(135deg, var(--orange-light), var(--orange-primary), var(--orange-dark));
            background-size: 200% 200%;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1.15rem;
            font-weight: 600;
            font-family: 'Roboto', sans-serif;
            cursor: pointer;
            transition: all 0.4s ease;
            margin-top: 1rem;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(255, 140, 66, 0.3);
            animation: gradientShift 3s ease infinite;
        }
        @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        .btn-login::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.25);
            transform: translate(-50%, -50%);
            transition: width 0.7s, height 0.7s;
        }
        .btn-login:hover::before {
            width: 350px;
            height: 350px;
        }
        .btn-login:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 35px rgba(255, 140, 66, 0.5);
        }
        .btn-login:active {
            transform: translateY(-1px);
        }
        .btn-login span {
            position: relative;
            z-index: 1;
        }
        .error-message {
            background: rgba(211, 47, 47, 0.1);
            color: #D32F2F;
            padding: 1rem 1.25rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            display: none;
            border: 1px solid rgba(211, 47, 47, 0.2);
            font-size: 0.95rem;
        }
        .error-message.show {
            display: block;
            animation: shake 0.5s;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
        .loading {
            display: none;
            text-align: center;
            color: var(--text-gray);
            margin-top: 1rem;
            font-size: 0.95rem;
        }
        .loading.show {
            display: block;
        }
        .transport-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, var(--orange-primary), var(--orange-dark), #1A1A1A);
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.8s ease;
        }
        .transport-overlay.active {
            opacity: 1;
            pointer-events: all;
        }
        .transport-overlay::after {
            content: '⚡';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 5rem;
            animation: pulse 1.2s ease-in-out infinite;
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8));
        }
        @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.3) rotate(180deg); opacity: 0.8; }
        }
        @media (max-width: 768px) {
            .login-card {
                padding: 2.5rem 2rem;
            }
            .login-header h1 {
                font-size: 2rem;
            }
            .mountain-background {
                animation: zoomIn 20s ease-in-out infinite alternate;
            }
        }
    </style>
</head>
<body>
    <div class="mountain-background"></div>
    <div class="transport-overlay" id="transport-overlay"></div>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <svg class="mountain-icon" viewBox="0 0 24 24">
                    <path d="M3 20l9-9 9 9H3z" />
                    <path d="M3 20h18M12 11v9" />
                    <path d="M6 17l3-3 3 3 3-3 3 3" />
                </svg>
                <h1>SHINSHU SOLUTIONS</h1>
                <p>Enter the Summit</p>
                <div class="summit-badge">Mount Bandai • 1816m</div>
            </div>
            <div class="error-message" id="error-message"></div>
            <form id="login-form">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required autocomplete="email" placeholder="your.email@example.com">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="••••••••">
                </div>
                <button type="submit" class="btn-login" id="login-btn">
                    <span>Begin Journey</span>
                </button>
                <div class="loading" id="loading">Ascending to dashboard...</div>
            </form>
        </div>
    </div>
    <script>
        const form = document.getElementById('login-form');
        const errorMsg = document.getElementById('error-message');
        const loading = document.getElementById('loading');
        const loginBtn = document.getElementById('login-btn');
        const transportOverlay = document.getElementById('transport-overlay');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            errorMsg.classList.remove('show');
            loading.classList.add('show');
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span>Authenticating...</span>';
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Transport effect
                    transportOverlay.classList.add('active');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 900);
                } else {
                    errorMsg.textContent = data.error || 'Invalid credentials. Please try again.';
                    errorMsg.classList.add('show');
                    loading.classList.remove('show');
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<span>Begin Journey</span>';
                }
            } catch (error) {
                errorMsg.textContent = 'Connection error. Please check your network and try again.';
                errorMsg.classList.add('show');
                loading.classList.remove('show');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<span>Begin Journey</span>';
            }
        });
    </script>
</body>
</html>`;
}

// Gallery page HTML (same as gallery.html file content)
function getGalleryPageHTML() {
  // Return the gallery.html content - for now, we'll serve from R2
  // This function is a fallback if R2 file doesn't exist
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mountain Photography Gallery - Jake Waalk | Shinshu Solutions</title>
    <meta name="description" content="Explore Jake Waalk's stunning mountain photography from Nagano Prefecture, Japan.">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Roboto', sans-serif; background: #FFF8F0; padding: 2rem; text-align: center; }
        h1 { font-family: 'Roboto Mono', monospace; color: #FF8C42; margin: 2rem 0; }
        p { color: #666; margin: 1rem 0; }
    </style>
</head>
<body>
    <h1>Gallery Loading...</h1>
    <p>Please upload gallery.html to R2 for full functionality.</p>
</body>
</html>`;
}

// ============================================
// MAIN WORKER
// ============================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Serve static assets from R2
    if (path === '/' || path === '' || path === '/index.html') {
      try {
        const object = await env.DOCUMENTS.get('index.html');
        if (object) {
          return new Response(object.body, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching HTML from R2:', error);
      }
      // Fallback to API info if HTML not found
      return jsonResponse({
        service: 'Shinshu Solutions API',
        status: 'operational',
        version: '1.0.0',
        endpoints: {
          clients: '/api/clients',
          properties: '/api/properties',
          projects: '/api/projects',
          services: '/api/services',
          documents: '/api/documents',
          contacts: '/api/contacts',
        },
      });
    }

    // Serve JavaScript and CSS files from R2
    if (path === '/i18n.js' || path === '/chatbot.js' || path === '/themes.js') {
      try {
        const fileName = path.substring(1); // Remove leading slash
        const object = await env.DOCUMENTS.get(fileName);
        if (object) {
          return new Response(object.body, {
            headers: {
              'Content-Type': 'application/javascript; charset=utf-8',
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error(`Error fetching ${path} from R2:`, error);
      }
      return jsonResponse({ success: false, error: 'File not found' }, 404);
    }

    // Serve CSS files
    if (path === '/theme-styles.css') {
      try {
        const object = await env.DOCUMENTS.get('theme-styles.css');
        if (object) {
          return new Response(object.body, {
            headers: {
              'Content-Type': 'text/css; charset=utf-8',
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching theme-styles.css from R2:', error);
      }
      return jsonResponse({ success: false, error: 'File not found' }, 404);
    }

    // Serve business card page (not indexed)
    if (path === '/business-card' || path === '/business-card.html') {
      try {
        const object = await env.DOCUMENTS.get('business-card.html');
        if (object) {
          return new Response(object.body, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'X-Robots-Tag': 'noindex, nofollow',
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching business card from R2:', error);
      }
      return jsonResponse({ success: false, error: 'Business card page not found' }, 404);
    }

    // Serve dashboard CMS (password protected)
    if (path === '/dashboard-cms.html' || path === '/dashboard-cms' || path === '/dashboard') {
      // Check authentication
      const user = await checkAuth(request, env);
      if (!user) {
        // Redirect to login page
        return Response.redirect(new URL('/login', request.url), 302);
      }

      // User is authenticated, serve dashboard
      try {
        const object = await env.DOCUMENTS.get('dashboard-cms.html');
        if (object) {
          return new Response(object.body, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard from R2:', error);
      }
      return jsonResponse({ success: false, error: 'Dashboard not found' }, 404);
    }

    // Serve project summary email template
    if (path === '/project-summary-email.html') {
      try {
        const emailTemplate = await env.DOCUMENTS.get('project-summary-email.html');
        if (emailTemplate) {
          return new Response(emailTemplate.body, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching email template:', error);
      }
      return jsonResponse({ success: false, error: 'Email template not found' }, 404);
    }

    // Serve project summary email template
    if (path === '/project-summary-email.html') {
      try {
        const emailTemplate = await env.DOCUMENTS.get('project-summary-email.html');
        if (emailTemplate) {
          return new Response(emailTemplate.body, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching email template:', error);
      }
      return jsonResponse({ success: false, error: 'Email template not found' }, 404);
    }

    // Serve gallery page
    if (path === '/gallery' || path === '/gallery.html') {
      try {
        const galleryPage = await env.DOCUMENTS.get('gallery.html');
        if (galleryPage) {
          return new Response(galleryPage.body, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching gallery page:', error);
      }
      // Return gallery page HTML inline if not in R2
      return new Response(getGalleryPageHTML(), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders,
        },
      });
    }

    // Serve login page
    if (path === '/login' || path === '/login.html') {
      const user = await checkAuth(request, env);
      if (user) {
        // Already logged in, redirect to dashboard
        return Response.redirect(new URL('/dashboard', request.url), 302);
      }
      try {
        const loginPage = await env.DOCUMENTS.get('login.html');
        if (loginPage) {
          return new Response(loginPage.body, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching login page:', error);
      }
      return new Response(getLoginPageHTML(), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders,
        },
      });
    }

    // Auth API (public)
    if (path.startsWith('/api/auth')) {
      return await handleAuth(request, env);
    }

    // Protected API Routes - check auth
    const user = await checkAuth(request, env);
    if (!user && path.startsWith('/api/')) {
      // Allow some public APIs
      const publicApis = ['/api/chatbot', '/api/contact', '/api/send-onboarding-emails', '/api/webhooks/resend'];
      const isPublic = publicApis.some(api => path.startsWith(api));
      if (!isPublic) {
        return jsonResponse({ success: false, error: 'Authentication required' }, 401);
      }
    }

    // Send onboarding emails (public endpoint)
    if (path.startsWith('/api/send-onboarding-emails')) {
      return await handleSendOnboardingEmails(request, env);
    }

    // API Routes
    if (path.startsWith('/api/clients')) {
      return await handleClients(request, env);
    }
    if (path.startsWith('/api/properties')) {
      return await handleProperties(request, env);
    }
    if (path.startsWith('/api/projects')) {
      return await handleProjects(request, env);
    }
    if (path.startsWith('/api/services')) {
      return await handleServices(request, env);
    }
    if (path.startsWith('/api/contacts')) {
      return await handleContacts(request, env);
    }
    if (path.startsWith('/api/documents')) {
      return await handleDocuments(request, env);
    }

    // Enhanced Chatbot API with AI
    if (path.startsWith('/api/chatbot')) {
      return await handleChatbot(request, env);
    }

    // Knowledge Base API
    if (path.startsWith('/api/knowledge')) {
      return await handleKnowledgeBase(request, env);
    }

    // Site Content Management API
    if (path.startsWith('/api/content')) {
      return await handleSiteContent(request, env);
    }

    // Asset Management API (with SEO)
    if (path.startsWith('/api/assets')) {
      return await handleAssets(request, env);
    }

    // Contact Inquiries API
    if (path.startsWith('/api/inquiries')) {
      return await handleInquiries(request, env);
    }

    // Email Templates API
    if (path.startsWith('/api/email-templates')) {
      return await handleEmailTemplates(request, env);
    }

    if (path.startsWith('/api/send-project-summary')) {
      return await handleSendProjectSummary(request, env);
    }
    if (path.startsWith('/api/send-onboarding-emails')) {
      return await handleSendOnboardingEmails(request, env);
    }

    if (path.startsWith('/api/test-resend')) {
      return await handleTestResend(request, env);
    }

    // Resend Webhook Handler (for email events) - Public endpoint, no auth required
    if (path.startsWith('/api/webhooks/resend')) {
      return await handleResendWebhook(request, env);
    }

    // 404
    return jsonResponse({ success: false, error: 'Not found' }, 404);
  },
};

// ============================================
// ENHANCED CHATBOT WITH AI
// ============================================

async function handleChatbot(request, env) {
  const url = new URL(request.url);
  const method = request.method;

  if (method === 'POST') {
    const body = await request.json();
    const { message, sessionId, language = 'en' } = body;

    if (!message) {
      return jsonResponse({ success: false, error: 'Message required' }, 400);
    }

    try {
      // Get knowledge base context
      const knowledgeContext = await getKnowledgeContext(env, message, language);

      // Build AI prompt with context
      const systemPrompt = buildSystemPrompt(language, knowledgeContext);

      // Use Cloudflare AI if available, otherwise fallback to rule-based
      let response;
      if (env.AI) {
        response = await getAIResponse(env, systemPrompt, message, language);
      } else {
        response = await getRuleBasedResponse(message, language, knowledgeContext);
      }

      // Save conversation
      const conversationId = generateId('conv-');
      const now = getTimestamp();
      await env.DB.prepare(`
        INSERT INTO chatbot_conversations (id, session_id, language_code, user_message, bot_response, context_data, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        conversationId,
        sessionId || generateId('session-'),
        language,
        message,
        response,
        JSON.stringify(knowledgeContext),
        now
      ).run();

      return jsonResponse({
        success: true,
        response,
        sessionId: sessionId || conversationId,
      });
    } catch (error) {
      console.error('Chatbot error:', error);
      return jsonResponse({ success: false, error: 'Chatbot error' }, 500);
    }
  }

  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}

async function getKnowledgeContext(env, message, language) {
  const lowerMsg = message.toLowerCase();
  const keywords = extractKeywords(message);

  // Search knowledge base
  const { results } = await env.DB.prepare(`
    SELECT * FROM knowledge_base 
    WHERE language_code = ? 
    AND (
      keywords LIKE ? OR 
      title LIKE ? OR 
      content LIKE ?
    )
    ORDER BY priority DESC
    LIMIT 5
  `).bind(
    language,
    `%${keywords[0]}%`,
    `%${keywords[0]}%`,
    `%${keywords[0]}%`
  ).all();

  return results || [];
}

function extractKeywords(text) {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];
  return words.filter(w => w.length > 2 && !stopWords.includes(w));
}

function buildSystemPrompt(language, knowledgeContext) {
  const langNames = { en: 'English', ja: 'Japanese', zh: 'Chinese', ko: 'Korean' };

  return `You are a helpful assistant for Shinshu Solutions, a bilingual real estate consulting service in Nagano, Japan. 
Respond in ${langNames[language] || 'English'}.

Context about Shinshu Solutions:
${knowledgeContext.map(kb => `- ${kb.title}: ${kb.content}`).join('\n')}

Services offered:
- Translation & Interpretation (Japanese-English)
- Client Liaison Services
- Introductions & Coordination
- Project Support (renovation, construction)
- Property Management
- Cultural Bridge consulting

Service areas: Nozawa Onsen, Iiyama, Shinano, Myoko, Karuizawa, Komoro

Contact: [email protected], +81 070-7476-5362

Be professional, helpful, and concise. If you don't know something, direct them to contact [email protected].`;
}

async function getAIResponse(env, systemPrompt, userMessage, language) {
  try {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.response || response.description || 'I apologize, but I encountered an error processing your request.';
  } catch (error) {
    console.error('AI error:', error);
    // Fallback to rule-based
    return await getRuleBasedResponse(userMessage, language, []);
  }
}

async function getRuleBasedResponse(message, language, knowledgeContext) {
  const lowerMsg = message.toLowerCase();
  const responses = {
    en: {
      service: "We offer comprehensive bilingual services including translation & interpretation, client liaison, project coordination, property management, and cultural consulting. Our services are designed to bridge language and cultural gaps for foreign investors in Nagano.",
      contact: "You can reach us at jawaalk@gmail.com or call +81 070-7476-5362. We're located in Komoro, Nagano Prefecture, Japan.",
      area: "We primarily serve the Nozawa Onsen area, which was featured on Condé Nast Traveler as one of the world's top 9 ski resorts. We also work in Iiyama, Shinano, Myoko, Karuizawa, and the Komoro region.",
      default: "Thank you for your message. I'm here to help with information about Shinshu Solutions. Feel free to ask about our services, contact information, or service areas!"
    },
    ja: {
      service: "翻訳・通訳、クライアント連絡、プロジェクト調整、不動産管理、文化的コンサルティングなど、包括的なバイリンガルサービスを提供しています。",
      contact: "jawaalk@gmail.comまたは+81 070-7476-5362までお問い合わせください。長野県小諸市に所在しています。",
      area: "主に野沢温泉エリアを中心にサービスを提供しています。飯山、信濃、妙高、軽井沢、小諸地域でも活動しています。",
      default: "メッセージありがとうございます。信州ソリューションズに関する情報をお手伝いします。"
    },
    zh: {
      service: "我们提供全面的双语服务，包括翻译和口译、客户联络、项目协调、物业管理和文化咨询。",
      contact: "您可以通过 jawaalk@gmail.com 或致电 +81 070-7476-5362 联系我们。我们位于日本长野县小诸市。",
      area: "我们主要服务于野泽温泉地区，该地区被《康泰纳仕旅行者》评为世界前9大滑雪胜地之一。",
      default: "感谢您的留言。我在这里帮助您了解信州解决方案的信息。"
    },
    ko: {
      service: "번역 및 통역, 고객 연락, 프로젝트 조정, 부동산 관리 및 문화 컨설팅을 포함한 포괄적인 이중 언어 서비스를 제공합니다.",
      contact: "jawaalk@gmail.com로 연락하거나 +81 070-7476-5362로 전화하실 수 있습니다.",
      area: "주로 노자와 온천 지역을 중심으로 서비스를 제공하며, 이이야마, 시나노, 묘코, 가루이자와, 고모로 지역에서도 활동합니다.",
      default: "메시지를 보내주셔서 감사합니다. 신슈 솔루션에 대한 정보를 도와드리기 위해 여기 있습니다."
    }
  };

  const langResponses = responses[language] || responses.en;

  if (lowerMsg.includes('service') || lowerMsg.includes('サービス') || lowerMsg.includes('服务')) {
    return langResponses.service;
  }
  if (lowerMsg.includes('contact') || lowerMsg.includes('連絡') || lowerMsg.includes('联系') || lowerMsg.includes('email')) {
    return langResponses.contact;
  }
  if (lowerMsg.includes('area') || lowerMsg.includes('地域') || lowerMsg.includes('地区')) {
    return langResponses.area;
  }

  // Use knowledge base context if available
  if (knowledgeContext.length > 0) {
    return knowledgeContext[0].content;
  }

  return langResponses.default;
}

// ============================================
// KNOWLEDGE BASE HANDLERS
// ============================================

async function handleKnowledgeBase(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace('/api/knowledge', '');

  if (method === 'GET') {
    if (path === '' || path === '/') {
      const category = url.searchParams.get('category');
      const language = url.searchParams.get('language') || 'en';

      let query = 'SELECT * FROM knowledge_base WHERE language_code = ? ORDER BY priority DESC, created_at DESC';
      let params = [language];

      if (category) {
        query = 'SELECT * FROM knowledge_base WHERE category = ? AND language_code = ? ORDER BY priority DESC, created_at DESC';
        params = [category, language];
      }

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, data: results || [] });
    } else {
      const id = path.replace('/', '');
      const kb = await env.DB.prepare('SELECT * FROM knowledge_base WHERE id = ?').bind(id).first();
      if (!kb) {
        return jsonResponse({ success: false, error: 'Not found' }, 404);
      }
      return jsonResponse({ success: true, data: kb });
    }
  }

  if (method === 'POST') {
    const body = await request.json();
    const id = generateId('kb-');
    const now = getTimestamp();

    await env.DB.prepare(`
      INSERT INTO knowledge_base (id, category, language_code, title, content, keywords, priority, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.category || 'general',
      body.language_code || 'en',
      body.title || '',
      body.content || '',
      body.keywords || null,
      body.priority || 0,
      body.metadata ? JSON.stringify(body.metadata) : null,
      now,
      now
    ).run();

    const kb = await env.DB.prepare('SELECT * FROM knowledge_base WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: kb }, 201);
  }

  if (method === 'PUT') {
    const id = path.replace('/', '');
    const body = await request.json();
    const now = getTimestamp();

    await env.DB.prepare(`
      UPDATE knowledge_base 
      SET category = ?, language_code = ?, title = ?, content = ?, keywords = ?, priority = ?, metadata = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.category,
      body.language_code || 'en',
      body.title,
      body.content,
      body.keywords || null,
      body.priority || 0,
      body.metadata ? JSON.stringify(body.metadata) : null,
      now,
      id
    ).run();

    const kb = await env.DB.prepare('SELECT * FROM knowledge_base WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: kb });
  }

  if (method === 'DELETE') {
    const id = path.replace('/', '');
    await env.DB.prepare('DELETE FROM knowledge_base WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true, message: 'Deleted' });
  }

  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}

// ============================================
// ASSET MANAGEMENT HANDLERS (with SEO)
// ============================================

async function handleAssets(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace('/api/assets', '');

  if (method === 'GET') {
    if (path === '' || path === '/') {
      const assetType = url.searchParams.get('type');
      const category = url.searchParams.get('category');
      const language = url.searchParams.get('language') || 'en';
      const limit = parseInt(url.searchParams.get('limit')) || 100;

      let query = 'SELECT * FROM asset_metadata WHERE language_code = ?';
      let params = [language];

      if (assetType) {
        query += ' AND asset_type = ?';
        params.push(assetType);
      }

      if (category) {
        // Check if category is in metadata JSON
        query += ' AND metadata LIKE ?';
        const categoryPattern = `%"category":"${category}"%`;
        params.push(categoryPattern);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const { results } = await env.DB.prepare(query).bind(...params).all();

      // Parse metadata JSON if it exists
      const processedResults = (results || []).map(asset => {
        if (asset.metadata && typeof asset.metadata === 'string') {
          try {
            asset.metadata = JSON.parse(asset.metadata);
            // Extract category, location, description from metadata
            if (asset.metadata.category) asset.category = asset.metadata.category;
            if (asset.metadata.location) asset.location = asset.metadata.location;
            if (asset.metadata.tags) asset.tags = asset.metadata.tags;
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
        return asset;
      });

      return jsonResponse({ success: true, data: processedResults });
    } else if (path.startsWith('/upload')) {
      // Handle file upload
      return await handleAssetUpload(request, env);
    } else if (path.includes('/view')) {
      // Serve asset file
      const id = path.split('/')[1];
      const asset = await env.DB.prepare('SELECT * FROM asset_metadata WHERE id = ?').bind(id).first();
      if (!asset) {
        return jsonResponse({ success: false, error: 'Not found' }, 404);
      }

      try {
        // Try to get from R2 using r2_key
        const r2Key = asset.r2_key;
        const object = await env.DOCUMENTS.get(r2Key);
        if (!object) {
          return jsonResponse({ success: false, error: 'File not found in R2' }, 404);
        }

        return new Response(object.body, {
          headers: {
            'Content-Type': asset.mime_type || 'application/octet-stream',
            'Content-Disposition': `inline; filename="${asset.file_name}"`,
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('Error retrieving file from R2:', error);
        return jsonResponse({ success: false, error: 'Error retrieving file' }, 500);
      }
    } else {
      const id = path.replace('/', '');
      const asset = await env.DB.prepare('SELECT * FROM asset_metadata WHERE id = ?').bind(id).first();
      if (!asset) {
        return jsonResponse({ success: false, error: 'Not found' }, 404);
      }
      return jsonResponse({ success: true, data: asset });
    }
  }

  if (method === 'POST' && path.startsWith('/upload')) {
    return await handleAssetUpload(request, env);
  }

  if (method === 'PUT') {
    const id = path.replace('/', '');
    const body = await request.json();
    const now = getTimestamp();

    await env.DB.prepare(`
      UPDATE asset_metadata 
      SET title = ?, description = ?, alt_text = ?, keywords = ?, og_title = ?, og_description = ?, og_image = ?, canonical_url = ?, metadata = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.title || null,
      body.description || null,
      body.alt_text || null,
      body.keywords || null,
      body.og_title || null,
      body.og_description || null,
      body.og_image || null,
      body.canonical_url || null,
      body.metadata ? JSON.stringify(body.metadata) : null,
      now,
      id
    ).run();

    const asset = await env.DB.prepare('SELECT * FROM asset_metadata WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: asset });
  }

  if (method === 'DELETE') {
    const id = path.replace('/', '');
    const asset = await env.DB.prepare('SELECT * FROM asset_metadata WHERE id = ?').bind(id).first();

    if (asset && asset.r2_key) {
      await env.DOCUMENTS.delete(asset.r2_key).catch(() => { });
    }

    await env.DB.prepare('DELETE FROM asset_metadata WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true, message: 'Deleted' });
  }

  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}

async function handleAssetUpload(request, env) {
  const formData = await request.formData();
  const file = formData.get('file');
  const metadata = JSON.parse(formData.get('metadata') || '{}');

  if (!file) {
    return jsonResponse({ success: false, error: 'No file provided' }, 400);
  }

  const id = generateId('asset-');
  const now = getTimestamp();
  const fileName = file.name;
  const fileType = file.type || 'application/octet-stream';
  const fileSize = file.size;
  const assetType = metadata.asset_type || (fileType.startsWith('image/') ? 'image' : 'document');
  const r2Key = `assets/${assetType}/${id}/${fileName}`;
  const arrayBuffer = await file.arrayBuffer();

  // Upload to R2
  await env.DOCUMENTS.put(r2Key, arrayBuffer, {
    httpMetadata: {
      contentType: fileType,
    },
  });

  // Save metadata with SEO
  await env.DB.prepare(`
    INSERT INTO asset_metadata (
      id, asset_type, r2_key, file_name, file_size, mime_type,
      title, description, alt_text, keywords,
      og_title, og_description, og_image, canonical_url,
      language_code, metadata, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    assetType,
    r2Key,
    fileName,
    fileSize,
    fileType,
    metadata.title || fileName,
    metadata.description || null,
    metadata.alt_text || null,
    metadata.keywords || null,
    metadata.og_title || null,
    metadata.og_description || null,
    metadata.og_image || null,
    metadata.canonical_url || null,
    metadata.language_code || 'en',
    JSON.stringify(metadata.metadata || {}),
    now,
    now
  ).run();

  const asset = await env.DB.prepare('SELECT * FROM asset_metadata WHERE id = ?').bind(id).first();
  return jsonResponse({ success: true, data: asset }, 201);
}

// ============================================
// CONTACT INQUIRIES HANDLERS
// ============================================

async function handleInquiries(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace('/api/inquiries', '');

  if (method === 'GET') {
    if (path === '' || path === '/') {
      const status = url.searchParams.get('status');
      const language = url.searchParams.get('language');

      let query = 'SELECT * FROM contact_inquiries ORDER BY created_at DESC';
      let params = [];

      if (status) {
        query = 'SELECT * FROM contact_inquiries WHERE status = ? ORDER BY created_at DESC';
        params = [status];
      }

      if (language) {
        query = query.replace('ORDER BY', `WHERE language_code = ? ORDER BY`);
        params.push(language);
      }

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, data: results || [] });
    } else {
      const id = path.replace('/', '');
      const inquiry = await env.DB.prepare('SELECT * FROM contact_inquiries WHERE id = ?').bind(id).first();
      if (!inquiry) {
        return jsonResponse({ success: false, error: 'Not found' }, 404);
      }
      return jsonResponse({ success: true, data: inquiry });
    }
  }

  if (method === 'POST') {
    const body = await request.json();
    const id = generateId('inquiry-');
    const now = getTimestamp();

    // Detect language from message or use default
    const language = detectLanguageFromText(body.message) || body.language_code || 'en';

    await env.DB.prepare(`
      INSERT INTO contact_inquiries (
        id, name, email, phone, subject, message, language_code, source, status,
        email_sent, metadata, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.name || '',
      body.email || '',
      body.phone || null,
      body.subject || null,
      body.message || '',
      language,
      body.source || 'website',
      'new',
      0,
      JSON.stringify({
        ip_address: request.headers.get('cf-connecting-ip'),
        user_agent: request.headers.get('user-agent'),
      }),
      now,
      now
    ).run();

    const inquiry = await env.DB.prepare('SELECT * FROM contact_inquiries WHERE id = ?').bind(id).first();

    // Send auto-response email (if Resend configured)
    try {
      await sendInquiryAutoResponse(env, inquiry);
      await env.DB.prepare('UPDATE contact_inquiries SET email_sent = 1 WHERE id = ?').bind(id).run();
    } catch (error) {
      console.error('Auto-response email error:', error);
      // Don't fail the request if email fails
    }

    return jsonResponse({ success: true, data: inquiry }, 201);
  }

  if (method === 'PUT') {
    const id = path.replace('/', '');
    const body = await request.json();
    const now = getTimestamp();

    await env.DB.prepare(`
      UPDATE contact_inquiries 
      SET status = ?, assigned_to = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.status || 'new',
      body.assigned_to || null,
      now,
      id
    ).run();

    const inquiry = await env.DB.prepare('SELECT * FROM contact_inquiries WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: inquiry });
  }

  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}

function detectLanguageFromText(text) {
  // Simple language detection (can be enhanced)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  return 'en';
}

// ============================================
// EMAIL TEMPLATES HANDLERS
// ============================================

async function handleEmailTemplates(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace('/api/email-templates', '');

  if (method === 'GET') {
    if (path === '' || path === '/') {
      const templateType = url.searchParams.get('type');
      const language = url.searchParams.get('language') || 'en';

      let query = 'SELECT * FROM email_templates WHERE language_code = ? AND is_active = 1 ORDER BY created_at DESC';
      let params = [language];

      if (templateType) {
        query = 'SELECT * FROM email_templates WHERE template_type = ? AND language_code = ? AND is_active = 1 ORDER BY created_at DESC';
        params = [templateType, language];
      }

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, data: results || [] });
    } else {
      const id = path.replace('/', '');
      const template = await env.DB.prepare('SELECT * FROM email_templates WHERE id = ?').bind(id).first();
      if (!template) {
        return jsonResponse({ success: false, error: 'Not found' }, 404);
      }
      return jsonResponse({ success: true, data: template });
    }
  }

  if (method === 'POST') {
    const body = await request.json();
    const id = generateId('template-');
    const now = getTimestamp();

    await env.DB.prepare(`
      INSERT INTO email_templates (
        id, template_type, language_code, subject, html_body, text_body, variables, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.template_type || 'general',
      body.language_code || 'en',
      body.subject || '',
      body.html_body || '',
      body.text_body || null,
      body.variables ? JSON.stringify(body.variables) : null,
      body.is_active !== undefined ? body.is_active : 1,
      now,
      now
    ).run();

    const template = await env.DB.prepare('SELECT * FROM email_templates WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: template }, 201);
  }

  if (method === 'PUT') {
    const id = path.replace('/', '');
    const body = await request.json();
    const now = getTimestamp();

    await env.DB.prepare(`
      UPDATE email_templates 
      SET template_type = ?, language_code = ?, subject = ?, html_body = ?, text_body = ?, variables = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.template_type,
      body.language_code || 'en',
      body.subject,
      body.html_body,
      body.text_body || null,
      body.variables ? JSON.stringify(body.variables) : null,
      body.is_active !== undefined ? body.is_active : 1,
      now,
      id
    ).run();

    const template = await env.DB.prepare('SELECT * FROM email_templates WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: template });
  }

  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}

// ============================================
// EMAIL SENDING (Resend Integration)
// ============================================

async function sendInquiryAutoResponse(env, inquiry) {
  if (!env.RESEND_API_KEY) {
    console.log('Resend API key not configured, skipping email');
    return;
  }

  // Get appropriate email template
  const { results } = await env.DB.prepare(`
    SELECT * FROM email_templates 
    WHERE template_type = 'inquiry' AND language_code = ? AND is_active = 1
    LIMIT 1
  `).bind(inquiry.language_code || 'en').all();

  const template = results[0];
  if (!template) {
    console.log('No email template found for inquiry response');
    return;
  }

  // Replace template variables
  let htmlBody = template.html_body;
  let subject = template.subject;
  const variables = {
    name: inquiry.name,
    email: inquiry.email,
    message: inquiry.message,
    subject: inquiry.subject || 'Inquiry',
    company: 'Shinshu Solutions',
    contact_email: 'jawaalk@gmail.com',
    contact_phone: '+81 070-7476-5362',
  };

  Object.keys(variables).forEach(key => {
    htmlBody = htmlBody.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
    subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
  });

  // Send via Resend API
  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL || '[email protected]',
      to: inquiry.email,
      subject: subject,
      html: htmlBody,
      text: template.text_body || htmlBody.replace(/<[^>]*>/g, ''),
    }),
  });

  if (!resendResponse.ok) {
    const error = await resendResponse.text();
    throw new Error(`Resend API error: ${resendResponse.status} ${error}`);
  }

  // Also send notification to admin
  if (env.RESEND_ADMIN_EMAIL) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL || '[email protected]',
        to: env.RESEND_ADMIN_EMAIL || 'inneranimalclothing@gmail.com',
        subject: `New Inquiry: ${inquiry.subject || 'Contact Form'}`,
        html: `
          <h2>New Contact Inquiry</h2>
          <p><strong>Name:</strong> ${inquiry.name}</p>
          <p><strong>Email:</strong> ${inquiry.email}</p>
          <p><strong>Phone:</strong> ${inquiry.phone || 'N/A'}</p>
          <p><strong>Subject:</strong> ${inquiry.subject || 'N/A'}</p>
          <p><strong>Message:</strong></p>
          <p>${inquiry.message.replace(/\n/g, '<br>')}</p>
          <p><strong>Language:</strong> ${inquiry.language_code}</p>
          <p><strong>Source:</strong> ${inquiry.source}</p>
        `,
      }),
    }).catch(err => console.error('Admin notification error:', err));
  }
}

// PROJECT SUMMARY EMAIL HANDLER
// ============================================

async function handleSendProjectSummary(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  if (!env.RESEND_API_KEY) {
    return jsonResponse({ success: false, error: 'Resend API key not configured. Please set up Resend integration first.' }, 400);
  }

  try {
    // Load the email template from R2
    const emailTemplate = await env.DOCUMENTS.get('project-summary-email.html');
    let htmlBody = '';

    if (emailTemplate) {
      htmlBody = await emailTemplate.text();
    } else {
      // Fallback: use inline template
      htmlBody = await getProjectSummaryEmailHTML();
    }

    // Replace template variables
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    htmlBody = htmlBody.replace('{{date}}', currentDate);

    // Recipients: Jake and Sam
    const recipients = [
      'jawaalk@gmail.com',
      'inneranimalclothing@gmail.com'
    ];

    // Send emails
    const emailPromises = recipients.map(email =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.RESEND_FROM_EMAIL || '[email protected]',
          to: email,
          subject: '🎉 Shinshu Solutions - Project Completion Summary | InnerAnimal Media',
          html: htmlBody,
          text: htmlBody.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
        }),
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
    const failed = results.length - successful;

    if (successful > 0) {
      return jsonResponse({
        success: true,
        message: `Project summary email sent successfully to ${successful} recipient(s)${failed > 0 ? `. ${failed} failed.` : ''}`,
        sent: successful,
        failed: failed
      });
    } else {
      const errors = results.map((r, i) =>
        r.status === 'rejected' ? `Email ${i + 1}: ${r.reason}` :
          !r.value.ok ? `Email ${i + 1}: ${r.value.status}` : null
      ).filter(Boolean);
      return jsonResponse({
        success: false,
        error: 'Failed to send emails',
        details: errors
      }, 500);
    }
  } catch (error) {
    console.error('Error sending project summary:', error);
    return jsonResponse({
      success: false,
      error: 'Error sending project summary email: ' + error.message
    }, 500);
  }
}

async function getProjectSummaryEmailHTML() {
  // Return the email template HTML
  // This is a fallback if the file isn't in R2
  try {
    const template = await fetch('https://shinshu-solutions.meauxbility.workers.dev/project-summary-email.html');
    if (template && template.ok) {
      return await template.text();
    }
  } catch (e) {
    // Fallback continues
  }
  // Ultimate fallback - return basic HTML
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h1>Shinshu Solutions - Project Complete</h1>
  <p>Project completed: ${new Date().toLocaleDateString()}</p>
  <p>Built by InnerAnimal Media</p>
</body>
</html>`;
}

// RESEND WEBHOOK HANDLER (for email events)
// ============================================

async function handleResendWebhook(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const payload = await request.json();

    // Resend webhook events: email.sent, email.delivered, email.delivery_delayed, email.complained, email.bounced, email.opened, email.clicked
    const eventType = payload.type;
    const emailData = payload.data;

    console.log('Resend webhook event:', eventType, emailData);

    // Store webhook event in database for tracking
    const id = generateId('webhook-');
    const now = getTimestamp();

    await env.DB.prepare(`
      INSERT INTO webhook_events (
        id, event_type, event_data, source, created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      id,
      eventType,
      JSON.stringify(payload),
      'resend',
      now
    ).run().catch(err => {
      // If webhook_events table doesn't exist, just log
      console.log('Webhook events table not found, skipping database storage');
    });

    // Handle different event types
    switch (eventType) {
      case 'email.sent':
        console.log('Email sent:', emailData.email_id);
        break;
      case 'email.delivered':
        console.log('Email delivered:', emailData.email_id);
        break;
      case 'email.bounced':
        console.log('Email bounced:', emailData.email_id);
        // Could notify admin of bounces
        break;
      case 'email.opened':
        console.log('Email opened:', emailData.email_id);
        break;
      case 'email.clicked':
        console.log('Email clicked:', emailData.email_id);
        break;
      case 'email.complained':
        console.log('Email complaint:', emailData.email_id);
        // Could notify admin of spam complaints
        break;
    }

    return jsonResponse({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Error handling Resend webhook:', error);
    return jsonResponse({
      success: false,
      error: 'Error processing webhook: ' + error.message
    }, 500);
  }
}

// SEND ONBOARDING EMAILS HANDLER
// ============================================

async function handleSendOnboardingEmails(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  if (!env.RESEND_API_KEY) {
    return jsonResponse({ success: false, error: 'Resend API key not configured. Please set up Resend integration first.' }, 400);
  }

  try {
    // Load email templates
    const jakeTemplate = await env.DOCUMENTS.get('jake-onboarding-email.html');
    const samTemplate = await env.DOCUMENTS.get('sam-dev-overview-email.html');

    let jakeHTML = '';
    let samHTML = '';

    if (jakeTemplate) {
      jakeHTML = await jakeTemplate.text();
    } else {
      jakeHTML = await getJakeOnboardingEmailHTML();
    }

    if (samTemplate) {
      samHTML = await samTemplate.text();
    } else {
      samHTML = await getSamDevOverviewEmailHTML();
    }

    // Replace date placeholder in Sam's email
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    samHTML = samHTML.replace('{{date}}', currentDate);

    // Get FROM email - ensure it's properly formatted (use verified inneranimalmedia.com domain)
    const fromEmail = env.RESEND_FROM_EMAIL || 'Shinshu Solutions <[email protected]>';
    console.log('Using FROM email:', fromEmail);

    // Send emails
    const emailPromises = [
      // Jake's onboarding email
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail.trim(),
          to: 'jawaalk@gmail.com',
          subject: '🏔️ Welcome to Shinshu Solutions - Your Onboarding Guide',
          html: jakeHTML,
          text: jakeHTML.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
        }),
      }),
      // Sam's dev overview email
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail.trim(),
          to: 'inneranimalclothing@gmail.com',
          subject: '📊 Shinshu Solutions - Developer Overview & Cost Summary',
          html: samHTML,
          text: samHTML.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
        }),
      }),
    ];

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
    const failed = results.length - successful;

    // Get detailed error messages
    const errorDetails = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        errorDetails.push(`Email ${i + 1}: ${result.reason}`);
      } else if (!result.value.ok) {
        const errorText = await result.value.text().catch(() => 'Unknown error');
        errorDetails.push(`Email ${i + 1}: ${result.value.status} - ${errorText}`);
      }
    }

    if (successful > 0) {
      return jsonResponse({
        success: true,
        message: `Onboarding emails sent successfully! ${successful} email(s) delivered${failed > 0 ? `. ${failed} failed.` : ''}`,
        sent: successful,
        failed: failed,
        details: {
          jake: results[0].status === 'fulfilled' && results[0].value.ok ? 'sent' : 'failed',
          sam: results[1].status === 'fulfilled' && results[1].value.ok ? 'sent' : 'failed',
        }
      });
    } else {
      return jsonResponse({
        success: false,
        error: 'Failed to send emails',
        details: errorDetails
      }, 500);
    }
  } catch (error) {
    console.error('Error sending onboarding emails:', error);
    return jsonResponse({
      success: false,
      error: 'Error sending onboarding emails: ' + error.message
    }, 500);
  }
}

// TEST RESEND CONNECTION HANDLER
// ============================================

async function handleTestResend(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  if (!env.RESEND_API_KEY) {
    return jsonResponse({
      success: false,
      error: 'Resend API key not configured. Please add RESEND_API_KEY to Cloudflare Worker environment variables and redeploy.'
    }, 400);
  }

  try {
    // Send a test email to the admin email (or a test address)
    const testEmail = env.RESEND_ADMIN_EMAIL || 'inneranimalclothing@gmail.com';

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL || '[email protected]',
        to: testEmail,
        subject: '✅ Resend Connection Test - Shinshu Solutions',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4caf50;">✅ Resend Connection Successful!</h2>
            <p>This is a test email to verify your Resend integration is working correctly.</p>
            <p><strong>API Key:</strong> Configured ✅</p>
            <p><strong>From Email:</strong> ${env.RESEND_FROM_EMAIL || '[email protected]'}</p>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">Shinshu Solutions - InnerAnimal Media</p>
          </div>
        `,
        text: `Resend Connection Test - Success!\n\nThis confirms your Resend integration is working.\n\nTest Time: ${new Date().toLocaleString()}`,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return jsonResponse({
        success: false,
        error: `Resend API error: ${resendResponse.status} ${errorText}`
      }, 500);
    }

    const result = await resendResponse.json();
    return jsonResponse({
      success: true,
      message: `Test email sent successfully to ${testEmail}. Check your inbox!`,
      emailId: result.id
    });
  } catch (error) {
    console.error('Error testing Resend:', error);
    return jsonResponse({
      success: false,
      error: 'Error testing Resend connection: ' + error.message
    }, 500);
  }
}

// SITE CONTENT MANAGEMENT HANDLERS
// ============================================

async function handleSiteContent(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace('/api/content', '');

  if (method === 'GET') {
    if (path === '' || path === '/') {
      // List all content with filters
      const contentType = url.searchParams.get('type');
      const pagePath = url.searchParams.get('page_path');
      const sectionId = url.searchParams.get('section_id');
      const language = url.searchParams.get('language') || 'en';

      let query = 'SELECT * FROM site_content WHERE language_code = ?';
      let params = [language];

      if (contentType) {
        query += ' AND content_type = ?';
        params.push(contentType);
      }
      if (pagePath) {
        query += ' AND page_path = ?';
        params.push(pagePath);
      }
      if (sectionId) {
        query += ' AND section_id = ?';
        params.push(sectionId);
      }

      query += ' ORDER BY order_index ASC, created_at DESC';

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ success: true, data: results || [] });
    } else {
      // Get single content item
      const id = path.replace('/', '');
      const content = await env.DB.prepare('SELECT * FROM site_content WHERE id = ?').bind(id).first();
      if (!content) {
        return jsonResponse({ success: false, error: 'Not found' }, 404);
      }
      return jsonResponse({ success: true, data: content });
    }
  }

  if (method === 'POST') {
    // Create new content
    const body = await request.json();
    const id = generateId('content-');
    const now = getTimestamp();

    await env.DB.prepare(`
      INSERT INTO site_content (
        id, content_type, page_path, section_id, language_code,
        title, content, content_data, order_index, is_published, is_active,
        metadata, created_at, updated_at, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.content_type,
      body.page_path || null,
      body.section_id || null,
      body.language_code || 'en',
      body.title || null,
      body.content || '',
      body.content_data ? JSON.stringify(body.content_data) : null,
      body.order_index || 0,
      body.is_published !== undefined ? body.is_published : 1,
      1,
      body.metadata ? JSON.stringify(body.metadata) : null,
      now,
      now,
      body.created_by || null
    ).run();

    const content = await env.DB.prepare('SELECT * FROM site_content WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: content });
  }

  if (method === 'PUT') {
    // Update content
    const id = path.replace('/', '');
    const body = await request.json();
    const now = getTimestamp();

    await env.DB.prepare(`
      UPDATE site_content 
      SET title = ?, content = ?, content_data = ?, order_index = ?,
          is_published = ?, metadata = ?, updated_at = ?, updated_by = ?
      WHERE id = ?
    `).bind(
      body.title || null,
      body.content || '',
      body.content_data ? JSON.stringify(body.content_data) : null,
      body.order_index || 0,
      body.is_published !== undefined ? body.is_published : 1,
      body.metadata ? JSON.stringify(body.metadata) : null,
      now,
      body.updated_by || null,
      id
    ).run();

    const content = await env.DB.prepare('SELECT * FROM site_content WHERE id = ?').bind(id).first();
    return jsonResponse({ success: true, data: content });
  }

  if (method === 'DELETE') {
    const id = path.replace('/', '');
    await env.DB.prepare('DELETE FROM site_content WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true, message: 'Deleted' });
  }

  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}
