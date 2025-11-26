/**
 * Test ML Service Connection
 * Run this to verify ML service is accessible
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

async function testMLConnection() {
  console.log('🔍 Testing ML Service Connection...\n');
  console.log('Configuration:');
  console.log(`  URL: ${ML_SERVICE_URL}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Has ML_SERVICE_URL env var: ${!!process.env.ML_SERVICE_URL}\n`);

  // Test 1: Health Check
  console.log('Test 1: Health Check');
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check passed');
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Health check failed with status: ${response.status}`);
      const text = await response.text();
      console.log('   Response:', text);
    }
  } catch (error) {
    console.log('❌ Health check failed');
    console.log('   Error:', error.message);
    if (error.cause) {
      console.log('   Cause:', error.cause);
    }
  }

  console.log('\n');

  // Test 2: Root Endpoint
  console.log('Test 2: Root Endpoint');
  try {
    const response = await fetch(`${ML_SERVICE_URL}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Root endpoint accessible');
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Root endpoint failed with status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Root endpoint failed');
    console.log('   Error:', error.message);
  }

  console.log('\n');

  // Test 3: Sample Prediction
  console.log('Test 3: Sample Prediction');
  const sampleFeatures = {
    activeModeRatio: 0.3,
    questionsGenerated: 10,
    debatesParticipated: 5,
    reflectiveModeRatio: 0.2,
    reflectionsWritten: 8,
    journalEntries: 3,
    aiAskModeRatio: 0.15,
    aiResearchModeRatio: 0.1,
    sensingModeRatio: 0.25,
    simulationsCompleted: 7,
    challengesCompleted: 4,
    intuitiveModeRatio: 0.2,
    conceptsExplored: 12,
    patternsDiscovered: 6,
    aiTextToDocsRatio: 0.05,
    visualModeRatio: 0.35,
    diagramsViewed: 15,
    wireframesExplored: 8,
    verbalModeRatio: 0.15,
    textRead: 20,
    summariesCreated: 5,
    sequentialModeRatio: 0.25,
    stepsCompleted: 18,
    linearNavigation: 12,
    globalModeRatio: 0.2,
    overviewsViewed: 10,
    navigationJumps: 7
  };

  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: sampleFeatures })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Prediction successful');
      console.log('   Predictions:', JSON.stringify(data.predictions, null, 2));
      console.log('   Confidence:', JSON.stringify(data.confidence, null, 2));
    } else {
      console.log(`❌ Prediction failed with status: ${response.status}`);
      const text = await response.text();
      console.log('   Response:', text);
    }
  } catch (error) {
    console.log('❌ Prediction failed');
    console.log('   Error:', error.message);
  }

  console.log('\n✅ Test complete!');
}

// Run tests
testMLConnection().catch(console.error);
