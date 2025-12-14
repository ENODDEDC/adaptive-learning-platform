const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testGoogleAPI() {
  console.log('\n🔍 Testing Google Gemini API Key...\n');

  // Check if API key exists
  if (!process.env.GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log(`✓ API Key found: ${process.env.GOOGLE_API_KEY.substring(0, 10)}...`);
  console.log('\n📡 Testing common model names...\n');

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

  const modelsToTest = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-exp',
    'gemini-exp-1206'
  ];

  let workingModel = null;

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent('Say hello in one word.');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName}: Working! Response: "${text.trim()}"`);
      
      if (!workingModel) {
        workingModel = modelName;
      }
    } catch (error) {
      console.log(`❌ ${modelName}: Failed - ${error.message.substring(0, 80)}...`);
    }
    console.log('');
  }

  if (workingModel) {
    console.log(`\n✨ Recommended model to use: "${workingModel}"\n`);
    console.log('Update your src/app/api/ask/route.js to use this model.\n');
  } else {
    console.log('\n❌ No working models found!');
    console.log('\nTroubleshooting:');
    console.log('1. Check if your API key is valid at: https://aistudio.google.com/app/apikey');
    console.log('2. Make sure the Generative Language API is enabled');
    console.log('3. Try generating a new API key\n');
  }
}

testGoogleAPI().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
