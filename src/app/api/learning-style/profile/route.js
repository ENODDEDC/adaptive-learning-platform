import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LearningStyleProfile from '@/models/LearningStyleProfile';
import { verifyToken } from '@/lib/auth';

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

    // Calculate overall ML confidence score (average of all dimension confidences)
    const mlConfidenceScore = profile.confidence ? 
      (profile.confidence.activeReflective + 
       profile.confidence.sensingIntuitive + 
       profile.confidence.visualVerbal + 
       profile.confidence.sequentialGlobal) / 4 : 0;

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          dimensions: profile.dimensions,
          confidence: profile.confidence,
          mlConfidenceScore: mlConfidenceScore, // Add overall ML confidence
          recommendedModes: profile.recommendedModes,
          dominantStyle: profile.getDominantStyle(),
          classificationMethod: profile.classificationMethod,
          lastPrediction: profile.lastPrediction,
          predictionCount: profile.predictionCount
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
