import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LearningStyleProfile from '@/models/LearningStyleProfile';
import LearningBehavior from '@/models/LearningBehavior';
import { verifyToken } from '@/lib/auth';

/**
 * DELETE /api/reset-learning-profile
 * Reset user's learning profile and behavior data (for testing)
 */
export async function DELETE(request) {
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

    // Delete learning style profile
    const profileResult = await LearningStyleProfile.deleteOne({ userId });
    
    // Delete all behavior data
    const behaviorResult = await LearningBehavior.deleteMany({ userId });

    console.log('🗑️ Reset complete:', {
      userId,
      profileDeleted: profileResult.deletedCount,
      behaviorsDeleted: behaviorResult.deletedCount
    });

    return NextResponse.json({
      success: true,
      message: 'Learning profile and behavior data reset successfully',
      data: {
        profileDeleted: profileResult.deletedCount > 0,
        behaviorsDeleted: behaviorResult.deletedCount,
        userId
      }
    });

  } catch (error) {
    console.error('❌ Error resetting profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reset-learning-profile
 * Get current profile status (for verification)
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

    // Check if profile exists
    const profile = await LearningStyleProfile.findOne({ userId });
    
    // Count behavior records
    const behaviorCount = await LearningBehavior.countDocuments({ userId });

    return NextResponse.json({
      success: true,
      data: {
        hasProfile: !!profile,
        profileMethod: profile?.classificationMethod || null,
        predictionCount: profile?.predictionCount || 0,
        behaviorRecords: behaviorCount,
        lastUpdated: profile?.lastPrediction || null
      }
    });

  } catch (error) {
    console.error('Error checking profile status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
