// Test script to verify account lockout functionality
// Run this with: node test-lockout.js

const testEmail = 'test@example.com';
const wrongPassword = 'wrongpassword';

async function testLockout() {
  console.log('🧪 Testing Account Lockout Mechanism\n');
  console.log(`Testing with email: ${testEmail}`);
  console.log(`Making 5 failed login attempts...\n`);

  for (let i = 1; i <= 6; i++) {
    console.log(`Attempt ${i}:`);
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: wrongPassword,
        }),
      });

      const data = await response.json();
      
      console.log(`  Status: ${response.status}`);
      console.log(`  Message: ${data.message}`);
      
      if (response.status === 423) {
        console.log(`  🔒 LOCKED!`);
        console.log(`  Locked Until: ${data.lockedUntil}`);
        console.log(`  Remaining Time: ${data.remainingTime} seconds`);
        console.log(`\n✅ Lockout triggered successfully!`);
        console.log(`\nNow go to http://localhost:3000/admin/login`);
        console.log(`Enter email: ${testEmail}`);
        console.log(`Enter any password and click Sign In`);
        console.log(`You should see the countdown timer!\n`);
        break;
      }
      
      console.log('');
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      console.log('');
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

testLockout();
