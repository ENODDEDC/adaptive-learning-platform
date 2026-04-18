import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import LearningBehavior from '@/models/LearningBehavior';
import LearningStyleProfile from '@/models/LearningStyleProfile';
import { verifyToken } from '@/lib/auth';

const DEFAULT_MODE_KEYS = [
  'aiNarrator',
  'visualLearning',
  'sequentialLearning',
  'globalLearning',
  'sensingLearning',
  'intuitiveLearning',
  'activeLearning',
  'reflectiveLearning'
];

function normalizeModeUsage(raw) {
  const out = {};
  for (const key of DEFAULT_MODE_KEYS) {
    const src = raw?.[key] && typeof raw[key] === 'object' ? raw[key] : {};
    const count = Number(src.count);
    const totalTime = Number(src.totalTime);
    let lastUsed = null;
    if (src.lastUsed) {
      const d = new Date(src.lastUsed);
      if (!Number.isNaN(d.getTime())) lastUsed = d;
    }
    out[key] = {
      count: Number.isFinite(count) ? count : 0,
      totalTime: Number.isFinite(totalTime) ? totalTime : 0,
      lastUsed
    };
  }
  return out;
}

const DEFAULT_ACTIVITY_ENGAGEMENT = {
  quizzesCompleted: 0,
  practiceQuestionsAttempted: 0,
  discussionParticipation: 0,
  reflectionJournalEntries: 0,
  visualDiagramsViewed: 0,
  handsOnLabsCompleted: 0,
  conceptExplorationsCount: 0,
  sequentialStepsCompleted: 0
};

function normalizeActivityEngagement(raw) {
  const out = { ...DEFAULT_ACTIVITY_ENGAGEMENT };
  if (!raw || typeof raw !== 'object') return out;
  for (const key of Object.keys(DEFAULT_ACTIVITY_ENGAGEMENT)) {
    if (raw[key] === undefined || raw[key] === null) continue;
    const n = Number(raw[key]);
    if (Number.isFinite(n)) out[key] = n;
  }
  return out;
}

/** Drop or fix subdocuments that would make Mongoose cast fail (e.g. invalid contentId). */
function sanitizeContentInteractions(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const out = { ...entry };
      if (out.contentId != null && out.contentId !== '') {
        const id = String(out.contentId);
        if (!mongoose.Types.ObjectId.isValid(id)) {
          delete out.contentId;
        }
      }
      return out;
    });
}

/**
 * Legacy profiles may have aggregatedStats: {} or partial nested objects (truthy but broken).
 * Fill missing branches without resetting existing counters.
 */
