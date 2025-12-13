# Hotfix: Rate Limiter Import Error

## Issue
After implementing the new security features, the application failed to start with the error:
```
Export 'withRateLimiting' doesn't exist in target module
```

## Root Cause
The old code in `src/app/api/schedule/route.js` and `src/app/api/courses/route.js` was using a wrapper function `withRateLimiting` that doesn't exist in the new rate limiter implementation.

## Files Fixed
1. `src/app/api/schedule/route.js`
2. `src/app/api/courses/route.js`

## Changes Made

### Before (Old Pattern)
```javascript
import { withRateLimiting } from '@/utils/rateLimiter';

const monitoredGET = withPerformanceMonitoring(async (request) => {
  // ... code
});

export async function GET(request) {
  const rateLimitedGET = withRateLimiting(monitoredGET, '/api/schedule');
  return rateLimitedGET(request);
}
```

### After (New Pattern)
```javascript
import { checkRateLimit, rateLimitResponse } from '@/utils/rateLimiter';
import { getClientIP } from '@/utils/inputValidator';

const monitoredGET = withPerformanceMonitoring(async (request) => {
  // Check rate limiting
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP, 'login');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter);
  }
  
  // ... rest of code
});

export async function GET(request) {
  return monitoredGET(request);
}
```

## Status
✅ **FIXED** - All files updated and verified with no errors

## Testing
Run the application:
```bash
npm run dev
```

The error should be resolved and the application should start successfully.

## Note
The new rate limiting approach is more flexible and allows for per-endpoint configuration directly in the route handlers rather than using a wrapper function.
