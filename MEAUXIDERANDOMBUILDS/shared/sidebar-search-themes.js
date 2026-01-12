// Complete Sidebar Functionality
// Real search + Theme switcher + Favorites + Recent pages
// Works with ALL 29 dashboard pages

(function() {
    'use strict';

    // All 29 dashboard pages with metadata
    const ALL_PAGES = {
        'overview': { name: 'Dashboard', icon: 'home', url: '/dashboard', group: 'core' },
        'projects': { name: 'Projects', icon: 'briefcase', url: '/dashboard/projects', group: 'core' },
        'clients': { name: 'Clients', icon: 'users', url: '/dashboard/clients', group: 'core' },
        'calendar': { name: 'Calendar', icon: 'calendar', url: '/dashboard/calendar', group: 'core' },
        'meauxmcp': { name: 'MeauxMCP', icon: 'server', url: '/dashboard/meauxmcp', group: 'tools' },
        'meauxsql': { name: 'MeauxSQL', icon: 'database', url: '/dashboard/meauxsql', group: 'tools' },
        'meauxcad': { name: 'MeauxCAD', icon: 'pen-tool', url: '/dashboard/meauxcad', group: 'tools' },
        'meauxide': { name: 'MeauxIDE', icon: 'code', url: '/dashboard/meauxide', group: 'tools' },
        'meauxwork': { name: 'MeauxWork', icon: 'briefcase', url: '/dashboard/meauxwork', group: 'tools' },
        'library': { name: 'Library', icon: 'layout-grid', url: '/dashboard/library', group: 'content' },
        'gallery': { name: 'Gallery', icon: 'image', url: '/dashboard/gallery', group: 'content' },
        'templates': { name: 'Templates', icon: 'file-code', url: '/dashboard/templates', group: 'content' },
        'brand': { name: 'Brand Central', icon: 'palette', url: '/dashboard/brand', group: 'content' },
        'workflows': { name: 'Workflows', icon: 'zap', url: '/dashboard/workflows', group: 'automation' },
        'tasks': { name: 'Tasks', icon: 'check-square', url: '/dashboard/tasks', group: 'automation' },
        'messages': { name: 'Messages', icon: 'message-square', url: '/dashboard/messages', group: 'automation' },
        'video': { name: 'Video Calls', icon: 'video', url: '/dashboard/video', group: 'automation' },
        'prompts': { name: 'Prompts', icon: 'sparkles', url: '/dashboard/prompts', group: 'automation' },
        'deployments': { name: 'Deployments', icon: 'rocket', url: '/dashboard/deployments', group: 'infrastructure' },
        'workers': { name: 'Workers', icon: 'cloud', url: '/dashboard/workers', group: 'infrastructure' },
        'tenants': { name: 'Tenants', icon: 'layers', url: '/dashboard/tenants', group: 'infrastructure' },
        'databases': { name: 'Databases', icon: 'database', url: '/dashboard/databases', group: 'infrastructure' },
        'cloudflare': { name: 'Cloudflare', icon: 'cloud', url: '/dashboard/cloudflare', group: 'infrastructure' },
        'api-gateway': { name: 'API Gateway', icon: 'network', url: '/dashboard/api-gateway', group: 'infrastructure' },
        'settings': { name: 'Settings', icon: 'settings', url: '/dashboard/settings', group: 'system' },
        'analytics': { name: 'Analytics', icon: 'bar-chart', url: '/dashboard/analytics', group: 'system' },
        'ai-services': { name: 'AI Services', icon: 'sparkles', url: '/dashboard/ai-services', group: 'system' },
        'support': { name: 'Support', icon: 'ticket', url: '/dashboard/support', group: 'system' },
        'team': { name: 'Team', icon: 'users', url: '/dashboard/team', group: 'system' }
    };

    // Initialize on DOM ready
    function init() {
        initSearch();
        initThemeSwitcher();
        initFavorites();
        initRecent();
        initGroupToggle();
        setActivePage();
        trackPageVisit();
    }

    // ========================================
    // REAL SEARCH FUNCTIONALITY
    // ========================================
    function initSearch() {
        const searchInput = document.getElementById('nav-search');
        if (!searchInput) return;

        // Debounced search
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value.toLowerCase().trim());
            }, 200);
        });

        // Keyboard shortcut (Cmd+K / Ctrl+K)
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        });

        // Clear search on Escape
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                performSearch('');
            }
        });
    }

    function performSearch(query) {
        const navItems = document.querySelectorAll('.nav-item');
        const navGroups = document.querySelectorAll('.nav-group');

        if (!query) {
            // Show all items
            navItems.forEach(item => item.style.display = '');
            navGroups.forEach(group => group.style.display = '');
            return;
        }

        let hasResults = false;

        // Search through all pages
        navItems.forEach(item => {
            const pageKey = item.dataset.page;
            const pageData = ALL_PAGES[pageKey] || {};
            const itemText = item.textContent.toLowerCase();
            const pageName = pageData.name?.toLowerCase() || '';
            
            if (itemText.includes(query) || pageName.includes(query)) {
                item.style.display = '';
                item.closest('.nav-group-items')?.parentElement.classList.remove('hidden');
                hasResults = true;
            } else {
                item.style.display = 'none';
            }
        });

        // Show/hide groups based on visible items
        navGroups.forEach(group => {
            const visibleItems = group.querySelectorAll('.nav-item:not([style*="display: none"])');
            if (visibleItems.length > 0) {
                group.style.display = '';
            } else {
                group.style.display = 'none';
            }
        });

        // Show "No results" if needed
        if (!hasResults && query) {
            showNoResults(query);
        }
    }

    function showNoResults(query) {
        // Could add a "No results" message if needed
    }

    // ========================================
    // THEME SWITCHER - All 46 Themes
    // ========================================
    async function initThemeSwitcher() {
        const themeSelector = document.getElementById('theme-selector');
        if (!themeSelector) return;

        // All 46 themes with proper display names
        const allThemes = [
            // Existing (6)
            { id: 'dark', name: 'Dark', category: 'Core' },
            { id: 'light', name: 'Light', category: 'Core' },
            { id: 'dev', name: 'Dev', category: 'Core' },
            { id: 'galaxy', name: 'Galaxy', category: 'Core' },
            { id: 'meauxcloud', name: 'MeauxCLOUD', category: 'Core' },
            { id: 'simple', name: 'Simple', category: 'Core' },
            // Clay (2)
            { id: 'meaux-clay-light', name: 'Meaux Clay Light', category: 'Clay' },
            { id: 'meaux-clay-dark', name: 'Meaux Clay Dark', category: 'Clay' },
            // Premium (3)
            { id: 'meaux-monochrome', name: 'Meaux Monochrome', category: 'Premium' },
            { id: 'meaux-workflow', name: 'Meaux Workflow', category: 'Premium' },
            { id: 'meaux-productivity', name: 'Meaux Productivity', category: 'Premium' },
            // Apple (2)
            { id: 'meaux-ios-light', name: 'Meaux iOS Light', category: 'Apple' },
            { id: 'meaux-ios-dark', name: 'Meaux iOS Dark', category: 'Apple' },
            // Developer (6)
            { id: 'meaux-code-dark', name: 'Meaux Code Dark', category: 'Developer' },
            { id: 'meaux-browser', name: 'Meaux Browser', category: 'Developer' },
            { id: 'meaux-design', name: 'Meaux Design', category: 'Developer' },
            { id: 'meaux-creative', name: 'Meaux Creative', category: 'Developer' },
            { id: 'meaux-knowledge', name: 'Meaux Knowledge', category: 'Developer' },
            { id: 'meaux-galaxy', name: 'Meaux Galaxy', category: 'Developer' },
            // Extended (10)
            { id: 'meaux-adaptive', name: 'Meaux Adaptive', category: 'Extended' },
            { id: 'meaux-workspace', name: 'Meaux Workspace', category: 'Extended' },
            { id: 'meaux-music', name: 'Meaux Music', category: 'Extended' },
            { id: 'meaux-system', name: 'Meaux System', category: 'Extended' },
            { id: 'meaux-spatial', name: 'Meaux Spatial', category: 'Extended' },
            { id: 'meaux-editor', name: 'Meaux Editor', category: 'Extended' },
            { id: 'meaux-launcher', name: 'Meaux Launcher', category: 'Extended' },
            { id: 'meaux-arctic', name: 'Meaux Arctic', category: 'Extended' },
            { id: 'meaux-vampire', name: 'Meaux Vampire', category: 'Extended' },
            { id: 'meaux-neon', name: 'Meaux Neon', category: 'Extended' },
            // More Extended (4)
            { id: 'meaux-solar', name: 'Meaux Solar', category: 'Extended' },
            { id: 'meaux-terminal', name: 'Meaux Terminal', category: 'Extended' },
            { id: 'meaux-minimal', name: 'Meaux Minimal', category: 'Extended' },
            // Specialty (3)
            { id: 'meaux-glass-orange', name: 'Meaux Glass Orange', category: 'Specialty' },
            { id: 'meaux-ops-dark', name: 'Meaux Ops Dark', category: 'Specialty' },
            { id: 'meaux-command', name: 'Meaux Command', category: 'Specialty' },
            // Inner Animal (6)
            { id: 'inner-animal-light', name: 'Inner Animal Light', category: 'Inner Animal' },
            { id: 'inner-animal-dark', name: 'Inner Animal Dark', category: 'Inner Animal' },
            { id: 'inner-animal-wild', name: 'Inner Animal Wild', category: 'Inner Animal' },
            { id: 'inner-animal-zen', name: 'Inner Animal Zen', category: 'Inner Animal' },
            { id: 'inner-animal-fire', name: 'Inner Animal Fire', category: 'Inner Animal' },
            { id: 'inner-animal-ocean', name: 'Inner Animal Ocean', category: 'Inner Animal' },
            // Ocean Soft (2) - Clean soft grey/ocean theme
            { id: 'meaux-ocean-soft', name: 'Ocean Soft', category: 'Ocean' },
            { id: 'meaux-ocean-soft-dark', name: 'Ocean Soft Dark', category: 'Ocean' },
            // Cyber (10)
            { id: 'meaux-cyber-punk', name: 'Meaux Cyber Punk', category: 'Cyber' },
            { id: 'meaux-neon-city', name: 'Meaux Neon City', category: 'Cyber' },
            { id: 'meaux-synthwave', name: 'Meaux Synthwave', category: 'Cyber' },
            { id: 'meaux-hacker-green', name: 'Meaux Hacker Green', category: 'Cyber' },
            { id: 'meaux-matrix-rain', name: 'Meaux Matrix Rain', category: 'Cyber' },
            { id: 'meaux-midnight-blue', name: 'Meaux Midnight Blue', category: 'Cyber' },
            { id: 'meaux-sunset-glow', name: 'Meaux Sunset Glow', category: 'Cyber' },
            { id: 'meaux-forest-deep', name: 'Meaux Forest Deep', category: 'Cyber' },
            { id: 'meaux-desert-sand', name: 'Meaux Desert Sand', category: 'Cyber' },
            { id: 'meaux-storm-gray', name: 'Meaux Storm Gray', category: 'Cyber' }
        ];

        // Try to load from API first, fallback to hardcoded list
        try {
            const response = await fetch('/api/themes');
            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                // Clear existing options
                themeSelector.innerHTML = '';
                
                // Add all themes from API
                data.data.forEach(theme => {
                    const option = document.createElement('option');
                    option.value = theme.id || theme.name;
                    option.textContent = theme.display_name || theme.name;
                    if (theme.description) {
                        option.title = theme.description;
                    }
                    themeSelector.appendChild(option);
                });
            } else {
                // Fallback to hardcoded list
                themeSelector.innerHTML = '';
                allThemes.forEach(theme => {
                    const option = document.createElement('option');
                    option.value = theme.id;
                    option.textContent = theme.name;
                    option.dataset.category = theme.category;
                    themeSelector.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load themes from API, using hardcoded list:', error);
            // Fallback to hardcoded list
            themeSelector.innerHTML = '';
            allThemes.forEach(theme => {
                const option = document.createElement('option');
                option.value = theme.id;
                option.textContent = theme.name;
                option.dataset.category = theme.category;
                themeSelector.appendChild(option);
            });
        }

        // Load theme for current tenant/project
        loadThemeForTenant().then(() => {
            // Update selector to match loaded theme
            const currentTheme = document.body.getAttribute('data-theme') || localStorage.getItem('selected-theme') || 'inner-animal-dark';
            if (themeSelector.querySelector(`option[value="${currentTheme}"]`)) {
                themeSelector.value = currentTheme;
            }
        });

        // Handle theme change
        themeSelector.addEventListener('change', (e) => {
            const themeId = e.target.value;
            applyTheme(themeId);
            saveThemePreference(themeId);
        });
    }

    function applyTheme(themeId) {
        // Remove existing theme data attribute
        document.body.removeAttribute('data-theme');
        document.documentElement.removeAttribute('data-theme');
        
        // Add new theme data attribute (works with CSS [data-theme] selectors)
        document.body.setAttribute('data-theme', themeId);
        document.documentElement.setAttribute('data-theme', themeId);

        // Load main theme library CSS (contains all 46 themes)
        let themeLibrary = document.getElementById('meaux-theme-library');
        if (!themeLibrary) {
            themeLibrary = document.createElement('link');
            themeLibrary.id = 'meaux-theme-library';
            themeLibrary.rel = 'stylesheet';
            themeLibrary.href = '/shared/themes/meaux-theme-library.css';
            document.head.appendChild(themeLibrary);
        }

        // Apply CSS variables to body for backwards compatibility
        const themeConfig = getThemeConfig(themeId);
        if (themeConfig) {
            Object.entries(themeConfig).forEach(([key, value]) => {
                document.documentElement.style.setProperty(`--${key}`, value);
            });
        }

        // Save to user preferences via API (if user is logged in)
        saveThemeToAPI(themeId);
    }

    // Get theme CSS variable values (for backwards compatibility with non-CSS-variable themes)
    function getThemeConfig(themeId) {
        // This is a fallback - the CSS file handles most themes via [data-theme] selectors
        // Only return config if theme needs special handling
        return null;
    }

    function saveThemePreference(themeId) {
        // Save to localStorage for immediate use
        localStorage.setItem('selected-theme', themeId);
        
        // Also save per-tenant/project for multi-project identification
        const tenantId = getTenantId();
        if (tenantId) {
            localStorage.setItem(`theme-${tenantId}`, themeId);
        }
    }

    async function saveThemeToAPI(themeId) {
        try {
            const tenantId = getTenantId();
            const userId = getUserId();
            
            if (!tenantId) {
                console.warn('No tenant ID found, theme saved locally only');
                return;
            }

            // Save theme preference per tenant (so each project/build has its own theme)
            const response = await fetch('/api/preferences/theme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    theme_id: themeId,
                    tenant_id: tenantId,
                    user_id: userId 
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Update theme context display
                    const themeContext = document.getElementById('theme-context');
                    if (themeContext) {
                        const tenantName = data.tenant_name || tenantId.substring(0, 20);
                        themeContext.textContent = `Theme for: ${tenantName}`;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to save theme to API:', error);
            // Still save locally as fallback
        }
    }

    async function loadThemeForTenant() {
        try {
            const tenantId = getTenantId();
            if (!tenantId) {
                // Fallback to default theme
                const defaultTheme = localStorage.getItem('selected-theme') || 'inner-animal-dark';
                applyTheme(defaultTheme);
                return;
            }

            // Try to load tenant-specific theme from API
            const response = await fetch(`/api/preferences/theme?tenant_id=${tenantId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.theme_id) {
                    applyTheme(data.theme_id);
                    return;
                }
            }

            // Fallback: Check localStorage for tenant-specific theme
            const tenantTheme = localStorage.getItem(`theme-${tenantId}`);
            if (tenantTheme) {
                applyTheme(tenantTheme);
                return;
            }

            // Final fallback: Use default theme
            const defaultTheme = localStorage.getItem('selected-theme') || 'inner-animal-dark';
            applyTheme(defaultTheme);
        } catch (error) {
            console.error('Failed to load tenant theme:', error);
            // Use default theme
            const defaultTheme = localStorage.getItem('selected-theme') || 'inner-animal-dark';
            applyTheme(defaultTheme);
        }
    }

    function getTenantId() {
        // Try multiple methods to get tenant ID
        // 1. From cookie
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            if (key && value) acc[key.trim()] = decodeURIComponent(value.trim());
            return acc;
        }, {});
        if (cookies.tenant_id) return cookies.tenant_id;

        // 2. From localStorage
        if (localStorage.getItem('tenant_id')) return localStorage.getItem('tenant_id');

        // 3. From URL query param (for testing)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tenant_id')) return urlParams.get('tenant_id');

        // 4. From window object (if set by app)
        if (window.TENANT_ID) return window.TENANT_ID;

        return null;
    }

    function getUserId() {
        // Try to get user ID from various sources
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            if (key && value) acc[key.trim()] = decodeURIComponent(value.trim());
            return acc;
        }, {});
        
        return cookies.user_id || localStorage.getItem('user-id') || null;
    }

    // ========================================
    // FAVORITES
    // ========================================
    function initFavorites() {
        loadFavorites();
        attachFavoriteButtons();
    }

    function loadFavorites() {
        const favorites = JSON.parse(localStorage.getItem('nav-favorites') || '[]');
        const favoritesList = document.getElementById('favorites-list');
        const favoritesSection = document.getElementById('favorites-section');
        
        if (!favoritesList || !favoritesSection) return;

        if (favorites.length > 0) {
            favoritesSection.classList.remove('hidden');
            favoritesList.innerHTML = favorites.map(pageKey => {
                const page = ALL_PAGES[pageKey];
                if (!page) return '';
                return createNavItem(pageKey, page, true);
            }).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            favoritesSection.classList.add('hidden');
        }
    }

    window.toggleFavorite = function(pageKey) {
        let favorites = JSON.parse(localStorage.getItem('nav-favorites') || '[]');
        const index = favorites.indexOf(pageKey);
        
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(pageKey);
        }
        
        localStorage.setItem('nav-favorites', JSON.stringify(favorites));
        loadFavorites();
        updateFavoriteButtons();
    }

    function attachFavoriteButtons() {
        // Add favorite buttons to all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            const pageKey = item.dataset.page;
            if (!pageKey || item.querySelector('.favorite-btn')) return;

            const btn = document.createElement('button');
            btn.className = 'ml-auto p-1 hover:bg-white/5 rounded transition-colors favorite-btn';
            btn.setAttribute('data-page', pageKey);
            btn.onclick = (e) => {
                e.stopPropagation();
                toggleFavorite(pageKey);
            };
            btn.innerHTML = '<i data-lucide="star" class="w-3 h-3 text-zinc-600"></i>';
            item.appendChild(btn);
        });
        updateFavoriteButtons();
    }

    function updateFavoriteButtons() {
        const favorites = JSON.parse(localStorage.getItem('nav-favorites') || '[]');
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const pageKey = btn.dataset.page;
            const icon = btn.querySelector('i');
            if (favorites.includes(pageKey)) {
                icon.classList.add('text-brand-orange');
                icon.classList.remove('text-zinc-600');
            } else {
                icon.classList.remove('text-brand-orange');
                icon.classList.add('text-zinc-600');
            }
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function createNavItem(pageKey, page, isFavorite = false) {
        const favorites = JSON.parse(localStorage.getItem('nav-favorites') || '[]');
        const isFav = favorites.includes(pageKey);
        return `
            <a href="${page.url}" 
               class="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5 text-zinc-400 hover:text-white" 
               data-page="${pageKey}">
                <i data-lucide="${page.icon}" class="w-4 h-4"></i> 
                <span class="sidebar-text">${page.name}</span>
                <button onclick="toggleFavorite('${pageKey}'); event.stopPropagation();" 
                        class="ml-auto p-1 hover:bg-white/5 rounded transition-colors favorite-btn" 
                        data-page="${pageKey}">
                    <i data-lucide="star" class="w-3 h-3 ${isFav ? 'text-brand-orange' : 'text-zinc-600'}"></i>
                </button>
            </a>
        `;
    }

    // ========================================
    // RECENT PAGES
    // ========================================
    function initRecent() {
        loadRecent();
    }

    function loadRecent() {
        const recent = JSON.parse(localStorage.getItem('nav-recent') || '[]');
        const recentList = document.getElementById('recent-list');
        if (!recentList) return;

        if (recent.length > 0) {
            recentList.innerHTML = recent.slice(0, 5).map(item => {
                const page = ALL_PAGES[item.page];
                if (!page) return '';
                return `
                    <a href="${page.url}" 
                       class="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5 text-zinc-400 hover:text-white" 
                       data-page="${item.page}">
                        <i data-lucide="${page.icon}" class="w-4 h-4"></i> 
                        <span class="sidebar-text">${page.name}</span>
                        <span class="ml-auto text-[10px] text-zinc-600">${formatTime(item.timestamp)}</span>
                    </a>
                `;
            }).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            recentList.innerHTML = '<div class="px-3 py-2 text-[10px] text-zinc-600">No recent pages</div>';
        }
    }

    function trackPageVisit() {
        const currentPath = window.location.pathname;
        const currentPage = getCurrentPage(currentPath);
        if (!ALL_PAGES[currentPage]) return;

        let recent = JSON.parse(localStorage.getItem('nav-recent') || '[]');
        recent = recent.filter(r => r.page !== currentPage);
        recent.unshift({ page: currentPage, timestamp: Date.now() });
        recent = recent.slice(0, 10);
        localStorage.setItem('nav-recent', JSON.stringify(recent));
        loadRecent();
    }

    function getCurrentPage(path) {
        if (path === '/dashboard' || path === '/dashboard/') return 'overview';
        const parts = path.split('/').filter(p => p);
        return parts[parts.length - 1] || 'overview';
    }

    function formatTime(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    // ========================================
    // GROUP TOGGLE
    // ========================================
    function initGroupToggle() {
        restoreGroupStates();
    }

    window.toggleNavGroup = function(groupId) {
        const group = document.querySelector(`.nav-group[data-group="${groupId}"]`);
        const items = group?.querySelector('.nav-group-items');
        const icon = group?.querySelector('.nav-group-icon');
        
        if (!items || !icon) return;

        if (items.classList.contains('hidden')) {
            items.classList.remove('hidden');
            icon.style.transform = 'rotate(0deg)';
            localStorage.setItem(`nav-group-${groupId}`, 'expanded');
        } else {
            items.classList.add('hidden');
            icon.style.transform = 'rotate(-90deg)';
            localStorage.setItem(`nav-group-${groupId}`, 'collapsed');
        }
    }

    function restoreGroupStates() {
        document.querySelectorAll('.nav-group').forEach(group => {
            const groupId = group.dataset.group;
            const state = localStorage.getItem(`nav-group-${groupId}`);
            if (state === 'collapsed') {
                toggleNavGroup(groupId);
            }
        });
    }

    // ========================================
    // ACTIVE PAGE
    // ========================================
    function setActivePage() {
        const currentPath = window.location.pathname;
        const currentPage = getCurrentPage(currentPath);
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('bg-brand-orange', 'text-white', 'shadow-lg', 'shadow-orange-900/20');
            if (item.dataset.page === currentPage) {
                item.classList.add('bg-brand-orange', 'text-white', 'shadow-lg', 'shadow-orange-900/20');
            }
        });
    }

    // ========================================
    // SIDEBAR TOGGLE
    // ========================================
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('dashboard-sidebar');
        const sidebarTexts = document.querySelectorAll('.sidebar-text');
        const isCollapsed = sidebar.classList.contains('collapsed');

        if (isCollapsed) {
            sidebar.classList.remove('collapsed');
            sidebar.classList.add('w-64');
            sidebar.classList.remove('w-20');
            sidebarTexts.forEach(t => t.classList.remove('hidden'));
            localStorage.setItem('sidebarCollapsed', 'false');
        } else {
            sidebar.classList.add('collapsed');
            sidebar.classList.remove('w-64');
            sidebar.classList.add('w-20');
            sidebarTexts.forEach(t => t.classList.add('hidden'));
            localStorage.setItem('sidebarCollapsed', 'true');
        }

        const toggleBtn = document.querySelector('[onclick="toggleSidebar()"] i');
        if (toggleBtn) {
            toggleBtn.setAttribute('data-lucide', isCollapsed ? 'panel-left-close' : 'panel-left-open');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Track navigation
    window.addEventListener('popstate', () => {
        setActivePage();
        trackPageVisit();
    });

    // Re-initialize icons after dynamic content
    if (typeof lucide !== 'undefined') {
        setTimeout(() => lucide.createIcons(), 100);
    }
})();
