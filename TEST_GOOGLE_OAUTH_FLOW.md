# Google OAuth Registration Flow - Integration Tests

This document describes the integration tests for the Google OAuth registration flow feature.

## Test File

`test-google-oauth-flow.js` - Comprehensive integration tests for the complete OAuth flow

## Prerequisites

1. **MongoDB** must be running and accessible
2. **Next.js development server** must be running on `http://localhost:3000`
3. **Environment variables** must be configured in `.env.local`

## Running the Tests

### Step 1: Start the Development Server

```bash
npm run dev
```

Wait for the server to start completely (you should see "Ready" in the console).

### Step 2: Run the Integration Tests

In a new terminal window:

```bash
node test-google-oauth-flow.js
```

**Note:** The tests include built-in delays between requests to avoid triggering rate limiting. The full test suite takes approximately 15-20 seconds to complete.

## Test Coverage

The integration test suite covers the following scenarios:

### 1. New User Flow
- ✅ New Google user detection (returns `requiresRegistration: true`)
- ✅ Complete registration with valid data
- ✅ User account creation in database
- ✅ JWT token generation
- ✅ Session data structure validation

### 2. Existing User Flow
- ✅ Existing Google user login (direct access without registration)
- ✅ JWT token generation for existing users
- ✅ No duplicate account creation

### 3. Error Scenarios
- ✅ Duplicate email protection (409 status)
- ✅ Missing required fields validation
  - Missing first name
  - Missing last name
  - Missing role
- ✅ Invalid role rejection
- ✅ Invalid email format rejection
- ✅ Missing Google authentication data
  - Missing firebaseUser object
  - Missing uid
  - Missing email

### 4. Validation Tests
- ✅ Name field length validation
  - First name too short (< 2 chars)
  - First name too long (> 50 chars)
  - Last name too short (< 2 chars)
  - Last name too long (> 50 chars)
  - Valid name lengths
- ✅ Email format validation
- ✅ Role enum validation

### 5. Session Data Handling
- ✅ Temporary data structure validation
- ✅ Required fields presence (email, googleId, photoURL, displayName)
- ✅ Data cleanup after registration

## Test Output

The test suite provides colored console output:

- 🟢 **Green checkmark (✓)**: Test passed
- 🔴 **Red X (✗)**: Test failed
- 🔵 **Blue**: Informational messages
- 🟡 **Yellow**: Warnings and cleanup messages
- 🟦 **Cyan**: Test section headers

### Example Output

```
═══════════════════════════════════════════════════════
🧪 Google OAuth Registration Flow Integration Tests
═══════════════════════════════════════════════════════

⏳ Checking if Next.js server is running...
✓ Server is running

📦 Connected to MongoDB

🧹 Cleaned up test data

👤 Created existing user for testing

Test 1: New Google User Detection
✓ New user should receive requiresRegistration flag
  Correctly identified new user

Test 2: Complete Registration
✓ Complete registration should create user and return token
  User created: test-1234567890@example.com

Test 3: Existing User Login
✓ Existing user should login directly without registration
  User logged in successfully

...

═══════════════════════════════════════════════════════
📊 Test Summary
═══════════════════════════════════════════════════════
Total Tests: 20
Passed: 20
Failed: 0
Success Rate: 100.0%

✅ All tests passed!

📦 Disconnected from MongoDB
```

## Test Data

The tests use temporary test data that is automatically cleaned up:

- **Test emails**: Generated with timestamps to avoid conflicts
- **Google IDs**: Random generated IDs
- **Test users**: Created and deleted during test execution

All test data is removed from the database after tests complete.

## Troubleshooting

### Server Not Running

```
❌ Next.js server is not running on http://localhost:3000
   Please start the server with: npm run dev
```

**Solution**: Start the development server in another terminal.

### Database Connection Failed

```
❌ MongoDB connection failed: connect ECONNREFUSED
```

**Solution**: Ensure MongoDB is running and `MONGODB_URI` is correctly set in `.env.local`.

### Schema Not Registered Error

```
❌ Schema hasn't been registered for model "User"
```

**Solution**: This error has been fixed in the updated test file. Make sure you're using the latest version.

### Rate Limiting

The test suite includes automatic delays between requests to avoid rate limiting. However, if you run the tests multiple times in quick succession, you may still hit rate limits. If this happens:

1. Wait 1-2 minutes before running the tests again
2. The rate limiter will automatically reset
3. Alternatively, you can temporarily increase rate limits in your development environment

## Manual Testing Checklist

In addition to automated tests, you should manually verify:

- [ ] Google OAuth popup appears correctly
- [ ] Registration page UI displays properly
- [ ] Email field is read-only and shows Google email
- [ ] Profile picture from Google displays
- [ ] Name fields are pre-populated from Google displayName
- [ ] Role dropdown works correctly
- [ ] Cancel button returns to login page
- [ ] Success message appears before redirect
- [ ] User is redirected to dashboard after registration
- [ ] Existing users bypass registration page
- [ ] Session data is cleared after successful registration

## Integration with CI/CD

To run these tests in a CI/CD pipeline:

1. Ensure MongoDB is available (use a test database)
2. Start the Next.js server in the background
3. Run the test script
4. Check the exit code (0 = success, 1 = failure)

Example CI script:

```bash
# Start server in background
npm run dev &
SERVER_PID=$!

# Wait for server to be ready
sleep 10

# Run tests
node test-google-oauth-flow.js
TEST_EXIT_CODE=$?

# Kill server
kill $SERVER_PID

# Exit with test result
exit $TEST_EXIT_CODE
```

## Requirements Coverage

These tests verify all requirements from the specification:

- **Requirement 1**: New user registration flow ✅
- **Requirement 2**: Existing user login flow ✅
- **Requirement 3**: Security and validation ✅
- **Requirement 4**: Simplified registration form ✅
- **Requirement 5**: User feedback and error handling ✅

## Next Steps

After all tests pass:

1. Perform manual testing in the browser
2. Test with real Google OAuth credentials
3. Verify error messages are user-friendly
4. Check browser console for any warnings
5. Test on different browsers and devices
6. Monitor production logs for any issues

## Support

If you encounter issues with the tests:

1. Check that all prerequisites are met
2. Review the test output for specific error messages
3. Verify your `.env.local` configuration
4. Ensure the database is accessible
5. Check that the Next.js server is running properly
