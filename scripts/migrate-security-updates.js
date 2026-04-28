/**
 * Migration Script: Hash OTPs, Reset Tokens, IPs and Encrypt Emails
 * 
 * This script migrates existing user data to use:
 * 1. Hashed OTPs instead of plain text
 * 2. Hashed reset tokens instead of plain text
 * 3. Encrypted emails with searchable hash
 * 4. Hashed IP addresses
 * 
 * Run with: node scripts/migrate-security-updates.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { 
  hashOTP, 
  hashToken, 
  hashIP, 
  encryptEmail, 
  hashEmailForSearch 
} from '../src/utils/secureOTP.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Check required environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET not found in .env');
  process.exit(1);
}

if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ ENCRYPTION_KEY not found in .env');
  console.log('\n📝 Generate one with:');
  console.log('node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.log('\nThen add to .env:');
  console.log('ENCRYPTION_KEY=<generated_key>');
  process.exit(1);
}

// Define User schema (old structure)
const userSchema = new mongoose.Schema({
  name: String,
  middleName: String,
  surname: String,
  suffix: String,
  
  // Old fields (to be migrated)
  email: String,
  otp: String,
  otpExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLoginIP: String,
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: Date,
    success: Boolean
  }],
  
  // New fields (migration targets)
  emailHash: String,
  emailEncrypted: String,
  otpHash: String,
  resetPasswordTokenHash: String,
  lastLoginIPHash: String,
  
  // Other fields
  password: String,
  googleId: String,
  photoURL: String,
  profilePicture: String,
  authProvider: String,
  role: String,
  isVerified: Boolean,
  failedLoginAttempts: Number,
  accountLockedUntil: Date,
  lastLoginAt: Date,
  passwordChangedAt: Date,
}, { timestamps: true, strict: false });

const User = mongoose.model('User', userSchema);

async function migrateUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to migrate\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        let updated = false;
        const updates = {};

        // 1. Migrate Email
        if (user.email && !user.emailEncrypted) {
          console.log(`📧 Migrating email for user: ${user.email}`);
          updates.emailEncrypted = encryptEmail(user.email);
          updates.emailHash = hashEmailForSearch(user.email);
          // Keep old email field for now (remove in next migration)
          updated = true;
        }

        // 2. Migrate OTP (if exists and not expired)
        if (user.otp && !user.otpHash) {
          console.log(`🔐 Migrating OTP for user: ${user.email || user._id}`);
          updates.otpHash = hashOTP(user.otp);
          updates.$unset = { otp: 1 }; // Remove plain OTP
          updated = true;
        }

        // 3. Migrate Reset Token (if exists and not expired)
        if (user.resetPasswordToken && !user.resetPasswordTokenHash) {
          console.log(`🔑 Migrating reset token for user: ${user.email || user._id}`);
          updates.resetPasswordTokenHash = hashToken(user.resetPasswordToken);
          if (!updates.$unset) updates.$unset = {};
          updates.$unset.resetPasswordToken = 1; // Remove plain token
          updated = true;
        }

        // 4. Migrate Last Login IP
        if (user.lastLoginIP && !user.lastLoginIPHash) {
          console.log(`🌐 Migrating last login IP for user: ${user.email || user._id}`);
          updates.lastLoginIPHash = hashIP(user.lastLoginIP);
          if (!updates.$unset) updates.$unset = {};
          updates.$unset.lastLoginIP = 1; // Remove plain IP
          updated = true;
        }

        // 5. Migrate Login History IPs
        if (user.loginHistory && user.loginHistory.length > 0) {
          const needsMigration = user.loginHistory.some(entry => entry.ip && !entry.ipHash);
          
          if (needsMigration) {
            console.log(`📜 Migrating login history for user: ${user.email || user._id}`);
            updates.loginHistory = user.loginHistory.map(entry => ({
              ipHash: entry.ip ? hashIP(entry.ip) : entry.ipHash,
              userAgent: entry.userAgent,
              timestamp: entry.timestamp,
              success: entry.success
            }));
            updated = true;
          }
        }

        // Apply updates
        if (updated) {
          await User.updateOne({ _id: user._id }, updates);
          migratedCount++;
          console.log(`✅ Migrated user: ${user.email || user._id}\n`);
        } else {
          skippedCount++;
          console.log(`⏭️  Skipped user (already migrated): ${user.email || user._id}\n`);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating user ${user.email || user._id}:`, error.message);
        console.error(error.stack);
        console.log('');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`⏭️  Skipped (already migrated): ${skippedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📝 Next Steps:');
      console.log('1. Test login functionality');
      console.log('2. Test OTP verification');
      console.log('3. Test password reset');
      console.log('4. Once confirmed working, remove old fields from schema');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run migration
console.log('🚀 Starting Security Migration...\n');
migrateUsers();
