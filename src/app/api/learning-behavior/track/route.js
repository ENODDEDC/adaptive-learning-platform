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

    if (!behavior) {
      // Create new behavior document
      behavior = new LearningBehavior({
        userId,
        sessionId,
        modeUsage: behaviorData.modeUsage,
        contentInteractions: behaviorData.contentInteractions || [],
        activityEngagement: behaviorData.activityEngagement,
        deviceInfo: behaviorData.deviceInfo,
        timestamp: new Date()
      });
    } else {
      // Update existing behavior document
      behavior.modeUsage = behaviorData.modeUsage;
      behavior.contentInteractions = [
        ...behavior.contentInteractions,
        ...(behaviorData.contentInteractions || [])
      ];
      behavior.activityEngagement = behaviorData.activityEngagement;
      behavior.timestamp = new Date();
    }

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

    return NextResponse.json({
      success: true,
      message: 'Behavior data tracked successfully',
      data: {
        totalInteractions,
        hasSufficientData,
        dataCompleteness: profile.dataQuality.dataCompleteness
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

    behaviors.forEach(behavior => {
      Object.keys(modeUsage).forEach(mode => {
        modeUsage[mode].count += behavior.modeUsage[mode].count;
        modeUsage[mode].totalTime += behavior.modeUsage[mode].totalTime;
      });
    });

    stats.modeUsageSummary = modeUsage;

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
