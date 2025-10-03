// Performance monitoring utility for API endpoints
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.RESPONSE_TIME_THRESHOLDS = {
      excellent: 100,
      good: 200,
      slow: 500,
      very_slow: 1000
    };
  }

  // Record API call metrics
  recordAPICall(endpoint, method, responseTime, statusCode) {
    const key = `${method}:${endpoint}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        calls: 0,
        totalResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        statusCodes: new Map(),
        lastCalled: null
      });
    }

    const metric = this.metrics.get(key);
    metric.calls++;
    metric.totalResponseTime += responseTime;
    metric.minResponseTime = Math.min(metric.minResponseTime, responseTime);
    metric.maxResponseTime = Math.max(metric.maxResponseTime, responseTime);
    metric.lastCalled = new Date();

    // Track status codes
    const statusCount = metric.statusCodes.get(statusCode) || 0;
    metric.statusCodes.set(statusCode, statusCount + 1);

    // Log slow requests
    if (responseTime > this.RESPONSE_TIME_THRESHOLDS.slow) {
      console.warn(`Slow API call detected: ${key} took ${responseTime}ms`);
    }

    // Log errors
    if (statusCode >= 400) {
      console.error(`API Error: ${key} returned ${statusCode} in ${responseTime}ms`);
    }
  }

  // Get performance metrics for an endpoint
  getEndpointMetrics(endpoint, method = 'GET') {
    const key = `${method}:${endpoint}`;
    return this.metrics.get(key) || null;
  }

  // Get average response time for an endpoint
  getAverageResponseTime(endpoint, method = 'GET') {
    const metrics = this.getEndpointMetrics(endpoint, method);
    if (!metrics || metrics.calls === 0) return null;

    return metrics.totalResponseTime / metrics.calls;
  }

  // Get all metrics summary
  getAllMetrics() {
    const summary = {};

    for (const [key, metric] of this.metrics.entries()) {
      summary[key] = {
        calls: metric.calls,
        averageResponseTime: metric.totalResponseTime / metric.calls,
        minResponseTime: metric.minResponseTime,
        maxResponseTime: metric.maxResponseTime,
        statusCodes: Object.fromEntries(metric.statusCodes),
        lastCalled: metric.lastCalled
      };
    }

    return summary;
  }

  // Get performance health score (0-100)
  getHealthScore() {
    if (this.metrics.size === 0) return 100;

    let totalScore = 0;
    let endpointCount = 0;

    for (const metric of this.metrics.values()) {
      if (metric.calls === 0) continue;

      const avgTime = metric.totalResponseTime / metric.calls;
      let score;

      if (avgTime <= this.RESPONSE_TIME_THRESHOLDS.excellent) {
        score = 100;
      } else if (avgTime <= this.RESPONSE_TIME_THRESHOLDS.good) {
        score = 80;
      } else if (avgTime <= this.RESPONSE_TIME_THRESHOLDS.slow) {
        score = 60;
      } else if (avgTime <= this.RESPONSE_TIME_THRESHOLDS.very_slow) {
        score = 40;
      } else {
        score = 20;
      }

      // Deduct points for errors
      const errorCount = Array.from(metric.statusCodes.entries())
        .filter(([status]) => status >= 400)
        .reduce((sum, [, count]) => sum + count, 0);

      const errorRate = errorCount / metric.calls;
      score = score * (1 - errorRate);

      totalScore += score;
      endpointCount++;
    }

    return endpointCount > 0 ? Math.round(totalScore / endpointCount) : 100;
  }

  // Clear old metrics (older than specified hours)
  clearOldMetrics(hoursOld = 24) {
    const cutoffTime = new Date(Date.now() - (hoursOld * 60 * 60 * 1000));

    for (const [key, metric] of this.metrics.entries()) {
      if (metric.lastCalled && metric.lastCalled < cutoffTime) {
        this.metrics.delete(key);
      }
    }
  }

  // Export metrics for external monitoring
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      healthScore: this.getHealthScore(),
      endpoints: this.getAllMetrics(),
      summary: {
        totalEndpoints: this.metrics.size,
        totalCalls: Array.from(this.metrics.values()).reduce((sum, m) => sum + m.calls, 0)
      }
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Middleware function to wrap API routes with performance monitoring
export function withPerformanceMonitoring(handler) {
  return async (request, ...args) => {
    const startTime = Date.now();
    const { method } = request;
    const url = new URL(request.url);
    const endpoint = url.pathname;

    try {
      const response = await handler(request, ...args);
      const responseTime = Date.now() - startTime;

      // Record metrics
      performanceMonitor.recordAPICall(endpoint, method, responseTime, response.status);

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record error metrics
      performanceMonitor.recordAPICall(endpoint, method, responseTime, 500);

      throw error;
    }
  };
}

export default performanceMonitor;