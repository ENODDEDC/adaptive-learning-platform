/**
 * Auto-Classification Checker
 * Checks if user needs classification and triggers it automatically
 */

let checkInProgress = false;
let lastCheckTime = 0;
const CHECK_COOLDOWN = 60000; // Only check once per minute to avoid spam

/**
 * Check if user needs classification and trigger if needed
 * Call this on page load or navigation
 */
export async function checkAndTriggerClassification() {
  // Prevent multiple simultaneous checks
  if (checkInProgress) {
    console.log('⏳ Classification check already in progress...');
    return;
  }

  // Cooldown to prevent too frequent checks
  const now = Date.now();
  if (now - lastCheckTime < CHECK_COOLDOWN) {
    console.log('⏸️ Classification check on cooldown');
    return;
  }

  checkInProgress = true;
  lastCheckTime = now;

  try {
    console.log('🔍 Checking if classification is needed...');

    // Check classification status
    const statusResponse = await fetch('/api/learning-style/classify');
    if (!statusResponse.ok) {
      console.log('⚠️ Could not check classification status');
      return;
    }

    const statusData = await statusResponse.json();
    
    if (statusData.success && statusData.data.readyForClassification) {
      console.log('🎯 User has sufficient data but not classified yet!');
      console.log('📊 Total interactions:', statusData.data.totalInteractions);
      
      // Check if already classified
      const profileResponse = await fetch('/api/learning-style/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        
        // If profile exists and has been classified, no need to classify again
        if (profileData.profile && profileData.profile.lastPrediction) {
          console.log('✅ User already classified on:', profileData.profile.lastPrediction);
          return;
        }
      }
      
      // Trigger classification
      console.log('🚀 Auto-triggering classification...');
      const classifyResponse = await fetch('/api/learning-style/classify', {
        method: 'POST'
      });
      
      if (classifyResponse.ok) {
        const classifyData = await classifyResponse.json();
        console.log('🎉 AUTO-CLASSIFICATION COMPLETE!');
        console.log('📊 Learning Style:', classifyData.data.dimensions);
        console.log('💡 Recommended Modes:', classifyData.data.recommendations?.map(r => r.mode).join(', '));
        
        // Show notification to user
        if (typeof window !== 'undefined' && window.location.pathname !== '/test-tracking-debug') {
          console.log('💡 Your learning preferences have been determined! Refresh to see personalized badges.');
        }
      } else {
        console.log('❌ Classification failed');
      }
    } else {
      console.log('ℹ️ Classification not needed yet:', statusData.data.message);
    }
  } catch (error) {
    console.error('❌ Error checking classification:', error);
  } finally {
    checkInProgress = false;
  }
}

/**
 * Initialize auto-classification checker
 * Call this once when app loads
 */
export function initAutoClassificationChecker() {
  if (typeof window === 'undefined') return;

  // Check on initial load
  setTimeout(() => {
    checkAndTriggerClassification();
  }, 2000); // Wait 2 seconds for page to settle

  // Check on visibility change (when user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkAndTriggerClassification();
    }
  });

  console.log('✅ Auto-classification checker initialized');
}
