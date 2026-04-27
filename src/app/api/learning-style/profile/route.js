import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LearningStyleProfile from '@/models/LearningStyleProfile';
import { verifyToken } from '@/lib/auth';
import {
  computeClassificationReadiness,
  computeCrossSessionFactor,
  computeDiversityScore,
  computeIdleDepthFactor,
  MINIMUM_CLASSIFICATION_INTERACTIONS,
  sumActivityEngagement,
  totalModeOpenCount,
  DEFAULT_MODE_KEYS
} from '@/lib/learningStyleReadiness';

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function computeMlConfidence(profile) {
  if (!profile?.confidence) return 0;
  const values = [
    toNumber(profile.confidence.activeReflective),
    toNumber(profile.confidence.sensingIntuitive),
    toNumber(profile.confidence.visualVerbal),
    toNumber(profile.confidence.sequentialGlobal)
  ].map((v) => Math.max(0, Math.min(1, v)));
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function computeModeDiversityScore(profile) {
  const modeUsage = profile?.aggregatedStats?.modeUsage;
  if (!modeUsage || typeof modeUsage !== 'object') return 0;
  return computeDiversityScore(modeUsage, DEFAULT_MODE_KEYS);
}

function evaluateFinalClassification(profile) {
  const totalInteractions = toNumber(
    profile?.dataQuality?.totalInteractions ??
    profile?.aggregatedStats?.totalInteractionsProcessed ??
    0
  );
  const mlConfidence = computeMlConfidence(profile);
  const diversityScore = computeModeDiversityScore(profile);
  const mlAvailable = profile?.classificationMethod === 'ml-prediction';
  const modeUsage = profile?.aggregatedStats?.modeUsage || {};
  const totalLearningTime = Object.values(modeUsage).reduce(
    (sum, value) => sum + toNumber(value?.totalTime),
    0
  );
  const activitySum = sumActivityEngagement(profile?.aggregatedStats?.activityEngagement);
  const idleFactor = computeIdleDepthFactor({
    totalLearningTimeMs: totalLearningTime,
    activitySum,
    modeOpenCount: totalModeOpenCount(modeUsage)
  });
  const cross = computeCrossSessionFactor(profile?.readinessSignals?.recentActiveDays);
  const readiness = computeClassificationReadiness(
    profile?.aggregatedStats,
    totalInteractions,
    profile?.readinessSignals?.recentActiveDays || []
  );

  let qualityScore =
    0.58 * mlConfidence +
    0.26 * diversityScore +
    0.16 * cross;
  qualityScore *= idleFactor;

  const requiredQuality = readiness.requiredQuality;
  const isFinal =
    mlAvailable &&
    totalInteractions >= MINIMUM_CLASSIFICATION_INTERACTIONS &&
    qualityScore >= requiredQuality;

  return {
    isFinal,
    stage: isFinal ? 'final' : 'provisional',
    qualityScore: Number(qualityScore.toFixed(3)),
    requiredQuality: Number(requiredQuality.toFixed(3)),
    mlConfidence: Number(mlConfidence.toFixed(3)),
    diversityScore: Number(diversityScore.toFixed(3))
  };
}

/**
 * GET /api/learning-style/profile
 * Retrieve user's learning style profile
 */
export async function GET(request) {
  try {
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

    await dbConnect();

    let profile = await LearningStyleProfile.findOne({ userId });
    if (!profile) {
      profile = await LearningStyleProfile.create({ userId });
    }

    const needsUpdate = profile.needsUpdate();
    const mlConfidenceScore = profile.predictionCount > 0 ? computeMlConfidence(profile) : 0;
    const finalStatus = evaluateFinalClassification(profile);

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          dimensions: profile.dimensions,
          confidence: profile.confidence,
          mlConfidenceScore,
          recommendedModes: profile.recommendedModes,
          dominantStyle: profile.getDominantStyle(),
          classificationMethod: profile.classificationMethod,
          lastPrediction: profile.lastPrediction,
          predictionCount: profile.predictionCount,
          hasBeenClassified: finalStatus.isFinal,
          classificationStage: finalStatus.stage,
          classificationQuality: {
            qualityScore: finalStatus.qualityScore,
            requiredQuality: finalStatus.requiredQuality,
            mlConfidence: finalStatus.mlConfidence,
            diversityScore: finalStatus.diversityScore
          },
          readinessSignals: profile.readinessSignals || { recentActiveDays: [] }
        },
        dataQuality: profile.dataQuality,
        needsUpdate,
        hasProfile: profile.predictionCount > 0
      }
    });
  } catch (error) {
    console.error('Error fetching learning style profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
