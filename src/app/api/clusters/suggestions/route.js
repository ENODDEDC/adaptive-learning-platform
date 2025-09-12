import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function GET(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();

    // Get distinct sections from user's courses, ordered by frequency
    const sectionStats = await Course.aggregate([
      { $match: { createdBy: userId, section: { $ne: null, $ne: '' } } },
      { $group: { _id: '$section', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const suggestions = sectionStats.map(stat => ({
      section: stat._id,
      usageCount: stat.count
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Get Section Suggestions Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}