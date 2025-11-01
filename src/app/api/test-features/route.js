import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import featureEngineeringService from '@/services/featureEngineeringService';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/test-features
 * Get calculated features for debugging
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

    // Calculate features
    const features = await featureEngineeringService.calculateFeatures(userId);

    return NextResponse.json({
      success: true,
      data: features
    });

  } catch (error) {
    console.error('Error getting features:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
