/**
 * Sitewide Header Component Logic
 * Handles: theme toggle, search, notifications, user menu, mobile menu
 */

(function() {
  'use strict';

  // Theme Management
  const ThemeManager = {
    init() {
      // Get saved theme or default to 'system'
      const savedTheme = localStorage.getItem('theme') || 'system';
      this.setTheme(savedTheme);

      // Theme toggle button
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          const currentTheme = document.documentElement.getAttribute('data-theme') || 'system';
          const themes = ['light', 'dark', 'system'];
          const currentIndex = themes.indexOf(currentTheme);
          const nextIndex = (currentIndex + 1) % themes.length;
          this.setTheme(themes[nextIndex]);
        });
      }

      // Watch for system theme changes
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      prefersDark.addEventListener('change', (e) => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'system') {
          this.applyTheme('system');
        }
      });
    },

    setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      this.applyTheme(theme);

      // Update toggle icon
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        const sunIcon = themeToggle.querySelector('[data-lucide="sun"]');
        const moonIcon = themeToggle.querySelector('[data-lucide="moon"]');
        
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          sunIcon?.classList.remove('hidden');
          moonIcon?.classList.add('hidden');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
          sunIcon?.classList.add('hidden');
          moonIcon?.classList.remove('hidden');
        } else {
          // System - follow OS preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
            sunIcon?.classList.remove('hidden');
            moonIcon?.classList.add('hidden');
          } else {
            document.documentElement.classList.remove('dark');
            sunIcon?.classList.add('hidden');
            moonIcon?.classList.remove('hidden');
          }
        }
        lucide.createIcons();
      }
    },

    applyTheme(theme) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  };

  // Global Search
  const GlobalSearch = {
    init() {
      const searchInput = document.getElementById('global-search-input');
      if (!searchInput) return;

      // Keyboard shortcut (Cmd/Ctrl + K)
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      });

      // Search input handler
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) return;

        searchTimeout = setTimeout(() => {
          this.performSearch(query);
        }, 300);
      });

      // Mobile search toggle
      const mobileMenuBtn = document.getElementById('mobile-menu-btn');
      const mobileSearch = document.getElementById('mobile-search');
      if (mobileMenuBtn && mobileSearch) {
        mobileMenuBtn.addEventListener('click', () => {
          mobileSearch.classList.toggle('hidden');
          if (!mobileSearch.classList.contains('hidden')) {
            mobileSearch.querySelector('input').focus();
          }
        });
      }
    },

    async performSearch(query) {
      try {
        // Search across projects, workflows, tools, etc.
        const response = await fetch(`${window.location.origin}/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
          // Show search results dropdown
          this.showSearchResults(data.data);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    },

    showSearchResults(results) {
      // TODO: Implement search results dropdown
      console.log('Search results:', results);
    }
  };

  // User Menu
  const UserMenu = {
    init() {
      const userMenuBtn = document.getElementById('user-menu-btn');
      const userMenuDropdown = document.getElementById('user-menu-dropdown');
      
      if (!userMenuBtn || !userMenuDropdown) return;

      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenuDropdown.classList.toggle('hidden');
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userMenuDropdown.contains(e.target)) {
          userMenuDropdown.classList.add('hidden');
        }
      });
    }
  };

  // Mobile Menu
  const MobileMenu = {
    init() {
      const mobileMenuBtn = document.getElementById('mobile-menu-btn');
      const mobileMenu = document.getElementById('mobile-menu');
      
      if (!mobileMenuBtn) return;

      mobileMenuBtn.addEventListener('click', () => {
        if (mobileMenu) {
          mobileMenu.classList.toggle('hidden');
        }
        // Also toggle mobile search if visible
        const mobileSearch = document.getElementById('mobile-search');
        if (mobileSearch) {
          mobileSearch.classList.toggle('hidden');
        }
      });
    }
  };

  // Notifications
  const Notifications = {
    init() {
      const notificationsBtn = document.getElementById('notifications-btn');
      if (!notificationsBtn) return;

      // Check for unread notifications
      this.checkNotifications();

      notificationsBtn.addEventListener('click', () => {
        // TODO: Show notifications dropdown
        console.log('Show notifications');
      });
    },

    async checkNotifications() {
      try {
        const response = await fetch(`${window.location.origin}/api/notifications?unread=true`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          const badge = document.getElementById('notification-badge');
          if (badge) {
            badge.classList.remove('hidden');
            badge.textContent = data.data.length > 9 ? '9+' : data.data.length;
          }
        }
      } catch (error) {
        // Silently fail - notifications are optional
      }
    }
  };

  // Initialize all components when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  function initAll() {
    ThemeManager.init();
    GlobalSearch.init();
    UserMenu.init();
    MobileMenu.init();
    Notifications.init();
    lucide.createIcons();
  }

  // Export for global access
  window.HeaderComponents = {
    ThemeManager,
    GlobalSearch,
    UserMenu,
    MobileMenu,
    Notifications
  };
})();
