import connectMongoDB from '@/config/mongoConfig';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function POST(request, { params }) {
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

    // Only the course creator can restore the course
    if (course.createdBy.toString() !== userId) {
      return NextResponse.json({ message: 'Forbidden: Only course creator can restore the course' }, { status: 403 });
    }

    // Check if course is archived
    if (!course.isArchived) {
      return NextResponse.json({ message: 'Course is not archived' }, { status: 400 });
    }

    // Restore the course
    course.isArchived = false;
    await course.save();

    return NextResponse.json({ message: 'Course restored successfully' });
  } catch (error) {
    console.error('Restore Course Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}