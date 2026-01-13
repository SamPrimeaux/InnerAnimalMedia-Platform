// Unified Dashboard Layout System
// Handles theme loading, sidebar state, and layout management

(function () {
    'use strict';

    // Dashboard Layout Manager
    const DashboardLayout = {
        theme: null,
        sidebarCollapsed: false,

        // Initialize layout
        async init() {
            await this.loadTheme();
            this.restoreSidebarState();
            // Skip setupSidebarToggle - sidebar.html inline script handles it
            // Skip setupResponsive - sidebar.html inline script handles it
            // Skip setupSearch - sidebar.html inline script handles it
            this.loadTools();
        },

        // Load active theme from API
        async loadTheme() {
            try {
                const response = await fetch('/api/themes?active_only=true');
                const data = await response.json();

                if (data.success && data.data) {
                    this.theme = data.data;
                    this.applyTheme(this.theme.config || {});
                } else {
                    // Use default theme
                    this.applyTheme({
                        colors: {
                            brand: {
                                orange: '#ff6b00',
                                red: '#dc2626',
                                dark: '#050507',
                                panel: '#0a0a0f',
                                surface: '#171717'
                            }
                        },
                        fonts: {
                            sans: 'Inter',
                            mono: 'JetBrains Mono'
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading theme:', error);
                // Fallback to default
                this.applyTheme({
                    colors: {
                        brand: {
                            orange: '#ff6b00',
                            red: '#dc2626',
                            dark: '#050507',
                            panel: '#0a0a0f',
                            surface: '#171717'
                        }
                    }
                });
            }
        },

        // Apply theme CSS variables
        applyTheme(config) {
            const root = document.documentElement;

            // Apply brand colors
            if (config.colors?.brand) {
                Object.entries(config.colors.brand).forEach(([key, value]) => {
                    root.style.setProperty(`--brand-${key}`, value);
                    root.style.setProperty(`--dashboard-${key}`, value);
                });
            }

            // Apply custom theme variables if provided
            if (config.variables) {
                Object.entries(config.variables).forEach(([key, value]) => {
                    root.style.setProperty(`--theme-${key}`, value);
                });
            }
        },

        // Restore sidebar collapsed state
        restoreSidebarState() {
            const saved = localStorage.getItem('sidebarCollapsed');
            this.sidebarCollapsed = saved === 'true';

            const sidebar = document.getElementById('sidebar');
            const main = document.querySelector('.dashboard-main');

            if (sidebar && this.sidebarCollapsed) {
                sidebar.classList.add('collapsed');
            }

            if (main) {
                main.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
            }
        },

        // Setup sidebar toggle (prevent duplicate listeners)
        setupSidebarToggle() {
            const toggleBtn = document.getElementById('sidebar-toggle');
            const sidebar = document.getElementById('sidebar');
            const main = document.querySelector('.dashboard-main');

            if (!toggleBtn || !sidebar) return;

            // Remove old listeners by cloning (clean slate approach)
            const newToggleBtn = toggleBtn.cloneNode(true);
            toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

            newToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.sidebarCollapsed = !this.sidebarCollapsed;
                const sidebarEl = document.getElementById('sidebar');
                const mainEl = document.querySelector('.dashboard-main');

                if (sidebarEl) {
                    sidebarEl.classList.toggle('collapsed', this.sidebarCollapsed);
                }

                if (mainEl) {
                    mainEl.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
                }

                localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);

                // Update icon
                const icon = newToggleBtn.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide',
                        this.sidebarCollapsed ? 'panel-left-open' : 'panel-left-close'
                    );
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            });
        },

        // Setup responsive behavior
        setupResponsive() {
            const mobileBtn = document.getElementById('mobile-menu-btn');
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');

            if (!mobileBtn || !sidebar) return;

            // Mobile menu toggle
            mobileBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                if (overlay) overlay.classList.toggle('active');
                document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
            });

            // Close on overlay click
            if (overlay) {
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }

            // Close on navigation (event delegation to prevent duplicates)
            const navContainer = document.getElementById('sidebar-nav') || document.querySelector('.sidebar-nav');
            if (navContainer) {
                navContainer.addEventListener('click', (e) => {
                    const navItem = e.target.closest('.nav-item');
                    if (navItem && window.innerWidth <= 768) {
                        sidebar.classList.remove('open');
                        if (overlay) overlay.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                });
            }

            // Handle window resize
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if (window.innerWidth > 768) {
                        sidebar.classList.remove('open');
                        if (overlay) overlay.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }, 250);
            });
        },

        // Setup search functionality
        setupSearch() {
            const searchInput = document.getElementById('sidebar-search-input');
            const searchClear = document.getElementById('search-clear');

            if (!searchInput) return;

            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();

                if (query) {
                    if (searchClear) searchClear.style.display = 'flex';

                    // Filter nav items
                    document.querySelectorAll('.nav-item').forEach(item => {
                        const name = item.getAttribute('data-name') || '';
                        const text = item.textContent.toLowerCase();

                        if (name.includes(query) || text.includes(query)) {
                            item.classList.remove('hidden');
                        } else {
                            item.classList.add('hidden');
                        }
                    });

                    // Expand sections with visible items
                    document.querySelectorAll('.nav-section').forEach(section => {
                        const hasVisible = section.querySelector('.nav-item:not(.hidden)');
                        if (hasVisible && section.classList.contains('collapsed')) {
                            section.classList.remove('collapsed');
                        }
                    });
                } else {
                    if (searchClear) searchClear.style.display = 'none';
                    document.querySelectorAll('.nav-item').forEach(item => {
                        item.classList.remove('hidden');
                    });
                }
            });

            if (searchClear) {
                searchClear.addEventListener('click', () => {
                    searchInput.value = '';
                    searchInput.dispatchEvent(new Event('input'));
                    searchInput.focus();
                });
            }
        },

        // Load tools dynamically from API
        async loadTools() {
            try {
                const response = await fetch('/api/tools');
                const data = await response.json();

                if (!data.success || !data.data) return;

                // Map tool categories to sidebar sections
                const categoryMap = {
                    'engine': 'engine-tools',
                    'assets': 'assets-tools',
                    'infrastructure': 'infrastructure-tools'
                };

                // Group tools by category
                const toolsByCategory = {};
                data.data.forEach(tool => {
                    if (!tool.can_use) return;
                    if (!toolsByCategory[tool.category]) {
                        toolsByCategory[tool.category] = [];
                    }
                    toolsByCategory[tool.category].push(tool);
                });

                // Add tools to appropriate sections
                Object.entries(toolsByCategory).forEach(([category, tools]) => {
                    const sectionId = categoryMap[category];
                    if (!sectionId) return;

                    const section = document.getElementById(sectionId);
                    if (!section) return;

                    tools.forEach(tool => {
                        // Skip if already exists (check by data-page attribute first, then data-tool-id)
                        if (document.querySelector(`[data-page="${tool.name}"]`)) return;
                        if (document.querySelector(`[data-tool-id="${tool.id}"]`)) return;

                        const iconMap = {
                            'meauxmcp': 'server',
                            'meauxsql': 'database',
                            'meauxide': 'code',
                            'meauxcad': 'pen-tool',
                            'meauxwork': 'check-square'
                        };

                        const toolLink = document.createElement('a');
                        toolLink.href = `/dashboard/${tool.name}`;
                        toolLink.className = 'nav-item';
                        toolLink.setAttribute('data-page', tool.name);
                        toolLink.setAttribute('data-name', tool.name);
                        toolLink.setAttribute('data-tool-id', tool.id);
                        toolLink.innerHTML = `
                            <i data-lucide="${iconMap[tool.name] || tool.icon || 'box'}" class="nav-icon"></i>
                            <span class="nav-text">${tool.display_name || tool.name}</span>
                        `;

                        section.appendChild(toolLink);
                    });
                });

                // Reinitialize icons
                if (typeof lucide !== 'undefined') {
                    setTimeout(() => lucide.createIcons(), 100);
                }
            } catch (error) {
                console.error('Error loading tools:', error);
            }
        },

        // Set active nav item
        setActiveNav() {
            const currentPath = window.location.pathname;
            const pageName = currentPath.split('/').pop() || 'overview';

            document.querySelectorAll('.nav-item').forEach(item => {
                const itemPage = item.getAttribute('data-page');
                if (itemPage === pageName || (pageName === '' && itemPage === 'overview')) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DashboardLayout.init());
    } else {
        DashboardLayout.init();
    }

    // Don't duplicate section toggle listeners - sidebar.html inline script handles this
    // Just ensure active nav is set after sidebar loads
    setTimeout(() => {
        DashboardLayout.setActiveNav();
    }, 600);

    // Export for global access
    window.DashboardLayout = DashboardLayout;
})();
