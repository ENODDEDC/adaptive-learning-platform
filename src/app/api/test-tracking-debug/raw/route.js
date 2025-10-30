import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LearningBehavior from '@/models/LearningBehavior';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/test-tracking-debug/raw
 * Get raw behavior records for debugging
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

    // Get all behavior records for this user (most recent first)
    const behaviors = await LearningBehavior.find({ userId })
      .sort({ timestamp: -1 })
      .limit(20) // Last 20 records
      .lean();

    // Calculate total interactions across all records
    const totalInteractions = behaviors.reduce((sum, b) => {
      return sum + Object.values(b.modeUsage).reduce((modeSum, mode) => modeSum + mode.count, 0);
    }, 0);

    return NextResponse.json({
      success: true,
      behaviors,
      totalRecords: behaviors.length,
      totalInteractions
    });

  } catch (error) {
    console.error('Error fetching raw behavior data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
