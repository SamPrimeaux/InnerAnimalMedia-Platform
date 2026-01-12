/**
 * MeauxCAD API Handler
 * Handles AI requests and export conversions
 */

import { initConfig, checkAPIConfig } from './config.js';

/**
 * Handle AI generation request
 */
export async function handleAIGenerate(request, env) {
  const cfg = initConfig(env);
  
  if (!cfg.googleAI.apiKey) {
    return new Response(JSON.stringify({ 
      error: 'Google AI API key not configured' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { prompt, context } = body;

    // Call Google Gemini API
    const response = await fetch(
      `${cfg.googleAI.endpoint}?key=${cfg.googleAI.apiKey}`,
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
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle export conversion via CloudConvert
 */
export async function handleExport(request, env) {
  const cfg = initConfig(env);
  
  if (!cfg.cloudConvert.apiKey) {
    return new Response(JSON.stringify({ 
      error: 'CloudConvert API key not configured' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { inputFormat, outputFormat, fileData, fileName } = body;

    // Create CloudConvert job
    const jobResponse = await fetch(`${cfg.cloudConvert.endpoint}/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.cloudConvert.apiKey}`,
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
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Check API status
 */
export async function handleAPIStatus(env) {
  const status = checkAPIConfig(env);
  
  return new Response(JSON.stringify({
    googleAI: status.googleAI ? 'configured' : 'not_configured',
    cloudConvert: status.cloudConvert ? 'configured' : 'not_configured'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}