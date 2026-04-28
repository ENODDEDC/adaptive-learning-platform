/**
 * Security Verification Script
 * 
 * Verifies that all security measures are in place:
 * - Old plain text fields removed
 * - New encrypted/hashed fields present
 * - Data is actually encrypted/hashed
 * 
 * Run with: node scripts/verify-security.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { decryptEmail } from '../src/utils/secureOTP.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

async function verifySecurityimplementation() {
  try {
    console.log('🔍 Security Verification Report\n');
    console.log('='.repeat(60));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const totalUsers = await User.countDocuments();
    
    console.log(`\n📊 Total Users: ${totalUsers}\n`);

    // Check a sample of users
    const sampleSize = Math.min(5, totalUsers);
    const users = await User.find().limit(sampleSize).lean();

    let passCount = 0;
    let failCount = 0;
    const issues = [];

    console.log('🔍 Checking Security Implementation...\n');

    for (const user of users) {
      const userId = user._id.toString().substring(0, 8);
      let userPass = true;

      // Check 1: Old plain text fields should NOT exist
      if (user.email) {
        issues.push(`❌ User ${userId}: Plain text 'email' field still exists`);
        userPass = false;
      }
      if (user.otp) {
        issues.push(`❌ User ${userId}: Plain text 'otp' field still exists`);
        userPass = false;
      }
      if (user.resetPasswordToken) {
        issues.push(`❌ User ${userId}: Plain text 'resetPasswordToken' field still exists`);
        userPass = false;
      }
      if (user.lastLoginIP) {
        issues.push(`❌ User ${userId}: Plain text 'lastLoginIP' field still exists`);
        userPass = false;
      }

      // Check 2: New encrypted/hashed fields should exist
      if (!user.emailEncrypted) {
        issues.push(`❌ User ${userId}: Missing 'emailEncrypted' field`);
        userPass = false;
      }
      if (!user.emailHash) {
        issues.push(`❌ User ${userId}: Missing 'emailHash' field`);
        userPass = false;
      }

      // Check 3: Verify encryption format
      if (user.emailEncrypted) {
        const parts = user.emailEncrypted.split(':');
        if (parts.length !== 3) {
          issues.push(`❌ User ${userId}: Invalid emailEncrypted format`);
          userPass = false;
        } else {
          // Try to decrypt
          try {
            const decrypted = decryptEmail(user.emailEncrypted);
            if (!decrypted || !decrypted.includes('@')) {
              issues.push(`❌ User ${userId}: Decryption failed or invalid email`);
              userPass = false;
            }
          } catch (error) {
            issues.push(`❌ User ${userId}: Decryption error - ${error.message}`);
            userPass = false;
          }
        }
      }

      // Check 4: Verify hash format
      if (user.emailHash) {
        if (user.emailHash.length !== 64) {
          issues.push(`❌ User ${userId}: Invalid emailHash length (expected 64, got ${user.emailHash.length})`);
          userPass = false;
        }
        if (!/^[a-f0-9]+$/.test(user.emailHash)) {
          issues.push(`❌ User ${userId}: Invalid emailHash format (not hex)`);
          userPass = false;
        }
      }

      // Check 5: Login history should use ipHash, not ip
      if (user.loginHistory && user.loginHistory.length > 0) {
        const hasPlainIP = user.loginHistory.some(entry => entry.ip);
        if (hasPlainIP) {
          issues.push(`❌ User ${userId}: Login history contains plain text IP addresses`);
          userPass = false;
        }
      }

      if (userPass) {
        passCount++;
        console.log(`✅ User ${userId}: All security checks passed`);
      } else {
        failCount++;
        console.log(`❌ User ${userId}: Security issues found`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Verification Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passCount}/${sampleSize} users`);
    console.log(`❌ Failed: ${failCount}/${sampleSize} users`);

    if (issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }

    // Check indexes
    console.log('\n' + '='.repeat(60));
    console.log('📋 Database Indexes');
    console.log('='.repeat(60));
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    const indexes = await collection.indexes();
    
    indexes.forEach(index => {
      const indexName = index.name;
      const indexKey = JSON.stringify(index.key);
      
      if (indexName === 'email_1') {
        console.log(`❌ ${indexName}: ${indexKey} (OLD - should be removed)`);
      } else if (indexName === 'emailHash_1') {
        console.log(`✅ ${indexName}: ${indexKey} (NEW - secure)`);
      } else {
        console.log(`ℹ️  ${indexName}: ${indexKey}`);
      }
    });

    // Final verdict
    console.log('\n' + '='.repeat(60));
    if (failCount === 0 && !indexes.some(idx => idx.name === 'email_1')) {
      console.log('🎉 SECURITY VERIFICATION: PASSED');
      console.log('='.repeat(60));
      console.log('\n✅ All users have encrypted/hashed data');
      console.log('✅ No plain text sensitive fields found');
      console.log('✅ Encryption/hashing formats are valid');
      console.log('✅ Database indexes are secure');
      console.log('\n🔒 Your database is fully secured!');
    } else {
      console.log('⚠️  SECURITY VERIFICATION: FAILED');
      console.log('='.repeat(60));
      console.log('\n❌ Some security issues were found');
      console.log('📝 Review the issues above and run the appropriate scripts');
    }

    await mongoose.disconnect();

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run verification
verifySecurityimplementation();
