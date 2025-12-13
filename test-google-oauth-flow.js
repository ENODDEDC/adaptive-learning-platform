/**
 * Google OAuth Registration Flow Integration Tests
 * 
 * Tests the complete flow for Google OAuth authentication including:
 * - New user registration flow
 * - Existing user login flow
 * - Error scenarios
 * - Session data handling
 * 
 * Usage: node test-google-oauth-flow.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import User model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  middleName: { type: String },
  surname: { type: String, required: true },
  suffix: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String },
  otpExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  googleId: { type: String },
  photoURL: { type: String },
  profilePicture: { type: String },
  authProvider: { type: String, enum: ['email', 'google'], default: 'email' },
  role: { type: String, enum: ['super admin', 'admin', 'instructor', 'student'], default: 'student' },
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: { type: Date },
  lastLoginAt: { type: Date },
  lastLoginIP: { type: String },
  passwordChangedAt: { type: Date },
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
    success: Boolean,
  }],
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testEmail: `test-${Date.now()}@example.com`,
  existingUserEmail: 'existing-google-user@example.com',
  googleId: `google-${crypto.randomBytes(16).toString('hex')}`,
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * Helper function to add delay between tests to avoid rate limiting
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper function to log test results
 */
function logTest(testName, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    if (message) console.log(`  ${colors.cyan}${message}${colors.reset}`);
  } else {
    testResults.failed++;
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (message) console.log(`  ${colors.red}${message}${colors.reset}`);
  }
}

/**
 * Helper function to make API requests
 */
async function makeRequest(endpoint, method = 'POST', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${TEST_CONFIG.baseUrl}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      data,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message
    };
  }
}

/**
 * Check if the Next.js server is running
 */
async function checkServerRunning() {
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/google-signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Connect to MongoDB for direct database operations
 */
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`${colors.blue}📦 Connected to MongoDB${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ MongoDB connection failed:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Clean up test data from database
 */
async function cleanupTestData() {
  try {
    await User.deleteMany({ 
      email: { 
        $in: [TEST_CONFIG.testEmail, TEST_CONFIG.existingUserEmail] 
      } 
    });
    console.log(`${colors.yellow}🧹 Cleaned up test data${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}❌ Cleanup failed:${colors.reset}`, error.message);
  }
}

/**
 * Create an existing user for testing login flow
 */
async function createExistingUser() {
  try {
    const existingUser = new User({
      name: 'Existing',
      surname: 'User',
      email: TEST_CONFIG.existingUserEmail,
      password: 'google_auth',
      googleId: 'existing-google-id-123',
      photoURL: 'https://example.com/existing-photo.jpg',
      isVerified: true,
      authProvider: 'google',
      role: 'student'
    });
    await existingUser.save();
    console.log(`${colors.blue}👤 Created existing user for testing${colors.reset}\n`);
    return existingUser;
  } catch (error) {
    console.error(`${colors.red}❌ Failed to create existing user:${colors.reset}`, error.message);
    return null;
  }
}

/**
 * Test 1: New Google user should receive requiresRegistration flag
 */
async function testNewUserDetection() {
  console.log(`${colors.cyan}Test 1: New Google User Detection${colors.reset}`);
  
  const response = await makeRequest('/api/auth/google-signin', 'POST', {
    firebaseUser: {
      uid: TEST_CONFIG.googleId,
      email: TEST_CONFIG.testEmail,
      displayName: TEST_CONFIG.displayName,
      photoURL: TEST_CONFIG.photoURL
    }
  });

  const passed = response.status === 200 && 
                 response.data.success === true &&
                 response.data.requiresRegistration === true &&
                 response.data.tempData?.email === TEST_CONFIG.testEmail;

  logTest(
    'New user should receive requiresRegistration flag',
    passed,
    passed ? 'Correctly identified new user' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`
  );

  return response.data.tempData;
}

/**
 * Test 2: Complete registration for new Google user
 */
