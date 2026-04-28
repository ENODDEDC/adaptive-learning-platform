/**
 * Practice Decryption Script
 * 
 * This interactive script helps you practice decrypting emails
 * from your database.
 * 
 * Run with: node scripts/practice-decrypt.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { decryptEmail, encryptEmail, hashEmailForSearch } from '../src/utils/secureOTP.js';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function practiceDecryption() {
  console.log('🎓 Email Decryption Practice\n');
  console.log('='.repeat(60));
  
  try {
    // Connect to database
    console.log('\n🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    while (true) {
      console.log('\n📋 What would you like to do?\n');
      console.log('1. View all users (with decrypted emails)');
      console.log('2. Decrypt a specific user by ID');
      console.log('3. Search user by email and decrypt');
      console.log('4. Practice encrypt/decrypt cycle');
      console.log('5. Exit\n');
      
      const choice = await ask('Enter your choice (1-5): ');
      
      switch (choice.trim()) {
        case '1':
          await viewAllUsers(User);
          break;
        case '2':
          await decryptByUserId(User);
          break;
        case '3':
          await searchAndDecrypt(User);
          break;
        case '4':
          await practiceEncryptDecrypt();
          break;
        case '5':
          console.log('\n👋 Goodbye!');
          await mongoose.disconnect();
          rl.close();
          return;
        default:
          console.log('\n❌ Invalid choice. Please enter 1-5.');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    rl.close();
  }
}

async function viewAllUsers(User) {
  console.log('\n📋 Fetching users...\n');
  
  const limit = parseInt(await ask('How many users to display? (default: 10): ') || '10');
  const users = await User.find().limit(limit);
  
  console.log('\n' + '='.repeat(100));
  console.log('ID'.padEnd(26), 'Name'.padEnd(20), 'Email'.padEnd(35), 'Role');
  console.log('='.repeat(100));
  
  users.forEach(user => {
    try {
      const email = decryptEmail(user.emailEncrypted);
      console.log(
        user._id.toString().padEnd(26),
        (user.name || 'N/A').padEnd(20),
        email.padEnd(35),
        user.role || 'student'
      );
    } catch (error) {
      console.log(
        user._id.toString().padEnd(26),
        (user.name || 'N/A').padEnd(20),
        '❌ Decryption failed'.padEnd(35),
        user.role || 'student'
      );
    }
  });
  
  console.log('='.repeat(100));
  console.log(`\n✅ Displayed ${users.length} users`);
}

async function decryptByUserId(User) {
  console.log('\n🔍 Decrypt User by ID\n');
  
  const userId = await ask('Enter user ID: ');
  
  try {
    const user = await User.findById(userId.trim());
    
    if (!user) {
      console.log('\n❌ User not found');
      return;
    }
    
    console.log('\n📦 User Data (Encrypted):');
    console.log('─'.repeat(60));
    console.log('ID:', user._id);
    console.log('Name:', user.name);
    console.log('emailEncrypted:', user.emailEncrypted);
    console.log('emailHash:', user.emailHash);
    console.log('Role:', user.role);
    
    console.log('\n🔓 Decrypting email...');
    const decryptedEmail = decryptEmail(user.emailEncrypted);
    
    console.log('\n✅ Decrypted Email:', decryptedEmail);
    console.log('\n💡 Explanation:');
    console.log('   - The encrypted email was stored as: IV:AuthTag:EncryptedData');
    console.log('   - Using AES-256-GCM with your ENCRYPTION_KEY');
    console.log('   - Decrypted back to plain text:', decryptedEmail);
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

async function searchAndDecrypt(User) {
  console.log('\n🔍 Search User by Email\n');
  
  const email = await ask('Enter email to search: ');
  
  try {
    console.log('\n1️⃣ Hashing email for search...');
    const emailHash = hashEmailForSearch(email.trim());
    console.log('   Email hash:', emailHash.substring(0, 20) + '...');
    
    console.log('\n2️⃣ Searching database...');
    const user = await User.findOne({ emailHash });
    
    if (!user) {
      console.log('\n❌ User not found with that email');
      return;
    }
    
    console.log('   ✅ User found!');
    
    console.log('\n3️⃣ Decrypting stored email...');
    const decryptedEmail = decryptEmail(user.emailEncrypted);
    
    console.log('\n📋 User Details:');
    console.log('─'.repeat(60));
    console.log('ID:', user._id);
    console.log('Name:', user.name);
    console.log('Email (decrypted):', decryptedEmail);
    console.log('Role:', user.role);
    console.log('Created:', user.createdAt);
    
    console.log('\n💡 How it works:');
    console.log('   1. Hash the search email → find user by emailHash');
    console.log('   2. Get user.emailEncrypted from database');
    console.log('   3. Decrypt using decryptEmail() → get plain text');
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

async function practiceEncryptDecrypt() {
  console.log('\n🎯 Practice Encrypt/Decrypt Cycle\n');
  
  const testEmail = await ask('Enter an email to practice with: ');
  
  try {
    console.log('\n1️⃣ Original email:', testEmail);
    
    console.log('\n2️⃣ Encrypting...');
    const encrypted = encryptEmail(testEmail.trim());
    console.log('   Encrypted:', encrypted);
    console.log('   Format: IV:AuthTag:EncryptedData');
    const parts = encrypted.split(':');
    console.log('   - IV (16 bytes):', parts[0]);
    console.log('   - AuthTag (16 bytes):', parts[1]);
    console.log('   - Encrypted data:', parts[2]);
    
    console.log('\n3️⃣ Decrypting...');
    const decrypted = decryptEmail(encrypted);
    console.log('   Decrypted:', decrypted);
    
    console.log('\n4️⃣ Verification:');
    if (testEmail.trim().toLowerCase() === decrypted) {
      console.log('   ✅ SUCCESS! Original matches decrypted');
    } else {
      console.log('   ❌ FAILED! Mismatch detected');
    }
    
    console.log('\n5️⃣ Creating search hash...');
    const hash = hashEmailForSearch(testEmail.trim());
    console.log('   Hash:', hash);
    console.log('   This hash is used to search users in database');
    
    console.log('\n💡 Key Points:');
    console.log('   - Each encryption produces different output (random IV)');
    console.log('   - But decryption always returns the same original email');
    console.log('   - Hash is deterministic (same email = same hash)');
    console.log('   - Use hash for searching, encrypted for storage');
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

// Run the practice script
practiceDecryption();
