import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LearningStyleProfile from '@/models/LearningStyleProfile';
import featureEngineeringService from '@/services/featureEngineeringService';
import ruleBasedLabelingService from '@/services/ruleBasedLabelingService';
import mlClassificationService from '@/services/mlClassificationService';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/learning-style/classify
 * Classify user's learning style using rule-based approach
 * (ML-based classification will be added in Phase 3)
 */
export async function POST(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    const userId = decoded.userId;

    // Connect to database
    await dbConnect();

    // Calculate features from behavior data
    console.log('📊 Calculating features for user:', userId);
    
    // Import LearningBehavior model
    const LearningBehavior = (await import('@/models/LearningBehavior')).default;
    const behaviors = await LearningBehavior.find({ userId }).sort({ timestamp: -1 });
    
    // Get aggregated data
    let aggregated = null;
    if (behaviors && behaviors.length > 0) {
      // Manually aggregate since we need it for ML format
      aggregated = {
        modeUsage: {
          aiNarrator: { count: 0, totalTime: 0 },
          visualLearning: { count: 0, totalTime: 0 },
          sequentialLearning: { count: 0, totalTime: 0 },
          globalLearning: { count: 0, totalTime: 0 },
          sensingLearning: { count: 0, totalTime: 0 },
          intuitiveLearning: { count: 0, totalTime: 0 },
          activeLearning: { count: 0, totalTime: 0 },
          reflectiveLearning: { count: 0, totalTime: 0 }
        },
        activityEngagement: {
          quizzesCompleted: 0,
          practiceQuestionsAttempted: 0,
          discussionParticipation: 0,
          reflectionJournalEntries: 0,
          visualDiagramsViewed: 0,
          handsOnLabsCompleted: 0,
          conceptExplorationsCount: 0,
          sequentialStepsCompleted: 0
        },
        totalInteractions: 0,
        totalLearningTime: 0,
        sessionCount: behaviors.length
      };

      behaviors.forEach(behavior => {
        Object.keys(aggregated.modeUsage).forEach(mode => {
          aggregated.modeUsage[mode].count += behavior.modeUsage[mode]?.count || 0;
          aggregated.modeUsage[mode].totalTime += behavior.modeUsage[mode]?.totalTime || 0;
        });
        Object.keys(aggregated.activityEngagement).forEach(activity => {
          aggregated.activityEngagement[activity] += behavior.activityEngagement[activity] || 0;
        });
      });

      Object.values(aggregated.modeUsage).forEach(mode => {
        aggregated.totalInteractions += mode.count;
        aggregated.totalLearningTime += mode.totalTime;
      });
    }
    
    const featuresResult = await featureEngineeringService.calculateFeatures(userId);
    
    console.log('✅ Features calculated:', {
      totalInteractions: featuresResult.totalInteractions,
      dataQuality: featuresResult.dataQuality
    });

    // THRESHOLD SYSTEM: Only classify if minimum interactions met
    const MINIMUM_INTERACTIONS = 50;
    
    if (featuresResult.totalInteractions < MINIMUM_INTERACTIONS) {
      console.log(`⏸️ Insufficient data: ${featuresResult.totalInteractions}/${MINIMUM_INTERACTIONS} interactions`);
      return NextResponse.json({
        success: false,
        needsMoreData: true,
        message: `Need ${MINIMUM_INTERACTIONS - featuresResult.totalInteractions} more interactions before classification`,
        data: {
          currentInteractions: featuresResult.totalInteractions,
          requiredInteractions: MINIMUM_INTERACTIONS,
          progress: Math.round((featuresResult.totalInteractions / MINIMUM_INTERACTIONS) * 100)
        }
      }, { status: 400 });
    }
    
    console.log('📊 Data quality assessment:', {
      interactions: featuresResult.totalInteractions,
      confidenceLevel: featuresResult.dataQuality.confidenceLevel,
      confidencePercentage: featuresResult.dataQuality.confidencePercentage
    });

    let classification;
    let recommendations;
    let classificationMethod = 'rule-based';

    // Try ML classification (threshold met)
    console.log('🔍 Attempting classification:', {
      hasAggregated: !!aggregated,
      totalInteractions: featuresResult.totalInteractions,
      confidenceLevel: featuresResult.dataQuality.confidenceLevel
    });
    
    if (aggregated) {
      console.log('🤖 Attempting ML classification...');
      
      // Check ML service health
      const mlHealth = await mlClassificationService.checkMLServiceHealth();
      console.log('🏥 ML Health Check:', mlHealth);
      
      if (mlHealth.available) {
        console.log('✅ ML service is available, using ML models');
        
        // Convert features to ML service format
        const mlFeatures = featureEngineeringService.convertToMLFormat(featuresResult, aggregated);
        console.log('📦 ML features prepared:', Object.keys(mlFeatures));
        console.log('📊 Sample features:', {
          activeModeRatio: mlFeatures.activeModeRatio,
          sensingModeRatio: mlFeatures.sensingModeRatio,
          visualModeRatio: mlFeatures.visualModeRatio,
          sequentialModeRatio: mlFeatures.sequentialModeRatio
        });
        
        // Get ML prediction
        console.log('🚀 Calling ML service...');
        const mlResult = await mlClassificationService.getMLPrediction(mlFeatures);
        console.log('📥 ML Result:', mlResult);
        
        if (mlResult.success) {
          console.log('🎯 ML Classification successful:', mlResult.predictions);
          
          // Convert ML predictions to FSLSM dimensions
          classification = {
            dimensions: mlResult.predictions,
            confidence: mlResult.confidence,
            method: 'ml-prediction',
            dataQuality: featuresResult.dataQuality
          };
          
          classificationMethod = 'ml-prediction';
          
          // Generate recommendations based on ML results
          recommendations = ruleBasedLabelingService.generateRecommendations(classification);
        } else {
          console.log('⚠️ ML prediction failed, falling back to rule-based');
          classification = await ruleBasedLabelingService.classifyLearningStyle(userId);
          recommendations = ruleBasedLabelingService.generateRecommendations(classification);
        }
      } else {
        console.log('⚠️ ML service unavailable:', mlHealth.error);
        console.log('📋 Falling back to rule-based classification');
        classification = await ruleBasedLabelingService.classifyLearningStyle(userId);
        recommendations = ruleBasedLabelingService.generateRecommendations(classification);
      }
    } else {
      // Not enough data, use rule-based
      console.log('📋 Using rule-based classification (insufficient data for ML)');
      classification = await ruleBasedLabelingService.classifyLearningStyle(userId);
      recommendations = ruleBasedLabelingService.generateRecommendations(classification);
    }
    
    console.log('🎯 Classification complete:', {
      dimensions: classification.dimensions,
      method: classificationMethod
    });
    
    console.log('💡 Generated recommendations:', recommendations.length);

    // Update or create learning style profile
    let profile = await LearningStyleProfile.findOne({ userId });
    
    if (!profile) {
      profile = new LearningStyleProfile({ userId });
    }

    // Calculate average ML confidence (if available)
    let avgConfidence = 0;
    if (classification.confidence && typeof classification.confidence === 'object') {
      const confidenceValues = Object.values(classification.confidence);
      avgConfidence = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
    }

    // Update profile with classification results
    profile.dimensions = classification.dimensions;
    profile.confidence = classification.confidence;
    profile.mlConfidenceScore = avgConfidence; // Store real ML confidence
    profile.recommendedModes = recommendations;
    profile.classificationMethod = classificationMethod;
    profile.lastPrediction = new Date();
    profile.predictionCount = (profile.predictionCount || 0) + 1;
    profile.dataQuality = classification.dataQuality || featuresResult.dataQuality;

    await profile.save();
    
    console.log('💾 Profile saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Learning style classified successfully',
      data: {
        dimensions: classification.dimensions,
        confidence: classification.confidence,
        recommendations,
        method: classificationMethod,
        dataQuality: classification.dataQuality || featuresResult.dataQuality,
        features: {
          totalInteractions: featuresResult.totalInteractions,
          totalLearningTime: featuresResult.totalLearningTime
        }
      }
    });

  } catch (error) {
    console.error('❌ Error classifying learning style:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/learning-style/classify
 * Get current classification status
 */
export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    const userId = decoded.userId;

    // Connect to database
    await dbConnect();

    // Get current features
    const featuresResult = await featureEngineeringService.calculateFeatures(userId);
    
    const MINIMUM_INTERACTIONS = 50;
    const readyForClassification = featuresResult.totalInteractions >= MINIMUM_INTERACTIONS;
    const progress = Math.round((featuresResult.totalInteractions / MINIMUM_INTERACTIONS) * 100);

    return NextResponse.json({
      success: true,
      data: {
        dataQuality: featuresResult.dataQuality,
        readyForClassification,
        totalInteractions: featuresResult.totalInteractions,
        totalLearningTime: featuresResult.totalLearningTime,
        confidenceLevel: featuresResult.dataQuality.confidenceLevel,
        confidencePercentage: featuresResult.dataQuality.confidencePercentage,
        requiredInteractions: MINIMUM_INTERACTIONS,
        progress,
        message: !readyForClassification
          ? `Building your profile: ${featuresResult.totalInteractions}/${MINIMUM_INTERACTIONS} interactions (${progress}%)`
          : `Classification available with ${featuresResult.dataQuality.confidenceLevel} confidence (${featuresResult.dataQuality.confidencePercentage}%)`
      }
    });

  } catch (error) {
    console.error('Error checking classification status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
