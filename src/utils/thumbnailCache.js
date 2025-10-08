/**
 * Persistent Thumbnail Cache Utility
 * One-time download with permanent local storage caching
 */

class ThumbnailCache {
  constructor() {
    this.cache = new Map();
    this.generatingSet = new Set();
    this.storageKey = 'thumbnailCache_v1';
    
    // Load from localStorage on initialization
    this.loadFromStorage();
  }

  /**
   * Load cache from localStorage
   */
  loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(Object.entries(data));
        console.log('📦 Loaded', this.cache.size, 'cached thumbnails from storage');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load thumbnail cache:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  saveToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Failed to save thumbnail cache:', error);
    }
  }

  /**
   * Check if thumbnail exists or is being generated
   * @param {string} fileKey - The file key
   * @returns {boolean}
   */
  isProcessed(fileKey) {
    return this.cache.has(fileKey) || this.generatingSet.has(fileKey);
  }

  /**
   * Mark thumbnail as being generated
   * @param {string} fileKey - The file key
   */
  markGenerating(fileKey) {
    this.generatingSet.add(fileKey);
  }

  /**
   * Mark thumbnail as completed and save permanently
   * @param {string} fileKey - The file key
   * @param {string} thumbnailUrl - The generated thumbnail URL
   */
  markCompleted(fileKey, thumbnailUrl) {
    this.generatingSet.delete(fileKey);
    this.cache.set(fileKey, {
      thumbnailUrl,
      timestamp: Date.now(),
      permanent: true // Never expires - cached forever!
    });
    this.saveToStorage();
    console.log('💾 Thumbnail cached permanently for:', fileKey);
  }

  /**
   * Mark thumbnail as failed
   * @param {string} fileKey - The file key
   */
  markFailed(fileKey) {
    this.generatingSet.delete(fileKey);
    this.cache.set(fileKey, {
      failed: true,
      timestamp: Date.now()
    });
    this.saveToStorage();
  }

  /**
   * Get cached thumbnail URL
   * @param {string} fileKey - The file key
   * @returns {string|null}
   */
  getThumbnailUrl(fileKey) {
    const cached = this.cache.get(fileKey);
    return cached && !cached.failed ? cached.thumbnailUrl : null;
  }

  /**
   * Check if thumbnail is permanently cached
   * @param {string} fileKey - The file key
   * @returns {boolean}
   */
  isPermanentlyCached(fileKey) {
    const cached = this.cache.get(fileKey);
    return cached && cached.permanent && !cached.failed;
  }

  /**
   * Clear only failed entries, keep successful thumbnails forever
   */
  cleanup() {
    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.cache.entries()) {
      // Only remove failed entries after 1 day, keep successful ones forever
      if (value.failed && now - value.timestamp > oneDay) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.saveToStorage();
      console.log('🧹 Cleaned up', cleaned, 'failed thumbnail entries');
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.cache.size;
    const successful = Array.from(this.cache.values()).filter(v => !v.failed).length;
    const failed = total - successful;
    const sizeInMB = new Blob([localStorage.getItem(this.storageKey) || '']).size / (1024 * 1024);
    
    return { total, successful, failed, sizeInMB: sizeInMB.toFixed(2) };
  }

  /**
   * Clear all cache (emergency use only)
   */
  clearAll() {
    this.cache.clear();
    this.generatingSet.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
    console.log('🗑️ All thumbnail cache cleared');
  }
}

// Export singleton instance
export const thumbnailCache = new ThumbnailCache();

// Cleanup failed entries every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    thumbnailCache.cleanup();
  }, 60 * 60 * 1000); // 1 hour
}