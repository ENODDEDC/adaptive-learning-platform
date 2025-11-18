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
    const savedBehavior = await behavior.save();

    // 📊 INCREMENTAL AGGREGATION: Update profile with new behavior data
    const profile = await LearningStyleProfile.getOrCreate(userId);
    
    // Initialize aggregatedStats if not exists
    if (!profile.aggregatedStats) {
      profile.aggregatedStats = {
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
        aiAssistantUsage: {
          askMode: { count: 0, totalTime: 0 },
          researchMode: { count: 0, totalTime: 0 },
          textToDocsMode: { count: 0, totalTime: 0 },
          totalInteractions: 0,
          totalPromptLength: 0
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
        lastAggregatedDate: new Date(),
        lastProcessedBehaviorId: null,
        totalInteractionsProcessed: 0
      };
    }
    
    // Add new behavior data to running totals (INCREMENTAL UPDATE)
    Object.keys(behavior.modeUsage).forEach(mode => {
      if (profile.aggregatedStats.modeUsage[mode]) {
        profile.aggregatedStats.modeUsage[mode].count += behavior.modeUsage[mode].count;
        profile.aggregatedStats.modeUsage[mode].totalTime += behavior.modeUsage[mode].totalTime;
      }
    });
    
    // Add AI Assistant usage
    if (behavior.aiAssistantUsage) {
      profile.aggregatedStats.aiAssistantUsage.askMode.count += behavior.aiAssistantUsage.askMode?.count || 0;
      profile.aggregatedStats.aiAssistantUsage.researchMode.count += behavior.aiAssistantUsage.researchMode?.count || 0;
      profile.aggregatedStats.aiAssistantUsage.textToDocsMode.count += behavior.aiAssistantUsage.textToDocsMode?.count || 0;
      profile.aggregatedStats.aiAssistantUsage.totalInteractions += behavior.aiAssistantUsage.totalInteractions || 0;
      profile.aggregatedStats.aiAssistantUsage.totalPromptLength += behavior.aiAssistantUsage.totalPromptLength || 0;
    }
    
    // Add activity engagement
    Object.keys(behavior.activityEngagement).forEach(activity => {
      if (profile.aggregatedStats.activityEngagement[activity] !== undefined) {
        profile.aggregatedStats.activityEngagement[activity] += behavior.activityEngagement[activity] || 0;
      }
    });
    
    // Update metadata
    profile.aggregatedStats.lastProcessedBehaviorId = savedBehavior._id;
    profile.aggregatedStats.lastAggregatedDate = new Date();
    
    // Calculate total interactions from aggregated data
    let totalInteractionsFromAggregates = 0;
    Object.values(profile.aggregatedStats.modeUsage).forEach(mode => {
      totalInteractionsFromAggregates += mode.count;
    });
    totalInteractionsFromAggregates += profile.aggregatedStats.aiAssistantUsage.totalInteractions;
    
    profile.aggregatedStats.totalInteractionsProcessed = totalInteractionsFromAggregates;
    
    // Update data quality indicators
    profile.dataQuality.totalInteractions = totalInteractionsFromAggregates;
    profile.dataQuality.sufficientForML = totalInteractionsFromAggregates >= 10;
    profile.dataQuality.dataCompleteness = Math.min(100, (totalInteractionsFromAggregates / 200) * 100);
    profile.dataQuality.lastDataUpdate = new Date();
    
    await profile.save();
    
    console.log('📊 Incremental aggregation updated:', {
      totalInteractions: totalInteractionsFromAggregates,
      lastProcessedBehaviorId: savedBehavior._id
    });

    // 🎯 THRESHOLD-BASED AUTO-CLASSIFICATION
    let classificationTriggered = false;
    const totalInteractions = totalInteractionsFromAggregates;
    
    // Check if we should classify at this threshold
    const shouldClassify = profile.shouldClassifyNow();
    const confidenceInfo = profile.getConfidenceLevel();
    const nextThreshold = profile.getNextThreshold();
    
    console.log('🔍 Threshold-based classification check:', {
      totalInteractions,
      shouldClassify,
      nextThreshold,
      confidenceLevel: confidenceInfo.level,
      stage: confidenceInfo.stage
    });
    
    if (shouldClassify) {
      console.log(`🎯 Threshold milestone reached (${totalInteractions})! Auto-triggering classification...`);
      
      try {
        // Import services
        const featureEngineeringService = (await import('@/services/featureEngineeringService')).default;
        const ruleBasedLabelingService = (await import('@/services/ruleBasedLabelingService')).default;
        const mlClassificationService = (await import('@/services/mlClassificationService')).default;
        
        // 📊 USE INCREMENTAL AGGREGATES (no need to fetch all behaviors!)
        const featuresResult = featureEngineeringService.calculateFeaturesFromAggregates(profile.aggregatedStats);
        
        console.log('✅ Features calculated from aggregates (scalable approach)');
        
        // Try ML classification
        let classification;
        let recommendations;
        let classificationMethod = 'rule-based';
        
        const mlHealth = await mlClassificationService.checkMLServiceHealth();
        if (mlHealth.available) {
          // Use aggregated stats for ML format conversion
          const aggregatedForML = {
            modeUsage: profile.aggregatedStats.modeUsage,
            activityEngagement: profile.aggregatedStats.activityEngagement,
            aiAssistantUsage: profile.aggregatedStats.aiAssistantUsage
          };
          
          const mlFeatures = featureEngineeringService.convertToMLFormat(featuresResult, aggregatedForML);
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
            
            // Calculate average ML confidence
            let avgConfidence = 0;
            if (mlResult.confidence && typeof mlResult.confidence === 'object') {
              const confidenceValues = Object.values(mlResult.confidence);
              avgConfidence = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
            }
            profile.mlConfidenceScore = avgConfidence;
            
            console.log('✅ ML classification successful:', mlResult.predictions);
            console.log('📊 ML Confidence:', Math.round(avgConfidence * 100) + '%');
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
        console.log(`🎉 Classification complete at ${totalInteractions} interactions (${confidenceInfo.stage} stage)!`);
      } catch (error) {
        console.error('❌ Auto-classification failed:', error);
      }
    } else {
      console.log(`ℹ️ Classification not triggered. Next threshold: ${nextThreshold} (${nextThreshold - totalInteractions} more interactions needed)`);
    }

    return NextResponse.json({
      success: true,
      message: 'Behavior data tracked successfully',
      data: {
        totalInteractions,
        hasSufficientData: profile.dataQuality.sufficientForML,
        dataCompleteness: profile.dataQuality.dataCompleteness,
        classificationTriggered,
        nextThreshold,
        interactionsUntilNext: nextThreshold - totalInteractions,
        confidenceLevel: confidenceInfo.level,
        confidenceStage: confidenceInfo.stage
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
