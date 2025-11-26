/**
 * Check Uploaded File Status
 * This script checks the status of an uploaded file and its thumbnail
 */

import mongoose from 'mongoose';
import Content from '../src/models/Content.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

async function checkFile(searchTerm) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Search for the file by title, filename, or ID
    let query;
    if (mongoose.Types.ObjectId.isValid(searchTerm)) {
      query = { _id: searchTerm };
    } else {
      query = {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { originalName: { $regex: searchTerm, $options: 'i' } },
          { filename: { $regex: searchTerm, $options: 'i' } }
        ]
      };
    }
    
    console.log('🔍 Searching for files matching:', searchTerm);
    const files = await Content.find(query).sort({ createdAt: -1 }).limit(10);
    
    if (files.length === 0) {
      console.log('❌ No files found matching:', searchTerm);
      return;
    }
    
    console.log(`\n📁 Found ${files.length} file(s):\n`);
    
    files.forEach((file, index) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`File #${index + 1}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log('📋 ID:', file._id.toString());
      console.log('📝 Title:', file.title);
      console.log('📄 Original Name:', file.originalName);
      console.log('📦 File Name:', file.filename);
      console.log('🔗 File Path:', file.filePath);
      console.log('📊 MIME Type:', file.mimeType);
      console.log('📏 File Size:', (file.fileSize / 1024).toFixed(2), 'KB');
      console.log('📅 Uploaded:', file.createdAt);
      console.log('');
      console.log('☁️ Cloud Storage:');
      console.log('  Provider:', file.cloudStorage?.provider || 'N/A');
      console.log('  Key:', file.cloudStorage?.key || 'N/A');
      console.log('  URL:', file.cloudStorage?.url || 'N/A');
      console.log('  Bucket:', file.cloudStorage?.bucket || 'N/A');
      console.log('');
      console.log('🖼️ Thumbnail:');
      console.log('  URL:', file.thumbnailUrl || '❌ NOT GENERATED');
      console.log('  Key:', file.thumbnailKey || file.cloudStorage?.thumbnailKey || '❌ NOT SET');
      console.log('');
      
      if (!file.thumbnailUrl) {
        console.log('⚠️ THUMBNAIL MISSING - You can generate it with:');
        console.log(`   node scripts/test-thumbnail-generation.js ${file._id} "${file.cloudStorage?.key}"`);
      }
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Get search term from command line
const searchTerm = process.argv[2];

if (!searchTerm) {
  console.error('❌ Usage: node scripts/check-uploaded-file.js <search_term>');
  console.error('Examples:');
  console.error('  node scripts/check-uploaded-file.js test');
  console.error('  node scripts/check-uploaded-file.js 674601234567890abcdef123');
  process.exit(1);
}

checkFile(searchTerm);
