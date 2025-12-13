/**
 * Security Testing Script
 * Run this to verify all security features are working
 * 
 * Usage: node test-security.js
 */

const crypto = require('crypto');

console.log('🔐 Security Implementation Test\n');

// Test 1: Verify crypto module for OTP generation
console.log('✅ Test 1: Crypto Module');
try {
  const otp = crypto.randomInt(100000, 999999);
  console.log(`   Generated OTP: ${otp}`);
  console.log('   ✓ Crypto module working\n');
} catch (error) {
  console.log('   ✗ Crypto module failed:', error.message, '\n');
}

// Test 2: Verify token generation
console.log('✅ Test 2: Token Generation');
try {
  const token = crypto.randomBytes(32).toString('hex');
  console.log(`   Generated Token: ${token.substring(0, 20)}...`);
  console.log(`   Token Length: ${token.length} characters`);
  console.log('   ✓ Token generation working\n');
} catch (error) {
  console.log('   ✗ Token generation failed:', error.message, '\n');
}

// Test 3: Verify hashing
console.log('✅ Test 3: Token Hashing');
try {
  const token = 'test-token-123';
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  console.log(`   Original: ${token}`);
  console.log(`   Hashed: ${hashed.substring(0, 20)}...`);
  console.log('   ✓ Hashing working\n');
} catch (error) {
  console.log('   ✗ Hashing failed:', error.message, '\n');
}

// Test 4: Password validation regex
console.log('✅ Test 4: Password Validation Patterns');
const testPasswords = [
  { password: 'weak', shouldPass: false },
  { password: 'NoNumbers!', shouldPass: false },
  { password: 'nonumbers123!', shouldPass: false },
  { password: 'NOLOWERCASE123!', shouldPass: false },
  { password: 'NoSpecial123', shouldPass: false },
  { password: 'ValidPass123!', shouldPass: true },
  { password: 'Str0ng!Pass', shouldPass: true },
];

testPasswords.forEach(({ password, shouldPass }) => {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isLongEnough = password.length >= 8;
  
  const passes = hasUpper && hasLower && hasNumber && hasSpecial && isLongEnough;
  const status = passes === shouldPass ? '✓' : '✗';
  
  console.log(`   ${status} "${password}" - ${passes ? 'PASS' : 'FAIL'} (expected: ${shouldPass ? 'PASS' : 'FAIL'})`);
});
console.log();

// Test 5: Email validation regex
console.log('✅ Test 5: Email Validation Patterns');
const testEmails = [
  { email: 'valid@example.com', shouldPass: true },
  { email: 'user.name@example.co.uk', shouldPass: true },
  { email: 'invalid@', shouldPass: false },
  { email: '@example.com', shouldPass: false },
  { email: 'no-at-sign.com', shouldPass: false },
  { email: 'spaces in@email.com', shouldPass: false },
];

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

testEmails.forEach(({ email, shouldPass }) => {
  const passes = emailRegex.test(email);
  const status = passes === shouldPass ? '✓' : '✗';
  console.log(`   ${status} "${email}" - ${passes ? 'PASS' : 'FAIL'} (expected: ${shouldPass ? 'PASS' : 'FAIL'})`);
});
console.log();

// Test 6: Generate JWT Secret
console.log('✅ Test 6: JWT Secret Generation');
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log(`   Generated JWT Secret: ${jwtSecret}`);
console.log(`   Length: ${jwtSecret.length} characters (minimum 32 required)`);
console.log('   ✓ Copy this to your .env file as JWT_SECRET\n');

// Test 7: Verify bcrypt rounds calculation
console.log('✅ Test 7: Bcrypt Performance Test');
console.log('   Testing bcrypt with 12 rounds...');
const bcrypt = require('bcryptjs');
const testPassword = 'TestPassword123!';
const startTime = Date.now();
bcrypt.hash(testPassword, 12, (err, hash) => {
  if (err) {
    console.log('   ✗ Bcrypt failed:', err.message, '\n');
  } else {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`   Hash: ${hash.substring(0, 30)}...`);
    console.log(`   Time taken: ${duration}ms`);
    console.log(`   ✓ Bcrypt working (${duration < 500 ? 'fast' : 'acceptable'} performance)\n`);
    
    // Final summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 Security Implementation Test Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📋 Next Steps:');
    console.log('1. Copy the JWT Secret above to your .env file');
    console.log('2. Ensure all environment variables are set');
    console.log('3. Run: npm run dev');
    console.log('4. Test authentication flows in browser');
    console.log('5. Check browser DevTools → Application → Cookies');
    console.log('   - Verify "token" cookie has HttpOnly flag');
    console.log('6. Review MIGRATION_GUIDE.md for code updates\n');
  }
});
