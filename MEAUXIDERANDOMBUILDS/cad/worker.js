/**
 * meauxCAD Worker
 * Serves 3D CAD studio files from R2 bucket
 * Handles AI requests and export conversions
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API Routes
    if (path.startsWith('/api/')) {
      return handleAPI(request, env, path, corsHeaders);
    }

    // Handle root - serve index.html (new CAD interface)
    if (path === '/' || path === '/index.html' || path === '/index') {
      try {
        // Try index.html first (new CAD interface)
        let object = await env.CAD_STORAGE.get('index.html');
        
        // Fallback to automeaux.html if index.html doesn't exist
        if (!object) {
          object = await env.CAD_STORAGE.get('automeaux.html');
        }
        
        if (!object) {
          return new Response('CAD Studio not found. Please upload index.html to the cad bucket.', { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
          });
        }

        return new Response(object.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch (error) {
        return new Response(`Error: ${error.message}`, { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
        });
      }
    }

    // Serve files from R2
    try {
      // Remove leading slash
      let r2Key = path.slice(1);

      // Try to get file from R2
      let object = await env.CAD_STORAGE.get(r2Key);

      if (!object) {
        // Try with .html extension
        object = await env.CAD_STORAGE.get(`${r2Key}.html`);
      }
      
      if (!object) {
        // Try with .glb extension (3D models)
        if (!r2Key.includes('.')) {
          object = await env.CAD_STORAGE.get(`${r2Key}.glb`);
        }
      }
      
      if (!object) {
        // Try with .gltf extension
        if (!r2Key.includes('.')) {
          object = await env.CAD_STORAGE.get(`${r2Key}.gltf`);
        }
      }

      if (!object) {
        return new Response('File not found', { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
        });
      }

      // Determine content type based on actual file path
      const actualKey = object.key || r2Key;
      const contentType = getContentType(actualKey);

      return new Response(object.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000', // 1 year for assets
          // CORS headers for 3D model loading
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
        },
      });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }
  },
};

function getContentType(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  const types = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    glb: 'model/gltf-binary',
    gltf: 'model/gltf+json',
    obj: 'model/obj',
    mtl: 'model/mtl',
    stl: 'model/stl',
    fbx: 'application/octet-stream',
    usdz: 'model/vnd.usdz+zip',
    mp4: 'video/mp4',
    webm: 'video/webm',
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    pdf: 'application/pdf',
    zip: 'application/zip',
    txt: 'text/plain',
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Handle API requests
 */
