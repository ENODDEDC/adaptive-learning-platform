// Centralized API service with caching and request deduplication
class APIService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
  }

  // Generate cache key for request
  generateCacheKey(endpoint, options = {}) {
    const { method = 'GET', body } = options;
    const key = `${method}:${endpoint}`;

    // Include body in cache key for POST/PUT requests
    if (body && (method === 'POST' || method === 'PUT')) {
      return `${key}:${JSON.stringify(body)}`;
    }

    return key;
  }

  // Check if we have valid cached data
  getCachedData(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // Remove expired cache entry
    if (cached) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  // Cache API response
  setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  // Main request method with deduplication and caching
  async request(endpoint, options = {}) {
    const { method = 'GET', body, useCache = true, skipDedupe = false } = options;
    const cacheKey = this.generateCacheKey(endpoint, options);

    // Return cached data if available and caching is enabled
    if (useCache && method === 'GET') {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Check for pending request to avoid duplicates
    if (!skipDedupe && this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Create new request promise
    const requestPromise = this.makeRequest(endpoint, options);

    // Store pending request
    if (!skipDedupe) {
      this.pendingRequests.set(cacheKey, requestPromise);
    }

    try {
      const result = await requestPromise;

      // Cache successful GET requests
      if (useCache && method === 'GET' && result.ok) {
        const data = await result.clone().json();
        this.setCachedData(cacheKey, data);
      }

      return result;
    } finally {
      // Remove from pending requests
      if (!skipDedupe) {
        this.pendingRequests.delete(cacheKey);
      }
    }
  }

  // Actual HTTP request
  async makeRequest(endpoint, options = {}) {
    const { method = 'GET', body, credentials = 'include' } = options;

    const requestOptions = {
      method,
      credentials,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    return fetch(endpoint, requestOptions);
  }

  // Clear all cached data
  clearCache() {
    this.cache.clear();
  }

  // Clear specific cache entry
  clearCacheEntry(endpoint, options = {}) {
    const cacheKey = this.generateCacheKey(endpoint, options);
    this.cache.delete(cacheKey);
  }

  // Get cache stats for debugging
  getCacheStats() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size
    };
  }
}

// Export singleton instance
export const apiService = new APIService();

// Convenience methods for common API calls
export const api = {
  // User profile
  async getUserProfile() {
    return apiService.request('/api/auth/profile');
  },

  // Courses
  async getCourses() {
    return apiService.request('/api/courses');
  },

  // Schedule
  async getSchedule() {
    return apiService.request('/api/schedule');
  },

  async updateSchedule(data) {
    return apiService.request('/api/schedule', {
      method: 'POST',
      body: data,
      useCache: false
    });
  },

  async deleteSchedule(data) {
    return apiService.request('/api/schedule', {
      method: 'DELETE',
      body: data,
      useCache: false
    });
  },

  // Notifications
  async getNotifications() {
    return apiService.request('/api/notifications');
  },

  async markNotificationsRead(notificationIds) {
    return apiService.request('/api/notifications', {
      method: 'PUT',
      body: { notificationIds },
      useCache: false
    });
  }
};

export default apiService;