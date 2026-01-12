/**
 * Unified Navigation System
 * Ensures consistent navigation across all dashboard pages
 */

const NAVIGATION_CONFIG = {
    hub: [
        { href: '/dashboard/index', icon: 'home', label: 'Home' },
        { href: '/dashboard/analytics', icon: 'bar-chart-2', label: 'Analytics' }
    ],
    content: [
        { href: '/dashboard/projects', icon: 'briefcase', label: 'Projects', badge: null },
        { href: '/dashboard/calendar', icon: 'calendar', label: 'Calendar' },
        { href: '/dashboard/tasks', icon: 'check-square', label: 'Tasks' },
        { href: '/dashboard/library', icon: 'book', label: 'Library' },
        { href: '/dashboard/team', icon: 'users', label: 'Team' }
    ],
    engine: [
        { href: '/dashboard/meauxide', icon: 'code', label: 'MeauxIDE' },
        { href: '/dashboard/meauxmcp', icon: 'server', label: 'MeauxMCP' },
        { href: '/dashboard/meauxsql', icon: 'database', label: 'MeauxSQL' },
        { href: '/dashboard/meauxcad', icon: 'pen-tool', label: 'MeauxCAD' }
    ],
    infrastructure: [
        { href: '/dashboard/cloudflare', icon: 'cloud', label: 'Cloudflare' },
        { href: '/dashboard/ai-services', icon: 'sparkles', label: 'AI Services' },
        { href: '/dashboard/api-gateway', icon: 'network', label: 'API Gateway' },
        { href: '/dashboard/databases', icon: 'database', label: 'Databases' },
        { href: '/dashboard/deployments', icon: 'rocket', label: 'Deployments' },
        { href: '/dashboard/workers', icon: 'zap', label: 'Workers' }
    ],
    settings: [
        { href: '/dashboard/settings', icon: 'settings', label: 'Settings' }
    ]
};

function renderNavigation(currentPath = '') {
    const currentPage = currentPath.split('/').pop() || 'index.html';

    return `
        <aside class="sidebar" id="sidebar">
            <div class="brand-header">
                <div class="brand-logo-container">
                    <div class="brand-logo"></div>
                    <div class="brand-name">InnerAnimalMedia</div>
                </div>
                <span class="brand-plan">Enterprise</span>
            </div>

            <nav class="nav-section">
                ${NAVIGATION_CONFIG.hub.map(item => `
                    <a href="${item.href}" class="nav-item ${currentPage === item.href.split('/').pop() ? 'active' : ''}">
                        <i data-lucide="${item.icon}" class="nav-icon"></i>
                        <span class="nav-text">${item.label}</span>
                    </a>
                `).join('')}
            </nav>

            <nav class="nav-section">
                <div class="nav-label">Content</div>
                ${NAVIGATION_CONFIG.content.map(item => `
                    <a href="${item.href}" class="nav-item ${currentPage === item.href.split('/').pop() ? 'active' : ''}">
                        <i data-lucide="${item.icon}" class="nav-icon"></i>
                        <span class="nav-text">${item.label}</span>
                        ${item.badge !== null ? `<span class="nav-badge" id="projectsBadge">0</span>` : ''}
                    </a>
                `).join('')}
            </nav>

            <nav class="nav-section">
                <div class="nav-label">Engine</div>
                ${NAVIGATION_CONFIG.engine.map(item => `
                    <a href="${item.href}" class="nav-item ${currentPage === item.href.split('/').pop() ? 'active' : ''}">
                        <i data-lucide="${item.icon}" class="nav-icon"></i>
                        <span class="nav-text">${item.label}</span>
                    </a>
                `).join('')}
            </nav>

            <nav class="nav-section">
                <div class="nav-label">Infrastructure</div>
                ${NAVIGATION_CONFIG.infrastructure.map(item => `
                    <a href="${item.href}" class="nav-item ${currentPage === item.href.split('/').pop() ? 'active' : ''}">
                        <i data-lucide="${item.icon}" class="nav-icon"></i>
                        <span class="nav-text">${item.label}</span>
                    </a>
                `).join('')}
            </nav>

            <nav class="nav-section">
                <div class="nav-label">Settings</div>
                ${NAVIGATION_CONFIG.settings.map(item => `
                    <a href="${item.href}" class="nav-item ${currentPage === item.href.split('/').pop() ? 'active' : ''}">
                        <i data-lucide="${item.icon}" class="nav-icon"></i>
                        <span class="nav-text">${item.label}</span>
                    </a>
                `).join('')}
            </nav>
        </aside>
    `;
}

function renderTopBar() {
    return `
        <header class="top-bar">
            <div class="search-container">
                <div class="search-wrapper">
                    <i data-lucide="search" class="search-icon"></i>
                    <input type="text" class="search-input" placeholder="Search projects, websites, or resources..." id="searchInput">
                </div>
            </div>
            
            <div class="top-actions">
                <button class="action-btn" id="notificationsBtn" aria-label="Notifications">
                    <i data-lucide="bell" class="w-5 h-5"></i>
                    <span class="notification-dot" id="notificationDot" style="display: none;"></span>
                </button>
                <button class="action-btn" aria-label="Help">
                    <i data-lucide="help-circle" class="w-5 h-5"></i>
                </button>
                <div class="user-profile">
                    <div class="user-avatar">SP</div>
                    <span class="user-name">Sam</span>
                </div>
            </div>
        </header>
    `;
}

// Export for use in pages
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderNavigation, renderTopBar, NAVIGATION_CONFIG };
}
