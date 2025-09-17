#!/usr/bin/env node

/**
 * Simple test script to verify Gemini API connectivity
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';

// Load environment variables
try {
  const envContent = readFileSync('.env.local', 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      envVars[key.trim()] = values.join('=').replace(/["']/g, '').trim();
    }
  });
  Object.assign(process.env, envVars);
} catch (error) {
  console.error('Could not load .env.local:', error.message);
}

async function testGeminiConnection() {
  console.log('🧪 Testing Gemini API Connection...');
  console.log('🔑 API Key Available:', !!process.env.GOOGLE_API_KEY);
  
  if (!process.env.GOOGLE_API_KEY) {
    console.error('❌ No GOOGLE_API_KEY found in environment');
    process.exit(1);
  }
  
  console.log('🔑 API Key prefix:', process.env.GOOGLE_API_KEY.substring(0, 8) + '...');
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('🚀 Sending test request to Gemini AI (gemini-1.5-flash)...');
    
    // Test text-only request first
    const textResult = await model.generateContent('Hello! Please respond with a simple JSON object like {"status": "working", "message": "API is functional"}');
    
    const textResponse = await textResult.response;
    const textContent = textResponse.text();
    
    console.log('✅ Text-only request successful:');
    console.log('📄 Response length:', textContent.length, 'characters');
    console.log('📝 Response text:', textContent);
    
    // Try to parse JSON
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('🎯 Parsed JSON:', parsed);
        console.log('✅ Text API is working correctly!');
      } else {
        console.log('⚠️ Response received but no JSON found');
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse JSON, but API responded');
    }
    
    console.log('\n🖼️ Testing image analysis format...');
    
    // Create a simple test image (base64 encoded 1x1 pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGABUH5TwAAAABJRU5ErkJggg==';
    
    const imageResult = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/png',
          data: testImageBase64
        }
      },
      'Describe this image and respond with JSON: {"imageType": "test", "status": "image_analysis_working"}'
    ]);
    
    const imageResponse = await imageResult.response;
    const imageContent = imageResponse.text();
    
    console.log('✅ Image analysis request successful:');
    console.log('📄 Response length:', imageContent.length, 'characters');
    console.log('📝 Response text:', imageContent);
    
    console.log('✅ Both text and image analysis are working correctly!');
    
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    console.error('🔍 Error details:', error);
    process.exit(1);
  }
}

testGeminiConnection().catch(console.error);