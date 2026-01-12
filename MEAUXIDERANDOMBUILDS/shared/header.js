/**
 * Unified Header System with Alternating Themes
 * Supports light (homepage) and dark (services/alternating pages) glassmorphic themes
 * Clay.global inspired alternating vibe
 */

(function () {
  'use strict';

  const HeaderSystem = {
    // Theme configuration - determines which pages get which theme
    themeMap: {
      light: ['/', '/index.html'], // White frosted/blur glassmorphic (homepage only)
      dark: ['/services', '/services.html', '/pricing', '/pricing.html', '/team', '/team.html', '/about', '/about.html', '/contact', '/contact.html', '/work', '/work.html'] // Dark glassmorphic (all other pages - unified dark theme)
    },

    // Get theme for current page
    getTheme(pathname) {
      const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

      // Check dark pages first
      if (this.themeMap.dark.some(path => normalizedPath === path || normalizedPath === `${path}.html`)) {
        return 'dark';
      }

      // Default to light theme
      return 'light';
    },

    // Render header based on theme
    render(theme = 'light') {
      const isDark = theme === 'dark';
      const logoUrl = 'https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/17535395-1501-490a-ff3d-e43d7c16a000/avatar';
      const currentPath = window.location.pathname;

      // Version for cache-busting header updates
      const headerVersion = '2.0.1';

      // Get active nav item based on current path
      const getActiveClass = (path) => {
        const normalizedPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
        return (normalizedPath === path || normalizedPath === `${path}.html`) ? 'active' : '';
      };

      // Light theme colors
      const lightTheme = {
        bg: 'rgba(255, 255, 255, 0.75)',
        bgScrolled: 'rgba(255, 255, 255, 0.85)',
        backdrop: 'blur(40px) saturate(180%)',
        border: 'rgba(74, 159, 255, 0.15)',
        text: '#0A1628',
        textSecondary: 'rgba(10, 22, 40, 0.7)',
        ctaBg: 'rgba(74, 159, 255, 0.9)',
        ctaText: '#fff',
        shadow: 'rgba(74, 159, 255, 0.12)'
      };

      // Dark theme colors (Clay.global inspired)
      const darkTheme = {
        bg: 'rgba(10, 14, 26, 0.75)',
        bgScrolled: 'rgba(10, 14, 26, 0.85)',
        backdrop: 'blur(40px) saturate(180%)',
        border: 'rgba(255, 255, 255, 0.1)',
        text: '#F9FAFB',
        textSecondary: 'rgba(249, 250, 251, 0.7)',
        ctaBg: 'rgba(74, 159, 255, 0.9)',
        ctaText: '#fff',
        shadow: 'rgba(0, 0, 0, 0.4)'
      };

      const colors = isDark ? darkTheme : lightTheme;

      return `
        <header class="unified-header" data-theme="${theme}" role="banner">
          <div class="unified-header-container">
            <a href="/" class="unified-header-logo" aria-label="Inner Animal Media Home">
              <img src="${logoUrl}?v=${headerVersion}" alt="Inner Animal Media" class="unified-header-app-icon" style="background: none !important; border: none !important; padding: 0 !important; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1) !important;">
              <div class="unified-header-logo-text">
                <span class="unified-header-logo-title">Inner Animal Media</span>
                <span class="unified-header-logo-subtitle">Creative Agency</span>
              </div>
            </a>

            <nav aria-label="Main navigation" class="unified-header-nav">
              <ul class="unified-header-menu">
                <li><a class="unified-header-link ${getActiveClass('/')}" href="/">Home</a></li>
                <li><a class="unified-header-link ${getActiveClass('/services')}" href="/services">Services</a></li>
                <li><a class="unified-header-link ${getActiveClass('/work')}" href="/work">Work</a></li>
                <li><a class="unified-header-link ${getActiveClass('/about')}" href="/about">About</a></li>
                <li><a class="unified-header-link ${getActiveClass('/contact')}" href="/contact">Contact</a></li>
              </ul>
            </nav>

            <div class="unified-header-auth">
              <a href="/login" class="unified-header-btn-text">Sign In</a>
              <button onclick="HeaderSystem.openOnboarding()" class="unified-header-cta" style="
                background: ${colors.ctaBg};
                backdrop-filter: blur(20px) saturate(150%);
                -webkit-backdrop-filter: blur(20px) saturate(150%);
                border: 1px solid ${isDark ? 'rgba(74, 159, 255, 0.3)' : 'rgba(255, 255, 255, 0.3)'};
                color: ${colors.ctaText};
                box-shadow: 0 4px 20px ${isDark ? 'rgba(74, 159, 255, 0.25)' : 'rgba(74, 159, 255, 0.3)'};
              ">
                Sign Up
              </button>
            </div>

            <button class="unified-header-burger" id="unifiedBurger" aria-label="Open navigation menu" aria-expanded="false">
              <div class="unified-header-burger-inner">
                <span class="unified-header-burger-line"></span>
                <span class="unified-header-burger-line"></span>
                <span class="unified-header-burger-line"></span>
              </div>
            </button>
          </div>
        </header>
      `;
    },

    // Inject CSS based on theme
    injectStyles() {
      const styleId = 'unified-header-styles';
      if (document.getElementById(styleId)) return; // Already injected

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Unified Header Styles */
        .unified-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          z-index: 9999;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 1px solid var(--header-border, rgba(74, 159, 255, 0.15));
          box-shadow: 0 8px 32px var(--header-shadow, rgba(74, 159, 255, 0.08));
        }

        .unified-header[data-theme="light"] {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          --header-border: rgba(74, 159, 255, 0.15);
          --header-text: #0A1628;
          --header-text-secondary: rgba(10, 22, 40, 0.7);
          --header-shadow: rgba(74, 159, 255, 0.08);
        }

        .unified-header[data-theme="dark"] {
          background: rgba(10, 14, 26, 0.75);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          --header-border: rgba(255, 255, 255, 0.1);
          --header-text: #F9FAFB;
          --header-text-secondary: rgba(249, 250, 251, 0.7);
          --header-shadow: rgba(0, 0, 0, 0.4);
        }

        .unified-header.scrolled {
          height: 68px;
          box-shadow: 0 12px 48px var(--header-shadow, rgba(74, 159, 255, 0.12));
        }

        .unified-header[data-theme="light"].scrolled {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(50px) saturate(200%);
          -webkit-backdrop-filter: blur(50px) saturate(200%);
        }

        .unified-header[data-theme="dark"].scrolled {
          background: rgba(10, 14, 26, 0.85);
          backdrop-filter: blur(50px) saturate(200%);
          -webkit-backdrop-filter: blur(50px) saturate(200%);
        }

        .unified-header-container {
          max-width: 1400px;
          height: 100%;
          margin: 0 auto;
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .unified-header-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          transition: transform 0.2s ease;
          cursor: pointer;
          /* Ensure no background or border on logo container */
          background: none !important;
          border: none !important;
          padding: 0 !important;
        }

        .unified-header-logo:hover {
          transform: scale(0.97);
        }
        
        /* Ensure logo container doesn't create card effect */
        .unified-header-logo:before,
        .unified-header-logo:after {
          display: none !important;
          content: none !important;
        }

        /* iOS Quality App Icon - No Card Wrapper */
        .unified-header-app-icon {
          width: 64px !important;
          height: 64px !important;
          border-radius: 18px !important; /* iOS-style ~22% radius */
          object-fit: cover !important;
          object-position: center !important;
          display: block !important;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
          /* iOS-quality rendering */
          image-rendering: -webkit-optimize-contrast !important;
          image-rendering: crisp-edges !important;
          -webkit-backface-visibility: hidden !important;
          backface-visibility: hidden !important;
          transform: translateZ(0) !important;
          /* NO background, border, or padding - pure iOS icon */
          background: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          /* Subtle shadow for depth (iOS-style) - icon only, no card */
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15),
                      0 0 1px rgba(0, 0, 0, 0.1) !important;
        }

        .unified-header[data-theme="dark"] .unified-header-app-icon {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3),
                      0 0 1px rgba(255, 255, 255, 0.05) !important;
        }

        .unified-header.scrolled .unified-header-app-icon {
          width: 56px !important;
          height: 56px !important;
          border-radius: 16px !important; /* Maintain ~22% radius */
        }

        .unified-header-logo:hover .unified-header-app-icon {
          transform: scale(0.96) translateZ(0) !important;
        }
        
        /* Ensure no wrapper styles are applied */
        .unified-header-logo-icon {
          display: none !important;
        }

        .unified-header-logo-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .unified-header-logo-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--header-text, #0A1628);
          letter-spacing: -0.8px;
          line-height: 1;
          transition: font-size 0.3s ease;
        }

        .unified-header.scrolled .unified-header-logo-title {
          font-size: 20px;
        }

        .unified-header-logo-subtitle {
          font-size: 11px;
          font-weight: 600;
          color: #4A9FFF;
          letter-spacing: 1px;
          text-transform: uppercase;
          line-height: 1;
          transition: font-size 0.3s ease;
        }

        .unified-header.scrolled .unified-header-logo-subtitle {
          font-size: 10px;
        }

        .unified-header-menu {
          display: flex;
          align-items: center;
          gap: 6px;
          list-style: none;
          height: 100%;
        }

        .unified-header-link {
          position: relative;
          padding: 12px 20px;
          color: var(--header-text, #0A1628);
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          border-radius: 10px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          min-height: 48px;
          display: flex;
          align-items: center;
          letter-spacing: 0.1px;
        }

        .unified-header-link::after {
          content: '';
          position: absolute;
          bottom: 10px;
          left: 20px;
          right: 20px;
          height: 0;
          background: #4A9FFF;
          border-radius: 2px;
          transition: height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .unified-header-link:hover {
          color: #4A9FFF;
          background: rgba(74, 159, 255, 0.1);
        }

        .unified-header-link.active {
          color: #4A9FFF;
          font-weight: 700;
        }

        .unified-header-link.active::after {
          height: 3px;
        }

        .unified-header-auth {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: 16px;
        }

        .unified-header-btn-text {
          font-size: 14px;
          font-weight: 600;
          color: var(--header-text, #0A1628);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .unified-header-btn-text:hover {
          color: #4A9FFF;
        }

        .unified-header-cta {
          margin-left: 0;
          padding: 14px 32px;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 48px;
          letter-spacing: 0.4px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(74, 159, 255, 0.3);
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
        }

        .unified-header-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(74, 159, 255, 0.4) !important;
          background: rgba(74, 159, 255, 1) !important;
        }

        .unified-header-burger {
          display: none;
          background: transparent;
          border: 0;
          padding: 10px;
          cursor: pointer;
          position: relative;
          z-index: 10001;
          min-width: 48px;
          min-height: 48px;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .unified-header-burger:hover {
          background: rgba(74, 159, 255, 0.1);
        }

        .unified-header-burger-inner {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 26px;
        }

        .unified-header-burger-line {
          display: block;
          width: 100%;
          height: 3px;
          background: #4A9FFF;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        .unified-header-burger.open .unified-header-burger-line:nth-child(1) {
          transform: rotate(45deg) translate(8px, 8px);
        }

        .unified-header-burger.open .unified-header-burger-line:nth-child(2) {
          opacity: 0;
          transform: translateX(-20px);
        }

        .unified-header-burger.open .unified-header-burger-line:nth-child(3) {
          transform: rotate(-45deg) translate(8px, -8px);
        }

        /* Mobile Styles */
        @media (max-width: 1024px) {
          .unified-header-menu,
          .unified-header-auth {
            display: none;
          }

          .unified-header-burger {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .unified-header-logo-text {
            display: none;
          }

          .unified-header-app-icon {
            width: 56px !important;
            height: 56px !important;
            border-radius: 16px !important;
          }

          .unified-header.scrolled .unified-header-app-icon {
            width: 50px !important;
            height: 50px !important;
            border-radius: 14px !important;
          }
        }

        /* Body padding for fixed header */
        body:has(.unified-header) {
          padding-top: 80px;
        }

        body:has(.unified-header.scrolled) {
          padding-top: 68px;
        }
      `;
      document.head.appendChild(style);
    },

    // Initialize header on page
    init() {
      const currentPath = window.location.pathname;
      const theme = this.getTheme(currentPath);

      // Inject styles
      this.injectStyles();

      // Find and replace existing header/nav structures
      // Priority: old nav structures > header[role="banner"] > create new
      const oldHeader = document.querySelector('.nav, nav.nav, header.nav, #nav, #navbar, header#nav');
      let headerContainer = document.querySelector('header[role="banner"]');

      if (oldHeader) {
        // Replace old header structure (even if it has class nav and role="banner")
        oldHeader.outerHTML = this.render(theme);
      } else if (headerContainer) {
        // Replace existing header (even if empty placeholder)
        headerContainer.outerHTML = this.render(theme);
      } else {
        // No header found - create new one at top of body
        const newHeader = document.createElement('header');
        newHeader.setAttribute('role', 'banner');
        // Insert at the very beginning of body
        if (document.body.firstChild) {
          document.body.insertBefore(newHeader, document.body.firstChild);
        } else {
          document.body.appendChild(newHeader);
        }
        newHeader.outerHTML = this.render(theme);
      }

      // Re-query after replacement
      const unifiedHeader = document.querySelector('.unified-header');
      if (!unifiedHeader) return;

      // Add scroll effect
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          unifiedHeader.classList.toggle('scrolled', window.pageYOffset > 50);
        }, 10);
      }, { passive: true });

      // Mobile menu toggle (if needed - can reuse existing sidenav system)
      const burger = document.getElementById('unifiedBurger');
      if (burger) {
        burger.addEventListener('click', () => {
          // Reuse existing sidenav if available, or create mobile menu
          if (window.openSidenav) {
            window.openSidenav();
          } else {
            this.toggleMobileMenu();
          }
        });
      }
    },

    // Toggle mobile menu
    toggleMobileMenu() {
      const burger = document.getElementById('unifiedBurger');
      if (!burger) return;

      // Create or toggle mobile menu (can reuse existing sidenav from index.html)
      const existingSidenav = document.getElementById('sidenav');
      if (existingSidenav) {
        const isOpen = existingSidenav.classList.contains('open');
        if (isOpen) {
          this.closeMobileMenu();
        } else {
          this.openMobileMenu();
        }
      }
    },

    openMobileMenu() {
      const sidenav = document.getElementById('sidenav');
      const overlay = document.getElementById('sidenavOverlay');
      const burger = document.getElementById('unifiedBurger');

      if (sidenav) sidenav.classList.add('open');
      if (overlay) overlay.classList.add('open');
      if (burger) {
        burger.classList.add('open');
        burger.setAttribute('aria-expanded', 'true');
      }
      document.body.classList.add('modal-open');
    },

    closeMobileMenu() {
      const sidenav = document.getElementById('sidenav');
      const overlay = document.getElementById('sidenavOverlay');
      const burger = document.getElementById('unifiedBurger');

      if (sidenav) sidenav.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      if (burger) {
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
      document.body.classList.remove('modal-open');
    },

    // Open onboarding wizard when Sign Up is clicked
    openOnboarding() {
      // Load onboarding wizard if not already loaded
      if (typeof OnboardingWizard === 'undefined') {
        const script = document.createElement('script');
        script.src = '/shared/onboarding-wizard.js';
        script.onload = () => {
          OnboardingWizard.init();
          OnboardingWizard.show();
        };
        document.head.appendChild(script);
      } else {
        OnboardingWizard.init();
        OnboardingWizard.show();
      }
    }
  };

  // Export for global access
  window.HeaderSystem = HeaderSystem;

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HeaderSystem.init());
  } else {
    HeaderSystem.init();
  }
})();
