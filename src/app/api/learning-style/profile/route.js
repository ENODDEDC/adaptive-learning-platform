import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LearningStyleProfile from '@/models/LearningStyleProfile';
import { verifyToken } from '@/lib/auth';

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

  const weights = Object.values(modeUsage).map((row) => {
    const count = toNumber(row?.count);
    const totalTime = toNumber(row?.totalTime);
    return Math.max(0, count + totalTime / 1000);
  });

  const total = weights.reduce((sum, v) => sum + v, 0);
  if (total <= 0) return 0;

  const probs = weights
    .filter((w) => w > 0)
    .map((w) => w / total);

  if (probs.length <= 1) return 0;

  // Normalized entropy in [0,1], high means behavior is distributed across modes.
  const entropy = -probs.reduce((sum, p) => sum + p * Math.log(p), 0);
  const maxEntropy = Math.log(weights.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

function evaluateFinalClassification(profile) {
  const totalInteractions = toNumber(
    profile?.dataQuality?.totalInteractions ?? profile?.aggregatedStats?.totalInteractionsProcessed
  );
  const mlConfidence = computeMlConfidence(profile);
  const diversityScore = computeModeDiversityScore(profile);
  const mlAvailable = profile?.classificationMethod === 'ml-prediction';

  // Dynamic quality gate driven by model confidence + behavior diversity.
  const qualityScore = 0.7 * mlConfidence + 0.3 * diversityScore;
  const requiredQuality =
    totalInteractions < 50 ? 0.72 :
      totalInteractions < 100 ? 0.64 :
        totalInteractions < 200 ? 0.58 : 0.54;

  const isFinal = mlAvailable && totalInteractions > 0 && qualityScore >= requiredQuality;

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

    // Get or create profile
    let profile = await LearningStyleProfile.findOne({ userId });
    
    if (!profile) {
      // Create default profile
      profile = await LearningStyleProfile.create({ userId });
    }

    // Check if profile needs update
    const needsUpdate = profile.needsUpdate();

    const mlConfidenceScore = profile.predictionCount > 0 ? computeMlConfidence(profile) : 0;
    const finalStatus = evaluateFinalClassification(profile);

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          dimensions: profile.dimensions,
          confidence: profile.confidence,
          mlConfidenceScore: mlConfidenceScore, // Only non-zero after classification
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
          }
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
