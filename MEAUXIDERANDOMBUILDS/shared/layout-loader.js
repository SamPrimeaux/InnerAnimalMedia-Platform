/**
 * Layout Loader - Automatically injects header/footer and theme system
 * This script should be included BEFORE closing </body> tag
 */

(function () {
  'use strict';

  const LayoutLoader = {
    async init() {
      await this.loadHeader();
      await this.loadFooter();
      this.loadThemeSystem();
      this.initOnboarding();
      this.initGLBModels();
      lucide.createIcons();
    },

    async loadHeader() {
      // Only load if header doesn't exist
      if (document.getElementById('sitewide-header')) return;

      try {
        const response = await fetch(`${window.location.origin}/shared/components/header.html`);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const header = doc.querySelector('#sitewide-header');

        if (header) {
          document.body.insertBefore(header, document.body.firstChild);
          // Also load header.js for functionality
          const script = document.createElement('script');
          script.src = `${window.location.origin}/shared/components/header.js`;
          document.head.appendChild(script);
        }
      } catch (error) {
        console.error('Failed to load header:', error);
      }
    },

    async loadFooter() {
      // Only load if footer doesn't exist
      if (document.getElementById('sitewide-footer')) return;

      try {
        const response = await fetch(`${window.location.origin}/shared/components/footer.html`);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const footer = doc.querySelector('#sitewide-footer');

        if (footer) {
          document.body.appendChild(footer);
        }
      } catch (error) {
        console.error('Failed to load footer:', error);
      }
    },

    loadThemeSystem() {
      // Add base theme if not already present
      if (document.querySelector('link[href*="themes/base.css"]')) return;

      const baseTheme = document.createElement('link');
      baseTheme.rel = 'stylesheet';
      baseTheme.href = `${window.location.origin}/shared/themes/base.css`;
      document.head.appendChild(baseTheme);

      // Detect brand from data attribute or localStorage
      const brand = document.documentElement.getAttribute('data-brand') ||
        localStorage.getItem('brand') ||
        'inneranimal-media';

      const brandTheme = document.createElement('link');
      brandTheme.rel = 'stylesheet';
      brandTheme.href = `${window.location.origin}/shared/themes/${brand}.css`;
      document.head.appendChild(brandTheme);

      // Apply theme from localStorage if available
      const savedTheme = localStorage.getItem('theme') || 'system';
      if (window.HeaderComponents && window.HeaderComponents.ThemeManager) {
        window.HeaderComponents.ThemeManager.setTheme(savedTheme);
      } else {
        // Fallback if HeaderComponents not loaded yet
        document.documentElement.setAttribute('data-theme', savedTheme);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (savedTheme === 'system' && prefersDark)) {
          document.documentElement.classList.add('dark');
        }
      }
    },

    initOnboarding() {
      // Auto-trigger onboarding wizard if not completed
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      const isDashboardPage = window.location.pathname.includes('/dashboard');

      if (isDashboardPage && (!onboardingCompleted || onboardingCompleted === 'false')) {
        // Check if wizard script is loaded
        if (typeof OnboardingWizard !== 'undefined') {
          // Get tenant ID from localStorage or use default
          const tenantId = localStorage.getItem('tenant_id') || 'default-tenant';
          OnboardingWizard.init(tenantId);
        } else {
          // Load wizard script
          const script = document.createElement('script');
          script.src = `${window.location.origin}/shared/onboarding-wizard.js`;
          script.onload = () => {
            const tenantId = localStorage.getItem('tenant_id') || 'default-tenant';
            OnboardingWizard.init(tenantId);
          };
          document.head.appendChild(script);
        }
      }
    },

    initGLBModels() {
      // GLB (3D model) support for branding
      // Look for elements with data-glb attribute
      const glbElements = document.querySelectorAll('[data-glb]');

      glbElements.forEach(element => {
        const glbPath = element.getAttribute('data-glb');
        this.loadGLBModel(element, glbPath);
      });
    },

    async loadGLBModel(container, glbPath) {
      // Use Three.js or similar for GLB loading
      // This is a placeholder - actual implementation depends on your 3D library
      try {
        if (typeof THREE !== 'undefined' && typeof GLTFLoader !== 'undefined') {
          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
          const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

          renderer.setSize(container.clientWidth, container.clientHeight);
          container.appendChild(renderer.domElement);

          const loader = new GLTFLoader();
          loader.load(glbPath, (gltf) => {
            scene.add(gltf.scene);

            // Auto-rotate animation
            const animate = () => {
              requestAnimationFrame(animate);
              gltf.scene.rotation.y += 0.01;
              renderer.render(scene, camera);
            };
            animate();
          });
        } else {
          // Fallback: Load Three.js if not available
          const threeScript = document.createElement('script');
          threeScript.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
          threeScript.onload = () => {
            const gltfLoaderScript = document.createElement('script');
            gltfLoaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/loaders/GLTFLoader.js';
            gltfLoaderScript.onload = () => {
              this.loadGLBModel(container, glbPath);
            };
            document.head.appendChild(gltfLoaderScript);
          };
          document.head.appendChild(threeScript);
        }
      } catch (error) {
        console.error('Failed to load GLB model:', error);
        // Fallback to static image
        container.innerHTML = `<img src="${glbPath.replace('.glb', '.png')}" alt="3D Model" style="width: 100%; height: 100%; object-fit: contain;">`;
      }
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LayoutLoader.init());
  } else {
    LayoutLoader.init();
  }

  // Export for global access
  window.LayoutLoader = LayoutLoader;
})();
