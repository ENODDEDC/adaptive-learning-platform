import connectMongoDB from '@/config/mongoConfig';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function PUT(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const { id } = params;
    const { title, description, dueDate, type, attachments } = await request.json();

    const classwork = await Assignment.findById(id);
    if (!classwork) {
      return NextResponse.json({ message: 'Classwork not found' }, { status: 404 });
    }

    // Verify that the user is the creator or a co-teacher of the course
    const course = await Course.findById(classwork.courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // TODO: Implement co-teacher check once coTeachers field is added to Course model
    if (course.createdBy.toString() !== userId) {
        return NextResponse.json({ message: 'Forbidden: Only course creator can update classwork' }, { status: 403 });
    }

    // Ensure attachments are sent as an array of ObjectIds
    const attachmentIds = attachments.map(att => att._id || att);

    const updatedClasswork = await Assignment.findByIdAndUpdate(
      id,
      {
        title,
        description,
        dueDate,
        type,
        attachments: attachmentIds
      },
      { new: true }
    );

    return NextResponse.json({ message: 'Classwork updated', classwork: updatedClasswork }, { status: 200 });
  } catch (error) {
    console.error('Update Classwork Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const { id } = params;

    const classwork = await Assignment.findById(id);
    if (!classwork) {
      return NextResponse.json({ message: 'Classwork not found' }, { status: 404 });
    }

    // Verify that the user is the creator or a co-teacher of the course
    const course = await Course.findById(classwork.courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // TODO: Implement co-teacher check once coTeachers field is added to Course model
    if (course.createdBy.toString() !== userId) {
        return NextResponse.json({ message: 'Forbidden: Only course creator can delete classwork' }, { status: 403 });
    }

    await Assignment.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Classwork deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete Classwork Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
