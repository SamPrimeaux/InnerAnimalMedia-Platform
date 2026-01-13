// Global Footer System - Loads glassmorphic footer with 3D GLB background
// Supports light/dark theme switching

class GlobalFooter {
    constructor() {
        this.footerContainer = null;
        this.loaded = false;
    }

    async init() {
        if (this.loaded) return;

        // Load CSS if not already loaded
        this.loadCSS();

        // Load HTML footer
        await this.loadFooter();

        // Load Spline scene loader
        this.loadSplineSceneLoader();

        this.loaded = true;
    }

    loadCSS() {
        if (document.getElementById('footer-global-css')) return;

        const link = document.createElement('link');
        link.id = 'footer-global-css';
        link.rel = 'stylesheet';
        link.href = '/shared/footer.css';
        document.head.appendChild(link);
    }

    async loadFooter() {
        // Check if footer container exists
        this.footerContainer = document.getElementById('footer-container-global');
        if (!this.footerContainer) {
            // Create footer container before closing body tag
            this.footerContainer = document.createElement('div');
            this.footerContainer.id = 'footer-container-global';
            document.body.appendChild(this.footerContainer);
        }

        // Load footer HTML
        try {
            const response = await fetch('/shared/footer.html');
            if (response.ok) {
                const html = await response.text();
                this.footerContainer.innerHTML = html;
            }
        } catch (error) {
            console.error('Error loading footer:', error);
            // Fallback: inject footer HTML directly
            this.injectFooterFallback();
        }
    }

    injectFooterFallback() {
        this.footerContainer.innerHTML = `
            <footer class="footer-global">
                <div class="footer-model-bg">
                    <div id="footer-spline-scene" data-spline-scene="https://prod.spline.design/CNI9Bx5eUGw7Eom2/scene.splinecode" class="spline-scene-wrapper"></div>
                </div>
                <div class="footer-content-global">
                    <div class="footer-logo-global">
                        <div class="footer-logo-icon-global">
                            <img src="https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/17535395-1501-490a-ff3d-e43d7c16a000/avatar" alt="Inner Animal Media Logo" class="footer-logo-img-global" />
                        </div>
                        <div class="footer-logo-text-global">
                            <span class="footer-logo-title-global">Inner Animal Media</span>
                            <span class="footer-logo-subtitle-global">Creative Agency</span>
                        </div>
                    </div>
                    <p class="footer-text-global">© 2026 Inner Animal Media. All rights reserved.</p>
                    <p class="footer-text-global" style="margin-top: 8px; font-size: 14px;">
                        <a href="/legal/privacy" style="color: #4A9FFF; text-decoration: none; margin-right: 16px;">Privacy Policy</a>
                        <a href="/legal/terms" style="color: #4A9FFF; text-decoration: none; margin-right: 16px;">Terms of Service</a>
                        <a href="/contact" style="color: #4A9FFF; text-decoration: none;">Contact</a>
                    </p>
                    <div class="footer-social-global">
                        <a href="https://twitter.com" class="social-link-global" aria-label="Twitter">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>
                        </a>
                        <a href="https://instagram.com" class="social-link-global" aria-label="Instagram">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                            </svg>
                        </a>
                        <a href="https://linkedin.com" class="social-link-global" aria-label="LinkedIn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                <rect x="2" y="9" width="4" height="12" />
                                <circle cx="4" cy="4" r="2" />
                            </svg>
                        </a>
                    </div>
                </div>
            </footer>
        `;
    }

    loadSplineSceneLoader() {
        // Check if Spline loader script is already loaded
        if (document.querySelector('script[src*="spline-scene-loader"]')) {
            // Script already exists, trigger scene load
            this.initSplineScene();
            return;
        }

        // Load Spline scene loader script
        const script = document.createElement('script');
        script.src = '/shared/spline-scene-loader.js';
        script.onload = () => {
            this.initSplineScene();
        };
        script.onerror = () => {
            console.error('Failed to load Spline scene loader');
        };
        document.head.appendChild(script);

        // Also load Spline scene CSS
        this.loadSplineSceneCSS();
    }

    loadSplineSceneCSS() {
        if (document.getElementById('spline-scene-css')) return;

        const link = document.createElement('link');
        link.id = 'spline-scene-css';
        link.rel = 'stylesheet';
        link.href = '/shared/spline-scene.css';
        document.head.appendChild(link);
    }

    initSplineScene() {
        // Wait a bit for the loader script to initialize
        setTimeout(() => {
            const sceneContainer = document.getElementById('footer-spline-scene');
            if (sceneContainer && typeof window.SplineSceneLoader !== 'undefined') {
                const sceneUrl = sceneContainer.getAttribute('data-spline-scene');
                if (sceneUrl) {
                    const loader = new window.SplineSceneLoader('footer-spline-scene', sceneUrl, {
                        showLoading: false, // Don't show loading in footer
                        onLoad: () => {
                            console.log('Footer Spline scene loaded');
                        },
                        onError: (error) => {
                            console.error('Footer Spline scene error:', error);
                        }
                    });
                    loader.load();
                    sceneContainer.splineLoader = loader;
                }
            }
        }, 100);
    }
}

// Initialize footer when DOM is ready
const globalFooter = new GlobalFooter();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => globalFooter.init());
} else {
    globalFooter.init();
}

// Export for use in other scripts
window.GlobalFooter = GlobalFooter;