async function testCompleteRegistration(tempData) {
  console.log(`\n${colors.cyan}Test 2: Complete Registration${colors.reset}`);

  const response = await makeRequest('/api/auth/complete-google-registration', 'POST', {
    googleData: {
      email: tempData.email,
      googleId: tempData.googleId,
      photoURL: tempData.photoURL
    },
    userData: {
      name: 'Test',
      middleName: '',
      surname: 'User',
      suffix: '',
      role: 'student',
      password: 'TestPass123!'
    }
  });

  const passed = response.status === 201 &&
                 response.data.success === true &&
                 response.data.token &&
                 response.data.user?.email === TEST_CONFIG.testEmail;

  logTest(
    'Complete registration should create user and return token',
    passed,
    passed ? `User created: ${response.data.user?.email}` : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`
  );

  return response.data;
}

/**
 * Test 3: Existing Google user should login directly
 */
async function testExistingUserLogin() {
  console.log(`\n${colors.cyan}Test 3: Existing User Login${colors.reset}`);

  const response = await makeRequest('/api/auth/google-signin', 'POST', {
    firebaseUser: {
      uid: 'existing-google-id-123',
      email: TEST_CONFIG.existingUserEmail,
      displayName: 'Existing User',
      photoURL: 'https://example.com/existing-photo.jpg'
    }
  });

  const passed = response.status === 200 &&
                 response.data.success === true &&
                 response.data.requiresRegistration === false &&
                 response.data.token &&
                 response.data.user?.email === TEST_CONFIG.existingUserEmail;

  logTest(
    'Existing user should login directly without registration',
    passed,
    passed ? 'User logged in successfully' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`
  );
}

/**
 * Test 4: Duplicate email should be rejected
 */
async function testDuplicateEmail(tempData) {
  console.log(`\n${colors.cyan}Test 4: Duplicate Email Protection${colors.reset}`);

  // Try to register with the same email again
  const response = await makeRequest('/api/auth/complete-google-registration', 'POST', {
    googleData: {
      email: tempData.email,
      googleId: 'different-google-id',
      photoURL: tempData.photoURL
    },
    userData: {
      name: 'Another',
      middleName: '',
      surname: 'User',
      suffix: '',
      role: 'student', // Role is always student for Google OAuth
      password: 'AnotherPass123!'
    }
  });

  const passed = response.status === 409 &&
                 response.data.success === false;

  logTest(
    'Duplicate email should be rejected with 409 status',
    passed,
    passed ? 'Duplicate email correctly rejected' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`
  );
}

/**
 * Test 5: Missing required fields should fail validation
 */
async function testMissingFields() {
  console.log(`\n${colors.cyan}Test 5: Missing Required Fields${colors.reset}`);

  const testCases = [
    {
      name: 'Missing first name',
      data: {
        googleData: {
          email: 'test-missing@example.com',
          googleId: 'google-123',
          photoURL: ''
        },
        userData: {
          name: '',
          surname: 'User',
          role: 'student',
          password: 'TestPass123!'
        }
      }
    },
    {
      name: 'Missing last name',
      data: {
        googleData: {
          email: 'test-missing@example.com',
          googleId: 'google-123',
          photoURL: ''
        },
        userData: {
          name: 'Test',
          surname: '',
          role: 'student',
          password: 'TestPass123!'
        }
      }
    },
    // Role is automatically set to "student" - no need to test missing role
  ];

  for (const testCase of testCases) {
    const response = await makeRequest('/api/auth/complete-google-registration', 'POST', testCase.data);
    const passed = response.status === 400 && response.data.success === false;
    logTest(
      testCase.name,
      passed,
      passed ? 'Validation correctly rejected' : `Status: ${response.status}`
    );
    await delay(500); // Small delay between test cases
  }
}

/**
 * Test 6: Role is automatically set to "student"
 */
async function testAutoRoleAssignment() {
  console.log(`\n${colors.cyan}Test 6: Automatic Role Assignment${colors.reset}`);

  const testEmail = `test-auto-role-${Date.now()}@example.com`;
  const response = await makeRequest('/api/auth/complete-google-registration', 'POST', {
    googleData: {
      email: testEmail,
      googleId: `google-auto-${Date.now()}`,
      photoURL: ''
    },
    userData: {
      name: 'Test',
      surname: 'User',
      role: 'instructor', // Even if user sends different role, it should be forced to "student"
      password: 'TestPass123!'
    }
  });

  const passed = response.status === 201 && 
                 response.data.success === true &&
                 response.data.user?.role === 'student';

  logTest(
    'Role should be automatically set to "student"',
    passed,
    passed ? 'Role correctly forced to student' : `Status: ${response.status}, Role: ${response.data.user?.role}`
  );

  // Cleanup
  if (passed) {
    try {
      await User.deleteOne({ email: testEmail });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Test 7: Invalid email format should be rejected
 */
async function testInvalidEmail() {
  console.log(`\n${colors.cyan}Test 7: Invalid Email Format${colors.reset}`);

  const response = await makeRequest('/api/auth/google-signin', 'POST', {
    firebaseUser: {
      uid: 'google-789',
      email: 'invalid-email', // Invalid format
      displayName: 'Test User',
      photoURL: ''
    }
  });

  const passed = response.status === 400 && response.data.success === false;

  logTest(
    'Invalid email format should be rejected',
    passed,
    passed ? 'Invalid email correctly rejected' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`
  );
}

