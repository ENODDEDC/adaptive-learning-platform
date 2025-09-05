import connectMongoDB from '@/config/mongoConfig';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/services/authService';

export async function POST(request, { params }) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();
    const { id } = params;
    const { title, description, dueDate, type, attachments } = await request.json();

    if (!id || !title || !type) {
      return NextResponse.json({ message: 'Course ID, title, and type are required' }, { status: 400 });
    }

    // Verify that the user is the creator or a co-teacher of the course
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // TODO: Implement co-teacher check once coTeachers field is added to Course model
    if (course.createdBy.toString() !== userId) {
        return NextResponse.json({ message: 'Forbidden: Only course creator can add classwork' }, { status: 403 });
    }

    const newClasswork = await Assignment.create({
      courseId: id,
      title,
      description,
      dueDate,
      postedBy: userId,
      type,
      attachments,
    });

    return NextResponse.json({ message: 'Classwork created', classwork: newClasswork }, { status: 201 });
  } catch (error) {
    console.error('Create Classwork Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    // Verify user has access to the course (enrolled or creator/co-teacher)
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // TODO: Implement co-teacher check once coTeachers field is added to Course model
    const isEnrolled = course.enrolledUsers.some(id => id.toString() === userId);
    if (course.createdBy.toString() !== userId && !isEnrolled) {
      return NextResponse.json({ message: 'Forbidden: User not authorized to view this course\'s classwork' }, { status: 403 });
    }

    const classwork = await Assignment.find({ courseId: id }).sort({ dueDate: -1, createdAt: -1 });

    return NextResponse.json({ classwork }, { status: 200 });
  } catch (error) {
    console.error('Get Classwork Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
