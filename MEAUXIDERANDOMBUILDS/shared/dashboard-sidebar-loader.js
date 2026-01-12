// Dashboard Sidebar Loader - Loads the complete sidebar with all features
// Include this script in all dashboard pages

(function () {
    'use strict';

    async function loadCompleteSidebar() {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) {
            console.warn('Sidebar container not found');
            return;
        }

        try {
            // Load the complete sidebar HTML
            const response = await fetch('/shared/dashboard-sidebar-complete.html');
            if (!response.ok) {
                throw new Error(`Failed to load sidebar: ${response.status}`);
            }

            const html = await response.text();
            sidebarContainer.innerHTML = html;

            // Load the sidebar JavaScript (search, themes, favorites, etc.)
            const script = document.createElement('script');
            script.src = '/shared/sidebar-search-themes.js';
            script.onload = () => {
                // Initialize Lucide icons after sidebar is loaded
                if (typeof lucide !== 'undefined') {
                    setTimeout(() => lucide.createIcons(), 100);
                }

                // Track page visit for recent pages
                if (typeof trackPageVisit === 'function') {
                    trackPageVisit();
                }
            };
            script.onerror = () => {
                console.error('Failed to load sidebar JavaScript');
            };
            document.head.appendChild(script);

        } catch (error) {
            console.error('Failed to load complete sidebar:', error);

            // Fallback: Try to load old sidebar if new one fails
            try {
                const fallbackResponse = await fetch('/shared/sidebar.html');
                if (fallbackResponse.ok) {
                    const fallbackHtml = await fallbackResponse.text();
                    sidebarContainer.innerHTML = fallbackHtml;
                    if (typeof lucide !== 'undefined') {
                        setTimeout(() => lucide.createIcons(), 100);
                    }
                }
            } catch (fallbackError) {
                console.error('Fallback sidebar also failed:', fallbackError);
            }
        }
    }

    // Load sidebar when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCompleteSidebar);
    } else {
        loadCompleteSidebar();
    }
})();
