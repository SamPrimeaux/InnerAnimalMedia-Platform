// Shared Layout JavaScript for Multi-Page Dashboard
// Include this in every dashboard page

// --- API CONFIGURATION ---
const API = {
    baseURL: window.location.origin,
    async get(endpoint) {
        const res = await fetch(`${this.baseURL}/api/${endpoint}`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
    },
    async post(endpoint, data) {
        const res = await fetch(`${this.baseURL}/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
    },
    async put(endpoint, data) {
        const res = await fetch(`${this.baseURL}/api/${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
    },
    async delete(endpoint) {
        const res = await fetch(`${this.baseURL}/api/${endpoint}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
    },
    async put(endpoint, data) {
        const res = await fetch(`${this.baseURL}/api/${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
    },
    async syncFromCloudflare() {
        try {
            showNotification('Syncing from Cloudflare...', 'info');

            // Track sync event in analytics
            try {
                await fetch(`${this.baseURL}/api/analytics/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_type: 'user_action',
                        action: 'sync_cloudflare',
                        metadata: { source: 'dashboard', page: window.location.pathname }
                    })
                }).catch(() => { }); // Silently fail if analytics endpoint doesn't exist yet
            } catch (e) {
                // Analytics tracking is optional
            }

            const res = await this.get('stats?sync=true');
            if (res.success) {
                const syncInfo = res.data?.syncInfo || {};
                const deploymentsSynced = syncInfo.deploymentsSynced || 0;
                const workersSynced = syncInfo.workersSynced || 0;
                const errors = syncInfo.errors || [];

                if (errors.length > 0) {
                    showNotification(`Sync completed with ${errors.length} error(s): ${deploymentsSynced} deployments, ${workersSynced} workers`, 'error');
                } else {
                    showNotification(`Synced from Cloudflare: ${deploymentsSynced} deployments, ${workersSynced} workers`, 'success');
                }

                // Reload stats after sync
                if (typeof loadStats === 'function') {
                    await loadStats();
                }

                return res.data;
            } else {
                showNotification('Sync failed: ' + (res.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Sync error:', error);
            showNotification('Sync failed: ' + error.message, 'error');
        }
    }
};

// --- APP CONTROLLER ---
const app = {
    sidebarOpen: true,
    toggleSidebar: () => {
        const sidebar = document.getElementById('sidebar');
        const texts = document.querySelectorAll('.sidebar-text');
        app.sidebarOpen = !app.sidebarOpen;

        if (app.sidebarOpen) {
            sidebar.classList.remove('w-20');
            sidebar.classList.add('w-64');
            texts.forEach(t => t.classList.remove('hidden'));
        } else {
            sidebar.classList.remove('w-64');
            sidebar.classList.add('w-20');
            texts.forEach(t => t.classList.add('hidden'));
        }
    }
};

// --- AGENT SAM CONTROLLER (MCP Integration) ---
const agentSam = {
    isOpen: false,
    toggle: () => {
        const term = document.getElementById('agent-terminal');
        const trigger = document.getElementById('agent-trigger');
        if (!term || !trigger) return; // Terminal not on all pages

        agentSam.isOpen = !agentSam.isOpen;

        if (agentSam.isOpen) {
            term.classList.remove('translate-y-full');
            trigger.classList.add('opacity-0', 'pointer-events-none', 'rotate-90');
            setTimeout(() => {
                const input = document.getElementById('agent-input');
                if (input) input.focus();
            }, 100);
        } else {
            term.classList.add('translate-y-full');
            trigger.classList.remove('opacity-0', 'pointer-events-none', 'rotate-90');
        }
    },
    async submit(e) {
        e.preventDefault();
        const input = document.getElementById('agent-input');
        const logs = document.getElementById('agent-logs');
        if (!input || !logs) return;

        const val = input.value.trim();
        if (!val) return;

        // Add User Message
        logs.innerHTML += `<div class="text-white mt-2"><span class="text-zinc-500 mr-2">➜</span>${val}</div>`;
        input.value = '';
        logs.scrollTop = logs.scrollHeight;

        // Call MCP Agent API
        try {
            logs.innerHTML += `<div class="text-zinc-500 mt-1 animate-pulse">Processing via MCP...</div>`;

            const res = await API.post('agent/execute', {
                prompt: val,
                context: { page: window.location.pathname }
            });

            logs.lastElementChild.remove();
            if (res.success) {
                logs.innerHTML += `<div class="text-brand-orange mt-1">${res.result || res.message || 'Command executed successfully.'}</div>`;
            } else {
                logs.innerHTML += `<div class="text-red-400 mt-1">Error: ${res.error || 'Execution failed'}</div>`;
            }
        } catch (error) {
            logs.lastElementChild.remove();
            logs.innerHTML += `<div class="text-red-400 mt-1">Error: ${error.message}</div>`;
        }

        logs.scrollTop = logs.scrollHeight;
    }
};

// --- NOTIFICATIONS ---
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-24 right-8 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' :
        type === 'error' ? 'bg-red-500/20 border border-red-500/50 text-red-400' :
            'bg-blue-500/20 border border-blue-500/50 text-blue-400'
        }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// --- NAVIGATION ACTIVE STATE ---
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (currentPath === linkPath || (currentPath === '/dashboard/' && (linkPath === '/dashboard/' || linkPath === '/dashboard'))) {
            link.classList.add('bg-brand-orange', 'text-white', 'shadow-lg', 'shadow-orange-900/20');
            link.classList.remove('text-zinc-400', 'hover:bg-white/5');
            const icon = link.querySelector('i');
            if (icon) icon.classList.add('text-white');
        } else {
            link.classList.remove('bg-brand-orange', 'text-white', 'shadow-lg', 'shadow-orange-900/20');
            link.classList.add('text-zinc-400', 'hover:bg-white/5');
        }
    });
}

// --- GLOBAL SEARCH ---
function initGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                // Redirect to projects page with search
                window.location.href = `/dashboard/projects?search=${encodeURIComponent(query)}`;
            }
        }
    });
}

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Set active nav link
    setActiveNavLink();

    // Initialize global search
    initGlobalSearch();

    // Handle Keyboard Shortcut for Sam (Ctrl/Cmd + J)
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
            e.preventDefault();
            if (typeof agentSam !== 'undefined' && agentSam.toggle) {
                agentSam.toggle();
            }
        }
    });
});

// Export for use in page scripts
window.API = API;
window.app = app;
window.agentSam = agentSam;
window.showNotification = showNotification;
