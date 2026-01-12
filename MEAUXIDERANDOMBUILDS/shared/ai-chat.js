/**
 * Universal AI Chat Widget Component
 * Works on both public pages (customer service) and dashboard (assistant)
 * 
 * Usage:
 *   <script src="/shared/ai-chat.js"></script>
 *   <script>
 *     AIChat.init({ mode: 'support', position: 'bottom-right' });
 *   </script>
 */

const AIChat = {
  config: {
    mode: 'assistant', // 'assistant' for dashboard, 'support' for public pages
    position: 'bottom-right', // 'bottom-right' or 'bottom-left'
    apiBase: window.API_BASE || 'https://iaccess-api.meauxbility.workers.dev',
    sessionId: null,
    history: [],
    isOpen: false,
    isMinimized: false
  },

  init(options = {}) {
    // Merge options
    this.config = { ...this.config, ...options };
    this.config.sessionId = this.config.sessionId || `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create chat widget HTML
    this.createWidget();

    // Load chat history if session exists
    if (this.config.sessionId) {
      this.loadHistory();
    }

    // Add keyboard shortcut (Cmd/Ctrl + K)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
    });
  },

  createWidget() {
    // Remove existing widget if present
    const existing = document.getElementById('ai-chat-widget');
    if (existing) existing.remove();

    const widget = document.createElement('div');
    widget.id = 'ai-chat-widget';
    widget.innerHTML = `
      <!-- Chat Button (Message Icon) -->
      <button id="ai-chat-button" 
        class="ai-chat-button ${this.config.position === 'bottom-left' ? 'bottom-left' : 'bottom-right'}"
        onclick="AIChat.toggle()"
        aria-label="Open AI Chat">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span id="ai-chat-badge" class="ai-chat-badge" style="display: none;"></span>
      </button>

      <!-- Chat Window -->
      <div id="ai-chat-window" class="ai-chat-window ${this.config.position === 'bottom-left' ? 'bottom-left' : 'bottom-right'} hidden">
        <div class="ai-chat-header">
          <div class="ai-chat-header-content">
            <div class="ai-chat-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>${this.config.mode === 'support' ? 'Customer Support' : 'Agent Sam'}</span>
            </div>
            <div class="ai-chat-actions">
              <button onclick="AIChat.clearHistory()" class="ai-chat-action-btn" title="Clear chat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              <button onclick="AIChat.minimize()" class="ai-chat-action-btn" title="Minimize">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <button onclick="AIChat.close()" class="ai-chat-action-btn" title="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div id="ai-chat-messages" class="ai-chat-messages"></div>
        <div class="ai-chat-input-container">
          <form id="ai-chat-form" onsubmit="AIChat.sendMessage(event)">
            <input 
              id="ai-chat-input" 
              type="text" 
              placeholder="${this.config.mode === 'support' ? 'Ask a question...' : 'Ask Sam anything...'}"
              autocomplete="off"
              disabled>
            <button type="submit" id="ai-chat-send" class="ai-chat-send-btn" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(widget);
    this.injectStyles();
    
    // Enable input on load
    document.getElementById('ai-chat-input').disabled = false;
    document.getElementById('ai-chat-send').disabled = false;
  },

  injectStyles() {
    if (document.getElementById('ai-chat-styles')) return;

    const style = document.createElement('style');
    style.id = 'ai-chat-styles';
    style.textContent = `
      /* AI Chat Widget Styles */
      .ai-chat-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff6b00 0%, #ff8c42 100%);
        border: none;
        box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        z-index: 9998;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .ai-chat-button.bottom-left {
        right: auto;
        left: 24px;
      }

      .ai-chat-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(255, 107, 0, 0.5), 0 12px 32px rgba(0, 0, 0, 0.3);
      }

      .ai-chat-button:active {
        transform: scale(0.95);
      }

      .ai-chat-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #dc2626;
        color: white;
        font-size: 11px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
      }

      .ai-chat-window {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 400px;
        height: 600px;
        max-height: calc(100vh - 120px);
        background: rgba(10, 10, 15, 0.98);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .ai-chat-window.bottom-left {
        right: auto;
        left: 24px;
      }

      .ai-chat-window.hidden {
        opacity: 0;
        pointer-events: none;
        transform: translateY(20px) scale(0.95);
      }

      .ai-chat-window.minimized {
        height: 56px;
        bottom: 96px;
      }

      .ai-chat-header {
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(23, 23, 23, 0.8);
      }

      .ai-chat-header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .ai-chat-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #ff6b00;
        font-weight: 600;
        font-size: 14px;
      }

      .ai-chat-actions {
        display: flex;
        gap: 4px;
      }

      .ai-chat-action-btn {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .ai-chat-action-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      .ai-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ai-chat-message {
        display: flex;
        gap: 8px;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .ai-chat-message.user {
        flex-direction: row-reverse;
      }

      .ai-chat-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .ai-chat-message.user .ai-chat-avatar {
        background: linear-gradient(135deg, #ff6b00 0%, #ff8c42 100%);
        color: white;
      }

      .ai-chat-message.assistant .ai-chat-avatar {
        background: rgba(255, 255, 255, 0.1);
        color: #ff6b00;
      }

      .ai-chat-content {
        flex: 1;
        max-width: 75%;
      }

      .ai-chat-message.user .ai-chat-content {
        text-align: right;
      }

      .ai-chat-bubble {
        padding: 10px 14px;
        border-radius: 12px;
        line-height: 1.5;
        font-size: 14px;
        word-wrap: break-word;
      }

      .ai-chat-message.user .ai-chat-bubble {
        background: linear-gradient(135deg, #ff6b00 0%, #ff8c42 100%);
        color: white;
        border-bottom-right-radius: 4px;
      }

      .ai-chat-message.assistant .ai-chat-bubble {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-bottom-left-radius: 4px;
      }

      .ai-chat-typing {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border-bottom-left-radius: 4px;
        width: fit-content;
      }

      .ai-chat-typing-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
        animation: typing 1.4s infinite;
      }

      .ai-chat-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .ai-chat-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typing {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.4;
        }
        30% {
          transform: translateY(-8px);
          opacity: 1;
        }
      }

      .ai-chat-input-container {
        padding: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(23, 23, 23, 0.8);
      }

      .ai-chat-input-container form {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      #ai-chat-input {
        flex: 1;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
      }

      #ai-chat-input:focus {
        border-color: rgba(255, 107, 0, 0.5);
        background: rgba(255, 255, 255, 0.08);
      }

      #ai-chat-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .ai-chat-send-btn {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        border: none;
        background: linear-gradient(135deg, #ff6b00 0%, #ff8c42 100%);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .ai-chat-send-btn:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);
      }

      .ai-chat-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Responsive */
      @media (max-width: 640px) {
        .ai-chat-window {
          width: calc(100vw - 48px);
          right: 24px;
          left: 24px;
        }

        .ai-chat-window.bottom-left {
          left: 24px;
          right: 24px;
        }

        .ai-chat-button.bottom-left {
          left: 16px;
          right: auto;
        }
      }
    `;
    document.head.appendChild(style);
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  open() {
    const window = document.getElementById('ai-chat-window');
    const button = document.getElementById('ai-chat-button');
    if (!window || !button) return;

    window.classList.remove('hidden');
    button.style.display = 'none';
    this.isOpen = true;
    this.isMinimized = false;

    // Focus input
    setTimeout(() => {
      document.getElementById('ai-chat-input')?.focus();
    }, 100);

    // Hide badge
    const badge = document.getElementById('ai-chat-badge');
    if (badge) badge.style.display = 'none';
  },

  close() {
    const window = document.getElementById('ai-chat-window');
    const button = document.getElementById('ai-chat-button');
    if (!window || !button) return;

    window.classList.add('hidden');
    button.style.display = 'flex';
    this.isOpen = false;
  },

  minimize() {
    const window = document.getElementById('ai-chat-window');
    if (!window) return;

    if (this.isMinimized) {
      window.classList.remove('minimized');
      this.isMinimized = false;
    } else {
      window.classList.add('minimized');
      this.isMinimized = true;
    }
  },

  async loadHistory() {
    try {
      const response = await fetch(
        `${this.config.apiBase}/api/chat/history?session_id=${this.config.sessionId}`
      );
      const data = await response.json();

      if (data.success && data.data.messages) {
        this.config.history = data.data.messages;
        this.renderMessages();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  },

  async sendMessage(event) {
    event.preventDefault();
    const input = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send');
    const message = input?.value.trim();

    if (!message || !input || !sendBtn) return;

    // Disable input
    input.disabled = true;
    sendBtn.disabled = true;

    // Add user message to UI
    this.addMessage('user', message);
    input.value = '';

    // Show typing indicator
    this.showTyping();

    try {
      const response = await fetch(`${this.config.apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: this.config.sessionId,
          mode: this.config.mode,
          use_rag: true,
          history: this.config.history.slice(-10) // Last 10 messages for context
        })
      });

      const data = await response.json();

      // Hide typing
      this.hideTyping();

      if (data.success && data.data.message) {
        this.addMessage('assistant', data.data.message);
        
        // Update history
        this.config.history.push({ role: 'user', content: message });
        this.config.history.push({ role: 'assistant', content: data.data.message });
      } else {
        this.addMessage('assistant', `Sorry, I encountered an error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      this.hideTyping();
      console.error('Chat error:', error);
      this.addMessage('assistant', 'Sorry, I encountered a connection error. Please try again.');
    } finally {
      // Re-enable input
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  },

  addMessage(role, content) {
    const messagesContainer = document.getElementById('ai-chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-chat-message ${role}`;
    
    const avatar = role === 'user' ? 'U' : '🤖';
    const avatarBg = role === 'user' ? 'background: linear-gradient(135deg, #ff6b00 0%, #ff8c42 100%);' : 'background: rgba(255, 255, 255, 0.1); color: #ff6b00;';

    messageDiv.innerHTML = `
      <div class="ai-chat-avatar" style="${avatarBg}">
        ${role === 'user' ? 'U' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>'}
      </div>
      <div class="ai-chat-content">
        <div class="ai-chat-bubble">${this.escapeHtml(content)}</div>
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  showTyping() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'ai-chat-typing-indicator';
    typingDiv.className = 'ai-chat-message assistant';
    typingDiv.innerHTML = `
      <div class="ai-chat-avatar" style="background: rgba(255, 255, 255, 0.1); color: #ff6b00;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
      </div>
      <div class="ai-chat-content">
        <div class="ai-chat-typing">
          <div class="ai-chat-typing-dot"></div>
          <div class="ai-chat-typing-dot"></div>
          <div class="ai-chat-typing-dot"></div>
        </div>
      </div>
    `;

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  hideTyping() {
    const typing = document.getElementById('ai-chat-typing-indicator');
    if (typing) typing.remove();
  },

  renderMessages() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    if (!messagesContainer || !this.config.history) return;

    messagesContainer.innerHTML = '';
    this.config.history.forEach(msg => {
      this.addMessage(msg.role, msg.content);
    });
  },

  async clearHistory() {
    if (!confirm('Clear all chat history?')) return;

    try {
      const response = await fetch(`${this.config.apiBase}/api/chat/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: this.config.sessionId })
      });

      if (response.ok) {
        this.config.history = [];
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (messagesContainer) messagesContainer.innerHTML = '';
      }
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Auto-initialize on dashboard pages
if (document.body.classList.contains('dashboard') || window.location.pathname.includes('/dashboard')) {
  document.addEventListener('DOMContentLoaded', () => {
    AIChat.init({ mode: 'assistant', position: 'bottom-right' });
  });
}
