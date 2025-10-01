/**
 * Feature Flags for Performance Optimization
 * Controls which heavy features are enabled in different environments
 */

// Development optimizations
const DEV_OPTIMIZATIONS = {
  // Disable heavy real-time features in development
  ENABLE_ADAPTIVE_LAYOUT: process.env.NODE_ENV === 'production',
  ENABLE_PREDICTIVE_LOADING: process.env.NODE_ENV === 'production',
  ENABLE_PREFERENCE_LEARNING: process.env.NODE_ENV === 'production',
  ENABLE_PERFORMANCE_MONITOR: false, // Disable in development to reduce overhead
  ENABLE_REAL_TIME_ANALYTICS: process.env.NODE_ENV === 'production',

  // Reduce frequencies in development
  ADAPTIVE_ANALYSIS_INTERVAL: process.env.NODE_ENV === 'production' ? 30000 : 120000,
  PREDICTIVE_LOADING_INTERVAL: process.env.NODE_ENV === 'production' ? 30000 : 300000,
  PERFORMANCE_MONITOR_INTERVAL: process.env.NODE_ENV === 'production' ? 5000 : 30000,

  // Memory optimizations
  MAX_CACHED_ITEMS: process.env.NODE_ENV === 'production' ? 1000 : 100,
  MAX_INTERACTION_HISTORY: process.env.NODE_ENV === 'production' ? 1000 : 100,
  ENABLE_DETAILED_LOGGING: false,

  // UI optimizations
  ENABLE_COMPLEX_ANIMATIONS: process.env.NODE_ENV === 'production',
  ENABLE_HEAVY_COMPONENTS: process.env.NODE_ENV === 'production',
  LAZY_LOAD_THRESHOLD: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,
};

// Production optimizations
const PROD_OPTIMIZATIONS = {
  ENABLE_ADAPTIVE_LAYOUT: true,
  ENABLE_PREDICTIVE_LOADING: true,
  ENABLE_PREFERENCE_LEARNING: true,
  ENABLE_PERFORMANCE_MONITOR: true,
  ENABLE_REAL_TIME_ANALYTICS: true,

  ADAPTIVE_ANALYSIS_INTERVAL: 30000,
  PREDICTIVE_LOADING_INTERVAL: 30000,
  PERFORMANCE_MONITOR_INTERVAL: 5000,

  MAX_CACHED_ITEMS: 1000,
  MAX_INTERACTION_HISTORY: 1000,
  ENABLE_DETAILED_LOGGING: false,

  ENABLE_COMPLEX_ANIMATIONS: true,
  ENABLE_HEAVY_COMPONENTS: true,
  LAZY_LOAD_THRESHOLD: 0.1,
};

// Feature flag utilities
class FeatureFlags {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.optimizations = this.isDevelopment ? DEV_OPTIMIZATIONS : PROD_OPTIMIZATIONS;
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(feature) {
    return this.optimizations[feature] === true;
  }

  /**
   * Get optimization value
   */
  getValue(setting) {
    return this.optimizations[setting];
  }

  /**
   * Check if heavy features should be disabled for performance
   */
  shouldDisableHeavyFeatures() {
    return this.isDevelopment;
  }

  /**
   * Get recommended interval for a feature
   */
  getInterval(feature) {
    return this.optimizations[feature] || 30000;
  }

  /**
   * Check if device can handle heavy features
   */
  canHandleHeavyFeatures() {
    if (typeof window === 'undefined') return true; // Server-side, assume capable

    try {
      const memory = navigator.deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 2;

      // In development, be more restrictive
      if (this.isDevelopment) {
        return memory >= 8 && cores >= 4;
      }

      // In production, be less restrictive
      return memory >= 4 && cores >= 2;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get performance-optimized settings
   */
  getOptimizedSettings() {
    return {
      enableAdaptiveLayout: this.isEnabled('ENABLE_ADAPTIVE_LAYOUT') && this.canHandleHeavyFeatures(),
      enablePredictiveLoading: this.isEnabled('ENABLE_PREDICTIVE_LOADING') && this.canHandleHeavyFeatures(),
      enablePreferenceLearning: this.isEnabled('ENABLE_PREFERENCE_LEARNING') && this.canHandleHeavyFeatures(),
      enablePerformanceMonitor: this.isEnabled('ENABLE_PERFORMANCE_MONITOR'),
      enableRealTimeAnalytics: this.isEnabled('ENABLE_REAL_TIME_ANALYTICS'),

      adaptiveAnalysisInterval: this.getInterval('ADAPTIVE_ANALYSIS_INTERVAL'),
      predictiveLoadingInterval: this.getInterval('PREDICTIVE_LOADING_INTERVAL'),
      performanceMonitorInterval: this.getInterval('PERFORMANCE_MONITOR_INTERVAL'),

      maxCachedItems: this.getValue('MAX_CACHED_ITEMS'),
      maxInteractionHistory: this.getValue('MAX_INTERACTION_HISTORY'),
      enableDetailedLogging: this.getValue('ENABLE_DETAILED_LOGGING'),

      enableComplexAnimations: this.getValue('ENABLE_COMPLEX_ANIMATIONS'),
      enableHeavyComponents: this.getValue('ENABLE_HEAVY_COMPONENTS'),
      lazyLoadThreshold: this.getValue('LAZY_LOAD_THRESHOLD'),
    };
  }

  /**
   * Log current feature flag status
   */
  logStatus() {
    if (!this.isDevelopment) return;

  }
}

// Create singleton instance
const featureFlags = new FeatureFlags();

// Log status in development
if (process.env.NODE_ENV === 'development') {
  featureFlags.logStatus();
}

export default featureFlags;