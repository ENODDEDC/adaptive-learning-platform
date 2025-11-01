import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LearningBehavior from '@/models/LearningBehavior';
import LearningStyleProfile from '@/models/LearningStyleProfile';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/learning-behavior/track
 * Receives and stores student behavior data for ML classification
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

    // Parse request body
    const { sessionId, events, behaviorData } = await request.json();

    if (!sessionId || !behaviorData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find or create behavior document for this session
    let behavior = await LearningBehavior.findOne({ userId, sessionId });

    console.log('📥 Received AI Assistant data:', behaviorData.aiAssistantUsage);

    if (!behavior) {
      // Create new behavior document
      behavior = new LearningBehavior({
        userId,
        sessionId,
        modeUsage: behaviorData.modeUsage,
        aiAssistantUsage: behaviorData.aiAssistantUsage || {
          askMode: { count: 0, totalTime: 0 },
          researchMode: { count: 0, totalTime: 0 },
          textToDocsMode: { count: 0, totalTime: 0 },
          totalInteractions: 0,
          averagePromptLength: 0,
          totalPromptLength: 0
        },
        contentInteractions: behaviorData.contentInteractions || [],
        activityEngagement: behaviorData.activityEngagement,
        deviceInfo: behaviorData.deviceInfo,
        timestamp: new Date()
      });
    } else {
      // Update existing behavior document
      behavior.modeUsage = behaviorData.modeUsage;
      behavior.aiAssistantUsage = behaviorData.aiAssistantUsage || behavior.aiAssistantUsage;
      behavior.contentInteractions = [
        ...behavior.contentInteractions,
        ...(behaviorData.contentInteractions || [])
      ];
      behavior.activityEngagement = behaviorData.activityEngagement;
      behavior.timestamp = new Date();
    }
    
    console.log('💾 Saving AI Assistant data:', behavior.aiAssistantUsage);

    // Calculate preliminary feature scores
    const totalTime = behavior.getTotalLearningTime();
    
    if (totalTime > 0) {
      // Active vs Reflective
      const activeTime = behavior.modeUsage.activeLearning.totalTime;
      const reflectiveTime = behavior.modeUsage.reflectiveLearning.totalTime;
      behavior.features.activeScore = activeTime / totalTime;
      behavior.features.reflectiveScore = reflectiveTime / totalTime;
      
      // Sensing vs Intuitive
      const sensingTime = behavior.modeUsage.sensingLearning.totalTime;
      const intuitiveTime = behavior.modeUsage.intuitiveLearning.totalTime;
      behavior.features.sensingScore = sensingTime / totalTime;
      behavior.features.intuitiveScore = intuitiveTime / totalTime;
      
      // Visual vs Verbal
      const visualTime = behavior.modeUsage.visualLearning.totalTime;
      const verbalTime = behavior.modeUsage.aiNarrator.totalTime;
      behavior.features.visualScore = visualTime / totalTime;
      behavior.features.verbalScore = verbalTime / totalTime;
      
      // Sequential vs Global
      const sequentialTime = behavior.modeUsage.sequentialLearning.totalTime;
      const globalTime = behavior.modeUsage.globalLearning.totalTime;
      behavior.features.sequentialScore = sequentialTime / totalTime;
      behavior.features.globalScore = globalTime / totalTime;
    }

    // Save behavior data
    await behavior.save();

    // Update learning style profile data quality
    const profile = await LearningStyleProfile.getOrCreate(userId);
    const totalInteractions = await LearningBehavior.getTotalInteractions(userId);
    const hasSufficientData = await LearningBehavior.hasSufficientData(userId);
    
    profile.dataQuality.totalInteractions = totalInteractions;
    profile.dataQuality.sufficientForML = hasSufficientData;
    profile.dataQuality.dataCompleteness = Math.min(100, (totalInteractions / 20) * 100);
    profile.dataQuality.lastDataUpdate = new Date();
    
    await profile.save();

    // 🎯 AUTO-TRIGGER CLASSIFICATION when threshold is reached
    let classificationTriggered = false;
    
    // Check if profile has been classified (lastPrediction is the key indicator)
    // Dimensions always exist with default 0 values, so we check lastPrediction instead
    const hasBeenClassified = profile.lastPrediction != null;
    const timeSinceLastPrediction = hasBeenClassified 
      ? Date.now() - new Date(profile.lastPrediction).getTime()
      : Infinity;
    
    console.log('🔍 Auto-classification check:', {
      hasSufficientData,
      hasBeenClassified,
      lastPrediction: profile.lastPrediction,
      timeSinceLastPrediction: hasBeenClassified ? `${Math.round(timeSinceLastPrediction / 1000 / 60)} minutes` : 'never',
      totalInteractions
    });
    
    // Trigger if: (1) has sufficient data AND (2) never been classified OR (3) hasn't been classified in 24 hours
    const needsClassification = hasSufficientData && (
      !hasBeenClassified || 
      timeSinceLastPrediction > 24 * 60 * 60 * 1000
    );
    
    if (needsClassification) {
      console.log('🎯 Threshold reached! Auto-triggering ML classification...');
      console.log('📊 Reason:', {
        noDimensions: !hasDimensions,
        noPrediction: !profile.lastPrediction,
        oldPrediction: profile.lastPrediction && (Date.now() - new Date(profile.lastPrediction).getTime() > 24 * 60 * 60 * 1000)
      });
      try {
        // Import services
        const featureEngineeringService = (await import('@/services/featureEngineeringService')).default;
        const ruleBasedLabelingService = (await import('@/services/ruleBasedLabelingService')).default;
        const mlClassificationService = (await import('@/services/mlClassificationService')).default;
        
        // Calculate features
        const featuresResult = await featureEngineeringService.calculateFeatures(userId);
        
        // Get aggregated behavior data
        const behaviors = await LearningBehavior.find({ userId }).sort({ timestamp: -1 });
        const aggregated = {
          modeUsage: {
            aiNarrator: { count: 0, totalTime: 0 },
            visualLearning: { count: 0, totalTime: 0 },
            sequentialLearning: { count: 0, totalTime: 0 },
            globalLearning: { count: 0, totalTime: 0 },
            sensingLearning: { count: 0, totalTime: 0 },
            intuitiveLearning: { count: 0, totalTime: 0 },
            activeLearning: { count: 0, totalTime: 0 },
            reflectiveLearning: { count: 0, totalTime: 0 }
          }
        };
        
        behaviors.forEach(b => {
          Object.keys(aggregated.modeUsage).forEach(mode => {
            aggregated.modeUsage[mode].count += b.modeUsage[mode]?.count || 0;
            aggregated.modeUsage[mode].totalTime += b.modeUsage[mode]?.totalTime || 0;
          });
        });
        
        // Try ML classification
        let classification;
        let recommendations;
        let classificationMethod = 'rule-based';
        
        const mlHealth = await mlClassificationService.checkMLServiceHealth();
        if (mlHealth.available) {
          const mlFeatures = featureEngineeringService.convertToMLFormat(featuresResult, aggregated);
          const mlResult = await mlClassificationService.getMLPrediction(mlFeatures);
          
          if (mlResult.success) {
            classification = {
              dimensions: mlResult.predictions,
              confidence: mlResult.confidence,
              method: 'ml-prediction',
              dataQuality: featuresResult.dataQuality
            };
            classificationMethod = 'ml-prediction';
            recommendations = ruleBasedLabelingService.generateRecommendations(classification);
            console.log('✅ ML classification successful:', mlResult.predictions);
          } else {
            classification = await ruleBasedLabelingService.classifyLearningStyle(userId);
            recommendations = ruleBasedLabelingService.generateRecommendations(classification);
            console.log('📋 Fallback to rule-based classification');
          }
        } else {
          classification = await ruleBasedLabelingService.classifyLearningStyle(userId);
          recommendations = ruleBasedLabelingService.generateRecommendations(classification);
          console.log('📋 Using rule-based classification (ML unavailable)');
        }
        
        // Update profile with classification
        profile.dimensions = classification.dimensions;
        profile.confidence = classification.confidence;
        profile.recommendedModes = recommendations;
        profile.classificationMethod = classificationMethod;
        profile.lastPrediction = new Date();
        profile.predictionCount = (profile.predictionCount || 0) + 1;
        
        await profile.save();
        classificationTriggered = true;
        console.log('🎉 Auto-classification complete!');
      } catch (error) {
        console.error('❌ Auto-classification failed:', error);
      }
    }

    // Log classification status for debugging
    if (classificationTriggered) {
      console.log('🎉 CLASSIFICATION TRIGGERED! User learning style has been determined.');
    } else if (needsClassification) {
      console.log('⚠️ Classification was needed but failed - check error logs above');
    } else {
      console.log('ℹ️ Classification not needed:', {
        reason: !hasSufficientData ? 'insufficient data' : 'already classified recently'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Behavior data tracked successfully',
      data: {
        totalInteractions,
        hasSufficientData,
        dataCompleteness: profile.dataQuality.dataCompleteness,
        classificationTriggered,
        needsClassification
      }
    });

  } catch (error) {
    console.error('Error tracking behavior:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/learning-behavior/track
 * Get user's behavior summary
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

    // Get all behavior data for user
    const behaviors = await LearningBehavior.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50);

    // Calculate aggregated statistics
    const stats = {
      totalSessions: behaviors.length,
      totalInteractions: await LearningBehavior.getTotalInteractions(userId),
      hasSufficientData: await LearningBehavior.hasSufficientData(userId),
      modeUsageSummary: {},
      activityEngagementSummary: {}
    };

    // Aggregate mode usage
    const modeUsage = {
      aiNarrator: { count: 0, totalTime: 0 },
      visualLearning: { count: 0, totalTime: 0 },
      sequentialLearning: { count: 0, totalTime: 0 },
      globalLearning: { count: 0, totalTime: 0 },
      sensingLearning: { count: 0, totalTime: 0 },
      intuitiveLearning: { count: 0, totalTime: 0 },
      activeLearning: { count: 0, totalTime: 0 },
      reflectiveLearning: { count: 0, totalTime: 0 }
    };

    // Aggregate AI Assistant usage
    const aiAssistantUsage = {
      askMode: { count: 0, totalTime: 0 },
      researchMode: { count: 0, totalTime: 0 },
      textToDocsMode: { count: 0, totalTime: 0 },
      totalInteractions: 0,
      averagePromptLength: 0,
      totalPromptLength: 0
    };

    behaviors.forEach(behavior => {
      Object.keys(modeUsage).forEach(mode => {
        modeUsage[mode].count += behavior.modeUsage[mode].count;
        modeUsage[mode].totalTime += behavior.modeUsage[mode].totalTime;
      });

      // Aggregate AI Assistant data
      if (behavior.aiAssistantUsage) {
        aiAssistantUsage.askMode.count += behavior.aiAssistantUsage.askMode?.count || 0;
        aiAssistantUsage.researchMode.count += behavior.aiAssistantUsage.researchMode?.count || 0;
        aiAssistantUsage.textToDocsMode.count += behavior.aiAssistantUsage.textToDocsMode?.count || 0;
        aiAssistantUsage.totalInteractions += behavior.aiAssistantUsage.totalInteractions || 0;
        aiAssistantUsage.totalPromptLength += behavior.aiAssistantUsage.totalPromptLength || 0;
      }
    });

    // Recalculate total interactions from individual mode counts (more accurate)
    const calculatedTotal = aiAssistantUsage.askMode.count + 
                           aiAssistantUsage.researchMode.count + 
                           aiAssistantUsage.textToDocsMode.count;
    
    // Use calculated total if it's greater (fixes stale data issue)
    if (calculatedTotal > aiAssistantUsage.totalInteractions) {
      aiAssistantUsage.totalInteractions = calculatedTotal;
    }
    
    // Calculate average prompt length
    if (aiAssistantUsage.totalInteractions > 0) {
      aiAssistantUsage.averagePromptLength = 
        aiAssistantUsage.totalPromptLength / aiAssistantUsage.totalInteractions;
    }

    console.log('📊 AI Assistant Usage Stats:', aiAssistantUsage);

    stats.modeUsageSummary = modeUsage;
    stats.aiAssistantUsage = aiAssistantUsage;

    // Calculate total learning time across all modes
    stats.totalLearningTime = Object.values(modeUsage).reduce((sum, mode) => sum + mode.totalTime, 0);

    // Calculate data quality
    const dataQuality = {
      totalInteractions: stats.totalInteractions,
      totalTime: stats.totalLearningTime,
      sessionCount: stats.totalSessions,
      completeness: Math.min(100, Math.round((stats.totalInteractions / 20) * 100)),
      sufficientForML: stats.hasSufficientData
    };
    stats.dataQuality = dataQuality;

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching behavior data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
