/**
 * Drop Old Indexes Script
 * 
 * This script drops the unique index on the old 'email' field
 * so we can safely remove it from all documents.
 * 
 * Run with: node scripts/drop-old-indexes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

async function dropOldIndexes() {
  try {
    console.log('🚀 Starting Index Cleanup...\n');

    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List all indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    console.log('');

    // Drop old email index if it exists
    const emailIndexExists = indexes.some(idx => idx.key.email === 1);
    
    if (emailIndexExists) {
      console.log('🔄 Dropping old "email_1" index...');
      await collection.dropIndex('email_1');
      console.log('✅ Dropped email_1 index\n');
    } else {
      console.log('ℹ️  No email_1 index found (already dropped)\n');
    }

    // List indexes after cleanup
    console.log('📋 Remaining indexes:');
    const remainingIndexes = await collection.indexes();
    remainingIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Index cleanup complete!');
    console.log('\n📝 Next step: Run cleanup-old-fields-auto.js to remove old fields');

  } catch (error) {
    console.error('\n❌ Index cleanup failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run cleanup
dropOldIndexes();
