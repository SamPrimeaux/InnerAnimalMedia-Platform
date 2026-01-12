// Seamless Sidebar Navigation Component
// This creates a reusable sidebar with app dock for all dashboard pages

class SeamlessSidebar {
    constructor() {
        this.userId = this.getUserId(); // Get from localStorage, cookie, or API
        this.tenantId = this.getTenantId() || 'system';
        this.isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'; // Fallback
        this.currentPage = this.getCurrentPage();
        this.dockItems = [];
        this.recentApps = [];
        this.init();
    }

    getUserId() {
        // Try to get user ID from localStorage, cookie, or API
        return localStorage.getItem('userId') ||
            localStorage.getItem('user_id') ||
            'default-user'; // Fallback for development
    }

    getTenantId() {
        return localStorage.getItem('tenantId') ||
            localStorage.getItem('tenant_id') ||
            'system';
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/dashboard' || path === '/dashboard/') return 'overview';
        return path.split('/').pop() || 'overview';
    }

    async init() {
        // Load preferences from D1 first (fallback to localStorage)
        await this.loadPreferences();

        this.createSidebar();
        this.createAppDock();
        this.bindEvents();
        this.setActiveItems();
        this.loadIcons();
    }

    async loadPreferences() {
        try {
            const response = await fetch(
                `${window.location.origin}/api/users/${this.userId}/preferences?type=sidebar`,
                {
                    headers: {
                        'X-Preference-Type': 'sidebar'
                    }
                }
            );

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    this.isCollapsed = result.data.sidebar_collapsed || false;
                    this.dockItems = result.data.dock_items || [];
                    this.recentApps = result.data.recent_apps || [];

                    // Sync to localStorage as fallback
                    localStorage.setItem('sidebarCollapsed', this.isCollapsed);
                    if (this.dockItems.length > 0) {
                        localStorage.setItem('dockItems', JSON.stringify(this.dockItems));
                    }
                    return;
                }
            }
        } catch (error) {
            console.log('Failed to load preferences from D1, using localStorage fallback:', error);
        }

        // Fallback to localStorage
        const storedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        this.isCollapsed = storedCollapsed;

        try {
            const storedDock = localStorage.getItem('dockItems');
            if (storedDock) {
                this.dockItems = JSON.parse(storedDock);
            }
        } catch (e) {
            console.log('Failed to parse stored dock items');
        }
    }

    async savePreferences() {
        try {
            // Track recent app access
            const existingRecent = this.recentApps.find(app => app.page === this.currentPage);
            if (existingRecent) {
                existingRecent.accessed_at = Math.floor(Date.now() / 1000);
                existingRecent.count = (existingRecent.count || 0) + 1;
            } else {
                this.recentApps.unshift({
                    page: this.currentPage,
                    accessed_at: Math.floor(Date.now() / 1000),
                    count: 1
                });
                // Keep only last 10 recent apps
                this.recentApps = this.recentApps.slice(0, 10);
            }

            const response = await fetch(
                `${window.location.origin}/api/users/${this.userId}/preferences?type=sidebar`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Preference-Type': 'sidebar'
                    },
                    body: JSON.stringify({
                        sidebar_collapsed: this.isCollapsed,
                        sidebar_width: this.isCollapsed ? 72 : 280,
                        dock_items: this.dockItems,
                        recent_apps: this.recentApps,
                        customizations: {}
                    })
                }
            );

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Also update localStorage as fallback
                    localStorage.setItem('sidebarCollapsed', this.isCollapsed);
                    localStorage.setItem('dockItems', JSON.stringify(this.dockItems));
                    return true;
                }
            }
        } catch (error) {
            console.error('Failed to save preferences to D1, using localStorage fallback:', error);
            // Fallback to localStorage only
            localStorage.setItem('sidebarCollapsed', this.isCollapsed);
            localStorage.setItem('dockItems', JSON.stringify(this.dockItems));
            return false;
        }
        return false;
    }

    injectStyles() {
        if (document.getElementById('seamless-sidebar-styles')) return;

        const link = document.createElement('link');
        link.id = 'seamless-sidebar-styles';
        link.rel = 'stylesheet';
        link.href = '/shared/sidebar.css';
        document.head.appendChild(link);
    }

    createSidebar() {
        this.injectStyles();

        const sidebarHTML = `
            <aside id="seamless-sidebar" class="seamless-sidebar ${this.isCollapsed ? 'collapsed' : ''}">
                <!-- Sidebar Header -->
                <div class="sidebar-header">
                    <img src="https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/17535395-1501-490a-ff3d-e43d7c16a000/avatar"
                        alt="InnerAnimalMedia" class="sidebar-logo" />
                    <div class="sidebar-brand">
                        <h1 class="sidebar-brand-title">InnerAnimal</h1>
                        <span class="sidebar-brand-subtitle">MEDIA OS v5.1</span>
                    </div>
                    <button id="sidebar-toggle" class="sidebar-toggle-btn" aria-label="Toggle sidebar">
                        <i data-lucide="panel-left-close" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- Main Navigation -->
                <nav class="sidebar-nav custom-scrollbar">
                    <!-- Hub Section -->
                    <div class="nav-section">
                        <div class="nav-section-label">Hub</div>
                        <div class="nav-section-items">
                            <a href="/dashboard" class="nav-item" data-page="overview">
                                <i data-lucide="home" class="nav-icon"></i>
                                <span class="nav-text">Dashboard</span>
                            </a>
                            <a href="/dashboard/projects" class="nav-item" data-page="projects">
                                <i data-lucide="briefcase" class="nav-icon"></i>
                                <span class="nav-text">Projects</span>
                            </a>
                            <a href="/dashboard/clients" class="nav-item" data-page="clients">
                                <i data-lucide="users" class="nav-icon"></i>
                                <span class="nav-text">Clients</span>
                            </a>
                        </div>
                    </div>

                    <!-- Work Section -->
                    <div class="nav-section">
                        <div class="nav-section-label">Work</div>
                        <div class="nav-section-items">
                            <a href="/dashboard/calendar" class="nav-item" data-page="calendar">
                                <i data-lucide="calendar" class="nav-icon"></i>
                                <span class="nav-text">Calendar</span>
                            </a>
                            <a href="/dashboard/tasks" class="nav-item" data-page="tasks">
                                <i data-lucide="check-square" class="nav-icon"></i>
                                <span class="nav-text">InnerWork</span>
                            </a>
                            <a href="/dashboard/messages" class="nav-item" data-page="messages">
                                <i data-lucide="message-square" class="nav-icon"></i>
                                <span class="nav-text">Messages</span>
                            </a>
                            <a href="/dashboard/video" class="nav-item" data-page="video">
                                <i data-lucide="video" class="nav-icon"></i>
                                <span class="nav-text">Video Calls</span>
                            </a>
                            <a href="/dashboard/workflows" class="nav-item" data-page="workflows">
                                <i data-lucide="zap" class="nav-icon"></i>
                                <span class="nav-text">Automation</span>
                            </a>
                        </div>
                    </div>

                    <!-- Engine Section -->
                    <div class="nav-section">
                        <div class="nav-section-label">Engine</div>
                        <div class="nav-section-items">
                            <a href="/dashboard/prompts" class="nav-item" data-page="prompts">
                                <i data-lucide="brain" class="nav-icon"></i>
                                <span class="nav-text">AI Prompts</span>
                            </a>
                            <a href="/dashboard/meauxmcp" class="nav-item" data-page="meauxmcp">
                                <i data-lucide="server" class="nav-icon"></i>
                                <span class="nav-text">MeauxMCP</span>
                            </a>
                            <a href="/dashboard/meauxsql" class="nav-item" data-page="meauxsql">
                                <i data-lucide="database" class="nav-icon"></i>
                                <span class="nav-text">MeauxSQL</span>
                            </a>
                            <a href="/dashboard/meauxcad" class="nav-item" data-page="meauxcad">
                                <i data-lucide="pen-tool" class="nav-icon"></i>
                                <span class="nav-text">MeauxCAD</span>
                            </a>
                        </div>
                    </div>

                    <!-- Assets Section -->
                    <div class="nav-section">
                        <div class="nav-section-label">Assets</div>
                        <div class="nav-section-items">
                            <a href="/dashboard/library" class="nav-item" data-page="library">
                                <i data-lucide="layout-grid" class="nav-icon"></i>
                                <span class="nav-text">CMS</span>
                            </a>
                            <a href="/dashboard/analytics" class="nav-item" data-page="analytics">
                                <i data-lucide="palette" class="nav-icon"></i>
                                <span class="nav-text">Brand Central</span>
                            </a>
                            <a href="/dashboard/workers" class="nav-item" data-page="workers">
                                <i data-lucide="image" class="nav-icon"></i>
                                <span class="nav-text">Gallery</span>
                            </a>
                        </div>
                    </div>

                    <!-- System Section -->
                    <div class="nav-section">
                        <div class="nav-section-label">System</div>
                        <div class="nav-section-items">
                            <a href="/dashboard/settings" class="nav-item" data-page="settings">
                                <i data-lucide="settings" class="nav-icon"></i>
                                <span class="nav-text">Settings</span>
                            </a>
                        </div>
                    </div>
                </nav>

                <!-- User Profile Footer -->
                <div class="sidebar-footer">
                    <div class="user-profile">
                        <div class="user-avatar">SP</div>
                        <div class="user-info">
                            <div class="user-name">Sam Primeaux</div>
                            <div class="user-email">sam@inneranimal.com</div>
                        </div>
                    </div>
                </div>
            </aside>
        `;

        // Remove existing sidebars if present
        const existingOld = document.getElementById('sidebar');
        const existingNew = document.getElementById('seamless-sidebar');
        if (existingOld) existingOld.remove();
        if (existingNew) existingNew.remove();

        // Hide old sidebar if it exists
        const oldSidebar = document.querySelector('aside#sidebar');
        if (oldSidebar) oldSidebar.style.display = 'none';

        // Insert new sidebar
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

        // Adjust body padding
        document.body.style.paddingLeft = this.isCollapsed ? '72px' : '280px';
        document.body.style.transition = 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    createAppDock() {
        const dockHTML = `
            <div id="app-dock" class="app-dock">
                <div class="app-dock-container">
                    <div class="dock-item" data-tooltip="Dashboard" data-page="overview">
                        <a href="/dashboard" class="dock-icon">
                            <i data-lucide="home"></i>
                        </a>
                    </div>
                    <div class="dock-item" data-tooltip="Projects" data-page="projects">
                        <a href="/dashboard/projects" class="dock-icon">
                            <i data-lucide="briefcase"></i>
                        </a>
                    </div>
                    <div class="dock-item" data-tooltip="InnerWork" data-page="tasks">
                        <a href="/dashboard/tasks" class="dock-icon">
                            <i data-lucide="check-square"></i>
                        </a>
                    </div>
                    <div class="dock-item" data-tooltip="Messages" data-page="messages">
                        <a href="/dashboard/messages" class="dock-icon">
                            <i data-lucide="message-square"></i>
                        </a>
                    </div>
                    <div class="dock-item" data-tooltip="Video Calls" data-page="video">
                        <a href="/dashboard/video" class="dock-icon">
                            <i data-lucide="video"></i>
                        </a>
                    </div>
                    <div class="dock-item dock-divider"></div>
                    <div class="dock-item" data-tooltip="Calendar" data-page="calendar">
                        <a href="/dashboard/calendar" class="dock-icon">
                            <i data-lucide="calendar"></i>
                        </a>
                    </div>
                    <div class="dock-item" data-tooltip="Automation" data-page="workflows">
                        <a href="/dashboard/workflows" class="dock-icon">
                            <i data-lucide="zap"></i>
                        </a>
                    </div>
                    <div class="dock-item" data-tooltip="CMS" data-page="library">
                        <a href="/dashboard/library" class="dock-icon">
                            <i data-lucide="layout-grid"></i>
                        </a>
                    </div>
                    <div class="dock-item" data-tooltip="Settings" data-page="settings">
                        <a href="/dashboard/settings" class="dock-icon">
                            <i data-lucide="settings"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;

        // Remove existing dock if present
        const existing = document.getElementById('app-dock');
        if (existing) existing.remove();

        // Insert dock
        document.body.insertAdjacentHTML('beforeend', dockHTML);
    }

    bindEvents() {
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }

    async toggle() {
        const sidebar = document.getElementById('seamless-sidebar');
        if (!sidebar) return;

        this.isCollapsed = !this.isCollapsed;
        sidebar.classList.toggle('collapsed', this.isCollapsed);

        // Update body padding
        document.body.style.paddingLeft = this.isCollapsed ? '72px' : '280px';

        // Save to D1 (with localStorage fallback)
        await this.savePreferences();

        const icon = document.querySelector('#sidebar-toggle i');
        if (icon && typeof lucide !== 'undefined') {
            icon.setAttribute('data-lucide', this.isCollapsed ? 'panel-left-open' : 'panel-left-close');
            lucide.createIcons();
        }
    }

    setActiveItems() {
        // Set active nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            const page = item.getAttribute('data-page');
            if (page === this.currentPage) {
                item.classList.add('active');
            }
        });

        // Set active dock items
        document.querySelectorAll('.dock-item[data-page]').forEach(item => {
            const page = item.getAttribute('data-page');
            if (page === this.currentPage) {
                item.classList.add('active');
            }
        });

        // Track page access for recent apps
        this.savePreferences().catch(() => {
            // Silent fail, will retry on next save
        });
    }

    loadIcons() {
        if (typeof lucide !== 'undefined') {
            setTimeout(() => {
                lucide.createIcons();
            }, 100);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SeamlessSidebar());
} else {
    new SeamlessSidebar();
}
