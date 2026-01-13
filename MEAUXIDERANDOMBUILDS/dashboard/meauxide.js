// MeauxIDE - Code Editor with Claude Code CLI Integration
const ide = {
    currentFile: null,
    files: {},
    terminalOpen: false,
    claudeEnabled: false,
    claudeProfile: 'ide',

    init() {
        this.setupEditor();
        this.setupTerminal();
        this.checkClaudeInstallation();
        this.setupKeyboardShortcuts();
    },

    setupEditor() {
        const editor = document.getElementById('code-editor');
        if (!editor) return;

        // Update cursor position
        editor.addEventListener('input', () => this.updateCursorPosition());
        editor.addEventListener('keyup', () => this.updateCursorPosition());
        editor.addEventListener('scroll', () => this.updateLineNumbers());

        // Auto-detect language
        editor.addEventListener('input', () => this.detectLanguage());
    },

    setupTerminal() {
        // Terminal is already in HTML, just need to handle commands
    },

    async checkClaudeInstallation() {
        // Check if Claude Code CLI is installed
        try {
            // This would need to be done via API call to worker
            // For now, assume it's available if the script exists
            this.claudeEnabled = true;
        } catch (e) {
            console.warn('Claude Code CLI not detected:', e);
            this.claudeEnabled = false;
        }
    },

    setupKeyboardShortcuts() {
        const editor = document.getElementById('code-editor');
        if (!editor) return;

        // Ctrl+S to save
        editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveFile();
            }
            // Ctrl+/ to toggle comment
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                this.toggleComment();
            }
        });
    },

    toggleTerminal() {
        const panel = document.getElementById('terminal-panel');
        if (!panel) return;

        this.terminalOpen = !this.terminalOpen;
        if (this.terminalOpen) {
            panel.classList.remove('w-0');
            panel.classList.add('w-96');
        } else {
            panel.classList.remove('w-96');
            panel.classList.add('w-0');
        }
    },

    async runTerminalCommand(e) {
        e.preventDefault();
        const input = document.getElementById('terminal-input');
        const output = document.getElementById('terminal-output');
        if (!input || !output) return;

        const command = input.value.trim();
        if (!command) return;

        // Add command to output
        output.innerHTML += `<div class="text-brand-orange mb-1">$ ${this.escapeHtml(command)}</div>`;

        // Check if it's a Claude command
        if (command.startsWith('claude ') || command.startsWith('meauxcli ')) {
            await this.runClaudeCommand(command, output);
        } else {
            // Regular terminal command (would need backend API)
            output.innerHTML += `<div class="text-zinc-500 mb-2">Command execution requires backend API integration</div>`;
        }

        input.value = '';
        output.scrollTop = output.scrollHeight;
    },

    async runClaudeCommand(command, output) {
        output.innerHTML += `<div class="text-zinc-500 mb-2 animate-pulse">🤖 Running Claude Code CLI...</div>`;
        output.scrollTop = output.scrollHeight;

        try {
            // Extract prompt from command
            const prompt = command.replace(/^(claude|meauxcli)\s+/, '');

            // Call Claude API via worker
            const apiBase = window.location.origin;
            const response = await fetch(`${apiBase}/api/claude/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    options: {
                        model: 'claude-3-5-sonnet-20241022',
                        max_tokens: 2000
                    }
                })
            });

            const data = await response.json();

            // Remove loading indicator
            output.removeChild(output.lastElementChild);

            if (data.success && data.data.content) {
                const content = Array.isArray(data.data.content)
                    ? data.data.content.map(c => c.text || c).join('')
                    : data.data.content;

                output.innerHTML += `<div class="text-white mb-2 whitespace-pre-wrap">${this.escapeHtml(content)}</div>`;
            } else {
                output.innerHTML += `<div class="text-red-500 mb-2">Error: ${data.error || 'Unknown error'}</div>`;
            }
        } catch (error) {
            output.removeChild(output.lastElementChild);
            output.innerHTML += `<div class="text-red-500 mb-2">Error: ${error.message}</div>`;
        }

        output.scrollTop = output.scrollHeight;
    },

    updateCursorPosition() {
        const editor = document.getElementById('code-editor');
        const position = document.getElementById('cursor-position');
        if (!editor || !position) return;

        const text = editor.value;
        const cursorPos = editor.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;

        position.textContent = `Ln ${line}, Col ${col}`;
    },

    updateLineNumbers() {
        // Update line numbers based on editor content
        const editor = document.getElementById('code-editor');
        const lineNumbers = document.getElementById('line-numbers');
        if (!editor || !lineNumbers) return;

        const lines = editor.value.split('\n').length;
        lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) =>
            `<div class="text-zinc-600">${i + 1}</div>`
        ).join('');
    },

    detectLanguage() {
        const editor = document.getElementById('code-editor');
        const language = document.getElementById('file-language');
        if (!editor || !language) return;

        const content = editor.value;
        let detected = 'Plain Text';

        // Simple language detection
        if (content.includes('function') || content.includes('const ') || content.includes('import ')) {
            detected = 'JavaScript';
        } else if (content.includes('def ') || content.includes('import ')) {
            detected = 'Python';
        } else if (content.includes('<?php') || content.includes('<?=')) {
            detected = 'PHP';
        } else if (content.includes('<!DOCTYPE') || content.includes('<html')) {
            detected = 'HTML';
        } else if (content.includes('SELECT') || content.includes('FROM')) {
            detected = 'SQL';
        }

        language.textContent = detected;
    },

    saveFile() {
        const editor = document.getElementById('code-editor');
        if (!editor) return;

        // Save to localStorage for now (would need API integration)
        localStorage.setItem('meauxide-current-file', editor.value);
        console.log('File saved (localStorage)');
    },

    toggleComment() {
        const editor = document.getElementById('code-editor');
        if (!editor) return;

        const selection = editor.value.substring(editor.selectionStart, editor.selectionEnd);
        if (!selection) return;

        // Simple comment toggle (would need language-aware logic)
        const lines = selection.split('\n');
        const commented = lines.map(line => line.trim().startsWith('//')
            ? line.replace(/^\/\/\s*/, '')
            : '// ' + line
        ).join('\n');

        editor.setRangeText(commented, editor.selectionStart, editor.selectionEnd, 'select');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ide.init());
} else {
    ide.init();
}
