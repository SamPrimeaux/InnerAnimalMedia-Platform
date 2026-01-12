/**
 * Sitewide IDE Agent Component
 * Terminal/Chatbot/DevOps agent for /dashboard
 */

class IDEAgent {
    constructor() {
        this.isOpen = false;
        this.history = [];
        this.apiBase = window.DASHBOARD_API_BASE || 'https://iaccess-api.meauxbility.workers.dev';
        this.currentProject = null;
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.loadHistory();

        // Listen for project changes
        window.addEventListener('projectChanged', (e) => {
            this.currentProject = e.detail.project;
        });
    }

    render() {
        const existingAgent = document.getElementById('ideAgent');
        if (existingAgent) {
            existingAgent.remove();
        }

        const agent = document.createElement('div');
        agent.id = 'ideAgent';
        agent.className = 'ide-agent-container';
        agent.innerHTML = `
            <div class="ide-agent-header">
                <div class="ide-agent-title">
                    <i data-lucide="terminal" class="ide-agent-icon"></i>
                    <span>Agent Sam</span>
                    <span class="ide-agent-subtitle">Terminal / DevOps / CLI</span>
                </div>
                <button class="ide-agent-close" id="ideAgentClose">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="ide-agent-content">
                <div class="ide-agent-output" id="ideAgentOutput">
                    <div class="ide-agent-welcome">
                        <div class="ide-agent-welcome-title">👋 Agent Sam Ready</div>
                        <div class="ide-agent-welcome-text">
                            I'm your terminal, chatbot, and DevOps agent. I can help with:
                        </div>
                        <div class="ide-agent-capabilities">
                            <div class="ide-agent-capability">
                                <i data-lucide="terminal"></i>
                                <span>CLI Commands</span>
                            </div>
                            <div class="ide-agent-capability">
                                <i data-lucide="code"></i>
                                <span>Code Generation</span>
                            </div>
                            <div class="ide-agent-capability">
                                <i data-lucide="server"></i>
                                <span>DevOps Tasks</span>
                            </div>
                            <div class="ide-agent-capability">
                                <i data-lucide="database"></i>
                                <span>Database Queries</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="ide-agent-input-container">
                    <div class="ide-agent-prompt">
                        <span class="ide-agent-prompt-user">agent_sam</span>
                        <span class="ide-agent-prompt-separator">@</span>
                        <span class="ide-agent-prompt-project">${this.currentProject?.name || 'dashboard'}</span>
                        <span class="ide-agent-prompt-arrow">$</span>
                    </div>
                    <textarea 
                        class="ide-agent-input" 
                        id="ideAgentInput" 
                        placeholder="Type a command or ask a question..."
                        rows="1"
                    ></textarea>
                    <button class="ide-agent-send" id="ideAgentSend">
                        <i data-lucide="send"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(agent);
        lucide.createIcons();
    }

    attachEventListeners() {
        const input = document.getElementById('ideAgentInput');
        const sendBtn = document.getElementById('ideAgentSend');
        const closeBtn = document.getElementById('ideAgentClose');

        // Send on Enter (Shift+Enter for new line)
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendCommand();
            }
        });

        // Auto-resize textarea
        input?.addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
        });

        sendBtn?.addEventListener('click', () => this.sendCommand());
        closeBtn?.addEventListener('click', () => this.close());

        // Toggle with Ctrl+K or Cmd+K
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    async sendCommand() {
        const input = document.getElementById('ideAgentInput');
        const command = input?.value.trim();
        if (!command) return;

        // Add to output
        this.addOutput('user', command);
        input.value = '';
        input.style.height = 'auto';

        // Show thinking
        const thinkingId = this.addOutput('system', 'Thinking...', true);

        try {
            // Call API endpoint for agent
            const response = await fetch(`${this.apiBase}/api/agent/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command,
                    project_id: this.currentProject?.id,
                    context: {
                        current_page: window.location.pathname,
                        user_agent: navigator.userAgent
                    }
                })
            });

            const data = await response.json();

            // Remove thinking message
            this.removeOutput(thinkingId);

            if (data.success) {
                this.addOutput('agent', data.output || data.message, false, data.data);
            } else {
                this.addOutput('error', data.error || 'Command failed');
            }
        } catch (error) {
            this.removeOutput(thinkingId);
            this.addOutput('error', `Error: ${error.message}`);
        }

        // Save to history
        this.history.push({ command, timestamp: Date.now() });
        this.saveHistory();
    }

    addOutput(type, content, isTemporary = false, data = null) {
        const output = document.getElementById('ideAgentOutput');
        if (!output) return null;

        const id = `output-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const message = document.createElement('div');
        message.id = id;
        message.className = `ide-agent-message ide-agent-message-${type} ${isTemporary ? 'ide-agent-temporary' : ''}`;

        let icon = 'terminal';
        if (type === 'user') icon = 'user';
        else if (type === 'error') icon = 'alert-circle';
        else if (type === 'agent') icon = 'bot';

        message.innerHTML = `
            <div class="ide-agent-message-header">
                <i data-lucide="${icon}" class="ide-agent-message-icon"></i>
                <span class="ide-agent-message-type">${type === 'user' ? 'You' : type === 'error' ? 'Error' : 'Agent Sam'}</span>
                <span class="ide-agent-message-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="ide-agent-message-content">${this.formatOutput(content, data)}</div>
        `;

        // Remove welcome message if exists
        const welcome = output.querySelector('.ide-agent-welcome');
        if (welcome) welcome.remove();

        output.appendChild(message);
        output.scrollTop = output.scrollHeight;
        lucide.createIcons();

        return id;
    }

    removeOutput(id) {
        const message = document.getElementById(id);
        if (message) {
            message.remove();
        }
    }

    formatOutput(content, data) {
        if (data && data.code) {
            return `<pre><code>${this.escapeHtml(data.code)}</code></pre>`;
        }
        if (data && data.table) {
            return this.formatTable(data.table);
        }
        return this.escapeHtml(content).replace(/\n/g, '<br>');
    }

    formatTable(table) {
        if (!table.headers || !table.rows) return '';
        return `
            <table class="ide-agent-table">
                <thead>
                    <tr>${table.headers.map(h => `<th>${this.escapeHtml(h)}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${table.rows.map(row => `<tr>${row.map(cell => `<td>${this.escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const container = document.getElementById('ideAgent');
        if (container) {
            container.classList.toggle('ide-agent-open', this.isOpen);
            if (this.isOpen) {
                document.getElementById('ideAgentInput')?.focus();
            }
        }
    }

    open() {
        this.isOpen = true;
        this.toggle();
    }

    close() {
        this.isOpen = false;
        const container = document.getElementById('ideAgent');
        if (container) {
            container.classList.remove('ide-agent-open');
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('ideAgentHistory');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    }

    saveHistory() {
        try {
            // Keep last 100 commands
            const recent = this.history.slice(-100);
            localStorage.setItem('ideAgentHistory', JSON.stringify(recent));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }
}

// Global toggle function
window.toggleIDEAgent = function () {
    if (!window.ideAgent) {
        window.ideAgent = new IDEAgent();
        window.ideAgent.init();
    }
    window.ideAgent.toggle();
};

// Initialize on page load
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Create floating button
        const floatBtn = document.createElement('button');
        floatBtn.className = 'ide-agent-float-btn';
        floatBtn.innerHTML = '<i data-lucide="terminal"></i>';
        floatBtn.title = 'Open Agent Sam (Ctrl+K / Cmd+K)';
        floatBtn.onclick = () => window.toggleIDEAgent();
        document.body.appendChild(floatBtn);
        lucide.createIcons();
    });
}