/**
 * Test 8: Missing Google data should be rejected
 */
async function testMissingGoogleData() {
  console.log(`\n${colors.cyan}Test 8: Missing Google Authentication Data${colors.reset}`);

  const testCases = [
    {
      name: 'Missing firebaseUser object',
      data: {}
    },
    {
      name: 'Missing uid',
      data: {
        firebaseUser: {
          email: 'test@example.com',
          displayName: 'Test User'
        }
      }
    },
    {
      name: 'Missing email',
      data: {
        firebaseUser: {
          uid: 'google-123',
          displayName: 'Test User'
        }
      }
    }
  ];

  for (const testCase of testCases) {
    const response = await makeRequest('/api/auth/google-signin', 'POST', testCase.data);
    const passed = response.status === 400 && response.data.success === false;
    logTest(
      testCase.name,
      passed,
      passed ? 'Missing data correctly rejected' : `Status: ${response.status}`
    );
    await delay(500); // Small delay between test cases
  }
}

/**
 * Test 9: Session data structure validation
 */
async function testSessionDataStructure() {
  console.log(`\n${colors.cyan}Test 9: Session Data Structure${colors.reset}`);

  const newUserEmail = `test-session-${Date.now()}@example.com`;
  const response = await makeRequest('/api/auth/google-signin', 'POST', {
    firebaseUser: {
      uid: `google-session-${Date.now()}`,
      email: newUserEmail,
      displayName: 'Session Test User',
      photoURL: 'https://example.com/session-photo.jpg'
    }
  });

  const tempData = response.data.tempData;
  const hasRequiredFields = tempData &&
                           tempData.email &&
                           tempData.googleId &&
                           typeof tempData.photoURL !== 'undefined' &&
                           typeof tempData.displayName !== 'undefined';

  logTest(
    'Session data should contain all required fields',
    hasRequiredFields,
    hasRequiredFields ? 'All fields present' : `Missing fields in: ${JSON.stringify(tempData)}`
  );

  // Cleanup
  try {
    await User.deleteOne({ email: newUserEmail });
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Test 10: Name field length validation
 */
async function testNameLengthValidation() {
  console.log(`\n${colors.cyan}Test 10: Name Length Validation${colors.reset}`);

  const testCases = [
    {
      name: 'First name too short (1 char)',
      data: {
        googleData: {
          email: 'test-length@example.com',
          googleId: 'google-length-1',
          photoURL: ''
        },
        userData: {
          name: 'A',
          surname: 'User',
          role: 'student',
          password: 'TestPass123!'
        }
      },
      shouldFail: true
    },
    {
      name: 'First name too long (51 chars)',
      data: {
        googleData: {
          email: 'test-length@example.com',
          googleId: 'google-length-2',
          photoURL: ''
        },
        userData: {
          name: 'A'.repeat(51),
          surname: 'User',
          role: 'student',
          password: 'TestPass123!'
        }
      },
      shouldFail: true
    },
    {
      name: 'Valid name length',
      data: {
        googleData: {
          email: `test-valid-length-${Date.now()}@example.com`,
          googleId: `google-length-${Date.now()}`,
          photoURL: ''
        },
        userData: {
          name: 'ValidName',
          surname: 'ValidSurname',
          role: 'student',
          password: 'ValidPass123!'
        }
      },
      shouldFail: false
    }
  ];

  for (const testCase of testCases) {
    const response = await makeRequest('/api/auth/complete-google-registration', 'POST', testCase.data);
    const passed = testCase.shouldFail 
      ? (response.status === 400 && response.data.success === false)
      : (response.status === 201 && response.data.success === true);
    
    logTest(
      testCase.name,
      passed,
      passed ? 'Validation correct' : `Status: ${response.status}`
    );

    // Cleanup if user was created
    if (!testCase.shouldFail && passed) {
      try {
        await User.deleteOne({ email: testCase.data.googleData.email });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    await delay(500); // Small delay between test cases
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}🧪 Google OAuth Registration Flow Integration Tests${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.yellow}ℹ️  Tests include delays to avoid rate limiting${colors.reset}`);

  // Check if server is running
  console.log(`${colors.yellow}⏳ Checking if Next.js server is running...${colors.reset}`);
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log(`${colors.red}❌ Next.js server is not running on ${TEST_CONFIG.baseUrl}${colors.reset}`);
    console.log(`${colors.yellow}   Please start the server with: npm run dev${colors.reset}\n`);
    process.exit(1);
  }
  console.log(`${colors.green}✓ Server is running${colors.reset}\n`);

  // Connect to database
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.log(`${colors.red}❌ Cannot proceed without database connection${colors.reset}`);
    process.exit(1);
  }

  // Setup: Clean up any existing test data
  await cleanupTestData();

  // Setup: Create existing user for testing
  await createExistingUser();

  try {
    // Run tests in sequence with delays to avoid rate limiting
    const tempData = await testNewUserDetection();
    await delay(1000); // Wait 1 second
    
    if (tempData) {
      await testCompleteRegistration(tempData);
      await delay(1000);
      await testDuplicateEmail(tempData);
      await delay(1000);
    }

    await testExistingUserLogin();
    await delay(1000);
    
    await testMissingFields();
    await delay(2000); // Longer delay after multiple requests
    
    await testAutoRoleAssignment();
    await delay(1000);
    
    await testInvalidEmail();
    await delay(1000);
    
    await testMissingGoogleData();
    await delay(2000); // Longer delay after multiple requests
    
    await testSessionDataStructure();
    await delay(1000);
    
    await testNameLengthValidation();

  } catch (error) {
    console.error(`\n${colors.red}❌ Test execution error:${colors.reset}`, error.message);
  }

  // Cleanup
  await cleanupTestData();

  // Print summary
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}📊 Test Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);

  if (testResults.failed === 0) {
    console.log(`\n${colors.green}✅ All tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ Some tests failed. Please review the output above.${colors.reset}`);
  }

  // Close database connection
  await mongoose.connection.close();
  console.log(`\n${colors.blue}📦 Disconnected from MongoDB${colors.reset}`);

  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}❌ Fatal error:${colors.reset}`, error);
  process.exit(1);
});
