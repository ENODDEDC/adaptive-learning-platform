/**
 * Test New Upload to Verify Backblaze Integration
 * This script helps you verify that new uploads are going to Backblaze B2
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

console.log('📋 Upload Test Instructions');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('1. Start your development server: npm run dev');
console.log('2. Go to your app and upload a NEW PDF file');
console.log('3. After upload, run this command:');
console.log('   node scripts/check-uploaded-file.js <filename>');
console.log('');
console.log('4. Check the output for:');
console.log('   ☁️ Cloud Storage:');
console.log('     Provider: backblaze-b2  ✅ (should be this)');
console.log('     Provider: local         ❌ (old files)');
console.log('');
console.log('5. If Provider is "local", your upload is NOT using Backblaze');
console.log('   Check your .env.local file for B2 credentials');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Environment Check:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const requiredVars = [
  'B2_KEY_ID',
  'B2_APPLICATION_KEY',
  'B2_BUCKET_NAME',
  'B2_ENDPOINT'
];

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('KEY') ? '[HIDDEN]' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allPresent = false;
  }
});

console.log('');

if (allPresent) {
  console.log('✅ All Backblaze B2 environment variables are set!');
  console.log('   New uploads should use Backblaze B2.');
} else {
  console.log('❌ Some Backblaze B2 environment variables are missing!');
  console.log('   Uploads will fail or use local storage.');
  console.log('');
  console.log('💡 Add missing variables to your .env.local file');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
