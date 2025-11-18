/**
 * Global Thumbnail Generation Cache
 * 
 * This prevents duplicate thumbnail generation requests for the same attachment
 * across component re-renders, tab switches, and page navigations.
 * 
 * Key Features:
 * - Tracks which attachments have already been processed
 * - Prevents duplicate API calls to cloud storage
 * - Persists across component unmounts/remounts
 * - Stores generated thumbnail URLs in memory
 */

class ThumbnailGenerationCache {
  constructor() {
    // Track which attachments have been attempted (by attachment ID)
    this.attemptedGeneration = new Set();
    
    // Track which attachments are currently generating
    this.generatingNow = new Set();
    
    // Cache generated thumbnail URLs (by attachment ID)
    this.thumbnailUrls = new Map();
    
    // Track failed attempts to avoid retrying
    this.failedAttempts = new Set();
  }

  /**
   * Check if thumbnail generation has been attempted for this attachment
   */
  hasAttempted(attachmentId) {
    return this.attemptedGeneration.has(attachmentId);
  }

  /**
   * Check if thumbnail is currently being generated
   */
  isGenerating(attachmentId) {
    return this.generatingNow.has(attachmentId);
  }

  /**
   * Check if thumbnail generation failed for this attachment
   */
  hasFailed(attachmentId) {
    return this.failedAttempts.has(attachmentId);
  }

  /**
   * Mark that generation has been attempted for this attachment
   */
  markAttempted(attachmentId) {
    this.attemptedGeneration.add(attachmentId);
  }

  /**
   * Mark that generation is starting
   */
  startGenerating(attachmentId) {
    this.generatingNow.add(attachmentId);
  }

  /**
   * Mark that generation is complete
   */
  finishGenerating(attachmentId, thumbnailUrl = null) {
    this.generatingNow.delete(attachmentId);
    if (thumbnailUrl) {
      this.thumbnailUrls.set(attachmentId, thumbnailUrl);
    }
  }

  /**
   * Mark that generation failed
   */
  markFailed(attachmentId) {
    this.generatingNow.delete(attachmentId);
    this.failedAttempts.add(attachmentId);
  }

  /**
   * Get cached thumbnail URL
   */
  getThumbnailUrl(attachmentId) {
    return this.thumbnailUrls.get(attachmentId);
  }

  /**
   * Check if we should attempt generation for this attachment
   * Returns true only if:
   * - Not already attempted
   * - Not currently generating
   * - Not failed before
   * - Has a valid attachment ID
   */
  shouldAttemptGeneration(attachmentId, hasThumbnailUrl) {
    if (!attachmentId) return false;
    if (hasThumbnailUrl) return false;
    if (this.hasAttempted(attachmentId)) return false;
    if (this.isGenerating(attachmentId)) return false;
    if (this.hasFailed(attachmentId)) return false;
    return true;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clear() {
    this.attemptedGeneration.clear();
    this.generatingNow.clear();
    this.thumbnailUrls.clear();
    this.failedAttempts.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      attempted: this.attemptedGeneration.size,
      generating: this.generatingNow.size,
      cached: this.thumbnailUrls.size,
      failed: this.failedAttempts.size
    };
  }
}

// Create a singleton instance
const thumbnailCache = new ThumbnailGenerationCache();

// Expose to window for debugging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.__thumbnailCache = thumbnailCache;
}

export default thumbnailCache;
