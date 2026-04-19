/**
 * Script to call the fix-urls API endpoint
 */

const API_URL = 'https://assistive-learning-platform-ce54.onrender.com/api/admin/fix-urls';

async function callFixUrls() {
  try {
    console.log('🔧 Calling fix-urls API...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ API Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error calling fix-urls API:', error);
  }
}

callFixUrls();