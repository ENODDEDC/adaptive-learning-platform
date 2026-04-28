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
      console.log('🎯 Classification available!');
      console.log('📊 Total interactions:', statusData.data.totalInteractions);
      console.log('🎚️ Confidence:', statusData.data.confidenceLevel, `(${statusData.data.confidencePercentage}%)`);
      
      // Check if minimum threshold met
      const MINIMUM_INTERACTIONS = 50;
      if (statusData.data.totalInteractions < MINIMUM_INTERACTIONS) {
        console.log(`⏸️ Not enough interactions yet: ${statusData.data.totalInteractions}/${MINIMUM_INTERACTIONS}`);
        return;
      }
      
      // Check if already classified
      const profileResponse = await fetch('/api/learning-style/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        
        // If profile exists and has been classified recently, check if we should re-classify
        if (profileData.profile && profileData.profile.lastPrediction) {
          const lastClassified = new Date(profileData.profile.lastPrediction);
          const hoursSinceClassification = (Date.now() - lastClassified.getTime()) / (1000 * 60 * 60);
          
          // Re-classify if it's been more than 1 hour and confidence has improved
          if (hoursSinceClassification < 1) {
            console.log('✅ Recently classified, skipping auto-classification');
            return;
          }
        }
      }
      
      // Trigger classification (threshold met)
      console.log('🚀 Auto-triggering classification...');
      const classifyResponse = await fetch('/api/learning-style/classify', {
        method: 'POST'
      });
      
      if (classifyResponse.ok) {
        const classifyData = await classifyResponse.json();
        console.log('🎉 AUTO-CLASSIFICATION COMPLETE!');
        console.log('📊 Learning Style:', classifyData.data.dimensions);
        console.log('🎚️ Confidence:', classifyData.data.dataQuality?.confidenceLevel);
        console.log('💡 Recommended Modes:', classifyData.data.recommendations?.map(r => r.mode).join(', '));
        
        // Show notification to user
        if (typeof window !== 'undefined' && window.location.pathname !== '/test-tracking-debug') {
          console.log(`💡 Your learning preferences updated! (${classifyData.data.dataQuality?.confidenceLevel} confidence)`);
        }
      } else {
        console.log('❌ Classification failed');
      }
    } else {
      console.log('ℹ️ Status:', statusData.data.message);
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

  try {
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
  } catch (error) {
    console.error('❌ Error initializing auto-classification checker:', error);
  }
}
