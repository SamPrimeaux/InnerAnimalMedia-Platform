// Cloudflare CDN Optimized Spline Scene Loader
// Loads Spline 3D scenes without React dependency
// Uses @splinetool/runtime for direct WebGL rendering

class SplineSceneLoader {
  constructor(containerId, sceneUrl, options = {}) {
    this.containerId = containerId;
    this.sceneUrl = sceneUrl;
    this.options = {
      showLoading: true,
      loadingText: 'Loading 3D Scene...',
      onLoad: null,
      onError: null,
      ...options
    };
    this.app = null;
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return this.app;

    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container #${this.containerId} not found`);
      return null;
    }

    // Create canvas if it doesn't exist
    let canvas = container.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = `${this.containerId}-canvas`;
      canvas.className = 'spline-scene-canvas';
      container.appendChild(canvas);
    }

    // Show loading if enabled
    if (this.options.showLoading) {
      this.showLoading(container);
    }

    try {
      // Dynamically import Spline runtime from CDN (Cloudflare optimized)
      // Using jsDelivr CDN for better Cloudflare caching
      const { Application } = await import('https://cdn.jsdelivr.net/npm/@splinetool/runtime@1.9.98/build/runtime.js');

      // Initialize Spline application
      this.app = new Application(canvas);
      await this.app.load(this.sceneUrl);

      // Hide loading, show canvas
      this.hideLoading(container);
      canvas.style.opacity = '1';

      this.loaded = true;

      // Call onLoad callback if provided
      if (this.options.onLoad) {
        this.options.onLoad(this.app);
      }

      return this.app;

    } catch (error) {
      console.error('Error loading Spline scene:', error);
      this.showError(container, error.message);

      // Call onError callback if provided
      if (this.options.onError) {
        this.options.onError(error);
      }

      return null;
    }
  }

  showLoading(container) {
    const existing = container.querySelector('.spline-scene-loading');
    if (existing) return;

    const loading = document.createElement('div');
    loading.className = 'spline-scene-loading';
    loading.innerHTML = `
      <div class="spline-scene-spinner"></div>
      <div class="spline-scene-loading-text">${this.options.loadingText}</div>
    `;
    container.appendChild(loading);
  }

  hideLoading(container) {
    const loading = container.querySelector('.spline-scene-loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  showError(container, message) {
    const loading = container.querySelector('.spline-scene-loading');
    if (loading) {
      loading.innerHTML = `<div class="spline-scene-error">Failed to load: ${message}</div>`;
    }
  }

  destroy() {
    if (this.app) {
      // Cleanup Spline app if needed
      this.app = null;
    }
    this.loaded = false;
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.SplineSceneLoader = SplineSceneLoader;
}

// Auto-load scenes with data-spline-scene attribute
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const sceneContainers = document.querySelectorAll('[data-spline-scene]');
    sceneContainers.forEach(container => {
      const sceneUrl = container.getAttribute('data-spline-scene');
      const containerId = container.id || `spline-scene-${Date.now()}`;
      if (!container.id) container.id = containerId;

      const loader = new SplineSceneLoader(containerId, sceneUrl);
      loader.load();

      // Store loader instance on container
      container.splineLoader = loader;
    });
  });
}
