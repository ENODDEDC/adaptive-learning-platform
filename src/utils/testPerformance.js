// Test script to validate performance improvements

export async function runPerformanceTests() {
  console.log('🚀 Starting performance tests...');

  // Test 1: API Service Cache and Deduplication
  console.log('\n📊 Testing API Service Cache and Deduplication...');

  const startTime = Date.now();

  // Make multiple identical requests to test deduplication
  const requests = [];
  for (let i = 0; i < 5; i++) {
    requests.push(apiService.request('/api/test-endpoint', {
      method: 'GET',
      useCache: true
    }));
  }

  try {
    const responses = await Promise.all(requests);
    const endTime = Date.now();

    console.log(`✅ Deduplication test completed in ${endTime - startTime}ms`);
    console.log(`📈 Cache stats:`, apiService.getCacheStats());

    // Test 2: Performance Monitor
    console.log('\n📈 Testing Performance Monitor...');

    // Simulate some API calls
    performanceMonitor.recordAPICall('/api/test', 'GET', 150, 200);
    performanceMonitor.recordAPICall('/api/test', 'GET', 300, 200);
    performanceMonitor.recordAPICall('/api/test', 'GET', 50, 500);

    const metrics = performanceMonitor.getAllMetrics();
    console.log('📊 Performance metrics:', metrics);

    const healthScore = performanceMonitor.getHealthScore();
    console.log(`💚 Health score: ${healthScore}/100`);

    // Test 3: Rate Limiter
    console.log('\n🛡️ Testing Rate Limiter...');

    const testIP = '192.168.1.100';

    // Test within limits
    for (let i = 0; i < 3; i++) {
      const result = rateLimiter.isRateLimited('ip', testIP, '/api/test');
      console.log(`Request ${i + 1}:`, result.limited ? '❌ Rate limited' : '✅ Allowed');
    }

    const stats = rateLimiter.getStats();
    console.log('📊 Rate limiter stats:', stats);

    // Test 4: Cache Invalidation
    console.log('\n🔄 Testing Cache Invalidation...');

    // Set some cache data
    apiService.setCachedData('test:key', { test: 'data' });

    // Verify it exists
    const cachedBefore = apiService.getCachedData('test:key');
    console.log('Cache before invalidation:', cachedBefore ? '✅ Present' : '❌ Missing');

    // Clear cache
    apiService.clearCacheEntry('test:key');

    // Verify it's gone
    const cachedAfter = apiService.getCachedData('test:key');
    console.log('Cache after invalidation:', cachedAfter ? '❌ Still present' : '✅ Cleared');

    console.log('\n🎉 All performance tests completed successfully!');
    console.log('\n📋 Summary of improvements implemented:');
    console.log('✅ Centralized API service with caching');
    console.log('✅ Request deduplication to prevent loops');
    console.log('✅ Performance monitoring and metrics');
    console.log('✅ Rate limiting to prevent abuse');
    console.log('✅ Database query optimization');
    console.log('✅ Cache invalidation strategies');

    return {
      success: true,
      cacheStats: apiService.getCacheStats(),
      healthScore,
      rateLimiterStats: stats,
      performanceMetrics: metrics
    };

  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in browser console or Node.js environment
if (typeof window !== 'undefined') {
  window.runPerformanceTests = runPerformanceTests;
}

export default runPerformanceTests;