/**
 * Mobile Hamburger Menu System
 * Glassmorphic, draggable mobile navigation
 */

(function() {
  'use strict';

  const MobileMenu = {
    isOpen: false,
    startX: 0,
    currentX: 0,
    isDragging: false,
    
    init() {
      this.createMobileButton();
      this.createMobileOverlay();
      this.attachEventListeners();
      this.restoreState();
    },
    
    createMobileButton() {
      // Check if button already exists
      if (document.getElementById('mobile-menu-btn')) return;
      
      const button = document.createElement('button');
      button.id = 'mobile-menu-btn';
      button.className = 'fixed top-4 left-4 z-[9999] lg:hidden p-3 rounded-xl bg-brand-panel/90 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-brand-panel transition-all';
      button.innerHTML = '<i data-lucide="menu" class="w-6 h-6 text-white"></i>';
      button.setAttribute('aria-label', 'Toggle mobile menu');
      button.onclick = () => this.toggle();
      
      document.body.appendChild(button);
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    },
    
    createMobileOverlay() {
      // Check if overlay already exists
      if (document.getElementById('mobile-menu-overlay')) return;
      
      const overlay = document.createElement('div');
      overlay.id = 'mobile-menu-overlay';
      overlay.className = 'fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 opacity-0 invisible lg:hidden';
      overlay.onclick = () => this.close();
      
      document.body.appendChild(overlay);
    },
    
    attachEventListeners() {
      const sidebar = document.getElementById('dashboard-sidebar') || document.getElementById('sidebar');
      if (!sidebar) return;
      
      // Touch events for dragging
      sidebar.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      sidebar.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
      sidebar.addEventListener('touchend', () => this.handleTouchEnd(), { passive: true });
      
      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
      
      // Prevent body scroll when menu is open
      this.observeBodyScroll();
    },
    
    handleTouchStart(e) {
      if (!this.isOpen) return;
      this.isDragging = true;
      this.startX = e.touches[0].clientX;
    },
    
    handleTouchMove(e) {
      if (!this.isDragging || !this.isOpen) return;
      e.preventDefault();
      this.currentX = e.touches[0].clientX;
      const sidebar = document.getElementById('dashboard-sidebar') || document.getElementById('sidebar');
      if (sidebar) {
        const diff = this.currentX - this.startX;
        if (diff < 0) {
          sidebar.style.transform = `translateX(${diff}px)`;
          sidebar.style.transition = 'none';
        }
      }
    },
    
    handleTouchEnd() {
      if (!this.isDragging) return;
      this.isDragging = false;
      
      const sidebar = document.getElementById('dashboard-sidebar') || document.getElementById('sidebar');
      if (sidebar) {
        const diff = this.currentX - this.startX;
        sidebar.style.transition = '';
        
        // Close if dragged more than 50px to the left
        if (diff < -50) {
          this.close();
        } else {
          sidebar.style.transform = '';
        }
      }
    },
    
    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },
    
    open() {
      this.isOpen = true;
      const sidebar = document.getElementById('dashboard-sidebar') || document.getElementById('sidebar');
      const overlay = document.getElementById('mobile-menu-overlay');
      const button = document.getElementById('mobile-menu-btn');
      
      if (sidebar) {
        sidebar.classList.add('mobile-open');
        sidebar.style.transform = '';
      }
      
      if (overlay) {
        overlay.classList.remove('opacity-0', 'invisible');
        overlay.classList.add('opacity-100', 'visible');
      }
      
      if (button) {
        const icon = button.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', 'x');
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }
      }
      
      document.body.style.overflow = 'hidden';
      localStorage.setItem('mobileMenuOpen', 'true');
    },
    
    close() {
      this.isOpen = false;
      const sidebar = document.getElementById('dashboard-sidebar') || document.getElementById('sidebar');
      const overlay = document.getElementById('mobile-menu-overlay');
      const button = document.getElementById('mobile-menu-btn');
      
      if (sidebar) {
        sidebar.classList.remove('mobile-open');
        sidebar.style.transform = '';
      }
      
      if (overlay) {
        overlay.classList.remove('opacity-100', 'visible');
        overlay.classList.add('opacity-0', 'invisible');
      }
      
      if (button) {
        const icon = button.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', 'menu');
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }
      }
      
      document.body.style.overflow = '';
      localStorage.setItem('mobileMenuOpen', 'false');
    },
    
    observeBodyScroll() {
      // Observe sidebar state to prevent body scroll
      const observer = new MutationObserver(() => {
        if (this.isOpen) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      });
      
      const sidebar = document.getElementById('dashboard-sidebar') || document.getElementById('sidebar');
      if (sidebar) {
        observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
      }
    },
    
    restoreState() {
      // Don't restore on desktop
      if (window.innerWidth >= 1024) return;
      
      const wasOpen = localStorage.getItem('mobileMenuOpen') === 'true';
      if (wasOpen) {
        // Don't auto-open, just sync state
        this.isOpen = false;
      }
    }
  };
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileMenu.init());
  } else {
    MobileMenu.init();
  }
  
  // Make available globally
  window.MobileMenu = MobileMenu;
  
  // Re-initialize when sidebar is loaded dynamically
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      const sidebar = document.getElementById('dashboard-sidebar') || document.getElementById('sidebar');
      if (sidebar && !MobileMenu.initialized) {
        MobileMenu.initialized = true;
        setTimeout(() => MobileMenu.attachEventListeners(), 100);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
