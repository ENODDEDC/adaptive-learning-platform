/**
 * Advanced Cache Service with Predictive Loading
 * Provides multi-layer caching with intelligent preloading and memory management
 */

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.prefetchQueue = new Set();
    this.loadingPromises = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      prefetches: 0,
      evictions: 0
    };

    // Cache configuration
    this.config = {
      maxMemorySize: 50 * 1024 * 1024, // 50MB memory cache
      maxLocalStorageSize: 10 * 1024 * 1024, // 10MB localStorage
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      prefetchTTL: 10 * 60 * 1000, // 10 minutes for prefetched data
      cleanupInterval: 60 * 1000, // 1 minute
      maxConcurrentLoads: 5
    };

    this.initializeStorage();
    this.startCleanupTimer();
    this.initializePredictiveLoading();
  }

  /**
   * Initialize storage layers
   */
  async initializeStorage() {
    // Check if IndexedDB is available
    if (typeof window !== 'undefined' && window.indexedDB) {
      this.db = await this.openIndexedDB();
    }

    // Cleanup localStorage on initialization
    this.cleanupLocalStorage();
  }

  /**
   * Open IndexedDB for persistent storage
   */
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LearningPlatformCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expires', 'expires', { unique: false });
          cacheStore.createIndex('accessTime', 'accessTime', { unique: false });
          cacheStore.createIndex('size', 'size', { unique: false });
        }

        if (!db.objectStoreNames.contains('predictions')) {
          const predictionStore = db.createObjectStore('predictions', { keyPath: 'key' });
          predictionStore.createIndex('userId', 'userId', { unique: false });
          predictionStore.createIndex('confidence', 'confidence', { unique: false });
          predictionStore.createIndex('lastPredicted', 'lastPredicted', { unique: false });
        }
      };
    });
  }

  /**
   * Set cache item with automatic storage selection
   */
  async set(key, data, options = {}) {
    const cacheItem = {
      key,
      data,
      timestamp: Date.now(),
      expires: Date.now() + (options.ttl || this.config.defaultTTL),
      size: this.estimateSize(data),
      accessTime: Date.now(),
      accessCount: 0,
      metadata: options.metadata || {}
    };

    // Determine storage strategy
    const storageStrategy = this.determineStorageStrategy(cacheItem);

    try {
      switch (storageStrategy) {
        case 'memory':
          this.setMemoryCache(key, cacheItem);
          break;
        case 'localStorage':
          this.setLocalStorageCache(key, cacheItem);
          break;
        case 'indexedDB':
          await this.setIndexedDBCache(key, cacheItem);
          break;
      }

      // Track prefetch if this was predictive
      if (options.predictive) {
        this.cacheStats.prefetches++;
      }

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cache item with automatic fallback
   */
  async get(key, options = {}) {
    const startTime = performance.now();

    // Check loading promises first
    if (this.loadingPromises.has(key)) {
      return await this.loadingPromises.get(key);
    }

    // Try memory cache first
    let cacheItem = this.getMemoryCache(key);
    if (cacheItem) {
      this.updateAccessStats(cacheItem, performance.now() - startTime);
      return cacheItem.data;
    }

    // Try localStorage
    cacheItem = this.getLocalStorageCache(key);
    if (cacheItem) {
      // Promote to memory cache for faster future access
      this.setMemoryCache(key, cacheItem);
      this.updateAccessStats(cacheItem, performance.now() - startTime);
      return cacheItem.data;
    }

    // Try IndexedDB
    cacheItem = await this.getIndexedDBCache(key);
    if (cacheItem) {
      // Promote to memory cache
      this.setMemoryCache(key, cacheItem);
      this.updateAccessStats(cacheItem, performance.now() - startTime);
      return cacheItem.data;
    }

    // Cache miss
    this.cacheStats.misses++;

    // If predictive loading is enabled, start background load
    if (options.predictive && this.shouldPredictivelyLoad(key)) {
      this.predictiveLoad(key);
    }

    return null;
  }

  /**
   * Memory cache operations
   */
  setMemoryCache(key, cacheItem) {
    // Check memory limit
    if (this.getMemoryCacheSize() + cacheItem.size > this.config.maxMemorySize) {
      this.evictMemoryCache(Math.ceil(cacheItem.size / 1024)); // Evict at least enough for new item
    }

    this.memoryCache.set(key, cacheItem);
  }

  getMemoryCache(key) {
    const item = this.memoryCache.get(key);
    if (item && !this.isExpired(item)) {
      return item;
    }
    if (item) {
      this.memoryCache.delete(key); // Remove expired item
    }
    return null;
  }

  getMemoryCacheSize() {
    let totalSize = 0;
    for (const item of this.memoryCache.values()) {
      totalSize += item.size;
    }
    return totalSize;
  }

  evictMemoryCache(minSizeKB = 1024) {
    const items = Array.from(this.memoryCache.entries())
      .map(([key, item]) => ({ key, item }))
      .sort((a, b) => a.item.accessTime - b.item.accessTime); // LRU eviction

    let freedSize = 0;
    const targetSize = minSizeKB * 1024;

    for (const { key, item } of items) {
      this.memoryCache.delete(key);
      freedSize += item.size;
      this.cacheStats.evictions++;

      if (freedSize >= targetSize) break;
    }
  }

  /**
   * localStorage cache operations
   */
  setLocalStorageCache(key, cacheItem) {
    try {
      const serialized = JSON.stringify(cacheItem);
      localStorage.setItem(`cache_${key}`, serialized);
    } catch (error) {
      // localStorage might be full, try to free space
      this.cleanupLocalStorage();
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
      } catch (retryError) {
        console.warn('Failed to cache to localStorage:', retryError);
      }
    }
  }

  getLocalStorageCache(key) {
    try {
      const serialized = localStorage.getItem(`cache_${key}`);
      if (!serialized) return null;

      const item = JSON.parse(serialized);
      return this.isExpired(item) ? null : item;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return null;
    }
  }

  cleanupLocalStorage() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      let totalSize = 0;

      // Calculate current size
      for (const key of keys) {
        totalSize += localStorage.getItem(key).length * 2; // Rough estimate
      }

      // Remove expired items
      for (const key of keys) {
        const item = this.getLocalStorageCache(key.replace('cache_', ''));
        if (!item) {
          localStorage.removeItem(key);
        }
      }

      // If still over limit, remove oldest items
      if (totalSize > this.config.maxLocalStorageSize) {
        const items = keys
          .map(key => ({
            key,
            item: this.getLocalStorageCache(key.replace('cache_', '')),
            accessTime: this.getLocalStorageCache(key.replace('cache_', ''))?.accessTime || 0
          }))
          .filter(item => item.item)
          .sort((a, b) => a.accessTime - b.accessTime);

        for (const item of items) {
          localStorage.removeItem(item.key);
          totalSize -= item.key.length * 2;

          if (totalSize <= this.config.maxLocalStorageSize * 0.8) break;
        }
      }
    } catch (error) {
      console.warn('Error cleaning up localStorage:', error);
    }
  }

  /**
   * IndexedDB cache operations
   */
  async setIndexedDBCache(key, cacheItem) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');

      const request = store.put(cacheItem);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getIndexedDBCache(key) {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result;
        resolve(item && !this.isExpired(item) ? item : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Determine optimal storage strategy
   */
  determineStorageStrategy(cacheItem) {
    const { size } = cacheItem;

    if (size < 1024) return 'memory'; // Small items stay in memory
    if (size < 50 * 1024) return 'localStorage'; // Medium items go to localStorage
    return 'indexedDB'; // Large items go to IndexedDB
  }

  /**
   * Update access statistics
   */
  updateAccessStats(cacheItem, accessTime) {
    cacheItem.accessTime = Date.now();
    cacheItem.accessCount = (cacheItem.accessCount || 0) + 1;
    this.cacheStats.hits++;
  }

  /**
   * Check if cache item is expired
   */
  isExpired(item) {
    return Date.now() > item.expires;
  }

  /**
   * Estimate size of data in bytes
   */
  estimateSize(data) {
    if (typeof data === 'string') {
      return data.length * 2; // UTF-16 characters
    }
    if (typeof data === 'object') {
      return JSON.stringify(data).length * 2;
    }
    return 8; // Number or boolean
  }

  /**
   * Predictive loading system
   */
  initializePredictiveLoading() {
    this.predictionModel = {
      userPatterns: new Map(),
      courseAccessPatterns: new Map(),
      timeBasedPatterns: new Map(),
      confidenceScores: new Map()
    };

    this.loadPredictionModel();
  }

  /**
   * Load prediction model from storage
   */
  async loadPredictionModel() {
    try {
      const model = localStorage.getItem('predictionModel');
      if (model) {
        const parsed = JSON.parse(model);
        Object.assign(this.predictionModel, parsed);
      }
    } catch (error) {
      console.warn('Failed to load prediction model:', error);
    }
  }

  /**
   * Save prediction model to storage
   */
  async savePredictionModel() {
    try {
      localStorage.setItem('predictionModel', JSON.stringify(this.predictionModel));
    } catch (error) {
      console.warn('Failed to save prediction model:', error);
    }
  }

  /**
   * Learn from user access patterns
   */
  learnAccessPattern(key, context = {}) {
    const pattern = {
      key,
      timestamp: Date.now(),
      context,
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight }
    };

    // Update user patterns
    if (!this.predictionModel.userPatterns.has(context.userId)) {
      this.predictionModel.userPatterns.set(context.userId, []);
    }
    const userPatterns = this.predictionModel.userPatterns.get(context.userId);
    userPatterns.push(pattern);

    // Keep only recent patterns
    if (userPatterns.length > 1000) {
      userPatterns.splice(0, userPatterns.length - 1000);
    }

    // Update course access patterns
    if (key.startsWith('course_')) {
      const courseId = key.replace('course_', '');
      if (!this.predictionModel.courseAccessPatterns.has(courseId)) {
        this.predictionModel.courseAccessPatterns.set(courseId, []);
      }
      this.predictionModel.courseAccessPatterns.get(courseId).push(pattern);
    }

    // Update time-based patterns
    const hour = new Date().getHours();
    if (!this.predictionModel.timeBasedPatterns.has(hour)) {
      this.predictionModel.timeBasedPatterns.set(hour, []);
    }
    this.predictionModel.timeBasedPatterns.get(hour).push(pattern);

    this.savePredictionModel();
  }

  /**
   * Predict likely-to-be-accessed content
   */
  predictAccess(userId, currentContext = {}) {
    const predictions = [];

    // Predict based on user patterns
    const userPatterns = this.predictionModel.userPatterns.get(userId) || [];
    const recentPatterns = userPatterns.slice(-50); // Last 50 interactions

    // Find frequently accessed items
    const accessCounts = new Map();
    recentPatterns.forEach(pattern => {
      const key = pattern.key;
      accessCounts.set(key, (accessCounts.get(key) || 0) + 1);
    });

    // Generate predictions
    for (const [key, count] of accessCounts.entries()) {
      if (count >= 2) { // Accessed at least twice
        const confidence = Math.min(0.9, count / 10); // Confidence based on frequency
        predictions.push({
          key,
          confidence,
          reason: 'frequent_access',
          context: currentContext
        });
      }
    }

    // Predict based on course relationships
    if (currentContext.courseId) {
      const coursePatterns = this.predictionModel.courseAccessPatterns.get(currentContext.courseId) || [];
      coursePatterns.forEach(pattern => {
        if (pattern.key !== `course_${currentContext.courseId}`) {
          predictions.push({
            key: pattern.key,
            confidence: 0.6,
            reason: 'related_course',
            context: currentContext
          });
        }
      });
    }

    // Predict based on time patterns
    const currentHour = new Date().getHours();
    const timePatterns = this.predictionModel.timeBasedPatterns.get(currentHour) || [];
    timePatterns.slice(-20).forEach(pattern => {
      predictions.push({
        key: pattern.key,
        confidence: 0.4,
        reason: 'time_based',
        context: { ...currentContext, hour: currentHour }
      });
    });

    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Top 10 predictions
  }

  /**
   * Predictive loading
   */
  async predictiveLoad(key) {
    if (this.prefetchQueue.has(key)) return; // Already queued

    this.prefetchQueue.add(key);

    try {
      // Simulate loading (in real app, this would fetch from API)
      const data = await this.fetchData(key);

      if (data) {
        await this.set(key, data, {
          ttl: this.config.prefetchTTL,
          predictive: true
        });

        this.learnAccessPattern(key, { type: 'predictive_load' });
      }
    } catch (error) {
      console.warn('Predictive load failed for:', key, error);
    } finally {
      this.prefetchQueue.delete(key);
    }
  }

  /**
   * Check if key should be predictively loaded
   */
  shouldPredictivelyLoad(key) {
    // Don't prefetch if already loading
    if (this.loadingPromises.has(key)) return false;

    // Don't prefetch if recently accessed
    const cached = this.getMemoryCache(key) || this.getLocalStorageCache(key);
    if (cached && Date.now() - cached.accessTime < 60000) return false; // 1 minute

    return true;
  }

  /**
   * Start background prediction and prefetching
   */
  async startPredictivePrefetch(userId, context = {}) {
    const predictions = this.predictAccess(userId, context);

    for (const prediction of predictions) {
      if (prediction.confidence > 0.5) { // Only prefetch high-confidence items
        this.predictiveLoad(prediction.key);
      }
    }
  }

  /**
   * Fetch data from API (placeholder)
   */
  async fetchData(key) {
    // This would be replaced with actual API calls
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    return { key, data: `Mock data for ${key}`, timestamp: Date.now() };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      ...this.cacheStats,
      memorySize: this.getMemoryCacheSize(),
      memoryItems: this.memoryCache.size,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0
    };
  }

  /**
   * Clear all caches
   */
  async clearAll() {
    this.memoryCache.clear();
    this.prefetchQueue.clear();
    this.loadingPromises.clear();

    // Clear localStorage
    const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
    keys.forEach(key => localStorage.removeItem(key));

    // Clear IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.clear();
    }

    // Reset stats
    this.cacheStats = {
      hits: 0,
      misses: 0,
      prefetches: 0,
      evictions: 0
    };
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired items
   */
  async cleanup() {
    // Cleanup memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
      }
    }

    // Cleanup localStorage
    this.cleanupLocalStorage();

    // Cleanup IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('expires');

      const request = index.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (this.isExpired(cursor.value)) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;