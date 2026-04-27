import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LearningStyleProfile from '@/models/LearningStyleProfile';
import featureEngineeringService from '@/services/featureEngineeringService';
import ruleBasedLabelingService from '@/services/ruleBasedLabelingService';
import mlClassificationService from '@/services/mlClassificationService';
import { verifyToken } from '@/lib/auth';
import {
  computeClassificationReadiness,
  MINIMUM_CLASSIFICATION_INTERACTIONS
} from '@/lib/learningStyleReadiness';

function buildReadiness(profile) {
  const totalInteractions =
    profile?.aggregatedStats?.totalInteractionsProcessed ||
    profile?.dataQuality?.totalInteractions ||
    0;
  const readiness = computeClassificationReadiness(
    profile?.aggregatedStats,
    totalInteractions,
    profile?.readinessSignals?.recentActiveDays || []
  );
  const progress = Math.min(
    100,
    Math.round((totalInteractions / MINIMUM_CLASSIFICATION_INTERACTIONS) * 100)
  );

  return { totalInteractions, readiness, progress };
}

/**
 * POST /api/learning-style/classify
 */
export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const userId = decoded.userId;

    await dbConnect();

    let profile = await LearningStyleProfile.findOne({ userId });
    if (!profile) {
      profile = new LearningStyleProfile({ userId });
      await profile.save();
    }

    const { totalInteractions, readiness, progress } = buildReadiness(profile);
    if (!readiness.ready) {
      return NextResponse.json({
        success: false,
        needsMoreData: true,
        message:
          totalInteractions < MINIMUM_CLASSIFICATION_INTERACTIONS
            ? `Need ${MINIMUM_CLASSIFICATION_INTERACTIONS - totalInteractions} more interactions before classification`
            : 'Need better quality interaction data before classification',
        data: {
          currentInteractions: totalInteractions,
          requiredInteractions: MINIMUM_CLASSIFICATION_INTERACTIONS,
          progress,
          qualityScore: Number(readiness.qualityScore.toFixed(3)),
          requiredQuality: Number(readiness.requiredQuality.toFixed(3))
        }
      }, { status: 400 });
    }

    const LearningBehavior = (await import('@/models/LearningBehavior')).default;
    const behaviors = await LearningBehavior.find({ userId }).sort({ timestamp: -1 });

    let aggregated = null;
    if (behaviors && behaviors.length > 0) {
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

      behaviors.forEach((behavior) => {
        Object.keys(aggregated.modeUsage).forEach((mode) => {
          aggregated.modeUsage[mode].count += behavior.modeUsage[mode]?.count || 0;
          aggregated.modeUsage[mode].totalTime += behavior.modeUsage[mode]?.totalTime || 0;
        });
        Object.keys(aggregated.activityEngagement).forEach((activity) => {
          aggregated.activityEngagement[activity] += behavior.activityEngagement[activity] || 0;
        });
      });

      Object.values(aggregated.modeUsage).forEach((mode) => {
        aggregated.totalInteractions += mode.count;
        aggregated.totalLearningTime += mode.totalTime;
      });
    }

    const featuresResult = await featureEngineeringService.calculateFeatures(userId);

    let classification;
    let recommendations;
    let classificationMethod = 'rule-based';

    if (aggregated) {
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
        } else {
          classification = await ruleBasedLabelingService.classifyLearningStyle(userId);
          recommendations = ruleBasedLabelingService.generateRecommendations(classification);
        }
      } else {
        classification = await ruleBasedLabelingService.classifyLearningStyle(userId);
        recommendations = ruleBasedLabelingService.generateRecommendations(classification);
      }
    } else {
      classification = await ruleBasedLabelingService.classifyLearningStyle(userId);
      recommendations = ruleBasedLabelingService.generateRecommendations(classification);
    }

    let avgConfidence = 0;
    if (classification.confidence && typeof classification.confidence === 'object') {
      const confidenceValues = Object.values(classification.confidence);
      avgConfidence = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
    }

    profile.dimensions = classification.dimensions;
    profile.confidence = classification.confidence;
    profile.mlConfidenceScore = avgConfidence;
    profile.recommendedModes = recommendations;
    profile.classificationMethod = classificationMethod;
    profile.lastPrediction = new Date();
    profile.predictionCount = (profile.predictionCount || 0) + 1;
    profile.dataQuality = classification.dataQuality || featuresResult.dataQuality;

    await profile.save();

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
    console.error('Error classifying learning style:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/learning-style/classify
 */
export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const userId = decoded.userId;

    await dbConnect();

    const profile = await LearningStyleProfile.findOne({ userId });
    const { totalInteractions, readiness, progress } = buildReadiness(profile);

    return NextResponse.json({
      success: true,
      data: {
        dataQuality: profile?.dataQuality || null,
        readyForClassification: readiness.ready,
        totalInteractions,
        confidenceLevel: profile?.getConfidenceLevel?.().level || 'insufficient',
        requiredInteractions: MINIMUM_CLASSIFICATION_INTERACTIONS,
        progress,
        qualityScore: Number(readiness.qualityScore.toFixed(3)),
        requiredQuality: Number(readiness.requiredQuality.toFixed(3)),
        message: !readiness.ready
          ? totalInteractions < MINIMUM_CLASSIFICATION_INTERACTIONS
            ? `Building your profile: ${totalInteractions}/${MINIMUM_CLASSIFICATION_INTERACTIONS} interactions (${progress}%)`
            : `Improving interaction quality: ${readiness.qualityScore.toFixed(2)}/${readiness.requiredQuality.toFixed(2)}`
          : 'Classification is ready'
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
