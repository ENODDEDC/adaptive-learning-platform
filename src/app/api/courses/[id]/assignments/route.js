import connectMongoDB from '@/config/mongoConfig';
import Assignment from '@/models/Assignment';
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

    const { id: courseId } = params;
    const { title, description, dueDate, type, attachments } = await request.json();

    await connectMongoDB();

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Only the course creator can post assignments
    if (course.createdBy.toString() !== userId) {
      return NextResponse.json({ message: 'Forbidden: Only instructors can create classwork' }, { status: 403 });
    }

    const newAssignment = await Assignment.create({
      courseId,
      title,
      description,
      dueDate,
      type,
      postedBy: userId,
      attachments,
    });

    return NextResponse.json({ message: 'Classwork created', assignment: newAssignment }, { status: 201 });
  } catch (error) {
    console.error('Create Classwork Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    const { id: courseId } = params;
    await connectMongoDB();

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Check if the user is either the creator or enrolled in the course
    const isCreator = course.createdBy.toString() === userId;
    const isEnrolled = course.enrolledUsers.includes(userId);

    if (!isCreator && !isEnrolled) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const assignments = await Assignment.find({ courseId })
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Get Classwork Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}