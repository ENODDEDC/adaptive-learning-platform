import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function GET(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    const { id } = await params;
    await connectMongoDB();
    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Check if the user is either the creator or enrolled in the course
    const isCreator = course.createdBy.toString() === userId;
    const isEnrolled = course.enrolledUsers.includes(userId);

    if (!isCreator && !isEnrolled) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Get Course by ID Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}