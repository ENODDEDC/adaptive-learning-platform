import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import featureEngineeringService from '@/services/featureEngineeringService';
import LearningBehavior from '@/models/LearningBehavior';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/test-ml-features
 * Get ML-formatted features for debugging
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

    // Get behaviors
    const behaviors = await LearningBehavior.find({ userId }).sort({ timestamp: -1 });
    
    if (!behaviors || behaviors.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No behavior data found'
      });
    }

    // Aggregate behaviors
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
      },
      aiAssistantUsage: {
        askMode: { count: 0, totalTime: 0 },
        researchMode: { count: 0, totalTime: 0 },
        textToDocsMode: { count: 0, totalTime: 0 },
        totalInteractions: 0,
        averagePromptLength: 0,
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
      totalInteractions: 0,
      totalLearningTime: 0,
      sessionCount: behaviors.length
    };

    // Aggregate data
    behaviors.forEach(behavior => {
      Object.keys(aggregated.modeUsage).forEach(mode => {
        aggregated.modeUsage[mode].count += behavior.modeUsage[mode]?.count || 0;
        aggregated.modeUsage[mode].totalTime += behavior.modeUsage[mode]?.totalTime || 0;
      });

      if (behavior.aiAssistantUsage) {
        aggregated.aiAssistantUsage.askMode.count += behavior.aiAssistantUsage.askMode?.count || 0;
        aggregated.aiAssistantUsage.researchMode.count += behavior.aiAssistantUsage.researchMode?.count || 0;
        aggregated.aiAssistantUsage.textToDocsMode.count += behavior.aiAssistantUsage.textToDocsMode?.count || 0;
        aggregated.aiAssistantUsage.totalInteractions += behavior.aiAssistantUsage.totalInteractions || 0;
        aggregated.aiAssistantUsage.totalPromptLength += behavior.aiAssistantUsage.totalPromptLength || 0;
      }

      Object.keys(aggregated.activityEngagement).forEach(activity => {
        aggregated.activityEngagement[activity] += behavior.activityEngagement[activity] || 0;
      });
    });

    Object.values(aggregated.modeUsage).forEach(mode => {
      aggregated.totalInteractions += mode.count;
      aggregated.totalLearningTime += mode.totalTime;
    });

    if (aggregated.aiAssistantUsage.totalInteractions > 0) {
      aggregated.aiAssistantUsage.averagePromptLength = 
        aggregated.aiAssistantUsage.totalPromptLength / aggregated.aiAssistantUsage.totalInteractions;
    }

    // Calculate features
    const features = await featureEngineeringService.calculateFeatures(userId);

    // Convert to ML format
    const mlFeatures = featureEngineeringService.convertToMLFormat(features, aggregated);

    return NextResponse.json({
      success: true,
      data: {
        mlFeatures,
        aggregated: {
          aiAssistantUsage: aggregated.aiAssistantUsage,
          totalInteractions: aggregated.totalInteractions,
          totalLearningTime: aggregated.totalLearningTime
        }
      }
    });

  } catch (error) {
    console.error('Error getting ML features:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
