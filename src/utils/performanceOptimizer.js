/**
 * Performance Optimization Utilities
 * Helps optimize heavy operations and monitor performance
 */

class PerformanceOptimizer {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.performanceMetrics = new Map();
    this.memoryWarnings = [];
  }

  /**
   * Throttle function calls to reduce frequency
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  /**
   * Debounce function calls to prevent excessive execution
   */
  debounce(func, wait, immediate) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  /**
   * Monitor memory usage and warn if excessive
   */
  monitorMemoryUsage(componentName) {
    if (!this.isDevelopment) return;

    try {
      const usage = process.memoryUsage ? process.memoryUsage() : { heapUsed: 0 };
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);

      if (heapUsedMB > 100) {
        this.memoryWarnings.push({
          component: componentName,
          memoryUsage: heapUsedMB,
          timestamp: new Date().toISOString()
        });

      }
    } catch (error) {
    }
  }

  /**
   * Optimize event listeners by reducing frequency
   */
  optimizeEventListener(element, event, handler, options = {}) {
    const {
      throttleMs = 100,
      debounceMs = 0,
      usePassive = true
    } = options;

    let optimizedHandler = handler;

    if (throttleMs > 0) {
      optimizedHandler = this.throttle(handler, throttleMs);
    } else if (debounceMs > 0) {
      optimizedHandler = this.debounce(handler, debounceMs);
    }

    const listenerOptions = {
      passive: usePassive,
      ...options
    };

    element.addEventListener(event, optimizedHandler, listenerOptions);

    return () => {
      element.removeEventListener(event, optimizedHandler, listenerOptions);
    };
  }

  /**
   * Batch multiple state updates to reduce re-renders
   */
  batchStateUpdates(updates, callback) {
    if (typeof window !== 'undefined' && window.React && window.React.startTransition) {
      // Use React 18's startTransition for batching
      window.React.startTransition(() => {
        updates.forEach(update => update());
        if (callback) callback();
      });
    } else {
      // Fallback for older React versions
      updates.forEach(update => update());
      if (callback) callback();
    }
  }

  /**
   * Lazy load heavy components
   */
  lazyLoadComponent(importFunc, fallback = null) {
    if (typeof window !== 'undefined' && window.React && window.React.lazy) {
      return window.React.lazy(() =>
        importFunc().catch(error => {
          return { default: () => fallback || <div>Failed to load component</div> };
        })
      );
    }
    return null;
  }

  /**
   * Optimize scroll listeners
   */
  optimizeScrollListener(handler, options = {}) {
    const {
      throttleMs = 16, // ~60fps
      element = window
    } = options;

    return this.optimizeEventListener(element, 'scroll', handler, {
      throttleMs,
      usePassive: true
    });
  }

  /**
   * Optimize resize listeners
   */
  optimizeResizeListener(handler, options = {}) {
    const {
      throttleMs = 100,
      element = window
    } = options;

    return this.optimizeEventListener(element, 'resize', handler, {
      throttleMs,
      usePassive: true
    });
  }

  /**
   * Check if device can handle heavy features
   */
  canHandleHeavyFeatures() {
    if (typeof window === 'undefined') return false;

    try {
      const memory = navigator.deviceMemory || 4; // Default to 4GB if unknown
      const cores = navigator.hardwareConcurrency || 2;

      // Require at least 4GB RAM and 4 cores for heavy features
      return memory >= 4 && cores >= 4;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations() {
    const recommendations = [];

    if (this.isDevelopment) {
      recommendations.push({
        type: 'development',
        message: 'Consider disabling heavy adaptive features during development',
        action: 'Set ENABLE_ADAPTIVE_FEATURES=false in development'
      });
    }

    if (this.memoryWarnings.length > 5) {
      recommendations.push({
        type: 'memory',
        message: 'High memory usage detected',
        action: 'Consider optimizing component memory usage or increasing analysis intervals'
      });
    }

    return recommendations;
  }

  /**
   * Measure function execution time
   */
  measureExecutionTime(fn, label = 'Function') {
    if (!this.isDevelopment) return fn();

    const start = performance.now();
    const result = fn();
    const end = performance.now();


    return result;
  }

  /**
   * Create performance-aware interval
   */
  createPerformanceAwareInterval(callback, intervalMs) {
    if (!this.isDevelopment) {
      return setInterval(callback, intervalMs);
    }

    // In development, use longer intervals to reduce overhead
    const devInterval = Math.max(intervalMs, 5000); // Minimum 5 seconds in development

    return setInterval(() => {
      this.measureExecutionTime(callback, 'Interval callback');
    }, devInterval);
  }

  /**
   * Optimize API calls with caching
   */
  cachedAPICall(url, options = {}) {
    const {
      cacheTime = 30000, // 30 seconds
      forceRefresh = false
    } = options;

    const cacheKey = `api_${url}`;
    const cached = this.performanceMetrics.get(cacheKey);

    if (!forceRefresh && cached && Date.now() - cached.timestamp < cacheTime) {
      return Promise.resolve(cached.data);
    }

    return fetch(url, options)
      .then(response => response.json())
      .then(data => {
        this.performanceMetrics.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        return data;
      });
  }
}

// Create singleton instance
const performanceOptimizer = new PerformanceOptimizer();

export default performanceOptimizer;