// Enhanced Sidebar Functionality
// Adds search, favorites, recent pages, and collapsible groups

(function() {
    // Initialize sidebar improvements
    const navSearch = document.getElementById('nav-search');
    const sidebarNav = document.getElementById('sidebar-nav');
    const favoritesList = document.getElementById('favorites-list');
    const recentList = document.getElementById('recent-list');
    const favoritesSection = document.getElementById('favorites-section');

    // Load favorites from localStorage
    function loadFavorites() {
        const favorites = JSON.parse(localStorage.getItem('nav-favorites') || '[]');
        if (favorites.length > 0) {
            favoritesSection.classList.remove('hidden');
            favoritesList.innerHTML = favorites.map(page => {
                const pageData = getPageData(page);
                return `
                    <a href="${pageData.url}" class="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5 text-zinc-400 hover:text-white" data-page="${page}">
                        <i data-lucide="${pageData.icon}" class="w-4 h-4"></i> 
                        <span class="sidebar-text">${pageData.name}</span>
                        <button onclick="toggleFavorite('${page}'); event.stopPropagation();" class="ml-auto p-1 hover:bg-white/5 rounded transition-colors favorite-btn" data-page="${page}">
                            <i data-lucide="star" class="w-3 h-3 text-brand-orange"></i>
                        </button>
                    </a>
                `;
            }).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            favoritesSection.classList.add('hidden');
        }
    }

    // Load recent pages
    function loadRecent() {
        const recent = JSON.parse(localStorage.getItem('nav-recent') || '[]');
        if (recent.length > 0) {
            recentList.innerHTML = recent.slice(0, 5).map(page => {
                const pageData = getPageData(page.page);
                return `
                    <a href="${pageData.url}" class="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5 text-zinc-400 hover:text-white" data-page="${page.page}">
                        <i data-lucide="${pageData.icon}" class="w-4 h-4"></i> 
                        <span class="sidebar-text">${pageData.name}</span>
                        <span class="ml-auto text-[10px] text-zinc-600">${formatTime(page.timestamp)}</span>
                    </a>
                `;
            }).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            recentList.innerHTML = '<div class="px-3 py-2 text-[10px] text-zinc-600">No recent pages</div>';
        }
    }

    // Track page visit
    function trackPageVisit() {
        const currentPath = window.location.pathname;
        const currentPage = getCurrentPage(currentPath);
        
        // Add to recent
        let recent = JSON.parse(localStorage.getItem('nav-recent') || '[]');
        recent = recent.filter(r => r.page !== currentPage);
        recent.unshift({ page: currentPage, timestamp: Date.now() });
        recent = recent.slice(0, 10); // Keep last 10
        localStorage.setItem('nav-recent', JSON.stringify(recent));
        
        loadRecent();
    }

    // Toggle favorite
    window.toggleFavorite = function(page) {
        let favorites = JSON.parse(localStorage.getItem('nav-favorites') || '[]');
        const index = favorites.indexOf(page);
        
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(page);
        }
        
        localStorage.setItem('nav-favorites', JSON.stringify(favorites));
        loadFavorites();
        updateFavoriteButtons();
    }

    // Update favorite button states
    function updateFavoriteButtons() {
        const favorites = JSON.parse(localStorage.getItem('nav-favorites') || '[]');
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const page = btn.dataset.page;
            const icon = btn.querySelector('i');
            if (favorites.includes(page)) {
                icon.setAttribute('data-lucide', 'star');
                icon.classList.add('text-brand-orange');
                icon.classList.remove('text-zinc-600');
            } else {
                icon.setAttribute('data-lucide', 'star');
                icon.classList.remove('text-brand-orange');
                icon.classList.add('text-zinc-600');
            }
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Search functionality
    if (navSearch) {
        navSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length === 0) {
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.style.display = '';
                });
                document.querySelectorAll('.nav-group').forEach(group => {
                    group.style.display = '';
                });
                return;
            }

            // Hide/show items based on search
            document.querySelectorAll('.nav-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.style.display = '';
                    item.closest('.nav-group-items')?.parentElement.classList.remove('hidden');
                } else {
                    item.style.display = 'none';
                }
            });

            // Hide empty groups
            document.querySelectorAll('.nav-group').forEach(group => {
                const items = group.querySelectorAll('.nav-item:not([style*="display: none"])');
                if (items.length === 0) {
                    group.style.display = 'none';
                } else {
                    group.style.display = '';
                }
            });
        });

        // Keyboard shortcut (Cmd+K / Ctrl+K)
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                navSearch.focus();
            }
        });
    }

    // Toggle nav group
    window.toggleNavGroup = function(groupId) {
        const group = document.querySelector(`.nav-group[data-group="${groupId}"]`);
        const items = group.querySelector('.nav-group-items');
        const icon = group.querySelector('.nav-group-icon');
        
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

    // Restore group states
    function restoreGroupStates() {
        document.querySelectorAll('.nav-group').forEach(group => {
            const groupId = group.dataset.group;
            const state = localStorage.getItem(`nav-group-${groupId}`);
            if (state === 'collapsed') {
                toggleNavGroup(groupId);
            }
        });
    }

    // Get page data
    function getPageData(page) {
        const pageMap = {
            'overview': { name: 'Dashboard', icon: 'home', url: '/dashboard' },
            'projects': { name: 'Projects', icon: 'briefcase', url: '/dashboard/projects' },
            'clients': { name: 'Clients', icon: 'users', url: '/dashboard/clients' },
            'calendar': { name: 'Calendar', icon: 'calendar', url: '/dashboard/calendar' },
            'meauxmcp': { name: 'MeauxMCP', icon: 'server', url: '/dashboard/meauxmcp' },
            'meauxsql': { name: 'MeauxSQL', icon: 'database', url: '/dashboard/meauxsql' },
            'meauxcad': { name: 'MeauxCAD', icon: 'pen-tool', url: '/dashboard/meauxcad' },
            'meauxide': { name: 'MeauxIDE', icon: 'code', url: '/dashboard/meauxide' },
            'meauxwork': { name: 'MeauxWork', icon: 'briefcase', url: '/dashboard/meauxwork' },
            'library': { name: 'Library', icon: 'layout-grid', url: '/dashboard/library' },
            'gallery': { name: 'Gallery', icon: 'image', url: '/dashboard/gallery' },
            'templates': { name: 'Templates', icon: 'file-code', url: '/dashboard/templates' },
            'brand': { name: 'Brand Central', icon: 'palette', url: '/dashboard/brand' },
            'workflows': { name: 'Workflows', icon: 'zap', url: '/dashboard/workflows' },
            'tasks': { name: 'Tasks', icon: 'check-square', url: '/dashboard/tasks' },
            'messages': { name: 'Messages', icon: 'message-square', url: '/dashboard/messages' },
            'video': { name: 'Video Calls', icon: 'video', url: '/dashboard/video' },
            'deployments': { name: 'Deployments', icon: 'rocket', url: '/dashboard/deployments' },
            'workers': { name: 'Workers', icon: 'cloud', url: '/dashboard/workers' },
            'tenants': { name: 'Tenants', icon: 'layers', url: '/dashboard/tenants' },
            'databases': { name: 'Databases', icon: 'database', url: '/dashboard/databases' },
            'settings': { name: 'Settings', icon: 'settings', url: '/dashboard/settings' },
            'analytics': { name: 'Analytics', icon: 'bar-chart', url: '/dashboard/analytics' },
            'ai-services': { name: 'AI Services', icon: 'sparkles', url: '/dashboard/ai-services' },
            'support': { name: 'Support', icon: 'ticket', url: '/dashboard/support' },
        };
        return pageMap[page] || { name: page, icon: 'circle', url: `/dashboard/${page}` };
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

    // Set active page
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

    // Initialize
    loadFavorites();
    loadRecent();
    updateFavoriteButtons();
    restoreGroupStates();
    setActivePage();
    trackPageVisit();

    // Update on navigation
    window.addEventListener('popstate', () => {
        setActivePage();
        trackPageVisit();
    });
})();