async function handleAPI(request, env, path, corsHeaders) {
  try {
    // AI Generation endpoint
    if (path === '/api/ai/generate' && request.method === 'POST') {
      return await handleAIGenerate(request, env, corsHeaders);
    }
    
    // Meshy AI 3D generation endpoint
    if (path === '/api/meshy/generate' && request.method === 'POST') {
      return await handleMeshyGenerate(request, env, corsHeaders);
    }
    
    // Meshy AI status check
    if (path === '/api/meshy/status' && request.method === 'GET') {
      return await handleMeshyStatus(request, env, corsHeaders);
    }
    
    // R2 file scanning endpoint
    if (path.startsWith('/api/r2/scan') && request.method === 'GET') {
      return await handleR2Scan(request, env, corsHeaders);
    }
    
    // Splineicons scanning endpoint
    if (path.startsWith('/api/splineicons') && request.method === 'GET') {
      return await handleSplineicons(request, env, corsHeaders);
    }
    
    // Themes API endpoint (from database)
    if (path === '/api/themes' && request.method === 'GET') {
      return await handleThemes(request, env, corsHeaders);
    }
    
    // Platform assets endpoint (from inneranimalmedia-assets R2)
    if (path.startsWith('/api/platform-assets/') && request.method === 'GET') {
      return await handlePlatformAssets(request, env, corsHeaders);
    }
    
    // Export conversion endpoint
    if (path === '/api/export' && request.method === 'POST') {
      return await handleExport(request, env, corsHeaders);
    }
    
    // API status check
    if (path === '/api/status' && request.method === 'GET') {
      return await handleAPIStatus(env, corsHeaders);
    }
    
    return new Response('API endpoint not found', { 
      status: 404, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

/**
 * Handle AI generation request
 */
async function handleAIGenerate(request, env, corsHeaders) {
  const apiKey = env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'Google AI API key not configured. Set GOOGLE_AI_API_KEY secret.' 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { prompt, context } = body;

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a CAD design assistant. ${context || ''} User request: ${prompt}. Provide detailed CAD instructions or generate code for the requested design.`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      response: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle export conversion via CloudConvert
 */
async function handleExport(request, env, corsHeaders) {
  const apiKey = env.CLOUDCONVERT_API_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'CloudConvert API key not configured. Set CLOUDCONVERT_API_KEY secret.' 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { inputFormat, outputFormat, fileData, fileName } = body;

    // Create CloudConvert job
    const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tasks: {
          'import-file': {
            operation: 'import/base64',
            file: fileData,
            filename: fileName || 'cad-export'
          },
          'convert': {
            operation: 'convert',
            input: 'import-file',
            output_format: outputFormat,
            engine: 'cad'
          },
          'export-file': {
            operation: 'export/url',
            input: 'convert'
          }
        }
      })
    });

    const jobData = await jobResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      jobId: jobData.data?.id,
      status: jobData.data?.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Scan R2 bucket for files by extension
 */
async function handleR2Scan(request, env, corsHeaders) {
  if (!env.CAD_STORAGE) {
    return new Response(JSON.stringify({ 
      error: 'R2 storage not configured' 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const ext = url.searchParams.get('ext') || 'glb';
    
    // List objects in R2 bucket
    const objects = await env.CAD_STORAGE.list();
    
    // Filter by extension
    const filtered = objects.objects
      .filter(obj => obj.key.toLowerCase().endsWith(`.${ext.toLowerCase()}`))
      .map(obj => ({
        name: obj.key.split('/').pop(),
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        url: `${request.url.split('/api')[0]}/${obj.key}`
      }));
    
    return new Response(JSON.stringify({
      success: true,
      files: filtered,
      count: filtered.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle Splineicons R2 bucket scanning and listing
 */
async function handleSplineicons(request, env, corsHeaders) {
  if (!env.SPLINEICONS_STORAGE) {
    return new Response(JSON.stringify({ 
      error: 'Splineicons storage not configured' 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list';
    const ext = url.searchParams.get('ext') || null;
    const prefix = url.searchParams.get('prefix') || '';
    
    if (action === 'list') {
      // List all objects in splineicons bucket
      const listOptions = {};
      if (prefix) {
        listOptions.prefix = prefix;
      }
      
      const objects = await env.SPLINEICONS_STORAGE.list(listOptions);
      
      let filtered = objects.objects || [];
      
      // Filter by extension if specified
      if (ext) {
        filtered = filtered.filter(obj => 
          obj.key.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
        );
      }
      
      const files = filtered.map(obj => ({
        name: obj.key.split('/').pop(),
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        etag: obj.etag,
        url: `https://pub-a00644f65a1c47b79066c5ce933fa608.r2.dev/${obj.key}`,
        s3Url: `https://ede6590ac0d2fb7daf155b35653457b2.r2.cloudflarestorage.com/splineicons/${obj.key}`
      }));
      
      return new Response(JSON.stringify({
        success: true,
        files: files,
        count: files.length,
        bucket: 'splineicons',
        publicUrl: 'https://pub-a00644f65a1c47b79066c5ce933fa608.r2.dev',
        s3Url: 'https://ede6590ac0d2fb7daf155b35653457b2.r2.cloudflarestorage.com/splineicons'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (action === 'get') {
      // Get specific file
      const key = url.searchParams.get('key');
      if (!key) {
        return new Response(JSON.stringify({ 
          error: 'key parameter required' 
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const object = await env.SPLINEICONS_STORAGE.get(key);
      
      if (!object) {
        return new Response('File not found', { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
        });
      }

      const contentType = getContentType(key);
      
      return new Response(object.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Invalid action. Use action=list or action=get' 
    }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle themes from database
 */
async function handleThemes(request, env, corsHeaders) {
  if (!env.DB) {
    return new Response(JSON.stringify({ 
      error: 'Database not configured' 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    
    // Query themes - match actual database schema
    let query = `SELECT id, name, display_name, description, theme_data, created_at FROM themes ORDER BY display_name ASC LIMIT 100`;
    
    const result = await env.DB.prepare(query).all();
    
    const themes = (result.results || []).map(theme => {
      // Handle theme_data field (might be JSON string or object)
      let config = {};
      if (theme.theme_data) {
        if (typeof theme.theme_data === 'string') {
          try {
            config = JSON.parse(theme.theme_data);
          } catch (e) {
            config = {};
          }
        } else {
          config = theme.theme_data;
        }
      }
      
      return {
        id: theme.id,
        name: theme.name,
        displayName: theme.display_name || theme.name || theme.id,
        description: theme.description || null,
        isDefault: false,
        isPublic: true,
        config: config,
        previewImageUrl: null,
        createdAt: theme.created_at || Date.now()
      };
    });
    
    return new Response(JSON.stringify({
      success: true,
      data: themes,
      count: themes.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle platform assets from inneranimalmedia-assets R2
 */
async function handlePlatformAssets(request, env, corsHeaders) {
  if (!env.PLATFORM_STORAGE) {
    return new Response(JSON.stringify({ 
      error: 'Platform storage not configured' 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const assetPath = url.pathname.replace('/api/platform-assets/', '');
    
    // Get file from platform storage
    const object = await env.PLATFORM_STORAGE.get(assetPath);
    
    if (!object) {
      return new Response('Asset not found', { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    const contentType = getContentType(assetPath);
    
    return new Response(object.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Check API status
 */
async function handleAPIStatus(env, corsHeaders) {
  const status = {
    googleAI: env.GOOGLE_AI_API_KEY ? 'configured' : 'not_configured',
    cloudConvert: env.CLOUDCONVERT_API_KEY ? 'configured' : 'not_configured',
    meshyAI: env.MESHYAI_API_KEY ? 'configured' : 'not_configured',
    database: env.DB ? 'configured' : 'not_configured',
    platformStorage: env.PLATFORM_STORAGE ? 'configured' : 'not_configured',
    splineicons: env.SPLINEICONS_STORAGE ? 'configured' : 'not_configured'
  };
  
  return new Response(JSON.stringify(status), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}