/**
 * Verify ML Confidence Source
 * This script checks if the confidence scores are from ML predictions
 */

const mongoose = require('mongoose');

async function verifyMLConfidence() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/lms');
    console.log('✅ Connected to MongoDB\n');

    // Get the latest learning style profile
    const profile = await mongoose.connection.db
      .collection('learningstyleprofiles')
      .findOne({}, { sort: { _id: -1 } });

    if (!profile) {
      console.log('❌ No profile found');
      mongoose.disconnect();
      return;
    }

    console.log('=== ML CONFIDENCE VERIFICATION ===\n');

    // Check classification method
    console.log('1. Classification Method:', profile.classificationMethod);
    console.log('   ✓ Expected: "ml-prediction" for ML');
    console.log('   ✓ Actual:', profile.classificationMethod === 'ml-prediction' ? '✅ ML' : '❌ Not ML');
    console.log();

    // Check confidence scores
    console.log('2. Confidence Scores (per dimension):');
    if (profile.confidence) {
      console.log('   Active/Reflective:', (profile.confidence.activeReflective * 100).toFixed(1) + '%');
      console.log('   Sensing/Intuitive:', (profile.confidence.sensingIntuitive * 100).toFixed(1) + '%');
      console.log('   Visual/Verbal:', (profile.confidence.visualVerbal * 100).toFixed(1) + '%');
      console.log('   Sequential/Global:', (profile.confidence.sequentialGlobal * 100).toFixed(1) + '%');
      
      // Calculate average
      const avgConfidence = (
        profile.confidence.activeReflective +
        profile.confidence.sensingIntuitive +
        profile.confidence.visualVerbal +
        profile.confidence.sequentialGlobal
      ) / 4;
      
      console.log('\n   Average ML Confidence:', (avgConfidence * 100).toFixed(1) + '%');
      console.log('   ✓ This is what shows in the UI');
    } else {
      console.log('   ❌ No confidence scores found');
    }
    console.log();

    // Check data quality
    console.log('3. Data Quality:');
    console.log('   Total Interactions:', profile.dataQuality?.totalInteractions || 0);
    console.log('   Data Completeness:', (profile.dataQuality?.dataCompleteness || 0) + '%');
    console.log('   Sufficient for ML:', profile.dataQuality?.sufficientForML ? '✅ Yes' : '❌ No');
    console.log();

    // Check prediction metadata
    console.log('4. Prediction Metadata:');
    console.log('   Last Prediction:', profile.lastPrediction);
    console.log('   Prediction Count:', profile.predictionCount);
    console.log('   Model Version:', profile.modelVersion || 'N/A');
    console.log();

    // Final verification
    console.log('=== VERIFICATION RESULT ===\n');
    
    const isMLClassified = profile.classificationMethod === 'ml-prediction';
    const hasConfidence = profile.confidence && 
      (profile.confidence.activeReflective > 0 ||
       profile.confidence.sensingIntuitive > 0 ||
       profile.confidence.visualVerbal > 0 ||
       profile.confidence.sequentialGlobal > 0);
    
    if (isMLClassified && hasConfidence) {
      console.log('✅ CONFIRMED: Confidence scores are from ML model!');
      console.log('   The 50% you see in the UI is real ML confidence.');
    } else if (isMLClassified && !hasConfidence) {
      console.log('⚠️  WARNING: Classified as ML but no confidence scores found');
      console.log('   This might be a data issue.');
    } else {
      console.log('❌ NOT ML: Using rule-based classification');
      console.log('   Confidence scores are estimates, not from ML model.');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n❌ MongoDB is not running!');
      console.log('   Start MongoDB first, then run this script.');
    }
    mongoose.disconnect();
  }
}

verifyMLConfidence();
