// Script to check profile picture status
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

async function checkProfilePicture() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user by email
    const email = 'joedemarrosero.1724@gmail.com'; // Update this if needed
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found with email:', email);
      console.log('💡 Try checking with a different email\n');
      return;
    }

    console.log('👤 User found!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    console.log('🆔 ID:', user._id);
    console.log('');

    if (user.profilePicture) {
      console.log('✅ Profile picture EXISTS in database');
      console.log('🔗 URL:', user.profilePicture);
      console.log('');

      // Check URL format
      if (user.profilePicture.includes('//api/files')) {
        console.log('⚠️  WARNING: URL has double slashes!');
        console.log('🔧 Run: node scripts/fix-profile-picture-urls.js');
      } else {
        console.log('✅ URL format looks good');
      }

      // Check URL structure
      if (user.profilePicture.startsWith('http://localhost:3000/api/files/')) {
        console.log('✅ URL structure is correct');
      } else if (user.profilePicture.startsWith('https://')) {
        console.log('✅ URL is using HTTPS (production)');
      } else {
        console.log('⚠️  URL structure might be incorrect');
        console.log('Expected: http://localhost:3000/api/files/...');
      }
    } else {
      console.log('❌ Profile picture NOT found in database');
      console.log('💡 Upload a profile picture in Settings');
    }

    console.log('\n📊 Summary:');
    console.log('- User exists:', !!user);
    console.log('- Has profile picture:', !!user.profilePicture);
    console.log('- Profile picture URL:', user.profilePicture || 'N/A');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
checkProfilePicture();
