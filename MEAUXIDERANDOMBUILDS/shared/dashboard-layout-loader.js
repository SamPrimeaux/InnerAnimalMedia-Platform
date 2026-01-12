/**
 * Unified Dashboard Layout Loader
 * Automatically loads sidebar and header components for all dashboard pages
 * Usage: Include <script src="/shared/dashboard-layout-loader.js"></script> before closing </body>
 */

(function () {
  'use strict';

  const DashboardLayout = {
    // Load sidebar component
    async loadSidebar() {
      // Check for sidebar container div or existing sidebar
      const sidebarContainer = document.getElementById('sidebar-container');
      const existingSidebar = document.getElementById('dashboard-sidebar') || document.getElementById('sidebar');

      if (existingSidebar && existingSidebar.innerHTML.trim() !== '' && existingSidebar.style.display !== 'none') {
        // Sidebar already exists with content and is visible
        return;
      }

      try {
        // Try to load glassmorphic sidebar first (with mobile hamburger, search, themes, favorites)
        let response = await fetch('/shared/dashboard-sidebar-glassmorphic.html');
        let sidebarHtml;
        
        if (response.ok) {
          sidebarHtml = await response.text();
          
          // Load sidebar JavaScript (search, themes, favorites)
          const script = document.createElement('script');
          script.src = '/shared/sidebar-search-themes.js';
          script.onload = () => {
            if (typeof lucide !== 'undefined') {
              setTimeout(() => lucide.createIcons(), 100);
            }
            if (typeof trackPageVisit === 'function') {
              trackPageVisit();
            }
          };
          document.head.appendChild(script);
        } else {
          // Fallback to complete sidebar
          response = await fetch('/shared/dashboard-sidebar-complete.html');
          if (response.ok) {
            sidebarHtml = await response.text();
            const script = document.createElement('script');
            script.src = '/shared/sidebar-search-themes.js';
            document.head.appendChild(script);
          } else {
            // Final fallback to old sidebar
            response = await fetch('/shared/dashboard-sidebar.html');
            if (!response.ok) throw new Error('Failed to load sidebar');
            sidebarHtml = await response.text();
          }
        }

        // Insert sidebar into container if it exists
        if (sidebarContainer) {
          sidebarContainer.innerHTML = sidebarHtml;
        } else if (existingSidebar) {
          // Replace existing sidebar
          existingSidebar.outerHTML = sidebarHtml;
        } else {
          // Create new sidebar at start of body
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = sidebarHtml;
          const sidebarElement = tempDiv.firstElementChild;
          document.body.insertBefore(sidebarElement, document.body.firstChild);
        }

        // Initialize sidebar functionality
        this.initSidebar();

        // Initialize mobile menu
        if (typeof MobileMenu !== 'undefined') {
          setTimeout(() => {
            MobileMenu.init();
            MobileMenu.attachEventListeners();
          }, 150);
        }

        // Initialize icons after sidebar loads
        if (typeof lucide !== 'undefined') {
          setTimeout(() => lucide.createIcons(), 100);
        }
      } catch (error) {
        console.error('Failed to load sidebar:', error);
      }
    },

    // Load header component
    async loadHeader() {
      const existingHeader = document.querySelector('header[class*="h-20"]') || document.querySelector('main header');
      if (existingHeader) {
        // Header already exists, just update page title
        this.updatePageTitle();
        return;
      }

      try {
        const response = await fetch('/shared/dashboard-header.html');
        if (!response.ok) throw new Error('Failed to load header');

        const headerHtml = await response.text();

        // Find main content area to insert header
        const main = document.querySelector('main') || document.querySelector('.main-content') || document.body;
        const headerContainer = document.createElement('header');
        headerContainer.innerHTML = headerHtml;

        // Insert header at start of main, or create main if needed
        if (main) {
          main.insertBefore(headerContainer.firstElementChild || headerContainer, main.firstChild);
        } else {
          // Create main wrapper
          const mainWrapper = document.createElement('main');
          mainWrapper.className = 'flex-1 flex flex-col h-full overflow-hidden bg-brand-dark relative';
          mainWrapper.innerHTML = headerHtml;

          // Move existing content into main
          const existingContent = document.body.querySelector('#main-view, .content, [class*="overflow-y-auto"]');
          if (existingContent) {
            mainWrapper.appendChild(existingContent);
          }

          document.body.appendChild(mainWrapper);
        }

        // Update page title
        this.updatePageTitle();

        // Initialize icons
        if (typeof lucide !== 'undefined') {
          setTimeout(() => lucide.createIcons(), 100);
        }
      } catch (error) {
        console.error('Failed to load header:', error);
      }
    },

    // Initialize sidebar toggle functionality
    initSidebar() {
      // Make toggleSidebar available globally
      window.toggleSidebar = function () {
        const sidebar = document.getElementById('dashboard-sidebar') || document.getElementById('sidebar');
        if (!sidebar) return;

        const sidebarTexts = document.querySelectorAll('.sidebar-text');
        const isCollapsed = sidebar.classList.contains('collapsed');

        if (isCollapsed) {
          sidebar.classList.remove('collapsed');
          sidebar.style.width = '256px';
          sidebarTexts.forEach(t => {
            t.classList.remove('hidden');
            t.style.display = '';
          });
          localStorage.setItem('sidebarCollapsed', 'false');
        } else {
          sidebar.classList.add('collapsed');
          sidebar.style.width = '80px';
          sidebarTexts.forEach(t => {
            t.classList.add('hidden');
            t.style.display = 'none';
          });
          localStorage.setItem('sidebarCollapsed', 'true');
        }

        // Update toggle button icon
        const toggleBtn = document.querySelector('[onclick="toggleSidebar()"] i, [onclick*="toggleSidebar"] i');
        if (toggleBtn) {
          toggleBtn.setAttribute('data-lucide', isCollapsed ? 'panel-left-close' : 'panel-left-open');
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }
      };

      // Set active nav item based on current page
      const currentPath = window.location.pathname;
      const currentPage = currentPath.split('/').pop() || 'overview';
      const pageMap = {
        'overview': 'overview',
        'index.html': 'overview',
        'projects': 'projects',
        'projects.html': 'projects',
        'clients': 'clients',
        'clients.html': 'clients',
        'calendar': 'calendar',
        'calendar.html': 'calendar',
        'tasks': 'tasks',
        'tasks.html': 'tasks',
        'meauxwork': 'tasks',
        'meauxwork.html': 'tasks',
        'workflows': 'workflows',
        'workflows.html': 'workflows',
        'meauxmcp': 'meauxmcp',
        'meauxmcp.html': 'meauxmcp',
        'meauxsql': 'meauxsql',
        'meauxsql.html': 'meauxsql',
        'meauxcad': 'meauxcad',
        'meauxcad.html': 'meauxcad',
        'library': 'cms',
        'library.html': 'cms',
        'cms': 'cms',
        'cms.html': 'cms',
        'brand': 'brand',
        'brand.html': 'brand',
        'gallery': 'gallery',
        'gallery.html': 'gallery',
        'deployments': 'deployments',
        'deployments.html': 'deployments',
        'workers': 'workers',
        'workers.html': 'workers',
        'tenants': 'tenants',
        'tenants.html': 'tenants',
        'support': 'support',
        'support.html': 'support'
      };

      const activePage = pageMap[currentPage] || pageMap[currentPath.split('/').pop()?.replace('.html', '')] || currentPage.replace('.html', '');

      // Remove all active states
      document.querySelectorAll('.nav-item, [data-page]').forEach(item => {
        item.classList.remove('bg-brand-orange', 'text-white', 'shadow-lg', 'shadow-orange-900/20');
        item.classList.add('hover:bg-white/5', 'text-zinc-400', 'hover:text-white');
      });

      // Set active state
      const activeItem = document.querySelector(`[data-page="${activePage}"]`);
      if (activeItem) {
        activeItem.classList.add('bg-brand-orange', 'text-white', 'shadow-lg', 'shadow-orange-900/20');
        activeItem.classList.remove('hover:bg-white/5', 'text-zinc-400', 'hover:text-white');
      }

      // Restore sidebar collapsed state
      if (localStorage.getItem('sidebarCollapsed') === 'true') {
        const sidebar = document.getElementById('dashboard-sidebar') || document.getElementById('sidebar');
        if (sidebar) {
          sidebar.classList.add('collapsed');
          sidebar.style.width = '80px';
          document.querySelectorAll('.sidebar-text').forEach(t => {
            t.classList.add('hidden');
            t.style.display = 'none';
          });
          const toggleBtn = document.querySelector('[onclick="toggleSidebar()"] i, [onclick*="toggleSidebar"] i');
          if (toggleBtn) {
            toggleBtn.setAttribute('data-lucide', 'panel-left-open');
          }
        }
      }
    },

    // Update page title in header
    updatePageTitle() {
      const pageTitleEl = document.getElementById('page-title');
      if (!pageTitleEl) return;

      const currentPath = window.location.pathname;
      const pageMap = {
        '/dashboard': 'Dashboard',
        '/dashboard/': 'Dashboard',
        '/dashboard/projects': 'Projects',
        '/dashboard/clients': 'Clients',
        '/dashboard/calendar': 'Calendar',
        '/dashboard/tasks': 'InnerWork',
        '/dashboard/meauxwork': 'InnerWork',
        '/dashboard/workflows': 'Automation',
        '/dashboard/meauxmcp': 'MeauxMCP',
        '/dashboard/meauxsql': 'MeauxSQL',
        '/dashboard/meauxcad': 'MeauxCAD',
        '/dashboard/library': 'CMS',
        '/dashboard/cms': 'CMS',
        '/dashboard/brand': 'Brand Central',
        '/dashboard/gallery': 'Gallery',
        '/dashboard/deployments': 'Deployments',
        '/dashboard/workers': 'Workers',
        '/dashboard/tenants': 'Tenants',
        '/dashboard/support': 'Support Center'
      };

      const title = pageMap[currentPath] || pageMap[currentPath.replace('.html', '')] ||
        document.title.split('|')[0].trim() || 'Dashboard';
      pageTitleEl.textContent = title;
    },

    // Initialize layout
    async init() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.loadSidebar();
          this.loadHeader();
        });
      } else {
        await this.loadSidebar();
        await this.loadHeader();
      }
    }
  };

  // Expose globally
  window.DashboardLayout = DashboardLayout;

  // Auto-initialize
  DashboardLayout.init();

  // Also expose syncFromCloudflare globally if needed
  if (typeof syncFromCloudflare === 'undefined' && typeof API !== 'undefined' && API.syncFromCloudflare) {
    window.syncFromCloudflare = () => API.syncFromCloudflare();
  } else if (typeof syncFromCloudflare === 'undefined') {
    window.syncFromCloudflare = async function () {
      try {
        const btn = event?.target?.closest('button');
        if (btn) {
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '<i data-lucide="loader" class="w-3 h-3 animate-spin"></i> Syncing...';
          btn.disabled = true;
        }

        const response = await fetch(`${window.location.origin}/api/stats?sync=true`);
        const data = await response.json();

        if (data.success) {
          showNotification?.('Successfully synced from Cloudflare!', 'success');
          // Reload page data if function exists
          if (typeof loadProjects === 'function') await loadProjects();
          if (typeof loadStats === 'function') await loadStats();
        } else {
          showNotification?.('Sync failed: ' + (data.error || 'Unknown error'), 'error');
        }

        if (btn) {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
      } catch (error) {
        console.error('Sync error:', error);
        showNotification?.('Sync failed: ' + error.message, 'error');
      }
    };
  }
})();