function ensureProfileAggregatedStatsShape(profile) {
  if (!profile.aggregatedStats || typeof profile.aggregatedStats !== 'object') {
    profile.aggregatedStats = {};
  }
  const agg = profile.aggregatedStats;

  if (!agg.modeUsage || typeof agg.modeUsage !== 'object') {
    agg.modeUsage = {};
  }
  for (const key of DEFAULT_MODE_KEYS) {
    if (!agg.modeUsage[key] || typeof agg.modeUsage[key] !== 'object') {
      agg.modeUsage[key] = { count: 0, totalTime: 0 };
    }
    agg.modeUsage[key].count = Number(agg.modeUsage[key].count) || 0;
    agg.modeUsage[key].totalTime = Number(agg.modeUsage[key].totalTime) || 0;
  }

  if (!agg.aiAssistantUsage || typeof agg.aiAssistantUsage !== 'object') {
    agg.aiAssistantUsage = {
      askMode: { count: 0, totalTime: 0 },
      researchMode: { count: 0, totalTime: 0 },
      textToDocsMode: { count: 0, totalTime: 0 },
      totalInteractions: 0,
      totalPromptLength: 0
    };
  } else {
    ['askMode', 'researchMode', 'textToDocsMode'].forEach((k) => {
      if (!agg.aiAssistantUsage[k] || typeof agg.aiAssistantUsage[k] !== 'object') {
        agg.aiAssistantUsage[k] = { count: 0, totalTime: 0 };
      }
      agg.aiAssistantUsage[k].count = Number(agg.aiAssistantUsage[k].count) || 0;
      agg.aiAssistantUsage[k].totalTime = Number(agg.aiAssistantUsage[k].totalTime) || 0;
    });
    agg.aiAssistantUsage.totalInteractions = Number(agg.aiAssistantUsage.totalInteractions) || 0;
    agg.aiAssistantUsage.totalPromptLength = Number(agg.aiAssistantUsage.totalPromptLength) || 0;
  }

  if (!agg.activityEngagement || typeof agg.activityEngagement !== 'object') {
    agg.activityEngagement = { ...DEFAULT_ACTIVITY_ENGAGEMENT };
  } else {
    for (const key of Object.keys(DEFAULT_ACTIVITY_ENGAGEMENT)) {
      if (agg.activityEngagement[key] === undefined || agg.activityEngagement[key] === null) {
        agg.activityEngagement[key] = 0;
      } else {
        agg.activityEngagement[key] = Number(agg.activityEngagement[key]) || 0;
      }
    }
  }

  if (typeof agg.totalInteractionsProcessed !== 'number' || Number.isNaN(agg.totalInteractionsProcessed)) {
    agg.totalInteractionsProcessed = 0;
  }
  if (!agg.lastAggregatedDate) {
    agg.lastAggregatedDate = new Date();
  }
}

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
    const userId = decoded.userId || decoded.sub || decoded.id;
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session payload' }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { sessionId, events, behaviorData } = body;

    if (!sessionId || !behaviorData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const modeUsage = normalizeModeUsage(behaviorData.modeUsage);
    const activityEngagement = normalizeActivityEngagement(behaviorData.activityEngagement);
    const defaultAiUsage = {
      askMode: { count: 0, totalTime: 0, lastUsed: null },
      researchMode: { count: 0, totalTime: 0, lastUsed: null },
      textToDocsMode: { count: 0, totalTime: 0, lastUsed: null },
      totalInteractions: 0,
      averagePromptLength: 0,
      totalPromptLength: 0
    };
    const incomingAi =
      behaviorData.aiAssistantUsage && typeof behaviorData.aiAssistantUsage === 'object'
        ? behaviorData.aiAssistantUsage
        : {};
    const aiAssistantUsage = {
      askMode: { ...defaultAiUsage.askMode, ...(incomingAi.askMode || {}) },
      researchMode: { ...defaultAiUsage.researchMode, ...(incomingAi.researchMode || {}) },
      textToDocsMode: { ...defaultAiUsage.textToDocsMode, ...(incomingAi.textToDocsMode || {}) },
      totalInteractions: Number(incomingAi.totalInteractions) || 0,
      averagePromptLength: Number(incomingAi.averagePromptLength) || 0,
      totalPromptLength: Number(incomingAi.totalPromptLength) || 0
    };
    ['askMode', 'researchMode', 'textToDocsMode'].forEach((k) => {
      const block = aiAssistantUsage[k];
      if (block && typeof block === 'object') {
        block.count = Number(block.count) || 0;
        block.totalTime = Number(block.totalTime) || 0;
        if (block.lastUsed) {
          const d = new Date(block.lastUsed);
          block.lastUsed = Number.isNaN(d.getTime()) ? null : d;
        } else {
          block.lastUsed = null;
        }
      }
    });

    const contentInteractions = Array.isArray(behaviorData.contentInteractions)
      ? behaviorData.contentInteractions
      : [];

    // Connect to database
    await dbConnect();

    // Find or create behavior document for this session
    let behavior = await LearningBehavior.findOne({ userId, sessionId });

    console.log('📥 Received AI Assistant data:', aiAssistantUsage);

    if (!behavior) {
      // Create new behavior document
      behavior = new LearningBehavior({
        userId,
        sessionId,
        modeUsage,
        aiAssistantUsage,
        contentInteractions,
        activityEngagement,
        deviceInfo: behaviorData.deviceInfo || {},
        timestamp: new Date()
      });
    } else {
      // Update existing behavior document
      behavior.modeUsage = modeUsage;
      behavior.aiAssistantUsage = aiAssistantUsage;
      behavior.contentInteractions = [...behavior.contentInteractions, ...contentInteractions];
      behavior.activityEngagement = activityEngagement;
      behavior.timestamp = new Date();
    }
    
    console.log('💾 Saving AI Assistant data:', behavior.aiAssistantUsage);

    // Calculate preliminary feature scores
    const totalTime = behavior.getTotalLearningTime();
    
    if (totalTime > 0) {
      // Active vs Reflective
      const activeTime = behavior.modeUsage.activeLearning?.totalTime || 0;
      const reflectiveTime = behavior.modeUsage.reflectiveLearning?.totalTime || 0;
      behavior.features.activeScore = activeTime / totalTime;
      behavior.features.reflectiveScore = reflectiveTime / totalTime;
      
      // Sensing vs Intuitive
      const sensingTime = behavior.modeUsage.sensingLearning?.totalTime || 0;
      const intuitiveTime = behavior.modeUsage.intuitiveLearning?.totalTime || 0;
      behavior.features.sensingScore = sensingTime / totalTime;
      behavior.features.intuitiveScore = intuitiveTime / totalTime;
      
      // Visual vs Verbal
      const visualTime = behavior.modeUsage.visualLearning?.totalTime || 0;
      const verbalTime = behavior.modeUsage.aiNarrator?.totalTime || 0;
      behavior.features.visualScore = visualTime / totalTime;
      behavior.features.verbalScore = verbalTime / totalTime;
      
      // Sequential vs Global
      const sequentialTime = behavior.modeUsage.sequentialLearning?.totalTime || 0;
      const globalTime = behavior.modeUsage.globalLearning?.totalTime || 0;
      behavior.features.sequentialScore = sequentialTime / totalTime;
      behavior.features.globalScore = globalTime / totalTime;
    }

    // Save behavior data
    const savedBehavior = await behavior.save();

    // 📊 INCREMENTAL AGGREGATION: Update profile with new behavior data
    const profile = await LearningStyleProfile.getOrCreate(userId);

    if (!profile.dataQuality || typeof profile.dataQuality !== 'object') {
      profile.dataQuality = {
        totalInteractions: 0,
        dataCompleteness: 0,
        sufficientForML: false,
        lastDataUpdate: new Date()
      };
    }

    ensureProfileAggregatedStatsShape(profile);
    
    // Add new behavior data to running totals (INCREMENTAL UPDATE)
    Object.keys(behavior.modeUsage || {}).forEach(mode => {
      if (profile.aggregatedStats.modeUsage[mode]) {
        profile.aggregatedStats.modeUsage[mode].count += behavior.modeUsage[mode]?.count || 0;
        profile.aggregatedStats.modeUsage[mode].totalTime += behavior.modeUsage[mode]?.totalTime || 0;
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
    const act = behavior.activityEngagement || {};
    Object.keys(act).forEach(activity => {
      if (profile.aggregatedStats.activityEngagement[activity] !== undefined) {
        profile.aggregatedStats.activityEngagement[activity] += act[activity] || 0;
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
      activityEngagementSummary: {},
      recentLogs: []
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

    // Build recent per-session logs for UI timeline/debugging
    stats.recentLogs = behaviors.slice(0, 20).map((behavior) => {
      const sessionModeUsage = behavior.modeUsage || {};
      const modeEntries = Object.entries(sessionModeUsage)
        .map(([modeKey, v]) => ({
          mode: modeKey,
          count: Number(v?.count) || 0,
          totalTime: Number(v?.totalTime) || 0
        }))
        .filter((entry) => entry.count > 0 || entry.totalTime > 0)
        .sort((a, b) => (b.count - a.count) || (b.totalTime - a.totalTime));

      const assistant = behavior.aiAssistantUsage || {};
      const assistantCounts = {
        askMode: Number(assistant?.askMode?.count) || 0,
        researchMode: Number(assistant?.researchMode?.count) || 0,
        textToDocsMode: Number(assistant?.textToDocsMode?.count) || 0
      };
      const assistantTotal = assistantCounts.askMode + assistantCounts.researchMode + assistantCounts.textToDocsMode;

      return {
        sessionId: behavior.sessionId,
        timestamp: behavior.timestamp || behavior.updatedAt || behavior.createdAt,
        modeInteractions: modeEntries.reduce((sum, item) => sum + item.count, 0),
        assistantInteractions: assistantTotal,
        totalModeTime: modeEntries.reduce((sum, item) => sum + item.totalTime, 0),
        modeBreakdown: modeEntries,
        assistantBreakdown: assistantCounts
      };
    });

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
