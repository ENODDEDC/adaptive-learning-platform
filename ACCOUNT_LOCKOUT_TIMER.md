# Account Lockout Timer Feature

## Overview

The account lockout timer feature enhances security by temporarily locking user accounts after multiple failed login attempts and displaying a real-time countdown timer showing when they can try again.

## Features

### 1. **Visual Countdown Timer**
- Displays remaining lockout time in MM:SS format
- Updates every second in real-time
- Shows a progress bar that depletes as time passes
- Automatically unlocks the account when timer reaches zero

### 2. **Failed Attempt Warnings**
- Shows remaining attempts before lockout
- Displays warning messages when attempts are low (≤3 remaining)
- Color-coded alerts (red for errors, orange for lockout)

### 3. **Form Disabling**
- Email and password fields are disabled during lockout
- Submit button shows lock icon and "Account Locked" text
- Prevents any login attempts while locked

### 4. **Security Configuration**

Current settings in `src/utils/accountLockout.js`:
```javascript
const LOCKOUT_CONFIG = {
  maxAttempts: 5,              // Lock after 5 failed attempts
  lockoutDuration: 30 * 60 * 1000,  // 30 minutes lockout
  attemptWindow: 15 * 60 * 1000,    // 15 minutes attempt window
};
```

## How It Works

### User Experience Flow

1. **Normal Login**: User enters credentials and attempts login
2. **Failed Attempt**: System shows error with remaining attempts count
3. **Multiple Failures**: After 5 failed attempts within 15 minutes
4. **Account Locked**: 
   - Login form is disabled
   - Countdown timer appears showing 30:00
   - Timer counts down every second
   - Progress bar shows visual representation
5. **Auto Unlock**: When timer reaches 0:00, form re-enables automatically

### Technical Flow

1. **Backend Check** (`/api/auth/login`):
   - Checks if account is locked using `isAccountLocked(email)`
   - Returns 423 status with lockout details if locked
   - Records failed attempts with `recordFailedAttempt(email)`
   - Resets attempts on successful login

2. **Frontend Display** (`/login`):
   - Receives lockout status from API
   - Calculates remaining time in seconds
   - Updates countdown every second using `setInterval`
   - Disables form inputs and submit button
   - Shows lock icon and progress bar

## API Response Format

### Locked Account Response (423)
```json
{
  "message": "Account is temporarily locked due to multiple failed login attempts. Please try again in 30 minutes.",
  "lockedUntil": "2025-12-13T15:30:00.000Z",
  "remainingTime": 1800
}
```

### Failed Login with Warning (401)
```json
{
  "message": "Invalid credentials. 2 attempt(s) remaining before account lockout."
}
```

## Visual Design

### Lockout Message
- Orange background with lock icon
- Clear message about lockout reason
- Prominent countdown timer display
- Smooth progress bar animation

### Timer Display
```
🔒 Account is temporarily locked due to multiple failed login attempts.
    Please try again in 30 minutes.

    Time remaining:        29:45
    [████████████████░░░░░░░░░░]
```

## Testing

To test the lockout timer:

1. Navigate to `/login`
2. Enter incorrect credentials 5 times
3. Observe the countdown timer appear
4. Wait for timer to reach 0:00
5. Verify form re-enables automatically

## Security Benefits

- **Brute Force Protection**: Prevents automated password guessing
- **User Feedback**: Clear communication about security measures
- **Automatic Recovery**: No admin intervention needed
- **Rate Limiting**: Works alongside existing rate limiting
- **Persistent Tracking**: Tracks attempts per email address

## Configuration

To adjust lockout settings, edit `src/utils/accountLockout.js`:

```javascript
const LOCKOUT_CONFIG = {
  maxAttempts: 5,              // Change number of allowed attempts
  lockoutDuration: 30 * 60 * 1000,  // Change lockout duration (ms)
  attemptWindow: 15 * 60 * 1000,    // Change attempt tracking window (ms)
};
```

## Files Modified

- `src/app/(auth)/login/page.js` - Added countdown timer UI
- `src/app/api/auth/login/route.js` - Enhanced lockout response
- `src/app/api/admin/auth/login/route.js` - Enhanced admin lockout response
- `src/utils/accountLockout.js` - Existing lockout logic (no changes needed)

## Future Enhancements

Potential improvements for production:
- Persist lockouts in database (currently in-memory)
- Email notification when account is locked
- Admin dashboard to view/manage locked accounts
- Configurable lockout duration per user role
- IP-based lockout in addition to email-based
