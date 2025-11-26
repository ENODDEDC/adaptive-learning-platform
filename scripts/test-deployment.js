/**
 * Test Deployment Script
 * Verifies that both production services are healthy and communicating
 */

const https = require('https');

// Configuration
const NEXT_APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://intelevo.onrender.com';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://intelevo-ml-service.onrender.com';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          data: data,
          duration: duration
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testMLService() {
  log('\n🤖 Testing ML Service...', 'cyan');
  log(`   URL: ${ML_SERVICE_URL}/health`, 'blue');
  
  try {
    const response = await makeRequest(`${ML_SERVICE_URL}/health`);
    
    if (response.statusCode === 200) {
      const health = JSON.parse(response.data);
      
      if (health.status === 'healthy' && health.models_loaded) {
        log(`   ✅ ML Service is healthy (${response.duration}ms)`, 'green');
        log(`   ✅ Models loaded successfully`, 'green');
        return true;
      } else {
        log(`   ❌ ML Service unhealthy: ${JSON.stringify(health)}`, 'red');
        return false;
      }
    } else {
      log(`   ❌ ML Service returned status ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ❌ ML Service error: ${error.message}`, 'red');
    log(`   💡 Tip: Service may be sleeping (free tier). Try visiting the URL in browser first.`, 'yellow');
    return false;
  }
}

async function testNextApp() {
  log('\n📱 Testing Next.js Application...', 'cyan');
  log(`   URL: ${NEXT_APP_URL}`, 'blue');
  
  try {
    const response = await makeRequest(NEXT_APP_URL);
    
    if (response.statusCode === 200) {
      log(`   ✅ Next.js app is accessible (${response.duration}ms)`, 'green');
      return true;
    } else {
      log(`   ❌ Next.js app returned status ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ❌ Next.js app error: ${error.message}`, 'red');
    log(`   💡 Tip: Service may be sleeping (free tier). Try visiting the URL in browser first.`, 'yellow');
    return false;
  }
}

async function testIntegration() {
  log('\n🔗 Testing Integration...', 'cyan');
  log(`   Checking if Next.js can reach ML Service...`, 'blue');
  
  // This is a simple check - in production, you'd test actual classification
  log(`   ℹ️  Manual test required: Visit ${NEXT_APP_URL}/test-classification`, 'yellow');
  log(`   ℹ️  Click "Classify My Learning Style" to verify end-to-end flow`, 'yellow');
  
  return true;
}

async function main() {
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('🚀 Deployment Health Check', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  const results = {
    mlService: false,
    nextApp: false,
    integration: false
  };
  
  // Test ML Service
  results.mlService = await testMLService();
  
  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test Next.js App
  results.nextApp = await testNextApp();
  
  // Test Integration
  results.integration = await testIntegration();
  
  // Summary
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('📊 Summary', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  const allPassed = results.mlService && results.nextApp;
  
  if (allPassed) {
    log('\n✅ All services are healthy!', 'green');
    log('✅ Your deployment is ready for the defense!', 'green');
    log('\n💡 Next steps:', 'cyan');
    log('   1. Visit the URLs in your browser to wake them up', 'blue');
    log('   2. Test classification at /test-classification', 'blue');
    log('   3. Try the questionnaire at /questionnaire', 'blue');
  } else {
    log('\n⚠️  Some services are not responding', 'yellow');
    log('\n💡 Troubleshooting:', 'cyan');
    
    if (!results.mlService) {
      log('   • ML Service: Visit the URL in browser to wake it up (free tier sleeps)', 'yellow');
      log(`     ${ML_SERVICE_URL}/health`, 'blue');
    }
    
    if (!results.nextApp) {
      log('   • Next.js App: Visit the URL in browser to wake it up', 'yellow');
      log(`     ${NEXT_APP_URL}`, 'blue');
    }
    
    log('\n   • Check Render dashboard for deployment status', 'yellow');
    log('   • Check service logs for errors', 'yellow');
    log('   • Verify environment variables are set', 'yellow');
  }
  
  log('\n═══════════════════════════════════════════════════════\n', 'cyan');
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
