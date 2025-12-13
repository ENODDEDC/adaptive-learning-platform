# Implementation Plan

- [x] 1. Update lockout configuration constant


  - Modify the `LOCKOUT_CONFIG` object in `src/utils/accountLockout.js`
  - Change `lockoutDuration` from `30 * 60 * 1000` to `15 * 60 * 1000`
  - Verify the constant is correctly formatted and maintains millisecond precision
  - _Requirements: 5.1, 5.3_

- [x] 2. Verify integration with login endpoints


  - Review `src/app/api/auth/login/route.js` to confirm it uses the updated configuration
  - Review `src/app/api/admin/auth/login/route.js` to confirm it uses the updated configuration
  - Ensure both endpoints call `recordFailedAttempt()` and `isAccountLocked()` correctly
  - _Requirements: 5.5_

- [x] 3. Test lockout functionality with new duration



  - Manually test user login with 5 failed attempts
  - Verify lockout message displays "15 minutes" 
  - Verify countdown timer starts at 15:00 and counts down correctly
  - Verify login is re-enabled after 15 minutes
  - Test admin login with same scenarios
  - _Requirements: 5.3, 1.1, 1.2, 1.3_

- [ ]* 4. Update documentation
  - Update `SECURITY.md` with new lockout duration if referenced
  - Update `SECURITY_QUICK_REFERENCE.md` with new timing parameters
  - Update any inline code comments that reference the 30-minute duration
  - _Requirements: 5.1, 5.2, 5.3_
