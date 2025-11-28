// Script to fix double slashes in profile picture URLs
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  profilePicture: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function fixProfilePictureUrls() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users with profile pictures
    const users = await User.find({ profilePicture: { $exists: true, $ne: null, $ne: '' } });
    console.log(`📊 Found ${users.length} users with profile pictures`);

    let fixedCount = 0;

    for (const user of users) {
      const oldUrl = user.profilePicture;
      
      // Check if URL has double slashes
      if (oldUrl.includes('//api/files')) {
        // Fix the double slash
        const newUrl = oldUrl.replace('//api/files', '/api/files');
        
        console.log(`\n🔧 Fixing user: ${user.email}`);
        console.log(`   Old URL: ${oldUrl}`);
        console.log(`   New URL: ${newUrl}`);
        
        user.profilePicture = newUrl;
        await user.save();
        fixedCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} profile picture URLs`);
    console.log(`✅ ${users.length - fixedCount} URLs were already correct`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the script
fixProfilePictureUrls();
