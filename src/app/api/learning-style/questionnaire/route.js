import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LearningStyleProfile from '@/models/LearningStyleProfile';
import learningStyleQuestionnaireService from '@/services/learningStyleQuestionnaireService';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/learning-style/questionnaire
 * Get questionnaire questions
 */
export async function GET(request) {
  try {
    const questions = learningStyleQuestionnaireService.getQuestions();
    
    return NextResponse.json({
      success: true,
      data: {
        questions,
        totalQuestions: questions.length,
        questionsPerDimension: 5,
        dimensions: ['activeReflective', 'sensingIntuitive', 'visualVerbal', 'sequentialGlobal']
      }
    });
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning-style/questionnaire
 * Submit questionnaire responses and get learning style classification
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
    const { responses } = await request.json();

    if (!responses || Object.keys(responses).length === 0) {
      return NextResponse.json(
        { error: 'No responses provided' },
        { status: 400 }
      );
    }

    // Calculate scores from questionnaire
    const scores = learningStyleQuestionnaireService.calculateScores(responses);
    const interpretations = learningStyleQuestionnaireService.interpretScores(scores);
    const recommendations = learningStyleQuestionnaireService.getRecommendations(scores);

    // Connect to database
    await dbConnect();

    // Update or create learning style profile
    let profile = await LearningStyleProfile.findOne({ userId });
    
    if (!profile) {
      profile = new LearningStyleProfile({ userId });
    }

    // Update profile with questionnaire results
    profile.dimensions = scores;
    profile.confidence = {
      activeReflective: 1.0, // Questionnaire provides high confidence
      sensingIntuitive: 1.0,
      visualVerbal: 1.0,
      sequentialGlobal: 1.0
    };
    profile.recommendedModes = recommendations.map((rec, index) => ({
      mode: rec.mode,
      priority: index + 1,
      reason: rec.reason,
      confidence: 1.0
    }));
    profile.classificationMethod = 'questionnaire';
    profile.lastPrediction = new Date();
    profile.predictionCount = (profile.predictionCount || 0) + 1;
    profile.dataQuality = {
      totalInteractions: 20, // Questionnaire counts as high-quality data
      dataCompleteness: 100,
      sufficientForML: true,
      lastDataUpdate: new Date()
    };

    await profile.save();

    console.log('✅ Questionnaire processed and profile saved');

    return NextResponse.json({
      success: true,
      message: 'Questionnaire processed successfully',
      data: {
        scores,
        interpretations,
        recommendations,
        profile: {
          dimensions: profile.dimensions,
          confidence: profile.confidence,
          dominantStyle: profile.getDominantStyle()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error processing questionnaire:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
