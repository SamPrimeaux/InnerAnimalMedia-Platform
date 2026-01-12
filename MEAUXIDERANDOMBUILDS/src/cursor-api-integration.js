/**
 * Cursor API Integration for SaaS Platform
 * Enables Cursor AI capabilities within the InnerAnimal Media platform
 * API Documentation: https://docs.cursor.com/api
 */

/**
 * Cursor API Client
 */
class CursorAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.cursor.com/v1';
  }

  /**
   * Make authenticated request to Cursor API
   */
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

  /**
   * Get completions (code suggestions)
   */
  async getCompletions(prompt, context = {}, options = {}) {
    return this.request('/completions', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        context,
        ...options,
      }),
    });
  }

  /**
   * Chat completion (conversational AI)
   */
  async chat(messages, options = {}) {
    return this.request('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        messages,
        ...options,
      }),
    });
  }

  /**
   * Code generation with context
   */
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

  /**
   * Code review and suggestions
   */
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

  /**
   * Refactor code
   */
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

  /**
   * Generate documentation
   */
  async generateDocs(code, language = 'javascript', docType = 'jsdoc', options = {}) {
    const messages = [
      {
        role: 'system',
        content: `You are a technical writer. Generate ${docType} documentation for the provided code.`,
      },
      {
        role: 'user',
        content: `Generate ${docType} documentation for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    ];

    return this.chat(messages, {
      model: options.model || 'gpt-4',
      ...options,
    });
  }

  /**
   * Explain code
   */
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

  /**
   * Generate tests
   */
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

/**
 * Unified AI Agent Manager
 * Manages multiple AI providers (Cursor, Gemini, OpenAI, Groq) for optimal workflow
 */
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

  /**
   * Get best available provider for task
   */
  getBestProvider(taskType = 'general') {
    // Priority: Cursor for code, Gemini for general, OpenAI fallback, Groq for speed
    if (taskType.includes('code') && this.cursor) {
      return { name: 'cursor', client: this.cursor };
    }
    if (this.providers.gemini) {
      return { name: 'gemini', client: null }; // Will use Gemini API directly
    }
    if (this.providers.openai) {
      return { name: 'openai', client: null };
    }
    if (this.providers.groq) {
      return { name: 'groq', client: null };
    }
    return null;
  }

  /**
   * Execute AI task with automatic provider selection
   */
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
        // Fallback to other providers
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

      case 'generate_docs':
        if (provider.name === 'cursor' && provider.client) {
          return provider.client.generateDocs(
            input.code,
            input.language || 'javascript',
            input.docType || 'jsdoc',
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
        // General chat/completion
        if (provider.name === 'cursor' && provider.client) {
          return provider.client.chat(input.messages || [], options);
        }
    }

    throw new Error(`Task type ${taskType} not supported or provider not available`);
  }
}

// For Cloudflare Workers (no ES modules in worker.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CursorAPIClient, UnifiedAIAgent };
}
