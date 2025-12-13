# Design Document

## Overview

This design updates the account lockout mechanism configuration to reduce the lockout duration from 30 minutes to 15 minutes while maintaining the same security threshold of 5 failed attempts within a 15-minute window. This change balances security with improved user experience by reducing the penalty time for legitimate users who may have forgotten their password.

## Architecture

The account lockout system uses a hybrid approach:
- **In-memory cache** (Map) for fast lookups during active sessions
- **Database persistence** (future enhancement) for cross-server consistency
- **Centralized configuration** in `src/utils/accountLockout.js`

### Configuration Changes

```javascript
const LOCKOUT_CONFIG = {
  maxAttempts: 5,                    // Unchanged: Lock after 5 failed attempts
  lockoutDuration: 15 * 60 * 1000,   // Changed: 15 minutes (was 30 minutes)
  attemptWindow: 15 * 60 * 1000,     // Unchanged: 15 minutes window
};
```

## Components and Interfaces

### Modified Component: accountLockout.js

**Location:** `src/utils/accountLockout.js`

**Changes:**
- Update `LOCKOUT_CONFIG.lockoutDuration` from `30 * 60 * 1000` to `15 * 60 * 1000`

**Affected Functions:**
- `recordFailedAttempt()` - Uses lockoutDuration to set lockedUntil timestamp
- `isAccountLocked()` - Checks against lockedUntil timestamp
- All other functions remain unchanged

### Integration Points

The lockout mechanism is integrated into:
1. **User Login API** (`src/app/api/auth/login/route.js`)
2. **Admin Login API** (`src/app/api/admin/auth/login/route.js`)
3. **Login UI Components** (displays countdown timer and warnings)

No changes required to integration points - they consume the configuration automatically.

## Data Models

### In-Memory Lockout Data Structure

```javascript
{
  email: {
    count: number,           // Number of failed attempts
    windowStart: timestamp,  // Start of attempt window
    windowEnd: timestamp,    // End of attempt window (windowStart + 15 min)
    lockedUntil: timestamp   // When lockout expires (now + 15 min)
  }
}
```

**Impact of Change:**
- `lockedUntil` will now be set to `currentTime + 15 minutes` instead of `currentTime + 30 minutes`
- All other fields remain unchanged

## Error Handling

No changes to error handling logic. The system continues to:
- Return lockout status with remaining time
- Display appropriate error messages to users
- Log security events via activityLogger

## Testing Strategy

### Manual Testing
1. Trigger 5 failed login attempts
2. Verify lockout message displays "15 minutes" instead of "30 minutes"
3. Verify countdown timer counts down from 15:00
4. Wait for lockout to expire and verify login is re-enabled after 15 minutes

### Verification Points
- Login page displays correct lockout duration
- Admin login page displays correct lockout duration
- Countdown timer accuracy
- Lockout expiration timing

### Security Validation
- Ensure lockout still triggers after 5 attempts
- Verify attempt window still resets after 15 minutes of inactivity
- Confirm lockout cannot be bypassed by page refresh

## Performance Considerations

- No performance impact - only a constant value change
- In-memory Map operations remain O(1)
- Cleanup interval unchanged (5 minutes)

## Backward Compatibility

- Existing locked accounts will continue with their original lockout time
- New lockouts will use the 15-minute duration
- No database migration required (in-memory only)
- No API contract changes

## Security Implications

**Risk Assessment:**
- Reduced lockout time slightly decreases brute-force protection
- However, 15 minutes still provides adequate protection:
  - 5 attempts per 15 minutes = 20 attempts per hour maximum
  - Still effectively prevents automated attacks
  - Improves legitimate user experience

**Mitigation:**
- Rate limiting remains in place at API level
- Activity logging continues to track all attempts
- Consider implementing progressive lockout (future enhancement) if abuse patterns emerge

## Configuration Management

The lockout configuration is centralized in one location:
- **File:** `src/utils/accountLockout.js`
- **Constant:** `LOCKOUT_CONFIG`

Future enhancement: Move to environment variables for runtime configuration without code changes.
