/**
 * Cloud Storage Usage Monitor
 * Tracks and limits cloud storage operations to prevent quota overuse
 */

class CloudStorageMonitor {
  constructor() {
    this.dailyUsage = {
      classA: 0, // Upload operations
      classB: 0, // Download operations
      date: new Date().toDateString()
    };
    
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cloudStorageUsage');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reset if it's a new day
        if (parsed.date === new Date().toDateString()) {
          this.dailyUsage = parsed;
        }
      }
    }
  }

  /**
   * Record a Class A operation (upload)
   * @param {number} count - Number of operations (default 1)
   */
  recordClassA(count = 1) {
    this.dailyUsage.classA += count;
    this.saveUsage();
    console.log(`📊 Class A operations today: ${this.dailyUsage.classA}`);
  }

  /**
   * Record a Class B operation (download)
   * @param {number} count - Number of operations (default 1)
   */
  recordClassB(count = 1) {
    this.dailyUsage.classB += count;
    this.saveUsage();
    console.log(`📊 Class B operations today: ${this.dailyUsage.classB}`);
    
    // Warn if approaching limits
    if (this.dailyUsage.classB > 2000) {
      console.warn('⚠️ High Class B usage detected! Consider reducing thumbnail generation.');
    }
  }

  /**
   * Check if we're approaching daily limits
   * @returns {Object} Status object with warnings
   */
  checkLimits() {
    const status = {
      classA: {
        count: this.dailyUsage.classA,
        warning: this.dailyUsage.classA > 1000,
        critical: this.dailyUsage.classA > 2000
      },
      classB: {
        count: this.dailyUsage.classB,
        warning: this.dailyUsage.classB > 2000,
        critical: this.dailyUsage.classB > 4000
      }
    };

    return status;
  }

  /**
   * Should we allow thumbnail generation based on current usage?
   * @returns {boolean}
   */
  shouldAllowThumbnailGeneration() {
    const limits = this.checkLimits();
    
    // Don't generate thumbnails if we're in critical usage
    if (limits.classB.critical) {
      console.warn('🚫 Thumbnail generation blocked due to high Class B usage');
      return false;
    }
    
    // Warn but allow if just approaching limits
    if (limits.classB.warning) {
      console.warn('⚠️ High Class B usage - consider limiting thumbnail generation');
    }
    
    return true;
  }

  /**
   * Get usage summary for display
   * @returns {Object}
   */
  getUsageSummary() {
    return {
      date: this.dailyUsage.date,
      classA: this.dailyUsage.classA,
      classB: this.dailyUsage.classB,
      limits: this.checkLimits()
    };
  }

  /**
   * Save usage to localStorage
   */
  saveUsage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cloudStorageUsage', JSON.stringify(this.dailyUsage));
    }
  }

  /**
   * Reset daily counters (called automatically at midnight)
   */
  resetDaily() {
    this.dailyUsage = {
      classA: 0,
      classB: 0,
      date: new Date().toDateString()
    };
    this.saveUsage();
    console.log('🔄 Daily cloud storage usage counters reset');
  }
}

// Export singleton instance
export const cloudStorageMonitor = new CloudStorageMonitor();

// Auto-reset at midnight
if (typeof window !== 'undefined') {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  
  setTimeout(() => {
    cloudStorageMonitor.resetDaily();
    // Set up daily reset
    setInterval(() => {
      cloudStorageMonitor.resetDaily();
    }, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}