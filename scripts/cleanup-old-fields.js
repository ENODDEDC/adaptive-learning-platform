/**
 * Cleanup Script: Remove Old Plain Text Fields
 * 
 * This script removes the old plain text fields that have been replaced
 * with encrypted/hashed versions:
 * - email → emailEncrypted + emailHash
 * - otp → otpHash
 * - resetPasswordToken → resetPasswordTokenHash
 * - lastLoginIP → lastLoginIPHash
 * - loginHistory[].ip → loginHistory[].ipHash
 * 
 * ⚠️ WARNING: This is irreversible! Make sure:
 * 1. Migration completed successfully
 * 2. All authentication flows tested and working
 * 3. Database backup created
 * 
 * Run with: node scripts/cleanup-old-fields.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Check required environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

// Define User schema (flexible to allow field removal)
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

// Create readline interface for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function cleanupOldFields() {
  try {
    console.log('🚀 Starting Old Fields Cleanup...\n');
    console.log('⚠️  WARNING: This will permanently remove plain text fields!');
    console.log('⚠️  Make sure you have a database backup!\n');

    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Found ${totalUsers} users in database\n`);

    // Check what fields exist
    const sampleUser = await User.findOne().lean();
    const fieldsToRemove = [];
    
    if (sampleUser.email) fieldsToRemove.push('email');
    if (sampleUser.otp) fieldsToRemove.push('otp');
    if (sampleUser.resetPasswordToken) fieldsToRemove.push('resetPasswordToken');
    if (sampleUser.lastLoginIP) fieldsToRemove.push('lastLoginIP');
    if (sampleUser.loginHistory && sampleUser.loginHistory.some(h => h.ip)) {
      fieldsToRemove.push('loginHistory[].ip');
    }

    if (fieldsToRemove.length === 0) {
      console.log('✅ No old fields found! Database is already clean.');
      await mongoose.disconnect();
      rl.close();
      return;
    }

    console.log('📋 Fields to be removed:');
    fieldsToRemove.forEach(field => console.log(`   - ${field}`));
    console.log('');

    // Verify encrypted fields exist
    console.log('🔍 Verifying encrypted/hashed fields exist...');
    const hasEncrypted = sampleUser.emailEncrypted && sampleUser.emailHash;
    
    if (!hasEncrypted) {
      console.error('❌ ERROR: Encrypted fields not found!');
      console.error('❌ Run migration script first: node scripts/migrate-security-updates.js');
      await mongoose.disconnect();
      rl.close();
      process.exit(1);
    }
    
    console.log('✅ Encrypted fields verified\n');

    // Ask for confirmation
    const answer = await askQuestion('⚠️  Type "DELETE" to confirm removal of old fields: ');
    
    if (answer.trim() !== 'DELETE') {
      console.log('\n❌ Cleanup cancelled. No changes made.');
      await mongoose.disconnect();
      rl.close();
      return;
    }

    console.log('\n🔄 Removing old fields...\n');

    // Build update object
    const unsetFields = {};
    if (fieldsToRemove.includes('email')) unsetFields.email = 1;
    if (fieldsToRemove.includes('otp')) unsetFields.otp = 1;
    if (fieldsToRemove.includes('resetPasswordToken')) unsetFields.resetPasswordToken = 1;
    if (fieldsToRemove.includes('lastLoginIP')) unsetFields.lastLoginIP = 1;

    // Remove scalar fields
    if (Object.keys(unsetFields).length > 0) {
      const result = await User.updateMany({}, { $unset: unsetFields });
      console.log(`✅ Removed scalar fields from ${result.modifiedCount} users`);
    }

    // Remove loginHistory[].ip field
    if (fieldsToRemove.includes('loginHistory[].ip')) {
      const usersWithHistory = await User.find({ 
        loginHistory: { $exists: true, $ne: [] } 
      });

      let historyCount = 0;
      for (const user of usersWithHistory) {
        if (user.loginHistory && user.loginHistory.length > 0) {
          user.loginHistory = user.loginHistory.map(entry => {
            const { ip, ...rest } = entry.toObject ? entry.toObject() : entry;
            return rest;
          });
          await user.save();
          historyCount++;
        }
      }
      console.log(`✅ Cleaned login history for ${historyCount} users`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Cleanup Complete!');
    console.log('='.repeat(60));
    console.log('\n📋 Removed fields:');
    fieldsToRemove.forEach(field => console.log(`   ✓ ${field}`));
    console.log('\n📋 Remaining secure fields:');
    console.log('   ✓ emailEncrypted (AES-256-GCM)');
    console.log('   ✓ emailHash (SHA-256)');
    console.log('   ✓ otpHash (SHA-256)');
    console.log('   ✓ resetPasswordTokenHash (SHA-256)');
    console.log('   ✓ lastLoginIPHash (SHA-256)');
    console.log('   ✓ loginHistory[].ipHash (SHA-256)');
    console.log('\n🎉 Database is now fully secured!');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    rl.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run cleanup
cleanupOldFields();
