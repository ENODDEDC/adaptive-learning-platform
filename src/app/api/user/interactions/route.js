import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import connectDB from '@/config/mongoConfig';
import UserBehavior from '@/models/UserBehavior';

export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;
    const body = await request.json();

    const {
      type,
      courseId,
      metadata = {},
      timestamp = new Date().toISOString()
    } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: 'Interaction type is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Create interaction record
    const interaction = {
      userId,
      type,
      courseId,
      metadata,
      timestamp
    };

    // Store in UserBehavior collection
    const userBehavior = await UserBehavior.findOneAndUpdate(
      { userId },
      {
        $push: { interactions: interaction },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true, new: true }
    );

    // Update interaction patterns
    await updateInteractionPatterns(userId, interaction);

    return NextResponse.json({
      success: true,
      message: 'Interaction tracked successfully',
      interaction
    });

  } catch (error) {
    console.error('Error tracking interaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const limit = parseInt(searchParams.get('limit')) || 50;

    // Connect to database
    await connectDB();

    // Build query
    const query = { userId };
    if (courseId) {
      query['interactions.courseId'] = courseId;
    }

    const userBehavior = await UserBehavior.findOne(query)
      .select('interactions interactionPatterns')
      .sort({ 'interactions.timestamp': -1 })
      .limit(limit);

    if (!userBehavior) {
      return NextResponse.json({
        interactions: [],
        interactionPatterns: {
          mostClickedCourses: [],
          interactionFrequency: 0,
          searchFrequency: 0,
          avgSessionDuration: 0
        }
      });
    }

    // Filter interactions by course if specified
    let interactions = userBehavior.interactions || [];
    if (courseId) {
      interactions = interactions.filter(i => i.courseId === courseId);
    }

    return NextResponse.json({
      interactions: interactions.slice(0, limit),
      interactionPatterns: userBehavior.interactionPatterns || {
        mostClickedCourses: [],
        interactionFrequency: 0,
        searchFrequency: 0,
        avgSessionDuration: 0
      }
    });

  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateInteractionPatterns(userId, newInteraction) {
  try {
    const userBehavior = await UserBehavior.findOne({ userId });

    if (!userBehavior) return;

    const interactions = userBehavior.interactions || [];
    const recentInteractions = interactions.slice(-100); // Last 100 interactions

    // Calculate most clicked courses
    const courseClicks = {};
    recentInteractions.forEach(interaction => {
      if (interaction.courseId) {
        courseClicks[interaction.courseId] = (courseClicks[interaction.courseId] || 0) + 1;
      }
    });

    const mostClickedCourses = Object.entries(courseClicks)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([courseId]) => courseId);

    // Calculate interaction frequency (interactions per day)
    const uniqueDays = new Set(
      recentInteractions.map(i => new Date(i.timestamp).toDateString())
    ).size;

    const interactionFrequency = uniqueDays > 0 ? recentInteractions.length / uniqueDays : 0;

    // Calculate search frequency
    const searchInteractions = recentInteractions.filter(i => i.type === 'search');
    const searchFrequency = uniqueDays > 0 ? searchInteractions.length / uniqueDays : 0;

    // Calculate average session duration
    const timeSpentInteractions = recentInteractions.filter(i => i.type === 'time_spent');
    const totalTimeSpent = timeSpentInteractions.reduce((sum, i) => sum + (i.metadata?.duration || 0), 0);
    const avgSessionDuration = timeSpentInteractions.length > 0 ? totalTimeSpent / timeSpentInteractions.length : 0;

    // Update interaction patterns
    userBehavior.interactionPatterns = {
      mostClickedCourses,
      interactionFrequency,
      searchFrequency,
      avgSessionDuration,
      lastCalculated: new Date()
    };

    await userBehavior.save();

  } catch (error) {
    console.error('Error updating interaction patterns:', error);
  }
}