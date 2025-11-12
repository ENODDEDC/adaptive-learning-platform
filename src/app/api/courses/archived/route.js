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

    // Find archived courses created by this user
    const archivedCourses = await Course.find({
      createdBy: userId,
      isArchived: true
    }).sort({ updatedAt: -1 }); // Most recently archived first

    return NextResponse.json({ courses: archivedCourses });
  } catch (error) {
    console.error('Get Archived Courses Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}