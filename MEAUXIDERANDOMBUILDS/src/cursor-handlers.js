/**
 * Cursor API Handlers for Worker
 * Inline implementation to avoid import issues in Cloudflare Workers
 */

// Cursor API Client (inline)
class CursorAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.cursor.com/v1';
  }

  async request(endpoint, options = {}) {
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
      const error = await response.text();
      throw new Error(`Cursor API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  async chat(messages, options = {}) {
    return this.request('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        messages,
        model: options.model || 'gpt-4',
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
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

// Helper function (should be available in worker.js)
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
