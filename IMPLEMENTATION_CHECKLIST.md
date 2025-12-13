# 🎯 Implementation Checklist

Use this checklist to ensure everything is properly set up and working.

---

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Run `node test-security.js` to verify utilities
- [ ] Copy generated JWT_SECRET to `.env` file
- [ ] Verify all environment variables are set:
  - [ ] `JWT_SECRET` (minimum 32 characters)
  - [ ] `MONGODB_URI`
  - [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - [ ] `FROM_EMAIL`
  - [ ] `NEXT_PUBLIC_URL`
  - [ ] `NODE_ENV=production` (for production)

### Code Updates
- [ ] Search for `localStorage.getItem('token')` and remove
- [ ] Search for `localStorage.setItem('token'` and remove
- [ ] Search for `document.cookie` token access and remove
- [ ] Add `credentials: 'include'` to all authenticated fetch calls
- [ ] Update login component to remove token storage
- [ ] Update logout to call `/api/auth/logout`
- [ ] Remove Authorization headers with Bearer tokens

### Dependencies
- [ ] Run `npm install` to ensure all packages are installed
- [ ] Verify `bcryptjs` is installed
- [ ] Verify `jsonwebtoken` is installed
- [ ] Verify `jose` is installed
- [ ] Verify `nodemailer` is installed

---

## 🧪 Testing Checklist

### Registration Flow
- [ ] Navigate to `/register`
- [ ] Test with weak password (should fail with errors)
  - [ ] Try password without uppercase
  - [ ] Try password without lowercase
  - [ ] Try password without numbers
  - [ ] Try password without special characters
  - [ ] Try password less than 8 characters
- [ ] Test with strong password (should succeed)
- [ ] Verify OTP email is received
- [ ] Test OTP verification with wrong OTP (should fail)
- [ ] Test OTP verification with correct OTP (should succeed)
- [ ] Test OTP expiration (wait 5+ minutes, should fail)
- [ ] Test resend OTP functionality

### Login Flow
- [ ] Navigate to `/login`
- [ ] Test with non-existent email (should show generic error)
- [ ] Test with wrong password (should show generic error)
- [ ] Test with unverified email (should show verification message)
- [ ] Test with correct credentials (should succeed)
- [ ] Verify redirect to `/home` after login
- [ ] Check browser cookies for `token` with HttpOnly flag
- [ ] Verify user data is returned (but not token)

### Account Lockout
- [ ] Try logging in with wrong password 5 times
- [ ] Verify account is locked after 5th attempt
- [ ] Verify error message shows lockout duration
- [ ] Wait 30 minutes or use correct credentials
- [ ] Verify account unlocks automatically

### Rate Limiting
- [ ] Try logging in 6 times rapidly
- [ ] Verify rate limit error after 5th attempt
- [ ] Verify error shows retry-after time
- [ ] Wait 15 minutes
- [ ] Verify rate limit resets

### Password Reset Flow
- [ ] Navigate to `/forgot-password`
- [ ] Enter email address
- [ ] Verify reset email is received
- [ ] Click reset link in email
- [ ] Try weak password (should fail)
- [ ] Try strong password (should succeed)
- [ ] Verify password change notification email
- [ ] Try logging in with new password (should work)
- [ ] Try using same reset link again (should fail)

### Protected Routes
- [ ] Try accessing `/home` without login (should redirect to `/login`)
- [ ] Login and access `/home` (should work)
- [ ] Try accessing `/admin` as regular user (should redirect)
- [ ] Logout and try accessing `/home` (should redirect)

### Logout Flow
- [ ] Login successfully
- [ ] Click logout
- [ ] Verify cookies are cleared
- [ ] Try accessing protected route (should redirect to login)

### Admin Login
- [ ] Navigate to `/admin/login`
- [ ] Try with non-admin account (should fail)
- [ ] Try with admin account (should succeed)
- [ ] Verify `adminToken` cookie is set
- [ ] Verify access to admin routes

---

## 🔍 Security Verification

### Browser DevTools - Cookies
- [ ] Open DevTools → Application → Cookies
- [ ] Find `token` cookie
- [ ] Verify properties:
  - [ ] `HttpOnly` is checked ✓
  - [ ] `Secure` is checked ✓ (production only)
  - [ ] `SameSite` is `Strict`
  - [ ] `Path` is `/`
  - [ ] `Expires` is ~7 days from now

### Browser DevTools - Network
- [ ] Open DevTools → Network
- [ ] Make any request
- [ ] Check Response Headers:
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-XSS-Protection: 1; mode=block`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Database Verification
- [ ] Check MongoDB for User collection
- [ ] Verify new fields exist:
  - [ ] `failedLoginAttempts`
  - [ ] `accountLockedUntil`
  - [ ] `lastLoginAt`
  - [ ] `lastLoginIP`
  - [ ] `passwordChangedAt`
  - [ ] `loginHistory`
- [ ] Login and verify fields are populated

### Email Verification
- [ ] Test registration email (OTP)
- [ ] Test password reset email
- [ ] Test password change notification email
- [ ] Verify emails are properly formatted
- [ ] Verify links work correctly

---

## 📊 Performance Checks

### Response Times
- [ ] Login response < 500ms
- [ ] Registration response < 500ms
- [ ] OTP verification response < 200ms
- [ ] Password reset response < 500ms

### Rate Limiting Performance
- [ ] Rate limiter doesn't slow down normal requests
- [ ] Cleanup runs without issues
- [ ] Memory usage is acceptable

### Database Performance
- [ ] Login queries are fast (< 100ms)
- [ ] User lookups are indexed
- [ ] No N+1 query issues

---

## 🚀 Production Readiness

### Configuration
- [ ] `NODE_ENV=production` is set
- [ ] `JWT_SECRET` is strong and unique (not default)
- [ ] HTTPS is enabled
- [ ] SMTP is configured and working
- [ ] Database connection is secure
- [ ] All sensitive data is in environment variables

### Security
- [ ] No console.logs with sensitive data
- [ ] No hardcoded secrets in code
- [ ] `.env` file is in `.gitignore`
- [ ] Error messages don't expose internals
- [ ] All inputs are validated
- [ ] All outputs are sanitized

### Monitoring
- [ ] Server logs are being collected
- [ ] Failed login attempts are logged
- [ ] Rate limit hits are logged
- [ ] Account lockouts are logged
- [ ] Error tracking is set up

### Documentation
- [ ] Team is aware of security changes
- [ ] Migration guide has been followed
- [ ] Security policies are documented
- [ ] Incident response plan exists

---

## 🔧 Troubleshooting Checks

### If Login Doesn't Work
- [ ] Check browser console for errors
- [ ] Check server logs for errors
- [ ] Verify `credentials: 'include'` in fetch
- [ ] Verify CORS settings allow credentials
- [ ] Check if cookies are being set
- [ ] Verify JWT_SECRET is set correctly

### If Cookies Aren't Set
- [ ] Check if `secure: true` but not using HTTPS
- [ ] Verify domain matches
- [ ] Check SameSite compatibility
- [ ] Verify cookie path is correct

### If Rate Limiting Too Aggressive
- [ ] Adjust limits in `src/utils/rateLimiter.js`
- [ ] Clear rate limit store (restart server)
- [ ] Check if IP detection is working

### If Emails Not Sending
- [ ] Verify SMTP credentials
- [ ] Check SMTP port and security settings
- [ ] Test with Gmail app password
- [ ] Check spam folder
- [ ] Review server logs for email errors

---

## ✅ Final Verification

### Functionality
- [ ] All authentication flows work
- [ ] All security features are active
- [ ] No console errors
- [ ] No server errors
- [ ] Performance is acceptable

### Security
- [ ] HttpOnly cookies working
- [ ] Rate limiting working
- [ ] Account lockout working
- [ ] Password validation working
- [ ] Input sanitization working
- [ ] Security headers present

### User Experience
- [ ] Error messages are clear
- [ ] Loading states work
- [ ] Redirects work correctly
- [ ] Email notifications arrive
- [ ] Forms validate properly

---

## 🎉 Completion

When all items are checked:

1. **Document any issues** encountered and solutions
2. **Train team members** on new security features
3. **Set up monitoring** for security events
4. **Schedule security review** in 3 months
5. **Plan for future enhancements** (2FA, refresh tokens, etc.)

---

## 📝 Notes Section

Use this space to document any issues, customizations, or important notes:

```
Date: _______________
Completed by: _______________

Issues encountered:
-
-
-

Customizations made:
-
-
-

Additional notes:
-
-
-
```

---

**Status:** [ ] Not Started | [ ] In Progress | [ ] Complete

**Date Completed:** _______________

**Verified By:** _______________

**Production Deployment Date:** _______________
