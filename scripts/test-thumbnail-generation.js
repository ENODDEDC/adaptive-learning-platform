/**
 * Test Thumbnail Generation
 * This script tests the thumbnail generation for a specific file
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testThumbnailGeneration(contentId, fileKey) {
  console.log('🧪 Testing thumbnail generation...');
  console.log('📋 Content ID:', contentId);
  console.log('🔑 File Key:', fileKey);
  console.log('🌐 Base URL:', baseUrl);
  
  try {
    const response = await fetch(`${baseUrl}/api/pdf-thumbnail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId,
        fileKey
      })
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Thumbnail generated successfully!');
      console.log('📋 Result:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ Thumbnail generation failed:');
      console.error('Status:', response.status);
      console.error('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Get arguments from command line
const contentId = process.argv[2];
const fileKey = process.argv[3];

if (!contentId || !fileKey) {
  console.error('❌ Usage: node scripts/test-thumbnail-generation.js <contentId> <fileKey>');
  console.error('Example: node scripts/test-thumbnail-generation.js 674601234567890abcdef123 "classwork/1732627186285_test.pdf"');
  process.exit(1);
}

testThumbnailGeneration(contentId, fileKey);
