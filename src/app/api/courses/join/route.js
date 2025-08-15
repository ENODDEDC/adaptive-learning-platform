import connectMongoDB from '@/lib/mongodb';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();
    const { courseKey } = await request.json();

    const course = await Course.findOne({ uniqueKey: courseKey });

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    if (course.createdBy.toString() === userId) {
      return NextResponse.json({ message: 'You are the creator of this course' }, { status: 400 });
    }

    if (course.enrolledUsers.includes(userId)) {
      return NextResponse.json({ message: 'You are already enrolled in this course' }, { status: 400 });
    }

    course.enrolledUsers.push(userId);
    await course.save();

    return NextResponse.json({ message: 'Successfully joined course', course }, { status: 200 });

  } catch (error) {
    console.error('Join Course Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}