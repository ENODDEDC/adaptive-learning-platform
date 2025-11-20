/**
 * Global File Content Cache
 * 
 * Caches full file content (PDFs, DOCX, PPTX) to prevent repeated downloads
 * from cloud storage when users open the same file multiple times.
 * 
 * Benefits:
 * - Saves cloud storage bandwidth and costs
 * - Eliminates slow loading on repeated opens (instant access)
 * - Improves user experience with faster document viewing
 */

class FileContentCache {
  constructor() {
    // Cache file URLs/blobs by file ID
    this.fileCache = new Map();
    
    // Track which files are currently being fetched
    this.fetchingFiles = new Set();
    
    // Track failed fetches to avoid retrying
    this.failedFetches = new Set();
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      saves: 0
    };
  }

  /**
   * Check if file is in cache
   */
  has(fileId) {
    return this.fileCache.has(fileId);
  }

  /**
   * Get cached file content
   */
  get(fileId) {
    if (this.fileCache.has(fileId)) {
      this.stats.hits++;
      console.log(`📦 [CACHE HIT] File ${fileId} loaded from cache (instant!)`);
      return this.fileCache.get(fileId);
    }
    this.stats.misses++;
    return null;
  }

  /**
   * Store file content in cache
   */
  set(fileId, fileData) {
    this.fileCache.set(fileId, fileData);
    this.stats.saves++;
    console.log(`💾 [CACHE SAVE] File ${fileId} saved to cache for future use`);
  }

  /**
   * Check if file is currently being fetched
   */
  isFetching(fileId) {
    return this.fetchingFiles.has(fileId);
  }

  /**
   * Mark file as being fetched
   */
  startFetching(fileId) {
    this.fetchingFiles.add(fileId);
    console.log(`⬇️ [DOWNLOADING] File ${fileId} from cloud storage...`);
  }

  /**
   * Mark file fetch as complete
   */
  finishFetching(fileId) {
    this.fetchingFiles.delete(fileId);
  }

  /**
   * Check if file fetch failed before
   */
  hasFailed(fileId) {
    return this.failedFetches.has(fileId);
  }

  /**
   * Mark file fetch as failed
   */
  markFailed(fileId) {
    this.failedFetches.add(fileId);
    this.fetchingFiles.delete(fileId);
  }

  /**
   * Remove file from cache (useful for updates)
   */
  remove(fileId) {
    this.fileCache.delete(fileId);
    this.failedFetches.delete(fileId);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.fileCache.clear();
    this.fetchingFiles.clear();
    this.failedFetches.clear();
    this.stats = { hits: 0, misses: 0, saves: 0 };
    console.log('🗑️ File content cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(1) : 0;
    
    return {
      cached: this.fileCache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      saves: this.stats.saves,
      hitRate: `${hitRate}%`,
      fetching: this.fetchingFiles.size,
      failed: this.failedFetches.size
    };
  }

  /**
   * Get cache size in MB (approximate)
   */
  getCacheSize() {
    let totalSize = 0;
    this.fileCache.forEach((data) => {
      if (data.blob) {
        totalSize += data.blob.size;
      }
    });
    return (totalSize / (1024 * 1024)).toFixed(2); // Convert to MB
  }
}

// Create singleton instance
const fileContentCache = new FileContentCache();

// Expose to window for debugging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.__fileContentCache = fileContentCache;
  console.log('🔧 File Content Cache available at window.__fileContentCache');
  console.log('📊 Check stats: window.__fileContentCache.getStats()');
}

export default fileContentCache;
