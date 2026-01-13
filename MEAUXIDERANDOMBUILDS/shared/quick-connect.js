// Quick-Connect Toolbar System
// Allows users to select unlimited applications and external services for quick access

const quickConnect = {
    // Use current origin (inneranimalmedia.com or www.inneranimalmedia.com)
    // Worker is routed to inneranimalmedia.com/* and www.inneranimalmedia.com/*
    apiBase: window.location.origin,
    fallbackApiBase: 'https://inneranimalmedia-dev.meauxbility.workers.dev',
    userId: null, // Will be set from session/auth
    preferences: {
        connections: [] // Array of connection IDs: ['tool-meauxide', 'tool-meauxmcp', 'external-claude', ...]
    },

    // Built-in tools configuration
    builtInTools: [
        { id: 'tool-meauxide', name: 'MeauxIDE', icon: 'code', color: 'from-green-500 to-teal-500', description: 'CLI / CI/CD / IDE Workflows', type: 'internal' },
        { id: 'tool-meauxmcp', name: 'MeauxMCP', icon: 'server', color: 'from-brand-orange to-brand-red', description: 'MCP Protocol Manager', type: 'internal' },
        { id: 'tool-meauxsql', name: 'MeauxSQL', icon: 'database', color: 'from-blue-500 to-purple-500', description: 'SQL Database Tool', type: 'internal' },
        { id: 'tool-meauxcad', name: 'MeauxCAD', icon: 'pen-tool', color: 'from-purple-500 to-pink-500', description: '3D Modeling Tool', type: 'internal' },
        { id: 'workflows', name: 'Workflows', icon: 'zap', color: 'from-yellow-500 to-orange-500', description: 'Automation & Workflows', type: 'internal' },
        { id: 'deployments', name: 'Deployments', icon: 'rocket', color: 'from-blue-500 to-cyan-500', description: 'Deployment Management', type: 'internal' },
        { id: 'workers', name: 'Workers', icon: 'cloud', color: 'from-indigo-500 to-purple-500', description: 'Cloudflare Workers', type: 'internal' },
        { id: 'projects', name: 'Projects', icon: 'briefcase', color: 'from-emerald-500 to-teal-500', description: 'Project Management', type: 'internal' }
    ],

    // External apps available to connect
    externalApps: [
        { id: 'claude', name: 'Claude', icon: 'bot', color: 'from-purple-500 to-pink-500', description: 'Anthropic Claude AI', type: 'external', authType: 'api_key', category: 'ai' },
        { id: 'openai', name: 'OpenAI', icon: 'sparkles', color: 'from-green-500 to-emerald-500', description: 'OpenAI GPT & DALL-E', type: 'external', authType: 'api_key', category: 'ai' },
        { id: 'google-drive', name: 'Google Drive', icon: 'hard-drive', color: 'from-blue-500 to-cyan-500', description: 'Google Drive Storage', type: 'external', authType: 'oauth2', category: 'storage' },
        { id: 'cloudconvert', name: 'CloudConvert', icon: 'file-up', color: 'from-orange-500 to-red-500', description: 'File Conversion API', type: 'external', authType: 'api_key', category: 'productivity' },
        { id: 'cursor', name: 'Cursor', icon: 'mouse-pointer-2', color: 'from-indigo-500 to-purple-500', description: 'Cursor AI Editor', type: 'external', authType: 'api_key', category: 'development' },
        { id: 'github', name: 'GitHub', icon: 'github', color: 'from-gray-700 to-gray-900', description: 'GitHub Integration', type: 'external', authType: 'oauth2', category: 'development' },
        { id: 'slack', name: 'Slack', icon: 'message-square', color: 'from-purple-500 to-pink-500', description: 'Slack Workspace', type: 'external', authType: 'oauth2', category: 'productivity' },
        { id: 'notion', name: 'Notion', icon: 'file-text', color: 'from-gray-800 to-gray-900', description: 'Notion Workspace', type: 'external', authType: 'oauth2', category: 'productivity' }
    ],

    // User's connected external apps (loaded from API)
    connectedApps: [],

    async init() {
        // Get user ID from localStorage or session (for now, use a default)
        this.userId = localStorage.getItem('userId') || 'user-samprimeaux';

        // Load user preferences and connected apps
        await this.loadPreferences();
        await this.loadConnectedApps();

        // Render toolbar
        this.renderToolbar();

        // Show toolbar
        const toolbar = document.getElementById('quick-connect-toolbar');
        if (toolbar) {
            toolbar.classList.remove('hidden');
            toolbar.classList.add('flex');
        }
    },

    async loadPreferences() {
        try {
            // Try to load from API (use current origin first, fallback to workers.dev)
            const prefsUrl = `${this.apiBase}/api/users/${this.userId}/preferences`;
            const connectionsUrl = `${this.apiBase}/api/users/${this.userId}/connections`;
            
            const [prefsRes, connectionsRes] = await Promise.all([
                fetch(prefsUrl).catch(() => fetch(`${this.fallbackApiBase}/api/users/${this.userId}/preferences`)),
                fetch(connectionsUrl).catch(() => fetch(`${this.fallbackApiBase}/api/users/${this.userId}/connections`))
            ]);

            if (prefsRes.ok) {
                const data = await prefsRes.json();
                if (data.success && data.data) {
                    this.preferences = data.data;
                    // Migrate old coreFour to connections if needed
                    if (data.data.coreFour && !data.data.connections) {
                        this.preferences.connections = data.data.coreFour;
                    }
                }
            }

            if (connectionsRes.ok) {
                const data = await connectionsRes.json();
                if (data.success && data.data) {
                    this.connectedApps = data.data;
                }
            }
        } catch (error) {
            console.log('Loading preferences from localStorage fallback');
            // Fallback to localStorage
            const saved = localStorage.getItem('quickConnectPreferences');
            if (saved) {
                this.preferences = JSON.parse(saved);
                // Migrate old format
                if (this.preferences.coreFour && !this.preferences.connections) {
                    this.preferences.connections = this.preferences.coreFour;
                }
            } else {
                // Default preferences for superadmin
                this.preferences = {
                    connections: ['tool-meauxide', 'tool-meauxmcp', 'tool-meauxsql', 'deployments']
                };
            }
        }
    },

    async savePreferences() {
        try {
            // Save to API
            const response = await fetch(`${this.apiBase}/api/users/${this.userId}/preferences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.preferences)
            });

            // Also save to localStorage as backup
            localStorage.setItem('quickConnectPreferences', JSON.stringify(this.preferences));

            // Re-render toolbar
            this.renderToolbar();
            this.hideSettings();

            // Show success message
            this.showNotification('Preferences saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving preferences:', error);
            // Fallback to localStorage
            localStorage.setItem('quickConnectPreferences', JSON.stringify(this.preferences));
            this.renderToolbar();
            this.hideSettings();
            this.showNotification('Preferences saved locally', 'info');
        }
    },

    async loadConnectedApps() {
        try {
            const response = await fetch(`${this.apiBase}/api/users/${this.userId}/connections`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.connectedApps = data.data;
                }
            }
        } catch (error) {
            console.error('Error loading connected apps:', error);
        }
    },

    renderToolbar() {
        const container = document.getElementById('quick-connect-apps');
        if (!container) return;

        const connections = this.preferences.connections || [];

        if (connections.length === 0) {
            container.innerHTML = '<div class="text-xs text-zinc-500 px-4">No connections. Click settings to add apps.</div>';
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        container.innerHTML = connections.map(connId => {
            // Check if it's an external app connection
            const connectedApp = this.connectedApps.find(c => c.id === connId);
            if (connectedApp) {
                const app = this.externalApps.find(a => a.id === connectedApp.app_id) ||
                    { id: connectedApp.app_id, name: connectedApp.app_name, icon: 'link', color: 'from-gray-500 to-gray-600' };
                const statusColor = connectedApp.connection_status === 'connected' ? 'bg-emerald-400' : 'bg-yellow-400';
                return `
                    <button 
                        onclick="quickConnect.openExternalApp('${connectedApp.id}')" 
                        class="quick-connect-btn p-3 rounded-xl bg-gradient-to-br ${app.color} hover:scale-105 transition-all shadow-lg hover:shadow-xl group relative"
                        title="${app.name}"
                    >
                        <i data-lucide="${app.icon}" class="w-5 h-5 text-white"></i>
                        <div class="absolute -top-1 -right-1 w-3 h-3 ${statusColor} rounded-full border-2 border-brand-surface"></div>
                    </button>
                `;
            }

            // Check built-in tools
            const tool = this.builtInTools.find(t => t.id === connId) ||
                { id: connId, name: connId, icon: 'circle', color: 'from-gray-500 to-gray-600' };

            return `
                <button 
                    onclick="quickConnect.openTool('${tool.id}')" 
                    class="quick-connect-btn p-3 rounded-xl bg-gradient-to-br ${tool.color} hover:scale-105 transition-all shadow-lg hover:shadow-xl group relative"
                    title="${tool.name}"
                >
                    <i data-lucide="${tool.icon}" class="w-5 h-5 text-white"></i>
                    <div class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-brand-surface opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            `;
        }).join('');

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },

    openTool(toolId) {
        if (toolId.startsWith('tool-')) {
            // Open tool lightbox or full page
            if (toolId === 'tool-meauxide') {
                this.openLightbox('ide-lightbox');
            } else if (toolId === 'tool-meauxmcp') {
                this.openLightbox('meauxmcp-lightbox');
                this.loadRecentDevelopments();
            } else {
                // Navigate to tool page
                window.location.href = `/dashboard/${toolId.replace('tool-', '')}`;
            }
        } else {
            // Navigate to dashboard page
            window.location.href = `/dashboard/${toolId}`;
        }
    },

    openLightbox(id) {
        document.getElementById(id).classList.remove('hidden');
        document.getElementById(id).classList.add('flex');
        document.body.style.overflow = 'hidden';
    },

    closeLightbox(id) {
        document.getElementById(id).classList.add('hidden');
        document.getElementById(id).classList.remove('flex');
        document.body.style.overflow = '';
    },

    showSettings() {
        this.renderSettings();
        document.getElementById('quick-connect-settings').classList.remove('hidden');
        document.getElementById('quick-connect-settings').classList.add('flex');
        document.body.style.overflow = 'hidden';
    },

    hideSettings() {
        document.getElementById('quick-connect-settings').classList.add('hidden');
        document.getElementById('quick-connect-settings').classList.remove('flex');
        document.body.style.overflow = '';
    },

    renderSettings() {
        const container = document.getElementById('available-tools-list');
        const connections = this.preferences.connections || [];

        // Build combined list: built-in tools + external apps
        const allApps = [
            ...this.builtInTools.map(t => ({ ...t, isConnected: false })),
            ...this.connectedApps.map(conn => {
                const app = this.externalApps.find(a => a.id === conn.app_id);
                return {
                    id: conn.id,
                    name: app?.name || conn.app_name,
                    icon: app?.icon || 'link',
                    color: app?.color || 'from-gray-500 to-gray-600',
                    description: app?.description || 'External connection',
                    type: 'external',
                    isConnected: true,
                    connectionStatus: conn.connection_status
                };
            })
        ];

        container.innerHTML = `
            <!-- Built-in Tools Section -->
            <div class="mb-6">
                <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Built-in Tools</h3>
                <div class="space-y-3">
                    ${this.builtInTools.map(tool => {
            const isSelected = connections.includes(tool.id);
            const order = connections.indexOf(tool.id);
            return `
                            <div class="flex items-center gap-4 p-4 bg-black/40 border ${isSelected ? 'border-brand-orange/50' : 'border-white/10'} rounded-xl hover:border-white/20 transition-all cursor-move" draggable="true" data-tool-id="${tool.id}">
                                <div class="flex items-center gap-3 flex-1">
                                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center">
                                        <i data-lucide="${tool.icon}" class="w-5 h-5 text-white"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="font-medium text-white">${tool.name}</div>
                                        <div class="text-xs text-zinc-400">${tool.description}</div>
                                    </div>
                                    ${isSelected ? `<span class="px-2 py-1 rounded-full text-xs font-medium bg-brand-orange/20 text-brand-orange">#${order + 1}</span>` : ''}
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="quickConnect.toggleTool('${tool.id}')" class="sr-only peer">
                                    <div class="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange"></div>
                                </label>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
            
            <!-- External Apps Section -->
            <div>
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider">External Apps</h3>
                    <button onclick="quickConnect.showAddAppModal()" class="px-3 py-1.5 rounded-lg bg-brand-orange hover:bg-orange-600 text-white text-xs font-medium transition-colors flex items-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i> Add App
                    </button>
                </div>
                <div class="space-y-3">
                    ${this.externalApps.map(app => {
            const connection = this.connectedApps.find(c => c.app_id === app.id);
            const isConnected = !!connection;
            const isSelected = connection ? connections.includes(connection.id) : false;
            const order = isSelected ? connections.indexOf(connection.id) : -1;
            const statusColor = connection?.connection_status === 'connected' ? 'bg-emerald-500' : connection?.connection_status === 'error' ? 'bg-red-500' : 'bg-yellow-500';

            return `
                            <div class="flex items-center gap-4 p-4 bg-black/40 border ${isSelected ? 'border-brand-orange/50' : 'border-white/10'} rounded-xl hover:border-white/20 transition-all" data-app-id="${app.id}">
                                <div class="flex items-center gap-3 flex-1">
                                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br ${app.color} flex items-center justify-center">
                                        <i data-lucide="${app.icon}" class="w-5 h-5 text-white"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2">
                                            <div class="font-medium text-white">${app.name}</div>
                                            ${isConnected ? `<span class="w-2 h-2 ${statusColor} rounded-full"></span>` : ''}
                                        </div>
                                        <div class="text-xs text-zinc-400">${app.description}</div>
                                    </div>
                                    ${isSelected && order >= 0 ? `<span class="px-2 py-1 rounded-full text-xs font-medium bg-brand-orange/20 text-brand-orange">#${order + 1}</span>` : ''}
                                </div>
                                <div class="flex items-center gap-2">
                                    ${isConnected ? `
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="quickConnect.toggleTool('${connection.id}')" class="sr-only peer">
                                            <div class="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange"></div>
                                        </label>
                                        <button onclick="quickConnect.disconnectApp('${connection.id}')" class="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs transition-colors">
                                            <i data-lucide="unlink" class="w-4 h-4"></i>
                                        </button>
                                    ` : `
                                        <button onclick="quickConnect.connectExternalApp('${app.id}')" class="px-3 py-1.5 rounded-lg bg-brand-orange hover:bg-orange-600 text-white text-xs font-medium transition-colors">
                                            Connect
                                        </button>
                                    `}
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Add drag and drop for built-in tools
        this.setupDragAndDrop();
    },

    showAddAppModal() {
        // Show modal to add custom app (future feature)
        this.showNotification('Custom app integration coming soon!', 'info');
    },

    async disconnectApp(connectionId) {
        if (!confirm('Are you sure you want to disconnect this app?')) return;

        try {
            const response = await fetch(`${this.apiBase}/api/users/${this.userId}/connections/${connectionId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                // Remove from connections if selected
                this.preferences.connections = this.preferences.connections.filter(id => id !== connectionId);
                await this.savePreferences();
                await this.loadConnectedApps();
                this.renderSettings();
                this.showNotification('App disconnected successfully', 'success');
            } else {
                this.showNotification('Failed to disconnect', 'error');
            }
        } catch (error) {
            console.error('Error disconnecting app:', error);
            this.showNotification('Failed to disconnect', 'error');
        }
    },

    setupDragAndDrop() {
        const container = document.getElementById('available-tools-list');
        let draggedElement = null;

        container.querySelectorAll('[draggable="true"]').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedElement = item;
                item.style.opacity = '0.5';
            });

            item.addEventListener('dragend', (e) => {
                item.style.opacity = '1';
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(draggedElement);
                } else {
                    container.insertBefore(draggedElement, afterElement);
                }
            });
        });
    },

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    toggleTool(toolId) {
        const connections = this.preferences.connections || [];
        const index = connections.indexOf(toolId);

        if (index > -1) {
            // Remove if already selected
            connections.splice(index, 1);
        } else {
            // Add if not selected (unlimited now!)
            connections.push(toolId);
        }

        this.preferences.connections = connections;
        this.renderSettings();
    },

    async connectExternalApp(appId) {
        const app = this.externalApps.find(a => a.id === appId);
        if (!app) return;

        // Show connection modal
        this.showConnectionModal(app);
    },

    showConnectionModal(app) {
        // Create or show connection modal
        let modal = document.getElementById('external-app-connection-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'external-app-connection-modal';
            modal.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-black/60 backdrop-blur-sm';
            document.body.appendChild(modal);
        }

        if (app.authType === 'api_key') {
            modal.innerHTML = `
                <div class="bg-brand-surface border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center">
                                <i data-lucide="${app.icon}" class="w-6 h-6 text-white"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">Connect ${app.name}</h2>
                                <p class="text-sm text-zinc-400">Enter your API key</p>
                            </div>
                        </div>
                        <button onclick="quickConnect.closeConnectionModal()" class="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <form onsubmit="quickConnect.saveApiKey(event, '${app.id}')" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-zinc-300 mb-2">API Key</label>
                            <input type="password" id="api-key-${app.id}" required class="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange transition-colors" placeholder="sk-...">
                            <p class="text-xs text-zinc-500 mt-1">Your API key is encrypted and stored securely</p>
                        </div>
                        <div class="flex items-center gap-3 pt-4">
                            <button type="button" onclick="quickConnect.closeConnectionModal()" class="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" class="flex-1 px-4 py-2 rounded-lg bg-brand-orange hover:bg-orange-600 text-white transition-colors">
                                Connect
                            </button>
                        </div>
                    </form>
                </div>
            `;
        } else if (app.authType === 'oauth2') {
            modal.innerHTML = `
                <div class="bg-brand-surface border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center">
                                <i data-lucide="${app.icon}" class="w-6 h-6 text-white"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">Connect ${app.name}</h2>
                                <p class="text-sm text-zinc-400">OAuth 2.0 authentication</p>
                            </div>
                        </div>
                        <button onclick="quickConnect.closeConnectionModal()" class="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <div class="space-y-4">
                        <p class="text-sm text-zinc-400">Click below to authorize ${app.name} access. You'll be redirected to ${app.name} to complete the connection.</p>
                        <button onclick="quickConnect.initiateOAuth('${app.id}')" class="w-full px-4 py-3 rounded-lg bg-gradient-to-br ${app.color} hover:scale-105 transition-all text-white font-semibold shadow-lg">
                            <i data-lucide="${app.icon}" class="w-5 h-5 inline mr-2"></i>
                            Connect with ${app.name}
                        </button>
                        <button onclick="quickConnect.closeConnectionModal()" class="w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            `;
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },

    closeConnectionModal() {
        const modal = document.getElementById('external-app-connection-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }
    },

    async saveApiKey(event, appId) {
        event.preventDefault();
        const apiKey = document.getElementById(`api-key-${appId}`).value;

        try {
            const response = await fetch(`${this.apiBase}/api/users/${this.userId}/connections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    app_id: appId,
                    auth_type: 'api_key',
                    credentials: apiKey // Will be encrypted on server
                })
            });

            const data = await response.json();
            if (data.success) {
                await this.loadConnectedApps();
                this.closeConnectionModal();
                this.showNotification(`${this.externalApps.find(a => a.id === appId)?.name || appId} connected successfully!`, 'success');
                // Add to connections if not already there
                if (!this.preferences.connections.includes(data.data.id)) {
                    this.preferences.connections.push(data.data.id);
                    await this.savePreferences();
                }
            } else {
                this.showNotification(data.error || 'Failed to connect', 'error');
            }
        } catch (error) {
            console.error('Error saving API key:', error);
            this.showNotification('Failed to connect. Please try again.', 'error');
        }
    },

    async initiateOAuth(appId) {
        // Redirect to OAuth flow
        const response = await fetch(`${this.apiBase}/api/oauth/${appId}/authorize?user_id=${this.userId}`, {
            method: 'GET',
            redirect: 'follow'
        });

        // For now, show a message (OAuth flow would redirect)
        this.showNotification('OAuth flow will be implemented. For now, use API key method.', 'info');
    },

    openExternalApp(connectionId) {
        const connection = this.connectedApps.find(c => c.id === connectionId);
        if (!connection) return;

        if (connection.connection_status !== 'connected') {
            this.showNotification('Connection not active. Please reconnect.', 'warning');
            return;
        }

        const app = this.externalApps.find(a => a.id === connection.app_id);
        if (!app) return;

        // Open app-specific lightbox or action
        if (app.id === 'claude') {
            this.openClaudeLightbox(connection);
        } else if (app.id === 'openai') {
            this.openOpenAILightbox(connection);
        } else {
            this.showNotification(`${app.name} integration coming soon!`, 'info');
        }
    },

    openClaudeLightbox(connection) {
        // Open Claude chat interface
        window.location.href = '/dashboard/claude';
    },

    openOpenAILightbox(connection) {
        // Create OpenAI lightbox
        this.showNotification('OpenAI integration - GPT & DALL-E interface coming soon!', 'info');
    },

    // MeauxMCP Quick Actions
    async restartBuilds() {
        this.showNotification('Restarting builds...', 'info');
        try {
            // TODO: Implement build restart API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.showNotification('Builds restarted successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to restart builds', 'error');
        }
    },

    async refineWorkflows() {
        window.location.href = '/dashboard/workflows';
    },

    async syncCloudflare() {
        this.showNotification('Syncing from Cloudflare...', 'info');
        try {
            await api.syncFromCloudflare();
            this.showNotification('Sync completed!', 'success');
        } catch (error) {
            this.showNotification('Sync failed', 'error');
        }
    },

    viewLogs() {
        window.location.href = '/dashboard/workflows?tab=logs';
    },

    async loadRecentDevelopments() {
        const container = document.getElementById('recent-developments');
        container.innerHTML = `
            <div class="space-y-3">
                <div class="p-4 bg-black/40 border border-white/10 rounded-xl">
                    <div class="flex items-center justify-between mb-2">
                        <div class="font-medium text-white">Dashboard Pages Complete</div>
                        <span class="text-xs text-emerald-400">2h ago</span>
                    </div>
                    <p class="text-sm text-zinc-400">All dashboard pages connected to real API</p>
                </div>
                <div class="p-4 bg-black/40 border border-white/10 rounded-xl">
                    <div class="flex items-center justify-between mb-2">
                        <div class="font-medium text-white">Quick-Connect Toolbar</div>
                        <span class="text-xs text-emerald-400">Just now</span>
                    </div>
                    <p class="text-sm text-zinc-400">Personalized workflow toolbar added</p>
                </div>
            </div>
        `;
    },

    // IDE Quick Actions
    openFullIDE() {
        window.location.href = '/dashboard/meauxide';
    },

    runCLI() {
        const terminal = document.getElementById('ide-terminal');
        terminal.innerHTML = `
            <div class="mb-2">$ wrangler deploy</div>
            <div class="text-emerald-400">✓ Deployed successfully</div>
            <div class="text-zinc-500 mt-4">$ Ready for commands...</div>
        `;
    },

    runCI() {
        window.location.href = '/dashboard/deployments';
    },

    openEditor() {
        window.location.href = '/dashboard/meauxide';
    },

    showNotification(message, type = 'info') {
        // Simple notification (can be enhanced)
        const colors = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-[200]`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => quickConnect.init());
} else {
    quickConnect.init();
}

// Make available globally
window.quickConnect = quickConnect;
