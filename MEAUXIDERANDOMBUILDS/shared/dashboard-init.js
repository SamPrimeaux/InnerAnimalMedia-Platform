/**
 * Unified Dashboard Initialization
 * Ensures consistent behavior across all dashboard pages
 */

(function () {
    'use strict';

    const API_BASE = 'https://iaccess-api.meauxbility.workers.dev';

    // Initialize mobile menu
    function initMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileOverlay = document.getElementById('mobileOverlay');
        const sidebar = document.getElementById('sidebar');

        if (mobileMenuToggle && sidebar) {
            mobileMenuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
                if (mobileOverlay) {
                    mobileOverlay.classList.toggle('active');
                }
                const icon = mobileMenuToggle.querySelector('i');
                if (sidebar.classList.contains('mobile-open')) {
                    icon?.setAttribute('data-lucide', 'x');
                } else {
                    icon?.setAttribute('data-lucide', 'menu');
                }
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        }

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                if (sidebar) sidebar.classList.remove('mobile-open');
                mobileOverlay.classList.remove('active');
                const icon = mobileMenuToggle?.querySelector('i');
                if (icon) icon.setAttribute('data-lucide', 'menu');
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        }
    }

    // Highlight active navigation item
    function highlightActiveNav() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';

        document.querySelectorAll('.nav-item').forEach(item => {
            const href = item.getAttribute('href');
            if (href) {
                const page = href.split('/').pop();
                if (page === currentPage) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initMobileMenu();
            highlightActiveNav();
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });
    } else {
        initMobileMenu();
        highlightActiveNav();
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Export API base for use in pages
    window.DASHBOARD_API_BASE = API_BASE;
})();
