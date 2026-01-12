/**
 * MeauxCAD Configuration
 * API Keys and Integration Settings
 * 
 * To configure:
 * 1. Add your API keys to Cloudflare Workers Secrets:
 *    wrangler secret put GOOGLE_AI_API_KEY
 *    wrangler secret put CLOUDCONVERT_API_KEY
 * 
 * 2. Or set them as environment variables in wrangler.toml
 */

// API Configuration (loaded from environment)
export const config = {
  // Google AI API (Gemini)
  googleAI: {
    apiKey: '', // Set via GOOGLE_AI_API_KEY secret
    model: 'gemini-pro',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
  },
  
  // CloudConvert API
  cloudConvert: {
    apiKey: '', // Set via CLOUDCONVERT_API_KEY secret
    endpoint: 'https://api.cloudconvert.com/v2',
    webhookUrl: '' // Optional: for async conversions
  },
  
  // Export formats supported
  exportFormats: {
    '2d': ['svg', 'png', 'pdf', 'dxf', 'dwg'],
    '3d': ['stl', 'obj', 'glb', 'gltf', 'step', 'iges', 'fbx']
  },
  
  // CAD Settings
  cad: {
    defaultGridSize: 20,
    defaultUnits: 'mm',
    snapToGrid: true,
    precision: 0.01
  }
};

/**
 * Initialize API keys from environment
 */
export function initConfig(env) {
  return {
    ...config,
    googleAI: {
      ...config.googleAI,
      apiKey: env.GOOGLE_AI_API_KEY || ''
    },
    cloudConvert: {
      ...config.cloudConvert,
      apiKey: env.CLOUDCONVERT_API_KEY || ''
    }
  };
}

/**
 * Check if API keys are configured
 */
export function checkAPIConfig(env) {
  const cfg = initConfig(env);
  return {
    googleAI: !!cfg.googleAI.apiKey,
    cloudConvert: !!cfg.cloudConvert.apiKey
  };
}