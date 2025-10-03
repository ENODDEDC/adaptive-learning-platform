// Rate limiting utility to prevent API abuse
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.limits = {
      // Global limits per IP
      global: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000
      },
      // Per-endpoint limits
      endpoints: {
        '/api/auth/profile': {
          windowMs: 60 * 1000, // 1 minute
          maxRequests: 30
        },
        '/api/courses': {
          windowMs: 60 * 1000, // 1 minute
          maxRequests: 20
        },
        '/api/schedule': {
          windowMs: 60 * 1000, // 1 minute
          maxRequests: 25
        },
        '/api/notifications': {
          windowMs: 60 * 1000, // 1 minute
          maxRequests: 15
        }
      },
      // Per-user limits
      users: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100
      }
    };

    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  // Generate key for tracking requests
  generateKey(type, identifier, endpoint = '') {
    switch (type) {
      case 'ip':
        return `ip:${identifier}`;
      case 'user':
        return `user:${identifier}`;
      case 'endpoint':
        return `endpoint:${endpoint}:${identifier}`;
      default:
        return identifier;
    }
  }

  // Check if request should be rate limited
  isRateLimited(type, identifier, endpoint = '') {
    const key = this.generateKey(type, identifier, endpoint);
    const now = Date.now();

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requestTimes = this.requests.get(key);

    // Get the appropriate limit based on type
    let limit;
    switch (type) {
      case 'endpoint':
        limit = this.limits.endpoints[endpoint] || this.limits.global;
        break;
      case 'user':
        limit = this.limits.users;
        break;
      default:
        limit = this.limits.global;
    }

    // Remove old requests outside the window
    const windowStart = now - limit.windowMs;
    const validRequests = requestTimes.filter(time => time > windowStart);

    // Check if limit exceeded
    if (validRequests.length >= limit.maxRequests) {
      return {
        limited: true,
        retryAfter: Math.ceil((validRequests[0] + limit.windowMs - now) / 1000)
      };
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return {
      limited: false,
      remaining: limit.maxRequests - validRequests.length,
      resetTime: validRequests[0] + limit.windowMs
    };
  }

  // Clean up old request records
  cleanup() {
    const now = Date.now();
    const globalWindow = now - this.limits.global.windowMs;
    const userWindow = now - this.limits.users.windowMs;

    for (const [key, requestTimes] of this.requests.entries()) {
      let windowMs;

      if (key.startsWith('ip:')) {
        windowMs = this.limits.global.windowMs;
      } else if (key.startsWith('user:')) {
        windowMs = this.limits.users.windowMs;
      } else if (key.startsWith('endpoint:')) {
        // Extract endpoint from key to get specific limit
        const parts = key.split(':');
        const endpoint = parts.slice(1, -1).join(':');
        windowMs = this.limits.endpoints[endpoint]?.windowMs || this.limits.global.windowMs;
      } else {
        windowMs = this.limits.global.windowMs;
      }

      const cutoffTime = now - windowMs;
      const validRequests = requestTimes.filter(time => time > cutoffTime);

      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }

  // Get rate limit info for a specific request
  getRateLimitInfo(type, identifier, endpoint = '') {
    const key = this.generateKey(type, identifier, endpoint);

    if (!this.requests.has(key)) {
      return { remaining: this.getLimitForType(type, endpoint).maxRequests };
    }

    const requestTimes = this.requests.get(key);
    const now = Date.now();

    let limit;
    switch (type) {
      case 'endpoint':
        limit = this.limits.endpoints[endpoint] || this.limits.global;
        break;
      case 'user':
        limit = this.limits.users;
        break;
      default:
        limit = this.limits.global;
    }

    const windowStart = now - limit.windowMs;
    const validRequests = requestTimes.filter(time => time > windowStart);

    return {
      remaining: Math.max(0, limit.maxRequests - validRequests.length),
      total: limit.maxRequests,
      resetTime: validRequests[0] + limit.windowMs
    };
  }

  // Get limit configuration for a type
  getLimitForType(type, endpoint = '') {
    switch (type) {
      case 'endpoint':
        return this.limits.endpoints[endpoint] || this.limits.global;
      case 'user':
        return this.limits.users;
      default:
        return this.limits.global;
    }
  }

  // Reset rate limits for a specific key
  resetRateLimit(type, identifier, endpoint = '') {
    const key = this.generateKey(type, identifier, endpoint);
    this.requests.delete(key);
  }

  // Get statistics
  getStats() {
    const stats = {
      totalTracked: this.requests.size,
      byType: {
        ip: 0,
        user: 0,
        endpoint: 0
      }
    };

    for (const key of this.requests.keys()) {
      if (key.startsWith('ip:')) stats.byType.ip++;
      else if (key.startsWith('user:')) stats.byType.user++;
      else if (key.startsWith('endpoint:')) stats.byType.endpoint++;
    }

    return stats;
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Middleware function to apply rate limiting to API routes
export function withRateLimiting(handler, endpoint = '') {
  return async (request, ...args) => {
    // Get client IP (works with Next.js middleware)
    const ip = request.ip ||
               request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check IP-based rate limiting
    const ipCheck = rateLimiter.isRateLimited('ip', ip, endpoint);
    if (ipCheck.limited) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: ipCheck.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': ipCheck.retryAfter.toString(),
            'X-RateLimit-Limit': rateLimiter.getLimitForType('ip', endpoint).maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + (ipCheck.retryAfter * 1000)).toISOString()
          }
        }
      );
    }

    // Check endpoint-specific rate limiting
    const endpointCheck = rateLimiter.isRateLimited('endpoint', ip, endpoint);
    if (endpointCheck.limited) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded for this endpoint',
          retryAfter: endpointCheck.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': endpointCheck.retryAfter.toString(),
            'X-RateLimit-Limit': rateLimiter.getLimitForType('endpoint', endpoint).maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + (endpointCheck.retryAfter * 1000)).toISOString()
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(request, ...args);

    // Clone response to add headers
    const newResponse = new Response(response.body, response);

    // Add rate limit headers
    const ipInfo = rateLimiter.getRateLimitInfo('ip', ip, endpoint);
    const endpointInfo = rateLimiter.getRateLimitInfo('endpoint', ip, endpoint);

    newResponse.headers.set('X-RateLimit-Limit-IP', ipInfo.total.toString());
    newResponse.headers.set('X-RateLimit-Remaining-IP', ipInfo.remaining.toString());
    newResponse.headers.set('X-RateLimit-Limit-Endpoint', endpointInfo.total.toString());
    newResponse.headers.set('X-RateLimit-Remaining-Endpoint', endpointInfo.remaining.toString());
    newResponse.headers.set('X-RateLimit-Reset', new Date(ipInfo.resetTime).toISOString());

    return newResponse;
  };
}

export default rateLimiter;